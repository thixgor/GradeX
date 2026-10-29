import { describe, expect, it } from 'vitest'
import {
  TETO_DIARIO,
  calcularXp,
  diaAnterior,
  medalhasDe,
  mesDe,
  nivelDe,
  nomeDoRanking,
  semanaDe,
  xpDoPeriodo,
  xpParaNivel,
  type Registro,
} from '@/lib/xp/regras'

const AGORA = new Date('2026-10-29T15:00:00-03:00') // quinta-feira

describe('calendário do XP', () => {
  it('semana começa na segunda, mês é AAAA-MM', () => {
    expect(semanaDe('2026-10-29')).toBe('2026-10-26')
    expect(semanaDe('2026-10-26')).toBe('2026-10-26')
    expect(semanaDe('2026-11-01')).toBe('2026-10-26') // domingo fecha a semana
    expect(mesDe('2026-10-29')).toBe('2026-10')
    expect(diaAnterior('2026-03-01')).toBe('2026-02-28')
  })
})

describe('calcularXp', () => {
  it('desempenho vale mais que tentativa', () => {
    const acertou = calcularXp([{ dia: '2026-10-20', fonte: 'banco_acerto', quantidade: 10 }], AGORA)
    const errou = calcularXp([{ dia: '2026-10-20', fonte: 'banco_erro', quantidade: 10 }], AGORA)
    expect(acertou.porArea.banco).toBe(100)
    expect(errou.porArea.banco).toBe(30)
  })

  it('aplica o teto diário por área, dia a dia', () => {
    const registros: Registro[] = [
      { dia: '2026-10-20', fonte: 'manual_patologia', quantidade: 500 },
      { dia: '2026-10-21', fonte: 'manual_patologia', quantidade: 2 },
    ]
    const x = calcularXp(registros, AGORA)
    expect(x.porArea.manual).toBe((TETO_DIARIO.manual as number) + 10)
    expect(x.quantidades.manual_patologia).toBe(502)
  })

  it('dá constância: +10 por dia ativo e +50 a cada 7 seguidos', () => {
    const dias = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-09']
    const x = calcularXp(dias.map((dia) => ({ dia, fonte: 'banco_erro' as const, quantidade: 1 })), AGORA)
    expect(x.diasAtivos).toBe(8)
    expect(x.maiorSequencia).toBe(7)
    expect(x.porArea.constancia).toBe(8 * 10 + 50)
    expect(x.total).toBe(8 * 3 + 8 * 10 + 50)
  })

  it('sequência atual vale até ontem e zera depois', () => {
    const viva = calcularXp(
      ['2026-10-26', '2026-10-27', '2026-10-28'].map((dia) => ({ dia, fonte: 'banco_erro' as const, quantidade: 1 })),
      AGORA,
    )
    expect(viva.sequenciaAtual).toBe(3)
    const morta = calcularXp([{ dia: '2026-10-20', fonte: 'banco_erro', quantidade: 1 }], AGORA)
    expect(morta.sequenciaAtual).toBe(0)
  })

  it('registro sem data entra no total, não no período', () => {
    const x = calcularXp([{ dia: null, fonte: 'aula_concluida', quantidade: 4 }], AGORA)
    expect(x.total).toBe(120)
    expect(Object.keys(x.porDia)).toHaveLength(0)
    expect(xpDoPeriodo(x.porDia, AGORA).semana.xp).toBe(0)
  })

  it('ignora quantidade inválida', () => {
    const x = calcularXp([{ dia: '2026-10-20', fonte: 'banco_acerto', quantidade: -5 }, { dia: '2026-10-20', fonte: 'banco_acerto', quantidade: Number.NaN }], AGORA)
    expect(x.total).toBe(0)
  })

  it('separa semana, mês e hoje', () => {
    const x = calcularXp(
      [
        { dia: '2026-10-29', fonte: 'banco_acerto', quantidade: 1 },
        { dia: '2026-10-27', fonte: 'banco_acerto', quantidade: 1 },
        { dia: '2026-10-05', fonte: 'banco_acerto', quantidade: 1 },
        { dia: '2026-09-30', fonte: 'banco_acerto', quantidade: 1 },
      ],
      AGORA,
    )
    const p = xpDoPeriodo(x.porDia, AGORA)
    expect(p.semana).toEqual({ chave: '2026-10-26', xp: 40 })
    expect(p.mes).toEqual({ chave: '2026-10', xp: 60 })
    expect(p.hoje).toBe(20)
  })
})

describe('níveis e ligas', () => {
  it('curva cresce e o nível 1 começa no zero', () => {
    expect(xpParaNivel(1)).toBe(0)
    expect(xpParaNivel(2)).toBe(100)
    for (let n = 2; n < 99; n++) expect(xpParaNivel(n + 1)).toBeGreaterThan(xpParaNivel(n))
  })

  it('nivelDe acha o nível, o progresso e a liga', () => {
    expect(nivelDe(0)).toMatchObject({ nivel: 1, progresso: 0 })
    expect(nivelDe(100).nivel).toBe(2)
    const n = nivelDe(xpParaNivel(20) + 1)
    expect(n.nivel).toBe(20)
    expect(n.liga.id).toBe('ouro')
    expect(n.progresso).toBeGreaterThan(0)
    expect(n.progresso).toBeLessThan(1)
    expect(nivelDe(1e12)).toMatchObject({ nivel: 99, progresso: 1 })
  })
})

describe('medalhas e nome', () => {
  it('mostra a próxima medalha com progresso, ou a última conquistada', () => {
    const x = calcularXp([{ dia: '2026-10-20', fonte: 'banco_acerto', quantidade: 5 }], AGORA)
    const questoes = medalhasDe(x).find((m) => m.id.startsWith('questoes'))!
    expect(questoes.conquistada).toBe(false)
    expect(questoes.progresso).toBeCloseTo(0.5)
    const muitas = calcularXp([{ dia: '2026-10-20', fonte: 'banco_acerto', quantidade: 150 }], AGORA)
    const m = medalhasDe(muitas).find((x) => x.id.startsWith('questoes'))!
    expect(m).toMatchObject({ conquistada: true, id: 'questoes-100' })
  })

  it('o ranking mostra primeiro nome e inicial', () => {
    expect(nomeDoRanking('thiago rodrigues ferreira')).toBe('Thiago F.')
    expect(nomeDoRanking('Ana')).toBe('Ana')
    expect(nomeDoRanking('  ')).toBe('Estudante')
  })
})
