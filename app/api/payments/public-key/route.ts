import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentConfig } from '@/lib/payments'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Expõe apenas a Public Key (não-sensível) para o frontend. */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'payments_public_key', 30, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })
  }

  try {
    const cfg = getPaymentConfig()
    return NextResponse.json(
      { publicKey: cfg.mp.publicKey, env: cfg.mp.env },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } }
    )
  } catch (err: any) {
    return NextResponse.json({ publicKey: '', error: err?.message }, { status: 500 })
  }
}
