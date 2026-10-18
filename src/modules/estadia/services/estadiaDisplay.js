export function statusEstadiaTexto(estadia) {
  const original = String(estadia.statusOriginalPlanilha || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (estadia.status === 'Em análise' && original.includes('aguard') && original.includes('logistica')) return 'Aguardando Logística'
  return estadia.status || 'Aberto'
}

function horasConhecidas(estadia) {
  if (estadia.horasInformadas === false || estadia.horas == null || String(estadia.horas).trim() === '') return null
  const horas = Number(String(estadia.horas).replace(',', '.'))
  return Number.isFinite(horas) ? horas : null
}

export function tempoParadoTexto(estadia) {
  const horas = horasConhecidas(estadia)
  if (horas == null) return 'Não informado'
  return `${horas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}h`
}

export function tempoParadoClasse(estadia) {
  const horas = horasConhecidas(estadia)
  if (horas == null) return ''
  if (horas > 24) return 'danger'
  if (horas > 12) return 'warn'
  return 'ok'
}
