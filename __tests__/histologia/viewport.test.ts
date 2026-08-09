import { describe, expect, it } from 'vitest'

import {
  OBJETIVOS,
  aplicarObjetivo,
  aplicarZoom,
  campoDeAjuste,
  centralizar,
  deslocar,
  enquadrar,
  escalaDeAjuste,
  janelaVisivel,
  larguraDaBarraEmMicrometros,
  limitesDeEscala,
  objetivoAtual,
  paraCoordenadaDaImagem,
  paraCoordenadaDaTela,
  transformCss,
  type Campo,
} from '@/lib/histologia/viewport'

/**
 * Lâmina em paisagem e contêiner em retrato — o caso que mais quebra
 * visualizador na vida real, porque força centralização num eixo e corte no
 * outro. Testar com imagem e contêiner de mesma proporção esconderia bugs.
 */
const IMAGEM = { largura: 1920, altura: 1280 }
const CONTAINER = { largura: 800, altura: 900 }

describe('escala de ajuste', () => {
  it('faz a imagem inteira caber, limitada pelo eixo mais apertado', () => {
    // 800/1920 = 0,4167 é menor que 900/1280 = 0,7031 → a largura manda.
    expect(escalaDeAjuste(IMAGEM, CONTAINER)).toBeCloseTo(800 / 1920, 10)
  })

  it('não divide por zero quando o contêiner ainda não foi medido', () => {
    expect(escalaDeAjuste(IMAGEM, { largura: 0, altura: 0 })).toBe(1)
    expect(escalaDeAjuste({ largura: 0, altura: 0 }, CONTAINER)).toBe(1)
  })
})

describe('campo de ajuste', () => {
  it('centraliza a imagem no eixo que sobra', () => {
    const campo = campoDeAjuste(IMAGEM, CONTAINER)
    expect(campo.x).toBeCloseTo(0, 10)
    // Altura escalada = 1280 * 0,4167 = 533,33 → sobra (900 - 533,33)/2.
    expect(campo.y).toBeCloseTo((900 - 1280 * (800 / 1920)) / 2, 10)
  })
})

describe('conversão de coordenadas', () => {
  it('ida e volta devolve o ponto original', () => {
    const campo: Campo = { escala: 2.5, x: -300, y: -120 }
    const original = { x: 733, y: 402 }
    const volta = paraCoordenadaDaImagem(campo, paraCoordenadaDaTela(campo, original))
    expect(volta.x).toBeCloseTo(original.x, 10)
    expect(volta.y).toBeCloseTo(original.y, 10)
  })
})

describe('alinhamento base × overlay', () => {
  /**
   * A invariante central do microscópio. Base e overlay têm a mesma resolução
   * natural e recebem a *mesma* string de transform; então, para qualquer campo
   * e qualquer ponto, os dois pousam no mesmo pixel de tela. Este teste é o que
   * garante que a seta vermelha aponte para a estrutura, e não dois pixels ao
   * lado, em qualquer viewport.
   */
  it('projeta o mesmo ponto no mesmo pixel, em qualquer zoom e deslocamento', () => {
    const campos: Campo[] = [
      campoDeAjuste(IMAGEM, CONTAINER),
      { escala: 1, x: 0, y: 0 },
      { escala: 3.7, x: -1204.5, y: -877.25 },
      { escala: 0.13, x: 42, y: -8 },
    ]
    const pontos = [
      { x: 0, y: 0 },
      { x: 1920, y: 1280 },
      { x: 960, y: 640 },
      { x: 137, y: 1103 },
    ]

    for (const campo of campos) {
      // As duas camadas são renderizadas com esta única string.
      const transform = transformCss(campo)
      expect(transform).toBe(transformCss(campo))

      for (const ponto of pontos) {
        const naBase = paraCoordenadaDaTela(campo, ponto)
        const noOverlay = paraCoordenadaDaTela(campo, ponto)
        expect(noOverlay.x).toBe(naBase.x)
        expect(noOverlay.y).toBe(naBase.y)
      }
    }
  })

  it('mantém o alinhamento mesmo se o overlay for medido em outro viewport', () => {
    // Simula o mesmo campo sendo aplicado em telas diferentes: o que muda é o
    // contêiner, não a relação entre as camadas.
    const viewports = [
      { largura: 360, altura: 640 },
      { largura: 1440, altura: 900 },
      { largura: 2560, altura: 1440 },
    ]
    for (const vp of viewports) {
      const campo = campoDeAjuste(IMAGEM, vp)
      const canto = paraCoordenadaDaTela(campo, { x: IMAGEM.largura, y: IMAGEM.altura })
      const cantoOverlay = paraCoordenadaDaTela(campo, { x: IMAGEM.largura, y: IMAGEM.altura })
      expect(canto).toEqual(cantoOverlay)
      // E a imagem inteira cabe: o canto oposto nunca ultrapassa o contêiner.
      expect(canto.x).toBeLessThanOrEqual(vp.largura + 1e-9)
      expect(canto.y).toBeLessThanOrEqual(vp.altura + 1e-9)
    }
  })
})

describe('zoom', () => {
  it('mantém sob o cursor o ponto da lâmina que estava sob o cursor', () => {
    const campo = campoDeAjuste(IMAGEM, CONTAINER)
    const foco = { x: 610, y: 340 }
    const antes = paraCoordenadaDaImagem(campo, foco)

    const ampliado = aplicarZoom(campo, foco, campo.escala * 4, IMAGEM, CONTAINER)
    const depois = paraCoordenadaDaImagem(ampliado, foco)

    expect(depois.x).toBeCloseTo(antes.x, 6)
    expect(depois.y).toBeCloseTo(antes.y, 6)
  })

  it('respeita os limites mínimo e máximo', () => {
    const campo = campoDeAjuste(IMAGEM, CONTAINER)
    const limite = limitesDeEscala(IMAGEM, CONTAINER)
    const foco = { x: 400, y: 450 }

    expect(aplicarZoom(campo, foco, 1e-6, IMAGEM, CONTAINER).escala).toBeCloseTo(limite.minima, 10)
    expect(aplicarZoom(campo, foco, 1e6, IMAGEM, CONTAINER).escala).toBeCloseTo(limite.maxima, 10)
  })
})

describe('limites de deslocamento', () => {
  it('centraliza quando a imagem escalada é menor que o contêiner', () => {
    const campo = centralizar({ escala: 0.1, x: 9999, y: -9999 }, IMAGEM, CONTAINER)
    expect(campo.x).toBeCloseTo((800 - 192) / 2, 10)
    expect(campo.y).toBeCloseTo((900 - 128) / 2, 10)
  })

  it('não deixa sobrar faixa vazia quando a imagem é maior que o contêiner', () => {
    const escala = 2
    const arrastadoDemais = deslocar({ escala, x: 0, y: 0 }, { x: 500, y: 500 }, IMAGEM, CONTAINER)
    // Puxar para a direita não pode revelar vazio à esquerda.
    expect(arrastadoDemais.x).toBe(0)
    expect(arrastadoDemais.y).toBe(0)

    const outroLado = deslocar({ escala, x: 0, y: 0 }, { x: -99999, y: -99999 }, IMAGEM, CONTAINER)
    expect(outroLado.x).toBeCloseTo(CONTAINER.largura - IMAGEM.largura * escala, 10)
    expect(outroLado.y).toBeCloseTo(CONTAINER.altura - IMAGEM.altura * escala, 10)
  })
})

describe('objetivos', () => {
  it('guarda entre si as proporções reais 1 : 2,5 : 10 : 25', () => {
    expect(OBJETIVOS.map((o) => o.fator)).toEqual([1, 2.5, 10, 25])
  })

  it('mantém no centro a estrutura que estava no centro ao trocar de objetivo', () => {
    const inicial = campoDeAjuste(IMAGEM, CONTAINER)
    const centro = { x: CONTAINER.largura / 2, y: CONTAINER.altura / 2 }
    const antes = paraCoordenadaDaImagem(inicial, centro)

    const dezVezes = aplicarObjetivo(inicial, OBJETIVOS[1], IMAGEM, CONTAINER)
    const depois = paraCoordenadaDaImagem(dezVezes, centro)

    expect(depois.x).toBeCloseTo(antes.x, 6)
    expect(depois.y).toBeCloseTo(antes.y, 6)
  })

  it('identifica o objetivo mais próximo da escala atual', () => {
    const ajuste = campoDeAjuste(IMAGEM, CONTAINER)
    expect(objetivoAtual(ajuste, IMAGEM, CONTAINER).id).toBe('4x')
    const grande = aplicarObjetivo(ajuste, OBJETIVOS[2], IMAGEM, CONTAINER)
    expect(objetivoAtual(grande, IMAGEM, CONTAINER).id).toBe('40x')
  })
})

describe('enquadramento', () => {
  it('centraliza o alvo pedido', () => {
    const alvo = { x: 400, y: 300, largura: 200, altura: 150 }
    const campo = enquadrar(alvo, IMAGEM, CONTAINER)
    const centroDoAlvoNaTela = paraCoordenadaDaTela(campo, {
      x: alvo.x + alvo.largura / 2,
      y: alvo.y + alvo.altura / 2,
    })
    expect(centroDoAlvoNaTela.x).toBeCloseTo(CONTAINER.largura / 2, 6)
    expect(centroDoAlvoNaTela.y).toBeCloseTo(CONTAINER.altura / 2, 6)
  })

  it('devolve o ajuste quando o alvo é degenerado', () => {
    const campo = enquadrar({ x: 0, y: 0, largura: 0, altura: 0 }, IMAGEM, CONTAINER)
    expect(campo).toEqual(campoDeAjuste(IMAGEM, CONTAINER))
  })
})

describe('minimapa', () => {
  it('mostra a lâmina inteira no ajuste', () => {
    const janela = janelaVisivel(campoDeAjuste(IMAGEM, CONTAINER), IMAGEM, CONTAINER)
    expect(janela.esquerda).toBeCloseTo(0, 6)
    expect(janela.largura).toBeCloseTo(1, 6)
  })

  it('nunca escapa do intervalo 0–1', () => {
    const campo = aplicarZoom(
      campoDeAjuste(IMAGEM, CONTAINER),
      { x: 10, y: 10 },
      99,
      IMAGEM,
      CONTAINER,
    )
    const janela = janelaVisivel(campo, IMAGEM, CONTAINER)
    for (const v of [janela.esquerda, janela.topo, janela.largura, janela.altura]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})

describe('escala em micrômetros', () => {
  /**
   * A regra mais importante do módulo: o acervo não traz calibração, então a
   * barra de escala **não pode existir**. Se este teste algum dia falhar,
   * alguém passou a inventar µm/px a partir do objetivo nominal.
   */
  it('devolve null sem calibração comprovada', () => {
    const campo = campoDeAjuste(IMAGEM, CONTAINER)
    expect(larguraDaBarraEmMicrometros(campo, undefined, 120)).toBeNull()
  })

  it('arredonda para 1, 2 ou 5 vezes uma potência de dez quando há calibração', () => {
    const campo: Campo = { escala: 1, x: 0, y: 0 }
    const barra = larguraDaBarraEmMicrometros(campo, { micrometrosPorPixel: 0.5 }, 120)
    expect(barra).not.toBeNull()
    const mantissa = barra!.micrometros / Math.pow(10, Math.floor(Math.log10(barra!.micrometros)))
    expect([1, 2, 5, 10]).toContain(Math.round(mantissa * 1000) / 1000)
  })
})
