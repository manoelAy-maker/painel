import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import DropZone from '../components/DropZone'
import { arquivarEstadiaLancada } from '../lib/ayresSafety'
import { listarMotoristasBancoV2, listarTransportadorasV2, upsertMotoristaBasicoV2, upsertTransportadoraV2 } from '../lib/supabaseV2'
import '../estadia-desktop-pro.css'

const EMPTY = {
  nf: '', cte: '', motorista: '', telefoneMotorista: '', transportadora: '', placa: '',
  plataforma: 'G&O - GRÃOS E OLEAGINOSAS', regiaoAprovadora: '', localEstadia: 'Destino',
  motivo: '', sindicato: 'Não', prioridade: 'Normal', status: 'Aberto',
  chegadaData: '', chegadaHora: '', saidaData: '', saidaHora: '',
  alterarCalculo: false, tipoCalculo: 'Hora', franquia: '12', valorHora: '0,80', valorDiaria: '', qtdDias: '', valorNegociado: '',
  obs: '',
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

function numeroBR(valor) {
  if (!valor) return 0
  return Number(String(valor).replace(/\./g, '').replace(',', '.')) || 0
}

function dinheiroBR(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function horasEntre(dataIni, horaIni, dataFim, horaFim) {
  if (!dataIni || !horaIni || !dataFim || !horaFim) return 0
  const ini = new Date(`${dataIni}T${horaIni}`)
  const fim = new Date(`${dataFim}T${horaFim}`)
  if (Number.isNaN(ini.getTime()) || Number.isNaN(fim.getTime()) || fim <= ini) return 0
  return (fim - ini) / 36e5
}

function formatarDataHora(data, hora) {
  if (!data || !hora) return '-'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano} ${hora}`
}

function calcularEstadiaOperacional(form) {
  const totalHoras = horasEntre(form.chegadaData, form.chegadaHora, form.saidaData, form.saidaHora)
  const tipo = form.alterarCalculo ? form.tipoCalculo : 'Hora'
  const franquia = form.alterarCalculo ? numeroBR(form.franquia) : 12
  const fator = form.alterarCalculo ? numeroBR(form.valorHora || '0,80') : 0.8
  const passouDaRegraMinima = totalHoras >= 24
  const horasPagar = passouDaRegraMinima ? Math.max(0, totalHoras - franquia) : 0
  let valorNumero = 0

  if (tipo === 'Diária') {
    const dias = Number(form.qtdDias) || 0
    valorNumero = numeroBR(form.valorDiaria) * dias
    return {
      horas: String(dias * 24 || 0),
      totalHoras: totalHoras.toFixed(2),
      horasPagar: String(dias * 24 || 0),
      valorNumero,
      valor: dinheiroBR(valorNumero),
      regraResumo: 'Diária manual',
      regraCurta: 'Manual',
      chegada: formatarDataHora(form.chegadaData, form.chegadaHora),
      saida: formatarDataHora(form.saidaData, form.saidaHora),
    }
  }

  if (tipo === 'Negociado') {
    valorNumero = numeroBR(form.valorNegociado)
  } else {
    valorNumero = horasPagar * fator
  }

  return {
    horas: horasPagar.toFixed(2),
    totalHoras: totalHoras.toFixed(2),
    horasPagar: horasPagar.toFixed(2),
    valorNumero,
    valor: dinheiroBR(valorNumero),
    regraResumo: passouDaRegraMinima ? `Após 24h · tira ${franquia}h · fator ${String(fator).replace('.', ',')}` : 'Aguardando completar 24h',
    regraCurta: form.alterarCalculo ? 'Manual' : 'Padrão automático',
    chegada: formatarDataHora(form.chegadaData, form.chegadaHora),
    saida: formatarDataHora(form.saidaData, form.saidaHora),
  }
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
  const calc = calcularEstadiaOperacional(form)

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
      cte: e.cte || '',
      motorista: e.motorista || '',
      telefoneMotorista: e.telefoneMotorista || '',
      transportadora: e.transportadora || '',
      placa: e.placa || '',
      plataforma: e.plataforma || 'G&O - GRÃOS E OLEAGINOSAS',
      regiaoAprovadora: e.regiaoAprovadora || '',
      localEstadia: e.localEstadia || 'Destino',
      motivo: e.motivo || '',
      sindicato: e.sindicato || 'Não',
      prioridade: e.prioridade || 'Normal',
      status: e.status || 'Aberto',
      chegadaData: e.chegadaData || '',
      chegadaHora: e.chegadaHora || '',
      saidaData: e.saidaData || '',
      saidaHora: e.saidaHora || '',
      alterarCalculo: Boolean(e.alterarCalculo),
      tipoCalculo: e.tipoCalculo || 'Hora',
      franquia: e.franquia || '12',
      valorHora: e.valorHora || '0,80',
      valorDiaria: e.valorDiaria || '',
      qtdDias: e.qtdDias || '',
      valorNegociado: e.valorNegociado || '',
      obs: e.obs || '',
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
      cte: itemParaLancar.cte || '',
      placa: itemParaLancar.placa || '',
      transportadora: itemParaLancar.transportadora || '',
      prioridade: itemParaLancar.prioridade || 'Normal',
      plataforma: itemParaLancar.plataforma || prev.plataforma,
      regiaoAprovadora: itemParaLancar.regiaoAprovadora || '',
      localEstadia: itemParaLancar.localEstadia || prev.localEstadia,
      motivo: itemParaLancar.motivo || '',
      sindicato: itemParaLancar.sindicato || 'Não',
      chegadaData: itemParaLancar.chegadaData || '',
      chegadaHora: itemParaLancar.chegadaHora || '',
      saidaData: itemParaLancar.saidaData || '',
      saidaHora: itemParaLancar.saidaHora || '',
      alterarCalculo: Boolean(itemParaLancar.alterarCalculo),
      tipoCalculo: itemParaLancar.tipoCalculo || prev.tipoCalculo,
      franquia: itemParaLancar.franquia || prev.franquia,
      valorHora: itemParaLancar.valorHora || prev.valorHora,
      valorDiaria: itemParaLancar.valorDiaria || '',
      qtdDias: itemParaLancar.qtdDias || '',
      valorNegociado: itemParaLancar.valorNegociado || '',
      obs: itemParaLancar.obs || '',
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
    const placa = String(form.placa || '').trim().toUpperCase()
    return estadias.find(e => {
      if (String(e.id) === String(editandoId)) return false
      const mesmaNf = nf && String(e.nf || e.numeroNf || '').trim() === nf
      const mesmaPlaca = placa && String(e.placa || '').trim().toUpperCase() === placa && e.status !== 'Finalizado'
      return mesmaNf || mesmaPlaca
    })
  }

  const handleSalvar = async () => {
    if (!form.nf.trim()) { alert('Preencha o número da NF.'); return }
    if (!form.placa.trim()) { alert('Preencha a placa.'); return }
    if (!form.motivo.trim()) { alert('Escolha o motivo da estadia.'); return }
    if (!form.chegadaData || !form.chegadaHora || !form.saidaData || !form.saidaHora) { alert('Preencha chegada e saída.'); return }
    if (form.alterarCalculo && form.tipoCalculo === 'Hora' && !numeroBR(form.valorHora)) { alert('Preencha o fator/valor 0,80 ou outro valor negociado.'); return }
    if (form.alterarCalculo && form.tipoCalculo === 'Diária' && (!numeroBR(form.valorDiaria) || !form.qtdDias)) { alert('Preencha valor diária e quantidade de dias.'); return }
    if (form.alterarCalculo && form.tipoCalculo === 'Negociado' && !numeroBR(form.valorNegociado)) { alert('Preencha o valor negociado.'); return }

    const duplicada = encontrarDuplicada()
    if (!editandoId && duplicada && !confirm(`Já existe uma estadia parecida para ${duplicada.placa || 'esta placa'} / NF ${duplicada.nf || duplicada.numeroNf || '-'}. Deseja salvar mesmo assim?`)) return

    try {
      if (form.motorista.trim()) {
        await upsertMotoristaBasicoV2({
          nome: form.motorista.trim(),
          telefone: form.telefoneMotorista,
          observacao: 'Criado/atualizado pelo lançamento de estadia',
        }, usuarioAtual)
      }
      if (form.transportadora.trim()) await upsertTransportadoraV2(form.transportadora, usuarioAtual)
    } catch {}

    const novosAnexos = []
    for (const file of arquivos.slice(0, 2)) {
      const up = await uploadAnexoItem(file)
      if (up) novosAnexos.push(up)
    }
    const anexos = [...existingAnexos, ...novosAnexos]

    const payload = {
      ...form,
      placa: form.placa.trim().toUpperCase(),
      tipoCalculo: form.alterarCalculo ? form.tipoCalculo : 'Hora',
      franquia: form.alterarCalculo ? form.franquia : '12',
      valorHora: form.alterarCalculo ? form.valorHora : '0,80',
      numeroNf: form.nf,
      valorCalculado: calc.valor,
      totalHoras: calc.totalHoras,
      horasPagar: calc.horasPagar,
      regraCalculo: calc.regraResumo,
      ...calc,
      anexos,
    }

    if (editandoId) {
      const atual = estadias.find(e => String(e.id) === String(editandoId))
      const historicoItem = [
        eventoHistorico('Editou dados da estadia', usuarioAtual?.usuario, `Placa ${form.placa}`),
        ...(atual?.historicoItem || []),
      ].slice(0, 20)
      await editarLancada(editandoId, { ...payload, historicoItem })
      setEditandoId(null)
    } else {
      await adicionarLancada({
        ...payload,
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
            <span>Fluxo rápido: NF, placa, motivo, chegada, saída e anexo. A calculadora trabalha sozinha.</span>
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
          <div className="box-title"><h2>1. Dados básicos</h2><span>O mínimo para identificar a estadia.</span></div>
          <div className="form-grid estadia-form-grid">
            <div className="field field-sm"><label>Número da NF</label><input value={form.nf} onChange={e => set('nf', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="Ex: 388860" /></div>
            <div className="field field-sm"><label>Placa</label><input value={form.placa} onChange={e => set('placa', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))} placeholder="ABC1D23" /></div>
            <div className="field field-md"><label>Motivo da estadia</label><select value={form.motivo} onChange={e => set('motivo', e.target.value)}><option value="">Selecione</option><option>Fila no carregamento</option><option>Fila na descarga</option><option>Atraso da unidade</option><option>Documento pendente</option><option>Troca de nota</option><option>Refugo</option><option>Reentrega</option><option>Aguardando liberação</option><option>Problema no sistema</option><option>Divergência de rota/frete</option><option>Outros</option></select></div>
            <div className="field field-sm"><label>Onde ocorreu</label><select value={form.localEstadia} onChange={e => set('localEstadia', e.target.value)}><option>Origem</option><option>Destino</option></select></div>
            <div className="field field-sm"><label>Prioridade</label><select value={form.prioridade} onChange={e => set('prioridade', e.target.value)}><option>Normal</option><option>Alta</option><option>Urgente</option></select></div>
            {editandoId && <div className="field field-sm"><label>Status</label><select value={form.status} onChange={e => set('status', e.target.value)}><option>Aberto</option><option>Em análise</option><option>Feito</option><option>Finalizado</option></select></div>}
          </div>
        </div>

        <div className="box" style={{ marginBottom: 16 }}>
          <div className="box-title"><h2>2. Período</h2><span>Informe quando chegou e quando saiu/descarregou. O valor aparece automático.</span></div>
          <div className="form-grid estadia-form-grid">
            <div className="field field-sm"><label>Data chegada</label><input type="date" value={form.chegadaData} onChange={e => set('chegadaData', e.target.value)} /></div>
            <div className="field field-sm"><label>Hora chegada</label><input type="time" value={form.chegadaHora} onChange={e => set('chegadaHora', e.target.value)} /></div>
            <div className="field field-sm"><label>Data saída/descarga</label><input type="date" value={form.saidaData} onChange={e => set('saidaData', e.target.value)} /></div>
            <div className="field field-sm"><label>Hora saída/descarga</label><input type="time" value={form.saidaHora} onChange={e => set('saidaHora', e.target.value)} /></div>
          </div>

          <div className="calc-preview estadia-calc-preview">
            <div className="preview-card"><span>Regra</span><strong>{calc.regraCurta}</strong></div>
            <div className="preview-card"><span>Total parado</span><strong>{calc.totalHoras.replace('.', ',')} h</strong></div>
            <div className="preview-card"><span>Horas a pagar</span><strong>{calc.horasPagar.replace('.', ',')} h</strong></div>
            <div className="preview-card"><span>Valor previsto</span><strong>{calc.valor}</strong></div>
          </div>
          <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 13 }}>{calc.regraResumo}</div>
        </div>

        <div className="box" style={{ marginBottom: 16 }}>
          <div className="box-title"><h2>3. Dados complementares</h2><span>Opcional, preencha só quando precisar.</span></div>
          <div className="form-grid estadia-form-grid">
            <div className="field field-sm"><label>CT-e opcional</label><input value={form.cte} onChange={e => set('cte', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="Se tiver" /></div>
            <div className="field field-md"><label>Plataforma</label><select value={form.plataforma} onChange={e => set('plataforma', e.target.value)}><option>G&O - GRÃOS E OLEAGINOSAS</option><option>COFFEE</option><option>COTTON</option><option>FERTILIZANTES</option><option>GRAINS KOWALSKI</option><option>JUICES</option></select></div>
            <div className="field field-md"><label>Região aprovadora</label><select value={form.regiaoAprovadora} onChange={e => set('regiaoAprovadora', e.target.value)}><option value="">Selecione</option><option value="GO">Goiás - GO</option><option value="MT">Mato Grosso - MT</option><option value="MG">Minas Gerais - MG</option><option value="PR">Paraná - PR</option><option value="SP">São Paulo - SP</option><option value="OUTRO">Outro estado</option></select></div>
            <div className="field field-sm"><label>Sindicato acionado?</label><select value={form.sindicato} onChange={e => set('sindicato', e.target.value)}><option>Não</option><option>Sim</option></select></div>
            <div className="field field-lg"><label>Motorista opcional</label><input list="motoristas-estadia" value={form.motorista} onChange={e => set('motorista', e.target.value)} onBlur={preencherTelefoneMotorista} placeholder="Selecione ou digite o motorista" /><datalist id="motoristas-estadia">{motoristasOptions.map(m => <option key={m.nome} value={m.nome} label={`${m.telefone ? m.telefone + ' · ' : ''}${m.origem}${m.carregou ? ` · carregou ${m.carregou}x` : ''}`} />)}</datalist></div>
            <div className="field field-sm"><label>WhatsApp opcional</label><input value={form.telefoneMotorista} onChange={e => set('telefoneMotorista', e.target.value.replace(/[^0-9]/g, ''))} placeholder="64999999999" /></div>
            <div className="field field-md"><label>Transportadora opcional</label><input list="transportadoras-estadia" value={form.transportadora} onChange={e => set('transportadora', e.target.value)} placeholder="Selecione ou digite" /><datalist id="transportadoras-estadia">{transportadorasOptions.map(t => <option key={t} value={t} />)}</datalist></div>
          </div>
        </div>

        <div className="box" style={{ marginBottom: 16 }}>
          <div className="box-title"><h2>4. Alterar cálculo</h2><span>Use somente quando fugir do padrão.</span></div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', marginBottom: form.alterarCalculo ? 14 : 0 }}>
            <input type="checkbox" checked={form.alterarCalculo} onChange={e => set('alterarCalculo', e.target.checked)} style={{ width: 18, height: 18 }} />
            <strong>Quero alterar a regra, diária ou valor negociado</strong>
          </label>

          {form.alterarCalculo && <div className="form-grid estadia-form-grid">
            <div className="field field-sm"><label>Tipo de cálculo</label><select value={form.tipoCalculo} onChange={e => set('tipoCalculo', e.target.value)}><option>Hora</option><option>Diária</option><option>Negociado</option></select></div>
            <div className="field field-sm"><label>Franquia a descontar</label><select value={form.franquia} onChange={e => set('franquia', e.target.value)}><option value="12">12h padrão</option><option value="24">24h negociado</option><option value="48">48h negociado</option><option value="0">Sem franquia</option></select></div>
            {form.tipoCalculo === 'Hora' && <div className="field field-sm"><label>Fator/valor hora</label><input value={form.valorHora} onChange={e => set('valorHora', e.target.value)} placeholder="0,80" /></div>}
            {form.tipoCalculo === 'Diária' && <><div className="field field-sm"><label>Valor diária</label><input value={form.valorDiaria} onChange={e => set('valorDiaria', e.target.value)} placeholder="Ex: 350,00" /></div><div className="field field-sm"><label>Qtd. dias</label><input value={form.qtdDias} onChange={e => set('qtdDias', e.target.value.replace(/\D/g, ''))} placeholder="Ex: 2" /></div></>}
            {form.tipoCalculo === 'Negociado' && <div className="field field-sm"><label>Valor negociado</label><input value={form.valorNegociado} onChange={e => set('valorNegociado', e.target.value)} placeholder="Ex: 2172,90" /></div>}
          </div>}
        </div>

        <div className="box" style={{ marginBottom: 16 }}>
          <div className="box-title"><h2>5. Anexos e observação</h2><span>Comprovante de carga/descarga, e-mail, NF, CT-e ou print.</span></div>
          <div className="form-grid estadia-form-grid" style={{ marginBottom: 12 }}>
            <div className="field wide"><label>Observação</label><input value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Ex: negociado com célula, aguardar descarga, anexar comprovante..." /></div>
          </div>
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
