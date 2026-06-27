import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../../context/AppContext'
import { gerarId } from '../../../utils/index'
import { podeAdministrar } from '../../../utils/roles'
import { getClient } from '../../../lib/supabase'
import './controle-embarque.css'

const LOTES_KEY = 'controleEmbarqueLotesViaLog'
const LINHAS_KEY = 'controleEmbarqueLinhasViaLog'
const T_LOTES = 'vl_embarque_lotes'
const T_LINHAS = 'vl_embarques'

const STATUS = {
  agendado: { label: 'AG. CARREGAMENTO', classe: 'agendado' },
  carregado: { label: 'CARREGADO', classe: 'carregado' },
  cancelado: { label: 'CANCELADO', classe: 'cancelado' },
}

const LOTE_VAZIO = { produto: 'SOJA', origem: '', destino: '', lote: '', pesoLote: '', cadencia: '10' }
const LINHA_VAZIA = { cota: '', placa: '', peso: '', ordem: true, cte: true, transportadora: '', responsavel: '', status: 'agendado', seguradora: 'APROVADO', chamadoMdfe: '', motorista: '', telefone: '', observacao: '' }

const limparNumero = (v) => String(v || '').replace(/[^0-9]/g, '')
const placaLimpa = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
const moedaPeso = (v) => String(v || '').replace(',', '.').replace(/[^0-9.]/g, '')
const hojeISO = () => new Date().toISOString().slice(0, 10)
const dataBR = (iso) => iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''
const normalizar = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function ler(key, fallback = []) { try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback } }
function gravar(key, valor) { localStorage.setItem(key, JSON.stringify(valor)) }
function numeroPeso(v) { const n = Number(moedaPeso(v)); return Number.isFinite(n) ? n : 0 }
function formatarPeso(v) { const n = Number(v || 0); return Number.isFinite(n) && n ? n.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '' }
function formatarTelefone(v) { const n = limparNumero(v).slice(0, 11); if (n.length <= 2) return n; if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`; return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}` }
function addDias(iso, delta) { const d = new Date(`${iso || hojeISO()}T12:00:00`); d.setDate(d.getDate() + delta); return d.toISOString().slice(0, 10) }
function diasDoLote(linhas, loteId, diaBase) {
  const dias = new Set([hojeISO(), diaBase || hojeISO()])
  linhas.filter(l => String(l.loteId) === String(loteId)).forEach(l => { if (l.dia) dias.add(l.dia) })
  return [...dias].sort()
}

function loteRowToItem(row) {
  const dados = row.dados || {}
  return {
    id: row.local_id || row.id,
    produto: row.produto || dados.produto || 'SOJA',
    origem: row.origem || '',
    destino: row.destino || '',
    lote: row.lote || '',
    pesoLote: row.peso_lote ? formatarPeso(row.peso_lote) : (dados.pesoLote || ''),
    cadencia: String(row.cadencia || dados.cadencia || 0),
    dataInicio: row.data_inicio || dados.dataInicio || hojeISO(),
    filial: row.filial_id || dados.filial || 'jatai-go',
    criadoPor: row.criado_por || dados.criadoPor || '-',
    status: row.status || 'ativo',
  }
}
function linhaRowToItem(row) {
  const dados = row.dados || {}
  return {
    id: row.local_id || row.id,
    loteId: row.lote_local_id || dados.loteId || '',
    dia: row.data_operacao || dados.dia || hojeISO(),
    cota: row.cota || dados.cota || '',
    placa: row.placa || '',
    peso: row.peso ? formatarPeso(row.peso) : '',
    ordem: String(row.ordem_carregamento || dados.ordem || '').toUpperCase() === 'X' || row.ordem_carregamento === true,
    cte: String(row.cte || dados.cte || '').toUpperCase() === 'X' || row.cte === true,
    transportadora: row.transportadora || '',
    responsavel: dados.responsavel || '',
    status: row.status || 'agendado',
    seguradora: dados.seguradora || 'APROVADO',
    chamadoMdfe: dados.chamadoMdfe || row.ordem_carregamento || '',
    motorista: row.motorista || '', telefone: row.telefone || '', observacao: row.observacao || '', filial: row.filial_id || dados.filial || 'jatai-go',
  }
}
function lotePayload(lote, usuarioAtual) {
  const filial = lote.filial || usuarioAtual?.filial || 'jatai-go'
  return { local_id: String(lote.id), filial_id: filial, produto: lote.produto || null, origem: lote.origem || null, destino: lote.destino || null, lote: lote.lote || null, peso_lote: numeroPeso(lote.pesoLote) || null, cadencia: Math.max(0, Number(lote.cadencia || 0) || 0), data_inicio: lote.dataInicio || hojeISO(), data_fim: null, status: lote.status || 'ativo', criado_por: null, dados: { filial, pesoLote: lote.pesoLote || '', criadoPor: usuarioAtual?.usuario || '-', nomeCriador: usuarioAtual?.nome || usuarioAtual?.usuario || '-' } }
}
function linhaPayload(linha, lote, usuarioAtual) {
  const filial = lote?.filial || usuarioAtual?.filial || 'jatai-go'
  return { local_id: String(linha.id), lote_local_id: String(linha.loteId), data_operacao: linha.dia, cota: Number(linha.cota || 0) || null, filial_id: filial, placa: placaLimpa(linha.placa), peso: numeroPeso(linha.peso) || null, ordem_carregamento: linha.ordem ? 'X' : '', cte: linha.cte ? 'X' : '', transportadora: linha.transportadora || null, motorista: linha.motorista || null, telefone: formatarTelefone(linha.telefone), status: linha.status || 'agendado', produto: lote?.produto || null, origem: lote?.origem || null, destino: lote?.destino || null, lote: lote?.lote || null, responsavel_usuario: null, observacao: linha.observacao || null, dados: { responsavel: linha.responsavel || '', seguradora: linha.seguradora || 'APROVADO', chamadoMdfe: linha.chamadoMdfe || '', filial } }
}

export default function ControleEmbarque() {
  const { usuarioAtual, toast } = useApp()
  const [lotes, setLotes] = useState(() => ler(LOTES_KEY))
  const [linhas, setLinhas] = useState(() => ler(LINHAS_KEY))
  const [formLote, setFormLote] = useState(LOTE_VAZIO)
  const [editandoLoteId, setEditandoLoteId] = useState('')
  const [mostrarArquivados, setMostrarArquivados] = useState(false)
  const [buscaLote, setBuscaLote] = useState('')
  const [loteAtivoId, setLoteAtivoId] = useState('')
  const [diaAtivo, setDiaAtivo] = useState('')
  const [busca, setBusca] = useState('')
  const [modoBanco, setModoBanco] = useState('carregando')

  const isAdmin = podeAdministrar(usuarioAtual)
  const filialAtual = usuarioAtual?.filial || 'jatai-go'

  useEffect(() => { gravar(LOTES_KEY, lotes) }, [lotes])
  useEffect(() => { gravar(LINHAS_KEY, linhas) }, [linhas])
  useEffect(() => {
    let vivo = true
    async function carregar() {
      try {
        const sb = getClient()
        let qLotes = sb.from(T_LOTES).select('*').order('updated_at', { ascending: false })
        let qLinhas = sb.from(T_LINHAS).select('*').order('cota', { ascending: true })
        if (!isAdmin) { qLotes = qLotes.eq('filial_id', filialAtual); qLinhas = qLinhas.eq('filial_id', filialAtual) }
        const [{ data: lotesDb, error: e1 }, { data: linhasDb, error: e2 }] = await Promise.all([qLotes, qLinhas])
        if (e1 || e2) throw e1 || e2
        if (!vivo) return
        const lotesNorm = (lotesDb || []).map(loteRowToItem)
        const linhasNorm = (linhasDb || []).filter(r => r.lote_local_id).map(linhaRowToItem)
        if (lotesNorm.length) setLotes(lotesNorm)
        if (linhasNorm.length) setLinhas(linhasNorm)
        setModoBanco('online')
      } catch { if (vivo) setModoBanco('local') }
    }
    carregar()
    return () => { vivo = false }
  }, [isAdmin, filialAtual])

  const lotesDaFilial = useMemo(() => lotes.filter(l => isAdmin || (l.filial || filialAtual) === filialAtual), [lotes, isAdmin, filialAtual])
  const lotesVisiveis = useMemo(() => {
    const q = normalizar(buscaLote)
    return lotesDaFilial
      .filter(l => mostrarArquivados ? l.status !== 'ativo' : l.status === 'ativo')
      .filter(l => !q || normalizar([l.produto, l.lote, l.origem, l.destino].join(' ')).includes(q))
  }, [lotesDaFilial, mostrarArquivados, buscaLote])
  const loteAtivo = lotesVisiveis.find(l => String(l.id) === String(loteAtivoId)) || lotesVisiveis[0] || null
  const dias = useMemo(() => loteAtivo ? diasDoLote(linhas, loteAtivo.id, diaAtivo) : [hojeISO()], [loteAtivo, linhas, diaAtivo])
  const dia = diaAtivo || hojeISO()

  useEffect(() => {
    if (!loteAtivoId && lotesVisiveis[0]) setLoteAtivoId(lotesVisiveis[0].id)
    if (loteAtivoId && !lotesVisiveis.some(l => String(l.id) === String(loteAtivoId))) setLoteAtivoId(lotesVisiveis[0]?.id || '')
  }, [lotesVisiveis, loteAtivoId])
  useEffect(() => { if (!diaAtivo) setDiaAtivo(hojeISO()) }, [diaAtivo])

  const linhasDoDia = useMemo(() => {
    const q = normalizar(busca)
    return linhas
      .filter(l => String(l.loteId) === String(loteAtivo?.id) && l.dia === dia)
      .filter(l => !q || normalizar([l.placa, l.transportadora, l.motorista, l.responsavel, l.observacao].join(' ')).includes(q))
      .sort((a, b) => (Number(a.cota || 0) - Number(b.cota || 0)) || String(a.placa).localeCompare(String(b.placa)))
  }, [linhas, loteAtivo, dia, busca])
  const resumo = useMemo(() => {
    const listaDia = linhas.filter(l => String(l.loteId) === String(loteAtivo?.id) && l.dia === dia)
    const listaLote = linhas.filter(l => String(l.loteId) === String(loteAtivo?.id))
    const pesoDia = listaDia.reduce((s, l) => s + numeroPeso(l.peso), 0)
    const pesoCarregadoLote = listaLote.reduce((s, l) => s + numeroPeso(l.peso), 0)
    const pesoMeta = numeroPeso(loteAtivo?.pesoLote)
    const restante = Math.max(0, pesoMeta - pesoCarregadoLote)
    const progresso = pesoMeta > 0 ? Math.min(100, Math.round((pesoCarregadoLote / pesoMeta) * 100)) : 0
    return { total: listaDia.length, carregados: listaDia.filter(l => l.status === 'carregado').length, aguardando: listaDia.filter(l => l.status === 'agendado').length, peso: pesoDia, pesoMeta, pesoCarregadoLote, restante, progresso }
  }, [linhas, loteAtivo, dia])

  function limparFormLote() { setFormLote(LOTE_VAZIO); setEditandoLoteId('') }
  async function persistirLote(lote, mensagem) {
    try { const { error } = await getClient().from(T_LOTES).upsert(lotePayload(lote, usuarioAtual), { onConflict: 'local_id' }); if (error) throw error; setModoBanco('online'); toast?.(mensagem, 'ok') }
    catch { setModoBanco('local'); toast?.('Salvo localmente. Nuvem falhou.', 'warn') }
  }
  async function salvarLote() {
    if (!formLote.produto || !formLote.origem || !formLote.destino || !formLote.lote || !formLote.pesoLote) { alert('Preencha produto, origem, destino, lote e peso do lote.'); return }
    const anterior = editandoLoteId ? lotes.find(l => String(l.id) === String(editandoLoteId)) : null
    const item = { ...(anterior || {}), ...formLote, id: editandoLoteId || gerarId(), dataInicio: anterior?.dataInicio || hojeISO(), filial: anterior?.filial || filialAtual, status: anterior?.status || 'ativo', criadoPor: anterior?.criadoPor || usuarioAtual?.usuario || '-' }
    setLotes(anterior ? lotes.map(l => String(l.id) === String(item.id) ? item : l) : [item, ...lotes])
    setLoteAtivoId(item.id); setDiaAtivo(hojeISO()); limparFormLote()
    await persistirLote(item, anterior ? 'Lote atualizado.' : 'Lote criado.')
  }
  function editarLote(lote, ev) { ev?.stopPropagation?.(); setFormLote({ produto: lote.produto || 'SOJA', origem: lote.origem || '', destino: lote.destino || '', lote: lote.lote || '', pesoLote: String(lote.pesoLote || ''), cadencia: String(lote.cadencia || '10') }); setEditandoLoteId(lote.id); setLoteAtivoId(lote.id) }
  async function arquivarLote(lote, ev) { ev?.stopPropagation?.(); if (!confirm(`Arquivar lote ${lote.lote}?`)) return; const atualizado = { ...lote, status: 'finalizado' }; setLotes(lotes.map(l => String(l.id) === String(lote.id) ? atualizado : l)); await persistirLote(atualizado, 'Lote arquivado.') }
  async function reabrirLote(lote, ev) { ev?.stopPropagation?.(); const atualizado = { ...lote, status: 'ativo' }; setLotes(lotes.map(l => String(l.id) === String(lote.id) ? atualizado : l)); setMostrarArquivados(false); setLoteAtivoId(lote.id); await persistirLote(atualizado, 'Lote reaberto.') }
  async function excluirLote(lote, ev) {
    ev?.stopPropagation?.()
    if (!confirm(`Excluir definitivamente o lote ${lote.lote} e todas as placas dele?`)) return
    const idsLinhas = linhas.filter(l => String(l.loteId) === String(lote.id)).map(l => String(l.id))
    setLotes(lotes.filter(l => String(l.id) !== String(lote.id)))
    setLinhas(linhas.filter(l => String(l.loteId) !== String(lote.id)))
    setLoteAtivoId('')
    try {
      const sb = getClient()
      await Promise.all(idsLinhas.map(id => sb.from(T_LINHAS).delete().eq('local_id', id)))
      await sb.from(T_LOTES).delete().eq('local_id', String(lote.id))
      setModoBanco('online'); toast?.('Lote excluído.', 'ok')
    } catch { setModoBanco('local'); toast?.('Excluído localmente. Nuvem falhou.', 'warn') }
  }
  async function salvarLinha(linhaNova) {
    if (!loteAtivo) return
    setLinhas(linhas.some(l => String(l.id) === String(linhaNova.id)) ? linhas.map(l => String(l.id) === String(linhaNova.id) ? linhaNova : l) : [...linhas, linhaNova])
    try { const { error } = await getClient().from(T_LINHAS).upsert(linhaPayload(linhaNova, loteAtivo, usuarioAtual), { onConflict: 'local_id' }); if (error) throw error; setModoBanco('online') } catch { setModoBanco('local') }
  }
  function atualizarLinha(id, campo, valor) { setLinhas(linhas.map(l => String(l.id) === String(id) ? { ...l, [campo]: valor } : l)) }
  async function persistirLinha(id) { const linha = linhas.find(l => String(l.id) === String(id)); if (linha) await salvarLinha(linha) }
  function adicionarLinha() { if (!loteAtivo || !dia) return; const proximaCota = Math.max(0, ...linhas.filter(l => String(l.loteId) === String(loteAtivo.id) && l.dia === dia).map(l => Number(l.cota || 0))) + 1; setLinhas([...linhas, { ...LINHA_VAZIA, id: gerarId(), loteId: loteAtivo.id, dia, cota: proximaCota, filial: loteAtivo.filial || filialAtual }]) }
  function gerarCotasDoDia() { if (!loteAtivo || !dia) return; const cadencia = Math.max(1, Number(loteAtivo.cadencia || 0) || 1); const existentes = linhas.filter(l => String(l.loteId) === String(loteAtivo.id) && l.dia === dia); const cotas = new Set(existentes.map(l => Number(l.cota))); const novas = []; for (let c = 1; c <= cadencia; c++) if (!cotas.has(c)) novas.push({ ...LINHA_VAZIA, id: gerarId(), loteId: loteAtivo.id, dia, cota: c, filial: loteAtivo.filial || filialAtual }); setLinhas([...linhas, ...novas]) }
  async function apagarLinha(id) { if (!confirm('Excluir esta linha?')) return; setLinhas(linhas.filter(l => String(l.id) !== String(id))); try { await getClient().from(T_LINHAS).delete().eq('local_id', String(id)) } catch {} }
  async function marcarCarregado(linha) { await salvarLinha({ ...linha, status: 'carregado' }) }

  return (
    <section className="embarque-facil">
      <header className="embarque-hero-ayres">
        <div className="hero-copy"><span>Controle de Embarque</span><h1>Gestão de lotes e carregamentos</h1><p>Lotes ficam na lateral com lupa. A operação do dia fica limpa no quadro principal.</p></div>
        <div className="hero-right"><div className="embarque-sync"><i className={modoBanco === 'online' ? 'on' : modoBanco === 'local' ? 'off' : ''} />{modoBanco === 'online' ? 'Nuvem online' : modoBanco === 'local' ? 'Modo local' : 'Conectando'}</div><button className="ghost-btn" onClick={() => setMostrarArquivados(v => !v)}>{mostrarArquivados ? 'Ver ativos' : 'Ver arquivados'}</button></div>
      </header>

      <section className="lote-form premium-card"><div className="form-title"><strong>{editandoLoteId ? 'Editar lote' : 'Novo lote'}</strong><small>Peso em toneladas</small></div><input placeholder="Produto" value={formLote.produto} onChange={e => setFormLote(f => ({ ...f, produto: e.target.value.toUpperCase() }))} /><input placeholder="Origem" value={formLote.origem} onChange={e => setFormLote(f => ({ ...f, origem: e.target.value.toUpperCase() }))} /><input placeholder="Destino" value={formLote.destino} onChange={e => setFormLote(f => ({ ...f, destino: e.target.value.toUpperCase() }))} /><input placeholder="Lote" value={formLote.lote} onChange={e => setFormLote(f => ({ ...f, lote: e.target.value }))} /><input type="number" step="0.001" placeholder="Peso lote ton" value={formLote.pesoLote} onChange={e => setFormLote(f => ({ ...f, pesoLote: e.target.value }))} /><input type="number" placeholder="Cadência" value={formLote.cadencia} onChange={e => setFormLote(f => ({ ...f, cadencia: e.target.value }))} /><div className="form-actions"><button className="primary-btn" onClick={salvarLote}>{editandoLoteId ? 'Salvar lote' : 'Criar lote'}</button>{editandoLoteId && <button className="ghost-btn light" onClick={limparFormLote}>Cancelar</button>}</div></section>

      <div className="embarque-workspace">
        <aside className="lotes-sidebar">
          <div className="side-head"><strong>{mostrarArquivados ? 'Lotes arquivados' : 'Lotes ativos'}</strong><small>{lotesVisiveis.length} encontrado(s)</small></div>
          <div className="lote-search"><span>⌕</span><input value={buscaLote} onChange={e => setBuscaLote(e.target.value)} placeholder="Buscar lote, produto, rota..." /></div>
          <div className="lotes-scroll">
            {lotesVisiveis.map(l => {
              const listaLote = linhas.filter(x => String(x.loteId) === String(l.id)); const total = listaLote.length; const car = listaLote.filter(x => x.status === 'carregado').length; const pesoCarregado = listaLote.reduce((s, x) => s + numeroPeso(x.peso), 0); const pesoMeta = numeroPeso(l.pesoLote); const restante = Math.max(0, pesoMeta - pesoCarregado); const progresso = pesoMeta > 0 ? Math.min(100, Math.round((pesoCarregado / pesoMeta) * 100)) : 0
              return <article key={l.id} className={`lote-side-item ${String(l.id) === String(loteAtivo?.id) ? 'active' : ''} ${l.status !== 'ativo' ? 'archived' : ''}`} onClick={() => { setLoteAtivoId(l.id); setDiaAtivo(hojeISO()) }}><div className="lote-side-top"><span>{l.produto}</span><em>{l.status === 'ativo' ? 'Ativo' : 'Arquivado'}</em></div><strong>Lote {l.lote}</strong><p>{l.origem} → {l.destino}</p><div className="progress-line"><span style={{ width: `${progresso}%` }} /></div><small>{car}/{total || l.cadencia} carregados · falta {formatarPeso(restante) || '0,000'} ton</small><div className="lote-card-actions"><button onClick={(ev) => editarLote(l, ev)}>Editar</button>{l.status === 'ativo' ? <button onClick={(ev) => arquivarLote(l, ev)}>Arquivar</button> : <button onClick={(ev) => reabrirLote(l, ev)}>Reabrir</button>}<button className="danger" onClick={(ev) => excluirLote(l, ev)}>Excluir</button></div></article>
            })}
            {!lotesVisiveis.length && <div className="sem-lote">Nenhum lote encontrado.</div>}
          </div>
        </aside>

        <main className="quadro-area">
          {loteAtivo && <section className="quadro-excel"><div className="excel-titulo"><div><span>{loteAtivo.status === 'ativo' ? 'Lote ativo' : 'Lote arquivado'}</span><h2>{loteAtivo.produto} - {loteAtivo.origem} X {loteAtivo.destino}</h2><p>{loteAtivo.origem} X {loteAtivo.destino} LOTE - {loteAtivo.lote}</p></div><div className="saldo-box"><small>Restante do lote</small><strong>{formatarPeso(resumo.restante) || '0,000'} ton</strong><em>{resumo.progresso}% carregado</em></div></div>
          <div className="day-nav"><button onClick={() => setDiaAtivo(addDias(dia, -1))}>‹ Dia anterior</button><strong>{dataBR(dia)} {dia === hojeISO() ? '· Hoje' : ''}</strong><button onClick={() => setDiaAtivo(addDias(dia, 1))}>Próximo dia ›</button></div>
          <div className="dias-tabs">{dias.map(d => <button key={d} className={d === dia ? 'active' : ''} onClick={() => setDiaAtivo(d)}>{dataBR(d)}</button>)}</div>
          <div className="barra-acoes"><button onClick={gerarCotasDoDia}>Gerar cotas do dia</button><button onClick={adicionarLinha}>+ Adicionar placa</button><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar placa, transportadora ou motorista" /><div><strong>{resumo.carregados}</strong> carregados</div><div><strong>{formatarPeso(resumo.pesoCarregadoLote) || '0,000'}</strong> carregado lote</div><div><strong>{formatarPeso(resumo.restante) || '0,000'}</strong> restante</div></div>
          <div className="excel-wrap"><table className="excel-table"><thead><tr><th>COTA</th><th>PLACA</th><th>PESO</th><th>ORDEM</th><th>CTE</th><th>TRANSP</th><th>RESPONSÁVEL</th><th>STATUS</th><th>SEGURADORA</th><th>CHAMADO MDFE</th><th>AÇÕES</th></tr></thead><tbody>{linhasDoDia.map(l => <tr key={l.id} className={`linha-${STATUS[l.status]?.classe || 'agendado'}`}><td><input value={l.cota} onChange={e => atualizarLinha(l.id, 'cota', e.target.value)} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.placa} onChange={e => atualizarLinha(l.id, 'placa', placaLimpa(e.target.value))} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.peso} onChange={e => atualizarLinha(l.id, 'peso', e.target.value)} onBlur={() => persistirLinha(l.id)} placeholder="0,000" /></td><td><button className={l.ordem ? 'x-on' : ''} onClick={() => salvarLinha({ ...l, ordem: !l.ordem })}>X</button></td><td><button className={l.cte ? 'x-on' : ''} onClick={() => salvarLinha({ ...l, cte: !l.cte })}>X</button></td><td><input value={l.transportadora} onChange={e => atualizarLinha(l.id, 'transportadora', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.responsavel} onChange={e => atualizarLinha(l.id, 'responsavel', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td><td><select value={l.status} onChange={e => salvarLinha({ ...l, status: e.target.value })}><option value="agendado">AG. CARREGAMENTO</option><option value="carregado">CARREGADO</option><option value="cancelado">CANCELADO</option></select></td><td><input value={l.seguradora} onChange={e => atualizarLinha(l.id, 'seguradora', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.chamadoMdfe} onChange={e => atualizarLinha(l.id, 'chamadoMdfe', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td><td><button onClick={() => marcarCarregado(l)}>Carregou</button><button onClick={() => apagarLinha(l.id)}>Excluir</button></td></tr>)}{!linhasDoDia.length && <tr><td colSpan="11" className="vazio">Nenhuma placa neste dia. Use “Adicionar placa” ou “Gerar cotas do dia”.</td></tr>}</tbody><tfoot><tr><td colSpan="2">TOTAL DO DIA</td><td>{formatarPeso(resumo.peso)}</td><td colSpan="8">Meta lote {formatarPeso(resumo.pesoMeta) || '0,000'} ton · Restante {formatarPeso(resumo.restante) || '0,000'} ton</td></tr></tfoot></table></div></section>}
          {!loteAtivo && <div className="empty-main">Selecione ou cadastre um lote para começar.</div>}
        </main>
      </div>
    </section>
  )
}
