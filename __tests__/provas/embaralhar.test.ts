import { describe, expect, it } from 'vitest'
import {
  aplicarOrdemDaSubmissao,
  montarProvaParaAluno,
  sementeDaProva,
} from '@/lib/provas/embaralhar'
import type { Question } from '@/lib/types'

function questao(id: string, numero: number): Question {
  return {
    id,
    number: numero,
    type: 'multiple-choice',
    statement: `enunciado ${id}`,
    command: '',
    alternatives: ['a', 'b', 'c', 'd', 'e'].map((sufixo, i) => ({
      id: `${id}-${sufixo}`,
      letter: String.fromCharCode(65 + i),
      text: `alternativa ${sufixo}`,
      isCorrect: sufixo === 'c',
    })),
  } as Question
}

const QUESTOES = Array.from({ length: 12 }, (_, i) => questao(`q${i + 1}`, i + 1))

describe('montarProvaParaAluno', () => {
  it('é determinístico: a mesma semente devolve a mesma ordem', () => {
    const semente = sementeDaProva('prova1', 'aluno1')
    const a = montarProvaParaAluno(QUESTOES, semente, { embaralharQuestoes: true })
    const b = montarProvaParaAluno(QUESTOES, semente, { embaralharQuestoes: true })
    expect(a.ordem).toEqual(b.ordem)
  })

  it('dá ordens diferentes para alunos diferentes', () => {
    const a = montarProvaParaAluno(QUESTOES, sementeDaProva('prova1', 'aluno1'), { embaralharQuestoes: true })
    const b = montarProvaParaAluno(QUESTOES, sementeDaProva('prova1', 'aluno2'), { embaralharQuestoes: true })
    expect(a.ordem).not.toEqual(b.ordem)
  })

  it('embaralha sem perder nem duplicar questão', () => {
    const { questions, ordem } = montarProvaParaAluno(QUESTOES, 'x', { embaralharQuestoes: true })
    expect(questions).toHaveLength(QUESTOES.length)
    expect(new Set(ordem).size).toBe(QUESTOES.length)
    expect([...ordem].sort()).toEqual(QUESTOES.map((q) => q.id).sort())
  })

  it('renumera de 1 a n na ordem em que o aluno vê', () => {
    const { questions } = montarProvaParaAluno(QUESTOES, 'x', { embaralharQuestoes: true })
    expect(questions.map((q) => q.number)).toEqual(QUESTOES.map((_, i) => i + 1))
  })

  it('sem embaralhar, mantém a ordem original', () => {
    const { questions, ordem } = montarProvaParaAluno(QUESTOES, 'x', {})
    expect(ordem).toEqual(QUESTOES.map((q) => q.id))
    expect(questions.map((q) => q.number)).toEqual(QUESTOES.map((_, i) => i + 1))
  })

  it('embaralhar alternativas preserva o id e reatribui a letra por posição', () => {
    const { questions } = montarProvaParaAluno(QUESTOES, 'aluno-x', { embaralharAlternativas: true })
    for (const q of questions) {
      const original = QUESTOES.find((o) => o.id === q.id)!
      expect(q.alternatives.map((a) => a.id).sort()).toEqual(
        original.alternatives.map((a) => a.id).sort(),
      )
      expect(q.alternatives.map((a) => a.letter)).toEqual(['A', 'B', 'C', 'D', 'E'])
    }
  })

  it('a alternativa correta continua sendo a mesma depois de embaralhada', () => {
    const { questions } = montarProvaParaAluno(QUESTOES, 'aluno-x', { embaralharAlternativas: true })
    for (const q of questions) {
      const corretas = q.alternatives.filter((a) => a.isCorrect)
      expect(corretas).toHaveLength(1)
      expect(corretas[0].id).toBe(`${q.id}-c`)
    }
  })

  it('ligar alternativas não muda a ordem das questões', () => {
    const semente = sementeDaProva('prova1', 'aluno1')
    const so = montarProvaParaAluno(QUESTOES, semente, { embaralharQuestoes: true })
    const ambos = montarProvaParaAluno(QUESTOES, semente, {
      embaralharQuestoes: true,
      embaralharAlternativas: true,
    })
    expect(ambos.ordem).toEqual(so.ordem)
  })

  it('alternativas de fato mudam de posição para a maioria das questões', () => {
    const { questions } = montarProvaParaAluno(QUESTOES, 'semente-fixa', { embaralharAlternativas: true })
    const mudaram = questions.filter((q) => {
      const original = QUESTOES.find((o) => o.id === q.id)!
      return q.alternatives.some((alt, i) => alt.id !== original.alternatives[i].id)
    })
    expect(mudaram.length).toBeGreaterThan(QUESTOES.length / 2)
  })

  it('aguenta prova vazia', () => {
    expect(montarProvaParaAluno([], 'x', { embaralharQuestoes: true })).toEqual({ questions: [], ordem: [] })
  })
})

describe('aplicarOrdemDaSubmissao', () => {
  it('remonta a prova na ordem que o aluno viu', () => {
    const { ordem } = montarProvaParaAluno(QUESTOES, 'aluno-y', { embaralharQuestoes: true })
    const remontada = aplicarOrdemDaSubmissao(QUESTOES, ordem)
    expect(remontada.map((q) => q.id)).toEqual(ordem)
    expect(remontada.map((q) => q.number)).toEqual(ordem.map((_, i) => i + 1))
  })

  it('sem ordem gravada, devolve a prova como está', () => {
    expect(aplicarOrdemDaSubmissao(QUESTOES, null).map((q) => q.id)).toEqual(QUESTOES.map((q) => q.id))
  })

  it('questão adicionada depois da entrega vai para o fim, sem sumir', () => {
    const nova = questao('q99', 99)
    const remontada = aplicarOrdemDaSubmissao([...QUESTOES, nova], QUESTOES.map((q) => q.id))
    expect(remontada).toHaveLength(13)
    expect(remontada[12].id).toBe('q99')
    expect(remontada[12].number).toBe(13)
  })

  it('ignora id que não existe mais na prova', () => {
    const remontada = aplicarOrdemDaSubmissao(QUESTOES, ['q3', 'apagada', 'q1'])
    expect(remontada.slice(0, 2).map((q) => q.id)).toEqual(['q3', 'q1'])
    expect(remontada).toHaveLength(QUESTOES.length)
  })
})
