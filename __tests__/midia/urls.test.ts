import { describe, expect, it } from 'vitest'
import {
  caminhoCanonico,
  caminhoNoBlob,
  ehCaminhoInternalizado,
  ehContentTypeDeImagem,
  ehImagemExterna,
  encontrarImagensExternas,
  extensaoPara,
  substituirUrls,
} from '@/lib/midia/urls'

describe('ehImagemExterna', () => {
  it('aceita o Imgur mesmo sem extensão no caminho', () => {
    // O link que o admin cola normalmente é este: sem `.png` no fim.
    expect(ehImagemExterna('https://i.imgur.com/AbC12dE')).toBe(true)
    expect(ehImagemExterna('https://i.imgur.com/AbC12dE.png')).toBe(true)
  })

  it('aceita host desconhecido quando o caminho termina em extensão de imagem', () => {
    expect(ehImagemExterna('https://algum-site.edu/figuras/pancreas.jpg')).toBe(true)
    expect(ehImagemExterna('https://algum-site.edu/figuras/pancreas.JPEG')).toBe(true)
  })

  it('recusa host desconhecido sem extensão — pode ser página, não figura', () => {
    expect(ehImagemExterna('https://algum-site.edu/artigo/pancreas')).toBe(false)
  })

  it('recusa o que já é nosso', () => {
    expect(ehImagemExterna('/midia/ab/abc.png')).toBe(false)
    expect(ehImagemExterna('https://loja.public.blob.vercel-storage.com/x.png')).toBe(false)
    expect(ehImagemExterna('https://domineaqui.com.br/img/logo.png')).toBe(false)
    expect(ehImagemExterna('http://localhost:3000/img/logo.png')).toBe(false)
  })

  it('recusa players de vídeo e áudio', () => {
    expect(ehImagemExterna('https://youtu.be/abc123')).toBe(false)
    expect(ehImagemExterna('https://www.youtube.com/watch?v=abc123')).toBe(false)
    expect(ehImagemExterna('https://open.spotify.com/episode/abc')).toBe(false)
    expect(ehImagemExterna('https://drive.google.com/file/d/abc/view')).toBe(false)
  })

  it('recusa o que não é http', () => {
    expect(ehImagemExterna('data:image/png;base64,AAAA')).toBe(false)
    expect(ehImagemExterna('')).toBe(false)
    expect(ehImagemExterna('não é url')).toBe(false)
  })

  it('honra o recorte por host', () => {
    const soImgur = { somenteHosts: ['i.imgur.com'] }
    expect(ehImagemExterna('https://i.imgur.com/a.png', soImgur)).toBe(true)
    expect(ehImagemExterna('https://outro.com/a.png', soImgur)).toBe(false)
  })

  it('aceita host extra pedido na linha de comando', () => {
    expect(ehImagemExterna('https://acervo.edu/lamina', { hostsExtras: ['acervo.edu'] })).toBe(true)
  })
})

describe('encontrarImagensExternas', () => {
  it('acha a URL solta de um campo dedicado', () => {
    expect(encontrarImagensExternas('https://i.imgur.com/a.png')).toEqual(['https://i.imgur.com/a.png'])
  })

  it('acha dentro de embed markdown sem levar o parêntese junto', () => {
    // É assim que as figuras aparecem no texto das patologias.
    const texto = 'Mecanismo:\n!image[Figura 1](https://i.imgur.com/a1b2c3.png)\nSegue o texto.'
    expect(encontrarImagensExternas(texto)).toEqual(['https://i.imgur.com/a1b2c3.png'])
  })

  it('acha dentro de HTML sem levar a aspa junto', () => {
    const texto = '<p>veja</p><img src="https://i.imgur.com/x.jpg" alt="corte">'
    expect(encontrarImagensExternas(texto)).toEqual(['https://i.imgur.com/x.jpg'])
  })

  it('acha várias e ignora a mistura de player e link comum', () => {
    const texto = [
      '!image[a](https://i.imgur.com/a.png)',
      '!video[b](https://youtu.be/zzz)',
      'referência: https://pubmed.ncbi.nlm.nih.gov/123456/',
      '<img src="https://i.imgur.com/b.png">',
    ].join('\n')
    expect(encontrarImagensExternas(texto)).toEqual([
      'https://i.imgur.com/a.png',
      'https://i.imgur.com/b.png',
    ])
  })

  it('não repete a mesma URL citada duas vezes', () => {
    const texto = 'https://i.imgur.com/a.png e de novo https://i.imgur.com/a.png'
    expect(encontrarImagensExternas(texto)).toEqual(['https://i.imgur.com/a.png'])
  })

  it('apara pontuação de fim de frase', () => {
    expect(encontrarImagensExternas('veja em https://i.imgur.com/a.png.')).toEqual([
      'https://i.imgur.com/a.png',
    ])
  })

  it('sai barato quando não há nada parecido com URL', () => {
    expect(encontrarImagensExternas('um enunciado qualquer sem link')).toEqual([])
    expect(encontrarImagensExternas('')).toEqual([])
  })
})

describe('substituirUrls', () => {
  it('troca dentro de texto preservando o resto', () => {
    const mapa = new Map([['https://i.imgur.com/a.png', '/midia/aa/abc.png']])
    expect(substituirUrls('!image[F1](https://i.imgur.com/a.png) fim', mapa)).toBe(
      '!image[F1](/midia/aa/abc.png) fim',
    )
  })

  it('não corrompe a URL mais longa que começa igual à mais curta', () => {
    // Sem a ordenação por tamanho, `…/a.png` comeria o prefixo de `…/a.png?w=800`
    // e sobraria `/midia/aa/abc.png?w=800` apontando para o arquivo errado.
    const mapa = new Map([
      ['https://i.imgur.com/a.png', '/midia/aa/curta.png'],
      ['https://i.imgur.com/a.png?w=800', '/midia/bb/longa.png'],
    ])
    const texto = 'x https://i.imgur.com/a.png?w=800 y https://i.imgur.com/a.png z'
    expect(substituirUrls(texto, mapa)).toBe('x /midia/bb/longa.png y /midia/aa/curta.png z')
  })

  it('devolve o mesmo texto quando o mapa está vazio', () => {
    expect(substituirUrls('nada a fazer', new Map())).toBe('nada a fazer')
  })
})

describe('extensaoPara', () => {
  it('prefere o content-type ao que a URL sugere', () => {
    expect(extensaoPara('image/webp', 'https://i.imgur.com/a.png')).toBe('webp')
    expect(extensaoPara('image/jpeg; charset=binary', 'https://i.imgur.com/a')).toBe('jpg')
  })

  it('cai na extensão da URL quando o content-type não ajuda', () => {
    expect(extensaoPara('application/octet-stream', 'https://x.com/a.png')).toBe('png')
    expect(extensaoPara(null, 'https://x.com/a.jpeg')).toBe('jpg')
  })

  it('usa bin quando não há pista nenhuma — e não finge que era PNG', () => {
    expect(extensaoPara(null, 'https://i.imgur.com/a')).toBe('bin')
  })
})

describe('caminho canônico', () => {
  const sha = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90'

  it('prateleira pelos dois primeiros dígitos do hash', () => {
    expect(caminhoCanonico(sha, 'png')).toBe(`/midia/a1/${sha}.png`)
    expect(caminhoNoBlob(sha, 'png')).toBe(`midia/a1/${sha}.png`)
  })

  it('reconhece o que já foi internalizado', () => {
    expect(ehCaminhoInternalizado(caminhoCanonico(sha, 'png'))).toBe(true)
    expect(ehCaminhoInternalizado('https://i.imgur.com/a.png')).toBe(false)
    expect(ehCaminhoInternalizado('/img/logo.png')).toBe(false)
  })
})

describe('ehContentTypeDeImagem', () => {
  it('aceita image/* e recusa o resto', () => {
    expect(ehContentTypeDeImagem('image/png')).toBe(true)
    expect(ehContentTypeDeImagem('image/jpeg; charset=utf-8')).toBe(true)
    expect(ehContentTypeDeImagem('text/html')).toBe(false)
    expect(ehContentTypeDeImagem(null)).toBe(false)
  })

  it('recusa SVG mesmo sendo image/*', () => {
    // SVG é documento executável e passaria a ser servido pelo nosso domínio.
    expect(ehContentTypeDeImagem('image/svg+xml')).toBe(false)
  })
})

describe('SVG fica fora da migração', () => {
  it('não é candidata nem por extensão', () => {
    expect(ehImagemExterna('https://algum-site.edu/diagrama.svg')).toBe(false)
    expect(encontrarImagensExternas('<img src="https://algum-site.edu/d.svg">')).toEqual([])
  })
})
