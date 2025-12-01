import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import stripe from '@/lib/stripe'
import { User, AccountType } from '@/lib/types'
import { getPersonalExamsQuota } from '@/lib/tier-limits'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// Mapeamento de duração de planos em milissegundos
const PLAN_DURATIONS: Record<string, number | null> = {
  monthly: 30 * 24 * 60 * 60 * 1000, // 1 mês
  quarterly: 3 * 30 * 24 * 60 * 60 * 1000, // 3 meses
  'semi-annual': 6 * 30 * 24 * 60 * 60 * 1000, // 6 meses
  annual: 365 * 24 * 60 * 60 * 1000, // 1 ano
  lifetime: null // null = sem expiração
}

// Mapeamento de nomes de planos em português
const PLAN_NAMES: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  'semi-annual': 'Semestral',
  annual: 'Anual',
  lifetime: 'Vitalício'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json({ error: 'Sem assinatura' }, { status: 400 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    // Processar renovação de assinatura
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any
      console.log('Assinatura atualizada:', subscription.id)

      // Buscar usuário por subscription ID
      const user = await usersCollection.findOne({ stripeSubscriptionId: subscription.id })
      if (!user) {
        console.log('Usuário não encontrado para subscription:', subscription.id)
        return NextResponse.json({ success: true })
      }

      // Se a assinatura foi renovada (status = active)
      if (subscription.status === 'active') {
        const planId = user.premiumPlanType
        if (planId && PLAN_DURATIONS[planId] !== undefined) {
          const now = new Date()
          let expiresAt: Date | undefined
          if (PLAN_DURATIONS[planId] !== null) {
            expiresAt = new Date(now.getTime() + (PLAN_DURATIONS[planId] || 0))
          }

          console.log('Renovando assinatura do usuário:', user._id, 'Novo vencimento:', expiresAt)

          await usersCollection.updateOne(
            { _id: user._id },
            {
              $set: {
                premiumActivatedAt: now,
                premiumExpiresAt: expiresAt,
                dailyPersonalExamsCreated: 0,
                dailyPersonalExamsRemaining: getPersonalExamsQuota('premium'),
                lastDailyReset: now
              }
            }
          )
        }
      }
    }

    // Processar cancelamento de assinatura
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any
      console.log('Assinatura cancelada:', subscription.id)

      // Buscar usuário por subscription ID
      const user = await usersCollection.findOne({ stripeSubscriptionId: subscription.id })
      if (!user) {
        console.log('Usuário não encontrado para subscription:', subscription.id)
        return NextResponse.json({ success: true })
      }

      console.log('Cancelando assinatura do usuário:', user._id)

      // Atualizar usuário para Gratuito
      const now = new Date()
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            accountType: 'gratuito' as AccountType,
            premiumPlanType: undefined,
            premiumActivatedAt: undefined,
            premiumExpiresAt: undefined,
            stripeSubscriptionId: undefined,
            dailyPersonalExamsCreated: 0,
            dailyPersonalExamsRemaining: getPersonalExamsQuota('gratuito'),
            lastDailyReset: now
          }
        }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
