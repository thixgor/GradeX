import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { getPricingEventStatesByIds, serializePricingEventState } from '@/lib/pricing-events'
import { FLASHCARD_MANUAL_COLLECTIONS } from '@/lib/flashcard-manual'
import { normalizePreviewRanges } from '@/lib/material-pdf-viewer'
import { materialMetadataPaths, revalidateMetadataPaths } from '@/lib/metadata-revalidate'
import { expandUserAccessGroups, isPlusAccount } from '@/lib/account-tier'
import {
  activeAccessFilter,
  sanitizeTimedAccessVersions,
  serializeTimedAccessVersions,
  summarizeTimedAccess,
} from '@/lib/material-timed-access'

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

  // Sem teto de entradas: sumários importados de PDFs longos passavam de 500 e
  // o excedente era descartado silenciosamente ao salvar.
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

// Normaliza a lista de materiais complementares (legado): mantém apenas
// ObjectIds válidos, remove o próprio material, deduplica e limita.
function sanitizeComplementaryIds(raw: any, selfId: string | null): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    const id = String(item || '').trim()
    if (!ObjectId.isValid(id)) continue
    if (selfId && id === String(selfId)) continue
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
    if (out.length >= 30) break
  }
  return out
}

const COMPLEMENTARY_TEMPLATES = ['experiencia', 'pdf', 'aula', 'podcast', 'ebook']
const COMPLEMENTARY_CONTENT_KINDS = ['link', 'html', 'pdf', 'video_embed']

// Normaliza os itens complementares ("Você também leva …"). Cada item é
// referência a material (kind 'material') ou avulso (kind 'custom'). Valida
// tipos/limites, gera ids estáveis e descarta itens inválidos.
//
// `existingById` traz os itens já persistidos (por id) — o formulário do
// admin nunca recebe blobUrl de volta, então pdfFile/htmlFile enviados por
// upload (via /api/materiais/complementary-upload) são preservados aqui ao
// salvar o material por cima, em vez de serem apagados silenciosamente.
function sanitizeComplementaryItems(raw: any, selfId: string | null, existingById?: Map<string, any>): any[] {
  if (!Array.isArray(raw)) return []
  const clean = (s: any, max: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
  const cleanMultiline = (s: any, max: number) => String(s ?? '').trim().slice(0, max)
  const makeId = () => `ci-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const sanitizeUrl = (raw: any): string => {
    const u = String(raw ?? '').trim().slice(0, 2000)
    if (!u) return ''
    if (u.startsWith('<')) return u.slice(0, 20000) // código embed (video_embed)
    if (u.startsWith('/')) return u // caminho relativo interno
    if (/^https?:\/\//i.test(u)) return u
    return '' // rejeita esquemas potencialmente perigosos (javascript:, data:, etc.)
  }

  const out: any[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const id = clean(item.id, 40) || makeId()
    const kind = item.kind === 'custom' ? 'custom' : 'material'
    if (kind === 'material') {
      const materialId = String(item.materialId || '').trim()
      if (!ObjectId.isValid(materialId)) continue
      if (selfId && materialId === String(selfId)) continue
      out.push({
        id,
        kind: 'material',
        materialId,
        title: clean(item.title, 160),
        description: cleanMultiline(item.description, 500),
        coverImage: clean(item.coverImage, 2000),
        buttonLabel: clean(item.buttonLabel, 40),
      })
    } else {
      const title = clean(item.title, 160)
      if (!title) continue // item avulso precisa de título
      const template = COMPLEMENTARY_TEMPLATES.includes(item.template) ? item.template : 'experiencia'
      const contentKind = COMPLEMENTARY_CONTENT_KINDS.includes(item.contentKind) ? item.contentKind : 'link'
      const existing = existingById?.get(id)
      out.push({
        id,
        kind: 'custom',
        template,
        contentKind,
        title,
        description: cleanMultiline(item.description, 500),
        coverImage: clean(item.coverImage, 2000),
        buttonLabel: clean(item.buttonLabel, 40),
        buttonUrl: sanitizeUrl(item.buttonUrl),
        viewerEnabled: item.viewerEnabled === true,
        // Preserva arquivos já enviados (upload grava direto no Mongo; o
        // formulário nunca os carrega de volta no payload de salvar).
        ...(existing?.pdfFile ? { pdfFile: existing.pdfFile } : {}),
        ...(existing?.htmlFile ? { htmlFile: existing.htmlFile } : {}),
      })
    }
    if (out.length >= 30) break
  }
  return out
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
    let isPlus = false
    if (session && !isAdmin) {
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { accountType: 1, secondaryRole: 1 } }
      )
      if (user) {
        // Inclui os aliases legados para que um assinante Plus+ continue
        // enxergando itens marcados como premium/essential.
        userGroups = expandUserAccessGroups(user.accountType, user.secondaryRole)
        // Plus+ libera TODO o acervo de materiais (pago ou gratuito) — é
        // conteúdo da própria plataforma, nunca de terceiros.
        isPlus = isPlusAccount(user.accountType)
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
    /** materialId → prazo restante, quando a compra foi por tempo limitado. */
    const timedAccessByMaterialId: Record<string, any> = {}
    if (session && !isAdmin) {
      // Compras vencidas (acesso por tempo) não contam como posse — o filtro
      // deixa passar apenas o que ainda está no prazo.
      const baseFilter = { itemType: 'material', status: 'completed', ...activeAccessFilter() }
      const accessProjection = {
        itemId: 1,
        accessMode: 1,
        accessVersionId: 1,
        accessVersionLabel: 1,
        accessDuration: 1,
        accessDurationMinutes: 1,
        accessStartsAt: 1,
        accessExpiresAt: 1,
      }

      // Query by userId (primary — always present)
      const byUserId = await db
        .collection('material_purchases')
        .find({ ...baseFilter, userId: session.userId })
        .project(accessProjection)
        .toArray()

      // Query by userEmail as fallback (covers edge-cases where userId wasn't stored)
      let byEmail: any[] = []
      if (session.email) {
        const emailRegex = new RegExp(`^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        byEmail = await db
          .collection('material_purchases')
          .find({ ...baseFilter, userEmail: { $regex: emailRegex } })
          .project(accessProjection)
          .toArray()
      }

      // Merge, deduplicate and normalise to plain strings
      purchasedIds = [...new Set([...byUserId, ...byEmail].map((p: any) => String(p.itemId)))]
      for (const purchase of [...byUserId, ...byEmail]) {
        const status = summarizeTimedAccess(purchase)
        if (!status) continue
        const key = String(purchase.itemId)
        // Duas compras do mesmo item: vale a que dura mais.
        const current = timedAccessByMaterialId[key]
        if (!current || status.remainingMs > current.remainingMs) {
          timedAccessByMaterialId[key] = status
        }
      }

      const packageBaseFilter = { itemType: 'package', status: 'completed', ...activeAccessFilter() }
      const packageByUserId = await db
        .collection('material_purchases')
        .find({ ...packageBaseFilter, userId: session.userId })
        .project(accessProjection)
        .toArray()

      let packageByEmail: any[] = []
      if (session.email) {
        const emailRegex = new RegExp(`^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        packageByEmail = await db
          .collection('material_purchases')
          .find({ ...packageBaseFilter, userEmail: { $regex: emailRegex } })
          .project(accessProjection)
          .toArray()
      }

      const purchasedPackageIds = [...new Set([...packageByUserId, ...packageByEmail].map((p: any) => String(p.itemId)))]
      /** packageId → prazo, para propagar aos materiais que vêm pelo pacote. */
      const timedByPackageId = new Map<string, any>()
      for (const purchase of [...packageByUserId, ...packageByEmail]) {
        const status = summarizeTimedAccess(purchase)
        if (status) timedByPackageId.set(String(purchase.itemId), status)
      }
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

          // Material herdado de um pacote por tempo herda o prazo do pacote —
          // a não ser que o usuário já tenha uma posse melhor do mesmo item.
          for (const pkg of ownedPackages as any[]) {
            const pkgStatus = timedByPackageId.get(String(pkg._id))
            for (const materialId of (pkg.materialIds || []).map(String)) {
              if (!pkgStatus) {
                delete timedAccessByMaterialId[materialId]
                continue
              }
              const current = timedAccessByMaterialId[materialId]
              if (current && current.remainingMs >= pkgStatus.remainingMs) continue
              timedAccessByMaterialId[materialId] = pkgStatus
            }
          }
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
      // Access = admin OR purchased/claimed OR (group member AND free).
      // O Plus+ NÃO dá acesso implícito: o assinante resgata o item primeiro
      // (POST /api/materiais/resgatar), o que cria a purchase que cai em
      // `purchasedSet` — é o resgate que marca o consumo do acervo.
      const hasAccess = isAuthenticated && (isAdmin || isPurchased || (hasGroupAccess && m.pricing !== 'paid'))
      // Assinante pode levar sem custo, mas ainda não resgatou.
      const includedInPlus = isPlus && !hasAccess

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

      // HTML interno: nunca expor blobUrl ao cliente
      const hasHtml = !!m.htmlFile?.blobUrl
      const htmlFileMeta = isAdmin && m.htmlFile
        ? {
            originalFilename: m.htmlFile.originalFilename,
            sizeBytes: m.htmlFile.sizeBytes,
            uploadedByName: m.htmlFile.uploadedByName,
            uploadedAt: m.htmlFile.uploadedAt,
          }
        : undefined

      // Remover pdfFile/htmlFile (com blobUrl) da resposta — substituídos por flags
      const { pdfFile: _removed, htmlFile: _removedHtml, ...rest } = m

      // Itens complementares avulsos podem ter seu próprio pdfFile/htmlFile —
      // nunca expor blobUrl; admin recebe metadados (sem URL), demais só o flag.
      if (Array.isArray(rest.complementaryItems)) {
        rest.complementaryItems = rest.complementaryItems.map((it: any) => {
          if (it?.kind !== 'custom') return it
          const { pdfFile, htmlFile, ...itemRest } = it
          return {
            ...itemRest,
            _hasPdf: !!pdfFile?.blobUrl,
            _hasHtml: !!htmlFile?.blobUrl,
            ...(isAdmin && pdfFile ? { _pdfFile: { originalFilename: pdfFile.originalFilename, sizeBytes: pdfFile.sizeBytes, uploadedByName: pdfFile.uploadedByName, uploadedAt: pdfFile.uploadedAt } } : {}),
            ...(isAdmin && htmlFile ? { _htmlFile: { originalFilename: htmlFile.originalFilename, sizeBytes: htmlFile.sizeBytes, uploadedByName: htmlFile.uploadedByName, uploadedAt: htmlFile.uploadedAt } } : {}),
          }
        })
      }

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
        _includedInPlus: includedInPlus,
        _hasPdf: hasPdf,
        _hasHtml: hasHtml,
        pdfViewerEnabled: m.pdfViewerEnabled === true,
        pdfDownloadEnabled: m.pdfDownloadEnabled !== false,
        htmlViewerEnabled: m.htmlViewerEnabled === true,
        ...(hasPdf && m.pdfFile?.pageCount ? { _pageCount: m.pdfFile.pageCount } : {}),
        ...(pdfFileMeta && { _pdfFile: pdfFileMeta }),
        ...(htmlFileMeta && { _htmlFile: htmlFileMeta }),
        ...(m.type === 'flashcard_deck' && { _cardCount: cardCountByMaterialId[idStr] ?? 0 }),
        _pricingEventState: serializePricingEventState(pricingEventState),
        // Versões por tempo publicadas (para o catálogo mostrar "a partir de").
        _timedAccessVersions: serializeTimedAccessVersions(m),
        // Prazo da posse atual, quando ela veio de uma versão por tempo.
        _timedAccess: timedAccessByMaterialId[idStr] || null,
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
      excludeFromCommission: body.excludeFromCommission === true,
      allowedGroups: body.allowedGroups || [],
      timedAccessVersions: sanitizeTimedAccessVersions(body.timedAccessVersions),
      pdfViewerEnabled: body.pdfViewerEnabled === true,
      pdfDownloadEnabled: body.pdfDownloadEnabled !== false,
      autoEmailPdfOnPurchase: body.autoEmailPdfOnPurchase === true,
      pdfViewerConfig: sanitizePdfViewerConfig(body.pdfViewerConfig) || { summary: [], navigation: [], preview: { enabled: false, ranges: [] } },
      htmlViewerEnabled: body.htmlViewerEnabled === true,
      complementaryMaterialIds: sanitizeComplementaryIds(body.complementaryMaterialIds, null),
      complementaryItems: sanitizeComplementaryItems(body.complementaryItems, null),
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
    if ('timedAccessVersions' in updates) {
      updates.timedAccessVersions = sanitizeTimedAccessVersions(updates.timedAccessVersions)
    }
    if ('htmlViewerEnabled' in updates) {
      updates.htmlViewerEnabled = updates.htmlViewerEnabled === true
    }
    if ('autoEmailPdfOnPurchase' in updates) {
      updates.autoEmailPdfOnPurchase = updates.autoEmailPdfOnPurchase === true
    }
    if ('excludeFromCommission' in updates) {
      updates.excludeFromCommission = updates.excludeFromCommission === true
    }
    if ('complementaryMaterialIds' in updates) {
      updates.complementaryMaterialIds = sanitizeComplementaryIds(updates.complementaryMaterialIds, _id)
    }
    if ('complementaryItems' in updates) {
      // Busca os itens já persistidos para preservar pdfFile/htmlFile enviados
      // por upload direto (o formulário do admin nunca os carrega de volta).
      const current = await db.collection('materials').findOne(
        { _id: new ObjectId(_id) },
        { projection: { complementaryItems: 1 } }
      )
      const existingById = new Map<string, any>(
        (current?.complementaryItems || []).map((it: any) => [String(it.id), it])
      )
      updates.complementaryItems = sanitizeComplementaryItems(updates.complementaryItems, _id, existingById)
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
      { projection: { linkedDeckId: 1, linkedDeckSlug: 1 } }
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

    // O <head> de /materiais/<id> (e do deck vinculado) é cacheado junto com o
    // HTML estático da rota; sem isto o preço novo não aparece nos metatags.
    revalidateMetadataPaths(materialMetadataPaths({ _id, linkedDeckSlug: material?.linkedDeckSlug }))

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

    const removed = await db.collection('materials').findOne(
      { _id: new ObjectId(id) },
      { projection: { linkedDeckSlug: 1 } }
    )

    await db.collection('materials').deleteOne({ _id: new ObjectId(id) })

    revalidateMetadataPaths(materialMetadataPaths({ _id: id, linkedDeckSlug: removed?.linkedDeckSlug }))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json({ error: 'Erro ao deletar material' }, { status: 500 })
  }
}
