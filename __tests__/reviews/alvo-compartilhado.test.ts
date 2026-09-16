import { describe, it, expect } from 'vitest'
import { ObjectId } from 'mongodb'

import {
  computeReviewSummary,
  findUserReview,
  getTargetReviewsLocked,
  resolveReviewTargetGroup,
  reviewTargetFilter,
} from '@/lib/reviews'

/**
 * Um deck pago mora em duas páginas: `/flashcards/d/<slug>` e o espelho
 * `/materiais/<linkedMaterialId>` que `syncMaterialForFlashcardDeck` cria para
 * vendê-lo. Quem compra, estuda e opina não faz ideia de que são duas — e ver
 * a nota de cinco estrelas numa página e "ainda não há avaliações" na outra é
 * o mesmo que não ter avaliação nenhuma.
 *
 * Estes testes prendem a regra que junta as duas: leitura soma os dois alvos,
 * escrita vai para um só, e travar qualquer uma das páginas trava o produto.
 */

const MATERIAL_ID = '65a1b2c3d4e5f60718293a4b'
const DECK_ID = '65a1b2c3d4e5f60718293a4c'
const MATERIAL_SOLTO = '65a1b2c3d4e5f60718293a4d'
const DECK_SOLTO = '65a1b2c3d4e5f60718293a4e'

function combina(doc: any, filtro: any): boolean {
  return Object.entries(filtro).every(([chave, condicao]) => {
    if (chave === '$or') return (condicao as any[]).some(c => combina(doc, c))
    if (chave === '$and') return (condicao as any[]).every(c => combina(doc, c))

    const valor = doc[chave]
    if (
      condicao &&
      typeof condicao === 'object' &&
      !Array.isArray(condicao) &&
      !(condicao instanceof ObjectId)
    ) {
      if ('$ne' in (condicao as any)) {
        return String(valor ?? '') !== String((condicao as any).$ne ?? '')
      }
      if ('$in' in (condicao as any)) {
        return (condicao as any).$in.some((v: any) => String(v) === String(valor))
      }
    }
    return String(valor ?? '') === String(condicao ?? '')
  })
}

/** Só o suficiente do driver para o resolvedor: findOne e um aggregate de $match + $group. */
function bancoDeMentira(colecoes: Record<string, any[]>) {
  return {
    collection(nome: string) {
      const docs = colecoes[nome] || []
      return {
        findOne: async (filtro: any) => docs.find(doc => combina(doc, filtro)) || null,
        aggregate: (pipeline: any[]) => {
          const match = pipeline.find(estagio => '$match' in estagio)?.$match || {}
          const porNota = new Map<number, number>()
          for (const doc of docs.filter(d => combina(d, match))) {
            porNota.set(doc.rating, (porNota.get(doc.rating) || 0) + 1)
          }
          const linhas = [...porNota].map(([_id, count]) => ({ _id, count }))
          return {
            async *[Symbol.asyncIterator]() {
              for (const linha of linhas) yield linha
            },
          }
        },
      }
    },
  } as any
}

function catalogo(extras: { materialTravado?: boolean; deckTravado?: boolean } = {}) {
  return {
    materials: [
      {
        _id: new ObjectId(MATERIAL_ID),
        title: 'Deck de Farmacologia (espelho)',
        linkedDeckId: DECK_ID,
        reviewsLocked: extras.materialTravado === true,
      },
      { _id: new ObjectId(MATERIAL_SOLTO), title: 'Apostila de Anatomia' },
    ],
    flashcardManualDecks: [
      {
        _id: new ObjectId(DECK_ID),
        title: 'Deck de Farmacologia',
        linkedMaterialId: MATERIAL_ID,
        reviewsLocked: extras.deckTravado === true,
      },
      { _id: new ObjectId(DECK_SOLTO), title: 'Deck pessoal' },
    ],
    reviews: [] as any[],
  }
}

describe('grupo de alvos de avaliação', () => {
  it('junta o deck e o material espelho, com o material como canônico', async () => {
    const db = bancoDeMentira(catalogo())

    const peloDeck = await resolveReviewTargetGroup(db, 'flashcard_deck', DECK_ID)
    const peloMaterial = await resolveReviewTargetGroup(db, 'material', MATERIAL_ID)

    // A página do deck e a do material chegam ao mesmo conjunto.
    expect(peloDeck.members).toEqual(peloMaterial.members)
    expect(peloDeck.members).toEqual([
      { targetType: 'material', targetId: MATERIAL_ID },
      { targetType: 'flashcard_deck', targetId: DECK_ID },
    ])
    // Escrita num balde só: o material, que é a unidade de venda.
    expect(peloDeck.canonical).toEqual({ targetType: 'material', targetId: MATERIAL_ID })
    expect(peloMaterial.canonical).toEqual(peloDeck.canonical)
  })

  it('mantém o título da página que perguntou', async () => {
    const db = bancoDeMentira(catalogo())

    expect((await resolveReviewTargetGroup(db, 'flashcard_deck', DECK_ID)).title)
      .toBe('Deck de Farmacologia')
    expect((await resolveReviewTargetGroup(db, 'material', MATERIAL_ID)).title)
      .toBe('Deck de Farmacologia (espelho)')
  })

  it('acha o deck mesmo quando o material antigo não guarda linkedDeckId', async () => {
    const dados = catalogo()
    delete (dados.materials[0] as any).linkedDeckId

    const grupo = await resolveReviewTargetGroup(bancoDeMentira(dados), 'material', MATERIAL_ID)

    expect(grupo.members).toHaveLength(2)
    expect(grupo.members[1]).toEqual({ targetType: 'flashcard_deck', targetId: DECK_ID })
  })

  it('deixa sozinho quem não tem espelho', async () => {
    const db = bancoDeMentira(catalogo())

    const material = await resolveReviewTargetGroup(db, 'material', MATERIAL_SOLTO)
    expect(material.members).toEqual([{ targetType: 'material', targetId: MATERIAL_SOLTO }])
    expect(material.canonical.targetType).toBe('material')

    const deck = await resolveReviewTargetGroup(db, 'flashcard_deck', DECK_SOLTO)
    expect(deck.members).toEqual([{ targetType: 'flashcard_deck', targetId: DECK_SOLTO }])
    // Sem material para herdar, o próprio deck é o canônico.
    expect(deck.canonical).toEqual({ targetType: 'flashcard_deck', targetId: DECK_SOLTO })
  })

  it('não inventa grupo para alvo inexistente ou id inválido', async () => {
    const db = bancoDeMentira(catalogo())

    expect((await resolveReviewTargetGroup(db, 'material', '65a1b2c3d4e5f60718293aff')).exists).toBe(false)
    expect((await resolveReviewTargetGroup(db, 'flashcard_deck', 'nao-e-objectid')).exists).toBe(false)
  })

  it('travar uma das páginas trava a outra', async () => {
    const soDeck = bancoDeMentira(catalogo({ deckTravado: true }))
    expect((await resolveReviewTargetGroup(soDeck, 'material', MATERIAL_ID)).locked).toBe(true)
    expect((await getTargetReviewsLocked(soDeck, 'material', MATERIAL_ID)).locked).toBe(true)

    const soMaterial = bancoDeMentira(catalogo({ materialTravado: true }))
    expect((await resolveReviewTargetGroup(soMaterial, 'flashcard_deck', DECK_ID)).locked).toBe(true)
    expect((await getTargetReviewsLocked(soMaterial, 'flashcard_deck', DECK_ID)).locked).toBe(true)

    const nenhum = bancoDeMentira(catalogo())
    expect((await resolveReviewTargetGroup(nenhum, 'flashcard_deck', DECK_ID)).locked).toBe(false)
  })
})

describe('leitura somando os dois alvos', () => {
  const grupo = [
    { targetType: 'material' as const, targetId: MATERIAL_ID },
    { targetType: 'flashcard_deck' as const, targetId: DECK_ID },
  ]

  it('filtra direto com um alvo e por $or com dois', () => {
    expect(reviewTargetFilter([grupo[0]])).toEqual({
      targetType: 'material',
      targetId: MATERIAL_ID,
    })
    expect(reviewTargetFilter(grupo)).toEqual({
      $or: [
        { targetType: 'material', targetId: MATERIAL_ID },
        { targetType: 'flashcard_deck', targetId: DECK_ID },
      ],
    })
  })

  it('soma média e distribuição dos dois baldes', async () => {
    const dados = catalogo()
    dados.reviews = [
      { targetType: 'material', targetId: MATERIAL_ID, rating: 5 },
      { targetType: 'flashcard_deck', targetId: DECK_ID, rating: 5 },
      { targetType: 'flashcard_deck', targetId: DECK_ID, rating: 3 },
      // Ruído: outro produto não pode entrar na conta.
      { targetType: 'material', targetId: MATERIAL_SOLTO, rating: 1 },
    ]
    const db = bancoDeMentira(dados)

    const resumo = await computeReviewSummary(db, grupo)
    expect(resumo.count).toBe(3)
    expect(resumo.avg).toBe(4.3)
    expect(resumo.distribution[5]).toBe(2)
    expect(resumo.distribution[3]).toBe(1)
    expect(resumo.distribution[1]).toBe(0)
  })

  it('reconhece a avaliação que a pessoa deixou pela outra página', async () => {
    const dados = catalogo()
    dados.reviews = [
      {
        _id: new ObjectId(),
        targetType: 'flashcard_deck',
        targetId: DECK_ID,
        rating: 4,
        userId: 'user-1',
        isAdminCreated: false,
      },
    ]
    const db = bancoDeMentira(dados)

    // Quem abre o espelho em /materiais precisa ver a própria nota (e não
    // ganhar o botão de avaliar de novo).
    expect(await findUserReview(db, grupo, 'user-1')).not.toBeNull()
    expect(await findUserReview(db, grupo, 'user-2')).toBeNull()
  })

  it('ignora avaliação plantada por admin ao procurar a da pessoa', async () => {
    const dados = catalogo()
    dados.reviews = [
      {
        _id: new ObjectId(),
        targetType: 'material',
        targetId: MATERIAL_ID,
        rating: 5,
        userId: 'user-1',
        isAdminCreated: true,
      },
    ]

    expect(await findUserReview(bancoDeMentira(dados), grupo, 'user-1')).toBeNull()
  })
})
