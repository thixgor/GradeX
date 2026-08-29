'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Lock, Loader2, MessageSquarePlus, ShieldCheck, LogIn } from 'lucide-react'
import { ReviewCard } from './review-card'
import { ReviewForm } from './review-form'
import { ReviewSummaryBlock } from './review-summary'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import type { PublicReview, ReviewSummary, ReviewTargetType } from '@/lib/reviews-shared'

interface ReviewsApiResponse {
  reviews: PublicReview[]
  summary: ReviewSummary
  userReview: PublicReview | null
  canReview: boolean
  hasAccess: boolean
  isAuthenticated: boolean
  reviewsLocked: boolean
  nextCursor: string | null
}

interface ReviewsSectionProps {
  targetType: ReviewTargetType
  targetId: string
  /** Mostra apenas o resumo (sem lista). Útil para o topo. */
  summaryOnly?: boolean
  /** Função para sincronizar o resumo com um indicador superior. */
  onSummaryChange?: (summary: ReviewSummary) => void
  /** Texto para o CTA "Compre para avaliar" — passado pela página. */
  purchaseCtaLabel?: string
  /** Callback para o botão "Comprar para avaliar". */
  onPurchaseClick?: () => void
  /** Permite saltar para a seção a partir do resumo do topo. */
  id?: string
}

const PAGE_SIZE = 20

export function ReviewsSection({
  targetType,
  targetId,
  summaryOnly = false,
  onSummaryChange,
  purchaseCtaLabel = 'Comprar para avaliar',
  onPurchaseClick,
  id,
}: ReviewsSectionProps) {
  const [data, setData] = useState<ReviewsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<PublicReview | null>(null)
  const [moreReviews, setMoreReviews] = useState<PublicReview[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loginHref, setLoginHref] = useState('/auth/login')
  const summaryNotified = useRef<number>(-1)

  // O redirect só existe no cliente — evita divergência de hidratação.
  useEffect(() => {
    setLoginHref(
      `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
    )
  }, [])

  const fetchInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ targetType, targetId, limit: String(PAGE_SIZE) })
      const res = await fetch(`/api/reviews?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Erro ao carregar avaliações')
      }
      const json = (await res.json()) as ReviewsApiResponse
      setData(json)
      setMoreReviews([])
      setNextCursor(json.nextCursor)
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar avaliações')
    } finally {
      setLoading(false)
    }
  }, [targetType, targetId])

  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  // Notifica o parent sobre mudanças de resumo (para o componente compacto no topo)
  useEffect(() => {
    if (!data || !onSummaryChange) return
    const fp = data.summary.count * 100 + Math.round(data.summary.avg * 10)
    if (summaryNotified.current !== fp) {
      summaryNotified.current = fp
      onSummaryChange(data.summary)
    }
  }, [data, onSummaryChange])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const params = new URLSearchParams({
        targetType,
        targetId,
        limit: String(PAGE_SIZE),
        cursor: nextCursor,
      })
      const res = await fetch(`/api/reviews?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Erro ao carregar mais avaliações')
      const json = (await res.json()) as ReviewsApiResponse
      setMoreReviews(prev => [...prev, ...json.reviews])
      setNextCursor(json.nextCursor)
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar mais avaliações')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSubmit = async ({ rating, comment }: { rating: 1 | 2 | 3 | 4 | 5; comment: string }) => {
    setSubmitting(true)
    setFormError(null)
    try {
      const isEdit = editing && data?.userReview
      const url = isEdit ? `/api/reviews/${data!.userReview!._id}` : '/api/reviews'
      const method = isEdit ? 'PATCH' : 'POST'
      const body = isEdit ? { rating, comment } : { targetType, targetId, rating, comment }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Erro ao enviar avaliação')
      }
      setShowForm(false)
      setEditing(false)
      await fetchInitial()
    } catch (e: any) {
      setFormError(e?.message || 'Erro ao enviar avaliação')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reviews/${confirmDelete._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Erro ao excluir avaliação')
      }
      setConfirmDelete(null)
      await fetchInitial()
    } catch (e: any) {
      setError(e?.message || 'Erro ao excluir avaliação')
    } finally {
      setSubmitting(false)
    }
  }

  const allReviews = useMemo(() => {
    if (!data) return [] as PublicReview[]
    return [...data.reviews, ...moreReviews]
  }, [data, moreReviews])

  // O componente vazio/loading do resumo é controlado por summaryOnly
  if (summaryOnly) {
    return <ReviewSummaryBlock summary={data?.summary || null} variant="compact" loading={loading} />
  }

  return (
    <section id={id} className="mt-6 space-y-4">
      {/* Cabeçalho + resumo */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground flex items-center gap-2">
            <span className="irish-star-shine">★</span> Avaliações
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            O que outros alunos acharam deste {targetType === 'material' ? 'material' : 'deck'}.
          </p>
        </div>
      </div>

      <ReviewSummaryBlock summary={data?.summary || null} variant="full" loading={loading} />

      {/* Aviso de avaliações travadas */}
      {data?.reviewsLocked && (
        <div className="glass-irish-soft px-4 py-3 flex items-start gap-2.5">
          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Avaliações temporariamente desativadas para este item. Você ainda pode ler as avaliações
            existentes, mas não é possível criar ou editar agora.
          </p>
        </div>
      )}

      {/* Bloco "sua avaliação" / form */}
      {!data?.reviewsLocked && data?.isAuthenticated && (
        <div className="space-y-2">
          {/* Já tem avaliação → mostra modo editar */}
          {data.userReview && !editing && !showForm && (
            <div className="glass-irish-highlight px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-irish-emerald flex-shrink-0" />
                <span className="font-semibold">Sua avaliação foi enviada — obrigado!</span>
              </div>
            </div>
          )}

          {/* Pode criar/editar */}
          {data.canReview && !showForm && !editing && (
            <Button
              type="button"
              onClick={() => {
                setShowForm(true)
                setFormError(null)
              }}
              className="rounded-xl bg-gradient-to-r from-irish-emerald to-irish-forest text-white font-semibold hover:from-irish-emerald hover:to-irish-emerald shadow-md shadow-irish-emerald/20"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              {data.userReview ? 'Editar minha avaliação' : 'Avaliar este ' + (targetType === 'material' ? 'material' : 'deck')}
            </Button>
          )}

          {(showForm || editing) && data.canReview && (
            <ReviewForm
              initialRating={editing && data.userReview ? data.userReview.rating : 0}
              initialComment={editing && data.userReview ? data.userReview.comment : ''}
              submitting={submitting}
              error={formError}
              mode={editing ? 'edit' : 'create'}
              onCancel={() => {
                setShowForm(false)
                setEditing(false)
                setFormError(null)
              }}
              onSubmit={handleSubmit}
            />
          )}

          {/* Sem acesso → CTA pra comprar */}
          {!data.canReview && !data.userReview && (
            <div className="glass-irish-soft px-4 py-3 flex items-start sm:items-center gap-3 flex-wrap">
              <div className="flex items-start gap-2 flex-1 min-w-[200px]">
                <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Avaliações são exclusivas para quem já tem acesso a este conteúdo.
                </p>
              </div>
              {onPurchaseClick && (
                <Button
                  type="button"
                  onClick={onPurchaseClick}
                  size="sm"
                  className="rounded-xl bg-gradient-to-r from-irish-emerald to-irish-forest text-white font-semibold"
                >
                  {purchaseCtaLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Não autenticado */}
      {!data?.reviewsLocked && data && !data.isAuthenticated && (
        <div className="glass-irish-soft px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-irish-emerald/25 bg-irish-emerald/10 text-irish-emerald">
              <LogIn className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Entre para avaliar
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Faça login na sua conta para dar sua nota e comentar este{' '}
                {targetType === 'material' ? 'material' : 'deck'}.
              </p>
            </div>
          </div>
          <a
            href={loginHref}
            className="inline-flex h-9 w-full sm:w-auto flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-irish-emerald to-irish-forest px-4 text-sm font-semibold text-white shadow-md shadow-irish-emerald/20 transition hover:opacity-95"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </a>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="glass-irish-soft h-24 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : allReviews.length === 0 ? (
        <div className="glass-irish-soft px-5 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Ainda não há avaliações. Seja o primeiro a opinar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allReviews.map(r => {
            const isOwn = !!data?.userReview && data.userReview._id === r._id
            return (
              <ReviewCard
                key={r._id}
                review={r}
                highlight={r.isFeatured}
                canEdit={isOwn && !data?.reviewsLocked}
                canDelete={isOwn && !data?.reviewsLocked}
                onEdit={() => {
                  setEditing(true)
                  setShowForm(false)
                  setFormError(null)
                  // scroll para o form
                  setTimeout(() => {
                    document.getElementById('reviews-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }, 100)
                }}
                onDelete={review => setConfirmDelete(review)}
              />
            )
          })}
          <span id="reviews-form-anchor" />

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

      <Dialog open={!!confirmDelete} onOpenChange={open => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir avaliação?</DialogTitle>
            <DialogDescription>
              Sua avaliação será removida permanentemente. Você poderá enviar uma nova depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
