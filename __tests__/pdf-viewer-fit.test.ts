import { describe, expect, it } from 'vitest'

import {
  clampZoomRatio,
  isLandscapePage,
  LANDSCAPE_MAX_RESTING_ZOOM,
  legacyZoomRatio,
  LANDSCAPE_MIN_HEIGHT_SHARE,
  majorityPageSize,
  pageSizeKey,
  pageWidthFit,
  restingZoomFor,
  TOUCH_PORTRAIT_MAX_RESTING_ZOOM,
  zoomRatioFor,
  type FitPageSize,
} from '@/lib/pdf-viewer-fit'

/**
 * O leitor nasceu para A4 em pé. Estes testes protegem as duas metades da
 * regra do tamanho de repouso:
 *
 *   - material em pé continua EXATAMENTE como era (ajusta à largura, teto 100%);
 *   - material em paisagem cabe INTEIRO na tela, em qualquer aparelho.
 */

const A4_PORTRAIT: FitPageSize = { width: 595, height: 842 }
const A4_LANDSCAPE: FitPageSize = { width: 842, height: 595 }
// Slide 16:9 exportado do PowerPoint.
const SLIDE: FitPageSize = { width: 960, height: 540 }
// Slide exportado grande (Keynote).
const BIG_SLIDE: FitPageSize = { width: 1440, height: 810 }

// Áreas úteis típicas (já descontados cabeçalho, barra do celular e respiros).
const PHONE_PORTRAIT = { availableWidth: 356, availableHeight: 600 }
const PHONE_LANDSCAPE = { availableWidth: 780, availableHeight: 250 }
const TABLET_PORTRAIT = { availableWidth: 700, availableHeight: 850 }
const TABLET_LANDSCAPE = { availableWidth: 950, availableHeight: 560 }
const NOTEBOOK = { availableWidth: 900, availableHeight: 520 }
const DESKTOP_1080 = { availableWidth: 1100, availableHeight: 800 }

function frame(page: FitPageSize, zoom: number) {
  return { width: page.width * zoom, height: page.height * zoom }
}

describe('isLandscapePage', () => {
  it('reconhece paisagem só com folga', () => {
    expect(isLandscapePage(A4_LANDSCAPE)).toBe(true)
    expect(isLandscapePage(SLIDE)).toBe(true)
    expect(isLandscapePage(A4_PORTRAIT)).toBe(false)
    // Quadrada (ou quase) não é paisagem.
    expect(isLandscapePage({ width: 600, height: 600 })).toBe(false)
    expect(isLandscapePage({ width: 620, height: 600 })).toBe(false)
    expect(isLandscapePage(null)).toBe(false)
    expect(isLandscapePage({ width: 0, height: 0 })).toBe(false)
  })
})

describe('restingZoomFor — em pé (a regra de sempre)', () => {
  it('ajusta à largura no celular', () => {
    const zoom = restingZoomFor({ page: A4_PORTRAIT, ...PHONE_PORTRAIT })!
    expect(zoom).toBeCloseTo(356 / 595)
  })

  it('nunca passa de 100% numa tela larga', () => {
    expect(restingZoomFor({ page: A4_PORTRAIT, ...DESKTOP_1080 })).toBe(1)
    expect(restingZoomFor({ page: A4_PORTRAIT, ...TABLET_LANDSCAPE })).toBe(1)
  })

  it('em tela de toque cresce até encher o tablet em pé, com teto', () => {
    const touch = { portraitMaxZoom: TOUCH_PORTRAIT_MAX_RESTING_ZOOM }
    // iPad em pé: ajusta à largura (a A4 a 100% deixava margens largas).
    expect(restingZoomFor({ page: A4_PORTRAIT, availableWidth: 700, availableHeight: 850, ...touch })).toBeCloseTo(700 / 595)
    // Tela larga de toque: para no teto.
    expect(restingZoomFor({ page: A4_PORTRAIT, ...DESKTOP_1080, ...touch })).toBe(TOUCH_PORTRAIT_MAX_RESTING_ZOOM)
    // Celular em pé: igual ao computador (a largura manda).
    expect(restingZoomFor({ page: A4_PORTRAIT, ...PHONE_PORTRAIT, ...touch })).toBeCloseTo(356 / 595)
  })

  it('não olha a altura: a página em pé rola, como sempre rolou', () => {
    const zoom = restingZoomFor({ page: A4_PORTRAIT, ...PHONE_LANDSCAPE })!
    expect(zoom).toBe(1)
  })
})

describe('restingZoomFor — paisagem', () => {
  const screens = { PHONE_PORTRAIT, PHONE_LANDSCAPE, TABLET_PORTRAIT, TABLET_LANDSCAPE, NOTEBOOK, DESKTOP_1080 }

  for (const [name, screen] of Object.entries(screens)) {
    for (const [pageName, page] of Object.entries({ A4_LANDSCAPE, SLIDE, BIG_SLIDE })) {
      it(`${pageName} cabe inteira (largura E altura) em ${name}`, () => {
        const zoom = restingZoomFor({ page, ...screen })!
        const size = frame(page, zoom)
        expect(size.width).toBeLessThanOrEqual(screen.availableWidth + 0.5)
        // No celular deitado a página fica na largura, de propósito (ver o
        // teste abaixo); em todas as outras, cabe inteira.
        if (name !== 'PHONE_LANDSCAPE') {
          expect(size.height).toBeLessThanOrEqual(screen.availableHeight + 0.5)
        }
      })
    }
  }

  it('no celular deitado, fica na LARGURA: quem gira o celular quer a página maior', () => {
    // Caber em 250px de altura deixaria o slide com menos da metade da largura.
    const zoom = restingZoomFor({ page: SLIDE, ...PHONE_LANDSCAPE })!
    expect(zoom).toBeCloseTo(PHONE_LANDSCAPE.availableWidth / SLIDE.width)
  })

  it('no notebook, encolhe um pouco para caber inteira', () => {
    // 900px de largura pediriam 506px de altura; há 480.
    const zoom = restingZoomFor({ page: SLIDE, availableWidth: 900, availableHeight: 480 })!
    expect(zoom).toBeCloseTo(480 / 540)
    expect(frame(SLIDE, zoom).width).toBeGreaterThan(900 * LANDSCAPE_MIN_HEIGHT_SHARE)
  })

  it('cresce além de 100% em tela grande, até o teto', () => {
    const zoom = restingZoomFor({ page: A4_LANDSCAPE, ...DESKTOP_1080 })!
    expect(zoom).toBeGreaterThan(1)
    expect(zoom).toBeLessThanOrEqual(LANDSCAPE_MAX_RESTING_ZOOM)
    const huge = restingZoomFor({ page: A4_LANDSCAPE, availableWidth: 5000, availableHeight: 3000 })!
    expect(huge).toBe(LANDSCAPE_MAX_RESTING_ZOOM)
  })

  it('numa janela baixíssima não vira selo: fica na largura e rola', () => {
    const zoom = restingZoomFor({ page: SLIDE, availableWidth: 900, availableHeight: 80 })!
    expect(zoom).toBeCloseTo(900 / 960)
  })

  it('sem altura medida, usa a largura', () => {
    const zoom = restingZoomFor({ page: SLIDE, availableWidth: 480, availableHeight: 0 })!
    expect(zoom).toBeCloseTo(0.5)
  })
})

describe('restingZoomFor — "Largura da tela"', () => {
  it('ajusta à largura, sem teto e sem olhar a altura', () => {
    expect(restingZoomFor({ page: A4_PORTRAIT, ...DESKTOP_1080, fitWidth: true })).toBeCloseTo(1100 / 595)
    expect(restingZoomFor({ page: SLIDE, ...PHONE_LANDSCAPE, fitWidth: true })).toBeCloseTo(780 / 960)
  })

  it('devolve null sem medida', () => {
    expect(restingZoomFor({ page: SLIDE, availableWidth: 0, availableHeight: 500 })).toBeNull()
    expect(restingZoomFor({ page: { width: 0, height: 0 }, availableWidth: 500, availableHeight: 500 })).toBeNull()
  })
})

describe('zoom relativo', () => {
  it('o zoom salvo de um A4 no celular não faz o material em paisagem sair da tela', () => {
    // Leitor ampliou 20% lendo um A4 em pé.
    const portraitResting = restingZoomFor({ page: A4_PORTRAIT, ...PHONE_PORTRAIT })!
    const ratio = zoomRatioFor(portraitResting * 1.2, portraitResting)!
    expect(ratio).toBeCloseTo(1.2)

    // Abre um material em paisagem: continua "20% acima do normal" — e o
    // normal dele cabe na tela.
    const landscapeResting = restingZoomFor({ page: SLIDE, ...PHONE_PORTRAIT })!
    expect(frame(SLIDE, landscapeResting).width).toBeLessThanOrEqual(PHONE_PORTRAIT.availableWidth + 0.5)
    expect(landscapeResting * ratio).toBeCloseTo(landscapeResting * 1.2)
  })

  it('zoom antigo salvo pelo ajuste automático vira "ajustado" (relativo 1)', () => {
    // A conta antiga dava 366/595 = 0,615 no celular; a nova, 356/595.
    const resting = restingZoomFor({ page: A4_PORTRAIT, ...PHONE_PORTRAIT })!
    expect(legacyZoomRatio(0.62, resting)).toBe(1)
    // Desktop: o antigo 100% é o repouso de agora.
    expect(legacyZoomRatio(1, 1)).toBe(1)
  })

  it('zoom antigo escolhido à mão é preservado', () => {
    const resting = restingZoomFor({ page: A4_PORTRAIT, ...PHONE_PORTRAIT })!
    expect(legacyZoomRatio(resting * 1.5, resting)).toBeCloseTo(1.5)
    expect(legacyZoomRatio(1, 0)).toBeNull()
  })

  it('arredondamento de duas casas não vira "1% menor"', () => {
    expect(zoomRatioFor(0.76, 0.7654)).toBe(1)
    expect(zoomRatioFor(0.72, 0.6)).toBeCloseTo(1.2)
  })

  it('limita relativos absurdos', () => {
    expect(clampZoomRatio(100)).toBe(8)
    expect(clampZoomRatio(0.001)).toBe(0.25)
    expect(clampZoomRatio(Number.NaN)).toBe(1)
    expect(zoomRatioFor(1, 0)).toBeNull()
  })
})

describe('majorityPageSize', () => {
  function counts(entries: Array<[FitPageSize, number[]]>) {
    const map = new Map<string, { size: FitPageSize; pages: Set<number> }>()
    for (const [size, pages] of entries) map.set(pageSizeKey(size), { size, pages: new Set(pages) })
    return map
  }

  it('fica com o formato da maioria, não com o último que chegou', () => {
    const map = counts([[A4_PORTRAIT, [1, 2, 3]], [A4_LANDSCAPE, [4]]])
    expect(majorityPageSize(map)).toEqual(A4_PORTRAIT)
  })

  it('empate fica com quem chegou primeiro (não oscila)', () => {
    const map = counts([[A4_LANDSCAPE, [1]], [A4_PORTRAIT, [2]]])
    expect(majorityPageSize(map)).toEqual(A4_LANDSCAPE)
  })

  it('arredonda a chave para não separar o mesmo formato por fração de ponto', () => {
    expect(pageSizeKey({ width: 595.28, height: 841.89 })).toBe(pageSizeKey({ width: 595, height: 842 }))
  })

  it('vazio → null', () => {
    expect(majorityPageSize(new Map())).toBeNull()
  })
})

describe('pageWidthFit', () => {
  it('a tabela deitada numa apostila em pé encolhe até a largura das outras', () => {
    const factor = pageWidthFit(A4_LANDSCAPE, A4_PORTRAIT)
    expect(A4_LANDSCAPE.width * factor).toBeCloseTo(A4_PORTRAIT.width)
  })

  it('nunca aumenta página nenhuma', () => {
    expect(pageWidthFit(A4_PORTRAIT, A4_LANDSCAPE)).toBe(1)
    expect(pageWidthFit(A4_PORTRAIT, A4_PORTRAIT)).toBe(1)
  })

  it('uma Carta numa apostila A4 também encolhe — 3% já passa da tela do celular', () => {
    const letter = { width: 612, height: 792 }
    expect(letter.width * pageWidthFit(letter, A4_PORTRAIT)).toBeCloseTo(A4_PORTRAIT.width)
  })

  it('arredondamento de MediaBox não conta', () => {
    expect(pageWidthFit({ width: 595.28, height: 841.89 }, A4_PORTRAIT)).toBe(1)
  })

  it('sem medida, fator 1', () => {
    expect(pageWidthFit(null, A4_PORTRAIT)).toBe(1)
    expect(pageWidthFit(A4_LANDSCAPE, null)).toBe(1)
  })
})
