import { describe, expect, it } from 'vitest'
import {
  ACERVO_SEM_NUMERO,
  DEGRAU_DO_ACERVO,
  acervoArredondado,
  rotuloDoAcervo,
} from '@/lib/banco/acervo-publico'

/**
 * O número do acervo nas telas de venda.
 *
 * O que estes testes seguram é uma promessa comercial, não um formato: a frase
 * "+15 mil questões" precisa ser sempre um PISO. Se o arredondamento passasse a
 * subir (`Math.round`), o modal anunciaria um acervo maior do que o que existe
 * — e a pessoa que assina por causa da frase encontra menos do que comprou.
 */
describe('acervo público', () => {
  it('arredonda para BAIXO, nunca para cima', () => {
    expect(acervoArredondado(15_238)).toBe(15_000)
    expect(acervoArredondado(15_999)).toBe(15_000)
    expect(acervoArredondado(16_000)).toBe(16_000)
  })

  it('devolve 0 quando não há número que valha a pena dizer', () => {
    expect(acervoArredondado(999)).toBe(0)
    expect(acervoArredondado(0)).toBe(0)
    expect(acervoArredondado(-5)).toBe(0)
    expect(acervoArredondado(null)).toBe(0)
    expect(acervoArredondado(undefined)).toBe(0)
    expect(acervoArredondado(Number.NaN)).toBe(0)
    expect(acervoArredondado(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('escreve a frase em milhares', () => {
    expect(rotuloDoAcervo(15_000)).toBe('+15 mil questões')
    expect(rotuloDoAcervo(15_238)).toBe('+15 mil questões')
    expect(rotuloDoAcervo(DEGRAU_DO_ACERVO)).toBe('+1 mil questões')
  })

  it('não inventa número quando não tem um — quem chama diz a frase genérica', () => {
    expect(rotuloDoAcervo(0)).toBeNull()
    expect(rotuloDoAcervo(null)).toBeNull()
    expect(rotuloDoAcervo(undefined)).toBeNull()
    // O texto de reserva não promete contagem nenhuma.
    expect(ACERVO_SEM_NUMERO).not.toMatch(/\d/)
  })
})
