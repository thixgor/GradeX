import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { getPaymentProvider } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { audit } from '@/lib/payments/audit'
import type { PaymentOrder } from '@/lib/types'
import type { ProviderOrder } from '@/lib/payments/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Aprovação manual de um pedido pelo admin.
 *
 * Faz exatamente o que a aprovação automática faria: aplica o estado `approved`
 * ao pedido e dispara todos os efeitos (liberação de acesso/plano/material,
 * e-mail de confirmação, rifa, doação, etc.) via `applyPaymentResult` — que é
 * idempotente e só dispara os efeitos na 1ª transição para approved.
 *
 * Estratégia:
 *  1. Se o pedido tem `providerPaymentId`, reconsulta o MP. Se o MP confirmar
 *     `approved`, aplica o resultado real (paidAt/método corretos). Isso resolve
 *     o caso comum: pagamento aprovado no MP mas webhook perdido.
 *  2. Caso o MP não confirme (ou não haja providerPaymentId), força a aprovação
 *     como override do admin, registrando quem aprovou.
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const orderId = params.id
  if (!orderId || !ObjectId.isValid(orderId)) {
    return NextResponse.json({ error: 'orderId inválido' }, { status: 400 })
  }

  const db = await getDb()
  const order = await db.collection<PaymentOrder>('payment_orders').findOne({
    _id: new ObjectId(orderId) as any,
  })
  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  if (order.status === 'approved') {
    return NextResponse.json({ ok: true, alreadyApproved: true, status: 'approved' })
  }

  let result: ProviderOrder | null = null
  let source: 'mercado_pago' | 'manual_override' = 'manual_override'

  // 1) Tenta reconciliar com o MP (webhook perdido, mas pago de verdade).
  if (order.providerPaymentId) {
    try {
      const provider = getPaymentProvider()
      const remote = await provider.getPayment(order.providerPaymentId)
      if (remote.status === 'approved') {
        result = remote
        source = 'mercado_pago'
      }
    } catch (err) {
      console.error('[admin/payments/approve] falha ao consultar MP:', err)
    }
  }

  // 2) Override manual: força approved e dispara os mesmos efeitos.
  if (!result) {
    result = {
      providerOrderId: order.providerPaymentId || order.providerOrderId || `manual-${orderId}`,
      status: 'approved',
      amount: order.amount,
      currency: order.currency || 'BRL',
      paymentMethod: order.paymentMethod || 'unknown',
      statusDetail: 'approved_manually_by_admin',
      paidAt: order.paidAt || new Date(),
      raw: { manual: true, approvedByUserId: session.userId },
    }
  }

  const applied = await applyPaymentResult(orderId, result)

  await audit({
    action: 'order_approved_manually',
    actorUserId: session.userId,
    targetUserId: order.userId,
    resourceType: order.type,
    resourceId: orderId,
    metadata: {
      source,
      amount: order.amount,
      previousStatus: order.status,
      providerPaymentId: result.providerOrderId,
    },
  })

  return NextResponse.json({
    ok: true,
    status: applied.order?.status || 'approved',
    source,
    effectsApplied: applied.applied,
  })
}
