import { describe, expect, it } from 'vitest'

import {
  isViewportRelayout,
  measurePageIndex,
  RELAYOUT_SETTLE_MS,
} from '@/lib/pdf-viewer-relayout'

/**
 * Girar o iPad no leitor de PDF piscava e trocava de página em rajada. A causa
 * é uma divisão que roda com deslocamento velho e casa nova durante a animação
 * de rotação. O que estes testes protegem é a regra que fecha essa porta:
 *
 *   uma medida de deslocamento só vale enquanto a casa não muda de tamanho.
 */

// Um iPad girando: retrato 820px, paisagem 1180px.
const PORTRAIT = 820
const LANDSCAPE = 1180

describe('measurePageIndex', () => {
  it('acha a página quando a casa não mudou', () => {
    const index = measurePageIndex({
      offset: PORTRAIT * 7,
      slot: PORTRAIT,
      slotWhenScrolled: PORTRAIT,
      count: 40,
    })
    expect(index).toBe(7)
  })

  it('encaixa na casa mais próxima no meio de um arrasto', () => {
    const index = measurePageIndex({
      offset: PORTRAIT * 7 + PORTRAIT * 0.4,
      slot: PORTRAIT,
      slotWhenScrolled: PORTRAIT,
      count: 40,
    })
    expect(index).toBe(7)
  })

  it('recusa a medida quando a tela girou por baixo do deslocamento', () => {
    // É este o caso do defeito: o navegador preserva o `scrollLeft` da página 7
    // em retrato e a casa já é a de paisagem. A conta ingênua daria a página 4.
    const naive = Math.round((PORTRAIT * 7) / LANDSCAPE)
    expect(naive).not.toBe(7)

    expect(measurePageIndex({
      offset: PORTRAIT * 7,
      slot: LANDSCAPE,
      slotWhenScrolled: PORTRAIT,
      count: 40,
    })).toBeNull()
  })

  it('recusa a medida em qualquer largura intermediária da animação de rotação', () => {
    // A rotação não pula de 820 para 1180: ela passa por tudo que há no meio, e
    // cada largura intermediária produzia uma página diferente.
    for (let slot = PORTRAIT + 1; slot <= LANDSCAPE; slot += 1) {
      expect(measurePageIndex({
        offset: PORTRAIT * 7,
        slot,
        slotWhenScrolled: PORTRAIT,
        count: 40,
      })).toBeNull()
    }
  })

  it('aceita meio pixel de folga — arredondamento de layout não é rotação', () => {
    expect(measurePageIndex({
      offset: PORTRAIT * 3,
      slot: PORTRAIT + 0.4,
      slotWhenScrolled: PORTRAIT,
      count: 40,
    })).toBe(3)
  })

  it('nunca sai da lista de páginas', () => {
    expect(measurePageIndex({
      offset: PORTRAIT * 900,
      slot: PORTRAIT,
      slotWhenScrolled: PORTRAIT,
      count: 10,
    })).toBe(9)
    expect(measurePageIndex({
      offset: -5000,
      slot: PORTRAIT,
      slotWhenScrolled: PORTRAIT,
      count: 10,
    })).toBe(0)
  })

  it('não responde sem casa, sem páginas ou com número inválido', () => {
    const base = { offset: 100, slot: PORTRAIT, slotWhenScrolled: PORTRAIT, count: 10 }
    expect(measurePageIndex({ ...base, slot: 0 })).toBeNull()
    expect(measurePageIndex({ ...base, slotWhenScrolled: 0 })).toBeNull()
    expect(measurePageIndex({ ...base, count: 0 })).toBeNull()
    expect(measurePageIndex({ ...base, offset: Number.NaN })).toBeNull()
  })
})

describe('isViewportRelayout', () => {
  it('reconhece a rotação', () => {
    expect(isViewportRelayout(PORTRAIT, LANDSCAPE)).toBe(true)
    expect(isViewportRelayout(LANDSCAPE, PORTRAIT)).toBe(true)
  })

  it('ignora a barra de endereço e o teclado do iOS', () => {
    // Os dois mexem só na ALTURA. Se a largura não mudou, não houve relayout —
    // congelar a leitura aqui trocaria um defeito por outro, no meio de uma
    // rolagem comum.
    expect(isViewportRelayout(PORTRAIT, PORTRAIT)).toBe(false)
    expect(isViewportRelayout(PORTRAIT, PORTRAIT + 0.5)).toBe(false)
  })

  it('não responde a números inválidos', () => {
    expect(isViewportRelayout(Number.NaN, PORTRAIT)).toBe(false)
    expect(isViewportRelayout(PORTRAIT, Number.NaN)).toBe(false)
  })
})

describe('RELAYOUT_SETTLE_MS', () => {
  it('cobre a animação de rotação sem fazer o leitor esperar', () => {
    expect(RELAYOUT_SETTLE_MS).toBeGreaterThanOrEqual(150)
    expect(RELAYOUT_SETTLE_MS).toBeLessThanOrEqual(500)
  })
})
