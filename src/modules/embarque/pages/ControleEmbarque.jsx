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
const normalizar = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const ler = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback } }
const gravar = (key, valor) => localStorage.setItem(key, JSON.stringify(valor))
const numeroPeso = (v) => { const n = Number(moedaPeso(v)); return Number.isFinite(n) ? n : 0 }
const formatarPeso = (v) => { const n = Number(v || 0); return Number.isFinite(n) ? n.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '0,000' }
const formatarTelefone = (v) => { const n = limparNumero(v).slice(0, 11); if (n.length <= 2) return n; if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`; return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}` }
const addDias = (iso, delta) => { const d = new Date(`${iso || hojeISO()}T12:00:00`); d.setDate(d.getDate() + delta); return d.toISOString().slice(0, 10) }
const dataBR = (iso, opts = {}) => iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', opts) : ''

function loteRowToItem(row) {
  const dados = row.dados || {}
  return { id: row.local_id || row.id, produto: row.produto || dados.produto || 'SOJA', origem: row.origem || '', destino: row.destino || '', lote: row.lote || '', pesoLote: row.peso_lote ? formatarPeso(row.peso_lote) : (dados.pesoLote || ''), cadencia: String(row.cadencia || dados.cadencia || 0), filial: row.filial_id || dados.filial || 'jatai-go', criadoPor: row.criado_por || dados.criadoPor || '-', status: row.status || 'ativo' }
}

function linhaRowToItem(row) {
  const dados = row.dados || {}
  return { id: row.local_id || row.id, loteId: row.lote_local_id || dados.loteId || '', dia: row.data_operacao || dados.dia || hojeISO(), cota: row.cota || dados.cota || '', placa: row.placa || '', peso: row.peso ? formatarPeso(row.peso) : '', ordem: String(row.ordem_carregamento || dados.ordem || '').toUpperCase() === 'X' || row.ordem_carregamento === true, cte: String(row.cte || dados.cte || '').toUpperCase() === 'X' || row.cte === true, transportadora: row.transportadora || '', responsavel: dados.responsavel || '', status: row.status || 'agendado', seguradora: dados.seguradora || 'APROVADO', chamadoMdfe: dados.chamadoMdfe || '', motorista: row.motorista || '', telefone: row.telefone || '', observacao: row.observacao || '', filial: row.filial_id || dados.filial || 'jatai-go' }
}

function lotePayload(lote, usuarioAtual) {
  const filial = lote.filial || usuarioAtual?.filial || 'jatai-go'
  return { local_id: String(lote.id), filial_id: filial, produto: lote.produto || null, origem: lote.origem || null, destino: lote.destino || null, lote: lote.lote || null, peso_lote: numeroPeso(lote.pesoLote) || null, cadencia: Math.max(0, Number(lote.cadencia || 0) || 0), data_inicio: hojeISO(), data_fim: null, status: lote.status || 'ativo', criado_por: null, dados: { filial, pesoLote: lote.pesoLote || '', criadoPor: usuarioAtual?.usuario || '-', nomeCriador: usuarioAtual?.nome || usuarioAtual?.usuario || '-' } }
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
  const [busca, setBusca] = useState('')
  const [buscaGestao, setBuscaGestao] = useState('')
  const [produtoFiltro, setProdutoFiltro] = useState('TODOS')
  const [diaAtivo, setDiaAtivo] = useState(hojeISO())
  const [loteAberto, setLoteAberto] = useState('')
  const [modoBanco, setModoBanco] = useState('carregando')
  const [aba, setAba] = useState('dia')

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
  const statsLote = (lote) => {
    const listaLote = linhas.filter(l => String(l.loteId) === String(lote.id))
    const listaDia = listaLote.filter(l => l.dia === diaAtivo)
    const pesoLote = numeroPeso(lote.pesoLote)
    const pesoCarregadoLote = listaLote.reduce((s, l) => s + (l.status === 'carregado' ? numeroPeso(l.peso) : 0), 0)
    const pesoDia = listaDia.reduce((s, l) => s + (l.status === 'carregado' ? numeroPeso(l.peso) : 0), 0)
    const restante = Math.max(0, pesoLote - pesoCarregadoLote)
    const progresso = pesoLote > 0 ? Math.min(100, Math.round((pesoCarregadoLote / pesoLote) * 100)) : 0
    return { listaLote, listaDia, pesoLote, pesoCarregadoLote, pesoDia, restante, progresso, carregadosDia: listaDia.filter(l => l.status === 'carregado').length, aguardandoDia: listaDia.filter(l => l.status === 'agendado').length }
  }
  const lotesDia = useMemo(() => {
    const q = normalizar(busca)
    return lotesDaFilial
      .filter(l => mostrarArquivados ? l.status !== 'ativo' : l.status === 'ativo')
      .filter(l => produtoFiltro === 'TODOS' || normalizar(l.produto) === normalizar(produtoFiltro))
      .filter(l => {
        const st = statsLote(l)
        const texto = normalizar([l.produto, l.lote, l.origem, l.destino, ...st.listaDia.flatMap(x => [x.placa, x.transportadora, x.motorista, x.responsavel])].join(' '))
        return !q || texto.includes(q)
      })
      .filter(l => {
        const st = statsLote(l)
        return mostrarArquivados || st.restante > 0 || st.listaDia.length > 0
      })
  }, [lotesDaFilial, linhas, busca, produtoFiltro, mostrarArquivados, diaAtivo])
  const lotesGestao = useMemo(() => {
    const q = normalizar(buscaGestao)
    return lotesDaFilial
      .filter(l => mostrarArquivados ? l.status !== 'ativo' : l.status === 'ativo')
      .filter(l => !q || normalizar([l.produto, l.lote, l.origem, l.destino].join(' ')).includes(q))
  }, [lotesDaFilial, mostrarArquivados, buscaGestao])
  const produtos = useMemo(() => [...new Set(lotesDaFilial.map(l => String(l.produto || '').toUpperCase()).filter(Boolean))], [lotesDaFilial])
  const resumoDia = useMemo(() => {
    const linhasDia = lotesDia.flatMap(l => statsLote(l).listaDia)
    return { lotes: lotesDia.length, caminhoes: linhasDia.length, carregados: linhasDia.filter(l => l.status === 'carregado').length, restante: lotesDia.reduce((s, l) => s + statsLote(l).restante, 0) }
  }, [lotesDia, linhas, diaAtivo])
  const resumoGestao = useMemo(() => ({ ativos: lotesDaFilial.filter(l => l.status === 'ativo').length, arquivados: lotesDaFilial.filter(l => l.status !== 'ativo').length, peso: lotesDaFilial.reduce((s, l) => s + numeroPeso(l.pesoLote), 0), restante: lotesDaFilial.reduce((s, l) => s + statsLote(l).restante, 0) }), [lotesDaFilial, linhas])
  const diasTopo = useMemo(() => [-2, -1, 0, 1, 2].map(n => addDias(hojeISO(), n)), [])

  function limparFormLote() { setFormLote(LOTE_VAZIO); setEditandoLoteId('') }
  async function persistirLote(lote, mensagem) {
    try { const { error } = await getClient().from(T_LOTES).upsert(lotePayload(lote, usuarioAtual), { onConflict: 'local_id' }); if (error) throw error; setModoBanco('online'); toast?.(mensagem, 'ok') }
    catch { setModoBanco('local'); toast?.('Salvo localmente. Nuvem falhou.', 'warn') }
  }
  async function salvarLote() {
    if (!formLote.produto || !formLote.origem || !formLote.destino || !formLote.lote || !formLote.pesoLote) { alert('Preencha produto, origem, destino, lote e peso do lote.'); return }
    const anterior = editandoLoteId ? lotes.find(l => String(l.id) === String(editandoLoteId)) : null
    const item = { ...(anterior || {}), ...formLote, id: editandoLoteId || gerarId(), filial: anterior?.filial || filialAtual, status: anterior?.status || 'ativo', criadoPor: anterior?.criadoPor || usuarioAtual?.usuario || '-' }
    setLotes(anterior ? lotes.map(l => String(l.id) === String(item.id) ? item : l) : [item, ...lotes])
    setLoteAberto(item.id); limparFormLote(); setAba('lotes')
    await persistirLote(item, anterior ? 'Lote atualizado.' : 'Lote criado.')
  }
  function editarLote(lote, ev) { ev?.stopPropagation?.(); setFormLote({ produto: lote.produto || 'SOJA', origem: lote.origem || '', destino: lote.destino || '', lote: lote.lote || '', pesoLote: String(lote.pesoLote || ''), cadencia: String(lote.cadencia || '10') }); setEditandoLoteId(lote.id); setLoteAberto(lote.id); setAba('lotes') }
  async function arquivarLote(lote, ev) { ev?.stopPropagation?.(); if (!confirm(`Arquivar lote ${lote.lote}?`)) return; const atualizado = { ...lote, status: 'finalizado' }; setLotes(lotes.map(l => String(l.id) === String(lote.id) ? atualizado : l)); await persistirLote(atualizado, 'Lote arquivado.') }
  async function reabrirLote(lote, ev) { ev?.stopPropagation?.(); const atualizado = { ...lote, status: 'ativo' }; setLotes(lotes.map(l => String(l.id) === String(lote.id) ? atualizado : l)); setMostrarArquivados(false); setLoteAberto(lote.id); await persistirLote(atualizado, 'Lote reaberto.') }
  async function excluirLote(lote, ev) {
    ev?.stopPropagation?.()
    if (!confirm(`Excluir definitivamente o lote ${lote.lote} e todas as placas dele?`)) return
    const idsLinhas = linhas.filter(l => String(l.loteId) === String(lote.id)).map(l => String(l.id))
    setLotes(lotes.filter(l => String(l.id) !== String(lote.id)))
    setLinhas(linhas.filter(l => String(l.loteId) !== String(lote.id)))
    try { const sb = getClient(); await Promise.all(idsLinhas.map(id => sb.from(T_LINHAS).delete().eq('local_id', id))); await sb.from(T_LOTES).delete().eq('local_id', String(lote.id)); setModoBanco('online'); toast?.('Lote excluído.', 'ok') }
    catch { setModoBanco('local'); toast?.('Excluído localmente. Nuvem falhou.', 'warn') }
  }
  async function salvarLinha(linhaNova, loteRef) {
    const lote = loteRef || lotes.find(l => String(l.id) === String(linhaNova.loteId))
    setLinhas(linhas.some(l => String(l.id) === String(linhaNova.id)) ? linhas.map(l => String(l.id) === String(linhaNova.id) ? linhaNova : l) : [...linhas, linhaNova])
    try { const { error } = await getClient().from(T_LINHAS).upsert(linhaPayload(linhaNova, lote, usuarioAtual), { onConflict: 'local_id' }); if (error) throw error; setModoBanco('online') } catch { setModoBanco('local') }
  }
  function atualizarLinha(id, campo, valor) { setLinhas(linhas.map(l => String(l.id) === String(id) ? { ...l, [campo]: valor } : l)) }
  async function persistirLinha(id) { const linha = linhas.find(l => String(l.id) === String(id)); if (linha) await salvarLinha(linha) }
  function adicionarLinha(lote) { const existentes = linhas.filter(l => String(l.loteId) === String(lote.id) && l.dia === diaAtivo); const proximaCota = Math.max(0, ...existentes.map(l => Number(l.cota || 0))) + 1; setLinhas([...linhas, { ...LINHA_VAZIA, id: gerarId(), loteId: lote.id, dia: diaAtivo, cota: proximaCota, filial: lote.filial || filialAtual }]); setLoteAberto(lote.id) }
  function gerarCotasDoDia(lote) { const cadencia = Math.max(1, Number(lote.cadencia || 0) || 1); const existentes = linhas.filter(l => String(l.loteId) === String(lote.id) && l.dia === diaAtivo); const cotas = new Set(existentes.map(l => Number(l.cota))); const novas = []; for (let c = 1; c <= cadencia; c++) if (!cotas.has(c)) novas.push({ ...LINHA_VAZIA, id: gerarId(), loteId: lote.id, dia: diaAtivo, cota: c, filial: lote.filial || filialAtual }); setLinhas([...linhas, ...novas]); setLoteAberto(lote.id) }
  async function apagarLinha(id) { if (!confirm('Excluir esta linha?')) return; setLinhas(linhas.filter(l => String(l.id) !== String(id))); try { await getClient().from(T_LINHAS).delete().eq('local_id', String(id)) } catch {} }
  async function marcarCarregado(linha) { await salvarLinha({ ...linha, status: 'carregado', peso: linha.peso || '38.000' }) }

  const formLoteSection = <section className="lote-form dia-card"><div className="form-title"><strong>{editandoLoteId ? 'Editar lote' : 'Novo lote'}</strong><small>Peso em toneladas</small></div><input placeholder="Produto" value={formLote.produto} onChange={e => setFormLote(f => ({ ...f, produto: e.target.value.toUpperCase() }))} /><input placeholder="Origem" value={formLote.origem} onChange={e => setFormLote(f => ({ ...f, origem: e.target.value.toUpperCase() }))} /><input placeholder="Destino" value={formLote.destino} onChange={e => setFormLote(f => ({ ...f, destino: e.target.value.toUpperCase() }))} /><input placeholder="Lote" value={formLote.lote} onChange={e => setFormLote(f => ({ ...f, lote: e.target.value }))} /><input type="number" step="0.001" placeholder="Peso lote ton" value={formLote.pesoLote} onChange={e => setFormLote(f => ({ ...f, pesoLote: e.target.value }))} /><input type="number" placeholder="Cadência" value={formLote.cadencia} onChange={e => setFormLote(f => ({ ...f, cadencia: e.target.value }))} /><div className="form-actions"><button className="primary-btn" onClick={salvarLote}>{editandoLoteId ? 'Salvar lote' : 'Criar lote'}</button>{editandoLoteId && <button className="ghost-btn light" onClick={limparFormLote}>Cancelar</button>}</div></section>

  return (
    <section className="embarque-dia-page">
      <header className="embarque-dia-hero">
        <div><span>Controle de Embarque</span><h1>{aba === 'dia' ? 'Hoje primeiro, igual planilha' : 'Gestão de lotes'}</h1><p>{aba === 'dia' ? 'Abre no dia atual e mostra todos os lotes disponíveis para carregar.' : 'Cadastre, edite, arquive ou exclua lotes sem misturar com a operação diária.'}</p></div>
        <div className="hero-actions-dia"><div className="hoje-box"><small>{diaAtivo === hojeISO() ? 'HOJE' : 'DIA'}</small><strong>{dataBR(diaAtivo, { day: '2-digit', month: '2-digit' })}</strong></div><button className="ghost-btn" onClick={() => setMostrarArquivados(v => !v)}>{mostrarArquivados ? 'Ver ativos' : 'Ver arquivados'}</button><div className="embarque-sync"><i className={modoBanco === 'online' ? 'on' : modoBanco === 'local' ? 'off' : ''} />{modoBanco === 'online' ? 'Nuvem online' : modoBanco === 'local' ? 'Modo local' : 'Conectando'}</div></div>
      </header>

      <div className="embarque-shell">
        <aside className="embarque-module-menu">
          <button className={aba === 'dia' ? 'active' : ''} onClick={() => setAba('dia')}><span>📅</span><strong>Operação diária</strong><small>Placas e pesos de hoje</small></button>
          <button className={aba === 'lotes' ? 'active' : ''} onClick={() => setAba('lotes')}><span>📦</span><strong>Gestão de lotes</strong><small>Criar, editar e arquivar</small></button>
        </aside>

        <main className="embarque-module-content">
          {aba === 'dia' && <>
            <nav className="dia-nav-top"><button onClick={() => setDiaAtivo(addDias(diaAtivo, -1))}>‹ Dia anterior</button>{diasTopo.map(d => <button key={d} className={d === diaAtivo ? 'active' : ''} onClick={() => setDiaAtivo(d)}>{d === hojeISO() ? 'Hoje' : dataBR(d, { day: '2-digit' })}</button>)}<button onClick={() => setDiaAtivo(addDias(diaAtivo, 1))}>Próximo dia ›</button></nav>
            <section className="dia-metrics"><article><strong>{resumoDia.lotes}</strong><span>Lotes disponíveis</span></article><article><strong>{resumoDia.caminhoes}</strong><span>Caminhões hoje</span></article><article><strong>{resumoDia.carregados}</strong><span>Carregados</span></article><article><strong>{formatarPeso(resumoDia.restante)}</strong><span>Ton restantes</span></article></section>
            <div className="dia-toolbar"><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Buscar lote, produto, placa, transportadora..." /><select value={produtoFiltro} onChange={e => setProdutoFiltro(e.target.value)}><option value="TODOS">Todos os produtos</option>{produtos.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div className="dia-layout"><aside className="lotes-mini-list"><strong>{mostrarArquivados ? 'Arquivados' : 'Lotes do dia'}</strong><div>{lotesDia.map(l => { const st = statsLote(l); return <button key={l.id} onClick={() => setLoteAberto(String(loteAberto) === String(l.id) ? '' : l.id)} className={String(loteAberto) === String(l.id) ? 'active' : ''}><span>{l.produto} · {l.lote}</span><small>{st.listaDia.length} cam. · falta {formatarPeso(st.restante)}t</small></button> })}</div></aside><main className="lotes-dia-area">{lotesDia.map(lote => { const st = statsLote(lote); const aberto = String(loteAberto || lotesDia[0]?.id) === String(lote.id); return <section className="lote-dia-bloco" key={lote.id}><div className="lote-dia-head" onClick={() => setLoteAberto(aberto ? '' : lote.id)}><div className="lote-title-dia"><strong>{lote.produto} · LOTE {lote.lote}</strong><span>{lote.origem} → {lote.destino} · Cadência {lote.cadencia}</span><div className="progress-line"><span style={{ width: `${st.progresso}%` }} /></div></div><div><small>Peso lote</small><strong>{formatarPeso(st.pesoLote)} ton</strong></div><div><small>Carregado</small><strong>{formatarPeso(st.pesoCarregadoLote)} ton</strong></div><div><small>Restante</small><strong>{formatarPeso(st.restante)} ton</strong></div><div className="lote-actions-dia"><button onClick={(ev) => editarLote(lote, ev)}>Editar</button><button onClick={(ev) => arquivarLote(lote, ev)}>Arquivar</button></div></div>{aberto && <div className="lote-dia-corpo"><div className="lote-dia-actions"><button onClick={() => gerarCotasDoDia(lote)}>Gerar cotas do dia</button><button onClick={() => adicionarLinha(lote)}>+ Adicionar placa</button><span>{st.carregadosDia} carregados · {st.aguardandoDia} aguardando · {formatarPeso(st.pesoDia)} ton hoje</span></div><div className="excel-wrap"><table className="excel-table"><thead><tr><th>COTA</th><th>PLACA</th><th>PESO</th><th>ORDEM</th><th>CTE</th><th>TRANSP</th><th>RESPONSÁVEL</th><th>STATUS</th><th>SEGURADORA</th><th>CHAMADO MDFE</th><th>AÇÕES</th></tr></thead><tbody>{st.listaDia.sort((a, b) => (Number(a.cota || 0) - Number(b.cota || 0))).map(l => <tr key={l.id} className={`linha-${STATUS[l.status]?.classe || 'agendado'}`}><td><input value={l.cota} onChange={e => atualizarLinha(l.id, 'cota', e.target.value)} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.placa} onChange={e => atualizarLinha(l.id, 'placa', placaLimpa(e.target.value))} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.peso} onChange={e => atualizarLinha(l.id, 'peso', e.target.value)} onBlur={() => persistirLinha(l.id)} placeholder="0,000" /></td><td><button className={l.ordem ? 'x-on' : ''} onClick={() => salvarLinha({ ...l, ordem: !l.ordem }, lote)}>X</button></td><td><button className={l.cte ? 'x-on' : ''} onClick={() => salvarLinha({ ...l, cte: !l.cte }, lote)}>X</button></td><td><input value={l.transportadora} onChange={e => atualizarLinha(l.id, 'transportadora', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.responsavel} onChange={e => atualizarLinha(l.id, 'responsavel', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td><td><select value={l.status} onChange={e => salvarLinha({ ...l, status: e.target.value }, lote)}><option value="agendado">AG. CARREGAMENTO</option><option value="carregado">CARREGADO</option><option value="cancelado">CANCELADO</option></select></td><td><input value={l.seguradora} onChange={e => atualizarLinha(l.id, 'seguradora', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.chamadoMdfe} onChange={e => atualizarLinha(l.id, 'chamadoMdfe', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td><td><button onClick={() => marcarCarregado(l)}>Carregou</button><button onClick={() => apagarLinha(l.id)}>Excluir</button></td></tr>)}{!st.listaDia.length && <tr><td colSpan="11" className="vazio">Nenhuma placa hoje. Use “Adicionar placa” ou “Gerar cotas do dia”.</td></tr>}</tbody><tfoot><tr><td colSpan="2">TOTAL DO DIA</td><td>{formatarPeso(st.pesoDia)}</td><td colSpan="8">{st.carregadosDia} carregados · {st.aguardandoDia} aguardando · restante lote {formatarPeso(st.restante)} ton</td></tr></tfoot></table></div></div>}</section> })}{!lotesDia.length && <div className="empty-main">Nenhum lote disponível neste filtro.</div>}</main></div>
          </>}

          {aba === 'lotes' && <section className="gestao-lotes-view">
            {formLoteSection}
            <section className="dia-metrics"><article><strong>{resumoGestao.ativos}</strong><span>Lotes ativos</span></article><article><strong>{resumoGestao.arquivados}</strong><span>Arquivados</span></article><article><strong>{formatarPeso(resumoGestao.peso)}</strong><span>Ton cadastradas</span></article><article><strong>{formatarPeso(resumoGestao.restante)}</strong><span>Ton restantes</span></article></section>
            <div className="dia-toolbar"><input value={buscaGestao} onChange={e => setBuscaGestao(e.target.value)} placeholder="🔍 Buscar lote, produto, origem ou destino..." /><button className="primary-btn" onClick={() => { limparFormLote(); window.scrollTo?.({ top: 0, behavior: 'smooth' }) }}>+ Novo lote</button></div>
            <div className="gestao-lista-lotes">{lotesGestao.map(lote => { const st = statsLote(lote); return <article key={lote.id} className="gestao-lote-card"><div><span>{lote.produto}</span><strong>Lote {lote.lote}</strong><p>{lote.origem} → {lote.destino}</p><div className="progress-line"><span style={{ width: `${st.progresso}%` }} /></div></div><div><small>Peso</small><b>{formatarPeso(st.pesoLote)} ton</b></div><div><small>Restante</small><b>{formatarPeso(st.restante)} ton</b></div><div><small>Cadência</small><b>{lote.cadencia}</b></div><div className="lote-actions-dia"><button onClick={(ev) => editarLote(lote, ev)}>Editar</button>{lote.status === 'ativo' ? <button onClick={(ev) => arquivarLote(lote, ev)}>Arquivar</button> : <button onClick={(ev) => reabrirLote(lote, ev)}>Reabrir</button>}<button className="danger" onClick={(ev) => excluirLote(lote, ev)}>Excluir</button></div></article> })}{!lotesGestao.length && <div className="empty-main">Nenhum lote encontrado.</div>}</div>
          </section>}
        </main>
      </div>
    </section>
  )
}
