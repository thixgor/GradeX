import { describe, expect, it } from 'vitest'
import {
  MAXIMO_DE_IMAGENS,
  TAMANHO_MAXIMO_DA_IMAGEM,
  TAMANHO_MINIMO_DA_IMAGEM,
  TAMANHO_PADRAO_DA_IMAGEM,
  distribuirEmLinhas,
  ehUrlDeImagem,
  fonteDoCampoLegado,
  layoutDeImagens,
  normalizarImagem,
  normalizarImagens,
  reunirImagens,
  sincronizarCampoLegado,
  tamanhoDaImagem,
} from '@/lib/questoes/imagens'
import {
  imagensDaQuestaoDoBanco,
  imagensDaResposta,
  imagensDoEnunciado,
  layoutDoEnunciado,
  urlsDaQuestao,
} from '@/lib/questoes/imagens-da-questao'

describe('ehUrlDeImagem', () => {
  it('aceita http, https, caminho do site e data:image', () => {
    expect(ehUrlDeImagem('https://i.imgur.com/a.png')).toBe(true)
    expect(ehUrlDeImagem('http://exemplo.com/a.png')).toBe(true)
    expect(ehUrlDeImagem('/uploads/a.png')).toBe(true)
    expect(ehUrlDeImagem('data:image/png;base64,AAA')).toBe(true)
  })

  it('recusa o que não é imagem buscável', () => {
    expect(ehUrlDeImagem('javascript:alert(1)')).toBe(false)
    expect(ehUrlDeImagem('data:text/html,<b>')).toBe(false)
    expect(ehUrlDeImagem('   ')).toBe(false)
    expect(ehUrlDeImagem(null)).toBe(false)
    expect(ehUrlDeImagem(42)).toBe(false)
  })
})

describe('tamanhoDaImagem', () => {
  it('usa o padrão quando não há tamanho', () => {
    expect(tamanhoDaImagem(undefined)).toBe(TAMANHO_PADRAO_DA_IMAGEM)
    expect(tamanhoDaImagem({})).toBe(TAMANHO_PADRAO_DA_IMAGEM)
    expect(tamanhoDaImagem({ tamanho: Number.NaN })).toBe(TAMANHO_PADRAO_DA_IMAGEM)
  })

  it('prende o valor entre o mínimo e o máximo', () => {
    expect(tamanhoDaImagem({ tamanho: 5 })).toBe(TAMANHO_MINIMO_DA_IMAGEM)
    expect(tamanhoDaImagem({ tamanho: 400 })).toBe(TAMANHO_MAXIMO_DA_IMAGEM)
    expect(tamanhoDaImagem({ tamanho: 42.4 })).toBe(42)
  })
})

describe('normalizarImagem', () => {
  it('lê a string solta que os campos antigos guardavam', () => {
    expect(normalizarImagem('https://x/y.png')).toEqual({
      url: 'https://x/y.png',
      tamanho: TAMANHO_PADRAO_DA_IMAGEM,
    })
  })

  it('lê o objeto completo e descarta fonte vazia', () => {
    expect(normalizarImagem({ url: 'https://x/y.png', fonte: '  ', tamanho: 40 })).toEqual({
      url: 'https://x/y.png',
      tamanho: 40,
    })
    expect(normalizarImagem({ url: 'https://x/y.png', fonte: 'Netter' })).toEqual({
      url: 'https://x/y.png',
      fonte: 'Netter',
      tamanho: TAMANHO_PADRAO_DA_IMAGEM,
    })
  })

  it('devolve null para o que não é imagem', () => {
    expect(normalizarImagem({ url: 'javascript:alert(1)' })).toBeNull()
    expect(normalizarImagem(null)).toBeNull()
  })
})

describe('normalizarImagens', () => {
  it('descarta repetidas e inválidas', () => {
    const lidas = normalizarImagens([
      'https://x/1.png',
      { url: 'https://x/1.png' },
      { url: 'ftp://x/2.png' },
      { url: 'https://x/2.png', tamanho: 30 },
    ])
    expect(lidas.map((i) => i.url)).toEqual(['https://x/1.png', 'https://x/2.png'])
  })

  it('respeita o teto de imagens', () => {
    const muitas = Array.from({ length: MAXIMO_DE_IMAGENS + 4 }, (_, i) => `https://x/${i}.png`)
    expect(normalizarImagens(muitas)).toHaveLength(MAXIMO_DE_IMAGENS)
  })
})

describe('reunirImagens', () => {
  it('a lista manda quando existe, sem duplicar a legada', () => {
    const imagens = reunirImagens([{ url: 'https://x/1.png' }, { url: 'https://x/2.png' }], 'https://x/1.png')
    expect(imagens.map((i) => i.url)).toEqual(['https://x/1.png', 'https://x/2.png'])
  })

  it('a questão antiga vira uma lista de um item, com a fonte junto', () => {
    expect(reunirImagens(undefined, 'https://x/1.png', 'Wikipedia')).toEqual([
      { url: 'https://x/1.png', fonte: 'Wikipedia', tamanho: TAMANHO_PADRAO_DA_IMAGEM },
    ])
  })

  it('questão sem imagem nenhuma devolve lista vazia', () => {
    expect(reunirImagens(undefined, undefined)).toEqual([])
    expect(reunirImagens([], '')).toEqual([])
  })
})

describe('campos legados', () => {
  it('gravam a primeira imagem da lista', () => {
    const imagens = normalizarImagens([{ url: 'https://x/1.png', fonte: 'A' }, { url: 'https://x/2.png' }])
    expect(sincronizarCampoLegado(imagens)).toBe('https://x/1.png')
    expect(fonteDoCampoLegado(imagens)).toBe('A')
  })

  it('viram null quando não sobra imagem', () => {
    expect(sincronizarCampoLegado([])).toBeNull()
    expect(fonteDoCampoLegado([])).toBeNull()
  })
})

describe('distribuirEmLinhas', () => {
  const img = (tamanho: number, n: number) => ({ url: `https://x/${n}.png`, tamanho })

  it('empilhado dá uma imagem por linha', () => {
    const linhas = distribuirEmLinhas([img(30, 1), img(30, 2)], 'empilhado')
    expect(linhas).toHaveLength(2)
    expect(linhas.every((l) => l.length === 1)).toBe(true)
  })

  it('lado a lado junta enquanto cabe', () => {
    const linhas = distribuirEmLinhas([img(50, 1), img(50, 2), img(50, 3)], 'lado-a-lado')
    expect(linhas.map((l) => l.length)).toEqual([2, 1])
  })

  it('três de 33% cabem na mesma linha', () => {
    const linhas = distribuirEmLinhas([img(33, 1), img(33, 2), img(33, 3)], 'lado-a-lado')
    expect(linhas.map((l) => l.length)).toEqual([3])
  })

  it('uma imagem larga demais não fica sem linha', () => {
    const linhas = distribuirEmLinhas([img(100, 1), img(100, 2)], 'lado-a-lado')
    expect(linhas.map((l) => l.length)).toEqual([1, 1])
  })

  it('lista vazia não produz linha nenhuma', () => {
    expect(distribuirEmLinhas([], 'lado-a-lado')).toEqual([])
  })
})

describe('layoutDeImagens', () => {
  it('cai no padrão diante de lixo', () => {
    expect(layoutDeImagens('lado-a-lado')).toBe('lado-a-lado')
    expect(layoutDeImagens('grade')).toBe('empilhado')
    expect(layoutDeImagens(undefined)).toBe('empilhado')
  })
})

describe('leitura por domínio', () => {
  it('a questão de prova antiga continua com a sua imagem', () => {
    const questao = { imageUrl: 'https://x/1.png', imageSource: 'ENEM' }
    expect(imagensDoEnunciado(questao)).toEqual([
      { url: 'https://x/1.png', fonte: 'ENEM', tamanho: TAMANHO_PADRAO_DA_IMAGEM },
    ])
    expect(layoutDoEnunciado(questao)).toBe('empilhado')
    expect(imagensDaResposta(questao)).toEqual([])
  })

  it('a questão nova traz enunciado e resposta comentada separados', () => {
    const questao = {
      imageUrl: 'https://x/1.png',
      images: [{ url: 'https://x/1.png' }, { url: 'https://x/2.png', tamanho: 40 }],
      imagesLayout: 'lado-a-lado' as const,
      explanationImages: [{ url: 'https://x/3.png' }],
    }
    expect(imagensDoEnunciado(questao).map((i) => i.url)).toEqual(['https://x/1.png', 'https://x/2.png'])
    expect(layoutDoEnunciado(questao)).toBe('lado-a-lado')
    expect(imagensDaResposta(questao).map((i) => i.url)).toEqual(['https://x/3.png'])
    expect(urlsDaQuestao(questao)).toEqual(['https://x/1.png', 'https://x/2.png', 'https://x/3.png'])
  })

  it('a questão do Banco lê imagemUrl e imagens', () => {
    expect(imagensDaQuestaoDoBanco({ imagemUrl: 'https://x/1.png' }).map((i) => i.url)).toEqual([
      'https://x/1.png',
    ])
    expect(
      imagensDaQuestaoDoBanco({ imagemUrl: 'https://x/1.png', imagens: [{ url: 'https://x/9.png' }] }).map(
        (i) => i.url,
      ),
    ).toEqual(['https://x/9.png'])
  })
})
