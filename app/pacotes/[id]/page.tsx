'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ShoppingCart,
  Lock,
  Eye,
  Shield,
  Gift,
  Crown,
  Zap,
  GraduationCap,
  FileText,
  Video,
  Play,
  Link2,
  Image as ImageIcon,
  File,
  ChevronDown,
  ChevronUp,
  Package,
  ShieldAlert,
  Check,
  CheckCheck,
  Share2,
  Sparkles,
  TrendingDown,
  ChevronRight,
  Tag,
  Clock,
  Download,
} from 'lucide-react'
import { PLUS_LABEL } from '@/lib/account-tier'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import { useMaterialCart } from '@/context/MaterialCartContext'
import {
  DEFAULT_PUBLIC_METRIC_SETTINGS,
  type PublicMetricSettings,
} from '@/lib/display-settings'
import {
  PricingEventCountdown,
  type PricingEventStatePayload,
} from '@/components/pricing-events/PricingEventCountdown'
import { PricingEventBadge } from '@/components/pricing-events/PricingEventBadge'
import { PrintedAddon } from '@/components/shop/printed-addon'
import { PackageReviews } from '@/components/reviews/package-reviews'
import { ReviewSummaryBlock } from '@/components/reviews/review-summary'
import type { ReviewSummary } from '@/lib/reviews-shared'

// ─── Types ───────────────────────────────────────────────────
interface PackageMaterial {
  _id: string
  title: string
  description?: string
  coverImage: string
  type: string
  pricing: 'free' | 'paid'
  price: number
  videoDuration?: number
  tags?: string[]
  allowedGroups?: string[]
  _isPurchased: boolean
  _hasGroupAccess: boolean
  _hasAccess: boolean
  _pageCount?: number
}

interface PackageDoc {
  _id: string
  title: string
  description: string
  coverImage: string
  tags: string[]
  allowedGroups: string[]
  pricing: 'free' | 'paid'
  price: number
  originalPrice: number
  materialIds: string[]
  downloadCount: number
  viewCount: number
  isFeatured: boolean
  createdAt: string
  pricingEventId?: string | null
}

interface AccessInfo {
  isAdmin: boolean
  isPurchased: boolean
  hasGroupAccess: boolean
  hasAccess: boolean
  /** Assinante Plus+ leva sem custo, mas ainda precisa resgatar. */
  includedInPlus?: boolean
  userGroups: string[]
  isAuthenticated: boolean
}

interface PricingInfo {
  originalPackagePrice: number
  effectivePrice: number
  discountApplied: number
  ownedValue: number
  totalPaidIndividualValue: number
  ownedMaterialIds: string[]
}

interface PageData {
  package: PackageDoc
  materials: PackageMaterial[]
  access: AccessInfo
  pricing: PricingInfo
  pricingEventState?: PricingEventStatePayload | null
}

const GROUP_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  gratuito:  { label: 'Gratuito',  color: '#6b7280', icon: <Gift className="h-3.5 w-3.5" /> },
  trial:     { label: 'Trial',     color: '#3b82f6', icon: <Clock className="h-3.5 w-3.5" /> },
  essential: { label: 'Plus+', color: '#8b5cf6', icon: <Zap className="h-3.5 w-3.5" /> },
  premium:   { label: 'Plus+',   color: '#f59e0b', icon: <Crown className="h-3.5 w-3.5" /> },
  monitor:   { label: 'Monitor',   color: '#10b981', icon: <GraduationCap className="h-3.5 w-3.5" /> },
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf:         <FileText className="h-4 w-4" />,
  video:       <Video className="h-4 w-4" />,
  video_embed: <Play className="h-4 w-4" />,
  link:        <Link2 className="h-4 w-4" />,
  image:       <ImageIcon className="h-4 w-4" />,
  document:    <File className="h-4 w-4" />,
  flashcard_deck: <Sparkles className="h-4 w-4" />,
  other:       <File className="h-4 w-4" />,
}

const TYPE_LABELS: Record<string, string> = {
  pdf:         'PDF',
  video:       'Vídeo',
  video_embed: 'Vídeo',
  link:        'Link',
  image:       'Imagem',
  document:    'Documento',
  flashcard_deck: 'Flashcard',
  other:       'Arquivo',
}

function fmtBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

// ─── Main Page ───────────────────────────────────────────────
export default function PackageDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const [descExpanded, setDescExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [metricSettings, setMetricSettings] = useState<PublicMetricSettings>(DEFAULT_PUBLIC_METRIC_SETTINGS)
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const { addItem } = useMaterialCart()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/materiais/packages/${id}`, { cache: 'no-store' })
      if (res.status === 404) { router.push('/materiais?tab=packages'); return }
      if (!res.ok) { setError('Erro ao carregar pacote'); return }
      const json = await res.json()
      setData(json)
    } catch {
      setError('Erro ao carregar pacote')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])
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

  // ─── Acquire ──────────────────────────────────────────────
  /**
   * Resgate do pacote pela assinatura Plus+ — grava a aquisição direto,
   * sem carrinho nem checkout. Servidor valida assinatura e cota.
   */
  const handleClaimWithPlus = async () => {
    if (!data?.access.isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/pacotes/${id}`)}`)
      return
    }
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/materiais/resgatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'package', itemId: id }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCartMessage(result.error || 'Não foi possível resgatar este pacote.')
        return
      }
      setCartMessage(result.message || 'Pacote resgatado!')
      await fetchData()
    } catch {
      setCartMessage('Não foi possível resgatar este pacote.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleAcquire = async () => {
    if (!data) return
    const pkg = data.package
    const price = data.pricing.effectivePrice

    fetch('/api/analytics/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'buy_click',
        productId: id,
        productTitle: pkg.title,
        productType: 'package',
        amount: price,
        source: 'Pacote',
        metadata: {
          itemType: 'package',
          discountApplied: data.pricing.discountApplied,
          ownedMaterialIds: data.pricing.ownedMaterialIds,
        },
      }),
      keepalive: true,
    }).catch(() => {})

    const isFreePath = pkg.pricing === 'free' || price <= 0
    if (!isFreePath) {
      const result = addItem({
        itemType: 'package',
        itemId: id,
        title: pkg.title,
        pricing: pkg.pricing,
        price,
        coverImage: pkg.coverImage,
        materialCount: data.materials.length,
        effectivePrice: price,
        originalPrice: Number(pkg.price || price),
        discountApplied: Number(pricing.discountApplied || 0),
      })
      setCartMessage(result === 'added' ? 'Pacote adicionado ao carrinho.' : 'Este pacote já está no carrinho.')
      setTimeout(() => setCartMessage(''), 3500)
      return
    }

    if (!data.access.isAuthenticated) {
      const checkoutPath = `/materiais/checkout?type=package&id=${id}`
      router.push(`/auth/login?redirect=${encodeURIComponent(checkoutPath)}`)
      return
    }

    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/materiais/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'package', itemId: id, paymentMethodId: 'free' }),
      })
      const json = await res.json()
      if (json.free) {
        await fetchData()
      } else {
        alert(json.error || 'Erro ao processar')
      }
    } catch {
      alert('Erro ao processar aquisição')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleBuyNow = () => {
    if (!data) return
    const checkoutPath = `/materiais/checkout?type=package&id=${id}`
    if (!data.access.isAuthenticated) {
      // Compra sem login via Serial Key (nome/e-mail/telefone no checkout).
      router.push(`/comprar?productType=package&productId=${id}&itemType=package`)
      return
    }
    router.push(checkoutPath)
  }

  // ─── Copy share link ──────────────────────────────────────
  const copyShareLink = useCallback(() => {
    const url = `${window.location.origin}/pacotes/${id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [id])

  if (loading) return <LoadingSkeleton />
  if (error || !data) return <ErrorState message={error} onBack={() => router.push('/materiais?tab=packages')} />

  const { package: pkg, materials, access, pricing } = data
  const isFree = pkg.pricing === 'free'
  const descLong = pkg.description && pkg.description.length > 200
  const hasDiscount = pricing.discountApplied > 0
  const hasStaticDiscount = !isFree && pkg.originalPrice > pkg.price && pkg.originalPrice > 0
  const totalItems = materials.length
  const showMaterialViews = metricSettings.materials.showViews
  const showMaterialDownloads = metricSettings.materials.showDownloads
  const hasInfoMetrics = showMaterialViews || showMaterialDownloads
  const showMobilePurchaseBar = !access.hasAccess && access.isAuthenticated

  // Lote dinâmico por evento
  const eventState = data.pricingEventState || null
  const tierPct = eventState?.activeTier?.discountPercent || 0
  const hasTier = !isFree && !!eventState?.activeTier && eventState.isActive !== false && tierPct > 0
  const tierFinalPrice = hasTier
    ? Math.max(0, Math.round(pricing.effectivePrice * (1 - tierPct / 100) * 100) / 100)
    : pricing.effectivePrice
  const tierSavings = hasTier ? Math.max(0, pricing.effectivePrice - tierFinalPrice) : 0

  return (
    <AppShell allowGuest headerTitle={pkg.title} headerSubtitle="Pacote">
      <div className={`surface-page min-h-full relative ${showMobilePurchaseBar ? 'pb-28 xl:pb-0' : ''}`}>
        {/* Ambient blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute top-1/2 -right-40 w-[320px] h-[320px] rounded-full bg-accent/8 blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Breadcrumb */}
          <motion.div
            initial={false}
            
            
            className="flex items-center gap-2 mb-6 flex-wrap"
          >
            <Link
              href="/materiais"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span className="h-7 w-7 rounded-lg bg-card border border-border flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
              </span>
              Materiais
            </Link>
            <span className="text-muted-foreground/40 text-sm">/</span>
            <Link
              href="/materiais?tab=packages"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Package className="h-3.5 w-3.5" />
              Pacotes
            </Link>
            <span className="text-muted-foreground/40 text-sm">/</span>
            <span className="text-sm font-medium text-foreground line-clamp-1 max-w-[200px]">
              {pkg.title}
            </span>
          </motion.div>

          {/* Oferta de versão impressa (add-on vinculado ao pacote) */}
          <PrintedAddon packageId={id} />

          {/* Main layout */}
          <div className="flex flex-col xl:flex-row gap-6">

            {/* LEFT: Media + Items */}
            <motion.div
              initial={false}
              
              
              className="flex-1 min-w-0 space-y-4"
            >
              {/* Cover */}
              <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm border border-border/40">
                {pkg.coverImage ? (
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={pkg.coverImage}
                      alt={pkg.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1280px) 100vw, 70vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1.5 rounded-xl backdrop-blur-md bg-primary/80 border border-primary/40 text-primary-foreground text-sm font-bold flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        Pacote · {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                      </span>
                      {access.hasAccess && (
                        <span className="px-3 py-1.5 rounded-xl backdrop-blur-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-50 text-xs font-bold flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" /> Disponível
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center bg-gradient-to-br from-primary/15 via-muted to-accent/10" style={{ aspectRatio: '16/9' }}>
                    <Package className="h-20 w-20 text-primary" />
                  </div>
                )}

                {/* Info bar */}
                <div className="px-5 py-3.5 border-t border-border/40 flex items-center gap-4 flex-wrap">
                  {hasInfoMetrics && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {showMaterialViews && (
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" /> {pkg.viewCount}
                        </span>
                      )}
                      {showMaterialDownloads && (
                        <span className="flex items-center gap-1.5">
                          <Download className="h-3.5 w-3.5" /> {pkg.downloadCount}
                        </span>
                      )}
                    </div>
                  )}
                  {(reviewSummary?.count ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                      className="transition-opacity hover:opacity-80"
                      aria-label="Ver avaliações do pacote"
                    >
                      <ReviewSummaryBlock summary={reviewSummary} variant="inline" />
                    </button>
                  )}
                  <button
                    onClick={copyShareLink}
                    className={`ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all font-medium border ${
                      copied
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'text-muted-foreground hover:text-foreground bg-muted border border-border border-border/40'
                    }`}
                  >
                    {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                    {copied ? 'Copiado!' : 'Compartilhar'}
                  </button>
                </div>
              </div>

              {/* Lote dinâmico por evento */}
              {hasTier && eventState && !access.hasAccess && (
                <motion.div
                  initial={false}
                  
                  
                >
                  <PricingEventCountdown state={eventState} />
                </motion.div>
              )}

              {/* Mobile purchase summary */}
              <motion.div
                initial={false}
                
                
                className="rounded-lg border border-border/40 bg-card border border-border p-4 xl:hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-medium border border-violet-500/15">
                        <Package className="h-3 w-3" /> Pacote
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-medium border border-primary/15">
                        {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                      </span>
                      {isFree ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/15">
                          <Gift className="h-3 w-3" /> Gratuito
                        </span>
                      ) : hasTier ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                          <span className="line-through opacity-60">{fmtBRL(pricing.effectivePrice)}</span>
                          <span>{fmtBRL(tierFinalPrice)}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-accent/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/15">
                          {fmtBRL(pricing.effectivePrice)}
                        </span>
                      )}
                      {hasTier && <PricingEventBadge state={eventState} size="xs" />}
                    </div>

                    <h1 className="font-heading text-lg font-bold leading-snug">
                      {pkg.title}
                    </h1>

                    {hasDiscount && !access.hasAccess && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        <TrendingDown className="h-3.5 w-3.5" />
                        {fmtBRL(pricing.discountApplied)} descontados por itens já adquiridos
                      </p>
                    )}
                  </div>

                  <button
                    onClick={copyShareLink}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
                      copied
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'text-muted-foreground hover:text-foreground bg-muted border border-border border-border/40'
                    }`}
                    aria-label={copied ? 'Link copiado' : 'Compartilhar pacote'}
                  >
                    {copied ? <CheckCheck className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  </button>
                </div>

                {!isFree && (
                  <div className="mt-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                    {hasStaticDiscount && !hasDiscount && (
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">De</span>
                        <span className="text-muted-foreground line-through">
                          {fmtBRL(pkg.originalPrice)}
                        </span>
                      </div>
                    )}
                    {hasDiscount && (
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">Valor original</span>
                        <span className="text-muted-foreground line-through">
                          {fmtBRL(pricing.originalPackagePrice)}
                        </span>
                      </div>
                    )}
                    {hasTier && (
                      <>
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                          <span className="text-muted-foreground">Valor sem lote</span>
                          <span className="text-muted-foreground line-through">
                            {fmtBRL(pricing.effectivePrice)}
                          </span>
                        </div>
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <TrendingDown className="h-3 w-3" /> Lote{eventState ? ` · ${eventState.activeTier?.label || ''}` : ''} (−{Math.round(tierPct)}%)
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            − {fmtBRL(tierSavings)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        {tierFinalPrice <= 0 ? 'Grátis' : fmtBRL(tierFinalPrice)}
                      </span>
                    </div>
                    {hasTier && eventState?.activeTier && (
                      <p className="mt-1 text-[10px] text-emerald-700/80 dark:text-emerald-300/80 leading-snug">
                        ⚡ Lote ativo: quanto antes comprar, maior o desconto.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  {access.hasAccess ? (
                    <>
                      <Button
                        disabled
                        className="w-full h-11 rounded-lg font-semibold text-white bg-primary cursor-default"
                      >
                        <Check className="h-4 w-4 mr-2" /> Pacote adquirido
                      </Button>
                      <p className="text-center text-[10px] text-muted-foreground/70">
                        Acesse cada material pela lista abaixo.
                      </p>
                    </>
                  ) : access.includedInPlus ? (
                    <>
                      <span className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                        <Crown className="h-4 w-4" /> Incluído no {PLUS_LABEL}
                      </span>
                      <Button
                        onClick={handleClaimWithPlus}
                        disabled={checkoutLoading}
                        className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:scale-[0.98]"
                      >
                        {checkoutLoading
                          ? <span className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <Gift className="h-4 w-4 mr-2" />}
                        Resgatar pacote
                      </Button>
                    </>
                  ) : (
                    <>
                      {isFree || pricing.effectivePrice <= 0 ? (
                        <Button
                          onClick={handleAcquire}
                          disabled={checkoutLoading}
                          className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors active:scale-[0.98]"
                        >
                          {checkoutLoading
                            ? <span className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <Gift className="h-4 w-4 mr-2" />
                          }
                          Adquirir gratuitamente
                        </Button>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Button
                            onClick={handleBuyNow}
                            disabled={checkoutLoading}
                            className="h-11 rounded-lg bg-secondary font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90 transition-colors active:scale-[0.98]"
                          >
                            Comprar agora
                          </Button>
                          <Button
                            onClick={handleAcquire}
                            disabled={checkoutLoading}
                            className="h-11 rounded-lg border border-emerald-500/25 bg-emerald-500/10 font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-500/15 active:scale-[0.98] dark:text-emerald-300"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        </div>
                      )}
                      {!isFree && (
                        <p className="text-center text-[10px] text-muted-foreground/60">
                          Pagamento único · acesso permanente
                        </p>
                      )}
                      {cartMessage && (
                        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          {cartMessage}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </motion.div>

              {/* Description */}
              {pkg.description && (
                <motion.div
                  initial={false}
                  
                  
                  className="bg-card border border-border rounded-lg px-5 py-4 border border-border/40"
                >
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Sobre o pacote
                  </h3>
                  <p className={`text-sm leading-relaxed text-foreground/85 ${descExpanded ? '' : 'line-clamp-4'}`}>
                    {pkg.description}
                  </p>
                  {descLong && (
                    <button
                      onClick={() => setDescExpanded(e => !e)}
                      className="mt-2 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                    >
                      {descExpanded
                        ? <><ChevronUp className="h-3 w-3" /> Ver menos</>
                        : <><ChevronDown className="h-3 w-3" /> Ver mais</>}
                    </button>
                  )}
                </motion.div>
              )}

              {/* Items list */}
              <motion.div
                initial={false}
                
                transition={{ delay: 0.15 }}
                className="bg-card border border-border rounded-lg border border-border/40 overflow-hidden"
              >
                <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" />
                    Itens incluídos
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {totalItems} {totalItems === 1 ? 'material' : 'materiais'}
                  </span>
                </div>

                {materials.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Nenhum material disponível neste pacote.
                  </div>
                ) : (
                  <ul className="divide-y divide-border/30">
                    {materials.map((m) => {
                      const owned = m._isPurchased || access.isPurchased
                      const isOwnedExtra = m._isPurchased && !access.isPurchased
                      return (
                        <li key={m._id}>
                          <Link
                            href={`/materiais/${m._id}`}
                            className="group flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
                          >
                            {/* Cover thumb */}
                            <div className="relative h-14 w-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                              {m.coverImage ? (
                                <Image src={m.coverImage} alt="" fill className="object-cover" sizes="80px" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                                  {TYPE_ICONS[m.type] || <File className="h-5 w-5" />}
                                </div>
                              )}
                            </div>

                            {/* Title + meta */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium border border-primary/15">
                                  {TYPE_ICONS[m.type]}
                                  {TYPE_LABELS[m.type] || 'Arquivo'}
                                </span>
                                {m.pricing === 'free' ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/15">
                                    <Gift className="h-2.5 w-2.5" /> Grátis
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-500/15">
                                    {fmtBRL(m.price)}
                                  </span>
                                )}
                                {isOwnedExtra && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold border border-violet-500/15">
                                    <Check className="h-2.5 w-2.5" /> Já adquirido
                                  </span>
                                )}
                                {m.type === 'pdf' && m._pageCount ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground text-[10px] font-medium border border-border/40">
                                    <FileText className="h-2.5 w-2.5" /> {m._pageCount} {m._pageCount === 1 ? 'página' : 'páginas'}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm font-medium leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                                {m.title}
                              </p>
                            </div>

                            <ChevronRight className="h-4 w-4 text-muted-foreground/60 flex-shrink-0 group-hover:text-primary transition-colors" />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </motion.div>

              {/* Prova social: avaliações agregadas dos materiais do pacote */}
              <PackageReviews
                id="reviews-section"
                packageId={id}
                onSummaryChange={setReviewSummary}
              />
            </motion.div>

            {/* RIGHT: Sidebar */}
            <motion.div
              initial={false}
              className="xl:w-[340px] flex-shrink-0 space-y-3"
            >
              {/* CTA Card */}
              <div className="hidden xl:block rounded-xl overflow-hidden border border-border/40 bg-card border border-border">
                {pkg.coverImage && (
                  <div className="relative h-32 overflow-hidden">
                    <Image src={pkg.coverImage} alt="" fill className="object-cover" sizes="340px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    <div className="absolute top-3 right-3">
                      {access.hasAccess ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl backdrop-blur-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                          <Check className="h-3 w-3" /> Disponível
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl backdrop-blur-md bg-black/40 border border-white/15 text-white/80 text-[11px] font-bold">
                          <Lock className="h-3 w-3" />
                          {isFree ? 'Gratuito' : fmtBRL(tierFinalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-medium border border-violet-500/15">
                      <Package className="h-3 w-3" /> Pacote
                    </span>
                    {isFree ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/15">
                        <Gift className="h-3 w-3" /> Gratuito
                      </span>
                    ) : hasTier ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                        <span className="line-through opacity-60">{fmtBRL(pricing.effectivePrice)}</span>
                        <span>{fmtBRL(tierFinalPrice)}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-accent/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/15">
                        {fmtBRL(pricing.effectivePrice)}
                      </span>
                    )}
                    {hasTier && <PricingEventBadge state={eventState} size="xs" />}
                  </div>

                  <h1 className="font-heading font-bold text-base leading-snug mb-3">
                    {pkg.title}
                  </h1>

                  {/* Tags */}
                  {pkg.tags?.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {pkg.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            <Tag className="inline h-2.5 w-2.5 mr-0.5" /> {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price breakdown */}
                  {!isFree && (
                    <div className="mb-3 rounded-lg border border-border/40 overflow-hidden">
                      <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {hasDiscount ? 'Seu preço com desconto' : 'Valor do pacote'}
                        </p>
                      </div>
                      <div className="px-3 py-2.5 space-y-1.5">
                        {hasStaticDiscount && !hasDiscount && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">De</span>
                            <span className="text-muted-foreground line-through">
                              {fmtBRL(pkg.originalPrice)}
                            </span>
                          </div>
                        )}
                        {hasDiscount && (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Valor do pacote</span>
                              <span className="text-muted-foreground line-through">
                                {fmtBRL(pricing.originalPackagePrice)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" /> Desconto por itens já adquiridos
                              </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                − {fmtBRL(pricing.discountApplied)}
                              </span>
                            </div>
                          </>
                        )}
                        {hasTier && (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Valor sem lote</span>
                              <span className="text-muted-foreground line-through">
                                {fmtBRL(pricing.effectivePrice)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" /> Lote ativo (−{Math.round(tierPct)}%)
                              </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                − {fmtBRL(tierSavings)}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-semibold">Total</span>
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                            {tierFinalPrice <= 0 ? 'Grátis' : fmtBRL(tierFinalPrice)}
                          </span>
                        </div>
                        {hasDiscount && (
                          <p className="text-[10px] text-muted-foreground/80 leading-snug pt-1 border-t border-border/30 mt-1">
                            Desconto calculado proporcionalmente sobre os materiais
                            do pacote que você já adquiriu.
                          </p>
                        )}
                        {hasTier && eventState?.activeTier && (
                          <p className="text-[10px] text-emerald-700/85 dark:text-emerald-300/85 leading-snug pt-1 border-t border-border/30 mt-1">
                            ⚡ Lote {eventState.activeTier.label}. Quanto antes comprar, maior o desconto.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-1 space-y-2">
                    {access.hasAccess ? (
                      <>
                        <Button
                          disabled
                          className="w-full h-11 rounded-lg font-semibold text-white bg-primary cursor-default"
                        >
                          <Check className="h-4 w-4 mr-2" /> Pacote adquirido
                        </Button>
                        <p className="text-center text-[10px] text-muted-foreground/70">
                          Acesse cada material pela lista ao lado.
                        </p>
                      </>
                    ) : (
                      <>
                        {isFree || pricing.effectivePrice <= 0 ? (
                          <Button
                            onClick={handleAcquire}
                            disabled={checkoutLoading}
                            className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors active:scale-[0.98]"
                          >
                            {checkoutLoading
                              ? <span className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              : <Gift className="h-4 w-4 mr-2" />
                            }
                            Adquirir gratuitamente
                          </Button>
                        ) : (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                            <Button
                              onClick={handleAcquire}
                              disabled={checkoutLoading}
                              className="h-11 rounded-lg border border-emerald-500/25 bg-emerald-500/10 font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-500/15 active:scale-[0.98] dark:text-emerald-300"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Adicionar ao carrinho
                            </Button>
                            <Button
                              onClick={handleBuyNow}
                              disabled={checkoutLoading}
                              className="h-11 rounded-lg bg-secondary font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90 transition-colors active:scale-[0.98]"
                            >
                              Comprar agora
                            </Button>
                          </div>
                        )}
                        {!isFree && (
                          <p className="text-center text-[10px] text-muted-foreground/60">
                            Pagamento único · acesso permanente
                          </p>
                        )}
                        {cartMessage && (
                          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            {cartMessage}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Group restrictions */}
              <AnimatePresence>
                {pkg.allowedGroups?.length > 0 && (
                  <motion.div
                    initial={false}
                    className="bg-card border border-border rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="h-6 w-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                        <Shield className="h-3 w-3 text-violet-500" />
                      </div>
                      <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                        Acesso por plano
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.allowedGroups.map(g => {
                        const meta = GROUP_META[g]
                        if (!meta) return null
                        return (
                          <span
                            key={g}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                            style={{ color: meta.color, background: meta.color + '15', borderColor: meta.color + '35' }}
                          >
                            {meta.icon} {meta.label}
                          </span>
                        )
                      })}
                    </div>
                    {!access.hasGroupAccess && (
                      <p className="mt-2.5 text-[11px] text-muted-foreground leading-relaxed">
                        Seu plano atual não inclui este pacote. Faça upgrade para desbloquear.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Discount info */}
              {hasDiscount && !access.hasAccess && (
                <motion.div
                  initial={false}
                  className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20"
                >
                  <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    Você já possui {pricing.ownedMaterialIds.length} {pricing.ownedMaterialIds.length === 1 ? 'item' : 'itens'} deste
                    pacote. Por isso, descontamos {fmtBRL(pricing.discountApplied)} do valor original.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {showMobilePurchaseBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl shadow-black/15 backdrop-blur-xl xl:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{pkg.title}</p>
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                {isFree || tierFinalPrice <= 0 ? 'Gratuito' : (
                  <>
                    {hasTier && (
                      <span className="mr-1.5 text-[10px] font-medium text-muted-foreground line-through">
                        {fmtBRL(pricing.effectivePrice)}
                      </span>
                    )}
                    {fmtBRL(tierFinalPrice)}
                    {hasTier && <span className="ml-1.5 text-[10px] font-bold text-emerald-500">−{Math.round(tierPct)}%</span>}
                  </>
                )}
              </p>
            </div>
            <Button
              onClick={isFree || pricing.effectivePrice <= 0 ? handleAcquire : handleBuyNow}
              disabled={checkoutLoading}
              className="h-11 min-w-[9rem] rounded-lg bg-secondary px-4 font-bold text-secondary-foreground shadow-md shadow-secondary/20 transition-all active:scale-[0.98]"
            >
              {checkoutLoading ? (
                <span className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isFree || pricing.effectivePrice <= 0 ? (
                <Gift className="h-4 w-4 mr-2" />
              ) : null}
              {isFree || pricing.effectivePrice <= 0 ? 'Adquirir' : 'Comprar agora'}
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <AppShell allowGuest headerTitle="Carregando...">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-7 w-48 rounded-xl bg-muted animate-pulse mb-6" />
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="rounded-xl bg-muted animate-pulse" style={{ aspectRatio: '16/9' }} />
            <div className="rounded-lg bg-muted animate-pulse h-28" />
            <div className="rounded-lg bg-muted animate-pulse h-64" />
          </div>
          <div className="xl:w-[340px] space-y-3">
            <div className="rounded-xl bg-card border border-border p-4 space-y-3">
              <div className="h-28 w-full rounded-xl bg-muted animate-pulse" />
              <div className="h-5 w-full bg-muted rounded animate-pulse" />
              <div className="h-11 w-full bg-muted rounded-lg animate-pulse mt-2" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <AppShell allowGuest headerTitle="Erro">
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="h-20 w-20 rounded-xl bg-card border border-border flex items-center justify-center mb-2">
          <Package className="h-9 w-9 text-muted-foreground" />
        </div>
        <h2 className="font-heading font-bold text-xl">Pacote não encontrado</h2>
        <p className="text-muted-foreground text-sm text-center max-w-xs">
          {message || 'Este pacote não existe ou foi removido.'}
        </p>
        <Button onClick={onBack} className="mt-2 rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar aos Pacotes
        </Button>
      </div>
    </AppShell>
  )
}
