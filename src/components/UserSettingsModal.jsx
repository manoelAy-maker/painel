import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { aplicarPreferenciasAyres, lerPreferenciasAyres as lerPreferencias, PRESETS_VISUAIS_AYRES, selecionarPresetAyres } from '../lib/visualPreferences'

export { aplicarPreferenciasAyres } from '../lib/visualPreferences'

const IDIOMAS = [
  { id: 'pt', label: 'Português', detalhe: 'Interface padrão do AYRES' },
  { id: 'en', label: 'English', detalhe: 'Portal e textos principais em inglês' },
]

const TEMAS = [
  { id: 'light', label: 'Claro AYRES', detalhe: 'Superfícies claras com a identidade visual escolhida' },
  { id: 'dark', label: 'Grafite AYRES', detalhe: 'Superfícies escuras com a identidade visual escolhida' },
]

const CORES = [
  { id: 'yellow', label: 'Amarelo Strada', hex: '#F28C28' },
  { id: 'blue', label: 'Azul AYRES', hex: '#60a5fa' },
  { id: 'purple', label: 'Violeta AYRES', hex: '#7C3AED' },
  { id: 'green', label: 'Verde operação', hex: '#34d399' },
  { id: 'orange', label: 'Âmbar logística', hex: '#fb923c' },
]

const STORAGE_KEY = 'ayresPreferenciasUsuario'

export default function UserSettingsModal({ show, onClose, onOpenPerfil }) {
  const { usuarioAtual, toast, setTema } = useApp()
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
  const temaAtual = useMemo(() => TEMAS.find(t => t.id === form.tema) || TEMAS[0], [form.tema])
  const presetAtivo = form.cor === 'purple' ? 'purple-classic' : form.cor === 'yellow' ? 'strada' : null

  if (!show) return null

  const salvar = () => {
    const antes = lerPreferencias()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...form, visualVersion: 2 }))
    localStorage.setItem('idiomaAyres', form.idioma)
    localStorage.setItem('ayresAccentColor', form.cor)
    localStorage.setItem('ayresTheme', form.tema)
    aplicarPreferenciasAyres()
    setTema?.(form.tema)
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
            <p>Idioma, tema, cor do sistema e acesso rápido ao seu perfil.</p>
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
              <strong>Tema visual</strong>
              <span>Strada ou Roxo clássico</span>
            </div>
            <div className="settings-theme-presets">
              {PRESETS_VISUAIS_AYRES.map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={`settings-theme-preset ${presetAtivo === item.id ? 'active' : ''}`}
                  data-visual-preset={item.id}
                  aria-pressed={presetAtivo === item.id}
                  onClick={() => setForm(pref => selecionarPresetAyres(pref, item.id))}
                >
                  <i className={`settings-preset-swatch ${item.id}`} aria-hidden="true"><span /><span /><span /></i>
                  <strong>{item.label}</strong>
                  <span>{item.detalhe}</span>
                </button>
              ))}
            </div>
            <div className="settings-section-title">
              <strong>Aparência</strong>
              <span>Atual: {temaAtual.label}</span>
            </div>
            <div className="settings-option-grid two">
              {TEMAS.map(item => (
                <button type="button" key={item.id} className={form.tema === item.id ? 'active' : ''} onClick={() => setForm(p => ({ ...p, tema: item.id }))}>
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
