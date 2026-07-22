import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import AyresLogo from './AyresLogo'
import '../styles/portal-zero.css'

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
}

const TRADUCOES = {
  pt: {
    marca: 'Operações',
    saudacao: 'Olá',
    escolher: 'Escolha onde quer trabalhar agora. Cada área abre separada, limpa e sem poluir sua operação.',
    entrar: 'Abrir módulo',
    sessao: 'Sua sessão continua ativa até clicar em',
    sair: 'Sair',
    logout: 'Sair',
    painel: 'Painel de',
    modulos: [
      { id: 'estadia', nome: 'Estadia', subtitulo: 'Pendências, lançamentos, anexos e finalizações em um só lugar.', icon: 'grid', cor: 'blue', aba: 'inicio', etiqueta: 'Operação', bullets: ['Estadias', 'Pendências', 'Relatórios'] },
      { id: 'captacao', nome: 'Captação', subtitulo: 'Motoristas, contatos, cargas captadas e acompanhamento comercial.', icon: 'chart', cor: 'orange', aba: 'captacao', etiqueta: 'Comercial', bullets: ['Motoristas', 'Contatos', 'Ranking'] },
      { id: 'embarque', nome: 'Embarque', subtitulo: 'Controle de cargas, fretes, veículos e localização da operação.', icon: 'truck', cor: 'emerald', aba: 'embarque', etiqueta: 'Logística', bullets: ['Localização', 'Fretes', 'Cargas'] },
    ],
  },
  en: {
    marca: 'Operations',
    saudacao: 'Hello',
    escolher: 'Choose where you want to work now. Each area opens cleanly and separately.',
    entrar: 'Open module',
    sessao: 'Your session remains active until you click',
    sair: 'Sign out',
    logout: 'Sign out',
    painel: 'Panel',
    modulos: [
      { id: 'estadia', nome: 'Stay Control', subtitulo: 'Pending items, records, attachments and completions in one place.', icon: 'grid', cor: 'blue', aba: 'inicio', etiqueta: 'Operations', bullets: ['Records', 'Pending', 'Reports'] },
      { id: 'captacao', nome: 'Capture', subtitulo: 'Drivers, contacts, captured loads and commercial follow-up.', icon: 'chart', cor: 'orange', aba: 'captacao', etiqueta: 'Commercial', bullets: ['Drivers', 'Contacts', 'Ranking'] },
      { id: 'embarque', nome: 'Shipment', subtitulo: 'Load control, freight, vehicles and operation location.', icon: 'truck', cor: 'emerald', aba: 'embarque', etiqueta: 'Logistics', bullets: ['Location', 'Freight', 'Loads'] },
    ],
  },
}

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout } = useApp()
  const [pronto, setPronto] = useState(false)
  const idioma = localStorage.getItem('idiomaAyres') || 'pt'
  const t = TRADUCOES[idioma] || TRADUCOES.pt
  const primeiroNome = usuarioAtual?.nome?.split(' ')[0] || usuarioAtual?.usuario || 'usuário'
  const filialLabel = usuarioAtual?.filial === 'oleo' ? 'Operação do Óleo' : (usuarioAtual?.filial || 'jatai-go')

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
    <div className="portal-zero">
      <div className="portal-zero-shell">
        <header className="portal-zero-header">
          <div className="portal-zero-brand">
            <div className="portal-zero-logo"><AyresLogo size={44} /></div>
            <div>
              <h1>AYRES</h1>
              <p>{t.marca}</p>
            </div>
          </div>

          <div className="portal-zero-userbar">
            <div className="portal-zero-userpill">{ICONES.user}<span>{usuarioAtual?.nome || usuarioAtual?.usuario}</span></div>
            <button type="button" className="portal-zero-exit" onClick={sair}>{ICONES.logout}<span>{t.logout}</span></button>
          </div>
        </header>

        <main className="portal-zero-main">
          <section className={`portal-zero-hero ${pronto ? 'ready' : ''}`}>
            <div className="portal-zero-copy">
              <div className="portal-zero-chip">{ICONES.shield}<span>{filialLabel}</span></div>
              <h2>{t.saudacao}, <span>{primeiroNome}</span></h2>
              <p>{t.escolher}</p>
              <div className="portal-zero-note"><strong>↳</strong><span>Portal refeito em layout compacto, sem cards gigantes e sem botão global espremendo a tela.</span></div>
            </div>

            <div className="portal-zero-modules" aria-label="Módulos do sistema">
              {t.modulos.map((modulo) => (
                <button
                  key={modulo.id}
                  type="button"
                  className={`portal-zero-card ${modulo.cor}`}
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
    </div>
  )
}
