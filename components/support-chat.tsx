'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card } from './ui/card'
import { Ticket, TicketMessage } from '@/lib/types'
import { MessageCircle, X, Send, CheckCheck, Check } from 'lucide-react'
import { notificationSound } from '@/lib/notification-sound'

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const previousMessageCount = useRef<number>(0)

  useEffect(() => {
    if (isOpen) {
      loadTickets()
      // Polling para atualizar mensagens
      const interval = setInterval(loadTickets, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  useEffect(() => {
    if (activeTicket) {
      // Marcar mensagens como lidas
      markMessagesAsRead()
    }
  }, [activeTicket?.messages])

  async function loadTickets() {
    try {
      const res = await fetch('/api/tickets')
      const data = await res.json()
      setTickets(data.tickets || [])
      setCurrentUserId(data.currentUserId || '')

      // Atualizar ticket ativo se existir
      if (activeTicket) {
        const updated = data.tickets.find((t: Ticket) => t._id === activeTicket._id)
        if (updated) {
          // Detectar novas mensagens do admin
          const currentMessageCount = updated.messages.length
          const hasNewAdminMessage = updated.messages.some(
            (msg: TicketMessage) => msg.senderRole === 'admin' && !msg.readAt
          )

          if (currentMessageCount > previousMessageCount.current && hasNewAdminMessage) {
            notificationSound?.play()
          }

          previousMessageCount.current = currentMessageCount
          setActiveTicket(updated)
        }
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
    }
  }

  async function markMessagesAsRead() {
    if (!activeTicket) return

    const unreadMessages = activeTicket.messages
      .filter(msg => !msg.readAt && msg.senderId !== activeTicket.userId)
      .map(msg => msg.id)

    if (unreadMessages.length === 0) return

    try {
      await fetch(`/api/tickets/${activeTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          messageIds: unreadMessages
        })
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  async function createTicket() {
    if (!title.trim() || !message.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message })
      })

      if (res.ok) {
        setTitle('')
        setMessage('')
        setShowNewTicket(false)
        loadTickets()
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeTicket) return

    setLoading(true)
    try {
      const res = await fetch(`/api/tickets/${activeTicket._id}`, {
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
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  async function closeTicket() {
    if (!activeTicket) return

    try {
      await fetch(`/api/tickets/${activeTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' })
      })

      setActiveTicket(null)
      loadTickets()
    } catch (error) {
      console.error('Error closing ticket:', error)
    }
  }

  function getMessageStatus(msg: TicketMessage, ticket: Ticket) {
    // Não mostrar status para mensagens próprias
    if (msg.senderId === ticket.userId) {
      if (msg.readAt) {
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      }
      return <CheckCheck className="h-3 w-3 text-gray-400" />
    }
    return null
  }

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <h3 className="font-semibold">Suporte</h3>
            <p className="text-xs opacity-90">Tire suas dúvidas conosco</p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {showNewTicket ? (
              // Formulário Novo Ticket
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Dúvida sobre prova"
                  />
                </div>
                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva sua dúvida..."
                    rows={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createTicket} disabled={loading} className="flex-1">
                    Criar Ticket
                  </Button>
                  <Button
                    onClick={() => setShowNewTicket(false)}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : activeTicket ? (
              // Chat Ativo
              <div className="h-full flex flex-col">
                <div className="mb-4 pb-2 border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{activeTicket.title}</h4>
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-md font-mono">
                          #{activeTicket._id?.slice(-8)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {activeTicket.status === 'open' && 'Aguardando admin...'}
                        {activeTicket.status === 'assigned' && `Atendido por ${activeTicket.assignedToName}`}
                        {activeTicket.status === 'resolved' && '✓ Resolvido'}
                        {activeTicket.status === 'closed' && '✓ Fechado'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTicket(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto space-y-3 mb-4">
                  {activeTicket.messages.map((msg) => {
                    const isOwnMessage = msg.senderId === currentUserId
                    const isSystemMessage = msg.senderId === 'system'

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isSystemMessage
                            ? 'justify-center'
                            : isOwnMessage
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isSystemMessage
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 text-center text-xs italic'
                              : isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {!isSystemMessage && msg.senderRole === 'admin' && !isOwnMessage && (
                            <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderName}</p>
                          )}
                          <p className="text-sm">{msg.text}</p>
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(msg.sentAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {isOwnMessage && getMessageStatus(msg, activeTicket)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Avisos de Status */}
                {activeTicket.status === 'resolved' && (
                  <div className="mb-3 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-100 font-medium">
                      ✓ Este ticket foi marcado como resolvido pelo administrador.
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-200 mt-1">
                      Você pode fechar o ticket se sua dúvida foi solucionada.
                    </p>
                  </div>
                )}

                {activeTicket.status === 'closed' && (
                  <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
                      ✓ Este ticket foi fechado.
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                      O histórico do chat foi arquivado. Caso precise de ajuda novamente, crie um novo ticket.
                    </p>
                  </div>
                )}

                {/* Input */}
                {activeTicket.status !== 'closed' && activeTicket.status !== 'resolved' && (
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} size="icon" disabled={loading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {activeTicket.status === 'resolved' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={closeTicket}
                    className="mt-2 w-full bg-green-600 hover:bg-green-700"
                  >
                    Fechar Ticket
                  </Button>
                )}

                {activeTicket.status !== 'closed' && activeTicket.status !== 'resolved' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeTicket}
                    className="mt-2 w-full"
                  >
                    Fechar Ticket
                  </Button>
                )}
              </div>
            ) : (
              // Lista de Tickets
              <div className="space-y-3">
                {tickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum ticket criado</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <Card
                      key={ticket._id}
                      className="p-3 cursor-pointer hover:bg-muted"
                      onClick={() => setActiveTicket(ticket)}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium text-sm">{ticket.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.status === 'open' && 'Aberto'}
                          {ticket.status === 'assigned' && 'Em andamento'}
                          {ticket.status === 'resolved' && 'Resolvido'}
                          {ticket.status === 'closed' && 'Fechado'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ticket.messages[ticket.messages.length - 1]?.text.substring(0, 50)}...
                      </p>
                    </Card>
                  ))
                )}

                <Button onClick={() => setShowNewTicket(true)} className="w-full">
                  Novo Ticket
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
