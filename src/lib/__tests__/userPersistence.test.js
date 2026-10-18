import { describe, expect, it, vi } from 'vitest'
import { inserirUsuarioConfirmado, registroUsuario } from '../userPersistence'

const usuario = { usuario: 'novo.usuario', nome: 'Nome Exemplo', senha: 'hash-ja-calculado', cargo: 'Operador', filial: 'jatai', avatar: 'NE' }
function clientMock(response, existentes={ data: [], error: null }) {
  const single = vi.fn().mockResolvedValue(response)
  const selectInsercao = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select: selectInsercao }))
  const limit = vi.fn().mockResolvedValue(existentes)
  const ilike = vi.fn(() => ({ limit }))
  const selectConsulta = vi.fn(() => ({ ilike }))
  const from = vi.fn(() => ({ insert, select: selectConsulta }))
  return { client: { from }, from, insert, selectInsercao, selectConsulta, ilike, limit }
}

describe('inserirUsuarioConfirmado', () => {
  it('verifica disponibilidade remota, usa insert e pede apenas a confirmação do login', async () => {
    const mock = clientMock({ data: { usuario: 'novo.usuario' }, error: null })
    await expect(inserirUsuarioConfirmado(mock.client, 'ldc_usuarios', usuario)).resolves.toEqual({ usuario: 'novo.usuario' })
    expect(mock.from).toHaveBeenCalledWith('ldc_usuarios')
    expect(mock.ilike).toHaveBeenCalledWith('usuario', 'novo.usuario')
    expect(mock.limit).toHaveBeenCalledWith(1)
    expect(mock.insert).toHaveBeenCalledWith(expect.objectContaining({ usuario: 'novo.usuario', senha: 'hash-ja-calculado', filial: 'jatai' }))
    expect(mock.selectInsercao).toHaveBeenCalledWith('usuario')
  })
  it('rejeita usuário duplicado exato sem sobrescrever a conta', async () => {
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
  it('rejeita login remoto equivalente mesmo que esteja em maiúsculas e fora do cache', async () => {
    const mock=clientMock({data:{usuario:'novo.usuario'},error:null},{data:[{usuario:'Novo.Usuario'}],error:null})
    await expect(inserirUsuarioConfirmado(mock.client,'ldc_usuarios',usuario)).rejects.toMatchObject({code:'23505'})
    expect(mock.insert).not.toHaveBeenCalled()
  })
  it('não insere quando a consulta de disponibilidade falha', async () => {
    const error={code:'42501',message:'consulta bloqueada'}
    const mock=clientMock({data:null,error:null},{data:null,error})
    await expect(inserirUsuarioConfirmado(mock.client,'ldc_usuarios',usuario)).rejects.toEqual(error)
    expect(mock.insert).not.toHaveBeenCalled()
  })
  it('escapa o sublinhado para não bloquear outro login por curinga', async () => {
    const mock=clientMock({data:{usuario:'novo_usuario'},error:null})
    await inserirUsuarioConfirmado(mock.client,'ldc_usuarios',{...usuario,usuario:'novo_usuario'})
    expect(mock.ilike).toHaveBeenCalledWith('usuario','novo\\_usuario')
  })
})
