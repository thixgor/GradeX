import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Exam, UserAnswer } from './types'
import { carregarLogo, registrarFontes, fonte, TINTA_SUAVE, FLORESTA } from './pdf/marca'
import { carregarImagens, type ImagemParaPdf } from './pdf/imagens'
import {
  type Folha,
  type LinhaDoGrupo,
  criarFolha,
  desenharAlternativas,
  desenharCabecalhoDaQuestao,
  desenharCartaoDeTitulo,
  desenharGrupo,
  desenharNumeros,
  desenharPares,
  escreverNota,
  escreverTexto,
  finalizarFolha,
  novaPagina,
} from './pdf/folha'
import {
  type CelulaDaGrade,
  alternativasDa,
  desenharCaixaDeTexto,
  desenharEnunciado,
  desenharGrade,
  desenharRespostaComentada,
  fecharQuestao,
  rotuloDoTipo,
} from './pdf/questao-na-folha'
import { urlsDaQuestao } from './questoes/imagens-da-questao'

interface UserReportData {
  exam: Exam
  examId: string
  userName: string
  signature: string // base64 image
  answers: UserAnswer[]
  /**
   * Quando a prova foi entregue. Sem ela o cabeçalho imprimia a data de HOJE —
   * o relatório de uma prova de março, baixado em julho, dizia julho.
   */
  submittedAt?: Date | string
  /** Nota obtida, quando já existe. */
  score?: number | null
}

/**
 * A família de fonte ativa neste arquivo.
 *
 * Era `'helvetica'` fixo em cada `setFont`, e é daí que vinha o defeito da
 * alternativa correta: as fontes padrão do PDF não têm `✓`, e o jsPDF, ao
 * encontrar um caractere fora do WinAnsi, reescreve a linha inteira em UTF-16
 * mantendo a fonte de um byte. O resultado é o texto soletrado, com um `'` no
 * lugar do certinho, vazando para fora da tarja verde — porque `getTextWidth`
 * mediu a versão curta e a página desenhou a longa.
 *
 * `registrarFontes` embute a Inter (a mesma dos PDFs de /provas) e devolve o
 * nome a usar; sem ela, `sanitizarParaPdf` troca os símbolos por equivalentes
 * ASCII. Ver `lib/pdf/marca.ts`.
 *
 * O desenho das questões é o MESMO dos PDFs de /provas (ver
 * `lib/pdf/questao-na-folha.ts`): este relatório já foi o único PDF que omitia
 * as imagens do enunciado, e o único com o nome da marca escrito à mão.
 */
let FONT = 'helvetica'

// ── Imagens ──────────────────────────────────────────────────────
// A busca+cache mora em `lib/pdf/imagens.ts`: era a terceira cópia do mesmo
// vai-e-volta por <img>/<canvas> no projeto.
type ImgData = ImagemParaPdf

/** Enunciado e resposta comentada — ver `lib/questoes/imagens.ts`. */
async function prefetchImages(questions: Exam['questions'] | undefined): Promise<Map<string, ImgData>> {
  return carregarImagens((questions || []).flatMap((q) => urlsDaQuestao(q)))
}

/** Um documento novo, com fontes embutidas e a primeira página aberta. */
async function abrirFolha(subtitulo: string): Promise<Folha> {
  const doc = new jsPDF()
  // As fontes são registradas ANTES de qualquer medição: a quebra de linha
  // usa `getTextWidth`, e medir com uma fonte para desenhar com outra é o que
  // fazia o texto vazar da caixa.
  FONT = await registrarFontes(doc)
  return criarFolha(doc, FONT, await carregarLogo(), subtitulo)
}

// Gera barcode como base64
function generateBarcodeImage(value: string): string {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, value, {
    format: 'CODE128',
    width: 2,
    height: 40,
    displayValue: true,
    fontSize: 10,
    margin: 5,
  })
  return canvas.toDataURL('image/png')
}

const dataEHora = (valor: Date | string | number) =>
  new Date(valor).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const notaMaxima = (exam: Exam) => (exam.scoringMethod === 'tri' ? 1000 : exam.totalPoints || 100)

/** "72,50 / 100" — a nota no jeito brasileiro. */
const textoDaNota = (exam: Exam, nota: number) => `${nota.toFixed(2).replace('.', ',')} / ${notaMaxima(exam)}`

/**
 * A assinatura digital e o código de barras, lado a lado num cartão.
 * Cada um entra só se existir — sem os dois, o cartão nem aparece.
 */
function desenharAssinaturaECodigo(folha: Folha, data: UserReportData): void {
  const { doc } = folha
  let codigo: string | null = null
  try {
    const valor = `${data.examId}-${data.userName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15)}`
    codigo = generateBarcodeImage(valor) || null
  } catch {
    /* sem código de barras */
  }
  if (!data.signature && !codigo) return

  const linha: LinhaDoGrupo = {
    altura: 30,
    desenhar: (x, y, largura) => {
      if (data.signature) {
        fonte(doc, 'bold', 7.5, TINTA_SUAVE)
        doc.text('Assinatura digital', x + 5, y + 5.5)
        try {
          doc.addImage(data.signature, 'PNG', x + 5, y + 8, 66, 19)
        } catch {
          /* assinatura ilegível: o rótulo fica, a imagem não */
        }
      }
      if (codigo) {
        try {
          doc.addImage(codigo, 'PNG', x + largura - 5 - 74, y + 5, 74, 21)
        } catch {
          /* segue sem o código */
        }
      }
    },
  }
  desenharGrupo(folha, [linha], { depois: 4 })
}

/**
 * RELATÓRIO SEM GABARITO
 * Mostra as respostas do aluno sem indicar as corretas
 */
export async function generateUserReportPDF(data: UserReportData): Promise<Blob> {
  const [imageMap] = await Promise.all([prefetchImages(data.exam.questions), carregarLogo()])
  const folha = await abrirFolha('Relatório de prova')
  const questoes = data.exam.questions || []
  const total = questoes.length || data.exam.numberOfQuestions || 0

  // A duração é opcional na prova; imprimi-la sem checar dava "Duração:
  // undefined min" em toda prova que não define um limite.
  desenharCartaoDeTitulo(folha, {
    titulo: data.exam.title,
    chips: [
      `${total} ${total === 1 ? 'questão' : 'questões'}`,
      data.exam.duration ? `${data.exam.duration} min` : null,
      typeof data.score === 'number' ? `Nota ${textoDaNota(data.exam, data.score)}` : null,
    ].filter((chip): chip is string => !!chip),
  })

  // A data é a da ENTREGA, não a de hoje: o relatório de uma prova de março,
  // baixado em julho, dizia julho.
  desenharPares(
    folha,
    [
      { rotulo: 'Candidato', valor: data.userName },
      { rotulo: 'Entrega', valor: dataEHora(data.submittedAt || Date.now()) },
      ...(typeof data.score === 'number' ? [{ rotulo: 'Nota', valor: textoDaNota(data.exam, data.score) }] : []),
    ],
    { titulo: 'Candidato' },
  )
  desenharAssinaturaECodigo(folha, data)

  questoes.forEach((question, idx) => {
    const answer = data.answers.find((a) => a.questionId === question.id)
    desenharCabecalhoDaQuestao(folha, `Questão ${question.number ?? idx + 1}`, [{ texto: rotuloDoTipo(question) }])
    // Imagens do enunciado incluídas: este relatório era o único que as omitia
    // por completo, e a pergunta de uma questão de imagem ficava sem sentido.
    desenharEnunciado(folha, question, imageMap)

    if (question.type === 'multiple-choice') {
      desenharAlternativas(
        folha,
        alternativasDa(
          question,
          (alt) => (alt.id === answer?.selectedAlternative ? 'marcada' : 'vazia'),
          (alt) => (alt.id === answer?.selectedAlternative ? 'Sua resposta' : undefined),
        ),
      )
      if (!(question.alternatives || []).some((alt) => alt.id === answer?.selectedAlternative)) {
        escreverNota(folha, 'Não respondida.')
      }
    } else {
      /*
       * Discursiva E redação.
       *
       * O ramo só cobria `discursive`: numa prova com redação, o PDF imprimia o
       * enunciado e passava para a questão seguinte — o texto que o aluno
       * escreveu não aparecia em lugar nenhum do "relatório da minha prova".
       */
      const textoDoAluno = answer?.discursiveText || answer?.essayText
      const titulo = question.type === 'essay' ? 'Redação do candidato' : 'Resposta do candidato'
      if (!textoDoAluno || !desenharCaixaDeTexto(folha, textoDoAluno, titulo, { tom: 'claro' })) {
        escreverNota(folha, '(Não respondida)')
      }
      if (answer?.discursiveSelfScore !== undefined) {
        escreverTexto(folha, `Autoavaliação: ${answer.discursiveSelfScore}%`, { corpo: 9, estilo: 'bold', cor: FLORESTA, depois: 2 })
      }
    }

    fecharQuestao(folha)
  })

  // === RESUMO ===
  folha.subtitulo = 'Resumo das respostas'
  novaPagina(folha)
  const objetivas = questoes.filter((q) => q.type === 'multiple-choice')
  desenharGrade(
    folha,
    objetivas.map((q, i) => ({
      numero: q.number ?? i + 1,
      letra: (q.alternatives || []).find((alt) => alt.id === data.answers.find((a) => a.questionId === q.id)?.selectedAlternative)?.letter || '—',
    })),
    5,
    'Resumo das respostas',
  )
  // Discursiva e redação: o resumo dizia "Não respondida" para toda redação,
  // porque só olhava `discursiveText`.
  const abertas = questoes.filter((q) => q.type !== 'multiple-choice')
  if (abertas.length > 0) {
    const respondidas = abertas.filter((q) => {
      const answer = data.answers.find((a) => a.questionId === q.id)
      return !!(answer?.discursiveText?.trim() || answer?.essayText?.trim())
    }).length
    escreverNota(
      folha,
      `Questões abertas (discursivas e redação): ${respondidas} de ${abertas.length} respondidas.`,
    )
  }

  finalizarFolha(folha, `Relatório de ${data.userName}`, 'Relatório do aluno')
  return folha.doc.output('blob')
}

/**
 * RELATÓRIO COM GABARITO
 * Mostra respostas do aluno + gabarito + respostas comentadas
 */
async function generateUserReportWithGabaritoPDFBlob(data: UserReportData): Promise<Blob> {
  const [imageMap] = await Promise.all([prefetchImages(data.exam.questions), carregarLogo()])
  const folha = await abrirFolha('Relatório com gabarito')
  const questoes = data.exam.questions || []

  desenharCartaoDeTitulo(folha, {
    titulo: data.exam.title,
    chips: [
      `Candidato: ${data.userName}`,
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      `${questoes.length} ${questoes.length === 1 ? 'questão' : 'questões'}`,
    ],
  })

  // === RESULTADO ===
  // `|| []`: discursiva e redação chegam sem alternativas, e o `.find` direto
  // derrubava o relatório inteiro de uma prova com redação.
  const corretaDa = (q: Exam['questions'][number]) => (q.alternatives || []).find((a) => a.isCorrect)
  const objetivas = questoes.filter((q) => q.type === 'multiple-choice')
  let acertos = 0
  let respondidas = 0
  for (const q of objetivas) {
    const answer = data.answers.find((a) => a.questionId === q.id)
    if (answer?.selectedAlternative) respondidas++
    if (corretaDa(q) && answer?.selectedAlternative === corretaDa(q)?.id) acertos++
  }
  if (objetivas.length > 0) {
    const percentual = Math.round((acertos / objetivas.length) * 100)
    desenharNumeros(folha, [
      { valor: `${acertos} de ${objetivas.length}`, rotulo: 'Objetivas corretas', tom: 'verde' },
      { valor: `${percentual}%`, rotulo: 'Aproveitamento', tom: percentual >= 60 ? 'verde' : 'laranja' },
      typeof data.score === 'number'
        ? { valor: textoDaNota(data.exam, data.score), rotulo: 'Nota' }
        : { valor: `${respondidas} de ${objetivas.length}`, rotulo: 'Respondidas' },
    ])
  }

  questoes.forEach((question, idx) => {
    const answer = data.answers.find((a) => a.questionId === question.id)
    const correta = corretaDa(question)
    const marcada = (question.alternatives || []).find((a) => a.id === answer?.selectedAlternative)
    const acertou = !!marcada && marcada.id === correta?.id

    // O resultado vai escrito na pílula, além da cor: "Correta" e "Incorreta"
    // continuam legíveis em preto e branco.
    const pilulas: { texto: string; tom?: 'claro' | 'verde' | 'erro' }[] = [{ texto: rotuloDoTipo(question) }]
    if (question.type === 'multiple-choice') {
      pilulas.push(
        !marcada
          ? { texto: 'Em branco' }
          : acertou
            ? { texto: 'Correta', tom: 'verde' }
            : { texto: `Incorreta · gabarito ${correta?.letter || '—'}`, tom: 'erro' },
      )
    }
    desenharCabecalhoDaQuestao(folha, `Questão ${question.number ?? idx + 1}`, pilulas)
    desenharEnunciado(folha, question, imageMap)

    if (question.type === 'multiple-choice') {
      /*
       * O certo/errado é DESENHADO (a bolha verde ou vermelha), fora do texto.
       * Um `✓` no começo da alternativa, fora do WinAnsi, fazia o jsPDF
       * reescrever a linha inteira em UTF-16 e soletrar a alternativa correta.
       */
      desenharAlternativas(
        folha,
        alternativasDa(
          question,
          (alt) => (alt.isCorrect ? 'certa' : alt.id === marcada?.id ? 'errada' : 'vazia'),
          (alt) =>
            alt.isCorrect && alt.id === marcada?.id
              ? 'Sua resposta'
              : alt.isCorrect
                ? 'Gabarito'
                : alt.id === marcada?.id
                  ? 'Sua resposta'
                  : undefined,
        ),
      )
    } else {
      const textoDoAluno = answer?.discursiveText || answer?.essayText
      if (!textoDoAluno || !desenharCaixaDeTexto(folha, textoDoAluno, 'Resposta do candidato', { tom: 'claro' })) {
        escreverNota(folha, '(Não respondida)')
      }
      if (answer?.discursiveSelfScore !== undefined) {
        escreverTexto(folha, `Nota autoatribuída: ${answer.discursiveSelfScore}%`, { corpo: 9, estilo: 'bold', cor: FLORESTA, depois: 2 })
      }
    }

    /*
     * Resposta comentada, em tantas caixas quantas forem as páginas, com as
     * imagens do comentário DENTRO dela (ver
     * `lib/pdf/caixa-de-resposta-comentada.ts`). `montarRespostaComentada` e
     * não `question.explanation`: nas provas cujo comentário está por
     * alternativa, o campo avulso é vazio, e este relatório entregava ao aluno
     * uma caixa "RESPOSTA COMENTADA" em branco.
     */
    desenharRespostaComentada(folha, question, imageMap)
    fecharQuestao(folha)
  })

  // === GABARITO ===
  if (objetivas.length > 0) {
    folha.subtitulo = 'Gabarito oficial'
    novaPagina(folha)
    escreverNota(folha, 'Bolinha cheia: a sua resposta. Bolinha vazada: o gabarito oficial. A marca ao lado diz se você acertou.')
    const celulas: CelulaDaGrade[] = objetivas.map((q, i) => {
      const marcada = (q.alternatives || []).find((a) => a.id === data.answers.find((r) => r.questionId === q.id)?.selectedAlternative)
      return {
        numero: q.number ?? i + 1,
        letra: marcada?.letter || '—',
        gabarito: corretaDa(q)?.letter || '—',
        acerto: marcada ? marcada.id === corretaDa(q)?.id : null,
      }
    })
    desenharGrade(folha, celulas, 4, 'Sua resposta e o gabarito')
  }

  finalizarFolha(folha, `Relatório com gabarito · ${data.userName}`, 'Relatório do aluno')
  return folha.doc.output('blob')
}

export async function downloadUserReportPDF(data: UserReportData) {
  const blob = await generateUserReportPDF(data)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio-${data.exam.title.replace(/\s+/g, '-').toLowerCase()}-${data.userName.replace(/\s+/g, '-').toLowerCase()}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function generateUserReportWithGabaritoPDF(data: UserReportData) {
  const blob = await generateUserReportWithGabaritoPDFBlob(data)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio-gabarito-${data.exam.title.replace(/\s+/g, '-').toLowerCase()}-${data.userName.replace(/\s+/g, '-').toLowerCase()}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
