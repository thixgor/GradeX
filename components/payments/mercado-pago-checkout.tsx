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
import { Loader2, AlertCircle, ArrowRight, Check, Copy, QrCode, CreditCard, Barcode, ExternalLink, Lock, Info, FileText, ShieldCheck } from 'lucide-react'
import { LogoAnimada } from '@/components/marca/logo-animada'
import { QrDoPix, SeloDePago } from '@/components/checkout/marca-no-pagamento'
import '@/components/checkout/checkout-vidro.css'
import { formatCpf, isValidCpf, onlyCpfDigits } from '@/lib/cpf'
import {
  computeCardInstallmentCharge,
  computeCheckoutCharge,
  DEFAULT_FEE_POLICY,
  formatBrl,
  isInstallmentAvailable,
  parsePayerCosts,
  type CheckoutCharge,
  type FeePolicy,
  type ProviderPayerCost,
} from '@/lib/payments/fees'
import {
  isDebitMethodId,
  mercadoPagoIdFromBrand,
  pickCardPaymentMethod,
  type DetectedCardMethod,
} from '@/lib/payments/card-method'
import { invalidFieldsFrom } from '@/lib/payments/invalid-fields'
import { cardTokenError, detalhesDoErroDeToken } from '@/lib/payments/card-token-errors'
import { relatarFalhaDeCartao, type FalhaDeCartaoDoNavegador } from '@/lib/payments/relatar-falha-cartao'
import { carregarScriptAntifraude, esperarDeviceId, lerDeviceId } from '@/lib/payments/device-id'
import { DesafioTresDS } from '@/components/payments/desafio-3ds'
import {
  clearPendingCheckout,
  pendingStorageKey,
  pollingDelayMs,
  readPendingCheckout,
  writePendingCheckout,
} from '@/lib/payments/polling'
import {
  brandFromMercadoPagoId,
  CardTerminal,
  detectBrand,
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

/**
 * Parcelamento que o Mercado Pago oferece para o cartão digitado, consultado
 * com o valor à vista — é esse valor que vai como `transaction_amount`.
 */
interface CardInstallmentsInfo {
  bin: string
  /** Valor à vista usado na consulta. Se o preço mudar, a consulta é refeita. */
  amount: number
  paymentMethodId: string
  issuerId: string | null
  payerCosts: ProviderPayerCost[]
}

type InstallmentsStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * `status_detail` do Mercado Pago em português. "Detalhe: cc_rejected_high_risk"
 * não diz nada a quem teve o cartão recusado — e sem saber o motivo a pessoa
 * tenta de novo do mesmo jeito, ou desiste da compra.
 */
const REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_bad_filled_card_number: 'O número do cartão está incorreto. Confira e tente de novo.',
  cc_rejected_bad_filled_date: 'A data de validade está incorreta. Confira e tente de novo.',
  cc_rejected_bad_filled_security_code: 'O código de segurança (CVV) está incorreto. Confira e tente de novo.',
  cc_rejected_bad_filled_other: 'Algum dado do cartão está incorreto. Confira número, validade, CVV e nome.',
  cc_rejected_call_for_authorize:
    'O banco pediu autorização para esta compra. Libere o pagamento no app do seu banco (ou ligue para ele) e tente de novo.',
  cc_rejected_card_disabled: 'O cartão está bloqueado ou não foi ativado. Ative-o com o banco ou use outro cartão.',
  cc_rejected_duplicated_payment: 'Você já fez um pagamento com esse valor há pouco. Se precisar pagar de novo, use outro cartão ou o Pix.',
  cc_rejected_high_risk:
    'O pagamento foi recusado pela análise de segurança do Mercado Pago (não foi o seu banco). Confira se o CPF informado é o do titular do cartão e se o nome está como impresso nele; se persistir, use outro cartão ou pague com Pix — é aprovado na hora.',
  cc_rejected_insufficient_amount: 'O cartão não tem limite suficiente. Tente menos parcelas, outro cartão ou Pix.',
  cc_rejected_invalid_installments: 'O cartão não aceita esse número de parcelas. Escolha outra opção.',
  cc_rejected_max_attempts: 'Você atingiu o limite de tentativas com este cartão. Use outro cartão ou o Pix.',
  cc_rejected_blacklist: 'Este cartão não pode ser usado nesta compra. Use outro cartão ou o Pix.',
  cc_rejected_card_error: 'O banco não conseguiu processar o cartão. Tente de novo em instantes ou use outro cartão.',
  cc_rejected_other_reason: 'O banco emissor recusou o pagamento. Fale com o seu banco, tente outro cartão ou pague com Pix.',
  cc_amount_rate_limit_exceeded: 'O cartão atingiu o limite de valor permitido. Tente outro cartão ou o Pix.',
  rejected_by_bank: 'O banco emissor recusou o pagamento. Fale com o seu banco, tente outro cartão ou pague com Pix.',
  rejected_insufficient_data: 'Faltaram dados para aprovar o pagamento. Confira o CPF e os dados do cartão.',
  cc_rejected_3ds_mandatory:
    'O banco exige uma autenticação extra para esta compra. Tente com outro cartão ou pague com Pix — é aprovado na hora.',
  cc_rejected_3ds_challenge:
    'A autenticação do banco não foi concluída. Tente de novo, use outro cartão ou pague com Pix.',
  cc_rejected_fraud: 'O banco emissor bloqueou o pagamento por segurança. Fale com o seu banco, tente outro cartão ou pague com Pix.',
  cc_rejected_card_type_not_allowed: 'Este tipo de cartão não é aceito nesta compra. Use um cartão de crédito ou pague com Pix.',
  bank_error: 'O banco não respondeu a tempo. Nenhuma cobrança foi feita — tente de novo em instantes ou pague com Pix.',
  provider_error: 'Não conseguimos confirmar o pagamento com o Mercado Pago e nenhuma cobrança foi feita. Pode tentar de novo.',
}

export function describeRejection(statusDetail?: string | null): string | null {
  if (!statusDetail) return null
  if (REJECTION_MESSAGES[statusDetail]) return REJECTION_MESSAGES[statusDetail]
  // Código novo que ainda não mapeamos: nunca mostrar só o código cru.
  return `O pagamento não foi aprovado (código ${statusDetail}). Tente outro cartão, fale com o seu banco ou pague com Pix.`
}

/**
 * Pagamento em cartão ainda sem decisão final. `provider_*` são estados
 * nossos (ver lib/payments/provider-failure.ts): o Mercado Pago demorou a
 * responder, e cobrar de novo no escuro é o que gera cobrança dupla.
 */
const PENDING_MESSAGES: Record<string, string> = {
  pending_challenge:
    'O seu banco pediu uma confirmação desta compra (3DS) e ela não foi concluída nesta tela. Aguarde: se não for confirmada em alguns minutos, o pagamento é cancelado sem cobrança e você pode tentar de novo.',
  pending_review_manual:
    'Seu cartão está em análise de segurança do Mercado Pago — pode levar até 2 dias úteis. Não é preciso pagar de novo: esta tela atualiza sozinha assim que sair o resultado.',
  pending_contingency:
    'O Mercado Pago está processando o pagamento. Em geral leva poucos minutos — não pague de novo: esta tela atualiza sozinha e você recebe a confirmação por e-mail.',
  provider_confirming:
    'Pagamento recebido pelo Mercado Pago — estamos concluindo a liberação. Não pague de novo: esta tela atualiza sozinha em instantes.',
  provider_unconfirmed:
    'O Mercado Pago demorou a responder e estamos confirmando se o pagamento entrou. Não pague de novo agora: em até 3 minutos esta tela mostra o resultado.',
}

export function describePending(statusDetail?: string | null): string {
  return (statusDetail && PENDING_MESSAGES[statusDetail]) || 'Processando o pagamento... esta tela atualiza sozinha.'
}

/**
 * Pede ao polling do checkout uma consulta imediata do pagamento — o desafio
 * do 3DS acabou de ser concluído no banco.
 */
const EVENTO_VERIFICAR_PAGAMENTO = 'checkout:verificar-pagamento'

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
  /** Cartão com 3DS: o banco pediu confirmação (`pending_challenge`). */
  threeDs?: { url: string; creq: string } | null
}

export interface MercadoPagoCheckoutProps {
  publicKey: string
  amount: number
  description: string
  /**
   * Distingue a retomada do pagamento pendente (Pix/boleto) quando a descrição
   * não basta: "Carrinho DomineAqui - 2 itens" é igual para QUALQUER carrinho de
   * dois itens, e a tela reabria o QR de um carrinho antigo no lugar do atual.
   */
  resumeKey?: string
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
  const [detectedCard, setDetectedCard] = useState<(DetectedCardMethod & { bin: string }) | null>(null)
  /**
   * Cartão de outra pessoa (pai, mãe, cônjuge): o CPF do comprador continua
   * sendo o da nota fiscal, mas a tokenização vai com o CPF do TITULAR. Mandar
   * o CPF do comprador como documento do titular é divergência que o
   * antifraude do Mercado Pago e o banco pesam contra — e virava recusa.
   */
  const [holderIsOther, setHolderIsOther] = useState(false)
  const [holderCpf, setHolderCpf] = useState('')
  /**
   * Parcelas que o MERCADO PAGO oferece para este cartão, com os valores dele.
   *
   * Antes, a tela montava as parcelas pela nossa tabela de taxas e mostrava,
   * por exemplo, 6x de R$ 49,16. Só que a conta do MP cobra os juros do
   * parcelamento do comprador e somava os dele por cima do total que mandávamos
   * — a fatura vinha 6x de R$ 56,20. Agora cada opção do <select> é a que o MP
   * devolve para o cartão digitado, e o total exibido é o da fatura.
   */
  const [cardInstallments, setCardInstallments] = useState<CardInstallmentsInfo | null>(null)
  const [installmentsStatus, setInstallmentsStatus] = useState<InstallmentsStatus>('idle')

  /** BIN atual (6 primeiros dígitos). A detecção só vale para ele. */
  const bin = card.number.replace(/\D/g, '').slice(0, 6)
  /**
   * Bandeira detectada — só enquanto o BIN for o mesmo da consulta. Sem essa
   * amarração, colar outro cartão por cima deixava valendo a bandeira do
   * anterior até a nova consulta voltar; um submit nessa janela ia com a
   * bandeira errada e o Mercado Pago recusava.
   */
  const detectedCardMethodId = detectedCard && detectedCard.bin === bin ? detectedCard.id : null
  const detectedIssuerId = detectedCard && detectedCard.bin === bin ? detectedCard.issuerId : null

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

  // Script de segurança do Mercado Pago: gera o device ID (MP_DEVICE_SESSION_ID)
  // que o antifraude usa para reconhecer o aparelho. Sem ele, cartões bons caem
  // bem mais em "cc_rejected_high_risk". Falhar aqui não trava o checkout.
  useEffect(() => {
    carregarScriptAntifraude()
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

    // Ritmo em lib/payments/polling.ts: rápido nos primeiros minutos, mais
    // espaçado depois, e NADA com a aba escondida (a pessoa está no app do
    // banco). Ao voltar para a página, consulta na hora — é o momento em que
    // o Pix acabou de ser pago.
    let parado = false
    let timer: ReturnType<typeof setTimeout> | null = null
    const inicio = Date.now()
    const visivel = () => typeof document === 'undefined' || document.visibilityState !== 'hidden'

    const consultar = async () => {
      if (parado) return
      try {
        const res = await fetch(`/api/payments/orders/${order.orderId}/status`, { cache: 'no-store' })
        if (!res.ok || parado) return
        const data = await res.json()
        if (parado) return
        setOrder(prev => prev ? { ...prev, status: data.status, statusDetail: data.statusDetail, paymentMethod: data.paymentMethod } : prev)
        if (data.status === 'approved') {
          parado = true
          props.onApproved?.({ ...order, status: 'approved' })
        } else if (['rejected', 'cancelled', 'expired'].includes(data.status)) {
          parado = true
          props.onRejected?.({ ...order, status: data.status })
        }
      } catch {}
    }

    const agendar = () => {
      if (parado) return
      timer = setTimeout(() => {
        // Sem await: se uma consulta demorar (efeitos da aprovação rodando no
        // servidor), a próxima segue no horário e lê o status já gravado.
        if (visivel()) void consultar()
        agendar()
      }, pollingDelayMs(Date.now() - inicio))
    }

    const aoVoltar = () => {
      if (visivel()) void consultar()
    }
    const agora = () => void consultar()
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('focus', aoVoltar)
    window.addEventListener('pageshow', aoVoltar)
    window.addEventListener(EVENTO_VERIFICAR_PAGAMENTO, agora)
    agendar()
    return () => {
      parado = true
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('focus', aoVoltar)
      window.removeEventListener('pageshow', aoVoltar)
      window.removeEventListener(EVENTO_VERIFICAR_PAGAMENTO, agora)
    }
  }, [order?.orderId, order?.status, method])

  // Retomada: o Android descarta a aba enquanto a pessoa paga no app do banco.
  // Sem isto, ao voltar a página recarregava no formulário — sem o QR e sem
  // acompanhar a aprovação.
  const pendingKey = pendingStorageKey(props.endpoint, props.resumeKey ? `${props.description}:${props.resumeKey}` : props.description)
  const sessao = () => (typeof window === 'undefined' ? null : (() => { try { return window.sessionStorage } catch { return null } })())
  useEffect(() => {
    const snap = readPendingCheckout<CheckoutOrderResponse, Method>(sessao(), pendingKey)
    if (snap && allowed.includes(snap.method)) {
      setMethod(snap.method)
      // O desafio do 3DS não é reaberto ao recarregar: o `creq` vale uma vez.
      setOrder(snap.order?.threeDs ? { ...snap.order, threeDs: null } : snap.order)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey])
  useEffect(() => {
    if (!order?.orderId) return
    const finalizado = ['approved', 'rejected', 'cancelled', 'expired', 'refunded', 'charged_back'].includes(order.status)
    if (finalizado) clearPendingCheckout(sessao(), pendingKey)
    else writePendingCheckout(sessao(), pendingKey, { order, method, savedAt: Date.now() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.orderId, order?.status, method, pendingKey])

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

  const isDebitCard = method === 'card' && isDebitMethodId(detectedCardMethodId)

  const maxInstallments = Math.max(1, Math.min(18, feePolicy?.maxInstallments || 18))

  /**
   * Valor À VISTA no crédito (preço + taxa do crédito 1x). É com ele que o
   * parcelamento é consultado no Mercado Pago, e é ele que vai como
   * `transaction_amount` quando o MP cobra juros do comprador.
   */
  const cardCashAmount = useMemo(
    () =>
      computeCheckoutCharge({
        baseAmount: props.amount,
        paymentMethodId: pricingMethodId,
        installments: 1,
        hasCardToken: true,
        policy: feePolicy,
      }).totalAmount,
    [props.amount, pricingMethodId, feePolicy]
  )

  /** Parcelamento do MP válido para o cartão E o valor que estão na tela agora. */
  const payerCosts: ProviderPayerCost[] | null =
    cardInstallments &&
    cardInstallments.bin === bin &&
    cardInstallments.amount === cardCashAmount &&
    cardInstallments.paymentMethodId === detectedCardMethodId
      ? cardInstallments.payerCosts
      : null

  /**
   * Só oferecemos parcelas que o Mercado Pago confirmou para o cartão. Mandar
   * um número de parcelas que o cartão não aceita vira "pagamento recusado"; e
   * mostrar um valor que não é o da fatura é o que gerou a reclamação.
   */
  const installmentOptions = useMemo(() => {
    if (!payerCosts) return [1]
    const opts = payerCosts
      .filter(pc => pc.installments <= maxInstallments && isInstallmentAvailable(pc.installments, pc, feePolicy))
      .map(pc => pc.installments)
    return opts.includes(1) ? opts : [1, ...opts]
  }, [payerCosts, maxInstallments, feePolicy])

  // Débito não parcela, e trocar de cartão (ou o limite da política) não pode
  // deixar uma seleção órfã (ex.: 12x num cartão que só vai até 6x).
  useEffect(() => {
    if (isDebitCard && installments !== 1) setInstallments(1)
    else if (!installmentOptions.includes(installments)) setInstallments(1)
  }, [isDebitCard, installments, installmentOptions])

  /** Cobrança de N parcelas conciliada com o parcelamento real do Mercado Pago. */
  const cardChargeFor = useMemo(
    () => (n: number): CheckoutCharge => {
      if (n <= 1) {
        return computeCheckoutCharge({
          baseAmount: props.amount,
          paymentMethodId: pricingMethodId,
          installments: 1,
          hasCardToken: true,
          policy: feePolicy,
        })
      }
      return computeCardInstallmentCharge({
        baseAmount: props.amount,
        paymentMethodId: pricingMethodId,
        installments: n,
        payerCost: payerCosts?.find(pc => pc.installments === n) || null,
        policy: feePolicy,
      })
    },
    [props.amount, pricingMethodId, feePolicy, payerCosts]
  )

  /**
   * Total a cobrar = preço de tabela + taxa do meio escolhido (+ juros do MP,
   * no parcelado com juros para o comprador). Mesmas funções que rodam no
   * servidor (lib/payments/fees.ts), com a mesma política.
   */
  const charge: CheckoutCharge = useMemo(() => {
    if (method === 'card' && !isDebitCard && installments > 1) return cardChargeFor(installments)
    return computeCheckoutCharge({
      baseAmount: props.amount,
      paymentMethodId: pricingMethodId,
      installments: 1,
      hasCardToken: method === 'card',
      policy: feePolicy,
    })
  }, [props.amount, pricingMethodId, method, isDebitCard, installments, feePolicy, cardChargeFor])

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


  // Detecção de bandeira pelo BIN enquanto digita (6 dígitos bastam). Só
  // refaz a consulta quando o BIN muda — não a cada dígito digitado depois.
  useEffect(() => {
    if (method !== 'card' || !mpInstance || bin.length < 6) return
    if (detectedCard?.bin === bin) return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const resp = await mpInstance.getPaymentMethods({ bin })
        const escolhido = pickCardPaymentMethod(resp?.results)
        if (!cancelled && escolhido) setDetectedCard({ ...escolhido, bin })
      } catch {
        // Falha na detecção não quebra nada: o submit refaz a consulta e, até
        // lá, a tela segue precificando como crédito.
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bin, method, mpInstance])

  // Parcelamento do Mercado Pago para o cartão digitado, no valor à vista.
  useEffect(() => {
    if (method !== 'card' || !mpInstance || bin.length < 6 || !detectedCardMethodId || isDebitCard) {
      setInstallmentsStatus('idle')
      return
    }
    if (
      cardInstallments &&
      cardInstallments.bin === bin &&
      cardInstallments.amount === cardCashAmount &&
      cardInstallments.paymentMethodId === detectedCardMethodId
    ) {
      setInstallmentsStatus('ready')
      return
    }
    let cancelled = false
    setInstallmentsStatus('loading')
    mpInstance
      .getInstallments({ amount: cardCashAmount.toFixed(2), bin, paymentTypeId: 'credit_card' })
      .then((resp: any) => {
        if (cancelled) return
        const lista: any[] = Array.isArray(resp) ? resp : []
        const linha = lista.find(l => l?.payment_method_id === detectedCardMethodId) || lista[0]
        const custos = parsePayerCosts(linha?.payer_costs)
        if (!linha || custos.length === 0) {
          setCardInstallments(null)
          setInstallmentsStatus('error')
          return
        }
        setCardInstallments({
          bin,
          amount: cardCashAmount,
          paymentMethodId: detectedCardMethodId,
          issuerId: linha?.issuer?.id != null ? String(linha.issuer.id) : null,
          payerCosts: custos,
        })
        setInstallmentsStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setCardInstallments(null)
        setInstallmentsStatus('error')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, mpInstance, bin, detectedCardMethodId, isDebitCard, cardCashAmount])

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
  const holderCpfDigits = onlyCpfDigits(holderCpf)
  const holderCpfOk = !holderIsOther || isValidCpf(holderCpfDigits)

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
    cpfOk && !submitting && (method !== 'card' || (mpReady && cardValidation.complete && holderCpfOk))

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

      // Falha de cartão que só o navegador vê → log de recusas do Analytics.
      // Dispara e esquece (relatarFalhaDeCartao nunca lança nem espera).
      let relatarCartao: ((falha: Pick<FalhaDeCartaoDoNavegador, 'etapa' | 'codigos' | 'mensagem' | 'httpStatus' | 'codigoDoServidor'>) => void) | null = null

      if (method === 'card') {
        if (!mpInstance) throw new Error('SDK não carregou')
        if (!cardValidation.complete) {
          throw new Error('Confira os dados do cartão antes de continuar.')
        }
        if (!holderCpfOk) {
          throw new Error('Informe o CPF do titular do cartão.')
        }
        const digitsOnlyCard = card.number.replace(/\D/g, '')
        const { month: cardExpirationMonth, year: cardExpirationYear } = splitExpiry(card.expiry)
        relatarCartao = falha =>
          relatarFalhaDeCartao({
            ...falha,
            origemDoFormulario: 'checkout',
            bandeira: detectedCardMethodId || undefined,
            numeroDoCartao: digitsOnlyCard,
            parcelas: charge.installments,
            valor: props.amount,
            titularDiferente: holderIsOther,
            deviceIdPresente: !!lerDeviceId(),
            endpoint: props.endpoint,
            produto: props.analytics?.productTitle || props.description,
          })

        // O script de segurança é assíncrono: com autopreenchimento dá para
        // chegar aqui antes de ele gerar o device ID. Espera um pouco — sem o
        // device ID o antifraude recusa bem mais cartão bom (high_risk).
        await esperarDeviceId()

        // Tokeniza no client
        const cardToken = await mpInstance
          .createCardToken({
            cardNumber: digitsOnlyCard,
            cardholderName: card.holder.trim().replace(/\s+/g, ' '),
            cardExpirationMonth,
            cardExpirationYear,
            securityCode: card.cvv,
            identificationType: 'CPF',
            // Documento do TITULAR do cartão (pode não ser o comprador).
            identificationNumber: holderIsOther ? holderCpfDigits : cpfDigits,
          })
          .catch((err: unknown) => {
            relatarCartao?.({ etapa: 'tokenizacao', ...detalhesDoErroDeToken(err) })
            throw cardTokenError(err)
          })
        if (!cardToken?.id) {
          relatarCartao?.({ etapa: 'tokenizacao', ...detalhesDoErroDeToken(cardToken) })
          throw cardTokenError(cardToken)
        }

        // Bandeira: a detecção já rodou enquanto ele digitava; refazemos aqui
        // só quando ela não chegou a valer (digitação rápida, rede lenta).
        let paymentMethodId: string = detectedCardMethodId || ''
        let issuerId: string | null = detectedIssuerId
        if (!paymentMethodId) {
          const pmResp = await mpInstance.getPaymentMethods({ bin: digitsOnlyCard.slice(0, 6) }).catch(() => null)
          const escolhido = pickCardPaymentMethod(pmResp?.results)
          paymentMethodId = escolhido?.id || mercadoPagoIdFromBrand(detectBrand(digitsOnlyCard)) || ''
          issuerId = escolhido?.issuerId ?? null
          if (!paymentMethodId) {
            throw new Error('Não conseguimos identificar a bandeira do cartão. Confira o número e tente de novo.')
          }
        }

        // Se a bandeira só apareceu agora e for de débito, a tela precificou
        // como crédito parcelado — e débito não parcela. Mandar as parcelas
        // assim mesmo faria o Mercado Pago recusar o pagamento.
        const debito = isDebitMethodId(paymentMethodId)

        const parcelas = debito ? 1 : charge.installments
        // Parcelado só com o parcelamento do MP em mãos: é ele que garante que
        // o total da tela é o total da fatura.
        if (parcelas > 1 && !payerCosts?.some(pc => pc.installments === parcelas)) {
          throw new Error('Não conseguimos confirmar o parcelamento deste cartão. Tente de novo em instantes ou pague à vista.')
        }
        const deviceId = lerDeviceId()

        body = {
          ...body,
          paymentMethodId,
          cardToken: cardToken.id,
          installments: parcelas,
          ...((cardInstallments?.bin === bin && cardInstallments.issuerId) || issuerId
            ? { issuer: (cardInstallments?.bin === bin && cardInstallments.issuerId) || issuerId }
            : {}),
          ...(deviceId ? { deviceId } : {}),
          // Mesmo CPF da tokenização: o servidor o usa em payer.identification.
          ...(holderIsOther ? { cardholderDocumentNumber: holderCpfDigits } : {}),
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
      }).catch((falhaDeRede: unknown) => {
        relatarCartao?.({ etapa: 'envio', codigos: [], mensagem: falhaDeRede instanceof Error ? falhaDeRede.message : 'falha de rede ao enviar' })
        throw falhaDeRede
      })
      // Resposta que não é JSON é a plataforma cortando a função (timeout,
      // 502/504) — e o pagamento pode ter entrado. Mandar "tentar de novo"
      // aqui era receita de cobrança dupla.
      const data = await res.json().catch(() => null)
      if (!data) {
        relatarCartao?.({ etapa: 'envio', codigos: [], httpStatus: res.status, mensagem: 'resposta sem JSON (função cortada pela plataforma?)' })
        throw new Error(
          'Não recebemos a resposta do pagamento a tempo. Antes de tentar de novo, confira em alguns minutos o seu e-mail ou o app do banco — se a cobrança aparecer, a compra foi concluída.'
        )
      }
      if (data?.alreadyOwned && data.redirectTo) {
        window.location.href = data.redirectTo
        return
      }
      if (!res.ok) {
        // 502 já foi registrado pelo servidor (falha na criação do pagamento):
        // relatar de novo duplicaria a linha no log.
        if (res.status !== 502) {
          relatarCartao?.({
            etapa: 'envio',
            codigos: [],
            httpStatus: res.status,
            mensagem: typeof data?.error === 'string' ? data.error : undefined,
            codigoDoServidor: typeof data?.code === 'string' ? data.code : undefined,
          })
        }
        const campos = invalidFieldsFrom(data?.details)
        throw new Error(
          campos.length > 0
            ? `${data.error || 'Dados inválidos'} (${campos.join(', ')}). Recarregue a página e tente de novo.`
            : data.error || 'Falha ao processar pagamento'
        )
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
    return (
      <ResultPanel
        order={order}
        method={method}
        onReset={() => {
          clearPendingCheckout(sessao(), pendingKey)
          setOrder(null)
        }}
      />
    )
  }

  // CPF: um campo só, montado aqui e posicionado conforme o meio — dentro do
  // terminal no cartão (onde ele é parte dos dados do cartão, inclusive para a
  // tokenização) e solto no Pix/boleto.
  const cpfErrado = cpfTouched && cpfFilled && !cpfOk
  const cpfFaltando = cpfTouched && !cpfFilled && cpfRequired
  const cpfField = (
    <div>
      <label htmlFor="docNumber" className="ck-rotulo">
        CPF do comprador
        {!cpfRequired && <small>Opcional</small>}
      </label>
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
        className="ck-campo ck-mono"
      />
      {cpfErrado ? (
        <span className="ck-ajuda" data-erro>
          CPF inválido. Confira os números digitados.
        </span>
      ) : cpfFaltando ? (
        <span className="ck-ajuda" data-erro>
          Informe seu CPF para concluir a compra.
        </span>
      ) : (
        <span className="ck-ajuda">
          <FileText size={13} />
          {cpfRequired
            ? 'Obrigatório para a emissão da nota fiscal. Se a sua conta ainda não tiver CPF, ele fica vinculado ao seu perfil.'
            : 'Só se quiser a nota fiscal no seu nome. Informando, ele fica vinculado ao seu perfil.'}
        </span>
      )}
    </div>
  )

  // Enquanto o Pix é pedido ao Mercado Pago, o quadro do Pix vira a marca
  // montando o QR — a mesma peça que, com o código em mãos, revela o QR real.
  const gerandoPix = submitting && method === 'pix'

  return (
    <div className="ck-escopo" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Meios de pagamento. Cada um mostra quanto FICA a compra por ali: com a
          taxa embutida no preço, "Pix" e "Cartão" deixaram de custar o mesmo,
          e esconder isso até o comprador trocar de aba é o tipo de surpresa
          que faz abandonar carrinho. */}
      {allowed.length > 1 && (
        <div className="ck-seg" role="radiogroup" aria-label="Forma de pagamento">
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
      )}

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
              <p className="ck-nota" style={{ margin: 0 }}>
                Cartão de débito identificado — a cobrança é à vista, sem juros de parcelamento.
              </p>
            ) : (
              <div>
                <label htmlFor="installments" className="ck-rotulo">Parcelas</label>
                <select
                  id="installments"
                  name="installments"
                  value={installments}
                  disabled={submitting}
                  onChange={e => setInstallments(Number(e.target.value) || 1)}
                  className="ck-campo"
                >
                  {installmentOptions.map(n => {
                    const opt = cardChargeFor(n)
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
                <span className="ck-ajuda">
                  {installmentsStatus === 'loading'
                    ? 'Consultando as parcelas do seu cartão no Mercado Pago...'
                    : installmentsStatus === 'error'
                      ? 'Não conseguimos consultar o parcelamento deste cartão agora — o pagamento segue à vista.'
                      : payerCosts
                        ? 'Valores do Mercado Pago para o seu cartão — é exatamente o que vem na fatura.'
                        : 'Digite o número do cartão para ver as opções de parcelamento.'}
                </span>
              </div>
            )}

            {cpfField}

            {/* Cartão de terceiro: o CPF acima é o da nota fiscal (comprador);
                a tokenização precisa do documento do TITULAR. */}
            <div>
              <label className="ck-marcar" style={{ cursor: submitting ? 'not-allowed' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={holderIsOther}
                  disabled={submitting}
                  onChange={e => setHolderIsOther(e.target.checked)}
                />
                O cartão é de outra pessoa (pai, mãe, cônjuge...)
              </label>
              {holderIsOther && (
                <div className="ck-surge" style={{ marginTop: '12px' }}>
                  <label htmlFor="holderDocNumber" className="ck-rotulo">CPF do titular do cartão</label>
                  <input
                    id="holderDocNumber"
                    name="holderDocNumber"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    disabled={submitting}
                    value={formatCpf(holderCpf)}
                    onChange={e => setHolderCpf(onlyCpfDigits(e.target.value))}
                    placeholder="000.000.000-00"
                    aria-invalid={holderCpfDigits.length === 11 && !holderCpfOk}
                    className="ck-campo ck-mono"
                  />
                  <span className="ck-ajuda" data-erro={holderCpfDigits.length === 11 && !holderCpfOk ? true : undefined}>
                    {holderCpfDigits.length === 11 && !holderCpfOk
                      ? 'CPF inválido. Confira os números digitados.'
                      : 'O banco confere o CPF de quem é dono do cartão. Divergência é um dos motivos mais comuns de recusa.'}
                  </span>
                </div>
              )}
            </div>
          </CardTerminal>
        )}

        {method === 'pix' && (
          <div className="ck-placa ck-surge" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
            {gerandoPix ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '6px 0' }} aria-live="polite">
                <QrDoPix />
                <p style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="ck-pulso" aria-hidden /> Gerando o seu Pix…
                </p>
              </div>
            ) : (
              <>
                <span
                  aria-hidden
                  style={{
                    display: 'grid', placeItems: 'center', width: '46px', height: '46px', flexShrink: 0, borderRadius: '14px',
                    color: '#fff', background: 'linear-gradient(160deg, #3fcab7, #0f8f7c)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 6px 14px -6px rgba(15,143,124,.7)',
                  }}
                >
                  <QrCode size={22} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '14.5px', fontWeight: 600, lineHeight: 1.35 }}>QR Code e copia-e-cola na próxima tela</p>
                  <p style={{ marginTop: '2px', fontSize: '13px', lineHeight: 1.45, color: 'var(--ck-texto-2)' }}>
                    Pague pelo app do seu banco. A confirmação chega em instantes e esta tela atualiza sozinha.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {method === 'boleto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label htmlFor="payerName" className="ck-rotulo">Nome completo</label>
              <input
                id="payerName"
                name="payerName"
                required
                defaultValue={props.payerNameHint}
                className="ck-campo"
              />
            </div>
            {/* Endereço — o Mercado Pago exige para gerar o boleto. */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="addrZip" className="ck-rotulo">CEP</label>
                <input id="addrZip" name="addrZip" inputMode="numeric" required placeholder="00000-000" className="ck-campo" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label htmlFor="addrStreet" className="ck-rotulo">Rua</label>
                <input id="addrStreet" name="addrStreet" required placeholder="Nome da rua" className="ck-campo" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="addrNumber" className="ck-rotulo">Número</label>
                <input id="addrNumber" name="addrNumber" required placeholder="Nº" className="ck-campo" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label htmlFor="addrNeighborhood" className="ck-rotulo">Bairro</label>
                <input id="addrNeighborhood" name="addrNeighborhood" required placeholder="Bairro" className="ck-campo" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div style={{ gridColumn: 'span 2' }}>
                <label htmlFor="addrCity" className="ck-rotulo">Cidade</label>
                <input id="addrCity" name="addrCity" required placeholder="Cidade" className="ck-campo" />
              </div>
              <div>
                <label htmlFor="addrState" className="ck-rotulo">UF</label>
                <input
                  id="addrState"
                  name="addrState"
                  required
                  maxLength={2}
                  placeholder="UF"
                  className="ck-campo"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
            <p className="ck-nota">
              <Info size={15} />
              <span>O boleto vence em 24h. A liberação é automática em até 2h depois que o pagamento compensa.</span>
            </p>
          </div>
        )}

        {error && (
          <div className="ck-erro ck-surge" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* De onde vem o acréscimo — dito em português, não só somado. */}
        {charge.feeAmount > 0 && charge.description && (
          <div className="ck-nota">
            <Info size={15} />
            <span>
              <strong>{charge.label}.</strong> {charge.description}
            </span>
          </div>
        )}

        {/* O total e o botão: o número grande é o mesmo que o botão cobra. */}
        <div style={{ borderTop: '1px solid var(--ck-sep)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '12.5px', color: 'var(--ck-texto-3)', marginBottom: '4px' }}>{props.description}</p>
              <p className="ck-total">{formatBrl(charge.totalAmount)}</p>
              {method === 'card' && charge.installments > 1 && (
                <p style={{ fontSize: '13px', color: 'var(--ck-texto-2)', marginTop: '4px' }}>
                  em {charge.installments}x de {formatBrl(charge.installmentAmount)}
                </p>
              )}
            </div>
            {charge.feeAmount > 0 && (
              <div className="ck-recibo" style={{ fontSize: '12px', minWidth: '150px' }}>
                <div className="ck-recibo-linha">
                  <span>Subtotal</span>
                  <span>{formatBrl(charge.baseAmount)}</span>
                </div>
                <div className="ck-recibo-linha">
                  <span>{charge.label}</span>
                  <span>+ {formatBrl(charge.feeAmount)}</span>
                </div>
              </div>
            )}
          </div>
          <button type="submit" disabled={!podeEnviar} className="ck-cta ck-cta-largo">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={17} />}
            {submitting
              ? method === 'pix'
                ? 'Gerando o Pix…'
                : 'Processando…'
              : method === 'card'
                ? `Pagar ${formatBrl(charge.totalAmount)}`
                : method === 'pix'
                  ? `Gerar Pix de ${formatBrl(charge.totalAmount)}`
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
        <div className="ck-confianca">
          <span><Lock size={12} /> Pagamento seguro pelo Mercado Pago</span>
          <span><ShieldCheck size={12} /> Dados criptografados</span>
        </div>
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ck-texto-3)', lineHeight: 1.6, marginTop: '-6px' }}>
          Ao concluir a compra você concorda com os{' '}
          <a href="/termos-de-servico" target="_blank" rel="noopener noreferrer" className="ck-link" style={{ fontSize: '12px' }}>
            Termos de Serviço
          </a>{' '}
          e a{' '}
          <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="ck-link" style={{ fontSize: '12px' }}>
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
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className="ck-seg-opcao"
      data-ativo={active || undefined}
    >
      <span>
        {icon}
        {label}
      </span>
      {amount && <small>{amount}</small>}
    </button>
  )
}

/**
 * Saída do QR/boleto pendente. A tela agora retoma o pagamento pendente depois
 * de recarregar a aba; sem este botão, quem desistisse do Pix ficaria preso
 * nele. Pix e boleto só cobram se a pessoa pagar — trocar de forma é seguro.
 */
function TrocarForma({ onReset }: { onReset: () => void }) {
  return (
    <button type="button" onClick={onReset} className="ck-link-discreto" style={{ alignSelf: 'center' }}>
      Escolher outra forma de pagamento
    </button>
  )
}

/** O cartão de cada resultado: vidro forte, conteúdo centrado. */
function PainelDeResultado({ children, tom }: { children: React.ReactNode; tom?: 'erro' }) {
  return (
    <div
      className="ck-escopo ck-vidro-forte ck-surge"
      style={{
        padding: '28px 22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center',
        ...(tom === 'erro' ? { boxShadow: 'inset 0 0 0 1px var(--ck-erro-borda), 0 24px 48px -28px var(--ck-sombra)' } : {}),
      }}
    >
      {children}
    </div>
  )
}

function ResultPanel({ order, method, onReset }: { order: CheckoutOrderResponse; method: Method; onReset: () => void }) {
  const [copied, setCopied] = useState(false)
  const [desafioConcluido, setDesafioConcluido] = useState(false)

  if (order.status === 'approved') {
    return (
      <PainelDeResultado>
        <SeloDePago />
        <div aria-live="polite">
          <h3 className="ck-h1" style={{ fontSize: '26px' }}>Pagamento aprovado</h3>
          <p className="ck-sub" style={{ marginTop: '6px' }}>Tudo certo. Seu acesso já foi liberado.</p>
        </div>
        {order.successRedirect && (
          <button
            type="button"
            onClick={() => (window.location.href = order.successRedirect!)}
            className="ck-cta ck-cta-verde"
            style={{ alignSelf: 'center' }}
          >
            Começar a usar <ArrowRight size={17} />
          </button>
        )}
      </PainelDeResultado>
    )
  }

  if (['rejected', 'cancelled', 'expired'].includes(order.status)) {
    return (
      <PainelDeResultado tom="erro">
        <span
          aria-hidden
          style={{
            display: 'grid', placeItems: 'center', width: '64px', height: '64px', margin: '0 auto', borderRadius: '22px',
            color: 'var(--ck-erro)', background: 'var(--ck-erro-fundo)', boxShadow: 'inset 0 0 0 1px var(--ck-erro-borda)',
          }}
        >
          <AlertCircle size={30} />
        </span>
        <div>
          <h3 className="ck-h1" style={{ fontSize: '24px' }}>{STATUS_LABELS[order.status]}</h3>
          {order.statusDetail && (
            <p className="ck-sub" style={{ fontSize: '14px' }}>{describeRejection(order.statusDetail)}</p>
          )}
          <p style={{ marginTop: '8px', fontSize: '12.5px', color: 'var(--ck-texto-3)' }}>Nada foi cobrado nesta tentativa.</p>
        </div>
        <button type="button" onClick={onReset} className="ck-botao" style={{ alignSelf: 'center' }}>
          Tentar de novo
        </button>
      </PainelDeResultado>
    )
  }

  // Pending — Pix
  if (method === 'pix' && order.pix) {
    return (
      <PainelDeResultado>
        <div>
          <h3 className="ck-h1" style={{ fontSize: '24px' }}>Seu Pix está pronto</h3>
          <p className="ck-sub" style={{ fontSize: '14px' }}>Abra o app do banco e escaneie, ou copie o código.</p>
        </div>
        <div style={{ padding: '10px 0 4px' }}>
          <QrDoPix base64={order.pix.qrCodeBase64 || null} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <label htmlFor="pix-copia-e-cola" className="ck-rotulo">Pix copia-e-cola</label>
          <div style={{ display: 'flex', gap: '8px', minWidth: 0 }}>
            <input
              id="pix-copia-e-cola"
              readOnly
              value={order.pix.qrCode}
              onFocus={e => e.currentTarget.select()}
              className="ck-campo ck-mono"
              style={{ fontSize: '12px', flex: 1, width: 'auto', minWidth: 0 }}
            />
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(order.pix!.qrCode)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className={copied ? 'ck-cta ck-cta-verde' : 'ck-cta'}
              style={{ height: '48px', padding: '0 18px', fontSize: '14px', flexShrink: 0 }}
              aria-live="polite"
            >
              {copied ? <Check size={16} /> : <Copy size={15} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--ck-texto-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <span className="ck-pulso" aria-hidden />
          Aguardando o pagamento — esta tela atualiza sozinha.
        </p>
        <TrocarForma onReset={onReset} />
      </PainelDeResultado>
    )
  }

  // Pending — Boleto
  if (method === 'boleto' && order.boleto) {
    return (
      <PainelDeResultado>
        <span
          aria-hidden
          style={{
            display: 'grid', placeItems: 'center', width: '64px', height: '64px', margin: '0 auto', borderRadius: '22px',
            color: '#fff', background: 'linear-gradient(160deg, #7c8cf8, #4553d6)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 10px 22px -10px rgba(69,83,214,.7)',
          }}
        >
          <Barcode size={30} />
        </span>
        <div>
          <h3 className="ck-h1" style={{ fontSize: '24px' }}>Boleto gerado</h3>
          <p className="ck-sub" style={{ fontSize: '14px' }}>A liberação é automática depois da compensação (até 2 dias úteis).</p>
        </div>
        {order.boleto.ticketUrl && (
          <a href={order.boleto.ticketUrl} target="_blank" rel="noopener noreferrer" className="ck-cta" style={{ alignSelf: 'center' }}>
            <ExternalLink size={16} /> Abrir boleto
          </a>
        )}
        {order.boleto.barcode && (
          <div style={{ textAlign: 'left' }}>
            <label htmlFor="boleto-linha" className="ck-rotulo">Linha digitável</label>
            <input
              id="boleto-linha"
              readOnly
              value={order.boleto.barcode}
              onFocus={e => e.currentTarget.select()}
              className="ck-campo ck-mono"
              style={{ fontSize: '12px' }}
            />
          </div>
        )}
        <TrocarForma onReset={onReset} />
      </PainelDeResultado>
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
  const detalhe = describePending(order.statusDetail)

  // Cartão com 3DS: o banco pediu que o comprador confirme a compra. O polling
  // segue rodando e troca esta tela pelo resultado assim que o MP decidir.
  if (order.statusDetail === 'pending_challenge') {
    if (order.threeDs && !desafioConcluido) {
      return (
        <div className="ck-escopo ck-vidro-forte" style={{ padding: '20px' }}>
          <DesafioTresDS
            url={order.threeDs.url}
            creq={order.threeDs.creq}
            onConcluido={() => {
              setDesafioConcluido(true)
              window.dispatchEvent(new Event(EVENTO_VERIFICAR_PAGAMENTO))
            }}
          />
        </div>
      )
    }
    return (
      <PainelDeResultado>
        <AguardandoMarca />
        <div aria-live="polite">
          <h3 className="ck-h1" style={{ fontSize: '22px' }}>
            {desafioConcluido ? 'Confirmando com o banco…' : STATUS_LABELS[order.status]}
          </h3>
          <p className="ck-sub" style={{ fontSize: '14px' }}>
            {desafioConcluido ? 'Recebemos a sua confirmação. Esta tela atualiza sozinha em instantes.' : detalhe}
          </p>
        </div>
        {!desafioConcluido && <TrocarForma onReset={onReset} />}
      </PainelDeResultado>
    )
  }

  // Generic pending
  return (
    <PainelDeResultado>
      <AguardandoMarca />
      <div aria-live="polite">
        <h3 className="ck-h1" style={{ fontSize: '22px' }}>{STATUS_LABELS[order.status]}</h3>
        <p className="ck-sub" style={{ fontSize: '14px' }}>{detalhe}</p>
      </div>
    </PainelDeResultado>
  )
}

/** Espera sem prazo (análise, banco): a moeda girando no lugar do spinner. */
function AguardandoMarca() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '96px' }} aria-hidden>
      <LogoAnimada tamanho="compacto" nome={false} modo="gerando" flutua={false} inclinacao="nenhuma" />
    </div>
  )
}
