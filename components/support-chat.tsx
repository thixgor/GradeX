'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFloatingDock } from '@/context/FloatingDockContext'
import { Ticket, TicketSummary } from '@/lib/types'
import { AlertCircle, ArrowLeft, Loader2, MessageCircle, Plus, X } from 'lucide-react'
import { notificationSound } from '@/lib/notification-sound'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import {
  TICKET_MENSAGEM_MAX,
  TICKET_STATUS_LABEL,
  ehMensagemDoSistema,
  previaDaMensagem,
  protocoloDoTicket,
  tempoRelativo,
} from '@/lib/tickets'
import { Compositor, Conversa, type MensagemDaConversa } from '@/components/suporte/conversa'
import { FormularioDeChamado } from '@/components/suporte/formulario-de-chamado'

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

/**
 * A última lista, compartilhada entre as montagens do botão.
 *
 * O botão flutuante vive no `AppShell`, que monta de novo a cada página, e cada
 * montagem pedia a lista só para acender o contador de não lidas — uma
 * invocação por página vista (882 em 18 h). Com o painel fechado, uma lista de
 * até dois minutos serve para o contador. Abrir o painel, o polling com ele
 * aberto e qualquer envio continuam indo ao servidor.
 */
const LISTA_FRESCA_MS = 120_000
let listaEmMemoria: { tickets: TicketSummary[]; currentUserId: string; em: number } | null = null

/** Chamado no logout: a lista em memória é da conta que saiu. */
export function esquecerTicketsEmMemoria(): void {
  listaEmMemoria = null
}

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
  const carregarLista = useCallback(async (forcar = true) => {
    if (!forcar && listaEmMemoria && Date.now() - listaEmMemoria.em < LISTA_FRESCA_MS) {
      setTickets(listaEmMemoria.tickets)
      setCurrentUserId(listaEmMemoria.currentUserId)
      setCarregandoLista(false)
      return
    }
    try {
      const res = await fetch('/api/tickets?limit=30')
      if (!res.ok) return
      const data = await res.json()
      setTickets(data.tickets || [])
      setCurrentUserId(data.currentUserId || '')
      listaEmMemoria = { tickets: data.tickets || [], currentUserId: data.currentUserId || '', em: Date.now() }
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
    carregarLista(isOpen)
  }, [isOpen, carregarLista])

  // Polling só com o painel aberto E a aba visível: ninguém lendo, nenhuma
  // invocação paga (`useIntervaloVisivel` para de vez com a aba oculta).
  useIntervaloVisivel(carregarLista, isOpen && estado === 'lista' ? INTERVALO_LISTA : null)

  useEffect(() => {
    if (!activeId) {
      setActiveTicket(null)
      ultimoTotalDeMensagens.current = 0
      return
    }
    carregarConversa(activeId)
  }, [activeId, carregarConversa])

  const recarregarConversa = useCallback(() => {
    if (activeId) void carregarConversa(activeId)
  }, [activeId, carregarConversa])
  useIntervaloVisivel(recarregarConversa, isOpen && activeId ? INTERVALO_CONVERSA : null)

  // A folha de ajuda dos checkouts abre a conversa recém-criada por aqui.
  useEffect(() => {
    const abrir = (e: Event) => {
      const id = (e as CustomEvent<{ ticketId?: string }>).detail?.ticketId
      if (!id) return
      setActiveId(id)
      setEstado('conversa')
      dock?.open('support')
      void carregarLista()
    }
    window.addEventListener('suporte:abrir', abrir)
    return () => window.removeEventListener('suporte:abrir', abrir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregarLista])

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

  // A conversa no formato da tela: o que é meu, do suporte ou do sistema.
  const mensagens: MensagemDaConversa[] = useMemo(
    () =>
      (activeTicket?.messages || []).map((m) => ({
        id: m.id,
        autor: ehMensagemDoSistema(m) ? 'sistema' : m.senderRole === 'admin' && m.senderId !== currentUserId ? 'suporte' : 'voce',
        nome: m.senderName,
        texto: m.text,
        enviadaEm: m.sentAt,
        lidaEm: m.readAt,
      })),
    [activeTicket?.messages, currentUserId],
  )

  const titulo =
    estado === 'novo' ? 'Novo chamado' : estado === 'conversa' && activeTicket ? activeTicket.title : 'Suporte'
  const subtitulo =
    estado === 'conversa' && activeTicket
      ? `#${protocoloDoTicket(activeTicket._id)} · ${TICKET_STATUS_LABEL[activeTicket.status]}`
      : estado === 'novo'
        ? 'A resposta chega aqui e no seu e-mail'
        : 'Chamados com protocolo e histórico'

  return (
    <>
      {/* Botão flutuante — só no computador (no celular o dock assume). O
          `bottom` soma `--gx-barra-inferior-h` para subir quando uma tela
          publica uma barra de ações fixa no rodapé. */}
      <button
        onClick={() => setOpen(!isOpen)}
        aria-label={isOpen ? 'Fechar suporte' : 'Abrir suporte'}
        data-suporte-balao
        style={{ bottom: 'calc(1.5rem + var(--gx-barra-inferior-h, 0px))' }}
        className="fixed right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#4f8f5c] to-[#2f6b40] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_14px_30px_-12px_rgba(46,97,64,0.8)] transition-[transform,bottom] hover:scale-105 active:scale-95 lg:flex"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isOpen && naoLidasTotais > 0 && (
          <span className="sp-contador absolute -right-1 -top-1">{naoLidasTotais > 9 ? '9+' : naoLidasTotais}</span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Suporte"
          style={{ bottom: 'calc(var(--base, 5rem) + var(--gx-barra-inferior-h, 0px))' }}
          className="ck-escopo ck-vidro-forte sp-painel fixed left-3 right-3 z-50 h-[min(72dvh,640px)] sm:left-auto sm:w-[400px] lg:right-6 lg:[--base:6rem]"
        >
          <div className="sp-cabeca">
            {estado !== 'lista' && (
              <button
                onClick={estado === 'novo' ? () => setEstado('lista') : voltarParaLista}
                aria-label="Voltar"
                className="sp-icone-botao"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-heading text-[17px] font-semibold leading-tight tracking-tight">{titulo}</h3>
              <p className="truncate text-xs" style={{ color: 'var(--ck-texto-3)' }}>{subtitulo}</p>
            </div>
            {estado === 'conversa' && activeTicket && activeTicket.status !== 'closed' && (
              <button
                className="ck-link-discreto shrink-0"
                disabled={enviando}
                onClick={() => mudarStatus('close')}
              >
                Encerrar
              </button>
            )}
            <button onClick={() => setOpen(false)} aria-label="Fechar suporte" className="sp-icone-botao">
              <X className="h-4 w-4" />
            </button>
          </div>

          {erro && (
            <p className="ck-erro mx-3 mt-3" role="alert">
              <AlertCircle className="h-4 w-4" /> {erro}
            </p>
          )}

          <div className="flex min-h-0 flex-1 flex-col">
            {estado === 'novo' ? (
              <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                <FormularioDeChamado
                  modo="conta"
                  onCriado={(c) => {
                    setActiveId(c.ticketId)
                    setEstado('conversa')
                    carregarLista()
                  }}
                />
              </div>
            ) : estado === 'conversa' ? (
              !activeTicket ? (
                <div className="flex flex-1 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--ck-texto-3)' }} />
                </div>
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <Conversa mensagens={mensagens} />
                  </div>
                  {activeTicket.status === 'resolved' && (
                    <p className="mx-3 mb-1 text-center text-xs" style={{ color: 'var(--ck-texto-2)' }}>
                      Marcado como resolvido. Ainda com dúvida? É só responder.
                    </p>
                  )}
                  {activeTicket.status === 'closed' ? (
                    <div className="flex flex-col items-center gap-2 border-t px-4 py-4 text-center" style={{ borderColor: 'var(--ck-sep)' }}>
                      <p className="text-xs" style={{ color: 'var(--ck-texto-2)' }}>
                        Chamado encerrado. O histórico fica guardado na sua conta.
                      </p>
                      <button className="ck-botao" disabled={enviando} onClick={() => mudarStatus('reopen')}>
                        Reabrir este chamado
                      </button>
                    </div>
                  ) : (
                    <Compositor
                      valor={newMessage}
                      onMudar={setNewMessage}
                      onEnviar={enviarMensagem}
                      enviando={enviando}
                      max={TICKET_MENSAGEM_MAX}
                    />
                  )}
                </>
              )
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {carregandoLista ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--ck-texto-3)' }} />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                      <span className="sp-ajuda-icone" style={{ width: 48, height: 48, borderRadius: 16 }} aria-hidden>
                        <MessageCircle className="h-6 w-6" />
                      </span>
                      <p className="mt-2 font-semibold">Nenhum chamado ainda</p>
                      <p className="text-sm" style={{ color: 'var(--ck-texto-2)' }}>
                        Travou em algo? Abra um chamado — respondemos por aqui e por e-mail.
                      </p>
                    </div>
                  ) : (
                    <ul className="sp-lista py-1">
                      {tickets.map((ticket) => (
                        <li key={String(ticket._id)}>
                          <button type="button" className="sp-item w-full" onClick={() => abrirTicket(String(ticket._id))}>
                            <span className="sp-ajuda-icone" aria-hidden>
                              <MessageCircle className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-[15px] font-semibold">{ticket.title}</span>
                                <span className="shrink-0 text-[11px]" style={{ color: 'var(--ck-texto-3)' }}>
                                  {tempoRelativo(ticket.updatedAt)}
                                </span>
                              </span>
                              <span className="mt-0.5 block truncate text-[13px]" style={{ color: 'var(--ck-texto-2)' }}>
                                {ticket.lastMessage?.senderRole === 'admin' ? 'Suporte: ' : ''}
                                {previaDaMensagem(ticket.lastMessage?.text, 70) || 'Sem mensagens'}
                              </span>
                              <span className="mt-1 flex items-center justify-between gap-2">
                                <span className="sp-status" data-status={ticket.status}>
                                  {TICKET_STATUS_LABEL[ticket.status]} · #{protocoloDoTicket(ticket._id)}
                                </span>
                                {ticket.unreadCount > 0 && <span className="sp-contador">{ticket.unreadCount}</span>}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="border-t p-3" style={{ borderColor: 'var(--ck-sep)' }}>
                  <button onClick={() => { setErro(''); setEstado('novo') }} className="ck-cta ck-cta-verde ck-cta-largo" style={{ height: 46 }}>
                    <Plus className="h-4 w-4" /> Novo chamado
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
