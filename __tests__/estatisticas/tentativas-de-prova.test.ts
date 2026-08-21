import { describe, expect, it, vi } from 'vitest'
import {
  ABANDON_THRESHOLD_MS,
  LIVE_THRESHOLD_MS,
  applyAttemptPing,
  attemptElapsedMs,
  attemptProgressPct,
  deriveAttemptStatus,
  type ExamAttempt,
} from '@/lib/tracking/exam-attempts'

const NOW = new Date('2026-06-01T12:00:00.000Z').getTime()

function attempt(overrides: Partial<ExamAttempt> = {}): ExamAttempt {
  return {
    attemptId: 'att-1',
    examId: 'e1',
    examTitle: 'Prova',
    userId: 'u1',
    userName: 'Aluno',
    userEmail: 'aluno@example.com',
    accountType: 'gratuito',
    status: 'in_progress',
    openedAt: new Date(NOW - 30 * 60_000),
    startedAt: new Date(NOW - 25 * 60_000),
    lastSeenAt: new Date(NOW),
    awayCount: 0,
    answeredCount: 10,
    totalQuestions: 40,
    furthestQuestion: 11,
    currentQuestion: 11,
    activeMs: 0,
    device: 'computador',
    updatedAt: new Date(NOW),
    ...overrides,
  }
}

describe('deriveAttemptStatus', () => {
  it('entregue vence qualquer janela de tempo', () => {
    const velha = attempt({ status: 'submitted', lastSeenAt: new Date(NOW - 10 * 86_400_000) })
    expect(deriveAttemptStatus(velha, NOW)).toBe('submitted')
  })

  it('quem começou e ainda dá sinal está fazendo agora', () => {
    expect(deriveAttemptStatus(attempt(), NOW)).toBe('in_progress')
  })

  it('quem começou e está calado há poucos minutos aparece como parado', () => {
    const parado = attempt({ lastSeenAt: new Date(NOW - LIVE_THRESHOLD_MS - 60_000) })
    expect(deriveAttemptStatus(parado, NOW)).toBe('idle')
  })

  it('quem começou e sumiu além do limite conta como abandono', () => {
    const sumido = attempt({ lastSeenAt: new Date(NOW - ABANDON_THRESHOLD_MS - 60_000) })
    expect(deriveAttemptStatus(sumido, NOW)).toBe('abandoned')
  })

  it('quem nunca começou nunca é abandono — só abriu', () => {
    const soAbriu = attempt({
      status: 'opened',
      startedAt: null,
      lastSeenAt: new Date(NOW - 5 * 86_400_000),
    })
    expect(deriveAttemptStatus(soAbriu, NOW)).toBe('opened')
  })
})

describe('attemptProgressPct', () => {
  it('calcula o percentual respondido', () => {
    expect(attemptProgressPct({ answeredCount: 10, totalQuestions: 40 })).toBe(25)
  })

  it('devolve zero quando a prova não tem total conhecido', () => {
    expect(attemptProgressPct({ answeredCount: 10, totalQuestions: 0 })).toBe(0)
  })

  it('não passa de 100 quando o cliente manda mais respostas que questões', () => {
    expect(attemptProgressPct({ answeredCount: 50, totalQuestions: 40 })).toBe(100)
  })
})

describe('attemptElapsedMs', () => {
  it('mede do início ao envio quando a prova foi entregue', () => {
    const entregue = attempt({
      startedAt: new Date(NOW - 60 * 60_000),
      submittedAt: new Date(NOW - 10 * 60_000),
    })
    expect(attemptElapsedMs(entregue)).toBe(50 * 60_000)
  })

  it('usa a abertura quando o aluno nunca chegou a começar', () => {
    const soAbriu = attempt({
      openedAt: new Date(NOW - 20 * 60_000),
      startedAt: null,
      submittedAt: null,
      lastSeenAt: new Date(NOW - 18 * 60_000),
    })
    expect(attemptElapsedMs(soAbriu)).toBe(2 * 60_000)
  })
})

/** Captura o update que o helper monta, sem falar com o Mongo de verdade. */
function fakeDb() {
  const updateOne = vi.fn().mockResolvedValue({ acknowledged: true })
  const db = { collection: () => ({ updateOne }) } as any
  return { db, updateOne }
}

const sessao = { userId: 'u1', name: 'Aluno', email: 'aluno@example.com', accountType: 'plus' }

describe('applyAttemptPing', () => {
  it('não repete um campo em dois operadores no evento de saída', async () => {
    const { db, updateOne } = fakeDb()
    await applyAttemptPing(
      db,
      { attemptId: 'att-1', examId: 'e1', event: 'leave', answeredCount: 12, currentQuestion: 13 },
      sessao
    )

    const [, update] = updateOne.mock.calls[0]
    const campos = ['$set', '$setOnInsert', '$max', '$inc'].flatMap(op =>
      Object.keys(update[op] || {})
    )
    expect(new Set(campos).size).toBe(campos.length)
    expect(update.$inc).toEqual({ awayCount: 1 })
  })

  it('marca o início sem deixar o status antigo no $setOnInsert', async () => {
    const { db, updateOne } = fakeDb()
    await applyAttemptPing(
      db,
      { attemptId: 'att-1', examId: 'e1', event: 'start', totalQuestions: 40 },
      sessao
    )

    const [filtro, update, opcoes] = updateOne.mock.calls[0]
    expect(filtro).toEqual({ attemptId: 'att-1' })
    expect(opcoes).toEqual({ upsert: true })
    expect(update.$set.status).toBe('in_progress')
    expect(update.$set.startedAt).toBeInstanceOf(Date)
    expect(update.$setOnInsert.status).toBeUndefined()
  })

  it('usa $max no progresso para que um ping atrasado não faça o aluno voltar', async () => {
    const { db, updateOne } = fakeDb()
    await applyAttemptPing(
      db,
      { attemptId: 'att-1', examId: 'e1', event: 'heartbeat', answeredCount: 7, currentQuestion: 9 },
      sessao
    )

    const [, update] = updateOne.mock.calls[0]
    expect(update.$max).toEqual({ answeredCount: 7, furthestQuestion: 9 })
    expect(update.$set.answeredCount).toBeUndefined()
    expect(update.$set.currentQuestion).toBe(9)
  })

  it('fecha a tentativa no envio, guardando submissão e nota', async () => {
    const { db, updateOne } = fakeDb()
    await applyAttemptPing(
      db,
      { attemptId: 'att-1', examId: 'e1', event: 'submit', submissionId: 's1', score: 84.5 },
      sessao
    )

    const [, update] = updateOne.mock.calls[0]
    expect(update.$set.status).toBe('submitted')
    expect(update.$set.submissionId).toBe('s1')
    expect(update.$set.score).toBe(84.5)
  })
})
