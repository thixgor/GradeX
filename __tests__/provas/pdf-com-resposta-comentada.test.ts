import { describe, it, expect } from 'vitest'
import {
  generateExamPackagePDF,
  generateExamWithAnswersPDF,
  montarRespostaComentada,
} from '@/lib/pdf-generator'
import {
  FORMATOS_DE_PDF_DA_PROVA,
  avisoDoGabaritoComentado,
  nomeDoArquivoDePdf,
  opcaoDePdf,
} from '@/lib/provas/formatos-de-pdf'

/**
 * O PDF com resposta comentada, a partir de `/admin/exams`.
 *
 * Duas coisas faltavam, e cada uma sozinha já produzia o mesmo relato — "o
 * admin não consegue gerar a prova com resposta comentada":
 *
 * 1. O painel só tinha o botão do caderno EM BRANCO. As outras duas funções
 *    existiam e nenhuma tela do admin as chamava.
 * 2. Quando chamado, o gerador lia apenas `question.explanation` — e boa parte
 *    do acervo guarda o comentário em `commentedFeedback.explanations`, um
 *    texto por alternativa. O arquivo saía sem erro e sem comentário nenhum.
 *
 * Estes testes travam as duas metades: os formatos que a tela oferece e o que
 * o gerador considera "resposta comentada".
 */

const questaoObjetiva: any = {
  id: 'q1',
  number: 1,
  type: 'multiple-choice',
  statement: 'Qual é a principal artéria do corpo?',
  command: 'Assinale a alternativa correta.',
  alternatives: [
    { letter: 'A', text: 'Aorta', isCorrect: true },
    { letter: 'B', text: 'Veia cava', isCorrect: false },
  ],
}

describe('montarRespostaComentada', () => {
  it('usa o comentário por alternativa quando não há explicação avulsa', () => {
    const texto = montarRespostaComentada({
      ...questaoObjetiva,
      commentedFeedback: {
        correctAlternative: 'A',
        explanations: { A: 'É a aorta.', B: 'A cava é venosa.' },
      },
    })

    expect(texto).toContain('Comentário por alternativa')
    expect(texto).toContain('É a aorta.')
    expect(texto).toContain('A cava é venosa.')
    // A correta se identifica no próprio comentário: o PDF do gabarito
    // comentado é lido longe da tela que pinta a alternativa de verde.
    expect(texto).toContain('**A) (correta)**')
  })

  it('marca a correta pelo gabarito quando o feedback não a declara', () => {
    const texto = montarRespostaComentada({
      ...questaoObjetiva,
      commentedFeedback: { explanations: { A: 'É a aorta.' } },
    } as any)

    expect(texto).toContain('**A) (correta)**')
  })

  it('junta a explicação avulsa e o comentário por alternativa, nessa ordem', () => {
    const texto = montarRespostaComentada({
      ...questaoObjetiva,
      explanation: 'A aorta sai do ventrículo esquerdo.',
      commentedFeedback: { correctAlternative: 'A', explanations: { B: 'Erra porque é venosa.' } },
    })

    expect(texto.indexOf('A aorta sai do ventrículo esquerdo.')).toBeLessThan(
      texto.indexOf('Comentário por alternativa'),
    )
  })

  it('escreve os pontos-chave da discursiva, que o cabeçalho já prometia', () => {
    const texto = montarRespostaComentada({
      id: 'q2',
      number: 2,
      type: 'discursive',
      statement: 'Explique a circulação sistêmica.',
      command: '',
      alternatives: [],
      keyPoints: [
        { id: 'k1', description: 'Cita o ventrículo esquerdo', weight: 0.5 },
        { id: 'k2', description: '   ', weight: 0.5 },
      ],
    } as any)

    expect(texto).toContain('Pontos-chave esperados')
    expect(texto).toContain('Cita o ventrículo esquerdo')
    expect(texto).toContain('peso 0.5')
  })

  it('devolve vazio quando a questão não tem nada a comentar', () => {
    expect(montarRespostaComentada(questaoObjetiva)).toBe('')
    expect(
      montarRespostaComentada({ ...questaoObjetiva, commentedFeedback: { correctAlternative: 'A', explanations: { A: '  ' } } }),
    ).toBe('')
  })
})

describe('o PDF com gabarito comentado usa o comentário por alternativa', () => {
  const semComentario: any = {
    _id: 'p0',
    title: 'Prova',
    numberOfQuestions: 1,
    totalPoints: 10,
    scoringMethod: 'normal',
    questions: [questaoObjetiva],
  }

  it('escreve mais do que a mesma prova sem comentário nenhum', async () => {
    const comComentario = {
      ...semComentario,
      questions: [
        {
          ...questaoObjetiva,
          commentedFeedback: {
            correctAlternative: 'A',
            explanations: {
              A: 'A aorta é a maior artéria e sai do ventrículo esquerdo.',
              B: 'A veia cava traz sangue de volta ao átrio direito; é veia, não artéria.',
            },
          },
        },
      ],
    }

    const [antes, depois] = await Promise.all([
      generateExamWithAnswersPDF(semComentario),
      generateExamWithAnswersPDF(comComentario),
    ])
    expect(depois.size).toBeGreaterThan(antes.size)
  })
})

describe('formatos de PDF oferecidos ao admin', () => {
  it('oferece a prova em branco, o gabarito comentado, o gabarito e o pacote', () => {
    expect(FORMATOS_DE_PDF_DA_PROVA.map((opcao) => opcao.chave)).toEqual([
      'exam',
      'with-answers',
      'gabarito',
      'pacote',
    ])
  })

  it('o pacote é o único que junta mais de um documento', () => {
    expect(opcaoDePdf('pacote').partes).toEqual(['exam', 'with-answers', 'gabarito'])
    for (const opcao of FORMATOS_DE_PDF_DA_PROVA.filter((o) => o.chave !== 'pacote')) {
      expect(opcao.partes).toHaveLength(1)
    }
  })

  it('cada formato tem um nome de arquivo próprio, sem acento nem barra', () => {
    const nomes = FORMATOS_DE_PDF_DA_PROVA.map((opcao) => nomeDoArquivoDePdf('N1 Cardiologia — 2026/2', opcao.chave))
    expect(new Set(nomes).size).toBe(nomes.length)
    expect(nomes[1]).toBe('n1-cardiologia-2026-2-gabarito-comentado.pdf')
    for (const nome of nomes) expect(nome).toMatch(/^[a-z0-9-]+\.pdf$/)
  })

  it('avisa quando a prova não tem o que comentar', () => {
    expect(avisoDoGabaritoComentado({ questions: [] } as any)).toContain('não tem questões')
    // Prova ainda sem as questões carregadas: nada a afirmar.
    expect(avisoDoGabaritoComentado({} as any)).toBeNull()
    expect(avisoDoGabaritoComentado({ questions: [questaoObjetiva] } as any)).toContain('Nenhuma questão')
    expect(
      avisoDoGabaritoComentado({
        questions: [questaoObjetiva, { ...questaoObjetiva, explanation: 'Porque sim.' }],
      } as any),
    ).toContain('1 de 2')
    expect(
      avisoDoGabaritoComentado({ questions: [{ ...questaoObjetiva, explanation: 'Porque sim.' }] } as any),
    ).toBeNull()
  })
})

describe('generateExamPackagePDF', () => {
  const prova: any = {
    _id: 'p1',
    title: 'Prova de teste',
    numberOfQuestions: 1,
    totalPoints: 10,
    scoringMethod: 'normal',
    questions: [
      {
        ...questaoObjetiva,
        commentedFeedback: { correctAlternative: 'A', explanations: { A: 'É a aorta.' } },
      },
    ],
  }

  it('gera um documento só quando o formato pede um só', async () => {
    const blob = await generateExamPackagePDF(prova, ['with-answers'])
    expect(blob.size).toBeGreaterThan(0)
  })

  it('junta os três documentos do pacote num arquivo maior que qualquer um deles', async () => {
    const [soAProva, pacote] = await Promise.all([
      generateExamPackagePDF(prova, ['exam']),
      generateExamPackagePDF(prova, ['exam', 'with-answers', 'gabarito']),
    ])
    expect(pacote.size).toBeGreaterThan(soAProva.size)
  })

  it('conta o andamento do pacote e ignora formatos repetidos', async () => {
    const passos: [number, number][] = []
    await generateExamPackagePDF(prova, ['gabarito', 'gabarito', 'exam'], (feitos, total) =>
      passos.push([feitos, total]),
    )
    expect(passos.every(([, total]) => total === 2)).toBe(true)
    expect(passos.at(-1)).toEqual([2, 2])
  })

  it('não estoura com uma prova sem questões', async () => {
    const blob = await generateExamPackagePDF({ _id: 'x', title: 'Vazia' } as any, ['exam', 'with-answers', 'gabarito'])
    expect(blob.size).toBeGreaterThan(0)
  })
})
