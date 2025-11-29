import { AccountType } from './types'

export interface TierLimits {
  examsPerDay: number
  questionsPerExam: number
}

export const TIER_LIMITS: Record<AccountType | 'admin', TierLimits> = {
  gratuito: {
    examsPerDay: 3,
    questionsPerExam: 5,
  },
  trial: {
    examsPerDay: 5,
    questionsPerExam: 10,
  },
  premium: {
    examsPerDay: 10,
    questionsPerExam: 20,
  },
  admin: {
    examsPerDay: Infinity,
    questionsPerExam: Infinity,
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

export function getUpgradeMessage(currentTier: AccountType | undefined): string {
  const currentLimits = getTierLimits(currentTier)
  const premiumLimits = TIER_LIMITS.premium

  return `You've reached your creation limit.
Upgrade to Premium for ${premiumLimits.examsPerDay} exams per day with up to ${premiumLimits.questionsPerExam} questions per exam.

Contact: (21) 99777-0936`
}
