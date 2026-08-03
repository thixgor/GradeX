import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ExamSubmission } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { computeStreak, dayKey } from '@/lib/streak'

export const dynamic = 'force-dynamic'

const SP_TIMEZONE = 'America/Sao_Paulo'

/** Janela do gráfico de atividade (colunas empilhadas). */
const DAILY_WINDOW = 30
/** Janela do mapa de constância — 16 semanas fechadas. */
const HEATMAP_WEEKS = 16

type DayBucket = { banco: number; provas: number }

/** Chaves de dia (YYYY-MM-DD, fuso SP) para os últimos N dias, do mais antigo ao mais novo. */
function lastDays(n: number, now: Date): string[] {
  const keys: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(now.getTime() - i * 86_400_000)))
  }
  return keys
}

/** Dia da semana (0 = domingo) de uma chave YYYY-MM-DD, sem sofrer com fuso. */
function weekdayOf(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/**
 * Séries prontas para os gráficos do perfil (aba Desempenho).
 *
 * Diferente de `/api/banco/estatisticas`, que é exclusivo do Plus+, aqui todo
 * usuário lê o próprio histórico — são os dados dele, e o gráfico é justamente
 * o que mostra que vale a pena continuar.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const now = new Date()
    const userId = new ObjectId(session.userId)

    // Fatia do heatmap arredondada para semanas fechadas (domingo → sábado),
    // senão a primeira coluna fica com buracos que não são "dia sem estudo".
    const todayKey = dayKey(now)
    const trailingDays = 6 - weekdayOf(todayKey) // completa a semana corrente
    const heatmapDays = HEATMAP_WEEKS * 7 - trailingDays
    const heatmapKeys = lastDays(heatmapDays, now)
    const since = new Date(now.getTime() - heatmapDays * 86_400_000)

    // Projeção enxuta: só o que os gráficos usam. Trazer `answers` inteiro só
    // para contar respostas puxaria megabytes de quem tem muita prova.
    const submissions = await db
      .collection<ExamSubmission>('submissions')
      .aggregate<{ submittedAt: Date; triScore?: number; examId: string; answersCount: number }>([
        { $match: { userId: session.userId } },
        {
          $project: {
            _id: 0,
            submittedAt: 1,
            triScore: 1,
            examId: 1,
            answersCount: { $size: { $ifNull: ['$answers', []] } },
          },
        },
        { $sort: { submittedAt: 1 } },
      ])
      .toArray()

    let bancoFacet: any = { diario: [], diasAtivos: [], porPeriodo: [], porDificuldade: [], totais: [] }
    try {
      const [result] = await db
        .collection('banco_resolucoes')
        .aggregate([
          { $match: { userId } },
          {
            $facet: {
              totais: [
                {
                  $group: {
                    _id: null,
                    total: { $sum: 1 },
                    acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
                    erros: { $sum: { $cond: [{ $eq: ['$correta', false] }, 1, 0] } },
                  },
                },
              ],
              // Resoluções por dia (fuso SP) dentro da janela do heatmap.
              diario: [
                { $match: { createdAt: { $gte: since } } },
                {
                  $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: SP_TIMEZONE } },
                    total: { $sum: 1 },
                  },
                },
              ],
              // O streak só precisa de dias distintos, não de cada resolução.
              diasAtivos: [
                {
                  $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: SP_TIMEZONE } },
                  },
                },
              ],
              porPeriodo: [
                { $match: { tipo: 'objetiva' } },
                {
                  $lookup: {
                    from: 'banco_questoes',
                    localField: 'questaoId',
                    foreignField: '_id',
                    as: 'questao',
                  },
                },
                { $unwind: '$questao' },
                {
                  $group: {
                    _id: '$questao.periodoId',
                    total: { $sum: 1 },
                    acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
                  },
                },
                {
                  $lookup: {
                    from: 'banco_periodos',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'periodo',
                  },
                },
                { $unwind: { path: '$periodo', preserveNullAndEmptyArrays: true } },
                { $sort: { total: -1 } },
                { $limit: 8 },
                {
                  $project: {
                    _id: 0,
                    nome: { $ifNull: ['$periodo.nome', 'Sem período'] },
                    ordem: { $ifNull: ['$periodo.ordem', 999] },
                    total: 1,
                    acertos: 1,
                  },
                },
              ],
              porDificuldade: [
                { $match: { tipo: 'objetiva' } },
                {
                  $lookup: {
                    from: 'banco_questoes',
                    localField: 'questaoId',
                    foreignField: '_id',
                    as: 'questao',
                  },
                },
                { $unwind: '$questao' },
                {
                  $group: {
                    _id: { $ifNull: ['$questao.dificuldade', 'medio'] },
                    total: { $sum: 1 },
                    acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
                  },
                },
                { $project: { _id: 0, nivel: '$_id', total: 1, acertos: 1 } },
              ],
            },
          },
        ])
        .toArray()
      if (result) bancoFacet = result
    } catch {
      // Coleção ainda não existe para esta base — segue com séries vazias.
    }

    // ── Buckets por dia ───────────────────────────────────────────────────────
    const buckets = new Map<string, DayBucket>()
    for (const key of heatmapKeys) buckets.set(key, { banco: 0, provas: 0 })

    for (const row of bancoFacet.diario as Array<{ _id: string; total: number }>) {
      const bucket = buckets.get(row._id)
      if (bucket) bucket.banco += row.total
    }

    const activityDates: Array<Date | null> = []
    for (const row of (bancoFacet.diasAtivos || []) as Array<{ _id: string }>) {
      // Meio-dia em São Paulo: cai sempre no mesmo dia que a chave agregada,
      // sem risco de virar a data por causa do fuso.
      if (row._id) activityDates.push(new Date(`${row._id}T12:00:00-03:00`))
    }

    let questionsAnsweredExams = 0
    for (const sub of submissions) {
      const answered = sub.answersCount || 0
      questionsAnsweredExams += answered
      if (!sub.submittedAt) continue
      const submittedAt = new Date(sub.submittedAt)
      activityDates.push(submittedAt)
      const bucket = buckets.get(dayKey(submittedAt))
      // Questões, não provas: a coluna empilhada só faz sentido se as duas
      // séries estiverem na mesma unidade — senão o total não quer dizer nada.
      if (bucket) bucket.provas += answered
    }

    const streak = computeStreak(activityDates, now)

    // ── Séries ────────────────────────────────────────────────────────────────
    const dailyKeys = heatmapKeys.slice(-DAILY_WINDOW)
    const daily = dailyKeys.map((date) => {
      const bucket = buckets.get(date)!
      return { date, banco: bucket.banco, provas: bucket.provas }
    })

    const heatmap = heatmapKeys.map((date) => {
      const bucket = buckets.get(date)!
      return { date, total: bucket.banco + bucket.provas }
    })

    const byWeekday = Array.from({ length: 7 }, (_, weekday) => ({ weekday, total: 0 }))
    for (const day of heatmap) {
      byWeekday[weekdayOf(day.date)].total += day.total
    }

    // Só provas já corrigidas entram na curva de notas — nota pendente vira degrau falso.
    const examScores = submissions
      .filter((sub) => typeof sub.triScore === 'number' && sub.submittedAt)
      .map((sub) => ({
        date: new Date(sub.submittedAt).toISOString(),
        tri: Math.round(sub.triScore as number),
        examId: sub.examId,
      }))

    const totais = bancoFacet.totais?.[0] || { total: 0, acertos: 0, erros: 0 }

    const porPeriodo = (bancoFacet.porPeriodo as Array<{ nome: string; ordem: number; total: number; acertos: number }>)
      .sort((a, b) => a.ordem - b.ordem)
      .map((row) => ({
        nome: row.nome,
        total: row.total,
        acertos: row.acertos,
        accuracy: row.total > 0 ? Math.round((row.acertos / row.total) * 100) : 0,
      }))

    const NIVEIS = ['facil', 'medio', 'dificil'] as const
    const dificuldadeMap = new Map(
      (bancoFacet.porDificuldade as Array<{ nivel: string; total: number; acertos: number }>).map((r) => [r.nivel, r]),
    )
    const byDificuldade = NIVEIS.map((nivel) => {
      const row = dificuldadeMap.get(nivel)
      const total = row?.total || 0
      const acertos = row?.acertos || 0
      return { nivel, total, acertos, accuracy: total > 0 ? Math.round((acertos / total) * 100) : 0 }
    })

    return NextResponse.json(
      {
        totals: {
          questionsAnswered: questionsAnsweredExams + totais.total,
          questionsAnsweredExams,
          examsCompleted: submissions.length,
          bankAnswered: totais.total,
          bankCorrect: totais.acertos,
          bankWrong: totais.erros,
          bankAccuracy: totais.total > 0 ? Math.round((totais.acertos / totais.total) * 100) : 0,
          streakDays: streak.current,
          longestStreak: streak.longest,
          studiedToday: streak.activeToday,
          activeDays: heatmap.filter((d) => d.total > 0).length,
          windowDays: heatmap.length,
        },
        daily,
        heatmap,
        byWeekday,
        byDificuldade,
        porPeriodo,
        examScores,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    console.error('Get user performance error:', error)
    return NextResponse.json({ error: 'Erro ao buscar desempenho' }, { status: 500 })
  }
}
