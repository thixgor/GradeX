import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { isCronAuthorized } from '@/lib/cron-auth'
import { varrerXp } from '@/lib/xp/varredura'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Varredura do XP, uma vez por dia às 4h23 de Brasília (ver
 * `lib/xp/varredura.ts`): calcula quem tem histórico e ainda não tem XP, e
 * refaz os retratos com mais de 24 h. Para em 45 s — o teto de custo é esse,
 * 45 s de função por dia. O retroativo inicial não espera por ela: abrir o
 * ranking já dispara a varredura enquanto houver gente sem XP calculado.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = await getDb()
  const resultado = await varrerXp(db, { orcamentoMs: 45_000 })
  return NextResponse.json({ ok: true, ...resultado })
}
