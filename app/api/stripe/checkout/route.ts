import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import stripe, { PlanId } from '@/lib/stripe'
import { StripeSettings } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Preços que são one-time (não recorrentes)
const ONE_TIME_PRICES = ['lifetime']

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { planId } = await request.json()

    // Validar planId
    const validPlans = ['monthly', 'quarterly', 'semi-annual', 'annual', 'lifetime']
    if (!planId || !validPlans.includes(planId)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    // Buscar price IDs do banco de dados
    const db = await getDb()
    const settingsCollection = db.collection<StripeSettings>('stripe_settings')
    const settings = await settingsCollection.findOne({})

    if (!settings) {
      return NextResponse.json(
        { error: 'Configurações de Stripe não encontradas' },
        { status: 500 }
      )
    }

    const priceId = settings[planId as keyof StripeSettings] as string
    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json(
        { error: `Price ID para ${planId} não configurado` },
        { status: 500 }
      )
    }

    const isOneTime = ONE_TIME_PRICES.includes(planId)
    const mode = isOneTime ? 'payment' : 'subscription'

    // Criar sessão de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: mode,
      payment_method_types: ['card'],
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
