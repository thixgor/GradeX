'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Sobe a janela para o topo.
 */
export function scrollToTop(): void {
  scrollToY(0)
}

/**
 * Leva a janela até `y` (sem animação).
 *
 * Respeita a trava de rolagem do AppShell (quando a sidebar do mobile está
 * aberta, o body vira `position: fixed` e mexer no scroll ali só bagunçaria a
 * posição que o AppShell vai restaurar depois).
 */
function scrollToY(y: number): void {
  if (typeof window === 'undefined') return
  if (document.body.style.position === 'fixed') return

  const alvo = Math.max(0, y)
  window.scrollTo(0, alvo)
  // Alguns navegadores (iOS, sobretudo) mantêm o scroll no elemento raiz
  // mesmo depois do window.scrollTo — daí o reforço explícito.
  document.documentElement.scrollTop = alvo
  document.body.scrollTop = alvo
}

/**
 * Vai até uma posição e SEGURA a rolagem ali por um instante.
 *
 * O reforço existe porque o conteúdo novo costuma nascer curto e crescer logo
 * em seguida (imagem que ainda está baixando, texto rico que só rende no
 * quadro seguinte): nesse intervalo o navegador reajusta o scroll sozinho e
 * desfaz um `scrollTo` único. Segurando por alguns quadros — e recalculando o
 * alvo a cada um deles, porque ele se move junto com o conteúdo — a posição
 * final é a que a pessoa deveria ver.
 *
 * Também vence a inércia de um gesto anterior ainda em curso: no celular, a
 * rolagem por impulso continua depois do toque e engole uma rolagem
 * programada com `behavior: 'smooth'`.
 *
 * Qualquer gesto de rolagem da pessoa cancela o reforço na hora, para nunca
 * dar a sensação de página presa.
 *
 * @param alvo posição desejada, em pixels do topo do documento. Como função,
 *   para ser remedida a cada quadro.
 */
export function holdScrollAt(alvo: number | (() => number), durationMs = 400): () => void {
  if (typeof window === 'undefined') return () => {}

  let cancelled = false
  let frame = 0
  const start = Date.now()
  const listenerOptions: AddEventListenerOptions = { passive: true }
  const posicaoAlvo = typeof alvo === 'function' ? alvo : () => alvo

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

  const aplicar = () => {
    const y = Math.max(0, posicaoAlvo())
    // As duas leituras porque no iOS elas divergem: o `window.scrollY` já diz
    // que chegou enquanto o elemento raiz continua onde estava. Basta uma
    // fora do lugar para reescrever a posição.
    // Tolerância de 1px: o scroll fracionário de telas retina nunca bate
    // exato e ficaria reescrevendo a posição a cada quadro.
    const fora = [window.scrollY, document.documentElement.scrollTop]
      .some(atual => Math.abs(atual - y) >= 1)
    if (fora) scrollToY(y)
  }

  const tick = () => {
    if (cancelled) return
    aplicar()
    if (Date.now() - start < durationMs) {
      frame = requestAnimationFrame(tick)
      return
    }
    teardown()
  }

  window.addEventListener('wheel', cancel, listenerOptions)
  window.addEventListener('touchstart', cancel, listenerOptions)
  window.addEventListener('keydown', cancel)

  aplicar()
  frame = requestAnimationFrame(tick)

  return teardown
}

/**
 * Sobe para o topo e SEGURA a posição por um instante.
 *
 * O caso mais comum do `holdScrollAt`: a página nova nasce curta (esqueleto de
 * carregamento) e cresce logo em seguida; nesse intervalo o navegador "gruda"
 * o scroll no fim do documento — que é justamente onde fica o rodapé.
 */
export function holdScrollAtTop(durationMs = 400): () => void {
  return holdScrollAt(0, durationMs)
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
