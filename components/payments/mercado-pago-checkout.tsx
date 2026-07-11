'use client'

/**
 * Componente de Checkout Mercado Pago (Checkout Transparente).
 *
 * Suporta:
 *  - Cartão de crédito (tokenização client-side com mercadopago.js v2)
 *  - Pix (QR + copia-e-cola, com polling de status)
 *  - Boleto (linha digitável + URL)
 *
 * Nunca envia PAN/CVV ao backend — apenas o cardToken gerado no client.
 * O backend valida o amount usando a fonte autoritativa (admin_settings/materials).
 */

import { useEffect, useMemo, useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Copy, QrCode, CreditCard, Barcode, ExternalLink, Lock, ShieldCheck } from 'lucide-react'

declare global {
  interface Window {
    MercadoPago?: any
  }
}

type Method = 'card' | 'pix' | 'boleto'

export interface CheckoutOrderResponse {
  orderId: string
  providerPaymentId?: string
  status:
    | 'pending'
    | 'in_process'
    | 'approved'
    | 'rejected'
    | 'cancelled'
    | 'refunded'
    | 'charged_back'
    | 'expired'
  paymentMethod?: string
  pix?: { qrCode: string; qrCodeBase64: string; ticketUrl?: string } | null
  boleto?: { barcode?: string; ticketUrl?: string } | null
  statusDetail?: string
  amount: number
  successRedirect?: string
}

export interface MercadoPagoCheckoutProps {
  publicKey: string
  amount: number
  description: string
  /** Endpoint que cria a Order. Recebe os campos abaixo no body. */
  endpoint: string
  /** Body extra a ser enviado ao endpoint (type, refId, etc.) */
  extraBody: Record<string, any>
  /** Métodos permitidos (default: todos) */
  allowedMethods?: Method[]
  payerEmailHint?: string
  payerNameHint?: string
  onApproved?: (resp: CheckoutOrderResponse) => void
  onRejected?: (resp: CheckoutOrderResponse) => void
  analytics?: {
    productId?: string
    productTitle?: string
    productType?: 'material' | 'flashcard' | 'package' | 'subscription' | 'plan' | 'donation' | 'product' | 'unknown'
    source?: string
  }
}

const METHOD_PRIORITY: Record<Method, number> = {
  pix: 0,
  card: 1,
  boleto: 2,
}

const DEFAULT_ALLOWED_METHODS: Method[] = ['pix', 'card', 'boleto']

function getOrderedMethods(methods?: Method[]): Method[] {
  const allowed = methods?.length ? methods : DEFAULT_ALLOWED_METHODS
  return [...allowed].sort((a, b) => METHOD_PRIORITY[a] - METHOD_PRIORITY[b])
}

function getInitialMethod(methods?: Method[]): Method {
  return getOrderedMethods(methods)[0] || 'pix'
}

function getMethodIcon(method: Method) {
  if (method === 'pix') return <QrCode size={16} />
  if (method === 'card') return <CreditCard size={16} />
  return <Barcode size={16} />
}

function getMethodLabel(method: Method) {
  if (method === 'pix') return 'Pix'
  if (method === 'card') return 'Cartão'
  return 'Boleto'
}

const STATUS_LABELS: Record<CheckoutOrderResponse['status'], string> = {
  pending: 'Aguardando pagamento',
  in_process: 'Em análise',
  approved: 'Pagamento aprovado',
  rejected: 'Pagamento recusado',
  cancelled: 'Pagamento cancelado',
  refunded: 'Reembolsado',
  charged_back: 'Estornado',
  expired: 'Expirado',
}

/**
 * Estilos baseados nos tokens de tema (CSS variables) para funcionar tanto no
 * dark quanto no light mode. Nada de cores fixas escuras/brancas — assim o
 * checkout acompanha o tema da página.
 */
const glassCard: React.CSSProperties = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '16px',
  boxShadow: '0 8px 32px hsl(var(--foreground) / 0.06)',
}

const glassInput: React.CSSProperties = {
  background: 'hsl(var(--background))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--foreground))',
  borderRadius: '10px',
  padding: '10px 14px',
  width: '100%',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const activeTab: React.CSSProperties = {
  background: 'hsl(var(--primary) / 0.12)',
  border: '1px solid hsl(var(--primary) / 0.5)',
  color: 'hsl(var(--primary))',
  borderRadius: '10px',
  padding: '8px 18px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  fontWeight: 600,
  transition: 'all 0.2s',
}

const inactiveTab: React.CSSProperties = {
  background: 'hsl(var(--muted))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--muted-foreground))',
  borderRadius: '10px',
  padding: '8px 18px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.2s',
}

const submitBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.82))',
  boxShadow: '0 8px 24px hsl(var(--primary) / 0.28)',
  border: 'none',
  borderRadius: '12px',
  color: 'hsl(var(--primary-foreground))',
  fontWeight: 700,
  fontSize: '15px',
  padding: '12px 28px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'opacity 0.2s, box-shadow 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: 'hsl(var(--primary))',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export function MercadoPagoCheckout(props: MercadoPagoCheckoutProps) {
  const allowed = useMemo(() => getOrderedMethods(props.allowedMethods), [props.allowedMethods])
  const [method, setMethod] = useState<Method>(() => getInitialMethod(props.allowedMethods))
  const [mpReady, setMpReady] = useState(false)
  const [mpInstance, setMpInstance] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<CheckoutOrderResponse | null>(null)

  useEffect(() => {
    if (!allowed.includes(method)) {
      setMethod(getInitialMethod(props.allowedMethods))
    }
  }, [allowed, method, props.allowedMethods])

  function trackCheckout(event: 'checkout_submit', extra: Record<string, any> = {}) {
    if (!props.analytics) return
    fetch('/api/analytics/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        productId: props.analytics.productId,
        productTitle: props.analytics.productTitle || props.description,
        productType: props.analytics.productType || 'unknown',
        amount: props.amount,
        source: props.analytics.source,
        ...extra,
      }),
      keepalive: true,
    }).catch(() => {})
  }

  // Carregar mp.js v2
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.MercadoPago) {
      setMpInstance(new window.MercadoPago(props.publicKey, { locale: 'pt-BR' }))
      setMpReady(true)
      return
    }
    const s = document.createElement('script')
    s.src = 'https://sdk.mercadopago.com/js/v2'
    s.async = true
    s.onload = () => {
      if (window.MercadoPago) {
        setMpInstance(new window.MercadoPago(props.publicKey, { locale: 'pt-BR' }))
        setMpReady(true)
      }
    }
    s.onerror = () => setError('Falha ao carregar SDK do Mercado Pago')
    document.head.appendChild(s)
  }, [props.publicKey])

  // Polling de status para Pix/boleto
  useEffect(() => {
    if (!order || !order.orderId) return
    if (order.status === 'approved' || order.status === 'rejected' || order.status === 'cancelled' || order.status === 'expired') return
    if (method === 'card') return // cartão é síncrono

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/orders/${order.orderId}/status`)
        if (!res.ok) return
        const data = await res.json()
        setOrder(prev => prev ? { ...prev, status: data.status, statusDetail: data.statusDetail, paymentMethod: data.paymentMethod } : prev)
        if (data.status === 'approved') {
          props.onApproved?.({ ...order, status: 'approved' })
          clearInterval(interval)
        } else if (['rejected', 'cancelled', 'expired'].includes(data.status)) {
          props.onRejected?.({ ...order, status: data.status })
          clearInterval(interval)
        }
      } catch {}
    }, 4000)
    return () => clearInterval(interval)
  }, [order?.orderId, order?.status, method])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const form = e.currentTarget
      let body: Record<string, any> = { ...props.extraBody }

      if (method === 'card') {
        if (!mpInstance) throw new Error('SDK não carregou')
        const cardNumber = (form.elements.namedItem('cardNumber') as HTMLInputElement).value.replace(/\s/g, '')
        const cardholderName = (form.elements.namedItem('cardholderName') as HTMLInputElement).value
        const cardExpirationMonth = (form.elements.namedItem('cardExpirationMonth') as HTMLInputElement).value
        const cardExpirationYear = (form.elements.namedItem('cardExpirationYear') as HTMLInputElement).value
        const securityCode = (form.elements.namedItem('securityCode') as HTMLInputElement).value
        const docNumber = (form.elements.namedItem('docNumber') as HTMLInputElement).value
        const installments = Number((form.elements.namedItem('installments') as HTMLInputElement)?.value || 1)

        // Tokeniza no client
        const cardToken = await mpInstance.createCardToken({
          cardNumber,
          cardholderName,
          cardExpirationMonth,
          cardExpirationYear: cardExpirationYear.length === 2 ? `20${cardExpirationYear}` : cardExpirationYear,
          securityCode,
          identificationType: 'CPF',
          identificationNumber: docNumber.replace(/\D/g, ''),
        })

        // Detecta bandeira
        const pmResp = await mpInstance.getPaymentMethods({ bin: cardNumber.slice(0, 6) })
        const paymentMethodId = pmResp?.results?.[0]?.id || 'visa'

        body = {
          ...body,
          paymentMethodId,
          cardToken: cardToken.id,
          installments,
          payerDocumentType: 'CPF',
          payerDocumentNumber: docNumber.replace(/\D/g, ''),
        }
      } else if (method === 'pix') {
        body = { ...body, paymentMethodId: 'pix' }
      } else if (method === 'boleto') {
        const docNumber = (form.elements.namedItem('docNumber') as HTMLInputElement).value
        const payerName = (form.elements.namedItem('payerName') as HTMLInputElement).value
        body = {
          ...body,
          paymentMethodId: 'bolbradesco',
          payerDocumentType: 'CPF',
          payerDocumentNumber: docNumber.replace(/\D/g, ''),
          donationName: body.donationName || payerName,
        }
      }

      trackCheckout('checkout_submit', { paymentMethod: method })

      const res = await fetch(props.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data?.alreadyOwned && data.redirectTo) {
        window.location.href = data.redirectTo
        return
      }
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar pagamento')
      }
      setOrder(data)
      if (data.status === 'approved') props.onApproved?.(data)
      else if (['rejected', 'cancelled', 'expired'].includes(data.status)) props.onRejected?.(data)
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar')
    } finally {
      setSubmitting(false)
    }
  }

  // Tela de resultado (após criar order)
  if (order) {
    return <ResultPanel order={order} method={method} onReset={() => setOrder(null)} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Method tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {allowed.map(allowedMethod => (
          <MethodTab
            key={allowedMethod}
            active={method === allowedMethod}
            onClick={() => setMethod(allowedMethod)}
            icon={getMethodIcon(allowedMethod)}
            label={getMethodLabel(allowedMethod)}
          />
        ))}
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {method === 'card' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Número do cartão</label>
              <input
                id="cardNumber"
                name="cardNumber"
                inputMode="numeric"
                maxLength={19}
                required
                placeholder="0000 0000 0000 0000"
                style={glassInput}
              />
            </div>
            <div>
              <label style={labelStyle}>Nome impresso no cartão</label>
              <input
                id="cardholderName"
                name="cardholderName"
                required
                placeholder="Como está no cartão"
                style={glassInput}
              />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label style={labelStyle}>Mês</label>
                <input
                  id="cardExpirationMonth"
                  name="cardExpirationMonth"
                  inputMode="numeric"
                  maxLength={2}
                  required
                  placeholder="MM"
                  style={glassInput}
                />
              </div>
              <div>
                <label style={labelStyle}>Ano</label>
                <input
                  id="cardExpirationYear"
                  name="cardExpirationYear"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="AAAA"
                  style={glassInput}
                />
              </div>
              <div>
                <label style={labelStyle}>CVV</label>
                <input
                  id="securityCode"
                  name="securityCode"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="CVV"
                  style={glassInput}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label style={labelStyle}>CPF</label>
                <input
                  id="docNumber"
                  name="docNumber"
                  inputMode="numeric"
                  required
                  placeholder="000.000.000-00"
                  style={glassInput}
                />
              </div>
              <div>
                <label style={labelStyle}>Parcelas</label>
                <select
                  id="installments"
                  name="installments"
                  defaultValue={1}
                  style={{ ...glassInput, cursor: 'pointer' }}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                    <option key={n} value={n} style={{ background: 'hsl(var(--card))' }}>
                      {n}x de R$ {(props.amount / n).toFixed(2).replace('.', ',')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {method === 'pix' && (
          <div style={{
            padding: '16px',
            background: 'hsl(var(--primary) / 0.06)',
            border: '1px solid hsl(var(--primary) / 0.18)',
            borderRadius: '12px',
            color: 'hsl(var(--muted-foreground))',
            fontSize: '14px',
            lineHeight: '1.6',
          }}>
            <QrCode size={32} style={{ color: 'hsl(var(--primary))', marginBottom: '8px' }} />
            <p>Após confirmar, geraremos o QR Code e o código copia-e-cola para você pagar pelo app do seu banco.</p>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'hsl(var(--primary))' }}>O pagamento é confirmado em instantes.</p>
          </div>
        )}

        {method === 'boleto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Nome completo</label>
              <input
                id="payerName"
                name="payerName"
                required
                defaultValue={props.payerNameHint}
                style={glassInput}
              />
            </div>
            <div>
              <label style={labelStyle}>CPF</label>
              <input
                id="docNumber"
                name="docNumber"
                inputMode="numeric"
                required
                placeholder="000.000.000-00"
                style={glassInput}
              />
            </div>
            <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', padding: '10px', background: 'hsl(var(--muted) / 0.5)', borderRadius: '8px' }}>
              O boleto vence em 24h. Liberação ocorre automaticamente em até 2h após o pagamento ser compensado.
            </p>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 16px',
            background: 'hsl(var(--destructive) / 0.1)',
            border: '1px solid hsl(var(--destructive) / 0.35)',
            borderRadius: '10px',
            color: 'hsl(var(--destructive))',
            fontSize: '14px',
          }}>
            <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Footer with amount + submit */}
        <div
          style={{ borderTop: '1px solid hsl(var(--primary) / 0.12)', paddingTop: '16px' }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginBottom: '2px' }}>{props.description}</p>
            <p style={{ fontSize: '26px', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '-0.02em' }}>
              R$ {props.amount.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting || (method === 'card' && !mpReady)}
            className="w-full sm:w-auto justify-center"
            style={{
              ...submitBtn,
              opacity: (submitting || (method === 'card' && !mpReady)) ? 0.6 : 1,
              cursor: (submitting || (method === 'card' && !mpReady)) ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {method === 'card' ? 'Pagar com cartão' : method === 'pix' ? 'Gerar Pix' : 'Gerar boleto'}
          </button>
        </div>

        {/* Trust footer */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'hsl(var(--muted-foreground) / 0.6)', marginTop: '4px' }}>
          🔒 Pagamento seguro · Mercado Pago · Dados criptografados
        </p>
      </form>
    </div>
  )
}

function MethodTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} style={active ? activeTab : inactiveTab}>
      {icon}
      {label}
    </button>
  )
}

function ResultPanel({ order, method, onReset }: { order: CheckoutOrderResponse; method: Method; onReset: () => void }) {
  const [copied, setCopied] = useState(false)

  if (order.status === 'approved') {
    return (
      <div style={{
        ...glassCard,
        padding: '32px',
        textAlign: 'center',
        border: '1px solid hsl(var(--primary) / 0.45)',
        boxShadow: '0 0 40px hsl(var(--primary) / 0.18)',
      }}>
        <CheckCircle2 size={48} style={{ color: 'hsl(var(--primary))', margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'hsl(var(--primary))', marginBottom: '8px' }}>Pagamento aprovado!</h3>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px', marginBottom: '20px' }}>Tudo certo! Seu acesso foi liberado.</p>
        {order.successRedirect && (
          <button
            onClick={() => (window.location.href = order.successRedirect!)}
            style={submitBtn}
          >
            Continuar
          </button>
        )}
      </div>
    )
  }

  if (['rejected', 'cancelled', 'expired'].includes(order.status)) {
    return (
      <div style={{
        ...glassCard,
        padding: '32px',
        textAlign: 'center',
        border: '1px solid hsl(var(--destructive) / 0.4)',
        boxShadow: '0 0 40px hsl(var(--destructive) / 0.1)',
      }}>
        <AlertCircle size={48} style={{ color: 'hsl(var(--destructive))', margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'hsl(var(--destructive))', marginBottom: '8px' }}>{STATUS_LABELS[order.status]}</h3>
        {order.statusDetail && (
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px', marginBottom: '20px' }}>Detalhe: {order.statusDetail}</p>
        )}
        <button
          onClick={onReset}
          style={{
            ...inactiveTab,
            padding: '10px 24px',
            color: 'hsl(var(--foreground))',
          }}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  // Pending — Pix
  if (method === 'pix' && order.pix) {
    return (
      <div style={{ ...glassCard, padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <QrCode size={22} style={{ color: 'hsl(var(--primary))' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Pague com Pix</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginTop: '-8px' }}>
          Escaneie o QR Code abaixo com o app do seu banco ou copie o código.
        </p>
        {order.pix.qrCodeBase64 && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={`data:image/png;base64,${order.pix.qrCodeBase64}`}
              alt="QR Code Pix"
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '12px',
                border: '2px solid hsl(var(--primary) / 0.35)',
                padding: '8px',
                background: 'white',
              }}
            />
          </div>
        )}
        <div>
          <label style={labelStyle}>Código Pix copia-e-cola</label>
          <div style={{ display: 'flex', gap: '8px', minWidth: 0 }}>
            <input
              readOnly
              value={order.pix.qrCode}
              style={{ ...glassInput, fontFamily: 'monospace', fontSize: '11px', flex: 1, width: 'auto', minWidth: 0 }}
            />
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(order.pix!.qrCode)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              style={{
                ...activeTab,
                padding: '10px 16px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Copy size={14} />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Loader2 size={14} className="animate-spin" />
          Aguardando confirmação — sua tela atualiza automaticamente.
        </p>
      </div>
    )
  }

  // Pending — Boleto
  if (method === 'boleto' && order.boleto) {
    return (
      <div style={{ ...glassCard, padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Barcode size={22} style={{ color: 'hsl(var(--primary))' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Boleto gerado</h3>
        </div>
        {order.boleto.ticketUrl && (
          <a
            href={order.boleto.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={submitBtn}
          >
            <ExternalLink size={16} /> Abrir boleto em nova aba
          </a>
        )}
        {order.boleto.barcode && (
          <div>
            <label style={labelStyle}>Linha digitável</label>
            <input
              readOnly
              value={order.boleto.barcode}
              style={{ ...glassInput, fontFamily: 'monospace', fontSize: '11px' }}
            />
          </div>
        )}
        <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground) / 0.75)' }}>
          Liberação ocorre automaticamente após a compensação (até 2 dias úteis).
        </p>
      </div>
    )
  }

  // Generic pending
  return (
    <div style={{ ...glassCard, padding: '28px', textAlign: 'center' }}>
      <Loader2 size={36} style={{ color: 'hsl(var(--primary))', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
      <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '6px' }}>{STATUS_LABELS[order.status]}</h3>
      <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>{order.statusDetail || 'Processando...'}</p>
    </div>
  )
}
