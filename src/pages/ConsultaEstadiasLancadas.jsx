import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { linkWhatsapp, dataISOTexto, tempoDecorrido } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import { arquivarEstadiaLancada } from '../lib/ayresSafety'
import '../estadia-desktop-pro.css'

function badgePago(p) {
  return p === 'Transportes'
    ? <span className="badge badge-transportes">Transportes</span>
    : <span className="badge badge-logistica">Logística</span>
}

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

function statusLabel(s) {
  return s || 'Aberto'
}

function TempoInfo({ label, data, compacto = false }) {
  return (
    <div className={`tempo-info ${compacto ? 'tempo-compacto' : ''}`}>
      <strong>{tempoDecorrido(data)}</strong>
      <small>{label}</small>
    </div>
  )
}

function parseValor(valor) {
  const n = String(valor || '').replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
  return Number(n) || 0
}

function tempoParado(e) {
  const horas = Number(String(e.horas || '0').replace(',', '.')) || 0
  const style = horas > 24
    ? { color: '#fecaca', background: 'rgba(239,68,68,.14)', borderColor: 'rgba(248,113,113,.28)' }
    : horas > 12
      ? { color: '#fde68a', background: 'rgba(245,158,11,.14)', borderColor: 'rgba(251,191,36,.28)' }
      : { color: '#bbf7d0', background: 'rgba(34,197,94,.13)', borderColor: 'rgba(74,222,128,.26)' }
  return <span className="badge" style={style}>{horas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}h</span>
}

function agoraHistorico() {
  return new Date().toLocaleString('pt-BR')
}

function eventoHistorico(acao, usuario, detalhes = '') {
  return { data: agoraHistorico(), usuario: usuario || '-', acao, detalhes }
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
    `Status: ${statusLabel(e.status)}`,
    `Valor: ${e.valor || 'R$ 0,00'}`,
  ].join('\n')
}

export default function ConsultaEstadiasLancadas() {
  const { estadias, editarLancada, excluirLancada, filiais, mudarAba, usuarioAtual, toast } = useApp()
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [detalhe, setDetalhe] = useState(null)

  const lista = useMemo(() => estadias.filter(e => {
    const txt = ((e.placa || '') + ' ' + (e.motorista || '') + ' ' + (e.chamado || '') + ' ' + (e.transportadora || '') + ' ' + (e.nf || e.numeroNf || '')).toUpperCase()
    const data = dataISOTexto(e.dataLancamento)
    return (!busca || txt.includes(busca.toUpperCase()))
      && (!filtroStatus || e.status === filtroStatus)
      && (!filtroFilial || e.filial === filtroFilial)
      && (!dataInicio || data >= dataInicio)
      && (!dataFim || data <= dataFim)
  }), [estadias, busca, filtroStatus, filtroFilial, dataInicio, dataFim])

  const stats = useMemo(() => {
    const totalValor = lista.reduce((acc, e) => acc + parseValor(e.valor), 0)
    return {
      total: lista.length,
      abertas: lista.filter(e => !e.status || e.status === 'Aberto').length,
      analise: lista.filter(e => e.status === 'Em análise').length,
      feitas: lista.filter(e => e.status === 'Feito').length,
      finalizadas: lista.filter(e => e.status === 'Finalizado').length,
      valor: totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    }
  }, [lista])

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

  const atualizarStatus = async (e, status) => {
    const campoUsuario = status === 'Feito' ? 'feitoPor' : status === 'Finalizado' ? 'finalizadoPor' : status === 'Em análise' ? 'emAnalisePor' : 'reabertoPor'
    const campoData = status === 'Feito' ? 'dataFeito' : status === 'Finalizado' ? 'dataFinalizado' : status === 'Em análise' ? 'dataAnalise' : 'dataReabertura'
    const dados = {
      ...e,
      status,
      [campoUsuario]: usuarioAtual?.usuario || '-',
      [campoData]: agoraHistorico(),
      historicoItem: [
        eventoHistorico(`Mudou status para ${status}`, usuarioAtual?.usuario, `Placa ${e.placa || '-'}`),
        ...(e.historicoItem || []),
      ].slice(0, 20),
    }

    if (status === 'Aberto') {
      dados.feitoPor = ''
      dados.finalizadoPor = ''
      dados.emAnalisePor = ''
    }

    try {
      await editarLancada(e.id, dados)
      toast?.(`Status alterado para ${status}.`, 'ok')
    } catch {
      toast?.('Não consegui alterar o status dessa estadia.', 'err')
    }
  }

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
    <section className="aba active" id="abaConsultaLancadas">
      <div className="box estadia-filter-box">
        <div className="box-title">
          <div>
            <h2>Estadias lançadas</h2>
            <span>Consulta separada do lançamento, com indicadores, filtros, status, detalhes rápidos e histórico por estadia.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-green btn-small" onClick={() => mudarAba('lancadas')}>+ Lançar nova</button>
            <button className="btn-light btn-small" onClick={limpar}>Limpar filtros</button>
          </div>
        </div>

        <div className="calc-preview estadia-calc-preview" style={{ marginBottom: 16 }}>
          <div className="preview-card"><span>Total filtrado</span><strong>{stats.total}</strong></div>
          <div className="preview-card"><span>Abertas</span><strong>{stats.abertas}</strong></div>
          <div className="preview-card"><span>Em análise</span><strong>{stats.analise}</strong></div>
          <div className="preview-card"><span>Feitas</span><strong>{stats.feitas}</strong></div>
          <div className="preview-card"><span>Finalizadas</span><strong>{stats.finalizadas}</strong></div>
          <div className="preview-card"><span>Valor total</span><strong>{stats.valor}</strong></div>
        </div>

        <div className="filters estadia-filters">
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar placa, motorista, chamado, NF..." />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option value="">Todos status</option><option>Aberto</option><option>Em análise</option><option>Feito</option><option>Finalizado</option></select>
          <select value={filtroFilial} onChange={e => setFiltroFilial(e.target.value)}><option value="">Todas as filiais</option>{filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="btn-light btn-small" onClick={periodoHoje}>Hoje</button>
          <button className="btn-light btn-small" onClick={ultimos7}>Últimos 7 dias</button>
          <button className="btn-light btn-small" onClick={esteMes}>Este mês</button>
        </div>
      </div>

      <div className="table-wrap estadia-table-wrap">
        <div className="table-scroll">
          <table>
            <thead><tr><th>NF</th><th>Chamado</th><th>Motorista</th><th>Transportadora</th><th>Placa</th><th>Peso</th><th>Tempo parado</th><th>Valor</th><th>Pago por</th><th>Prioridade</th><th>Filial</th><th>Anexos</th><th>Lançado por</th><th>Lançada há</th><th>Status</th><th>Histórico</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.length === 0
                ? <tr><td colSpan={17} className="empty">Nenhuma estadia encontrada.</td></tr>
                : lista.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.nf || e.numeroNf || '-'}</strong></td>
                    <td><strong>{e.chamado || '-'}</strong><br /><small>{e.dataLancamento || ''}</small></td>
                    <td>{e.motorista || '-'}<br /><small>Chegada: {e.chegada || '-'}<br />Saída: {e.saida || '-'}</small></td>
                    <td>{e.transportadora || '-'}</td>
                    <td><span className="plate">{e.placa || '-'}</span><br /><TempoInfo label="lançada há" data={e.dataLancamento} compacto /></td>
                    <td>{e.peso || '-'}</td>
                    <td>{tempoParado(e)}</td>
                    <td><strong>{e.valor || 'R$ 0,00'}</strong></td>
                    <td>{badgePago(e.pagoPor)}</td>
                    <td><span className={`prio ${classePrio(e.prioridade)}`}>{e.prioridade || 'Normal'}</span></td>
                    <td><span className="badge badge-logistica">{nomeFilial(e.filial)}</span></td>
                    <td>{e.anexos?.length ? e.anexos.map((a, i) => <a key={i} className="anexo-link" href={a.url} target="_blank" rel="noopener noreferrer">📄 {a.nome || `Arquivo ${i + 1}`}</a>) : '-'}</td>
                    <td>{e.lancadoPor || '-'}</td>
                    <td><TempoInfo label="desde o lançamento" data={e.dataLancamento} /></td>
                    <td><span className={`status ${classeStatus(e.status)}`}>{statusLabel(e.status)}</span>{e.emAnalisePor && <><br /><small>Análise por {e.emAnalisePor}</small></>}{e.feitoPor && <><br /><small>Feito por {e.feitoPor}</small></>}{e.finalizadoPor && <><br /><small>Finalizado por {e.finalizadoPor}</small></>}</td>
                    <td>{e.historicoItem?.length ? <details><summary>Ver</summary><div style={{ minWidth: 220 }}>{e.historicoItem.slice(0, 5).map((h, i) => <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.08)', padding: '6px 0' }}><strong>{h.acao}</strong><br /><small>{h.usuario} · {h.data}</small>{h.detalhes && <><br /><small>{h.detalhes}</small></>}</div>)}</div></details> : <small>Sem histórico interno</small>}</td>
                    <td><div className="actions">
                      <button className="btn-light btn-small" onClick={() => setDetalhe(e)}>Detalhes</button>
                      {(!e.status || e.status === 'Aberto') && <button className="btn-orange btn-small" onClick={() => atualizarStatus(e, 'Em análise')}>Em análise</button>}
                      {e.status !== 'Feito' && e.status !== 'Finalizado' && <button className="btn-green btn-small" onClick={() => atualizarStatus(e, 'Feito')}>Feito</button>}
                      {e.status === 'Feito' && <button className="btn-purple btn-small" onClick={() => atualizarStatus(e, 'Finalizado')}>Finalizar</button>}
                      {e.status !== 'Aberto' && <button className="btn-orange btn-small" onClick={() => atualizarStatus(e, 'Aberto')}>Reabrir</button>}
                      <button className="btn-light btn-small" onClick={() => editar(e)}>Editar</button>
                      <button className="btn-light btn-small" onClick={() => copiar(e)}>Copiar</button>
                      {e.telefoneMotorista && <a className="btn btn-green btn-small" href={linkWhatsapp(e)} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
                      <button className="btn-red btn-small" onClick={() => arquivar(e)}>Arquivar</button>
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {detalhe && <div className="consulta-modal-backdrop" onClick={() => setDetalhe(null)}>
        <div className="consulta-modal" onClick={e => e.stopPropagation()}>
          <div className="box-title">
            <div>
              <h2>{detalhe.placa || 'Estadia'}</h2>
              <span>{detalhe.motorista || '-'} · {statusLabel(detalhe.status)}</span>
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
