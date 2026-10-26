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

  // Desenhado dentro do escopo `.vidro-ios` da prova: `.pv-relogio` em
  // components/exam/prova-ios.css. Neutro enquanto sobra tempo, âmbar nos
  // últimos 15 minutos, vermelho nos últimos 5 — e só o ponto pulsa: um
  // número que pisca inteiro é mais difícil de ler justamente quando importa.
  return (
    <div
      // O prazo por extenso, e em que fuso ele está: quem confere a contagem
      // contra o relógio do próprio celular precisa saber qual dos dois é a
      // referência da prova.
      title={`A prova termina às ${horaDeBrasilia(endMs)} (horário de Brasília)`}
      role="timer"
      aria-label={`Tempo restante da prova: ${timeLeft.horas} h ${timeLeft.minutos} min`}
      className="pv-relogio"
      data-nivel={isUrgent ? 'urgente' : isWarning ? 'atencao' : 'normal'}
    >
      {isUrgent ? <span className="pv-ponto" aria-hidden /> : <Clock className="h-4 w-4 opacity-70" aria-hidden />}
      <span>
        {timeLeft.horas > 0 && `${String(timeLeft.horas).padStart(2, '0')}:`}
        {String(timeLeft.minutos).padStart(2, '0')}:
        {String(timeLeft.segundos).padStart(2, '0')}
      </span>
      {/* "restante" é a palavra que sobra quando a tela é estreita: os dois
          pontos entre os números já dizem que aquilo é uma contagem. O aviso
          de tempo esgotado aparece em qualquer largura — aí a palavra é a
          informação, não o enfeite. */}
      <small className={timeLeft.total === 0 ? '' : 'hidden lg:inline'}>
        {timeLeft.total === 0 ? 'Tempo esgotado' : 'restante'}
      </small>
    </div>
  )
}
