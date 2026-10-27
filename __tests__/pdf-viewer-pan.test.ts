import { describe, expect, it } from 'vitest'

import { DEFAULT_PAN_RATIO, panScrollFor, readPanRatio, touchMidpoint } from '@/lib/pdf-viewer-pan'

/**
 * A página ampliada rola de lado dentro da sua linha. O que estes testes
 * protegem: o zoom e a página seguinte reabrem no MESMO ponto da página que
 * estava no meio da tela, e a borda esquerda é sempre alcançável.
 */

const VIEW = 900

describe('readPanRatio', () => {
  it('não lembra nada quando a página cabe inteira', () => {
    expect(readPanRatio({ scrollLeft: 0, clientWidth: VIEW, scrollWidth: VIEW })).toBeNull()
    expect(readPanRatio({ scrollLeft: 0, clientWidth: VIEW, scrollWidth: VIEW + 1 })).toBeNull()
    expect(readPanRatio({ scrollLeft: 0, clientWidth: 0, scrollWidth: 2000 })).toBeNull()
  })

  it('mede o ponto da página que está no meio da tela', () => {
    expect(readPanRatio({ scrollLeft: 0, clientWidth: VIEW, scrollWidth: 1800 })).toBeCloseTo(0.25)
    expect(readPanRatio({ scrollLeft: 450, clientWidth: VIEW, scrollWidth: 1800 })).toBeCloseTo(0.5)
    expect(readPanRatio({ scrollLeft: 900, clientWidth: VIEW, scrollWidth: 1800 })).toBeCloseTo(0.75)
  })
})

describe('panScrollFor', () => {
  it('página que cabe inteira fica em 0', () => {
    expect(panScrollFor(0.8, { clientWidth: VIEW, scrollWidth: VIEW })).toBe(0)
  })

  it('o padrão abre a página ampliada pelo centro', () => {
    expect(panScrollFor(DEFAULT_PAN_RATIO, { clientWidth: VIEW, scrollWidth: 1800 })).toBe(450)
  })

  it('nunca passa das bordas — a esquerda é sempre alcançável', () => {
    expect(panScrollFor(0, { clientWidth: VIEW, scrollWidth: 1800 })).toBe(0)
    expect(panScrollFor(1, { clientWidth: VIEW, scrollWidth: 1800 })).toBe(900)
    expect(panScrollFor(Number.NaN, { clientWidth: VIEW, scrollWidth: 1800 })).toBe(0)
  })

  it('o zoom cresce a partir do ponto que está sendo lido', () => {
    // Leitor arrastou até a coluna da esquerda a 200%...
    const before = { scrollLeft: 120, clientWidth: VIEW, scrollWidth: 1800 }
    const ratio = readPanRatio(before)!
    const pointBefore = before.scrollLeft + VIEW / 2
    // ...e apertou "+": tudo fica 25% maior (250%).
    const scrollWidth = 2250
    const after = panScrollFor(ratio, { clientWidth: VIEW, scrollWidth })
    // O mesmo ponto da página continua no meio da tela.
    expect((after + VIEW / 2) / scrollWidth).toBeCloseTo(pointBefore / 1800, 3)
  })

  it('ida e volta entre linhas do mesmo tamanho é exata', () => {
    for (const scrollLeft of [0, 37, 450, 900]) {
      const metrics = { scrollLeft, clientWidth: VIEW, scrollWidth: 1800 }
      expect(panScrollFor(readPanRatio(metrics)!, metrics)).toBe(scrollLeft)
    }
  })
})

describe('touchMidpoint', () => {
  it('é o meio dos dedos', () => {
    expect(touchMidpoint([{ x: 0, y: 0 }, { x: 100, y: 40 }])).toEqual({ x: 50, y: 20 })
  })

  it('sem dedos válidos não há ponto', () => {
    expect(touchMidpoint([])).toBeNull()
    expect(touchMidpoint([{ x: Number.NaN, y: 0 }])).toBeNull()
  })
})
