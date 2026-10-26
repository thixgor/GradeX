import { describe, expect, it } from 'vitest'
import {
  formatarMinutos,
  formatarRelogio,
  minutosPorDia,
  sequenciaDeFoco,
  sugestoesDeObjetivo,
} from '@/lib/foco/ritmo-de-foco'

// Meio-dia em São Paulo, para o dia não depender do fuso da máquina.
const AGORA = new Date('2026-10-26T12:00:00-03:00')
const dia = (deslocamento: number, minutos: number, objetivo = 'Cardio') => ({
  objective: objetivo,
  startedAt: new Date(AGORA.getTime() - deslocamento * 86_400_000).toISOString(),
  totalTimeMs: minutos * 60_000,
})

describe('ritmo de foco', () => {
  it('soma os minutos por dia na janela, do mais antigo a hoje', () => {
    const semana = minutosPorDia([dia(0, 25), dia(0, 10), dia(2, 50), dia(9, 90)], AGORA)
    expect(semana).toHaveLength(7)
    expect(semana[6]).toEqual({ date: '2026-10-26', minutos: 35 })
    expect(semana[4].minutos).toBe(50)
    expect(semana.reduce((s, d) => s + d.minutos, 0)).toBe(85)
  })

  it('a sequência vale terminando hoje ou ontem, e ignora sessões de menos de um minuto', () => {
    expect(sequenciaDeFoco([dia(0, 25), dia(1, 25), dia(2, 25)], AGORA)).toBe(3)
    expect(sequenciaDeFoco([dia(1, 25), dia(2, 25)], AGORA)).toBe(2)
    expect(sequenciaDeFoco([dia(2, 25)], AGORA)).toBe(0)
    expect(sequenciaDeFoco([dia(0, 0.5)], AGORA)).toBe(0)
  })

  it('sugere os últimos objetivos sem repetir e completa com os de partida', () => {
    const historico = [dia(0, 25, 'Arritmias'), dia(1, 25, 'arritmias'), dia(2, 25, 'Sessão de foco')]
    expect(sugestoesDeObjetivo(historico)).toEqual(['Arritmias', 'Revisar flashcards', 'Resolver questões'])
  })

  it('formata minutos e relógio', () => {
    expect(formatarMinutos(42)).toBe('42 min')
    expect(formatarMinutos(65)).toBe('1h 05')
    expect(formatarMinutos(120)).toBe('2h')
    expect(formatarRelogio(754_000)).toBe('12:34')
    expect(formatarRelogio(3_754_000)).toBe('1:02:34')
  })
})
