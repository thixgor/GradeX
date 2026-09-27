import { describe, expect, it } from 'vitest'

import { niveisResolvidos } from '@/lib/histologia-zoom/fonte-de-tiles'
import {
  IMAGEM_ORIGINAL,
  codificarPosicao,
  decodificarPosicao,
  filtroCss,
} from '@/lib/histologia-zoom/preferencias'
import { LAMINAS } from '@/lib/histologia-zoom/repositorio'
import type { PiramideDaLamina } from '@/lib/histologia-zoom/tipos'

const PIRAMIDE: PiramideDaLamina = {
  base: 'https://exemplo/imgsets/Lymphnode/Sample1/',
  miniatura: { url: 'https://exemplo/imgsets/Lymphnode/Sample1/thumb.jpg', largura: 638, altura: 448 },
  niveis: [
    { magn: 1, pasta: '1x/tile_', largura: 1366, altura: 963, tileL: 192, tileA: 192, nx: 8, ny: 6 },
    { magn: 60, pasta: '60x/tile_', largura: 81992, altura: 57792, tileL: 384, tileA: 384, nx: 214, ny: 151 },
  ],
}

describe('pirâmide de tiles', () => {
  it('a miniatura entra como nível 0 quando a proporção bate', () => {
    const n = niveisResolvidos(PIRAMIDE)
    expect(n).toHaveLength(3)
    expect(n[0]).toMatchObject({ largura: 638, nx: 1, ny: 1 })
    expect(n[0].url(0, 0)).toBe(PIRAMIDE.miniatura.url)
  })

  it('a miniatura fica de fora quando a proporção diverge', () => {
    const torta = { ...PIRAMIDE, miniatura: { ...PIRAMIDE.miniatura, altura: 638 } }
    expect(niveisResolvidos(torta)).toHaveLength(2)
  })

  it('numera os tiles como o HistoViewer: linha × colunas + coluna', () => {
    const n = niveisResolvidos(PIRAMIDE)
    expect(n[2].url(3, 2)).toBe(`${PIRAMIDE.base}60x/tile_${2 * 214 + 3}.jpg`)
    expect(n[1].url(7, 5)).toBe(`${PIRAMIDE.base}1x/tile_47.jpg`)
  })

  it('toda lâmina do acervo resolve níveis em ordem crescente', () => {
    for (const l of LAMINAS) {
      const n = niveisResolvidos(l.piramide)
      for (let i = 1; i < n.length; i++) expect(n[i].largura, l.slug).toBeGreaterThan(n[i - 1].largura)
    }
  })
})

describe('posição compartilhável', () => {
  it('ida e volta', () => {
    const v = codificarPosicao({ x: 0.412345, y: 0.3, z: 12.3456, r: 90 })
    expect(v).toBe('0.4123,0.3,12.35,90')
    expect(decodificarPosicao(v)).toEqual({ x: 0.4123, y: 0.3, z: 12.35, r: 90 })
  })

  it('rejeita lixo em vez de abrir a lâmina num lugar absurdo', () => {
    expect(decodificarPosicao('abc')).toBeNull()
    expect(decodificarPosicao('0.5,0.5,0')).toBeNull()
    expect(decodificarPosicao(null)).toBeNull()
  })
})

describe('filtros de imagem', () => {
  it('imagem original não recebe filtro', () => {
    expect(filtroCss(IMAGEM_ORIGINAL)).toBe('none')
  })

  it('compõe os ajustes', () => {
    expect(filtroCss({ ...IMAGEM_ORIGINAL, brilho: 120, cinza: true })).toBe('brightness(1.2) grayscale(1)')
  })
})
