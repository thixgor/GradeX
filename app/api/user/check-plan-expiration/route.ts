import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { User } from '@/lib/types'
import { getPersonalExamsQuota } from '@/lib/tier-limits'
import { ObjectId } from 'mongodb'
import { contaEhPaga } from '@/lib/cargos-server'
import { revokePlusClaims } from '@/lib/plus-claims'

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
    let plusExpired = false
    let updateData: Partial<User> = {}

    // Verificar expiração do cargo pago. Vale para qualquer cargo marcado como
    // pago no registro — todos usam `premiumExpiresAt` como prazo.
    const cargoEhPago = await contaEhPaga(user.accountType, db)
    if (cargoEhPago && user.premiumExpiresAt) {
      if (new Date(user.premiumExpiresAt) <= now) {
        // Plano expirou, reverter para Gratuito
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
        plusExpired = true
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

    // Plus+ vencido: suspende os materiais resgatados pela assinatura. Ficam
    // guardados e voltam na renovação; compra avulsa continua intacta.
    if (plusExpired) {
      await revokePlusClaims(session.userId, 'plan_expired', db).catch(err =>
        console.error('[check-plan-expiration] revogar resgates Plus+ falhou:', err)
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
