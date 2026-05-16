'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Pencil, Trash2, ShieldCheck, Sparkles } from 'lucide-react'
import { StarRatingDisplay } from './star-rating'
import type { PublicReview } from '@/lib/reviews-shared'

interface ReviewCardProps {
  review: PublicReview
  canEdit?: boolean
  canDelete?: boolean
  onEdit?: (review: PublicReview) => void
  onDelete?: (review: PublicReview) => void
  highlight?: boolean
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || '?'
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

export function ReviewCard({
  review,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  highlight,
}: ReviewCardProps) {
  const [imgError, setImgError] = useState(false)
  const showImage = !!review.avatarUrl && !imgError
  const containerCls = highlight
    ? 'glass-irish-highlight p-4 sm:p-5'
    : 'glass-irish p-4 sm:p-5'

  return (
    <article className={`${containerCls} relative`}>
      {highlight && (
        <span className="absolute -top-2 left-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-irish-gold-soft to-irish-gold text-[10px] font-bold uppercase tracking-wider text-irish-forest shadow-sm">
          <Sparkles className="h-3 w-3" /> Destaque
        </span>
      )}

      <header className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 rounded-full overflow-hidden border border-irish-emerald/25 bg-gradient-to-br from-irish-emerald/15 to-irish-gold/15">
          {showImage ? (
            <Image
              src={review.avatarUrl!}
              alt=""
              fill
              className="object-cover"
              sizes="44px"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-irish-forest dark:text-irish-gold">
              {initials(review.displayName)}
            </span>
          )}
        </div>

        {/* Nome + data + estrelas */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm text-foreground truncate max-w-[200px] sm:max-w-none">
              {review.displayName}
            </span>
            {review.isVerified && (
              <span
                title="Compra verificada"
                className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-irish-emerald"
              >
                <ShieldCheck className="h-3 w-3" /> Verificado
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StarRatingDisplay value={review.rating} size="sm" />
            <span className="text-[11px] text-muted-foreground">{formatDate(review.createdAt)}</span>
          </div>
        </div>

        {/* Ações próprias */}
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-1 -mr-1">
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit?.(review)}
                aria-label="Editar minha avaliação"
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete?.(review)}
                aria-label="Excluir minha avaliação"
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </header>

      {review.comment && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap break-words">
          {review.comment}
        </p>
      )}
    </article>
  )
}
