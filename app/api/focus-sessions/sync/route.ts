import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface FocusSessionPayload {
  id: string
  objective: string
  startedAt: string
  finishedAt: string
  totalTimeMs: number
}

// POST - Sync focus sessions (batch upsert)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const sessions: FocusSessionPayload[] = body.sessions

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: 'Nenhuma sessao para sincronizar' }, { status: 400 })
    }

    // Limit batch size
    if (sessions.length > 50) {
      return NextResponse.json({ error: 'Limite de 50 sessoes por sync' }, { status: 400 })
    }

    const db = await getDb()
    const collection = db.collection('focus-sessions')

    // Ensure index exists
    await collection.createIndex({ userId: 1, sessionId: 1 }, { unique: true, background: true })
    await collection.createIndex({ userId: 1, startedAt: -1 }, { background: true })

    // Batch upsert
    const ops = sessions
      .filter(s => s && typeof s === 'object' && s.id && typeof s.id === 'string')
      .map(s => {
        const startedAt = new Date(s.startedAt)
        const finishedAt = new Date(s.finishedAt)

        // Basic date validation
        const validStartedAt = isNaN(startedAt.getTime()) ? new Date() : startedAt
        const validFinishedAt = isNaN(finishedAt.getTime()) ? new Date() : finishedAt

        return {
          updateOne: {
            filter: { userId: session.userId, sessionId: s.id.slice(0, 50) },
            update: {
              $set: {
                userId: session.userId,
                sessionId: s.id.slice(0, 50),
                objective: String(s.objective || '').slice(0, 200),
                startedAt: validStartedAt,
                finishedAt: validFinishedAt,
                totalTimeMs: Math.min(Math.max(0, Number(s.totalTimeMs) || 0), 86400000), // Max 24h
                syncedAt: new Date(),
              },
            },
            upsert: true,
          },
        }
      })

    if (ops.length === 0) {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    }

    await collection.bulkWrite(ops)

    return NextResponse.json({ synced: sessions.length })
  } catch (error) {
    console.error('Focus sessions sync error:', error)
    return NextResponse.json(
      { error: 'Erro ao sincronizar sessoes' },
      { status: 500 }
    )
  }
}

// GET - Fetch user's focus sessions from server
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const collection = db.collection('focus-sessions')

    const focusSessions = await collection
      .find({ userId: session.userId })
      .sort({ startedAt: -1 })
      .limit(100)
      .toArray()

    const headers = new Headers({
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      'Content-Type': 'application/json',
    })

    return NextResponse.json({ sessions: focusSessions }, { headers })
  } catch (error) {
    console.error('Focus sessions fetch error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar sessoes' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a focus session
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId e obrigatorio' }, { status: 400 })
    }

    const db = await getDb()
    const collection = db.collection('focus-sessions')

    await collection.deleteOne({ userId: session.userId, sessionId })

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Focus session delete error:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir sessao' },
      { status: 500 }
    )
  }
}
