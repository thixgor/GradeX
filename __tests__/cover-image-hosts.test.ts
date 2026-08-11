import { describe, it, expect } from 'vitest'
import {
  OPTIMIZABLE_HOSTS,
  OPTIMIZABLE_HOST_SUFFIXES,
  canUseNextImage,
  normalizeCoverSrc,
} from '@/lib/cover-image-src'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nextConfig = require('../next.config.js')

/**
 * `lib/cover-image-src.ts` decide quais capas podem ir para `/_next/image`, e
 * `next.config.js` decide quais o otimizador aceita. Se a primeira lista
 * crescer sem a segunda, `next/image` lança em tempo de render — não é imagem
 * quebrada, é a página inteira em branco. Este teste fecha essa porta.
 */
describe('hosts de capa liberados no otimizador', () => {
  const patterns: Array<{ protocol?: string; hostname: string }> =
    nextConfig.images?.remotePatterns ?? []

  function configPermite(hostname: string): boolean {
    return patterns.some((p) => {
      if (p.protocol && p.protocol !== 'https') return false
      // `remotePatterns` aceita `*` (um nível) e `**` (vários) no hostname.
      const regex = new RegExp(
        '^' +
          p.hostname
            .split('.')
            .map((part) => (part === '**' ? '.+' : part === '*' ? '[^.]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
            .join('\\.') +
          '$',
      )
      return regex.test(hostname)
    })
  }

  it('todo host exato da lista está em remotePatterns', () => {
    const foraDoConfig = OPTIMIZABLE_HOSTS.filter((host) => !configPermite(host))

    expect(foraDoConfig).toEqual([])
  })

  it('todo sufixo da lista está em remotePatterns', () => {
    const foraDoConfig = OPTIMIZABLE_HOST_SUFFIXES.filter(
      (suffix) => !configPermite(`exemplo${suffix}`),
    )

    expect(foraDoConfig).toEqual([])
  })
})

describe('canUseNextImage', () => {
  it('aceita caminho local', () => {
    expect(canUseNextImage('/uploads/123-abc.png')).toBe(true)
    expect(canUseNextImage('/img/logo.png')).toBe(true)
  })

  it('aceita os hosts liberados', () => {
    expect(canUseNextImage('https://i.imgur.com/abc123.png')).toBe(true)
    expect(canUseNextImage('https://loja.public.blob.vercel-storage.com/capa.jpg')).toBe(true)
  })

  it('recusa host de fora — passar isso ao next/image derrubaria o render', () => {
    expect(canUseNextImage('https://imgur.com/abc123')).toBe(false)
    expect(canUseNextImage('https://exemplo.com/capa.jpg')).toBe(false)
    // `//host/x` é protocol-relative, não caminho local.
    expect(canUseNextImage('//exemplo.com/capa.jpg')).toBe(false)
  })

  it('recusa entrada que não é URL', () => {
    expect(canUseNextImage('')).toBe(false)
    expect(canUseNextImage('capa.jpg')).toBe(false)
    expect(canUseNextImage('javascript:alert(1)')).toBe(false)
    expect(canUseNextImage('data:image/png;base64,iVBORw0KGgo=')).toBe(false)
  })
})

describe('normalizeCoverSrc', () => {
  it('promove http para https nos hosts conhecidos', () => {
    expect(normalizeCoverSrc('http://i.imgur.com/abc123.png')).toBe('https://i.imgur.com/abc123.png')
  })

  it('não mexe em host desconhecido nem em localhost', () => {
    expect(normalizeCoverSrc('http://exemplo.com/capa.jpg')).toBe('http://exemplo.com/capa.jpg')
    expect(normalizeCoverSrc('http://localhost:3000/capa.jpg')).toBe('http://localhost:3000/capa.jpg')
  })

  it('deixa https e caminho local intactos', () => {
    expect(normalizeCoverSrc('https://i.imgur.com/abc123.png')).toBe('https://i.imgur.com/abc123.png')
    expect(normalizeCoverSrc('/uploads/capa.png')).toBe('/uploads/capa.png')
  })
})
