import { Db, ObjectId } from 'mongodb'

export const PRICING_EVENTS_COLLECTION = 'pricing_events'

export type PricingEventMode = 'weekly' | 'manual'

export type PricingEventScope = 'material' | 'package' | 'manual_clinico'

export interface PricingEventWeeklyTier {
  /** Tier ativo a partir de N semanas ANTES do evento (inclusive). */
  weeksBefore: number
  /** 0–100. */
  discountPercent: number
  /** Texto opcional exibido na UI. */
  label?: string
}

export interface PricingEventManualTier {
  startAt: Date
  endAt: Date
  discountPercent: number
  label?: string
}

export interface PricingEvent {
  _id?: string | ObjectId
  name: string
  description?: string
  bannerUrl?: string
  eventDate: Date
  mode: PricingEventMode
  weeklyTiers: PricingEventWeeklyTier[]
  manualTiers: PricingEventManualTier[]
  isActive: boolean
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export interface PricingEventActiveTier {
  /** Índice do tier dentro da lista (weeklyTiers ou manualTiers). */
  index: number
  mode: PricingEventMode
  discountPercent: number
  label: string
  /** Quando o tier atual termina (próxima virada ou data do evento). */
  endsAt: Date
  /** Quando o tier começou. */
  startedAt?: Date
}

export interface PricingEventState {
  eventId: string
  name: string
  description?: string
  bannerUrl?: string
  eventDate: Date
  mode: PricingEventMode
  isActive: boolean
  /** Tier ativo no momento da consulta — null se evento já passou ou ainda não começou. */
  activeTier: PricingEventActiveTier | null
  /** Próximo tier (com maior desconto perdido). Null se este é o último ou já não há próximo. */
  nextTier: { index: number; discountPercent: number; startsAt?: Date; endsAt: Date; label: string } | null
  /** Maior desconto que ESTE evento já ofereceu (para mensagens de urgência). */
  maxDiscountPercent: number
  /** Lista pública dos tiers (já normalizada para datas absolutas). */
  tiersTimeline: Array<{
    index: number
    startAt: Date
    endAt: Date
    discountPercent: number
    label: string
    isActive: boolean
    isPast: boolean
    isFuture: boolean
  }>
  /** Dias inteiros restantes até o evento (0 ou mais; -1 se já passou). */
  daysUntilEvent: number
}

export interface PricingEventAppliedPrice {
  /** Preço original sem desconto. */
  originalPrice: number
  /** Preço após o desconto do lote. */
  priceAfterTier: number
  /** Valor absoluto descontado em R$. */
  tierDiscountAmount: number
  /** Percentual descontado realmente aplicado (pode diferir do nominal se houver clamp). */
  discountPercentApplied: number
  /** Estado do evento usado para o cálculo. */
  state: PricingEventState
}

export class PricingEventError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'PricingEventError'
    this.status = status
  }
}

function roundMoney(value: number) {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100)
}

function clampPercent(value: number) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 100) return 100
  return n
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function diffDays(later: Date, earlier: Date) {
  const ms = startOfDay(later).getTime() - startOfDay(earlier).getTime()
  return Math.round(ms / 86_400_000)
}

function ensureDate(value: any): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function normalizeWeeklyTiers(tiers: any[]): PricingEventWeeklyTier[] {
  const list = Array.isArray(tiers) ? tiers : []
  const cleaned: PricingEventWeeklyTier[] = []
  const seen = new Set<number>()
  for (const t of list) {
    const weeks = Math.max(0, Math.floor(Number(t?.weeksBefore)))
    if (!Number.isFinite(weeks) || seen.has(weeks)) continue
    seen.add(weeks)
    cleaned.push({
      weeksBefore: weeks,
      discountPercent: clampPercent(Number(t?.discountPercent || 0)),
      label: typeof t?.label === 'string' ? t.label.trim().slice(0, 80) : undefined,
    })
  }
  // Maior weeksBefore primeiro (lote mais antigo, maior desconto).
  cleaned.sort((a, b) => b.weeksBefore - a.weeksBefore)
  return cleaned
}

function normalizeManualTiers(tiers: any[]): PricingEventManualTier[] {
  const list = Array.isArray(tiers) ? tiers : []
  const cleaned: PricingEventManualTier[] = []
  for (const t of list) {
    const startAt = ensureDate(t?.startAt)
    const endAt = ensureDate(t?.endAt)
    if (!startAt || !endAt) continue
    if (endAt.getTime() <= startAt.getTime()) continue
    cleaned.push({
      startAt,
      endAt,
      discountPercent: clampPercent(Number(t?.discountPercent || 0)),
      label: typeof t?.label === 'string' ? t.label.trim().slice(0, 80) : undefined,
    })
  }
  cleaned.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
  // Detectar sobreposição
  for (let i = 1; i < cleaned.length; i += 1) {
    if (cleaned[i].startAt.getTime() < cleaned[i - 1].endAt.getTime()) {
      throw new PricingEventError(
        'Os lotes manuais não podem se sobrepor. Ajuste as datas para que cada lote termine antes do próximo começar.'
      )
    }
  }
  return cleaned
}

export function normalizePricingEventInput(input: any, actor: { userId: string; name: string }) {
  const name = String(input?.name || '').trim()
  if (!name) throw new PricingEventError('Informe um nome para o evento.')
  const eventDate = ensureDate(input?.eventDate)
  if (!eventDate) throw new PricingEventError('Data do evento inválida.')
  const mode: PricingEventMode = input?.mode === 'manual' ? 'manual' : 'weekly'
  const weeklyTiers = normalizeWeeklyTiers(input?.weeklyTiers || [])
  const manualTiers = normalizeManualTiers(input?.manualTiers || [])
  if (mode === 'weekly' && weeklyTiers.length === 0) {
    throw new PricingEventError('Adicione pelo menos um lote semanal.')
  }
  if (mode === 'manual' && manualTiers.length === 0) {
    throw new PricingEventError('Adicione pelo menos um lote por data.')
  }
  const now = new Date()
  const doc: Omit<PricingEvent, '_id'> = {
    name: name.slice(0, 140),
    description: input?.description ? String(input.description).trim().slice(0, 480) : undefined,
    bannerUrl: input?.bannerUrl ? String(input.bannerUrl).trim().slice(0, 600) : undefined,
    eventDate,
    mode,
    weeklyTiers,
    manualTiers,
    isActive: input?.isActive !== false,
    createdBy: actor.userId,
    createdByName: actor.name || '',
    createdAt: now,
    updatedAt: now,
  }
  return doc
}

function buildTimelineFromWeekly(event: PricingEvent, now: Date) {
  const event0 = startOfDay(event.eventDate)
  const tiers = event.weeklyTiers
  const out: PricingEventState['tiersTimeline'] = []
  for (let i = 0; i < tiers.length; i += 1) {
    const tier = tiers[i]
    const startAt = new Date(event0)
    startAt.setDate(event0.getDate() - tier.weeksBefore * 7)
    // O próximo tier (menor weeksBefore) começa antes deste terminar.
    const nextWeeks = i + 1 < tiers.length ? tiers[i + 1].weeksBefore : -1
    const endAt = new Date(event0)
    if (nextWeeks >= 0) {
      endAt.setDate(event0.getDate() - nextWeeks * 7)
    } else {
      endAt.setTime(event.eventDate.getTime())
    }
    out.push({
      index: i,
      startAt,
      endAt,
      discountPercent: tier.discountPercent,
      label: tier.label || labelForWeeks(tier.weeksBefore),
      isActive: now >= startAt && now < endAt,
      isPast: now >= endAt,
      isFuture: now < startAt,
    })
  }
  return out
}

function labelForWeeks(weeksBefore: number) {
  if (weeksBefore <= 0) return 'Semana do evento'
  if (weeksBefore === 1) return '1 semana antes'
  return `${weeksBefore}+ semanas antes`
}

function buildTimelineFromManual(event: PricingEvent, now: Date) {
  return event.manualTiers.map((tier, i) => ({
    index: i,
    startAt: tier.startAt,
    endAt: tier.endAt,
    discountPercent: tier.discountPercent,
    label: tier.label || `Lote ${i + 1}`,
    isActive: now >= tier.startAt && now < tier.endAt,
    isPast: now >= tier.endAt,
    isFuture: now < tier.startAt,
  }))
}

export function resolvePricingEventState(event: PricingEvent, now: Date = new Date()): PricingEventState {
  const timeline = event.mode === 'manual'
    ? buildTimelineFromManual(event, now)
    : buildTimelineFromWeekly(event, now)

  const active = timeline.find((t) => t.isActive) || null
  const next = timeline.find((t) => t.isFuture) || null
  const maxDiscount = timeline.reduce((max, t) => Math.max(max, t.discountPercent), 0)
  const daysUntilEvent = diffDays(event.eventDate, now)

  return {
    eventId: String(event._id),
    name: event.name,
    description: event.description,
    bannerUrl: event.bannerUrl,
    eventDate: event.eventDate,
    mode: event.mode,
    isActive: event.isActive !== false,
    activeTier: active && event.isActive !== false && daysUntilEvent >= 0
      ? {
          index: active.index,
          mode: event.mode,
          discountPercent: active.discountPercent,
          label: active.label,
          endsAt: active.endAt,
          startedAt: active.startAt,
        }
      : null,
    nextTier: next
      ? {
          index: next.index,
          discountPercent: next.discountPercent,
          startsAt: next.startAt,
          endsAt: next.endAt,
          label: next.label,
        }
      : null,
    maxDiscountPercent: maxDiscount,
    tiersTimeline: timeline,
    daysUntilEvent,
  }
}

export function applyPricingEventToPrice(state: PricingEventState, originalPrice: number): PricingEventAppliedPrice {
  const safeOriginal = roundMoney(originalPrice)
  if (!state.isActive || !state.activeTier || safeOriginal <= 0) {
    return {
      originalPrice: safeOriginal,
      priceAfterTier: safeOriginal,
      tierDiscountAmount: 0,
      discountPercentApplied: 0,
      state,
    }
  }
  const pct = clampPercent(state.activeTier.discountPercent)
  const discount = roundMoney(safeOriginal * (pct / 100))
  return {
    originalPrice: safeOriginal,
    priceAfterTier: roundMoney(safeOriginal - discount),
    tierDiscountAmount: discount,
    discountPercentApplied: pct,
    state,
  }
}

export async function getPricingEventById(db: Db, eventId: string | undefined | null) {
  if (!eventId || !ObjectId.isValid(String(eventId))) return null
  const doc = await db.collection<PricingEvent>(PRICING_EVENTS_COLLECTION).findOne({
    _id: new ObjectId(String(eventId)) as any,
  })
  return doc || null
}

export async function getPricingEventStateById(
  db: Db,
  eventId: string | undefined | null,
  now: Date = new Date()
): Promise<PricingEventState | null> {
  const event = await getPricingEventById(db, eventId)
  if (!event) return null
  return resolvePricingEventState(event, now)
}

/**
 * Resolve o estado para vários eventos de uma vez (batch checkout).
 * Retorna um Map<eventId, state>.
 */
export async function getPricingEventStatesByIds(
  db: Db,
  eventIds: Array<string | null | undefined>,
  now: Date = new Date()
): Promise<Map<string, PricingEventState>> {
  const unique = Array.from(new Set(
    eventIds.filter((id): id is string => !!id && ObjectId.isValid(String(id)))
  ))
  if (unique.length === 0) return new Map()
  const docs = await db.collection<PricingEvent>(PRICING_EVENTS_COLLECTION).find({
    _id: { $in: unique.map((id) => new ObjectId(id)) },
  } as any).toArray()
  const map = new Map<string, PricingEventState>()
  for (const doc of docs) {
    map.set(String(doc._id), resolvePricingEventState(doc, now))
  }
  return map
}

/**
 * Calcula desconto efetivo combinando lote + cupom usando a regra "maior dos dois".
 * NÃO empilha — escolhe o que dá MAIS desconto absoluto ao cliente.
 *
 * Retorna qual fonte ganhou para o checkout saber se aplica o cupom ou não.
 */
export function combineTierAndCouponDiscount(input: {
  basePrice: number
  tierDiscountAmount: number
  couponDiscountAmount: number
}): {
  finalPrice: number
  appliedDiscountAmount: number
  appliedSource: 'tier' | 'coupon' | 'none'
} {
  const base = roundMoney(input.basePrice)
  const tier = Math.max(0, roundMoney(input.tierDiscountAmount))
  const coupon = Math.max(0, roundMoney(input.couponDiscountAmount))

  if (base <= 0 || (tier <= 0 && coupon <= 0)) {
    return { finalPrice: base, appliedDiscountAmount: 0, appliedSource: 'none' }
  }
  if (coupon > tier) {
    return {
      finalPrice: roundMoney(Math.max(0, base - coupon)),
      appliedDiscountAmount: coupon,
      appliedSource: 'coupon',
    }
  }
  return {
    finalPrice: roundMoney(Math.max(0, base - tier)),
    appliedDiscountAmount: tier,
    appliedSource: 'tier',
  }
}

export function serializePricingEventState(state: PricingEventState | null) {
  if (!state) return null
  return {
    eventId: state.eventId,
    name: state.name,
    description: state.description || '',
    bannerUrl: state.bannerUrl || '',
    eventDate: state.eventDate.toISOString(),
    mode: state.mode,
    isActive: state.isActive,
    daysUntilEvent: state.daysUntilEvent,
    maxDiscountPercent: state.maxDiscountPercent,
    activeTier: state.activeTier ? {
      index: state.activeTier.index,
      discountPercent: state.activeTier.discountPercent,
      label: state.activeTier.label,
      endsAt: state.activeTier.endsAt.toISOString(),
      startedAt: state.activeTier.startedAt?.toISOString(),
    } : null,
    nextTier: state.nextTier ? {
      index: state.nextTier.index,
      discountPercent: state.nextTier.discountPercent,
      label: state.nextTier.label,
      startsAt: state.nextTier.startsAt?.toISOString(),
      endsAt: state.nextTier.endsAt.toISOString(),
    } : null,
    tiersTimeline: state.tiersTimeline.map((t) => ({
      index: t.index,
      startAt: t.startAt.toISOString(),
      endAt: t.endAt.toISOString(),
      discountPercent: t.discountPercent,
      label: t.label,
      isActive: t.isActive,
      isPast: t.isPast,
      isFuture: t.isFuture,
    })),
  }
}

export function serializePricingEvent(event: PricingEvent) {
  return {
    id: String(event._id),
    name: event.name,
    description: event.description || '',
    bannerUrl: event.bannerUrl || '',
    eventDate: event.eventDate instanceof Date ? event.eventDate.toISOString() : new Date(event.eventDate).toISOString(),
    mode: event.mode,
    weeklyTiers: event.weeklyTiers || [],
    manualTiers: (event.manualTiers || []).map((t) => ({
      startAt: t.startAt instanceof Date ? t.startAt.toISOString() : new Date(t.startAt).toISOString(),
      endAt: t.endAt instanceof Date ? t.endAt.toISOString() : new Date(t.endAt).toISOString(),
      discountPercent: t.discountPercent,
      label: t.label || '',
    })),
    isActive: event.isActive !== false,
    createdByName: event.createdByName || '',
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : new Date(event.createdAt).toISOString(),
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : new Date(event.updatedAt).toISOString(),
  }
}

export type SerializedPricingEventState = ReturnType<typeof serializePricingEventState>
export type SerializedPricingEvent = ReturnType<typeof serializePricingEvent>

/**
 * Computa o desconto de lote por item de um carrinho de checkout.
 * Não modifica preços — só retorna o desconto absoluto que SERIA aplicado se o lote vencesse o cupom.
 */
export async function computeCartTierDiscounts(
  db: Db,
  items: Array<{ itemType: string; itemId: string; price: number; pricingEventId?: string | null }>,
  now: Date = new Date()
) {
  const eventIds = items.map((item) => item.pricingEventId || null)
  const states = await getPricingEventStatesByIds(db, eventIds, now)

  const perItem = items.map((item) => {
    const state = item.pricingEventId ? states.get(String(item.pricingEventId)) || null : null
    if (!state || !state.activeTier || state.isActive === false) {
      return { itemId: item.itemId, itemType: item.itemType, tierDiscountAmount: 0, state }
    }
    const discount = roundMoney(Number(item.price || 0) * (state.activeTier.discountPercent / 100))
    return {
      itemId: item.itemId,
      itemType: item.itemType,
      tierDiscountAmount: discount,
      state,
    }
  })

  const totalTierDiscount = roundMoney(
    perItem.reduce((sum, entry) => sum + entry.tierDiscountAmount, 0)
  )

  return { perItem, totalTierDiscount, states }
}

