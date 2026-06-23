import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import * as legacy from '../lib/supabase'
import * as v2 from '../lib/supabaseV2'
import { gerarId } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import '../captacao-aggressive.css'

const STORAGE_KEY = 'captacoesVeiculosViaLog'
const OPERACOES = ['Farelo', 'Grãos']
const EIXOS = ['6 eixos', '7 eixos', '9 eixos']
const STATUS = {
  lead: { label: 'Lead', next: 'negociando', ordem: 1 },
  negociando: { label: 'Negociação', next: 'retorno', ordem: 2 },
  retorno: { label: 'Retorno', next: 'fechado', ordem: 3 },
  fechado: { label: 'Fechado', next: 'carregou', ordem: 4 },
  carregou: { label: 'Carregou', ordem: 5 },
  perdido: { label: 'Sem interesse', ordem: 6 },
}
const MODO_BANCO_INFO = {
  auto: { label: 'Verificando', cor: '#94a3b8' },
  v2: { label: 'Nuvem online', cor: '#22c55e' },
  'v2+legado': { label: 'Nuvem online', cor: '#22c55e' },
  legado: { label: 'Banco antigo', cor: '#f59e0b' },
  local: { label: 'Local', cor: '#ef4444' },
}
const EMPTY = { nome: '', cpf: '', numero: '', placa: '', eixos: '9 eixos', operacao: 'Farelo', status: 'lead', lembrete: '', obs: '', quantidadeCargas: '1' }

function limparNumero(v) { return String(v || '').replace(/[^0-9]/g, '') }
function formatarTelefone(v) {
  const n = limparNumero(v)
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
}
function formatarCpf(v) {
  const n = limparNumero(v).slice(0, 11)
  if (n.length <= 3) return n
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}
function agoraBR() { return new Date().toLocaleString('pt-BR') }
function hojeISO() { return new Date().toISOString().slice(0, 10) }
function statusNormalizado(s) {
  if (['contatado', 'retornar'].includes(s)) return 'lead'
  if (s === 'ordem') return 'fechado'
  if (s === 'nao_carregou') return 'perdido'
  return STATUS[s] ? s : 'lead'
}
function normalizar(item) {
  return {
    ...item,
    id: item.id || gerarId(),
    nome: item.nome || item.motorista || '',
    cpf: item.cpf || '',
    numero: item.numero || item.telefone || '',
    placa: String(item.placa || '').toUpperCase(),
    eixos: item.eixos || '9 eixos',
    operacao: item.operacao || item.produto || 'Farelo',
    status: statusNormalizado(item.status),
    lembrete: item.lembrete || '',
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
function lembreteTexto(valor) {
  if (!valor) return 'Sem lembrete'
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return valor
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function Captacao() {
  const { usuarioAtual, toast } = useApp()
  const [motoristas, setMotoristas] = useState(carregarLocal)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [abaRapida, setAbaRapida] = useState('Todos')
  const [modoBanco, setModoBanco] = useState('auto')
  const [carregando, setCarregando] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editandoId, setEditandoId] = useState(null)

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

  const hoje = new Date().toISOString().slice(0, 10)
  const lista = useMemo(() => base
    .filter(m => filtroStatus === 'Todos' || m.status === filtroStatus)
    .filter(m => abaRapida === 'Todos' || (abaRapida === 'Retorno hoje' && String(m.lembrete || '').slice(0, 10) === hoje) || (abaRapida === 'Fechados' && ['fechado', 'carregou'].includes(m.status)) || (abaRapida === 'Atrasados' && m.lembrete && String(m.lembrete).slice(0, 10) < hoje && !['fechado', 'carregou', 'perdido'].includes(m.status)))
    .filter(m => !busca || [m.nome, m.cpf, m.placa, m.numero, m.obs, STATUS[m.status]?.label].join(' ').toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => (STATUS[a.status]?.ordem || 0) - (STATUS[b.status]?.ordem || 0)), [base, busca, filtroStatus, abaRapida, hoje])

  const stats = {
    total: base.length,
    retorno: base.filter(m => m.status === 'retorno').length,
    fechado: base.filter(m => ['fechado', 'carregou'].includes(m.status)).length,
    conversao: base.length ? Math.round((base.filter(m => ['fechado', 'carregou'].includes(m.status)).length / base.length) * 100) : 0,
  }

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

  async function salvar() {
    if (!form.nome.trim() || !form.numero.trim()) { alert('Informe motorista e telefone.'); return }
    const item = {
      ...(editandoId ? motoristas.find(m => String(m.id) === String(editandoId)) : {}),
      id: editandoId || gerarId(), nome: form.nome.trim(), motorista: form.nome.trim(), cpf: formatarCpf(form.cpf), numero: formatarTelefone(form.numero), telefone: formatarTelefone(form.numero), placa: form.placa.toUpperCase(), eixos: form.eixos,
      operacao: form.operacao, produto: form.operacao, quantidadeCargas: String(Math.max(1, Number(form.quantidadeCargas || 1) || 1)), status: form.status, lembrete: form.lembrete, obs: form.obs.trim(),
      captador: captadorId, usuario: captadorId, nomeCaptador, nomeUsuario: nomeCaptador, filial: filialAtual, data: editandoId ? (motoristas.find(m => String(m.id) === String(editandoId))?.data || agoraBR()) : agoraBR(), dataISO: hojeISO(), atualizadoPor: captadorId,
    }
    const novaLista = editandoId ? motoristas.map(m => String(m.id) === String(editandoId) ? item : m) : [item, ...motoristas]
    await persistir(item, novaLista, editandoId ? 'Motorista atualizado.' : 'Motorista salvo.')
    setForm(EMPTY); setEditandoId(null)
  }
  const editar = m => { setEditandoId(m.id); setForm({ nome: m.nome || '', cpf: m.cpf || '', numero: m.numero || '', placa: m.placa || '', eixos: m.eixos || '9 eixos', operacao: m.operacao || 'Farelo', status: m.status || 'lead', lembrete: m.lembrete || '', obs: m.obs || '', quantidadeCargas: String(m.quantidadeCargas || 1) }) }
  const atualizar = async (m, status) => persistir({ ...m, status, atualizadoPor: captadorId }, motoristas.map(x => String(x.id) === String(m.id) ? { ...m, status, atualizadoPor: captadorId } : x), 'Status atualizado.')
  const excluir = m => confirm('Excluir lead?') && persistir(m, motoristas.filter(x => String(x.id) !== String(m.id)), 'Lead excluído.')

  return (
    <div className="cap-crm-shell">
      <section className="cap-crm-hero">
        <div>
          <span>Central de captação</span>
          <h1>Captação de Motoristas</h1>
          <p>Organize contatos, retornos, placas e negociações em uma fila limpa no padrão AYRES.</p>
        </div>
        <div className="cap-crm-sync"><i style={{ background: bancoInfo.cor }} />{carregando ? 'Sincronizando...' : bancoInfo.label}</div>
      </section>

      <section className="cap-crm-stats">
        <div><i>🔥</i><span>Leads ativos</span><strong>{stats.total}</strong><small>{nomeCaptador}</small></div>
        <div><i>☎️</i><span>Aguardando retorno</span><strong>{stats.retorno}</strong><small>{nomeFilial(filialAtual)}</small></div>
        <div><i>✅</i><span>Fechados</span><strong>{stats.fechado}</strong><small>Operação atual</small></div>
        <div><i>📈</i><span>Conversão</span><strong>{stats.conversao}%</strong><small>Performance</small></div>
      </section>

      <section className="cap-crm-content">
        <aside className="cap-crm-form">
          <header><strong>{editandoId ? 'Editar motorista' : 'Cadastro rápido'}</strong><span>Dados principais para acompanhar depois.</span></header>
          <div className="cap-crm-fields">
            <label>Nome do motorista<input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: João Silva" /></label>
            <div className="cap-crm-row"><label>CPF<input value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: formatarCpf(e.target.value) }))} placeholder="000.000.000-00" /></label><label>Telefone<input value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} placeholder="(64) 99999-9999" /></label></div>
            <div className="cap-crm-row"><label>Placa do cavalo<input value={form.placa} onChange={e => setForm(p => ({ ...p, placa: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) }))} placeholder="ABC1D23" /></label><label>Eixos<select value={form.eixos} onChange={e => setForm(p => ({ ...p, eixos: e.target.value }))}>{EIXOS.map(e => <option key={e}>{e}</option>)}</select></label></div>
            <div className="cap-crm-row"><label>Status<select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></label><label>Lembrete<input type="datetime-local" value={form.lembrete} onChange={e => setForm(p => ({ ...p, lembrete: e.target.value }))} /></label></div>
            <div className="cap-crm-row"><label>Operação<select value={form.operacao} onChange={e => setForm(p => ({ ...p, operacao: e.target.value }))}>{OPERACOES.map(op => <option key={op}>{op}</option>)}</select></label><label>Cargas<input value={form.quantidadeCargas} onChange={e => setForm(p => ({ ...p, quantidadeCargas: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="1" /></label></div>
            <label>Observação<textarea rows="3" value={form.obs} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} placeholder="Ex: pediu retorno amanhã, tem interesse para carregar em Jataí..." /></label>
            <button onClick={salvar}>{editandoId ? 'Salvar alteração' : 'Salvar motorista'}</button>
          </div>
        </aside>

        <main className="cap-crm-table">
          <header><strong>Fila de captação</strong><span>Motoristas em acompanhamento</span></header>
          <div className="cap-crm-tools"><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, CPF, placa ou telefone..." /><select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option value="Todos">Todos status</option>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></div>
          <div className="cap-crm-tabs">{['Todos', 'Retorno hoje', 'Atrasados', 'Fechados'].map(t => <button key={t} onClick={() => setAbaRapida(t)} className={abaRapida === t ? 'active' : ''}>{t}</button>)}</div>
          <div className="cap-crm-scroll"><table><thead><tr><th>Status</th><th>Motorista</th><th>CPF</th><th>Placa</th><th>Eixos</th><th>Lembrete</th><th>Obs.</th><th>Ações</th></tr></thead><tbody>{lista.length === 0 && <tr><td colSpan="8" className="cap-crm-empty">Nenhum motorista encontrado.</td></tr>}{lista.map(m => <tr key={m.id}><td><span className={`cap-crm-pill ${m.status}`}>{STATUS[m.status]?.label || 'Lead'}</span></td><td><div className="cap-crm-driver"><b>{(m.nome || '?')[0]}</b><div><strong>{m.nome}</strong><small>{m.numero}</small></div></div></td><td>{m.cpf || '-'}</td><td>{m.placa || '-'}</td><td>{m.eixos || '-'}</td><td>{lembreteTexto(m.lembrete)}</td><td>{m.obs || '-'}</td><td><div className="cap-crm-actions"><button onClick={() => editar(m)}>Editar</button>{STATUS[m.status]?.next && <button onClick={() => atualizar(m, STATUS[m.status].next)}>Avançar</button>}<button onClick={() => atualizar(m, 'perdido')}>Perda</button><button onClick={() => excluir(m)}>Excluir</button></div></td></tr>)}</tbody></table></div>
        </main>
      </section>
    </div>
  )
}
