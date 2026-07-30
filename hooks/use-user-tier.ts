/**
 * Hook for user subscription tier and limits
 * Replaces 2+ independent calls to /api/user/tier-limits
 * Aggregates tier info from bootstrap endpoint
 */

import { useApi } from './use-api'
import { CACHE_DURATIONS } from '@/lib/api-client'

export interface TierLimits {
  tier: 'free' | 'trial' | 'plus'
  examsPerMonth: number
  questionsPerDay: number
  questionsPerMonth: number
  customExamsLimit: number
  flashcardsPerMonth: number
  maxGroupSize: number
  teamMembersLimit: number
  videoAccessLimit: 'none' | 'limited' | 'unlimited'
  aiGenerationLimit: number
  storageGB: number
  features: {
    proctoring: boolean
    bulkImport: boolean
    customBranding: boolean
    advancedAnalytics: boolean
    apiAccess: boolean
    sso: boolean
    prioritySupport: boolean
    offlineAccess: boolean
  }
}

export interface TierUsage {
  examsUsedThisMonth: number
  questionsUsedToday: number
  questionsUsedThisMonth: number
  customExamsCreated: number
  flashcardsUsedThisMonth: number
  aiGenerationsUsedThisMonth: number
  storageUsedGB: number
}

export interface TierInfo {
  limits: TierLimits
  usage: TierUsage
  percentageUsed: {
    exams: number
    questions: number
    aiGenerations: number
    storage: number
  }
}

/**
 * Hook: Get user tier and limits
 * All data comes from bootstrap endpoint (single request)
 *
 * Usage:
 * ```tsx
 * const { tierInfo, loading } = useUserTier()
 * console.log(tierInfo.limits.tier) // 'plus'
 * console.log(tierInfo.usage.examsUsedThisMonth) // 5
 * ```
 */
export function useUserTier(options: {
  skip?: boolean
  refetchInterval?: number // Default: no polling (limits rarely change)
} = {}) {
  const { skip = false, refetchInterval = 0 } = options

  const { data, loading, error, refetch } = useApi<TierInfo>(
    '/api/bootstrap', // Single request for all user data
    {
      skip,
      cacheDuration: CACHE_DURATIONS.TIER_LIMITS,
      refetchInterval,
    }
  )

  return {
    tierInfo: data,
    tier: data?.limits.tier,
    limits: data?.limits,
    usage: data?.usage,
    percentageUsed: data?.percentageUsed,
    loading,
    error,
    refetch,
    isPlus: data?.limits.tier === 'plus',
    isTrial: data?.limits.tier === 'trial',
    isFree: data?.limits.tier === 'free',
  }
}

/**
 * Hook: Check if user has exceeded quota
 */
export function useQuotaCheck() {
  const { tierInfo, loading } = useUserTier()

  if (!tierInfo) {
    return {
      canUseExams: !loading,
      canUseQuestions: !loading,
      canUseAiGeneration: !loading,
      canUseStorage: !loading,
      loading,
    }
  }

  const { limits, usage } = tierInfo

  return {
    // Exams quota
    canUseExams: usage.examsUsedThisMonth < limits.examsPerMonth,
    examsRemaining: Math.max(0, limits.examsPerMonth - usage.examsUsedThisMonth),
    examsUsed: usage.examsUsedThisMonth,

    // Questions quota
    canUseQuestions: usage.questionsUsedThisMonth < limits.questionsPerMonth,
    questionsRemaining: Math.max(
      0,
      limits.questionsPerMonth - usage.questionsUsedThisMonth
    ),
    questionsUsed: usage.questionsUsedThisMonth,

    // AI Generation quota
    canUseAiGeneration:
      usage.aiGenerationsUsedThisMonth < limits.aiGenerationLimit,
    aiGenerationsRemaining: Math.max(
      0,
      limits.aiGenerationLimit - usage.aiGenerationsUsedThisMonth
    ),
    aiGenerationsUsed: usage.aiGenerationsUsedThisMonth,

    // Storage quota
    canUseStorage: usage.storageUsedGB < limits.storageGB,
    storageRemaining: Math.max(0, limits.storageGB - usage.storageUsedGB),
    storageUsed: usage.storageUsedGB,

    loading,
  }
}

/**
 * Hook: Check specific feature access
 */
export function useFeatureAccess(feature: keyof TierLimits['features']) {
  const { tierInfo, loading } = useUserTier()

  return {
    hasAccess: tierInfo?.limits.features[feature] ?? false,
    loading,
  }
}
