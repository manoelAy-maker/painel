import { useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { linkWhatsapp, dataISOTexto, tempoDecorrido } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import { arquivarEstadiaLancada } from '../lib/ayresSafety'
import EstadiaActionMenu from '../components/EstadiaActionMenu'
import { prepararEstadiaPaga, prepararReaberturaEstadia, estadiaPagamentoConfirmado } from '../modules/estadia/services/estadiaPagamento'
import { statusEstadiaTexto, tempoParadoTexto, tempoParadoClasse } from '../modules/estadia/services/estadiaDisplay'
import '../estadia-desktop-pro.css'
import '../consulta-estadias-pro.css'

function classePrio(p) {
  if (p === 'Urgente') return 'prio-urgente'
  if (p === 'Média') return 'prio-media'
  return 'prio-normal'
}

function classeStatus(s) {
  if (s === 'Finalizado') return 'status-finalizado'
  if (s === 'Feito') return 'status-feito'
  if (s === 'Em análise') return 'status-feito'
  return 'status-aberto'
}

function parseValor(valor) {
  const n = String(valor || '').replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
  return Number(n) || 0
}

function dataLocalISO(date = new Date()) {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function resumoEstadia(e) {
  return [
    `Placa: ${e.placa || '-'}`,
    `Motorista: ${e.motorista || '-'}`,
    `NF: ${e.nf || e.numeroNf || '-'}`,
    `Chamado: ${e.chamado || '-'}`,
    `Transportadora: ${e.transportadora || '-'}`,
    `Status: ${statusEstadiaTexto(e)}`,
    `Valor: ${e.valor || 'R$ 0,00'}`,
  ].join('\n')
}

export default function ConsultaEstadiasLancadas({ visaoInicial = 'andamento' }) {
  const { estadias, atualizarLancada, excluirLancada, filiais, mudarAba, usuarioAtual, toast } = useApp()
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [detalhe, setDetalhe] = useState(null)
  const [visao, setVisao] = useState(visaoInicial)
  const [salvandoIds, setSalvandoIds] = useState(() => new Set())
  const salvandoRef = useRef(new Set())

  const listaFiltrada = useMemo(() => estadias.filter(e => {
    const txt = ((e.placa || '') + ' ' + (e.motorista || '') + ' ' + (e.chamado || '') + ' ' + (e.transportadora || '') + ' ' + (e.nf || e.numeroNf || '')).toUpperCase()
    const data = dataISOTexto(e.dataLancamento)
    return (!busca || txt.includes(busca.toUpperCase()))
      && (!filtroStatus || e.status === filtroStatus)
      && (!filtroFilial || e.filial === filtroFilial)
      && (!dataInicio || data >= dataInicio)
      && (!dataFim || data <= dataFim)
  }), [estadias, busca, filtroStatus, filtroFilial, dataInicio, dataFim])

  const lista = useMemo(() => listaFiltrada.filter(e => {
    const finalizada = e.status === 'Finalizado'
    return visao === 'finalizadas' ? finalizada : !finalizada
  }), [listaFiltrada, visao])

  const stats = useMemo(() => {
    const totalValor = listaFiltrada.reduce((acc, e) => acc + parseValor(e.valor), 0)
    return {
      total: listaFiltrada.length,
      abertas: listaFiltrada.filter(e => !e.status || e.status === 'Aberto').length,
      analise: listaFiltrada.filter(e => e.status === 'Em análise').length,
      feitas: listaFiltrada.filter(e => e.status === 'Feito').length,
      andamento: listaFiltrada.filter(e => e.status !== 'Finalizado').length,
      finalizadas: listaFiltrada.filter(e => e.status === 'Finalizado').length,
      valor: totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    }
  }, [listaFiltrada])

  const limpar = () => {
    setBusca('')
    setFiltroStatus('')
    setFiltroFilial('')
    setDataInicio('')
    setDataFim('')
  }

  const editar = (e) => {
    localStorage.setItem('editarEstadiaLancadaId', String(e.id))
    mudarAba('lancadas')
  }

  const salvarEstado = async (e, dados, mensagem) => {
    const id = String(e.id)
    if (salvandoRef.current.has(id)) return
    salvandoRef.current.add(id)
    setSalvandoIds(previous => new Set(previous).add(id))
    try {
      const resultado = await atualizarLancada(e.id, dados)
      setDetalhe(current => current && String(current.id) === id ? dados : current)
      if (resultado?.sincronizado === false) {
        toast?.(`${mensagem} Salva neste aparelho; sincronização pendente.`, 'warn')
      } else {
        toast?.(mensagem, 'ok')
      }
    } catch {
      toast?.('Não consegui salvar a alteração da estadia. Tente novamente.', 'err')
    } finally {
      salvandoRef.current.delete(id)
      setSalvandoIds(previous => { const next = new Set(previous); next.delete(id); return next })
    }
  }

  const marcarPago = e => {
    if (e.status === 'Finalizado') return
    return salvarEstado(e, prepararEstadiaPaga(e, usuarioAtual?.usuario), 'Marcada como paga e finalizada.')
  }

  const reabrir = e => salvarEstado(e, prepararReaberturaEstadia(e, usuarioAtual?.usuario), 'Estadia reaberta.')

  const arquivar = async (e) => {
    if (!confirm(`Arquivar a estadia da placa ${e.placa || '-'}? Ela sairá da consulta e ficará na Lixeira.`)) return
    try {
      await arquivarEstadiaLancada(e, usuarioAtual?.usuario || '-', 'Arquivada pela consulta de estadias lançadas')
      await excluirLancada(e.id)
      toast?.('Estadia arquivada na Lixeira.', 'ok')
    } catch {
      toast?.('Não consegui arquivar. Verifique o Supabase/Lixeira.', 'err')
    }
  }

  const copiar = async (e) => {
    try {
      await navigator.clipboard.writeText(resumoEstadia(e))
      toast?.('Resumo copiado.', 'ok')
    } catch {
      toast?.('Não consegui copiar neste navegador.', 'warn')
    }
  }

  const periodoHoje = () => {
    const hoje = dataLocalISO()
    setDataInicio(hoje)
    setDataFim(hoje)
  }

  const ultimos7 = () => {
    const fim = new Date()
    const ini = new Date()
    ini.setDate(fim.getDate() - 6)
    setDataInicio(dataLocalISO(ini))
    setDataFim(dataLocalISO(fim))
  }

  const esteMes = () => {
    const hoje = new Date()
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    setDataInicio(dataLocalISO(ini))
    setDataFim(dataLocalISO(hoje))
  }

  return (
    <section className="aba active consulta-pro" id="abaConsultaLancadas">
      <div className="consulta-pro-head">
        <div>
          <span>Controle de estadias</span>
          <h2>{visao === 'finalizadas' ? 'Estadias finalizadas' : 'Estadias em andamento'}</h2>
          <p>{visao === 'finalizadas' ? 'Histórico das estadias que já foram finalizadas.' : 'Fila de estadias abertas, em análise ou feitas.'}</p>
        </div>
        <div className="consulta-pro-head-actions">
          <button className="consulta-pro-primary" onClick={() => mudarAba('lancadas')}>+ Lançar nova</button>
          <button className="consulta-pro-light" onClick={limpar}>Limpar filtros</button>
        </div>
      </div>

      <div className="consulta-pro-tabs">
        <button className={visao === 'andamento' ? 'active' : ''} onClick={() => setVisao('andamento')}>Em andamento <b>{stats.andamento}</b></button>
        <button className={visao === 'finalizadas' ? 'active' : ''} onClick={() => setVisao('finalizadas')}>Finalizadas <b>{stats.finalizadas}</b></button>
      </div>

      <div className="consulta-pro-kpis">
        <div><span>Total filtrado</span><strong>{stats.total}</strong></div>
        <div><span>Abertas</span><strong>{stats.abertas}</strong></div>
        <div><span>Em análise</span><strong>{stats.analise}</strong></div>
        <div><span>Feitas</span><strong>{stats.feitas}</strong></div>
        <div><span>Finalizadas</span><strong>{stats.finalizadas}</strong></div>
        <div className="money"><span>Valor total</span><strong>{stats.valor}</strong></div>
      </div>

      <div className="consulta-pro-filters">
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar placa, motorista, chamado ou NF..." />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option value="">Todos status</option><option>Aberto</option><option>Em análise</option><option>Feito</option><option>Finalizado</option></select>
        <select value={filtroFilial} onChange={e => setFiltroFilial(e.target.value)}><option value="">Todas as filiais</option>{filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
        <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        <div className="consulta-pro-periods">
          <button onClick={periodoHoje}>Hoje</button>
          <button onClick={ultimos7}>7 dias</button>
          <button onClick={esteMes}>Mês</button>
        </div>
      </div>

      <div className="consulta-pro-list">
        {lista.length === 0 && <div className="consulta-pro-empty">{visao === 'finalizadas' ? 'Nenhuma estadia finalizada encontrada.' : 'Nenhuma estadia em andamento encontrada.'}</div>}

        {lista.map(e => {
          const salvando = salvandoIds.has(String(e.id))
          return (
            <article key={e.id} className="consulta-pro-card" aria-busy={salvando}>
              <div className="consulta-pro-main">
                <div className="consulta-pro-topline">
                  <span className="consulta-pro-plate">{e.placa || '-'}</span>
                  <span className={`status ${classeStatus(e.status)}`}>{estadiaPagamentoConfirmado(e) ? 'Pago' : statusEstadiaTexto(e)}</span>
                  <span className={`prio ${classePrio(e.prioridade)}`}>{e.prioridade || 'Normal'}</span>
                </div>
                <h3>{e.motorista || 'Motorista não informado'}</h3>
                <div className="consulta-pro-meta">
                  <span>NF <b>{e.nf || e.numeroNf || '-'}</b></span>
                  <span>Chamado <b>{e.chamado || '-'}</b></span>
                  <span>{e.transportadora || 'Transportadora não informada'}</span>
                </div>
              </div>

              <div className="consulta-pro-data">
                <div><span>Valor</span><strong>{e.valor || 'R$ 0,00'}</strong></div>
                <div><span>Tempo parado</span><strong className={tempoParadoClasse(e)}>{tempoParadoTexto(e)}</strong></div>
                <div><span>Filial</span><strong>{nomeFilial(e.filial)}</strong></div>
                <div><span>Lançada há</span><strong>{tempoDecorrido(e.dataLancamento)}</strong></div>
              </div>

              <div className="consulta-pro-side">
                <div className="consulta-pro-owner">
                  <span>Lançado por</span>
                  <strong>{e.lancadoPor || '-'}</strong>
                </div>
                <div className="consulta-pro-actions">
                  {e.status !== 'Finalizado' && <button type="button" className="consulta-pro-action pago" disabled={salvando} onClick={() => marcarPago(e)}>{salvando ? 'Salvando...' : 'Pago'}</button>}
                  <button type="button" className="consulta-pro-light small" onClick={() => setDetalhe(e)}>Detalhes</button>
                  <EstadiaActionMenu disabled={salvando} items={[
                    e.status && e.status !== 'Aberto' && { label: 'Reabrir', onClick: () => reabrir(e) },
                    { label: 'Editar', onClick: () => editar(e) },
                    { label: 'Copiar', onClick: () => copiar(e) },
                    e.telefoneMotorista && { label: 'WhatsApp', href: linkWhatsapp(e) },
                    { label: 'Arquivar', danger: true, onClick: () => arquivar(e) },
                  ]} />
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {detalhe && <div className="consulta-modal-backdrop" onClick={() => setDetalhe(null)}>
        <div className="consulta-modal" onClick={e => e.stopPropagation()}>
          <div className="box-title">
            <div>
              <h2>{detalhe.placa || 'Estadia'}</h2>
              <span>{detalhe.motorista || '-'} · {estadiaPagamentoConfirmado(detalhe) ? 'Pago · Finalizado' : statusEstadiaTexto(detalhe)}</span>
            </div>
            <button className="btn-light btn-small" onClick={() => setDetalhe(null)}>Fechar</button>
          </div>
          <div className="consulta-detail-grid">
            <div><small>NF</small><strong>{detalhe.nf || detalhe.numeroNf || '-'}</strong></div>
            <div><small>Chamado</small><strong>{detalhe.chamado || '-'}</strong></div>
            <div><small>Transportadora</small><strong>{detalhe.transportadora || '-'}</strong></div>
            <div><small>Filial</small><strong>{nomeFilial(detalhe.filial)}</strong></div>
            <div><small>Peso</small><strong>{detalhe.peso || '-'}</strong></div>
            <div><small>Horas</small><strong>{detalhe.horas || '0.00'} h</strong></div>
            <div><small>Valor</small><strong>{detalhe.valor || 'R$ 0,00'}</strong></div>
            <div><small>Pago por</small><strong>{detalhe.pagoPor || 'Logística'}</strong></div>
          </div>
          {estadiaPagamentoConfirmado(detalhe) && <p className="consulta-pagamento-info">Pagamento confirmado por {detalhe.pagamentoConfirmadoPor || detalhe.finalizadoPor || '-'} em {detalhe.dataPagamentoConfirmado || detalhe.dataFinalizado || '-'}.</p>}
          <div className="consulta-modal-section">
            <h3>Histórico da estadia</h3>
            {detalhe.historicoItem?.length ? detalhe.historicoItem.map((h, i) => <div key={i} className="consulta-history-item"><strong>{h.acao}</strong><small>{h.usuario} · {h.data}</small>{h.detalhes && <small>{h.detalhes}</small>}</div>) : <p>Sem histórico interno ainda.</p>}
          </div>
          {detalhe.anexos?.length > 0 && <div className="consulta-modal-section">
            <h3>Anexos</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{detalhe.anexos.map((a, i) => <a key={i} className="anexo-link" href={a.url} target="_blank" rel="noopener noreferrer">📄 {a.nome || `Arquivo ${i + 1}`}</a>)}</div>
          </div>}
        </div>
      </div>}
    </section>
  )
}
