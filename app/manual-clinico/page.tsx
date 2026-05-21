'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Crown
} from 'lucide-react'
import { AREAS_SAUDE, SISTEMAS_FISIOLOGICOS, type AreaSaude, type SistemaFisiologico } from '@/lib/types/manual-clinico'
import { clearAllManualHighlights, hasAnyManualHighlights } from '@/lib/manual-clinico-highlights'
import { PricingEventCountdown } from '@/components/pricing-events/PricingEventCountdown'
import { PricingEventPriceBlock } from '@/components/pricing-events/PricingEventPriceBlock'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'

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

const SISTEMA_COLORS: string[] = [
  'from-red-500/20 to-red-600/5',
  'from-sky-500/20 to-sky-600/5',
  'from-violet-500/20 to-violet-600/5',
  'from-amber-500/20 to-amber-600/5',
  'from-teal-500/20 to-teal-600/5',
  'from-blue-500/20 to-blue-600/5',
  'from-orange-500/20 to-orange-600/5',
  'from-indigo-500/20 to-indigo-600/5',
  'from-rose-500/20 to-rose-600/5',
  'from-emerald-500/20 to-emerald-600/5',
  'from-pink-500/20 to-pink-600/5',
  'from-purple-500/20 to-purple-600/5',
  'from-cyan-500/20 to-cyan-600/5',
  'from-lime-500/20 to-lime-600/5',
  'from-fuchsia-500/20 to-fuchsia-600/5',
]

const AREA_COLORS: Record<AreaSaude, string> = {
  'Medicina': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
  'Psicologia': 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
  'Odontologia': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  'Biomedicina': 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/20',
}

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
  freeAccessMode?: 'quantity' | 'list'
  freeQuantity?: number
  pricingEventId?: string | null
}

interface ManualAccess {
  hasFullAccess: boolean
  reason: string
  freeQuota?: {
    mode: 'quantity' | 'list'
    limit: number
    used: number
    remaining: number
    isAuthenticated: boolean
  }
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

export default function ManualClinicoPage() {
  const [showInterstitial, setShowInterstitial] = useState(false)
  const [interstitialChecked, setInterstitialChecked] = useState(false)

  useEffect(() => {
    setShowInterstitial(true)
    setInterstitialChecked(true)
  }, [])

  return (
    <AppShell allowGuest showHeader={false}>
      {interstitialChecked && showInterstitial && (
        <DoacaoInterstitialLazy
          context="manual-clinico"
          onClose={() => setShowInterstitial(false)}
        />
      )}
      <ManualClinicoContent />
    </AppShell>
  )
}

// Lazy interstitial to avoid SSR issues
function DoacaoInterstitialLazy({ context, onClose }: { context: 'manual-clinico' | 'exam'; onClose: () => void }) {
  const [Component, setComponent] = useState<React.ComponentType<{ context: 'manual-clinico' | 'exam'; onClose: () => void }> | null>(null)

  useEffect(() => {
    import('@/components/doacoes/doacao-interstitial').then(m => {
      setComponent(() => m.DoacaoInterstitial)
    })
  }, [])

  if (!Component) return null
  return <Component context={context} onClose={onClose} />
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
  const { user, loading: appShellLoading } = useAppShell()
  const isAuthenticated = !!user
  const freeQuota = manualAccess.freeQuota
  const pricingEventStateData = usePricingEventState(product?.pricingEventId || null)
  const pricingEventState = pricingEventStateData.state
  const tierPct = pricingEventState?.activeTier?.discountPercent || 0
  const hasActiveTier = !!pricingEventState?.activeTier && pricingEventState?.isActive !== false && tierPct > 0
  const buttonPrice = hasActiveTier && product?.currentPrice
    ? Math.max(0, Math.round(Number(product.currentPrice) * (1 - tierPct / 100) * 100) / 100)
    : Number(product?.currentPrice || 0)
  // Wait until BOTH the auth bootstrap and the first /api/manual-clinico response land
  // before rendering CTAs. Otherwise users see "Entre para..." flash to "Comprar..." flash
  // to "Baixar..." in under a second, which makes the page feel broken.
  const ctasReady = accessLoaded && !appShellLoading

  useEffect(() => {
    setHasHighlights(hasAnyManualHighlights())
  }, [])

  async function handleGeneratePDF() {
    if (product?.fullPdfButtonEnabled === false) return
    if (isAuthenticated !== true) {
      router.push(`/auth/login?redirect=${encodeURIComponent('/manual-clinico')}`)
      return
    }
    if (!manualAccess.hasFullAccess) {
      router.push('/manual-clinico/checkout')
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
        router.push('/manual-clinico/checkout')
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

  useEffect(() => {
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

  const hasFilters = busca || areasAtivas.length > 0 || sistemaAtivo

  return (
    <div className="min-h-screen bg-background">
      {/* Floating focus session (glassmorphism + iridescent wave) */}
      <FloatingFocusGlass enabled={isAuthenticated === true} />

      {/* ══════════ HERO ══════════ */}
      <div className="relative overflow-hidden">
        {/* Background image — visible */}
        <div className="absolute inset-0">
          <img
            src="https://i.imgur.com/0JXm4Au.png"
            alt=""
            className="w-full h-full object-cover opacity-30"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/50 to-background" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pt-10 pb-12 max-w-6xl">
          <div className="text-center mb-7">
            <div className="inline-flex flex-col items-center">
              <div className="inline-flex items-center gap-3 mb-3 px-5 py-2 rounded-full bg-white/[0.08] dark:bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">A conduta inteira na palma da mão</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold font-heading bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                Manual Clínico
              </h1>
              <p className="text-muted-foreground mt-3 max-w-xl text-base sm:text-lg leading-relaxed">
                Pare de abrir 5 abas pra resolver 1 patologia. Diagnóstico, diferenciais, conduta e farmacologia em segundos — pesquisáveis por nome, sinônimo ou CID-10.
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
              {ctasReady && manualAccess.hasFullAccess && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Crown className="h-3.5 w-3.5" />
                  Manual Clínico desbloqueado · acesso vitalício
                </div>
              )}

              {/* ── Pricing event countdown ── */}
              {ctasReady && !manualAccess.hasFullAccess && product?.isActive && pricingEventState?.activeTier ? (
                <div className="mt-5 mx-auto max-w-md space-y-2">
                  <PricingEventCountdown state={pricingEventState} compact />
                  <PricingEventPriceBlock
                    originalPrice={Number(product.currentPrice || 0)}
                    state={pricingEventState}
                  />
                </div>
              ) : null}

              {/* ── Action buttons ── */}
              {!ctasReady ? (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3" aria-hidden="true">
                  <div className="h-12 w-64 rounded-xl bg-white/[0.05] border border-white/[0.08] animate-pulse" />
                  <div className="h-12 w-52 rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {!manualAccess.hasFullAccess && product?.isActive && (
                      <button
                        onClick={() => isAuthenticated ? router.push('/manual-clinico/checkout') : router.push(`/auth/login?redirect=${encodeURIComponent('/manual-clinico/checkout')}`)}
                        className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold
                          bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-300 text-emerald-950 shadow-xl shadow-amber-500/30
                          hover:brightness-105 hover:shadow-amber-500/40 active:scale-[0.97] transition-all duration-200
                          ring-1 ring-amber-200/40 hover:ring-amber-200/60"
                      >
                        <span className="absolute -inset-px rounded-xl bg-gradient-to-r from-amber-300/0 via-white/50 to-amber-300/0 opacity-0 group-hover:opacity-100 blur-sm transition-opacity" aria-hidden="true" />
                        <Crown className="relative h-4 w-4" />
                        <span className="relative">{product.ctaText || 'Quero o Manual Clínico completo'}</span>
                        {product.currentPrice > 0 && (
                          hasActiveTier ? (
                            <span className="relative ml-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/15 px-2 py-0.5 text-xs font-black tracking-tight">
                              <span className="line-through opacity-60">{formatBRL(product.currentPrice)}</span>
                              <span>{formatBRL(buttonPrice)}</span>
                            </span>
                          ) : (
                            <span className="relative ml-1 rounded-lg bg-emerald-950/15 px-2 py-0.5 text-xs font-black tracking-tight">
                              {formatBRL(product.currentPrice)}
                            </span>
                          )
                        )}
                        <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                    {product?.fullPdfButtonEnabled !== false && (
                      <button
                        onClick={handleGeneratePDF}
                        disabled={pdfLoading}
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
                            : 'bg-white/[0.05] text-muted-foreground border-white/[0.12] hover:bg-white/[0.1] hover:text-foreground'
                          }`}
                      >
                        {resetConfirm
                          ? <><RotateCcw className="h-4 w-4" /> Confirmar reset de marcações</>
                          : <><Highlighter className="h-4 w-4" /> Resetar Marcações</>
                        }
                      </button>
                    )}
                  </div>

                  {!manualAccess.hasFullAccess && product?.isActive && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground/70">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        Pagamento único
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        Acesso vitalício
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

          {/* ══════════ GLASS SEARCH BAR ══════════ */}
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              {/* Glow effect behind search */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
              <div className="relative flex items-center bg-white/[0.07] dark:bg-white/[0.05] backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden transition-all duration-300 group-focus-within:border-primary/30 group-focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ══════════ AREA FILTER PILLS ══════════ */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
            <div className="flex items-center gap-1.5 mr-1 text-muted-foreground/50">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wide">Filtros</span>
            </div>
            {AREAS_SAUDE.map(area => (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border backdrop-blur-xl transition-all duration-300 ${
                  areasAtivas.includes(area)
                    ? AREA_COLORS_ACTIVE[area]
                    : `${AREA_COLORS[area]} bg-white/[0.05] dark:bg-white/[0.03] border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.08]`
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
          <div className="mb-7 overflow-hidden rounded-2xl border border-amber-300/25 bg-gradient-to-r from-amber-400/15 via-white/[0.04] to-emerald-400/15 p-4 backdrop-blur-xl shadow-lg shadow-amber-500/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-300/15 p-2 text-amber-300">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-snug">
                    {freeQuota?.mode === 'quantity' && freeQuota.limit > 0 && isAuthenticated && freeQuota.remaining <= 0
                      ? 'Você abriu suas patologias grátis. Libere o Manual inteiro de uma vez.'
                      : 'Tenha o Manual Clínico inteiro num clique — para sempre.'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {freeQuota?.mode === 'quantity' && freeQuota.limit > 0
                      ? isAuthenticated
                        ? `Você usou ${freeQuota.used} de ${freeQuota.limit} aberturas grátis. Pagamento único · acesso vitalício.`
                        : `Crie sua conta e ganhe ${freeQuota.limit} aberturas grátis — ou libere tudo já.`
                      : product.benefitText}
                  </p>
                </div>
              </div>
              <button
                onClick={() => isAuthenticated ? router.push('/manual-clinico/checkout') : router.push(`/auth/login?redirect=${encodeURIComponent('/manual-clinico/checkout')}`)}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-emerald-300 px-5 text-sm font-black text-emerald-950 shadow-lg shadow-amber-500/25 transition hover:brightness-105 hover:shadow-amber-500/35 active:scale-[0.97] ring-1 ring-amber-200/40"
              >
                {hasActiveTier
                  ? <span className="text-emerald-950/55 line-through font-bold">{formatBRL(product.currentPrice)}</span>
                  : product.hasActivePromotion
                  ? <span className="text-emerald-950/55 line-through font-bold">{formatBRL(product.price)}</span>
                  : null
                }
                {buttonPrice <= 0 ? 'Liberar acesso' : `Quero tudo por ${formatBRL(buttonPrice)}`}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════ SISTEMAS GRID ══════════ */}
        {!busca && areasAtivas.length === 0 && !sistemaAtivo && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-primary/10">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sistemas Fisiológicos</h2>
                <p className="text-xs text-muted-foreground">Selecione um sistema para filtrar as patologias</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {SISTEMAS_FISIOLOGICOS.map((sistema, idx) => {
                const Icon = SISTEMA_ICONS[sistema] || Stethoscope
                return (
                  <button
                    key={sistema}
                    onClick={() => selectSistema(sistema)}
                    className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-300 overflow-hidden
                      bg-white/[0.03] dark:bg-white/[0.02] border-white/[0.08]
                      hover:border-white/[0.15] hover:bg-white/[0.06] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                      hover:scale-[1.02] active:scale-[0.98]`}
                    aria-label={`Ver patologias do ${sistema}`}
                  >
                    {/* Subtle gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${SISTEMA_COLORS[idx % SISTEMA_COLORS.length]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                    {/* Glass icon container */}
                    <div className="relative z-10 p-2.5 rounded-xl bg-white/[0.06] dark:bg-white/[0.04] border border-white/[0.08] group-hover:border-white/[0.15] group-hover:bg-white/[0.1] backdrop-blur-sm transition-all duration-300">
                      <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    <span className="relative z-10 text-[11px] font-medium leading-tight text-center text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
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
        {loading ? (
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
            <div className="grid gap-2.5">
              {patologias.map((patologia, idx) => (
                <div
                  key={patologia._id}
                  onClick={() => {
                    router.push(`/manual-clinico/${patologia.slug}`)
                  }}
                  className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] dark:bg-white/[0.015]
                    hover:bg-white/[0.05] hover:border-white/[0.12] hover:shadow-[0_4px_24px_rgba(0,0,0,0.1)]
                    backdrop-blur-sm transition-all duration-300 cursor-pointer overflow-hidden ${
                      patologia.isPremiumLocked ? 'border-amber-300/15 bg-amber-400/[0.025]' : ''
                    }`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Hover gradient accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-2xl" />

                  <div className="p-4 sm:p-5 pl-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors duration-300">
                            {patologia.nome}
                          </h3>
                          {patologia.cid10 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white/[0.06] border border-white/[0.1] text-muted-foreground">
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
                              Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary">
                              Premium liberado
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
                      <div className="flex-shrink-0 mt-2 p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-primary/10 transition-colors duration-300">
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
                        <span>Você atingiu o limite grátis. Libere o Manual inteiro — pagamento único.</span>
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
                  className="rounded-xl backdrop-blur-sm bg-white/[0.03] border-white/[0.1]"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <div className="px-4 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{page}</span> de <span className="font-medium text-foreground">{totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-xl backdrop-blur-sm bg-white/[0.03] border-white/[0.1]"
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
