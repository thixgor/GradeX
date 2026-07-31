import { Db, ObjectId } from 'mongodb'
import { computeEffectivePackagePrice, type EffectivePackagePrice } from './material-package-pricing'
import { audit } from './payments/audit'
import type { MaterialPurchase } from './types'
import { isPlusAccount } from './account-tier'

export type MaterialCartItemType = 'material' | 'package'

export interface MaterialCartItemInput {
  itemType: MaterialCartItemType
  itemId: string
}

export interface MaterialCartSession {
  userId: string
  name?: string
  email?: string
  role?: string
}

export interface MaterialCartResolvedItem {
  itemType: MaterialCartItemType
  itemId: string
  itemTitle: string
  materialType?: string
  linkedDeckSlug?: string
  materialIds?: string[]
  price: number
  originalPrice: number
  discountApplied: number
  ownedMaterialIds: string[]
  /** Evento de lote dinâmico associado a este item (null se sem evento). */
  pricingEventId?: string | null
  /** Quando true, este item não entra na comissão do sócio (split marketplace). */
  excludeFromCommission?: boolean
}

export interface MaterialCartSkippedItem {
  itemType: MaterialCartItemType
  itemId: string
  reason: 'invalid' | 'duplicate' | 'not_found' | 'already_owned' | 'included_in_cart_package'
  itemTitle?: string
  /** Quando reason === 'included_in_cart_package', título do pacote do carrinho que contém este material. */
  includedInPackageTitle?: string
  includedInPackageId?: string
}

export interface MaterialCartResolution {
  items: MaterialCartResolvedItem[]
  payableItems: MaterialCartResolvedItem[]
  freeItems: MaterialCartResolvedItem[]
  skippedItems: MaterialCartSkippedItem[]
  amount: number
}

/**
 * Sugestão de "trocar N materiais soltos do carrinho por 1 pacote".
 * Calculada sempre no servidor — preços nunca vêm do cliente.
 */
export interface CartUpgradeSuggestion {
  packageId: string
  packageTitle: string
  packageCoverImage?: string
  /** Quanto o usuário pagaria pelo pacote (já com desconto por materiais que ele JÁ possui — não conta itens só no carrinho). */
  packageEffectivePrice: number
  packageOriginalPrice: number
  /** Materiais do carrinho que estão dentro deste pacote (serão substituídos pelo pacote). */
  cartMaterialIds: string[]
  cartMaterialTitles: string[]
  /** Soma do que seria pago pelos materiais soltos no carrinho que o pacote substitui. */
  currentCost: number
  /** currentCost − packageEffectivePrice. Positivo = economia, negativo = "pague R$X a mais por mais conteúdo". */
  savings: number
  /** Total de materiais dentro do pacote. */
  totalMaterialsInPackage: number
  /** Itens extras que o usuário ganharia (totalMaterialsInPackage − cartMaterialIds.length − materiais já possuídos). */
  extraMaterialsCount: number
}

export const MAX_MATERIAL_CART_ITEMS = 30

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function roundMoney(value: number) {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100)
}

function normalizeInputItems(items: MaterialCartItemInput[]) {
  const normalized: MaterialCartItemInput[] = []
  const skippedItems: MaterialCartSkippedItem[] = []
  const seen = new Set<string>()

  for (const raw of items.slice(0, MAX_MATERIAL_CART_ITEMS)) {
    const itemType = raw?.itemType
    const itemId = String(raw?.itemId || '')
    if ((itemType !== 'material' && itemType !== 'package') || !ObjectId.isValid(itemId)) {
      skippedItems.push({
        itemType: itemType === 'package' ? 'package' : 'material',
        itemId,
        reason: 'invalid',
      })
      continue
    }

    const key = `${itemType}:${itemId}`
    if (seen.has(key)) {
      skippedItems.push({ itemType, itemId, reason: 'duplicate' })
      continue
    }
    seen.add(key)
    normalized.push({ itemType, itemId })
  }

  return { normalized, skippedItems }
}

function buildUserGroups(userDoc: any) {
  const userGroups: string[] = []
  if (userDoc?.accountType) userGroups.push(userDoc.accountType)
  if (userDoc?.secondaryRole === 'monitor') userGroups.push('monitor')
  return userGroups
}

function matchesAllowedGroups(allowedGroups: unknown, userGroups: string[]) {
  const groups = Array.isArray(allowedGroups) ? allowedGroups.map(String) : []
  return groups.length === 0 || userGroups.some((group) => groups.includes(group))
}

async function getCompletedPurchases(
  db: Db,
  session: MaterialCartSession
): Promise<Array<{ itemType?: string; itemId?: string }>> {
  const baseFilter = {
    status: 'completed',
    itemType: { $in: ['material', 'package'] },
  }

  const byUserId = await db.collection<MaterialPurchase>('material_purchases')
    .find({ ...baseFilter, userId: session.userId } as any)
    .project({ itemType: 1, itemId: 1 })
    .toArray() as Array<{ itemType?: string; itemId?: string }>

  let byEmail: Array<{ itemType?: string; itemId?: string }> = []
  if (session.email) {
    byEmail = await db.collection<MaterialPurchase>('material_purchases')
      .find({
        ...baseFilter,
        userEmail: { $regex: new RegExp(`^${escapeRegex(session.email)}$`, 'i') },
      } as any)
      .project({ itemType: 1, itemId: 1 })
      .toArray() as Array<{ itemType?: string; itemId?: string }>
  }

  return [...byUserId, ...byEmail]
}

export async function resolveMaterialCart(
  db: Db,
  session: MaterialCartSession,
  inputItems: MaterialCartItemInput[]
): Promise<MaterialCartResolution> {
  const { normalized, skippedItems } = normalizeInputItems(inputItems)
  const isAdmin = session.role === 'admin'

  const materialIds = normalized.filter(item => item.itemType === 'material').map(item => item.itemId)
  const packageIds = normalized.filter(item => item.itemType === 'package').map(item => item.itemId)

  const [materials, packages, purchases, userDoc] = await Promise.all([
    materialIds.length
      ? db.collection('materials')
          .find({ _id: { $in: materialIds.map(id => new ObjectId(id)) } })
          .project({ title: 1, pricing: 1, price: 1, type: 1, linkedDeckSlug: 1, allowedGroups: 1, pricingEventId: 1, excludeFromCommission: 1 })
          .toArray()
      : Promise.resolve([]),
    packageIds.length
      ? db.collection('material_packages')
          .find({ _id: { $in: packageIds.map(id => new ObjectId(id)) } })
          .project({ title: 1, pricing: 1, price: 1, materialIds: 1, allowedGroups: 1, pricingEventId: 1, excludeFromCommission: 1 })
          .toArray()
      : Promise.resolve([]),
    getCompletedPurchases(db, session),
    !isAdmin && ObjectId.isValid(session.userId)
      ? db.collection('users').findOne(
          { _id: new ObjectId(session.userId) },
          { projection: { accountType: 1, secondaryRole: 1 } }
        )
      : Promise.resolve(null),
  ])
  const userGroups = buildUserGroups(userDoc)
  // Plus+ libera TODO o acervo — é conteúdo da própria plataforma, então a
  // assinatura substitui a compra individual no carrinho.
  const isPlus = isPlusAccount((userDoc as any)?.accountType)

  const materialsById = new Map(materials.map((material: any) => [String(material._id), material]))
  const packagesById = new Map(packages.map((pkg: any) => [String(pkg._id), pkg]))

  const ownedPackageIds = new Set(
    purchases
      .filter((purchase: any) => purchase.itemType === 'package')
      .map((purchase: any) => String(purchase.itemId))
  )
  const ownedMaterialIds = new Set(
    purchases
      .filter((purchase: any) => purchase.itemType === 'material')
      .map((purchase: any) => String(purchase.itemId))
  )

  const ownedPackageObjectIds = Array.from(ownedPackageIds)
    .filter(ObjectId.isValid)
    .map(id => new ObjectId(id))

  if (ownedPackageObjectIds.length > 0) {
    const ownedPackages = await db.collection('material_packages')
      .find({ _id: { $in: ownedPackageObjectIds } })
      .project({ materialIds: 1 })
      .toArray()

    for (const pkg of ownedPackages as any[]) {
      for (const materialId of pkg.materialIds || []) {
        ownedMaterialIds.add(String(materialId))
      }
    }
  }

  const requestedPackages = normalized.filter(item => item.itemType === 'package')
  const requestedMaterials = normalized.filter(item => item.itemType === 'material')
  const packageMaterialIds = Array.from(new Set(
    requestedPackages.flatMap(item => {
      const pkg = packagesById.get(item.itemId)
      return (pkg?.materialIds || []).map((materialId: string) => String(materialId))
    })
  )).filter(ObjectId.isValid)

  const packageMaterials = packageMaterialIds.length > 0
    ? await db.collection('materials')
        .find({ _id: { $in: packageMaterialIds.map(id => new ObjectId(id)) } })
        .project({ pricing: 1, price: 1 })
        .toArray()
    : []
  const packageMaterialsById = new Map(packageMaterials.map((material: any) => [String(material._id), material]))

  const acceptedItems: MaterialCartResolvedItem[] = []
  const cartPackageMaterialIds = new Set<string>()
  /** materialId -> { packageId, packageTitle } do pacote do carrinho que contém o material. */
  const cartPackageMaterialOwner = new Map<string, { packageId: string; packageTitle: string }>()
  const currentOwnedMaterialIds = new Set(ownedMaterialIds)

  for (const requested of requestedPackages) {
    const pkg: any = packagesById.get(requested.itemId)
    if (!pkg) {
      skippedItems.push({ ...requested, reason: 'not_found' })
      continue
    }
    const hasPackageAccess =
      isAdmin ||
      isPlus ||
      ownedPackageIds.has(requested.itemId) ||
      (pkg.pricing !== 'paid' && matchesAllowedGroups(pkg.allowedGroups, userGroups))
    if (hasPackageAccess) {
      skippedItems.push({
        ...requested,
        reason: 'already_owned',
        itemTitle: pkg.title || 'Pacote',
      })
      continue
    }

    const materialIdsInPackage = (pkg.materialIds || []).map((materialId: string) => String(materialId))
    const materialsInPackage = materialIdsInPackage
      .map((materialId: string) => packageMaterialsById.get(materialId))
      .filter(Boolean)

    let pricingMeta: EffectivePackagePrice = {
      originalPackagePrice: roundMoney(pkg.price || 0),
      effectivePrice: roundMoney(pkg.price || 0),
      discountApplied: 0,
      ownedValue: 0,
      totalPaidIndividualValue: 0,
      ownedMaterialIds: [],
    }

    if (materialsInPackage.length > 0) {
      pricingMeta = computeEffectivePackagePrice({
        pkgPrice: Number(pkg.price || 0),
        materials: materialsInPackage.map((material: any) => ({
          _id: String(material._id),
          pricing: material.pricing,
          price: material.price,
        })),
        ownedMaterialIds: currentOwnedMaterialIds,
      })
    }

    const price = pkg.pricing === 'free' || !pkg.price || Number(pkg.price) <= 0
      ? 0
      : pricingMeta.effectivePrice

    if (pkg.pricing === 'paid' && price <= 0 && pricingMeta.totalPaidIndividualValue > 0 && pricingMeta.ownedValue >= pricingMeta.totalPaidIndividualValue) {
      skippedItems.push({
        ...requested,
        reason: 'already_owned',
        itemTitle: pkg.title || 'Pacote',
      })
      continue
    }

    acceptedItems.push({
      itemType: 'package',
      itemId: requested.itemId,
      itemTitle: pkg.title || 'Pacote',
      materialIds: materialIdsInPackage,
      price: roundMoney(price),
      originalPrice: pricingMeta.originalPackagePrice,
      discountApplied: pricingMeta.discountApplied,
      ownedMaterialIds: pricingMeta.ownedMaterialIds,
      pricingEventId: pkg.pricingEventId ? String(pkg.pricingEventId) : null,
      excludeFromCommission: pkg.excludeFromCommission === true,
    })

    for (const materialId of materialIdsInPackage) {
      cartPackageMaterialIds.add(materialId)
      currentOwnedMaterialIds.add(materialId)
      if (!cartPackageMaterialOwner.has(materialId)) {
        cartPackageMaterialOwner.set(materialId, {
          packageId: requested.itemId,
          packageTitle: pkg.title || 'Pacote',
        })
      }
    }
  }

  for (const requested of requestedMaterials) {
    const material: any = materialsById.get(requested.itemId)
    if (!material) {
      skippedItems.push({ ...requested, reason: 'not_found' })
      continue
    }
    const hasMaterialAccess =
      isAdmin ||
      isPlus ||
      ownedMaterialIds.has(requested.itemId) ||
      (material.pricing === 'free' && matchesAllowedGroups(material.allowedGroups, userGroups))
    if (hasMaterialAccess) {
      skippedItems.push({
        ...requested,
        reason: 'already_owned',
        itemTitle: material.title || 'Material',
      })
      continue
    }
    if (cartPackageMaterialIds.has(requested.itemId)) {
      const owner = cartPackageMaterialOwner.get(requested.itemId)
      skippedItems.push({
        ...requested,
        reason: 'included_in_cart_package',
        itemTitle: material.title || 'Material',
        includedInPackageId: owner?.packageId,
        includedInPackageTitle: owner?.packageTitle,
      })
      continue
    }

    const price = material.pricing === 'free' || !material.price || Number(material.price) <= 0
      ? 0
      : Number(material.price)

    acceptedItems.push({
      itemType: 'material',
      itemId: requested.itemId,
      itemTitle: material.title || 'Material',
      materialType: material.type,
      linkedDeckSlug: material.linkedDeckSlug,
      price: roundMoney(price),
      originalPrice: roundMoney(price),
      discountApplied: 0,
      ownedMaterialIds: [],
      pricingEventId: material.pricingEventId ? String(material.pricingEventId) : null,
      excludeFromCommission: material.excludeFromCommission === true,
    })
  }

  const payableItems = acceptedItems.filter(item => item.price > 0)
  const freeItems = acceptedItems.filter(item => item.price <= 0)
  const amount = roundMoney(payableItems.reduce((sum, item) => sum + item.price, 0))

  return {
    items: acceptedItems,
    payableItems,
    freeItems,
    skippedItems,
    amount,
  }
}

export function serializeMaterialCartItem(item: MaterialCartResolvedItem) {
  return {
    itemType: item.itemType,
    itemId: item.itemId,
    itemTitle: item.itemTitle,
    materialType: item.materialType,
    linkedDeckSlug: item.linkedDeckSlug,
    materialIds: item.materialIds,
    price: item.price,
    originalPrice: item.originalPrice,
    discountApplied: item.discountApplied,
    ownedMaterialIds: item.ownedMaterialIds,
    pricingEventId: item.pricingEventId || null,
    excludeFromCommission: item.excludeFromCommission === true,
  }
}

export async function grantMaterialCartItems(
  db: Db,
  session: MaterialCartSession,
  items: MaterialCartResolvedItem[],
  options: {
    providerOrderId?: string
    providerPaymentId?: string
    auditMetadata?: Record<string, any>
  } = {}
) {
  for (const item of items) {
    const collection = item.itemType === 'package' ? 'material_packages' : 'materials'
    const providerFilter = options.providerOrderId
      ? { providerOrderId: options.providerOrderId }
      : { status: 'completed' }
    const purchaseSet: Partial<MaterialPurchase> = {
      userId: session.userId,
      userName: session.name || '',
      userEmail: session.email || '',
      itemType: item.itemType,
      itemId: item.itemId,
      itemTitle: item.itemTitle,
      price: item.price,
      provider: 'mercado_pago',
      status: 'completed',
      purchasedAt: new Date(),
    }

    if (options.providerOrderId) purchaseSet.providerOrderId = options.providerOrderId
    if (options.providerPaymentId) purchaseSet.providerPaymentId = options.providerPaymentId

    await db.collection<MaterialPurchase>('material_purchases').updateOne(
      {
        userId: session.userId,
        itemType: item.itemType,
        itemId: item.itemId,
        ...providerFilter,
      } as any,
      {
        $set: purchaseSet,
      },
      { upsert: true }
    )

    if (ObjectId.isValid(item.itemId)) {
      await db.collection(collection).updateOne(
        { _id: new ObjectId(item.itemId) },
        { $inc: { downloadCount: 1 } }
      )
    }

    await audit({
      action: 'material_unlocked',
      targetUserId: session.userId,
      resourceType: item.itemType,
      resourceId: item.itemId,
      metadata: {
        amount: item.price,
        itemTitle: item.itemTitle,
        providerOrderId: options.providerOrderId,
        ...(options.auditMetadata || {}),
      },
    })
  }
}

/** Máximo de sugestões devolvidas por preview. */
const MAX_SUGGESTIONS = 2

/** Trade-off mínimo (cartMaterialsCobertos × extrasNoPacote) para sugerir um pacote sem economia direta. */
const COVERAGE_THRESHOLD = 2

/**
 * Encontra oportunidades de "trocar N materiais soltos do carrinho por 1 pacote".
 *
 * Critérios para sugerir:
 *  - Pacote contém ≥1 material atualmente no carrinho;
 *  - Pacote NÃO está no carrinho;
 *  - Usuário NÃO é dono do pacote (nem por compra direta, nem incluído em outro);
 *  - Há ganho real: economia em R$ OU cobertura ≥ {@link COVERAGE_THRESHOLD} materiais.
 *
 * Preço do pacote é recalculado com `computeEffectivePackagePrice` contra os materiais
 * que o usuário JÁ POSSUI (não os que estão no carrinho — esses ainda não foram pagos).
 * Sempre roda no servidor, nunca confia em valores do cliente.
 */
export async function computeCartUpgradeSuggestions(
  db: Db,
  session: MaterialCartSession,
  resolution: MaterialCartResolution
): Promise<CartUpgradeSuggestion[]> {
  const cartMaterials = resolution.items.filter(item => item.itemType === 'material')
  if (cartMaterials.length === 0) return []

  const cartMaterialIds = cartMaterials.map(m => m.itemId)
  const cartMaterialIdSet = new Set(cartMaterialIds)
  const cartPackageIds = new Set(
    resolution.items.filter(item => item.itemType === 'package').map(item => item.itemId)
  )

  const validCartMaterialObjectIds = cartMaterialIds
    .filter(ObjectId.isValid)
    .map(id => new ObjectId(id))
  if (validCartMaterialObjectIds.length === 0) return []

  const purchases = await getCompletedPurchases(db, session)
  const ownedPackageIds = new Set(
    purchases
      .filter((p: any) => p.itemType === 'package')
      .map((p: any) => String(p.itemId))
  )
  const ownedMaterialIds = new Set(
    purchases
      .filter((p: any) => p.itemType === 'material')
      .map((p: any) => String(p.itemId))
  )

  // Pacotes em aberto que contêm pelo menos um dos materiais do carrinho.
  const candidatePackages = await db.collection('material_packages')
    .find({
      materialIds: { $in: cartMaterialIds },
      isHidden: { $ne: true },
      pricing: 'paid',
      price: { $gt: 0 },
    })
    .project({ title: 1, price: 1, pricing: 1, materialIds: 1, coverImage: 1 })
    .toArray() as any[]

  // Filtra os que o usuário já tem ou já estão no carrinho.
  const eligiblePackages = candidatePackages.filter(pkg => {
    const pkgId = String(pkg._id)
    return !cartPackageIds.has(pkgId) && !ownedPackageIds.has(pkgId)
  })
  if (eligiblePackages.length === 0) return []

  // Carrega TODOS os materiais únicos referenciados pelos pacotes (para pricing) e
  // todos os materiais do carrinho (para mapear título/preço).
  const allMaterialIdsSet = new Set<string>()
  for (const pkg of eligiblePackages) {
    for (const id of pkg.materialIds || []) allMaterialIdsSet.add(String(id))
  }
  for (const id of cartMaterialIds) allMaterialIdsSet.add(id)

  const allMaterialObjectIds = Array.from(allMaterialIdsSet)
    .filter(ObjectId.isValid)
    .map(id => new ObjectId(id))

  const allMaterials = allMaterialObjectIds.length > 0
    ? await db.collection('materials')
        .find({ _id: { $in: allMaterialObjectIds } })
        .project({ title: 1, price: 1, pricing: 1 })
        .toArray() as any[]
    : []
  const materialsById = new Map(allMaterials.map(m => [String(m._id), m]))

  const cartMaterialPriceById = new Map<string, number>()
  for (const cartMat of cartMaterials) {
    cartMaterialPriceById.set(cartMat.itemId, Math.max(0, Number(cartMat.price || 0)))
  }

  const suggestions: CartUpgradeSuggestion[] = []

  for (const pkg of eligiblePackages) {
    const pkgMaterialIds = (pkg.materialIds || []).map((id: any) => String(id))
    const covered = pkgMaterialIds.filter((mid: string) => cartMaterialIdSet.has(mid))
    if (covered.length === 0) continue

    const materialsInPackage = pkgMaterialIds
      .map((mid: string) => materialsById.get(mid))
      .filter(Boolean)

    // Preço efetivo: desconta APENAS pelo que o usuário já é dono — itens no
    // carrinho ainda não foram pagos, então não viram crédito.
    const pricingMeta = computeEffectivePackagePrice({
      pkgPrice: Number(pkg.price || 0),
      materials: materialsInPackage.map((m: any) => ({
        _id: String(m._id),
        pricing: m.pricing,
        price: m.price,
      })),
      ownedMaterialIds,
    })

    const currentCost = covered.reduce(
      (sum: number, mid: string) => sum + (cartMaterialPriceById.get(mid) || 0),
      0
    )
    const savings = roundMoney(currentCost - pricingMeta.effectivePrice)
    const ownedInsidePackage = pricingMeta.ownedMaterialIds.length
    const extraMaterialsCount = Math.max(
      0,
      pkgMaterialIds.length - covered.length - ownedInsidePackage
    )

    // Worth-it heuristic: economia direta OU cobertura significativa.
    const isWorthSuggesting =
      savings > 0 ||
      (covered.length >= COVERAGE_THRESHOLD && extraMaterialsCount >= COVERAGE_THRESHOLD)
    if (!isWorthSuggesting) continue

    suggestions.push({
      packageId: String(pkg._id),
      packageTitle: pkg.title || 'Pacote',
      packageCoverImage: pkg.coverImage,
      packageEffectivePrice: pricingMeta.effectivePrice,
      packageOriginalPrice: pricingMeta.originalPackagePrice,
      cartMaterialIds: covered,
      cartMaterialTitles: covered.map((mid: string) => {
        const m = materialsById.get(mid)
        return m?.title || 'Material'
      }),
      currentCost: roundMoney(currentCost),
      savings,
      totalMaterialsInPackage: pkgMaterialIds.length,
      extraMaterialsCount,
    })
  }

  // Melhor sugestão primeiro: maior economia, depois maior cobertura.
  suggestions.sort((a, b) => {
    if (b.savings !== a.savings) return b.savings - a.savings
    return b.cartMaterialIds.length - a.cartMaterialIds.length
  })

  return suggestions.slice(0, MAX_SUGGESTIONS)
}
