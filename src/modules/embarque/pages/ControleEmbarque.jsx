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
  agendado: { label: 'AG. CARREGAMENTO', classe: 'agendado' },
  carregado: { label: 'CARREGADO', classe: 'carregado' },
  cancelado: { label: 'CANCELADO', classe: 'cancelado' },
}

const LOTE_VAZIO = {
  produto: 'SOJA', origem: '', destino: '', lote: '', cadencia: '10', dataInicio: '', dataFim: '',
}

const LINHA_VAZIA = {
  cota: '', placa: '', peso: '', ordem: true, cte: true, transportadora: '', responsavel: '', status: 'agendado', seguradora: 'APROVADO', chamadoMdfe: '', motorista: '', telefone: '', observacao: '',
}

const limparNumero = (v) => String(v || '').replace(/[^0-9]/g, '')
const placaLimpa = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
const moedaPeso = (v) => String(v || '').replace(',', '.').replace(/[^0-9.]/g, '')
const dataBR = (iso) => iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''
const hojeISO = () => new Date().toISOString().slice(0, 10)

function ler(key, fallback = []) { try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback } }
function gravar(key, valor) { localStorage.setItem(key, JSON.stringify(valor)) }

function diasEntre(inicio, fim) {
  if (!inicio) return [hojeISO()]
  const start = new Date(`${inicio}T12:00:00`)
  const end = new Date(`${fim || inicio}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [inicio]
  const dias = []
  const d = new Date(start)
  while (d <= end) {
    dias.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return dias
}

function numeroPeso(v) {
  const n = Number(moedaPeso(v))
  return Number.isFinite(n) ? n : 0
}

function formatarPeso(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n) || n === 0) return ''
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

function formatarTelefone(v) {
  const n = limparNumero(v).slice(0, 11)
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

function loteRowToItem(row) {
  const dados = row.dados || {}
  return {
    id: row.local_id || row.id,
    produto: row.produto || dados.produto || 'SOJA',
    origem: row.origem || '',
    destino: row.destino || '',
    lote: row.lote || '',
    cadencia: String(row.cadencia || dados.cadencia || 0),
    dataInicio: row.data_inicio || dados.dataInicio || hojeISO(),
    dataFim: row.data_fim || dados.dataFim || row.data_inicio || hojeISO(),
    filial: row.filial_id || dados.filial || 'jatai-go',
    criadoPor: row.criado_por || dados.criadoPor || '-',
    status: row.status || 'ativo',
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
    chamadoMdfe: dados.chamadoMdfe || row.ordem_carregamento || '',
    motorista: row.motorista || '',
    telefone: row.telefone || '',
    observacao: row.observacao || '',
    filial: row.filial_id || dados.filial || 'jatai-go',
  }
}

function lotePayload(lote, usuarioAtual) {
  const filial = lote.filial || usuarioAtual?.filial || 'jatai-go'
  return {
    local_id: String(lote.id), filial_id: filial, produto: lote.produto || null, origem: lote.origem || null, destino: lote.destino || null,
    lote: lote.lote || null, cadencia: Math.max(0, Number(lote.cadencia || 0) || 0), data_inicio: lote.dataInicio || null, data_fim: lote.dataFim || lote.dataInicio || null,
    status: lote.status || 'ativo', criado_por: null, dados: { filial, criadoPor: usuarioAtual?.usuario || '-', nomeCriador: usuarioAtual?.nome || usuarioAtual?.usuario || '-' },
  }
}

function linhaPayload(linha, lote, usuarioAtual) {
  const filial = lote?.filial || usuarioAtual?.filial || 'jatai-go'
  return {
    local_id: String(linha.id), lote_local_id: String(linha.loteId), data_operacao: linha.dia, cota: Number(linha.cota || 0) || null,
    filial_id: filial, placa: placaLimpa(linha.placa), peso: numeroPeso(linha.peso) || null, ordem_carregamento: linha.ordem ? 'X' : '', cte: linha.cte ? 'X' : '',
    transportadora: linha.transportadora || null, motorista: linha.motorista || null, telefone: formatarTelefone(linha.telefone), status: linha.status || 'agendado',
    produto: lote?.produto || null, origem: lote?.origem || null, destino: lote?.destino || null, lote: lote?.lote || null,
    responsavel_usuario: null, observacao: linha.observacao || null,
    dados: { responsavel: linha.responsavel || '', seguradora: linha.seguradora || 'APROVADO', chamadoMdfe: linha.chamadoMdfe || '', filial },
  }
}

export default function ControleEmbarque() {
  const { usuarioAtual, toast } = useApp()
  const [lotes, setLotes] = useState(() => ler(LOTES_KEY))
  const [linhas, setLinhas] = useState(() => ler(LINHAS_KEY))
  const [formLote, setFormLote] = useState(LOTE_VAZIO)
  const [loteAtivoId, setLoteAtivoId] = useState('')
  const [diaAtivo, setDiaAtivo] = useState('')
  const [busca, setBusca] = useState('')
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
        let qLinhas = sb.from(T_LINHAS).select('*').order('cota', { ascending: true })
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

  const lotesVisiveis = useMemo(() => lotes.filter(l => isAdmin || (l.filial || filialAtual) === filialAtual), [lotes, isAdmin, filialAtual])
  const loteAtivo = lotesVisiveis.find(l => String(l.id) === String(loteAtivoId)) || lotesVisiveis[0] || null
  const dias = useMemo(() => loteAtivo ? diasEntre(loteAtivo.dataInicio, loteAtivo.dataFim) : [], [loteAtivo])
  const dia = diaAtivo && dias.includes(diaAtivo) ? diaAtivo : dias[0]

  useEffect(() => {
    if (!loteAtivoId && lotesVisiveis[0]) setLoteAtivoId(lotesVisiveis[0].id)
  }, [lotesVisiveis, loteAtivoId])
  useEffect(() => {
    if (dias[0] && !dias.includes(diaAtivo)) setDiaAtivo(dias[0])
  }, [dias, diaAtivo])

  const linhasDoDia = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return linhas
      .filter(l => String(l.loteId) === String(loteAtivo?.id) && l.dia === dia)
      .filter(l => !q || [l.placa, l.transportadora, l.motorista, l.responsavel, l.observacao].join(' ').toLowerCase().includes(q))
      .sort((a, b) => (Number(a.cota || 0) - Number(b.cota || 0)) || String(a.placa).localeCompare(String(b.placa)))
  }, [linhas, loteAtivo, dia, busca])

  const resumo = useMemo(() => {
    const lista = linhas.filter(l => String(l.loteId) === String(loteAtivo?.id) && l.dia === dia)
    return {
      total: lista.length,
      carregados: lista.filter(l => l.status === 'carregado').length,
      aguardando: lista.filter(l => l.status === 'agendado').length,
      peso: lista.reduce((s, l) => s + numeroPeso(l.peso), 0),
    }
  }, [linhas, loteAtivo, dia])

  async function salvarLote() {
    if (!formLote.produto || !formLote.origem || !formLote.destino || !formLote.lote || !formLote.dataInicio) {
      alert('Preencha produto, origem, destino, lote e data inicial.')
      return
    }
    const novo = { ...formLote, id: gerarId(), filial: filialAtual, status: 'ativo', criadoPor: usuarioAtual?.usuario || '-' }
    const lista = [novo, ...lotes]
    setLotes(lista)
    setLoteAtivoId(novo.id)
    setDiaAtivo(novo.dataInicio)
    setFormLote(LOTE_VAZIO)
    try {
      const sb = getClient()
      const { error } = await sb.from(T_LOTES).upsert(lotePayload(novo, usuarioAtual), { onConflict: 'local_id' })
      if (error) throw error
      setModoBanco('online')
      toast?.('Lote criado.', 'ok')
    } catch {
      setModoBanco('local')
      toast?.('Lote salvo localmente.', 'warn')
    }
  }

  async function salvarLinha(linhaNova) {
    if (!loteAtivo) return
    const lista = linhas.some(l => String(l.id) === String(linhaNova.id)) ? linhas.map(l => String(l.id) === String(linhaNova.id) ? linhaNova : l) : [...linhas, linhaNova]
    setLinhas(lista)
    try {
      const sb = getClient()
      const { error } = await sb.from(T_LINHAS).upsert(linhaPayload(linhaNova, loteAtivo, usuarioAtual), { onConflict: 'local_id' })
      if (error) throw error
      setModoBanco('online')
    } catch {
      setModoBanco('local')
    }
  }

  function atualizarLinha(id, campo, valor) {
    const lista = linhas.map(l => String(l.id) === String(id) ? { ...l, [campo]: valor } : l)
    setLinhas(lista)
  }

  async function persistirLinha(id) {
    const linha = linhas.find(l => String(l.id) === String(id))
    if (linha) await salvarLinha(linha)
  }

  function adicionarLinha() {
    if (!loteAtivo || !dia) return
    const proximaCota = Math.max(0, ...linhas.filter(l => String(l.loteId) === String(loteAtivo.id) && l.dia === dia).map(l => Number(l.cota || 0))) + 1
    const nova = { ...LINHA_VAZIA, id: gerarId(), loteId: loteAtivo.id, dia, cota: proximaCota, filial: loteAtivo.filial || filialAtual }
    setLinhas([...linhas, nova])
  }

  function gerarCotasDoDia() {
    if (!loteAtivo || !dia) return
    const cadencia = Math.max(1, Number(loteAtivo.cadencia || 0) || 1)
    const existentes = linhas.filter(l => String(l.loteId) === String(loteAtivo.id) && l.dia === dia)
    const existentesCotas = new Set(existentes.map(l => Number(l.cota)))
    const novas = []
    for (let c = 1; c <= cadencia; c++) {
      if (!existentesCotas.has(c)) novas.push({ ...LINHA_VAZIA, id: gerarId(), loteId: loteAtivo.id, dia, cota: c, filial: loteAtivo.filial || filialAtual })
    }
    setLinhas([...linhas, ...novas])
  }

  async function apagarLinha(id) {
    if (!confirm('Excluir esta linha?')) return
    setLinhas(linhas.filter(l => String(l.id) !== String(id)))
    try { await getClient().from(T_LINHAS).delete().eq('local_id', String(id)) } catch {}
  }

  async function marcarCarregado(linha) {
    await salvarLinha({ ...linha, status: 'carregado' })
  }

  return (
    <section className="embarque-facil">
      <header className="embarque-topo">
        <div>
          <span>Controle de Embarque</span>
          <h1>Lotes por dia, igual planilha.</h1>
          <p>Cadastre o lote, escolha o dia e lance as placas. Depois preencha o peso quando carregar.</p>
        </div>
        <div className="embarque-sync"><i className={modoBanco === 'online' ? 'on' : modoBanco === 'local' ? 'off' : ''} />{modoBanco === 'online' ? 'Nuvem online' : modoBanco === 'local' ? 'Modo local' : 'Conectando'}</div>
      </header>

      <section className="lote-form">
        <div className="form-title"><strong>Novo lote</strong><small>Primeiro passo da operação</small></div>
        <input placeholder="Produto" value={formLote.produto} onChange={e => setFormLote(f => ({ ...f, produto: e.target.value.toUpperCase() }))} />
        <input placeholder="Origem" value={formLote.origem} onChange={e => setFormLote(f => ({ ...f, origem: e.target.value.toUpperCase() }))} />
        <input placeholder="Destino" value={formLote.destino} onChange={e => setFormLote(f => ({ ...f, destino: e.target.value.toUpperCase() }))} />
        <input placeholder="Lote" value={formLote.lote} onChange={e => setFormLote(f => ({ ...f, lote: e.target.value }))} />
        <input type="number" placeholder="Cadência" value={formLote.cadencia} onChange={e => setFormLote(f => ({ ...f, cadencia: e.target.value }))} />
        <input type="date" value={formLote.dataInicio} onChange={e => setFormLote(f => ({ ...f, dataInicio: e.target.value, dataFim: f.dataFim || e.target.value }))} />
        <input type="date" value={formLote.dataFim} onChange={e => setFormLote(f => ({ ...f, dataFim: e.target.value }))} />
        <button onClick={salvarLote}>Criar lote</button>
      </section>

      <section className="lotes-lista">
        {lotesVisiveis.map(l => {
          const total = linhas.filter(x => String(x.loteId) === String(l.id)).length
          const car = linhas.filter(x => String(x.loteId) === String(l.id) && x.status === 'carregado').length
          return <button key={l.id} className={String(l.id) === String(loteAtivo?.id) ? 'active' : ''} onClick={() => { setLoteAtivoId(l.id); setDiaAtivo(l.dataInicio) }}>
            <strong>{l.produto} · Lote {l.lote}</strong>
            <span>{l.origem} → {l.destino}</span>
            <small>{dataBR(l.dataInicio)} até {dataBR(l.dataFim)} · {car}/{total || l.cadencia} carregados</small>
          </button>
        })}
        {!lotesVisiveis.length && <div className="sem-lote">Cadastre o primeiro lote para começar.</div>}
      </section>

      {loteAtivo && <section className="quadro-excel">
        <div className="excel-titulo">
          <h2>{loteAtivo.produto} - {loteAtivo.origem} X {loteAtivo.destino}</h2>
          <p>{loteAtivo.origem} X {loteAtivo.destino} LOTE - {loteAtivo.lote}</p>
        </div>

        <div className="dias-tabs">
          {dias.map(d => <button key={d} className={d === dia ? 'active' : ''} onClick={() => setDiaAtivo(d)}>{dataBR(d)}</button>)}
        </div>

        <div className="barra-acoes">
          <button onClick={gerarCotasDoDia}>Gerar cotas do dia</button>
          <button onClick={adicionarLinha}>+ Adicionar placa</button>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar placa, transportadora ou motorista" />
          <div><strong>{resumo.carregados}</strong> carregados</div>
          <div><strong>{resumo.aguardando}</strong> aguardando</div>
          <div><strong>{formatarPeso(resumo.peso)}</strong> total</div>
        </div>

        <div className="excel-wrap">
          <table className="excel-table">
            <thead>
              <tr><th>COTA</th><th>PLACA</th><th>PESO</th><th>ORDEM</th><th>CTE</th><th>TRANSP</th><th>RESPONSÁVEL</th><th>STATUS</th><th>SEGURADORA</th><th>CHAMADO MDFE</th><th>AÇÕES</th></tr>
            </thead>
            <tbody>
              {linhasDoDia.map(l => <tr key={l.id} className={`linha-${STATUS[l.status]?.classe || 'agendado'}`}>
                <td><input value={l.cota} onChange={e => atualizarLinha(l.id, 'cota', e.target.value)} onBlur={() => persistirLinha(l.id)} /></td>
                <td><input value={l.placa} onChange={e => atualizarLinha(l.id, 'placa', placaLimpa(e.target.value))} onBlur={() => persistirLinha(l.id)} /></td>
                <td><input value={l.peso} onChange={e => atualizarLinha(l.id, 'peso', e.target.value)} onBlur={() => persistirLinha(l.id)} placeholder="0,000" /></td>
                <td><button className={l.ordem ? 'x-on' : ''} onClick={() => salvarLinha({ ...l, ordem: !l.ordem })}>X</button></td>
                <td><button className={l.cte ? 'x-on' : ''} onClick={() => salvarLinha({ ...l, cte: !l.cte })}>X</button></td>
                <td><input value={l.transportadora} onChange={e => atualizarLinha(l.id, 'transportadora', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td>
                <td><input value={l.responsavel} onChange={e => atualizarLinha(l.id, 'responsavel', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td>
                <td><select value={l.status} onChange={e => salvarLinha({ ...l, status: e.target.value })}><option value="agendado">AG. CARREGAMENTO</option><option value="carregado">CARREGADO</option><option value="cancelado">CANCELADO</option></select></td>
                <td><input value={l.seguradora} onChange={e => atualizarLinha(l.id, 'seguradora', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td>
                <td><input value={l.chamadoMdfe} onChange={e => atualizarLinha(l.id, 'chamadoMdfe', e.target.value.toUpperCase())} onBlur={() => persistirLinha(l.id)} /></td>
                <td><button onClick={() => marcarCarregado(l)}>Carregou</button><button onClick={() => apagarLinha(l.id)}>Excluir</button></td>
              </tr>)}
              {!linhasDoDia.length && <tr><td colSpan="11" className="vazio">Clique em “Gerar cotas do dia” ou “Adicionar placa”.</td></tr>}
            </tbody>
            <tfoot><tr><td colSpan="2">TOTAL</td><td>{formatarPeso(resumo.peso)}</td><td colSpan="8">{resumo.total} linha(s) no dia {dataBR(dia)}</td></tr></tfoot>
          </table>
        </div>
      </section>}
    </section>
  )
}
