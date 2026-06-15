import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const Svg = ({ children, ...p }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
)

const ICONES = {
  truck: <Svg><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></Svg>,
  chart: <Svg><path d="M4 19V9" /><path d="M9 19v-6" /><path d="M14 19v-9" /><path d="M19 19V5" /><path d="M4 15l5-5 4 3 6-7" /></Svg>,
  arrowRight: <Svg width="18" height="18"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></Svg>,
  logout: <Svg width="16" height="16"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></Svg>,
  shield: <Svg width="24" height="24"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-5" /></Svg>,
  clock: <Svg width="24" height="24"><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></Svg>,
  data: <Svg width="24" height="24"><path d="M4 19h16" /><path d="M7 16v-5" /><path d="M12 16V7" /><path d="M17 16v-8" /><path d="M6 8l3-3 4 4 5-6" /></Svg>,
  user: <Svg width="16" height="16"><path d="M20 21a8 8 0 10-16 0" /><circle cx="12" cy="7" r="4" /></Svg>,
}

const modulos = [
  {
    id: 'estadia',
    nome: 'Estadia',
    destaque: 'Estadia',
    subtitulo: 'Gerencie estadias, pátios, agendamentos e movimentações com total visibilidade e controle operacional.',
    cor: 'blue',
    aba: 'inicio',
    icon: 'truck',
  },
  {
    id: 'captacao',
    nome: 'Captação',
    destaque: 'Captação',
    subtitulo: 'Acompanhe indicadores, desempenho e resultados da captação de cargas em tempo real.',
    cor: 'orange',
    aba: 'captacao',
    icon: 'chart',
  },
]

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout } = useApp()
  const [heroVisivel, setHeroVisivel] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHeroVisivel(true), 80)
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
    <div className="ayres-portal">
      <style>{`
        .ayres-portal, .ayres-portal *{box-sizing:border-box}
        .ayres-portal{
          min-height:100vh;
          position:relative;
          overflow:hidden;
          color:#f8fafc;
          font-family:'Inter','Plus Jakarta Sans',Arial,sans-serif;
          background:
            radial-gradient(circle at 20% 20%, rgba(37,99,235,.20), transparent 28%),
            radial-gradient(circle at 80% 30%, rgba(249,115,22,.16), transparent 30%),
            radial-gradient(circle at 50% 80%, rgba(37,99,235,.10), transparent 35%),
            #020711;
        }
        .ayres-portal::before{
          content:'';
          position:absolute;
          inset:0;
          background-image:radial-gradient(rgba(59,130,246,.24) 1px, transparent 1px), radial-gradient(rgba(249,115,22,.18) 1px, transparent 1px);
          background-size:18px 18px,24px 24px;
          background-position:0 0,8px 6px;
          opacity:.20;
          mask-image:linear-gradient(to bottom, transparent 0%, black 18%, black 78%, transparent 100%);
          -webkit-mask-image:linear-gradient(to bottom, transparent 0%, black 18%, black 78%, transparent 100%);
          pointer-events:none;
        }
        .ayres-portal::after{
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(120deg, transparent 0 35%, rgba(47,125,255,.08) 45%, transparent 55%), linear-gradient(20deg, transparent 0 50%, rgba(255,122,24,.08) 58%, transparent 70%);
          pointer-events:none;
        }
        .ayres-wrap{position:relative;z-index:2;min-height:100vh;padding:34px 44px 26px;display:flex;flex-direction:column}
        .ayres-header{display:flex;align-items:center;justify-content:space-between;gap:18px}
        .ayres-logo{display:flex;align-items:center;gap:14px}
        .ayres-logo-mark{position:relative;width:54px;height:54px;filter:drop-shadow(0 0 18px rgba(47,125,255,.55))}
        .ayres-logo-mark::before,.ayres-logo-mark::after{content:'';position:absolute;background:linear-gradient(135deg,#1d4ed8,#60a5fa);border-radius:8px}
        .ayres-logo-mark::before{width:20px;height:54px;transform:skewX(-25deg);left:7px}
        .ayres-logo-mark::after{width:20px;height:42px;transform:skewX(25deg);right:7px;top:0}
        .ayres-logo-text strong{display:block;font-size:38px;line-height:1;font-weight:900;letter-spacing:-1.8px}
        .ayres-logo-text span{display:block;margin-top:5px;font-size:10px;letter-spacing:1.8px;color:#3b82f6;font-weight:900;text-transform:uppercase}
        .ayres-top-actions{display:flex;align-items:center;gap:12px}
        .ayres-user-chip,.ayres-logout{display:flex;align-items:center;gap:9px;padding:10px 15px;border:1px solid rgba(148,163,184,.28);border-radius:999px;color:#cbd5e1;background:rgba(2,6,23,.48);backdrop-filter:blur(12px);font-size:13px;font-weight:700}
        .ayres-logout{cursor:pointer;color:#fecaca;transition:.25s}
        .ayres-logout:hover{border-color:rgba(248,113,113,.45);background:rgba(239,68,68,.12);box-shadow:0 0 24px rgba(239,68,68,.14)}
        .ayres-hero{text-align:center;margin-top:36px;transition:all .9s ease}
        .ayres-hero.hide{opacity:0;transform:translateY(18px)}
        .ayres-hero.show{opacity:1;transform:translateY(0)}
        .ayres-hero h1{font-size:46px;font-weight:900;letter-spacing:-1.8px;line-height:1.08;margin:0}
        .ayres-hero h1 span{color:#2f7dff;text-shadow:0 0 22px rgba(47,125,255,.45)}
        .ayres-hero p{margin:14px 0 0;color:#a8b2c5;font-size:18px;line-height:1.55}
        .ayres-cards{width:min(1280px,100%);margin:58px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:46px}
        .ayres-card{
          position:relative;
          min-height:390px;
          border-radius:20px;
          padding:38px 40px;
          overflow:hidden;
          cursor:pointer;
          text-align:left;
          border:1px solid rgba(96,165,250,.28);
          background:linear-gradient(135deg, rgba(10,20,36,.96), rgba(3,8,18,.72)), radial-gradient(circle at 78% 55%, rgba(47,125,255,.24), transparent 42%);
          box-shadow:0 35px 110px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.08), 0 0 45px rgba(47,125,255,.10);
          transition:transform .35s ease,border-color .35s ease,box-shadow .35s ease;
        }
        .ayres-card.orange{border-color:rgba(251,146,60,.28);background:linear-gradient(135deg, rgba(10,20,36,.96), rgba(3,8,18,.72)), radial-gradient(circle at 78% 55%, rgba(255,122,24,.24), transparent 42%);box-shadow:0 35px 110px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.08), 0 0 45px rgba(255,122,24,.10)}
        .ayres-card:hover{transform:translateY(-10px);border-color:rgba(96,165,250,.55);box-shadow:0 42px 120px rgba(0,0,0,.55),0 0 62px rgba(47,125,255,.24),inset 0 1px 0 rgba(255,255,255,.1)}
        .ayres-card.orange:hover{border-color:rgba(251,146,60,.58);box-shadow:0 42px 120px rgba(0,0,0,.55),0 0 62px rgba(255,122,24,.25),inset 0 1px 0 rgba(255,255,255,.1)}
        .ayres-card::before{content:'';position:absolute;inset:0;background:linear-gradient(120deg, rgba(255,255,255,.07), transparent 28%), radial-gradient(circle at 20% 100%, rgba(47,125,255,.10), transparent 45%);pointer-events:none}
        .ayres-card.orange::before{background:linear-gradient(120deg, rgba(255,255,255,.07), transparent 28%), radial-gradient(circle at 20% 100%, rgba(255,122,24,.10), transparent 45%)}
        .ayres-card::after{content:'';position:absolute;inset:0;opacity:0;transition:opacity .25s ease;background:radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(96,165,250,.26), transparent 35%);pointer-events:none}
        .ayres-card.orange::after{background:radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(255,122,24,.27), transparent 35%)}
        .ayres-card:hover::after{opacity:1}
        .ayres-card-content{position:relative;z-index:3;width:46%}
        .ayres-card-icon{width:64px;height:64px;border-radius:13px;display:grid;place-items:center;border:1px solid rgba(148,163,184,.24);background:linear-gradient(145deg, rgba(15,23,42,.96), rgba(30,41,59,.75));box-shadow:inset 0 1px 0 rgba(255,255,255,.08);margin-bottom:30px;color:#60a5fa}
        .ayres-card.orange .ayres-card-icon{color:#fb923c}
        .ayres-card h2{font-size:31px;line-height:1.05;font-weight:900;letter-spacing:-1px;margin:0;color:#fff}
        .ayres-card h2 span{color:#2f7dff}
        .ayres-card.orange h2 span{color:#ff7a18}
        .ayres-line{width:36px;height:4px;border-radius:99px;background:#2f7dff;margin:20px 0 24px;box-shadow:0 0 16px rgba(47,125,255,.8)}
        .ayres-card.orange .ayres-line{background:#ff7a18;box-shadow:0 0 16px rgba(255,122,24,.8)}
        .ayres-card p{color:#aab4c7;font-size:15px;line-height:1.65;margin:0 0 40px}
        .ayres-btn{display:inline-flex;align-items:center;justify-content:center;gap:16px;min-width:190px;height:48px;border-radius:10px;color:white;text-decoration:none;font-size:14px;font-weight:900;background:linear-gradient(135deg,#1f6fff,#358cff);box-shadow:0 12px 30px rgba(47,125,255,.32),inset 0 1px 0 rgba(255,255,255,.18)}
        .ayres-card.orange .ayres-btn{background:linear-gradient(135deg,#f97316,#ff8d1f);box-shadow:0 12px 30px rgba(255,122,24,.32),inset 0 1px 0 rgba(255,255,255,.18)}
        .truck-scene{position:absolute;right:4px;bottom:24px;width:360px;height:270px;z-index:2;perspective:900px;transform:scale(1.08);transform-origin:right bottom;pointer-events:none}
        .platform{position:absolute;left:36px;bottom:5px;width:250px;height:82px;border-radius:26px;background:linear-gradient(145deg,#1e293b,#020617);transform:rotateX(58deg) rotateZ(-14deg);box-shadow:0 0 0 2px rgba(59,130,246,.45),0 0 26px rgba(47,125,255,.9),0 24px 40px rgba(0,0,0,.65)}
        .platform::after{content:'';position:absolute;inset:8px;border-radius:22px;border:1px solid rgba(147,197,253,.20)}
        .truck{position:absolute;right:8px;bottom:92px;width:250px;height:120px;transform:skewY(-8deg);filter:drop-shadow(0 22px 24px rgba(0,0,0,.55))}
        .cabin{position:absolute;left:0;bottom:0;width:92px;height:75px;border-radius:20px 14px 10px 12px;background:linear-gradient(145deg,#60a5fa,#1d4ed8 55%,#0f3b94)}
        .cabin::before{content:'';position:absolute;left:17px;top:12px;width:52px;height:25px;border-radius:8px 8px 4px 4px;background:linear-gradient(135deg,#bfdbfe,#3b82f6)}
        .cabin::after{content:'';position:absolute;left:8px;bottom:13px;width:74px;height:8px;background:#93c5fd;opacity:.7;border-radius:99px}
        .container-box{position:absolute;right:0;bottom:28px;width:168px;height:82px;border-radius:8px 8px 4px 4px;background:repeating-linear-gradient(90deg, rgba(255,255,255,.10) 0 2px, transparent 2px 17px),linear-gradient(145deg,#2563eb,#0f3b94);box-shadow:inset 0 0 0 1px rgba(191,219,254,.30)}
        .wheel{position:absolute;bottom:-13px;width:30px;height:30px;border-radius:50%;background:#020617;border:6px solid #334155;box-shadow:0 0 0 2px #111827}.w1{left:42px}.w2{right:78px}.w3{right:28px}
        .glow-dots{position:absolute;right:82px;bottom:28px;display:flex;gap:10px}.glow-dots span{width:7px;height:7px;border-radius:50%;background:#38bdf8;box-shadow:0 0 14px #38bdf8}
        .chart-scene{position:absolute;right:10px;bottom:24px;width:370px;height:275px;z-index:2;transform:scale(1.08);transform-origin:right bottom;pointer-events:none}
        .chart-base{position:absolute;right:28px;bottom:0;width:250px;height:95px;border-radius:24px;background:linear-gradient(145deg,#111827,#020617);transform:rotateX(58deg) rotateZ(-12deg);box-shadow:0 0 0 2px rgba(255,122,24,.42),0 0 24px rgba(255,122,24,.75),0 26px 42px rgba(0,0,0,.65)}
        .bars{position:absolute;right:55px;bottom:58px;display:flex;align-items:flex-end;gap:14px;transform:skewY(-10deg)}
        .bar3d{width:38px;border-radius:7px 7px 2px 2px;background:linear-gradient(145deg,#64748b,#111827);box-shadow:9px 6px 0 rgba(0,0,0,.28)}.bar3d.orange{background:linear-gradient(145deg,#ffb347,#f97316)}.b1{height:58px}.b2{height:82px}.b3{height:108px}.b4{height:135px}.b5{height:166px}
        .arrow-line{position:absolute;right:42px;top:34px;width:230px;height:140px}.arrow-line svg{width:100%;height:100%;filter:drop-shadow(0 0 12px rgba(255,122,24,.75))}
        .ayres-features{width:min(1100px,100%);margin:40px auto 0;border:1px solid rgba(148,163,184,.20);border-radius:16px;background:rgba(5,13,25,.72);backdrop-filter:blur(16px);box-shadow:0 20px 60px rgba(0,0,0,.24);padding:22px 30px;display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
        .ayres-feature{display:flex;align-items:flex-start;gap:14px}.ayres-feature-icon{min-width:45px;width:45px;height:45px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(59,130,246,.55);box-shadow:0 0 20px rgba(59,130,246,.18);color:#60a5fa}.ayres-feature:nth-child(3) .ayres-feature-icon{border-color:rgba(255,122,24,.60);box-shadow:0 0 20px rgba(255,122,24,.20);color:#fb923c}.ayres-feature strong{display:block;font-size:14px;font-weight:900;color:#cfe1ff}.ayres-feature:nth-child(3) strong{color:#ffb16f}.ayres-feature p{margin:4px 0 0;color:#9ca3af;font-size:12px;line-height:1.35}
        .ayres-footer{width:min(1100px,100%);margin:24px auto 0;text-align:center;color:#7c879b;font-size:13px}.ayres-footer span{color:#3b82f6}
        @media(max-width:1100px){.ayres-cards{grid-template-columns:1fr}.ayres-card{min-height:350px}.ayres-features{grid-template-columns:1fr 1fr}}
        @media(max-width:700px){.ayres-wrap{padding:24px 18px}.ayres-header{align-items:flex-start;flex-direction:column}.ayres-top-actions{width:100%;justify-content:space-between}.ayres-logo-text strong{font-size:30px}.ayres-hero{margin-top:28px}.ayres-hero h1{font-size:32px}.ayres-hero p{font-size:15px}.ayres-cards{margin-top:34px;gap:24px}.ayres-card{padding:26px;min-height:590px}.ayres-card-content{width:100%}.truck-scene,.chart-scene{transform:scale(.85);right:0}.ayres-features{grid-template-columns:1fr}.ayres-user-chip{display:none}}
      `}</style>

      <div className="ayres-wrap">
        <header className="ayres-header">
          <div className="ayres-logo">
            <div className="ayres-logo-mark" />
            <div className="ayres-logo-text">
              <strong>Ayres</strong>
              <span>Logística Inteligente</span>
            </div>
          </div>

          <div className="ayres-top-actions">
            <div className="ayres-user-chip">{ICONES.user}<span>{usuarioAtual?.nome || usuarioAtual?.usuario}</span></div>
            <button type="button" className="ayres-logout" onClick={sair}>{ICONES.logout}<span>Sair</span></button>
          </div>
        </header>

        <section className={`ayres-hero ${heroVisivel ? 'show' : 'hide'}`}>
          <h1>Bem-vindo ao <span>Ayres</span></h1>
          <p>Acesse os painéis estratégicos da plataforma<br />e gerencie suas operações com eficiência.</p>
        </section>

        <section className="ayres-cards">
          {modulos.map((m) => (
            <button key={m.id} type="button" className={`ayres-card ${m.cor === 'orange' ? 'orange' : ''}`} onMouseMove={moverGlow} onClick={() => acessar(m)}>
              <div className="ayres-card-content">
                <div className="ayres-card-icon">{ICONES[m.icon]}</div>
                <h2>Painel de <span>{m.destaque}</span></h2>
                <div className="ayres-line" />
                <p>{m.subtitulo}</p>
                <span className="ayres-btn">Acessar Painel {ICONES.arrowRight}</span>
              </div>

              {m.id === 'estadia' ? (
                <div className="truck-scene">
                  <div className="platform" />
                  <div className="truck">
                    <div className="container-box" />
                    <div className="cabin" />
                    <div className="wheel w1" />
                    <div className="wheel w2" />
                    <div className="wheel w3" />
                  </div>
                  <div className="glow-dots"><span /><span /><span /></div>
                </div>
              ) : (
                <div className="chart-scene">
                  <div className="chart-base" />
                  <div className="bars">
                    <div className="bar3d b1" />
                    <div className="bar3d b2" />
                    <div className="bar3d orange b3" />
                    <div className="bar3d b4" />
                    <div className="bar3d orange b5" />
                  </div>
                  <div className="arrow-line">
                    <svg viewBox="0 0 240 150" fill="none">
                      <path d="M18 126 L60 72 L96 90 L132 45 L169 53 L214 14" stroke="#ff7a18" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M214 14 L201 47 L233 29 Z" fill="#ff7a18" />
                      <path d="M18 126 L60 72 L96 90 L132 45 L169 53 L214 14" stroke="#ffd08a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          ))}
        </section>

        <section className="ayres-features">
          <div className="ayres-feature">
            <div className="ayres-feature-icon">{ICONES.shield}</div>
            <div><strong>Segurança Avançada</strong><p>Seus dados protegidos com tecnologia de ponta a ponta.</p></div>
          </div>
          <div className="ayres-feature">
            <div className="ayres-feature-icon">{ICONES.clock}</div>
            <div><strong>Tempo Real</strong><p>Informações atualizadas para decisões mais assertivas.</p></div>
          </div>
          <div className="ayres-feature">
            <div className="ayres-feature-icon">{ICONES.data}</div>
            <div><strong>Inteligência de Dados</strong><p>Relatórios e dashboards inteligentes para impulsionar resultados.</p></div>
          </div>
        </section>

        <footer className="ayres-footer">© 2026 <span>Ayres</span>. Todos os direitos reservados.</footer>
      </div>
    </div>
  )
}
