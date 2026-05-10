import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import type { PaymentOrder } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Polling de status. Reconsulta o MP server-side e reaplica efeitos se mudou.
 * Usado pelo front para mostrar Pix aguardando → aprovado.
 *
 * Doações anônimas: liberadas para qualquer um (status público + sem dados sensíveis).
 * Demais: somente o dono ou admin.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'payments_status_poll', 60, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 })
  }
  const orderId = params.id
  if (!orderId || !ObjectId.isValid(orderId)) {
    return NextResponse.json({ error: 'orderId inválido' }, { status: 400 })
  }

  const db = await getDb()
  const order = await db.collection<PaymentOrder>('payment_orders').findOne({
    _id: new ObjectId(orderId) as any,
  })
  if (!order) return NextResponse.json({ error: 'Order não encontrada' }, { status: 404 })

  const session = await getSession()
  const isOwner = !!(session?.userId && order.userId && session.userId === order.userId)
  const isAdmin = session?.role === 'admin'
  const isAnonymousDonation = order.type === 'donation' && !order.userId

  if (!isOwner && !isAdmin && !isAnonymousDonation) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Se já está em estado terminal, retorna do banco
  const TERMINAL = ['approved', 'rejected', 'cancelled', 'expired', 'refunded', 'charged_back']
  if (TERMINAL.includes(order.status)) {
    return NextResponse.json(serialize(order))
  }

  // Reconsulta MP se temos providerPaymentId
  if (order.providerPaymentId) {
    try {
      const provider = getPaymentProvider()
      const result = await provider.getPayment(order.providerPaymentId)
      const updated = await applyPaymentResult(orderId, result)
      return NextResponse.json(serialize(updated.order || order))
    } catch (err: any) {
      console.error('[orders/status] falha ao consultar MP:', err)
    }
  }
  return NextResponse.json(serialize(order))
}

function serialize(o: PaymentOrder) {
  return {
    orderId: String(o._id),
    type: o.type,
    status: o.status,
    statusDetail: o.statusDetail,
    paymentMethod: o.paymentMethod,
    amount: o.amount,
    currency: o.currency,
    pix: o.pix || null,
    boleto: o.boleto || null,
    paidAt: o.paidAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}
