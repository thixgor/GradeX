import { describe, it, expect } from 'vitest'
import {
  applyImagesToCards,
  buildImportCards,
  cardCountForImages,
  extractImagePlaceholders,
  parseMarkdown,
  sanitizeImageList,
  sanitizeImageUrl,
} from '@/lib/flashcard-import'

/**
 * A importação de flashcards existia só para texto: as imagens tinham que ser
 * hospedadas fora e coladas cartão a cartão. O que estes testes protegem é a
 * regra que substituiu esse trabalho manual — a ordem em que as imagens
 * enviadas caem nos cartões.
 */

const IMG = (n: number) => `https://blob.example.com/flashcards/${n}.jpg`

describe('distribuição das imagens pela ordem de envio', () => {
  const markdown = `## Frente
Qual estrutura está indicada?

## Verso
Núcleo

---

## Frente
E aqui?

## Verso
Mitocôndria`

  it('alterna frente e verso a cada duas imagens', () => {
    const { cards } = buildImportCards({
      format: 'markdown',
      payload: markdown,
      images: [IMG(1), IMG(2), IMG(3), IMG(4)],
      imageMode: 'alternate',
    })

    expect(cards).toHaveLength(2)
    expect(cards[0].front.image).toBe(IMG(1))
    expect(cards[0].back.image).toBe(IMG(2))
    expect(cards[1].front.image).toBe(IMG(3))
    expect(cards[1].back.image).toBe(IMG(4))
  })

  it('alternado é o padrão quando o modo não vem informado', () => {
    const { cards } = buildImportCards({
      format: 'markdown',
      payload: markdown,
      images: [IMG(1), IMG(2)],
    })
    expect(cards[0].front.image).toBe(IMG(1))
    expect(cards[0].back.image).toBe(IMG(2))
    expect(cards[1].front.image).toBeUndefined()
  })

  it('modo "front" põe uma imagem por cartão, sempre na frente', () => {
    const { cards } = buildImportCards({
      format: 'markdown',
      payload: markdown,
      images: [IMG(1), IMG(2)],
      imageMode: 'front',
    })
    expect(cards[0].front.image).toBe(IMG(1))
    expect(cards[0].back.image).toBeUndefined()
    expect(cards[1].front.image).toBe(IMG(2))
  })

  it('modo "back" põe uma imagem por cartão, sempre no verso', () => {
    const { cards } = buildImportCards({
      format: 'markdown',
      payload: markdown,
      images: [IMG(1), IMG(2)],
      imageMode: 'back',
    })
    expect(cards[0].back.image).toBe(IMG(1))
    expect(cards[0].front.image).toBeUndefined()
    expect(cards[1].back.image).toBe(IMG(2))
  })

  it('imagens a mais sobram sem cartão em vez de sumir em silêncio', () => {
    const result = buildImportCards({
      format: 'markdown',
      payload: markdown,
      images: [IMG(1), IMG(2), IMG(3), IMG(4), IMG(5)],
      imageMode: 'alternate',
    })
    expect(result.usedImages).toBe(4)
    expect(result.leftoverImages).toBe(1)
    expect(result.assignments[4]).toBeNull()
  })

  it('reporta para onde cada imagem foi, para o preview da tela', () => {
    const { assignments } = buildImportCards({
      format: 'markdown',
      payload: markdown,
      images: [IMG(1), IMG(2), IMG(3)],
      imageMode: 'alternate',
    })
    expect(assignments[0]).toEqual({ cardIndex: 0, side: 'front' })
    expect(assignments[1]).toEqual({ cardIndex: 0, side: 'back' })
    expect(assignments[2]).toEqual({ cardIndex: 1, side: 'front' })
  })
})

describe('marcadores escritos no texto', () => {
  it('reconhece {{img2}}, ![](img1) e [[img:3]]', () => {
    expect(extractImagePlaceholders('antes {{img2}} depois').indexes).toEqual([1])
    expect(extractImagePlaceholders('![corte axial](img1)').indexes).toEqual([0])
    expect(extractImagePlaceholders('[[img:3]]').indexes).toEqual([2])
    expect(extractImagePlaceholders('{{imagem 4}}').indexes).toEqual([3])
  })

  it('remove o marcador do texto do cartão', () => {
    const { text } = extractImagePlaceholders('Qual estrutura?\n\n{{img1}}\n')
    expect(text).toBe('Qual estrutura?')
  })

  it('marcador vence a ordem automática e não consome a imagem duas vezes', () => {
    const { cards, usedImages } = buildImportCards({
      format: 'markdown',
      payload: `## Frente
Qual estrutura?
{{img3}}

## Verso
Núcleo

---

## Frente
Segunda pergunta

## Verso
Segunda resposta`,
      images: [IMG(1), IMG(2), IMG(3)],
      imageMode: 'alternate',
    })

    expect(cards[0].front.image).toBe(IMG(3))
    expect(cards[0].front.text).toBe('Qual estrutura?')
    // Sobraram 1 e 2 para os slots livres, na ordem.
    expect(cards[0].back.image).toBe(IMG(1))
    expect(cards[1].front.image).toBe(IMG(2))
    expect(usedImages).toBe(3)
  })

  it('modo "none" ignora a ordem e só honra os marcadores', () => {
    const result = buildImportCards({
      format: 'markdown',
      payload: `## Frente
{{img2}}

## Verso
Resposta`,
      images: [IMG(1), IMG(2)],
      imageMode: 'none',
    })
    expect(result.cards[0].front.image).toBe(IMG(2))
    expect(result.cards[0].back.image).toBeUndefined()
    expect(result.leftoverImages).toBe(1)
  })

  it('marcador que aponta para imagem inexistente não vira URL quebrada', () => {
    const { cards } = buildImportCards({
      format: 'markdown',
      payload: `## Frente
{{img9}}

## Verso
Resposta`,
      images: [IMG(1)],
      imageMode: 'none',
    })
    expect(cards[0].front.image).toBeUndefined()
    expect(cards[0].front.text).toBe('')
  })
})

describe('baralho feito só de imagens', () => {
  it('cada par de imagens vira um cartão', () => {
    const { cards } = buildImportCards({
      format: 'images',
      payload: '',
      images: [IMG(1), IMG(2), IMG(3), IMG(4)],
      imageMode: 'alternate',
    })
    expect(cards).toHaveLength(2)
    expect(cards.map(c => [c.front.image, c.back.image])).toEqual([
      [IMG(1), IMG(2)],
      [IMG(3), IMG(4)],
    ])
  })

  it('imagem ímpar sobrando ainda vira cartão só de frente', () => {
    const { cards, leftoverImages } = buildImportCards({
      format: 'images',
      payload: '',
      images: [IMG(1), IMG(2), IMG(3)],
      imageMode: 'alternate',
    })
    expect(cards).toHaveLength(2)
    expect(cards[1].front.image).toBe(IMG(3))
    expect(cards[1].back.image).toBeUndefined()
    expect(leftoverImages).toBe(0)
  })

  it('no modo "front" cada imagem é um cartão', () => {
    expect(cardCountForImages(3, 'front')).toBe(3)
    expect(cardCountForImages(3, 'alternate')).toBe(2)
    expect(cardCountForImages(3, 'none')).toBe(0)
  })

  it('sem imagem e sem texto não importa nada', () => {
    const { cards } = buildImportCards({ format: 'images', payload: '', images: [] })
    expect(cards).toHaveLength(0)
  })
})

describe('Markdown de cartão sem texto', () => {
  it('aceita "## Frente" vazio, que é o cartão só de imagem', () => {
    const parsed = parseMarkdown(`## Frente

## Verso
`)
    expect(parsed).toHaveLength(1)

    const { cards } = buildImportCards({
      format: 'markdown',
      payload: `## Frente

## Verso
`,
      images: [IMG(1), IMG(2)],
      imageMode: 'alternate',
    })
    expect(cards).toHaveLength(1)
    expect(cards[0].front.image).toBe(IMG(1))
    expect(cards[0].back.image).toBe(IMG(2))
  })

  it('descarta cartão que ficou sem texto e sem imagem', () => {
    const { cards } = buildImportCards({
      format: 'markdown',
      payload: `## Frente
Pergunta

## Verso
Resposta

---

## Frente

## Verso
`,
      images: [],
      imageMode: 'alternate',
    })
    expect(cards).toHaveLength(1)
  })

  it('renumera os cartões do preview depois de descartar os vazios', () => {
    const { cards, assignments } = buildImportCards({
      format: 'markdown',
      payload: `## Frente

## Verso

---

## Frente
Pergunta

## Verso
Resposta
{{img1}}`,
      images: [IMG(1)],
      imageMode: 'none',
    })
    // O primeiro bloco ficou totalmente vazio e saiu; o marcador do bloco que
    // sobrou aponta para o cartão que agora é o de índice 0.
    expect(cards).toHaveLength(1)
    expect(cards[0].back.image).toBe(IMG(1))
    expect(assignments[0]).toEqual({ cardIndex: 0, side: 'back' })
  })

  it('bloco vazio que recebeu imagem pela ordem continua sendo um cartão', () => {
    const { cards } = buildImportCards({
      format: 'markdown',
      payload: `## Frente

## Verso

---

## Frente
Pergunta

## Verso
Resposta`,
      images: [IMG(1)],
      imageMode: 'back',
    })
    expect(cards).toHaveLength(2)
    expect(cards[0].back.image).toBe(IMG(1))
  })

  it('aceita "Comentário" com e sem acento', () => {
    const [card] = parseMarkdown(`## Frente
P

## Verso
R

## Comentario
Explicação`)
    expect(card.comment).toBe('Explicação')
  })
})

describe('cartões de palavra oculta', () => {
  const hidden = (n: number) => ({
    kind: 'hidden_word' as const,
    front: { text: '' },
    back: { text: '' },
    hiddenWord: { phrase: `Frase ${n}`, word: `palavra${n}` },
  })

  it('recebem imagem como qualquer outro cartão', () => {
    const { cards } = applyImagesToCards(
      [hidden(1), { kind: 'standard', front: { text: 'P' }, back: { text: 'R' } }],
      [IMG(1), IMG(2)],
      'front',
    )
    expect(cards[0].front.image).toBe(IMG(1))
    expect(cards[1].front.image).toBe(IMG(2))
  })

  it('não desloca a numeração quando o baralho mistura os dois tipos', () => {
    // O caso que quebrou em produção: palavra oculta no cartão 1 e no 6
    // empurrava a imagem 1 para o cartão 2 e abria um buraco no meio.
    const cards = [
      hidden(1),
      { kind: 'standard' as const, front: { text: 'P2' }, back: { text: 'R2' } },
      { kind: 'standard' as const, front: { text: 'P3' }, back: { text: 'R3' } },
      hidden(4),
      { kind: 'standard' as const, front: { text: 'P5' }, back: { text: 'R5' } },
    ]
    const { assignments } = applyImagesToCards(cards, [IMG(1), IMG(2), IMG(3), IMG(4), IMG(5)], 'front')

    expect(assignments).toEqual([
      { cardIndex: 0, side: 'front' },
      { cardIndex: 1, side: 'front' },
      { cardIndex: 2, side: 'front' },
      { cardIndex: 3, side: 'front' },
      { cardIndex: 4, side: 'front' },
    ])
  })

  it('no modo alternado ocupa frente e verso, como os demais', () => {
    const { cards } = applyImagesToCards([hidden(1)], [IMG(1), IMG(2)], 'alternate')
    expect(cards[0].front.image).toBe(IMG(1))
    expect(cards[0].back.image).toBe(IMG(2))
  })
})

describe('URLs de imagem', () => {
  it('aceita http, https e caminho interno', () => {
    expect(sanitizeImageUrl('https://i.imgur.com/a.png')).toBe('https://i.imgur.com/a.png')
    expect(sanitizeImageUrl('http://localhost:3000/a.png')).toBe('http://localhost:3000/a.png')
    expect(sanitizeImageUrl('/uploads/a.png')).toBe('/uploads/a.png')
  })

  it('recusa javascript:, data: e lixo', () => {
    expect(sanitizeImageUrl('javascript:alert(1)')).toBeUndefined()
    expect(sanitizeImageUrl('data:image/png;base64,AAAA')).toBeUndefined()
    expect(sanitizeImageUrl('nao é url')).toBeUndefined()
    expect(sanitizeImageUrl('')).toBeUndefined()
    expect(sanitizeImageUrl(42)).toBeUndefined()
  })

  it('filtra a lista inteira mantendo a ordem das válidas', () => {
    expect(sanitizeImageList([IMG(1), 'javascript:x', IMG(2)])).toEqual([IMG(1), IMG(2)])
    expect(sanitizeImageList('nada')).toEqual([])
  })
})

describe('formatos existentes seguem funcionando', () => {
  it('JSON continua aceito, com e sem imagens', () => {
    const { cards } = buildImportCards({
      format: 'json',
      payload: JSON.stringify([
        { front: { text: 'P1' }, back: { text: 'R1' }, comment: 'C1' },
        { front: 'P2', back: 'R2' },
      ]),
      images: [IMG(1)],
      imageMode: 'front',
    })
    expect(cards).toHaveLength(2)
    expect(cards[0].comment).toBe('C1')
    expect(cards[0].front.image).toBe(IMG(1))
    expect(cards[1].front.text).toBe('P2')
  })

  it('CSV com cabeçalho continua aceito', () => {
    const { cards } = buildImportCards({
      format: 'csv',
      payload: 'front,back,comment\nP1,R1,C1\nP2,R2,',
      images: [],
    })
    expect(cards).toHaveLength(2)
    expect(cards[0].front.text).toBe('P1')
    expect(cards[0].back.text).toBe('R1')
  })

  it('JSON inválido estoura para virar erro 400 na rota', () => {
    expect(() => buildImportCards({ format: 'json', payload: '{ isso não é json' })).toThrow()
  })
})
