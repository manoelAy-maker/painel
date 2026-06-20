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
  shield: <Svg width="16" height="16"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" /></Svg>,
  user: <Svg width="16" height="16"><path d="M20 21a8 8 0 10-16 0" /><circle cx="12" cy="7" r="4" /></Svg>,
}

const TRADUCOES = {
  pt: {
    marca: 'Operações',
    saudacao: 'Olá',
    escolher: 'Escolha o módulo para continuar.',
    entrar: 'ENTRAR NO MÓDULO',
    sessao: 'Sua sessão continua ativa até clicar em',
    sair: 'Sair',
    logout: 'SAIR',
    modulos: [
      {
        id: 'estadia',
        nome: 'Estadia',
        subtitulo: 'Pendências, lançamentos, anexos e finalizações em um só lugar.',
        icon: 'grid',
        cor: 'blue',
        aba: 'inicio',
        etiqueta: 'Operação',
        bullets: ['Estadias', 'Pendências', 'Relatórios'],
      },
      {
        id: 'captacao',
        nome: 'Captação',
        subtitulo: 'Motoristas, contatos, cargas captadas e acompanhamento da operação.',
        icon: 'chart',
        cor: 'orange',
        aba: 'captacao',
        etiqueta: 'Comercial',
        bullets: ['Motoristas', 'Contatos', 'Ranking'],
      },
    ],
  },
  en: {
    marca: 'Operations',
    saudacao: 'Hello',
    escolher: 'Choose a module to continue.',
    entrar: 'OPEN MODULE',
    sessao: 'Your session remains active until you click',
    sair: 'Sign out',
    logout: 'SIGN OUT',
    modulos: [
      {
        id: 'estadia',
        nome: 'Stay Control',
        subtitulo: 'Pending items, records, attachments and completions in one place.',
        icon: 'grid',
        cor: 'blue',
        aba: 'inicio',
        etiqueta: 'Operations',
        bullets: ['Records', 'Pending', 'Reports'],
      },
      {
        id: 'captacao',
        nome: 'Capture',
        subtitulo: 'Drivers, contacts, captured loads and operational follow-up.',
        icon: 'chart',
        cor: 'orange',
        aba: 'captacao',
        etiqueta: 'Commercial',
        bullets: ['Drivers', 'Contacts', 'Ranking'],
      },
    ],
  },
}

const cores = {
  blue: { texto: 'text-blue-300', iconeWrap: 'bg-blue-500/10 border-blue-400/20 text-blue-300', glow: 'hover:shadow-[0_35px_90px_-28px_rgba(59,130,246,0.75)] hover:border-blue-300/35', linha: 'from-blue-400/70 to-cyan-300/20' },
  orange: { texto: 'text-orange-300', iconeWrap: 'bg-orange-500/10 border-orange-400/20 text-orange-300', glow: 'hover:shadow-[0_35px_90px_-28px_rgba(249,115,22,0.72)] hover:border-orange-300/35', linha: 'from-orange-400/75 to-amber-200/20' },
}

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout } = useApp()
  const [heroVisivel, setHeroVisivel] = useState(false)
  const [idioma, setIdioma] = useState(() => localStorage.getItem('idiomaAyres') || 'pt')
  const t = TRADUCOES[idioma] || TRADUCOES.pt
  const primeiroNome = usuarioAtual?.nome?.split(' ')[0] || usuarioAtual?.usuario || 'usuário'
  const filialLabel = usuarioAtual?.filial === 'oleo' ? 'Operação do Óleo' : (usuarioAtual?.filial || 'jatai-go')

  useEffect(() => {
    const t = setTimeout(() => setHeroVisivel(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    localStorage.setItem('idiomaAyres', idioma)
  }, [idioma])

  const moverGlow = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
  }

  const acessar = (m) => {
    localStorage.setItem('moduloInicialViaLog', m.id)
    mudarAba(m.aba)
    window.dispatchEvent(new Event('ayres:modulo'))
  }

  const sair = () => {
    localStorage.removeItem('moduloInicialViaLog')
    logout()
  }

  return (
    <div className="portal-screen min-h-screen flex flex-col bg-[#05070a] text-white font-sans relative overflow-hidden" style={{ fontFamily: "'Inter','Plus Jakarta Sans',Arial,sans-serif" }}>
      <PortalScene />
      <div className="fixed inset-0 -z-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(circle at center, black, transparent 78%)', WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 78%)' }} />
      <div className="fixed left-1/2 top-[-180px] -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-blue-600/12 blur-[120px]" />
      <div className="fixed bottom-[-220px] right-[-180px] -z-10 h-[520px] w-[520px] rounded-full bg-orange-500/10 blur-[130px]" />

      <header className="px-6 sm:px-10 py-7 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-800 rounded-2xl flex items-center justify-center shadow-[0_0_28px_rgba(37,99,235,0.45)]"><span className="text-2xl font-extrabold">A</span></div>
          <div><h1 className="text-2xl font-black tracking-tight">AYRES</h1><p className="text-[10px] uppercase tracking-[0.3em] text-blue-300 font-black">{t.marca}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-white/10 bg-white/[.045] p-1 text-[11px] font-black backdrop-blur-xl">
            <button type="button" onClick={() => setIdioma('pt')} className={`px-3 py-1.5 rounded-full transition-all ${idioma === 'pt' ? 'bg-blue-500/25 text-blue-100' : 'text-slate-500 hover:text-slate-200'}`}>PT</button>
            <button type="button" onClick={() => setIdioma('en')} className={`px-3 py-1.5 rounded-full transition-all ${idioma === 'en' ? 'bg-blue-500/25 text-blue-100' : 'text-slate-500 hover:text-slate-200'}`}>EN</button>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-4 py-2 text-xs text-slate-300 backdrop-blur-xl">
            {ICONES.user}<span>{usuarioAtual?.nome || usuarioAtual?.usuario}</span>
          </div>
          <button type="button" onClick={sair} className="bg-white/[.045] border border-white/10 rounded-full px-4 py-2.5 text-xs font-bold flex items-center gap-2 hover:bg-red-500/10 hover:border-red-400/20 transition-all text-red-300">{ICONES.logout}<span className="hidden sm:inline">{t.logout}</span></button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <section className={`w-full max-w-6xl mx-auto transition-all duration-1000 ease-out ${heroVisivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-9 sm:mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-4 py-2 text-[11px] font-black uppercase tracking-[.16em] text-slate-300 mb-6 backdrop-blur-xl">
              {ICONES.shield} {filialLabel}
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-4">
              {t.saudacao}, <span className="text-blue-300">{primeiroNome}</span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">{t.escolher}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {t.modulos.map((m) => {
              const c = cores[m.cor]
              return (
                <button key={m.id} type="button" onClick={() => acessar(m)} onMouseMove={moverGlow} className={`group relative overflow-hidden text-left p-8 sm:p-10 min-h-[390px] rounded-[2.5rem] border border-white/10 bg-[#0c111a]/90 backdrop-blur-xl cursor-pointer transition-all duration-500 hover:-translate-y-2 ${c.glow}`}>
                  <span className={`absolute left-8 right-8 top-0 h-px bg-gradient-to-r ${c.linha}`} />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[2.5rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), ${m.cor === 'blue' ? 'rgba(59,130,246,.16)' : 'rgba(249,115,22,.16)'}, transparent 43%)` }} />
                  <div className="relative flex min-h-[310px] flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-5 mb-10">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border ${c.iconeWrap}`}>{ICONES[m.icon]}</div>
                        <span className="rounded-full border border-white/10 bg-white/[.045] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{m.etiqueta}</span>
                      </div>
                      <h3 className="text-4xl sm:text-5xl font-black mb-5 tracking-tight">{idioma === 'pt' ? 'Painel de' : 'Panel'} <span className={c.texto}>{m.nome}</span></h3>
                      <p className="text-slate-400 text-base leading-relaxed max-w-md">{m.subtitulo}</p>
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {m.bullets.map((b) => <span key={b} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs font-bold text-slate-300">{b}</span>)}
                      </div>
                      <div className={`flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.045] px-5 py-4 font-black text-sm ${c.texto}`}><span>{t.entrar}</span>{ICONES.arrowRight}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <p className="text-center text-[11px] text-slate-600 mt-8">{t.sessao} <span className="text-slate-400">{t.sair}</span>.</p>
        </section>
      </main>
    </div>
  )
}
