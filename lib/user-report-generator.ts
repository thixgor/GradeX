import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Exam, UserAnswer } from './types'

interface UserReportData {
  exam: Exam
  examId: string
  userName: string
  signature: string // base64 image
  answers: UserAnswer[]
}

// Cores DomineAqui
const VERDE_ESCURO: [number, number, number] = [26, 71, 42]
const VERDE_MEDIO: [number, number, number] = [70, 129, 82]
const LARANJA: [number, number, number] = [226, 164, 62]
const LARANJA_CLARO: [number, number, number] = [245, 216, 154]
const CINZA_TEXTO: [number, number, number] = [51, 51, 51]
const CINZA_CLARO: [number, number, number] = [245, 245, 245]

// Fetch image URL and return base64 data URL + natural dimensions
async function fetchImageAsBase64(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    return await new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) { resolve(null); return }
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/png')
          resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight })
        } catch { resolve(null) }
      }
      img.onerror = () => resolve(null)
      setTimeout(() => resolve(null), 8000)
      img.src = url
    })
  } catch { return null }
}

// Pre-fetch all question images
async function prefetchImages(questions: { imageUrl?: string }[]): Promise<Map<string, { dataUrl: string; width: number; height: number }>> {
  const imageMap = new Map<string, { dataUrl: string; width: number; height: number }>()
  const fetches = questions
    .filter(q => q.imageUrl)
    .map(async (q) => {
      const result = await fetchImageAsBase64(q.imageUrl!)
      if (result) imageMap.set(q.imageUrl!, result)
    })
  await Promise.all(fetches)
  return imageMap
}

// Helper: replace \nl and \n with newlines
function cleanText(text: string): string {
  return text?.replace(/\\nl/g, '\n').replace(/\\n/g, '\n') || ''
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

// Header padrão DomineAqui
function addHeader(doc: jsPDF, pageWidth: number, margin: number, subtitle: string): number {
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setFillColor(...LARANJA)
  doc.rect(pageWidth - 60, 0, 60, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('DomineAqui', margin, 14)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle, margin, 22)

  doc.setFontSize(8)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('www.domineaqui.com.br', pageWidth - margin - 35, 16)

  return 38
}

// Footer padrão
function addFooter(doc: jsPDF, pageNum: number, totalPages: number, pageWidth: number, pageHeight: number, margin: number, extraText?: string) {
  const footerY = pageHeight - 12
  doc.setFillColor(...CINZA_CLARO)
  doc.rect(0, footerY - 5, pageWidth, 17, 'F')

  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(1)
  doc.line(0, footerY - 5, pageWidth * 0.7, footerY - 5)
  doc.setDrawColor(...LARANJA)
  doc.line(pageWidth * 0.7, footerY - 5, pageWidth, footerY - 5)

  doc.setFontSize(8)
  doc.setTextColor(70, 70, 70)
  doc.setFont('helvetica', 'bold')
  doc.text('DomineAqui', margin, footerY + 2)
  doc.setFont('helvetica', 'normal')
  doc.text(' - www.domineaqui.com.br', margin + 18, footerY + 2)
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin - 20, footerY + 2)

  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const centerText = extraText || `Gerado em ${dataGeracao} | Seja o Foco. Seja a Referência.`
  doc.text(centerText, pageWidth / 2, footerY + 2, { align: 'center' })
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
  const imageMap = await prefetchImages(data.exam.questions)
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addHeader(doc, pageWidth, margin, 'Relatório de Prova')
      return true
    }
    return false
  }

  // === CABEÇALHO ===
  y = addHeader(doc, pageWidth, margin, 'Relatório de Prova')

  // === TÍTULO DA PROVA ===
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  const titleLines = wrapText(doc, data.exam.title, pageWidth - 2 * margin - 10)
  doc.text(titleLines[0] || data.exam.title, pageWidth / 2, y + 13, { align: 'center' })
  y += 28

  // === INFO DO CANDIDATO ===
  doc.setFillColor(...CINZA_CLARO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 30, 2, 2, 'F')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  doc.text('Candidato:', margin + 5, y + 8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(data.userName, margin + 30, y + 8)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  doc.text('Data:', margin + 5, y + 16)
  doc.text(new Date().toLocaleDateString('pt-BR'), margin + 18, y + 16)

  doc.text(`Questões: ${data.exam.numberOfQuestions}`, margin + 5, y + 24)
  doc.text(`Duração: ${data.exam.duration} min`, margin + 60, y + 24)
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
  doc.setFont('helvetica', 'bold')
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
    doc.setFont('helvetica', 'bold')
    doc.text(`Questão ${question.number}`, margin + 5, y + 6.5)
    y += 13

    // Enunciado
    if (question.statement) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
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
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      const cmdLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      cmdLines.forEach(line => {
        checkPage(7)
        doc.text(line, margin, y)
        y += 5.5
      })
      y += 3
      doc.setFont('helvetica', 'normal')
    }

    if (question.type === 'multiple-choice') {
      // Alternativas
      doc.setFontSize(10)
      doc.setTextColor(...CINZA_TEXTO)
      y += 2

      question.alternatives.forEach(alt => {
        checkPage(12)
        const isSelected = alt.id === answer?.selectedAlternative

        if (isSelected) {
          doc.setFillColor(...LARANJA_CLARO)
          doc.roundedRect(margin + 2, y - 4, pageWidth - 2 * margin - 4, 7, 1, 1, 'F')
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...VERDE_ESCURO)
        } else {
          doc.setFont('helvetica', 'normal')
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
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      doc.text(
        selectedAlt ? `Resposta marcada: ${selectedAlt.letter}` : 'Não respondida',
        margin + 4,
        y
      )
      y += 5
    } else if (question.type === 'discursive') {
      checkPage(20)
      doc.setFontSize(9)
      doc.setTextColor(...LARANJA)
      doc.setFont('helvetica', 'bold')
      doc.text('Resposta do candidato:', margin, y)
      y += 5

      if (answer?.discursiveText) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
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
    }

    y += 10
  })

  // === TABELA RESUMO ===
  doc.addPage()
  y = addHeader(doc, pageWidth, margin, 'Resumo das Respostas')

  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMO DAS RESPOSTAS', pageWidth / 2, y + 7, { align: 'center' })
  y += 14

  // Header da tabela
  doc.setFillColor(...LARANJA_CLARO)
  doc.rect(margin, y, 30, 9, 'F')
  doc.rect(margin + 30, y, pageWidth - 2 * margin - 30, 9, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('Questão', margin + 15, y + 6, { align: 'center' })
  doc.text('Resposta Marcada', margin + 40, y + 6)
  y += 9

  doc.setFont('helvetica', 'normal')
  data.exam.questions.forEach((question, index) => {
    const answer = data.answers.find(a => a.questionId === question.id)
    const selectedAlt = question.alternatives.find(alt => alt.id === answer?.selectedAlternative)

    checkPage(8)

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F')
    }

    doc.setTextColor(...CINZA_TEXTO)
    doc.setFontSize(9)
    doc.text(`${question.number}`, margin + 15, y + 5, { align: 'center' })

    if (question.type === 'discursive') {
      doc.text(answer?.discursiveText ? 'Respondida' : 'Não respondida', margin + 40, y + 5)
    } else {
      doc.text(selectedAlt ? selectedAlt.letter : 'Não respondida', margin + 40, y + 5)
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
  const imageMap = await prefetchImages(data.exam.questions)
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addHeader(doc, pageWidth, margin, 'Relatório com Gabarito')
      return true
    }
    return false
  }

  // === CABEÇALHO ===
  y = addHeader(doc, pageWidth, margin, 'Relatório com Gabarito')

  // === TÍTULO ===
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(data.exam.title, pageWidth / 2, y + 13, { align: 'center', maxWidth: pageWidth - 2 * margin - 10 })
  y += 28

  // === INFO ===
  doc.setFillColor(...CINZA_CLARO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('Candidato: ' + data.userName, margin + 5, y + 8)
  doc.setFont('helvetica', 'normal')
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
    doc.setFont('helvetica', 'bold')
    doc.text(`RESULTADO: ${mcCorrect}/${mcQuestions.length} objetivas corretas (${mcPercentage}%)`, pageWidth / 2, y + 12, { align: 'center' })
    y += 26
  }

  // === QUESTÕES COM GABARITO ===
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
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
    doc.setFont('helvetica', 'bold')

    let headerText = `Questão ${question.number}`
    if (question.type === 'multiple-choice') {
      headerText += isCorrect ? '  ✓ CORRETA' : '  ✗ INCORRETA'
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
      doc.setFont('helvetica', 'normal')
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
      doc.setFont('helvetica', 'bold')
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

      question.alternatives.forEach(alt => {
        checkPage(12)
        const isSelected = alt.id === answer?.selectedAlternative
        const isCorrectAlt = alt.isCorrect

        // Background
        if (isCorrectAlt) {
          doc.setFillColor(220, 252, 231) // green-100
          doc.roundedRect(margin + 2, y - 4, pageWidth - 2 * margin - 4, 7, 1, 1, 'F')
        } else if (isSelected) {
          doc.setFillColor(254, 226, 226) // red-100
          doc.roundedRect(margin + 2, y - 4, pageWidth - 2 * margin - 4, 7, 1, 1, 'F')
        }

        if (isCorrectAlt) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(22, 101, 52) // green-800
        } else if (isSelected) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(153, 27, 27) // red-800
        } else {
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...CINZA_TEXTO)
        }

        const prefix = isCorrectAlt ? '✓ ' : isSelected ? '✗ ' : '  '
        const altText = `${prefix}${alt.letter}) ${cleanText(alt.text)}`
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 8)
        altLines.forEach((line, li) => {
          if (li > 0) checkPage(6)
          doc.text(line, margin + 4, y)
          y += 5.5
        })
        y += 2
      })
    } else if (question.type === 'discursive') {
      // Resposta do aluno
      checkPage(15)
      doc.setFontSize(9)
      doc.setTextColor(...LARANJA)
      doc.setFont('helvetica', 'bold')
      doc.text('Resposta do candidato:', margin, y)
      y += 5

      if (answer?.discursiveText) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
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
        doc.setFont('helvetica', 'bold')
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
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...LARANJA)
      doc.text('RESPOSTA COMENTADA', margin + 5, y + 8)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
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
  y = addHeader(doc, pageWidth, margin, 'Gabarito Oficial')

  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
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
      y = addHeader(doc, pageWidth, margin, 'Gabarito Oficial')
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
    doc.setFont('helvetica', 'normal')
    doc.text(`${question.number}.`, x + 3, cellY)

    // Resposta correta
    doc.setTextColor(...VERDE_ESCURO)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
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
