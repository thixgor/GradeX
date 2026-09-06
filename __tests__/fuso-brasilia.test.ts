import { describe, expect, it } from 'vitest'
import {
  dataEmBrasilia,
  diaEmBrasilia,
  formatarEmBrasilia,
  horaEmBrasilia,
  inicioDoDiaEmBrasilia,
  mesmoDiaEmBrasilia,
  offsetDeBrasilia,
  relogioBrasilia,
} from '@/lib/fuso-brasilia'

/*
 * A faixa perigosa é das 21h às 00h de Brasília: ali o servidor (UTC) já
 * virou o dia e o aluno não. Todo teste aqui usa instantes UTC explícitos,
 * para valer em qualquer máquina que rode a suíte.
 */
const VINTE_E_DUAS_DE_BRASILIA = new Date('2026-05-10T01:00:00Z') // 09/05 22:00 BRT
const MEIA_NOITE_UTC = new Date('2026-05-11T00:00:00Z') // 10/05 21:00 BRT

describe('diaEmBrasilia', () => {
  it('não deixa o dia virar às 21h', () => {
    // O bug que isto existe para impedir: às 21h de Brasília o servidor em UTC
    // já está no dia seguinte, e a cota diária do aluno virava com ele.
    expect(MEIA_NOITE_UTC.toISOString().slice(0, 10)).toBe('2026-05-11')
    expect(diaEmBrasilia(MEIA_NOITE_UTC)).toBe('2026-05-10')
  })

  it('vira à meia-noite de Brasília, não antes', () => {
    expect(diaEmBrasilia(new Date('2026-05-11T02:59:00Z'))).toBe('2026-05-10') // 23:59 BRT
    expect(diaEmBrasilia(new Date('2026-05-11T03:00:00Z'))).toBe('2026-05-11') // 00:00 BRT
  })
})

describe('relogioBrasilia', () => {
  it('devolve hora de parede de Brasília', () => {
    const r = relogioBrasilia(VINTE_E_DUAS_DE_BRASILIA)
    // 01:00 UTC menos três horas cai no dia ANTERIOR — que é justamente o que
    // o servidor erra sozinho.
    expect(r.dia).toBe('2026-05-09')
    expect(r.hora).toBe('22:00')
    expect(r.minutos).toBe(22 * 60)
  })

  it('meia-noite é 00:00, e não 24:00', () => {
    const r = relogioBrasilia(new Date('2026-05-11T03:00:00Z'))
    expect(r.hora).toBe('00:00')
    expect(r.minutos).toBe(0)
  })
})

describe('mesmoDiaEmBrasilia', () => {
  it('21h e 23h da mesma noite são o mesmo dia', () => {
    expect(mesmoDiaEmBrasilia(MEIA_NOITE_UTC, new Date('2026-05-11T02:00:00Z'))).toBe(true)
  })

  it('23h59 e 00h01 são dias diferentes', () => {
    expect(
      mesmoDiaEmBrasilia(new Date('2026-05-11T02:59:00Z'), new Date('2026-05-11T03:01:00Z')),
    ).toBe(false)
  })
})

describe('inicioDoDiaEmBrasilia', () => {
  it('é a meia-noite de Brasília, não a de UTC', () => {
    // `setHours(0,0,0,0)` no servidor devolveria 2026-05-11T00:00Z, que é
    // 21h do dia 10 em Brasília — três horas de eventos no balde errado.
    const inicio = inicioDoDiaEmBrasilia(VINTE_E_DUAS_DE_BRASILIA)
    expect(inicio.toISOString()).toBe('2026-05-09T03:00:00.000Z')
    expect(diaEmBrasilia(inicio)).toBe('2026-05-09')
  })

  it('às 21h ainda pertence ao dia que começou de manhã', () => {
    expect(inicioDoDiaEmBrasilia(MEIA_NOITE_UTC).toISOString()).toBe('2026-05-10T03:00:00.000Z')
  })
})

describe('offsetDeBrasilia', () => {
  it('é -03:00 (sem horário de verão desde 2019)', () => {
    expect(offsetDeBrasilia(VINTE_E_DUAS_DE_BRASILIA)).toBe('-03:00')
    expect(offsetDeBrasilia(new Date('2026-01-15T12:00:00Z'))).toBe('-03:00')
  })
})

describe('formatação', () => {
  it('escreve no fuso de Brasília, não no de quem executa', () => {
    expect(dataEmBrasilia(MEIA_NOITE_UTC)).toBe('10/05/2026')
    expect(horaEmBrasilia(MEIA_NOITE_UTC)).toBe('21:00')
    expect(formatarEmBrasilia(VINTE_E_DUAS_DE_BRASILIA, { hour: '2-digit', minute: '2-digit' }))
      .toBe('22:00')
  })

  it('não inventa data para valor vazio ou inválido', () => {
    expect(formatarEmBrasilia(null)).toBe('—')
    expect(formatarEmBrasilia(undefined)).toBe('—')
    expect(formatarEmBrasilia('não é data')).toBe('—')
  })

  it('aceita string ISO e número', () => {
    expect(dataEmBrasilia('2026-05-11T00:00:00Z')).toBe('10/05/2026')
    expect(dataEmBrasilia(MEIA_NOITE_UTC.getTime())).toBe('10/05/2026')
  })
})
