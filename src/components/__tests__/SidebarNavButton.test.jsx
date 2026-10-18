import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import SidebarNavButton from '../SidebarNavButton'

const render = (props = {}) => renderToStaticMarkup(createElement(SidebarNavButton, {
  label: 'Visão planilha',
  icon: createElement('svg', { 'aria-hidden': true }),
  compact: true,
  active: false,
  onClick: () => {},
  ...props,
}))

describe('SidebarNavButton', () => {
  it('preserva o nome acessível mesmo no menu compacto', () => {
    const html = render()
    expect(html).toContain('aria-label="Visão planilha"')
    expect(html).toContain('class="tab-label">Visão planilha')
    expect(html).toContain('<svg')
    expect(html).not.toContain('title=')
  })

  it('indica a página ativa sem mudar o tipo do botão', () => {
    const html = render({ active: true })
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('type="button"')
    expect(html).toContain('class="tab active"')
  })

  it('preserva o indicador de pendências e não mostra contagem zero', () => {
    expect(render({ badge: 4 })).toContain('class="pending-badge">4')
    expect(render({ badge: 0 })).not.toContain('pending-badge')
  })

  it('não renderiza tooltip antes do hover ou foco', () => {
    expect(render()).not.toContain('role="tooltip"')
    expect(render({ compact: false })).not.toContain('role="tooltip"')
  })
})
