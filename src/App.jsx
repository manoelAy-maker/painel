import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useApp } from './context/AppContext'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LivePanel from './components/LivePanel'
import EstadiaTicker from './components/EstadiaTicker'
import Toast from './components/Toast'
import SoundManager from './components/SoundManager'
import { podeAdministrar } from './utils/roles'
import { ADMIN_ONLY_TABS } from './config/navigation'
import './styles/app.css'
import './login-dark-restore.css'
import './styles/ayres-estadia-form-clean.css'
import './estadia-contrast.css'
import './styles/professional-system.css'
import './styles/notification-rail.css'
import './styles/estadia-ticker.css'
import './styles/db-command-center.css'

const EstadiaLancada = lazy(() => import('./modules/estadia/pages/EstadiaLancada'))
const ConsultaEstadiasLancadas = lazy(() => import('./pages/ConsultaEstadiasLancadas'))
const EstadiasPlanilha = lazy(() => import('./pages/EstadiasPlanilha'))
const EstadiaALancar = lazy(() => import('./modules/estadia/pages/EstadiaALancar'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const SelecaoPainel = lazy(() => import('./components/SelecaoPainel'))
const Admin = lazy(() => import('./modules/admin/pages/Admin'))

const ABAS_VALIDAS = ['inicio', 'consultaLancadas', 'planilha', 'finalizadas', 'lancadas', 'alancar', 'admin']
const MODULOS_VALIDOS = ['estadia', 'relatorios']
const moduloSalvo = () => {
  const modulo = localStorage.getItem('moduloInicialViaLog') || ''
  if (modulo && !MODULOS_VALIDOS.includes(modulo)) {
    localStorage.removeItem('moduloInicialViaLog')
    return ''
  }
  return modulo
}

function FastFallback() {
  return <div role="status" aria-live="polite" style={{ minHeight: 110, display: 'grid', placeItems: 'center', opacity: .72, fontSize: 13 }}>Carregando módulo…</div>
}

function EstadiasHome({ onNovaLancada, onNovaPendencia }) {
  const { estadias = [], estadiasALancar = [], usuarioAtual, cloudStatus } = useApp()
  const emAndamento = estadias.filter(e => e.status !== 'Finalizado').length
  const finalizadas = estadias.filter(e => e.status === 'Finalizado').length
  const urgentes = estadiasALancar.filter(e => e.prioridade === 'Urgente').length
  const primeiroNome = (usuarioAtual?.nome || usuarioAtual?.usuario || 'Operador').split(' ')[0]

  return (
    <section className="aba active estadia-home">
      <div className="dashboard-hero">
        <div className="hero-pro-card">
          <span className="home-eyebrow"><i aria-hidden="true" />CENTRAL DE ESTADIAS</span>
          <h2>Olá, <span>{primeiroNome}.</span><br />Operação na mão.</h2>
          <p>Acompanhe suas estadias, resolva pendências e mantenha cada etapa da operação sob controle.</p>
          <div className="hero-actions">
            <button className="ay-primary-action" onClick={onNovaLancada}>+ Lançar estadia</button>
            <button className="ay-secondary-action" onClick={onNovaPendencia}>+ Criar pendência</button>
          </div>
          <span className="home-hero-note">Do primeiro registro à finalização. Tudo no mesmo lugar.</span>
        </div>
        <div className="hero-side-card">
          <div className="home-panel-heading"><h3>Resumo agora</h3><span className="home-live-label">Operação</span></div>
          <div className="system-health">
            <div className="health-row"><span>Em andamento</span><strong>{emAndamento}</strong></div>
            <div className="health-row"><span>Pendências</span><strong>{estadiasALancar.length}</strong></div>
            <div className="health-row"><span>Urgentes</span><strong>{urgentes}</strong></div>
            <div className="health-row"><span>Finalizadas</span><strong>{finalizadas}</strong></div>
            <div className="health-row"><span>Nuvem</span><strong className={`home-cloud ${cloudStatus === 'online' ? 'online' : ''}`}>{cloudStatus === 'online' ? 'Online' : cloudStatus === 'syncing' ? 'Sincronizando' : 'Offline'}</strong></div>
          </div>
        </div>
      </div>

      <div className="stats home-stats">
        <div className="stat-card"><span>Estadias registradas</span><strong>{estadias.length}</strong><small>Base operacional</small></div>
        <div className="stat-card"><span>Em andamento</span><strong>{emAndamento}</strong><small>Aguardando conclusão</small></div>
        <div className="stat-card"><span>Pendências</span><strong>{estadiasALancar.length}</strong><small>Aguardando lançamento</small></div>
        <div className="stat-card"><span>Finalizadas</span><strong>{finalizadas}</strong><small>Registros encerrados</small></div>
      </div>

      <div className="dashboard-hero home-bottom">
        <div className="hero-side-card home-workflow">
          <h3>Fluxo de trabalho</h3>
          <div className="system-health">
            <div className="health-row"><span>1. Receber ocorrência</span><strong>Pendência</strong></div>
            <div className="health-row"><span>2. Conferir informações</span><strong>Tratamento</strong></div>
            <div className="health-row"><span>3. Lançar estadia</span><strong>Registro</strong></div>
            <div className="health-row"><span>4. Encerrar</span><strong>Finalizada</strong></div>
          </div>
        </div>
        <div className="hero-side-card">
          <h3>Acesso rápido</h3>
          <div className="hero-actions">
            <button className="ay-primary-action" onClick={onNovaLancada}>Nova estadia <span aria-hidden="true">↗</span></button>
            <button className="ay-secondary-action" onClick={onNovaPendencia}>Nova pendência <span aria-hidden="true">↗</span></button>
          </div>
          <p className="muted">Escolha uma ação e continue de onde sua operação precisa.</p>
        </div>
      </div>
    </section>
  )
}

function PainelEstadias({ onVoltarPortal }) {
  const { abaAtiva, mudarAba, usuarioAtual } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const formLancadaRef = useRef()
  const formALancarRef = useRef()
  const acessoPermitido = !ADMIN_ONLY_TABS.includes(abaAtiva) || podeAdministrar(usuarioAtual)
  const aba = ABAS_VALIDAS.includes(abaAtiva) && acessoPermitido ? abaAtiva : 'inicio'

  useEffect(() => {
    const fecharComEscape = (event) => { if (event.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', fecharComEscape)
    return () => window.removeEventListener('keydown', fecharComEscape)
  }, [])

  useEffect(() => {
    if (!ABAS_VALIDAS.includes(abaAtiva) || !acessoPermitido) mudarAba('inicio')
  }, [abaAtiva, acessoPermitido, mudarAba])

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarOpen)
    return () => document.body.classList.remove('sidebar-open')
  }, [sidebarOpen])

  const focarLancada = () => {
    mudarAba('lancadas')
    setTimeout(() => formLancadaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  const focarALancar = () => {
    mudarAba('alancar')
    setTimeout(() => formALancarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  return (
    <div className="app ayres-app" style={{ display: 'block' }}>
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}
      <div className="app-layout">
        <Sidebar expandido={sidebarOpen} onFechar={() => setSidebarOpen(false)} />
        <section className="main-pro">
          <Header menuAberto={sidebarOpen} onMenuMobile={() => setSidebarOpen(v => !v)} />
          <main className="container">
            <div className="workspace-toolbar">
              <span>Operação / <strong>Estadias</strong></span>
              <button type="button" className="btn-light btn-small" onClick={onVoltarPortal}>← Voltar ao portal</button>
            </div>
            <EstadiaTicker />
            <LivePanel />
            <Suspense fallback={<FastFallback />}>
              {aba === 'inicio' && <EstadiasHome onNovaLancada={focarLancada} onNovaPendencia={focarALancar} />}
              {aba === 'consultaLancadas' && <ConsultaEstadiasLancadas visaoInicial="andamento" />}
              {aba === 'planilha' && <EstadiasPlanilha />}
              {aba === 'finalizadas' && <ConsultaEstadiasLancadas visaoInicial="finalizadas" />}
              {aba === 'lancadas' && <EstadiaLancada formRef={formLancadaRef} />}
              {aba === 'alancar' && <EstadiaALancar formRef={formALancarRef} />}
              {aba === 'admin' && podeAdministrar(usuarioAtual) && <Admin somenteUsuarios />}
            </Suspense>
            <div className="footer">AYRES · Controle de Estadias · by Manoel</div>
          </main>
        </section>
      </div>
    </div>
  )
}

function PainelRelatorios({ onVoltarPortal }) {
  return (
    <div className="app ayres-app ayres-reports-app" style={{ display: 'block' }}>
      <section className="main-pro" style={{ marginLeft: 0 }}>
        <Header />
        <main className="container" style={{ paddingTop: 18 }}>
          <div className="workspace-toolbar">
            <span>Operação / <strong>Relatórios</strong></span>
            <button type="button" className="btn-light btn-small" onClick={onVoltarPortal}>← Voltar ao portal</button>
          </div>
          <Suspense fallback={<FastFallback />}><Relatorios /></Suspense>
          <div className="footer">AYRES · Relatórios de Estadias · by Manoel</div>
        </main>
      </section>
    </div>
  )
}

export default function App() {
  const { usuarioAtual } = useApp()
  const [moduloAberto, setModuloAberto] = useState(moduloSalvo)

  useEffect(() => {
    const sincronizarModulo = () => setModuloAberto(moduloSalvo())
    window.addEventListener('ayres:modulo', sincronizarModulo)
    return () => window.removeEventListener('ayres:modulo', sincronizarModulo)
  }, [])

  useEffect(() => {
    if (!usuarioAtual) setModuloAberto('')
  }, [usuarioAtual])

  const voltarAoPortal = () => {
    localStorage.removeItem('moduloInicialViaLog')
    setModuloAberto('')
  }

  return (
    <>
      <SoundManager />
      {!usuarioAtual
        ? <Login />
        : !moduloAberto
          ? <Suspense fallback={<FastFallback />}><SelecaoPainel /></Suspense>
          : moduloAberto === 'relatorios'
            ? <PainelRelatorios onVoltarPortal={voltarAoPortal} />
            : <PainelEstadias onVoltarPortal={voltarAoPortal} />}
      <Toast />
    </>
  )
}
