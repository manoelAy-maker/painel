import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

const modulos = [
  {
    id: 'estadia',
    aba: 'inicio',
    nome: 'Estadia',
    tipo: 'Operação',
    texto: 'Controle de pendências, lançamentos, anexos e finalizações em um só lugar.',
    cor: 'blue',
    tags: ['A lançar', 'Lançadas', 'Histórico'],
    valor: '48h',
    legenda: 'controle de prazo',
  },
  {
    id: 'captacao',
    aba: 'captacao',
    nome: 'Captação',
    tipo: 'Comercial',
    texto: 'Motoristas, contatos, cargas captadas e acompanhamento semanal.',
    cor: 'orange',
    tags: ['Motoristas', 'Contatos', 'Ranking'],
    valor: '100%',
    legenda: 'visão da carteira',
  },
]

function MiniPreview({ cor, valor, legenda }) {
  const accent = cor === 'orange' ? '249,115,22' : '59,130,246'

  return (
    <div className="relative rounded-[28px] border border-white/10 bg-slate-950/45 p-4 shadow-2xl shadow-black/30">
      <div className="mb-4 flex gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: `rgb(${accent})`, boxShadow: `0 0 14px rgba(${accent}, .8)` }} />
        <span className="h-2 w-2 rounded-full bg-slate-500/50" />
        <span className="h-2 w-2 rounded-full bg-slate-600/40" />
      </div>
      <div className="mb-3 rounded-3xl border border-white/10 bg-white/[.045] p-5" style={{ backgroundImage: `radial-gradient(circle at 80% 0, rgba(${accent}, .28), transparent 44%)` }}>
        <strong className="block text-4xl font-black tracking-[-.08em] text-white">{valor}</strong>
        <span className="mt-2 block text-[10px] font-black uppercase tracking-[.16em] text-slate-400">{legenda}</span>
      </div>
      <div className="grid gap-2.5">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex h-10 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-3">
            <i className="h-2.5 w-2.5 rounded-full" style={{ background: `rgb(${accent})`, boxShadow: `0 0 12px rgba(${accent}, .7)` }} />
            <span className="h-2 flex-1 rounded-full bg-slate-400/15" />
            <b className="h-2 w-10 rounded-full" style={{ background: `rgba(${accent}, .35)` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout } = useApp()
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisivel(true), 70)
    return () => clearTimeout(t)
  }, [])

  const moverGlow = (evento) => {
    const rect = evento.currentTarget.getBoundingClientRect()
    evento.currentTarget.style.setProperty('--x', `${evento.clientX - rect.left}px`)
    evento.currentTarget.style.setProperty('--y', `${evento.clientY - rect.top}px`)
  }

  const acessar = (modulo) => {
    localStorage.setItem('moduloInicialViaLog', modulo.id)
    mudarAba(modulo.aba)
    window.dispatchEvent(new Event('ayres:modulo'))
  }

  const sair = () => {
    localStorage.removeItem('moduloInicialViaLog')
    logout()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(37,99,235,.34),transparent_30%),radial-gradient(circle_at_84%_22%,rgba(249,115,22,.22),transparent_31%),linear-gradient(135deg,#020617,#07111f_48%,#020617)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.06)_1px,transparent_1px)] [background-size:54px_54px]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-[min(1240px,calc(100%-48px))] flex-col py-8">
        <header className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-900 text-2xl font-black shadow-[0_0_34px_rgba(59,130,246,.42)]">A</div>
            <div>
              <strong className="block text-4xl font-black leading-none tracking-[-.07em]">Ayres</strong>
              <span className="mt-2 block text-[10px] font-black uppercase tracking-[.28em] text-blue-300">Logística Inteligente</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-xs font-bold text-slate-300 backdrop-blur md:block">Português</div>
            <div className="hidden rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-xs font-bold text-slate-300 backdrop-blur md:block">{usuarioAtual?.nome || usuarioAtual?.usuario}</div>
            <button type="button" onClick={sair} className="rounded-full border border-red-300/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-200 transition hover:bg-red-500/20">Sair</button>
          </div>
        </header>

        <div className={`py-14 text-center transition-all duration-700 ${visivel ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[.045] px-4 py-2 text-[11px] font-black uppercase tracking-[.18em] text-slate-300 backdrop-blur">Portal operacional</div>
          <h1 className="text-5xl font-black leading-none tracking-[-.07em] sm:text-7xl">Bem-vindo ao <span className="bg-gradient-to-br from-blue-200 via-blue-500 to-orange-400 bg-clip-text text-transparent">Ayres</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Escolha o painel para continuar e acompanhe sua operação com uma tela limpa, rápida e profissional.</p>
        </div>

        <div className="grid gap-7 lg:grid-cols-2">
          {modulos.map((modulo) => {
            const accent = modulo.cor === 'orange' ? '249,115,22' : '59,130,246'
            return (
              <button
                key={modulo.id}
                type="button"
                onMouseMove={moverGlow}
                onClick={() => acessar(modulo)}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 text-left shadow-2xl shadow-black/30 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-white/20"
                style={{ boxShadow: `0 32px 92px rgba(0,0,0,.34), 0 0 0 1px rgba(255,255,255,.04), 0 0 70px rgba(${accent}, .06)` }}
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(${accent}, .24), transparent 35%)` }} />
                <span className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 80% 10%, rgba(${accent}, .20), transparent 33%)` }} />

                <div className="relative z-10 grid min-h-[340px] gap-7 md:grid-cols-[1fr_230px] md:items-center">
                  <div>
                    <div className="mb-6 grid h-16 w-16 place-items-center rounded-3xl border border-white/10 bg-white/[.045] text-2xl shadow-inner">{modulo.id === 'estadia' ? '🚚' : '📈'}</div>
                    <span className="mb-4 block text-[11px] font-black uppercase tracking-[.18em]" style={{ color: `rgb(${accent})` }}>{modulo.tipo}</span>
                    <h2 className="text-4xl font-black leading-none tracking-[-.06em] sm:text-5xl">Painel de <span style={{ color: `rgb(${accent})` }}>{modulo.nome}</span></h2>
                    <p className="mt-5 max-w-md text-[15px] leading-7 text-slate-400">{modulo.texto}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {modulo.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[.045] px-3 py-1.5 text-xs font-bold text-slate-300">{tag}</span>)}
                    </div>
                    <span className="mt-7 inline-flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg" style={{ background: `linear-gradient(135deg, rgb(${accent}), rgba(${accent}, .72))` }}>Acessar painel →</span>
                  </div>

                  <MiniPreview cor={modulo.cor} valor={modulo.valor} legenda={modulo.legenda} />
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[.045] p-5 backdrop-blur"><strong className="text-sm font-black">Seguro</strong><p className="mt-1 text-xs leading-5 text-slate-400">Entrada limpa para acessar os módulos principais.</p></div>
          <div className="rounded-3xl border border-white/10 bg-white/[.045] p-5 backdrop-blur"><strong className="text-sm font-black">Rápido</strong><p className="mt-1 text-xs leading-5 text-slate-400">Dois painéis em destaque para não perder tempo.</p></div>
          <div className="rounded-3xl border border-white/10 bg-white/[.045] p-5 backdrop-blur"><strong className="text-sm font-black">Organizado</strong><p className="mt-1 text-xs leading-5 text-slate-400">Base visual pronta para crescer sem bagunça.</p></div>
        </div>

        <footer className="mt-auto pt-6 text-center text-xs text-slate-600">© 2026 <span className="font-black text-blue-300">Ayres</span>. Painel operacional.</footer>
      </section>
    </main>
  )
}
