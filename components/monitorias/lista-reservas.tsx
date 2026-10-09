'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarCheck, ChevronRight, GraduationCap, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Esqueleto, SeloStatus, api } from '@/components/monitorias/base'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'
import type { StatusReserva } from '@/lib/monitorias/tipos'

export interface ItemReserva {
  id: string
  anuncioTitulo: string
  status: StatusReserva
  origem: string
  inicio: string | null
  duracaoMin: number | null
  vagas: number
  valorPorPessoaCentavos: number | null
  gratis: boolean
  prazoPagamento: string | null
  souOrganizador: boolean
  updatedAt: string
}

export function ListaReservas({ papel }: { papel: 'aluno' | 'monitor' }) {
  const [escopo, setEscopo] = useState<'ativas' | 'todas'>('ativas')
  const [itens, setItens] = useState<ItemReserva[] | null>(null)

  useEffect(() => {
    setItens(null)
    api<{ reservas: ItemReserva[] }>(`/api/monitorias/reservas?papel=${papel}&escopo=${escopo}`)
      .then((r) => setItens(r.reservas))
      .catch(() => setItens([]))
  }, [papel, escopo])

  return (
    <div>
      <div className="mb-4 inline-flex rounded-xl border border-border bg-card p-1">
        {(['ativas', 'todas'] as const).map((e) => (
          <button key={e} type="button" onClick={() => setEscopo(e)} className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition', escopo === e ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
            {e === 'ativas' ? 'Em andamento' : 'Histórico'}
          </button>
        ))}
      </div>
      {!itens ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Esqueleto key={i} className="h-20" />)}</div>
      ) : itens.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <CalendarCheck className="mx-auto h-9 w-9 text-primary" />
          <p className="mt-3 font-semibold">{papel === 'aluno' ? 'Nenhuma monitoria por aqui' : 'Nenhum pedido ainda'}</p>
          <p className="mt-1 text-sm text-muted-foreground">{papel === 'aluno' ? 'Encontre um monitor e agende sua primeira aula.' : 'Quando alguém pedir sua monitoria, aparece aqui.'}</p>
          {papel === 'aluno' && <Link href="/monitorias"><Button className="mt-4"><Search className="mr-2 h-4 w-4" /> Explorar monitorias</Button></Link>}
        </div>
      ) : (
        <ul className="space-y-2.5">
          <AnimatePresence>
            {itens.map((r, i) => (
              <motion.li key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link href={`/monitorias/reservas/${r.id}`} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {r.inicio ? (
                      <>
                        <span className="text-[10px] font-semibold uppercase">{formatarEmBrasilia(r.inicio, { month: 'short' }).replace('.', '')}</span>
                        <span className="text-lg font-bold leading-none">{formatarEmBrasilia(r.inicio, { day: '2-digit' })}</span>
                      </>
                    ) : (
                      <GraduationCap className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold group-hover:text-primary">{r.anuncioTitulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.inicio ? `${formatarEmBrasilia(r.inicio, { weekday: 'short', hour: '2-digit', minute: '2-digit' })} (Brasília)` : 'Data a combinar'}
                      {r.duracaoMin ? ` · ${formatarDuracao(r.duracaoMin)}` : ''}
                      {r.vagas > 1 ? ` · grupo de ${r.vagas}` : ''}
                      {r.gratis ? ' · grátis' : r.valorPorPessoaCentavos ? ` · ${formatarCentavos(r.valorPorPessoaCentavos)}` : ''}
                    </p>
                  </div>
                  <SeloStatus status={r.status} className="hidden sm:inline-flex" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
