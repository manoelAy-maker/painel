import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useApp } from './context/AppContext'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import LivePanel from './components/LivePanel'
import EstadiaTicker from './components/EstadiaTicker'
import Toast from './components/Toast'
import SoundManager from './components/SoundManager'
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
const EstadiaALancar = lazy(() => import('./modules/estadia/pages/EstadiaALancar'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const SelecaoPainel = lazy(() => import('./components/SelecaoPainel'))

const ABAS_VALIDAS = ['inicio', 'consultaLancadas', 'finalizadas', 'lancadas', 'alancar']

function FastFallback() {
  return <div role="status" aria-live="polite" style={{ minHeight: 110, display: 'grid', placeItems: 'center', opacity: .72, fontSize: 13 }}>Carregando módulo…</div>
}

function valorNumero(v) {
  const s = String(v || '').replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
  return Number(s) || 0
}

function dinheiro(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function EstadiasHome({ onNovaLancada, onNovaPendencia }) {
  const { estadias = [], estadiasALancar = [], usuarioAtual, cloudStatus } = useApp()
  const emAndamento = estadias.filter(e => e.status !== 'Finalizado').length
  const finalizadas = estadias.filter(e => e.status === 'Finalizado').length
  const urgentes = estadiasALancar.filter(e => e.prioridade === 'Urgente').length
  const aguardandoAprovacao = estadias.filter(e => e.status === 'Em análise').length
  const aguardandoPagamento = estadias.filter(e => e.status === 'Aprovado' || e.status === 'Em pagamento').length
  const previsto = estadias.reduce((s, e) => s + valorNumero(e.valor || e.valorCalculado), 0)
  const aprovado = estadias.reduce((s, e) => s + valorNumero(e.valorAprovado), 0)
  const pago = estadias.reduce((s, e) => s + valorNumero(e.valorPago), 0)
  const primeiroNome = (usuarioAtual?.nome || usuarioAtual?.usuario || 'Operador').split(' ')[0]

  return (
    <section className="aba active">
      <div className="dashboard-hero">
        <div className="hero-pro-card">
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.14em', opacity: .82 }}>CENTRAL DE ESTADIAS</span>
          <h2 style={{ marginTop: 8 }}>Olá, {primeiroNome}. Operação na mão.</h2>
          <p>Acompanhe estadias abertas, finalize registros e lance pendências sem carregar o painel com módulos que não fazem parte desta operação.</p>
          <div className="hero-actions">
            <button onClick={onNovaLancada}>+ Lançar estadia</button>
            <button onClick={onNovaPendencia}>+ Criar pendência</button>
          </div>
        </div>
        <div className="hero-side-card">
          <h3>Resumo agora</h3>
          <div className="system-health">
            <div className="health-row"><span>Em andamento</span><strong>{emAndamento}</strong></div>
            <div className="health-row"><span>Aguardando aprovação</span><strong>{aguardandoAprovacao}</strong></div>
            <div className="health-row"><span>Aguardando pagamento</span><strong>{aguardandoPagamento}</strong></div>
            <div className="health-row"><span>Pendências</span><strong>{estadiasALancar.length}</strong></div>
            <div className="health-row"><span>Urgentes</span><strong>{urgentes}</strong></div>
            <div className="health-row"><span>Nuvem</span><strong>{cloudStatus === 'online' ? 'Online' : 'Verificando'}</strong></div>
          </div>
        </div>
      </div>

      <div className="stats" style={{ marginBottom: 16 }}>
        <div className="stat-card"><span>Valor previsto</span><strong>{dinheiro(previsto)}</strong><small>Total calculado</small></div>
        <div className="stat-card"><span>Valor aprovado</span><strong>{dinheiro(aprovado)}</strong><small>Aprovado para pagamento</small></div>
        <div className="stat-card"><span>Valor pago</span><strong>{dinheiro(pago)}</strong><small>Confirmado como pago</small></div>
        <div className="stat-card"><span>Saldo a pagar</span><strong>{dinheiro(Math.max(0, aprovado - pago))}</strong><small>Aprovado ainda não pago</small></div>
      </div>

      <div className="dashboard-hero">
        <div className="hero-side-card">
          <h3>Fluxo de trabalho</h3>
          <div className="system-health">
            <div className="health-row"><span>1. Receber ocorrência</span><strong>Pendência</strong></div>
            <div className="health-row"><span>2. Conferir</span><strong>Em análise</strong></div>
            <div className="health-row"><span>3. Aprovar</span><strong>Aprovado</strong></div>
            <div className="health-row"><span>4. Financeiro</span><strong>Em pagamento</strong></div>
            <div className="health-row"><span>5. Confirmar</span><strong>Pago</strong></div>
            <div className="health-row"><span>6. Encerrar</span><strong>Finalizado</strong></div>
          </div>
        </div>
        <div className="hero-side-card">
          <h3>Acesso rápido</h3>
          <div className="hero-actions">
            <button className="btn-blue" onClick={onNovaLancada}>Nova estadia</button>
            <button className="btn-orange" onClick={onNovaPendencia}>Nova pendência</button>
          </div>
          <p className="muted" style={{ marginTop: 14, lineHeight: 1.5 }}>O AYRES continua com a identidade visual completa, mas agora o menu fica dedicado ao que interessa: estadias e pendências.</p>
        </div>
      </div>
    </section>
  )
}

function PainelEstadias({ onVoltarPortal }) {
  const { abaAtiva, mudarAba } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const formLancadaRef = useRef()
  const formALancarRef = useRef()
  const aba = ABAS_VALIDAS.includes(abaAtiva) ? abaAtiva : 'inicio'

  useEffect(() => {
    if (!ABAS_VALIDAS.includes(abaAtiva)) mudarAba('inicio')
  }, [abaAtiva, mudarAba])

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
    <div className="app" style={{ display: 'block' }}>
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}
      <div className="app-layout">
        <Sidebar onFechar={() => setSidebarOpen(false)} />
        <section className="main-pro">
          <Header onMenuMobile={() => setSidebarOpen(v => !v)} />
          <main className="container">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <button type="button" className="btn-light btn-small" onClick={onVoltarPortal}>← Voltar ao portal</button>
            </div>
            <EstadiaTicker />
            <LivePanel />
            <Suspense fallback={<FastFallback />}>
              {aba === 'inicio' && <EstadiasHome onNovaLancada={focarLancada} onNovaPendencia={focarALancar} />}
              {aba === 'consultaLancadas' && <ConsultaEstadiasLancadas visaoInicial="andamento" />}
              {aba === 'finalizadas' && <ConsultaEstadiasLancadas visaoInicial="finalizadas" />}
              {aba === 'lancadas' && <EstadiaLancada formRef={formLancadaRef} />}
              {aba === 'alancar' && <EstadiaALancar formRef={formALancarRef} />}
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
    <div className="app" style={{ display: 'block' }}>
      <section className="main-pro" style={{ marginLeft: 0 }}>
        <main className="container" style={{ paddingTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
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
  const [moduloAberto, setModuloAberto] = useState(() => localStorage.getItem('moduloInicialViaLog') || '')

  useEffect(() => {
    const sincronizarModulo = () => setModuloAberto(localStorage.getItem('moduloInicialViaLog') || '')
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
