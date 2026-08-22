import { AccountType } from './types'
import {
  isPlusAccount,
  normalizeAccountType,
  temAcessoAoBanco,
  PLUS_LABEL,
  PLUS_TIER,
  QUEST_LABEL,
  QUEST_TIER,
} from './account-tier'

export interface TierLimits {
  examsPerDay: number
  questionsPerExam: number
  personalExamsPerDay?: number
  bancoQuestoes: boolean
  cronogramasTotal: number
  flashcardsTotal: number
  personalExamsTotal: number
}

/**
 * Plus+ tem acesso irrestrito a tudo. Os cargos legados `premium` e
 * `essential` apontam para o mesmo objeto — nenhuma conta antiga perde nada
 * na consolidação.
 */
const PLUS_LIMITS: TierLimits = {
  examsPerDay: Infinity,
  questionsPerExam: Infinity,
  personalExamsPerDay: Infinity,
  bancoQuestoes: true,
  cronogramasTotal: Infinity,
  flashcardsTotal: Infinity,
  personalExamsTotal: Infinity,
}

export const TIER_LIMITS: Record<AccountType | 'admin', TierLimits> = {
  gratuito: {
    examsPerDay: 3,
    questionsPerExam: 5,
    personalExamsPerDay: Infinity,
    bancoQuestoes: false,
    cronogramasTotal: 5,
    flashcardsTotal: 5,
    personalExamsTotal: 5,
  },
  trial: {
    examsPerDay: 10,
    questionsPerExam: 10,
    personalExamsPerDay: 10,
    bancoQuestoes: false,
    cronogramasTotal: Infinity,
    flashcardsTotal: Infinity,
    personalExamsTotal: Infinity,
  },
  /*
   * Quest é o Banco de Questões avulso: dentro do Banco não há teto, fora dele
   * a conta vale exatamente o que vale uma gratuita. Copiar os tetos do
   * gratuito (em vez de deixar campos soltos) é o que garante que um recurso
   * novo nasça fechado para o Quest até alguém decidir incluí-lo.
   */
  quest: {
    examsPerDay: 3,
    questionsPerExam: 5,
    personalExamsPerDay: Infinity,
    bancoQuestoes: true,
    cronogramasTotal: 5,
    flashcardsTotal: 5,
    personalExamsTotal: 5,
  },
  plus: PLUS_LIMITS,
  // Legado — mesmo teto do Plus+.
  premium: PLUS_LIMITS,
  essential: PLUS_LIMITS,
  admin: {
    examsPerDay: Infinity,
    questionsPerExam: Infinity,
    personalExamsPerDay: Infinity,
    bancoQuestoes: true,
    cronogramasTotal: Infinity,
    flashcardsTotal: Infinity,
    personalExamsTotal: Infinity,
  },
}

export function getTierLimits(accountType?: AccountType | string, isAdmin?: boolean): TierLimits {
  if (isAdmin) {
    return TIER_LIMITS.admin
  }

  return TIER_LIMITS[normalizeAccountType(accountType)] || TIER_LIMITS.gratuito
}

/**
 * Pode baixar PDFs de prova (prova, gabarito, pacote, resposta comentada)?
 * Restrito a assinantes Plus+ e admins.
 *
 * Atenção: isso responde apenas "tem direito ao recurso". O teto de quantos
 * downloads cabem por hora/dia é do Plus+ Guard (`lib/plus-guard.ts`).
 */
export function canDownloadExamPdf(accountType?: string | null, isAdmin?: boolean): boolean {
  return isPlusAccount(accountType, isAdmin)
}

export function getPersonalExamsQuota(accountType?: AccountType | string): number {
  const limits = getTierLimits(accountType)
  return limits.personalExamsPerDay || 3
}

export function getCronogramasLimit(accountType?: AccountType | string): number {
  return getTierLimits(accountType).cronogramasTotal
}

export function getFlashcardsLimit(accountType?: AccountType | string): number {
  return getTierLimits(accountType).flashcardsTotal
}

export function getPersonalExamsLifetimeLimit(accountType?: AccountType | string): number {
  return getTierLimits(accountType).personalExamsTotal
}

// ─── Mapas Mentais ───────────────────────────────────────────
// Plus+ cria mapas ilimitados. Gratuito/trial mantêm apenas 1.
export const MINDMAP_FREE_LIMIT = 1

export function canCreateUnlimitedMindMaps(accountType?: string | null, isAdmin?: boolean): boolean {
  return isPlusAccount(accountType, isAdmin)
}

/**
 * Banco de questões completo — Plus+ (que inclui tudo) ou Quest (que é só ele).
 *
 * Atenção: isso responde pelo CARGO. Um plano assinado ainda pode não incluir
 * a área; no servidor, quem fecha a conta é `bancoLiberadoPeloPlano()`.
 */
export function canUseBancoQuestoes(accountType?: string | null, isAdmin?: boolean): boolean {
  return temAcessoAoBanco(accountType, isAdmin)
}

/** Manual Clínico completo — incluso no Plus+ (também vendido avulso). */
export function hasManualClinicoViaPlan(accountType?: string | null, isAdmin?: boolean): boolean {
  return isPlusAccount(accountType, isAdmin)
}

export function getUpgradeMessage(currentTier?: AccountType | string): string {
  void currentTier
  return `Você atingiu o limite do seu plano.
Assine o ${PLUS_LABEL} e libere a plataforma inteira: Manual Clínico, materiais, flashcards, aulas, mapas mentais, provas por IA e cronogramas — sem limite.

Contato: (24) 99223-0908`
}

export { PLUS_TIER, PLUS_LABEL, QUEST_TIER, QUEST_LABEL }
