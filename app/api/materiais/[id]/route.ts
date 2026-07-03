import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { getPricingEventStateById, serializePricingEventState } from '@/lib/pricing-events'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const isAuthenticated = !!session

    const { id } = params
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const isAdmin = session?.role === 'admin'

    // Fetch user + material + folder in parallel
    const [userDoc, material] = await Promise.all([
      session ? db.collection('users').findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { accountType: 1, secondaryRole: 1, name: 1, cpf: 1 } }
      ) : Promise.resolve(null),
      db.collection('materials').findOne({
        _id: new ObjectId(id),
        ...(isAdmin ? {} : { isHidden: false }),
      }),
    ])

    if (!material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    const userGroups: string[] = []
    if (session && !isAdmin && userDoc) {
      if (userDoc.accountType) userGroups.push(userDoc.accountType)
      if (userDoc.secondaryRole === 'monitor') userGroups.push('monitor')
    }

    // Folder name (if any)
    let folderName: string | null = null
    if (material.folderId) {
      const folder = await db.collection('material_folders').findOne(
        { _id: new ObjectId(String(material.folderId)) },
        { projection: { name: 1 } }
      ).catch(() => null)
      folderName = folder?.name ?? null
    }

    // Check group access
    const hasGroupAccess =
      isAdmin ||
      !material.allowedGroups?.length ||
      userGroups.some((g: string) => material.allowedGroups.includes(g))

    // Check purchase — antes eram até 5 queries sequenciais (material por
    // userId, por email; depois pacotes; pacote por userId, por email).
    // Consolida em paralelo: 1 query material-purchases via $or
    // (userId OR userEmail) + 1 query packages. Quando há pacotes que
    // contêm o material, busca compras de pacote em uma segunda rodada.
    let isPurchased = false
    if (session && !isAdmin) {
      const emailFilter = session.email
        ? { userEmail: new RegExp(`^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        : null

      const [directPurchase, candidatePackages] = await Promise.all([
        db.collection('material_purchases').findOne(
          {
            itemId: id,
            itemType: 'material',
            status: 'completed',
            ...(emailFilter
              ? { $or: [{ userId: session.userId }, emailFilter] }
              : { userId: session.userId }),
          },
          { projection: { _id: 1 } }
        ),
        db.collection('material_packages')
          .find({ materialIds: id, isHidden: { $ne: true } }, { projection: { _id: 1 } })
          .toArray(),
      ])

      if (directPurchase) {
        isPurchased = true
      } else {
        const packageIds = candidatePackages.map((pkg: any) => String(pkg._id))
        if (packageIds.length > 0) {
          const pkgPurchase = await db.collection('material_purchases').findOne(
            {
              itemType: 'package',
              itemId: { $in: packageIds },
              status: 'completed',
              ...(emailFilter
                ? { $or: [{ userId: session.userId }, emailFilter] }
                : { userId: session.userId }),
            },
            { projection: { _id: 1 } }
          )
          isPurchased = !!pkgPurchase
        }
      }
    }

    const canAccess = isAuthenticated && (isAdmin || isPurchased || (hasGroupAccess && material.pricing === 'free'))

    // Strip real asset URL if no access
    const safeMaterial =
      !canAccess
        ? { ...material, downloadUrl: '' }
        : material

    // Computed flags (never expose pdfFile.blobUrl / htmlFile.blobUrl to client)
    const _hasPdf = !!(material.pdfFile?.blobUrl)
    const _hasHtml = !!(material.htmlFile?.blobUrl)
    const { pdfFile: _strippedPdf, htmlFile: _strippedHtml, ...materialWithoutPdf } = safeMaterial

    // For flashcard_deck materials, fetch linked deck card count
    let _cardCount: number | undefined
    if (material.type === 'flashcard_deck') {
      const linkedDeck = await db
        .collection('flashcardManualDecks')
        .findOne(
          { linkedMaterialId: String(material._id) },
          { projection: { _id: 1 } }
        )
        .catch(() => null)
      if (linkedDeck) {
        _cardCount = await db
          .collection('flashcardManualCards')
          .countDocuments({ deckId: String(linkedDeck._id) })
          .catch(() => 0)
      } else {
        _cardCount = 0
      }
    }

    // Increment view count (fire-and-forget).
    // Apenas para usuários autenticados que NÃO são o admin e que
    // tenham acesso ao material — evita inflar viewCount com bots,
    // crawlers anônimos ou cliques internos do admin. Reduz writes
    // ao Mongo significativamente (era 1 write em CADA call, ~726/dia).
    if (isAuthenticated && !isAdmin && canAccess) {
      db.collection('materials')
        .updateOne({ _id: new ObjectId(id) }, { $inc: { viewCount: 1 } })
        .catch(() => {})
    }

    const pricingEventState = material.pricingEventId
      ? await getPricingEventStateById(db, String(material.pricingEventId))
      : null

    // ─── Complementares — seção "Você também leva …" ──────────────────────
    // Fonte nova: complementaryItems (itens ricos: referência a material OU
    // avulso). Fallback para o legado complementaryMaterialIds. Preserva a
    // ordem definida pelo admin; materiais ocultos são omitidos (exceto admin).
    const rawItems: any[] = Array.isArray(material.complementaryItems) && material.complementaryItems.length > 0
      ? material.complementaryItems
      : (Array.isArray(material.complementaryMaterialIds)
          ? material.complementaryMaterialIds.map((cid: any) => ({ kind: 'material', materialId: String(cid) }))
          : [])

    // Coleta os ids de materiais referenciados para resolver em 1 query.
    const refIds = Array.from(new Set(
      rawItems
        .filter((it: any) => it?.kind === 'material')
        .map((it: any) => String(it.materialId || ''))
        .filter((rid: string) => ObjectId.isValid(rid) && rid !== String(material._id))
    ))
    const refById = new Map<string, any>()
    if (refIds.length > 0) {
      const docs = await db.collection('materials')
        .find(
          {
            _id: { $in: refIds.map((rid) => new ObjectId(rid)) },
            ...(isAdmin ? {} : { isHidden: false }),
          },
          { projection: { title: 1, description: 1, coverImage: 1, type: 1, pricing: 1, price: 1 } }
        )
        .toArray()
        .catch(() => [])
      for (const d of docs) refById.set(String(d._id), d)
    }

    const complementaryItems = rawItems.map((it: any, idx: number) => {
      const id = String(it?.id || `ci-${idx}`)
      if (it?.kind === 'custom') {
        const contentKind = it.contentKind || 'link'
        const hasHtmlFile = !!it.htmlFile?.blobUrl
        const hasPdfFile = !!it.pdfFile?.blobUrl
        const viewerEnabled = it.viewerEnabled === true
        // O botão/CTA:
        //  - pdf/html: sempre aponta para o leitor protegido (a rota valida
        //    acesso — o front mostra estado bloqueado quando aplicável).
        //  - video_embed/link: destino é o buttonUrl, só exposto com acesso
        //    (mesmo tratamento que downloadUrl no material).
        const href =
          contentKind === 'pdf' || contentKind === 'html'
            ? `/materiais/${String(material._id)}/complementary/${id}`
            : (canAccess ? (it.buttonUrl || '') : '')
        return {
          id,
          kind: 'custom' as const,
          template: it.template || 'experiencia',
          contentKind,
          title: it.title || '',
          description: it.description || '',
          coverImage: it.coverImage || '',
          buttonLabel: it.buttonLabel || '',
          href,
          viewerEnabled,
          _hasHtml: hasHtmlFile,
          _hasPdf: hasPdfFile,
          // Embed cru (código/URL) só quando o usuário já tem acesso ao pai —
          // igual ao downloadUrl de um material video_embed.
          ...(contentKind === 'video_embed' && canAccess ? { embedCode: it.buttonUrl || '' } : {}),
        }
      }
      // kind === 'material'
      const ref = refById.get(String(it?.materialId || ''))
      if (!ref) return null
      return {
        id,
        kind: 'material' as const,
        materialId: String(it.materialId),
        materialType: ref.type || 'other',
        template: '' as const,
        title: it.title || ref.title || '',
        description: it.description || '',
        coverImage: it.coverImage || ref.coverImage || '',
        buttonLabel: it.buttonLabel || '',
        href: `/materiais/${String(it.materialId)}`,
        pricing: ref.pricing || 'free',
        price: Number(ref.price || 0),
      }
    }).filter(Boolean)

    const res = NextResponse.json({
      material: {
        ...materialWithoutPdf,
        _id: String(safeMaterial._id),
        _hasPdf,
        _hasHtml,
        pdfViewerEnabled: material.pdfViewerEnabled === true,
        pdfDownloadEnabled: material.pdfDownloadEnabled !== false,
        htmlViewerEnabled: material.htmlViewerEnabled === true,
        pricingEventId: material.pricingEventId ? String(material.pricingEventId) : null,
        ...(_hasPdf && material.pdfFile?.pageCount ? { _pageCount: material.pdfFile.pageCount } : {}),
        ...(material.type === 'flashcard_deck' ? { _cardCount: _cardCount ?? 0 } : {}),
      },
      complementaryItems,
      folderName,
      hasAccess: canAccess,
      isPurchased,
      hasGroupAccess,
      userGroups,
      isAuthenticated,
      pricingEventState: serializePricingEventState(pricingEventState),
      watermark: {
        name: userDoc?.name || session?.name || 'Usuário',
        cpf: userDoc?.cpf || '',
      },
    })
    // Cache curto privado: muitas visitas vêm de cliques rápidos (volta,
    // refresh, navegação entre material e viewer). 30s evita re-fetch
    // imediato sem comprometer atualização de hasAccess após compra
    // (o checkout invalida cache do client via clearBootstrapCache).
    res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    return res
  } catch (error) {
    console.error('Error fetching material:', error)
    return NextResponse.json({ error: 'Erro ao buscar material' }, { status: 500 })
  }
}
