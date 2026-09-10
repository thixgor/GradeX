import { describe, expect, it } from 'vitest'
import {
  ESPACO_ACIMA_DAS_IMAGENS,
  desenharCaixaDeRespostaComentada,
  type CaixaDeRespostaComentada,
} from '@/lib/pdf/caixa-de-resposta-comentada'
import type { LinhaDeImagens } from '@/lib/pdf/imagens-de-questao'

/**
 * O bug: a imagem da resposta comentada saía FORA do retângulo colorido.
 *
 * O texto do comentário era fatiado em páginas e desenhado dentro da caixa; as
 * imagens vinham depois, num desenho solto, já com o retângulo fechado. No
 * papel a figura ficava pendurada abaixo da caixa, sem nada em volta.
 *
 * Estes testes olham a geometria: onde o `roundedRect` foi pintado e onde o
 * `addImage` caiu. A regra é uma só — toda imagem tem de estar dentro de
 * alguma caixa.
 */

interface Retangulo {
  x: number
  y: number
  largura: number
  altura: number
}

/** As medidas reais da caixa verde do gabarito comentado, em mm de A4. */
const MEDIDAS = {
  alturaDaLinha: 6,
  alturaDoTitulo: 14,
  respiroDeContinuacao: 4,
  respiroInferior: 5,
  recuo: 4,
  corpoDoTitulo: 8.5,
  baseDoTitulo: 9,
  corpoDoTexto: 9,
}

const LIMITE_INFERIOR = 297 - 25
const Y_APOS_QUEBRA = 40

function montarCena() {
  const caixas: Retangulo[] = []
  const imagens: Retangulo[] = []
  let paginas = 1

  const doc = {
    setFillColor() {},
    setDrawColor() {},
    setLineWidth() {},
    setFontSize() {},
    setFont() {},
    setTextColor() {},
    text() {},
    roundedRect(x: number, y: number, largura: number, altura: number) {
      caixas.push({ x, y, largura, altura })
    },
  }

  const desenhar = (opcoes: {
    linhas: string[]
    imagens: LinhaDeImagens[]
    y: number
  }): number =>
    desenharCaixaDeRespostaComentada({
      doc: doc as unknown as CaixaDeRespostaComentada['doc'],
      fonte: 'helvetica',
      x: 20,
      largura: 170,
      y: opcoes.y,
      limiteInferior: LIMITE_INFERIOR,
      yAposQuebra: Y_APOS_QUEBRA,
      novaPagina: () => {
        paginas += 1
      },
      linhas: opcoes.linhas,
      imagens: opcoes.imagens,
      titulo: 'Resposta Comentada:',
      cores: { fundo: [245, 250, 246], borda: [70, 129, 82], titulo: [26, 71, 42], texto: [60, 60, 60] },
      medidas: MEDIDAS,
      desenharLinha: () => {},
    })

  return { caixas, imagens, desenhar, paginas: () => paginas }
}

/**
 * Uma linha de imagens medida, que registra onde foi desenhada.
 *
 * É o mesmo contrato de `medirLinhasDeImagens`: altura conhecida antes do
 * desenho, e um `desenhar` que aceita escala.
 */
function linhaDeImagens(
  registro: Retangulo[],
  alturaDasImagens: number,
  alturaDasLegendas = 0,
): LinhaDeImagens {
  return {
    alturaDasImagens,
    alturaDasLegendas,
    altura: alturaDasImagens + alturaDasLegendas,
    desenhar: (x, y, escala = 1) => {
      registro.push({ x, y, largura: 120 * escala, altura: alturaDasImagens * escala })
    },
  }
}

/** Se o retângulo `dentro` cabe inteiro em `fora` (com folga de arredondamento). */
function estaDentro(dentro: Retangulo, fora: Retangulo) {
  const folga = 0.01
  return (
    dentro.x >= fora.x - folga &&
    dentro.y >= fora.y - folga &&
    dentro.x + dentro.largura <= fora.x + fora.largura + folga &&
    dentro.y + dentro.altura <= fora.y + fora.altura + folga
  )
}

describe('a imagem da resposta comentada fica dentro do retângulo colorido', () => {
  it('a caixa cresce para envolver a imagem que vem depois do texto', () => {
    const cena = montarCena()
    const imagem = linhaDeImagens(cena.imagens, 50)

    cena.desenhar({ linhas: ['uma', 'duas', 'três'], imagens: [imagem], y: 60 })

    expect(cena.caixas).toHaveLength(1)
    expect(cena.imagens).toHaveLength(1)
    expect(estaDentro(cena.imagens[0], cena.caixas[0])).toBe(true)

    // 14 de título + 3 linhas de 6 + o respiro acima da figura + 50 dela + 5.
    expect(cena.caixas[0].altura).toBe(14 + 18 + ESPACO_ACIMA_DAS_IMAGENS + 50 + 5)
  })

  it('a legenda da figura também entra na conta da altura', () => {
    const cena = montarCena()

    cena.desenhar({ linhas: ['uma'], imagens: [linhaDeImagens(cena.imagens, 40, 9)], y: 60 })

    expect(cena.caixas[0].altura).toBe(14 + 6 + ESPACO_ACIMA_DAS_IMAGENS + 49 + 5)
  })

  it('a imagem respeita o recuo do conteúdo, não a borda da caixa', () => {
    const cena = montarCena()

    cena.desenhar({ linhas: ['uma'], imagens: [linhaDeImagens(cena.imagens, 30)], y: 60 })

    expect(cena.imagens[0].x).toBe(20 + MEDIDAS.recuo)
  })

  /*
   * O caso que o relato descreve: a figura não cabe no que sobrou da página.
   * Antes ela era desenhada solta ali mesmo, ou empurrada para a página
   * seguinte sem caixa nenhuma em volta.
   */
  it('leva a figura que não cabe para uma caixa de continuação na página seguinte', () => {
    const cena = montarCena()
    const imagem = linhaDeImagens(cena.imagens, 80)

    cena.desenhar({ linhas: ['uma', 'duas'], imagens: [imagem], y: 200 })

    expect(cena.paginas()).toBe(2)
    expect(cena.caixas.length).toBeGreaterThan(1)
    expect(cena.imagens).toHaveLength(1)
    // A caixa de continuação abre no topo da página nova, e a figura está nela.
    const continuacao = cena.caixas[cena.caixas.length - 1]
    expect(continuacao.y).toBe(Y_APOS_QUEBRA)
    expect(estaDentro(cena.imagens[0], continuacao)).toBe(true)
  })

  it('sem texto nenhum, a figura ainda sai numa caixa com o título', () => {
    const cena = montarCena()

    cena.desenhar({ linhas: [], imagens: [linhaDeImagens(cena.imagens, 45)], y: 60 })

    expect(cena.caixas).toHaveLength(1)
    expect(cena.caixas[0].altura).toBe(14 + ESPACO_ACIMA_DAS_IMAGENS + 45 + 5)
    expect(estaDentro(cena.imagens[0], cena.caixas[0])).toBe(true)
  })

  it('várias figuras, e todas dentro de alguma caixa', () => {
    const cena = montarCena()
    const imagens = [
      linhaDeImagens(cena.imagens, 70, 5),
      linhaDeImagens(cena.imagens, 90),
      linhaDeImagens(cena.imagens, 60, 9),
    ]

    cena.desenhar({ linhas: Array.from({ length: 40 }, (_, i) => `linha ${i}`), imagens, y: 120 })

    expect(cena.imagens).toHaveLength(3)
    for (const imagem of cena.imagens) {
      expect(cena.caixas.some(caixa => estaDentro(imagem, caixa))).toBe(true)
    }
    for (const caixa of cena.caixas) {
      expect(caixa.y + caixa.altura).toBeLessThanOrEqual(LIMITE_INFERIOR + 0.01)
    }
  })

  /*
   * Uma radiografia em pé, mais alta do que a folha inteira. Não há página que
   * a comporte: ela encolhe até caber na caixa, que é melhor do que sair pela
   * borda do retângulo (o jsPDF não recorta nem avisa).
   */
  it('encolhe a figura mais alta do que a página em vez de deixá-la vazar', () => {
    const cena = montarCena()

    cena.desenhar({ linhas: [], imagens: [linhaDeImagens(cena.imagens, 400)], y: 60 })

    expect(cena.caixas).toHaveLength(1)
    expect(cena.imagens).toHaveLength(1)
    expect(cena.imagens[0].altura).toBeLessThan(400)
    expect(estaDentro(cena.imagens[0], cena.caixas[0])).toBe(true)
    expect(cena.caixas[0].y + cena.caixas[0].altura).toBeLessThanOrEqual(LIMITE_INFERIOR + 0.01)
  })

  it('devolve o y da borda de baixo da última caixa', () => {
    const cena = montarCena()

    const y = cena.desenhar({ linhas: ['uma'], imagens: [linhaDeImagens(cena.imagens, 30)], y: 60 })

    const ultima = cena.caixas[cena.caixas.length - 1]
    expect(y).toBe(ultima.y + ultima.altura)
  })

  it('não desenha caixa nenhuma quando não há comentário nem figura', () => {
    const cena = montarCena()

    expect(cena.desenhar({ linhas: [], imagens: [], y: 60 })).toBe(60)
    expect(cena.caixas).toHaveLength(0)
  })
})
