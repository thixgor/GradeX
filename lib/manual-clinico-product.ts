import { Db, ObjectId } from 'mongodb'
import type { TokenPayload } from './auth'
import type {
  ManualClinicoProductConfig,
  ManualClinicoPurchase,
  PaymentOrder,
} from './types'
import type { CouponValidationResult } from './coupons'

export const MANUAL_CLINICO_PRODUCT_ID = 'manual-clinico-premium' as const
export const MANUAL_CLINICO_PRODUCT_TYPE = 'manual_clinico' as const

export const MANUAL_CLINICO_CONFIG_COLLECTION = 'manual_clinico_product_settings'
export const MANUAL_CLINICO_PURCHASES_COLLECTION = 'manual_clinico_purchases'

export const DEFAULT_MANUAL_CLINICO_CONFIG: Omit<ManualClinicoProductConfig, '_id' | 'createdAt' | 'updatedAt' | 'updatedBy'> = {
  productId: MANUAL_CLINICO_PRODUCT_ID,
  label: 'Manual Clinico Premium',
  benefitText: 'Desbloqueie 220+ patologias aprofundadas',
  shortDescription: 'Diagnostico, tratamento, diferenciais, farmacologia e fluxogramas em um so lugar.',
  ctaText: 'Desbloquear Manual Clinico Premium',
  coverImageUrl: 'https://i.imgur.com/0JXm4Au.png',
  isActive: true,
  price: 49.9,
  promotionalPrice: 29.9,
  promotionEndsAt: null,
  allowCoupons: true,
  lifetimeAccess: true,
  freeAccessMode: 'quantity',
  freeQuantity: 5,
  freePathologySlugs: [],
}

export interface ManualClinicoPublicProduct {
  productId: typeof MANUAL_CLINICO_PRODUCT_ID
  label: string
  benefitText: string
  shortDescription: string
  ctaText: string
  coverImageUrl?: string
  isActive: boolean
  price: number
  currentPrice: number
  promotionalPrice: number | null
  promotionEndsAt: string | null
  hasActivePromotion: boolean
  allowCoupons: boolean
  lifetimeAccess: boolean
}

export interface ManualClinicoAccessState {
  hasFullAccess: boolean
  reason: 'admin' | 'purchased' | 'free_pathology' | 'locked' | 'guest'
  purchase?: ManualClinicoPurchase | null
}

function roundMoney(value: number) {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100)
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isPromotionActive(config: ManualClinicoProductConfig, now = new Date()) {
  const promotionalPrice = Number(config.promotionalPrice || 0)
  if (!Number.isFinite(promotionalPrice) || promotionalPrice < 0) return false
  if (promotionalPrice >= Number(config.price || 0)) return false
  if (!config.promotionEndsAt) return promotionalPrice > 0 || promotionalPrice === 0
  const endsAt = config.promotionEndsAt instanceof Date
    ? config.promotionEndsAt
    : new Date(config.promotionEndsAt)
  return Number.isNaN(endsAt.getTime()) ? false : endsAt > now
}

export function getManualClinicoCurrentPrice(config: ManualClinicoProductConfig, now = new Date()) {
  if (isPromotionActive(config, now)) return roundMoney(Number(config.promotionalPrice || 0))
  return roundMoney(Number(config.price || 0))
}

export function serializeManualClinicoProduct(config: ManualClinicoProductConfig): ManualClinicoPublicProduct {
  const hasActivePromotion = isPromotionActive(config)
  const currentPrice = getManualClinicoCurrentPrice(config)
  const promotionEndsAt = config.promotionEndsAt
    ? new Date(config.promotionEndsAt).toISOString()
    : null

  return {
    productId: MANUAL_CLINICO_PRODUCT_ID,
    label: config.label,
    benefitText: config.benefitText,
    shortDescription: config.shortDescription,
    ctaText: config.ctaText,
    coverImageUrl: config.coverImageUrl,
    isActive: config.isActive !== false,
    price: roundMoney(config.price),
    currentPrice,
    promotionalPrice: hasActivePromotion ? roundMoney(Number(config.promotionalPrice || 0)) : null,
    promotionEndsAt,
    hasActivePromotion,
    allowCoupons: config.allowCoupons !== false,
    lifetimeAccess: config.lifetimeAccess !== false,
  }
}

export async function getManualClinicoConfig(db: Db): Promise<ManualClinicoProductConfig> {
  const existing = await db
    .collection<ManualClinicoProductConfig>(MANUAL_CLINICO_CONFIG_COLLECTION)
    .findOne({ productId: MANUAL_CLINICO_PRODUCT_ID })

  const now = new Date()
  return {
    ...DEFAULT_MANUAL_CLINICO_CONFIG,
    createdAt: existing?.createdAt || now,
    updatedAt: existing?.updatedAt || now,
    ...(existing || {}),
    productId: MANUAL_CLINICO_PRODUCT_ID,
    price: roundMoney(Number(existing?.price ?? DEFAULT_MANUAL_CLINICO_CONFIG.price)),
    promotionalPrice: existing?.promotionalPrice == null
      ? DEFAULT_MANUAL_CLINICO_CONFIG.promotionalPrice
      : roundMoney(Number(existing.promotionalPrice)),
    freeQuantity: Math.max(0, Math.floor(Number(existing?.freeQuantity ?? DEFAULT_MANUAL_CLINICO_CONFIG.freeQuantity))),
    freePathologySlugs: Array.isArray(existing?.freePathologySlugs)
      ? existing!.freePathologySlugs.map(String)
      : [],
  }
}

export async function upsertManualClinicoConfig(
  db: Db,
  input: Partial<ManualClinicoProductConfig>,
  actor?: Pick<TokenPayload, 'userId'>
) {
  const now = new Date()
  const patch: Partial<ManualClinicoProductConfig> = {
    label: String(input.label || DEFAULT_MANUAL_CLINICO_CONFIG.label).trim(),
    benefitText: String(input.benefitText || DEFAULT_MANUAL_CLINICO_CONFIG.benefitText).trim(),
    shortDescription: String(input.shortDescription || DEFAULT_MANUAL_CLINICO_CONFIG.shortDescription).trim(),
    ctaText: String(input.ctaText || DEFAULT_MANUAL_CLINICO_CONFIG.ctaText).trim(),
    coverImageUrl: String(input.coverImageUrl || '').trim(),
    isActive: input.isActive !== false,
    price: roundMoney(Number(input.price ?? DEFAULT_MANUAL_CLINICO_CONFIG.price)),
    promotionalPrice: input.promotionalPrice == null || input.promotionalPrice === ('' as any)
      ? null
      : roundMoney(Number(input.promotionalPrice)),
    promotionEndsAt: input.promotionEndsAt ? new Date(input.promotionEndsAt) : null,
    allowCoupons: input.allowCoupons !== false,
    lifetimeAccess: input.lifetimeAccess !== false,
    freeAccessMode: input.freeAccessMode === 'list' ? 'list' : 'quantity',
    freeQuantity: Math.max(0, Math.floor(Number(input.freeQuantity || 0))),
    freePathologySlugs: Array.from(new Set((input.freePathologySlugs || []).map(String).filter(Boolean))),
    updatedAt: now,
    updatedBy: actor?.userId,
  }

  await db.collection<ManualClinicoProductConfig>(MANUAL_CLINICO_CONFIG_COLLECTION).updateOne(
    { productId: MANUAL_CLINICO_PRODUCT_ID },
    {
      $set: patch,
      $setOnInsert: {
        productId: MANUAL_CLINICO_PRODUCT_ID,
        createdAt: now,
      },
    },
    { upsert: true }
  )

  return getManualClinicoConfig(db)
}

export async function getManualClinicoFreeSlugSet(
  db: Db,
  config?: ManualClinicoProductConfig
): Promise<Set<string>> {
  const resolved = config || await getManualClinicoConfig(db)
  if (resolved.freeAccessMode === 'list') {
    return new Set((resolved.freePathologySlugs || []).map(String))
  }

  const freeQuantity = Math.max(0, Math.floor(Number(resolved.freeQuantity || 0)))
  if (freeQuantity <= 0) return new Set()

  const rows = await db.collection('patologias')
    .find({})
    .project({ slug: 1 })
    .sort({ nome: 1 })
    .limit(freeQuantity)
    .toArray()

  return new Set(rows.map((row: any) => String(row.slug)).filter(Boolean))
}

export function isManualClinicoPathologyFree(
  patologia: { slug?: string },
  freeSlugs: Set<string>
) {
  return !!patologia.slug && freeSlugs.has(String(patologia.slug))
}

export async function getManualClinicoAccess(
  db: Db,
  session: TokenPayload | null | undefined
): Promise<ManualClinicoAccessState> {
  if (session?.role === 'admin') return { hasFullAccess: true, reason: 'admin' }
  if (!session?.userId) return { hasFullAccess: false, reason: 'guest' }

  const now = new Date()
  const identityOr: any[] = [{ userId: session.userId }]
  if (session.email) {
    identityOr.push({
      userEmail: { $regex: new RegExp(`^${escapeRegex(session.email)}$`, 'i') },
    })
  }

  const purchase = await db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).findOne({
    productId: MANUAL_CLINICO_PRODUCT_ID,
    status: 'completed',
    $or: identityOr,
    $and: [
      {
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      },
    ],
  } as any)

  return purchase
    ? { hasFullAccess: true, reason: 'purchased', purchase }
    : { hasFullAccess: false, reason: 'locked' }
}

export async function hasManualClinicoFullAccess(
  db: Db,
  session: TokenPayload | null | undefined
) {
  return (await getManualClinicoAccess(db, session)).hasFullAccess
}

export function buildManualClinicoCouponItem(
  config: ManualClinicoProductConfig,
  price = getManualClinicoCurrentPrice(config)
) {
  return {
    itemType: MANUAL_CLINICO_PRODUCT_TYPE,
    itemId: MANUAL_CLINICO_PRODUCT_ID,
    itemTitle: config.label,
    price,
  }
}

export async function grantManualClinicoAccess(
  db: Db,
  input: {
    userId: string
    userName?: string
    userEmail?: string
    config: ManualClinicoProductConfig
    price: number
    provider: ManualClinicoPurchase['provider']
    providerOrderId?: string
    providerPaymentId?: string
    paymentMethod?: string
    couponValidation?: CouponValidationResult | null
    order?: PaymentOrder
    grantedBy?: string
    grantedByName?: string
  }
) {
  const now = new Date()
  const accessType = input.config.lifetimeAccess === false ? 'temporary' : 'lifetime'
  const expiresAt = accessType === 'temporary'
    ? input.order?.expiresAt || null
    : null

  const purchase: ManualClinicoPurchase = {
    userId: input.userId,
    userName: input.userName || '',
    userEmail: input.userEmail || '',
    productId: MANUAL_CLINICO_PRODUCT_ID,
    productTitle: input.config.label,
    productType: MANUAL_CLINICO_PRODUCT_TYPE,
    price: roundMoney(input.price),
    originalPrice: roundMoney(Number(input.config.price || 0)),
    couponId: input.couponValidation?.couponId,
    couponCode: input.couponValidation?.code,
    couponDiscountAmount: input.couponValidation?.discountAmount,
    provider: input.provider,
    providerOrderId: input.providerOrderId,
    providerPaymentId: input.providerPaymentId,
    paymentMethod: input.paymentMethod,
    status: 'completed',
    accessType,
    purchasedAt: now,
    expiresAt,
    grantedBy: input.grantedBy,
    grantedByName: input.grantedByName,
  }

  const identityOr: any[] = [{ userId: input.userId }]
  if (input.userEmail) {
    identityOr.push({
      userEmail: { $regex: new RegExp(`^${escapeRegex(input.userEmail)}$`, 'i') },
    })
  }

  await db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).updateOne(
    {
      productId: MANUAL_CLINICO_PRODUCT_ID,
      status: 'completed',
      $or: identityOr,
    } as any,
    {
      $setOnInsert: purchase as any,
      $set: {
        productTitle: purchase.productTitle,
        expiresAt: purchase.expiresAt,
      },
    },
    { upsert: true }
  )

  return purchase
}

export async function revokeManualClinicoAccessForOrder(
  db: Db,
  order: PaymentOrder
) {
  await db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).updateMany(
    {
      providerOrderId: String(order._id),
      productId: MANUAL_CLINICO_PRODUCT_ID,
      status: 'completed',
    },
    {
      $set: {
        status: 'refunded',
        refundedAt: new Date(),
      },
    }
  )
}

const FULL_FIELDS = [
  'classificacao',
  'fisiopatologia',
  'diagnostico_semiologico',
  'diagnosticos_diferenciais',
  'tratamento',
  'farmacologia',
  'fluxograma_tratamento',
  'observacoes_clinicas',
  'referencias',
  'imagens_mecanismo',
  'legenda_imagens',
]

function excerpt(value: unknown, max = 420) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length <= max ? text : `${text.slice(0, max).trim()}...`
}

export function buildManualClinicoPreview(patologia: any) {
  const preview = excerpt(
    patologia.classificacao ||
    patologia.gravidade ||
    patologia.diagnostico_semiologico ||
    patologia.fisiopatologia,
    520
  )

  const sanitized: any = {
    _id: patologia._id,
    nome: patologia.nome,
    sinonimos: patologia.sinonimos || [],
    areas: patologia.areas || [],
    sistema: patologia.sistema,
    cid10: patologia.cid10,
    slug: patologia.slug,
    gravidade: excerpt(patologia.gravidade, 180),
    preview,
  }

  for (const field of FULL_FIELDS) {
    if (field in sanitized) continue
    sanitized[field] = undefined
  }

  return sanitized
}
