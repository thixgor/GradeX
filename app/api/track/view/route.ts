import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { logActivityEvent } from '@/lib/tracking/activity-events'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

/**
 * Registro de abertura de conteúdo (fire-and-forget).
 *
 * Chamado pelo client quando uma prova, material, patologia ou seção do
 * Manual Clínico termina de carregar. Responde `{ ok: true }` em qualquer
 * cenário: rastreamento nunca pode virar erro na tela do aluno.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const body = await request.json().catch(() => null)
    if (!body || typeof body.kind !== 'string') {
      return NextResponse.json({ ok: true })
    }

    const db = await getDb()

    // O tipo de conta não está no token — vem do banco só quando há sessão.
    let accountType = 'gratuito'
    if (session?.userId && ObjectId.isValid(session.userId)) {
      const user = await db
        .collection('users')
        .findOne({ _id: new ObjectId(session.userId) }, { projection: { accountType: 1 } })
      accountType = user?.accountType || 'gratuito'
    }

    await logActivityEvent(db, {
      kind: body.kind,
      resourceId: body.resourceId,
      resourceTitle: body.resourceTitle,
      meta: body.meta,
      path: body.path,
      referrer: body.referrer,
      userAgent: request.headers.get('user-agent') || '',
      session: session
        ? {
            userId: session.userId,
            name: session.name,
            email: session.email,
            role: session.role,
            accountType,
          }
        : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
