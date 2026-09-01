import { jsPDF } from 'jspdf'
import type { FlashcardManualCard, FlashcardManualDeck } from './types'

type PdfUser = {
  id: string
  name: string
  email: string
}

type ImageData = {
  dataUrl: string
  format: 'PNG' | 'JPEG' | 'WEBP'
}

type RGB = readonly [number, number, number]
type TextStyle = 'normal' | 'bold' | 'italic'
type TextSegment = { text: string; style: TextStyle }

const VERDE_ESCURO = [26, 71, 42] as const
const VERDE_MEDIO = [70, 129, 82] as const
const LARANJA = [226, 164, 62] as const
const LARANJA_CLARO = [245, 216, 154] as const
const CINZA_TEXTO = [51, 51, 51] as const
const CINZA_CLARO = [245, 245, 245] as const
const CINZA_BORDA = [215, 224, 216] as const
const imageCache = new Map<string, Promise<ImageData | null>>()

/**
 * Largura em que as imagens entram no PDF.
 *
 * Uma figura é desenhada em no máximo ~178 x 82 mm (ver `renderImage`), o que
 * a 150 dpi dá pouco mais de 1000 px de largura. Embutir o arquivo original —
 * uma foto de 3 MB tirada no celular, por exemplo — era jogar megabytes num
 * espaço de sete centímetros de altura: o PDF ficava pesado, a geração ficava
 * cara e a resposta estourava o teto de corpo da função.
 *
 * 1080 é um valor de `deviceSizes` (next.config.js) de propósito: o otimizador
 * do Next recusa larguras fora dessa lista, e usar uma que a plataforma já
 * serve para o `next/image` do próprio deck faz a transformação cair no cache
 * em vez de ser refeita.
 */
const PDF_IMAGE_WIDTH = 1080
const PDF_IMAGE_QUALITY = 70

function cleanText(value: unknown): string {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\nl/g, '\n')
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '')
    .trim()
}

function safeFileName(value: string): string {
  const cleaned = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return cleaned || 'flashcards'
}

export function flashcardPdfFileName(deckTitle: string): string {
  return `${safeFileName(deckTitle)}-DomineAqui.pdf`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function frontTextForCard(card: FlashcardManualCard): string {
  if (card.kind !== 'hidden_word' || !card.hiddenWord) return cleanText(card.front?.text)
  const phrase = cleanText(card.hiddenWord.phrase)
  const word = cleanText(card.hiddenWord.word)
  if (!word) return phrase
  return phrase.replace(new RegExp(`\\*\\*${escapeRegExp(word)}\\*\\*|${escapeRegExp(word)}`, 'gi'), '________')
}

function backTextForCard(card: FlashcardManualCard): string {
  if (card.kind !== 'hidden_word' || !card.hiddenWord) return cleanText(card.back?.text)
  const answer = cleanText(card.hiddenWord.word)
  const extra = cleanText(card.back?.text)
  return [answer ? `Palavra: **${answer}**` : '', extra].filter(Boolean).join('\n\n')
}

function tokenizeInline(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ text: text.slice(last, match.index), style: 'normal' })
    }
    if (match[1] !== undefined) {
      segments.push({ text: match[1], style: 'bold' })
    } else if (match[2] !== undefined) {
      segments.push({ text: match[2], style: 'italic' })
    }
    last = regex.lastIndex
  }

  if (last < text.length) {
    segments.push({ text: text.slice(last), style: 'normal' })
  }

  return segments.filter(segment => segment.text.length > 0)
}

function splitSegmentsIntoChunks(segments: TextSegment[]): TextSegment[] {
  return segments.flatMap(segment => {
    const parts = segment.text.split(/(\s+)/).filter(part => part.length > 0)
    return parts.map(part => ({ text: part, style: segment.style }))
  })
}

async function fetchImageAsDataUrl(url: string, origin: string): Promise<ImageData | null> {
  const cacheKey = `${origin}|${url}`
  const cached = imageCache.get(cacheKey)
  if (cached) return cached

  const task = fetchImageAsDataUrlUncached(url, origin)
  imageCache.set(cacheKey, task)
  if (imageCache.size > 120) {
    const firstKey = imageCache.keys().next().value
    if (firstKey) imageCache.delete(firstKey)
  }
  return task
}

/**
 * Endereço da imagem já redimensionada pelo otimizador do próprio Next.
 *
 * Não pedimos WebP: o formato PDF não tem filtro para ele, e o jsPDF teria de
 * decodificar por conta própria. Com um `Accept` sem webp, o otimizador
 * devolve a imagem no formato de origem — só que redimensionada e recomprimida,
 * que é tudo o que precisamos aqui.
 */
function optimizedImageUrl(url: string, origin: string): string {
  return `${origin}/_next/image?url=${encodeURIComponent(url)}&w=${PDF_IMAGE_WIDTH}&q=${PDF_IMAGE_QUALITY}`
}

async function fetchImageBytes(
  target: string,
  timeoutMs: number
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(target, {
      signal: controller.signal,
      headers: {
        // Sem webp/avif de propósito — ver `optimizedImageUrl`.
        Accept: 'image/jpeg,image/png,image/*;q=0.8',
        'User-Agent': 'Domine-Aqui-Flashcard-PDF/1.0',
      },
    })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) return null
    if (contentType.includes('svg') || contentType.includes('gif')) return null
    return { bytes: Buffer.from(await response.arrayBuffer()), contentType }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchImageAsDataUrlUncached(url: string, origin: string): Promise<ImageData | null> {
  try {
    if (!url) return null
    if (url.startsWith('data:image/')) {
      const mime = url.slice(5, url.indexOf(';')).toLowerCase()
      const format = mime.includes('png') ? 'PNG' : mime.includes('webp') ? 'WEBP' : 'JPEG'
      return { dataUrl: url, format }
    }

    const absoluteUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : new URL(url, origin).toString()

    // Primeiro a versão redimensionada; o original só se ela falhar. O
    // otimizador recusa host fora de `remotePatterns` e não existe fora da
    // Vercel, então o plano B precisa existir — mas buscar os dois sempre
    // dobraria a transferência de origem para descartar metade.
    const escolhida =
      (await fetchImageBytes(optimizedImageUrl(url, origin), 9000)) ||
      (await fetchImageBytes(absoluteUrl, 6000))
    if (!escolhida) return null

    const format = escolhida.contentType.includes('png')
      ? 'PNG'
      : escolhida.contentType.includes('webp')
      ? 'WEBP'
      : 'JPEG'
    return {
      dataUrl: `data:${escolhida.contentType};base64,${escolhida.bytes.toString('base64')}`,
      format,
    }
  } catch {
    return null
  }
}

export async function generateFlashcardManualPdf(
  deck: FlashcardManualDeck & { _id?: unknown },
  cards: FlashcardManualCard[],
  user: PdfUser,
  origin: string
): Promise<ArrayBuffer> {
  // `compress: true` liga o filtro Flate nos content streams. O documento é
  // quase todo operação de texto — duas páginas por card, cabeçalho e rodapé em
  // cada uma —, e esse é o tipo de conteúdo que comprime muito bem. Custa
  // alguns milissegundos de CPU e derruba boa parte do arquivo final.
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  let y = 0

  const imageUrls = new Set<string>()
  if (deck.coverImage) imageUrls.add(deck.coverImage)
  for (const card of cards) {
    if (card.front?.image) imageUrls.add(card.front.image)
    if (card.back?.image) imageUrls.add(card.back.image)
  }

  const imageEntries = await Promise.all(
    Array.from(imageUrls).map(async url => [url, await fetchImageAsDataUrl(url, origin)] as const)
  )
  const images = new Map<string, ImageData | null>(imageEntries)

  function setFont(style: TextStyle = 'normal', size = 10) {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }

  function addHeader(subtitle = 'Flashcards') {
    doc.setFillColor(...VERDE_ESCURO)
    doc.rect(0, 0, pageWidth, 30, 'F')
    doc.setFillColor(...LARANJA)
    doc.rect(pageWidth - 58, 0, 58, 30, 'F')

    setFont('bold', 16)
    doc.setTextColor(255, 255, 255)
    doc.text('DomineAqui', margin, 13)
    setFont('normal', 9)
    doc.text(subtitle, margin, 22)
    setFont('normal', 8)
    doc.text('domineaqui.com.br', pageWidth - margin, 18, { align: 'right' })

    doc.setTextColor(...CINZA_TEXTO)
    return 42
  }

  function addPage() {
    doc.addPage()
    y = addHeader('Flashcards')
  }

  function ensureSpace(required: number) {
    if (y + required > pageHeight - 25) addPage()
  }

  function drawRichLine(segments: TextSegment[], x: number, lineY: number, fontSize: number, color: RGB = CINZA_TEXTO) {
    let cx = x
    for (const segment of segments) {
      setFont(segment.style, fontSize)
      doc.setTextColor(...color)
      doc.text(segment.text, cx, lineY)
      cx += doc.getTextWidth(segment.text)
    }
  }

  function renderRichText(
    text: string,
    x: number,
    maxWidth: number,
    options: { fontSize?: number; lineHeight?: number; color?: RGB; fallback?: string } = {}
  ) {
    const fontSize = options.fontSize ?? 10
    const lineHeight = options.lineHeight ?? 5.8
    const color = options.color ?? CINZA_TEXTO
    const content = cleanText(text) || options.fallback || ''
    if (!content) return

    const paragraphs = content.split('\n')
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        y += lineHeight
        continue
      }

      const chunks = splitSegmentsIntoChunks(tokenizeInline(paragraph))
      let line: TextSegment[] = []
      let lineWidth = 0

      for (const chunk of chunks) {
        setFont(chunk.style, fontSize)
        const width = doc.getTextWidth(chunk.text)
        const isSpace = /^\s+$/.test(chunk.text)

        if (!isSpace && line.length > 0 && lineWidth + width > maxWidth) {
          ensureSpace(lineHeight + 2)
          drawRichLine(line, x, y, fontSize, color)
          y += lineHeight
          line = []
          lineWidth = 0
        }

        if (line.length === 0 && isSpace) continue
        line.push(chunk)
        lineWidth += width
      }

      if (line.length) {
        ensureSpace(lineHeight + 2)
        drawRichLine(line, x, y, fontSize, color)
        y += lineHeight
      }
    }
  }

  function renderSectionTitle(title: string, tone: 'green' | 'orange' = 'green') {
    ensureSpace(14)
    const fill: RGB = tone === 'green' ? VERDE_MEDIO : LARANJA
    doc.setFillColor(...fill)
    doc.roundedRect(margin, y, contentWidth, 9, 2, 2, 'F')
    setFont('bold', 10)
    doc.setTextColor(255, 255, 255)
    doc.text(title, margin + 4, y + 6.2)
    doc.setTextColor(...CINZA_TEXTO)
    y += 14
  }

  function renderImage(url?: string, label = 'Imagem') {
    if (!url) return
    const image = images.get(url)
    if (!image) {
      setFont('italic', 8)
      doc.setTextColor(120, 120, 120)
      ensureSpace(7)
      doc.text(`${label} indisponível`, margin + 4, y)
      doc.setTextColor(...CINZA_TEXTO)
      y += 6
      return
    }

    try {
      const props = doc.getImageProperties(image.dataUrl)
      const maxWidth = contentWidth - 8
      const maxHeight = 82
      const ratio = Math.min(maxWidth / props.width, maxHeight / props.height, 1)
      const width = props.width * ratio
      const height = props.height * ratio
      ensureSpace(height + 10)
      const x = margin + (contentWidth - width) / 2
      doc.setDrawColor(...CINZA_BORDA)
      doc.setLineWidth(0.3)
      doc.roundedRect(x - 2, y - 2, width + 4, height + 4, 2, 2, 'S')
      // Sem `alias` nem nível de compressão explícitos: o jsPDF já deriva o
      // alias do conteúdo (a mesma figura em vários cards vira um XObject só)
      // e o seu padrão comprime o PNG melhor do que 'FAST' — medido, passar os
      // dois à mão engordava o arquivo em vez de enxugá-lo.
      doc.addImage(image.dataUrl, image.format, x, y, width, height)
      y += height + 9
    } catch {
      setFont('italic', 8)
      doc.setTextColor(120, 120, 120)
      ensureSpace(7)
      doc.text(`${label} não pôde ser inserida`, margin + 4, y)
      doc.setTextColor(...CINZA_TEXTO)
      y += 6
    }
  }

  function renderRatingBoxes() {
    const labels = [
      { title: 'Fácil', detail: 'acertei sem esforço' },
      { title: 'Médio', detail: 'acertei com dúvida' },
      { title: 'Difícil', detail: 'errei ou travei' },
    ]
    const gap = 4
    const boxWidth = (contentWidth - gap * 2) / 3
    ensureSpace(18)
    labels.forEach((item, index) => {
      const x = margin + index * (boxWidth + gap)
      doc.setDrawColor(...CINZA_BORDA)
      doc.setFillColor(250, 252, 250)
      doc.roundedRect(x, y, boxWidth, 14, 2, 2, 'FD')
      doc.setDrawColor(...VERDE_MEDIO)
      doc.rect(x + 4, y + 4, 4.5, 4.5)
      setFont('bold', 8.5)
      doc.setTextColor(...VERDE_ESCURO)
      doc.text(item.title, x + 11, y + 6.8)
      setFont('normal', 7)
      doc.setTextColor(90, 90, 90)
      doc.text(item.detail, x + 11, y + 11)
    })
    doc.setTextColor(...CINZA_TEXTO)
    y += 20
  }

  y = addHeader('Flashcards')

  if (deck.coverImage) {
    renderImage(deck.coverImage, 'Capa')
  }

  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'FD')
  setFont('bold', 15)
  doc.setTextColor(...VERDE_ESCURO)
  const titleLines = doc.splitTextToSize(cleanText(deck.title), contentWidth - 12)
  doc.text(titleLines.slice(0, 2), pageWidth / 2, y + 11, { align: 'center' })
  setFont('normal', 8.5)
  doc.setTextColor(...CINZA_TEXTO)
  doc.text(`Nome: ${cleanText(user.name)}`, margin + 6, y + 25)
  doc.text(`${cards.length} cartões`, pageWidth - margin - 6, y + 25, { align: 'right' })
  y += 44

  renderSectionTitle('Orientações', 'green')
  renderRichText(
    [
      '1. Leia a frente do card e responda antes de olhar o verso.',
      '2. Confira a resposta e leia a resposta comentada quando existir.',
      '3. Marque uma dificuldade em cada card para montar sua revisão.',
      'Modo normal: percorra o deck na ordem.',
      'Fixação intensa: priorize cards novos, vencidos ou marcados como difíceis.',
      'Palavra oculta: descubra a palavra escondida antes de ver o verso.',
    ].join('\n'),
    margin,
    contentWidth,
    { fontSize: 9.5, lineHeight: 5.7 }
  )
  y += 3
  renderRatingBoxes()
  renderRichText(
    'Fácil: revise depois de mais tempo.\nMédio: revise em breve.\nDifícil: volte nesse card hoje ou amanhã.',
    margin,
    contentWidth,
    { fontSize: 9, lineHeight: 5.3 }
  )
  y += 7

  function startCardPage(title: string, tone: 'green' | 'orange' = 'green') {
    addPage()
    renderSectionTitle(title, tone)
  }

  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index]
    const tone = card.kind === 'hidden_word' ? 'orange' : 'green'

    startCardPage(`Card ${index + 1} - Frente`, tone)
    renderRatingBoxes()

    setFont('bold', 10)
    doc.setTextColor(...VERDE_ESCURO)
    doc.text('Frente', margin, y)
    y += 6
    renderRichText(frontTextForCard(card), margin + 2, contentWidth - 4, {
      fontSize: 10,
      lineHeight: 5.8,
      fallback: '(sem texto)',
    })
    y += 2
    renderImage(card.front?.image, 'Imagem da frente')

    if (card.kind === 'hidden_word' && card.hiddenWord?.hint) {
      setFont('bold', 9)
      doc.setTextColor(...LARANJA)
      ensureSpace(7)
      doc.text('Dica', margin, y)
      y += 5
      renderRichText(card.hiddenWord.hint, margin + 2, contentWidth - 4, { fontSize: 9, lineHeight: 5.2 })
      y += 2
    }

    y += 4
    setFont('italic', 8.5)
    doc.setTextColor(95, 110, 100)
    ensureSpace(7)
    doc.text('Vire a página para conferir o verso.', margin, y)

    startCardPage(`Card ${index + 1} - Verso`, tone)
    setFont('bold', 10)
    doc.setTextColor(...VERDE_ESCURO)
    doc.text('Verso', margin, y)
    y += 6
    renderRichText(backTextForCard(card), margin + 2, contentWidth - 4, {
      fontSize: 10,
      lineHeight: 5.8,
      fallback: '(sem resposta)',
    })
    y += 2
    renderImage(card.back?.image, 'Imagem do verso')

    if (card.comment) {
      ensureSpace(18)
      doc.setFillColor(248, 250, 248)
      doc.setDrawColor(...VERDE_MEDIO)
      doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'FD')
      setFont('bold', 9.5)
      doc.setTextColor(...VERDE_ESCURO)
      doc.text('Resposta comentada', margin + 4, y + 6.5)
      y += 15
      renderRichText(card.comment, margin + 4, contentWidth - 8, { fontSize: 9.2, lineHeight: 5.4 })
      y += 3
    }

    y += 8
  }

  const totalPages = doc.getNumberOfPages()
  const date = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    const footerY = pageHeight - 14
    doc.setFillColor(...CINZA_CLARO)
    doc.rect(0, footerY - 5, pageWidth, 18, 'F')
    doc.setDrawColor(...VERDE_MEDIO)
    doc.setLineWidth(0.7)
    doc.line(0, footerY - 5, pageWidth * 0.7, footerY - 5)
    doc.setDrawColor(...LARANJA)
    doc.line(pageWidth * 0.7, footerY - 5, pageWidth, footerY - 5)
    setFont('bold', 8)
    doc.setTextColor(...VERDE_ESCURO)
    doc.text('DomineAqui', margin, footerY + 1)
    setFont('normal', 7)
    doc.setTextColor(90, 90, 90)
    doc.text(`Gerado em ${date}`, pageWidth / 2, footerY + 1, { align: 'center' })
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - margin, footerY + 1, { align: 'right' })
  }

  return doc.output('arraybuffer')
}
