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
  bolt: <Svg width="16" height="16"><path d="M13 2L3 14h8l-1 8 11-13h-8l0-7z" /></Svg>,
  route: <Svg width="16" height="16"><path d="M6 19a3 3 0 100-6 3 3 0 000 6z" /><path d="M18 11a3 3 0 100-6 3 3 0 000 6z" /><path d="M8.5 14.5l7-6" /></Svg>,
}

const modulos = [
  {
    id: 'estadia',
    nome: 'Estadia Operacional',
    subtitulo: 'Controle de pendências, lançamentos, anexos e finalizações com fluxo de operação real.',
    icon: 'grid',
    cor: 'blue',
    aba: 'inicio',
    etiqueta: 'Comando',
    destaque: 'Fluxo completo',
    bullets: ['Pendências', 'Lançadas', 'Óleo separado', 'Relatórios'],
  },
  {
    id: 'captacao',
    nome: 'Captação 360',
    subtitulo: 'Motoristas, leads, ordens, motivos de perda e acompanhamento de carregamento.',
    icon: 'chart',
    cor: 'orange',
    aba: 'captacao',
    etiqueta: 'Novo visual',
    destaque: 'Prioridade agora',
    bullets: ['Motoristas', 'Leads', 'Ordens', 'Motivos'],
  },
]

const cores = {
  blue: { texto: 'text-blue-300', iconeWrap: 'bg-blue-500/10 border-blue-400/20 text-blue-300', glow: 'hover:shadow-[0_35px_90px_-28px_rgba(59,130,246,0.75)] hover:border-blue-300/35', linha: 'from-blue-400/70 to-cyan-300/20', badge: 'bg-blue-500/15 text-blue-200 border-blue-300/20' },
  orange: { texto: 'text-orange-300', iconeWrap: 'bg-orange-500/10 border-orange-400/20 text-orange-300', glow: 'hover:shadow-[0_35px_90px_-28px_rgba(249,115,22,0.72)] hover:border-orange-300/35', linha: 'from-orange-400/75 to-amber-200/20', badge: 'bg-orange-500/15 text-orange-200 border-orange-300/20' },
}

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout } = useApp()
  const [heroVisivel, setHeroVisivel] = useState(false)
  const primeiroNome = usuarioAtual?.nome?.split(' ')[0] || usuarioAtual?.usuario || 'usuário'
  const filial = usuarioAtual?.filial === 'oleo' ? 'Operação do Óleo' : (usuarioAtual?.filial || 'jatai-go')

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
      <div className="fixed inset-0 -z-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(circle at center, black, transparent 78%)', WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 78%)' }} />
      <div className="fixed left-1/2 top-[-180px] -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-blue-600/16 blur-[120px]" />
      <div className="fixed bottom-[-220px] right-[-180px] -z-10 h-[520px] w-[520px] rounded-full bg-orange-500/14 blur-[130px]" />
      <div className="fixed top-[22%] left-[-160px] -z-10 h-[360px] w-[360px] rounded-full bg-emerald-500/10 blur-[120px]" />

      <header className="px-6 sm:px-10 py-7 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-800 rounded-2xl flex items-center justify-center shadow-[0_0_28px_rgba(37,99,235,0.45)]"><span className="text-2xl font-extrabold">A</span></div>
          <div><h1 className="text-2xl font-black tracking-tight">AYRES</h1><p className="text-[10px] uppercase tracking-[0.3em] text-blue-300 font-black">Central 360</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-200 backdrop-blur-xl font-black uppercase tracking-[.12em]">
            {ICONES.bolt}<span>V5 visual novo</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-4 py-2 text-xs text-slate-300 backdrop-blur-xl">
            {ICONES.user}<span>{usuarioAtual?.nome || usuarioAtual?.usuario}</span>
          </div>
          <button type="button" onClick={sair} className="bg-white/[.045] border border-white/10 rounded-full px-4 py-2.5 text-xs font-bold flex items-center gap-2 hover:bg-red-500/10 hover:border-red-400/20 transition-all text-red-300">{ICONES.logout}<span className="hidden sm:inline">SAIR</span></button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <section className={`w-full max-w-7xl mx-auto transition-all duration-1000 ease-out ${heroVisivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[.16em] text-orange-200 mb-5 backdrop-blur-xl">
              {ICONES.shield} Nova central operacional · {filial}
            </div>
            <h2 className="text-4xl sm:text-7xl font-black tracking-tight leading-tight mb-4">
              Central <span className="text-blue-300">AYRES</span> <span className="text-orange-300">360</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-xl max-w-3xl mx-auto leading-relaxed">
              Captação, pendências, estadias e operação do óleo em um fluxo mais claro para a logística.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
            <div className="rounded-3xl border border-white/10 bg-white/[.045] backdrop-blur-xl p-5 text-left">
              <div className="text-2xl mb-2">🎯</div>
              <strong className="block text-white text-lg">Fluxo principal</strong>
              <span className="text-sm text-slate-400">Captar → gerar pendência → lançar → acompanhar</span>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[.045] backdrop-blur-xl p-5 text-left">
              <div className="text-2xl mb-2">🛢️</div>
              <strong className="block text-white text-lg">Óleo separado</strong>
              <span className="text-sm text-slate-400">Usuários e estadias da operação do óleo isolados por filial</span>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[.045] backdrop-blur-xl p-5 text-left">
              <div className="text-2xl mb-2">📊</div>
              <strong className="block text-white text-lg">Dashboard tático</strong>
              <span className="text-sm text-slate-400">Base para ranking, motivos de perda e tomada de decisão</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {modulos.map((m) => {
              const c = cores[m.cor]
              return (
                <button key={m.id} type="button" onClick={() => acessar(m)} onMouseMove={moverGlow} className={`group relative overflow-hidden text-left p-8 sm:p-10 min-h-[430px] rounded-[2.5rem] border border-white/10 bg-[#0c111a]/90 backdrop-blur-xl cursor-pointer transition-all duration-500 hover:-translate-y-2 ${c.glow}`}>
                  <span className={`absolute left-8 right-8 top-0 h-px bg-gradient-to-r ${c.linha}`} />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[2.5rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), ${m.cor === 'blue' ? 'rgba(59,130,246,.18)' : 'rgba(249,115,22,.18)'}, transparent 43%)` }} />
                  <div className="relative flex min-h-[350px] flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-5 mb-8">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border ${c.iconeWrap}`}>{ICONES[m.icon]}</div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${c.badge}`}>{m.etiqueta}</span>
                          <span className="rounded-full border border-white/10 bg-white/[.045] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{m.destaque}</span>
                        </div>
                      </div>
                      <h3 className="text-4xl sm:text-5xl font-black mb-5 tracking-tight leading-tight">Painel de <span className={c.texto}>{m.nome}</span></h3>
                      <p className="text-slate-400 text-base leading-relaxed max-w-md">{m.subtitulo}</p>
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {m.bullets.map((b) => <span key={b} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs font-bold text-slate-300">{b}</span>)}
                      </div>
                      <div className={`flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.045] px-5 py-4 font-black text-sm ${c.texto}`}><span>ENTRAR NO MÓDULO</span>{ICONES.arrowRight}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <p className="text-center text-[11px] text-slate-600 mt-8">Versão visual nova aplicada. Se não aparecer, pressione <span className="text-slate-400">Ctrl + F5</span>.</p>
        </section>
      </main>
    </div>
  )
}
