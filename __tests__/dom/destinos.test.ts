import { describe, expect, it } from 'vitest'
import { candidatosDeDestino, hrefInternoSeguro } from '@/lib/dom/destinos'

const gratuito = { accountType: 'gratuito', isAdmin: false }
const primeiro = (frase: string, p = gratuito) => candidatosDeDestino(frase, p)[0]

describe('candidatosDeDestino', () => {
  it.each([
    ['Quero mudar a minha senha', '/profile?campo=senha'],
    ['Quero fazer provas', '/provas'],
    ['quero um simulado de cardio', '/provas'],
    ['quero estudar pros apgs', '/apg'],
    ['quero ver o cronograma da faculdade', '/cronogramas'],
    ['quero estudar anatomia', '/anatomia'],
    ['quero assinar o plano plus', '/buy'],
    ['qual minha posição no ranking?', '/ranking'],
  ])('"%s" → %s', (frase, href) => {
    expect(candidatosDeDestino(frase, gratuito).map((c) => c.href)).toContain(href)
    expect(primeiro(frase)?.href).toBe(href)
  })

  it('flashcards com IA aparecem e são exclusivos para quem não paga', () => {
    const c = candidatosDeDestino('quero fazer flashcards com ia', gratuito).find((d) => d.href === '/flashcards/ia')
    expect(c?.exclusivo).toBe(true)
    const pago = candidatosDeDestino('quero fazer flashcards com ia', { accountType: 'quest', isAdmin: false }).find((d) => d.href === '/flashcards/ia')
    expect(pago?.exclusivo).toBe(false)
  })

  it('não oferece páginas do admin para quem não é admin', () => {
    expect(candidatosDeDestino('painel de usuários admin', gratuito).some((c) => c.href.startsWith('/admin'))).toBe(false)
  })

  it('frase sem nada navegável não devolve destino', () => {
    expect(candidatosDeDestino('oi tudo bem?', gratuito)).toEqual([])
  })
})

describe('hrefInternoSeguro', () => {
  it('aceita só caminho interno', () => {
    expect(hrefInternoSeguro('/provas')).toBe('/provas')
    expect(hrefInternoSeguro('//evil.com')).toBeNull()
    expect(hrefInternoSeguro('https://evil.com')).toBeNull()
    expect(hrefInternoSeguro('javascript:alert(1)')).toBeNull()
    expect(hrefInternoSeguro('/a/../b')).toBeNull()
  })
})
