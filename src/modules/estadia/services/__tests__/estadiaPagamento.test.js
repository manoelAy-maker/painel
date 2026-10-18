import { describe, expect, it } from 'vitest'
import {
  estadiaPagamentoConfirmado,
  prepararEstadiaPaga,
  prepararReaberturaEstadia,
} from '../estadiaPagamento'

const DATA = '18/10/2026 09:30:00'
const USUARIO = 'ana.pagamentos'

function criarEstadia(status = 'Aberto') {
  return {
    id: 'estadia-1',
    status,
    placa: 'ABC1D23',
    pagoPor: 'Controladoria',
    valor: 'R$ 1.234,56',
    valorCalculado: 1234.56,
    anexos: [{ nome: 'comprovante.pdf', url: '/arquivos/comprovante.pdf' }],
    feitoPor: status === 'Feito' ? 'operacao' : '',
    dataFeito: status === 'Feito' ? '17/10/2026 08:00:00' : '',
    emAnalisePor: status === 'Em análise' ? 'analista' : '',
    dataAnalise: status === 'Em análise' ? '17/10/2026 07:00:00' : '',
    finalizadoPor: '',
    dataFinalizado: '',
    pagamentoConfirmado: false,
    pagamentoConfirmadoPor: '',
    dataPagamentoConfirmado: '',
    historicoItem: [
      { acao: 'Criou estadia lançada', usuario: 'lancador', data: '17/10/2026 06:00:00', detalhes: 'Placa ABC1D23' },
    ],
    campoExtra: { origem: 'teste' },
  }
}

describe('estadiaPagamento', () => {
  it.each(['Aberto', 'Em análise', 'Feito'])('finaliza uma estadia em status %s', (status) => {
    const estadia = criarEstadia(status)
    const antes = structuredClone(estadia)

    const resultado = prepararEstadiaPaga(estadia, USUARIO, DATA)

    expect(resultado).not.toBe(estadia)
    expect(resultado.status).toBe('Finalizado')
    expect(resultado.finalizadoPor).toBe(USUARIO)
    expect(resultado.dataFinalizado).toBe(DATA)
    expect(resultado.pagamentoConfirmado).toBe(true)
    expect(resultado.pagamentoConfirmadoPor).toBe(USUARIO)
    expect(resultado.dataPagamentoConfirmado).toBe(DATA)
    expect(resultado.pagoPor).toBe('Controladoria')
    expect(resultado.valor).toBe(estadia.valor)
    expect(resultado.valorCalculado).toBe(estadia.valorCalculado)
    expect(resultado.anexos).toEqual(estadia.anexos)
    expect(resultado.campoExtra).toEqual(estadia.campoExtra)
    expect(resultado.historicoItem).toHaveLength(2)
    expect(resultado.historicoItem[0]).toEqual({
      acao: 'Marcou como pago e finalizou a estadia',
      usuario: USUARIO,
      data: DATA,
      detalhes: 'Placa ABC1D23',
    })
    expect(estadia).toEqual(antes)
  })

  it('mantém o status legado como Finalizado, nunca como Pago', () => {
    const resultado = prepararEstadiaPaga(criarEstadia('Aberto'), USUARIO, DATA)

    expect(resultado.status).toBe('Finalizado')
    expect(resultado.status).not.toBe('Pago')
  })

  it('é idempotente para estadia já finalizada', () => {
    const estadia = {
      ...criarEstadia('Finalizado'),
      finalizadoPor: 'responsavel-anterior',
      dataFinalizado: '17/10/2026 10:00:00',
      pagamentoConfirmado: false,
      historicoItem: Array.from({ length: 20 }, (_, i) => ({ acao: `Evento ${i}` })),
    }
    const antes = structuredClone(estadia)

    const resultado = prepararEstadiaPaga(estadia, USUARIO, DATA)

    expect(resultado).not.toBe(estadia)
    expect(resultado).toEqual(antes)
    expect(resultado.historicoItem).toHaveLength(20)
    expect(estadia).toEqual(antes)
  })

  it('limita o histórico de pagamento a 20 itens', () => {
    const estadia = {
      ...criarEstadia('Feito'),
      historicoItem: Array.from({ length: 25 }, (_, i) => ({ acao: `Evento ${i}` })),
    }

    const resultado = prepararEstadiaPaga(estadia, USUARIO, DATA)

    expect(resultado.historicoItem).toHaveLength(20)
    expect(resultado.historicoItem[0].acao).toBe('Marcou como pago e finalizou a estadia')
    expect(resultado.historicoItem[19].acao).toBe('Evento 18')
    expect(estadia.historicoItem).toHaveLength(25)
  })

  it('reabre, limpa o fluxo de responsáveis/datas e desfaz a confirmação', () => {
    const estadia = {
      ...criarEstadia('Finalizado'),
      feitoPor: 'operacao',
      dataFeito: '17/10/2026 08:00:00',
      emAnalisePor: 'analista',
      dataAnalise: '17/10/2026 07:00:00',
      finalizadoPor: USUARIO,
      dataFinalizado: DATA,
      pagamentoConfirmado: true,
      pagamentoConfirmadoPor: USUARIO,
      dataPagamentoConfirmado: DATA,
      historicoItem: Array.from({ length: 21 }, (_, i) => ({ acao: `Evento ${i}` })),
    }
    const antes = structuredClone(estadia)

    const resultado = prepararReaberturaEstadia(estadia, 'supervisor', '18/10/2026 10:00:00')

    expect(resultado).not.toBe(estadia)
    expect(resultado.status).toBe('Aberto')
    expect(resultado.reabertoPor).toBe('supervisor')
    expect(resultado.dataReabertura).toBe('18/10/2026 10:00:00')
    expect(resultado.feitoPor).toBe('')
    expect(resultado.dataFeito).toBe('')
    expect(resultado.emAnalisePor).toBe('')
    expect(resultado.dataAnalise).toBe('')
    expect(resultado.finalizadoPor).toBe('')
    expect(resultado.dataFinalizado).toBe('')
    expect(resultado.pagamentoConfirmado).toBe(false)
    expect(resultado.pagamentoConfirmadoPor).toBe('')
    expect(resultado.dataPagamentoConfirmado).toBe('')
    expect(resultado.pagoPor).toBe('Controladoria')
    expect(resultado.valor).toBe(estadia.valor)
    expect(resultado.anexos).toEqual(estadia.anexos)
    expect(resultado.historicoItem).toHaveLength(20)
    expect(resultado.historicoItem[0]).toEqual({
      acao: 'Reabriu a estadia',
      usuario: 'supervisor',
      data: '18/10/2026 10:00:00',
      detalhes: 'Placa ABC1D23',
    })
    expect(estadia).toEqual(antes)
  })

  it('preenche responsável e data de confirmação quando não são informados', () => {
    const resultado = prepararEstadiaPaga(criarEstadia())
    expect(resultado.finalizadoPor).toBe('-')
    expect(resultado.dataFinalizado).toEqual(expect.any(String))
    expect(resultado.dataFinalizado.length).toBeGreaterThan(0)
    expect(resultado.historicoItem[0].data).toBe(resultado.dataFinalizado)
  })

  it('preenche responsável e data da reabertura quando não são informados', () => {
    const resultado = prepararReaberturaEstadia(criarEstadia('Finalizado'))
    expect(resultado.reabertoPor).toBe('-')
    expect(resultado.dataReabertura).toEqual(expect.any(String))
    expect(resultado.dataReabertura.length).toBeGreaterThan(0)
    expect(resultado.historicoItem[0].data).toBe(resultado.dataReabertura)
  })

  it('identifica somente pagamento confirmado em status Finalizado', () => {
    expect(estadiaPagamentoConfirmado({ status: 'Finalizado', pagamentoConfirmado: true })).toBe(true)
    expect(estadiaPagamentoConfirmado({ status: 'Feito', pagamentoConfirmado: true })).toBe(false)
    expect(estadiaPagamentoConfirmado({ status: 'Finalizado', pagamentoConfirmado: 'true' })).toBe(false)
    expect(estadiaPagamentoConfirmado(null)).toBe(false)
  })
})
