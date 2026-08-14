'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Notification } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { notificationSound } from '@/lib/notification-sound'
import { useBootstrap } from '@/hooks/use-bootstrap'
import { useApi, useMutation } from '@/hooks/use-api'
import { invalidateCache, CACHE_DURATIONS } from '@/lib/api-client'
import { useAnchoredPanel } from '@/hooks/use-anchored-panel'

/**
 * NotificationsBell Component - Optimized Version
 *
 * Previous implementation:
 * - Made 2 separate fetch calls every 30 seconds (/api/auth/me + /api/notifications)
 * - Each call checked authentication independently
 * - ~5.8M invocations/day per 1000 users
 *
 * Optimized implementation:
 * - Uses useBootstrap for auth check (shared cache, no extra calls)
 * - Uses useApi hook for notifications (60-second polling, deduplicated)
 * - Only polls when component is mounted and user is authenticated
 * - ~1.4M invocations/day per 1000 users (76% reduction)
 */
export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0)
  const router = useRouter()
  const initializedRef = useRef(false)

  const closePanel = useCallback(() => setOpen(false), [])
  const { triggerRef, panelRef, style, mounted } = useAnchoredPanel<HTMLButtonElement>(
    open,
    closePanel,
    { width: 360 },
  )

  // Use bootstrap to check authentication (shared across all components)
  const { isAuthenticated, loading: authLoading } = useBootstrap()

  // Use the optimized API hook for notifications
  // 60-second polling interval - better balance of UX and cost
  const {
    data: notificationsData,
    loading: notificationsLoading,
    refetch: refetchNotifications,
  } = useApi<{ notifications: Notification[] }>(
    '/api/notifications',
    {
      skip: !isAuthenticated || authLoading,
      cacheDuration: CACHE_DURATIONS.NOTIFICATIONS,
      refetchInterval: 180 * 1000, // 3 min — alinhado com cache do servidor (max-age=120, swr=300)
    }
  )

  const notifications = notificationsData?.notifications || []
  const unreadCount = notifications.filter((n: Notification) => !n.read).length

  // Mutation hooks for actions
  const { mutate: patchNotification } = useMutation(
    '',
    'PATCH',
    { invalidateEndpoints: ['/api/notifications'] }
  )

  const { mutate: deleteNotificationMutation } = useMutation(
    '',
    'DELETE',
    { invalidateEndpoints: ['/api/notifications'] }
  )

  // Play sound on new notifications (only after initial load)
  useEffect(() => {
    if (notificationsLoading) return

    if (!initializedRef.current) {
      // First load - just record the count, don't play sound
      initializedRef.current = true
      setPreviousUnreadCount(unreadCount)
      return
    }

    // Play sound if new unread notifications
    if (unreadCount > previousUnreadCount && previousUnreadCount !== 0) {
      notificationSound?.play()
    }

    setPreviousUnreadCount(unreadCount)
  }, [unreadCount, notificationsLoading])

  async function markAsRead(notificationId: string) {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      })
      invalidateCache('/api/notifications')
      refetchNotifications()
    } catch (error) {
      console.error('Erro ao marcar notificacao:', error)
    }
  }

  async function deleteNotification(e: React.MouseEvent, notificationId: string) {
    e.stopPropagation()
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      invalidateCache('/api/notifications')
      refetchNotifications()
    } catch (error) {
      console.error('Erro ao deletar notificacao:', error)
    }
  }

  async function clearAllNotifications() {
    if (!confirm('Deseja limpar todas as notificacoes?')) return

    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
      })
      invalidateCache('/api/notifications')
      refetchNotifications()
    } catch (error) {
      console.error('Erro ao limpar notificacoes:', error)
    }
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(String(notification._id!))

    // Redirect based on notification type
    if (notification.type === 'ticket_created') {
      router.push('/admin/tickets')
    } else if (notification.type === 'ticket_reopened') {
      router.push('/')
    } else if (notification.type === 'order_update') {
      router.push('/profile?tab=pedidos')
    } else {
      router.push(`/exam/${notification.examId}/user/${notification.userId}`)
    }

    setOpen(false)
  }

  // Don't render if not authenticated
  if (!isAuthenticated && !authLoading) {
    return null
  }

  const panel = (
    <Card
      ref={panelRef}
      style={style ?? undefined}
      className="app-anchored-panel flex flex-col overflow-hidden p-0 border shadow-2xl"
      role="dialog"
      aria-label="Notificações"
    >
      <div className="border-b p-4 flex items-center justify-between bg-card shrink-0">
        <h3 className="font-semibold">Notificacoes</h3>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="text-xs h-auto py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpar todas
            </Button>
          )}
          {/* Fechar explícito: no celular não existe "clicar fora" óbvio. */}
          <Button
            variant="ghost"
            size="icon"
            onClick={closePanel}
            className="h-8 w-8 sm:hidden"
            aria-label="Fechar notificações"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-card">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma notificacao
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={String(notification._id)}
              className={`relative group border-b hover:bg-muted transition-colors ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
              }`}
            >
              <button
                onClick={() => handleNotificationClick(notification)}
                className="w-full text-left p-4 pr-12"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {(notification.type === 'ticket_created' || notification.type === 'ticket_reopened')
                        ? notification.ticketTitle
                        : notification.examTitle}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                  )}
                </div>
              </button>
              {/* No toque não existe hover: o botão de apagar ficava
                  invisível para sempre no celular. */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => deleteNotification(e, String(notification._id!))}
                aria-label="Apagar notificação"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-70 transition-opacity hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 lg:opacity-0 lg:group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  )

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {mounted && open && style && createPortal(panel, document.body)}
    </div>
  )
}
