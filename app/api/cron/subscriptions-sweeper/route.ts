import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getPaymentProvider } from '@/lib/payments'
import { mapMpPreapprovalStatus } from '@/lib/payments/mercado-pago/status-mapper'
import { audit } from '@/lib/payments/audit'
import { sendSubscriptionCancelledEmail } from '@/lib/mail'
import type { SubscriptionRecord, User, AccountType } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron horário (Vercel Cron). Varre assinaturas e:
 *  - reconcilia status com o MP
 *  - revoga cargo de usuários cujo `currentPeriodEndsAt` já passou e a sub não foi renovada
 *  - marca como 'expired'
 *
 * Autenticação: header `Authorization: Bearer ${CRON_SECRET}` ou Vercel Cron header.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const subsCol = db.collection<SubscriptionRecord>('subscriptions')
  const usersCol = db.collection<User>('users')

  const now = new Date()
  const stats = { reconciled: 0, expired: 0, errors: 0 }

  // 1) Reconciliar todas as ativas/pendentes (best-effort, em lotes)
  const candidates = await subsCol
    .find({ status: { $in: ['authorized', 'pending', 'paused'] } })
    .limit(200)
    .toArray()

  const provider = getPaymentProvider()
  for (const sub of candidates) {
    try {
      const remote = await provider.getPreapproval(sub.providerSubscriptionId)
      const newStatus = remote.status
      const updates: Partial<SubscriptionRecord> = {
        status: newStatus,
        nextBillingAt: remote.nextBillingAt,
        updatedAt: now,
      }
      if (newStatus !== sub.status) stats.reconciled++
      await subsCol.updateOne({ _id: sub._id as any }, { $set: updates })
    } catch (err) {
      stats.errors++
      console.error('[cron-subs] reconcile fail', sub.providerSubscriptionId, err)
    }
  }

  // 2) Expirar quem ultrapassou o período pago e não tem mais autorização
  const expiredCandidates = await subsCol
    .find({
      status: { $in: ['cancelled', 'paused', 'expired', 'authorized'] },
      currentPeriodEndsAt: { $lt: now },
      cancelAtPeriodEnd: true,
    })
    .limit(500)
    .toArray()

  // Também usuários com assinatura cancelada+período encerrado
  for (const sub of expiredCandidates) {
    if (!sub.userId) continue
    try {
      const user = await usersCol.findOne({ _id: new ObjectId(sub.userId) as any })
      if (!user) continue

      // Se ainda há outra subscription ativa, não revoga
      const otherActive = await subsCol.findOne({
        userId: sub.userId,
        status: 'authorized',
        cancelAtPeriodEnd: { $ne: true },
        _id: { $ne: sub._id as any },
      })
      if (otherActive) continue

      await usersCol.updateOne(
        { _id: new ObjectId(sub.userId) as any },
        {
          $set: {
            accountType: 'gratuito' as AccountType,
            premiumPlanType: undefined as any,
            premiumExpiresAt: undefined as any,
            mercadoPagoPreapprovalId: undefined as any,
          },
        }
      )
      await subsCol.updateOne(
        { _id: sub._id as any },
        { $set: { status: 'expired', updatedAt: now } }
      )
      stats.expired++

      await audit({
        action: 'role_revoked',
        targetUserId: sub.userId,
        resourceType: 'subscription',
        resourceId: sub.providerSubscriptionId,
        metadata: { reason: 'period_ended', byCron: true },
      })

      sendSubscriptionCancelledEmail(user.email, user.name).catch(() => {})
    } catch (err) {
      stats.errors++
      console.error('[cron-subs] expire fail', sub.providerSubscriptionId, err)
    }
  }

  return NextResponse.json({ ok: true, ...stats })
}

function isAuthorized(request: NextRequest): boolean {
  // Vercel Cron envia header `x-vercel-cron`. Em outros ambientes, validamos
  // o bearer.
  if (request.headers.get('x-vercel-cron')) return true
  const auth = request.headers.get('authorization') || ''
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`
  return !!process.env.CRON_SECRET && auth === expected
}
