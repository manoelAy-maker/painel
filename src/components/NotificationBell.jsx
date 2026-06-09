import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { baixarAdmin, deletar, salvar } from '../lib/supabase'

export default function NotificationBell() {
  const { estadiasALancar, usuarioAtual, toast } = useApp()
  const [open, setOpen] = useState(false)
  const [resetRequests, setResetRequests] = useState([])
  const isAdmin = usuarioAtual?.cargo === 'Admin'

  const carregarResets = async () => {
    if (!isAdmin || !navigator.onLine) return
    try {
      const rows = await baixarAdmin()
      const pedidos = rows
        .filter(r => r.tipo === 'senha_reset')
        .map(r => ({ ...r.dados, local_id: r.local_id, rowId: r.id }))
        .filter(p => p.status === 'pendente')
      setResetRequests(pedidos)
    } catch {
      setResetRequests([])
    }
  }

  useEffect(() => {
    carregarResets()
    if (!isAdmin) return undefined
    const t = setInterval(carregarResets, 20000)
    return () => clearInterval(t)
  }, [isAdmin]) // eslint-disable-line

  const pendentes = estadiasALancar
  const totalNotificacoes = pendentes.length + (isAdmin ? resetRequests.length : 0)

  const autorizarReset = async (pedido) => {
    if (!confirm(`Autorizar ${pedido.usuario} a cadastrar uma nova senha?`)) return
    const atualizado = {
      ...pedido,
      id: pedido.local_id,
      status: 'aprovado',
      autorizadoPor: usuarioAtual?.usuario || 'admin',
      autorizadoEm: new Date().toLocaleString('pt-BR'),
    }
    try {
      await salvar(atualizado, 'senha_reset', pedido.filial || 'jatai-go')
      setResetRequests(prev => prev.filter(p => p.local_id !== pedido.local_id))
      toast?.('Troca de senha autorizada.', 'ok')
    } catch {
      toast?.('Não consegui autorizar agora.', 'err')
    }
  }

  const recusarReset = async (pedido) => {
    if (!confirm(`Recusar pedido de senha de ${pedido.usuario}?`)) return
    try { await deletar(pedido.local_id) } catch {}
    setResetRequests(prev => prev.filter(p => p.local_id !== pedido.local_id))
    toast?.('Pedido de senha recusado/removido.', 'ok')
  }

  return (
    <div className="notif-wrap" style={{ position: 'relative' }}>
      <button className={`btn-light notif-button ${totalNotificacoes > 0 ? 'alert' : ''}`} onClick={() => { setOpen(o => !o); carregarResets() }}>
        🔔 <span className="pending-badge bell-badge">{totalNotificacoes}</span>
      </button>

      {open && (
        <div className="notif-panel show">
          <div className="notif-head">
            <strong>🔔 Notificações</strong>
            <button className="btn-light btn-small" onClick={() => setOpen(false)}>Fechar</button>
          </div>
          <p className="muted">Pendências, pedidos de senha e atualizações importantes.</p>

          {isAdmin && resetRequests.length > 0 && (
            <div className="notif-list" style={{ marginBottom: 12 }}>
              {resetRequests.slice(0, 8).map(pedido => (
                <div key={pedido.local_id} className="notif-item" style={{ borderColor: 'rgba(249,115,22,.35)' }}>
                  <strong>🔐 Pedido de troca de senha • {pedido.usuario}</strong>
                  <span>
                    {pedido.nome || 'Usuário sem nome'}<br />
                    Motivo: {pedido.motivo || 'Não informado'}<br />
                    Solicitado em {pedido.criadoEm || '-'}
                  </span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <button className="btn-green btn-small" onClick={() => autorizarReset(pedido)}>Autorizar</button>
                    <button className="btn-red btn-small" onClick={() => recusarReset(pedido)}>Recusar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="notif-list">
            {pendentes.length === 0 && (!isAdmin || resetRequests.length === 0)
              ? <div className="notif-empty">Nenhuma pendência. Painel sob controle ✅</div>
              : pendentes.slice(0, 8).map(e => (
                <div key={e.id} className="notif-item">
                  <strong>{e.prioridade === 'Urgente' ? '🚨' : '📋'} Placa {e.placa || '-'} • {e.prioridade || 'Normal'}</strong>
                  <span>{e.transportadora || 'Sem transportadora'}<br />Criado por {e.criadoPor || '-'} em {e.dataCriacao || '-'}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
