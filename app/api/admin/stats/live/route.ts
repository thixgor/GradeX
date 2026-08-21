import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { requireAdmin } from '@/lib/admin-stats/common'
import {
  ABANDON_THRESHOLD_MS,
  attemptElapsedMs,
  attemptProgressPct,
  deriveAttemptStatus,
  EXAM_ATTEMPTS_COLLECTION,
  HEARTBEAT_INTERVAL_MS,
  type ExamAttempt,
} from '@/lib/tracking/exam-attempts'
import { ACTIVITY_COLLECTION, ACTIVITY_KIND_LABELS } from '@/lib/tracking/activity-events'

export const dynamic = 'force-dynamic'

/** Janela de "online" — mesma usada pelo painel de usuários. */
const ONLINE_WINDOW_MS = 10 * 60 * 1000

/** Quanto tempo para trás o feed ao vivo olha. */
const FEED_WINDOW_MS = 60 * 60 * 1000

/**
 * Tempo real: quem está na plataforma agora, quem está no meio de uma prova
 * e em que questão cada um está.
 *
 * A rota é leve de propósito — o painel a chama a cada 20 s.
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok || !guard.db) return guard.response!
  const db = guard.db

  try {
    const now = Date.now()
    const onlineSince = new Date(now - ONLINE_WINDOW_MS)
    const attemptSince = new Date(now - ABANDON_THRESHOLD_MS)
    const feedSince = new Date(now - FEED_WINDOW_MS)

    const [sessions, attempts, feed, aberturasUltimaHora] = await Promise.all([
      db
        .collection('sessions')
        .find({ revokedAt: { $exists: false }, lastActiveAt: { $gte: onlineSince } })
        .sort({ lastActiveAt: -1 })
        .limit(200)
        .toArray(),
      // Inclui as tentativas silenciosas há até 15 min: são justamente as que
      // estão prestes a virar "saiu no meio" e as que o admin quer ver.
      db
        .collection(EXAM_ATTEMPTS_COLLECTION)
        .find({ status: { $ne: 'submitted' }, lastSeenAt: { $gte: attemptSince } })
        .sort({ lastSeenAt: -1 })
        .limit(200)
        .toArray() as unknown as Promise<ExamAttempt[]>,
      db
        .collection(ACTIVITY_COLLECTION)
        .find({ createdAt: { $gte: feedSince } })
        .sort({ createdAt: -1 })
        .limit(60)
        .toArray(),
      db.collection(ACTIVITY_COLLECTION).countDocuments({ createdAt: { $gte: feedSince } }),
    ])

    // Uma pessoa com três aparelhos logados é uma pessoa, não três.
    const userIds = Array.from(new Set(sessions.map(s => s.userId).filter(Boolean)))
    const users = userIds.length
      ? await db
          .collection('users')
          .find(
            { _id: { $in: userIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id)) } },
            { projection: { name: 1, email: 1, accountType: 1, role: 1 } }
          )
          .toArray()
      : []
    const userById = new Map(users.map(u => [u._id.toString(), u]))

    const online = userIds
      .map(id => {
        const user = userById.get(id)
        const userSessions = sessions.filter(s => s.userId === id)
        const ultima = userSessions.reduce(
          (max, s) => Math.max(max, s.lastActiveAt ? new Date(s.lastActiveAt).getTime() : 0),
          0
        )
        return {
          userId: id,
          nome: user?.name || 'Usuário removido',
          email: user?.email || '',
          plano: user?.accountType || 'gratuito',
          admin: user?.role === 'admin',
          aparelhos: userSessions.length,
          dispositivo: userSessions[0]?.deviceName || 'Desconhecido',
          ultimaAtividade: ultima ? new Date(ultima).toISOString() : null,
          inativoHaSegundos: ultima ? Math.round((now - ultima) / 1000) : null,
        }
      })
      .sort((a, b) => (b.ultimaAtividade || '').localeCompare(a.ultimaAtividade || ''))

    const provasAgora = attempts
      .map(a => ({
        attemptId: a.attemptId,
        examId: a.examId,
        prova: a.examTitle || 'Prova',
        userId: a.userId,
        nome: a.userName || 'Sem nome',
        email: a.userEmail || '',
        plano: a.accountType || 'gratuito',
        status: deriveAttemptStatus(a, now),
        respondidas: a.answeredCount || 0,
        totalQuestoes: a.totalQuestions || 0,
        progresso: attemptProgressPct(a),
        questaoAtual: (a.currentQuestion ?? 0) + 1,
        parouNaQuestao: (a.furthestQuestion ?? 0) + 1,
        saiuDaAba: a.awayCount || 0,
        comecouEm: a.startedAt || null,
        duracaoMs: attemptElapsedMs(a),
        ultimoSinal: a.lastSeenAt || null,
        silencioSegundos: a.lastSeenAt
          ? Math.round((now - new Date(a.lastSeenAt).getTime()) / 1000)
          : null,
        dispositivo: a.device || 'desconhecido',
      }))
      .sort((a, b) => (a.silencioSegundos ?? 1e9) - (b.silencioSegundos ?? 1e9))

    return NextResponse.json({
      geradoEm: new Date(now).toISOString(),
      heartbeatSegundos: Math.round(HEARTBEAT_INTERVAL_MS / 1000),
      resumo: {
        online: online.length,
        dispositivosOnline: sessions.length,
        fazendoProva: provasAgora.filter(p => p.status === 'in_progress').length,
        paradosNaProva: provasAgora.filter(p => p.status === 'idle').length,
        apenasAbriram: provasAgora.filter(p => p.status === 'opened').length,
        aberturasUltimaHora,
      },
      online,
      provasAgora,
      feed: (feed as any[]).map(e => ({
        nome: e.userName || 'Visitante',
        userId: e.userId,
        rotulo: ACTIVITY_KIND_LABELS[e.kind] || e.kind,
        area: e.area || 'Outros',
        titulo: e.resourceTitle || e.resourceId || '—',
        dispositivo: e.device || 'desconhecido',
        em: e.createdAt,
      })),
    })
  } catch (error: any) {
    console.error('[stats/live]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao carregar tempo real' }, { status: 500 })
  }
}
