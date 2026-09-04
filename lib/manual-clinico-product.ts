import { Db, ObjectId } from 'mongodb'
import type { TokenPayload } from './auth'
import type {
  ManualClinicoFreeQuota,
  ManualClinicoPlan,
  ManualClinicoPlanKey,
  ManualClinicoProductConfig,
  ManualClinicoPurchase,
  PaymentOrder,
} from './types'
import type { CouponValidationResult } from './coupons'
import { PLUS_TIER, isPlusAccount } from './account-tier'
import {
  areaLiberada,
  moduloDoManualLiberadoNoContexto,
  resolverPermissoes,
} from './plan-entitlements-server'
import type { ManualClinicoModuleKey } from './plan-entitlements'

// A identidade do produto mora num módulo puro para que as telas de compra
// (componentes de cliente) possam importá-la sem trazer o driver do Mongo
// junto. Ver lib/manual-clinico/identidade.ts.
export {
  MANUAL_CLINICO_PRODUCT_ID,
  MANUAL_CLINICO_PRODUCT_TYPE,
} from './manual-clinico/identidade'
import {
  MANUAL_CLINICO_PRODUCT_ID,
  MANUAL_CLINICO_PRODUCT_TYPE,
} from './manual-clinico/identidade'

export const MANUAL_CLINICO_CONFIG_COLLECTION = 'manual_clinico_product_settings'
export const MANUAL_CLINICO_PURCHASES_COLLECTION = 'manual_clinico_purchases'
export const MANUAL_CLINICO_FREE_QUOTA_COLLECTION = 'manual_clinico_free_quotas'

export const MANUAL_CLINICO_PLAN_KEYS: ManualClinicoPlanKey[] = ['semestral', 'anual', 'vitalicio']

export const DEFAULT_MANUAL_CLINICO_PLANS: ManualClinicoPlan[] = [
  { key: 'semestral', label: 'Semestral', durationMonths: 6, price: 29.9, enabled: true, pricingEventId: null, defaultCouponCode: null },
  { key: 'anual', label: 'Anual', durationMonths: 12, price: 49.9, enabled: true, pricingEventId: null, defaultCouponCode: null },
  { key: 'vitalicio', label: 'Vitalício', durationMonths: null, price: 97.0, enabled: true, pricingEventId: null, defaultCouponCode: null },
]

export const DEFAULT_MANUAL_CLINICO_CONFIG: Omit<ManualClinicoProductConfig, '_id' | 'createdAt' | 'updatedAt' | 'updatedBy'> = {
  productId: MANUAL_CLINICO_PRODUCT_ID,
  label: 'Manual Clinico Completo',
  benefitText: 'Desbloqueie 220+ patologias aprofundadas',
  shortDescription: 'Diagnostico, tratamento, diferenciais, farmacologia e fluxogramas em um so lugar.',
  ctaText: 'Desbloquear Manual Clinico Completo',
  coverImageUrl: 'https://i.imgur.com/0JXm4Au.png',
  fullPdfButtonEnabled: true,
  fullPdfExternalUrl: '',
  isActive: true,
  price: 49.9,
  promotionalPrice: 29.9,
  promotionEndsAt: null,
  allowCoupons: true,
  lifetimeAccess: true,
  plans: DEFAULT_MANUAL_CLINICO_PLANS,
  freeAccessMode: 'quantity',
  freeQuantity: 5,
  freePathologySlugs: [],
  // O Plus+ é cargo único e libera a plataforma inteira — o Manual Clínico
  // entra junto por padrão. O produto avulso segue existindo para quem não
  // assina.
  includedInPlus: true,
}

function planFromInput(input: any, fallback: ManualClinicoPlan): ManualClinicoPlan {
  return {
    key: fallback.key,
    label: String(input?.label ?? fallback.label).trim() || fallback.label,
    durationMonths: fallback.key === 'vitalicio'
      ? null
      : (typeof input?.durationMonths === 'number' && input.durationMonths > 0
          ? Math.floor(input.durationMonths)
          : fallback.durationMonths),
    price: roundMoney(Number(input?.price ?? fallback.price)),
    enabled: input?.enabled !== false,
    pricingEventId: input?.pricingEventId ? String(input.pricingEventId) : null,
    defaultCouponCode: input?.defaultCouponCode
      ? String(input.defaultCouponCode).trim().toUpperCase().slice(0, 80) || null
      : null,
  }
}

export function normalizeManualClinicoPlans(plans: any): ManualClinicoPlan[] {
  const byKey = new Map<ManualClinicoPlanKey, ManualClinicoPlan>()
  for (const def of DEFAULT_MANUAL_CLINICO_PLANS) byKey.set(def.key, { ...def })
  if (Array.isArray(plans)) {
    for (const incoming of plans) {
      const k = incoming?.key as ManualClinicoPlanKey
      if (!k || !MANUAL_CLINICO_PLAN_KEYS.includes(k)) continue
      byKey.set(k, planFromInput(incoming, byKey.get(k)!))
    }
  }
  return MANUAL_CLINICO_PLAN_KEYS.map((k) => byKey.get(k)!)
}

export function getManualClinicoPlan(
  config: ManualClinicoProductConfig,
  planKey: ManualClinicoPlanKey
): ManualClinicoPlan {
  const plans = normalizeManualClinicoPlans(config.plans)
  return plans.find((p) => p.key === planKey) || plans[plans.length - 1]
}

export function computePlanExpiresAt(plan: ManualClinicoPlan, from: Date = new Date()): Date | null {
  if (!plan.durationMonths || plan.durationMonths <= 0) return null
  const out = new Date(from)
  out.setMonth(out.getMonth() + plan.durationMonths)
  return out
}

export interface ManualClinicoPublicPlan {
  key: ManualClinicoPlanKey
  label: string
  durationMonths: number | null
  price: number
  enabled: boolean
  pricingEventId: string | null
  defaultCouponCode: string | null
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
  plans: ManualClinicoPublicPlan[]
  freeAccessMode: ManualClinicoProductConfig['freeAccessMode']
  freeQuantity: number
  pricingEventId?: string | null
}

export interface ManualClinicoAccessState {
  hasFullAccess: boolean
  reason: 'admin' | 'purchased' | 'included_plan' | 'free_pathology' | 'locked' | 'guest'
  purchase?: ManualClinicoPurchase | null
  /** Quando o acesso vem incluso na assinatura, indica o cargo ('plus'). */
  includedPlan?: string | null
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

  const plans = normalizeManualClinicoPlans(config.plans).map((plan): ManualClinicoPublicPlan => ({
    key: plan.key,
    label: plan.label,
    durationMonths: plan.durationMonths,
    price: roundMoney(plan.price),
    enabled: plan.enabled,
    pricingEventId: plan.pricingEventId ? String(plan.pricingEventId) : null,
    defaultCouponCode: plan.defaultCouponCode || null,
  }))

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
    plans,
    freeAccessMode: config.freeAccessMode === 'list' ? 'list' : 'quantity',
    freeQuantity: Math.max(0, Math.floor(Number(config.freeQuantity || 0))),
    pricingEventId: config.pricingEventId ? String(config.pricingEventId) : null,
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
    // Registros antigos usavam duas flags separadas; qualquer uma delas
    // ligada significa "incluso na assinatura".
    includedInPlus:
      existing?.includedInPlus ??
      (existing?.includedInPremium === true || existing?.includedInEssential === true),
    plans: normalizeManualClinicoPlans(existing?.plans),
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
    includedInPlus: input.includedInPlus !== false,
    pricingEventId: input.pricingEventId ? String(input.pricingEventId) : null,
    plans: normalizeManualClinicoPlans((input as any).plans),
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

/**
 * @param modulo Função específica do Manual sendo aberta (Ferramentas,
 *   Farmacologia, Radiologia…). Só importa para quem recebeu o Manual **pela
 *   assinatura**: o plano pode incluir a área e ainda assim não incluir aquela
 *   função. Compra avulsa e admin ignoram o parâmetro — quem comprou o produto
 *   comprou inteiro, e fatiar depois seria mudar o que foi vendido.
 */
export async function getManualClinicoAccess(
  db: Db,
  session: TokenPayload | null | undefined,
  config?: ManualClinicoProductConfig,
  modulo?: ManualClinicoModuleKey
): Promise<ManualClinicoAccessState> {
  if (session?.role === 'admin') return { hasFullAccess: true, reason: 'admin' }
  if (!session?.userId) return { hasFullAccess: false, reason: 'guest' }

  // Acesso incluso na assinatura Plus+: dispensa compra avulsa.
  const resolvedConfig = config || await getManualClinicoConfig(db)
  if (resolvedConfig.includedInPlus) {
    const includedPlan = await getManualClinicoIncludedPlanFor(db, session, resolvedConfig, modulo)
    if (includedPlan) {
      return { hasFullAccess: true, reason: 'included_plan', includedPlan }
    }
  }

  const purchase = await getActiveManualClinicoPurchase(db, session)

  return purchase
    ? { hasFullAccess: true, reason: 'purchased', purchase }
    : { hasFullAccess: false, reason: 'locked' }
}

/**
 * Retorna o cargo ('plus') se a conta tem o Manual incluso na assinatura,
 * ou null caso contrário.
 */
async function getManualClinicoIncludedPlanFor(
  db: Db,
  session: Pick<TokenPayload, 'userId'>,
  config: ManualClinicoProductConfig,
  modulo?: ManualClinicoModuleKey
): Promise<string | null> {
  if (!config.includedInPlus) return null
  let user: any
  try {
    user = await db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { role: 1, accountType: 1, premiumPlanType: 1 } }
    )
  } catch {
    return null
  }
  const accountType = user?.accountType
  if (!isPlusAccount(accountType)) return null

  // O cargo pago inclui o Manual, mas o plano pode não incluir. Quando não
  // inclui, a conta cai no produto avulso — a compra separada continua
  // valendo, e é ela que decide logo adiante.
  const permissoes = await resolverPermissoes(db, {
    userId: session.userId,
    role: user?.role,
    accountType,
    premiumPlanType: user?.premiumPlanType,
  })
  if (!areaLiberada(permissoes, 'manualClinico')) return null
  if (modulo && !moduloDoManualLiberadoNoContexto(permissoes, modulo)) return null

  return PLUS_TIER
}

/**
 * O módulo pedido do Manual está incluído no plano desta conta?
 *
 * Só decide sobre o acesso concedido PELA ASSINATURA. Compra avulsa do Manual
 * e conta de admin passam por cima — quem comprou o produto comprou inteiro, e
 * fatiar depois seria mudar o que foi vendido.
 */
export async function temModuloDoManualClinico(
  db: Db,
  session: TokenPayload | null | undefined,
  modulo: ManualClinicoModuleKey,
  config?: ManualClinicoProductConfig
): Promise<boolean> {
  return (await getManualClinicoAccess(db, session, config, modulo)).hasFullAccess
}

export async function getActiveManualClinicoPurchase(
  db: Db,
  session: Pick<TokenPayload, 'userId' | 'email'> | null | undefined
): Promise<ManualClinicoPurchase | null> {
  if (!session?.userId) return null
  const now = new Date()
  const identityOr: any[] = [{ userId: session.userId }]
  if (session.email) {
    identityOr.push({
      userEmail: { $regex: new RegExp(`^${escapeRegex(session.email)}$`, 'i') },
    })
  }
  return db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).findOne({
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
  } as any, { sort: { purchasedAt: -1 } as any })
}

/**
 * Retorna a compra mais recente (mesmo expirada) — para mostrar "expirou em X" / lembrar renovação.
 */
export async function getLatestManualClinicoPurchase(
  db: Db,
  session: Pick<TokenPayload, 'userId' | 'email'> | null | undefined
): Promise<ManualClinicoPurchase | null> {
  if (!session?.userId) return null
  const identityOr: any[] = [{ userId: session.userId }]
  if (session.email) {
    identityOr.push({
      userEmail: { $regex: new RegExp(`^${escapeRegex(session.email)}$`, 'i') },
    })
  }
  return db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).findOne({
    productId: MANUAL_CLINICO_PRODUCT_ID,
    status: 'completed',
    $or: identityOr,
  } as any, { sort: { purchasedAt: -1 } as any })
}

export interface ManualClinicoSubscriptionInfo {
  planKey: ManualClinicoPlanKey | null
  planLabel: string | null
  isLifetime: boolean
  isActive: boolean
  isExpired: boolean
  renewalDeclined: boolean
  price: number
  purchasedAt: string | null
  expiresAt: string | null
  daysRemaining: number | null
  paymentMethod: string | null
  provider: string | null
}

export function buildManualClinicoSubscriptionInfo(
  purchase: ManualClinicoPurchase | null,
  now: Date = new Date()
): ManualClinicoSubscriptionInfo | null {
  if (!purchase) return null
  const expiresAt = purchase.expiresAt ? new Date(purchase.expiresAt) : null
  const isLifetime = purchase.accessType === 'lifetime' || !expiresAt
  const isExpired = !!expiresAt && expiresAt.getTime() <= now.getTime()
  const daysRemaining = isLifetime
    ? null
    : (expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000)) : 0)
  return {
    planKey: (purchase.planKey as ManualClinicoPlanKey) || (isLifetime ? 'vitalicio' : null),
    planLabel: purchase.planLabel || (isLifetime ? 'Vitalício' : null),
    isLifetime,
    isActive: isLifetime || !isExpired,
    isExpired,
    renewalDeclined: !!purchase.renewalDeclined,
    price: Number(purchase.price || 0),
    purchasedAt: purchase.purchasedAt ? new Date(purchase.purchasedAt).toISOString() : null,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    daysRemaining,
    paymentMethod: purchase.paymentMethod || null,
    provider: purchase.provider || null,
  }
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
    plan?: ManualClinicoPlan | null
    planKey?: ManualClinicoPlanKey
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

  const plan: ManualClinicoPlan = input.plan
    || (input.planKey ? getManualClinicoPlan(input.config, input.planKey) : getManualClinicoPlan(input.config, 'vitalicio'))

  const accessType: ManualClinicoPurchase['accessType'] = plan.durationMonths && plan.durationMonths > 0 ? 'temporary' : 'lifetime'
  const expiresAt = computePlanExpiresAt(plan, now)

  const purchase: ManualClinicoPurchase = {
    userId: input.userId,
    userName: input.userName || '',
    userEmail: input.userEmail || '',
    productId: MANUAL_CLINICO_PRODUCT_ID,
    productTitle: input.config.label,
    productType: MANUAL_CLINICO_PRODUCT_TYPE,
    price: roundMoney(input.price),
    originalPrice: roundMoney(Number(plan.price || input.config.price || 0)),
    couponId: input.couponValidation?.couponId,
    couponCode: input.couponValidation?.code,
    couponDiscountAmount: input.couponValidation?.discountAmount,
    provider: input.provider,
    providerOrderId: input.providerOrderId,
    providerPaymentId: input.providerPaymentId,
    paymentMethod: input.paymentMethod,
    status: 'completed',
    accessType,
    planKey: plan.key,
    planLabel: plan.label,
    planDurationMonths: plan.durationMonths,
    purchasedAt: now,
    expiresAt,
    renewalDeclined: false,
    grantedBy: input.grantedBy,
    grantedByName: input.grantedByName,
  }

  // Cada compra é registrada como documento independente (histórico completo).
  // A verificação de acesso considera "qualquer compra ativa não expirada".
  await db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).insertOne(purchase as any)

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
