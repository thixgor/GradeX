/**
 * Quebra de linha e negrito/itálico inline, para todos os PDFs.
 *
 * Havia duas cópias: uma em `lib/pdf-generator.ts` e outra em
 * `lib/user-report-generator.ts`. Elas divergiam em dois pontos que se veem no
 * papel:
 *
 * - Só a primeira descontava o `**` da MEDIÇÃO. Como o marcador não é
 *   desenhado, medir com ele conta quatro caracteres a mais por trecho em
 *   negrito, e a linha quebra antes do necessário — o relatório do aluno saía
 *   com o parágrafo ondulado, mais curto de um lado.
 * - Só a primeira sabia DESENHAR o negrito. No relatório, um
 *   `**Comentário por alternativa**` ia para o papel com os asteriscos.
 *
 * Uma cópia só resolve as duas. `sanitizarParaPdf` continua no funil: sem a
 * Roboto embutida, é o que impede um `≥` perdido de soletrar a linha inteira
 * (ver `lib/pdf/marca.ts`).
 */

import type jsPDF from 'jspdf'
import { sanitizarParaPdf } from './marca'

/** O texto sem os marcadores, que é o que efetivamente vai para a página. */
export function semMarcacao(texto: string): string {
  return texto.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
}

/**
 * Quebra o texto na largura dada, preservando os parágrafos.
 *
 * `\n` e `\nl` (que os importadores de TXT gravam) viram quebra de verdade, e
 * a linha em branco entre parágrafos é preservada: sem isso, um enunciado de
 * caso clínico vira um bloco único.
 */
export function quebrarTexto(doc: jsPDF, texto: string, larguraMaxima: number): string[] {
  if (!texto) return []

  const limpo = sanitizarParaPdf(texto.replace(/\\nl/g, '\n').replace(/\\n/g, '\n'))
  const linhas: string[] = []

  for (const paragrafo of limpo.split(/\n/)) {
    if (paragrafo.trim() === '') {
      linhas.push('')
      continue
    }

    let atual = ''
    for (const palavra of paragrafo.split(' ')) {
      const teste = atual ? `${atual} ${palavra}` : palavra
      // A medição ignora os marcadores porque eles não são desenhados.
      if (doc.getTextWidth(semMarcacao(teste)) > larguraMaxima && atual) {
        linhas.push(atual)
        atual = palavra
      } else {
        atual = teste
      }
    }
    if (atual) linhas.push(atual)
  }

  return linhas
}

/**
 * Desenha uma linha com `**negrito**` e `*itálico*` inline.
 *
 * O caminho rápido (linha sem `*`) é uma chamada só de `doc.text` — a esmagadora
 * maioria das linhas de uma prova, e o que mantém o custo do arquivo igual ao
 * de antes.
 */
export function desenharLinhaRica(
  doc: jsPDF,
  fonte: string,
  linha: string,
  x: number,
  y: number,
  estiloBase: 'normal' | 'bold' | 'italic' = 'normal',
): void {
  if (!linha.includes('*')) {
    doc.setFont(fonte, estiloBase)
    doc.text(linha, x, y)
    return
  }

  const marcadores = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let ultimo = 0
  let cursor = x
  let achado: RegExpExecArray | null

  while ((achado = marcadores.exec(linha)) !== null) {
    if (achado.index > ultimo) {
      const simples = linha.slice(ultimo, achado.index)
      doc.setFont(fonte, estiloBase)
      doc.text(simples, cursor, y)
      cursor += doc.getTextWidth(simples)
    }
    const trecho = achado[1] !== undefined ? achado[1] : achado[2]
    const estilo: 'bold' | 'italic' = achado[1] !== undefined ? 'bold' : 'italic'
    doc.setFont(fonte, estilo)
    doc.text(trecho, cursor, y)
    cursor += doc.getTextWidth(trecho)
    ultimo = marcadores.lastIndex
  }

  if (ultimo < linha.length) {
    doc.setFont(fonte, estiloBase)
    doc.text(linha.slice(ultimo), cursor, y)
  }
  doc.setFont(fonte, estiloBase)
}

