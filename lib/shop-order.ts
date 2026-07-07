/**
 * Helper compartilhado para montar o pedido físico (shop_orders) dentro de um
 * checkout — usado tanto pelo checkout só-físico (/api/loja/checkout) quanto pelo
 * checkout unificado (/api/materiais/checkout, físico + digital numa compra).
 *
 * Resolve os produtos, valida a regra de add-on (só junto ao material vinculado),
 * estoque e versões, calcula frete (com frete grátis) e cria o shop_orders como
 * `awaiting_payment`. O chamador cria a payment_orders e liga via providerOrderId.
 */

import { ObjectId, type Db } from 'mongodb'
import { computeFreight, estimateDeliveryDate, generateOrderNumber, defaultShopSettings } from './shop'
import type { PhysicalProduct, ShopOrder, ShopOrderItem, ShopSettings, ShippingAddress } from './types'

export interface PhysicalCheckoutInput {
  items: { productId: string; quantity: number; versionId?: string }[]
  deliveryType: 'pickup' | 'shipping'
  pickupPointId?: string
  shippingAddress?: ShippingAddress
  deliveryMethodId?: string
}

export type BuildPhysicalResult =
  | {
      ok: true
      empty?: false
      shopOrderId: string
      orderNumber: string
      subtotal: number
      freight: number
      total: number
      itemCount: number
      skipped: { title: string; reason: string }[]
    }
  /** Nenhum item físico elegível (ex.: add-on sem o material) — segue só com o digital. */
  | { ok: true; empty: true }
  | { ok: false; error: string; status: number }

export async function buildPhysicalShopOrder(
  db: Db,
  session: { userId: string; name: string; email: string },
  input: PhysicalCheckoutInput,
  opts: { eligibleMaterialIds: Set<string> }
): Promise<BuildPhysicalResult> {
  const ids = (input.items || []).map((i) => i.productId).filter((id) => ObjectId.isValid(id))
  const products = ids.length
    ? await db
        .collection<PhysicalProduct>('physical_products')
        .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
        .toArray()
    : []
  const byId = new Map(products.map((p) => [String(p._id), p]))

  const orderItems: ShopOrderItem[] = []
  const skipped: { title: string; reason: string }[] = []
  let subtotal = 0
  let maxProductionDays = 0

  for (const line of input.items || []) {
    const p = byId.get(line.productId)
    if (!p || p.isHidden) {
      skipped.push({ title: p?.title || 'Item', reason: 'unavailable' })
      continue
    }
    // Add-on: só entra se o material vinculado estiver sendo comprado.
    if (p.linkMode === 'addon') {
      if (!p.linkedMaterialId || !opts.eligibleMaterialIds.has(String(p.linkedMaterialId))) {
        skipped.push({ title: p.title, reason: 'addon_requires_material' })
        continue
      }
    }
    if (p.trackStock && typeof p.stock === 'number' && p.stock < line.quantity) {
      return { ok: false, error: `Estoque insuficiente para "${p.title}"`, status: 409 }
    }
    const baseUnit = p.linkMode === 'addon' ? (p.addonSurcharge ?? p.price) : p.price
    let versionId: string | undefined
    let versionName: string | undefined
    let unitPrice = baseUnit
    if (Array.isArray(p.versions) && p.versions.length > 0) {
      const version = p.versions.find((v) => v.id === line.versionId)
      if (!version) return { ok: false, error: `Selecione uma versão para "${p.title}"`, status: 400 }
      versionId = version.id
      versionName = version.name
      unitPrice = typeof version.price === 'number' ? version.price : baseUnit
    }
    subtotal += unitPrice * line.quantity
    if (p.madeToOrder && p.productionDays) maxProductionDays = Math.max(maxProductionDays, p.productionDays)
    orderItems.push({
      productId: String(p._id),
      title: p.title,
      imageUrl: p.images?.[0],
      unitPrice,
      quantity: line.quantity,
      versionId,
      versionName,
      isAddon: p.linkMode === 'addon',
      linkedMaterialId: p.linkedMaterialId,
      madeToOrder: p.madeToOrder,
      productionDays: p.productionDays,
    })
  }

  if (orderItems.length === 0) {
    // Nada elegível (ex.: add-ons sem o material vinculado) — não bloqueia o digital.
    return { ok: true, empty: true }
  }
  subtotal = Math.round(subtotal * 100) / 100

  const settings =
    (await db.collection<ShopSettings>('shop_settings').findOne({ settingsId: 'shop' })) ||
    (defaultShopSettings() as ShopSettings)

  let freight = 0
  let deliveryMeta: Partial<ShopOrder> = {}

  if (input.deliveryType === 'pickup') {
    const point = (settings.pickupPoints || []).find((pp) => pp.id === input.pickupPointId && pp.enabled)
    if (!point) return { ok: false, error: 'Ponto de retirada inválido', status: 400 }
    deliveryMeta = {
      deliveryType: 'pickup',
      pickupPointId: point.id,
      pickupPointName: point.name,
      estimatedDeliveryDate: estimateDeliveryDate({ deliveryType: 'pickup', maxProductionDays }),
    }
  } else {
    if (!input.shippingAddress) return { ok: false, error: 'Endereço de entrega obrigatório', status: 400 }
    const method = (settings.deliveryMethods || []).find((m) => m.id === input.deliveryMethodId && m.enabled)
    if (!method) return { ok: false, error: 'Método de entrega inválido', status: 400 }
    freight = computeFreight({ method, uf: input.shippingAddress.uf, physicalSubtotal: subtotal, settings })
    deliveryMeta = {
      deliveryType: 'shipping',
      shippingAddress: { ...input.shippingAddress, uf: String(input.shippingAddress.uf || '').toUpperCase() },
      deliveryMethodId: method.id,
      deliveryMethodName: method.name,
      estimatedDeliveryDate: estimateDeliveryDate({ deliveryType: 'shipping', method, maxProductionDays }),
    }
  }

  const total = Math.round((subtotal + freight) * 100) / 100
  const now = new Date()
  const orderNumber = generateOrderNumber()
  const shopOrderDoc: Omit<ShopOrder, '_id'> = {
    orderNumber,
    userId: session.userId,
    userName: session.name,
    userEmail: session.email,
    items: orderItems,
    subtotal,
    freight,
    discount: 0,
    total,
    ...(deliveryMeta as any),
    provider: 'mercado_pago',
    paymentStatus: 'pending',
    status: 'awaiting_payment',
    statusHistory: [{ status: 'awaiting_payment', at: now }],
    createdAt: now,
    updatedAt: now,
  }
  const shopInsert = await db.collection('shop_orders').insertOne(shopOrderDoc as any)
  return {
    ok: true,
    shopOrderId: String(shopInsert.insertedId),
    orderNumber,
    subtotal,
    freight,
    total,
    itemCount: orderItems.length,
    skipped,
  }
}
