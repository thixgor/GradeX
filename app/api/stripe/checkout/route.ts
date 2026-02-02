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

    // Listar métodos de pagamento desejados
    let paymentMethodTypes = ['card', 'boleto']

    // Pix e PicPay só funcionam em modo 'payment' (pagamento único)
    if (mode === 'payment') {
      paymentMethodTypes.push('pix')
      // Tentativa de adicionar PicPay (Custom Payment Method Type) se fornecido/configurado
      // Nota: Custom Payment Methods geralmente não funcionam com Checkout Session hosted, 
      // mas vamos tentar passar se houver um ID, e o fallback garante que não quebre.
      // paymentMethodTypes.push('cpmt_1SwAEbLawSqPVy6JUWWLqhNB') // ID fornecido pelo user, mas a API de types geralmente rejeita.
      // A Stripe recomenda Payment Element para Custom Methods.
    }

    try {
      // TENTATIVA 1: Criar sessão com todos os métodos desejados (Card, Boleto, Pix...)
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: mode,
        payment_method_types: paymentMethodTypes as any,
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
        // Habilitar Apple Pay / Google Pay automaticamente se 'card' estiver presente
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
      })

      return NextResponse.json({ url: checkoutSession.url })

    } catch (error: any) {
      console.warn('Tentativa 1 de checkout falhou:', error.message)

      // Se o erro for sobre método de pagamento inválido (ex: Pix não ativado), tenta fallback
      // TENTATIVA 2: Apenas Card e Boleto (seguro)
      if (error.type === 'StripeInvalidRequestError' && mode === 'payment') {
        console.log('Tentando fallback para Card e Boleto...')
        try {
          const fallbackSession = await stripe.checkout.sessions.create({
            mode: mode,
            payment_method_types: ['card', 'boleto'],
            line_items: [
              { price: priceId, quantity: 1 }
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/buy?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/buy?canceled=true`,
            customer_email: session.email,
            metadata: {
              userId: session.userId,
              planId: planId,
              priceId: priceId,
            }
          })
          return NextResponse.json({ url: fallbackSession.url })
        } catch (fallbackError: any) {
          console.warn('Tentativa 2 (Fallback) falhou:', fallbackError.message)

          // TENTATIVA 3: Apenas Cartão (Último recurso)
          console.log('Tentando fallback final apenas para Card...')
          const finalSession = await stripe.checkout.sessions.create({
            mode: mode,
            payment_method_types: ['card'],
            line_items: [
              { price: priceId, quantity: 1 }
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/buy?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/buy?canceled=true`,
            customer_email: session.email,
            metadata: {
              userId: session.userId,
              planId: planId,
              priceId: priceId,
            }
          })
          return NextResponse.json({ url: finalSession.url })
        }
      }

      // Se não for erro de método de pagamento ou se falhou tudo, relança
      throw error
    }

  } catch (error: any) {
    console.error('Stripe checkout error (Fatal):', error)

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: `Erro na configuração do Stripe: ${error.message}. Verifique se o método de pagamento está ativado no Dashboard.` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar sessão de pagamento' },
      { status: 500 }
    )
  }
}
