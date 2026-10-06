export const PAGE_META = {
  inicio: ['Dashboard de Estadias', 'Visão geral da operação'],
  lancadas: ['Lançar estadia', 'Registrar uma nova estadia'],
  consultaLancadas: ['Estadias em andamento', 'Acompanhar registros ativos'],
  finalizadas: ['Finalizadas', 'Registros encerrados e conferidos'],
  alancar: ['Pendências', 'Itens aguardando lançamento'],
}

const OPERACAO = [
  { id: 'inicio', label: 'Visão geral' },
  { id: 'consultaLancadas', label: 'Em andamento' },
  { id: 'finalizadas', label: 'Finalizadas' },
  { id: 'lancadas', label: 'Lançar estadia' },
  { id: 'alancar', label: 'Pendências' },
]

export const OPERATOR_NAV_GROUPS = [
  { titulo: 'Estadias', itens: OPERACAO },
]

export const ADMIN_NAV_GROUPS = [
  { titulo: 'Estadias', itens: OPERACAO },
]

export const ADMIN_ONLY_TABS = Object.freeze([])
