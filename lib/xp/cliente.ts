'use client'

/**
 * O lado do cliente do XP: avisar que algo que dá XP aconteceu.
 *
 * Duas coisas diferentes:
 *
 * - `avisarXp()` — "acabei de fazer algo que o servidor já gravou" (resolvi uma
 *   questão, revisei cartas, entreguei a prova, concluí a aula). Não manda nada:
 *   só pede ao `XpProvider` para reler o XP, e o "+XP" aparece.
 * - `registrarXp()` — para o que só o navegador sabe (o jogo que terminou, o
 *   quiz de histologia, a lição do ECG). Grava o evento em `activity_events` —
 *   a mesma trilha das aberturas — e depois avisa. O servidor conta cada
 *   recurso uma vez por dia e o melhor acerto do dia, com teto por área, então
 *   reenviar não rende nada.
 */

export const EVENTO_DE_XP = 'xp:atualizar'

/** Marca que o XP guardado na sessão ficou velho (a próxima página relê). */
export const CHAVE_XP_SUJO = 'da_xp_sujo'

export function avisarXp(): void {
  if (typeof window === 'undefined') return
  // A ação costuma levar a outra página (entregar a prova abre o resultado), e
  // o AppShell remonta: a marca garante que o "+XP" apareça lá.
  try { window.sessionStorage.setItem(CHAVE_XP_SUJO, String(Date.now())) } catch {}
  window.dispatchEvent(new CustomEvent(EVENTO_DE_XP))
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
      .finally(avisarXp)
  } catch {
    // silencioso: XP nunca vira erro na tela
  }
}
