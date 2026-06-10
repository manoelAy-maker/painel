import { useCloudContext, useEstadiaContext, useUiContext } from '../context/hooks'
import { slaPendencia, tempoDecorrido } from '../utils/index'

export default function LivePanel() {
  const { usuariosOnline, activityFeed } = useCloudContext()
  const { estadiasALancar } = useEstadiaContext()
  const { mudarAba } = useUiContext()

  const pendenciasCriticas = estadiasALancar
    .map(p => ({ ...p, sla: slaPendencia(p.dataCriacao) }))
    .filter(p => ['critico', 'urgente'].includes(p.sla.nivel))
    .sort((a, b) => b.sla.ordem - a.sla.ordem)
    .slice(0, 4)

  return (
    <section className="live-dashboard live-command-center">
      <div className="live-card">
        <div className="live-head">
          <div>
            <h2>Usuarios online</h2>
            <p>Quem esta com o painel aberto agora</p>
          </div>
          <span className="live-count">{usuariosOnline.length}</span>
        </div>
        <div className="online-list">
          {usuariosOnline.length === 0
            ? <div className="online-user-pill"><div className="online-user-left"><span className="avatar mini">?</span><div><strong>Ninguem online</strong><small>Aguardando presenca.</small></div></div></div>
            : usuariosOnline.map(u => (
              <div key={u.usuario} className="online-user-pill">
                <div className="online-user-left"><span className="avatar mini">{u.avatar || u.usuario.slice(0, 2).toUpperCase()}</span><div><strong>{u.nome || u.usuario}</strong><small>{u.cargo || 'Operador'}</small></div></div>
                <span className="online-status" />
              </div>
            ))}
        </div>
      </div>

      <div className="live-card activity-command-card">
        <div className="live-head">
          <div>
            <h2>Central de atividades</h2>
            <p>Ultimas acoes e alertas operacionais</p>
          </div>
          <button className="btn-light btn-small" onClick={() => mudarAba('alancar')}>Ver fila</button>
        </div>

        {pendenciasCriticas.length > 0 && (
          <div className="live-alert-list">
            {pendenciasCriticas.map(p => (
              <div key={p.id} className={`live-sla-alert live-sla-${p.sla.nivel}`}>
                <strong>{p.placa || 'Sem placa'} - {p.sla.label}</strong>
                <span>{tempoDecorrido(p.dataCriacao)} aguardando - {p.obs || 'Sem observacao'}</span>
              </div>
            ))}
          </div>
        )}

        <div className="activity-feed">
          {activityFeed.length === 0
            ? <div className="feed-item"><div className="feed-icon">-</div><div><strong>Aguardando acoes</strong><span>Nenhuma alteracao recente.</span></div></div>
            : activityFeed.map((i, idx) => (
              <div key={idx} className="feed-item">
                <div className="feed-icon">{i.icone}</div>
                <div><strong>{i.titulo}</strong><span>{i.texto}<br />{i.tempo}</span></div>
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}
