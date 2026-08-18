import { describe, it, expect } from 'vitest'
import {
  formatarPeriodoLetivo,
  interpretarPeriodoLetivo,
  lerAnoDoTitulo,
  lerPeriodoLetivo,
  ordenarPeriodosLetivos,
} from '@/lib/banco/periodo-letivo'

describe('lerPeriodoLetivo', () => {
  it('lê os títulos como a plataforma os escreve', () => {
    expect(lerPeriodoLetivo('N1 SOI I - 2026.2')).toEqual({ ano: 2026, semestre: 2 })
    expect(lerPeriodoLetivo('N1 SOI I - 2026.1')).toEqual({ ano: 2026, semestre: 1 })
    expect(lerPeriodoLetivo('N1 IESC I - 2026.1')).toEqual({ ano: 2026, semestre: 1 })
    expect(lerPeriodoLetivo('N1 SOI I - 2023.2')).toEqual({ ano: 2023, semestre: 2 })
    expect(lerPeriodoLetivo('TPI - 2023.1')).toEqual({ ano: 2023, semestre: 1 })
  })

  it('aceita barra e hífen como separador', () => {
    expect(lerPeriodoLetivo('N2 HAM II - 2024/1')).toEqual({ ano: 2024, semestre: 1 })
    expect(lerPeriodoLetivo('N2 HAM II - 2024-2')).toEqual({ ano: 2024, semestre: 2 })
  })

  it('não confunde um número qualquer com período', () => {
    expect(lerPeriodoLetivo('Prova 1.2 de revisão')).toBeNull()
    // "2023.10" é data, não semestre — o semestre só vai até 2.
    expect(lerPeriodoLetivo('Aplicada em 2023.10')).toBeNull()
    expect(lerPeriodoLetivo('N1 SOI I - 2026.3')).toBeNull()
    expect(lerPeriodoLetivo('')).toBeNull()
    expect(lerPeriodoLetivo(null)).toBeNull()
  })

  it('com mais de um candidato, vale o último — o padrão põe o período no fim', () => {
    expect(lerPeriodoLetivo('Revisão da 2023.1 para a N1 - 2023.2')).toEqual({
      ano: 2023,
      semestre: 2,
    })
  })
})

describe('lerAnoDoTitulo', () => {
  it('acha o ano solto quando não há semestre', () => {
    expect(lerAnoDoTitulo('Simulado 2024')).toBe(2024)
    expect(lerAnoDoTitulo('N1 SOI I - 2026.2')).toBe(2026)
  })

  it('ignora número que não é ano', () => {
    expect(lerAnoDoTitulo('Prova 12')).toBeNull()
    expect(lerAnoDoTitulo('Questões 123456')).toBeNull()
  })
})

describe('formatar e interpretar', () => {
  it('vai e volta', () => {
    expect(formatarPeriodoLetivo({ ano: 2026, semestre: 2 })).toBe('2026.2')
    expect(interpretarPeriodoLetivo('2026.2')).toEqual({ ano: 2026, semestre: 2 })
    expect(interpretarPeriodoLetivo('2026')).toBeNull()
    expect(interpretarPeriodoLetivo('lixo')).toBeNull()
  })
})

describe('ordenarPeriodosLetivos', () => {
  it('põe o mais recente primeiro', () => {
    expect(ordenarPeriodosLetivos(['2023.1', '2026.2', '2023.2', '2026.1'])).toEqual([
      '2026.2',
      '2026.1',
      '2023.2',
      '2023.1',
    ])
  })
})
