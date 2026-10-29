'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { FocusSessionButton } from '@/components/focus-session-button'
import { useTrackView } from '@/hooks/use-track-view'
import {
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
  ChevronLeft,
  ChevronRight,
  X,
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
  GraduationCap,
} from 'lucide-react'
import { AREAS_SAUDE, SISTEMAS_FISIOLOGICOS, type AreaSaude, type SistemaFisiologico } from '@/lib/types/manual-clinico'
import { clearAllManualHighlights, hasAnyManualHighlights } from '@/lib/manual-clinico-highlights'
import { trackMeta } from '@/lib/meta-pixel'
import { GuidedTour, type TourStep } from '@/components/manual-clinico/guided-tour'
import { estiloDoChip } from '@/components/sidebar-cores'
import { PORTAS_DO_MANUAL, type PortaDoManual } from '@/components/manual-clinico/casco/modulos'
import { IconeDaPorta } from '@/components/manual-clinico/casco/barra-do-manual'
import { BuscaDoManual } from '@/components/manual-clinico/casco/busca-do-manual'
import { PricingEventCountdown } from '@/components/pricing-events/PricingEventCountdown'
import {
  FaixaDoPacote,
  FechamentoDoPacote,
  OfertaDoPacote,
  PerguntasDoPacote,
} from '@/components/manual-clinico/pacote'
import { MODULOS_DO_PACOTE, TOTAL_DE_MODULOS } from '@/lib/manual-clinico/pacote'
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
    <div className="ck-placa w-full max-w-xl p-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Crown className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--ck-verde)' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--ck-texto)' }}>
              Manual Clínico {subscription.planLabel || 'ativo'} {subscription.isLifetime ? '(vitalício)' : ''}
            </p>
            <p className="text-[13px]" style={{ color: 'var(--ck-texto-2)' }}>
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
          className="grid h-8 w-8 place-items-center rounded-full transition-colors"
          style={{ background: 'var(--ck-trilho)', color: 'var(--ck-texto-2)' }}
          aria-label="Informações da assinatura"
          title="Informações"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {showInfo && (
        <div className="mt-3 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: 'var(--ck-sep)', color: 'var(--ck-texto)' }}>
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
    <div className="ck-aviso w-full max-w-xl !items-start p-4 text-left">
      <div className="flex items-start gap-3">
        <CalendarClock className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold">
            {subscription.isExpired
              ? 'Seu Manual Clínico expirou'
              : `Seu Manual Clínico expira em ${formatRemainingHuman(subscription.daysRemaining, false)}`}
          </p>
          <p className="mt-0.5 text-[13px] opacity-80">
            {isCard
              ? 'No vencimento, enviaremos um e-mail com link de 1 clique para renovar com seu cartão.'
              : 'Renove agora para não perder o acesso Plus+.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onRenew}
              className="ck-cta !h-10 !px-4 !text-[13px]"
            >
              <CreditCard className="h-3.5 w-3.5" /> Renovar agora
            </button>
            {/*
              O botão existe para TODOS os meios de pagamento. Antes ele só
              aparecia para quem não pagou com cartão — quem pagou com cartão
              não tinha, na interface, nenhuma forma de dizer que não queria
              renovar, e só lhe restava esperar o e-mail de cobrança.
            */}
            <button
              onClick={onDecline}
              disabled={declining}
              className="ck-botao !h-10 !px-4 !text-[13px]"
              data-confirmando={declineConfirm ? '' : undefined}
            >
              {declining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              {declineConfirm ? 'Confirmar — mantenho o acesso até o vencimento' : 'Não quero renovar'}
            </button>
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
const TOUR_STORAGE_KEY = 'manual-clinico-tour-v2'
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
    target: '[data-tour="exames-laboratoriais"]',
    title: 'Exames Laboratoriais',
    body: 'A central de interpretação laboratorial: cada marcador com fisiologia, por que sobe, por que cai e como diferenciar — mais o Laboratório Virtual, que gera exames para você interpretar antes de ver a resposta. Privativo para assinantes e Plus+.',
  },
  {
    target: '[data-tour="farmacologia"]',
    title: 'Farmacologia por classes',
    body: 'Fármacos organizados por classe: mecanismo, metabolismo, efeitos, posologia e uma calculadora de dose.',
  },
  {
    target: '[data-tour="anatomia"]',
    title: 'Domine Anatomia',
    body: 'Escolha entre o Atlas de Anatomia com marcadores aprofundados e modelos 3D rotacionáveis em 360°.',
  },
  {
    target: '[data-tour="histologia"]',
    title: 'Manual da Histologia',
    body: 'Atlas de histologia com microscópio virtual: percorra a lâmina com zoom e objetivos de 4× a 100×, acenda as estruturas sobre a imagem e teste-se nos quizzes. Privativo para assinantes e Plus+.',
  },
  {
    target: '[data-tour="tomografia"]',
    title: 'Manual de Radiologia',
    body: 'Atlas de diagnóstico por imagem com duas modalidades: percorra os cortes de TC como no aparelho e estude radiografias com demarcações anatômicas interativas, técnica e roteiro de leitura. Exclusivo de assinantes.',
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
    // O canto superior direito já é do tema (ThemeToggle, `right-3`) e do modo
    // leve (`right-[6.25rem]`), ambos `z-[60]` e vindos do AppShell. A sessão de
    // foco nascia no MESMO ponto com `z-[55]`: no celular e no tablet ela ficava
    // literalmente atrás dos dois, sem toque possível. Aqui ela entra à esquerda
    // deles, na mesma faixa e com a mesma folga de safe-area.
    <div className="mc-com-foco pwa-safe-fixed-top fixed top-3 right-[9.75rem] z-[60]">
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
  // Registra a visita ao índice do Manual para o painel de estatísticas.
  useTrackView({ kind: 'manual_home_open', resourceId: 'manual-clinico', resourceTitle: 'Manual Clínico' })
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
  // O plano inteiro, não só o valor: a oferta precisa do rótulo e da duração
  // para escrever "plano Semestral" e calcular o custo por dia.
  const cheapestPlan = enabledPlans.reduce<(typeof enabledPlans)[number] | null>(
    (menor, p) => (menor == null || p.price < menor.price ? p : menor),
    null,
  )
  const cheapestPlanPrice = cheapestPlan
    ? cheapestPlan.price
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
  const vende = ctasReady && !manualAccess.hasFullAccess && !!product?.isActive
  const precoAgora = hasActiveTier ? cheapestAfterTier : cheapestPlanPrice
  const temTesteGratis = freeQuota?.mode === 'quantity' && (freeQuota?.limit ?? 0) > 0

  return (
    <div className="surface-page">
      {/* Floating focus session */}
      <FloatingFocusGlass enabled={isAuthenticated === true} />
      <GuidedTour open={tourOpen} steps={tourSteps} onClose={dismissTour} onFinish={dismissTour} />

      <div className="container mx-auto max-w-6xl px-4 pb-12">
        {/* ══════════ HERÓI DO PORTAL ══════════
            O Manual Clínico é a porta de entrada de tudo: o título diz o
            trabalho que ele resolve (não o nome do produto, que já está na
            barra), três números reais provam o tamanho e as ações vêm logo. */}
        <header className="ck-escopo mc-heroi ck-entra">
          <span className="sidebar-mini-chip mc-heroi-chip" style={estiloDoChip('manualClinico')} aria-hidden>
            <BookOpen />
          </span>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--ck-texto-3)' }}>
            Manual Clínico · {TOTAL_DE_MODULOS} manuais num só acesso
          </p>
          <h1 className="mc-heroi-titulo" style={{ color: 'var(--ck-texto)' }}>
            Pare de abrir cinco abas para resolver um caso.
          </h1>
          <p className="mc-heroi-promessa">
            Patologia, laboratório, imagem, lâmina, ECG, fármaco e calculadora — cada um com a sua porta, todos
            pesquisáveis por nome, sinônimo ou CID-10.
          </p>
          <div className="mc-numeros">
            <div className="mc-numero">
              <b>{total > 0 ? total : '300+'}</b>
              <span>patologias</span>
            </div>
            <div className="mc-numero">
              <b>{TOTAL_DE_MODULOS}</b>
              <span>manuais no mesmo acesso</span>
            </div>
            <div className="mc-numero">
              <b>1</b>
              <span>pagamento, acesso na hora</span>
            </div>
          </div>

          {/* ── O estado do acesso de quem já está aqui ── */}
          {ctasReady && !manualAccess.hasFullAccess && temTesteGratis && freeQuota && (
            <span className="ck-chip">
              {isAuthenticated
                ? freeQuota.remaining > 0
                  ? `Você ainda tem ${freeQuota.remaining} de ${freeQuota.limit} aberturas grátis`
                  : `Você já usou suas ${freeQuota.limit} aberturas grátis`
                : `Entre e escolha ${freeQuota.limit} patologias grátis agora`}
            </span>
          )}
          {ctasReady && manualAccess.hasFullAccess && manualAccess.reason === 'included_plan' && (
            <span className="ck-chip" data-tom="ambar">
              <Crown className="h-3.5 w-3.5" /> Incluso no seu plano {PLUS_LABEL}
            </span>
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

          {/* ── Lote dinâmico (só quando vale para TODOS os planos) ── */}
          {vende && hasActiveTier && pricingEventState ? (
            <div className="w-full max-w-md space-y-2">
              <PricingEventCountdown state={pricingEventState} compact />
              <p className="text-center text-[12.5px] font-semibold" style={{ color: 'var(--ck-verde)' }}>
                Lote {pricingEventState.activeTier?.label || 'ativo'} · {Math.round(tierPct)}% OFF
              </p>
            </div>
          ) : null}

          {/* ── Ações ── */}
          {!ctasReady ? (
            <div className="mc-acoes" aria-hidden="true">
              <div className="h-[54px] w-64 animate-pulse rounded-full" style={{ background: 'var(--ck-trilho)' }} />
              <div className="h-[46px] w-44 animate-pulse rounded-full" style={{ background: 'var(--ck-trilho)' }} />
            </div>
          ) : (
            <>
              {vende && enabledPlans.length > 0 && (
                <div className="flex flex-col items-center gap-2" data-tour="access">
                  {!isAuthenticated && temTesteGratis && freeQuota ? (
                    <>
                      {/* Deslogado com teste grátis: registro-primeiro */}
                      <button onClick={() => goToFreeTrial()} className="ck-cta ck-cta-verde">
                        Testar {freeQuota.limit} patologias grátis
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <p className="text-[12.5px]" style={{ color: 'var(--ck-texto-3)' }}>
                        Sem cartão · menos de 1 minuto ·{' '}
                        <button onClick={() => goToCheckout()} className="ck-link">
                          ou desbloquear tudo por {formatBRL(precoAgora)}
                        </button>
                      </p>
                    </>
                  ) : (
                    <>
                      <button onClick={() => goToCheckout()} className="ck-cta">
                        Quero os {TOTAL_DE_MODULOS} manuais
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--ck-verde)' }}>
                        Por {formatBRL(precoAgora)}
                        {hasActiveTier && (
                          <span className="ml-1.5 font-medium line-through" style={{ color: 'var(--ck-texto-3)' }}>
                            {formatBRL(cheapestPlanPrice)}
                          </span>
                        )}
                        <span className="font-medium" style={{ color: 'var(--ck-texto-3)' }}> · pagamento único</span>
                      </p>
                      {isAuthenticated && temTesteGratis && freeQuota && freeQuota.remaining > 0 && (
                        <p className="text-[12.5px]" style={{ color: 'var(--ck-texto-3)' }}>
                          Ou escolha uma patologia abaixo — você tem {freeQuota.remaining} de {freeQuota.limit} aberturas grátis
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mc-acoes">
                {manualAccess.hasFullAccess && (
                  <a href="#patologias" className="ck-cta">
                    Buscar uma patologia
                  </a>
                )}
                {product?.fullPdfButtonEnabled !== false && (
                  <button onClick={handleGeneratePDF} disabled={pdfLoading} data-tour="pdf" className="ck-botao">
                    {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                    {pdfLoading
                      ? 'Gerando PDF...'
                      : manualAccess.hasFullAccess && product?.fullPdfExternalUrl
                        ? 'Abrir o PDF'
                        : manualAccess.hasFullAccess
                          ? 'Baixar o PDF'
                          : isAuthenticated === true ? 'Levar no PDF' : 'Entrar para baixar o PDF'}
                  </button>
                )}
                {hasHighlights && (
                  <button onClick={handleResetHighlights} className="ck-botao" data-confirmando={resetConfirm ? '' : undefined}>
                    {resetConfirm
                      ? <><RotateCcw className="h-4 w-4" /> Confirmar reset</>
                      : <><Highlighter className="h-4 w-4" /> Resetar marcações</>}
                  </button>
                )}
                <button onClick={startTour} data-tour="tutorial-btn" className="ck-botao">
                  <GraduationCap className="h-4 w-4" />
                  Tutorial
                </button>
              </div>
            </>
          )}
        </header>

        {/* ══════════ AS PORTAS ══════════
            O Manual é o portal: daqui a pessoa entra em cada ramificação. Uma
            grade só, com a mesma cor de cada módulo na barra e no menu — o que
            se reconhece não precisa ser lembrado. */}
        <section id="portas" className="ck-escopo mt-12 scroll-mt-24" aria-labelledby="portas-titulo">
          <div className="mb-5 text-center">
            <h2 id="portas-titulo" className="mc-secao-titulo" style={{ color: 'var(--ck-texto)' }}>
              Escolha por onde entrar
            </h2>
            <p className="mc-secao-apoio">Cada manual tem a sua porta. O acesso é um só.</p>
          </div>
          <div className="mc-portas">
            {PORTAS_DO_PORTAL.map((porta) => (
              <PortaDoPortal key={porta.id} porta={porta} />
            ))}
          </div>
        </section>

        {/* ══════════ PATOLOGIAS ══════════ */}
        <section id="patologias" className="ck-escopo mt-14 scroll-mt-24" aria-labelledby="patologias-titulo">
          <div className="mb-5 text-center">
            <h2 id="patologias-titulo" className="mc-secao-titulo" style={{ color: 'var(--ck-texto)' }}>
              Patologias
            </h2>
            <p className="mc-secao-apoio">
              {total > 0 ? `${total} fichas` : 'As fichas'} com fisiopatologia, diferenciais, conduta e fluxograma.
            </p>
          </div>

          <div data-tour="search">
            <BuscaDoManual
              valor={busca}
              aoMudar={setBusca}
              placeholder="Nome, sinônimo ou CID-10"
              rotulo="Pesquisar patologias"
            />
          </div>

          {!busca && (
            <p className="mx-auto mt-3 max-w-2xl text-center text-[13px] leading-relaxed" style={{ color: 'var(--ck-texto-3)' }}>
              Experimente{' '}
              {PESQUISAS_SUGERIDAS.map(({ label, slug }, i) => (
                <span key={slug}>
                  {i > 0 && ' · '}
                  <Link href={`/manual-clinico/${slug}`} className="ck-link">{label}</Link>
                </span>
              ))}
            </p>
          )}

          <div className="mc-filtros mt-5" data-tour="filtros" role="group" aria-label="Filtrar por área">
            {AREAS_SAUDE.map((area) => (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className="mc-filtro"
                data-ativo={areasAtivas.includes(area) ? '' : undefined}
                aria-pressed={areasAtivas.includes(area)}
                aria-label={`Filtrar por ${area}`}
              >
                {area}
              </button>
            ))}
            {hasFilters && (
              <button onClick={clearFilters} className="ck-link-discreto px-2">
                Limpar
              </button>
            )}
          </div>

          {/* Quem ainda não tem: a compra não é de um manual, é do pacote. */}
          {vende && (
            <div className="mx-auto mt-6 max-w-3xl">
              <FaixaDoPacote atual="manual" />
              {temTesteGratis && freeQuota && isAuthenticated && freeQuota.remaining <= 0 && (
                <div className="ck-aviso mt-3">
                  <Lock className="h-4 w-4" />
                  <span className="flex-1">
                    Você usou suas {freeQuota.limit} aberturas grátis. O Manual inteiro sai por {formatBRL(precoAgora)}
                    {hasActiveTier ? ` · ${Math.round(tierPct)}% OFF` : ''}.
                  </span>
                  <button onClick={() => goToCheckout()} className="ck-link shrink-0">Desbloquear</button>
                </div>
              )}
            </div>
          )}

          {/* ── Índice por sistema ── */}
          {!busca && areasAtivas.length === 0 && !sistemaAtivo && (
            <div className="mt-8" data-tour="sistemas">
              <p className="mb-3 text-center text-[13px] font-semibold" style={{ color: 'var(--ck-texto-2)' }}>
                Ou navegue por sistema
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {SISTEMAS_FISIOLOGICOS.map((sistema, idx) => {
                  const Icon = SISTEMA_ICONS[sistema] || Stethoscope
                  const tint = SISTEMA_TINTS[idx % SISTEMA_TINTS.length]
                  return (
                    <button
                      key={sistema}
                      onClick={() => selectSistema(sistema)}
                      className="mc-item !items-center !justify-start !gap-2.5 !px-3 !py-3"
                      aria-label={`Ver patologias do ${sistema}`}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${tint.bg}`}>
                        <Icon className={`h-4 w-4 ${tint.text}`} />
                      </span>
                      <span className="line-clamp-2 text-[12.5px] font-semibold leading-tight" style={{ color: 'var(--ck-texto)' }}>
                        {sistema}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {sistemaAtivo && (
            <div className="mt-6 flex justify-center">
              <span className="ck-chip" data-tom="neutro">
                {sistemaAtivo}
                <button onClick={() => setSistemaAtivo('')} className="-mr-1 grid h-5 w-5 place-items-center rounded-full" aria-label="Remover filtro de sistema">
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}

          {/* ── Resultados ──
              Spinner grande só na PRIMEIRA carga (lista vazia). Nas buscas
              seguintes a lista antiga fica visível (esmaecida), então a página
              não "pisca" a cada tecla. */}
          <div className="mt-6">
            {loading && patologias.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--ck-texto-3)' }} />
                <span className="text-sm" style={{ color: 'var(--ck-texto-2)' }}>Buscando patologias...</span>
              </div>
            ) : searched && patologias.length === 0 ? (
              <div className="py-16 text-center">
                <h3 className="mb-1 text-lg font-semibold" style={{ color: 'var(--ck-texto)' }}>Nenhuma patologia encontrada</h3>
                <p className="mx-auto max-w-md text-sm" style={{ color: 'var(--ck-texto-2)' }}>
                  {hasFilters ? 'Tente ajustar seus filtros ou termos de pesquisa.' : 'O manual clínico ainda não possui patologias cadastradas.'}
                </p>
                {hasFilters && (
                  <button className="ck-botao mt-4" onClick={clearFilters}>Limpar filtros</button>
                )}
              </div>
            ) : patologias.length > 0 ? (
              <>
                <div className={`grid gap-2 transition-opacity duration-200 sm:grid-cols-2 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
                  {patologias.map((patologia, idx) => (
                    <button
                      key={patologia._id}
                      type="button"
                      data-tour={idx === 0 ? 'patologia' : undefined}
                      // Todo mundo vai para a patologia, inclusive quem não tem
                      // conta: a página abre a prévia, e é lá que o convite para
                      // entrar aparece, com o valor já na tela.
                      onClick={() => router.push(`/manual-clinico/${patologia.slug}`)}
                      className="mc-item !flex-col !items-stretch"
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="mc-item-nome">{patologia.nome}</span>
                            {patologia.cid10 && <span className="ck-chip ck-mono" data-tom="neutro">{patologia.cid10}</span>}
                            <SeloDeAcesso patologia={patologia} />
                          </div>
                          {patologia.sinonimos.length > 0 && (
                            <p className={`mc-item-sub ${patologia.isPremiumLocked ? 'blur-[1px]' : ''}`}>
                              {patologia.sinonimos.join(' · ')}
                            </p>
                          )}
                        </div>
                        {patologia.accessStatus === 'login_required'
                          ? <LogIn className="mc-item-seta h-4 w-4" style={{ color: 'var(--ck-verde)' }} />
                          : patologia.isPremiumLocked
                          ? <Lock className="mc-item-seta h-4 w-4" style={{ color: 'var(--ck-ambar)' }} />
                          : isAuthenticated === true || patologia.isFree
                          ? <ArrowRight className="mc-item-seta h-4 w-4" />
                          : <LogIn className="mc-item-seta h-4 w-4" />}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {patologia.areas.map((area) => (
                          <span key={area} className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${AREA_COLORS[area]}`}>
                            {area}
                          </span>
                        ))}
                        <span className="text-[11.5px]" style={{ color: 'var(--ck-texto-3)' }}>{patologia.sistema}</span>
                      </div>
                      {patologia.accessStatus === 'free_available' && (
                        <p className="mt-2.5 text-[12.5px] font-medium" style={{ color: 'var(--ck-verde)' }}>
                          Abrir esta patologia usa 1 das suas escolhas gratuitas.
                        </p>
                      )}
                      {patologia.accessStatus === 'login_required' && freeQuota?.limit ? (
                        <p className="mt-2.5 text-[12.5px] font-medium" style={{ color: 'var(--ck-verde)' }}>
                          Entre para usar suas {freeQuota.limit} escolhas gratuitas.
                        </p>
                      ) : null}
                      {patologia.isPremiumLocked && patologia.accessStatus !== 'login_required' && (
                        <p className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[12.5px] font-medium" style={{ color: 'var(--ck-ambar)' }}>
                          <span>Limite grátis atingido. Libere o Manual inteiro, pagamento único.</span>
                          <span className="inline-flex items-center gap-1 font-bold">Quero tudo <ArrowRight className="h-3 w-3" /></span>
                        </p>
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Paginação ── */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button className="ck-botao !h-10 !px-4" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </button>
                    <span className="text-sm tabular-nums" style={{ color: 'var(--ck-texto-2)' }}>
                      <strong style={{ color: 'var(--ck-texto)' }}>{page}</strong> de <strong style={{ color: 'var(--ck-texto)' }}>{totalPages}</strong>
                    </span>
                    <button className="ck-botao !h-10 !px-4" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Próxima <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </section>

        {/* ══════════ A OFERTA — depois do valor inteiro ══════════
            As portas acima já mostraram os nove manuais; aqui vem o preço,
            as dúvidas e o último empurrão. */}
        {vende && !busca && (
          <div className="mt-16">
            <OfertaDoPacote
              onCheckout={() => goToCheckout()}
              isAuthenticated={isAuthenticated}
              precoBase={cheapestPlanPrice}
              precoFinal={precoAgora}
              temLote={hasActiveTier}
              pctLote={tierPct}
              rotuloLote={pricingEventState?.activeTier?.label ?? null}
              rotuloPlano={cheapestPlan?.label ?? null}
              mesesDoPlano={cheapestPlan?.durationMonths ?? null}
              mostrarPreco={cheapestPlanPrice > 0}
            />

            <PerguntasDoPacote className="mt-12" />

            <FechamentoDoPacote
              className="mt-8"
              onCheckout={() => goToCheckout()}
              precoFinal={precoAgora}
              mostrarPreco={cheapestPlanPrice > 0}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════ As portas do portal ══════════════════════════ */

/**
 * O que cada porta promete, em uma linha, com o número que prova. Os números
 * vêm de `MODULOS_DO_PACOTE` (a mesma fonte das vitrines), para o portal não
 * desencontrar do que cada módulo anuncia.
 */
const TEXTO_DAS_PORTAS: Partial<Record<PortaDoManual['id'], { texto: string; tour?: string }>> = {
  estudo: {
    texto: 'Um tema, todos os manuais: a TC, a lâmina, o ultrassom, a ficha e o tratamento — na ordem em que se estuda.',
    tour: 'estudo-integrado',
  },
  exames: { texto: 'Cada marcador da citocina ao número do laudo — mais o Laboratório Virtual para praticar.', tour: 'exames-laboratoriais' },
  farmacologia: { texto: 'Mecanismo, metabolismo, posologia e a calculadora de dose por peso em cada ficha.', tour: 'farmacologia' },
  eletrocardiograma: { texto: 'A trilha do nó sinusal ao laudo e o simulador de 12 derivações em tempo real.', tour: 'ecg' },
  radiologia: { texto: 'Pilhas de TC que você rola como na estação e Raio-X com cada estrutura acesa.', tour: 'tomografia' },
  semiologia: { texto: 'Arraste o parâmetro e veja o sinal nascer — da mão ao otoscópio e ao POCUS.' },
  histologia: { texto: 'Lâminas reais num microscópio de 4× a 100×, com as estruturas que você acende e apaga.', tour: 'histologia' },
  anatomia: { texto: 'Pranchas reais com ficha em cada marcador e modelos 3D que você gira na mão.', tour: 'anatomia' },
  ferramentas: { texto: 'Calculadoras e escores com a fórmula aberta, o fundamento e o que invalida o resultado.', tour: 'ferramentas' },
}

const NUMERO_DAS_PORTAS: Partial<Record<PortaDoManual['id'], string>> = Object.fromEntries(
  MODULOS_DO_PACOTE.filter((m) => m.id !== 'manual').map((m) => [m.id, `${m.numeros[0].v} ${m.numeros[0].r}`]),
)

// O Estudo Integrado abre a grade (é o que costura os outros); as Patologias
// não entram — são esta própria página, logo abaixo.
const PORTAS_DO_PORTAL = [
  ...PORTAS_DO_MANUAL.filter((p) => p.id === 'estudo'),
  ...PORTAS_DO_MANUAL.filter((p) => p.id !== 'estudo' && p.id !== 'manual'),
]

function PortaDoPortal({ porta }: { porta: PortaDoManual }) {
  const info = TEXTO_DAS_PORTAS[porta.id]
  const numero = NUMERO_DAS_PORTAS[porta.id]
  const larga = porta.id === 'estudo'
  return (
    <Link href={porta.href} data-tour={info?.tour} className={`mc-porta ${larga ? 'mc-porta-larga' : ''}`}>
      <div className="mc-porta-topo">
        <span className="sidebar-mini-chip" style={estiloDoChip(porta.cor)} aria-hidden>
          <IconeDaPorta porta={porta} />
        </span>
        <div className="min-w-0">
          <p className="mc-porta-nome">{porta.nome}</p>
          {numero && <p className="mc-porta-num">{numero}</p>}
          {larga && <p className="mc-porta-num">Novo · monte seus estudos e marque o que já viu</p>}
        </div>
      </div>
      {info && <p className={`mc-porta-texto ${larga ? 'sm:ml-3 sm:flex-1' : ''}`}>{info.texto}</p>}
      <ArrowRight className="mc-porta-ir h-4 w-4" aria-hidden />
    </Link>
  )
}

/** A etiqueta de acesso de cada patologia — o que está grátis, liberado ou trancado. */
function SeloDeAcesso({ patologia }: { patologia: PatologiaResumo }) {
  if (patologia.accessStatus === 'free_available') return <span className="ck-chip">Escolha grátis</span>
  if (patologia.accessStatus === 'login_required') {
    return (
      <span className="ck-chip">
        <LogIn className="h-3 w-3" /> Grátis com login
      </span>
    )
  }
  if (patologia.isFree) return <span className="ck-chip">Grátis liberada</span>
  if (patologia.isPremiumLocked) {
    return (
      <span className="ck-chip" data-tom="ambar">
        <Lock className="h-3 w-3" /> Plus+
      </span>
    )
  }
  return null
}
