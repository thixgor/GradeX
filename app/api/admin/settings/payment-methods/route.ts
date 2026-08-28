import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { DEFAULT_PAYMENT_METHODS, type PaymentMethodsConfig } from '@/lib/payment-methods'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Schema = z.object({
  pix: z.boolean(),
  credit_card: z.boolean(),
  boleto: z.boolean(),
  subscriptions: z.boolean(),
  // Opcional no corpo para não quebrar um painel antigo em cache, que ainda
  // manda só os quatro métodos: sem o campo, o default (exigir) prevalece.
  requireCpfForPix: z.boolean().optional(),
})

export async function GET() {
  const db = await getDb()
  const settings = await db.collection('admin_settings').findOne({})
  const methods: PaymentMethodsConfig = {
    ...DEFAULT_PAYMENT_METHODS,
    ...(settings?.paymentMethods || {}),
  }
  return NextResponse.json(methods)
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 })
  }

  const methods: PaymentMethodsConfig = { ...DEFAULT_PAYMENT_METHODS, ...parsed.data }

  const db = await getDb()
  await db.collection('admin_settings').updateOne(
    {},
    { $set: { paymentMethods: methods } },
    { upsert: true }
  )

  return NextResponse.json({ ok: true, paymentMethods: methods })
}
