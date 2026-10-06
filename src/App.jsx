import { lazy, Suspense, useEffect } from 'react'
import { useApp } from './context/AppContext'
import Login from './components/Login'
import Toast from './components/Toast'
import SoundManager from './components/SoundManager'
import './styles/app.css'
import './styles/ayres-estadia-form-clean.css'
import './estadia-contrast.css'
import './styles/estadias-only.css'

const EstadiaLancada = lazy(() => import('./modules/estadia/pages/EstadiaLancada'))
const ConsultaEstadiasLancadas = lazy(() => import('./pages/ConsultaEstadiasLancadas'))
const EstadiaALancar = lazy(() => import('./modules/estadia/pages/EstadiaALancar'))

const ABAS_VALIDAS = ['consultaLancadas', 'finalizadas', 'lancadas', 'alancar']

function FastFallback() {
  return <div className="est-only-loading"><span className="est-loading-dot" />Carregando operação…</div>
}

function NavIcon({ type }) {
  const paths = {
    andamento: 'M4 18V6m0 12h16M8 14l3-3 3 2 5-6',
    finalizadas: 'M7 12l3 3 7-7M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    nova: 'M12 5v14M5 12h14',
    pendencia: 'M9 4h6l1 2h3v15H5V6h3l1-2zm1 9h4m-4 4h4'
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[type]} />
    </svg>
  )
}

function PainelEstadiasOnly() {
  const { abaAtiva, mudarAba, usuarioAtual, logout } = useApp()
  const aba = ABAS_VALIDAS.includes(abaAtiva) ? abaAtiva : 'consultaLancadas'

  useEffect(() => {
    if (!ABAS_VALIDAS.includes(abaAtiva)) mudarAba('consultaLancadas')
  }, [abaAtiva, mudarAba])

  return (
    <div className="est-only-shell">
      <header className="est-only-topbar">
        <div className="est-only-brand">
          <div className="est-only-mark">A</div>
          <div className="est-only-brand-copy">
            <strong>AYRES</strong>
            <span>Controle de Estadias</span>
          </div>
        </div>

        <div className="est-only-top-actions">
          <span className="est-system-status"><i /> Operação online</span>
          <div className="est-only-user">
            <div className="est-user-avatar">{String(usuarioAtual?.nome || usuarioAtual?.usuario || 'U').trim().charAt(0).toUpperCase()}</div>
            <div className="est-user-copy">
              <strong>{usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'}</strong>
              <span>{usuarioAtual?.cargo || 'Operador'}</span>
            </div>
            <button className="est-only-logout" type="button" onClick={logout}>Sair</button>
          </div>
        </div>
      </header>

      <main className="est-only-main">
        <div className="est-only-page-head">
          <div>
            <span className="est-only-kicker">CENTRAL OPERACIONAL</span>
            <h1>Estadias</h1>
          </div>
          <p>Registre, acompanhe e finalize ocorrências sem sair da operação.</p>
        </div>

        <nav className="est-only-nav" aria-label="Navegação de estadias">
          <button className={aba === 'consultaLancadas' ? 'active' : ''} onClick={() => mudarAba('consultaLancadas')}>
            <NavIcon type="andamento" /><span>Em andamento</span>
          </button>
          <button className={aba === 'finalizadas' ? 'active' : ''} onClick={() => mudarAba('finalizadas')}>
            <NavIcon type="finalizadas" /><span>Finalizadas</span>
          </button>
          <button className={aba === 'lancadas' ? 'active accent' : 'accent'} onClick={() => mudarAba('lancadas')}>
            <NavIcon type="nova" /><span>Nova estadia</span>
          </button>
          <button className={aba === 'alancar' ? 'active' : ''} onClick={() => mudarAba('alancar')}>
            <NavIcon type="pendencia" /><span>Pendências</span>
          </button>
        </nav>

        <section className="est-only-stage">
          <Suspense fallback={<FastFallback />}>
            {aba === 'consultaLancadas' && <ConsultaEstadiasLancadas visaoInicial="andamento" />}
            {aba === 'finalizadas' && <ConsultaEstadiasLancadas visaoInicial="finalizadas" />}
            {aba === 'lancadas' && <EstadiaLancada />}
            {aba === 'alancar' && <EstadiaALancar />}
          </Suspense>
        </section>

        <footer className="est-only-footer">AYRES · Controle operacional de estadias</footer>
      </main>
    </div>
  )
}

export default function App() {
  const { usuarioAtual } = useApp()
  return (
    <>
      <SoundManager />
      {!usuarioAtual ? <Login /> : <PainelEstadiasOnly />}
      <Toast />
    </>
  )
}
