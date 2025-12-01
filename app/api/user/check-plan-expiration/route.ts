import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { User } from '@/lib/types'
import { getPersonalExamsQuota } from '@/lib/tier-limits'
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
    let updated = false
    let updateData: Partial<User> = {}

    // Verificar expiração de Premium
    if (user.accountType === 'premium' && user.premiumExpiresAt) {
      if (new Date(user.premiumExpiresAt) <= now) {
        // Premium expirou, reverter para Gratuito
        const gratuitoQuota = getPersonalExamsQuota('gratuito')
        updateData = {
          accountType: 'gratuito',
          premiumExpiresAt: undefined,
          premiumPlanType: undefined,
          premiumActivatedAt: undefined,
          premiumPrice: undefined,
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: gratuitoQuota,
          lastDailyReset: new Date()
        }
        updated = true
      }
    }

    // Verificar expiração de Trial
    if (user.accountType === 'trial' && user.trialExpiresAt) {
      if (new Date(user.trialExpiresAt) <= now) {
        // Trial expirou, reverter para Gratuito
        const gratuitoQuota = getPersonalExamsQuota('gratuito')
        updateData = {
          accountType: 'gratuito',
          trialExpiresAt: undefined,
          trialPlanType: undefined,
          trialActivatedAt: undefined,
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: gratuitoQuota,
          lastDailyReset: new Date()
        }
        updated = true
      }
    }

    // Atualizar banco de dados se necessário
    if (updated) {
      await usersCollection.updateOne(
        { _id: new ObjectId(session.userId) },
        { $set: updateData }
      )
    }

    return NextResponse.json({
      success: true,
      planExpired: updated,
      newAccountType: updated ? updateData.accountType : user.accountType
    })
  } catch (error) {
    console.error('Check plan expiration error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar expiração de plano' },
      { status: 500 }
    )
  }
}
