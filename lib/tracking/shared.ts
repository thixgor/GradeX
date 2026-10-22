/**
 * Constantes e tipos do rastreamento compartilhados entre servidor e client.
 *
 * Vive num módulo próprio para que o bundle do browser não precise importar
 * `exam-attempts.ts` (que fala com o Mongo) só para saber o intervalo do
 * heartbeat.
 */

export type AttemptEvent = 'open' | 'start' | 'heartbeat' | 'leave' | 'submit'

export const ATTEMPT_EVENTS: AttemptEvent[] = ['open', 'start', 'heartbeat', 'leave', 'submit']

/**
 * De quanto em quanto tempo o aluno com a prova aberta CONFERE se precisa
 * mandar sinal. Conferir é local; o envio segue a regra abaixo.
 */
export const HEARTBEAT_INTERVAL_MS = 30 * 1000

/**
 * Sem mudança no progresso, o heartbeat só sai depois deste silêncio.
 *
 * Era um envio a cada 30 s, mudasse algo ou não — a rota mais chamada do site
 * (6,8 mil invocações em 18 h num dia de prova). O painel considera a tentativa
 * "acontecendo agora" por `LIVE_THRESHOLD_MS` (3 min) desde o último sinal: com
 * 90 s, o maior intervalo entre dois sinais é 90 s + uma conferência (2 min), e
 * ninguém some do painel. Quando o aluno responde ou troca de questão, o sinal
 * sai na conferência seguinte, como antes.
 */
export const HEARTBEAT_MAX_SILENCE_MS = 90 * 1000

/** Janela em que a tentativa conta como "acontecendo agora" no painel ao vivo. */
export const LIVE_THRESHOLD_MS = 3 * 60 * 1000

/** Sem sinal de vida por este tempo e sem envio ⇒ tentativa abandonada. */
export const ABANDON_THRESHOLD_MS = 15 * 60 * 1000
