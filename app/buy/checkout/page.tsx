'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ChevronLeft, CreditCard, Zap, CheckCircle2, Star } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import type { PlanConfig } from '@/lib/types'
import { AppShell } from '@/components/app-shell'
import { CheckoutAccountNotice } from '@/components/checkout/checkout-account-notice'
import { cn } from '@/lib/utils'

type PayMode = 'subscription' | 'one_time'

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

  return (
    <div className="surface-page min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push('/buy')}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar aos planos
        </button>

        <p className="editorial-mark mb-2">Checkout · assinatura</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Finalizar compra
        </h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          Você está adquirindo o plano{' '}
          <strong className="font-semibold text-primary">{plan.nome}</strong>
        </p>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:items-start">
          {/* Left: Plan summary */}
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <span className="mb-3 inline-flex rounded-md bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                    {periodLabel}
                  </span>
                  <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    {plan.nome}
                  </h2>
                </div>
                <Star className="h-5 w-5 shrink-0 text-primary" />
              </div>

              <div className="mb-5 rounded-lg border border-primary/15 bg-primary/5 p-4">
                <p className="text-xs font-medium text-muted-foreground">Valor</p>
                <p className="font-heading text-3xl font-semibold tabular-nums tracking-tight text-primary">
                  R$ {plan.preco.toFixed(2).replace('.', ',')}
                </p>
                {months > 0 && payMode === 'subscription' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    cobrado a cada {months === 1 ? 'mês' : months === 3 ? '3 meses' : '12 meses'}
                  </p>
                )}
              </div>

              {plan.descricao && (
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {plan.descricao}
                </p>
              )}

              {Array.isArray((plan as any).features) && (plan as any).features.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {(plan as any).features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground shadow-sm">
              <div className="flex items-center gap-2.5">
                <span aria-hidden>🔒</span>
                <span>Ambiente 100% seguro · Mercado Pago</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span aria-hidden>🛡️</span>
                <span>Dados criptografados · Nunca armazenamos seu cartão</span>
              </div>
            </div>
          </div>

          {/* Right: Payment */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            {isRecurring && (
              <div className="mb-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                  Como deseja pagar?
                </p>
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPayMode('subscription')}
                    className={cn(
                      'w-full rounded-lg border p-4 text-left transition',
                      payMode === 'subscription'
                        ? 'border-primary/50 bg-primary/10 shadow-sm'
                        : 'border-border bg-background hover:bg-muted/50'
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2.5">
                      <CreditCard
                        className={cn(
                          'h-4 w-4',
                          payMode === 'subscription' ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-bold',
                          payMode === 'subscription' ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        Assinatura automática
                      </span>
                      <span className="ml-auto rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                        Recomendado
                      </span>
                    </div>
                    <p className="ml-6 text-xs text-muted-foreground">
                      Cartão de crédito · Renova automaticamente · Cancele quando quiser
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMode('one_time')}
                    className={cn(
                      'w-full rounded-lg border p-4 text-left transition',
                      payMode === 'one_time'
                        ? 'border-primary/50 bg-primary/10 shadow-sm'
                        : 'border-border bg-background hover:bg-muted/50'
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2.5">
                      <Zap
                        className={cn(
                          'h-4 w-4',
                          payMode === 'one_time' ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-bold',
                          payMode === 'one_time' ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        Pagamento único
                      </span>
                    </div>
                    <p className="ml-6 text-xs text-muted-foreground">
                      Pix, cartão ou boleto · Sem renovação automática · Acesso pelo período escolhido
                    </p>
                  </button>
                </div>
              </div>
            )}

            <CheckoutAccountNotice className="mb-4" />

            {payMode === 'subscription' && isRecurring ? (
              <SubscriptionCheckout plan={plan} publicKey={publicKey} months={months as 1 | 3 | 12} />
            ) : (
              <MercadoPagoCheckout
                publicKey={publicKey}
                amount={plan.preco}
                description={`${plan.nome} — ${periodLabel}`}
                endpoint="/api/payments/orders"
                extraBody={{ type: 'plan', refId: plan.tipo }}
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
    'w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15'

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
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <p className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm leading-relaxed text-muted-foreground">
        Assinatura recorrente: você será cobrado{' '}
        <strong className="text-primary">
          R$ {plan.preco.toFixed(2).replace('.', ',')}
        </strong>{' '}
        a cada {months === 1 ? 'mês' : months === 3 ? '3 meses' : '12 meses'}. Você pode cancelar a
        qualquer momento em /profile.
      </p>
      <input className="hidden" name="cardholderEmail" />
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-primary">
          Número do cartão
        </label>
        <input
          name="cardNumber"
          required
          className={inputCls}
          inputMode="numeric"
          maxLength={19}
          placeholder="0000 0000 0000 0000"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-primary">
          Nome impresso no cartão
        </label>
        <input name="cardholderName" required className={inputCls} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-primary">
            Mês
          </label>
          <input name="cardExpirationMonth" required maxLength={2} placeholder="MM" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-primary">
            Ano
          </label>
          <input name="cardExpirationYear" required maxLength={4} placeholder="AAAA" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-primary">
            CVV
          </label>
          <input name="securityCode" required maxLength={4} placeholder="CVV" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-primary">
          CPF
        </label>
        <input name="docNumber" required className={inputCls} placeholder="000.000.000-00" />
      </div>
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting || !mpInstance}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3.5 text-[15px] font-bold text-secondary-foreground shadow-sm transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Ativar assinatura — R$ {plan.preco.toFixed(2).replace('.', ',')}/
        {months === 1 ? 'mês' : months === 3 ? 'trim.' : 'ano'}
      </button>
      <p className="text-center text-[11px] text-muted-foreground">
        🔒 Pagamento seguro · Mercado Pago · Dados criptografados
      </p>
    </form>
  )
}
