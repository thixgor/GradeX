/**
 * Centralized Bootstrap Hook
 * Single source of truth for all user session data
 *
 * Replaces:
 * - Multiple /api/auth/me calls
 * - /api/auth/check-ban calls
 * - /api/user/tier-limits calls
 * - Initial notification count
 *
 * Benefits:
 * - Single HTTP request for all user data
 * - Request deduplication (concurrent mounts share same request)
 * - 5-minute client-side caching
 * - Automatic stale-while-revalidate
 * - Centralized state management
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAPI, invalidateCache, CACHE_DURATIONS } from '@/lib/api-client'

// Types matching the bootstrap endpoint response
export interface BootstrapUser {
  _id: string
  email: string
  name: string
  role: 'admin' | 'user'
  emailVerified: boolean
  accountType: 'free' | 'trial' | 'premium'
  trialExpiresAt?: string
  trialDaysUsed?: number
  trialDaysRemaining?: number
  isBanned: boolean
  banReason?: string
  banDetails?: string
  bannedAt?: string
  subscriptionStartDate?: string
  subscriptionEndDate?: string
}

export interface BootstrapTierLimits {
  tier: 'free' | 'trial' | 'premium'
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

export interface BootstrapTierUsage {
  examsUsedThisMonth: number
  questionsUsedToday: number
  questionsUsedThisMonth: number
  customExamsCreated: number
  flashcardsUsedThisMonth: number
  aiGenerationsUsedThisMonth: number
  storageUsedGB: number
}

export interface BootstrapResponse {
  user: BootstrapUser
  tierLimits: BootstrapTierLimits
  tierUsage: BootstrapTierUsage
  percentageUsed: {
    exams: number
    questions: number
    aiGenerations: number
    storage: number
  }
  notificationCount: number
}

// Global state for sharing across components
let globalBootstrapData: BootstrapResponse | null = null
let globalBootstrapPromise: Promise<BootstrapResponse> | null = null
let globalBootstrapError: Error | null = null
let globalListeners: Set<() => void> = new Set()
let lastFetchTime = 0

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Notify all listeners of data changes
 */
function notifyListeners() {
  globalListeners.forEach(callback => callback())
}

/**
 * Fetch bootstrap data with deduplication
 */
async function fetchBootstrap(force = false): Promise<BootstrapResponse> {
  const now = Date.now()

  // Return cached data if still valid (and not forcing refresh)
  if (!force && globalBootstrapData && (now - lastFetchTime) < CACHE_DURATION) {
    return globalBootstrapData
  }

  // Return pending promise if fetch is in progress
  if (globalBootstrapPromise) {
    return globalBootstrapPromise
  }

  // Start new fetch
  globalBootstrapPromise = fetch('/api/bootstrap', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        // Create error with status code for proper handling
        const error = new Error(`API Error: ${response.status}`)
        ;(error as any).status = response.status
        throw error
      }
      return response.json()
    })
    .then(data => {
      globalBootstrapData = data
      globalBootstrapError = null
      lastFetchTime = Date.now()
      notifyListeners()
      return data
    })
    .catch(error => {
      globalBootstrapError = error instanceof Error ? error : new Error(String(error))
      notifyListeners()
      throw error
    })
    .finally(() => {
      globalBootstrapPromise = null
    })

  return globalBootstrapPromise
}

/**
 * Main Bootstrap Hook
 * Use this as the primary hook for user session data
 *
 * @example
 * ```tsx
 * const { user, tierLimits, banStatus, loading } = useBootstrap()
 *
 * if (loading) return <Loader />
 * if (banStatus.isBanned) return <BannedDialog />
 * if (!user) return <LoginPage />
 *
 * return <Dashboard user={user} tier={tierLimits.tier} />
 * ```
 */
export function useBootstrap(options: {
  /**
   * Skip fetching (useful when you know user is not authenticated)
   */
  skip?: boolean
  /**
   * Redirect to login on 401/403
   */
  redirectOnUnauth?: boolean
  /**
   * Auto-refetch interval (in ms). Default: 0 (no auto-refetch)
   * Use sparingly - bootstrap data rarely needs polling
   */
  refetchInterval?: number
} = {}) {
  const {
    skip = false,
    redirectOnUnauth = false,
    refetchInterval = 0,
  } = options

  const router = useRouter()
  const [, forceUpdate] = useState({})
  const mountedRef = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Subscribe to global state changes
  useEffect(() => {
    const listener = () => {
      if (mountedRef.current) {
        forceUpdate({})
      }
    }
    globalListeners.add(listener)
    return () => {
      globalListeners.delete(listener)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    if (skip) return

    fetchBootstrap().catch(error => {
      // Check for auth errors (401, 403) and redirect if configured
      const status = (error as any).status
      const isAuthError = status === 401 || status === 403 ||
        error.message.includes('401') || error.message.includes('403')

      if (redirectOnUnauth && isAuthError) {
        router.push('/auth/login')
      }
    })
  }, [skip, redirectOnUnauth, router])

  // Auto-refetch interval
  useEffect(() => {
    if (skip || refetchInterval <= 0) return

    intervalRef.current = setInterval(() => {
      fetchBootstrap(true).catch(() => {})
    }, refetchInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [skip, refetchInterval])

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Manual refetch function
  const refetch = useCallback(async () => {
    invalidateCache('/api/bootstrap')
    return fetchBootstrap(true)
  }, [])

  // Computed values
  const loading = !globalBootstrapData && !globalBootstrapError && !skip
  const error = globalBootstrapError
  const data = globalBootstrapData

  return {
    // Raw data
    data,
    loading,
    error,
    refetch,

    // User data
    user: data?.user ?? null,
    isAuthenticated: !!data?.user,
    isAdmin: data?.user?.role === 'admin',

    // Ban status
    banStatus: {
      isBanned: data?.user?.isBanned ?? false,
      banReason: data?.user?.banReason,
      banDetails: data?.user?.banDetails,
      bannedAt: data?.user?.bannedAt,
    },

    // Trial status
    trialStatus: {
      accountType: data?.user?.accountType ?? 'free',
      isTrialUser: data?.user?.accountType === 'trial',
      isPremium: data?.user?.accountType === 'premium',
      isFree: data?.user?.accountType === 'free',
      trialExpiresAt: data?.user?.trialExpiresAt,
      trialDaysUsed: data?.user?.trialDaysUsed ?? 0,
      trialDaysRemaining: data?.user?.trialDaysRemaining ?? 0,
      isTrialExpired: data?.user?.accountType === 'trial' &&
        data?.user?.trialExpiresAt &&
        new Date(data.user.trialExpiresAt) < new Date(),
    },

    // Tier limits
    tierLimits: data?.tierLimits ?? null,
    tierUsage: data?.tierUsage ?? null,
    percentageUsed: data?.percentageUsed ?? null,

    // Notification count
    notificationCount: data?.notificationCount ?? 0,
  }
}

/**
 * Simplified hook for just user data
 */
export function useBootstrapUser() {
  const { user, loading, error, refetch, isAuthenticated, isAdmin } = useBootstrap()
  return { user, loading, error, refetch, isAuthenticated, isAdmin }
}

/**
 * Simplified hook for just ban status
 */
export function useBootstrapBanStatus(options?: { refetchInterval?: number }) {
  const { banStatus, loading, error, refetch } = useBootstrap(options)
  return { ...banStatus, loading, error, refetch }
}

/**
 * Simplified hook for just trial status
 */
export function useBootstrapTrialStatus() {
  const { trialStatus, loading, error, refetch } = useBootstrap()
  return { ...trialStatus, loading, error, refetch }
}

/**
 * Simplified hook for tier limits and usage
 */
export function useBootstrapTier() {
  const { tierLimits, tierUsage, percentageUsed, loading, error, refetch } = useBootstrap()

  // Calculate quota checks
  const canUseExams = tierUsage && tierLimits
    ? tierUsage.examsUsedThisMonth < tierLimits.examsPerMonth
    : true
  const examsRemaining = tierUsage && tierLimits
    ? Math.max(0, tierLimits.examsPerMonth - tierUsage.examsUsedThisMonth)
    : null

  return {
    tierLimits,
    tierUsage,
    percentageUsed,
    loading,
    error,
    refetch,
    tier: tierLimits?.tier ?? 'free',
    isPremium: tierLimits?.tier === 'premium',
    isTrial: tierLimits?.tier === 'trial',
    isFree: tierLimits?.tier === 'free',
    canUseExams,
    examsRemaining,
  }
}

/**
 * Clear all bootstrap cache (call on logout)
 */
export function clearBootstrapCache() {
  globalBootstrapData = null
  globalBootstrapPromise = null
  globalBootstrapError = null
  lastFetchTime = 0
  invalidateCache('/api/bootstrap')
  notifyListeners()
}

/**
 * Get cached bootstrap data synchronously (for non-React contexts)
 */
export function getBootstrapCache(): BootstrapResponse | null {
  return globalBootstrapData
}

/**
 * Prefetch bootstrap data (call early to warm cache)
 */
export function prefetchBootstrap(): Promise<BootstrapResponse> {
  return fetchBootstrap()
}
