import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Exam, UserAnswer } from './types'
import {
  CINZA_CLARO,
  CINZA_TEXTO,
  LARANJA,
  LARANJA_CLARO,
  VERDE_ESCURO,
  VERDE_MEDIO,
  carregarLogo,
  desenharCabecalho,
  desenharRodape,
  marcarCerto,
  marcarErrado,
  marcarNeutro,
  registrarFontes,
  sanitizarParaPdf,
} from './pdf/marca'
import { carregarImagens, type ImagemParaPdf } from './pdf/imagens'
import { fatiarCaixaEmPaginas } from './pdf/paginacao'
import { desenharLinhaRica, quebrarTexto } from './pdf/texto'
import { ALTURA_MAXIMA_DA_IMAGEM, desenharImagensNoPdf } from './pdf/imagens-de-questao'
import { blocoDaResposta, blocoDoEnunciado, urlsDaQuestao } from './questoes/imagens-da-questao'
import type { ImagemDeQuestao, LayoutDeImagens } from './questoes/imagens'
import { montarRespostaComentada } from './provas/resposta-comentada'

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
 * `registrarFontes` embute a Roboto (a mesma dos PDFs de /provas) e devolve o
 * nome a usar; sem ela, `sanitizarParaPdf` troca os símbolos por equivalentes
 * ASCII. Ver `lib/pdf/marca.ts`.
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

// Helper: replace \nl and \n with newlines
// O sanitizador entra aqui, no funil por onde passa todo texto vindo da prova:
// com a Roboto ativa ele é um no-op, e sem ela é o que impede um `≥` ou um `→`
// perdido no enunciado de soletrar a linha inteira.
function cleanText(text: string): string {
  return sanitizarParaPdf(text?.replace(/\\nl/g, '\n').replace(/\\n/g, '\n') || '')
}

// A quebra passou a ser a MESMA dos PDFs de /provas (lib/pdf/texto.ts): a cópia
// daqui media o `**` que não é desenhado, e o parágrafo quebrava antes da hora.
const wrapText = quebrarTexto

/**
 * O desenhador de imagens deste relatório.
 *
 * Mesma conta de tamanho, mesma quebra de página e mesmo lado a lado dos PDFs
 * de /provas — ver `lib/pdf/imagens-de-questao.ts`.
 */
function criarDesenhoDeImagens(
  doc: jsPDF,
  imageMap: Map<string, ImgData>,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  logo: string | null,
  subtitulo: string,
) {
  return (
    bloco: { imagens: ImagemDeQuestao[]; layout: LayoutDeImagens },
    y: number,
    opcoes: { recuo?: number; alturaMaxima?: number } = {},
  ): number => {
    if (bloco.imagens.length === 0) return y
    const recuo = opcoes.recuo ?? 0
    return desenharImagensNoPdf(doc, bloco.imagens, bloco.layout, imageMap, {
      x: margin + recuo,
      largura: pageWidth - 2 * margin - recuo,
      y,
      limiteY: pageHeight - 25,
      alturaMaxima: opcoes.alturaMaxima,
      fonte: FONT,
      novaPagina: () => {
        doc.addPage()
        return addHeader(doc, pageWidth, margin, subtitulo, logo)
      },
    })
  }
}

/** Uma linha com `**negrito**` e `*itálico*`, como nos PDFs de /provas. */
function desenharLinha(doc: jsPDF, line: string, x: number, y: number, estilo: 'normal' | 'bold' | 'italic' = 'normal'): void {
  desenharLinhaRica(doc, FONT, line, x, y, estilo)
}

/**
 * Cabeçalho e rodapé da marca.
 *
 * Eram uma segunda implementação, parecida de longe e sem o logo: este era o
 * único PDF da plataforma que saía com o nome escrito à mão e nenhuma imagem.
 * Agora são os mesmos de /provas.
 */
function addHeader(doc: jsPDF, pageWidth: number, margin: number, subtitle: string, logo?: string | null): number {
  return desenharCabecalho(doc, pageWidth, margin, subtitle, logo)
}

function addFooter(
  doc: jsPDF,
  pageNum: number,
  totalPages: number,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  extraText?: string,
) {
  desenharRodape(doc, pageNum, totalPages, pageWidth, pageHeight, margin, extraText, 'Relatório do aluno')
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

/**
 * RELATÓRIO SEM GABARITO
 * Mostra as respostas do aluno sem indicar as corretas
 */
export async function generateUserReportPDF(data: UserReportData): Promise<Blob> {
  // As fontes são registradas ANTES de qualquer medição: `wrapText` usa
  // `getTextWidth`, e medir com uma fonte para desenhar com outra é o que fazia
  // o texto vazar da caixa.
  const [imageMap, logo] = await Promise.all([prefetchImages(data.exam.questions), carregarLogo()])
  const doc = new jsPDF()
  FONT = await registrarFontes(doc)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addHeader(doc, pageWidth, margin, 'Relatório de Prova', logo)
      return true
    }
    return false
  }

  const desenharImagens = criarDesenhoDeImagens(doc, imageMap, pageWidth, pageHeight, margin, logo, 'Relatório de Prova')

  // === CABEÇALHO ===
  y = addHeader(doc, pageWidth, margin, 'Relatório de Prova', logo)

  // === TÍTULO DA PROVA ===
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont(FONT, 'bold')
  const titleLines = wrapText(doc, data.exam.title, pageWidth - 2 * margin - 10)
  doc.text(titleLines[0] || data.exam.title, pageWidth / 2, y + 13, { align: 'center' })
  y += 28

  // === INFO DO CANDIDATO ===
  doc.setFillColor(...CINZA_CLARO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 30, 2, 2, 'F')

  doc.setFontSize(10)
  doc.setFont(FONT, 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  doc.text('Candidato:', margin + 5, y + 8)
  doc.setFont(FONT, 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(data.userName, margin + 30, y + 8)

  doc.setFont(FONT, 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  doc.text('Entrega:', margin + 5, y + 16)
  doc.text(
    new Date(data.submittedAt || Date.now()).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    margin + 24,
    y + 16,
  )

  doc.text(`Questões: ${data.exam.questions?.length || data.exam.numberOfQuestions}`, margin + 5, y + 24)
  // A duração é opcional na prova; imprimi-la sem checar dava "Duração:
  // undefined min" em toda prova que não define um limite.
  if (data.exam.duration) {
    doc.text(`Duração: ${data.exam.duration} min`, margin + 60, y + 24)
  }
  if (typeof data.score === 'number') {
    doc.setFont(FONT, 'bold')
    doc.setTextColor(...VERDE_ESCURO)
    doc.text(
      `Nota: ${data.score.toFixed(2)} / ${data.exam.scoringMethod === 'tri' ? 1000 : data.exam.totalPoints || 100}`,
      margin + 115,
      y + 24,
    )
    doc.setFont(FONT, 'normal')
    doc.setTextColor(...CINZA_TEXTO)
  }
  y += 38

  // === ASSINATURA ===
  if (data.signature) {
    try {
      doc.setFontSize(9)
      doc.setTextColor(...CINZA_TEXTO)
      doc.text('Assinatura Digital:', margin, y)
      y += 3
      doc.addImage(data.signature, 'PNG', margin, y, 70, 20)
      y += 25
    } catch (error) {
      y += 3
    }
  }

  // === BARCODE ===
  try {
    const barcodeValue = `${data.examId}-${data.userName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15)}`
    const barcodeImage = generateBarcodeImage(barcodeValue)
    doc.addImage(barcodeImage, 'PNG', pageWidth - margin - 80, y - 25, 80, 22)
  } catch (error) { /* skip */ }

  y += 5

  // === QUESTÕES ===
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont(FONT, 'bold')
  doc.text('RESPOSTAS DO CANDIDATO', pageWidth / 2, y + 7, { align: 'center' })
  y += 16

  data.exam.questions.forEach((question, idx) => {
    const answer = data.answers.find(a => a.questionId === question.id)

    checkPage(50)

    // Header da questão
    doc.setFillColor(...VERDE_MEDIO)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 9, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(FONT, 'bold')
    doc.text(`Questão ${question.number}`, margin + 5, y + 6.5)
    y += 13

    // Enunciado
    if (question.statement) {
      doc.setFontSize(10)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach(line => {
        checkPage(7)
        desenharLinha(doc, line, margin, y)
        y += 5.5
      })
      y += 3
    }

    // Imagens do enunciado. Este relatório era o único que as omitia por
    // completo: o aluno recebia o enunciado de uma questão de imagem sem a
    // imagem, e a pergunta ficava sem sentido no papel.
    y = desenharImagens(blocoDoEnunciado(question), y)

    // Comando
    if (question.command) {
      checkPage(10)
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      const cmdLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      cmdLines.forEach(line => {
        checkPage(7)
        desenharLinha(doc, line, margin, y, 'bold')
        y += 5.5
      })
      y += 3
      doc.setFont(FONT, 'normal')
    }

    if (question.type === 'multiple-choice') {
      // Alternativas
      doc.setFontSize(10)
      doc.setTextColor(...CINZA_TEXTO)
      y += 2

      ;(question.alternatives || []).forEach(alt => {
        const isSelected = alt.id === answer?.selectedAlternative

        // A fonte entra ANTES da quebra: `wrapText` mede com a fonte ativa, e a
        // marcada sai em negrito — medir em regular dava uma linha a mais de
        // texto do que cabia na largura.
        doc.setFontSize(10)
        doc.setFont(FONT, isSelected ? 'bold' : 'normal')

        const altText = `${alt.letter}) ${cleanText(alt.text)}`
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 16)
        // A tarja tinha 7mm fixos: numa alternativa de duas linhas, a segunda
        // ficava para fora do laranja. Agora ela acompanha o texto.
        const alturaDaTarja = altLines.length * 5.5 + 2.5
        checkPage(alturaDaTarja + 4)

        if (isSelected) {
          doc.setFillColor(...LARANJA_CLARO)
          doc.roundedRect(margin + 2, y - 4, pageWidth - 2 * margin - 4, alturaDaTarja, 1.5, 1.5, 'F')
          doc.setTextColor(...VERDE_ESCURO)
        } else {
          doc.setTextColor(...CINZA_TEXTO)
        }

        // Checkbox
        doc.setDrawColor(...VERDE_MEDIO)
        doc.setLineWidth(0.4)
        doc.roundedRect(margin + 4, y - 3.5, 4.5, 4.5, 1, 1)
        if (isSelected) {
          doc.setFillColor(...VERDE_MEDIO)
          doc.roundedRect(margin + 4, y - 3.5, 4.5, 4.5, 1, 1, 'F')
        }

        altLines.forEach((line, li) => {
          if (li > 0) {
            doc.setFontSize(10)
            doc.setFont(FONT, isSelected ? 'bold' : 'normal')
            doc.setTextColor(isSelected ? VERDE_ESCURO[0] : CINZA_TEXTO[0], isSelected ? VERDE_ESCURO[1] : CINZA_TEXTO[1], isSelected ? VERDE_ESCURO[2] : CINZA_TEXTO[2])
          }
          desenharLinha(doc, line, margin + 12, y, isSelected ? 'bold' : 'normal')
          y += 5.5
        })
        y += 2.5
      })

      // Marcada
      checkPage(8)
      const selectedAlt = question.alternatives.find(a => a.id === answer?.selectedAlternative)
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      doc.text(
        selectedAlt ? `Resposta marcada: ${selectedAlt.letter}` : 'Não respondida',
        margin + 4,
        y
      )
      y += 5
    } else {
      /*
       * Discursiva E redação.
       *
       * O ramo só cobria `discursive`: numa prova com redação, o PDF imprimia o
       * enunciado e passava para a questão seguinte — o texto que o aluno
       * escreveu não aparecia em lugar nenhum do "relatório da minha prova".
       */
      const textoDoAluno = answer?.discursiveText || answer?.essayText

      checkPage(20)
      doc.setFontSize(9)
      doc.setTextColor(...LARANJA)
      doc.setFont(FONT, 'bold')
      doc.text(question.type === 'essay' ? 'Redação do candidato:' : 'Resposta do candidato:', margin, y)
      y += 5

      if (textoDoAluno) {
        doc.setFontSize(10)
        doc.setFont(FONT, 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        const ansLines = wrapText(doc, textoDoAluno, pageWidth - 2 * margin - 4)
        ansLines.forEach(line => {
          checkPage(7)
          doc.text(line, margin + 2, y)
          y += 5.5
        })
      } else {
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text('(Não respondida)', margin + 2, y)
        y += 6
      }

      if (answer?.discursiveSelfScore !== undefined) {
        checkPage(8)
        doc.setFontSize(9)
        doc.setFont(FONT, 'bold')
        doc.setTextColor(...VERDE_ESCURO)
        doc.text(`Autoavaliação: ${answer.discursiveSelfScore}%`, margin + 2, y + 3)
        y += 8
      }
    }

    y += 10
  })

  // === TABELA RESUMO ===
  doc.addPage()
  y = addHeader(doc, pageWidth, margin, 'Resumo das Respostas', logo)

  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont(FONT, 'bold')
  doc.text('RESUMO DAS RESPOSTAS', pageWidth / 2, y + 7, { align: 'center' })
  y += 14

  // Header da tabela
  doc.setFillColor(...LARANJA_CLARO)
  doc.rect(margin, y, 30, 9, 'F')
  doc.rect(margin + 30, y, pageWidth - 2 * margin - 30, 9, 'F')
  doc.setFontSize(9)
  doc.setFont(FONT, 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('Questão', margin + 15, y + 6, { align: 'center' })
  doc.text('Resposta Marcada', margin + 40, y + 6)
  y += 9

  doc.setFont(FONT, 'normal')
  data.exam.questions.forEach((question, index) => {
    const answer = data.answers.find(a => a.questionId === question.id)
    const selectedAlt = question.alternatives?.find(alt => alt.id === answer?.selectedAlternative)

    checkPage(8)

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F')
    }

    doc.setTextColor(...CINZA_TEXTO)
    doc.setFontSize(9)
    doc.text(`${question.number}`, margin + 15, y + 5, { align: 'center' })

    if (question.type === 'multiple-choice') {
      doc.text(selectedAlt ? selectedAlt.letter : 'Não respondida', margin + 40, y + 5)
    } else {
      // Discursiva e redação: a tabela dizia "Não respondida" para toda redação,
      // porque só olhava `discursiveText`.
      const respondeu = !!(answer?.discursiveText?.trim() || answer?.essayText?.trim())
      doc.text(respondeu ? 'Respondida' : 'Não respondida', margin + 40, y + 5)
    }

    doc.setDrawColor(220, 220, 220)
    doc.rect(margin, y, 30, 7)
    doc.rect(margin + 30, y, pageWidth - 2 * margin - 30, 7)
    y += 7
  })

  // === RODAPÉS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages, pageWidth, pageHeight, margin, `Relatório de ${data.userName}`)
  }

  return doc.output('blob')
}

/**
 * RELATÓRIO COM GABARITO
 * Mostra respostas do aluno + gabarito + respostas comentadas
 */
async function generateUserReportWithGabaritoPDFBlob(data: UserReportData): Promise<Blob> {
  const [imageMap, logo] = await Promise.all([prefetchImages(data.exam.questions), carregarLogo()])
  const doc = new jsPDF()
  FONT = await registrarFontes(doc)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  // Última coordenada utilizável da página: abaixo daqui é rodapé. Uma
  // constante só, para o `checkPage` e o fatiamento da resposta comentada não
  // divergirem sobre onde a página acaba.
  const limiteInferior = pageHeight - 25

  const checkPage = (needed: number) => {
    if (y + needed > limiteInferior) {
      doc.addPage()
      y = addHeader(doc, pageWidth, margin, 'Relatório com Gabarito', logo)
      return true
    }
    return false
  }

  const desenharImagens = criarDesenhoDeImagens(doc, imageMap, pageWidth, pageHeight, margin, logo, 'Relatório com Gabarito')

  // === CABEÇALHO ===
  y = addHeader(doc, pageWidth, margin, 'Relatório com Gabarito', logo)
  // O cabeçalho tem altura fixa: toda página nova recomeça daqui.
  const yAposCabecalho = y

  // === TÍTULO ===
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont(FONT, 'bold')
  doc.text(data.exam.title, pageWidth / 2, y + 13, { align: 'center', maxWidth: pageWidth - 2 * margin - 10 })
  y += 28

  // === INFO ===
  doc.setFillColor(...CINZA_CLARO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'F')
  doc.setFontSize(10)
  doc.setFont(FONT, 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('Candidato: ' + data.userName, margin + 5, y + 8)
  doc.setFont(FONT, 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} | Questões: ${data.exam.numberOfQuestions}`, margin + 5, y + 16)
  y += 28

  // === SCORE SUMMARY ===
  const mcQuestions = data.exam.questions.filter(q => q.type === 'multiple-choice')
  let mcCorrect = 0
  mcQuestions.forEach(q => {
    const answer = data.answers.find(a => a.questionId === q.id)
    const correctAlt = q.alternatives.find(a => a.isCorrect)
    if (correctAlt && answer?.selectedAlternative === correctAlt.id) mcCorrect++
  })
  const mcPercentage = mcQuestions.length > 0 ? Math.round((mcCorrect / mcQuestions.length) * 100) : 0

  if (mcQuestions.length > 0) {
    const scoreColor: [number, number, number] = mcPercentage >= 70 ? [34, 197, 94] : mcPercentage >= 40 ? [234, 179, 8] : [239, 68, 68]

    doc.setFillColor(...scoreColor)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont(FONT, 'bold')
    doc.text(`RESULTADO: ${mcCorrect}/${mcQuestions.length} objetivas corretas (${mcPercentage}%)`, pageWidth / 2, y + 12, { align: 'center' })
    y += 26
  }

  // === QUESTÕES COM GABARITO ===
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont(FONT, 'bold')
  doc.text('QUESTÕES + GABARITO', pageWidth / 2, y + 7, { align: 'center' })
  y += 16

  data.exam.questions.forEach((question) => {
    const answer = data.answers.find(a => a.questionId === question.id)

    checkPage(60)

    const correctAlt = question.alternatives.find(a => a.isCorrect)
    const selectedAlt = question.alternatives.find(a => a.id === answer?.selectedAlternative)
    const isCorrect = question.type === 'multiple-choice' && correctAlt?.id === answer?.selectedAlternative

    // Header da questão com cor de acerto/erro
    const headerColor: [number, number, number] = question.type === 'discursive'
      ? [139, 92, 246]  // violet
      : isCorrect ? [34, 197, 94] : [239, 68, 68]

    doc.setFillColor(...headerColor)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(FONT, 'bold')

    // Sem `✓`/`✗` no texto: a tarja já é verde ou vermelha, e o símbolo aqui
    // corria o mesmo risco de soletrar a linha que o das alternativas.
    let headerText = `Questão ${question.number}`
    if (question.type === 'multiple-choice') {
      headerText += isCorrect ? '  ·  CORRETA' : '  ·  INCORRETA'
    } else {
      headerText += '  (Discursiva)'
    }
    doc.text(headerText, margin + 5, y + 7)

    if (question.type === 'multiple-choice' && selectedAlt) {
      doc.text(`Sua: ${selectedAlt.letter} | Gabarito: ${correctAlt?.letter || '-'}`, pageWidth - margin - 5, y + 7, { align: 'right' })
    }
    y += 14

    // Enunciado
    if (question.statement) {
      doc.setFontSize(10)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach(line => {
        checkPage(7)
        doc.text(line, margin, y)
        y += 5.5
      })
      y += 3
    }

    // Imagens do enunciado
    y = desenharImagens(blocoDoEnunciado(question), y)

    // Comando
    if (question.command) {
      checkPage(10)
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      const cmdLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      cmdLines.forEach(line => {
        checkPage(7)
        doc.text(line, margin, y)
        y += 5.5
      })
      y += 3
    }

    if (question.type === 'multiple-choice') {
      // Alternativas com indicação de correta/errada
      doc.setFontSize(10)
      y += 2

      /*
       * As alternativas, com o mesmo desenho dos PDFs de /provas.
       *
       * Aqui havia três defeitos encavalados, e o mais visível era o `✓` no
       * começo do texto: fora do WinAnsi, ele fazia o jsPDF reescrever a linha
       * inteira em UTF-16 e soletrar a alternativa correta. O certo/errado
       * agora é DESENHADO (círculo com traços), fora do texto, então não
       * depende de glifo nem entra na conta da largura.
       *
       * Os outros dois: a tarja tinha 7mm fixos, e uma alternativa de duas
       * linhas ficava com a segunda para fora do verde; e a quebra era medida
       * com a largura errada — `wrapText` roda depois do `setFont`, para medir
       * exatamente a fonte que vai desenhar.
       */
      ;(question.alternatives || []).forEach(alt => {
        const isSelected = alt.id === answer?.selectedAlternative
        const isCorrectAlt = alt.isCorrect

        doc.setFontSize(10)
        doc.setFont(FONT, isCorrectAlt || isSelected ? 'bold' : 'normal')

        const altText = `${alt.letter}) ${cleanText(alt.text)}`
        // A margem esquerda de 14mm é a marca (círculo) mais o respiro; a
        // direita mantém o texto dentro da tarja.
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 18)
        const alturaDaTarja = altLines.length * 5.5 + 3

        checkPage(alturaDaTarja + 4)

        if (isCorrectAlt) {
          doc.setFillColor(220, 245, 225)
          doc.setDrawColor(...VERDE_MEDIO)
          doc.setLineWidth(0.5)
          doc.roundedRect(margin + 1, y - 4, pageWidth - 2 * margin - 2, alturaDaTarja, 1.5, 1.5, 'FD')
        } else if (isSelected) {
          doc.setFillColor(254, 226, 226)
          doc.setDrawColor(220, 38, 38)
          doc.setLineWidth(0.5)
          doc.roundedRect(margin + 1, y - 4, pageWidth - 2 * margin - 2, alturaDaTarja, 1.5, 1.5, 'FD')
        }

        if (isCorrectAlt) marcarCerto(doc, margin + 5.5, y - 1.5)
        else if (isSelected) marcarErrado(doc, margin + 5.5, y - 1.5)
        else marcarNeutro(doc, margin + 5.5, y - 1.5)

        // `marcar*` mexe em cores de traço e preenchimento, não na do texto —
        // mas a fonte e a cor voltam explícitas para a linha não herdar o
        // estado da alternativa anterior.
        doc.setFont(FONT, isCorrectAlt || isSelected ? 'bold' : 'normal')
        doc.setFontSize(10)
        if (isCorrectAlt) doc.setTextColor(22, 101, 52)
        else if (isSelected) doc.setTextColor(153, 27, 27)
        else doc.setTextColor(...CINZA_TEXTO)

        altLines.forEach((line) => {
          doc.text(line, margin + 11, y)
          y += 5.5
        })
        y += 3
      })
    } else if (question.type === 'discursive') {
      // Resposta do aluno
      checkPage(15)
      doc.setFontSize(9)
      doc.setTextColor(...LARANJA)
      doc.setFont(FONT, 'bold')
      doc.text('Resposta do candidato:', margin, y)
      y += 5

      if (answer?.discursiveText) {
        doc.setFontSize(10)
        doc.setFont(FONT, 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        const ansLines = wrapText(doc, answer.discursiveText, pageWidth - 2 * margin - 4)
        ansLines.forEach(line => {
          checkPage(7)
          doc.text(line, margin + 2, y)
          y += 5.5
        })
      } else {
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text('(Não respondida)', margin + 2, y)
        y += 6
      }

      // Self score
      if (answer?.discursiveSelfScore !== undefined) {
        checkPage(8)
        y += 2
        doc.setFontSize(10)
        doc.setFont(FONT, 'bold')
        doc.setTextColor(139, 92, 246) // violet
        doc.text(`Nota auto-atribuída: ${answer.discursiveSelfScore}%`, margin, y)
        y += 6
      }
    }

    /*
     * Resposta Comentada, em tantas caixas quantas forem as páginas.
     *
     * Era uma caixa só, com a altura calculada a partir de TODAS as linhas de
     * uma vez. O `checkPage` antes dela resolvia o caso de não caber no que
     * sobrou da página — mas não o de não caber em página NENHUMA: uma
     * explicação mais alta que a folha era desenhada inteira mesmo assim, e o
     * jsPDF não recorta nem avisa: o que passava do fim da página
     * simplesmente sumia. As respostas comentadas longas (a maioria, aqui)
     * chegavam ao aluno cortadas no meio da frase.
     *
     * `fatiarCaixaEmPaginas` decide onde o texto quebra; aqui só se desenha o
     * que ela mandar. O título só sai no primeiro lote, e os seguintes entram
     * com um respiro menor no topo, para se lerem como continuação.
     */
    // `montarRespostaComentada` e não `question.explanation`: nas provas cujo
    // comentário está por alternativa (as geradas com feedback e as sorteadas
    // do Banco), o campo avulso é vazio, e este relatório entregava ao aluno
    // uma caixa "RESPOSTA COMENTADA" em branco. É a mesma montagem do PDF de
    // gabarito comentado de /provas.
    const respostaComentada = montarRespostaComentada(question)
    if (respostaComentada) {
      // A fonte é definida ANTES do `wrapText`: ele mede com a fonte ativa, e
      // medir em corpo 10 o texto que sai em 9 dá uma quebra que não é a que
      // vai para o papel.
      doc.setFontSize(9)
      doc.setFont(FONT, 'normal')
      const expLines = wrapText(doc, respostaComentada, pageWidth - 2 * margin - 12)

      if (expLines.length > 0) {
        y += 3

        const alturaDaLinha = 5
        const alturaDoTitulo = 14 // título em y+8, primeira linha em y+14
        const respiroDeContinuacao = 6
        const respiroInferior = 5

        const lotes = fatiarCaixaEmPaginas({
          totalDeLinhas: expLines.length,
          alturaDaLinha,
          alturaDoTitulo,
          respiroDeContinuacao,
          respiroInferior,
          yInicial: y,
          limiteInferior,
          yAposQuebra: yAposCabecalho,
        })

        for (const lote of lotes) {
          if (lote.novaPagina) {
            doc.addPage()
            addHeader(doc, pageWidth, margin, 'Relatório com Gabarito', logo)
          }
          y = lote.y

          // Box amarelo com resposta comentada
          doc.setFillColor(255, 251, 235) // amber-50
          doc.setDrawColor(...LARANJA)
          doc.setLineWidth(0.5)
          doc.roundedRect(margin, y, pageWidth - 2 * margin, lote.altura, 2, 2, 'FD')

          if (lote.primeiro) {
            doc.setFontSize(9)
            doc.setFont(FONT, 'bold')
            doc.setTextColor(...LARANJA)
            doc.text('RESPOSTA COMENTADA', margin + 5, y + 8)
            y += alturaDoTitulo
          } else {
            y += respiroDeContinuacao
          }

          doc.setFontSize(9)
          doc.setFont(FONT, 'normal')
          doc.setTextColor(...CINZA_TEXTO)
          for (const line of expLines.slice(lote.inicio, lote.inicio + lote.linhas)) {
            desenharLinha(doc, line, margin + 5, y)
            y += alturaDaLinha
          }

          y += respiroInferior
        }

        y += 5
      }
    }

    // As imagens da resposta comentada, logo depois da caixa amarela.
    y = desenharImagens(blocoDaResposta(question), y, {
      recuo: 4,
      alturaMaxima: ALTURA_MAXIMA_DA_IMAGEM * 0.8,
    })

    y += 8
  })

  // === GABARITO GRID ===
  doc.addPage()
  y = addHeader(doc, pageWidth, margin, 'Gabarito Oficial', logo)

  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont(FONT, 'bold')
  doc.text('GABARITO', pageWidth / 2, y + 7, { align: 'center' })
  y += 16

  // Grid 5 colunas
  const columns = 5
  const columnWidth = (pageWidth - 2 * margin) / columns
  let currentCol = 0
  let currentRow = 0
  const rowHeight = 12

  const mcOnly = data.exam.questions.filter(q => q.type === 'multiple-choice')
  mcOnly.forEach((question, index) => {
    if (y + currentRow * rowHeight + rowHeight > pageHeight - 25) {
      doc.addPage()
      y = addHeader(doc, pageWidth, margin, 'Gabarito Oficial', logo)
      currentRow = 0
      currentCol = 0
    }

    const correctAlternative = question.alternatives.find(alt => alt.isCorrect)
    const answerObj = data.answers.find(a => a.questionId === question.id)
    const isCorrect = correctAlternative?.id === answerObj?.selectedAlternative

    const x = margin + currentCol * columnWidth
    const cellY = y + currentRow * rowHeight

    // Background
    if (isCorrect) {
      doc.setFillColor(220, 252, 231) // green
    } else {
      doc.setFillColor(254, 226, 226) // red
    }
    doc.rect(x, cellY - 7, columnWidth - 2, rowHeight, 'F')

    // Número
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    doc.setFont(FONT, 'normal')
    doc.text(`${question.number}.`, x + 3, cellY)

    // Resposta correta
    doc.setTextColor(...VERDE_ESCURO)
    doc.setFontSize(11)
    doc.setFont(FONT, 'bold')
    doc.text(correctAlternative?.letter || '-', x + 14, cellY)

    currentCol++
    if (currentCol >= columns) {
      currentCol = 0
      currentRow++
    }
  })

  // === RODAPÉS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages, pageWidth, pageHeight, margin, `Relatório com Gabarito - ${data.userName}`)
  }

  return doc.output('blob')
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
