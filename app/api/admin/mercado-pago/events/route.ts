import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import type { WebhookEventRecord } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Últimos eventos de webhook recebidos (para diagnóstico no admin). */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 200)

  const db = await getDb()
  const events = await db
    .collection<WebhookEventRecord>('webhook_events')
    .find({ provider: 'mercado_pago' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()

  return NextResponse.json(
    events.map(e => ({
      id: String(e._id),
      eventId: e.eventId,
      topic: e.topic,
      resourceId: e.resourceId,
      signatureValid: e.signatureValid,
      processedAt: e.processedAt,
      processingError: e.processingError,
      attempts: e.attempts,
      createdAt: e.createdAt,
    }))
  )
}
