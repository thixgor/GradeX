import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  FLASHCARD_MANUAL_COLLECTIONS,
  getUserGroups,
  isValidObjectId,
  resolveDeckAccess,
} from '@/lib/flashcard-manual'
import { applyWatermark } from '@/lib/pdf-watermark'
import { flashcardPdfFileName, generateFlashcardManualPdf } from '@/lib/flashcard-manual-pdf'
import type { FlashcardManualCard, FlashcardManualDeck, User } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function findDeckByIdOrSlug(db: any, idOrSlug: string): Promise<(FlashcardManualDeck & { _id: ObjectId }) | null> {
  if (isValidObjectId(idOrSlug)) {
    const byId = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ _id: new ObjectId(idOrSlug) })
    if (byId) return byId
  }
  return await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ slug: idOrSlug })
}

function encodeContentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const deck = await findDeckByIdOrSlug(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const user = await db.collection<User>('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { name: 1, email: 1, accountType: 1, secondaryRole: 1, role: 1 } }
    )
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin' || user.role === 'admin'
    if (deck.isHidden && !isAdmin && deck.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Deck indisponível' }, { status: 404 })
    }

    if (deck.pdfDownloadEnabled !== true && !isAdmin) {
      return NextResponse.json({ error: 'Download em PDF não está liberado para este deck' }, { status: 403 })
    }

    const access = await resolveDeckAccess({
      db,
      deck,
      userId: session.userId,
      userEmail: user.email || session.email || null,
      userGroups: getUserGroups(user),
      isAdmin,
    })

    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Sem acesso ao deck' }, { status: 403 })
    }

    const cards = await db
      .collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards)
      .find({ deckId: String(deck._id) })
      .sort({ index: 1 })
      .toArray()

    const origin = request.nextUrl.origin
    const pdf = await generateFlashcardManualPdf(deck, cards, {
      id: session.userId,
      name: user.name || session.name || 'Usuário',
      email: user.email || session.email || '',
    }, origin)

    const stamped = await applyWatermark(pdf, {
      userName: user.name || session.name || 'Usuário',
      userEmail: user.email || session.email || '',
      userId: session.userId,
      orderId: `flashcard-${String(deck._id)}-${Date.now().toString(36)}`,
      downloadedAt: new Date(),
    })

    db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks)
      .updateOne({ _id: deck._id }, { $inc: { pdfDownloadCount: 1 }, $set: { updatedAt: new Date() } })
      .catch(() => {})

    const filename = flashcardPdfFileName(deck.title)
    return new NextResponse(Buffer.from(stamped), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': encodeContentDisposition(filename),
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar PDF do deck:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF do deck' }, { status: 500 })
  }
}
