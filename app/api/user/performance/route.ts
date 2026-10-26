import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { dayKey } from '@/lib/streak'
import { diaVazio, obterResumoDeEstudo, totalDoDia } from '@/lib/estudo/resumo-de-estudo'

export const dynamic = 'force-dynamic'

const SP_TIMEZONE = 'America/Sao_Paulo'

/** Janela do gráfico de atividade (colunas empilhadas). */
const DAILY_WINDOW = 30
/** Janela do mapa de constância — 16 semanas fechadas. */
const HEATMAP_WEEKS = 16

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

    const resumoPromise = obterResumoDeEstudo(db, session.userId, { agora: now, isAdmin: session.role === 'admin' })

    // Recortes do banco por período e dificuldade: só ele tem esse metadado.
    // O resto do histórico (todas as frentes, por dia) vem do resumo.
    let bancoFacet: any = { porPeriodo: [], porDificuldade: [] }
    const bancoPromise = db
      .collection('banco_resolucoes')
      .aggregate([
        { $match: { userId, tipo: 'objetiva' } },
        // Um `$lookup` só, trazendo só os dois campos que os recortes usam —
        // antes eram dois, um por recorte, cada um puxando a questão inteira.
        {
          $lookup: {
            from: 'banco_questoes',
            localField: 'questaoId',
            foreignField: '_id',
            pipeline: [{ $project: { _id: 0, periodoId: 1, dificuldade: 1 } }],
            as: 'questao',
          },
        },
        { $unwind: '$questao' },
        {
          $facet: {
            porPeriodo: [
              {
                $group: {
                  _id: '$questao.periodoId',
                  total: { $sum: 1 },
                  acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
                },
              },
              { $sort: { total: -1 } },
              { $limit: 8 },
              {
                $lookup: {
                  from: 'banco_periodos',
                  localField: '_id',
                  foreignField: '_id',
                  pipeline: [{ $project: { _id: 0, nome: 1, ordem: 1 } }],
                  as: 'periodo',
                },
              },
              { $unwind: { path: '$periodo', preserveNullAndEmptyArrays: true } },
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
      .catch(() => [])

    const [resumo, [result]] = await Promise.all([resumoPromise, bancoPromise])
    if (result) bancoFacet = result

    // ── Séries ────────────────────────────────────────────────────────────────
    const vazio = diaVazio()
    const daily = heatmapKeys.slice(-DAILY_WINDOW).map((date) => ({ date, ...(resumo.porDia[date] || vazio) }))

    const heatmap = heatmapKeys.map((date) => ({ date, total: totalDoDia(resumo.porDia[date]) }))

    const byWeekday = Array.from({ length: 7 }, (_, weekday) => ({ weekday, total: 0 }))
    for (const day of heatmap) {
      byWeekday[weekdayOf(day.date)].total += day.total
    }

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

    const { porDia: _porDia, notasDasProvas, ...totais } = resumo

    return NextResponse.json(
      {
        resumo: totais,
        windowDays: heatmap.length,
        activeDaysInWindow: heatmap.filter((d) => d.total > 0).length,
        daily,
        heatmap,
        byWeekday,
        byDificuldade,
        porPeriodo,
        examScores: notasDasProvas,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    console.error('Get user performance error:', error)
    return NextResponse.json({ error: 'Erro ao buscar desempenho' }, { status: 500 })
  }
}
