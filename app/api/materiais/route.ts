import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

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

    await db.collection('materials').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updates }
    )

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
