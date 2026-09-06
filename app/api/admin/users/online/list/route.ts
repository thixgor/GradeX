import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { presenceWindowMs, readOnlineDevices } from '@/lib/presence/server'
import {
  ATTEMPT_STATUS_LABELS,
  EXAM_ATTEMPTS_COLLECTION,
  LIVE_THRESHOLD_MS,
  deriveAttemptStatus,
  type ExamAttempt,
} from '@/lib/tracking/exam-attempts'

export const dynamic = 'force-dynamic'

/** Teto de linhas do diálogo. Passou disso, a tela de Tempo Real dá conta. */
const MAX_ROWS = 200

/**
 * Quem está no site agora, com nome e com o que está fazendo.
 *
 * Só roda quando o admin ABRE o diálogo — a faixa do topo se vira com a
 * rota de contagem. Junta três coisas: os aparelhos vivos (`sessions`),
 * quem é cada um (`users`, por `_id`) e quem está no meio de uma prova
 * (`exam_attempts`).
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const now = Date.now()
    const windowMs = presenceWindowMs()

    const snapshot = await readOnlineDevices(db, { windowMs, now })
    if (snapshot.userIds.length === 0) {
      return NextResponse.json({
        users: [],
        windowMinutes: Math.round(windowMs / 60000),
        generatedAt: new Date(now).toISOString(),
      })
    }

    const objectIds = snapshot.userIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id))

    const [rows, attempts] = await Promise.all([
      db
        .collection('users')
        .find(
          { _id: { $in: objectIds }, banned: { $ne: true } },
          { projection: { name: 1, email: 1, accountType: 1, role: 1, lastLoginAt: 1 } },
        )
        .toArray(),
      db
        .collection<ExamAttempt>(EXAM_ATTEMPTS_COLLECTION)
        .find(
          {
            userId: { $in: snapshot.userIds },
            status: { $in: ['opened', 'in_progress'] },
            lastSeenAt: { $gte: new Date(now - LIVE_THRESHOLD_MS) },
          },
          {
            projection: {
              userId: 1,
              examTitle: 1,
              status: 1,
              startedAt: 1,
              lastSeenAt: 1,
              answeredCount: 1,
              totalQuestions: 1,
              currentQuestion: 1,
            },
          },
        )
        .toArray(),
    ])

    // A prova mais recente de cada pessoa — quem abriu duas abas aparece uma vez.
    const attemptByUser = new Map<string, ExamAttempt>()
    for (const attempt of attempts) {
      const current = attemptByUser.get(attempt.userId)
      const at = attempt.lastSeenAt ? new Date(attempt.lastSeenAt).getTime() : 0
      const currentAt = current?.lastSeenAt ? new Date(current.lastSeenAt).getTime() : -1
      if (!current || at > currentAt) attemptByUser.set(attempt.userId, attempt)
    }

    const users = rows
      .map((row) => {
        const id = row._id.toString()
        const presence = snapshot.byUser.get(id)
        const attempt = attemptByUser.get(id)
        const lastActiveAt = presence?.lastActiveAt ?? 0

        return {
          id,
          name: row.name || 'Sem nome',
          email: row.email || '',
          accountType: row.accountType || 'gratuito',
          admin: row.role === 'admin',
          devices: presence?.devices ?? 1,
          deviceName: presence?.deviceName || 'Dispositivo desconhecido',
          lastActiveAt: lastActiveAt ? new Date(lastActiveAt).toISOString() : undefined,
          idleSeconds: lastActiveAt ? Math.round((now - lastActiveAt) / 1000) : null,
          // Mantido por compatibilidade com quem ainda mostra o último login.
          lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt).toISOString() : undefined,
          exam: attempt
            ? {
                title: attempt.examTitle || 'Prova',
                status: deriveAttemptStatus(attempt, now),
                statusLabel: ATTEMPT_STATUS_LABELS[deriveAttemptStatus(attempt, now)],
                answered: attempt.answeredCount || 0,
                total: attempt.totalQuestions || 0,
                question: (attempt.currentQuestion ?? 0) + 1,
              }
            : null,
        }
      })
      .sort((a, b) => (b.lastActiveAt || '').localeCompare(a.lastActiveAt || ''))
      .slice(0, MAX_ROWS)

    return NextResponse.json({
      users,
      windowMinutes: Math.round(windowMs / 60000),
      generatedAt: new Date(now).toISOString(),
    })
  } catch (error) {
    console.error('Get online users list error:', error)
    return NextResponse.json({ error: 'Erro ao buscar lista de usuários online' }, { status: 500 })
  }
}
