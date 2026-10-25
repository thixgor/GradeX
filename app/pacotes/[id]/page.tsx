'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
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
  Package,
  Check,
  ChevronLeft,
  ChevronRight,
  Infinity as InfinityIcon,
  Share,
  Sparkles,
  Star,
  TrendingDown,
  Clock,
} from 'lucide-react'
import { PLUS_LABEL } from '@/lib/account-tier'
import {
  TimedAccessBanner,
  TimedAccessOptions,
  type TimedAccessVersionView,
  type TimedAccessView,
} from '@/components/materiais/timed-access'
import { AppShell } from '@/components/app-shell'
import { FundoIos } from '@/components/materiais/fundo-ios'
import { BagPlusIcon, CartButton } from '@/components/materiais/shared'
import { abrirCarrinho } from '@/lib/abrir-carrinho'
import { cn } from '@/lib/utils'
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
import type { ReviewSummary } from '@/lib/reviews-shared'
import { ProuniCta } from '@/components/prouni/prouni-cta'

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
  /** Versões de acesso por tempo publicadas pelo admin (opcional). */
  _timedAccessVersions?: TimedAccessVersionView[]
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
  /** Prazo restante quando o acesso atual veio de uma versão por tempo. */
  timedAccess?: TimedAccessView | null
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
  // null = acesso vitalício (padrão). Um id = versão por tempo escolhida.
  const [accessVersionId, setAccessVersionId] = useState<string | null>(null)
  const [cartMessage, setCartMessage] = useState('')
  const [descExpanded, setDescExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [metricSettings, setMetricSettings] = useState<PublicMetricSettings>(DEFAULT_PUBLIC_METRIC_SETTINGS)
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const { addItem, isInCart } = useMaterialCart()

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

    const chosenVersion = (pkg._timedAccessVersions || []).find(v => v.id === accessVersionId) || null
    const cartPrice = chosenVersion ? Number(chosenVersion.price || 0) : price
    const isFreePath = !chosenVersion && (pkg.pricing === 'free' || price <= 0)
    if (!isFreePath) {
      const result = addItem({
        itemType: 'package',
        itemId: id,
        title: chosenVersion ? `${pkg.title} — ${chosenVersion.label}` : pkg.title,
        pricing: pkg.pricing,
        price: cartPrice,
        coverImage: pkg.coverImage,
        materialCount: data.materials.length,
        effectivePrice: cartPrice,
        originalPrice: Number(pkg.price || cartPrice),
        discountApplied: chosenVersion ? 0 : Number(pricing.discountApplied || 0),
        ...(chosenVersion
          ? {
              accessVersionId: chosenVersion.id,
              accessVersionLabel: chosenVersion.label,
              accessDurationLabel: chosenVersion.durationLabel,
            }
          : {}),
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
    // A versão escolhida viaja na URL e é revalidada no servidor. Numa
    // renovação, o padrão é a primeira versão publicada.
    const renewalDefault = data.timedAccess?.isTimed
      ? (data.package._timedAccessVersions?.[0]?.id || null)
      : null
    const chosenVersionId = accessVersionId || renewalDefault
    const versionQuery = chosenVersionId ? `&accessVersionId=${encodeURIComponent(chosenVersionId)}` : ''
    const checkoutPath = `/materiais/checkout?type=package&id=${id}${versionQuery}`
    if (!data.access.isAuthenticated) {
      // Compra sem login via Serial Key (nome/e-mail/telefone no checkout).
      router.push(`/comprar?productType=package&productId=${id}&itemType=package${versionQuery}`)
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

  // A barra de compra do celular só sobe quando os botões do painel saem da
  // tela — com eles à vista, seria o mesmo botão duas vezes.
  const ctaRef = useRef<HTMLDivElement>(null)
  const [ctaVisivel, setCtaVisivel] = useState(true)
  useEffect(() => {
    const node = ctaRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setCtaVisivel(false)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setCtaVisivel(entry.isIntersecting), {
      rootMargin: '0px 0px -40px 0px',
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [loading, data?.package?._id, data?.access?.hasAccess, data?.access?.includedInPlus])

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
  const timedAccess = data.timedAccess || null
  const timedVersions = pkg._timedAccessVersions || []
  const selectedTimedVersion = timedVersions.find((version) => version.id === accessVersionId) || null

  // Lote dinâmico por evento
  const eventState = data.pricingEventState || null
  const tierPct = eventState?.activeTier?.discountPercent || 0
  const hasTier = !isFree && !!eventState?.activeTier && eventState.isActive !== false && tierPct > 0
  const tierFinalPrice = hasTier
    ? Math.max(0, Math.round(pricing.effectivePrice * (1 - tierPct / 100) * 100) / 100)
    : pricing.effectivePrice
  const tierSavings = hasTier ? Math.max(0, pricing.effectivePrice - tierFinalPrice) : 0
  const heroSizes = '(max-width: 1280px) 100vw, 60vw'
  const reviewCount = reviewSummary?.count ?? 0
  const isFreePath = isFree || pricing.effectivePrice <= 0
  const displayPrice = selectedTimedVersion ? Number(selectedTimedVersion.price || 0) : tierFinalPrice
  const jumpToReviews = () =>
    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Quanto os itens custariam separados — o argumento do pacote, em número.
  const separateTotal = materials.reduce((sum, m) => sum + (m.pricing === 'paid' ? Number(m.price || 0) : 0), 0)
  const separateSavings = !isFreePath && !selectedTimedVersion && separateTotal > displayPrice
    ? separateTotal - displayPrice
    : 0
  const separateSavingsPct = separateSavings > 0 ? Math.round((separateSavings / separateTotal) * 100) : 0
  // O "de" riscado acima do preço: o desconto que vale agora, na ordem em que
  // o servidor os aplica (itens já seus → lote).
  const strikePrice = selectedTimedVersion
    ? null
    : hasTier
      ? pricing.effectivePrice
      : hasDiscount
        ? pricing.originalPackagePrice
        : hasStaticDiscount
          ? pkg.originalPrice
          : null
  const totalPages = materials.reduce((sum, m) => sum + (m.type === 'pdf' && m._pageCount ? m._pageCount : 0), 0)
  const typeCounts = materials.reduce<Record<string, number>>((acc, m) => {
    const label = TYPE_LABELS[m.type] || 'Arquivo'
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})
  const typeSummary = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => `${count} ${label}${count > 1 && label !== 'PDF' ? 's' : ''}`)
    .slice(0, 3)
    .join(', ')

  const infoCells: { key: string; label: string; value: React.ReactNode; note: React.ReactNode }[] = []
  if (reviewCount > 0 && reviewSummary) {
    infoCells.push({
      key: 'reviews',
      label: `${reviewCount} ${reviewCount === 1 ? 'avaliação' : 'avaliações'}`,
      value: reviewSummary.avg.toFixed(1).replace('.', ','),
      note: <StarRow value={reviewSummary.avg} />,
    })
  }
  infoCells.push({ key: 'items', label: 'No pacote', value: totalItems, note: totalItems === 1 ? 'material' : 'materiais' })
  if (separateSavingsPct > 0 && !access.hasAccess) {
    infoCells.push({ key: 'save', label: 'Economia', value: `${separateSavingsPct}%`, note: 'vs. separados' })
  }
  if (totalPages > 0) {
    infoCells.push({ key: 'pages', label: 'Leitura', value: compactNumber(totalPages), note: 'páginas' })
  }
  infoCells.push({
    key: 'access',
    label: 'Acesso',
    value: access.hasAccess
      ? <Check className="h-[22px] w-[22px]" strokeWidth={2.5} />
      : isFreePath ? 'Grátis' : <InfinityIcon className="h-[25px] w-[25px]" />,
    note: access.hasAccess
      ? (timedAccess?.isTimed ? 'por tempo' : 'liberado')
      : isFreePath ? 'para sempre' : timedVersions.length > 0 ? 'vitalício ou por tempo' : 'vitalício',
  })
  if (showMaterialViews) {
    infoCells.push({ key: 'views', label: 'Visualizações', value: compactNumber(pkg.viewCount), note: 'no total' })
  }
  if (showMaterialDownloads) {
    infoCells.push({ key: 'dl', label: 'Downloads', value: compactNumber(pkg.downloadCount), note: 'no total' })
  }

  const spinner = <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

  const purchaseBody = access.hasAccess ? (
    <div className="space-y-2.5">
      <p className="ios-tinta flex items-center gap-1.5 text-[15px] font-semibold">
        <Check className="h-4 w-4" strokeWidth={2.75} /> Pacote na sua biblioteca
      </p>
      <a href="#itens-do-pacote" className="ios-botao ios-botao-g w-full">
        Ver os {totalItems} {totalItems === 1 ? 'material' : 'materiais'}
      </a>
      <p className="ios-rotulo-3 text-center text-[12px]">Cada material abre pela lista do pacote.</p>
    </div>
  ) : access.includedInPlus ? (
    <div className="space-y-2.5">
      <p className="ios-ambar flex items-center gap-1.5 text-[15px] font-semibold">
        <Crown className="h-4 w-4" /> Incluído no {PLUS_LABEL}
      </p>
      <div ref={ctaRef}>
        <button type="button" onClick={handleClaimWithPlus} disabled={checkoutLoading} className="ios-botao-ambar ios-botao-g w-full">
          {checkoutLoading ? spinner : <Gift className="h-[18px] w-[18px]" />}
          Resgatar pacote
        </button>
      </div>
      <p className="ios-rotulo-3 text-center text-[12px]">Sem custo — já faz parte da sua assinatura.</p>
      {cartMessage && (
        <p role="status" className="ios-tinta rounded-[14px] bg-[var(--ios-tinta-suave)] px-3 py-2.5 text-center text-[13px] font-semibold">
          {cartMessage}
        </p>
      )}
    </div>
  ) : (
    <div className="space-y-3">
      <div>
        {isFreePath ? (
          <p className="ios-preco ios-tinta">Grátis</p>
        ) : (
          <>
            {strikePrice && strikePrice > displayPrice && (
              <p className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                <span className="ios-rotulo-3 tabular-nums line-through">{fmtBRL(strikePrice)}</span>
                <span className="ios-tinta font-semibold">
                  −{Math.round((1 - displayPrice / strikePrice) * 100)}%
                  {hasTier ? ` no lote${eventState?.activeTier?.label ? ` ${eventState.activeTier.label}` : ''}` : hasDiscount ? ' pelo que você já tem' : ''}
                </span>
                {hasTier && <PricingEventBadge state={eventState} size="xs" />}
              </p>
            )}
            <p className="ios-preco">{displayPrice <= 0 ? 'Grátis' : fmtBRL(displayPrice)}</p>
            <p className="ios-rotulo-2 mt-1 text-[13px]">
              {selectedTimedVersion
                ? `Pagamento único · acesso por ${selectedTimedVersion.durationLabel}, sem download`
                : 'Pagamento único · acesso vitalício'}
            </p>
          </>
        )}
      </div>

      {/* Desconto pelo que a pessoa já tem: dizer de onde veio o número. */}
      {hasDiscount && !selectedTimedVersion && (
        <p className="ios-tinta flex items-start gap-2 rounded-[14px] bg-[var(--ios-tinta-suave)] px-3.5 py-3 text-[13px] font-medium leading-snug">
          <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" />
          Você já tem {pricing.ownedMaterialIds.length} {pricing.ownedMaterialIds.length === 1 ? 'item' : 'itens'} deste pacote, então
          descontamos {fmtBRL(pricing.discountApplied)}.
        </p>
      )}

      {!isFree && timedVersions.length > 0 && (
        <TimedAccessOptions
          versions={timedVersions}
          value={accessVersionId}
          onChange={setAccessVersionId}
          fullPrice={hasTier ? tierFinalPrice : pricing.effectivePrice}
          fullPriceLabel="Pacote completo, para sempre"
          disabled={checkoutLoading}
        />
      )}

      <div ref={ctaRef} className="space-y-2 pt-1">
        {isFreePath ? (
          <button type="button" onClick={handleAcquire} disabled={checkoutLoading} className="ios-botao ios-botao-g w-full">
            {checkoutLoading ? spinner : <Gift className="h-[18px] w-[18px]" />}
            Obter grátis
          </button>
        ) : (
          <>
            <button type="button" onClick={handleBuyNow} disabled={checkoutLoading} className="ios-botao ios-botao-g w-full">
              {checkoutLoading ? spinner : null}
              Comprar pacote
            </button>
            {isInCart('package', id) ? (
              <button type="button" onClick={abrirCarrinho} className="ios-botao-suave ios-botao-g w-full">
                <Check className="ios-pop h-[18px] w-[18px]" strokeWidth={3} /> No carrinho · ver carrinho
              </button>
            ) : (
              <button type="button" onClick={handleAcquire} disabled={checkoutLoading} className="ios-botao-suave ios-botao-g w-full">
                <BagPlusIcon /> Adicionar ao carrinho
              </button>
            )}
          </>
        )}
      </div>

      {separateSavings > 0 && (
        <p className="ios-rotulo-2 text-center text-[13px]">
          Separados, custariam <span className="tabular-nums line-through">{fmtBRL(separateTotal)}</span> —{' '}
          <span className="ios-tinta font-semibold">você economiza {fmtBRL(separateSavings)}</span>.
        </p>
      )}

      {isInCart('package', id) && (
        <p className="ios-rotulo-2 text-center text-[13px]">
          Dá para juntar outros materiais e pagar tudo de uma vez.{' '}
          <Link href="/materiais" className="ios-tinta font-semibold">Continuar escolhendo</Link>
        </p>
      )}
      {cartMessage && (
        <p role="status" className="ios-tinta flex items-center justify-center gap-1.5 rounded-[14px] bg-[var(--ios-tinta-suave)] px-3 py-2.5 text-center text-[13px] font-semibold">
          <Check className="h-4 w-4" strokeWidth={2.75} /> {cartMessage}
        </p>
      )}
      {!isFree && <ProuniCta itemType="package" itemId={id} />}
    </div>
  )

  return (
    <AppShell allowGuest vidro headerTitle={pkg.title} headerSubtitle="Pacote">
      <FundoIos
        capa={pkg.coverImage || null}
        capaSizes={heroSizes}
        className={showMobilePurchaseBar ? 'pb-32 xl:pb-16' : 'pb-16'}
      >
        <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-5 lg:px-8">
          <Link href="/materiais?tab=packages" className="ios-voltar -ml-2.5 mb-3">
            <ChevronLeft className="h-[22px] w-[22px] shrink-0" strokeWidth={2.5} />
            Pacotes
          </Link>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
            {/* ── Capa ── */}
            <div className="min-w-0 xl:col-start-1 xl:row-start-1">
              <div className="ios-assenta ios-capa relative w-full overflow-hidden rounded-[22px] shadow-[var(--ios-sombra-alta)] sm:rounded-[28px]" style={{ aspectRatio: '16/9' }}>
                {pkg.coverImage ? (
                  <Image src={pkg.coverImage} alt={pkg.title} fill className="object-cover" sizes={heroSizes} priority />
                ) : (
                  <PackageCoverMosaic materials={materials} />
                )}
              </div>
            </div>

            {/* ── Título e compra ── */}
            <aside className="min-w-0 xl:col-start-2 xl:row-span-2 xl:row-start-1">
              <div className="space-y-4 xl:sticky xl:top-24">
                <div className="ios-painel">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="ios-titulo-produto">{pkg.title}</h1>
                      <p className="ios-rotulo-2 mt-1 text-[15px]">
                        Pacote · {totalItems} {totalItems === 1 ? 'material' : 'materiais'}
                        {typeSummary ? ` · ${typeSummary}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={copyShareLink}
                      title={copied ? 'Link copiado!' : 'Copiar link'}
                      aria-label={copied ? 'Link copiado' : 'Copiar link do pacote'}
                      className="ios-icone-botao ios-icone-botao-g -mr-1"
                    >
                      {copied ? <Check className="h-[18px] w-[18px]" strokeWidth={2.5} /> : <Share className="h-[18px] w-[18px]" />}
                    </button>
                  </div>

                  {reviewCount > 0 && (
                    <button
                      type="button"
                      onClick={jumpToReviews}
                      className="ios-rotulo-2 mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium"
                    >
                      <StarRow value={reviewSummary?.avg ?? 0} />
                      <span className="tabular-nums">{(reviewSummary?.avg ?? 0).toFixed(1).replace('.', ',')}</span>
                      <span>· {reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'}</span>
                    </button>
                  )}

                  <div className="mt-5">{purchaseBody}</div>
                </div>

                {pkg.allowedGroups?.length > 0 && (
                  <section className="ios-lista p-4">
                    <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Acesso por plano</h2>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {pkg.allowedGroups.map(g => {
                        const meta = GROUP_META[g]
                        if (!meta) return null
                        return (
                          <span
                            key={g}
                            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                            style={{ color: meta.color, background: meta.color + '1f' }}
                          >
                            {meta.icon} {meta.label}
                          </span>
                        )
                      })}
                    </div>
                    {!access.hasGroupAccess && (
                      <p className="ios-rotulo-2 mt-2.5 text-[13px] leading-relaxed">
                        Seu plano atual não inclui este pacote. Faça upgrade para desbloquear.
                      </p>
                    )}
                  </section>
                )}
              </div>
            </aside>

            {/* ── Conteúdo ── */}
            <div className="min-w-0 space-y-8 xl:col-start-1 xl:row-start-2">
              {access.hasAccess && timedAccess?.isTimed && (
                <TimedAccessBanner
                  access={timedAccess}
                  itemLabel="pacote"
                  versions={timedVersions}
                  selectedVersionId={accessVersionId}
                  onSelectVersion={setAccessVersionId}
                  onRenew={handleBuyNow}
                  renewLoading={checkoutLoading}
                  fullPrice={pricing.effectivePrice}
                  fullPriceLabel="Pacote completo, para sempre"
                />
              )}

              {hasTier && eventState && !access.hasAccess && <PricingEventCountdown state={eventState} />}

              <div className="ios-lista py-3.5">
                <div className="ios-faixa" role="list" aria-label="Informações do pacote">
                  {infoCells.map(cell => (
                    <div key={cell.key} role="listitem">
                      <span className="ios-faixa-rotulo">{cell.label}</span>
                      <span className="ios-faixa-valor">{cell.value}</span>
                      <span className="ios-faixa-nota">{cell.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Oferta de versão impressa (add-on vinculado ao pacote) */}
              <PrintedAddon packageId={id} />

              {pkg.description && (
                <section>
                  <h2 className="ios-titulo-secao mb-2.5">Sobre o pacote</h2>
                  <p className={cn('max-w-[68ch] whitespace-pre-line text-[16px] leading-relaxed text-[var(--ios-rotulo)]', !descExpanded && 'line-clamp-5')}>
                    {pkg.description}
                  </p>
                  {descLong && (
                    <button
                      type="button"
                      onClick={() => setDescExpanded(e => !e)}
                      aria-expanded={descExpanded}
                      className="ios-tinta mt-1.5 text-[15px] font-semibold"
                    >
                      {descExpanded ? 'menos' : 'mais'}
                    </button>
                  )}
                  {pkg.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {pkg.tags.map(tag => (
                        <span key={tag} className="ios-rotulo-2 rounded-full bg-[var(--ios-preenchimento)] px-3 py-1 text-[13px] font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <section id="itens-do-pacote" className="scroll-mt-24">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2 className="ios-titulo-secao">Neste pacote</h2>
                  <span className="ios-rotulo-2 text-[15px] tabular-nums">
                    {totalItems} {totalItems === 1 ? 'material' : 'materiais'}
                  </span>
                </div>

                {materials.length === 0 ? (
                  <div className="ios-lista ios-rotulo-2 px-5 py-10 text-center text-[15px]">
                    Nenhum material disponível neste pacote.
                  </div>
                ) : (
                  <ul className="ios-lista [--ios-recuo:104px]">
                    {materials.map((m) => {
                      const owned = m._isPurchased || access.isPurchased
                      const isOwnedExtra = m._isPurchased && !access.isPurchased
                      const detail = m.type === 'pdf' && m._pageCount
                        ? `${m._pageCount} ${m._pageCount === 1 ? 'página' : 'páginas'}`
                        : m.videoDuration
                          ? formatDuration(m.videoDuration)
                          : null
                      return (
                        <li key={m._id}>
                          <Link href={`/materiais/${m._id}`} className="ios-linha group py-3">
                            <span className="ios-capa relative h-[54px] w-[76px] shrink-0 rounded-[12px]">
                              {m.coverImage ? (
                                <Image src={m.coverImage} alt="" fill className="object-cover" sizes="76px" />
                              ) : (
                                <span className="ios-capa-vazia ios-tinta flex h-full w-full items-center justify-center">
                                  {TYPE_ICONS[m.type] || <File className="h-5 w-5" />}
                                </span>
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 block text-[15px] font-semibold leading-snug tracking-[-0.01em]">
                                {m.title}
                              </span>
                              <span className="ios-rotulo-2 mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px]">
                                <span>{TYPE_LABELS[m.type] || 'Arquivo'}</span>
                                {detail && <><span aria-hidden>·</span><span>{detail}</span></>}
                                {isOwnedExtra ? (
                                  <><span aria-hidden>·</span><span className="ios-tinta font-semibold">Já é seu</span></>
                                ) : !owned && m.pricing === 'paid' && Number(m.price) > 0 ? (
                                  <><span aria-hidden>·</span><span className="tabular-nums">{fmtBRL(m.price)} separado</span></>
                                ) : !owned && m.pricing === 'free' ? (
                                  <><span aria-hidden>·</span><span>grátis</span></>
                                ) : null}
                              </span>
                            </span>
                            {owned ? (
                              <span className="ios-tinta flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ios-tinta-suave)]">
                                <Check className="h-4 w-4" strokeWidth={2.75} />
                              </span>
                            ) : null}
                            <ChevronRight className="ios-rotulo-3 h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              {/* Prova social: avaliações agregadas dos materiais do pacote */}
              <PackageReviews
                id="reviews-section"
                packageId={id}
                onSummaryChange={setReviewSummary}
              />
            </div>
          </div>
        </div>

        {showMobilePurchaseBar && (
          <div
            className="ios-barra-inferior ios-vidro flex items-center gap-3 p-2 pl-2.5 xl:hidden"
            data-visivel={ctaVisivel ? 'false' : 'true'}
            aria-hidden={ctaVisivel}
          >
            <span className="ios-capa relative h-11 w-11 shrink-0 rounded-[12px]">
              {pkg.coverImage ? (
                <Image src={pkg.coverImage} alt="" fill sizes="44px" className="object-cover" />
              ) : (
                <span className="ios-capa-vazia ios-tinta flex h-full w-full items-center justify-center">
                  <Package className="h-5 w-5" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold tracking-[-0.01em]">{pkg.title}</span>
              <span className="block text-[13px] font-semibold tabular-nums">
                {access.includedInPlus ? (
                  <span className="ios-ambar">Incluído no {PLUS_LABEL}</span>
                ) : isFreePath || displayPrice <= 0 ? (
                  <span className="ios-tinta">Grátis</span>
                ) : (
                  <>
                    {strikePrice && strikePrice > displayPrice && (
                      <span className="ios-rotulo-3 mr-1.5 font-medium line-through">{fmtBRL(strikePrice)}</span>
                    )}
                    {fmtBRL(displayPrice)}
                    {selectedTimedVersion && <span className="ios-rotulo-2 ml-1.5 font-medium">{selectedTimedVersion.durationLabel}</span>}
                  </>
                )}
              </span>
            </span>
            {!access.includedInPlus && !isFreePath && (
              <CartButton
                inCart={isInCart('package', id)}
                onAdd={handleAcquire}
                disabled={checkoutLoading}
                itemTitle={`pacote ${pkg.title}`}
                className="h-11"
                tabIndex={ctaVisivel ? -1 : 0}
              />
            )}
            <button
              type="button"
              tabIndex={ctaVisivel ? -1 : 0}
              onClick={access.includedInPlus ? handleClaimWithPlus : isFreePath ? handleAcquire : handleBuyNow}
              disabled={checkoutLoading}
              className={access.includedInPlus ? 'ios-botao-ambar' : 'ios-botao'}
            >
              {checkoutLoading ? spinner : null}
              {access.includedInPlus ? 'Resgatar' : isFreePath ? 'Obter' : 'Comprar'}
            </button>
          </div>
        )}
      </FundoIos>
    </AppShell>
  )
}

/**
 * Capa do pacote que não tem capa própria: as capas do que vem dentro, em
 * mosaico — o pacote se apresenta pelo próprio conteúdo.
 */
function PackageCoverMosaic({ materials }: { materials: PackageMaterial[] }) {
  const covers = materials.filter(m => m.coverImage).slice(0, 4)
  if (covers.length < 2) {
    return (
      <div className="ios-capa-vazia flex h-full w-full items-center justify-center">
        <span className="ios-tinta flex h-24 w-24 items-center justify-center rounded-[26px] bg-white/70 shadow-sm dark:bg-white/10">
          <Package className="h-11 w-11" />
        </span>
      </div>
    )
  }
  return (
    <div className={cn('grid h-full w-full gap-[3px] bg-[var(--ios-separador)]', covers.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2')}>
      {covers.map((m, i) => (
        <span key={m._id} className={cn('relative', covers.length === 3 && i === 0 && 'row-span-2')}>
          <Image src={m.coverImage} alt="" fill className="object-cover" sizes="(max-width: 1280px) 50vw, 30vw" />
        </span>
      ))}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <AppShell allowGuest vidro headerTitle="Carregando...">
      <FundoIos className="pb-16">
        <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-5 lg:px-8" aria-hidden>
          <div className="ios-esqueleto mb-4 h-7 w-28 rounded-full" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
            <div className="space-y-6">
              <div className="ios-esqueleto rounded-[22px] sm:rounded-[28px]" style={{ aspectRatio: '16/9' }} />
              <div className="ios-esqueleto hidden h-64 rounded-[18px] xl:block" />
            </div>
            <div className="ios-painel space-y-3">
              <div className="ios-esqueleto h-8 w-11/12 rounded-full" />
              <div className="ios-esqueleto h-4 w-1/2 rounded-full" />
              <div className="ios-esqueleto mt-6 h-9 w-32 rounded-full" />
              <div className="ios-esqueleto h-[50px] w-full rounded-full" />
              <div className="ios-esqueleto h-[50px] w-full rounded-full" />
            </div>
          </div>
        </div>
      </FundoIos>
    </AppShell>
  )
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <AppShell allowGuest vidro headerTitle="Erro">
      <FundoIos>
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <span className="ios-rotulo-2 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ios-preenchimento)]">
            <Package className="h-7 w-7" />
          </span>
          <h2 className="text-[22px] font-bold tracking-[-0.02em]">Pacote não encontrado</h2>
          <p className="ios-rotulo-2 mt-1.5 max-w-xs text-[15px]">
            {message || 'Este pacote não existe ou foi removido.'}
          </p>
          <button type="button" onClick={onBack} className="ios-botao mt-6">
            <ChevronLeft className="-ml-1 h-5 w-5" /> Voltar aos pacotes
          </button>
        </div>
      </FundoIos>
    </AppShell>
  )
}

/** Cinco estrelas, cheias até a média (arredondada para meia). */
function StarRow({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className="inline-flex items-center gap-[1px]" aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={cn(
            'h-3 w-3',
            rounded >= n ? 'fill-current' : rounded >= n - 0.5 ? 'fill-current opacity-60' : 'opacity-35'
          )}
        />
      ))}
    </span>
  )
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ''}`
  return `${Math.max(1, m)}min`
}
