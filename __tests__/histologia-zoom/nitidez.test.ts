import { describe, expect, it } from 'vitest'

import {
  LIMITE_POR_QUALIDADE,
  REDUCAO_MAXIMA,
  escalasDosNiveis,
  fatorDeNitidez,
  proximoNivel,
  razaoMaximaDeZoom,
  tilesDoRetangulo,
} from '@/lib/histologia-zoom/nitidez'
import { LAMINAS } from '@/lib/histologia-zoom/repositorio'
import {
  anguloNaLamina,
  anguloNaTela,
  caminhoDaSeta,
  normalizarAngulo,
} from '@/lib/histologia-zoom/setas'
import { carregarPreferencias } from '@/lib/histologia-zoom/preferencias'

/**
 * Reproduz a regra de opacidade do OpenSeadragon (tiledimage.js):
 * um nível aparece a partir de razão 0,5 e fica opaco em 1,0.
 */
const opacidade = (razao: number) => Math.max(0, Math.min(1, (razao - 0.5) / 0.5))

/** Esticamento visível: razão do nível mais fino totalmente opaco. */
function esticamentoVisivel(escalas: number[], pixelsPorTopo: number, fator: number): number {
  let melhor = Infinity
  for (const e of escalas) {
    const real = pixelsPorTopo / e
    if (opacidade(real * fator) >= 1) melhor = Math.min(melhor, real)
  }
  return melhor
}

// Pirâmide típica com salto de 5× (2× → 10×), como a do linfonodo.
const ESCALAS = [1 / 60, 2 / 60, 10 / 60, 20 / 60, 40 / 60, 1]

describe('fator de nitidez', () => {
  it('sem ajuste, o salto 2× → 10× esticava o nível grosso até 5×', () => {
    // Zoom equivalente a ~9×: 0,15 pixel de tela por pixel do topo.
    expect(esticamentoVisivel(ESCALAS, 9 / 60, 1)).toBeGreaterThan(4)
  })

  it('com ajuste, nenhum nível visível passa de 1:1 enquanto houver nível mais fino', () => {
    for (let m = 0.8; m <= 60; m *= 1.07) {
      const px = m / 60
      const f = fatorDeNitidez(ESCALAS, px, LIMITE_POR_QUALIDADE.maxima)
      expect(esticamentoVisivel(ESCALAS, px, f), `${m.toFixed(1)}×`).toBeLessThanOrEqual(1.0001)
    }
  })

  it('"equilibrada" tolera até 1,5×', () => {
    for (let m = 0.8; m <= 60; m *= 1.07) {
      const px = m / 60
      const f = fatorDeNitidez(ESCALAS, px, LIMITE_POR_QUALIDADE.equilibrada)
      expect(esticamentoVisivel(ESCALAS, px, f)).toBeLessThanOrEqual(1.5001)
    }
  })

  it('além do topo, volta à regra padrão (zoom digital)', () => {
    expect(fatorDeNitidez(ESCALAS, 2, 1)).toBe(1)
  })

  it('funciona para todas as lâminas do acervo', () => {
    for (const l of LAMINAS) {
      const escalas = escalasDosNiveis(l.piramide)
      for (const px of [0.01, 0.05, 0.2, 0.5, 0.9]) {
        const f = fatorDeNitidez(escalas, px, 1)
        expect(Number.isFinite(f), l.slug).toBe(true)
        // Nível mais grosso com resolução suficiente, e quanto ele teria de ser reduzido.
        const necessario = escalas.find((e) => px / e <= 1)
        const reducao = necessario ? necessario / px : 0
        // Só é tolerado esticar quando o nível fino exigiria redução acima do teto.
        if (reducao <= REDUCAO_MAXIMA) {
          expect(esticamentoVisivel(escalas, px, f), `${l.slug} @ ${px}`).toBeLessThanOrEqual(1.0001)
        }
      }
    }
  })
})

describe('pré-carga', () => {
  const lamina = LAMINAS.find((l) => l.slug === 'linfonodo-prata-gomori')!

  it('escolhe o nível seguinte ao que está na tela', () => {
    const escalas = escalasDosNiveis(lamina.piramide)
    const i = proximoNivel(escalas, 9 / 60, 1)
    expect(i).not.toBeNull()
    expect(escalas[i!]).toBeGreaterThan(escalas[i! - 1])
  })

  it('lista tiles válidos do centro para as bordas, sem estourar o limite', () => {
    const escalas = escalasDosNiveis(lamina.piramide)
    const urls = tilesDoRetangulo(lamina.piramide, escalas.length - 1, { x: 20000, y: 20000, largura: 4000, altura: 3000 }, 0.1, 20)
    expect(urls.length).toBeGreaterThan(0)
    expect(urls.length).toBeLessThanOrEqual(20)
    for (const u of urls) expect(u).toMatch(/\/tile_\d+\.jpg$/)
  })
})

describe('zoom digital', () => {
  it('"sem perda" para em 1 pixel do scan por pixel físico', () => {
    expect(razaoMaximaDeZoom('sem-perda', 2)).toBe(0.5)
    expect(razaoMaximaDeZoom('padrao', 2)).toBe(1)
    expect(razaoMaximaDeZoom('livre', 1)).toBe(4)
  })
})

describe('setas', () => {
  it('ângulo na tela e na lâmina são inversos, com e sem espelho', () => {
    for (const rot of [0, 90, 180, 270, 33]) {
      for (const esp of [false, true]) {
        for (const a of [0, 45, 200]) {
          expect(anguloNaTela(anguloNaLamina(a, rot, esp), rot, esp)).toBeCloseTo(normalizarAngulo(a))
        }
      }
    }
  })

  it('o desenho da seta tem a ponta na origem', () => {
    expect(caminhoDaSeta(64).startsWith('M 0 0')).toBe(true)
  })
})

describe('preferências', () => {
  it('migra a retícula do formato antigo para o indicador', () => {
    const armazenado = new Map<string, string>([
      ['histologia-zoom:preferencias:v1', JSON.stringify({ ocular: { ativa: true, reticula: true } })],
    ])
    const original = globalThis.window
    ;(globalThis as { window?: unknown }).window = {
      localStorage: { getItem: (k: string) => armazenado.get(k) ?? null },
    }
    try {
      const p = carregarPreferencias()
      expect(p.ocular.indicador).toBe('reticula')
      expect('reticula' in p.ocular).toBe(false)
      expect(p.navegacao.qualidade).toBe('maxima')
    } finally {
      ;(globalThis as { window?: unknown }).window = original
    }
  })
})
