import { describe, expect, it } from 'vitest'

import {
  SWIPE_FLICK_DISTANCE,
  SWIPE_MAX_DURATION,
  SWIPE_MIN_DISTANCE,
  SCROLL_IGNORE_RANGE,
  type SwipeStart,
  lockSwipeAxis,
  readPageEdges,
  readScrollEdges,
  resolveSwipe,
  rubberBand,
  swipeAxesForMode,
} from '@/lib/pdf-viewer-swipe'

/**
 * O gesto de virar página do leitor de PDF. O que estes testes protegem é a
 * regra que dá a sensação de GoodNotes: o dedo vira a página nos dois eixos,
 * mas nunca no lugar de uma rolagem que ainda tinha para onde ir.
 */

function startAt(overrides: Partial<SwipeStart> = {}): SwipeStart {
  return {
    x: 200,
    y: 400,
    t: 0,
    allowNext: { x: true, y: true },
    allowPrev: { x: true, y: true },
    axis: 'x',
    dropped: false,
    ...overrides,
  }
}

describe('readScrollEdges', () => {
  it('trata conteúdo que cabe na tela como encostado nas duas pontas', () => {
    expect(readScrollEdges({ scrollStart: 0, viewport: 800, content: 800 })).toEqual({
      atStart: true,
      atEnd: true,
    })
  })

  it('ignora uma sobra de rolagem pequena demais para importar', () => {
    const edges = readScrollEdges({
      scrollStart: 0,
      viewport: 800,
      content: 800 + SCROLL_IGNORE_RANGE,
    })
    expect(edges).toEqual({ atStart: true, atEnd: true })
  })

  it('reconhece topo, meio e fim de uma rolagem de verdade', () => {
    const metrics = { viewport: 800, content: 2400 }
    expect(readScrollEdges({ ...metrics, scrollStart: 0 })).toEqual({ atStart: true, atEnd: false })
    expect(readScrollEdges({ ...metrics, scrollStart: 700 })).toEqual({ atStart: false, atEnd: false })
    expect(readScrollEdges({ ...metrics, scrollStart: 1600 })).toEqual({ atStart: false, atEnd: true })
  })
})

describe('readPageEdges', () => {
  const viewport = 800

  it('página inteira na tela libera os dois sentidos', () => {
    // O cabeçalho cobre o topo e a barra de baixo cobre o pé, então a página
    // "cabendo" ainda passa um pouco por trás dos dois. Medindo a ROLAGEM DO
    // DOCUMENTO, essa sobra fazia o gesto ser descartado como se houvesse
    // leitura pela frente — era o gesto vertical "não funcionando".
    expect(readPageEdges({ top: 110, bottom: 700, viewport })).toEqual({ atStart: true, atEnd: true })
    expect(readPageEdges({ top: -80, bottom: 860, viewport })).toEqual({ atStart: true, atEnd: true })
  })

  it('página ampliada arrasta antes de virar', () => {
    // Duas telas e meia de página: no meio dela não se vira para lado nenhum.
    expect(readPageEdges({ top: -900, bottom: 1100, viewport })).toEqual({ atStart: false, atEnd: false })
  })

  it('libera só o sentido cujo fim da página está à vista', () => {
    // Encostado no fim da página: para cima vira, para baixo ainda é leitura.
    expect(readPageEdges({ top: -1200, bottom: 790, viewport })).toEqual({ atStart: false, atEnd: true })
    // E no começo dela, o contrário.
    expect(readPageEdges({ top: 0, bottom: 2000, viewport })).toEqual({ atStart: true, atEnd: false })
  })
})

describe('swipeAxesForMode', () => {
  it('na leitura horizontal o gesto sintético não vira página em eixo nenhum', () => {
    // O lado é do encaixe nativo. A vertical estava liberada "de brinde" e era
    // isso que fazia passar o dedo para cima VOLTAR uma página: o arco do
    // polegar leva um empurrão lateral junto, e meia casa de empurrão já cai na
    // página anterior (medido: 200 px numa casa de 390 px).
    expect(swipeAxesForMode({ singlePage: false, horizontal: true })).toEqual({ x: false, y: false })
  })

  it('em "uma página por vez" o dedo vira nos dois eixos', () => {
    expect(swipeAxesForMode({ singlePage: true, horizontal: false })).toEqual({ x: true, y: true })
  })

  it('nos modos de rolagem contínua só para o lado — a vertical é a leitura', () => {
    expect(swipeAxesForMode({ singlePage: false, horizontal: false })).toEqual({ x: true, y: false })
  })
})

describe('lockSwipeAxis', () => {
  it('não trava eixo enquanto o dedo mal saiu do lugar', () => {
    expect(lockSwipeAxis(4, -6)).toBeNull()
  })

  it('trava no eixo dominante', () => {
    expect(lockSwipeAxis(-40, 6)).toBe('x')
    expect(lockSwipeAxis(6, -40)).toBe('y')
  })
})

describe('resolveSwipe', () => {
  it('vira para a próxima página com arrasto longo para a esquerda', () => {
    const start = startAt()
    expect(resolveSwipe(start, { x: start.x - SWIPE_MIN_DISTANCE - 10, y: start.y, t: 300 })).toBe(1)
  })

  it('volta uma página com arrasto longo para a direita', () => {
    const start = startAt()
    expect(resolveSwipe(start, { x: start.x + SWIPE_MIN_DISTANCE + 10, y: start.y, t: 300 })).toBe(-1)
  })

  it('vira para cima e para baixo no eixo vertical', () => {
    const up = startAt({ axis: 'y' })
    expect(resolveSwipe(up, { x: up.x, y: up.y - SWIPE_MIN_DISTANCE - 10, t: 300 })).toBe(1)
    const down = startAt({ axis: 'y' })
    expect(resolveSwipe(down, { x: down.x, y: down.y + SWIPE_MIN_DISTANCE + 10, t: 300 })).toBe(-1)
  })

  it('aceita um gesto curto quando ele é rápido', () => {
    const start = startAt()
    expect(resolveSwipe(start, { x: start.x - SWIPE_FLICK_DISTANCE - 4, y: start.y, t: 120 })).toBe(1)
  })

  it('recusa o mesmo gesto curto quando ele é lento', () => {
    const start = startAt()
    expect(resolveSwipe(start, { x: start.x - SWIPE_FLICK_DISTANCE - 4, y: start.y, t: 700 })).toBeNull()
  })

  it('aceita o lance final rápido mesmo num gesto que começou devagar', () => {
    // O dedo ajeita a posição e só então joga a página para o lado: o gesto
    // inteiro é lento (600 ms), mas o fim é veloz. Medindo só a média, isto
    // era recusado — foi a queixa mais comum em tablet.
    const start = startAt()
    const end = { x: start.x - 40, y: start.y, t: 600, velocity: -0.9 }
    expect(resolveSwipe(start, end)).toBe(1)
    // Sem a medida de velocidade, o mesmo gesto continua sendo recusado.
    expect(resolveSwipe(startAt(), { ...end, velocity: undefined })).toBeNull()
  })

  it('ignora o lance final que vai para o lado contrário ao gesto', () => {
    // Dedo que volta atrás no fim não pode virar a página do lado errado.
    const start = startAt()
    expect(resolveSwipe(start, { x: start.x - 40, y: start.y, t: 600, velocity: 0.9 })).toBeNull()
  })

  it('recusa arrasto diagonal, que quase sempre é rolagem', () => {
    const start = startAt()
    const end = { x: start.x - 80, y: start.y - 70, t: 300 }
    expect(resolveSwipe(start, end)).toBeNull()
  })

  it('recusa a direção bloqueada no início do gesto (página ainda tem o que rolar)', () => {
    // Página ampliada no meio da panorâmica: nem para a frente nem para trás.
    const start = startAt({ allowNext: { x: false, y: true }, allowPrev: { x: false, y: true } })
    expect(resolveSwipe(start, { x: start.x - 120, y: start.y, t: 300 })).toBeNull()
    expect(resolveSwipe(start, { x: start.x + 120, y: start.y, t: 300 })).toBeNull()
  })

  it('libera só a direção que corresponde à borda alcançada', () => {
    // Encostado no fim da rolagem: adiante vira, para trás ainda é rolagem.
    const start = startAt({ axis: 'y', allowNext: { x: true, y: true }, allowPrev: { x: true, y: false } })
    expect(resolveSwipe(start, { x: start.x, y: start.y - 120, t: 300 })).toBe(1)
    expect(resolveSwipe(start, { x: start.x, y: start.y + 120, t: 300 })).toBeNull()
  })

  it('ignora gesto descartado, sem eixo, cancelado ou demorado demais', () => {
    const far = { x: 60, y: 400, t: 300 }
    expect(resolveSwipe(startAt({ dropped: true }), far)).toBeNull()
    expect(resolveSwipe(startAt({ axis: null }), far)).toBeNull()
    expect(resolveSwipe(startAt(), { ...far, cancelled: true })).toBeNull()
    expect(resolveSwipe(startAt(), { ...far, t: SWIPE_MAX_DURATION + 1 })).toBeNull()
    expect(resolveSwipe(null, far)).toBeNull()
  })
})

describe('rubberBand', () => {
  it('acompanha o dedo no começo e vai travando', () => {
    expect(rubberBand(0)).toBe(0)
    expect(rubberBand(20)).toBeGreaterThan(15)
    expect(rubberBand(20)).toBeLessThan(20)
    expect(Math.abs(rubberBand(-400))).toBeLessThan(70)
    expect(rubberBand(-40)).toBeLessThan(0)
  })

  it('nunca anda para trás quando o dedo anda para frente', () => {
    let previous = 0
    for (let delta = 1; delta <= 400; delta += 7) {
      const offset = rubberBand(delta)
      expect(offset).toBeGreaterThanOrEqual(previous)
      previous = offset
    }
  })
})
