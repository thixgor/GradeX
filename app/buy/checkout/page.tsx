'use client'

/*
 * /buy/checkout — a segunda (e última) tela da compra de um plano.
 *
 * Quem chega aqui já escolheu. Então a tela existe para uma coisa só: pagar.
 * Tudo o que não ajuda a pagar foi recolhido ou removido — o resumo cabe em um
 * cartão curto, a lista de benefícios vira um "ver o que entra" fechado, e o
 * cupom deixou de ocupar dois blocos permanentes (a faixa da campanha e um
 * formulário sempre aberto) para virar um link que só se abre quem tem código.
 *
 * No celular a ordem do DOM é resumo curto → pagamento → detalhes. Antes a
 * lista inteira de benefícios ficava entre o preço e o formulário.
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Loader2,
  ChevronLeft,
  ChevronDown,
  CreditCard,
  Zap,
  CheckCircle2,
  Check,
  Lock,
  Tag,
  X,
  GraduationCap,
} from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import type { PlanConfig } from '@/lib/types'
import { AppShell } from '@/components/app-shell'
import { CheckoutAccountNotice } from '@/components/checkout/checkout-account-notice'
import { CouponPromo } from '@/components/checkout/coupon-promo'
import { useProuniGrant } from '@/hooks/use-prouni-grant'
import { combineDiscountsWithProuni } from '@/lib/prouni-shared'
import { cn } from '@/lib/utils'

type PayMode = 'subscription' | 'one_time'

interface AppliedCoupon {
  couponId: string
  code: string
  label?: string
  amountBeforeCoupon: number
  discountAmount: number
  amountAfterCoupon: number
}

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export default function BuyCheckoutPage() {
  return (
    <AppShell>
      <BuyCheckoutContent />
    </AppShell>
  )
}

function BuyCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || ''
  const [plan, setPlan] = useState<PlanConfig | null>(null)
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [payMode, setPayMode] = useState<PayMode>('subscription')
  const [verDetalhes, setVerDetalhes] = useState(false)

  // Cupom: só se aplica ao pagamento único — a assinatura recorrente cobra o
  // cartão pelo mesmo valor fixo em toda renovação (preapproval do Mercado
  // Pago), e não existe hoje um jeito de descontar só a primeira cobrança sem
  // o desconto voltar sozinho no mês seguinte. Aplicar o cupom ali venderia um
  // preço que a cobrança real não respeitaria.
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponAberto, setCouponAberto] = useState(false)
  const couponSupported = payMode === 'one_time'

  /**
   * Desconto PROUNI/FIES aprovado para este plano.
   *
   * Vale pelas mesmas razões do cupom, e com o mesmo limite: só o pagamento
   * único o respeita. A assinatura recorrente é um preapproval do Mercado Pago
   * que cobra o mesmo valor em toda renovação — descontar ali venderia o
   * benefício de uso único como se fosse permanente. Por isso o benefício
   * ABRE a tela no pagamento único quando existe (`modoEscolhido`), em vez de
   * ficar escondido atrás de uma escolha que a pessoa não sabe que precisa
   * fazer.
   */
  const { concessao: prouniGrant } = useProuniGrant('plus', planId)
  const prouniSupported = payMode === 'one_time'
  const [modoEscolhido, setModoEscolhido] = useState(false)

  useEffect(() => {
    if (!prouniGrant || modoEscolhido || !isRecurring) return
    setPayMode('one_time')
  }, [prouniGrant, modoEscolhido, isRecurring])

  const escolherModo = (modo: PayMode) => {
    setModoEscolhido(true)
    setPayMode(modo)
  }

  useEffect(() => {
    if (!planId) {
      setError('Plano não informado')
      setLoading(false)
      return
    }
    Promise.all([
      fetch('/api/plans').then(r => r.json()),
      fetch('/api/payments/public-key').then(r => r.json()),
    ])
      .then(([planosResp, pkResp]) => {
        const found = (planosResp.planos || []).find((p: PlanConfig) => p.tipo === planId)
        if (!found) {
          setError('Plano não encontrado')
          return
        }
        setPlan(found)
        setPublicKey(pkResp.publicKey || '')
        const months = found.durationMonths || 0
        if (months === 1 || months === 3 || months === 12) {
          setIsRecurring(true)
          setPayMode('subscription')
        } else {
          setIsRecurring(false)
          setPayMode('one_time')
        }
      })
      .catch(err => setError(String(err?.message || err)))
      .finally(() => setLoading(false))
  }, [planId])

  useEffect(() => {
    if (!plan) return
    fetch('/api/analytics/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'checkout_view',
        productId: plan.tipo,
        productTitle: plan.nome,
        productType: 'subscription',
        amount: plan.preco,
        source: 'Assinatura',
        metadata: { period: plan.periodo, durationMonths: plan.durationMonths },
      }),
      keepalive: true,
    }).catch(() => {})
  }, [plan])

  if (loading) {
    return (
      <div className="surface-page flex min-h-[60vh] items-center justify-center px-4 py-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="surface-page min-h-full px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-xl pt-8">
          <div className="mb-4 rounded-lg border border-destructive/25 bg-destructive/10 px-5 py-6 text-sm text-destructive">
            {error || 'Plano não disponível.'}
          </div>
          <button
            type="button"
            onClick={() => router.push('/buy')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
        </div>
      </div>
    )
  }

  const months = plan.durationMonths || 0
  const periodLabel = plan.periodo || (months === 1 ? 'Mensal' : months === 3 ? 'Trimestral' : months === 12 ? 'Anual' : 'Vitalício')
  const cicloLabel = months === 1 ? 'mês' : months === 3 ? '3 meses' : '12 meses'
  const beneficios: string[] = Array.isArray((plan as any).features) ? (plan as any).features : []

  const baseAmount = Number(plan.preco) || 0
  // A MESMA conta que /api/payments/orders faz para cobrar. Planos não têm
  // lote, então aqui cupom e PROUNI só disputam entre si pelo maior desconto —
  // e o empate favorece o benefício, como no servidor.
  const combinado = combineDiscountsWithProuni({
    basePrice: baseAmount,
    couponDiscountAmount: couponSupported && appliedCoupon ? appliedCoupon.discountAmount : 0,
    prouni: prouniSupported ? prouniGrant : null,
  })
  const payableAmount = combinado.finalPrice
  const couponDiscountAmount = combinado.couponDiscountApplied
  const prouniDiscountAmount = combinado.prouniDiscountApplied

  // `override` é o caminho do chamativo: a faixa manda o código direto, sem
  // depender do que está digitado no campo.
  const applyCoupon = async (override?: string) => {
    const normalized = (override ?? couponCode).trim()
    if (!normalized) return
    if (override) setCouponCode(override.toUpperCase())
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized, itemType: 'plus', itemId: plan.tipo }),
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

  return (
    <div className="surface-page min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push('/buy')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar aos planos
        </button>

        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Finalizar compra
        </h1>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-5">
          {/* Resumo. Curto de propósito: quem chegou aqui já leu a página de
              vendas — o que falta é conferir o valor e pagar. */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-clinical text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                {periodLabel}
              </span>
            </div>
            <h2 className="mt-2 font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {plan.nome}
            </h2>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-border pt-3">
              {baseAmount > payableAmount && (
                <span className="text-sm tabular-nums text-muted-foreground line-through">
                  {formatBRL(baseAmount)}
                </span>
              )}
              <span className="font-heading text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {formatBRL(payableAmount)}
              </span>
              <span className="text-xs text-muted-foreground">
                {months > 0 && payMode === 'subscription' ? `a cada ${cicloLabel}` : 'pagamento único'}
              </span>
            </div>

            {prouniDiscountAmount > 0 && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Desconto ProUni/FIES{prouniGrant?.discountLabel ? ` (${prouniGrant.discountLabel})` : ''}: −{' '}
                {formatBRL(prouniDiscountAmount)}
              </p>
            )}

            {appliedCoupon && couponSupported && (
              <p
                className={cn(
                  'mt-1.5 text-xs font-bold',
                  couponDiscountAmount > 0 ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {couponDiscountAmount > 0
                  ? `Cupom ${appliedCoupon.code}: − ${formatBRL(couponDiscountAmount)}`
                  : `Cupom ${appliedCoupon.code} mantido — o seu desconto ProUni/FIES já é maior.`}
              </p>
            )}

            {/* O benefício existe mas a pessoa está na assinatura recorrente:
                dizer onde ele vale é mais útil que sumir com ele da tela. */}
            {prouniGrant && !prouniSupported && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Seu desconto ProUni/FIES{prouniGrant.discountLabel ? ` de ${prouniGrant.discountLabel}` : ''} vale
                no “Pagamento único” — a assinatura recorrente cobra sempre o valor cheio, em toda renovação.
              </p>
            )}

            {couponSupported && (
              <CouponPromo
                itens={[{ itemType: 'plus', itemId: plan.tipo }]}
                onAplicar={(code) => applyCoupon(code)}
                codigoAplicado={appliedCoupon?.code || null}
                className="mt-3"
              />
            )}

            {/* Cupom: um link, não um bloco. Quem não tem código não precisa
                olhar para um campo vazio no meio do caminho até o pagamento. */}
            <div className="mt-3">
              {!couponSupported ? (
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {appliedCoupon
                    ? `Cupom ${appliedCoupon.code} guardado — escolha "Pagamento único" para aplicá-lo.`
                    : 'Cupom vale no "Pagamento único" — a assinatura recorrente cobra sempre o valor cheio.'}
                </p>
              ) : appliedCoupon ? (
                <div className="flex items-center justify-between gap-2.5 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2">
                  <p className="min-w-0 truncate text-xs font-bold text-primary">
                    {appliedCoupon.code} aplicado · {formatBRL(appliedCoupon.discountAmount)} de desconto
                  </p>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-destructive transition hover:underline"
                  >
                    <X className="h-3.5 w-3.5" /> Remover
                  </button>
                </div>
              ) : couponAberto ? (
                <>
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                      onKeyDown={(e) => { if (e.key === 'Enter') applyCoupon() }}
                      disabled={couponLoading}
                      placeholder="Digite seu cupom"
                      aria-label="Código do cupom"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm uppercase text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
                    />
                    <button
                      type="button"
                      onClick={() => applyCoupon()}
                      disabled={couponLoading || !couponCode.trim()}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-secondary px-4 text-xs font-black text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {couponLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Aplicar
                    </button>
                  </div>
                  {couponError ? <p className="mt-2 text-xs text-destructive">{couponError}</p> : null}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setCouponAberto(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  <Tag className="h-3.5 w-3.5" /> Tenho um cupom
                </button>
              )}
            </div>

            {beneficios.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setVerDetalhes((v) => !v)}
                  aria-expanded={verDetalhes}
                  aria-controls="beneficios-do-plano"
                  className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  Ver os {beneficios.length} itens inclusos
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 text-secondary transition-transform', verDetalhes && 'rotate-180')}
                    aria-hidden
                  />
                </button>
                {verDetalhes && (
                  <ul id="beneficios-do-plano" className="mt-2.5 flex flex-col gap-1.5">
                    {beneficios.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              Ambiente seguro do Mercado Pago · não guardamos o seu cartão
            </p>
          </div>

          {/* Pagamento */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            {isRecurring && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Como prefere pagar?</p>
                {/* Segmentado, não dois cartões empilhados: são duas opções
                    curtas e a recomendada já vem escolhida. */}
                <div className="grid grid-cols-2 gap-2">
                  <OpcaoDePagamento
                    ativo={payMode === 'subscription'}
                    onClick={() => escolherModo('subscription')}
                    icone={CreditCard}
                    titulo="Assinatura"
                    detalhe={prouniGrant ? 'Cartão · sem o seu desconto' : 'Cartão · renova sozinho'}
                    selo={prouniGrant ? undefined : 'Recomendado'}
                  />
                  <OpcaoDePagamento
                    ativo={payMode === 'one_time'}
                    onClick={() => escolherModo('one_time')}
                    icone={Zap}
                    titulo="Pagamento único"
                    detalhe="Pix, cartão ou boleto"
                    selo={prouniGrant ? 'Com seu desconto' : undefined}
                  />
                </div>
              </div>
            )}

            <CheckoutAccountNotice className="mb-4" />

            {payMode === 'subscription' && isRecurring ? (
              <SubscriptionCheckout plan={plan} publicKey={publicKey} months={months as 1 | 3 | 12} />
            ) : (
              <MercadoPagoCheckout
                key={`buy-${payableAmount}-${appliedCoupon?.code || 'sem-cupom'}-${prouniDiscountAmount}`}
                publicKey={publicKey}
                amount={payableAmount}
                description={`${plan.nome} — ${periodLabel}`}
                endpoint="/api/payments/orders"
                extraBody={{
                  type: 'plan',
                  refId: plan.tipo,
                  couponCode: appliedCoupon?.code,
                }}
                analytics={{
                  productId: plan.tipo,
                  productTitle: plan.nome,
                  productType: 'subscription',
                  source: 'Assinatura',
                }}
                onApproved={() => setTimeout(() => router.push('/profile?purchase=success'), 1500)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function OpcaoDePagamento({
  ativo,
  onClick,
  icone: Icone,
  titulo,
  detalhe,
  selo,
}: {
  ativo: boolean
  onClick: () => void
  icone: typeof CreditCard
  titulo: string
  detalhe: string
  selo?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        'rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        ativo ? 'border-primary/50 bg-primary/10 shadow-sm' : 'border-border bg-background hover:bg-muted/50'
      )}
    >
      <span className="flex items-center gap-1.5">
        <Icone className={cn('h-4 w-4 shrink-0', ativo ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
        <span className={cn('truncate text-[13px] font-bold', ativo ? 'text-primary' : 'text-foreground')}>
          {titulo}
        </span>
      </span>
      <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{detalhe}</span>
      {selo && (
        <span className="mt-1.5 inline-block rounded bg-primary/15 px-1.5 py-px text-[10px] font-bold text-primary">
          {selo}
        </span>
      )}
    </button>
  )
}

/**
 * Para assinaturas, o MP exige cartão (preapproval). Reaproveitamos o Brick
 * de cartão local para tokenizar e enviamos para /api/subscriptions.
 */
function SubscriptionCheckout({ plan, publicKey, months }: { plan: PlanConfig; publicKey: string; months: 1 | 3 | 12 }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mpInstance, setMpInstance] = useState<any>(null)

  const inputCls =
    'w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15 sm:text-sm'
  const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const init = () => {
      // @ts-ignore
      if (window.MercadoPago) setMpInstance(new window.MercadoPago(publicKey, { locale: 'pt-BR' }))
    }
    // @ts-ignore
    if (window.MercadoPago) init()
    else {
      const s = document.createElement('script')
      s.src = 'https://sdk.mercadopago.com/js/v2'
      s.async = true
      s.onload = init
      document.head.appendChild(s)
    }
  }, [publicKey])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (!mpInstance) throw new Error('SDK não carregou')
      const f = e.currentTarget
      const cardNumber = (f.elements.namedItem('cardNumber') as HTMLInputElement).value.replace(/\s/g, '')
      const cardholderName = (f.elements.namedItem('cardholderName') as HTMLInputElement).value
      const cardExpirationMonth = (f.elements.namedItem('cardExpirationMonth') as HTMLInputElement).value
      const cardExpirationYear = (f.elements.namedItem('cardExpirationYear') as HTMLInputElement).value
      const securityCode = (f.elements.namedItem('securityCode') as HTMLInputElement).value
      const docNumber = (f.elements.namedItem('docNumber') as HTMLInputElement).value

      const tk = await mpInstance.createCardToken({
        cardNumber,
        cardholderName,
        cardExpirationMonth,
        cardExpirationYear: cardExpirationYear.length === 2 ? `20${cardExpirationYear}` : cardExpirationYear,
        securityCode,
        identificationType: 'CPF',
        identificationNumber: docNumber.replace(/\D/g, ''),
      })

      fetch('/api/analytics/checkout-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'checkout_submit',
          productId: plan.tipo,
          productTitle: plan.nome,
          productType: 'subscription',
          amount: plan.preco,
          paymentMethod: 'credit_card',
          source: 'Assinatura',
          metadata: { recurring: true },
        }),
        keepalive: true,
      }).catch(() => {})

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.tipo, cardTokenId: tk.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao criar assinatura')
      if (data.status === 'authorized') {
        setSuccess(true)
        setTimeout(() => (window.location.href = '/profile?subscription=success'), 1500)
      } else {
        setError('Assinatura criada, aguardando autorização do cartão. Você receberá uma confirmação.')
      }
    } catch (err: any) {
      setError(err?.message || 'Erro')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="py-5 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
        <p className="text-base font-bold text-primary">Assinatura ativada com sucesso!</p>
      </div>
    )
  }

  return (
    // `text-base` nos campos e `inputMode`/`autoComplete` em todos: no iOS,
    // campo com fonte menor que 16px faz a tela dar zoom sozinha ao focar, e
    // sem inputMode o teclado abre em letras para digitar número de cartão.
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <p className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-[13px] leading-relaxed text-muted-foreground">
        Você será cobrado{' '}
        <strong className="text-primary">R$ {plan.preco.toFixed(2).replace('.', ',')}</strong> a cada{' '}
        {months === 1 ? 'mês' : months === 3 ? '3 meses' : '12 meses'}. Cancele quando quiser no seu perfil.
      </p>
      <input className="hidden" name="cardholderEmail" />
      <div>
        <label className={labelCls} htmlFor="cardNumber">Número do cartão</label>
        <input
          id="cardNumber"
          name="cardNumber"
          required
          className={inputCls}
          inputMode="numeric"
          autoComplete="cc-number"
          maxLength={19}
          placeholder="0000 0000 0000 0000"
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="cardholderName">Nome impresso no cartão</label>
        <input id="cardholderName" name="cardholderName" required autoComplete="cc-name" className={inputCls} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelCls} htmlFor="cardExpirationMonth">Mês</label>
          <input
            id="cardExpirationMonth"
            name="cardExpirationMonth"
            required
            maxLength={2}
            inputMode="numeric"
            autoComplete="cc-exp-month"
            placeholder="MM"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="cardExpirationYear">Ano</label>
          <input
            id="cardExpirationYear"
            name="cardExpirationYear"
            required
            maxLength={4}
            inputMode="numeric"
            autoComplete="cc-exp-year"
            placeholder="AAAA"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="securityCode">CVV</label>
          <input
            id="securityCode"
            name="securityCode"
            required
            maxLength={4}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="docNumber">CPF</label>
        <input
          id="docNumber"
          name="docNumber"
          required
          inputMode="numeric"
          className={inputCls}
          placeholder="000.000.000-00"
        />
      </div>
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting || !mpInstance}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-4 text-[15px] font-bold text-secondary-foreground shadow-sm transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Ativar assinatura — R$ {plan.preco.toFixed(2).replace('.', ',')}/
        {months === 1 ? 'mês' : months === 3 ? 'trim.' : 'ano'}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="h-3 w-3 shrink-0 text-primary" aria-hidden />
        Pagamento seguro · Mercado Pago · dados criptografados
      </p>
    </form>
  )
}
