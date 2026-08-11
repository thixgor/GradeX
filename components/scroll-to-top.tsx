'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Sobe a janela para o topo.
 *
 * Respeita a trava de rolagem do AppShell (quando a sidebar do mobile está
 * aberta, o body vira `position: fixed` e mexer no scroll ali só bagunçaria a
 * posição que o AppShell vai restaurar depois).
 */
export function scrollToTop(): void {
  if (typeof window === 'undefined') return
  if (document.body.style.position === 'fixed') return

  window.scrollTo(0, 0)
  // Alguns navegadores (iOS, sobretudo) mantêm o scroll no elemento raiz
  // mesmo depois do window.scrollTo — daí o reforço explícito.
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

/**
 * Sobe para o topo e SEGURA a posição por um instante.
 *
 * O reforço existe porque a página nova costuma nascer curta (esqueleto de
 * carregamento) e crescer logo em seguida: nesse intervalo o navegador
 * "gruda" o scroll no fim do documento — que é justamente onde fica o rodapé.
 * Um único scrollTo(0, 0) seria desfeito por esse ajuste.
 *
 * Qualquer gesto de rolagem da pessoa cancela o reforço na hora, para nunca
 * dar a sensação de página presa no topo.
 */
export function holdScrollAtTop(durationMs = 400): () => void {
  if (typeof window === 'undefined') return () => {}

  let cancelled = false
  let frame = 0
  const start = Date.now()
  const listenerOptions: AddEventListenerOptions = { passive: true }

  const teardown = () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('wheel', cancel, listenerOptions)
    window.removeEventListener('touchstart', cancel, listenerOptions)
    window.removeEventListener('keydown', cancel)
  }

  function cancel() {
    cancelled = true
    teardown()
  }

  const tick = () => {
    if (cancelled) return
    if (window.scrollY !== 0) scrollToTop()
    if (Date.now() - start < durationMs) {
      frame = requestAnimationFrame(tick)
      return
    }
    teardown()
  }

  window.addEventListener('wheel', cancel, listenerOptions)
  window.addEventListener('touchstart', cancel, listenerOptions)
  window.addEventListener('keydown', cancel)

  scrollToTop()
  frame = requestAnimationFrame(tick)

  return teardown
}

/**
 * Sobe para o topo sempre que `active` passa a ser verdadeiro.
 *
 * Serve para as telas que trocam de conteúdo SEM trocar de rota — o caso
 * clássico é a prova: a pessoa termina lá embaixo, na última questão, e a tela
 * de resultado (bem mais curta) entra no lugar mantendo o scroll antigo. O
 * resultado é que ela cai no fim da página em vez de ver a nota.
 */
export function useScrollToTopWhen(active: boolean): void {
  useEffect(() => {
    if (!active) return
    return holdScrollAtTop()
  }, [active])
}

/**
 * Garante que toda navegação entre páginas comece no topo.
 *
 * Voltar/avançar do navegador continua restaurando a posição anterior (é o
 * comportamento esperado), e links com âncora (#secao) seguem funcionando.
 */
export function ScrollToTop() {
  const pathname = usePathname()
  const previousPathname = useRef<string | null>(null)
  const lastPopStateAt = useRef(0)

  useEffect(() => {
    const markPopState = () => {
      lastPopStateAt.current = Date.now()
    }
    window.addEventListener('popstate', markPopState)
    return () => window.removeEventListener('popstate', markPopState)
  }, [])

  useEffect(() => {
    const previous = previousPathname.current
    previousPathname.current = pathname

    // Primeira renderização: o navegador já decide a posição inicial.
    if (previous === null || previous === pathname) return
    // Voltar/avançar: deixa o navegador restaurar onde a pessoa estava.
    if (Date.now() - lastPopStateAt.current < 1000) return
    // Link com âncora: o destino é a seção, não o topo.
    if (window.location.hash) return

    return holdScrollAtTop()
  }, [pathname])

  return null
}
