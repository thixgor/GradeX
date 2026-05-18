import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  FLASHCARD_MANUAL_COLLECTIONS,
  normalizeDeckForResponse,
  normalizeCardForResponse,
  resolveDeckAccess,
  sanitizeDeckTitle,
  sanitizeDescription,
  sanitizeTags,
  isValidObjectId,
  getUserGroups,
  FLASHCARD_MANUAL_VALID_GROUPS,
} from '@/lib/flashcard-manual'
import {
  FLASHCARD_SPACED_PROGRESS_COLLECTION,
  calculateSpacedStats,
  normalizeSpacedProgressForResponse,
  sortCardsForSpacedRepetition,
} from '@/lib/flashcard-spaced-repetition'
import { syncMaterialForFlashcardDeck } from '@/lib/flashcard-material-sync'
import type { FlashcardManualDeck, FlashcardManualCard, FlashcardSpacedProgress } from '@/lib/types'
import { getPricingEventStateById, serializePricingEventState } from '@/lib/pricing-events'

export const dynamic = 'force-dynamic'

async function findDeckByIdOrSlug(db: any, idOrSlug: string): Promise<(FlashcardManualDeck & { _id: ObjectId }) | null> {
  if (isValidObjectId(idOrSlug)) {
    const byId = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ _id: new ObjectId(idOrSlug) })
    if (byId) return byId
  }
  const bySlug = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ slug: idOrSlug })
  return bySlug || null
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    const db = await getDb()
    const deck = await findDeckByIdOrSlug(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const isAuthenticated = !!session
    const isAdmin = session?.role === 'admin'
    const userDoc = session ? await db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { accountType: 1, secondaryRole: 1, email: 1, name: 1, emailVerified: 1 } }
    ) : null
    const userGroups = getUserGroups(userDoc as any)

    const resolvedAccess = await resolveDeckAccess({
      db,
      deck,
      userId: session?.userId || null,
      userEmail: userDoc?.email || session?.email || null,
      userGroups,
      isAdmin,
    })
    const access = isAuthenticated
      ? resolvedAccess
      : {
          ...resolvedAccess,
          hasAccess: false,
          isOwner: false,
          isPurchased: false,
          hasShareAccess: false,
          reasons: resolvedAccess.reasons.filter(reason => reason === 'public' || reason === 'unlisted' || reason === 'free_admin_deck'),
          reason: null,
        }

    if (deck.isHidden && !isAdmin && !access.isOwner) {
      return NextResponse.json({ error: 'Deck indisponível' }, { status: 404 })
    }

    const isPublicPreviewable =
      (deck.ownerType === 'admin' && deck.visibility !== 'private') ||
      ((deck.visibility === 'public' || deck.visibility === 'unlisted') && deck.isPublished)

    if (!isAuthenticated && !isPublicPreviewable) {
      return NextResponse.json({ error: 'Deck indisponível' }, { status: 404 })
    }

    // Visibilidade pública/unlisted: só inclui cards se tem acesso
    let cards: FlashcardManualCard[] = []
    let progressByCardId = new Map<string, FlashcardSpacedProgress>()
    let spacedStats = { dueToday: 0, newCards: 0, mastered: 0, difficult: 0 }
    if (access.hasAccess) {
      const cardDocs = await db
        .collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards)
        .find({ deckId: String(deck._id) })
        .sort({ index: 1 })
        .toArray()
      const progressDocs = await db
        .collection<FlashcardSpacedProgress>(FLASHCARD_SPACED_PROGRESS_COLLECTION)
        .find({ deckId: String(deck._id), userId: session!.userId })
        .toArray()
      progressByCardId = new Map(progressDocs.map(progress => [progress.cardId, progress]))
      spacedStats = calculateSpacedStats(cardDocs as any, progressByCardId)

      const studyMode = request.nextUrl.searchParams.get('studyMode')
      const orderedCards = studyMode === 'spaced'
        ? sortCardsForSpacedRepetition(cardDocs as any, progressByCardId)
        : cardDocs

      cards = orderedCards.map(card => {
        const normalized = normalizeCardForResponse(card)
        const progress = progressByCardId.get(String(card._id))
        return {
          ...normalized,
          spacedProgress: progress ? normalizeSpacedProgressForResponse(progress) : null,
        } as any
      })
    }

    // Incrementar viewCount (fire-and-forget) — apenas para visitantes não-donos
    if (!access.isOwner) {
      db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks)
        .updateOne({ _id: deck._id }, { $inc: { viewCount: 1 } })
        .catch(() => {})
    }

    // Lote dinâmico por evento
    const pricingEventState = deck.pricingEventId
      ? await getPricingEventStateById(db, String(deck.pricingEventId))
      : null

    const res = NextResponse.json({
      deck: normalizeDeckForResponse(deck),
      cards,
      spacedRepetition: {
        stats: spacedStats,
      },
      access: { ...access, canManage: access.isOwner || isAdmin },
      viewer: {
        isAuthenticated,
        isAdmin,
        userId: session?.userId || null,
        emailVerified: !!userDoc?.emailVerified,
      },
      pricingEventState: serializePricingEventState(pricingEventState),
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Erro ao buscar deck:', error)
    return NextResponse.json({ error: 'Erro ao buscar deck' }, { status: 500 })
  }
}

// PATCH — atualizar metadados do deck (título, descrição, capa, tags, pasta, visibilidade, preço, allowedGroups)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const deck = await findDeckByIdOrSlug(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin'
    const isOwner = deck.ownerId === session.userId
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const body = await request.json()
    const updates: Partial<FlashcardManualDeck> = {}

    if (typeof body.title === 'string') {
      const t = sanitizeDeckTitle(body.title)
      if (!t) return NextResponse.json({ error: 'Título inválido' }, { status: 400 })
      updates.title = t
    }
    if (typeof body.description === 'string') updates.description = sanitizeDescription(body.description, 600)
    if (typeof body.coverImage === 'string') updates.coverImage = body.coverImage.slice(0, 500)
    if (Array.isArray(body.tags)) updates.tags = sanitizeTags(body.tags)
    if (typeof body.category === 'string') updates.category = body.category.slice(0, 60)
    if (body.folderId !== undefined) {
      updates.folderId = body.folderId && isValidObjectId(body.folderId) ? body.folderId : null
    }

    // Visibilidade — exige email verificado para 'public' e 'unlisted'
    if (body.visibility && ['private', 'public', 'unlisted'].includes(body.visibility)) {
      if (body.visibility !== 'private') {
        const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) }, { projection: { emailVerified: 1 } })
        if (!user?.emailVerified && !isAdmin) {
          return NextResponse.json({
            error: 'Verifique seu e-mail para tornar decks públicos ou não-listados',
            requiresVerification: true,
          }, { status: 403 })
        }
      }
      updates.visibility = body.visibility
      // Auto-publicar quando muda para público/unlisted
      if (body.visibility !== 'private') updates.isPublished = true
      if (body.visibility === 'private') updates.isPublished = false
    }

    if (typeof body.isPublished === 'boolean' && updates.visibility !== 'private') {
      updates.isPublished = body.isPublished
    }

    // Apenas admin pode mexer em pricing/preço/grupos/destaque/hidden
    if (isAdmin) {
      if (body.pricing === 'paid' || body.pricing === 'free') {
        updates.pricing = body.pricing
        if (body.pricing === 'free') {
          updates.price = 0
        }
      }
      if (typeof body.price === 'number') updates.price = Math.max(0, body.price)
      if (typeof body.stripePriceId === 'string') updates.stripePriceId = body.stripePriceId
      if (body.pricingEventId !== undefined) {
        updates.pricingEventId = body.pricingEventId ? String(body.pricingEventId) : null
      }
      if (Array.isArray(body.allowedGroups)) {
        updates.allowedGroups = body.allowedGroups.filter((g: string) => FLASHCARD_MANUAL_VALID_GROUPS.includes(g as any))
      }
      if (typeof body.isFeatured === 'boolean') updates.isFeatured = body.isFeatured
      if (typeof body.isHidden === 'boolean') updates.isHidden = body.isHidden
      if (typeof body.pdfDownloadEnabled === 'boolean') updates.pdfDownloadEnabled = body.pdfDownloadEnabled
      if (typeof body.linkedMaterialId === 'string' || body.linkedMaterialId === null) {
        updates.linkedMaterialId = body.linkedMaterialId || null
      }
      if (body.ownerType === 'admin' || body.ownerType === 'user') {
        updates.ownerType = body.ownerType
      }
      if (body.materialsFolderId !== undefined) {
        updates.materialsFolderId = body.materialsFolderId || null
      }
    }

    updates.updatedAt = new Date()

    await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).updateOne({ _id: deck._id }, { $set: updates })

    // Sync com /materiais quando admin publica/atualiza um deck da loja.
    const shouldSync = isAdmin && (
      updates.pricing === 'paid' ||
      updates.pricing === 'free' ||
      (deck.linkedMaterialId && (
        updates.materialsFolderId !== undefined ||
        updates.title !== undefined ||
        updates.coverImage !== undefined ||
        updates.allowedGroups !== undefined ||
        updates.price !== undefined ||
        updates.visibility !== undefined ||
        updates.isHidden !== undefined ||
        updates.isFeatured !== undefined ||
        updates.pricingEventId !== undefined
      ))
    )
    if (shouldSync) {
      await syncMaterialForFlashcardDeck(db, { ...deck, ...updates, _id: deck._id })
    }

    // Quando deck vira privado, ocultar material vinculado automaticamente
    if (updates.visibility === 'private' && deck.linkedMaterialId && isValidObjectId(deck.linkedMaterialId)) {
      await db.collection('materials').updateOne(
        { _id: new ObjectId(deck.linkedMaterialId) },
        { $set: { isHidden: true, updatedAt: new Date() } }
      )
    }

    const updatedDeck = await db.collection<FlashcardManualDeck>(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ _id: deck._id })
    return NextResponse.json({ deck: updatedDeck ? normalizeDeckForResponse(updatedDeck) : null })
  } catch (error: any) {
    console.error('Erro ao atualizar deck:', error)
    return NextResponse.json({ error: error.message || 'Erro ao atualizar deck' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const deck = await findDeckByIdOrSlug(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin'
    const isOwner = deck.ownerId === session.userId
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const deckId = String(deck._id)
    await Promise.all([
      db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).deleteOne({ _id: deck._id }),
      db.collection(FLASHCARD_MANUAL_COLLECTIONS.cards).deleteMany({ deckId }),
      db.collection(FLASHCARD_MANUAL_COLLECTIONS.shares).deleteMany({ deckId }),
      db.collection(FLASHCARD_MANUAL_COLLECTIONS.likes).deleteMany({ deckId }),
      db.collection(FLASHCARD_MANUAL_COLLECTIONS.sessions).deleteMany({ deckId }),
      db.collection(FLASHCARD_SPACED_PROGRESS_COLLECTION).deleteMany({ deckId }),
    ])

    if (deck.linkedMaterialId && isValidObjectId(deck.linkedMaterialId)) {
      // Apenas esconde o material vinculado para preservar histórico de compras
      await db.collection('materials').updateOne(
        { _id: new ObjectId(deck.linkedMaterialId) },
        { $set: { isHidden: true, updatedAt: new Date() } }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar deck:', error)
    return NextResponse.json({ error: 'Erro ao deletar deck' }, { status: 500 })
  }
}

