import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL || 'https://dwyaedcrfgtnzkkflmge.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_ko9HUoztqY26AIzw4rxAHA_jGH005Md'
export const TABLE = 'ldc_estadias'
export const USUARIOS_TABLE = 'ldc_usuarios'
export const BUCKET = 'ldc-anexos'

let client = null

export const getClient = () => {
  if (!client) client = createClient(URL, KEY)
  return client
}

export const payload = (item, tipo, filial = 'jatai-go') => ({
  local_id: String(item.id),
  tipo,
  filial,
  placa: item.placa || '',
  status: item.status || '',
  prioridade: item.prioridade || 'Normal',
  dados: item,
  updated_at: new Date().toISOString(),
})

export const salvar = async (item, tipo, filial = 'jatai-go') => {
  const sb = getClient()
  const { error } = await sb.from(TABLE).upsert(payload(item, tipo, filial), { onConflict: 'local_id' })
  if (error) throw error
}

export const deletar = async (id) => {
  const sb = getClient()
  const { error } = await sb.from(TABLE).delete().eq('local_id', String(id))
  if (error) throw error
}

export const baixarTodos = async (filial = null) => {
  const sb = getClient()
  let query = sb.from(TABLE).select('*').order('updated_at', { ascending: false })
  if (filial) query = query.eq('filial', filial)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const baixarAdmin = async () => {
  const sb = getClient()
  const { data, error } = await sb.from(TABLE).select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const carregarUsuarios = async () => {
  const sb = getClient()
  const { data, error } = await sb.from(USUARIOS_TABLE).select('*').order('nome', { ascending: true })
  if (error) throw error
  return data || []
}

export const salvarUsuario = async (usuario) => {
  const sb = getClient()
  const { error } = await sb.from(USUARIOS_TABLE).upsert({
    usuario: usuario.usuario,
    senha: usuario.senha,
    nome: usuario.nome || usuario.usuario,
    cargo: usuario.cargo || 'Operador',
    avatar: usuario.avatar || '',
    foto: usuario.foto || '',
    filial: usuario.filial || 'jatai-go',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'usuario' })
  if (error) throw error
}

export const deletarUsuario = async (usuario) => {
  const sb = getClient()
  const { error } = await sb.from(USUARIOS_TABLE).delete().eq('usuario', String(usuario))
  if (error) throw error
}

export const uploadAnexo = async (file) => {
  const sb = getClient()
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}_${safe}`
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined })
  if (error) throw error
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
  return { nome: file.name, tipo: file.type, tamanho: file.size, url: data.publicUrl, cloud: true }
}

export const uploadAnexoLocal = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({ nome: file.name, tipo: file.type, tamanho: file.size, url: reader.result, cloud: false })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export const iniciarRealtime = (onMudanca) => {
  const sb = getClient()
  return sb
    .channel('ldc-estadias-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, onMudanca)
    .subscribe()
}

export const iniciarPresenca = (usuario, onAtivos) => {
  const sb = getClient()
  const channel = sb.channel('via-log-presenca', {
    config: { presence: { key: usuario?.usuario || crypto.randomUUID() } },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const ativos = Object.values(state).flat().map(p => p.usuario).filter(Boolean)
      onAtivos?.(ativos)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          usuario: {
            usuario: usuario?.usuario || '-',
            nome: usuario?.nome || usuario?.usuario || 'Usuário',
            cargo: usuario?.cargo || '',
            avatar: usuario?.avatar || '',
            filial: usuario?.filial || '',
          },
          online_at: new Date().toISOString(),
        })
      }
    })

  return channel
}
