import { Db, ObjectId } from 'mongodb'
import type { ManualClinicoPlanKey, ManualClinicoPurchase, MaterialPurchase, User } from '@/lib/types'
import { MANUAL_CLINICO_PURCHASES_COLLECTION } from '@/lib/manual-clinico-product'

export type CouponDiscountType = 'percentage' | 'fixed'
export type CouponScope = 'all' | 'materials' | 'flashcards' | 'manual_clinico' | 'plus' | 'specific'
export type CouponDurationUnit = 'hours' | 'days' | 'weeks' | 'months'
export type CouponProductType = 'material' | 'package' | 'manual_clinico' | 'plus'
export type CouponRedemptionStatus = 'reserved' | 'approved' | 'released'

export interface CouponProductRef {
  itemType: CouponProductType
  itemId: string
  title?: string
  kind?: 'material' | 'flashcard' | 'package' | 'product' | 'plan'
}

export interface Coupon {
  _id?: string | ObjectId
  code: string
  codeNormalized: string
  description?: string
  discountType: CouponDiscountType
  discountValue: number
  scope: CouponScope
  productRefs?: CouponProductRef[]
  usageLimit?: number | null
  perUserLimit?: number | null
  minimumCartAmount?: number | null
  firstPurchaseOnly?: boolean
  allowedAfyaUnits?: string[]
  /**
   * Planos do Manual Clínico aos quais o cupom se restringe. Vazio/ausente =
   * vale para todos os planos. Só tem efeito quando o item é manual_clinico.
   */
  allowedManualPlans?: ManualClinicoPlanKey[] | null
  /**
   * Se true, o desconto do cupom é aplicado EM CIMA do desconto de lote
   * (pricing event) — cupom sobre cupom. Se false (padrão), vale a regra do
   * "maior dos dois" (lote OU cupom, o que for maior).
   */
  stackWithTier?: boolean
  usageCount: number
  expiresAt?: Date | null
  durationValue?: number | null
  durationUnit?: CouponDurationUnit | null
  isActive: boolean
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export interface CouponRedemption {
  _id?: string | ObjectId
  couponId: string
  code: string
  userId: string
  userName?: string
  userEmail?: string
  orderId?: string
  amountBeforeCoupon: number
  eligibleAmount: number
  discountAmount: number
  amountAfterCoupon: number
  status: CouponRedemptionStatus
  items: CouponRedemptionItem[]
  createdAt: Date
  approvedAt?: Date
  releasedAt?: Date
  releaseReason?: string
}

export interface CouponCheckoutItem {
  itemType: CouponProductType
  itemId: string
  itemTitle: string
  materialType?: string
  price: number
}

export interface CouponRedemptionItem extends CouponCheckoutItem {
  kind: 'material' | 'flashcard' | 'package' | 'product' | 'plan'
  discountAmount: number
  amountAfterDiscount: number
}

export interface CouponValidationResult {
  coupon: Coupon
  couponId: string
  code: string
  label: string
  amountBeforeCoupon: number
  eligibleAmount: number
  discountAmount: number
  amountAfterCoupon: number
  items: CouponRedemptionItem[]
}

export class CouponError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'CouponError'
    this.status = status
  }
}

export function normalizeCouponCode(code: string) {
  return String(code || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
}

export function roundMoney(value: number) {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100)
}

export function addCouponDuration(createdAt: Date, value: number, unit: CouponDurationUnit) {
  const expiresAt = new Date(createdAt)
  if (unit === 'hours') expiresAt.setHours(expiresAt.getHours() + value)
  if (unit === 'days') expiresAt.setDate(expiresAt.getDate() + value)
  if (unit === 'weeks') expiresAt.setDate(expiresAt.getDate() + value * 7)
  if (unit === 'months') expiresAt.setMonth(expiresAt.getMonth() + value)
  return expiresAt
}

export function getCouponItemKind(item: Pick<CouponCheckoutItem, 'itemType' | 'materialType'>): 'material' | 'flashcard' | 'package' | 'product' | 'plan' {
  if (item.itemType === 'plus') return 'plan'
  if (item.itemType === 'manual_clinico') return 'product'
  if (item.itemType === 'package') return 'package'
  return item.materialType === 'flashcard_deck' ? 'flashcard' : 'material'
}

export function isCouponExpired(coupon: Coupon, now = new Date()) {
  if (!coupon.expiresAt) return false
  const expiresAt = coupon.expiresAt instanceof Date ? coupon.expiresAt : new Date(coupon.expiresAt)
  return !Number.isNaN(expiresAt.getTime()) && expiresAt <= now
}

export function isCouponUsageExhausted(coupon: Coupon) {
  return typeof coupon.usageLimit === 'number' && coupon.usageLimit > 0 && Number(coupon.usageCount || 0) >= coupon.usageLimit
}

export function isCouponItemEligible(coupon: Coupon, item: CouponCheckoutItem) {
  // Assinatura Plus+ é um produto à parte (recorrente, fora do catálogo de
  // materiais) — só cupons criados explicitamente com escopo `plus` a
  // alcançam. Sem esta guarda, um cupom `all` (pensado só para materiais,
  // flashcards e produtos avulsos) passaria a descontar assinaturas também,
  // um alcance que nenhum cupom existente foi criado esperando ter.
  if (item.itemType === 'plus') return coupon.scope === 'plus'
  const kind = getCouponItemKind(item)
  if (coupon.scope === 'all') return true
  if (coupon.scope === 'materials') return kind === 'material' || kind === 'package'
  if (coupon.scope === 'flashcards') return kind === 'flashcard'
  if (coupon.scope === 'manual_clinico') return item.itemType === 'manual_clinico'
  if (coupon.scope === 'specific') {
    return (coupon.productRefs || []).some((ref) =>
      ref.itemType === item.itemType && String(ref.itemId) === String(item.itemId)
    )
  }
  return false
}

export function computeCouponDiscount(discountType: CouponDiscountType, discountValue: number, eligibleAmount: number) {
  const safeEligibleAmount = roundMoney(eligibleAmount)
  const safeDiscountValue = Math.max(0, Number(discountValue || 0))
  if (safeEligibleAmount <= 0 || safeDiscountValue <= 0) return 0
  if (discountType === 'percentage') {
    return roundMoney(Math.min(safeEligibleAmount, safeEligibleAmount * (safeDiscountValue / 100)))
  }
  return roundMoney(Math.min(safeEligibleAmount, safeDiscountValue))
}

function formatMoney(value: number) {
  return `R$ ${roundMoney(value).toFixed(2).replace('.', ',')}`
}

export function getCouponLabel(coupon: Coupon) {
  if (coupon.discountType === 'percentage') return `${Number(coupon.discountValue || 0)}% OFF`
  return `${formatMoney(coupon.discountValue)} OFF`
}

function buildItemDiscounts(items: CouponCheckoutItem[], discountAmount: number, coupon: Coupon): CouponRedemptionItem[] {
  const eligibleItems = items.filter((item) => isCouponItemEligible(coupon, item) && Number(item.price || 0) > 0)
  const eligibleAmount = roundMoney(eligibleItems.reduce((total, item) => total + Number(item.price || 0), 0))
  let remaining = roundMoney(discountAmount)

  return items.map((item) => {
    const price = roundMoney(item.price)
    const isEligible = eligibleItems.some((eligible) => eligible.itemType === item.itemType && eligible.itemId === item.itemId)
    let itemDiscount = 0

    if (isEligible && remaining > 0 && eligibleAmount > 0) {
      const isLastEligible = eligibleItems[eligibleItems.length - 1]?.itemType === item.itemType &&
        eligibleItems[eligibleItems.length - 1]?.itemId === item.itemId
      itemDiscount = isLastEligible
        ? remaining
        : roundMoney(discountAmount * (price / eligibleAmount))
      itemDiscount = Math.min(price, itemDiscount, remaining)
      remaining = roundMoney(remaining - itemDiscount)
    }

    return {
      ...item,
      price,
      kind: getCouponItemKind(item),
      discountAmount: itemDiscount,
      amountAfterDiscount: roundMoney(price - itemDiscount),
    }
  })
}

export function applyCouponDiscountsToItems<T extends CouponCheckoutItem>(
  items: T[],
  discounts: CouponRedemptionItem[]
): T[] {
  const discountByKey = new Map(discounts.map((item) => [`${item.itemType}:${item.itemId}`, item]))
  return items.map((item) => {
    const discount = discountByKey.get(`${item.itemType}:${item.itemId}`)
    if (!discount) return item
    return {
      ...item,
      price: discount.amountAfterDiscount,
    }
  })
}

export const MANUAL_PLAN_LABELS: Record<ManualClinicoPlanKey, string> = {
  semestral: 'Semestral',
  anual: 'Anual',
  vitalicio: 'Vitalício',
}

export async function validateCouponForCheckout(
  db: Db,
  input: {
    code: string
    items: CouponCheckoutItem[]
    amountBeforeCoupon?: number
    userId?: string
    userEmail?: string
    now?: Date
    /** Plano do Manual Clínico selecionado (para restrição por plano). */
    manualPlanKey?: ManualClinicoPlanKey | string
    /**
     * Desconto de lote (pricing event) já calculado sobre a base. Usado apenas
     * quando o cupom é `stackWithTier`, para calcular o cupom sobre o preço já
     * com o lote aplicado (cupom sobre cupom).
     */
    tierDiscountAmount?: number
  }
): Promise<CouponValidationResult> {
  const codeNormalized = normalizeCouponCode(input.code)
  if (!codeNormalized) throw new CouponError('Informe um cupom.')

  const coupon = await db.collection<Coupon>('coupons').findOne({ codeNormalized })
  if (!coupon) throw new CouponError('Cupom não encontrado.', 404)

  const now = input.now || new Date()
  if (!coupon.isActive) throw new CouponError('Este cupom está inativo.')
  if (isCouponExpired(coupon, now)) throw new CouponError('Este cupom expirou.')
  if (isCouponUsageExhausted(coupon)) throw new CouponError('Este cupom atingiu o limite de uso.')

  const items = input.items.map((item) => ({ ...item, price: roundMoney(item.price) }))
  const amountBeforeCoupon = roundMoney(
    input.amountBeforeCoupon ?? items.reduce((total, item) => total + Number(item.price || 0), 0)
  )
  if (amountBeforeCoupon <= 0) {
    throw new CouponError('Cupom só pode ser aplicado a compras pagas.')
  }
  if (typeof coupon.minimumCartAmount === 'number' && coupon.minimumCartAmount > 0 && amountBeforeCoupon < coupon.minimumCartAmount) {
    throw new CouponError(`Este cupom exige compra mínima de ${formatMoney(coupon.minimumCartAmount)}.`)
  }

  if (coupon.firstPurchaseOnly || coupon.allowedAfyaUnits?.length || isCouponPerUserLimitEnabled(coupon)) {
    await validateUserCouponRules(db, coupon, {
      userId: input.userId,
      userEmail: input.userEmail,
    })
  }

  const eligibleItems = items.filter((item) => isCouponItemEligible(coupon, item) && item.price > 0)
  const eligibleAmount = roundMoney(eligibleItems.reduce((total, item) => total + item.price, 0))
  if (eligibleAmount <= 0) {
    throw new CouponError('Este cupom não é válido para os itens selecionados.')
  }

  // Restrição por plano do Manual Clínico. Só se aplica quando o item elegível
  // é o Manual Clínico e o cupom define planos permitidos.
  if (coupon.allowedManualPlans?.length && eligibleItems.some((item) => item.itemType === 'manual_clinico')) {
    const allowedPlans = coupon.allowedManualPlans
    const planKey = input.manualPlanKey as ManualClinicoPlanKey | undefined
    if (!planKey || !allowedPlans.includes(planKey)) {
      const labels = allowedPlans.map((plan) => MANUAL_PLAN_LABELS[plan] || plan).join(', ')
      throw new CouponError(`Este cupom é válido apenas para o plano: ${labels}.`)
    }
  }

  // Empilhamento (cupom sobre lote): quando o cupom é stackWithTier e há lote
  // ativo, o cupom incide sobre o preço JÁ com o desconto do lote.
  const stack = coupon.stackWithTier === true
  const tierDiscount = stack ? Math.max(0, roundMoney(input.tierDiscountAmount || 0)) : 0
  const couponBaseAmount = roundMoney(Math.max(0, eligibleAmount - Math.min(eligibleAmount, tierDiscount)))
  if (couponBaseAmount <= 0) {
    throw new CouponError('Este cupom não gera desconto nesta compra.')
  }

  const discountAmount = computeCouponDiscount(coupon.discountType, coupon.discountValue, couponBaseAmount)
  if (discountAmount <= 0) throw new CouponError('Este cupom não gera desconto nesta compra.')

  const discountedItems = buildItemDiscounts(items, discountAmount, coupon)
  return {
    coupon,
    couponId: String(coupon._id),
    code: coupon.codeNormalized,
    label: getCouponLabel(coupon),
    amountBeforeCoupon,
    eligibleAmount,
    discountAmount,
    // Quando empilha, o valor final desconta lote + cupom.
    amountAfterCoupon: roundMoney(Math.max(0, amountBeforeCoupon - tierDiscount - discountAmount)),
    items: discountedItems,
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildUserIdentityOr(userId?: string, userEmail?: string) {
  const filters: any[] = []
  if (userId) filters.push({ userId })
  if (userEmail) {
    filters.push({
      userEmail: {
        $regex: new RegExp(`^${escapeRegex(userEmail)}$`, 'i'),
      },
    })
  }
  return filters
}

function isCouponPerUserLimitEnabled(coupon: Coupon) {
  return typeof coupon.perUserLimit === 'number' && coupon.perUserLimit > 0
}

async function getCouponUser(db: Db, userId?: string) {
  if (!userId || !ObjectId.isValid(userId)) return null
  return db.collection<User>('users').findOne(
    { _id: new ObjectId(userId) as any },
    { projection: { isAfyaMedicineStudent: 1, afyaUnit: 1, email: 1 } }
  )
}

async function getUserCouponUseCount(
  db: Db,
  couponId: string,
  userId?: string,
  userEmail?: string
) {
  const identityOr = buildUserIdentityOr(userId, userEmail)
  if (identityOr.length === 0) return 0
  return db.collection<CouponRedemption>('coupon_redemptions').countDocuments({
    couponId,
    status: { $in: ['reserved', 'approved'] },
    $or: identityOr,
  } as any)
}

async function validateUserCouponRules(
  db: Db,
  coupon: Coupon,
  identity: {
    userId?: string
    userEmail?: string
  }
) {
  const couponId = String(coupon._id)
  const user = await getCouponUser(db, identity.userId)
  const userEmail = identity.userEmail || user?.email

  if (coupon.allowedAfyaUnits?.length) {
    const allowedUnits = new Set(coupon.allowedAfyaUnits)
    if (!user?.isAfyaMedicineStudent || !user.afyaUnit || !allowedUnits.has(user.afyaUnit)) {
      throw new CouponError('Este cupom é exclusivo para unidades selecionadas.')
    }
  }

  if (coupon.firstPurchaseOnly) {
    const identityOr = buildUserIdentityOr(identity.userId, userEmail)
    if (identityOr.length === 0) throw new CouponError('Não foi possível validar a primeira compra deste usuário.')
    const [existingMaterialPurchase, existingManualPurchase] = await Promise.all([
      db.collection<MaterialPurchase>('material_purchases').findOne({
        status: 'completed',
        itemType: { $in: ['material', 'package'] },
        $or: identityOr,
      } as any),
      db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).findOne({
        status: 'completed',
        $or: identityOr,
      } as any),
    ])
    if (existingMaterialPurchase || existingManualPurchase) throw new CouponError('Este cupom é válido apenas para a primeira compra.')
  }

  if (isCouponPerUserLimitEnabled(coupon)) {
    const useCount = await getUserCouponUseCount(db, couponId, identity.userId, userEmail)
    if (useCount >= Number(coupon.perUserLimit)) {
      throw new CouponError('Você já atingiu o limite de uso deste cupom.')
    }
  }
}

function couponAvailabilityFilter(now: Date) {
  return {
    isActive: true,
    $and: [
      {
        $or: [
          { usageLimit: { $exists: false } },
          { usageLimit: null },
          { usageLimit: { $lte: 0 } },
          { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
        ],
      },
      {
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      },
    ],
  }
}

export async function reserveCouponRedemption(
  db: Db,
  input: {
    validation: CouponValidationResult
    userId: string
    userName?: string
    userEmail?: string
    orderId?: string
    status?: CouponRedemptionStatus
  }
) {
  const now = new Date()
  const couponObjectId = new ObjectId(input.validation.couponId)
  if (isCouponPerUserLimitEnabled(input.validation.coupon)) {
    const useCount = await getUserCouponUseCount(
      db,
      input.validation.couponId,
      input.userId,
      input.userEmail
    )
    if (useCount >= Number(input.validation.coupon.perUserLimit)) {
      throw new CouponError('Você já atingiu o limite de uso deste cupom.', 409)
    }
  }

  const updatedCoupon = await db.collection<Coupon>('coupons').findOneAndUpdate(
    {
      _id: couponObjectId as any,
      ...couponAvailabilityFilter(now),
    },
    {
      $inc: { usageCount: 1 },
      $set: { updatedAt: now },
    },
    { returnDocument: 'after' }
  )

  if (!updatedCoupon) {
    throw new CouponError('Este cupom acabou de atingir o limite de uso.', 409)
  }

  const status = input.status || 'reserved'
  const redemption: CouponRedemption = {
    couponId: input.validation.couponId,
    code: input.validation.code,
    userId: input.userId,
    userName: input.userName || '',
    userEmail: input.userEmail || '',
    orderId: input.orderId,
    amountBeforeCoupon: input.validation.amountBeforeCoupon,
    eligibleAmount: input.validation.eligibleAmount,
    discountAmount: input.validation.discountAmount,
    amountAfterCoupon: input.validation.amountAfterCoupon,
    status,
    items: input.validation.items,
    createdAt: now,
    ...(status === 'approved' ? { approvedAt: now } : {}),
  }

  if (input.orderId) {
    await db.collection<CouponRedemption>('coupon_redemptions').updateOne(
      { orderId: input.orderId },
      { $setOnInsert: redemption as any },
      { upsert: true }
    )
    return
  }

  await db.collection<CouponRedemption>('coupon_redemptions').insertOne(redemption as any)
}

export async function approveCouponRedemption(db: Db, orderId?: string) {
  if (!orderId) return
  await db.collection<CouponRedemption>('coupon_redemptions').updateOne(
    { orderId, status: 'reserved' },
    {
      $set: {
        status: 'approved',
        approvedAt: new Date(),
      },
    }
  )
}

export async function releaseCouponRedemption(db: Db, orderId?: string, reason = 'payment_failed') {
  if (!orderId) return
  const now = new Date()
  const redemption = await db.collection<CouponRedemption>('coupon_redemptions').findOneAndUpdate(
    { orderId, status: { $in: ['reserved', 'approved'] } },
    {
      $set: {
        status: 'released',
        releasedAt: now,
        releaseReason: reason,
      },
    },
    { returnDocument: 'before' }
  )

  if (!redemption?.couponId || !ObjectId.isValid(redemption.couponId)) return
  await db.collection<Coupon>('coupons').updateOne(
    { _id: new ObjectId(redemption.couponId) as any },
    {
      $inc: { usageCount: -1 },
      $set: { updatedAt: now },
    }
  )
}

export function couponAnalyticsMetadata(validation?: CouponValidationResult | null) {
  if (!validation) return {}
  return {
    couponId: validation.couponId,
    couponCode: validation.code,
    couponLabel: validation.label,
    couponDiscountAmount: validation.discountAmount,
    couponAmountBefore: validation.amountBeforeCoupon,
    couponEligibleAmount: validation.eligibleAmount,
  }
}
