/**
 * Núcleo do sistema de Serial Keys de compra (compra avulsa, com ou sem login).
 *
 * Responsabilidades:
 *  - Geração segura de serial keys e tokens de ativação (alta entropia, crypto).
 *  - Validação/sanitização server-side dos dados do comprador.
 *  - Resolução autoritativa de produto + preço (nunca confia no client).
 *  - Geração idempotente da serial key após pagamento aprovado.
 *  - Concessão do produto exato na ativação (conta existente ou nova).
 *  - Logs de segurança / anti-fraude.
 *
 * Toda liberação de benefício passa pela ativação; a compra sem login apenas
 * gera a key vinculada ao pagamento. Compatível com o fluxo legado de keys de
 * administrador (origin === 'admin').
 */

import { randomBytes, randomInt } from 'crypto'
import { ObjectId, type Db } from 'mongodb'
import { getDb } from './mongodb'
import { audit } from './payments/audit'
import { getPersonalExamsQuota } from './tier-limits'
import { grantMaterialCartItems, type MaterialCartResolvedItem } from './material-cart'
import {
  getManualClinicoConfig,
  getManualClinicoPlan,
  grantManualClinicoAccess,
  MANUAL_CLINICO_PRODUCT_ID,
  MANUAL_CLINICO_PRODUCT_TYPE,
} from './manual-clinico-product'
import type {
  SerialKey,
  SerialKeyGrant,
  SerialKeyProductType,
  PaymentOrder,
  User,
  AccountType,
  ManualClinicoPlanKey,
} from './types'

export const SERIAL_KEYS_COLLECTION = 'serial_keys'
export const SERIAL_KEY_SECURITY_LOGS = 'serial_key_security_logs'

/** Alfabeto sem caracteres ambíguos (sem 0/O, 1/I, etc.) para leitura humana. */
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 32 símbolos
const KEY_GROUPS = 5
const KEY_GROUP_LEN = 5 // 25 símbolos × log2(32) = 125 bits de entropia

const SERIAL_KEY_PRODUCT_TYPES: SerialKeyProductType[] = [
  'manual_clinico',
  'material',
  'flashcard',
  'package',
  'premium',
  'essential',
]

// ── Geração segura ───────────────────────────────────────────────────────────

/** Gera uma serial key com forte entropia via CSPRNG. Formato XXXXX-XXXXX-... */
export function generateSecureSerialKey(): string {
  const groups: string[] = []
  for (let g = 0; g < KEY_GROUPS; g++) {
    let group = ''
    for (let i = 0; i < KEY_GROUP_LEN; i++) {
      group += KEY_ALPHABET[randomInt(0, KEY_ALPHABET.length)]
    }
    groups.push(group)
  }
  return groups.join('-')
}

/** Token opaco URL-safe para link/QR de ativação (não previsível). */
export function generateActivationToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Token curto usado pela página de sucesso para consultar a compra. */
export function generateReceiptToken(): string {
  return randomBytes(24).toString('base64url')
}

/** Normaliza a serial key digitada (maiúsculas, remove espaços). */
export function normalizeSerialKey(raw: string): string {
  return String(raw || '').toUpperCase().replace(/\s+/g, '').trim()
}

// ── Validação / sanitização de comprador ─────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function sanitizeName(raw: unknown): string {
  return String(raw ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

export function isValidFullName(name: string): boolean {
  // Ao menos nome + sobrenome, apenas letras/espaços/hífen/apóstrofo.
  return /^[\p{L} .'\-]{3,120}$/u.test(name) && name.trim().includes(' ')
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 160
}

/** Mantém apenas dígitos (+ opcional). Retorna E.164-ish sem formatação. */
export function normalizePhone(raw: unknown): string {
  const s = String(raw ?? '').replace(/[^\d+]/g, '')
  return s.startsWith('+') ? '+' + s.slice(1).replace(/\+/g, '') : s.replace(/\+/g, '')
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

export function firstNameOf(name?: string): string {
  const n = sanitizeName(name || '')
  return n.split(' ')[0] || n || 'Comprador'
}

export interface BuyerInfo {
  name: string
  firstName: string
  email: string
  phone: string
}

/** Valida e normaliza os dados obrigatórios do comprador (server-side). */
export function parseBuyerInfo(input: {
  name?: unknown
  email?: unknown
  phone?: unknown
}): { ok: true; buyer: BuyerInfo } | { ok: false; error: string } {
  const name = sanitizeName(input.name)
  const email = String(input.email ?? '').trim().toLowerCase()
  const phone = normalizePhone(input.phone)

  if (!isValidFullName(name)) return { ok: false, error: 'Informe seu nome completo.' }
  if (!isValidEmail(email)) return { ok: false, error: 'Informe um e-mail válido.' }
  if (!isValidPhone(phone)) return { ok: false, error: 'Informe um telefone válido com DDD.' }

  return { ok: true, buyer: { name, firstName: firstNameOf(name), email, phone } }
}

// ── URLs ─────────────────────────────────────────────────────────────────────

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://www.domineaqui.com.br').replace(/\/$/, '')
}

export function getActivationUrl(activationToken: string): string {
  return `${getAppUrl()}/ativar?token=${encodeURIComponent(activationToken)}`
}

export function getSuccessUrl(orderId: string, receiptToken: string): string {
  return `${getAppUrl()}/compra/aprovada?order=${encodeURIComponent(orderId)}&token=${encodeURIComponent(receiptToken)}`
}

// ── Resolução autoritativa de produto ────────────────────────────────────────

export interface ResolvedSerialKeyProduct {
  productType: SerialKeyProductType
  productId: string
  productTitle: string
  amount: number
  description: string
  grant: SerialKeyGrant
}

export function isSerialKeyProductType(v: unknown): v is SerialKeyProductType {
  return typeof v === 'string' && SERIAL_KEY_PRODUCT_TYPES.includes(v as SerialKeyProductType)
}

const PRODUCT_TYPE_LABELS: Record<SerialKeyProductType, string> = {
  manual_clinico: 'Manual Clínico',
  material: 'Material',
  flashcard: 'Flashcards',
  package: 'Pacote',
  premium: 'Assinatura Premium',
  essential: 'Assinatura Essential',
}

export function productTypeLabel(pt?: SerialKeyProductType | string): string {
  return (pt && PRODUCT_TYPE_LABELS[pt as SerialKeyProductType]) || 'Produto'
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando pagamento',
  in_process: 'Em análise',
  approved: 'Aprovado',
  rejected: 'Recusado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  charged_back: 'Estornado',
  expired: 'Expirado',
}

export function paymentStatusLabel(status?: string): string {
  return (status && PAYMENT_STATUS_LABELS[status]) || 'Aprovado'
}

/**
 * Resolve o produto pedido a partir da fonte autoritativa (admin_settings,
 * materials, manual clínico). Retorna preço e a descrição do que será liberado.
 * Lança Error com mensagem amigável em caso de produto inválido/indisponível.
 */
export async function resolveSerialKeyProduct(
  db: Db,
  input: {
    productType: SerialKeyProductType
    productId?: string
    planKey?: string
    itemType?: 'material' | 'package'
  }
): Promise<ResolvedSerialKeyProduct> {
  const { productType } = input

  if (productType === 'premium' || productType === 'essential') {
    const settings = await db.collection('admin_settings').findOne({})
    const planos = (settings?.planos || []) as any[]
    // productId = tipo do plano. Se não informado, tenta o primeiro do cargo pedido.
    let plano = input.productId ? planos.find(p => p.tipo === input.productId) : undefined
    if (!plano) {
      plano = planos.find(p => (p.role || 'premium') === productType)
    }
    if (!plano) throw new Error('Plano não encontrado ou indisponível.')
    const amount = Number(plano.preco)
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Plano sem preço válido.')
    const role: AccountType = (plano.role as AccountType) || (productType as AccountType)
    return {
      productType,
      productId: String(plano.tipo),
      productTitle: plano.nome || (productType === 'premium' ? 'Assinatura Premium' : 'Assinatura Essential'),
      amount,
      description: `${plano.nome || 'Assinatura'} — ${plano.periodo || 'Plano'}`,
      grant: {
        productType,
        role,
        planId: String(plano.tipo),
        durationMonths: Number(plano.durationMonths || 0),
      },
    }
  }

  if (productType === 'manual_clinico') {
    const config = await getManualClinicoConfig(db)
    if (!config.isActive) throw new Error('O Manual Clínico Premium está indisponível no momento.')
    const planKey = (input.planKey as ManualClinicoPlanKey) || 'vitalicio'
    let plan = getManualClinicoPlan(config, planKey)
    // Se o plano pedido/padrão estiver desabilitado, cai para o primeiro habilitado.
    if (!plan?.enabled) {
      const enabled = (config.plans || []).find((p) => p.enabled && Number(p.price || 0) > 0)
      if (enabled) plan = enabled
    }
    if (!plan?.enabled) throw new Error('Este plano do Manual Clínico não está disponível.')
    const amount = Number(plan.price || 0)
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Plano sem preço válido.')
    return {
      productType,
      productId: MANUAL_CLINICO_PRODUCT_ID,
      productTitle: `${config.label} — ${plan.label}`,
      amount,
      description: `${config.label} — ${plan.label}`,
      grant: { productType, manualClinicoPlanKey: plan.key },
    }
  }

  // material / package / flashcard
  const itemType: 'material' | 'package' =
    productType === 'package' ? 'package' : 'material'
  if (!input.productId || !ObjectId.isValid(input.productId)) {
    throw new Error('Produto inválido.')
  }
  const collection = itemType === 'package' ? 'material_packages' : 'materials'
  const item = await db.collection(collection).findOne({ _id: new ObjectId(input.productId) })
  if (!item) throw new Error('Produto não encontrado.')
  if (item.pricing === 'free' || !item.price || Number(item.price) <= 0) {
    throw new Error('Este item é gratuito e não requer compra.')
  }
  const amount = Number(item.price)
  const isFlashcard =
    productType === 'flashcard' ||
    item.materialType === 'flashcard_deck' ||
    Boolean(item.linkedDeckSlug)
  return {
    productType: itemType === 'package' ? 'package' : (isFlashcard ? 'flashcard' : 'material'),
    productId: String(input.productId),
    productTitle: item.title || 'Material',
    amount,
    description: item.title || 'Material',
    grant: {
      productType: itemType === 'package' ? 'package' : (isFlashcard ? 'flashcard' : 'material'),
      itemType,
      itemId: String(input.productId),
      itemTitle: item.title || 'Material',
      linkedDeckSlug: item.linkedDeckSlug ? String(item.linkedDeckSlug) : undefined,
    },
  }
}

// ── Índices (idempotência forte) ─────────────────────────────────────────────

let indexesEnsured = false
async function ensureSerialKeyIndexes(db: Db) {
  if (indexesEnsured) return
  try {
    // Índice antigo (uma key por order) — removido: o carrinho gera N keys.
    await db.collection(SERIAL_KEYS_COLLECTION).dropIndex('uniq_orderId').catch(() => {})
    // Uma compra (orderId) gera no máximo UMA serial key POR item (cartIndex).
    await db.collection(SERIAL_KEYS_COLLECTION).createIndex(
      { orderId: 1, cartIndex: 1 },
      { unique: true, sparse: true, name: 'uniq_order_item' }
    )
    await db.collection(SERIAL_KEYS_COLLECTION).createIndex(
      { activationToken: 1 },
      { sparse: true, name: 'activationToken' }
    )
    indexesEnsured = true
  } catch (err) {
    console.error('[serial-keys] falha ao garantir índices:', err)
  }
}

/** Entrada de item para geração de keys (single ou carrinho). */
interface SerialKeyItem {
  grant: SerialKeyGrant
  productTitle: string
  amount: number
}

/** Insere uma serial key idempotente por (orderId, cartIndex), regenerando em colisão de key. */
async function insertSerialKeyForItem(
  db: Db,
  order: PaymentOrder,
  item: SerialKeyItem,
  cartIndex: number
): Promise<SerialKey | null> {
  const orderId = String(order._id)
  const col = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)

  // Já existe esta posição? (idempotência)
  const existing = await col.findOne({ orderId, cartIndex })
  if (existing) return existing

  const buyerName = order.metadata?.buyerName || order.payerName || ''
  const buyerEmail = order.metadata?.buyerEmail || order.payerEmail || ''
  const buyerPhone = order.metadata?.buyerPhone || ''
  const now = new Date()
  const grant = item.grant

  for (let attempt = 0; attempt < 6; attempt++) {
    const key = generateSecureSerialKey()
    const activationToken = generateActivationToken()
    const doc: SerialKey = {
      key,
      type: grant.productType === 'premium' ? 'premium' : 'custom',
      used: false,
      generatedBy: order.userId || 'system',
      generatedByName: 'Compra automática',
      generatedAt: now,
      origin: 'purchase',
      status: 'unactivated',
      grant,
      productType: grant.productType,
      productId: grant.itemId || grant.planId || order.refId,
      productTitle: item.productTitle || grant.itemTitle || grant.planId,
      activationToken,
      orderId,
      cartIndex,
      providerPaymentId: order.providerPaymentId || order.providerOrderId,
      paymentStatus: 'approved',
      amount: item.amount,
      price: item.amount,
      buyerName: sanitizeName(buyerName),
      buyerFirstName: firstNameOf(buyerName),
      buyerEmail: String(buyerEmail).toLowerCase(),
      buyerPhone: buyerPhone ? normalizePhone(buyerPhone) : undefined,
      ip: order.metadata?.ip,
      userAgent: order.metadata?.userAgent,
      source: order.metadata?.source || 'checkout',
      usedBy: undefined,
      emailHistory: [],
    }

    try {
      const res = await col.insertOne(doc as any)
      doc._id = res.insertedId
      await audit({
        action: 'material_unlocked',
        actorUserId: order.userId,
        resourceType: 'serial_key',
        resourceId: orderId,
        metadata: { serialKeyId: String(res.insertedId), productType: grant.productType, amount: item.amount, cartIndex, origin: 'purchase' },
      })
      return doc
    } catch (err: any) {
      if (err?.code === 11000) {
        const dupKey = String(err?.keyPattern ? Object.keys(err.keyPattern).join(',') : err?.message || '')
        if (dupKey.includes('orderId') || dupKey.includes('cartIndex')) {
          // Outra execução criou esta posição primeiro.
          const created = await col.findOne({ orderId, cartIndex })
          if (created) return created
        }
        continue // colisão de key → tenta outra
      }
      throw err
    }
  }
  console.error('[serial-keys] não foi possível gerar key única para order', orderId, 'item', cartIndex)
  return null
}

// ── Geração da(s) serial key(s) após pagamento aprovado ──────────────────────

/**
 * Cria (ou retorna as existentes) as serial keys de uma order aprovada.
 * IDEMPOTENTE por (orderId, cartIndex). Gera UMA key por item comprado:
 *  - compra única  → 1 key (metadata.serialKeyGrant).
 *  - carrinho      → N keys (metadata.serialKeyCart), uma por produto.
 * Só deve ser chamado quando o pagamento está aprovado.
 */
export async function createSerialKeysForOrder(
  db: Db,
  order: PaymentOrder
): Promise<SerialKey[]> {
  const orderId = String(order._id)
  await ensureSerialKeyIndexes(db)

  // Monta a lista de itens (single ou carrinho).
  let items: SerialKeyItem[] = []
  const cart = order.metadata?.serialKeyCart
  if (Array.isArray(cart) && cart.length > 0) {
    items = cart
      .filter((c: any) => c?.grant && isSerialKeyProductType(c.grant.productType))
      .map((c: any) => ({
        grant: c.grant as SerialKeyGrant,
        productTitle: String(c.productTitle || c.grant.itemTitle || 'Produto'),
        amount: Number(c.amount || 0),
      }))
  } else {
    const grant = order.metadata?.serialKeyGrant as SerialKeyGrant | undefined
    if (grant && isSerialKeyProductType(grant.productType)) {
      items = [{ grant, productTitle: String(order.metadata?.itemTitle || grant.itemTitle || grant.planId || 'Produto'), amount: Number(order.amount) }]
    }
  }

  if (items.length === 0) {
    console.warn('[serial-keys] order sem itens válidos para gerar key:', orderId)
    return []
  }

  const keys: SerialKey[] = []
  for (let i = 0; i < items.length; i++) {
    const created = await insertSerialKeyForItem(db, order, items[i], i)
    if (created) keys.push(created)
  }
  return keys
}

// ── Concessão do produto na ativação ─────────────────────────────────────────

export interface ActivationTarget {
  userId: string
  name?: string
  email?: string
}

export interface ActivationResult {
  productLabel: string
  redirectTo: string
}

/**
 * Aplica exatamente o produto comprado à conta que está ativando a key.
 * Não marca a key como usada — isso é feito pelo caller após sucesso.
 */
export async function grantSerialKeyProduct(
  db: Db,
  serial: SerialKey,
  target: ActivationTarget
): Promise<ActivationResult> {
  const grant = serial.grant
  if (!grant) throw new Error('Serial key sem configuração de produto.')

  switch (grant.productType) {
    case 'premium':
    case 'essential': {
      const now = new Date()
      const role: AccountType = grant.role || (grant.productType as AccountType)
      let expiresAt: Date | undefined
      if (grant.durationMonths && grant.durationMonths > 0) {
        expiresAt = new Date(now)
        expiresAt.setMonth(expiresAt.getMonth() + grant.durationMonths)
      }
      await db.collection<User>('users').updateOne(
        { _id: new ObjectId(target.userId) as any },
        {
          $set: {
            accountType: role,
            premiumPlanType: grant.planId as any,
            premiumActivatedAt: now,
            premiumExpiresAt: expiresAt,
            premiumPrice: serial.amount,
            dailyPersonalExamsCreated: 0,
            dailyPersonalExamsRemaining: getPersonalExamsQuota(role),
            lastDailyReset: now,
          },
        }
      )
      await audit({
        action: 'role_granted',
        targetUserId: target.userId,
        resourceType: 'serial_key',
        resourceId: String(serial._id),
        metadata: { role, planId: grant.planId, expiresAt, via: 'serial_key' },
      })
      return {
        productLabel: serial.productTitle || (role === 'premium' ? 'Assinatura Premium' : 'Assinatura Essential'),
        redirectTo: '/dashboard',
      }
    }

    case 'manual_clinico': {
      const config = await getManualClinicoConfig(db)
      const plan = getManualClinicoPlan(config, grant.manualClinicoPlanKey || 'vitalicio')
      await grantManualClinicoAccess(db, {
        userId: target.userId,
        userName: target.name || serial.buyerName || '',
        userEmail: target.email || serial.buyerEmail || '',
        config,
        plan,
        price: serial.amount || 0,
        provider: 'mercado_pago',
        providerOrderId: serial.orderId,
        providerPaymentId: serial.providerPaymentId,
        grantedBy: 'serial_key',
        grantedByName: 'Ativação por Serial Key',
      })
      await audit({
        action: 'manual_clinico_unlocked',
        targetUserId: target.userId,
        resourceType: 'serial_key',
        resourceId: String(serial._id),
        metadata: { planKey: plan.key, via: 'serial_key' },
      })
      return { productLabel: serial.productTitle || config.label, redirectTo: '/manual-clinico' }
    }

    case 'material':
    case 'flashcard':
    case 'package': {
      const itemType = grant.itemType || (grant.productType === 'package' ? 'package' : 'material')
      const resolved: MaterialCartResolvedItem = {
        itemType,
        itemId: String(grant.itemId),
        itemTitle: grant.itemTitle || serial.productTitle || 'Material',
        linkedDeckSlug: grant.linkedDeckSlug,
        price: serial.amount || 0,
        originalPrice: serial.amount || 0,
        discountApplied: 0,
        ownedMaterialIds: [],
      }
      await grantMaterialCartItems(
        db,
        { userId: target.userId, name: target.name || serial.buyerName || '', email: target.email || serial.buyerEmail || '' },
        [resolved],
        {
          providerOrderId: serial.orderId,
          providerPaymentId: serial.providerPaymentId,
          auditMetadata: { via: 'serial_key', serialKeyId: String(serial._id) },
        }
      )
      const redirectTo = itemType === 'package'
        ? '/pacotes'
        : grant.linkedDeckSlug
          ? '/flashcards'
          : `/materiais/${grant.itemId}`
      return { productLabel: grant.itemTitle || serial.productTitle || 'Material', redirectTo }
    }

    default:
      throw new Error('Tipo de produto não suportado para ativação.')
  }
}

/** Marca a serial key como ativada/usada por uma conta (idempotente no caller). */
export async function markSerialKeyActivated(
  db: Db,
  serialId: ObjectId | string,
  target: ActivationTarget
) {
  const _id = typeof serialId === 'string' ? new ObjectId(serialId) : serialId
  await db.collection<SerialKey>(SERIAL_KEYS_COLLECTION).updateOne(
    { _id: _id as any },
    {
      $set: {
        used: true,
        status: 'activated',
        usedBy: target.userId,
        usedByName: target.name || '',
        usedAt: new Date(),
        activatedByUserId: target.userId,
        activatedByEmail: target.email,
        activatedAt: new Date(),
      },
    }
  )
}

// ── Logs de segurança / anti-fraude ──────────────────────────────────────────

export interface SerialKeySecurityLog {
  kind: 'activation_failed' | 'activation_blocked' | 'checkout_blocked' | 'invalid_key' | 'rate_limited' | 'duplicate'
  ip?: string
  userAgent?: string
  userId?: string
  email?: string
  keyMasked?: string
  detail?: string
  createdAt: Date
}

export async function logSerialKeySecurity(entry: Omit<SerialKeySecurityLog, 'createdAt'>) {
  try {
    const db = await getDb()
    await db.collection<SerialKeySecurityLog>(SERIAL_KEY_SECURITY_LOGS).insertOne({
      ...entry,
      createdAt: new Date(),
    })
  } catch (err) {
    console.error('[serial-keys] falha ao registrar log de segurança:', err)
  }
}

/** Mascara uma serial key para logs (mostra só o primeiro grupo). */
export function maskSerialKey(key: string): string {
  const norm = normalizeSerialKey(key)
  const [first] = norm.split('-')
  return first ? `${first}-****-****-****-****` : '****'
}

/** View pública/segura da serial key para páginas de sucesso/ativação. */
export function serializeSerialKeyPublic(serial: SerialKey) {
  return {
    key: serial.key,
    productType: serial.productType,
    productTitle: serial.productTitle,
    status: serial.status,
    amount: serial.amount,
    activationToken: serial.activationToken,
    activationUrl: serial.activationToken ? getActivationUrl(serial.activationToken) : undefined,
    buyerFirstName: serial.buyerFirstName,
    buyerName: serial.buyerName,
    buyerEmail: serial.buyerEmail,
    buyerPhone: serial.buyerPhone,
    paymentStatus: serial.paymentStatus,
    activatedAt: serial.activatedAt,
    createdAt: serial.generatedAt,
    orderId: serial.orderId,
  }
}

/** View reduzida para a página de ativação (sem revelar a key inteira). */
export function serializeSerialKeyForActivation(serial: SerialKey) {
  return {
    productType: serial.productType,
    productTitle: serial.productTitle,
    status: serial.status,
    amount: serial.amount,
    buyerFirstName: serial.buyerFirstName,
    buyerEmail: serial.buyerEmail,
    alreadyActivated: serial.status === 'activated' || serial.used,
    cancelled: serial.status === 'cancelled',
  }
}
