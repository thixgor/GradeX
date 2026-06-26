import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { serializeRaffle, getEffectiveStatus, decodeHtmlEntities } from '@/lib/raffles'
import type { Raffle } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Listagem pública de rifas. Retorna apenas rifas com visibilidade `public`
 * e que não estejam em rascunho. Inclui o total de vendidos (cache) para
 * exibir o progresso sem custo de varredura por número.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'raffles_list', 60, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')?.trim()

  const db = await getDb()
  const query: Record<string, any> = {
    visibility: 'public',
    status: { $ne: 'draft' },
  }
  if (category) query.prizeCategory = category

  const raffles = await db
    .collection<Raffle>('raffles')
    .find(query, {
      projection: {
        // não precisamos de winners completos na listagem
        rules: 0,
      },
    })
    .sort({ createdAt: -1 })
    .limit(120)
    .toArray()

  const data = raffles.map(r => serializeRaffle(r))

  // Categorias distintas para filtros
  const categories = Array.from(
    new Set(raffles.map(r => decodeHtmlEntities(r.prizeCategory || '')).filter(Boolean)),
  )

  return NextResponse.json({ raffles: data, categories })
}
