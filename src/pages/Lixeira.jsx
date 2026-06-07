import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { listarLixeira, restaurarEstadiaALancar, restaurarEstadiaLancada } from '../lib/ayresSafety'

function tipoLabel(tipo) {
  if (tipo === 'estadia') return 'Estadia lançada'
  if (tipo === 'a_lancar') return 'A lançar'
  if (tipo === 'captacao') return 'Captação'
  return tipo || 'Registro'
}

function placaRegistro(item) {
  return item?.registro?.placa || item?.registro?.dados?.placa || '-'
}

function resumoRegistro(item) {
  const r = item?.registro || {}
  return [r.motorista, r.transportadora, r.chamado, r.observacao, r.obs].filter(Boolean).join(' · ') || 'Sem resumo disponível'
}

export default function Lixeira() {
  const { usuarioAtual, toast } = useApp()
  const [itens, setItens] = useState([])
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    try {
      const data = await listarLixeira()
      setItens(data)
    } catch (err) {
      setErro('Não consegui carregar a lixeira. Rode o SQL de organização do banco para criar a tabela vl_lixeira.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return itens
      .filter(i => !tipo || i.origem_tipo === tipo)
      .filter(i => !q || [i.origem_tipo, i.origem_local_id, placaRegistro(i), resumoRegistro(i), i.apagado_por, i.motivo].join(' ').toLowerCase().includes(q))
  }, [itens, busca, tipo])

  const restaurar = async (item) => {
    if (item.restaurado) return
    if (!confirm('Restaurar este item para o painel?')) return
    try {
      if (item.origem_tipo === 'estadia') await restaurarEstadiaLancada(item.id, usuarioAtual?.usuario || '-')
      else if (item.origem_tipo === 'a_lancar') await restaurarEstadiaALancar(item.id, usuarioAtual?.usuario || '-')
      else {
        toast?.('Restauração automática disponível por enquanto apenas para estadias.', 'warn')
        return
      }
      toast?.('Item restaurado. Atualize a nuvem para aparecer na lista.', 'ok')
      await carregar()
    } catch {
      toast?.('Erro ao restaurar item.', 'err')
    }
  }

  return (
    <section className="aba active">
      <div className="box trash-hero">
        <div className="box-title">
          <div>
            <h2>Lixeira operacional</h2>
            <span>Itens arquivados ficam preservados para evitar perda de estadias e anexos.</span>
          </div>
          <button className="btn-light btn-small" onClick={carregar}>Atualizar</button>
        </div>
        <div className="filters">
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar placa, motorista, usuário ou motivo..." />
          <select value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="estadia">Estadias lançadas</option>
            <option value="a_lancar">A lançar</option>
            <option value="captacao">Captação</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Placa</th>
                <th>Resumo</th>
                <th>Anexos</th>
                <th>Apagado por</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr><td colSpan={8} className="empty">Carregando lixeira...</td></tr>
              ) : erro ? (
                <tr><td colSpan={8} className="empty">{erro}</td></tr>
              ) : lista.length === 0 ? (
                <tr><td colSpan={8} className="empty">Nenhum item na lixeira.</td></tr>
              ) : lista.map(item => (
                <tr key={item.id}>
                  <td><span className="badge badge-logistica">{tipoLabel(item.origem_tipo)}</span><br /><small>{item.origem_local_id}</small></td>
                  <td><span className="plate">{placaRegistro(item)}</span></td>
                  <td>{resumoRegistro(item)}<br /><small>{item.motivo || 'Sem motivo informado'}</small></td>
                  <td>{Array.isArray(item.anexos) ? item.anexos.length : 0}</td>
                  <td>{item.apagado_por || '-'}</td>
                  <td>{item.apagado_em ? new Date(item.apagado_em).toLocaleString('pt-BR') : '-'}</td>
                  <td>{item.restaurado ? <span className="status status-feito">Restaurado</span> : <span className="status status-aberto">Arquivado</span>}</td>
                  <td><button className="btn-green btn-small" disabled={item.restaurado} onClick={() => restaurar(item)}>Restaurar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
