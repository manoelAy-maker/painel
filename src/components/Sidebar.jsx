import { useAuthContext, useCloudContext, useEstadiaContext, useUiContext } from '../context/hooks'
import { podeAdministrar } from '../utils/roles'

const icons = {
  inicio: '⌂',
  lancadas: '＋',
  consultaLancadas: '▣',
  alancar: '▤',
  captacaoAdmin: '◉',
  historico: '↺',
  relatorios: '▦',
  backup: '⇩',
  lixeira: '⌫',
  admin: '⚙',
}

const OPERADOR_GRUPOS = [
  {
    titulo: 'Operação',
    itens: [
      { id: 'inicio', label: 'Dashboard' },
      { id: 'lancadas', label: 'Lançar estadia' },
      { id: 'consultaLancadas', label: 'Estadias lançadas' },
      { id: 'alancar', label: 'Pendências' },
    ],
  },
]

const ADMIN_GRUPOS = [
  {
    titulo: 'Operação',
    itens: [
      { id: 'inicio', label: 'Dashboard' },
      { id: 'lancadas', label: 'Lançar estadia' },
      { id: 'consultaLancadas', label: 'Estadias lançadas' },
      { id: 'alancar', label: 'Pendências' },
    ],
  },
  {
    titulo: 'Comercial',
    itens: [
      { id: 'captacaoAdmin', label: 'Captação' },
    ],
  },
  {
    titulo: 'Gestão',
    itens: [
      { id: 'relatorios', label: 'Relatórios' },
      { id: 'historico', label: 'Histórico' },
      { id: 'lixeira', label: 'Lixeira' },
      { id: 'backup', label: 'Backup' },
      { id: 'admin', label: 'Usuários e cargos' },
    ],
  },
]

export default function Sidebar({ onFechar }) {
  const { usuarioAtual } = useAuthContext()
  const { estadiasALancar } = useEstadiaContext()
  const { cloudStatus, cloudText } = useCloudContext()
  const { abaAtiva, mudarAba } = useUiContext()
  const isAdmin = podeAdministrar(usuarioAtual)
  const grupos = isAdmin ? ADMIN_GRUPOS : OPERADOR_GRUPOS

  const handleTab = (id) => {
    mudarAba(id)
    onFechar?.()
  }

  return (
    <aside className="sidebar-pro ayres-sidebar-v4" id="sidebarPro">
      <div className="brand-pro ayres-side-brand-v4">
        <div className="brand-mark-pro" />
        <div>
          <h1>AYRES</h1>
          <p>{usuarioAtual?.filial || 'jatai-go'} · {usuarioAtual?.cargo || 'Operador'}</p>
        </div>
      </div>

      <nav className="sidebar-nav ayres-side-nav-v4">
        {grupos.map(grupo => (
          <div key={grupo.titulo} className="ayres-side-group-v4">
            <div className="sidebar-section-label">{grupo.titulo}</div>
            {grupo.itens.map(a => (
              <button key={a.id} className={`tab ${abaAtiva === a.id ? 'active' : ''}`} onClick={() => handleTab(a.id)}>
                <span className="tab-icon">{icons[a.id]}</span>
                <span className="tab-label">{a.label}</span>
                {a.id === 'alancar' && estadiasALancar.length > 0 && <span className="pending-badge">{estadiasALancar.length}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-status ayres-side-status-v4">
        <div className="sidebar-card">
          <div className="sidebar-card-title">
            <span className={`cloud-dot ${cloudStatus === 'online' ? 'online' : cloudStatus === 'syncing' ? 'syncing' : ''}`} />
            <span>{cloudStatus === 'online' ? 'Nuvem online' : cloudStatus === 'syncing' ? 'Sincronizando' : 'Offline'}</span>
          </div>
          <small>{cloudText}</small>
        </div>
        <div className="sidebar-user-card">
          <div className="avatar" style={{ width: 40, height: 40, fontSize: 13, flexShrink: 0 }}>{usuarioAtual?.avatar || '?'}</div>
          <div style={{ overflow: 'hidden' }}>
            <div className="sidebar-user-name">{usuarioAtual?.nome || 'Usuário'}</div>
            <div className="sidebar-user-role">{usuarioAtual?.cargo || ''}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
