/**
 * Quem pode gerar flashcards e provas com IA: Quest+ e Plus+ (e admin).
 *
 * Gerar com IA é a única parte destas áreas que custa dinheiro a cada clique —
 * cada deck, cada lote de questões é uma chamada paga ao Gemini. Por isso a
 * porta fica nos dois cargos pagos e em mais nenhum: o gratuito e o trial
 * continuam estudando os decks que já têm, montando prova pelo Banco (quem tem
 * Banco) e usando flashcards manuais, mas não disparam geração.
 *
 * O cargo é a régua de "pode ou não pode"; QUANTO cabe continua com o plano
 * assinado (`flashcardsIa` / `provasIa` em `lib/plan-entitlements.ts`), que
 * vale por cima quando o admin o liga.
 *
 * Client-safe: a tela usa o mesmo teste para mostrar a vitrine em vez do
 * formulário — e a rota repete o teste, porque é ela que decide.
 */

import { isPaidAccount, PLUS_LABEL, QUEST_LABEL, ROTA_ASSINATURA } from '@/lib/account-tier'

export function iaDeEstudoLiberada(accountType?: string | null, isAdmin?: boolean): boolean {
  return isPaidAccount(accountType, isAdmin)
}

export type RecursoDeIa = 'flashcards' | 'provas'

const NOME: Record<RecursoDeIa, string> = {
  flashcards: 'Flashcards com IA',
  provas: 'Provas com IA',
}

export function mensagemDeIaBloqueada(recurso: RecursoDeIa): string {
  return `${NOME[recurso]} é exclusivo para assinantes ${QUEST_LABEL} e ${PLUS_LABEL}.`
}

/** Corpo da recusa (403) das rotas — o mesmo formato que as telas já entendem (`requiresUpgrade`). */
export function corpoDeIaBloqueada(recurso: RecursoDeIa) {
  return {
    error: mensagemDeIaBloqueada(recurso),
    requiresUpgrade: true,
    upgradeUrl: ROTA_ASSINATURA,
    motivo: 'ia-exclusiva-pagantes' as const,
  }
}
