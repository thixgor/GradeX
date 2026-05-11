import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { getRequestAnalyticsMeta, recordCheckoutEvent } from '@/lib/analytics'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Schema = z.object({
  event: z.enum([
    'buy_click',
    'checkout_view',
    'checkout_submit',
    'order_created',
    'payment_approved',
    'payment_failed',
    'subscription_created',
    'subscription_cancelled',
    'subscription_expired',
  ]),
  productId: z.string().optional(),
  productTitle: z.string().optional(),
  productType: z.enum(['material', 'flashcard', 'package', 'subscription', 'plan', 'donation', 'unknown']).default('unknown'),
  amount: z.number().optional(),
  orderId: z.string().optional(),
  providerPaymentId: z.string().optional(),
  providerSubscriptionId: z.string().optional(),
  paymentMethod: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'checkout_event', 120, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const session = await getSession()
  const data = parsed.data

  await recordCheckoutEvent({
    ...data,
    userId: session?.userId,
    userName: session?.name,
    userEmail: session?.email,
    ...getRequestAnalyticsMeta(request),
  })

  return NextResponse.json({ ok: true })
}
