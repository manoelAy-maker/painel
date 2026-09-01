export const PAGE_META = {
  inicio: ['Dashboard', 'Resumo da operação'],
  lancadas: ['Estadias lançadas', 'Controle de lançamentos e anexos'],
  consultaLancadas: ['Consulta de estadias', 'Busca e acompanhamento de registros'],
  finalizadas: ['Finalizadas', 'Registros encerrados e conferidos'],
  alancar: ['Pendências', 'Itens aguardando lançamento'],
  captacao: ['Captação', 'Motoristas, leads e próximas ações'],
  captacaoAdmin: ['Captação geral', 'Motoristas, leads e motivos'],
  relatorios: ['Relatórios', 'Análises e exportações'],
  historico: ['Histórico', 'Eventos e alterações'],
  lixeira: ['Lixeira', 'Registros removidos'],
  backup: ['Backup', 'Cópia e recuperação'],
  admin: ['Usuários e cargos', 'Acessos do sistema'],
}

const OPERACAO = [
  { id: 'inicio', label: 'Dashboard' },
  { id: 'lancadas', label: 'Lançar estadia' },
  { id: 'consultaLancadas', label: 'Estadias lançadas' },
  { id: 'finalizadas', label: 'Finalizadas' },
  { id: 'alancar', label: 'Pendências' },
]

export const OPERATOR_NAV_GROUPS = [
  { titulo: 'Operação', itens: OPERACAO },
]

export const ADMIN_NAV_GROUPS = [
  { titulo: 'Operação', itens: OPERACAO },
  {
    titulo: 'Comercial',
    itens: [
      { id: 'captacaoAdmin', label: 'Captação geral' },
      { id: 'captacao', label: 'Captação rápida' },
    ],
  },
  {
    titulo: 'Gestão',
    itens: [
      { id: 'relatorios', label: 'Relatórios' },
      { id: 'historico', label: 'Histórico' },
      { id: 'lixeira', label: 'Lixeira' },
      { id: 'backup', label: 'Backup' },
      { id: 'admin', label: 'Usuários e cargos' },
    ],
  },
]

export const ADMIN_ONLY_TABS = Object.freeze([
  'historico',
  'relatorios',
  'backup',
  'admin',
  'captacaoAdmin',
  'lixeira',
])
