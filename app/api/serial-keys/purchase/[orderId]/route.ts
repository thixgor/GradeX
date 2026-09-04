import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import {
  SERIAL_KEYS_COLLECTION,
  serializeSerialKeyPublic,
  serializeGrantAccess,
  productTypeLabel,
  paymentStatusLabel,
  getActivationUrl,
} from '@/lib/serial-keys'
import { generateActivationQrDataUrl } from '@/lib/serial-key-receipt'
import type { PaymentOrder, SerialKey } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Consulta a compra da Serial Key para a página de sucesso. Protegido pelo
 * `receiptToken` gerado no checkout (comparação em tempo constante), para que
 * ordens não possam ser enumeradas. Reconsulta o MP para refletir aprovação de
 * Pix/boleto sem esperar o webhook, e só revela a Serial Key após aprovação.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'serial_key_purchase_poll', 60, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 })
  }

  const orderId = params.orderId
  const token = new URL(request.url).searchParams.get('token') || ''
  if (!orderId || !ObjectId.isValid(orderId) || !token) {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const db = await getDb()
  const order = await db.collection<PaymentOrder>('payment_orders').findOne({
    _id: new ObjectId(orderId) as any,
  })
  if (!order || !order.metadata?.serialKeyPurchase) {
    return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
  }

  const expectedToken = String(order.metadata?.receiptToken || '')
  if (!expectedToken || !safeEqual(token, expectedToken)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Reconsulta MP se ainda não é terminal (Pix/boleto).
  const TERMINAL = ['approved', 'rejected', 'cancelled', 'expired', 'refunded', 'charged_back']
  let current: PaymentOrder = order
  if (!TERMINAL.includes(order.status) && order.providerPaymentId) {
    try {
      const provider = getPaymentProvider()
      const result = await provider.getPayment(order.providerPaymentId)
      const updated = await applyPaymentResult(orderId, result)
      current = updated.order || order
    } catch (err) {
      console.error('[serial-keys/purchase] falha ao consultar MP:', err)
    }
  }

  const base = {
    orderId,
    status: current.status,
    statusLabel: paymentStatusLabel(current.status),
    productType: current.metadata?.productType,
    productTypeLabel: productTypeLabel(current.metadata?.productType),
    productTitle: current.metadata?.itemTitle,
    amount: current.amount,
    paymentMethod: current.paymentMethod,
    buyerName: current.metadata?.buyerName || current.payerName,
    buyerFirstName: String(current.metadata?.buyerName || current.payerName || 'Comprador').split(' ')[0],
    buyerEmail: current.metadata?.buyerEmail || current.payerEmail,
    buyerPhone: current.metadata?.buyerPhone,
    pix: current.pix || null,
    boleto: current.boleto || null,
    createdAt: current.createdAt,
    paidAt: current.paidAt,
    transactionId: current.providerPaymentId,
    // Compra que o comprador mandou aplicar direto na conta existente dele.
    deliveryMode: current.metadata?.deliveryMode === 'account' ? 'account' : 'serial_key',
    accountEmail: current.metadata?.deliveryMode === 'account'
      ? String(current.metadata?.accountDelivery?.email || '')
      : undefined,
  }

  if (current.status !== 'approved') {
    return NextResponse.json({ ...base, approved: false, serialKey: null })
  }

  // Aprovado → busca a(s) serial key(s) geradas para esta compra.
  const serials = await db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)
    .find({ orderId })
    .sort({ cartIndex: 1 })
    .toArray()

  // Total esperado de keys (1 para compra única; N para carrinho).
  const expected = Array.isArray(current.metadata?.serialKeyCart) && current.metadata.serialKeyCart.length > 0
    ? current.metadata.serialKeyCart.length
    : 1

  if (serials.length === 0 || serials.length < expected) {
    // Ainda gerando (corrida rara / carrinho parcial). O client tenta de novo.
    return NextResponse.json({ ...base, approved: true, serialKey: null, serialKeys: [], generating: true })
  }

  const serialKeys = await Promise.all(serials.map(async (serial) => {
    const activationUrl = serial.activationToken ? getActivationUrl(serial.activationToken) : ''
    let qrDataUrl: string | undefined
    try {
      if (activationUrl) qrDataUrl = await generateActivationQrDataUrl(activationUrl)
    } catch (err) {
      console.error('[serial-keys/purchase] falha ao gerar QR:', err)
    }
    return {
      key: serial.key,
      productTitle: serial.productTitle,
      productType: serial.productType,
      productTypeLabel: productTypeLabel(serial.productType),
      amount: serial.amount,
      status: serial.status,
      activationUrl,
      qrDataUrl,
      // Acesso por tempo: duração comprada e, se já ativada, a data de fim.
      ...serializeGrantAccess(serial),
    }
  }))

  // A entrega na conta só pode ser anunciada quando ela de fato aconteceu: se a
  // ativação automática falhou, a key volta a ser o caminho e a página precisa
  // mostrá-la. Por isso conferimos as keys, não só a intenção gravada na order.
  const accountUserId = String(current.metadata?.accountDelivery?.userId || '')
  const appliedToAccount = base.deliveryMode === 'account'
    && !!accountUserId
    && serials.every((serial) => serial.activatedByUserId === accountUserId)

  const primary = serials[0]
  return NextResponse.json({
    ...base,
    approved: true,
    appliedToAccount,
    // Compat: campos únicos apontam para a primeira key.
    serialKey: primary.key,
    serialKeyStatus: primary.status,
    activationUrl: serialKeys[0]?.activationUrl,
    qrDataUrl: serialKeys[0]?.qrDataUrl,
    // Compra de item único: o acesso da primeira key também na raiz.
    ...serializeGrantAccess(primary),
    serialKeys,
    isCart: serialKeys.length > 1,
    public: serializeSerialKeyPublic(primary),
  })
}
