'use client'

import { useEffect, useState } from 'react'

interface CountdownProps {
  targetDate: Date
  onComplete?: () => void
}

export function Countdown({ targetDate, onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const difference = target - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        if (onComplete) {
          onComplete()
        }
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate, onComplete])

  if (!timeLeft) return null

  return (
    <div className="flex items-center justify-center gap-4">
      {timeLeft.days > 0 && (
        <div className="flex flex-col items-center bg-muted rounded-lg p-4 min-w-[80px]">
          <span className="text-3xl font-bold text-primary">{timeLeft.days}</span>
          <span className="text-xs text-muted-foreground uppercase">
            {timeLeft.days === 1 ? 'Dia' : 'Dias'}
          </span>
        </div>
      )}
      <div className="flex flex-col items-center bg-muted rounded-lg p-4 min-w-[80px]">
        <span className="text-3xl font-bold text-primary">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground uppercase">Horas</span>
      </div>
      <div className="flex flex-col items-center bg-muted rounded-lg p-4 min-w-[80px]">
        <span className="text-3xl font-bold text-primary">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground uppercase">Min</span>
      </div>
      <div className="flex flex-col items-center bg-muted rounded-lg p-4 min-w-[80px]">
        <span className="text-3xl font-bold text-primary">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground uppercase">Seg</span>
      </div>
    </div>
  )
}
