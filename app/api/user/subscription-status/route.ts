import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { User } from '@/lib/types'
import { ObjectId } from 'mongodb'
import type { SubscriptionRecord } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Busca assinatura recorrente ativa (preapproval MP)
    const activeSub = await db.collection<SubscriptionRecord>('subscriptions').findOne({
      userId: session.userId,
      status: { $in: ['authorized', 'pending', 'paused'] },
    })
    const hasRecurringSubscription = !!activeSub

    const now = new Date()
    let activeSubscription = null

    if (user.accountType === 'premium') {
      let expiresAt: Date | null = null

      if (user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now) {
        expiresAt = new Date(user.premiumExpiresAt)
      } else if (!user.premiumExpiresAt) {
        // Sem data no usuário — tentar pegar do registro de assinatura recorrente
        if (activeSub?.currentPeriodEndsAt) {
          expiresAt = new Date(activeSub.currentPeriodEndsAt)
        } else if (user.premiumPlanType === 'vitalicio' || !user.premiumPlanType) {
          // Genuinamente vitalício (sem expiração) — usar sentinela apenas para planos lifetime
          expiresAt = new Date(9999, 11, 31)
        }
      }

      if (expiresAt) {
        activeSubscription = {
          type: 'premium',
          planType: user.premiumPlanType,
          expiresAt,
          activatedAt: user.premiumActivatedAt,
          price: user.premiumPrice,
        }
      }
    } else if (user.accountType === 'trial') {
      let expiresAt: Date | null = null

      if (user.trialExpiresAt && new Date(user.trialExpiresAt) > now) {
        expiresAt = new Date(user.trialExpiresAt)
      } else if (!user.trialExpiresAt) {
        expiresAt = new Date(9999, 11, 31)
      }

      if (expiresAt) {
        activeSubscription = {
          type: 'trial',
          planType: user.trialPlanType,
          expiresAt,
          activatedAt: user.trialActivatedAt,
        }
      }
    }

    return NextResponse.json({
      hasActiveSubscription: !!activeSubscription,
      hasRecurringSubscription,
      subscription: activeSubscription,
      accountType: user.accountType,
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status da assinatura' },
      { status: 500 }
    )
  }
}
