'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { FocusSessionButton } from '@/components/focus-session-button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Search,
  Heart,
  Wind,
  Brain,
  Stethoscope,
  Pill,
  Droplets,
  Bone,
  Shield,
  Activity,
  Layers,
  Baby,
  SmilePlus,
  Smile,
  Bug,
  Target,
  BookOpen,
  Box,
  Calculator,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Sparkles,
  ArrowRight,
  FileDown,
  Highlighter,
  Loader2,
  RotateCcw,
  LogIn,
  Lock,
  Crown,
  Info,
  CalendarClock,
  XCircle,
  CreditCard,
  GraduationCap
} from 'lucide-react'
import { AREAS_SAUDE, SISTEMAS_FISIOLOGICOS, type AreaSaude, type SistemaFisiologico } from '@/lib/types/manual-clinico'
import { clearAllManualHighlights, hasAnyManualHighlights } from '@/lib/manual-clinico-highlights'
import { trackMeta } from '@/lib/meta-pixel'
import { GuidedTour, type TourStep } from '@/components/manual-clinico/guided-tour'
import { PricingEventCountdown } from '@/components/pricing-events/PricingEventCountdown'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import { PLUS_LABEL } from '@/lib/account-tier'

const SISTEMA_ICONS: Record<string, any> = {
  'Sistema Cardiovascular': Heart,
  'Sistema Respiratório': Wind,
  'Sistema Nervoso Central e Periférico': Brain,
  'Sistema Digestivo e Hepatobiliar': Stethoscope,
  'Sistema Endócrino e Metabólico': Pill,
  'Sistema Renal e Urinário': Droplets,
  'Sistema Musculoesquelético': Bone,
  'Sistema Imunológico e Reumatológico': Shield,
  'Sistema Hematológico': Activity,
  'Sistema Dermatológico': Layers,
  'Sistema Reprodutor e Ginecológico': Baby,
  'Saúde Mental e Transtornos Psiquiátricos': SmilePlus,
  'Sistema Estomatognático e Saúde Bucal': Smile,
  'Doenças Infecciosas e Parasitárias': Bug,
  'Oncologia Geral': Target,
}

// Tinte discreto por sistema (só o ícone recebe cor) — cor serve para orientação
// visual, não para pintar o card inteiro. Evita o "arco-íris de gradientes".
const SISTEMA_TINTS: { bg: string; text: string; border: string }[] = [
  { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'group-hover:border-red-500/40' },
  { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'group-hover:border-sky-500/40' },
  { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'group-hover:border-violet-500/40' },
  { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'group-hover:border-amber-500/40' },
  { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'group-hover:border-teal-500/40' },
  { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'group-hover:border-blue-500/40' },
  { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'group-hover:border-orange-500/40' },
  { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'group-hover:border-indigo-500/40' },
  { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'group-hover:border-rose-500/40' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'group-hover:border-emerald-500/40' },
  { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'group-hover:border-pink-500/40' },
  { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'group-hover:border-purple-500/40' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'group-hover:border-cyan-500/40' },
  { bg: 'bg-lime-500/10', text: 'text-lime-600 dark:text-lime-400', border: 'group-hover:border-lime-500/40' },
  { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'group-hover:border-fuchsia-500/40' },
]

const AREA_COLORS: Record<AreaSaude, string> = {
  'Medicina': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
  'Psicologia': 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
  'Odontologia': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  'Biomedicina': 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/20',
}

const PESQUISAS_SUGERIDAS: { label: string; slug: string }[] = [
  { label: 'Epilepsia', slug: 'epilepsia' },
  { label: 'Febre reumática', slug: 'febre-reumatica' },
  { label: 'Cefaleia', slug: 'cefaleia' },
  { label: 'Derrame pleural', slug: 'derrame-pleural' },
  { label: 'Principais valvopatias', slug: 'principais-valvopatias' },
  { label: 'Sons pulmonares anormais', slug: 'sons-pulmonares-anormais' },
]

const AREA_COLORS_ACTIVE: Record<AreaSaude, string> = {
  'Medicina': 'bg-blue-500 text-white border-blue-600 shadow-blue-500/25 shadow-lg',
  'Psicologia': 'bg-purple-500 text-white border-purple-600 shadow-purple-500/25 shadow-lg',
  'Odontologia': 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/25 shadow-lg',
  'Biomedicina': 'bg-orange-500 text-white border-orange-600 shadow-orange-500/25 shadow-lg',
}

interface PatologiaResumo {
  _id: string
  nome: string
  sinonimos: string[]
  areas: AreaSaude[]
  sistema: SistemaFisiologico
  cid10: string
  slug: string
  gravidade: string
  isFree?: boolean
  isFreeClaimed?: boolean
  canClaimFree?: boolean
  isPremiumLocked?: boolean
  accessStatus?: 'free' | 'free_claimed' | 'free_available' | 'login_required' | 'premium_unlocked' | 'locked'
}

interface ManualPlan {
  key: 'semestral' | 'anual' | 'vitalicio'
  label: string
  durationMonths: number | null
  price: number
  enabled: boolean
  pricingEventId: string | null
  defaultCouponCode: string | null
}

interface ManualProduct {
  label: string
  benefitText: string
  shortDescription: string
  ctaText: string
  coverImageUrl?: string
  fullPdfButtonEnabled?: boolean
  fullPdfExternalUrl?: string
  isActive: boolean
  price: number
  currentPrice: number
  promotionalPrice: number | null
  hasActivePromotion: boolean
  plans?: ManualPlan[]
  freeAccessMode?: 'quantity' | 'list'
  freeQuantity?: number
  pricingEventId?: string | null
}

interface ManualSubscriptionInfo {
  planKey: 'semestral' | 'anual' | 'vitalicio' | null
  planLabel: string | null
  isLifetime: boolean
  isActive: boolean
  isExpired: boolean
  renewalDeclined: boolean
  price: number
  purchasedAt: string | null
  expiresAt: string | null
  daysRemaining: number | null
  paymentMethod: string | null
  provider: string | null
}

interface ManualAccess {
  hasFullAccess: boolean
  reason: string
  includedPlan?: string | null
  freeQuota?: {
    mode: 'quantity' | 'list'
    limit: number
    used: number
    remaining: number
    isAuthenticated: boolean
  }
  subscription?: ManualSubscriptionInfo | null
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

function formatDateBR(value?: string | null) {
  if (!value) return 'N/D'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'N/D'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatRemainingHuman(days: number | null, isLifetime: boolean) {
  if (isLifetime) return 'Para sempre'
  if (days == null) return 'N/D'
  if (days <= 0) return 'Expirado'
  if (days < 30) return `${days} ${days === 1 ? 'dia' : 'dias'}`
  const months = Math.floor(days / 30)
  const extra = days % 30
  return extra > 0 ? `${months} ${months === 1 ? 'mês' : 'meses'} e ${extra}d` : `${months} ${months === 1 ? 'mês' : 'meses'}`
}

function SubscriptionInfoBanner({ subscription }: { subscription: ManualSubscriptionInfo | null }) {
  const [showInfo, setShowInfo] = useState(false)
  if (!subscription) return null

  return (
    <div className="mt-5 mx-auto max-w-2xl rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Crown className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-black">
              Manual Clínico {subscription.planLabel || 'ativo'} {subscription.isLifetime ? '(vitalício)' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {subscription.isLifetime
                ? 'Acesso para sempre, nunca expira.'
                : subscription.isExpired
                  ? `Expirou em ${formatDateBR(subscription.expiresAt)}`
                  : `${formatRemainingHuman(subscription.daysRemaining, false)} restantes, expira em ${formatDateBR(subscription.expiresAt)}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
          aria-label="Informações da assinatura"
          title="Informações"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {showInfo && (
        <div className="mt-3 rounded-xl bg-black/15 p-3 text-xs space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Plano:</span><strong>{subscription.planLabel || 'N/D'}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Assinado em:</span><strong>{formatDateBR(subscription.purchasedAt)}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Expira em:</span><strong>{subscription.isLifetime ? 'Nunca' : formatDateBR(subscription.expiresAt)}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tempo restante:</span><strong>{formatRemainingHuman(subscription.daysRemaining, subscription.isLifetime)}</strong></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Valor pago:</span><strong>{formatBRL(subscription.price)}</strong></div>
          {subscription.paymentMethod && (
            <div className="flex justify-between"><span className="text-muted-foreground">Pagamento:</span><strong>{subscription.paymentMethod}</strong></div>
          )}
        </div>
      )}
    </div>
  )
}

function RenewalBanner({
  subscription,
  onRenew,
  onDecline,
  declining,
  declineConfirm,
}: {
  subscription: ManualSubscriptionInfo
  onRenew: () => void
  onDecline: () => void
  declining: boolean
  declineConfirm: boolean
}) {
  const isCard = subscription.paymentMethod === 'credit_card' || subscription.paymentMethod === 'card'
  return (
    <div className="mt-4 mx-auto max-w-2xl rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <CalendarClock className="h-5 w-5 text-amber-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-black">
            {subscription.isExpired
              ? 'Seu Manual Clínico expirou'
              : `Seu Manual Clínico expira em ${formatRemainingHuman(subscription.daysRemaining, false)}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isCard
              ? 'No vencimento, enviaremos um e-mail com link de 1 clique para renovar com seu cartão.'
              : 'Renove agora para não perder o acesso Plus+.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onRenew}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-300 px-3 text-xs font-black text-amber-950 hover:bg-amber-200 transition"
            >
              <CreditCard className="h-3.5 w-3.5" /> Renovar agora
            </button>
            {!isCard && (
              <button
                onClick={onDecline}
                disabled={declining}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition disabled:opacity-60 ${
                  declineConfirm
                    ? 'border-red-400/40 bg-red-500/15 text-red-300'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {declining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                {declineConfirm ? 'Confirmar e remover acesso' : 'Não quero mais, obrigado'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Passos do tour guiado. Passos com `target` só entram se o elemento existir na
// tela no momento em que o tour abre (ver startTour), então nada quebra quando
// uma seção está oculta (ex.: botão de PDF desativado). Versão no localStorage
// controla o disparo automático — subir o número reexibe para todos.
const TOUR_STORAGE_KEY = 'manual-clinico-tour-v1'
const TOUR_STEPS: TourStep[] = [
  {
    title: 'Bem-vindo ao Manual Clínico',
    body: 'Em 1 minuto te mostro tudo: como buscar, filtrar, abrir patologias e usar os módulos extras. Pode pular quando quiser.',
  },
  {
    target: '[data-tour="search"]',
    title: 'Busca inteligente',
    body: 'Pesquise por nome da doença, sinônimo popular ou código CID-10. Os resultados aparecem enquanto você digita.',
  },
  {
    target: '[data-tour="filtros"]',
    title: 'Filtros por área',
    body: 'Refine por área da saúde (Cardiologia, Pneumologia, etc.). Pode combinar vários filtros ao mesmo tempo.',
  },
  {
    target: '[data-tour="sistemas"]',
    title: 'Índice por sistema',
    body: 'Prefere navegar por sistema fisiológico? Toque em um sistema para ver todas as patologias relacionadas.',
  },
  {
    target: '[data-tour="patologia"]',
    title: 'Abra uma patologia',
    body: 'Cada card leva à ficha completa: fisiopatologia, diagnósticos diferenciais, conduta e farmacologia. As etiquetas mostram o que está grátis, liberado ou premium.',
  },
  {
    target: '[data-tour="access"]',
    title: 'Seu acesso',
    body: 'Aqui você acompanha suas aberturas gratuitas ou desbloqueia o Manual inteiro — pagamento único, acesso imediato.',
  },
  {
    target: '[data-tour="farmacologia"]',
    title: 'Farmacologia por classes',
    body: 'Fármacos organizados por classe: mecanismo, metabolismo, efeitos, posologia e uma calculadora de dose.',
  },
  {
    target: '[data-tour="anatomia"]',
    title: 'Anatomia 3D',
    body: 'Atlas 3D interativo: modelos rotacionáveis em 360° com explicação anatômica aprofundada.',
  },
  {
    target: '[data-tour="tomografia"]',
    title: 'Manual de Tomografia',
    body: 'Atlas de TC interativo: role o scroll e percorra os cortes como no aparelho, troque a janela e estude cada estrutura em profundidade — tórax, abdome e crânio.',
  },
  {
    target: '[data-tour="ecg"]',
    title: 'Manual do Eletrocardiograma',
    body: 'Simulador de ECG com 12 derivações, papel milimetrado real, medidas automáticas e banco de traçados. Exclusivo de assinantes.',
  },
  {
    target: '[data-tour="pdf"]',
    title: 'Leve no PDF',
    body: 'Assinantes podem baixar o Manual completo em PDF para estudar offline, com marca d’água personalizada.',
  },
  {
    target: '[data-tour="tutorial-btn"]',
    title: 'Pronto! Bom estudo 🎓',
    body: 'Sempre que quiser rever este passo a passo, é só clicar em Tutorial aqui. Bons estudos!',
  },
]

export default function ManualClinicoPage() {
  return (
    <AppShell allowGuest showHeader={false}>
      <ManualClinicoContent />
    </AppShell>
  )
}

function FloatingFocusGlass({ enabled }: { enabled: boolean }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || !enabled) return null
  return createPortal(
    <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[55]">
      <div className="relative liquid-glass-bubble overflow-visible rounded-full">
        <div className="liquid-glass-surface !rounded-full" />
        <div className="liquid-glass-refraction-top !left-[10%] !right-[10%] !rounded-full" />
        <div className="liquid-glass-refraction-bottom !left-[14%] !right-[14%] !rounded-full" />
        <div className="relative z-10">
          <FocusSessionButton />
        </div>
      </div>
    </div>,
    document.body
  )
}

function ManualClinicoContent() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [areasAtivas, setAreasAtivas] = useState<AreaSaude[]>([])
  const [sistemaAtivo, setSistemaAtivo] = useState<SistemaFisiologico | ''>('')
  const [patologias, setPatologias] = useState<PatologiaResumo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [hasHighlights, setHasHighlights] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [product, setProduct] = useState<ManualProduct | null>(null)
  const [manualAccess, setManualAccess] = useState<ManualAccess>({ hasFullAccess: false, reason: 'guest' })
  const [accessLoaded, setAccessLoaded] = useState(false)
  const [renewalDeclining, setRenewalDeclining] = useState(false)
  const [renewalDeclineConfirm, setRenewalDeclineConfirm] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourSteps, setTourSteps] = useState<TourStep[]>([])
  const tourAutoChecked = useRef(false)
  const { user, loading: appShellLoading } = useAppShell()
  const isAuthenticated = !!user
  const freeQuota = manualAccess.freeQuota
  // Mostra o banner de lote dinâmico SÓ se todos os planos habilitados compartilham o mesmo evento.
  // Caso contrário (planos com lotes diferentes), o checkout exibe por plano — não polui a home.
  const enabledPlans = (product?.plans || []).filter(p => p.enabled)
  const sharedPricingEventId = enabledPlans.length > 0 && enabledPlans.every(p => p.pricingEventId === enabledPlans[0].pricingEventId)
    ? (enabledPlans[0].pricingEventId || product?.pricingEventId || null)
    : null
  const pricingEventStateData = usePricingEventState(sharedPricingEventId)
  const pricingEventState = pricingEventStateData.state
  const tierPct = pricingEventState?.activeTier?.discountPercent || 0
  const hasActiveTier = !!pricingEventState?.activeTier && pricingEventState?.isActive !== false && tierPct > 0
  // Preço exibido publicamente: apenas o menor plano (demais só aparecem no checkout), aplicando lote quando vale
  const cheapestPlanPrice = enabledPlans.length > 0
    ? Math.min(...enabledPlans.map(p => p.price))
    : Number(product?.currentPrice || 0)
  const cheapestAfterTier = hasActiveTier
    ? Math.max(0, Math.round(cheapestPlanPrice * (1 - tierPct / 100) * 100) / 100)
    : cheapestPlanPrice
  // Wait until BOTH the auth bootstrap and the first /api/manual-clinico response land
  // before rendering CTAs. Otherwise users see "Entre para..." flash to "Comprar..." flash
  // to "Baixar..." in under a second, which makes the page feel broken.
  const ctasReady = accessLoaded && !appShellLoading

  useEffect(() => {
    setHasHighlights(hasAnyManualHighlights())
  }, [])

  // Conversão de venda: ao voltar do checkout com ?purchase=success, dispara o
  // Purchase para o Meta (valor real pago vem na URL). Limpa os parâmetros em
  // seguida para não recontar a compra caso o usuário recarregue a página.
  // Nota: captura pagamentos aprovados na hora (cartão) e liberações gratuitas.
  // Pix/boleto confirmam depois via webhook — a captura precisa desses exige a
  // Conversions API (server-side), planejada como segunda etapa.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('purchase') !== 'success') return
    const parsed = Number(params.get('value'))
    // eventID = id do pedido: o mesmo Purchase enviado pelo servidor (CAPI) usa
    // este id, então o Meta conta a venda uma única vez (dedup navegador+server).
    const orderId = params.get('oid') || undefined
    trackMeta('Purchase', {
      value: Number.isFinite(parsed) ? parsed : 0,
      currency: 'BRL',
      content_name: 'Manual Clínico',
      content_type: 'product',
    }, orderId)
    params.delete('purchase')
    params.delete('value')
    params.delete('plan')
    params.delete('oid')
    const qs = params.toString()
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
  }, [])

  async function handleGeneratePDF() {
    if (product?.fullPdfButtonEnabled === false) return
    if (isAuthenticated !== true) {
      router.push(`/auth/login?redirect=${encodeURIComponent('/manual-clinico')}`)
      return
    }
    if (!manualAccess.hasFullAccess) {
      goToCheckout()
      return
    }
    if (product?.fullPdfExternalUrl) {
      window.open(product.fullPdfExternalUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setPdfLoading(true)
    try {
      const res = await fetch('/api/manual-clinico?export=true')
      if (!res.ok) {
        goToCheckout()
        return
      }
      const data = await res.json()
      const { generateManualCompletoPDF } = await import('@/lib/patologia-pdf-generator')
      const blob = await generateManualCompletoPDF(data.patologias || [])
      const watermarkedRes = await fetch('/api/manual-clinico/pdf-watermark?mode=full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/pdf' },
        body: blob,
      })
      const finalBlob = watermarkedRes.ok ? await watermarkedRes.blob() : blob
      const url = URL.createObjectURL(finalBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manual-clinico-completo-${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      fetch('/api/track/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'manual_completo_pdf', resourceId: 'all', resourceTitle: 'Manual Clínico Completo' }) }).catch(() => {})
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  function handleResetHighlights() {
    if (!resetConfirm) {
      setResetConfirm(true)
      setTimeout(() => setResetConfirm(false), 3000)
      return
    }
    clearAllManualHighlights()
    setHasHighlights(false)
    setResetConfirm(false)
  }

  const fetchPatologias = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca.trim()) params.set('busca', busca.trim())
      if (areasAtivas.length > 0) params.set('area', areasAtivas.join(','))
      if (sistemaAtivo) params.set('sistema', sistemaAtivo)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/manual-clinico?${params}`)
      const data = await res.json()

      setPatologias(data.patologias || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 0)
      if (data.product) setProduct(data.product)
      if (data.access) setManualAccess(data.access)
      setSearched(true)
    } catch (error) {
      console.error('Erro ao buscar patologias:', error)
    } finally {
      setLoading(false)
      setAccessLoaded(true)
    }
  }, [busca, areasAtivas, sistemaAtivo, page])

  // Pula o disparo no mount: o efeito de [page] abaixo já faz a busca inicial.
  // Sem isso a página abria com DUAS buscas simultâneas (uma imediata e outra
  // após o debounce), causando o "pisca-pisca" da lista logo ao carregar.
  const didMountFetch = useRef(false)
  useEffect(() => {
    if (!didMountFetch.current) {
      didMountFetch.current = true
      return
    }
    const timer = setTimeout(() => {
      setPage(1)
      fetchPatologias()
    }, 300)
    return () => clearTimeout(timer)
  }, [busca, areasAtivas, sistemaAtivo])

  useEffect(() => {
    fetchPatologias()
  }, [page])

  function toggleArea(area: AreaSaude) {
    setAreasAtivas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  function selectSistema(sistema: SistemaFisiologico) {
    setSistemaAtivo(prev => prev === sistema ? '' : sistema)
  }

  function clearFilters() {
    setBusca('')
    setAreasAtivas([])
    setSistemaAtivo('')
    setPage(1)
  }

  // O middleware redireciona quem não tem sessão para /comprar (venda sem conta
  // por Serial Key), já convertendo ?plan= em ?planKey=. Repetir essa decisão no
  // cliente só abria espaço para as duas versões divergirem.
  function goToCheckout(planKey?: 'semestral' | 'anual' | 'vitalicio') {
    router.push(`/manual-clinico/checkout${planKey ? `?plan=${planKey}` : ''}`)
  }

  // Teste grátis: leva o visitante deslogado direto para criar a conta, já
  // apontando o retorno para o Manual (ou para uma patologia específica), onde
  // as aberturas gratuitas ficam liberadas. É o caminho que faltava — antes o
  // único botão mandava todo mundo para o checkout.
  function goToFreeTrial(slug?: string) {
    const dest = slug ? `/manual-clinico/${slug}` : '/manual-clinico'
    router.push(`/auth/login?mode=register&redirect=${encodeURIComponent(dest)}`)
  }

  // ── Tour guiado ──
  const startTour = useCallback(() => {
    // Só entram os passos cujo alvo existe agora na tela (evita cartão órfão
    // apontando para uma seção oculta). Passos sem alvo (boas-vindas/fim) ficam.
    const visible = TOUR_STEPS.filter((s) => !s.target || document.querySelector(s.target))
    setTourSteps(visible.length ? visible : TOUR_STEPS)
    setTourOpen(true)
  }, [])

  const dismissTour = useCallback(() => {
    setTourOpen(false)
    try { localStorage.setItem(TOUR_STORAGE_KEY, 'done') } catch {}
  }, [])

  // Auto-início: usuário logado, página pronta, com patologias carregadas e sem
  // busca/filtro ativo — e apenas se ainda não viu o tour nesta versão.
  useEffect(() => {
    if (tourAutoChecked.current) return
    if (isAuthenticated !== true || !ctasReady || patologias.length === 0) return
    if (busca || areasAtivas.length > 0 || sistemaAtivo) return
    tourAutoChecked.current = true
    let done = false
    try { done = localStorage.getItem(TOUR_STORAGE_KEY) === 'done' } catch {}
    if (!done) {
      const t = setTimeout(() => startTour(), 600)
      return () => clearTimeout(t)
    }
  }, [isAuthenticated, ctasReady, patologias.length, busca, areasAtivas, sistemaAtivo, startTour])

  async function handleDeclineRenewal() {
    if (!renewalDeclineConfirm) {
      setRenewalDeclineConfirm(true)
      setTimeout(() => setRenewalDeclineConfirm(false), 4000)
      return
    }
    setRenewalDeclining(true)
    try {
      const res = await fetch('/api/manual-clinico/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline_renewal' }),
      })
      if (res.ok) {
        await fetchPatologias()
      }
    } catch (err) {
      console.error('Erro ao recusar renovação:', err)
    } finally {
      setRenewalDeclining(false)
      setRenewalDeclineConfirm(false)
    }
  }

  const hasFilters = busca || areasAtivas.length > 0 || sistemaAtivo

  return (
    <div className="surface-page">
      {/* Floating focus session */}
      <FloatingFocusGlass enabled={isAuthenticated === true} />
      <GuidedTour open={tourOpen} steps={tourSteps} onClose={dismissTour} onFinish={dismissTour} />

      {/* ══════════ HERO ══════════ */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-muted/30" aria-hidden />

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pt-8 sm:pt-10 pb-10 max-w-6xl">
          <div className="text-center mb-7">
            <div className="inline-flex flex-col items-center">
              <p className="editorial-mark mb-3 justify-center">Produto carro-chefe</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-heading tracking-tight text-foreground">
                Manual Clínico
              </h1>
              <p className="text-muted-foreground mt-3 max-w-xl text-sm sm:text-base leading-relaxed">
                Pare de abrir 5 abas pra resolver 1 patologia. Diagnóstico, diferenciais, conduta e farmacologia em segundos, pesquisáveis por nome, sinônimo ou CID-10.
              </p>
              {total > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">
                    {total} patologias prontas para consulta
                  </span>
                </div>
              )}
              {ctasReady && !manualAccess.hasFullAccess && freeQuota?.mode === 'quantity' && freeQuota.limit > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {isAuthenticated
                    ? freeQuota.remaining > 0
                      ? `Você ainda tem ${freeQuota.remaining} de ${freeQuota.limit} aberturas grátis`
                      : `Você já usou suas ${freeQuota.limit} aberturas grátis`
                    : `Entre e escolha ${freeQuota.limit} patologias grátis agora`}
                </div>
              )}
              {ctasReady && manualAccess.hasFullAccess && manualAccess.reason === 'included_plan' && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Crown className="h-4 w-4" />
                  Incluso no seu plano {PLUS_LABEL}
                </div>
              )}
              {ctasReady && manualAccess.hasFullAccess && manualAccess.subscription && (
                <SubscriptionInfoBanner subscription={manualAccess.subscription} />
              )}

              {ctasReady && manualAccess.hasFullAccess && manualAccess.subscription
                && !manualAccess.subscription.isLifetime
                && !manualAccess.subscription.renewalDeclined
                && (manualAccess.subscription.daysRemaining != null && manualAccess.subscription.daysRemaining <= 7)
                && (
                  <RenewalBanner
                    subscription={manualAccess.subscription}
                    onRenew={() => goToCheckout(manualAccess.subscription?.planKey || 'semestral')}
                    onDecline={handleDeclineRenewal}
                    declining={renewalDeclining}
                    declineConfirm={renewalDeclineConfirm}
                  />
                )}
              {ctasReady && !manualAccess.hasFullAccess && manualAccess.subscription?.isExpired && !manualAccess.subscription.renewalDeclined && (
                <RenewalBanner
                  subscription={manualAccess.subscription}
                  onRenew={() => goToCheckout(manualAccess.subscription?.planKey || 'semestral')}
                  onDecline={handleDeclineRenewal}
                  declining={renewalDeclining}
                  declineConfirm={renewalDeclineConfirm}
                />
              )}

              {/* ── Pricing event countdown ── (só quando lote dinâmico vale para TODOS os planos) */}
              {ctasReady && !manualAccess.hasFullAccess && product?.isActive && hasActiveTier && pricingEventState ? (
                <div className="mt-5 mx-auto max-w-md space-y-2">
                  <PricingEventCountdown state={pricingEventState} compact />
                  <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-center text-[11px] font-bold text-emerald-700 dark:text-emerald-200">
                    Lote {pricingEventState.activeTier?.label || 'ativo'} · {Math.round(tierPct)}% OFF
                  </div>
                </div>
              ) : null}

              {/* ── Action buttons ── */}
              {!ctasReady ? (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3" aria-hidden="true">
                  <div className="h-12 w-64 rounded-xl bg-muted border border-border animate-pulse" />
                  <div className="h-12 w-52 rounded-xl bg-muted/70 border border-border animate-pulse" />
                </div>
              ) : (
                <>
                  {!manualAccess.hasFullAccess && product?.isActive && enabledPlans.length > 0 && (
                    <div className="mt-6 flex flex-col items-center gap-2.5" data-tour="access">
                      {!isAuthenticated && freeQuota?.mode === 'quantity' && freeQuota.limit > 0 ? (
                        <>
                          {/* Deslogado com teste grátis: registro-primeiro */}
                          <button
                            onClick={() => goToFreeTrial()}
                            className="group inline-flex h-12 sm:h-14 items-center justify-center gap-2.5 rounded-md bg-emerald-500 px-6 sm:px-7 text-sm sm:text-base font-bold text-white shadow-md shadow-emerald-500/25 transition hover:bg-emerald-500/90 active:scale-[0.98]"
                          >
                            <Sparkles className="h-5 w-5" />
                            Criar conta grátis e testar {freeQuota.limit} patologias
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                          </button>
                          <button
                            onClick={() => goToCheckout()}
                            className="text-xs font-bold text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
                          >
                            Já quero desbloquear tudo · {formatBRL(hasActiveTier ? cheapestAfterTier : cheapestPlanPrice)}
                          </button>
                          <p className="text-[11px] font-medium text-muted-foreground/70">Sem cartão · leva menos de 1 minuto</p>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => goToCheckout()}
                            className="group inline-flex h-12 sm:h-14 items-center justify-center gap-2.5 rounded-md bg-secondary px-6 sm:px-7 text-sm sm:text-base font-bold text-secondary-foreground shadow-md transition hover:bg-secondary/90 active:scale-[0.98]"
                          >
                            <Crown className="h-5 w-5" />
                            Desbloquear o Manual Clínico
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                          </button>
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {hasActiveTier
                              ? <>Por apenas <span className="font-black">{formatBRL(cheapestAfterTier)}</span> <span className="line-through text-muted-foreground/60 ml-1 font-bold">{formatBRL(cheapestPlanPrice)}</span></>
                              : <>Por apenas <span className="font-black">{formatBRL(cheapestPlanPrice)}</span></>}
                          </p>
                          {isAuthenticated && freeQuota?.mode === 'quantity' && freeQuota.limit > 0 && freeQuota.remaining > 0 && (
                            <p className="text-[11px] font-medium text-muted-foreground/70">
                              Ou escolha uma patologia abaixo — você tem {freeQuota.remaining} de {freeQuota.limit} aberturas grátis
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {product?.fullPdfButtonEnabled !== false && (
                      <button
                        onClick={handleGeneratePDF}
                        disabled={pdfLoading}
                        data-tour="pdf"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                          bg-primary text-primary-foreground shadow-lg shadow-primary/25
                          hover:bg-primary/90 active:scale-[0.97] transition-all duration-200
                          disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {pdfLoading
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <FileDown className="h-4 w-4" />}
                        {pdfLoading
                          ? 'Gerando PDF...'
                          : manualAccess.hasFullAccess && product?.fullPdfExternalUrl
                            ? 'Abrir Manual Completo (PDF)'
                            : manualAccess.hasFullAccess
                              ? 'Baixar Manual Completo (PDF)'
                              : isAuthenticated === true ? 'Levar o Manual no PDF' : 'Entrar para baixar o PDF'}
                      </button>
                    )}

                    {hasHighlights && (
                      <button
                        onClick={handleResetHighlights}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 active:scale-[0.97]
                          ${resetConfirm
                            ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                            : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                          }`}
                      >
                        {resetConfirm
                          ? <><RotateCcw className="h-4 w-4" /> Confirmar reset de marcações</>
                          : <><Highlighter className="h-4 w-4" /> Resetar Marcações</>
                        }
                      </button>
                    )}

                    <button
                      onClick={startTour}
                      data-tour="tutorial-btn"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-emerald-400/30 bg-emerald-400/5 text-emerald-700 dark:text-emerald-300 transition-all duration-200 hover:bg-emerald-400/10 active:scale-[0.97]"
                    >
                      <GraduationCap className="h-4 w-4" />
                      Tutorial
                    </button>
                  </div>

                  {!manualAccess.hasFullAccess && product?.isActive && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground/70">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        Acesso imediato
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        Atualizações inclusas
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        Pix, cartão ou boleto
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ══════════ SEARCH BAR ══════════ */}
          <div className="max-w-2xl mx-auto" data-tour="search">
            <div className="relative group">
              <div className="relative flex items-center bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-colors duration-200 group-focus-within:border-primary/50">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Pesquisar por nome, sinônimo, CID-10..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-12 pr-12 h-14 text-base bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
                  aria-label="Pesquisar patologias"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {!busca && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <div className="flex items-center gap-1.5 mr-0.5 text-muted-foreground/50">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wide">Sugestões</span>
                </div>
                {PESQUISAS_SUGERIDAS.map(({ label, slug }) => (
                  <button
                    key={slug}
                    onClick={() => router.push(`/manual-clinico/${slug}`)}
                    className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══════════ AREA FILTER PILLS ══════════ */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6" data-tour="filtros">
            <div className="flex items-center gap-1.5 mr-1 text-muted-foreground/50">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wide">Filtros</span>
            </div>
            {AREAS_SAUDE.map(area => (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold border transition-colors ${
                  areasAtivas.includes(area)
                    ? AREA_COLORS_ACTIVE[area]
                    : `${AREA_COLORS[area]} bg-card border-border hover:border-primary/35 hover:bg-muted/40`
                }`}
                aria-label={`Filtrar por ${area}`}
                aria-pressed={areasAtivas.includes(area)}
              >
                {area}
              </button>
            ))}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground/60 hover:text-foreground ml-1 underline underline-offset-2 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

        {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {ctasReady && !manualAccess.hasFullAccess && product?.isActive && (
          <div className="mb-7 overflow-hidden rounded-lg border border-amber-500/25 bg-amber-500/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-300/15 p-2 text-amber-300">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-snug">
                    {freeQuota?.mode === 'quantity' && freeQuota.limit > 0 && isAuthenticated && freeQuota.remaining <= 0
                      ? 'Você abriu suas patologias grátis. Libere o Manual inteiro agora.'
                      : 'Tenha o Manual Clínico inteiro.'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {freeQuota?.mode === 'quantity' && freeQuota.limit > 0
                      ? isAuthenticated
                        ? `Você usou ${freeQuota.used} de ${freeQuota.limit} aberturas grátis. Desbloqueie por ${formatBRL(cheapestAfterTier)}${hasActiveTier ? ` · ${Math.round(tierPct)}% OFF` : ''}.`
                        : `Crie sua conta e ganhe ${freeQuota.limit} aberturas grátis, ou desbloqueie o Manual completo.`
                      : `${product.benefitText} · por apenas ${formatBRL(cheapestAfterTier)}${hasActiveTier ? ` (lote ${Math.round(tierPct)}% OFF)` : ''}.`}
                  </p>
                </div>
              </div>
              {!isAuthenticated && freeQuota?.mode === 'quantity' && freeQuota.limit > 0 ? (
                <button
                  onClick={() => goToFreeTrial()}
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500/90 active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4" />
                  Criar conta grátis
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : (
                <button
                  onClick={() => goToCheckout()}
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
                >
                  Desbloquear agora
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══════════ FERRAMENTAS CLÍNICAS ENTRY ══════════ */}
        {!busca && (
          <button
            onClick={() => router.push('/manual-clinico/ferramentas')}
            data-tour="ferramentas"
            className="group mb-3 w-full overflow-hidden rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/35"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-snug">Ferramentas Clínicas</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Mais de 200 calculadoras e escores interativos que respondem enquanto você digita — gasometria,
                    ventilação mecânica, escores de risco, função renal, sepse, AVC, hepatologia, doses e conversões.
                    Cada uma com a fórmula à mostra, interpretação do resultado, armadilhas de aplicação e referência.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </button>
        )}

        {/* ══════════ FARMACOLOGIA ENTRY ══════════ */}
        {!busca && (
          <button
            onClick={() => router.push('/manual-clinico/farmacologia')}
            data-tour="farmacologia"
            className="group mb-3 w-full overflow-hidden rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/35"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-snug">Farmacologia por classes</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Fármacos organizados por classe e subclasse: mecanismo, metabolismo, excreção, efeitos, posologia e calculadora de dose.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </button>
        )}

        {/* ══════════ ANATOMIA 3D ENTRY ══════════ */}
        {!busca && (
          <button
            onClick={() => router.push('/manual-clinico/anatomia-3d')}
            data-tour="anatomia"
            className="group mb-3 w-full overflow-hidden rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/35"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Box className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-snug">Anatomia 3D</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Atlas 3D interativo com dezenas de modelos rotacionáveis em 360° — coração, cardiopatias congênitas, pulmões, coluna torácica, ossos e mais — cada um com explicação anatômica aprofundada. Fonte: Universidade de Dundee.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </button>
        )}

        {/* ══════════ TOMOGRAFIA ENTRY ══════════ */}
        {!busca && (
          <button
            onClick={() => router.push('/manual-clinico/tomografia')}
            data-tour="tomografia"
            className="group mb-3 w-full overflow-hidden rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/35"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <img
                  src="/logo_manual_tomografia_domineaqui.svg"
                  alt="Manual de Tomografia"
                  width={945}
                  height={265}
                  className="block h-auto w-full max-w-[190px] dark:[filter:invert(1)_hue-rotate(180deg)_brightness(1.15)]"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Atlas tomográfico interativo: TC de tórax, abdome e crânio com os cortes percorridos por
                  scroll, como no aparelho. Troca de janela, salto para a estrutura, mais de 250 estruturas
                  com densidade em UH, como identificar, clínica e alterações — com quiz e modo treino.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </button>
        )}

        {/* ══════════ ELETROCARDIOGRAMA ENTRY (premium) ══════════ */}
        {!busca && (
          <button
            onClick={() => router.push('/manual-clinico/eletrocardiograma')}
            data-tour="ecg"
            className="group mb-7 w-full overflow-hidden rounded-lg border border-red-500/20 bg-gradient-to-r from-red-500/[0.06] to-card p-4 text-left transition-colors hover:border-red-500/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <>
                    <img
                      src="/img/eletro/manual-eletrocardiograma-light.webp"
                      alt="Manual do Eletrocardiograma"
                      width={958}
                      height={461}
                      className="block h-auto w-full max-w-[190px] dark:hidden"
                    />
                    <img
                      src="/img/eletro/manual-eletrocardiograma-dark.webp"
                      alt="Manual do Eletrocardiograma"
                      width={958}
                      height={461}
                      className="hidden h-auto w-full max-w-[190px] dark:block"
                    />
                  </>
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/25 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-200">
                    <Crown className="h-2.5 w-2.5" /> Plus+
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Simulador interativo de ECG: 12 derivações em tempo real, papel milimetrado real, medidas automáticas, régua, banco de traçados com critérios diagnósticos e exercícios. Privativo para assinantes.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-red-500" />
            </div>
          </button>
        )}

        {/* ══════════ SISTEMAS GRID ══════════ */}
        {!busca && areasAtivas.length === 0 && !sistemaAtivo && (
          <div className="mb-10" data-tour="sistemas">
            <div className="mb-5">
              <p className="editorial-mark mb-2">Índice por sistema</p>
              <h2 className="text-xl font-heading font-semibold tracking-tight">Sistemas Fisiológicos</h2>
              <p className="text-sm text-muted-foreground mt-1">Selecione um sistema para filtrar as patologias.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {SISTEMAS_FISIOLOGICOS.map((sistema, idx) => {
                const Icon = SISTEMA_ICONS[sistema] || Stethoscope
                const tint = SISTEMA_TINTS[idx % SISTEMA_TINTS.length]
                return (
                  <button
                    key={sistema}
                    onClick={() => selectSistema(sistema)}
                    className={`group flex flex-col items-start gap-3 p-4 rounded-xl border border-border bg-card text-left transition duration-200
                      hover:-translate-y-0.5 hover:shadow-sm ${tint.border}
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:translate-y-0`}
                    aria-label={`Ver patologias do ${sistema}`}
                  >
                    <div className={`rounded-lg p-2.5 ${tint.bg} transition-colors`}>
                      <Icon className={`h-5 w-5 ${tint.text}`} />
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold leading-tight text-foreground/80 group-hover:text-foreground transition-colors line-clamp-2">
                      {sistema}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Sistema ativo badge */}
        {sistemaAtivo && (
          <div className="flex items-center gap-2 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/25">
              {(() => { const Icon = SISTEMA_ICONS[sistemaAtivo] || Stethoscope; return <Icon className="h-4 w-4 text-primary" /> })()}
              <span className="text-sm font-medium">{sistemaAtivo}</span>
              <button
                onClick={() => setSistemaAtivo('')}
                className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                aria-label="Remover filtro de sistema"
              >
                <X className="h-3.5 w-3.5 text-primary" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════ RESULTS ══════════ */}
        {/* Spinner grande só na PRIMEIRA carga (lista vazia). Nas buscas/filtros
            seguintes a lista antiga fica visível (levemente esmaecida), então a
            página não "pisca" a cada tecla — a maior fonte da sensação de travado. */}
        {loading && patologias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            </div>
            <span className="text-sm text-muted-foreground">Buscando patologias...</span>
          </div>
        ) : searched && patologias.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/50 mb-4">
              <BookOpen className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhuma patologia encontrada</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {hasFilters ? 'Tente ajustar seus filtros ou termos de pesquisa.' : 'O manual clínico ainda não possui patologias cadastradas.'}
            </p>
            {hasFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : patologias.length > 0 ? (
          <>
            <div className={`grid gap-2.5 transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              {patologias.map((patologia, idx) => (
                <div
                  key={patologia._id}
                  data-tour={idx === 0 ? 'patologia' : undefined}
                  onClick={() => {
                    // Patologia grátis mas exige login: manda criar conta e volta
                    // direto pra ela (abre de graça). Antes caía num muro de login.
                    if (patologia.accessStatus === 'login_required') {
                      goToFreeTrial(patologia.slug)
                    } else {
                      router.push(`/manual-clinico/${patologia.slug}`)
                    }
                  }}
                  className={`group relative rounded-xl border border-border bg-card
                    hover:border-primary/40 hover:shadow-sm
                    transition-colors duration-200 cursor-pointer overflow-hidden ${
                      patologia.isPremiumLocked ? 'border-amber-400/30 bg-amber-400/[0.04]' : ''
                    }`}
                >
                  {/* Editorial left-rule accent on hover */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${patologia.isPremiumLocked ? 'bg-amber-500' : 'bg-primary'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-l-xl`} />

                  <div className="p-4 sm:p-5 pl-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors duration-300">
                            {patologia.nome}
                          </h3>
                          {patologia.cid10 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-clinical font-medium bg-muted border border-border text-muted-foreground">
                              {patologia.cid10}
                            </span>
                          )}
                          {patologia.accessStatus === 'free_available' ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                              Escolha grátis
                            </span>
                          ) : patologia.accessStatus === 'login_required' ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                              <LogIn className="h-3 w-3" />
                              Grátis com login
                            </span>
                          ) : patologia.isFree ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                              Grátis liberada
                            </span>
                          ) : patologia.isPremiumLocked ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-200">
                              <Lock className="h-3 w-3" />
                              Plus+
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary">
                              Plus+ liberado
                            </span>
                          )}
                        </div>
                        {patologia.sinonimos.length > 0 && (
                          <p className={`text-sm text-muted-foreground/60 mt-1 truncate ${patologia.isPremiumLocked ? 'blur-[1px]' : ''}`}>
                            {patologia.sinonimos.join(' · ')}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          {patologia.areas.map(area => (
                            <span
                              key={area}
                              className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-medium ${AREA_COLORS[area]}`}
                            >
                              {area}
                            </span>
                          ))}
                          <span className="text-[11px] text-muted-foreground/50 font-medium">
                            {patologia.sistema}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-2 p-1.5 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors duration-200">
                        {patologia.accessStatus === 'login_required'
                          ? <LogIn className="h-4 w-4 text-emerald-500/70 group-hover:text-emerald-400 transition-all duration-300" />
                          : patologia.isPremiumLocked
                          ? <Lock className="h-4 w-4 text-amber-500/70 group-hover:text-amber-400 transition-all duration-300" />
                          : isAuthenticated === true || patologia.isFree
                          ? <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
                          : <LogIn className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-all duration-300" />
                        }
                      </div>
                    </div>
                    {patologia.accessStatus === 'free_available' && (
                      <div className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-200">
                        Abrir esta patologia usa 1 das suas escolhas gratuitas.
                      </div>
                    )}
                    {patologia.accessStatus === 'login_required' && freeQuota?.limit ? (
                      <div className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-200">
                        Entre para usar suas {freeQuota.limit} escolhas gratuitas.
                      </div>
                    ) : null}
                    {patologia.isPremiumLocked && patologia.accessStatus !== 'login_required' && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-200">
                        <span>Você atingiu o limite grátis. Libere o Manual inteiro. Pagamento único.</span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-300/20 px-2 py-0.5 font-black text-amber-800 dark:text-amber-100">
                          Quero tudo <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ══════════ PAGINATION ══════════ */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-lg bg-card border-border"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <div className="px-4 py-1.5 rounded-lg bg-card border border-border text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{page}</span> de <span className="font-medium text-foreground">{totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-lg bg-card border-border"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
