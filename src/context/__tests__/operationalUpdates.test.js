import { describe, expect, it, vi } from 'vitest'
import {
  adicionarItemFila,
  aplicarAtualizacaoEstadia,
  gravarItemFila,
  removerItensFilaConfirmados,
} from '../operationalUpdates'

describe('operational updates', () => {
  it('preserva a sequência em dois appends sem mutar a fila', () => {
    const fila = []
    const primeiro = { acao: 'upsert', payload: { local_id: '1' } }
    const segundo = { acao: 'delete', local_id: '2' }

    const aposPrimeiro = adicionarItemFila(fila, primeiro)
    const aposSegundo = adicionarItemFila(aposPrimeiro, segundo)

    expect(aposSegundo).toEqual([primeiro, segundo])
    expect(aposSegundo).not.toBe(fila)
    expect(aposPrimeiro).toEqual([primeiro])
    expect(fila).toEqual([])
  })

  it('aplica patches sequenciais em linhas diferentes e mantém campos extras', () => {
    const estadias = [
      { id: 1, status: 'Aberto', placa: 'ABC1', dadosExtras: { origem: 'local' } },
      { id: '2', status: 'Aberto', placa: 'ABC2', campoExtra: 'preservar' },
    ]

    const aposPrimeiroPatch = aplicarAtualizacaoEstadia(estadias, '1', {
      status: 'Finalizado',
      finalizadoPor: 'ana',
    })
    const resultado = aplicarAtualizacaoEstadia(aposPrimeiroPatch, 2, {
      status: 'Finalizado',
      finalizadoPor: 'bia',
    })

    expect(resultado).toEqual([
      { id: 1, status: 'Finalizado', placa: 'ABC1', dadosExtras: { origem: 'local' }, finalizadoPor: 'ana' },
      { id: '2', status: 'Finalizado', placa: 'ABC2', campoExtra: 'preservar', finalizadoPor: 'bia' },
    ])
    expect(estadias).toEqual([
      { id: 1, status: 'Aberto', placa: 'ABC1', dadosExtras: { origem: 'local' } },
      { id: '2', status: 'Aberto', placa: 'ABC2', campoExtra: 'preservar' },
    ])
  })

  it('remove apenas o item confirmado por identidade e preserva novo item com mesmo local_id', () => {
    const antigo = { acao: 'upsert', payload: { local_id: 'estadia-1', versao: 1 } }
    const novo = { acao: 'upsert', payload: { local_id: 'estadia-1', versao: 2 } }
    const fila = [antigo, novo]

    const resultado = removerItensFilaConfirmados(fila, [antigo])

    expect(resultado).toEqual([novo])
    expect(resultado[0]).toBe(novo)
    expect(fila).toEqual([antigo, novo])
  })

  it('rejeita quando o upsert retorna error', async () => {
    const erro = new Error('upsert falhou')
    const upsert = vi.fn().mockResolvedValue({ data: null, error: erro })
    const client = { from: vi.fn(() => ({ upsert })) }
    const item = { acao: 'upsert', payload: { local_id: '1', status: 'Finalizado' } }

    await expect(gravarItemFila(client, 'operacional', item)).rejects.toBe(erro)
    expect(client.from).toHaveBeenCalledWith('operacional')
    expect(upsert).toHaveBeenCalledWith(item.payload, { onConflict: 'local_id' })
  })

  it('rejeita quando o delete retorna error', async () => {
    const erro = new Error('delete falhou')
    const eq = vi.fn().mockResolvedValue({ data: null, error: erro })
    const deleteMethod = vi.fn(() => ({ eq }))
    const client = { from: vi.fn(() => ({ delete: deleteMethod })) }
    const item = { acao: 'delete', local_id: 42 }

    await expect(gravarItemFila(client, 'operacional', item)).rejects.toBe(erro)
    expect(client.from).toHaveBeenCalledWith('operacional')
    expect(deleteMethod).toHaveBeenCalledWith()
    expect(eq).toHaveBeenCalledWith('local_id', '42')
  })

  it('resolve e retorna a resposta em upsert e delete bem-sucedidos', async () => {
    const upsertResponse = { data: { local_id: '1' }, error: null }
    const upsert = vi.fn().mockResolvedValue(upsertResponse)
    const upsertClient = { from: vi.fn(() => ({ upsert })) }
    const upsertItem = { acao: 'upsert', payload: { local_id: '1' } }

    await expect(gravarItemFila(upsertClient, 'operacional', upsertItem)).resolves.toBe(upsertResponse)

    const deleteResponse = { data: null, error: null }
    const eq = vi.fn().mockResolvedValue(deleteResponse)
    const deleteMethod = vi.fn(() => ({ eq }))
    const deleteClient = { from: vi.fn(() => ({ delete: deleteMethod })) }
    const deleteItem = { acao: 'delete', local_id: '1' }

    await expect(gravarItemFila(deleteClient, 'operacional', deleteItem)).resolves.toBe(deleteResponse)
  })

  it('rejeita ação desconhecida', async () => {
    const client = { from: vi.fn() }

    await expect(gravarItemFila(client, 'operacional', { acao: 'merge' })).rejects.toThrow('Ação de fila desconhecida')
    expect(client.from).not.toHaveBeenCalled()
  })
})
