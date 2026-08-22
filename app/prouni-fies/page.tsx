'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Clock, GraduationCap, XCircle } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoLoading } from '@/components/logo-loading'

/**
 * "Onde está o meu pedido?"
 *
 * A análise é humana e leva um tempo; sem uma tela que mostre o andamento, a
 * única forma de a pessoa saber o que aconteceu é reenviar o formulário — que é
 * exatamente o que entope a fila do admin. Esta página existe para responder a
 * pergunta sem custo para ninguém.
 */

interface Solicitacao {
  id: string
  itemType: string
  itemId: string
  itemTitle: string
  program: 'prouni' | 'fies'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewNotes: string
  createdAt: string | null
  grant: { discountLabel: string; usage: string; expiresAt: string | null } | null
}

const ROTULOS: Record<string, { texto: string; cor: string }> = {
  pending: { texto: 'Em análise', cor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  approved: { texto: 'Aprovada', cor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  rejected: { texto: 'Recusada', cor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  cancelled: { texto: 'Cancelada', cor: 'bg-muted text-muted-foreground' },
}

export default function MinhasSolicitacoesProuni() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetch('/api/prouni/solicitacoes', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((json) => setSolicitacoes(json.requests || []))
      .catch(() => setSolicitacoes([]))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return <LogoLoading message="Carregando suas solicitações..." size="lg" fullscreen />
  }

  return (
    <AppShell headerTitle="Desconto PROUNI/FIES" headerSubtitle="Suas solicitações">
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5" />
              Minhas solicitações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {solicitacoes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Você ainda não solicitou desconto PROUNI/FIES. Procure o aviso &quot;Sou PROUNI/FIES&quot;
                na página dos materiais participantes.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {solicitacoes.map((solicitacao) => {
                  const rotulo = ROTULOS[solicitacao.status] || ROTULOS.cancelled
                  return (
                    <li key={solicitacao.id} className="flex flex-wrap items-start gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/prouni-fies/${solicitacao.itemType}/${encodeURIComponent(solicitacao.itemId)}`}
                          className="text-sm font-semibold hover:underline"
                        >
                          {solicitacao.itemTitle}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {solicitacao.program === 'prouni' ? 'ProUni' : 'FIES'} ·{' '}
                          {solicitacao.createdAt
                            ? new Date(solicitacao.createdAt).toLocaleDateString('pt-BR')
                            : '—'}
                        </p>
                        {solicitacao.status === 'approved' && solicitacao.grant && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            {solicitacao.grant.usage === 'used'
                              ? `${solicitacao.grant.discountLabel} já utilizado`
                              : `${solicitacao.grant.discountLabel} disponível no checkout`}
                          </p>
                        )}
                        {solicitacao.status === 'pending' && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                            <Clock className="h-3.5 w-3.5" />
                            Aguardando conferência do comprovante
                          </p>
                        )}
                        {solicitacao.status === 'rejected' && solicitacao.reviewNotes && (
                          <p className="mt-1 flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-300">
                            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {solicitacao.reviewNotes}
                          </p>
                        )}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${rotulo.cor}`}>
                        {rotulo.texto}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
