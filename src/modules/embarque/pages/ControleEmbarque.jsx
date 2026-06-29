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
  aguardando: { label: 'AGUARDANDO', classe: 'aguardando' },
  agendado: { label: 'AGENDADO', classe: 'agendado' },
  carregado: { label: 'CARREGADO', classe: 'carregado' },
  cancelado: { label: 'CANCELADO', classe: 'cancelado' },
}

const LOTE_VAZIO = { produto: 'SOJA', origem: '', destino: '', lote: '', pesoLote: '', cadencia: '10' }
const LINHA_VAZIA = {
  cota: '', placa: '', peso: '', ordem: true, cte: true, transportadora: '', responsavel: '',
  status: 'agendado', seguradora: 'APROVADO', chamadoMdfe: '', motorista: '', cpf: '', telefone: '',
  eixos: '', notaFiscal: '', observacao: ''
}
const QUICK_VAZIO = { loteId: '', placa: '', motorista: '', telefone: '', cpf: '', eixos: '', peso: '', transportadora: '', notaFiscal: '', observacao: '' }

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
  return {
    id: row.local_id || row.id,
    produto: row.produto || dados.produto || 'SOJA',
    origem: row.origem || '',
    destino: row.destino || '',
    lote: row.lote || '',
    pesoLote: row.peso_lote ? formatarPeso(row.peso_lote) : (dados.pesoLote || ''),
    cadencia: String(row.cadencia || dados.cadencia || 0),
    filial: row.filial_id || dados.filial || 'jatai-go',
    criadoPor: row.criado_por || dados.criadoPor || '-',
    status: row.status || 'ativo'
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
    chamadoMdfe: dados.chamadoMdfe || '',
    motorista: row.motorista || '',
    cpf: row.cpf || dados.cpf || '',
    telefone: row.telefone || '',
    eixos: row.eixos || dados.eixos || '',
    notaFiscal: row.nota_fiscal || dados.notaFiscal || '',
    observacao: row.observacao || '',
    filial: row.filial_id || dados.filial || 'jatai-go'
  }
}

function lotePayload(lote, usuarioAtual) {
  const filial = lote.filial || usuarioAtual?.filial || 'jatai-go'
  return {
    local_id: String(lote.id), filial_id: filial, produto: lote.produto || null, origem: lote.origem || null,
    destino: lote.destino || null, lote: lote.lote || null, peso_lote: numeroPeso(lote.pesoLote) || null,
    cadencia: Math.max(0, Number(lote.cadencia || 0) || 0), data_inicio: hojeISO(), data_fim: null,
    status: lote.status || 'ativo', criado_por: null,
    dados: { filial, pesoLote: lote.pesoLote || '', criadoPor: usuarioAtual?.usuario || '-', nomeCriador: usuarioAtual?.nome || usuarioAtual?.usuario || '-' }
  }
}

function linhaPayload(linha, lote, usuarioAtual) {
  const filial = lote?.filial || linha.filial || usuarioAtual?.filial || 'jatai-go'
  const status = linha.status || 'agendado'
  return {
    local_id: String(linha.id), lote_local_id: String(linha.loteId), data_operacao: linha.dia, cota: Number(linha.cota || 0) || null,
    filial_id: filial, placa: placaLimpa(linha.placa), placa_normalizada: placaLimpa(linha.placa),
    peso: numeroPeso(linha.peso) || null, ordem_carregamento: linha.ordem ? 'X' : '', cte: linha.cte ? 'X' : '',
    transportadora: linha.transportadora || null, motorista: linha.motorista || null,
    motorista_normalizado: normalizar(linha.motorista || ''), cpf: linha.cpf || null, telefone: formatarTelefone(linha.telefone),
    eixos: linha.eixos || null, nota_fiscal: linha.notaFiscal || null, status,
    data_carregamento: status === 'carregado' ? new Date().toISOString() : null,
    produto: lote?.produto || linha.produto || null, origem: lote?.origem || linha.origem || null, destino: lote?.destino || linha.destino || null,
    lote: lote?.lote || linha.lote || null, responsavel_usuario: null, observacao: linha.observacao || null,
    dados: { responsavel: linha.responsavel || '', seguradora: linha.seguradora || 'APROVADO', chamadoMdfe: linha.chamadoMdfe || '', cpf: linha.cpf || '', eixos: linha.eixos || '', notaFiscal: linha.notaFiscal || '', filial }
  }
}

export default function ControleEmbarque() {
  const { usuarioAtual, toast } = useApp()
  const [lotes, setLotes] = useState(() => ler(LOTES_KEY))
  const [linhas, setLinhas] = useState(() => ler(LINHAS_KEY))
  const [formLote, setFormLote] = useState(LOTE_VAZIO)
  const [quick, setQuick] = useState(QUICK_VAZIO)
  const [editandoLoteId, setEditandoLoteId] = useState('')
  const [mostrarArquivados, setMostrarArquivados] = useState(false)
  const [busca, setBusca] = useState('')
  const [produtoFiltro, setProdutoFiltro] = useState('TODOS')
  const [diaAtivo, setDiaAtivo] = useState(hojeISO())
  const [loteAberto, setLoteAberto] = useState('')
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
        let qLinhas = sb.from(T_LINHAS).select('*').order('data_operacao', { ascending: false }).order('cota', { ascending: true })
        if (!isAdmin) { qLotes = qLotes.eq('filial_id', filialAtual); qLinhas = qLinhas.eq('filial_id', filialAtual) }
        const [{ data: lotesDb, error: e1 }, { data: linhasDb, error: e2 }] = await Promise.all([qLotes, qLinhas])
        if (e1 || e2) throw e1 || e2
        if (!vivo) return
        const lotesNorm = (lotesDb || []).map(loteRowToItem)
        const linhasNorm = (linhasDb || []).filter(r => r.lote_local_id).map(linhaRowToItem)
        if (lotesNorm.length) setLotes(lotesNorm)
        if (linhasNorm.length) setLinhas(linhasNorm)
        setModoBanco('online')
      } catch {
        if (vivo) setModoBanco('local')
      }
    }
    carregar()
    return () => { vivo = false }
  }, [isAdmin, filialAtual])

  const lotesDaFilial = useMemo(() => lotes.filter(l => isAdmin || (l.filial || filialAtual) === filialAtual), [lotes, isAdmin, filialAtual])
  const produtos = useMemo(() => [...new Set(lotesDaFilial.map(l => String(l.produto || '').toUpperCase()).filter(Boolean))], [lotesDaFilial])

  const statsLote = (lote) => {
    const listaLote = linhas.filter(l => String(l.loteId) === String(lote.id))
    const listaDia = listaLote.filter(l => l.dia === diaAtivo)
    const pesoLote = numeroPeso(lote.pesoLote)
    const pesoCarregadoLote = listaLote.reduce((s, l) => s + (l.status === 'carregado' ? numeroPeso(l.peso) : 0), 0)
    const pesoDia = listaDia.reduce((s, l) => s + (l.status === 'carregado' ? numeroPeso(l.peso) : 0), 0)
    const restante = Math.max(0, pesoLote - pesoCarregadoLote)
    const progresso = pesoLote > 0 ? Math.min(100, Math.round((pesoCarregadoLote / pesoLote) * 100)) : 0
    return { listaLote, listaDia, pesoLote, pesoCarregadoLote, pesoDia, restante, progresso, carregadosDia: listaDia.filter(l => l.status === 'carregado').length, aguardandoDia: listaDia.filter(l => l.status !== 'carregado').length }
  }

  const lotesDia = useMemo(() => {
    const q = normalizar(busca)
    return lotesDaFilial
      .filter(l => mostrarArquivados ? l.status !== 'ativo' : l.status === 'ativo')
      .filter(l => produtoFiltro === 'TODOS' || normalizar(l.produto) === normalizar(produtoFiltro))
      .filter(l => {
        const st = statsLote(l)
        const texto = normalizar([l.produto, l.lote, l.origem, l.destino, ...st.listaDia.flatMap(x => [x.placa, x.motorista, x.telefone, x.transportadora, x.notaFiscal])].join(' '))
        return !q || texto.includes(q)
      })
      .filter(l => mostrarArquivados || statsLote(l).restante > 0 || statsLote(l).listaDia.length > 0)
  }, [lotesDaFilial, linhas, busca, produtoFiltro, mostrarArquivados, diaAtivo])

  const loteSelecionado = useMemo(() => lotesDia.find(l => String(l.id) === String(quick.loteId || loteAberto)) || lotesDia[0], [lotesDia, quick.loteId, loteAberto])
  const linhasDoDia = useMemo(() => lotesDia.flatMap(l => statsLote(l).listaDia.map(x => ({ ...x, loteResumo: l }))), [lotesDia, linhas, diaAtivo])
  const resumoDia = useMemo(() => ({
    lotes: lotesDia.length,
    caminhoes: linhasDoDia.length,
    carregados: linhasDoDia.filter(l => l.status === 'carregado').length,
    restante: lotesDia.reduce((s, l) => s + statsLote(l).restante, 0)
  }), [lotesDia, linhasDoDia, linhas])
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
    setLoteAberto(item.id); setQuick(q => ({ ...q, loteId: item.id })); limparFormLote()
    await persistirLote(item, anterior ? 'Lote atualizado.' : 'Lote criado.')
  }
  function editarLote(lote, ev) { ev?.stopPropagation?.(); setFormLote({ produto: lote.produto || 'SOJA', origem: lote.origem || '', destino: lote.destino || '', lote: lote.lote || '', pesoLote: String(lote.pesoLote || ''), cadencia: String(lote.cadencia || '10') }); setEditandoLoteId(lote.id); setLoteAberto(lote.id) }
  async function arquivarLote(lote, ev) { ev?.stopPropagation?.(); if (!confirm(`Arquivar lote ${lote.lote}?`)) return; const atualizado = { ...lote, status: 'finalizado' }; setLotes(lotes.map(l => String(l.id) === String(lote.id) ? atualizado : l)); await persistirLote(atualizado, 'Lote arquivado.') }
  async function excluirLote(lote, ev) {
    ev?.stopPropagation?.(); if (!confirm(`Excluir definitivamente o lote ${lote.lote} e todas as placas dele?`)) return
    const idsLinhas = linhas.filter(l => String(l.loteId) === String(lote.id)).map(l => String(l.id))
    setLotes(lotes.filter(l => String(l.id) !== String(lote.id))); setLinhas(linhas.filter(l => String(l.loteId) !== String(lote.id)))
    try { const sb = getClient(); await Promise.all(idsLinhas.map(id => sb.from(T_LINHAS).delete().eq('local_id', id))); await sb.from(T_LOTES).delete().eq('local_id', String(lote.id)); setModoBanco('online'); toast?.('Lote excluído.', 'ok') }
    catch { setModoBanco('local'); toast?.('Excluído localmente. Nuvem falhou.', 'warn') }
  }
  async function salvarLinha(linhaNova, loteRef) {
    const lote = loteRef || lotes.find(l => String(l.id) === String(linhaNova.loteId))
    setLinhas(prev => prev.some(l => String(l.id) === String(linhaNova.id)) ? prev.map(l => String(l.id) === String(linhaNova.id) ? linhaNova : l) : [...prev, linhaNova])
    try { const { error } = await getClient().from(T_LINHAS).upsert(linhaPayload(linhaNova, lote, usuarioAtual), { onConflict: 'local_id' }); if (error) throw error; setModoBanco('online') }
    catch { setModoBanco('local') }
  }
  function atualizarLinha(id, campo, valor) { setLinhas(prev => prev.map(l => String(l.id) === String(id) ? { ...l, [campo]: valor } : l)) }
  async function persistirLinha(id) { const linha = linhas.find(l => String(l.id) === String(id)); if (linha) await salvarLinha(linha) }
  function novaCota(lote) { const existentes = linhas.filter(l => String(l.loteId) === String(lote.id) && l.dia === diaAtivo); return Math.max(0, ...existentes.map(l => Number(l.cota || 0))) + 1 }
  async function lancarRapido(status = 'agendado') {
    const lote = loteSelecionado
    if (!lote) { alert('Cadastre ou selecione um lote primeiro.'); return }
    if (!placaLimpa(quick.placa)) { alert('Informe a placa.'); return }
    const item = { ...LINHA_VAZIA, ...quick, id: gerarId(), loteId: lote.id, dia: diaAtivo, cota: novaCota(lote), filial: lote.filial || filialAtual, status, placa: placaLimpa(quick.placa), telefone: formatarTelefone(quick.telefone), transportadora: String(quick.transportadora || '').toUpperCase(), notaFiscal: String(quick.notaFiscal || '').toUpperCase(), motorista: String(quick.motorista || '').toUpperCase(), eixos: String(quick.eixos || '').toUpperCase() }
    await salvarLinha(item, lote)
    setLoteAberto(lote.id)
    setQuick({ ...QUICK_VAZIO, loteId: lote.id, transportadora: quick.transportadora })
    toast?.(status === 'carregado' ? 'Carregado lançado.' : 'Placa lançada.', 'ok')
  }
  function adicionarLinha(lote) { const item = { ...LINHA_VAZIA, id: gerarId(), loteId: lote.id, dia: diaAtivo, cota: novaCota(lote), filial: lote.filial || filialAtual }; setLinhas(prev => [...prev, item]); setLoteAberto(lote.id) }
  function gerarCotasDoDia(lote) { const cadencia = Math.max(1, Number(lote.cadencia || 0) || 1); const existentes = linhas.filter(l => String(l.loteId) === String(lote.id) && l.dia === diaAtivo); const cotas = new Set(existentes.map(l => Number(l.cota))); const novas = []; for (let c = 1; c <= cadencia; c++) if (!cotas.has(c)) novas.push({ ...LINHA_VAZIA, id: gerarId(), loteId: lote.id, dia: diaAtivo, cota: c, filial: lote.filial || filialAtual }); setLinhas(prev => [...prev, ...novas]); setLoteAberto(lote.id) }
  async function apagarLinha(id) { if (!confirm('Excluir esta linha?')) return; setLinhas(prev => prev.filter(l => String(l.id) !== String(id))); try { await getClient().from(T_LINHAS).delete().eq('local_id', String(id)) } catch {} }
  async function marcarCarregado(linha) { await salvarLinha({ ...linha, status: 'carregado' }, linha.loteResumo || loteSelecionado) }

  return (
    <section className="embarque-page-v2">
      <header className="embarque-hero-v2">
        <div>
          <span>AYRES · Controle de Embarque</span>
          <h1>Lançamento fácil</h1>
          <p>Uma tela só para lançar placa, motorista e peso sem ficar caçando botão. Feito para operação rápida.</p>
        </div>
        <div className="embarque-hero-side">
          <button onClick={() => setDiaAtivo(addDias(diaAtivo, -1))}>‹</button>
          <strong>{dataBR(diaAtivo, { day: '2-digit', month: '2-digit' })}</strong>
          <button onClick={() => setDiaAtivo(addDias(diaAtivo, 1))}>›</button>
          <span className={`sync-pill ${modoBanco}`}>{modoBanco === 'online' ? 'Nuvem online' : modoBanco === 'local' ? 'Modo local' : 'Conectando'}</span>
        </div>
      </header>

      <section className="quick-launch-card">
        <div className="quick-title"><strong>🚚 Lançar rápido</strong><small>Selecione o lote, digite e aperte Enter</small></div>
        <select value={quick.loteId || loteSelecionado?.id || ''} onChange={e => { setQuick(q => ({ ...q, loteId: e.target.value })); setLoteAberto(e.target.value) }}>
          <option value="">Selecionar lote</option>{lotesDia.map(l => <option key={l.id} value={l.id}>{l.produto} · Lote {l.lote} · {l.origem} → {l.destino}</option>)}
        </select>
        <input autoFocus placeholder="Placa" value={quick.placa} onChange={e => setQuick(q => ({ ...q, placa: placaLimpa(e.target.value) }))} onKeyDown={e => { if (e.key === 'Enter') lancarRapido('agendado') }} />
        <input placeholder="Motorista" value={quick.motorista} onChange={e => setQuick(q => ({ ...q, motorista: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') lancarRapido('agendado') }} />
        <input placeholder="Telefone" value={quick.telefone} onChange={e => setQuick(q => ({ ...q, telefone: formatarTelefone(e.target.value) }))} onKeyDown={e => { if (e.key === 'Enter') lancarRapido('agendado') }} />
        <input placeholder="Peso ton" value={quick.peso} onChange={e => setQuick(q => ({ ...q, peso: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') lancarRapido('carregado') }} />
        <div className="quick-more"><input placeholder="CPF" value={quick.cpf} onChange={e => setQuick(q => ({ ...q, cpf: limparNumero(e.target.value).slice(0, 11) }))} /><input placeholder="Eixos" value={quick.eixos} onChange={e => setQuick(q => ({ ...q, eixos: e.target.value }))} /><input placeholder="Transportadora" value={quick.transportadora} onChange={e => setQuick(q => ({ ...q, transportadora: e.target.value }))} /><input placeholder="NF" value={quick.notaFiscal} onChange={e => setQuick(q => ({ ...q, notaFiscal: e.target.value }))} /></div>
        <div className="quick-buttons"><button onClick={() => lancarRapido('agendado')}>Lançar agendado</button><button className="done" onClick={() => lancarRapido('carregado')}>Lançar carregado</button></div>
      </section>

      <section className="embarque-metrics-v2">
        <article><strong>{resumoDia.lotes}</strong><span>Lotes ativos</span></article>
        <article><strong>{resumoDia.caminhoes}</strong><span>Caminhões no dia</span></article>
        <article><strong>{resumoDia.carregados}</strong><span>Carregados</span></article>
        <article><strong>{formatarPeso(resumoDia.restante)}</strong><span>Ton restantes</span></article>
      </section>

      <section className="embarque-toolbar-v2">
        <div className="days-strip">{diasTopo.map(d => <button key={d} className={d === diaAtivo ? 'active' : ''} onClick={() => setDiaAtivo(d)}>{d === hojeISO() ? 'Hoje' : dataBR(d, { day: '2-digit', month: '2-digit' })}</button>)}</div>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar placa, motorista, lote, NF..." />
        <select value={produtoFiltro} onChange={e => setProdutoFiltro(e.target.value)}><option value="TODOS">Todos produtos</option>{produtos.map(p => <option key={p} value={p}>{p}</option>)}</select>
        <button onClick={() => setMostrarArquivados(v => !v)}>{mostrarArquivados ? 'Ver ativos' : 'Arquivados'}</button>
      </section>

      <div className="embarque-grid-v2">
        <aside className="lote-create-v2">
          <div className="quick-title"><strong>{editandoLoteId ? 'Editar lote' : 'Novo lote'}</strong><small>Cadastro direto</small></div>
          <input placeholder="Produto" value={formLote.produto} onChange={e => setFormLote(f => ({ ...f, produto: e.target.value.toUpperCase() }))} />
          <input placeholder="Origem" value={formLote.origem} onChange={e => setFormLote(f => ({ ...f, origem: e.target.value.toUpperCase() }))} />
          <input placeholder="Destino" value={formLote.destino} onChange={e => setFormLote(f => ({ ...f, destino: e.target.value.toUpperCase() }))} />
          <input placeholder="Lote" value={formLote.lote} onChange={e => setFormLote(f => ({ ...f, lote: e.target.value }))} />
          <input type="number" step="0.001" placeholder="Peso total ton" value={formLote.pesoLote} onChange={e => setFormLote(f => ({ ...f, pesoLote: e.target.value }))} />
          <input type="number" placeholder="Cotas do dia" value={formLote.cadencia} onChange={e => setFormLote(f => ({ ...f, cadencia: e.target.value }))} />
          <button onClick={salvarLote}>{editandoLoteId ? 'Salvar lote' : '+ Criar lote'}</button>
          {editandoLoteId && <button className="secondary" onClick={limparFormLote}>Cancelar edição</button>}
        </aside>

        <main className="lotes-area-v2">
          {lotesDia.map(lote => {
            const st = statsLote(lote)
            const aberto = String(loteAberto || loteSelecionado?.id) === String(lote.id)
            return <section className={`lote-card-v2 ${aberto ? 'open' : ''}`} key={lote.id}>
              <button className="lote-head-v2" onClick={() => { setLoteAberto(aberto ? '' : lote.id); setQuick(q => ({ ...q, loteId: lote.id })) }}>
                <div><strong>{lote.produto} · Lote {lote.lote}</strong><span>{lote.origem} → {lote.destino}</span></div>
                <div><small>Carregado</small><b>{formatarPeso(st.pesoCarregadoLote)} t</b></div>
                <div><small>Restante</small><b>{formatarPeso(st.restante)} t</b></div>
                <div className="bar"><i style={{ width: `${st.progresso}%` }} /></div>
              </button>
              {aberto && <div className="lote-body-v2">
                <div className="lote-actions-v2"><button onClick={() => gerarCotasDoDia(lote)}>Gerar cotas</button><button onClick={() => adicionarLinha(lote)}>+ Linha vazia</button><button onClick={(ev) => editarLote(lote, ev)}>Editar lote</button><button onClick={(ev) => arquivarLote(lote, ev)}>Arquivar</button><button className="danger" onClick={(ev) => excluirLote(lote, ev)}>Excluir</button><span>{st.carregadosDia} carregados · {st.aguardandoDia} pendentes · {formatarPeso(st.pesoDia)} t hoje</span></div>
                <div className="table-wrap-v2"><table className="embarque-table-v2"><thead><tr><th>Cota</th><th>Placa</th><th>Motorista</th><th>Telefone</th><th>Peso</th><th>NF</th><th>Transp.</th><th>Status</th><th>Doc</th><th>Ações</th></tr></thead><tbody>{st.listaDia.sort((a, b) => Number(a.cota || 0) - Number(b.cota || 0)).map(l => <tr key={l.id} className={STATUS[l.status]?.classe || 'agendado'}><td><input value={l.cota} onChange={e => atualizarLinha(l.id, 'cota', e.target.value)} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.placa} onChange={e => atualizarLinha(l.id, 'placa', placaLimpa(e.target.value))} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.motorista} onChange={e => atualizarLinha(l.id, 'motorista', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.telefone} onChange={e => atualizarLinha(l.id, 'telefone', formatarTelefone(e.target.value))} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.peso} onChange={e => atualizarLinha(l.id, 'peso', e.target.value)} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.notaFiscal} onChange={e => atualizarLinha(l.id, 'notaFiscal', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td><td><input value={l.transportadora} onChange={e => atualizarLinha(l.id, 'transportadora', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td><td><select value={l.status} onChange={e => salvarLinha({ ...l, status: e.target.value }, lote)}>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></td><td><button className={l.ordem ? 'doc-on' : ''} onClick={() => salvarLinha({ ...l, ordem: !l.ordem }, lote)}>OC</button><button className={l.cte ? 'doc-on' : ''} onClick={() => salvarLinha({ ...l, cte: !l.cte }, lote)}>CTE</button></td><td><button onClick={() => marcarCarregado({ ...l, loteResumo: lote })}>Carregou</button><button onClick={() => apagarLinha(l.id)}>Excluir</button></td></tr>)}{!st.listaDia.length && <tr><td colSpan="10" className="empty-row">Sem placas neste dia. Use o lançamento fácil acima.</td></tr>}</tbody></table></div>
              </div>}
            </section>
          })}
          {!lotesDia.length && <div className="empty-main-v2">Nenhum lote nesse filtro. Cadastre um lote na lateral e lance as placas por cima.</div>}
        </main>
      </div>
    </section>
  )
}
