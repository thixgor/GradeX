import { describe, expect, it } from 'vitest'
import { tituloDaCopia } from '@/lib/provas/duplicar-prova'

describe('tituloDaCopia', () => {
  it('a primeira cópia não é numerada', () => {
    expect(tituloDaCopia('Anatomia I', [])).toBe('Cópia de Anatomia I')
  })

  it('a segunda cópia numera o prefixo em vez de empilhá-lo', () => {
    // O empilhamento ("Cópia de Cópia de Anatomia I") cresce pela esquerda, e o
    // que identifica a prova está à direita — justamente o pedaço cortado
    // quando o título estoura o limite.
    expect(tituloDaCopia('Anatomia I', ['Cópia de Anatomia I'])).toBe('Cópia 2 de Anatomia I')
    expect(
      tituloDaCopia('Anatomia I', ['Cópia de Anatomia I', 'Cópia 2 de Anatomia I']),
    ).toBe('Cópia 3 de Anatomia I')
  })

  it('duplicar uma cópia volta ao nome original', () => {
    expect(tituloDaCopia('Cópia de Anatomia I', ['Cópia de Anatomia I'])).toBe('Cópia 2 de Anatomia I')
    expect(
      tituloDaCopia('Cópia 3 de Anatomia I', ['Cópia de Anatomia I']),
    ).toBe('Cópia 2 de Anatomia I')
  })

  it('respeita o teto de 150 caracteres do título', () => {
    const longo = 'A'.repeat(200)
    const titulo = tituloDaCopia(longo, [])
    expect(titulo.length).toBeLessThanOrEqual(150)
    expect(titulo.startsWith('Cópia de ')).toBe(true)
  })

  it('num nome longo, cópias diferentes não colidem', () => {
    const longo = 'B'.repeat(200)
    const primeira = tituloDaCopia(longo, [])
    const segunda = tituloDaCopia(longo, [primeira])
    expect(segunda).not.toBe(primeira)
    expect(segunda.length).toBeLessThanOrEqual(150)
  })
})
