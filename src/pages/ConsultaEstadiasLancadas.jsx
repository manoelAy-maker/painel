import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { linkWhatsapp, dataISOTexto, tempoDecorrido } from '../utils/index'
import { nomeFilial } from '../data/filiais'
import '../estadia-desktop-pro.css'

function badgePago(p) {
  return p === 'Transportes'
    ? <span className="badge badge-transportes">Transportes</span>
    : <span className="badge badge-logistica">Logística</span>
}

function classePrio(p) {
  if (p === 'Urgente') return 'prio-urgente'
  if (p === 'Média') return 'prio-media'
  return 'prio-normal'
}

function classeStatus(s) {
  if (s === 'Finalizado') return 'status-finalizado'
  if (s === 'Feito') return 'status-feito'
  return 'status-aberto'
}

function TempoInfo({ label, data, compacto = false }) {
  return (
    <div className={`tempo-info ${compacto ? 'tempo-compacto' : ''}`}>
      <strong>{tempoDecorrido(data)}</strong>
      <small>{label}</small>
    </div>
  )
}

export default function ConsultaEstadiasLancadas() {
  const { estadias, marcarFeito, finalizar, reabrir, filiais, mudarAba } = useApp()
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroFilial, setFiltroFilial] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const lista = useMemo(() => estadias.filter(e => {
    const txt = ((e.placa || '') + ' ' + (e.motorista || '') + ' ' + (e.chamado || '') + ' ' + (e.transportadora || '') + ' ' + (e.nf || e.numeroNf || '')).toUpperCase()
    const data = dataISOTexto(e.dataLancamento)
    return (!busca || txt.includes(busca.toUpperCase()))
      && (!filtroStatus || e.status === filtroStatus)
      && (!filtroFilial || e.filial === filtroFilial)
      && (!dataInicio || data >= dataInicio)
      && (!dataFim || data <= dataFim)
  }), [estadias, busca, filtroStatus, filtroFilial, dataInicio, dataFim])

  const limpar = () => {
    setBusca('')
    setFiltroStatus('')
    setFiltroFilial('')
    setDataInicio('')
    setDataFim('')
  }

  return (
    <section className="aba active" id="abaConsultaLancadas">
      <div className="box estadia-filter-box">
        <div className="box-title">
          <div>
            <h2>Estadias lançadas</h2>
            <span>Consulta separada do lançamento. Aqui é só para acompanhar, filtrar e alterar status.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-green btn-small" onClick={() => mudarAba('lancadas')}>+ Lançar nova</button>
            <button className="btn-light btn-small" onClick={limpar}>Limpar filtros</button>
          </div>
        </div>
        <div className="filters estadia-filters">
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar placa, motorista, chamado, NF..." />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option value="">Todos status</option><option>Aberto</option><option>Feito</option><option>Finalizado</option></select>
          <select value={filtroFilial} onChange={e => setFiltroFilial(e.target.value)}><option value="">Todas as filiais</option>{filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap estadia-table-wrap">
        <div className="table-scroll">
          <table>
            <thead><tr><th>NF</th><th>Chamado</th><th>Motorista</th><th>Transportadora</th><th>Placa</th><th>Peso</th><th>Horas</th><th>Valor</th><th>Pago por</th><th>Prioridade</th><th>Filial</th><th>Anexos</th><th>Lançado por</th><th>Lançada há</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.length === 0
                ? <tr><td colSpan={16} className="empty">Nenhuma estadia encontrada.</td></tr>
                : lista.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.nf || e.numeroNf || '-'}</strong></td>
                    <td><strong>{e.chamado || '-'}</strong><br /><small>{e.dataLancamento || ''}</small></td>
                    <td>{e.motorista || '-'}<br /><small>Chegada: {e.chegada || '-'}<br />Saída: {e.saida || '-'}</small></td>
                    <td>{e.transportadora || '-'}</td>
                    <td><span className="plate">{e.placa || '-'}</span><br /><TempoInfo label="lançada há" data={e.dataLancamento} compacto /></td>
                    <td>{e.peso || '-'}</td>
                    <td><strong>{e.horas || '0.00'} h</strong></td>
                    <td><strong>{e.valor || 'R$ 0,00'}</strong></td>
                    <td>{badgePago(e.pagoPor)}</td>
                    <td><span className={`prio ${classePrio(e.prioridade)}`}>{e.prioridade || 'Normal'}</span></td>
                    <td><span className="badge badge-logistica">{nomeFilial(e.filial)}</span></td>
                    <td>{e.anexos?.length ? e.anexos.map((a, i) => <a key={i} className="anexo-link" href={a.url} target="_blank" rel="noopener noreferrer">📄 {a.nome || `Arquivo ${i + 1}`}</a>) : '-'}</td>
                    <td>{e.lancadoPor || '-'}</td>
                    <td><TempoInfo label="desde o lançamento" data={e.dataLancamento} /></td>
                    <td><span className={`status ${classeStatus(e.status)}`}>{e.status}</span>{e.feitoPor && <><br /><small>Feito por {e.feitoPor}</small></>}{e.finalizadoPor && <><br /><small>Finalizado por {e.finalizadoPor}</small></>}</td>
                    <td><div className="actions">{e.status === 'Aberto' && <button className="btn-green btn-small" onClick={() => marcarFeito(e.id)}>Feito</button>}{e.status === 'Feito' && <button className="btn-purple btn-small" onClick={() => finalizar(e.id)}>Finalizar</button>}{e.status !== 'Aberto' && <button className="btn-orange btn-small" onClick={() => reabrir(e.id)}>Reabrir</button>}<button className="btn-light btn-small" onClick={() => mudarAba('lancadas')}>Editar</button>{e.telefoneMotorista && <a className="btn btn-green btn-small" href={linkWhatsapp(e)} target="_blank" rel="noopener noreferrer">WhatsApp</a>}</div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
