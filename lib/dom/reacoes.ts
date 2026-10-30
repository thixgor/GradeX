/**
 * Reações do Dom ao que acontece na plataforma.
 *
 * Qualquer tela avisa com `reagirDom(evento)` — sem importar React nem o
 * mascote; o aviso é um evento de janela, e quem desenha o Dom é o lançador
 * (`components/dom/dom-reacoes.tsx`), que já está em toda página logada.
 * Tela sem Dom montado: o aviso simplesmente não tem ouvinte.
 *
 * A sequência de acertos ("foguinho") é contada aqui, na sessão da aba, para
 * qualquer tela de questões alimentar o mesmo contador só dizendo se acertou.
 *
 * Client-safe e puro na decisão (`momentoParaEvento`), testado em
 * `__tests__/dom/reacoes.test.ts`.
 */

import type { MomentoDaFala } from '@/components/dom/falas'

export type EventoDoDom =
  | { tipo: 'resposta'; certa: boolean }
  | { tipo: 'resultado'; percentual: number }
  | { tipo: 'provaIniciada' }
  | { tipo: 'nivel'; novaLiga?: boolean }
  | { tipo: 'sequenciaDias'; dias: number }
  | { tipo: 'flashcards' }
  | { tipo: 'revisaoEmDia' }
  | { tipo: 'compra' }
  | { tipo: 'aula' }
  | { tipo: 'foco' }
  | { tipo: 'xp' }

export const EVENTO_DO_DOM = 'dom:reagir'
const CHAVE_SEQUENCIA = 'dom:foguinho'

export interface Reacao {
  momento: MomentoDaFala
  efeito: 'fogo' | 'confete' | 'estrelas' | 'coracao' | 'nenhum'
  /** Quão importante: a reação mais forte substitui a mais fraca que está na tela. */
  peso: number
}

/** Decide a fala e o efeito do evento. `null` = não vale aparecer. */
export function momentoParaEvento(e: EventoDoDom, sequencia: { antes: number; agora: number }): Reacao | null {
  switch (e.tipo) {
    case 'resposta': {
      if (!e.certa) return sequencia.antes >= 3 ? { momento: 'apagouFoguinho', efeito: 'coracao', peso: 2 } : null
      const n = sequencia.agora
      if (n > 0 && n % 10 === 0) return { momento: 'foguinho10', efeito: 'fogo', peso: 5 }
      if (n === 5) return { momento: 'foguinho5', efeito: 'fogo', peso: 4 }
      if (n === 3) return { momento: 'foguinho3', efeito: 'fogo', peso: 3 }
      return null
    }
    case 'resultado': {
      const p = Math.max(0, Math.min(100, e.percentual))
      if (p >= 100) return { momento: 'gabaritou', efeito: 'confete', peso: 6 }
      if (p >= 80) return { momento: 'notaAlta', efeito: 'estrelas', peso: 4 }
      if (p >= 50) return { momento: 'notaMedia', efeito: 'nenhum', peso: 3 }
      return { momento: 'notaBaixa', efeito: 'coracao', peso: 3 }
    }
    case 'provaIniciada':
      return { momento: 'provaIniciada', efeito: 'nenhum', peso: 1 }
    case 'nivel':
      return e.novaLiga ? { momento: 'novaLiga', efeito: 'confete', peso: 6 } : { momento: 'subiuNivel', efeito: 'estrelas', peso: 5 }
    case 'sequenciaDias':
      if (e.dias >= 30 && e.dias % 30 === 0) return { momento: 'sequencia30', efeito: 'confete', peso: 6 }
      if (e.dias === 7 || (e.dias > 7 && e.dias % 7 === 0)) return { momento: 'sequencia7', efeito: 'fogo', peso: 5 }
      if (e.dias === 3) return { momento: 'sequencia3', efeito: 'fogo', peso: 3 }
      return null
    case 'flashcards':
      return { momento: 'flashcardsFeitos', efeito: 'estrelas', peso: 3 }
    case 'revisaoEmDia':
      return { momento: 'revisaoEmDia', efeito: 'estrelas', peso: 3 }
    case 'compra':
      return { momento: 'compraFeita', efeito: 'confete', peso: 5 }
    case 'aula':
      return { momento: 'aulaConcluida', efeito: 'estrelas', peso: 2 }
    case 'foco':
      return { momento: 'focoConcluido', efeito: 'estrelas', peso: 3 }
    case 'xp':
      return { momento: 'xpGanho', efeito: 'nenhum', peso: 1 }
  }
}

function lerSequencia(): number {
  try {
    return Number(sessionStorage.getItem(CHAVE_SEQUENCIA)) || 0
  } catch {
    return 0
  }
}
function gravarSequencia(n: number) {
  try {
    sessionStorage.setItem(CHAVE_SEQUENCIA, String(n))
  } catch {}
}

/** Avisa o Dom. Seguro no servidor (não faz nada) e sem Dom montado. */
export function reagirDom(evento: EventoDoDom): void {
  if (typeof window === 'undefined') return
  const antes = lerSequencia()
  let agora = antes
  if (evento.tipo === 'resposta') {
    agora = evento.certa ? antes + 1 : 0
    gravarSequencia(agora)
  }
  const reacao = momentoParaEvento(evento, { antes, agora })
  if (!reacao) return
  window.dispatchEvent(new CustomEvent<Reacao & { sequencia: number }>(EVENTO_DO_DOM, { detail: { ...reacao, sequencia: agora } }))
}
