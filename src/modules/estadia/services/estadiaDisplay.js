export function statusEstadiaTexto(estadia) {
  const original = String(estadia.statusOriginalPlanilha || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (estadia.status === 'Em análise' && original.includes('aguard') && original.includes('logistica')) return 'Aguardando Logística'
  return estadia.status || 'Aberto'
}

export function tempoParadoTexto(estadia) {
  if (estadia.horasInformadas === false) return 'Não informado'
  const horas = Number(String(estadia.horas || '0').replace(',', '.')) || 0
  return `${horas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}h`
}

export function tempoParadoClasse(estadia) {
  if (estadia.horasInformadas === false) return ''
  const horas = Number(String(estadia.horas || '0').replace(',', '.')) || 0
  if (horas > 24) return 'danger'
  if (horas > 12) return 'warn'
  return 'ok'
}
