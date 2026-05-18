import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getPublicMetricSettings,
  savePublicMetricSettings,
} from '@/lib/display-settings-server'

// GET é público e idêntico para todos os visitantes — vale CDN cache.
// PUT (admin only) usa NO_STORE_HEADERS abaixo.
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
} as const

// Configurações de exibição mudam raramente (admin altera flags como
// "exibir downloads"). Cache shared 5min na Edge + SWR 30min reduz
// drasticamente invocations sem prejudicar consistência.
const PUBLIC_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=1800',
} as const

export async function GET() {
  try {
    const db = await getDb()
    const settings = await getPublicMetricSettings(db)
    return NextResponse.json({ settings }, { headers: PUBLIC_CACHE_HEADERS })
  } catch (error) {
    console.error('GET /api/display-settings error:', error)
    return NextResponse.json(
      { error: 'Erro ao obter configurações de exibição' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
    }

    const body = await request.json()
    const db = await getDb()
    const settings = await savePublicMetricSettings(db, body.settings ?? body)

    return NextResponse.json({ success: true, settings }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error('PUT /api/display-settings error:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configurações de exibição' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
