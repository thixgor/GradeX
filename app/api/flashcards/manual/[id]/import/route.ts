import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  FLASHCARD_MANUAL_COLLECTIONS,
  isValidObjectId,
  sanitizeCardSide,
  sanitizeHiddenWord,
} from '@/lib/flashcard-manual'
import { getFlashcardManualLimits } from '@/lib/flashcard-limits'
import type { FlashcardManualCard } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface ImportCard {
  kind?: 'standard' | 'hidden_word'
  front?: { text?: string; image?: string } | string
  back?: { text?: string; image?: string } | string
  hiddenWord?: { phrase?: string; word?: string; hint?: string }
  comment?: string
}

function parseCsv(text: string): ImportCard[] {
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
      const row: any = {}
      headers.forEach((h, idx) => { row[h] = cells[idx] })
      rows.push({
        front: row['front'] || row['frente'] || '',
        back: row['back'] || row['verso'] || '',
        comment: row['comment'] || row['comentario'] || row['resposta_comentada'] || '',
        hiddenWord: (row['hiddenword'] || row['palavra_oculta']) ? {
          phrase: row['phrase'] || row['frase'] || row['front'] || '',
          word: row['hiddenword'] || row['palavra_oculta'] || '',
          hint: row['hint'] || row['dica'] || '',
        } : undefined,
        kind: (row['hiddenword'] || row['palavra_oculta']) ? 'hidden_word' : 'standard',
      })
    } else {
      rows.push({ front: cells[0] || '', back: cells[1] || '', comment: cells[2] || '' })
    }
  }
  return rows
}

function splitCsvLine(line: string): string[] {
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

function parseMarkdown(text: string): ImportCard[] {
  // Split blocks by horizontal rules (--- or ***)
  const blocks = text.split(/\n[ \t]*---+[ \t]*\n|\n[ \t]*\*\*\*+[ \t]*\n/)
  const cards: ImportCard[] = []

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    // Find all ## headings and their content
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
      sections[key.toLowerCase()] = trimmed.slice(endIndex, nextStart).trim()
    }

    const front = sections['frente'] || sections['front'] || ''
    const back = sections['verso'] || sections['back'] || ''
    const comment = sections['comentário'] || sections['comentario'] || sections['comment'] || ''

    if (front || back) {
      cards.push({
        front,
        back,
        comment: comment || undefined,
      })
    }
  }

  return cards
}

function normalizeSide(value: any): { text: string; image?: string } {
  if (typeof value === 'string') return sanitizeCardSide({ text: value })
  return sanitizeCardSide(value || {})
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const decks = db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks)
    const deck = isValidObjectId(params.id)
      ? await decks.findOne({ _id: new ObjectId(params.id) })
      : await decks.findOne({ slug: params.id })
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin'
    if (deck.ownerId !== session.userId && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const format = body.format === 'csv' ? 'csv' : body.format === 'markdown' ? 'markdown' : 'json'
    const text = String(body.payload || '')
    let parsed: ImportCard[] = []
    try {
      if (format === 'csv') {
        parsed = parseCsv(text)
      } else if (format === 'markdown') {
        parsed = parseMarkdown(text)
      } else {
        const json = typeof body.payload === 'string' ? JSON.parse(body.payload) : body.payload
        parsed = Array.isArray(json) ? json : []
      }
    } catch (e: any) {
      return NextResponse.json({ error: 'Formato inválido: ' + e.message }, { status: 400 })
    }

    if (!parsed.length) return NextResponse.json({ error: 'Nenhum cartão válido encontrado' }, { status: 400 })

    const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) })
    const limits = getFlashcardManualLimits(user?.accountType, isAdmin)
    const cardsCol = db.collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards)
    const currentCount = await cardsCol.countDocuments({ deckId: String(deck._id) })
    const room = Math.max(0, limits.cardsPerDeck - currentCount)
    const toImport = parsed.slice(0, room)
    if (toImport.length === 0) {
      return NextResponse.json({ error: `Limite de cartões atingido (${limits.cardsPerDeck}).`, requiresUpgrade: true }, { status: 403 })
    }

    const now = new Date()
    const docs: FlashcardManualCard[] = toImport.map((row, idx) => {
      const kind: 'standard' | 'hidden_word' = row.kind === 'hidden_word' ? 'hidden_word' : 'standard'
      return {
        deckId: String(deck._id),
        index: currentCount + idx,
        kind,
        front: normalizeSide(row.front),
        back: normalizeSide(row.back),
        hiddenWord: kind === 'hidden_word' ? sanitizeHiddenWord(row.hiddenWord) : undefined,
        comment: row.comment ? String(row.comment).slice(0, 2500) : undefined,
        createdAt: now,
        updatedAt: now,
      }
    })

    await cardsCol.insertMany(docs)
    await decks.updateOne({ _id: deck._id }, { $inc: { cardCount: docs.length }, $set: { updatedAt: now } })

    return NextResponse.json({ imported: docs.length, skipped: parsed.length - docs.length })
  } catch (error: any) {
    console.error('Erro ao importar cards:', error)
    return NextResponse.json({ error: error.message || 'Erro ao importar' }, { status: 500 })
  }
}
