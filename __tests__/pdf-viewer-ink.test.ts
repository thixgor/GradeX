import { describe, expect, it } from 'vitest'

import {
  INK_MIN_STEP_PX,
  MARKER_MIN_STEP_PX,
  type InkPathSink,
  type InkPoint,
  inkPixelWidth,
  inkPointMoved,
  normalizeInkStroke,
  traceStroke,
} from '@/lib/pdf-viewer-ink'

/**
 * O que estes testes protegem é a promessa que sustenta o desenho sem atraso:
 * pintar o traço em pedaços, conforme a caneta anda, tem que dar exatamente o
 * mesmo desenho de pintá-lo inteiro. Se isso deixar de valer, aparece uma
 * costura no meio da escrita — e um traço que muda de forma depois de pronto é
 * pior do que um traço que demora a aparecer.
 */

type Command =
  | ['move', number, number]
  | ['line', number, number]
  | ['quad', number, number, number, number]

function recorder() {
  const commands: Command[] = []
  const sink: InkPathSink = {
    moveTo: (x, y) => { commands.push(['move', x, y]) },
    lineTo: (x, y) => { commands.push(['line', x, y]) },
    quadraticCurveTo: (cx, cy, x, y) => { commands.push(['quad', cx, cy, x, y]) },
  }
  return { commands, sink }
}

// Página em paisagem: com largura e altura diferentes, qualquer troca de eixo
// na conta aparece.
const width = 800
const height = 500

function scribble(count: number): InkPoint[] {
  // Um rabisco de verdade — nada de reta, para as curvas realmente existirem.
  return Array.from({ length: count }, (_, index) => ({
    x: 0.1 + (index / count) * 0.8,
    y: 0.5 + Math.sin(index / 3) * 0.2,
  }))
}

describe('traceStroke', () => {
  it('desenha um ponto solto como um começo de caminho', () => {
    const { commands, sink } = recorder()
    expect(traceStroke(sink, [{ x: 0.5, y: 0.5 }], width, height)).toBe(1)
    expect(commands).toEqual([['move', 400, 250]])
  })

  it('liga dois pontos por uma reta', () => {
    const { commands, sink } = recorder()
    traceStroke(sink, [{ x: 0, y: 0 }, { x: 1, y: 1 }], width, height)
    expect(commands).toEqual([['move', 0, 0], ['line', 800, 500]])
  })

  it('ancora as curvas nos pontos médios', () => {
    const points = [{ x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 0 }]
    const { commands, sink } = recorder()
    traceStroke(sink, points, width, height)
    expect(commands).toEqual([
      ['move', 0, 0],
      // Controle no ponto capturado, fim no meio do caminho até o próximo.
      ['quad', 400, 500, 600, 250],
      ['line', 800, 0],
    ])
  })

  it('pintar em pedaços dá o MESMO desenho de pintar de uma vez', () => {
    const points = scribble(40)

    const full = recorder()
    traceStroke(full.sink, points, width, height)

    // Simula a caneta andando: o traço cresce de poucos em poucos pontos e
    // cada passada pinta só o que nasceu desde a anterior.
    const incremental = recorder()
    let painted = 1
    for (let size = 2; size <= points.length; size += 3) {
      painted = traceStroke(incremental.sink, points.slice(0, size), width, height, painted, { tail: false })
    }
    // Fechamento, quando a caneta levanta.
    traceStroke(incremental.sink, points, width, height, painted)

    // Toda curva do traço inteiro aparece uma vez só na versão em pedaços, e na
    // mesma ordem.
    const curvesFull = full.commands.filter((command) => command[0] === 'quad')
    const curvesIncremental = incremental.commands.filter((command) => command[0] === 'quad')
    expect(curvesIncremental).toEqual(curvesFull)

    // E o traço termina exatamente no mesmo lugar.
    expect(incremental.commands[incremental.commands.length - 1])
      .toEqual(full.commands[full.commands.length - 1])
  })

  it('sem cauda, cada trecho é desenhado UMA vez — nada de tinta repetida', () => {
    const points = scribble(30)
    const incremental = recorder()
    let painted = 1
    for (let size = 2; size <= points.length; size++) {
      painted = traceStroke(incremental.sink, points.slice(0, size), width, height, painted, { tail: false })
    }

    // Nenhuma reta provisória foi pintada: é ela que, em curva fechada, escapa
    // da curva final e deixa tinta que o traço salvo não tem.
    expect(incremental.commands.some((command) => command[0] === 'line')).toBe(false)

    // E nenhuma curva foi desenhada duas vezes.
    const curves = incremental.commands.filter((command) => command[0] === 'quad')
    expect(new Set(curves.map((command) => command.join(','))).size).toBe(curves.length)
  })

  it('a tinta fica no máximo um ponto atrás da ponta da caneta', () => {
    const points = scribble(20)
    const partial = recorder()
    traceStroke(partial.sink, points, width, height, 1, { tail: false })
    const curves = partial.commands.filter((command) => command[0] === 'quad')
    // A última curva termina no meio do caminho entre os dois últimos pontos:
    // meio passo de amostragem atrás do ponteiro, menos de um pixel na prática.
    const lastCurve = curves[curves.length - 1]
    const before = points[points.length - 2]
    const last = points[points.length - 1]
    expect(lastCurve).toEqual([
      'quad',
      before.x * width,
      before.y * height,
      ((before.x + last.x) / 2) * width,
      ((before.y + last.y) / 2) * height,
    ])
  })

  it('cada pedaço começa onde o anterior parou', () => {
    const points = scribble(12)
    const first = recorder()
    const painted = traceStroke(first.sink, points.slice(0, 6), width, height, 1)

    const second = recorder()
    traceStroke(second.sink, points, width, height, painted)

    // O ponto de partida do segundo pedaço é o meio do último segmento que o
    // primeiro deixou pela metade — é essa continuidade que evita a costura.
    const previous = points[painted - 1]
    const current = points[painted]
    expect(second.commands[0]).toEqual([
      'move',
      ((previous.x + current.x) / 2) * width,
      ((previous.y + current.y) / 2) * height,
    ])
  })

  it('não estoura quando pedem um pedaço além do fim do traço', () => {
    const points = scribble(5)
    const { commands, sink } = recorder()
    expect(() => traceStroke(sink, points, width, height, 99)).not.toThrow()
    expect(commands.length).toBeGreaterThan(0)
  })
})

describe('inkPixelWidth', () => {
  it('usa a média geométrica dos eixos, como o SVG do traço salvo', () => {
    expect(inkPixelWidth(0.01, 800, 500)).toBeCloseTo(0.01 * Math.sqrt(400000))
  })

  it('nunca some da tela', () => {
    expect(inkPixelWidth(0, 800, 500)).toBe(1)
    expect(inkPixelWidth(0.0000001, 800, 500)).toBe(1)
  })
})

/**
 * O pingo do "i". Um toque rápido de caneta produz um ponto só, e a versão
 * anterior descartava tudo que tivesse menos de três — o ponto aparecia
 * embaixo da ponta e sumia ao levantar a caneta.
 */
describe('normalizeInkStroke', () => {
  it('transforma um toque num traço de comprimento zero', () => {
    const dot = { x: 0.4, y: 0.62 }
    expect(normalizeInkStroke([dot])).toEqual([dot, dot])
  })

  it('não mexe num traço de verdade', () => {
    const points = scribble(9)
    expect(normalizeInkStroke(points)).toBe(points)
  })

  it('guarda o traço curtinho de dois pontos em vez de jogá-lo fora', () => {
    const points = [{ x: 0.2, y: 0.2 }, { x: 0.205, y: 0.204 }]
    expect(normalizeInkStroke(points)).toBe(points)
  })

  it('não tem o que salvar quando não houve toque nenhum', () => {
    expect(normalizeInkStroke([])).toBeNull()
  })
})

/**
 * A peneira de pontos. O que estes testes protegem é a unidade: o passo mínimo
 * é medido em PIXELS DE TELA, e não em fração da página. Enquanto era fração, a
 * peneira engrossava junto com o zoom — ampliado, escrevendo devagar, a tinta
 * andava em degraus de vários pixels.
 */
describe('inkPointMoved', () => {
  // Uma A4 em pé: largura e altura bem diferentes, para qualquer troca de eixo
  // na conta aparecer.
  const pageWidth = 600
  const pageHeight = 850

  it('deixa passar o que a tela consegue separar', () => {
    const from = { x: 0.5, y: 0.5 }
    // Um pixel para a direita.
    const to = { x: 0.5 + 1 / pageWidth, y: 0.5 }
    expect(inkPointMoved(from, to, pageWidth, pageHeight, INK_MIN_STEP_PX)).toBe(true)
  })

  it('barra o tremor de quem está quase parado', () => {
    const from = { x: 0.5, y: 0.5 }
    const to = { x: 0.5 + 0.2 / pageWidth, y: 0.5 + 0.2 / pageHeight }
    expect(inkPointMoved(from, to, pageWidth, pageHeight, INK_MIN_STEP_PX)).toBe(false)
  })

  it('mede um círculo, não uma elipse: os dois eixos valem o mesmo', () => {
    const from = { x: 0.5, y: 0.5 }
    const step = INK_MIN_STEP_PX + 0.05
    const sideways = { x: 0.5 + step / pageWidth, y: 0.5 }
    const upwards = { x: 0.5, y: 0.5 + step / pageHeight }
    expect(inkPointMoved(from, sideways, pageWidth, pageHeight, INK_MIN_STEP_PX)).toBe(true)
    expect(inkPointMoved(from, upwards, pageWidth, pageHeight, INK_MIN_STEP_PX)).toBe(true)

    const shortSideways = { x: 0.5 + (INK_MIN_STEP_PX - 0.05) / pageWidth, y: 0.5 }
    const shortUpwards = { x: 0.5, y: 0.5 + (INK_MIN_STEP_PX - 0.05) / pageHeight }
    expect(inkPointMoved(from, shortSideways, pageWidth, pageHeight, INK_MIN_STEP_PX)).toBe(false)
    expect(inkPointMoved(from, shortUpwards, pageWidth, pageHeight, INK_MIN_STEP_PX)).toBe(false)
  })

  it('guarda o MESMO detalhe com a página ampliada', () => {
    // O ponto seguinte anda um pixel de tela nos dois casos. Com a peneira em
    // fração de página, o mesmo passo passava sem zoom e era engolido com zoom.
    const zoomed = { width: pageWidth * 3, height: pageHeight * 3 }
    const from = { x: 0.5, y: 0.5 }
    const step = (width: number) => ({ x: 0.5 + 1 / width, y: 0.5 })
    expect(inkPointMoved(from, step(pageWidth), pageWidth, pageHeight, INK_MIN_STEP_PX)).toBe(true)
    expect(inkPointMoved(from, step(zoomed.width), zoomed.width, zoomed.height, INK_MIN_STEP_PX)).toBe(true)
  })

  it('o traço grosso guarda menos pontos que a caneta', () => {
    expect(MARKER_MIN_STEP_PX).toBeGreaterThan(INK_MIN_STEP_PX)
    const from = { x: 0.5, y: 0.5 }
    const to = { x: 0.5 + 0.8 / pageWidth, y: 0.5 }
    expect(inkPointMoved(from, to, pageWidth, pageHeight, INK_MIN_STEP_PX)).toBe(true)
    expect(inkPointMoved(from, to, pageWidth, pageHeight, MARKER_MIN_STEP_PX)).toBe(false)
  })
})
