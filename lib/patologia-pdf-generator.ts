import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { Patologia, SISTEMAS_FISIOLOGICOS } from './types/manual-clinico'

// ── Types ────────────────────────────────────────────────────────

type FontStyle = 'normal' | 'bold' | 'italic' | 'bolditalic'

interface StyledWord {
  text: string
  style: FontStyle
  isLink: boolean
}

type RichLine = StyledWord[]

// ── Cores da paleta DomineAqui ───────────────────────────────────

const VERDE_ESCURO = [26, 71, 42] as const
const VERDE_MEDIO = [70, 129, 82] as const
const LARANJA = [226, 164, 62] as const
const CINZA_TEXTO = [51, 51, 51] as const
const CINZA_CLARO = [245, 245, 245] as const
const CINZA_MEDIO = [200, 200, 200] as const
const BRANCO = [255, 255, 255] as const
const AZUL_LINK = [37, 99, 235] as const

// ── Layout constants ─────────────────────────────────────────────

const MARGIN = 15
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const FOOTER_SPACE = 22
const LINE_HEIGHT = 5.5
const PARAGRAPH_GAP = 3

// ── Rich Text Parsing ────────────────────────────────────────────
// Parses **bold**, *italic*, [text](url) into styled word tokens

function parseRichSegments(text: string): { text: string; style: FontStyle; isLink: boolean }[] {
  if (!text) return []
  const segments: { text: string; style: FontStyle; isLink: boolean }[] = []
  // Order matters: ** before *
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\([^)]+\)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), style: 'normal', isLink: false })
    }
    if (match[1] !== undefined) {
      segments.push({ text: match[1], style: 'bold', isLink: false })
    } else if (match[2] !== undefined) {
      segments.push({ text: match[2], style: 'italic', isLink: false })
    } else if (match[3] !== undefined) {
      segments.push({ text: match[3], style: 'normal', isLink: true })
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), style: 'normal', isLink: false })
  }

  return segments.length > 0 ? segments : [{ text, style: 'normal', isLink: false }]
}

function segmentsToWords(segments: { text: string; style: FontStyle; isLink: boolean }[]): StyledWord[] {
  const words: StyledWord[] = []
  for (const seg of segments) {
    const parts = seg.text.split(/(\s+)/)
    for (const part of parts) {
      if (!part || /^\s+$/.test(part)) continue
      words.push({ text: part, style: seg.style, isLink: seg.isLink })
    }
  }
  return words
}

function wordWidth(doc: jsPDF, word: StyledWord, fontSize: number): number {
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', word.style)
  return doc.getTextWidth(word.text)
}

function spaceWidth(doc: jsPDF, fontSize: number): number {
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'normal')
  return doc.getTextWidth(' ')
}

function wrapRichText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): RichLine[] {
  if (!text) return []
  const paragraphs = text.split(/\n/)
  const allLines: RichLine[] = []
  const sw = spaceWidth(doc, fontSize)

  for (const para of paragraphs) {
    if (para.trim() === '') {
      allLines.push([]) // empty line = paragraph break
      continue
    }
    const segments = parseRichSegments(para.trim())
    const words = segmentsToWords(segments)
    if (words.length === 0) { allLines.push([]); continue }

    let currentLine: StyledWord[] = []
    let currentWidth = 0

    for (const w of words) {
      const ww = wordWidth(doc, w, fontSize)
      const needed = currentLine.length > 0 ? sw + ww : ww

      if (currentWidth + needed > maxWidth && currentLine.length > 0) {
        allLines.push(currentLine)
        currentLine = [w]
        currentWidth = ww
      } else {
        currentLine.push(w)
        currentWidth += needed
      }
    }
    if (currentLine.length > 0) allLines.push(currentLine)
  }

  return allLines
}

function renderRichLine(doc: jsPDF, line: RichLine, x: number, y: number, fontSize: number): void {
  if (line.length === 0) return
  doc.setFontSize(fontSize)
  const sw = spaceWidth(doc, fontSize)
  let cx = x

  for (let i = 0; i < line.length; i++) {
    const w = line[i]
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', w.style)
    doc.setTextColor(...(w.isLink ? AZUL_LINK : CINZA_TEXTO))
    doc.text(w.text, cx, y)
    cx += doc.getTextWidth(w.text)
    if (i < line.length - 1) cx += sw
  }
}

// ── Image Loading ────────────────────────────────────────────────

interface LoadedImage {
  data: string
  w: number
  h: number
}

async function loadImage(url: string): Promise<LoadedImage | null> {
  try {
    return await new Promise<LoadedImage | null>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      const timeout = setTimeout(() => resolve(null), 8000)
      img.onload = () => {
        clearTimeout(timeout)
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) { resolve(null); return }
          ctx.drawImage(img, 0, 0)
          resolve({ data: canvas.toDataURL('image/jpeg', 0.85), w: img.naturalWidth, h: img.naturalHeight })
        } catch { resolve(null) }
      }
      img.onerror = () => { clearTimeout(timeout); resolve(null) }
      img.src = url
    })
  } catch { return null }
}

async function preloadImages(urls: string[]): Promise<Map<string, LoadedImage>> {
  const map = new Map<string, LoadedImage>()
  const results = await Promise.all(urls.map(u => loadImage(u)))
  urls.forEach((url, i) => { if (results[i]) map.set(url, results[i]!) })
  return map
}

// ── Ensure Space (page break logic) ─────────────────────────────

type EnsureSpaceFn = (doc: jsPDF, y: number, needed: number) => number

function makeEnsureSpace(addHeaderFn: (doc: jsPDF) => number): EnsureSpaceFn {
  return (doc, y, needed) => {
    if (y + needed > PAGE_HEIGHT - FOOTER_SPACE) {
      doc.addPage()
      return addHeaderFn(doc)
    }
    return y
  }
}

// ── Individual PDF: Header & Footer ──────────────────────────────

function addHeader(doc: jsPDF): number {
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, PAGE_WIDTH, 30, 'F')
  doc.setFillColor(...LARANJA)
  doc.rect(PAGE_WIDTH - 65, 0, 65, 30, 'F')

  doc.setTextColor(...BRANCO)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('DomineAqui', MARGIN, 13)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Manual Cl\u00ednico', MARGIN, 21)

  doc.setFontSize(8)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('www.domineaqui.com.br', PAGE_WIDTH - 62, 18)

  return 40
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  const fy = PAGE_HEIGHT - 12
  doc.setFillColor(...CINZA_CLARO)
  doc.rect(0, fy - 5, PAGE_WIDTH, 17, 'F')
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(1)
  doc.line(0, fy - 5, PAGE_WIDTH * 0.7, fy - 5)
  doc.setDrawColor(...LARANJA)
  doc.line(PAGE_WIDTH * 0.7, fy - 5, PAGE_WIDTH, fy - 5)

  doc.setFontSize(8)
  doc.setTextColor(70, 70, 70)
  doc.setFont('helvetica', 'bold')
  doc.text('DomineAqui', MARGIN, fy + 2)
  doc.setFont('helvetica', 'normal')
  doc.text(' - Manual Cl\u00ednico', MARGIN + doc.getTextWidth('DomineAqui') + 1, fy + 2)
  doc.text(`P\u00e1gina ${pageNum} de ${totalPages}`, PAGE_WIDTH - MARGIN, fy + 2, { align: 'right' })

  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(`Gerado em ${dataGeracao}`, PAGE_WIDTH / 2, fy + 2, { align: 'center' })
}

// ── Shared Drawing Helpers ───────────────────────────────────────

function drawSectionTitle(doc: jsPDF, title: string, y: number, ensure: EnsureSpaceFn, fontSize: number = 11): number {
  y = ensure(doc, y, 16)
  doc.setFillColor(...CINZA_CLARO)
  doc.rect(MARGIN, y - 5, CONTENT_WIDTH, 10, 'F')
  doc.setFillColor(...VERDE_MEDIO)
  doc.rect(MARGIN, y - 5, 3, 10, 'F')
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(title, MARGIN + 7, y + 2)
  return y + 14
}

function drawRichTextBlock(doc: jsPDF, text: string, y: number, ensure: EnsureSpaceFn, fontSize: number = 9.5): number {
  if (!text) return y
  const lines = wrapRichText(doc, text, CONTENT_WIDTH - 6, fontSize)
  for (const line of lines) {
    y = ensure(doc, y, LINE_HEIGHT + 1)
    if (line.length === 0) {
      y += PARAGRAPH_GAP
    } else {
      renderRichLine(doc, line, MARGIN + 3, y, fontSize)
      y += LINE_HEIGHT
    }
  }
  return y + PARAGRAPH_GAP
}

// ── Embed-aware text block ──────────────────────────────────────
// Splits text into regular lines and embed lines (!video, !audio, !image)
// Regular lines are rendered as rich text; embeds are rendered as images or QR codes

const EMBED_LINE_REGEX = /^!(video|audio|image)\[([^\]]*)\]\(([^)]+)\)\s*$/

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

async function generateQRDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { width: 200, margin: 1, color: { dark: '#1a472a', light: '#ffffff' } })
}

function drawEmbedImage(
  doc: jsPDF, url: string, caption: string, y: number, ensure: EnsureSpaceFn, imageMap: Map<string, LoadedImage>
): number {
  const img = imageMap.get(url)
  if (!img) {
    // Placeholder
    y = ensure(doc, y, 16)
    doc.setFillColor(...CINZA_CLARO)
    doc.setDrawColor(...CINZA_MEDIO)
    doc.setLineWidth(0.3)
    doc.roundedRect(MARGIN + 20, y, CONTENT_WIDTH - 40, 12, 2, 2, 'FD')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(150, 150, 150)
    doc.text('[Imagem não disponível]', PAGE_WIDTH / 2, y + 7, { align: 'center' })
    y += 14
    if (caption) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(100, 100, 100)
      const capLines = doc.splitTextToSize(caption, CONTENT_WIDTH - 20)
      for (const cl of capLines) {
        doc.text(cl, PAGE_WIDTH / 2, y, { align: 'center' })
        y += 4
      }
      y += 2
    }
    return y + 2
  }

  const maxW = CONTENT_WIDTH - 20
  const maxH = 110
  const ratio = Math.min(maxW / img.w, maxH / img.h, 1)
  const drawW = img.w * ratio
  const drawH = img.h * ratio

  y = ensure(doc, y, drawH + (caption ? 12 : 4) + 4)
  const imgX = MARGIN + (CONTENT_WIDTH - drawW) / 2
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.roundedRect(imgX - 1, y - 1, drawW + 2, drawH + 2, 1, 1, 'S')
  doc.addImage(img.data, 'JPEG', imgX, y, drawW, drawH)
  y += drawH + 3

  if (caption) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    const capLines = doc.splitTextToSize(caption, CONTENT_WIDTH - 20)
    for (const cl of capLines) {
      doc.text(cl, PAGE_WIDTH / 2, y, { align: 'center' })
      y += 4
    }
    y += 2
  }
  return y + 2
}

function drawMediaQR(
  doc: jsPDF, type: 'video' | 'audio', caption: string, qrDataUrl: string, y: number, ensure: EnsureSpaceFn
): number {
  const cardH = 32
  y = ensure(doc, y, cardH + 6)

  const accentColor: readonly [number, number, number] = type === 'video' ? [220, 80, 80] : [140, 100, 200]

  // Card background
  const cardX = MARGIN + 10
  const cardW = CONTENT_WIDTH - 20
  doc.setFillColor(type === 'video' ? 255 : 248, type === 'video' ? 245 : 243, type === 'video' ? 245 : 255)
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(0.4)
  doc.roundedRect(cardX, y, cardW, cardH, 2, 2, 'FD')

  // Accent bar
  doc.setFillColor(...accentColor)
  doc.rect(cardX, y, 3, cardH, 'F')

  // QR code
  const qrSize = 24
  const qrX = cardX + cardW - qrSize - 4
  const qrY = y + (cardH - qrSize) / 2
  try {
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
  } catch { /* QR failed */ }

  // Icon + text
  const textX = cardX + 8
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...accentColor)
  doc.text(type === 'video' ? '▶  VÍDEO' : '♫  ÁUDIO', textX, y + 7)

  if (caption) {
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    const maxCaptionW = cardW - qrSize - 20
    const capLines = doc.splitTextToSize(caption, maxCaptionW)
    for (let i = 0; i < Math.min(capLines.length, 2); i++) {
      doc.text(capLines[i], textX, y + 13 + i * 4.5)
    }
  }

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(120, 120, 120)
  doc.text('Escaneie o QR Code para acessar', textX, y + cardH - 4)

  return y + cardH + 4
}

async function drawRichTextBlockWithEmbeds(
  doc: jsPDF, text: string, y: number, ensure: EnsureSpaceFn,
  imageMap: Map<string, LoadedImage>, qrMap: Map<string, string>,
  slug: string, fontSize: number = 9.5
): Promise<number> {
  if (!text) return y
  const lines = text.split(/\n/)
  let buffer = ''

  for (const line of lines) {
    const embedMatch = line.match(EMBED_LINE_REGEX)
    if (embedMatch) {
      // Flush text buffer
      if (buffer.trim()) {
        y = drawRichTextBlock(doc, buffer, y, ensure, fontSize)
        buffer = ''
      }
      const [, type, caption, url] = embedMatch
      if (type === 'image') {
        y = drawEmbedImage(doc, url, caption, y, ensure, imageMap)
      } else {
        const qrKey = url
        const qrDataUrl = qrMap.get(qrKey)
        if (qrDataUrl) {
          y = drawMediaQR(doc, type as 'video' | 'audio', caption, qrDataUrl, y, ensure)
        }
      }
    } else {
      buffer += (buffer ? '\n' : '') + line
    }
  }
  // Flush remaining buffer
  if (buffer.trim()) {
    y = drawRichTextBlock(doc, buffer, y, ensure, fontSize)
  }
  return y
}

function drawLabelValue(doc: jsPDF, label: string, value: string, y: number, ensure: EnsureSpaceFn): number {
  if (!value) return y
  const fontSize = 9.5

  // Measure the label
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'bold')
  const labelText = label + ': '
  const labelW = doc.getTextWidth(labelText)

  // Measure the value (plain, for inline check)
  doc.setFont('helvetica', 'normal')
  const plainValue = value.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  const valueW = doc.getTextWidth(plainValue)
  const availableForValue = CONTENT_WIDTH - 8 - labelW

  if (valueW <= availableForValue) {
    // Single line: label + value
    y = ensure(doc, y, LINE_HEIGHT + 1)
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...VERDE_ESCURO)
    doc.text(labelText, MARGIN + 4, y)

    // Render value with rich text inline
    const segments = parseRichSegments(value)
    const words = segmentsToWords(segments)
    let cx = MARGIN + 4 + labelW
    const sw = spaceWidth(doc, fontSize)
    for (let i = 0; i < words.length; i++) {
      const w = words[i]
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', w.style === 'normal' && !w.isLink ? 'normal' : w.style)
      doc.setTextColor(...(w.isLink ? AZUL_LINK : CINZA_TEXTO))
      doc.text(w.text, cx, y)
      cx += doc.getTextWidth(w.text)
      if (i < words.length - 1) cx += sw
    }
    return y + LINE_HEIGHT
  }

  // Multi-line: label on own line, value wrapped below
  y = ensure(doc, y, LINE_HEIGHT * 2 + 1)
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(labelText, MARGIN + 4, y)
  y += LINE_HEIGHT

  const wrappedLines = wrapRichText(doc, value, CONTENT_WIDTH - 10, fontSize)
  for (const line of wrappedLines) {
    y = ensure(doc, y, LINE_HEIGHT + 1)
    if (line.length === 0) {
      y += PARAGRAPH_GAP
    } else {
      renderRichLine(doc, line, MARGIN + 6, y, fontSize)
      y += LINE_HEIGHT
    }
  }
  return y + 1
}

function drawFarmacoBlock(doc: jsPDF, farmaco: any, y: number, ensure: EnsureSpaceFn): number {
  y = ensure(doc, y, 24)
  const startY = y

  // Background card
  doc.setFillColor(250, 251, 250)
  doc.setDrawColor(230, 232, 230)
  doc.setLineWidth(0.3)

  // Farmaco name
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(farmaco.medicamento || 'Sem nome', MARGIN + 8, y)

  if (farmaco.classe) {
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    const classeText = `(${farmaco.classe})`
    const nameW = doc.getTextWidth((farmaco.medicamento || '') + '  ')
    doc.setFontSize(10.5)
    doc.setFont('helvetica', 'bold')
    const fullNameW = doc.getTextWidth((farmaco.medicamento || '') + '  ')
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'italic')
    if (fullNameW + doc.getTextWidth(classeText) <= CONTENT_WIDTH - 12) {
      doc.text(classeText, MARGIN + 8 + fullNameW, y)
    } else {
      y += LINE_HEIGHT
      doc.text(classeText, MARGIN + 8, y)
    }
  }
  y += LINE_HEIGHT + 2

  if (farmaco.mecanismo_acao) y = drawLabelValue(doc, 'Mecanismo', farmaco.mecanismo_acao, y, ensure)
  if (farmaco.dose_usual) y = drawLabelValue(doc, 'Dose usual', farmaco.dose_usual, y, ensure)
  if (farmaco.efeitos_colaterais?.length > 0) y = drawLabelValue(doc, 'Efeitos colaterais', farmaco.efeitos_colaterais.join('; '), y, ensure)
  if (farmaco.contraindicacoes?.length > 0) y = drawLabelValue(doc, 'Contraindica\u00e7\u00f5es', farmaco.contraindicacoes.join('; '), y, ensure)

  // Draw card decorations
  const cardH = y - startY + 4
  doc.setFillColor(...VERDE_MEDIO)
  doc.rect(MARGIN + 3, startY - 5, 2.5, cardH, 'F')
  doc.setDrawColor(225, 228, 225)
  doc.setLineWidth(0.2)
  doc.line(MARGIN + 3, startY - 5, MARGIN + CONTENT_WIDTH - 3, startY - 5)
  doc.line(MARGIN + 3, startY - 5 + cardH, MARGIN + CONTENT_WIDTH - 3, startY - 5 + cardH)

  return y + 6
}

function drawFluxogramaBlock(doc: jsPDF, text: string, y: number, ensure: EnsureSpaceFn): number {
  if (!text) return y

  const steps = text.split(/\n/).filter(s => s.trim())
  const stepHeight = 9
  const arrowHeight = 6
  const boxWidth = CONTENT_WIDTH - 20
  const boxX = MARGIN + 10

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i].trim()
    const totalNeeded = stepHeight + (i < steps.length - 1 ? arrowHeight : 0) + 4

    y = ensure(doc, y, totalNeeded + 4)

    // Step box
    const isDecision = step.includes('?') || step.toLowerCase().startsWith('se ')
    const bgColor: readonly [number, number, number] = isDecision ? [255, 248, 235] : [240, 248, 243]
    const borderColor: readonly [number, number, number] = isDecision ? LARANJA : VERDE_MEDIO

    doc.setFillColor(...bgColor)
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.5)

    // Measure text to determine box height — use rich text wrapping for bold/italic
    const richFontSize = 8.5
    const richLines = wrapRichText(doc, step, boxWidth - 14, richFontSize)
    const lineH = 4.5
    const boxH = Math.max(stepHeight, richLines.length * lineH + 5)

    doc.roundedRect(boxX, y - 2, boxWidth, boxH, 2, 2, 'FD')

    // Step number circle
    doc.setFillColor(...borderColor)
    doc.circle(boxX + 5, y + boxH / 2 - 2, 3, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRANCO)
    doc.text(String(i + 1), boxX + 5, y + boxH / 2 - 0.8, { align: 'center' })

    // Step text — render with bold/italic support
    doc.setTextColor(...CINZA_TEXTO)
    for (let l = 0; l < richLines.length; l++) {
      if (richLines[l].length > 0) {
        renderRichLine(doc, richLines[l], boxX + 12, y + 3 + l * lineH, richFontSize)
      }
    }

    y += boxH + 1

    // Arrow between steps
    if (i < steps.length - 1) {
      const arrowX = boxX + boxWidth / 2
      doc.setDrawColor(...VERDE_MEDIO)
      doc.setLineWidth(0.6)
      doc.line(arrowX, y, arrowX, y + arrowHeight - 2)
      // Arrowhead
      doc.setFillColor(...VERDE_MEDIO)
      doc.triangle(
        arrowX - 2, y + arrowHeight - 3,
        arrowX + 2, y + arrowHeight - 3,
        arrowX, y + arrowHeight,
        'F'
      )
      y += arrowHeight + 1
    }
  }

  return y + 4
}

function drawImagesBlock(
  doc: jsPDF,
  urls: string[],
  captions: string[],
  y: number,
  ensure: EnsureSpaceFn,
  imageMap: Map<string, LoadedImage>
): number {
  for (let i = 0; i < urls.length; i++) {
    const img = imageMap.get(urls[i])
    const caption = captions[i] || ''

    if (!img) {
      // Image failed to load — show placeholder
      y = ensure(doc, y, 16)
      doc.setFillColor(...CINZA_CLARO)
      doc.setDrawColor(...CINZA_MEDIO)
      doc.setLineWidth(0.3)
      doc.roundedRect(MARGIN + 20, y, CONTENT_WIDTH - 40, 12, 2, 2, 'FD')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(150, 150, 150)
      doc.text('[Imagem n\u00e3o dispon\u00edvel]', PAGE_WIDTH / 2, y + 7, { align: 'center' })
      y += 14
      if (caption) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(100, 100, 100)
        doc.text(caption, PAGE_WIDTH / 2, y, { align: 'center' })
        y += 6
      }
      continue
    }

    // Scale image to fit
    const maxW = CONTENT_WIDTH - 20
    const maxH = 110
    const ratio = Math.min(maxW / img.w, maxH / img.h, 1)
    const drawW = img.w * ratio
    const drawH = img.h * ratio

    y = ensure(doc, y, drawH + (caption ? 12 : 4) + 4)

    // Border around image
    const imgX = MARGIN + (CONTENT_WIDTH - drawW) / 2
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.roundedRect(imgX - 1, y - 1, drawW + 2, drawH + 2, 1, 1, 'S')

    doc.addImage(img.data, 'JPEG', imgX, y, drawW, drawH)
    y += drawH + 3

    // Caption
    if (caption) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(100, 100, 100)
      const capLines = doc.splitTextToSize(caption, CONTENT_WIDTH - 20)
      for (const cl of capLines) {
        doc.text(cl, PAGE_WIDTH / 2, y, { align: 'center' })
        y += 4
      }
      y += 2
    }

    y += 4
  }

  return y
}

// ═══════════════════════════════════════════════════════════════════
//  INDIVIDUAL PATOLOGIA PDF
// ═══════════════════════════════════════════════════════════════════

// ── Helpers: collect embed URLs from all text fields ────────────

function collectEmbedUrls(patologia: Patologia): { imageUrls: string[]; mediaUrls: { url: string; type: string }[] } {
  const textFields = [
    patologia.classificacao, patologia.fisiopatologia,
    patologia.diagnostico_semiologico, patologia.diagnosticos_diferenciais,
    patologia.gravidade, patologia.tratamento,
    patologia.observacoes_clinicas, patologia.referencias,
  ]
  const imageUrls: string[] = []
  const mediaUrls: { url: string; type: string }[] = []
  for (const field of textFields) {
    if (!field) continue
    for (const line of field.split('\n')) {
      const m = line.match(EMBED_LINE_REGEX)
      if (!m) continue
      const [, type, , url] = m
      if (type === 'image') imageUrls.push(url)
      else mediaUrls.push({ url, type })
    }
  }
  return { imageUrls, mediaUrls }
}

async function buildQRMap(mediaUrls: { url: string; type: string }[], slug: string): Promise<Map<string, string>> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domineaqui.com.br'
  const qrMap = new Map<string, string>()
  const galleryUrl = `${baseUrl}/manual-clinico/${slug}?galeria=1`
  await Promise.all(mediaUrls.map(async ({ url }) => {
    try {
      const qrDataUrl = await generateQRDataUrl(galleryUrl)
      qrMap.set(url, qrDataUrl)
    } catch { /* skip */ }
  }))
  return qrMap
}

export async function generatePatologiaPDF(patologia: Patologia): Promise<Blob> {
  // Collect all embed URLs from text fields
  const { imageUrls: embedImageUrls, mediaUrls } = collectEmbedUrls(patologia)

  // Preload images (mechanism images + inline embed images)
  const allImageUrls = [...(patologia.imagens_mecanismo || []), ...embedImageUrls]
  const imageMap = await preloadImages(allImageUrls)

  // Generate QR codes for video/audio embeds
  const qrMap = await buildQRMap(mediaUrls, patologia.slug)

  const doc = new jsPDF()
  const ensure = makeEnsureSpace(() => addHeader(doc))
  let y = addHeader(doc)

  // ── Título ──────────────────────────────────────────────────────
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  const titleLines = doc.splitTextToSize(patologia.nome, CONTENT_WIDTH)
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
    const sinLines = doc.splitTextToSize(patologia.sinonimos.join(' \u2022 '), CONTENT_WIDTH)
    for (const line of sinLines) {
      doc.text(line, MARGIN, y)
      y += LINE_HEIGHT
    }
    y += 1
  }

  // Badges
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  let badgeX = MARGIN

  if (patologia.cid10) {
    doc.setFillColor(...VERDE_ESCURO)
    const cidText = `CID-10: ${patologia.cid10}`
    const cidW = doc.getTextWidth(cidText) + 6
    doc.roundedRect(badgeX, y - 3, cidW, 5.5, 1.5, 1.5, 'F')
    doc.setTextColor(...BRANCO)
    doc.text(cidText, badgeX + 3, y + 0.5)
    badgeX += cidW + 3
  }

  const areaColors: Record<string, [number, number, number]> = {
    'Medicina': [59, 130, 246],
    'Psicologia': [147, 51, 234],
    'Odontologia': [16, 185, 129],
    'Biomedicina': [249, 115, 22],
  }
  for (const area of patologia.areas || []) {
    const color = areaColors[area] || VERDE_MEDIO
    doc.setFillColor(...color)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    const areaText = area
    const areaW = doc.getTextWidth(areaText) + 6
    if (badgeX + areaW > PAGE_WIDTH - MARGIN) { y += 7; badgeX = MARGIN }
    doc.roundedRect(badgeX, y - 3, areaW, 5.5, 1.5, 1.5, 'F')
    doc.setTextColor(...BRANCO)
    doc.text(areaText, badgeX + 3, y + 0.5)
    badgeX += areaW + 3
  }
  y += 6

  if (patologia.sistema) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(patologia.sistema, MARGIN, y)
    y += 6
  }

  // Divider
  doc.setDrawColor(...LARANJA)
  doc.setLineWidth(0.8)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 8

  // ── Seções de conteúdo ──────────────────────────────────────────
  // Helper to render text with embed support
  const drawSection = async (text: string, yy: number, fs?: number) =>
    drawRichTextBlockWithEmbeds(doc, text, yy, ensure, imageMap, qrMap, patologia.slug, fs)

  if (patologia.classificacao) {
    y = drawSectionTitle(doc, 'Classifica\u00e7\u00e3o', y, ensure)
    y = await drawSection(patologia.classificacao, y)
  }

  if (patologia.fisiopatologia) {
    y = drawSectionTitle(doc, 'Fisiopatologia', y, ensure)
    y = await drawSection(patologia.fisiopatologia, y)
  }

  // Images after fisiopatologia
  if (patologia.imagens_mecanismo?.length) {
    y = drawSectionTitle(doc, 'Imagens do Mecanismo', y, ensure)
    y = drawImagesBlock(doc, patologia.imagens_mecanismo, patologia.legenda_imagens || [], y, ensure, imageMap)
  }

  if (patologia.diagnostico_semiologico) {
    y = drawSectionTitle(doc, 'Diagn\u00f3stico Semiol\u00f3gico', y, ensure)
    y = await drawSection(patologia.diagnostico_semiologico, y)
  }

  if (patologia.diagnosticos_diferenciais) {
    y = drawSectionTitle(doc, 'Diagn\u00f3sticos Diferenciais', y, ensure)
    y = await drawSection(patologia.diagnosticos_diferenciais, y)
  }

  if (patologia.gravidade) {
    y = drawSectionTitle(doc, 'Gravidade', y, ensure)
    y = await drawSection(patologia.gravidade, y)
  }

  if (patologia.tratamento) {
    y = drawSectionTitle(doc, 'Tratamento', y, ensure)
    y = await drawSection(patologia.tratamento, y)
  }

  // ── Farmacologia ────────────────────────────────────────────────

  const farma = patologia.farmacologia
  if (farma) {
    if (farma.primeira_linha?.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 1\u00aa Linha', y, ensure)
      for (const f of farma.primeira_linha) y = drawFarmacoBlock(doc, f, y, ensure)
    }
    if (farma.segunda_linha?.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 2\u00aa Linha', y, ensure)
      for (const f of farma.segunda_linha) y = drawFarmacoBlock(doc, f, y, ensure)
    }
    if (farma.terceira_linha?.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 3\u00aa Linha', y, ensure)
      for (const f of farma.terceira_linha) y = drawFarmacoBlock(doc, f, y, ensure)
    }
  }

  // ── Fluxograma ──────────────────────────────────────────────────

  if (patologia.fluxograma_tratamento) {
    y = drawSectionTitle(doc, 'Fluxograma de Tratamento', y, ensure)
    y = drawFluxogramaBlock(doc, patologia.fluxograma_tratamento, y, ensure)
  }

  // ── Observações clínicas ────────────────────────────────────────

  if (patologia.observacoes_clinicas) {
    y = drawSectionTitle(doc, 'Observa\u00e7\u00f5es Cl\u00ednicas', y, ensure)
    y = ensure(doc, y, 14)

    // Attention bar
    doc.setFillColor(255, 245, 230)
    doc.setDrawColor(...LARANJA)
    doc.setLineWidth(0.5)
    doc.roundedRect(MARGIN + 3, y - 4, CONTENT_WIDTH - 6, 10, 1.5, 1.5, 'FD')
    doc.setFillColor(...LARANJA)
    doc.rect(MARGIN + 3, y - 4, 3, 10, 'F')

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...LARANJA)
    doc.text('\u26A0  ATEN\u00c7\u00c3O', MARGIN + 10, y + 2)
    y += 10

    y = await drawSection(patologia.observacoes_clinicas, y)
  }

  // ── Referências ─────────────────────────────────────────────────

  if (patologia.referencias) {
    y = drawSectionTitle(doc, 'Refer\u00eancias', y, ensure)
    y = await drawSection(patologia.referencias, y, 8.5)
  }

  // ── Footers ─────────────────────────────────────────────────────

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return doc.output('blob')
}

// ═══════════════════════════════════════════════════════════════════
//  MANUAL CLÍNICO COMPLETO
// ═══════════════════════════════════════════════════════════════════

function addCoverPage(doc: jsPDF, totalPatologias: number): void {
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

  doc.setFillColor(...LARANJA)
  doc.rect(0, 0, PAGE_WIDTH, 8, 'F')
  doc.rect(0, PAGE_HEIGHT - 8, PAGE_WIDTH, 8, 'F')

  // Decorative circles
  ;[160, 130, 100].forEach(r => {
    doc.setGState(doc.GState({ opacity: r === 160 ? 0.05 : r === 130 ? 0.08 : 0.12 }))
    doc.setFillColor(255, 255, 255)
    doc.circle(PAGE_WIDTH - 30, 60, r, 'F')
  })
  doc.setGState(doc.GState({ opacity: 1 }))

  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRANCO)
  doc.text('DomineAqui', MARGIN, 55)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...LARANJA)
  doc.text('Plataforma de Aprendizado M\u00e9dico', MARGIN, 64)

  doc.setDrawColor(...LARANJA)
  doc.setLineWidth(1.5)
  doc.line(MARGIN, 72, PAGE_WIDTH / 2, 72)

  doc.setFontSize(38)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRANCO)
  doc.text('Manual', MARGIN, 108)
  doc.text('Cl\u00ednico', MARGIN, 124)

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
  doc.text(
    totalPatologias === 1 ? 'patologia cadastrada' : 'patologias cadastradas',
    MARGIN + 8 + doc.getTextWidth(String(totalPatologias)) + 3,
    168
  )

  doc.setFontSize(9)
  doc.setTextColor(200, 220, 200)
  doc.text('15 sistemas fisiol\u00f3gicos', MARGIN + 8, 174)

  doc.setFontSize(10)
  doc.setTextColor(200, 220, 200)
  const descLines = doc.splitTextToSize(
    'Reposit\u00f3rio estruturado de patologias para estudo de alta fixa\u00e7\u00e3o cognitiva. Organizado por sistemas fisiol\u00f3gicos com farmacologia, fluxogramas e refer\u00eancias.',
    PAGE_WIDTH - MARGIN * 2 - 20
  )
  doc.text(descLines, MARGIN, 192)

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
  doc.text(' \u2014 Manual Cl\u00ednico Completo', MARGIN + doc.getTextWidth('DomineAqui') + 1, fy + 2)
  doc.text(`P\u00e1g. ${pageNum} / ${totalPages}`, PAGE_WIDTH - MARGIN, fy + 2, { align: 'right' })

  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.setFontSize(6.5)
  doc.setTextColor(120, 120, 120)
  doc.text(dataGeracao, PAGE_WIDTH / 2, fy + 2, { align: 'center' })
}

function renderSystemDivider(doc: jsPDF, sistema: string): number {
  doc.addPage()
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

  doc.setFillColor(...LARANJA)
  doc.rect(0, 0, PAGE_WIDTH, 6, 'F')
  doc.rect(0, PAGE_HEIGHT - 6, PAGE_WIDTH, 6, 'F')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...LARANJA)
  const labelY = PAGE_HEIGHT / 2 - 20
  doc.text('Sistema Fisiol\u00f3gico', PAGE_WIDTH / 2, labelY, { align: 'center' })

  doc.setTextColor(...BRANCO)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  const wrapped = doc.splitTextToSize(sistema, PAGE_WIDTH - MARGIN * 4)
  const totalH = wrapped.length * 10
  const startY = labelY + 14
  wrapped.forEach((line: string, i: number) => {
    doc.text(line, PAGE_WIDTH / 2, startY + i * 10, { align: 'center' })
  })

  doc.setDrawColor(...LARANJA)
  doc.setLineWidth(2)
  doc.line(PAGE_WIDTH / 2 - 30, startY + totalH + 4, PAGE_WIDTH / 2 + 30, startY + totalH + 4)

  doc.addPage()
  return addCompleteHeader(doc)
}

async function renderPatologiaInComplete(
  doc: jsPDF,
  patologia: Patologia,
  y: number,
  ensure: EnsureSpaceFn,
  imageMap: Map<string, LoadedImage>,
  qrMap: Map<string, string>
): Promise<number> {
  // Disease name
  y = ensure(doc, y, 22)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  const nameLines = doc.splitTextToSize(patologia.nome, CONTENT_WIDTH - 4)
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
    const sinLines = doc.splitTextToSize(sinText, CONTENT_WIDTH)
    for (const line of sinLines) {
      y = ensure(doc, y, LINE_HEIGHT)
      doc.text(line, MARGIN, y)
      y += LINE_HEIGHT
    }
  }

  // Orange rule
  doc.setDrawColor(...LARANJA)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y + 1, PAGE_WIDTH - MARGIN, y + 1)
  y += 6

  // Helper for embed-aware text rendering
  const drawSection = async (text: string, yy: number) =>
    drawRichTextBlockWithEmbeds(doc, text, yy, ensure, imageMap, qrMap, patologia.slug)

  // Content sections
  if (patologia.classificacao) {
    y = drawSectionTitle(doc, 'Classifica\u00e7\u00e3o', y, ensure, 10)
    y = await drawSection(patologia.classificacao, y)
  }
  if (patologia.fisiopatologia) {
    y = drawSectionTitle(doc, 'Fisiopatologia', y, ensure, 10)
    y = await drawSection(patologia.fisiopatologia, y)
  }
  if (patologia.imagens_mecanismo?.length) {
    y = drawSectionTitle(doc, 'Imagens do Mecanismo', y, ensure, 10)
    y = drawImagesBlock(doc, patologia.imagens_mecanismo, patologia.legenda_imagens || [], y, ensure, imageMap)
  }
  if (patologia.diagnostico_semiologico) {
    y = drawSectionTitle(doc, 'Diagn\u00f3stico Semiol\u00f3gico', y, ensure, 10)
    y = await drawSection(patologia.diagnostico_semiologico, y)
  }
  if (patologia.diagnosticos_diferenciais) {
    y = drawSectionTitle(doc, 'Diagn\u00f3sticos Diferenciais', y, ensure, 10)
    y = await drawSection(patologia.diagnosticos_diferenciais, y)
  }
  if (patologia.gravidade) {
    y = drawSectionTitle(doc, 'Gravidade', y, ensure, 10)
    y = await drawSection(patologia.gravidade, y)
  }
  if (patologia.tratamento) {
    y = drawSectionTitle(doc, 'Tratamento', y, ensure, 10)
    y = await drawSection(patologia.tratamento, y)
  }

  // Farmacologia
  const farma = patologia.farmacologia
  if (farma) {
    if (farma.primeira_linha?.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 1\u00aa Linha', y, ensure, 10)
      for (const f of farma.primeira_linha) y = drawFarmacoBlock(doc, f, y, ensure)
    }
    if (farma.segunda_linha?.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 2\u00aa Linha', y, ensure, 10)
      for (const f of farma.segunda_linha) y = drawFarmacoBlock(doc, f, y, ensure)
    }
    if (farma.terceira_linha?.length > 0) {
      y = drawSectionTitle(doc, 'Farmacologia \u2014 3\u00aa Linha', y, ensure, 10)
      for (const f of farma.terceira_linha) y = drawFarmacoBlock(doc, f, y, ensure)
    }
  }

  // Fluxograma
  if (patologia.fluxograma_tratamento) {
    y = drawSectionTitle(doc, 'Fluxograma de Tratamento', y, ensure, 10)
    y = drawFluxogramaBlock(doc, patologia.fluxograma_tratamento, y, ensure)
  }

  // Observações
  if (patologia.observacoes_clinicas) {
    y = drawSectionTitle(doc, 'Observa\u00e7\u00f5es Cl\u00ednicas', y, ensure, 10)
    y = ensure(doc, y, 14)

    doc.setFillColor(255, 245, 230)
    doc.setDrawColor(...LARANJA)
    doc.setLineWidth(0.5)
    doc.roundedRect(MARGIN + 3, y - 4, CONTENT_WIDTH - 6, 10, 1.5, 1.5, 'FD')
    doc.setFillColor(...LARANJA)
    doc.rect(MARGIN + 3, y - 4, 3, 10, 'F')

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...LARANJA)
    doc.text('\u26A0  ATEN\u00c7\u00c3O', MARGIN + 10, y + 2)
    y += 10

    y = await drawSection(patologia.observacoes_clinicas, y)
  }

  return y + 4
}

/** Gera PDF completo do Manual Clínico com capa, sumário e conteúdo por sistema. */
export async function generateManualCompletoPDF(patologias: Patologia[]): Promise<Blob> {
  // Preload all images from all patologias (mechanism images + embed images)
  const allUrls: string[] = []
  const allMediaUrls: { url: string; type: string }[] = []
  for (const p of patologias) {
    if (p.imagens_mecanismo?.length) allUrls.push(...p.imagens_mecanismo)
    const { imageUrls, mediaUrls } = collectEmbedUrls(p)
    allUrls.push(...imageUrls)
    allMediaUrls.push(...mediaUrls.map(m => ({ ...m, slug: p.slug })))
  }
  const imageMap = await preloadImages(allUrls)

  // Generate QR codes for all video/audio embeds across all patologias
  const qrMap = new Map<string, string>()
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domineaqui.com.br'
  await Promise.all(patologias.map(async (p) => {
    const { mediaUrls } = collectEmbedUrls(p)
    const galleryUrl = `${baseUrl}/manual-clinico/${p.slug}?galeria=1`
    for (const { url } of mediaUrls) {
      if (!qrMap.has(url)) {
        try {
          qrMap.set(url, await generateQRDataUrl(galleryUrl))
        } catch { /* skip */ }
      }
    }
  }))

  const doc = new jsPDF()
  const ensure = makeEnsureSpace(() => addCompleteHeader(doc))

  // ── Capa ────────────────────────────────────────────────────────
  addCoverPage(doc, patologias.length)

  // ── Sumário ─────────────────────────────────────────────────────
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

  // Group by system
  const bySystem = new Map<string, Patologia[]>()
  for (const s of SISTEMAS_FISIOLOGICOS) bySystem.set(s, [])
  for (const p of patologias) {
    const arr = bySystem.get(p.sistema)
    if (arr) arr.push(p)
  }

  for (const sistema of SISTEMAS_FISIOLOGICOS) {
    const list = bySystem.get(sistema) || []
    if (list.length === 0) continue

    y = ensure(doc, y, 14)

    doc.setFillColor(...CINZA_CLARO)
    doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 9, 'F')
    doc.setFillColor(...VERDE_ESCURO)
    doc.rect(MARGIN, y - 4, 3, 9, 'F')
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...VERDE_ESCURO)
    doc.text(sistema, MARGIN + 6, y + 2)
    y += 12

    const colW = CONTENT_WIDTH / 2 - 3
    for (let i = 0; i < list.length; i += 2) {
      y = ensure(doc, y, LINE_HEIGHT + 1)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...CINZA_TEXTO)

      const left = list[i]
      const leftText = '\u2022 ' + left.nome + (left.cid10 ? ` (${left.cid10})` : '')
      const leftTrimmed = doc.splitTextToSize(leftText, colW)[0]
      doc.text(leftTrimmed, MARGIN + 4, y)

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

  // ── Conteúdo por sistema ────────────────────────────────────────
  for (const sistema of SISTEMAS_FISIOLOGICOS) {
    const list = bySystem.get(sistema) || []
    if (list.length === 0) continue

    y = renderSystemDivider(doc, sistema)

    for (let i = 0; i < list.length; i++) {
      y = await renderPatologiaInComplete(doc, list[i], y, ensure, imageMap, qrMap)

      if (i < list.length - 1) {
        y = ensure(doc, y, 10)
        doc.setDrawColor(...CINZA_MEDIO)
        doc.setLineWidth(0.3)
        doc.line(MARGIN + 10, y, PAGE_WIDTH - MARGIN - 10, y)
        y += 8
      }
    }
  }

  // ── Footers ─────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i)
    addCompleteFooter(doc, i - 1, totalPages - 1)
  }

  return doc.output('blob')
}
