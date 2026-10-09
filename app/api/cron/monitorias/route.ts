import { NextRequest, NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { varrer } from '@/lib/monitorias/varredura'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Varredura horária das monitorias — ver lib/monitorias/varredura.ts. */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const relatorio = await varrer()
  return NextResponse.json({ ok: true, ...relatorio })
}
