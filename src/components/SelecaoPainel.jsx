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
  clock: <Svg width="16" height="16"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>,
  user: <Svg width="16" height="16"><path d="M20 21a8 8 0 10-16 0" /><circle cx="12" cy="7" r="4" /></Svg>,
}

const modulos = [
  { id: 'estadia', nome: 'Estadia', subtitulo: 'Controle de estadias, pendências, status, anexos e lançamentos por filial.', icon: 'grid', cor: 'blue', aba: 'inicio', metrica: 'Operação diária', bullets: ['Nova estadia', 'Pendências a lançar', 'Dashboard e histórico'] },
  { id: 'captacao', nome: 'Captação', subtitulo: 'Registro de motoristas, contatos, cargas captadas e acompanhamento da semana.', icon: 'chart', cor: 'orange', aba: 'captacao', metrica: 'Comercial operacional', bullets: ['Motoristas captados', 'Status de contato', 'Ranking por usuário'] },
]

const cores = {
  blue: { texto: 'text-blue-400', iconeWrap: 'bg-blue-500/10 border-blue-500/20 text-blue-400', glow: 'hover:shadow-[0_35px_80px_-20px_rgba(37,99,235,0.45)] hover:border-blue-400/40' },
  orange: { texto: 'text-orange-400', iconeWrap: 'bg-orange-500/10 border-orange-500/20 text-orange-400', glow: 'hover:shadow-[0_35px_80px_-20px_rgba(249,115,22,0.42)] hover:border-orange-400/40' },
}

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout } = useApp()
  const [heroVisivel, setHeroVisivel] = useState(false)
  const primeiroNome = usuarioAtual?.nome?.split(' ')[0] || usuarioAtual?.usuario || 'usuário'

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
    window.dispatchEvent(new Event('ayres:modulo'))
  }

  const sair = () => {
    localStorage.removeItem('moduloInicialViaLog')
    logout()
  }

  return (
    <div className="portal-screen min-h-screen flex flex-col bg-[#05070a] text-white font-sans relative overflow-hidden" style={{ fontFamily: "'Inter','Plus Jakarta Sans',Arial,sans-serif" }}>
      <PortalScene />
      <div className="fixed inset-0 -z-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.05) 1px, transparent 1px)', backgroundSize: '50px 50px', maskImage: 'radial-gradient(circle at center, black, transparent 80%)', WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)' }} />
      <div className="fixed left-1/2 top-0 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[110px]" />

      <header className="px-6 sm:px-10 py-7 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-[0_0_28px_rgba(37,99,235,0.45)]"><span className="text-2xl font-extrabold">A</span></div>
          <div><h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AYRES</h1><p className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold">Central operacional</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs text-slate-300">
            {ICONES.user}<span>{usuarioAtual?.nome || usuarioAtual?.usuario}</span>
          </div>
          <button type="button" onClick={sair} className="bg-white/5 border border-white/10 rounded-full px-4 sm:px-5 py-2.5 text-xs font-bold flex items-center gap-2 sm:gap-3 hover:bg-red-500/10 hover:border-red-400/20 transition-all text-red-300">{ICONES.logout}<span className="hidden sm:inline">SAIR</span></button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 sm:py-12">
        <section className={`max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[.88fr_1.12fr] gap-8 xl:gap-12 items-center transition-all duration-1000 ease-out ${heroVisivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[.18em] text-blue-300 mb-7">
              {ICONES.shield} Sessão salva neste navegador
            </div>
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[.95] mb-7">
              Olá, <span className="text-blue-400">{primeiroNome}</span>.<br />Qual operação vamos abrir?
            </h2>
            <p className="text-slate-400 text-base sm:text-xl leading-relaxed max-w-2xl mb-8">
              Seu acesso permanece conectado neste navegador. Você só volta para a tela de login quando clicar em <strong className="text-slate-200">Sair</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
              <div className="rounded-3xl border border-white/10 bg-white/[.04] p-5"><p className="text-2xl font-black">2</p><span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Módulos</span></div>
              <div className="rounded-3xl border border-white/10 bg-white/[.04] p-5"><p className="text-2xl font-black">Auto</p><span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Nuvem</span></div>
              <div className="rounded-3xl border border-white/10 bg-white/[.04] p-5"><p className="text-2xl font-black">Único</p><span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Login</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {modulos.map((m) => {
              const c = cores[m.cor]
              return (
                <button key={m.id} type="button" onClick={() => acessar(m)} onMouseMove={moverGlow} className={`group relative overflow-hidden text-left p-7 sm:p-9 flex flex-col justify-between min-h-[360px] rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-[#111827] via-[#0d1117] to-[#070a10] cursor-pointer transition-all duration-500 hover:-translate-y-2 ${c.glow}`}>
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[2.25rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), ${m.cor === 'blue' ? 'rgba(59,130,246,.18)' : 'rgba(249,115,22,.18)'}, transparent 42%)` }} />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-4 mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${c.iconeWrap}`}>{ICONES[m.icon]}</div>
                      <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{m.metrica}</span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">Painel de <span className={c.texto}>{m.nome}</span></h3>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-7">{m.subtitulo}</p>
                    <div className="space-y-2">
                      {m.bullets.map((b) => <div key={b} className="flex items-center gap-2 text-sm text-slate-300"><span className={`h-1.5 w-1.5 rounded-full ${m.cor === 'blue' ? 'bg-blue-400' : 'bg-orange-400'}`} />{b}</div>)}
                    </div>
                  </div>
                  <div className={`relative mt-9 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] px-5 py-4 font-bold text-sm ${c.texto}`}><span>ACESSAR AGORA</span>{ICONES.arrowRight}</div>
                </button>
              )
            })}
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 text-center"><p className="text-[10px] text-slate-700 uppercase tracking-[0.4em]">© 2026 AYRES Logística. Ambiente operacional seguro.</p></footer>
    </div>
  )
}
