import { describe, expect, it } from 'vitest'

import { generateExamPDF, generateExamStudyPDF, generateExamWithAnswersPDF } from '@/lib/pdf-generator'

/**
 * O PDF das provas com IA: os quatro recursos visuais desenham (tabela que
 * quebra página, gráfico de barras e de linha, esquema, citação) e o caderno
 * de estudo leva as respostas comentadas no fim.
 */

const base = (n: number, supportMaterial: any): any => ({
  id: `q${n}`,
  number: n,
  type: 'multiple-choice',
  statement: 'Analise o material a seguir.',
  command: 'Qual é a interpretação correta?',
  supportMaterial,
  alternatives: [
    { id: 'a', letter: 'A', text: 'Primeira leitura', isCorrect: false },
    { id: 'b', letter: 'B', text: 'Segunda leitura', isCorrect: true },
    { id: 'c', letter: 'C', text: 'Terceira leitura', isCorrect: false },
    { id: 'd', letter: 'D', text: 'Quarta leitura', isCorrect: false },
  ],
  explanation: '**Do zero: o que você precisa saber**\nO conceito-base.\n\n**Para fixar**\nA regra.',
  commentedFeedback: { correctAlternative: 'B', explanations: { A: 'Erra o mecanismo.', B: 'Certa.' } },
})

const prova: any = {
  _id: 'p1',
  title: 'Prova com recursos',
  numberOfQuestions: 5,
  numberOfAlternatives: 4,
  scoringMethod: 'normal',
  questions: [
    base(1, {
      tipo: 'tabela',
      titulo: 'Gasometria',
      cabecalho: ['Parâmetro', 'Valor', 'Referência'],
      linhas: Array.from({ length: 10 }, (_, i) => [`Item ${i}`, `${7 + i / 10}`, '7,35–7,45']),
      fonte: 'Dados fictícios',
    }),
    base(2, { tipo: 'grafico', forma: 'barras', rotulos: ['Jan', 'Fev', 'Mar'], series: [{ nome: 'Casos', valores: [10, 25, 18] }], eixoY: 'casos' }),
    base(3, { tipo: 'grafico', forma: 'linha', rotulos: ['0h', '2h', '4h'], series: [{ nome: 'A', valores: [1, 3, 2] }, { nome: 'B', valores: [2, 1, 4] }] }),
    base(4, { tipo: 'esquema', forma: 'ciclo', etapas: ['Estímulo', 'Liberação de renina', 'Angiotensina II', 'Aldosterona'] }),
    base(5, { tipo: 'citacao', texto: 'A hipertensão é o principal fator de risco modificável para doença cardiovascular.', autor: 'Diretriz Brasileira' }),
  ],
}

describe('PDF das provas com IA', () => {
  it('desenha os quatro recursos na prova e no gabarito comentado', async () => {
    const [semRecurso, comRecurso, gabarito] = await Promise.all([
      generateExamPDF({ ...prova, questions: prova.questions.map((q: any) => ({ ...q, supportMaterial: undefined })) }),
      generateExamPDF(prova),
      generateExamWithAnswersPDF(prova),
    ])
    expect(comRecurso.size).toBeGreaterThan(semRecurso.size)
    expect(gabarito.size).toBeGreaterThan(0)
  })

  it('o caderno de estudo é a prova mais as respostas no final', async () => {
    const [soAProva, estudo] = await Promise.all([generateExamPDF(prova), generateExamStudyPDF(prova)])
    expect(estudo.size).toBeGreaterThan(soAProva.size)
  })
})
