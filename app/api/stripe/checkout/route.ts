import { NextRequest, NextResponse } from 'next/server'

// Stripe foi removido. Endpoint mantido temporariamente para detectar tráfego residual.
// Remover após 2026-08-09 (90 dias).
export async function POST(request: NextRequest) {
  console.warn('[stripe-stub] chamada obsoleta para /api/stripe/checkout', {
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent'),
  })
  return NextResponse.json(
    { error: 'Stripe foi removido. Use /api/payments/orders.' },
    { status: 410 }
  )
}
