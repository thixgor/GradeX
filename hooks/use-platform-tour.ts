'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Estado do tour interativo da dashboard.
 *
 * Três situações precisam ser distinguidas — e é por isso que aqui não basta
 * uma flag booleana de "já viu":
 *
 *  - nunca fez  → o tour abre sozinho na primeira visita;
 *  - parou no meio → NÃO abre sozinho de novo (seria insistência), mas o botão
 *    passa a oferecer "retomar do passo N";
 *  - concluiu   → nunca mais abre sozinho; o botão continua ali para quem
 *    quiser rever.
 *
 * A chave carrega a versão do roteiro e o id do usuário: mexeu nos passos, é
 * um tour novo e todo mundo vê de novo; e duas contas no mesmo aparelho não
 * herdam o progresso uma da outra.
 */

const TOUR_VERSION = 'v1'

export type TourStatus = 'new' | 'paused' | 'done'

interface PersistedState {
  status: Exclude<TourStatus, 'new'>
  step: number
  at: number
}

function storageKey(userId?: string | null) {
  return `gradex:dashboard-tour:${TOUR_VERSION}:${userId || 'anon'}`
}

function read(userId?: string | null): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed?.status !== 'paused' && parsed?.status !== 'done') return null
    return parsed
  } catch {
    return null
  }
}

function write(userId: string | null | undefined, state: PersistedState) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state))
  } catch {
    /* modo privado / storage cheio — o tour só deixa de lembrar, não quebra */
  }
}

export interface PlatformTourController {
  /** Só vira true depois de ler o storage — evita piscar o botão no estado errado. */
  ready: boolean
  open: boolean
  status: TourStatus
  /** Passo em que o usuário parou, quando saiu no meio. */
  pausedStep: number | null
  /** Passo em que o tour deve abrir (0 ou o ponto de retomada). */
  initialStep: number
  start: (fromStep?: number) => void
  /** Saiu no meio: guarda onde parou para oferecer a retomada. */
  dismiss: (step: number) => void
  /** Chegou ao fim. */
  finish: () => void
}

export function usePlatformTour({
  userId,
  autoStart = true,
  autoStartDelayMs = 900,
}: {
  userId?: string | null
  autoStart?: boolean
  autoStartDelayMs?: number
}): PlatformTourController {
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<TourStatus>('new')
  const [pausedStep, setPausedStep] = useState<number | null>(null)
  const [initialStep, setInitialStep] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = read(userId)

    if (saved) {
      setStatus(saved.status)
      setPausedStep(saved.status === 'paused' ? saved.step : null)
      setInitialStep(saved.status === 'paused' ? saved.step : 0)
      setReady(true)
      return
    }

    setStatus('new')
    setReady(true)

    if (!autoStart) return
    // Espera o dashboard assentar: os alvos precisam existir e estar medidos
    // antes do primeiro holofote, senão o recorte nasce no lugar errado.
    const timer = window.setTimeout(() => setOpen(true), autoStartDelayMs)
    return () => window.clearTimeout(timer)
  }, [userId, autoStart, autoStartDelayMs])

  const start = useCallback((fromStep = 0) => {
    setInitialStep(Math.max(0, fromStep))
    setOpen(true)
  }, [])

  const dismiss = useCallback(
    (step: number) => {
      setOpen(false)
      // Quem já concluiu e estava só revendo não volta para o estado "pausado":
      // o botão continuaria oferecendo "retomar" um tour que já foi feito.
      if (status === 'done') {
        setInitialStep(0)
        return
      }
      // Sair no passo 0 não é progresso — não faz sentido oferecer retomada de
      // um tour que a pessoa nem começou. Mas o registro tem de existir, senão
      // ele reabre sozinho na próxima visita.
      const safeStep = Math.max(0, step)
      setStatus('paused')
      setPausedStep(safeStep > 0 ? safeStep : null)
      setInitialStep(safeStep)
      write(userId, { status: 'paused', step: safeStep, at: Date.now() })
    },
    [status, userId],
  )

  const finish = useCallback(() => {
    setOpen(false)
    setStatus('done')
    setPausedStep(null)
    setInitialStep(0)
    write(userId, { status: 'done', step: 0, at: Date.now() })
  }, [userId])

  return { ready, open, status, pausedStep, initialStep, start, dismiss, finish }
}
