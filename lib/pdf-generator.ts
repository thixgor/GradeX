import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Exam, Question, UserAnswer, QuestionAnnotation, Form, FormBlock } from './types'

// ── Cores da paleta DomineAqui ───────────────────────────────────
const VERDE_ESCURO = [26, 71, 42] as const
const VERDE_MEDIO = [70, 129, 82] as const
const LARANJA = [226, 164, 62] as const
const LARANJA_CLARO = [245, 216, 154] as const
const CINZA_TEXTO = [51, 51, 51] as const
const CINZA_CLARO = [245, 245, 245] as const

// ── Font registration (Roboto TTF for full Unicode/PT-BR) ────────
type FontStyle = 'normal' | 'bold' | 'italic' | 'bolditalic'
let FONT = 'helvetica'
const fontCache: { file: string; style: FontStyle; b64: string }[] = []
// Ongoing prewarm promise so multiple callers don't trigger parallel fetches
let _fontPrewarmPromise: Promise<void> | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunks: string[] = []
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)))
  }
  return btoa(chunks.join(''))
}

/** Populates fontCache without needing a jsPDF instance.  Safe to call early. */
async function prewarmFontsCache(): Promise<void> {
  if (fontCache.length > 0) return
  if (_fontPrewarmPromise) return _fontPrewarmPromise
  _fontPrewarmPromise = (async () => {
    try {
      const variants: { file: string; style: FontStyle }[] = [
        { file: 'Roboto-Regular.ttf',    style: 'normal' },
        { file: 'Roboto-Bold.ttf',        style: 'bold' },
        { file: 'Roboto-Italic.ttf',      style: 'italic' },
        { file: 'Roboto-BoldItalic.ttf',  style: 'bolditalic' },
      ]
      const results = await Promise.all(
        variants.map(async (v) => {
          const res = await fetch(`/fonts/${v.file}`)
          if (!res.ok) throw new Error(`Font not found: ${v.file}`)
          return { ...v, data: await res.arrayBuffer() }
        })
      )
      for (const r of results) {
        fontCache.push({ file: r.file, style: r.style, b64: arrayBufferToBase64(r.data) })
      }
      FONT = 'Roboto'
    } catch {
      FONT = 'helvetica'
    }
  })()
  return _fontPrewarmPromise
}

async function registerFonts(doc: jsPDF): Promise<void> {
  await prewarmFontsCache()
  if (fontCache.length > 0) {
    for (const f of fontCache) {
      doc.addFileToVFS(f.file, f.b64)
      doc.addFont(f.file, 'Roboto', f.style)
    }
    FONT = 'Roboto'
    doc.setFont('Roboto')
  }
}

/**
 * Export for pages to call on mount so fonts+logo are hot by the time
 * the user clicks a PDF button.
 */
export function prewarmPDFAssets(): void {
  if (typeof window === 'undefined') return
  prewarmFontsCache().catch(() => {})
  loadLogo().catch(() => {})
}

// ── Text sanitizer (Helvetica fallback only) ─────────────────────
function sanitizeForPdf(text: string): string {
  if (!text) return text
  let t = text.replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '')
  if (FONT === 'Roboto') return t
  return t
    .replace(/₀/g,'0').replace(/₁/g,'1').replace(/₂/g,'2').replace(/₃/g,'3')
    .replace(/₄/g,'4').replace(/₅/g,'5').replace(/₆/g,'6').replace(/₇/g,'7')
    .replace(/₈/g,'8').replace(/₉/g,'9')
    .replace(/⁰/g,'0').replace(/⁴/g,'4').replace(/⁵/g,'5').replace(/⁶/g,'6')
    .replace(/⁷/g,'7').replace(/⁸/g,'8').replace(/⁹/g,'9')
    .replace(/≥/g,'>=').replace(/≤/g,'<=').replace(/≠/g,'!=').replace(/≈/g,'~')
    .replace(/→/g,'->').replace(/←/g,'<-').replace(/↑/g,'^').replace(/↓/g,'v')
    .replace(/↔/g,'<->').replace(/∞/g,'inf')
    .replace(/α/g,'alfa').replace(/β/g,'beta').replace(/γ/g,'gama')
    .replace(/δ/g,'delta').replace(/Δ/g,'Delta').replace(/μ/g,'u')
    .replace(/✓/g,'V').replace(/✔/g,'V').replace(/✗/g,'X').replace(/✘/g,'X')
}

// ── Logo (cached from /logo.png) ─────────────────────────────────
let logoCache: string | null | undefined = undefined

async function loadLogo(): Promise<string | null> {
  if (logoCache !== undefined) return logoCache
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      const timeout = setTimeout(() => { logoCache = null; resolve(null) }, 6000)
      img.onload = () => {
        clearTimeout(timeout)
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) { logoCache = null; resolve(null); return }
          // Fill with header background so transparent pixels don't go black in JPEG
          ctx.fillStyle = 'rgb(26, 71, 41)'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          logoCache = canvas.toDataURL('image/jpeg', 0.92)
          resolve(logoCache)
        } catch { logoCache = null; resolve(null) }
      }
      img.onerror = () => { clearTimeout(timeout); logoCache = null; resolve(null) }
      img.src = '/logo.png'
    })
  } catch { logoCache = null; return null }
}

// Custom text wrapping function - melhorada para preservar quebras de linha
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return []

  // Replace \nl and \n with actual newlines first, then sanitize
  const cleaned = sanitizeForPdf(text.replace(/\\nl/g, '\n').replace(/\\n/g, '\n'))

  // Preservar quebras de linha existentes
  const paragraphs = cleaned.split(/\n/)
  const allLines: string[] = []

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      allLines.push('') // Manter linhas em branco
      continue
    }

    // Para cada parágrafo, quebrar em palavras
    const words = paragraph.split(' ')
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine ? currentLine + ' ' + word : word
      const testWidth = doc.getTextWidth(testLine)

      if (testWidth > maxWidth && currentLine) {
        allLines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      allLines.push(currentLine)
    }
  }

  return allLines
}

// Função para calcular dimensões proporcionais de imagem
function calculateProportionalDimensions(
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // Para imagens de questões, usar um tamanho padrão moderado
  const standardWidth = Math.min(80, maxWidth)
  const standardHeight = Math.min(50, maxHeight)

  return { width: standardWidth, height: standardHeight }
}

// ── Session-level image cache — persists across all PDF calls in one tab ──
type ImgData = { dataUrl: string; width: number; height: number }
const _sessionImageCache = new Map<string, ImgData | null>()
// Per-URL in-flight promises to avoid duplicate fetches
const _imageInFlight = new Map<string, Promise<ImgData | null>>()

async function fetchImageAsBase64(url: string): Promise<ImgData | null> {
  // Cache hit
  if (_sessionImageCache.has(url)) return _sessionImageCache.get(url) ?? null
  // Deduplicate concurrent fetches for the same URL
  if (_imageInFlight.has(url)) return _imageInFlight.get(url)!

  const promise = (async (): Promise<ImgData | null> => {
    try {
      return await new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')
            if (!ctx) { resolve(null); return }
            ctx.drawImage(img, 0, 0)
            // JPEG is 3-5× faster to encode than PNG and produces 60-80% smaller strings
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
            resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight })
          } catch { resolve(null) }
        }
        img.onerror = () => resolve(null)
        setTimeout(() => resolve(null), 8000)
        img.src = url
      })
    } catch { return null }
  })()

  _imageInFlight.set(url, promise)
  const result = await promise
  _sessionImageCache.set(url, result)
  _imageInFlight.delete(url)
  return result
}

// Pre-fetch all question images for an exam (uses session cache automatically)
async function prefetchExamImages(questions: Question[]): Promise<Map<string, ImgData>> {
  const imageMap = new Map<string, ImgData>()
  await Promise.all(
    questions
      .filter(q => q.imageUrl)
      .map(async (q) => {
        const result = await fetchImageAsBase64(q.imageUrl!)
        if (result) imageMap.set(q.imageUrl!, result)
      })
  )
  return imageMap
}

// Adiciona header padrão DomineAqui (com logo se disponível)
function addDomineAquiHeader(doc: jsPDF, pageWidth: number, margin: number, subtitle?: string, logoData?: string | null) {
  // Barra superior verde escuro
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, pageWidth, 30, 'F')

  // Detalhe laranja no canto
  doc.setFillColor(...LARANJA)
  doc.rect(pageWidth - 65, 0, 65, 30, 'F')

  // Logo image or text fallback
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, 4, 22, 22)
    } catch { logoData = null }
  }
  const textX = logoData ? margin + 26 : margin

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont(FONT, 'bold')
  doc.text('DomineAqui', textX, subtitle ? 12 : 18)

  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont(FONT, 'normal')
    doc.text(sanitizeForPdf(subtitle), textX, 22)
  }

  // Link (laranja box area — white text)
  doc.setFontSize(7.5)
  doc.setTextColor(255, 255, 255)
  doc.text('www.domineaqui.com.br', pageWidth - 62, 19, { align: 'left' })

  return 40
}

// Adiciona footer padrão DomineAqui
function addDomineAquiFooter(doc: jsPDF, pageNum: number, totalPages: number, pageWidth: number, pageHeight: number, margin: number, extraText?: string) {
  const footerY = pageHeight - 12

  doc.setFillColor(...CINZA_CLARO)
  doc.rect(0, footerY - 6, pageWidth, 18, 'F')

  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(1)
  doc.line(0, footerY - 6, pageWidth * 0.7, footerY - 6)
  doc.setDrawColor(...LARANJA)
  doc.line(pageWidth * 0.7, footerY - 6, pageWidth, footerY - 6)

  doc.setFontSize(8)
  doc.setTextColor(70, 70, 70)
  doc.setFont(FONT, 'bold')
  doc.text('DomineAqui', margin, footerY + 1)
  doc.setFont(FONT, 'normal')
  const daqW = doc.getTextWidth('DomineAqui')
  doc.text(' - Manual / Provas', margin + daqW + 1, footerY + 1)
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY + 1, { align: 'right' })

  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.setFontSize(6.5)
  doc.setTextColor(100, 100, 100)
  doc.text(sanitizeForPdf(extraText || `Gerado em ${dataGeracao}`), pageWidth / 2, footerY - 1, { align: 'center' })
  doc.setFont(FONT, 'italic')
  doc.text('Criado por Thiago Rodrigues', pageWidth / 2, footerY + 4, { align: 'center' })
}

export async function generateGabaritoPDF(exam: Exam): Promise<Blob> {
  const doc = new jsPDF()
  await registerFonts(doc)
  const logo = await loadLogo()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Gabarito Oficial', logo)
      return true
    }
    return false
  }

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Gabarito Oficial', logo)

  // === INFORMAÇÕES DA PROVA ===
  // Box com título da prova
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setFillColor(...CINZA_CLARO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont(FONT, 'bold')
  doc.text(exam.title, pageWidth / 2, y + 13, { align: 'center' })

  y += 28

  // Descrição se existir
  if (exam.description) {
    doc.setFontSize(10)
    doc.setFont(FONT, 'normal')
    doc.setTextColor(100, 100, 100)
    const descLines = wrapText(doc, exam.description, pageWidth - 2 * margin)
    doc.text(descLines, pageWidth / 2, y, { align: 'center' })
    y += descLines.length * 5 + 8
  }

  // Informações em duas colunas
  const colWidth = (pageWidth - 2 * margin - 10) / 2

  // Coluna 1 - Total de questões
  doc.setFillColor(...LARANJA_CLARO)
  doc.roundedRect(margin, y, colWidth, 25, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFont(FONT, 'normal')
  doc.text('TOTAL DE QUESTÕES', margin + 5, y + 8)
  doc.setFontSize(16)
  doc.setFont(FONT, 'bold')
  doc.text(exam.numberOfQuestions.toString(), margin + 5, y + 19)

  // Coluna 2 - Pontuação
  doc.setFillColor(...LARANJA_CLARO)
  doc.roundedRect(margin + colWidth + 10, y, colWidth, 25, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFont(FONT, 'normal')
  doc.text('PONTUAÇÃO', margin + colWidth + 15, y + 8)
  doc.setFontSize(16)
  doc.setFont(FONT, 'bold')
  doc.text(
    exam.scoringMethod === 'tri' ? '1000 pontos (TRI)' : `${exam.totalPoints} pontos`,
    margin + colWidth + 15,
    y + 19
  )

  y += 35

  // === RESPOSTAS ===
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont(FONT, 'bold')
  doc.text('GABARITO', pageWidth / 2, y + 7, { align: 'center' })

  y += 18

  // Grid de respostas (5 colunas)
  const columns = 5
  const columnWidth = (pageWidth - 2 * margin) / columns
  let currentCol = 0
  let currentRow = 0
  const rowHeight = 12
  const cellPadding = 2

  exam.questions.forEach((question: Question, index: number) => {
    // Verifica se precisa de nova página
    if (checkPage(rowHeight + 5)) {
      currentRow = 0
      currentCol = 0
    }

    const correctAlternative = question.alternatives.find(alt => alt.isCorrect)
    const answerLetter = correctAlternative?.letter || '-'

    const x = margin + currentCol * columnWidth
    const cellY = y + currentRow * rowHeight

    // Alternar cores de fundo
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
    } else {
      doc.setFillColor(...LARANJA_CLARO)
    }
    doc.rect(x, cellY - 7, columnWidth - 2, rowHeight, 'F')

    // Número da questão
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    doc.setFont(FONT, 'normal')
    doc.text(`${question.number}.`, x + cellPadding, cellY)

    // Resposta
    doc.setTextColor(...VERDE_ESCURO)
    doc.setFontSize(11)
    doc.setFont(FONT, 'bold')
    doc.text(answerLetter, x + cellPadding + 12, cellY)

    currentCol++
    if (currentCol >= columns) {
      currentCol = 0
      currentRow++
    }
  })

  // Ajusta y para após o grid
  y += Math.ceil(exam.questions.length / columns) * rowHeight + 15

  // === INFORMAÇÕES ADICIONAIS ===
  checkPage(60)

  // Separador
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Informações de pontuação
  doc.setFillColor(...CINZA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 45, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(11)
  doc.setFont(FONT, 'bold')

  if (exam.scoringMethod === 'tri') {
    doc.text('SISTEMA DE PONTUAÇÃO: TRI (Teoria de Resposta ao Item)', margin + 5, y + 10)
    doc.setFontSize(9)
    doc.setFont(FONT, 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    doc.text('A pontuação será calculada considerando:', margin + 5, y + 20)
    doc.text('• Dificuldade de cada questão (parâmetro b)', margin + 10, y + 27)
    doc.text('• Discriminação da questão (parâmetro a)', margin + 10, y + 33)
    doc.text('• Probabilidade de acerto ao acaso (parâmetro c)', margin + 10, y + 39)
  } else {
    doc.text(`SISTEMA DE PONTUAÇÃO: Normal`, margin + 5, y + 10)
    doc.setFontSize(9)
    doc.setFont(FONT, 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    const pointsPerQuestion = (exam.totalPoints || 100) / exam.numberOfQuestions
    doc.text(`Pontuação máxima: ${exam.totalPoints} pontos`, margin + 5, y + 20)
    doc.text(`Cada questão vale: ${pointsPerQuestion.toFixed(2)} pontos`, margin + 5, y + 27)
    doc.text(`Total de questões: ${exam.numberOfQuestions}`, margin + 5, y + 34)
  }

  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin)
  }

  return doc.output('blob')
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Gera PDF da prova com gabarito e respostas comentadas (para provas práticas/treino)
 * Mostra cada questão com a alternativa correta destacada em verde e a explicação abaixo.
 */
export async function generateExamWithAnswersPDF(exam: Exam): Promise<Blob> {
  const [imageMap, logo] = await Promise.all([prefetchExamImages(exam.questions), loadLogo()])

  const doc = new jsPDF()
  await registerFonts(doc)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Prova com Gabarito', logo)
      return true
    }
    return false
  }

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Prova com Gabarito', logo)

  // Título
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'FD')
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(16)
  doc.setFont(FONT, 'bold')
  doc.text(exam.title, pageWidth / 2, y + 10, { align: 'center' })
  if (exam.description) {
    doc.setFontSize(10)
    doc.setFont(FONT, 'normal')
    doc.text(exam.description, pageWidth / 2, y + 18, { align: 'center' })
  }
  y += 33

  // Badge "com gabarito"
  doc.setFillColor(26, 71, 42)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 9, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont(FONT, 'bold')
  doc.text('✓  GABARITO COMENTADO  —  Alternativas corretas destacadas em verde', pageWidth / 2, y + 6, { align: 'center' })
  y += 16

  // Questões
  exam.questions.forEach((question, idx) => {
    checkPage(50)

    // Header da questão
    doc.setFillColor(...VERDE_MEDIO)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont(FONT, 'bold')
    doc.text(`Questão ${question.number ?? idx + 1}`, margin + 5, y + 7)

    // Tipo
    const typeLabel = question.type === 'discursive' ? 'Discursiva' : question.type === 'essay' ? 'Redação' : 'Múltipla Escolha'
    doc.setFontSize(8)
    doc.setFont(FONT, 'normal')
    doc.text(typeLabel, pageWidth - margin - 2, y + 7, { align: 'right' })
    y += 15

    // Reset color after header (prevents white text leaking into body)
    doc.setTextColor(...CINZA_TEXTO)
    doc.setFont(FONT, 'normal')

    // Enunciado
    if (question.statement) {
      checkPage(15)
      doc.setFontSize(10)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPage(8)
        // Re-apply color/font after possible page break
        doc.setFontSize(10)
        doc.setFont(FONT, 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        doc.text(line, margin, y)
        y += 6
      })
      y += 2
    }

    // Fonte do enunciado
    if (question.statementSource) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Fonte: ${question.statementSource}`, margin, y)
      y += 6
    }

    // Imagem
    if (question.imageUrl) {
      const imgData = imageMap.get(question.imageUrl)
      if (imgData) {
        const maxImgWidth = pageWidth - 2 * margin - 10
        const maxImgHeight = 80
        const ratio = Math.min(maxImgWidth / imgData.width, maxImgHeight / imgData.height, 1)
        const imgW = imgData.width * ratio
        const imgH = imgData.height * ratio
        checkPage(imgH + 8)
        try {
          doc.addImage(imgData.dataUrl, 'PNG', margin + 5, y, imgW, imgH)
          y += imgH + 5
        } catch {
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text(`[Imagem: ${question.imageUrl}]`, margin, y)
          y += 6
        }
      }
      if (question.imageSource) {
        checkPage(6)
        doc.setFontSize(7)
        doc.setFont(FONT, 'italic')
        doc.setTextColor(120, 120, 120)
        const srcLines = wrapText(doc, `Fonte: ${question.imageSource}`, pageWidth - 2 * margin - 10)
        srcLines.forEach((line: string) => {
          doc.text(line, margin + 5, y)
          y += 4.5
        })
        y += 1
      }
    }

    // Comando
    if (question.command) {
      checkPage(12)
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      const commandLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      commandLines.forEach((line: string) => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 3
    }

    if (question.type === 'multiple-choice') {
      y += 2
      question.alternatives.forEach((alt) => {
        const isCorrect = alt.isCorrect
        const altText = `${alt.letter}) ${alt.text}`
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 12)
        // rect height: covers text lines with top/bottom padding (3+2), no bleed into gap
        const rectH = altLines.length * 6 + 3
        checkPage(rectH + 3)

        // Fundo verde claro dinâmico para alternativa correta
        if (isCorrect) {
          doc.setFillColor(220, 245, 225)
          doc.setDrawColor(70, 129, 82)
          doc.setLineWidth(0.5)
          doc.roundedRect(margin + 1, y - 3, pageWidth - 2 * margin - 2, rectH, 1.5, 1.5, 'FD')
        }

        doc.setFont(FONT, isCorrect ? 'bold' : 'normal')
        doc.setFontSize(10)
        doc.setTextColor(isCorrect ? 26 : CINZA_TEXTO[0], isCorrect ? 71 : CINZA_TEXTO[1], isCorrect ? 42 : CINZA_TEXTO[2])

        // Ícone: checkmark desenhado com linhas (correto) ou checkbox vazio (errado)
        if (isCorrect) {
          // Círculo verde preenchido com checkmark via linhas
          doc.setFillColor(70, 129, 82)
          doc.setDrawColor(70, 129, 82)
          doc.circle(margin + 4.5, y - 1.5, 3, 'F')
          doc.setDrawColor(255, 255, 255)
          doc.setLineWidth(0.7)
          doc.line(margin + 3.2, y - 1.5, margin + 4.3, y - 0.3)
          doc.line(margin + 4.3, y - 0.3, margin + 6, y - 3)
        } else {
          doc.setDrawColor(...VERDE_MEDIO)
          doc.setLineWidth(0.4)
          doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1)
        }

        altLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) {
            doc.setFont(FONT, isCorrect ? 'bold' : 'normal')
            doc.setFontSize(10)
            doc.setTextColor(isCorrect ? 26 : CINZA_TEXTO[0], isCorrect ? 71 : CINZA_TEXTO[1], isCorrect ? 42 : CINZA_TEXTO[2])
          }
          doc.text(line, margin + 10, y)
          y += 6
        })
        y += 3
      })
    } else if (question.type === 'discursive') {
      checkPage(20)
      doc.setFontSize(9)
      doc.setFont(FONT, 'italic')
      doc.setTextColor(100, 100, 100)
      doc.text('(Questão discursiva — ver gabarito/pontos-chave abaixo)', margin + 2, y)
      y += 8
    }

    // Resposta comentada / explanation
    if (question.explanation) {
      const expLines = wrapText(doc, question.explanation, pageWidth - 2 * margin - 14)
      const lineH = 5.5
      const headerH = 14
      const paddingBot = 6
      const boxH = expLines.length * lineH + headerH + paddingBot

      // Always move to a new page if the whole box doesn't fit
      checkPage(boxH)

      doc.setFillColor(245, 250, 246)
      doc.setDrawColor(70, 129, 82)
      doc.setLineWidth(0.5)
      doc.roundedRect(margin, y, pageWidth - 2 * margin, boxH, 2, 2, 'FD')

      doc.setFontSize(8.5)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      doc.text('Resposta Comentada:', margin + 4, y + 8)

      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      let ey = y + headerH
      expLines.forEach((line: string) => {
        doc.text(line, margin + 4, ey)
        ey += lineH
      })
      y = ey + paddingBot
    }

    y += 8
  })

  // Rodapé
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, exam.title)
  }

  return doc.output('blob')
}

// Gerar PDF da prova para alunos preencherem (client-side com jsPDF)
export async function generateExamPDF(exam: Exam, userId?: string): Promise<Blob> {
  const [imageMap, logo] = await Promise.all([prefetchExamImages(exam.questions), loadLogo()])

  const doc = new jsPDF()
  await registerFonts(doc)

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Prova', logo)
      return true
    }
    return false
  }

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Prova', logo)

  // === TÍTULO DA PROVA ===
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(16)
  doc.setFont(FONT, 'bold')
  doc.text(exam.title, pageWidth / 2, y + 10, { align: 'center' })

  if (exam.description) {
    doc.setFontSize(10)
    doc.setFont(FONT, 'normal')
    doc.text(exam.description, pageWidth / 2, y + 18, { align: 'center' })
  }

  y += 35

  // === INFORMAÇÕES DA PROVA ===
  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(9)
  doc.setFont(FONT, 'normal')
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, y, { align: 'right' })
  y += 5
  doc.text(`Duração: ${exam.duration} minutos | Questões: ${exam.numberOfQuestions}`, pageWidth - margin, y, { align: 'right' })
  y += 10

  // === IDENTIFICAÇÃO DO CANDIDATO ===
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont(FONT, 'bold')
  doc.text('IDENTIFICAÇÃO DO CANDIDATO', margin + 5, y + 5.5)
  y += 15

  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(10)
  doc.setFont(FONT, 'normal')
  doc.text('Nome: _____________________________________________________________', margin, y)
  y += 10

  // Código de barras (se tiver userId)
  if (userId) {
    try {
      // Criar canvas temporário para gerar barcode
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, userId, {
        format: 'CODE128',
        width: 2,
        height: 40,
        displayValue: true,
        fontSize: 12,
      })

      const barcodeImage = canvas.toDataURL('image/png')
      doc.text('Código de Barras:', margin, y)
      y += 5
      doc.addImage(barcodeImage, 'PNG', margin, y, 80, 20)
      y += 25
    } catch (error) {
      console.error('Erro ao gerar barcode:', error)
      doc.text(`Código: ${userId}`, margin, y)
      y += 8
    }
  } else {
    doc.text('Código: ___________________________________________________________', margin, y)
    y += 10
  }

  doc.text('Assinatura: ________________________________________________________', margin, y)
  y += 12

  // === INSTRUÇÕES ===
  doc.setFillColor(...LARANJA)
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont(FONT, 'bold')
  doc.text('INSTRUÇÕES', margin + 5, y + 5.5)
  y += 12

  doc.setFontSize(9)
  doc.setFont(FONT, 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  const instructions = [
    '• Preencha todos os campos de identificação acima.',
    '• Leia atentamente cada questão antes de responder.',
    '• Para questões objetivas, marque apenas UMA alternativa.',
    '• Para questões discursivas, escreva de forma clara e legível.',
    '• Não é permitido rasuras nas respostas.',
  ]

  instructions.forEach(instruction => {
    doc.text(instruction, margin + 2, y)
    y += 5
  })

  y += 8

  // === QUESTÕES ===
  exam.questions.forEach((question, idx) => {
    checkPage(50)

    // Header da questão
    doc.setFillColor(...VERDE_MEDIO)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont(FONT, 'bold')
    doc.text(`Questão ${idx + 1}`, margin + 5, y + 7)
    y += 15

    // Enunciado
    if (question.statement) {
      checkPage(15)
      doc.setFontSize(10)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 3
    }

    // Fonte do enunciado
    if (question.statementSource) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`Fonte: ${question.statementSource}`, margin, y)
      y += 6
    }

    // Imagem da questão
    if (question.imageUrl) {
      const imgData = imageMap.get(question.imageUrl)
      if (imgData) {
        const maxImgWidth = pageWidth - 2 * margin - 10
        const maxImgHeight = 80
        const ratio = Math.min(maxImgWidth / imgData.width, maxImgHeight / imgData.height, 1)
        const imgW = imgData.width * ratio
        const imgH = imgData.height * ratio
        checkPage(imgH + 8)
        try {
          doc.addImage(imgData.dataUrl, 'PNG', margin + 5, y, imgW, imgH)
          y += imgH + 5
        } catch {
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text(`[Imagem: ${question.imageUrl}]`, margin, y)
          y += 6
        }
      } else {
        checkPage(8)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`[Imagem não carregada: ${question.imageUrl.slice(0, 60)}]`, margin, y)
        y += 6
      }
      if (question.imageSource) {
        checkPage(6)
        doc.setFontSize(7)
        doc.setFont(FONT, 'italic')
        doc.setTextColor(120, 120, 120)
        const srcLines = wrapText(doc, `Fonte: ${question.imageSource}`, pageWidth - 2 * margin - 10)
        srcLines.forEach((line: string) => {
          doc.text(line, margin + 5, y)
          y += 4.5
        })
        y += 1
      }
    }

    // Comando
    if (question.command) {
      checkPage(12)
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      const commandLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      commandLines.forEach((line: string) => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 4
    }

    if (question.type === 'multiple-choice') {
      // Alternativas com checkboxes
      y += 3

      question.alternatives.forEach((alt) => {
        checkPage(12)

        // Reset font for each alternative to prevent color/size leaks
        doc.setFont(FONT, 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...CINZA_TEXTO)

        // Checkbox estilizado
        doc.setDrawColor(...VERDE_MEDIO)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1)

        // Alternativa - use alt.letter from data instead of hardcoded array
        const altText = `${alt.letter}) ${alt.text}`
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 12)
        altLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) {
            checkPage(6)
            // Re-set after potential page break
            doc.setFont(FONT, 'normal')
            doc.setFontSize(10)
            doc.setTextColor(...CINZA_TEXTO)
          }
          doc.text(line, margin + 10, y)
          y += 6
        })
        y += 3
      })
    } else if (question.type === 'discursive') {
      // Espaço para resposta discursiva
      checkPage(60)

      doc.setFontSize(9)
      doc.setTextColor(...LARANJA)
      doc.setFont(FONT, 'bold')
      doc.text(`Espaço para resposta (máximo ${question.maxScore} pontos):`, margin, y)
      y += 6

      // Linhas para escrever
      const numberOfLines = 10
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)

      for (let i = 0; i < numberOfLines; i++) {
        checkPage(10)
        doc.line(margin, y, pageWidth - margin, y)
        y += 6
      }
    }

    y += 10
  })

  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, `${exam.title}`)
  }

  return doc.output('blob')
}

/**
 * Gera PDF da prova com as respostas do aluno marcadas (sem mostrar gabarito)
 */
export async function generateStudentAnswersPDF(exam: Exam, answers: UserAnswer[], userName: string): Promise<Blob> {
  const [imageMap, logo] = await Promise.all([prefetchExamImages(exam.questions), loadLogo()])
  const doc = new jsPDF()
  await registerFonts(doc)

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Relatório de Respostas', logo)
      return true
    }
    return false
  }

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Relatório de Respostas', logo)

  // === TÍTULO DA PROVA ===
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont(FONT, 'bold')
  doc.text(exam.title, pageWidth / 2, y + 12, { align: 'center' })

  y += 25

  // === INFORMAÇÕES DO ALUNO ===
  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(10)
  doc.setFont(FONT, 'bold')
  doc.text('Aluno: ' + userName, margin, y)
  y += 5
  doc.setFont(FONT, 'normal')
  doc.text('Data: ' + new Date().toLocaleDateString('pt-BR'), margin, y)
  y += 10

  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // === QUESTÕES ===
  exam.questions.forEach((question, idx) => {
    checkPage(40)

    // Header da questão
    doc.setFillColor(...VERDE_MEDIO)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(FONT, 'bold')
    doc.text('Questão ' + (idx + 1), margin + 5, y + 5.5)
    y += 12

    if (question.statement) {
      checkPage(15)
      doc.setFontSize(10)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 3
    }

    if (question.statementSource) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Fonte: ' + question.statementSource, margin, y)
      y += 6
    }

    // Imagem da questão
    if (question.imageUrl) {
      const imgData = imageMap.get(question.imageUrl)
      if (imgData) {
        const maxW = pageWidth - 2 * margin - 10
        const maxH = 75
        const ratio = Math.min(maxW / imgData.width, maxH / imgData.height, 1)
        const imgW = imgData.width * ratio
        const imgH = imgData.height * ratio
        checkPage(imgH + 8)
        try {
          doc.addImage(imgData.dataUrl, 'PNG', margin + 5, y, imgW, imgH)
          y += imgH + 4
        } catch { /* skip */ }
      }
      if (question.imageSource) {
        doc.setFontSize(7)
        doc.setTextColor(120, 120, 120)
        doc.text(`Fonte imagem: ${question.imageSource}`, margin + 5, y)
        y += 5
      }
    }

    if (question.command) {
      checkPage(12)
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      const commandLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      commandLines.forEach((line: string) => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 4
    }

    const answer = answers.find(a => a.questionId === question.id)

    if (question.type === 'multiple-choice') {
      y += 3

      question.alternatives.forEach((alt) => {
        checkPage(12)

        const isSelected = answer?.selectedAlternative === alt.id

        // Checkbox
        doc.setDrawColor(...VERDE_MEDIO)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1)

        if (isSelected) {
          doc.setFillColor(...VERDE_MEDIO)
          doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1, 'F')
        }

        // Reset font/color explicitly per alternative
        if (isSelected) {
          doc.setFont(FONT, 'bold')
          doc.setTextColor(...VERDE_ESCURO)
        } else {
          doc.setFont(FONT, 'normal')
          doc.setTextColor(...CINZA_TEXTO)
        }
        doc.setFontSize(10)

        const altText = alt.letter + ') ' + alt.text
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 12)
        altLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) {
            checkPage(6)
            // Re-set after potential page break
            doc.setFontSize(10)
            if (isSelected) {
              doc.setFont(FONT, 'bold')
              doc.setTextColor(...VERDE_ESCURO)
            } else {
              doc.setFont(FONT, 'normal')
              doc.setTextColor(...CINZA_TEXTO)
            }
          }
          doc.text(line, margin + 10, y)
          y += 6
        })
        y += 3
      })
    } else if (question.type === 'discursive') {
      checkPage(20)

      doc.setFontSize(9)
      doc.setTextColor(...LARANJA)
      doc.setFont(FONT, 'bold')
      doc.text('Sua resposta:', margin, y)
      y += 6

      if (answer?.discursiveText) {
        doc.setFontSize(10)
        doc.setFont(FONT, 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        const answerLines = wrapText(doc, answer.discursiveText, pageWidth - 2 * margin - 4)
        answerLines.forEach((line: string) => {
          checkPage(8)
          doc.text(line, margin + 2, y)
          y += 6
        })
      } else {
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text('(Não respondida)', margin + 2, y)
        y += 6
      }
    }

    y += 10
  })

  // === RODAPÉ ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, `Respostas de ${userName}`)
  }

  return doc.output('blob')
}

/**
 * Gera PDF com as anotações feitas pelo aluno durante a prova
 */
export async function generateAnnotationsPDF(
  examTitle: string,
  annotations: QuestionAnnotation[]
): Promise<Blob> {
  const doc = new jsPDF()
  await registerFonts(doc)
  const logo = await loadLogo()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Anotações da Prova', logo)
      return true
    }
    return false
  }

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Anotações da Prova', logo)

  // === TÍTULO DA PROVA ===
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setFillColor(...CINZA_CLARO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont(FONT, 'bold')
  doc.text(examTitle, pageWidth / 2, y + 13, { align: 'center' })

  y += 30

  // Se não há anotações
  if (annotations.length === 0) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text('Nenhuma anotação foi feita durante esta prova.', pageWidth / 2, y, {
      align: 'center',
    })
  } else {
    // === ANOTAÇÕES ===
    // Ordenar por número da questão
    const sortedAnnotations = [...annotations].sort(
      (a, b) => a.questionNumber - b.questionNumber
    )

    for (const annotation of sortedAnnotations) {
      // Verificar se há espaço para o título da questão
      checkPage(30)

      // Título da questão
      doc.setFillColor(...VERDE_MEDIO)
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont(FONT, 'bold')
      doc.text(`Questão ${annotation.questionNumber}`, margin + 5, y + 8)

      y += 20

      // Verificar se há canvas data URL
      if (annotation.canvasDataUrl) {
        // Calcular dimensões para a imagem
        const maxImageWidth = pageWidth - 2 * margin
        const maxImageHeight = 150 // Altura máxima para cada anotação

        // Adicionar a imagem do canvas
        try {
          // Criar nova página se necessário para a imagem
          checkPage(maxImageHeight + 10)

          doc.addImage(
            annotation.canvasDataUrl,
            'PNG',
            margin,
            y,
            maxImageWidth,
            maxImageHeight
          )

          y += maxImageHeight + 15
        } catch (error) {
          // Se houver erro ao adicionar a imagem, mostrar mensagem
          doc.setFontSize(10)
          doc.setTextColor(200, 0, 0)
          doc.text('Erro ao carregar anotação', margin, y)
          y += 15
        }
      } else {
        // Se não houver canvas data URL, mostrar apenas os textos
        if (annotation.texts && annotation.texts.length > 0) {
          doc.setFontSize(10)
          doc.setTextColor(...CINZA_TEXTO)
          doc.text('Anotações de texto:', margin, y)
          y += 8

          for (const text of annotation.texts) {
            checkPage(10)
            const lines = wrapText(doc, text.text, pageWidth - 2 * margin - 10)
            for (const line of lines) {
              checkPage(6)
              doc.text(`• ${line}`, margin + 5, y)
              y += 6
            }
          }
          y += 10
        } else {
          // Sem anotações
          doc.setFontSize(10)
          doc.setTextColor(150, 150, 150)
          doc.text('(Sem anotações para esta questão)', margin, y)
          y += 15
        }
      }

      // Linha separadora entre questões
      checkPage(5)
      doc.setDrawColor(...LARANJA)
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageWidth - margin, y)
      y += 10
    }
  }

  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, `Anotações - ${examTitle}`)
  }

  return doc.output('blob')
}

/**
 * Gera PDF com o resumo dos dados de uma pesquisa submetida
 */
export async function generateFormResponsePDF(
  form: Form,
  answers: Record<string, string | string[]>
): Promise<Blob> {
  const doc = new jsPDF()
  await registerFonts(doc)
  const logo = await loadLogo()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Resumo da Pesquisa', logo)
      return true
    }
    return false
  }

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Resumo da Pesquisa', logo)

  // Form Title
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont(FONT, 'bold')
  doc.text(form.title, pageWidth / 2, y + 13, { align: 'center' })

  y += 30

  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(10)
  const dateStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const timeStr = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  doc.text(`Submetido em: ${dateStr} às ${timeStr} (Horário de Brasília)`, margin, y)
  y += 15

  // Questions and Answers
  form.blocks.forEach((block: FormBlock) => {
    if (block.type === 'question') {
      checkPage(30)

      // Question Title Wrapper
      doc.setFillColor(...VERDE_MEDIO)
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      doc.text('PERGUNTA', margin + 5, y + 7)
      y += 15

      // Question Content
      doc.setTextColor(...VERDE_ESCURO)
      doc.setFontSize(11)
      doc.setFont(FONT, 'bold')
      const titleText = block.title || 'Sem título'
      const titleLines = wrapText(doc, titleText, pageWidth - 2 * margin)
      titleLines.forEach(line => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 2

      // Answer Text
      doc.setTextColor(...CINZA_TEXTO)
      doc.setFontSize(10)
      doc.setFont(FONT, 'normal')

      const answer = answers[block.id]
      let answerText = ''

      if (Array.isArray(answer)) {
        answerText = answer.join(', ')
      } else if (answer) {
        answerText = answer
      } else {
        answerText = '(Sem resposta)'
      }

      const answerLines = wrapText(doc, String(answerText), pageWidth - 2 * margin)
      answerLines.forEach(line => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })

      y += 10
    }
  })

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, form.title)
  }

  return doc.output('blob')
}

// ─────────────────────────────────────────────────────────────────────────────
// Group PDF: cover pages + merge using pdf-lib
// ─────────────────────────────────────────────────────────────────────────────

export type GroupPDFType = 'exam' | 'with-answers' | 'gabarito'

const TYPE_LABELS: Record<GroupPDFType, { title: string; subtitle: string; accent: readonly [number, number, number] }> = {
  'exam':         { title: 'CADERNO DE PROVAS',          subtitle: 'Questões',                        accent: VERDE_MEDIO },
  'with-answers': { title: 'CADERNO COM GABARITO',       subtitle: 'Questões + Respostas Comentadas', accent: [70, 110, 180] as const },
  'gabarito':     { title: 'CADERNO DE GABARITOS',       subtitle: 'Gabarito Oficial',                accent: [180, 120, 30] as const },
}

/**
 * Generates a single full-page cover for one exam inside the group PDF.
 */
async function generateExamCoverBlob(
  exam: Exam,
  index: number,
  total: number,
  type: GroupPDFType
): Promise<Blob> {
  const doc = new jsPDF()
  await registerFonts(doc)

  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const { accent } = TYPE_LABELS[type]

  // ── Dark header band ──────────────────────────────────────────
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, W, 52, 'F')

  // ── Accent stripe ─────────────────────────────────────────────
  doc.setFillColor(...accent)
  doc.rect(0, 52, W, 6, 'F')

  // ── Logo area ─────────────────────────────────────────────────
  const logo = await loadLogo()
  if (logo) {
    try { doc.addImage(logo, 'PNG', 10, 8, 34, 34) } catch {}
  }

  // ── DomineAqui wordmark ───────────────────────────────────────
  doc.setFont(FONT, 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('DomineAqui', 50, 26, { baseline: 'middle' })

  doc.setFont(FONT, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(180, 210, 190)
  doc.text('Plataforma de Estudos Médicos', 50, 36, { baseline: 'middle' })

  // ── Type badge ────────────────────────────────────────────────
  const { title: typeTitle, subtitle: typeSub } = TYPE_LABELS[type]
  doc.setFont(FONT, 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...accent)
  doc.text(typeTitle, W - 10, 20, { align: 'right', baseline: 'middle' })
  doc.setFont(FONT, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(180, 210, 190)
  doc.text(typeSub, W - 10, 32, { align: 'right', baseline: 'middle' })

  // ── Center card ───────────────────────────────────────────────
  const cardTop = 80
  const cardH = 110
  const mx = 20

  doc.setFillColor(248, 250, 248)
  doc.roundedRect(mx, cardTop, W - mx * 2, cardH, 4, 4, 'F')
  doc.setDrawColor(...accent)
  doc.setLineWidth(0.6)
  doc.roundedRect(mx, cardTop, W - mx * 2, cardH, 4, 4, 'S')

  // Left accent bar
  doc.setFillColor(...accent)
  doc.roundedRect(mx, cardTop, 4, cardH, 2, 2, 'F')

  // Exam number pill
  const pillX = mx + 12
  const pillY = cardTop + 14
  doc.setFillColor(...accent)
  doc.roundedRect(pillX, pillY - 5, 36, 10, 3, 3, 'F')
  doc.setFont(FONT, 'bold')
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  doc.text(`PROVA ${index + 1} DE ${total}`, pillX + 18, pillY, { align: 'center', baseline: 'middle' })

  // Exam title
  const titleLines = doc.splitTextToSize(sanitizeForPdf(exam.title), W - mx * 2 - 24)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(titleLines, mx + 12, cardTop + 34)

  // Description
  if (exam.description) {
    const descLines = doc.splitTextToSize(sanitizeForPdf(exam.description), W - mx * 2 - 24)
    doc.setFont(FONT, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(descLines.slice(0, 3), mx + 12, cardTop + 58)
  }

  // Divider
  doc.setDrawColor(220, 230, 220)
  doc.setLineWidth(0.4)
  doc.line(mx + 10, cardTop + cardH - 26, W - mx - 10, cardTop + cardH - 26)

  // Meta row
  doc.setFont(FONT, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  const meta: string[] = []
  if (exam.numberOfQuestions) meta.push(`${exam.numberOfQuestions} questões`)
  if (exam.totalPoints)       meta.push(`${exam.totalPoints} pts`)
  if (exam.scoringMethod === 'tri') meta.push('TRI')
  if (meta.length) doc.text(meta.join('  ·  '), mx + 12, cardTop + cardH - 13)

  // ── Bottom bar ────────────────────────────────────────────────
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, H - 18, W, 18, 'F')
  doc.setFont(FONT, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(150, 200, 160)
  doc.text('domineaqui.com.br', W / 2, H - 9, { align: 'center', baseline: 'middle' })

  return doc.output('blob')
}

/**
 * Merges an interleaved array of [cover, exam, cover, exam, …] Blobs into one PDF.
 */
async function mergeBlobs(blobs: Blob[]): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib')
  const merged = await PDFDocument.create()
  for (const blob of blobs) {
    const arrayBuffer = await blob.arrayBuffer()
    const src = await PDFDocument.load(arrayBuffer)
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }
  const bytes = await merged.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

/**
 * Generates a combined PDF for all practice exams in a group.
 * Each exam is preceded by a cover page. Order: as provided (caller reverses for bottom→top).
 *
 * Parallelism: up to CONCURRENCY exams generated simultaneously, dramatically
 * reducing wall-clock time (e.g. 10 exams: ~50s sequential → ~15s parallel).
 */
export async function generateGroupPDF(
  exams: Exam[],
  type: GroupPDFType,
  onProgress?: (done: number, total: number) => void
): Promise<Blob> {
  // Pre-warm fonts + logo once so all parallel workers share the cache
  await Promise.all([prewarmFontsCache(), loadLogo()])

  const CONCURRENCY = 3
  const results: [Blob, Blob][] = new Array(exams.length)
  let nextIdx = 0
  let completed = 0

  // Worker function — grabs the next exam index until all are done
  async function worker() {
    while (true) {
      const i = nextIdx++
      if (i >= exams.length) break
      const exam = exams[i]
      // Generate cover and content in parallel for each exam
      const [cover, content] = await Promise.all([
        generateExamCoverBlob(exam, i, exams.length, type),
        type === 'gabarito'      ? generateGabaritoPDF(exam) :
        type === 'with-answers'  ? generateExamWithAnswersPDF(exam) :
                                   generateExamPDF(exam),
      ])
      results[i] = [cover, content]
      completed++
      onProgress?.(completed, exams.length)
    }
  }

  // Launch CONCURRENCY workers in parallel
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  // Flatten in order: [cover1, content1, cover2, content2, …]
  const blobs = results.flatMap(([cover, content]) => [cover, content])
  return mergeBlobs(blobs)
}
