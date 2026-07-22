import { useRef, useState, useEffect, lazy, Suspense } from 'react'
import { useApp } from './context/AppContext'
import { podeAdministrar } from './utils/roles'
import { Login, SelecaoPainel } from './modules/portal'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LivePanel from './components/LivePanel'
import Toast from './components/Toast'
import SoundManager from './components/SoundManager'
import Dashboard from './pages/Dashboard'
import EstadiaTicker from './components/EstadiaTicker'
import './styles/app.css'
import './cargo-options-runtime.js'
import './login-dark-restore.css'
import './styles/ayres-design-system.css'
import './styles/ayres-estadia-form-clean.css'
import './captacao-aggressive.css'
import './captacao-logo-real.css'
import './estadia-contrast.css'
import './captacao-crm-premium.css'
import './styles/professional-system.css'
import './styles/captacao-lite-fixes.css'
import './styles/captacao-stable.css'
import './styles/notification-rail.css'
import './styles/estadia-ticker.css'
import './styles/captacao-header-match.css'
import './styles/db-command-center.css'
import './styles/users-isolated.css'

const EstadiaLancada = lazy(() => import('./modules/estadia/pages/EstadiaLancada'))
const ConsultaEstadiasLancadas = lazy(() => import('./pages/ConsultaEstadiasLancadas'))
const EstadiaALancar = lazy(() => import('./modules/estadia/pages/EstadiaALancar'))
const Captacao = lazy(() => import('./modules/captacao/pages/Captacao'))
const CaptacaoAdmin = lazy(() => import('./modules/captacao/pages/CaptacaoAdmin'))
const Historico = lazy(() => import('./modules/admin/pages/Historico'))
const Relatorios = lazy(() => import('./modules/admin/pages/Relatorios'))
const Backup = lazy(() => import('./modules/admin/pages/Backup'))
const Admin = lazy(() => import('./modules/admin/pages/Admin'))
const Lixeira = lazy(() => import('./modules/admin/pages/Lixeira'))

const FastFallback = () => null

function isApkMobileMode() {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('app') === 'mobile') return true
    if (window.Capacitor?.isNativePlatform?.()) return true
    if (window.Capacitor) return true
  } catch {}
  return false
}

function AppMobileOperacional() {
  const { usuarioAtual, logout } = useApp()
  const [aba, setAba] = useState('captacao')
  const formALancarRef = useRef()
  const sair = () => { localStorage.removeItem('moduloInicialViaLog'); logout() }
  return (
    <div className="ayres-mobile-apk">
      <header className="ayres-mobile-head"><div className="ayres-mobile-head-row"><div className="ayres-mobile-brand"><div className="ayres-mobile-logo">A</div><div><strong>AYRES Mobile</strong><span>{aba === 'captacao' ? 'Captação rápida' : 'Lançar pendência'}</span></div></div><div className="ayres-mobile-user"><span>{usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'}</span><button className="ayres-mobile-logout" onClick={sair}>Sair</button></div></div></header>
      <main className="ayres-mobile-content"><Suspense fallback={<FastFallback />}>{aba === 'captacao' && <section className="ayres-mobile-panel"><Captacao /></section>}{aba === 'pendencia' && <section className="ayres-mobile-panel"><EstadiaALancar formRef={formALancarRef} /></section>}</Suspense></main>
      <nav className="ayres-mobile-bottom"><button className={`ayres-mobile-tab ${aba === 'captacao' ? 'active' : ''}`} onClick={() => setAba('captacao')}><i>📞</i><span>Captação</span></button><button className={`ayres-mobile-tab ${aba === 'pendencia' ? 'active' : ''}`} onClick={() => setAba('pendencia')}><i>📝</i><span>Pendência</span></button></nav>
    </div>
  )
}

function ModuloIsolado({ onPortal }) {
  const { usuarioAtual, logout } = useApp()
  const sair = () => { localStorage.removeItem('moduloInicialViaLog'); logout() }
  const voltarAoPortal = () => { localStorage.removeItem('moduloInicialViaLog'); onPortal?.() }
  return (
    <div className="app capture-shell-pro" style={{ display: 'block' }}>
      <main className="capture-main-pro">
        <Header />
        <section className="capture-topbar-pro">
          <div className="capture-title-pro"><div className="capture-eyebrow-pro">Central operacional</div><h1>Painel de Captação</h1><p>Ambiente separado para registrar motoristas e acompanhar a operação.</p></div>
          <div className="capture-actions-pro"><span className="capture-user-chip-pro">{usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'}</span><button className="capture-action-btn-pro" onClick={voltarAoPortal}>Voltar ao portal</button><button className="capture-action-btn-pro" onClick={sair}>Sair</button></div>
        </section>
        <section className="capture-panel-wrap-pro"><Suspense fallback={<FastFallback />}><Captacao /></Suspense></section>
        <div className="capture-footer-pro">AYRES · Central de captação</div>
      </main>
    </div>
  )
}

function UsuariosIsolado({ onPortal }) {
  const { usuarioAtual, logout } = useApp()
  const sair = () => { localStorage.removeItem('moduloInicialViaLog'); logout() }
  const voltarAoPortal = () => { localStorage.removeItem('moduloInicialViaLog'); onPortal?.() }
  return (
    <div className="users-isolated-shell">
      <main className="users-isolated-main">
        <section className="users-isolated-topbar">
          <div className="users-isolated-title"><span>Administração</span><h1>Usuários e cargos</h1><p>Módulo isolado para criar colaboradores, ajustar cargos e manter filiais. Sem menu lateral e sem outras áreas do painel.</p></div>
          <div className="users-isolated-actions"><span className="users-isolated-user">{usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'}</span><button className="users-isolated-btn" onClick={voltarAoPortal}>Voltar ao portal</button><button className="users-isolated-btn danger" onClick={sair}>Sair</button></div>
        </section>
        <section className="users-isolated-content"><Suspense fallback={<FastFallback />}><Admin /></Suspense></section>
      </main>
    </div>
  )
}

function AdminModuloIsolado({ tipo, onPortal }) {
  const { usuarioAtual, logout } = useApp()
  const sair = () => { localStorage.removeItem('moduloInicialViaLog'); logout() }
  const voltarAoPortal = () => { localStorage.removeItem('moduloInicialViaLog'); onPortal?.() }
  const isRelatorio = tipo === 'relatorios'
  const titulo = isRelatorio ? 'Relatórios' : 'Dashboard'
  const subtitulo = isRelatorio
    ? 'Módulo isolado para consultar relatórios, filtros e exportações. Sem menu lateral e sem outras áreas do painel.'
    : 'Módulo isolado para acompanhar indicadores e visão geral. Sem menu lateral e sem atalhos para outras áreas.'

  return (
    <div className={`users-isolated-shell ${isRelatorio ? 'relatorios-only-shell' : 'dashboard-only-shell'}`}>
      <main className="users-isolated-main admin-only-main">
        <section className="users-isolated-topbar">
          <div className="users-isolated-title"><span>Administração</span><h1>{titulo}</h1><p>{subtitulo}</p></div>
          <div className="users-isolated-actions"><span className="users-isolated-user">{usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'}</span><button className="users-isolated-btn" onClick={voltarAoPortal}>Voltar ao portal</button><button className="users-isolated-btn danger" onClick={sair}>Sair</button></div>
        </section>
        <section className={`users-isolated-content ${isRelatorio ? 'relatorios-isolated-content' : 'dashboard-isolated-content'}`}>
          <Suspense fallback={<FastFallback />}>
            {isRelatorio ? <Relatorios /> : <Dashboard />}
          </Suspense>
        </section>
      </main>
    </div>
  )
}

function PainelEstadia() {
  const { abaAtiva, mudarAba, usuarioAtual } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const formLancadaRef = useRef()
  const formALancarRef = useRef()
  const isAdmin = podeAdministrar(usuarioAtual)
  const abaProtegida = ['historico', 'relatorios', 'backup', 'admin', 'captacaoAdmin', 'lixeira'].includes(abaAtiva)
  const abaRender = !isAdmin && abaProtegida ? 'inicio' : abaAtiva
  useEffect(() => { document.body.classList.toggle('sidebar-open', sidebarOpen); return () => document.body.classList.remove('sidebar-open') }, [sidebarOpen])
  const focarLancada = () => { mudarAba('lancadas'); setTimeout(() => formLancadaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }
  const focarALancar = () => { mudarAba('alancar'); setTimeout(() => formALancarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }
  useEffect(() => { if (!isAdmin && abaProtegida) mudarAba('inicio') }, [isAdmin, abaProtegida, mudarAba])
  return (
    <div className="app" style={{ display: 'block' }}>
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}
      <div className="app-layout"><Sidebar onFechar={() => setSidebarOpen(false)} /><section className="main-pro"><Header onMenuMobile={() => setSidebarOpen(v => !v)} /><main className="container"><EstadiaTicker /><LivePanel />{abaRender === 'inicio' && <Dashboard onNovaLancada={focarLancada} onNovaPendencia={focarALancar} />}<Suspense fallback={<FastFallback />}>{abaRender === 'lancadas' && <EstadiaLancada formRef={formLancadaRef} />}{abaRender === 'consultaLancadas' && <ConsultaEstadiasLancadas visaoInicial="andamento" />}{abaRender === 'finalizadas' && <ConsultaEstadiasLancadas visaoInicial="finalizadas" />}{abaRender === 'alancar' && <EstadiaALancar formRef={formALancarRef} />}{abaRender === 'captacao' && <Captacao />}{isAdmin && abaRender === 'captacaoAdmin' && <CaptacaoAdmin />}{isAdmin && abaRender === 'historico' && <Historico />}{isAdmin && abaRender === 'relatorios' && <Relatorios />}{isAdmin && abaRender === 'lixeira' && <Lixeira />}{isAdmin && abaRender === 'backup' && <Backup />}{isAdmin && abaRender === 'admin' && <Admin />}</Suspense><div className="footer">by Manoel</div></main></section></div>
    </div>
  )
}

export default function App() {
  const { usuarioAtual } = useApp()
  const [moduloInicial, setModuloInicial] = useState(() => localStorage.getItem('moduloInicialViaLog'))
  const mobileApk = isApkMobileMode()
  const isAdmin = podeAdministrar(usuarioAtual)
  useEffect(() => { const syncModulo = () => setModuloInicial(localStorage.getItem('moduloInicialViaLog')); window.addEventListener('storage', syncModulo); window.addEventListener('ayres:modulo', syncModulo); return () => { window.removeEventListener('storage', syncModulo); window.removeEventListener('ayres:modulo', syncModulo) } }, [])
  const voltarAoPortal = () => { localStorage.removeItem('moduloInicialViaLog'); setModuloInicial(null) }
  return <><SoundManager />{!usuarioAtual && <Login />}{usuarioAtual && mobileApk && <AppMobileOperacional />}{usuarioAtual && !mobileApk && !moduloInicial && <SelecaoPainel />}{usuarioAtual && !mobileApk && moduloInicial === 'captacao' && <ModuloIsolado onPortal={voltarAoPortal} />}{usuarioAtual && !mobileApk && isAdmin && moduloInicial === 'usuarios-admin' && <UsuariosIsolado onPortal={voltarAoPortal} />}{usuarioAtual && !mobileApk && isAdmin && moduloInicial === 'dashboard-admin' && <AdminModuloIsolado tipo="dashboard" onPortal={voltarAoPortal} />}{usuarioAtual && !mobileApk && isAdmin && moduloInicial === 'relatorios-admin' && <AdminModuloIsolado tipo="relatorios" onPortal={voltarAoPortal} />}{usuarioAtual && !mobileApk && moduloInicial && moduloInicial !== 'captacao' && moduloInicial !== 'usuarios-admin' && moduloInicial !== 'dashboard-admin' && moduloInicial !== 'relatorios-admin' && <PainelEstadia />}<Toast /></>
}
