import { useState } from 'react'
import { useAuthContext, useEstadiaContext, useUiContext } from '../context/hooks'
import NotificationBell from './NotificationBell'
import ConfigModal from './modals/ConfigModal'
import PerfilUsuarioModal from './modals/PerfilUsuarioModal'
import '../topbar-profile-pro.css'
import '../topbar-clean-v2.css'

const Icon = ({ children }) => <span aria-hidden="true">{children}</span>

export default function Header({ onMenuMobile }) {
  const { usuarioAtual, logout } = useAuthContext()
  const { estadiasALancar } = useEstadiaContext()
  const { alternarTema, tema } = useUiContext()
  const [showConfig, setShowConfig] = useState(false)
  const [showPerfil, setShowPerfil] = useState(false)

  const voltarAoPortal = () => {
    localStorage.removeItem('moduloInicialViaLog')
    window.dispatchEvent(new Event('ayres:modulo'))
  }

  return (
    <>
      <header className="topbar ayres-topbar-pro clean-topbar">
        <div className="topbar-inner ayres-topbar-inner-pro">
          <div className="ayres-topbar-left-pro">
            <button className="btn-light mobile-menu-btn" onClick={onMenuMobile} title="Abrir menu">
              <Icon>☰</Icon>
            </button>
            <div className="ayres-topbar-brand-pro">
              <strong>AYRES</strong>
              <span>{usuarioAtual?.filial || 'jatai-go'} · {usuarioAtual?.cargo || 'Operador'}</span>
            </div>
          </div>

          <div className="top-actions ayres-topbar-actions-pro">
            <button className="btn-light ayres-topbar-btn-pro" onClick={voltarAoPortal} title="Voltar ao portal">
              <Icon>⌂</Icon>
              <span>Portal</span>
            </button>

            <NotificationBell />

            <button className="btn-light ayres-icon-btn-pro" onClick={alternarTema} title="Alternar tema">
              <Icon>{tema === 'dark' ? '☀' : '◐'}</Icon>
            </button>

            <button className="profile-pill profile-action ayres-profile-pro" onClick={() => setShowPerfil(true)} title="Editar meu perfil">
              <div className="avatar user-photo">{usuarioAtual?.foto ? <img src={usuarioAtual.foto} alt="Perfil" /> : (usuarioAtual?.avatar || '?')}</div>
              <span className="profile-text"><span>{usuarioAtual?.nome?.split(' ')[0] || 'Usuário'}</span><small>Perfil</small></span>
              {estadiasALancar.length > 0 && <span className="pending-badge">{estadiasALancar.length}</span>}
            </button>

            <button className="btn-light ayres-icon-btn-pro" onClick={() => setShowConfig(true)} title="Configurações">
              <Icon>⚙</Icon>
            </button>

            <button className="btn-light ayres-icon-btn-pro danger" onClick={logout} title="Sair">
              <Icon>⇥</Icon>
            </button>
          </div>
        </div>
      </header>

      <ConfigModal show={showConfig} onClose={() => setShowConfig(false)} />
      <PerfilUsuarioModal show={showPerfil} onClose={() => setShowPerfil(false)} />
    </>
  )
}
