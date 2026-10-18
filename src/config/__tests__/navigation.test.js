import { describe, expect, it } from 'vitest'
import { ADMIN_NAV_GROUPS, ADMIN_ONLY_TABS, OPERATOR_NAV_GROUPS, PAGE_META } from '../navigation'
import { podeAdministrar } from '../../utils/roles'

describe('navegação administrativa', () => {
  it('oferece Painel admin apenas na navegação administrativa', () => {
    expect(ADMIN_NAV_GROUPS.flatMap(grupo => grupo.itens).find(item => item.id === 'admin')?.label).toBe('Painel admin')
    expect(OPERATOR_NAV_GROUPS.flatMap(grupo => grupo.itens).some(item => item.id === 'admin')).toBe(false)
  })
  it('marca a aba como exclusiva sem remover as abas operacionais', () => {
    expect(ADMIN_ONLY_TABS).toEqual(['admin'])
    expect(OPERATOR_NAV_GROUPS.flatMap(grupo => grupo.itens).map(item => item.id)).toContain('consultaLancadas')
    expect(OPERATOR_NAV_GROUPS.flatMap(grupo => grupo.itens).map(item => item.id)).toContain('planilha')
  })
  it('exibe título claro no cabeçalho', () => {
    expect(PAGE_META.admin).toEqual(['Painel admin', 'Criar e gerenciar usuários'])
  })
  it('não amplia permissões existentes', () => {
    expect(podeAdministrar({ cargo: 'Operador', filial: 'jatai' })).toBe(false)
    expect(podeAdministrar({ cargo: 'Admin', filial: 'jatai' })).toBe(true)
  })
})
