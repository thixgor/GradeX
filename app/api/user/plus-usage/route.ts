import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getPlusUsageSummary } from '@/lib/plus-guard'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cota de download da própria conta.
 *
 * Serve para a interface avisar antes de o usuário bater no limite — um 429
 * seco no meio de uma semana de prova parece bug, não política.
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const summary = await getPlusUsageSummary(session.userId)
  if (!summary) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  return NextResponse.json(summary)
}
