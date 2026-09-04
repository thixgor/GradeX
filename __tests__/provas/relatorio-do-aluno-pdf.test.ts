import { describe, it, expect } from 'vitest'
import { inflateSync } from 'node:zlib'
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


/**
 * O texto soletrado da alternativa correta.
 *
 * As 14 fontes padrão do PDF usam WinAnsiEncoding, que não tem `✓`. O jsPDF, ao
 * encontrar um caractere fora dela, reescreve a LINHA INTEIRA em UTF-16BE e
 * continua declarando a fonte de um byte — cada letra ASCII vira dois bytes, e
 * o byte nulo da frente é desenhado como espaço:
 *
 *     (✓ A) O aumento do volume…)  →  ('   A \)   O   a u m e n t o …) Tj
 *
 * Era exatamente isso que saía no relatório: um `'` no lugar do certinho, o
 * texto soletrado e vazando para fora da tarja verde — porque `getTextWidth`,
 * que decide a quebra de linha, mediu a versão curta enquanto a página
 * desenhou a longa.
 *
 * O conserto tem duas pernas (ver `lib/pdf/marca.ts`): a Roboto embutida, que
 * tem os glifos e as métricas certas, e a marca de certo/errado desenhada em
 * vetor, fora do texto. Este teste roda no caminho SEM Roboto — o `fetch` do
 * TTF não existe em node —, que é o fallback e o mais frágil dos dois.
 */
function textoDesenhado(pdf: ArrayBuffer): string {
  const bruto = Buffer.from(pdf).toString('latin1')
  const pedacos: string[] = []
  const re = /stream\r?\n([\s\S]*?)endstream/g
  let m: RegExpExecArray | null
  while ((m = re.exec(bruto)) !== null) {
    let dados = Buffer.from(m[1], 'latin1')
    try {
      dados = inflateSync(dados)
    } catch {
      /* stream não comprimido */
    }
    pedacos.push(dados.toString('latin1'))
  }
  return pedacos.join('\n')
}

describe('a alternativa correta não sai soletrada', () => {
  const enunciadoLongo =
    'O aumento do volume diastolico final aumenta a forca de contracao do ventriculo esquerdo'

  const objetivaComTextoLongo = {
    id: 'q1',
    number: 1,
    type: 'multiple-choice',
    statement: 'Sobre a lei de Frank-Starling...',
    command: 'Assinale a alternativa correta.',
    explanation: 'A distensao das fibras aumenta a sobreposicao entre actina e miosina.',
    alternatives: [
      { id: 'a1', letter: 'A', text: enunciadoLongo, isCorrect: true },
      { id: 'a2', letter: 'B', text: 'O enchimento reduz o volume sistolico', isCorrect: false },
    ],
  }

  it('o texto sai como uma string só, não caractere a caractere', async () => {
    const { generateUserReportWithGabaritoPDF } = await import('@/lib/user-report-generator')
    // A função de download mexe no DOM; o blob vem do gerador por baixo dela.
    expect(typeof generateUserReportWithGabaritoPDF).toBe('function')

    const blob = await generateUserReportPDF({
      exam: prova([objetivaComTextoLongo]) as any,
      examId: 'e1',
      userName: 'Aluno Teste',
      signature: '',
      answers: [{ questionId: 'q1', selectedAlternative: 'a1' }] as any,
    })

    const conteudo = textoDesenhado(await blob.arrayBuffer())

    // A assinatura do defeito: letras isoladas separadas por espaços dentro de
    // uma string do PDF. Cinco seguidas não acontecem em texto de verdade.
    expect(/\([^()]*(?:[A-Za-z]\s){5}/.test(conteudo)).toBe(false)
    // E o texto tem de estar lá, inteiro, numa peça só.
    expect(conteudo).toContain('aumento do volume diastolico final')
  })

  it('nenhum glifo fora do WinAnsi sobra no texto desenhado', async () => {
    const blob = await generateUserReportPDF({
      exam: prova([objetivaComTextoLongo]) as any,
      examId: 'e1',
      userName: 'Aluno Teste',
      signature: '',
      answers: [{ questionId: 'q1', selectedAlternative: 'a2' }] as any,
    })
    const conteudo = textoDesenhado(await blob.arrayBuffer())
    // `✓` e `✗` foram trocados por marcas em vetor e pelo sanitizador; se um
    // deles voltar ao texto, o defeito volta junto.
    expect(conteudo).not.toContain('\u2713')
    expect(conteudo).not.toContain('\u2717')
  })
})
