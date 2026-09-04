import { describe, it, expect } from 'vitest'
import { generateUserReportPDF } from '@/lib/user-report-generator'

/**
 * O PDF "a minha prova, com as minhas respostas marcadas".
 *
 * Três buracos que só aparecem numa prova completa:
 *
 *  - a **redação** não tinha ramo nenhum no gerador (só `multiple-choice` e
 *    `discursive`): o texto que o aluno escreveu não saía no relatório dele, e
 *    a tabela-resumo o listava como "Não respondida";
 *  - `alternatives` era lido sem checar, e uma questão sem alternativas
 *    derrubava o PDF inteiro;
 *  - o cabeçalho imprimia a data de HOJE e "Duração: undefined min".
 *
 * jsPDF não devolve texto para inspecionar, então os testes travam o que dá
 * para travar: o PDF é gerado, tem conteúdo, e o tamanho cresce quando a
 * resposta do aluno existe — se o texto fosse descartado, os dois arquivos
 * teriam o mesmo tamanho.
 */

function prova(questoes: any[]): any {
  return {
    _id: 'p1',
    title: 'Prova de Fisiologia',
    numberOfQuestions: questoes.length,
    numberOfAlternatives: 4,
    scoringMethod: 'normal',
    totalPoints: 100,
    questions: questoes,
  }
}

const objetiva = {
  id: 'q1',
  number: 1,
  type: 'multiple-choice',
  statement: 'Sobre o potencial de ação...',
  command: 'Assinale a correta',
  alternatives: [
    { id: 'a1', letter: 'A', text: 'Sódio entra', isCorrect: true },
    { id: 'a2', letter: 'B', text: 'Potássio entra', isCorrect: false },
  ],
}

const redacao = {
  id: 'q2',
  number: 2,
  type: 'essay',
  statement: 'Disserte sobre o SUS',
  command: '',
  alternatives: [],
  essayTheme: 'Saúde pública',
}

const discursiva = {
  id: 'q3',
  number: 3,
  type: 'discursive',
  statement: 'Explique a bomba de sódio e potássio',
  command: '',
  alternatives: [],
}

const base = {
  examId: 'p1',
  userName: 'Maria Silva',
  signature: '',
}

describe('generateUserReportPDF', () => {
  it('gera o relatório de uma prova mista sem estourar', async () => {
    const blob = await generateUserReportPDF({
      ...base,
      exam: prova([objetiva, redacao, discursiva]),
      answers: [
        { questionId: 'q1', selectedAlternative: 'a1' },
        { questionId: 'q2', essayText: 'A universalidade é o princípio...' },
        { questionId: 'q3', discursiveText: 'A bomba usa ATP...' },
      ],
    })
    expect(blob.size).toBeGreaterThan(0)
  })

  it('a redação do aluno entra no PDF — antes ela sumia', async () => {
    const comum = { ...base, exam: prova([redacao]) }

    const semTexto = await generateUserReportPDF({ ...comum, answers: [{ questionId: 'q2' }] })
    const comTexto = await generateUserReportPDF({
      ...comum,
      answers: [
        {
          questionId: 'q2',
          essayText:
            'O Sistema Único de Saúde nasce da Constituição de 1988 e se apoia em três princípios doutrinários. '.repeat(
              12,
            ),
        },
      ],
    })

    expect(comTexto.size).toBeGreaterThan(semTexto.size)
  })

  it('aguenta questão sem o array de alternativas', async () => {
    const semAlternativas = { ...redacao, alternatives: undefined }
    const blob = await generateUserReportPDF({
      ...base,
      exam: prova([semAlternativas]),
      answers: [{ questionId: 'q2', essayText: 'texto' }],
    })
    expect(blob.size).toBeGreaterThan(0)
  })

  it('não estoura sem duração, sem nota e sem data de entrega', async () => {
    const blob = await generateUserReportPDF({
      ...base,
      exam: prova([objetiva]),
      answers: [{ questionId: 'q1', selectedAlternative: 'a1' }],
    })
    expect(blob.size).toBeGreaterThan(0)
  })

  it('imprime a nota quando ela existe', async () => {
    const comum = { ...base, exam: prova([objetiva]), answers: [{ questionId: 'q1', selectedAlternative: 'a1' }] }
    const semNota = await generateUserReportPDF(comum)
    const comNota = await generateUserReportPDF({ ...comum, score: 87.5, submittedAt: new Date('2026-05-10T16:00:00Z') })
    expect(comNota.size).toBeGreaterThan(semNota.size)
  })

  it('aguenta prova sem questão nenhuma', async () => {
    const blob = await generateUserReportPDF({ ...base, exam: prova([]), answers: [] })
    expect(blob.size).toBeGreaterThan(0)
  })
})
