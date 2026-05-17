'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Brain, FileText, MessageSquarePlus, Star, X } from 'lucide-react'

interface PendingReviewItem {
  targetType: 'material' | 'flashcard_deck'
  targetId: string
  title: string
  coverImage: string | null
  kind: 'material' | 'flashcard'
  href: string
  purchasedAt: string | null
}

interface PendingReviewsResponse {
  items: PendingReviewItem[]
  total: number
}

const SNOOZE_KEY = 'domineaqui-pending-reviews-snoozed-until'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

function isSnoozed() {
  if (typeof window === 'undefined') return true
  const until = Number(window.localStorage.getItem(SNOOZE_KEY) || 0)
  return Number.isFinite(until) && until > Date.now()
}

function titlePreview(items: PendingReviewItem[], total: number) {
  const names = items.slice(0, 2).map(item => item.title)
  if (names.length === 0) return ''
  const suffix = total > names.length ? ` +${total - names.length}` : ''
  return `${names.join(', ')}${suffix}`
}

export function PendingReviewReminder() {
  const [items, setItems] = useState<PendingReviewItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (isSnoozed()) {
      setLoading(false)
      return
    }

    setDismissed(false)
    let cancelled = false

    fetch('/api/reviews/pending', { cache: 'no-store' })
      .then(async res => {
        if (!res.ok) return { items: [], total: 0 }
        return (await res.json()) as PendingReviewsResponse
      })
      .then(data => {
        if (cancelled) return
        setItems(data.items || [])
        setTotal(data.total || 0)
      })
      .catch(() => {
        if (!cancelled) {
          setItems([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const preview = useMemo(() => titlePreview(items, total), [items, total])
  const firstItem = items[0]
  const hiddenCount = Math.max(0, total - Math.min(items.length, 3))

  if (loading || dismissed || total === 0 || !firstItem) return null

  function snooze() {
    window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS))
    setDismissed(true)
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/55 p-4 shadow-lg shadow-emerald-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(70,129,82,0.10),rgba(255,255,255,0.12)_45%,rgba(226,164,62,0.10))] dark:bg-[linear-gradient(135deg,rgba(70,129,82,0.14),rgba(255,255,255,0.03)_45%,rgba(226,164,62,0.10))]" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-400/15 text-amber-600 dark:text-amber-300">
            <Star className="h-4 w-4 fill-current" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight sm:text-base">Avaliação rapidinha pendente</h2>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                {total} {total === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Você comprou {total === 1 ? 'um conteúdo' : 'alguns conteúdos'} e ainda não deixou sua nota. Leva menos de um minuto.
            </p>
            {preview && (
              <p className="mt-1 truncate text-[11px] text-muted-foreground/80 sm:text-xs">
                {preview}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:justify-end">
          <div className="flex min-w-0 items-center -space-x-2">
            {items.slice(0, 3).map(item => (
              <Link
                key={`${item.targetType}:${item.targetId}`}
                href={item.href}
                title={item.title}
                className="group relative h-10 w-10 overflow-hidden rounded-xl border border-white/60 bg-background shadow-sm transition-transform hover:-translate-y-0.5 dark:border-white/10"
              >
                {item.coverImage ? (
                  <Image
                    src={item.coverImage}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                    {item.kind === 'flashcard' ? <Brain className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </span>
                )}
              </Link>
            ))}
            {hiddenCount > 0 && (
              <span className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-white/60 bg-background px-2 text-xs font-semibold text-muted-foreground shadow-sm dark:border-white/10">
                +{hiddenCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={firstItem.href}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
              Avaliar
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={snooze}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/50 bg-white/30 text-muted-foreground transition-colors hover:text-foreground dark:border-white/10 dark:bg-white/5"
              aria-label="Lembrar depois"
              title="Lembrar depois"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
