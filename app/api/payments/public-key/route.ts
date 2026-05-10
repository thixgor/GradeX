import { NextResponse } from 'next/server'
import { getPaymentConfig } from '@/lib/payments'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Expõe apenas a Public Key (não-sensível) para o frontend. */
export async function GET() {
  try {
    const cfg = getPaymentConfig()
    return NextResponse.json({ publicKey: cfg.mp.publicKey, env: cfg.mp.env })
  } catch (err: any) {
    return NextResponse.json({ publicKey: '', error: err?.message }, { status: 500 })
  }
}
