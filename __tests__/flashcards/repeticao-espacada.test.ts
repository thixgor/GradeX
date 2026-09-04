import { describe, it, expect } from 'vitest'
import {
  buildSpacedQueue,
  calculateNextSpacedReview,
  calculateSpacedStats,
  formatIntervalLabel,
  normalizeSpacedRating,
  RETENTION_PRESETS,
  toLegacyRating,
} from '@/lib/flashcard-spaced-repetition'
import type { FlashcardSpacedProgress } from '@/lib/types'

/**
 * O agendamento dos flashcards deixou de ser "intervalo × fator de facilidade"
 * (SM-2) e passou a ser o FSRS: dois números por card — estabilidade e
 * dificuldade — e um intervalo que sai da curva de esquecimento.
 *
 * O que estes testes protegem é justamente o que o usuário percebe: card
 * errado volta em minutos, card fácil some por semanas, e o mesmo cálculo
 * feito no navegador e no servidor chega ao MESMO dia — sem isso, a data que
 * aparece na tela ao avaliar não seria a data gravada no banco.
 */

const T0 = new Date('2026-03-01T10:00:00.000Z')

function progressFrom(result: ReturnType<typeof calculateNextSpacedReview>): Partial<FlashcardSpacedProgress> {
  return {
    reviewCount: result.reviewCount,
    correctStreak: result.correctStreak,
    easeFactor: result.easeFactor,
    intervalDays: result.intervalDays,
    stability: result.stability,
    difficulty: result.difficulty,
    state: result.state,
    learningStep: result.learningStep,
    lapses: result.lapses,
    nextReviewAt: result.nextReviewAt,
    lastReviewedAt: result.lastReviewedAt,
  }
}

describe('primeiro contato com o card', () => {
  it('"Difícil" traz o card de volta em minutos, ainda na mesma sessão', () => {
    const result = calculateNextSpacedReview(null, 'DIFICIL', T0, { seed: 'c1' })
    expect(result.intervalDays).toBe(0)
    expect(result.returnsThisSession).toBe(true)
    expect(result.scheduledMinutes).toBeLessThanOrEqual(10)
    expect(result.state).toBe('learning')
  })

  it('"Médio" cumpre um passo curto antes de graduar', () => {
    const first = calculateNextSpacedReview(null, 'MEDIO', T0, { seed: 'c1' })
    expect(first.returnsThisSession).toBe(true)
    expect(first.learningStep).toBe(1)

    const graduated = calculateNextSpacedReview(
      progressFrom(first),
      'MEDIO',
      new Date(T0.getTime() + 10 * 60 * 1000),
      { seed: 'c1' }
    )
    expect(graduated.state).toBe('review')
    expect(graduated.intervalDays).toBeGreaterThanOrEqual(1)
  })

  it('"Fácil" gradua na hora e joga o card para longe', () => {
    const result = calculateNextSpacedReview(null, 'FACIL', T0, { seed: 'c1' })
    expect(result.state).toBe('review')
    expect(result.intervalDays).toBeGreaterThan(3)
  })
})

describe('card já graduado', () => {
  const graduated = calculateNextSpacedReview(null, 'FACIL', T0, { seed: 'c1' })
  const dueDate = new Date(graduated.nextReviewAt)

  it('errar derruba o card para reaprendizado, sem premiar a estabilidade', () => {
    const lapse = calculateNextSpacedReview(progressFrom(graduated), 'DIFICIL', dueDate, { seed: 'c1' })
    expect(lapse.state).toBe('relearning')
    expect(lapse.intervalDays).toBe(0)
    expect(lapse.lapses).toBe(1)
    expect(lapse.correctStreak).toBe(0)
    expect(lapse.stability).toBeLessThanOrEqual(graduated.stability)
  })

  it('depois de errar, o primeiro acerto já gradua de novo', () => {
    const lapse = calculateNextSpacedReview(progressFrom(graduated), 'DIFICIL', dueDate, { seed: 'c1' })
    const back = calculateNextSpacedReview(
      progressFrom(lapse),
      'MEDIO',
      new Date(dueDate.getTime() + 10 * 60 * 1000),
      { seed: 'c1' }
    )
    expect(back.state).toBe('review')
    expect(back.intervalDays).toBeGreaterThanOrEqual(1)
  })

  it('"Fácil" sempre rende um intervalo maior que "Médio" no mesmo card', () => {
    const easy = calculateNextSpacedReview(progressFrom(graduated), 'FACIL', dueDate, { seed: 'c1' })
    const good = calculateNextSpacedReview(progressFrom(graduated), 'MEDIO', dueDate, { seed: 'c1' })
    expect(easy.intervalDays).toBeGreaterThan(good.intervalDays)
  })

  it('acertos seguidos esticam o intervalo a cada revisão', () => {
    let current = graduated
    let previousInterval = current.intervalDays
    // Três voltas: na quarta o intervalo já bate no teto de um ano, que é o
    // que o teste seguinte cobre.
    for (let i = 0; i < 3; i += 1) {
      current = calculateNextSpacedReview(
        progressFrom(current),
        'MEDIO',
        new Date(current.nextReviewAt),
        { seed: 'c1' }
      )
      expect(current.intervalDays).toBeGreaterThan(previousInterval)
      previousInterval = current.intervalDays
    }
  })

  it('respeita o teto de um ano por mais que o card fique fácil', () => {
    let current = graduated
    for (let i = 0; i < 30; i += 1) {
      current = calculateNextSpacedReview(
        progressFrom(current),
        'FACIL',
        new Date(current.nextReviewAt),
        { seed: 'c1' }
      )
    }
    expect(current.intervalDays).toBeLessThanOrEqual(365)
  })
})

describe('meta de retenção', () => {
  it('apertar a meta encurta o intervalo do mesmo card', () => {
    const base = calculateNextSpacedReview(null, 'FACIL', T0, { seed: 'c1' })
    const leve = calculateNextSpacedReview(progressFrom(base), 'MEDIO', new Date(base.nextReviewAt), {
      seed: 'c1',
      retention: RETENTION_PRESETS.leve,
    })
    const prova = calculateNextSpacedReview(progressFrom(base), 'MEDIO', new Date(base.nextReviewAt), {
      seed: 'c1',
      retention: RETENTION_PRESETS.prova,
    })
    expect(prova.intervalDays).toBeLessThan(leve.intervalDays)
  })
})

describe('o cálculo do navegador e o do servidor precisam coincidir', () => {
  it('mesma entrada e mesma semente produzem exatamente o mesmo dia', () => {
    const a = calculateNextSpacedReview(null, 'FACIL', T0, { seed: 'card-abc' })
    const b = calculateNextSpacedReview(null, 'FACIL', T0, { seed: 'card-abc' })
    expect(a.intervalDays).toBe(b.intervalDays)
    expect(a.nextReviewAt.getTime()).toBe(b.nextReviewAt.getTime())
  })

  it('cards diferentes não caem todos no mesmo dia', () => {
    const dias = new Set(
      Array.from({ length: 12 }, (_, i) =>
        calculateNextSpacedReview(null, 'FACIL', T0, { seed: `card-${i}` }).intervalDays
      )
    )
    expect(dias.size).toBeGreaterThan(1)
  })
})

describe('compatibilidade com o que já está gravado', () => {
  it('lê os nomes antigos das avaliações', () => {
    expect(normalizeSpacedRating('SUAVE')).toBe('FACIL')
    expect(normalizeSpacedRating('NO_PONTO')).toBe('MEDIO')
    expect(normalizeSpacedRating('PORRETE')).toBe('DIFICIL')
    expect(normalizeSpacedRating('porrada')).toBe('DIFICIL')
    expect(normalizeSpacedRating('qualquer coisa')).toBeNull()
    expect(toLegacyRating('MEDIO')).toBe('equilibrado')
  })

  it('agenda a partir de um progresso do modelo antigo (só ease + intervalo)', () => {
    const legado: Partial<FlashcardSpacedProgress> = {
      reviewCount: 4,
      correctStreak: 3,
      easeFactor: 2.5,
      intervalDays: 7,
      lastReviewedAt: new Date(T0.getTime() - 7 * 24 * 60 * 60 * 1000),
      nextReviewAt: T0,
    }
    const result = calculateNextSpacedReview(legado, 'MEDIO', T0, { seed: 'c1' })
    expect(result.state).toBe('review')
    expect(result.intervalDays).toBeGreaterThan(7)
    expect(result.stability).toBeGreaterThan(0)
    expect(result.difficulty).toBeGreaterThanOrEqual(1)
    expect(result.difficulty).toBeLessThanOrEqual(10)
  })
})

describe('fila da sessão', () => {
  const now = new Date('2026-03-10T12:00:00.000Z')

  function card(id: string, index: number) {
    return { _id: id, deckId: 'd1', index, kind: 'standard', front: { text: id }, back: { text: '' } } as any
  }

  function progress(cardId: string, opts: { dueInDays: number; stability?: number; state?: any }): FlashcardSpacedProgress {
    return {
      userId: 'u1',
      cardId,
      deckId: 'd1',
      rating: 'MEDIO',
      reviewCount: 3,
      correctStreak: 2,
      easeFactor: 2.5,
      intervalDays: opts.stability ?? 10,
      stability: opts.stability ?? 10,
      difficulty: 5,
      state: opts.state || 'review',
      lapses: 0,
      nextReviewAt: new Date(now.getTime() + opts.dueInDays * 24 * 60 * 60 * 1000),
      lastReviewedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    } as FlashcardSpacedProgress
  }

  const cards = [card('a', 0), card('b', 1), card('c', 2), card('d', 3), card('e', 4)]
  const progressos = new Map<string, FlashcardSpacedProgress>([
    ['a', progress('a', { dueInDays: -1, stability: 60 })],   // vencido há 1 dia, memória longa
    ['b', progress('b', { dueInDays: -1, stability: 2 })],    // vencido há 1 dia, memória curta
    ['c', progress('c', { dueInDays: 5 })],                   // ainda não venceu
    ['d', progress('d', { dueInDays: -0.01, state: 'relearning', stability: 1 })],
  ])

  it('quem está reaprendendo vem antes de tudo, e o mais em risco vem primeiro', () => {
    const fila = buildSpacedQueue(cards, progressos, { now, includeFuture: false })
    expect(fila.cards[0]._id).toBe('d')
    // "b" tem memória curta e o mesmo atraso de "a": está muito mais perto de
    // ser esquecido, então é cobrado antes.
    const ids = fila.cards.map(c => c._id)
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('a'))
  })

  it('sem estudo adiantado, o que não venceu fica de fora da sessão', () => {
    const fila = buildSpacedQueue(cards, progressos, { now, includeFuture: false })
    expect(fila.cards.map(c => c._id)).not.toContain('c')
    expect(fila.counts.future).toBe(1)
  })

  it('o estudo adiantado traz o resto, sempre no fim da fila', () => {
    const fila = buildSpacedQueue(cards, progressos, { now, includeFuture: true })
    const ids = fila.cards.map(c => c._id)
    expect(ids).toContain('c')
    expect(ids.indexOf('c')).toBeGreaterThan(ids.indexOf('a'))
  })

  it('respeita o teto de cards inéditos por sessão', () => {
    const muitos = Array.from({ length: 30 }, (_, i) => card(`novo-${i}`, i))
    const fila = buildSpacedQueue(muitos, new Map(), { now, newCardLimit: 20, includeFuture: false })
    expect(fila.counts.newCards).toBe(20)
    expect(fila.counts.heldBack).toBe(10)
  })

  it('intercala os inéditos entre as revisões em vez de empilhá-los no fim', () => {
    const revisoes = Array.from({ length: 8 }, (_, i) => card(`rev-${i}`, i))
    const novos = Array.from({ length: 4 }, (_, i) => card(`novo-${i}`, 100 + i))
    const mapa = new Map(revisoes.map(c => [String(c._id), progress(String(c._id), { dueInDays: -1 })]))
    const fila = buildSpacedQueue([...revisoes, ...novos], mapa, { now, includeFuture: false })
    const posicoes = fila.cards
      .map((c, i) => (String(c._id).startsWith('novo') ? i : -1))
      .filter(i => i >= 0)
    expect(posicoes).toHaveLength(4)
    // O primeiro inédito aparece bem antes do fim da sessão.
    expect(posicoes[0]).toBeLessThan(fila.cards.length - 4)
  })
})

describe('estatísticas do painel', () => {
  const now = new Date('2026-03-10T12:00:00.000Z')
  it('separa vencidos, novos, dominados e difíceis', () => {
    const cards = [{ _id: 'a', index: 0 }, { _id: 'b', index: 1 }, { _id: 'c', index: 2 }] as any[]
    const mapa = new Map<string, FlashcardSpacedProgress>([
      ['a', {
        userId: 'u', cardId: 'a', deckId: 'd', rating: 'FACIL', reviewCount: 5, correctStreak: 5,
        easeFactor: 2.7, intervalDays: 40, stability: 40, difficulty: 3, state: 'review', lapses: 0,
        nextReviewAt: new Date(now.getTime() + 86400000), lastReviewedAt: now, createdAt: now, updatedAt: now,
      } as FlashcardSpacedProgress],
      ['b', {
        userId: 'u', cardId: 'b', deckId: 'd', rating: 'DIFICIL', reviewCount: 9, correctStreak: 0,
        easeFactor: 1.4, intervalDays: 0, stability: 0.5, difficulty: 9, state: 'relearning', lapses: 4,
        nextReviewAt: new Date(now.getTime() - 60000), lastReviewedAt: now, createdAt: now, updatedAt: now,
      } as FlashcardSpacedProgress],
    ])
    const stats = calculateSpacedStats(cards, mapa, now)
    expect(stats.newCards).toBe(1)
    expect(stats.dueToday).toBe(1)
    expect(stats.mastered).toBe(1)
    expect(stats.difficult).toBe(1)
    expect(stats.total).toBe(3)
  })
})

describe('rótulos de intervalo', () => {
  it('fala em minutos, dias, meses e anos conforme o tamanho', () => {
    expect(formatIntervalLabel({ intervalDays: 0, scheduledMinutes: 10 })).toBe('em 10 min')
    expect(formatIntervalLabel({ intervalDays: 1, scheduledMinutes: 0 })).toBe('amanhã')
    expect(formatIntervalLabel({ intervalDays: 12, scheduledMinutes: 0 })).toBe('em 12 dias')
    expect(formatIntervalLabel({ intervalDays: 90, scheduledMinutes: 0 })).toBe('em 3 meses')
  })
})
