import { useState } from 'react'
import { useAuthContext, useEstadiaContext, useUiContext } from '../context/hooks'
import NotificationBell from './NotificationBell'
import PerfilUsuarioModal from './modals/PerfilUsuarioModal'
import '../topbar-profile-pro.css'
import '../topbar-clean-v2.css'

const Ic = ({ d, d2, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
    {d2 && <path d={d2} />}
  </svg>
)

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const cargoVisivel = (cargo) => cargo === 'Operador' || !cargo ? 'Analista Júnior' : cargo

const TITULOS = {
  inicio: ['Dashboard', 'Resumo da operação'],
  lancadas: ['Estadias lançadas', 'Controle de lançamentos e anexos'],
  consultaLancadas: ['Consulta de estadias', 'Busca e acompanhamento de registros'],
  alancar: ['Pendências', 'Itens aguardando lançamento'],
  captacao: ['Captação', 'Motoristas, leads e próximas ações'],
  captacaoAdmin: ['Captação geral', 'Motoristas, leads e motivos'],
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

  const alternarMenuLateral = () => {
    try {
      if (window.matchMedia('(min-width: 1101px)').matches) {
        document.body.classList.toggle('sidebar-open')
        return
      }
    } catch {}

    onMenuMobile?.()
  }

  return (
    <>
      <header className="topbar ayres-topbar-pro clean-topbar ayres-header-v4">
        <div className="topbar-inner ayres-topbar-inner-pro ayres-header-inner-v4">
          <div className="ayres-header-left-v4">
            <button className="topbar-menu-btn" onClick={alternarMenuLateral} title="Abrir ou fechar menu">
              <MenuIcon />
            </button>
            <div className="ayres-topbar-logo-pro">A</div>
            <div className="ayres-header-title-v4">
              <strong>{titulo}</strong>
              <span>{subtitulo}</span>
            </div>
          </div>

          <div className="ayres-header-search-v4">
            <SearchIcon />
            <span>Buscar placa, motorista ou NF…</span>
            <kbd>⌘K</kbd>
          </div>

          <div className="top-actions ayres-topbar-actions-pro ayres-header-actions-v4">
            <NotificationBell />

            <div className="ayres-user-menu-wrap-v4">
              <button
                className="topbar-profile-btn ayres-user-menu-btn-v4"
                onClick={() => setMenuOpen(v => !v)}
                title="Menu do usuário"
              >
                <div className="topbar-user-photo">
                  {usuarioAtual?.foto
                    ? <img src={usuarioAtual.foto} alt="Perfil" />
                    : (usuarioAtual?.avatar || '?')}
                </div>
                <span className="topbar-user-text">
                  <strong>{usuarioAtual?.nome?.split(' ')[0] || 'Usuário'}</strong>
                  <small>{cargoVisivel(usuarioAtual?.cargo)}</small>
                </span>
                {estadiasALancar.length > 0 && (
                  <span className="pending-badge">{estadiasALancar.length}</span>
                )}
                <ChevronIcon />
              </button>

              {menuOpen && (
                <div className="ayres-user-dropdown-v4">
                  <div className="ayres-user-dropdown-head-v4">
                    <strong>{usuarioAtual?.nome || 'Usuário'}</strong>
                    <span>{usuarioAtual?.filial || 'jatai-go'} · {cargoVisivel(usuarioAtual?.cargo)}</span>
                  </div>
                  <button onClick={() => { setMenuOpen(false); setShowPerfil(true) }}>
                    <Ic size={14} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" d2="M12 11a4 4 0 100-8 4 4 0 000 8z" />
                    Meu perfil
                  </button>
                  <button onClick={voltarAoPortal}>
                    <Ic size={14} d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                    Voltar ao portal
                  </button>
                  <button className="danger" onClick={sair}>
                    <Ic size={14} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    Sair
                  </button>
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
