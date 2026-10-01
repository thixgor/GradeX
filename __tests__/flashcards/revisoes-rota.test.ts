import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'

/**
 * POST /api/flashcards/manual/[id]/reviews grava o lote de avaliações da fila do
 * cliente. As idas ao banco foram enxugadas (índices uma vez por instância,
 * gravações num `bulkWrite`, sem reler o que acabou de ser escrito); o que este
 * teste fixa é que o resultado continua o mesmo de gravar card a card:
 *   - duas avaliações do mesmo card no lote encadeiam (a segunda parte da
 *     primeira);
 *   - reenvio da mesma avaliação não agenda o card de novo;
 *   - a resposta traz o progresso que ficou gravado.
 */

const banco = vi.hoisted(() => ({
  colecoes: new Map<string, any[]>(),
  idas: 0,
  indices: 0,
}))

function colecao(nome: string) {
  if (!banco.colecoes.has(nome)) banco.colecoes.set(nome, [])
  const docs = banco.colecoes.get(nome)!
  const casa = (doc: any, filtro: any) =>
    Object.entries(filtro).every(([chave, valor]: [string, any]) => {
      if (valor && typeof valor === 'object' && '$in' in valor) {
        return valor.$in.map(String).includes(String(doc[chave]))
      }
      return String(doc[chave]) === String(valor)
    })
  return {
    findOne: async (filtro: any) => {
      banco.idas += 1
      return docs.find((d) => casa(d, filtro)) ?? null
    },
    find: (filtro: any) => ({
      project: () => ({ toArray: async () => (banco.idas++, docs.filter((d) => casa(d, filtro))) }),
      toArray: async () => (banco.idas++, docs.filter((d) => casa(d, filtro)).map((d) => ({ ...d }))),
    }),
    createIndex: async () => {
      banco.indices += 1
      return 'ok'
    },
    insertOne: async (doc: any) => {
      banco.idas += 1
      docs.push({ _id: new ObjectId(), ...doc })
      return { insertedId: 'x' }
    },
    bulkWrite: async (ops: any[]) => {
      banco.idas += 1
      for (const { updateOne } of ops) {
        const alvo = docs.find((d) => casa(d, updateOne.filter))
        if (alvo) Object.assign(alvo, updateOne.update.$set)
        else docs.push({ _id: new ObjectId(), ...updateOne.filter, ...updateOne.update.$setOnInsert, ...updateOne.update.$set })
      }
      return { ok: 1 }
    },
  }
}

vi.mock('@/lib/auth', () => ({
  getSession: async () => ({ userId: '64b7f1c2a9d4e5f600000001', email: 'ana@exemplo.com', role: 'user' }),
}))
vi.mock('@/lib/mongodb', () => ({ getDb: async () => ({ collection: colecao }) }))
vi.mock('@/lib/flashcard-manual', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/flashcard-manual')>()),
  resolveDeckAccess: async () => ({ hasAccess: true }),
}))

const { POST } = await import('@/app/api/flashcards/manual/[id]/reviews/route')
const { FLASHCARD_MANUAL_COLLECTIONS } = await import('@/lib/flashcard-manual')
const { FLASHCARD_SPACED_PROGRESS_COLLECTION } = await import('@/lib/flashcard-spaced-repetition')

const DECK = new ObjectId()
const CARD_A = new ObjectId()
const CARD_B = new ObjectId()

function enviar(reviews: any[]) {
  return POST(
    new NextRequest('http://localhost/api/flashcards/manual/deck/reviews', {
      method: 'POST',
      body: JSON.stringify({ reviews }),
    }),
    { params: { id: String(DECK) } }
  )
}

beforeEach(() => {
  banco.colecoes.clear()
  banco.idas = 0
  banco.colecoes.set(FLASHCARD_MANUAL_COLLECTIONS.decks, [{ _id: DECK, slug: 'deck' }])
  banco.colecoes.set(FLASHCARD_MANUAL_COLLECTIONS.cards, [
    { _id: CARD_A, deckId: String(DECK) },
    { _id: CARD_B, deckId: String(DECK) },
  ])
  banco.colecoes.set('users', [{ _id: new ObjectId('64b7f1c2a9d4e5f600000001'), email: 'ana@exemplo.com' }])
})

describe('POST reviews', () => {
  it('grava o lote, encadeia avaliações do mesmo card e devolve o que ficou gravado', async () => {
    const t0 = new Date(Date.now() - 60_000).toISOString()
    const t1 = new Date(Date.now() - 30_000).toISOString()
    const resposta = await enviar([
      { cardId: String(CARD_A), rating: 'FACIL', reviewedAt: t0 },
      { cardId: String(CARD_B), rating: 'DIFICIL', reviewedAt: t0 },
      { cardId: String(CARD_A), rating: 'FACIL', reviewedAt: t1 },
    ])
    expect(resposta.status).toBe(200)
    const json = await resposta.json()
    expect(json.applied).toBe(3)

    const gravados = banco.colecoes.get(FLASHCARD_SPACED_PROGRESS_COLLECTION)!
    expect(gravados).toHaveLength(2)
    const a = gravados.find((d) => d.cardId === String(CARD_A))
    // Duas revisões: a segunda partiu da primeira.
    expect(a.reviewCount).toBe(2)
    expect(new Date(a.lastReviewedAt).toISOString()).toBe(t1)

    // A resposta é o que está no banco.
    const devolvidoA = json.progresses.find((p: any) => p.cardId === String(CARD_A))
    expect(devolvidoA.reviewCount).toBe(2)
    expect(devolvidoA.nextReviewAt).toBe(new Date(a.nextReviewAt).toISOString())
    expect(devolvidoA.createdAt).not.toBeNull()
    expect(json.progress.cardId).toBe(String(CARD_A))

    // Uma sessão por lote.
    expect(banco.colecoes.get(FLASHCARD_MANUAL_COLLECTIONS.sessions)).toHaveLength(1)
  })

  it('reenvio da mesma avaliação não agenda o card de novo', async () => {
    const t0 = new Date(Date.now() - 60_000).toISOString()
    await enviar([{ cardId: String(CARD_A), rating: 'MEDIO', reviewedAt: t0 }])
    const segunda = await (await enviar([{ cardId: String(CARD_A), rating: 'MEDIO', reviewedAt: t0 }])).json()
    expect(segunda.applied).toBe(0)
    expect(segunda.duplicates).toBe(1)
    const a = banco.colecoes.get(FLASHCARD_SPACED_PROGRESS_COLLECTION)!.find((d) => d.cardId === String(CARD_A))
    expect(a.reviewCount).toBe(1)
  })

  it('índices são garantidos uma vez por instância, não a cada envio', async () => {
    const antes = banco.indices
    await enviar([{ cardId: String(CARD_A), rating: 'MEDIO' }])
    await enviar([{ cardId: String(CARD_B), rating: 'MEDIO' }])
    expect(banco.indices - antes).toBeLessThanOrEqual(3)
  })
})
