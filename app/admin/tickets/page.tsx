'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToastAlert } from '@/components/ui/toast-alert'
import { Ticket, TicketMessage, TicketPriority, TicketSummary } from '@/lib/types'
import {
  TICKET_MENSAGEM_MAX,
  TICKET_PRIORITIES,
  ehMensagemDoSistema,
  previaDaMensagem,
  protocoloDoTicket,
  rotuloDaCategoria,
  tempoRelativo,
} from '@/lib/tickets'
import {
  ArrowLeft,
  CheckCircle,
  Info,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  X as XIcon,
} from 'lucide-react'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { MundoDoCheckout } from '@/components/checkout/mundo-do-checkout'
import { Compositor, Conversa } from '@/components/suporte/conversa'
import { ehTicketDeVisitante } from '@/lib/tickets-visitante-regras'

/**
 * Painel de atendimento.
 *
 * A listagem agora usa o resumo da API (sem o histórico de mensagens de todos
 * os tickets a cada minuto) e a conversa completa é carregada só do ticket
 * aberto. Além disso a fila passou a mostrar o que decide a ordem de
 * atendimento: prioridade, quanto tempo a pessoa está esperando e quantas
 * mensagens ainda não foram lidas.
 */

const INTERVALO_LISTA = 30_000
const INTERVALO_CONVERSA = 10_000

const CORES_DE_PRIORIDADE: Record<TicketPriority, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
}

export default function AdminTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketSummary[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error')
  const fimDaConversa = useRef<HTMLDivElement | null>(null)
  const lidasEnviadas = useRef('')

  const showToastMessage = useCallback(
    (message: string, type: 'error' | 'success' | 'info' = 'error') => {
      setToastMessage(message)
      setToastType(type)
      setToastOpen(true)
    },
    [],
  )

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
  }, [router, showToastMessage])

  // Digitar na busca não pode disparar uma consulta por tecla.
  useEffect(() => {
    const timer = setTimeout(() => setBuscaAplicada(busca.trim()), 400)
    return () => clearTimeout(timer)
  }, [busca])

  const carregarLista = useCallback(async () => {
    try {
      const query = new URLSearchParams({ limit: '150' })
      if (buscaAplicada) query.set('q', buscaAplicada)
      const res = await fetch(`/api/tickets?${query.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      setTickets(data.tickets || [])
      setCounts(data.counts || {})
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
    } finally {
      setLoading(false)
    }
  }, [buscaAplicada])

  const carregarConversa = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setSelectedTicket(data.ticket)
    } catch (error) {
      console.error('Erro ao carregar conversa:', error)
    }
  }, [])

  useEffect(() => {
    carregarLista()
  }, [carregarLista])
  useIntervaloVisivel(carregarLista, INTERVALO_LISTA)

  useEffect(() => {
    if (!selectedId) {
      setSelectedTicket(null)
      return
    }
    carregarConversa(selectedId)
  }, [selectedId, carregarConversa])
  useIntervaloVisivel(
    () => { if (selectedId) carregarConversa(selectedId) },
    selectedId ? INTERVALO_CONVERSA : null
  )

  useEffect(() => {
    fimDaConversa.current?.scrollIntoView({ block: 'end' })
  }, [selectedTicket?.messages?.length])

  // Marca como lida o que o usuário escreveu, sem repetir a chamada a cada
  // volta do polling.
  useEffect(() => {
    if (!selectedTicket) return
    const naoLidas = selectedTicket.messages.filter(
      (msg) => !msg.readAt && msg.senderRole !== 'admin' && !ehMensagemDoSistema(msg),
    )
    if (naoLidas.length === 0) return

    const assinatura = `${selectedTicket._id}:${naoLidas.map((m) => m.id).join(',')}`
    if (lidasEnviadas.current === assinatura) return
    lidasEnviadas.current = assinatura

    fetch(`/api/tickets/${selectedTicket._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', messageIds: naoLidas.map((m) => m.id) }),
    }).catch((error) => console.error('Erro ao marcar como lida:', error))
  }, [selectedTicket])

  async function acao(
    body: Record<string, unknown>,
    sucesso?: string,
  ): Promise<boolean> {
    if (!selectedId) return false
    setEnviando(true)
    try {
      const res = await fetch(`/api/tickets/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToastMessage(data?.error || 'Não foi possível concluir a ação.')
        return false
      }
      if (sucesso) showToastMessage(sucesso, 'success')
      await carregarConversa(selectedId)
      carregarLista()
      return true
    } catch (error) {
      showToastMessage('Falha de conexão.')
      return false
    } finally {
      setEnviando(false)
    }
  }

  async function enviarMensagem() {
    const texto = newMessage.trim()
    if (!texto || enviando) return
    // Responder já assume o ticket no servidor — não existe mais o passo
    // obrigatório de "pegar" antes de poder falar com a pessoa.
    const ok = await acao({ action: 'send_message', message: texto })
    if (ok) setNewMessage('')
  }

  const porStatus = useMemo(
    () => ({
      novos: tickets.filter((t) => t.status === 'open'),
      andamento: tickets.filter((t) => t.status === 'assigned'),
      encerrados: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed'),
    }),
    [tickets],
  )

  const naoLidasTotais = useMemo(
    () => tickets.reduce((soma, t) => soma + (t.unreadCount || 0), 0),
    [tickets],
  )

  function cartao(ticket: TicketSummary) {
    const prioridade = (ticket.priority || 'normal') as TicketPriority
    const esperando = ticket.status === 'open'

    return (
      <Card
        key={String(ticket._id)}
        className={`cursor-pointer rounded-[18px] border-black/[0.06] bg-white/70 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.05] ${
          ticket.status === 'closed' ? 'opacity-70' : ''
        } ${prioridade === 'urgent' ? 'border-red-400 dark:border-red-800' : ''}`}
        onClick={() => setSelectedId(String(ticket._id))}
      >
        <CardHeader className="p-3 pb-2 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm leading-tight">{ticket.title}</CardTitle>
            {ticket.unreadCount > 0 && (
              <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                {ticket.unreadCount}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${CORES_DE_PRIORIDADE[prioridade]}`}>
              {TICKET_PRIORITIES.find((p) => p.value === prioridade)?.label}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {rotuloDaCategoria(ticket.category)}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              #{protocoloDoTicket(ticket._id)}
            </span>
            {ehTicketDeVisitante(ticket) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold">
                Visitante
              </span>
            )}
            {ticket.contexto && (
              <span className="max-w-[160px] truncate text-[10px] text-muted-foreground font-mono" title={ticket.contexto}>
                {ticket.contexto}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-1">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {ticket.lastMessage?.senderRole === 'admin' ? 'Você: ' : ''}
            {previaDaMensagem(ticket.lastMessage?.text, 110)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {ticket.userName}
            {ticket.assignedToName ? ` • ${ticket.assignedToName}` : ''}
            {' • '}
            {esperando
              ? `esperando ${tempoRelativo(ticket.createdAt).replace('há ', '')}`
              : tempoRelativo(ticket.updatedAt)}
          </p>
        </CardContent>
      </Card>
    )
  }

  function coluna(titulo: string, cor: string, total: number, itens: TicketSummary[]) {
    return (
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <div className={`w-3 h-3 ${cor} rounded-full`} />
          {titulo} ({total})
        </h2>
        {itens.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded-lg">
            Nada por aqui
          </p>
        ) : (
          itens.map(cartao)
        )}
      </div>
    )
  }

  const statusDoSelecionado = selectedTicket?.status

  return (
    <MundoDoCheckout className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-background/60 backdrop-blur-xl dark:border-white/10">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Tickets</h1>
              <p className="text-xs text-muted-foreground">
                {naoLidasTotais > 0
                  ? `${naoLidasTotais} mensagem${naoLidasTotais > 1 ? 's' : ''} sem leitura`
                  : 'Nenhuma mensagem sem leitura'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por título, nome ou e-mail"
                className="pl-8 w-56 sm:w-72"
              />
            </div>
            <Button variant="outline" size="icon" onClick={carregarLista} aria-label="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{buscaAplicada ? 'Nenhum ticket encontrado para essa busca.' : 'Nenhum ticket ainda.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coluna('Novos', 'bg-yellow-500', counts.open ?? porStatus.novos.length, porStatus.novos)}
            {coluna(
              'Em Andamento',
              'bg-blue-500',
              counts.assigned ?? porStatus.andamento.length,
              porStatus.andamento,
            )}
            {coluna(
              'Resolvidos',
              'bg-green-500',
              (counts.resolved ?? 0) + (counts.closed ?? 0) || porStatus.encerrados.length,
              porStatus.encerrados,
            )}
          </div>
        )}
      </main>

      {/* Dialog do Ticket */}
      <Dialog open={!!selectedId} onOpenChange={(aberto) => !aberto && setSelectedId(null)}>
        <DialogContent className="ck-escopo flex max-h-[90dvh] max-w-2xl flex-col gap-0 overflow-hidden rounded-[26px] p-0">
          <DialogHeader className="p-4 pb-3 border-b">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <DialogTitle className="truncate">{selectedTicket?.title || 'Carregando…'}</DialogTitle>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-md font-mono">
                    #{protocoloDoTicket(selectedId)}
                  </span>
                </div>
                <DialogDescription className="truncate">
                  {selectedTicket
                    ? `${selectedTicket.userName} (${selectedTicket.userEmail}) • ${rotuloDaCategoria(
                        selectedTicket.category,
                      )} • aberto ${tempoRelativo(selectedTicket.createdAt)}`
                    : ' '}
                </DialogDescription>
                {selectedTicket && (ehTicketDeVisitante(selectedTicket) || selectedTicket.contexto) && (
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {ehTicketDeVisitante(selectedTicket) && (
                      <span className="font-semibold text-sky-700 dark:text-sky-300">
                        Visitante sem conta — e-mail não verificado
                        {selectedTicket.visitanteTemConta ? ' (existe conta com este e-mail)' : ''}
                      </span>
                    )}
                    {selectedTicket.contexto && <span className="font-mono">veio de {selectedTicket.contexto}</span>}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedTicket && (
                  <Select
                    value={selectedTicket.priority || 'normal'}
                    onValueChange={(v) =>
                      acao({ action: 'set_priority', priority: v }, 'Prioridade atualizada')
                    }
                  >
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUserInfo(true)}
                  title="Ver informações do usuário"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <Conversa
                key={String(selectedTicket._id)}
                mensagens={selectedTicket.messages.map((m) => ({
                  id: m.id,
                  autor: ehMensagemDoSistema(m) ? 'sistema' : m.senderRole === 'admin' ? 'voce' : 'suporte',
                  nome: m.senderName,
                  texto: m.text,
                  enviadaEm: m.sentAt,
                  lidaEm: m.readAt,
                }))}
                assinatura={(nome) => nome || 'Aluno'}
              />
              <div ref={fimDaConversa} />
            </div>
          )}

          {selectedTicket && (
            <div className="space-y-2 p-4 border-t">
              {statusDoSelecionado === 'resolved' && (
                <p className="text-xs text-green-700 dark:text-green-300">
                  ✓ Resolvido {tempoRelativo(selectedTicket.resolvedAt)}. Se responder agora, o ticket
                  volta para atendimento.
                </p>
              )}
              {statusDoSelecionado === 'closed' && (
                <p className="text-xs text-muted-foreground">
                  ✓ Fechado {tempoRelativo(selectedTicket.closedAt)}
                  {selectedTicket.closedBy === 'user' ? ' pelo próprio usuário' : ''}. Reabra para voltar
                  a conversar.
                </p>
              )}

              {statusDoSelecionado !== 'closed' && (
                <>
                  <div className="-mx-4 -mt-2">
                    <Compositor
                      valor={newMessage}
                      onMudar={setNewMessage}
                      onEnviar={enviarMensagem}
                      enviando={enviando}
                      max={TICKET_MENSAGEM_MAX}
                      placeholder="Responder (Enter envia, Shift+Enter quebra linha)"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {ehTicketDeVisitante(selectedTicket)
                      ? 'O visitante recebe a resposta por e-mail, com o link da conversa.'
                      : 'O usuário recebe a resposta no chat e por e-mail.'}
                  </p>
                </>
              )}

              <div className="flex flex-wrap gap-2">
                {statusDoSelecionado === 'open' && (
                  <Button
                    onClick={() => acao({ action: 'assign' }, 'Ticket atribuído a você')}
                    disabled={enviando}
                    className="flex-1 min-w-[150px]"
                  >
                    Pegar ticket
                  </Button>
                )}

                {(statusDoSelecionado === 'open' || statusDoSelecionado === 'assigned') && (
                  <Button
                    onClick={() => acao({ action: 'resolve' }, 'Ticket resolvido')}
                    variant="outline"
                    disabled={enviando}
                    className="flex-1 min-w-[150px]"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como resolvido
                  </Button>
                )}

                {(statusDoSelecionado === 'resolved' || statusDoSelecionado === 'closed') && (
                  <Button
                    onClick={() => acao({ action: 'reopen' }, 'Ticket reaberto')}
                    variant="outline"
                    disabled={enviando}
                    className="flex-1 min-w-[150px]"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reabrir ticket
                  </Button>
                )}

                {statusDoSelecionado !== 'closed' && (
                  <Button
                    onClick={() => acao({ action: 'close' }, 'Ticket encerrado')}
                    variant="ghost"
                    disabled={enviando}
                    className="flex-1 min-w-[150px] text-muted-foreground"
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Encerrar
                  </Button>
                )}
              </div>
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
              <div>
                <p className="text-sm font-medium">Viu a conversa:</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTicket.userLastSeenAt
                    ? tempoRelativo(selectedTicket.userLastSeenAt)
                    : 'ainda não abriu depois da última resposta'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Atendimento:</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTicket.assignedToName || 'Ninguém assumiu ainda'}
                  {selectedTicket.firstResponseAt
                    ? ` • primeira resposta ${tempoRelativo(selectedTicket.firstResponseAt)}`
                    : ' • ainda sem resposta'}
                </p>
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
    </MundoDoCheckout>
  )
}
