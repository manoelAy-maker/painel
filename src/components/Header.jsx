import { useState } from 'react'
import { useAuthContext, useEstadiaContext } from '../context/hooks'
import NotificationBell from './NotificationBell'
import PerfilUsuarioModal from './modals/PerfilUsuarioModal'
import '../topbar-profile-pro.css'
import '../topbar-clean-v2.css'

const Icon = ({ children }) => <span aria-hidden="true">{children}</span>
const cargoVisivel = (cargo) => cargo === 'Operador' || !cargo ? 'Analista Júnior' : cargo

export default function Header({ onMenuMobile }) {
  const { usuarioAtual, logout } = useAuthContext()
  const { estadiasALancar } = useEstadiaContext()
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
            <button className="topbar-menu-btn" onClick={onMenuMobile} title="Abrir menu">
              <Icon>☰</Icon>
            </button>
            <div className="ayres-topbar-logo-pro">A</div>
            <div className="ayres-topbar-brand-pro">
              <strong>AYRES</strong>
              <span>{usuarioAtual?.filial || 'jatai-go'} · {cargoVisivel(usuarioAtual?.cargo)}</span>
            </div>
          </div>

          <div className="top-actions ayres-topbar-actions-pro">
            <button className="topbar-link-btn" onClick={voltarAoPortal} title="Voltar ao portal">
              <Icon>⌂</Icon>
              <span>Portal</span>
            </button>

            <NotificationBell />

            <button className="topbar-profile-btn" onClick={() => setShowPerfil(true)} title="Editar meu perfil">
              <div className="topbar-user-photo">{usuarioAtual?.foto ? <img src={usuarioAtual.foto} alt="Perfil" /> : (usuarioAtual?.avatar || '?')}</div>
              <span className="topbar-user-text"><strong>{usuarioAtual?.nome?.split(' ')[0] || 'Usuário'}</strong><small>Perfil</small></span>
              {estadiasALancar.length > 0 && <span className="pending-badge">{estadiasALancar.length}</span>}
            </button>

            <button className="topbar-exit-btn" onClick={logout} title="Sair">
              <Icon>⇥</Icon>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <PerfilUsuarioModal show={showPerfil} onClose={() => setShowPerfil(false)} />
    </>
  )
}
