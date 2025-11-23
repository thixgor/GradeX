'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Notification } from '@/lib/types'
import { useRouter } from 'next/navigation'

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifications()
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
      loadNotifications()
    } catch (error) {
      console.error('Erro ao marcar notificação:', error)
    }
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
      })
      loadNotifications()
    } catch (error) {
      console.error('Erro ao marcar todas:', error)
    }
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification._id!)
    router.push(`/exam/${notification.examId}/user/${notification.userId}`)
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <Card className="absolute right-0 top-12 w-80 max-w-[90vw] shadow-lg z-50 p-0 border">
          <div className="border-b p-4 flex items-center justify-between bg-card">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-auto py-1"
              >
                Marcar todas
              </Button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto bg-card">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 border-b hover:bg-muted transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.examTitle}</p>
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
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
