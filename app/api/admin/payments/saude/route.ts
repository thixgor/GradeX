import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { saudeDosPagamentos } from '@/lib/payments/verificacao'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Webhook, última varredura e pedidos parados — painel de verificação do Analytics. */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const db = await getDb()
  return NextResponse.json(await saudeDosPagamentos(db))
}
