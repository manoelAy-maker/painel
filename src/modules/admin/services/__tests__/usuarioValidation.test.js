import { describe, expect, it } from 'vitest'
import { validarNovoUsuario } from '../usuarioValidation'

const ator = { usuario: 'admin-teste', cargo: 'Admin', filial: 'jatai' }
const valido = { usuario: 'Novo.Usuario', nome: '  Nome Exemplo  ', senha: 'senha-exemplo-8', cargo: 'Operador', filial: 'jatai' }
const filiais = [{ id: 'jatai-go' }]

describe('validarNovoUsuario', () => {
  it('normaliza nome e login e aceita a filial real do administrador', () => {
    const resultado = validarNovoUsuario(valido, ator, [], filiais)
    expect(resultado.erro).toBeUndefined()
    expect(resultado.dados.usuario).toBe('novo.usuario')
    expect(resultado.dados.nome).toBe('Nome Exemplo')
    expect(resultado.dados.filial).toBe('jatai')
    expect(resultado.dados.avatar).toBe('NE')
    expect(resultado.dados.ativo).toBe(true)
  })
  it.each(['Operador', 'Visualizador', 'Analista Júnior'])('impede cadastro por %s', cargo => {
    expect(validarNovoUsuario(valido, { ...ator, cargo }, [], filiais).erro).toMatch(/Somente administradores/)
  })
  it('impede cadastro sem sessão', () => {
    expect(validarNovoUsuario(valido, null, [], filiais).erro).toBeTruthy()
  })
  it('rejeita login duplicado ignorando caixa e espaços', () => {
    expect(validarNovoUsuario(valido, ator, [{ usuario: ' NOVO.USUARIO ' }], filiais).erro).toBe('Usuário já existe.')
  })
  it.each(['ab', 'nome@empresa', ' usuário '])('rejeita login inválido %s', usuario => {
    expect(validarNovoUsuario({ ...valido, usuario }, ator, [], filiais).erro).toMatch(/login/)
  })
  it('rejeita nome ausente', () => {
    expect(validarNovoUsuario({ ...valido, nome: '' }, ator, [], filiais).erro).toMatch(/nome/)
  })
  it.each(['curta', '        '])('rejeita senha insuficiente', senha => {
    expect(validarNovoUsuario({ ...valido, senha }, ator, [], filiais).erro).toMatch(/senha/)
  })
  it('preserva a senha original sem alterar espaços significativos', () => {
    const senha = '  senha exemplo  '
    expect(validarNovoUsuario({ ...valido, senha }, ator, [], filiais).dados.senha).toBe(senha)
  })
  it('rejeita cargo desconhecido', () => {
    expect(validarNovoUsuario({ ...valido, cargo: 'Root' }, ator, [], filiais).erro).toMatch(/cargo/)
  })
  it('rejeita filial não cadastrada', () => {
    expect(validarNovoUsuario({ ...valido, filial: 'inexistente' }, ator, [], filiais).erro).toMatch(/filial/)
  })
  it('preserva os perfis administrativos já existentes', () => {
    expect(validarNovoUsuario(valido, { ...ator, cargo: 'Coordenador' }, [], filiais).dados).toBeTruthy()
    expect(validarNovoUsuario(valido, { ...ator, cargo: 'Analista Sênior' }, [], filiais).dados).toBeTruthy()
  })
  it('não amplia os privilégios da operação óleo', () => {
    expect(validarNovoUsuario({ ...valido, filial: 'oleo' }, { ...ator, cargo: 'Coordenador', filial: 'oleo' }, [], filiais).erro).toMatch(/administradores/)
  })
})
