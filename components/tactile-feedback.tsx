'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isLiteModeActive } from '@/lib/lite-mode'

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

      // 2) Aquecimento de navegação — prefetch do destino.
      // Além de <a href>, aceitamos qualquer controle que declare
      // `data-prefetch-href`. Muitos menus do app navegam por <button> +
      // router.push (a sidebar, por exemplo), e esses nunca seriam aquecidos
      // se olhássemos só para âncoras.
      const anchor = control.closest('a[href]') as HTMLAnchorElement | null
      const declared = control
        .closest('[data-prefetch-href]')
        ?.getAttribute('data-prefetch-href')

      if (!anchor && !declared) return
      if (anchor) {
        if (anchor.target && anchor.target !== '_self') return
        if (anchor.hasAttribute('download')) return
      }

      const href = declared ?? anchor!.getAttribute('href')
      if (!href || href.startsWith('#')) return

      let url: URL
      try {
        // Resolve a partir do href declarado (que pode ser relativo). Usar
        // `anchor.href` aqui quebraria o caso data-prefetch-href, em que não
        // existe âncora nenhuma.
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      // Só rotas internas (mesma origem).
      if (url.origin !== window.location.origin) return

      const path = url.pathname + url.search
      if (prefetched.has(path)) return
      // No Modo Lite o prefetch é contraproducente: baixar e avaliar o JS de um
      // destino que talvez nem seja aberto rouba banda (muitas vezes economia de
      // dados ligada) e main thread de quem já está no limite. O clique continua
      // funcionando — só sem o adiantamento.
      if (isLiteModeActive()) return
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
