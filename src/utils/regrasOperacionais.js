import { podeAdministrar } from './roles'

export const STATUS_ESTADIA = ['Aberto', 'Feito', 'Finalizado', 'Reaberto', 'Cancelado']
export const STATUS_PENDENCIA = ['A lançar', 'Aguardando documento', 'Aguardando validação', 'Em lançamento', 'Lançado', 'Recusado']
export const STATUS_CAPTACAO = ['Sem retorno', 'Em negociação', 'Captado', 'Agendado', 'Cancelado', 'Finalizado']

export const PRIORIDADES = ['Normal', 'Média', 'Urgente']

export function normalizarStatus(valor, tipo = 'estadia') {
  const lista = tipo === 'pendencia' ? STATUS_PENDENCIA : tipo === 'captacao' ? STATUS_CAPTACAO : STATUS_ESTADIA
  const txt = String(valor || '').trim()
  return lista.find(s => s.toLowerCase() === txt.toLowerCase()) || lista[0]
}

export function podeVisualizarRegistro(usuario, registro) {
  if (!usuario) return false
  if (podeAdministrar(usuario)) return true
  const filialUsuario = usuario?.filial || 'jatai-go'
  const filialRegistro = registro?.filial || filialUsuario
  return String(filialRegistro) === String(filialUsuario)
}

export function filtrarPorAcesso(lista = [], usuario) {
  return lista.filter(item => podeVisualizarRegistro(usuario, item))
}

export function calcularHorasDesde(valor) {
  if (!valor) return 0
  const texto = String(valor)
  const partesBR = texto.match(/(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+|\s+)(\d{2}):(\d{2})/)
  let data = null
  if (partesBR) data = new Date(`${partesBR[3]}-${partesBR[2]}-${partesBR[1]}T${partesBR[4]}:${partesBR[5]}:00`)
  else data = new Date(texto)
  if (Number.isNaN(data?.getTime?.())) return 0
  return Math.max(0, (Date.now() - data.getTime()) / 36e5)
}

export function calcularAlertaPrazo(item) {
  const status = String(item?.status || '').toLowerCase()
  if (status.includes('finalizado') || status.includes('lançado') || status.includes('lancado') || status.includes('cancelado')) {
    return { nivel: 'ok', label: 'Concluído', horas: 0, cor: '#22c55e' }
  }

  const origem = item?.dataCriacao || item?.dataLancamento || item?.created_at || item?.updated_at
  const horas = calcularHorasDesde(origem)
  const semAnexo = Array.isArray(item?.anexos) && item.anexos.length === 0

  if (horas >= 48 || item?.prioridade === 'Urgente') return { nivel: 'critico', label: 'Crítico', horas, cor: '#ef4444' }
  if (horas >= 24 || item?.prioridade === 'Média' || semAnexo) return { nivel: 'atencao', label: 'Atenção', horas, cor: '#f97316' }
  return { nivel: 'normal', label: 'No prazo', horas, cor: '#22c55e' }
}

export function resumirAlertasPrazo(lista = []) {
  return lista.reduce((acc, item) => {
    const alerta = calcularAlertaPrazo(item)
    acc.total += 1
    acc[alerta.nivel] = (acc[alerta.nivel] || 0) + 1
    return acc
  }, { total: 0, critico: 0, atencao: 0, normal: 0, ok: 0 })
}

export function gerarResumoProdutividade(estadias = [], pendencias = []) {
  const mapa = new Map()
  const add = (usuario, campo) => {
    const chave = usuario || 'Não informado'
    const atual = mapa.get(chave) || { usuario: chave, lancadas: 0, pendencias: 0, feitas: 0, finalizadas: 0, total: 0 }
    atual[campo] += 1
    atual.total += 1
    mapa.set(chave, atual)
  }

  estadias.forEach(item => {
    add(item.lancadoPor || item.criadoPor, 'lancadas')
    if (item.feitoPor) add(item.feitoPor, 'feitas')
    if (item.finalizadoPor) add(item.finalizadoPor, 'finalizadas')
  })
  pendencias.forEach(item => add(item.criadoPor, 'pendencias'))

  return [...mapa.values()].sort((a, b) => b.total - a.total)
}

export function criarEventoHistorico({ usuario, acao, detalhes, antes, depois }) {
  return {
    data: new Date().toLocaleString('pt-BR'),
    usuario: usuario?.usuario || usuario?.nome || '-',
    acao,
    detalhes,
    antes: antes ? JSON.stringify(antes) : '',
    depois: depois ? JSON.stringify(depois) : '',
  }
}
