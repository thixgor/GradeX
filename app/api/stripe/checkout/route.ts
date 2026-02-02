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

    const { planId } = await request.json()

    // 1. Buscar configurações gerais do banco de dados
    const db = await getDb()

    // Buscar planos do admin_settings (onde os novos planos são salvos)
    const adminSettings = await db.collection('admin_settings').findOne({})
    const planos = adminSettings?.planos || []

    // Tentar encontrar o plano pelo 'tipo' (id amigável)
    const planoConfig = planos.find((p: any) => p.tipo === planId)

    if (!planoConfig) {
      console.error(`Plano não encontrado no admin_settings: ${planId}`)
      return NextResponse.json({ error: 'Tipo de plano inválido ou não configurado' }, { status: 400 })
    }

    const priceId = planoConfig.stripePriceId

    if (!priceId) {
      return NextResponse.json({ error: `Este plano (${planId}) não possui um ID de Preço do Stripe vinculado.` }, { status: 500 })
    }

    // Determinar se é recorrência ou pagamento único
    // O usuário solicitou que PIX funcionasse para tudo.
    // PIX exige mode: 'payment'.
    // Isso significa que planos "recorrentes" (Mensal, etc) serão cobrados apenas uma vez
    // e o usuário terá que renovar manualmente (comportamento "pre-paid").
    const mode = 'payment'

    // Criar sessão de checkout
    const paymentMethodTypes = ['card', 'boleto', 'pix']

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
