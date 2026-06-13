import { useState } from 'react'
import { useAuthContext, useEstadiaContext, useUiContext } from '../context/hooks'
import NotificationBell from './NotificationBell'
import PerfilUsuarioModal from './modals/PerfilUsuarioModal'
import '../topbar-profile-pro.css'
import '../topbar-clean-v2.css'

const Icon = ({ children }) => <span aria-hidden="true">{children}</span>
const cargoVisivel = (cargo) => cargo === 'Operador' || !cargo ? 'Analista Júnior' : cargo

const TITULOS = {
  inicio: ['Dashboard', 'Resumo da operação'],
  lancadas: ['Estadias lançadas', 'Controle de lançamentos e anexos'],
  alancar: ['Pendências', 'Itens aguardando lançamento'],
  captacaoAdmin: ['Captação', 'Motoristas, leads e motivos'],
  relatorios: ['Relatórios', 'Análises e exportações'],
  historico: ['Histórico', 'Eventos e alterações'],
  lixeira: ['Lixeira', 'Registros removidos'],
  backup: ['Backup', 'Cópia e recuperação'],
  admin: ['Usuários e cargos', 'Acessos do sistema'],
}

export default function Header({ onMenuMobile }) {
  const { usuarioAtual, logout } = useAuthContext()
  const { estadiasALancar } = useEstadiaContext()
  const { abaAtiva } = useUiContext()
  const [showPerfil, setShowPerfil] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [titulo, subtitulo] = TITULOS[abaAtiva] || ['AYRES', 'Central logística']

  const voltarAoPortal = () => {
    localStorage.removeItem('moduloInicialViaLog')
    window.dispatchEvent(new Event('ayres:modulo'))
  }

  const sair = () => {
    setMenuOpen(false)
    logout()
  }

  return (
    <>
      <header className="topbar ayres-topbar-pro clean-topbar ayres-header-v4">
        <div className="topbar-inner ayres-topbar-inner-pro ayres-header-inner-v4">
          <div className="ayres-header-left-v4">
            <button className="topbar-menu-btn" onClick={onMenuMobile} title="Abrir menu">
              <Icon>☰</Icon>
            </button>
            <div className="ayres-topbar-logo-pro">A</div>
            <div className="ayres-header-title-v4">
              <strong>{titulo}</strong>
              <span>{subtitulo}</span>
            </div>
          </div>

          <div className="ayres-header-search-v4">
            <Icon>⌕</Icon>
            <span>Buscar placa, motorista ou NF...</span>
          </div>

          <div className="top-actions ayres-topbar-actions-pro ayres-header-actions-v4">
            <NotificationBell />

            <div className="ayres-user-menu-wrap-v4">
              <button className="topbar-profile-btn ayres-user-menu-btn-v4" onClick={() => setMenuOpen(v => !v)} title="Menu do usuário">
                <div className="topbar-user-photo">{usuarioAtual?.foto ? <img src={usuarioAtual.foto} alt="Perfil" /> : (usuarioAtual?.avatar || '?')}</div>
                <span className="topbar-user-text"><strong>{usuarioAtual?.nome?.split(' ')[0] || 'Usuário'}</strong><small>{cargoVisivel(usuarioAtual?.cargo)}</small></span>
                {estadiasALancar.length > 0 && <span className="pending-badge">{estadiasALancar.length}</span>}
                <Icon>⌄</Icon>
              </button>

              {menuOpen && (
                <div className="ayres-user-dropdown-v4">
                  <div className="ayres-user-dropdown-head-v4">
                    <strong>{usuarioAtual?.nome || 'Usuário'}</strong>
                    <span>{usuarioAtual?.filial || 'jatai-go'} · {cargoVisivel(usuarioAtual?.cargo)}</span>
                  </div>
                  <button onClick={() => { setMenuOpen(false); setShowPerfil(true) }}>Meu perfil</button>
                  <button onClick={voltarAoPortal}>Voltar ao portal</button>
                  <button className="danger" onClick={sair}>Sair</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <PerfilUsuarioModal show={showPerfil} onClose={() => setShowPerfil(false)} />
    </>
  )
}