'use client'

import { Fragment, useEffect, useRef, useState } from 'react'

interface CountdownProps {
  targetDate: Date
  onComplete?: () => void
  /**
   * `ios`: números grandes separados por dois-pontos, para a sala de espera da
   * prova (estilo em components/exam/prova-ios.css, dentro do `.vidro-ios`).
   */
  variante?: 'padrao' | 'ios'
}

export function Countdown({ targetDate, onComplete, variante = 'padrao' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  /*
   * Duas armadilhas do contrato antigo, as duas visíveis na sala de espera:
   *
   * 1. `onComplete` era chamado a CADA TICK depois que o alvo passava. Quem
   *    chegava com a prova já liberada via o aviso "você já pode iniciar"
   *    reaparecer uma vez por segundo, indefinidamente.
   * 2. `onComplete` entrava no array de dependências. Como a tela o passa como
   *    arrow inline, ele é uma função nova a cada render — o efeito era
   *    desmontado e remontado sem parar, derrubando o intervalo junto.
   *
   * O ref carrega o callback (sempre o mais recente, sem virar dependência) e o
   * `disparado` garante que ele acontece uma vez só.
   */
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const disparadoRef = useRef(false)
  const alvoEmMs = new Date(targetDate).getTime()

  useEffect(() => {
    disparadoRef.current = false
  }, [alvoEmMs])

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = alvoEmMs - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        if (!disparadoRef.current) {
          disparadoRef.current = true
          onCompleteRef.current?.()
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
  }, [alvoEmMs])

  if (!timeLeft) return null

  if (variante === 'ios') {
    const blocos = [
      ...(timeLeft.days > 0 ? [{ valor: String(timeLeft.days), rotulo: timeLeft.days === 1 ? 'dia' : 'dias' }] : []),
      { valor: String(timeLeft.hours).padStart(2, '0'), rotulo: 'horas' },
      { valor: String(timeLeft.minutes).padStart(2, '0'), rotulo: 'min' },
      { valor: String(timeLeft.seconds).padStart(2, '0'), rotulo: 'seg' },
    ]
    return (
      <div className="pv-contagem-grande" role="timer" aria-live="off">
        {blocos.map((b, i) => (
          <Fragment key={b.rotulo}>
            {i > 0 && <i aria-hidden>:</i>}
            <div>
              <strong>{b.valor}</strong>
              <span>{b.rotulo}</span>
            </div>
          </Fragment>
        ))}
      </div>
    )
  }

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
