'use client'

import { AlertTriangle, Clock, History, Send, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VereditoDeRetomada } from '@/lib/provas/retomada'

/**
 * O aviso de que a prova não foi perdida.
 *
 * Quem cai no meio de uma prova volta esperando o pior. Esta é a primeira coisa
 * que ele lê — e ela precisa dizer três coisas nesta ordem: **o que sobreviveu**
 * (tantas respostas), **o que dá para fazer** (continuar) e **quantas vezes
 * ainda dá** (uma, e só uma). A terceira não é letra miúda: sem ela, a segunda
 * queda seria uma surpresa desagradável em vez de uma regra conhecida.
 *
 * Quando a retomada acaba, o cartão não vira um beco — ele oferece entregar o
 * que ficou gravado. A regra é "não continua respondendo", nunca "perde tudo".
 */
export function ExamResumeCard({
  veredito,
  respondidas,
  totalDeQuestoes,
  salvoEm,
  retomando,
  entregando,
  onContinuar,
  onEntregar,
}: {
  veredito: VereditoDeRetomada
  respondidas: number
  totalDeQuestoes: number
  salvoEm?: string | Date | null
  retomando?: boolean
  entregando?: boolean
  onContinuar: () => void
  onEntregar: () => void
}) {
  if (!veredito.temProgresso) return null

  const podeContinuar = veredito.podeRetomar

  /*
   * O título vem do MOTIVO, não de "pode continuar ou não".
   *
   * Ele era um ternário de dois lados: continuar → "Sua prova não foi
   * perdida"; qualquer outra coisa → "Retomada já utilizada". Só que "qualquer
   * outra coisa" inclui a prova encerrada e a prova que ainda nem começou —
   * e quem chegava cedo lia, sobre uma prova cujo portão nem abriu, que tinha
   * gastado uma retomada que ninguém usou.
   */
  const aparencia = podeContinuar
    ? {
        titulo: 'Sua prova não foi perdida',
        Icone: History,
        moldura: 'border-emerald-500/35 bg-emerald-50/50 dark:bg-emerald-950/20',
        selo: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      }
    : veredito.motivo === 'prova-nao-comecou'
      ? {
          titulo: 'Suas respostas estão guardadas',
          Icone: Clock,
          moldura: 'border-blue-500/35 bg-blue-50/50 dark:bg-blue-950/20',
          selo: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
        }
      : veredito.motivo === 'prova-encerrada'
        ? {
            titulo: 'A prova foi encerrada',
            Icone: AlertTriangle,
            moldura: 'border-amber-500/35 bg-amber-50/50 dark:bg-amber-950/20',
            selo: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
          }
        : {
            titulo: 'Retomada já utilizada',
            Icone: AlertTriangle,
            moldura: 'border-amber-500/35 bg-amber-50/50 dark:bg-amber-950/20',
            selo: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
          }

  const quando = salvoEm
    ? new Date(salvoEm).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
    : null

  return (
    <div className={`exam-retomada-entra relative overflow-hidden rounded-2xl border p-5 ${aparencia.moldura}`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${aparencia.selo}`}>
          <aparencia.Icone className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-base font-bold leading-tight">{aparencia.titulo}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {veredito.mensagem ??
                `Encontramos ${respondidas} ${respondidas === 1 ? 'resposta salva' : 'respostas salvas'}${
                  totalDeQuestoes ? ` de ${totalDeQuestoes} questões` : ''
                }. Você pode continuar de onde parou.`}
            </p>
            {quando && (
              <p className="mt-1 text-xs text-muted-foreground">
                Última gravação automática às {quando}.
              </p>
            )}
          </div>

          {/* A barra é o argumento visual: mostra que há trabalho a salvar. */}
          {totalDeQuestoes > 0 && (
            <div className="space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-background/70">
                <div
                  className="exam-retomada-barra h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${Math.min(100, (respondidas / totalDeQuestoes) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
                {respondidas} de {totalDeQuestoes} respondidas
              </p>
            </div>
          )}

          {podeContinuar && (
            <p className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Esta é a sua <strong className="text-foreground">única retomada</strong>. O cronômetro continua
                de onde parou — retomar devolve as respostas, não o tempo.
              </span>
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-0.5">
            {podeContinuar && (
              <Button
                onClick={onContinuar}
                disabled={retomando}
                className="rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
              >
                {retomando ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Retomando…
                  </>
                ) : (
                  <>
                    <History className="mr-2 h-4 w-4" />
                    Continuar de onde parei
                  </>
                )}
              </Button>
            )}

            {veredito.podeEntregarOSalvo && (
              <Button
                variant={podeContinuar ? 'outline' : 'default'}
                onClick={onEntregar}
                disabled={entregando}
                className="rounded-xl"
              >
                <Send className="mr-2 h-4 w-4" />
                {entregando ? 'Entregando…' : 'Entregar o que está salvo'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
