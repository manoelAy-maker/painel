import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import DropZone from '../components/DropZone'
import { arquivarEstadiaLancada } from '../lib/ayresSafety'
import { listarMotoristasBancoV2, listarTransportadorasV2, upsertMotoristaBasicoV2, upsertTransportadoraV2 } from '../lib/supabaseV2'
import '../estadia-desktop-pro.css'

const EMPTY = {
  nf: '', cte: '', motorista: '', telefoneMotorista: '', transportadora: '', placa: '', peso: '',
  plataforma: 'G&O - GRÃOS E OLEAGINOSAS', regiaoAprovadora: '', localEstadia: 'Destino',
  motivo: '', sindicato: 'Não', prioridade: 'Normal', status: 'Aberto',
  chegadaData: '', chegadaHora: '', saidaData: '', saidaHora: '',
  alterarCalculo: false, tipoCalculo: 'Hora', franquia: '12', valorHora: '0,80', valorDiaria: '', qtdDias: '', valorNegociado: '',
  obs: '',
}
const TRANSPORTADORAS_BASE = ['Via Log', 'RDR', 'Transportes', 'Autônomo']

function uniq(arr) { return [...new Set(arr.map(v => String(v || '').trim()).filter(Boolean))] }
function chaveNome(nome) { return String(nome || '').trim().toUpperCase() }
function agoraHistorico() { return new Date().toLocaleString('pt-BR') }
function eventoHistorico(acao, usuario, detalhes = '') { return { data: agoraHistorico(), usuario: usuario || '-', acao, detalhes } }
function numeroBR(valor) { if (!valor) return 0; return Number(String(valor).replace(/\./g, '').replace(',', '.')) || 0 }
function dinheiroBR(valor) { return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function toneladasDoPeso(peso) {
  const valor = numeroBR(peso)
  return valor > 1000 ? valor / 1000 : valor
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
  const toneladas = toneladasDoPeso(form.peso)
  const horasPagar = Math.max(0, totalHoras - franquia)
  let valorNumero = 0
  if (tipo === 'Diária') {
    const dias = Number(form.qtdDias) || 0
    valorNumero = numeroBR(form.valorDiaria) * dias
    return { horas: String(dias * 24 || 0), totalHoras: totalHoras.toFixed(2), horasPagar: String(dias * 24 || 0), toneladas: toneladas.toFixed(3), valorNumero, valor: dinheiroBR(valorNumero), regraResumo: 'Diária manual', regraCurta: 'Manual', chegada: formatarDataHora(form.chegadaData, form.chegadaHora), saida: formatarDataHora(form.saidaData, form.saidaHora) }
  }
  if (tipo === 'Negociado') valorNumero = numeroBR(form.valorNegociado)
  else valorNumero = toneladas * horasPagar * fator
  const temHorasCobraveis = horasPagar > 0
  return { horas: horasPagar.toFixed(2), totalHoras: totalHoras.toFixed(2), horasPagar: horasPagar.toFixed(2), toneladas: toneladas.toFixed(3), valorNumero, valor: dinheiroBR(valorNumero), regraResumo: temHorasCobraveis ? `${toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} t × R$ ${String(fator).replace('.', ',')} × ${horasPagar.toFixed(2).replace('.', ',')} h após ${franquia}h de franquia` : `Franquia de ${franquia}h ainda não ultrapassada`, regraCurta: form.alterarCalculo ? 'Manual' : 'R$ 0,80/t/h', chegada: formatarDataHora(form.chegadaData, form.chegadaHora), saida: formatarDataHora(form.saidaData, form.saidaHora) }
}

const motivos = ['Fila no carregamento', 'Fila na descarga', 'Atraso da unidade', 'Documento pendente', 'Troca de nota', 'Refugo', 'Reentrega', 'Aguardando liberação', 'Problema no sistema', 'Divergência de rota/frete', 'Outros']

export default function EstadiaLancada({ formRef }) {
  const { estadias, adicionarLancada, editarLancada, excluirLancada, itemParaLancar, limparItemParaLancar, uploadAnexoItem, usuarioAtual, toast, mudarAba } = useApp()
  const [form, setForm] = useState(EMPTY)
  const [editandoId, setEditandoId] = useState(null)
  const [arquivos, setArquivos] = useState([])
  const [existingAnexos, setExistingAnexos] = useState([])
  const [bancoMotoristas, setBancoMotoristas] = useState([])
  const [bancoTransportadoras, setBancoTransportadoras] = useState([])
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const calc = calcularEstadiaOperacional(form)

  const carregarCadastros = async () => {
    try { setBancoMotoristas(await listarMotoristasBancoV2() || []) } catch { setBancoMotoristas([]) }
    try { setBancoTransportadoras(await listarTransportadorasV2() || []) } catch { setBancoTransportadoras([]) }
  }
  useEffect(() => { carregarCadastros() }, [])

  const motoristasOptions = useMemo(() => {
    const map = new Map()
    bancoMotoristas.forEach(m => {
      const nome = String(m.nome || '').trim()
      if (!nome) return
      map.set(chaveNome(nome), { nome, telefone: m.telefone || '', origem: m.captacoes?.length ? 'Captação' : 'Banco', carregou: (m.captacoes || []).filter(c => c.status === 'carregou').length })
    })
    estadias.forEach(e => {
      const nome = String(e.motorista || '').trim()
      if (!nome) return
      const key = chaveNome(nome)
      const atual = map.get(key)
      map.set(key, { nome, telefone: atual?.telefone || e.telefoneMotorista || '', origem: atual?.origem || 'Estadia', carregou: atual?.carregou || 0 })
    })
    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome))
  }, [bancoMotoristas, estadias])
  const transportadorasOptions = useMemo(() => uniq([...TRANSPORTADORAS_BASE, ...bancoTransportadoras.map(t => t.nome), ...estadias.map(e => e.transportadora)]).sort((a, b) => a.localeCompare(b)), [bancoTransportadoras, estadias])
  const preencherTelefoneMotorista = () => {
    const achou = motoristasOptions.find(m => chaveNome(m.nome) === chaveNome(form.motorista))
    if (achou?.telefone) set('telefoneMotorista', String(achou.telefone).replace(/[^0-9]/g, ''))
  }

  const preencherFormularioEdicao = (e) => {
    if (!e) return
    setEditandoId(e.id)
    setForm({
      nf: e.nf || e.numeroNf || '', cte: e.cte || '', motorista: e.motorista || '', telefoneMotorista: e.telefoneMotorista || '', transportadora: e.transportadora || '', placa: e.placa || '', peso: e.peso || '',
      plataforma: e.plataforma || 'G&O - GRÃOS E OLEAGINOSAS', regiaoAprovadora: e.regiaoAprovadora || '', localEstadia: e.localEstadia || 'Destino', motivo: e.motivo || '', sindicato: e.sindicato || 'Não', prioridade: e.prioridade || 'Normal', status: e.status || 'Aberto',
      chegadaData: e.chegadaData || '', chegadaHora: e.chegadaHora || '', saidaData: e.saidaData || '', saidaHora: e.saidaHora || '',
      alterarCalculo: Boolean(e.alterarCalculo), tipoCalculo: e.tipoCalculo || 'Hora', franquia: e.franquia || '12', valorHora: e.valorHora || '0,80', valorDiaria: e.valorDiaria || '', qtdDias: e.qtdDias || '', valorNegociado: e.valorNegociado || '', obs: e.obs || '',
    })
    setExistingAnexos(e.anexos || [])
    setArquivos([])
    formRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (!itemParaLancar) return
    setForm(prev => ({
      ...prev,
      nf: itemParaLancar.nf || itemParaLancar.numeroNf || '', cte: itemParaLancar.cte || '', placa: itemParaLancar.placa || '', peso: itemParaLancar.peso || '', transportadora: itemParaLancar.transportadora || '', prioridade: itemParaLancar.prioridade || 'Normal',
      plataforma: itemParaLancar.plataforma || prev.plataforma, regiaoAprovadora: itemParaLancar.regiaoAprovadora || '', localEstadia: itemParaLancar.localEstadia || prev.localEstadia, motivo: itemParaLancar.motivo || '', sindicato: itemParaLancar.sindicato || 'Não',
      chegadaData: itemParaLancar.chegadaData || '', chegadaHora: itemParaLancar.chegadaHora || '', saidaData: itemParaLancar.saidaData || '', saidaHora: itemParaLancar.saidaHora || '',
      alterarCalculo: Boolean(itemParaLancar.alterarCalculo), tipoCalculo: itemParaLancar.tipoCalculo || prev.tipoCalculo, franquia: itemParaLancar.franquia || prev.franquia, valorHora: itemParaLancar.valorHora || prev.valorHora, valorDiaria: itemParaLancar.valorDiaria || '', qtdDias: itemParaLancar.qtdDias || '', valorNegociado: itemParaLancar.valorNegociado || '', obs: itemParaLancar.obs || '',
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

  const handleCancelarEdicao = () => { setEditandoId(null); setForm(EMPTY); setArquivos([]); setExistingAnexos([]) }
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
    if ((form.alterarCalculo ? form.tipoCalculo === 'Hora' : true) && !toneladasDoPeso(form.peso)) { alert('Preencha o peso carregado para calcular a estadia.'); return }
    if (!form.motivo.trim()) { alert('Escolha o motivo da estadia.'); return }
    if (!form.chegadaData || !form.chegadaHora || !form.saidaData || !form.saidaHora) { alert('Preencha chegada e saída.'); return }
    if (form.alterarCalculo && form.tipoCalculo === 'Hora' && !numeroBR(form.valorHora)) { alert('Preencha o fator/valor 0,80 ou outro valor negociado.'); return }
    if (form.alterarCalculo && form.tipoCalculo === 'Diária' && (!numeroBR(form.valorDiaria) || !form.qtdDias)) { alert('Preencha valor diária e quantidade de dias.'); return }
    if (form.alterarCalculo && form.tipoCalculo === 'Negociado' && !numeroBR(form.valorNegociado)) { alert('Preencha o valor negociado.'); return }
    const duplicada = encontrarDuplicada()
    if (!editandoId && duplicada && !confirm(`Já existe uma estadia parecida para ${duplicada.placa || 'esta placa'} / NF ${duplicada.nf || duplicada.numeroNf || '-'}. Deseja salvar mesmo assim?`)) return
    try {
      if (form.motorista.trim()) await upsertMotoristaBasicoV2({ nome: form.motorista.trim(), telefone: form.telefoneMotorista, observacao: 'Criado/atualizado pelo lançamento de estadia' }, usuarioAtual)
      if (form.transportadora.trim()) await upsertTransportadoraV2(form.transportadora, usuarioAtual)
    } catch {}
    const novosAnexos = []
    for (const file of arquivos.slice(0, 2)) { const up = await uploadAnexoItem(file); if (up) novosAnexos.push(up) }
    const anexos = [...existingAnexos, ...novosAnexos]
    const payload = { ...form, placa: form.placa.trim().toUpperCase(), tipoCalculo: form.alterarCalculo ? form.tipoCalculo : 'Hora', franquia: form.alterarCalculo ? form.franquia : '12', valorHora: form.alterarCalculo ? form.valorHora : '0,80', numeroNf: form.nf, valorCalculado: calc.valor, totalHoras: calc.totalHoras, horasPagar: calc.horasPagar, regraCalculo: calc.regraResumo, ...calc, anexos }
    if (editandoId) {
      const atual = estadias.find(e => String(e.id) === String(editandoId))
      const historicoItem = [eventoHistorico('Editou dados da estadia', usuarioAtual?.usuario, `Placa ${form.placa}`), ...(atual?.historicoItem || [])].slice(0, 20)
      await editarLancada(editandoId, { ...payload, historicoItem })
      setEditandoId(null)
    } else await adicionarLancada({ ...payload, historicoItem: [eventoHistorico('Criou estadia lançada', usuarioAtual?.usuario, `Placa ${form.placa}`)] })
    setForm(EMPTY); setArquivos([]); setExistingAnexos([]); carregarCadastros()
  }
  const handleArquivarEdicao = async () => {
    const atual = estadias.find(e => String(e.id) === String(editandoId))
    if (!atual) return
    if (!confirm('Arquivar esta estadia? Ela vai sair da tela, mas ficará salva na Lixeira com os anexos.')) return
    try { await arquivarEstadiaLancada(atual, usuarioAtual?.usuario || '-', 'Estadia arquivada pela tela de edição'); await excluirLancada(atual.id); toast?.('Estadia arquivada na Lixeira.', 'ok'); handleCancelarEdicao() } catch { toast?.('Não consegui arquivar. Verifique o Supabase/Lixeira.', 'err') }
  }

  return (
    <section className="aba active" id="abaLancadas">
      <div className="estadia-shell" ref={formRef}>
        <header className="estadia-head-clean">
          <div>
            <span className="estadia-eyebrow">Controle operacional</span>
            <h2>{editandoId ? 'Editar estadia' : 'Lançar nova estadia'}</h2>
            <p>Preencha os dados principais. O cálculo e os anexos ficam no fechamento à direita.</p>
          </div>
          <div className="estadia-head-actions">
            <button className="btn-light btn-small" onClick={() => mudarAba('consultaLancadas')}>Ver lançadas</button>
            {editandoId && <button className="btn-red btn-small" onClick={handleArquivarEdicao}>Arquivar</button>}
          </div>
        </header>
        <div className="estadia-body-clean">
          <main className="estadia-main-clean">
            <section className="estadia-card-clean">
              <div className="estadia-card-title"><strong>Dados da estadia</strong><span>NF, motivo e prioridade</span></div>
              <div className="estadia-grid-clean cols-5">
                <div className="field"><label>Número da NF</label><input value={form.nf} onChange={e => set('nf', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="Ex: 388860" /></div>
                <div className="field"><label>CT-e opcional</label><input value={form.cte} onChange={e => set('cte', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="Se tiver" /></div>
                <div className="field span-2"><label>Motivo da estadia</label><select value={form.motivo} onChange={e => set('motivo', e.target.value)}><option value="">Selecione</option>{motivos.map(m => <option key={m}>{m}</option>)}</select></div>
                <div className="field"><label>Onde ocorreu</label><select value={form.localEstadia} onChange={e => set('localEstadia', e.target.value)}><option>Origem</option><option>Destino</option></select></div>
                <div className="field"><label>Prioridade</label><select value={form.prioridade} onChange={e => set('prioridade', e.target.value)}><option>Normal</option><option>Alta</option><option>Urgente</option></select></div>
                {editandoId && <div className="field"><label>Status</label><select value={form.status} onChange={e => set('status', e.target.value)}><option>Aberto</option><option>Em análise</option><option>Feito</option><option>Finalizado</option></select></div>}
              </div>
            </section>
            <section className="estadia-card-clean">
              <div className="estadia-card-title"><strong>Motorista e veículo</strong><span>Placa junto do motorista</span></div>
              <div className="estadia-grid-clean cols-4">
                <div className="field span-2"><label>Motorista opcional</label><input list="motoristas-estadia" value={form.motorista} onChange={e => set('motorista', e.target.value)} onBlur={preencherTelefoneMotorista} placeholder="Selecione ou digite" /><datalist id="motoristas-estadia">{motoristasOptions.map(m => <option key={m.nome} value={m.nome} label={`${m.telefone ? m.telefone + ' · ' : ''}${m.origem}${m.carregou ? ` · carregou ${m.carregou}x` : ''}`} />)}</datalist></div>
                <div className="field"><label>Placa</label><input className="placa-input" value={form.placa} onChange={e => set('placa', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))} placeholder="ABC1D23" /></div>
                <div className="field"><label>Peso carregado (kg)</label><input value={form.peso} onChange={e => set('peso', e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="Ex: 38.380" inputMode="decimal" /></div>
                <div className="field"><label>WhatsApp opcional</label><input value={form.telefoneMotorista} onChange={e => set('telefoneMotorista', e.target.value.replace(/[^0-9]/g, ''))} placeholder="64999999999" /></div>
                <div className="field span-2"><label>Transportadora opcional</label><input list="transportadoras-estadia" value={form.transportadora} onChange={e => set('transportadora', e.target.value)} placeholder="Selecione ou digite" /><datalist id="transportadoras-estadia">{transportadorasOptions.map(t => <option key={t} value={t} />)}</datalist></div>
              </div>
            </section>
            <section className="estadia-card-clean">
              <div className="estadia-card-title"><strong>Período</strong><span>Chegada e saída/descarga</span></div>
              <div className="estadia-grid-clean cols-4">
                <div className="field"><label>Data chegada</label><input type="date" value={form.chegadaData} onChange={e => set('chegadaData', e.target.value)} /></div>
                <div className="field"><label>Hora chegada</label><input type="time" value={form.chegadaHora} onChange={e => set('chegadaHora', e.target.value)} /></div>
                <div className="field"><label>Data saída/descarga</label><input type="date" value={form.saidaData} onChange={e => set('saidaData', e.target.value)} /></div>
                <div className="field"><label>Hora saída/descarga</label><input type="time" value={form.saidaHora} onChange={e => set('saidaHora', e.target.value)} /></div>
              </div>
            </section>
            <section className="estadia-card-clean muted-card">
              <div className="estadia-card-title"><strong>Complementares</strong><span>Opcional</span></div>
              <div className="estadia-grid-clean cols-4">
                <div className="field span-2"><label>Plataforma</label><select value={form.plataforma} onChange={e => set('plataforma', e.target.value)}><option>G&O - GRÃOS E OLEAGINOSAS</option><option>COFFEE</option><option>COTTON</option><option>FERTILIZANTES</option><option>GRAINS KOWALSKI</option><option>JUICES</option></select></div>
                <div className="field"><label>Região aprovadora</label><select value={form.regiaoAprovadora} onChange={e => set('regiaoAprovadora', e.target.value)}><option value="">Selecione</option><option value="GO">Goiás - GO</option><option value="MT">Mato Grosso - MT</option><option value="MG">Minas Gerais - MG</option><option value="PR">Paraná - PR</option><option value="SP">São Paulo - SP</option><option value="OUTRO">Outro estado</option></select></div>
                <div className="field"><label>Sindicato?</label><select value={form.sindicato} onChange={e => set('sindicato', e.target.value)}><option>Não</option><option>Sim</option></select></div>
              </div>
            </section>
          </main>
          <aside className="estadia-summary-clean">
            <div className="summary-topline">Cálculo automático</div>
            <h3>{calc.valor}</h3>
            <p>{calc.regraResumo}</p>
            <div className="summary-metrics">
              <div><span>Regra</span><strong>{calc.regraCurta}</strong></div>
              <div><span>Peso</span><strong>{calc.toneladas.replace('.', ',')} t</strong></div>
              <div><span>Total parado</span><strong>{calc.totalHoras.replace('.', ',')} h</strong></div>
              <div><span>Horas a pagar</span><strong>{calc.horasPagar.replace('.', ',')} h</strong></div>
            </div>
            <label className="manual-toggle"><input type="checkbox" checked={form.alterarCalculo} onChange={e => set('alterarCalculo', e.target.checked)} /><span>Alterar cálculo manualmente</span></label>
            {form.alterarCalculo && <div className="manual-calc-box">
              <div className="field"><label>Tipo de cálculo</label><select value={form.tipoCalculo} onChange={e => set('tipoCalculo', e.target.value)}><option>Hora</option><option>Diária</option><option>Negociado</option></select></div>
              <div className="field"><label>Franquia</label><select value={form.franquia} onChange={e => set('franquia', e.target.value)}><option value="12">12h padrão</option><option value="24">24h negociado</option><option value="48">48h negociado</option><option value="0">Sem franquia</option></select></div>
              {form.tipoCalculo === 'Hora' && <div className="field"><label>Fator/valor hora</label><input value={form.valorHora} onChange={e => set('valorHora', e.target.value)} placeholder="0,80" /></div>}
              {form.tipoCalculo === 'Diária' && <><div className="field"><label>Valor diária</label><input value={form.valorDiaria} onChange={e => set('valorDiaria', e.target.value)} placeholder="Ex: 350,00" /></div><div className="field"><label>Qtd. dias</label><input value={form.qtdDias} onChange={e => set('qtdDias', e.target.value.replace(/\D/g, ''))} placeholder="Ex: 2" /></div></>}
              {form.tipoCalculo === 'Negociado' && <div className="field"><label>Valor negociado</label><input value={form.valorNegociado} onChange={e => set('valorNegociado', e.target.value)} placeholder="Ex: 2172,90" /></div>}
            </div>}
            <div className="summary-attachments">
              <div className="summary-attachments-title"><strong>Anexos</strong><span>Comprovantes</span></div>
              <DropZone arquivos={arquivos} onChange={setArquivos} />
              {existingAnexos.length > 0 && <div className="anexos-existentes">{existingAnexos.map((a, i) => <a key={i} className="anexo-link" href={a.url} target="_blank" rel="noopener noreferrer">📄 {a.nome || `Arquivo ${i + 1}`}</a>)}</div>}
            </div>
            <div className="summary-note field"><label>Observação</label><input value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Detalhe rápido..." /></div>
            <button className="btn-green btn-full summary-save" onClick={handleSalvar}>{editandoId ? 'Salvar alterações' : 'Salvar estadia'}</button>
            {editandoId && <button className="btn-light summary-cancel" onClick={handleCancelarEdicao}>Cancelar edição</button>}
          </aside>
        </div>
      </div>
    </section>
  )
}
