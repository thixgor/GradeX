/**
 * Política de cancelamento e reembolso — função pura, testada.
 *
 * | Quem cancela              | Quando                                   | Resultado                             |
 * |---------------------------|------------------------------------------|---------------------------------------|
 * | Aluno                     | até 7 dias após pagar, antes da aula     | 100% (direito de arrependimento)      |
 * | Aluno                     | ≥ 24h antes da aula                      | 100% automático                       |
 * | Aluno                     | < 24h antes e mais de 7 dias após pagar  | ticket no suporte, admin decide       |
 * | Monitor                   | a qualquer tempo                         | 100% para todos + 1 strike no monitor |
 * | Qualquer um, sem pagamento| antes de pagar                           | só cancela (não há dinheiro)          |
 *
 * Por que os 7 dias: contratação pela internet é "fora do estabelecimento
 * comercial" e o art. 49 do CDC dá ao consumidor 7 dias para desistir com
 * devolução integral (Decreto 7.962/2013, art. 5º). Enquanto o serviço não
 * foi prestado, nenhuma regra contratual pode tirar esse direito — uma regra
 * de "menos de 24h não devolve" seria nula nesse período (art. 51, I e IV).
 *
 * Exemplo: aula sábado 19h (Brasília). Aluno cancela sexta 18h → faltam 25h →
 * reembolso automático. Cancela sexta 20h → faltam 23h → vira pedido ao suporte.
 */

import type { StatusReserva } from './tipos'

export const ANTECEDENCIA_REEMBOLSO_HORAS = 24
export const DIAS_ARREPENDIMENTO = 7
export const GARANTIA_HORAS = 48
export const STRIKES_PARA_SUSPENDER = 3
export const JANELA_STRIKES_DIAS = 90

export type DecisaoCancelamento =
  | { tipo: 'sem_pagamento' }
  | { tipo: 'reembolso_total'; arrependimento?: boolean }
  | { tipo: 'suporte' }
  | { tipo: 'proibido'; motivo: string }

export function decidirCancelamento(input: {
  ator: 'aluno' | 'monitor'
  status: StatusReserva
  inicio?: Date
  agora: Date
  haPagamento: boolean
  /** Quando o aluno pagou (o mais antigo, num grupo). Conta o prazo de arrependimento. */
  pagoEm?: Date
}): DecisaoCancelamento {
  const { ator, status, inicio, agora, haPagamento, pagoEm } = input
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
    return { tipo: 'proibido', motivo: 'A aula já começou. Se o monitor não apareceu em 15 minutos, ou houve outro problema, use "Reportar problema".' }
  }
  if (!haPagamento) return { tipo: 'sem_pagamento' }
  if (ator === 'monitor') return { tipo: 'reembolso_total' }
  if (dentroDoArrependimento(pagoEm, agora)) return { tipo: 'reembolso_total', arrependimento: true }
  const horas = inicio ? (inicio.getTime() - agora.getTime()) / 3_600_000 : Infinity
  return horas >= ANTECEDENCIA_REEMBOLSO_HORAS ? { tipo: 'reembolso_total' } : { tipo: 'suporte' }
}

/** Ainda dentro dos 7 dias do art. 49 do CDC (contados do pagamento)? */
export function dentroDoArrependimento(pagoEm: Date | undefined | null, agora: Date): boolean {
  if (!pagoEm) return false
  return agora.getTime() - new Date(pagoEm).getTime() <= DIAS_ARREPENDIMENTO * 24 * 3_600_000
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

/**
 * Janela para reportar problema: a partir de 15 min depois do INÍCIO (atraso
 * maior que 15 min sem aviso já é falta — contrato, cláusula 2.3) até as 48h
 * da garantia depois do fim. Sem o início, abre 15 min antes do fim.
 */
export function podeReportar(fim: Date | undefined, agora: Date, inicio?: Date): boolean {
  if (!fim) return false
  const abre = inicio ? inicio.getTime() + 15 * 60_000 : fim.getTime() - 15 * 60_000
  return agora.getTime() >= abre && agora.getTime() <= liberacaoDoValor(fim).getTime()
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
