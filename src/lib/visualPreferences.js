const STORAGE_KEY = 'ayresPreferenciasUsuario'
const THEMES = new Set(['light', 'dark'])
const COLORS = new Set(['yellow', 'blue', 'purple', 'green', 'orange'])
const LANGUAGES = new Set(['pt', 'en'])

export const PRESETS_VISUAIS_AYRES = [
  { id: 'strada', label: 'Strada', detalhe: 'Claro, amarelo e grafite para uma operação direta.', tema: 'light', cor: 'yellow' },
  { id: 'purple-classic', label: 'Roxo clássico', detalhe: 'Violeta escuro e gradientes suaves, inspirado no AYRES antigo.', tema: 'dark', cor: 'purple' },
]

export function selecionarPresetAyres(preferencias, presetId) {
  const preset = PRESETS_VISUAIS_AYRES.find(item => item.id === presetId)
  if (!preset) return { ...preferencias }
  return { ...preferencias, tema: preset.tema, cor: preset.cor }
}

function valorSalvo(storage, key) {
  const raw = storage.getItem(key)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return raw }
}

/** Aceita tanto os valores crus antigos quanto os valores JSON do contexto. */
export function lerPreferenciasAyres(storage = globalThis.localStorage) {
  try {
    const value = valorSalvo(storage, STORAGE_KEY)
    const salvo = value && typeof value === 'object' ? value : {}
    const idioma = salvo.idioma || storage.getItem('idiomaAyres') || 'pt'
    const tema = salvo.tema || storage.getItem('ayresTheme') || valorSalvo(storage, 'temaPainelViaLog') || 'light'
    const cor = salvo.visualVersion === 2 ? (salvo.cor || 'yellow') : 'yellow'
    return {
      idioma: LANGUAGES.has(idioma) ? idioma : 'pt',
      tema: THEMES.has(tema) ? tema : 'light',
      cor: COLORS.has(cor) ? cor : 'yellow',
    }
  } catch {
    return { idioma: 'pt', tema: 'light', cor: 'yellow' }
  }
}

/** Executada antes do render: evita piscar outro tema ou depender do modal. */
export function aplicarPreferenciasAyres(storage = globalThis.localStorage, root = document.documentElement) {
  const pref = lerPreferenciasAyres(storage)
  root.dataset.ayresAccent = pref.cor
  root.dataset.ayresTheme = pref.tema
  root.classList.toggle('dark', pref.tema === 'dark')
  root.lang = pref.idioma === 'en' ? 'en' : 'pt-BR'
  storage.setItem('idiomaAyres', pref.idioma)
  storage.setItem('ayresAccentColor', pref.cor)
  storage.setItem('ayresTheme', pref.tema)
  storage.setItem('temaPainelViaLog', JSON.stringify(pref.tema))
  return pref
}
