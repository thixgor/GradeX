/**
 * O que o cliente vê da própria assinatura recorrente.
 *
 * Isto é puro de propósito: a mesma conta roda no servidor
 * (`/api/user/subscription-status`, que monta o payload) e no navegador
 * (`components/profile/subscription-card.tsx`, que decide o que mostrar). Duas
 * implementações separadas foi exatamente o que produziu o pior defeito desta
 * área — a tela dizendo "renova sozinha" para uma assinatura já cancelada.
 *
 * A regra que mais importa está em `nextBillingAt`: depois do cancelamento não
 * existe próxima cobrança. Repetir a data antiga faria a interface anunciar um
 * débito que não vai acontecer, que é o oposto do problema que este módulo veio
 * resolver.
 */

import type { SubscriptionRecord } from '@/lib/types'

/** Janela de arrependimento anunciada no FAQ de /buy — CDC, art. 49. */
export const DIAS_DE_GARANTIA = 7

export interface ResumoDaAssinatura {
  planId: string
  planName: string
  amount: number
  currency: string
  billingIntervalMonths: MesesDeRecorrencia
  status: string
  /** `true` = já cancelada; o acesso corre até `currentPeriodEndsAt`. */
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
  currentPeriodEndsAt: Date | null
  nextBillingAt: Date | null
  lastPaymentAt: Date | null
  startedAt: Date | null
}

/**
 * Monta o resumo a partir do registro do banco.
 *
 * `nomeDoPlano` vem do catálogo do admin; quando o plano foi removido de lá,
 * o chamador passa o rótulo do cargo — nunca uma string vazia, que deixaria o
 * cartão sem título.
 */
export function montarResumoDaAssinatura(
  sub: SubscriptionRecord,
  nomeDoPlano: string,
): ResumoDaAssinatura {
  const cancelada = !!sub.cancelAtPeriodEnd
  return {
    planId: sub.planId,
    planName: nomeDoPlano,
    amount: sub.amount,
    currency: sub.currency,
    billingIntervalMonths: sub.billingIntervalMonths,
    status: sub.status,
    cancelAtPeriodEnd: cancelada,
    canceledAt: sub.canceledAt || null,
    currentPeriodEndsAt: sub.currentPeriodEndsAt || null,
    // Ver o comentário do topo: cancelada não tem próxima cobrança.
    nextBillingAt: cancelada ? null : sub.nextBillingAt || null,
    lastPaymentAt: sub.lastPaymentAt || null,
    startedAt: sub.createdAt || null,
  }
}

/** Rótulo do ciclo de cobrança, como a pessoa fala. */
export function rotuloDeCicloDeCobranca(meses: number): string {
  return meses === 1 ? 'mês' : meses === 12 ? 'ano' : `${meses} meses`
}

/** Nome do período, como aparece em chip e cabeçalho ("Semestral"). */
export function rotuloDePeriodoDeCobranca(meses: number): string {
  return meses === 1
    ? 'Mensal'
    : meses === 3
      ? 'Trimestral'
      : meses === 6
        ? 'Semestral'
        : meses === 12
          ? 'Anual'
          : 'Vitalício'
}

/** Forma curta, para caber no botão de pagar ("R$ 197,00/sem."). */
export function rotuloCurtoDeCiclo(meses: number): string {
  return meses === 1 ? 'mês' : meses === 3 ? 'trim.' : meses === 6 ? 'sem.' : 'ano'
}

/**
 * Dias corridos que ainda restam da garantia. `0` significa fora do prazo — e
 * é o que esconde o botão de reembolso, em vez de oferecer um pedido que já
 * seria recusado.
 */
export function diasDeGarantiaRestantes(
  inicio: Date | string | null | undefined,
  agora: Date = new Date(),
): number {
  if (!inicio) return 0
  const inicioMs = new Date(inicio).getTime()
  if (Number.isNaN(inicioMs)) return 0
  const decorridos = (agora.getTime() - inicioMs) / 86_400_000
  return Math.max(0, Math.ceil(DIAS_DE_GARANTIA - decorridos))
}

/**
 * Recorrente ou avulso — a regra que o painel administrativo usa.
 *
 * Um plano pode ser vendido de dois jeitos que valem o mesmo na primeira
 * cobrança e nada parecido depois:
 *
 *  - RECORRENTE: preapproval do Mercado Pago, na coleção `subscriptions`.
 *    Renova sozinho, entra no MRR, tem churn e pode ser cancelado.
 *  - AVULSO: `payment_orders` com `type: 'plan'` — o modo "Pagamento único" do
 *    /buy/checkout — ou uma Serial Key comprada em /comprar. Cobra uma vez,
 *    nunca renova e não há o que cancelar.
 *
 * `/admin/analytics` chamava os dois de "Assinatura", com a mesma origem, e
 * não havia como responder "quanto dessa receita volta no mês que vem?" — que
 * é a única pergunta que a distinção existe para responder.
 */
export type TipoDeCobranca = 'recorrente' | 'avulso'

/**
 * Classifica um `payment_orders.type`.
 *
 * Só `'subscription'` é recorrente. `'plan'` NÃO é: a recorrência nunca passa
 * por /api/payments/orders — ela vira preapproval e mora em `subscriptions`.
 * Confundir os dois foi exatamente o que produziu o rótulo errado no painel.
 */
export function classificarCobrancaDoPedido(orderType?: string | null): TipoDeCobranca {
  return orderType === 'subscription' ? 'recorrente' : 'avulso'
}

/**
 * MRR estimado a partir das assinaturas vigentes.
 *
 * Exclui as que já foram canceladas. O cancelamento grava `cancelAtPeriodEnd`
 * e MANTÉM `status: 'authorized'` — é o que preserva o acesso até o fim do
 * período pago —, então uma soma pelo status inflava a projeção justamente com
 * quem acabou de sair: o número subia quando deveria cair.
 */
export function calcularReceitaRecorrente(
  vigentes: Array<{ amount?: number; cancelAtPeriodEnd?: boolean }>,
): { total: number; renovando: number; canceladasVigentes: number } {
  const renovando = vigentes.filter((sub) => !sub.cancelAtPeriodEnd)
  return {
    total: renovando.reduce((soma, sub) => soma + Number(sub.amount || 0), 0),
    renovando: renovando.length,
    canceladasVigentes: vigentes.length - renovando.length,
  }
}

/**
 * Os únicos ciclos que viram cobrança recorrente.
 *
 * Vira `auto_recurring.frequency` (com `frequency_type: 'months'`) no
 * preapproval do Mercado Pago. São os ciclos que o catálogo oferece: mensal,
 * trimestral, semestral e anual. Qualquer outro valor — 0 (vitalício), 2, 18 —
 * é vendido como pagamento único.
 */
export const MESES_DE_RECORRENCIA = [1, 3, 6, 12] as const

/** Os ciclos aceitos, como tipo. Evita repetir a união em seis arquivos. */
export type MesesDeRecorrencia = (typeof MESES_DE_RECORRENCIA)[number]

/**
 * Este plano cobra de novo sozinho?
 *
 * A REGRA MORAVA EM TRÊS LUGARES e divergia num deles. /buy/checkout e
 * /api/subscriptions conferiam uma lista fixa; o FAQ de /buy tratava como
 * recorrente tudo que não fosse vitalício. Hoje a lista é uma só, e o semestral
 * — que ficava de fora e por isso era vendido avulso — entra nela.
 *
 * Atenção ao que NÃO decide isto: `periodo` é texto livre que o admin escreve
 * ("Anual", "Mensal") e serve só de rótulo. Um plano pode se chamar "Anual" e
 * cobrar avulso, se `durationMonths` estiver 0, vazio ou 6 — é o caso dos
 * planos criados antes de o campo existir, que ficam com `undefined`.
 */
export function planoEhRecorrente(durationMonths?: number | null): boolean {
  const meses = Number(durationMonths)
  return (MESES_DE_RECORRENCIA as readonly number[]).includes(meses)
}
