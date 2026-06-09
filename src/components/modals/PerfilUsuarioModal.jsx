import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { getClient, USUARIOS_TABLE } from '../../lib/supabase'
import '../../perfil-usuario.css'

const hashSenha = async (senha) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(senha + 'ldc2025'))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const gerarAvatar = (nome, usuario) =>
  String(nome || '')
    .split(' ')
    .filter(Boolean)
    .map(x => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || String(usuario || 'US').slice(0, 2).toUpperCase()

function salvarUsuariosLocal(usuarioAtualizado) {
  const lista = JSON.parse(localStorage.getItem('usuariosPainelViaLog') || '[]')
  const novaLista = lista.map(u => u.usuario === usuarioAtualizado.usuario ? usuarioAtualizado : u)
  localStorage.setItem('usuariosPainelViaLog', JSON.stringify(novaLista))
  localStorage.setItem('usuarioLogadoViaLog', JSON.stringify(usuarioAtualizado))
}

async function salvarUsuarioNaNuvem(usuario) {
  const sb = getClient()
  const payloadCompleto = {
    usuario: usuario.usuario,
    senha: usuario.senha,
    nome: usuario.nome || usuario.usuario,
    cargo: usuario.cargo || 'Operador',
    avatar: usuario.avatar || '',
    foto: usuario.foto || '',
    email: usuario.email || null,
    filial: usuario.filial || 'jatai-go',
    updated_at: new Date().toISOString(),
  }

  const { error } = await sb.from(USUARIOS_TABLE).upsert(payloadCompleto, { onConflict: 'usuario' })
  if (!error) return true

  // Fallback caso a coluna email ainda não exista no banco.
  const { email, ...semEmail } = payloadCompleto
  const { error: fallbackError } = await sb.from(USUARIOS_TABLE).upsert(semEmail, { onConflict: 'usuario' })
  if (fallbackError) throw fallbackError
  return true
}

export default function PerfilUsuarioModal({ show, onClose }) {
  const { usuarioAtual, toast } = useApp()
  const [form, setForm] = useState({ nome: '', email: '', foto: '', cargo: '', filial: '', senhaAtual: '', novaSenha: '', confirmarSenha: '' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!show || !usuarioAtual) return
    setForm({
      nome: usuarioAtual.nome || '',
      email: usuarioAtual.email || '',
      foto: usuarioAtual.foto || '',
      cargo: usuarioAtual.cargo || 'Operador',
      filial: usuarioAtual.filial || 'jatai-go',
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    })
  }, [show, usuarioAtual])

  if (!show || !usuarioAtual) return null

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const escolherFoto = (file) => {
    if (!file) return
    if (file.size > 900000) {
      toast?.('Use uma foto menor que 900 KB.', 'warn')
      return
    }
    const reader = new FileReader()
    reader.onload = () => set('foto', reader.result)
    reader.readAsDataURL(file)
  }

  const salvar = async () => {
    if (salvando) return
    if (!form.nome.trim()) { toast?.('Informe seu nome.', 'err'); return }
    if (form.novaSenha && form.novaSenha.length < 4) { toast?.('A nova senha precisa ter pelo menos 4 caracteres.', 'err'); return }
    if (form.novaSenha && form.novaSenha !== form.confirmarSenha) { toast?.('As senhas não conferem.', 'err'); return }

    setSalvando(true)
    try {
      const senhaFinal = form.novaSenha ? await hashSenha(form.novaSenha) : usuarioAtual.senha
      const cargoFinal = usuarioAtual.cargo === 'Admin' ? form.cargo : usuarioAtual.cargo
      const atualizado = {
        ...usuarioAtual,
        nome: form.nome.trim(),
        email: form.email.trim(),
        foto: form.foto,
        cargo: cargoFinal,
        filial: usuarioAtual.filial,
        avatar: gerarAvatar(form.nome, usuarioAtual.usuario),
        senha: senhaFinal,
      }

      salvarUsuariosLocal(atualizado)
      await salvarUsuarioNaNuvem(atualizado)
      toast?.('Perfil atualizado.', 'ok')
      setTimeout(() => window.location.reload(), 600)
    } catch {
      toast?.('Perfil salvo localmente, mas falhou na nuvem.', 'warn')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="perfil-backdrop" onClick={onClose}>
      <div className="perfil-modal" onClick={e => e.stopPropagation()}>
        <div className="perfil-head">
          <div>
            <span>Meu perfil</span>
            <h2>Editar dados do usuário</h2>
          </div>
          <button onClick={onClose}>×</button>
        </div>

        <div className="perfil-body">
          <div className="perfil-photo-card">
            <div className="perfil-photo-preview">
              {form.foto ? <img src={form.foto} alt="Foto do usuário" /> : <strong>{gerarAvatar(form.nome, usuarioAtual.usuario)}</strong>}
            </div>
            <label className="perfil-upload">
              Trocar foto
              <input type="file" accept="image/*" onChange={e => escolherFoto(e.target.files?.[0])} />
            </label>
            <small>Use uma imagem leve para carregar rápido.</small>
          </div>

          <div className="perfil-fields">
            <label>Nome</label>
            <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Seu nome" />

            <label>E-mail para recuperar senha</label>
            <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="seuemail@exemplo.com" />

            <div className="perfil-grid-2">
              <div>
                <label>Cargo</label>
                <select value={form.cargo} onChange={e => set('cargo', e.target.value)} disabled={usuarioAtual.cargo !== 'Admin'}>
                  <option>Admin</option>
                  <option>Operador</option>
                  <option>Visualizador</option>
                </select>
                {usuarioAtual.cargo !== 'Admin' && <small>Cargo é controlado pelo Admin.</small>}
              </div>
              <div>
                <label>Filial</label>
                <input value={form.filial} disabled />
                <small>Filial é controlada pelo Admin.</small>
              </div>
            </div>

            <div className="perfil-password-box">
              <strong>Trocar senha</strong>
              <span>Preencha apenas se quiser alterar.</span>
              <input type="password" value={form.novaSenha} onChange={e => set('novaSenha', e.target.value)} placeholder="Nova senha" />
              <input type="password" value={form.confirmarSenha} onChange={e => set('confirmarSenha', e.target.value)} placeholder="Confirmar nova senha" />
            </div>
          </div>
        </div>

        <div className="perfil-actions">
          <button className="perfil-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="perfil-btn primary" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar perfil'}</button>
        </div>
      </div>
    </div>
  )
}
