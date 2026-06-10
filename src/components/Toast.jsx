import { useUiContext } from '../context/hooks'

export default function Toast() {
  const { toasts } = useUiContext()
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.tipo}`}>{t.texto}</div>
      ))}
    </div>
  )
}
