import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import * as legacy from '../lib/supabase'
import * as v2 from '../lib/supabaseV2'
import { gerarId } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import '../captacao-redesign.css'
import '../captacao-aggressive.css'

const STORAGE_KEY = 'captacoesVeiculosViaLog'

const STATUS = {
  contatado: { label: 'Lead', cor: '#60a5fa', icon: '📞', ordem: 1, next: 'ordem' },
  ordem: { label: 'Com ordem', cor: '#f59e0b', icon: '📋', ordem: 2, next: 'carregou' },
  carregou: { label: 'Carregou', cor: '#22c55e', icon: '✅', ordem: 3 },
  nao_carregou: { label: 'Não carregou', cor: '#ef4444', icon: '⛔', ordem: 4 },
}

const IMPACTO = {
  externo: { label: 'Motivo externo', curto: 'Não pesa', cor: '#60a5fa', icon: '🛡️' },
  falha_captacao: { label: 'Falha da captação', curto: 'Pesa', cor: '#ef4444', icon: '⚠️' },
  analise: { label: 'Em análise', curto: 'Validar', cor: '#f59e0b', icon: '🕵️' },
}

const OPERACOES = ['Farelo', 'Grãos']
const MOTIVOS_NAO_CARREGOU = ['Sem retorno', 'Preço não fechou', 'Sem agenda', 'Seguradora não libera', 'Documentação pendente', 'Motorista desistiu', 'Veículo carregou em outra empresa', 'Cadastro/dados incorretos', 'Motorista sem perfil da operação', 'Falta de acompanhamento', 'Outro']

const EMPTY = {
  nome: '', numero: '', operacao: 'Farelo', status: 'contatado', obs: '', quantidadeCargas: '1', motivoNaoCarregou: '', justificativaNaoCarregou: '', impactoPontuacao: 'externo',
}

const MODO_BANCO_INFO = {
  auto: { label: 'Verificando conexão', cor: '#94a3b8' },
  v2: { label: 'Nuvem online', cor: '#22c55e' },
  'v2+legado': { label: 'Nuvem + backup', cor: '#22c55e' },
  legado: { label: 'Banco antigo', cor: '#f59e0b' },
  local: { label: 'Salvo local', cor: '#ef4444' },
}

function normalizarTelefone(v) { return String(v || '').replace(/[^0-9]/g, '') }
function formatarTelefone(v) {
  const n = normalizarTelefone(v)
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
}
function hojeISO() { return new Date().toISOString().slice(0, 10) }
function agoraBR() { return new Date().toLocaleString('pt-BR') }
const statusKey = v2.statusV2 || ((s) => s || 'contatado')
const impactoKey = (v) => v2.impactoPontuacaoV2 ? v2.impactoPontuacaoV2(v) : (v || 'externo')

function normalizarItem(item) {
  const key = statusKey(item.status)
  return {
    ...item,
    id: item.id || gerarId(),
    nome: item.nome || item.motorista || '',
    numero: item.numero || item.telefone || '',
    operacao: item.operacao || item.produto || 'Farelo',
    status: STATUS[key] ? key : 'contatado',
    obs: item.obs || item.observacao || item.ultimaObs || '',
    motivoNaoCarregou: item.motivoNaoCarregou || item.motivo_nao_carregou || '',
    justificativaNaoCarregou: item.justificativaNaoCarregou || item.justificativa_nao_carregou || '',
    impactoPontuacao: impactoKey(item.impactoPontuacao || item.impacto_pontuacao),
    quantidadeCargas: String(item.quantidadeCargas || item.quantidade_cargas || 1),
    captador: item.captador || item.usuario || '-',
    nomeCaptador: item.nomeCaptador || item.nomeUsuario || item.usuario || '-',
    filial: item.filial || 'jatai-go',
    data: item.data || agoraBR(),
    dataISO: item.dataISO || hojeISO(),
  }
}

const loadLocal = () => {
  try { return (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).map(normalizarItem) } catch { return [] }
}
const saveLocal = (lista) => localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))

function abrirWhatsNumero(numero, nome = '') {
  let n = normalizarTelefone(numero)
  if (!n) return '#'
  if (!n.startsWith('55')) n = '55' + n
  return `https://wa.me/${n}?text=${encodeURIComponent(`Olá ${nome || ''}, tudo bem? Sou da logística. Estou verificando disponibilidade para carga.`)}`
}

function CaptacaoMetric({ label, value, icon, color }) {
  return <div className="cap2-metric"><span style={{ color }}>{icon}</span><strong>{value}</strong><small>{label}</small></div>
}

function ModalMotorista({ aberto, fechar, salvarMotorista, editando }) {
  const [form, setForm] = useState(EMPTY)
  useEffect(() => {
    setForm(editando ? {
      nome: editando.nome || '', numero: editando.numero || '', operacao: editando.operacao || 'Farelo', status: statusKey(editando.status), obs: editando.obs || '', quantidadeCargas: String(editando.quantidadeCargas || 1), motivoNaoCarregou: editando.motivoNaoCarregou || '', justificativaNaoCarregou: editando.justificativaNaoCarregou || '', impactoPontuacao: impactoKey(editando.impactoPontuacao),
    } : EMPTY)
  }, [editando, aberto])
  if (!aberto) return null
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const confirmar = () => {
    if (!form.nome.trim() || !form.numero.trim()) { alert('Informe nome e telefone do motorista.'); return }
    if (form.status === 'nao_carregou' && (!form.motivoNaoCarregou || !form.justificativaNaoCarregou.trim())) { alert('Informe o motivo e a justificativa de não carregamento.'); return }
    salvarMotorista({ ...form, nome: form.nome.trim(), numero: formatarTelefone(form.numero), obs: form.obs.trim(), motivoNaoCarregou: form.status === 'nao_carregou' ? form.motivoNaoCarregou : '', justificativaNaoCarregou: form.status === 'nao_carregou' ? form.justificativaNaoCarregou.trim() : '', impactoPontuacao: form.status === 'nao_carregou' ? impactoKey(form.impactoPontuacao) : 'externo', quantidadeCargas: String(Math.max(1, Number(form.quantidadeCargas || 1) || 1)) })
  }
  return (
    <div className="cap2-modal-backdrop" onClick={fechar}>
      <div className="cap2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cap2-modal-head"><div><span>{editando ? 'Editar captação' : 'Nova captação'}</span><h2>{editando ? 'Atualizar motorista' : 'Cadastrar motorista'}</h2></div><button onClick={fechar}>×</button></div>
        <div className="cap2-form-grid">
          <div className="cap2-field span-2"><label>Motorista</label><input value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Nome do motorista" /></div>
          <div className="cap2-field"><label>Telefone</label><input value={form.numero} onChange={(e) => set('numero', e.target.value)} placeholder="(64) 99999-9999" /></div>
          <div className="cap2-field"><label>Qtd. cargas</label><input value={form.quantidadeCargas} onChange={(e) => set('quantidadeCargas', e.target.value.replace(/[^0-9]/g, ''))} /></div>
        </div>
        <div className="cap2-choice-block"><label>Operação</label><div className="cap2-choice-row">{OPERACOES.map((op) => <button key={op} onClick={() => set('operacao', op)} className={form.operacao === op ? 'active' : ''}>{op}</button>)}</div></div>
        <div className="cap2-choice-block"><label>Status</label><div className="cap2-status-row">{Object.entries(STATUS).map(([key, s]) => <button key={key} onClick={() => set('status', key)} className={form.status === key ? 'active' : ''} style={form.status === key ? { borderColor: s.cor, color: s.cor } : {}}>{s.icon} {s.label}</button>)}</div></div>
        {form.status === 'nao_carregou' && <div className="cap2-no-load"><div className="cap2-field"><label>Motivo</label><select value={form.motivoNaoCarregou} onChange={(e) => set('motivoNaoCarregou', e.target.value)}><option value="">Selecione...</option>{MOTIVOS_NAO_CARREGOU.map((m) => <option key={m}>{m}</option>)}</select></div><div className="cap2-choice-block"><label>Impacto</label><div className="cap2-impact-row">{Object.entries(IMPACTO).map(([key, info]) => <button key={key} onClick={() => set('impactoPontuacao', key)} className={form.impactoPontuacao === key ? 'active' : ''} style={form.impactoPontuacao === key ? { borderColor: info.cor, color: info.cor } : {}}><strong>{info.icon} {info.label}</strong><small>{info.curto}</small></button>)}</div></div><div className="cap2-field"><label>Justificativa</label><textarea value={form.justificativaNaoCarregou} onChange={(e) => set('justificativaNaoCarregou', e.target.value)} placeholder="Explique o motivo rapidamente." /></div></div>}
        <div className="cap2-field"><label>Observação</label><textarea value={form.obs} onChange={(e) => set('obs', e.target.value)} placeholder="Ex: falou que retorna mais tarde, prefere farelo..." /></div>
        <button onClick={confirmar} className="cap2-save">{editando ? 'Salvar alterações' : 'Cadastrar lead'}</button>
      </div>
    </div>
  )
}

export default function Captacao() {
  const { usuarioAtual, toast } = useApp()
  const [motoristas, setMotoristas] = useState(loadLocal)
  const [busca, setBusca] = useState('')
  const [filtroOp, setFiltroOp] = useState('Todas')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [modoBanco, setModoBanco] = useState('auto')
  const [rapido, setRapido] = useState({ nome: '', numero: '', operacao: 'Farelo', quantidadeCargas: '1' })

  const isAdmin = usuarioAtual?.cargo === 'Admin'
  const filialAtual = usuarioAtual?.filial || 'jatai-go'
  const captadorId = usuarioAtual?.usuario || '-'
  const nomeCaptador = usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'
  const bancoInfo = MODO_BANCO_INFO[modoBanco] || MODO_BANCO_INFO.auto

  useEffect(() => { saveLocal(motoristas) }, [motoristas])
  useEffect(() => {
    const carregarNuvem = async () => {
      setCarregando(true)
      try { const listaV2 = await v2.listarCaptacoesV2({ admin: isAdmin, filial: filialAtual }); if (listaV2.length) setMotoristas(listaV2.map(normalizarItem)); setModoBanco('v2') }
      catch { try { const rows = await legacy.baixarTodos(isAdmin ? null : filialAtual); const lista = rows.filter((r) => r.tipo === 'captacao').map((r) => normalizarItem({ ...r.dados, filial: r.filial || r.dados?.filial })).filter(Boolean); if (lista.length) setMotoristas(lista); setModoBanco('legado') } catch { setModoBanco('local') } }
      finally { setCarregando(false) }
    }
    carregarNuvem()
  }, [isAdmin, filialAtual])

  const base = useMemo(() => motoristas.filter((m) => {
    if (!isAdmin && (m.captador || m.usuario) !== captadorId) return false
    if (!isAdmin && (m.filial || filialAtual) !== filialAtual) return false
    return true
  }), [motoristas, isAdmin, captadorId, filialAtual])

  const stats = useMemo(() => ({ total: base.length, ordem: base.filter((m) => m.status === 'ordem' || m.status === 'carregou').length, carregou: base.filter((m) => m.status === 'carregou').length, naoCarregou: base.filter((m) => m.status === 'nao_carregou').length }), [base])
  const conversao = stats.total ? Math.round((stats.carregou / stats.total) * 100) : 0
  const lista = useMemo(() => base.filter((m) => filtroOp === 'Todas' || m.operacao === filtroOp).filter((m) => filtroStatus === 'Todos' || m.status === filtroStatus).filter((m) => !busca || [m.nome, m.numero, m.operacao, STATUS[m.status]?.label, m.obs, m.motivoNaoCarregou].join(' ').toLowerCase().includes(busca.toLowerCase())).sort((a, b) => (STATUS[b.status]?.ordem || 0) - (STATUS[a.status]?.ordem || 0)), [base, busca, filtroOp, filtroStatus])

  const persistir = async (item, listaAtualizada, mensagem = 'Captação salva.') => {
    setMotoristas(listaAtualizada); saveLocal(listaAtualizada)
    try { await v2.salvarCaptacaoV2(item, usuarioAtual); try { await legacy.salvar(item, 'captacao', item.filial) } catch {}; setModoBanco('v2+legado'); toast?.(mensagem, 'ok') }
    catch { try { await legacy.salvar(item, 'captacao', item.filial); setModoBanco('legado'); toast?.(`${mensagem} Banco legado.`, 'ok') } catch { setModoBanco('local'); toast?.('Salvo localmente. Nuvem falhou.', 'warn') } }
  }

  const salvarMotorista = async (dados) => {
    if (editando) {
      const atualizado = { ...editando, ...dados, usuario: editando.captador || captadorId, captador: editando.captador || captadorId, nomeCaptador: editando.nomeCaptador || nomeCaptador, motorista: dados.nome, telefone: dados.numero, produto: dados.operacao, ultimaAtualizacao: agoraBR(), atualizadoPor: captadorId }
      await persistir(atualizado, motoristas.map((m) => (String(m.id) === String(editando.id) ? atualizado : m)), 'Lead atualizado.')
    } else {
      const novo = { id: gerarId(), captador: captadorId, usuario: captadorId, nomeCaptador, nomeUsuario: nomeCaptador, filial: filialAtual, data: agoraBR(), dataISO: hojeISO(), ...dados, motorista: dados.nome, telefone: dados.numero, produto: dados.operacao, ultimaAtualizacao: agoraBR(), atualizadoPor: captadorId }
      await persistir(novo, [novo, ...motoristas], 'Lead cadastrado.')
    }
    setModal(false); setEditando(null)
  }

  const salvarRapido = async () => {
    if (!rapido.nome.trim() || !rapido.numero.trim()) { alert('Informe motorista e telefone.'); return }
    setEditando(null)
    const novo = { ...EMPTY, nome: rapido.nome.trim(), numero: formatarTelefone(rapido.numero), operacao: rapido.operacao, quantidadeCargas: String(Math.max(1, Number(rapido.quantidadeCargas || 1) || 1)), status: 'contatado' }
    await salvarMotorista(novo)
    setRapido({ nome: '', numero: '', operacao: rapido.operacao, quantidadeCargas: '1' })
  }

  const avancar = async (m) => { const proximo = STATUS[m.status]?.next; if (!proximo) return; const atualizado = { ...m, status: proximo, motivoNaoCarregou: '', justificativaNaoCarregou: '', impactoPontuacao: 'externo', ultimaAtualizacao: agoraBR(), atualizadoPor: captadorId }; await persistir(atualizado, motoristas.map((x) => (String(x.id) === String(m.id) ? atualizado : x)), `Status atualizado para ${STATUS[proximo].label}.`) }
  const marcarNaoCarregou = (m) => { setEditando({ ...m, status: 'nao_carregou', impactoPontuacao: impactoKey(m.impactoPontuacao) }); setModal(true) }
  const excluir = async (id) => { const listaAtualizada = motoristas.filter((m) => String(m.id) !== String(id)); setMotoristas(listaAtualizada); saveLocal(listaAtualizada); try { await v2.deletarCaptacaoV2(id) } catch {}; try { await legacy.deletar(id); toast?.('Lead excluído.', 'ok') } catch {} }
  const abrirWhats = (m) => abrirWhatsNumero(m.numero, m.nome)

  return (
    <div className="cap2-shell cap2-aggressive">
      <section className="cap2-workbench">
        <div className="cap2-workbench-left"><span className="cap2-eyebrow">Captação operacional</span><h1>Novo lead</h1><p>Registre o motorista aqui. O resto é acompanhar status.</p></div>
        <div className="cap2-fast-form"><input value={rapido.nome} onChange={(e) => setRapido(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do motorista" /><input value={rapido.numero} onChange={(e) => setRapido(p => ({ ...p, numero: e.target.value }))} placeholder="Telefone" /><select value={rapido.operacao} onChange={(e) => setRapido(p => ({ ...p, operacao: e.target.value }))}>{OPERACOES.map(op => <option key={op}>{op}</option>)}</select><input value={rapido.quantidadeCargas} onChange={(e) => setRapido(p => ({ ...p, quantidadeCargas: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="Cargas" /><button onClick={salvarRapido}>Cadastrar</button></div>
      </section>
      <section className="cap2-strip"><div className="cap2-owner compact"><div className="cap2-avatar">{nomeCaptador[0]?.toUpperCase() || '?'}</div><div><small>{isAdmin ? 'Admin' : 'Captador'}</small><strong>{nomeCaptador}</strong></div><span>{isAdmin ? 'Geral' : nomeFilial(filialAtual)}</span></div><CaptacaoMetric icon="📞" label="Leads" value={stats.total} color="#60a5fa" /><CaptacaoMetric icon="📋" label="Com ordem" value={stats.ordem} color="#f59e0b" /><CaptacaoMetric icon="✅" label="Carregou" value={stats.carregou} color="#22c55e" /><CaptacaoMetric icon="⛔" label="Não carregou" value={stats.naoCarregou} color="#ef4444" /><div className="cap2-conversion compact"><div><span>Efetivo</span><strong>{conversao}%</strong></div><i><b style={{ width: `${conversao}%` }} /></i></div></section>
      <section className="cap2-toolbar aggressive"><div className="cap2-search"><span>🔎</span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar motorista, telefone ou observação..." /></div><div className="cap2-filters">{['Todas', ...OPERACOES].map((op) => <button key={op} onClick={() => setFiltroOp(op)} className={filtroOp === op ? 'active' : ''}>{op}</button>)}<select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}><option value="Todos">Todos status</option>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select><button onClick={() => { setEditando(null); setModal(true) }}>+ Completo</button></div></section>
      <section className="cap2-list-card aggressive"><div className="cap2-list-head"><strong>Fila de captação</strong><span>{lista.length} registro(s)</span></div><div className="cap2-list">{lista.length === 0 && <div className="cap2-empty"><strong>Nenhum lead ainda</strong><span>Cadastre no topo da tela para começar.</span></div>}{lista.map((m) => { const s = STATUS[m.status] || STATUS.contatado; const isNaoCarregou = m.status === 'nao_carregou'; return <div key={m.id} className={`cap2-row ${isNaoCarregou ? 'danger' : ''}`}><div className="cap2-status-dot" style={{ color: s.cor, background: `${s.cor}18` }}>{s.icon}</div><div className="cap2-row-main"><div className="cap2-row-title"><strong>{m.nome}</strong><span>{s.label}</span><span>{m.operacao}</span>{Number(m.quantidadeCargas || 1) > 1 && <em>{m.quantidadeCargas} cargas</em>}</div><div className="cap2-row-sub">{m.numero || 'Sem telefone'} · {m.data || '-'} {isAdmin ? `· ${m.nomeCaptador || m.captador}` : ''}</div>{m.obs && <p>{m.obs}</p>}{isNaoCarregou && <div className="cap2-reason"><strong>{m.motivoNaoCarregou || 'Não carregou'}</strong><span>{m.justificativaNaoCarregou || 'Sem justificativa.'}</span><small>{IMPACTO[impactoKey(m.impactoPontuacao)]?.label || 'Motivo externo'}</small></div>}</div><div className="cap2-actions">{!['carregou', 'nao_carregou'].includes(m.status) && <button onClick={() => avancar(m)} className="cap2-next">Avançar</button>}{!['carregou', 'nao_carregou'].includes(m.status) && <button onClick={() => marcarNaoCarregou(m)} className="cap2-lost">Não carregou</button>}{m.numero && <a href={abrirWhats(m)} target="_blank" rel="noopener noreferrer">Whats</a>}<button onClick={() => { setEditando(m); setModal(true) }}>Editar</button><button onClick={() => confirm('Excluir lead?') && excluir(m.id)}>Excluir</button></div></div> })}</div></section>
      <div className="cap2-sync" style={{ borderColor: `${bancoInfo.cor}55` }}><i style={{ background: bancoInfo.cor }} />{carregando ? 'Sincronizando...' : bancoInfo.label}</div><ModalMotorista aberto={modal} fechar={() => { setModal(false); setEditando(null) }} salvarMotorista={salvarMotorista} editando={editando} />
    </div>
  )
}
