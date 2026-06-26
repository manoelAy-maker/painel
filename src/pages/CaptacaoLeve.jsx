import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import * as legacy from '../lib/supabase'
import * as v2 from '../lib/supabaseV2'
import { gerarId } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import '../captacao-aggressive.css'

const STORAGE_KEY = 'captacoesVeiculosViaLog'
const PAGE_SIZE = 25
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
const EMPTY = { nome: '', cpf: '', numero: '', placa: '', eixos: '9 eixos', operacao: 'Farelo', status: 'interesse', lembrete: '', obs: '', quantidadeCargas: '1', motivoNaoCarregou: '', justificativaNaoCarregou: '', impactoPontuacao: 'externo' }
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
function formatarCpf(v) {
  const n = limparNumero(v).slice(0, 11)
  if (n.length <= 3) return n
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}
function hojeISO() { return new Date().toISOString().slice(0, 10) }
function agoraBR() { return new Date().toLocaleString('pt-BR') }
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
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function CaptacaoLeve() {
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
  const [pagina, setPagina] = useState(1)
  const buscaDebounced = useDebouncedValue(busca, 240)

  const isAdmin = usuarioAtual?.cargo === 'Admin'
  const filialAtual = usuarioAtual?.filial || 'jatai-go'
  const captadorId = usuarioAtual?.usuario || '-'
  const nomeCaptador = usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'
  const bancoInfo = MODO_BANCO_INFO[modoBanco] || MODO_BANCO_INFO.auto
  const hoje = hojeISO()

  useEffect(() => { salvarLocal(motoristas) }, [motoristas])
  useEffect(() => { setPagina(1) }, [buscaDebounced, filtroStatus, abaRapida, abaTela])

  useEffect(() => {
    let vivo = true
    async function carregar() {
      setCarregando(true)
      try {
        const listaV2 = await v2.listarCaptacoesV2({ admin: isAdmin, filial: filialAtual })
        if (vivo && listaV2.length) setMotoristas(listaV2.map(normalizar))
        if (vivo) setModoBanco('v2')
      } catch {
        try {
          const rows = await legacy.baixarTodos(isAdmin ? null : filialAtual)
          const lista = rows.filter(r => r.tipo === 'captacao').map(r => normalizar({ ...r.dados, filial: r.filial || r.dados?.filial }))
          if (vivo && lista.length) setMotoristas(lista)
          if (vivo) setModoBanco('legado')
        } catch {
          if (vivo) setModoBanco('local')
        }
      } finally {
        if (vivo) setCarregando(false)
      }
    }
    carregar()
    return () => { vivo = false }
  }, [isAdmin, filialAtual])

  const base = useMemo(() => motoristas.filter(m => {
    if (!isAdmin && (m.captador || m.usuario) !== captadorId) return false
    if (!isAdmin && (m.filial || filialAtual) !== filialAtual) return false
    return true
  }), [motoristas, isAdmin, captadorId, filialAtual])

  const lista = useMemo(() => {
    const q = buscaDebounced.trim().toLowerCase()
    return base
      .filter(m => filtroStatus === 'Todos' || m.status === filtroStatus)
      .filter(m => abaRapida === 'Todos' ||
        (abaRapida === 'Retorno hoje' && String(m.lembrete || '').slice(0, 10) === hoje) ||
        (abaRapida === 'Aguardando docs' && m.status === 'documentos') ||
        (abaRapida === 'Com ordem' && ['ordem', 'carregou'].includes(m.status)) ||
        (abaRapida === 'Atrasados' && m.lembrete && String(m.lembrete).slice(0, 10) < hoje && !['ordem', 'carregou', 'nao_carregou'].includes(m.status)) ||
        (abaRapida === 'Não carregou' && m.status === 'nao_carregou'))
      .filter(m => !q || [m.nome, m.cpf, m.placa, m.numero, m.obs, m.motivoNaoCarregou, STATUS[m.status]?.label].join(' ').toLowerCase().includes(q))
      .sort((a, b) => (STATUS[a.status]?.ordem || 0) - (STATUS[b.status]?.ordem || 0))
  }, [base, buscaDebounced, filtroStatus, abaRapida, hoje])

  const totalPaginas = Math.max(1, Math.ceil(lista.length / PAGE_SIZE))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const listaPagina = useMemo(() => lista.slice((paginaSegura - 1) * PAGE_SIZE, paginaSegura * PAGE_SIZE), [lista, paginaSegura])
  const stats = useMemo(() => ({
    total: base.length,
    hoje: base.filter(m => m.dataISO === hoje).length,
    docs: base.filter(m => m.status === 'documentos').length,
    ordem: base.filter(m => ['ordem', 'carregou'].includes(m.status)).length,
    conversao: base.length ? Math.round((base.filter(m => ['ordem', 'carregou'].includes(m.status)).length / base.length) * 100) : 0,
  }), [base, hoje])

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
    const anterior = editandoId ? motoristas.find(m => String(m.id) === String(editandoId)) : null
    const item = {
      ...(anterior || {}),
      id: editandoId || gerarId(),
      nome: form.nome.trim(), motorista: form.nome.trim(),
      cpf: formatarCpf(form.cpf), numero: formatarTelefone(form.numero), telefone: formatarTelefone(form.numero),
      placa: form.placa.toUpperCase(), eixos: form.eixos, operacao: form.operacao, produto: form.operacao,
      quantidadeCargas: String(Math.max(1, Number(form.quantidadeCargas || 1) || 1)),
      status: form.status, lembrete: form.lembrete, obs: form.obs.trim(),
      motivoNaoCarregou: form.status === 'nao_carregou' ? form.motivoNaoCarregou : '',
      justificativaNaoCarregou: form.status === 'nao_carregou' ? form.justificativaNaoCarregou.trim() : '',
      impactoPontuacao: form.status === 'nao_carregou' ? form.impactoPontuacao : 'externo',
      captador: captadorId, usuario: captadorId, nomeCaptador, nomeUsuario: nomeCaptador,
      filial: filialAtual, data: anterior?.data || agoraBR(), dataISO: anterior?.dataISO || hojeISO(), atualizadoPor: captadorId,
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
    <div className="ay-cap-shell ay-cap-lite">
      <aside className="ay-cap-side">
        <div>
          <div className="ay-cap-brand">
            <div className="ay-cap-logo">A</div>
            <div><strong>AYRES</strong><span>Captação de motoristas</span></div>
          </div>
          <nav className="ay-cap-menu">
            <button className={abaTela === 'lancamento' ? 'active' : ''} onClick={() => setAbaTela('lancamento')}>➕ Lançar motorista</button>
            <button className={abaTela === 'lancados' ? 'active' : ''} onClick={() => setAbaTela('lancados')}>📋 Motoristas lançados</button>
            <button onClick={() => { setAbaTela('lancados'); setAbaRapida('Retorno hoje') }}>🔔 Lembretes de hoje</button>
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
          <div className="ay-cap-title"><small>Central operacional</small><h1>Captação de Motoristas</h1><p>CRM rápido para registrar motoristas, acompanhar retorno, documentação, ordem e carregamento.</p></div>
          <div className="ay-cap-actions"><button className="ay-cap-back" onClick={voltarPortal}>← Voltar ao portal</button><div className="ay-cap-sync"><i style={{ background: bancoInfo.cor }} />{carregando ? 'Sincronizando...' : bancoInfo.label}</div></div>
        </section>

        <section className="ay-cap-cards">
          <div className="ay-cap-card"><span>Lançados</span><strong>{stats.total}</strong></div>
          <div className="ay-cap-card"><span>Hoje</span><strong>{stats.hoje}</strong></div>
          <div className="ay-cap-card"><span>Aguardando docs</span><strong>{stats.docs}</strong></div>
          <div className="ay-cap-card"><span>Com ordem</span><strong>{stats.ordem}</strong></div>
          <div className="ay-cap-card"><span>Conversão</span><strong>{stats.conversao}%</strong></div>
        </section>

        {abaTela === 'lancamento' && <section className="ay-cap-panel">
          <div className="ay-cap-panel-head"><div><h2>{editandoId ? 'Editar motorista' : 'Lançar motorista'}</h2><p>Campos essenciais: nome, telefone, CPF, placa do cavalo, eixos e lembrete.</p></div><span className="ay-note">{editandoId ? 'Modo edição' : 'Novo cadastro'}</span></div>
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
              <label className="ay-cap-field">Motivo<select value={form.motivoNaoCarregou} onChange={e => setForm(p => ({ ...p, motivoNaoCarregou: e.target.value }))}><option value="">Selecione</option>{MOTIVOS_NAO_CARREGOU.map(m => <option key={m}>{m}</option>)}</select></label>
              <label className="ay-cap-field">Impacto<select value={form.impactoPontuacao} onChange={e => setForm(p => ({ ...p, impactoPontuacao: e.target.value }))}>{Object.entries(IMPACTOS).map(([k, i]) => <option key={k} value={k}>{i.label} · {i.desc}</option>)}</select></label>
              <label className="ay-cap-field">Justificativa<textarea rows="2" value={form.justificativaNaoCarregou} onChange={e => setForm(p => ({ ...p, justificativaNaoCarregou: e.target.value }))} /></label>
            </div>}
            <label className="ay-cap-field">Observação<textarea rows="3" value={form.obs} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} placeholder="Ex: pediu retorno amanhã, falta documento..." /></label>
            <button className="ay-cap-save" onClick={salvar}>{editandoId ? 'Salvar alteração' : 'Salvar motorista'}</button>
          </div>
        </section>}

        {abaTela === 'lancados' && <section className="ay-cap-panel">
          <div className="ay-cap-panel-head"><div><h2>Motoristas lançados</h2><p>Busca com atraso inteligente e paginação para manter o painel leve.</p></div><span className="ay-note">{lista.length} resultado(s)</span></div>
          <div className="ay-cap-tools"><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, CPF, placa, motivo ou telefone..." /><select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option value="Todos">Todos status</option>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></div>
          <div className="ay-cap-chips">{['Todos', 'Retorno hoje', 'Aguardando docs', 'Atrasados', 'Com ordem', 'Não carregou'].map(t => <button key={t} onClick={() => setAbaRapida(t)} className={abaRapida === t ? 'active' : ''}>{t}</button>)}</div>
          <div className="ay-cap-table-wrap"><table className="ay-cap-table"><thead><tr><th>Status</th><th>Motorista</th><th>CPF</th><th>Placa</th><th>Eixos</th><th>Lembrete</th><th>Motivo</th><th>Obs.</th><th>Ações</th></tr></thead><tbody>{listaPagina.length === 0 && <tr><td colSpan="9" className="ay-empty">Nenhum motorista encontrado.</td></tr>}{listaPagina.map(m => <tr key={m.id}><td><span className={`ay-pill ${m.status}`}>{STATUS[m.status]?.label || 'Tem interesse'}</span></td><td><div className="ay-driver"><b>{(m.nome || '?')[0]}</b><div><strong>{m.nome}</strong><small>{m.numero}</small></div></div></td><td>{m.cpf || '-'}</td><td>{m.placa || '-'}</td><td>{m.eixos || '-'}</td><td>{lembreteTexto(m.lembrete)}</td><td>{m.status === 'nao_carregou' ? (m.motivoNaoCarregou || '-') : '-'}</td><td>{m.obs || '-'}</td><td><div className="ay-actions"><button onClick={() => editar(m)}>Editar</button>{STATUS[m.status]?.next && <button onClick={() => atualizar(m, STATUS[m.status].next)}>Avançar</button>}<button onClick={() => marcarPerda(m)}>Não carregou</button><button onClick={() => excluir(m)}>Excluir</button></div></td></tr>)}</tbody></table></div>
          <div className="ay-cap-pagination"><button disabled={paginaSegura <= 1} onClick={() => setPagina(p => Math.max(1, p - 1))}>← Anterior</button><span>Página {paginaSegura} de {totalPaginas}</span><button disabled={paginaSegura >= totalPaginas} onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}>Próxima →</button></div>
        </section>}
      </main>
    </div>
  )
}
