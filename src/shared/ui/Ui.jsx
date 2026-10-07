export function UiCard({ className = '', children, ...props }) {
  return <section className={`ui-card ${className}`.trim()} {...props}>{children}</section>
}

export function UiButton({ variant = 'default', className = '', children, ...props }) {
  return <button className={`ui-btn ui-btn-${variant} ${className}`.trim()} {...props}>{children}</button>
}

export function UiInput({ className = '', ...props }) {
  return <input className={`ui-input ${className}`.trim()} {...props} />
}

export function UiSelect({ className = '', children, ...props }) {
  return <select className={`ui-input ${className}`.trim()} {...props}>{children}</select>
}

export function UiBadge({ tone = 'default', className = '', children, ...props }) {
  return <span className={`ui-badge ui-badge-${tone} ${className}`.trim()} {...props}>{children}</span>
}
