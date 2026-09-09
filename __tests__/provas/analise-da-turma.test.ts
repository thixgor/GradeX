import { describe, expect, it } from 'vitest'
import {
  questaoMaisAcertadaDaTurma,
  questaoMaisErradaDaTurma,
  resumirTurmaPorQuestao,
  type EntregaParaAnalise,
} from '@/lib/provas/analise-da-turma'
import type { Question } from '@/lib/types'

function objetiva(id: string, number: number): Question {
  return {
    id,
    number,
    type: 'multiple-choice',
    statement: `Enunciado ${number}`,
    alternatives: [
      { id: `${id}-a`, letter: 'A', text: 'primeira', isCorrect: true },
      { id: `${id}-b`, letter: 'B', text: 'segunda', isCorrect: false },
      { id: `${id}-c`, letter: 'C', text: 'terceira', isCorrect: false },
    ],
  } as unknown as Question
}

function discursiva(id: string, number: number): Question {
  return {
    id,
    number,
    type: 'discursive',
    statement: `Discursiva ${number}`,
    alternatives: [],
  } as unknown as Question
}

/** Uma entrega que marcou a letra pedida em cada questão. */
function entrega(marcadas: Record<string, string | undefined>): EntregaParaAnalise {
  return {
    answers: Object.entries(marcadas).map(([questionId, selectedAlternative]) => ({
      questionId,
      selectedAlternative,
    })) as EntregaParaAnalise['answers'],
  }
}

describe('resumirTurmaPorQuestao', () => {
  const questoes = [objetiva('q1', 1), objetiva('q2', 2)]

  it('conta acerto sobre quem RESPONDEU, não sobre quem entregou', () => {
    /*
     * Quatro entregas, mas só duas pessoas responderam a q1 — e as duas
     * acertaram. Isso é 100% de acerto com 2 em branco, e não 50%: o
     * percentual descreve a dificuldade da questão, e o "em branco" ao lado
     * conta a adesão a ela. Misturar os dois num número só apaga as duas
     * informações.
     */
    const resumo = resumirTurmaPorQuestao(questoes, [
      entrega({ q1: 'q1-a', q2: 'q2-b' }),
      entrega({ q1: 'q1-a', q2: 'q2-b' }),
      entrega({ q1: undefined, q2: 'q2-a' }),
      entrega({ q1: undefined, q2: 'q2-a' }),
    ])

    const q1 = resumo.questoes[0]
    expect(q1.respondidas).toBe(2)
    expect(q1.acertos).toBe(2)
    expect(q1.percentualDeAcerto).toBe(100)
    expect(q1.emBranco).toBe(2)
  })

  it('conta os erros pela alternativa correta, não pela primeira', () => {
    const resumo = resumirTurmaPorQuestao([objetiva('q1', 1)], [
      entrega({ q1: 'q1-a' }),
      entrega({ q1: 'q1-b' }),
      entrega({ q1: 'q1-c' }),
      entrega({ q1: 'q1-b' }),
    ])
    expect(resumo.questoes[0].acertos).toBe(1)
    expect(resumo.questoes[0].percentualDeAcerto).toBe(25)
  })

  it('discursiva conta quem escreveu, e fica FORA do percentual', () => {
    const resumo = resumirTurmaPorQuestao([discursiva('d1', 1)], [
      { answers: [{ questionId: 'd1', discursiveText: 'uma resposta' }] as any },
      { answers: [{ questionId: 'd1', discursiveText: '   ' }] as any },
      { answers: [{ questionId: 'd1' }] as any },
    ])
    const d = resumo.questoes[0]
    expect(d.respondidas).toBe(1)
    expect(d.emBranco).toBe(2)
    // Não há gabarito automático: um "0% de acerto" aqui seria uma afirmação
    // que ninguém calculou.
    expect(d.percentualDeAcerto).toBeNull()
    expect(d.acertos).toBe(0)
  })

  it('sem entregas, tudo zera sem quebrar', () => {
    const resumo = resumirTurmaPorQuestao(questoes, [])
    expect(resumo.entregas).toBe(0)
    expect(resumo.questoes).toHaveLength(2)
    expect(resumo.questoes[0].percentualDeAcerto).toBeNull()
    expect(resumo.questoes[0].emBranco).toBe(0)
  })

  it('conta objetivas e discursivas separadamente', () => {
    const resumo = resumirTurmaPorQuestao(
      [objetiva('q1', 1), discursiva('d1', 2), objetiva('q2', 3)],
      [],
    )
    expect(resumo.totalDeQuestoes).toBe(3)
    expect(resumo.objetivas).toBe(2)
    expect(resumo.discursivas).toBe(1)
  })

  it('aguenta prova ou entregas ausentes', () => {
    expect(resumirTurmaPorQuestao(null, null).totalDeQuestoes).toBe(0)
    expect(resumirTurmaPorQuestao(undefined, undefined).entregas).toBe(0)
  })
})

describe('as questões em destaque', () => {
  const linhas = [
    { type: 'multiple-choice', number: 1, respondidas: 40, percentualDeAcerto: 90 },
    { type: 'multiple-choice', number: 2, respondidas: 40, percentualDeAcerto: 20 },
    { type: 'multiple-choice', number: 3, respondidas: 3, percentualDeAcerto: 20 },
    { type: 'discursive', number: 4, respondidas: 40, percentualDeAcerto: null },
  ]

  it('a mais errada é a de menor acerto', () => {
    expect(questaoMaisErradaDaTurma(linhas)?.number).toBe(2)
  })

  it('empate desempata pela mais respondida', () => {
    // As questões 2 e 3 empatam em 20%. A que 40 pessoas erraram diz mais
    // sobre a prova do que a que 3 erraram.
    expect(questaoMaisErradaDaTurma(linhas)?.respondidas).toBe(40)
  })

  it('a mais acertada é a de maior acerto', () => {
    expect(questaoMaisAcertadaDaTurma(linhas)?.number).toBe(1)
  })

  it('discursiva nunca entra no ranking — ela não tem acerto calculado', () => {
    const soDiscursivas = [{ type: 'discursive', number: 4, respondidas: 40, percentualDeAcerto: null }]
    expect(questaoMaisErradaDaTurma(soDiscursivas)).toBeNull()
    expect(questaoMaisAcertadaDaTurma(soDiscursivas)).toBeNull()
  })

  it('questão que ninguém respondeu fica de fora', () => {
    const semResposta = [{ type: 'multiple-choice', number: 9, respondidas: 0, percentualDeAcerto: null }]
    expect(questaoMaisErradaDaTurma(semResposta)).toBeNull()
  })

  it('lista vazia ou ausente devolve null em vez de estourar', () => {
    expect(questaoMaisErradaDaTurma([])).toBeNull()
    expect(questaoMaisAcertadaDaTurma(null)).toBeNull()
    expect(questaoMaisErradaDaTurma(undefined)).toBeNull()
  })

  it('o resumo e o ranking se encaixam ponta a ponta', () => {
    const resumo = resumirTurmaPorQuestao(
      [objetiva('q1', 1), objetiva('q2', 2)],
      [
        entrega({ q1: 'q1-a', q2: 'q2-b' }),
        entrega({ q1: 'q1-a', q2: 'q2-b' }),
        entrega({ q1: 'q1-b', q2: 'q2-a' }),
      ],
    )
    // q1: 2 de 3 acertaram (66%). q2: 1 de 3 (33%).
    expect(questaoMaisAcertadaDaTurma(resumo.questoes)?.number).toBe(1)
    expect(questaoMaisErradaDaTurma(resumo.questoes)?.number).toBe(2)
  })
})
