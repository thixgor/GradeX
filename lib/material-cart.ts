import { Db, ObjectId } from 'mongodb'
import { computeEffectivePackagePrice, type EffectivePackagePrice } from './material-package-pricing'
import { audit } from './payments/audit'
import type { MaterialPurchase } from './types'

export type MaterialCartItemType = 'material' | 'package'

export interface MaterialCartItemInput {
  itemType: MaterialCartItemType
  itemId: string
}

export interface MaterialCartSession {
  userId: string
  name?: string
  email?: string
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
}

export interface MaterialCartSkippedItem {
  itemType: MaterialCartItemType
  itemId: string
  reason: 'invalid' | 'duplicate' | 'not_found' | 'already_owned' | 'included_in_cart_package'
}

export interface MaterialCartResolution {
  items: MaterialCartResolvedItem[]
  payableItems: MaterialCartResolvedItem[]
  freeItems: MaterialCartResolvedItem[]
  skippedItems: MaterialCartSkippedItem[]
  amount: number
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

  const materialIds = normalized.filter(item => item.itemType === 'material').map(item => item.itemId)
  const packageIds = normalized.filter(item => item.itemType === 'package').map(item => item.itemId)

  const [materials, packages, purchases] = await Promise.all([
    materialIds.length
      ? db.collection('materials')
          .find({ _id: { $in: materialIds.map(id => new ObjectId(id)) } })
          .project({ title: 1, pricing: 1, price: 1, type: 1, linkedDeckSlug: 1 })
          .toArray()
      : Promise.resolve([]),
    packageIds.length
      ? db.collection('material_packages')
          .find({ _id: { $in: packageIds.map(id => new ObjectId(id)) } })
          .project({ title: 1, pricing: 1, price: 1, materialIds: 1 })
          .toArray()
      : Promise.resolve([]),
    getCompletedPurchases(db, session),
  ])

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
  const currentOwnedMaterialIds = new Set(ownedMaterialIds)

  for (const requested of requestedPackages) {
    const pkg: any = packagesById.get(requested.itemId)
    if (!pkg) {
      skippedItems.push({ ...requested, reason: 'not_found' })
      continue
    }
    if (ownedPackageIds.has(requested.itemId)) {
      skippedItems.push({ ...requested, reason: 'already_owned' })
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

    acceptedItems.push({
      itemType: 'package',
      itemId: requested.itemId,
      itemTitle: pkg.title || 'Pacote',
      materialIds: materialIdsInPackage,
      price: roundMoney(price),
      originalPrice: pricingMeta.originalPackagePrice,
      discountApplied: pricingMeta.discountApplied,
      ownedMaterialIds: pricingMeta.ownedMaterialIds,
    })

    for (const materialId of materialIdsInPackage) {
      cartPackageMaterialIds.add(materialId)
      currentOwnedMaterialIds.add(materialId)
    }
  }

  for (const requested of requestedMaterials) {
    const material: any = materialsById.get(requested.itemId)
    if (!material) {
      skippedItems.push({ ...requested, reason: 'not_found' })
      continue
    }
    if (ownedMaterialIds.has(requested.itemId)) {
      skippedItems.push({ ...requested, reason: 'already_owned' })
      continue
    }
    if (cartPackageMaterialIds.has(requested.itemId)) {
      skippedItems.push({ ...requested, reason: 'included_in_cart_package' })
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
