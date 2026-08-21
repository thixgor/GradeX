import type { Db } from 'mongodb'

/**
 * ═══════════════════════════════════════════════════════════════
 *  Eventos de atividade — "quem abriu o quê"
 * ───────────────────────────────────────────────────────────────
 *  Uma única coleção (`activity_events`) guarda toda abertura de
 *  conteúdo da plataforma. Antes disso, o painel só sabia quem
 *  BAIXOU um PDF (`download_logs`) — não quem apenas abriu uma
 *  patologia, um material ou uma prova.
 *
 *  O registro é sempre best-effort: nunca bloqueia nem derruba a
 *  resposta da rota que o dispara.
 * ═══════════════════════════════════════════════════════════════
 */

export const ACTIVITY_COLLECTION = 'activity_events'

/** Tipos de conteúdo rastreados. Novos valores podem ser adicionados sem migração. */
export const ACTIVITY_KINDS = [
  'exam_open',
  'material_open',
  'manual_home_open',
  'manual_patologia_open',
  'manual_section_open',
  'banco_questoes_open',
  'aula_open',
  'flashcards_open',
  'ferramenta_open',
] as const

export type ActivityKind = (typeof ACTIVITY_KINDS)[number] | (string & {})

/** Rótulos em pt-BR usados pelo painel. */
export const ACTIVITY_KIND_LABELS: Record<string, string> = {
  exam_open: 'Abriu prova',
  material_open: 'Abriu material',
  manual_home_open: 'Abriu Manual Clínico',
  manual_patologia_open: 'Abriu patologia',
  manual_section_open: 'Abriu seção do Manual',
  banco_questoes_open: 'Abriu Banco de Questões',
  aula_open: 'Abriu aula',
  flashcards_open: 'Abriu flashcards',
  ferramenta_open: 'Abriu ferramenta clínica',
}

/** Agrupamento macro usado nos rankings de conteúdo do painel. */
export const ACTIVITY_KIND_AREA: Record<string, string> = {
  exam_open: 'Provas',
  material_open: 'Materiais',
  manual_home_open: 'Manual Clínico',
  manual_patologia_open: 'Manual Clínico',
  manual_section_open: 'Manual Clínico',
  banco_questoes_open: 'Banco de Questões',
  aula_open: 'Ensino',
  flashcards_open: 'Flashcards',
  ferramenta_open: 'Ferramentas',
}

export interface ActivityEvent {
  userId: string | null
  userName: string
  userEmail: string
  accountType: string
  role: string
  isGuest: boolean
  kind: ActivityKind
  area: string
  resourceId: string
  resourceTitle: string
  /** Campos livres por tipo de evento (ex.: `{ slug, sistema }` de uma patologia). */
  meta?: Record<string, unknown>
  path?: string
  referrer?: string
  device?: string
  userAgent?: string
  createdAt: Date
}

export interface LogActivityInput {
  kind: ActivityKind
  resourceId?: string
  resourceTitle?: string
  meta?: Record<string, unknown>
  path?: string
  referrer?: string
  userAgent?: string
  session?: {
    userId?: string
    name?: string
    email?: string
    role?: string
    accountType?: string
  } | null
}

/** Classifica o aparelho a partir do user-agent (só o suficiente para segmentar o painel). */
export function deviceFromUserAgent(userAgent?: string | null): string {
  const ua = (userAgent || '').toLowerCase()
  if (!ua) return 'desconhecido'
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet'
  if (/mobi|iphone|android.*mobile|windows phone/.test(ua)) return 'celular'
  return 'computador'
}

/** Limita strings vindas do client para não inflar documentos. */
function clamp(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.slice(0, max)
}

/**
 * Grava um evento de atividade. Nunca lança — em caso de erro apenas registra
 * no console, porque nenhuma feature do usuário depende do log.
 */
export async function logActivityEvent(db: Db, input: LogActivityInput): Promise<void> {
  try {
    const kind = clamp(input.kind, 64)
    if (!kind) return

    const doc: ActivityEvent = {
      userId: input.session?.userId || null,
      userName: clamp(input.session?.name, 160) || 'Visitante',
      userEmail: clamp(input.session?.email, 200),
      accountType: clamp(input.session?.accountType, 40) || 'gratuito',
      role: clamp(input.session?.role, 20) || 'user',
      isGuest: !input.session?.userId,
      kind,
      area: ACTIVITY_KIND_AREA[kind] || 'Outros',
      resourceId: clamp(input.resourceId, 200),
      resourceTitle: clamp(input.resourceTitle, 300),
      meta: sanitizeMeta(input.meta),
      path: clamp(input.path, 300),
      referrer: clamp(input.referrer, 300),
      device: deviceFromUserAgent(input.userAgent),
      userAgent: clamp(input.userAgent, 300),
      createdAt: new Date(),
    }

    await db.collection<ActivityEvent>(ACTIVITY_COLLECTION).insertOne(doc)
  } catch (error) {
    console.error('[activity-events] falha ao registrar evento:', error)
  }
}

/** Aceita só valores primitivos e no máximo 12 chaves — meta é dado de client. */
function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta || typeof meta !== 'object') return undefined
  const out: Record<string, unknown> = {}
  let count = 0
  for (const [key, value] of Object.entries(meta)) {
    if (count >= 12) break
    if (value == null) continue
    if (typeof value === 'string') out[key.slice(0, 40)] = value.slice(0, 200)
    else if (typeof value === 'number' && Number.isFinite(value)) out[key.slice(0, 40)] = value
    else if (typeof value === 'boolean') out[key.slice(0, 40)] = value
    else continue
    count++
  }
  return count > 0 ? out : undefined
}
