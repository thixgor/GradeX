import { AccountType } from './types'

export interface TierLimits {
  examsPerDay: number
  questionsPerExam: number
  personalExamsPerDay?: number
  bancoQuestoes: boolean
  cronogramasTotal: number
  flashcardsTotal: number
  personalExamsTotal: number
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
  premium: {
    examsPerDay: 20,
    questionsPerExam: 20,
    personalExamsPerDay: 20,
    bancoQuestoes: true,
    cronogramasTotal: Infinity,
    flashcardsTotal: Infinity,
    personalExamsTotal: Infinity,
  },
  essential: {
    examsPerDay: 20,
    questionsPerExam: 20,
    personalExamsPerDay: 20,
    bancoQuestoes: true,
    cronogramasTotal: Infinity,
    flashcardsTotal: Infinity,
    personalExamsTotal: Infinity,
  },
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

export function getTierLimits(accountType?: AccountType, isAdmin?: boolean): TierLimits {
  if (isAdmin) {
    return TIER_LIMITS.admin
  }

  if (!accountType) {
    return TIER_LIMITS.gratuito
  }

  return TIER_LIMITS[accountType]
}

export function getPersonalExamsQuota(accountType?: AccountType): number {
  const limits = getTierLimits(accountType)
  return limits.personalExamsPerDay || 3
}

export function getCronogramasLimit(accountType?: AccountType): number {
  const limits = getTierLimits(accountType)
  return limits.cronogramasTotal
}

export function getFlashcardsLimit(accountType?: AccountType): number {
  const limits = getTierLimits(accountType)
  return limits.flashcardsTotal
}

export function getPersonalExamsLifetimeLimit(accountType?: AccountType): number {
  const limits = getTierLimits(accountType)
  return limits.personalExamsTotal
}

export function getUpgradeMessage(currentTier: AccountType | undefined): string {
  const currentLimits = getTierLimits(currentTier)
  const premiumLimits = TIER_LIMITS.premium

  return `You've reached your creation limit.
Upgrade to Premium for ${premiumLimits.examsPerDay} exams per day with up to ${premiumLimits.questionsPerExam} questions per exam.

Contact: (21) 99777-0936`
}
