import { describe, expect, it } from 'vitest'
import { domOcultoAqui, rotaDeResolucao, rotaSemDom, secaoDaRota } from '@/components/dom/secoes'

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

describe('onde o Dom aparece', () => {
  it('provas, simulados e o Banco de Questões têm o Dom; login e checkout não', () => {
    expect(rotaSemDom('/exam/abc')).toBe(false)
    expect(rotaSemDom('/banco-questoes/123')).toBe(false)
    expect(rotaSemDom('/banco-questoes/listas/xyz')).toBe(false)
    expect(rotaSemDom('/auth/login')).toBe(true)
    expect(rotaSemDom('/buy/checkout')).toBe(true)
  })
  it('telas de resolução sobem o botão acima da barra de ações', () => {
    expect(rotaDeResolucao('/exam/abc')).toBe(true)
    expect(rotaDeResolucao('/banco-questoes/123')).toBe(true)
    expect(rotaDeResolucao('/banco-questoes/listas/xyz')).toBe(true)
    expect(rotaDeResolucao('/banco-questoes/listas')).toBe(false)
    expect(rotaDeResolucao('/banco-questoes/historico')).toBe(false)
    expect(rotaDeResolucao('/exam/abc/results')).toBe(false)
    expect(rotaDeResolucao('/dashboard')).toBe(false)
  })
})
