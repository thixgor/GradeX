import { describe, expect, it } from 'vitest'

import {
  anchorDrift,
  clampScale,
  distanceToRect,
  fingerDistance,
  fractionInRect,
  pinchPercentLabel,
  rubberBandScale,
  settleEase,
  wheelScaleFactor,
} from '@/lib/pdf-viewer-pinch'

/**
 * O que estes testes protegem: o ponto do material que está sob os dedos fica
 * sob os dedos (a fração da página e quanto rolar para devolvê-la), e o zoom
 * nunca salta nem passa do limite mais que o elástico.
 */

describe('rubberBandScale', () => {
  it('dentro dos limites é a própria escala', () => {
    expect(rubberBandScale(1.4, 0.5, 2.5)).toBe(1.4)
  })

  it('passa do máximo cada vez menos e nunca além da folga', () => {
    const a = rubberBandScale(3, 0.5, 2.5)
    const b = rubberBandScale(6, 0.5, 2.5)
    const c = rubberBandScale(1e6, 0.5, 2.5)
    expect(a).toBeGreaterThan(2.5)
    expect(b).toBeGreaterThan(a)
    expect(c).toBeLessThanOrEqual(2.5 * 1.18 + 1e-9)
  })

  it('passa do mínimo do mesmo jeito', () => {
    const a = rubberBandScale(0.4, 0.5, 2.5)
    const b = rubberBandScale(0.05, 0.5, 2.5)
    expect(a).toBeLessThan(0.5)
    expect(b).toBeLessThan(a)
    expect(b).toBeGreaterThanOrEqual(0.5 / 1.18 - 1e-9)
  })

  it('é contínua na borda (sem degrau ao cruzar o limite)', () => {
    expect(rubberBandScale(2.5 + 1e-6, 0.5, 2.5)).toBeCloseTo(2.5, 4)
    expect(rubberBandScale(0.5 - 1e-6, 0.5, 2.5)).toBeCloseTo(0.5, 4)
  })

  it('escala inválida não vira zoom absurdo', () => {
    expect(rubberBandScale(Number.NaN, 0.5, 2.5)).toBe(1)
    expect(rubberBandScale(0, 0.5, 2.5)).toBe(1)
  })
})

describe('clampScale', () => {
  it('prende nos limites', () => {
    expect(clampScale(3, 0.5, 2)).toBe(2)
    expect(clampScale(0.1, 0.5, 2)).toBe(0.5)
    expect(clampScale(Number.NaN, 0.5, 2)).toBe(1)
  })
})

describe('fractionInRect / anchorDrift', () => {
  const page = { left: 100, top: 200, width: 600, height: 800 }

  it('lê a fração e a devolve no layout novo', () => {
    const fraction = fractionInRect(page, { x: 400, y: 600 })
    expect(fraction).toEqual({ x: 0.5, y: 0.5 })
    // A página dobrou de tamanho e desceu: quanto rolar para o meio dela voltar
    // para (400, 600)?
    const grown = { left: -200, top: 150, width: 1200, height: 1600 }
    const drift = anchorDrift(grown, fraction, { x: 400, y: 600 })
    expect(drift).toEqual({ x: 0, y: 350 })
  })

  it('o ponto no respiro entre páginas não extrapola longe', () => {
    const fraction = fractionInRect(page, { x: 400, y: 5000 })
    expect(fraction.y).toBe(1.25)
  })
})

describe('distanceToRect', () => {
  it('é zero dentro e cresce fora', () => {
    const rect = { left: 0, top: 0, width: 100, height: 100 }
    expect(distanceToRect(rect, { x: 50, y: 50 })).toBe(0)
    expect(distanceToRect(rect, { x: 50, y: 130 })).toBe(30)
  })
})

describe('settleEase', () => {
  it('vai do começo ao fim, rápido no começo', () => {
    expect(settleEase(0)).toBe(0)
    expect(settleEase(1)).toBe(1)
    expect(settleEase(0.5)).toBeGreaterThan(0.5)
  })
})

describe('wheelScaleFactor', () => {
  it('trackpad: delta negativo amplia, positivo reduz', () => {
    expect(wheelScaleFactor(-4)).toBeGreaterThan(1)
    expect(wheelScaleFactor(4)).toBeLessThan(1)
    expect(wheelScaleFactor(0)).toBe(1)
  })

  it('um clique de roda com Ctrl anda um degrau, não triplica', () => {
    expect(wheelScaleFactor(-100)).toBe(1.25)
    expect(wheelScaleFactor(100)).toBe(0.8)
    expect(wheelScaleFactor(-3, 1)).toBe(1.25)
  })
})

describe('fingerDistance / pinchPercentLabel', () => {
  it('mede e rotula', () => {
    expect(fingerDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(pinchPercentLabel(1.2, 0.6)).toBe('200%')
    expect(pinchPercentLabel(0, 0.6)).toBe('100%')
  })
})
