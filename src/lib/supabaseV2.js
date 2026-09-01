import { getClient } from './supabase'

export const T = {
  filiais: 'vl_filiais',
  profiles: 'vl_profiles',
  motoristas: 'vl_motoristas',
  transportadoras: 'vl_transportadoras',
  captacoes: 'vl_captacoes',
  carregamentos: 'vl_motorista_carregamentos',
  motoristasView: 'vw_motoristas_que_carregam',
  eventos: 'vl_captacao_eventos',
}

export const limparTelefone = (v) => String(v || '').replace(/[^0-9]/g, '')

const textoNormalizado = (valor) => String(valor || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()

export const statusV2 = (status) => {
  const s = textoNormalizado(status)
  if (s === 'nao_carregou' || s === 'nao carregou' || s.includes('nao carreg')) return 'nao_carregou'
  if (s === 'carregou' || s === 'carregado') return 'carregou'
  if (s === 'ordem' || s.includes('ordem') || s.includes('programado') || s.includes('chegou')) return 'ordem'
  return 'contatado'
}

const quantidade = (v) => Math.max(1, Number(v || 1) || 1)

export const impactoPontuacaoV2 = (valor) => {
  const s = textoNormalizado(valor)
  if (s.includes('falha') || s === 'impacta' || s === 'captacao') return 'falha_captacao'
  if (s.includes('analise')) return 'analise'
  return 'externo'
}

function montarObservacao(item) {
  const partes = []
  if (statusV2(item.status) === 'nao_carregou') {
    partes.push(`[NAO_CARREGOU] Motivo: ${item.motivoNaoCarregou || 'Nao informado'}`)
    partes.push(`Justificativa: ${item.justificativaNaoCarregou || 'Nao informada'}`)
    partes.push(`[IMPACTO_PONTUACAO] ${impactoPontuacaoV2(item.impactoPontuacao || item.impacto_pontuacao)}`)
  }
  if (item.obs || item.observacao || item.ultimaObs) partes.push(`Obs: ${item.obs || item.observacao || item.ultimaObs}`)
  return partes.join(' | ') || null
}

function extrairNaoCarregou(obs = '') {
  const texto = String(obs || '')
  if (!texto.includes('[NAO_CARREGOU]')) return { obs: texto, motivoNaoCarregou: '', justificativaNaoCarregou: '', impactoPontuacao: 'externo' }
  const motivo = texto.match(/Motivo:\s*([^|]+)/)?.[1]?.trim() || ''
  const justificativa = texto.match(/Justificativa:\s*([^|]+)/)?.[1]?.trim() || ''
  const impacto = texto.match(/\[IMPACTO_PONTUACAO\]\s*([^|]+)/)?.[1]?.trim() || 'externo'
  const obsLimpa = texto.split('|').map(x => x.trim()).find(x => x.startsWith('Obs:'))?.replace(/^Obs:\s*/, '') || ''
  return { obs: obsLimpa, motivoNaoCarregou: motivo, justificativaNaoCarregou: justificativa, impactoPontuacao: impactoPontuacaoV2(impacto) }
}

export async function upsertFilialBasica(filialId, nome = '') {
  if (!filialId) return
  const sb = getClient()
  const { error } = await sb.from(T.filiais).upsert({ id: filialId, nome: nome || filialId }, { onConflict: 'id' })
  if (error) throw error
}

export async function deletarFilialV2(filialId) {
  if (!filialId) return
  const sb = getClient()
  const { data, error } = await sb.from(T.filiais).delete().eq('id', String(filialId)).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Nenhuma filial removida na nuvem (verifique permissoes/RLS).')
}

export async function deletarProfileV2(usuario) {
  if (!usuario) return
  const sb = getClient()
  const { data, error } = await sb.from(T.profiles).delete().eq('usuario', String(usuario)).select('usuario')
  if (error) throw error
  if (!data?.length) throw new Error('Nenhum perfil removido na nuvem (verifique permissoes/RLS).')
}

export async function upsertProfileBasico(usuario) {
  if (!usuario?.usuario) return
  const sb = getClient()
  if (usuario.filial) await upsertFilialBasica(usuario.filial, usuario.filial)
  const { error } = await sb.from(T.profiles).upsert({
    usuario: usuario.usuario,
    nome: usuario.nome || usuario.usuario,
    cargo: usuario.cargo || 'Operador',
    filial_id: usuario.filial || 'jatai-go',
    avatar: usuario.avatar || '',
    foto: usuario.foto || '',
    ativo: true,
  }, { onConflict: 'usuario' })
  if (error) throw error
}

export async function upsertMotoristaFromCaptacao(item, usuarioAtual = null) {
  const sb = getClient()
  const nome = item.nome || item.motorista || 'Motorista sem nome'
  const telefone = item.numero || item.telefone || item.telefoneMotorista || ''
  const telefoneLimpo = limparTelefone(telefone)
  const payload = {
    nome,
    telefone,
    telefone_limpo: telefoneLimpo || null,
    cidade: item.cidade || null,
    observacao: item.obs || item.observacao || null,
    criado_por: item.captador || item.usuario || usuarioAtual?.usuario || null,
  }

  let query
  if (telefoneLimpo) query = sb.from(T.motoristas).upsert(payload, { onConflict: 'telefone_limpo' }).select('*').single()
  else query = sb.from(T.motoristas).insert(payload).select('*').single()

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function upsertMotoristaBasicoV2({ nome, telefone, observacao } = {}, usuarioAtual = null) {
  if (!String(nome || '').trim()) return null
  return upsertMotoristaFromCaptacao({ nome, telefone, telefoneMotorista: telefone, observacao }, usuarioAtual)
}

export async function listarMotoristasBancoV2() {
  const sb = getClient()
  const { data, error } = await sb
    .from(T.motoristas)
    .select('*, captacoes:vl_captacoes(status,operacao,filial_id,captador_usuario,data_captacao)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function listarTransportadorasV2() {
  const sb = getClient()
  const { data, error } = await sb
    .from(T.transportadoras)
    .select('*')
    .order('nome', { ascending: true })
  if (error) return []
  return data || []
}

export async function upsertTransportadoraV2(nome, usuarioAtual = null) {
  const nomeLimpo = String(nome || '').trim()
  if (!nomeLimpo) return null
  const sb = getClient()
  const id = nomeLimpo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || nomeLimpo.toLowerCase()
  const { data, error } = await sb
    .from(T.transportadoras)
    .upsert({
      id,
      nome: nomeLimpo,
      ativa: true,
      criado_por: usuarioAtual?.usuario || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select('*')
    .single()
  if (error) return null
  return data
}

async function carregarCaptacaoAnterior(localId) {
  const sb = getClient()
  const { data, error } = await sb.from(T.captacoes).select('id,status').eq('local_id', String(localId)).maybeSingle()
  if (error) return null
  return data || null
}

async function registrarEventoCaptacao({ captacaoId, statusAnterior, statusNovo, usuario, observacao }) {
  if (!captacaoId || !statusNovo) return
  const sb = getClient()
  await sb.from(T.eventos).insert({
    captacao_id: captacaoId,
    status_anterior: statusAnterior || null,
    status_novo: statusNovo,
    usuario: usuario || null,
    observacao: observacao || null,
  })
}

async function sincronizarCarregamento({ captacao, motoristaId, filial, operacao, usuario, observacao }) {
  if (!captacao?.id) return
  const sb = getClient()
  if (statusV2(captacao.status) === 'carregou') {
    await sb.from(T.carregamentos).upsert({
      motorista_id: motoristaId,
      captacao_id: captacao.id,
      filial_id: filial,
      operacao,
      captador_usuario: usuario,
      observacao: observacao || null,
      carregou_em: new Date().toISOString(),
    }, { onConflict: 'captacao_id' })
  } else {
    await sb.from(T.carregamentos).delete().eq('captacao_id', captacao.id)
  }
}

export async function salvarCaptacaoV2(item, usuarioAtual = null) {
  const sb = getClient()
  const usuario = item.captador || item.usuario || usuarioAtual?.usuario || null
  const filial = item.filial || usuarioAtual?.filial || 'jatai-go'
  const novoStatus = statusV2(item.status)

  await upsertFilialBasica(filial, filial)
  if (usuarioAtual?.usuario) await upsertProfileBasico(usuarioAtual)

  const anterior = await carregarCaptacaoAnterior(item.id)
  const motorista = await upsertMotoristaFromCaptacao(item, usuarioAtual)
  const observacao = montarObservacao(item)

  const payload = {
    local_id: String(item.id),
    motorista_id: motorista.id,
    captador_usuario: usuario,
    filial_id: filial,
    operacao: item.operacao || item.produto || 'Farelo',
    status: novoStatus,
    observacao,
    quantidade_cargas: quantidade(item.quantidadeCargas),
    data_captacao: item.dataISO ? `${item.dataISO}T12:00:00` : new Date().toISOString(),
  }

  const { data, error } = await sb
    .from(T.captacoes)
    .upsert(payload, { onConflict: 'local_id' })
    .select('*, motorista:vl_motoristas(*)')
    .single()

  if (error) throw error

  await sincronizarCarregamento({ captacao: data, motoristaId: motorista.id, filial, operacao: payload.operacao, usuario, observacao }).catch(() => {})

  if (!anterior || anterior.status !== novoStatus) {
    await registrarEventoCaptacao({ captacaoId: data.id, statusAnterior: anterior?.status || null, statusNovo: novoStatus, usuario, observacao }).catch(() => {})
  }

  return data
}

export async function deletarCaptacaoV2(localId) {
  const sb = getClient()
  const anterior = await carregarCaptacaoAnterior(localId)
  if (!anterior?.id) return true

  try {
    const { data: rpcOk, error: rpcError } = await sb.rpc('delete_captacao_completa', { p_local_id: String(localId) })
    if (!rpcError && rpcOk) return true
  } catch {}

  await sb.from(T.eventos).delete().eq('captacao_id', anterior.id)
  await sb.from(T.carregamentos).delete().eq('captacao_id', anterior.id)

  const { data, error } = await sb.from(T.captacoes).delete().eq('id', anterior.id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Nenhuma captacao removida na nuvem (verifique permissoes/RLS).')
  return true
}

export function captacaoRowToItem(row) {
  const m = row.motorista || row.vl_motoristas || {}
  const extra = extrairNaoCarregou(row.observacao || m.observacao || '')
  return {
    id: row.local_id || row.id,
    captador: row.captador_usuario || '-',
    usuario: row.captador_usuario || '-',
    nomeCaptador: row.captador_usuario || '-',
    nomeUsuario: row.captador_usuario || '-',
    filial: row.filial_id || 'jatai-go',
    data: row.data_captacao ? new Date(row.data_captacao).toLocaleString('pt-BR') : '',
    dataISO: row.data_captacao ? String(row.data_captacao).slice(0, 10) : '',
    nome: m.nome || row.nome || '',
    motorista: m.nome || row.nome || '',
    numero: m.telefone || row.numero || '',
    telefone: m.telefone || row.numero || '',
    operacao: row.operacao || 'Farelo',
    produto: row.operacao || 'Farelo',
    status: statusV2(row.status || (extra.motivoNaoCarregou ? 'nao_carregou' : 'contatado')),
    obs: extra.obs,
    observacao: extra.obs,
    motivoNaoCarregou: extra.motivoNaoCarregou,
    justificativaNaoCarregou: extra.justificativaNaoCarregou,
    impactoPontuacao: extra.impactoPontuacao || 'externo',
    quantidadeCargas: String(row.quantidade_cargas || 1),
    ultimaAtualizacao: row.updated_at ? new Date(row.updated_at).toLocaleString('pt-BR') : '',
  }
}

export async function listarCaptacoesV2({ filial = null, admin = false } = {}) {
  const sb = getClient()
  let query = sb.from(T.captacoes).select('*, motorista:vl_motoristas(*)').order('updated_at', { ascending: false })
  if (!admin && filial) query = query.eq('filial_id', filial)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(captacaoRowToItem)
}

export async function listarEventosCaptacaoV2(limit = 80) {
  const sb = getClient()
  const { data, error } = await sb
    .from(T.eventos)
    .select('*, captacao:vl_captacoes(local_id,operacao,status,motorista:vl_motoristas(nome,telefone))')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function listarMotoristasQueCarregamV2() {
  const sb = getClient()
  const { data, error } = await sb.from(T.motoristasView).select('*').order('carregamentos', { ascending: false })
  if (error) throw error
  return data || []
}
