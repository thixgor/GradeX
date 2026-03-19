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
const FOOTER_SPACE = 20

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

  // Detalhe no canto laranja
  doc.setFontSize(8)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('www.domineaqui.com.br', PAGE_WIDTH - 62, 18)

  return 38
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
  doc.text(' - Manual Cl\u00ednico', MARGIN + 18, footerY + 2)

  doc.text(`P\u00e1gina ${pageNum} de ${totalPages}`, PAGE_WIDTH - MARGIN - 22, footerY + 2)

  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(`Gerado em ${dataGeracao} | Seja o Foco. Seja a Refer\u00eancia.`, PAGE_WIDTH / 2, footerY + 2, { align: 'center' })
}

function checkPageBreak(doc: jsPDF, y: number, needed: number, patologia: Patologia): number {
  if (y + needed > PAGE_HEIGHT - FOOTER_SPACE) {
    doc.addPage()
    return addHeader(doc, patologia)
  }
  return y
}

function drawSectionTitle(doc: jsPDF, title: string, y: number, patologia: Patologia): number {
  y = checkPageBreak(doc, y, 14, patologia)

  // Barra verde à esquerda + fundo cinza claro
  doc.setFillColor(...CINZA_CLARO)
  doc.rect(MARGIN, y - 5, CONTENT_WIDTH, 10, 'F')
  doc.setFillColor(...VERDE_MEDIO)
  doc.rect(MARGIN, y - 5, 3, 10, 'F')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(title, MARGIN + 7, y + 2)

  return y + 12
}

function drawTextBlock(doc: jsPDF, text: string, y: number, patologia: Patologia): number {
  if (!text) return y

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...CINZA_TEXTO)

  const lines = wrapText(doc, text, CONTENT_WIDTH - 4)
  for (const line of lines) {
    y = checkPageBreak(doc, y, 5, patologia)
    if (line === '') {
      y += 2
    } else {
      doc.text(line, MARGIN + 2, y)
      y += 4.2
    }
  }
  return y + 2
}

function drawLabelValue(doc: jsPDF, label: string, value: string, y: number, patologia: Patologia): number {
  y = checkPageBreak(doc, y, 6, patologia)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(label + ':', MARGIN + 2, y)
  const labelWidth = doc.getTextWidth(label + ': ')
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  doc.text(value, MARGIN + 2 + labelWidth, y)
  return y + 5
}

function drawFarmacoBlock(doc: jsPDF, farmaco: any, index: number, y: number, patologia: Patologia): number {
  y = checkPageBreak(doc, y, 30, patologia)

  // Card background
  doc.setFillColor(250, 250, 250)
  doc.setDrawColor(...CINZA_MEDIO)
  doc.setLineWidth(0.3)
  doc.roundedRect(MARGIN + 2, y - 3, CONTENT_WIDTH - 4, 4, 1, 1, 'FD')

  // Farmaco name
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(`${farmaco.medicamento}`, MARGIN + 5, y)
  if (farmaco.classe) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(` \u2014 ${farmaco.classe}`, MARGIN + 5 + doc.getTextWidth(farmaco.medicamento + ' '), y)
  }
  y += 6

  if (farmaco.mecanismo_acao) {
    y = drawLabelValue(doc, 'Mecanismo', farmaco.mecanismo_acao.substring(0, 120), y, patologia)
  }
  if (farmaco.dose_usual) {
    y = drawLabelValue(doc, 'Dose', farmaco.dose_usual, y, patologia)
  }
  if (farmaco.efeitos_colaterais?.length > 0) {
    y = drawLabelValue(doc, 'Efeitos colaterais', farmaco.efeitos_colaterais.join('; '), y, patologia)
  }
  if (farmaco.contraindicacoes?.length > 0) {
    y = drawLabelValue(doc, 'Contraindica\u00e7\u00f5es', farmaco.contraindicacoes.join('; '), y, patologia)
  }

  return y + 3
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
    doc.text(patologia.sinonimos.join(' \u2022 '), MARGIN, y)
    y += 5
  }

  // Badges: CID-10, Áreas, Sistema
  doc.setFontSize(8)
  let badgeX = MARGIN

  // CID-10 badge
  if (patologia.cid10) {
    doc.setFillColor(...VERDE_ESCURO)
    const cidText = `CID-10: ${patologia.cid10}`
    const cidWidth = doc.getTextWidth(cidText) + 6
    doc.roundedRect(badgeX, y - 3, cidWidth, 5.5, 1.5, 1.5, 'F')
    doc.setTextColor(...BRANCO)
    doc.setFont('helvetica', 'bold')
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
    const areaWidth = doc.getTextWidth(area) + 6
    doc.roundedRect(badgeX, y - 3, areaWidth, 5.5, 1.5, 1.5, 'F')
    doc.setTextColor(...BRANCO)
    doc.setFont('helvetica', 'bold')
    doc.text(area, badgeX + 3, y + 0.5)
    badgeX += areaWidth + 3
  }
  y += 5

  // Sistema
  if (patologia.sistema) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(patologia.sistema, MARGIN, y)
    y += 5
  }

  // Linha separadora
  doc.setDrawColor(...LARANJA)
  doc.setLineWidth(0.8)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 6

  // === CLASSIFICAÇÃO ===
  if (patologia.classificacao) {
    y = drawSectionTitle(doc, 'Classifica\u00e7\u00e3o', y, patologia)
    y = drawTextBlock(doc, patologia.classificacao, y, patologia)
  }

  // === FISIOPATOLOGIA ===
  if (patologia.fisiopatologia) {
    y = drawSectionTitle(doc, 'Fisiopatologia', y, patologia)
    y = drawTextBlock(doc, patologia.fisiopatologia, y, patologia)
  }

  // === DIAGNÓSTICO SEMIOLÓGICO ===
  if (patologia.diagnostico_semiologico) {
    y = drawSectionTitle(doc, 'Diagn\u00f3stico Semiol\u00f3gico', y, patologia)
    y = drawTextBlock(doc, patologia.diagnostico_semiologico, y, patologia)
  }

  // === DIAGNÓSTICOS DIFERENCIAIS ===
  if (patologia.diagnosticos_diferenciais) {
    y = drawSectionTitle(doc, 'Diagn\u00f3sticos Diferenciais', y, patologia)
    y = drawTextBlock(doc, patologia.diagnosticos_diferenciais, y, patologia)
  }

  // === GRAVIDADE ===
  if (patologia.gravidade) {
    y = drawSectionTitle(doc, 'Gravidade', y, patologia)
    y = drawTextBlock(doc, patologia.gravidade, y, patologia)
  }

  // === TRATAMENTO ===
  if (patologia.tratamento) {
    y = drawSectionTitle(doc, 'Tratamento', y, patologia)
    y = drawTextBlock(doc, patologia.tratamento, y, patologia)
  }

  // === FARMACOLOGIA ===
  const farma = patologia.farmacologia
  if (farma) {
    if (farma.primeira_linha?.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 1\u00aa Linha', y, patologia)
      for (let i = 0; i < farma.primeira_linha.length; i++) {
        y = drawFarmacoBlock(doc, farma.primeira_linha[i], i, y, patologia)
      }
    }
    if (farma.segunda_linha?.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 2\u00aa Linha', y, patologia)
      for (let i = 0; i < farma.segunda_linha.length; i++) {
        y = drawFarmacoBlock(doc, farma.segunda_linha[i], i, y, patologia)
      }
    }
    if (farma.terceira_linha && farma.terceira_linha.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 3\u00aa Linha', y, patologia)
      for (let i = 0; i < farma.terceira_linha.length; i++) {
        y = drawFarmacoBlock(doc, farma.terceira_linha[i], i, y, patologia)
      }
    }
  }

  // === FLUXOGRAMA DE TRATAMENTO ===
  if (patologia.fluxograma_tratamento) {
    y = drawSectionTitle(doc, 'Fluxograma de Tratamento', y, patologia)
    // Fundo cinza para fluxograma (estilo "código")
    const fluxLines = wrapText(doc, patologia.fluxograma_tratamento, CONTENT_WIDTH - 10)
    const fluxHeight = fluxLines.length * 4.2 + 6
    y = checkPageBreak(doc, y, Math.min(fluxHeight, 60), patologia)
    doc.setFillColor(240, 240, 240)
    doc.setDrawColor(...CINZA_MEDIO)
    doc.setLineWidth(0.3)
    const boxH = Math.min(fluxHeight, PAGE_HEIGHT - FOOTER_SPACE - y)
    doc.roundedRect(MARGIN + 2, y - 2, CONTENT_WIDTH - 4, boxH, 2, 2, 'FD')
    doc.setFontSize(8)
    doc.setFont('courier', 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    for (const line of fluxLines) {
      if (y > PAGE_HEIGHT - FOOTER_SPACE) {
        doc.addPage()
        y = addHeader(doc, patologia)
      }
      if (line === '') {
        y += 2
      } else {
        doc.text(line, MARGIN + 5, y + 1)
        y += 4.2
      }
    }
    doc.setFont('helvetica', 'normal')
    y += 4
  }

  // === OBSERVAÇÕES CLÍNICAS ===
  if (patologia.observacoes_clinicas) {
    y = drawSectionTitle(doc, 'Observa\u00e7\u00f5es Cl\u00ednicas', y, patologia)
    // Destaque com borda laranja
    y = checkPageBreak(doc, y, 10, patologia)
    doc.setDrawColor(...LARANJA)
    doc.setLineWidth(0.8)
    doc.line(MARGIN + 2, y - 2, MARGIN + 2, y + 2)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...LARANJA)
    doc.text('ATEN\u00c7\u00c3O', MARGIN + 5, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    y = drawTextBlock(doc, patologia.observacoes_clinicas, y, patologia)
  }

  // === REFERÊNCIAS ===
  if (patologia.referencias) {
    y = drawSectionTitle(doc, 'Refer\u00eancias', y, patologia)
    doc.setFontSize(8)
    y = drawTextBlock(doc, patologia.referencias, y, patologia)
  }

  // Adicionar footers em todas as páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return doc.output('blob')
}
