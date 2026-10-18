import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AyresLogo from '../AyresLogo'

const render = (props = {}) => renderToStaticMarkup(createElement(AyresLogo, props))

const collectMatches = (html, pattern) => [...html.matchAll(pattern)].map(([, value]) => value)

describe('AyresLogo', () => {
  it('preserva semântica e dimensões do ícone e da wordmark', () => {
    const icon = render()
    const wordmark = render({ size: 48, showWord: true, className: 'custom-logo' })

    expect(icon).toContain('role="img"')
    expect(icon).toContain('aria-label="AYRES"')
    expect(icon).toContain('class="ayres-logo-svg "')
    expect(icon).toContain('width="42"')
    expect(icon).toContain('height="42"')
    expect(icon).toContain('viewBox="0 0 72 72"')

    expect(wordmark).toContain('class="ayres-logo-svg custom-logo"')
    expect(wordmark).toContain('width="156"')
    expect(wordmark).toContain('height="48"')
    expect(wordmark).toContain('viewBox="0 0 208 72"')
  })

  it('expõe os tokens de cor com os fallbacks Strada, incluindo a wordmark e o glow', () => {
    const html = render({ showWord: true })
    const expectedTokens = [
      ['--ay-logo-highlight', '#FFD3A7'],
      ['--ay-logo-main', '#F28C28'],
      ['--ay-logo-deep', '#A64F12'],
      ['--ay-logo-shadow', '#422006'],
      ['--ay-logo-mid', '#92400E'],
      ['--ay-logo-accent', '#D97820'],
      ['--ay-logo-arrow-mid', '#FFF8F0'],
      ['--ay-logo-arrow-end', '#FFF1DF'],
      ['--ay-logo-outline', '#743B16'],
      ['--ay-logo-glow', '#D97820'],
    ]

    for (const [token, fallback] of expectedTokens) {
      expect(html).toContain(`var(${token}, ${fallback})`)
    }
    expect(html).toContain('var(--ay-ink, #111827)')
    expect(html).toContain('<feFlood')
    expect(html).toContain('<feComposite')
    expect(html).toContain('<feMerge>')
    expect(html).not.toContain('<feColorMatrix')
  })

  it('gera IDs únicos por instância e mantém todas as referências SVG válidas', () => {
    const html = renderToStaticMarkup(createElement('div', null,
      createElement(AyresLogo),
      createElement(AyresLogo, { showWord: true }),
    ))
    const ids = collectMatches(html, /\bid="([^"]+)"/g)
    const references = collectMatches(html, /url\(#([^\)]+)\)/g)
    const filterIds = collectMatches(html, /<filter id="([^"]+)"/g)

    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
    expect(filterIds).toHaveLength(2)
    expect(new Set(filterIds).size).toBe(2)
    expect(references.length).toBeGreaterThan(0)
    expect(references.every((reference) => ids.includes(reference))).toBe(true)
  })
})
