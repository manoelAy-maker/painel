import { describe, expect, it, vi } from 'vitest'
import { inserirUsuarioConfirmado, registroUsuario } from '../userPersistence'

const usuario = { usuario: 'novo.usuario', nome: 'Nome Exemplo', senha: 'hash-ja-calculado', cargo: 'Operador', filial: 'jatai', avatar: 'NE' }
function clientMock(response) {
  const single = vi.fn().mockResolvedValue(response)
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select }))
  const from = vi.fn(() => ({ insert }))
  return { client: { from }, from, insert, select, single }
}

describe('inserirUsuarioConfirmado', () => {
  it('usa insert, não upsert, e pede apenas a confirmação do login', async () => {
    const mock = clientMock({ data: { usuario: 'novo.usuario' }, error: null })
    await expect(inserirUsuarioConfirmado(mock.client, 'ldc_usuarios', usuario)).resolves.toEqual({ usuario: 'novo.usuario' })
    expect(mock.from).toHaveBeenCalledWith('ldc_usuarios')
    expect(mock.insert).toHaveBeenCalledWith(expect.objectContaining({ usuario: 'novo.usuario', senha: 'hash-ja-calculado', filial: 'jatai', cargo: 'Operador' }))
    expect(mock.select).toHaveBeenCalledWith('usuario')
  })
  it('rejeita usuário duplicado sem sobrescrever a conta', async () => {
    const erro = { code: '23505', message: 'duplicate' }
    const mock = clientMock({ data: null, error: erro })
    await expect(inserirUsuarioConfirmado(mock.client, 'ldc_usuarios', usuario)).rejects.toEqual(erro)
  })
  it('rejeita erro retornado pelo banco', async () => {
    const erro = { code: '42501', message: 'not allowed' }
    const mock = clientMock({ data: null, error: erro })
    await expect(inserirUsuarioConfirmado(mock.client, 'ldc_usuarios', usuario)).rejects.toEqual(erro)
  })
  it.each([null, { usuario: 'outro.usuario' }])('não confirma resposta ausente ou diferente', async data => {
    const mock = clientMock({ data, error: null })
    await expect(inserirUsuarioConfirmado(mock.client, 'ldc_usuarios', usuario)).rejects.toThrow(/não confirmou/)
  })
  it('preserva campos e hash no formato atual', () => {
    expect(registroUsuario(usuario)).toMatchObject({ usuario: 'novo.usuario', senha: 'hash-ja-calculado', nome: 'Nome Exemplo', cargo: 'Operador', filial: 'jatai', ativo: true })
  })
})
