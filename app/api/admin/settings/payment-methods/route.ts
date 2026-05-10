import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Schema = z.object({
  pix: z.boolean(),
  credit_card: z.boolean(),
  boleto: z.boolean(),
  subscriptions: z.boolean(),
})

export type PaymentMethodsConfig = z.infer<typeof Schema>

export const DEFAULT_PAYMENT_METHODS: PaymentMethodsConfig = {
  pix: true,
  credit_card: true,
  boleto: true,
  subscriptions: true,
}

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

  const db = await getDb()
  await db.collection('admin_settings').updateOne(
    {},
    { $set: { paymentMethods: parsed.data } },
    { upsert: true }
  )

  return NextResponse.json({ ok: true, paymentMethods: parsed.data })
}
