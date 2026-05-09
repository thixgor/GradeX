import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS, isValidObjectId } from '@/lib/flashcard-manual'
import type { FlashcardManualShare } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function loadDeck(db: any, idOrSlug: string) {
  if (isValidObjectId(idOrSlug)) {
    const byId = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ _id: new ObjectId(idOrSlug) })
    if (byId) return byId
  }
  return db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ slug: idOrSlug })
}

// POST — compartilhar deck com um usuário (por email ou userId)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const deck = await loadDeck(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin'
    if (deck.ownerId !== session.userId && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const targetEmail = body.email ? String(body.email).trim().toLowerCase() : ''
    const targetUserId = body.userId ? String(body.userId) : ''
    const message = body.message ? String(body.message).slice(0, 300) : ''

    let target: any = null
    if (targetUserId && isValidObjectId(targetUserId)) {
      target = await db.collection('users').findOne({ _id: new ObjectId(targetUserId) }, { projection: { email: 1, name: 1 } })
    }
    if (!target && targetEmail) {
      target = await db.collection('users').findOne(
        { email: { $regex: new RegExp(`^${targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { projection: { email: 1, name: 1 } }
      )
    }
    if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const targetIdStr = String(target._id)
    if (targetIdStr === session.userId) {
      return NextResponse.json({ error: 'Você não pode compartilhar com você mesmo' }, { status: 400 })
    }

    // Evita duplicatas (mesmo deck + mesmo destinatário)
    const existing = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.shares).findOne({
      deckId: String(deck._id),
      toUserId: targetIdStr,
      status: { $in: ['pending', 'accepted'] },
    })
    if (existing) {
      return NextResponse.json({ share: { ...existing, _id: String(existing._id) }, alreadyShared: true })
    }

    const share: FlashcardManualShare = {
      deckId: String(deck._id),
      fromUserId: session.userId,
      fromUserName: session.name || 'Usuário',
      toUserId: targetIdStr,
      toUserEmail: target.email,
      status: 'pending',
      message,
      createdAt: new Date(),
    }
    const inserted = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.shares).insertOne(share as any)
    return NextResponse.json({ share: { ...share, _id: String(inserted.insertedId) } }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao compartilhar deck:', error)
    return NextResponse.json({ error: error.message || 'Erro ao compartilhar' }, { status: 500 })
  }
}

// GET — lista compartilhamentos do deck (apenas dono)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const db = await getDb()
    const deck = await loadDeck(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })
    if (deck.ownerId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    const shares = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.shares)
      .find({ deckId: String(deck._id) })
      .sort({ createdAt: -1 })
      .toArray()
    return NextResponse.json({ shares: shares.map((s: any) => ({ ...s, _id: String(s._id) })) })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar compartilhamentos' }, { status: 500 })
  }
}
