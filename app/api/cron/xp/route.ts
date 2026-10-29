import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { isCronAuthorized } from '@/lib/cron-auth'
import { varrerXp } from '@/lib/xp/varredura'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Varredura do XP de hora em hora (ver `lib/xp/varredura.ts`): calcula quem
 * tem histórico e ainda não tem XP, e refaz os retratos com mais de 6 h. Para
 * em 45 s; o próximo disparo — ou a próxima pessoa que abrir o ranking —
 * continua de onde parou.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = await getDb()
  const resultado = await varrerXp(db, { orcamentoMs: 45_000 })
  return NextResponse.json({ ok: true, ...resultado })
}
