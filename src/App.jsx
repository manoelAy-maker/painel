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
  return <div className="est-only-loading">Carregando módulo de estadias…</div>
}

function PainelEstadiasOnly() {
  const { abaAtiva, mudarAba, usuarioAtual, logout } = useApp()
  const aba = ABAS_VALIDAS.includes(abaAtiva) ? abaAtiva : 'consultaLancadas'

  useEffect(() => {
    if (!ABAS_VALIDAS.includes(abaAtiva)) mudarAba('consultaLancadas')
  }, [abaAtiva, mudarAba])

  const titulo = aba === 'alancar'
    ? 'Lançar pendência'
    : aba === 'lancadas'
      ? 'Lançar estadia'
      : aba === 'finalizadas'
        ? 'Estadias finalizadas'
        : 'Controle de estadias'

  return (
    <div className="est-only-shell">
      <header className="est-only-topbar">
        <div className="est-only-brand">
          <div className="est-only-mark">A</div>
          <div>
            <strong>AYRES · ESTADIAS</strong>
            <span>Operação enxuta de controle e pendências</span>
          </div>
        </div>

        <div className="est-only-user">
          <span className="est-only-user-name">{usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'}</span>
          <button className="est-only-logout" type="button" onClick={logout}>Sair</button>
        </div>
      </header>

      <main className="est-only-main">
        <section className="est-only-hero">
          <div>
            <div className="est-only-kicker">Central operacional</div>
            <h1>{titulo}</h1>
            <p>Somente o que importa para registrar, acompanhar e resolver estadias.</p>
          </div>
        </section>

        <nav className="est-only-nav" aria-label="Navegação de estadias">
          <button className={aba === 'consultaLancadas' ? 'active' : ''} onClick={() => mudarAba('consultaLancadas')}>Em andamento</button>
          <button className={aba === 'finalizadas' ? 'active' : ''} onClick={() => mudarAba('finalizadas')}>Finalizadas</button>
          <button className={aba === 'lancadas' ? 'active' : ''} onClick={() => mudarAba('lancadas')}>+ Lançar estadia</button>
          <button className={aba === 'alancar' ? 'active' : ''} onClick={() => mudarAba('alancar')}>+ Lançar pendência</button>
        </nav>

        <section className="est-only-stage">
          <Suspense fallback={<FastFallback />}>
            {aba === 'consultaLancadas' && <ConsultaEstadiasLancadas visaoInicial="andamento" />}
            {aba === 'finalizadas' && <ConsultaEstadiasLancadas visaoInicial="finalizadas" />}
            {aba === 'lancadas' && <EstadiaLancada />}
            {aba === 'alancar' && <EstadiaALancar />}
          </Suspense>
        </section>

        <footer className="est-only-footer">AYRES · Controle de Estadias</footer>
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
