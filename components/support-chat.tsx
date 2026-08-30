'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFloatingDock } from '@/context/FloatingDockContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card } from './ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Ticket, TicketMessage, TicketSummary, TicketCategory } from '@/lib/types'
import { MessageCircle, X, Send, CheckCheck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { notificationSound } from '@/lib/notification-sound'
import {
  TICKET_CATEGORIES,
  TICKET_MENSAGEM_MAX,
  TICKET_TITULO_MAX,
  ehMensagemDoSistema,
  previaDaMensagem,
  protocoloDoTicket,
  tempoRelativo,
} from '@/lib/tickets'

/**
 * Chat de suporte do usuário.
 *
 * O que a versão anterior fazia de errado, e por que doía:
 *
 * - Baixava **todos** os tickets com **todas** as mensagens a cada 30s só para
 *   desenhar uma lista de títulos. Agora a lista vem resumida (última mensagem
 *   + não lidas) e a conversa completa só é buscada para o ticket aberto.
 * - Depois de "resolvido" a caixa de texto sumia: quem discordava do desfecho
 *   não tinha o que fazer além de abrir outro ticket. Agora responder reabre.
 * - Não havia protocolo visível, contagem de não lidas nem qualquer retorno
 *   quando o envio falhava — o botão simplesmente não fazia nada.
 *
 * O parâmetro `?suporte=<id>` abre o painel direto na conversa: é o destino dos
 * botões dos e-mails de resposta e das notificações do sino.
 */

const INTERVALO_LISTA = 30_000
const INTERVALO_CONVERSA = 12_000

type Estado = 'lista' | 'novo' | 'conversa'

export function SupportChat() {
  const dock = useFloatingDock()
  // Estado de abertura vem do dock compartilhado (garante um só painel aberto
  // por vez e permite abrir tanto pelo gatilho desktop quanto pelo FAB mobile).
  const isOpen = dock?.activePanel === 'support'
  const setOpen = (open: boolean) => {
    if (open) dock?.open('support')
    else dock?.close()
  }

  const [tickets, setTickets] = useState<TicketSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [estado, setEstado] = useState<Estado>('lista')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<TicketCategory>('outro')
  const [message, setMessage] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [carregandoLista, setCarregandoLista] = useState(true)
  const [erro, setErro] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')

  const ultimoTotalDeMensagens = useRef(0)
  const fimDaConversa = useRef<HTMLDivElement | null>(null)
  const lidasEnviadas = useRef<string>('')

  // Registra a ação "Suporte" no dock flutuante (usado no mobile).
  const register = dock?.register
  const unregister = dock?.unregister
  useEffect(() => {
    if (!register || !unregister) return
    register({ id: 'support', label: 'Suporte', order: 1 })
    return () => unregister('support')
  }, [register, unregister])

  // ── Deep link vindo do e-mail / do sino ───────────────────────────────
  // `window.location` em vez de `useSearchParams` de propósito: o hook obriga a
  // envolver o componente num <Suspense> em toda página que o monta.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const alvo = new URLSearchParams(window.location.search).get('suporte')
    if (!alvo) return

    setActiveId(alvo)
    setEstado('conversa')
    dock?.open('support')

    // Tira o parâmetro da URL para o painel não reabrir a cada navegação.
    const url = new URL(window.location.href)
    url.searchParams.delete('suporte')
    window.history.replaceState({}, '', url.toString())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Carregamento ──────────────────────────────────────────────────────
  const carregarLista = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets?limit=30')
      if (!res.ok) return
      const data = await res.json()
      setTickets(data.tickets || [])
      setCurrentUserId(data.currentUserId || '')
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
    } finally {
      setCarregandoLista(false)
    }
  }, [])

  const carregarConversa = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`)
      if (!res.ok) {
        if (res.status === 404 || res.status === 403) {
          setErro('Não foi possível abrir este ticket.')
          setActiveId(null)
          setEstado('lista')
        }
        return
      }
      const data = await res.json()
      const ticket: Ticket = data.ticket
      setActiveTicket(ticket)
      setCurrentUserId(data.currentUserId || '')

      // Som só quando chega mensagem NOVA do suporte — e não na primeira carga,
      // que ficaria tocando toda vez que a pessoa abre a conversa.
      const total = ticket.messages.length
      const ultima = ticket.messages[total - 1]
      if (
        ultimoTotalDeMensagens.current > 0 &&
        total > ultimoTotalDeMensagens.current &&
        ultima?.senderRole === 'admin'
      ) {
        notificationSound?.play()
      }
      ultimoTotalDeMensagens.current = total
    } catch (error) {
      console.error('Erro ao carregar conversa:', error)
    }
  }, [])

  // Uma consulta ao montar (é ela que acende o contador de não lidas no botão
  // flutuante antes de alguém abrir o painel) e, daí em diante, polling só
  // enquanto o painel está aberto.
  useEffect(() => {
    carregarLista()
    if (!isOpen) return
    // `document.hidden` corta o polling da aba em segundo plano: ninguém está
    // lendo, e cada volta é uma invocação serverless paga.
    const intervalo = setInterval(() => {
      if (!document.hidden) carregarLista()
    }, INTERVALO_LISTA)
    return () => clearInterval(intervalo)
  }, [isOpen, carregarLista])

  useEffect(() => {
    if (!activeId) {
      setActiveTicket(null)
      ultimoTotalDeMensagens.current = 0
      return
    }
    carregarConversa(activeId)
    if (!isOpen) return
    const intervalo = setInterval(() => {
      if (!document.hidden) carregarConversa(activeId)
    }, INTERVALO_CONVERSA)
    return () => clearInterval(intervalo)
  }, [activeId, isOpen, carregarConversa])

  // ── Leitura ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTicket || !isOpen) return
    const naoLidas = activeTicket.messages.filter(
      (msg) => !msg.readAt && msg.senderRole === 'admin',
    )
    if (naoLidas.length === 0) return

    // Sem a trava, o polling reenviaria o mesmo "marcar como lida" a cada volta
    // até o servidor responder.
    const assinatura = `${activeTicket._id}:${naoLidas.map((m) => m.id).join(',')}`
    if (lidasEnviadas.current === assinatura) return
    lidasEnviadas.current = assinatura

    fetch(`/api/tickets/${activeTicket._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', messageIds: naoLidas.map((m) => m.id) }),
    }).catch((error) => console.error('Erro ao marcar como lida:', error))
  }, [activeTicket, isOpen])

  // Rola para a última mensagem sempre que a conversa cresce.
  useEffect(() => {
    fimDaConversa.current?.scrollIntoView({ block: 'end' })
  }, [activeTicket?.messages?.length, estado])

  // ── Ações ─────────────────────────────────────────────────────────────
  async function criarTicket() {
    if (!title.trim() || !message.trim() || enviando) return

    setEnviando(true)
    setErro('')
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, category }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setErro(data?.error || 'Não foi possível abrir o ticket. Tente de novo.')
        return
      }

      setTitle('')
      setMessage('')
      setCategory('outro')
      setActiveId(data.ticketId || null)
      setEstado(data.ticketId ? 'conversa' : 'lista')
      carregarLista()
    } catch (error) {
      console.error('Erro ao criar ticket:', error)
      setErro('Falha de conexão. Verifique sua internet e tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  async function enviarMensagem() {
    const texto = newMessage.trim()
    if (!texto || !activeTicket || enviando) return

    setEnviando(true)
    setErro('')
    try {
      const res = await fetch(`/api/tickets/${activeTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_message', message: texto }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setErro(data?.error || 'Não foi possível enviar a mensagem.')
        return
      }

      setNewMessage('')
      await carregarConversa(String(activeTicket._id))
      carregarLista()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setErro('Falha de conexão. Sua mensagem não foi enviada.')
    } finally {
      setEnviando(false)
    }
  }

  async function mudarStatus(action: 'close' | 'reopen') {
    if (!activeTicket) return
    setEnviando(true)
    setErro('')
    try {
      const res = await fetch(`/api/tickets/${activeTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErro(data?.error || 'Não foi possível atualizar o ticket.')
        return
      }
      await carregarConversa(String(activeTicket._id))
      carregarLista()
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error)
      setErro('Falha de conexão.')
    } finally {
      setEnviando(false)
    }
  }

  function abrirTicket(id: string) {
    setErro('')
    setActiveId(id)
    setEstado('conversa')
  }

  function voltarParaLista() {
    setActiveId(null)
    setActiveTicket(null)
    setEstado('lista')
    setErro('')
    carregarLista()
  }

  const naoLidasTotais = useMemo(
    () => tickets.reduce((soma, t) => soma + (t.unreadCount || 0), 0),
    [tickets],
  )

  const statusDaConversa = activeTicket?.status
  const podeEscrever = statusDaConversa !== 'closed'

  function selo(status: Ticket['status']) {
    const mapa: Record<Ticket['status'], { texto: string; classe: string }> = {
      open: { texto: 'Aguardando', classe: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' },
      assigned: { texto: 'Em atendimento', classe: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' },
      resolved: { texto: 'Resolvido', classe: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' },
      closed: { texto: 'Fechado', classe: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    }
    return mapa[status]
  }

  return (
    <>
      {/* Botão Flutuante — desktop apenas (no mobile o dock consolidado assume).
          O `bottom` soma `--gx-barra-inferior-h`: quando alguma tela publica
          uma barra de ações fixa no rodapé (ex.: a seleção em massa do
          Catálogo), este círculo sobe para não ficar em cima do botão mais à
          direita dela, interceptando o clique. Sem barra nenhuma publicando,
          a variável vale 0px e o botão fica exatamente onde sempre esteve. */}
      <button
        onClick={() => setOpen(!isOpen)}
        aria-label={isOpen ? 'Fechar suporte' : 'Abrir suporte'}
        style={{ bottom: 'calc(1.5rem + var(--gx-barra-inferior-h, 0px))' }}
        className="fixed right-6 z-50 hidden lg:flex w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-[transform,bottom] items-center justify-center"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isOpen && naoLidasTotais > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
            {naoLidasTotais > 9 ? '9+' : naoLidasTotais}
          </span>
        )}
      </button>

      {/* Chat Window — mesma lógica: abre acima da barra, não em cima dela.
          `--base` guarda o afastamento de sempre (5rem no mobile, 6rem do
          `lg` em diante, exatamente como antes); só a soma com a variável da
          barra é novidade. */}
      {isOpen && (
        <div
          style={{
            bottom: 'calc(var(--base, 5rem) + var(--gx-barra-inferior-h, 0px))',
          }}
          className="fixed right-4 left-4 sm:left-auto z-50 sm:w-96 w-auto h-[70vh] max-h-[600px] lg:right-6 lg:[--base:6rem] bg-background border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-primary text-primary-foreground flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              {estado !== 'lista' && (
                <button
                  onClick={estado === 'novo' ? () => setEstado('lista') : voltarParaLista}
                  aria-label="Voltar"
                  className="mt-0.5 rounded-md p-1 text-primary-foreground/80 transition hover:bg-white/15 hover:text-primary-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold truncate">
                  {estado === 'novo'
                    ? 'Novo ticket'
                    : estado === 'conversa' && activeTicket
                    ? activeTicket.title
                    : 'Suporte'}
                </h3>
                <p className="text-xs opacity-90 truncate">
                  {estado === 'conversa' && activeTicket
                    ? `#${protocoloDoTicket(activeTicket._id)} • ${selo(activeTicket.status).texto}`
                    : 'Tire suas dúvidas conosco'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar suporte"
              className="-mr-1 -mt-1 rounded-md p-1.5 text-primary-foreground/80 transition hover:bg-white/15 hover:text-primary-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {erro && (
            <div className="flex items-start gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300">{erro}</p>
            </div>
          )}

          {/* Conteúdo */}
          <div className="flex-1 min-h-0 flex flex-col">
            {estado === 'novo' ? (
              <div className="flex-1 overflow-auto p-4 space-y-4">
                <div>
                  <Label htmlFor="ticket-titulo">Título</Label>
                  <Input
                    id="ticket-titulo"
                    value={title}
                    maxLength={TICKET_TITULO_MAX}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Não consigo acessar o material"
                  />
                </div>
                <div>
                  <Label>Assunto</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ticket-mensagem">Mensagem</Label>
                  <Textarea
                    id="ticket-mensagem"
                    value={message}
                    maxLength={TICKET_MENSAGEM_MAX}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Conte o que aconteceu com o máximo de detalhes que puder — isso acelera a resposta."
                    rows={6}
                  />
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">
                    {message.length}/{TICKET_MENSAGEM_MAX}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Você recebe a resposta aqui e também por e-mail.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={criarTicket}
                    disabled={enviando || title.trim().length < 3 || !message.trim()}
                    className="flex-1"
                  >
                    {enviando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Abrir ticket
                  </Button>
                  <Button onClick={() => setEstado('lista')} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : estado === 'conversa' ? (
              !activeTicket ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto p-4 space-y-3">
                    {activeTicket.messages.map((msg) => (
                      <Mensagem
                        key={msg.id}
                        msg={msg}
                        souEu={msg.senderId === currentUserId}
                      />
                    ))}
                    <div ref={fimDaConversa} />
                  </div>

                  <div className="border-t p-3 space-y-2">
                    {activeTicket.status === 'resolved' && (
                      <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-900">
                        <p className="text-xs text-green-800 dark:text-green-200">
                          ✓ Marcado como resolvido pelo suporte. <strong>Ainda com dúvida?</strong> É
                          só responder abaixo que o atendimento volta.
                        </p>
                      </div>
                    )}

                    {activeTicket.status === 'closed' ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Este ticket foi encerrado. O histórico fica guardado na sua conta.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={enviando}
                          onClick={() => mudarStatus('reopen')}
                        >
                          Reabrir este ticket
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2 items-end">
                          <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            rows={1}
                            maxLength={TICKET_MENSAGEM_MAX}
                            className="min-h-[40px] max-h-28 resize-none py-2"
                            onKeyDown={(e) => {
                              // Enter envia, Shift+Enter quebra linha — o padrão
                              // de qualquer chat. Antes, `onKeyPress` (removido
                              // do React) enviava até no meio de um parágrafo.
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                enviarMensagem()
                              }
                            }}
                          />
                          <Button
                            onClick={enviarMensagem}
                            size="icon"
                            disabled={enviando || !newMessage.trim()}
                            aria-label="Enviar mensagem"
                          >
                            {enviando ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-muted-foreground"
                          disabled={enviando}
                          onClick={() => mudarStatus('close')}
                        >
                          Encerrar ticket
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )
            ) : (
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {carregandoLista ? (
                  <div className="flex justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Você ainda não abriu nenhum ticket</p>
                    <p className="text-xs mt-1">
                      Precisa de ajuda? Fale com a gente — respondemos por aqui e por e-mail.
                    </p>
                  </div>
                ) : (
                  tickets.map((ticket) => {
                    const s = selo(ticket.status)
                    return (
                      <Card
                        key={String(ticket._id)}
                        className="p-3 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => abrirTicket(String(ticket._id))}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-medium text-sm leading-tight">{ticket.title}</h4>
                          <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded ${s.classe}`}>
                            {s.texto}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ticket.lastMessage?.senderRole === 'admin' ? 'Suporte: ' : ''}
                          {previaDaMensagem(ticket.lastMessage?.text, 60) || 'Sem mensagens'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] text-muted-foreground font-mono">
                            #{protocoloDoTicket(ticket._id)} • {tempoRelativo(ticket.updatedAt)}
                          </span>
                          {ticket.unreadCount > 0 && (
                            <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                              {ticket.unreadCount}
                            </span>
                          )}
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {estado === 'lista' && (
            <div className="p-3 border-t">
              <Button onClick={() => { setErro(''); setEstado('novo') }} className="w-full">
                Novo ticket
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function Mensagem({ msg, souEu }: { msg: TicketMessage; souEu: boolean }) {
  const doSistema = ehMensagemDoSistema(msg)

  if (doSistema) {
    return (
      <div className="flex justify-center">
        <p className="max-w-[85%] rounded-lg bg-muted px-3 py-1.5 text-center text-[11px] italic text-muted-foreground">
          {msg.text}
        </p>
      </div>
    )
  }

  return (
    <div className={`flex ${souEu ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg p-3 ${
          souEu ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {!souEu && msg.senderRole === 'admin' && (
          <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderName} • Suporte</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
        <div className="flex items-center gap-1 justify-end mt-1">
          <span className="text-[11px] opacity-70">
            {new Date(msg.sentAt).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {souEu && (
            <CheckCheck
              className={`h-3 w-3 ${msg.readAt ? 'text-blue-300' : 'opacity-50'}`}
              aria-label={msg.readAt ? 'Lida' : 'Enviada'}
            />
          )}
        </div>
      </div>
    </div>
  )
}
