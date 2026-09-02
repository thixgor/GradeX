'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Play,
  Download,
  ShoppingCart,
  Lock,
  Clock,
  Eye,
  Tag,
  Shield,
  Gift,
  Crown,
  Zap,
  GraduationCap,
  FileText,
  Video,
  Link2,
  Image as ImageIcon,
  File,
  ChevronDown,
  ChevronUp,
  Package,
  ShieldAlert,
  Check,
  FolderOpen,
  Sparkles,
  Share2,
  CheckCheck,
  Layers,
  TrendingDown,
  Code2,
  MonitorPlay,
  Headphones,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import { useTrackView } from '@/hooks/use-track-view'
import { VideoWatermark } from '@/components/video-watermark'
import { PackageUpsellModal, UpsellPackage } from '@/components/materiais/package-upsell-modal'
import {
  PdfDownloadProgress,
  PdfDownloadState,
  INITIAL_DOWNLOAD_STATE,
  DownloadStepId,
} from '@/components/materiais/pdf-download-progress'
import { PdfDownloadTermsModal } from '@/components/materiais/pdf-download-terms-modal'
import {
  describePdfDownloadFailure,
  downloadPdfResponse,
  shouldUseNativePdfDownload,
  triggerNativePdfDownload,
} from '@/lib/material-download-client'
import {
  DEFAULT_PUBLIC_METRIC_SETTINGS,
  type PublicMetricSettings,
} from '@/lib/display-settings'
import { useMaterialCart } from '@/context/MaterialCartContext'
import { ReviewsSection } from '@/components/reviews/reviews-section'
import { ReviewSummaryBlock } from '@/components/reviews/review-summary'
import type { ReviewSummary } from '@/lib/reviews-shared'
import { PricingEventCountdown } from '@/components/pricing-events/PricingEventCountdown'
import { PricingEventBadge } from '@/components/pricing-events/PricingEventBadge'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import { PrintedAddon } from '@/components/shop/printed-addon'
import { PLUS_LABEL } from '@/lib/account-tier'
import { ProuniCta } from '@/components/prouni/prouni-cta'
import {
  TimedAccessBanner,
  TimedAccessOptions,
  type TimedAccessVersionView,
  type TimedAccessView,
} from '@/components/materiais/timed-access'

// ─── Types ───────────────────────────────────────────────────
interface Material {
  _id: string
  title: string
  description: string
  coverImage: string
  type: string
  downloadUrl: string
  folderId: string | null
  tags: string[]
  allowedGroups: string[]
  videoDuration?: number
  pricing: 'free' | 'paid'
  price: number
  pricingEventId?: string | null
  downloadCount: number
  viewCount: number
  createdAt: string
  _hasPdf?: boolean
  _hasHtml?: boolean
  _pageCount?: number
  _cardCount?: number
  pdfViewerEnabled?: boolean
  pdfDownloadEnabled?: boolean
  htmlViewerEnabled?: boolean
  pdfViewerConfig?: {
    preview?: {
      enabled?: boolean
      ranges?: Array<{ start: number; end: number }>
    }
  }
  /** Versões de acesso por tempo publicadas pelo admin (opcional). */
  _timedAccessVersions?: TimedAccessVersionView[]
}

interface ComplementaryItem {
  id: string
  kind: 'material' | 'custom'
  materialId?: string
  materialType?: string
  template?: string
  contentKind?: 'link' | 'html' | 'pdf' | 'video_embed'
  title: string
  description?: string
  coverImage?: string
  buttonLabel?: string
  href?: string
  pricing?: 'free' | 'paid'
  price?: number
}

interface PageData {
  material: Material
  folderName: string | null
  hasAccess: boolean
  isPurchased: boolean
  hasGroupAccess: boolean
  /** Assinante Plus+ leva sem custo, mas ainda precisa resgatar. */
  includedInPlus?: boolean
  userGroups: string[]
  isAuthenticated: boolean
  watermark: { name: string; cpf: string }
  complementaryItems?: ComplementaryItem[]
  /** Prazo restante quando o acesso atual veio de uma versão por tempo. */
  timedAccess?: TimedAccessView | null
}

// ─── Constants ───────────────────────────────────────────────
const GROUP_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  gratuito:  { label: 'Gratuito',  color: '#6b7280', icon: <Gift className="h-3.5 w-3.5" /> },
  trial:     { label: 'Trial',     color: '#3b82f6', icon: <Clock className="h-3.5 w-3.5" /> },
  essential: { label: 'Plus+', color: '#8b5cf6', icon: <Zap className="h-3.5 w-3.5" /> },
  premium:   { label: 'Plus+',   color: '#f59e0b', icon: <Crown className="h-3.5 w-3.5" /> },
  monitor:   { label: 'Monitor',   color: '#10b981', icon: <GraduationCap className="h-3.5 w-3.5" /> },
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf:         <FileText className="h-4 w-4" />,
  html:        <Code2 className="h-4 w-4" />,
  video:       <Video className="h-4 w-4" />,
  video_embed: <Play className="h-4 w-4" />,
  link:        <Link2 className="h-4 w-4" />,
  image:       <ImageIcon className="h-4 w-4" />,
  document:    <File className="h-4 w-4" />,
  other:       <File className="h-4 w-4" />,
  flashcard_deck: <Layers className="h-4 w-4" />,
}

const TYPE_LABELS: Record<string, string> = {
  pdf:         'PDF',
  html:        'Experiência HTML',
  video:       'Vídeo',
  video_embed: 'Vídeo',
  link:        'Link',
  image:       'Imagem',
  document:    'Documento',
  other:       'Arquivo',
  flashcard_deck: 'Flashcards',
}

// Templates dos itens complementares avulsos → ícone, rótulo e CTA padrão.
const COMPLEMENTARY_TEMPLATE_META: Record<string, { label: string; icon: React.ReactNode; cta: string }> = {
  experiencia: { label: 'Experiência', icon: <MonitorPlay className="h-4 w-4" />, cta: 'Acessar' },
  pdf:         { label: 'PDF',         icon: <FileText className="h-4 w-4" />,    cta: 'Abrir' },
  aula:        { label: 'Aula',        icon: <GraduationCap className="h-4 w-4" />, cta: 'Assistir' },
  podcast:     { label: 'Podcast',     icon: <Headphones className="h-4 w-4" />,  cta: 'Ouvir agora' },
  ebook:       { label: 'Ebook',       icon: <BookOpen className="h-4 w-4" />,    cta: 'Ler agora' },
}

function ComplementaryCard({ item }: { item: ComplementaryItem }) {
  const isMaterial = item.kind === 'material'
  const tmplMeta = !isMaterial ? (COMPLEMENTARY_TEMPLATE_META[item.template || 'experiencia'] || COMPLEMENTARY_TEMPLATE_META.experiencia) : null
  const icon = isMaterial ? (TYPE_ICONS[item.materialType || 'other'] || <File className="h-4 w-4" />) : tmplMeta!.icon
  const badgeLabel = isMaterial ? (TYPE_LABELS[item.materialType || 'other'] || 'Material') : tmplMeta!.label
  const ctaLabel = item.buttonLabel || (isMaterial ? 'Acessar' : tmplMeta!.cta)
  const href = item.href || ''
  const isInternal = href.startsWith('/')

  const inner = (
    <>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 to-accent/10">
        {item.coverImage ? (
          <Image src={item.coverImage} alt={item.title} fill className="object-cover" sizes="64px" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-primary">{icon}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {icon}
          {badgeLabel}
        </span>
        <p className="mt-1 truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
          {item.title}
        </p>
        {item.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        ) : null}
      </div>
      {href ? (
        <span className="ml-1 flex shrink-0 items-center gap-1 self-center rounded-xl bg-gradient-to-r from-emerald-600 to-amber-500 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-transform group-hover:scale-[1.03]">
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </>
  )

  const cardClass = "group flex items-center gap-3 rounded-lg border border-border/40 glass-button p-3 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.99]"

  if (!href) {
    return <div className={cardClass}>{inner}</div>
  }
  if (isInternal) {
    return <Link href={href} className={cardClass}>{inner}</Link>
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cardClass}>
      {inner}
    </a>
  )
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m > 0 ? `${m}min` : ''}`.trim()
  if (m > 0) return `${m}min${s > 0 ? ` ${s}s` : ''}`
  return `${s}s`
}

// ─── Main Page ───────────────────────────────────────────────
export default function MaterialViewPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const [descExpanded, setDescExpanded] = useState(false)
  const [upsellPkg, setUpsellPkg] = useState<UpsellPackage | null>(null)
  const [downloadState, setDownloadState] = useState<PdfDownloadState>(INITIAL_DOWNLOAD_STATE)
  const [downloadTermsOpen, setDownloadTermsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [metricSettings, setMetricSettings] = useState<PublicMetricSettings>(DEFAULT_PUBLIC_METRIC_SETTINGS)
  // null = acesso vitalício (padrão). Um id = versão por tempo escolhida.
  const [accessVersionId, setAccessVersionId] = useState<string | null>(null)
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const { addItem } = useMaterialCart()

  // Registra a abertura do material para o painel de estatísticas. Os logs do
  // leitor (`material_pdf_viewer_logs`) só existem para quem abre o PDF — este
  // evento cobre também quem só olhou a página do material.
  useTrackView(
    data?.material
      ? {
          kind: 'material_open',
          resourceId: data.material._id,
          resourceTitle: data.material.title,
          meta: { tipo: data.material.type || '', temAcesso: data.hasAccess },
        }
      : null,
    !!data?.material
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/materiais/${id}`, { cache: 'no-store' })
      if (res.status === 404) { router.push('/materiais'); return }
      if (!res.ok) { setError('Erro ao carregar material'); return }
      const json = await res.json()
      setData(json)
    } catch {
      setError('Erro ao carregar material')
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

  // Cleanup timers on unmount
  useEffect(() => () => { stepTimersRef.current.forEach(clearTimeout) }, [])

  // ─── PDF download with step progress ─────────────────────
  const startPdfDownload = useCallback(async () => {
    if (!data) return
    const { material } = data

    // Clear any existing timers
    stepTimersRef.current.forEach(clearTimeout)
    stepTimersRef.current = []

    setDownloadState({ step: 'auth', status: 'running' })

    // Simulate step progression tied to realistic server timing
    const t1 = setTimeout(() => {
      setDownloadState(s => s.status === 'running' ? { ...s, step: 'fetch' } : s)
    }, 400)
    const t2 = setTimeout(() => {
      setDownloadState(s => s.status === 'running' ? { ...s, step: 'watermark' } : s)
    }, 1800)
    stepTimersRef.current = [t1, t2]

    try {
      if (shouldUseNativePdfDownload()) {
        stepTimersRef.current.forEach(clearTimeout)
        setDownloadState({ step: 'ready', status: 'running' })
        triggerNativePdfDownload(material._id)
        const tSuccess = setTimeout(() => {
          setDownloadState({ step: 'ready', status: 'success' })
        }, 1200)
        const tClose = setTimeout(() => setDownloadState(INITIAL_DOWNLOAD_STATE), 5200)
        stepTimersRef.current = [tSuccess, tClose]
        return
      }

      const res = await fetch('/api/materiais/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId: material._id }),
      })

      // Response received — clear pending timers, move to ready
      stepTimersRef.current.forEach(clearTimeout)
      stepTimersRef.current = []

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setDownloadState({
          step: 'auth',
          status: 'error',
          error: errData.error || 'Erro ao gerar PDF. Tente novamente.',
          errorStep: 'auth',
        })
        return
      }

      setDownloadState({ step: 'ready', status: 'running' })

      await downloadPdfResponse(res, `${material.title}.pdf`)

      setDownloadState({ step: 'ready', status: 'success' })

      // Auto-dismiss after success
      const tClose = setTimeout(() => setDownloadState(INITIAL_DOWNLOAD_STATE), 2800)
      stepTimersRef.current = [tClose]

    } catch (error) {
      stepTimersRef.current.forEach(clearTimeout)
      stepTimersRef.current = []
      setDownloadState(s => ({
        ...s,
        status: 'error',
        error: describePdfDownloadFailure(error),
        errorStep: s.step as DownloadStepId,
      }))
    }
  }, [data])

  // ─── Generic download / open ─────────────────────────────
  const handleDownload = useCallback(() => {
    if (!data) return
    const { material } = data

    if (material.type === 'link') {
      window.open(material.downloadUrl, '_blank', 'noopener')
      return
    }
    if (material.type === 'flashcard_deck' && material.downloadUrl) {
      router.push(material.downloadUrl)
      return
    }
    if (material._hasPdf) {
      setDownloadTermsOpen(true)
      return
    }
    if (material.downloadUrl) {
      window.open(material.downloadUrl, '_blank', 'noopener')
    }
  }, [data, router, startPdfDownload])

  const handleOpenPdfViewer = useCallback(() => {
    if (!data) return
    router.push(`/materiais/${data.material._id}/viewer`)
  }, [data, router])

  const handleOpenHtmlViewer = useCallback(() => {
    if (!data) return
    router.push(`/materiais/${data.material._id}/html`)
  }, [data, router])

  const showCartMessage = useCallback((message: string) => {
    setCartMessage(message)
    setTimeout(() => setCartMessage(''), 3500)
  }, [])

  const addMaterialToCart = useCallback((mat: Material) => {
    const version = (mat._timedAccessVersions || []).find(v => v.id === accessVersionId) || null
    const price = version ? Number(version.price || 0) : Number(mat.price || 0)
    const result = addItem({
      itemType: 'material',
      itemId: mat._id,
      title: version ? `${mat.title} — ${version.label}` : mat.title,
      pricing: mat.pricing,
      price,
      coverImage: mat.coverImage,
      materialType: mat.type,
      effectivePrice: price,
      originalPrice: version ? Number(mat.price || 0) : price,
      discountApplied: 0,
      ...(version
        ? {
            accessVersionId: version.id,
            accessVersionLabel: version.label,
            accessDurationLabel: version.durationLabel,
          }
        : {}),
    })
    showCartMessage(result === 'added' ? 'Material adicionado ao carrinho.' : 'Este material já está no carrinho.')
  }, [addItem, showCartMessage, accessVersionId])

  // ─── Acquire ──────────────────────────────────────────────
  // Add-to-cart é fluxo leve: sem upsell (sugestões aparecem como banner no checkout).
  // Free vira unlock imediato. Pago vira adição no carrinho.
  /**
   * Resgate pela assinatura Plus+ — grava a aquisição direto, sem carrinho
   * nem checkout. O servidor valida assinatura e cota do Plus+ Guard.
   */
  const handleClaimWithPlus = async () => {
    if (!data?.isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/materiais/${id}`)}`)
      return
    }
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/materiais/resgatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'material', itemId: id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        showCartMessage(json.error || 'Não foi possível resgatar este material.')
        return
      }
      showCartMessage(json.message || 'Material resgatado!')
      await fetchData()
    } catch {
      showCartMessage('Não foi possível resgatar este material.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleAcquire = async () => {
    if (!data) return
    const mat = data.material
    fetch('/api/analytics/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'buy_click',
        productId: id,
        productTitle: mat.title,
        productType: mat.type === 'flashcard_deck' ? 'flashcard' : 'material',
        amount: Number(mat.price || 0),
        source: 'Compra direta',
        metadata: { itemType: 'material', materialType: mat.type },
      }),
      keepalive: true,
    }).catch(() => {})

    const isFreeItem = mat.pricing === 'free' || !mat.price || mat.price <= 0
    if (!isFreeItem) {
      addMaterialToCart(mat)
      return
    }

    if (!data.isAuthenticated) {
      const checkoutPath = `/materiais/checkout?type=material&id=${id}`
      router.push(`/auth/login?redirect=${encodeURIComponent(checkoutPath)}`)
      return
    }
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/materiais/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'material', itemId: id, paymentMethodId: 'free' }),
      })
      const json = await res.json()
      if (json.free) { await fetchData() }
      else { alert(json.error || 'Erro ao processar') }
    } catch {
      alert('Erro ao processar aquisição')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Buy-now é alta intenção: aqui sim vale interromper com upsell se houver pacote.
  const handleBuyNow = async (skipUpsell = false) => {
    if (!data) return
    // A versão escolhida viaja na URL: o checkout (logado ou por Serial Key)
    // revalida o id na fonte e cobra o preço da versão. Renovando (já tem
    // prazo correndo), o padrão é a primeira versão da lista.
    const renewalDefault = timedAccess?.isTimed ? (timedVersions[0]?.id || null) : null
    const chosenVersionId = accessVersionId || renewalDefault
    const versionQuery = chosenVersionId ? `&accessVersionId=${encodeURIComponent(chosenVersionId)}` : ''
    const checkoutPath = `/materiais/checkout?type=material&id=${id}${versionQuery}`
    const goCheckout = () => {
      if (!data.isAuthenticated) {
        // Compra sem login via Serial Key (nome/e-mail/telefone no checkout).
        const pt = data.material.type === 'flashcard_deck' ? 'flashcard' : 'material'
        router.push(`/comprar?productType=${pt}&productId=${id}&itemType=material${versionQuery}`)
        return
      }
      router.push(checkoutPath)
    }

    if (skipUpsell) { goCheckout(); return }

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
          pkg.materials?.some((m: any) => m._id === id)
        )
        if (matchingPkg) { setUpsellPkg(matchingPkg); return }
      }
    } catch {}
    goCheckout()
  }

  // ─── Copy share link ──────────────────────────────────────
  const copyShareLink = useCallback(() => {
    const url = `${window.location.origin}/materiais/${id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [id])

  const pricingEventStateData = usePricingEventState(data?.material?.pricingEventId || null)
  const pricingEventState = pricingEventStateData.state

  if (loading) return <LoadingSkeleton />
  if (error || !data) return <ErrorState message={error} onBack={() => router.push('/materiais')} />

  const { material, folderName, hasAccess, hasGroupAccess } = data
  const includedInPlus = data.includedInPlus === true
  const isEmbed = material.type === 'video_embed'
  const isVideo = material.type === 'video' || isEmbed
  const isFree = material.pricing === 'free'
  const tierPct = pricingEventState?.activeTier?.discountPercent || 0
  const hasActiveTier = !isFree && !!pricingEventState?.activeTier && pricingEventState.isActive !== false && tierPct > 0
  const originalPrice = Number(material.price || 0)
  const tierFinalPrice = hasActiveTier
    ? Math.max(0, Math.round(originalPrice * (1 - tierPct / 100) * 100) / 100)
    : originalPrice
  const tierSavings = hasActiveTier ? Math.max(0, originalPrice - tierFinalPrice) : 0
  const descLong = material.description && material.description.length > 200
  // Acesso por tempo limitado: prazo em andamento (ou já vencido) desta conta.
  const timedAccess = data.timedAccess || null
  const timedVersions = material._timedAccessVersions || []
  const selectedTimedVersion = timedVersions.find((version) => version.id === accessVersionId) || null
  const purchasePrice = selectedTimedVersion ? Number(selectedTimedVersion.price || 0) : tierFinalPrice

  const isPdf = material._hasPdf || material.type === 'pdf'
  const canViewPdf = hasAccess && !!material._hasPdf && material.pdfViewerEnabled === true
  // A versão por tempo é vendida como leitura na plataforma: nunca oferece
  // download (o servidor recusa de qualquer forma).
  const canDownload =
    hasAccess && !timedAccess?.isTimed && (!material._hasPdf || material.pdfDownloadEnabled !== false)
  const isHtml = material._hasHtml || material.type === 'html'
  const canViewHtml = hasAccess && !!material._hasHtml && material.htmlViewerEnabled === true
  const complementaryItems = data.complementaryItems || []

  // Prévia: quem NÃO tem acesso pode abrir o viewer e ver só as páginas
  // liberadas pelo admin. Segurança real é no servidor; aqui é só o convite.
  const previewCfg = material.pdfViewerConfig?.preview
  const previewRanges = (previewCfg?.ranges || []).filter(
    (r) => Number.isFinite(r?.start) && Number.isFinite(r?.end) && r.end >= r.start && r.start >= 1
  )
  const canPreview =
    !hasAccess &&
    !!material._hasPdf &&
    material.pdfViewerEnabled === true &&
    previewCfg?.enabled === true &&
    previewRanges.length > 0
  const previewLabel = previewRanges
    .map((r) => (r.start === r.end ? `${r.start}` : `${r.start}–${r.end}`))
    .join(', ')
  const showMaterialViews = metricSettings.materials.showViews
  const showMaterialDownloads = metricSettings.materials.showDownloads
  const hasInfoMetrics = showMaterialViews || showMaterialDownloads || (isVideo && !!material.videoDuration)
  const downloadLabel =
    material.type === 'link' ? 'Acessar Link'
    : material.type === 'flashcard_deck' ? 'Acessar Deck'
    : 'Baixar Material'
  const showMobilePurchaseBar = !hasAccess && data.isAuthenticated

  return (
    <AppShell allowGuest headerTitle={material.title} headerSubtitle={TYPE_LABELS[material.type] || 'Material'}>
      <div className={`min-h-full relative ${showMobilePurchaseBar ? 'pb-28 xl:pb-0' : ''}`}>

        {/* Ambient blobs — lighter than before */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute top-1/2 -right-40 w-[320px] h-[320px] rounded-full bg-accent/8 blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Breadcrumb nav */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 mb-6 flex-wrap"
          >
            <Link
              href="/materiais"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span className="h-7 w-7 rounded-lg border border-border bg-card rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
              </span>
              Materiais
            </Link>
            {folderName && (
              <>
                <span className="text-muted-foreground/40 text-sm">/</span>
                <Link
                  href={`/materiais?folder=${material.folderId}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  {folderName}
                </Link>
              </>
            )}
            <span className="text-muted-foreground/40 text-sm">/</span>
            <span className="text-sm font-medium text-foreground line-clamp-1 max-w-[200px]">
              {material.title}
            </span>
          </motion.div>

          {/* Oferta de versão impressa (add-on de produto físico) */}
          <PrintedAddon materialId={material._id} />

          {/* Main layout */}
          <div className="flex flex-col xl:flex-row gap-6">

            {/* LEFT: Media panel */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex-1 min-w-0"
            >
              {/* Media area */}
              <div className="rounded-3xl overflow-hidden border border-border bg-card rounded-lg shadow-2xl shadow-primary/8 border border-border/40">
                {isEmbed && hasAccess ? (
                  <VideoWatermark userName={data.watermark.name} userCpf={data.watermark.cpf}>
                    {material.downloadUrl.trim().startsWith('<') ? (
                      <div dangerouslySetInnerHTML={{ __html: material.downloadUrl }} className="w-full h-full" />
                    ) : (
                      <iframe
                        src={material.downloadUrl}
                        title={material.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    )}
                  </VideoWatermark>
                ) : isEmbed && !hasAccess ? (
                  /* Locked embed placeholder */
                  <div className="relative w-full bg-black/90" style={{ aspectRatio: '16/9' }}>
                    {material.coverImage && (
                      <Image
                        src={material.coverImage}
                        alt=""
                        fill
                        className="object-cover opacity-20 blur-sm scale-105"
                        sizes="(max-width: 1280px) 100vw, 70vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="relative"
                      >
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />
                        <div className="relative h-20 w-20 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center">
                          <Lock className="h-8 w-8 text-white/80" />
                        </div>
                      </motion.div>
                      <div className="text-center px-6">
                        <p className="text-white font-heading font-bold text-lg mb-1">Vídeo bloqueado</p>
                        <p className="text-white/60 text-sm">Adquira este material para assistir</p>
                      </div>
                      {material.videoDuration ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/80 text-sm font-medium">
                          <Clock className="h-4 w-4" />
                          {formatDuration(material.videoDuration)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : material.coverImage ? (
                  /* Cover image */
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={material.coverImage}
                      alt={material.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1280px) 100vw, 70vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl backdrop-blur-md bg-white/15 border border-white/20 text-white text-sm font-medium flex items-center gap-1.5">
                        {TYPE_ICONS[material.type]}
                        {TYPE_LABELS[material.type]}
                      </span>
                      {isPdf && hasAccess && (
                        <span className="px-3 py-1.5 rounded-xl backdrop-blur-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 text-xs font-medium flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5" /> Marca d'água
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Gradient placeholder */
                  <div className="w-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" style={{ aspectRatio: '16/9' }}>
                    <div className="h-24 w-24 rounded-3xl glass flex items-center justify-center">
                      {TYPE_ICONS[material.type] || <File className="h-12 w-12 text-primary" />}
                    </div>
                  </div>
                )}

                {/* Info bar under media */}
                <div className="px-5 py-3.5 border-t border-border/40 flex items-center gap-4 flex-wrap">
                  {hasInfoMetrics && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-1">
                      {showMaterialViews && (
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" /> {material.viewCount}
                        </span>
                      )}
                      {showMaterialDownloads && (
                        <span className="flex items-center gap-1.5">
                          <Download className="h-3.5 w-3.5" /> {material.downloadCount}
                        </span>
                      )}
                      {isVideo && material.videoDuration ? (
                        <span className="flex items-center gap-1.5 text-primary font-medium">
                          <Clock className="h-3.5 w-3.5" /> {formatDuration(material.videoDuration)}
                        </span>
                      ) : null}
                    </div>
                  )}
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="text-xs text-muted-foreground">
                      {new Date(material.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    {/* Share button */}
                    <button
                      onClick={copyShareLink}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all font-medium border ${
                        copied
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'text-muted-foreground hover:text-foreground glass-button border-border/40'
                      }`}
                    >
                      {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                      {copied ? 'Copiado!' : 'Compartilhar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Acesso por tempo limitado — quanto resta e como somar mais */}
              {hasAccess && timedAccess?.isTimed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <TimedAccessBanner
                    access={timedAccess}
                    itemLabel="material"
                    versions={timedVersions}
                    selectedVersionId={accessVersionId}
                    onSelectVersion={setAccessVersionId}
                    onRenew={() => handleBuyNow(true)}
                    renewLoading={checkoutLoading}
                    fullPrice={originalPrice}
                  />
                </motion.div>
              )}

              {/* Lote dinâmico por evento — banner full */}
              {hasActiveTier && pricingEventState && !hasAccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="mt-4"
                >
                  <PricingEventCountdown state={pricingEventState} />
                </motion.div>
              )}

              {/* Mobile purchase summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 rounded-lg border border-border/40 border border-border bg-card rounded-lg p-4 xl:hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-medium border border-primary/15">
                        {TYPE_ICONS[material.type]}
                        {TYPE_LABELS[material.type]}
                      </span>
                      {isFree ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/15">
                          <Gift className="h-3 w-3" /> Gratuito
                        </span>
                      ) : hasActiveTier ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                          <span className="line-through opacity-60">R$ {originalPrice.toFixed(2)}</span>
                          <span>R$ {tierFinalPrice.toFixed(2)}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-accent/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/15">
                          R$ {material.price?.toFixed(2)}
                        </span>
                      )}
                      {hasActiveTier && <PricingEventBadge state={pricingEventState} size="xs" />}
                    </div>

                    <h1 className="font-heading text-lg font-bold leading-snug">
                      {material.title}
                    </h1>

                    {isVideo && material.videoDuration && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(material.videoDuration)}
                      </p>
                    )}

                    {material.type === 'pdf' && material._hasPdf && material._pageCount ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        {material._pageCount} {material._pageCount === 1 ? 'página' : 'páginas'}
                      </p>
                    ) : null}

                    {material.type === 'flashcard_deck' ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Layers className="h-3.5 w-3.5" />
                        {material._cardCount ?? 0} {material._cardCount === 1 ? 'card' : 'cards'}
                      </p>
                    ) : null}
                  </div>

                  <button
                    onClick={copyShareLink}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
                      copied
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'text-muted-foreground hover:text-foreground glass-button border-border/40'
                    }`}
                    aria-label={copied ? 'Link copiado' : 'Compartilhar material'}
                  >
                    {copied ? <CheckCheck className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  </button>
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

                <div className="mt-4 space-y-2">
                  {hasAccess ? (
                    isEmbed ? (
                      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-primary/6 border border-primary/15">
                        <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          O vídeo está disponível acima.
                        </p>
                      </div>
                    ) : (
                      <>
                        {canViewPdf && (
                          <Button
                            onClick={handleOpenPdfViewer}
                            className="relative w-full h-12 overflow-hidden rounded-lg font-bold text-white border border-emerald-200/30 bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-500 hover:from-emerald-600 hover:via-emerald-500 hover:to-amber-400 shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98]"
                          >
                            <span className="absolute inset-0 bg-white/15 backdrop-blur-sm opacity-40" />
                            <span className="relative flex items-center">
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar PDF
                            </span>
                          </Button>
                        )}
                        {canDownload && (
                          <Button
                            onClick={handleDownload}
                            disabled={downloadState.status === 'running'}
                            className="w-full h-11 rounded-lg font-semibold text-white bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                          >
                            {downloadState.status === 'running' ? (
                              <>
                                <span className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processando…
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                {downloadLabel}
                              </>
                            )}
                          </Button>
                        )}
                        {isPdf && (canViewPdf || canDownload) && (
                          <p className="text-center text-[10px] text-muted-foreground/70 leading-relaxed">
                            PDF protegido com marca d&apos;água exclusiva para sua conta
                          </p>
                        )}
                        {isPdf && !canViewPdf && !canDownload && (
                          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                            O viewer e o download deste PDF estão indisponíveis no momento.
                          </div>
                        )}
                        {canViewHtml && (
                          <Button
                            onClick={handleOpenHtmlViewer}
                            className="relative w-full h-12 overflow-hidden rounded-lg font-bold text-white border border-emerald-200/30 bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-500 hover:from-emerald-600 hover:via-emerald-500 hover:to-amber-400 shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98]"
                          >
                            <span className="absolute inset-0 bg-white/15 backdrop-blur-sm opacity-40" />
                            <span className="relative flex items-center">
                              <MonitorPlay className="h-4 w-4 mr-2" />
                              Abrir Leitor HTML
                            </span>
                          </Button>
                        )}
                        {isHtml && canViewHtml && (
                          <p className="text-center text-[10px] text-muted-foreground/70 leading-relaxed">
                            Experiência protegida com marca d&apos;água exclusiva para sua conta
                          </p>
                        )}
                        {isHtml && !canViewHtml && (
                          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                            O leitor desta experiência está indisponível no momento.
                          </div>
                        )}
                      </>
                    )
                  ) : includedInPlus ? (
                    <>
                      <span className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                        <Crown className="h-4 w-4" /> Incluído no {PLUS_LABEL}
                      </span>
                      <Button
                        onClick={handleClaimWithPlus}
                        disabled={checkoutLoading}
                        className="h-11 w-full rounded-lg bg-gradient-to-r from-primary to-primary/80 font-semibold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                      >
                        {checkoutLoading
                          ? <span className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <Gift className="h-4 w-4 mr-2" />}
                        Resgatar material
                      </Button>
                      <p className="text-center text-[10px] text-muted-foreground/70">
                        Sem custo — já faz parte da sua assinatura.
                      </p>
                    </>
                  ) : (
                    <>
                      {canPreview && (
                        <Button
                          onClick={handleOpenPdfViewer}
                          variant="outline"
                          className="mb-1 h-11 w-full rounded-lg border-amber-500/40 bg-amber-500/10 font-semibold text-amber-700 hover:bg-amber-500/15 dark:text-amber-300"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver prévia grátis (págs. {previewLabel})
                        </Button>
                      )}
                      {timedVersions.length > 0 && !isFree && (
                        <TimedAccessOptions
                          versions={timedVersions}
                          value={accessVersionId}
                          onChange={setAccessVersionId}
                          fullPrice={hasActiveTier ? tierFinalPrice : originalPrice}
                          disabled={checkoutLoading}
                          className="mb-3"
                        />
                      )}
                      {hasActiveTier && pricingEventState && !selectedTimedVersion && (
                        <div className="mb-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                            <span className="text-muted-foreground">Valor sem lote</span>
                            <span className="text-muted-foreground line-through">
                              R$ {originalPrice.toFixed(2)}
                            </span>
                          </div>
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <TrendingDown className="h-3 w-3" /> Lote{pricingEventState.activeTier ? ` · ${pricingEventState.activeTier.label || ''}` : ''} (−{Math.round(tierPct)}%)
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              − R$ {tierSavings.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold">Total</span>
                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                              {tierFinalPrice <= 0 ? 'Grátis' : `R$ ${tierFinalPrice.toFixed(2)}`}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-emerald-700/80 dark:text-emerald-300/80 leading-snug">
                            ⚡ Lote ativo: quanto antes comprar, maior o desconto.
                          </p>
                        </div>
                      )}
                      {isFree ? (
                        <Button
                          onClick={() => handleAcquire()}
                          disabled={checkoutLoading}
                          className="h-11 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-green-700 active:scale-[0.98]"
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
                            onClick={() => handleBuyNow()}
                            disabled={checkoutLoading}
                            className="h-11 rounded-lg bg-gradient-to-r from-accent to-secondary font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:from-accent/90 hover:to-secondary/90 active:scale-[0.98]"
                          >
                            Comprar agora
                          </Button>
                          <Button
                            onClick={() => handleAcquire()}
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
                      {!isFree && <ProuniCta itemType="material" itemId={id} className="mt-1" />}
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
              {material.description && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-4 border border-border bg-card rounded-lg rounded-lg px-5 py-4 border border-border/40"
                >
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Sobre este material
                  </h3>
                  <p className={`text-sm leading-relaxed text-foreground/85 ${descExpanded ? '' : 'line-clamp-4'}`}>
                    {material.description}
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

              {/* Você também leva … (materiais complementares) */}
              {complementaryItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="mt-4 border border-border bg-card rounded-lg rounded-lg px-5 py-4 border border-border/40"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Gift className="h-4 w-4" />
                    </span>
                    <h3 className="font-heading text-base font-bold text-foreground">
                      Você também leva…
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {complementaryItems.map((item) => (
                      <ComplementaryCard key={item.id} item={item} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Reviews section (full) */}
              <ReviewsSection
                id="reviews-section"
                targetType="material"
                targetId={id}
                onSummaryChange={setReviewSummary}
                purchaseCtaLabel={isFree ? 'Adquirir gratuitamente' : 'Comprar para avaliar'}
                onPurchaseClick={() => handleAcquire()}
              />
            </motion.div>

            {/* RIGHT: Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              className="xl:w-[300px] flex-shrink-0 space-y-3"
            >
              {/* ── CTA Card ── */}
              <div className="hidden xl:block rounded-3xl overflow-hidden border border-border/40 border border-border bg-card rounded-lg">

                {/* Card header with cover thumb */}
                {material.coverImage && !isEmbed && (
                  <div className="relative h-32 overflow-hidden">
                    <Image
                      src={material.coverImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    {/* Access state badge */}
                    <div className="absolute top-3 right-3">
                      {hasAccess ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl backdrop-blur-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                          <Check className="h-3 w-3" /> Disponível
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl backdrop-blur-md bg-black/40 border border-white/15 text-white/80 text-[11px] font-bold">
                          <Lock className="h-3 w-3" />
                          {isFree ? 'Gratuito' : `R$ ${tierFinalPrice.toFixed(2)}`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4">
                  {/* Type + price pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-medium border border-primary/15">
                      {TYPE_ICONS[material.type]}
                      {TYPE_LABELS[material.type]}
                    </span>
                    {isFree ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/15">
                        <Gift className="h-3 w-3" /> Gratuito
                      </span>
                    ) : hasActiveTier ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                        <span className="line-through opacity-60">R$ {originalPrice.toFixed(2)}</span>
                        <span>R$ {tierFinalPrice.toFixed(2)}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-accent/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/15">
                        R$ {material.price?.toFixed(2)}
                      </span>
                    )}
                    {hasActiveTier && <PricingEventBadge state={pricingEventState} size="xs" />}
                  </div>

                  <h1 className="font-heading font-bold text-base leading-snug mb-3">
                    {material.title}
                  </h1>

                  {/* Reviews summary (compact) — link para a seção completa abaixo */}
                  {(reviewSummary?.count ?? 0) > 0 && (
                    <div className="mb-3">
                      <ReviewSummaryBlock
                        summary={reviewSummary}
                        variant="compact"
                        onJumpToList={() =>
                          document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      />
                    </div>
                  )}

                  {/* Video duration */}
                  {isVideo && material.videoDuration && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-muted/40 border border-border/30">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{formatDuration(material.videoDuration)}</span>
                    </div>
                  )}

                  {/* PDF page count */}
                  {material.type === 'pdf' && material._hasPdf && material._pageCount ? (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-muted/40 border border-border/30">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">
                        {material._pageCount} {material._pageCount === 1 ? 'página' : 'páginas'}
                      </span>
                    </div>
                  ) : null}

                  {/* Flashcard deck card count */}
                  {material.type === 'flashcard_deck' ? (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-muted/40 border border-border/30">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">
                        {material._cardCount ?? 0} {material._cardCount === 1 ? 'card' : 'cards'}
                      </span>
                    </div>
                  ) : null}

                  {/* Tags */}
                  {material.tags?.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {material.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Formas de acesso — vitalício ou versão por tempo */}
                  {!hasAccess && !isFree && timedVersions.length > 0 && (
                    <TimedAccessOptions
                      versions={timedVersions}
                      value={accessVersionId}
                      onChange={setAccessVersionId}
                      fullPrice={hasActiveTier ? tierFinalPrice : originalPrice}
                      disabled={checkoutLoading}
                      className="mb-3"
                    />
                  )}

                  {/* Lote dinâmico por evento — desktop sidebar breakdown */}
                  {hasActiveTier && !hasAccess && !selectedTimedVersion && pricingEventState && (
                    <div className="mb-3 rounded-lg border border-border/40 overflow-hidden">
                      <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Seu preço com desconto
                        </p>
                      </div>
                      <div className="px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Valor sem lote</span>
                          <span className="text-muted-foreground line-through">
                            R$ {originalPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" /> Lote ativo (−{Math.round(tierPct)}%)
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            − R$ {tierSavings.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-semibold">Total</span>
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                            {tierFinalPrice <= 0 ? 'Grátis' : `R$ ${tierFinalPrice.toFixed(2)}`}
                          </span>
                        </div>
                        {pricingEventState.activeTier && (
                          <p className="text-[10px] text-emerald-700/85 dark:text-emerald-300/85 leading-snug pt-1 border-t border-border/30 mt-1">
                            ⚡ Lote {pricingEventState.activeTier.label}. Quanto antes comprar, maior o desconto.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── CTA area ── */}
                  <div className="mt-1 space-y-2">
                    {hasAccess ? (
                      isEmbed ? (
                        <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-primary/6 border border-primary/15">
                          <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            O vídeo está disponível acima ↑
                          </p>
                        </div>
                      ) : (
                        <>
                          {canViewPdf && (
                            <Button
                              onClick={handleOpenPdfViewer}
                              className="relative w-full h-12 overflow-hidden rounded-lg font-bold text-white border border-emerald-200/30 bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-500 hover:from-emerald-600 hover:via-emerald-500 hover:to-amber-400 shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98]"
                            >
                              <span className="absolute inset-0 bg-white/15 backdrop-blur-sm opacity-40" />
                              <span className="relative flex items-center">
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar PDF
                              </span>
                            </Button>
                          )}
                          {canDownload && (
                            <Button
                              onClick={handleDownload}
                              disabled={downloadState.status === 'running'}
                              className="w-full h-11 rounded-lg font-semibold text-white bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                            >
                              {downloadState.status === 'running' ? (
                                <>
                                  <span className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Processando…
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  {downloadLabel}
                                </>
                              )}
                            </Button>
                          )}
                          {isPdf && (canViewPdf || canDownload) && (
                            <p className="text-center text-[10px] text-muted-foreground/70 leading-relaxed">
                              PDF protegido com marca d&apos;água exclusiva para sua conta
                            </p>
                          )}
                          {isPdf && !canViewPdf && !canDownload && (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                              O viewer e o download deste PDF estao indisponiveis no momento.
                            </div>
                          )}
                          {canViewHtml && (
                            <Button
                              onClick={handleOpenHtmlViewer}
                              className="relative w-full h-12 overflow-hidden rounded-lg font-bold text-white border border-emerald-200/30 bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-500 hover:from-emerald-600 hover:via-emerald-500 hover:to-amber-400 shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98]"
                            >
                              <span className="absolute inset-0 bg-white/15 backdrop-blur-sm opacity-40" />
                              <span className="relative flex items-center">
                                <MonitorPlay className="h-4 w-4 mr-2" />
                                Abrir Leitor HTML
                              </span>
                            </Button>
                          )}
                          {isHtml && canViewHtml && (
                            <p className="text-center text-[10px] text-muted-foreground/70 leading-relaxed">
                              Experiência protegida com marca d&apos;água exclusiva para sua conta
                            </p>
                          )}
                          {isHtml && !canViewHtml && (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                              O leitor desta experiência está indisponível no momento.
                            </div>
                          )}
                        </>
                      )
                    ) : includedInPlus ? (
                      <>
                        <span className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                          <Crown className="h-4 w-4" /> Incluído no {PLUS_LABEL}
                        </span>
                        <Button
                          onClick={handleClaimWithPlus}
                          disabled={checkoutLoading}
                          className="h-11 w-full rounded-lg bg-gradient-to-r from-primary to-primary/80 font-semibold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                        >
                          {checkoutLoading
                            ? <span className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <Gift className="h-4 w-4 mr-2" />}
                          Resgatar material
                        </Button>
                        <p className="text-center text-[10px] text-muted-foreground/70">
                          Sem custo — já faz parte da sua assinatura.
                        </p>
                      </>
                    ) : (
                      <>
                        {canPreview && (
                          <Button
                            onClick={handleOpenPdfViewer}
                            variant="outline"
                            className="mb-1 h-11 w-full rounded-lg border-amber-500/40 bg-amber-500/10 font-semibold text-amber-700 hover:bg-amber-500/15 dark:text-amber-300"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver prévia grátis (págs. {previewLabel})
                          </Button>
                        )}
                        {isFree ? (
                          <Button
                            onClick={() => handleAcquire()}
                            disabled={checkoutLoading}
                            className="h-11 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-green-700 active:scale-[0.98]"
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
                              onClick={() => handleAcquire()}
                              disabled={checkoutLoading}
                              className="h-11 rounded-lg border border-emerald-500/25 bg-emerald-500/10 font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-500/15 active:scale-[0.98] dark:text-emerald-300"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Adicionar ao carrinho
                            </Button>
                            <Button
                              onClick={() => handleBuyNow()}
                              disabled={checkoutLoading}
                              className="h-11 rounded-lg bg-gradient-to-r from-accent to-secondary font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:from-accent/90 hover:to-secondary/90 active:scale-[0.98]"
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
                        {!isFree && <ProuniCta itemType="material" itemId={id} className="mt-1" />}
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
                {material.allowedGroups?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="border border-border bg-card rounded-lg rounded-lg p-4 border border-violet-500/20"
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
                      {material.allowedGroups.map(g => {
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
                    {!hasGroupAccess && (
                      <p className="mt-2.5 text-[11px] text-muted-foreground leading-relaxed">
                        Seu plano atual não inclui este conteúdo. Faça upgrade para desbloquear.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Security/watermark info */}
              {hasAccess && isPdf && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-muted/30 border border-border/30"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Este PDF é gerado com marca d&apos;água exclusiva vinculada à sua conta.
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
              <p className="truncate text-xs font-semibold text-foreground">{material.title}</p>
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                {includedInPlus ? (
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                    <Crown className="h-3.5 w-3.5" /> Incluído no {PLUS_LABEL}
                  </span>
                ) : isFree ? 'Gratuito' : selectedTimedVersion ? (
                  <>
                    R$ {purchasePrice.toFixed(2)}
                    <span className="ml-1.5 text-[10px] font-bold text-sky-500">
                      {selectedTimedVersion.durationLabel}
                    </span>
                  </>
                ) : hasActiveTier ? (
                  <>
                    <span className="mr-1.5 text-[10px] font-medium text-muted-foreground line-through">
                      R$ {originalPrice.toFixed(2)}
                    </span>
                    R$ {tierFinalPrice.toFixed(2)}
                    <span className="ml-1.5 text-[10px] font-bold text-emerald-500">−{Math.round(tierPct)}%</span>
                  </>
                ) : `R$ ${material.price?.toFixed(2)}`}
              </p>
            </div>
            <Button
              onClick={
                includedInPlus
                  ? handleClaimWithPlus
                  : isFree
                    ? () => handleAcquire()
                    : () => handleBuyNow()
              }
              disabled={checkoutLoading}
              className="h-11 min-w-[9rem] rounded-lg bg-gradient-to-r from-accent to-secondary px-4 font-bold text-white shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
            >
              {checkoutLoading ? (
                <span className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : includedInPlus || isFree ? (
                <Gift className="h-4 w-4 mr-2" />
              ) : null}
              {includedInPlus ? 'Resgatar' : isFree ? 'Adquirir' : 'Comprar agora'}
            </Button>
          </div>
        </div>
      )}

      {/* PDF Download Progress modal */}
      <PdfDownloadTermsModal
        open={downloadTermsOpen}
        materialTitle={material?.title ?? ''}
        loading={downloadState.status === 'running'}
        onClose={() => setDownloadTermsOpen(false)}
        onAccept={() => {
          setDownloadTermsOpen(false)
          startPdfDownload()
        }}
      />

      <PdfDownloadProgress
        materialTitle={material?.title ?? ''}
        state={downloadState}
        onRetry={startPdfDownload}
        onClose={() => setDownloadState(INITIAL_DOWNLOAD_STATE)}
        onOpenViewer={
          canViewPdf
            ? () => {
                setDownloadState(INITIAL_DOWNLOAD_STATE)
                handleOpenPdfViewer()
              }
            : undefined
        }
      />

      {upsellPkg && data && (
        <PackageUpsellModal
          pkg={upsellPkg}
          item={{ id, title: data.material.title, price: data.material.price, type: data.material.type }}
          onBuyPackage={() => {
            const pkg = upsellPkg
            setUpsellPkg(null)
            const effectivePrice = Number(pkg._pricing?.effectivePrice ?? pkg.price ?? 0)
            const isFreePackage = pkg.pricing === 'free' || effectivePrice <= 0
            if (!isFreePackage) {
              const checkoutPath = `/materiais/checkout?type=package&id=${pkg._id}`
              if (!data.isAuthenticated) {
                router.push(`/comprar?productType=package&productId=${pkg._id}&itemType=package`)
                return
              }
              router.push(checkoutPath)
              return
            }
            if (!data.isAuthenticated) {
              router.push(`/auth/login?redirect=${encodeURIComponent(`/materiais/checkout?type=package&id=${pkg._id}`)}`)
              return
            }
            fetch('/api/materiais/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemType: 'package', itemId: pkg._id, paymentMethodId: 'free' }),
            }).then(() => fetchData()).catch(() => {})
          }}
          onBuyIndividual={() => {
            setUpsellPkg(null)
            handleBuyNow(true)
          }}
          onClose={() => setUpsellPkg(null)}
        />
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
          <div className="flex-1">
            <div className="rounded-3xl bg-muted animate-pulse" style={{ aspectRatio: '16/9' }} />
            <div className="mt-4 rounded-lg bg-muted animate-pulse h-28" />
          </div>
          <div className="xl:w-[300px] space-y-3">
            <div className="rounded-3xl border border-border bg-card rounded-lg p-4 space-y-3">
              <div className="h-28 w-full rounded-xl bg-muted animate-pulse" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-5 w-full bg-muted rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-11 w-full bg-muted rounded-lg animate-pulse mt-2" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ─── Error ────────────────────────────────────────────────────
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <AppShell allowGuest headerTitle="Erro">
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="h-20 w-20 rounded-3xl border border-border bg-card rounded-lg flex items-center justify-center mb-2">
          <Package className="h-9 w-9 text-muted-foreground" />
        </div>
        <h2 className="font-heading font-bold text-xl">Material não encontrado</h2>
        <p className="text-muted-foreground text-sm text-center max-w-xs">
          {message || 'Este material não existe ou foi removido.'}
        </p>
        <Button onClick={onBack} className="mt-2 rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar aos Materiais
        </Button>
      </div>
    </AppShell>
  )
}
