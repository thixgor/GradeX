import { describe, expect, it } from 'vitest'
import type { Exam, Question } from '@/lib/types'
import {
  podeVerGabarito,
  prepararProvaParaEntrega,
  sanitizarProvaParaAluno,
  sanitizarQuestaoParaAluno,
} from '@/lib/provas/sanitizar-prova'

const ALUNO = 'aluno-1'
const AUTOR = 'professor-1'

function questao(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    number: 1,
    type: 'multiple-choice',
    statement: 'Paciente de 54 anos com dispneia progressiva...',
    command: 'Assinale a alternativa correta',
    alternatives: [
      { id: 'a', letter: 'A', text: 'Insuficiência cardíaca', isCorrect: true },
      { id: 'b', letter: 'B', text: 'Asma', isCorrect: false },
      { id: 'c', letter: 'C', text: 'DPOC', isCorrect: false },
    ],
    explanation: 'A resposta é A porque...',
    commentedFeedback: {
      correctAlternative: 'A',
      explanations: { A: 'Correta.', B: 'Incorreta.', C: 'Incorreta.' },
    },
    keyPoints: [{ description: 'citar congestão', weight: 1 }],
    ...overrides,
  } as Question
}

function prova(overrides: Partial<Exam> = {}): Exam {
  return {
    title: 'Prova de Cardiologia',
    numberOfQuestions: 1,
    numberOfAlternatives: 3,
    scoringMethod: 'normal',
    questions: [questao()],
    startTime: new Date('2026-08-01T09:00:00Z'),
    endTime: new Date('2026-08-01T12:00:00Z'),
    createdBy: AUTOR,
    isHidden: false,
    ...overrides,
  } as Exam
}

describe('sanitizarQuestaoParaAluno', () => {
  it('remove todo caminho para a resposta', () => {
    const limpa = sanitizarQuestaoParaAluno(questao())

    expect(limpa.alternatives.every((a) => a.isCorrect === false)).toBe(true)
    expect(limpa.explanation).toBeUndefined()
    expect(limpa.commentedFeedback).toBeUndefined()
    expect((limpa as any).keyPoints).toBeUndefined()
  })

  it('preserva o que o aluno precisa para responder', () => {
    const limpa = sanitizarQuestaoParaAluno(questao())

    expect(limpa.statement).toContain('dispneia progressiva')
    expect(limpa.alternatives).toHaveLength(3)
    expect(limpa.alternatives.map((a) => a.text)).toEqual([
      'Insuficiência cardíaca',
      'Asma',
      'DPOC',
    ])
  })

  it('o gabarito não sobrevive nem serializado', () => {
    const json = JSON.stringify(sanitizarProvaParaAluno(prova()))
    expect(json).not.toContain('"isCorrect":true')
    expect(json).not.toContain('A resposta é A porque')
    expect(json).not.toContain('correctAlternative')
  })
})

describe('podeVerGabarito', () => {
  const durante = new Date('2026-08-01T10:00:00Z')
  const depois = new Date('2026-08-01T13:00:00Z')

  it('nega ao aluno durante uma prova avaliativa', () => {
    expect(
      podeVerGabarito(prova(), { userId: ALUNO, isAdmin: false, agora: durante }),
    ).toBe(false)
  })

  it('libera para o admin', () => {
    expect(
      podeVerGabarito(prova(), { userId: ALUNO, isAdmin: true, agora: durante }),
    ).toBe(true)
  })

  it('libera para quem criou a prova', () => {
    expect(
      podeVerGabarito(prova(), { userId: AUTOR, isAdmin: false, agora: durante }),
    ).toBe(true)
  })

  it('libera em prova de treino e em prova pessoal', () => {
    expect(
      podeVerGabarito(prova({ isPracticeExam: true }), {
        userId: ALUNO, isAdmin: false, agora: durante,
      }),
    ).toBe(true)
    expect(
      podeVerGabarito(prova({ isPersonalExam: true }), {
        userId: ALUNO, isAdmin: false, agora: durante,
      }),
    ).toBe(true)
  })

  it('libera depois de o aluno entregar', () => {
    expect(
      podeVerGabarito(prova(), {
        userId: ALUNO, isAdmin: false, jaSubmeteu: true, agora: durante,
      }),
    ).toBe(true)
  })

  it('libera depois de a prova encerrar', () => {
    expect(
      podeVerGabarito(prova(), { userId: ALUNO, isAdmin: false, agora: depois }),
    ).toBe(true)
  })

  it('respeita o portão de saída quando ele existe', () => {
    const comPortao = prova({ gatesClose: new Date('2026-08-01T14:00:00Z') })

    // Passou do endTime, mas o portão ainda não fechou: segue escondido.
    expect(
      podeVerGabarito(comPortao, { userId: ALUNO, isAdmin: false, agora: depois }),
    ).toBe(false)

    expect(
      podeVerGabarito(comPortao, {
        userId: ALUNO, isAdmin: false, agora: new Date('2026-08-01T15:00:00Z'),
      }),
    ).toBe(true)
  })
})

describe('prepararProvaParaEntrega', () => {
  it('sanitiza para o aluno e entrega inteira para o autor', () => {
    const durante = new Date('2026-08-01T10:00:00Z')

    const paraAluno = prepararProvaParaEntrega(prova(), {
      userId: ALUNO, isAdmin: false, agora: durante,
    })
    expect(paraAluno.questions[0].alternatives.some((a) => a.isCorrect)).toBe(false)

    const paraAutor = prepararProvaParaEntrega(prova(), {
      userId: AUTOR, isAdmin: false, agora: durante,
    })
    expect(paraAutor.questions[0].alternatives.some((a) => a.isCorrect)).toBe(true)
    expect(paraAutor.questions[0].explanation).toBeDefined()
  })

  it('não quebra com prova sem questões', () => {
    expect(() =>
      prepararProvaParaEntrega({ title: 'vazia' } as any, { userId: ALUNO, isAdmin: false }),
    ).not.toThrow()
  })
})
