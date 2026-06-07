import { getClient } from './supabase'

export async function arquivarEstadiaLancada(localId, usuario = '-', motivo = 'Arquivado pelo painel AYRES') {
  const sb = getClient()
  try {
    const { error } = await sb.rpc('arquivar_estadia_lancada', {
      p_local_id: String(localId),
      p_usuario: usuario,
      p_motivo: motivo,
    })
    if (error) throw error
    return true
  } catch (err) {
    // Fallback: se a função SQL ainda não existir, usa delete legado.
    // O ideal é rodar o SQL de organização do banco para ativar a lixeira.
    const { error } = await sb.from('ldc_estadias').delete().eq('local_id', String(localId))
    if (error) throw error
    return true
  }
}

export async function arquivarEstadiaALancar(localId, usuario = '-', motivo = 'Arquivado pelo painel AYRES') {
  const sb = getClient()
  try {
    const { error } = await sb.rpc('arquivar_estadia_a_lancar', {
      p_local_id: String(localId),
      p_usuario: usuario,
      p_motivo: motivo,
    })
    if (error) throw error
    return true
  } catch (err) {
    const { error } = await sb.from('ldc_estadias').delete().eq('local_id', String(localId))
    if (error) throw error
    return true
  }
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
  const { error } = await sb.rpc('restaurar_estadia_lancada', {
    p_lixeira_id: lixeiraId,
    p_usuario: usuario,
  })
  if (error) throw error
  return true
}

export async function restaurarEstadiaALancar(lixeiraId, usuario = '-') {
  const sb = getClient()
  const { error } = await sb.rpc('restaurar_estadia_a_lancar', {
    p_lixeira_id: lixeiraId,
    p_usuario: usuario,
  })
  if (error) throw error
  return true
}
