import { describe, expect, it } from 'vitest'
import { SETAS_MARCACOES } from '@/lib/radiologia/casos-raio-x-setas'
import { detalheDoCaso, marcacoesDaImagem } from '@/lib/radiologia/casos-raio-x-detalhes'

describe('setas das marcações dos casos de Raio-X', () => {
  it('acompanha a lista de marcações de cada imagem, dentro do filme', () => {
    for (const [slug, porImagem] of Object.entries(SETAS_MARCACOES)) {
      expect(detalheDoCaso(slug), slug).not.toBeNull()
      for (const [indice, setas] of Object.entries(porImagem)) {
        const lista = marcacoesDaImagem(slug, Number(indice))
        expect(setas.length, `${slug} ${indice}`).toBe(lista.length)
        for (const seta of setas) {
          if (!seta) continue
          expect(seta[0], slug).toBeGreaterThanOrEqual(0)
          expect(seta[0], slug).toBeLessThanOrEqual(1)
          expect(seta[1], slug).toBeGreaterThanOrEqual(0)
          expect(seta[1], slug).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('cobre a maior parte dos casos de imagem única', () => {
    expect(Object.keys(SETAS_MARCACOES).length).toBeGreaterThanOrEqual(90)
  })
})
