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
import { buildImportCards, type ImportFormat } from '@/lib/flashcard-import'
import type { FlashcardManualCard } from '@/lib/types'

export const dynamic = 'force-dynamic'

function parseFormat(value: unknown): ImportFormat {
  if (value === 'csv' || value === 'markdown' || value === 'images') return value
  return 'json'
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
    const format = parseFormat(body.format)

    let built
    try {
      built = buildImportCards({
        format,
        payload: body.payload,
        images: body.images,
        imageMode: body.imageMode,
      })
    } catch (e: any) {
      return NextResponse.json({ error: 'Formato inválido: ' + e.message }, { status: 400 })
    }

    const parsed = built.cards
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
    const docs: FlashcardManualCard[] = toImport.map((row, idx) => ({
      deckId: String(deck._id),
      index: currentCount + idx,
      kind: row.kind,
      front: sanitizeCardSide(row.front),
      back: sanitizeCardSide(row.back),
      hiddenWord: row.kind === 'hidden_word' ? sanitizeHiddenWord(row.hiddenWord) : undefined,
      comment: row.comment ? String(row.comment).slice(0, 2500) : undefined,
      createdAt: now,
      updatedAt: now,
    }))

    await cardsCol.insertMany(docs)
    await decks.updateOne({ _id: deck._id }, { $inc: { cardCount: docs.length }, $set: { updatedAt: now } })

    return NextResponse.json({
      imported: docs.length,
      skipped: parsed.length - docs.length,
      imagesUsed: built.usedImages,
      imagesLeftover: built.leftoverImages,
    })
  } catch (error: any) {
    console.error('Erro ao importar cards:', error)
    return NextResponse.json({ error: error.message || 'Erro ao importar' }, { status: 500 })
  }
}
