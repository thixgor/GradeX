import { describe, expect, it } from 'vitest'

import type { Quiz } from '@/lib/histologia/esquemas'
import {
  alternativasParaCliente,
  calcularResultado,
  gerarSemente,
  prepararQuiz,
  questaoCorreta,
  quizParaCliente,
  responder,
  respondida,
} from '@/lib/histologia/quiz-engine'
import { embaralharComSemente, semented } from '@/lib/histologia/texto'

const QUIZ: Quiz = {
  slug: 'osso',
  titulo: 'Osso',
  tituloOriginal: 'Bone quiz',
  idOrigem: 21102,
  idH5p: '37',
  percentualAprovacao: 50,
  proveniencia: {
    urlOrigem: 'https://digitalhistology.org/quizzes/bone/',
    acessadoEm: '2026-08-07',
    idOrigem: 21102,
    arquivoOrigem: '05_quizzes/01_osso/quiz.json',
    licenca: 'CC BY-NC-SA 4.0',
  },
  revisao: { estado: 'pendente-de-revisao', historico: [] },
  questoes: [
    {
      id: 'q1',
      numero: 1,
      enunciado: 'Identifique a estrutura indicada.',
      enunciadoOriginal: 'Identify the structure indicated.',
      midia: null,
      multipla: false,
      alternativas: [
        { id: 'a1', texto: 'Linha cementante', correta: true, feedback: 'Correto.' },
        { id: 'a2', texto: 'Osteoide', correta: false, feedback: 'Incorreto.' },
        { id: 'a3', texto: 'Lamela', correta: false, feedback: 'Incorreto.' },
      ],
    },
    {
      id: 'q2',
      numero: 2,
      enunciado: 'Quais se aplicam?',
      enunciadoOriginal: 'Which apply?',
      midia: null,
      multipla: true,
      alternativas: [
        { id: 'a1', texto: 'Osso esponjoso', correta: true, feedback: 'Correto.' },
        { id: 'a2', texto: 'Osso lamelar', correta: true, feedback: 'Correto.' },
        { id: 'a3', texto: 'Cartilagem', correta: false, feedback: 'Incorreto.' },
      ],
    },
    {
      id: 'q3',
      numero: 3,
      enunciado: 'Classifique o tecido.',
      enunciadoOriginal: 'Classify the tissue.',
      midia: null,
      multipla: false,
      alternativas: [
        { id: 'a1', texto: 'Osso compacto', correta: true, feedback: 'Correto.' },
        { id: 'a2', texto: 'Osso esponjoso', correta: false, feedback: 'Incorreto.' },
      ],
    },
  ],
}

describe('determinismo da semente', () => {
  /**
   * A propriedade que sustenta a retomada: fechar a aba no meio da prova e
   * voltar precisa devolver *a mesma* prova, com as alternativas nas mesmas
   * posições. Com `Math.random()` a retomada seria incoerente e o resultado
   * irreprodutível numa contestação.
   */
  it('a mesma semente produz sempre a mesma ordem', () => {
    const semente = gerarSemente('osso', 1)
    const a = prepararQuiz(QUIZ, 'prova', semente)
    const b = prepararQuiz(QUIZ, 'prova', semente)
    expect(a.questoes.map((q) => q.id)).toEqual(b.questoes.map((q) => q.id))
    expect(a.questoes.map((q) => q.ordem)).toEqual(b.questoes.map((q) => q.ordem))
  })

  it('tentativas diferentes geram ordens diferentes', () => {
    expect(gerarSemente('osso', 1)).not.toBe(gerarSemente('osso', 2))
  })

  it('quizzes diferentes não compartilham semente', () => {
    expect(gerarSemente('osso', 1)).not.toBe(gerarSemente('pele', 1))
  })

  it('cada questão é embaralhada de forma independente', () => {
    /*
     * Embaralhar todas as questões com a mesma semente daria a mesma permutação
     * em todas elas — e a alternativa correta cairia sempre na mesma posição,
     * que é o vazamento que este teste existe para impedir.
     *
     * Com 3 alternativas há só 6 permutações, então duas questões coincidirem
     * numa tentativa isolada é normal (~17%) e não prova nada. O sinal está na
     * distribuição: ao longo de 60 tentativas, questões independentes divergem
     * na maioria das vezes; questões acopladas coincidiriam em 100% delas.
     */
    let divergiram = 0
    const tentativas = 60
    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
      const estado = prepararQuiz(QUIZ, 'prova', gerarSemente('osso', tentativa))
      const [primeira, segunda] = estado.questoes
      if (primeira.ordem.join() !== segunda.ordem.join()) divergiram++
    }
    // Independência perfeita daria ~5/6 (83%). Exigimos folga generosa para o
    // teste não ficar refém do gerador, mas o acoplamento daria exatamente 0.
    expect(divergiram).toBeGreaterThan(tentativas * 0.5)
  })

  it('o embaralhamento não muta a entrada nem perde itens', () => {
    const original = ['a', 'b', 'c', 'd', 'e']
    const copia = [...original]
    const saida = embaralharComSemente(original, semented('x'))
    expect(original).toEqual(copia)
    expect([...saida].sort()).toEqual([...original].sort())
  })
})

describe('modos', () => {
  it('prática preserva a ordem do catálogo', () => {
    const estado = prepararQuiz(QUIZ, 'pratica', gerarSemente('osso', 1))
    expect(estado.questoes.map((q) => q.id)).toEqual(['q1', 'q2', 'q3'])
  })

  it('prova não expõe o gabarito no payload do cliente', () => {
    const seguro = quizParaCliente(QUIZ, 'prova')
    for (const questao of seguro.questoes) {
      expect(questao.alternativas.some((a) => a.correta)).toBe(false)
      expect(questao.alternativas.every((a) => a.feedback === '')).toBe(true)
    }
    // Serializado, nada do gabarito sobrevive — é o HTML que o servidor manda.
    const serializado = JSON.stringify(seguro)
    expect(serializado).not.toContain('Correto.')
  })

  it('prática mantém a devolutiva, que é imediata por desenho', () => {
    const alternativas = alternativasParaCliente(QUIZ.questoes[0], 'pratica')
    expect(alternativas.some((a) => a.correta)).toBe(true)
  })
})

describe('respostas', () => {
  it('resposta única substitui a escolha anterior', () => {
    let estado = prepararQuiz(QUIZ, 'pratica', 1)
    estado = responder(estado, 'q1', 'a2')
    estado = responder(estado, 'q1', 'a3')
    expect(estado.respostas.q1).toEqual(['a3'])
  })

  it('múltipla resposta alterna a alternativa', () => {
    let estado = prepararQuiz(QUIZ, 'pratica', 1)
    estado = responder(estado, 'q2', 'a1')
    estado = responder(estado, 'q2', 'a2')
    expect(estado.respostas.q2.sort()).toEqual(['a1', 'a2'])
    estado = responder(estado, 'q2', 'a1')
    expect(estado.respostas.q2).toEqual(['a2'])
  })

  it('ignora questão inexistente sem quebrar', () => {
    const estado = prepararQuiz(QUIZ, 'pratica', 1)
    expect(responder(estado, 'inexistente', 'a1')).toBe(estado)
  })

  it('reconhece questão respondida', () => {
    let estado = prepararQuiz(QUIZ, 'pratica', 1)
    expect(respondida(estado, 'q1')).toBe(false)
    estado = responder(estado, 'q1', 'a1')
    expect(respondida(estado, 'q1')).toBe(true)
  })
})

describe('correção', () => {
  it('múltipla resposta exige o conjunto exato', () => {
    const questao = { ...QUIZ.questoes[1], ordem: ['a1', 'a2', 'a3'] }
    expect(questaoCorreta(questao, ['a1', 'a2'])).toBe(true)
    expect(questaoCorreta(questao, ['a1'])).toBe(false)
    expect(questaoCorreta(questao, ['a1', 'a2', 'a3'])).toBe(false)
  })

  it('a ordem das escolhas não altera o resultado', () => {
    const questao = { ...QUIZ.questoes[1], ordem: ['a1', 'a2', 'a3'] }
    expect(questaoCorreta(questao, ['a2', 'a1'])).toBe(true)
  })
})

describe('resultado', () => {
  it('conta acertos, percentual e aprovação', () => {
    let estado = prepararQuiz(QUIZ, 'pratica', 1)
    estado = responder(estado, 'q1', 'a1')
    estado = responder(estado, 'q2', 'a1')
    estado = responder(estado, 'q2', 'a2')
    estado = responder(estado, 'q3', 'a2')

    const resultado = calcularResultado(estado, QUIZ.percentualAprovacao)
    expect(resultado.acertos).toBe(2)
    expect(resultado.total).toBe(3)
    expect(resultado.percentual).toBeCloseTo(66.67, 1)
    expect(resultado.aprovado).toBe(true)
    expect(resultado.erros).toEqual(['q3'])
  })

  it('questão em branco conta como erro', () => {
    const estado = prepararQuiz(QUIZ, 'pratica', 1)
    const resultado = calcularResultado(estado, 50)
    expect(resultado.acertos).toBe(0)
    expect(resultado.erros).toHaveLength(3)
    expect(resultado.aprovado).toBe(false)
  })

  it('agrupa por assunto e lista o pior desempenho primeiro', () => {
    let estado = prepararQuiz(QUIZ, 'pratica', 1)
    estado = responder(estado, 'q1', 'a1')
    const resultado = calcularResultado(estado, 50)
    expect(resultado.porAssunto[0].acertos).toBe(0)
    expect(resultado.porAssunto.at(-1)!.assunto).toBe('Linha cementante')
  })

  it('não divide por zero num quiz vazio', () => {
    const vazio = { ...prepararQuiz(QUIZ, 'pratica', 1), questoes: [] }
    const resultado = calcularResultado(vazio, 50)
    expect(resultado.percentual).toBe(0)
    expect(Number.isFinite(resultado.percentual)).toBe(true)
  })
})
