import { useAuthContext, useCloudContext, useUiContext } from '../../context/hooks'

export default function ConfigModal({ show, onClose }) {
  const { usuarioAtual, logout } = useAuthContext()
  const { conectarSupabase, sincronizarFila } = useCloudContext()
  const { alternarTema } = useUiContext()

  if (!show) return null

  return (
    <div className="modal-config show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-config-card">
        <div className="modal-config-head">
          <div>
            <h2>Configurações</h2>
            <p>Controle visual, conexão e preferências do painel.</p>
          </div>
          <button className="btn-red btn-small" onClick={onClose}>Fechar</button>
        </div>

        <div className="config-grid">
          <div className="config-item">
            <strong>Sons premium</strong>
            <span>Os sons ficam sempre ativos e ajudam a perceber cliques, salvamentos, erros e sincronização.</span>
            <button className="btn-light btn-small" disabled>Sempre ativo</button>
          </div>

          <div className="config-item">
            <strong>Aparência</strong>
            <span>Troque entre modo claro e escuro.</span>
            <button className="btn-light btn-small" onClick={alternarTema}>Alternar tema</button>
          </div>

          <div className="config-item">
            <strong>Conexão da nuvem</strong>
            <span>Reconectar e subir pendências offline.</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <button className="btn-blue btn-small" onClick={conectarSupabase}>Reconectar</button>
              <button className="btn-green btn-small" onClick={sincronizarFila}>Sincronizar</button>
            </div>
          </div>

          <div className="config-item">
            <strong>Usuário atual</strong>
            <span>{usuarioAtual ? `${usuarioAtual.nome} • ${usuarioAtual.cargo}` : 'Nenhum usuário logado.'}</span>
            <button className="btn-orange btn-small" onClick={logout}>Sair da conta</button>
          </div>
        </div>
      </div>
    </div>
  )
}
