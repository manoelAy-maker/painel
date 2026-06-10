import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import PortalScene from './PortalScene'

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
    subtitulo: 'Gerencie estadias, pátios e movimentações com total visibilidade.',
    icon: 'grid',
    cor: 'blue',
    aba: 'inicio',
  },
  {
    id: 'captacao',
    nome: 'Captação',
    subtitulo: 'Indicadores e resultados da captação de cargas em tempo real.',
    icon: 'chart',
    cor: 'orange',
    aba: 'captacao',
  },
]

const cores = {
  blue: {
    texto: 'text-blue-500',
    iconeWrap: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    glow: 'hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6),0_0_24px_rgba(59,130,246,0.12)] hover:border-blue-500/30',
  },
  orange: {
    texto: 'text-orange-500',
    iconeWrap: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
    glow: 'hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6),0_0_24px_rgba(249,115,22,0.12)] hover:border-orange-500/30',
  },
}

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout } = useApp()
  const [heroVisivel, setHeroVisivel] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHeroVisivel(true), 60)
    return () => clearTimeout(t)
  }, [])

  const moverGlow = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
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

  return (
    <div className="portal-screen min-h-screen flex flex-col bg-[#05070a] text-white font-sans relative overflow-hidden" style={{ fontFamily: "'Inter','Plus Jakarta Sans',Arial,sans-serif" }}>
      <PortalScene />
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)',
        }}
      />

      <header className="px-6 sm:px-10 py-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <span className="text-2xl font-extrabold">A</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AYRES</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold">Logística inteligente</p>
          </div>
        </div>
        <button type="button" onClick={sair} className="bg-white/5 border border-white/10 rounded-full px-4 sm:px-5 py-2.5 text-xs font-bold flex items-center gap-2 sm:gap-3 hover:bg-white/10 transition-all text-red-400">
          {ICONES.logout}
          <span className="hidden sm:inline">SAIR</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className={`text-center mb-14 sm:mb-20 max-w-3xl transition-all duration-1000 ease-out ${heroVisivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 tracking-tight">
            Olá, <span className="text-blue-500">{usuarioAtual?.nome?.split(' ')[0] || usuarioAtual?.usuario || 'visitante'}</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-xl leading-relaxed font-light">
            Escolha qual painel você quer acessar agora. Você pode trocar entre eles a qualquer momento, sem precisar entrar de novo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 max-w-6xl w-full">
          {modulos.map((m) => {
            const c = cores[m.cor]
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => acessar(m)}
                onMouseMove={moverGlow}
                className={`group relative overflow-hidden text-left p-8 sm:p-12 flex flex-col justify-between min-h-[340px] sm:min-h-[450px] rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-[#0d1117] to-[#080a0f] cursor-pointer transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] ${c.glow}`}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[2.5rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), ${m.cor === 'blue' ? 'rgba(59,130,246,.15)' : 'rgba(249,115,22,.15)'}, transparent 40%)`,
                  }}
                />
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 sm:mb-10 border ${c.iconeWrap}`}>
                    {ICONES[m.icon]}
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 tracking-tight">
                    Painel de <br />
                    <span className={c.texto}>{m.nome}</span>
                  </h3>
                  <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xs">{m.subtitulo}</p>
                </div>
                <div className={`flex items-center gap-3 font-bold text-sm ${c.texto}`}>
                  <span>ACESSAR MÓDULO</span>
                  {ICONES.arrowRight}
                </div>
              </button>
            )
          })}
        </div>
      </main>

      <footer className="px-6 py-12 sm:py-16 text-center">
        <p className="text-[10px] text-slate-700 uppercase tracking-[0.4em]">
          © 2026 AYRES Logística. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}
