import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function SidebarNavButton({ label, icon, active, compact, badge, onClick }) {
  const buttonRef = useRef(null)
  const hideTimer = useRef(null)
  const tooltipId = useId()
  const [position, setPosition] = useState(null)
  const visible = compact && position !== null

  const cancelHide = () => {
    window.clearTimeout(hideTimer.current)
    hideTimer.current = null
  }

  const hide = () => {
    cancelHide()
    setPosition(null)
  }

  const show = () => {
    cancelHide()
    if (!compact || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const top = Math.min(window.innerHeight - 24, Math.max(24, rect.top + rect.height / 2))
    setPosition({ left: rect.right + 12, top })
  }

  const scheduleHide = () => {
    cancelHide()
    hideTimer.current = window.setTimeout(() => setPosition(null), 120)
  }

  useEffect(() => () => window.clearTimeout(hideTimer.current), [])

  useEffect(() => {
    if (!visible) return
    const dismiss = () => {
      window.clearTimeout(hideTimer.current)
      setPosition(null)
    }
    const onKeyDown = (event) => { if (event.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', dismiss)
    window.addEventListener('scroll', dismiss, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('scroll', dismiss, true)
    }
  }, [visible])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`tab ${active ? 'active' : ''}`}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        aria-describedby={visible ? tooltipId : undefined}
        onPointerEnter={(event) => { if (event.pointerType !== 'touch') show() }}
        onPointerLeave={scheduleHide}
        onFocus={show}
        onBlur={hide}
        onPointerDown={hide}
        onClick={() => { hide(); onClick() }}
      >
        <span className="tab-icon">{icon}</span>
        <span className="tab-label">{label}</span>
        {badge > 0 && <span className="pending-badge">{badge}</span>}
      </button>
      {visible && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          className="ayres-nav-tooltip"
          style={{ left: position.left, top: position.top }}
          onPointerEnter={cancelHide}
          onPointerLeave={scheduleHide}
        >
          {label}
        </div>,
        document.body,
      )}
    </>
  )
}
