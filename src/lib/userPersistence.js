export function registroUsuario(usuario) {
  const agora = new Date().toISOString()
  return {
    usuario: String(usuario.usuario || '').trim().toLowerCase(),
    senha: usuario.senha,
    nome: usuario.nome || usuario.usuario,
    cargo: usuario.cargo || 'Operador',
    avatar: usuario.avatar || '',
    foto: usuario.foto || '',
    filial: usuario.filial || 'jatai-go',
    ativo: usuario.ativo !== false,
    updated_at: agora,
    atualizado_em: agora,
  }
}

export async function inserirUsuarioConfirmado(client, tabela, usuario) {
  const nome = String(usuario.usuario).trim().toLowerCase()
  const literal = nome.replace(/[\\%_]/g, '\\$&')
  const existentes = await client.from(tabela).select('usuario').ilike('usuario', literal).limit(1)
  if (existentes.error) throw existentes.error
  if (existentes.data?.length) throw { code: '23505', message: 'Usuário já existe.' }
  const { data, error } = await client.from(tabela).insert(registroUsuario(usuario)).select('usuario').single()
  if (error) throw error
  if (!data?.usuario || data.usuario !== String(usuario.usuario).trim().toLowerCase()) {
    throw new Error('A nuvem não confirmou a criação do usuário.')
  }
  return data
}
