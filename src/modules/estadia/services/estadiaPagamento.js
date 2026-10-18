const LIMITE_HISTORICO_ITEM = 20
const EVENTO_PAGAMENTO = 'Marcou como pago e finalizou a estadia'
const EVENTO_REABERTURA = 'Reabriu a estadia'

function historicoComEvento(estadia, acao, usuario, data) {
  const historicoAnterior = Array.isArray(estadia?.historicoItem)
    ? estadia.historicoItem
    : []

  return [
    {
      acao,
      usuario,
      data,
      detalhes: `Placa ${estadia?.placa || '-'}`,
    },
    ...historicoAnterior,
  ].slice(0, LIMITE_HISTORICO_ITEM)
}

/**
 * Prepara uma estadia para confirmação de pagamento e finalização.
 * A função não muta a estadia recebida e mantém os campos já existentes.
 */
export function prepararEstadiaPaga(
  estadia,
  usuario = '-',
  data = new Date().toLocaleString('pt-BR'),
) {
  const atual = estadia || {}

  // Finalização é idempotente: não duplica histórico nem altera os dados já salvos.
  if (atual.status === 'Finalizado') return { ...atual }

  return {
    ...atual,
    status: 'Finalizado',
    finalizadoPor: usuario,
    dataFinalizado: data,
    pagamentoConfirmado: true,
    pagamentoConfirmadoPor: usuario,
    dataPagamentoConfirmado: data,
    historicoItem: historicoComEvento(atual, EVENTO_PAGAMENTO, usuario, data),
  }
}

/**
 * Reabre uma estadia, removendo os responsáveis/datas do fluxo anterior e
 * desfazendo a confirmação de pagamento sem apagar o departamento pagador.
 */
export function prepararReaberturaEstadia(estadia, usuario = '-', data = new Date().toLocaleString('pt-BR')) {
  const atual = estadia || {}

  return {
    ...atual,
    status: 'Aberto',
    reabertoPor: usuario,
    dataReabertura: data,
    feitoPor: '',
    dataFeito: '',
    finalizadoPor: '',
    dataFinalizado: '',
    emAnalisePor: '',
    dataAnalise: '',
    pagamentoConfirmado: false,
    pagamentoConfirmadoPor: '',
    dataPagamentoConfirmado: '',
    historicoItem: historicoComEvento(atual, EVENTO_REABERTURA, usuario, data),
  }
}

export function estadiaPagamentoConfirmado(estadia) {
  return estadia?.status === 'Finalizado' && estadia?.pagamentoConfirmado === true
}
