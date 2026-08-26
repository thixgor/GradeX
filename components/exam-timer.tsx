'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'

interface ExamTimerProps {
  endTime: Date
  onTimeUp?: () => void
}

export function ExamTimer({ endTime, onTimeUp }: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
    total: number
  } | null>(null)

  // O prazo chega como Date recriado a cada render da prova; guardamos só o
  // instante em milissegundos para o intervalo não ser reiniciado à toa. O
  // callback vai por ref pela mesma razão.
  const endMs = new Date(endTime).getTime()
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = endMs - now

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 })
        onTimeUpRef.current?.()
        return
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / (1000 * 60)) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      setTimeLeft({ hours, minutes, seconds, total: difference })
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
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm font-semibold ${
        isUrgent
          ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 animate-pulse'
          : isWarning
          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
          : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      }`}
    >
      <Clock className="h-4 w-4" />
      <span>
        {timeLeft.hours > 0 && `${String(timeLeft.hours).padStart(2, '0')}:`}
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
      <span className="text-xs opacity-75">restante{timeLeft.total === 0 && ' - Tempo esgotado!'}</span>
    </div>
  )
}
