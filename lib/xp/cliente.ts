'use client'

/**
 * O lado do cliente do XP: avisar que algo que dá XP aconteceu — e o quê.
 *
 * Duas coisas diferentes:
 *
 * - `avisarXp(motivo)` — "acabei de fazer algo que o servidor já gravou"
 *   (resolvi uma questão, avaliei um material, comprei, entreguei a prova).
 *   Não manda nada: pede ao `XpProvider` para reler o XP, e o motivo decide a
 *   comemoração — "+XP" discreto para a questão, festa com a marca para a
 *   avaliação, a compra, o resgate, a prova, o foco.
 * - `registrarXp()` — para o que só o navegador sabe (o jogo que terminou, o
 *   quiz de histologia, a lição do ECG). Grava o evento em `activity_events` —
 *   a mesma trilha das aberturas — e depois avisa. O servidor conta cada
 *   recurso uma vez por dia e o melhor acerto do dia, com teto por área, então
 *   reenviar não rende nada.
 */

export const EVENTO_DE_XP = 'xp:atualizar'

/** Marca que o XP guardado na sessão ficou velho (a próxima página relê). */
export const CHAVE_XP_SUJO = 'da_xp_sujo'
/** O motivo do último aviso — sobrevive à troca de página (compra → aprovada). */
export const CHAVE_XP_MOTIVO = 'da_xp_motivo'

export type MotivoDeXp =
  | 'avaliacao'
  | 'compra'
  | 'resgate'
  | 'prova'
  | 'foco'
  | 'aula'
  | 'baralho'
  | 'flashcard'
  | 'questao'
  | 'material'
  | 'quiz'
  | 'jogo'
  | 'licao'
  | 'forum'
  | 'mapa'
  | 'anatomia'

export function avisarXp(motivo?: MotivoDeXp): void {
  if (typeof window === 'undefined') return
  // A ação costuma levar a outra página (entregar a prova abre o resultado), e
  // o AppShell remonta: as marcas garantem que a comemoração apareça lá.
  try {
    window.sessionStorage.setItem(CHAVE_XP_SUJO, String(Date.now()))
    if (motivo) window.sessionStorage.setItem(CHAVE_XP_MOTIVO, JSON.stringify({ motivo, em: Date.now() }))
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENTO_DE_XP, { detail: { motivo } }))
}

export type TipoDeXpDoCliente = 'quiz' | 'licao' | 'jogo'

export function registrarXp(entrada: {
  tipo: TipoDeXpDoCliente
  /** Id estável do recurso (slug do quiz, id da lição, id da partida/jogo). */
  recursoId: string
  titulo?: string
  /** Área de origem (histologia, radiologia, semiologia, ecg, forca…). */
  area: string
  acertos?: number
  total?: number
}): void {
  if (typeof window === 'undefined') return
  const meta: Record<string, string | number> = { area: entrada.area.slice(0, 40) }
  if (typeof entrada.total === 'number' && entrada.total > 0) {
    meta.total = Math.min(200, Math.max(0, Math.floor(entrada.total)))
    meta.acertos = Math.min(meta.total, Math.max(0, Math.floor(entrada.acertos || 0)))
  }
  try {
    void fetch('/api/track/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        kind: `xp_${entrada.tipo}`,
        resourceId: `${entrada.area}:${entrada.recursoId}`.slice(0, 160),
        resourceTitle: (entrada.titulo || '').slice(0, 160),
        meta,
        path: window.location.pathname,
      }),
    })
      .catch(() => {})
      .finally(() => avisarXp(entrada.tipo))
  } catch {
    // silencioso: XP nunca vira erro na tela
  }
}
