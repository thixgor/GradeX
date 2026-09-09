import { describe, expect, it } from 'vitest'
import { endireitarGrifo } from '@/components/inline-annotation-canvas'

/**
 * O endireitamento do marca-texto.
 *
 * Ninguém arrasta o dedo (nem o mouse) em linha reta sobre uma frase: o traço
 * sai ondulado, invade a linha de cima e deixa o grifo com cara de rabisco.
 * Quando o gesto é claramente horizontal, ele vira uma faixa reta na altura
 * média — e só então: um círculo, uma diagonal ou uma marcação vertical na
 * margem são gestos deliberados e passam intactos.
 */

/** Um arrastão da esquerda para a direita, com a tremida de uma mão real. */
function grifoTremido(): { x: number; y: number }[] {
  const pontos = []
  for (let x = 0; x <= 300; x += 10) {
    pontos.push({ x, y: 100 + Math.sin(x / 20) * 4 })
  }
  return pontos
}

const ESPESSURA = 22

describe('endireitarGrifo', () => {
  it('achata o arrastão horizontal tremido numa faixa reta', () => {
    const reto = endireitarGrifo(grifoTremido(), ESPESSURA)
    expect(reto).toHaveLength(2)
    expect(reto[0].y).toBeCloseTo(reto[1].y, 6)
    expect(reto[0].x).toBe(0)
    expect(reto[1].x).toBe(300)
  })

  it('a faixa fica na altura MÉDIA do gesto, não na do primeiro ponto', () => {
    // Um traço que desce de 100 para 116 ao longo da linha — dentro do que uma
    // faixa de 22px cobre. A faixa sai no meio, e não colada no começo (que
    // jogaria o grifo para fora do texto).
    const descendo = [
      { x: 0, y: 100 },
      { x: 100, y: 105 },
      { x: 200, y: 111 },
      { x: 300, y: 116 },
    ]
    const reto = endireitarGrifo(descendo, ESPESSURA)
    expect(reto).toHaveLength(2)
    expect(reto[0].y).toBeCloseTo(108, 6)
  })

  it('não mexe numa diagonal: quem grifou na diagonal quis a diagonal', () => {
    const diagonal = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 200, y: 200 },
    ]
    expect(endireitarGrifo(diagonal, ESPESSURA)).toEqual(diagonal)
  })

  it('não mexe num círculo em volta de uma palavra', () => {
    const circulo = Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2
      return { x: 150 + Math.cos(a) * 60, y: 150 + Math.sin(a) * 60 }
    })
    expect(endireitarGrifo(circulo, ESPESSURA)).toEqual(circulo)
  })

  it('não mexe numa marcação vertical na margem', () => {
    const vertical = [
      { x: 20, y: 0 },
      { x: 22, y: 60 },
      { x: 21, y: 120 },
    ]
    expect(endireitarGrifo(vertical, ESPESSURA)).toEqual(vertical)
  })

  it('um toque (ou um traço curto) fica como está — não dá para adivinhar a intenção', () => {
    const toque = [{ x: 10, y: 10 }]
    expect(endireitarGrifo(toque, ESPESSURA)).toEqual(toque)

    const curto = [
      { x: 10, y: 10 },
      { x: 20, y: 11 },
    ]
    expect(endireitarGrifo(curto, ESPESSURA)).toEqual(curto)
  })

  it('a tolerância acompanha a espessura: marcador grosso, mão mais trêmula', () => {
    // 12px de variação vertical em 300px de largura.
    const tremida = [
      { x: 0, y: 100 },
      { x: 150, y: 112 },
      { x: 300, y: 104 },
    ]
    // Com um marcador fino (10px) 12px de desvio é um gesto, não tremor.
    expect(endireitarGrifo(tremida, 10)).toEqual(tremida)
    // Com um marcador de 22px, cabe dentro da própria faixa: é a mesma linha.
    expect(endireitarGrifo(tremida, 22)).toHaveLength(2)
  })
})
