/**
 * Constantes e tipos do rastreamento compartilhados entre servidor e client.
 *
 * Vive num módulo próprio para que o bundle do browser não precise importar
 * `exam-attempts.ts` (que fala com o Mongo) só para saber o intervalo do
 * heartbeat.
 */

export type AttemptEvent = 'open' | 'start' | 'heartbeat' | 'leave' | 'submit'

export const ATTEMPT_EVENTS: AttemptEvent[] = ['open', 'start', 'heartbeat', 'leave', 'submit']

/** Intervalo entre heartbeats do aluno com a prova aberta. */
export const HEARTBEAT_INTERVAL_MS = 30 * 1000

/** Janela em que a tentativa conta como "acontecendo agora" no painel ao vivo. */
export const LIVE_THRESHOLD_MS = 3 * 60 * 1000

/** Sem sinal de vida por este tempo e sem envio ⇒ tentativa abandonada. */
export const ABANDON_THRESHOLD_MS = 15 * 60 * 1000
