import 'server-only'

import type { Db } from 'mongodb'

import { getPaymentProvider } from './index'
import {
  applyPaymentResult,
  concluirEfeitosInterrompidos,
  EFEITOS_INTERROMPIDOS_APOS_MS,
  filtroDeEfeitosInterrompidos,
} from './effects'
import { PROVIDER_UNCONFIRMED, findPaymentForOrder, resolveUnconfirmedOrder } from './provider-failure'
import type { PaymentOrder } from '../types'

export interface ResultadoDaVarredura {
  checked: number
  reconciled: number
  approved: number
  errors: number
  /** Pedidos sem id de pagamento achados no MP pela referência. */
  foundByReference?: number
  /** Pedidos aprovados cujos efeitos (acesso, impresso, e-mail) foram terminados. */
  effectsResumed?: number
}

/** De onde a varredura foi chamada — aparece no painel ("última verificação"). */
export type OrigemDaVarredura = 'cron' | 'cron_assinaturas' | 'admin'

/** Documento único com a última execução, lido pelo painel de verificação. */
export const COLECAO_DE_VARREDURAS = 'payment_sweeps'

/**
 * Pedido pendente SEM id de pagamento: a função caiu entre gravar o pedido e
 * ouvir a resposta do Mercado Pago (o prazo de 30 s esgotou, por exemplo). Se
 * o MP cobrou mesmo assim, só o webhook salvava — e, sem o id, nem a varredura
 * nem a tela consultavam nada. Busca pelo id do pedido (`external_reference`)
 * a partir de alguns minutos, por até dois dias, no máximo uma vez por hora.
 */
const SEM_ID_A_PARTIR_DE_MS = 5 * 60_000
const SEM_ID_ATE_MS = 48 * 60 * 60_000
const SEM_ID_INTERVALO_MS = 60 * 60_000
const SEM_ID_POR_EXECUCAO = 40

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
  opcoes: { limite?: number; prazo?: number; origem?: OrigemDaVarredura } = {},
): Promise<ResultadoDaVarredura> {
  const inicio = new Date()
  const stats = await varrer(db, opcoes)
  // Registro da execução para o painel ("o cron está rodando?"). Nunca derruba
  // a varredura.
  await db
    .collection(COLECAO_DE_VARREDURAS)
    .updateOne(
      { _id: 'ultima' as any },
      { $set: { iniciadaEm: inicio, terminadaEm: new Date(), origem: opcoes.origem || 'cron', stats } },
      { upsert: true }
    )
    .catch((err) => console.error('[payments-sweep] registro da execução falhou:', err))
  return stats
}

async function varrer(
  db: Db,
  opcoes: { limite?: number; prazo?: number },
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

  // Pedidos cuja criação não teve resposta clara do MP (timeout): ainda sem
  // id do pagamento, então a consulta acima não os alcança. Procura pelo id da
  // order; se não aparecer, a janela vence e vira recusa (devolvendo cupom).
  const incertos = await ordersCol
    .find({
      status: 'pending',
      statusDetail: PROVIDER_UNCONFIRMED,
      providerPaymentId: { $in: [null, ''] },
      createdAt: { $gte: since },
    } as any)
    .sort({ createdAt: -1 })
    .limit(limite)
    .toArray()

  for (const order of incertos) {
    if (Date.now() > prazo) break
    stats.checked++
    try {
      const resolved = await resolveUnconfirmedOrder(order)
      if (resolved && resolved.status !== order.status) {
        stats.reconciled++
        if (resolved.status === 'approved') stats.approved++
      }
    } catch (err) {
      stats.errors++
      console.error('[payments-sweep] unconfirmed fail', String(order._id), err)
    }
  }

  // Pedidos pendentes que nunca receberam o id do pagamento — ver
  // SEM_ID_A_PARTIR_DE_MS acima.
  const agora = Date.now()
  const semId = await ordersCol
    .find({
      status: 'pending',
      statusDetail: { $nin: [PROVIDER_UNCONFIRMED] },
      providerPaymentId: { $in: [null, ''] },
      createdAt: { $gte: new Date(agora - SEM_ID_ATE_MS), $lte: new Date(agora - SEM_ID_A_PARTIR_DE_MS) },
      $or: [
        { buscaPorReferenciaEm: { $exists: false } },
        { buscaPorReferenciaEm: { $lt: new Date(agora - SEM_ID_INTERVALO_MS) } },
      ],
    } as any)
    .sort({ createdAt: -1 })
    .limit(SEM_ID_POR_EXECUCAO)
    .toArray()

  for (const order of semId) {
    if (Date.now() > prazo) break
    stats.checked++
    try {
      await ordersCol.updateOne({ _id: order._id as any }, { $set: { buscaPorReferenciaEm: new Date() } })
      const found = await findPaymentForOrder(String(order._id))
      if (!found) continue
      stats.foundByReference = (stats.foundByReference || 0) + 1
      const applied = await applyPaymentResult(String(order._id), found)
      const newStatus = applied.order?.status || found.status
      if (newStatus !== order.status) {
        stats.reconciled++
        if (newStatus === 'approved') stats.approved++
      }
    } catch (err) {
      stats.errors++
      console.error('[payments-sweep] busca por referência falhou', String(order._id), err)
    }
  }

  // Aprovados cujos efeitos morreram no meio (acesso, impresso, e-mail).
  const interrompidos = await ordersCol
    .find({
      ...filtroDeEfeitosInterrompidos(),
      effectsStartedAt: { $gte: since, $lt: new Date(Date.now() - EFEITOS_INTERROMPIDOS_APOS_MS) },
      // Só os que dá para repetir (ver efeitosRepetiveis) e que não esgotaram
      // as tentativas — sem isso os mesmos ocupariam o lote toda vez.
      type: { $in: ['material', 'physical'] },
      effectsRetries: { $not: { $gte: 3 } },
    } as any)
    .project({ _id: 1 })
    .sort({ effectsStartedAt: -1 })
    .limit(20)
    .toArray()

  for (const order of interrompidos) {
    if (Date.now() > prazo) break
    try {
      if ((await concluirEfeitosInterrompidos(String(order._id))) === 'concluidos') {
        stats.effectsResumed = (stats.effectsResumed || 0) + 1
      }
    } catch (err) {
      stats.errors++
      console.error('[payments-sweep] retomada de efeitos falhou', String(order._id), err)
    }
  }

  return stats
}
