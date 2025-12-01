import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { User } from '@/lib/types'
import { ObjectId } from 'mongodb'

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

    const now = new Date()
    let activeSubscription = null

    // Verificar se tem assinatura ativa
    if (user.accountType === 'premium') {
      // Se tem premiumExpiresAt, verificar se ainda está válido
      if (user.premiumExpiresAt) {
        if (new Date(user.premiumExpiresAt) > now) {
          activeSubscription = {
            type: 'premium',
            planType: user.premiumPlanType,
            expiresAt: user.premiumExpiresAt,
            activatedAt: user.premiumActivatedAt,
            price: user.premiumPrice
          }
        }
      } else {
        // Se não tem data de expiração, considerar como ativo (vitalício ou sem data definida)
        activeSubscription = {
          type: 'premium',
          planType: user.premiumPlanType || 'mensal',
          expiresAt: new Date(9999, 11, 31), // Data muito distante para "vitalício"
          activatedAt: user.premiumActivatedAt,
          price: user.premiumPrice
        }
      }
    } else if (user.accountType === 'trial') {
      // Se tem trialExpiresAt, verificar se ainda está válido
      if (user.trialExpiresAt) {
        if (new Date(user.trialExpiresAt) > now) {
          activeSubscription = {
            type: 'trial',
            planType: user.trialPlanType,
            expiresAt: user.trialExpiresAt,
            activatedAt: user.trialActivatedAt
          }
        }
      } else {
        // Se não tem data de expiração, considerar como ativo
        activeSubscription = {
          type: 'trial',
          planType: user.trialPlanType || '7dias',
          expiresAt: new Date(9999, 11, 31),
          activatedAt: user.trialActivatedAt
        }
      }
    }

    return NextResponse.json({
      hasActiveSubscription: !!activeSubscription,
      subscription: activeSubscription,
      accountType: user.accountType
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status da assinatura' },
      { status: 500 }
    )
  }
}
