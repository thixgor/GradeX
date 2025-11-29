'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Bell, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Notification } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { notificationSound } from '@/lib/notification-sound'

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const loadNotifications = useCallback(async () => {
    // Verificar autenticação antes de carregar
    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        // Se não houver usuário autenticado, parar o intervalo
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        return
      }
    } catch {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        const newNotifications = data.notifications || []
        const newUnreadCount = newNotifications.filter((n: Notification) => !n.read).length

        setNotifications(newNotifications)
        setUnreadCount(newUnreadCount)

        // Tocar som se houver novas notificações não lidas
        setPreviousUnreadCount(prev => {
          if (newUnreadCount > prev && prev !== 0) {
            notificationSound?.play()
          }
          return newUnreadCount
        })
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }, [])

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        return res.ok
      } catch {
        return false
      }
    }

    // Carregar notificações inicialmente
    const initialLoad = async () => {
      // Verificar autenticação antes de carregar
      const isAuthenticated = await checkAuth()
      if (!isAuthenticated) {
        return
      }

      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          const initialNotifications = data.notifications || []
          const initialUnreadCount = initialNotifications.filter((n: Notification) => !n.read).length

          setNotifications(initialNotifications)
          setUnreadCount(initialUnreadCount)
          setPreviousUnreadCount(initialUnreadCount) // Inicializar sem tocar som

          // Iniciar intervalo apenas se autenticado
          intervalRef.current = setInterval(loadNotifications, 5000)
        }
      } catch (error) {
        console.error('Erro ao carregar notificações:', error)
      }
    }

    initialLoad()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [loadNotifications])

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

  async function markAsRead(notificationId: string) {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      })
      loadNotifications()
    } catch (error) {
      console.error('Erro ao marcar notificação:', error)
    }
  }

  async function deleteNotification(e: React.MouseEvent, notificationId: string) {
    e.stopPropagation()
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      loadNotifications()
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }

  async function clearAllNotifications() {
    if (!confirm('Deseja limpar todas as notificações?')) return

    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
      })
      loadNotifications()
    } catch (error) {
      console.error('Erro ao limpar notificações:', error)
    }
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(String(notification._id!))

    // Redirecionar baseado no tipo de notificação
    if (notification.type === 'ticket_created') {
      // Admin recebeu notificação de novo ticket
      router.push('/admin/tickets')
    } else if (notification.type === 'ticket_reopened') {
      // Usuário recebeu notificação de ticket reaberto
      router.push('/')
    } else {
      // Notificação de correção de prova
      router.push(`/exam/${notification.examId}/user/${notification.userId}`)
    }

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
          </div>
          <div className="max-h-[400px] overflow-y-auto bg-card">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma notificação
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteNotification(e, String(notification._id!))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
