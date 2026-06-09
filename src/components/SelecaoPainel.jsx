import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import '../portal-pro.css'

const Svg = ({ children, ...p }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
)

const ICONES = {
  grid: <Svg><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></Svg>,
  chart: <Svg><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19h-20" /></Svg>,
  arrowRight: <Svg width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" /></Svg>,
  logout: <Svg width="16" height="16"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></Svg>,
}

const modulos = [
  {
    id: 'estadia',
    nome: 'Estadia',
    subtitulo: 'Lance estadias, acompanhe pendências, calcule valores e mantenha os anexos organizados na nuvem.',
    icon: 'grid',
    cor: 'blue',
    aba: 'inicio',
    badge: 'Operação principal',
  },
  {
    id: 'captacao',
    nome: 'Captação',
    subtitulo: 'Controle leads de motoristas, ordens, carregamentos e motivos de não carregamento com pontuação justa.',
    icon: 'chart',
    cor: 'orange',
    aba: 'captacao',
    badge: 'CRM operacional',
  },
]

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout, estadias, estadiasALancar, cloudStatus, usuariosOnline } = useApp()
  const [heroVisivel, setHeroVisivel] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHeroVisivel(true), 60)
    return () => clearTimeout(t)
  }, [])

  const moverGlow = (e, cor) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
    e.currentTarget.style.setProperty('--glow', cor === 'orange' ? 'rgba(249,115,22,.16)' : 'rgba(59,130,246,.16)')
  }

  const acessar = (m) => {
    localStorage.setItem('moduloInicialViaLog', m.id)
    mudarAba(m.aba)
    window.location.reload()
  }

  const sair = () => {
    localStorage.removeItem('moduloInicialViaLog')
    logout()
  }

  const abertas = estadias.filter(e => e.status === 'Aberto').length
  const finalizadas = estadias.filter(e => e.status === 'Finalizado').length
  const primeiroNome = usuarioAtual?.nome?.split(' ')[0] || usuarioAtual?.usuario || 'visitante'
  const online = cloudStatus === 'online'

  const metricasModulo = (id) => id === 'estadia'
    ? [
        { label: 'Lançadas', value: estadias.length },
        { label: 'Pendências', value: estadiasALancar.length },
        { label: 'Abertas', value: abertas },
      ]
    : [
        { label: 'Fluxo', value: 'Leads' },
        { label: 'Resultado', value: 'Ordens' },
        { label: 'Análise', value: 'Motivos' },
      ]

  return (
    <div className="portal-pro">
      <header className="portal-header-pro">
        <div className="portal-brand-pro">
          <div className="portal-logo-pro">A</div>
          <div>
            <h1>AYRES</h1>
            <p>Logística inteligente</p>
          </div>
        </div>

        <div className="portal-top-actions-pro">
          <span className="portal-chip-pro"><i className={`portal-chip-dot-pro ${online ? '' : 'offline'}`} />{online ? 'Nuvem online' : 'Modo offline'}</span>
          <button type="button" onClick={sair} className="portal-logout-pro">{ICONES.logout} Sair</button>
        </div>
      </header>

      <main className="portal-main-pro">
        <section className={`portal-hero-pro transition-all duration-700 ease-out ${heroVisivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="portal-hero-card-pro">
            <div className="portal-kicker-pro">Central AYRES</div>
            <h2>Olá, <span>{primeiroNome}</span>. Escolha sua operação.</h2>
            <p>
              Acesse o painel de estadias ou a central de captação com login único. O objetivo é abrir rápido, lançar certo e manter tudo salvo com segurança.
            </p>
            <div className="portal-quick-row-pro">
              <button className="portal-quick-btn-pro primary" onClick={() => acessar(modulos[0])}>Abrir Estadia</button>
              <button className="portal-quick-btn-pro" onClick={() => acessar(modulos[1])}>Abrir Captação</button>
            </div>
          </div>

          <aside className="portal-info-card-pro">
            <div className="portal-info-head-pro">
              <h3>Status operacional</h3>
              <span>Resumo rápido antes de entrar no módulo</span>
            </div>
            <div className="portal-info-grid-pro">
              <div className="portal-mini-card-pro"><span>Cargo</span><strong>{usuarioAtual?.cargo || 'Operador'}</strong></div>
              <div className="portal-mini-card-pro"><span>Filial</span><strong>{usuarioAtual?.filial || 'jatai-go'}</strong></div>
              <div className="portal-mini-card-pro"><span>Usuários online</span><strong>{usuariosOnline?.length || 0}</strong></div>
              <div className="portal-mini-card-pro"><span>Finalizadas</span><strong>{finalizadas}</strong></div>
            </div>
          </aside>
        </section>

        <section className="portal-modules-pro">
          {modulos.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => acessar(m)}
              onMouseMove={(e) => moverGlow(e, m.cor)}
              className={`portal-module-card-pro ${m.cor === 'orange' ? 'orange' : ''}`}
            >
              <span className="portal-module-glow-pro" style={{ background: 'radial-gradient(circle at var(--x, 50%) var(--y, 50%), var(--glow, rgba(59,130,246,.16)), transparent 42%)' }} />
              <div className="portal-module-top-pro">
                <div className="portal-module-icon-pro">{ICONES[m.icon]}</div>
                <span className="portal-module-badge-pro">{m.badge}</span>
              </div>
              <h3>Painel de <br /><span>{m.nome}</span></h3>
              <p>{m.subtitulo}</p>
              <div className="portal-module-stats-pro">
                {metricasModulo(m.id).map((s) => <div key={s.label} className="portal-module-stat-pro"><small>{s.label}</small><strong>{s.value}</strong></div>)}
              </div>
              <span className="portal-module-action-pro">Acessar módulo {ICONES.arrowRight}</span>
            </button>
          ))}
        </section>
      </main>

      <footer className="portal-footer-pro">© 2026 AYRES Logística · Plataforma operacional</footer>
    </div>
  )
}