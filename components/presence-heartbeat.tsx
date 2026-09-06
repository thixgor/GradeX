'use client'

import { useEffect } from 'react'
import {
  PRESENCE_ANON_KEY,
  PRESENCE_ENDPOINT,
  PRESENCE_HEADER,
  PRESENCE_IDLE_MS,
  PRESENCE_LAST_PING_KEY,
  PRESENCE_MAX_SKIP_MS,
  PRESENCE_PIGGYBACK_GRACE_MS,
  PRESENCE_PING_INTERVAL_MS,
  PRESENCE_TICK_MS,
} from '@/lib/presence/shared'

/**
 * ═══════════════════════════════════════════════════════════════
 *  Batida de ponto — o mínimo possível de requisições
 * ───────────────────────────────────────────────────────────────
 *  Existe só para tapar UM buraco: a pessoa que está no site, na
 *  frente da tela, mas parada numa leitura. Sem ela, `lastActiveAt`
 *  envelhece e a pessoa some da contagem de online mesmo estando ali.
 *
 *  Cada tick (30s, 100% local) o componente pergunta quatro coisas
 *  antes de gastar UMA requisição. Basta uma resposta "não" e nada
 *  sai da máquina:
 *
 *   1. A aba está visível?           → aba de fundo não é presença.
 *   2. Teve gente mexendo?           → aba esquecida aberta não é
 *                                      presença (era exatamente o que
 *                                      inflava a contagem antiga).
 *   3. Já bateu ponto agora há pouco? → o intervalo é COMPARTILHADO
 *                                      entre todas as abas, via
 *                                      localStorage. Cinco abas
 *                                      abertas = um ping, não cinco.
 *   4. O browser já falou com o servidor? → toda requisição
 *                                      autenticada carimba a sessão
 *                                      sozinha. Se acabou de rolar
 *                                      uma, o ping seria redundante.
 *
 *  Na prática: quem está clicando, respondendo prova ou navegando
 *  quase nunca chega a mandar um ping — a atividade normal dele já
 *  faz o trabalho. Quem está lendo parado manda 1 requisição a cada
 *  2 minutos, sem corpo e com resposta 204 vazia.
 *
 *  Nada aqui é visível nem bloqueante: falha de rede é engolida.
 * ═══════════════════════════════════════════════════════════════
 */

/** Marcador que o `useBootstrap` grava — presente = tem sessão no browser. */
const BOOTSTRAP_STORAGE_KEY = 'da_bootstrap_v1'

function isLoggedIn(): boolean {
  try {
    return !!window.localStorage.getItem(BOOTSTRAP_STORAGE_KEY)
  } catch {
    // Modo privado / storage bloqueado: não dá para saber. Deixa passar —
    // um visitante deslogado é barrado no middleware (401, sem função
    // serverless) e a aba desliga o ping na primeira resposta.
    return true
  }
}

function readNumber(storage: Storage | undefined, key: string): number {
  try {
    const raw = storage?.getItem(key)
    const value = raw ? Number(raw) : 0
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

export function PresenceHeartbeat() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Visitante deslogado desta aba: já tentou uma vez e levou "anon".
    try {
      if (window.sessionStorage.getItem(PRESENCE_ANON_KEY)) return
    } catch {
      // segue sem o atalho
    }

    let cancelled = false
    /** Última vez que HOUVE gente (mouse, tecla, toque, rolagem). */
    let lastInteractionAt = Date.now()
    /** Última conversa do browser com o nosso servidor (fetch/XHR). */
    let lastServerTalkAt = Date.now()
    let sending = false

    const markInteraction = () => {
      lastInteractionAt = Date.now()
    }

    /*
     * A carona é observada, não instrumentada: o PerformanceObserver
     * enxerga toda requisição de rede da página sem que a gente precise
     * embrulhar o `fetch` global (o que mexeria no caminho de TODA
     * chamada do app para ganhar um relógio).
     */
    let observer: PerformanceObserver | undefined
    try {
      if (typeof PerformanceObserver === 'function') {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
            if (entry.initiatorType !== 'fetch' && entry.initiatorType !== 'xmlhttprequest') continue
            if (!entry.name.startsWith(window.location.origin)) continue
            if (entry.name.includes(PRESENCE_ENDPOINT)) continue
            lastServerTalkAt = Date.now()
            return
          }
        })
        observer.observe({ type: 'resource', buffered: false })
      }
    } catch {
      // Sem observer a carona simplesmente não acontece: o ping sai no
      // intervalo normal. Mais requisições, nunca dados errados.
    }

    async function ping() {
      if (sending || cancelled) return
      sending = true
      const now = Date.now()
      // Reserva a vez ANTES de mandar: se duas abas acordarem no mesmo
      // milissegundo, a segunda já lê o horário novo e desiste.
      try {
        window.localStorage.setItem(PRESENCE_LAST_PING_KEY, String(now))
      } catch {
        // sem localStorage cada aba bate o próprio ponto — aceitável
      }

      try {
        const response = await fetch(PRESENCE_ENDPOINT, {
          method: 'POST',
          cache: 'no-store',
          credentials: 'include',
          keepalive: true,
        })
        // 401 vem do middleware (borda, sem função serverless); 'anon' vem
        // da rota. Qualquer um dos dois significa "não há o que carimbar".
        if (response.status === 401 || response.headers.get(PRESENCE_HEADER) === 'anon') {
          cancelled = true
          try {
            window.sessionStorage.setItem(PRESENCE_ANON_KEY, '1')
          } catch {
            // ignora
          }
        }
      } catch {
        // Rede caiu: o próximo tick tenta de novo.
      } finally {
        sending = false
      }
    }

    function tick() {
      if (cancelled) return
      if (document.visibilityState !== 'visible') return
      if (!isLoggedIn()) return

      const now = Date.now()
      if (now - lastInteractionAt > PRESENCE_IDLE_MS) return

      const lastPingAt = Math.max(
        readNumber(window.localStorage, PRESENCE_LAST_PING_KEY),
        0,
      )
      const sinceLastPing = now - lastPingAt
      if (sinceLastPing < PRESENCE_PING_INTERVAL_MS) return

      // Carona: o servidor acabou de ser carimbado por outra requisição.
      // Vale até o teto — passou dele, bate ponto de qualquer jeito.
      if (
        now - lastServerTalkAt < PRESENCE_PIGGYBACK_GRACE_MS &&
        sinceLastPing < PRESENCE_MAX_SKIP_MS
      ) {
        return
      }

      void ping()
    }

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      // Voltar para a aba é interação: a pessoa está de volta agora.
      markInteraction()
      tick()
    }

    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'wheel',
      'touchstart',
      'scroll',
    ]
    for (const event of events) {
      window.addEventListener(event, markInteraction, { passive: true })
    }
    document.addEventListener('visibilitychange', onVisibility)

    tick()
    const timer = window.setInterval(tick, PRESENCE_TICK_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      for (const event of events) {
        window.removeEventListener(event, markInteraction)
      }
      observer?.disconnect()
    }
  }, [])

  return null
}
