'use client'

import { useId, useState } from 'react'
import { Eye } from 'lucide-react'

import type { AchadoMorfologico, HistopatologiaPorAumento } from './tipos'
import { MARCA_DE_PESO, type IdDeAumento } from './tema'
import { SeletorDeAumento } from './seletor-aumento'

/**
 * Roteiro microscópico por aumento.
 *
 * ## O que este componente ensina, além do conteúdo
 *
 * Ele ensina um método. Cada nível abre com "procure primeiro", e cada achado
 * vem em três partes fixas — o que se vê, o processo que produz aquilo, e a
 * consequência. Um cartão de achado nunca é só um adjetivo morfológico; o
 * contrato de dados não permite, e a interface torna a estrutura visível.
 *
 * ## Peso diagnóstico à vista
 *
 * Cada achado carrega seu peso: frequente, sugestivo, necessário ou suficiente.
 * É o antídoto para "patognomônico" — a palavra que faz um estudante parar de
 * procurar quando encontra um achado que, na verdade, apenas sugere. Necrose
 * caseosa é sugestiva de tuberculose; ela não prova, e a interface diz isso em
 * cada cartão em vez de deixar a nuance num parágrafo que ninguém relê.
 *
 * Todos os níveis existem simultaneamente no DOM apenas quando visíveis: o
 * seletor troca o painel, e o conteúdo dos outros níveis não é renderizado —
 * quatro listas completas de achados no DOM de uma vez tornam a página difícil
 * de percorrer com leitor de tela.
 */
export function RoteiroMicroscopico({ roteiro }: { roteiro: HistopatologiaPorAumento }) {
  const [aumento, setAumento] = useState<IdDeAumento>('panoramica')
  const idDoPainel = useId()
  const nivel = roteiro[aumento]

  return (
    <div>
      <SeletorDeAumento valor={aumento} aoTrocar={setAumento} idDoPainel={idDoPainel} />

      <div
        id={idDoPainel}
        role="region"
        aria-live="polite"
        className="mt-3 rounded-xl border border-border bg-card p-4"
      >
        <p className="inline-flex items-start gap-2 text-sm leading-relaxed">
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
          <span>
            <span className="font-bold">Procure primeiro: </span>
            {nivel.procure}
          </span>
        </p>

        <ul className="mt-3 space-y-2.5">
          {nivel.achados.map((achado) => (
            <li key={achado.achado}>
              <CartaoDeAchado achado={achado} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-xl border border-teal-600/25 bg-teal-500/5 p-4">
        <p className="text-xs font-bold">Síntese diagnóstica</p>
        <p className="mt-1 text-sm leading-relaxed">{roteiro.sintese}</p>
      </div>
    </div>
  )
}

export function CartaoDeAchado({ achado }: { achado: AchadoMorfologico }) {
  const marca = MARCA_DE_PESO[achado.peso] ?? MARCA_DE_PESO.frequente
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug">{achado.achado}</p>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${marca.classe}`}
          title="Peso diagnóstico do achado"
        >
          <span aria-hidden>{marca.simbolo}</span> {marca.rotulo}
        </span>
      </div>
      <dl className="mt-1.5 space-y-1 text-xs leading-relaxed text-muted-foreground">
        <div>
          <dt className="inline font-bold">Por que aparece: </dt>
          <dd className="inline">{achado.processo}</dd>
        </div>
        <div>
          <dt className="inline font-bold">O que significa: </dt>
          <dd className="inline">{achado.consequencia}</dd>
        </div>
      </dl>
    </div>
  )
}
