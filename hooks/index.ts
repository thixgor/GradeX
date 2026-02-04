/**
 * Centralized exports for all optimized data fetching hooks
 * Use these instead of direct API calls for better performance
 */

export { useApi, useMutation } from './use-api'
export type { UseApiState } from './use-api'

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
