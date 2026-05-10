import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { getPaymentProvider } from '@/lib/payments'
import { audit } from '@/lib/payments/audit'
import { sendSubscriptionCancelledEmail } from '@/lib/mail'
import type { SubscriptionRecord, User } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cancela a assinatura do usuário no Mercado Pago.
 * Política: mantém o acesso até `currentPeriodEndsAt`. Acesso é revogado
 * pelo cron (`/api/cron/subscriptions-sweeper`) quando essa data expira.
 *
 * Idempotente: cancelar duas vezes não erra, retorna o estado atual.
 */
export async function POST(_request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = await getDb()
  const subsCol = db.collection<SubscriptionRecord>('subscriptions')

  const sub = await subsCol.findOne({
    userId: session.userId,
    status: { $in: ['authorized', 'pending', 'paused'] },
  })

  if (!sub) {
    return NextResponse.json({ error: 'Nenhuma assinatura ativa' }, { status: 400 })
  }

  if (sub.cancelAtPeriodEnd) {
    return NextResponse.json({
      message: 'Assinatura já agendada para cancelamento',
      currentPeriodEndsAt: sub.currentPeriodEndsAt,
      status: sub.status,
    })
  }

  // Cancelar no MP (idempotente — preapproval cancelada permanece cancelada)
  try {
    const provider = getPaymentProvider()
    await provider.cancelPreapproval(sub.providerSubscriptionId)
  } catch (err: any) {
    console.error('[cancel-sub] erro no MP:', err?.message)
    // Continuar — registramos a intenção de cancelamento mesmo se a chamada falhar
  }

  await subsCol.updateOne(
    { _id: sub._id as any },
    {
      $set: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        updatedAt: new Date(),
        // Status interno fica 'authorized' até o cron expirar — o usuário mantém acesso
      },
    }
  )

  await audit({
    action: 'subscription_canceled',
    actorUserId: session.userId,
    targetUserId: session.userId,
    resourceType: 'subscription',
    resourceId: sub.providerSubscriptionId,
    metadata: { keepUntil: sub.currentPeriodEndsAt },
  })

  // Email best-effort
  const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) as any })
  if (user) {
    sendSubscriptionCancelledEmail(user.email, user.name).catch(err => {
      console.error('[cancel-sub] e-mail falhou:', err)
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Assinatura cancelada — acesso mantido até o fim do período pago.',
    currentPeriodEndsAt: sub.currentPeriodEndsAt,
    status: 'cancel_pending',
  })
}
