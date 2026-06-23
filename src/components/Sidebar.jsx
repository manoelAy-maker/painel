import { useAuthContext, useCloudContext, useEstadiaContext, useUiContext } from '../context/hooks'
import { podeAdministrar } from '../utils/roles'
import AyresLogo from './AyresLogo'

const Ic = ({ d, d2, size = 18, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d={d} />
    {d2 && <path d={d2} />}
  </svg>
)

const ICONS = {
  inicio:        <Ic d="M3 12l9-9 9 9" d2="M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9" />,
  lancadas:      <Ic d="M12 5v14M5 12h14" />,
  consultaLancadas: <Ic d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6" />,
  finalizadas: <Ic d="M9 12l2 2 4-4" d2="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  alancar:       <Ic d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M12 12h3M12 16h3M9 12h.01M9 16h.01" />,
  captacao:      <Ic d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" d2="M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  captacaoAdmin: <Ic d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z" d2="M12 15a3 3 0 100-6 3 3 0 000 6z" />,
  historico:     <Ic d="M12 8v4l3 3M12 22a10 10 0 110-20 10 10 0 010 20z" />,
  relatorios:    <Ic d="M18 20V10M12 20V4M6 20v-6" />,
  backup:        <Ic d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  lixeira:       <Ic d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />,
  admin:         <Ic d="M12 15a3 3 0 100-6 3 3 0 000 6z" d2="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />,
}

const OPERADOR_GRUPOS = [{ titulo: 'Operação', itens: [{ id: 'inicio', label: 'Dashboard' }, { id: 'lancadas', label: 'Lançar estadia' }, { id: 'consultaLancadas', label: 'Estadias lançadas' }, { id: 'finalizadas', label: 'Finalizadas' }, { id: 'alancar', label: 'Pendências' }] }]
const ADMIN_GRUPOS = [
  { titulo: 'Operação', itens: [{ id: 'inicio', label: 'Dashboard' }, { id: 'lancadas', label: 'Lançar estadia' }, { id: 'consultaLancadas', label: 'Estadias lançadas' }, { id: 'finalizadas', label: 'Finalizadas' }, { id: 'alancar', label: 'Pendências' }] },
  { titulo: 'Comercial', itens: [{ id: 'captacaoAdmin', label: 'Captação geral' }, { id: 'captacao', label: 'Captação rápida' }] },
  { titulo: 'Gestão', itens: [{ id: 'relatorios', label: 'Relatórios' }, { id: 'historico', label: 'Histórico' }, { id: 'lixeira', label: 'Lixeira' }, { id: 'backup', label: 'Backup' }, { id: 'admin', label: 'Usuários e cargos' }] },
]

const CloudIcon = ({ status }) => {
  if (status === 'online') return <Ic size={14} d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" style={{ color: '#22c55e' }} />
  if (status === 'syncing') return <Ic size={14} d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" style={{ color: '#60a5fa' }} />
  return <Ic size={14} d="M17 17H17.01M3 3l18 18M13.73 13.73A6 6 0 0118 18H5.5A4.5 4.5 0 018 9.27M9.63 5.64A8 8 0 0120 15.4" style={{ color: '#f87171' }} />
}

export default function Sidebar({ onFechar }) {
  const { usuarioAtual } = useAuthContext()
  const { estadias, estadiasALancar } = useEstadiaContext()
  const { cloudStatus, cloudText } = useCloudContext()
  const { abaAtiva, mudarAba } = useUiContext()
  const isAdmin = podeAdministrar(usuarioAtual)
  const grupos = isAdmin ? ADMIN_GRUPOS : OPERADOR_GRUPOS

  const handleTab = (id) => { mudarAba(id); onFechar?.() }
  const filialLabel = (usuarioAtual?.filial || 'jatai-go').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())
  const hoje = new Date().toLocaleDateString('pt-BR')
  const lancadasHoje = (estadias || []).filter(e => String(e.dataLancamento || '').includes(hoje)).length
  const pendentes = (estadiasALancar || []).length
  const urgentes = (estadiasALancar || []).filter(e => e.prioridade === 'Urgente').length

  return (
    <aside className="sidebar-pro ayres-sidebar-v4" id="sidebarPro">
      <div className="brand-pro ayres-side-brand-v4 ayres-side-brand-compact">
        <div className="sidebar-logo-mark"><AyresLogo size={38} /></div>
        <div>
          <h1>AYRES</h1>
          <p>{filialLabel} · {usuarioAtual?.cargo || 'Operador'}</p>
        </div>
      </div>

      <nav className="sidebar-nav ayres-side-nav-v4">
        {grupos.map(grupo => (
          <div key={grupo.titulo} className="ayres-side-group-v4">
            <div className="sidebar-section-label">{grupo.titulo}</div>
            {grupo.itens.map(a => (
              <button key={a.id} className={`tab ${abaAtiva === a.id ? 'active' : ''}`} onClick={() => handleTab(a.id)}>
                <span className="tab-icon">{ICONS[a.id]}</span>
                <span className="tab-label">{a.label}</span>
                {a.id === 'alancar' && pendentes > 0 && <span className="pending-badge">{pendentes}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="ayres-sidebar-today">
        <div className="sidebar-section-label">Hoje</div>
        <div className="ayres-today-grid">
          <div><strong>{lancadasHoje}</strong><span>Lançadas</span></div>
          <div><strong>{pendentes}</strong><span>Pendentes</span></div>
          <div><strong>{urgentes}</strong><span>Urgentes</span></div>
        </div>
      </div>

      <div className="sidebar-status ayres-side-status-v4">
        <div className="sidebar-card ayres-cloud-card-compact">
          <div className="sidebar-card-title"><CloudIcon status={cloudStatus} /><span>{cloudStatus === 'online' ? 'Nuvem online' : cloudStatus === 'syncing' ? 'Sincronizando' : 'Offline'}</span></div>
          <small>{cloudText}</small>
        </div>
        <div className="sidebar-user-card ayres-user-card-compact">
          <div className="avatar" style={{ width: 38, height: 38, fontSize: 14, flexShrink: 0 }}>{usuarioAtual?.avatar || '?'}</div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div className="sidebar-user-name">{usuarioAtual?.nome || 'Usuário'}</div>
            <div className="sidebar-user-role">{usuarioAtual?.cargo || ''} · {filialLabel}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
