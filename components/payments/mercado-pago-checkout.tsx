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
 *
 * DUAS REGRAS QUE VALEM PARA TODOS OS CHECKOUTS passam por aqui, porque este é
 * o único formulário de pagamento da plataforma (/comprar, /buy/checkout,
 * /loja/checkout, /materiais/checkout, /manual-clinico/checkout e /rifas):
 *
 *  1. TAXA OPERACIONAL / JUROS. O `amount` que as páginas passam é o preço de
 *     tabela; o que o comprador paga é esse preço MAIS a taxa que o Mercado
 *     Pago cobra pelo meio escolhido (ver lib/payments/fees.ts). O acréscimo
 *     aparece discriminado antes de confirmar — o servidor refaz exatamente a
 *     mesma conta, então o total da tela é o total cobrado.
 *
 *  2. CPF OBRIGATÓRIO em qualquer meio de pagamento (antes só cartão e boleto
 *     pediam; o Pix passava batido). É o dado da nota fiscal, e para quem está
 *     logado sem CPF no cadastro ele é anexado ao perfil pelo servidor. No Pix
 *     a exigência é configurável em /admin/settings — é o único meio em que ela
 *     é escolha nossa, já que cartão e boleto o Mercado Pago recusa sem
 *     documento.
 *
 * O formulário de cartão vive em `card-terminal.tsx`: um terminal com o cartão
 * desenhado que preenche enquanto o comprador digita.
 */

import { useEffect, useMemo, useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Copy, QrCode, CreditCard, Barcode, ExternalLink, Lock, Info, FileText } from 'lucide-react'
import { formatCpf, isValidCpf, onlyCpfDigits } from '@/lib/cpf'
import {
  computeCheckoutCharge,
  DEFAULT_FEE_POLICY,
  formatBrl,
  type CheckoutCharge,
  type FeePolicy,
} from '@/lib/payments/fees'
import {
  brandFromMercadoPagoId,
  CardTerminal,
  EMPTY_CARD_FIELDS,
  splitExpiry,
  validateCard,
  type CardFields,
  type TerminalStatus,
} from '@/components/payments/card-terminal'

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
  /**
   * Avisa a página do total REAL sempre que ele muda (troca de método, de
   * parcelas, ou quando a política de taxas chega do servidor).
   *
   * Existe porque a taxa operacional é somada aqui dentro, e as páginas de
   * checkout mostram um resumo do pedido ao lado deste formulário. Sem este
   * retorno, o resumo ficava preso ao preço de tabela enquanto o botão dizia
   * outro valor — dois números diferentes na mesma tela, sendo o maior
   * justamente o que vai ser cobrado.
   */
  onChargeChange?: (charge: CheckoutCharge) => void
  analytics?: {
    productId?: string
    productTitle?: string
    productType?: 'material' | 'flashcard' | 'package' | 'subscription' | 'plan' | 'product' | 'unknown'
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

/** Rótulo dos campos que o checkout injeta DENTRO do terminal de cartão. */
const terminalLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: 'hsl(var(--muted-foreground))',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const terminalSelect: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: '44px',
  padding: '0 13px',
  borderRadius: '10px',
  border: '1.5px solid hsl(var(--border))',
  background: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
  fontSize: '14px',
  outline: 'none',
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
  // Política de taxas vinda do servidor. Enquanto não chega, usamos a tabela
  // padrão — que é a mesma que o servidor usa quando não há override de env.
  const [feePolicy, setFeePolicy] = useState<FeePolicy>(DEFAULT_FEE_POLICY)
  const [installments, setInstallments] = useState(1)
  const [cpf, setCpf] = useState('')
  const [cpfTouched, setCpfTouched] = useState(false)
  const [card, setCard] = useState<CardFields>(EMPTY_CARD_FIELDS)
  const [focusedCardField, setFocusedCardField] = useState<keyof CardFields | null>(null)
  /**
   * Exigência de CPF no Pix, decidida em /admin/settings. Começa em `true`
   * porque é o default do servidor: um formulário que dispensa o campo e
   * depois toma 400 na criação do pagamento é pior do que um campo a mais.
   */
  const [cpfRequiredForPix, setCpfRequiredForPix] = useState(true)
  /**
   * Bandeira detectada pelo BIN enquanto o comprador digita o cartão. Serve
   * para dois fins: mandar o `payment_method_id` certo ao criar o pagamento e
   * — o que importa aqui — saber se é DÉBITO, cuja taxa é bem menor que a do
   * crédito e não admite parcelamento. Sem isso a tela mostraria juros de
   * crédito para quem vai pagar no débito.
   */
  const [detectedCardMethodId, setDetectedCardMethodId] = useState<string | null>(null)

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

  // Regras do checkout — a tela precisa mostrar o mesmo total que o servidor
  // vai cobrar e exigir os mesmos campos que ele exige. Se a rota falhar,
  // seguimos com os defaults em vez de travar o checkout: no pior caso o total
  // exibido empata com o cobrado e o CPF continua sendo pedido.
  useEffect(() => {
    let cancelled = false
    fetch('/api/payments/fees')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled || !data) return
        if (data.policy) setFeePolicy(data.policy as FeePolicy)
        if (typeof data.checkout?.cpfRequiredForPix === 'boolean') {
          setCpfRequiredForPix(data.checkout.cpfRequiredForPix)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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

  /**
   * Polling de status.
   *
   * Pix e boleto são assíncronos por natureza — sempre passam por aqui. Cartão
   * normalmente resolve na hora (approved/rejected já vem na resposta do
   * submit, e a condição acima corta o polling). Mas quando o cartão volta
   * `pending`/`in_process` — antifraude do Mercado Pago em revisão manual, que
   * pode levar até 2 dias úteis — o polling É necessário: sem ele a tela ficava
   * presa no spinner "Em análise" para sempre, mesmo depois do MP decidir do
   * lado deles. O comprador saía sem saber se a compra tinha ido ou não.
   */
  useEffect(() => {
    if (!order || !order.orderId) return
    if (order.status === 'approved' || order.status === 'rejected' || order.status === 'cancelled' || order.status === 'expired') return

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

  /**
   * `payment_method_id` usado para PRECIFICAR. No cartão ele vem da detecção de
   * bandeira pelo BIN (`debvisa`, `visa`, ...); antes disso assumimos crédito,
   * que é a taxa maior — errar para cima e corrigir ao digitar é melhor do que
   * mostrar um total menor do que o que será cobrado.
   */
  const pricingMethodId = useMemo(() => {
    if (method === 'pix') return 'pix'
    if (method === 'boleto') return 'bolbradesco'
    return detectedCardMethodId || 'credit_card'
  }, [method, detectedCardMethodId])

  const isDebitCard = useMemo(
    () => method === 'card' && !!detectedCardMethodId && /^deb|^maestro/.test(detectedCardMethodId),
    [method, detectedCardMethodId]
  )

  const maxInstallments = Math.max(1, Math.min(12, feePolicy?.maxInstallments || 12))

  const installmentOptions = useMemo(
    () => [1, 2, 3, 4, 5, 6, 8, 10, 12].filter(n => n <= maxInstallments),
    [maxInstallments]
  )

  // Débito não parcela, e mudar o limite de parcelas pela política não pode
  // deixar uma seleção órfã (ex.: 12x com o limite baixado para 6).
  useEffect(() => {
    if (isDebitCard && installments !== 1) setInstallments(1)
    else if (installments > maxInstallments) setInstallments(1)
  }, [isDebitCard, installments, maxInstallments])

  /**
   * Total a cobrar = preço de tabela + taxa do meio escolhido. Mesma função
   * que roda no servidor (lib/payments/fees.ts), com a mesma política.
   */
  const charge: CheckoutCharge = useMemo(
    () =>
      computeCheckoutCharge({
        baseAmount: props.amount,
        paymentMethodId: pricingMethodId,
        installments: method === 'card' && !isDebitCard ? installments : 1,
        hasCardToken: method === 'card',
        policy: feePolicy,
      }),
    [props.amount, pricingMethodId, method, isDebitCard, installments, feePolicy]
  )

  // O resumo do pedido, que vive fora deste componente, precisa do mesmo total
  // que o botão de pagar mostra. `onChargeChange` é a única via entre os dois.
  const onChargeChange = props.onChargeChange
  useEffect(() => {
    onChargeChange?.(charge)
  }, [charge, onChargeChange])

  /**
   * Total por MÉTODO, para as abas. O cartão entra à vista, que é como a aba
   * abre — o parcelado tem o próprio seletor lá dentro.
   */
  const chargeForMethod = useMemo(
    () => (m: Method) =>
      computeCheckoutCharge({
        baseAmount: props.amount,
        paymentMethodId: m === 'pix' ? 'pix' : m === 'boleto' ? 'bolbradesco' : 'credit_card',
        installments: 1,
        hasCardToken: m === 'card',
        policy: feePolicy,
      }),
    [props.amount, feePolicy]
  )

  /** Total de cada opção do <select> de parcelas, com os juros já somados. */
  const chargeForInstallments = useMemo(
    () => (n: number) =>
      computeCheckoutCharge({
        baseAmount: props.amount,
        paymentMethodId: pricingMethodId,
        installments: n,
        hasCardToken: true,
        policy: feePolicy,
      }),
    [props.amount, pricingMethodId, feePolicy]
  )

  // Detecção de bandeira pelo BIN enquanto digita (6 dígitos bastam).
  useEffect(() => {
    if (method !== 'card' || !mpInstance) return
    const bin = card.number.replace(/\D/g, '').slice(0, 6)
    if (bin.length < 6) {
      setDetectedCardMethodId(null)
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const resp = await mpInstance.getPaymentMethods({ bin })
        const id = resp?.results?.[0]?.id
        if (!cancelled && id) setDetectedCardMethodId(id)
      } catch {
        // Falha na detecção não quebra nada: o submit refaz a consulta e, até
        // lá, a tela segue precificando como crédito.
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [card.number, method, mpInstance])

  const cpfDigits = onlyCpfDigits(cpf)
  /**
   * O CPF só é dispensável no Pix, e só quando o painel manda. Cartão e boleto
   * o Mercado Pago recusa sem documento — ali não há o que configurar.
   */
  const cpfRequired = method !== 'pix' || cpfRequiredForPix
  const cpfFilled = cpfDigits.length > 0
  // Dispensado e em branco: segue. Preenchido, tem de ser válido — um CPF pela
  // metade não vira "opcional".
  const cpfOk = cpfFilled ? isValidCpf(cpfDigits) : !cpfRequired

  const cardValidation = useMemo(
    () => validateCard(card, brandFromMercadoPagoId(detectedCardMethodId)),
    [card, detectedCardMethodId]
  )
  const terminalStatus: TerminalStatus = submitting
    ? 'processing'
    : cardValidation.complete
      ? 'ready'
      : card.number
        ? 'filling'
        : 'idle'

  const podeEnviar =
    cpfOk && !submitting && (method !== 'card' || (mpReady && cardValidation.complete))

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const form = e.currentTarget

      // O CPF é o dado da nota fiscal. A validação de verdade é a do servidor;
      // esta aqui só evita a ida ao servidor (e, no cartão, uma tokenização)
      // com um documento que já dá para saber que não presta.
      if (!cpfOk) {
        setCpfTouched(true)
        throw new Error(
          cpfFilled
            ? 'CPF inválido. Confira os números digitados.'
            : 'Informe seu CPF para concluir a compra.'
        )
      }

      let body: Record<string, any> = {
        ...props.extraBody,
        ...(cpfFilled ? { payerDocumentType: 'CPF', payerDocumentNumber: cpfDigits } : {}),
      }

      if (method === 'card') {
        if (!mpInstance) throw new Error('SDK não carregou')
        if (!cardValidation.complete) {
          throw new Error('Confira os dados do cartão antes de continuar.')
        }
        const digitsOnlyCard = card.number.replace(/\D/g, '')
        const { month: cardExpirationMonth, year: cardExpirationYear } = splitExpiry(card.expiry)

        // Tokeniza no client
        const cardToken = await mpInstance.createCardToken({
          cardNumber: digitsOnlyCard,
          cardholderName: card.holder.trim(),
          cardExpirationMonth,
          cardExpirationYear,
          securityCode: card.cvv,
          identificationType: 'CPF',
          identificationNumber: cpfDigits,
        })

        // Bandeira: a detecção já rodou enquanto ele digitava; refazemos aqui
        // só quando ela não chegou a valer (digitação rápida, rede lenta).
        let paymentMethodId: string = detectedCardMethodId || ''
        if (!paymentMethodId) {
          const pmResp = await mpInstance.getPaymentMethods({ bin: digitsOnlyCard.slice(0, 6) })
          paymentMethodId = pmResp?.results?.[0]?.id || 'visa'
        }

        // Se a bandeira só apareceu agora e for de débito, a tela precificou
        // como crédito parcelado — e débito não parcela. Mandar as parcelas
        // assim mesmo faria o Mercado Pago recusar o pagamento.
        const debito = /^deb|^maestro/.test(paymentMethodId)

        body = {
          ...body,
          paymentMethodId,
          cardToken: cardToken.id,
          installments: debito ? 1 : charge.installments,
        }
      } else if (method === 'pix') {
        body = { ...body, paymentMethodId: 'pix' }
      } else if (method === 'boleto') {
        const getVal = (name: string) =>
          ((form.elements.namedItem(name) as HTMLInputElement | null)?.value || '').trim()
        const zip = getVal('addrZip').replace(/\D/g, '')
        const streetName = getVal('addrStreet')
        const streetNumber = getVal('addrNumber')
        const neighborhood = getVal('addrNeighborhood')
        const city = getVal('addrCity')
        const federalUnit = getVal('addrState').toUpperCase()

        if (!zip || !streetName || !streetNumber) {
          throw new Error('Preencha o endereço completo (CEP, rua e número) para gerar o boleto.')
        }

        body = {
          ...body,
          paymentMethodId: 'bolbradesco',
          payerAddress: { zipCode: zip, streetName, streetNumber, neighborhood, city, federalUnit },
        }
      }

      trackCheckout('checkout_submit', {
        paymentMethod: method,
        installments: charge.installments,
        feeAmount: charge.feeAmount,
        totalAmount: charge.totalAmount,
      })

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

  // CPF: um campo só, montado aqui e posicionado conforme o meio — dentro do
  // terminal no cartão (onde ele é parte dos dados do cartão, inclusive para a
  // tokenização) e solto no Pix/boleto.
  const cpfErrado = cpfTouched && cpfFilled && !cpfOk
  const cpfFaltando = cpfTouched && !cpfFilled && cpfRequired
  const cpfField = (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
        <label style={method === 'card' ? terminalLabel : labelStyle}>CPF do comprador</label>
        {!cpfRequired && (
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>OPCIONAL</span>
        )}
      </div>
      <input
        id="docNumber"
        name="docNumber"
        inputMode="numeric"
        autoComplete="off"
        required={cpfRequired}
        value={formatCpf(cpf)}
        onChange={e => setCpf(onlyCpfDigits(e.target.value))}
        onBlur={() => setCpfTouched(true)}
        placeholder="000.000.000-00"
        aria-invalid={cpfErrado || cpfFaltando}
        style={{
          ...(method === 'card' ? terminalSelect : glassInput),
          fontFamily: method === 'card' ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
          borderColor: cpfErrado || cpfFaltando ? 'hsl(var(--destructive) / 0.6)' : 'hsl(var(--border))',
        }}
      />
      {cpfErrado ? (
        <span style={{ display: 'block', marginTop: '5px', fontSize: '11px', color: 'hsl(var(--destructive))' }}>
          CPF inválido. Confira os números digitados.
        </span>
      ) : cpfFaltando ? (
        <span style={{ display: 'block', marginTop: '5px', fontSize: '11px', color: 'hsl(var(--destructive))' }}>
          Informe seu CPF para concluir a compra.
        </span>
      ) : (
        <span
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '5px',
            marginTop: '5px',
            fontSize: '11px',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          <FileText size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
          {cpfRequired
            ? 'Obrigatório para a emissão da nota fiscal. Se a sua conta ainda não tiver CPF, ele fica vinculado ao seu perfil.'
            : 'Só se quiser a nota fiscal no seu nome. Informando, ele fica vinculado ao seu perfil.'}
        </span>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Abas de método. Cada uma mostra quanto FICA a compra por ali: com a
          taxa embutida no preço, "Pix" e "Cartão" deixaram de custar o mesmo,
          e esconder isso até o comprador trocar de aba é o tipo de surpresa
          que faz abandonar carrinho. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {allowed.map(allowedMethod => (
          <MethodTab
            key={allowedMethod}
            active={method === allowedMethod}
            onClick={() => setMethod(allowedMethod)}
            icon={getMethodIcon(allowedMethod)}
            label={getMethodLabel(allowedMethod)}
            amount={formatBrl(chargeForMethod(allowedMethod).totalAmount)}
          />
        ))}
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {method !== 'card' && cpfField}

        {method === 'card' && (
          <CardTerminal
            fields={card}
            onChange={setCard}
            mercadoPagoMethodId={detectedCardMethodId}
            amountLabel={formatBrl(charge.totalAmount)}
            installmentLabel={
              charge.installments > 1
                ? `${charge.installments}x de ${formatBrl(charge.installmentAmount)}`
                : undefined
            }
            focused={focusedCardField}
            onFocusedChange={setFocusedCardField}
            status={terminalStatus}
            disabled={submitting}
          >
            {isDebitCard ? (
              <p
                style={{
                  margin: 0,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'hsl(var(--muted) / 0.6)',
                  fontSize: '12px',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                Cartão de débito identificado — a cobrança é à vista, sem juros de parcelamento.
              </p>
            ) : (
              <div>
                <label style={terminalLabel}>Parcelas</label>
                <select
                  id="installments"
                  name="installments"
                  value={installments}
                  disabled={submitting}
                  onChange={e => setInstallments(Number(e.target.value) || 1)}
                  style={{ ...terminalSelect, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {installmentOptions.map(n => {
                    const opt = chargeForInstallments(n)
                    return (
                      <option key={n} value={n} style={{ background: 'hsl(var(--card))' }}>
                        {n === 1
                          ? `À vista — ${formatBrl(opt.totalAmount)}`
                          : `${n}x de ${formatBrl(opt.installmentAmount)} — total ${formatBrl(opt.totalAmount)}${
                              opt.feeAmount > 0 ? ' (com juros)' : ''
                            }`}
                      </option>
                    )
                  })}
                </select>
                <span style={{ display: 'block', marginTop: '5px', fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                  O juro do parcelamento é o custo que o Mercado Pago cobra por financiar as parcelas.
                </span>
              </div>
            )}

            {cpfField}
          </CardTerminal>
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
            {/* Endereço — o Mercado Pago exige para gerar o boleto. */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label style={labelStyle}>CEP</label>
                <input
                  id="addrZip"
                  name="addrZip"
                  inputMode="numeric"
                  required
                  placeholder="00000-000"
                  style={glassInput}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Rua / Logradouro</label>
                <input
                  id="addrStreet"
                  name="addrStreet"
                  required
                  placeholder="Nome da rua"
                  style={glassInput}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label style={labelStyle}>Número</label>
                <input
                  id="addrNumber"
                  name="addrNumber"
                  required
                  placeholder="Nº"
                  style={glassInput}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Bairro</label>
                <input
                  id="addrNeighborhood"
                  name="addrNeighborhood"
                  required
                  placeholder="Bairro"
                  style={glassInput}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Cidade</label>
                <input
                  id="addrCity"
                  name="addrCity"
                  required
                  placeholder="Cidade"
                  style={glassInput}
                />
              </div>
              <div>
                <label style={labelStyle}>UF</label>
                <input
                  id="addrState"
                  name="addrState"
                  required
                  maxLength={2}
                  placeholder="UF"
                  style={{ ...glassInput, textTransform: 'uppercase' }}
                />
              </div>
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

        {/* De onde vem o acréscimo — dito em português, não só somado. */}
        {charge.feeAmount > 0 && charge.description && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '10px 12px',
              background: 'hsl(var(--muted) / 0.5)',
              borderRadius: '10px',
              fontSize: '12px',
              lineHeight: 1.5,
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong style={{ color: 'hsl(var(--foreground))' }}>{charge.label}.</strong> {charge.description}
            </span>
          </div>
        )}

        {/* Footer with amount + submit */}
        <div
          style={{ borderTop: '1px solid hsl(var(--primary) / 0.12)', paddingTop: '16px' }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginBottom: '2px' }}>{props.description}</p>
            {charge.feeAmount > 0 && (
              <div style={{ marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <span>Subtotal</span>
                  <span>{formatBrl(charge.baseAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <span>{charge.label}</span>
                  <span>+ {formatBrl(charge.feeAmount)}</span>
                </div>
              </div>
            )}
            <p style={{ fontSize: '26px', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '-0.02em' }}>
              {formatBrl(charge.totalAmount)}
            </p>
            {method === 'card' && charge.installments > 1 && (
              <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                em {charge.installments}x de {formatBrl(charge.installmentAmount)}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!podeEnviar}
            className="w-full sm:w-auto justify-center"
            style={{
              ...submitBtn,
              opacity: podeEnviar ? 1 : 0.6,
              cursor: podeEnviar ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
            {submitting
              ? 'Processando...'
              : method === 'card'
                ? `Pagar ${formatBrl(charge.totalAmount)}`
                : method === 'pix'
                  ? 'Gerar Pix'
                  : 'Gerar boleto'}
          </button>
        </div>

        {/*
          Trust footer + rodapé legal.

          Os Termos e a Política existiam como páginas e nenhum checkout da
          plataforma apontava para elas — nem /comprar, nem /buy/checkout, nem
          a loja, nem os materiais. Como todos os formulários de pagamento
          passam por este componente, o link entra uma vez aqui e vale para
          todos, no único ponto em que ele é realmente exigível: ao lado do
          botão que cobra.
        */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'hsl(var(--muted-foreground) / 0.6)', marginTop: '4px' }}>
          🔒 Pagamento seguro · Mercado Pago · Dados criptografados
        </p>
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
          Ao concluir a compra você concorda com os{' '}
          <a
            href="/termos-de-servico"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}
          >
            Termos de Serviço
          </a>{' '}
          e a{' '}
          <a
            href="/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}
          >
            Política de Privacidade
          </a>
          .
        </p>
      </form>
    </div>
  )
}

function MethodTab({
  active,
  onClick,
  icon,
  label,
  amount,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  amount?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...(active ? activeTab : inactiveTab), flexDirection: 'column', alignItems: 'flex-start', gap: '2px', padding: '8px 16px' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
        {icon}
        {label}
      </span>
      {amount && (
        <span style={{ fontSize: '11px', fontWeight: 500, opacity: active ? 0.85 : 0.75 }}>{amount}</span>
      )}
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

  /**
   * `pending_review_manual` é o antifraude do Mercado Pago segurando o cartão
   * para revisão — do lado deles, não nosso. Chega em qualquer cartão, mesmo
   * sem nada errado com ele; o gatilho é o perfil da transação, não um erro.
   * "Processando..." dava a entender que era questão de segundos; a revisão
   * deles pode levar até 2 dias úteis, e a tela agora atualiza sozinha (via
   * polling) quando resolver — sem o comprador precisar pagar de novo.
   */
  const detalhe =
    order.statusDetail === 'pending_review_manual'
      ? 'Seu cartão está em análise de segurança do Mercado Pago — pode levar até 2 dias úteis. Não é preciso pagar de novo: esta tela atualiza sozinha assim que sair o resultado.'
      : order.statusDetail || 'Processando...'

  // Generic pending
  return (
    <div style={{ ...glassCard, padding: '28px', textAlign: 'center' }}>
      <Loader2 size={36} style={{ color: 'hsl(var(--primary))', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
      <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '6px' }}>{STATUS_LABELS[order.status]}</h3>
      <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>{detalhe}</p>
    </div>
  )
}
