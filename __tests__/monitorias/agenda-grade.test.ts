import { describe, expect, it } from 'vitest'
import { celulasParaJanelas, chaveCelula, horasPorSemana, janelasParaCelulas, validarJanelas } from '@/lib/monitorias/agenda'

describe('grade da agenda (células de 30 min) ↔ janelas semanais', () => {
  it('ida e volta preserva as janelas, já ordenadas', () => {
    const janelas = [
      { dia: 6, inicio: '09:00', fim: '13:00' },
      { dia: 1, inicio: '18:00', fim: '22:00' },
      { dia: 1, inicio: '07:30', fim: '08:30' },
    ]
    expect(celulasParaJanelas(janelasParaCelulas(janelas))).toEqual([
      { dia: 1, inicio: '07:30', fim: '08:30' },
      { dia: 1, inicio: '18:00', fim: '22:00' },
      { dia: 6, inicio: '09:00', fim: '13:00' },
    ])
  })

  it('janelas encostadas viram uma só; o resultado sempre passa na validação do servidor', () => {
    const celulas = janelasParaCelulas([
      { dia: 2, inicio: '19:00', fim: '20:00' },
      { dia: 2, inicio: '20:00', fim: '22:00' },
    ])
    const janelas = celulasParaJanelas(celulas)
    expect(janelas).toEqual([{ dia: 2, inicio: '19:00', fim: '22:00' }])
    expect(validarJanelas(janelas)).toBeNull()
  })

  it('vai até meia-noite (24:00) sem atravessar o dia', () => {
    const celulas = new Set([chaveCelula(5, 23 * 60), chaveCelula(5, 23 * 60 + 30)])
    expect(celulasParaJanelas(celulas)).toEqual([{ dia: 5, inicio: '23:00', fim: '24:00' }])
  })

  it('conta horas por semana', () => {
    expect(horasPorSemana(janelasParaCelulas([{ dia: 1, inicio: '18:00', fim: '22:00' }, { dia: 3, inicio: '09:00', fim: '10:30' }]))).toBe(5.5)
    expect(horasPorSemana(new Set())).toBe(0)
  })
})
