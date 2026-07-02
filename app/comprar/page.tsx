'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, BookOpen, Check, ChevronLeft, Clock, Crown, Flame, Loader2, Lock, Mail, Percent, Phone, ShieldCheck, Sparkles, User, X } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import { usePricingEventState, usePricingEventStates } from '@/components/pricing-events/usePricingEventState'

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

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #020d06 0%, #031a0b 40%, #041408 100%)',
  padding: '28px 16px',
}
const glassCard: React.CSSProperties = {
  background: 'rgba(6,20,10,0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '20px',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(52,211,153,0.8)',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(52,211,153,0.2)', color: 'white', borderRadius: '10px',
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
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">
        Cupons nao estao habilitados para este produto.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white/75">
        <Percent className="h-4 w-4 text-emerald-300" />
        Cupom de desconto
      </div>

      {appliedCoupon ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-emerald-300">{appliedCoupon.code} aplicado</p>
              <p className="text-xs text-white/50">
                {formatBRL(appliedCoupon.discountAmount)} de desconto
              </p>
            </div>
            <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-200">
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
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-300/20 bg-red-400/10 text-sm font-bold text-red-200 transition hover:bg-red-400/15"
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
              className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold uppercase text-white outline-none transition focus:border-emerald-300/50"
              placeholder="Digite seu cupom"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={loading || !code.trim() || product.currentPrice <= 0}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Aplicar
            </button>
          </div>
          {error ? <p className="text-xs font-semibold text-red-300">{error}</p> : null}
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
      <div className="flex min-h-[60vh] items-center justify-center text-emerald-200">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ ...glassCard, padding: '28px', color: '#f87171', textAlign: 'center' }}>
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
    <div className="mx-auto max-w-6xl text-white">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-7">
          <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/10">
            {product.coverImageUrl ? (
              <img src={product.coverImageUrl} alt="" className="h-48 w-full object-cover opacity-80" />
            ) : (
              <div className="h-48 bg-emerald-400/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#031109] via-[#031109]/15 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs font-black uppercase tracking-wide backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-amber-200" />
              Produto avulso
            </div>
          </div>

          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-300/15 p-3 text-emerald-200">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{product.label}</h1>
              <p className="mt-2 text-sm leading-relaxed text-white/58">{product.shortDescription}</p>
            </div>
          </div>

          {enabledPlans.length > 1 && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-300/25 bg-gradient-to-r from-amber-300/12 to-emerald-300/[0.06] p-3.5">
              <Crown className="mt-0.5 h-4 w-4 flex-none text-amber-300" />
              <p className="text-xs font-semibold leading-snug text-amber-100/90">
                Boas notícias: dá pra ter o Manual <span className="font-black text-amber-200">para sempre</span> por um valor único.
                Compare as opções abaixo — o melhor custo costuma ser o que você nunca precisa renovar.
              </p>
            </div>
          )}

          {enabledPlans.length > 0 && (
            <div className="mb-5">
              <div className="mb-3">
                <p className="text-base font-black text-white">Escolha como quer seu acesso</p>
                <p className="mt-0.5 text-xs text-white/55">
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
                      className={`relative flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                        isActive
                          ? isLifetime
                            ? 'border-amber-300/60 bg-gradient-to-r from-amber-300/15 to-emerald-300/[0.07] shadow-lg shadow-amber-300/15'
                            : 'border-emerald-300/50 bg-emerald-300/10 shadow-lg shadow-emerald-300/10'
                          : isLifetime
                            ? 'border-amber-300/30 bg-amber-300/[0.05] hover:bg-amber-300/[0.09]'
                            : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                      }`}
                    >
                      {isLifetime && (
                        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950 shadow-md shadow-amber-400/30">
                          <Crown className="h-3 w-3" /> Melhor escolha · pra sempre
                        </span>
                      )}
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 transition ${isActive ? 'border-emerald-300 bg-emerald-300' : 'border-white/25'}`}>
                          {isActive && <Check className="h-3 w-3 text-emerald-950" />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-black">{plan.label}</span>
                            {isLifetime ? <Crown className="h-4 w-4 text-amber-300" /> : <Clock className="h-3.5 w-3.5 text-white/45" />}
                          </div>
                          <p className="mt-0.5 text-xs text-white/55">
                            {isLifetime
                              ? 'Pague uma vez e use para sempre — sem renovação'
                              : `${plan.durationMonths} ${plan.durationMonths === 1 ? 'mês' : 'meses'} de acesso completo`}
                          </p>
                        </div>
                      </div>
                      <div className="flex-none text-right">
                        {pricing.hasDiscount && (
                          <p className="text-[11px] font-semibold text-white/40 line-through">{formatBRL(pricing.original)}</p>
                        )}
                        <p className={`text-xl font-black ${isLifetime ? 'text-amber-200' : 'text-emerald-200'}`}>{formatBRL(pricing.final)}</p>
                        {pricing.hasDiscount && (
                          <p className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-300">
                            <Flame className="h-2.5 w-2.5" /> −{Math.round(pricing.pct)}% no lote
                          </p>
                        )}
                        {perMonth
                          ? <p className="text-[10px] text-white/45">≈ {formatBRL(perMonth)}/mês</p>
                          : <p className="text-[10px] font-bold text-amber-300/80">pagamento único</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
              {lifetimeBreakEven && (
                <p className="mt-2.5 flex items-start gap-1.5 text-[11px] font-semibold leading-snug text-amber-200/90">
                  <Sparkles className="mt-px h-3.5 w-3.5 flex-none" />
                  Com o Vitalício você nunca mais paga: em cerca de {lifetimeBreakEven} renovações do {longestTemporary?.label} ele já se paga — e segue seu para sempre.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2 text-sm text-white/70">
            {[
              product.benefitText,
              'Diagnostico, tratamento, diferenciais, farmacologia e fluxogramas',
              selectedPlan?.durationMonths
                ? `Acesso por ${selectedPlan.durationMonths} ${selectedPlan.durationMonths === 1 ? 'mês' : 'meses'} apos pagamento aprovado`
                : 'Acesso vitalicio liberado apos pagamento aprovado',
              'Serial Key enviada por e-mail — não precisa criar conta agora',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                <Check className="h-4 w-4 text-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-white/45">Total</p>
            {product.hasActivePromotion && (
              <p className="mt-1 text-sm font-bold text-white/40 line-through">{formatBRL(product.price)}</p>
            )}
            {hasActiveTier && baseAmount > payableAmount && (
              <p className="mt-1 text-sm font-bold text-white/40 line-through">{formatBRL(baseAmount)}</p>
            )}
            <p className={`text-4xl font-black ${selectedIsLifetime ? 'text-amber-200' : 'text-emerald-200'}`}>
              {formatBRL(payableAmount)}
            </p>
            <p className="mt-1 text-xs font-bold text-white/60">
              {selectedIsLifetime
                ? 'Pagamento único · acesso para sempre, sem mensalidade'
                : selectedPlan?.durationMonths
                  ? `${selectedPlan.label} · ${selectedPlan.durationMonths} ${selectedPlan.durationMonths === 1 ? 'mês' : 'meses'} de acesso`
                  : 'Acesso completo liberado na hora'}
            </p>
            {hasActiveTier && tierBeatsCoupon && tierDiscountAmount > 0 ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-200">
                <Flame className="h-3 w-3" />
                Lote {pricingEventState?.activeTier?.label || ''}: − {formatBRL(tierDiscountAmount)} ({Math.round(tierPct)}% OFF)
              </p>
            ) : null}
            {appliedCoupon && !tierBeatsCoupon ? (
              <p className="mt-1 text-xs font-bold text-emerald-200">
                Cupom {appliedCoupon.code}: - {formatBRL(appliedCoupon.discountAmount)}
              </p>
            ) : null}
            {appliedCoupon && tierBeatsCoupon && tierDiscountAmount > 0 ? (
              <p className="mt-1 text-[10px] font-medium text-emerald-200/70">
                Cupom {appliedCoupon.code} mantido — o desconto do lote já é maior.
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-2 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" /> Pagamento 100% seguro · Mercado Pago
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-300" /> Serial Key enviada por e-mail com QR e comprovante
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-7">
          {!product.isActive ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Lock className="mb-4 h-10 w-10 text-white/35" />
              <h2 className="text-xl font-black">Produto indisponivel</h2>
              <p className="mt-2 text-sm text-white/55">A compra do Manual Clinico Premium esta pausada no momento.</p>
            </div>
          ) : step === 'buyer' ? (
            <div className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}><User size={12} style={{ display: 'inline', marginRight: 4 }} /> Nome completo</label>
                <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="Seu nome completo" style={inputStyle} />
                {touched && !nameValid && <span style={{ fontSize: '11px', color: '#f87171' }}>Informe nome e sobrenome.</span>}
              </div>
              <div>
                <label style={labelStyle}><Mail size={12} style={{ display: 'inline', marginRight: 4 }} /> E-mail</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} type="email" placeholder="seu@email.com" style={inputStyle} />
                {touched && !emailValid && <span style={{ fontSize: '11px', color: '#f87171' }}>E-mail inválido.</span>}
              </div>
              <div>
                <label style={labelStyle}><Phone size={12} style={{ display: 'inline', marginRight: 4 }} /> Telefone (com DDD)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)} placeholder="(00) 00000-0000" style={inputStyle} />
                {touched && !phoneValid && <span style={{ fontSize: '11px', color: '#f87171' }}>Telefone inválido.</span>}
              </div>
              <p className="text-xs leading-relaxed text-white/40">
                Usamos esses dados para vincular sua compra, gerar sua Serial Key e enviar o comprovante. Não é necessário criar conta agora.
              </p>
              <button
                onClick={() => { setTouched(true); if (buyerValid) setStep('payment') }}
                disabled={!buyerValid}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-300 text-sm font-black text-emerald-950 shadow-[0_0_30px_rgba(52,211,153,0.3)] transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ir para pagamento <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setStep('buyer')}
                className="inline-flex items-center gap-1 text-sm font-semibold text-white/50 transition hover:text-white/80"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Editar meus dados
              </button>
              <div className="rounded-xl bg-white/[0.03] px-3.5 py-3 text-xs text-white/55">
                Comprando como <strong className="text-white">{name}</strong> · {email} · {phone}
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
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Loader2 size={32} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} /></div>
  }
  if (error || !product) {
    return <div style={{ maxWidth: '520px', margin: '0 auto' }}><div style={{ ...glassCard, padding: '28px', color: '#f87171', textAlign: 'center' }}>{error || 'Produto indisponível.'}</div></div>
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginBottom: '6px', letterSpacing: '-0.02em' }}>Finalizar compra</h1>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px' }}>
        Compra rápida e segura — você recebe sua <strong style={{ color: '#34d399' }}>Serial Key</strong> por e-mail, mesmo sem ter conta.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '24px', alignItems: 'start' }} className="checkout-grid">
        {/* Resumo do produto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ ...glassCard, padding: '26px' }}>
            <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #059669, #34d399)', borderRadius: '10px', padding: '5px 12px', fontSize: '12px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
              {product.productTypeLabel}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '16px' }}>{product.productTitle}</h2>
            <div style={{ padding: '16px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: '12px' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Valor</p>
              {appliedCoupon && (
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', marginBottom: '2px' }}>
                  {formatBRL(product.amount)}
                </p>
              )}
              <p style={{ fontSize: '30px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em' }}>{formatBRL(payableAmount)}</p>
              {appliedCoupon && (
                <p style={{ fontSize: '12px', color: '#34d399', marginTop: '4px', fontWeight: 700 }}>
                  Cupom {appliedCoupon.code}: − {formatBRL(appliedCoupon.discountAmount)}
                </p>
              )}
            </div>

            {couponEligible && (
              <div style={{ marginTop: '14px', padding: '14px', borderRadius: '12px', border: '1px solid rgba(52,211,153,0.16)', background: 'rgba(255,255,255,0.035)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'rgba(255,255,255,0.72)', fontSize: '13px', fontWeight: 700 }}>
                  <Percent size={15} style={{ color: '#34d399' }} /> Cupom de desconto
                </div>
                {appliedCoupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, color: '#34d399', fontSize: '14px', fontWeight: 800 }}>{appliedCoupon.code} aplicado</p>
                      <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
                        {formatBRL(appliedCoupon.discountAmount)} de desconto
                      </p>
                    </div>
                    <button type="button" onClick={removeCoupon} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', border: '1px solid rgba(248,113,113,0.26)', background: 'rgba(248,113,113,0.08)', color: '#fca5a5', padding: '7px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 800 }}>
                      <X size={14} /> Remover
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                        onKeyDown={(e) => { if (e.key === 'Enter') applyCoupon() }}
                        disabled={couponLoading}
                        placeholder="Digite seu cupom"
                        style={{ flex: 1, minWidth: 0, height: '38px', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.16)', background: 'rgba(0,0,0,0.22)', color: 'white', padding: '0 12px', outline: 'none', textTransform: 'uppercase' }}
                      />
                      <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} style={{ height: '38px', borderRadius: '10px', border: 'none', background: '#34d399', color: '#04130a', fontSize: '12px', fontWeight: 900, padding: '0 14px', cursor: couponLoading || !couponCode.trim() ? 'not-allowed' : 'pointer', opacity: couponLoading || !couponCode.trim() ? 0.55 : 1, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {couponLoading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />} Aplicar
                      </button>
                    </div>
                    {couponError ? <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px' }}>{couponError}</p> : null}
                  </>
                )}
              </div>
            )}
          </div>
          <div style={{ ...glassCard, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <ShieldCheck size={16} style={{ color: '#34d399' }} /> Pagamento 100% seguro · Mercado Pago
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <Mail size={16} style={{ color: '#34d399' }} /> Serial Key enviada por e-mail com QR e comprovante
            </div>
          </div>
        </div>

        {/* Formulário / pagamento */}
        <div style={{ ...glassCard, padding: '28px' }}>
          {step === 'buyer' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}><User size={12} style={{ display: 'inline', marginRight: 4 }} /> Nome completo</label>
                <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="Seu nome completo" style={inputStyle} />
                {touched && !nameValid && <span style={{ fontSize: '11px', color: '#f87171' }}>Informe nome e sobrenome.</span>}
              </div>
              <div>
                <label style={labelStyle}><Mail size={12} style={{ display: 'inline', marginRight: 4 }} /> E-mail</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} type="email" placeholder="seu@email.com" style={inputStyle} />
                {touched && !emailValid && <span style={{ fontSize: '11px', color: '#f87171' }}>E-mail inválido.</span>}
              </div>
              <div>
                <label style={labelStyle}><Phone size={12} style={{ display: 'inline', marginRight: 4 }} /> Telefone (com DDD)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)} placeholder="(00) 00000-0000" style={inputStyle} />
                {touched && !phoneValid && <span style={{ fontSize: '11px', color: '#f87171' }}>Telefone inválido.</span>}
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Usamos esses dados para vincular sua compra, gerar sua Serial Key e enviar o comprovante. Não é necessário criar conta agora.
              </p>
              <button
                onClick={() => { setTouched(true); if (buyerValid) setStep('payment') }}
                disabled={!buyerValid}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 0 30px rgba(52,211,153,0.3)',
                  border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '15px',
                  padding: '14px 24px', width: '100%', cursor: buyerValid ? 'pointer' : 'not-allowed', opacity: buyerValid ? 1 : 0.6,
                }}
              >
                Ir para pagamento <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div>
              <button onClick={() => setStep('buyer')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px', marginBottom: '16px', padding: 0 }}>
                <ChevronLeft size={14} /> Editar meus dados
              </button>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                Comprando como <strong style={{ color: 'white' }}>{name}</strong> · {email} · {phone}
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
      <style>{`@media (max-width: 860px){ .checkout-grid{ grid-template-columns: 1fr !important; } }`}</style>
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
    <div style={pageStyle}>
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Loader2 size={32} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} /></div>}>
        <ComprarContent />
      </Suspense>
    </div>
  )
}
