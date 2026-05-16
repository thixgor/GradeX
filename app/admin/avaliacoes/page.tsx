'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Search,
  Trash2,
  Pencil,
  PlusCircle,
  Lock,
  Unlock,
  Sparkles,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Star,
  ExternalLink,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { LogoLoading } from '@/components/logo-loading'
import { StarRatingDisplay, StarRatingInput } from '@/components/reviews/star-rating'
import type { PublicReview, ReviewTargetType } from '@/lib/reviews'

interface AdminReview extends PublicReview {
  targetTitle: string
}

interface TargetItem {
  _id: string
  title: string
  slug: string | null
  coverImage: string | null
  reviewsLocked: boolean
}

const TYPE_LABEL: Record<ReviewTargetType, string> = {
  material: 'Material',
  flashcard_deck: 'Deck',
}

const TYPE_BADGE: Record<ReviewTargetType, string> = {
  material: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  flashcard_deck: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25',
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const [authChecking, setAuthChecking] = useState(true)

  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterType, setFilterType] = useState<'all' | ReviewTargetType>('all')
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<AdminReview | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<AdminReview | null>(null)
  const [lockTarget, setLockTarget] = useState<{ type: ReviewTargetType; id: string; title: string; locked: boolean } | null>(null)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const me = await fetch('/api/auth/me')
        if (!me.ok) {
          router.push('/auth/login')
          return
        }
        const data = await me.json()
        if (data.user?.role !== 'admin') {
          router.push('/')
          return
        }
      } catch {
        router.push('/auth/login')
        return
      } finally {
        setAuthChecking(false)
      }
    })()
  }, [router])

  const buildQuery = useCallback(
    (cursor?: string | null) => {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.set('targetType', filterType)
      if (search.trim()) params.set('search', search.trim())
      if (cursor) params.set('cursor', cursor)
      return params.toString()
    },
    [filterType, search],
  )

  const fetchInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/reviews?${buildQuery()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Erro ao carregar avaliações')
      const json = await res.json()
      setReviews(json.reviews || [])
      setNextCursor(json.nextCursor)
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar avaliações')
    } finally {
      setLoading(false)
    }
  }, [buildQuery])

  useEffect(() => {
    if (!authChecking) fetchInitial()
  }, [authChecking, fetchInitial])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/admin/reviews?${buildQuery(nextCursor)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Erro ao carregar mais')
      const json = await res.json()
      setReviews(prev => [...prev, ...(json.reviews || [])])
      setNextCursor(json.nextCursor)
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar mais')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message })
    setTimeout(() => setToast(null), 3500)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      const res = await fetch(`/api/admin/reviews/${confirmDelete._id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      setReviews(prev => prev.filter(r => r._id !== confirmDelete._id))
      handleToast('success', 'Avaliação excluída.')
      setConfirmDelete(null)
    } catch (e: any) {
      handleToast('error', e?.message || 'Erro ao excluir')
    }
  }

  const togglePatch = async (
    review: AdminReview,
    patch: Partial<{ isFeatured: boolean; isVerified: boolean }>,
  ) => {
    try {
      const res = await fetch(`/api/admin/reviews/${review._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      const json = await res.json()
      setReviews(prev =>
        prev.map(r => (r._id === review._id ? { ...r, ...json.review, targetTitle: r.targetTitle } : r)),
      )
      handleToast('success', 'Avaliação atualizada.')
    } catch (e: any) {
      handleToast('error', e?.message || 'Erro ao atualizar')
    }
  }

  const filterChanged = useMemo(() => true, [])

  if (authChecking) {
    return <LogoLoading message="Verificando permissões..." size="lg" fullscreen />
  }

  return (
    <AppShell headerTitle="Avaliações" headerSubtitle="Moderação e criação manual">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header com voltar + ação primária */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <Button variant="ghost" onClick={() => router.push('/admin')} className="rounded-xl -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar ao painel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setLockTarget({ type: 'material', id: '', title: '', locked: false })
              }
              className="rounded-xl"
            >
              <Lock className="h-4 w-4 mr-2" /> Travar / destravar
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              className="rounded-xl bg-gradient-to-r from-irish-emerald to-irish-forest text-white font-semibold"
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Nova avaliação manual
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="glass-irish-soft px-3 py-3 mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex items-center gap-1 flex-wrap">
            {(['all', 'material', 'flashcard_deck'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterType === t
                    ? 'bg-irish-emerald text-white shadow-sm'
                    : 'bg-foreground/[0.04] text-foreground/70 hover:bg-foreground/[0.08]'
                }`}
              >
                {t === 'all' ? 'Todos' : TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Buscar por nome do autor ou texto do comentário…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchInitial()}
              className="rounded-lg bg-background/60"
            />
            <Button variant="outline" onClick={() => fetchInitial()} className="rounded-lg">
              Buscar
            </Button>
          </div>
        </div>

        {toast && (
          <div
            className={`mb-4 rounded-xl px-3 py-2 text-sm font-semibold border ${
              toast.kind === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                : 'bg-destructive/10 text-destructive border-destructive/25'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="glass-irish-soft h-24 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : reviews.length === 0 ? (
          <div className="glass-irish-soft px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhuma avaliação encontrada com esses filtros.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r._id} className="glass-irish px-4 py-3 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${TYPE_BADGE[r.targetType]}`}>
                      {TYPE_LABEL[r.targetType]}
                    </span>
                    <a
                      href={
                        r.targetType === 'material'
                          ? `/materiais/${r.targetId}`
                          : `/flashcards/d/${r.targetId}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-foreground hover:underline inline-flex items-center gap-1"
                    >
                      {r.targetTitle}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                  <StarRatingDisplay value={r.rating} size="sm" />
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-semibold text-foreground/80">{r.displayName}</span>
                      {r.isAdminCreated && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                          Manual
                        </span>
                      )}
                      {r.isFeatured && (
                        <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-irish-gold-soft to-irish-gold text-irish-forest text-[10px] font-bold uppercase tracking-wider">
                          Destaque
                        </span>
                      )}
                      {r.isVerified && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-0.5">
                          <ShieldCheck className="h-2.5 w-2.5" /> Verificado
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        · {new Date(r.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-1.5 text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap break-words line-clamp-4">
                        {r.comment}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-foreground/[0.06]">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePatch(r, { isFeatured: !r.isFeatured })}
                    className="rounded-lg h-8 text-xs"
                    title={r.isFeatured ? 'Remover destaque' : 'Marcar como destaque'}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    {r.isFeatured ? 'Remover destaque' : 'Destacar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePatch(r, { isVerified: !r.isVerified })}
                    className="rounded-lg h-8 text-xs"
                  >
                    {r.isVerified ? (
                      <>
                        <ShieldOff className="h-3.5 w-3.5 mr-1" />
                        Remover verificado
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                        Verificar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(r)}
                    className="rounded-lg h-8 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setLockTarget({
                        type: r.targetType,
                        id: r.targetId,
                        title: r.targetTitle,
                        locked: false,
                      })
                    }
                    className="rounded-lg h-8 text-xs"
                  >
                    <Lock className="h-3.5 w-3.5 mr-1" />
                    Travar item
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(r)}
                    className="rounded-lg h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))}

            {nextCursor && (
              <div className="flex justify-center pt-2">
                <Button onClick={loadMore} variant="outline" disabled={loadingMore} className="rounded-xl">
                  {loadingMore ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Carregar mais
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modais */}
      {createOpen && (
        <ReviewFormModal
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSuccess={review => {
            setCreateOpen(false)
            setReviews(prev => [{ ...review, targetTitle: review.targetTitle || '' }, ...prev])
            handleToast('success', 'Avaliação manual criada.')
          }}
        />
      )}

      {editing && (
        <ReviewFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSuccess={review => {
            setReviews(prev =>
              prev.map(r =>
                r._id === editing._id ? { ...r, ...review, targetTitle: r.targetTitle } : r,
              ),
            )
            setEditing(null)
            handleToast('success', 'Avaliação atualizada.')
          }}
        />
      )}

      {lockTarget && (
        <LockModal
          initial={lockTarget}
          onClose={() => setLockTarget(null)}
          onSuccess={msg => {
            setLockTarget(null)
            handleToast('success', msg)
          }}
        />
      )}

      <Dialog open={!!confirmDelete} onOpenChange={open => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir avaliação?</DialogTitle>
            <DialogDescription>
              Essa ação é permanente. A avaliação será removida da página pública do item.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Modal: criar / editar avaliação manual
// ─────────────────────────────────────────────────────────────────────

interface ReviewFormModalProps {
  mode: 'create' | 'edit'
  initial?: AdminReview
  onClose: () => void
  onSuccess: (review: AdminReview) => void
}

function ReviewFormModal({ mode, initial, onClose, onSuccess }: ReviewFormModalProps) {
  const [targetType, setTargetType] = useState<ReviewTargetType>(initial?.targetType || 'material')
  const [targetId, setTargetId] = useState(initial?.targetId || '')
  const [targetTitle, setTargetTitle] = useState(initial?.targetTitle || '')
  const [targetSearch, setTargetSearch] = useState('')
  const [targets, setTargets] = useState<TargetItem[]>([])
  const [loadingTargets, setLoadingTargets] = useState(false)

  const [rating, setRating] = useState<number>(initial?.rating || 5)
  const [comment, setComment] = useState(initial?.comment || '')
  const [displayName, setDisplayName] = useState(initial?.displayName || '')
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatarUrl || '')
  const [createdAt, setCreatedAt] = useState(
    initial?.createdAt
      ? new Date(initial.createdAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  )
  const [isFeatured, setIsFeatured] = useState(!!initial?.isFeatured)
  const [isVerified, setIsVerified] = useState(!!initial?.isVerified)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchTargets = useCallback(
    async (q: string) => {
      setLoadingTargets(true)
      try {
        const params = new URLSearchParams({ targetType })
        if (q) params.set('q', q)
        const res = await fetch(`/api/admin/reviews/targets?${params.toString()}`)
        if (res.ok) {
          const json = await res.json()
          setTargets(json.targets || [])
        }
      } finally {
        setLoadingTargets(false)
      }
    },
    [targetType],
  )

  useEffect(() => {
    if (mode === 'create') {
      const handle = setTimeout(() => searchTargets(targetSearch), 200)
      return () => clearTimeout(handle)
    }
  }, [mode, targetSearch, searchTargets])

  const submit = async () => {
    setError(null)
    if (mode === 'create' && !targetId) {
      setError('Selecione um material ou deck para anexar a avaliação.')
      return
    }
    if (!displayName.trim()) {
      setError('Informe o nome do autor.')
      return
    }
    if (rating < 1 || rating > 5) {
      setError('Nota deve ser entre 1 e 5.')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'create') {
        const res = await fetch('/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetType,
            targetId,
            rating,
            comment,
            displayName,
            avatarUrl: avatarUrl.trim() || null,
            createdAt: new Date(createdAt + 'T12:00:00').toISOString(),
            isFeatured,
            isVerified,
          }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.error || 'Erro ao criar')
        }
        const json = await res.json()
        onSuccess({ ...json.review, targetTitle })
      } else {
        const res = await fetch(`/api/admin/reviews/${initial!._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating,
            comment,
            ...(initial!.isAdminCreated
              ? {
                  displayName,
                  avatarUrl: avatarUrl.trim() || null,
                  createdAt: new Date(createdAt + 'T12:00:00').toISOString(),
                }
              : {}),
            isFeatured,
            isVerified,
          }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.error || 'Erro ao salvar')
        }
        const json = await res.json()
        onSuccess(json.review)
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao enviar')
    } finally {
      setSubmitting(false)
    }
  }

  const canEditMeta = mode === 'create' || !!initial?.isAdminCreated

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nova avaliação manual' : 'Editar avaliação'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Crie uma avaliação com nome, foto e data customizados.'
              : initial?.isAdminCreated
                ? 'Avaliação manual: você pode editar todos os campos.'
                : 'Avaliação de usuário real: somente nota, comentário, destaque e verificação podem ser alterados.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Alvo (somente create) */}
          {mode === 'create' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo de item
              </label>
              <div className="flex items-center gap-1">
                {(['material', 'flashcard_deck'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTargetType(t)
                      setTargetId('')
                      setTargetTitle('')
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      targetType === t
                        ? 'bg-irish-emerald text-white'
                        : 'bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.1]'
                    }`}
                  >
                    {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {TYPE_LABEL[targetType]}
              </label>
              <Input
                placeholder={`Buscar ${TYPE_LABEL[targetType].toLowerCase()} pelo título…`}
                value={targetSearch}
                onChange={e => setTargetSearch(e.target.value)}
              />
              {targetId && (
                <div className="px-3 py-2 rounded-lg bg-irish-emerald/10 border border-irish-emerald/25 text-sm flex items-center justify-between gap-2">
                  <span className="font-semibold truncate">{targetTitle}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetId('')
                      setTargetTitle('')
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    trocar
                  </button>
                </div>
              )}
              {!targetId && (
                <div className="max-h-40 overflow-y-auto border border-border/40 rounded-lg divide-y divide-border/40">
                  {loadingTargets ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Buscando…</div>
                  ) : targets.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum resultado.</div>
                  ) : (
                    targets.map(t => (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => {
                          setTargetId(t._id)
                          setTargetTitle(t.title)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-foreground/[0.04] flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{t.title}</span>
                        {t.reviewsLocked && (
                          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                            travado
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nota */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nota
            </label>
            <div className="flex items-center gap-3">
              <StarRatingInput
                value={rating}
                onChange={v => setRating(v)}
                size="lg"
                disabled={submitting}
              />
              <span className="text-sm font-semibold">{rating}/5</span>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nome do autor {!canEditMeta && <span className="font-normal lowercase">(somente avaliações manuais)</span>}
            </label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              disabled={!canEditMeta || submitting}
              placeholder="Ex: Maria Aluna"
            />
          </div>

          {/* Avatar */}
          {canEditMeta && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                URL do avatar (opcional)
              </label>
              <Input
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                disabled={submitting}
                placeholder="https://… ou /uploads/…"
              />
            </div>
          )}

          {/* Data */}
          {canEditMeta && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data da avaliação
              </label>
              <Input
                type="date"
                value={createdAt}
                onChange={e => setCreatedAt(e.target.value)}
                disabled={submitting}
              />
            </div>
          )}

          {/* Comentário */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Comentário
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 1500))}
              disabled={submitting}
              rows={5}
              className="w-full rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:border-irish-emerald/50 focus:ring-2 focus:ring-irish-emerald/15 resize-y"
              placeholder="Texto da avaliação…"
            />
            <p className="text-[10px] text-muted-foreground">{comment.length}/1500</p>
          </div>

          {/* Flags */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
                disabled={submitting}
              />
              <Sparkles className="h-4 w-4 text-irish-gold" /> Destaque
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isVerified}
                onChange={e => setIsVerified(e.target.checked)}
                disabled={submitting}
              />
              <ShieldCheck className="h-4 w-4 text-irish-emerald" /> Compra verificada
            </label>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="bg-gradient-to-r from-irish-emerald to-irish-forest text-white"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Star className="h-4 w-4 mr-2" />}
            {mode === 'create' ? 'Criar avaliação' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Modal: travar/destravar avaliações de um item
// ─────────────────────────────────────────────────────────────────────

interface LockModalProps {
  initial: { type: ReviewTargetType; id: string; title: string; locked: boolean }
  onClose: () => void
  onSuccess: (msg: string) => void
}

function LockModal({ initial, onClose, onSuccess }: LockModalProps) {
  const [targetType, setTargetType] = useState<ReviewTargetType>(initial.type)
  const [targetId, setTargetId] = useState(initial.id)
  const [targetTitle, setTargetTitle] = useState(initial.title)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<TargetItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = useCallback(
    async (q: string) => {
      const params = new URLSearchParams({ targetType })
      if (q) params.set('q', q)
      const res = await fetch(`/api/admin/reviews/targets?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setResults(json.targets || [])
      }
    },
    [targetType],
  )

  useEffect(() => {
    const handle = setTimeout(() => fetchResults(search), 200)
    return () => clearTimeout(handle)
  }, [search, fetchResults])

  const apply = async (locked: boolean) => {
    if (!targetId) {
      setError('Selecione um item.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/reviews/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, locked }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Erro')
      }
      onSuccess(locked ? 'Avaliações travadas.' : 'Avaliações destravadas.')
    } catch (e: any) {
      setError(e?.message || 'Erro')
    } finally {
      setSubmitting(false)
    }
  }

  const selected = results.find(r => r._id === targetId)

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Travar / destravar avaliações</DialogTitle>
          <DialogDescription>
            Quando travado, ninguém pode criar nem editar avaliações nesse item — mas as existentes continuam visíveis.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-3">
          <div className="flex items-center gap-1">
            {(['material', 'flashcard_deck'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTargetType(t)
                  setTargetId('')
                  setTargetTitle('')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  targetType === t
                    ? 'bg-irish-emerald text-white'
                    : 'bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.1]'
                }`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          {targetId ? (
            <div className="px-3 py-2 rounded-lg bg-irish-emerald/10 border border-irish-emerald/25 text-sm flex items-center justify-between">
              <span className="font-semibold truncate">{targetTitle}</span>
              <button
                type="button"
                onClick={() => {
                  setTargetId('')
                  setTargetTitle('')
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                trocar
              </button>
            </div>
          ) : (
            <>
              <Input
                placeholder="Buscar pelo título…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="max-h-48 overflow-y-auto border border-border/40 rounded-lg divide-y divide-border/40">
                {results.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum resultado.</div>
                ) : (
                  results.map(t => (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => {
                        setTargetId(t._id)
                        setTargetTitle(t.title)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-foreground/[0.04] flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{t.title}</span>
                      {t.reviewsLocked ? (
                        <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                          <Lock className="h-3 w-3" /> travado
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <Unlock className="h-3 w-3" /> livre
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {selected?.reviewsLocked && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Este item está atualmente travado.
            </p>
          )}

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Fechar
          </Button>
          <Button
            variant="outline"
            onClick={() => apply(false)}
            disabled={submitting || !targetId}
          >
            <Unlock className="h-4 w-4 mr-2" /> Destravar
          </Button>
          <Button
            onClick={() => apply(true)}
            disabled={submitting || !targetId}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-white"
          >
            <Lock className="h-4 w-4 mr-2" /> Travar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
