'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { Ticket, TicketMessage } from '@/lib/types'
import { ArrowLeft, MessageCircle, Send, CheckCheck, Info, CheckCircle, X as XIcon } from 'lucide-react'

export default function AdminTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error')
  const loadingMessagesRef = useRef(false)

  // Verificar se é admin
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.push('/auth/login')
          return
        }
        const data = await res.json()
        if (data.user?.role !== 'admin') {
          router.push('/')
          showToastMessage('Acesso negado. Apenas administradores podem acessar esta página.', 'error')
        }
      } catch (error) {
        router.push('/auth/login')
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    loadTickets()
    // Polling continua enquanto a página está montada
    const interval = setInterval(loadTickets, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedTicket && !loadingMessagesRef.current) {
      markMessagesAsRead()
    }
  }, [selectedTicket?.messages?.length])

  const showToastMessage = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  async function loadTickets() {
    try {
      loadingMessagesRef.current = true
      const res = await fetch('/api/tickets')
      const data = await res.json()
      setTickets(data.tickets || [])

      // Atualizar ticket selecionado se existir
      if (selectedTicket) {
        const updated = data.tickets.find((t: Ticket) => t._id === selectedTicket._id)
        if (updated) {
          // Sempre atualizar para refletir mudanças em tempo real
          setSelectedTicket(updated)
        }
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
      loadingMessagesRef.current = false
    }
  }

  async function markMessagesAsRead() {
    if (!selectedTicket) return

    const unreadMessages = selectedTicket.messages
      .filter(msg => !msg.readAt && msg.senderRole !== 'admin')
      .map(msg => msg.id)

    if (unreadMessages.length === 0) return

    try {
      await fetch(`/api/tickets/${selectedTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          messageIds: unreadMessages
        })
      })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  async function assignTicket(ticketId: string) {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign' })
      })

      if (res.ok) {
        showToastMessage('Ticket atribuído com sucesso!', 'success')
        loadTickets()
      }
    } catch (error) {
      showToastMessage('Erro ao atribuir ticket')
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedTicket) return

    try {
      const res = await fetch(`/api/tickets/${selectedTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          message: newMessage
        })
      })

      if (res.ok) {
        setNewMessage('')
        loadTickets()
      }
    } catch (error) {
      showToastMessage('Erro ao enviar mensagem')
    }
  }

  async function resolveTicket() {
    if (!selectedTicket) return

    try {
      const res = await fetch(`/api/tickets/${selectedTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve' })
      })

      if (res.ok) {
        showToastMessage('Ticket resolvido!', 'success')
        setSelectedTicket(null)
        loadTickets()
      }
    } catch (error) {
      showToastMessage('Erro ao resolver ticket')
    }
  }

  async function reopenTicket() {
    if (!selectedTicket) return

    try {
      const res = await fetch(`/api/tickets/${selectedTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reopen' })
      })

      if (res.ok) {
        showToastMessage('Ticket reaberto!', 'success')
        loadTickets()
      }
    } catch (error) {
      showToastMessage('Erro ao reabrir ticket')
    }
  }

  function getMessageStatus(msg: TicketMessage) {
    if (msg.senderRole === 'admin') {
      if (msg.readAt) {
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      }
      return <CheckCheck className="h-3 w-3 text-gray-400" />
    }
    return null
  }

  const openTickets = tickets.filter(t => t.status === 'open')
  const assignedTickets = tickets.filter(t => t.status === 'assigned')
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed')

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Gerenciar Tickets</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna 1: Novos */}
            <div className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                Novos ({openTickets.length})
              </h2>
              {openTickets.map(ticket => (
                <Card
                  key={String(ticket._id)}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{ticket.title}</CardTitle>
                    <CardDescription className="text-xs">{ticket.userName}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ticket.messages[0]?.text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Coluna 2: Em Andamento */}
            <div className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                Em Andamento ({assignedTickets.length})
              </h2>
              {assignedTickets.map(ticket => (
                <Card
                  key={String(ticket._id)}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{ticket.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {ticket.userName} • {ticket.assignedToName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ticket.messages[ticket.messages.length - 1]?.text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Coluna 3: Resolvidos */}
            <div className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                Resolvidos ({resolvedTickets.length})
              </h2>
              {resolvedTickets.map(ticket => (
                <Card
                  key={String(ticket._id)}
                  className="cursor-pointer hover:bg-muted opacity-70"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{ticket.title}</CardTitle>
                    <CardDescription className="text-xs">{ticket.userName}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Dialog do Ticket */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <DialogTitle>{selectedTicket?.title}</DialogTitle>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-md font-mono">
                    #{String(selectedTicket?._id)?.slice(-8)}
                  </span>
                </div>
                <DialogDescription>
                  {selectedTicket?.userName} ({selectedTicket?.userEmail})
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUserInfo(true)}
                title="Ver informações do usuário"
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedTicket && (
            <div className="flex-1 overflow-auto space-y-3 p-4">
              {selectedTicket.messages.map((msg) => {
                const isSystemMessage = msg.senderId === 'system'

                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isSystemMessage
                        ? 'justify-center'
                        : msg.senderRole === 'admin'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        isSystemMessage
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 text-center text-xs italic'
                          : msg.senderRole === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">{msg.senderName}</p>
                      <p className="text-sm">{msg.text}</p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <span className="text-xs opacity-70">
                          {new Date(msg.sentAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {!isSystemMessage && getMessageStatus(msg)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {selectedTicket && (
            <div className="space-y-2 p-4 border-t">
              {/* Avisos de Status */}
              {selectedTicket.status === 'resolved' && (
                <div className="p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-100 font-medium">
                    ✓ Este ticket foi marcado como resolvido.
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-200 mt-1">
                    Aguardando o usuário fechar o ticket ou você pode reabri-lo se necessário.
                  </p>
                </div>
              )}

              {selectedTicket.status === 'closed' && (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
                    ✓ Este ticket foi fechado.
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                    O histórico do chat está arquivado. Você pode reabrir este ticket se necessário.
                  </p>
                </div>
              )}

              {/* Botões de Ação */}
              {selectedTicket.status === 'open' && (
                <Button
                  onClick={() => assignTicket(String(selectedTicket._id))}
                  className="w-full"
                >
                  Pegar Ticket
                </Button>
              )}

              {selectedTicket.status === 'assigned' && (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={resolveTicket}
                    variant="outline"
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Resolvido
                  </Button>
                </>
              )}

              {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
                <Button
                  onClick={reopenTicket}
                  variant="outline"
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reabrir Ticket
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Info do Usuário */}
      <Dialog open={showUserInfo} onOpenChange={setShowUserInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informações do Usuário</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Nome:</p>
                <p className="text-sm text-muted-foreground">{selectedTicket.userName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email:</p>
                <p className="text-sm text-muted-foreground">{selectedTicket.userEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium">ID do Usuário:</p>
                <p className="text-sm text-muted-foreground font-mono">{selectedTicket.userId}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />
    </div>
  )
}
