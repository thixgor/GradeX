import { Db, ObjectId } from 'mongodb'
import type { TokenPayload } from './auth'
import type {
  ManualClinicoFreeQuota,
  ManualClinicoProductConfig,
  ManualClinicoPurchase,
  PaymentOrder,
} from './types'
import type { CouponValidationResult } from './coupons'

export const MANUAL_CLINICO_PRODUCT_ID = 'manual-clinico-premium' as const
export const MANUAL_CLINICO_PRODUCT_TYPE = 'manual_clinico' as const

export const MANUAL_CLINICO_CONFIG_COLLECTION = 'manual_clinico_product_settings'
export const MANUAL_CLINICO_PURCHASES_COLLECTION = 'manual_clinico_purchases'
export const MANUAL_CLINICO_FREE_QUOTA_COLLECTION = 'manual_clinico_free_quotas'

export const DEFAULT_MANUAL_CLINICO_CONFIG: Omit<ManualClinicoProductConfig, '_id' | 'createdAt' | 'updatedAt' | 'updatedBy'> = {
  productId: MANUAL_CLINICO_PRODUCT_ID,
  label: 'Manual Clinico Premium',
  benefitText: 'Desbloqueie 220+ patologias aprofundadas',
  shortDescription: 'Diagnostico, tratamento, diferenciais, farmacologia e fluxogramas em um so lugar.',
  ctaText: 'Desbloquear Manual Clinico Premium',
  coverImageUrl: 'https://i.imgur.com/0JXm4Au.png',
  fullPdfButtonEnabled: true,
  fullPdfExternalUrl: '',
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
  fullPdfButtonEnabled: boolean
  fullPdfExternalUrl?: string
  isActive: boolean
  price: number
  currentPrice: number
  promotionalPrice: number | null
  promotionEndsAt: string | null
  hasActivePromotion: boolean
  allowCoupons: boolean
  lifetimeAccess: boolean
  freeAccessMode: ManualClinicoProductConfig['freeAccessMode']
  freeQuantity: number
}

export interface ManualClinicoAccessState {
  hasFullAccess: boolean
  reason: 'admin' | 'purchased' | 'free_pathology' | 'locked' | 'guest'
  purchase?: ManualClinicoPurchase | null
}

export interface ManualClinicoFreeQuotaState {
  mode: ManualClinicoProductConfig['freeAccessMode']
  limit: number
  used: number
  remaining: number
  claimedSlugs: string[]
  isAuthenticated: boolean
}

export interface ManualClinicoFreeClaimResult {
  allowed: boolean
  reason: 'claimed' | 'already_claimed' | 'quota_exhausted' | 'guest' | 'not_quantity_mode' | 'invalid_pathology'
  quota: ManualClinicoFreeQuotaState
}

function roundMoney(value: number) {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100)
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function uniqueSlugs(slugs: unknown[]) {
  return Array.from(new Set((slugs || []).map(String).filter(Boolean)))
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
    fullPdfButtonEnabled: config.fullPdfButtonEnabled !== false,
    fullPdfExternalUrl: config.fullPdfExternalUrl,
    isActive: config.isActive !== false,
    price: roundMoney(config.price),
    currentPrice,
    promotionalPrice: hasActivePromotion ? roundMoney(Number(config.promotionalPrice || 0)) : null,
    promotionEndsAt,
    hasActivePromotion,
    allowCoupons: config.allowCoupons !== false,
    lifetimeAccess: config.lifetimeAccess !== false,
    freeAccessMode: config.freeAccessMode === 'list' ? 'list' : 'quantity',
    freeQuantity: Math.max(0, Math.floor(Number(config.freeQuantity || 0))),
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
    freeAccessMode: existing?.freeAccessMode === 'list' ? 'list' : 'quantity',
    freeQuantity: Math.max(0, Math.floor(Number(existing?.freeQuantity ?? DEFAULT_MANUAL_CLINICO_CONFIG.freeQuantity))),
    freePathologySlugs: Array.isArray(existing?.freePathologySlugs)
      ? uniqueSlugs(existing!.freePathologySlugs)
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
    fullPdfButtonEnabled: input.fullPdfButtonEnabled !== false,
    fullPdfExternalUrl: String(input.fullPdfExternalUrl || '').trim(),
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
    freePathologySlugs: uniqueSlugs(input.freePathologySlugs || []),
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
  if (resolved.freeAccessMode !== 'list') return new Set()
  return new Set((resolved.freePathologySlugs || []).map(String))
}

export function isManualClinicoPathologyFree(
  patologia: { slug?: string },
  freeSlugs: Set<string>
) {
  return !!patologia.slug && freeSlugs.has(String(patologia.slug))
}

export function getManualClinicoFreeViewLimit(config: ManualClinicoProductConfig) {
  return config.freeAccessMode === 'quantity'
    ? Math.max(0, Math.floor(Number(config.freeQuantity || 0)))
    : 0
}

export async function getManualClinicoFreeQuotaState(
  db: Db,
  session: TokenPayload | null | undefined,
  config?: ManualClinicoProductConfig
): Promise<ManualClinicoFreeQuotaState> {
  const resolved = config || await getManualClinicoConfig(db)
  const limit = getManualClinicoFreeViewLimit(resolved)
  const base = {
    mode: resolved.freeAccessMode === 'list' ? 'list' as const : 'quantity' as const,
    limit,
    used: 0,
    remaining: limit,
    claimedSlugs: [] as string[],
    isAuthenticated: !!session?.userId,
  }

  if (resolved.freeAccessMode !== 'quantity' || !session?.userId || limit <= 0) {
    return {
      ...base,
      remaining: resolved.freeAccessMode === 'quantity' && session?.userId ? limit : 0,
    }
  }

  const quota = await db.collection<ManualClinicoFreeQuota>(MANUAL_CLINICO_FREE_QUOTA_COLLECTION).findOne({
    productId: MANUAL_CLINICO_PRODUCT_ID,
    userId: session.userId,
  })
  const claimedSlugs = uniqueSlugs(quota?.claimedSlugs || [])
  const used = claimedSlugs.length

  return {
    ...base,
    used,
    remaining: Math.max(0, limit - used),
    claimedSlugs,
  }
}

export async function claimManualClinicoFreePathology(
  db: Db,
  input: {
    session: TokenPayload | null | undefined
    config: ManualClinicoProductConfig
    patologia: { slug?: string; nome?: string }
  }
): Promise<ManualClinicoFreeClaimResult> {
  const slug = String(input.patologia.slug || '')
  const currentQuota = await getManualClinicoFreeQuotaState(db, input.session, input.config)

  if (!slug) return { allowed: false, reason: 'invalid_pathology', quota: currentQuota }
  if (input.config.freeAccessMode !== 'quantity') return { allowed: false, reason: 'not_quantity_mode', quota: currentQuota }
  if (!input.session?.userId) return { allowed: false, reason: 'guest', quota: currentQuota }
  if (currentQuota.claimedSlugs.includes(slug)) {
    return { allowed: true, reason: 'already_claimed', quota: currentQuota }
  }
  if (currentQuota.remaining <= 0) {
    return { allowed: false, reason: 'quota_exhausted', quota: currentQuota }
  }

  const now = new Date()
  const collection = db.collection<ManualClinicoFreeQuota>(MANUAL_CLINICO_FREE_QUOTA_COLLECTION)
  try {
    await collection.updateOne(
      {
        productId: MANUAL_CLINICO_PRODUCT_ID,
        userId: input.session.userId,
      },
      {
        $setOnInsert: {
          productId: MANUAL_CLINICO_PRODUCT_ID,
          userId: input.session.userId,
          claimedSlugs: [],
          createdAt: now,
        },
        $set: {
          userName: input.session.name || '',
          userEmail: input.session.email || '',
          updatedAt: now,
        },
      },
      { upsert: true }
    )
  } catch (error: any) {
    if (error?.code !== 11000) throw error
  }

  await collection.updateOne(
    {
      productId: MANUAL_CLINICO_PRODUCT_ID,
      userId: input.session.userId,
      claimedSlugs: { $ne: slug },
    },
    {
      $addToSet: { claimedSlugs: slug },
      $set: {
        userName: input.session.name || '',
        userEmail: input.session.email || '',
        updatedAt: now,
        lastClaimedAt: now,
      },
    }
  )

  const refreshed = await getManualClinicoFreeQuotaState(db, input.session, input.config)

  if (refreshed.claimedSlugs.includes(slug)) {
    return { allowed: true, reason: 'claimed', quota: refreshed }
  }

  return { allowed: false, reason: 'quota_exhausted', quota: refreshed }
}

export function serializeManualClinicoFreeQuota(quota: ManualClinicoFreeQuotaState) {
  return {
    mode: quota.mode,
    limit: quota.limit,
    used: quota.used,
    remaining: quota.remaining,
    isAuthenticated: quota.isAuthenticated,
  }
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
