import { describe, it, expect } from 'vitest'
import {
  isDeckPublished,
  isDeckHidden,
  getDeckListingStatus,
  PUBLIC_DECK_LISTING_FILTER,
  resolveDeckAccess,
} from '@/lib/flashcard-manual'
import type { FlashcardManualDeck } from '@/lib/types'

/**
 * Um deck marcado como "Público" tem que aparecer em /flashcards. Parece óbvio,
 * mas havia dois campos decidindo isso: `visibility` (o que o usuário escolhe)
 * e `isPublished` (o que a comunidade filtrava). Deck criado já público nascia
 * com `isPublished: false` e sumia para sempre — visível na própria página,
 * invisível na lista.
 *
 * Estes testes fixam a regra: a visibilidade manda, e a lista pública não pode
 * depender de campos que documentos antigos nem têm.
 */

function deck(partial: Partial<FlashcardManualDeck>): FlashcardManualDeck {
  return {
    slug: 'deck',
    ownerId: 'u1',
    ownerName: 'Estudante',
    ownerType: 'user',
    title: 'Deck',
    visibility: 'private',
    isFeatured: false,
    pricing: 'free',
    allowedGroups: [],
    folderId: null,
    linkedMaterialId: null,
    cardCount: 0,
    viewCount: 0,
    studyCount: 0,
    likeCount: 0,
    isPublished: false,
    isHidden: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as FlashcardManualDeck
}

// resolveDeckAccess só vai ao banco para compras e compartilhamentos; nenhum
// dos dois existe nos casos abaixo.
const dbVazio: any = {
  collection: () => ({
    findOne: async () => null,
    find: () => ({ project: () => ({ toArray: async () => [] }), toArray: async () => [] }),
  }),
}

async function acessoDeVisitanteLogado(d: FlashcardManualDeck) {
  return resolveDeckAccess({
    db: dbVazio,
    deck: d,
    userId: 'outro-usuario',
    userEmail: 'outro@exemplo.com',
    userGroups: [],
    isAdmin: false,
  })
}

describe('publicação de deck', () => {
  it('considera publicado o que não é privado, mesmo sem isPublished', () => {
    expect(isDeckPublished(deck({ visibility: 'public', isPublished: false }))).toBe(true)
    expect(isDeckPublished(deck({ visibility: 'unlisted', isPublished: false }))).toBe(true)
  })

  it('nunca considera publicado um deck privado', () => {
    expect(isDeckPublished(deck({ visibility: 'private', isPublished: true }))).toBe(false)
  })

  it('só trata como escondido o deck marcado explicitamente', () => {
    expect(isDeckHidden(deck({ isHidden: true }))).toBe(true)
    expect(isDeckHidden(deck({ isHidden: false }))).toBe(false)
    // Deck antigo, gravado antes do campo existir.
    expect(isDeckHidden({} as FlashcardManualDeck)).toBe(false)
  })
})

describe('filtro da comunidade', () => {
  it('lista só o que é público e não usa igualdade em isHidden', () => {
    expect(PUBLIC_DECK_LISTING_FILTER.visibility).toBe('public')
    // `$ne: true` deixa passar o documento sem o campo; `false` não deixaria.
    expect(PUBLIC_DECK_LISTING_FILTER.isHidden).toEqual({ $ne: true })
  })

  it('não exige isPublished, que documentos quebrados têm como false', () => {
    expect(PUBLIC_DECK_LISTING_FILTER).not.toHaveProperty('isPublished')
  })
})

describe('acesso a deck público', () => {
  it('libera o deck público para qualquer pessoa logada, mesmo sem isPublished', async () => {
    const acesso = await acessoDeVisitanteLogado(deck({ visibility: 'public', isPublished: false }))
    expect(acesso.hasAccess).toBe(true)
    expect(acesso.reasons).toContain('public')
  })

  it('libera o não-listado por link', async () => {
    const acesso = await acessoDeVisitanteLogado(deck({ visibility: 'unlisted', isPublished: false }))
    expect(acesso.hasAccess).toBe(true)
    expect(acesso.reasons).toContain('unlisted')
  })

  it('não libera deck privado de outra pessoa nem com isPublished marcado', async () => {
    const acesso = await acessoDeVisitanteLogado(deck({ visibility: 'private', isPublished: true }))
    expect(acesso.hasAccess).toBe(false)
  })

  it('não libera deck pago só porque está público', async () => {
    const acesso = await acessoDeVisitanteLogado(deck({
      visibility: 'public',
      isPublished: true,
      ownerType: 'admin',
      pricing: 'paid',
      linkedMaterialId: null,
    }))
    expect(acesso.hasAccess).toBe(false)
  })
})

/**
 * O diagnóstico mostrado ao dono ("não aparece porque…") tem que dizer a mesma
 * coisa que a consulta da comunidade faz. Se um dia o filtro ganhar mais uma
 * condição e este cálculo não, a tela volta a mentir — que é exatamente o
 * problema original, só que com uma frase tranquilizadora por cima.
 */
describe('diagnóstico de listagem', () => {
  it('confirma a listagem do deck público, gratuito e não escondido', () => {
    const status = getDeckListingStatus(deck({ visibility: 'public' }))
    expect(status.listedInCommunity).toBe(true)
    expect(status.blockers).toEqual([])
  })

  it('aponta o deck privado', () => {
    expect(getDeckListingStatus(deck({ visibility: 'private' })).blockers).toEqual(['private'])
  })

  it('aponta o não-listado, que abre por link mas não entra na lista', () => {
    expect(getDeckListingStatus(deck({ visibility: 'unlisted' })).blockers).toEqual(['unlisted'])
  })

  it('aponta o deck escondido por um admin — o caso que dizia "Público" e sumia', () => {
    const status = getDeckListingStatus(deck({ visibility: 'public', isHidden: true }))
    expect(status.listedInCommunity).toBe(false)
    expect(status.blockers).toEqual(['hidden'])
  })

  it('aponta o deck pago oficial, que mora na Loja e não na comunidade gratuita', () => {
    const status = getDeckListingStatus(deck({ visibility: 'public', pricing: 'paid', ownerType: 'admin' }))
    expect(status.listedInCommunity).toBe(false)
    expect(status.blockers).toEqual(['paid'])
    expect(status.listedInStore).toBe(true)
  })

  it('denuncia o deck pago e pessoal, que não aparece em prateleira nenhuma', () => {
    // A Comunidade o exclui por ser pago; a Loja, por não ser Oficial. Era o
    // caso real: o deck existia, abria pelo link e não estava em /flashcards.
    const status = getDeckListingStatus(deck({ visibility: 'public', pricing: 'paid', ownerType: 'user' }))
    expect(status.listedInCommunity).toBe(false)
    expect(status.listedInStore).toBe(false)
    expect(status.blockers).toEqual(['paid_personal'])
  })

  it('não promete a Loja para deck que não é oficial', () => {
    expect(getDeckListingStatus(deck({ visibility: 'public', ownerType: 'user' })).listedInStore).toBe(false)
  })

  it('concorda com o filtro da comunidade em todas as combinações', () => {
    const visibilidades = ['private', 'public', 'unlisted'] as const
    const ocultos = [true, false, undefined]
    const precos = ['free', 'paid', undefined] as const

    for (const visibility of visibilidades) {
      for (const isHidden of ocultos) {
        for (const pricing of precos) {
          const d = deck({ visibility, isHidden, pricing } as any)
          // O mesmo que o Mongo faria com PUBLIC_DECK_LISTING_FILTER + pricing.
          const casaComOFiltro =
            d.visibility === PUBLIC_DECK_LISTING_FILTER.visibility &&
            d.isHidden !== true &&
            d.pricing !== 'paid'
          expect(getDeckListingStatus(d).listedInCommunity, JSON.stringify({ visibility, isHidden, pricing }))
            .toBe(casaComOFiltro)
        }
      }
    }
  })
})
