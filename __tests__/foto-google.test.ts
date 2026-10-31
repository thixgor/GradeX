import { describe, expect, it } from 'vitest'
import { fotoDoGoogleNoTamanho, fotoDoGoogleValida, urlDoRetrato } from '@/lib/foto-google'
import { AVATARES } from '@/lib/monitorias/avatares'

const FOTO = 'https://lh3.googleusercontent.com/a/ACg8ocJabc123=s96-c'

describe('foto do Google', () => {
  it('só aceita https do CDN de fotos do Google', () => {
    expect(fotoDoGoogleValida(FOTO)).toBe(FOTO)
    expect(fotoDoGoogleValida('http://lh3.googleusercontent.com/a/x')).toBeNull()
    expect(fotoDoGoogleValida('https://evil.com/lh3.googleusercontent.com/a')).toBeNull()
    expect(fotoDoGoogleValida('https://googleusercontent.com.evil.com/a')).toBeNull()
    expect(fotoDoGoogleValida('javascript:alert(1)')).toBeNull()
    expect(fotoDoGoogleValida(undefined)).toBeNull()
  })

  it('pede a imagem no tamanho exibido (2x), recortada', () => {
    expect(fotoDoGoogleNoTamanho(FOTO, 36)).toBe('https://lh3.googleusercontent.com/a/ACg8ocJabc123=s72-c')
    expect(fotoDoGoogleNoTamanho('https://lh3.googleusercontent.com/a/ACg8oc', 84)).toBe('https://lh3.googleusercontent.com/a/ACg8oc=s168-c')
    expect(fotoDoGoogleNoTamanho('https://lh3.googleusercontent.com/x/photo.jpg?sz=50', 56)).toBe('https://lh3.googleusercontent.com/x/photo.jpg?sz=112')
  })

  it('retrato da galeria vence a foto do Google; sem nada, null', () => {
    const a = AVATARES[0]
    expect(urlDoRetrato(a.id, FOTO, 36)).toBe(a.url)
    expect(urlDoRetrato(null, FOTO, 36)).toContain('=s72-c')
    expect(urlDoRetrato('inexistente', null, 36)).toBeNull()
  })
})
