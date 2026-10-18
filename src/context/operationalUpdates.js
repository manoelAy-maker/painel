export function adicionarItemFila(fila, item) {
  return [...fila, item]
}

export function aplicarAtualizacaoEstadia(estadias, id, changes) {
  return estadias.map(estadia => (
    String(estadia.id) === String(id)
      ? { ...estadia, ...changes }
      : estadia
  ))
}

export function removerItensFilaConfirmados(fila, concluidos) {
  const confirmados = new Set(concluidos)
  return fila.filter(item => !confirmados.has(item))
}

export async function gravarItemFila(client, table, item) {
  let response

  if (item.acao === 'upsert') {
    response = await client
      .from(table)
      .upsert(item.payload, { onConflict: 'local_id' })
  } else if (item.acao === 'delete') {
    response = await client
      .from(table)
      .delete()
      .eq('local_id', String(item.local_id))
  } else {
    throw new Error(`Ação de fila desconhecida: ${item.acao}`)
  }

  if (response?.error) throw response.error
  return response
}
