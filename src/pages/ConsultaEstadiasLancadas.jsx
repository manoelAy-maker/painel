import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { linkWhatsapp, dataISOTexto, tempoDecorrido } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import { arquivarEstadiaLancada } from '../lib/ayresSafety'
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

function statusLabel(s) {
  return s || 'Aberto'
}

function parseValor(valor) {
  const n = String(valor || '').replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
  return Number(n) || 0
}

function tempoParadoTexto(e) {
  const horas = Number(String(e.horas || '0').replace(',', '.')) || 0
  return `${horas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}h`
}

function tempoParadoClasse(e) {
  const horas = Number(String(e.horas || '0').replace(',', '.')) || 0
  if (horas > 24) return 'danger'
  if (horas > 12) return 'warn'
  return 'ok'
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


function excelEscape(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function dataExcel(valor) {
  if (!valor) return ''
  const d = new Date(valor)
  if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('pt-BR')
  const txt = String(valor)
  if (/^\d{4}-\d{2}-\d{2}$/.test(txt)) {
    const [ano, mes, dia] = txt.split('-')
    return `${dia}/${mes}/${ano}`
  }
  return txt
}

function horaExcel(data, hora) {
  const d = dataExcel(data)
  return [d, hora].filter(Boolean).join(' ')
}

function baixarPlanilhaEstadias(lista) {
  const colunas = [
    ['NF', e => e.nf || e.numeroNf || ''],
    ['CT-e', e => e.cte || ''],
    ['MOTORISTA', e => e.motorista || ''],
    ['PLACA', e => e.placa || ''],
    ['TRANSPORTADORA', e => e.transportadora || ''],
    ['ORIGEM / LOCAL', e => e.localEstadia || ''],
    ['FILIAL', e => nomeFilial(e.filial)],
    ['PRODUTO / PLATAFORMA', e => e.plataforma || ''],
    ['PESO (KG)', e => e.peso || ''],
    ['CHEGADA', e => horaExcel(e.chegadaData, e.chegadaHora)],
    ['SAÍDA / DESCARGA', e => horaExcel(e.saidaData, e.saidaHora)],
    ['FRANQUIA', e => e.franquia ? `${e.franquia}:00` : '12:00'],
    ['HORAS A PAGAR', e => e.horasPagar || e.horas || e.totalHoras || ''],
    ['FATOR', e => e.valorHora || '0,80'],
    ['VALOR', e => e.valor || e.valorCalculado || ''],
    ['DATA LANÇAMENTO', e => dataExcel(e.dataLancamento)],
    ['CHAMADO', e => e.chamado || ''],
    ['STATUS', e => statusLabel(e.status)],
    ['OBSERVAÇÃO / CONTROLE', e => e.obs || ''],
    ['RESPONSÁVEL', e => e.finalizadoPor || e.feitoPor || e.emAnalisePor || e.lancadoPor || ''],
  ]

  const cabecalho = colunas.map(([titulo]) => `<th>${excelEscape(titulo)}</th>`).join('')
  const linhas = lista.map(e => {
    const classe = e.status === 'Finalizado' || e.status === 'Feito' ? 'linha-ok' : 'linha-pendente'
    return `<tr class="${classe}">${colunas.map(([, obter]) => `<td>${excelEscape(obter(e))}</td>`).join('')}</tr>`
  }).join('')

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #222; padding: 4px 8px; white-space: nowrap; vertical-align: middle; }
  th { background: #d9e1f2; font-weight: 700; text-align: center; }
  td { min-width: 92px; }
  td:nth-child(3), td:nth-child(5), td:nth-child(18), td:nth-child(19) { min-width: 210px; }
  .linha-ok td { background: #70ad47; }
  .linha-pendente td { background: #ffc7ce; }
  .linha-ok td:nth-child(-n+17), .linha-pendente td:nth-child(-n+17) { background: #fff; }
</style>
</head>
<body>
<table>
<thead><tr>${cabecalho}</tr></thead>
<tbody>${linhas}</tbody>
</table>
</body>
</html>`

  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const hoje = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `estadias-ayres-${hoje}.xls`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function ConsultaEstadiasLancadas({ visaoInicial = 'andamento' }) {
  const { estadias, editarLancada, excluirLancada, filiais, mudarAba, usuarioAtual, toast } = useApp()
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [detalhe, setDetalhe] = useState(null)
  const [visao, setVisao] = useState(visaoInicial)

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
      if (status === 'Finalizado') setVisao('finalizadas')
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

  const proximaAcao = (e) => {
    if (!e.status || e.status === 'Aberto') return { label: 'Analisar', status: 'Em análise', classe: 'warn' }
    if (e.status === 'Em análise') return { label: 'Marcar feito', status: 'Feito', classe: 'ok' }
    if (e.status === 'Feito') return { label: 'Finalizar', status: 'Finalizado', classe: 'done' }
    return null
  }

  const exportarExcel = () => {
    if (!listaFiltrada.length) {
      toast?.('Não há estadias para exportar com os filtros atuais.', 'warn')
      return
    }
    baixarPlanilhaEstadias(listaFiltrada)
    toast?.(`Planilha gerada com ${listaFiltrada.length} estadia(s).`, 'ok')
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
          <button className="consulta-pro-light" onClick={exportarExcel}>📊 Exportar Excel padrão</button>
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
          const acao = proximaAcao(e)
          return (
            <article key={e.id} className="consulta-pro-card">
              <div className="consulta-pro-main">
                <div className="consulta-pro-topline">
                  <span className="consulta-pro-plate">{e.placa || '-'}</span>
                  <span className={`status ${classeStatus(e.status)}`}>{statusLabel(e.status)}</span>
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
                  {acao && <button className={`consulta-pro-action ${acao.classe}`} onClick={() => atualizarStatus(e, acao.status)}>{acao.label}</button>}
                  {e.status !== 'Aberto' && <button className="consulta-pro-light small" onClick={() => atualizarStatus(e, 'Aberto')}>Reabrir</button>}
                  <button className="consulta-pro-light small" onClick={() => setDetalhe(e)}>Detalhes</button>
                  <button className="consulta-pro-light small" onClick={() => editar(e)}>Editar</button>
                  <button className="consulta-pro-light small" onClick={() => copiar(e)}>Copiar</button>
                  {e.telefoneMotorista && <a className="consulta-pro-whats" href={linkWhatsapp(e)} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
                  <button className="consulta-pro-danger small" onClick={() => arquivar(e)}>Arquivar</button>
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
