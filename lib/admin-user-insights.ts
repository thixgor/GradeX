/**
 * Leitura das assinaturas de um usuário para o painel `/admin/users`.
 *
 * ## Por que este arquivo existe
 *
 * A plataforma vende duas coisas por assinatura, e elas moram em lugares
 * diferentes do banco:
 *
 *  - **Plus+** — gravado no próprio documento do usuário
 *    (`accountType`, `premiumPlanType`, `premiumActivatedAt`, `premiumExpiresAt`);
 *  - **Manual Clínico** — gravado em `manual_clinico_purchases`, uma compra por
 *    contratação, com `planKey`/`expiresAt` próprios.
 *
 * O admin precisa ver as duas lado a lado ("assinou o quê, até quando, quanto
 * falta"), e os mesmos números precisam bater entre a rota que enriquece a
 * lista (`/api/admin/users/overview`) e a tela que a renderiza. Este módulo é
 * essa fonte única: só funções puras, sem acesso a banco, para poder ser
 * importado nos dois lados.
 *
 * ## O que conta como "ativo"
 *
 * Sem data de expiração = vitalício = ativo para sempre. Com data no futuro =
 * ativo. Com data no passado = expirado — e o registro **continua aparecendo**,
 * porque a janela entre o vencimento e o rebaixamento (cron noturno / próximo
 * login) é exatamente o que o admin quer enxergar.
 */

import type { ManualClinicoPurchase, User } from './types'
import { isPlusAccount, normalizeAccountType } from './account-tier'

/** Produtos com assinatura própria. */
export type SubscriptionProduct = 'plus' | 'manual_clinico'

/** Quanto tempo antes do vencimento a assinatura entra em "vence logo". */
export const EXPIRING_SOON_DAYS = 7

/** Janela mais larga, usada nos cards de risco de churn. */
export const EXPIRING_WATCH_DAYS = 30

const DAY_MS = 86_400_000

/**
 * Rótulos dos ciclos de cobrança. As chaves são livres (`PlanType` é `string`
 * e o admin cria planos em `/admin/settings`), então tudo que não estiver aqui
 * cai no fallback de `resolvePlanLabel`.
 */
export const PLAN_LABELS: Record<string, string> = {
  teste: 'Teste (dev)',
  mensal: 'Mensal',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  quadrimestral: 'Quadrimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  bienal: 'Bienal',
  vitalicio: 'Vitalício',
  '7dias': '7 dias',
}

/** Duração contratada de cada ciclo. `null` = vitalício (sem vencimento). */
export const PLAN_DURATION_MONTHS: Record<string, number | null> = {
  teste: 0,
  mensal: 1,
  bimestral: 2,
  trimestral: 3,
  quadrimestral: 4,
  semestral: 6,
  anual: 12,
  bienal: 24,
  vitalicio: null,
}

/** Ordem de exibição dos ciclos nos gráficos de distribuição. */
export const PLAN_CYCLE_ORDER = [
  'mensal',
  'bimestral',
  'trimestral',
  'quadrimestral',
  'semestral',
  'anual',
  'bienal',
  'vitalicio',
  'teste',
] as const

/** Ciclos oferecidos nos filtros da tela. */
export const CYCLE_FILTER_OPTIONS = [
  'mensal',
  'trimestral',
  'semestral',
  'anual',
  'vitalicio',
] as const

/**
 * Rótulo legível de um ciclo. `custom` cobre os planos criados à mão pelo
 * admin: em vez de esconder o plano, mostra a chave capitalizada.
 */
export function resolvePlanLabel(
  planKey?: string | null,
  extraLabels?: Record<string, string> | null,
): string {
  if (!planKey) return 'Sem plano definido'
  const key = String(planKey).trim().toLowerCase()
  if (extraLabels?.[key]) return extraLabels[key]
  if (PLAN_LABELS[key]) return PLAN_LABELS[key]
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/** Duração de um ciclo, aceitando o valor já gravado na compra. */
export function resolvePlanDurationMonths(
  planKey?: string | null,
  explicit?: number | null,
): number | null {
  if (typeof explicit === 'number' && explicit > 0) return explicit
  if (explicit === null) return null
  const key = String(planKey || '').trim().toLowerCase()
  if (key in PLAN_DURATION_MONTHS) return PLAN_DURATION_MONTHS[key]
  return null
}

export interface AdminSubscriptionInfo {
  product: SubscriptionProduct
  /** Rótulo do produto ("Plus+" / "Manual Clínico"). */
  productLabel: string
  /** Chave crua do ciclo contratado (`mensal`, `anual`, `vitalicio`, custom…). */
  planKey: string | null
  /** Ciclo já legível ("Mensal", "Anual", "Vitalício"). */
  planLabel: string
  /** Duração contratada em meses. `null` = vitalício. */
  durationMonths: number | null
  lifetime: boolean
  active: boolean
  expired: boolean
  /** Vence dentro de `EXPIRING_SOON_DAYS`. Vitalício nunca vence. */
  expiringSoon: boolean
  startedAt: string | null
  expiresAt: string | null
  /** Milissegundos até o fim. Negativo se já venceu, `null` se vitalício. */
  msRemaining: number | null
  /** Dias inteiros até o fim (arredondado para cima). `null` se vitalício. */
  daysRemaining: number | null
  /** Fração do período já consumida (0–1), para a barra de progresso. */
  elapsedRatio: number | null
  /** Valor pago na contratação, quando registrado. */
  price: number | null
  /** Assinatura recorrente no provedor (renova sozinha). */
  autoRenew: boolean
}

/**
 * Campos do usuário que descrevem a assinatura Plus+.
 *
 * Declarado à mão em vez de `Pick<User, …>` porque `premiumPlanType` aqui é
 * qualquer chave de plano — inclusive as personalizadas criadas em
 * `/admin/settings` — e esta função tem que saber lidar com todas.
 */
export interface PlusSubscriptionSource {
  accountType?: string | null
  premiumPlanType?: string | null
  premiumActivatedAt?: Date | string | null
  premiumExpiresAt?: Date | string | null
  premiumPrice?: number | null
  mercadoPagoPreapprovalId?: string | null
}

/** Assinatura Plus+ lida do documento do usuário. `null` se nunca assinou. */
export function buildPlusSubscription(
  user: PlusSubscriptionSource | null | undefined,
  now: Date = new Date(),
  extraLabels?: Record<string, string> | null,
): AdminSubscriptionInfo | null {
  if (!user) return null

  const hasTier = isPlusAccount(user.accountType)
  const hasHistory = !!user.premiumPlanType || !!user.premiumExpiresAt || !!user.premiumActivatedAt
  // Sem cargo pago e sem rastro de assinatura: a conta nunca passou pelo Plus+.
  if (!hasTier && !hasHistory) return null

  const planKey = user.premiumPlanType ? String(user.premiumPlanType) : null
  let expiresAt = toDate(user.premiumExpiresAt)
  const startedAt = toDate(user.premiumActivatedAt)

  // O cargo já caiu (rebaixamento por vencimento) mas o registro ainda carrega
  // `premiumActivatedAt`/`premiumPrice` de quando era Plus+, sem
  // `premiumExpiresAt`. Sem esse ajuste, "sem data" seria lido como vitalício
  // e o admin veria "Plus+ Vitalício" numa conta que já é Gratuito/Trial —
  // exatamente o bug de quem comprou um ciclo (ex.: mensal) uma vez só.
  if (!hasTier && !expiresAt) {
    expiresAt = startedAt || now
  }

  return buildSubscription({
    product: 'plus',
    productLabel: 'Plus+',
    planKey,
    planLabel: resolvePlanLabel(planKey || (expiresAt ? null : 'vitalicio'), extraLabels),
    durationMonths: resolvePlanDurationMonths(planKey, expiresAt ? undefined : null),
    startedAt,
    expiresAt,
    price: typeof user.premiumPrice === 'number' ? user.premiumPrice : null,
    autoRenew: !!user.mercadoPagoPreapprovalId,
    now,
  })
}

/** Campos de uma compra do Manual Clínico que descrevem a assinatura. */
export interface ManualSubscriptionSource {
  planKey?: string | null
  planLabel?: string | null
  planDurationMonths?: number | null
  accessType?: ManualClinicoPurchase['accessType'] | null
  purchasedAt?: Date | string | null
  expiresAt?: Date | string | null
  price?: number | null
  renewalDeclined?: boolean
}

/**
 * Assinatura do Manual Clínico lida da compra escolhida por
 * `pickBestManualPurchase`. `null` quando não há compra concluída.
 */
export function buildManualSubscription(
  purchase: ManualSubscriptionSource | null | undefined,
  now: Date = new Date(),
): AdminSubscriptionInfo | null {
  if (!purchase) return null

  const expiresAt = toDate(purchase.expiresAt)
  const lifetime = purchase.accessType === 'lifetime' || !expiresAt
  const planKey = purchase.planKey ? String(purchase.planKey) : (lifetime ? 'vitalicio' : null)

  return buildSubscription({
    product: 'manual_clinico',
    productLabel: 'Manual Clínico',
    planKey,
    planLabel: purchase.planLabel || resolvePlanLabel(planKey),
    durationMonths: resolvePlanDurationMonths(
      planKey,
      lifetime ? null : purchase.planDurationMonths ?? undefined,
    ),
    startedAt: toDate(purchase.purchasedAt),
    expiresAt,
    price: typeof purchase.price === 'number' ? purchase.price : null,
    // Manual Clínico é compra avulsa por período: nunca renova sozinho, e
    // `renewalDeclined` marca quem pediu para não ser mais lembrado.
    autoRenew: false,
    now,
  })
}

function buildSubscription(input: {
  product: SubscriptionProduct
  productLabel: string
  planKey: string | null
  planLabel: string
  durationMonths: number | null
  startedAt: Date | null
  expiresAt: Date | null
  price: number | null
  autoRenew: boolean
  now: Date
}): AdminSubscriptionInfo {
  const { expiresAt, startedAt, now } = input
  const lifetime = !expiresAt
  const msRemaining = expiresAt ? expiresAt.getTime() - now.getTime() : null
  const expired = msRemaining !== null && msRemaining <= 0
  const daysRemaining = msRemaining === null ? null : Math.ceil(msRemaining / DAY_MS)

  let elapsedRatio: number | null = null
  if (expiresAt && startedAt && expiresAt.getTime() > startedAt.getTime()) {
    const total = expiresAt.getTime() - startedAt.getTime()
    elapsedRatio = clamp01((now.getTime() - startedAt.getTime()) / total)
  } else if (expiresAt) {
    elapsedRatio = expired ? 1 : null
  }

  return {
    product: input.product,
    productLabel: input.productLabel,
    planKey: input.planKey,
    planLabel: input.planLabel,
    durationMonths: input.durationMonths,
    lifetime,
    active: lifetime || !expired,
    expired,
    expiringSoon:
      !lifetime && !expired && daysRemaining !== null && daysRemaining <= EXPIRING_SOON_DAYS,
    startedAt: startedAt ? startedAt.toISOString() : null,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    msRemaining,
    daysRemaining,
    elapsedRatio,
    price: input.price,
    autoRenew: input.autoRenew,
  }
}

/**
 * Qual compra do Manual Clínico representa a assinatura atual do usuário.
 *
 * Uma conta pode ter várias compras (renovou, ganhou acesso do admin, comprou
 * o vitalício depois do semestral). A que vale é a que dá mais acesso: ativa
 * ganha de expirada, vitalícia ganha de temporária, e entre duas ativas vence
 * a que termina mais tarde. Sem nenhuma ativa, mostra a mais recente — é ela
 * que explica "expirou em tal dia".
 */
export function pickBestManualPurchase<T extends ManualPurchaseRanking>(
  a: T | null | undefined,
  b: T | null | undefined,
  now: Date = new Date(),
): T | null {
  if (!a) return b || null
  if (!b) return a
  const rankA = manualRank(a, now)
  const rankB = manualRank(b, now)
  return rankB > rankA ? b : a
}

/** O mínimo necessário para ordenar duas compras do Manual Clínico. */
export interface ManualPurchaseRanking {
  accessType?: ManualClinicoPurchase['accessType'] | null
  expiresAt?: Date | string | null
  purchasedAt?: Date | string | null
}

function manualRank(purchase: ManualPurchaseRanking, now: Date): number {
  const expiresAt = toDate(purchase.expiresAt)
  const lifetime = purchase.accessType === 'lifetime' || !expiresAt
  if (lifetime) return Number.MAX_SAFE_INTEGER
  const end = expiresAt!.getTime()
  // Ativa: quanto mais longe o fim, melhor. Expirada: fica abaixo de qualquer
  // ativa, mas a mais recente ainda ganha das outras expiradas.
  if (end > now.getTime()) return end
  return end - Number.MAX_SAFE_INTEGER / 2
}

// ── Formatação ───────────────────────────────────────────────────────────────

/**
 * Tempo restante em linguagem de gente: "2 meses e 5 dias", "6 dias", "4 h".
 * Meses são aproximados em blocos de 30 dias — é um resumo de painel, não
 * cálculo de cobrança.
 */
export function formatDurationBreakdown(ms: number): string {
  const abs = Math.abs(ms)
  const totalMinutes = Math.floor(abs / 60_000)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalDays = Math.floor(totalHours / 24)

  if (totalDays >= 30) {
    const months = Math.floor(totalDays / 30)
    const days = totalDays % 30
    const monthPart = `${months} ${months === 1 ? 'mês' : 'meses'}`
    if (days === 0) return monthPart
    return `${monthPart} e ${days} ${days === 1 ? 'dia' : 'dias'}`
  }
  if (totalDays >= 1) {
    const hours = totalHours % 24
    const dayPart = `${totalDays} ${totalDays === 1 ? 'dia' : 'dias'}`
    if (totalDays >= 7 || hours === 0) return dayPart
    return `${dayPart} e ${hours} h`
  }
  if (totalHours >= 1) return `${totalHours} ${totalHours === 1 ? 'hora' : 'horas'}`
  if (totalMinutes >= 1) return `${totalMinutes} min`
  return 'menos de 1 min'
}

/** Frase pronta para o card: "Faltam 2 meses e 5 dias" / "Expirou há 3 dias". */
export function formatSubscriptionRemaining(info: AdminSubscriptionInfo): string {
  if (info.lifetime) return 'Vitalício — não expira'
  if (info.msRemaining === null) return 'Sem data de término'
  if (info.msRemaining <= 0) return `Expirou há ${formatDurationBreakdown(info.msRemaining)}`
  return `Faltam ${formatDurationBreakdown(info.msRemaining)}`
}

/** Data de término no formato brasileiro. */
export function formatSubscriptionEndDate(info: AdminSubscriptionInfo): string {
  if (!info.expiresAt) return 'Sem vencimento'
  return new Date(info.expiresAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Agregação da base ────────────────────────────────────────────────────────

/** Gasto acumulado da conta, somando compras avulsas e Manual Clínico. */
export interface AdminUserSpend {
  total: number
  count: number
  materialTotal: number
  manualTotal: number
  lastPurchaseAt: string | null
}

/** Usuário da lista já enriquecido pela rota de overview. */
export interface AdminUserRow extends User {
  plusSubscription: AdminSubscriptionInfo | null
  manualSubscription: AdminSubscriptionInfo | null
  spend: AdminUserSpend
}

export interface CycleBucket {
  key: string
  label: string
  count: number
}

export interface ProductInsights {
  /** Assinantes com acesso válido agora (inclui vitalícios). */
  active: number
  lifetime: number
  /** Ativos que vencem em até `EXPIRING_SOON_DAYS`. */
  expiringSoon: number
  /** Ativos que vencem em até `EXPIRING_WATCH_DAYS`. */
  expiringMonth: number
  /** Já venceram e ainda carregam o acesso — fila do rebaixamento. */
  expired: number
  /** Distribuição por ciclo entre os ativos. */
  cycles: CycleBucket[]
  /** Receita mensal recorrente estimada (preço ÷ meses do ciclo). */
  estimatedMrr: number
}

export interface AdminUserInsights {
  total: number
  admins: number
  banned: number
  monitors: number
  onlineNow: number
  activeLast7Days: number
  neverLoggedIn: number
  newLast7Days: number
  newLast30Days: number
  plus: ProductInsights
  manual: ProductInsights
  /** Contas com pelo menos uma assinatura ativa. */
  payingUsers: number
  /** Contas com Plus+ **e** Manual Clínico ativos. */
  bothProducts: number
  /** Assinantes ativos ÷ contas de usuário (%). */
  conversionRate: number
  revenueTotal: number
  /** Receita ÷ contas que já compraram alguma coisa. */
  averageTicket: number
  buyers: number
  estimatedMrr: number
  /** Maiores gastos da base, para o card de melhores clientes. */
  topSpenders: Array<{ id: string; name: string; email: string; total: number; count: number }>
}

const ONLINE_THRESHOLD_MS = 10 * 60 * 1000
const ACTIVE_7D_MS = 7 * DAY_MS
const NEW_30D_MS = 30 * DAY_MS

/**
 * Todos os números do topo da tela, calculados de uma vez sobre a base
 * carregada. Fica aqui (e não na rota) para que os cards continuem batendo com
 * a lista mesmo depois de o admin recarregar só um pedaço.
 */
export function buildAdminUserInsights(
  users: AdminUserRow[],
  now: Date = new Date(),
): AdminUserInsights {
  const nowMs = now.getTime()

  const plusActive: AdminSubscriptionInfo[] = []
  const manualActive: AdminSubscriptionInfo[] = []
  let plusExpired = 0
  let manualExpired = 0
  let payingUsers = 0
  let bothProducts = 0
  let revenueTotal = 0
  let buyers = 0
  let admins = 0
  let banned = 0
  let monitors = 0
  let onlineNow = 0
  let activeLast7Days = 0
  let neverLoggedIn = 0
  let newLast7Days = 0
  let newLast30Days = 0

  for (const user of users) {
    if (user.role === 'admin') admins += 1
    if (user.banned) banned += 1
    if (user.secondaryRole === 'monitor') monitors += 1

    const lastLogin = dateValue(user.lastLoginAt)
    if (!lastLogin) neverLoggedIn += 1
    else {
      if (!user.banned && nowMs - lastLogin <= ONLINE_THRESHOLD_MS) onlineNow += 1
      if (!user.banned && nowMs - lastLogin <= ACTIVE_7D_MS) activeLast7Days += 1
    }

    const createdAt = dateValue(user.createdAt)
    if (createdAt) {
      if (nowMs - createdAt <= ACTIVE_7D_MS) newLast7Days += 1
      if (nowMs - createdAt <= NEW_30D_MS) newLast30Days += 1
    }

    const plus = user.plusSubscription
    const manual = user.manualSubscription
    if (plus?.active) plusActive.push(plus)
    if (plus?.expired) plusExpired += 1
    if (manual?.active) manualActive.push(manual)
    if (manual?.expired) manualExpired += 1
    if (plus?.active || manual?.active) payingUsers += 1
    if (plus?.active && manual?.active) bothProducts += 1

    revenueTotal += user.spend?.total || 0
    if ((user.spend?.count || 0) > 0) buyers += 1
  }

  const plusInsights = summarizeProduct(plusActive, plusExpired, now)
  const manualInsights = summarizeProduct(manualActive, manualExpired, now)

  const nonAdminTotal = Math.max(0, users.length - admins)
  const topSpenders = users
    .filter(u => (u.spend?.total || 0) > 0)
    .sort((a, b) => (b.spend?.total || 0) - (a.spend?.total || 0))
    .slice(0, 5)
    .map(u => ({
      id: String(u._id || ''),
      name: u.name || '',
      email: u.email || '',
      total: u.spend?.total || 0,
      count: u.spend?.count || 0,
    }))

  return {
    total: users.length,
    admins,
    banned,
    monitors,
    onlineNow,
    activeLast7Days,
    neverLoggedIn,
    newLast7Days,
    newLast30Days,
    plus: plusInsights,
    manual: manualInsights,
    payingUsers,
    bothProducts,
    conversionRate: nonAdminTotal > 0 ? (payingUsers / nonAdminTotal) * 100 : 0,
    revenueTotal,
    averageTicket: buyers > 0 ? revenueTotal / buyers : 0,
    buyers,
    estimatedMrr: plusInsights.estimatedMrr + manualInsights.estimatedMrr,
    topSpenders,
  }
}

function summarizeProduct(
  active: AdminSubscriptionInfo[],
  expired: number,
  now: Date,
): ProductInsights {
  const counts = new Map<string, number>()
  let lifetime = 0
  let expiringSoon = 0
  let expiringMonth = 0
  let estimatedMrr = 0

  for (const info of active) {
    const key = (info.planKey || 'indefinido').toLowerCase()
    counts.set(key, (counts.get(key) || 0) + 1)
    if (info.lifetime) lifetime += 1
    if (info.daysRemaining !== null) {
      if (info.daysRemaining <= EXPIRING_SOON_DAYS) expiringSoon += 1
      if (info.daysRemaining <= EXPIRING_WATCH_DAYS) expiringMonth += 1
    }
    // Vitalício não é recorrência; plano sem preço registrado não entra na
    // conta em vez de virar zero silencioso.
    if (!info.lifetime && info.price && info.durationMonths && info.durationMonths > 0) {
      estimatedMrr += info.price / info.durationMonths
    }
  }

  const cycles: CycleBucket[] = Array.from(counts.entries())
    .map(([key, count]) => ({ key, label: resolvePlanLabel(key), count }))
    .sort((a, b) => {
      const ia = PLAN_CYCLE_ORDER.indexOf(a.key as (typeof PLAN_CYCLE_ORDER)[number])
      const ib = PLAN_CYCLE_ORDER.indexOf(b.key as (typeof PLAN_CYCLE_ORDER)[number])
      if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
      return b.count - a.count
    })

  return {
    active: active.length,
    lifetime,
    expiringSoon,
    expiringMonth,
    expired,
    cycles,
    estimatedMrr,
  }
}

// ── Filtros da lista ─────────────────────────────────────────────────────────

export type SubscriptionFilter =
  | 'all'
  | 'plus'
  | 'plus_active'
  | 'plus_expired'
  | 'plus_lifetime'
  | 'plus_recurring'
  | 'manual'
  | 'manual_active'
  | 'manual_expired'
  | 'manual_lifetime'
  | 'both'
  | 'any'
  | 'none'

export type ExpiryFilter = 'all' | 'expiring7' | 'expiring15' | 'expiring30' | 'expired'

/** O usuário passa no filtro de assinatura escolhido? */
export function matchesSubscriptionFilter(
  user: AdminUserRow,
  filter: SubscriptionFilter,
): boolean {
  const plus = user.plusSubscription
  const manual = user.manualSubscription

  switch (filter) {
    case 'all':
      return true
    case 'plus':
      return !!plus
    case 'plus_active':
      return !!plus?.active
    case 'plus_expired':
      return !!plus?.expired
    case 'plus_lifetime':
      return !!plus?.lifetime && !!plus?.active
    case 'plus_recurring':
      return !!plus?.autoRenew
    case 'manual':
      return !!manual
    case 'manual_active':
      return !!manual?.active
    case 'manual_expired':
      return !!manual?.expired
    case 'manual_lifetime':
      return !!manual?.lifetime && !!manual?.active
    case 'both':
      return !!plus?.active && !!manual?.active
    case 'any':
      return !!plus?.active || !!manual?.active
    case 'none':
      return !plus?.active && !manual?.active
    default:
      return true
  }
}

/**
 * Filtro por ciclo contratado. Vale para qualquer um dos dois produtos — quem
 * quiser separar combina com o filtro de assinatura.
 */
export function matchesCycleFilter(user: AdminUserRow, cycle: string): boolean {
  if (cycle === 'all') return true
  const keys = [user.plusSubscription, user.manualSubscription]
    .filter((info): info is AdminSubscriptionInfo => !!info && info.active)
    .map(info => (info.planKey || '').toLowerCase())
  if (cycle === 'outro') {
    return keys.some(k => !!k && !(CYCLE_FILTER_OPTIONS as readonly string[]).includes(k))
  }
  return keys.includes(cycle)
}

/** Filtro por proximidade do vencimento, olhando a assinatura mais urgente. */
export function matchesExpiryFilter(user: AdminUserRow, filter: ExpiryFilter): boolean {
  if (filter === 'all') return true
  const subs = [user.plusSubscription, user.manualSubscription].filter(
    (info): info is AdminSubscriptionInfo => !!info,
  )
  if (subs.length === 0) return false

  if (filter === 'expired') {
    // Expirado só interessa quando não há outra assinatura ativa cobrindo.
    return subs.some(s => s.expired) && !subs.some(s => s.active)
  }

  const limit = filter === 'expiring7' ? 7 : filter === 'expiring15' ? 15 : 30
  return subs.some(
    s => s.active && !s.lifetime && s.daysRemaining !== null && s.daysRemaining <= limit,
  )
}

/** Vencimento mais próximo entre as assinaturas ativas, para ordenar a lista. */
export function nextExpiryValue(user: AdminUserRow): number {
  const times = [user.plusSubscription, user.manualSubscription]
    .filter((info): info is AdminSubscriptionInfo => !!info && info.active && !info.lifetime)
    .map(info => (info.expiresAt ? new Date(info.expiresAt).getTime() : Number.POSITIVE_INFINITY))
  if (times.length === 0) return Number.POSITIVE_INFINITY
  return Math.min(...times)
}

// ── Utilitários ──────────────────────────────────────────────────────────────

function toDate(value?: Date | string | null): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function dateValue(value?: Date | string | null): number {
  const date = toDate(value)
  return date ? date.getTime() : 0
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/** Cargo textual usado no CSV e nos filtros de plano. */
export function describeAccountRole(user: Pick<User, 'role' | 'accountType' | 'banned'>): string {
  if (user.role === 'admin') return 'Administrador'
  if (user.banned) return 'Banido'
  const normalized = normalizeAccountType(user.accountType)
  if (normalized === 'plus') return 'Plus+'
  if (normalized === 'trial') return 'Trial'
  return 'Gratuito'
}
