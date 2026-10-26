import { describe, expect, it } from 'vitest'
import { medirEntrega } from '@/lib/provas/desempenho-da-entrega'

const QUESTOES = [
  { id: 'q1', type: 'multiple-choice' as const, alternatives: [{ id: 'a', isCorrect: true }, { id: 'b', isCorrect: false }] },
  { id: 'q2', type: 'multiple-choice' as const, alternatives: [{ id: 'a', isCorrect: false }, { id: 'b', isCorrect: true }] },
  { id: 'q3', type: 'discursive' as const },
  { id: 'q4', type: 'essay' as const },
]

describe('medirEntrega', () => {
  it('conta só o que foi respondido e acerta pela alternativa certa', () => {
    const medida = medirEntrega(QUESTOES, [
      { questionId: 'q1', selectedAlternative: 'a' },
      { questionId: 'q2', selectedAlternative: 'a' },
      { questionId: 'q3', discursiveText: 'resposta' },
      { questionId: 'q4', essayText: '' },
    ])
    expect(medida).toEqual({ respondidas: 3, objetivasRespondidas: 2, acertos: 1 })
  })

  it('não conta questão deixada em branco (o rascunho grava a entrada vazia)', () => {
    const medida = medirEntrega(QUESTOES, [
      { questionId: 'q1', selectedAlternative: '' },
      { questionId: 'q2' },
      { questionId: 'q3', discursiveText: '   ' },
    ])
    expect(medida).toEqual({ respondidas: 0, objetivasRespondidas: 0, acertos: 0 })
  })

  it('aceita o sinalizador de texto da projeção e ignora repetidas e questões que saíram da prova', () => {
    const medida = medirEntrega(QUESTOES, [
      { questionId: 'q3', temTexto: true },
      { questionId: 'q1', selectedAlternative: 'a' },
      { questionId: 'q1', selectedAlternative: 'a' },
      { questionId: 'removida', selectedAlternative: 'a' },
    ])
    expect(medida).toEqual({ respondidas: 2, objetivasRespondidas: 1, acertos: 1 })
  })

  it('aguenta prova sem questões ou entrega sem respostas', () => {
    expect(medirEntrega(null, null)).toEqual({ respondidas: 0, objetivasRespondidas: 0, acertos: 0 })
  })
})
