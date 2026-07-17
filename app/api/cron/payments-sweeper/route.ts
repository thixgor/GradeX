import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getPaymentProvider } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import type { PaymentOrder } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron de reconciliação de pagamentos únicos (Pix, cartão, boleto, doações,
 * rifas, materiais, etc.).
 *
 * Motivo: a transição pending → approved depende do webhook do MP (ou do
 * polling do navegador do comprador enquanto a página fica aberta). Se o webhook
 * não chega ou falha (assinatura, indisponibilidade momentânea, retry perdido),
 * o pedido fica preso em "pending" no nosso banco mesmo já aprovado no MP.
 *
 * Este sweeper varre os pedidos ainda em `pending`/`in_process` que já têm um
 * `providerPaymentId` (ou seja, chegaram a ser criados no MP), reconsulta o
 * status real na API do MP e reaplica os efeitos via `applyPaymentResult`
 * (idempotente). Assim, um pagamento aprovado é liberado no máximo até a próxima
 * execução do cron, sem depender do webhook.
 *
 * Autenticação: header `x-vercel-cron` (Vercel Cron) ou
 * `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const ordersCol = db.collection<PaymentOrder>('payment_orders')

  const now = new Date()
  // Janela: só reconciliar pedidos recentes. Pix/boleto vencem em 24h; damos uma
  // folga ampla para cobrir cartões em análise e retries perdidos.
  const since = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const stats = { checked: 0, reconciled: 0, approved: 0, errors: 0 }

  const candidates = await ordersCol
    .find({
      status: { $in: ['pending', 'in_process'] },
      providerPaymentId: { $exists: true, $nin: [null, ''] },
      createdAt: { $gte: since },
    } as any)
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray()

  const provider = getPaymentProvider()

  for (const order of candidates) {
    stats.checked++
    try {
      const result = await provider.getPayment(order.providerPaymentId!)
      const prevStatus = order.status
      const applied = await applyPaymentResult(String(order._id), result)
      const newStatus = applied.order?.status || result.status
      if (newStatus !== prevStatus) {
        stats.reconciled++
        if (newStatus === 'approved') stats.approved++
      }
    } catch (err) {
      stats.errors++
      console.error('[cron-payments] reconcile fail', String(order._id), order.providerPaymentId, err)
    }
  }

  return NextResponse.json({ ok: true, ...stats })
}

function isAuthorized(request: NextRequest): boolean {
  // Vercel Cron envia header `x-vercel-cron`. Em outros ambientes, validamos o bearer.
  if (request.headers.get('x-vercel-cron')) return true
  const auth = request.headers.get('authorization') || ''
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`
  return !!process.env.CRON_SECRET && auth === expected
}
