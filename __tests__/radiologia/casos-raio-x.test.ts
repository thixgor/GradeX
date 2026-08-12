import { describe, expect, it } from 'vitest'
import {
  CASOS_RAIO_X,
  CASOS_POR_SLUG,
  GUIAS_CASOS_RAIO_X,
  TOTAL_CASOS_RAIO_X,
  TOTAL_IMAGENS_CASOS_RAIO_X,
} from '@/lib/radiologia/casos-raio-x'

describe('catálogo de casos e alterações no Raio-X', () => {
  it('mantém slugs únicos e índice completo', () => {
    const slugs = CASOS_RAIO_X.map((caso) => caso.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(CASOS_POR_SLUG.size).toBe(CASOS_RAIO_X.length)
    expect(TOTAL_CASOS_RAIO_X).toBe(CASOS_RAIO_X.length)
  })

  it('tem conteúdo aprofundado em português e imagens locais para todo tema', () => {
    for (const caso of CASOS_RAIO_X) {
      expect(caso.titulo.length).toBeGreaterThan(3)
      expect(caso.resumo.length).toBeGreaterThan(20)
      expect(caso.explicacao.length).toBeGreaterThan(100)
      expect(caso.imagens.length).toBeGreaterThan(0)
      expect(GUIAS_CASOS_RAIO_X[caso.categoria]).toBeDefined()
      for (const imagem of caso.imagens) {
        expect(imagem.sprite).toMatch(/^\/img\/radiologia\/casos-raio-x\/v1\//)
        expect(imagem.largura).toBeGreaterThan(0)
        expect(imagem.altura).toBeGreaterThan(0)
        expect(imagem.titulo.length).toBeGreaterThan(3)
      }
    }
  })

  it('oferece os sete capítulos e mais de cem exemplos selecionados', () => {
    expect(Object.keys(GUIAS_CASOS_RAIO_X)).toHaveLength(7)
    expect(TOTAL_IMAGENS_CASOS_RAIO_X).toBeGreaterThan(100)
  })
})
