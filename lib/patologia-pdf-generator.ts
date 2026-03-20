import jsPDF from 'jspdf'
import { Patologia } from './types/manual-clinico'

// Cores da paleta DomineAqui
const VERDE_ESCURO = [26, 71, 42] as const
const VERDE_MEDIO = [70, 129, 82] as const
const LARANJA = [226, 164, 62] as const
const CINZA_TEXTO = [51, 51, 51] as const
const CINZA_CLARO = [245, 245, 245] as const
const CINZA_MEDIO = [200, 200, 200] as const
const BRANCO = [255, 255, 255] as const

const MARGIN = 15
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const FOOTER_SPACE = 22
const LINE_HEIGHT = 4.5
const PARAGRAPH_GAP = 2.5

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return []
  const paragraphs = text.split(/\n/)
  const allLines: string[] = []
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      allLines.push('')
      continue
    }
    const words = paragraph.split(' ')
    let currentLine = ''
    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word
      if (doc.getTextWidth(testLine) > maxWidth && currentLine) {
        allLines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) allLines.push(currentLine)
  }
  return allLines
}

function addHeader(doc: jsPDF, patologia: Patologia) {
  // Barra superior verde escuro
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, PAGE_WIDTH, 30, 'F')

  // Detalhe laranja
  doc.setFillColor(...LARANJA)
  doc.rect(PAGE_WIDTH - 65, 0, 65, 30, 'F')

  // Título
  doc.setTextColor(...BRANCO)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('DomineAqui', MARGIN, 13)

  // Subtítulo
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Manual Cl\u00ednico', MARGIN, 21)

  // URL no canto laranja
  doc.setFontSize(8)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('www.domineaqui.com.br', PAGE_WIDTH - 62, 18)

  return 40
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const footerY = PAGE_HEIGHT - 12

  doc.setFillColor(...CINZA_CLARO)
  doc.rect(0, footerY - 5, PAGE_WIDTH, 17, 'F')

  // Linha decorativa
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(1)
  doc.line(0, footerY - 5, PAGE_WIDTH * 0.7, footerY - 5)
  doc.setDrawColor(...LARANJA)
  doc.line(PAGE_WIDTH * 0.7, footerY - 5, PAGE_WIDTH, footerY - 5)

  doc.setFontSize(8)
  doc.setTextColor(70, 70, 70)
  doc.setFont('helvetica', 'bold')
  doc.text('DomineAqui', MARGIN, footerY + 2)
  doc.setFont('helvetica', 'normal')
  doc.text(' - Manual Cl\u00ednico', MARGIN + doc.getTextWidth('DomineAqui') + 1, footerY + 2)

  doc.text(`P\u00e1gina ${pageNum} de ${totalPages}`, PAGE_WIDTH - MARGIN, footerY + 2, { align: 'right' })

  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(`Gerado em ${dataGeracao}`, PAGE_WIDTH / 2, footerY + 2, { align: 'center' })
}

function ensureSpace(doc: jsPDF, y: number, needed: number, patologia: Patologia): number {
  if (y + needed > PAGE_HEIGHT - FOOTER_SPACE) {
    doc.addPage()
    return addHeader(doc, patologia)
  }
  return y
}

function drawSectionTitle(doc: jsPDF, title: string, y: number, patologia: Patologia): number {
  y = ensureSpace(doc, y, 16, patologia)

  // Barra verde à esquerda + fundo cinza claro
  doc.setFillColor(...CINZA_CLARO)
  doc.rect(MARGIN, y - 5, CONTENT_WIDTH, 10, 'F')
  doc.setFillColor(...VERDE_MEDIO)
  doc.rect(MARGIN, y - 5, 3, 10, 'F')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(title, MARGIN + 7, y + 2)

  return y + 14
}

function drawTextBlock(doc: jsPDF, text: string, y: number, patologia: Patologia, fontSize: number = 9): number {
  if (!text) return y

  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...CINZA_TEXTO)

  const lines = wrapText(doc, text, CONTENT_WIDTH - 6)
  for (const line of lines) {
    y = ensureSpace(doc, y, LINE_HEIGHT + 1, patologia)
    if (line === '') {
      y += PARAGRAPH_GAP
    } else {
      doc.text(line, MARGIN + 3, y)
      y += LINE_HEIGHT
    }
  }
  return y + PARAGRAPH_GAP
}

function drawLabelValue(doc: jsPDF, label: string, value: string, y: number, patologia: Patologia): number {
  if (!value) return y

  // Draw the label
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)

  const labelText = label + ': '
  const labelWidth = doc.getTextWidth(labelText)
  const availableForValue = CONTENT_WIDTH - 8 - labelWidth

  // If value fits on same line as label
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  const valueWidth = doc.getTextWidth(value)

  if (valueWidth <= availableForValue) {
    y = ensureSpace(doc, y, LINE_HEIGHT + 1, patologia)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...VERDE_ESCURO)
    doc.text(labelText, MARGIN + 4, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    doc.text(value, MARGIN + 4 + labelWidth, y)
    return y + LINE_HEIGHT
  }

  // Value needs wrapping — label on its own line, value below
  y = ensureSpace(doc, y, LINE_HEIGHT * 2 + 1, patologia)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(labelText, MARGIN + 4, y)
  y += LINE_HEIGHT

  // Wrap the value text
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  const wrappedLines = wrapText(doc, value, CONTENT_WIDTH - 10)
  for (const line of wrappedLines) {
    y = ensureSpace(doc, y, LINE_HEIGHT + 1, patologia)
    doc.text(line, MARGIN + 6, y)
    y += LINE_HEIGHT
  }

  return y + 1
}

function drawFarmacoBlock(doc: jsPDF, farmaco: any, y: number, patologia: Patologia): number {
  // Estimate how much space we need (minimum)
  y = ensureSpace(doc, y, 20, patologia)

  const startY = y

  // Farmaco name
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(farmaco.medicamento || 'Sem nome', MARGIN + 6, y)

  if (farmaco.classe) {
    const nameWidth = doc.getTextWidth(farmaco.medicamento + '  ')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    const classeText = `(${farmaco.classe})`
    const availableWidth = CONTENT_WIDTH - 10 - nameWidth
    if (doc.getTextWidth(classeText) <= availableWidth) {
      doc.text(classeText, MARGIN + 6 + nameWidth, y)
    } else {
      y += LINE_HEIGHT
      doc.text(classeText, MARGIN + 6, y)
    }
  }
  y += LINE_HEIGHT + 1

  // Reset font for fields
  doc.setFontSize(9)

  if (farmaco.mecanismo_acao) {
    y = drawLabelValue(doc, 'Mecanismo', farmaco.mecanismo_acao, y, patologia)
  }
  if (farmaco.dose_usual) {
    y = drawLabelValue(doc, 'Dose usual', farmaco.dose_usual, y, patologia)
  }
  if (farmaco.efeitos_colaterais?.length > 0) {
    y = drawLabelValue(doc, 'Efeitos colaterais', farmaco.efeitos_colaterais.join('; '), y, patologia)
  }
  if (farmaco.contraindicacoes?.length > 0) {
    y = drawLabelValue(doc, 'Contraindica\u00e7\u00f5es', farmaco.contraindicacoes.join('; '), y, patologia)
  }

  // Draw card border around everything we just drew
  const cardHeight = y - startY + 3
  doc.setDrawColor(...CINZA_MEDIO)
  doc.setLineWidth(0.3)
  doc.setFillColor(252, 252, 252)
  // We need to draw the border BEHIND the text, but jsPDF doesn't support z-order
  // So we draw a left accent bar instead
  doc.setFillColor(...VERDE_MEDIO)
  doc.rect(MARGIN + 2, startY - 4, 2, cardHeight, 'F')
  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.2)
  doc.line(MARGIN + 2, startY - 4, MARGIN + CONTENT_WIDTH - 2, startY - 4)
  doc.line(MARGIN + 2, startY - 4 + cardHeight, MARGIN + CONTENT_WIDTH - 2, startY - 4 + cardHeight)

  return y + 5
}

export function generatePatologiaPDF(patologia: Patologia): Blob {
  const doc = new jsPDF()
  let y = addHeader(doc, patologia)

  // === TÍTULO DA PATOLOGIA ===
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  const titleLines = wrapText(doc, patologia.nome, CONTENT_WIDTH)
  for (const line of titleLines) {
    doc.text(line, MARGIN, y)
    y += 8
  }
  y += 1

  // Sinônimos
  if (patologia.sinonimos?.length > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    const sinLines = wrapText(doc, patologia.sinonimos.join(' \u2022 '), CONTENT_WIDTH)
    for (const line of sinLines) {
      doc.text(line, MARGIN, y)
      y += LINE_HEIGHT
    }
    y += 1
  }

  // Badges: CID-10, Áreas, Sistema
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  let badgeX = MARGIN

  // CID-10 badge
  if (patologia.cid10) {
    doc.setFillColor(...VERDE_ESCURO)
    const cidText = `CID-10: ${patologia.cid10}`
    const cidWidth = doc.getTextWidth(cidText) + 6
    doc.roundedRect(badgeX, y - 3, cidWidth, 5.5, 1.5, 1.5, 'F')
    doc.setTextColor(...BRANCO)
    doc.text(cidText, badgeX + 3, y + 0.5)
    badgeX += cidWidth + 3
  }

  // Area badges
  const areaColors: Record<string, [number, number, number]> = {
    'Medicina': [59, 130, 246],
    'Psicologia': [147, 51, 234],
    'Odontologia': [16, 185, 129],
    'Biomedicina': [249, 115, 22],
  }
  for (const area of patologia.areas || []) {
    const color = areaColors[area] || VERDE_MEDIO
    doc.setFillColor(...color)
    const areaText = area
    const areaWidth = doc.getTextWidth(areaText) + 6
    // Wrap to next line if needed
    if (badgeX + areaWidth > PAGE_WIDTH - MARGIN) {
      y += 7
      badgeX = MARGIN
    }
    doc.roundedRect(badgeX, y - 3, areaWidth, 5.5, 1.5, 1.5, 'F')
    doc.setTextColor(...BRANCO)
    doc.text(areaText, badgeX + 3, y + 0.5)
    badgeX += areaWidth + 3
  }
  y += 6

  // Sistema
  if (patologia.sistema) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(patologia.sistema, MARGIN, y)
    y += 6
  }

  // Linha separadora
  doc.setDrawColor(...LARANJA)
  doc.setLineWidth(0.8)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 8

  // === SEÇÕES DE CONTEÚDO ===

  if (patologia.classificacao) {
    y = drawSectionTitle(doc, 'Classifica\u00e7\u00e3o', y, patologia)
    y = drawTextBlock(doc, patologia.classificacao, y, patologia)
  }

  if (patologia.fisiopatologia) {
    y = drawSectionTitle(doc, 'Fisiopatologia', y, patologia)
    y = drawTextBlock(doc, patologia.fisiopatologia, y, patologia)
  }

  if (patologia.diagnostico_semiologico) {
    y = drawSectionTitle(doc, 'Diagn\u00f3stico Semiol\u00f3gico', y, patologia)
    y = drawTextBlock(doc, patologia.diagnostico_semiologico, y, patologia)
  }

  if (patologia.diagnosticos_diferenciais) {
    y = drawSectionTitle(doc, 'Diagn\u00f3sticos Diferenciais', y, patologia)
    y = drawTextBlock(doc, patologia.diagnosticos_diferenciais, y, patologia)
  }

  if (patologia.gravidade) {
    y = drawSectionTitle(doc, 'Gravidade', y, patologia)
    y = drawTextBlock(doc, patologia.gravidade, y, patologia)
  }

  if (patologia.tratamento) {
    y = drawSectionTitle(doc, 'Tratamento', y, patologia)
    y = drawTextBlock(doc, patologia.tratamento, y, patologia)
  }

  // === FARMACOLOGIA ===
  const farma = patologia.farmacologia
  if (farma) {
    if (farma.primeira_linha?.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 1\u00aa Linha', y, patologia)
      for (const f of farma.primeira_linha) {
        y = drawFarmacoBlock(doc, f, y, patologia)
      }
    }
    if (farma.segunda_linha?.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 2\u00aa Linha', y, patologia)
      for (const f of farma.segunda_linha) {
        y = drawFarmacoBlock(doc, f, y, patologia)
      }
    }
    if (farma.terceira_linha && farma.terceira_linha.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 3\u00aa Linha', y, patologia)
      for (const f of farma.terceira_linha) {
        y = drawFarmacoBlock(doc, f, y, patologia)
      }
    }
  }

  // === FLUXOGRAMA DE TRATAMENTO ===
  if (patologia.fluxograma_tratamento) {
    y = drawSectionTitle(doc, 'Fluxograma de Tratamento', y, patologia)

    doc.setFontSize(8)
    doc.setFont('courier', 'normal')
    doc.setTextColor(...CINZA_TEXTO)

    const fluxLines = wrapText(doc, patologia.fluxograma_tratamento, CONTENT_WIDTH - 14)

    for (const line of fluxLines) {
      y = ensureSpace(doc, y, LINE_HEIGHT + 1, patologia)
      if (line === '') {
        y += PARAGRAPH_GAP
      } else {
        // Light background for each line
        doc.setFillColor(245, 247, 245)
        doc.rect(MARGIN + 3, y - 3.2, CONTENT_WIDTH - 6, LINE_HEIGHT, 'F')
        doc.setTextColor(...CINZA_TEXTO)
        doc.text(line, MARGIN + 6, y)
        y += LINE_HEIGHT
      }
    }
    doc.setFont('helvetica', 'normal')
    y += 4
  }

  // === OBSERVAÇÕES CLÍNICAS ===
  if (patologia.observacoes_clinicas) {
    y = drawSectionTitle(doc, 'Observa\u00e7\u00f5es Cl\u00ednicas', y, patologia)
    y = ensureSpace(doc, y, 12, patologia)

    // Orange accent bar
    doc.setFillColor(...LARANJA)
    doc.rect(MARGIN + 3, y - 3, 2, 8, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...LARANJA)
    doc.text('ATEN\u00c7\u00c3O', MARGIN + 8, y + 1)
    y += 7

    y = drawTextBlock(doc, patologia.observacoes_clinicas, y, patologia)
  }

  // === REFERÊNCIAS ===
  if (patologia.referencias) {
    y = drawSectionTitle(doc, 'Refer\u00eancias', y, patologia)
    y = drawTextBlock(doc, patologia.referencias, y, patologia, 8)
  }

  // Adicionar footers em todas as páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return doc.output('blob')
}
