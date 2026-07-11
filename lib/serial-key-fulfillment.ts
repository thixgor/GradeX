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
import { sendSerialKeyPurchaseEmail, sendSerialKeyCartPurchaseEmail, type MaterialEmailAttachment } from './mail'
import { buildAutoEmailPdfAttachments } from './material-pdf-email'
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
  })
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

    await sendSerialKeyPurchaseEmail({
      email: serial.buyerEmail,
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
      receiptText: buildReceiptText(receipt),
      pdfBuffer,
      qrBuffer,
      kind,
      materialAttachments: material.attachments,
      restrictActivationToBuyerEmail: material.eligible,
    })

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
      return {
        productTitle: k.productTitle || 'Produto',
        productTypeLabel: productTypeLabel(k.productType),
        serialKey: k.key,
        activationUrl,
        amount: k.amount || 0,
        qrBuffer,
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

    await sendSerialKeyCartPurchaseEmail({
      email: first.buyerEmail,
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
    })
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
  if (alreadySent) return

  const paymentMethod = result?.paymentMethod || order.paymentMethod
  if (keys.length === 1) {
    await sendSerialKeyEmail(db, keys[0], { paymentMethod, kind: 'purchase' })
  } else {
    await sendSerialKeyCartEmail(db, keys, { paymentMethod, kind: 'purchase' })
  }
}
