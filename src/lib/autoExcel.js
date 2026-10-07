import { BUCKET, TABLE, getClient } from './supabase'
import { nomeFilial } from '../data/filiais'

export const EXCEL_AUTO_PATH = 'relatorios/relatorio-estadias-automatico.xls'

function htmlEscape(v) {
  return String(v ?? '-')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export const colunasExcelEstadias = [
  ['NF', e => e.nf || e.numeroNf || ''],
  ['CT-e', e => e.cte || ''],
  ['MOTORISTA', e => e.motorista || ''],
  ['PLACA', e => e.placa || ''],
  ['TRANSPORTADORA', e => e.transportadora || ''],
  ['ORIGEM / LOCAL', e => e.localEstadia || e.local || ''],
  ['FILIAL', e => nomeFilial(e.filial)],
  ['PRODUTO / PLATAFORMA', e => e.plataforma || e.produto || ''],
  ['PESO (KG)', e => e.peso || ''],
  ['CHEGADA', e => [e.chegadaData, e.chegadaHora].filter(Boolean).join(' ')],
  ['SAÍDA / DESCARGA', e => [e.saidaData, e.saidaHora].filter(Boolean).join(' ')],
  ['FRANQUIA', e => e.franquia ? `${e.franquia}:00` : '12:00'],
  ['HORAS A PAGAR', e => e.horasPagar || e.horas || e.totalHoras || ''],
  ['FATOR', e => e.valorHora || '0,80'],
  ['VALOR', e => e.valor || e.valorCalculado || ''],
  ['DATA LANÇAMENTO', e => e.dataLancamento || e.dataCriacao || ''],
  ['CHAMADO', e => e.chamado || ''],
  ['STATUS', e => e.status || ''],
  ['OBSERVAÇÃO / CONTROLE', e => e.obs || e.observacao || ''],
  ['RESPONSÁVEL', e => e.finalizadoPor || e.feitoPor || e.emAnalisePor || e.lancadoPor || e.criadoPor || ''],
]

export function gerarExcelEstadiasHtml(lista = []) {
  const cabecalho = colunasExcelEstadias.map(([titulo]) => `<th>${htmlEscape(titulo)}</th>`).join('')
  const corpo = lista.map(e => {
    const concluida = e.status === 'Finalizado' || e.status === 'Feito'
    const classe = concluida ? 'linha-ok' : 'linha-pendente'
    return `<tr class="${classe}">${colunasExcelEstadias.map(([, obter]) => `<td>${htmlEscape(obter(e))}</td>`).join('')}</tr>`
  }).join('')

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Calibri,Arial,sans-serif;font-size:11pt}
    table{border-collapse:collapse}
    th,td{border:1px solid #222;padding:4px 8px;white-space:nowrap;vertical-align:middle}
    th{background:#d9e1f2;font-weight:700;text-align:center}
    td{min-width:92px}
    td:nth-child(3),td:nth-child(5),td:nth-child(18),td:nth-child(19){min-width:210px}
    .linha-ok td{background:#70ad47}
    .linha-pendente td{background:#ffc7ce}
    .linha-ok td:nth-child(-n+17),.linha-pendente td:nth-child(-n+17){background:#fff}
  </style></head><body><table><thead><tr>${cabecalho}</tr></thead><tbody>${corpo}</tbody></table></body></html>`
}

export function blobExcelEstadias(lista = []) {
  return new Blob(['\ufeff', gerarExcelEstadiasHtml(lista)], { type: 'application/vnd.ms-excel;charset=utf-8;' })
}

export async function atualizarExcelAutomatico() {
  const sb = getClient()
  const { data, error } = await sb
    .from(TABLE)
    .select('dados, updated_at')
    .eq('tipo', 'lancada')
    .order('updated_at', { ascending: false })

  if (error) throw error

  const lista = (data || []).map(row => row.dados).filter(Boolean)
  const blob = blobExcelEstadias(lista)

  const { error: uploadError } = await sb.storage
    .from(BUCKET)
    .upload(EXCEL_AUTO_PATH, blob, {
      upsert: true,
      contentType: 'application/vnd.ms-excel;charset=utf-8',
      cacheControl: '0',
    })

  if (uploadError) throw uploadError

  const { data: publicData } = sb.storage.from(BUCKET).getPublicUrl(EXCEL_AUTO_PATH)
  return { url: publicData.publicUrl, total: lista.length }
}

export function getExcelAutomaticoUrl() {
  const sb = getClient()
  const { data } = sb.storage.from(BUCKET).getPublicUrl(EXCEL_AUTO_PATH)
  return data.publicUrl
}
