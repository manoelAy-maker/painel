import { describe, it, expect } from 'vitest'
import { aplicarPreferenciasAyres, lerPreferenciasAyres, selecionarPresetAyres } from '../visualPreferences'

function storage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  }
}

describe('Preferências visuais AYRES', () => {
  it('começa claro e amarelo sem preferência anterior', () => {
    expect(lerPreferenciasAyres(storage())).toEqual({ idioma: 'pt', tema: 'light', cor: 'yellow' })
  })

  it('preserva o tema escuro salvo no formato cru histórico', () => {
    expect(lerPreferenciasAyres(storage({ temaPainelViaLog: 'dark' })).tema).toBe('dark')
  })

  it('preserva o tema escuro salvo como JSON', () => {
    expect(lerPreferenciasAyres(storage({ temaPainelViaLog: '"dark"' })).tema).toBe('dark')
  })

  it('migra as cores antigas para a identidade amarela solicitada', () => {
    const s = storage({ ayresPreferenciasUsuario: JSON.stringify({ cor: 'blue', tema: 'dark' }) })
    expect(lerPreferenciasAyres(s)).toEqual({ idioma: 'pt', tema: 'dark', cor: 'yellow' })
  })

  it('mantém a cor e o idioma escolhidos explicitamente na nova versão', () => {
    const s = storage({ ayresPreferenciasUsuario: JSON.stringify({ cor: 'purple', idioma: 'en', tema: 'dark', visualVersion: 2 }), temaPainelViaLog: 'light' })
    expect(lerPreferenciasAyres(s)).toEqual({ idioma: 'en', tema: 'dark', cor: 'purple' })
  })

  it('normaliza preferências inválidas sem interromper o aplicativo', () => {
    const s = storage({ ayresPreferenciasUsuario: JSON.stringify({ cor: 'invalid', idioma: 'invalid', tema: 'invalid', visualVersion: 2 }) })
    expect(lerPreferenciasAyres(s)).toEqual({ idioma: 'pt', tema: 'light', cor: 'yellow' })
  })

  it('aplica atributos antes de abrir configurações e mantém JSON para o contexto', () => {
    const s = storage({ ayresPreferenciasUsuario: JSON.stringify({ cor: 'yellow', idioma: 'en', tema: 'dark', visualVersion: 2 }) })
    const classes = new Set()
    const root = { dataset: {}, classList: { toggle: (name, active) => active ? classes.add(name) : classes.delete(name) } }
    aplicarPreferenciasAyres(s, root)
    expect(root.dataset).toEqual({ ayresAccent: 'yellow', ayresTheme: 'dark' })
    expect(root.lang).toBe('en')
    expect(classes.has('dark')).toBe(true)
    expect(JSON.parse(s.getItem('temaPainelViaLog'))).toBe('dark')
  })

  it('seleciona Roxo clássico em escuro sem mudar o idioma ou o objeto original', () => {
    const anterior = { idioma: 'en', tema: 'light', cor: 'yellow' }
    expect(selecionarPresetAyres(anterior, 'purple-classic')).toEqual({ idioma: 'en', tema: 'dark', cor: 'purple' })
    expect(anterior).toEqual({ idioma: 'en', tema: 'light', cor: 'yellow' })
  })

  it('retorna ao Strada claro em um clique', () => {
    expect(selecionarPresetAyres({ idioma: 'pt', tema: 'dark', cor: 'purple' }, 'strada')).toEqual({ idioma: 'pt', tema: 'light', cor: 'yellow' })
  })

  it('ignora um preset desconhecido sem apagar preferências', () => {
    const pref = { idioma: 'pt', tema: 'dark', cor: 'green' }
    expect(selecionarPresetAyres(pref, 'inexistente')).toEqual(pref)
  })

  it('reaplica Roxo clássico salvo antes de renderizar a página', () => {
    const pref = selecionarPresetAyres({ idioma: 'pt', tema: 'light', cor: 'yellow' }, 'purple-classic')
    const s = storage({ ayresPreferenciasUsuario: JSON.stringify({ ...pref, visualVersion: 2 }) })
    const classes = new Set()
    const root = { dataset: {}, classList: { toggle: (name, active) => active ? classes.add(name) : classes.delete(name) } }
    expect(aplicarPreferenciasAyres(s, root)).toEqual(pref)
    expect(root.dataset).toEqual({ ayresAccent: 'purple', ayresTheme: 'dark' })
    expect(classes.has('dark')).toBe(true)
    expect(s.getItem('ayresAccentColor')).toBe('purple')
  })
})
