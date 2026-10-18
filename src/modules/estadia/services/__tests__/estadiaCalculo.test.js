import { describe, expect, it } from 'vitest'
import {
  calcularEstadiaOperacional,
  numeroBR,
  toneladasDoPeso,
} from '../estadiaCalculo'

describe('estadiaCalculo', () => {
  it('mantém a regra oficial de 12h + R$ 0,80 por tonelada/hora', () => {
    const r = calcularEstadiaOperacional({
      peso: '38.380',
      chegadaData: '2026-01-01',
      chegadaHora: '08:00',
      saidaData: '2026-01-02',
      saidaHora: '08:00',
    })

    expect(r.totalHoras).toBe('24.00')
    expect(r.horasPagar).toBe('12.00')
    expect(r.toneladas).toBe('38.380')
    expect(r.valorNumero).toBeCloseTo(368.448, 3)
    expect(r.franquiaAplicada).toBe(12)
    expect(r.fatorAplicado).toBe(0.8)
  })

  it('não cobra antes de ultrapassar a franquia', () => {
    const r = calcularEstadiaOperacional({
      peso: '40000',
      chegadaData: '2026-01-01',
      chegadaHora: '08:00',
      saidaData: '2026-01-01',
      saidaHora: '18:00',
    })

    expect(r.horasPagar).toBe('0.00')
    expect(r.valorNumero).toBe(0)
  })

  it('preserva valor negociado manualmente', () => {
    const r = calcularEstadiaOperacional({
      alterarCalculo: true,
      tipoCalculo: 'Negociado',
      valorNegociado: '2.172,90',
      peso: '38380',
      chegadaData: '2026-01-01',
      chegadaHora: '08:00',
      saidaData: '2026-01-05',
      saidaHora: '08:00',
    })

    expect(r.valorNumero).toBe(2172.9)
    expect(r.tipoCalculoAplicado).toBe('Negociado')
  })

  it('preserva cálculo por diária manual', () => {
    const r = calcularEstadiaOperacional({
      alterarCalculo: true,
      tipoCalculo: 'Diária',
      valorDiaria: '350,00',
      qtdDias: '2',
      chegadaData: '2026-01-01',
      chegadaHora: '08:00',
      saidaData: '2026-01-03',
      saidaHora: '08:00',
    })

    expect(r.valorNumero).toBe(700)
    expect(r.horas).toBe('48.00')
  })

  it('interpreta formatos brasileiros sem ambiguidade prática', () => {
    expect(numeroBR('1.234,56')).toBe(1234.56)
    expect(numeroBR('38.380')).toBe(38380)
    expect(numeroBR('0.80')).toBe(0.8)
    expect(toneladasDoPeso('38.380')).toBeCloseTo(38.38, 5)
    expect(toneladasDoPeso('38,38')).toBeCloseTo(38.38, 5)
  })
})
