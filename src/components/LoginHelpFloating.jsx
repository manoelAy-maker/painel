import { useState } from 'react'
import AjudaAcessoModal from './AjudaAcessoModal'

export default function LoginHelpFloating() {
  const [show, setShow] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShow(true)}
        style={{
          position: 'fixed',
          left: 20,
          bottom: 20,
          zIndex: 60,
          border: '1px solid rgba(255,255,255,.12)',
          background: 'rgba(13,17,23,.92)',
          color: '#cbd5e1',
          borderRadius: 999,
          padding: '12px 15px',
          fontWeight: 900,
          fontSize: 12,
          boxShadow: '0 18px 45px rgba(0,0,0,.35)',
          backdropFilter: 'blur(12px)',
        }}
      >
        🔐 Ajuda para entrar
      </button>
      <AjudaAcessoModal show={show} onClose={() => setShow(false)} />
    </>
  )
}
