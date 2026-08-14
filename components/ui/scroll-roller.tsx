'use client'

import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Roller — barra de rolagem própria para containers com overflow.
 *
 * Por que existe: a barra padrão do navegador é diferente em cada sistema
 * (grossa e cinza no Windows, invisível até rolar no macOS, inexistente no
 * celular) e não tem nada a ver com o resto da interface. Aqui o traço é da
 * marca, some sozinho, engorda no hover e pode ser arrastado com mouse, dedo
 * ou caneta.
 *
 * Regras de performance seguidas à risca:
 *  - nenhum estado do React muda enquanto rola. A cada frame o componente
 *    escreve `transform`/`height` direto no DOM, então rolar não re-renderiza
 *    nada da árvore (a sidebar tem ~15 itens com springs; re-render por frame
 *    de scroll seria o pior negócio possível num celular fraco).
 *  - um único `requestAnimationFrame` coalescido por frame, listener passivo.
 *  - só `transform` e `opacity` animam (compositor); nada de `top`.
 *  - `ResizeObserver` no container e nos filhos para recalcular quando o
 *    conteúdo muda de tamanho, em vez de medir a cada frame.
 *
 * Uso: o elemento pai precisa ser `position: relative` e o container de
 * rolagem precisa esconder a barra nativa (`scrollbar-hide`).
 */

interface ScrollRollerProps {
  /** Container que rola de verdade. */
  targetRef: React.RefObject<HTMLElement | null>
  /** id do container, para `aria-controls`. */
  controlsId?: string
  /** Modo Lite: sem brilho, sem gradiente, sem transições. */
  lite?: boolean
  /** Tempo parado até o traço sumir. */
  autoHideMs?: number
  /** Desenha o esmaecido no topo/base indicando que há mais conteúdo. */
  edgeFades?: boolean
  className?: string
  label?: string
}

/** Altura mínima do traço: abaixo disso vira um ponto impossível de pegar. */
const MIN_THUMB = 32
/** Folga (px) considerada "no fim" — evita traço tremendo por subpixel. */
const EDGE_EPSILON = 2
/** Distância em que o esmaecido de borda atinge opacidade cheia. */
const FADE_RANGE = 28

export function ScrollRoller({
  targetRef,
  controlsId,
  lite = false,
  autoHideMs = 1100,
  edgeFades = true,
  className,
  label = 'Rolar navegação',
}: ScrollRollerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)

  const frameRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const dragRef = useRef<{ pointerId: number; startY: number; startScroll: number } | null>(null)
  // Medidas do último frame — o arrasto precisa delas e não pode remedir o
  // layout a cada `pointermove`.
  const metricsRef = useRef({ maxThumbTop: 0, maxScroll: 0 })

  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // ── Pintura ────────────────────────────────────────────────────────────
  const paint = useCallback(() => {
    frameRef.current = null
    const el = targetRef.current
    const root = rootRef.current
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!el || !root || !track || !thumb) return

    const { scrollTop, scrollHeight, clientHeight } = el
    const maxScroll = scrollHeight - clientHeight
    const trackH = track.clientHeight
    const scrollable = maxScroll > EDGE_EPSILON && trackH > 0

    if (root.dataset.scrollable !== String(scrollable)) {
      root.dataset.scrollable = String(scrollable)
    }

    if (!scrollable) {
      metricsRef.current = { maxThumbTop: 0, maxScroll: 0 }
      root.style.setProperty('--roller-fade-top', '0')
      root.style.setProperty('--roller-fade-bottom', '0')
      return
    }

    const thumbH = Math.max(MIN_THUMB, Math.round((clientHeight / scrollHeight) * trackH))
    const maxThumbTop = Math.max(0, trackH - thumbH)
    const progress = Math.min(1, Math.max(0, scrollTop / maxScroll))
    const offset = Math.round(maxThumbTop * progress)

    metricsRef.current = { maxThumbTop, maxScroll }

    thumb.style.height = `${thumbH}px`
    thumb.style.transform = `translate3d(0, ${offset}px, 0)`
    thumb.setAttribute('aria-valuenow', String(Math.round(progress * 100)))

    // O degradê pertence à PISTA, não ao traço: o traço é uma janelinha que
    // desliza por cima dele. Assim a cor sozinha já diz onde a pessoa está —
    // verde no topo do menu, âmbar lá embaixo — em vez de repetir o mesmo
    // degradê em qualquer posição. Duas custom properties por frame, num
    // elemento de ~5px de largura; no Lite nem isso, o traço é chapado.
    if (!lite) {
      thumb.style.setProperty('--roller-track-h', `${trackH}px`)
      thumb.style.setProperty('--roller-shift', `${-offset}px`)
    }

    if (edgeFades) {
      root.style.setProperty('--roller-fade-top', String(Math.min(1, scrollTop / FADE_RANGE)))
      root.style.setProperty(
        '--roller-fade-bottom',
        String(Math.min(1, (maxScroll - scrollTop) / FADE_RANGE)),
      )
    }
  }, [targetRef, edgeFades, lite])

  const schedulePaint = useCallback(() => {
    if (frameRef.current !== null) return
    frameRef.current = requestAnimationFrame(paint)
  }, [paint])

  // ── Aparecer / sumir ───────────────────────────────────────────────────
  const wake = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    root.dataset.awake = 'true'
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null
      // Enquanto o ponteiro está no menu ou o traço está sendo arrastado, ele
      // fica à mostra: sumir debaixo do cursor é o tipo de coisa que faz a
      // pessoa errar o alvo.
      if (dragRef.current || root.dataset.hover === 'true') return
      root.dataset.awake = 'false'
    }, autoHideMs)
  }, [autoHideMs])

  // ── Ligação com o container ────────────────────────────────────────────
  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    const onScroll = () => {
      schedulePaint()
      wake()
    }
    const onPointerEnter = (event: PointerEvent) => {
      // Só ponteiro fino mantém a barra à mostra. No toque ela aparece ao
      // rolar e some sozinha — barra fixa no celular só rouba espaço.
      if (event.pointerType === 'touch') return
      const root = rootRef.current
      if (!root) return
      root.dataset.hover = 'true'
      wake()
    }
    const onPointerLeave = () => {
      const root = rootRef.current
      if (!root) return
      root.dataset.hover = 'false'
      wake()
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('pointerenter', onPointerEnter)
    el.addEventListener('pointerleave', onPointerLeave)

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedulePaint) : null
    observer?.observe(el)
    // Os filhos também: quando um item entra/sai (seções do admin, selo do
    // Modo Lite) só a altura do conteúdo muda, e o container em si não dispara.
    for (const child of Array.from(el.children)) observer?.observe(child)

    const mutation =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            if (observer) {
              for (const child of Array.from(el.children)) observer.observe(child)
            }
            schedulePaint()
          })
        : null
    mutation?.observe(el, { childList: true, subtree: true })

    window.addEventListener('resize', schedulePaint)

    // Primeira pintura + um "oi" rápido, para quem abre a gaveta no celular
    // perceber que a lista rola.
    schedulePaint()
    wake()

    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointerenter', onPointerEnter)
      el.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('resize', schedulePaint)
      observer?.disconnect()
      mutation?.disconnect()
      // Zerar os handles é obrigatório, não higiene: o efeito roda duas vezes
      // no StrictMode (e a cada Fast Refresh). Se `frameRef` ficasse com o id
      // do frame já cancelado, `schedulePaint` acharia que havia uma pintura
      // agendada e nunca mais agendaria outra — o traço congelava no lugar.
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }
  }, [targetRef, schedulePaint, wake])

  // ── Arrasto do traço ───────────────────────────────────────────────────
  const endDrag = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    const root = rootRef.current
    if (root) root.dataset.dragging = 'false'
    document.body.classList.remove('roller-dragging')
    wake()
  }, [wake])

  const onThumbPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const el = targetRef.current
      const thumb = thumbRef.current
      if (!el || !thumb) return
      event.preventDefault()
      event.stopPropagation()
      thumb.setPointerCapture(event.pointerId)
      dragRef.current = { pointerId: event.pointerId, startY: event.clientY, startScroll: el.scrollTop }
      const root = rootRef.current
      if (root) {
        root.dataset.dragging = 'true'
        root.dataset.awake = 'true'
      }
      document.body.classList.add('roller-dragging')
    },
    [targetRef],
  )

  const onThumbPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      const el = targetRef.current
      if (!drag || !el || drag.pointerId !== event.pointerId) return
      const { maxThumbTop, maxScroll } = metricsRef.current
      if (maxThumbTop <= 0) return
      event.preventDefault()
      const delta = event.clientY - drag.startY
      el.scrollTop = drag.startScroll + (delta / maxThumbTop) * maxScroll
    },
    [targetRef],
  )

  const onThumbPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current?.pointerId !== event.pointerId) return
      thumbRef.current?.releasePointerCapture(event.pointerId)
      endDrag()
    },
    [endDrag],
  )

  // ── Clique na pista: pula direto para o ponto ──────────────────────────
  const onTrackPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const el = targetRef.current
      const track = trackRef.current
      const thumb = thumbRef.current
      if (!el || !track || !thumb) return
      if (event.target === thumb || thumb.contains(event.target as Node)) return

      const { maxThumbTop, maxScroll } = metricsRef.current
      if (maxThumbTop <= 0) return

      const rect = track.getBoundingClientRect()
      const thumbH = thumb.offsetHeight
      const desiredTop = event.clientY - rect.top - thumbH / 2
      const ratio = Math.min(1, Math.max(0, desiredTop / maxThumbTop))

      el.scrollTo({
        top: ratio * maxScroll,
        behavior: lite || prefersReducedMotion() ? 'auto' : 'smooth',
      })
      wake()
    },
    [targetRef, lite, prefersReducedMotion, wake],
  )

  const onTrackPointerEnter = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'touch') return
      const root = rootRef.current
      if (!root) return
      root.dataset.hover = 'true'
      wake()
    },
    [wake],
  )

  const onTrackPointerLeave = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    root.dataset.hover = 'false'
    wake()
  }, [wake])

  // ── Teclado (role="scrollbar" precisa responder às setas) ──────────────
  const onThumbKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const el = targetRef.current
      if (!el) return
      const step = 56
      const page = el.clientHeight * 0.9
      let next: number | null = null

      switch (event.key) {
        case 'ArrowDown':
          next = el.scrollTop + step
          break
        case 'ArrowUp':
          next = el.scrollTop - step
          break
        case 'PageDown':
          next = el.scrollTop + page
          break
        case 'PageUp':
          next = el.scrollTop - page
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = el.scrollHeight
          break
        default:
          return
      }

      event.preventDefault()
      el.scrollTo({ top: next, behavior: lite || prefersReducedMotion() ? 'auto' : 'smooth' })
      wake()
    },
    [targetRef, lite, prefersReducedMotion, wake],
  )

  return (
    <div
      ref={rootRef}
      className={cn('roller', className)}
      data-lite={lite ? 'true' : 'false'}
      data-awake="false"
      data-hover="false"
      data-dragging="false"
      data-scrollable="false"
    >
      {edgeFades && (
        <>
          <div className="roller-fade roller-fade-top" aria-hidden />
          <div className="roller-fade roller-fade-bottom" aria-hidden />
        </>
      )}

      {/* A pista intercepta o ponteiro, então o `pointerenter` do container
          não dispara quando alguém chega pela borda direita da tela direto
          em cima dela — daí os mesmos handlers aqui. */}
      <div
        ref={trackRef}
        className="roller-track"
        onPointerDown={onTrackPointerDown}
        onPointerEnter={onTrackPointerEnter}
        onPointerLeave={onTrackPointerLeave}
      >
        <div
          ref={thumbRef}
          className="roller-thumb"
          role="scrollbar"
          aria-label={label}
          aria-orientation="vertical"
          aria-controls={controlsId}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          tabIndex={0}
          onPointerDown={onThumbPointerDown}
          onPointerMove={onThumbPointerMove}
          onPointerUp={onThumbPointerUp}
          onPointerCancel={onThumbPointerUp}
          onKeyDown={onThumbKeyDown}
        >
          <span className="roller-thumb-bar" aria-hidden>
            <span className="roller-thumb-shine" />
          </span>
        </div>
      </div>
    </div>
  )
}
