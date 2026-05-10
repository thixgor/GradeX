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
import type { FlashcardManualDeck, FlashcardManualCard } from '@/lib/types'

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
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const deck = await findDeckByIdOrSlug(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin'
    const userDoc = await db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { accountType: 1, secondaryRole: 1, email: 1, name: 1, emailVerified: 1 } }
    )
    const userGroups = getUserGroups(userDoc as any)

    const access = await resolveDeckAccess({
      db,
      deck,
      userId: session.userId,
      userEmail: userDoc?.email || session.email,
      userGroups,
      isAdmin,
    })

    if (deck.isHidden && !isAdmin && !access.isOwner) {
      return NextResponse.json({ error: 'Deck indisponível' }, { status: 404 })
    }

    // Visibilidade pública/unlisted: só inclui cards se tem acesso
    let cards: FlashcardManualCard[] = []
    if (access.hasAccess) {
      const cardDocs = await db
        .collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards)
        .find({ deckId: String(deck._id) })
        .sort({ index: 1 })
        .toArray()
      cards = cardDocs.map(normalizeCardForResponse) as any
    }

    // Incrementar viewCount (fire-and-forget) — apenas para visitantes não-donos
    if (!access.isOwner) {
      db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks)
        .updateOne({ _id: deck._id }, { $inc: { viewCount: 1 } })
        .catch(() => {})
    }

    const res = NextResponse.json({
      deck: normalizeDeckForResponse(deck),
      cards,
      access: { ...access, canManage: access.isOwner || isAdmin },
      viewer: {
        userId: session.userId,
        emailVerified: !!userDoc?.emailVerified,
      },
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
          updates.linkedMaterialId = null
        }
      }
      if (typeof body.price === 'number') updates.price = Math.max(0, body.price)
      if (typeof body.stripePriceId === 'string') updates.stripePriceId = body.stripePriceId
      if (Array.isArray(body.allowedGroups)) {
        updates.allowedGroups = body.allowedGroups.filter((g: string) => FLASHCARD_MANUAL_VALID_GROUPS.includes(g as any))
      }
      if (typeof body.isFeatured === 'boolean') updates.isFeatured = body.isFeatured
      if (typeof body.isHidden === 'boolean') updates.isHidden = body.isHidden
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

    // Sync com /materiais quando admin marca pago ou atualiza pasta/preço/grupos
    const shouldSync = isAdmin && (
      updates.pricing === 'paid' ||
      (deck.linkedMaterialId && (
        updates.materialsFolderId !== undefined ||
        updates.title !== undefined ||
        updates.coverImage !== undefined ||
        updates.allowedGroups !== undefined ||
        updates.price !== undefined
      ))
    )
    if (shouldSync) {
      await syncMaterialForDeck(db, { ...deck, ...updates, _id: deck._id })
    }
    if (isAdmin && updates.pricing === 'free' && deck.linkedMaterialId) {
      // Esconder material associado quando volta para gratuito
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

async function syncMaterialForDeck(db: any, deck: FlashcardManualDeck & { _id: ObjectId }) {
  const materialPayload = {
    title: deck.title,
    description: deck.description || '',
    coverImage: deck.coverImage || '',
    type: 'flashcard_deck',
    downloadUrl: `/flashcards/d/${deck.slug}`,
    folderId: deck.materialsFolderId || null,
    moduloId: '',
    tags: deck.tags || [],
    pricing: 'paid' as const,
    price: deck.price || 0,
    stripePriceId: deck.stripePriceId || '',
    allowedGroups: deck.allowedGroups || [],
    isHidden: !!deck.isHidden,
    isFeatured: !!deck.isFeatured,
    order: 0,
    linkedDeckId: String(deck._id),
    linkedDeckSlug: deck.slug,
    updatedAt: new Date(),
  }

  if (deck.linkedMaterialId && isValidObjectId(deck.linkedMaterialId)) {
    await db.collection('materials').updateOne(
      { _id: new ObjectId(deck.linkedMaterialId) },
      { $set: materialPayload }
    )
    return deck.linkedMaterialId
  }

  const created = await db.collection('materials').insertOne({
    ...materialPayload,
    downloadCount: 0,
    viewCount: 0,
    createdBy: deck.ownerId,
    createdByName: deck.ownerName,
    createdAt: new Date(),
  })

  await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).updateOne(
    { _id: deck._id },
    { $set: { linkedMaterialId: String(created.insertedId), updatedAt: new Date() } }
  )
  return String(created.insertedId)
}
