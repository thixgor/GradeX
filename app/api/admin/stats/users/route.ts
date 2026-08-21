import { NextRequest, NextResponse } from 'next/server'
import {
  andFilters,
  dateMatch,
  escapeRegex,
  parsePaging,
  parseRange,
  PLUS_TYPES,
  REAL_SUBMISSION_FILTER,
  requireAdmin,
} from '@/lib/admin-stats/common'
import { ABANDON_THRESHOLD_MS, EXAM_ATTEMPTS_COLLECTION } from '@/lib/tracking/exam-attempts'
import { ACTIVITY_COLLECTION } from '@/lib/tracking/activity-events'

export const dynamic = 'force-dynamic'

/**
 * Lista de alunos com engajamento real: além de provas e média, mostra
 * quantas tentativas a pessoa abandonou, quanto conteúdo abriu e quando foi
 * vista pela última vez.
 *
 * A busca, o filtro e a paginação acontecem no Mongo. A rota antiga trazia a
 * base inteira em toda visita e filtrava no browser — cada abertura da tela
 * transferia todos os usuários com todas as suas submissões.
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
    const filter = params.get('filter') || 'all'
    const sort = params.get('sort') || 'provas'

    const now = new Date()
    const abandonCutoff = new Date(now.getTime() - ABANDON_THRESHOLD_MS)
    const activeSince = new Date(now.getTime() - 30 * 86_400_000)

    // ─── Filtro base sobre `users` ──────────────────────────────
    const userFilter: Record<string, unknown> = { role: 'user' }
    if (search) {
      const re = new RegExp(escapeRegex(search), 'i')
      userFilter.$or = [{ name: re }, { email: re }]
    }
    if (filter === 'plus') userFilter.accountType = { $in: PLUS_TYPES }
    else if (filter === 'trial') Object.assign(userFilter, { accountType: 'trial' })
    else if (filter === 'gratuito') {
      Object.assign(userFilter, {
        $and: [{ $or: [{ accountType: 'gratuito' }, { accountType: { $exists: false } }] }],
      })
    } else if (filter === 'banidos') userFilter.banned = true
    else if (filter === 'novos') Object.assign(userFilter, dateMatch('createdAt', range))

    // Os agregados por usuário são calculados uma vez e cruzados em memória —
    // a alternativa ($lookup dentro de `users`) roda uma busca em
    // `submissions` por documento de usuário.
    const [subsByUser, attemptsByUser, viewsByUser, downloadsByUser, sessionsByUser] = await Promise.all([
      db
        .collection('submissions')
        .aggregate([
          { $match: andFilters(REAL_SUBMISSION_FILTER, dateMatch('submittedAt', range)) },
          {
            $group: {
              _id: '$userId',
              provas: { $sum: 1 },
              media: { $avg: '$score' },
              melhor: { $max: '$score' },
              pior: { $min: '$score' },
              ultima: { $max: '$submittedAt' },
              provasDistintas: { $addToSet: '$examId' },
            },
          },
          { $project: { provas: 1, media: 1, melhor: 1, pior: 1, ultima: 1, provasDistintas: { $size: '$provasDistintas' } } },
        ])
        .toArray(),
      db
        .collection(EXAM_ATTEMPTS_COLLECTION)
        .aggregate([
          { $match: dateMatch('openedAt', range) },
          {
            $group: {
              _id: '$userId',
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
              fazendoAgora: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
              ultimoSinal: { $max: '$lastSeenAt' },
            },
          },
        ])
        .toArray(),
      db
        .collection(ACTIVITY_COLLECTION)
        .aggregate([
          { $match: andFilters(dateMatch('createdAt', range), { userId: { $ne: null } }) },
          {
            $group: {
              _id: '$userId',
              aberturas: { $sum: 1 },
              areas: { $addToSet: '$area' },
              ultima: { $max: '$createdAt' },
            },
          },
        ])
        .toArray(),
      db
        .collection('download_logs')
        .aggregate([
          { $match: andFilters(dateMatch('downloadedAt', range), { userId: { $ne: null } }) },
          { $group: { _id: '$userId', downloads: { $sum: 1 }, ultimo: { $max: '$downloadedAt' } } },
        ])
        .toArray(),
      db
        .collection('sessions')
        .aggregate([
          { $match: { revokedAt: { $exists: false } } },
          { $group: { _id: '$userId', dispositivos: { $sum: 1 }, ultimaAtividade: { $max: '$lastActiveAt' } } },
        ])
        .toArray(),
    ])

    const subMap = new Map((subsByUser as any[]).map(r => [String(r._id), r]))
    const attemptMap = new Map((attemptsByUser as any[]).map(r => [String(r._id), r]))
    const viewMap = new Map((viewsByUser as any[]).map(r => [String(r._id), r]))
    const downloadMap = new Map((downloadsByUser as any[]).map(r => [String(r._id), r]))
    const sessionMap = new Map((sessionsByUser as any[]).map(r => [String(r._id), r]))

    const userDocs = await db
      .collection('users')
      .find(userFilter as any, {
        projection: {
          name: 1,
          email: 1,
          accountType: 1,
          createdAt: 1,
          lastLoginAt: 1,
          banned: 1,
          trialExpiresAt: 1,
          faculdade: 1,
          periodo: 1,
        },
      })
      .toArray()

    let rows = userDocs.map(u => {
      const id = u._id.toString()
      const s = subMap.get(id)
      const a = attemptMap.get(id)
      const v = viewMap.get(id)
      const d = downloadMap.get(id)
      const sess = sessionMap.get(id)

      const ultimaAtividade = [s?.ultima, a?.ultimoSinal, v?.ultima, d?.ultimo, sess?.ultimaAtividade, u.lastLoginAt]
        .filter(Boolean)
        .map(x => new Date(x as any).getTime())
        .reduce((max, t) => Math.max(max, t), 0)

      return {
        userId: id,
        nome: u.name || 'Sem nome',
        email: u.email || '',
        plano: u.accountType || 'gratuito',
        banido: !!u.banned,
        cadastro: u.createdAt || null,
        ultimoLogin: u.lastLoginAt || null,
        faculdade: (u as any).faculdade || '',
        periodo: (u as any).periodo || '',
        provas: s?.provas || 0,
        provasDistintas: s?.provasDistintas || 0,
        media: s?.media ?? null,
        melhor: s?.melhor ?? null,
        pior: s?.pior ?? null,
        ultimaProva: s?.ultima || null,
        aberturasProva: a?.aberturas || 0,
        provasIniciadas: a?.iniciadas || 0,
        provasEntregues: a?.entregues || 0,
        provasAbandonadas: a?.abandonadas || 0,
        fazendoAgora: (a?.fazendoAgora || 0) > 0,
        conteudosAbertos: v?.aberturas || 0,
        areas: (v?.areas || []).filter(Boolean),
        downloads: d?.downloads || 0,
        dispositivos: sess?.dispositivos || 0,
        ultimaAtividade: ultimaAtividade ? new Date(ultimaAtividade).toISOString() : null,
      }
    })

    // Filtros que dependem dos agregados (não dá para expressá-los no $match).
    if (filter === 'ativos') rows = rows.filter(r => r.provas > 0 || r.conteudosAbertos > 0)
    else if (filter === 'inativos') {
      rows = rows.filter(
        r => !r.ultimaAtividade || new Date(r.ultimaAtividade).getTime() < activeSince.getTime()
      )
    } else if (filter === 'nunca-fez') rows = rows.filter(r => r.provas === 0)
    else if (filter === 'desistentes') rows = rows.filter(r => r.provasAbandonadas > 0)
    else if (filter === 'fazendo-agora') rows = rows.filter(r => r.fazendoAgora)

    const num = (v: number | null) => v ?? -1
    rows.sort((a, b) => {
      switch (sort) {
        case 'media':
          return num(b.media) - num(a.media)
        case 'abandono':
          return b.provasAbandonadas - a.provasAbandonadas
        case 'conteudo':
          return b.conteudosAbertos - a.conteudosAbertos
        case 'downloads':
          return b.downloads - a.downloads
        case 'recentes':
          return new Date(b.ultimaAtividade || 0).getTime() - new Date(a.ultimaAtividade || 0).getTime()
        case 'cadastro':
          return new Date(b.cadastro || 0).getTime() - new Date(a.cadastro || 0).getTime()
        case 'nome':
          return a.nome.localeCompare(b.nome, 'pt-BR')
        default:
          return b.provas - a.provas || num(b.media) - num(a.media)
      }
    })

    const resumo = {
      exibidos: rows.length,
      ativos: rows.filter(r => r.provas > 0 || r.conteudosAbertos > 0).length,
      nuncaFizeram: rows.filter(r => r.provas === 0).length,
      comAbandono: rows.filter(r => r.provasAbandonadas > 0).length,
      fazendoAgora: rows.filter(r => r.fazendoAgora).length,
    }

    return NextResponse.json({
      range: { key: range.key, label: range.label },
      total: rows.length,
      page,
      limit,
      resumo,
      usuarios: rows.slice(skip, skip + limit),
    })
  } catch (error: any) {
    console.error('[stats/users]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao carregar usuários' }, { status: 500 })
  }
}
