import { describe, expect, it } from 'vitest'
import {
  TAMANHO_DO_POOL,
  escolherPoolDaSemana,
  semanaAtual,
  sortearDoPool,
} from '@/lib/amostra-pool'

const ids = Array.from({ length: 5000 }, (_, i) => `id-${String(i).padStart(5, '0')}`)

describe('escolherPoolDaSemana', () => {
  it('mesma semana, mesmo pool — em qualquer instância e em qualquer ordem de chegada', () => {
    const a = escolherPoolDaSemana(ids, 2910)
    const b = escolherPoolDaSemana([...ids].reverse(), 2910)
    expect(a).toEqual(b)
  })

  it('tem o tamanho do pool, sem repetir questão', () => {
    const pool = escolherPoolDaSemana(ids, 2910)
    expect(pool).toHaveLength(TAMANHO_DO_POOL)
    expect(new Set(pool).size).toBe(TAMANHO_DO_POOL)
    for (const id of pool) expect(ids).toContain(id)
  })

  it('a semana seguinte troca o pool', () => {
    const esta = new Set(escolherPoolDaSemana(ids, 2910))
    const proxima = escolherPoolDaSemana(ids, 2911)
    const repetidas = proxima.filter((id) => esta.has(id)).length
    expect(repetidas).toBeLessThan(TAMANHO_DO_POOL / 2)
  })

  it('banco menor que o pool devolve o banco inteiro', () => {
    expect(escolherPoolDaSemana(['b', 'a', 'a'], 1).sort()).toEqual(['a', 'b'])
    expect(escolherPoolDaSemana([], 1)).toEqual([])
  })
})

describe('sortearDoPool', () => {
  it('raspar a amostra mil vezes nunca sai do pool', () => {
    const pool = escolherPoolDaSemana(ids, 2910)
    const vistas = new Set<string>()
    for (let i = 0; i < 1000; i++) for (const id of sortearDoPool(pool, 10)) vistas.add(id)
    expect(vistas.size).toBeLessThanOrEqual(TAMANHO_DO_POOL)
    for (const id of vistas) expect(pool).toContain(id)
  })

  it('devolve 10 distintas', () => {
    const sorteio = sortearDoPool(escolherPoolDaSemana(ids, 3), 10)
    expect(new Set(sorteio).size).toBe(10)
  })
})

describe('semanaAtual', () => {
  it('muda uma vez a cada sete dias', () => {
    const t = Date.UTC(2026, 9, 8, 12)
    expect(semanaAtual(t)).toBe(semanaAtual(t + 24 * 3600 * 1000))
    expect(semanaAtual(t + 7 * 24 * 3600 * 1000)).toBe(semanaAtual(t) + 1)
  })
})
