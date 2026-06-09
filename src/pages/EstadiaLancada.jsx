import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { calcularEstadia, linkWhatsapp, dataISOTexto, tempoDecorrido } from '../utils/index'
import DropZone from '../components/DropZone'
import { nomeFilial } from '../data/filiais'
import { arquivarEstadiaLancada } from '../lib/ayresSafety'

const EMPTY = { nf: '', chamado: '', motorista: '', telefoneMotorista: '', transportadora: '', placa: '', peso: '', prioridade: 'Normal', pagoPor: 'Logística', chegadaData: '', chegadaHora: '', saidaData: '', saidaHora: '' }
const TRANSPORTADORAS_BASE = ['Via Log', 'RDR', 'Transportes', 'Autônomo']

function badgePago(p) {
  return p === 'Transportes'
    ? <span className="badge badge-transportes">Transportes</span>
    : <span className="badge badge-logistica">Logística</span>
}

function classePrio(p) {
  if (p === 'Urgente') return 'prio-urgente'
  if (p === 'Média') return 'prio-media'
  return 'prio-normal'
}

function classeStatus(s) {
  if (s === 'Finalizado') return 'status-finalizado'
  if (s === 'Feito') return 'status-feito'
  return 'status-aberto'
}

function TempoInfo({ label, data, compacto = false }) {
  return (
    <div className={`tempo-info ${compacto ? 'tempo-compacto' : ''}`}>
      <strong>{tempoDecorrido(data)}</strong>
      <small>{label}</small>
    </div>
  )
}

function uniq(arr) {
  return [...new Set(arr.map(v => String(v || '').trim()).filter(Boolean))]
}

export default function EstadiaLancada({ formRef }) {
  const { estadias, adicionarLancada, editarLancada, marcarFeito, finalizar, reabrir, excluirLancada, itemParaLancar, limparItemParaLancar, uploadAnexoItem, filiais, usuarioAtual, toast } = useApp()
  const [form, setForm] = useState(EMPTY)
  const [editandoId, setEditandoId] = useState(null)
  const [arquivos, setArquivos] = useState([])
  const [existingAnexos, setExistingAnexos] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const calc = calcularEstadia(form.peso, form.chegadaData, form.chegadaHora, form.saidaData, form.saidaHora)

  const motoristasOptions = useMemo(() => {
    const map = new Map()
    estadias.forEach(e => {
      const nome = String(e.motorista || '').trim()
      if (!nome) return
      if (!map.has(nome.toUpperCase())) map.set(nome.toUpperCase(), { nome, telefone: e.telefoneMotorista || '' })
    })
    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome))
  }, [estadias])

  const transportadorasOptions = useMemo(() => uniq([
    ...TRANSPORTADORAS_BASE,
    ...estadias.map(e => e.transportadora),
  ]).sort((a, b) => a.localeCompare(b)), [estadias])

  const preencherTelefoneMotorista = () => {
    if (form.telefoneMotorista) return
    const achou = motoristasOptions.find(m => m.nome.toUpperCase() === form.motorista.trim().toUpperCase())
    if (achou?.telefone) set('telefoneMotorista', String(achou.telefone).replace(/[^0-9]/g, ''))
  }

  useEffect(() => {
    if (!itemParaLancar) return
    setForm(prev => ({
      ...prev,
      nf: itemParaLancar.nf || itemParaLancar.numeroNf || '',
      placa: itemParaLancar.placa || '',
      transportadora: itemParaLancar.transportadora || '',
      prioridade: itemParaLancar.prioridade || 'Normal',
    }))
    setExistingAnexos(itemParaLancar.anexos || [])
    setArquivos([])
    limparItemParaLancar()
    formRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [itemParaLancar]) // eslint-disable-line

  const handleEditar = (e) => {
    setEditandoId(e.id)
    setForm({
      nf: e.nf || e.numeroNf || '',
      chamado: e.chamado || '',
      motorista: e.motorista || '',
      telefoneMotorista: e.telefoneMotorista || '',
      transportadora: e.transportadora || '',
      placa: e.placa || '',
      peso: e.peso || '',
      prioridade: e.prioridade || 'Normal',
      pagoPor: e.pagoPor || 'Logística',
      chegadaData: e.chegadaData || '',
      chegadaHora: e.chegadaHora || '',
      saidaData: e.saidaData || '',
      saidaHora: e.saidaHora || '',
    })
    setExistingAnexos(e.anexos || [])
    setArquivos([])
    formRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCancelarEdicao = () => {
    setEditandoId(null)
    setForm(EMPTY)
    setArquivos([])
    setExistingAnexos([])
  }

  const handleSalvar = async () => {
    if (!calc) { alert('Preencha peso, chegada e saída corretamente.'); return }
    if (!form.motorista.trim() || !form.placa.trim()) { alert('Preencha motorista e placa.'); return }
    const novosAnexos = []
    for (const file of arquivos.slice(0, 2)) {
      const up = await uploadAnexoItem(file)
      if (up) novosAnexos.push(up)
    }
    const anexos = [...existingAnexos, ...novosAnexos]
    if (editandoId) {
      await editarLancada(editandoId, { ...form, numeroNf: form.nf, anexos })
      setEditandoId(null)
    } else {
      await adicionarLancada({ ...form, numeroNf: form.nf, ...calc, anexos })
    }
    setForm(EMPTY)
    setArquivos([])
    setExistingAnexos([])
  }

  const handleArquivar = async (e) => {
    if (!confirm('Arquivar esta estadia? Ela vai sair da tela, mas ficará salva na Lixeira com os anexos.')) return
    try {
      await arquivarEstadiaLancada(e, usuarioAtual?.usuario || '-', 'Estadia arquivada pela tela de lançadas')
      await excluirLancada(e.id)
      toast?.('Estadia arquivada na Lixeira.', 'ok')
    } catch {
      toast?.('Não consegui arquivar. Verifique o Supabase/Lixeira.', 'err')
    }
  }

  const lista = estadias.filter(e => {
    const txt = ((e.placa || '') + ' ' + (e.motorista || '') + ' ' + (e.chamado || '') + ' ' + (e.transportadora || '') + ' ' + (e.nf || e.numeroNf || '')).toUpperCase()
    const data = dataISOTexto(e.dataLancamento)
    return (!busca || txt.includes(busca.toUpperCase()))
      && (!filtroStatus || e.status === filtroStatus)
      && (!filtroFilial || e.filial === filtroFilial)
      && (!dataInicio || data >= dataInicio)
      && (!dataFim || data <= dataFim)
  })

  return (
    <section className="aba active" id="abaLancadas">
      <div className="box estadia-form-box" ref={formRef}>
        <div className="box-title estadia-form-title">
          <div>
            <h2>{editandoId ? 'Editar estadia' : 'Adicionar estadia lançada'}</h2>
            <span>Motorista e transportadora podem ser selecionados ou digitados.</span>
          </div>
          <div className="estadia-form-hint">NF · Placa · Motorista · Datas</div>
        </div>

        <div className="form-grid estadia-form-grid">
          <div className="field field-sm"><label>Número da NF</label><input value={form.nf} onChange={e => set('nf', e.target.value)} placeholder="Ex: 388860" /></div>
          <div className="field field-sm"><label>Número do chamado</label><input value={form.chamado} onChange={e => set('chamado', e.target.value)} placeholder="Ex: 16820752" /></div>
          <div className="field field-lg"><label>Motorista</label><input list="motoristas-estadia" value={form.motorista} onChange={e => set('motorista', e.target.value)} onBlur={preencherTelefoneMotorista} placeholder="Selecione ou digite o motorista" /><datalist id="motoristas-estadia">{motoristasOptions.map(m => <option key={m.nome} value={m.nome} />)}</datalist></div>
          <div className="field field-sm"><label>WhatsApp</label><input value={form.telefoneMotorista} onChange={e => set('telefoneMotorista', e.target.value.replace(/[^0-9]/g, ''))} placeholder="64999999999" /></div>
          <div className="field field-md"><label>Transportadora</label><input list="transportadoras-estadia" value={form.transportadora} onChange={e => set('transportadora', e.target.value)} placeholder="Selecione ou digite" /><datalist id="transportadoras-estadia">{transportadorasOptions.map(t => <option key={t} value={t} />)}</datalist></div>
          <div className="field field-sm"><label>Placa</label><input value={form.placa} onChange={e => set('placa', e.target.value.toUpperCase())} placeholder="JBU0H16" /></div>
          <div className="field field-sm"><label>Peso</label><input value={form.peso} onChange={e => set('peso', e.target.value)} placeholder="38380" /></div>
          <div className="field field-sm"><label>Prioridade</label><select value={form.prioridade} onChange={e => set('prioridade', e.target.value)}><option>Normal</option><option>Média</option><option>Urgente</option></select></div>
          <div className="field field-sm"><label>Pago por</label><select value={form.pagoPor} onChange={e => set('pagoPor', e.target.value)}><option>Logística</option><option>Transportes</option></select></div>
          <div className="field field-sm"><label>Data chegada</label><input type="date" value={form.chegadaData} onChange={e => set('chegadaData', e.target.value)} /></div>
          <div className="field field-sm"><label>Hora chegada</label><input type="time" value={form.chegadaHora} onChange={e => set('chegadaHora', e.target.value)} /></div>
          <div className="field field-sm"><label>Data saída</label><input type="date" value={form.saidaData} onChange={e => set('saidaData', e.target.value)} /></div>
          <div className="field field-sm"><label>Hora saída</label><input type="time" value={form.saidaHora} onChange={e => set('saidaHora', e.target.value)} /></div>

          <DropZone arquivos={arquivos} onChange={setArquivos} />

          {existingAnexos.length > 0 && <div className="field wide"><label>Anexos existentes</label><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{existingAnexos.map((a, i) => <a key={i} className="anexo-link" href={a.url} target="_blank" rel="noopener noreferrer">📄 {a.nome || `Arquivo ${i + 1}`}</a>)}</div></div>}
        </div>

        <div className="calc-preview estadia-calc-preview">
          <div className="preview-card"><span>Horas válidas</span><strong>{calc ? `${parseFloat(calc.horas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} h` : '0,00 h'}</strong></div>
          <div className="preview-card"><span>Valor automático</span><strong>{calc?.valor || 'R$ 0,00'}</strong></div>
        </div>

        <div className="estadia-form-actions">
          <button className="btn-green btn-full" onClick={handleSalvar}>{editandoId ? 'Salvar alterações' : 'Salvar estadia lançada'}</button>
          {editandoId && <button className="btn-light" onClick={handleCancelarEdicao}>Cancelar</button>}
        </div>
      </div>

      <div className="box estadia-filter-box">
        <div className="box-title"><h2>Consultar estadias lançadas</h2><button className="btn-light btn-small" onClick={() => { setBusca(''); setFiltroStatus(''); setFiltroFilial(''); setDataInicio(''); setDataFim('') }}>Limpar filtros</button></div>
        <div className="filters estadia-filters">
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar placa, motorista, chamado, NF..." />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option value="">Todos status</option><option>Aberto</option><option>Feito</option><option>Finalizado</option></select>
          <select value={filtroFilial} onChange={e => setFiltroFilial(e.target.value)}><option value="">Todas as filiais</option>{filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap estadia-table-wrap">
        <div className="table-scroll">
          <table>
            <thead><tr><th>NF</th><th>Chamado</th><th>Motorista</th><th>Transportadora</th><th>Placa</th><th>Peso</th><th>Horas</th><th>Valor</th><th>Pago por</th><th>Prioridade</th><th>Filial</th><th>Anexos</th><th>Lançado por</th><th>Lançada há</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.length === 0
                ? <tr><td colSpan={16} className="empty">Nenhuma estadia encontrada.</td></tr>
                : lista.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.nf || e.numeroNf || '-'}</strong></td>
                    <td><strong>{e.chamado || '-'}</strong><br /><small>{e.dataLancamento || ''}</small></td>
                    <td>{e.motorista || '-'}<br /><small>Chegada: {e.chegada || '-'}<br />Saída: {e.saida || '-'}</small></td>
                    <td>{e.transportadora || '-'}</td>
                    <td><span className="plate">{e.placa || '-'}</span><br /><TempoInfo label="lançada há" data={e.dataLancamento} compacto /></td>
                    <td>{e.peso || '-'}</td>
                    <td><strong>{e.horas || '0.00'} h</strong></td>
                    <td><strong>{e.valor || 'R$ 0,00'}</strong></td>
                    <td>{badgePago(e.pagoPor)}</td>
                    <td><span className={`prio ${classePrio(e.prioridade)}`}>{e.prioridade || 'Normal'}</span></td>
                    <td><span className="badge badge-logistica">{nomeFilial(e.filial)}</span></td>
                    <td>{e.anexos?.length ? e.anexos.map((a, i) => <a key={i} className="anexo-link" href={a.url} target="_blank" rel="noopener noreferrer">📄 {a.nome || `Arquivo ${i + 1}`}</a>) : '-'}</td>
                    <td>{e.lancadoPor || '-'}</td>
                    <td><TempoInfo label="desde o lançamento" data={e.dataLancamento} /></td>
                    <td><span className={`status ${classeStatus(e.status)}`}>{e.status}</span>{e.feitoPor && <><br /><small>Feito por {e.feitoPor}</small></>}{e.finalizadoPor && <><br /><small>Finalizado por {e.finalizadoPor}</small></>}</td>
                    <td><div className="actions">{e.status === 'Aberto' && <button className="btn-green btn-small" onClick={() => marcarFeito(e.id)}>Feito</button>}{e.status === 'Feito' && <button className="btn-purple btn-small" onClick={() => finalizar(e.id)}>Finalizar</button>}{e.status !== 'Aberto' && <button className="btn-orange btn-small" onClick={() => reabrir(e.id)}>Reabrir</button>}<button className="btn-light btn-small" onClick={() => handleEditar(e)}>Editar</button>{e.telefoneMotorista && <a className="btn btn-green btn-small" href={linkWhatsapp(e)} target="_blank" rel="noopener noreferrer">WhatsApp</a>}<button className="btn-red btn-small" onClick={() => handleArquivar(e)}>Arquivar</button></div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
