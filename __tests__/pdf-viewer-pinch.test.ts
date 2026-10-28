import { describe, expect, it } from 'vitest'

import {
  anchorDrift,
  clampScale,
  distanceToRect,
  fingerDistance,
  followFocal,
  fractionInRect,
  glideOffset,
  IDENTITY_PINCH,
  lerpRect,
  mapPoint,
  mapRect,
  pinchPercentLabel,
  pushSample,
  releaseVelocity,
  rubberBandScale,
  settleEase,
  transformBetween,
  unmapPoint,
  wheelScaleFactor,
} from '@/lib/pdf-viewer-pinch'

/**
 * O que estes testes protegem: o ponto do material que está sob os dedos fica
 * sob os dedos — durante a pinça, quando ela vira arrasto de um dedo só, e
 * depois que o zoom de verdade entra e o layout se refaz.
 */

const ORIGIN = { x: 40, y: 120 }

describe('mapPoint / unmapPoint', () => {
  it('são inversos um do outro', () => {
    const transform = { scale: 1.8, tx: -35, ty: 60 }
    const point = { x: 300, y: 500 }
    const back = unmapPoint(transform, ORIGIN, mapPoint(transform, ORIGIN, point))
    expect(back.x).toBeCloseTo(point.x)
    expect(back.y).toBeCloseTo(point.y)
  })

  it('a identidade não move nada', () => {
    expect(mapPoint(IDENTITY_PINCH, ORIGIN, { x: 10, y: 20 })).toEqual({ x: 10, y: 20 })
  })
})

describe('followFocal', () => {
  it('mantém o ponto sob o meio dos dedos ao ampliar', () => {
    const mid = { x: 400, y: 600 }
    const next = followFocal({ transform: IDENTITY_PINCH, origin: ORIGIN, from: mid, to: mid, scale: 2 })
    const seen = mapPoint(next, ORIGIN, mid)
    expect(seen.x).toBeCloseTo(mid.x)
    expect(seen.y).toBeCloseTo(mid.y)
    expect(next.scale).toBe(2)
  })

  it('acompanha os dedos que andam junto com a pinça', () => {
    const from = { x: 400, y: 600 }
    const to = { x: 460, y: 540 }
    const next = followFocal({ transform: IDENTITY_PINCH, origin: ORIGIN, from, to, scale: 1.5 })
    const seen = mapPoint(next, ORIGIN, from)
    expect(seen.x).toBeCloseTo(to.x)
    expect(seen.y).toBeCloseTo(to.y)
  })

  it('encadeia trechos: re-basear no meio do gesto não dá salto', () => {
    // Trecho 1: dois dedos ampliam 2x em torno de (400, 600).
    const first = followFocal({ transform: IDENTITY_PINCH, origin: ORIGIN, from: { x: 400, y: 600 }, to: { x: 400, y: 600 }, scale: 2 })
    // Trecho 2: um dedo saiu, o outro arrasta 50 px para a esquerda.
    const held = { x: 380, y: 610 }
    const second = followFocal({ transform: first, origin: ORIGIN, from: held, to: { x: 330, y: 610 }, scale: first.scale })
    const content = unmapPoint(first, ORIGIN, held)
    const seen = mapPoint(second, ORIGIN, content)
    expect(seen.x).toBeCloseTo(330)
    expect(seen.y).toBeCloseTo(610)
    expect(second.scale).toBe(2)
  })
})

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

describe('transformBetween', () => {
  it('leva o retângulo do layout exatamente para onde ele aparecia', () => {
    const layout = { left: 100, top: 300, width: 800, height: 1100 }
    const visual = { left: 60, top: 250, width: 820, height: 1127.5 }
    const transform = transformBetween(layout, visual, ORIGIN)
    const seen = mapRect(transform, ORIGIN, layout)
    expect(seen.left).toBeCloseTo(visual.left)
    expect(seen.top).toBeCloseTo(visual.top)
    expect(seen.width).toBeCloseTo(visual.width)
  })

  it('retângulo sem largura não vira transform', () => {
    expect(transformBetween({ left: 0, top: 0, width: 0, height: 0 }, { left: 5, top: 5, width: 10, height: 10 }, ORIGIN)).toEqual(IDENTITY_PINCH)
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

describe('lerpRect / settleEase', () => {
  it('vai do começo ao fim', () => {
    const a = { left: 0, top: 0, width: 100, height: 100 }
    const b = { left: 100, top: 50, width: 200, height: 300 }
    expect(lerpRect(a, b, 0)).toEqual(a)
    expect(lerpRect(a, b, 1)).toEqual(b)
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

describe('inércia: releaseVelocity / glideOffset / pushSample', () => {
  it('mede só o lance final', () => {
    const samples: Array<{ x: number; y: number; t: number }> = []
    // Começa devagar, termina rápido: 2px/ms nos últimos 100ms.
    for (let t = 0; t <= 300; t += 16) pushSample(samples, { x: 0, y: t <= 200 ? t * 0.1 : 20 + (t - 200) * 2, t })
    const v = releaseVelocity(samples, 300)
    expect(v.y).toBeGreaterThan(1.5)
    expect(samples[samples.length - 1].t - samples[0].t).toBeLessThanOrEqual(100)
  })

  it('dedos que pararam antes de sair não deslizam', () => {
    const samples = [{ x: 0, y: 0, t: 0 }, { x: 0, y: 100, t: 50 }]
    expect(releaseVelocity(samples, 50 + 61)).toEqual({ x: 0, y: 0 })
  })

  it('ajuste fino não desliza; lance desliza na mesma direção, com teto', () => {
    expect(glideOffset({ x: 0.1, y: 0.1 })).toEqual({ x: 0, y: 0 })
    const g = glideOffset({ x: 0, y: -2 })
    expect(g.x).toBeCloseTo(0)
    expect(g.y).toBeCloseTo(-280)
    const far = glideOffset({ x: 30, y: 40 })
    expect(Math.hypot(far.x, far.y)).toBeCloseTo(600)
  })

  it('amostra única ou intervalo curto demais não vira velocidade', () => {
    expect(releaseVelocity([{ x: 0, y: 0, t: 0 }], 10)).toEqual({ x: 0, y: 0 })
    expect(releaseVelocity([{ x: 0, y: 0, t: 0 }, { x: 0, y: 50, t: 5 }], 5)).toEqual({ x: 0, y: 0 })
  })
})
