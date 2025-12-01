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

    // Mapeamento de IDs do Stripe para tipos de plano
    const planMapping: { [key: string]: { type: string; isOneTime: boolean } } = {
      'price_1SZEvMLawSqPVy6JDJk2SNcc': { type: 'monthly', isOneTime: false },
      'price_1SZEvMLawSqPVy6JWHUgauU6': { type: 'quarterly', isOneTime: false },
      'price_1SZEvMLawSqPVy6JzFkSv4OX': { type: 'semi-annual', isOneTime: false },
      'price_1SZEvMLawSqPVy6JxOQ4JNxj': { type: 'annual', isOneTime: false },
      'price_1SZEvMLawSqPVy6Jdbl8CArd': { type: 'lifetime', isOneTime: true },
    }

    // Validar planId
    if (!planId || !planMapping[planId]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const priceId = planId
    const planInfo = planMapping[planId]
    const isOneTime = planInfo.isOneTime
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
        planId: planInfo.type,
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
