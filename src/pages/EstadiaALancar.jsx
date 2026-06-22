import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import DropZone from '../components/DropZone'
import { nomeFilial } from '../data/filiais'
import { tempoDecorrido, slaPendencia } from '../utils/index'
import { arquivarEstadiaALancar } from '../lib/ayresSafety'

const criarFormVazio = (filial = 'jatai-go') => ({
  filial,
  placa: '',
  nf: '',
  cte: '',
  transportadora: '',
  plataforma: 'G&O - GRÃOS E OLEAGINOSAS',
  regiaoAprovadora: '',
  localEstadia: 'Destino',
  statusControle: 'A lançar',
  prioridade: 'Normal',
  motivo: '',
  sindicato: 'Não',
  chegadaData: '',
  chegadaHora: '',
  saidaData: '',
  saidaHora: '',
  tipoCalculo: 'Hora',
  franquia: '48',
  valorHora: '',
  valorDiaria: '',
  qtdDias: '',
  valorNegociado: '',
  obs: '',
})

function classePrio(p) {
  if (p === 'Urgente') return 'prio-urgente'
  if (p === 'Alta' || p === 'Média') return 'prio-media'
  return 'prio-normal'
}

function moedaBR(valor) {
  const n = Number(valor) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function numeroBR(valor) {
  if (!valor) return 0
  return Number(String(valor).replace(/\./g, '').replace(',', '.')) || 0
}

function horasEntre(dataIni, horaIni, dataFim, horaFim) {
  if (!dataIni || !horaIni || !dataFim || !horaFim) return 0
  const ini = new Date(`${dataIni}T${horaIni}`)
  const fim = new Date(`${dataFim}T${horaFim}`)
  if (Number.isNaN(ini.getTime()) || Number.isNaN(fim.getTime()) || fim <= ini) return 0
  return (fim - ini) / 36e5
}

function calcularPreview(form) {
  const tipo = form.tipoCalculo || 'Hora'
  const franquia = numeroBR(form.franquia)
  const totalHoras = horasEntre(form.chegadaData, form.chegadaHora, form.saidaData, form.saidaHora)
  const horasPagar = Math.max(0, totalHoras - franquia)

  if (tipo === 'Diária') {
    const valor = numeroBR(form.valorDiaria) * (Number(form.qtdDias) || 0)
    return { totalHoras, horasPagar: Number(form.qtdDias || 0) * 24, valor }
  }

  if (tipo === 'Negociado') {
    return { totalHoras, horasPagar, valor: numeroBR(form.valorNegociado) }
  }

  return { totalHoras, horasPagar, valor: horasPagar * numeroBR(form.valorHora) }
}

function TempoPendente({ data, compacto = false }) {
  const sla = slaPendencia(data)
  return (
    <div className={`tempo-info tempo-pendente tempo-${sla.nivel} ${compacto ? 'tempo-compacto' : ''}`}>
      <strong>{tempoDecorrido(data)}</strong>
      <small>{sla.label} · {compacto ? 'pendente' : sla.descricao}</small>
    </div>
  )
}

function SlaBadge({ data }) {
  const sla = slaPendencia(data)
  return <span className={`sla-badge sla-${sla.nivel}`}>{sla.label}</span>
}

export default function EstadiaALancar({ formRef }) {
  const { estadiasALancar, adicionarALancar, abrirParaLancar, excluirALancar, filiais, usuarioAtual, toast } = useApp()
  const filialPadrao = usuarioAtual?.filial || 'jatai-go'
  const [form, setForm] = useState(criarFormVazio(filialPadrao))
  const [arquivos, setArquivos] = useState([])
  const isAdmin = usuarioAtual?.cargo === 'Admin'

  const listaBase = isAdmin
    ? estadiasALancar
    : estadiasALancar.filter(e => (e.filial || 'jatai-go') === filialPadrao)

  const lista = [...listaBase].sort((a, b) => slaPendencia(b.dataCriacao).ordem - slaPendencia(a.dataCriacao).ordem)
  const criticas = lista.filter(e => slaPendencia(e.dataCriacao).nivel === 'critico').length
  const urgentes = lista.filter(e => slaPendencia(e.dataCriacao).nivel === 'urgente').length
  const preview = useMemo(() => calcularPreview(form), [form])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const duplicidade = useMemo(() => {
    const placa = form.placa.trim().toUpperCase()
    const nf = form.nf.trim()
    if (!placa || !nf) return null
    return listaBase.find(e => String(e.placa || '').toUpperCase() === placa && String(e.nf || '') === nf)
  }, [form.placa, form.nf, listaBase])

  const aplicarRegra = (horas) => {
    setForm(p => ({ ...p, franquia: String(horas) }))
  }

  const handleSalvar = async () => {
    if (!form.filial) { alert('Escolha a filial que vai lançar.'); return }
    if (!form.placa.trim()) { alert('Preencha a placa.'); return }
    if (!form.nf.trim()) { alert('Preencha o número da NF.'); return }
    if (!form.motivo) { alert('Escolha o motivo da estadia.'); return }
    if (duplicidade && !confirm('Possível duplicidade: já existe pendência com esta placa e NF. Deseja salvar mesmo assim?')) return

    await adicionarALancar({
      ...form,
      placa: form.placa.trim().toUpperCase(),
      valorCalculado: moedaBR(preview.valor),
      totalHoras: preview.totalHoras.toFixed(2),
      horasPagar: preview.horasPagar.toFixed(2),
    }, arquivos)
    setForm(criarFormVazio(filialPadrao))
    setArquivos([])
  }

  const handleArquivar = async (e) => {
    if (!confirm('Arquivar esta pendência? Ela vai sair da tela, mas ficará salva na Lixeira com os anexos.')) return
    try {
      await arquivarEstadiaALancar(e, usuarioAtual?.usuario || '-', 'Pendência arquivada pela tela A lançar')
      await excluirALancar(e.id)
      toast?.('Pendência arquivada na Lixeira.', 'ok')
    } catch {
      toast?.('Não consegui arquivar. Verifique o Supabase/Lixeira.', 'err')
    }
  }

  return (
    <section className="aba active" id="abaALancar">
      {(criticas > 0 || urgentes > 0) && (
        <div className={`sla-alert ${criticas > 0 ? 'critico' : 'urgente'}`}>
          <strong>{criticas > 0 ? 'Atenção crítica' : 'Atenção operacional'}</strong>
          <span>{criticas} crítica(s) e {urgentes} urgente(s) aguardando tratamento. As mais antigas ficam no topo.</span>
        </div>
      )}

      <div className="box" ref={formRef}>
        <div className="box-title">
          <h2>Adicionar estadia a lançar</h2>
          <span>Formulário enxuto: sem favorecido, responsável, centro de custo ou protocolo manual.</span>
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Filial que vai lançar</label>
            <select value={form.filial} onChange={e => set('filial', e.target.value)}>
              {filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Plataforma</label>
            <select value={form.plataforma} onChange={e => set('plataforma', e.target.value)}>
              <option>G&O - GRÃOS E OLEAGINOSAS</option>
              <option>COFFEE</option>
              <option>COTTON</option>
              <option>FERTILIZANTES</option>
              <option>GRAINS KOWALSKI</option>
              <option>JUICES</option>
            </select>
          </div>

          <div className="field">
            <label>Região aprovadora</label>
            <select value={form.regiaoAprovadora} onChange={e => set('regiaoAprovadora', e.target.value)}>
              <option value="">Selecione</option>
              <option>Jataí - GO</option>
              <option>Alto Araguaia - MT</option>
              <option>Araguari - MG</option>
              <option>Paranaguá - PR</option>
              <option>Outra</option>
            </select>
          </div>

          <div className="field">
            <label>Onde ocorreu</label>
            <select value={form.localEstadia} onChange={e => set('localEstadia', e.target.value)}>
              <option>Origem</option>
              <option>Destino</option>
            </select>
          </div>

          <div className="field">
            <label>Placa</label>
            <input value={form.placa} onChange={e => set('placa', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))} placeholder="ABC1D23" />
          </div>

          <div className="field">
            <label>Número da NF</label>
            <input value={form.nf} onChange={e => set('nf', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="NF do produto" />
          </div>

          <div className="field">
            <label>CT-e opcional</label>
            <input value={form.cte} onChange={e => set('cte', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="Se tiver" />
          </div>

          <div className="field">
            <label>Transportadora</label>
            <input value={form.transportadora} onChange={e => set('transportadora', e.target.value)} placeholder="Ex: Via Log" />
          </div>

          <div className="field">
            <label>Prioridade</label>
            <select value={form.prioridade} onChange={e => set('prioridade', e.target.value)}>
              <option>Normal</option><option>Alta</option><option>Urgente</option>
            </select>
          </div>

          <div className="field">
            <label>Status</label>
            <select value={form.statusControle} onChange={e => set('statusControle', e.target.value)}>
              <option>A lançar</option>
              <option>Em análise</option>
              <option>Aprovada</option>
              <option>Reprovada</option>
              <option>Lançada</option>
              <option>Finalizada</option>
            </select>
          </div>

          <div className="field">
            <label>Motivo da estadia</label>
            <select value={form.motivo} onChange={e => set('motivo', e.target.value)}>
              <option value="">Selecione</option>
              <option>Fila no carregamento</option>
              <option>Fila na descarga</option>
              <option>Atraso da unidade</option>
              <option>Documento pendente</option>
              <option>Troca de nota</option>
              <option>Refugo</option>
              <option>Reentrega</option>
              <option>Aguardando liberação</option>
              <option>Problema no sistema</option>
              <option>Divergência de rota/frete</option>
              <option>Outros</option>
            </select>
          </div>

          <div className="field">
            <label>Sindicato acionado?</label>
            <select value={form.sindicato} onChange={e => set('sindicato', e.target.value)}>
              <option>Não</option>
              <option>Sim</option>
            </select>
          </div>

          <div className="field">
            <label>Regra/franquia rápida</label>
            <select value={form.franquia} onChange={e => aplicarRegra(e.target.value)}>
              <option value="12">12h</option>
              <option value="24">24h</option>
              <option value="48">48h</option>
              <option value="0">Sem franquia</option>
            </select>
          </div>

          <div className="field">
            <label>Data chegada</label>
            <input type="date" value={form.chegadaData} onChange={e => set('chegadaData', e.target.value)} />
          </div>

          <div className="field">
            <label>Hora chegada</label>
            <input type="time" value={form.chegadaHora} onChange={e => set('chegadaHora', e.target.value)} />
          </div>

          <div className="field">
            <label>Data saída/descarga</label>
            <input type="date" value={form.saidaData} onChange={e => set('saidaData', e.target.value)} />
          </div>

          <div className="field">
            <label>Hora saída/descarga</label>
            <input type="time" value={form.saidaHora} onChange={e => set('saidaHora', e.target.value)} />
          </div>

          <div className="field">
            <label>Tipo de cálculo</label>
            <select value={form.tipoCalculo} onChange={e => set('tipoCalculo', e.target.value)}>
              <option>Hora</option>
              <option>Diária</option>
              <option>Negociado</option>
            </select>
          </div>

          {form.tipoCalculo === 'Hora' && (
            <>
              <div className="field">
                <label>Valor por hora</label>
                <input value={form.valorHora} onChange={e => set('valorHora', e.target.value)} placeholder="Ex: 31,49" />
              </div>
              <div className="field">
                <label>Franquia manual</label>
                <input value={form.franquia} onChange={e => set('franquia', e.target.value)} placeholder="Ex: 48" />
              </div>
            </>
          )}

          {form.tipoCalculo === 'Diária' && (
            <>
              <div className="field">
                <label>Valor diária</label>
                <input value={form.valorDiaria} onChange={e => set('valorDiaria', e.target.value)} placeholder="Ex: 350,00" />
              </div>
              <div className="field">
                <label>Quantidade de dias</label>
                <input value={form.qtdDias} onChange={e => set('qtdDias', e.target.value.replace(/\D/g, ''))} placeholder="Ex: 2" />
              </div>
            </>
          )}

          {form.tipoCalculo === 'Negociado' && (
            <div className="field">
              <label>Valor negociado</label>
              <input value={form.valorNegociado} onChange={e => set('valorNegociado', e.target.value)} placeholder="Ex: 2172,90" />
            </div>
          )}

          <div className="field wide">
            <label>Resumo do cálculo</label>
            <input readOnly value={`Total ${preview.totalHoras.toFixed(2)}h · Pagar ${preview.horasPagar.toFixed(2)}h · ${moedaBR(preview.valor)}`} />
          </div>

          {duplicidade && (
            <div className="field wide">
              <div className="sla-alert urgente">
                <strong>Possível duplicidade</strong>
                <span>Já existe pendência com esta placa e NF. Confira antes de enviar.</span>
              </div>
            </div>
          )}

          <div className="field wide">
            <label>Observação</label>
            <input value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Ex: negociar com célula, anexar comprovante, conferir descarga..." />
          </div>

          <DropZone arquivos={arquivos} onChange={setArquivos} />
        </div>

        <button type="button" className="btn-purple btn-full" onClick={handleSalvar}>Enviar para filial lançar</button>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Filial</th><th>Placa/NF</th><th>SLA</th><th>Motivo</th><th>Cálculo</th><th>Prioridade</th>
                <th>Anexo</th><th>Observação</th><th>Criado por</th><th>Pendente há</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0
                ? <tr><td colSpan={12} className="empty">Nenhuma estadia a lançar para sua filial.</td></tr>
                : lista.map(e => {
                  const sla = slaPendencia(e.dataCriacao)
                  return (
                    <tr key={e.id} className={`sla-row sla-row-${sla.nivel}`}>
                      <td><span className="badge badge-logistica">{nomeFilial(e.filial)}</span></td>
                      <td><span className="plate">{e.placa || '-'}</span><br /><small>NF {e.nf || '-'} {e.cte ? `· CT-e ${e.cte}` : ''}</small><br /><TempoPendente data={e.dataCriacao} compacto /></td>
                      <td><SlaBadge data={e.dataCriacao} /></td>
                      <td>{e.motivo || '-'}<br /><small>{e.localEstadia || ''}</small></td>
                      <td>{e.valorCalculado || '-'}<br /><small>{e.horasPagar ? `${e.horasPagar}h a pagar` : ''}</small></td>
                      <td><span className={`prio ${classePrio(e.prioridade)}`}>{e.prioridade || 'Normal'}</span></td>
                      <td>{e.anexos?.length ? e.anexos.map((a, i) => <a key={i} className="anexo-link" href={a.url} target="_blank" rel="noopener noreferrer">Arquivo {i + 1}</a>) : '-'}</td>
                      <td>{e.obs || '-'}</td>
                      <td>{e.criadoPor || '-'}<br /><small>{e.dataCriacao || ''}</small></td>
                      <td><TempoPendente data={e.dataCriacao} /></td>
                      <td><span className="status status-lancar">{e.statusControle || e.status || 'A lançar'}</span></td>
                      <td><div className="actions"><button className="btn-green btn-small" onClick={() => abrirParaLancar(e.id)}>Lançar</button><button className="btn-red btn-small" onClick={() => handleArquivar(e)}>Arquivar</button></div></td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
