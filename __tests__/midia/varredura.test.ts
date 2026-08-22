import { describe, expect, it } from 'vitest'
import { ObjectId } from 'mongodb'
import { coletarUrls, lerCaminho, planejarReescrita } from '@/lib/midia/varredura'

/**
 * A varredura é genérica de propósito (ver o cabeçalho de lib/midia/varredura.ts):
 * os documentos abaixo são recortes reais do formato de cada seção, e o valor
 * deles é justamente nenhum caminho estar codificado no scanner.
 */

describe('coletarUrls', () => {
  it('acha o campo dedicado, o item de array e o objeto aninhado', () => {
    const questao = {
      _id: new ObjectId(),
      enunciado: 'Observe a imagem',
      imagemUrl: 'https://i.imgur.com/principal.png',
      imagensAlternativas: [
        { letra: 'A', url: 'https://i.imgur.com/alt-a.png' },
        { letra: 'B', url: 'https://i.imgur.com/alt-b.png' },
      ],
      capa: { tipo: 'imagem', imagem: 'https://i.imgur.com/capa.png' },
    }

    expect(coletarUrls(questao)).toEqual([
      { caminho: 'imagemUrl', url: 'https://i.imgur.com/principal.png' },
      { caminho: 'imagensAlternativas.0.url', url: 'https://i.imgur.com/alt-a.png' },
      { caminho: 'imagensAlternativas.1.url', url: 'https://i.imgur.com/alt-b.png' },
      { caminho: 'capa.imagem', url: 'https://i.imgur.com/capa.png' },
    ])
  })

  it('acha figura embutida no meio de um texto longo', () => {
    const patologia = {
      _id: new ObjectId(),
      fisiopatologia: 'A cascata começa…\n!image[Figura 1](https://i.imgur.com/meca.png)\n…e termina.',
      imagens_mecanismo: ['https://i.imgur.com/f1.png', 'https://i.imgur.com/f2.png'],
    }

    expect(coletarUrls(patologia)).toEqual([
      { caminho: 'fisiopatologia', url: 'https://i.imgur.com/meca.png' },
      { caminho: 'imagens_mecanismo.0', url: 'https://i.imgur.com/f1.png' },
      { caminho: 'imagens_mecanismo.1', url: 'https://i.imgur.com/f2.png' },
    ])
  })

  it('não desce em Date, ObjectId e afins', () => {
    const doc = {
      _id: new ObjectId(),
      criadoEm: new Date('2024-01-01'),
      autorId: new ObjectId(),
      imagemUrl: 'https://i.imgur.com/a.png',
    }
    expect(coletarUrls(doc)).toEqual([{ caminho: 'imagemUrl', url: 'https://i.imgur.com/a.png' }])
  })

  it('ignora o _id mesmo quando ele é uma string parecida com URL', () => {
    expect(coletarUrls({ _id: 'https://i.imgur.com/a.png', titulo: 'x' })).toEqual([])
  })

  it('devolve vazio para documento sem imagem externa', () => {
    const doc = { _id: 1, titulo: 'Prova', coverImage: '/midia/aa/ja-migrada.png', video: 'https://youtu.be/x' }
    expect(coletarUrls(doc)).toEqual([])
  })

  it('respeita a profundidade máxima', () => {
    const fundo = { a: { b: { c: { imagemUrl: 'https://i.imgur.com/a.png' } } } }
    expect(coletarUrls(fundo)).toHaveLength(1)
    expect(coletarUrls(fundo, { profundidadeMaxima: 2 })).toHaveLength(0)
  })
})

describe('planejarReescrita', () => {
  const doc = {
    _id: new ObjectId(),
    imagemUrl: 'https://i.imgur.com/a.png',
    imagensAlternativas: [{ letra: 'A', url: 'https://i.imgur.com/b.png' }],
    enunciado: 'Veja !image[F1](https://i.imgur.com/a.png) e !image[F2](https://i.imgur.com/perdida.png).',
  }

  const mapa = new Map([
    ['https://i.imgur.com/a.png', '/midia/aa/aaa.png'],
    ['https://i.imgur.com/b.png', '/midia/bb/bbb.png'],
  ])

  it('monta $set só nas folhas que mudaram, em dot-notation', () => {
    const plano = planejarReescrita(doc, mapa)
    expect(plano.sets).toEqual({
      imagemUrl: '/midia/aa/aaa.png',
      'imagensAlternativas.0.url': '/midia/bb/bbb.png',
      enunciado: 'Veja !image[F1](/midia/aa/aaa.png) e !image[F2](https://i.imgur.com/perdida.png).',
    })
  })

  it('guarda os valores anteriores para permitir reversão', () => {
    const plano = planejarReescrita(doc, mapa)
    expect(plano.originais.imagemUrl).toBe('https://i.imgur.com/a.png')
    expect(plano.originais['imagensAlternativas.0.url']).toBe('https://i.imgur.com/b.png')
  })

  it('migra as que deram certo e reporta a que ficou faltando', () => {
    // Um texto com dez figuras não pode ficar refém da única que sumiu da origem.
    const plano = planejarReescrita(doc, mapa)
    expect(plano.urlsPendentes).toEqual(['https://i.imgur.com/perdida.png'])
    expect(plano.urlsSubstituidas.sort()).toEqual([
      'https://i.imgur.com/a.png',
      'https://i.imgur.com/b.png',
    ])
  })

  it('não gera escrita nenhuma quando não há substituto', () => {
    const plano = planejarReescrita(doc, new Map())
    expect(plano.sets).toEqual({})
    expect(plano.urlsPendentes).toHaveLength(3)
  })

  it('é idempotente: rodar sobre documento já migrado não produz escrita', () => {
    const plano = planejarReescrita(doc, mapa)
    const migrado = {
      ...doc,
      imagemUrl: plano.sets.imagemUrl,
      imagensAlternativas: [{ letra: 'A', url: plano.sets['imagensAlternativas.0.url'] }],
      enunciado: plano.sets.enunciado,
    }
    expect(planejarReescrita(migrado, mapa).sets).toEqual({})
  })
})

describe('lerCaminho', () => {
  it('lê dot-notation com índice de array', () => {
    const doc = { a: [{ b: 'x' }] }
    expect(lerCaminho(doc, 'a.0.b')).toBe('x')
    expect(lerCaminho(doc, 'a.1.b')).toBeUndefined()
    expect(lerCaminho(doc, 'nada')).toBeUndefined()
  })
})
