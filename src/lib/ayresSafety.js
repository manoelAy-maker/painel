import { getClient, TABLE, payload } from './supabase'

function localIdOf(itemOrId) {
  return typeof itemOrId === 'object' ? String(itemOrId?.id || itemOrId?.local_id) : String(itemOrId)
}

async function inserirLixeira({ origemTipo, item, usuario, motivo }) {
  const sb = getClient()
  const localId = localIdOf(item)
  const registro = typeof item === 'object' ? item : {}
  const anexos = Array.isArray(registro?.anexos) ? registro.anexos : []

  const { data: existe, error: readError } = await sb
    .from('vl_lixeira')
    .select('id')
    .eq('origem_tipo', origemTipo)
    .eq('origem_local_id', localId)
    .eq('restaurado', false)
    .maybeSingle()

  if (readError) throw readError

  if (!existe?.id) {
    const { error } = await sb.from('vl_lixeira').insert({
      origem_tipo: origemTipo,
      origem_local_id: localId,
      registro,
      anexos,
      apagado_por: usuario || registro?.lancadoPor || registro?.criadoPor || '-',
      motivo: motivo || 'Arquivado pelo painel AYRES',
    })
    if (error) throw error
  }
}

async function deletarLegado(localId) {
  const sb = getClient()
  const { error } = await sb.from(TABLE).delete().eq('local_id', localId)
  if (error) throw error
}

export async function arquivarEstadiaLancada(itemOrId, usuario = '-', motivo = 'Estadia arquivada pelo painel AYRES') {
  const sb = getClient()
  const localId = localIdOf(itemOrId)

  // Se veio o objeto da tela, arquiva no modelo atual do painel, que ainda usa ldc_estadias.
  if (typeof itemOrId === 'object') {
    await inserirLixeira({ origemTipo: 'estadia', item: itemOrId, usuario, motivo })
    await deletarLegado(localId)
    return true
  }

  try {
    const { error } = await sb.rpc('arquivar_estadia_lancada', {
      p_local_id: localId,
      p_usuario: usuario,
      p_motivo: motivo,
    })
    if (!error) return true
  } catch {}

  const { data, error: readError } = await sb.from(TABLE).select('*').eq('local_id', localId).maybeSingle()
  if (readError) throw readError
  if (data?.dados) await inserirLixeira({ origemTipo: 'estadia', item: data.dados, usuario, motivo })
  await deletarLegado(localId)
  return true
}

export async function arquivarEstadiaALancar(itemOrId, usuario = '-', motivo = 'Pendência arquivada pelo painel AYRES') {
  const sb = getClient()
  const localId = localIdOf(itemOrId)

  if (typeof itemOrId === 'object') {
    await inserirLixeira({ origemTipo: 'a_lancar', item: itemOrId, usuario, motivo })
    await deletarLegado(localId)
    return true
  }

  try {
    const { error } = await sb.rpc('arquivar_estadia_a_lancar', {
      p_local_id: localId,
      p_usuario: usuario,
      p_motivo: motivo,
    })
    if (!error) return true
  } catch {}

  const { data, error: readError } = await sb.from(TABLE).select('*').eq('local_id', localId).maybeSingle()
  if (readError) throw readError
  if (data?.dados) await inserirLixeira({ origemTipo: 'a_lancar', item: data.dados, usuario, motivo })
  await deletarLegado(localId)
  return true
}

export async function listarLixeira() {
  const sb = getClient()
  const { data, error } = await sb
    .from('vl_lixeira')
    .select('*')
    .order('apagado_em', { ascending: false })
    .limit(200)
  if (error) throw error
  return data || []
}

export async function restaurarEstadiaLancada(lixeiraId, usuario = '-') {
  const sb = getClient()
  const { data: item, error: readError } = await sb.from('vl_lixeira').select('*').eq('id', lixeiraId).maybeSingle()
  if (readError) throw readError
  if (!item?.registro) return false

  // Restaura no banco legado atual para aparecer imediatamente no painel.
  const registro = { ...item.registro, status: item.registro.status || 'Aberto' }
  const { error: upsertError } = await sb.from(TABLE).upsert(payload(registro, 'lancada', registro.filial || 'jatai-go'), { onConflict: 'local_id' })
  if (upsertError) throw upsertError

  try {
    await sb.rpc('restaurar_estadia_lancada', {
      p_lixeira_id: lixeiraId,
      p_usuario: usuario,
    })
  } catch {}

  const { error } = await sb.from('vl_lixeira').update({ restaurado: true, restaurado_em: new Date().toISOString(), restaurado_por: usuario }).eq('id', lixeiraId)
  if (error) throw error
  return true
}

export async function restaurarEstadiaALancar(lixeiraId, usuario = '-') {
  const sb = getClient()
  const { data: item, error: readError } = await sb.from('vl_lixeira').select('*').eq('id', lixeiraId).maybeSingle()
  if (readError) throw readError
  if (!item?.registro) return false

  const registro = { ...item.registro, status: item.registro.status || 'A lançar' }
  const { error: upsertError } = await sb.from(TABLE).upsert(payload(registro, 'a_lancar', registro.filial || 'jatai-go'), { onConflict: 'local_id' })
  if (upsertError) throw upsertError

  try {
    await sb.rpc('restaurar_estadia_a_lancar', {
      p_lixeira_id: lixeiraId,
      p_usuario: usuario,
    })
  } catch {}

  const { error } = await sb.from('vl_lixeira').update({ restaurado: true, restaurado_em: new Date().toISOString(), restaurado_por: usuario }).eq('id', lixeiraId)
  if (error) throw error
  return true
}
