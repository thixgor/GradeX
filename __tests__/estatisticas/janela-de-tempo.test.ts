import { describe, expect, it } from 'vitest'
import {
  andFilters,
  buildSeries,
  bucketKey,
  dateMatch,
  deltaPct,
  escapeRegex,
  granularityFor,
  parsePaging,
  parseRange,
  toCountMap,
} from '@/lib/admin-stats/common'

function params(query: string) {
  return new URLSearchParams(query)
}

describe('parseRange', () => {
  it('usa 30 dias como padrão e quando o valor é desconhecido', () => {
    expect(parseRange(params('')).key).toBe('30d')
    expect(parseRange(params('range=ontem')).key).toBe('30d')
  })

  it('monta a janela anterior do mesmo tamanho para o comparativo', () => {
    const range = parseRange(params('range=7d'))
    expect(range.days).toBe(7)
    expect(range.from.getTime() - range.previousFrom.getTime()).toBe(7 * 86_400_000)
  })

  it('marca "desde o início" para pular o filtro de data', () => {
    const range = parseRange(params('range=all'))
    expect(range.isAll).toBe(true)
    expect(dateMatch('createdAt', range)).toEqual({})
  })

  it('filtra pelo campo pedido quando há recorte', () => {
    const range = parseRange(params('range=30d'))
    expect(dateMatch('submittedAt', range)).toEqual({ submittedAt: { $gte: range.from } })
  })
})

describe('granularityFor', () => {
  it('quebra por hora em 24h, por dia no mês e por mês no ano', () => {
    expect(granularityFor(parseRange(params('range=24h')))).toBe('hour')
    expect(granularityFor(parseRange(params('range=30d')))).toBe('day')
    expect(granularityFor(parseRange(params('range=12m')))).toBe('month')
  })
})

describe('andFilters', () => {
  it('ignora filtros vazios em vez de gerar $and inútil', () => {
    expect(andFilters({}, {})).toEqual({})
    expect(andFilters({ a: 1 }, {})).toEqual({ a: 1 })
    expect(andFilters({ a: 1 }, { b: 2 })).toEqual({ $and: [{ a: 1 }, { b: 2 }] })
  })
})

describe('buildSeries', () => {
  it('inclui os buckets sem nenhum evento para o gráfico não pular dias', () => {
    const range = parseRange(params('range=7d'))
    const chave = bucketKey(range.to, 'day')
    const serie = buildSeries(range, 'day', { envios: new Map([[chave, 12]]) })

    expect(serie.length).toBeGreaterThanOrEqual(7)
    expect(serie.every(p => typeof p.envios === 'number')).toBe(true)
    expect(serie.find(p => p.key === chave)?.envios).toBe(12)
    expect(serie.filter(p => p.envios === 0).length).toBe(serie.length - 1)
  })
})

describe('toCountMap', () => {
  it('converte a saída do $group num Map indexado pela chave do bucket', () => {
    const mapa = toCountMap([{ _id: '2026-06-01', count: 3 }])
    expect(mapa.get('2026-06-01')).toBe(3)
  })
})

describe('deltaPct', () => {
  it('mede a variação entre períodos', () => {
    expect(deltaPct(120, 100)).toBe(20)
    expect(deltaPct(80, 100)).toBe(-20)
  })

  it('sem base de comparação, só reporta variação se houve algo agora', () => {
    expect(deltaPct(0, 0)).toBeNull()
    expect(deltaPct(5, 0)).toBe(100)
  })
})

describe('escapeRegex', () => {
  it('neutraliza a busca do usuário antes de virar regex', () => {
    const re = new RegExp(escapeRegex('P1 (2026).*'), 'i')
    expect(re.test('Prova P1 (2026).* — Renal')).toBe(true)
    expect(re.test('Prova P1 2026 qualquer coisa')).toBe(false)
  })
})

describe('parsePaging', () => {
  it('trava o limite pedido pelo client dentro de uma faixa sã', () => {
    expect(parsePaging(params('limit=100000')).limit).toBe(200)
    expect(parsePaging(params('limit=1')).limit).toBe(5)
    expect(parsePaging(params('page=-3')).page).toBe(0)
    expect(parsePaging(params('page=2&limit=10')).skip).toBe(20)
  })
})
