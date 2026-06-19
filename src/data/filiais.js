export const FILIAIS = [
  { id: 'jatai-go', nome: 'Jataí', cidade: 'Jataí', estado: 'GO' },
  { id: 'mineiros-go', nome: 'Mineiros', cidade: 'Mineiros', estado: 'GO' },
  { id: 'oleo', nome: 'Operação do Óleo', cidade: 'Jataí', estado: 'GO', setor: 'oleo' },
]

export const nomeFilial = (id) => {
  const f = FILIAIS.find(f => f.id === id)
  return f ? (f.cidade || f.nome) : id || 'Sem filial'
}
