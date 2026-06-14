import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { calcularEstadia } from '../utils/index'
import DropZone from '../components/DropZone'
import { arquivarEstadiaLancada } from '../lib/ayresSafety'
import { listarMotoristasBancoV2, listarTransportadorasV2, upsertMotoristaBasicoV2, upsertTransportadoraV2 } from '../lib/supabaseV2'
import '../estadia-desktop-pro.css'

const EMPTY = {
  nf: '', chamado: '', motorista: '', telefoneMotorista: '', transportadora: '', placa: '', peso: '',
  prioridade: 'Normal', pagoPor: 'Logística', status: 'Aberto',
  chegadaData: '', chegadaHora: '', saidaData: '', saidaHora: ''
}
const TRANSPORTADORAS_BASE = ['Via Log', 'RDR', 'Transportes', 'Autônomo']

function uniq(arr) {
  return [...new Set(arr.map(v => String(v || '').trim()).filter(Boolean))]
}

function chaveNome(nome) {
  return String(nome || '').trim().toUpperCase()
}

function agoraHistorico() {
  return new Date().toLocaleString('pt-BR')
}

function eventoHistorico(acao, usuario, detalhes = '') {
  return { data: agoraHistorico(), usuario: usuario || '-', acao, detalhes }
}

export default function EstadiaLancada({ formRef }) {
  const {
    estadias, adicionarLancada, editarLancada, excluirLancada, itemParaLancar, limparItemParaLancar,
    uploadAnexoItem, usuarioAtual, toast, mudarAba
  } = useApp()
  const [form, setForm] = useState(EMPTY)
  const [editandoId, setEditandoId] = useState(null)
  const [arquivos, setArquivos] = useState([])
  const [existingAnexos, setExistingAnexos] = useState([])
  const [bancoMotoristas, setBancoMotoristas] = useState([])
  const [bancoTransportadoras, setBancoTransportadoras] = useState([])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const calc = calcularEstadia(form.peso, form.chegadaData, form.chegadaHora, form.saidaData, form.saidaHora)

  const carregarCadastros = async () => {
    try {
      const data = await listarMotoristasBancoV2()
      setBancoMotoristas(data || [])
    } catch {
      setBancoMotoristas([])
    }
    try {
      const data = await listarTransportadorasV2()
      setBancoTransportadoras(data || [])
    } catch {
      setBancoTransportadoras([])
    }
  }

  useEffect(() => { carregarCadastros() }, [])

  const motoristasOptions = useMemo(() => {
    const map = new Map()

    bancoMotoristas.forEach(m => {
      const nome = String(m.nome || '').trim()
      if (!nome) return
      map.set(chaveNome(nome), {
        nome,
        telefone: m.telefone || '',
        origem: m.captacoes?.length ? 'Captação' : 'Banco',
        carregou: (m.captacoes || []).filter(c => c.status === 'carregou').length,
      })
    })

    estadias.forEach(e => {
      const nome = String(e.motorista || '').trim()
      if (!nome) return
      const key = chaveNome(nome)
      const atual = map.get(key)
      map.set(key, {
        nome,
        telefone: atual?.telefone || e.telefoneMotorista || '',
        origem: atual?.origem || 'Estadia',
        carregou: atual?.carregou || 0,
      })
    })

    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome))
  }, [bancoMotoristas, estadias])

  const transportadorasOptions = useMemo(() => uniq([
    ...TRANSPORTADORAS_BASE,
    ...bancoTransportadoras.map(t => t.nome),
    ...estadias.map(e => e.transportadora),
  ]).sort((a, b) => a.localeCompare(b)), [bancoTransportadoras, estadias])

  const preencherTelefoneMotorista = () => {
    const achou = motoristasOptions.find(m => chaveNome(m.nome) === chaveNome(form.motorista))
    if (achou?.telefone) set('telefoneMotorista', String(achou.telefone).replace(/[^0-9]/g, ''))
  }

  const preencherFormularioEdicao = (e) => {
    if (!e) return
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
      status: e.status || 'Aberto',
      chegadaData: e.chegadaData || '',
      chegadaHora: e.chegadaHora || '',
      saidaData: e.saidaData || '',
      saidaHora: e.saidaHora || '',
    })
    setExistingAnexos(e.anexos || [])
    setArquivos([])
    formRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

  useEffect(() => {
    const idParaEditar = localStorage.getItem('editarEstadiaLancadaId')
    if (!idParaEditar || !estadias.length) return
    const item = estadias.find(e => String(e.id) === String(idParaEditar))
    if (!item) return
    localStorage.removeItem('editarEstadiaLancadaId')
    preencherFormularioEdicao(item)
  }, [estadias]) // eslint-disable-line

  const handleCancelarEdicao = () => {
    setEditandoId(null)
    setForm(EMPTY)
    setArquivos([])
    setExistingAnexos([])
  }

  const encontrarDuplicada = () => {
    const nf = String(form.nf || '').trim()
    const chamado = String(form.chamado || '').trim()
    const placa = String(form.placa || '').trim().toUpperCase()
    return estadias.find(e => {
      if (String(e.id) === String(editandoId)) return false
      const mesmaNf = nf && String(e.nf || e.numeroNf || '').trim() === nf
      const mesmoChamado = chamado && String(e.chamado || '').trim() === chamado
      const mesmaPlacaAberta = placa && String(e.placa || '').trim().toUpperCase() === placa && e.status !== 'Finalizado'
      return mesmaNf || mesmoChamado || mesmaPlacaAberta
    })
  }

  const handleSalvar = async () => {
    if (!calc) { alert('Preencha peso, chegada e saída corretamente.'); return }
    if (!form.motorista.trim() || !form.placa.trim()) { alert('Preencha motorista e placa.'); return }

    const duplicada = encontrarDuplicada()
    if (!editandoId && duplicada && !confirm(`Já existe uma estadia parecida para ${duplicada.placa || 'esta placa'} / NF ${duplicada.nf || duplicada.numeroNf || '-'}. Deseja salvar mesmo assim?`)) return

    try {
      await upsertMotoristaBasicoV2({
        nome: form.motorista.trim(),
        telefone: form.telefoneMotorista,
        observacao: 'Criado/atualizado pelo lançamento de estadia',
      }, usuarioAtual)
      await upsertTransportadoraV2(form.transportadora, usuarioAtual)
    } catch {}

    const novosAnexos = []
    for (const file of arquivos.slice(0, 2)) {
      const up = await uploadAnexoItem(file)
      if (up) novosAnexos.push(up)
    }
    const anexos = [...existingAnexos, ...novosAnexos]

    if (editandoId) {
      const atual = estadias.find(e => String(e.id) === String(editandoId))
      const historicoItem = [
        eventoHistorico('Editou dados da estadia', usuarioAtual?.usuario, `Placa ${form.placa}`),
        ...(atual?.historicoItem || []),
      ].slice(0, 20)
      await editarLancada(editandoId, { ...form, numeroNf: form.nf, anexos, historicoItem })
      setEditandoId(null)
    } else {
      await adicionarLancada({
        ...form,
        numeroNf: form.nf,
        ...calc,
        anexos,
        historicoItem: [eventoHistorico('Criou estadia lançada', usuarioAtual?.usuario, `Placa ${form.placa}`)],
      })
    }

    setForm(EMPTY)
    setArquivos([])
    setExistingAnexos([])
    carregarCadastros()
  }

  const handleArquivarEdicao = async () => {
    const atual = estadias.find(e => String(e.id) === String(editandoId))
    if (!atual) return
    if (!confirm('Arquivar esta estadia? Ela vai sair da tela, mas ficará salva na Lixeira com os anexos.')) return
    try {
      await arquivarEstadiaLancada(atual, usuarioAtual?.usuario || '-', 'Estadia arquivada pela tela de edição')
      await excluirLancada(atual.id)
      toast?.('Estadia arquivada na Lixeira.', 'ok')
      handleCancelarEdicao()
    } catch {
      toast?.('Não consegui arquivar. Verifique o Supabase/Lixeira.', 'err')
    }
  }

  return (
    <section className="aba active" id="abaLancadas">
      <div className="box estadia-form-box" ref={formRef}>
        <div className="box-title estadia-form-title">
          <div>
            <h2>{editandoId ? 'Editar estadia lançada' : 'Lançar nova estadia'}</h2>
            <span>Formulário separado por blocos para evitar erro e deixar o lançamento mais rápido.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-light btn-small" onClick={() => mudarAba('consultaLancadas')}>Ver lançadas</button>
            {editandoId && <button className="btn-red btn-small" onClick={handleArquivarEdicao}>Arquivar</button>}
          </div>
        </div>

        {editandoId && <div className="calc-preview estadia-calc-preview" style={{ marginBottom: 16 }}>
          <div className="preview-card"><span>Modo edição</span><strong>{form.placa || 'Estadia'}</strong></div>
          <div className="preview-card"><span>Status atual</span><strong>{form.status}</strong></div>
        </div>}

        <div className="box" style={{ marginBottom: 16 }}>
          <div className="box-title"><h2>Dados da carga</h2><span>NF, chamado, placa e peso.</span></div>
          <div className="form-grid estadia-form-grid">
            <div className="field field-sm"><label>Número da NF</label><input value={form.nf} onChange={e => set('nf', e.target.value)} placeholder="Ex: 388860" /></div>
            <div className="field field-sm"><label>Número do chamado</label><input value={form.chamado} onChange={e => set('chamado', e.target.value)} placeholder="Ex: 16820752" /></div>
            <div className="field field-sm"><label>Placa</label><input value={form.placa} onChange={e => set('placa', e.target.value.toUpperCase())} placeholder="JBU0H16" /></div>
            <div className="field field-sm"><label>Peso</label><input value={form.peso} onChange={e => set('peso', e.target.value)} placeholder="38380" /></div>
            <div className="field field-sm"><label>Prioridade</label><select value={form.prioridade} onChange={e => set('prioridade', e.target.value)}><option>Normal</option><option>Média</option><option>Urgente</option></select></div>
            <div className="field field-sm"><label>Pago por</label><select value={form.pagoPor} onChange={e => set('pagoPor', e.target.value)}><option>Logística</option><option>Transportes</option></select></div>
            {editandoId && <div className="field field-sm"><label>Status</label><select value={form.status} onChange={e => set('status', e.target.value)}><option>Aberto</option><option>Em análise</option><option>Feito</option><option>Finalizado</option></select></div>}
          </div>
        </div>

        <div className="box" style={{ marginBottom: 16 }}>
          <div className="box-title"><h2>Motorista e transportadora</h2><span>Busca inteligente pelo banco e pela captação.</span></div>
          <div className="form-grid estadia-form-grid">
            <div className="field field-lg"><label>Motorista</label><input list="motoristas-estadia" value={form.motorista} onChange={e => set('motorista', e.target.value)} onBlur={preencherTelefoneMotorista} placeholder="Selecione ou digite o motorista" /><datalist id="motoristas-estadia">{motoristasOptions.map(m => <option key={m.nome} value={m.nome} label={`${m.telefone ? m.telefone + ' · ' : ''}${m.origem}${m.carregou ? ` · carregou ${m.carregou}x` : ''}`} />)}</datalist></div>
            <div className="field field-sm"><label>WhatsApp</label><input value={form.telefoneMotorista} onChange={e => set('telefoneMotorista', e.target.value.replace(/[^0-9]/g, ''))} placeholder="64999999999" /></div>
            <div className="field field-md"><label>Transportadora</label><input list="transportadoras-estadia" value={form.transportadora} onChange={e => set('transportadora', e.target.value)} placeholder="Selecione ou digite" /><datalist id="transportadoras-estadia">{transportadorasOptions.map(t => <option key={t} value={t} />)}</datalist></div>
          </div>
        </div>

        <div className="box" style={{ marginBottom: 16 }}>
          <div className="box-title"><h2>Tempo de estadia</h2><span>O valor é calculado automaticamente pela chegada e saída.</span></div>
          <div className="form-grid estadia-form-grid">
            <div className="field field-sm"><label>Data chegada</label><input type="date" value={form.chegadaData} onChange={e => set('chegadaData', e.target.value)} /></div>
            <div className="field field-sm"><label>Hora chegada</label><input type="time" value={form.chegadaHora} onChange={e => set('chegadaHora', e.target.value)} /></div>
            <div className="field field-sm"><label>Data saída</label><input type="date" value={form.saidaData} onChange={e => set('saidaData', e.target.value)} /></div>
            <div className="field field-sm"><label>Hora saída</label><input type="time" value={form.saidaHora} onChange={e => set('saidaHora', e.target.value)} /></div>
          </div>
          <div className="calc-preview estadia-calc-preview">
            <div className="preview-card"><span>Horas válidas</span><strong>{calc ? `${parseFloat(calc.horas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} h` : '0,00 h'}</strong></div>
            <div className="preview-card"><span>Valor automático</span><strong>{calc?.valor || 'R$ 0,00'}</strong></div>
          </div>
        </div>

        <div className="box" style={{ marginBottom: 16 }}>
          <div className="box-title"><h2>Anexos</h2><span>Adicione comprovantes ou arquivos da estadia.</span></div>
          <DropZone arquivos={arquivos} onChange={setArquivos} />
          {existingAnexos.length > 0 && <div className="field wide" style={{ marginTop: 12 }}><label>Anexos existentes</label><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{existingAnexos.map((a, i) => <a key={i} className="anexo-link" href={a.url} target="_blank" rel="noopener noreferrer">📄 {a.nome || `Arquivo ${i + 1}`}</a>)}</div></div>}
        </div>

        <div className="estadia-form-actions">
          <button className="btn-green btn-full" onClick={handleSalvar}>{editandoId ? 'Salvar alterações' : 'Salvar estadia lançada'}</button>
          {editandoId && <button className="btn-light" onClick={handleCancelarEdicao}>Cancelar</button>}
        </div>
      </div>
    </section>
  )
}
