import 'server-only'

import { ObjectId, type Db } from 'mongodb'

import type { PaymentOrder } from '@/lib/types'

/**
 * Quando uma reserva de desconto deixa de valer.
 *
 * ## O problema que isto resolve
 *
 * Cupom e benefício PROUNI/FIES são reservados no instante em que o pedido
 * nasce — antes de o Mercado Pago responder — e só são devolvidos quando chega
 * a notícia de que o pagamento falhou. Acontece que essa notícia pode
 * simplesmente não vir:
 *
 *  - quem gera um Pix e não paga deixa o pedido pendente por 24h (é esse o
 *    vencimento que emitimos), e o `cancelled` do provedor chega só depois;
 *  - quem fecha a aba enquanto o checkout roda deixa um pedido `pending` que
 *    nunca chegou a existir do lado do provedor — e que, sem
 *    `providerPaymentId`, o sweeper de reconciliação nem olha.
 *
 * Nos dois casos o desconto fica preso a um pedido que jamais vai ser pago. A
 * própria pessoa, tentando de novo dois minutos depois, leva um "você já usou
 * este desconto" — o desconto que ela nunca chegou a gastar.
 *
 * Este módulo responde a única pergunta que desfaz o impasse: **o pedido que
 * segura esta reserva ainda pode virar pagamento?** Quem pergunta é o checkout,
 * na hora de reservar; quando a resposta é não, a reserva morta é desfeita e a
 * pessoa segue a compra.
 *
 * A pergunta é deliberadamente conservadora: na dúvida, o pedido conta como
 * vivo. Soltar cedo demais uma reserva de um Pix que ainda pode ser pago
 * devolveria um benefício de uso único para ser usado duas vezes.
 */

/** Status em que um pedido ainda pode virar pagamento aprovado. */
const STATUS_EM_ABERTO = new Set<PaymentOrder['status']>(['pending', 'in_process'])

/**
 * Prazo para um pedido sem `providerPaymentId`.
 *
 * O pedido é gravado antes da chamada ao provedor. Se a requisição morreu no
 * meio (deploy, timeout, aba fechada), ele fica `pending` para sempre sem
 * nunca ter existido no Mercado Pago. Passados alguns minutos sem id do
 * provedor, não há mais o que esperar.
 */
const PRAZO_SEM_PROVEDOR_MS = 15 * 60 * 1000

/** Pix e boleto são emitidos com vencimento em 24h — ver o provider do MP. */
const PRAZO_PIX_BOLETO_MS = 25 * 60 * 60 * 1000

/**
 * Cartão: o antifraude do MP pode segurar em revisão manual por até dois dias
 * úteis, então o teto aqui é folgado de propósito.
 */
const PRAZO_CARTAO_MS = 4 * 24 * 60 * 60 * 1000

export type PedidoParaChecagem = Pick<
  PaymentOrder,
  'status' | 'paymentMethod' | 'providerPaymentId' | 'createdAt'
>

export function pedidoAindaPodeSerPago(
  pedido: PedidoParaChecagem | null | undefined,
  agora = new Date()
): boolean {
  // Pedido que não existe mais (ou nunca existiu) não segura nada.
  if (!pedido) return false
  if (!STATUS_EM_ABERTO.has(pedido.status)) return false

  const criadoEm = pedido.createdAt instanceof Date ? pedido.createdAt : new Date(pedido.createdAt as any)
  // Sem data confiável, o pedido continua contando como vivo: preferimos pedir
  // para tentar mais tarde a liberar um desconto que ainda está em uso.
  if (Number.isNaN(criadoEm.getTime())) return true

  const idade = agora.getTime() - criadoEm.getTime()
  if (idade < 0) return true
  if (!pedido.providerPaymentId) return idade < PRAZO_SEM_PROVEDOR_MS

  const teto = pedido.paymentMethod === 'pix' || pedido.paymentMethod === 'boleto'
    ? PRAZO_PIX_BOLETO_MS
    : PRAZO_CARTAO_MS
  return idade < teto
}

/**
 * Dentre estes pedidos, quais ainda podem ser pagos.
 *
 * Uma consulta só para a lista inteira: isto roda no caminho do checkout, e o
 * conjunto costuma ter um ou dois ids.
 */
export async function pedidosAindaPagaveis(
  db: Db,
  orderIds: Array<string | null | undefined>,
  agora = new Date()
): Promise<Set<string>> {
  const vivos = new Set<string>()
  const ids = Array.from(
    new Set(orderIds.filter((id): id is string => Boolean(id) && ObjectId.isValid(String(id))))
  )
  if (ids.length === 0) return vivos

  const pedidos = await db
    .collection<PaymentOrder>('payment_orders')
    .find(
      { _id: { $in: ids.map((id) => new ObjectId(id)) } } as any,
      { projection: { status: 1, paymentMethod: 1, providerPaymentId: 1, createdAt: 1 } }
    )
    .toArray()

  for (const pedido of pedidos) {
    if (pedidoAindaPodeSerPago(pedido as PedidoParaChecagem, agora)) vivos.add(String(pedido._id))
  }
  return vivos
}
