'use client'

import { useEffect, useState } from 'react'
import { Loader2, Send, X } from 'lucide-react'
import { StarRatingInput } from './star-rating'
import { Button } from '@/components/ui/button'
import { REVIEW_COMMENT_MAX } from '@/lib/reviews-shared'

interface ReviewFormProps {
  initialRating?: number
  initialComment?: string
  submitting?: boolean
  error?: string | null
  mode?: 'create' | 'edit'
  onCancel?: () => void
  onSubmit: (data: { rating: 1 | 2 | 3 | 4 | 5; comment: string }) => void | Promise<void>
}

export function ReviewForm({
  initialRating = 0,
  initialComment = '',
  submitting,
  error,
  mode = 'create',
  onCancel,
  onSubmit,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(initialRating)
  const [comment, setComment] = useState<string>(initialComment)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setRating(initialRating)
    setComment(initialComment)
  }, [initialRating, initialComment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!rating || rating < 1 || rating > 5) {
      setLocalError('Escolha uma nota de 1 a 5 estrelas.')
      return
    }
    setLocalError(null)
    await onSubmit({ rating: rating as 1 | 2 | 3 | 4 | 5, comment: comment.trim() })
  }

  const charCount = comment.length
  const overLimit = charCount > REVIEW_COMMENT_MAX

  return (
    <form onSubmit={handleSubmit} className="glass-irish p-4 sm:p-5 space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Sua nota
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <StarRatingInput value={rating} onChange={v => setRating(v)} size="xl" disabled={submitting} />
          {rating > 0 && (
            <span className="text-sm font-semibold text-irish-forest dark:text-irish-gold">
              {rating}/5
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="review-comment" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Comentário <span className="font-normal lowercase text-muted-foreground/70">(opcional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={e => setComment(e.target.value.slice(0, REVIEW_COMMENT_MAX + 50))}
          disabled={submitting}
          rows={4}
          placeholder="Compartilhe sua experiência com este material..."
          className="w-full rounded-xl border border-irish-emerald/20 bg-white/60 dark:bg-white/[0.04] backdrop-blur-sm px-3.5 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-irish-emerald/50 focus:ring-2 focus:ring-irish-emerald/15 transition-all resize-y min-h-[100px]"
        />
        <div className="flex items-center justify-between text-[11px]">
          <span className={overLimit ? 'text-destructive font-semibold' : 'text-muted-foreground/70'}>
            {charCount}/{REVIEW_COMMENT_MAX}
          </span>
          <span className="text-muted-foreground/60">Seu nome real aparecerá na avaliação</span>
        </div>
      </div>

      {(error || localError) && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive">
          {error || localError}
        </div>
      )}

      <div className="flex items-center gap-2 justify-end">
        {mode === 'edit' && onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            variant="ghost"
            className="rounded-xl"
          >
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting || overLimit || !rating}
          className="rounded-xl bg-gradient-to-r from-irish-emerald to-irish-forest text-white font-semibold hover:from-irish-emerald hover:to-irish-emerald shadow-md shadow-irish-emerald/20 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-1.5" />
              {mode === 'edit' ? 'Salvar alterações' : 'Enviar avaliação'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
