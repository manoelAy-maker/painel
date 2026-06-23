import { useState } from 'react'
import { useApp } from '../context/AppContext'
import DropZone from '../components/DropZone'
import { nomeFilial } from '../data/filiais'
import { tempoDecorrido, slaPendencia } from '../utils/index'
import { arquivarEstadiaALancar } from '../lib/ayresSafety'

const criarFormVazio = (filial = 'jatai-go') => ({
  filial,
  placa: '',
  transportadora: '',
  prioridade: 'Normal',
  obs: '',
})

function classePrio(p) {
  if (p === 'Urgente') return 'prio-urgente'
  if (p === 'Alta' || p === 'Média') return 'prio-media'
  return 'prio-normal'
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

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSalvar = async () => {
    if (!form.filial) { alert('Escolha a filial que vai lançar.'); return }
    if (!form.placa.trim()) { alert('Preencha a placa.'); return }

    await adicionarALancar({
      ...form,
      placa: form.placa.trim().toUpperCase(),
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
          <span>Envie uma pendência simples para a filial lançar depois.</span>
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Filial que vai lançar</label>
            <select value={form.filial} onChange={e => set('filial', e.target.value)}>
              {filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Placa</label>
            <input value={form.placa} onChange={e => set('placa', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))} placeholder="ABC1D23" />
          </div>

          <div className="field">
            <label>Transportadora</label>
            <input value={form.transportadora} onChange={e => set('transportadora', e.target.value)} placeholder="Ex: Via Log" />
          </div>

          <div className="field">
            <label>Prioridade</label>
            <select value={form.prioridade} onChange={e => set('prioridade', e.target.value)}>
              <option>Normal</option>
              <option>Alta</option>
              <option>Urgente</option>
            </select>
          </div>

          <div className="field wide">
            <label>Observação</label>
            <input value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Ex: motorista aguardando descarga, conferir documento, anexar comprovante..." />
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
                <th>Filial</th><th>Placa</th><th>SLA</th><th>Prioridade</th><th>Anexo</th><th>Observação</th><th>Criado por</th><th>Pendente há</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0
                ? <tr><td colSpan={10} className="empty">Nenhuma estadia a lançar para sua filial.</td></tr>
                : lista.map(e => {
                  const sla = slaPendencia(e.dataCriacao)
                  return (
                    <tr key={e.id} className={`sla-row sla-row-${sla.nivel}`}>
                      <td><span className="badge badge-logistica">{nomeFilial(e.filial)}</span></td>
                      <td><span className="plate">{e.placa || '-'}</span><br /><small>{e.transportadora || '-'}</small><br /><TempoPendente data={e.dataCriacao} compacto /></td>
                      <td><SlaBadge data={e.dataCriacao} /></td>
                      <td><span className={`prio ${classePrio(e.prioridade)}`}>{e.prioridade || 'Normal'}</span></td>
                      <td>{e.anexos?.length ? e.anexos.map((a, i) => <a key={i} className="anexo-link" href={a.url} target="_blank" rel="noopener noreferrer">Arquivo {i + 1}</a>) : '-'}</td>
                      <td>{e.obs || '-'}</td>
                      <td>{e.criadoPor || '-'}<br /><small>{e.dataCriacao || ''}</small></td>
                      <td><TempoPendente data={e.dataCriacao} /></td>
                      <td><span className="status status-lancar">{e.status || 'A lançar'}</span></td>
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
