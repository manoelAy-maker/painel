import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

const Icon = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const ICONS = {
  truck: <Icon size={28}><path d="M3 7h11v10H3z" /><path d="M14 10h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></Icon>,
  chart: <Icon size={28}><path d="M4 19V9" /><path d="M9 19v-6" /><path d="M14 19v-9" /><path d="M19 19V5" /><path d="M4 15l5-5 4 3 6-7" /></Icon>,
  arrow: <Icon size={18}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></Icon>,
  globe: <Icon size={18}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21" /><path d="M12 3C9.8 5.4 8.7 8.4 8.7 12S9.8 18.6 12 21" /></Icon>,
  lock: <Icon size={18}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>,
  shield: <Icon size={22}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-5" /></Icon>,
  clock: <Icon size={22}><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></Icon>,
  data: <Icon size={22}><path d="M4 19h16" /><path d="M7 16v-5" /><path d="M12 16V7" /><path d="M17 16v-8" /><path d="M6 8l3-3 4 4 5-6" /></Icon>,
  users: <Icon size={22}><path d="M16 11a4 4 0 1 0-8 0" /><path d="M4 20a8 8 0 0 1 16 0" /><circle cx="12" cy="8" r="3" /></Icon>,
  user: <Icon size={16}><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></Icon>,
  logout: <Icon size={16}><path d="M17 16l4-4-4-4" /><path d="M21 12H9" /><path d="M13 20H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h7" /></Icon>,
}

function TruckArt() {
  return (
    <svg className="artSvg truckSvg" viewBox="0 0 390 290" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="truckBody" x1="120" x2="278" y1="80" y2="205" gradientUnits="userSpaceOnUse">
          <stop stopColor="#73B7FF" />
          <stop offset=".45" stopColor="#1F6FFF" />
          <stop offset="1" stopColor="#123CA2" />
        </linearGradient>
        <linearGradient id="truckBox" x1="220" x2="344" y1="45" y2="171" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7BC2FF" />
          <stop offset=".35" stopColor="#2563EB" />
          <stop offset="1" stopColor="#062A78" />
        </linearGradient>
        <linearGradient id="platformBlue" x1="68" x2="338" y1="190" y2="262" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0A1226" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <filter id="blueGlow" x="0" y="0" width="390" height="290" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="18" stdDeviation="14" floodColor="#1D4ED8" floodOpacity=".48" />
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#60A5FA" floodOpacity=".45" />
        </filter>
      </defs>

      <g filter="url(#blueGlow)">
        <path d="M76 205L184 153C196 147 214 146 228 151L328 188C342 193 343 205 331 212L221 272C209 278 189 280 175 275L80 236C65 230 63 212 76 205Z" fill="url(#platformBlue)" />
        <path d="M87 208L186 162C198 156 214 155 227 160L315 192C326 196 326 204 316 210L216 263C205 269 189 270 177 266L91 232C78 227 77 213 87 208Z" fill="#101B33" stroke="#60A5FA" strokeOpacity=".55" strokeWidth="2" />
        <path d="M97 229L176 260C190 266 208 265 221 258L314 209" stroke="#60A5FA" strokeOpacity=".88" strokeWidth="5" strokeLinecap="round" />
      </g>

      <g transform="translate(62 30)" filter="url(#blueGlow)">
        <path d="M111 121L178 92L214 112L145 146L111 121Z" fill="#0B1733" />
        <path d="M168 54L292 20L292 120L168 160V54Z" fill="url(#truckBox)" stroke="#93C5FD" strokeOpacity=".45" />
        <path d="M168 54L128 34L252 4L292 20L168 54Z" fill="#91D4FF" />
        <path d="M292 20L318 35L318 128L292 120V20Z" fill="#0B3C9C" />
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={i} d={`M${181 + i * 13} 58V151`} stroke="#0F3B94" strokeOpacity=".55" />
        ))}
        <path d="M57 130L108 102L156 116L156 166L98 195L57 174V130Z" fill="url(#truckBody)" />
        <path d="M75 119L110 100L144 110L112 128L75 119Z" fill="#B9E2FF" />
        <path d="M76 129L110 111L137 119L103 139L76 129Z" fill="#07162E" opacity=".86" />
        <path d="M57 174L98 195V151L57 130V174Z" fill="#0F3B94" />
        <path d="M98 151L156 123V166L98 195V151Z" fill="#1D4ED8" />
        <path d="M32 175L98 206L208 151" stroke="#0B1020" strokeWidth="18" strokeLinecap="round" />
        {[74, 116, 240, 278].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={190 - (i > 1 ? 15 : 0)} r="18" fill="#020617" />
            <circle cx={x} cy={190 - (i > 1 ? 15 : 0)} r="10" fill="#334155" />
            <circle cx={x} cy={190 - (i > 1 ? 15 : 0)} r="4" fill="#94A3B8" />
          </g>
        ))}
      </g>
    </svg>
  )
}

function ChartArt() {
  return (
    <svg className="artSvg chartSvg" viewBox="0 0 390 290" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="orangePlatform" x1="63" x2="340" y1="191" y2="260" gradientUnits="userSpaceOnUse">
          <stop stopColor="#160D07" />
          <stop offset="1" stopColor="#9A3412" />
        </linearGradient>
        <linearGradient id="orangeBar" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#FDBA74" />
          <stop offset=".52" stopColor="#F97316" />
          <stop offset="1" stopColor="#9A3412" />
        </linearGradient>
        <linearGradient id="darkBar" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#CBD5E1" />
          <stop offset=".45" stopColor="#334155" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
        <filter id="orangeGlow" x="0" y="0" width="390" height="290" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="18" stdDeviation="14" floodColor="#F97316" floodOpacity=".42" />
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#FDBA74" floodOpacity=".38" />
        </filter>
      </defs>

      <g filter="url(#orangeGlow)">
        <path d="M69 204L181 152C195 146 215 146 229 152L327 191C340 196 340 207 327 214L216 273C203 279 184 279 171 274L74 237C59 231 57 210 69 204Z" fill="url(#orangePlatform)" />
        <path d="M82 207L181 162C194 156 211 156 224 161L313 195C324 199 324 207 313 212L214 263C202 269 187 269 175 265L88 232C76 227 73 211 82 207Z" fill="#121826" stroke="#FDBA74" strokeOpacity=".45" strokeWidth="2" />
        <path d="M91 230L176 262C190 267 205 266 218 259L311 212" stroke="#FDBA74" strokeOpacity=".9" strokeWidth="5" strokeLinecap="round" />
      </g>

      <g transform="translate(78 42)" filter="url(#orangeGlow)">
        {[
          [45, 110, 35, 'darkBar'],
          [85, 87, 58, 'darkBar'],
          [125, 66, 79, 'orangeBar'],
          [165, 44, 101, 'darkBar'],
          [205, 18, 127, 'orangeBar'],
        ].map(([x, y, h, grad], i) => (
          <g key={i}>
            <path d={`M${x} ${y}L${x + 28} ${y - 14}L${x + 28} ${y + h}L${x} ${y + h + 14}V${y}Z`} fill={`url(#${grad})`} />
            <path d={`M${x + 28} ${y - 14}L${x + 50} ${y - 4}V${y + h + 24}L${x + 28} ${y + h}V${y - 14}Z`} fill={grad === 'orangeBar' ? '#C2410C' : '#0F172A'} />
            <path d={`M${x} ${y}L${x + 28} ${y - 14}L${x + 50} ${y - 4}L${x + 22} ${y + 10}Z`} fill={grad === 'orangeBar' ? '#FDBA74' : '#94A3B8'} />
          </g>
        ))}
        <path d="M25 122L70 68L105 82L144 38L185 45L236 0" stroke="#FB923C" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M236 0L224 34L258 18Z" fill="#FB923C" />
        <path d="M25 122L70 68L105 82L144 38L185 45L236 0" stroke="#FED7AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

const modules = [
  {
    id: 'estadia',
    name: 'Estadia',
    subtitle: 'Gerencie estadias, pátios, agendamentos e movimentações com total visibilidade e controle operacional.',
    color: 'blue',
    icon: ICONS.truck,
    art: <TruckArt />,
    aba: 'inicio',
  },
  {
    id: 'captacao',
    name: 'Captação',
    subtitle: 'Acompanhe indicadores, desempenho e resultados da captação de cargas em tempo real.',
    color: 'orange',
    icon: ICONS.chart,
    art: <ChartArt />,
    aba: 'captacao',
  },
]

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout } = useApp()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 70)
    return () => clearTimeout(timer)
  }, [])

  const moverGlow = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--x', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--y', `${event.clientY - rect.top}px`)
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
    <main className="ayresPortalRef">
      <style>{`
        .ayresPortalRef,.ayresPortalRef *{box-sizing:border-box}
        .ayresPortalRef{
          min-height:100vh;
          color:#f8fafc;
          position:relative;
          overflow:hidden;
          font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background:
            radial-gradient(circle at 18% 18%, rgba(37,99,235,.22), transparent 28%),
            radial-gradient(circle at 78% 28%, rgba(249,115,22,.18), transparent 30%),
            radial-gradient(circle at 50% 78%, rgba(37,99,235,.10), transparent 36%),
            #020711;
        }
        .ayresPortalRef::before{
          content:'';
          position:absolute;
          inset:0;
          background:
            radial-gradient(rgba(59,130,246,.23) 1px, transparent 1px),
            radial-gradient(rgba(249,115,22,.16) 1px, transparent 1px);
          background-size:18px 18px,24px 24px;
          background-position:0 0,8px 6px;
          opacity:.18;
          mask-image:linear-gradient(to bottom, transparent 0%, black 14%, black 80%, transparent 100%);
          -webkit-mask-image:linear-gradient(to bottom, transparent 0%, black 14%, black 80%, transparent 100%);
          pointer-events:none;
        }
        .ayresPortalRef::after{
          content:'';
          position:absolute;
          inset:0;
          background:
            linear-gradient(120deg, transparent 0 34%, rgba(47,125,255,.08) 45%, transparent 55%),
            linear-gradient(20deg, transparent 0 50%, rgba(255,122,24,.08) 58%, transparent 70%);
          pointer-events:none;
        }
        .portalWrap{position:relative;z-index:2;min-height:100vh;padding:34px 44px 24px;display:flex;flex-direction:column}
        .portalHeader{display:flex;align-items:center;justify-content:space-between;gap:18px}
        .brand{display:flex;align-items:center;gap:14px}
        .brandMark{position:relative;width:54px;height:54px;filter:drop-shadow(0 0 20px rgba(47,125,255,.54))}
        .brandMark::before,.brandMark::after{content:'';position:absolute;background:linear-gradient(135deg,#1d4ed8,#60a5fa);border-radius:8px}
        .brandMark::before{width:20px;height:54px;transform:skewX(-25deg);left:7px}
        .brandMark::after{width:20px;height:42px;transform:skewX(25deg);right:7px;top:0}
        .brand strong{display:block;font-size:38px;line-height:.95;font-weight:950;letter-spacing:-1.9px}
        .brand span{display:block;margin-top:6px;font-size:10px;letter-spacing:1.9px;color:#3b82f6;font-weight:950;text-transform:uppercase}
        .topActions{display:flex;align-items:center;gap:10px}
        .langChip,.userChip,.logoutBtn{height:39px;display:flex;align-items:center;gap:9px;padding:0 14px;border-radius:10px;border:1px solid rgba(148,163,184,.25);background:rgba(2,6,23,.48);backdrop-filter:blur(12px);color:#cbd5e1;font-size:13px;font-weight:700}
        .userChip{border-radius:999px}.logoutBtn{border-radius:999px;color:#fecaca;cursor:pointer;transition:.2s}.logoutBtn:hover{background:rgba(239,68,68,.12);border-color:rgba(248,113,113,.42)}
        .hero{margin-top:32px;text-align:center;transition:.85s ease}.hero.hidden{opacity:0;transform:translateY(18px)}.hero.ready{opacity:1;transform:translateY(0)}
        .hero h1{margin:0;font-size:40px;line-height:1.06;font-weight:950;letter-spacing:-1.5px}.hero h1 span{color:#2f7dff;text-shadow:0 0 24px rgba(47,125,255,.45)}
        .hero p{margin:12px auto 0;color:#a8b2c5;font-size:17px;line-height:1.45;max-width:620px}
        .cards{width:min(1250px,100%);margin:50px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:40px}
        .portalCard{--accent:#2f7dff;--accentRgb:47,125,255;position:relative;min-height:370px;border-radius:18px;border:1px solid rgba(148,163,184,.32);overflow:hidden;padding:34px 36px;text-align:left;color:inherit;cursor:pointer;background:linear-gradient(135deg,rgba(10,20,36,.91),rgba(3,8,18,.68)),radial-gradient(circle at 75% 52%,rgba(var(--accentRgb),.18),transparent 40%);box-shadow:0 28px 90px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.06);transition:transform .35s ease,border-color .35s ease,box-shadow .35s ease}
        .portalCard.orange{--accent:#ff7a18;--accentRgb:255,122,24}
        .portalCard::before{content:'';position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,.07),transparent 28%),radial-gradient(circle at 20% 100%,rgba(var(--accentRgb),.10),transparent 45%);pointer-events:none}
        .portalCard::after{content:'';position:absolute;inset:0;opacity:0;transition:opacity .25s ease;background:radial-gradient(circle at var(--x,50%) var(--y,50%),rgba(var(--accentRgb),.26),transparent 34%);pointer-events:none}
        .portalCard:hover{transform:translateY(-9px);border-color:rgba(var(--accentRgb),.55);box-shadow:0 35px 108px rgba(0,0,0,.48),0 0 48px rgba(var(--accentRgb),.18),inset 0 1px 0 rgba(255,255,255,.09)}
        .portalCard:hover::after{opacity:1}
        .cardContent{position:relative;z-index:3;width:47%}.cardIcon{width:64px;height:64px;border-radius:13px;display:grid;place-items:center;border:1px solid rgba(148,163,184,.24);background:linear-gradient(145deg,rgba(15,23,42,.96),rgba(30,41,59,.75));box-shadow:inset 0 1px 0 rgba(255,255,255,.08);margin-bottom:30px;color:var(--accent)}
        .portalCard h2{font-size:28px;line-height:1.1;font-weight:950;letter-spacing:-.8px;margin:0}.portalCard h2 span{color:var(--accent)}
        .line{width:36px;height:4px;border-radius:99px;background:var(--accent);margin:20px 0 24px;box-shadow:0 0 16px rgba(var(--accentRgb),.8)}
        .portalCard p{color:#a7b0c2;font-size:14px;line-height:1.55;margin:0 0 38px}
        .accessBtn{display:inline-flex;align-items:center;justify-content:center;gap:16px;min-width:176px;height:44px;border-radius:9px;color:white;text-decoration:none;font-size:14px;font-weight:900;background:linear-gradient(135deg,var(--accent),rgba(var(--accentRgb),.78));box-shadow:0 12px 30px rgba(var(--accentRgb),.32),inset 0 1px 0 rgba(255,255,255,.18)}
        .artWrap{position:absolute;right:8px;bottom:16px;width:330px;height:255px;z-index:2;pointer-events:none}.chartArt{right:20px;bottom:20px}.artSvg{width:100%;height:100%;display:block}.truckSvg{transform:scale(1.04);transform-origin:right bottom}.chartSvg{transform:scale(1.04);transform-origin:right bottom}
        .features{width:min(1100px,100%);margin:32px auto 0;border:1px solid rgba(148,163,184,.22);border-radius:16px;background:rgba(7,17,31,.72);backdrop-filter:blur(16px);box-shadow:0 20px 60px rgba(0,0,0,.24);padding:22px 30px;display:grid;grid-template-columns:repeat(4,1fr);gap:28px}.feature{display:flex;align-items:flex-start;gap:14px}.featureIcon{min-width:45px;width:45px;height:45px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(59,130,246,.55);box-shadow:0 0 20px rgba(59,130,246,.18);color:#60a5fa}.feature:nth-child(3) .featureIcon{border-color:rgba(255,122,24,.60);box-shadow:0 0 20px rgba(255,122,24,.20);color:#fb923c}.feature strong{display:block;font-size:14px;font-weight:900;color:#cfe1ff}.feature:nth-child(3) strong{color:#ffb16f}.feature p{margin:4px 0 0;color:#9ca3af;font-size:12px;line-height:1.35}
        .portalFooter{width:min(1100px,100%);margin:24px auto 0;position:relative;text-align:center;color:#7c879b;font-size:13px}.portalFooter span{color:#3b82f6}.secure{position:absolute;right:0;top:-7px;display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid rgba(148,163,184,.22);border-radius:8px;background:rgba(2,6,23,.55);color:#94a3b8;font-size:10px;text-align:left}
        @media(max-width:1120px){.cards{grid-template-columns:1fr}.features{grid-template-columns:repeat(2,1fr)}.portalCard{min-height:350px}}
        @media(max-width:720px){.portalWrap{padding:24px 18px}.portalHeader{align-items:flex-start;flex-direction:column}.topActions{width:100%;justify-content:space-between}.userChip{display:none}.brand strong{font-size:30px}.hero h1{font-size:31px}.hero p{font-size:15px}.cards{margin-top:34px;gap:24px}.portalCard{padding:26px;min-height:560px}.cardContent{width:100%}.artWrap{right:0;bottom:14px;transform:scale(.84);transform-origin:right bottom}.features{grid-template-columns:1fr}.secure{position:static;width:max-content;margin:18px auto 0}}
      `}</style>

      <div className="portalWrap">
        <header className="portalHeader">
          <div className="brand">
            <div className="brandMark" />
            <div><strong>Ayres</strong><span>Logística Inteligente</span></div>
          </div>

          <div className="topActions">
            <div className="langChip">{ICONS.globe}<span>Português</span><span>⌄</span></div>
            <div className="userChip">{ICONS.user}<span>{usuarioAtual?.nome || usuarioAtual?.usuario}</span></div>
            <button type="button" className="logoutBtn" onClick={sair}>{ICONS.logout}<span>Sair</span></button>
          </div>
        </header>

        <section className={`hero ${ready ? 'ready' : 'hidden'}`}>
          <h1>Bem-vindo ao <span>Ayres</span></h1>
          <p>Acesse os painéis estratégicos da plataforma<br />e gerencie suas operações com eficiência.</p>
        </section>

        <section className="cards">
          {modules.map((module) => (
            <button key={module.id} type="button" className={`portalCard ${module.color === 'orange' ? 'orange' : ''}`} onMouseMove={moverGlow} onClick={() => acessar(module)}>
              <div className="cardContent">
                <div className="cardIcon">{module.icon}</div>
                <h2>Painel de <span>{module.name}</span></h2>
                <div className="line" />
                <p>{module.subtitle}</p>
                <span className="accessBtn">Acessar Painel {ICONS.arrow}</span>
              </div>
              <div className={`artWrap ${module.id === 'captacao' ? 'chartArt' : ''}`}>{module.art}</div>
            </button>
          ))}
        </section>

        <section className="features">
          <div className="feature"><div className="featureIcon">{ICONS.shield}</div><div><strong>Segurança Avançada</strong><p>Seus dados protegidos com tecnologia de ponta a ponta.</p></div></div>
          <div className="feature"><div className="featureIcon">{ICONS.clock}</div><div><strong>Tempo Real</strong><p>Informações atualizadas em tempo real para decisões mais assertivas.</p></div></div>
          <div className="feature"><div className="featureIcon">{ICONS.data}</div><div><strong>Inteligência de Dados</strong><p>Relatórios e dashboards inteligentes para impulsionar resultados.</p></div></div>
          <div className="feature"><div className="featureIcon">{ICONS.users}</div><div><strong>Experiência Unificada</strong><p>Navegação integrada entre os principais módulos da plataforma.</p></div></div>
        </section>

        <footer className="portalFooter">
          © 2026 <span>Ayres</span>. Todos os direitos reservados.
          <div className="secure">{ICONS.lock}<div><strong>Conexão segura</strong><br />SSL 256 bits</div></div>
        </footer>
      </div>
    </main>
  )
}
