import { useEffect, useMemo, useState } from 'react'

const FALLBACK_ITEMS = [
  { tipo: 'Lançada', titulo: 'Estadia lançada', detalhe: 'Motorista João Silva · placa ABC1D23', tempo: 'há 8 dias', tom: 'ok' },
  { tipo: 'Pendente', titulo: 'Estadia pendente a lançar', detalhe: 'Motorista Carlos Pereira · aguardando conferência', tempo: 'há 3 dias', tom: 'alerta' },
  { tipo: 'Finalizada', titulo: 'Estadia finalizada', detalhe: 'Placa XYZ7K89 · processo concluído', tempo: 'hoje', tom: 'final' },
]

function safeJson(key) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : []
  } catch {
    return []
  }
}

function dataProvavel(item) {
  return item?.updated_at || item?.created_at || item?.dataISO || item?.data || item?.dados?.created_at || item?.dados?.data || item?.dados?.chegada || null
}

function tempoRelativo(valor) {
  if (!valor) return 'agora'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return String(valor).slice(0, 18)
  const diff = Date.now() - data.getTime()
  const min = Math.max(0, Math.floor(diff / 60000))
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `há ${horas}h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'há 1 dia'
  return `há ${dias} dias`
}

function normalizarEstadia(item, origem = 'estadia') {
  const dados = item?.dados || item || {}
  const statusRaw = item?.status || dados?.status || ''
  const status = String(statusRaw).toLowerCase()
  const motorista = item?.motorista || dados?.motorista || dados?.nomeMotorista || dados?.nome || 'motorista não informado'
  const placa = item?.placa || dados?.placa || dados?.placaVeiculo || ''
  const transportadora = item?.transportadora || dados?.transportadora || ''
  const tempo = tempoRelativo(dataProvavel(item))

  if (origem === 'a_lancar' || status.includes('lançar') || status.includes('pendente')) {
    return {
      tipo: 'Pendente',
      titulo: 'Estadia pendente a lançar',
      detalhe: `${motorista}${placa ? ` · placa ${placa}` : ''}${transportadora ? ` · ${transportadora}` : ''}`,
      tempo,
      tom: 'alerta',
    }
  }

  if (status.includes('final')) {
    return {
      tipo: 'Finalizada',
      titulo: 'Estadia finalizada',
      detalhe: `${motorista}${placa ? ` · placa ${placa}` : ''}`,
      tempo,
      tom: 'final',
    }
  }

  return {
    tipo: 'Lançada',
    titulo: 'Estadia lançada',
    detalhe: `${motorista}${placa ? ` · placa ${placa}` : ''}`,
    tempo,
    tom: 'ok',
  }
}

function carregarTickerItems() {
  const possiveis = [
    ...safeJson('estadiasLancadasViaLog').map(i => normalizarEstadia(i, 'estadia')),
    ...safeJson('estadiasALancarViaLog').map(i => normalizarEstadia(i, 'a_lancar')),
    ...safeJson('ldc_estadias').map(i => normalizarEstadia(i, i?.tipo === 'a_lancar' ? 'a_lancar' : 'estadia')),
  ]

  const validos = possiveis
    .filter(i => i?.detalhe && !i.detalhe.toLowerCase().includes('undefined'))
    .slice(0, 12)

  return validos.length ? validos : FALLBACK_ITEMS
}

function TickerCard({ item, mode }) {
  return (
    <div className={`estadia-ticker-card estadia-ticker-card-${mode} estadia-ticker-${item.tom}`}>
      <div className="estadia-ticker-rail" />
      <div className="estadia-ticker-icon">!</div>
      <div className="estadia-ticker-copy">
        <strong>{item.titulo}</strong>
        <span>{item.detalhe}</span>
      </div>
      <div className="estadia-ticker-meta">
        <b>{item.tipo}</b>
        <small>{item.tempo}</small>
      </div>
    </div>
  )
}

export default function EstadiaTicker() {
  const [items, setItems] = useState(() => carregarTickerItems())
  const [index, setIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState(null)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const recarregar = () => setItems(carregarTickerItems())
    window.addEventListener('storage', recarregar)
    window.addEventListener('ayres:estadias', recarregar)
    const sync = setInterval(recarregar, 30000)
    return () => {
      window.removeEventListener('storage', recarregar)
      window.removeEventListener('ayres:estadias', recarregar)
      clearInterval(sync)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(current => {
        setPreviousIndex(current)
        setAnimating(true)
        return (current + 1) % Math.max(1, items.length)
      })
      window.setTimeout(() => {
        setAnimating(false)
        setPreviousIndex(null)
      }, 850)
    }, 10000)
    return () => clearInterval(timer)
  }, [items.length])

  const item = useMemo(() => items[index % Math.max(1, items.length)] || FALLBACK_ITEMS[0], [items, index])
  const previousItem = previousIndex === null ? null : items[previousIndex % Math.max(1, items.length)]

  return (
    <div className={`estadia-ticker estadia-ticker-shell ${animating ? 'is-sliding' : ''}`}>
      {previousItem && <TickerCard item={previousItem} mode="out" />}
      <TickerCard item={item} mode={animating ? 'in' : 'current'} />
    </div>
  )
}
