'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  GraduationCap,
  LifeBuoy,
  MessageCircle,
  RefreshCw,
  Ticket as TicketIcon,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFloatingDock } from '@/context/FloatingDockContext'
import { cn } from '@/lib/utils'

/**
 * Atendimento: tudo que a pessoa pediu e está esperando resposta.
 *
 * Solicitações de desconto e tickets de suporte eram duas conversas com a mesma
 * equipe, e nenhuma das duas tinha endereço fixo — o ticket vivia só dentro do
 * balão flutuante (que some quando a pessoa desliga o botão de suporte nas
 * preferências) e a solicitação de desconto só aparecia na página do produto.
 * Quem não lembrava por onde tinha pedido não tinha onde olhar, e a saída
 * natural era pedir de novo.
 *
 * Aqui as duas ficam juntas, com o estado explícito e a próxima ação à mão:
 * recusado tem "refazer", aprovado tem "ir para a compra", ticket tem "abrir a
 * conversa".
 */

interface SolicitacaoProuni {
  id: string
  itemType: 'material' | 'package' | 'manual_clinico' | 'plus'
  itemId: string
  itemTitle: string
  program: 'prouni' | 'fies'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewNotes: string
  createdAt: string | null
  reviewedAt: string | null
  grant: { discountLabel: string; usage: string; expiresAt: string | null } | null
}

interface TicketResumo {
  _id?: string
  title: string
  status: 'open' | 'assigned' | 'resolved' | 'closed'
  messages?: Array<{ text: string; senderRole: 'admin' | 'user'; sentAt: string }>
  createdAt: string
  updatedAt: string
}

const STATUS_SOLICITACAO: Record<string, { texto: string; classe: string }> = {
  pending: { texto: 'Em análise', classe: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  approved: { texto: 'Aprovada', classe: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  rejected: { texto: 'Recusada', classe: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  cancelled: { texto: 'Cancelada', classe: 'bg-muted text-muted-foreground' },
}

const STATUS_TICKET: Record<string, { texto: string; classe: string }> = {
  open: { texto: 'Aberto', classe: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  assigned: { texto: 'Em atendimento', classe: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  resolved: { texto: 'Resolvido', classe: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  closed: { texto: 'Encerrado', classe: 'bg-muted text-muted-foreground' },
}

/** Para onde a compra acontece, por tipo de item. */
function paginaDoProduto(itemType: string, itemId: string) {
  if (itemType === 'package') return `/pacotes/${itemId}`
  if (itemType === 'manual_clinico') return '/manual-clinico'
  if (itemType === 'plus') return '/buy'
  return `/materiais/${itemId}`
}

function formatarData(valor?: string | null) {
  if (!valor) return '—'
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR')
}

function Etiqueta({ texto, classe }: { texto: string; classe: string }) {
  return (
    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', classe)}>
      {texto}
    </span>
  )
}

export function AtendimentoTab() {
  const router = useRouter()
  const dock = useFloatingDock()
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoProuni[]>([])
  const [tickets, setTickets] = useState<TicketResumo[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const [prouni, suporte] = await Promise.allSettled([
      fetch('/api/prouni/solicitacoes', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/tickets', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
    ])
    if (prouni.status === 'fulfilled' && prouni.value) setSolicitacoes(prouni.value.requests || [])
    if (suporte.status === 'fulfilled' && suporte.value) setTickets(suporte.value.tickets || [])
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const abertos = useMemo(
    () =>
      solicitacoes.filter((s) => s.status === 'pending').length +
      tickets.filter((t) => t.status === 'open' || t.status === 'assigned').length,
    [solicitacoes, tickets]
  )

  // O chat de suporte é um painel flutuante compartilhado; aqui só pedimos que
  // ele abra. Quando a pessoa desligou o botão de suporte nas preferências, o
  // componente não está montado — daí o aviso em vez de um clique sem efeito.
  const suporteDisponivel = Boolean(dock?.actions?.some((acao) => acao.id === 'support'))
  const abrirSuporte = () => dock?.open('support')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {carregando
            ? 'Carregando seus pedidos…'
            : abertos > 0
              ? `${abertos} ${abertos === 1 ? 'pedido aguardando' : 'pedidos aguardando'} resposta da nossa equipe.`
              : 'Nenhum pedido aguardando resposta no momento.'}
        </p>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={carregar} disabled={carregando}>
          <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', carregando && 'animate-spin')} />
          Atualizar
        </Button>
      </div>

      {/* ── Solicitações de desconto ── */}
      <section>
        <h2 className="editorial-mark mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Solicitações de desconto
        </h2>

        {solicitacoes.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-5 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              Você ainda não pediu desconto PROUNI/FIES. O aviso aparece na página dos itens
              participantes.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card shadow-sm">
            {solicitacoes.map((solicitacao) => {
              const etiqueta = STATUS_SOLICITACAO[solicitacao.status] || STATUS_SOLICITACAO.cancelled
              const aprovadoDisponivel =
                solicitacao.status === 'approved' && solicitacao.grant?.usage !== 'used'
              return (
                <li key={solicitacao.id} className="flex flex-wrap items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{solicitacao.itemTitle}</p>
                      <Etiqueta texto={etiqueta.texto} classe={etiqueta.classe} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {solicitacao.program === 'prouni' ? 'ProUni' : 'FIES'} · enviada em{' '}
                      {formatarData(solicitacao.createdAt)}
                    </p>

                    {solicitacao.status === 'pending' && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        Conferindo seu comprovante — costuma levar até 2 dias úteis.
                      </p>
                    )}

                    {solicitacao.status === 'approved' && solicitacao.grant && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                        {solicitacao.grant.usage === 'used'
                          ? `${solicitacao.grant.discountLabel} já utilizado nesta conta.`
                          : `${solicitacao.grant.discountLabel} aplicado sozinho no checkout${
                              solicitacao.grant.expiresAt
                                ? ` · válido até ${formatarData(solicitacao.grant.expiresAt)}`
                                : ''
                            }.`}
                      </p>
                    )}

                    {solicitacao.status === 'rejected' && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-300">
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          {solicitacao.reviewNotes || 'Não foi possível aprovar esta solicitação.'}
                        </span>
                      </p>
                    )}
                  </div>

                  {aprovadoDisponivel && (
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => router.push(paginaDoProduto(solicitacao.itemType, solicitacao.itemId))}
                    >
                      Ir para a compra
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  )}

                  {(solicitacao.status === 'rejected' || solicitacao.status === 'cancelled') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() =>
                        router.push(
                          `/prouni-fies/${solicitacao.itemType}/${encodeURIComponent(solicitacao.itemId)}`
                        )
                      }
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Refazer solicitação
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── Tickets de suporte ── */}
      <section>
        <h2 className="editorial-mark mb-3 flex items-center gap-2">
          <TicketIcon className="h-4 w-4" />
          Tickets de suporte
        </h2>

        {tickets.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-5 text-center shadow-sm">
            <LifeBuoy className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum ticket aberto. Precisa falar com a gente? É por aqui.
            </p>
            {suporteDisponivel ? (
              <Button size="sm" className="mt-3 h-8 text-xs" onClick={abrirSuporte}>
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                Abrir um ticket
              </Button>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Ligue o <strong>botão de suporte</strong> em Configurações para abrir a conversa.
              </p>
            )}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border rounded-lg border border-border bg-card shadow-sm">
              {tickets.map((ticket) => {
                const etiqueta = STATUS_TICKET[ticket.status] || STATUS_TICKET.closed
                const ultima = ticket.messages?.[ticket.messages.length - 1]
                return (
                  <li key={String(ticket._id)} className="flex flex-wrap items-start gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{ticket.title}</p>
                        <Etiqueta texto={etiqueta.texto} classe={etiqueta.classe} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Atualizado em {formatarData(ticket.updatedAt)}
                        {ticket.messages?.length ? ` · ${ticket.messages.length} mensagens` : ''}
                      </p>
                      {ultima?.text && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {ultima.senderRole === 'admin' ? 'Equipe: ' : 'Você: '}
                          </span>
                          {ultima.text}
                        </p>
                      )}
                    </div>
                    {suporteDisponivel && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={abrirSuporte}>
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                        Abrir conversa
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
            {suporteDisponivel && (
              <Button variant="outline" size="sm" className="mt-3 h-8 text-xs" onClick={abrirSuporte}>
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                Novo ticket
              </Button>
            )}
          </>
        )}
      </section>
    </div>
  )
}
