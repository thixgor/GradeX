import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { andFilters, REAL_SUBMISSION_FILTER, requireAdmin } from '@/lib/admin-stats/common'
import {
  attemptElapsedMs,
  attemptProgressPct,
  deriveAttemptStatus,
  EXAM_ATTEMPTS_COLLECTION,
  type ExamAttempt,
} from '@/lib/tracking/exam-attempts'
import { ACTIVITY_COLLECTION, ACTIVITY_KIND_LABELS } from '@/lib/tracking/activity-events'

export const dynamic = 'force-dynamic'

const HISTORY_LIMIT = 300

/**
 * Ficha completa de um aluno: o que fez, o que abriu, o que largou pela
 * metade e por onde anda. Alimenta o painel lateral de /admin/stats.
 */
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok || !guard.db) return guard.response!
  const db = guard.db

  try {
    const { userId } = params
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Usuário inválido' }, { status: 400 })
    }

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          name: 1,
          email: 1,
          accountType: 1,
          createdAt: 1,
          lastLoginAt: 1,
          banned: 1,
          role: 1,
          trialExpiresAt: 1,
          faculdade: 1,
          periodo: 1,
          phone: 1,
        },
      }
    )
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const [submissions, attempts, events, downloads, sessions, examTitles] = await Promise.all([
      db
        .collection('submissions')
        .find(andFilters({ userId }, REAL_SUBMISSION_FILTER) as any)
        .sort({ submittedAt: -1 })
        .limit(HISTORY_LIMIT)
        .toArray(),
      db
        .collection(EXAM_ATTEMPTS_COLLECTION)
        .find({ userId })
        .sort({ lastSeenAt: -1 })
        .limit(HISTORY_LIMIT)
        .toArray() as unknown as Promise<ExamAttempt[]>,
      db
        .collection(ACTIVITY_COLLECTION)
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(HISTORY_LIMIT)
        .toArray(),
      db
        .collection('download_logs')
        .find({ userId })
        .sort({ downloadedAt: -1 })
        .limit(HISTORY_LIMIT)
        .toArray(),
      db
        .collection('sessions')
        .find({ userId })
        .sort({ lastActiveAt: -1 })
        .limit(20)
        .toArray(),
      db.collection('exams').find({}, { projection: { title: 1 } }).toArray(),
    ])

    const titleById = new Map(examTitles.map(e => [e._id.toString(), e.title || 'Prova sem título']))
    const now = Date.now()

    const historicoProvas = submissions.map(s => ({
      submissionId: s._id?.toString() || '',
      examId: s.examId,
      titulo: titleById.get(s.examId) || 'Prova removida',
      nota: s.score ?? null,
      correcaoPendente: s.correctionStatus === 'pending',
      enviadaEm: s.submittedAt || null,
      duracaoMs:
        s.startedAt && s.submittedAt
          ? Math.max(0, new Date(s.submittedAt).getTime() - new Date(s.startedAt).getTime())
          : null,
      questoesRespondidas: (s.answers || []).filter(
        (a: any) => a.selectedAlternative || a.discursiveText?.trim() || a.essayText?.trim()
      ).length,
      totalQuestoes: (s.answers || []).length,
    }))

    const tentativas = attempts.map(a => ({
      attemptId: a.attemptId,
      examId: a.examId,
      titulo: a.examTitle || titleById.get(a.examId) || 'Prova removida',
      status: deriveAttemptStatus(a, now),
      abriuEm: a.openedAt || null,
      comecouEm: a.startedAt || null,
      enviouEm: a.submittedAt || null,
      ultimoSinal: a.lastSeenAt || null,
      progresso: attemptProgressPct(a),
      parouNaQuestao: (a.furthestQuestion ?? 0) + 1,
      totalQuestoes: a.totalQuestions || 0,
      saiuDaAba: a.awayCount || 0,
      duracaoMs: attemptElapsedMs(a),
      dispositivo: a.device || 'desconhecido',
    }))

    const conteudos = events.map(e => ({
      kind: e.kind,
      rotulo: ACTIVITY_KIND_LABELS[e.kind] || e.kind,
      area: e.area || 'Outros',
      resourceId: e.resourceId || '',
      titulo: e.resourceTitle || e.resourceId || '—',
      dispositivo: e.device || 'desconhecido',
      em: e.createdAt,
    }))

    // Ranking de conteúdo do próprio aluno — o que ele mais volta a abrir.
    const contagemConteudo = new Map<string, { titulo: string; area: string; aberturas: number }>()
    for (const c of conteudos) {
      const key = `${c.kind}:${c.resourceId}`
      const cur = contagemConteudo.get(key) || { titulo: c.titulo, area: c.area, aberturas: 0 }
      cur.aberturas++
      contagemConteudo.set(key, cur)
    }

    const notas = historicoProvas.map(p => p.nota).filter((n): n is number => n != null)

    return NextResponse.json({
      usuario: {
        userId,
        nome: user.name || 'Sem nome',
        email: user.email || '',
        plano: user.accountType || 'gratuito',
        papel: user.role || 'user',
        banido: !!user.banned,
        cadastro: user.createdAt || null,
        ultimoLogin: user.lastLoginAt || null,
        trialExpiraEm: (user as any).trialExpiresAt || null,
        faculdade: (user as any).faculdade || '',
        periodo: (user as any).periodo || '',
      },
      resumo: {
        provasEntregues: historicoProvas.length,
        media: notas.length ? Number((notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1)) : null,
        melhor: notas.length ? Math.max(...notas) : null,
        pior: notas.length ? Math.min(...notas) : null,
        provasAbertas: tentativas.length,
        provasAbandonadas: tentativas.filter(t => t.status === 'abandoned').length,
        fazendoAgora: tentativas.filter(t => t.status === 'in_progress').length,
        conteudosAbertos: conteudos.length,
        downloads: downloads.length,
        dispositivosAtivos: sessions.filter(s => !s.revokedAt).length,
      },
      historicoProvas,
      tentativas,
      conteudos: conteudos.slice(0, 100),
      topConteudos: Array.from(contagemConteudo.entries())
        .map(([key, v]) => ({ key, ...v }))
        .sort((a, b) => b.aberturas - a.aberturas)
        .slice(0, 15),
      downloads: downloads.map(d => ({
        tipo: d.type,
        titulo: d.resourceTitle || d.resourceId || '—',
        em: d.downloadedAt,
      })),
      dispositivos: sessions.map(s => ({
        aparelho: s.deviceName || 'Desconhecido',
        ip: s.ip || '—',
        ultimaAtividade: s.lastActiveAt || null,
        revogado: !!s.revokedAt,
      })),
    })
  } catch (error: any) {
    console.error('[stats/users/:id]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao carregar usuário' }, { status: 500 })
  }
}
