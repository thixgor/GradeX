'use client'

import { Clock, DoorClosed, DoorOpen, Flag, Hourglass } from 'lucide-react'
import type { FaseDaProva, JanelaDaProva } from '@/lib/provas/janela-da-prova'
import { cn } from '@/lib/utils'

/**
 * O painel de portões da prova.
 *
 * Os quatro marcos (portão abre → prova começa → prova termina → portão fecha)
 * existiam no banco e no formulário do admin, mas o aluno nunca os via em lugar
 * nenhum: a tela da prova mostrava "Início" e "Término" como duas datas soltas
 * num cartão de estatísticas, e o portão simplesmente não aparecia.
 *
 * Aqui eles viram uma linha do tempo com um marcador que anda. É a diferença
 * entre "a prova é às 14h" e "faltam 8 minutos para o portão fechar" — e essa
 * segunda frase é a que muda o que a pessoa faz nos próximos minutos.
 */

const APARENCIA: Record<
  FaseDaProva,
  { icone: typeof Clock; classe: string; titulo: string }
> = {
  livre: { icone: DoorOpen, classe: 'text-emerald-600 dark:text-emerald-400', titulo: 'Disponível' },
  'antes-do-portao': { icone: DoorClosed, classe: 'text-slate-500', titulo: 'Portões ainda fechados' },
  'sala-de-espera': { icone: Hourglass, classe: 'text-blue-600 dark:text-blue-400', titulo: 'Portões abertos' },
  'em-andamento': { icone: DoorOpen, classe: 'text-emerald-600 dark:text-emerald-400', titulo: 'Prova em andamento' },
  'portao-fechado': { icone: DoorClosed, classe: 'text-amber-600 dark:text-amber-400', titulo: 'Portões fechados' },
  encerrada: { icone: Flag, classe: 'text-rose-600 dark:text-rose-400', titulo: 'Prova encerrada' },
}

function hora(data: Date | null): string {
  if (!data) return '—'
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Marcos na ordem cronológica, com o índice do que está valendo agora. */
function marcosDaJanela(janela: JanelaDaProva) {
  const marcos = [
    { rotulo: 'Portão abre', quando: janela.abrePortaoEm },
    { rotulo: 'Prova começa', quando: janela.comecaEm },
    { rotulo: 'Prova termina', quando: janela.terminaEm },
    { rotulo: 'Portão fecha', quando: janela.fechaPortaoEm },
  ]
  const agora = Date.now()
  const passados = marcos.filter((m) => m.quando && new Date(m.quando).getTime() <= agora).length
  return { marcos, passados }
}

export function ExamGateStatus({
  janela,
  className,
  compacto = false,
}: {
  janela: JanelaDaProva
  className?: string
  compacto?: boolean
}) {
  if (janela.fase === 'livre') return null

  const { icone: Icone, classe, titulo } = APARENCIA[janela.fase]
  const { marcos, passados } = marcosDaJanela(janela)

  if (compacto) {
    return (
      <div className={cn('inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5', className)}>
        <Icone className={cn('h-3.5 w-3.5', classe)} />
        <span className={cn('text-xs font-semibold', classe)}>{titulo}</span>
      </div>
    )
  }

  return (
    <div className={cn('rounded-2xl border border-border/60 bg-muted/30 p-4', className)}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl bg-background/80', classe)}>
          <Icone className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className={cn('text-sm font-bold leading-tight', classe)}>{titulo}</p>
          {janela.motivo && <p className="text-xs leading-snug text-muted-foreground">{janela.motivo}</p>}
        </div>
      </div>

      <ol className="relative space-y-0">
        {marcos.map((marco, i) => {
          const jaPassou = i < passados
          const eOAtual = i === passados - 1
          return (
            <li key={marco.rotulo} className="relative flex items-center gap-3 py-1.5">
              {/* A linha que liga os marcos para de existir no último. */}
              {i < marcos.length - 1 && (
                <span
                  className={cn(
                    'absolute left-[5px] top-[22px] h-[calc(100%-8px)] w-px',
                    jaPassou ? 'bg-emerald-500/40' : 'bg-border',
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'relative z-10 h-2.5 w-2.5 flex-shrink-0 rounded-full ring-4 ring-background transition-colors',
                  eOAtual
                    ? 'bg-emerald-500 exam-marco-pulsa'
                    : jaPassou
                      ? 'bg-emerald-500/60'
                      : 'bg-border',
                )}
                aria-hidden
              />
              <span className={cn('text-xs', jaPassou ? 'text-muted-foreground' : 'font-medium text-foreground')}>
                {marco.rotulo}
              </span>
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">{hora(marco.quando)}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
