import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { reconciliarPagamentosPendentes } from '@/lib/payments/sweep'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * "Verificar todos os pendentes agora": a mesma varredura do cron
 * (lib/payments/sweep.ts), disparada pelo admin sem esperar o agendamento.
 * Prazo curto (45 s) para responder dentro dos 60 s da função; o que sobrar
 * fica para o próximo clique ou o próximo cron.
 */
export async function POST() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const db = await getDb()
  const stats = await reconciliarPagamentosPendentes(db, {
    limite: 150,
    prazo: Date.now() + 45_000,
    origem: 'admin',
  })
  return NextResponse.json({ ok: true, ...stats })
}
