import { describe, it, expect } from 'vitest'
import {
  generateGabaritoPDF,
  generateExamPDF,
  generateExamWithAnswersPDF,
} from '@/lib/pdf-generator'

/**
 * Nenhum gerador de PDF pode explodir por causa de uma prova sem `questions`.
 *
 * Era o erro que aparecia ao baixar o pacote de um grupo:
 *
 *   TypeError: Cannot read properties of undefined (reading 'filter')
 *       at prefetchExamImages
 *
 * A causa está corrigida na origem — as provas do grupo agora são buscadas
 * completas antes de gerar (ver `__tests__/provas/pdf-do-grupo.test.ts`) —,
 * mas a rede pode falhar, uma prova pode vir vazia do banco, e uma tela nova
 * pode esquecer o mesmo passo. O gerador escreve o que a prova tiver: um PDF
 * incompleto explica o que aconteceu, a exceção não explicava nada.
 */
describe('geradores de PDF com prova sem questões', () => {
  const semQuestoes: any = { _id: 'x', title: 'Prova vazia', numberOfQuestions: 0 }
  const questionsNulo: any = { _id: 'y', title: 'Prova nula', questions: null }

  it('gera o gabarito sem estourar', async () => {
    expect((await generateGabaritoPDF(semQuestoes)).size).toBeGreaterThan(0)
    expect((await generateGabaritoPDF(questionsNulo)).size).toBeGreaterThan(0)
  })

  it('gera a prova sem estourar', async () => {
    expect((await generateExamPDF(semQuestoes)).size).toBeGreaterThan(0)
    expect((await generateExamPDF(questionsNulo)).size).toBeGreaterThan(0)
  })

  it('gera a prova com gabarito comentado sem estourar', async () => {
    expect((await generateExamWithAnswersPDF(semQuestoes)).size).toBeGreaterThan(0)
    expect((await generateExamWithAnswersPDF(questionsNulo)).size).toBeGreaterThan(0)
  })
})
