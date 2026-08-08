import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { traduzirTermo } from '@/lib/histologia/glossario'
import {
  ALTERNATIVAS,
  ENUNCIADOS,
  FEEDBACKS,
  traduzirAlternativa,
  traduzirEnunciado,
  traduzirFeedback,
  traduzirQuiz,
} from '@/lib/histologia/quiz-textos'

const DIR = path.resolve(__dirname, '../../data/histologia/quizzes')

interface Alternativa {
  texto: string
  feedback: string
}
interface Questao {
  enunciado: string
  enunciadoOriginal: string
  alternativas: Alternativa[]
}

function todosOsQuizzes() {
  return readdirSync(DIR).map(
    (arquivo) => JSON.parse(readFileSync(path.join(DIR, arquivo), 'utf8')) as { questoes: Questao[] },
  )
}

function textos() {
  const enunciados = new Set<string>()
  const alternativas = new Set<string>()
  const feedbacks = new Set<string>()
  for (const quiz of todosOsQuizzes()) {
    for (const questao of quiz.questoes) {
      enunciados.add(questao.enunciadoOriginal || questao.enunciado)
      for (const alternativa of questao.alternativas) {
        alternativas.add(alternativa.texto)
        if (alternativa.feedback) feedbacks.add(alternativa.feedback)
      }
    }
  }
  return { enunciados, alternativas, feedbacks }
}

describe('tradução dos quizzes', () => {
  it('todo enunciado do acervo tem tradução escrita', () => {
    const semTraducao = [...textos().enunciados].filter((e) => !traduzirEnunciado(e))
    expect(semTraducao, `enunciados em inglês: ${semTraducao.slice(0, 5).join(' | ')}`).toEqual([])
  })

  it('toda alternativa do acervo tem tradução escrita', () => {
    // Alternativa é a resposta: deixá-la em inglês não é uma pendência
    // cosmética, é pedir que o aluno escolha entre termos que ele não leu.
    const semTraducao = [...textos().alternativas].filter(
      (a) => !traduzirAlternativa(a, traduzirTermo),
    )
    expect(semTraducao, `alternativas em inglês: ${semTraducao.slice(0, 5).join(' | ')}`).toEqual([])
  })

  it('nenhuma chave do dicionário aponta para texto que não existe no acervo', () => {
    const { enunciados, alternativas, feedbacks } = textos()
    const normalizar = (s: string) =>
      s.trim().replace(/\s+/g, ' ').replace(/[‘’]/g, "'").toLowerCase()
    const presentes = {
      enunciados: new Set([...enunciados].map(normalizar)),
      alternativas: new Set([...alternativas].map(normalizar)),
      feedbacks: new Set([...feedbacks].map(normalizar)),
    }
    for (const chave of Object.keys(ENUNCIADOS)) {
      expect(presentes.enunciados.has(chave), `enunciado inexistente: "${chave}"`).toBe(true)
    }
    for (const chave of Object.keys(ALTERNATIVAS)) {
      expect(presentes.alternativas.has(chave), `alternativa inexistente: "${chave}"`).toBe(true)
    }
    for (const chave of Object.keys(FEEDBACKS)) {
      expect(presentes.feedbacks.has(chave), `devolutiva inexistente: "${chave}"`).toBe(true)
    }
  })

  it('nenhuma tradução escrita deixa marcas do inglês', () => {
    // Fronteira consciente de Unicode: `\b` do JavaScript é ASCII, então o "é"
    // de "anéis" contaria como separador e faria "is" casar dentro da palavra.
    const suspeitas = /(?<!\p{L})(the|and|of|with|that|which|are|is|from)(?!\p{L})/iu
    for (const [chave, valor] of Object.entries({ ...ENUNCIADOS, ...FEEDBACKS })) {
      expect(suspeitas.test(valor), `tradução com resíduo em inglês: "${chave}"`).toBe(false)
    }
  })

  it('a devolutiva certa não pode vir marcada como genérica de erro', () => {
    // Traduzir "CORRECT..." como "Não é essa" inverteria o sentido da questão.
    for (const [chave, valor] of Object.entries(FEEDBACKS)) {
      if (!chave.startsWith('correct')) continue
      expect(valor.toLowerCase().startsWith('não é essa'), `devolutiva invertida: "${chave}"`).toBe(
        false,
      )
    }
  })

  it('a devolutiva genérica de erro é traduzida nas duas grafias do acervo', () => {
    expect(traduzirFeedback('Incorrect, try again.')).toBe('Não é essa. Tente de novo.')
    expect(traduzirFeedback('Incorrect, try again')).toBe('Não é essa. Tente de novo.')
  })

  it('traduzirQuiz preserva o original e marca o que segue em inglês', () => {
    const quiz = {
      slug: 'x',
      titulo: 'X',
      tituloOriginal: 'X',
      idOrigem: 0,
      idH5p: '',
      percentualAprovacao: 70,
      proveniencia: {},
      revisao: {},
      questoes: [
        {
          id: 'q1',
          numero: 1,
          enunciado: 'Identify the structure indicated by the arrows.',
          enunciadoOriginal: 'Identify the structure indicated by the arrows.',
          midia: null,
          multipla: false,
          alternativas: [
            { id: 'a1', texto: 'Osteoblast', correta: true, feedback: 'Uma frase que ninguém escreveu.' },
            { id: 'a2', texto: 'Osteocyte', correta: false, feedback: 'Incorrect, try again.' },
          ],
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const traduzido = traduzirQuiz(quiz, traduzirTermo)
    const questao = traduzido.questoes[0]

    expect(questao.enunciado).toBe('Identifique a estrutura indicada pelas setas.')
    expect(questao.enunciadoOriginal).toBe('Identify the structure indicated by the arrows.')
    expect(questao.enunciadoPendente).toBe(false)

    expect(questao.alternativas[0].texto).toBe('Osteoblasto')
    expect(questao.alternativas[0].textoOriginal).toBe('Osteoblast')
    expect(questao.alternativas[0].textoPendente).toBe(false)
    // Devolutiva sem tradução escrita: o texto original permanece, marcado.
    expect(questao.alternativas[0].feedbackPendente).toBe(true)

    expect(questao.alternativas[1].feedback).toBe('Não é essa. Tente de novo.')
    expect(questao.alternativas[1].feedbackPendente).toBe(false)
  })
})
