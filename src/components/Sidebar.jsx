import { useApp } from '../context/AppContext'

const Svg = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)

const icons = {
  inicio: <Svg><path d="M4 10.5 12 4l8 6.5" /><path d="M6.5 10v9h11v-9" /><path d="M10 19v-5h4v5" /></Svg>,
  lancadas: <Svg><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 8 7.5 4.2L19.5 8" /><path d="M12 12.2V21" /></Svg>,
  alancar: <Svg><path d="M8 4h8" /><path d="M9 2h6v4H9z" /><path d="M6 5h12v16H6z" /><path d="M9 11h6" /><path d="M9 15h4" /></Svg>,
  captacaoAdmin: <Svg><path d="M4 18V6" /><path d="M4 18h16" /><path d="M8 15v-4" /><path d="M12 15V8" /><path d="M16 15v-6" /><path d="M7 5h10" /></Svg>,
  historico: <Svg><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></Svg>,
  relatorios: <Svg><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-7" /></Svg>,
  backup: <Svg><path d="M7 18a4 4 0 0 1-.8-7.9A5.5 5.5 0 0 1 17 8a4.5 4.5 0 0 1 .5 9" /><path d="M12 12v8" /><path d="m9 17 3 3 3-3" /></Svg>,
  lixeira: <Svg><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" /></Svg>,
  admin: <Svg><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2.1 2.1 0 1 1-2.97 2.97l-.05-.05a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.08 1.65V21.3a2.1 2.1 0 0 1-4.2 0v-.08a1.8 1.8 0 0 0-1.08-1.65 1.8 1.8 0 0 0-1.98.36l-.05.05a2.1 2.1 0 1 1-2.97-2.97l.05-.05A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.65-1.08H2.87a2.1 2.1 0 0 1 0-4.2h.08A1.8 1.8 0 0 0 4.6 8.64a1.8 1.8 0 0 0-.36-1.98l-.05-.05a2.1 2.1 0 1 1 2.97-2.97l.05.05A1.8 1.8 0 0 0 9.2 4.05 1.8 1.8 0 0 0 10.27 2.4V2.32a2.1 2.1 0 0 1 4.2 0v.08a1.8 1.8 0 0 0 1.08 1.65 1.8 1.8 0 0 0 1.98-.36l.05-.05a2.1 2.1 0 1 1 2.97 2.97l-.05.05a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.65 1.08h.08a2.1 2.1 0 0 1 0 4.2h-.08A1.8 1.8 0 0 0 19.4 15Z" /></Svg>,
}

const OPERADOR_ABAS = [
  { id: 'inicio', label: 'Início', group: 'main' },
  { id: 'lancadas', label: 'Lançar estadia', group: 'main' },
  { id: 'alancar', label: 'Colocar pendência', group: 'main' },
]

const ADMIN_ABAS = [
  { id: 'inicio', label: 'Dashboard', group: 'main' },
  { id: 'lancadas', label: 'Estadias lançadas', group: 'main' },
  { id: 'alancar', label: 'A lançar', group: 'main' },
  { id: 'captacaoAdmin', label: 'Captação Admin', group: 'extra' },
  { id: 'historico', label: 'Histórico', group: 'extra' },
  { id: 'relatorios', label: 'Relatórios', group: 'extra' },
  { id: 'lixeira', label: 'Lixeira', group: 'extra' },
  { id: 'backup', label: 'Backup', group: 'extra' },
]

export default function Sidebar({ onFechar }) {
  const { abaAtiva, mudarAba, estadiasALancar, cloudStatus, cloudText, usuarioAtual, filiais } = useApp()
  const isAdmin = usuarioAtual?.cargo === 'Admin'
  const abas = isAdmin ? ADMIN_ABAS : OPERADOR_ABAS
  const spaces = isAdmin ? filiais : filiais.filter(f => f.id === (usuarioAtual?.filial || 'jatai-go'))

  const handleTab = (id) => {
    mudarAba(id)
    onFechar?.()
  }

  const mainAbas = abas.filter(a => a.group === 'main')
  const extraAbas = abas.filter(a => a.group === 'extra')

  return (
    <aside className="sidebar-pro" id="sidebarPro">
      <div className="brand-pro">
        <div className="brand-mark-pro" />
        <div><h1>AYRES</h1><p>{isAdmin ? 'Workspace logístico' : 'Operação de estadia'}</p></div>
      </div>

      <div className="clickup-space-block">
        <div className="clickup-space-title"><span>Spaces</span><span>{spaces.length}</span></div>
        <div className="clickup-space-list">
          {spaces.map((f, i) => (
            <button key={f.id} type="button" className="clickup-space-item" onClick={() => handleTab('inicio')}>
              <span className="clickup-space-dot" style={{ background: i % 2 ? 'linear-gradient(135deg,#f97316,#facc15)' : 'linear-gradient(135deg,#3b82f6,#7c3aed)' }} />
              <span className="clickup-space-name">{f.nome}</span>
            </button>
          ))}
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Listas</div>
        {mainAbas.map(a => (
          <button key={a.id} className={`tab ${abaAtiva === a.id ? 'active' : ''}`} onClick={() => handleTab(a.id)}>
            <span className="tab-icon">{icons[a.id]}</span>
            <span className="tab-label">{a.label}</span>
            {a.id === 'alancar' && estadiasALancar.length > 0 && <span className="pending-badge">{estadiasALancar.length}</span>}
          </button>
        ))}

        {isAdmin && extraAbas.length > 0 && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">Views e relatórios</div>
            {extraAbas.map(a => (
              <button key={a.id} className={`tab ${abaAtiva === a.id ? 'active' : ''}`} onClick={() => handleTab(a.id)}>
                <span className="tab-icon">{icons[a.id]}</span>
                <span className="tab-label">{a.label}</span>
              </button>
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">Administração</div>
            <button className={`tab ${abaAtiva === 'admin' ? 'active' : ''}`} onClick={() => handleTab('admin')}>
              <span className="tab-icon">{icons.admin}</span>
              <span className="tab-label">Painel Admin</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-status">
        <div className="sidebar-mini-card"><strong>{isAdmin ? 'Central administrativa' : 'Operação simplificada'}</strong><span>{isAdmin ? 'Relatórios, usuários, pendências e visão geral.' : 'Lance estadias ou envie pendências para lançamento.'}</span></div>
        <div className="sidebar-card"><div className="sidebar-card-title"><span className={`cloud-dot ${cloudStatus === 'online' ? 'online' : cloudStatus === 'syncing' ? 'syncing' : ''}`} /><span>{cloudStatus === 'online' ? 'Nuvem online' : cloudStatus === 'syncing' ? 'Sincronizando' : 'Offline'}</span></div><small>{cloudText}</small></div>
        <div className="sidebar-user-card"><div className="avatar" style={{ width: 40, height: 40, fontSize: 13, flexShrink: 0 }}>{usuarioAtual?.avatar || '?'}</div><div style={{ overflow: 'hidden' }}><div className="sidebar-user-name">{usuarioAtual?.nome || 'Usuário'}</div><div className="sidebar-user-role">{usuarioAtual?.cargo || ''}</div></div></div>
      </div>
    </aside>
  )
}
