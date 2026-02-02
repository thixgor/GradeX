import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import stripe, { PlanId } from '@/lib/stripe'
import { StripeSettings } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { planId, mode: requestedMode } = await request.json()

    // 1. Buscar configurações gerais do banco de dados
    const db = await getDb()

    // Buscar planos do admin_settings
    const adminSettings = await db.collection('admin_settings').findOne({})
    const planos = adminSettings?.planos || []

    const planoConfig = planos.find((p: any) => p.tipo === planId)

    if (!planoConfig) {
      console.error(`Plano não encontrado no admin_settings: ${planId}`)
      return NextResponse.json({ error: 'Tipo de plano inválido ou não configurado' }, { status: 400 })
    }

    // Priorizar o modo solicitado pelo front-end
    let mode = requestedMode || (planoConfig.durationMonths === 0 ? 'payment' : 'subscription')

    // Decidir qual Price ID usar
    let priceId = mode === 'payment' ? planoConfig.stripeOneTimePriceId : planoConfig.stripePriceId

    // Fallback: Se solicitou payment mas não tem o ID de payment, tenta o subscription (e vice-versa)
    if (!priceId) {
      priceId = planoConfig.stripePriceId || planoConfig.stripeOneTimePriceId
      // Se trocou o ID, ajusta o modo para ser compatível com o ID que sobrou
      if (priceId === planoConfig.stripeOneTimePriceId) mode = 'payment'
      if (priceId === planoConfig.stripePriceId) mode = 'subscription'
    }

    if (!priceId) {
      return NextResponse.json({ error: `Este plano (${planId}) não possui IDs de Preço configurados no Stripe.` }, { status: 500 })
    }

    // Criar sessão de checkout
    const paymentMethodTypes = ['card', 'boleto']

    // Pix só funciona em modo 'payment' (pagamento único)
    // Para assinaturas (subscription), só card e boleto são suportados nativamente com facilidade
    if (mode === 'payment') {
      paymentMethodTypes.push('pix')
    }

    // @ts-ignore - Stripe SDK type issue
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: mode,
      payment_method_types: paymentMethodTypes,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/buy?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/buy?canceled=true`,
      customer_email: session.email,
      metadata: {
        userId: session.userId,
        planId: planId,
        priceId: priceId,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)

    // Log detalhado do erro
    if (error.type === 'StripeInvalidRequestError') {
      console.error('Stripe API Error:', error.message)
      return NextResponse.json(
        { error: `Erro Stripe: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar sessão de pagamento' },
      { status: 500 }
    )
  }
}
