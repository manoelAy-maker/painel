import { useState } from 'react'
import { useApp } from '../context/AppContext'
import NotificationBell from './NotificationBell'
import ConfigModal from './modals/ConfigModal'
import CommandPalette from './modals/CommandPalette'
import PerfilUsuarioModal from './modals/PerfilUsuarioModal'
import '../topbar-profile-pro.css'

export default function Header({ onMenuMobile }) {
  const { cloudStatus, cloudText, usuarioAtual, estadiasALancar, alternarTema, tema, logout, conectarSupabase } = useApp()
  const [showConfig, setShowConfig] = useState(false)
  const [showCommand, setShowCommand] = useState(false)
  const [showPerfil, setShowPerfil] = useState(false)

  const voltarAoPortal = () => {
    localStorage.removeItem('moduloInicialViaLog')
    window.location.reload()
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-light mobile-menu-btn" onClick={onMenuMobile} style={{ padding: '10px 12px' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1>AYRES</h1>
              <p>Estadias, pendências e nuvem em tempo real</p>
            </div>
          </div>

          <div className="top-actions">
            <span className="topbar-profile-label">{usuarioAtual?.cargo || 'Operador'} · {usuarioAtual?.filial || 'jatai-go'}</span>

            <div className={`cloud-mini ${cloudStatus}`} onClick={conectarSupabase} style={{ cursor: 'pointer' }} title={cloudText}>
              <span className={`cloud-dot ${cloudStatus === 'online' ? 'online' : cloudStatus === 'syncing' ? 'syncing' : ''}`} />
              <div>
                <strong>{cloudStatus === 'online' ? 'Online' : cloudStatus === 'syncing' ? 'Sync...' : 'Offline'}</strong>
                <small>{cloudText?.slice(0, 28)}{cloudText?.length > 28 ? '…' : ''}</small>
              </div>
            </div>

            <button className="btn-light" onClick={voltarAoPortal} title="Voltar ao portal de módulos" style={{ fontSize: 12, gap: 6 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9-7v18m-7-9h18" /></svg>
              <span>Portal</span>
            </button>

            <NotificationBell />

            <button className="btn-light sound-toggle on" title="Som premium sempre ativo" data-sound="off">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 6v12m0-12L8 9H5a1 1 0 00-1 1v4a1 1 0 001 1h3l4 3V6z" />
              </svg>
            </button>

            <button className="btn-light" onClick={() => setShowConfig(true)} title="Configurações">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>

            <button className="btn-light" onClick={alternarTema} title="Alternar tema">
              {tema === 'dark' ? (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            <button className="btn-light" onClick={() => setShowCommand(true)} title="Paleta de comandos (Ctrl+K)" style={{ fontSize: 12, gap: 4 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <span>Busca</span>
            </button>

            <button className="profile-pill profile-action" onClick={() => setShowPerfil(true)} title="Editar meu perfil">
              <div className="avatar user-photo">{usuarioAtual?.foto ? <img src={usuarioAtual.foto} alt="Perfil" /> : (usuarioAtual?.avatar || '?')}</div>
              <span className="profile-text"><span>{usuarioAtual?.nome?.split(' ')[0] || 'Usuário'}</span><small>Editar perfil</small></span>
              {estadiasALancar.length > 0 && <span className="pending-badge">{estadiasALancar.length}</span>}
            </button>

            <button className="btn-light" onClick={logout} title="Sair" style={{ color: '#dc2626' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <ConfigModal show={showConfig} onClose={() => setShowConfig(false)} />
      <CommandPalette show={showCommand} onClose={() => setShowCommand(false)} />
      <PerfilUsuarioModal show={showPerfil} onClose={() => setShowPerfil(false)} />
    </>
  )
}