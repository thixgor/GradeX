import { NextRequest, NextResponse } from 'next/server'
import {
  andFilters,
  dateMatch,
  escapeRegex,
  parsePaging,
  parseRange,
  REAL_SUBMISSION_FILTER,
  requireAdmin,
} from '@/lib/admin-stats/common'
import { ABANDON_THRESHOLD_MS, EXAM_ATTEMPTS_COLLECTION } from '@/lib/tracking/exam-attempts'

export const dynamic = 'force-dynamic'

type SortKey =
  | 'aberturas'
  | 'entregues'
  | 'abandono'
  | 'media'
  | 'recentes'
  | 'titulo'
  | 'conclusao'

/**
 * Lista de provas com o ciclo completo: quantos abriram, quantos começaram,
 * quantos entregaram e quantos sumiram no meio.
 *
 * As três coleções são agregadas separadamente e cruzadas em memória. Um
 * `$lookup` por prova (como fazia a rota antiga) custava uma varredura de
 * `submissions` por documento de `exams`; aqui são três agregações, ponto.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok || !guard.db) return guard.response!
  const db = guard.db

  try {
    const params = request.nextUrl.searchParams
    const range = parseRange(params)
    const { page, limit, skip } = parsePaging(params, 25)
    const search = (params.get('search') || '').trim()
    const method = params.get('method') || 'all'
    const status = params.get('status') || 'all'
    const sort = (params.get('sort') || 'aberturas') as SortKey

    const abandonCutoff = new Date(Date.now() - ABANDON_THRESHOLD_MS)

    const [examDocs, attemptRows, submissionRows] = await Promise.all([
      // `questions` fica de fora de propósito: é o campo mais pesado da
      // coleção e nada nesta tela depende do enunciado.
      db
        .collection('exams')
        .find({}, {
          projection: {
            title: 1,
            scoringMethod: 1,
            numberOfQuestions: 1,
            createdAt: 1,
            createdBy: 1,
            isHidden: 1,
            isPracticeExam: 1,
            isPersonalExam: 1,
            groupId: 1,
            startTime: 1,
            endTime: 1,
            duration: 1,
            'proctoring.enabled': 1,
          },
        })
        .toArray(),

      db
        .collection(EXAM_ATTEMPTS_COLLECTION)
        .aggregate([
          { $match: dateMatch('openedAt', range) },
          {
            $group: {
              _id: '$examId',
              titulo: { $last: '$examTitle' },
              aberturas: { $sum: 1 },
              iniciadas: { $sum: { $cond: [{ $ne: ['$startedAt', null] }, 1, 0] } },
              entregues: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
              abandonadas: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ['$status', 'submitted'] },
                        { $ne: ['$startedAt', null] },
                        { $lt: ['$lastSeenAt', abandonCutoff] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              soDeuUmaOlhada: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$startedAt', null] }, { $lt: ['$lastSeenAt', abandonCutoff] }] },
                    1,
                    0,
                  ],
                },
              },
              acontecendoAgora: {
                $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
              },
              alunos: { $addToSet: '$userId' },
              ultimoAcesso: { $max: '$lastSeenAt' },
              paradaMedia: {
                $avg: {
                  $cond: [
                    { $and: [{ $ne: ['$status', 'submitted'] }, { $gt: ['$totalQuestions', 0] }] },
                    { $divide: ['$answeredCount', '$totalQuestions'] },
                    null,
                  ],
                },
              },
            },
          },
          {
            $project: {
              titulo: 1,
              aberturas: 1,
              iniciadas: 1,
              entregues: 1,
              abandonadas: 1,
              soDeuUmaOlhada: 1,
              acontecendoAgora: 1,
              ultimoAcesso: 1,
              paradaMedia: 1,
              alunos: { $size: '$alunos' },
            },
          },
        ])
        .toArray(),

      db
        .collection('submissions')
        .aggregate([
          { $match: andFilters(REAL_SUBMISSION_FILTER, dateMatch('submittedAt', range)) },
          {
            $group: {
              _id: '$examId',
              submissoes: { $sum: 1 },
              media: { $avg: '$score' },
              melhor: { $max: '$score' },
              pior: { $min: '$score' },
              ultima: { $max: '$submittedAt' },
              alunos: { $addToSet: '$userId' },
              aguardandoCorrecao: {
                $sum: { $cond: [{ $eq: ['$correctionStatus', 'pending'] }, 1, 0] },
              },
            },
          },
          { $project: { submissoes: 1, media: 1, melhor: 1, pior: 1, ultima: 1, aguardandoCorrecao: 1, alunos: { $size: '$alunos' } } },
        ])
        .toArray(),
    ])

    const attemptMap = new Map((attemptRows as any[]).map(r => [String(r._id), r]))
    const submissionMap = new Map((submissionRows as any[]).map(r => [String(r._id), r]))

    let rows = examDocs.map(exam => {
      const id = exam._id.toString()
      const a = attemptMap.get(id)
      const s = submissionMap.get(id)
      const iniciadas = a?.iniciadas || 0
      const entregues = a?.entregues || 0

      return {
        examId: id,
        titulo: exam.title || a?.titulo || 'Prova sem título',
        metodo: exam.scoringMethod || 'normal',
        questoes: exam.numberOfQuestions || 0,
        criadaEm: exam.createdAt || null,
        criadaPor: exam.createdBy || '',
        oculta: !!exam.isHidden,
        treino: !!exam.isPracticeExam,
        pessoal: !!exam.isPersonalExam,
        proctoring: !!(exam as any).proctoring?.enabled,
        duracao: exam.duration || null,
        janela: { inicio: exam.startTime || null, fim: exam.endTime || null },
        // Ciclo de vida (só existe para tentativas rastreadas)
        aberturas: a?.aberturas || 0,
        iniciadas,
        entregues,
        abandonadas: a?.abandonadas || 0,
        soDeuUmaOlhada: a?.soDeuUmaOlhada || 0,
        acontecendoAgora: a?.acontecendoAgora || 0,
        alunosUnicos: a?.alunos || s?.alunos || 0,
        ultimoAcesso: a?.ultimoAcesso || s?.ultima || null,
        paradaMediaPct: a?.paradaMedia != null ? Math.round(a.paradaMedia * 100) : null,
        taxaConclusao: iniciadas > 0 ? Number(((entregues / iniciadas) * 100).toFixed(1)) : null,
        taxaAbandono: iniciadas > 0 ? Number((((a?.abandonadas || 0) / iniciadas) * 100).toFixed(1)) : null,
        // Resultado
        submissoes: s?.submissoes || 0,
        media: s?.media ?? null,
        melhor: s?.melhor ?? null,
        pior: s?.pior ?? null,
        aguardandoCorrecao: s?.aguardandoCorrecao || 0,
        ultimaSubmissao: s?.ultima || null,
      }
    })

    // ─── Filtros ───────────────────────────────────────────────
    if (search) {
      const re = new RegExp(escapeRegex(search), 'i')
      rows = rows.filter(r => re.test(r.titulo))
    }
    if (method !== 'all') rows = rows.filter(r => r.metodo === method)
    if (status === 'ativas') rows = rows.filter(r => r.acontecendoAgora > 0)
    else if (status === 'ocultas') rows = rows.filter(r => r.oculta)
    else if (status === 'treino') rows = rows.filter(r => r.treino)
    else if (status === 'sem-atividade') rows = rows.filter(r => r.aberturas === 0 && r.submissoes === 0)
    else if (status === 'correcao') rows = rows.filter(r => r.aguardandoCorrecao > 0)

    // ─── Ordenação ─────────────────────────────────────────────
    const byNumberDesc = (a: number | null, b: number | null) => (b ?? -1) - (a ?? -1)
    rows.sort((a, b) => {
      switch (sort) {
        case 'entregues':
          return b.entregues - a.entregues || b.submissoes - a.submissoes
        case 'abandono':
          return byNumberDesc(a.taxaAbandono, b.taxaAbandono)
        case 'conclusao':
          return byNumberDesc(a.taxaConclusao, b.taxaConclusao)
        case 'media':
          return byNumberDesc(a.media, b.media)
        case 'recentes':
          return new Date(b.criadaEm || 0).getTime() - new Date(a.criadaEm || 0).getTime()
        case 'titulo':
          return a.titulo.localeCompare(b.titulo, 'pt-BR')
        default:
          return b.aberturas - a.aberturas || b.submissoes - a.submissoes
      }
    })

    const totals = rows.reduce(
      (acc, r) => {
        acc.aberturas += r.aberturas
        acc.iniciadas += r.iniciadas
        acc.entregues += r.entregues
        acc.abandonadas += r.abandonadas
        acc.submissoes += r.submissoes
        acc.aguardandoCorrecao += r.aguardandoCorrecao
        return acc
      },
      { aberturas: 0, iniciadas: 0, entregues: 0, abandonadas: 0, submissoes: 0, aguardandoCorrecao: 0 }
    )

    return NextResponse.json({
      range: { key: range.key, label: range.label },
      total: rows.length,
      page,
      limit,
      totais: totals,
      provas: rows.slice(skip, skip + limit),
    })
  } catch (error: any) {
    console.error('[stats/exams]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao carregar provas' }, { status: 500 })
  }
}
