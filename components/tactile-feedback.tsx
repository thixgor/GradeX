'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Camada global de resposta tátil e aquecimento de navegação — mobile-first.
 *
 * Resolve três queixas específicas de mobile sem alterar nenhuma funcionalidade
 * ou layout:
 *
 *  1. "Botões não sentem que estão sendo apertados" → dispara um pulso de
 *     vibração curtíssimo (haptics) no toque de qualquer controle interativo.
 *     Só em telas de toque (`pointer: coarse`) e respeitando
 *     `prefers-reduced-motion`.
 *
 *  2. `:active` que não dispara no iOS Safari → o simples fato de existir um
 *     listener de toque no documento faz o Safari aplicar os estados `:active`
 *     (usados no button.tsx e no globals-button-feedback.css) instantaneamente,
 *     deixando o "afundar" do botão imediato.
 *
 *  3. "Fluxo/carregamento lento" → no `pointerdown` de um link interno já
 *     dispara o `router.prefetch` da rota. Quando o dedo levanta e a navegação
 *     acontece, o JS/RSC do destino já está (ou está quase) em cache, então a
 *     tela troca sem a espera fria.
 *
 * Tudo é passivo e delegado no documento (um único listener), então não há
 * custo por-componente nem re-render de React.
 */

// Elementos que devem "responder" ao toque com haptics.
const INTERACTIVE_SELECTOR =
  'button, [role="button"], [role="tab"], [role="switch"], ' +
  'input[type="submit"], input[type="button"], input[type="checkbox"], ' +
  'input[type="radio"], label[for], a[href], summary, [data-haptic]'

// Rotas já solicitadas ao prefetch — evita reprocessar o mesmo destino.
const prefetched = new Set<string>()

function isDisabled(el: Element): boolean {
  if (el.hasAttribute('disabled')) return true
  if (el.getAttribute('aria-disabled') === 'true') return true
  return false
}

export function TactileFeedback() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Detecta se o aparelho é de toque e se o usuário não pediu menos animação.
    const coarse = window.matchMedia?.('(pointer: coarse)')?.matches ?? false
    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    const canVibrate =
      coarse && !reduceMotion && typeof navigator.vibrate === 'function'

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (!target || typeof target.closest !== 'function') return

      const control = target.closest(INTERACTIVE_SELECTOR) as HTMLElement | null
      if (!control || isDisabled(control)) return

      // 1) Haptics — pulso curtíssimo, imperceptível como "vibração" mas
      //    suficiente pra dar a sensação de clique físico.
      if (canVibrate) {
        try {
          navigator.vibrate(8)
        } catch {
          // alguns navegadores bloqueiam vibrate fora de gesto do usuário — ignora
        }
      }

      // 2) Aquecimento de navegação — prefetch de links internos.
      const anchor = control.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return

      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      // Só rotas internas (mesma origem).
      if (url.origin !== window.location.origin) return

      const path = url.pathname + url.search
      if (prefetched.has(path)) return
      prefetched.add(path)
      try {
        router.prefetch(path)
      } catch {
        // rota não prefetchável (ex.: dinâmica sem params) — ignora
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, {
      passive: true,
    })
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [router])

  return null
}
