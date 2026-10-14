import { describe, expect, it } from 'vitest'
import {
  anuncioCasaComPagina,
  capaDaMidia,
  formatarBytes,
  normalizarCaminho,
  rotuloDaProporcao,
  sanitizarMidia,
  sanitizarPaginas,
  TODAS_AS_PAGINAS,
} from '@/lib/anuncio-midia'

describe('páginas do anúncio na página', () => {
  it('um caminho vale para ele e para tudo abaixo dele', () => {
    expect(anuncioCasaComPagina(['/manual-clinico'], '/manual-clinico')).toBe(true)
    expect(anuncioCasaComPagina(['/manual-clinico'], '/manual-clinico/farmacologia/x')).toBe(true)
    expect(anuncioCasaComPagina(['/manual-clinico'], '/manual-clinico/')).toBe(true)
    // Prefixo de texto não é prefixo de rota.
    expect(anuncioCasaComPagina(['/materiais'], '/materiais-extra')).toBe(false)
  })

  it('"/" é só a página inicial, e "*" é o site todo', () => {
    expect(anuncioCasaComPagina(['/'], '/')).toBe(true)
    expect(anuncioCasaComPagina(['/'], '/dashboard')).toBe(false)
    expect(anuncioCasaComPagina([TODAS_AS_PAGINAS], '/qualquer/coisa')).toBe(true)
  })

  it('sem páginas, não aparece em lugar nenhum', () => {
    expect(anuncioCasaComPagina([], '/dashboard')).toBe(false)
    expect(anuncioCasaComPagina(undefined, '/dashboard')).toBe(false)
    expect(anuncioCasaComPagina(['/dashboard'], null)).toBe(false)
  })

  it('normaliza e recusa o que não é caminho interno', () => {
    expect(normalizarCaminho(' /dashboard/ ')).toBe('/dashboard')
    expect(normalizarCaminho('/materiais?tab=loja#x')).toBe('/materiais')
    expect(normalizarCaminho('https://evil.example')).toBeNull()
    expect(normalizarCaminho('//evil.example')).toBeNull()
    expect(normalizarCaminho('/<script>')).toBeNull()
  })

  it('"*" engole a lista e duplicatas somem', () => {
    expect(sanitizarPaginas(['/dashboard', '*', '/x'])).toEqual(['*'])
    expect(sanitizarPaginas(['/dashboard', '/dashboard/', 3, 'lixo'])).toEqual(['/dashboard'])
    expect(sanitizarPaginas('nao-e-lista')).toEqual([])
  })
})

describe('mídia do anúncio', () => {
  it('reconhece as proporções de referência', () => {
    expect(rotuloDaProporcao(1920, 1080)).toBe('16:9')
    expect(rotuloDaProporcao(1080, 1350)).toBe('4:5')
    expect(rotuloDaProporcao(1080, 1920)).toBe('9:16')
    expect(rotuloDaProporcao(1600, 400)).toBe('4:1')
    expect(rotuloDaProporcao(1000, 1000)).toBe('1:1')
    expect(rotuloDaProporcao(1420, 1000)).toBe('1,42:1')
  })

  it('valida vídeo com pôster e descarta campos estranhos', () => {
    const midia = sanitizarMidia({
      tipo: 'video',
      url: 'https://x.public.blob.vercel-storage.com/anuncios/videos/a.mp4',
      posterUrl: 'https://x.public.blob.vercel-storage.com/anuncios/a-poster.webp',
      largura: 1080,
      altura: 1920,
      duracao: 15.04,
      bytes: 2_000_000,
      extra: 'ignorado',
    })
    expect(midia).toEqual({
      tipo: 'video',
      url: 'https://x.public.blob.vercel-storage.com/anuncios/videos/a.mp4',
      posterUrl: 'https://x.public.blob.vercel-storage.com/anuncios/a-poster.webp',
      largura: 1080,
      altura: 1920,
      duracao: 15,
      bytes: 2_000_000,
    })
    expect(capaDaMidia(midia)).toContain('poster')
  })

  it('distingue "sem mídia" de "mídia inválida"', () => {
    expect(sanitizarMidia(undefined)).toBeUndefined()
    expect(sanitizarMidia(null)).toBeUndefined()
    expect(sanitizarMidia({ tipo: 'gif', url: '/a.gif', largura: 1, altura: 1 })).toBeNull()
    expect(sanitizarMidia({ tipo: 'imagem', url: 'javascript:alert(1)', largura: 1, altura: 1 })).toBeNull()
    expect(sanitizarMidia({ tipo: 'imagem', url: '/a.webp', largura: 0, altura: 10 })).toBeNull()
  })

  it('formata tamanhos', () => {
    expect(formatarBytes(512 * 1024)).toBe('512 KB')
    expect(formatarBytes(2.5 * 1024 * 1024)).toBe('2,5 MB')
    expect(formatarBytes(0)).toBe('—')
  })
})
