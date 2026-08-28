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
  billingIntervalMonths: 1 | 3 | 12
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
  return meses === 1 ? 'mês' : meses === 3 ? '3 meses' : meses === 12 ? 'ano' : `${meses} meses`
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
