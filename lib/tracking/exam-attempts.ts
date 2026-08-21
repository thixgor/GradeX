import type { Db } from 'mongodb'
import { deviceFromUserAgent } from './activity-events'
import {
  ABANDON_THRESHOLD_MS,
  HEARTBEAT_INTERVAL_MS,
  LIVE_THRESHOLD_MS,
  type AttemptEvent,
} from './shared'

/**
 * ═══════════════════════════════════════════════════════════════
 *  Tentativas de prova — o ciclo de vida completo
 * ───────────────────────────────────────────────────────────────
 *  A coleção `submissions` só existe depois que o aluno ENVIA a
 *  prova. Com isso, o painel era cego para tudo que acontece antes:
 *  quem abriu a prova e desistiu na tela inicial, quem começou e
 *  parou na questão 7, quem está fazendo a prova neste momento.
 *
 *  `exam_attempts` cobre essa lacuna: um documento por tentativa,
 *  criado no primeiro contato com a prova e atualizado por
 *  heartbeats enquanto o aluno responde.
 *
 *  O estado `abandonada` NÃO é gravado — é derivado na leitura
 *  (`deriveAttemptStatus`) a partir do último sinal de vida, para
 *  não depender de nenhum job periódico.
 * ═══════════════════════════════════════════════════════════════
 */

export const EXAM_ATTEMPTS_COLLECTION = 'exam_attempts'

export {
  ABANDON_THRESHOLD_MS,
  ATTEMPT_EVENTS,
  HEARTBEAT_INTERVAL_MS,
  LIVE_THRESHOLD_MS,
  type AttemptEvent,
} from './shared'

/** Estado gravado no documento. */
export type AttemptStoredStatus = 'opened' | 'in_progress' | 'submitted'

/** Estado apresentado no painel (inclui os derivados por tempo). */
export type AttemptStatus =
  | 'opened'        // abriu a prova e não começou a responder
  | 'in_progress'   // respondendo agora
  | 'idle'          // começou, ainda dentro da janela, mas parado há alguns minutos
  | 'abandoned'     // começou e sumiu sem enviar
  | 'submitted'     // enviou

export const ATTEMPT_STATUS_LABELS: Record<AttemptStatus, string> = {
  opened: 'Só abriu',
  in_progress: 'Fazendo agora',
  idle: 'Parado',
  abandoned: 'Saiu no meio',
  submitted: 'Entregou',
}

export interface ExamAttempt {
  attemptId: string
  examId: string
  examTitle: string
  userId: string
  userName: string
  userEmail: string
  accountType: string
  status: AttemptStoredStatus
  openedAt: Date
  startedAt?: Date | null
  lastSeenAt: Date
  submittedAt?: Date | null
  /** Última vez que a aba foi escondida/fechada com a prova em andamento. */
  leftAt?: Date | null
  /** Quantas vezes o aluno saiu da aba durante a tentativa. */
  awayCount: number
  answeredCount: number
  totalQuestions: number
  /** Maior índice de questão alcançado (0-based) — mostra ONDE o aluno parou. */
  furthestQuestion: number
  currentQuestion: number
  /** Tempo com a prova aberta, em ms (do início ao último sinal de vida). */
  activeMs: number
  submissionId?: string | null
  score?: number | null
  device: string
  userAgent?: string
  updatedAt: Date
}

/** Entrada normalizada vinda do client. */
export interface AttemptPing {
  attemptId: string
  examId: string
  event: AttemptEvent
  examTitle?: string
  totalQuestions?: number
  answeredCount?: number
  currentQuestion?: number
  submissionId?: string
  score?: number
}

function toInt(value: unknown, min: number, max: number): number | undefined {
  const n = Number(value)
  if (!Number.isFinite(n)) return undefined
  return Math.min(max, Math.max(min, Math.round(n)))
}

/**
 * Aplica um ping ao documento da tentativa (upsert por `attemptId`).
 *
 * Os campos "de progresso" usam `$max` sempre que faziam sentido monotônico
 * (questão mais distante, contagem de respostas): pings podem chegar fora de
 * ordem — um `sendBeacon` de saída às vezes chega depois do heartbeat
 * seguinte — e sem isso o painel mostraria o aluno retrocedendo.
 */
export async function applyAttemptPing(
  db: Db,
  ping: AttemptPing,
  session: { userId: string; name?: string; email?: string; accountType?: string },
  userAgent?: string
): Promise<void> {
  const now = new Date()
  const col = db.collection<ExamAttempt>(EXAM_ATTEMPTS_COLLECTION)

  const answeredCount = toInt(ping.answeredCount, 0, 5000)
  const currentQuestion = toInt(ping.currentQuestion, 0, 5000)
  const totalQuestions = toInt(ping.totalQuestions, 0, 5000)

  const set: Record<string, unknown> = {
    examId: ping.examId,
    userId: session.userId,
    userName: (session.name || '').slice(0, 160),
    userEmail: (session.email || '').slice(0, 200),
    accountType: (session.accountType || 'gratuito').slice(0, 40),
    lastSeenAt: now,
    updatedAt: now,
    device: deviceFromUserAgent(userAgent),
  }
  if (userAgent) set.userAgent = userAgent.slice(0, 300)
  if (ping.examTitle) set.examTitle = ping.examTitle.slice(0, 300)
  if (totalQuestions !== undefined) set.totalQuestions = totalQuestions
  if (currentQuestion !== undefined) set.currentQuestion = currentQuestion

  const max: Record<string, unknown> = {}
  if (answeredCount !== undefined) max.answeredCount = answeredCount
  if (currentQuestion !== undefined) max.furthestQuestion = currentQuestion

  const inc: Record<string, number> = {}
  const setOnInsert: Record<string, unknown> = {
    attemptId: ping.attemptId,
    openedAt: now,
    awayCount: 0,
    answeredCount: 0,
    furthestQuestion: 0,
  }

  switch (ping.event) {
    case 'open':
      // `status` fica no $setOnInsert para não rebaixar uma tentativa que já
      // começou caso a página seja recarregada com o mesmo attemptId.
      setOnInsert.status = 'opened'
      setOnInsert.startedAt = null
      setOnInsert.submittedAt = null
      break
    case 'start':
      set.status = 'in_progress'
      set.startedAt = now
      break
    case 'heartbeat':
      setOnInsert.status = 'in_progress'
      break
    case 'leave':
      set.leftAt = now
      inc.awayCount = 1
      break
    case 'submit':
      set.status = 'submitted'
      set.submittedAt = now
      if (ping.submissionId) set.submissionId = ping.submissionId.slice(0, 64)
      if (typeof ping.score === 'number' && Number.isFinite(ping.score)) set.score = ping.score
      break
  }

  // O Mongo rejeita o update inteiro quando um mesmo campo aparece em dois
  // operadores. `awayCount` é o caso real: nasce em $setOnInsert e é somado em
  // $inc no evento `leave` — sem esta limpeza, todo beacon de saída falhava e o
  // painel nunca via ninguém abandonando a prova.
  for (const key of Object.keys(max)) delete set[key]
  for (const key of Object.keys(inc)) delete set[key]
  for (const key of Object.keys(setOnInsert)) {
    if (key in set || key in max || key in inc) delete setOnInsert[key]
  }

  const update: Record<string, unknown> = { $set: set, $setOnInsert: setOnInsert }
  if (Object.keys(max).length > 0) update.$max = max
  if (Object.keys(inc).length > 0) update.$inc = inc

  await col.updateOne({ attemptId: ping.attemptId }, update as any, { upsert: true })
}

/**
 * Traduz o documento gravado para o estado exibido no painel, usando o
 * relógio de leitura. `now` é injetado para que uma mesma resposta da API
 * classifique todas as tentativas com o mesmo instante de referência.
 */
export function deriveAttemptStatus(
  attempt: Pick<ExamAttempt, 'status' | 'lastSeenAt' | 'startedAt'>,
  now: number = Date.now()
): AttemptStatus {
  if (attempt.status === 'submitted') return 'submitted'

  const lastSeen = attempt.lastSeenAt ? new Date(attempt.lastSeenAt).getTime() : 0
  const silentMs = now - lastSeen
  const started = attempt.status === 'in_progress' || !!attempt.startedAt

  if (!started) {
    // Quem só abriu e sumiu não "saiu no meio" — nunca chegou a começar.
    return 'opened'
  }
  if (silentMs <= LIVE_THRESHOLD_MS) return 'in_progress'
  if (silentMs <= ABANDON_THRESHOLD_MS) return 'idle'
  return 'abandoned'
}

/** Percentual de conclusão da tentativa (0-100), tolerante a provas sem total conhecido. */
export function attemptProgressPct(attempt: Pick<ExamAttempt, 'answeredCount' | 'totalQuestions'>): number {
  if (!attempt.totalQuestions || attempt.totalQuestions <= 0) return 0
  return Math.min(100, Math.round((attempt.answeredCount / attempt.totalQuestions) * 100))
}

/** Tempo decorrido da tentativa em ms — do início (ou abertura) ao último sinal. */
export function attemptElapsedMs(
  attempt: Pick<ExamAttempt, 'openedAt' | 'startedAt' | 'lastSeenAt' | 'submittedAt'>
): number {
  const from = attempt.startedAt || attempt.openedAt
  if (!from) return 0
  const to = attempt.submittedAt || attempt.lastSeenAt
  if (!to) return 0
  return Math.max(0, new Date(to).getTime() - new Date(from).getTime())
}
