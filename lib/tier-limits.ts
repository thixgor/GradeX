import { AccountType } from './types'

export interface TierLimits {
  examsPerDay: number
  questionsPerExam: number
  personalExamsPerDay?: number
}

export const TIER_LIMITS: Record<AccountType | 'admin', TierLimits> = {
  gratuito: {
    examsPerDay: 3,
    questionsPerExam: 5,
    personalExamsPerDay: 3,
  },
  trial: {
    examsPerDay: 10,
    questionsPerExam: 10,
    personalExamsPerDay: 10,
  },
  premium: {
    examsPerDay: 20,
    questionsPerExam: 20,
    personalExamsPerDay: 20,
  },
  admin: {
    examsPerDay: Infinity,
    questionsPerExam: Infinity,
    personalExamsPerDay: Infinity,
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

export function getUpgradeMessage(currentTier: AccountType | undefined): string {
  const currentLimits = getTierLimits(currentTier)
  const premiumLimits = TIER_LIMITS.premium

  return `You've reached your creation limit.
Upgrade to Premium for ${premiumLimits.examsPerDay} exams per day with up to ${premiumLimits.questionsPerExam} questions per exam.

Contact: (21) 99777-0936`
}
