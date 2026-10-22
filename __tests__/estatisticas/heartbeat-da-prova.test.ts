import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * O heartbeat da prova confere a cada 30 s, mas só envia quando o progresso
 * mudou ou quando passou o silêncio máximo (ver `lib/tracking/shared.ts`).
 */

const enviados: Array<{ event: string; answeredCount?: number }> = []

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-22T12:00:00Z'))
  enviados.length = 0
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => {
    enviados.push(JSON.parse(init.body))
    return new Response('{}')
  }))
  vi.stubGlobal('document', { visibilityState: 'visible', addEventListener: vi.fn(), removeEventListener: vi.fn() })
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() })
  vi.stubGlobal('sessionStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function iniciar(progresso: { answeredCount: number; currentQuestion: number }) {
  const { createExamAttemptTracker } = await import('@/lib/tracking/track-client')
  const tracker = createExamAttemptTracker('prova-1', 'Prova')
  return tracker.startHeartbeat(() => ({ ...progresso, totalQuestions: 40 }))
}

const heartbeats = () => enviados.filter((e) => e.event === 'heartbeat')

describe('heartbeat da prova', () => {
  it('parado na mesma questão, manda um sinal a cada 90 s — e não a cada 30 s', async () => {
    const parar = await iniciar({ answeredCount: 3, currentQuestion: 4 })
    vi.advanceTimersByTime(60_000)
    expect(heartbeats()).toHaveLength(0)
    vi.advanceTimersByTime(30_000)
    expect(heartbeats()).toHaveLength(1)
    vi.advanceTimersByTime(90_000)
    expect(heartbeats()).toHaveLength(2)
    parar()
  })

  it('respondeu uma questão: o sinal sai na conferência seguinte', async () => {
    const progresso = { answeredCount: 3, currentQuestion: 4 }
    const parar = await iniciar(progresso)
    progresso.answeredCount = 4
    vi.advanceTimersByTime(30_000)
    expect(heartbeats()).toHaveLength(1)
    expect(heartbeats()[0].answeredCount).toBe(4)
    parar()
  })

  it('o maior intervalo entre dois sinais fica dentro da janela "ao vivo" de 3 min', async () => {
    const { LIVE_THRESHOLD_MS, HEARTBEAT_INTERVAL_MS, HEARTBEAT_MAX_SILENCE_MS } = await import(
      '@/lib/tracking/shared'
    )
    expect(HEARTBEAT_MAX_SILENCE_MS + HEARTBEAT_INTERVAL_MS).toBeLessThan(LIVE_THRESHOLD_MS)
  })
})
