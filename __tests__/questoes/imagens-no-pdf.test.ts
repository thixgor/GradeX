import { describe, expect, it } from 'vitest'
import { ALTURA_MAXIMA_DA_IMAGEM, medirImagem } from '@/lib/pdf/imagens-de-questao'
import {
  TAMANHO_MAXIMO_DA_IMAGEM,
  TAMANHO_MINIMO_DA_IMAGEM,
  TAMANHO_PADRAO_DA_IMAGEM,
} from '@/lib/questoes/imagens'

/** A largura útil de uma A4 com as margens de 20mm usadas em todos os PDFs. */
const LARGURA_UTIL = 170

const PAISAGEM = { width: 1600, height: 900 }
const QUADRADA = { width: 1000, height: 1000 }
const RETRATO = { width: 600, height: 2400 }

describe('medirImagem', () => {
  it('a paisagem recebe exatamente a largura pedida', () => {
    // É a promessa do campo de tamanho: 50% quer dizer metade da largura do
    // texto. O teto de altura não pode se meter no caso comum.
    for (const porcentagem of [35, 50, TAMANHO_PADRAO_DA_IMAGEM, 100]) {
      const { largura } = medirImagem(PAISAGEM, porcentagem, LARGURA_UTIL)
      expect(largura).toBeCloseTo((LARGURA_UTIL * porcentagem) / 100, 1)
    }
  })

  it('preserva a proporção da imagem', () => {
    for (const imagem of [PAISAGEM, QUADRADA, RETRATO]) {
      const { largura, altura } = medirImagem(imagem, 60, LARGURA_UTIL)
      expect(largura / altura).toBeCloseTo(imagem.width / imagem.height, 3)
    }
  })

  it('nunca ultrapassa a largura pedida', () => {
    for (const imagem of [PAISAGEM, QUADRADA, RETRATO]) {
      for (const porcentagem of [20, 55, 70, 100]) {
        const { largura } = medirImagem(imagem, porcentagem, LARGURA_UTIL)
        expect(largura).toBeLessThanOrEqual((LARGURA_UTIL * porcentagem) / 100 + 0.01)
      }
    }
  })

  it('o padrão deixa a imagem bem menor do que a página inteira', () => {
    // É a reclamação que originou o campo: a imagem ocupava a largura toda.
    const { largura } = medirImagem(PAISAGEM, TAMANHO_PADRAO_DA_IMAGEM, LARGURA_UTIL)
    expect(largura).toBeLessThan(LARGURA_UTIL * 0.75)
  })

  it('um retrato altíssimo é contido pelo teto de altura', () => {
    const { altura } = medirImagem(RETRATO, 100, LARGURA_UTIL)
    expect(altura).toBeLessThanOrEqual(ALTURA_MAXIMA_DA_IMAGEM + 0.01)
  })

  it('pedir menos entrega menos, inclusive no retrato preso pela altura', () => {
    const grande = medirImagem(RETRATO, TAMANHO_MAXIMO_DA_IMAGEM, LARGURA_UTIL)
    const pequena = medirImagem(RETRATO, TAMANHO_MINIMO_DA_IMAGEM, LARGURA_UTIL)
    expect(pequena.altura).toBeLessThan(grande.altura)
    expect(pequena.largura).toBeLessThan(grande.largura)
  })

  it('não amplia uma imagem pequena além do seu tamanho natural', () => {
    // 90px de largura não viram 170mm borrados.
    const { largura, altura } = medirImagem({ width: 90, height: 60 }, 100, LARGURA_UTIL)
    expect(largura).toBe(90)
    expect(altura).toBe(60)
  })

  it('duas imagens de 50% cabem lado a lado na largura útil', () => {
    const a = medirImagem(PAISAGEM, 50, LARGURA_UTIL)
    const b = medirImagem(QUADRADA, 50, LARGURA_UTIL)
    expect(a.largura + b.largura).toBeLessThanOrEqual(LARGURA_UTIL)
  })

  it('um tamanho pequeno não some por causa do teto de altura', () => {
    const { altura } = medirImagem(RETRATO, TAMANHO_MINIMO_DA_IMAGEM, LARGURA_UTIL)
    expect(altura).toBeGreaterThanOrEqual(29)
  })
})
