'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { trackMeta } from '@/lib/meta-pixel'
import { ArrowLeft, BookOpen, Check, Flame, Lock, Loader2, Percent, Sparkles, TrendingDown, X, Clock, Crown } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import { CheckoutAccountNotice } from '@/components/checkout/checkout-account-notice'
import { CouponPromo } from '@/components/checkout/coupon-promo'
import { usePricingEventState, usePricingEventStates } from '@/components/pricing-events/usePricingEventState'
import { ListaDoPacote } from '@/components/manual-clinico/pacote'
import { TOTAL_DE_MODULOS, precoPorDia, precoPorModulo } from '@/lib/manual-clinico/pacote'

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

interface ProductInfo {
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

interface AppliedCoupon {
  couponId: string
  code: string
  label: string
  amountBeforeCoupon: number
  eligibleAmount: number
  discountAmount: number
  amountAfterCoupon: number
  stackWithTier?: boolean
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatBRL(value: number) {
  return currency.format(Number(value || 0))
}

function CouponBox({
  product,
  planKey,
  appliedCoupon,
  onApplied,
  onRemoved,
}: {
  product: ProductInfo
  planKey: PlanKey
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
          planKey,
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

export default function ManualClinicoCheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planQuery = (searchParams.get('plan') as PlanKey | null) || null
  const [product, setProduct] = useState<ProductInfo | null>(null)
  const [publicKey, setPublicKey] = useState('')
  const [hasFullAccess, setHasFullAccess] = useState(false)
  const [hasLifetimeAccess, setHasLifetimeAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [freeLoading, setFreeLoading] = useState(false)
  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey>(planQuery || 'vitalicio')

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

  // Cupom pode ser restrito a planos (ou empilhar sobre o lote); limpa ao trocar.
  useEffect(() => {
    setAppliedCoupon(null)
  }, [selectedPlanKey])

  // Conversão de meio de funil: usuário chegou no checkout. Dispara uma única
  // vez, assim que há um plano selecionado, para o Meta poder otimizar a
  // campanha por quem realmente avança para a compra.
  const initiateCheckoutFired = useRef(false)
  useEffect(() => {
    if (initiateCheckoutFired.current || !selectedPlan) return
    initiateCheckoutFired.current = true
    trackMeta('InitiateCheckout', {
      value: selectedPlan.price,
      currency: 'BRL',
      content_name: 'Manual Clínico',
      content_type: 'product',
    })
  }, [selectedPlan])

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
        setHasFullAccess(!!productResp.access?.hasFullAccess)
        setHasLifetimeAccess(!!productResp.access?.subscription?.isLifetime)
        setPublicKey(keyResp.publicKey || '')
      })
      .catch((err: any) => setError(err?.message || 'Erro ao carregar checkout'))
      .finally(() => setLoading(false))
  }, [])

  async function unlockFree() {
    setFreeLoading(true)
    setError('')
    try {
      const res = await fetch('/api/manual-clinico/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: 'free', couponCode: appliedCoupon?.code, planKey: selectedPlan?.key }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao liberar acesso')
      window.location.href = data.successRedirect || '/manual-clinico?purchase=success'
    } catch (err: any) {
      setError(err?.message || 'Erro ao liberar acesso')
    } finally {
      setFreeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#04130b] text-emerald-200">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#04130b] px-4 py-8 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-300/20 bg-red-400/10 p-6 text-red-100">
          {error || 'Produto indisponivel.'}
        </div>
      </div>
    )
  }

  // Renovação só é bloqueada se já tem vitalício; temporários podem renovar/upgrade.
  if (hasFullAccess && hasLifetimeAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#04130b] px-4 text-white">
        <div className="max-w-md rounded-3xl border border-emerald-300/20 bg-white/[0.07] p-8 text-center backdrop-blur-2xl">
          <Check className="mx-auto mb-4 h-10 w-10 text-emerald-300" />
          <h1 className="text-2xl font-black">Manual ja desbloqueado</h1>
          <p className="mt-2 text-sm text-white/55">Sua conta ja possui acesso completo.</p>
          <button
            onClick={() => router.push('/manual-clinico')}
            className="mt-6 h-11 rounded-xl bg-emerald-300 px-5 text-sm font-black text-emerald-950"
          >
            Acessar Manual Clinico
          </button>
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
  // Empilhamento: cupom stackWithTier soma-se ao lote (cupom já vem do servidor
  // calculado sobre o preço pós-lote). Senão, vale o maior dos dois.
  const stackCoupon = appliedCoupon?.stackWithTier === true && hasActiveTier
  const effectiveDiscount = stackCoupon
    ? Math.min(baseAmount, tierDiscountAmount + couponDiscountAmount)
    : Math.max(tierDiscountAmount, couponDiscountAmount)
  const tierBeatsCoupon = !stackCoupon && hasActiveTier && tierDiscountAmount >= couponDiscountAmount
  const payableAmount = Math.max(0, Math.round((baseAmount - effectiveDiscount) * 100) / 100)

  const lifetimePlan = enabledPlans.find((p) => p.key === 'vitalicio') || null
  const longestTemporary = enabledPlans
    .filter((p) => p.durationMonths && p.durationMonths > 0)
    .sort((a, b) => (b.durationMonths || 0) - (a.durationMonths || 0))[0] || null
  // Quantas renovações do maior plano temporário equivalem ao vitalício (gancho de persuasão).
  const lifetimeBreakEven = lifetimePlan && longestTemporary && longestTemporary.price > 0
    ? Math.max(2, Math.ceil(lifetimePlan.price / longestTemporary.price))
    : null
  const selectedIsLifetime = selectedPlan?.key === 'vitalicio'
  const precoDoManual = precoPorModulo(payableAmount)
  const precoDiario = precoPorDia(payableAmount, selectedPlan?.durationMonths ?? null)

  return (
    <div className="min-h-screen overflow-hidden bg-[#031109] px-4 py-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(52,211,153,0.16),transparent_32%),radial-gradient(circle_at_84%_16%,rgba(226,164,62,0.13),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl">
        <button
          onClick={() => router.push('/manual-clinico')}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/65 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Manual
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-7">
            <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/10">
              {product.coverImageUrl ? (
                <img src={product.coverImageUrl} alt="" className="h-48 w-full object-cover opacity-80" />
              ) : (
                <div className="h-48 bg-emerald-400/10" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#031109] via-[#031109]/15 to-transparent" />
              {/* Era "Produto avulso" — o rótulo mais caro da página. Ele dizia à
                  pessoa, no momento de decidir, exatamente o contrário do que a
                  compra faz: libera sete manuais de uma vez. */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-amber-300/25 bg-black/45 px-3 py-1.5 text-xs font-black uppercase tracking-wide backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                {TOTAL_DE_MODULOS} manuais · 1 pagamento
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

            {/* O valor antes do número: a pessoa chega aqui achando que compra um
                manual. A lista mostra os sete que ela leva, com o tamanho de cada
                um, antes de qualquer preço aparecer na tela. */}
            <div className="mb-5">
              <p className="text-base font-black text-white">Esta compra abre os {TOTAL_DE_MODULOS} manuais</p>
              <p className="mt-0.5 text-xs text-white/55">
                Nenhum deles é vendido separado, e nenhum é versão reduzida. Todos abrem completos assim que o
                pagamento é aprovado.
              </p>
              <ListaDoPacote tom="escuro" className="mt-3" />
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
                    Os três liberam os {TOTAL_DE_MODULOS} manuais completos — a diferença é só por quanto tempo.
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
                `Os ${TOTAL_DE_MODULOS} manuais liberados juntos — nenhum é vendido à parte`,
                'Diagnóstico, tratamento, diferenciais, farmacologia e fluxogramas',
                'Conteúdo novo entra no mesmo acesso, sem cobrança extra',
                selectedPlan?.durationMonths
                  ? `Acesso por ${selectedPlan.durationMonths} ${selectedPlan.durationMonths === 1 ? 'mês' : 'meses'} após pagamento aprovado`
                  : 'Acesso vitalício liberado após pagamento aprovado',
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
                {payableAmount <= 0 ? 'Gratis' : formatBRL(payableAmount)}
              </p>
              <p className="mt-1 text-xs font-bold text-white/60">
                {selectedIsLifetime
                  ? 'Pagamento único · acesso para sempre, sem mensalidade'
                  : selectedPlan?.durationMonths
                    ? `${selectedPlan.label} · ${selectedPlan.durationMonths} ${selectedPlan.durationMonths === 1 ? 'mês' : 'meses'} de acesso`
                    : 'Acesso completo liberado na hora'}
              </p>
              {/* O total sobre sete. É o número que a pessoa compara com o preço
                  de um manual avulso — e o que desarma a objeção sem desconto. */}
              {precoDoManual != null && (
                <p className="mt-1.5 text-xs font-black text-amber-200">
                  {formatBRL(precoDoManual)} por manual
                  {precoDiario != null ? ` · cerca de ${formatBRL(precoDiario)} por dia` : ''}
                </p>
              )}
              {hasActiveTier && (tierBeatsCoupon || stackCoupon) && tierDiscountAmount > 0 ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-200">
                  <Flame className="h-3 w-3" />
                  Lote {pricingEventState?.activeTier?.label || ''}: − {formatBRL(tierDiscountAmount)} ({Math.round(tierPct)}% OFF)
                </p>
              ) : null}
              {appliedCoupon && !tierBeatsCoupon ? (
                <p className="mt-1 text-xs font-bold text-emerald-200">
                  Cupom {appliedCoupon.code}: - {formatBRL(appliedCoupon.discountAmount)}
                  {stackCoupon ? ' (sobre o lote)' : ''}
                </p>
              ) : null}
              {appliedCoupon && tierBeatsCoupon && tierDiscountAmount > 0 ? (
                <p className="mt-1 text-[10px] font-medium text-emerald-200/70">
                  Cupom {appliedCoupon.code} mantido — o desconto do lote já é maior.
                </p>
              ) : null}
            </div>

            <CouponPromo
              itens={[{ itemType: 'manual_clinico', itemId: MANUAL_CLINICO_PRODUCT_ID }]}
              planKey={selectedPlanKey}
              aparencia="dark"
              codigoAplicado={appliedCoupon?.code || null}
              className="mt-3.5"
            />

            {/* Cupom logo abaixo do Total: no celular as duas colunas empilham, e
                deixar o cupom só na coluna de pagamento (mais abaixo) fazia quem
                está decidindo o plano nunca rolar até ele. Aqui ele aparece no
                mesmo cartão do preço, sem precisar de mais um scroll. */}
            <div className="mt-3.5">
              <CouponBox
                product={product}
                planKey={selectedPlanKey}
                appliedCoupon={appliedCoupon}
                onApplied={setAppliedCoupon}
                onRemoved={() => setAppliedCoupon(null)}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-7">
            {!product.isActive ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Lock className="mb-4 h-10 w-10 text-white/35" />
                <h2 className="text-xl font-black">Produto indisponivel</h2>
                <p className="mt-2 text-sm text-white/55">A compra do Manual Clinico Completo esta pausada no momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <CheckoutAccountNotice tone="dark" />

                {payableAmount <= 0 ? (
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-6 text-center">
                    <Check className="mx-auto mb-3 h-9 w-9 text-emerald-300" />
                    <h2 className="text-xl font-black">Acesso gratuito</h2>
                    <p className="mt-2 text-sm text-white/55">Confirme para liberar o Manual Clinico Completo na sua conta.</p>
                    <button
                      onClick={unlockFree}
                      disabled={freeLoading}
                      className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 text-sm font-black text-emerald-950 transition hover:bg-emerald-200 disabled:opacity-60"
                    >
                      {freeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Liberar acesso
                    </button>
                  </div>
                ) : (
                  <MercadoPagoCheckout
                    key={`manual-${selectedPlanKey}-${payableAmount}-${appliedCoupon?.code || 'sem-cupom'}`}
                    publicKey={publicKey}
                    amount={payableAmount}
                    description={`${product.label} — ${selectedPlan?.label || 'Plano'}`}
                    endpoint="/api/manual-clinico/checkout"
                    extraBody={{ couponCode: appliedCoupon?.code, planKey: selectedPlanKey }}
                    analytics={{
                      productId: MANUAL_CLINICO_PRODUCT_ID,
                      productTitle: product.label,
                      productType: 'product',
                      source: 'Manual Clinico',
                    }}
                    onApproved={(resp) => {
                      setTimeout(() => {
                        window.location.href = resp.successRedirect || '/manual-clinico?purchase=success'
                      }, 1200)
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
