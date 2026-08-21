import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { applyAttemptPing, ATTEMPT_EVENTS, type AttemptEvent } from '@/lib/tracking/exam-attempts'

export const dynamic = 'force-dynamic'

/**
 * Ciclo de vida de uma tentativa de prova.
 *
 * Recebe `open` / `start` / `heartbeat` / `leave` / `submit` do aluno e
 * mantém um documento por tentativa em `exam_attempts`. É o que alimenta o
 * "quem está fazendo prova agora" e o "quem saiu no meio" do painel.
 *
 * Aceita também `sendBeacon`, que envia `Content-Type: application/json` a
 * partir de um Blob — daí o parse tolerante do corpo.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ ok: true })

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ ok: true })

    const attemptId = typeof body.attemptId === 'string' ? body.attemptId.slice(0, 64) : ''
    const examId = typeof body.examId === 'string' ? body.examId.slice(0, 64) : ''
    const event = body.event as AttemptEvent

    if (!attemptId || !examId || !ATTEMPT_EVENTS.includes(event)) {
      return NextResponse.json({ ok: true })
    }

    const db = await getDb()

    let accountType = 'gratuito'
    if (ObjectId.isValid(session.userId)) {
      const user = await db
        .collection('users')
        .findOne({ _id: new ObjectId(session.userId) }, { projection: { accountType: 1 } })
      accountType = user?.accountType || 'gratuito'
    }

    await applyAttemptPing(
      db,
      {
        attemptId,
        examId,
        event,
        examTitle: typeof body.examTitle === 'string' ? body.examTitle : undefined,
        totalQuestions: body.totalQuestions,
        answeredCount: body.answeredCount,
        currentQuestion: body.currentQuestion,
        submissionId: typeof body.submissionId === 'string' ? body.submissionId : undefined,
        score: typeof body.score === 'number' ? body.score : undefined,
      },
      {
        userId: session.userId,
        name: session.name,
        email: session.email,
        accountType,
      },
      request.headers.get('user-agent') || ''
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[track/exam-attempt] falha ao registrar tentativa:', error)
    return NextResponse.json({ ok: true })
  }
}
