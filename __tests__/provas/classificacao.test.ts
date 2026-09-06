import { describe, expect, it } from 'vitest'
import { mostraClassificacao, posicaoNaTurma, resumirTurma } from '@/lib/provas/classificacao'
import { descreverReset, type ContagemDoReset } from '@/lib/provas/reset-da-prova'

describe('mostraClassificacao', () => {
  it('ausente = visível — o documento antigo não perde o ranking sozinho', () => {
    expect(mostraClassificacao({}, false)).toBe(true)
    expect(mostraClassificacao({ showRanking: undefined }, false)).toBe(true)
    expect(mostraClassificacao(null, false)).toBe(true)
  })

  it('só `false` esconde', () => {
    expect(mostraClassificacao({ showRanking: false }, false)).toBe(false)
    expect(mostraClassificacao({ showRanking: true }, false)).toBe(true)
  })

  it('o admin vê sempre — é ele quem desligou', () => {
    expect(mostraClassificacao({ showRanking: false }, true)).toBe(true)
  })
})

describe('resumirTurma', () => {
  it('sem entregas não há resumo', () => {
    expect(resumirTurma([], 100)).toBeNull()
  })

  it('média, extremos e distribuição por faixa', () => {
    const resumo = resumirTurma([10, 50, 90, 70], 100)!
    expect(resumo.participantes).toBe(4)
    expect(resumo.media).toBe(55)
    expect(resumo.maior).toBe(90)
    expect(resumo.menor).toBe(10)
    expect(resumo.distribuicao.map((f) => f.quantidade)).toEqual([1, 0, 1, 1, 1])
  })

  it('a nota máxima entra na faixa de cima, não fora dela', () => {
    const resumo = resumirTurma([100], 100)!
    expect(resumo.distribuicao[4].quantidade).toBe(1)
  })

  it('nota máxima zero não divide por zero', () => {
    const resumo = resumirTurma([0, 0], 0)!
    expect(resumo.distribuicao[0].quantidade).toBe(2)
    expect(resumo.media).toBe(0)
  })
})

describe('posicaoNaTurma', () => {
  it('empate divide a mesma colocação', () => {
    const notas = [90, 90, 70]
    expect(posicaoNaTurma(notas, 90).posicao).toBe(1)
    expect(posicaoNaTurma(notas, 70).posicao).toBe(3)
  })

  it('percentil de quem lidera e de quem fecha', () => {
    const notas = [100, 80, 60, 40, 20]
    expect(posicaoNaTurma(notas, 100).percentil).toBe(100)
    expect(posicaoNaTurma(notas, 20).percentil).toBe(0)
  })

  it('uma entrega só não divide por zero', () => {
    expect(posicaoNaTurma([70], 70)).toEqual({ posicao: 1, percentil: 0 })
  })
})

describe('descreverReset', () => {
  const vazia: ContagemDoReset = {
    submissoes: 0,
    rascunhos: 0,
    tentativas: 0,
    anotacoes: 0,
    relatosDeQuestao: 0,
    entradas: 0,
  }

  it('prova já limpa não vira uma lista de zeros', () => {
    expect(descreverReset(vazia)).toMatch(/já estava zerada/)
  })

  it('só enumera o que teve contagem', () => {
    const frase = descreverReset({ ...vazia, submissoes: 3 })
    expect(frase).toContain('3 entregas')
    expect(frase).not.toContain('anotaç')
  })

  it('singular e plural, com "e" antes do último', () => {
    const frase = descreverReset({ ...vazia, submissoes: 1, rascunhos: 2, anotacoes: 5 })
    expect(frase).toContain('1 entrega')
    expect(frase).toContain('2 rascunhos')
    expect(frase).toContain('e 5 anotações')
  })
})
