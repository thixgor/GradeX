'use client'

import { StarRatingDisplay } from './star-rating'
import type { ReviewSummary } from '@/lib/reviews'

interface ReviewSummaryProps {
  summary: ReviewSummary | null
  variant?: 'compact' | 'inline' | 'full'
  loading?: boolean
  onJumpToList?: () => void
  className?: string
}

function formatCount(n: number) {
  if (n === 0) return 'Sem avaliações'
  if (n === 1) return '1 avaliação'
  return `${n.toLocaleString('pt-BR')} avaliações`
}

/**
 * Bloco de resumo "média + estrelas + nº de avaliações".
 * - compact: para o topo (perto do CTA).
 * - inline: linha enxuta, usada na listagem.
 * - full: card destacado, usado no topo da seção completa.
 */
export function ReviewSummaryBlock({
  summary,
  variant = 'compact',
  loading,
  onJumpToList,
  className = '',
}: ReviewSummaryProps) {
  if (loading) {
    return (
      <div className={`glass-irish-soft px-3 py-2 inline-flex items-center gap-2 ${className}`}>
        <span className="h-4 w-20 rounded bg-foreground/10 animate-pulse" />
        <span className="h-3 w-16 rounded bg-foreground/10 animate-pulse" />
      </div>
    )
  }

  const count = summary?.count ?? 0
  const avg = summary?.avg ?? 0
  const hasReviews = count > 0

  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <StarRatingDisplay value={avg} size="sm" />
        <span className="text-xs font-semibold text-foreground/80">{hasReviews ? avg.toFixed(1) : '—'}</span>
        <span className="text-[11px] text-muted-foreground">({count.toLocaleString('pt-BR')})</span>
      </div>
    )
  }

  if (variant === 'compact') {
    const inner = (
      <div className={`glass-irish px-3 py-2.5 inline-flex items-center gap-2.5 ${className}`}>
        <div className="flex flex-col items-center justify-center min-w-[36px]">
          <span className="font-heading font-bold text-lg leading-none irish-star-shine">
            {hasReviews ? avg.toFixed(1) : '—'}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">de 5</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <StarRatingDisplay value={avg} size="sm" />
          <span className="text-[11px] text-muted-foreground font-medium">{formatCount(count)}</span>
        </div>
      </div>
    )
    if (onJumpToList && hasReviews) {
      return (
        <button
          type="button"
          onClick={onJumpToList}
          className="block text-left transition-transform hover:scale-[1.015] active:scale-[0.99]"
          aria-label="Ver avaliações"
        >
          {inner}
        </button>
      )
    }
    return inner
  }

  // variant === 'full'
  const distribution = summary?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  return (
    <div className={`glass-irish px-5 py-5 sm:px-7 sm:py-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* coluna esquerda: média gigante */}
        <div className="flex sm:flex-col items-center gap-4 sm:gap-1 sm:min-w-[140px]">
          <div className="flex flex-col items-center">
            <span className="font-heading font-bold text-5xl leading-none irish-star-shine">
              {hasReviews ? avg.toFixed(1) : '—'}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">de 5,0</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <StarRatingDisplay value={avg} size="md" />
            <span className="text-xs font-medium text-muted-foreground">{formatCount(count)}</span>
          </div>
        </div>

        {/* coluna direita: distribuição */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {[5, 4, 3, 2, 1].map(stars => {
            const c = distribution[stars as 1 | 2 | 3 | 4 | 5] ?? 0
            const pct = count > 0 ? Math.round((c / count) * 100) : 0
            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-3 font-semibold text-foreground/70">{stars}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" className="irish-star flex-shrink-0">
                  <path
                    d="M12 2.4l2.94 6.06 6.66.97-4.82 4.72 1.14 6.66L12 17.74l-5.92 3.07 1.14-6.66L2.4 9.43l6.66-.97L12 2.4z"
                    fill="#F0C563"
                    stroke="#B98726"
                    strokeWidth="0.65"
                  />
                </svg>
                <div className="flex-1 h-2 rounded-full bg-foreground/[0.06] dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-irish-emerald to-irish-gold transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-9 text-right tabular-nums text-muted-foreground">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
