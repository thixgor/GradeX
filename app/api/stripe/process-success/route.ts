import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import stripe from '@/lib/stripe'
import { User, AccountType } from '@/lib/types'
import { getPersonalExamsQuota } from '@/lib/tier-limits'
import { sendPremiumActivationEmail } from '@/lib/email-service'
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
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID é obrigatório' }, { status: 400 })
    }

    // Buscar sessão do Stripe
    console.log('Buscando sessão do Stripe:', sessionId)
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (!checkoutSession) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    // Verificar se o pagamento foi completado
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Pagamento não foi completado' }, { status: 400 })
    }

    const planId = checkoutSession.metadata?.planId
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID não encontrado' }, { status: 400 })
    }

    console.log('Processando pagamento bem-sucedido para usuário:', session.userId, 'Plano:', planId)

    // Atualizar usuário no banco de dados
    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    console.log('Buscando usuário com ID:', session.userId)
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Calcular data de expiração
    const now = new Date()
    let expiresAt: Date | undefined
    if (PLAN_DURATIONS[planId] !== null) {
      expiresAt = new Date(now.getTime() + (PLAN_DURATIONS[planId] || 0))
    }

    console.log('Atualizando usuário com plano:', planId, 'Expira em:', expiresAt)

    // Atualizar usuário
    const updateData: Partial<User> = {
      accountType: 'premium' as AccountType,
      premiumPlanType: planId as any,
      premiumActivatedAt: now,
      premiumExpiresAt: expiresAt,
      stripeSubscriptionId: checkoutSession.subscription as string,
      stripeCustomerId: checkoutSession.customer as string,
      dailyPersonalExamsCreated: 0,
      dailyPersonalExamsRemaining: getPersonalExamsQuota('premium'),
      lastDailyReset: now
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(session.userId) },
      { $set: updateData }
    )

    console.log('Resultado da atualização:', result)
    console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount)

    // Enviar email de confirmação
    try {
      console.log('Enviando email para:', user.email)
      await sendPremiumActivationEmail(
        user.email,
        user.name,
        PLAN_NAMES[planId],
        expiresAt
      )
      console.log('Email enviado com sucesso')
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError)
      // Não falhar a requisição por erro de email
    }

    return NextResponse.json({
      success: true,
      message: 'Plano Premium ativado com sucesso',
      plan: PLAN_NAMES[planId],
      expiresAt
    })
  } catch (error) {
    console.error('Erro ao processar sucesso de pagamento:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}
