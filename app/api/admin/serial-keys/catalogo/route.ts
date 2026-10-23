import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { catalogoDeEmissao } from '@/lib/serial-key-emissao'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Produtos que o formulário de emissão de serial keys oferece. */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const db = await getDb()
  return jsonComprimido(request, await catalogoDeEmissao(db))
}
