import { CARGOS, podeAdministrar } from '../../../utils/roles'

export function validarNovoUsuario(dados, ator, usuarios = [], filiais = []) {
  if (!podeAdministrar(ator)) return { erro: 'Somente administradores podem criar usuários.' }
  const usuario = String(dados?.usuario || '').trim().toLowerCase()
  const nome = String(dados?.nome || '').trim()
  const senha = String(dados?.senha || '')
  const cargo = String(dados?.cargo || '')
  const filial = String(dados?.filial || '')
  if (nome.length < 2) return { erro: 'Preencha o nome completo do usuário.' }
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(usuario)) return { erro: 'O login deve ter de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado.' }
  if (usuarios.some(item => String(item.usuario || '').trim().toLowerCase() === usuario)) return { erro: 'Usuário já existe.' }
  if (senha.trim().length < 8 || senha.length > 128) return { erro: 'A senha inicial deve ter de 8 a 128 caracteres.' }
  if (!CARGOS.includes(cargo)) return { erro: 'Selecione um cargo válido.' }
  const idsFiliais = new Set([...filiais.map(item => String(item.id)), ...usuarios.map(item => String(item.filial || '')), String(ator?.filial || '')].filter(Boolean))
  if (!filial || !idsFiliais.has(filial)) return { erro: 'Selecione uma filial válida.' }
  const avatar = nome.split(/\s+/).map(parte => parte[0]).slice(0, 2).join('').toUpperCase()
  return { dados: { usuario, nome, senha, cargo, filial, avatar, foto: '', ativo: true } }
}
