'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, Lightbulb, MessageSquare, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

  function stopAndCall(e: React.MouseEvent, fn: () => void) {
    e.stopPropagation()
    fn()
  }

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <div className="relative w-full" style={{ perspective: 1600 }}>
        <motion.div
          className="relative w-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front — clicável para virar */}
          <div
            onClick={onFlip}
            className={cn(
              'rounded-3xl p-7 md:p-9 min-h-[320px] md:min-h-[380px] flex flex-col cursor-pointer select-none',
              'bg-gradient-to-br from-white via-white to-slate-50',
              'dark:from-slate-900 dark:via-slate-900 dark:to-slate-950',
              'border border-slate-200 dark:border-white/10',
              'shadow-[0_30px_120px_-40px_rgba(15,23,42,0.18)] dark:shadow-[0_30px_120px_-40px_rgba(0,0,0,0.7)]',
              'active:scale-[0.995] transition-transform duration-100',
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                {isHidden ? 'Palavra oculta' : 'Frente'}
              </span>
              <span className="text-xs text-slate-400">Toque para virar</span>
            </div>

            {card.front.image && (
              <div className="rounded-2xl overflow-hidden mb-4 border border-slate-200 dark:border-white/10">
                <Image src={card.front.image} alt="" width={800} height={500} className="w-full h-auto object-contain max-h-64 bg-slate-100 dark:bg-slate-950" />
              </div>
            )}

            <div className="flex-1 text-lg md:text-xl leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
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
            onClick={onFlip}
            className={cn(
              'absolute inset-0 rounded-3xl p-7 md:p-9 min-h-[320px] md:min-h-[380px] flex flex-col cursor-pointer select-none',
              'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500',
              'text-white border border-white/15',
              'shadow-[0_30px_120px_-40px_rgba(124,58,237,0.55)]',
              'active:scale-[0.995] transition-transform duration-100',
            )}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
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
              <div className="rounded-2xl overflow-hidden mb-4 border border-white/20">
                <Image src={card.back.image} alt="" width={800} height={500} className="w-full h-auto object-contain max-h-56 bg-black/20" />
              </div>
            )}

            <div className="flex-1 text-base md:text-lg leading-relaxed text-white/95 whitespace-pre-wrap break-words">
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
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="mt-3 rounded-2xl bg-white/10 ring-1 ring-white/20 px-4 py-3 text-sm leading-relaxed text-white/95 whitespace-pre-wrap break-words overflow-x-hidden max-h-52 overflow-y-auto"
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
