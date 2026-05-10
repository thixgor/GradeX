import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import type { SubscriptionRecord, PaymentRecord } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = await getDb()
  const sub = await db.collection<SubscriptionRecord>('subscriptions').findOne(
    { userId: session.userId },
    { sort: { createdAt: -1 } }
  )

  const payments = await db
    .collection<PaymentRecord>('payments')
    .find({ userId: session.userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray()

  return NextResponse.json({
    subscription: sub
      ? {
          id: String(sub._id),
          planId: sub.planId,
          status: sub.status,
          amount: sub.amount,
          billingIntervalMonths: sub.billingIntervalMonths,
          currentPeriodEndsAt: sub.currentPeriodEndsAt,
          nextBillingAt: sub.nextBillingAt,
          cancelAtPeriodEnd: !!sub.cancelAtPeriodEnd,
          canceledAt: sub.canceledAt,
          createdAt: sub.createdAt,
        }
      : null,
    payments: payments.map(p => ({
      id: String(p._id),
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      paymentMethod: p.paymentMethod,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
  })
}
