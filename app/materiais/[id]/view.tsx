'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Play,
  Download,
  Lock,
  Clock,
  Eye,
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
  Package,
  ShieldAlert,
  Check,
  ChevronLeft,
  Infinity as InfinityIcon,
  Share,
  Star,
  Layers,
  Code2,
  MonitorPlay,
  Headphones,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppShell } from '@/components/app-shell'
import { FundoIos } from '@/components/materiais/fundo-ios'
import { BagPlusIcon, CartButton } from '@/components/materiais/shared'
import { abrirCarrinho } from '@/lib/abrir-carrinho'
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

/** Linha de "Você também leva": capa, o que é, e a ação do item. */
function ComplementaryRow({ item }: { item: ComplementaryItem }) {
  const isMaterial = item.kind === 'material'
  const tmplMeta = !isMaterial ? (COMPLEMENTARY_TEMPLATE_META[item.template || 'experiencia'] || COMPLEMENTARY_TEMPLATE_META.experiencia) : null
  const icon = isMaterial ? (TYPE_ICONS[item.materialType || 'other'] || <File className="h-4 w-4" />) : tmplMeta!.icon
  const badgeLabel = isMaterial ? (TYPE_LABELS[item.materialType || 'other'] || 'Material') : tmplMeta!.label
  const ctaLabel = item.buttonLabel || (isMaterial ? 'Acessar' : tmplMeta!.cta)
  const href = item.href || ''
  const isInternal = href.startsWith('/')

  const inner = (
    <>
      <span className="ios-capa relative h-14 w-14 shrink-0 rounded-[14px]">
        {item.coverImage ? (
          <Image src={item.coverImage} alt="" fill className="object-cover" sizes="56px" />
        ) : (
          <span className="ios-capa-vazia ios-tinta flex h-full w-full items-center justify-center">{icon}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">{item.title}</span>
        <span className="ios-rotulo-2 mt-0.5 line-clamp-2 block text-[13px] leading-snug">
          {item.description || badgeLabel}
        </span>
      </span>
      {href ? (
        <span className="ios-botao-suave ios-botao-p shrink-0">{ctaLabel}</span>
      ) : null}
    </>
  )

  const rowClass = 'ios-linha py-3'

  if (!href) {
    return <div className={rowClass}>{inner}</div>
  }
  if (isInternal) {
    return <Link href={href} className={rowClass}>{inner}</Link>
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={rowClass}>
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
  const { addItem, isInCart } = useMaterialCart()

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
  }, [loading, data?.material?._id, data?.hasAccess, data?.includedInPlus])

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
  const heroSizes = '(max-width: 1280px) 100vw, 60vw'
  const reviewCount = reviewSummary?.count ?? 0
  const displayPrice = selectedTimedVersion ? purchasePrice : tierFinalPrice
  const jumpToReviews = () =>
    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Linha de baixo do título: o que é, quanto tem, de onde vem.
  const sizeLabel = isVideo && material.videoDuration
    ? formatDuration(material.videoDuration)
    : material.type === 'pdf' && material._hasPdf && material._pageCount
      ? `${material._pageCount} ${material._pageCount === 1 ? 'página' : 'páginas'}`
      : material.type === 'flashcard_deck'
        ? `${material._cardCount ?? 0} ${material._cardCount === 1 ? 'card' : 'cards'}`
        : null
  const subtitleParts = [TYPE_LABELS[material.type] || 'Material', sizeLabel, folderName].filter(Boolean)

  // Faixa de informações (App Store): só as células que têm dado de verdade.
  const infoCells: { key: string; label: string; value: React.ReactNode; note: React.ReactNode }[] = []
  if (reviewCount > 0 && reviewSummary) {
    infoCells.push({
      key: 'reviews',
      label: `${reviewCount} ${reviewCount === 1 ? 'avaliação' : 'avaliações'}`,
      value: reviewSummary.avg.toFixed(1).replace('.', ','),
      note: <StarRow value={reviewSummary.avg} />,
    })
  }
  infoCells.push({
    key: 'format',
    label: 'Formato',
    value: <span className="flex h-[25px] items-center [&_svg]:h-[22px] [&_svg]:w-[22px]">{TYPE_ICONS[material.type] || <File />}</span>,
    note: TYPE_LABELS[material.type] || 'Arquivo',
  })
  if (isVideo && material.videoDuration) {
    infoCells.push({ key: 'dur', label: 'Duração', value: formatDuration(material.videoDuration), note: 'de vídeo' })
  } else if (material.type === 'pdf' && material._hasPdf && material._pageCount) {
    infoCells.push({ key: 'pages', label: 'Tamanho', value: material._pageCount, note: material._pageCount === 1 ? 'página' : 'páginas' })
  } else if (material.type === 'flashcard_deck') {
    infoCells.push({ key: 'cards', label: 'Deck', value: material._cardCount ?? 0, note: material._cardCount === 1 ? 'card' : 'cards' })
  }
  infoCells.push({
    key: 'access',
    label: 'Acesso',
    value: hasAccess
      ? <Check className="h-[22px] w-[22px]" strokeWidth={2.5} />
      : isFree ? 'Grátis' : <InfinityIcon className="h-[25px] w-[25px]" />,
    note: hasAccess
      ? (timedAccess?.isTimed ? 'por tempo' : 'liberado')
      : isFree ? 'para sempre' : timedVersions.length > 0 ? 'vitalício ou por tempo' : 'vitalício',
  })
  if (isPdf && (hasAccess || canPreview)) {
    infoCells.push({ key: 'wm', label: 'Proteção', value: <Shield className="h-[22px] w-[22px]" />, note: 'marca d’água' })
  }
  if (showMaterialViews) {
    infoCells.push({ key: 'views', label: 'Visualizações', value: compactNumber(material.viewCount), note: 'no total' })
  }
  if (showMaterialDownloads) {
    infoCells.push({ key: 'dl', label: 'Downloads', value: compactNumber(material.downloadCount), note: 'no total' })
  }
  infoCells.push({
    key: 'date',
    label: 'Publicado',
    value: new Date(material.createdAt).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    note: new Date(material.createdAt).getFullYear(),
  })

  const spinner = <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

  // Corpo do painel: um só, para o celular (no fluxo) e o desktop (ao lado).
  const purchaseBody = hasAccess ? (
    isEmbed ? (
      <p className="ios-tinta flex items-center gap-2 text-[15px] font-semibold">
        <Check className="h-4 w-4" strokeWidth={2.75} /> Na sua biblioteca — o vídeo está liberado acima.
      </p>
    ) : (
      <div className="space-y-2.5">
        <p className="ios-tinta flex items-center gap-1.5 text-[15px] font-semibold">
          <Check className="h-4 w-4" strokeWidth={2.75} /> Na sua biblioteca
        </p>
        {canViewPdf && (
          <button type="button" onClick={handleOpenPdfViewer} className="ios-botao ios-botao-g w-full">
            <BookOpen className="h-[18px] w-[18px]" /> Ler agora
          </button>
        )}
        {canDownload && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloadState.status === 'running'}
            className={cn(canViewPdf ? 'ios-botao-cinza' : 'ios-botao', 'ios-botao-g w-full')}
          >
            {downloadState.status === 'running'
              ? <>{spinner} Preparando…</>
              : <><Download className="h-[18px] w-[18px]" /> {downloadLabel}</>}
          </button>
        )}
        {canViewHtml && (
          <button type="button" onClick={handleOpenHtmlViewer} className="ios-botao ios-botao-g w-full">
            <MonitorPlay className="h-[18px] w-[18px]" /> Abrir experiência
          </button>
        )}
        {isPdf && !canViewPdf && !canDownload && (
          <p className="ios-ambar flex items-start gap-2 rounded-[14px] bg-[var(--ios-ambar-suave)] px-3.5 py-3 text-[13px] font-medium">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            O leitor e o download deste PDF estão indisponíveis no momento.
          </p>
        )}
        {isHtml && !canViewHtml && (
          <p className="ios-ambar flex items-start gap-2 rounded-[14px] bg-[var(--ios-ambar-suave)] px-3.5 py-3 text-[13px] font-medium">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            O leitor desta experiência está indisponível no momento.
          </p>
        )}
        {((isPdf && (canViewPdf || canDownload)) || (isHtml && canViewHtml)) && (
          <p className="ios-rotulo-3 flex items-center justify-center gap-1.5 pt-0.5 text-center text-[12px]">
            <Shield className="h-3 w-3" /> Com marca d&apos;água exclusiva da sua conta
          </p>
        )}
      </div>
    )
  ) : includedInPlus ? (
    <div className="space-y-2.5">
      <p className="ios-ambar flex items-center gap-1.5 text-[15px] font-semibold">
        <Crown className="h-4 w-4" /> Incluído no {PLUS_LABEL}
      </p>
      <div ref={ctaRef}>
        <button type="button" onClick={handleClaimWithPlus} disabled={checkoutLoading} className="ios-botao-ambar ios-botao-g w-full">
          {checkoutLoading ? spinner : <Gift className="h-[18px] w-[18px]" />}
          Resgatar material
        </button>
      </div>
      <p className="ios-rotulo-3 text-center text-[12px]">Sem custo — já faz parte da sua assinatura.</p>
    </div>
  ) : (
    <div className="space-y-3">
      {/* Preço */}
      <div>
        {isFree ? (
          <p className="ios-preco ios-tinta">Grátis</p>
        ) : (
          <>
            {hasActiveTier && !selectedTimedVersion && (
              <p className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                <span className="ios-rotulo-3 tabular-nums line-through">{fmtBRL(originalPrice)}</span>
                <span className="ios-tinta font-semibold">−{Math.round(tierPct)}% no lote{pricingEventState?.activeTier?.label ? ` ${pricingEventState.activeTier.label}` : ''}</span>
                <PricingEventBadge state={pricingEventState} size="xs" />
              </p>
            )}
            <p className="ios-preco">{displayPrice <= 0 ? 'Grátis' : fmtBRL(displayPrice)}</p>
            <p className="ios-rotulo-2 mt-1 text-[13px]">
              {selectedTimedVersion
                ? `Pagamento único · acesso por ${selectedTimedVersion.durationLabel}, sem download`
                : hasActiveTier && tierSavings > 0
                  ? `Você economiza ${fmtBRL(tierSavings)} · pagamento único, acesso vitalício`
                  : 'Pagamento único · acesso vitalício'}
            </p>
          </>
        )}
      </div>

      {/* Formas de acesso — vitalício ou versão por tempo */}
      {timedVersions.length > 0 && !isFree && (
        <TimedAccessOptions
          versions={timedVersions}
          value={accessVersionId}
          onChange={setAccessVersionId}
          fullPrice={hasActiveTier ? tierFinalPrice : originalPrice}
          disabled={checkoutLoading}
        />
      )}

      <div ref={ctaRef} className="space-y-2 pt-1">
        {isFree ? (
          <button type="button" onClick={() => handleAcquire()} disabled={checkoutLoading} className="ios-botao ios-botao-g w-full">
            {checkoutLoading ? spinner : <Gift className="h-[18px] w-[18px]" />}
            Obter grátis
          </button>
        ) : (
          <>
            <button type="button" onClick={() => handleBuyNow()} disabled={checkoutLoading} className="ios-botao ios-botao-g w-full">
              {checkoutLoading ? spinner : null}
              Comprar agora
            </button>
            {isInCart('material', id) ? (
              <button type="button" onClick={abrirCarrinho} className="ios-botao-suave ios-botao-g w-full">
                <Check className="ios-pop h-[18px] w-[18px]" strokeWidth={3} /> No carrinho · ver carrinho
              </button>
            ) : (
              <button type="button" onClick={() => handleAcquire()} disabled={checkoutLoading} className="ios-botao-suave ios-botao-g w-full">
                <BagPlusIcon /> Adicionar ao carrinho
              </button>
            )}
          </>
        )}
        {canPreview && (
          <button type="button" onClick={handleOpenPdfViewer} className="ios-botao-suave ios-botao-g w-full">
            <Eye className="h-[18px] w-[18px]" /> Ler a prévia grátis · págs. {previewLabel}
          </button>
        )}
      </div>

      {isInCart('material', id) && (
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
      {!isFree && <ProuniCta itemType="material" itemId={id} />}
    </div>
  )

  return (
    <AppShell allowGuest vidro headerTitle={material.title} headerSubtitle={TYPE_LABELS[material.type] || 'Material'}>
      <FundoIos
        capa={material.coverImage || null}
        capaSizes={heroSizes}
        className={showMobilePurchaseBar ? 'pb-32 xl:pb-16' : 'pb-16'}
      >
        <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-5 lg:px-8">
          <Link
            href={folderName && material.folderId ? `/materiais?folder=${material.folderId}` : '/materiais'}
            className="ios-voltar -ml-2.5 mb-3"
          >
            <ChevronLeft className="h-[22px] w-[22px] shrink-0" strokeWidth={2.5} />
            <span className="truncate">{folderName || 'Materiais'}</span>
          </Link>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
            {/* ── Mídia ── */}
            <div className="min-w-0 xl:col-start-1 xl:row-start-1">
              <div className="ios-assenta overflow-hidden rounded-[22px] shadow-[var(--ios-sombra-alta)] sm:rounded-[28px]">
                {isEmbed && hasAccess ? (
                  <VideoWatermark userName={data.watermark.name} userCpf={data.watermark.cpf}>
                    {material.downloadUrl.trim().startsWith('<') ? (
                      <div dangerouslySetInnerHTML={{ __html: material.downloadUrl }} className="h-full w-full" />
                    ) : (
                      <iframe
                        src={material.downloadUrl}
                        title={material.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    )}
                  </VideoWatermark>
                ) : isEmbed && !hasAccess ? (
                  <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
                    {material.coverImage && (
                      <Image
                        src={material.coverImage}
                        alt=""
                        fill
                        className="scale-105 object-cover opacity-35 blur-md"
                        sizes={heroSizes}
                      />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] backdrop-blur-xl">
                        <Lock className="h-7 w-7" />
                      </span>
                      <p className="text-[20px] font-bold tracking-[-0.02em]">Vídeo bloqueado</p>
                      <p className="text-[14px] text-white/70">Adquira este material para assistir</p>
                      {material.videoDuration ? (
                        <span className="ios-selo mt-1 !h-7 !px-3 !text-[12px]">
                          <Clock className="h-3.5 w-3.5" /> {formatDuration(material.videoDuration)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : material.coverImage ? (
                  <div className="ios-capa relative w-full" style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={material.coverImage}
                      alt={material.title}
                      fill
                      className="object-cover"
                      sizes={heroSizes}
                      priority
                    />
                  </div>
                ) : (
                  <div className="ios-capa ios-capa-vazia flex w-full items-center justify-center" style={{ aspectRatio: '16/9' }}>
                    <span className="ios-tinta flex h-24 w-24 items-center justify-center rounded-[26px] bg-white/70 shadow-sm dark:bg-white/10 [&_svg]:h-11 [&_svg]:w-11">
                      {TYPE_ICONS[material.type] || <File />}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Título e compra: um painel só (celular no fluxo, desktop ao lado) ── */}
            <aside className="min-w-0 xl:col-start-2 xl:row-span-2 xl:row-start-1">
              <div className="space-y-4 xl:sticky xl:top-24">
                <div className="ios-painel">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="ios-titulo-produto">{material.title}</h1>
                      <p className="ios-rotulo-2 mt-1 text-[15px]">{subtitleParts.join(' · ')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={copyShareLink}
                      title={copied ? 'Link copiado!' : 'Copiar link'}
                      aria-label={copied ? 'Link copiado' : 'Copiar link do material'}
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

                {material.allowedGroups?.length > 0 && (
                  <section className="ios-lista p-4">
                    <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Acesso por plano</h2>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {material.allowedGroups.map(g => {
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
                    {!hasGroupAccess && (
                      <p className="ios-rotulo-2 mt-2.5 text-[13px] leading-relaxed">
                        Seu plano atual não inclui este conteúdo. Faça upgrade para desbloquear.
                      </p>
                    )}
                  </section>
                )}
              </div>
            </aside>

            {/* ── Conteúdo ── */}
            <div className="min-w-0 space-y-8 xl:col-start-1 xl:row-start-2">
              {hasAccess && timedAccess?.isTimed && (
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
              )}

              {hasActiveTier && pricingEventState && !hasAccess && (
                <PricingEventCountdown state={pricingEventState} />
              )}

              <div className="ios-lista py-3.5">
                <div className="ios-faixa" role="list" aria-label="Informações do material">
                  {infoCells.map(cell => (
                    <div key={cell.key} role="listitem">
                      <span className="ios-faixa-rotulo">{cell.label}</span>
                      <span className="ios-faixa-valor">{cell.value}</span>
                      <span className="ios-faixa-nota">{cell.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Oferta de versão impressa (add-on de produto físico) */}
              <PrintedAddon materialId={material._id} />

              {material.description && (
                <section>
                  <h2 className="ios-titulo-secao mb-2.5">Sobre este material</h2>
                  <p className={cn('max-w-[68ch] whitespace-pre-line text-[16px] leading-relaxed text-[var(--ios-rotulo)]', !descExpanded && 'line-clamp-5')}>
                    {material.description}
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
                  {material.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {material.tags.map(tag => (
                        <span key={tag} className="ios-rotulo-2 rounded-full bg-[var(--ios-preenchimento)] px-3 py-1 text-[13px] font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {complementaryItems.length > 0 && (
                <section>
                  <h2 className="ios-titulo-secao mb-1">Você também leva</h2>
                  <p className="ios-rotulo-2 mb-3 text-[15px]">Vem junto com este material, sem custo a mais.</p>
                  <ul className="ios-lista [--ios-recuo:84px]">
                    {complementaryItems.map((item) => (
                      <li key={item.id}>
                        <ComplementaryRow item={item} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <ReviewsSection
                id="reviews-section"
                targetType="material"
                targetId={id}
                onSummaryChange={setReviewSummary}
                purchaseCtaLabel={isFree ? 'Obter grátis' : 'Comprar para avaliar'}
                onPurchaseClick={() => handleAcquire()}
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
              {material.coverImage ? (
                <Image src={material.coverImage} alt="" fill sizes="44px" className="object-cover" />
              ) : (
                <span className="ios-capa-vazia ios-tinta flex h-full w-full items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
                  {TYPE_ICONS[material.type] || <File />}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold tracking-[-0.01em]">{material.title}</span>
              <span className="block text-[13px] font-semibold tabular-nums">
                {includedInPlus ? (
                  <span className="ios-ambar">Incluído no {PLUS_LABEL}</span>
                ) : isFree ? (
                  <span className="ios-tinta">Grátis</span>
                ) : (
                  <>
                    {hasActiveTier && !selectedTimedVersion && (
                      <span className="ios-rotulo-3 mr-1.5 font-medium line-through">{fmtBRL(originalPrice)}</span>
                    )}
                    {fmtBRL(displayPrice)}
                    {selectedTimedVersion && <span className="ios-rotulo-2 ml-1.5 font-medium">{selectedTimedVersion.durationLabel}</span>}
                  </>
                )}
              </span>
            </span>
            {!includedInPlus && !isFree && (
              <CartButton
                inCart={isInCart('material', id)}
                onAdd={() => handleAcquire()}
                disabled={checkoutLoading}
                itemTitle={material.title}
                className="!h-11"
                tabIndex={ctaVisivel ? -1 : 0}
              />
            )}
            <button
              type="button"
              tabIndex={ctaVisivel ? -1 : 0}
              onClick={includedInPlus ? handleClaimWithPlus : isFree ? () => handleAcquire() : () => handleBuyNow()}
              disabled={checkoutLoading}
              className={includedInPlus ? 'ios-botao-ambar' : 'ios-botao'}
            >
              {checkoutLoading ? spinner : null}
              {includedInPlus ? 'Resgatar' : isFree ? 'Obter' : 'Comprar'}
            </button>
          </div>
        )}
      </FundoIos>

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
    <AppShell allowGuest vidro headerTitle="Carregando...">
      <FundoIos className="pb-16">
        <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-5 lg:px-8" aria-hidden>
          <div className="ios-esqueleto mb-4 h-7 w-28 rounded-full" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
            <div className="ios-esqueleto rounded-[22px] sm:rounded-[28px]" style={{ aspectRatio: '16/9' }} />
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

// ─── Error ────────────────────────────────────────────────────
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <AppShell allowGuest vidro headerTitle="Erro">
      <FundoIos>
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <span className="ios-rotulo-2 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ios-preenchimento)]">
            <Package className="h-7 w-7" />
          </span>
          <h2 className="text-[22px] font-bold tracking-[-0.02em]">Material não encontrado</h2>
          <p className="ios-rotulo-2 mt-1.5 max-w-xs text-[15px]">
            {message || 'Este material não existe ou foi removido.'}
          </p>
          <button type="button" onClick={onBack} className="ios-botao mt-6">
            <ChevronLeft className="-ml-1 h-5 w-5" /> Voltar aos materiais
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

/** 1234 → "1,2 mil". A faixa tem espaço para cinco caracteres. */
function compactNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
}

/** `R$ 29,90` — pt-BR usa vírgula decimal. */
function fmtBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}
