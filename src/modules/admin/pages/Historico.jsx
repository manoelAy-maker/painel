import { useApp } from '../../../context/AppContext'

export default function Historico() {
  const { historico, dispatch, toast } = useApp()

  const limparHistorico = () => {
    if (!confirm('Limpar histórico?')) return
    dispatch({ type: 'SET_HISTORICO', payload: [] })
    toast?.('Histórico limpo.', 'ok')
  }

  return (
    <section className="aba active" id="abaHistorico">
      <div className="box">
        <div className="box-title">
          <h2>Histórico de alterações</h2>
          <button className="btn-red btn-small" onClick={limparHistorico} disabled={!historico.length}>Limpar histórico</button>
        </div>
        <div className="table-wrap" style={{ marginBottom: 0 }}>
          <table>
            <thead><tr><th>Data</th><th>Usuário</th><th>Ação</th><th>Detalhes</th></tr></thead>
            <tbody>
              {historico.length === 0
                ? <tr><td colSpan={4} className="empty">Nenhum histórico ainda.</td></tr>
                : historico.map((h, i) => (
                  <tr key={`${h.data || ''}-${h.acao || ''}-${i}`}>
                    <td>{h.data}</td>
                    <td>{h.usuario}</td>
                    <td><strong>{h.acao}</strong></td>
                    <td>{h.detalhes}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
