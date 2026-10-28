import { describe, expect, it } from 'vitest'
import jsPDF from 'jspdf'

import { criarFolha, desenharCartaoDeTitulo } from '@/lib/pdf/folha'
import { quebrarComLimite } from '@/lib/pdf/marca'
import { analisarTrechos, quebrarTexto } from '@/lib/pdf/texto'

/**
 * "Coisas saindo da tela do PDF": o texto que o jsPDF desenha além da margem
 * some sem aviso. Estes testes medem cada linha quebrada com a fonte em que
 * ela será DESENHADA e cobram que caiba na largura pedida.
 */

/** A largura real de uma linha com `**negrito**`, trecho a trecho. */
function larguraDesenhada(doc: jsPDF, linha: string): number {
  let largura = 0
  for (const trecho of analisarTrechos(linha)) {
    doc.setFont('helvetica', trecho.estilo)
    largura += doc.getTextWidth(trecho.texto)
  }
  doc.setFont('helvetica', 'normal')
  return largura
}

describe('o texto quebrado cabe na largura', () => {
  it('parte uma palavra mais larga que a linha (link, sequência colada)', () => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const linhas = quebrarTexto(doc, `veja ${'https://exemplo.com/'.repeat(20)} aqui`, 80)
    expect(linhas.length).toBeGreaterThan(2)
    for (const linha of linhas) expect(larguraDesenhada(doc, linha)).toBeLessThanOrEqual(80.01)
  })

  it('mede o negrito como negrito — mais largo que o normal', () => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const texto = Array.from({ length: 30 }, (_, i) => (i % 2 ? `**palavra${i}**` : `termo${i}`)).join(' ')
    for (const linha of quebrarTexto(doc, texto, 70)) {
      expect(larguraDesenhada(doc, linha)).toBeLessThanOrEqual(70.01)
    }
  })

  it('o título com limite de linhas termina em reticências e não passa da largura', () => {
    const doc = new jsPDF()
    doc.setFontSize(17)
    const titulo = 'N1 SOI I — Sistema Cardiovascular, Respiratório e Renal — Avaliação Somativa Integrada '.repeat(4)
    const linhas = quebrarComLimite(doc, titulo, 150, 3)
    expect(linhas).toHaveLength(3)
    expect(linhas[2].endsWith('...')).toBe(true)
    for (const linha of linhas) expect(doc.getTextWidth(linha)).toBeLessThanOrEqual(150.01)
  })
})

describe('cartão de título', () => {
  it('cresce com o título, mas até um teto — nunca empurra a página inteira', () => {
    const doc = new jsPDF()
    const folha = criarFolha(doc, 'helvetica', null, 'Prova')
    const inicio = folha.y
    desenharCartaoDeTitulo(folha, {
      titulo: 'Título enorme de prova '.repeat(30),
      descricao: 'Descrição longa da prova. '.repeat(40),
      chips: ['17 questões', '240 min', '100 pontos', 'Data: 28/10/2026'],
    })
    // Três linhas de título, quatro de descrição e as pílulas: ~70 mm.
    expect(folha.y - inicio).toBeLessThan(80)
    expect(doc.getNumberOfPages()).toBe(1)
  })
})
