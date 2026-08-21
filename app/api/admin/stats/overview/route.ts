import { NextRequest, NextResponse } from 'next/server'
import {
  andFilters,
  bucketFormat,
  buildSeries,
  dateMatch,
  deltaPct,
  granularityFor,
  parseRange,
  PLUS_TYPES,
  REAL_SUBMISSION_FILTER,
  requireAdmin,
  toCountMap,
} from '@/lib/admin-stats/common'
import {
  ABANDON_THRESHOLD_MS,
  EXAM_ATTEMPTS_COLLECTION,
  LIVE_THRESHOLD_MS,
} from '@/lib/tracking/exam-attempts'
import { ACTIVITY_COLLECTION } from '@/lib/tracking/activity-events'

export const dynamic = 'force-dynamic'

/**
 * Visão geral do painel: os números do topo, as séries do período e os
 * rankings curtos. Tudo respeita o recorte `?range=`.
 *
 * O funil (abriu → começou → entregou) é o dado que faltava: antes o painel
 * mostrava só a ponta final (submissões) e não explicava a evasão.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok || !guard.db) return guard.response!
  const db = guard.db

  try {
    const range = parseRange(request.nextUrl.searchParams)
    const granularity = granularityFor(range)
    const format = bucketFormat(granularity)

    const users = db.collection('users')
    const exams = db.collection('exams')
    const subs = db.collection('submissions')
    const attempts = db.collection(EXAM_ATTEMPTS_COLLECTION)
    const events = db.collection(ACTIVITY_COLLECTION)
    const downloads = db.collection('download_logs')
    const sessions = db.collection('sessions')

    const now = new Date()
    const prevWindow = { $gte: range.previousFrom, $lt: range.from }
    const liveSince = new Date(now.getTime() - LIVE_THRESHOLD_MS)
    const abandonCutoff = new Date(now.getTime() - ABANDON_THRESHOLD_MS)
    const onlineSince = new Date(now.getTime() - 10 * 60 * 1000)

    const [
      totalUsers,
      newUsers,
      prevNewUsers,
      totalExams,
      newExams,
      totalSubmissions,
      periodSubmissions,
      prevPeriodSubmissions,
      scoreAgg,
      prevScoreAgg,
      attemptFunnel,
      periodViews,
      prevPeriodViews,
      periodDownloads,
      prevPeriodDownloads,
      subsSeries,
      usersSeries,
      attemptsSeries,
      viewsSeries,
      accountDist,
      methodDist,
      scoreBuckets,
      deviceDist,
      areaDist,
      hourDayMatrix,
      topExams,
      topUsers,
      topContent,
      onlineNow,
      liveAttempts,
    ] = await Promise.all([
      users.countDocuments({ role: 'user' }),
      users.countDocuments(andFilters({ role: 'user' }, dateMatch('createdAt', range))),
      range.isAll ? 0 : users.countDocuments({ role: 'user', createdAt: prevWindow }),
      exams.countDocuments(),
      exams.countDocuments(dateMatch('createdAt', range)),
      subs.countDocuments(REAL_SUBMISSION_FILTER),
      subs.countDocuments(andFilters(REAL_SUBMISSION_FILTER, dateMatch('submittedAt', range))),
      range.isAll
        ? 0
        : subs.countDocuments(andFilters(REAL_SUBMISSION_FILTER, { submittedAt: prevWindow })),

      subs
        .aggregate([
          {
            $match: andFilters(
              REAL_SUBMISSION_FILTER,
              { score: { $ne: null, $exists: true } },
              dateMatch('submittedAt', range)
            ),
          },
          { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
        ])
        .toArray(),
      range.isAll
        ? []
        : subs
            .aggregate([
              {
                $match: andFilters(REAL_SUBMISSION_FILTER, {
                  score: { $ne: null, $exists: true },
                  submittedAt: prevWindow,
                }),
              },
              { $group: { _id: null, avg: { $avg: '$score' } } },
            ])
            .toArray(),

      // Funil de tentativas: cada faceta é uma etapa do caminho do aluno.
      attempts
        .aggregate([
          { $match: dateMatch('openedAt', range) },
          {
            $facet: {
              opened: [{ $count: 'n' }],
              started: [{ $match: { startedAt: { $ne: null } } }, { $count: 'n' }],
              submitted: [{ $match: { status: 'submitted' } }, { $count: 'n' }],
              abandoned: [
                {
                  $match: {
                    status: { $ne: 'submitted' },
                    startedAt: { $ne: null },
                    lastSeenAt: { $lt: abandonCutoff },
                  },
                },
                { $count: 'n' },
              ],
              openedOnly: [
                { $match: { startedAt: null, lastSeenAt: { $lt: abandonCutoff } } },
                { $count: 'n' },
              ],
              avgProgressOnAbandon: [
                {
                  $match: {
                    status: { $ne: 'submitted' },
                    startedAt: { $ne: null },
                    lastSeenAt: { $lt: abandonCutoff },
                    totalQuestions: { $gt: 0 },
                  },
                },
                {
                  $group: {
                    _id: null,
                    avg: {
                      $avg: { $divide: ['$answeredCount', '$totalQuestions'] },
                    },
                  },
                },
              ],
            },
          },
        ])
        .toArray(),

      events.countDocuments(dateMatch('createdAt', range)),
      range.isAll ? 0 : events.countDocuments({ createdAt: prevWindow }),
      downloads.countDocuments(dateMatch('downloadedAt', range)),
      range.isAll ? 0 : downloads.countDocuments({ downloadedAt: prevWindow }),

      // ── Séries ──
      subs
        .aggregate([
          { $match: andFilters(REAL_SUBMISSION_FILTER, dateMatch('submittedAt', range)) },
          { $group: { _id: { $dateToString: { format, date: '$submittedAt' } }, count: { $sum: 1 } } },
        ])
        .toArray(),
      users
        .aggregate([
          { $match: andFilters({ role: 'user' }, dateMatch('createdAt', range)) },
          { $group: { _id: { $dateToString: { format, date: '$createdAt' } }, count: { $sum: 1 } } },
        ])
        .toArray(),
      attempts
        .aggregate([
          { $match: dateMatch('openedAt', range) },
          { $group: { _id: { $dateToString: { format, date: '$openedAt' } }, count: { $sum: 1 } } },
        ])
        .toArray(),
      events
        .aggregate([
          { $match: dateMatch('createdAt', range) },
          { $group: { _id: { $dateToString: { format, date: '$createdAt' } }, count: { $sum: 1 } } },
        ])
        .toArray(),

      // ── Distribuições ──
      users
        .aggregate([
          { $match: { role: 'user' } },
          {
            $facet: {
              gratuito: [
                { $match: { $or: [{ accountType: 'gratuito' }, { accountType: { $exists: false } }] } },
                { $count: 'n' },
              ],
              trial: [{ $match: { accountType: 'trial', trialExpiresAt: { $gte: now } } }, { $count: 'n' }],
              plus: [{ $match: { accountType: { $in: PLUS_TYPES } } }, { $count: 'n' }],
              banidos: [{ $match: { banned: true } }, { $count: 'n' }],
            },
          },
        ])
        .toArray(),
      exams.aggregate([{ $group: { _id: '$scoringMethod', count: { $sum: 1 } } }]).toArray(),
      subs
        .aggregate([
          {
            $match: andFilters(
              REAL_SUBMISSION_FILTER,
              { score: { $gte: 0 } },
              dateMatch('submittedAt', range)
            ),
          },
          {
            $bucket: {
              groupBy: '$score',
              boundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, Infinity],
              default: 'outros',
              output: { count: { $sum: 1 } },
            },
          },
        ])
        .toArray(),
      events
        .aggregate([
          { $match: dateMatch('createdAt', range) },
          { $group: { _id: { $ifNull: ['$device', 'desconhecido'] }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),
      events
        .aggregate([
          { $match: dateMatch('createdAt', range) },
          {
            $group: {
              _id: { $ifNull: ['$area', 'Outros'] },
              count: { $sum: 1 },
              usuarios: { $addToSet: '$userId' },
            },
          },
          { $project: { count: 1, usuarios: { $size: '$usuarios' } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),

      // Mapa de calor 7×24 — quando a plataforma é realmente usada.
      subs
        .aggregate([
          { $match: andFilters(REAL_SUBMISSION_FILTER, dateMatch('submittedAt', range)) },
          {
            $group: {
              _id: { dow: { $dayOfWeek: '$submittedAt' }, hour: { $hour: '$submittedAt' } },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),

      // ── Rankings curtos ──
      attempts
        .aggregate([
          { $match: dateMatch('openedAt', range) },
          {
            $group: {
              _id: '$examId',
              titulo: { $last: '$examTitle' },
              aberturas: { $sum: 1 },
              iniciadas: { $sum: { $cond: [{ $ne: ['$startedAt', null] }, 1, 0] } },
              entregues: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
              alunos: { $addToSet: '$userId' },
            },
          },
          { $project: { titulo: 1, aberturas: 1, iniciadas: 1, entregues: 1, alunos: { $size: '$alunos' } } },
          { $sort: { aberturas: -1 } },
          { $limit: 8 },
        ])
        .toArray(),
      subs
        .aggregate([
          { $match: andFilters(REAL_SUBMISSION_FILTER, dateMatch('submittedAt', range)) },
          {
            $group: {
              _id: '$userId',
              nome: { $last: '$userName' },
              provas: { $sum: 1 },
              media: { $avg: '$score' },
              melhor: { $max: '$score' },
              ultima: { $max: '$submittedAt' },
            },
          },
          { $sort: { provas: -1, media: -1 } },
          { $limit: 8 },
        ])
        .toArray(),
      events
        .aggregate([
          { $match: andFilters(dateMatch('createdAt', range), { resourceId: { $ne: '' } }) },
          {
            $group: {
              _id: { kind: '$kind', resourceId: '$resourceId' },
              titulo: { $last: '$resourceTitle' },
              area: { $last: '$area' },
              aberturas: { $sum: 1 },
              usuarios: { $addToSet: '$userId' },
              ultima: { $max: '$createdAt' },
            },
          },
          { $project: { titulo: 1, area: 1, aberturas: 1, ultima: 1, usuarios: { $size: '$usuarios' } } },
          { $sort: { aberturas: -1 } },
          { $limit: 10 },
        ])
        .toArray(),

      sessions.countDocuments({ revokedAt: { $exists: false }, lastActiveAt: { $gte: onlineSince } }),
      attempts.countDocuments({ status: 'in_progress', lastSeenAt: { $gte: liveSince } }),
    ])

    // ─── Pós-processamento ──────────────────────────────────────

    const funnel = attemptFunnel[0] || {}
    const opened = funnel.opened?.[0]?.n || 0
    const started = funnel.started?.[0]?.n || 0
    const submittedAttempts = funnel.submitted?.[0]?.n || 0
    const abandoned = funnel.abandoned?.[0]?.n || 0
    const openedOnly = funnel.openedOnly?.[0]?.n || 0
    const avgAbandonProgress = Math.round((funnel.avgProgressOnAbandon?.[0]?.avg || 0) * 100)

    const series = buildSeries(range, granularity, {
      submissoes: toCountMap(subsSeries as any),
      novosUsuarios: toCountMap(usersSeries as any),
      tentativas: toCountMap(attemptsSeries as any),
      aberturas: toCountMap(viewsSeries as any),
    })

    const dist = (accountDist[0] || {}) as Record<string, { n: number }[]>
    const accountTypes = {
      gratuito: dist.gratuito?.[0]?.n || 0,
      trial: dist.trial?.[0]?.n || 0,
      plus: dist.plus?.[0]?.n || 0,
      banidos: dist.banidos?.[0]?.n || 0,
    }

    const methodMap = new Map((methodDist as any[]).map(d => [d._id, d.count]))
    const examMethods = {
      normal: methodMap.get('normal') || 0,
      tri: methodMap.get('tri') || 0,
      discursive: methodMap.get('discursive') || 0,
    }

    const bucketLabels = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90+']
    const bucketMap = new Map((scoreBuckets as any[]).map(b => [b._id, b.count]))
    const scoreDistribution = bucketLabels.map((label, i) => ({
      label,
      count: bucketMap.get(i * 10) || 0,
    }))

    // Matriz [dia da semana][hora] pronta para o heatmap do client.
    const heatmap = Array.from({ length: 7 }, () => Array<number>(24).fill(0))
    for (const cell of hourDayMatrix as any[]) {
      const dow = (cell._id?.dow ?? 1) - 1 // $dayOfWeek: 1 = domingo
      const hour = cell._id?.hour ?? 0
      if (heatmap[dow]) heatmap[dow][hour] = cell.count
    }

    const avgScore = scoreAgg[0]?.avg ?? null
    const prevAvgScore = (prevScoreAgg as any[])[0]?.avg ?? null

    return NextResponse.json({
      range: {
        key: range.key,
        label: range.label,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        days: range.days,
        granularity,
      },
      kpis: {
        usuarios: { total: totalUsers, novos: newUsers, delta: deltaPct(newUsers, prevNewUsers) },
        provas: { total: totalExams, novas: newExams },
        submissoes: {
          total: totalSubmissions,
          periodo: periodSubmissions,
          delta: deltaPct(periodSubmissions, prevPeriodSubmissions),
        },
        nota: {
          media: avgScore,
          avaliadas: scoreAgg[0]?.count || 0,
          delta: avgScore != null && prevAvgScore != null ? deltaPct(avgScore, prevAvgScore) : null,
        },
        aberturas: { total: periodViews, delta: deltaPct(periodViews, prevPeriodViews) },
        downloads: { total: periodDownloads, delta: deltaPct(periodDownloads, prevPeriodDownloads) },
      },
      funil: {
        aberturas: opened,
        iniciadas: started,
        entregues: submittedAttempts,
        abandonadas: abandoned,
        desistiuAntesDeComecar: openedOnly,
        taxaInicio: opened > 0 ? Number(((started / opened) * 100).toFixed(1)) : 0,
        taxaConclusao: started > 0 ? Number(((submittedAttempts / started) * 100).toFixed(1)) : 0,
        taxaAbandono: started > 0 ? Number(((abandoned / started) * 100).toFixed(1)) : 0,
        progressoMedioAoAbandonar: avgAbandonProgress,
      },
      series,
      distribuicoes: {
        contas: accountTypes,
        metodos: examMethods,
        notas: scoreDistribution,
        dispositivos: (deviceDist as any[]).map(d => ({ label: d._id, count: d.count })),
        areas: (areaDist as any[]).map(d => ({ label: d._id, count: d.count, usuarios: d.usuarios })),
      },
      heatmap,
      topProvas: (topExams as any[]).map(e => ({
        examId: e._id,
        titulo: e.titulo || 'Prova sem título',
        aberturas: e.aberturas,
        iniciadas: e.iniciadas,
        entregues: e.entregues,
        alunos: e.alunos,
        taxaConclusao: e.iniciadas > 0 ? Number(((e.entregues / e.iniciadas) * 100).toFixed(1)) : 0,
      })),
      topUsuarios: (topUsers as any[]).map(u => ({
        userId: u._id,
        nome: u.nome || 'Sem nome',
        provas: u.provas,
        media: u.media,
        melhor: u.melhor,
        ultima: u.ultima,
      })),
      topConteudo: (topContent as any[]).map(c => ({
        kind: c._id?.kind,
        resourceId: c._id?.resourceId,
        titulo: c.titulo || c._id?.resourceId,
        area: c.area,
        aberturas: c.aberturas,
        usuarios: c.usuarios,
        ultima: c.ultima,
      })),
      aoVivo: { online: onlineNow, fazendoProva: liveAttempts },
    })
  } catch (error: any) {
    console.error('[stats/overview]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao carregar visão geral' }, { status: 500 })
  }
}
