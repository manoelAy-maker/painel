import { useAuthContext, useCloudContext, useEstadiaContext, useUiContext } from '../context/hooks'
import { podeAdministrar } from '../utils/roles'

const icons = {
  inicio: '⌂',
  lancadas: '▣',
  alancar: '▤',
  captacaoAdmin: '▥',
  historico: '↺',
  relatorios: '▦',
  backup: '⇩',
  lixeira: '⌫',
  admin: '⚙',
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
  const { usuarioAtual, filiais } = useAuthContext()
  const { estadiasALancar } = useEstadiaContext()
  const { cloudStatus, cloudText } = useCloudContext()
  const { abaAtiva, mudarAba } = useUiContext()
  const isAdmin = podeAdministrar(usuarioAtual)
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
