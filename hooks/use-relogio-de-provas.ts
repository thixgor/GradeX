'use client'

import { useEffect, useState } from 'react'
import type { Exam } from '@/lib/types'
import { proximoInstanteDaJanela } from '@/lib/provas/horarios-da-prova'

/**
 * Que horas são, para uma lista de provas.
 *
 * ## Por que uma tela de catálogo precisa de relógio
 *
 * A fase de uma prova ("Aguardando", "Portões abertos", "Em andamento") não é
 * um campo que o servidor manda: é uma conta feita na renderização a partir
 * dos horários da prova e da hora atual. Componente que não redesenha, conta
 * que não é refeita — e o cartão congela no estado do instante em que a página
 * abriu.
 *
 * O caso que isso quebrava é justamente o mais importante: alguém abre
 * `/provas` dez minutos antes e fica esperando o portão abrir. Às 13h em ponto
 * o portão abre no banco, no servidor e na tela da prova — e o cartão continua
 * dizendo "Aguardando", com o botão travado, até um F5. A pessoa que fez tudo
 * certo (chegar cedo) é a única punida.
 *
 * ## Dois relógios, por motivos diferentes
 *
 * **O batimento**, de 30 em 30 segundos, é para o TEXTO: "em 2 h 15 min"
 * precisa envelhecer junto com o mundo. Trinta segundos porque a menor unidade
 * que a tela escreve é o minuto — um relógio de 1s gastaria trinta
 * renderizações para mudar um dígito. E é um só para a lista inteira, no
 * módulo: um `setInterval` por cartão, numa página com dezenas de provas, são
 * dezenas de timers acordando o React para redesenhar o mesmo texto. Ele nasce
 * com o primeiro inscrito e morre com o último.
 *
 * **O despertador**, no instante exato do próximo marco, é para a FASE: o
 * batimento sozinho deixaria o botão travado por até 30 segundos depois de o
 * portão abrir. Trinta segundos de porta fechada para quem está com o dedo no
 * botão são trinta segundos de "será que travou?". Aqui o timer é armado para
 * o milissegundo do marco (mais uma folga de 200ms, para o relógio do
 * navegador não chegar adiantado e a conta dizer que ainda falta um instante).
 *
 * A contagem fina, de segundos, continua sendo do portão da tela da prova
 * (`components/exam/exam-gate-status.tsx`) — lá ela muda o que a pessoa faz
 * agora; aqui, no catálogo, ela seria um cronômetro piscando em cada cartão.
 */

const BATIMENTO_MS = 30_000

/**
 * `setTimeout` guarda o atraso num inteiro de 32 bits com sinal: acima de
 * ~24,8 dias ele estoura e o timer dispara IMEDIATAMENTE. Um marco distante
 * viraria um laço de renderização, não um agendamento — por isso a espera
 * longa é cortada em pedaços e o timer se rearma até chegar lá.
 */
const MAIOR_ESPERA_MS = 2_000_000_000

const inscritos = new Set<(agora: number) => void>()
let batimento: ReturnType<typeof setInterval> | null = null

function assinarBatimento(avisar: (agora: number) => void): () => void {
  inscritos.add(avisar)
  if (!batimento) {
    batimento = setInterval(() => {
      const agora = Date.now()
      inscritos.forEach((f) => f(agora))
    }, BATIMENTO_MS)
  }
  return () => {
    inscritos.delete(avisar)
    if (inscritos.size === 0 && batimento) {
      clearInterval(batimento)
      batimento = null
    }
  }
}

/**
 * Devolve a hora atual, em ms, redesenhando quem chamou a cada batimento — e
 * no instante exato em que `prova` muda de fase, quando ela é passada.
 */
export function useRelogioDeProvas(
  prova?: Partial<Exam> | null,
  pessoa?: { jaEntrou?: boolean },
): number {
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => assinarBatimento(setAgora), [])

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
