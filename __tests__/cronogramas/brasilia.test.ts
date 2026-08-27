import { describe, it, expect } from 'vitest'

import {
  diaDaSemana,
  diasAte,
  diasEntre,
  faixaProximidade,
  formatarDiaCurto,
  formatarDiaLongo,
  hojeBrasilia,
  isDiaValido,
  isHoraValida,
  relogioBrasilia,
  somarDias,
  textoProximidade,
} from '@/lib/cronogramas/brasilia'

describe('calendário de Brasília', () => {
  it('converte um instante UTC para o dia certo em Brasília', () => {
    // 02:00 UTC de 12/03 ainda é 23:00 de 11/03 em Brasília (UTC-3).
    expect(hojeBrasilia(new Date('2026-03-12T02:00:00Z'))).toBe('2026-03-11')
    expect(hojeBrasilia(new Date('2026-03-12T04:00:00Z'))).toBe('2026-03-12')
  })

  it('lê o relógio de Brasília, e não o do processo', () => {
    const relogio = relogioBrasilia(new Date('2026-03-12T22:30:00Z'))
    expect(relogio.dia).toBe('2026-03-12')
    expect(relogio.hora).toBe('19:30')
    expect(relogio.minutos).toBe(19 * 60 + 30)
  })

  it('a meia-noite de Brasília sai como 00:00, nunca 24:00', () => {
    const relogio = relogioBrasilia(new Date('2026-03-12T03:00:00Z'))
    expect(relogio.hora).toBe('00:00')
    expect(relogio.minutos).toBe(0)
  })

  it('valida datas e horários', () => {
    expect(isDiaValido('2026-02-28')).toBe(true)
    expect(isDiaValido('2026-02-30')).toBe(false)
    expect(isDiaValido('2026-13-01')).toBe(false)
    expect(isDiaValido('12/03/2026')).toBe(false)

    expect(isHoraValida('19:00')).toBe(true)
    expect(isHoraValida('24:00')).toBe(false)
    expect(isHoraValida('7:00')).toBe(false)
  })

  it('conta dias de calendário sem tropeçar em virada de mês ou ano', () => {
    expect(diasEntre('2026-03-01', '2026-03-12')).toBe(11)
    expect(diasEntre('2026-02-27', '2026-03-01')).toBe(2)
    expect(diasEntre('2026-12-30', '2027-01-02')).toBe(3)
    expect(diasEntre('2026-03-12', '2026-03-01')).toBe(-11)
  })

  it('soma dias mantendo o formato ISO', () => {
    expect(somarDias('2026-02-27', 2)).toBe('2026-03-01')
    expect(somarDias('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('sabe o dia da semana', () => {
    expect(diaDaSemana('2026-03-02')).toBe(1) // segunda
    expect(diaDaSemana('2026-03-08')).toBe(0) // domingo
  })

  it('conta quanto falta a partir de hoje em Brasília', () => {
    const instante = new Date('2026-03-12T15:00:00Z') // 12:00 em Brasília
    expect(diasAte('2026-03-12', instante)).toBe(0)
    expect(diasAte('2026-03-15', instante)).toBe(3)
    expect(diasAte('2026-03-10', instante)).toBe(-2)
  })

  it('descreve a proximidade em português', () => {
    expect(textoProximidade(0)).toBe('é hoje')
    expect(textoProximidade(1)).toBe('é amanhã')
    expect(textoProximidade(9)).toBe('faltam 9 dias')
    expect(textoProximidade(-1)).toBe('foi ontem')
    expect(textoProximidade(-4)).toBe('foi há 4 dias')
  })

  it('classifica a urgência em faixas estáveis', () => {
    expect(faixaProximidade(-1)).toBe('passada')
    expect(faixaProximidade(0)).toBe('hoje')
    expect(faixaProximidade(3)).toBe('critica')
    expect(faixaProximidade(4)).toBe('proxima')
    expect(faixaProximidade(14)).toBe('proxima')
    expect(faixaProximidade(15)).toBe('distante')
  })

  it('formata datas para leitura humana', () => {
    expect(formatarDiaCurto('2026-03-12')).toBe('12 de março')
    expect(formatarDiaLongo('2026-03-12')).toBe('quinta, 12 de março de 2026')
  })
})
