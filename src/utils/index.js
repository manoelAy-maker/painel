import { calcularEstadiaPadrao } from '../modules/estadia/services/estadiaCalculo'

export const dinheiro = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const moedaNumero = (v) =>
  Number(String(v || '').replace('R$', '').replaceAll(' ', '').replaceAll('.', '').replace(',', '.').trim()) || 0

export const formatarData = (d, h) => {
  if (!d || !h) return '-'
  const [ano, mes, dia] = d.split('-')
  return `${dia}/${mes}/${ano} ${h}`
}

export const dataISOTexto = (txt) => {
  if (!txt) return ''
  if (txt instanceof Date && !Number.isNaN(txt.getTime())) {
    const d = new Date(txt)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 10)
  }

  const raw = String(txt).trim()
  if (!raw) return ''

  const isoCurto = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoCurto) return `${isoCurto[1]}-${isoCurto[2]}-${isoCurto[3]}`

  const br = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (br) {
    const dia = br[1].padStart(2, '0')
    const mes = br[2].padStart(2, '0')
    return `${br[3]}-${mes}-${dia}`
  }

  const dt = new Date(raw)
  if (!Number.isNaN(dt.getTime())) {
    dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())
    return dt.toISOString().slice(0, 10)
  }

  return ''
}

export const parseDataBR = (txt) => {
  if (!txt) return null
  if (txt instanceof Date) return Number.isNaN(txt.getTime()) ? null : txt

  const raw = String(txt).trim()
  if (!raw) return null

  const iso = new Date(raw)
  if (!Number.isNaN(iso.getTime())) return iso

  const normalizado = raw.replace(',', ' ')
  const [data, hora = '00:00:00'] = normalizado.split(/\s+/)
  const partes = data.split('/')
  if (partes.length !== 3) return null

  const [dia, mes, ano] = partes.map(Number)
  const [hh = 0, mm = 0, ss = 0] = hora.split(':').map(Number)
  const dt = new Date(ano, mes - 1, dia, hh, mm, ss)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export const minutosDesde = (txt) => {
  const dt = parseDataBR(txt)
  if (!dt) return 0
  return Math.max(0, Math.floor((Date.now() - dt.getTime()) / 60000))
}

export const tempoDecorrido = (txt) => {
  const dt = parseDataBR(txt)
  if (!dt) return '-'

  const diffMs = Date.now() - dt.getTime()
  if (diffMs < 0) return 'agora'

  const minutos = Math.floor(diffMs / 60000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `${minutos} min`

  const horas = Math.floor(minutos / 60)
  if (horas < 24) {
    const restoMin = minutos % 60
    return restoMin ? `${horas}h ${restoMin}min` : `${horas}h`
  }

  const dias = Math.floor(horas / 24)
  const restoHoras = horas % 24
  if (dias < 30) return restoHoras ? `${dias}d ${restoHoras}h` : `${dias}d`

  const meses = Math.floor(dias / 30)
  const restoDias = dias % 30
  if (meses < 12) return restoDias ? `${meses}m ${restoDias}d` : `${meses}m`

  const anos = Math.floor(meses / 12)
  const restoMeses = meses % 12
  return restoMeses ? `${anos}a ${restoMeses}m` : `${anos}a`
}

export const slaPendencia = (txt) => {
  const min = minutosDesde(txt)
  const horas = min / 60

  if (horas >= 24) {
    return { nivel: 'critico', label: 'Crítico', ordem: 4, cor: '#dc2626', descricao: 'mais de 24h parada' }
  }
  if (horas >= 6) {
    return { nivel: 'urgente', label: 'Urgente', ordem: 3, cor: '#f97316', descricao: 'mais de 6h parada' }
  }
  if (horas >= 2) {
    return { nivel: 'atencao', label: 'Atenção', ordem: 2, cor: '#f59e0b', descricao: 'mais de 2h parada' }
  }
  return { nivel: 'normal', label: 'Normal', ordem: 1, cor: '#22c55e', descricao: 'dentro do prazo' }
}

export const resumirSLA = (pendencias = []) => {
  const base = { normal: 0, atencao: 0, urgente: 0, critico: 0 }
  pendencias.forEach(p => { base[slaPendencia(p.dataCriacao).nivel] += 1 })
  return base
}

export const linkWhatsapp = (e) => {
  if (!e.telefoneMotorista) return ''
  let n = String(e.telefoneMotorista).replace(/[^0-9]/g, '')
  if (!n.startsWith('55')) n = '55' + n
  const msg = `Olá ${e.motorista || ''}, sua estadia da placa ${e.placa || ''}${e.chamado ? ' do chamado ' + e.chamado : ''} já foi lançada. Valor: ${e.valor || ''}.`
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`
}

// Compatibilidade: chamadas antigas continuam funcionando, mas agora usam o motor oficial do módulo Estadia.
export const calcularEstadia = calcularEstadiaPadrao

export const gerarId = () => Date.now() + Math.floor(Math.random() * 1000)

export const baixarArquivo = (nome, conteudo, tipo) => {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}
