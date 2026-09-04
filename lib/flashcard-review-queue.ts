'use client'

import type { FlashcardSpacedRating } from './types'

/**
 * Fila de envio das avaliações da repetição espaçada.
 *
 * O problema que ela resolve: antes, marcar "Fácil" disparava um POST e o
 * estudo ficava parado com um botão girando até a resposta chegar. Numa
 * sessão de 60 cards isso é um minuto inteiro olhando para um spinner — e num
 * celular com sinal ruim, muito mais.
 *
 * Agora a avaliação é aplicada na hora (o mesmo cálculo do servidor roda no
 * navegador) e o registro sai daqui, em segundo plano:
 *
 *   • avaliações próximas viram um lote só (menos requisições, menos bateria);
 *   • falha de rede não perde nada: a fila fica no localStorage e é retomada
 *     na próxima vez que o deck abrir;
 *   • fechar a aba no meio da sessão despacha o que restou via `sendBeacon`.
 *
 * O servidor ignora uma avaliação repetida (mesmo card, mesmo instante), então
 * uma retentativa depois de uma resposta perdida não agenda o card duas vezes.
 */

const STORAGE_PREFIX = 'gdx:flashcard-reviews:'
/** Espera curta para agrupar avaliações seguidas no mesmo lote. */
const BATCH_DELAY_MS = 600
/** Espera entre tentativas quando a rede falha. */
const RETRY_DELAYS_MS = [1_000, 3_000, 8_000, 20_000, 45_000]
const MAX_QUEUE = 500

export type ReviewSyncStatus = 'idle' | 'saving' | 'pending' | 'error'

export interface PendingReview {
  cardId: string
  rating: FlashcardSpacedRating
  /** ISO. É o instante da avaliação, não o do envio. */
  reviewedAt: string
  retention: number
}

export interface ReviewSyncHandle {
  /** Enfileira uma avaliação e agenda o envio. */
  push: (review: PendingReview) => void
  /** Força o envio agora (fim de sessão, saída da página). */
  flush: () => Promise<void>
  pending: () => number
  dispose: () => void
}

interface ReviewSyncOptions {
  slug: string
  userKey: string
  onStatus?: (status: ReviewSyncStatus, pending: number) => void
  /** Progresso autoritativo devolvido pelo servidor, para reconciliação. */
  onSynced?: (progresses: any[]) => void
}

function storageKey(slug: string, userKey: string) {
  return `${STORAGE_PREFIX}${userKey || 'guest'}:${slug}`
}

function readQueue(key: string): PendingReview[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item: any) => item && typeof item.cardId === 'string' && typeof item.rating === 'string'
    )
  } catch {
    return []
  }
}

function writeQueue(key: string, queue: PendingReview[]) {
  if (typeof window === 'undefined') return
  try {
    if (queue.length === 0) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(queue.slice(-MAX_QUEUE)))
  } catch {
    // Sem localStorage (aba anônima, cota): a fila continua valendo em memória.
  }
}

export function createReviewSync({ slug, userKey, onStatus, onSynced }: ReviewSyncOptions): ReviewSyncHandle {
  const key = storageKey(slug, userKey)
  const endpoint = `/api/flashcards/manual/${encodeURIComponent(slug)}/reviews`

  let queue: PendingReview[] = readQueue(key)
  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight = false
  let attempt = 0
  let disposed = false

  function report(status: ReviewSyncStatus) {
    onStatus?.(status, queue.length)
  }

  function persist() {
    writeQueue(key, queue)
  }

  function schedule(delay: number) {
    if (disposed || timer) return
    timer = setTimeout(() => {
      timer = null
      void send()
    }, delay)
  }

  async function send(): Promise<void> {
    if (disposed || inFlight || queue.length === 0) return
    inFlight = true
    const batch = queue.slice(0, 100)
    report('saving')

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: batch }),
        keepalive: true,
      })

      if (!res.ok) {
        // 4xx é definitivo (deck apagado, acesso revogado, card removido):
        // insistir só manteria a fila presa para sempre.
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          queue = queue.slice(batch.length)
          persist()
          attempt = 0
          inFlight = false
          report(queue.length > 0 ? 'pending' : 'idle')
          if (queue.length > 0) schedule(BATCH_DELAY_MS)
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }

      const json = await res.json().catch(() => null)
      queue = queue.slice(batch.length)
      persist()
      attempt = 0
      inFlight = false
      if (json?.progresses?.length) onSynced?.(json.progresses)
      report(queue.length > 0 ? 'pending' : 'idle')
      if (queue.length > 0) schedule(50)
    } catch {
      inFlight = false
      const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]
      attempt += 1
      report('error')
      schedule(delay)
    }
  }

  /** Último recurso ao sair da página: entrega sem esperar resposta. */
  function beacon() {
    if (queue.length === 0) return
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return
    try {
      const payload = new Blob([JSON.stringify({ reviews: queue.slice(0, 100) })], {
        type: 'application/json',
      })
      if (navigator.sendBeacon(endpoint, payload)) {
        queue = queue.slice(100)
        persist()
      }
    } catch {
      // Não deu: a fila continua no localStorage e sai na próxima abertura.
    }
  }

  function onPageHide() {
    if (timer) { clearTimeout(timer); timer = null }
    beacon()
  }

  function onVisibility() {
    if (typeof document === 'undefined') return
    if (document.visibilityState === 'hidden') onPageHide()
    else if (queue.length > 0) schedule(200)
  }

  function onOnline() {
    if (queue.length > 0) schedule(200)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', onPageHide)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
    // Sobrou algo de uma sessão anterior (aba fechada, celular sem sinal)?
    // Sai assim que a página abre, antes mesmo de o usuário estudar de novo.
    if (queue.length > 0) schedule(400)
  }

  return {
    push(review: PendingReview) {
      if (disposed) return
      queue = [...queue, review].slice(-MAX_QUEUE)
      persist()
      report('pending')
      schedule(BATCH_DELAY_MS)
    },
    async flush() {
      if (timer) { clearTimeout(timer); timer = null }
      await send()
    },
    pending() {
      return queue.length
    },
    dispose() {
      disposed = true
      if (timer) { clearTimeout(timer); timer = null }
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', onPageHide)
        window.removeEventListener('online', onOnline)
        document.removeEventListener('visibilitychange', onVisibility)
      }
      beacon()
    },
  }
}
