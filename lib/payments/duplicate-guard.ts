import 'server-only'

import type { Db } from 'mongodb'

import type { PaymentOrder } from '../types'

const COLECAO = 'payment_orders'

/**
 * Trava contra cobrança dupla no cartão.
 *
 * Cada tentativa de checkout cria uma Order nova e um pagamento novo no
 * Mercado Pago — não existe, por padrão, nada que impeça duas tentativas
 * seguidas de virarem dois pagamentos abertos ao mesmo tempo. O caso real que
 * motivou isto: um cartão volta `pending_review_manual` (antifraude do MP em
 * revisão manual, que pode levar até 2 dias úteis) e o comprador, vendo a tela
 * presa, tenta de novo — às vezes com outro cartão. Se o MP aprovar as duas
 * tentativas, ele é cobrado duas vezes por uma decisão que não é nossa.
 *
 * A trava é deliberadamente estreita:
 *  - só entra em jogo quando a tentativa ATUAL é cartão (`cardToken` presente)
 *    — Pix e boleto não têm esse risco: só debitam quando o comprador de fato
 *    paga, então gerar um segundo QR/linha é normal e seguro;
 *  - só bloqueia se já existe outro pedido, do MESMO usuário, ainda aberto
 *    (`pending`/`in_process`) e recente — uma compra de outro produto horas
 *    depois não é o que queremos impedir, só o duplo-clique de quem acha que a
 *    primeira tentativa falhou.
 */
const STATUS_ABERTOS: PaymentOrder['status'][] = ['pending', 'in_process']

/** Janela em que uma tentativa anterior ainda conta como "em aberto agora". */
const JANELA_MS = 20 * 60 * 1000

export interface PedidoEmAberto {
  orderId: string
  status: PaymentOrder['status']
  paymentMethod?: string
  createdAt: Date
}

/**
 * Acha um pagamento em cartão do mesmo usuário, ainda pendente/em análise,
 * criado dentro da janela. `null` quando pode seguir com a criação normal.
 */
export async function pagamentoEmCartaoJaAberto(
  db: Db,
  userId: string | undefined,
): Promise<PedidoEmAberto | null> {
  // Convidado (checkout sem login, ex.: doação/rifa anônima): sem histórico
  // de usuário para cruzar, a trava não tem o que comparar.
  if (!userId) return null

  const desde = new Date(Date.now() - JANELA_MS)
  const doc = await db.collection<PaymentOrder>(COLECAO).findOne(
    {
      userId,
      status: { $in: STATUS_ABERTOS },
      createdAt: { $gte: desde },
      // Só o próprio cartão é o risco de dupla captura; Pix/boleto pendentes
      // não impedem uma nova tentativa de cartão.
      $or: [{ paymentMethod: 'credit_card' }, { paymentMethod: 'debit_card' }, { paymentMethod: { $exists: false } }],
    },
    { sort: { createdAt: -1 } },
  )
  if (!doc) return null

  return {
    orderId: String(doc._id),
    status: doc.status,
    paymentMethod: doc.paymentMethod,
    createdAt: doc.createdAt,
  }
}

/** Minutos completos desde `createdAt`, para a mensagem ao comprador. */
export function minutosDesde(data: Date): number {
  return Math.max(0, Math.round((Date.now() - data.getTime()) / 60_000))
}
