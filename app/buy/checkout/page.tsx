'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ChevronLeft, CreditCard, Zap, CheckCircle2, Star } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import type { PlanConfig } from '@/lib/types'
import { AppShell } from '@/components/app-shell'

type PayMode = 'subscription' | 'one_time'

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #020d06 0%, #031a0b 40%, #041408 100%)',
  padding: '24px 16px',
}

const glassCard: React.CSSProperties = {
  background: 'rgba(6,20,10,0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '20px',
}

const emeraldBadge: React.CSSProperties = {
  background: 'linear-gradient(135deg, #059669, #34d399)',
  borderRadius: '10px',
  padding: '6px 14px',
  fontSize: '13px',
  fontWeight: 700,
  color: 'white',
  display: 'inline-block',
}

const modeCard = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.03)',
  border: active ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.08)',
  boxShadow: active ? '0 0 24px rgba(52,211,153,0.15)' : 'none',
  borderRadius: '14px',
  padding: '18px 20px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textAlign: 'left' as const,
  width: '100%',
})

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
      <div style={pageStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Loader2 size={32} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: '640px', margin: '0 auto', paddingTop: '40px' }}>
          <div style={{ ...glassCard, padding: '28px', color: '#f87171', marginBottom: '16px' }}>
            {error || 'Plano não disponível.'}
          </div>
          <button
            onClick={() => router.push('/buy')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px', padding: '8px 16px', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontSize: '14px',
            }}
          >
            <ChevronLeft size={16} /> Voltar
          </button>
        </div>
      </div>
    )
  }

  const months = plan.durationMonths || 0
  const periodLabel = plan.periodo || (months === 1 ? 'Mensal' : months === 3 ? 'Trimestral' : months === 12 ? 'Anual' : 'Vitalício')

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={() => router.push('/buy')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px',
            marginBottom: '24px', padding: '0',
          }}
        >
          <ChevronLeft size={16} /> Voltar aos planos
        </button>

        {/* Page title */}
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Finalizar compra
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
          Você está adquirindo o plano <strong style={{ color: '#34d399' }}>{plan.nome}</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '24px', alignItems: 'start' }}>
          {/* Left: Plan summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ ...glassCard, padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <div style={{ ...emeraldBadge, marginBottom: '12px' }}>{periodLabel}</div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>{plan.nome}</h2>
                </div>
                <Star size={20} style={{ color: '#34d399', flexShrink: 0 }} />
              </div>

              <div style={{
                padding: '16px',
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.12)',
                borderRadius: '12px',
                marginBottom: '20px',
              }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Valor</p>
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em' }}>
                  R$ {plan.preco.toFixed(2).replace('.', ',')}
                </p>
                {months > 0 && payMode === 'subscription' && (
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    cobrado a cada {months === 1 ? 'mês' : months === 3 ? '3 meses' : '12 meses'}
                  </p>
                )}
              </div>

              {plan.descricao && (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.6', marginBottom: '16px' }}>
                  {plan.descricao}
                </p>
              )}

              {/* Features */}
              {Array.isArray((plan as any).features) && (plan as any).features.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(plan as any).features.map((f: string, i: number) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                      <CheckCircle2 size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Trust badges */}
            <div style={{ ...glassCard, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontSize: '16px' }}>🔒</span>
                <span>Ambiente 100% seguro · Mercado Pago</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontSize: '16px' }}>🛡️</span>
                <span>Dados criptografados · Nunca armazenamos seu cartão</span>
              </div>
            </div>
          </div>

          {/* Right: Payment section */}
          <div style={{ ...glassCard, padding: '28px' }}>
            {/* Mode selector for recurring plans */}
            {isRecurring && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Como deseja pagar?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPayMode('subscription')}
                    style={modeCard(payMode === 'subscription')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <CreditCard size={16} style={{ color: payMode === 'subscription' ? '#34d399' : 'rgba(255,255,255,0.5)' }} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: payMode === 'subscription' ? '#34d399' : 'rgba(255,255,255,0.8)' }}>
                        Assinatura automática
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', background: 'rgba(52,211,153,0.15)', color: '#34d399', borderRadius: '6px', padding: '2px 8px' }}>Recomendado</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginLeft: '26px' }}>
                      Cartão de crédito · Renova automaticamente · Cancele quando quiser
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMode('one_time')}
                    style={modeCard(payMode === 'one_time')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <Zap size={16} style={{ color: payMode === 'one_time' ? '#34d399' : 'rgba(255,255,255,0.5)' }} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: payMode === 'one_time' ? '#34d399' : 'rgba(255,255,255,0.8)' }}>
                        Pagamento único
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginLeft: '26px' }}>
                      Pix, cartão ou boleto · Sem renovação automática · Acesso pelo período escolhido
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Checkout form */}
            {(payMode === 'subscription' && isRecurring) ? (
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

  const glassInput: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(52,211,153,0.2)',
    color: 'white',
    borderRadius: '10px',
    padding: '10px 14px',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(52,211,153,0.8)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

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
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <CheckCircle2 size={40} style={{ color: '#34d399', margin: '0 auto 12px' }} />
        <p style={{ color: '#34d399', fontWeight: 700, fontSize: '16px' }}>Assinatura ativada com sucesso!</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', padding: '12px', background: 'rgba(52,211,153,0.04)', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.1)' }}>
        Assinatura recorrente: você será cobrado <strong style={{ color: '#34d399' }}>R$ {plan.preco.toFixed(2).replace('.', ',')}</strong> a cada {months === 1 ? 'mês' : months === 3 ? '3 meses' : '12 meses'}. Você pode cancelar a qualquer momento em /profile.
      </p>
      <input className="hidden" name="cardholderEmail" />
      <div>
        <label style={labelStyle}>Número do cartão</label>
        <input name="cardNumber" required style={glassInput} inputMode="numeric" maxLength={19} placeholder="0000 0000 0000 0000" />
      </div>
      <div>
        <label style={labelStyle}>Nome impresso no cartão</label>
        <input name="cardholderName" required style={glassInput} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div>
          <label style={labelStyle}>Mês</label>
          <input name="cardExpirationMonth" required maxLength={2} placeholder="MM" style={glassInput} />
        </div>
        <div>
          <label style={labelStyle}>Ano</label>
          <input name="cardExpirationYear" required maxLength={4} placeholder="AAAA" style={glassInput} />
        </div>
        <div>
          <label style={labelStyle}>CVV</label>
          <input name="securityCode" required maxLength={4} placeholder="CVV" style={glassInput} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>CPF</label>
        <input name="docNumber" required style={glassInput} placeholder="000.000.000-00" />
      </div>
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '12px 16px', background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px',
          color: '#f87171', fontSize: '13px',
        }}>
          <span>{error}</span>
        </div>
      )}
      <button
        type="submit"
        disabled={submitting || !mpInstance}
        style={{
          background: 'linear-gradient(135deg, #059669, #34d399)',
          boxShadow: '0 0 30px rgba(52,211,153,0.3)',
          border: 'none', borderRadius: '12px', color: 'white',
          fontWeight: 700, fontSize: '15px', padding: '13px 20px',
          cursor: (submitting || !mpInstance) ? 'not-allowed' : 'pointer',
          opacity: (submitting || !mpInstance) ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%',
        }}
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        Ativar assinatura — R$ {plan.preco.toFixed(2).replace('.', ',')}/{months === 1 ? 'mês' : months === 3 ? 'trim.' : 'ano'}
      </button>
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
        🔒 Pagamento seguro · Mercado Pago · Dados criptografados
      </p>
    </form>
  )
}
