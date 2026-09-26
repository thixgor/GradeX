import 'server-only'

import { ObjectId } from 'mongodb'
import type { Db } from 'mongodb'

import { applyPaymentResult } from './effects'
import { getPaymentProvider } from './index'
import { MercadoPagoPaymentError } from './mercado-pago/errors'
import type { ProviderOrder } from './types'
import type { PaymentOrder } from '../types'

/**
 * O que fazer quando a criação do pagamento NÃO termina limpa.
 *
 * PROBLEMA QUE ISTO RESOLVE
 * -------------------------
 * Todas as rotas de checkout tinham o mesmo `catch`: qualquer erro depois de
 * inserir a order virava `rejected / provider_error` e um 502 com a mensagem
 * crua. Dois casos em que isso cobrava o cliente e dizia a ele que não cobrou:
 *
 *  1. O Mercado Pago APROVOU o cartão e algo NOSSO falhou logo depois
 *     (gravar o resultado, liberar o acesso, auditoria). A tela dizia "falha",
 *     o pedido ficava "recusado" e o comprador tentava de novo — cobrança dupla.
 *
 *  2. A chamada ao Mercado Pago estourou o tempo ou caiu a conexão. Não dá para
 *     saber se o pagamento foi criado — e com frequência foi. Mesma história:
 *     "falha" na tela, segunda tentativa, cobrança dupla.
 *
 * Agora:
 *  - pagamento criado → a order volta para `pending` com o id do MP, e a tela
 *    fica em "confirmando" consultando o status. A próxima leitura (polling,
 *    webhook ou varredura) aplica o resultado como uma transição nova — e os
 *    efeitos (liberar acesso, e-mail) rodam de novo, que é o que faltou;
 *  - resultado incerto → procuramos o pagamento pelo `external_reference`
 *    (o id da order). Achou: segue como acima. Não achou: a order fica
 *    "aguardando confirmação" e é resolvida pelo polling em poucos minutos —
 *    sem mandar o comprador pagar de novo no escuro;
 *  - erro de validação do MP (4xx), que é certeza de que nada foi cobrado →
 *    continua o caminho de antes (recusa com mensagem).
 */

/** Pagamento criado no MP, resultado ainda por aplicar do nosso lado. */
export const PROVIDER_CONFIRMING = 'provider_confirming'
/** Não sabemos se o pagamento foi criado no MP — procurando por ele. */
export const PROVIDER_UNCONFIRMED = 'provider_unconfirmed'
/** Resolução final de um `provider_unconfirmed` que não apareceu no MP. */
export const PROVIDER_ERROR = 'provider_error'

/**
 * Quanto esperar o pagamento aparecer na busca do MP antes de concluir que ele
 * não foi criado. A busca do MP indexa em segundos; minutos é folga larga.
 */
export const UNCONFIRMED_WINDOW_MS = 3 * 60_000

/**
 * `true` quando o erro NÃO prova que nada foi cobrado: timeout, conexão caída,
 * 5xx do Mercado Pago ou erro desconhecido. Um 4xx da API (validação) é
 * resposta definitiva — o pagamento não existe.
 */
export function isAmbiguousProviderError(err: unknown): boolean {
  if (err instanceof MercadoPagoPaymentError) return false
  const e = err as any
  const status = Number(e?.status ?? e?.response?.status ?? e?.original?.status)
  if (Number.isFinite(status) && status >= 400) return status >= 500
  // O SDK lança o corpo JSON da API em erro HTTP; ele traz `cause` (lista de
  // causas de validação). Com causa, é resposta da API — não é incerteza.
  if (Array.isArray(e?.cause) && e.cause.length > 0) return false
  return true
}

/** Corpo mínimo que o checkout (mercado-pago-checkout.tsx) entende. */
export interface CheckoutResultBody {
  orderId: string
  providerPaymentId?: string
  status: ProviderOrder['status'] | 'in_process'
  statusDetail?: string
  paymentMethod?: string
  pix: ProviderOrder['pix'] | null
  boleto: ProviderOrder['boleto'] | null
  amount: number
}

function bodyFrom(orderId: string, amount: number, r: Partial<ProviderOrder> & { status: CheckoutResultBody['status'] }): CheckoutResultBody {
  return {
    orderId,
    providerPaymentId: r.providerOrderId || undefined,
    status: r.status,
    statusDetail: r.statusDetail,
    paymentMethod: r.paymentMethod,
    pix: r.pix || null,
    boleto: r.boleto || null,
    amount,
  }
}

/**
 * Deixa a order pronta para ser resolvida pelo polling/webhook/varredura como
 * uma transição NOVA (`pending` → resultado do MP). Nunca lança.
 */
async function holdOrder(db: Db, orderId: string, set: Record<string, unknown>): Promise<void> {
  try {
    await db.collection<PaymentOrder>('payment_orders').updateOne(
      { _id: new ObjectId(orderId) as any },
      { $set: { status: 'pending', updatedAt: new Date(), ...set } as any }
    )
  } catch (err) {
    console.error('[provider-failure] falha ao segurar order para confirmação:', orderId, err)
  }
}

/**
 * Tenta salvar o checkout de uma falha na criação do pagamento. Devolve o
 * corpo de resposta a enviar ao comprador, ou `null` quando o erro é definitivo
 * (nada foi cobrado) e a rota deve seguir com a recusa de sempre.
 *
 * @param created  o resultado de `createPayment`, se a chamada chegou a voltar.
 */
export async function recoverFromProviderFailure(input: {
  db: Db
  orderId: string
  amount: number
  err: unknown
  created: ProviderOrder | null
}): Promise<CheckoutResultBody | null> {
  const { db, orderId, amount } = input
  let created = input.created

  if (!created) {
    if (!isAmbiguousProviderError(input.err)) return null
    created = await findPaymentForOrder(orderId)
    if (!created) {
      console.warn('[provider-failure] resultado incerto do MP; order aguardando confirmação:', orderId)
      await holdOrder(db, orderId, { statusDetail: PROVIDER_UNCONFIRMED })
      return bodyFrom(orderId, amount, { status: 'in_process', statusDetail: PROVIDER_UNCONFIRMED })
    }
    // Achou o pagamento que "falhou": aplica como se a chamada tivesse voltado.
    try {
      const applied = await applyPaymentResult(orderId, created)
      const order = applied.order
      return bodyFrom(orderId, amount, { ...created, status: order?.status || created.status })
    } catch (err) {
      console.error('[provider-failure] falha ao aplicar pagamento recuperado:', orderId, err)
    }
  } else {
    console.error('[provider-failure] pagamento criado no MP, pós-processamento falhou:', orderId, input.err)
  }

  // Pagamento existe no MP e o nosso lado não terminou de aplicar. Volta para
  // `pending` com o id: a próxima leitura refaz a transição inteira.
  await holdOrder(db, orderId, {
    statusDetail: PROVIDER_CONFIRMING,
    providerPaymentId: created.providerOrderId,
    providerOrderId: created.providerOrderId,
  })
  return bodyFrom(orderId, amount, { ...created, status: 'in_process', statusDetail: PROVIDER_CONFIRMING })
}

/** Procura, no MP, o pagamento desta order. Nunca lança. */
export async function findPaymentForOrder(orderId: string): Promise<ProviderOrder | null> {
  try {
    const provider = getPaymentProvider()
    if (!provider.findPaymentByExternalReference) return null
    return await provider.findPaymentByExternalReference(orderId)
  } catch (err) {
    console.warn('[provider-failure] busca por external_reference falhou:', orderId, err)
    return null
  }
}

/**
 * Resolve uma order `provider_unconfirmed`: aplica o pagamento se ele
 * apareceu no MP; passada a janela sem ele aparecer, conclui que nada foi
 * cobrado e recusa (o que devolve cupom/benefício reservados).
 *
 * Usada pelo polling de status e pela varredura. Devolve a order atualizada,
 * ou `null` se nada mudou.
 */
export async function resolveUnconfirmedOrder(order: PaymentOrder): Promise<PaymentOrder | null> {
  if (order.status !== 'pending' || order.statusDetail !== PROVIDER_UNCONFIRMED || order.providerPaymentId) {
    return null
  }
  const orderId = String(order._id)
  const found = await findPaymentForOrder(orderId)
  if (found) {
    const applied = await applyPaymentResult(orderId, found)
    return applied.order
  }
  const desde = new Date(order.updatedAt || order.createdAt).getTime()
  if (Date.now() - desde < UNCONFIRMED_WINDOW_MS) return null
  const applied = await applyPaymentResult(orderId, {
    providerOrderId: '',
    status: 'rejected',
    statusDetail: PROVIDER_ERROR,
    amount: order.amount,
    currency: order.currency || 'BRL',
    paymentMethod: (order.paymentMethod as any) || 'unknown',
    raw: null,
  } as ProviderOrder)
  return applied.order
}
