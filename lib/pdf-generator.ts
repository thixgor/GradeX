import jsPDF from 'jspdf'
import { Exam, Question } from './types'

export function generateGabaritoPDF(exam: Exam): Blob {
  const doc = new jsPDF()

  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  // Cores
  const primaryColor = [147, 51, 234] // Roxo
  const secondaryColor = [59, 130, 246] // Azul
  const grayColor = [156, 163, 175] // Cinza
  const lightGray = [243, 244, 246] // Cinza claro

  // Função auxiliar para adicionar nova página se necessário
  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
      return true
    }
    return false
  }

  // === CABEÇALHO ===
  // Retângulo de fundo roxo
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Logo/Marca
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('GradeX', pageWidth / 2, 20, { align: 'center' })

  // Subtítulo GABARITO OFICIAL
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('GABARITO OFICIAL', pageWidth / 2, 32, { align: 'center' })

  y = 55

  // === INFORMAÇÕES DA PROVA ===
  // Box com título da prova
  doc.setDrawColor(...grayColor)
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(exam.title, pageWidth / 2, y + 13, { align: 'center' })

  y += 28

  // Descrição se existir
  if (exam.description) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    const descLines = doc.splitTextToSize(exam.description, pageWidth - 2 * margin)
    doc.text(descLines, pageWidth / 2, y, { align: 'center' })
    y += descLines.length * 5 + 8
  }

  // Informações em duas colunas
  const colWidth = (pageWidth - 2 * margin - 10) / 2

  // Coluna 1
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, y, colWidth, 25, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  doc.setFont('helvetica', 'normal')
  doc.text('TOTAL DE QUESTÕES', margin + 5, y + 8)
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(exam.numberOfQuestions.toString(), margin + 5, y + 19)

  // Coluna 2
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin + colWidth + 10, y, colWidth, 25, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  doc.setFont('helvetica', 'normal')
  doc.text('PONTUAÇÃO', margin + colWidth + 15, y + 8)
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(
    exam.scoringMethod === 'tri' ? '1000 pontos (TRI)' : `${exam.totalPoints} pontos`,
    margin + colWidth + 15,
    y + 19
  )

  y += 35

  // === RESPOSTAS ===
  doc.setFillColor(...primaryColor)
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('GABARITO', pageWidth / 2, y + 6, { align: 'center' })

  y += 15

  // Grid de respostas (5 colunas)
  const columns = 5
  const columnWidth = (pageWidth - 2 * margin) / columns
  let currentCol = 0
  let currentRow = 0
  const rowHeight = 10
  const cellPadding = 2

  exam.questions.forEach((question: Question, index: number) => {
    // Verifica se precisa de nova página
    if (checkPage(rowHeight + 5)) {
      currentRow = 0
      currentCol = 0
    }

    const correctAlternative = question.alternatives.find(alt => alt.isCorrect)
    const answerLetter = correctAlternative?.letter || '-'

    const x = margin + currentCol * columnWidth
    const cellY = y + currentRow * rowHeight

    // Alternar cores de fundo
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(x, cellY - 7, columnWidth, rowHeight, 'F')
    }

    // Número da questão
    doc.setTextColor(...grayColor)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${question.number}.`, x + cellPadding, cellY)

    // Resposta
    doc.setTextColor(...primaryColor)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(answerLetter, x + cellPadding + 8, cellY)

    currentCol++
    if (currentCol >= columns) {
      currentCol = 0
      currentRow++
    }
  })

  // Ajusta y para após o grid
  y += Math.ceil(exam.questions.length / columns) * rowHeight + 15

  // === INFORMAÇÕES ADICIONAIS ===
  checkPage(60)

  // Separador
  doc.setDrawColor(...grayColor)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Informações de pontuação
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 45, 2, 2, 'F')

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')

  if (exam.scoringMethod === 'tri') {
    doc.text('SISTEMA DE PONTUAÇÃO: TRI (Teoria de Resposta ao Item)', margin + 5, y + 10)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    doc.text('A pontuação será calculada considerando:', margin + 5, y + 20)
    doc.text('• Dificuldade de cada questão (parâmetro b)', margin + 10, y + 27)
    doc.text('• Discriminação da questão (parâmetro a)', margin + 10, y + 33)
    doc.text('• Probabilidade de acerto ao acaso (parâmetro c)', margin + 10, y + 39)
  } else {
    doc.text(`SISTEMA DE PONTUAÇÃO: Normal`, margin + 5, y + 10)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    const pointsPerQuestion = (exam.totalPoints || 100) / exam.numberOfQuestions
    doc.text(`Pontuação máxima: ${exam.totalPoints} pontos`, margin + 5, y + 20)
    doc.text(`Cada questão vale: ${pointsPerQuestion.toFixed(2)} pontos`, margin + 5, y + 27)
    doc.text(`Total de questões: ${exam.numberOfQuestions}`, margin + 5, y + 34)
  }

  y += 55

  // === RODAPÉ ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Linha separadora
    doc.setDrawColor(...grayColor)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    // Texto do rodapé
    doc.setFontSize(8)
    doc.setTextColor(...grayColor)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'Gerado pela plataforma GradeX',
      margin,
      pageHeight - 10
    )
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )

    // Data de geração
    const dataGeracao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    doc.text(
      `Gerado em: ${dataGeracao}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
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
