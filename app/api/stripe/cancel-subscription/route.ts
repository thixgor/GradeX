import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import stripe from '@/lib/stripe'
import { User } from '@/lib/types'
import { getPersonalExamsQuota } from '@/lib/tier-limits'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    // Buscar usuário
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se tem assinatura ativa
    if (!user.stripeSubscriptionId) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa' }, { status: 400 })
    }

    console.log('Cancelando assinatura do Stripe:', user.stripeSubscriptionId)

    // Cancelar assinatura no Stripe
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId)
      console.log('Assinatura cancelada no Stripe')
    } catch (stripeError: any) {
      console.error('Erro ao cancelar assinatura no Stripe:', stripeError)
      // Continuar mesmo se falhar no Stripe
    }

    // Atualizar usuário para Gratuito
    const now = new Date()
    const updateData: Partial<User> = {
      accountType: 'gratuito',
      premiumPlanType: undefined,
      premiumActivatedAt: undefined,
      premiumExpiresAt: undefined,
      stripeSubscriptionId: undefined,
      stripeCustomerId: undefined,
      dailyPersonalExamsCreated: 0,
      dailyPersonalExamsRemaining: getPersonalExamsQuota('gratuito'),
      lastDailyReset: now
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(session.userId) },
      { $set: updateData }
    )

    console.log('Usuário atualizado para Gratuito:', result.modifiedCount)

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
      accountType: 'gratuito'
    })
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao cancelar assinatura' },
      { status: 500 }
    )
  }
}
