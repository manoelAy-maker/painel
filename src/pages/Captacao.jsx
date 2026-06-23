import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import * as legacy from '../lib/supabase'
import * as v2 from '../lib/supabaseV2'
import { gerarId } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import '../captacao-aggressive.css'

const STORAGE_KEY = 'captacoesVeiculosViaLog'
const OPERACOES = ['Farelo', 'Grãos']
const STATUS = {
  lead: { label: 'Lead', next: 'ordem', ordem: 1 },
  ordem: { label: 'Com ordem', next: 'carregou', ordem: 2 },
  carregou: { label: 'Carregou', ordem: 3 },
  nao_carregou: { label: 'Não carregou', ordem: 4 },
}
const MODO_BANCO_INFO = {
  auto: { label: 'Verificando', cor: '#94a3b8' },
  v2: { label: 'Nuvem online', cor: '#22c55e' },
  'v2+legado': { label: 'Nuvem online', cor: '#22c55e' },
  legado: { label: 'Banco antigo', cor: '#f59e0b' },
  local: { label: 'Local', cor: '#ef4444' },
}

function limparNumero(v) { return String(v || '').replace(/[^0-9]/g, '') }
function formatarTelefone(v) {
  const n = limparNumero(v)
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
}
function agoraBR() { return new Date().toLocaleString('pt-BR') }
function hojeISO() { return new Date().toISOString().slice(0, 10) }
function normalizarStatus(s) {
  if (['contatado', 'retornar', 'negociando', 'aguardando_ordem'].includes(s)) return 'lead'
  return STATUS[s] ? s : 'lead'
}
function normalizar(item) {
  return {
    ...item,
    id: item.id || gerarId(),
    nome: item.nome || item.motorista || '',
    numero: item.numero || item.telefone || '',
    operacao: item.operacao || item.produto || 'Farelo',
    status: normalizarStatus(item.status),
    obs: item.obs || item.observacao || item.ultimaObs || '',
    quantidadeCargas: String(item.quantidadeCargas || item.quantidade_cargas || 1),
    captador: item.captador || item.usuario || '-',
    nomeCaptador: item.nomeCaptador || item.nomeUsuario || item.usuario || '-',
    filial: item.filial || 'jatai-go',
    data: item.data || agoraBR(),
    dataISO: item.dataISO || hojeISO(),
  }
}
function carregarLocal() {
  try { return (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).map(normalizar) } catch { return [] }
}
function salvarLocal(lista) { localStorage.setItem(STORAGE_KEY, JSON.stringify(lista)) }

export default function Captacao() {
  const { usuarioAtual, toast } = useApp()
  const [motoristas, setMotoristas] = useState(carregarLocal)
  const [busca, setBusca] = useState('')
  const [filtroOp, setFiltroOp] = useState('Todas')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [modoBanco, setModoBanco] = useState('auto')
  const [carregando, setCarregando] = useState(false)
  const [form, setForm] = useState({ nome: '', numero: '', operacao: 'Farelo', quantidadeCargas: '1', obs: '' })

  const isAdmin = usuarioAtual?.cargo === 'Admin'
  const filialAtual = usuarioAtual?.filial || 'jatai-go'
  const captadorId = usuarioAtual?.usuario || '-'
  const nomeCaptador = usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'
  const bancoInfo = MODO_BANCO_INFO[modoBanco] || MODO_BANCO_INFO.auto

  useEffect(() => { salvarLocal(motoristas) }, [motoristas])
  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      try {
        const listaV2 = await v2.listarCaptacoesV2({ admin: isAdmin, filial: filialAtual })
        if (listaV2.length) setMotoristas(listaV2.map(normalizar))
        setModoBanco('v2')
      } catch {
        try {
          const rows = await legacy.baixarTodos(isAdmin ? null : filialAtual)
          const lista = rows.filter(r => r.tipo === 'captacao').map(r => normalizar({ ...r.dados, filial: r.filial || r.dados?.filial }))
          if (lista.length) setMotoristas(lista)
          setModoBanco('legado')
        } catch { setModoBanco('local') }
      } finally { setCarregando(false) }
    }
    carregar()
  }, [isAdmin, filialAtual])

  const base = useMemo(() => motoristas.filter(m => {
    if (!isAdmin && (m.captador || m.usuario) !== captadorId) return false
    if (!isAdmin && (m.filial || filialAtual) !== filialAtual) return false
    return true
  }), [motoristas, isAdmin, captadorId, filialAtual])

  const lista = useMemo(() => base
    .filter(m => filtroOp === 'Todas' || m.operacao === filtroOp)
    .filter(m => filtroStatus === 'Todos' || m.status === filtroStatus)
    .filter(m => !busca || [m.nome, m.numero, m.operacao, m.obs, STATUS[m.status]?.label].join(' ').toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => (STATUS[a.status]?.ordem || 0) - (STATUS[b.status]?.ordem || 0)), [base, busca, filtroOp, filtroStatus])

  const stats = {
    total: base.length,
    ordem: base.filter(m => ['ordem', 'carregou'].includes(m.status)).length,
    carregou: base.filter(m => m.status === 'carregou').length,
    naoCarregou: base.filter(m => m.status === 'nao_carregou').length,
  }
  const conversao = stats.total ? Math.round((stats.carregou / stats.total) * 100) : 0

  async function persistir(item, novaLista, msg) {
    setMotoristas(novaLista)
    salvarLocal(novaLista)
    try {
      await v2.salvarCaptacaoV2(item, usuarioAtual)
      try { await legacy.salvar(item, 'captacao', item.filial) } catch {}
      setModoBanco('v2+legado')
      toast?.(msg, 'ok')
    } catch {
      try { await legacy.salvar(item, 'captacao', item.filial); setModoBanco('legado'); toast?.(msg, 'ok') }
      catch { setModoBanco('local'); toast?.('Salvo localmente. Nuvem falhou.', 'warn') }
    }
  }

  async function cadastrar() {
    if (!form.nome.trim() || !form.numero.trim()) { alert('Informe motorista e telefone.'); return }
    const item = {
      id: gerarId(), nome: form.nome.trim(), motorista: form.nome.trim(), numero: formatarTelefone(form.numero), telefone: formatarTelefone(form.numero),
      operacao: form.operacao, produto: form.operacao, quantidadeCargas: String(Math.max(1, Number(form.quantidadeCargas || 1) || 1)), obs: form.obs.trim(),
      status: 'lead', captador: captadorId, usuario: captadorId, nomeCaptador, nomeUsuario: nomeCaptador, filial: filialAtual, data: agoraBR(), dataISO: hojeISO(), atualizadoPor: captadorId,
    }
    await persistir(item, [item, ...motoristas], 'Lead cadastrado.')
    setForm({ nome: '', numero: '', operacao: form.operacao, quantidadeCargas: '1', obs: '' })
  }
  async function atualizar(m, dados, msg) {
    const item = { ...m, ...dados, atualizadoPor: captadorId, ultimaAtualizacao: agoraBR() }
    await persistir(item, motoristas.map(x => String(x.id) === String(m.id) ? item : x), msg)
  }
  const avancar = m => STATUS[m.status]?.next && atualizar(m, { status: STATUS[m.status].next }, 'Status atualizado.')
  const perda = m => atualizar(m, { status: 'nao_carregou', obs: m.obs || 'Não carregou' }, 'Marcado como não carregou.')
  const retorno = m => atualizar(m, { status: 'lead' }, 'Marcado para retorno.')
  const excluir = m => confirm('Excluir lead?') && persistir(m, motoristas.filter(x => String(x.id) !== String(m.id)), 'Lead excluído.')

  return (
    <div className="cap-clean-shell">
      <section className="cap-clean-form">
        <div className="cap-clean-title">
          <span>Captação operacional</span>
          <h1>Captação de veículos</h1>
          <p>Cadastre o motorista e acompanhe o status sem bagunça.</p>
        </div>
        <div className="cap-clean-fields">
          <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Motorista" />
          <input value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} placeholder="Telefone" />
          <select value={form.operacao} onChange={e => setForm(p => ({ ...p, operacao: e.target.value }))}>{OPERACOES.map(op => <option key={op}>{op}</option>)}</select>
          <input value={form.quantidadeCargas} onChange={e => setForm(p => ({ ...p, quantidadeCargas: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="Cargas" />
          <input value={form.obs} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} placeholder="Observação rápida" />
          <button onClick={cadastrar}>Cadastrar</button>
        </div>
      </section>

      <section className="cap-clean-stats">
        <div><small>Captador</small><strong>{nomeCaptador}</strong><em>{isAdmin ? 'Geral' : nomeFilial(filialAtual)}</em></div>
        <div><small>Leads</small><strong>{stats.total}</strong></div>
        <div><small>Com ordem</small><strong>{stats.ordem}</strong></div>
        <div><small>Carregou</small><strong>{stats.carregou}</strong></div>
        <div><small>Não carregou</small><strong>{stats.naoCarregou}</strong></div>
        <div><small>Efetivo</small><strong>{conversao}%</strong></div>
      </section>

      <section className="cap-clean-toolbar">
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar motorista, telefone ou observação..." />
        {['Todas', ...OPERACOES].map(op => <button key={op} onClick={() => setFiltroOp(op)} className={filtroOp === op ? 'active' : ''}>{op}</button>)}
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option value="Todos">Todos status</option>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select>
        <span><i style={{ background: bancoInfo.cor }} />{carregando ? 'Sincronizando...' : bancoInfo.label}</span>
      </section>

      <section className="cap-clean-list">
        <header><strong>Fila de captação</strong><span>{lista.length} registro(s)</span></header>
        {lista.length === 0 && <div className="cap-clean-empty">Nenhum lead ainda. Cadastre no topo da tela.</div>}
        {lista.map(m => <article className={`cap-clean-row ${m.status}`} key={m.id}>
          <div className="cap-clean-main"><strong>{m.nome}</strong><span>{m.numero || 'Sem telefone'} · {m.operacao} · {m.quantidadeCargas || 1} carga(s)</span>{m.obs && <p>{m.obs}</p>}</div>
          <div className="cap-clean-status">{STATUS[m.status]?.label || 'Lead'}</div>
          <div className="cap-clean-actions">
            {STATUS[m.status]?.next && <button onClick={() => avancar(m)}>Avançar</button>}
            {!['carregou', 'nao_carregou'].includes(m.status) && <button onClick={() => perda(m)}>Não carregou</button>}
            <button onClick={() => retorno(m)}>Retorno</button>
            <button onClick={() => excluir(m)}>Excluir</button>
          </div>
        </article>)}
      </section>
    </div>
  )
}
