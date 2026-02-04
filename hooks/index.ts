/**
 * Centralized exports for all optimized data fetching hooks
 * Use these instead of direct API calls for better performance
 *
 * RECOMMENDED: Use useBootstrap as the primary hook for user session data.
 * It consolidates user, tier limits, ban status, and notifications into one request.
 */

export { useApi, useMutation } from './use-api'

export {
  useAuthUser,
  useEmailVerified,
  useTrialStatus,
  useUserProfile,
  useBanStatus,
  logout,
  getCachedAuthUser,
  subscribeToAuthUser,
} from './use-auth-user'
export type { AuthUser, BanStatus } from './use-auth-user'

export {
  useUserTier,
  useQuotaCheck,
  useFeatureAccess,
} from './use-user-tier'
export type { TierLimits, TierUsage, TierInfo } from './use-user-tier'

export {
  useNotifications,
  useUnreadNotificationCount,
} from './use-notifications'
export type { Notification } from './use-notifications'

// New centralized bootstrap hook - RECOMMENDED for all user session data
export {
  useBootstrap,
  useBootstrapUser,
  useBootstrapBanStatus,
  useBootstrapTrialStatus,
  useBootstrapTier,
  clearBootstrapCache,
  getBootstrapCache,
  prefetchBootstrap,
} from './use-bootstrap'
export type {
  BootstrapUser,
  BootstrapTierLimits,
  BootstrapTierUsage,
  BootstrapResponse,
} from './use-bootstrap'
