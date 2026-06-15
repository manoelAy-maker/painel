import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

const Icon = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const ICONS = {
  truck: (
    <Icon size={28}>
      <path d="M3 7h11v10H3z" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </Icon>
  ),
  chart: (
    <Icon size={28}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-7" />
      <path d="M7 9l4-4 4 3 4-5" />
    </Icon>
  ),
  arrow: (
    <Icon size={18}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </Icon>
  ),
  user: (
    <Icon size={16}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  ),
  logout: (
    <Icon size={16}>
      <path d="M17 16l4-4-4-4" />
      <path d="M21 12H9" />
      <path d="M13 20H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h7" />
    </Icon>
  ),
  shield: (
    <Icon size={22}>
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
      <path d="M9 12l2 2 4-5" />
    </Icon>
  ),
  zap: (
    <Icon size={22}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </Icon>
  ),
  lock: (
    <Icon size={22}>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Icon>
  ),
}

const modulos = [
  {
    id: 'estadia',
    title: 'Painel de Estadia',
    highlight: 'Estadia',
    subtitle: 'Controle de pendências, anexos, lançamentos e finalizações da operação.',
    detail: 'Operacional',
    color: 'blue',
    icon: ICONS.truck,
    aba: 'inicio',
    tags: ['Lançamentos', 'Pendências', 'Histórico'],
    metric: '48h',
    metricLabel: 'controle de prazo',
  },
  {
    id: 'captacao',
    title: 'Painel de Captação',
    highlight: 'Captação',
    subtitle: 'Acompanhe motoristas, contatos, cargas captadas e evolução semanal.',
    detail: 'Comercial',
    color: 'orange',
    icon: ICONS.chart,
    aba: 'captacao',
    tags: ['Motoristas', 'Contatos', 'Ranking'],
    metric: '100%',
    metricLabel: 'visão da carteira',
  },
]

export default function SelecaoPainel() {
  const { usuarioAtual, mudarAba, logout } = useApp()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 80)
    return () => clearTimeout(timer)
  }, [])

  const moverGlow = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`)
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

  const nomeUsuario = usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário'

  return (
    <main className="ayresPortal">
      <style>{`
        .ayresPortal,
        .ayresPortal * {
          box-sizing: border-box;
        }

        .ayresPortal {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          color: #f8fafc;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background:
            radial-gradient(circle at 16% 18%, rgba(37, 99, 235, .26), transparent 30%),
            radial-gradient(circle at 82% 24%, rgba(249, 115, 22, .20), transparent 32%),
            linear-gradient(135deg, #030712 0%, #07111f 45%, #020617 100%);
        }

        .ayresPortal::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(148, 163, 184, .055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, .055) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(circle at center, black 0 55%, transparent 82%);
          -webkit-mask-image: radial-gradient(circle at center, black 0 55%, transparent 82%);
          pointer-events: none;
        }

        .ayresPortal::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, transparent 0 42%, rgba(96, 165, 250, .08) 50%, transparent 61%),
            linear-gradient(30deg, transparent 0 52%, rgba(251, 146, 60, .08) 60%, transparent 72%);
          pointer-events: none;
        }

        .portalShell {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          width: min(1280px, calc(100% - 48px));
          margin: 0 auto;
          padding: 32px 0 24px;
          display: flex;
          flex-direction: column;
        }

        .portalHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .brandMark {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          position: relative;
          display: grid;
          place-items: center;
          isolation: isolate;
          background: linear-gradient(145deg, rgba(59, 130, 246, .95), rgba(29, 78, 216, .58));
          box-shadow: 0 0 36px rgba(59, 130, 246, .35), inset 0 1px 0 rgba(255,255,255,.24);
        }

        .brandMark::before,
        .brandMark::after {
          content: '';
          position: absolute;
          border-radius: 7px;
          background: rgba(255,255,255,.92);
          transform: skewX(-22deg);
        }

        .brandMark::before {
          width: 11px;
          height: 34px;
          left: 18px;
        }

        .brandMark::after {
          width: 11px;
          height: 24px;
          right: 18px;
          top: 12px;
          opacity: .74;
        }

        .brandText strong {
          display: block;
          font-size: 36px;
          line-height: .92;
          letter-spacing: -1.8px;
          font-weight: 950;
        }

        .brandText span {
          display: block;
          margin-top: 7px;
          color: #60a5fa;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .28em;
          text-transform: uppercase;
        }

        .headerActions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .userBadge,
        .logoutButton {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          border: 1px solid rgba(148, 163, 184, .22);
          background: rgba(15, 23, 42, .52);
          color: #cbd5e1;
          border-radius: 999px;
          height: 42px;
          padding: 0 15px;
          font-size: 13px;
          font-weight: 750;
          backdrop-filter: blur(14px);
        }

        .logoutButton {
          color: #fecaca;
          cursor: pointer;
          transition: .2s ease;
        }

        .logoutButton:hover {
          border-color: rgba(248, 113, 113, .48);
          background: rgba(239, 68, 68, .13);
        }

        .heroArea {
          padding: 62px 0 42px;
          text-align: center;
          transition: .85s ease;
        }

        .heroArea.isHidden {
          opacity: 0;
          transform: translateY(18px);
        }

        .heroArea.isReady {
          opacity: 1;
          transform: translateY(0);
        }

        .heroPill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, .20);
          background: rgba(15, 23, 42, .52);
          color: #a8b5ca;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .16em;
          text-transform: uppercase;
          backdrop-filter: blur(14px);
          margin-bottom: 20px;
        }

        .heroTitle {
          margin: 0;
          font-size: clamp(40px, 6vw, 74px);
          line-height: .94;
          letter-spacing: -3.5px;
          font-weight: 950;
        }

        .heroTitle span {
          background: linear-gradient(135deg, #93c5fd, #3b82f6 58%, #fb923c);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 40px rgba(59, 130, 246, .18);
        }

        .heroText {
          margin: 18px auto 0;
          max-width: 660px;
          color: #9aa8bd;
          font-size: 18px;
          line-height: 1.65;
        }

        .cardsGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 34px;
          align-items: stretch;
        }

        .portalCard {
          --accent: #3b82f6;
          --accentSoft: rgba(59, 130, 246, .20);
          position: relative;
          border: 1px solid rgba(148, 163, 184, .18);
          min-height: 430px;
          overflow: hidden;
          border-radius: 32px;
          background:
            linear-gradient(145deg, rgba(15, 23, 42, .94), rgba(2, 6, 23, .78)),
            radial-gradient(circle at 82% 24%, var(--accentSoft), transparent 32%);
          padding: 34px;
          text-align: left;
          cursor: pointer;
          color: inherit;
          box-shadow: 0 32px 90px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.07);
          transition: transform .35s ease, border-color .35s ease, box-shadow .35s ease;
        }

        .portalCard.orange {
          --accent: #f97316;
          --accentSoft: rgba(249, 115, 22, .21);
        }

        .portalCard:hover {
          transform: translateY(-10px);
          border-color: color-mix(in srgb, var(--accent) 55%, transparent);
          box-shadow: 0 42px 115px rgba(0,0,0,.48), 0 0 70px color-mix(in srgb, var(--accent) 20%, transparent), inset 0 1px 0 rgba(255,255,255,.1);
        }

        .portalCard::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), color-mix(in srgb, var(--accent) 24%, transparent), transparent 35%),
            linear-gradient(115deg, rgba(255,255,255,.10), transparent 22%);
          opacity: 0;
          transition: opacity .25s ease;
          pointer-events: none;
        }

        .portalCard:hover::before {
          opacity: 1;
        }

        .portalCard::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: 31px;
          border: 1px solid rgba(255,255,255,.045);
          pointer-events: none;
        }

        .cardInner {
          position: relative;
          z-index: 2;
          min-height: 360px;
          display: grid;
          grid-template-columns: minmax(0, .92fr) minmax(230px, .78fr);
          gap: 24px;
          align-items: center;
        }

        .cardIcon {
          width: 66px;
          height: 66px;
          display: grid;
          place-items: center;
          border-radius: 22px;
          color: var(--accent);
          border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
          background: color-mix(in srgb, var(--accent) 12%, rgba(15,23,42,.75));
          box-shadow: 0 0 30px color-mix(in srgb, var(--accent) 16%, transparent), inset 0 1px 0 rgba(255,255,255,.08);
          margin-bottom: 26px;
        }

        .cardLabel {
          display: inline-flex;
          margin-bottom: 18px;
          color: color-mix(in srgb, var(--accent) 78%, white);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .cardTitle {
          margin: 0;
          font-size: clamp(34px, 4vw, 52px);
          line-height: .96;
          letter-spacing: -2.1px;
          font-weight: 950;
        }

        .cardTitle span {
          color: color-mix(in srgb, var(--accent) 78%, white);
        }

        .cardDescription {
          max-width: 410px;
          margin: 20px 0 28px;
          color: #a4b0c2;
          font-size: 15px;
          line-height: 1.65;
        }

        .tagRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }

        .tag {
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(255,255,255,.045);
          color: #cbd5e1;
          border-radius: 999px;
          padding: 8px 11px;
          font-size: 11px;
          font-weight: 850;
        }

        .cardCta {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-height: 48px;
          padding: 0 18px;
          border-radius: 15px;
          background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 74%, white));
          color: #fff;
          font-size: 13px;
          font-weight: 950;
          box-shadow: 0 16px 36px color-mix(in srgb, var(--accent) 28%, transparent), inset 0 1px 0 rgba(255,255,255,.22);
        }

        .mockup {
          position: relative;
          min-height: 270px;
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, .15);
          background: linear-gradient(145deg, rgba(15,23,42,.74), rgba(2,6,23,.88));
          padding: 18px;
          box-shadow: 0 24px 55px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.06);
        }

        .mockTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .mockDots {
          display: flex;
          gap: 6px;
        }

        .mockDots span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 70%, white);
          opacity: .78;
          box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 60%, transparent);
        }

        .mockPill {
          width: 78px;
          height: 10px;
          border-radius: 999px;
          background: rgba(148, 163, 184, .18);
        }

        .mockMetric {
          border-radius: 22px;
          padding: 20px;
          background: radial-gradient(circle at 80% 0, color-mix(in srgb, var(--accent) 25%, transparent), transparent 44%), rgba(255,255,255,.055);
          border: 1px solid rgba(255,255,255,.07);
          margin-bottom: 14px;
        }

        .mockMetric strong {
          display: block;
          font-size: 42px;
          line-height: 1;
          letter-spacing: -2px;
          color: #fff;
          font-weight: 950;
        }

        .mockMetric span {
          display: block;
          margin-top: 8px;
          color: #9aa8bd;
          font-size: 12px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .mockList {
          display: grid;
          gap: 10px;
        }

        .mockLine {
          height: 42px;
          border-radius: 16px;
          background: rgba(255,255,255,.045);
          border: 1px solid rgba(255,255,255,.06);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
        }

        .mockLine i {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--accent);
          box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 80%, transparent);
        }

        .mockLine span {
          height: 8px;
          flex: 1;
          border-radius: 999px;
          background: rgba(203,213,225,.18);
        }

        .mockLine b {
          width: 42px;
          height: 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 40%, rgba(203,213,225,.18));
        }

        .features {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 34px;
        }

        .feature {
          display: flex;
          gap: 13px;
          align-items: flex-start;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .54);
          border-radius: 22px;
          padding: 18px;
          backdrop-filter: blur(14px);
        }

        .featureIcon {
          min-width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          color: #93c5fd;
          background: rgba(59, 130, 246, .10);
          border: 1px solid rgba(96, 165, 250, .18);
        }

        .feature:nth-child(3) .featureIcon {
          color: #fdba74;
          background: rgba(249, 115, 22, .10);
          border-color: rgba(251, 146, 60, .18);
        }

        .feature strong {
          display: block;
          font-size: 14px;
          color: #e5edf8;
          font-weight: 950;
        }

        .feature p {
          margin: 5px 0 0;
          color: #8d9bb0;
          font-size: 12px;
          line-height: 1.4;
        }

        .footerText {
          margin-top: auto;
          padding-top: 22px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }

        .footerText span {
          color: #60a5fa;
          font-weight: 900;
        }

        @media (max-width: 1080px) {
          .cardsGrid {
            grid-template-columns: 1fr;
          }

          .portalCard {
            min-height: 390px;
          }
        }

        @media (max-width: 760px) {
          .portalShell {
            width: min(100% - 32px, 1280px);
            padding-top: 22px;
          }

          .portalHeader {
            align-items: flex-start;
            flex-direction: column;
          }

          .headerActions {
            width: 100%;
            justify-content: space-between;
          }

          .userBadge {
            max-width: calc(100% - 92px);
            overflow: hidden;
          }

          .userBadge span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .heroArea {
            padding: 42px 0 30px;
          }

          .heroTitle {
            letter-spacing: -2.2px;
          }

          .heroText {
            font-size: 15px;
          }

          .portalCard {
            padding: 24px;
            border-radius: 26px;
            min-height: auto;
          }

          .cardInner {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .mockup {
            min-height: 230px;
          }

          .features {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="portalShell">
        <header className="portalHeader">
          <div className="brand">
            <div className="brandMark" aria-hidden="true" />
            <div className="brandText">
              <strong>Ayres</strong>
              <span>Logística Inteligente</span>
            </div>
          </div>

          <div className="headerActions">
            <div className="userBadge">{ICONS.user}<span>{nomeUsuario}</span></div>
            <button type="button" className="logoutButton" onClick={sair}>{ICONS.logout}<span>Sair</span></button>
          </div>
        </header>

        <section className={`heroArea ${ready ? 'isReady' : 'isHidden'}`}>
          <div className="heroPill">{ICONS.shield} Portal seguro</div>
          <h1 className="heroTitle">Bem-vindo ao <span>Ayres</span></h1>
          <p className="heroText">Escolha o painel para entrar e acompanhe sua operação com uma tela mais limpa, rápida e profissional.</p>
        </section>

        <section className="cardsGrid">
          {modulos.map((modulo) => (
            <button
              key={modulo.id}
              type="button"
              className={`portalCard ${modulo.color === 'orange' ? 'orange' : ''}`}
              onMouseMove={moverGlow}
              onClick={() => acessar(modulo)}
            >
              <div className="cardInner">
                <div>
                  <div className="cardIcon">{modulo.icon}</div>
                  <span className="cardLabel">{modulo.detail}</span>
                  <h2 className="cardTitle">Painel de <span>{modulo.highlight}</span></h2>
                  <p className="cardDescription">{modulo.subtitle}</p>
                  <div className="tagRow">
                    {modulo.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                  </div>
                  <span className="cardCta">Acessar painel {ICONS.arrow}</span>
                </div>

                <div className="mockup" aria-hidden="true">
                  <div className="mockTop">
                    <div className="mockDots"><span /><span /><span /></div>
                    <div className="mockPill" />
                  </div>
                  <div className="mockMetric">
                    <strong>{modulo.metric}</strong>
                    <span>{modulo.metricLabel}</span>
                  </div>
                  <div className="mockList">
                    <div className="mockLine"><i /><span /><b /></div>
                    <div className="mockLine"><i /><span /><b /></div>
                    <div className="mockLine"><i /><span /><b /></div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </section>

        <section className="features">
          <article className="feature">
            <div className="featureIcon">{ICONS.lock}</div>
            <div>
              <strong>Visual mais limpo</strong>
              <p>Entrada direta, sem excesso de elementos na tela.</p>
            </div>
          </article>

          <article className="feature">
            <div className="featureIcon">{ICONS.zap}</div>
            <div>
              <strong>Acesso rápido</strong>
              <p>Dois painéis principais em destaque para entrar sem demora.</p>
            </div>
          </article>

          <article className="feature">
            <div className="featureIcon">{ICONS.chart}</div>
            <div>
              <strong>Operação organizada</strong>
              <p>Base visual preparada para crescer sem ficar bagunçada.</p>
            </div>
          </article>
        </section>

        <div className="footerText">© 2026 <span>Ayres</span>. Painel operacional.</div>
      </section>
    </main>
  )
}
