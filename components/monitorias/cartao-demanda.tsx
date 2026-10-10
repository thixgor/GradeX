'use client'

/**
 * Cartão de um pedido de monitoria (o que o aluno precisa). O mesmo desenho no
 * mural do monitor, em "Meus pedidos", na vitrine e na sala da conversa.
 */

import type { ReactNode } from 'react'
import { CalendarDays, Clock, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import { haQuantoTempo, PERIODOS_DEMANDA, QUANDO_DEMANDA, type ResumoDemanda } from '@/lib/monitorias/demandas-regras'

export function CartaoDemanda({
  d,
  criadoEm,
  destaque,
  topo,
  children,
  className,
}: {
  d: ResumoDemanda
  criadoEm?: string | Date
  /** Selo no canto (ex.: "Sua matéria"). */
  destaque?: ReactNode
  /** Linha acima da matéria (ex.: "Bruno procura"). */
  topo?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const periodos = d.periodos.map((p) => PERIODOS_DEMANDA[p]).join(' / ')
  return (
    <article className={cn('rounded-2xl border border-border bg-card p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {topo && <p className="mb-0.5 text-xs text-muted-foreground">{topo}</p>}
          <h3 className="break-words font-heading text-lg font-semibold leading-snug">{d.materia}</h3>
          {d.assunto && <p className="mt-0.5 break-words text-sm text-muted-foreground">{d.assunto}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {destaque}
          {criadoEm && <span className="text-xs text-muted-foreground">{haQuantoTempo(new Date(criadoEm), new Date())}</span>}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <Etiqueta icone={<Users className="h-3.5 w-3.5" />}>{d.pessoas > 1 ? `${d.pessoas} pessoas` : 'Individual'}</Etiqueta>
        <Etiqueta icone={<Clock className="h-3.5 w-3.5" />}>{formatarDuracao(d.duracaoMin)}</Etiqueta>
        <Etiqueta icone={<CalendarDays className="h-3.5 w-3.5" />}>
          {QUANDO_DEMANDA[d.quando]}
          {periodos && `, ${periodos.toLowerCase()}`}
        </Etiqueta>
      </ul>
      <p className="mt-3 flex items-baseline gap-1.5">
        {d.valorPorPessoaCentavos ? (
          <>
            <span className="text-xs text-muted-foreground">até</span>
            <span className="font-heading text-xl font-semibold tabular-nums">{formatarCentavos(d.valorPorPessoaCentavos)}</span>
            <span className="text-xs text-muted-foreground">{d.pessoas > 1 ? 'por pessoa' : 'a aula'}</span>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" /> Aberto a propostas
          </span>
        )}
      </p>
      {children}
    </article>
  )
}

function Etiqueta({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-lg bg-muted/70 px-2 py-1 font-medium text-foreground/80">
      <span className="text-muted-foreground">{icone}</span>
      {children}
    </li>
  )
}
