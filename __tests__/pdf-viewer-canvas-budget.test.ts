import { describe, expect, it } from 'vitest'

import { canvasMegapixels, fitToCanvasBudget } from '@/lib/pdf-viewer-canvas-budget'

/**
 * A mesma falha derrubou a aba do leitor três vezes — pinçar, despinçar, rolar
 * com a leitura ampliada — sempre pelo mesmo motivo: a soma dos canvas das
 * páginas montadas passava do que o aparelho aguenta. O que estes testes
 * protegem é a invariante que fecha essa porta:
 *
 *   soma dos canvas vivos <= orçamento, em qualquer zoom e qualquer densidade.
 */

// Uma A4 e um celular comum: DPR 3, 11 Mpx (~44 MB) somando as páginas vivas.
const A4 = { baseWidth: 595, baseHeight: 842 }
const PHONE = { dpr: 3, totalMpx: 11 }

// Espelha liveRadiusForZoom do leitor: ampliado, menos páginas montadas.
const livePagesFor = (zoom: number) => (zoom > 1.05 ? 3 : 5)

function totalMegapixels(zoom: number, density = 1) {
  const livePages = livePagesFor(zoom)
  const effective = fitToCanvasBudget({ ...A4, ...PHONE, scale: zoom, density, livePages })
  return canvasMegapixels(A4.baseWidth, A4.baseHeight, effective) * livePages
}

describe('fitToCanvasBudget', () => {
  it('nunca deixa a soma dos canvas passar do orçamento', () => {
    // Varre o intervalo inteiro de zoom do leitor, com e sem pinça.
    for (let zoom = 0.4; zoom <= 3; zoom += 0.05) {
      for (const density of [1, 1.5, 2, 3]) {
        const total = totalMegapixels(zoom, density)
        expect(total).toBeLessThanOrEqual(PHONE.totalMpx + 0.001)
      }
    }
  })

  it('o pico deixa de depender do zoom', () => {
    // Era esta a raiz do problema: com teto POR PÁGINA, ampliar multiplicava a
    // memória (toda página passava a encostar no teto). Agora, ampliado ou não,
    // o total fica na mesma faixa.
    const normal = totalMegapixels(0.6)
    const ampliado = totalMegapixels(1.5)
    expect(ampliado).toBeLessThanOrEqual(PHONE.totalMpx + 0.001)
    expect(normal).toBeLessThanOrEqual(PHONE.totalMpx + 0.001)
  })

  it('não interfere na leitura sem ampliação', () => {
    // No zoom em que a página cabe na largura do celular, o tamanho natural já
    // está abaixo da fatia — o teto não pode roubar nitidez aqui.
    const zoom = 0.6
    const effective = fitToCanvasBudget({ ...A4, ...PHONE, scale: zoom, livePages: livePagesFor(zoom) })
    expect(effective).toBeCloseTo(zoom * PHONE.dpr)
  })

  it('ampliado, corta a densidade em vez de estourar a memória', () => {
    const zoom = 1.5
    const effective = fitToCanvasBudget({ ...A4, ...PHONE, scale: zoom, livePages: livePagesFor(zoom) })
    // Desenha abaixo do DPR do aparelho...
    expect(effective).toBeLessThan(zoom * PHONE.dpr)
    // ...mas nunca abaixo da própria tela: menos de 1 pixel de canvas por pixel
    // de CSS seria borrão visível, e aí o corte teria ido longe demais.
    expect(effective / zoom).toBeGreaterThan(1.5)
  })

  it('a pinça sobe a nitidez enquanto couber, e para quando não cabe', () => {
    const zoom = 0.6
    const semPinca = fitToCanvasBudget({ ...A4, ...PHONE, scale: zoom, livePages: livePagesFor(zoom) })
    const comPinca = fitToCanvasBudget({ ...A4, ...PHONE, scale: zoom, density: 3, livePages: livePagesFor(zoom) })
    expect(comPinca).toBeGreaterThan(semPinca)
    expect(canvasMegapixels(A4.baseWidth, A4.baseHeight, comPinca) * livePagesFor(zoom))
      .toBeLessThanOrEqual(PHONE.totalMpx + 0.001)
  })

  it('aparelho fraco recebe um orçamento menor, e ele também é respeitado', () => {
    const weak = { dpr: 2, totalMpx: 6 }
    const livePages = 3
    const effective = fitToCanvasBudget({ ...A4, ...weak, scale: 1.5, livePages })
    expect(canvasMegapixels(A4.baseWidth, A4.baseHeight, effective) * livePages)
      .toBeLessThanOrEqual(weak.totalMpx + 0.001)
  })
})
