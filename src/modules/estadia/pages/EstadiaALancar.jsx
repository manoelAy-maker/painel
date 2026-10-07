import { useMemo, useState } from 'react'
import { useApp } from '../../../context/AppContext'
import DropZone from '../../../components/DropZone'
import { nomeFilial } from '../../../data/filiais'
import { tempoDecorrido, slaPendencia } from '../../../utils/index'
import { arquivarEstadiaALancar } from '../../../lib/ayresSafety'
import '../../../styles/pendencias-pro.css'

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

function SlaBadge({ nivel, label }) {
  return <span className={`sla-badge sla-${nivel}`}>{label}</span>
}

function CloudBadge({ status }) {
  const cls = status === 'online' ? 'online' : status === 'syncing' ? 'syncing' : 'offline'
  const label = status === 'online' ? 'Supabase online' : status === 'syncing' ? 'Sincronizando' : 'Nuvem offline'
  const icon = status === 'online' ? '🟢' : status === 'syncing' ? '🔄' : '🟠'
  return <span className={`cloud-pill ${cls}`}>{icon} {label}</span>
}

export default function EstadiaALancar({ formRef }) {
  const {
    estadiasALancar,
    adicionarALancar,
    abrirParaLancar,
    removerALancarLocal,
    filiais,
    usuarioAtual,
    toast,
    cloudStatus,
    cloudText,
    ultimoSave,
    baixarNuvem,
    conectarSupabase,
  } = useApp()

  const filialPadrao = usuarioAtual?.filial || 'jatai-go'
  const [form, setForm] = useState(criarFormVazio(filialPadrao))
  const [arquivos, setArquivos] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [processandoId, setProcessandoId] = useState(null)
  const [atualizando, setAtualizando] = useState(false)
  const isAdmin = usuarioAtual?.cargo === 'Admin'

  const { lista, criticas, urgentes, comAnexo } = useMemo(() => {
    const base = isAdmin
      ? estadiasALancar
      : estadiasALancar.filter(e => (e.filial || 'jatai-go') === filialPadrao)

    const enriquecida = base
      .map(item => ({ ...item, _sla: slaPendencia(item.dataCriacao) }))
      .sort((a, b) => b._sla.ordem - a._sla.ordem)

    return enriquecida.reduce((acc, item) => {
      acc.lista.push(item)
      if (item._sla.nivel === 'critico') acc.criticas += 1
      if (item._sla.nivel === 'urgente') acc.urgentes += 1
      if (item.anexos?.length) acc.comAnexo += 1
      return acc
    }, { lista: [], criticas: 0, urgentes: 0, comAnexo: 0 })
  }, [estadiasALancar, isAdmin, filialPadrao])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const atualizarDaNuvem = async () => {
    if (atualizando) return
    setAtualizando(true)
    try {
      // Uma única leitura. conectarSupabase já faz download quando chamado, então não encadeamos os dois.
      await baixarNuvem?.(true)
    } finally {
      setAtualizando(false)
    }
  }

  const handleSalvar = async () => {
    if (salvando) return
    if (!form.filial) { toast?.('Escolha a filial que vai lançar.', 'err'); return }
    if (!form.placa.trim()) { toast?.('Preencha a placa.', 'err'); return }

    setSalvando(true)
    try {
      await adicionarALancar({
        ...form,
        placa: form.placa.trim().toUpperCase(),
      }, arquivos)
      setForm(criarFormVazio(filialPadrao))
      setArquivos([])
    } catch (err) {
      toast?.(`Erro ao salvar pendência: ${err?.message || 'verifique o Supabase.'}`, 'err')
    } finally {
      setSalvando(false)
    }
  }

  const handleArquivar = async (item) => {
    if (processandoId) return
    if (!confirm(`Excluir/arquivar a pendência da placa ${item.placa || '-'}? Ela sai da tela e fica salva na Lixeira.`)) return
    setProcessandoId(item.id)
    try {
      // ayresSafety já arquiva e remove da nuvem. Aqui removemos apenas da memória para não disparar um segundo DELETE.
      await arquivarEstadiaALancar(item, usuarioAtual?.usuario || '-', 'Pendência arquivada pela tela A lançar')
      removerALancarLocal(item.id)
      toast?.('Pendência excluída da tela e salva na Lixeira.', 'ok')
    } catch (err) {
      toast?.(`Não consegui excluir a pendência: ${err?.message || 'verifique o Supabase/Lixeira.'}`, 'err')
    } finally {
      setProcessandoId(null)
    }
  }

  const handleAbrirParaLancar = async (id) => {
    if (processandoId) return
    setProcessandoId(id)
    try {
      await abrirParaLancar(id)
    } finally {
      setProcessandoId(null)
    }
  }

  return (
    <section className="aba active pendencias-pro" id="abaALancar">
      {(criticas > 0 || urgentes > 0) && (
        <div className={`sla-alert ${criticas > 0 ? 'critico' : 'urgente'}`}>
          <strong>{criticas > 0 ? 'Atenção crítica' : 'Atenção operacional'}</strong>
          <span>{criticas} crítica(s) e {urgentes} urgente(s) aguardando tratamento. As mais antigas ficam no topo.</span>
        </div>
      )}

      <section className="pendencias-hero">
        <div className="pendencias-card">
          <div className="pendencias-title">
            <div>
              <h2>Lançar pendência</h2>
              <span>Envie uma placa para a filial tratar depois, com anexo e SLA automático.</span>
            </div>
            <CloudBadge status={cloudStatus} />
          </div>

          <div className="pendencias-kpis">
            <div className="pendencias-kpi"><span>Pendências</span><strong>{lista.length}</strong></div>
            <div className="pendencias-kpi warn"><span>Urgentes</span><strong>{urgentes}</strong></div>
            <div className="pendencias-kpi danger"><span>Críticas</span><strong>{criticas}</strong></div>
          </div>
        </div>

        <div className="pendencias-card pendencias-cloud-box">
          <div className="pendencias-title">
            <div>
              <h2>Banco Supabase</h2>
              <span>{cloudText || 'Verificando conexão com a nuvem.'}</span>
            </div>
          </div>
          <p>Último salvamento: <strong>{ultimoSave || 'ainda não registrado nesta sessão'}</strong></p>
          <p>Anexos em pendências visíveis: <strong>{comAnexo}</strong></p>
          <div className="pendencias-cloud-actions">
            <button type="button" onClick={atualizarDaNuvem} disabled={atualizando}>{atualizando ? 'Atualizando...' : 'Atualizar da nuvem'}</button>
            <button type="button" onClick={() => conectarSupabase?.()}>Reconectar Supabase</button>
          </div>
        </div>
      </section>

      <div className="box pendencias-form" ref={formRef}>
        <div className="box-title">
          <h2>Nova pendência</h2>
          <span>Campos mínimos: filial e placa. O restante ajuda quem vai lançar depois.</span>
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

        <button type="button" className="btn-purple btn-full" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando no painel...' : 'Enviar para filial lançar'}
        </button>
      </div>

      <div className="pendencias-list-head">
        <div>
          <h3>Pendências a lançar</h3>
          <p>{lista.length} pendência(s) visível(is) para {isAdmin ? 'todas as filiais' : nomeFilial(filialPadrao)}.</p>
        </div>
        <button type="button" className="pendencia-refresh" onClick={atualizarDaNuvem} disabled={atualizando}>↻ {atualizando ? 'Atualizando' : 'Atualizar'}</button>
      </div>

      <div className="table-wrap pendencias-table">
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
                : lista.map(item => {
                  const processando = String(processandoId) === String(item.id)
                  return (
                    <tr key={item.id} className={`sla-row sla-row-${item._sla.nivel}`}>
                      <td><span className="badge badge-logistica">{nomeFilial(item.filial)}</span></td>
                      <td><span className="plate">{item.placa || '-'}</span><br /><small>{item.transportadora || '-'}</small><br /><TempoPendente data={item.dataCriacao} compacto /></td>
                      <td><SlaBadge nivel={item._sla.nivel} label={item._sla.label} /></td>
                      <td><span className={`prio ${classePrio(item.prioridade)}`}>{item.prioridade || 'Normal'}</span></td>
                      <td>{item.anexos?.length ? item.anexos.map((a, i) => <a key={i} className="anexo-link" href={a.url} target="_blank" rel="noopener noreferrer">Arquivo {i + 1}</a>) : '-'}</td>
                      <td>{item.obs || '-'}</td>
                      <td>{item.criadoPor || '-'}<br /><small>{item.dataCriacao || ''}</small></td>
                      <td><TempoPendente data={item.dataCriacao} /></td>
                      <td><span className="status status-lancar">{item.status || 'A lançar'}</span></td>
                      <td>
                        <div className="pendencia-acoes">
                          <button className="btn-green btn-small" disabled={processando} onClick={() => handleAbrirParaLancar(item.id)}>{processando ? 'Abrindo...' : 'Lançar'}</button>
                          <button className="btn-red btn-small" disabled={processando} onClick={() => handleArquivar(item)}>{processando ? 'Excluindo...' : 'Excluir'}</button>
                        </div>
                      </td>
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
