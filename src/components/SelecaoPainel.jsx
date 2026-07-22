import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { podeAdministrar } from '../utils/roles'
import AyresLogo from './AyresLogo'
import PerfilUsuarioModal from './modals/PerfilUsuarioModal'
import UserSettingsModal from './UserSettingsModal'
import '../styles/portal-zero.css'
import '../styles/portal-admin.css'

const Svg = ({ children, ...p }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
)

const ICONES = {
  grid: <Svg><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></Svg>,
  chart: <Svg><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19h-20" /></Svg>,
  arrowRight: <Svg width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" /></Svg>,
  logout: <Svg width="16" height="16"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></Svg>,
  shield: <Svg width="16" height="16"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" /></Svg>,
  user: <Svg width="16" height="16"><path d="M20 21a8 8 0 10-16 0" /><circle cx="12" cy="7" r="4" /></Svg>,
  truck: <Svg><path d="M10 17h4V5H2v12h3m0 0a2 2 0 104 0m-4 0a2 2 0 104 0m5 0a2 2 0 104 0m-4 0a2 2 0 104 0m3-3V7l4 2v5h-4z" /></Svg>,
  dashboard: <Svg><path d="M4 13h6V5H4v8z" /><path d="M14 19h6V5h-6v14z" /><path d="M4 19h6v-3H4v3z" /></Svg>,
  users: <Svg><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></Svg>,
  report: <Svg><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /><path d="M9 7h7" /><path d="M9 11h7" /></Svg>,
  settings: <Svg width="16" height="16"><path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1 .6l-.1.1a2 2 0 01-3.8-1v-.1a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-.6-1l-.1-.1a2 2 0 011-3.8h.1a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6c.39-.16.72-.42 1-.76l.1-.1a2 2 0 013.8 1v.1a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.16.39.42.72.76 1l.1.1a2 2 0 01-1 3.8h-.1a1.65 1.65 0 00-1.51 1z" /></Svg>,
}

const TRADUCOES = {
  pt: {
    marca: 'Operações',
    saudacao: 'Olá',
    escolher: 'Escolha onde quer trabalhar agora. Cada área abre separada, limpa e sem poluir sua operação.',
    adminEscolher: 'Você está com acesso Admin. Além dos módulos operacionais, use os atalhos de gestão sem precisar caçar no menu lateral.',
    entrar: 'Abrir módulo',
    sessao: 'Sua sessão continua ativa até clicar em',
    sair: 'Sair',
    logout: 'Sair',
    config: 'Config',
    painel: 'Painel de',
    notaComum: 'Acesso separado por módulo para manter a operação limpa e rápida.',
    notaAdmin: 'Portal administrativo liberado: usuários, relatórios e dashboard ficam em cartões próprios.',
    modulos: [
      { id: 'estadia', nome: 'Estadia', subtitulo: 'Pendências, lançamentos, anexos e finalizações em um só lugar.', icon: 'grid', cor: 'blue', aba: 'inicio', etiqueta: 'Operação', bullets: ['Estadias', 'Pendências', 'Relatórios'] },
      { id: 'captacao', nome: 'Captação', subtitulo: 'Motoristas, contatos, cargas captadas e acompanhamento comercial.', icon: 'chart', cor: 'orange', aba: 'captacao', etiqueta: 'Comercial', bullets: ['Motoristas', 'Contatos', 'Ranking'] },
      { id: 'embarque', nome: 'Embarque', subtitulo: 'Controle de cargas, fretes, veículos e localização da operação.', icon: 'truck', cor: 'emerald', aba: 'embarque', etiqueta: 'Logística', bullets: ['Localização', 'Fretes', 'Cargas'] },
    ],
    adminModulos: [
      { id: 'dashboard-admin', nome: 'Dashboard', subtitulo: 'Visão geral da operação, indicadores e atalhos principais.', icon: 'dashboard', cor: 'cyan', aba: 'inicio', etiqueta: 'Admin', bullets: ['Resumo', 'Indicadores', 'Visão geral'], admin: true },
      { id: 'usuarios-admin', nome: 'Usuários', subtitulo: 'Adicionar usuários, trocar cargos, ajustar filial e revisar acessos.', icon: 'users', cor: 'purple', aba: 'admin', etiqueta: 'Admin', bullets: ['Adicionar', 'Cargos', 'Filiais'], admin: true },
      { id: 'relatorios-admin', nome: 'Relatórios', subtitulo: 'Consultar relatórios, filtros e histórico administrativo.', icon: 'report', cor: 'rose', aba: 'relatorios', etiqueta: 'Admin', bullets: ['Filtros', 'Exportar', 'Histórico'], admin: true },
    ],
  },
  en: {
    marca: 'Operations',
    saudacao: 'Hello',
    escolher: 'Choose where you want to work now. Each area opens cleanly and separately.',
    adminEscolher: 'You have Admin access. Management shortcuts appear here alongside operational modules.',
    entrar: 'Open module',
    sessao: 'Your session remains active until you click',
    sair: 'Sign out',
    logout: 'Sign out',
    config: 'Settings',
    painel: 'Panel',
    notaComum: 'Separate access by module keeps the operation clean and fast.',
    notaAdmin: 'Admin portal enabled: users, reports and dashboard have their own cards.',
    modulos: [
      { id: 'estadia', nome: 'Stay Control', subtitulo: 'Pending items, records, attachments and completions in one place.', icon: 'grid', cor: 'blue', aba: 'inicio', etiqueta: 'Operations', bullets: ['Records', 'Pending', 'Reports'] },
      { id: 'captacao', nome: 'Capture', subtitulo: 'Drivers, contacts, captured loads and commercial follow-up.', icon: 'chart', cor: 'orange', aba: 'captacao', etiqueta: 'Commercial', bullets: ['Drivers', 'Contacts', 'Ranking'] },
      { id: 'embarque', nome: 'Shipment', subtitulo: 'Load control, freight, vehicles and operation location.', icon: 'truck', cor: 'emerald', aba: 'embarque', etiqueta: 'Logistics', bullets: ['Location', 'Freight', 'Loads'] },
    ],
    adminModulos: [
      { id: 'dashboard-admin', nome: 'Dashboard', subtitulo: 'Operational overview, indicators and main shortcuts.', icon: 'dashboard', cor: 'cyan', aba: 'inicio', etiqueta: 'Admin', bullets: ['Summary', 'Indicators', 'Overview'], admin: true },
      { id: 'usuarios-admin', nome: 'Users', subtitulo: 'Add users, change roles, adjust branches and review access.', icon: 'users', cor: 'purple', aba: 'admin', etiqueta: 'Admin', bullets: ['Add', 'Roles', 'Branches'], admin: true },
      { id: 'relatorios-admin', nome: 'Reports', subtitulo: 'View reports, filters and administrative history.', icon: 'report', cor: 'rose', aba: 'relatorios', etiqueta: 'Admin', bullets: ['Filters', 'Export', 'History'], admin: true },
    ],
  },
}

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout } = useApp()
  const [pronto, setPronto] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [showPerfil, setShowPerfil] = useState(false)
  const idioma = localStorage.getItem('idiomaAyres') || 'pt'
  const t = TRADUCOES[idioma] || TRADUCOES.pt
  const primeiroNome = usuarioAtual?.nome?.split(' ')[0] || usuarioAtual?.usuario || 'usuário'
  const filialLabel = usuarioAtual?.filial === 'oleo' ? 'Operação do Óleo' : (usuarioAtual?.filial || 'jatai-go')
  const isAdmin = podeAdministrar(usuarioAtual)
  const modulosPortal = isAdmin ? [...t.modulos, ...t.adminModulos] : t.modulos

  useEffect(() => {
    const timer = setTimeout(() => setPronto(true), 40)
    return () => clearTimeout(timer)
  }, [])

  const moverGlow = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
  }

  const acessar = (modulo) => {
    if (modulo.id === 'embarque') {
      window.location.href = '/controle-embarques.html'
      return
    }

    localStorage.setItem('moduloInicialViaLog', modulo.id)
    mudarAba(modulo.aba)
    window.dispatchEvent(new Event('ayres:modulo'))
  }

  const sair = () => {
    localStorage.removeItem('moduloInicialViaLog')
    logout()
  }

  return (
    <div className={`portal-zero ${isAdmin ? 'admin-access' : ''}`}>
      <div className="portal-zero-shell">
        <header className="portal-zero-header">
          <div className="portal-zero-brand">
            <div className="portal-zero-logo"><AyresLogo size={44} /></div>
            <div>
              <h1>AYRES</h1>
              <p>{isAdmin ? 'Administração' : t.marca}</p>
            </div>
          </div>

          <div className="portal-zero-userbar">
            <div className="portal-zero-userpill">{ICONES.user}<span>{usuarioAtual?.nome || usuarioAtual?.usuario}</span></div>
            <button type="button" className="settings-trigger-btn portal-config-btn" onClick={() => setShowConfig(true)} title="Configurações">{ICONES.settings}<span>{t.config}</span></button>
            <button type="button" className="portal-zero-exit" onClick={sair}>{ICONES.logout}<span>{t.logout}</span></button>
          </div>
        </header>

        <main className="portal-zero-main">
          <section className={`portal-zero-hero ${isAdmin ? 'admin-access' : ''} ${pronto ? 'ready' : ''}`}>
            <div className="portal-zero-copy">
              <div className="portal-zero-chip">{ICONES.shield}<span>{isAdmin ? 'Acesso Admin' : filialLabel}</span></div>
              <h2>{t.saudacao}, <span>{primeiroNome}</span></h2>
              <p>{isAdmin ? t.adminEscolher : t.escolher}</p>
              <div className={`portal-zero-note ${isAdmin ? 'admin-note' : ''}`}><strong>↳</strong><span>{isAdmin ? t.notaAdmin : t.notaComum}</span></div>
            </div>

            <div className={`portal-zero-modules ${isAdmin ? 'admin-list' : ''}`} aria-label="Módulos do sistema">
              {modulosPortal.map((modulo) => (
                <button
                  key={modulo.id}
                  type="button"
                  className={`portal-zero-card ${modulo.cor} ${modulo.admin ? 'admin-card' : ''}`}
                  onClick={() => acessar(modulo)}
                  onMouseMove={moverGlow}
                >
                  <span className="portal-zero-icon">{ICONES[modulo.icon]}</span>
                  <span className="portal-zero-card-text">
                    <span className="portal-zero-card-top"><span className="portal-zero-tag">{modulo.etiqueta}</span></span>
                    <h3>{t.painel} <span>{modulo.nome}</span></h3>
                    <p>{modulo.subtitulo}</p>
                    <span className="portal-zero-bullets">{modulo.bullets.map((bullet) => <span key={bullet}>{bullet}</span>)}</span>
                  </span>
                  <span className="portal-zero-action" aria-hidden="true">{ICONES.arrowRight}</span>
                </button>
              ))}
            </div>
          </section>
        </main>

        <footer className="portal-zero-footer">{t.sessao} <span>{t.sair}</span>.</footer>
      </div>
      <PerfilUsuarioModal show={showPerfil} onClose={() => setShowPerfil(false)} />
      <UserSettingsModal show={showConfig} onClose={() => setShowConfig(false)} onOpenPerfil={() => setShowPerfil(true)} />
    </div>
  )
}
