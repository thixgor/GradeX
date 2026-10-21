import { describe, expect, it } from 'vitest'

import {
  READING_ANCHOR_RATIO,
  ZOOM_ANCHOR_HOLD_MS,
  ZOOM_LEVELS,
  nextZoomLevel,
  readReadingAnchor,
  readingAnchorDrift,
  zoomPercent,
} from '@/lib/pdf-viewer-zoom'

/**
 * Apertar "aumentar zoom" trocava de página. O que estes testes protegem é a
 * regra que fecha essa porta:
 *
 *   o zoom muda o TAMANHO da página, nunca o PONTO em que a leitura está.
 *
 * A simulação abaixo é a pilha vertical do leitor: uma página de A4 por casa,
 * o respiro entre elas, e o navegador preservando o deslocamento da rolagem em
 * pixels enquanto todas as páginas engordam de uma vez.
 */

const VIEWPORT = 800
// Moldura + respiro entre as páginas (ver `pageSlotHeight` no leitor): não
// escala com o zoom, e é por isso que ele entra na simulação.
const GAP = 36
const PAGE_HEIGHT = 1000
const CURRENT_INDEX = 157

/** Onde a borda de cima da página `index` cai na tela, dado o zoom e a rolagem. */
function pageTop(index: number, zoom: number, scroll: number) {
  return index * (PAGE_HEIGHT * zoom + GAP) - scroll
}

/** Que ponto da tela o leitor está lendo, em fração da página atual. */
function anchorOf(top: number, zoom: number) {
  return readReadingAnchor({ top, height: PAGE_HEIGHT * zoom, viewport: VIEWPORT })
}

describe('readReadingAnchor', () => {
  it('mede a fração da página que está na linha de leitura', () => {
    // Página começando 200px acima do topo da tela, 1000px de altura.
    const ratio = readReadingAnchor({ top: -200, height: 1000, viewport: VIEWPORT })
    expect(ratio).toBeCloseTo((VIEWPORT * READING_ANCHOR_RATIO + 200) / 1000, 6)
  })

  it('recusa medidas que não existem', () => {
    expect(readReadingAnchor({ top: 0, height: 0, viewport: VIEWPORT })).toBeNull()
    expect(readReadingAnchor({ top: 0, height: 1000, viewport: 0 })).toBeNull()
    expect(readReadingAnchor({ top: Number.NaN, height: 1000, viewport: VIEWPORT })).toBeNull()
  })

  it('não extrapola sem limite quando a linha cai no respiro entre páginas', () => {
    const above = readReadingAnchor({ top: 90_000, height: 1000, viewport: VIEWPORT })
    const below = readReadingAnchor({ top: -90_000, height: 1000, viewport: VIEWPORT })
    expect(above).toBe(-0.25)
    expect(below).toBe(1.25)
  })
})

describe('readingAnchorDrift', () => {
  it('é zero quando a leitura não saiu do lugar', () => {
    const metrics = { top: -200, height: 1000, viewport: VIEWPORT }
    const ratio = readReadingAnchor(metrics)!
    expect(readingAnchorDrift(metrics, ratio)).toBeCloseTo(0, 6)
  })

  it('devolve a leitura ao mesmo ponto depois de um passo de zoom', () => {
    const zoom = 1
    const scroll = CURRENT_INDEX * (PAGE_HEIGHT + GAP) + 200
    const before = pageTop(CURRENT_INDEX, zoom, scroll)
    const ratio = anchorOf(before, zoom)!

    // O navegador PRESERVA o deslocamento: só as alturas mudam.
    const zoomed = zoom * nextZoomLevel(1, 1)!
    const after = pageTop(CURRENT_INDEX, zoomed, scroll)
    const drift = readingAnchorDrift(
      { top: after, height: PAGE_HEIGHT * zoomed, viewport: VIEWPORT },
      ratio
    )

    // Sem a correção, o ponto de leitura tinha ido parar longe da tela — é o
    // que empurrava o observador de foco para outra página.
    expect(Math.abs(drift)).toBeGreaterThan(VIEWPORT)

    const corrected = pageTop(CURRENT_INDEX, zoomed, scroll + drift)
    expect(anchorOf(corrected, zoomed)).toBeCloseTo(ratio, 6)
  })

  it('serve para os dois lados: diminuir o zoom também não muda a leitura', () => {
    const zoom = 1.6
    const scroll = CURRENT_INDEX * (PAGE_HEIGHT * zoom + GAP) + 640
    const ratio = anchorOf(pageTop(CURRENT_INDEX, zoom, scroll), zoom)!

    const zoomed = zoom * nextZoomLevel(1, -1)!
    const drift = readingAnchorDrift(
      { top: pageTop(CURRENT_INDEX, zoomed, scroll), height: PAGE_HEIGHT * zoomed, viewport: VIEWPORT },
      ratio
    )
    const corrected = pageTop(CURRENT_INDEX, zoomed, scroll + drift)
    expect(anchorOf(corrected, zoomed)).toBeCloseTo(ratio, 6)
  })

  it('mantém a página atual dentro da faixa que decide o foco', () => {
    // A faixa do observador de foco vai de 18% a 32% da tela. Ancorar no meio
    // dela é o que impede o NÚMERO da página de mudar junto com o zoom.
    const anchorY = VIEWPORT * READING_ANCHOR_RATIO
    expect(anchorY).toBeGreaterThan(VIEWPORT * 0.18)
    expect(anchorY).toBeLessThan(VIEWPORT * 0.32)
  })

  it('não responde a medidas impossíveis', () => {
    expect(readingAnchorDrift({ top: 0, height: 0, viewport: VIEWPORT }, 0.5)).toBe(0)
    expect(readingAnchorDrift({ top: 0, height: 1000, viewport: VIEWPORT }, Number.NaN)).toBe(0)
  })
})

describe('constantes do zoom', () => {
  it('segura a leitura por mais tempo do que o zoom leva para assentar', () => {
    // O leitor só refaz os espaçadores da virtualização quando o zoom assenta,
    // 150ms depois do último passo. Soltar antes disso deixaria a leitura
    // escorregar justamente no último ato.
    expect(ZOOM_ANCHOR_HOLD_MS).toBeGreaterThan(150)
  })
})

/**
 * O número do zoom não fazia sentido no iPhone: a folha dizia o zoom ABSOLUTO
 * (a página abria em "60%" e subia de 12 em 12) e a pastilha de "toque para
 * ajustar" contava sobre a LARGURA da tela (119%, 139%…) — dois números para
 * a mesma página. Agora 100% é o tamanho em que a página abre, e cada toque
 * anda um degrau redondo.
 */
describe('escada de zoom', () => {
  // Repouso de uma A4 num iPhone de 393px (359px úteis / 595pt).
  const IPHONE_RESTING = 359 / 595
  const floor3 = (value: number) => Math.floor(value * 1000) / 1000

  /** Toca "+" ou "−" do jeito que o leitor toca: relativo, arredondado para baixo. */
  function tap(zoom: number, direction: 1 | -1, resting: number) {
    const level = nextZoomLevel(zoom / resting, direction)
    return level == null ? zoom : Number(floor3(resting * level).toFixed(3))
  }

  it('abre em 100% em qualquer aparelho', () => {
    expect(zoomPercent(floor3(IPHONE_RESTING), IPHONE_RESTING)).toBe(100)
    expect(zoomPercent(1, 1)).toBe(100)
    expect(zoomPercent(floor3(1.25), 1.25)).toBe(100)
  })

  it('anda em degraus redondos no iPhone, para cima e para baixo', () => {
    let zoom = floor3(IPHONE_RESTING)
    const up: number[] = []
    // O teto do leitor no celular é 2,5x a largura (ver `maxZoom`): 250%.
    for (let i = 0; i < 6; i += 1) {
      zoom = tap(zoom, 1, IPHONE_RESTING)
      up.push(zoomPercent(zoom, IPHONE_RESTING))
    }
    expect(up).toEqual([110, 125, 150, 175, 200, 250])

    zoom = floor3(IPHONE_RESTING)
    const down: number[] = []
    for (let i = 0; i < 3; i += 1) {
      zoom = tap(zoom, -1, IPHONE_RESTING)
      down.push(zoomPercent(zoom, IPHONE_RESTING))
    }
    expect(down).toEqual([90, 75, 60])
  })

  it('um zoom já no degrau não repete o mesmo degrau', () => {
    // 110% de um repouso de 0,603, arredondado para baixo, é 1,0995.
    expect(nextZoomLevel(1.0995, 1)).toBe(1.25)
    expect(nextZoomLevel(1.0995, -1)).toBe(1)
    expect(nextZoomLevel(0.9995, 1)).toBe(1.1)
    expect(nextZoomLevel(0.9995, -1)).toBe(0.9)
  })

  it('um zoom fora da escada vai para o degrau mais próximo na direção pedida', () => {
    // "Ajustar a página inteira" pode dar, por exemplo, 87%.
    expect(nextZoomLevel(0.87, 1)).toBe(0.9)
    expect(nextZoomLevel(0.87, -1)).toBe(0.75)
  })

  it('a escada termina nas pontas', () => {
    expect(nextZoomLevel(ZOOM_LEVELS[ZOOM_LEVELS.length - 1], 1)).toBeNull()
    expect(nextZoomLevel(ZOOM_LEVELS[0], -1)).toBeNull()
  })

  it('a escada sobe sempre e passa pelo tamanho normal', () => {
    for (let i = 1; i < ZOOM_LEVELS.length; i += 1) {
      expect(ZOOM_LEVELS[i]).toBeGreaterThan(ZOOM_LEVELS[i - 1])
    }
    expect(ZOOM_LEVELS).toContain(1)
  })

  it('antes de o tamanho normal ser conhecido, mostra o zoom absoluto', () => {
    expect(zoomPercent(0.8, null)).toBe(80)
    expect(zoomPercent(0.8, undefined)).toBe(80)
  })
})
