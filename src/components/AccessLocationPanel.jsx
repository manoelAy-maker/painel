import { useEffect, useMemo, useState } from 'react'
import { baixarAdmin } from '../lib/supabase'
import { nomeFilial } from '../data/filiais'

function fmtCoord(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(6) : '-'
}

function fmtPrecisao(v) {
  const n = Number(v)
  return Number.isFinite(n) ? `${Math.round(n)} m` : '-'
}

function statusClasse(status) {
  if (status === 'precisa') return 'ok'
  if (status === 'atenção') return 'warn'
  if (status === 'negada') return 'danger'
  if (status === 'erro') return 'danger'
  return 'muted'
}

export default function AccessLocationPanel() {
  const [rows, setRows] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [busca, setBusca] = useState('')

  const carregar = async () => {
    setCarregando(true)
    try {
      const data = await baixarAdmin()
      const locs = (data || [])
        .filter(x => x.tipo === 'localizacao')
        .map(x => ({ ...(x.dados || {}), filial: x.filial || x.dados?.filial || 'jatai-go', updated_at: x.updated_at }))
        .sort((a, b) => new Date(b.dataISO || b.updated_at || 0) - new Date(a.dataISO || a.updated_at || 0))
      setRows(locs)
    } catch {
      setRows([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return rows
      .filter(r => !termo || [r.usuario, r.nome, r.filial, r.statusTexto, r.status].join(' ').toLowerCase().includes(termo))
      .slice(0, 30)
  }, [rows, busca])

  const ultimaComMapa = rows.find(r => r.latitude && r.longitude)

  return (
    <div className="users-pro-card access-location-card">
      <div className="users-pro-card-head users-pro-list-head">
        <div>
          <h3>Localização de acessos</h3>
          <p>Últimas permissões de localização capturadas no login. Mostra latitude, longitude e precisão em metros.</p>
        </div>
        <div className="access-location-actions">
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar usuário ou filial..." />
          <button className="users-pro-ghost" onClick={carregar}>{carregando ? 'Atualizando...' : 'Atualizar'}</button>
        </div>
      </div>

      {ultimaComMapa && (
        <div className="access-location-feature">
          <div>
            <span>Última localização com mapa</span>
            <strong>{ultimaComMapa.nome || ultimaComMapa.usuario}</strong>
            <small>{nomeFilial(ultimaComMapa.filial)} · {fmtCoord(ultimaComMapa.latitude)}, {fmtCoord(ultimaComMapa.longitude)} · precisão {fmtPrecisao(ultimaComMapa.precisaoMetros)}</small>
          </div>
          <a href={ultimaComMapa.mapa} target="_blank" rel="noopener noreferrer">Abrir no mapa</a>
        </div>
      )}

      <div className="users-pro-table-wrap">
        <table className="users-pro-table access-location-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Filial</th>
              <th>Status</th>
              <th>Precisão</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Data/Hora</th>
              <th style={{ textAlign: 'right' }}>Mapa</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r, idx) => (
              <tr key={`${r.id || r.usuario}_${idx}`}>
                <td><strong>{r.nome || r.usuario}</strong><small className="access-sub">{r.usuario}</small></td>
                <td>{nomeFilial(r.filial)}</td>
                <td><span className={`users-pro-chip location-${statusClasse(r.status)}`}>{r.statusTexto || r.status || '-'}</span></td>
                <td>{fmtPrecisao(r.precisaoMetros)}</td>
                <td><code>{fmtCoord(r.latitude)}</code></td>
                <td><code>{fmtCoord(r.longitude)}</code></td>
                <td>{r.data || '-'}</td>
                <td>
                  <div className="users-pro-row-actions">
                    {r.mapa ? <a className="access-map-btn" href={r.mapa} target="_blank" rel="noopener noreferrer">Ver mapa</a> : <span className="access-denied">Sem mapa</span>}
                  </div>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && <tr><td colSpan={8} className="users-pro-empty">Nenhuma localização registrada ainda. Ela será capturada no próximo login dos usuários.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
