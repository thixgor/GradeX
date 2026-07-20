'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ReviewCard } from './review-card'
import { ReviewSummaryBlock } from './review-summary'
import { Button } from '@/components/ui/button'
import type { PublicReview, ReviewSummary } from '@/lib/reviews-shared'

type PackageReview = PublicReview & { sourceTitle?: string | null }

interface PackageReviewsApiResponse {
  reviews: PackageReview[]
  summary: ReviewSummary
  nextCursor: string | null
}

interface PackageReviewsProps {
  packageId: string
  /** Sincroniza o resumo com um indicador compacto no topo da página. */
  onSummaryChange?: (summary: ReviewSummary) => void
  id?: string
}

const PAGE_SIZE = 20

/**
 * Prova social do pacote: reúne as avaliações de todos os materiais que
 * compõem o pacote (média, distribuição e lista). Somente leitura — a
 * avaliação em si acontece na página de cada material.
 */
export function PackageReviews({ packageId, onSummaryChange, id }: PackageReviewsProps) {
  const [reviews, setReviews] = useState<PackageReview[]>([])
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const summaryNotified = useRef<number>(-1)

  const fetchInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/materiais/packages/${packageId}/reviews?limit=${PAGE_SIZE}`,
        { cache: 'no-store' },
      )
      if (!res.ok) throw new Error('Erro ao carregar avaliações')
      const json = (await res.json()) as PackageReviewsApiResponse
      setReviews(json.reviews)
      setSummary(json.summary)
      setNextCursor(json.nextCursor)
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar avaliações')
    } finally {
      setLoading(false)
    }
  }, [packageId])

  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  useEffect(() => {
    if (!summary || !onSummaryChange) return
    const fp = summary.count * 100 + Math.round(summary.avg * 10)
    if (summaryNotified.current !== fp) {
      summaryNotified.current = fp
      onSummaryChange(summary)
    }
  }, [summary, onSummaryChange])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(
        `/api/materiais/packages/${packageId}/reviews?limit=${PAGE_SIZE}&cursor=${nextCursor}`,
        { cache: 'no-store' },
      )
      if (!res.ok) throw new Error('Erro ao carregar mais avaliações')
      const json = (await res.json()) as PackageReviewsApiResponse
      setReviews((prev) => [...prev, ...json.reviews])
      setNextCursor(json.nextCursor)
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar mais avaliações')
    } finally {
      setLoadingMore(false)
    }
  }

  // Não mostra a seção inteira quando não há nenhuma avaliação — evita um
  // bloco vazio; a média some naturalmente e a página fica mais limpa.
  if (!loading && (summary?.count ?? 0) === 0) return null

  return (
    <section id={id} className="mt-6 space-y-4">
      <div>
        <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground flex items-center gap-2">
          <span className="irish-star-shine">★</span> Avaliações do pacote
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          O que os alunos acharam dos materiais incluídos neste pacote.
        </p>
      </div>

      <ReviewSummaryBlock summary={summary} variant="full" loading={loading} />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-irish-soft h-24 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard
              key={r._id}
              review={r}
              highlight={r.isFeatured}
              sourceTitle={r.sourceTitle}
            />
          ))}

          {nextCursor && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-xl"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando…
                  </>
                ) : (
                  'Carregar mais avaliações'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
