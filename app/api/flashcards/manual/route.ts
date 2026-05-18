import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  FLASHCARD_MANUAL_COLLECTIONS,
  generateUniqueSlug,
  normalizeDeckForResponse,
  sanitizeDeckTitle,
  sanitizeDescription,
  sanitizeTags,
  isValidObjectId,
  getUserGroups,
} from '@/lib/flashcard-manual'
import { getFlashcardManualLimits } from '@/lib/flashcard-limits'
import { syncMaterialForFlashcardDeck } from '@/lib/flashcard-material-sync'
import type { FlashcardManualDeck } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/flashcards/manual?folderId=...&q=...
// Lista decks do próprio usuário (e admin vê todos).
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const decks = db.collection<FlashcardManualDeck>(FLASHCARD_MANUAL_COLLECTIONS.decks)
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const q = searchParams.get('q')
    const scope = searchParams.get('scope') || 'mine' // 'mine' | 'all-admin'
    const isAdmin = session.role === 'admin'

    const filter: any = {}
    if (scope === 'all-admin' && isAdmin) {
      // admin vê tudo
    } else {
      filter.ownerId = session.userId
    }
    if (folderId) {
      filter.folderId = folderId === 'null' ? null : folderId
    }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ]
    }

    const list = await decks.find(filter).sort({ updatedAt: -1 }).toArray()
    const res = NextResponse.json({ decks: list.map(normalizeDeckForResponse) })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Erro ao listar decks manuais:', error)
    return NextResponse.json({ error: 'Erro ao listar decks' }, { status: 500 })
  }
}

// POST /api/flashcards/manual  — cria um novo deck (rascunho/privado por padrão)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const title = sanitizeDeckTitle(body.title)
    if (!title) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })

    const db = await getDb()
    const usersCollection = db.collection('users')
    const decks = db.collection<FlashcardManualDeck>(FLASHCARD_MANUAL_COLLECTIONS.decks)

    const isAdmin = session.role === 'admin'
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const limits = getFlashcardManualLimits(user.accountType, isAdmin)
    const ownedCount = await decks.countDocuments({ ownerId: session.userId, ownerType: isAdmin ? 'admin' : 'user' })
    if (ownedCount >= limits.maxDecks) {
      return NextResponse.json({
        error: `Limite de decks atingido (${limits.maxDecks}). Faça upgrade ou apague decks antigos.`,
        requiresUpgrade: true,
        limit: limits.maxDecks,
        used: ownedCount,
      }, { status: 403 })
    }

    const slug = await generateUniqueSlug(db, title)
    const folderId = body.folderId && isValidObjectId(body.folderId) ? body.folderId : null

    const ownerType: 'user' | 'admin' = isAdmin && body.asAdmin ? 'admin' : 'user'
    const isPaidByAdmin = ownerType === 'admin' && body.pricing === 'paid'

    const VALID_GROUPS = ['gratuito', 'trial', 'essential', 'premium', 'monitor']

    // Visibilidade: admin pode definir qualquer valor; usuários ficam em private por padrão
    let visibility: 'private' | 'public' | 'unlisted' = 'private'
    if (['private', 'public', 'unlisted'].includes(body.visibility)) {
      if (isAdmin || body.visibility === 'private') {
        visibility = body.visibility
      }
    }

    const materialsFolderId = isAdmin && body.materialsFolderId ? String(body.materialsFolderId) : null

    const deck: FlashcardManualDeck = {
      slug,
      ownerId: session.userId,
      ownerName: user.name || session.name || 'Usuário',
      ownerType,
      title,
      description: sanitizeDescription(body.description, 600),
      coverImage: body.coverImage ? String(body.coverImage).slice(0, 2000) : undefined,
      tags: sanitizeTags(body.tags),
      category: body.category ? String(body.category).slice(0, 60) : undefined,
      visibility,
      isFeatured: false,
      pricing: isPaidByAdmin ? 'paid' : 'free',
      price: isPaidByAdmin ? Math.max(0, Number(body.price) || 0) : undefined,
      stripePriceId: undefined,
      allowedGroups: ownerType === 'admin' && Array.isArray(body.allowedGroups)
        ? body.allowedGroups.filter((g: string) => VALID_GROUPS.includes(g))
        : [],
      folderId,
      linkedMaterialId: null,
      materialsFolderId,
      cardCount: 0,
      viewCount: 0,
      studyCount: 0,
      likeCount: 0,
      isPublished: false,
      isHidden: false,
      pdfDownloadEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await decks.insertOne(deck)
    const deckWithId: FlashcardManualDeck & { _id: ObjectId } = { ...deck, _id: result.insertedId as ObjectId }

    if (ownerType === 'admin') {
      const linkedMaterialId = await syncMaterialForFlashcardDeck(db, deckWithId)
      deckWithId.linkedMaterialId = linkedMaterialId
    }

    return NextResponse.json({
      deck: normalizeDeckForResponse(deckWithId),
    }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar deck manual:', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar deck' }, { status: 500 })
  }
}
