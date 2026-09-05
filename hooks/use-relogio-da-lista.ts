'use client'

import { useEffect, useState } from 'react'

/**
 * Um relógio só para uma lista inteira.
 *
 * ## Por que existe
 *
 * Telas que listam provas decidem coisas pelo horário: o selo da fase, o
 * "faltam 2 h 15 min" do catálogo, o par de botões "Forçar Início"/"Forçar
 * Término" do painel. Essas decisões saíam de um `new Date()` avaliado durante
 * a renderização — ou seja, elas só mudavam quando alguma OUTRA coisa fazia a
 * página renderizar. Uma prova que começava às 14h continuava oferecendo
 * "Forçar Início" às 14h30 até alguém recarregar a página, e recarregar a
 * página para ver a tela concordar com o relógio é exatamente o hábito que
 * uma lista dessas deveria dispensar.
 *
 * ## Um timer, não um por cartão
 *
 * Um `setInterval` dentro de cada cartão, numa lista com dezenas de provas,
 * são dezenas de timers acordando o React para, quase sempre, redesenhar o
 * mesmo texto. Aqui há um relógio no módulo: ele nasce com o primeiro inscrito
 * e some com o último.
 *
 * O passo é de 30 segundos porque a menor unidade que essas telas mostram é o
 * minuto — um relógio de 1 s gastaria trinta renderizações para mudar um
 * dígito. A contagem fina, de segundos, é do portão da tela da prova
 * (`components/exam/exam-gate-status.tsx`), que é onde ela muda o que a pessoa
 * faz.
 */

const PASSO = 30_000

const inscritos = new Set<(agora: number) => void>()
let relogio: ReturnType<typeof setInterval> | null = null

function assinarRelogio(avisar: (agora: number) => void): () => void {
  inscritos.add(avisar)
  if (!relogio) {
    relogio = setInterval(() => {
      const agora = Date.now()
      inscritos.forEach(f => f(agora))
    }, PASSO)
  }
  return () => {
    inscritos.delete(avisar)
    if (inscritos.size === 0 && relogio) {
      clearInterval(relogio)
      relogio = null
    }
  }
}

/** O instante atual em milissegundos, atualizado a cada 30 segundos. */
export function useRelogioDaLista(): number {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => assinarRelogio(setAgora), [])
  return agora
}
