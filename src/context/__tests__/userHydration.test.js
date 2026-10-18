import { describe, expect, it } from 'vitest'
import { mesclarUsuariosDuranteLeitura } from '../userHydration'

describe('hidratação de usuários durante cadastro', () => {
  it('preserva cadastro confirmado depois que uma leitura começou', () => {
    const antigo = { usuario: 'antigo' }
    const novo = { usuario: 'novo', nome: 'Novo' }
    expect(mesclarUsuariosDuranteLeitura([antigo], [{ versao: 1, usuario: novo }], 0)).toEqual([antigo, novo])
  })
  it('uma leitura posterior continua sendo autoritativa', () => {
    expect(mesclarUsuariosDuranteLeitura([], [{ versao: 1, usuario: { usuario: 'removido' } }], 1)).toEqual([])
  })
  it('não duplica um cadastro também presente na resposta remota e preserva campos da nuvem', () => {
    const dados = mesclarUsuariosDuranteLeitura([{ usuario: 'NOVO', id: 'id-remoto', nome: 'Nome antigo' }], [{ versao: 2, usuario: { usuario: 'novo', nome: 'Nome confirmado' } }], 1)
    expect(dados).toEqual([{ usuario: 'novo', id: 'id-remoto', nome: 'Nome confirmado' }])
  })
  it('preserva recriação confirmada do mesmo login durante a leitura', () => {
    expect(mesclarUsuariosDuranteLeitura([], [{ versao: 3, usuario: { usuario: 'novo' } }], 2)).toEqual([{ usuario: 'novo' }])
  })
})
