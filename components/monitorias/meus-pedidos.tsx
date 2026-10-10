'use client'

/**
 * "Meus pedidos" (aluno): cada pedido publicado e os monitores que
 * responderam. Sem pedido nenhum, vira o convite para pedir.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, Megaphone, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, Avatar, CaixaErro, Selo, SeloStatus } from './base'
import { CartaoDemanda } from './cartao-demanda'
import type { PeriodoDemanda, QuandoDemanda } from '@/lib/monitorias/demandas-regras'
import type { StatusReserva } from '@/lib/monitorias/tipos'

interface MeuPedido {
  id: string
  materia: string
  assunto: string | null
  pessoas: number
  valorPorPessoaCentavos: number | null
  duracaoMin: number
  quando: QuandoDemanda
  periodos: PeriodoDemanda[]
  status: 'aberta' | 'atendida' | 'encerrada' | 'expirada'
  createdAt: string
  respostas: Array<{
    reservaId: string
    status: StatusReserva
    anuncioTitulo: string
    monitor: { nome: string; fotoUrl: string | null; nota: number; avaliacoes: number } | null
  }>
}

const STATUS: Record<MeuPedido['status'], { rotulo: string; tom: 'sucesso' | 'neutro' | 'info' }> = {
  aberta: { rotulo: 'No mural', tom: 'info' },
  atendida: { rotulo: 'Fechado', tom: 'sucesso' },
  encerrada: { rotulo: 'Encerrado', tom: 'neutro' },
  expirada: { rotulo: 'Expirou', tom: 'neutro' },
}

export function MeusPedidos() {
  const [itens, setItens] = useState<MeuPedido[] | null>(null)
  const [erro, setErro] = useState('')
  const [encerrando, setEncerrando] = useState<string | null>(null)

  const carregar = useCallback(() => {
    api<{ itens: MeuPedido[] }>('/api/monitorias/demandas')
      .then((r) => setItens(r.itens))
      .catch(() => setItens([]))
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])

  async function encerrar(id: string) {
    setErro('')
    setEncerrando(id)
    try {
      await api(`/api/monitorias/demandas/${id}/encerrar`, { method: 'POST' })
      carregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEncerrando(null)
    }
  }

  if (!itens) return null

  if (!itens.length) {
    return (
      <section id="pedidos" className="mb-8 flex flex-col gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Megaphone className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold">Não achou o monitor certo?</p>
            <p className="text-sm text-muted-foreground">Diga o que precisa em 30 segundos e deixe os monitores virem até você.</p>
          </div>
        </div>
        <Link href="/monitorias/pedir" className="shrink-0">
          <Button className="w-full rounded-xl sm:w-auto">Pedir monitoria <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
        </Link>
      </section>
    )
  }

  return (
    <section id="pedidos" className="mb-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">Meus pedidos</h2>
        <Link href="/monitorias/pedir" className="text-sm font-medium text-primary hover:underline">Novo pedido</Link>
      </div>
      {erro && <CaixaErro mensagem={erro} className="mb-3" />}
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {itens.map((p) => (
          <li key={p.id}>
            <CartaoDemanda
              d={{ ...p, assunto: p.assunto || undefined }}
              criadoEm={p.createdAt}
              destaque={<Selo tom={STATUS[p.status].tom}>{STATUS[p.status].rotulo}</Selo>}
            >
              <div className="mt-4 border-t border-border pt-3">
                {p.respostas.length ? (
                  <>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">
                      {p.respostas.length} {p.respostas.length === 1 ? 'monitor respondeu' : 'monitores responderam'}
                    </p>
                    <ul className="space-y-2">
                      {p.respostas.map((r) => (
                        <li key={r.reservaId}>
                          <Link
                            href={`/monitorias/reservas/${r.reservaId}`}
                            className="flex min-h-[52px] items-center gap-3 rounded-xl border border-border px-3 py-2 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Avatar nome={r.monitor?.nome || 'Monitor'} url={r.monitor?.fotoUrl} tamanho={36} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{r.monitor?.nome || 'Monitor'}</span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                {r.monitor && r.monitor.avaliacoes > 0 && (
                                  <><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {r.monitor.nota.toFixed(1)} · </>
                                )}
                                <span className="truncate">{r.anuncioTitulo}</span>
                              </span>
                            </span>
                            <SeloStatus status={r.status} className="hidden min-[420px]:inline-flex" />
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {p.status === 'aberta' ? 'Esperando monitores responderem. Você recebe um aviso a cada resposta.' : 'Nenhum monitor respondeu.'}
                  </p>
                )}
                {p.status === 'aberta' && (
                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground" disabled={encerrando === p.id} onClick={() => encerrar(p.id)}>
                      {encerrando === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tirar do mural'}
                    </Button>
                  </div>
                )}
              </div>
            </CartaoDemanda>
          </li>
        ))}
      </ul>
    </section>
  )
}
