import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

const modulos = [
  {
    id: 'estadia',
    aba: 'inicio',
    nome: 'Estadia',
    tipo: 'Operação',
    texto: 'Controle de pendências, lançamentos, anexos e finalizações em um só lugar.',
    emoji: '🚚',
    classe: 'from-blue-500 to-cyan-400 text-blue-200 shadow-blue-500/20',
    borda: 'hover:border-blue-400/40 hover:shadow-blue-500/20',
    tags: ['A lançar', 'Lançadas', 'Histórico'],
  },
  {
    id: 'captacao',
    aba: 'captacao',
    nome: 'Captação',
    tipo: 'Comercial',
    texto: 'Motoristas, contatos, cargas captadas e acompanhamento semanal.',
    emoji: '📈',
    classe: 'from-orange-500 to-amber-300 text-orange-200 shadow-orange-500/20',
    borda: 'hover:border-orange-400/40 hover:shadow-orange-500/20',
    tags: ['Motoristas', 'Contatos', 'Ranking'],
  },
]

function Preview({ modulo }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-2xl shadow-black/30">
      <div className="mb-4 flex gap-1.5">
        <span className="h-2 w-2 rounded-full bg-white/80" />
        <span className="h-2 w-2 rounded-full bg-white/30" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
      </div>
      <div className="mb-3 rounded-3xl border border-white/10 bg-white/[.055] p-5">
        <strong className="block text-4xl font-black tracking-tight text-white">{modulo.id === 'estadia' ? '48h' : '100%'}</strong>
        <span className="mt-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{modulo.id === 'estadia' ? 'controle de prazo' : 'carteira ativa'}</span>
      </div>
      <div className="grid gap-2.5">
        {modulo.tags.map((tag) => (
          <div key={tag} className="flex h-10 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-3">
            <i className="h-2.5 w-2.5 rounded-full bg-white/70" />
            <span className="h-2 flex-1 rounded-full bg-white/10" />
            <b className="h-2 w-10 rounded-full bg-white/20" />
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
    const t = setTimeout(() => setVisivel(true), 80)
    return () => clearTimeout(t)
  }, [])

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
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-900 text-2xl font-black shadow-2xl shadow-blue-500/30">A</div>
            <div>
              <strong className="block text-4xl font-black leading-none tracking-tight">Ayres</strong>
              <span className="mt-2 block text-xs font-black uppercase tracking-widest text-blue-300">Logística Inteligente</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 backdrop-blur md:block">Português</div>
            <div className="hidden max-w-[220px] truncate rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 backdrop-blur md:block">{usuarioAtual?.nome || usuarioAtual?.usuario}</div>
            <button type="button" onClick={sair} className="rounded-full border border-red-300/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-200 transition hover:bg-red-500/20">Sair</button>
          </div>
        </header>

        <div className={`py-14 text-center transition-all duration-700 ${visivel ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-300 backdrop-blur">Portal operacional</div>
          <h1 className="text-5xl font-black leading-none tracking-tight sm:text-7xl">Bem-vindo ao <span className="text-blue-300">Ayres</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Acesse os painéis principais com uma entrada limpa, rápida e organizada.</p>
        </div>

        <div className="grid gap-7 lg:grid-cols-2">
          {modulos.map((modulo) => (
            <button
              key={modulo.id}
              type="button"
              onClick={() => acessar(modulo)}
              className={`group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.035] p-8 text-left shadow-2xl shadow-black/30 backdrop-blur-xl transition duration-300 hover:-translate-y-2 ${modulo.borda}`}
            >
              <div className="grid min-h-[340px] gap-7 md:grid-cols-[1fr_230px] md:items-center">
                <div>
                  <div className="mb-6 grid h-16 w-16 place-items-center rounded-3xl border border-white/10 bg-white/[.06] text-2xl shadow-inner">{modulo.emoji}</div>
                  <span className={`mb-4 block text-xs font-black uppercase tracking-widest ${modulo.classe}`}>{modulo.tipo}</span>
                  <h2 className="text-4xl font-black leading-none tracking-tight sm:text-5xl">Painel de <span className={modulo.classe}>{modulo.nome}</span></h2>
                  <p className="mt-5 max-w-md text-[15px] leading-7 text-slate-400">{modulo.texto}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {modulo.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[.045] px-3 py-1.5 text-xs font-bold text-slate-300">{tag}</span>)}
                  </div>
                  <span className={`mt-7 inline-flex rounded-2xl bg-gradient-to-br px-5 py-3 text-sm font-black text-white shadow-lg ${modulo.classe}`}>Acessar painel →</span>
                </div>
                <Preview modulo={modulo} />
              </div>
            </button>
          ))}
        </div>

        <footer className="mt-auto pt-8 text-center text-xs text-slate-600">© 2026 <span className="font-black text-blue-300">Ayres</span>. Painel operacional.</footer>
      </section>
    </main>
  )
}
