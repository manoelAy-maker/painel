import { describe, expect, it } from 'vitest'
import { statusEstadiaTexto, tempoParadoTexto, tempoParadoClasse } from '../estadiaDisplay'

describe('exibição das estadias importadas', () => {
  it('identifica a aprovação logística sem alterar o estado em análise', () => {
    expect(statusEstadiaTexto({ status: 'Em análise', statusOriginalPlanilha: 'Chamado aberto / Aguardando aprovação Logística' })).toBe('Aguardando Logística')
  })
  it('não reaplica aguardando a uma estadia finalizada', () => {
    expect(statusEstadiaTexto({ status: 'Finalizado', statusOriginalPlanilha: 'Aguardando aprovação Logística' })).toBe('Finalizado')
  })
  it('preserva os status dos demais registros', () => {
    expect(statusEstadiaTexto({ status: 'Em análise' })).toBe('Em análise')
    expect(statusEstadiaTexto({})).toBe('Aberto')
  })
  it('não apresenta zero quando a planilha não fornece horas confiáveis', () => {
    expect(tempoParadoTexto({ horas: '', horasInformadas: false })).toBe('Não informado')
    expect(tempoParadoClasse({ horas: '', horasInformadas: false })).toBe('')
  })
  it.each([undefined, null, '', 'não informado'])('não inventa zero para horas ausentes ou inválidas', horas => {
    expect(tempoParadoTexto({ horas })).toBe('Não informado')
    expect(tempoParadoClasse({ horas })).toBe('')
  })
  it('apresenta as horas totais quando conhecidas', () => {
    expect(tempoParadoTexto({ horas: '27,35', horasInformadas: true })).toBe('27,35h')
    expect(tempoParadoClasse({ horas: '27,35', horasInformadas: true })).toBe('danger')
  })
  it('preserva a apresentação antiga para registros sem a marca de importação', () => {
    expect(tempoParadoTexto({ horas: '0' })).toBe('0,00h')
    expect(tempoParadoClasse({ horas: '0' })).toBe('ok')
  })
})
