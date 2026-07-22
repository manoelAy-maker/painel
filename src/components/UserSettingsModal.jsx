import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import '../styles/user-settings-modal.css'

const IDIOMAS = [
  { id: 'pt', label: 'Português', detalhe: 'Interface padrão do AYRES' },
  { id: 'en', label: 'English', detalhe: 'Portal e textos principais em inglês' },
]

const CORES = [
  { id: 'blue', label: 'Azul AYRES', hex: '#60a5fa' },
  { id: 'purple', label: 'Roxo premium', hex: '#a78bfa' },
  { id: 'green', label: 'Verde operação', hex: '#34d399' },
  { id: 'orange', label: 'Âmbar logística', hex: '#fb923c' },
]

const STORAGE_KEY = 'ayresPreferenciasUsuario'

function lerPreferencias() {
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      idioma: salvo.idioma || localStorage.getItem('idiomaAyres') || 'pt',
      cor: salvo.cor || localStorage.getItem('ayresAccentColor') || 'blue',
    }
  } catch {
    return { idioma: 'pt', cor: 'blue' }
  }
}

export function aplicarPreferenciasAyres() {
  const pref = lerPreferencias()
  document.documentElement.dataset.ayresAccent = pref.cor
  document.documentElement.lang = pref.idioma === 'en' ? 'en' : 'pt-BR'
  localStorage.setItem('idiomaAyres', pref.idioma)
  localStorage.setItem('ayresAccentColor', pref.cor)
  return pref
}

export default function UserSettingsModal({ show, onClose, onOpenPerfil }) {
  const { usuarioAtual, toast } = useApp()
  const [form, setForm] = useState(() => lerPreferencias())

  useEffect(() => {
    aplicarPreferenciasAyres()
    const sync = () => setForm(lerPreferencias())
    window.addEventListener('storage', sync)
    window.addEventListener('ayres:settings', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('ayres:settings', sync)
    }
  }, [])

  useEffect(() => {
    if (show) setForm(lerPreferencias())
  }, [show])

  const corAtual = useMemo(() => CORES.find(c => c.id === form.cor) || CORES[0], [form.cor])
  const idiomaAtual = useMemo(() => IDIOMAS.find(i => i.id === form.idioma) || IDIOMAS[0], [form.idioma])

  if (!show) return null

  const salvar = () => {
    const antes = lerPreferencias()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    localStorage.setItem('idiomaAyres', form.idioma)
    localStorage.setItem('ayresAccentColor', form.cor)
    aplicarPreferenciasAyres()
    window.dispatchEvent(new Event('ayres:settings'))
    toast?.('Configurações salvas.', 'ok')
    onClose?.()
    if (antes.idioma !== form.idioma) {
      setTimeout(() => window.location.reload(), 180)
    }
  }

  const abrirPerfil = () => {
    onClose?.()
    setTimeout(() => onOpenPerfil?.(), 80)
  }

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <section className="settings-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Configurações do usuário">
        <div className="settings-head">
          <div>
            <span>Configurações</span>
            <h2>Preferências do painel</h2>
            <p>Idioma, cor do sistema e acesso rápido ao seu perfil.</p>
          </div>
          <button type="button" className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-body">
          <div className="settings-preview-card">
            <div className="settings-avatar">{usuarioAtual?.foto ? <img src={usuarioAtual.foto} alt="Perfil" /> : (usuarioAtual?.avatar || usuarioAtual?.nome?.[0] || 'A')}</div>
            <div>
              <strong>{usuarioAtual?.nome || usuarioAtual?.usuario || 'Usuário AYRES'}</strong>
              <span>{usuarioAtual?.cargo || 'Operador'} · {usuarioAtual?.filial || 'jatai-go'}</span>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">
              <strong>Linguagem</strong>
              <span>Atual: {idiomaAtual.label}</span>
            </div>
            <div className="settings-option-grid two">
              {IDIOMAS.map(item => (
                <button type="button" key={item.id} className={form.idioma === item.id ? 'active' : ''} onClick={() => setForm(p => ({ ...p, idioma: item.id }))}>
                  <strong>{item.label}</strong>
                  <span>{item.detalhe}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">
              <strong>Cor do painel</strong>
              <span>Atual: {corAtual.label}</span>
            </div>
            <div className="settings-color-grid">
              {CORES.map(cor => (
                <button type="button" key={cor.id} className={form.cor === cor.id ? 'active' : ''} onClick={() => setForm(p => ({ ...p, cor: cor.id }))}>
                  <i style={{ background: cor.hex }} />
                  <span>{cor.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section profile">
            <div>
              <strong>Perfil do usuário</strong>
              <span>Altere nome, foto, e-mail e senha no perfil completo.</span>
            </div>
            <button type="button" className="settings-profile-btn" onClick={abrirPerfil}>Editar perfil</button>
          </div>
        </div>

        <div className="settings-actions">
          <button type="button" className="settings-btn ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="settings-btn primary" onClick={salvar}>Salvar configurações</button>
        </div>
      </section>
    </div>
  )
}
