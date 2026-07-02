'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, Lightbulb, MessageSquare, Sparkles, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { FlashcardManualCard } from '@/lib/types'

interface Props {
  card: FlashcardManualCard
  flipped: boolean
  onFlip: () => void
  showComment: boolean
  onToggleComment: () => void
  showHint?: boolean
  onToggleHint?: () => void
  className?: string
}

function renderInline(text: string): React.ReactNode[] {
  if (!text) return []
  const parts: Array<string | React.ReactNode> = []
  // Negrito **texto** e itálico *texto*
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const tok = match[0]
    if (tok.startsWith('**')) {
      parts.push(<strong key={`b-${key++}`} className="font-semibold">{tok.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={`i-${key++}`} className="italic">{tok.slice(1, -1)}</em>)
    }
    last = match.index + tok.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function HiddenWordRender({
  phrase, word, revealed, onDark = false,
}: { phrase: string; word: string; revealed: boolean; onDark?: boolean }) {
  const tokens = useMemo(() => {
    if (!phrase) return [] as Array<{ text: string; isHidden: boolean }>
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (!escaped) return [{ text: phrase, isHidden: false }]
    const re = new RegExp(`(${escaped})`, 'gi')
    const parts = phrase.split(re)
    return parts.map(p => ({ text: p, isHidden: !!word && p.toLowerCase() === word.toLowerCase() }))
  }, [phrase, word])

  return (
    <span>
      {tokens.map((t, i) => (
        t.isHidden ? (
          <motion.span
            key={i}
            initial={false}
            animate={{ scale: revealed ? 1.05 : 1 }}
            className={cn(
              'inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md font-bold tracking-wide',
              revealed
                ? onDark
                  ? 'bg-white/20 text-white ring-1 ring-white/40 shadow-[0_0_10px_rgba(255,255,255,0.18)]'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/40'
                : 'bg-slate-900/90 text-transparent select-none ring-1 ring-slate-900/60 dark:bg-white/10 dark:ring-white/20'
            )}
            style={{ minWidth: revealed ? undefined : `${t.text.length}ch` }}
          >
            {revealed ? t.text : '?'.repeat(Math.max(3, Math.min(8, t.text.length)))}
          </motion.span>
        ) : (
          <span key={i}>{renderInline(t.text)}</span>
        )
      ))}
    </span>
  )
}

function ImageLightbox({ src, onClose, initialClick }: { src: string; onClose: () => void; initialClick?: { x: number; y: number } }) {
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Refs para uso em handlers não-React (wheel, keydown) sem closure stale
  const scaleRef = useRef(1)
  const txRef = useRef({ x: 0, y: 0 })
  scaleRef.current = scale
  txRef.current = translate

  // Estado de drag/pinch via refs (sem re-render a cada pixel)
  const drag = useRef({ active: false, sx: 0, sy: 0, lx: 0, ly: 0, moved: false })
  const ptrs = useRef(new Map<number, { x: number; y: number }>())
  const prevPinch = useRef<{ dist: number; midX: number; midY: number } | null>(null)

  const resetView = useCallback(() => {
    scaleRef.current = 1
    txRef.current = { x: 0, y: 0 }
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [])

  // Zoom em direção ao ponto (clientX, clientY) na tela
  const zoomToPoint = useCallback((clientX: number, clientY: number, newScale: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = clientX - rect.left - rect.width / 2
    const cy = clientY - rect.top - rect.height / 2
    const s = Math.min(Math.max(newScale, 0.5), 5)
    const ratio = s / scaleRef.current
    const newTx = cx - ratio * (cx - txRef.current.x)
    const newTy = cy - ratio * (cy - txRef.current.y)
    scaleRef.current = s
    txRef.current = { x: newTx, y: newTy }
    setScale(s)
    setTranslate({ x: newTx, y: newTy })
  }, [])

  const zoomCenter = useCallback((delta: number) => {
    const el = containerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    zoomToPoint(r.left + r.width / 2, r.top + r.height / 2, scaleRef.current + delta)
  }, [zoomToPoint])

  // Zoom inicial no ponto onde o usuário clicou para abrir
  const zoomToPointRef = useRef(zoomToPoint)
  zoomToPointRef.current = zoomToPoint
  useEffect(() => {
    if (!initialClick) return
    const id = requestAnimationFrame(() => {
      zoomToPointRef.current(initialClick.x, initialClick.y, 2.5)
    })
    return () => cancelAnimationFrame(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === '+' || e.key === '=') zoomCenter(0.5)
      else if (e.key === '-') zoomCenter(-0.5)
      else if (e.key === '0') resetView()
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomToPoint(e.clientX, e.clientY, scaleRef.current + (e.deltaY < 0 ? 0.15 : -0.15))
    }

    const el = containerRef.current
    el?.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      el?.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, resetView, zoomToPoint, zoomCenter])

  function onPtrDown(e: React.PointerEvent) {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (ptrs.current.size === 1) {
      drag.current = { active: true, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, moved: false }
      prevPinch.current = null
      setIsDragging(true)
    } else if (ptrs.current.size === 2) {
      drag.current.active = false
      const pts = [...ptrs.current.values()]
      prevPinch.current = {
        dist: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y),
        midX: (pts[0].x + pts[1].x) / 2,
        midY: (pts[0].y + pts[1].y) / 2,
      }
    }
  }

  function onPtrMove(e: React.PointerEvent) {
    e.stopPropagation()
    if (!ptrs.current.has(e.pointerId)) return
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (ptrs.current.size >= 2) {
      // Pinch zoom: escala + pan simultâneos
      const pts = [...ptrs.current.values()]
      const cur = {
        dist: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y),
        midX: (pts[0].x + pts[1].x) / 2,
        midY: (pts[0].y + pts[1].y) / 2,
      }
      const prev = prevPinch.current
      if (prev && cur.dist > 0) {
        const newS = Math.min(Math.max(scaleRef.current * (cur.dist / prev.dist), 0.5), 5)
        const el = containerRef.current
        if (el) {
          const rect = el.getBoundingClientRect()
          const prevCx = prev.midX - rect.left - rect.width / 2
          const prevCy = prev.midY - rect.top - rect.height / 2
          const ratio = newS / scaleRef.current
          const newTx = prevCx - ratio * (prevCx - txRef.current.x) + (cur.midX - prev.midX)
          const newTy = prevCy - ratio * (prevCy - txRef.current.y) + (cur.midY - prev.midY)
          scaleRef.current = newS
          txRef.current = { x: newTx, y: newTy }
          setScale(newS)
          setTranslate({ x: newTx, y: newTy })
        }
      }
      prevPinch.current = cur
      drag.current.moved = true
    } else if (ptrs.current.size === 1 && drag.current.active) {
      const dx = e.clientX - drag.current.lx
      const dy = e.clientY - drag.current.ly
      drag.current.lx = e.clientX
      drag.current.ly = e.clientY
      if (Math.abs(e.clientX - drag.current.sx) > 4 || Math.abs(e.clientY - drag.current.sy) > 4) {
        drag.current.moved = true
      }
      const newTx = txRef.current.x + dx
      const newTy = txRef.current.y + dy
      txRef.current = { x: newTx, y: newTy }
      setTranslate({ x: newTx, y: newTy })
    }
  }

  function onPtrUp(e: React.PointerEvent) {
    e.stopPropagation()
    ptrs.current.delete(e.pointerId)

    if (ptrs.current.size === 0) {
      drag.current.active = false
      prevPinch.current = null
      setIsDragging(false)
    } else if (ptrs.current.size === 1) {
      // Voltou a 1 dedo: retoma modo drag
      prevPinch.current = null
      const [, pt] = [...ptrs.current.entries()][0]
      drag.current = { active: true, sx: pt.x, sy: pt.y, lx: pt.x, ly: pt.y, moved: false }
    }
  }

  function onContainerClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (drag.current.moved) { drag.current.moved = false; return }
    // Clique fora da imagem sempre fecha
    if (imgRef.current) {
      const r = imgRef.current.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        onClose(); return
      }
    }
    if (scaleRef.current === 1) onClose()
  }

  function onDblClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (scaleRef.current > 1) resetView()
    else zoomToPoint(e.clientX, e.clientY, 2.5)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => zoomCenter(0.5)}
            className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={() => zoomCenter(-0.5)}
            className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            onClick={resetView}
            className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Resetar zoom"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <span className="text-white/40 text-xs ml-1 tabular-nums">{Math.round(scale * 100)}%</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition"
          aria-label="Fechar"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Área da imagem */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center touch-none select-none"
        style={{ cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-out' }}
        onClick={onContainerClick}
        onDoubleClick={onDblClick}
        onPointerDown={onPtrDown}
        onPointerMove={onPtrMove}
        onPointerUp={onPtrUp}
        onPointerCancel={onPtrUp}
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          className="max-w-[96vw] max-h-[84vh] object-contain select-none"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease',
            pointerEvents: 'none',
            willChange: 'transform',
          }}
          draggable={false}
        />
      </div>

      <p className="text-center text-white/30 text-[11px] pb-3 hidden sm:block select-none">
        Scroll para zoom · Duplo clique para ampliar · Arraste para mover · Esc ou clique para fechar
      </p>
    </motion.div>
  )
}

function ClickableImage({
  src, alt, className, containerClassName, onDark = false,
}: {
  src: string; alt?: string; className?: string; containerClassName?: string; onDark?: boolean
}) {
  const [lightbox, setLightbox] = useState(false)
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | undefined>()

  function openLightbox(e: React.MouseEvent) {
    e.stopPropagation()
    setClickPos({ x: e.clientX, y: e.clientY })
    setLightbox(true)
  }

  return (
    <>
      <div className={cn('relative', containerClassName)}>
        <Image
          src={src}
          alt={alt || ''}
          width={800}
          height={500}
          className={cn(className)}
          unoptimized={src.startsWith('http')}
        />
        {/* Botão de ampliar — sempre visível, chamativo */}
        <button
          type="button"
          onClick={openLightbox}
          className={cn(
            'absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-md transition-all duration-150',
            'shadow-lg active:scale-95',
            onDark
              ? 'bg-white/20 text-white ring-1 ring-white/40 hover:bg-white/35 shadow-black/40'
              : 'bg-black/60 text-white ring-1 ring-white/20 hover:bg-black/80 shadow-black/30',
          )}
          aria-label="Ampliar imagem"
        >
          <ZoomIn className="h-3.5 w-3.5 shrink-0" />
          Ampliar
        </button>
      </div>
      <AnimatePresence>
        {lightbox && <ImageLightbox src={src} onClose={() => setLightbox(false)} initialClick={clickPos} />}
      </AnimatePresence>
    </>
  )
}

export function FlashcardCardView({
  card,
  flipped,
  onFlip,
  showComment,
  onToggleComment,
  showHint = false,
  onToggleHint,
  className,
}: Props) {
  const isHidden = card.kind === 'hidden_word'
  const [revealedHidden, setRevealedHidden] = useState(false)
  const [cardHeight, setCardHeight] = useState<number | null>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const flipControls = useAnimationControls()
  const flipMountedRef = useRef(false)

  function stopAndCall(e: React.MouseEvent, fn: () => void) {
    e.stopPropagation()
    fn()
  }

  // Gira o card e — a cada virada — dá um leve "pop" de escala, reforçando a
  // sensação de profundidade 3D. Disparo imperativo (não via prop `animate`)
  // para garantir que o pop sempre toque de novo, mesmo que o alvo de escala
  // (1 → 0.965 → 1) seja idêntico entre uma virada e outra.
  useEffect(() => {
    if (!flipMountedRef.current) {
      flipMountedRef.current = true
      flipControls.set({ rotateY: flipped ? 180 : 0, scale: 1 })
      return
    }
    flipControls.start({
      rotateY: flipped ? 180 : 0,
      scale: [1, 0.965, 1],
      transition: {
        rotateY: { type: 'spring', stiffness: 220, damping: 28 },
        scale: { duration: 0.45, times: [0, 0.5, 1], ease: 'easeInOut' },
      },
    })
  }, [flipped, flipControls])

  useEffect(() => {
    function measure() {
      const frontHeight = frontRef.current?.scrollHeight ?? 0
      const backHeight = backRef.current?.scrollHeight ?? 0
      const nextHeight = Math.max(frontHeight, backHeight)
      if (nextHeight > 0) setCardHeight(nextHeight)
    }

    measure()
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measure)
      : null

    if (resizeObserver) {
      if (frontRef.current) resizeObserver.observe(frontRef.current)
      if (backRef.current) resizeObserver.observe(backRef.current)
    }

    window.addEventListener('resize', measure)
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [card, flipped, showComment, showHint, revealedHidden])

  return (
    <div className={cn('w-full max-w-2xl lg:max-w-4xl mx-auto', className)}>
      {/* Sombra ambiente — dá a sensação de o card flutuar sobre a mesa;
          respira em conjunto com o giro para reforçar a profundidade 3D. */}
      <motion.div
        aria-hidden
        className="mx-auto -mb-6 h-8 max-w-[85%] rounded-full bg-slate-900/25 blur-2xl dark:bg-black/50"
        animate={{ scaleX: flipped ? 0.92 : 1, opacity: flipped ? 0.55 : 0.4 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      <div className="relative w-full [perspective:1100px] sm:[perspective:1500px] lg:[perspective:2200px]">
        <motion.div
          className="relative w-full"
          animate={flipControls}
          style={{ transformStyle: 'preserve-3d', height: cardHeight ? `${cardHeight}px` : undefined }}
        >
          {/* Front — clicável para virar */}
          <div
            ref={frontRef}
            onClick={onFlip}
            className={cn(
              'relative overflow-hidden rounded-3xl p-4 sm:p-7 md:p-9 lg:p-12 min-h-[300px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[500px] flex flex-col cursor-pointer select-none',
              'bg-gradient-to-br from-white via-white to-slate-50',
              'dark:from-slate-900 dark:via-slate-900 dark:to-slate-950',
              'border border-slate-200 dark:border-white/10',
              'shadow-[0_30px_120px_-40px_rgba(15,23,42,0.18)] dark:shadow-[0_30px_120px_-40px_rgba(0,0,0,0.7)]',
              'active:scale-[0.995] transition-transform duration-100',
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Sheen de vidro — realce diagonal fixo, efeito "glassmorphism" sutil.
                z-index negativo garante que fique atrás do conteúdo (texto/botões),
                que é fluxo normal e não precisa de z-index próprio. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/70 via-white/0 to-transparent opacity-60 dark:from-white/10 dark:via-transparent" />
            <div aria-hidden className="pointer-events-none absolute inset-x-6 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                {isHidden ? 'Palavra oculta' : 'Frente'}
              </span>
              <span className="text-xs text-slate-400">Toque para virar</span>
            </div>

            {card.front.image && (
              <ClickableImage
                src={card.front.image}
                containerClassName="rounded-2xl overflow-hidden mb-4 border border-slate-200 dark:border-white/10"
                className="w-full h-auto object-contain max-h-64 sm:max-h-72 md:max-h-96 lg:max-h-[30rem] bg-slate-100 dark:bg-slate-950"
              />
            )}

            <div className="flex-1 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">
              {isHidden && card.hiddenWord ? (
                <HiddenWordRender phrase={card.hiddenWord.phrase} word={card.hiddenWord.word} revealed={revealedHidden} />
              ) : (
                renderInline(card.front.text || '')
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
              {isHidden && (
                <button
                  type="button"
                  onClick={e => stopAndCall(e, () => setRevealedHidden(v => !v))}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 ring-1 ring-emerald-500/30"
                >
                  {revealedHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {revealedHidden ? 'Esconder' : 'Revelar palavra'}
                </button>
              )}
              {isHidden && card.hiddenWord?.hint && (
                <button
                  type="button"
                  onClick={e => stopAndCall(e, onToggleHint!)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 ring-1 ring-amber-500/30 transition-colors"
                >
                  <motion.span
                    animate={showHint ? { rotate: 20, scale: 1.15 } : { rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="inline-flex"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                  </motion.span>
                  {showHint ? 'Esconder dica' : 'Ver dica'}
                </button>
              )}
              <button
                type="button"
                onClick={e => stopAndCall(e, onFlip)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ver resposta
              </button>
            </div>

            <AnimatePresence>
              {showHint && card.hiddenWord?.hint && (
                <motion.div
                  key="hint-box"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
                  onClick={e => e.stopPropagation()}
                >
                  <span className="font-semibold">Dica: </span>{card.hiddenWord.hint}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Back — também clicável para voltar */}
          <div
            ref={backRef}
            onClick={onFlip}
            className={cn(
              'absolute inset-x-0 top-0 rounded-3xl p-4 sm:p-7 md:p-9 lg:p-12 min-h-[300px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[500px] flex flex-col cursor-pointer select-none overflow-hidden',
              'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500',
              'text-white border border-white/15',
              'shadow-[0_30px_120px_-40px_rgba(124,58,237,0.55)]',
              'active:scale-[0.995] transition-transform duration-100',
            )}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/25 via-white/0 to-black/10" />
            <div aria-hidden className="pointer-events-none absolute inset-x-6 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                Resposta
              </span>
              <button
                type="button"
                onClick={e => stopAndCall(e, onFlip)}
                className="text-xs text-white/80 hover:text-white"
              >
                Voltar
              </button>
            </div>

            {card.back.image && (
              <ClickableImage
                src={card.back.image}
                onDark
                containerClassName="rounded-2xl overflow-hidden mb-4 border border-white/20"
                className="w-full h-auto object-contain max-h-56 sm:max-h-64 md:max-h-80 lg:max-h-[26rem] bg-black/20"
              />
            )}

            <div className="flex-1 text-base md:text-lg lg:text-xl leading-relaxed text-white/95 whitespace-pre-wrap break-words">
              {isHidden && card.hiddenWord
                ? (
                  <>
                    <HiddenWordRender phrase={card.hiddenWord.phrase} word={card.hiddenWord.word} revealed onDark />
                    {card.back.text && card.back.text !== card.hiddenWord.phrase && (
                      <span className="block mt-3 text-sm text-white/70">{renderInline(card.back.text)}</span>
                    )}
                  </>
                )
                : renderInline(card.back.text || '')}
            </div>

            {card.comment && (
              <button
                type="button"
                onClick={e => stopAndCall(e, onToggleComment)}
                className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-medium bg-white/15 hover:bg-white/25 ring-1 ring-white/30"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {showComment ? 'Esconder comentário' : 'Resposta comentada'}
              </button>
            )}

            <AnimatePresence>
              {showComment && card.comment && (
                <motion.div
                  key="comment-box"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="mt-3 w-full min-w-0 min-h-24 rounded-2xl bg-white/10 ring-1 ring-white/20 px-3.5 py-3 sm:px-4 text-sm leading-relaxed text-white/95 whitespace-pre-wrap break-words overflow-x-hidden max-h-[42vh] sm:max-h-56 overflow-y-auto overscroll-contain"
                  onClick={e => e.stopPropagation()}
                >
                  {renderInline(card.comment)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
