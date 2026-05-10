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

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, AlertCircle, Copy, QrCode, CreditCard, Barcode, ExternalLink } from 'lucide-react'

declare global {
  interface Window {
    MercadoPago?: any
  }
}

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
  allowedMethods?: Array<'card' | 'pix' | 'boleto'>
  payerEmailHint?: string
  payerNameHint?: string
  onApproved?: (resp: CheckoutOrderResponse) => void
  onRejected?: (resp: CheckoutOrderResponse) => void
}

type Method = 'card' | 'pix' | 'boleto'

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

export function MercadoPagoCheckout(props: MercadoPagoCheckoutProps) {
  const allowed: Method[] = props.allowedMethods || ['card', 'pix', 'boleto']
  const [method, setMethod] = useState<Method>(allowed[0])
  const [mpReady, setMpReady] = useState(false)
  const [mpInstance, setMpInstance] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<CheckoutOrderResponse | null>(null)

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

      const res = await fetch(props.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
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
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {allowed.includes('card') && (
          <MethodTab active={method === 'card'} onClick={() => setMethod('card')} icon={<CreditCard className="h-4 w-4" />} label="Cartão" />
        )}
        {allowed.includes('pix') && (
          <MethodTab active={method === 'pix'} onClick={() => setMethod('pix')} icon={<QrCode className="h-4 w-4" />} label="Pix" />
        )}
        {allowed.includes('boleto') && (
          <MethodTab active={method === 'boleto'} onClick={() => setMethod('boleto')} icon={<Barcode className="h-4 w-4" />} label="Boleto" />
        )}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {method === 'card' && (
          <div className="grid gap-4">
            <div>
              <Label htmlFor="cardNumber">Número do cartão</Label>
              <Input id="cardNumber" name="cardNumber" inputMode="numeric" maxLength={19} required placeholder="0000 0000 0000 0000" />
            </div>
            <div>
              <Label htmlFor="cardholderName">Nome impresso no cartão</Label>
              <Input id="cardholderName" name="cardholderName" required placeholder="Como está no cartão" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="cardExpirationMonth">Mês</Label>
                <Input id="cardExpirationMonth" name="cardExpirationMonth" inputMode="numeric" maxLength={2} required placeholder="MM" />
              </div>
              <div>
                <Label htmlFor="cardExpirationYear">Ano</Label>
                <Input id="cardExpirationYear" name="cardExpirationYear" inputMode="numeric" maxLength={4} required placeholder="AAAA" />
              </div>
              <div>
                <Label htmlFor="securityCode">CVV</Label>
                <Input id="securityCode" name="securityCode" inputMode="numeric" maxLength={4} required placeholder="CVV" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="docNumber">CPF</Label>
                <Input id="docNumber" name="docNumber" inputMode="numeric" required placeholder="000.000.000-00" />
              </div>
              <div>
                <Label htmlFor="installments">Parcelas</Label>
                <select
                  id="installments"
                  name="installments"
                  defaultValue={1}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                    <option key={n} value={n}>{n}x de R$ {(props.amount / n).toFixed(2).replace('.', ',')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {method === 'pix' && (
          <div className="text-sm text-muted-foreground">
            Após confirmar, geraremos o QR Code e o código copia-e-cola para você pagar pelo app do seu banco.
          </div>
        )}

        {method === 'boleto' && (
          <div className="grid gap-4">
            <div>
              <Label htmlFor="payerName">Nome completo</Label>
              <Input id="payerName" name="payerName" required defaultValue={props.payerNameHint} />
            </div>
            <div>
              <Label htmlFor="docNumber">CPF</Label>
              <Input id="docNumber" name="docNumber" inputMode="numeric" required placeholder="000.000.000-00" />
            </div>
            <p className="text-xs text-muted-foreground">
              O boleto vence em 24h. Liberação ocorre automaticamente em até 2h após o pagamento ser compensado.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <p className="text-sm text-muted-foreground">{props.description}</p>
            <p className="text-2xl font-bold">R$ {props.amount.toFixed(2).replace('.', ',')}</p>
          </div>
          <Button type="submit" size="lg" disabled={submitting || (method === 'card' && !mpReady)}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {method === 'card' ? 'Pagar com cartão' : method === 'pix' ? 'Gerar Pix' : 'Gerar boleto'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function MethodTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition ${
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ResultPanel({ order, method, onReset }: { order: CheckoutOrderResponse; method: Method; onReset: () => void }) {
  const [copied, setCopied] = useState(false)

  if (order.status === 'approved') {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" /> Pagamento aprovado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Tudo certo! Seu acesso foi liberado.</p>
          {order.successRedirect && (
            <Button onClick={() => (window.location.href = order.successRedirect!)}>
              Continuar
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (['rejected', 'cancelled', 'expired'].includes(order.status)) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" /> {STATUS_LABELS[order.status]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.statusDetail && <p className="text-sm text-muted-foreground">Detalhe: {order.statusDetail}</p>}
          <Button variant="outline" onClick={onReset}>Tentar novamente</Button>
        </CardContent>
      </Card>
    )
  }

  // Pending — Pix ou boleto
  if (method === 'pix' && order.pix) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" /> Pague com Pix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escaneie o QR Code abaixo com o app do seu banco ou copie o código.
          </p>
          {order.pix.qrCodeBase64 && (
            <img
              src={`data:image/png;base64,${order.pix.qrCodeBase64}`}
              alt="QR Code Pix"
              className="mx-auto h-48 w-48 border rounded-md"
            />
          )}
          <div className="space-y-2">
            <Label>Código Pix copia-e-cola</Label>
            <div className="flex gap-2">
              <Input readOnly value={order.pix.qrCode} className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(order.pix!.qrCode)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Aguardando confirmação do pagamento — sua tela atualiza automaticamente.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (method === 'boleto' && order.boleto) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" /> Boleto gerado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.boleto.ticketUrl && (
            <Button asChild>
              <a href={order.boleto.ticketUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" /> Abrir boleto em nova aba
              </a>
            </Button>
          )}
          {order.boleto.barcode && (
            <div className="space-y-2">
              <Label>Linha digitável</Label>
              <Input readOnly value={order.boleto.barcode} className="font-mono text-xs" />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Liberação ocorre automaticamente após a compensação (até 2 dias úteis).
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{STATUS_LABELS[order.status]}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{order.statusDetail || 'Processando...'}</p>
      </CardContent>
    </Card>
  )
}
