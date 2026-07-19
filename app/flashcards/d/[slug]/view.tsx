'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  Heart,
  Share2,
  Lock,
  ShoppingCart,
  CheckCircle2,
  EyeOff,
  Globe,
  Link as LinkIcon,
  Trophy,
  Sparkles,
  Users,
  Crown,
  RotateCcw,
  Play,
  ChevronLeft,
  ChevronRight,
  Folder,
  ChevronDown,
  ChevronUp,
  Trash2,
  Square,
  CheckSquare,
  Loader2,
  Brain,
  CalendarClock,
  BarChart3,
  Flame,
  Leaf,
  AlertTriangle,
  Download,
  X,
  Bookmark,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { ToastAlert } from '@/components/ui/toast-alert'
import { PackageUpsellModal, UpsellPackage } from '@/components/materiais/package-upsell-modal'
import { FlashcardCardView } from '@/components/flashcards/flashcard-card'
import { TiltCard } from '@/components/tilt-card'
import { GlassHeroSurface } from '@/components/glass-hero-surface'
import { cn } from '@/lib/utils'
import type { FlashcardManualCard, FlashcardManualDeck } from '@/lib/types'
import {
  DEFAULT_PUBLIC_METRIC_SETTINGS,
  type PublicMetricSettings,
} from '@/lib/display-settings'
import { ReviewsSection } from '@/components/reviews/reviews-section'
import { ReviewSummaryBlock } from '@/components/reviews/review-summary'
import type { ReviewSummary } from '@/lib/reviews-shared'
import {
  loadProgress,
  saveProgress,
  clearProgress,
  type FlashcardProgress,
} from '@/lib/flashcard-progress'
import {
  PricingEventCountdown,
  type PricingEventStatePayload,
} from '@/components/pricing-events/PricingEventCountdown'
import { PricingEventBadge } from '@/components/pricing-events/PricingEventBadge'

interface AccessFlags {
  hasAccess: boolean
  isOwner: boolean
  isPurchased: boolean
  hasGroupAccess: boolean
  hasShareAccess: boolean
  reasons: string[]
}

interface DeckResponse {
  deck: FlashcardManualDeck & { _id: string }
  cards: (FlashcardManualCard & { _id: string; spacedProgress?: SpacedProgressResponse | null })[]
  spacedRepetition?: {
    stats: SpacedRepetitionStats
  }
  access: AccessFlags & { canManage: boolean }
  viewer: { isAuthenticated: boolean; isAdmin: boolean; userId: string | null; emailVerified: boolean }
  pricingEventState?: PricingEventStatePayload | null
}

type StudyMode = 'normal' | 'spaced'
type SpacedRating = 'SUAVE' | 'NO_PONTO' | 'PORRETE'

interface SpacedProgressResponse {
  _id?: string
  userId: string
  cardId: string
  deckId: string
  rating: SpacedRating
  reviewCount: number
  correctStreak: number
  easeFactor: number
  intervalDays: number
  nextReviewAt: string | null
  lastReviewedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface SpacedRepetitionStats {
  dueToday: number
  newCards: number
  mastered: number
  difficult: number
}

const RATINGS = [
  { value: 'facil' as const, label: 'Suave', color: 'from-emerald-500 to-emerald-600', shortcut: '1' },
  { value: 'equilibrado' as const, label: 'No ponto', color: 'from-amber-500 to-amber-600', shortcut: '2' },
  { value: 'porrada' as const, label: 'Porrete', color: 'from-rose-500 to-orange-600', shortcut: '3' },
]

// Skeleton de carregamento — reserva o mesmo espaço do hero + conteúdo real
// para eliminar o "salto" de layout e reduzir a percepção de espera.
function DeckPageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-9 w-36 rounded-xl skeleton-pulse mb-4" />
      <div className="rounded-[2rem] overflow-hidden border border-white/40 dark:border-border mb-6">
        <div className="min-h-[220px] sm:min-h-[240px] md:min-h-[260px] skeleton-pulse" />
        <div className="p-5 md:p-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between bg-white/60 dark:bg-slate-900/60">
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded-full skeleton-pulse" />
            <div className="h-9 w-24 rounded-full skeleton-pulse" />
          </div>
          <div className="h-12 w-44 rounded-2xl skeleton-pulse" />
        </div>
      </div>
      <div className="h-28 rounded-3xl skeleton-pulse mb-4" />
      <div className="h-14 rounded-2xl skeleton-pulse mb-3" />
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-14 rounded-2xl skeleton-pulse" />
        ))}
      </div>
    </div>
  )
}

export default function DeckPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const search = useSearchParams()
  const slug = params.slug

  const [data, setData] = useState<DeckResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [studying, setStudying] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const studyRef = useRef<HTMLDivElement>(null)
  const [studyModeChoice, setStudyModeChoice] = useState<StudyMode>('normal')
  const [activeStudyMode, setActiveStudyMode] = useState<StudyMode>('normal')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [ratings, setRatings] = useState<Record<string, 'facil' | 'equilibrado' | 'porrada'>>({})
  const [ratingBusyCard, setRatingBusyCard] = useState<string | null>(null)
  const [scheduleFeedback, setScheduleFeedback] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })
  const [shareOpen, setShareOpen] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [upsellPkg, setUpsellPkg] = useState<UpsellPackage | null>(null)
  const [showCards, setShowCards] = useState(false)
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [metricSettings, setMetricSettings] = useState<PublicMetricSettings>(DEFAULT_PUBLIC_METRIC_SETTINGS)
  const [savedProgress, setSavedProgress] = useState<FlashcardProgress | null>(null)

  const purchaseSuccess = search?.get('purchase') === 'success'
  const userKey = data?.viewer.userId || 'guest'

  useEffect(() => {
    if (purchaseSuccess) {
      setToast({ open: true, message: 'Compra confirmada! O deck está liberado.', type: 'success' })
    }
  }, [purchaseSuccess])

  useEffect(() => {
    let cancelled = false
    fetch('/api/display-settings', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (!cancelled && json?.settings) setMetricSettings(json.settings)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const load = useCallback(async (mode: StudyMode = 'normal') => {
    setLoading(true)
    try {
      const url = new URL(`/api/flashcards/manual/${encodeURIComponent(slug)}`, window.location.origin)
      if (mode === 'spaced') url.searchParams.set('studyMode', 'spaced')
      const res = await fetch(url.toString(), { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar deck')
      setData(json)
      setLikeCount(json.deck?.likeCount || 0)
      return true
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro ao carregar', type: 'error' })
      return false
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  // Detect resumable progress whenever deck data refreshes.
  useEffect(() => {
    if (!data || studying) return
    const stored = loadProgress(slug, userKey)
    if (!stored || data.cards.length === 0) {
      setSavedProgress(null)
      return
    }
    // Clamp to current deck size in case cards were added/removed.
    const safeIndex = Math.min(Math.max(stored.index, 0), data.cards.length - 1)
    // Resumable only if user actually advanced or rated something.
    if (safeIndex === 0 && Object.keys(stored.ratings || {}).length === 0) {
      setSavedProgress(null)
      return
    }
    setSavedProgress({ ...stored, index: safeIndex, total: data.cards.length })
  }, [data, slug, userKey, studying])

  // Persist progress while the user is studying.
  useEffect(() => {
    if (!studying || !data) return
    saveProgress(slug, userKey, {
      mode: activeStudyMode,
      index: currentIndex,
      total: data.cards.length,
      ratings,
    })
  }, [studying, currentIndex, ratings, activeStudyMode, data, slug, userKey])

  // Load folder path for deck breadcrumb
  useEffect(() => {
    const folderId = data?.deck?.folderId
    if (!folderId) { setFolderPath(null); return }
    fetch('/api/flashcards/manual/folders?scope=admin')
      .then(r => r.json())
      .then(j => {
        const folders: { _id: string; name: string; parentFolderId?: string | null }[] = j.folders || []
        const map = new Map(folders.map(f => [f._id, f]))
        function getPath(id: string): string {
          const f = map.get(id)
          if (!f) return ''
          if (!f.parentFolderId) return f.name
          const parent = getPath(f.parentFolderId)
          return parent ? `${parent} › ${f.name}` : f.name
        }
        const path = getPath(folderId as string)
        setFolderPath(path || null)
      })
      .catch(() => {})
  }, [data?.deck?.folderId])

  // Alterna o modo de expansão (tela cheia) do flashcard na resolução.
  // Tenta usar a Fullscreen API nativa; se indisponível, mantém um overlay
  // em CSS (fixed inset-0) como fallback.
  const toggleFullscreen = useCallback(() => {
    const el = studyRef.current
    const isNativeFs = typeof document !== 'undefined' && !!document.fullscreenElement
    if (!fullscreen) {
      setFullscreen(true)
      el?.requestFullscreen?.().catch(() => {})
    } else {
      setFullscreen(false)
      if (isNativeFs) document.exitFullscreen?.().catch(() => {})
    }
  }, [fullscreen])

  // Sincroniza o estado quando o usuário sai da tela cheia nativa (ex.: Esc).
  useEffect(() => {
    function onFsChange() {
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        setFullscreen(false)
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Garante saída da tela cheia ao encerrar o estudo.
  useEffect(() => {
    if (studying) return
    setFullscreen(false)
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [studying])

  // Atalhos de teclado durante estudo
  useEffect(() => {
    if (!studying) return
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f) }
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen() }
      else if (e.key === 'Escape' && fullscreen) { e.preventDefault(); toggleFullscreen() }
      else if (flipped) {
        if (e.key === '1') rate('facil')
        else if (e.key === '2') rate('equilibrado')
        else if (e.key === '3') rate('porrada')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studying, currentIndex, flipped, data, fullscreen, toggleFullscreen])

  function goNext() {
    if (!data) return
    if (currentIndex < data.cards.length - 1) {
      setCurrentIndex(i => i + 1)
      setFlipped(false); setShowComment(false); setShowHint(false); setScheduleFeedback(null)
    }
  }
  function goPrev() {
    if (!data) return
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setFlipped(false); setShowComment(false); setShowHint(false); setScheduleFeedback(null)
    }
  }
  function goToIndex(index: number) {
    if (!data) return
    const nextIndex = Math.max(0, Math.min(index, data.cards.length - 1))
    setCurrentIndex(nextIndex)
    setFlipped(false); setShowComment(false); setShowHint(false); setScheduleFeedback(null)
  }

  async function startStudy(mode: StudyMode, resumeFrom?: FlashcardProgress | null) {
    if (!data || data.cards.length === 0) return
    const effectiveMode: StudyMode = resumeFrom?.mode ?? mode
    setActiveStudyMode(effectiveMode)
    setRatings(resumeFrom?.ratings ?? {})
    setCurrentIndex(resumeFrom?.index ?? 0)
    setFlipped(false)
    setShowComment(false)
    setShowHint(false)
    setScheduleFeedback(null)
    const loaded = await load(effectiveMode)
    if (!loaded) return
    setStudying(true)
  }

  function discardSavedProgress() {
    clearProgress(slug, userKey)
    setSavedProgress(null)
  }

  function mapRatingToSpaced(value: 'facil' | 'equilibrado' | 'porrada'): SpacedRating {
    if (value === 'facil') return 'SUAVE'
    if (value === 'equilibrado') return 'NO_PONTO'
    return 'PORRETE'
  }

  async function rate(value: 'facil' | 'equilibrado' | 'porrada') {
    if (!data) return
    const card = data.cards[currentIndex]
    if (!card) return
    if (ratingBusyCard) return
    setRatings(prev => ({ ...prev, [card._id]: value }))
    if (activeStudyMode === 'spaced') {
      setRatingBusyCard(card._id)
      try {
        const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: card._id, rating: mapRatingToSpaced(value) }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Erro ao registrar revisão')
        setScheduleFeedback(json.feedbackMessage || 'Revisão agendada.')
        if (json.progress) {
          setData(prev => prev ? {
            ...prev,
            cards: prev.cards.map(c => c._id === card._id ? { ...c, spacedProgress: json.progress } : c),
          } : prev)
        }
      } catch (err: any) {
        setToast({ open: true, message: err.message || 'Erro ao registrar revisão', type: 'error' })
        setRatingBusyCard(null)
        return
      } finally {
        setRatingBusyCard(null)
      }
    }
    if (currentIndex < data.cards.length - 1) {
      setTimeout(() => goNext(), activeStudyMode === 'spaced' ? 850 : 250)
    }
  }

  async function finishSession() {
    if (!data) return
    try {
      const entries = Object.entries(ratings).map(([cardId, rating]) => ({ cardId, rating, completedAt: new Date() }))
      await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, startedAt: new Date() }),
      })
    } catch {}
    clearProgress(slug, userKey)
    setSavedProgress(null)
    setStudying(false)
    setToast({ open: true, message: 'Sessão concluída!', type: 'success' })
  }

  async function toggleLike() {
    if (!data?.viewer.isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/flashcards/d/${slug}`)}`)
      return
    }
    try {
      const method = liked ? 'DELETE' : 'POST'
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/like`, { method })
      const json = await res.json()
      if (res.ok) {
        setLiked(!liked)
        setLikeCount(json.likeCount ?? likeCount + (liked ? -1 : 1))
      }
    } catch {}
  }

  async function buy(skipUpsell = false) {
    if (!data?.deck.linkedMaterialId) {
      setToast({ open: true, message: 'Este deck ainda não tem produto vinculado. Contate o administrador.', type: 'error' })
      return
    }
    const materialId = data.deck.linkedMaterialId
    fetch('/api/analytics/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'buy_click',
        productId: materialId,
        productTitle: data.deck.title,
        productType: 'flashcard',
        amount: Number(data.deck.price || 0),
        source: 'Compra direta',
        metadata: { deckSlug: data.deck.slug },
      }),
      keepalive: true,
    }).catch(() => {})

    if (!data.viewer.isAuthenticated) {
      // Compra sem login via Serial Key (nome/e-mail/telefone no checkout).
      router.push(`/comprar?productType=flashcard&productId=${materialId}&itemType=material`)
      return
    }

    if (!skipUpsell) {
      try {
        const pkgsRes = await fetch('/api/materiais/packages?includeAccess=true', { cache: 'no-store' })
        if (pkgsRes.ok) {
          const pkgsJson = await pkgsRes.json()
          const pkgs: UpsellPackage[] = pkgsJson.packages || []
          const matchingPkg = pkgs.find((pkg: any) =>
            !pkg._isPurchased &&
            pkg.pricing === 'paid' &&
            (pkg.price ?? 0) > 0 &&
            !pkg._pricing?.ownedMaterialIds?.length &&
            pkg.materials?.some((m: any) => m._id === materialId)
          )
          if (matchingPkg) {
            setUpsellPkg(matchingPkg)
            return
          }
        }
      } catch {}
    }

    router.push(`/materiais/checkout?type=material&id=${materialId}`)
  }

  async function downloadDeckPdf() {
    if (!data) return
    if (data.deck.pdfDownloadEnabled !== true) {
      setToast({ open: true, message: 'PDF não está liberado para este deck.', type: 'info' })
      return
    }
    if (!data.viewer.isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/flashcards/d/${data.deck.slug}`)}`)
      return
    }
    setDownloadingPdf(true)
    setToast({ open: true, message: 'Gerando PDF. Isso pode levar alguns segundos...', type: 'info' })
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(data.deck.slug)}/pdf`, { cache: 'no-store' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Não foi possível baixar o PDF')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const safeTitle = data.deck.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'flashcards'
      a.href = url
      a.download = `${safeTitle}-DomineAqui.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setToast({ open: true, message: "PDF baixado com marca d'água.", type: 'success' })
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro ao baixar PDF', type: 'error' })
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loading) {
    return (
      <AppShell allowGuest>
        <DeckPageSkeleton />
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell allowGuest>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
          <Lock className="h-10 w-10 text-slate-400" />
          <h1 className="text-xl font-semibold">Deck não encontrado ou indisponível</h1>
          <Button onClick={() => router.push('/flashcards')}>Voltar para Flashcards</Button>
        </div>
      </AppShell>
    )
  }

  const { deck, cards, access } = data
  const isLocked = !access.hasAccess
  const isPaid = deck.pricing === 'paid'
  const canDownloadPdf = !isLocked && deck.pdfDownloadEnabled === true

  // Lote dinâmico por evento
  const eventState = data.pricingEventState || null
  const tierPct = eventState?.activeTier?.discountPercent || 0
  const hasTier = isPaid && !!eventState?.activeTier && eventState.isActive !== false && tierPct > 0
  const originalDeckPrice = Number(deck.price || 0)
  const tierDeckPrice = hasTier
    ? Math.max(0, Math.round(originalDeckPrice * (1 - tierPct / 100) * 100) / 100)
    : originalDeckPrice

  if (studying) {
    const card = cards[currentIndex]
    const total = cards.length
    const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0
    return (
      <AppShell allowGuest>
        <div
          ref={studyRef}
          className={cn(
            fullscreen &&
              'surface-page fixed inset-0 z-[60] overflow-y-auto overscroll-contain',
          )}
          style={fullscreen ? {
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          } : undefined}
        >
        <div className={cn(
          'mx-auto px-3 sm:px-4 py-4 sm:py-6',
          fullscreen ? 'flex min-h-full flex-col max-w-5xl lg:max-w-6xl' : 'max-w-3xl lg:max-w-5xl',
        )}>
          <div className={cn(
            'mb-4 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-border dark:bg-slate-900/90',
            fullscreen && 'mb-3 border-transparent bg-transparent p-0 shadow-none backdrop-blur-none dark:border-transparent dark:bg-transparent',
          )}>
            <div className="relative flex items-center justify-between gap-2">
              {/* Logo DomineAqui — só na tela cheia, onde o cabeçalho do app some.
                  Centralizada e sem captura de clique para nunca cobrir os botões.
                  No mobile mostra só o ícone (compacto); em telas maiores, a
                  logo completa. Alterna entre a versão clara/escura pelo tema. */}
              {fullscreen && (
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-90">
                  <Logo variant="full" size="sm" className="hidden sm:block dark:sm:hidden" />
                  <Logo variant="dark" size="sm" className="hidden dark:sm:block" />
                  <Logo variant="icon" size="sm" className="sm:hidden" />
                </div>
              )}
              <Button variant="ghost" onClick={() => setStudying(false)} className="h-10 gap-1 px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4" />Sair
              </Button>
              <div className="flex min-w-0 items-center gap-2">
                {activeStudyMode === 'spaced' && !fullscreen && (
                  <span className="hidden items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-200 backdrop-blur sm:inline-flex">
                    <CalendarClock className="h-3.5 w-3.5" /> Fixação intensa
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold tabular-nums text-slate-700 dark:bg-muted dark:text-slate-100">
                  {currentIndex + 1} / {total}
                </span>
                {/* Botão de tela cheia / foco — sempre visível (mobile, iPad, PC) */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold shadow-sm transition active:scale-95',
                    fullscreen
                      ? 'bg-slate-900 text-foreground hover:bg-slate-800 dark:bg-white dark:text-slate-900'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30 hover:brightness-110',
                  )}
                  aria-label={fullscreen ? 'Sair da tela cheia' : 'Expandir para tela cheia'}
                  title={fullscreen ? 'Sair da tela cheia (F)' : 'Expandir para tela cheia (F)'}
                >
                  {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  <span>{fullscreen ? 'Sair' : 'Tela cheia'}</span>
                </button>
              </div>
            </div>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-muted rounded-full overflow-hidden mb-3">
            <motion.div
              className={cn('h-full bg-gradient-to-r', activeStudyMode === 'spaced' ? 'from-emerald-500 via-lime-400 to-amber-400' : 'from-emerald-500 to-amber-400')}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <CardPager
            total={total}
            current={currentIndex}
            ratings={ratings}
            cards={cards}
            onJump={goToIndex}
          />

          {card && (
            /* Em tela cheia, o card cresce e fica centralizado no espaço livre
               entre o cabeçalho e a barra de ações — evitando o vazio inferior
               quando o conteúdo é mais curto que a viewport.
               A troca de card entra com fade + leve subida/escala (só transform
               e opacity, compostos na GPU) — fluido no mobile e sem risco de
               scroll horizontal. A key por índice reinicia a animação a cada
               navegação. */
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.55 }}
              className={cn(fullscreen && 'flex flex-1 flex-col justify-center')}
            >
              <FlashcardCardView
                key={card._id}
                card={card}
                className={fullscreen ? 'max-w-3xl lg:max-w-5xl' : undefined}
                flipped={flipped}
                onFlip={() => setFlipped(f => !f)}
                showComment={showComment}
                onToggleComment={() => setShowComment(s => !s)}
                showHint={showHint}
                onToggleHint={() => setShowHint(s => !s)}
              />
            </motion.div>
          )}

          {/* Barra de ações fixa — sempre acessível sem rolar a página.
              Quando o card está na frente, mostra "Mostrar resposta"; ao virar,
              as avaliações (Suave / No ponto / Porrete) aparecem no MESMO lugar,
              fixadas na base da tela. Sem precisar descer o scroll.
              Funciona em PC, tablet e celular (com área segura de notch). */}
          <div
            className={cn(
              'sticky bottom-0 z-30 mt-5 -mx-3 space-y-2.5 border-t border-border bg-background px-3 pt-3 sm:-mx-4 sm:px-4',
              'shadow-[0_-16px_40px_-28px_rgba(15,23,42,0.55)]',
            )}
            style={{
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
              // Fundo opaco + camada própria de composição (translateZ) elimina
              // o flicker do "Mostrar resposta" e das avaliações ao rolar no
              // mobile — antes o backdrop-blur recalculava a cada frame.
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          >
            {activeStudyMode === 'spaced' && (
              <AnimatePresence>
                {scheduleFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="mx-auto max-w-md rounded-2xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-2 text-center text-sm font-medium text-emerald-800 dark:text-emerald-100"
                  >
                    {scheduleFeedback}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Ação principal: virar o card OU avaliar — troca suavemente */}
            <AnimatePresence mode="wait" initial={false}>
              {!flipped ? (
                <motion.button
                  key="reveal"
                  type="button"
                  onClick={() => setFlipped(true)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-500/25 transition active:scale-[0.98]"
                >
                  <Sparkles className="h-5 w-5" /> Mostrar resposta
                </motion.button>
              ) : (
                <motion.div
                  key="rate"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                >
                  <p className="mb-1.5 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                    Como foi lembrar dessa resposta?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {RATINGS.map(r => (
                      <button
                        key={r.value}
                        onClick={() => rate(r.value)}
                        disabled={ratingBusyCard === card?._id}
                        className={cn(
                          'flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl bg-gradient-to-r px-2 py-2.5 text-sm font-bold leading-tight text-foreground shadow-md transition active:scale-95',
                          r.color,
                          ratingBusyCard === card?._id && 'cursor-wait opacity-60',
                          ratings[card?._id] === r.value && 'ring-2 ring-white ring-offset-2 ring-offset-white dark:ring-offset-slate-950',
                        )}
                      >
                        {ratingBusyCard === card?._id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <span>{r.label}</span>
                            <span className="hidden text-[10px] font-medium opacity-70 sm:block">tecla {r.shortcut}</span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navegação compacta — anterior / posição / próximo ou concluir */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-35 dark:text-slate-300 dark:hover:bg-card"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <span className="text-xs font-semibold tabular-nums text-slate-400">{currentIndex + 1} / {total}</span>
              {currentIndex < total - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-card"
                >
                  {flipped ? 'Pular' : 'Próximo'} <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishSession}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 text-sm font-bold text-white shadow-md transition active:scale-95"
                >
                  <Trophy className="h-4 w-4" /> Concluir
                </button>
              )}
            </div>

            <p className="hidden text-center text-[11px] text-slate-400 sm:block">
              {fullscreen
                ? 'Espaço: virar · ← →: navegar · 1/2/3: avaliar · Esc ou F: sair da tela cheia'
                : 'Espaço: virar · ← →: navegar · 1/2/3: avaliar · F: tela cheia'}
            </p>
          </div>
        </div>
        </div>
        <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={(open) => setToast(t => ({ ...t, open }))} />
      </AppShell>
    )
  }

  return (
    <AppShell allowGuest>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" onClick={() => router.push('/flashcards')} className="gap-1"><ArrowLeft className="h-4 w-4" />Flashcards</Button>
        </div>

        {/* Hero — altura flexível (nunca corta título/tags longos), com acabamento
            glass iridescente (GlassHeroSurface) sobre a capa. */}
        <TiltCard maxTilt={3} scale={1.004} className="rounded-[2rem] mb-6">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/40 dark:border-border bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/40">
          <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-amber-500">
            {deck.coverImage && (
              <Image src={deck.coverImage} alt="" fill priority className="object-cover opacity-90" sizes="(max-width: 1024px) 100vw, 1024px" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5" />
            <GlassHeroSurface className="opacity-70" />
            <div className="relative z-10 flex min-h-[220px] sm:min-h-[240px] md:min-h-[260px] flex-col justify-end p-5 md:p-7 text-foreground">
              <div className="flex items-center gap-2 mb-2 text-xs font-medium flex-wrap">
                <VisibilityBadge visibility={deck.visibility} />
                {deck.ownerType === 'admin' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5"><Crown className="h-3 w-3" /> Oficial</span>
                )}
                {isPaid && !access.isPurchased && !access.isOwner && (
                  hasTier ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-0.5">
                      <Lock className="h-3 w-3" />
                      <span className="line-through opacity-70">R$ {originalDeckPrice.toFixed(2)}</span>
                      <span>R$ {tierDeckPrice.toFixed(2)}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/90 px-2.5 py-0.5"><Lock className="h-3 w-3" /> R$ {deck.price?.toFixed(2)}</span>
                  )
                )}
                {hasTier && !access.isPurchased && !access.isOwner && (
                  <PricingEventBadge state={eventState} size="xs" />
                )}
                {access.isPurchased && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5"><CheckCircle2 className="h-3 w-3" /> Adquirido</span>
                )}
              </div>
              {folderPath && (
                <div className="mb-2 flex items-center gap-1.5 text-xs text-foreground/65">
                  <Folder className="h-3 w-3 shrink-0" />
                  <span>{folderPath}</span>
                </div>
              )}
              <h1 className="text-2xl md:text-4xl font-bold leading-tight drop-shadow line-clamp-3">{deck.title}</h1>
              {deck.description && <p className="mt-2 text-sm md:text-base text-foreground/85 line-clamp-2 max-w-3xl">{deck.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>por <strong className="font-semibold">{deck.ownerName}</strong></span>
                <span>·</span>
                <span>{deck.cardCount} cartões</span>
                {metricSettings.flashcards.showViews && (
                  <>
                    <span>·</span>
                    <span>{deck.viewCount} visualizações</span>
                  </>
                )}
                {(deck.tags || []).slice(0, 4).map(t => (
                  <span key={t} className="rounded-full bg-white/15 px-2 py-0.5 ring-1 ring-white/20">#{t}</span>
                ))}
              </div>
              {(reviewSummary?.count ?? 0) > 0 && (
                <div className="mt-3">
                  <ReviewSummaryBlock
                    summary={reviewSummary}
                    variant="compact"
                    onJumpToList={() =>
                      document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-5 md:p-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              {metricSettings.flashcards.showLikes && (
                <button
                  onClick={toggleLike}
                  className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1',
                    liked
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/30'
                      : 'bg-slate-100 dark:bg-card text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-white/10 hover:bg-slate-200/70')}
                >
                  <Heart className={cn('h-4 w-4', liked && 'fill-current')} /> {likeCount}
                </button>
              )}
              {access.isOwner && (
                <Button variant="outline" onClick={() => setShareOpen(true)}><Share2 className="h-4 w-4" /> Compartilhar</Button>
              )}
              {access.canManage && (
                <Link href={`/flashcards/d/${deck.slug}/editar`}>
                  <Button variant="outline"><Edit3 className="h-4 w-4" /> Editar</Button>
                </Link>
              )}
              {canDownloadPdf && (
                <Button variant="outline" onClick={downloadDeckPdf} disabled={downloadingPdf}>
                  {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {downloadingPdf ? 'Gerando...' : 'PDF'}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isLocked && isPaid ? (
                <button
                  onClick={() => buy()}
                  disabled={purchasing}
                  className="relative overflow-hidden inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-bold tracking-wide text-foreground transition-all duration-200 active:scale-[0.97] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, rgba(217,119,6,0.97) 0%, rgba(234,88,12,0.93) 50%, rgba(220,38,38,0.88) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(253,230,138,0.45)',
                    boxShadow: '0 0 28px rgba(234,88,12,0.45), 0 8px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.20)',
                  }}
                >
                  <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
                  <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                  {hasTier ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[11px] font-medium opacity-70 line-through">R$ {originalDeckPrice.toFixed(2).replace('.', ',')}</span>
                      <span>Comprar R$ {tierDeckPrice.toFixed(2).replace('.', ',')}</span>
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">−{Math.round(tierPct)}%</span>
                    </span>
                  ) : (
                    `Comprar R$ ${deck.price?.toFixed(2).replace('.', ',')}`
                  )}
                </button>
              ) : isLocked ? (
                <button
                  onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(`/flashcards/d/${deck.slug}`)}`)}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Entrar para acessar
                </button>
              ) : (
                <button
                  onClick={() => startStudy(studyModeChoice, savedProgress)}
                  disabled={cards.length === 0}
                  className="relative overflow-hidden inline-flex items-center gap-2.5 rounded-2xl px-8 py-3.5 text-base font-bold tracking-wide text-foreground transition-all duration-200 active:scale-[0.97] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
                  style={{
                    background: savedProgress
                      ? 'linear-gradient(135deg, rgba(217,119,6,1) 0%, rgba(234,88,12,0.95) 50%, rgba(245,158,11,0.90) 100%)'
                      : 'linear-gradient(135deg, rgba(4,120,87,1) 0%, rgba(5,150,105,0.95) 50%, rgba(16,185,129,0.90) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: savedProgress
                      ? '1px solid rgba(253,230,138,0.55)'
                      : '1px solid rgba(52,211,153,0.55)',
                    boxShadow: savedProgress
                      ? '0 0 30px rgba(234,88,12,0.50), 0 8px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.25)'
                      : '0 0 30px rgba(16,185,129,0.50), 0 8px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.25)',
                  }}
                >
                  <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent pointer-events-none" />
                  {savedProgress ? (
                    <RotateCcw className="h-4.5 w-4.5 flex-shrink-0" />
                  ) : (
                    <Play className="h-4.5 w-4.5 fill-current flex-shrink-0" />
                  )}
                  {savedProgress
                    ? `Continuar (${savedProgress.index + 1}/${savedProgress.total})`
                    : studyModeChoice === 'spaced'
                    ? 'Iniciar fixação intensa'
                    : 'Estudar agora'}
                </button>
              )}
            </div>
          </div>
        </div>
        </TiltCard>

        {hasTier && isLocked && eventState && (
          <div className="mb-4">
            <PricingEventCountdown state={eventState} />
          </div>
        )}

        {isLocked ? (
          <LockedPreview deck={deck} access={access} />
        ) : (
          <div>
            <AnimatePresence>
              {savedProgress && (
                <ResumeBanner
                  progress={savedProgress}
                  onContinue={() => startStudy(savedProgress.mode, savedProgress)}
                  onRestart={() => {
                    discardSavedProgress()
                    startStudy(savedProgress.mode)
                  }}
                  onDismiss={discardSavedProgress}
                />
              )}
            </AnimatePresence>
            <StudyModePanel
              selected={studyModeChoice}
              onSelect={setStudyModeChoice}
              stats={data.spacedRepetition?.stats}
              cards={cards}
            />
            <button
              onClick={() => setShowCards(s => !s)}
              className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-slate-900 px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-card transition-colors mb-3"
            >
              <span className="flex items-center gap-2">
                {showCards ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                {showCards ? 'Ocultar lista de cartões' : `Ver lista de cartões (${cards.length})`}
              </span>
              {!showCards && <span className="text-xs text-slate-400">Evite spoiler, expanda quando quiser revisar</span>}
            </button>
            <AnimatePresence>
              {showCards && (
                <motion.div
                  key="cards-list"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <CardsList
                    cards={cards}
                    canManage={access.canManage ?? access.isOwner}
                    slug={deck.slug}
                    onCardsDeleted={load}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {access.isOwner && shareOpen && (
          <ShareDialog deckSlug={deck.slug} onClose={() => setShareOpen(false)} onSuccess={() => setToast({ open: true, message: 'Compartilhado com sucesso', type: 'success' })} />
        )}

        <ReviewsSection
          id="reviews-section"
          targetType="flashcard_deck"
          targetId={String(deck._id)}
          onSummaryChange={setReviewSummary}
          purchaseCtaLabel={isPaid ? 'Comprar para avaliar' : 'Acessar para avaliar'}
          onPurchaseClick={() => {
            if (isPaid && isLocked) buy()
          }}
        />
      </div>
      <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={(open) => setToast(t => ({ ...t, open }))} />

      {upsellPkg && data && (
        <PackageUpsellModal
          pkg={upsellPkg}
          item={{
            id: data.deck.linkedMaterialId ?? '',
            title: data.deck.title,
            price: data.deck.price,
            type: 'flashcard_deck',
          }}
          onBuyPackage={() => {
            setUpsellPkg(null)
            if (!data.viewer.isAuthenticated) {
              router.push(`/comprar?productType=package&productId=${upsellPkg._id}&itemType=package`)
              return
            }
            router.push(`/materiais/checkout?type=package&id=${upsellPkg._id}`)
          }}
          onBuyIndividual={() => {
            setUpsellPkg(null)
            buy(true)
          }}
          onClose={() => setUpsellPkg(null)}
        />
      )}
    </AppShell>
  )
}

// Constrói os itens do paginador: sempre o primeiro e o último, mais uma
// janela ao redor do card atual, com reticências (…) preenchendo os saltos.
// Evita a régua horizontal infinita — funciona bem de 3 a 300+ cards.
function buildPagerItems(current: number, total: number): (number | 'gap')[] {
  const pages = new Set<number>()
  pages.add(0)
  pages.add(total - 1)
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 0 && i < total) pages.add(i)
  }
  const sorted = Array.from(pages).sort((a, b) => a - b)
  const items: (number | 'gap')[] = []
  let prev = -1
  for (const p of sorted) {
    if (prev !== -1 && p - prev > 1) items.push('gap')
    items.push(p)
    prev = p
  }
  return items
}

// Navegação de cards — paginador enxuto no lugar do rolador horizontal.
// Setas ← → para passo a passo e números para saltar direto. Usado tanto no
// modo normal quanto na tela cheia, com a paleta verde do site.
function CardPager({
  total,
  current,
  ratings,
  cards,
  onJump,
}: {
  total: number
  current: number
  ratings: Record<string, 'facil' | 'equilibrado' | 'porrada'>
  cards: { _id: string }[]
  onJump: (index: number) => void
}) {
  if (total <= 1) return null
  const items = buildPagerItems(current, total)
  const stepClass =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-emerald-400 hover:text-emerald-600 disabled:pointer-events-none disabled:opacity-30'

  return (
    <nav
      aria-label="Navegação de cards"
      className="mb-4 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onJump(current - 1)}
        disabled={current === 0}
        className={stepClass}
        aria-label="Card anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {items.map((item, i) => {
        if (item === 'gap') {
          return (
            <span
              key={`gap-${i}`}
              className="select-none px-0.5 text-sm font-semibold text-muted-foreground/50"
            >
              …
            </span>
          )
        }
        const selected = item === current
        const rated = ratings[cards[item]?._id] != null
        return (
          <button
            key={item}
            type="button"
            onClick={() => onJump(item)}
            aria-current={selected ? 'true' : undefined}
            aria-label={`Ir para card ${item + 1}`}
            className={cn(
              'inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-2.5 text-sm font-bold tabular-nums transition',
              selected
                ? 'scale-105 border-transparent bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : rated
                  ? 'border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                  : 'border-border bg-card text-foreground/70 hover:border-emerald-400 hover:text-emerald-600',
            )}
          >
            {item + 1}
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => onJump(current + 1)}
        disabled={current === total - 1}
        className={stepClass}
        aria-label="Próximo card"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}

function StudyModePanel({
  selected,
  onSelect,
  stats,
  cards,
}: {
  selected: StudyMode
  onSelect: (mode: StudyMode) => void
  stats?: SpacedRepetitionStats
  cards: (FlashcardManualCard & { _id: string; spacedProgress?: SpacedProgressResponse | null })[]
}) {
  const [open, setOpen] = useState(false)
  const safeStats = stats || { dueToday: 0, newCards: cards.length, mastered: 0, difficult: 0 }

  return (
    <section className="mb-4 overflow-hidden rounded-3xl border border-emerald-200/50 bg-white/70 p-4 shadow-[0_18px_70px_-35px_rgba(4,120,87,0.45)] backdrop-blur-2xl dark:border-emerald-300/15 dark:bg-slate-950/55">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <button
          type="button"
          onClick={() => onSelect('normal')}
          className={cn(
            'flex-1 rounded-2xl border p-4 text-left transition',
            selected === 'normal'
              ? 'border-slate-300 bg-white text-slate-900 shadow-sm dark:border-white/15 dark:bg-muted dark:text-foreground'
              : 'border-white/50 bg-white/45 text-slate-600 hover:bg-white/75 dark:border-border dark:bg-card dark:text-slate-300'
          )}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-foreground dark:bg-white dark:text-slate-950">
              <Play className="h-4 w-4 fill-current" />
            </span>
            <div>
              <h2 className="text-sm font-bold">Estudo normal</h2>
              <p className="mt-0.5 text-xs opacity-75">Segue a ordem do deck, como antes.</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('spaced')}
          className={cn(
            'relative flex-1 overflow-hidden rounded-2xl border p-4 text-left transition',
            selected === 'spaced'
              ? 'border-emerald-300/60 bg-emerald-500/15 text-emerald-950 shadow-lg shadow-emerald-900/10 dark:text-emerald-50'
              : 'border-emerald-200/40 bg-emerald-50/55 text-slate-700 hover:bg-emerald-50 dark:border-emerald-300/15 dark:bg-emerald-500/10 dark:text-slate-200'
          )}
        >
          <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-lime-500 to-amber-400 text-foreground shadow-lg shadow-emerald-700/25">
              <Brain className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold">Repetição espaçada para fixação intensa</h2>
              <p className="mt-0.5 text-xs opacity-80">Perfeito para fixação intensa antes de provas.</p>
            </div>
          </div>
        </button>
      </div>

      {selected === 'spaced' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-emerald-200/55 bg-white/60 p-4 backdrop-blur-xl dark:border-emerald-300/15 dark:bg-card"
        >
          <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-200">
                <Leaf className="h-3.5 w-3.5" /> Quer revisar de forma mais inteligente?
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                Na repetição espaçada, os cards que você erra ou acha difíceis aparecem novamente mais cedo. Os cards fáceis aparecem com menos frequência. Isso ajuda a fixar melhor o conteúdo e evitar esquecer depois.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <RatingExplain label="Suave" tone="emerald" text="Você lembrou com facilidade, então o card volta depois de mais tempo." />
                <RatingExplain label="No ponto" tone="amber" text="Você lembrou, mas ainda precisa revisar em breve." />
                <RatingExplain label="Porrete" tone="rose" text="Você teve dificuldade ou errou, então o card volta logo." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatTile icon={<CalendarClock className="h-4 w-4" />} label="Vencidos hoje" value={safeStats.dueToday} tone="emerald" />
              <StatTile icon={<Sparkles className="h-4 w-4" />} label="Novos" value={safeStats.newCards} tone="sky" />
              <StatTile icon={<BarChart3 className="h-4 w-4" />} label="Dominados" value={safeStats.mastered} tone="lime" />
              <StatTile icon={<Flame className="h-4 w-4" />} label="Difíceis" value={safeStats.difficult} tone="rose" />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white dark:border-border dark:bg-card dark:text-slate-300 dark:hover:bg-muted"
            >
              {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {open ? 'Ocultar desempenho' : 'Ver desempenho por card'}
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 max-h-72 overflow-auto rounded-2xl border border-white/50 bg-white/45 backdrop-blur-xl dark:border-border dark:bg-card">
                    {cards.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500">Esse deck ainda não tem cartões.</p>
                    ) : (
                      <ul className="divide-y divide-slate-200/60 dark:divide-white/10">
                        {cards.map((card, index) => (
                          <li key={card._id} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr),auto] sm:items-center">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                                {index + 1}. {card.kind === 'hidden_word' && card.hiddenWord ? card.hiddenWord.phrase : (card.front?.text || '(sem texto)')}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {formatProgressLine(card.spacedProgress)}
                              </p>
                            </div>
                            <ProgressBadge progress={card.spacedProgress} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </section>
  )
}

function RatingExplain({ label, text, tone }: { label: string; text: string; tone: 'emerald' | 'amber' | 'rose' }) {
  const colors = {
    emerald: 'border-emerald-300/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100',
    amber: 'border-amber-300/40 bg-amber-500/10 text-amber-800 dark:text-amber-100',
    rose: 'border-rose-300/40 bg-rose-500/10 text-rose-800 dark:text-rose-100',
  }
  return (
    <div className={cn('rounded-2xl border px-3 py-2 backdrop-blur-md', colors[tone])}>
      <div className="text-xs font-bold">{label}</div>
      <p className="mt-1 text-[11px] leading-snug opacity-85">{text}</p>
    </div>
  )
}

function StatTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'emerald' | 'sky' | 'lime' | 'rose' }) {
  const colors = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-800 dark:text-emerald-100',
    sky: 'from-sky-500/20 to-sky-500/5 text-sky-800 dark:text-sky-100',
    lime: 'from-lime-500/25 to-lime-500/5 text-lime-800 dark:text-lime-100',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-800 dark:text-rose-100',
  }
  return (
    <div className={cn('rounded-2xl border border-white/55 bg-gradient-to-br p-3 backdrop-blur-xl dark:border-border', colors[tone])}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-current opacity-75">{icon}</span>
        <span className="text-xl font-black tabular-nums">{value}</span>
      </div>
      <p className="mt-2 text-xs font-semibold opacity-80">{label}</p>
    </div>
  )
}

function formatProgressLine(progress?: SpacedProgressResponse | null): string {
  if (!progress) return 'Novo card pendente de primeira revisão.'
  const ratingLabel = progress.rating === 'SUAVE' ? 'Suave' : progress.rating === 'NO_PONTO' ? 'No ponto' : 'Porrete'
  const next = progress.nextReviewAt ? new Date(progress.nextReviewAt).toLocaleDateString('pt-BR') : 'em breve'
  return `${progress.reviewCount} revisões · sequência ${progress.correctStreak} · ${ratingLabel} · volta ${next}`
}

function ProgressBadge({ progress }: { progress?: SpacedProgressResponse | null }) {
  if (!progress) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-300/40 dark:text-sky-200">
        <Sparkles className="h-3 w-3" /> Novo
      </span>
    )
  }
  if (progress.rating === 'PORRETE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-300/40 dark:text-rose-200">
        <AlertTriangle className="h-3 w-3" /> Difícil
      </span>
    )
  }
  if (progress.correctStreak >= 3 && progress.intervalDays >= 15) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-lime-500/15 px-2.5 py-1 text-xs font-semibold text-lime-700 ring-1 ring-lime-300/40 dark:text-lime-200">
        <CheckCircle2 className="h-3 w-3" /> Dominado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-300/40 dark:text-emerald-200">
      <CalendarClock className="h-3 w-3" /> Revisar
    </span>
  )
}

function ResumeBanner({
  progress,
  onContinue,
  onRestart,
  onDismiss,
}: {
  progress: FlashcardProgress
  onContinue: () => void
  onRestart: () => void
  onDismiss: () => void
}) {
  const safeTotal = Math.max(progress.total, 1)
  const safeIndex = Math.min(progress.index, safeTotal - 1)
  const percent = Math.round(((safeIndex + 1) / safeTotal) * 100)
  const ratedCount = Object.keys(progress.ratings || {}).length
  const remaining = Math.max(safeTotal - (safeIndex + 1), 0)
  const savedAgo = formatRelativeTime(progress.savedAt)
  const isSpaced = progress.mode === 'spaced'

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-4 overflow-hidden rounded-3xl"
      style={{
        background:
          'linear-gradient(135deg, rgba(6,78,59,0.60) 0%, rgba(4,120,87,0.48) 40%, rgba(180,83,9,0.42) 100%)',
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid rgba(167,243,208,0.30)',
        boxShadow:
          '0 0 35px rgba(16,185,129,0.28), 0 18px 50px -20px rgba(6,78,59,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      {/* Decorative glow blobs */}
      <div className="pointer-events-none absolute -top-16 -left-12 h-56 w-56 rounded-full bg-amber-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-60 w-60 rounded-full bg-emerald-500/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Descartar progresso salvo"
        className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-white/20 transition hover:bg-white/20 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative grid gap-5 p-5 sm:p-6 md:grid-cols-[1.2fr,1fr] md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-foreground shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.95), rgba(245,158,11,0.95))',
                boxShadow: '0 6px 18px rgba(16,185,129,0.45), inset 0 1px 0 rgba(255,255,255,0.30)',
              }}
            >
              <Bookmark className="h-4 w-4 fill-current" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100/85">
                Sessão pendente
              </p>
              <h3 className="text-lg font-bold leading-tight text-foreground">
                Você parou no card {safeIndex + 1} de {safeTotal}
              </h3>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-100/80">
              <span>Progresso</span>
              <span className="tabular-nums">{percent}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted ring-1 ring-white/15">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(52,211,153,1) 0%, rgba(163,230,53,1) 55%, rgba(245,158,11,1) 100%)',
                  boxShadow: '0 0 16px rgba(245,158,11,0.55)',
                }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-foreground/85">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 ring-1 ring-white/15 backdrop-blur">
                {isSpaced ? (
                  <>
                    <Brain className="h-3 w-3" /> Fixação intensa
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current" /> Estudo normal
                  </>
                )}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 ring-1 ring-white/15 backdrop-blur">
                <CheckCircle2 className="h-3 w-3" /> {ratedCount} avaliados
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 ring-1 ring-white/15 backdrop-blur">
                <ChevronRight className="h-3 w-3" /> {remaining} restantes
              </span>
              {savedAgo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 ring-1 ring-white/15 backdrop-blur">
                  <CalendarClock className="h-3 w-3" /> {savedAgo}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row md:flex-col md:items-stretch">
          <button
            type="button"
            onClick={onContinue}
            className="group relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-sm font-bold text-foreground transition-all duration-200 active:scale-[0.97] hover:brightness-110"
            style={{
              background:
                'linear-gradient(135deg, rgba(217,119,6,1) 0%, rgba(234,88,12,0.95) 50%, rgba(245,158,11,0.90) 100%)',
              border: '1px solid rgba(253,230,138,0.55)',
              boxShadow:
                '0 0 24px rgba(234,88,12,0.55), 0 8px 22px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <RotateCcw className="h-4 w-4" />
            Continuar de onde parei
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-foreground transition-all duration-200 active:scale-[0.97]"
            style={{
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.22)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <Play className="h-4 w-4 fill-current" />
            Recomeçar do zero
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 0) return ''
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days}d`
  const weeks = Math.floor(days / 7)
  return `há ${weeks}sem`
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  if (visibility === 'public') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-foreground"><Globe className="h-3 w-3" /> Público</span>
  }
  if (visibility === 'unlisted') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/90 px-2.5 py-0.5 text-foreground"><LinkIcon className="h-3 w-3" /> Não-listado</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/80 px-2.5 py-0.5 text-foreground"><EyeOff className="h-3 w-3" /> Privado</span>
}

function LockedPreview({ deck, access }: { deck: any; access: AccessFlags }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-white/40 dark:border-border bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl shadow-sm p-8 text-center"
    >
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-amber-500/15">
        <Lock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 dark:text-foreground">Conteúdo restrito</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        {deck.pricing === 'paid'
          ? 'Adquira este deck para acessar todos os cartões.'
          : (deck.allowedGroups?.length ? 'Este deck é restrito a grupos específicos.' : 'Você ainda não tem acesso a este deck.')}
      </p>
    </motion.div>
  )
}

function CardsList({
  cards, canManage, slug, onCardsDeleted,
}: { cards: any[]; canManage: boolean; slug: string; onCardsDeleted: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const allSelected = cards.length > 0 && selected.size === cards.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(cards.map(c => c._id)))
    }
  }

  function toggleCard(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function deleteSelected() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/cards`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: Array.from(selected) }),
      })
      if (res.ok) {
        setSelected(new Set())
        setConfirmDelete(false)
        onCardsDeleted()
      }
    } finally {
      setDeleting(false)
    }
  }

  if (!cards.length) {
    return (
      <div className="rounded-3xl border border-dashed border-emerald-300/50 dark:border-white/15 bg-white/40 dark:bg-card backdrop-blur-md p-10 text-center">
        <Sparkles className="h-8 w-8 mx-auto text-slate-400 mb-3" />
        <p className="text-slate-500 dark:text-slate-400">Esse deck ainda não tem cartões.</p>
        {canManage && (
          <Link href={`/flashcards/d/${slug}/editar`} className="inline-block mt-4">
            <Button>Adicionar cartões</Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-3xl border border-white/40 dark:border-border bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-border">
          {canManage && (
            <button
              type="button"
              onClick={toggleAll}
              className="shrink-0 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
              aria-label={allSelected ? 'Desselecionar todos' : 'Selecionar todos'}
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              ) : someSelected ? (
                <Square className="h-4 w-4 opacity-50" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          )}
          <h2 className="text-sm font-semibold text-slate-800 dark:text-foreground flex-1">{cards.length} cartões</h2>
          {canManage && (
            <Link href={`/flashcards/d/${slug}/editar`}>
              <Button variant="outline" size="sm"><Edit3 className="h-3.5 w-3.5 mr-1" />Editar deck</Button>
            </Link>
          )}
        </div>

        {/* Bulk action bar */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-3 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20">
                <span className="text-sm font-medium text-rose-700 dark:text-rose-300 flex-1">
                  {selected.size} {selected.size === 1 ? 'cartão selecionado' : 'cartões selecionados'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Limpar
                </button>
                <Button
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-foreground gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir selecionados
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards list */}
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {cards.map((c, i) => (
            <li
              key={c._id}
              className={cn(
                'flex items-start gap-3 px-5 py-3 transition-colors',
                selected.has(c._id)
                  ? 'bg-emerald-50 dark:bg-emerald-500/10'
                  : 'hover:bg-slate-50/60 dark:hover:bg-card',
                canManage && 'cursor-pointer'
              )}
              onClick={() => canManage && toggleCard(c._id)}
            >
              {canManage && (
                <div className="shrink-0 mt-0.5 text-slate-300 dark:text-slate-600">
                  {selected.has(c._id) ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </div>
              )}
              <span className="text-xs font-mono text-slate-400 mt-1 w-6 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                  {c.kind === 'hidden_word' && c.hiddenWord ? c.hiddenWord.phrase : (c.front?.text || '(sem texto)')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {c.kind === 'hidden_word' ? `Palavra: ${c.hiddenWord?.word}` : (c.back?.text || '')}
                </p>
              </div>
              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {c.kind === 'hidden_word' && (
                  <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 font-medium">Palavra oculta</span>
                )}
                {c.comment && (
                  <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] px-2 py-0.5 font-medium">Comentado</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Confirm delete dialog */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-border p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-foreground">Excluir cartões?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selected.size} {selected.size === 1 ? 'cartão será excluído' : 'cartões serão excluídos'} permanentemente.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="bg-rose-600 hover:bg-rose-700 text-foreground gap-1.5"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ShareDialog({ deckSlug, onClose, onSuccess }: { deckSlug: string; onClose: () => void; onSuccess: () => void }) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<{ _id: string; name: string; emailMasked: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [shared, setShared] = useState<string[]>([])
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  useEffect(() => {
    if (query.length < 3) { setUsers([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flashcards/manual/users/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setUsers(json.users || [])
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function shareWith(userId: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(deckSlug)}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        setShared(s => [...s, userId])
        onSuccess()
      }
    } finally { setBusy(false) }
  }

  function copyLink() {
    const url = `${window.location.origin}/flashcards/d/${deckSlug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1500)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full md:max-w-lg md:rounded-3xl rounded-t-3xl border border-slate-200 dark:border-border p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">Compartilhar deck</h3>
        <p className="text-sm text-slate-500 mb-4">Convide outros usuários ou compartilhe o link.</p>

        <div className="rounded-2xl border border-slate-200 dark:border-border p-3 flex items-center gap-2 mb-4 bg-slate-50 dark:bg-card">
          <LinkIcon className="h-4 w-4 text-slate-500" />
          <span className="flex-1 text-xs text-slate-600 dark:text-slate-300 truncate">{`${typeof window !== 'undefined' ? window.location.origin : ''}/flashcards/d/${deckSlug}`}</span>
          <button onClick={copyLink} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            {copyState === 'copied' ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-slate-800 px-4 py-2.5 text-sm"
        />

        <ul className="mt-3 space-y-2 max-h-64 overflow-auto">
          {users.map(u => (
            <li key={u._id} className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-border px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-slate-500">{u.emailMasked}</p>
              </div>
              <Button size="sm" onClick={() => shareWith(u._id)} disabled={busy || shared.includes(u._id)}>
                {shared.includes(u._id) ? 'Enviado' : 'Compartilhar'}
              </Button>
            </li>
          ))}
          {query.length >= 3 && users.length === 0 && <li className="text-sm text-slate-500 text-center py-4">Nenhum usuário encontrado</li>}
        </ul>

        <div className="mt-5 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  )
}
