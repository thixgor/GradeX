import { describe, expect, it } from 'vitest'

import {
  MAX_PACOTES_NA_LISTA,
  construirModelo,
  recomendar,
  similaridadeDeCoCompra,
  tokenizar,
  type Cesta,
  type ItemDoCatalogo,
} from '@/lib/recomendacoes/motor'

/**
 * O que estes testes protegem: que cada sinal do motor faça o que promete.
 *
 *  - co-compra manda quando há venda; conteúdo manda quando não há;
 *  - o pacote que contém o material aparece com o motivo certo;
 *  - nada que a pessoa já tem (ou que vem no pacote da página) é sugerido;
 *  - a prateleira não vira oito cópias do mesmo assunto.
 */

function material(id: string, extra: Partial<ItemDoCatalogo> = {}): ItemDoCatalogo {
  return { itemType: 'material', itemId: id, titulo: `Material ${id}`, tags: [], pago: true, preco: 50, ...extra }
}

function pacote(id: string, materialIds: string[], extra: Partial<ItemDoCatalogo> = {}): ItemDoCatalogo {
  return { itemType: 'package', itemId: id, titulo: `Pacote ${id}`, tags: [], materialIds, pago: true, preco: 120, ...extra }
}

function cestas(n: number, ...itens: string[]): Cesta[] {
  return Array.from({ length: n }, () => [...itens])
}

const ids = (lista: { itemType: string; itemId: string }[]) => lista.map((r) => `${r.itemType}:${r.itemId}`)

describe('tokenizar', () => {
  it('tira acento, caixa, palavras vazias e números soltos', () => {
    expect(tokenizar('Resumo de Cardiologia — Valvopatias 2026')).toEqual(['cardiologia', 'valvopatias'])
  })
})

describe('co-compra', () => {
  it('encolhe a similaridade de quem tem pouco suporte', () => {
    const catalogo = [material('a'), material('b'), material('c')]
    const modelo = construirModelo(catalogo, [
      ...cestas(10, 'material:a', 'material:b'),
      ...cestas(1, 'material:a', 'material:c'),
    ])
    expect(similaridadeDeCoCompra(modelo, 'material:a', 'material:b')).toBeGreaterThan(
      3 * similaridadeDeCoCompra(modelo, 'material:a', 'material:c')
    )
  })

  it('ignora cestas gigantes (conta de teste/admin)', () => {
    const catalogo = Array.from({ length: 70 }, (_, i) => material(`m${i}`))
    const modelo = construirModelo(catalogo, [catalogo.map((m) => `material:${m.itemId}`)])
    expect(similaridadeDeCoCompra(modelo, 'material:m0', 'material:m1')).toBe(0)
  })

  it('com venda de sobra, o que é comprado junto vem primeiro', () => {
    const catalogo = [
      material('semente', { tags: ['Cardiologia'] }),
      material('junto', { tags: ['Pneumologia'] }),
      material('parecido', { tags: ['Cardiologia'] }),
    ]
    const modelo = construirModelo(catalogo, [
      ...cestas(30, 'material:semente', 'material:junto'),
      ...cestas(30, 'material:parecido'),
    ])
    const [primeiro] = recomendar(modelo, 'material:semente')
    expect(primeiro.itemId).toBe('junto')
    expect(primeiro.motivo).toBe('Quem comprou este também levou')
  })
})

describe('item sem venda (partida a frio)', () => {
  it('o conteúdo decide, e o motivo diz o assunto em comum', () => {
    const catalogo = [
      material('novo', { tags: ['Valvopatias'], titulo: 'Valvopatias na prática' }),
      material('mesmo-tema', { tags: ['Valvopatias'] }),
      material('campeao', { tags: ['Dermatologia'], interesse: 5000 }),
      ...Array.from({ length: 8 }, (_, i) => material(`x${i}`, { tags: ['Outros'] })),
    ]
    const modelo = construirModelo(catalogo, cestas(50, 'material:campeao', 'material:x0'))
    const [primeiro] = recomendar(modelo, 'material:novo')
    expect(primeiro.itemId).toBe('mesmo-tema')
    expect(primeiro.motivo).toBe('Também sobre Valvopatias')
  })

  it('sem nenhum sinal específico, o mais procurado preenche', () => {
    const catalogo = [material('sozinho'), material('campeao', { interesse: 5000 }), material('frio')]
    const modelo = construirModelo(catalogo, cestas(20, 'material:campeao'))
    const [primeiro] = recomendar(modelo, 'material:sozinho')
    expect(primeiro.itemId).toBe('campeao')
    expect(primeiro.motivo).toBe('Mais procurado')
  })
})

describe('estrutura do catálogo', () => {
  it('sugere o pacote que contém o material da página', () => {
    const catalogo = [material('m1'), material('m2'), pacote('p', ['m1', 'm2']), material('solto')]
    const recs = recomendar(construirModelo(catalogo, []), 'material:m1')
    const doPacote = recs.find((r) => r.itemType === 'package')
    expect(doPacote?.motivo).toBe('Inclui este material')
    expect(doPacote?.totalDeMateriais).toBe(2)
    expect(recs[0].itemType).toBe('package')
  })

  it('na página do pacote, não sugere o que já vem dentro dele', () => {
    const catalogo = [material('m1'), material('m2'), pacote('p', ['m1', 'm2']), material('fora')]
    const recs = recomendar(construirModelo(catalogo, []), 'package:p')
    expect(ids(recs)).not.toContain('material:m1')
    expect(ids(recs)).not.toContain('material:m2')
    expect(ids(recs)).toContain('material:fora')
  })
})

describe('personalização', () => {
  const catalogo = [
    material('pagina'),
    material('tenho'),
    material('vem-com-o-meu'),
    material('dentro-do-meu-pacote'),
    pacote('meu-pacote', ['dentro-do-meu-pacote']),
    material('so-plus', { grupos: ['plus'] }),
  ]
  const modelo = construirModelo(catalogo, cestas(15, 'material:tenho', 'material:vem-com-o-meu'))

  it('tira o que a pessoa tem, direto ou por pacote, e o que a conta não pode comprar', () => {
    const recs = recomendar(modelo, 'material:pagina', {
      possuidos: new Set(['material:tenho', 'package:meu-pacote']),
      materiaisPossuidos: new Set(['tenho', 'dentro-do-meu-pacote']),
      grupos: [],
    })
    expect(ids(recs)).not.toContain('material:tenho')
    expect(ids(recs)).not.toContain('material:dentro-do-meu-pacote')
    expect(ids(recs)).not.toContain('package:meu-pacote')
    expect(ids(recs)).not.toContain('material:so-plus')
  })

  it('usa o que a pessoa tem como semente', () => {
    const [primeiro] = recomendar(modelo, 'material:pagina', {
      possuidos: new Set(['material:tenho']),
      materiaisPossuidos: new Set(['tenho']),
      grupos: ['plus'],
    })
    expect(primeiro.itemId).toBe('vem-com-o-meu')
    expect(primeiro.motivo).toBe('Combina com o que você já tem')
  })
})

describe('diversidade (MMR)', () => {
  it('não deixa um assunto só ocupar a prateleira', () => {
    const catalogo = [
      material('semente', { tags: ['Cardiologia', 'ECG'], folderId: 'f1' }),
      ...Array.from({ length: 6 }, (_, i) => material(`clone${i}`, { tags: ['Cardiologia', 'ECG'], folderId: 'f1' })),
      // Mesmo assunto, outra pasta: um pouco menos relevante que os da pasta.
      material('vizinho', { tags: ['Cardiologia', 'ECG'], folderId: 'f2' }),
      ...Array.from({ length: 10 }, (_, i) => material(`ruido${i}`, { tags: ['Ortopedia'], folderId: 'f9' })),
    ]
    const recs = recomendar(construirModelo(catalogo, []), 'material:semente', { limite: 5 })
    expect(ids(recs)).toContain('material:vizinho')
    // …e o que não tem nada a ver continua de fora.
    expect(ids(recs).some((id) => id.includes('ruido'))).toBe(false)
  })

  it('limita quantos pacotes entram', () => {
    const catalogo = [
      material('m'),
      ...Array.from({ length: 6 }, (_, i) => pacote(`p${i}`, ['m'])),
      material('outro'),
    ]
    const recs = recomendar(construirModelo(catalogo, []), 'material:m', { limite: 8 })
    expect(recs.filter((r) => r.itemType === 'package').length).toBe(MAX_PACOTES_NA_LISTA)
  })
})
