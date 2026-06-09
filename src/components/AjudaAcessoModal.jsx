import { useState } from 'react'
import { salvar, carregarUsuarios } from '../lib/supabase'

const novoId = () => `acesso-ajuda-${Date.now()}-${Math.random().toString(36).slice(2)}`

export default function AjudaAcessoModal({ show, onClose, usuarioInicial = '' }) {
  const [form, setForm] = useState({ usuario: usuarioInicial || '', motivo: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  if (!show) return null

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const enviar = async () => {
    if (loading) return
    const usuario = form.usuario.trim().toLowerCase()
    if (!usuario) { setMsg('Informe seu usuário.'); return }
    setLoading(true)
    setMsg('')
    try {
      let lista = []
      try { lista = await carregarUsuarios() } catch {}
      if (!lista.length) lista = JSON.parse(localStorage.getItem('usuariosPainelViaLog') || '[]')
      const user = lista.find(u => String(u.usuario).toLowerCase() === usuario)
      const pedido = {
        id: novoId(),
        usuario,
        nome: user?.nome || usuario,
        filial: user?.filial || 'jatai-go',
        motivo: form.motivo.trim() || 'Usuário pediu ajuda para acessar o sistema.',
        status: 'pendente',
        prioridade: 'Normal',
        criadoEm: new Date().toLocaleString('pt-BR'),
      }
      await salvar(pedido, 'acesso_suporte', pedido.filial)
      setMsg('Pedido enviado. Aguarde o Admin liberar o acesso.')
    } catch {
      setMsg('Não consegui enviar agora. Verifique a conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0d1117] border border-white/10 rounded-[2rem] p-7 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-black">Ajuda para entrar</h3>
            <p className="text-slate-500 text-sm mt-1">O pedido será enviado para o Admin.</p>
          </div>
          <button className="bg-white/5 border border-white/10 rounded-xl px-3 py-2" onClick={onClose}>×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Usuário</label>
            <input value={form.usuario} onChange={e => set('usuario', e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none text-white bg-white/[.03] border border-white/10" placeholder="Seu usuário" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Motivo</label>
            <textarea value={form.motivo} onChange={e => set('motivo', e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none text-white bg-white/[.03] border border-white/10 min-h-[78px]" placeholder="Ex: não estou conseguindo entrar" />
          </div>

          <button type="button" disabled={loading} onClick={enviar} className="w-full py-3 rounded-2xl font-black bg-orange-600 hover:bg-orange-500 disabled:opacity-60">
            Enviar pedido ao Admin
          </button>

          {msg && <p className="text-center text-sm text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">{msg}</p>}
        </div>
      </div>
    </div>
  )
}
