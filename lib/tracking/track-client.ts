'use client'

/**
 * ═══════════════════════════════════════════════════════════════
 *  Rastreamento — lado do client
 * ───────────────────────────────────────────────────────────────
 *  Tudo aqui é best-effort e silencioso: nenhuma falha de rede pode
 *  aparecer para o aluno nem atrasar a tela. Por isso todo envio é
 *  `keepalive`/`sendBeacon` e todo erro é engolido.
 * ═══════════════════════════════════════════════════════════════
 */

import { HEARTBEAT_INTERVAL_MS, type AttemptEvent } from './shared'

export interface TrackViewInput {
  kind: string
  resourceId?: string
  resourceTitle?: string
  meta?: Record<string, string | number | boolean>
}

/**
 * Chaves já enviadas nesta aba. Evita que o StrictMode do React (que monta o
 * efeito duas vezes em dev) e as remontagens de rota inflem a contagem de
 * aberturas de um mesmo conteúdo.
 */
const sentViews = new Set<string>()

function postJson(url: string, payload: unknown, beacon = false): void {
  try {
    const body = JSON.stringify(payload)
    if (beacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      // sendBeacon sobrevive ao unload da página — é o único envio confiável
      // quando o aluno fecha a aba no meio da prova.
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // silencioso de propósito
  }
}

/** Registra a abertura de um conteúdo. Repetições na mesma aba são ignoradas. */
export function trackView(input: TrackViewInput): void {
  if (typeof window === 'undefined') return
  const key = `${input.kind}:${input.resourceId || ''}`
  if (sentViews.has(key)) return
  sentViews.add(key)

  postJson('/api/track/view', {
    ...input,
    path: window.location.pathname,
    referrer: document.referrer || '',
  })
}

/** Registra um download (mesma semântica de antes, centralizada aqui). */
export function trackDownload(type: string, resourceId?: string, resourceTitle?: string): void {
  if (typeof window === 'undefined') return
  postJson('/api/track/download', { type, resourceId, resourceTitle })
}

// ─── Tentativas de prova ──────────────────────────────────────

export interface ExamAttemptSnapshot {
  totalQuestions?: number
  answeredCount?: number
  currentQuestion?: number
  submissionId?: string
  score?: number
}

export interface ExamAttemptTracker {
  attemptId: string
  send: (event: AttemptEvent, snapshot?: ExamAttemptSnapshot) => void
  /** Liga o heartbeat periódico + o beacon de saída. Retorna a função de limpeza. */
  startHeartbeat: (getSnapshot: () => ExamAttemptSnapshot) => () => void
}

function newAttemptId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // ambientes sem crypto.randomUUID (webviews antigas)
  }
  return `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Cria (ou recupera) o rastreador da tentativa atual.
 *
 * O id fica no `sessionStorage` para que um F5 no meio da prova continue a
 * MESMA tentativa em vez de inventar uma nova — senão todo recarregamento
 * apareceria no painel como um aluno que abriu e sumiu.
 */
export function createExamAttemptTracker(examId: string, examTitle?: string): ExamAttemptTracker {
  const storageKey = `gradex:attempt:${examId}`
  let attemptId = ''
  try {
    attemptId = sessionStorage.getItem(storageKey) || ''
  } catch {
    // sessionStorage bloqueado (modo privado / iframe): segue sem persistir
  }
  if (!attemptId) {
    attemptId = newAttemptId()
    try {
      sessionStorage.setItem(storageKey, attemptId)
    } catch {
      // idem
    }
  }

  const send = (event: AttemptEvent, snapshot: ExamAttemptSnapshot = {}) => {
    postJson(
      '/api/track/exam-attempt',
      { attemptId, examId, examTitle, event, ...snapshot },
      event === 'leave'
    )
  }

  const startHeartbeat = (getSnapshot: () => ExamAttemptSnapshot) => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      send('heartbeat', getSnapshot())
    }, HEARTBEAT_INTERVAL_MS)

    const onHidden = () => {
      if (document.visibilityState === 'hidden') send('leave', getSnapshot())
      else send('heartbeat', getSnapshot())
    }
    const onUnload = () => send('leave', getSnapshot())

    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', onUnload)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', onUnload)
    }
  }

  return { attemptId, send, startHeartbeat }
}

/** Encerra a tentativa guardada — chamado depois do envio bem-sucedido. */
export function clearExamAttempt(examId: string): void {
  try {
    sessionStorage.removeItem(`gradex:attempt:${examId}`)
  } catch {
    // silencioso
  }
}
