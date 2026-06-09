export const CARGOS = [
  'Analista Júnior',
  'Analista Pleno',
  'Analista Sênior',
  'Coordenador',
  'Admin',
  'Operador',
  'Visualizador',
]

export const CARGOS_ADMIN = ['Admin', 'Analista Sênior', 'Coordenador']

export function podeAdministrar(usuario) {
  return CARGOS_ADMIN.includes(usuario?.cargo)
}

export function nomeCargo(cargo) {
  if (cargo === 'Analista Junior') return 'Analista Júnior'
  if (cargo === 'Analista Pleno') return 'Analista Pleno'
  if (cargo === 'Analista Senior') return 'Analista Sênior'
  return cargo || 'Operador'
}
