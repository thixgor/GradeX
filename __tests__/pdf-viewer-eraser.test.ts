import { describe, expect, it } from 'vitest'

import {
  ERASER_RADIUS,
  type ErasableAnnotation,
  annotationHit,
  compactStroke,
  densify,
  isSplittable,
  pointSegmentDistance,
  rectHit,
  splitStroke,
  strokeTolerance,
} from '@/lib/pdf-viewer-eraser'

/**
 * A borracha do leitor de PDF. O que estes testes protegem é a promessa de
 * borracha de verdade: ela apaga PASSANDO por cima, o que ela cobre é o que
 * some, e o feitio "preciso" corta só o pedaço tocado — sem levar o traço
 * inteiro junto.
 */

// Página em paisagem de propósito: com largura e altura diferentes, qualquer
// conta feita em coordenadas normalizadas (e não em pixels) vira elipse e
// falha aqui. É a armadilha principal desta geometria.
const geometry = { width: 1000, height: 500 }

function stroke(points: Array<[number, number]>, extra: Partial<ErasableAnnotation> = {}): ErasableAnnotation {
  return {
    type: 'drawing',
    position: { points: points.map(([x, y]) => ({ x, y })) },
    data: { drawingMode: 'free', strokeWidthRatio: 0.002 },
    ...extra,
  }
}

describe('pointSegmentDistance', () => {
  it('mede até o trecho que existe, não até a reta infinita', () => {
    const a = { x: 0, y: 0 }
    const b = { x: 10, y: 0 }
    expect(pointSegmentDistance({ x: 5, y: 3 }, a, b)).toBeCloseTo(3)
    // Além da ponta B: a distância é até B, e não a projeção na reta.
    expect(pointSegmentDistance({ x: 30, y: 0 }, a, b)).toBeCloseTo(20)
  })
})

describe('annotationHit', () => {
  const horizontal = stroke([[0.2, 0.5], [0.8, 0.5]])

  it('pega o traço quando a borracha encosta nele', () => {
    expect(annotationHit(horizontal, { x: 0.5, y: 0.5 }, ERASER_RADIUS.medium, geometry)).toBe(true)
  })

  it('não pega o traço que passou longe', () => {
    expect(annotationHit(horizontal, { x: 0.5, y: 0.9 }, ERASER_RADIUS.medium, geometry)).toBe(false)
  })

  it('mede o alcance em pixels, e não em fração da página', () => {
    // Mesmo deslocamento normalizado nos dois eixos; numa página 2:1 ele vale
    // 20 px na horizontal e 10 px na vertical. Uma borracha de 16 px tem que
    // pegar só o segundo caso.
    const vertical = stroke([[0.5, 0.2], [0.5, 0.8]])
    expect(annotationHit(vertical, { x: 0.52, y: 0.5 }, ERASER_RADIUS.medium, geometry)).toBe(false)
    expect(annotationHit(horizontal, { x: 0.5, y: 0.52 }, ERASER_RADIUS.medium, geometry)).toBe(true)
  })

  it('dá alcance extra ao ícone ancorado num ponto (nota, marcador)', () => {
    const note: ErasableAnnotation = { type: 'note', position: { x: 0.5, y: 0.5 } }
    expect(annotationHit(note, { x: 0.52, y: 0.5 }, ERASER_RADIUS.fine, geometry)).toBe(true)
    expect(annotationHit(note, { x: 0.7, y: 0.5 }, ERASER_RADIUS.fine, geometry)).toBe(false)
  })

  it('pega retângulo (grifo antigo, caixa de texto) pela borda mais próxima', () => {
    const box: ErasableAnnotation = { type: 'highlight', position: { x: 0.4, y: 0.4, width: 0.2, height: 0.1 } }
    expect(annotationHit(box, { x: 0.5, y: 0.45 }, ERASER_RADIUS.fine, geometry)).toBe(true)
    // 5 px à esquerda da borda: ainda dentro do alcance da borracha fina (7 px).
    expect(annotationHit(box, { x: 0.395, y: 0.45 }, ERASER_RADIUS.fine, geometry)).toBe(true)
    expect(annotationHit(box, { x: 0.2, y: 0.45 }, ERASER_RADIUS.fine, geometry)).toBe(false)
  })

  it('conta a espessura do traço no alcance', () => {
    const grosso = stroke([[0.2, 0.5], [0.8, 0.5]], { data: { drawingMode: 'free', strokeWidthRatio: 0.05 } })
    expect(strokeTolerance(grosso, geometry)).toBeCloseTo(25)
    // 0,55 de altura = 25 px abaixo da linha: fora do alcance do traço fino,
    // dentro do traço grosso (que ocupa esses 25 px de tinta).
    expect(annotationHit(stroke([[0.2, 0.5], [0.8, 0.5]]), { x: 0.5, y: 0.6 }, ERASER_RADIUS.fine, geometry)).toBe(false)
    expect(annotationHit(grosso, { x: 0.5, y: 0.55 }, ERASER_RADIUS.fine, geometry)).toBe(true)
  })
})

describe('rectHit', () => {
  it('é a peneira barata: caixa envolvente contra o círculo da borracha', () => {
    const bounds = { x: 0.2, y: 0.4, width: 0.3, height: 0.2 }
    expect(rectHit(bounds, { x: 0.3, y: 0.5 }, 4, geometry)).toBe(true)
    expect(rectHit(bounds, { x: 0.9, y: 0.5 }, 4, geometry)).toBe(false)
  })
})

describe('isSplittable', () => {
  it('parte traço livre, pincel e grifo desenhado', () => {
    expect(isSplittable(stroke([[0.1, 0.5], [0.9, 0.5]]))).toBe(true)
    expect(isSplittable(stroke([[0.1, 0.5], [0.9, 0.5]], { data: { drawingMode: 'marker' } }))).toBe(true)
    expect(isSplittable({ type: 'highlight', position: { points: [{ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }] } })).toBe(true)
  })

  it('não parte FORMA: reta, tracejado e círculo saem inteiros', () => {
    for (const drawingMode of ['line', 'dash', 'circle']) {
      expect(isSplittable(stroke([[0.1, 0.5], [0.9, 0.5]], { data: { drawingMode } }))).toBe(false)
    }
  })

  it('não parte o que não é traço', () => {
    expect(isSplittable({ type: 'note', position: { x: 0.5, y: 0.5 } })).toBe(false)
  })
})

describe('densify', () => {
  it('preenche os saltos de um traço desenhado rápido', () => {
    const points = [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }]
    const dense = densify(points, 50, geometry)
    // 1000 px de traço em passos de 50 px: pontas inclusas.
    expect(dense.length).toBe(21)
    expect(dense[0]).toEqual(points[0])
    expect(dense[dense.length - 1]).toEqual(points[1])
  })

  it('deixa em paz o traço que já é denso', () => {
    const points = [{ x: 0.5, y: 0.5 }, { x: 0.51, y: 0.5 }]
    expect(densify(points, 50, geometry)).toHaveLength(2)
  })
})

describe('splitStroke', () => {
  const linha = [{ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }]

  it('devolve o traço inteiro quando a borracha não passou por lá', () => {
    const segments = splitStroke(linha, [{ x: 0.5, y: 0.1 }], ERASER_RADIUS.medium, geometry)
    expect(segments).toHaveLength(1)
  })

  it('parte o traço em dois ao passar no meio', () => {
    const segments = splitStroke(linha, [{ x: 0.5, y: 0.5 }], ERASER_RADIUS.medium, geometry)
    expect(segments).toHaveLength(2)
    // O primeiro pedaço termina antes do buraco, o segundo começa depois.
    expect(segments[0][segments[0].length - 1].x).toBeLessThan(0.5)
    expect(segments[1][0].x).toBeGreaterThan(0.5)
  })

  it('apaga o traço inteiro quando o rastro cobre tudo', () => {
    const rastro = Array.from({ length: 17 }, (_, index) => ({ x: 0.1 + index * 0.05, y: 0.5 }))
    expect(splitStroke(linha, rastro, ERASER_RADIUS.wide, geometry)).toHaveLength(0)
  })

  it('não deixa cacos invisíveis na ponta', () => {
    // Borracha grossa logo depois do começo: o toco de 2 px que sobraria à
    // esquerda não pode virar anotação salva.
    const segments = splitStroke(linha, [{ x: 0.105, y: 0.5 }], ERASER_RADIUS.wide, geometry)
    expect(segments).toHaveLength(1)
    expect(segments[0][0].x).toBeGreaterThan(0.1)
  })

  it('sem rastro nenhum, nada muda', () => {
    expect(splitStroke(linha, [], ERASER_RADIUS.medium, geometry)).toEqual([linha])
  })
})

describe('compactStroke', () => {
  it('enxuga o adensamento mantendo as duas pontas', () => {
    const dense = densify([{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }], 4, geometry)
    const compact = compactStroke(dense, 20, geometry)
    expect(compact.length).toBeLessThan(dense.length)
    expect(compact[0]).toEqual(dense[0])
    expect(compact[compact.length - 1]).toEqual(dense[dense.length - 1])
  })
})
