/**
 * Parsing e montagem dos cartões vindos da tela "Importar cartões".
 *
 * O gargalo real da importação nunca foi o texto — LLMs geram o Markdown de
 * frente/verso sem esforço. Era a imagem: cada uma precisava ser hospedada
 * fora (Imgur), copiada e colada uma a uma nos campos do cartão. Este módulo
 * existe para que o usuário só precise mandar as imagens na ordem em que elas
 * aparecem no baralho — imagem 1 frente, imagem 2 verso, imagem 3 frente... —
 * e o mapeamento para os cartões acontece aqui.
 *
 * Sem dependência de banco ou de rede: tudo é função pura, para que a rota de
 * importação e os testes usem exatamente a mesma lógica.
 */

export type ImportFormat = 'json' | 'csv' | 'markdown' | 'images'

/**
 * Como distribuir as imagens enviadas entre os cartões.
 *
 * - `alternate`: 1ª imagem na frente do cartão 1, 2ª no verso do cartão 1, 3ª
 *   na frente do cartão 2... É o caso comum (e o padrão).
 * - `front` / `back`: uma imagem por cartão, sempre do mesmo lado.
 * - `none`: ignora a ordem; só valem os marcadores escritos no texto.
 */
export type ImageMode = 'alternate' | 'front' | 'back' | 'none'

export interface ImportCard {
  kind?: 'standard' | 'hidden_word'
  front?: { text?: string; image?: string } | string
  back?: { text?: string; image?: string } | string
  hiddenWord?: { phrase?: string; word?: string; hint?: string }
  comment?: string
}

export interface NormalizedImportCard {
  kind: 'standard' | 'hidden_word'
  front: { text: string; image?: string }
  back: { text: string; image?: string }
  hiddenWord?: { phrase?: string; word?: string; hint?: string }
  comment?: string
}

/** Onde uma imagem enviada foi parar, na posição correspondente da lista. */
export interface ImageAssignment {
  cardIndex: number
  side: 'front' | 'back'
}

export interface ApplyImagesResult {
  cards: NormalizedImportCard[]
  /** Quantas das imagens enviadas foram efetivamente usadas. */
  usedImages: number
  /** Imagens enviadas que sobraram sem cartão para receber. */
  leftoverImages: number
  /** Paralelo à lista de imagens: destino de cada uma, ou null se sobrou. */
  assignments: Array<ImageAssignment | null>
}

export const IMPORT_IMAGE_LIMIT = 200

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      out.push(current); current = ''
    } else {
      current += c
    }
  }
  out.push(current)
  return out.map(c => c.trim())
}

export function parseCsv(text: string): ImportCard[] {
  // CSV simples: "front","back","comment","hiddenWord"
  // Aceita aspas duplas e separador vírgula. Não suporta multi-linha entre aspas.
  const rows: ImportCard[] = []
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return rows

  const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase().trim())
  const hasHeader = headers.includes('front') || headers.includes('frente')

  const startIdx = hasHeader ? 1 : 0
  for (let i = startIdx; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    if (cells.length === 0) continue
    if (hasHeader) {
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => { row[h] = cells[idx] })
      const hidden = row['hiddenword'] || row['palavra_oculta']
      rows.push({
        front: { text: row['front'] || row['frente'] || '', image: row['front_image'] || row['imagem_frente'] || undefined },
        back: { text: row['back'] || row['verso'] || '', image: row['back_image'] || row['imagem_verso'] || undefined },
        comment: row['comment'] || row['comentario'] || row['resposta_comentada'] || '',
        hiddenWord: hidden ? {
          phrase: row['phrase'] || row['frase'] || row['front'] || '',
          word: hidden,
          hint: row['hint'] || row['dica'] || '',
        } : undefined,
        kind: hidden ? 'hidden_word' : 'standard',
      })
    } else {
      rows.push({ front: cells[0] || '', back: cells[1] || '', comment: cells[2] || '' })
    }
  }
  return rows
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

export function parseMarkdown(text: string): ImportCard[] {
  // Separa os blocos por régua horizontal (--- ou ***)
  const blocks = text.split(/\n[ \t]*---+[ \t]*\n|\n[ \t]*\*\*\*+[ \t]*\n/)
  const cards: ImportCard[] = []

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    // Localiza todos os títulos ## e o conteúdo de cada um
    const sections: Record<string, string> = {}
    const headingRegex = /^#{1,3}\s+(.+)$/gm
    const matches: Array<{ key: string; endIndex: number; startIndex: number }> = []
    let m: RegExpExecArray | null

    while ((m = headingRegex.exec(trimmed)) !== null) {
      matches.push({ key: m[1].trim(), startIndex: m.index, endIndex: m.index + m[0].length })
    }

    for (let i = 0; i < matches.length; i++) {
      const { key, endIndex } = matches[i]
      const nextStart = i + 1 < matches.length ? matches[i + 1].startIndex : trimmed.length
      sections[normalizeHeading(key)] = trimmed.slice(endIndex, nextStart).trim()
    }

    const hasFront = 'frente' in sections || 'front' in sections
    const hasBack = 'verso' in sections || 'back' in sections
    const front = sections['frente'] ?? sections['front'] ?? ''
    const back = sections['verso'] ?? sections['back'] ?? ''
    const comment = sections['comentario'] ?? sections['comment'] ?? ''

    // Um cartão só de imagem tem `## Frente` vazio — o cabeçalho presente já é
    // a intenção do usuário, então basta ele existir.
    if (hasFront || hasBack) {
      cards.push({ front, back, comment: comment || undefined })
    }
  }

  return cards
}

/** "Comentário" e "comentario" são o mesmo cabeçalho. */
function normalizeHeading(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// ---------------------------------------------------------------------------
// Marcadores de imagem no texto
// ---------------------------------------------------------------------------

/**
 * Marcadores aceitos, todos 1-indexados sobre a lista de imagens enviadas:
 * `{{img1}}`, `{{imagem 1}}`, `[[img:1]]`, `![legenda](img1)`, `![](imagem1)`.
 *
 * Existem para o caso em que a ordem alternada não serve — um cartão só com
 * imagem no verso, uma imagem repetida em dois cartões, etc. O LLM consegue
 * escrever isso no meio do Markdown sem saber nenhuma URL.
 */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /!\[[^\]]*\]\(\s*(?:img|imagem|image)\s*[-_ ]?(\d{1,3})\s*\)/gi,
  /\{\{\s*(?:img|imagem|image)\s*[-_ ]?(\d{1,3})\s*\}\}/gi,
  /\[\[\s*(?:img|imagem|image)\s*[:\-_ ]\s*(\d{1,3})\s*\]\]/gi,
]

interface PlaceholderExtraction {
  text: string
  indexes: number[]
}

/** Remove os marcadores do texto e devolve os índices (0-based) citados. */
export function extractImagePlaceholders(text: string): PlaceholderExtraction {
  const indexes: number[] = []
  let out = text
  for (const pattern of PLACEHOLDER_PATTERNS) {
    out = out.replace(new RegExp(pattern.source, pattern.flags), (_full, num: string) => {
      const n = Number.parseInt(num, 10)
      if (Number.isFinite(n) && n >= 1) indexes.push(n - 1)
      return ''
    })
  }
  // O marcador costuma ocupar uma linha inteira; tirá-lo deixaria linhas em
  // branco no meio do texto do cartão.
  out = out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return { text: out, indexes }
}

// ---------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------

/** Aceita apenas http(s) e caminhos internos; devolve undefined para o resto. */
export function sanitizeImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.length > 500) return undefined
  if (trimmed.startsWith('/')) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return trimmed
  } catch {
    return undefined
  }
}

export function sanitizeImageList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    const url = sanitizeImageUrl(item)
    if (url) out.push(url)
    if (out.length >= IMPORT_IMAGE_LIMIT) break
  }
  return out
}

// ---------------------------------------------------------------------------
// Normalização e distribuição
// ---------------------------------------------------------------------------

function sideOf(value: ImportCard['front']): { text: string; image?: string } {
  if (typeof value === 'string') return { text: value }
  return { text: String(value?.text || ''), image: sanitizeImageUrl(value?.image) }
}

export function normalizeCard(row: ImportCard): NormalizedImportCard {
  const kind: 'standard' | 'hidden_word' = row.kind === 'hidden_word' ? 'hidden_word' : 'standard'
  return {
    kind,
    front: sideOf(row.front),
    back: sideOf(row.back),
    hiddenWord: kind === 'hidden_word' ? row.hiddenWord : undefined,
    comment: row.comment ? String(row.comment) : undefined,
  }
}

export function parseImportPayload(format: ImportFormat, payload: unknown): ImportCard[] {
  if (format === 'images') return []
  if (format === 'csv') return parseCsv(String(payload ?? ''))
  if (format === 'markdown') return parseMarkdown(String(payload ?? ''))
  const json = typeof payload === 'string' ? JSON.parse(payload) : payload
  return Array.isArray(json) ? json : []
}

/**
 * Quantos cartões um lote de imagens gera sozinho, sem nenhum texto.
 * Em `alternate` cada cartão consome duas imagens (frente e verso); uma imagem
 * ímpar sobrando ainda vira um cartão só de frente, para não descartá-la.
 */
export function cardCountForImages(count: number, mode: ImageMode): number {
  if (count <= 0) return 0
  if (mode === 'alternate') return Math.ceil(count / 2)
  if (mode === 'none') return 0
  return count
}

/** Cartões vazios que só carregam as imagens, na ordem em que foram enviadas. */
export function buildCardsFromImages(images: string[], mode: ImageMode): NormalizedImportCard[] {
  const total = cardCountForImages(images.length, mode)
  const cards: NormalizedImportCard[] = []
  for (let i = 0; i < total; i++) {
    cards.push({ kind: 'standard', front: { text: '' }, back: { text: '' } })
  }
  return applyImagesToCards(cards, images, mode).cards
}

/**
 * Costura as imagens nos cartões já parseados.
 *
 * Ordem de precedência: marcadores escritos no texto vencem, e só as imagens
 * que sobrarem entram na distribuição automática. Assim o usuário pode fixar
 * uma ou outra imagem sem perder a comodidade do "manda tudo na ordem".
 */
export function applyImagesToCards(
  cards: NormalizedImportCard[],
  images: string[],
  mode: ImageMode,
): ApplyImagesResult {
  const assignments: Array<ImageAssignment | null> = images.map(() => null)
  const used = new Set<number>()

  const resolved: NormalizedImportCard[] = cards.map((card, cardIndex) => {
    const front = { ...card.front }
    const back = { ...card.back }

    for (const sideName of ['front', 'back'] as const) {
      const side = sideName === 'front' ? front : back
      const { text, indexes } = extractImagePlaceholders(side.text || '')
      side.text = text
      for (const idx of indexes) {
        if (idx >= images.length) continue
        if (!side.image) {
          side.image = images[idx]
          if (!assignments[idx]) assignments[idx] = { cardIndex, side: sideName }
        }
        used.add(idx)
      }
    }

    let comment = card.comment
    if (comment) {
      // O comentário não tem campo de imagem próprio; o marcador ali só
      // marcaria a imagem como usada sem exibi-la, então some com ele.
      comment = extractImagePlaceholders(comment).text || undefined
    }

    return { ...card, front, back, comment }
  })

  if (mode !== 'none') {
    const queue = images.map((url, idx) => ({ url, idx })).filter(item => !used.has(item.idx))
    let cursor = 0
    for (let cardIndex = 0; cardIndex < resolved.length; cardIndex++) {
      if (cursor >= queue.length) break
      const card = resolved[cardIndex]
      // Palavra oculta entra na fila como qualquer outro cartão: ela tem
      // `front.image` e `back.image` próprios, oferecidos no editor e
      // renderizados no card. Pulá-la desalinhava tudo daquele ponto em
      // diante — a imagem 1 caía no cartão 2 e o baralho inteiro andava.
      const sides: Array<'front' | 'back'> =
        mode === 'front' ? ['front'] : mode === 'back' ? ['back'] : ['front', 'back']
      for (const side of sides) {
        if (cursor >= queue.length) break
        if (card[side].image) continue
        card[side] = { ...card[side], image: queue[cursor].url }
        assignments[queue[cursor].idx] = { cardIndex, side }
        used.add(queue[cursor].idx)
        cursor++
      }
    }
  }

  return {
    cards: resolved,
    usedImages: used.size,
    leftoverImages: Math.max(0, images.length - used.size),
    assignments,
  }
}

/** Um cartão sem texto e sem imagem nos dois lados não vale a linha no banco. */
export function isEmptyCard(card: NormalizedImportCard): boolean {
  if (card.kind === 'hidden_word') {
    return !card.hiddenWord?.phrase || !card.hiddenWord?.word
  }
  return !card.front.text.trim() && !card.front.image && !card.back.text.trim() && !card.back.image
}

/**
 * Ponto único usado pela rota e pelo preview da tela: texto + imagens entram,
 * cartões prontos saem.
 */
export function buildImportCards(input: {
  format: ImportFormat
  payload: unknown
  images?: unknown
  imageMode?: unknown
}): ApplyImagesResult {
  const images = sanitizeImageList(input.images)
  const mode: ImageMode =
    input.imageMode === 'front' || input.imageMode === 'back' || input.imageMode === 'none'
      ? input.imageMode
      : 'alternate'

  const parsed = parseImportPayload(input.format, input.payload).map(normalizeCard)

  // Sem texto nenhum, as imagens sozinhas já são o baralho.
  const base = parsed.length === 0
    ? Array.from({ length: cardCountForImages(images.length, mode) }, () => ({
        kind: 'standard' as const,
        front: { text: '' },
        back: { text: '' },
      }))
    : parsed

  const result = applyImagesToCards(base, images, mode)

  // Um cartão que ficou sem texto e sem imagem não entra no baralho, e os
  // índices das imagens precisam acompanhar essa renumeração.
  const survivors: number[] = []
  const cards = result.cards.filter((card, idx) => {
    if (isEmptyCard(card)) return false
    survivors[idx] = survivors.length
    return true
  })

  const assignments = result.assignments.map(a =>
    a && survivors[a.cardIndex] !== undefined ? { ...a, cardIndex: survivors[a.cardIndex] } : null,
  )
  const usedImages = assignments.filter(Boolean).length

  return {
    cards,
    assignments,
    usedImages,
    leftoverImages: images.length - usedImages,
  }
}
