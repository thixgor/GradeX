import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { getPricingEventStatesByIds, serializePricingEventState } from '@/lib/pricing-events'
import { FLASHCARD_MANUAL_COLLECTIONS } from '@/lib/flashcard-manual'
import { normalizePreviewRanges } from '@/lib/material-pdf-viewer'

export const dynamic = 'force-dynamic'

// Normaliza a configuração do PDF Viewer (capa, sumário, navegação) vinda do
// admin antes de persistir. Garante tipos, limites e ids estáveis para evitar
// dados malformados na coleção.
function sanitizePdfViewerConfig(raw: any): {
  coverPage?: number
  summary: Array<{ id: string; title: string; page: number; level: number }>
  navigation: Array<{ id: string; label: string; page: number }>
  preview: { enabled: boolean; ranges: Array<{ start: number; end: number }> }
} | null {
  if (!raw || typeof raw !== 'object') return null

  const toPage = (value: any): number | null => {
    const n = Math.floor(Number(value))
    return Number.isFinite(n) && n >= 1 ? Math.min(n, 100000) : null
  }
  const makeId = (fallback: string) =>
    `${fallback}-${Math.random().toString(36).slice(2, 9)}`
  const clean = (s: any, max: number) =>
    String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

  const summary = Array.isArray(raw.summary)
    ? raw.summary
        .map((item: any) => {
          const page = toPage(item?.page)
          const title = clean(item?.title, 200)
          if (!page || !title) return null
          const level = Math.min(2, Math.max(0, Math.floor(Number(item?.level) || 0)))
          return { id: clean(item?.id, 40) || makeId('toc'), title, page, level }
        })
        .filter(Boolean)
        .slice(0, 500)
    : []

  const navigation = Array.isArray(raw.navigation)
    ? raw.navigation
        .map((item: any) => {
          const page = toPage(item?.page)
          const label = clean(item?.label, 60)
          if (!page || !label) return null
          return { id: clean(item?.id, 40) || makeId('nav'), label, page }
        })
        .filter(Boolean)
        .slice(0, 100)
    : []

  const coverPage = toPage(raw.coverPage)

  // Prévia (X–Y): páginas que um usuário SEM acesso pode ver antes de comprar.
  const previewRanges = normalizePreviewRanges(raw?.preview?.ranges)
  const preview = {
    enabled: raw?.preview?.enabled === true && previewRanges.length > 0,
    ranges: previewRanges,
  }

  return {
    ...(coverPage ? { coverPage } : {}),
    summary: summary as any,
    navigation: navigation as any,
    preview,
  }
}

// GET - Listar materiais (público para usuários logados)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const isAuthenticated = !!session

    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const search = searchParams.get('search')
    const pricing = searchParams.get('pricing') // 'free' | 'paid' | null (all)
    const featured = searchParams.get('featured')
    const moduloId = searchParams.get('moduloId')

    const isAdmin = session?.role === 'admin'

    // Fetch user groups for access control
    let userGroups: string[] = []
    if (session && !isAdmin) {
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { accountType: 1, secondaryRole: 1 } }
      )
      if (user) {
        if (user.accountType) userGroups.push(user.accountType)
        if (user.secondaryRole === 'monitor') userGroups.push('monitor')
      }
    }

    const filter: any = {}

    // Não-admin só vê materiais visíveis
    if (!isAdmin) {
      filter.isHidden = false
    }

    if (folderId) {
      filter.folderId = folderId
    }

    if (pricing) {
      filter.pricing = pricing
    }

    if (featured === 'true') {
      filter.isFeatured = true
    }

    if (moduloId) {
      filter.moduloId = moduloId
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ]
    }

    const materials = await db
      .collection('materials')
      .find(filter)
      .sort({ isFeatured: -1, order: 1, createdAt: -1 })
      .toArray()

    // Se não for admin, verificar quais o usuário já comprou.
    // Two separate queries (userId and userEmail) then merge, to avoid any $or
    // index quirks and ensure manual admin grants are always detected.
    let purchasedIds: string[] = []
    if (session && !isAdmin) {
      const baseFilter = { itemType: 'material', status: 'completed' }

      // Query by userId (primary — always present)
      const byUserId = await db
        .collection('material_purchases')
        .find({ ...baseFilter, userId: session.userId })
        .project({ itemId: 1 })
        .toArray()

      // Query by userEmail as fallback (covers edge-cases where userId wasn't stored)
      let byEmail: any[] = []
      if (session.email) {
        const emailRegex = new RegExp(`^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        byEmail = await db
          .collection('material_purchases')
          .find({ ...baseFilter, userEmail: { $regex: emailRegex } })
          .project({ itemId: 1 })
          .toArray()
      }

      // Merge, deduplicate and normalise to plain strings
      purchasedIds = [...new Set([...byUserId, ...byEmail].map((p: any) => String(p.itemId)))]

      const packageBaseFilter = { itemType: 'package', status: 'completed' }
      const packageByUserId = await db
        .collection('material_purchases')
        .find({ ...packageBaseFilter, userId: session.userId })
        .project({ itemId: 1 })
        .toArray()

      let packageByEmail: any[] = []
      if (session.email) {
        const emailRegex = new RegExp(`^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        packageByEmail = await db
          .collection('material_purchases')
          .find({ ...packageBaseFilter, userEmail: { $regex: emailRegex } })
          .project({ itemId: 1 })
          .toArray()
      }

      const purchasedPackageIds = [...new Set([...packageByUserId, ...packageByEmail].map((p: any) => String(p.itemId)))]
      if (purchasedPackageIds.length > 0) {
        const packageObjectIds = purchasedPackageIds
          .map((pkgId) => {
            try { return new ObjectId(pkgId) } catch { return null }
          })
          .filter(Boolean) as ObjectId[]

        if (packageObjectIds.length > 0) {
          const ownedPackages = await db.collection('material_packages')
            .find({ _id: { $in: packageObjectIds }, isHidden: { $ne: true } })
            .project({ materialIds: 1 })
            .toArray()
          const packageMaterialIds = ownedPackages.flatMap((pkg: any) =>
            Array.isArray(pkg.materialIds) ? pkg.materialIds.map(String) : []
          )
          purchasedIds = [...new Set([...purchasedIds, ...packageMaterialIds])]
        }
      }
    }

    // Build the response: explicitly stringify _id and attach access flags
    // per material so the client never has to guess. Server is the source of truth.
    const purchasedSet = new Set(purchasedIds)

    // For flashcard_deck materials, fetch linked deck visibility + card counts
    const flashcardDeckMaterialIds = materials
      .filter((m: any) => m.type === 'flashcard_deck')
      .map((m: any) => String(m._id))

    const cardCountByMaterialId: Record<string, number> = {}
    // Track which material IDs belong to private decks (non-admin should not see them)
    const privateDeckMaterialIds = new Set<string>()

    if (flashcardDeckMaterialIds.length > 0) {
      const linkedDecks = await db
        .collection('flashcardManualDecks')
        .find({ linkedMaterialId: { $in: flashcardDeckMaterialIds } })
        .project({ _id: 1, linkedMaterialId: 1, visibility: 1 })
        .toArray()

      if (linkedDecks.length > 0) {
        // Mark materials linked to private decks
        if (!isAdmin) {
          for (const deck of linkedDecks) {
            if (deck.visibility === 'private') {
              privateDeckMaterialIds.add(String(deck.linkedMaterialId))
            }
          }
        }

        const deckIds = linkedDecks.map((d: any) => d._id)
        const counts = await db
          .collection('flashcardManualCards')
          .aggregate([
            { $match: { deckId: { $in: deckIds.map((id: any) => String(id)) } } },
            { $group: { _id: '$deckId', count: { $sum: 1 } } },
          ])
          .toArray()

        const countByDeckId = new Map(counts.map((c: any) => [c._id, c.count]))
        for (const deck of linkedDecks) {
          const matId = String(deck.linkedMaterialId)
          cardCountByMaterialId[matId] = countByDeckId.get(String(deck._id)) ?? 0
        }
      }
    }

    // Resolve pricing event states (batch) for materials that have a pricingEventId
    const eventIds = materials
      .map((m: any) => m.pricingEventId)
      .filter((id: any): id is string => !!id)
    const eventStates = eventIds.length > 0
      ? await getPricingEventStatesByIds(db, eventIds)
      : new Map()

    const secureMaterials = materials.filter((m: any) =>
      !privateDeckMaterialIds.has(String(m._id))
    ).map((m: any) => {
      const idStr = String(m._id)
      const hasGroupAccess =
        isAdmin ||
        !m.allowedGroups?.length ||
        userGroups.some((g: string) => m.allowedGroups.includes(g))
      const isPurchased = isAdmin || purchasedSet.has(idStr)
      // Access = admin OR purchased/granted OR (group member AND free)
      const hasAccess = isAuthenticated && (isAdmin || isPurchased || (hasGroupAccess && m.pricing !== 'paid'))

      // Strip any real asset URL when no access (security)
      const downloadUrl = hasAccess ? m.downloadUrl : ''

      // PDF interno: nunca expor blobUrl ao cliente
      const hasPdf = !!m.pdfFile?.blobUrl
      // Admin recebe metadados sem URL; usuários apenas recebem o flag booleano
      const pdfFileMeta = isAdmin && m.pdfFile
        ? {
            originalFilename: m.pdfFile.originalFilename,
            sizeBytes: m.pdfFile.sizeBytes,
            uploadedByName: m.pdfFile.uploadedByName,
            uploadedAt: m.pdfFile.uploadedAt,
          }
        : undefined

      // Remover pdfFile (com blobUrl) da resposta — substituído por _hasPdf/_pdfFile
      const { pdfFile: _removed, ...rest } = m

      // Resolve pricing event state if this material has one
      const pricingEventState = m.pricingEventId
        ? eventStates.get(String(m.pricingEventId)) || null
        : null

      return {
        ...rest,
        _id: idStr,
        downloadUrl,
        _isPurchased: isPurchased,
        _hasGroupAccess: hasGroupAccess,
        _hasAccess: hasAccess,
        _hasPdf: hasPdf,
        pdfViewerEnabled: m.pdfViewerEnabled === true,
        pdfDownloadEnabled: m.pdfDownloadEnabled !== false,
        ...(hasPdf && m.pdfFile?.pageCount ? { _pageCount: m.pdfFile.pageCount } : {}),
        ...(pdfFileMeta && { _pdfFile: pdfFileMeta }),
        ...(m.type === 'flashcard_deck' && { _cardCount: cardCountByMaterialId[idStr] ?? 0 }),
        _pricingEventState: serializePricingEventState(pricingEventState),
      }
    })

    const res = NextResponse.json({
      materials: secureMaterials,
      purchasedIds,
      userGroups, // groups the current user belongs to (for client-side access check)
      isAuthenticated,
    })
    // Prevent any browser/CDN caching — access state must always be fresh
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json({ error: 'Erro ao buscar materiais' }, { status: 500 })
  }
}

// POST - Criar material (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const body = await request.json()

    const material = {
      title: body.title,
      description: body.description || '',
      coverImage: body.coverImage || '',
      type: body.type || 'pdf',
      downloadUrl: body.downloadUrl,
      previewUrl: body.previewUrl || '',
      folderId: body.folderId || null,
      moduloId: body.moduloId || '',
      tags: body.tags || [],
      pricing: body.pricing || 'free',
      price: body.pricing === 'paid' ? (body.price || 0) : 0,
      pricingEventId: body.pricingEventId ? String(body.pricingEventId) : null,
      stripePriceId: body.stripePriceId || '',
      allowedGroups: body.allowedGroups || [],
      pdfViewerEnabled: body.pdfViewerEnabled === true,
      pdfDownloadEnabled: body.pdfDownloadEnabled !== false,
      pdfViewerConfig: sanitizePdfViewerConfig(body.pdfViewerConfig) || { summary: [], navigation: [], preview: { enabled: false, ranges: [] } },
      downloadCount: 0,
      viewCount: 0,
      isHidden: body.isHidden || false,
      isFeatured: body.isFeatured || false,
      order: body.order || 0,
      createdBy: session.userId,
      createdByName: session.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('materials').insertOne(material)

    return NextResponse.json({ _id: result.insertedId, ...material }, { status: 201 })
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json({ error: 'Erro ao criar material' }, { status: 500 })
  }
}

// PUT - Atualizar material (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const body = await request.json()
    const { _id, ...updates } = body

    if (!_id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    updates.updatedAt = new Date()
    if (updates.pricing === 'free') {
      updates.price = 0
    }
    if ('pricingEventId' in updates) {
      updates.pricingEventId = updates.pricingEventId ? String(updates.pricingEventId) : null
    }
    if ('pdfViewerConfig' in updates) {
      updates.pdfViewerConfig = sanitizePdfViewerConfig(updates.pdfViewerConfig) || { summary: [], navigation: [], preview: { enabled: false, ranges: [] } }
    }

    await db.collection('materials').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updates }
    )

    // Se o material for um deck de flashcard vinculado, propagar os campos de
    // preço de volta ao deck — caso contrário /flashcards/d/<slug> continua
    // lendo o pricingEventId/preço antigo direto do deck.
    const material = await db.collection('materials').findOne(
      { _id: new ObjectId(_id) },
      { projection: { linkedDeckId: 1 } }
    )
    if (material?.linkedDeckId && ObjectId.isValid(String(material.linkedDeckId))) {
      const deckUpdates: Record<string, any> = {}
      if ('pricingEventId' in updates) deckUpdates.pricingEventId = updates.pricingEventId
      if ('pricing' in updates) deckUpdates.pricing = updates.pricing
      if ('price' in updates) deckUpdates.price = updates.price
      if ('stripePriceId' in updates) deckUpdates.stripePriceId = updates.stripePriceId
      if (Object.keys(deckUpdates).length > 0) {
        deckUpdates.updatedAt = new Date()
        await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).updateOne(
          { _id: new ObjectId(String(material.linkedDeckId)) },
          { $set: deckUpdates }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating material:', error)
    return NextResponse.json({ error: 'Erro ao atualizar material' }, { status: 500 })
  }
}

// DELETE - Deletar material (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    // Remover material de pacotes que o contêm
    await db.collection('material_packages').updateMany(
      { materialIds: id },
      { $pull: { materialIds: id } as any }
    )

    await db.collection('materials').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json({ error: 'Erro ao deletar material' }, { status: 500 })
  }
}
