import jsPDF from 'jspdf'
import { Exam, Question } from './types'

export function generateGabaritoPDF(exam: Exam): Blob {
  const doc = new jsPDF()

  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  // Função auxiliar para adicionar nova página se necessário
  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // Título
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('GABARITO', pageWidth / 2, y, { align: 'center' })
  y += 15

  // Título da prova
  doc.setFontSize(16)
  doc.text(exam.title, pageWidth / 2, y, { align: 'center' })
  y += 10

  if (exam.description) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const descLines = doc.splitTextToSize(exam.description, pageWidth - 2 * margin)
    doc.text(descLines, pageWidth / 2, y, { align: 'center' })
    y += descLines.length * 5 + 5
  }

  y += 10

  // Respostas
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Respostas:', margin, y)
  y += 10

  doc.setFont('helvetica', 'normal')

  exam.questions.forEach((question: Question, index: number) => {
    checkPage(10)

    const correctAlternative = question.alternatives.find(alt => alt.isCorrect)
    const answerLetter = correctAlternative?.letter || '-'

    doc.text(`${question.number}. ${answerLetter}`, margin + 10, y)

    // Organizar em colunas
    if ((index + 1) % 3 === 0) {
      y += 8
    } else {
      // Não incrementar y, apenas mover x (será sobrescrito na próxima iteração)
    }
  })

  y += 20

  if (exam.scoringMethod === 'tri') {
    checkPage(40)
    doc.setFont('helvetica', 'bold')
    doc.text('Método de Pontuação: TRI (Teoria de Resposta ao Item)', margin, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.text('Pontuação máxima: 1000 pontos', margin, y)
    y += 6
    doc.setFontSize(10)
    doc.text('A nota será calculada após o término da prova considerando:', margin, y)
    y += 5
    doc.text('- Dificuldade de cada questão', margin + 5, y)
    y += 5
    doc.text('- Discriminação (capacidade da questão)', margin + 5, y)
    y += 5
    doc.text('- Probabilidade de acerto ao acaso', margin + 5, y)
  } else {
    checkPage(20)
    doc.setFont('helvetica', 'bold')
    doc.text(`Método de Pontuação: Normal`, margin, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.text(`Pontuação máxima: ${exam.totalPoints} pontos`, margin, y)
    y += 6
    const pointsPerQuestion = (exam.totalPoints || 100) / exam.numberOfQuestions
    doc.text(`Cada questão vale: ${pointsPerQuestion.toFixed(2)} pontos`, margin, y)
  }

  return doc.output('blob')
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
