import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

const I = ({ children }) => <span className="ico">{children}</span>

const modules = [
  {
    id: 'estadia',
    name: 'Estadia',
    text: 'Gerencie estadias, pátios, agendamentos e movimentações com total visibilidade e controle operacional.',
    color: 'blue',
    aba: 'inicio',
    icon: '🚚',
    art: 'truck',
  },
  {
    id: 'captacao',
    name: 'Captação',
    text: 'Acompanhe indicadores, desempenho e resultados da captação de cargas em tempo real.',
    color: 'orange',
    aba: 'captacao',
    icon: '📈',
    art: 'chart',
  },
]

function TruckArt() {
  return (
    <div className="truckBox" aria-hidden="true">
      <div className="truckBaseShadow" />
      <div className="truck">
        <div className="truckCargo"><i /><i /><i /></div>
        <div className="truckCab"><span /></div>
        <div className="truckChassis" />
        <div className="wheel wA" />
        <div className="wheel wB" />
        <div className="wheel wC" />
      </div>
      <div className="spark s1" />
      <div className="spark s2" />
      <div className="spark s3" />
    </div>
  )
}

function ChartArt() {
  return (
    <div className="chartBox" aria-hidden="true">
      <div className="chartBase" />
      <div className="bars"><b /><b /><b /><b /><b /></div>
      <div className="trend"><span /></div>
    </div>
  )
}

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout } = useApp()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 70)
    return () => clearTimeout(t)
  }, [])

  const glow = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
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
    <main className="portalAyres">
      <style>{`
        .portalAyres,.portalAyres *{box-sizing:border-box}
        .portalAyres{min-height:100vh;position:relative;overflow:hidden;color:#fff;font-family:Inter,Arial,sans-serif;background:radial-gradient(circle at 18% 18%,rgba(37,99,235,.23),transparent 28%),radial-gradient(circle at 80% 28%,rgba(249,115,22,.17),transparent 30%),#020711}
        .portalAyres:before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(59,130,246,.22) 1px,transparent 1px),radial-gradient(rgba(249,115,22,.16) 1px,transparent 1px);background-size:18px 18px,24px 24px;background-position:0 0,8px 6px;opacity:.18;pointer-events:none}
        .wrap{position:relative;z-index:1;min-height:100vh;padding:34px 44px 24px;display:flex;flex-direction:column}
        .top{display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{display:flex;align-items:center;gap:14px}.mark{width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg,#1d4ed8,#60a5fa);box-shadow:0 0 24px rgba(59,130,246,.5);position:relative}.mark:before,.mark:after{content:'';position:absolute;background:white;border-radius:5px;transform:skewX(-22deg)}.mark:before{width:10px;height:33px;left:19px;top:10px}.mark:after{width:10px;height:24px;right:18px;top:12px;opacity:.72}.brand strong{display:block;font-size:38px;font-weight:950;letter-spacing:-1.8px;line-height:.95}.brand span{display:block;margin-top:6px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1.9px;color:#60a5fa}
        .actions{display:flex;gap:10px;align-items:center}.chip,.out{height:39px;display:flex;align-items:center;gap:8px;border:1px solid rgba(148,163,184,.24);background:rgba(2,6,23,.55);border-radius:10px;color:#cbd5e1;padding:0 14px;font-size:13px;font-weight:700}.out{border-radius:999px;color:#fecaca;cursor:pointer}.out:hover{background:rgba(239,68,68,.12);border-color:rgba(248,113,113,.45)}
        .hero{text-align:center;margin-top:32px;transition:.8s ease}.hero.off{opacity:0;transform:translateY(18px)}.hero.on{opacity:1;transform:translateY(0)}.hero h1{font-size:40px;line-height:1.06;margin:0;font-weight:950;letter-spacing:-1.5px}.hero h1 span{color:#2f7dff;text-shadow:0 0 24px rgba(47,125,255,.45)}.hero p{margin:12px auto 0;max-width:620px;color:#a8b2c5;font-size:17px;line-height:1.45}
        .cards{width:min(1250px,100%);margin:50px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:40px}.card{--a:#2f7dff;--rgb:47,125,255;position:relative;min-height:370px;border:1px solid rgba(148,163,184,.32);border-radius:18px;background:linear-gradient(135deg,rgba(10,20,36,.92),rgba(3,8,18,.70)),radial-gradient(circle at 76% 52%,rgba(var(--rgb),.18),transparent 40%);overflow:hidden;padding:34px 36px;text-align:left;color:white;cursor:pointer;box-shadow:0 28px 90px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.06);transition:.32s}.card.orange{--a:#ff7a18;--rgb:255,122,24}.card:after{content:'';position:absolute;inset:0;opacity:0;background:radial-gradient(circle at var(--x,50%) var(--y,50%),rgba(var(--rgb),.27),transparent 34%);transition:.25s;pointer-events:none}.card:hover{transform:translateY(-9px);border-color:rgba(var(--rgb),.55);box-shadow:0 35px 108px rgba(0,0,0,.48),0 0 48px rgba(var(--rgb),.18),inset 0 1px 0 rgba(255,255,255,.09)}.card:hover:after{opacity:1}.txt{position:relative;z-index:3;width:47%}.icon{width:64px;height:64px;border-radius:13px;display:grid;place-items:center;border:1px solid rgba(148,163,184,.24);background:linear-gradient(145deg,rgba(15,23,42,.96),rgba(30,41,59,.75));box-shadow:inset 0 1px 0 rgba(255,255,255,.08);margin-bottom:30px;font-size:26px}.card h2{font-size:28px;line-height:1.1;font-weight:950;letter-spacing:-.8px;margin:0}.card h2 span{color:var(--a)}.line{width:36px;height:4px;border-radius:99px;background:var(--a);margin:20px 0 24px;box-shadow:0 0 16px rgba(var(--rgb),.8)}.card p{color:#a7b0c2;font-size:14px;line-height:1.55;margin:0 0 38px}.btn{display:inline-flex;align-items:center;gap:12px;min-width:176px;height:44px;border-radius:9px;color:white;font-size:14px;font-weight:900;background:linear-gradient(135deg,var(--a),rgba(var(--rgb),.78));box-shadow:0 12px 30px rgba(var(--rgb),.32),inset 0 1px 0 rgba(255,255,255,.18);justify-content:center}
        .truckBox{position:absolute;right:18px;bottom:24px;width:320px;height:235px;z-index:2;pointer-events:none}.truckBaseShadow{position:absolute;left:14px;right:4px;bottom:4px;height:78px;border-radius:35px;background:linear-gradient(135deg,#07111f,#1d4ed8);transform:skewX(-20deg) rotate(-6deg);box-shadow:0 0 0 2px rgba(96,165,250,.34),0 0 30px rgba(47,125,255,.55),0 22px 34px rgba(0,0,0,.48)}.truck{position:absolute;right:18px;bottom:76px;width:250px;height:120px;filter:drop-shadow(0 22px 18px rgba(0,0,0,.42))}.truckCargo{position:absolute;right:0;top:0;width:165px;height:76px;border-radius:12px;background:linear-gradient(135deg,#7dd3fc,#2563eb 48%,#0f2f82);box-shadow:inset 0 1px 0 rgba(255,255,255,.32),0 0 22px rgba(37,99,235,.35)}.truckCargo:before{content:'';position:absolute;inset:0 0 auto;height:20px;border-radius:12px 12px 0 0;background:linear-gradient(90deg,rgba(255,255,255,.45),transparent)}.truckCargo i{position:absolute;top:14px;bottom:10px;width:1px;background:rgba(15,23,42,.3)}.truckCargo i:nth-child(1){left:42px}.truckCargo i:nth-child(2){left:84px}.truckCargo i:nth-child(3){left:126px}.truckCab{position:absolute;left:15px;top:32px;width:92px;height:58px;border-radius:18px 12px 9px 14px;background:linear-gradient(135deg,#60a5fa,#1d4ed8 62%,#0b2a79);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 0 20px rgba(59,130,246,.32)}.truckCab span{position:absolute;left:18px;top:9px;width:45px;height:23px;border-radius:8px;background:linear-gradient(135deg,#e0f2fe,#38bdf8)}.truckChassis{position:absolute;left:8px;right:8px;top:86px;height:16px;border-radius:999px;background:#06111f}.wheel{position:absolute;top:91px;width:34px;height:34px;border-radius:50%;background:#020617;border:7px solid #334155;box-shadow:0 0 0 2px #0f172a,0 8px 12px rgba(0,0,0,.45)}.wA{left:38px}.wB{right:58px}.wC{right:10px}.spark{position:absolute;border-radius:50%;background:#38bdf8;box-shadow:0 0 14px #38bdf8}.s1{left:42px;bottom:73px;width:7px;height:7px}.s2{left:60px;bottom:80px;width:5px;height:5px;opacity:.75}.s3{left:77px;bottom:88px;width:4px;height:4px;opacity:.5}
        .chartBox{position:absolute;right:20px;bottom:22px;width:320px;height:235px;z-index:2}.chartBase{position:absolute;left:24px;right:4px;bottom:4px;height:78px;border-radius:35px;background:linear-gradient(135deg,#17100b,#9a3412);transform:skewX(-20deg) rotate(-6deg);box-shadow:0 0 0 2px rgba(251,146,60,.34),0 0 30px rgba(249,115,22,.48),0 22px 34px rgba(0,0,0,.48)}.bars{position:absolute;right:56px;bottom:60px;display:flex;align-items:flex-end;gap:14px;transform:rotate(-4deg)}.bars b{display:block;width:32px;border-radius:8px 8px 3px 3px;background:linear-gradient(135deg,#cbd5e1,#334155 54%,#020617);box-shadow:8px 6px 0 rgba(0,0,0,.28)}.bars b:nth-child(1){height:54px}.bars b:nth-child(2){height:78px}.bars b:nth-child(3){height:105px;background:linear-gradient(135deg,#fdba74,#f97316 55%,#9a3412)}.bars b:nth-child(4){height:132px}.bars b:nth-child(5){height:158px;background:linear-gradient(135deg,#fdba74,#f97316 55%,#9a3412)}.trend{position:absolute;right:48px;top:34px;width:220px;height:100px;border-top:7px solid #ff7a18;border-right:7px solid #ff7a18;transform:skew(-22deg) rotate(-12deg);filter:drop-shadow(0 0 12px rgba(255,122,24,.75));border-radius:8px}.trend span{position:absolute;right:-16px;top:-18px;width:0;height:0;border-left:18px solid #ff7a18;border-top:12px solid transparent;border-bottom:12px solid transparent}
        .features{width:min(1100px,100%);margin:32px auto 0;border:1px solid rgba(148,163,184,.22);border-radius:16px;background:rgba(7,17,31,.72);backdrop-filter:blur(16px);box-shadow:0 20px 60px rgba(0,0,0,.24);padding:22px 30px;display:grid;grid-template-columns:repeat(4,1fr);gap:28px}.feature{display:flex;align-items:flex-start;gap:14px}.featureIcon{min-width:45px;width:45px;height:45px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(59,130,246,.55);box-shadow:0 0 20px rgba(59,130,246,.18);color:#60a5fa}.feature:nth-child(3) .featureIcon{border-color:rgba(255,122,24,.60);box-shadow:0 0 20px rgba(255,122,24,.20);color:#fb923c}.feature strong{display:block;font-size:14px;font-weight:900;color:#cfe1ff}.feature:nth-child(3) strong{color:#ffb16f}.feature p{margin:4px 0 0;color:#9ca3af;font-size:12px;line-height:1.35}.foot{width:min(1100px,100%);margin:24px auto 0;text-align:center;color:#7c879b;font-size:13px}.foot span{color:#3b82f6}
        @media(max-width:1120px){.cards{grid-template-columns:1fr}.features{grid-template-columns:repeat(2,1fr)}.card{min-height:350px}}
        @media(max-width:720px){.wrap{padding:24px 18px}.top{align-items:flex-start;flex-direction:column}.actions{width:100%;justify-content:space-between}.chip.user{display:none}.brand strong{font-size:30px}.hero h1{font-size:31px}.hero p{font-size:15px}.cards{margin-top:34px;gap:24px}.card{padding:26px;min-height:545px}.txt{width:100%}.truckBox,.chartBox{right:0;bottom:18px;transform:scale(.82);transform-origin:right bottom}.features{grid-template-columns:1fr}}
      `}</style>

      <div className="wrap">
        <header className="top">
          <div className="brand"><div className="mark" /><div><strong>Ayres</strong><span>Logística Inteligente</span></div></div>
          <div className="actions">
            <div className="chip"><I>🌐</I>Português ˅</div>
            <div className="chip user"><I>👤</I>{usuarioAtual?.nome || usuarioAtual?.usuario}</div>
            <button className="out" type="button" onClick={sair}><I>↪</I>Sair</button>
          </div>
        </header>

        <section className={`hero ${ready ? 'on' : 'off'}`}>
          <h1>Bem-vindo ao <span>Ayres</span></h1>
          <p>Acesse os painéis estratégicos da plataforma<br />e gerencie suas operações com eficiência.</p>
        </section>

        <section className="cards">
          {modules.map((m) => (
            <button key={m.id} className={`card ${m.color === 'orange' ? 'orange' : ''}`} type="button" onMouseMove={glow} onClick={() => acessar(m)}>
              <div className="txt">
                <div className="icon">{m.icon}</div>
                <h2>Painel de <span>{m.name}</span></h2>
                <div className="line" />
                <p>{m.text}</p>
                <span className="btn">Acessar Painel →</span>
              </div>
              {m.art === 'truck' ? <TruckArt /> : <ChartArt />}
            </button>
          ))}
        </section>

        <section className="features">
          <div className="feature"><div className="featureIcon">🛡️</div><div><strong>Segurança Avançada</strong><p>Seus dados protegidos com tecnologia de ponta a ponta.</p></div></div>
          <div className="feature"><div className="featureIcon">⏱️</div><div><strong>Tempo Real</strong><p>Informações atualizadas em tempo real para decisões mais assertivas.</p></div></div>
          <div className="feature"><div className="featureIcon">📊</div><div><strong>Inteligência de Dados</strong><p>Relatórios e dashboards inteligentes para impulsionar resultados.</p></div></div>
          <div className="feature"><div className="featureIcon">👥</div><div><strong>Experiência Unificada</strong><p>Navegação integrada entre os principais módulos da plataforma.</p></div></div>
        </section>

        <footer className="foot">© 2026 <span>Ayres</span>. Todos os direitos reservados.</footer>
      </div>
    </main>
  )
}
