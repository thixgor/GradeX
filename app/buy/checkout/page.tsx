'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronLeft } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import type { PlanConfig } from '@/lib/types'

type SubMode = { type: 'subscription'; months: 1 | 3 | 12 } | { type: 'one_time' }

export default function BuyCheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || ''
  const [plan, setPlan] = useState<PlanConfig | null>(null)
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<SubMode | null>(null)

  useEffect(() => {
    if (!planId) {
      setError('Plano não informado')
      setLoading(false)
      return
    }
    Promise.all([
      fetch('/api/admin/settings/planos').then(r => r.json()),
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
          setMode({ type: 'subscription', months: months as 1 | 3 | 12 })
        } else {
          setMode({ type: 'one_time' })
        }
      })
      .catch(err => setError(String(err?.message || err)))
      .finally(() => setLoading(false))
  }, [planId])

  if (loading) {
    return (
      <AppShell headerTitle="Checkout">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppShell>
    )
  }

  if (error || !plan || !mode) {
    return (
      <AppShell headerTitle="Checkout">
        <div className="max-w-2xl mx-auto p-6 space-y-4">
          <Card><CardContent className="pt-6">{error || 'Plano não disponível.'}</CardContent></Card>
          <Button variant="outline" onClick={() => router.push('/buy')}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell headerTitle="Checkout" headerSubtitle={plan.nome}>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/buy')}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar aos planos
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{plan.nome} — {plan.periodo}</CardTitle>
          </CardHeader>
          <CardContent>
            {mode.type === 'subscription' ? (
              <SubscriptionCheckout plan={plan} publicKey={publicKey} months={mode.months} />
            ) : (
              <MercadoPagoCheckout
                publicKey={publicKey}
                amount={plan.preco}
                description={`${plan.nome} — ${plan.periodo}`}
                endpoint="/api/payments/orders"
                extraBody={{ type: 'plan', refId: plan.tipo }}
                onApproved={() => setTimeout(() => router.push('/profile?purchase=success'), 1500)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
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
    return <p className="text-green-700 dark:text-green-400 font-semibold">Assinatura ativada com sucesso!</p>
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Assinatura recorrente: você será cobrado <strong>R$ {plan.preco.toFixed(2).replace('.', ',')}</strong> a cada {months === 1 ? 'mês' : months === 3 ? '3 meses' : '12 meses'}. Você pode cancelar a qualquer momento em /profile.
      </p>
      <div className="grid gap-3">
        <input className="hidden" name="cardholderEmail" />
        <div>
          <label className="text-sm font-medium">Número do cartão</label>
          <input name="cardNumber" required className="w-full h-10 rounded-md border bg-background px-3 text-sm" inputMode="numeric" maxLength={19} placeholder="0000 0000 0000 0000" />
        </div>
        <div>
          <label className="text-sm font-medium">Nome impresso no cartão</label>
          <input name="cardholderName" required className="w-full h-10 rounded-md border bg-background px-3 text-sm" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input name="cardExpirationMonth" required maxLength={2} placeholder="MM" className="h-10 rounded-md border bg-background px-3 text-sm" />
          <input name="cardExpirationYear" required maxLength={4} placeholder="AAAA" className="h-10 rounded-md border bg-background px-3 text-sm" />
          <input name="securityCode" required maxLength={4} placeholder="CVV" className="h-10 rounded-md border bg-background px-3 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">CPF</label>
          <input name="docNumber" required className="w-full h-10 rounded-md border bg-background px-3 text-sm" placeholder="000.000.000-00" />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" disabled={submitting || !mpInstance}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Ativar assinatura — R$ {plan.preco.toFixed(2).replace('.', ',')}/{months === 1 ? 'mês' : months === 3 ? 'trim.' : 'ano'}
      </Button>
    </form>
  )
}
