import { NextRequest, NextResponse } from 'next/server'

// Stripe foi removido. Mantido para detectar tráfego residual. Remover após 2026-08-09.
export async function POST(request: NextRequest) {
  console.warn('[stripe-stub] chamada obsoleta para /api/stripe/webhook-subscription')
  return NextResponse.json({ error: 'Stripe removido.' }, { status: 410 })
}
