import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { User } from '@/lib/types'
import { ObjectId } from 'mongodb'
import type { SubscriptionRecord } from '@/lib/types'
import { getAccountTypeLabel, isPaidAccount, normalizeAccountType } from '@/lib/account-tier'

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

    /*
     * Cobre Plus+ e Quest — os dois cargos pagos. Antes disto checava só
     * `isPlusAccount`, e um assinante Quest chegava aqui sem `activeSubscription`
     * nenhuma: a tela de compra (`/buy`) achava que ele não tinha plano e
     * oferecia o grid inteiro de novo, em vez do aviso "você já tem um plano".
     */
    if (isPaidAccount(user.accountType)) {
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
        const cargo = normalizeAccountType(user.accountType)
        activeSubscription = {
          // Cargo canônico ('plus' | 'quest'), não mais um rótulo fixo — o
          // cliente decide como mostrar sem precisar adivinhar qual produto foi
          // comprado.
          type: cargo,
          label: getAccountTypeLabel(cargo),
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
          label: 'Trial',
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
