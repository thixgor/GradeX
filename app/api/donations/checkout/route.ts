import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Endpoint de conveniência para doações: delega para /api/payments/orders
 * com type=donation. Aceita usuário anônimo (sem login).
 *
 * Mantemos um wrapper para manter a doação isolada do endpoint de plano/material
 * em termos de rate-limit e contrato público.
 */
const Schema = z.object({
  amount: z.number().positive().min(1).max(10000),
  paymentMethodId: z.string().min(1),
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  issuer: z.string().optional(),
  payerDocumentType: z.enum(['CPF', 'CNPJ']).optional(),
  payerDocumentNumber: z.string().optional(),
  donationName: z.string().min(1).max(120),
  donationAlias: z.string().min(1).max(60),
  donationMessage: z.string().max(500).optional(),
  donationEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'donations_checkout', 10, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 })
  }

  // Encaminha para o endpoint principal
  const forward = await fetch(`${request.nextUrl.origin}/api/payments/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Encaminha cookies para preservar sessão (caso usuário esteja logado)
      cookie: request.headers.get('cookie') || '',
    },
    body: JSON.stringify({
      type: 'donation',
      refId: 'donation',
      paymentMethodId: parsed.data.paymentMethodId,
      cardToken: parsed.data.cardToken,
      installments: parsed.data.installments,
      issuer: parsed.data.issuer,
      payerDocumentType: parsed.data.payerDocumentType,
      payerDocumentNumber: parsed.data.payerDocumentNumber,
      donationAmount: parsed.data.amount,
      donationName: parsed.data.donationName,
      donationAlias: parsed.data.donationAlias,
      donationMessage: parsed.data.donationMessage,
      donationEmail: parsed.data.donationEmail,
    }),
  })

  const data = await forward.json()
  return NextResponse.json(data, { status: forward.status })
}
