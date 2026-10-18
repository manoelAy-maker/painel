import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { nomeFilial } from '../data/filiais'
import '../styles/estadias-planilha.css'

function texto(v, fallback = '-') {
  const s = String(v ?? '').trim()
  return s || fallback
}

function dataHora(data, hora) {
  const d = String(data || '').trim()
  const h = String(hora || '').trim()
  return [d, h].filter(Boolean).join(' ') || '-'
}

function statusClasse(status) {
  if (status === 'Finalizado') return 'plan-status finalizado'
  if (status === 'Feito') return 'plan-status feito'
  if (status === 'Em análise') return 'plan-status analise'
  return 'plan-status aberto'
}

export default function EstadiasPlanilha() {
  const { estadias = [], filiais = [], mudarAba } = useApp()
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [filial, setFilial] = useState('')

  const lista = useMemo(() => {
    const termo = busca.trim().toUpperCase()
    return estadias.filter(e => {
      const base = [
        e.placa, e.motorista, e.transportadora, e.nf, e.numeroNf, e.cte,
        e.chamado, e.status, e.lancadoPor, e.obs
      ].join(' ').toUpperCase()
      return (!termo || base.includes(termo))
        && (!status || e.status === status)
        && (!filial || e.filial === filial)
    })
  }, [estadias, busca, status, filial])

  const editar = (e) => {
    localStorage.setItem('editarEstadiaLancadaId', String(e.id))
    mudarAba('lancadas')
  }

  return (
    <section className="aba active planilha-page">
      <header className="planilha-head">
        <div>
          <span className="planilha-kicker">Operação rápida</span>
          <h2>Visão planilha</h2>
          <p>Mais linhas na tela, menos cliques. Feita para conferência e acompanhamento da operação.</p>
        </div>
        <div className="planilha-head-actions">
          <button className="btn-blue" onClick={() => mudarAba('lancadas')}>+ Lançar estadia</button>
        </div>
      </header>

      <div className="planilha-toolbar">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar placa, motorista, NF, CT-e, chamado..."
        />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option>Aberto</option>
          <option>Em análise</option>
          <option>Feito</option>
          <option>Finalizado</option>
        </select>
        <select value={filial} onChange={e => setFilial(e.target.value)}>
          <option value="">Todas as filiais</option>
          {filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
        <button className="btn-light btn-small" onClick={() => { setBusca(''); setStatus(''); setFilial('') }}>Limpar</button>
        <div className="planilha-count"><strong>{lista.length}</strong><span>registro(s)</span></div>
      </div>

      <div className="planilha-wrap">
        <table className="planilha-table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Motorista</th>
              <th>NF</th>
              <th>CT-e</th>
              <th>Transportadora</th>
              <th>Filial</th>
              <th>Chegada</th>
              <th>Saída</th>
              <th>Horas</th>
              <th>Valor</th>
              <th>Chamado</th>
              <th>Status</th>
              <th>Responsável</th>
              <th>Docs</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr><td colSpan="15" className="planilha-empty">Nenhuma estadia encontrada.</td></tr>
            )}
            {lista.map(e => (
              <tr key={e.id}>
                <td><span className="plan-plate">{texto(e.placa)}</span></td>
                <td className="wide">{texto(e.motorista)}</td>
                <td>{texto(e.nf || e.numeroNf)}</td>
                <td>{texto(e.cte)}</td>
                <td className="wide">{texto(e.transportadora)}</td>
                <td>{nomeFilial(e.filial)}</td>
                <td>{dataHora(e.chegadaData, e.chegadaHora)}</td>
                <td>{dataHora(e.saidaData, e.saidaHora)}</td>
                <td>{texto(e.horas || e.totalHoras, '0')} h</td>
                <td><strong>{texto(e.valor || e.valorCalculado, 'R$ 0,00')}</strong></td>
                <td>{texto(e.chamado)}</td>
                <td><span className={statusClasse(e.status)}>{texto(e.status, 'Aberto')}</span></td>
                <td>{texto(e.finalizadoPor || e.feitoPor || e.emAnalisePor || e.lancadoPor)}</td>
                <td>
                  {e.anexos?.length
                    ? <div className="plan-docs">{e.anexos.slice(0,2).map((a,i) => <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" title={a.nome || 'Anexo'}>📎</a>)}</div>
                    : <span className="plan-muted">-</span>}
                </td>
                <td><button className="plan-edit" onClick={() => editar(e)}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
