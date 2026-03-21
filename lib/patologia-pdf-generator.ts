import jsPDF from 'jspdf'
import { Patologia, SISTEMAS_FISIOLOGICOS } from './types/manual-clinico'

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

// ─────────────────────────────────────────────────────────────────
//  MANUAL CLÍNICO COMPLETO — PDF com capa, sumário e todas as
//  patologias organizadas por sistema fisiológico
// ─────────────────────────────────────────────────────────────────

function addCoverPage(doc: jsPDF, totalPatologias: number): void {
  // Full-page green background
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

  // Orange accent strip (top)
  doc.setFillColor(...LARANJA)
  doc.rect(0, 0, PAGE_WIDTH, 8, 'F')

  // Orange accent strip (bottom)
  doc.rect(0, PAGE_HEIGHT - 8, PAGE_WIDTH, 8, 'F')

  // Decorative large circle
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  // Subtle circles
  ;[160, 130, 100].forEach(r => {
    const alpha = r === 160 ? '05' : r === 130 ? '08' : '12'
    doc.setFillColor(255, 255, 255)
    doc.setGState(doc.GState({ opacity: r === 160 ? 0.05 : r === 130 ? 0.08 : 0.12 }))
    doc.circle(PAGE_WIDTH - 30, 60, r, 'F')
  })
  doc.setGState(doc.GState({ opacity: 1 }))

  // Logo / Brand
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRANCO)
  doc.text('DomineAqui', MARGIN, 55)

  // Subtitle
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...LARANJA)
  doc.text('Plataforma de Aprendizado M\u00e9dico', MARGIN, 64)

  // Orange divider
  doc.setDrawColor(...LARANJA)
  doc.setLineWidth(1.5)
  doc.line(MARGIN, 72, PAGE_WIDTH / 2, 72)

  // Main title
  doc.setFontSize(38)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRANCO)
  doc.text('Manual', MARGIN, 108)
  doc.text('Cl\u00ednico', MARGIN, 124)

  // Subtitle line
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...LARANJA)
  doc.text('Completo', MARGIN, 136)

  // Stats box
  doc.setFillColor(0, 0, 0)
  doc.setGState(doc.GState({ opacity: 0.25 }))
  doc.roundedRect(MARGIN, 155, 80, 22, 3, 3, 'F')
  doc.setGState(doc.GState({ opacity: 1 }))

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRANCO)
  doc.text(String(totalPatologias), MARGIN + 8, 168)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(totalPatologias === 1 ? 'patologia cadastrada' : 'patologias cadastradas', MARGIN + 8 + doc.getTextWidth(String(totalPatologias)) + 3, 168)

  // Systems count
  doc.setFontSize(9)
  doc.setTextColor(200, 220, 200)
  doc.text('15 sistemas fisiol\u00f3gicos', MARGIN + 8, 174)

  // Description
  doc.setFontSize(10)
  doc.setTextColor(200, 220, 200)
  const descLines = doc.splitTextToSize(
    'Reposit\u00f3rio estruturado de patologias para estudo de alta fixa\u00e7\u00e3o cognitiva. Organizado por sistemas fisiol\u00f3gicos com farmacologia, fluxogramas e refer\u00eancias.',
    PAGE_WIDTH - MARGIN * 2 - 20
  )
  doc.text(descLines, MARGIN, 192)

  // Bottom info
  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.setFontSize(8)
  doc.setTextColor(150, 200, 150)
  doc.text(`Gerado em ${dataGeracao}`, MARGIN, PAGE_HEIGHT - 15)
  doc.text('www.domineaqui.com.br', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 15, { align: 'right' })
}

function addCompleteHeader(doc: jsPDF): number {
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, PAGE_WIDTH, 20, 'F')
  doc.setFillColor(...LARANJA)
  doc.rect(PAGE_WIDTH - 45, 0, 45, 20, 'F')

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRANCO)
  doc.text('DomineAqui', MARGIN, 13)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Manual Cl\u00ednico', MARGIN + doc.getTextWidth('DomineAqui') + 3, 13)

  doc.setFontSize(7.5)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('domineaqui.com.br', PAGE_WIDTH - 42, 13)

  return 28
}

function addCompleteFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  const fy = PAGE_HEIGHT - 10
  doc.setFillColor(...CINZA_CLARO)
  doc.rect(0, fy - 4, PAGE_WIDTH, 14, 'F')
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(0.8)
  doc.line(0, fy - 4, PAGE_WIDTH * 0.65, fy - 4)
  doc.setDrawColor(...LARANJA)
  doc.line(PAGE_WIDTH * 0.65, fy - 4, PAGE_WIDTH, fy - 4)

  doc.setFontSize(7.5)
  doc.setTextColor(70, 70, 70)
  doc.setFont('helvetica', 'bold')
  doc.text('DomineAqui', MARGIN, fy + 2)
  doc.setFont('helvetica', 'normal')
  doc.text(' — Manual Cl\u00ednico Completo', MARGIN + doc.getTextWidth('DomineAqui') + 1, fy + 2)
  doc.text(`P\u00e1g. ${pageNum} / ${totalPages}`, PAGE_WIDTH - MARGIN, fy + 2, { align: 'right' })

  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.setFontSize(6.5)
  doc.setTextColor(120, 120, 120)
  doc.text(dataGeracao, PAGE_WIDTH / 2, fy + 2, { align: 'center' })
}

function ensureCompleteSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - FOOTER_SPACE) {
    doc.addPage()
    return addCompleteHeader(doc)
  }
  return y
}

function drawCompleteTextBlock(doc: jsPDF, text: string, y: number, fontSize: number = 9): number {
  if (!text) return y
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  const lines = wrapText(doc, text, CONTENT_WIDTH - 6)
  for (const line of lines) {
    y = ensureCompleteSpace(doc, y, LINE_HEIGHT + 1)
    if (line === '') {
      y += PARAGRAPH_GAP
    } else {
      doc.text(line, MARGIN + 3, y)
      y += LINE_HEIGHT
    }
  }
  return y + PARAGRAPH_GAP
}

function drawCompleteSectionTitle(doc: jsPDF, title: string, y: number): number {
  y = ensureCompleteSpace(doc, y, 16)
  doc.setFillColor(...CINZA_CLARO)
  doc.rect(MARGIN, y - 5, CONTENT_WIDTH, 10, 'F')
  doc.setFillColor(...VERDE_MEDIO)
  doc.rect(MARGIN, y - 5, 3, 10, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(title, MARGIN + 7, y + 2)
  return y + 14
}

function drawCompleteLabelValue(doc: jsPDF, label: string, value: string, y: number): number {
  if (!value) return y
  doc.setFontSize(9)
  const labelText = label + ': '
  const labelWidth = doc.getTextWidth(labelText)
  const available = CONTENT_WIDTH - 8 - labelWidth
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  const valueWidth = doc.getTextWidth(value)
  if (valueWidth <= available) {
    y = ensureCompleteSpace(doc, y, LINE_HEIGHT + 1)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...VERDE_ESCURO)
    doc.text(labelText, MARGIN + 4, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    doc.text(value, MARGIN + 4 + labelWidth, y)
    return y + LINE_HEIGHT
  }
  y = ensureCompleteSpace(doc, y, LINE_HEIGHT * 2 + 1)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(labelText, MARGIN + 4, y)
  y += LINE_HEIGHT
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  const wrapped = wrapText(doc, value, CONTENT_WIDTH - 10)
  for (const line of wrapped) {
    y = ensureCompleteSpace(doc, y, LINE_HEIGHT + 1)
    doc.text(line, MARGIN + 6, y)
    y += LINE_HEIGHT
  }
  return y + 1
}

function drawCompleteFarmacoBlock(doc: jsPDF, farmaco: any, y: number): number {
  y = ensureCompleteSpace(doc, y, 20)
  const startY = y
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
    if (doc.getTextWidth(classeText) <= CONTENT_WIDTH - 10 - nameWidth) {
      doc.text(classeText, MARGIN + 6 + nameWidth, y)
    } else {
      y += LINE_HEIGHT
      doc.text(classeText, MARGIN + 6, y)
    }
  }
  y += LINE_HEIGHT + 1
  doc.setFontSize(9)
  if (farmaco.mecanismo_acao) y = drawCompleteLabelValue(doc, 'Mecanismo', farmaco.mecanismo_acao, y)
  if (farmaco.dose_usual) y = drawCompleteLabelValue(doc, 'Dose usual', farmaco.dose_usual, y)
  if (farmaco.efeitos_colaterais?.length > 0) y = drawCompleteLabelValue(doc, 'Efeitos colaterais', farmaco.efeitos_colaterais.join('; '), y)
  if (farmaco.contraindicacoes?.length > 0) y = drawCompleteLabelValue(doc, 'Contraindica\u00e7\u00f5es', farmaco.contraindicacoes.join('; '), y)
  const cardH = y - startY + 3
  doc.setFillColor(...VERDE_MEDIO)
  doc.rect(MARGIN + 2, startY - 4, 2, cardH, 'F')
  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.2)
  doc.line(MARGIN + 2, startY - 4, MARGIN + CONTENT_WIDTH - 2, startY - 4)
  doc.line(MARGIN + 2, startY - 4 + cardH, MARGIN + CONTENT_WIDTH - 2, startY - 4 + cardH)
  return y + 5
}

function renderPatologiaInComplete(doc: jsPDF, patologia: Patologia, y: number): number {
  // Disease name
  y = ensureCompleteSpace(doc, y, 22)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  const nameLines = wrapText(doc, patologia.nome, CONTENT_WIDTH - 4)
  for (const line of nameLines) {
    doc.text(line, MARGIN, y)
    y += 6
  }

  // Synonyms & CID
  if (patologia.sinonimos?.length > 0 || patologia.cid10) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    const sinParts: string[] = []
    if (patologia.cid10) sinParts.push(`CID-10: ${patologia.cid10}`)
    if (patologia.sinonimos?.length > 0) sinParts.push(patologia.sinonimos.join(' \u2022 '))
    const sinText = sinParts.join('  \u2014  ')
    const sinLines = wrapText(doc, sinText, CONTENT_WIDTH)
    for (const line of sinLines) {
      y = ensureCompleteSpace(doc, y, LINE_HEIGHT)
      doc.text(line, MARGIN, y)
      y += LINE_HEIGHT
    }
  }

  // Orange rule
  doc.setDrawColor(...LARANJA)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y + 1, PAGE_WIDTH - MARGIN, y + 1)
  y += 6

  // Content sections
  if (patologia.classificacao) {
    y = drawCompleteSectionTitle(doc, 'Classifica\u00e7\u00e3o', y)
    y = drawCompleteTextBlock(doc, patologia.classificacao, y)
  }
  if (patologia.fisiopatologia) {
    y = drawCompleteSectionTitle(doc, 'Fisiopatologia', y)
    y = drawCompleteTextBlock(doc, patologia.fisiopatologia, y)
  }
  if (patologia.diagnostico_semiologico) {
    y = drawCompleteSectionTitle(doc, 'Diagn\u00f3stico Semiol\u00f3gico', y)
    y = drawCompleteTextBlock(doc, patologia.diagnostico_semiologico, y)
  }
  if (patologia.diagnosticos_diferenciais) {
    y = drawCompleteSectionTitle(doc, 'Diagn\u00f3sticos Diferenciais', y)
    y = drawCompleteTextBlock(doc, patologia.diagnosticos_diferenciais, y)
  }
  if (patologia.gravidade) {
    y = drawCompleteSectionTitle(doc, 'Gravidade', y)
    y = drawCompleteTextBlock(doc, patologia.gravidade, y)
  }
  if (patologia.tratamento) {
    y = drawCompleteSectionTitle(doc, 'Tratamento', y)
    y = drawCompleteTextBlock(doc, patologia.tratamento, y)
  }

  // Farmacologia
  const farma = patologia.farmacologia
  if (farma) {
    if (farma.primeira_linha?.length > 0) {
      y = drawCompleteSectionTitle(doc, 'Farmacologia \u2014 1\u00aa Linha', y)
      for (const f of farma.primeira_linha) y = drawCompleteFarmacoBlock(doc, f, y)
    }
    if (farma.segunda_linha?.length > 0) {
      y = drawCompleteSectionTitle(doc, 'Farmacologia \u2014 2\u00aa Linha', y)
      for (const f of farma.segunda_linha) y = drawCompleteFarmacoBlock(doc, f, y)
    }
    if (farma.terceira_linha && farma.terceira_linha.length > 0) {
      y = drawCompleteSectionTitle(doc, 'Farmacologia \u2014 3\u00aa Linha', y)
      for (const f of farma.terceira_linha) y = drawCompleteFarmacoBlock(doc, f, y)
    }
  }

  // Fluxograma
  if (patologia.fluxograma_tratamento) {
    y = drawCompleteSectionTitle(doc, 'Fluxograma de Tratamento', y)
    doc.setFontSize(7.5)
    doc.setFont('courier', 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    const fluxLines = wrapText(doc, patologia.fluxograma_tratamento, CONTENT_WIDTH - 14)
    for (const line of fluxLines) {
      y = ensureCompleteSpace(doc, y, LINE_HEIGHT + 1)
      if (line === '') {
        y += PARAGRAPH_GAP
      } else {
        doc.setFillColor(245, 247, 245)
        doc.rect(MARGIN + 3, y - 3.2, CONTENT_WIDTH - 6, LINE_HEIGHT, 'F')
        doc.setTextColor(...CINZA_TEXTO)
        doc.text(line, MARGIN + 6, y)
        y += LINE_HEIGHT
      }
    }
    doc.setFont('helvetica', 'normal')
    y += 3
  }

  // Observações
  if (patologia.observacoes_clinicas) {
    y = drawCompleteSectionTitle(doc, 'Observa\u00e7\u00f5es Cl\u00ednicas', y)
    y = ensureCompleteSpace(doc, y, 10)
    doc.setFillColor(...LARANJA)
    doc.rect(MARGIN + 3, y - 2, 2, 7, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...LARANJA)
    doc.text('ATEN\u00c7\u00c3O', MARGIN + 8, y + 2)
    y += 6
    y = drawCompleteTextBlock(doc, patologia.observacoes_clinicas, y)
  }

  return y + 4
}

function renderSystemDivider(doc: jsPDF, sistema: string): number {
  doc.addPage()
  // Full-width green bar
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

  doc.setFillColor(...LARANJA)
  doc.rect(0, 0, PAGE_WIDTH, 6, 'F')
  doc.rect(0, PAGE_HEIGHT - 6, PAGE_WIDTH, 6, 'F')

  // System name (centered, large)
  doc.setTextColor(...BRANCO)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')

  // Wrap long system names
  const wrapped = doc.splitTextToSize(sistema, PAGE_WIDTH - MARGIN * 4)
  const totalH = wrapped.length * 10
  const startY = PAGE_HEIGHT / 2 - totalH / 2
  wrapped.forEach((line: string, i: number) => {
    doc.text(line, PAGE_WIDTH / 2, startY + i * 10, { align: 'center' })
  })

  // Orange underline
  doc.setDrawColor(...LARANJA)
  doc.setLineWidth(2)
  doc.line(PAGE_WIDTH / 2 - 30, startY + totalH + 4, PAGE_WIDTH / 2 + 30, startY + totalH + 4)

  // "Sistema Fisiológico" label
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...LARANJA)
  doc.text('Sistema Fisiol\u00f3gico', PAGE_WIDTH / 2, startY - 12, { align: 'center' })

  // Next page for content
  doc.addPage()
  return addCompleteHeader(doc)
}

/** Gera PDF completo do Manual Clínico com capa, sumário e conteúdo por sistema. */
export function generateManualCompletoPDF(patologias: Patologia[]): Blob {
  const doc = new jsPDF()

  // ── Capa ──────────────────────────────────────────────────────────
  addCoverPage(doc, patologias.length)

  // ── Sumário ───────────────────────────────────────────────────────
  doc.addPage()
  let y = addCompleteHeader(doc)

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('Sum\u00e1rio', MARGIN, y)
  y += 4
  doc.setDrawColor(...LARANJA)
  doc.setLineWidth(1)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 8

  // Group patologias by system (order by SISTEMAS_FISIOLOGICOS)
  const bySystem = new Map<string, Patologia[]>()
  for (const s of SISTEMAS_FISIOLOGICOS) bySystem.set(s, [])
  for (const p of patologias) {
    const arr = bySystem.get(p.sistema)
    if (arr) arr.push(p)
  }

  for (const sistema of SISTEMAS_FISIOLOGICOS) {
    const list = bySystem.get(sistema) || []
    if (list.length === 0) continue

    y = ensureCompleteSpace(doc, y, 14)

    // System heading in TOC
    doc.setFillColor(...CINZA_CLARO)
    doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 9, 'F')
    doc.setFillColor(...VERDE_ESCURO)
    doc.rect(MARGIN, y - 4, 3, 9, 'F')
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...VERDE_ESCURO)
    doc.text(sistema, MARGIN + 6, y + 2)
    y += 12

    // Diseases in two columns
    const colW = CONTENT_WIDTH / 2 - 3
    for (let i = 0; i < list.length; i += 2) {
      y = ensureCompleteSpace(doc, y, LINE_HEIGHT + 1)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...CINZA_TEXTO)

      // Left column
      const left = list[i]
      const leftText = '\u2022 ' + left.nome + (left.cid10 ? ` (${left.cid10})` : '')
      const leftTrimmed = doc.splitTextToSize(leftText, colW)[0]
      doc.text(leftTrimmed, MARGIN + 4, y)

      // Right column (if exists)
      if (list[i + 1]) {
        const right = list[i + 1]
        const rightText = '\u2022 ' + right.nome + (right.cid10 ? ` (${right.cid10})` : '')
        const rightTrimmed = doc.splitTextToSize(rightText, colW)[0]
        doc.text(rightTrimmed, MARGIN + 4 + colW + 6, y)
      }

      y += LINE_HEIGHT + 0.5
    }
    y += 3
  }

  // ── Conteúdo por sistema ──────────────────────────────────────────
  for (const sistema of SISTEMAS_FISIOLOGICOS) {
    const list = bySystem.get(sistema) || []
    if (list.length === 0) continue

    // Full-page system divider
    y = renderSystemDivider(doc, sistema)

    for (let i = 0; i < list.length; i++) {
      y = renderPatologiaInComplete(doc, list[i], y)

      // Separator between diseases (not after last)
      if (i < list.length - 1) {
        y = ensureCompleteSpace(doc, y, 10)
        doc.setDrawColor(...CINZA_MEDIO)
        doc.setLineWidth(0.3)
        doc.line(MARGIN + 10, y, PAGE_WIDTH - MARGIN - 10, y)
        y += 8
      }
    }
  }

  // ── Footers em todas as páginas ───────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 2; i <= totalPages; i++) {
    // Skip cover page (page 1)
    doc.setPage(i)
    addCompleteFooter(doc, i - 1, totalPages - 1)
  }

  return doc.output('blob')
}
