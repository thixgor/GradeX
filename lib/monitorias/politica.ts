/**
 * Política de cancelamento e reembolso — função pura, testada.
 *
 * | Quem cancela              | Quando            | Resultado                              |
 * |---------------------------|-------------------|----------------------------------------|
 * | Aluno                     | ≥ 24h antes       | 100% automático                        |
 * | Aluno                     | < 24h antes       | ticket no suporte, admin decide        |
 * | Monitor                   | a qualquer tempo  | 100% para todos + 1 strike no monitor  |
 * | Qualquer um, sem pagamento| antes de pagar    | só cancela (não há dinheiro)           |
 *
 * Exemplo: aula sábado 19h (Brasília). Aluno cancela sexta 18h → faltam 25h →
 * reembolso automático. Cancela sexta 20h → faltam 23h → vira pedido ao suporte.
 */

import type { StatusReserva } from './tipos'

export const ANTECEDENCIA_REEMBOLSO_HORAS = 24
export const GARANTIA_HORAS = 48
export const STRIKES_PARA_SUSPENDER = 3
export const JANELA_STRIKES_DIAS = 90

export type DecisaoCancelamento =
  | { tipo: 'sem_pagamento' }
  | { tipo: 'reembolso_total' }
  | { tipo: 'suporte' }
  | { tipo: 'proibido'; motivo: string }

export function decidirCancelamento(input: {
  ator: 'aluno' | 'monitor'
  status: StatusReserva
  inicio?: Date
  agora: Date
  haPagamento: boolean
}): DecisaoCancelamento {
  const { ator, status, inicio, agora, haPagamento } = input
  const cancelaveis: StatusReserva[] = [
    'solicitada',
    'em_negociacao',
    'aguardando_assinaturas',
    'aguardando_pagamento',
    'confirmada',
  ]
  if (!cancelaveis.includes(status)) {
    return { tipo: 'proibido', motivo: 'Esta monitoria não pode mais ser cancelada por aqui. Fale com o suporte.' }
  }
  if (inicio && inicio.getTime() <= agora.getTime()) {
    return { tipo: 'proibido', motivo: 'A aula já começou. Se houve problema, use "Reportar problema".' }
  }
  if (!haPagamento) return { tipo: 'sem_pagamento' }
  if (ator === 'monitor') return { tipo: 'reembolso_total' }
  const horas = inicio ? (inicio.getTime() - agora.getTime()) / 3_600_000 : Infinity
  return horas >= ANTECEDENCIA_REEMBOLSO_HORAS ? { tipo: 'reembolso_total' } : { tipo: 'suporte' }
}

/** Strikes dentro da janela — 3 em 90 dias suspende o monitor. */
export function strikesRecentes(strikes: Array<{ em: Date }>, agora: Date): number {
  const limite = agora.getTime() - JANELA_STRIKES_DIAS * 24 * 3_600_000
  return strikes.filter((s) => new Date(s.em).getTime() >= limite).length
}

/** Quando o valor da aula sai da garantia: fim da aula + 48h. */
export function liberacaoDoValor(fim: Date): Date {
  return new Date(fim.getTime() + GARANTIA_HORAS * 3_600_000)
}

/** Até quando o aluno pode reportar problema: as mesmas 48h da garantia. */
export function podeReportar(fim: Date | undefined, agora: Date): boolean {
  if (!fim) return false
  return agora.getTime() >= fim.getTime() - 15 * 60_000 && agora.getTime() <= liberacaoDoValor(fim).getTime()
}

/**
 * Prazo para pagar depois de tudo combinado: 24h, mas nunca depois de 2h antes
 * da aula (o monitor precisa saber se a aula vai acontecer).
 */
export function prazoDePagamento(agora: Date, inicio: Date): Date {
  const vinteQuatro = agora.getTime() + 24 * 3_600_000
  const duasAntes = inicio.getTime() - 2 * 3_600_000
  return new Date(Math.max(agora.getTime() + 15 * 60_000, Math.min(vinteQuatro, duasAntes)))
}
