import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import stripe from '@/lib/stripe'
import { ObjectId } from 'mongodb'
import { User, AccountType } from '@/lib/types'
import { getPersonalExamsQuota } from '@/lib/tier-limits'

export const dynamic = 'force-dynamic'

// Mapeamento de duração de planos em milissegundos
const PLAN_DURATIONS: Record<string, number | null> = {
  monthly: 2 * 60 * 1000, // 2 minutos para teste
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

    // Processar evento de checkout completado
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any

      const userId = session.metadata?.userId
      const planId = session.metadata?.planId

      if (!userId || !planId) {
        console.error('Missing userId or planId in metadata')
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      // Atualizar usuário no banco de dados
      const db = await getDb()
      const usersCollection = db.collection<User>('users')

      const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Calcular data de expiração
      const now = new Date()
      let expiresAt: Date | undefined
      if (PLAN_DURATIONS[planId] !== null) {
        expiresAt = new Date(now.getTime() + (PLAN_DURATIONS[planId] || 0))
      }

      // Atualizar usuário
      const updateData: Partial<User> = {
        accountType: 'premium' as AccountType,
        premiumPlanType: planId as any,
        premiumActivatedAt: now,
        premiumExpiresAt: expiresAt,
        dailyPersonalExamsCreated: 0,
        dailyPersonalExamsRemaining: getPersonalExamsQuota('premium'),
        lastDailyReset: now
      }

      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      )

      return NextResponse.json({ success: true })
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
