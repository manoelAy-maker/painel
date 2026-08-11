export const FRANQUIA_PADRAO_HORAS = 12
export const FATOR_PADRAO_TONELADA_HORA = 0.8

export function numeroBR(valor) {
  if (valor === null || valor === undefined || valor === '') return 0
  const texto = String(valor).trim()
  if (!texto) return 0

  // Aceita 38.380, 38380, 0,80 e 0.80 sem confundir milhar com decimal.
  const normalizado = texto.includes(',')
    ? texto.replace(/\./g, '').replace(',', '.')
    : texto

  return Number(normalizado.replace(/[^0-9.-]/g, '')) || 0
}

export function dinheiroBR(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function toneladasDoPeso(peso) {
  const valor = numeroBR(peso)
  return valor > 1000 ? valor / 1000 : valor
}

export function horasEntre(dataIni, horaIni, dataFim, horaFim) {
  if (!dataIni || !horaIni || !dataFim || !horaFim) return 0
  const ini = new Date(`${dataIni}T${horaIni}`)
  const fim = new Date(`${dataFim}T${horaFim}`)
  if (Number.isNaN(ini.getTime()) || Number.isNaN(fim.getTime()) || fim <= ini) return 0
  return (fim - ini) / 36e5
}

export function formatarDataHora(data, hora) {
  if (!data || !hora) return '-'
  const [ano, mes, dia] = String(data).split('-')
  if (!ano || !mes || !dia) return '-'
  return `${dia}/${mes}/${ano} ${hora}`
}

/**
 * Regra oficial AYRES/LDC:
 * - padrão: 12h de franquia;
 * - depois da franquia: toneladas × horas excedentes × R$ 0,80;
 * - modos manuais continuam suportados sem serem sobrescritos na edição.
 */
export function calcularEstadiaOperacional(dados = {}) {
  const totalHoras = horasEntre(
    dados.chegadaData,
    dados.chegadaHora,
    dados.saidaData,
    dados.saidaHora,
  )

  const manual = Boolean(dados.alterarCalculo)
  const tipo = manual ? (dados.tipoCalculo || 'Hora') : 'Hora'
  const franquia = manual ? numeroBR(dados.franquia) : FRANQUIA_PADRAO_HORAS
  const fator = manual
    ? numeroBR(dados.valorHora || String(FATOR_PADRAO_TONELADA_HORA).replace('.', ','))
    : FATOR_PADRAO_TONELADA_HORA
  const toneladas = toneladasDoPeso(dados.peso)
  const horasPagar = Math.max(0, totalHoras - franquia)

  let valorNumero = 0
  let horasResultado = horasPagar
  let regraResumo = ''
  let regraCurta = manual ? 'Manual' : 'R$ 0,80/t/h'

  if (tipo === 'Diária') {
    const dias = Math.max(0, Number(dados.qtdDias) || 0)
    valorNumero = numeroBR(dados.valorDiaria) * dias
    horasResultado = dias * 24
    regraResumo = 'Diária manual'
  } else if (tipo === 'Negociado') {
    valorNumero = numeroBR(dados.valorNegociado)
    regraResumo = 'Valor negociado manualmente'
  } else {
    valorNumero = toneladas * horasPagar * fator
    regraResumo = horasPagar > 0
      ? `${toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} t × R$ ${String(fator).replace('.', ',')} × ${horasPagar.toFixed(2).replace('.', ',')} h após ${franquia}h de franquia`
      : `Franquia de ${franquia}h ainda não ultrapassada`
  }

  return {
    horas: Number(horasResultado || 0).toFixed(2),
    totalHoras: totalHoras.toFixed(2),
    horasPagar: Number(horasResultado || 0).toFixed(2),
    toneladas: toneladas.toFixed(3),
    valorNumero,
    valor: dinheiroBR(valorNumero),
    regraResumo,
    regraCurta,
    chegada: formatarDataHora(dados.chegadaData, dados.chegadaHora),
    saida: formatarDataHora(dados.saidaData, dados.saidaHora),
    franquiaAplicada: franquia,
    fatorAplicado: fator,
    tipoCalculoAplicado: tipo,
  }
}

// Compatibilidade com o código legado/testes. A regra padrão continua 12h + R$ 0,80/t/h.
export function calcularEstadiaPadrao(peso, chegadaData, chegadaHora, saidaData, saidaHora) {
  if (!peso || !chegadaData || !chegadaHora || !saidaData || !saidaHora) return null
  const totalHoras = horasEntre(chegadaData, chegadaHora, saidaData, saidaHora)
  if (totalHoras <= 0) return null
  const calculo = calcularEstadiaOperacional({ peso, chegadaData, chegadaHora, saidaData, saidaHora })
  return {
    horas: calculo.horas,
    valor: calculo.valor,
    chegada: calculo.chegada,
    saida: calculo.saida,
  }
}
