'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, BookOpen, Check, ChevronLeft, Clock, Crown, Flame, Loader2, Lock, Mail, Percent, Phone, ShieldCheck, Sparkles, User, X } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import { usePricingEventState, usePricingEventStates } from '@/components/pricing-events/usePricingEventState'
import { PublicPageShell } from '@/components/public-page-shell'
import Link from 'next/link'

interface AppliedCoupon {
  couponId: string
  code: string
  label: string
  amountBeforeCoupon: number
  eligibleAmount: number
  discountAmount: number
  amountAfterCoupon: number
}

function formatBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: 'hsl(var(--primary))',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: 'hsl(var(--background))',
  border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '10px',
  padding: '12px 14px', fontSize: '14px', outline: 'none',
}

interface Product {
  productType: string
  productTypeLabel: string
  productId: string
  productTitle: string
  amount: number
  description: string
}

function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
function digits(v: string) { return v.replace(/\D/g, '') }

const SECURITY_BADGES = [
  { src: '/img/badges/ssl-secure.png', alt: 'Conexão segura (SSL)', height: 28 },
  { src: '/img/badges/site-protegido.png', alt: 'Ambiente protegido', height: 28 },
  { src: '/img/badges/mercado-pago.png', alt: 'Pagamento processado por Mercado Pago', height: 22 },
]

/** Selos visuais de confiança exibidos no checkout (aumentam a confiabilidade da compra). */
function SecurityBadges({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {SECURITY_BADGES.map((badge) => (
        <span
          key={badge.src}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-3"
        >
          <img src={badge.src} alt={badge.alt} title={badge.alt} style={{ height: badge.height }} className="w-auto object-contain" />
        </span>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Manual Clinico — mesmo visual e seletor de planos do /manual-clinico/checkout,
// adaptado para compra sem login (nome/e-mail/telefone + Serial Key por e-mail).
// ─────────────────────────────────────────────────────────────────────────

const MANUAL_CLINICO_PRODUCT_ID = 'manual-clinico-premium'

type PlanKey = 'semestral' | 'anual' | 'vitalicio'

interface ProductPlan {
  key: PlanKey
  label: string
  durationMonths: number | null
  price: number
  enabled: boolean
  pricingEventId: string | null
  defaultCouponCode: string | null
}

interface ManualClinicoProductInfo {
  productId: string
  label: string
  benefitText: string
  shortDescription: string
  ctaText: string
  coverImageUrl?: string
  isActive: boolean
  price: number
  currentPrice: number
  promotionalPrice: number | null
  promotionEndsAt: string | null
  hasActivePromotion: boolean
  allowCoupons: boolean
  lifetimeAccess: boolean
  plans?: ProductPlan[]
  pricingEventId?: string | null
}

function ManualClinicoCouponBox({
  product,
  email,
  appliedCoupon,
  onApplied,
  onRemoved,
}: {
  product: ManualClinicoProductInfo
  email: string
  appliedCoupon: AppliedCoupon | null
  onApplied: (coupon: AppliedCoupon) => void
  onRemoved: () => void
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function applyCoupon() {
    const normalized = code.trim()
    if (!normalized) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: normalized,
          itemType: 'manual_clinico',
          itemId: MANUAL_CLINICO_PRODUCT_ID,
          buyerEmail: email.trim().toLowerCase() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cupom invalido')
      setCode(data.code || normalized.toUpperCase())
      onApplied(data)
    } catch (err: any) {
      setError(err?.message || 'Erro ao aplicar cupom')
    } finally {
      setLoading(false)
    }
  }

  if (!product.allowCoupons) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Cupons nao estao habilitados para este produto.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
        <Percent className="h-4 w-4 text-primary" />
        Cupom de desconto
      </div>

      {appliedCoupon ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-primary">{appliedCoupon.code} aplicado</p>
              <p className="text-xs text-muted-foreground">
                {formatBRL(appliedCoupon.discountAmount)} de desconto
              </p>
            </div>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-black text-primary">
              {appliedCoupon.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCode('')
              setError('')
              onRemoved()
            }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 text-sm font-bold text-destructive transition hover:bg-destructive/15"
          >
            <X className="h-4 w-4" />
            Remover cupom
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase())
                setError('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyCoupon()
              }}
              disabled={loading || product.currentPrice <= 0}
              className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm font-bold uppercase text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
              placeholder="Digite seu cupom"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={loading || !code.trim() || product.currentPrice <= 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-black text-secondary-foreground transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Aplicar
            </button>
          </div>
          {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
        </div>
      )}
    </div>
  )
}

function ManualClinicoComprarContent({ planKeyParam }: { planKeyParam: PlanKey | null }) {
  const [product, setProduct] = useState<ManualClinicoProductInfo | null>(null)
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey>(planKeyParam || 'vitalicio')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'buyer' | 'payment'>('buyer')
  const [touched, setTouched] = useState(false)

  const enabledPlans = useMemo<ProductPlan[]>(
    () => (product?.plans || []).filter(p => p.enabled),
    [product]
  )
  const selectedPlan = useMemo<ProductPlan | null>(
    () => enabledPlans.find(p => p.key === selectedPlanKey) || enabledPlans[0] || null,
    [enabledPlans, selectedPlanKey]
  )

  useEffect(() => {
    if (enabledPlans.length === 0) return
    if (!enabledPlans.some(p => p.key === selectedPlanKey)) {
      setSelectedPlanKey(enabledPlans[0].key)
    }
  }, [enabledPlans, selectedPlanKey])

  const pricingEventStateData = usePricingEventState(selectedPlan?.pricingEventId || product?.pricingEventId || null)
  const pricingEventState = pricingEventStateData.state

  const planEventIds = useMemo(
    () => enabledPlans.map((p) => p.pricingEventId || product?.pricingEventId || null),
    [enabledPlans, product]
  )
  const planEventStates = usePricingEventStates(planEventIds)

  function getPlanPricing(plan: ProductPlan) {
    const evId = plan.pricingEventId || product?.pricingEventId || null
    const st = evId ? planEventStates.get(evId) : null
    const pct = st?.activeTier && st.isActive !== false ? (st.activeTier.discountPercent || 0) : 0
    const hasDiscount = pct > 0 && plan.price > 0
    const final = hasDiscount
      ? Math.max(0, Math.round(plan.price * (1 - pct / 100) * 100) / 100)
      : plan.price
    return { pct, hasDiscount, final, original: plan.price }
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/manual-clinico/product', { cache: 'no-store' }).then((res) => res.json()),
      fetch('/api/payments/public-key').then((res) => res.json()),
    ])
      .then(([productResp, keyResp]) => {
        if (productResp?.error) throw new Error(productResp.error)
        setProduct(productResp.product)
        setPublicKey(keyResp.publicKey || '')
      })
      .catch((err: any) => setError(err?.message || 'Erro ao carregar checkout'))
      .finally(() => setLoading(false))
  }, [])

  const nameValid = name.trim().includes(' ') && name.trim().length >= 3
  const emailValid = isEmail(email.trim())
  const phoneValid = digits(phone).length >= 10 && digits(phone).length <= 15
  const buyerValid = nameValid && emailValid && phoneValid

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-6 py-7 text-center text-sm text-destructive">
          {error || 'Produto indisponível.'}
        </div>
      </div>
    )
  }

  const baseAmount = Number(selectedPlan?.price ?? product.currentPrice ?? 0)
  const tierPct = pricingEventState?.activeTier?.discountPercent || 0
  const hasActiveTier = !!pricingEventState?.activeTier && pricingEventState?.isActive !== false && tierPct > 0 && baseAmount > 0
  const tierDiscountAmount = hasActiveTier
    ? Math.max(0, Math.round(baseAmount * (tierPct / 100) * 100) / 100)
    : 0
  const couponDiscountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0
  const effectiveDiscount = Math.max(tierDiscountAmount, couponDiscountAmount)
  const tierBeatsCoupon = hasActiveTier && tierDiscountAmount >= couponDiscountAmount
  const payableAmount = Math.max(0, Math.round((baseAmount - effectiveDiscount) * 100) / 100)

  const lifetimePlan = enabledPlans.find((p) => p.key === 'vitalicio') || null
  const longestTemporary = enabledPlans
    .filter((p) => p.durationMonths && p.durationMonths > 0)
    .sort((a, b) => (b.durationMonths || 0) - (a.durationMonths || 0))[0] || null
  const lifetimeBreakEven = lifetimePlan && longestTemporary && longestTemporary.price > 0
    ? Math.max(2, Math.ceil(lifetimePlan.price / longestTemporary.price))
    : null
  const selectedIsLifetime = selectedPlan?.key === 'vitalicio'

  const extraBody = {
    productType: 'manual_clinico',
    planKey: selectedPlanKey,
    buyerName: name.trim(),
    buyerEmail: email.trim().toLowerCase(),
    buyerPhone: phone.trim(),
    couponCode: appliedCoupon?.code,
  }

  return (
    <div className="mx-auto max-w-6xl text-foreground">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="relative mb-5 overflow-hidden rounded-lg border border-border">
            {product.coverImageUrl ? (
              <img src={product.coverImageUrl} alt="" className="h-48 w-full object-cover" />
            ) : (
              <div className="h-48 bg-primary/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs font-black uppercase tracking-wide shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
              Produto avulso
            </div>
          </div>

          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{product.label}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.shortDescription}</p>
            </div>
          </div>

          {enabledPlans.length > 1 && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3.5 dark:border-amber-300/25 dark:bg-amber-300/10">
              <Crown className="mt-0.5 h-4 w-4 flex-none text-amber-600 dark:text-amber-300" />
              <p className="text-xs font-semibold leading-snug text-amber-900 dark:text-amber-100/90">
                Boas notícias: dá pra ter o Manual <span className="font-black">para sempre</span> por um valor único.
                Compare as opções abaixo — o melhor custo costuma ser o que você nunca precisa renovar.
              </p>
            </div>
          )}

          {enabledPlans.length > 0 && (
            <div className="mb-5">
              <div className="mb-3">
                <p className="text-base font-bold text-foreground">Escolha como quer seu acesso</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Todos liberam o Manual completo — a diferença é só por quanto tempo.
                </p>
              </div>
              <div className="grid gap-2.5">
                {enabledPlans.map((plan) => {
                  const isActive = plan.key === selectedPlanKey
                  const isLifetime = plan.key === 'vitalicio'
                  const pricing = getPlanPricing(plan)
                  const perMonth = plan.durationMonths && plan.durationMonths > 0
                    ? pricing.final / plan.durationMonths
                    : null
                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => setSelectedPlanKey(plan.key)}
                      className={`relative flex items-center justify-between gap-3 rounded-lg border p-4 text-left transition ${
                        isActive
                          ? isLifetime
                            ? 'border-amber-500/50 bg-amber-500/10 shadow-sm dark:border-amber-300/50'
                            : 'border-primary/50 bg-primary/10 shadow-sm'
                          : isLifetime
                            ? 'border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10 dark:border-amber-300/30'
                            : 'border-border bg-background hover:bg-muted/50'
                      }`}
                    >
                      {isLifetime && (
                        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950 shadow-sm">
                          <Crown className="h-3 w-3" /> Melhor escolha · pra sempre
                        </span>
                      )}
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 transition ${isActive ? 'border-primary bg-primary' : 'border-border'}`}>
                          {isActive && <Check className="h-3 w-3 text-primary-foreground" />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-bold">{plan.label}</span>
                            {isLifetime ? <Crown className="h-4 w-4 text-amber-600 dark:text-amber-300" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {isLifetime
                              ? 'Pague uma vez e use para sempre — sem renovação'
                              : `${plan.durationMonths} ${plan.durationMonths === 1 ? 'mês' : 'meses'} de acesso completo`}
                          </p>
                        </div>
                      </div>
                      <div className="flex-none text-right">
                        {pricing.hasDiscount && (
                          <p className="text-[11px] font-semibold text-muted-foreground line-through">{formatBRL(pricing.original)}</p>
                        )}
                        <p className={`text-xl font-black tabular-nums ${isLifetime ? 'text-amber-700 dark:text-amber-200' : 'text-primary'}`}>{formatBRL(pricing.final)}</p>
                        {pricing.hasDiscount && (
                          <p className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary">
                            <Flame className="h-2.5 w-2.5" /> −{Math.round(pricing.pct)}% no lote
                          </p>
                        )}
                        {perMonth
                          ? <p className="text-[10px] text-muted-foreground">≈ {formatBRL(perMonth)}/mês</p>
                          : <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300/80">pagamento único</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
              {lifetimeBreakEven && (
                <p className="mt-2.5 flex items-start gap-1.5 text-[11px] font-semibold leading-snug text-amber-800 dark:text-amber-200/90">
                  <Sparkles className="mt-px h-3.5 w-3.5 flex-none" />
                  Com o Vitalício você nunca mais paga: em cerca de {lifetimeBreakEven} renovações do {longestTemporary?.label} ele já se paga — e segue seu para sempre.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2 text-sm text-muted-foreground">
            {[
              product.benefitText,
              'Diagnostico, tratamento, diferenciais, farmacologia e fluxogramas',
              selectedPlan?.durationMonths
                ? `Acesso por ${selectedPlan.durationMonths} ${selectedPlan.durationMonths === 1 ? 'mês' : 'meses'} apos pagamento aprovado`
                : 'Acesso vitalicio liberado apos pagamento aprovado',
              'Serial Key enviada por e-mail — não precisa criar conta agora',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                <Check className="h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total</p>
            {product.hasActivePromotion && (
              <p className="mt-1 text-sm font-bold text-muted-foreground line-through">{formatBRL(product.price)}</p>
            )}
            {hasActiveTier && baseAmount > payableAmount && (
              <p className="mt-1 text-sm font-bold text-muted-foreground line-through">{formatBRL(baseAmount)}</p>
            )}
            <p className={`font-heading text-4xl font-semibold tabular-nums ${selectedIsLifetime ? 'text-amber-700 dark:text-amber-200' : 'text-primary'}`}>
              {formatBRL(payableAmount)}
            </p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              {selectedIsLifetime
                ? 'Pagamento único · acesso para sempre, sem mensalidade'
                : selectedPlan?.durationMonths
                  ? `${selectedPlan.label} · ${selectedPlan.durationMonths} ${selectedPlan.durationMonths === 1 ? 'mês' : 'meses'} de acesso`
                  : 'Acesso completo liberado na hora'}
            </p>
            {hasActiveTier && tierBeatsCoupon && tierDiscountAmount > 0 ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary">
                <Flame className="h-3 w-3" />
                Lote {pricingEventState?.activeTier?.label || ''}: − {formatBRL(tierDiscountAmount)} ({Math.round(tierPct)}% OFF)
              </p>
            ) : null}
            {appliedCoupon && !tierBeatsCoupon ? (
              <p className="mt-1 text-xs font-bold text-primary">
                Cupom {appliedCoupon.code}: - {formatBRL(appliedCoupon.discountAmount)}
              </p>
            ) : null}
            {appliedCoupon && tierBeatsCoupon && tierDiscountAmount > 0 ? (
              <p className="mt-1 text-[10px] font-medium text-primary/80">
                Cupom {appliedCoupon.code} mantido — o desconto do lote já é maior.
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Pagamento 100% seguro · Mercado Pago
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Serial Key enviada por e-mail com QR e comprovante
            </div>
          </div>
          <SecurityBadges className="mt-3" />
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          {!product.isActive ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Lock className="mb-4 h-10 w-10 text-muted-foreground" />
              <h2 className="text-xl font-bold">Produto indisponivel</h2>
              <p className="mt-2 text-sm text-muted-foreground">A compra do Manual Clinico Premium esta pausada no momento.</p>
            </div>
          ) : step === 'buyer' ? (
            <div className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}><User size={12} style={{ display: 'inline', marginRight: 4 }} /> Nome completo</label>
                <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="Seu nome completo" style={inputStyle} />
                {touched && !nameValid && <span className="text-[11px] text-destructive">Informe nome e sobrenome.</span>}
              </div>
              <div>
                <label style={labelStyle}><Mail size={12} style={{ display: 'inline', marginRight: 4 }} /> E-mail</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} type="email" placeholder="seu@email.com" style={inputStyle} />
                {touched && !emailValid && <span className="text-[11px] text-destructive">E-mail inválido.</span>}
              </div>
              <div>
                <label style={labelStyle}><Phone size={12} style={{ display: 'inline', marginRight: 4 }} /> Telefone (com DDD)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)} placeholder="(00) 00000-0000" style={inputStyle} />
                {touched && !phoneValid && <span className="text-[11px] text-destructive">Telefone inválido.</span>}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Usamos esses dados para vincular sua compra, gerar sua Serial Key e enviar o comprovante. Não é necessário criar conta agora.
              </p>
              <button
                onClick={() => { setTouched(true); if (buyerValid) setStep('payment') }}
                disabled={!buyerValid}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-sm font-bold text-secondary-foreground shadow-sm transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ir para pagamento <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setStep('buyer')}
                className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Editar meus dados
              </button>
              <div className="rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-xs text-muted-foreground">
                Comprando como <strong className="text-foreground">{name}</strong> · {email} · {phone}
              </div>

              <ManualClinicoCouponBox
                product={product}
                email={email}
                appliedCoupon={appliedCoupon}
                onApplied={setAppliedCoupon}
                onRemoved={() => setAppliedCoupon(null)}
              />

              <MercadoPagoCheckout
                key={`comprar-manual-${selectedPlanKey}-${payableAmount}-${appliedCoupon?.code || 'sem-cupom'}`}
                publicKey={publicKey}
                amount={payableAmount}
                description={`${product.label} — ${selectedPlan?.label || 'Plano'}`}
                endpoint="/api/serial-keys/checkout"
                extraBody={extraBody}
                payerEmailHint={email}
                payerNameHint={name}
                analytics={{
                  productId: MANUAL_CLINICO_PRODUCT_ID,
                  productTitle: product.label,
                  productType: 'product',
                  source: 'Manual Clinico (sem login)',
                }}
                onApproved={(resp) => { window.location.href = (resp as any).successRedirect || '/compra/aprovada' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Fluxo genérico (material, pacote, flashcard, assinatura) — inalterado.
// ─────────────────────────────────────────────────────────────────────────

function GenericComprarContent({ productType }: { productType: string }) {
  const params = useSearchParams()
  const productId = params.get('productId') || ''
  const planKey = params.get('planKey') || ''
  const itemType = params.get('itemType') || ''

  const [product, setProduct] = useState<Product | null>(null)
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'buyer' | 'payment'>('buyer')
  const [touched, setTouched] = useState(false)

  // Cupom (compra sem login). Só é elegível para material/pacote/flashcard.
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const couponEligible = productType === 'material' || productType === 'package' || productType === 'flashcard'
  const couponItemType = productType === 'package' ? 'package' : 'material'

  useEffect(() => {
    if (!productType) { setError('Produto não informado.'); setLoading(false); return }
    const qs = new URLSearchParams({ productType })
    if (productId) qs.set('productId', productId)
    if (planKey) qs.set('planKey', planKey)
    if (itemType) qs.set('itemType', itemType)
    Promise.all([
      fetch(`/api/serial-keys/checkout?${qs.toString()}`).then(r => r.json()),
      fetch('/api/payments/public-key').then(r => r.json()),
    ])
      .then(([prod, pk]) => {
        if (prod.error) { setError(prod.error); return }
        setProduct(prod)
        setPublicKey(pk.publicKey || '')
      })
      .catch(() => setError('Falha ao carregar o produto.'))
      .finally(() => setLoading(false))
  }, [productType, productId, planKey, itemType])

  const nameValid = name.trim().includes(' ') && name.trim().length >= 3
  const emailValid = isEmail(email.trim())
  const phoneValid = digits(phone).length >= 10 && digits(phone).length <= 15
  const buyerValid = nameValid && emailValid && phoneValid

  const payableAmount = appliedCoupon ? appliedCoupon.amountAfterCoupon : (product?.amount ?? 0)

  const extraBody = useMemo(() => ({
    productType, productId: productId || undefined, planKey: planKey || undefined,
    itemType: itemType || undefined,
    buyerName: name.trim(), buyerEmail: email.trim().toLowerCase(), buyerPhone: phone.trim(),
    couponCode: appliedCoupon?.code,
  }), [productType, productId, planKey, itemType, name, email, phone, appliedCoupon])

  const applyCoupon = async () => {
    const normalized = couponCode.trim()
    if (!normalized || !product) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: normalized,
          itemType: couponItemType,
          itemId: product.productId,
          buyerEmail: email.trim().toLowerCase() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cupom inválido')
      setAppliedCoupon(data)
      setCouponCode(data.code || normalized.toUpperCase())
    } catch (err: any) {
      setCouponError(err?.message || 'Erro ao aplicar cupom')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Loader2 size={32} style={{ color: 'hsl(var(--primary))', animation: 'spin 1s linear infinite' }} /></div>
  }
  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-6 py-7 text-center text-sm text-destructive">
          {error || 'Produto indisponível.'}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <p className="editorial-mark mb-2">Compra sem login</p>
      <h1 className="mb-1.5 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Finalizar compra
      </h1>
      <p className="mb-7 text-sm text-muted-foreground">
        Compra rápida e segura — você recebe sua <strong className="font-semibold text-primary">Serial Key</strong> por e-mail, mesmo sem ter conta.
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <span className="mb-3 inline-flex rounded-md bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
              {product.productTypeLabel}
            </span>
            <h2 className="mb-4 font-heading text-xl font-semibold tracking-tight text-foreground">
              {product.productTitle}
            </h2>
            <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
              <p className="mb-0.5 text-xs text-muted-foreground">Valor</p>
              {appliedCoupon && (
                <p className="mb-0.5 text-sm text-muted-foreground line-through">
                  {formatBRL(product.amount)}
                </p>
              )}
              <p className="font-heading text-3xl font-semibold tabular-nums tracking-tight text-primary">
                {formatBRL(payableAmount)}
              </p>
              {appliedCoupon && (
                <p className="mt-1 text-xs font-bold text-primary">
                  Cupom {appliedCoupon.code}: − {formatBRL(appliedCoupon.discountAmount)}
                </p>
              )}
            </div>

            {couponEligible && (
              <div className="mt-3.5 rounded-lg border border-border bg-background p-3.5">
                <div className="mb-2.5 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Percent className="h-4 w-4 text-primary" /> Cupom de desconto
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-primary">{appliedCoupon.code} aplicado</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBRL(appliedCoupon.discountAmount)} de desconto
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/25 bg-destructive/10 px-2.5 py-1.5 text-xs font-extrabold text-destructive"
                    >
                      <X className="h-3.5 w-3.5" /> Remover
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                        onKeyDown={(e) => { if (e.key === 'Enter') applyCoupon() }}
                        disabled={couponLoading}
                        placeholder="Digite seu cupom"
                        className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm uppercase text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-secondary px-3.5 text-xs font-black text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {couponLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Aplicar
                      </button>
                    </div>
                    {couponError ? <p className="mt-2 text-xs text-destructive">{couponError}</p> : null}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground shadow-sm">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Pagamento 100% seguro · Mercado Pago
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-primary" /> Serial Key enviada por e-mail com QR e comprovante
            </div>
            <SecurityBadges className="mt-1" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          {step === 'buyer' ? (
            <div className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}><User size={12} style={{ display: 'inline', marginRight: 4 }} /> Nome completo</label>
                <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="Seu nome completo" style={inputStyle} />
                {touched && !nameValid && <span className="text-[11px] text-destructive">Informe nome e sobrenome.</span>}
              </div>
              <div>
                <label style={labelStyle}><Mail size={12} style={{ display: 'inline', marginRight: 4 }} /> E-mail</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} type="email" placeholder="seu@email.com" style={inputStyle} />
                {touched && !emailValid && <span className="text-[11px] text-destructive">E-mail inválido.</span>}
              </div>
              <div>
                <label style={labelStyle}><Phone size={12} style={{ display: 'inline', marginRight: 4 }} /> Telefone (com DDD)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)} placeholder="(00) 00000-0000" style={inputStyle} />
                {touched && !phoneValid && <span className="text-[11px] text-destructive">Telefone inválido.</span>}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Usamos esses dados para vincular sua compra, gerar sua Serial Key e enviar o comprovante. Não é necessário criar conta agora.
              </p>
              <button
                type="button"
                onClick={() => { setTouched(true); if (buyerValid) setStep('payment') }}
                disabled={!buyerValid}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-[15px] font-bold text-secondary-foreground shadow-sm transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ir para pagamento <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setStep('buyer')}
                className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Editar meus dados
              </button>
              <div className="mb-4 rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-xs text-muted-foreground">
                Comprando como <strong className="text-foreground">{name}</strong> · {email} · {phone}
              </div>
              <MercadoPagoCheckout
                key={`comprar-${payableAmount}-${appliedCoupon?.code || 'sem-cupom'}`}
                publicKey={publicKey}
                amount={payableAmount}
                description={product.productTitle}
                endpoint="/api/serial-keys/checkout"
                extraBody={extraBody}
                payerEmailHint={email}
                payerNameHint={name}
                analytics={{ productId: product.productId, productTitle: product.productTitle, productType: 'product', source: 'Serial Key' }}
                onApproved={(resp) => { window.location.href = (resp as any).successRedirect || '/compra/aprovada' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ComprarContent() {
  const params = useSearchParams()
  const productType = params.get('productType') || ''

  if (productType === 'manual_clinico') {
    const planKey = params.get('planKey') as PlanKey | null
    return <ManualClinicoComprarContent planKeyParam={planKey} />
  }

  return <GenericComprarContent productType={productType} />
}

export default function ComprarPage() {
  return (
    <PublicPageShell maxWidth="max-w-6xl" contentClassName="py-6 sm:py-8">
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <ComprarContent />
      </Suspense>
    </PublicPageShell>
  )
}
