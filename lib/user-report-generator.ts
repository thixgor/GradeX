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

async function prefetchImages(questions: { imageUrl?: string }[]): Promise<Map<string, ImgData>> {
  return carregarImagens(questions.map((q) => q.imageUrl))
}

// Helper: replace \nl and \n with newlines
// O sanitizador entra aqui, no funil por onde passa todo texto vindo da prova:
// com a Roboto ativa ele é um no-op, e sem ela é o que impede um `≥` ou um `→`
// perdido no enunciado de soletrar a linha inteira.
function cleanText(text: string): string {
  return sanitizarParaPdf(text?.replace(/\\nl/g, '\n').replace(/\\n/g, '\n') || '')
}

// Custom text wrapping
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return []
  const cleaned = cleanText(text)
  const paragraphs = cleaned.split(/\n/)
  const allLines: string[] = []

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      allLines.push('')
      continue
    }
    const words = paragraph.split(' ')
    let currentLine = ''
    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word
      if (doc.getTextWidth(testLine) > maxWidth && currentLine) {
        allLines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) allLines.push(currentLine)
  }
  return allLines
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
        doc.text(line, margin, y)
        y += 5.5
      })
      y += 3
    }

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
      doc.setFont(FONT, 'normal')
    }

    if (question.type === 'multiple-choice') {
      // Alternativas
      doc.setFontSize(10)
      doc.setTextColor(...CINZA_TEXTO)
      y += 2

      ;(question.alternatives || []).forEach(alt => {
        checkPage(12)
        const isSelected = alt.id === answer?.selectedAlternative

        if (isSelected) {
          doc.setFillColor(...LARANJA_CLARO)
          doc.roundedRect(margin + 2, y - 4, pageWidth - 2 * margin - 4, 7, 1, 1, 'F')
          doc.setFont(FONT, 'bold')
          doc.setTextColor(...VERDE_ESCURO)
        } else {
          doc.setFont(FONT, 'normal')
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

        const altText = `${alt.letter}) ${cleanText(alt.text)}`
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 16)
        altLines.forEach((line, li) => {
          if (li > 0) checkPage(6)
          doc.text(line, margin + 12, y)
          y += 5.5
        })
        y += 2
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

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addHeader(doc, pageWidth, margin, 'Relatório com Gabarito', logo)
      return true
    }
    return false
  }

  // === CABEÇALHO ===
  y = addHeader(doc, pageWidth, margin, 'Relatório com Gabarito', logo)

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

    // Imagem da questão
    if (question.imageUrl) {
      const imgData = imageMap.get(question.imageUrl)
      if (imgData) {
        const maxW = pageWidth - 2 * margin - 10
        const maxH = 75
        const ratio = Math.min(maxW / imgData.width, maxH / imgData.height, 1)
        const imgW = imgData.width * ratio
        const imgH = imgData.height * ratio
        checkPage(imgH + 8)
        try {
          doc.addImage(imgData.dataUrl, 'PNG', margin + 5, y, imgW, imgH)
          y += imgH + 4
        } catch { /* skip */ }
      }
      if (question.imageSource) {
        doc.setFontSize(7)
        doc.setTextColor(120, 120, 120)
        doc.text(`Fonte: ${question.imageSource}`, margin + 5, y)
        y += 5
      }
    }

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

    // Resposta Comentada
    if (question.explanation) {
      checkPage(20)
      y += 3

      // Box amarelo com resposta comentada
      doc.setFillColor(255, 251, 235) // amber-50
      doc.setDrawColor(...LARANJA)
      doc.setLineWidth(0.5)

      const expLines = wrapText(doc, question.explanation, pageWidth - 2 * margin - 12)
      const boxHeight = Math.max(expLines.length * 5.5 + 14, 20)

      checkPage(boxHeight + 5)
      doc.roundedRect(margin, y, pageWidth - 2 * margin, boxHeight, 2, 2, 'FD')

      doc.setFontSize(9)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...LARANJA)
      doc.text('RESPOSTA COMENTADA', margin + 5, y + 8)

      doc.setFontSize(9)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      let expY = y + 14
      expLines.forEach(line => {
        doc.text(line, margin + 5, expY)
        expY += 5
      })

      y += boxHeight + 5
    }

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
