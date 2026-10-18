'use client'

import { Clock } from 'lucide-react'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { PCT_DEVOLVIDO_TARDIO, planoDaMulta, prazosDoCancelamento, TOLERANCIA_FALTA_MIN } from '@/lib/monitorias/politica'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'

/** Prazos da política v5, em horário de Brasília, antes de o aluno precisar deles. */
export function PrazosDoCancelamento({ inicio, valorCentavos, className }: { inicio: string; valorCentavos: number; className?: string }) {
  const { integralAte, metadeAte } = prazosDoCancelamento(new Date(inicio))
  const data = (x: Date) => formatarEmBrasilia(x, { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  const metade = planoDaMulta({ valorCentavos }, PCT_DEVOLVIDO_TARDIO).devolvidoCentavos
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 text-sm', className)}>
      <h2 className="flex items-center gap-1.5 font-semibold"><Clock className="h-4 w-4 text-primary" /> Se precisar cancelar</h2>
      <ul className="mt-2 space-y-1 text-xs">
        <li className="flex justify-between gap-2"><span>Até {data(integralAte)}</span><span className="font-semibold">100% de volta</span></li>
        <li className="flex justify-between gap-2"><span>Até {data(metadeAte)}</span><span className="font-semibold">{formatarCentavos(metade)} ({PCT_DEVOLVIDO_TARDIO}%)</span></li>
        <li className="flex justify-between gap-2"><span>Depois, ou falta</span><span className="font-semibold">sem reembolso</span></li>
      </ul>
      <p className="mt-2 text-[11px] text-muted-foreground">Horário de Brasília. Atraso de mais de {TOLERANCIA_FALTA_MIN} min sem aviso no chat conta como falta. Força maior comprovada: o suporte revisa.</p>
    </div>
  )
}

