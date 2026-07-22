'use client'

// Tour guiado interativo e pulável para o Manual Clínico. Próprio (sem
// dependência externa), leve e sob medida para o layout da página. Destaca
// cada elemento com um "holofote" (recorte no fundo escurecido) e um cartão
// explicativo posicionado ao lado, com navegação e opção de pular.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowRight, ArrowLeft, Check, GraduationCap } from 'lucide-react'

export interface TourStep {
  /** Seletor CSS do alvo. Ausente = passo centralizado (boas-vindas/final). */
  target?: string
  title: string
  body: string
}

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 8 // respiro do holofote ao redor do alvo
const MARGIN = 12 // margem mínima do cartão à borda da tela

export function GuidedTour({
  open,
  steps,
  onClose,
  onFinish,
}: {
  open: boolean
  steps: TourStep[]
  onClose: () => void
  onFinish: () => void
}) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const total = steps.length
  const step = steps[index]
  const isLast = index === total - 1

  // Reinicia no primeiro passo sempre que o tour (re)abre.
  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  // Mede o alvo do passo atual e mantém a medida atualizada em scroll/resize.
  useEffect(() => {
    if (!open || !step) return
    const el = step.target ? (document.querySelector(step.target) as HTMLElement | null) : null
    const measure = () => {
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      } else {
        setRect(null)
      }
    }
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    measure()
    const settle = setTimeout(measure, 380)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearTimeout(settle)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, index, step])

  // Posiciona o cartão a partir da medida do alvo (abaixo, senão acima, sempre
  // preso à viewport). Recalcula quando a medida do alvo ou o passo mudam.
  useEffect(() => {
    if (!open) return
    const card = cardRef.current
    if (!card) return
    const cw = card.offsetWidth
    const ch = card.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (!rect) {
      setPos({ top: Math.max(MARGIN, (vh - ch) / 2), left: Math.max(MARGIN, (vw - cw) / 2) })
      return
    }
    let top = rect.top + rect.height + PAD + MARGIN
    if (top + ch > vh - MARGIN) top = rect.top - ch - PAD - MARGIN
    top = Math.min(Math.max(MARGIN, top), vh - ch - MARGIN)
    let left = rect.left + rect.width / 2 - cw / 2
    left = Math.min(Math.max(MARGIN, left), vw - cw - MARGIN)
    setPos({ top, left })
  }, [rect, index, open])

  const goNext = useCallback(() => {
    if (isLast) onFinish()
    else setIndex((i) => Math.min(i + 1, total - 1))
  }, [isLast, onFinish, total])

  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])

  // Teclado: Esc pula, setas navegam.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, goNext, goPrev])

  if (!open || !step || typeof document === 'undefined') return null

  const spotlight: Rect | null = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Tutorial do Manual Clínico">
      {/* Fundo escurecido + holofote. Quando há alvo, o recorte é feito com um
          box-shadow gigante; sem alvo, escurece a tela inteira. */}
      {spotlight ? (
        <div
          className="pointer-events-none fixed rounded-xl transition-all duration-300 ease-out"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 0 9999px rgba(2, 6, 4, 0.62)',
            outline: '2px solid rgba(16, 185, 129, 0.65)',
            outlineOffset: 2,
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgba(2,6,4,0.62)]" />
      )}

      {/* Cartão explicativo */}
      <div
        ref={cardRef}
        className="fixed w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-emerald-400/25 bg-card p-5 shadow-2xl shadow-black/40"
        style={{
          top: pos?.top ?? -9999,
          left: pos?.left ?? -9999,
          opacity: pos ? 1 : 0,
          transition: 'top .25s ease, left .25s ease, opacity .2s ease',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/12 p-1.5 text-emerald-500">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Tutorial · {index + 1} de {total}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Pular tutorial"
            className="rounded-md p-1 text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="mt-3 font-heading text-lg font-semibold tracking-tight text-foreground">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

        {/* Barra de progresso */}
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-muted-foreground/70 underline-offset-4 transition hover:text-foreground hover:underline"
          >
            Pular tutorial
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={goPrev}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-[0.97]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            )}
            <button
              onClick={goNext}
              className="group inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500/90 active:scale-[0.97]"
            >
              {isLast ? (
                <>
                  Concluir
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
