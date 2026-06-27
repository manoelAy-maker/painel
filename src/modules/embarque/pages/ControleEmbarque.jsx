import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../../context/AppContext'
import { gerarId } from '../../../utils/index'
import { podeAdministrar } from '../../../utils/roles'
import { getClient } from '../../../lib/supabase'
import './controle-embarque.css'

const STORAGE_KEY = 'controleEmbarquesViaLog'
const TABLE = 'vl_embarques'
const PAGE_SIZE = 18

const STATUS = {
  captado: { label: 'Captado', next: 'aguardando', color: '#2563eb' },
  aguardando: { label: 'Aguardando', next: 'agendado', color: '#f97316' },
  agendado: { label: 'Agendado', next: 'carregado', color: '#7c3aed' },
  carregado: { label: 'Carregado', next: '', color: '#16a34a' },
  cancelado: { label: 'Cancelado', next: '', color: '#64748b' },
}

const EMPTY = {
  placa: '', motorista: '', cpf: '', telefone: '', eixos: '9 eixos', origem: 'Jataí', destino: '', produto: 'Soja Grãos',
  notaFiscal: '', cte: '', lote: '', ordemCarregamento: '', transportadora: '', status: 'captado', dataCarregamento: '', lembrete: '', observacao: '',
}

const limparNumero = (v) => String(v || '').replace(/[^0-9]/g, '')
const normalizarBusca = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const placaLimpa = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
const hojeISO = () => new Date().toISOString().slice(0, 10)

function formatarCPF(v) {
  const n = limparNumero(v).slice(0, 11)
  if (n.length <= 3) return n
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}

function formatarTelefone(v) {
  const n = limparNumero(v).slice(0, 11)
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

function paraDatetimeLocal(valor) {
  if (!valor) return ''
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return String(valor).slice(0, 16)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

function dataCurta(valor) {
  if (!valor) return 'Sem data'
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return String(valor).slice(0, 16)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function carregarLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}
function salvarLocal(lista) { localStorage.setItem(STORAGE_KEY, JSON.stringify(lista)) }

function rowToItem(row) {
  const dados = row.dados || {}
  return {
    id: row.local_id || row.id || gerarId(),
    placa: row.placa || '', motorista: row.motorista || '', cpf: row.cpf || '', telefone: row.telefone || '', eixos: row.eixos || '9 eixos',
    origem: row.origem || '', destino: row.destino || '', produto: row.produto || '', notaFiscal: row.nota_fiscal || '', cte: row.cte || '', lote: row.lote || '',
    ordemCarregamento: row.ordem_carregamento || '', transportadora: row.transportadora || '', status: row.status || 'captado',
    dataCarregamento: paraDatetimeLocal(row.data_carregamento), lembrete: paraDatetimeLocal(row.lembrete_em), observacao: row.observacao || '',
    responsavel: dados.responsavel || row.responsavel_usuario || '-', filial: row.filial_id || dados.filial || 'jatai-go',
    criadoEm: row.created_at || dados.criadoEm || new Date().toISOString(), atualizadoEm: row.updated_at || dados.atualizadoEm || new Date().toISOString(),
  }
}

function itemToPayload(item, usuarioAtual) {
  const filial = item.filial || usuarioAtual?.filial || 'jatai-go'
  return {
    local_id: String(item.id),
    filial_id: filial,
    placa: placaLimpa(item.placa),
    motorista: item.motorista?.trim() || null,
    cpf: formatarCPF(item.cpf),
    telefone: formatarTelefone(item.telefone),
    eixos: item.eixos || null,
    origem: item.origem || null,
    destino: item.destino || null,
    produto: item.produto || null,
    nota_fiscal: item.notaFiscal || null,
    cte: item.cte || null,
    lote: item.lote || null,
    ordem_carregamento: item.ordemCarregamento || null,
    transportadora: item.transportadora || null,
    status: item.status || 'captado',
    data_carregamento: item.dataCarregamento ? new Date(item.dataCarregamento).toISOString() : null,
    lembrete_em: item.lembrete ? new Date(item.lembrete).toISOString() : null,
    responsavel_usuario: null,
    observacao: item.observacao || null,
    dados: {
      responsavel: usuarioAtual?.nome || usuarioAtual?.usuario || item.responsavel || 'Usuário',
      filial,
      atualizadoEm: new Date().toISOString(),
    },
  }
}

export default function ControleEmbarque() {
  const { usuarioAtual, toast } = useApp()
  const [embarques, setEmbarques] = useState(carregarLocal)
  const [form, setForm] = useState(EMPTY)
  const [editandoId, setEditandoId] = useState(null)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroData, setFiltroData] = useState('Todos')
  const [selecionados, setSelecionados] = useState([])
  const [pagina, setPagina] = useState(1)
  const [modoBanco, setModoBanco] = useState('carregando')

  const isAdmin = podeAdministrar(usuarioAtual)
  const filialAtual = usuarioAtual?.filial || 'jatai-go'

  useEffect(() => { salvarLocal(embarques) }, [embarques])
  useEffect(() => { setPagina(1) }, [busca, filtroStatus, filtroData])

  useEffect(() => {
    let vivo = true
    async function carregar() {
      try {
        const sb = getClient()
        let query = sb.from(TABLE).select('*').order('updated_at', { ascending: false })
        if (!isAdmin) query = query.eq('filial_id', filialAtual)
        const { data, error } = await query
        if (error) throw error
        if (vivo) {
          const lista = (data || []).map(rowToItem)
          if (lista.length) setEmbarques(lista)
          setModoBanco('online')
        }
      } catch {
        if (vivo) setModoBanco('local')
      }
    }
    carregar()
    return () => { vivo = false }
  }, [isAdmin, filialAtual])

  const base = useMemo(() => embarques.filter(e => isAdmin || (e.filial || filialAtual) === filialAtual), [embarques, isAdmin, filialAtual])

  const lista = useMemo(() => {
    const q = normalizarBusca(busca)
    const today = hojeISO()
    return base
      .filter(e => filtroStatus === 'Todos' || e.status === filtroStatus)
      .filter(e => {
        const data = String(e.dataCarregamento || '').slice(0, 10)
        if (filtroData === 'Hoje') return data === today
        if (filtroData === 'Sem data') return !data
        if (filtroData === 'Atrasados') return data && data < today && !['carregado', 'cancelado'].includes(e.status)
        return true
      })
      .filter(e => !q || normalizarBusca([e.placa, e.motorista, e.cpf, e.telefone, e.lote, e.ordemCarregamento, e.notaFiscal, e.cte, e.origem, e.destino, e.produto, e.transportadora, e.observacao].join(' ')).includes(q))
      .sort((a, b) => new Date(b.atualizadoEm || b.criadoEm || 0) - new Date(a.atualizadoEm || a.criadoEm || 0))
  }, [base, busca, filtroStatus, filtroData])

  const totalPaginas = Math.max(1, Math.ceil(lista.length / PAGE_SIZE))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const listaPagina = lista.slice((paginaSegura - 1) * PAGE_SIZE, paginaSegura * PAGE_SIZE)

  const stats = useMemo(() => ({
    total: base.length,
    agendado: base.filter(e => e.status === 'agendado').length,
    carregado: base.filter(e => e.status === 'carregado').length,
    pendente: base.filter(e => ['captado', 'aguardando'].includes(e.status)).length,
    cancelado: base.filter(e => e.status === 'cancelado').length,
  }), [base])

  function limparForm() {
    setForm(EMPTY)
    setEditandoId(null)
  }

  async function persistir(item, novaLista, mensagem = 'Embarque salvo.') {
    setEmbarques(novaLista)
    salvarLocal(novaLista)
    try {
      const sb = getClient()
      const { error } = await sb.from(TABLE).upsert(itemToPayload(item, usuarioAtual), { onConflict: 'local_id' })
      if (error) throw error
      setModoBanco('online')
      toast?.(mensagem, 'ok')
    } catch {
      setModoBanco('local')
      toast?.('Salvo localmente. Nuvem falhou.', 'warn')
    }
  }

  async function salvar() {
    if (!placaLimpa(form.placa) || !form.motorista.trim()) {
      alert('Informe pelo menos a placa e o motorista.')
      return
    }
    const anterior = editandoId ? embarques.find(e => String(e.id) === String(editandoId)) : null
    const item = {
      ...(anterior || {}),
      ...form,
      id: editandoId || gerarId(),
      placa: placaLimpa(form.placa),
      cpf: formatarCPF(form.cpf),
      telefone: formatarTelefone(form.telefone),
      filial: anterior?.filial || usuarioAtual?.filial || 'jatai-go',
      responsavel: usuarioAtual?.nome || usuarioAtual?.usuario || anterior?.responsavel || 'Usuário',
      criadoEm: anterior?.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    }
    const novaLista = editandoId ? embarques.map(e => String(e.id) === String(editandoId) ? item : e) : [item, ...embarques]
    await persistir(item, novaLista, editandoId ? 'Embarque atualizado.' : 'Embarque criado.')
    limparForm()
  }

  function editar(item) {
    setEditandoId(item.id)
    setForm({ ...EMPTY, ...item })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remover(item) {
    if (!confirm(`Excluir embarque da placa ${item.placa}?`)) return
    const novaLista = embarques.filter(e => String(e.id) !== String(item.id))
    setEmbarques(novaLista)
    salvarLocal(novaLista)
    try {
      const sb = getClient()
      const { error } = await sb.from(TABLE).delete().eq('local_id', String(item.id))
      if (error) throw error
      setModoBanco('online')
      toast?.('Embarque excluído.', 'ok')
    } catch {
      setModoBanco('local')
      toast?.('Excluído localmente. Nuvem falhou.', 'warn')
    }
  }

  async function mudarStatus(item, status) {
    const atualizado = { ...item, status, atualizadoEm: new Date().toISOString() }
    await persistir(atualizado, embarques.map(e => String(e.id) === String(item.id) ? atualizado : e), `Status alterado para ${STATUS[status]?.label || status}.`)
  }

  async function avancar(item) {
    const next = STATUS[item.status]?.next
    if (next) await mudarStatus(item, next)
  }

  async function duplicar(item) {
    const novo = { ...item, id: gerarId(), status: 'captado', lote: '', notaFiscal: '', cte: '', ordemCarregamento: '', criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() }
    await persistir(novo, [novo, ...embarques], 'Embarque duplicado.')
  }

  const toggleSelecionado = (id) => setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const selecionarPagina = () => setSelecionados(listaPagina.map(e => e.id))

  async function mudarStatusSelecionados(status) {
    const ids = new Set(selecionados)
    const alterados = embarques.map(e => ids.has(e.id) ? { ...e, status, atualizadoEm: new Date().toISOString() } : e)
    setEmbarques(alterados)
    salvarLocal(alterados)
    setSelecionados([])
    try {
      const sb = getClient()
      await Promise.all(alterados.filter(e => ids.has(e.id)).map(e => sb.from(TABLE).upsert(itemToPayload(e, usuarioAtual), { onConflict: 'local_id' })))
      setModoBanco('online')
      toast?.('Selecionados atualizados.', 'ok')
    } catch {
      setModoBanco('local')
      toast?.('Selecionados salvos localmente.', 'warn')
    }
  }

  return (
    <section className="embarque-shell">
      <div className="embarque-hero">
        <div>
          <span className="embarque-kicker">Operação</span>
          <h1>Controle de Embarque</h1>
          <p>Registre placas, motoristas, lote, documentos e acompanhe o carregamento sem depender de planilha solta.</p>
        </div>
        <div className="embarque-sync"><span className={modoBanco === 'online' ? 'on' : modoBanco === 'local' ? 'off' : ''} />{modoBanco === 'online' ? 'Nuvem online' : modoBanco === 'local' ? 'Modo local' : 'Conectando'}</div>
      </div>

      <div className="embarque-stats">
        <div><strong>{stats.total}</strong><span>Total</span></div>
        <div><strong>{stats.pendente}</strong><span>Pendentes</span></div>
        <div><strong>{stats.agendado}</strong><span>Agendados</span></div>
        <div><strong>{stats.carregado}</strong><span>Carregados</span></div>
        <div><strong>{stats.cancelado}</strong><span>Cancelados</span></div>
      </div>

      <div className="embarque-card embarque-form-card">
        <div className="embarque-card-head"><h2>{editandoId ? 'Editar embarque' : 'Novo embarque'}</h2><button onClick={limparForm}>Limpar</button></div>
        <div className="embarque-form-grid">
          <label>Placa cavalo<input value={form.placa} onChange={e => setForm(f => ({ ...f, placa: placaLimpa(e.target.value) }))} placeholder="ABC1D23" /></label>
          <label>Motorista<input value={form.motorista} onChange={e => setForm(f => ({ ...f, motorista: e.target.value }))} placeholder="Nome do motorista" /></label>
          <label>CPF<input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: formatarCPF(e.target.value) }))} placeholder="000.000.000-00" /></label>
          <label>Telefone<input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: formatarTelefone(e.target.value) }))} placeholder="(64) 99999-9999" /></label>
          <label>Eixos<select value={form.eixos} onChange={e => setForm(f => ({ ...f, eixos: e.target.value }))}><option>6 eixos</option><option>7 eixos</option><option>8 eixos</option><option>9 eixos</option></select></label>
          <label>Origem<input value={form.origem} onChange={e => setForm(f => ({ ...f, origem: e.target.value }))} /></label>
          <label>Destino<input value={form.destino} onChange={e => setForm(f => ({ ...f, destino: e.target.value }))} placeholder="Destino" /></label>
          <label>Produto<input value={form.produto} onChange={e => setForm(f => ({ ...f, produto: e.target.value }))} /></label>
          <label>Nota fiscal<input value={form.notaFiscal} onChange={e => setForm(f => ({ ...f, notaFiscal: e.target.value }))} /></label>
          <label>CT-e<input value={form.cte} onChange={e => setForm(f => ({ ...f, cte: e.target.value }))} /></label>
          <label>Lote<input value={form.lote} onChange={e => setForm(f => ({ ...f, lote: e.target.value }))} /></label>
          <label>O.C.<input value={form.ordemCarregamento} onChange={e => setForm(f => ({ ...f, ordemCarregamento: e.target.value }))} /></label>
          <label>Transportadora<input value={form.transportadora} onChange={e => setForm(f => ({ ...f, transportadora: e.target.value }))} /></label>
          <label>Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></label>
          <label>Data carregamento<input type="datetime-local" value={form.dataCarregamento} onChange={e => setForm(f => ({ ...f, dataCarregamento: e.target.value }))} /></label>
          <label>Lembrete<input type="datetime-local" value={form.lembrete} onChange={e => setForm(f => ({ ...f, lembrete: e.target.value }))} /></label>
          <label className="span-2">Observação<input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Ex: aguardando nota, trocar lote, confirmar horário..." /></label>
        </div>
        <div className="embarque-actions"><button className="primary" onClick={salvar}>{editandoId ? 'Salvar alterações' : 'Cadastrar embarque'}</button></div>
      </div>

      <div className="embarque-toolbar">
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por placa, motorista, lote, NF, CT-e, origem ou destino" />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option>Todos</option>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select>
        <select value={filtroData} onChange={e => setFiltroData(e.target.value)}><option>Todos</option><option>Hoje</option><option>Atrasados</option><option>Sem data</option></select>
        <button onClick={selecionarPagina}>Selecionar página</button>
      </div>

      {selecionados.length > 0 && <div className="embarque-bulk"><strong>{selecionados.length}</strong> selecionado(s)<button onClick={() => mudarStatusSelecionados('agendado')}>Marcar agendado</button><button onClick={() => mudarStatusSelecionados('carregado')}>Marcar carregado</button><button onClick={() => setSelecionados([])}>Cancelar seleção</button></div>}

      <div className="embarque-table-wrap">
        <table className="embarque-table">
          <thead><tr><th></th><th>Placa / Motorista</th><th>Rota</th><th>Documentos</th><th>Status</th><th>Data</th><th>Ações</th></tr></thead>
          <tbody>
            {listaPagina.map(item => (
              <tr key={item.id}>
                <td><input type="checkbox" checked={selecionados.includes(item.id)} onChange={() => toggleSelecionado(item.id)} /></td>
                <td><strong>{item.placa || '-'}</strong><span>{item.motorista || '-'} · {item.eixos || '-'}</span><small>{item.cpf || 'CPF não informado'} · {item.telefone || 'Sem telefone'}</small></td>
                <td><strong>{item.origem || '-'} → {item.destino || '-'}</strong><span>{item.produto || '-'}</span><small>{item.transportadora || 'Sem transportadora'}</small></td>
                <td><span>NF {item.notaFiscal || '-'}</span><span>CT-e {item.cte || '-'}</span><small>Lote {item.lote || '-'} · O.C. {item.ordemCarregamento || '-'}</small></td>
                <td><button className="status-pill" style={{ '--st': STATUS[item.status]?.color || '#64748b' }} onClick={() => avancar(item)}>{STATUS[item.status]?.label || item.status}</button></td>
                <td><strong>{dataCurta(item.dataCarregamento)}</strong><small>Lembrete: {dataCurta(item.lembrete)}</small></td>
                <td><div className="row-actions"><button onClick={() => editar(item)}>Editar</button><button onClick={() => duplicar(item)}>Duplicar</button><button onClick={() => remover(item)}>Excluir</button></div></td>
              </tr>
            ))}
            {!listaPagina.length && <tr><td colSpan="7" className="embarque-empty">Nenhum embarque encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="embarque-pagination"><button disabled={paginaSegura <= 1} onClick={() => setPagina(p => Math.max(1, p - 1))}>Anterior</button><span>Página {paginaSegura} de {totalPaginas}</span><button disabled={paginaSegura >= totalPaginas} onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}>Próxima</button></div>
    </section>
  )
}
