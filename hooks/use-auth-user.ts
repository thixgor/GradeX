/**
 * Centralized hook for current user authentication data
 * Replaces 15+ independent calls to /api/auth/me
 * Features: Caching, deduplication, automatic ban checking
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useApi } from './use-api'
import { fetchAPI, CACHE_DURATIONS } from '@/lib/api-client'
import { clearBootstrapCache } from './use-bootstrap'

export interface AuthUser {
  _id: string
  email: string
  name: string
  role: 'admin' | 'user'
  emailVerified: boolean
  accountType: 'free' | 'trial' | 'premium'
  trialExpiresAt?: string
  trialDaysUsed?: number
  trialDaysRemaining?: number
  isBanned?: boolean
  banReason?: string
  banDetails?: string
  bannedAt?: string
  subscriptionStartDate?: string
  subscriptionEndDate?: string
}

export interface BanStatus {
  isBanned: boolean
  banReason?: string
  banDetails?: string
  bannedAt?: string
}

let authUserCache: AuthUser | null = null
let authUserListeners: Set<(user: AuthUser | null) => void> = new Set()

/**
 * Get current cached auth user (for non-React contexts)
 */
export function getCachedAuthUser(): AuthUser | null {
  return authUserCache
}

/**
 * Subscribe to auth user changes (for non-React contexts)
 */
export function subscribeToAuthUser(
  callback: (user: AuthUser | null) => void
): () => void {
  authUserListeners.add(callback)
  return () => authUserListeners.delete(callback)
}

/**
 * Notify all listeners of auth user changes
 */
function notifyAuthUserChange(user: AuthUser | null) {
  authUserCache = user
  authUserListeners.forEach(callback => callback(user))
}

/**
 * Primary hook: Get current authenticated user
 * Replaces all direct /api/auth/me calls
 *
 * Usage:
 * ```tsx
 * const { user, loading, error, refetch } = useAuthUser()
 * if (loading) return <Loader />
 * if (!user) return <LoginPage />
 * ```
 */
export function useAuthUser(options: {
  skip?: boolean
  refetchOnWindowFocus?: boolean
  refetchInterval?: number // Auto-refetch interval (use 0 to disable)
} = {}) {
  const {
    skip = false,
    refetchOnWindowFocus = false, // Disabled by default - reduce unnecessary refetches
    refetchInterval = 0, // No polling by default - user rarely changes during session
  } = options

  // /api/bootstrap responde um envelope ({ user, tierLimits, sidebarSections… }),
  // e o fetchAPI entrega o JSON cru — então `data` NÃO é o usuário. Quem lia
  // data.email/data.name recebia undefined em silêncio. O desembrulho abaixo faz
  // o hook cumprir o tipo que ele declara; o formato plano é aceito junto porque
  // /api/auth/me devolve o usuário direto e já foi o endpoint deste hook.
  const { data: payload, loading, error, refetch: apiRefetch } = useApi<
    AuthUser | { user?: AuthUser | null }
  >(
    '/api/bootstrap', // Use optimized bootstrap endpoint (see below)
    {
      skip,
      cacheDuration: CACHE_DURATIONS.AUTH,
      refetchInterval,
    }
  )

  const data: AuthUser | null =
    payload && typeof payload === 'object' && 'user' in payload
      ? ((payload as { user?: AuthUser | null }).user ?? null)
      : ((payload as AuthUser | null) ?? null)

  const mountedRef = useRef(true)

  useEffect(() => {
    if (data) {
      notifyAuthUserChange(data)
    }
  }, [data])

  // Attach window focus listener for optional refetch
  useEffect(() => {
    if (!refetchOnWindowFocus || skip) return

    const handleFocus = () => {
      apiRefetch()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, skip, apiRefetch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    user: data ?? null,
    loading,
    error,
    refetch: apiRefetch,
    isAuthenticated: !!data && !skip,
  }
}

/**
 * Hook: Check if user is banned
 * Returns null while loading, boolean afterward
 */
export function useBanStatus(options: {
  skip?: boolean
  refetchInterval?: number // Default: 60 seconds (security: check regularly)
} = {}) {
  const { skip = false, refetchInterval = 60 * 1000 } = options

  const { data, loading, error, refetch } = useApi<BanStatus>(
    '/api/bootstrap', // Use bootstrap endpoint
    {
      skip,
      cacheDuration: CACHE_DURATIONS.BAN_STATUS,
      refetchInterval,
    }
  )

  return {
    isBanned: data?.isBanned ?? false,
    banReason: data?.banReason,
    banDetails: data?.banDetails,
    bannedAt: data?.bannedAt,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook: Check if user email is verified
 */
export function useEmailVerified() {
  const { user, loading } = useAuthUser()

  return {
    isVerified: user?.emailVerified ?? false,
    email: user?.email,
    loading,
  }
}

/**
 * Hook: Check trial status
 */
export function useTrialStatus() {
  const { user, loading } = useAuthUser()

  return {
    accountType: user?.accountType,
    isTrialUser: user?.accountType === 'trial',
    trialExpiresAt: user?.trialExpiresAt,
    trialDaysUsed: user?.trialDaysUsed ?? 0,
    trialDaysRemaining: user?.trialDaysRemaining ?? 0,
    loading,
  }
}

/**
 * Hook: Get user profile
 */
export function useUserProfile() {
  const { user, loading, refetch } = useAuthUser()

  return {
    id: user?._id,
    email: user?.email,
    name: user?.name,
    role: user?.role,
    loading,
    refetch,
  }
}

/**
 * Function: Logout with cache cleanup
 */
export async function logout() {
  try {
    await fetchAPI('/api/auth/logout', { method: 'POST' })
  } finally {
    // Clear auth cache
    notifyAuthUserChange(null)
    clearBootstrapCache()
  }
}
