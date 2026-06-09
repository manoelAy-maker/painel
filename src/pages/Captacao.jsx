import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import * as legacy from '../lib/supabase'
import * as v2 from '../lib/supabaseV2'
import { gerarId } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import '../captacao-base.css'
import '../captacao-nao-carregou.css'
import '../captacao-intelligence.css'

const STORAGE_KEY = 'captacoesVeiculosViaLog'

const STATUS = {
  contatado: { label: 'Lead captado', cor: '#64748b', icon: '📞', ordem: 1 },
  ordem: { label: 'Pegou ordem', cor: '#d97706', icon: '📋', ordem: 2 },
  nao_carregou: { label: 'Não carregou', cor: '#dc2626', icon: '⛔', ordem: 3 },
  carregou: { label: 'Carregou', cor: '#16a34a', icon: '✅', ordem: 4 },
}

const IMPACTO = {
  externo: {
    label: 'Motivo externo',
    curto: 'Não pesa',
    desc: 'Preço, agenda, seguradora, desistência ou concorrência. Não tira ponto do captador.',
    cor: '#2563eb',
    icon: '🛡️',
  },
  falha_captacao: {
    label: 'Falha na captação',
    curto: 'Pesa',
    desc: 'Dados ruins, perfil errado, falta de confirmação ou acompanhamento.',
    cor: '#dc2626',
    icon: '⚠️',
  },
  analise: {
    label: 'Em análise',
    curto: 'Validar',
    desc: 'Ainda precisa validar se foi motivo externo ou falha de captação.',
    cor: '#d97706',
    icon: '🕵️',
  },
}

const OPERACOES = ['Farelo', 'Grãos']
const MOTIVOS_NAO_CARREGOU = [
  'Sem retorno',
  'Preço não fechou',
  'Sem agenda',
  'Seguradora não libera',
  'Documentação pendente',
  'Motorista desistiu',
  'Veículo carregou em outra empresa',
  'Cadastro/dados incorretos',
  'Motorista sem perfil da operação',
  'Falta de acompanhamento',
  'Outro',
]

const EMPTY = {
  nome: '',
  numero: '',
  operacao: 'Farelo',
  status: 'contatado',
  obs: '',
  quantidadeCargas: '1',
  motivoNaoCarregou: '',
  justificativaNaoCarregou: '',
  impactoPontuacao: 'externo',
}

const MODO_BANCO_INFO = {
  auto: { label: 'Verificando conexão...', cor: '#94a3b8' },
  v2: { label: 'Sincronizado (nuvem)', cor: '#16a34a' },
  'v2+legado': { label: 'Sincronizado (nuvem + backup)', cor: '#16a34a' },
  legado: { label: 'Salvo no banco antigo', cor: '#d97706' },
  local: { label: 'Apenas neste aparelho — sem nuvem', cor: '#dc2626' },
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 11,
  border: '1px solid var(--line)',
  background: 'var(--card)',
  color: 'var(--text)',
  fontSize: 14,
  marginBottom: 16,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}
const lblStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }
const iconBtn = {
  border: '1px solid var(--line)',
  background: 'var(--card)',
  borderRadius: 8,
  padding: 7,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

function normalizarTelefone(v) {
  return String(v || '').replace(/[^0-9]/g, '')
}
function formatarTelefone(v) {
  const n = normalizarTelefone(v)
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
}
function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}
function agoraBR() {
  return new Date().toLocaleString('pt-BR')
}
function pct(a, b) {
  return b ? Math.round((a / b) * 100) : 0
}
function impactoKey(v) {
  return v2.impactoPontuacaoV2 ? v2.impactoPontuacaoV2(v) : (v || 'externo')
}
const statusKey = v2.statusV2
function normalizarItem(item) {
  const key = statusKey(item.status)
  return {
    ...item,
    id: item.id || gerarId(),
    nome: item.nome || item.motorista || '',
    numero: item.numero || item.telefone || '',
    operacao: item.operacao || item.produto || 'Farelo',
    status: key,
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
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).map(normalizarItem)
  } catch {
    return []
  }
}
const saveLocal = (lista) => localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))

function abrirWhatsNumero(numero, nome = '') {
  let n = normalizarTelefone(numero)
  if (!n) return '#'
  if (!n.startsWith('55')) n = '55' + n
  return `https://wa.me/${n}?text=${encodeURIComponent(`Olá ${nome || ''}, tudo bem? Sou da logística. Estou verificando disponibilidade para carga.`)}`
}

function impactoInfo(v) {
  return IMPACTO[impactoKey(v)] || IMPACTO.externo
}
function ImpactoPill({ impacto }) {
  const info = impactoInfo(impacto)
  return <span className={`cap-impact-pill cap-impact-${impactoKey(impacto)}`}>{info.icon} {info.label} · {info.curto}</span>
}

function GuiaSimplesCaptacao() {
  return (
    <div className="cap-simple-guide">
      <section className="cap-action-now">
        <h3>Fluxo simples da captação</h3>
        <p>Cadastre rápido, avance o status e só preencha motivo quando realmente não carregar.</p>
        <div className="cap-simple-steps">
          <div className="cap-simple-step"><strong>1. Lead</strong><span>Nome, número e operação.</span></div>
          <div className="cap-simple-step"><strong>2. Ordem</strong><span>Clique em avançar quando pegar ordem.</span></div>
          <div className="cap-simple-step"><strong>3. Carregou</strong><span>Avance de novo quando confirmar.</span></div>
          <div className="cap-simple-step"><strong>4. Não carregou</strong><span>Informe motivo e se pesa ou não.</span></div>
        </div>
      </section>
      <section className="cap-simple-rules">
        <h3>Regra da pontuação</h3>
        <div className="cap-rule-line"><span className="cap-rule-icon">🛡️</span><p><strong>Motivo externo</strong><br />Preço, agenda, seguradora ou concorrência não tira ponto.</p></div>
        <div className="cap-rule-line"><span className="cap-rule-icon">⚠️</span><p><strong>Falha de captação</strong><br />Dados errados, perfil errado ou falta de acompanhamento pesa.</p></div>
      </section>
    </div>
  )
}

function StatCard({ icon, label, valor, cor }) {
  return (
    <div className="cap-stat-card">
      <div className="cap-stat-icon" style={{ background: `${cor}1a`, color: cor }}>{icon}</div>
      <div className="cap-stat-value">{valor}</div>
      <div className="cap-stat-label">{label}</div>
    </div>
  )
}

function InsightCard({ titulo, valor, detalhe, cor = '#2563eb', icon = '◆' }) {
  return (
    <div className="cap-insight-card">
      <div className="cap-insight-icon" style={{ color: cor, background: `${cor}18` }}>{icon}</div>
      <div>
        <span>{titulo}</span>
        <strong>{valor || '-'}</strong>
        <small>{detalhe}</small>
      </div>
    </div>
  )
}

function ModalMotorista({ aberto, fechar, salvarMotorista, editando }) {
  const [form, setForm] = useState(EMPTY)
  useEffect(() => {
    setForm(
      editando
        ? {
            nome: editando.nome || '',
            numero: editando.numero || '',
            operacao: editando.operacao || 'Farelo',
            status: statusKey(editando.status),
            obs: editando.obs || '',
            quantidadeCargas: String(editando.quantidadeCargas || 1),
            motivoNaoCarregou: editando.motivoNaoCarregou || '',
            justificativaNaoCarregou: editando.justificativaNaoCarregou || '',
            impactoPontuacao: impactoKey(editando.impactoPontuacao),
          }
        : EMPTY,
    )
  }, [editando, aberto])
  if (!aberto) return null
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const confirmar = () => {
    if (!form.nome.trim() || !form.numero.trim()) return
    if (form.status === 'nao_carregou' && (!form.motivoNaoCarregou || !form.justificativaNaoCarregou.trim())) {
      alert('Informe o motivo e a justificativa de não carregamento.')
      return
    }
    salvarMotorista({
      ...form,
      nome: form.nome.trim(),
      numero: formatarTelefone(form.numero),
      obs: form.obs.trim(),
      motivoNaoCarregou: form.status === 'nao_carregou' ? form.motivoNaoCarregou : '',
      justificativaNaoCarregou: form.status === 'nao_carregou' ? form.justificativaNaoCarregou.trim() : '',
      impactoPontuacao: form.status === 'nao_carregou' ? impactoKey(form.impactoPontuacao) : 'externo',
      quantidadeCargas: String(Math.max(1, Number(form.quantidadeCargas || 1) || 1)),
    })
  }
  return (
    <div className="cap-modal-backdrop" onClick={fechar}>
      <div className="cap-modal cap-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="cap-modal-head">
          <h2>{editando ? 'Editar lead/motorista' : 'Novo lead captado'}</h2>
          <button onClick={fechar} className="cap-close">×</button>
        </div>
        <label style={lblStyle}>Nome do motorista</label>
        <input value={form.nome} onChange={(e) => set('nome', e.target.value)} style={inputStyle} placeholder="Ex: José Pereira" />
        <label style={lblStyle}>Número</label>
        <input value={form.numero} onChange={(e) => set('numero', e.target.value)} style={inputStyle} placeholder="(65) 99999-9999" />
        <div className="cap-modal-grid">
          <div>
            <label style={lblStyle}>Operação</label>
            <div className="cap-choice-row">
              {OPERACOES.map((op) => <button key={op} onClick={() => set('operacao', op)} className={`cap-choice ${form.operacao === op ? 'active' : ''}`}>{op}</button>)}
            </div>
          </div>
          <div>
            <label style={lblStyle}>Qtd. cargas</label>
            <input value={form.quantidadeCargas} onChange={(e) => set('quantidadeCargas', e.target.value.replace(/[^0-9]/g, ''))} style={inputStyle} placeholder="1" />
          </div>
        </div>
        <label style={lblStyle}>Status do lead</label>
        <div className="cap-choice-row status-row status-row-4">
          {Object.entries(STATUS).map(([key, s]) => (
            <button key={key} onClick={() => set('status', key)} className={`cap-status-choice ${key === 'nao_carregou' ? 'danger' : ''} ${form.status === key ? 'active' : ''}`} style={form.status === key ? { borderColor: s.cor, color: s.cor, background: `${s.cor}12` } : {}}>{s.icon} {s.label}</button>
          ))}
        </div>
        {form.status === 'nao_carregou' && (
          <div className="cap-no-load-form">
            <label style={lblStyle}>Motivo de não carregamento</label>
            <select value={form.motivoNaoCarregou} onChange={(e) => set('motivoNaoCarregou', e.target.value)} style={inputStyle}>
              <option value="">Selecione o motivo...</option>
              {MOTIVOS_NAO_CARREGOU.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <label style={lblStyle}>Isso pesa na pontuação do captador?</label>
            <div className="cap-impact-grid">
              {Object.entries(IMPACTO).map(([key, info]) => (
                <button key={key} type="button" className={`cap-impact-choice ${form.impactoPontuacao === key ? 'active' : ''}`} onClick={() => set('impactoPontuacao', key)} style={form.impactoPontuacao === key ? { color: info.cor, borderColor: info.cor, background: `${info.cor}10` } : {}}>
                  <strong>{info.icon} {info.label}</strong>
                  <small>{info.desc}</small>
                </button>
              ))}
            </div>

            <label style={lblStyle}>Justificativa obrigatória</label>
            <textarea value={form.justificativaNaoCarregou} onChange={(e) => set('justificativaNaoCarregou', e.target.value)} placeholder="Ex: preço não fechou, seguradora não liberou ou dados foram captados incorretamente." style={{ ...inputStyle, minHeight: 86, resize: 'vertical' }} />
          </div>
        )}
        <label style={lblStyle}>Observação</label>
        <textarea value={form.obs} onChange={(e) => set('obs', e.target.value)} placeholder="Ex: falou que retorna mais tarde, prefere farelo, contato do agenciador..." style={{ ...inputStyle, minHeight: 74, resize: 'vertical' }} />
        <button onClick={confirmar} className="cap-save-btn">{editando ? 'Salvar alterações' : 'Cadastrar lead'}</button>
      </div>
    </div>
  )
}

const MEDALHAS = ['🥇', '🥈', '🥉']

function RankingEfetividade({ ranking }) {
  const max = Math.max(...ranking.map((r) => r.pontos), 1)
  return (
    <section className="cap-intel-card">
      <div className="cap-intel-head"><div><h3>Ranking justo por funcionário</h3><span>Pontua resultado real e só desconta falha de captação</span></div></div>
      <div className="cap-rank-list">
        {ranking.length === 0 ? <div className="cap-empty-mini">Sem captações ainda.</div> : ranking.slice(0, 8).map((r, i) => (
          <div key={r.id} className={`cap-rank-pro ${i < 3 ? 'cap-rank-top3' : ''}`}>
            <div className="cap-rank-title"><strong>{MEDALHAS[i] || `${i + 1}.`} {r.nome}</strong><span>{r.pontos} pts · {r.efetividade}% efetivo</span></div>
            <div className="cap-rank-metrics"><b>{r.total}</b><small>leads</small><b>{r.ordem}</b><small>ordem</small><b>{r.carregou}</b><small>carregou</small><b>{r.falhaCaptacao}</b><small>falhas</small></div>
            <div className="cap-rank-bar"><i style={{ width: `${Math.max(6, (r.pontos / max) * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  )
}

function MotivosNaoCarregou({ motivos }) {
  const max = Math.max(...motivos.map((m) => m.qtd), 1)
  return (
    <section className="cap-intel-card">
      <div className="cap-intel-head"><div><h3>Por que não carrega conosco?</h3><span>Mostra motivo real, sem punir automaticamente o captador</span></div></div>
      <div className="cap-reason-list">
        {motivos.length === 0 ? <div className="cap-empty-mini">Nenhum motivo registrado ainda.</div> : motivos.slice(0, 7).map((m) => (
          <div key={m.motivo} className="cap-reason-row">
            <div><strong>{m.motivo}</strong><span>{m.qtd} motorista(s) · {m.falhaCaptacao} falha(s) de captação</span></div>
            <b>{m.qtd}</b>
            <div className="cap-reason-bar"><i style={{ width: `${Math.max(8, (m.qtd / max) * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  )
}

function BancoMotoristas({ motoristas }) {
  return (
    <section className="cap-intel-card cap-bank-card">
      <div className="cap-intel-head"><div><h3>Banco de motoristas</h3><span>Números salvos para futuras cargas</span></div><strong>{motoristas.length}</strong></div>
      <div className="cap-bank-list">
        {motoristas.length === 0 ? <div className="cap-empty-mini">Nenhum motorista no banco ainda.</div> : motoristas.slice(0, 10).map((m) => (
          <div key={m.chave} className="cap-bank-row">
            <div><strong>{m.nome}</strong><span>{m.numero || 'Sem telefone'} · {m.statusLabel}</span><small>{m.total} contato(s) · {m.carregou} carregou · {m.ordem} ordem</small></div>
            <div className="cap-bank-actions">{m.numero && <a href={abrirWhatsNumero(m.numero, m.nome)} target="_blank" rel="noopener noreferrer">Whats</a>}<button onClick={() => navigator.clipboard?.writeText(m.numero || '')}>Copiar</button></div>
          </div>
        ))}
      </div>
    </section>
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

  const isAdmin = usuarioAtual?.cargo === 'Admin'
  const filialAtual = usuarioAtual?.filial || 'jatai-go'
  const captadorId = usuarioAtual?.usuario || '-'
  const nomeCaptador = usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'
  const corCaptador = isAdmin ? '#7c3aed' : '#d97706'

  useEffect(() => { saveLocal(motoristas) }, [motoristas])
  useEffect(() => {
    const carregarNuvem = async () => {
      setCarregando(true)
      try {
        const listaV2 = await v2.listarCaptacoesV2({ admin: isAdmin, filial: filialAtual })
        if (listaV2.length) setMotoristas(listaV2.map(normalizarItem))
        setModoBanco('v2')
      } catch {
        try {
          const rows = await legacy.baixarTodos(isAdmin ? null : filialAtual)
          const lista = rows.filter((r) => r.tipo === 'captacao').map((r) => normalizarItem({ ...r.dados, filial: r.filial || r.dados?.filial })).filter(Boolean)
          if (lista.length) setMotoristas(lista)
          setModoBanco('legado')
        } catch { setModoBanco('local') }
      } finally { setCarregando(false) }
    }
    carregarNuvem()
  }, [isAdmin, filialAtual])

  const base = useMemo(() => motoristas.filter((m) => {
    if (!isAdmin && (m.captador || m.usuario) !== captadorId) return false
    if (!isAdmin && (m.filial || filialAtual) !== filialAtual) return false
    return true
  }), [motoristas, isAdmin, captadorId, filialAtual])
  const escopoAnalise = isAdmin ? motoristas : base

  const stats = useMemo(() => ({
    total: base.length,
    ordem: base.filter((m) => m.status === 'ordem' || m.status === 'carregou').length,
    carregou: base.filter((m) => m.status === 'carregou').length,
    naoCarregou: base.filter((m) => m.status === 'nao_carregou').length,
    motivoExterno: base.filter((m) => m.status === 'nao_carregou' && impactoKey(m.impactoPontuacao) === 'externo').length,
    falhaCaptacao: base.filter((m) => m.status === 'nao_carregou' && impactoKey(m.impactoPontuacao) === 'falha_captacao').length,
    analise: base.filter((m) => m.status === 'nao_carregou' && impactoKey(m.impactoPontuacao) === 'analise').length,
  }), [base])
  const conversao = stats.total ? Math.round((stats.carregou / stats.total) * 100) : 0

  const ranking = useMemo(() => {
    const map = new Map()
    escopoAnalise.forEach((m) => {
      const key = m.captador || 'sem-usuario'
      const atual = map.get(key) || { id: key, nome: m.nomeCaptador || key, total: 0, ordem: 0, carregou: 0, naoCarregou: 0, motivoExterno: 0, falhaCaptacao: 0, analise: 0, pontos: 0, efetividade: 0, ordemPct: 0 }
      atual.total += 1
      if (m.status === 'ordem' || m.status === 'carregou') atual.ordem += 1
      if (m.status === 'carregou') atual.carregou += 1
      if (m.status === 'nao_carregou') {
        atual.naoCarregou += 1
        const impacto = impactoKey(m.impactoPontuacao)
        if (impacto === 'falha_captacao') atual.falhaCaptacao += 1
        else if (impacto === 'analise') atual.analise += 1
        else atual.motivoExterno += 1
      }
      atual.pontos = atual.total + atual.ordem * 3 + atual.carregou * 5 - atual.falhaCaptacao * 2
      atual.efetividade = pct(atual.carregou, atual.total)
      atual.ordemPct = pct(atual.ordem, atual.total)
      map.set(key, atual)
    })
    return [...map.values()].sort((a, b) => b.pontos - a.pontos || b.carregou - a.carregou || b.efetividade - a.efetividade)
  }, [escopoAnalise])

  const motivosNaoCarregou = useMemo(() => {
    const map = new Map()
    escopoAnalise.filter((m) => m.status === 'nao_carregou').forEach((m) => {
      const motivo = m.motivoNaoCarregou || 'Sem motivo'
      const atual = map.get(motivo) || { motivo, qtd: 0, externo: 0, falhaCaptacao: 0, analise: 0 }
      atual.qtd += 1
      const impacto = impactoKey(m.impactoPontuacao)
      if (impacto === 'falha_captacao') atual.falhaCaptacao += 1
      else if (impacto === 'analise') atual.analise += 1
      else atual.externo += 1
      map.set(motivo, atual)
    })
    return [...map.values()].sort((a, b) => b.qtd - a.qtd)
  }, [escopoAnalise])

  const bancoMotoristas = useMemo(() => {
    const map = new Map()
    escopoAnalise.forEach((m) => {
      const tel = normalizarTelefone(m.numero)
      const chave = tel || `${String(m.nome || '').toLowerCase()}-${m.captador || ''}`
      const atual = map.get(chave) || { chave, nome: m.nome || 'Motorista sem nome', numero: m.numero || '', total: 0, ordem: 0, carregou: 0, naoCarregou: 0, statusLabel: STATUS[m.status]?.label || 'Lead captado' }
      atual.total += 1
      if (m.status === 'ordem' || m.status === 'carregou') atual.ordem += 1
      if (m.status === 'carregou') atual.carregou += 1
      if (m.status === 'nao_carregou') atual.naoCarregou += 1
      atual.statusLabel = STATUS[m.status]?.label || atual.statusLabel
      map.set(chave, atual)
    })
    return [...map.values()].sort((a, b) => b.carregou - a.carregou || b.ordem - a.ordem || b.total - a.total)
  }, [escopoAnalise])

  const topCaptador = ranking[0]
  const topEfetivo = [...ranking].filter((r) => r.total > 0).sort((a, b) => b.efetividade - a.efetividade || b.carregou - a.carregou)[0]
  const motivoTop = motivosNaoCarregou[0]
  const topJusto = [...ranking].sort((a, b) => b.pontos - a.pontos)[0]

  const lista = useMemo(() => base
    .filter((m) => filtroOp === 'Todas' || m.operacao === filtroOp)
    .filter((m) => filtroStatus === 'Todos' || m.status === filtroStatus)
    .filter((m) => !busca || [m.nome, m.numero, m.operacao, m.status, m.obs, m.motivoNaoCarregou, m.justificativaNaoCarregou, m.impactoPontuacao, m.nomeCaptador, m.captador].join(' ').toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => (STATUS[b.status]?.ordem || 0) - (STATUS[a.status]?.ordem || 0)), [base, busca, filtroOp, filtroStatus])

  const persistir = async (item, listaAtualizada, mensagem = 'Captação salva.') => {
    setMotoristas(listaAtualizada)
    saveLocal(listaAtualizada)
    try {
      await v2.salvarCaptacaoV2(item, usuarioAtual)
      try { await legacy.salvar(item, 'captacao', item.filial) } catch {}
      setModoBanco('v2+legado')
      toast?.(mensagem, 'ok')
    } catch {
      try {
        await legacy.salvar(item, 'captacao', item.filial)
        setModoBanco('legado')
        toast?.(`${mensagem} Banco legado.`, 'ok')
      } catch {
        setModoBanco('local')
        toast?.('Salvo localmente. Nuvem falhou.', 'warn')
      }
    }
  }
  const salvarMotorista = async (dados) => {
    if (editando) {
      const atualizado = { ...editando, ...dados, usuario: editando.captador || captadorId, captador: editando.captador || captadorId, nomeCaptador: editando.nomeCaptador || nomeCaptador, motorista: dados.nome, telefone: dados.numero, produto: dados.operacao, ultimaAtualizacao: agoraBR(), atualizadoPor: captadorId }
      await persistir(atualizado, motoristas.map((m) => (String(m.id) === String(editando.id) ? atualizado : m)), 'Lead atualizado.')
    } else {
      const novo = { id: gerarId(), captador: captadorId, usuario: captadorId, nomeCaptador, nomeUsuario: nomeCaptador, filial: filialAtual, data: agoraBR(), dataISO: hojeISO(), ...dados, motorista: dados.nome, telefone: dados.numero, produto: dados.operacao, ultimaAtualizacao: agoraBR(), atualizadoPor: captadorId }
      await persistir(novo, [novo, ...motoristas], 'Lead cadastrado.')
    }
    setModal(false)
    setEditando(null)
  }
  const avancar = async (m) => {
    const proximo = m.status === 'contatado' ? 'ordem' : 'carregou'
    const atualizado = { ...m, status: proximo, motivoNaoCarregou: '', justificativaNaoCarregou: '', impactoPontuacao: 'externo', ultimaAtualizacao: agoraBR(), atualizadoPor: captadorId }
    await persistir(atualizado, motoristas.map((x) => (String(x.id) === String(m.id) ? atualizado : x)), `Status atualizado para ${STATUS[proximo].label}.`)
  }
  const marcarNaoCarregou = (m) => { setEditando({ ...m, status: 'nao_carregou', impactoPontuacao: impactoKey(m.impactoPontuacao) }); setModal(true) }
  const excluir = async (id) => {
    const listaAtualizada = motoristas.filter((m) => String(m.id) !== String(id))
    setMotoristas(listaAtualizada)
    saveLocal(listaAtualizada)
    try { await v2.deletarCaptacaoV2(id) } catch {}
    try { await legacy.deletar(id); toast?.('Lead excluído.', 'ok') } catch {}
  }
  const abrirWhats = (m) => abrirWhatsNumero(m.numero, m.nome)

  return (
    <div className="captacao-simple-shell">
      <header className="cap-header"><div className="cap-header-inner"><div className="cap-user"><div className="cap-avatar" style={{ background: corCaptador }}>{nomeCaptador[0]?.toUpperCase() || '?'}</div><div><small>{isAdmin ? 'Visão administrativa' : 'Captador'}</small><strong>{nomeCaptador}</strong></div></div><div className="cap-filial">{isAdmin ? 'Admin · Geral' : nomeFilial(filialAtual)} {carregando ? ' · Sync' : ''}</div></div></header>
      <main className="cap-main">
        <GuiaSimplesCaptacao />
        <div className="cap-stats"><StatCard icon="📞" label="Leads captados" valor={stats.total} cor="#64748b" /><StatCard icon="📋" label="Com ordem" valor={stats.ordem} cor="#d97706" /><StatCard icon="✅" label="Carregou" valor={stats.carregou} cor="#16a34a" /><StatCard icon="⛔" label="Não carregou" valor={stats.naoCarregou} cor="#dc2626" /></div>
        <div className="cap-score-summary"><StatCard icon="🛡️" label="Motivo externo: não pesa" valor={stats.motivoExterno} cor="#2563eb" /><StatCard icon="⚠️" label="Falha de captação: pesa" valor={stats.falhaCaptacao} cor="#dc2626" /><StatCard icon="🕵️" label="Em análise" valor={stats.analise} cor="#d97706" /></div>
        <div className="cap-conversion"><div style={{ flex: 1 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, marginBottom: 8, fontWeight: 800 }}>📈 Taxa de carregamento efetivo</div><div className="cap-bar"><i style={{ width: `${conversao}%` }} /></div></div><div style={{ fontSize: 27, fontWeight: 900, color: '#16a34a' }}>{conversao}%</div></div>
        <section className="cap-intelligence-hero"><div><span>CRM de leads captados</span><h2>Simples para lançar, forte para medir resultado</h2><p>Cadastre o motorista rápido, avance o status e registre o motivo apenas quando não carregar. O painel separa motivo externo de falha de captação.</p></div></section>
        <div className="cap-insights-grid"><InsightCard icon="🏆" titulo="Maior pontuação justa" valor={topJusto?.nome} detalhe={`${topJusto?.pontos || 0} pontos`} cor="#7c3aed" /><InsightCard icon="📞" titulo="Mais captou" valor={topCaptador?.nome} detalhe={`${topCaptador?.total || 0} lead(s)`} cor="#2563eb" /><InsightCard icon="✅" titulo="Mais efetivo" valor={topEfetivo?.nome} detalhe={`${topEfetivo?.efetividade || 0}% · ${topEfetivo?.carregou || 0} carregou`} cor="#16a34a" /><InsightCard icon="⛔" titulo="Maior motivo de perda" valor={motivoTop?.motivo} detalhe={`${motivoTop?.qtd || 0} ocorrência(s)`} cor="#dc2626" /></div>
        <div className="cap-intel-grid"><RankingEfetividade ranking={ranking} /><MotivosNaoCarregou motivos={motivosNaoCarregou} /></div>
        <BancoMotoristas motoristas={bancoMotoristas} />
        <div className="cap-search-row"><div className="cap-search"><span>🔎</span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar motorista, número, motivo ou justificativa..." /></div>{['Todas', ...OPERACOES].map((op) => <button key={op} onClick={() => setFiltroOp(op)} className={`cap-filter ${filtroOp === op ? 'active' : ''}`}>{op}</button>)}<select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="cap-status-filter"><option value="Todos">Todos status</option>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></div>
        <div className="cap-list">
          {lista.length === 0 && <div className="cap-empty"><div style={{ fontSize: 38, opacity: 0.55 }}>👥</div><p>Nenhum lead por aqui ainda.</p></div>}
          {lista.map((m) => {
            const s = STATUS[m.status] || STATUS.contatado
            const isNaoCarregou = m.status === 'nao_carregou'
            return (
              <div key={m.id} className={`cap-driver-card ${isNaoCarregou ? 'cap-driver-no-load' : ''}`}>
                <div className="cap-driver-icon" style={{ background: `${s.cor}15`, color: s.cor }}>{s.icon}</div>
                <div className="cap-driver-main"><div className="cap-driver-top"><span className="cap-driver-name">{m.nome}</span><span className="cap-op-badge" style={{ background: m.operacao === 'Farelo' ? '#fef3c7' : '#dcfce7', color: m.operacao === 'Farelo' ? '#92400e' : '#166534' }}>🌾 {m.operacao}</span>{Number(m.quantidadeCargas || 1) > 1 && <span className="cap-load-count">{m.quantidadeCargas} cargas</span>}</div><div className="cap-phone">📞 {m.numero}</div><div className="cap-status-text" style={{ color: s.cor }}>{s.label}</div>{m.obs && <div className="cap-obs">💬 {m.obs}</div>}{isNaoCarregou && <div className="cap-no-load-box"><strong>Não carregou: {m.motivoNaoCarregou || 'Sem motivo'}</strong><span>{m.justificativaNaoCarregou || 'Sem justificativa informada.'}</span><ImpactoPill impacto={m.impactoPontuacao} /></div>}{isAdmin && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Captador: {m.nomeCaptador || m.captador}</div>}</div>
                <div className="cap-card-actions">{!['carregou', 'nao_carregou'].includes(m.status) && <button onClick={() => avancar(m)} className="cap-next-btn" style={{ background: s.cor }}>Avançar ›</button>}{!['carregou', 'nao_carregou'].includes(m.status) && <button onClick={() => marcarNaoCarregou(m)} className="cap-no-load-btn">Não carregou</button>}<div className="cap-small-actions">{m.numero && <a href={abrirWhats(m)} target="_blank" rel="noopener noreferrer" style={{ ...iconBtn, textDecoration: 'none' }}>💬</a>}<button onClick={() => { setEditando(m); setModal(true) }} style={iconBtn}>✏️</button><button onClick={() => confirm('Excluir lead?') && excluir(m.id)} style={iconBtn}>🗑️</button></div></div>
              </div>
            )
          })}
        </div>
      </main>
      <div className="cap-db-pill" style={{ borderColor: `${(MODO_BANCO_INFO[modoBanco] || MODO_BANCO_INFO.auto).cor}55` }}><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: (MODO_BANCO_INFO[modoBanco] || MODO_BANCO_INFO.auto).cor, marginRight: 7 }} />{(MODO_BANCO_INFO[modoBanco] || MODO_BANCO_INFO.auto).label}</div>
      <button onClick={() => { setEditando(null); setModal(true) }} className="cap-fab">+</button>
      <ModalMotorista aberto={modal} fechar={() => { setModal(false); setEditando(null) }} salvarMotorista={salvarMotorista} editando={editando} />
    </div>
  )
}
