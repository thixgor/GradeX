import { describe, expect, it } from 'vitest'
import { domOcultoAqui, secaoDaRota } from '@/components/dom/secoes'

describe('onde o Dom pode ser escondido', () => {
  it.each([
    ['/materiais/abc/viewer', false, 'leitor'],
    ['/qualquer', true, 'leitor'],
    ['/materiais', false, 'vitrines'],
    ['/buy', false, 'vitrines'],
    ['/banco-questoes/historico', false, 'questoes'],
    ['/flashcards/ia', false, 'flashcards'],
    ['/manual-clinico/histologia', false, 'manual'],
    ['/dashboard', false, 'outras'],
  ] as const)('%s → %s', (rota, leitor, secao) => {
    expect(secaoDaRota(rota, leitor)).toBe(secao)
  })
  it('esconder no leitor não esconde no resto; "tudo" esconde em todo lugar', () => {
    expect(domOcultoAqui(['leitor'], '/materiais/x/viewer', true)).toBe(true)
    expect(domOcultoAqui(['leitor'], '/dashboard', false)).toBe(false)
    expect(domOcultoAqui(['tudo'], '/dashboard', false)).toBe(true)
  })
})
