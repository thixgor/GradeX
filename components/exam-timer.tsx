'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import {
  agoraEmBrasilia,
  horaDeBrasilia,
  partesDaContagem,
  tempoRestante,
} from '@/lib/provas/relogio-da-prova'

interface ExamTimerProps {
  endTime: Date
  /**
   * Quanto o relógio deste aparelho está atrasado em relação ao de Brasília
   * (ver `lib/provas/relogio-da-prova.ts`). Sem ele a contagem usa o relógio
   * local — que é o comportamento antigo, e o motivo de uma prova acabar
   * sozinha no aparelho com a hora errada.
   */
  desvioDoRelogio?: number | null
  /**
   * Avisa que o prazo acabou.
   *
   * Dispara UMA vez. Antes, o intervalo continuava rodando depois do zero e
   * chamava este aviso a cada segundo — e como o cronômetro aparece duas vezes
   * na tela da prova (a versão do desktop e a do celular, uma escondida por
   * CSS mas as duas montadas), quem escutava recebia duas entregas por segundo,
   * para sempre. Quem encerra a prova hoje é a própria tela
   * (`app/exam/[id]/page.tsx`), com um relógio só; isto aqui sobrou para quem
   * usar o componente fora dali.
   */
  onTimeUp?: () => void
}

export function ExamTimer({ endTime, desvioDoRelogio, onTimeUp }: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof partesDaContagem> | null>(null)

  // O prazo chega como Date recriado a cada render da prova; guardamos só o
  // instante em milissegundos para o intervalo não ser reiniciado à toa. O
  // callback vai por ref pela mesma razão.
  const endMs = new Date(endTime).getTime()
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp
  const desvioRef = useRef(desvioDoRelogio)
  desvioRef.current = desvioDoRelogio
  const avisouRef = useRef(false)

  useEffect(() => {
    avisouRef.current = false

    const calculateTimeLeft = () => {
      const restante = tempoRestante(endMs, agoraEmBrasilia(desvioRef.current))
      if (restante === null) return

      setTimeLeft(partesDaContagem(restante))

      if (restante <= 0 && !avisouRef.current) {
        avisouRef.current = true
        onTimeUpRef.current?.()
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [endMs])

  if (!timeLeft) {
    return null
  }

  const isUrgent = timeLeft.total < 5 * 60 * 1000 // Menos de 5 minutos
  const isWarning = timeLeft.total < 15 * 60 * 1000 // Menos de 15 minutos

  return (
    <div
      // O prazo por extenso, e em que fuso ele está: quem confere a contagem
      // contra o relógio do próprio celular precisa saber qual dos dois é a
      // referência da prova.
      title={`A prova termina às ${horaDeBrasilia(endMs)} (horário de Brasília)`}
      // No celular o cronômetro divide a linha do cabeçalho com os controles
      // e a marca, então encolhe: menos respiro nas laterais e um corpo menor.
      className={`flex shrink-0 items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-mono text-xs sm:text-sm font-semibold whitespace-nowrap ${
        isUrgent
          ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 animate-pulse'
          : isWarning
          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
          : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      }`}
    >
      <Clock className="h-4 w-4" />
      <span>
        {timeLeft.horas > 0 && `${String(timeLeft.horas).padStart(2, '0')}:`}
        {String(timeLeft.minutos).padStart(2, '0')}:
        {String(timeLeft.segundos).padStart(2, '0')}
      </span>
      {/* "restante" é a palavra que sobra quando a tela é estreita: os dois
          pontos entre os números já dizem que aquilo é uma contagem. O aviso
          de tempo esgotado aparece em qualquer largura — aí a palavra é a
          informação, não o enfeite. */}
      <span className={`text-xs opacity-75 ${timeLeft.total === 0 ? '' : 'hidden sm:inline'}`}>
        {timeLeft.total === 0 ? 'Tempo esgotado!' : 'restante'}
      </span>
    </div>
  )
}
