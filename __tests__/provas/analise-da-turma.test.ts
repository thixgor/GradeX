import { describe, expect, it } from 'vitest'
import {
  analiseParaOAluno,
  questaoMaisAcertadaDaTurma,
  questaoMaisErradaDaTurma,
  resumirTurmaPorQuestao,
  type EntregaParaAnalise,
} from '@/lib/provas/analise-da-turma'
import { estatisticasParaOAluno, resumirTurma } from '@/lib/provas/classificacao'
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

describe('o que o aluno recebe — nenhuma contagem de pessoas', () => {
  const questoes = [objetiva('q1', 1), objetiva('q2', 2), discursiva('d1', 3)]
  const entregas = [
    entrega({ q1: 'q1-a', q2: 'q2-b' }),
    entrega({ q1: 'q1-a', q2: 'q2-b' }),
    entrega({ q1: 'q1-b', q2: 'q2-a' }),
  ]

  it('não vaza quantas pessoas fizeram a prova, por caminho nenhum', () => {
    const publico = analiseParaOAluno(resumirTurmaPorQuestao(questoes, entregas))!

    // O objeto inteiro, serializado: nenhuma chave de contagem sobrevive.
    const serializado = JSON.stringify(publico)
    expect(serializado).not.toContain('entregas')
    expect(serializado).not.toContain('respondidas')
    expect(serializado).not.toContain('acertos')
    expect(serializado).not.toContain('emBranco')

    for (const q of publico.questoes) {
      expect(Object.keys(q).sort()).toEqual(
        ['number', 'percentualDeAcerto', 'questionId', 'type'].sort(),
      )
    }
  })

  it('o percentual de acerto continua inteiro — é o que o aluno veio ver', () => {
    const publico = analiseParaOAluno(resumirTurmaPorQuestao(questoes, entregas))!
    // q1: 2 de 3 acertaram; q2: 1 de 3.
    expect(publico.questoes[0].percentualDeAcerto).toBeCloseTo(66.666, 2)
    expect(publico.questoes[1].percentualDeAcerto).toBeCloseTo(33.333, 2)
  })

  it('diz QUE houve entregas, sem dizer quantas', () => {
    const comEntregas = analiseParaOAluno(resumirTurmaPorQuestao(questoes, entregas))!
    const semEntregas = analiseParaOAluno(resumirTurmaPorQuestao(questoes, []))!
    expect(comEntregas.temEntregas).toBe(true)
    expect(semEntregas.temEntregas).toBe(false)
  })

  it('o destaque vem pronto, porque o desempate usa um número que não viaja', () => {
    const publico = analiseParaOAluno(resumirTurmaPorQuestao(questoes, entregas))!
    expect(publico.maisAcertada).toEqual({ number: 1, percentualDeAcerto: expect.any(Number) })
    expect(publico.maisErrada?.number).toBe(2)
    // E o destaque também não carrega contagem nenhuma.
    expect(Object.keys(publico.maisErrada!).sort()).toEqual(['number', 'percentualDeAcerto'])
  })

  it('a contagem de QUESTÕES fica — ela é da prova, não da turma', () => {
    const publico = analiseParaOAluno(resumirTurmaPorQuestao(questoes, entregas))!
    expect(publico.totalDeQuestoes).toBe(3)
    expect(publico.objetivas).toBe(2)
    expect(publico.discursivas).toBe(1)
  })

  it('sem análise nenhuma devolve null em vez de estourar', () => {
    expect(analiseParaOAluno(null)).toBeNull()
    expect(analiseParaOAluno(undefined)).toBeNull()
  })
})

describe('o resumo de notas do aluno — sem participantes', () => {
  const resumo = resumirTurma([90, 70, 70, 30], 100)

  it('participantes e as quantidades por faixa não saem', () => {
    const publico = estatisticasParaOAluno(resumo)!
    const serializado = JSON.stringify(publico)
    expect(serializado).not.toContain('participantes')
    expect(serializado).not.toContain('quantidade')
    expect(Object.keys(publico).sort()).toEqual(['distribuicao', 'maior', 'media', 'menor'])
  })

  it('a distribuição vira proporção, e a forma do gráfico é a mesma', () => {
    const publico = estatisticasParaOAluno(resumo)!
    // 4 notas: uma em 20–40%, duas em 60–80%, uma em 80–100%.
    const porFaixa = Object.fromEntries(publico.distribuicao.map((f) => [f.rotulo, f.proporcao]))
    expect(porFaixa['20–40%']).toBe(25)
    expect(porFaixa['60–80%']).toBe(50)
    expect(porFaixa['80–100%']).toBe(25)
    expect(porFaixa['0–20%']).toBe(0)
  })

  it('média, maior e menor ficam — descrevem a prova, não o tamanho da turma', () => {
    const publico = estatisticasParaOAluno(resumo)!
    expect(publico.media).toBe(65)
    expect(publico.maior).toBe(90)
    expect(publico.menor).toBe(30)
  })

  it('sem notas devolve null', () => {
    expect(estatisticasParaOAluno(resumirTurma([], 100))).toBeNull()
    expect(estatisticasParaOAluno(null)).toBeNull()
  })
})
