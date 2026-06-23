import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import * as legacy from '../lib/supabase'
import * as v2 from '../lib/supabaseV2'
import { gerarId } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import '../captacao-aggressive.css'

const STORAGE_KEY = 'captacoesVeiculosViaLog'
const EIXOS = ['6 eixos', '7 eixos', '8 eixos', '9 eixos']
const STATUS = {
  interesse: { label: 'Sem retorno', curto: 'Sem retorno', next: 'negociando', ordem: 1, icon: 'fa-headset' },
  negociando: { label: 'Negociação', curto: 'Negociação', next: 'documentos', ordem: 2, icon: 'fa-comments-dollar' },
  documentos: { label: 'Aguardando docs', curto: 'Docs', next: 'ordem', ordem: 3, icon: 'fa-file-signature' },
  ordem: { label: 'Captado / ordem', curto: 'Captado', next: 'carregou', ordem: 4, icon: 'fa-circle-check' },
  carregou: { label: 'Carregou', curto: 'Carregou', ordem: 5, icon: 'fa-truck-fast' },
  nao_carregou: { label: 'Não carregou', curto: 'Não carregou', ordem: 6, icon: 'fa-ban' },
}
const FUNIL = ['interesse', 'negociando', 'documentos', 'ordem', 'carregou', 'nao_carregou']
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
const EMPTY = {
  nome: '',
  cpf: '',
  numero: '',
  placa: '',
  eixos: '9 eixos',
  operacao: 'Farelo',
  status: 'interesse',
  lembrete: '',
  obs: '',
  quantidadeCargas: '1',
  motivoNaoCarregou: '',
  justificativaNaoCarregou: '',
  impactoPontuacao: 'externo',
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
function agoraBR() { return new Date().toLocaleString('pt-BR') }
function hojeISO() { return new Date().toISOString().slice(0, 10) }
function statusNormalizado(s) {
  if (['lead', 'contatado', 'retornar', 'retorno', 'sem_retorno'].includes(s)) return 'interesse'
  if (['fechado', 'captado', 'agendado'].includes(s)) return 'ordem'
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
function diasAte(valor) {
  if (!valor) return null
  const hoje = new Date(`${hojeISO()}T00:00`)
  const alvo = new Date(valor)
  if (Number.isNaN(alvo.getTime())) return null
  alvo.setHours(0, 0, 0, 0)
  return Math.round((alvo - hoje) / 86400000)
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
  const [modoBanco, setModoBanco] = useState('auto')
  const [carregando, setCarregando] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editandoId, setEditandoId] = useState(null)
  const [selecionado, setSelecionado] = useState(null)

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
    .filter(m => filtroStatus === 'Todos' || m.status === filtroStatus)
    .filter(m => !busca || [m.nome, m.cpf, m.placa, m.numero, m.obs, m.eixos, m.motivoNaoCarregou, STATUS[m.status]?.label].join(' ').toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => (STATUS[a.status]?.ordem || 0) - (STATUS[b.status]?.ordem || 0)), [base, busca, filtroStatus])

  const stats = useMemo(() => {
    const captados = base.filter(m => ['ordem', 'carregou'].includes(m.status)).length
    const lembretesHoje = base.filter(m => m.lembrete && diasAte(m.lembrete) <= 0 && !['carregou', 'nao_carregou'].includes(m.status)).length
    const atrasados = base.filter(m => m.lembrete && diasAte(m.lembrete) < 0 && !['carregou', 'nao_carregou'].includes(m.status)).length
    return {
      total: base.length,
      captados,
      lembretesHoje,
      atrasados,
      conversao: base.length ? Math.round((captados / base.length) * 100) : 0,
    }
  }, [base])

  const porStatus = useMemo(() => FUNIL.reduce((acc, status) => {
    acc[status] = lista.filter(m => m.status === status)
    return acc
  }, {}), [lista])

  const ranking = useMemo(() => {
    const mapa = new Map()
    base.forEach(m => {
      const chave = m.nomeCaptador || m.captador || 'Usuário'
      const atual = mapa.get(chave) || { nome: chave, total: 0, captados: 0 }
      atual.total += 1
      if (['ordem', 'carregou'].includes(m.status)) atual.captados += 1
      mapa.set(chave, atual)
    })
    return [...mapa.values()].map(r => ({ ...r, eficiencia: r.total ? Math.round((r.captados / r.total) * 100) : 0 })).sort((a, b) => b.captados - a.captados || b.eficiencia - a.eficiencia).slice(0, 5)
  }, [base])

  const lembretes = useMemo(() => base
    .filter(m => m.lembrete && !['carregou', 'nao_carregou'].includes(m.status))
    .sort((a, b) => new Date(a.lembrete) - new Date(b.lembrete))
    .slice(0, 6), [base])

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
      id: editandoId || gerarId(),
      nome: form.nome.trim(),
      motorista: form.nome.trim(),
      cpf: formatarCpf(form.cpf),
      numero: formatarTelefone(form.numero),
      telefone: formatarTelefone(form.numero),
      placa: form.placa.toUpperCase(),
      eixos: form.eixos,
      operacao: form.operacao,
      produto: form.operacao,
      quantidadeCargas: String(Math.max(1, Number(form.quantidadeCargas || 1) || 1)),
      status: form.status,
      lembrete: form.lembrete,
      obs: form.obs.trim(),
      motivoNaoCarregou: form.status === 'nao_carregou' ? form.motivoNaoCarregou : '',
      justificativaNaoCarregou: form.status === 'nao_carregou' ? form.justificativaNaoCarregou.trim() : '',
      impactoPontuacao: form.status === 'nao_carregou' ? form.impactoPontuacao : 'externo',
      captador: itemAnterior?.captador || captadorId,
      usuario: itemAnterior?.usuario || captadorId,
      nomeCaptador: itemAnterior?.nomeCaptador || nomeCaptador,
      nomeUsuario: itemAnterior?.nomeUsuario || nomeCaptador,
      filial: itemAnterior?.filial || filialAtual,
      data: itemAnterior?.data || agoraBR(),
      dataISO: itemAnterior?.dataISO || hojeISO(),
      atualizadoPor: captadorId,
    }
    const novaLista = editandoId ? motoristas.map(m => String(m.id) === String(editandoId) ? item : m) : [item, ...motoristas]
    await persistir(item, novaLista, editandoId ? 'Motorista atualizado.' : 'Motorista salvo.')
    setForm(EMPTY)
    setEditandoId(null)
  }

  const editar = m => {
    setSelecionado(null)
    setEditandoId(m.id)
    setForm({
      nome: m.nome || '', cpf: m.cpf || '', numero: m.numero || '', placa: m.placa || '', eixos: m.eixos || '9 eixos', operacao: m.operacao || 'Farelo',
      status: m.status || 'interesse', lembrete: m.lembrete || '', obs: m.obs || '', quantidadeCargas: String(m.quantidadeCargas || 1),
      motivoNaoCarregou: m.motivoNaoCarregou || '', justificativaNaoCarregou: m.justificativaNaoCarregou || '', impactoPontuacao: m.impactoPontuacao || 'externo',
    })
    document.querySelector('.capx-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const atualizar = async (m, status) => persistir({ ...m, status, atualizadoPor: captadorId }, motoristas.map(x => String(x.id) === String(m.id) ? { ...m, status, atualizadoPor: captadorId } : x), 'Status atualizado.')
  const marcarPerda = m => { editar({ ...m, status: 'nao_carregou' }) }
  const excluir = m => confirm('Excluir lead?') && persistir(m, motoristas.filter(x => String(x.id) !== String(m.id)), 'Lead excluído.')
  const limparFormulario = () => { setForm(EMPTY); setEditandoId(null) }

  return (
    <div className="capx-shell">
      <section className="capx-hero">
        <div className="capx-brand">
          <div className="capx-mark">AY</div>
          <div>
            <span>Central de captação</span>
            <h1>Captação de Veículos</h1>
            <p>Funil limpo para cadastrar motorista, acompanhar retorno, controlar placa do cavalo, eixos e lembrete por data.</p>
          </div>
        </div>
        <div className="capx-top-actions">
          <button type="button" onClick={voltarPortal}>Voltar ao portal</button>
          <div className="capx-sync"><i style={{ background: bancoInfo.cor }} />{carregando ? 'Sincronizando...' : bancoInfo.label}</div>
        </div>
      </section>

      <section className="capx-stats">
        <article><i className="fa-solid fa-truck-fast" /><span>Total no funil</span><strong>{stats.total}</strong><small>{nomeFilial(filialAtual)}</small></article>
        <article><i className="fa-solid fa-circle-check" /><span>Captados</span><strong>{stats.captados}</strong><small>{stats.conversao}% de conversão</small></article>
        <article><i className="fa-solid fa-bell" /><span>Lembretes hoje</span><strong>{stats.lembretesHoje}</strong><small>{stats.atrasados} atrasado(s)</small></article>
        <article><i className="fa-solid fa-user-tie" /><span>Captador</span><strong>{nomeCaptador.split(' ')[0]}</strong><small>{isAdmin ? 'Visão admin' : 'Minha carteira'}</small></article>
      </section>

      <section className="capx-workspace">
        <aside className="capx-form">
          <header>
            <div>
              <span>{editandoId ? 'Editando cadastro' : 'Cadastro rápido'}</span>
              <h2>{editandoId ? 'Atualizar motorista' : 'Nova captação'}</h2>
            </div>
            {editandoId && <button type="button" onClick={limparFormulario}>Cancelar</button>}
          </header>

          <div className="capx-fields">
            <label>Nome do motorista<input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: João Silva" /></label>
            <div className="capx-row"><label>CPF<input value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: formatarCpf(e.target.value) }))} placeholder="000.000.000-00" /></label><label>Telefone<input value={form.numero} onChange={e => setForm(p => ({ ...p, numero: formatarTelefone(e.target.value) }))} placeholder="(64) 99999-9999" /></label></div>
            <div className="capx-row"><label>Placa do cavalo<input value={form.placa} onChange={e => setForm(p => ({ ...p, placa: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) }))} placeholder="ABC1D23" /></label><label>Eixos<select value={form.eixos} onChange={e => setForm(p => ({ ...p, eixos: e.target.value }))}>{EIXOS.map(e => <option key={e}>{e}</option>)}</select></label></div>
            <div className="capx-row"><label>Status<select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>{FUNIL.map(k => <option key={k} value={k}>{STATUS[k].label}</option>)}</select></label><label>Data do lembrete<input type="datetime-local" value={form.lembrete} onChange={e => setForm(p => ({ ...p, lembrete: e.target.value }))} /></label></div>
            {form.status === 'nao_carregou' && <div className="capx-loss"><label>Motivo<select value={form.motivoNaoCarregou} onChange={e => setForm(p => ({ ...p, motivoNaoCarregou: e.target.value }))}><option value="">Selecione</option>{MOTIVOS_NAO_CARREGOU.map(m => <option key={m}>{m}</option>)}</select></label><label>Impacto<select value={form.impactoPontuacao} onChange={e => setForm(p => ({ ...p, impactoPontuacao: e.target.value }))}>{Object.entries(IMPACTOS).map(([k, i]) => <option key={k} value={k}>{i.label} · {i.desc}</option>)}</select></label><label>Justificativa<textarea rows="2" value={form.justificativaNaoCarregou} onChange={e => setForm(p => ({ ...p, justificativaNaoCarregou: e.target.value }))} placeholder="Explique por que não carregou" /></label></div>}
            <label>Observação<textarea rows="3" value={form.obs} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} placeholder="Ex: pediu retorno amanhã, confirmou placa, está aguardando valor..." /></label>
            <button className="capx-save" type="button" onClick={salvar}>{editandoId ? 'Salvar alteração' : 'Captar veículo'}</button>
          </div>
        </aside>

        <main className="capx-main">
          <div className="capx-tools">
            <div className="capx-search"><i className="fa-solid fa-magnifying-glass" /><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, CPF, telefone ou placa..." /></div>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option value="Todos">Todos os status</option>{FUNIL.map(k => <option key={k} value={k}>{STATUS[k].label}</option>)}</select>
          </div>

          <section className="capx-funnel">
            {FUNIL.map(status => <div className="capx-lane" key={status}>
              <header><strong><i className={`fa-solid ${STATUS[status].icon}`} />{STATUS[status].curto}</strong><span>{porStatus[status]?.length || 0}</span></header>
              <div className="capx-cards">
                {(porStatus[status] || []).length === 0 && <div className="capx-empty">Sem motorista aqui.</div>}
                {(porStatus[status] || []).map(m => <article className="capx-card" key={m.id} onClick={() => setSelecionado(m)}>
                  <div className="capx-card-top"><div><strong>{m.nome || 'Sem nome'}</strong><small>{m.cpf || 'CPF não informado'}</small></div><b>{m.placa || 'SEM PLACA'}</b></div>
                  <div className="capx-card-grid"><span><small>Telefone</small>{m.numero || '-'}</span><span><small>Eixos</small>{m.eixos || '-'}</span></div>
                  <div className="capx-card-bottom"><em className={diasAte(m.lembrete) < 0 ? 'late' : diasAte(m.lembrete) === 0 ? 'today' : ''}><i className="fa-regular fa-clock" />{lembreteTexto(m.lembrete)}</em></div>
                </article>)}
              </div>
            </div>)}
          </section>
        </main>
      </section>

      <section className="capx-bottom">
        <aside className="capx-panel">
          <header><strong>Ranking de captação</strong><span>Captados / eficiência</span></header>
          <div className="capx-list">{ranking.length === 0 && <div className="capx-empty">Sem dados para ranking.</div>}{ranking.map((r, i) => <div className="capx-rank" key={r.nome}><b>{i + 1}</b><div><strong>{r.nome}</strong><small>{r.total} contato(s) no funil</small></div><span>{r.captados} · {r.eficiencia}%</span></div>)}</div>
        </aside>
        <aside className="capx-panel">
          <header><strong>Próximos lembretes</strong><span>Retornos para não perder veículo</span></header>
          <div className="capx-list">{lembretes.length === 0 && <div className="capx-empty">Nenhum lembrete pendente.</div>}{lembretes.map(m => <button className="capx-reminder" key={m.id} onClick={() => setSelecionado(m)}><i className="fa-solid fa-bell" /><div><strong>{m.nome}</strong><small>{lembreteTexto(m.lembrete)} · {m.placa || 'sem placa'}</small></div></button>)}</div>
        </aside>
      </section>

      {selecionado && <div className="capx-modal" onClick={() => setSelecionado(null)}>
        <div className="capx-modal-box" onClick={e => e.stopPropagation()}>
          <header><div><span>Detalhes do contato</span><h2>{selecionado.nome}</h2></div><button onClick={() => setSelecionado(null)}>×</button></header>
          <div className="capx-detail-grid">
            <div><small>CPF</small><strong>{selecionado.cpf || '-'}</strong></div>
            <div><small>Telefone</small><strong>{selecionado.numero || '-'}</strong></div>
            <div><small>Placa cavalo</small><strong>{selecionado.placa || '-'}</strong></div>
            <div><small>Eixos</small><strong>{selecionado.eixos || '-'}</strong></div>
            <div><small>Status</small><strong>{STATUS[selecionado.status]?.label || '-'}</strong></div>
            <div><small>Lembrete</small><strong>{lembreteTexto(selecionado.lembrete)}</strong></div>
          </div>
          <div className="capx-note"><small>Observação</small><p>{selecionado.obs || 'Sem observação.'}</p></div>
          {selecionado.status === 'nao_carregou' && <div className="capx-note danger"><small>Motivo do não carregamento</small><p>{selecionado.motivoNaoCarregou || '-'} · {selecionado.justificativaNaoCarregou || '-'}</p></div>}
          <footer>
            <button onClick={() => editar(selecionado)}>Editar</button>
            {STATUS[selecionado.status]?.next && <button onClick={() => { atualizar(selecionado, STATUS[selecionado.status].next); setSelecionado(null) }}>Avançar status</button>}
            <button onClick={() => marcarPerda(selecionado)}>Não carregou</button>
            <button className="danger" onClick={() => { excluir(selecionado); setSelecionado(null) }}>Excluir</button>
          </footer>
        </div>
      </div>}
    </div>
  )
}
