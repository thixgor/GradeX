'use client'

import { useEffect, useState } from 'react'
import type { Exam } from '@/lib/types'
import { proximoInstanteDaJanela } from '@/lib/provas/horarios-da-prova'

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
 *
 * ## O batimento não basta para a FASE
 *
 * Trinta segundos são pouco para um texto e muito para uma porta. O portão
 * abre às 13h em ponto; com só o batimento, o botão do cartão continuaria
 * travado até 13h00:30 — e trinta segundos de porta fechada, para quem está
 * com o dedo no botão esperando exatamente aquele instante, são trinta
 * segundos de "será que travou?".
 *
 * Por isso quem passa uma prova ao hook ganha também um DESPERTADOR, armado
 * para o milissegundo do próximo marco dela (mais 200 ms de folga, para o
 * relógio do navegador não chegar adiantado e a conta ainda dizer que falta um
 * instante). Quem não passa nada — o painel do admin — fica só com o
 * batimento, que é o que ele precisa.
 */

const PASSO = 30_000

/**
 * `setTimeout` guarda o atraso num inteiro de 32 bits com sinal: acima de
 * ~24,8 dias ele estoura e o timer dispara IMEDIATAMENTE. Um marco distante
 * viraria um laço de renderização, não um agendamento — por isso a espera
 * longa é cortada em pedaços e o timer se rearma até chegar lá.
 */
const MAIOR_ESPERA_MS = 2_000_000_000

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

/**
 * O instante atual em milissegundos, atualizado a cada 30 segundos — e, quando
 * `prova` é passada, também no instante exato em que ela muda de fase.
 */
export function useRelogioDaLista(
  prova?: Partial<Exam> | null,
  pessoa?: { jaEntrou?: boolean },
): number {
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => assinarRelogio(setAgora), [])

  // Derivado do `agora` atual, e não de um estado à parte: quando o marco
  // passa, o próprio redesenho recalcula qual é o seguinte e o efeito se
  // rearma sozinho.
  const jaEntrou = !!pessoa?.jaEntrou
  const alvo = prova ? proximoInstanteDaJanela(prova, new Date(agora), { jaEntrou }) : null

  useEffect(() => {
    if (alvo === null) return
    let timer: ReturnType<typeof setTimeout>
    const armar = () => {
      const falta = alvo - Date.now()
      if (falta <= 0) {
        setAgora(Date.now())
        return
      }
      timer = setTimeout(armar, Math.min(falta + 200, MAIOR_ESPERA_MS))
    }
    armar()
    return () => clearTimeout(timer)
  }, [alvo])

  return agora
}
