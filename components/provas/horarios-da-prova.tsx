'use client'

import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import type { Exam } from '@/lib/types'
import { horariosDaProva } from '@/lib/provas/horarios-da-prova'
import { cn } from '@/lib/utils'

/**
 * A agenda da prova dentro do catálogo.
 *
 * ## O que faltava
 *
 * O cartão de `/provas` mostrava o selo da fase ("Aguardando") e mais nada
 * sobre tempo. Quem está decidindo o dia inteiro em volta da prova precisa
 * saber a que horas o portão abre, a que horas a prova começa e até quando dá
 * para chegar — e isso só existia depois de abrir a prova, no portão desenhado
 * de `components/exam/exam-gate-status.tsx`. Lá é tarde: naquele ponto a
 * pessoa já chegou.
 *
 * ## Um relógio para a lista inteira
 *
 * Cada cartão precisa saber que horas são para dizer "em 2 h 15 min". Um
 * `setInterval` por cartão numa página com dezenas de provas são dezenas de
 * timers acordando o React para, quase sempre, redesenhar o mesmo texto.
 *
 * Aqui há um relógio só, no módulo, com passo de 30 segundos: ele existe
 * enquanto houver ao menos um cartão inscrito e some junto com o último. O
 * passo é de 30s porque a menor unidade que a tela mostra é o minuto — um
 * relógio de 1s gastaria trinta renderizações para mudar um dígito. A contagem
 * fina, de segundos, continua sendo do portão da tela da prova, que é onde ela
 * muda o que a pessoa faz.
 */

const inscritos = new Set<(agora: number) => void>()
let relogio: ReturnType<typeof setInterval> | null = null

function assinarRelogio(avisar: (agora: number) => void): () => void {
  inscritos.add(avisar)
  if (!relogio) {
    relogio = setInterval(() => {
      const agora = Date.now()
      inscritos.forEach((f) => f(agora))
    }, 30_000)
  }
  return () => {
    inscritos.delete(avisar)
    if (inscritos.size === 0 && relogio) {
      clearInterval(relogio)
      relogio = null
    }
  }
}

function useRelogioDaLista(): number {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => assinarRelogio(setAgora), [])
  return agora
}

export function HorariosDaProva({
  prova,
  jaEntrou,
  variante = 'cartao',
  className,
}: {
  prova: Partial<Exam>
  jaEntrou?: boolean
  /** `cartao`: a agenda inteira. `linha`: só o próximo marco, numa frase. */
  variante?: 'cartao' | 'linha'
  className?: string
}) {
  const agora = useRelogioDaLista()
  const marcos = horariosDaProva(prova, new Date(agora), { jaEntrou })

  if (marcos.length === 0) return null

  if (variante === 'linha') {
    // Numa lista densa (as provas dentro de um grupo) só cabe uma informação
    // de tempo, e ela é sempre a mesma: o que vem a seguir. Quando não há mais
    // nada a seguir, o que interessa é quando acabou.
    const marco = marcos.find((m) => m.eOProximo) ?? marcos[marcos.length - 1]
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[10px] tabular-nums',
          marco.eOProximo ? 'text-muted-foreground' : 'text-muted-foreground/50',
          className,
        )}
      >
        <CalendarClock className="h-2.5 w-2.5 flex-shrink-0" aria-hidden />
        <span>
          {marco.rotulo} {marco.texto}
          {marco.eOProximo && marco.espera ? ` · ${marco.espera}` : ''}
        </span>
      </span>
    )
  }

  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-2',
        className,
      )}
    >
      {marcos.map((marco) => (
        <div key={marco.rotulo} className="min-w-0">
          <dt
            className={cn(
              'truncate text-[9px] uppercase tracking-wide',
              marco.jaPassou ? 'text-muted-foreground/60' : 'font-semibold text-muted-foreground',
            )}
          >
            {marco.rotulo}
          </dt>
          <dd className="leading-tight">
            <span
              className={cn(
                'block truncate text-[11px] tabular-nums',
                marco.eOProximo
                  ? 'font-semibold text-foreground'
                  : marco.jaPassou
                    // Sem risco em cima: o marco não foi cancelado, ele
                    // aconteceu. Riscar "Prova começa" com a prova em
                    // andamento diria o contrário do que está acontecendo.
                    ? 'text-muted-foreground/60'
                    : 'text-muted-foreground',
              )}
            >
              {marco.texto}
            </span>
            {/*
              A espera acompanha só o próximo marco: repetida em todos ela vira
              ruído, e nos que já passaram seria contagem para trás. Fica em
              linha própria porque `truncate` na mesma linha comeria justamente
              ela — a metade que a pessoa está lendo.
            */}
            {marco.eOProximo && marco.espera && (
              <span className="block text-[10px] text-primary">{marco.espera}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
