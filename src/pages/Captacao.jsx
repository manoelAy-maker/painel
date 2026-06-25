import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import * as legacy from '../lib/supabase'
import * as v2 from '../lib/supabaseV2'
import { gerarId } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import '../captacao-aggressive.css'

const STORAGE_KEY = 'captacoesVeiculosViaLog'
const OPERACOES = ['Farelo', 'Grãos']
const EIXOS = ['6 eixos', '7 eixos', '8 eixos', '9 eixos']
const STATUS = {
  interesse: { label: 'Tem interesse', next: 'negociando', ordem: 1 },
  negociando: { label: 'Negociando valor', next: 'documentos', ordem: 2 },
  documentos: { label: 'Aguardando documentos', next: 'ordem', ordem: 3 },
  ordem: { label: 'Ordem enviada', next: 'carregou', ordem: 4 },
  carregou: { label: 'Carregou', ordem: 5 },
  nao_carregou: { label: 'Não carregou', ordem: 6 },
}
const MOTIVOS_NAO_CARREGOU = ['Preço não fechou', 'Sem agenda', 'Sem retorno', 'Seguradora não libera', 'Documentação pendente', 'Motorista desistiu', 'Veículo carregou em outra empresa', 'Cadastro/dados incorretos', 'Motorista sem perfil da operação', 'Falta de acompanhamento', 'Outro']
const IMPACTOS = {
  externo: { label: 'Motivo externo', desc: 'Não pesa na captação' },
  falha_captacao: { label: 'Falha da captação', desc: 'Pesa na captação' },
  analise: { label: 'Em análise', desc: 'Validar depois' },
}
const MODO_BANCO_INFO = {
  auto: { label: 'Verificando', cor: '#94a3b8' },
  v2: { label: 'Nuvem online', cor: '#22c55e' },
  'v2+legado': { label: 'Nuvem online', cor: '#22c55e' },
  legado: { label: 'Banco antigo', cor: '#f59e0b' },
  local: { label: 'Local', cor: '#ef4444' },
}
const EMPTY = { nome: '', cpf: '', numero: '', placa: '', eixos: '9 eixos', operacao: 'Farelo', status: 'interesse', lembrete: '', obs: '', quantidadeCargas: '1', motivoNaoCarregou: '', justificativaNaoCarregou: '', impactoPontuacao: 'externo' }

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
  if (['lead', 'contatado', 'retornar', 'retorno'].includes(s)) return 'interesse'
  if (s === 'fechado') return 'ordem'
  if (s === 'perdido' || s === 'nao_carregou') return 'nao_carregou'
  return STATUS[s] ? s : 'interesse'
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
    motivoNaoCarregou: item.motivoNaoCarregou || item.motivo_nao_carregou || '',
    justificativaNaoCarregou: item.justificativaNaoCarregou || item.justificativa_nao_carregou || '',
    impactoPontuacao: item.impactoPontuacao || item.impacto_pontuacao || 'externo',
    quantidadeCargas: String(item.quantidadeCargas || item.quantidade_cargas || 1),
    captador: item.captador || item.usuario || '-',
    nomeCaptador: item.nomeCaptador || item.nomeUsuario || item.usuario || '-',
    filial: item.filial || 'jatai-go',
    data: item.data || agoraBR(),
    dataISO: item.dataISO || hojeISO(),
  }
}
function carregarLocal() { try { return (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).map(normalizar) } catch { return [] } }
function salvarLocal(lista) { localStorage.setItem(STORAGE_KEY, JSON.stringify(lista)) }
function lembreteTexto(valor) {
  if (!valor) return 'Sem lembrete'
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return valor
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function voltarPortal() {
  localStorage.removeItem('moduloInicialViaLog')
  window.dispatchEvent(new Event('ayres:modulo'))
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
  const [abaTela, setAbaTela] = useState('lancamento')

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
    .filter(m => abaRapida === 'Todos' || (abaRapida === 'Retorno hoje' && String(m.lembrete || '').slice(0, 10) === hoje) || (abaRapida === 'Aguardando docs' && m.status === 'documentos') || (abaRapida === 'Com ordem' && ['ordem', 'carregou'].includes(m.status)) || (abaRapida === 'Atrasados' && m.lembrete && String(m.lembrete).slice(0, 10) < hoje && !['ordem', 'carregou', 'nao_carregou'].includes(m.status)) || (abaRapida === 'Não carregou' && m.status === 'nao_carregou'))
    .filter(m => !busca || [m.nome, m.cpf, m.placa, m.numero, m.obs, m.motivoNaoCarregou, STATUS[m.status]?.label].join(' ').toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => (STATUS[a.status]?.ordem || 0) - (STATUS[b.status]?.ordem || 0)), [base, busca, filtroStatus, abaRapida, hoje])

  const stats = {
    total: base.length,
    hoje: base.filter(m => m.dataISO === hoje).length,
    docs: base.filter(m => m.status === 'documentos').length,
    ordem: base.filter(m => ['ordem', 'carregou'].includes(m.status)).length,
    perdido: base.filter(m => m.status === 'nao_carregou').length,
    conversao: base.length ? Math.round((base.filter(m => ['ordem', 'carregou'].includes(m.status)).length / base.length) * 100) : 0,
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
    if (form.status === 'nao_carregou' && (!form.motivoNaoCarregou || !form.justificativaNaoCarregou.trim())) {
      alert('Para marcar Não carregou, informe o motivo e a justificativa.')
      return
    }
    const itemAnterior = editandoId ? motoristas.find(m => String(m.id) === String(editandoId)) : null
    const item = {
      ...(itemAnterior || {}),
      id: editandoId || gerarId(), nome: form.nome.trim(), motorista: form.nome.trim(), cpf: formatarCpf(form.cpf), numero: formatarTelefone(form.numero), telefone: formatarTelefone(form.numero), placa: form.placa.toUpperCase(), eixos: form.eixos,
      operacao: form.operacao, produto: form.operacao, quantidadeCargas: String(Math.max(1, Number(form.quantidadeCargas || 1) || 1)), status: form.status, lembrete: form.lembrete, obs: form.obs.trim(),
      motivoNaoCarregou: form.status === 'nao_carregou' ? form.motivoNaoCarregou : '', justificativaNaoCarregou: form.status === 'nao_carregou' ? form.justificativaNaoCarregou.trim() : '', impactoPontuacao: form.status === 'nao_carregou' ? form.impactoPontuacao : 'externo',
      captador: captadorId, usuario: captadorId, nomeCaptador, nomeUsuario: nomeCaptador, filial: filialAtual, data: itemAnterior?.data || agoraBR(), dataISO: itemAnterior?.dataISO || hojeISO(), atualizadoPor: captadorId,
    }
    const novaLista = editandoId ? motoristas.map(m => String(m.id) === String(editandoId) ? item : m) : [item, ...motoristas]
    await persistir(item, novaLista, editandoId ? 'Motorista atualizado.' : 'Motorista salvo.')
    setForm(EMPTY); setEditandoId(null); setAbaTela('lancados')
  }

  const editar = m => { setEditandoId(m.id); setAbaTela('lancamento'); setForm({ nome: m.nome || '', cpf: m.cpf || '', numero: m.numero || '', placa: m.placa || '', eixos: m.eixos || '9 eixos', operacao: m.operacao || 'Farelo', status: m.status || 'interesse', lembrete: m.lembrete || '', obs: m.obs || '', quantidadeCargas: String(m.quantidadeCargas || 1), motivoNaoCarregou: m.motivoNaoCarregou || '', justificativaNaoCarregou: m.justificativaNaoCarregou || '', impactoPontuacao: m.impactoPontuacao || 'externo' }) }
  const atualizar = async (m, status) => persistir({ ...m, status, atualizadoPor: captadorId }, motoristas.map(x => String(x.id) === String(m.id) ? { ...m, status, atualizadoPor: captadorId } : x), 'Status atualizado.')
  const marcarPerda = m => { setEditandoId(m.id); setAbaTela('lancamento'); setForm({ nome: m.nome || '', cpf: m.cpf || '', numero: m.numero || '', placa: m.placa || '', eixos: m.eixos || '9 eixos', operacao: m.operacao || 'Farelo', status: 'nao_carregou', lembrete: m.lembrete || '', obs: m.obs || '', quantidadeCargas: String(m.quantidadeCargas || 1), motivoNaoCarregou: m.motivoNaoCarregou || '', justificativaNaoCarregou: m.justificativaNaoCarregou || '', impactoPontuacao: m.impactoPontuacao || 'externo' }) }
  const excluir = m => confirm('Excluir motorista?') && persistir(m, motoristas.filter(x => String(x.id) !== String(m.id)), 'Motorista excluído.')

  return (
    <div className="ay-cap-shell">
      <style>{`
        .ay-cap-shell{min-height:calc(100vh - 40px);display:grid;grid-template-columns:270px 1fr;gap:22px;color:#e5eefc;font-family:Inter,system-ui,sans-serif}
        .ay-cap-side{position:sticky;top:16px;height:calc(100vh - 56px);background:linear-gradient(180deg,#07111f,#0b1220 58%,#050914);border:1px solid rgba(148,163,184,.16);box-shadow:0 24px 80px rgba(0,0,0,.42);border-radius:28px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}
        .ay-cap-side:before{content:'';position:absolute;inset:-90px auto auto -100px;width:220px;height:220px;background:#0ea5e9;filter:blur(70px);opacity:.22}
        .ay-cap-brand{position:relative;display:flex;gap:14px;align-items:center;margin-bottom:28px}.ay-cap-logo{width:48px;height:48px;border-radius:18px;background:linear-gradient(135deg,#2563eb,#06b6d4);display:grid;place-items:center;font-weight:950;font-size:25px;box-shadow:0 14px 35px rgba(37,99,235,.42)}
        .ay-cap-brand strong{display:block;font-size:25px;letter-spacing:.08em}.ay-cap-brand span{display:block;color:#94a3b8;font-size:12px;margin-top:2px}.ay-cap-menu{position:relative;display:grid;gap:10px}.ay-cap-menu button{border:0;width:100%;display:flex;align-items:center;gap:12px;text-align:left;padding:14px 15px;border-radius:17px;background:transparent;color:#cbd5e1;font-weight:800;cursor:pointer;transition:.22s}.ay-cap-menu button:hover,.ay-cap-menu button.active{background:linear-gradient(135deg,#2563eb,#0891b2);color:#fff;transform:translateX(4px);box-shadow:0 14px 32px rgba(8,145,178,.26)}
        .ay-cap-user{position:relative;border-radius:20px;padding:15px;background:rgba(15,23,42,.78);border:1px solid rgba(148,163,184,.14)}.ay-cap-user small{color:#94a3b8}.ay-cap-user b{display:block;margin-top:4px}.ay-cap-main{min-width:0}.ay-cap-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}.ay-cap-title small{display:inline-flex;padding:7px 10px;border-radius:999px;background:rgba(14,165,233,.12);color:#7dd3fc;border:1px solid rgba(125,211,252,.2);font-weight:900}.ay-cap-title h1{margin:12px 0 4px;font-size:clamp(28px,4vw,46px);letter-spacing:-.05em}.ay-cap-title p{margin:0;color:#94a3b8;max-width:720px}.ay-cap-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.ay-cap-back,.ay-cap-sync{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.76);color:#e2e8f0;border-radius:16px;padding:12px 14px;font-weight:850}.ay-cap-back{cursor:pointer}.ay-cap-sync i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:8px}.ay-cap-cards{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:13px;margin-bottom:18px}.ay-cap-card{border:1px solid rgba(148,163,184,.15);background:linear-gradient(180deg,rgba(15,23,42,.88),rgba(2,6,23,.86));border-radius:22px;padding:17px;box-shadow:0 18px 50px rgba(0,0,0,.25)}.ay-cap-card span{color:#94a3b8;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.ay-cap-card strong{display:block;font-size:30px;margin-top:7px}.ay-cap-panel{background:linear-gradient(180deg,rgba(15,23,42,.9),rgba(2,6,23,.86));border:1px solid rgba(148,163,184,.15);border-radius:30px;box-shadow:0 25px 80px rgba(0,0,0,.32);padding:24px;overflow:hidden}.ay-cap-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:20px}.ay-cap-panel-head h2{margin:0;font-size:26px;letter-spacing:-.03em}.ay-cap-panel-head p{margin:4px 0 0;color:#94a3b8}.ay-cap-form{display:grid;gap:16px}.ay-cap-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.ay-cap-field{display:grid;gap:7px;color:#cbd5e1;font-size:13px;font-weight:850}.ay-cap-field input,.ay-cap-field select,.ay-cap-field textarea,.ay-cap-tools input,.ay-cap-tools select{width:100%;border:1px solid rgba(148,163,184,.18);background:#020617;color:#f8fafc;border-radius:16px;padding:13px 14px;outline:none;font:inherit}.ay-cap-field textarea{resize:vertical}.ay-cap-field input:focus,.ay-cap-field select:focus,.ay-cap-field textarea:focus,.ay-cap-tools input:focus,.ay-cap-tools select:focus{border-color:#38bdf8;box-shadow:0 0 0 4px rgba(56,189,248,.12)}.ay-cap-loss{border:1px solid rgba(245,158,11,.25);background:rgba(245,158,11,.07);border-radius:20px;padding:15px;display:grid;gap:13px}.ay-cap-save{border:0;border-radius:18px;padding:15px 22px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;font-weight:950;font-size:15px;cursor:pointer;justify-self:start;box-shadow:0 18px 40px rgba(37,99,235,.32);transition:.2s}.ay-cap-save:hover{transform:translateY(-2px)}.ay-cap-tools{display:grid;grid-template-columns:1fr 220px;gap:12px;margin-bottom:12px}.ay-cap-chips{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:16px}.ay-cap-chips button{border:1px solid rgba(148,163,184,.16);background:#020617;color:#cbd5e1;border-radius:999px;padding:10px 13px;font-weight:850;cursor:pointer}.ay-cap-chips button.active{background:#e2e8f0;color:#020617}.ay-cap-table-wrap{overflow:auto;border:1px solid rgba(148,163,184,.12);border-radius:20px}.ay-cap-table{width:100%;border-collapse:collapse;min-width:980px}.ay-cap-table th{background:#020617;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.05em;text-align:left;padding:13px}.ay-cap-table td{padding:14px 13px;border-top:1px solid rgba(148,163,184,.1);vertical-align:middle}.ay-cap-table tr:hover td{background:rgba(15,23,42,.55)}.ay-driver{display:flex;align-items:center;gap:10px}.ay-driver b{width:34px;height:34px;border-radius:13px;background:linear-gradient(135deg,#0ea5e9,#2563eb);display:grid;place-items:center}.ay-driver strong{display:block}.ay-driver small{color:#94a3b8}.ay-pill{display:inline-flex;white-space:nowrap;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:950}.ay-pill.interesse{background:rgba(59,130,246,.16);color:#93c5fd}.ay-pill.negociando{background:rgba(245,158,11,.16);color:#fbbf24}.ay-pill.documentos{background:rgba(168,85,247,.16);color:#d8b4fe}.ay-pill.ordem,.ay-pill.carregou{background:rgba(34,197,94,.16);color:#86efac}.ay-pill.nao_carregou{background:rgba(239,68,68,.16);color:#fca5a5}.ay-actions{display:flex;gap:8px;flex-wrap:wrap}.ay-actions button{border:1px solid rgba(148,163,184,.15);background:rgba(15,23,42,.85);color:#e2e8f0;border-radius:12px;padding:8px 10px;font-weight:850;cursor:pointer}.ay-actions button:hover{border-color:#38bdf8}.ay-empty{text-align:center;color:#94a3b8;padding:34px!important}.ay-note{color:#94a3b8;font-size:13px}.ay-mob-tabs{display:none}
        @media(max-width:900px){.ay-cap-shell{display:block}.ay-cap-side{display:none}.ay-mob-tabs{display:flex;position:sticky;top:0;z-index:5;gap:8px;background:rgba(2,6,23,.9);backdrop-filter:blur(14px);padding:10px;margin:-6px -6px 14px;border-radius:0 0 20px 20px}.ay-mob-tabs button{flex:1;border:1px solid rgba(148,163,184,.16);background:#0f172a;color:#cbd5e1;border-radius:15px;padding:11px;font-weight:900}.ay-mob-tabs button.active{background:linear-gradient(135deg,#2563eb,#0891b2);color:#fff}.ay-cap-top{display:block}.ay-cap-actions{justify-content:flex-start;margin-top:14px}.ay-cap-cards{grid-template-columns:repeat(2,1fr)}.ay-cap-grid,.ay-cap-tools{grid-template-columns:1fr}.ay-cap-panel{padding:18px;border-radius:24px}.ay-cap-title h1{font-size:31px}}
      `}</style>

      <aside className="ay-cap-side">
        <div>
          <div className="ay-cap-brand">
            <div className="ay-cap-logo">A</div>
            <div><strong>AYRES</strong><span>Captação de motoristas</span></div>
          </div>
          <nav className="ay-cap-menu">
            <button className={abaTela === 'lancamento' ? 'active' : ''} onClick={() => setAbaTela('lancamento')}>➕ Lançar motorista</button>
            <button className={abaTela === 'lancados' ? 'active' : ''} onClick={() => setAbaTela('lancados')}>📋 Motoristas lançados</button>
            <button className={abaTela === 'lembretes' ? 'active' : ''} onClick={() => { setAbaTela('lancados'); setAbaRapida('Retorno hoje') }}>🔔 Lembretes de hoje</button>
          </nav>
        </div>
        <div className="ay-cap-user"><small>Usuário</small><b>{nomeCaptador}</b><small>{nomeFilial(filialAtual)}</small></div>
      </aside>

      <main className="ay-cap-main">
        <div className="ay-mob-tabs">
          <button className={abaTela === 'lancamento' ? 'active' : ''} onClick={() => setAbaTela('lancamento')}>Lançar</button>
          <button className={abaTela === 'lancados' ? 'active' : ''} onClick={() => setAbaTela('lancados')}>Lançados</button>
        </div>

        <section className="ay-cap-top">
          <div className="ay-cap-title">
            <small>Central operacional</small>
            <h1>Captação de Motoristas</h1>
            <p>Menu lateral para lançar, consultar os já lançados e acompanhar retorno sem misturar tudo na mesma tela.</p>
          </div>
          <div className="ay-cap-actions">
            <button className="ay-cap-back" onClick={voltarPortal}>← Voltar ao portal</button>
            <div className="ay-cap-sync"><i style={{ background: bancoInfo.cor }} />{carregando ? 'Sincronizando...' : bancoInfo.label}</div>
          </div>
        </section>

        <section className="ay-cap-cards">
          <div className="ay-cap-card"><span>Lançados</span><strong>{stats.total}</strong></div>
          <div className="ay-cap-card"><span>Hoje</span><strong>{stats.hoje}</strong></div>
          <div className="ay-cap-card"><span>Aguardando docs</span><strong>{stats.docs}</strong></div>
          <div className="ay-cap-card"><span>Com ordem</span><strong>{stats.ordem}</strong></div>
          <div className="ay-cap-card"><span>Conversão</span><strong>{stats.conversao}%</strong></div>
        </section>

        {abaTela === 'lancamento' && <section className="ay-cap-panel">
          <div className="ay-cap-panel-head">
            <div><h2>{editandoId ? 'Editar motorista' : 'Lançar motorista'}</h2><p>Campos essenciais para captação: placa do cavalo, eixos, nome, CPF, telefone e lembrete.</p></div>
            <span className="ay-note">{editandoId ? 'Modo edição' : 'Novo cadastro'}</span>
          </div>
          <div className="ay-cap-form">
            <div className="ay-cap-grid">
              <label className="ay-cap-field">Nome do motorista<input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: João Silva" /></label>
              <label className="ay-cap-field">Telefone<input value={form.numero} onChange={e => setForm(p => ({ ...p, numero: formatarTelefone(e.target.value) }))} placeholder="(64) 99999-9999" /></label>
              <label className="ay-cap-field">CPF<input value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: formatarCpf(e.target.value) }))} placeholder="000.000.000-00" /></label>
              <label className="ay-cap-field">Placa do cavalo<input value={form.placa} onChange={e => setForm(p => ({ ...p, placa: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) }))} placeholder="ABC1D23" /></label>
              <label className="ay-cap-field">Eixos<select value={form.eixos} onChange={e => setForm(p => ({ ...p, eixos: e.target.value }))}>{EIXOS.map(e => <option key={e}>{e}</option>)}</select></label>
              <label className="ay-cap-field">Lembrete<input type="datetime-local" value={form.lembrete} onChange={e => setForm(p => ({ ...p, lembrete: e.target.value }))} /></label>
              <label className="ay-cap-field">Operação<select value={form.operacao} onChange={e => setForm(p => ({ ...p, operacao: e.target.value }))}>{OPERACOES.map(op => <option key={op}>{op}</option>)}</select></label>
              <label className="ay-cap-field">Status<select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></label>
            </div>

            {form.status === 'nao_carregou' && <div className="ay-cap-loss">
              <label className="ay-cap-field">Motivo do não carregamento<select value={form.motivoNaoCarregou} onChange={e => setForm(p => ({ ...p, motivoNaoCarregou: e.target.value }))}><option value="">Selecione o motivo</option>{MOTIVOS_NAO_CARREGOU.map(m => <option key={m}>{m}</option>)}</select></label>
              <label className="ay-cap-field">Impacto<select value={form.impactoPontuacao} onChange={e => setForm(p => ({ ...p, impactoPontuacao: e.target.value }))}>{Object.entries(IMPACTOS).map(([k, i]) => <option key={k} value={k}>{i.label} · {i.desc}</option>)}</select></label>
              <label className="ay-cap-field">Justificativa<textarea rows="2" value={form.justificativaNaoCarregou} onChange={e => setForm(p => ({ ...p, justificativaNaoCarregou: e.target.value }))} placeholder="Explique por que o motorista não carregou..." /></label>
            </div>}

            <label className="ay-cap-field">Observação<textarea rows="3" value={form.obs} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} placeholder="Ex: pediu retorno amanhã, falta documento, já passou dados..." /></label>
            <button className="ay-cap-save" onClick={salvar}>{editandoId ? 'Salvar alteração' : 'Salvar motorista'}</button>
          </div>
        </section>}

        {abaTela === 'lancados' && <section className="ay-cap-panel">
          <div className="ay-cap-panel-head">
            <div><h2>Motoristas lançados</h2><p>Consulta rápida com filtros por status, retorno e busca por placa, nome, CPF ou telefone.</p></div>
          </div>
          <div className="ay-cap-tools">
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, CPF, placa, motivo ou telefone..." />
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option value="Todos">Todos status</option>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select>
          </div>
          <div className="ay-cap-chips">{['Todos', 'Retorno hoje', 'Aguardando docs', 'Atrasados', 'Com ordem', 'Não carregou'].map(t => <button key={t} onClick={() => setAbaRapida(t)} className={abaRapida === t ? 'active' : ''}>{t}</button>)}</div>
          <div className="ay-cap-table-wrap"><table className="ay-cap-table"><thead><tr><th>Status</th><th>Motorista</th><th>CPF</th><th>Placa</th><th>Eixos</th><th>Lembrete</th><th>Motivo</th><th>Obs.</th><th>Ações</th></tr></thead><tbody>{lista.length === 0 && <tr><td colSpan="9" className="ay-empty">Nenhum motorista encontrado.</td></tr>}{lista.map(m => <tr key={m.id}><td><span className={`ay-pill ${m.status}`}>{STATUS[m.status]?.label || 'Tem interesse'}</span></td><td><div className="ay-driver"><b>{(m.nome || '?')[0]}</b><div><strong>{m.nome}</strong><small>{m.numero}</small></div></div></td><td>{m.cpf || '-'}</td><td>{m.placa || '-'}</td><td>{m.eixos || '-'}</td><td>{lembreteTexto(m.lembrete)}</td><td>{m.status === 'nao_carregou' ? (m.motivoNaoCarregou || '-') : '-'}</td><td>{m.obs || '-'}</td><td><div className="ay-actions"><button onClick={() => editar(m)}>Editar</button>{STATUS[m.status]?.next && <button onClick={() => atualizar(m, STATUS[m.status].next)}>Avançar</button>}<button onClick={() => marcarPerda(m)}>Não carregou</button><button onClick={() => excluir(m)}>Excluir</button></div></td></tr>)}</tbody></table></div>
        </section>}
      </main>
    </div>
  )
}
