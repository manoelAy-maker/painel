import { useEffect, useId, useRef, useState } from 'react'

export default function EstadiaActionMenu({ items, disabled = false }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onOutside = event => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const onEscape = event => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onOutside)
    window.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('pointerdown', onOutside)
      window.removeEventListener('keydown', onEscape)
    }
  }, [open])

  useEffect(() => { if (disabled) setOpen(false) }, [disabled])

  return (
    <div ref={rootRef} className="consulta-pro-more">
      <button ref={buttonRef} type="button" className="consulta-pro-light small" disabled={disabled} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}>
        Mais opções <span aria-hidden="true">⋯</span>
      </button>
      {open && <div id={panelId} className="consulta-pro-more-panel" role="group" aria-label="Mais ações da estadia">
        {items.filter(Boolean).map(item => item.href ? (
          <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>{item.label}</a>
        ) : (
          <button key={item.label} type="button" className={item.danger ? 'danger' : ''} onClick={() => { setOpen(false); item.onClick?.() }}>{item.label}</button>
        ))}
      </div>}
    </div>
  )
}
