import { useEffect, useMemo, useState } from 'react'
import { useEstadiaContext } from '../context/hooks'

const EMPTY_ITEM = {
  tipo: 'Painel',
  titulo: 'Sem movimentações recentes',
  detalhe: 'As novas estadias e pendências aparecerão aqui automaticamente.',
  data: null,
  tom: 'ok',
}

function dataProvavel(item) {
  return item?.updated_at
    || item?.updatedAt
    || item?.dataLancamento
    || item?.dataCriacao
    || item?.dataFinalizado
    || item?.dataFeito
    || item?.created_at
    || item?.dataISO
    || item?.data
    || item?.chegada
    || null
}

function dataMs(valor) {
  if (!valor) return 0
  const nativo = new Date(valor)
  if (!Number.isNaN(nativo.getTime())) return nativo.getTime()

  const br = String(valor).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (!br) return 0
  const [, dia, mes, ano, hora = '0', minuto = '0', segundo = '0'] = br
  return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto), Number(segundo)).getTime()
}

function tempoRelativo(valor) {
  const ts = dataMs(valor)
  if (!ts) return 'agora'
  const diff = Math.max(0, Date.now() - ts)
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `há ${horas}h`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`
}

function normalizarEstadia(item, origem = 'estadia') {
  const dados = item?.dados || item || {}
  const statusRaw = item?.status || dados?.status || ''
  const status = String(statusRaw).toLowerCase()
  const motorista = item?.motorista || dados?.motorista || dados?.nomeMotorista || dados?.nome || 'motorista não informado'
  const placa = item?.placa || dados?.placa || dados?.placaVeiculo || ''
  const transportadora = item?.transportadora || dados?.transportadora || ''
  const data = dataProvavel(item)

  if (origem === 'a_lancar' || status.includes('lançar') || status.includes('pendente')) {
    return {
      tipo: 'Pendente',
      titulo: 'Estadia pendente a lançar',
      detalhe: `${motorista}${placa ? ` · placa ${placa}` : ''}${transportadora ? ` · ${transportadora}` : ''}`,
      data,
      tom: 'alerta',
    }
  }

  if (status.includes('final')) {
    return {
      tipo: 'Finalizada',
      titulo: 'Estadia finalizada',
      detalhe: `${motorista}${placa ? ` · placa ${placa}` : ''}`,
      data,
      tom: 'final',
    }
  }

  return {
    tipo: 'Lançada',
    titulo: 'Estadia lançada',
    detalhe: `${motorista}${placa ? ` · placa ${placa}` : ''}`,
    data,
    tom: 'ok',
  }
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
        <small>{tempoRelativo(item.data)}</small>
      </div>
    </div>
  )
}

export default function EstadiaTicker() {
  const { estadias, estadiasALancar } = useEstadiaContext()
  const [index, setIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState(null)
  const [animating, setAnimating] = useState(false)

  const items = useMemo(() => {
    const reais = [
      ...estadias.map(item => normalizarEstadia(item, 'estadia')),
      ...estadiasALancar.map(item => normalizarEstadia(item, 'a_lancar')),
    ]
      .filter(item => item?.detalhe && !item.detalhe.toLowerCase().includes('undefined'))
      .sort((a, b) => dataMs(b.data) - dataMs(a.data))
      .slice(0, 12)

    return reais.length ? reais : [EMPTY_ITEM]
  }, [estadias, estadiasALancar])

  useEffect(() => {
    setIndex(current => current % Math.max(1, items.length))
    setPreviousIndex(null)
    setAnimating(false)
  }, [items.length])

  useEffect(() => {
    if (items.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setIndex(current => {
        setPreviousIndex(current)
        setAnimating(true)
        return (current + 1) % items.length
      })
      window.setTimeout(() => {
        setAnimating(false)
        setPreviousIndex(null)
      }, 850)
    }, 10000)
    return () => window.clearInterval(timer)
  }, [items.length])

  const item = items[index % items.length] || EMPTY_ITEM
  const previousItem = previousIndex === null ? null : items[previousIndex % items.length]

  return (
    <div className={`estadia-ticker estadia-ticker-shell ${animating ? 'is-sliding' : ''}`}>
      {previousItem && <TickerCard item={previousItem} mode="out" />}
      <TickerCard item={item} mode={animating ? 'in' : 'current'} />
    </div>
  )
}
