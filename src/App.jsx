import { useRef, useState, useEffect, lazy, Suspense } from 'react'
import { useApp } from './context/AppContext'
import { podeAdministrar } from './utils/roles'
import Loader from './components/Loader'
import Login from './components/Login'
import SelecaoPainel from './components/SelecaoPainel'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LivePanel from './components/LivePanel'
import Toast from './components/Toast'
import SoundManager from './components/SoundManager'
import Dashboard from './pages/Dashboard'

const EstadiaLancada = lazy(() => import('./pages/EstadiaLancada'))
const EstadiaALancar = lazy(() => import('./pages/EstadiaALancar'))
const Captacao = lazy(() => import('./pages/Captacao'))
const CaptacaoAdmin = lazy(() => import('./pages/CaptacaoAdmin'))
const Historico = lazy(() => import('./pages/Historico'))
const Relatorios = lazy(() => import('./pages/Relatorios.jsx'))
const Backup = lazy(() => import('./pages/Backup'))
const Admin = lazy(() => import('./pages/Admin'))
const Lixeira = lazy(() => import('./pages/Lixeira'))
import './captacao-theme.css'
import './estadia-mobile.css'
import './pro-polish.css'
import './sidebar-reference.css'
import './tempo-estadia.css'
import './live-command.css'
import './admin-pro.css'
import './mobile-app-apk.css'
import './ayres-inner-minimal.css'
import './cargo-options-runtime.js'

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

  const sair = () => {
    localStorage.removeItem('moduloInicialViaLog')
    logout()
  }

  return (
    <div className="ayres-mobile-apk">
      <header className="ayres-mobile-head">
        <div className="ayres-mobile-head-row">
          <div className="ayres-mobile-brand">
            <div className="ayres-mobile-logo">A</div>
            <div>
              <strong>AYRES Mobile</strong>
              <span>{aba === 'captacao' ? 'Captação rápida' : 'Lançar pendência'}</span>
            </div>
          </div>
          <div className="ayres-mobile-user">
            <span>{usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'}</span>
            <button className="ayres-mobile-logout" onClick={sair}>Sair</button>
          </div>
        </div>
      </header>

      <main className="ayres-mobile-content">
        <Suspense fallback={<Loader />}>
          {aba === 'captacao' && <section className="ayres-mobile-panel"><Captacao /></section>}
          {aba === 'pendencia' && <section className="ayres-mobile-panel"><EstadiaALancar formRef={formALancarRef} /></section>}
        </Suspense>
      </main>

      <nav className="ayres-mobile-bottom">
        <button className={`ayres-mobile-tab ${aba === 'captacao' ? 'active' : ''}`} onClick={() => setAba('captacao')}>
          <i>📞</i>
          <span>Captação</span>
        </button>
        <button className={`ayres-mobile-tab ${aba === 'pendencia' ? 'active' : ''}`} onClick={() => setAba('pendencia')}>
          <i>📝</i>
          <span>Pendência</span>
        </button>
      </nav>
    </div>
  )
}

function CaptacaoIsolada() {
  const { usuarioAtual, logout } = useApp()

  const sair = () => {
    localStorage.removeItem('moduloInicialViaLog')
    logout()
  }

  const voltarAoPortal = () => {
    localStorage.removeItem('moduloInicialViaLog')
    window.location.reload()
  }

  return (
    <div className="app capture-shell-pro" style={{ display: 'block' }}>
      <main className="capture-main-pro">
        <section className="capture-topbar-pro">
          <div className="capture-title-pro">
            <div className="capture-eyebrow-pro">Central operacional</div>
            <h1>Painel de Captação</h1>
            <p>Ambiente separado para registrar motoristas, acompanhar evolução de contato, ordem e carregamento confirmado.</p>
          </div>
          <div className="capture-actions-pro">
            <span className="capture-user-chip-pro">{usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'}</span>
            <button className="capture-action-btn-pro" onClick={voltarAoPortal}>Voltar ao portal</button>
            <button className="capture-action-btn-pro" onClick={sair}>Sair</button>
          </div>
        </section>

        <section className="capture-panel-wrap-pro"><Suspense fallback={<Loader />}><Captacao /></Suspense></section>
        <div className="capture-footer-pro">AYRES · Central de captação</div>
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

  const focarLancada = () => {
    mudarAba('lancadas')
    setTimeout(() => formLancadaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const focarALancar = () => {
    mudarAba('alancar')
    setTimeout(() => formALancarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  useEffect(() => {
    if (!isAdmin && abaProtegida) mudarAba('inicio')
  }, [isAdmin, abaProtegida, mudarAba])

  return (
    <div className="app" style={{ display: 'block' }}>
      {sidebarOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 25, background: 'rgba(0,0,0,.4)' }} onClick={() => setSidebarOpen(false)} />}

      <div className={`app-layout`}>
        <div style={sidebarOpen ? { transform: 'translateX(0)' } : {}}><Sidebar onFechar={() => setSidebarOpen(false)} /></div>

        <section className="main-pro">
          <Header onMenuMobile={() => setSidebarOpen(true)} />
          <main className="container">
            <LivePanel />

            {abaRender === 'inicio' && <Dashboard onNovaLancada={focarLancada} onNovaPendencia={focarALancar} />}
            <Suspense fallback={<Loader />}>
              {abaRender === 'lancadas' && <EstadiaLancada formRef={formLancadaRef} />}
              {abaRender === 'alancar' && <EstadiaALancar formRef={formALancarRef} />}
              {isAdmin && abaRender === 'captacaoAdmin' && <CaptacaoAdmin />}
              {isAdmin && abaRender === 'historico' && <Historico />}
              {isAdmin && abaRender === 'relatorios' && <Relatorios />}
              {isAdmin && abaRender === 'lixeira' && <Lixeira />}
              {isAdmin && abaRender === 'backup' && <Backup />}
              {isAdmin && abaRender === 'admin' && <Admin />}
            </Suspense>

            <div className="footer">by Manoel</div>
          </main>
        </section>
      </div>
    </div>
  )
}

export default function App() {
  const { usuarioAtual } = useApp()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  if (loading) return <Loader />

  const moduloInicial = localStorage.getItem('moduloInicialViaLog')
  const mobileApk = isApkMobileMode()

  return (
    <>
      <SoundManager />
      {!usuarioAtual && <Login />}
      {usuarioAtual && mobileApk && <AppMobileOperacional />}
      {usuarioAtual && !mobileApk && !moduloInicial && <SelecaoPainel />}
      {usuarioAtual && !mobileApk && moduloInicial === 'captacao' && <CaptacaoIsolada />}
      {usuarioAtual && !mobileApk && moduloInicial && moduloInicial !== 'captacao' && <PainelEstadia />}
      <Toast />
    </>
  )
}
