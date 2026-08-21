import { NextResponse } from 'next/server'
import type { Filter, Document } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { PLUS_ACCOUNT_TYPES } from '@/lib/account-tier'

/**
 * ═══════════════════════════════════════════════════════════════
 *  Base comum das rotas de /admin/stats
 * ───────────────────────────────────────────────────────────────
 *  O painel foi quebrado em várias rotas (visão geral, provas,
 *  usuários, conteúdo, ao vivo) porque a rota única anterior
 *  carregava TODOS os usuários e TODAS as provas com um $lookup
 *  por documento em cada request — o custo crescia com a base
 *  inteira mesmo para quem só queria ver o topo da página.
 *
 *  Tudo aqui é compartilhado por essas rotas: autorização, janela
 *  de tempo, formatação de séries e os filtros que separam dado
 *  real de resíduo (ver `REAL_SUBMISSION_FILTER`).
 * ═══════════════════════════════════════════════════════════════
 */

export const PLUS_TYPES = [...PLUS_ACCOUNT_TYPES]

/**
 * Submissões "de verdade".
 *
 * `/api/exams/[id]/start-proctoring` grava um documento em `submissions`
 * apenas para o aluno aparecer no painel de monitoramento: ele nasce com
 * `answers: []` e sem nota. Contá-lo como prova entregue inflava a média e o
 * total de submissões do painel antigo.
 */
export const REAL_SUBMISSION_FILTER: Filter<Document> = { 'answers.0': { $exists: true } }

export type RangeKey = '24h' | '7d' | '30d' | '90d' | '12m' | 'all'

export interface StatsRange {
  key: RangeKey
  from: Date
  to: Date
  /** Início da janela imediatamente anterior, do mesmo tamanho (comparativo). */
  previousFrom: Date
  days: number
  label: string
  /** `true` quando não há recorte — permite pular o $match por data. */
  isAll: boolean
}

const RANGE_DAYS: Record<Exclude<RangeKey, 'all'>, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
}

const RANGE_LABELS: Record<RangeKey, string> = {
  '24h': 'Últimas 24 horas',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  '12m': 'Últimos 12 meses',
  all: 'Desde o início',
}

/** Data de corte para "desde o início" — anterior a qualquer registro real. */
const EPOCH = new Date('2020-01-01T00:00:00.000Z')

export function parseRange(searchParams: URLSearchParams): StatsRange {
  const raw = (searchParams.get('range') || '30d') as RangeKey
  const key: RangeKey = raw in RANGE_LABELS ? raw : '30d'
  const to = new Date()

  if (key === 'all') {
    return {
      key,
      from: EPOCH,
      to,
      previousFrom: EPOCH,
      days: Math.max(1, Math.ceil((to.getTime() - EPOCH.getTime()) / 86_400_000)),
      label: RANGE_LABELS.all,
      isAll: true,
    }
  }

  const days = RANGE_DAYS[key]
  const from = new Date(to.getTime() - days * 86_400_000)
  const previousFrom = new Date(from.getTime() - days * 86_400_000)
  return { key, from, to, previousFrom, days, label: RANGE_LABELS[key], isAll: false }
}

/** `$match` por data que some quando o recorte é "desde o início". */
export function dateMatch(field: string, range: StatsRange): Filter<Document> {
  if (range.isAll) return {}
  return { [field]: { $gte: range.from } }
}

/** Combina filtros ignorando os vazios (evita `$and: [{}]` no pipeline). */
export function andFilters(...filters: Filter<Document>[]): Filter<Document> {
  const used = filters.filter(f => f && Object.keys(f).length > 0)
  if (used.length === 0) return {}
  if (used.length === 1) return used[0]
  return { $and: used }
}

export interface AdminGuardResult {
  ok: boolean
  response?: NextResponse
  db?: Awaited<ReturnType<typeof getDb>>
  session?: Awaited<ReturnType<typeof getSession>>
}

/** Exige sessão de admin e já devolve a conexão — usado por todas as rotas. */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }
  }
  const db = await getDb()
  return { ok: true, db, session }
}

// ─── Séries temporais ─────────────────────────────────────────

export type Granularity = 'hour' | 'day' | 'month'

/** Escolhe a granularidade que rende ~24 a ~90 pontos no gráfico. */
export function granularityFor(range: StatsRange): Granularity {
  if (range.key === '24h') return 'hour'
  if (range.key === '12m' || (range.isAll && range.days > 400)) return 'month'
  return 'day'
}

export function bucketFormat(granularity: Granularity): string {
  if (granularity === 'hour') return '%Y-%m-%dT%H'
  if (granularity === 'month') return '%Y-%m'
  return '%Y-%m-%d'
}

/** Chave do bucket para uma data, no mesmo formato do `$dateToString` acima. */
export function bucketKey(date: Date, granularity: Granularity): string {
  const iso = date.toISOString()
  if (granularity === 'hour') return iso.slice(0, 13)
  if (granularity === 'month') return iso.slice(0, 7)
  return iso.slice(0, 10)
}

export interface SeriesPoint {
  key: string
  label: string
  [metric: string]: string | number
}

/**
 * Monta a série completa do período — inclusive os buckets sem nenhum evento.
 * Sem isso o gráfico "pula" os dias vazios e distorce a leitura de tendência.
 */
export function buildSeries(
  range: StatsRange,
  granularity: Granularity,
  metrics: Record<string, Map<string, number>>
): SeriesPoint[] {
  const points: SeriesPoint[] = []
  const start = new Date(range.from)
  const end = new Date(range.to)

  const cursor = new Date(start)
  if (granularity === 'hour') cursor.setUTCMinutes(0, 0, 0)
  else if (granularity === 'day') cursor.setUTCHours(0, 0, 0, 0)
  else {
    cursor.setUTCHours(0, 0, 0, 0)
    cursor.setUTCDate(1)
  }

  // Teto de segurança: uma janela "desde o início" muito antiga não pode gerar
  // milhares de pontos e travar o gráfico no browser.
  let guard = 0
  while (cursor <= end && guard < 800) {
    guard++
    const key = bucketKey(cursor, granularity)
    const point: SeriesPoint = { key, label: formatBucketLabel(cursor, granularity) }
    for (const [metric, map] of Object.entries(metrics)) {
      point[metric] = map.get(key) || 0
    }
    points.push(point)

    if (granularity === 'hour') cursor.setUTCHours(cursor.getUTCHours() + 1)
    else if (granularity === 'day') cursor.setUTCDate(cursor.getUTCDate() + 1)
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return points
}

function formatBucketLabel(date: Date, granularity: Granularity): string {
  if (granularity === 'hour') {
    return `${String(date.getUTCHours()).padStart(2, '0')}h`
  }
  if (granularity === 'month') {
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
}

/** Converte `[{_id, count}]` do Mongo num Map pronto para `buildSeries`. */
export function toCountMap(rows: { _id: unknown; count: number }[]): Map<string, number> {
  return new Map(rows.map(r => [String(r._id), r.count]))
}

/** Variação percentual entre dois períodos; `null` quando não há base de comparação. */
export function deltaPct(current: number, previous: number): number | null {
  if (!previous) return current > 0 ? 100 : null
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

/** Escapa o texto da busca antes de virar `$regex`. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Paginação com limites sãos — o client não escolhe carregar a base inteira. */
export function parsePaging(searchParams: URLSearchParams, defaultLimit = 25) {
  const page = Math.max(0, Number(searchParams.get('page')) || 0)
  const rawLimit = Number(searchParams.get('limit')) || defaultLimit
  const limit = Math.min(200, Math.max(5, rawLimit))
  return { page, limit, skip: page * limit }
}
