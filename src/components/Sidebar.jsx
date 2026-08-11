import { useAuthContext, useCloudContext, useEstadiaContext, useUiContext } from '../context/hooks'
import { podeAdministrar } from '../utils/roles'
import AyresLogo from './AyresLogo'

const ICONS = {
  inicio: '⌂',
  lancadas: '+',
  consultaLancadas: '▤',
  finalizadas: '✓',
  alancar: '!',
  embarque: '▦',
  captacao: '☎',
  captacaoAdmin: '◎',
  historico: '◷',
  relatorios: '▥',
  backup: '⇩',
  lixeira: '⌫',
  admin: '⚙',
}

const OPERACAO = [
  { id: 'inicio', label: 'Dashboard' },
  { id: 'lancadas', label: 'Lançar estadia' },
  { id: 'consultaLancadas', label: 'Estadias lançadas' },
  { id: 'finalizadas', label: 'Finalizadas' },
  { id: 'alancar', label: 'Pendências' },
  { id: 'embarque', label: 'Controle de embarque' },
]

const OPERADOR_GRUPOS = [{ titulo: 'Operação', itens: OPERACAO }]
const ADMIN_GRUPOS = [
  { titulo: 'Operação', itens: OPERACAO },
  { titulo: 'Comercial', itens: [{ id: 'captacaoAdmin', label: 'Captação geral' }, { id: 'captacao', label: 'Captação rápida' }] },
  { titulo: 'Gestão', itens: [{ id: 'relatorios', label: 'Relatórios' }, { id: 'historico', label: 'Histórico' }, { id: 'lixeira', label: 'Lixeira' }, { id: 'backup', label: 'Backup' }, { id: 'admin', label: 'Usuários e cargos' }] },
]

const CloudIcon = ({ status }) => {
  if (status === 'online') return <span style={{ color: '#22c55e' }}>●</span>
  if (status === 'syncing') return <span style={{ color: '#60a5fa' }}>●</span>
  return <span style={{ color: '#f87171' }}>●</span>
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
