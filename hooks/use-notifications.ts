/**
 * Hook for notifications with optimized polling
 * Consolidates notification fetching with configurable polling
 */

import { useApi, useMutation } from './use-api'
import { CACHE_DURATIONS } from '@/lib/api-client'

export interface Notification {
  _id: string
  userId: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: string
  expiresAt?: string
}

/**
 * Hook: Get user notifications with optimized polling
 *
 * Usage:
 * ```tsx
 * // Poll every 30 seconds (configurable)
 * const { notifications, unreadCount, markAsRead } = useNotifications({
 *   refetchInterval: 30000
 * })
 * ```
 */
export function useNotifications(options: {
  skip?: boolean
  refetchInterval?: number // Default: 120s — antes era 30s; reduzido para baixar CPU/Vercel.
} = {}) {
  const { skip = false, refetchInterval = 120 * 1000 } = options

  const { data, loading, error, refetch } = useApi<Notification[]>(
    '/api/notifications',
    {
      skip,
      cacheDuration: CACHE_DURATIONS.NOTIFICATIONS,
      refetchInterval,
    }
  )

  const { mutate: markAsReadMutate, loading: markLoading } = useMutation(
    '/api/notifications',
    'PATCH',
    {
      invalidateEndpoints: ['/api/notifications'],
    }
  )

  const { mutate: deleteMutate, loading: deleteLoading } = useMutation(
    '/api/notifications',
    'DELETE',
    {
      invalidateEndpoints: ['/api/notifications'],
    }
  )

  // Count unread notifications
  const unreadCount = data?.filter(n => !n.read).length ?? 0

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutate({
        action: 'mark_read',
        notificationId,
      })
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = (data ?? [])
        .filter(n => !n.read)
        .map(n => n._id)

      if (unreadIds.length > 0) {
        await markAsReadMutate({
          action: 'mark_all_read',
          notificationIds: unreadIds,
        })
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteMutate({
        notificationId,
      })
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  // Clear all notifications
  const clearAll = async () => {
    try {
      if (data && data.length > 0) {
        await deleteMutate({
          action: 'clear_all',
        })
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err)
    }
  }

  return {
    notifications: data ?? [],
    unreadCount,
    unreadNotifications: data?.filter(n => !n.read) ?? [],
    loading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    isUpdating: markLoading || deleteLoading,
  }
}

/**
 * Hook: Get notification count only (lighter than full notifications)
 * Useful for badge notifications
 */
export function useUnreadNotificationCount(options: {
  skip?: boolean
  refetchInterval?: number
} = {}) {
  const { skip = false, refetchInterval = 120 * 1000 } = options

  const { data, loading, error, refetch } = useApi<{ count: number }>(
    '/api/notifications/count',
    {
      skip,
      cacheDuration: CACHE_DURATIONS.NOTIFICATIONS,
      refetchInterval,
    }
  )

  return {
    count: data?.count ?? 0,
    loading,
    error,
    refetch,
  }
}
