export default function PortalScene() {
  return (
    <div className="portal-live-bg" aria-hidden="true">
      <div className="portal-sky-glow" />
      <div className="portal-network">
        <span className="node n1" />
        <span className="node n2" />
        <span className="node n3" />
        <span className="node n4" />
        <span className="node n5" />
        <span className="node n6" />
        <span className="line l1" />
        <span className="line l2" />
        <span className="line l3" />
        <span className="line l4" />
      </div>
      <div className="portal-road">
        <span />
        <span />
      </div>
      <div className="portal-truck truck-one">
        <div className="trailer" />
        <div className="cab"><i /></div>
        <div className="light" />
        <div className="wheel w1" />
        <div className="wheel w2" />
      </div>
      <div className="portal-truck truck-two">
        <div className="trailer" />
        <div className="cab"><i /></div>
        <div className="light" />
        <div className="wheel w1" />
        <div className="wheel w2" />
      </div>
    </div>
  )
}
