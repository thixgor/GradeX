import 'server-only'

import type { Db } from 'mongodb'

import { getPaymentProvider } from './index'
import { applyPaymentResult } from './effects'
import type { PaymentOrder } from '../types'

export interface ResultadoDaVarredura {
  checked: number
  reconciled: number
  approved: number
  errors: number
}

/**
 * Reconcilia pedidos únicos (Pix, cartão, boleto — doações, rifas, materiais,
 * planos avulsos) presos em `pending`/`in_process`.
 *
 * Motivo: a transição pending → approved depende do webhook do MP (ou do
 * polling do navegador do comprador enquanto a página fica aberta). Se o
 * webhook não chega ou falha, e o comprador fecha a aba, o pedido fica preso
 * no nosso banco mesmo já aprovado no MP — só um admin abrindo o analytics e
 * clicando "Aprovar manualmente" um por um corrige isso.
 *
 * Extraída para uma função à parte porque é chamada de DOIS lugares:
 *  - `/api/cron/payments-sweeper`, para quem quiser bater nela de fora
 *    (manual, ou um agendador externo, se um dia fizer sentido rodar mais
 *    vezes ao dia que o cron de assinaturas);
 *  - `/api/cron/subscriptions-sweeper`, que já é um Vercel Cron agendado.
 *    Rodar aqui TAMBÉM é o que garante a reconciliação sem depender de
 *    nenhuma conta nova, nenhum agendador externo, nada que alguém precise
 *    lembrar de manter — ela anda junto de um cron que já existe e já roda
 *    sozinho.
 *
 * `prazo` é o instante-limite (epoch ms) até quando ainda vale começar mais
 * uma reconsulta ao MP — quando chamada "de carona" no cron de assinaturas,
 * que já gasta parte do próprio orçamento de tempo antes de chegar aqui, é
 * isso que impede a função de estourar o `maxDuration` da rota inteira.
 */
export async function reconciliarPagamentosPendentes(
  db: Db,
  opcoes: { limite?: number; prazo?: number } = {},
): Promise<ResultadoDaVarredura> {
  const limite = Math.min(300, opcoes.limite ?? 300)
  const prazo = opcoes.prazo ?? Date.now() + 4 * 60_000

  const ordersCol = db.collection<PaymentOrder>('payment_orders')

  // Janela: só reconciliar pedidos recentes. Pix/boleto vencem em 24h; damos
  // uma folga ampla para cobrir cartões em análise (pending_review_manual do
  // MP pode levar até 2 dias úteis) e retries perdidos.
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const stats: ResultadoDaVarredura = { checked: 0, reconciled: 0, approved: 0, errors: 0 }

  const candidates = await ordersCol
    .find({
      status: { $in: ['pending', 'in_process'] },
      providerPaymentId: { $exists: true, $nin: [null, ''] },
      createdAt: { $gte: since },
    } as any)
    .sort({ createdAt: -1 })
    .limit(limite)
    .toArray()

  const provider = getPaymentProvider()

  for (const order of candidates) {
    // Estourou o orçamento de tempo: o que sobrar fica pra próxima execução —
    // nenhum pedido é perdido, só adiado.
    if (Date.now() > prazo) break

    stats.checked++
    try {
      const result = await provider.getPayment(order.providerPaymentId!)
      const prevStatus = order.status
      const applied = await applyPaymentResult(String(order._id), result)
      const newStatus = applied.order?.status || result.status
      if (newStatus !== prevStatus) {
        stats.reconciled++
        if (newStatus === 'approved') stats.approved++
      }
    } catch (err) {
      stats.errors++
      console.error('[payments-sweep] reconcile fail', String(order._id), order.providerPaymentId, err)
    }
  }

  return stats
}
