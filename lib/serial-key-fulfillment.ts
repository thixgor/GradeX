/**
 * Fulfillment de Serial Keys de compra: chamado quando um pagamento vinculado a
 * uma compra de serial key é aprovado. Gera a key (idempotente) e envia o
 * e-mail premium com QR + comprovante PDF. Reutilizado pelo reenvio do admin.
 */

import { ObjectId, type Db } from 'mongodb'
import { getDb } from './mongodb'
import {
  createSerialKeysForOrder,
  getActivationUrl,
  getAppUrl,
  grantSerialKeyProduct,
  markSerialKeyActivated,
  productTypeLabel,
  paymentStatusLabel,
  SERIAL_KEYS_COLLECTION,
} from './serial-keys'
import {
  generateReceiptPdf,
  generateActivationQrBuffer,
  buildReceiptText,
  type SerialKeyReceiptData,
} from './serial-key-receipt'
import {
  sendSerialKeyPurchaseEmail,
  sendSerialKeyCartPurchaseEmail,
  sendSerialKeyAccountDeliveryEmail,
  type MaterialEmailAttachment,
} from './mail'
import { buildAutoEmailPdfAttachments } from './material-pdf-email'
import { formatDuration, formatDurationMinutes, normalizeDuration } from './material-timed-access'
import type { PaymentOrder, SerialKey, SerialKeyEmailLog } from './types'
import type { ProviderOrder } from './payments/types'

/**
 * Resolve os anexos de PDF (com marca d'água do comprador) para uma serial key
 * de compra de material/pacote — apenas quando o material tem o envio
 * automático habilitado. `eligible` indica que a compra deve ter ativação
 * restrita ao e-mail do comprador. Nunca lança.
 */
async function buildSerialMaterialAttachments(
  db: Db,
  serial: SerialKey
): Promise<{ attachments: MaterialEmailAttachment[]; eligible: boolean }> {
  const grant = serial.grant
  if (!grant || !serial.buyerEmail) return { attachments: [], eligible: false }
  const itemType = grant.itemType || (grant.productType === 'package' ? 'package' : 'material')
  const itemId = grant.itemId ? String(grant.itemId) : ''
  if (!itemId || (itemType !== 'material' && itemType !== 'package')) {
    return { attachments: [], eligible: false }
  }
  const { items, eligible } = await buildAutoEmailPdfAttachments(db, itemType, itemId, {
    userName: serial.buyerName || '',
    userEmail: serial.buyerEmail,
    userId: String(serial._id),
    orderId: serial.providerPaymentId || serial.orderId || String(serial._id),
  }, { timedAccess: grant.accessMode === 'timed' })
  return { attachments: items, eligible }
}

/** Marca a(s) key(s) como de ativação restrita ao e-mail da compra. */
async function markKeysRestricted(db: Db, keyIds: (string | ObjectId | undefined)[]): Promise<void> {
  const ids = keyIds.filter(Boolean).map(id => new ObjectId(String(id)))
  if (ids.length === 0) return
  await db.collection<SerialKey>(SERIAL_KEYS_COLLECTION).updateMany(
    { _id: { $in: ids } as any },
    { $set: { restrictActivationToBuyerEmail: true } }
  ).catch(err => console.error('[serial-key] falha ao marcar restrição de ativação:', err))
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  pix: 'Pix',
  boleto: 'Boleto',
  unknown: '—',
}

/**
 * Nº de tentativas de ENVIO imediato (dentro da mesma chamada) antes de desistir
 * e registrar `failed`. Combate falhas transitórias do SMTP (rajada/queda de
 * conexão da Hostinger). O sweeper de fulfillment cuida das falhas persistentes.
 */
const MAX_EMAIL_SEND_RETRIES = Number(process.env.SERIAL_KEY_EMAIL_RETRIES) || 3

/**
 * Nº máximo de tentativas de ENVIO (somando webhook + execuções do cron) antes
 * de o sweeper parar de tentar. Cada tentativa falha vira um log em
 * `emailHistory` com `kind:'purchase', status:'failed'`.
 */
export const MAX_FULFILLMENT_EMAIL_ATTEMPTS = Number(process.env.SERIAL_KEY_FULFILLMENT_MAX_ATTEMPTS) || 8

/** A partir de quantas falhas o admin é alertado (uma única vez) por e-mail. */
export const FULFILLMENT_ALERT_AFTER_ATTEMPTS = Number(process.env.SERIAL_KEY_FULFILLMENT_ALERT_AFTER) || 2

/** Executa `fn` com algumas retentativas e backoff linear. Relança no fim. */
async function sendWithRetry(label: string, fn: () => Promise<void>): Promise<void> {
  let lastErr: any
  for (let attempt = 1; attempt <= MAX_EMAIL_SEND_RETRIES; attempt++) {
    try {
      await fn()
      return
    } catch (err) {
      lastErr = err
      console.error(`[serial-key] ${label} — tentativa ${attempt}/${MAX_EMAIL_SEND_RETRIES} falhou:`, err)
      if (attempt < MAX_EMAIL_SEND_RETRIES) {
        await new Promise(r => setTimeout(r, attempt * 1500)) // 1.5s, 3s, ...
      }
    }
  }
  throw lastErr
}

/**
 * Resume o estado de entrega por e-mail de uma compra, a partir do histórico
 * gravado nas key(s). Usado pelo sweeper para decidir retry/desistência.
 */
export function getFulfillmentEmailState(keys: SerialKey[]): {
  hasKeys: boolean
  alreadySent: boolean
  failedAttempts: number
  lastAttemptAt: Date | null
  lastError?: string
} {
  const logs = keys.flatMap(k => k.emailHistory || []).filter(e => e.kind === 'purchase')
  const alreadySent = logs.some(e => e.status === 'sent')
  const failed = logs.filter(e => e.status === 'failed')
  // Compra de carrinho grava o MESMO log em todas as keys (updateMany), então a
  // contagem por key evita inflar o número de tentativas.
  const failedAttempts = keys.length > 0
    ? Math.max(0, ...keys.map(k => (k.emailHistory || []).filter(e => e.kind === 'purchase' && e.status === 'failed').length))
    : 0
  let lastAttemptAt: Date | null = null
  let lastError: string | undefined
  for (const e of logs) {
    const at = e.sentAt ? new Date(e.sentAt) : null
    if (at && (!lastAttemptAt || at > lastAttemptAt)) {
      lastAttemptAt = at
      lastError = e.error
    }
  }
  return { hasKeys: keys.length > 0, alreadySent, failedAttempts, lastAttemptAt, lastError }
}

/** Modalidade de acesso da key, quando a compra foi por tempo limitado. */
function timedAccessOf(serial: SerialKey): SerialKeyReceiptData['timedAccess'] {
  const grant = serial.grant
  if (grant?.accessMode !== 'timed' || !(grant.accessDuration || grant.accessDurationMinutes)) return undefined
  return {
    versionLabel: grant.accessVersionLabel,
    durationLabel: grant.accessDuration
      ? formatDuration(normalizeDuration(grant.accessDuration))
      : formatDurationMinutes(grant.accessDurationMinutes || 0),
  }
}

function buildReceiptData(serial: SerialKey, paymentMethod?: string): SerialKeyReceiptData {
  const activationUrl = serial.activationToken ? getActivationUrl(serial.activationToken) : ''
  return {
    buyerName: serial.buyerName || '',
    buyerEmail: serial.buyerEmail || '',
    buyerPhone: serial.buyerPhone || '',
    productTitle: serial.productTitle || 'Produto',
    productTypeLabel: productTypeLabel(serial.productType),
    amount: serial.amount || 0,
    paymentStatusLabel: paymentStatusLabel(serial.paymentStatus),
    paymentMethodLabel: paymentMethod ? (PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod) : undefined,
    transactionId: serial.providerPaymentId,
    purchasedAt: serial.generatedAt ? new Date(serial.generatedAt) : new Date(),
    serialKey: serial.key,
    activationUrl,
    timedAccess: timedAccessOf(serial),
  }
}

/**
 * Envia (ou reenvia) o e-mail da serial key e registra no histórico.
 * Retorna true se enviou com sucesso.
 */
export async function sendSerialKeyEmail(
  db: Db,
  serial: SerialKey,
  opts: { paymentMethod?: string; kind?: 'purchase' | 'resend'; sentBy?: string } = {}
): Promise<boolean> {
  if (!serial.buyerEmail || !serial.activationToken) return false
  const kind = opts.kind || 'purchase'
  const receipt = buildReceiptData(serial, opts.paymentMethod)

  let log: SerialKeyEmailLog
  try {
    const [pdfBuffer, qrBuffer, material] = await Promise.all([
      generateReceiptPdf(receipt).catch(err => {
        console.error('[serial-key] falha ao gerar PDF:', err)
        return undefined
      }),
      generateActivationQrBuffer(receipt.activationUrl).catch(err => {
        console.error('[serial-key] falha ao gerar QR:', err)
        return undefined
      }),
      buildSerialMaterialAttachments(db, serial),
    ])

    // Compra sem login de material com envio automático: a ativação passa a
    // ser restrita ao e-mail da compra. Grava a flag antes de enviar.
    if (material.eligible) {
      await markKeysRestricted(db, [serial._id])
    }

    await sendWithRetry('envio serial key', () => sendSerialKeyPurchaseEmail({
      email: serial.buyerEmail!,
      buyerName: serial.buyerName || '',
      buyerPhone: serial.buyerPhone || '',
      productTitle: receipt.productTitle,
      productTypeLabel: receipt.productTypeLabel,
      amount: receipt.amount,
      paymentStatusLabel: receipt.paymentStatusLabel,
      paymentMethodLabel: receipt.paymentMethodLabel,
      transactionId: receipt.transactionId,
      purchasedAt: receipt.purchasedAt,
      serialKey: serial.key,
      activationUrl: receipt.activationUrl,
      timedAccess: receipt.timedAccess,
      receiptText: buildReceiptText(receipt),
      pdfBuffer,
      qrBuffer,
      kind,
      materialAttachments: material.attachments,
      restrictActivationToBuyerEmail: material.eligible,
    }))

    log = { to: serial.buyerEmail, status: 'sent', kind, sentAt: new Date(), sentBy: opts.sentBy }
  } catch (err: any) {
    console.error('[serial-key] falha ao enviar e-mail:', err)
    log = { to: serial.buyerEmail, status: 'failed', kind, sentAt: new Date(), error: String(err?.message || err), sentBy: opts.sentBy }
  }

  if (serial._id) {
    await db.collection<SerialKey>(SERIAL_KEYS_COLLECTION).updateOne(
      { _id: new ObjectId(String(serial._id)) as any },
      { $push: { emailHistory: log } }
    )
  }
  return log.status === 'sent'
}

/**
 * Envia (ou reenvia) um único e-mail consolidado com TODAS as serial keys de
 * uma compra (carrinho), cada uma com seu link/QR de ativação. Registra o
 * histórico de e-mail em todas as keys da compra.
 */
export async function sendSerialKeyCartEmail(
  db: Db,
  keys: SerialKey[],
  opts: { paymentMethod?: string; kind?: 'purchase' | 'resend'; sentBy?: string } = {}
): Promise<boolean> {
  const first = keys[0]
  if (!first?.buyerEmail) return false
  const kind = opts.kind || 'purchase'

  let ok = false
  let error: string | undefined
  try {
    const items = await Promise.all(keys.map(async (k) => {
      const activationUrl = k.activationToken ? getActivationUrl(k.activationToken) : ''
      const qrBuffer = activationUrl
        ? await generateActivationQrBuffer(activationUrl).catch(() => undefined)
        : undefined
      const timed = timedAccessOf(k)
      return {
        productTitle: k.productTitle || 'Produto',
        productTypeLabel: productTypeLabel(k.productType),
        serialKey: k.key,
        activationUrl,
        amount: k.amount || 0,
        qrBuffer,
        // Aviso por item: o carrinho pode misturar vitalício e por tempo.
        accessNotice: timed
          ? `${timed.versionLabel || 'Acesso temporário'} — ${timed.durationLabel} a partir da ativação desta key, sem download.`
          : undefined,
      }
    }))

    const receipt: SerialKeyReceiptData = {
      buyerName: first.buyerName || '',
      buyerEmail: first.buyerEmail,
      buyerPhone: first.buyerPhone || '',
      productTitle: `Carrinho (${keys.length} itens)`,
      productTypeLabel: 'Compra de vários produtos',
      amount: keys.reduce((s, k) => s + (k.amount || 0), 0),
      paymentStatusLabel: paymentStatusLabel(first.paymentStatus),
      paymentMethodLabel: opts.paymentMethod ? (PAYMENT_METHOD_LABELS[opts.paymentMethod] || opts.paymentMethod) : undefined,
      transactionId: first.providerPaymentId,
      purchasedAt: first.generatedAt ? new Date(first.generatedAt) : new Date(),
      serialKey: keys.map(k => k.key).join('  •  '),
      activationUrl: items[0]?.activationUrl || '',
    }
    const pdfBuffer = await generateReceiptPdf(receipt).catch(() => undefined)

    // Envio automático dos PDFs dos materiais elegíveis do carrinho, com marca
    // d'água. Marca as respectivas keys com ativação restrita ao e-mail.
    const materialAttachments: MaterialEmailAttachment[] = []
    const restrictedKeyIds: (string | ObjectId | undefined)[] = []
    for (const k of keys) {
      const res = await buildSerialMaterialAttachments(db, k)
      if (res.eligible) {
        materialAttachments.push(...res.attachments)
        restrictedKeyIds.push(k._id)
      }
    }
    if (restrictedKeyIds.length > 0) {
      await markKeysRestricted(db, restrictedKeyIds)
    }

    await sendWithRetry('envio serial key (carrinho)', () => sendSerialKeyCartPurchaseEmail({
      email: first.buyerEmail!,
      buyerName: first.buyerName || '',
      buyerPhone: first.buyerPhone || '',
      totalAmount: receipt.amount,
      paymentStatusLabel: receipt.paymentStatusLabel,
      purchasedAt: receipt.purchasedAt,
      items,
      receiptText: buildReceiptText(receipt),
      pdfBuffer,
      kind,
      materialAttachments,
      restrictActivationToBuyerEmail: restrictedKeyIds.length > 0,
    }))
    ok = true
  } catch (err: any) {
    console.error('[serial-key] falha ao enviar e-mail do carrinho:', err)
    error = String(err?.message || err)
  }

  const log: SerialKeyEmailLog = {
    to: first.buyerEmail, status: ok ? 'sent' : 'failed', kind, sentAt: new Date(), error, sentBy: opts.sentBy,
  }
  await db.collection<SerialKey>(SERIAL_KEYS_COLLECTION).updateMany(
    { _id: { $in: keys.filter(k => k._id).map(k => new ObjectId(String(k._id))) } as any },
    { $push: { emailHistory: log } }
  )
  return ok
}

// ── Entrega direto na conta existente do comprador ──────────────────────────

/** Conta de destino gravada na order pelo checkout (nunca vinda do client). */
export interface AccountDeliveryTarget {
  userId: string
  email: string
  name: string
}

/**
 * A compra pediu para ser aplicada direto numa conta existente?
 *
 * Quem responde é a order: o checkout já procurou a conta pelo e-mail da compra
 * e gravou o destino em `metadata.accountDelivery`. Aqui só lemos.
 */
export function accountDeliveryTargetOf(order: PaymentOrder): AccountDeliveryTarget | null {
  if (order.metadata?.deliveryMode !== 'account') return null
  const target = order.metadata?.accountDelivery
  const userId = String(target?.userId || '')
  if (!userId || !ObjectId.isValid(userId)) return null
  return {
    userId,
    email: String(target?.email || order.metadata?.buyerEmail || '').toLowerCase(),
    name: String(target?.name || order.payerName || ''),
  }
}

export interface AccountDeliveryOutcome {
  /** Keys que ficaram (ou já estavam) ativadas na conta de destino. */
  applied: SerialKey[]
  /** Keys que continuam sem ativação — precisam ir por e-mail como Serial Key. */
  pending: SerialKey[]
  /** Para onde mandar a pessoa: a página do produto (1 item) ou "meus materiais". */
  accessPath: string
}

/**
 * Ativa as keys da compra na conta escolhida, exatamente como se a pessoa
 * tivesse clicado no link de ativação.
 *
 * É idempotente por natureza: `grantSerialKeyProduct` roda uma vez por key e a
 * key já ativada nesta conta é contada como aplicada sem repetir a concessão —
 * o webhook do Mercado Pago repete a mesma notificação com frequência.
 *
 * Nada aqui pode derrubar a entrega: a key que falhar volta em `pending` e sai
 * pelo caminho normal (e-mail com Serial Key), para o comprador nunca ficar sem
 * o que pagou.
 */
export async function activateKeysForAccount(
  db: Db,
  keys: SerialKey[],
  target: AccountDeliveryTarget
): Promise<AccountDeliveryOutcome> {
  const applied: SerialKey[] = []
  const pending: SerialKey[] = []
  const redirects: string[] = []

  for (const key of keys) {
    // Já ativada: nesta conta é sucesso (reentrega do webhook); em outra conta
    // não há nada a fazer — e o e-mail daquela ativação já foi.
    if (key.status === 'activated' || key.used) {
      if (key.activatedByUserId === target.userId) applied.push(key)
      continue
    }
    if (!key.grant || !key._id) {
      pending.push(key)
      continue
    }
    try {
      const granted = await grantSerialKeyProduct(db, key, target)
      await markSerialKeyActivated(db, key._id as any, target)
      redirects.push(granted.redirectTo)
      applied.push({
        ...key,
        used: true,
        status: 'activated',
        activatedByUserId: target.userId,
        activatedByEmail: target.email,
        activatedAt: new Date(),
      })
    } catch (err) {
      console.error('[serial-key] falha ao aplicar key na conta do comprador:', key.key, err)
      pending.push(key)
    }
  }

  return {
    applied,
    pending,
    accessPath: applied.length === 1 && redirects.length === 1 ? redirects[0] : '/materiais?tab=mine',
  }
}

/**
 * Avisa que a compra já está na conta — sem key, sem QR, sem "ative aqui".
 * Registra o envio no histórico das keys aplicadas, o que também torna o
 * reenvio do webhook inofensivo.
 */
async function sendAccountDeliveryEmail(
  db: Db,
  keys: SerialKey[],
  target: AccountDeliveryTarget,
  outcome: AccountDeliveryOutcome,
  opts: { paymentMethod?: string; kind?: 'purchase' | 'resend'; sentBy?: string } = {}
): Promise<boolean> {
  const first = keys[0]
  if (!first) return false
  const kind = opts.kind || 'purchase'
  const to = target.email || first.buyerEmail || ''
  if (!to) return false

  let ok = false
  let error: string | undefined
  try {
    // PDFs com marca d'água dos materiais que têm envio automático habilitado.
    // A marca sai no nome do comprador, como em qualquer compra.
    const materialAttachments: MaterialEmailAttachment[] = []
    for (const key of keys) {
      const res = await buildSerialMaterialAttachments(db, key)
      if (res.eligible) materialAttachments.push(...res.attachments)
    }

    const items = keys.map((key) => {
      const timed = timedAccessOf(key)
      return {
        productTitle: key.productTitle || 'Produto',
        productTypeLabel: productTypeLabel(key.productType),
        amount: key.amount || 0,
        accessNotice: timed
          ? `${timed.versionLabel || 'Acesso temporário'} — ${timed.durationLabel} a partir de agora, sem download.`
          : undefined,
      }
    })
    const totalAmount = keys.reduce((sum, key) => sum + (key.amount || 0), 0)
    const purchasedAt = first.generatedAt ? new Date(first.generatedAt) : new Date()
    const paymentMethodLabel = opts.paymentMethod
      ? (PAYMENT_METHOD_LABELS[opts.paymentMethod] || opts.paymentMethod)
      : undefined
    const accessUrl = `${getAppUrl()}${outcome.accessPath}`

    const receiptText = [
      'COMPROVANTE DE COMPRA - DomineAqui',
      '===================================',
      `Comprador: ${first.buyerName || ''}`,
      `Conta de destino: ${target.email}`,
      first.buyerPhone ? `Telefone: ${first.buyerPhone}` : '',
      ...items.map(item => `Produto: ${item.productTitle} (${item.productTypeLabel}) - R$ ${item.amount.toFixed(2).replace('.', ',')}`),
      `Total pago: R$ ${totalAmount.toFixed(2).replace('.', ',')}`,
      `Status do pagamento: ${paymentStatusLabel(first.paymentStatus)}`,
      paymentMethodLabel ? `Forma de pagamento: ${paymentMethodLabel}` : '',
      first.providerPaymentId ? `ID da transação: ${first.providerPaymentId}` : '',
      '-----------------------------------',
      'O acesso JÁ FOI APLICADO na conta acima. Não há Serial Key para ativar.',
      `Acesse: ${accessUrl}`,
      '-----------------------------------',
      'Suporte: suporte@domineaqui.com.br',
    ].filter(Boolean).join('\n')

    await sendWithRetry('envio de acesso aplicado na conta', () => sendSerialKeyAccountDeliveryEmail({
      email: to,
      accountName: target.name || first.buyerName || '',
      accountEmail: target.email,
      buyerName: first.buyerName || '',
      buyerPhone: first.buyerPhone || '',
      items,
      totalAmount,
      paymentStatusLabel: paymentStatusLabel(first.paymentStatus),
      paymentMethodLabel,
      transactionId: first.providerPaymentId,
      purchasedAt,
      accessUrl,
      receiptText,
      materialAttachments,
    }))
    ok = true
  } catch (err: any) {
    console.error('[serial-key] falha ao enviar e-mail de acesso aplicado na conta:', err)
    error = String(err?.message || err)
  }

  const log: SerialKeyEmailLog = {
    to, status: ok ? 'sent' : 'failed', kind, sentAt: new Date(), error, sentBy: opts.sentBy,
  }
  const ids = keys.filter(k => k._id).map(k => new ObjectId(String(k._id)))
  if (ids.length > 0) {
    await db.collection<SerialKey>(SERIAL_KEYS_COLLECTION).updateMany(
      { _id: { $in: ids } as any },
      { $push: { emailHistory: log } }
    ).catch(err => console.error('[serial-key] falha ao registrar histórico de e-mail:', err))
  }
  return ok
}

/**
 * Ponto de entrada chamado pelos efeitos de pagamento aprovado. Cria a(s)
 * serial key(s) da compra e dispara o e-mail apenas uma vez (idempotente).
 * Carrinho com múltiplos itens → um e-mail consolidado com várias keys.
 */
export async function fulfillSerialKeyOrder(order: PaymentOrder, result?: ProviderOrder): Promise<void> {
  const db = await getDb()
  const keys = await createSerialKeysForOrder(db, order)
  if (keys.length === 0) return

  const alreadySent = keys.some(k => (k.emailHistory || []).some(e => e.kind === 'purchase' && e.status === 'sent'))
  const paymentMethod = result?.paymentMethod || order.paymentMethod

  // Compra sem login que o comprador mandou aplicar direto na conta dele: as
  // keys são ativadas aqui, e o e-mail que sai é o de "já está na sua conta".
  // O que não puder ser aplicado segue pelo caminho normal da Serial Key.
  const target = accountDeliveryTargetOf(order)
  let pendingKeys = keys
  if (target) {
    const outcome = await activateKeysForAccount(db, keys, target)
    pendingKeys = outcome.pending
    if (outcome.applied.length > 0 && !alreadySent) {
      await sendAccountDeliveryEmail(db, outcome.applied, target, outcome, { paymentMethod, kind: 'purchase' })
    }
  }

  if (pendingKeys.length === 0 || alreadySent) return

  if (pendingKeys.length === 1) {
    await sendSerialKeyEmail(db, pendingKeys[0], { paymentMethod, kind: 'purchase' })
  } else {
    await sendSerialKeyCartEmail(db, pendingKeys, { paymentMethod, kind: 'purchase' })
  }
}
