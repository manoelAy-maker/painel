import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import * as legacy from '../lib/supabase'
import * as v2 from '../lib/supabaseV2'
import { gerarId } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import '../captacao-redesign.css'
import '../captacao-aggressive.css'

const STORAGE_KEY = 'captacoesVeiculosViaLog'
const OPERACOES = ['Farelo', 'Grãos']
const STATUS = {
  retornar: { label: 'Para retornar', next: 'negociando', ordem: 1 },
  negociando: { label: 'Negociando', next: 'aguardando_ordem', ordem: 2 },
  aguardando_ordem: { label: 'Aguardando ordem', next: 'ordem', ordem: 3 },
  ordem: { label: 'Com ordem', next: 'carregou', ordem: 4 },
  carregou: { label: 'Carregou', ordem: 5 },
  nao_carregou: { label: 'Não carregou', ordem: 6 },
}
const MODO_BANCO_INFO = {
  auto: { label: 'Verificando conexão', cor: '#94a3b8' },
  v2: { label: 'Nuvem online', cor: '#22c55e' },
  'v2+legado': { label: 'Nuvem + backup', cor: '#22c55e' },
  legado: { label: 'Banco antigo', cor: '#f59e0b' },
  local: { label: 'Salvo local', cor: '#ef4444' },
}
function telefone(v) { return String(v || '').replace(/[^0-9]/g, '') }
function formatarTelefone(v) {
  const n = telefone(v)
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
}
function hojeISO() { return new Date().toISOString().slice(0, 10) }
function agoraBR() { return new Date().toLocaleString('pt-BR') }
function statusKey(v) {
  const raw = v2.statusV2 ? v2.statusV2(v) : v
  if (raw === 'contatado') return 'retornar'
  return STATUS[raw] ? raw : 'retornar'
}
function normalizar(item) {
  return {
    ...item,
    id: item.id || gerarId(),
    nome: item.nome || item.motorista || '',
    numero: item.numero || item.telefone || '',
    operacao: item.operacao || item.produto || 'Farelo',
    status: statusKey(item.status),
    obs: item.obs || item.observacao || item.ultimaObs || '',
    quantidadeCargas: String(item.quantidadeCargas || item.quantidade_cargas || 1),
    captador: item.captador || item.usuario || '-',
    nomeCaptador: item.nomeCaptador || item.nomeUsuario || item.usuario || '-',
    filial: item.filial || 'jatai-go',
    data: item.data || agoraBR(),
    dataISO: item.dataISO || hojeISO(),
  }
}
const loadLocal = () => {
  try { return (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).map(normalizar) } catch { return [] }
}
const saveLocal = (lista) => localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))

export default function Captacao() {
  const { usuarioAtual, toast } = useApp()
  const [motoristas, setMotoristas] = useState(loadLocal)
  const [busca, setBusca] = useState('')
  const [filtroOp, setFiltroOp] = useState('Todas')
  const [carregando, setCarregando] = useState(false)
  const [modoBanco, setModoBanco] = useState('auto')
  const [form, setForm] = useState({ nome: '', numero: '', operacao: 'Farelo', quantidadeCargas: '1', obs: '' })
  const isAdmin = usuarioAtual?.cargo === 'Admin'
  const filialAtual = usuarioAtual?.filial || 'jatai-go'
  const captadorId = usuarioAtual?.usuario || '-'
  const nomeCaptador = usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'
  const bancoInfo = MODO_BANCO_INFO[modoBanco] || MODO_BANCO_INFO.auto

  useEffect(() => { saveLocal(motoristas) }, [motoristas])
  useEffect(() => {
    const carregar = async () => {
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
  const lista = useMemo(() => base.filter(m => filtroOp === 'Todas' || m.operacao === filtroOp).filter(m => !busca || [m.nome, m.numero, m.operacao, m.obs].join(' ').toLowerCase().includes(busca.toLowerCase())), [base, filtroOp, busca])
  const stats = { total: base.length, trabalho: base.filter(m => ['retornar', 'negociando', 'aguardando_ordem'].includes(m.status)).length, ordem: base.filter(m => m.status === 'ordem').length, carregou: base.filter(m => m.status === 'carregou').length, perda: base.filter(m => m.status === 'nao_carregou').length }
  const efetivo = stats.total ? Math.round((stats.carregou / stats.total) * 100) : 0

  const persistir = async (item, novaLista, msg) => {
    setMotoristas(novaLista)
    saveLocal(novaLista)
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
  const novo = async () => {
    if (!form.nome.trim() || !form.numero.trim()) { alert('Informe motorista e telefone.'); return }
    const item = { id: gerarId(), nome: form.nome.trim(), motorista: form.nome.trim(), numero: formatarTelefone(form.numero), telefone: formatarTelefone(form.numero), operacao: form.operacao, produto: form.operacao, quantidadeCargas: String(Math.max(1, Number(form.quantidadeCargas || 1) || 1)), obs: form.obs.trim(), status: 'retornar', captador: captadorId, usuario: captadorId, nomeCaptador, nomeUsuario: nomeCaptador, filial: filialAtual, data: agoraBR(), dataISO: hojeISO(), ultimaAtualizacao: agoraBR(), atualizadoPor: captadorId }
    await persistir(item, [item, ...motoristas], 'Lead cadastrado.')
    setForm({ nome: '', numero: '', operacao: form.operacao, quantidadeCargas: '1', obs: '' })
  }
  const atualizar = async (m, dados, msg) => {
    const item = { ...m, ...dados, ultimaAtualizacao: agoraBR(), atualizadoPor: captadorId }
    await persistir(item, motoristas.map(x => String(x.id) === String(m.id) ? item : x), msg)
  }
  const avancar = (m) => STATUS[m.status]?.next && atualizar(m, { status: STATUS[m.status].next }, 'Status atualizado.')
  const perda = (m) => atualizar(m, { status: 'nao_carregou', obs: m.obs || 'Não carregou' }, 'Registrado como perda.')
  const excluir = (m) => confirm('Excluir lead?') && persistir(m, motoristas.filter(x => String(x.id) !== String(m.id)), 'Lead excluído.')
  const coluna = key => lista.filter(m => m.status === key)

  return (
    <div className="cap-real-shell">
      <section className="cap-real-top"><div className="cap-real-title"><span>Captação real</span><h1>Mesa de veículos</h1><p>Fluxo operacional de motorista: retorno, negociação, ordem e carregamento.</p></div><div className="cap-real-form"><input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Motorista" /><input value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} placeholder="Telefone" /><select value={form.operacao} onChange={e => setForm(p => ({ ...p, operacao: e.target.value }))}>{OPERACOES.map(op => <option key={op}>{op}</option>)}</select><input value={form.quantidadeCargas} onChange={e => setForm(p => ({ ...p, quantidadeCargas: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="Cargas" /><input value={form.obs} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} placeholder="Observação rápida" /><button onClick={novo}>Cadastrar</button></div></section>
      <section className="cap-real-kpis"><div><small>Captador</small><strong>{nomeCaptador}</strong><em>{isAdmin ? 'Geral' : nomeFilial(filialAtual)}</em></div><div><small>Leads</small><strong>{stats.total}</strong></div><div><small>Em trabalho</small><strong>{stats.trabalho}</strong></div><div><small>Com ordem</small><strong>{stats.ordem}</strong></div><div><small>Carregou</small><strong>{stats.carregou}</strong></div><div><small>Perdas</small><strong>{stats.perda}</strong></div><div><small>Efetivo</small><strong>{efetivo}%</strong></div></section>
      <section className="cap-real-filters"><div><span>Buscar</span><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="motorista, telefone ou observação" /></div>{['Todas', ...OPERACOES].map(op => <button key={op} onClick={() => setFiltroOp(op)} className={filtroOp === op ? 'active' : ''}>{op}</button>)}<span className="cap-real-sync" style={{ borderColor: `${bancoInfo.cor}55` }}><i style={{ background: bancoInfo.cor }} />{carregando ? 'Sincronizando...' : bancoInfo.label}</span></section>
      <section className="cap-real-board">{Object.entries(STATUS).map(([key, st]) => <div className="cap-real-col" key={key}><header><strong>{st.label}</strong><span>{coluna(key).length}</span></header><div className="cap-real-list">{coluna(key).length === 0 && <div className="cap-real-empty">Sem itens</div>}{coluna(key).map(m => <article className={`cap-real-card ${key === 'nao_carregou' ? 'danger' : ''}`} key={m.id}><div className="cap-real-card-head"><strong>{m.nome}</strong><span>{m.operacao}</span></div><p>{m.numero || 'Sem telefone'}</p>{m.obs && <p>{m.obs}</p>}<footer>{STATUS[m.status]?.next && <button onClick={() => avancar(m)}>Avançar</button>}{!['carregou', 'nao_carregou'].includes(m.status) && <button onClick={() => perda(m)}>Perda</button>}<button onClick={() => atualizar(m, { status: 'retornar' }, 'Marcado para retorno.')}>Retorno</button><button onClick={() => excluir(m)}>Excluir</button></footer></article>)}</div></div>)}</section>
    </div>
  )
}
