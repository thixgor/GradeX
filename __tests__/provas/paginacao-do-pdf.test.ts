import { describe, expect, it } from 'vitest'
import { fatiarCaixaEmPaginas, type MedidasDaCaixa } from '@/lib/pdf/paginacao'

/**
 * As medidas reais da caixa de resposta comentada do relatório com gabarito
 * (`lib/user-report-generator.ts`), em milímetros de A4 retrato.
 */
const MEDIDAS: Omit<MedidasDaCaixa, 'totalDeLinhas' | 'yInicial'> = {
  alturaDaLinha: 5,
  alturaDoTitulo: 14,
  respiroDeContinuacao: 6,
  respiroInferior: 5,
  limiteInferior: 297 - 25,
  yAposQuebra: 40,
}

function fatiar(totalDeLinhas: number, yInicial: number) {
  return fatiarCaixaEmPaginas({ ...MEDIDAS, totalDeLinhas, yInicial })
}

/** Quantas linhas os lotes cobrem, ao todo. */
function linhasCobertas(lotes: ReturnType<typeof fatiar>) {
  return lotes.reduce((soma, lote) => soma + lote.linhas, 0)
}

describe('fatiarCaixaEmPaginas', () => {
  it('não fatia o que cabe de uma vez', () => {
    const lotes = fatiar(10, 60)

    expect(lotes).toHaveLength(1)
    expect(lotes[0]).toMatchObject({ inicio: 0, linhas: 10, novaPagina: false, primeiro: true, y: 60 })
    // 14 de título + 10 linhas de 5 + 5 de respiro.
    expect(lotes[0].altura).toBe(69)
  })

  it('devolve nada quando não há texto', () => {
    expect(fatiar(0, 60)).toEqual([])
  })

  /*
   * O caso que gerou este arquivo. Uma resposta comentada de 60 linhas tem
   * 300mm só de texto — mais que a folha inteira. A versão antiga media a
   * caixa toda, via que não cabia no resto da página, pulava para a próxima e
   * desenhava assim mesmo: o que passava do fim da folha sumia, e o aluno
   * recebia a explicação cortada no meio da frase.
   */
  it('quebra em várias páginas o texto mais alto que a folha, sem perder linha', () => {
    const total = 60
    const lotes = fatiar(total, 200)

    expect(lotes.length).toBeGreaterThan(1)
    expect(linhasCobertas(lotes)).toBe(total)

    // Em ordem, sem buraco e sem repetição: os lotes reconstroem a lista.
    let esperado = 0
    for (const lote of lotes) {
      expect(lote.inicio).toBe(esperado)
      esperado += lote.linhas
    }
    expect(esperado).toBe(total)
  })

  it('mantém toda caixa dentro da área útil da página', () => {
    for (const total of [1, 7, 33, 60, 200]) {
      for (const yInicial of [40, 120, 200, 265]) {
        for (const lote of fatiar(total, yInicial)) {
          expect(lote.y + lote.altura).toBeLessThanOrEqual(MEDIDAS.limiteInferior)
        }
      }
    }
  })

  it('só o primeiro lote leva o título; os seguintes abrem página', () => {
    const lotes = fatiar(60, 200)

    expect(lotes[0].primeiro).toBe(true)
    expect(lotes.slice(1).every(lote => !lote.primeiro)).toBe(true)
    // Um lote continua porque a página acabou — logo, começa numa nova.
    expect(lotes.slice(1).every(lote => lote.novaPagina)).toBe(true)
  })

  it('empurra para a página seguinte a caixa que não caberia no rodapé', () => {
    // Sobram 7mm até o limite: nem o título cabe, quanto mais uma linha.
    const lotes = fatiar(3, MEDIDAS.limiteInferior - 7)

    expect(lotes).toHaveLength(1)
    expect(lotes[0].novaPagina).toBe(true)
    expect(lotes[0].y).toBe(MEDIDAS.yAposQuebra)
  })

  it('não empurra a caixa que ainda cabe justinho', () => {
    // Exatamente o título + uma linha + o respiro de baixo.
    const yInicial = MEDIDAS.limiteInferior - (14 + 5 + 5)
    const lotes = fatiar(1, yInicial)

    expect(lotes[0].novaPagina).toBe(false)
    expect(lotes[0].y).toBe(yInicial)
  })

  /*
   * Página tão baixa que não comporta nem uma linha. Não acontece no A4, mas
   * o laço não pode rodar para sempre por causa disso: cada volta tem de
   * consumir ao menos uma linha da fila.
   */
  it('termina mesmo numa página que não comporta uma linha', () => {
    const lotes = fatiarCaixaEmPaginas({
      ...MEDIDAS,
      limiteInferior: 45,
      totalDeLinhas: 4,
      yInicial: 40,
    })

    expect(linhasCobertas(lotes)).toBe(4)
    expect(lotes.every(lote => lote.linhas >= 1)).toBe(true)
  })
})

/*
 * Os blocos finais são as imagens da resposta comentada. Elas são parte da
 * caixa — desenhadas fora, ficavam penduradas abaixo do retângulo colorido,
 * que é o defeito que este trecho existe para não deixar voltar.
 */
describe('fatiarCaixaEmPaginas com blocos finais', () => {
  function fatiarCom(totalDeLinhas: number, yInicial: number, blocosFinais: number[]) {
    return fatiarCaixaEmPaginas({ ...MEDIDAS, totalDeLinhas, yInicial, blocosFinais })
  }

  /** Os índices dos blocos cobertos, na ordem em que os lotes os levam. */
  function blocosCobertos(lotes: ReturnType<typeof fatiarCom>) {
    return lotes.flatMap(lote => lote.blocos)
  }

  it('soma a altura do bloco à da caixa que o leva', () => {
    const lotes = fatiarCom(4, 60, [40])

    expect(lotes).toHaveLength(1)
    expect(lotes[0].blocos).toEqual([0])
    expect(lotes[0].alturaDosBlocos).toBe(40)
    // 14 de título + 4 linhas de 5 + 40 do bloco + 5 de respiro.
    expect(lotes[0].altura).toBe(14 + 20 + 40 + 5)
  })

  it('nenhum bloco se perde e nenhum se repete', () => {
    for (const yInicial of [40, 120, 200, 265]) {
      const blocos = [60, 45, 80, 30]
      const lotes = fatiarCom(30, yInicial, blocos)
      expect(blocosCobertos(lotes)).toEqual([0, 1, 2, 3])
    }
  })

  it('não fatia um bloco: o que não cabe vai inteiro para a caixa seguinte', () => {
    const lotes = fatiarCom(2, 200, [80])

    expect(lotes.length).toBeGreaterThan(1)
    expect(lotes[0].blocos).toEqual([])
    const ultimo = lotes[lotes.length - 1]
    expect(ultimo.blocos).toEqual([0])
    expect(ultimo.novaPagina).toBe(true)
    expect(ultimo.alturaDosBlocos).toBe(80)
  })

  it('os blocos só entram depois da última linha do texto', () => {
    const lotes = fatiarCom(60, 200, [50])

    for (const lote of lotes.slice(0, -1)) expect(lote.blocos).toEqual([])
    expect(lotes[lotes.length - 1].blocos).toEqual([0])
  })

  it('mantém toda caixa dentro da área útil, também com blocos', () => {
    for (const blocos of [[40], [90, 90], [30, 30, 30, 30], [200]]) {
      for (const total of [0, 1, 33, 60]) {
        for (const yInicial of [40, 120, 200, 265]) {
          for (const lote of fatiarCom(total, yInicial, blocos)) {
            expect(lote.y + lote.altura).toBeLessThanOrEqual(MEDIDAS.limiteInferior)
          }
        }
      }
    }
  })

  it('sem texto, o bloco sozinho ainda ganha a caixa com o título', () => {
    const lotes = fatiarCom(0, 60, [45])

    expect(lotes).toHaveLength(1)
    expect(lotes[0].primeiro).toBe(true)
    expect(lotes[0].linhas).toBe(0)
    expect(lotes[0].altura).toBe(14 + 45 + 5)
  })

  /*
   * Um bloco mais alto do que a folha inteira não cabe em página nenhuma.
   * Empurrá-lo para a seguinte geraria uma folha em branco atrás da outra: ele
   * entra encolhido, e `alturaDosBlocos` diz a quem desenha qual é o espaço.
   */
  it('encolhe o bloco mais alto do que a página em vez de rodar para sempre', () => {
    const lotes = fatiarCom(0, 60, [400])

    expect(lotes).toHaveLength(1)
    expect(lotes[0].blocos).toEqual([0])
    expect(lotes[0].alturaDosBlocos).toBeLessThan(400)
    expect(lotes[0].y + lotes[0].altura).toBeLessThanOrEqual(MEDIDAS.limiteInferior)
  })

  it('devolve nada quando não há texto nem bloco', () => {
    expect(fatiarCom(0, 60, [])).toEqual([])
  })
})
