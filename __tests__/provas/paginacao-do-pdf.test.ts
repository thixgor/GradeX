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
