import { lazy, Suspense, useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import AyresLogo from './AyresLogo'

const PerfilUsuarioModal = lazy(() => import('./modals/PerfilUsuarioModal'))
const UserSettingsModal = lazy(() => import('./UserSettingsModal'))

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
      { id: 'estadia', nome: 'Estadias', subtitulo: 'Pendências, lançamentos, anexos e finalizações em um só lugar.', icon: 'grid', aba: 'consultaLancadas', etiqueta: 'Operação', bullets: ['Em andamento', 'Pendências', 'Finalizadas'] },
      { id: 'relatorios', nome: 'Relatórios', subtitulo: 'Filtre a operação e gere os arquivos que você precisa.', icon: 'report', aba: 'relatorios', etiqueta: 'Exportação', bullets: ['Excel', 'PDF', 'Filtros'] },
    ],
    adminModulos: [{ id: 'admin', nome: 'Usuários', subtitulo: 'Cadastre funcionários e gerencie os acessos ao sistema.', icon: 'users', aba: 'admin', etiqueta: 'Administração', bullets: ['Cadastrar', 'Permissões', 'Filiais'], admin: true }],
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
      { id: 'estadia', nome: 'Stay Control', subtitulo: 'Pending items, records, attachments and completions in one place.', icon: 'grid', aba: 'consultaLancadas', etiqueta: 'Operations', bullets: ['In progress', 'Pending', 'Finished'] },
      { id: 'relatorios', nome: 'Reports', subtitulo: 'Filter the operation and generate the files you need.', icon: 'report', aba: 'relatorios', etiqueta: 'Export', bullets: ['Excel', 'PDF', 'Filters'] },
    ],
    adminModulos: [],
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
  const isAdmin = usuarioAtual?.cargo === 'Admin'
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
    localStorage.setItem('moduloInicialViaLog', modulo.id === 'admin' ? 'estadia' : modulo.id)
    mudarAba(modulo.aba)
    window.dispatchEvent(new Event('ayres:modulo'))
  }

  const sair = () => {
    localStorage.removeItem('moduloInicialViaLog')
    logout()
  }

  return (
    <div className={`ayres-portal ${isAdmin ? 'ayres-portal--admin' : ''}`}>
      <div className="ayres-portal__shell">
        <header className="ayres-portal__header">
          <div className="ayres-portal__brand">
            <div className="ayres-portal__logo"><AyresLogo size={44} /></div>
            <div>
              <h1>AYRES</h1>
              <p>{isAdmin ? 'Administração' : t.marca}</p>
            </div>
          </div>

            <div className="ayres-portal__userbar">
              <div className="ayres-portal__userpill">{ICONES.user}<span>{usuarioAtual?.nome || usuarioAtual?.usuario}</span></div>
              <button type="button" className="ayres-portal__settings" onClick={() => setShowConfig(true)} title="Configurações">{ICONES.settings}<span>{t.config}</span></button>
              <button type="button" className="ayres-portal__exit" onClick={sair}>{ICONES.logout}<span>{t.logout}</span></button>
          </div>
        </header>

        <main className="ayres-portal__main">
          <section className={`ayres-portal__hero ${isAdmin ? 'ayres-portal__hero--admin' : ''} ${pronto ? 'is-ready' : ''}`}>
            <div className="ayres-portal__copy">
              <div className="ayres-portal__chip">{ICONES.shield}<span>{isAdmin ? 'Acesso Admin' : filialLabel}</span></div>
              <h2>{t.saudacao}, <span>{primeiroNome}</span></h2>
              <p>{isAdmin ? t.adminEscolher : t.escolher}</p>
              <div className={`ayres-portal__note ${isAdmin ? 'ayres-portal__note--admin' : ''}`}><strong>↳</strong><span>{isAdmin ? t.notaAdmin : t.notaComum}</span></div>
            </div>

            <div className={`ayres-portal__modules ${isAdmin ? 'ayres-portal__modules--admin' : ''}`} aria-label="Módulos do sistema">
              {modulosPortal.map((modulo) => (
                <button
                  key={modulo.id}
                  type="button"
                  className={`ayres-portal__module ayres-portal__module--${modulo.id} ${modulo.admin ? 'ayres-portal__module--admin' : ''}`}
                  onClick={() => acessar(modulo)}
                  onMouseMove={moverGlow}
                >
                  <span className="ayres-portal__module-icon">{ICONES[modulo.icon]}</span>
                  <span className="ayres-portal__module-copy">
                    <span className="ayres-portal__module-top"><span className="ayres-portal__tag">{modulo.etiqueta}</span></span>
                    <span className="ayres-portal__module-title">{t.painel} <strong>{modulo.nome}</strong></span>
                    <span className="ayres-portal__module-description">{modulo.subtitulo}</span>
                    <span className="ayres-portal__bullets">{modulo.bullets.map((bullet) => <span key={bullet}>{bullet}</span>)}</span>
                  </span>
                  <span className="ayres-portal__module-action" aria-hidden="true">{ICONES.arrowRight}</span>
                </button>
              ))}
            </div>
          </section>
        </main>

        <footer className="ayres-portal__footer">{t.sessao} <span>{t.sair}</span>.</footer>
      </div>
      {showPerfil && <Suspense fallback={null}><PerfilUsuarioModal show onClose={() => setShowPerfil(false)} /></Suspense>}
      {showConfig && <Suspense fallback={null}><UserSettingsModal show onClose={() => setShowConfig(false)} onOpenPerfil={() => { setShowConfig(false); setShowPerfil(true) }} /></Suspense>}
    </div>
  )
}
