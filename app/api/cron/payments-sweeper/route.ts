import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { reconciliarPagamentosPendentes } from '@/lib/payments/sweep'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron de reconciliação de pagamentos únicos (Pix, cartão, boleto, doações,
 * rifas, materiais, etc.) — ponta externa.
 *
 * A lógica mora em `lib/payments/sweep.ts` porque roda de dois lugares: aqui
 * (para bater na rota de fora — manual, ou um agendador externo) e "de
 * carona" dentro de `/api/cron/subscriptions-sweeper`, que já é um Vercel
 * Cron agendado. É essa segunda chamada que garante a reconciliação sem
 * exigir nenhum agendador extra — ver o comentário em `sweep.ts`.
 *
 * Autenticação: header `x-vercel-cron` (Vercel Cron) ou
 * `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const stats = await reconciliarPagamentosPendentes(db)

  return NextResponse.json({ ok: true, ...stats })
}

function isAuthorized(request: NextRequest): boolean {
  // Vercel Cron envia header `x-vercel-cron`. Em outros ambientes, validamos o bearer.
  if (request.headers.get('x-vercel-cron')) return true
  const auth = request.headers.get('authorization') || ''
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`
  return !!process.env.CRON_SECRET && auth === expected
}
