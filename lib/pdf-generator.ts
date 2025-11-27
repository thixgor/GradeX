import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Exam, Question, UserAnswer } from './types'

// Custom text wrapping function to fix splitTextToSize bug
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return []

  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const testLine = currentLine ? currentLine + ' ' + word : word
    const testWidth = doc.getTextWidth(testLine)

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

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
    const descLines = wrapText(doc, exam.description, pageWidth - 2 * margin)
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

// Gerar PDF da prova para alunos preencherem (client-side com jsPDF)
export function generateExamPDF(exam: Exam, userId?: string): Blob {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  // Função auxiliar para verificar se precisa de nova página
  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
      return true
    }
    return false
  }

  // === CABEÇALHO ===
  doc.setFillColor(147, 51, 234) // Roxo
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(exam.title, pageWidth / 2, 15, { align: 'center' })

  if (exam.description) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(exam.description, pageWidth / 2, 28, { align: 'center' })
  }

  y = 50

  // === INFORMAÇÕES DA PROVA ===
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, y, { align: 'right' })
  y += 5
  doc.text(`Duração: ${exam.duration} minutos`, pageWidth - margin, y, { align: 'right' })
  y += 10

  // === IDENTIFICAÇÃO DO CANDIDATO ===
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('IDENTIFICAÇÃO DO CANDIDATO', margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Nome: _____________________________________________________________', margin, y)
  y += 10

  // Código de barras (se tiver userId)
  if (userId) {
    try {
      // Criar canvas temporário para gerar barcode
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, userId, {
        format: 'CODE128',
        width: 2,
        height: 40,
        displayValue: true,
        fontSize: 12,
      })

      const barcodeImage = canvas.toDataURL('image/png')
      doc.text('Código de Barras:', margin, y)
      y += 5
      doc.addImage(barcodeImage, 'PNG', margin, y, 80, 20)
      y += 25
    } catch (error) {
      console.error('Erro ao gerar barcode:', error)
      doc.text(`Código: ${userId}`, margin, y)
      y += 8
    }
  } else {
    doc.text('Código: ___________________________________________________________', margin, y)
    y += 10
  }

  doc.text('Assinatura: ________________________________________________________', margin, y)
  y += 10

  // Linha divisória
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // === INSTRUÇÕES ===
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('INSTRUÇÕES:', margin, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const instructions = [
    '• Preencha todos os campos de identificação acima.',
    '• Leia atentamente cada questão antes de responder.',
    '• Para questões objetivas, marque apenas UMA alternativa.',
    '• Para questões discursivas, escreva de forma clara e legível.',
    '• Não é permitido rasuras nas respostas.',
  ]

  instructions.forEach(instruction => {
    doc.text(instruction, margin + 2, y)
    y += 5
  })

  y += 5
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // === QUESTÕES ===
  exam.questions.forEach((question, idx) => {
    checkPage(40)

    // Número da questão
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`Questão ${idx + 1}:`, margin, y)
    y += 6

    // Enunciado
    if (question.statement) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPage(10)
        doc.text(line, margin, y)
        y += 5
      })
      y += 2
    }

    // Fonte do enunciado
    if (question.statementSource) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`Fonte: ${question.statementSource}`, margin, y)
      doc.setTextColor(0, 0, 0)
      y += 5
    }

    // URL da imagem
    if (question.imageUrl) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setTextColor(0, 102, 204)
      doc.text(`Imagem: ${question.imageUrl}`, margin, y)
      doc.setTextColor(0, 0, 0)
      y += 5
    }

    // Comando
    if (question.command) {
      checkPage(8)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      const commandLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      commandLines.forEach((line: string) => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 5
      })
      y += 3
    }

    if (question.type === 'multiple-choice') {
      // Alternativas com checkboxes
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      y += 3

      const letters = ['A', 'B', 'C', 'D', 'E']
      question.alternatives.forEach((alt, altIdx) => {
        checkPage(12)

        // Checkbox
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.3)
        doc.rect(margin + 2, y - 3, 4, 4)

        // Alternativa
        const altText = `${letters[altIdx]}) ${alt.text}`
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 10)
        altLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) checkPage(5)
          doc.text(line, margin + 8, y)
          y += 5
        })
        y += 2
      })
    } else if (question.type === 'discursive') {
      // Espaço para resposta discursiva
      checkPage(60)

      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text(`Espaço para resposta (máximo ${question.maxScore} pontos):`, margin, y)
      doc.setTextColor(0, 0, 0)
      y += 6

      // Linhas para escrever
      const numberOfLines = 10
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)

      for (let i = 0; i < numberOfLines; i++) {
        checkPage(10)
        doc.line(margin, y, pageWidth - margin, y)
        y += 6
      }
    }

    y += 8
  })

  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Página ${i} de ${totalPages} - ${exam.title}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}

/**
 * Gera PDF da prova com as respostas do aluno marcadas (sem mostrar gabarito)
 */
export function generateStudentAnswersPDF(exam: Exam, answers: UserAnswer[], userName: string): Blob {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
      return true
    }
    return false
  }

  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(exam.title, pageWidth / 2, 15, { align: 'center' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('RELATÓRIO DE RESPOSTAS', pageWidth / 2, 28, { align: 'center' })

  y = 50

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Aluno: ' + userName, margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text('Data: ' + new Date().toLocaleDateString('pt-BR'), margin, y)
  y += 10

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  exam.questions.forEach((question, idx) => {
    checkPage(40)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Questão ' + (idx + 1) + ':', margin, y)
    y += 6

    if (question.statement) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPage(10)
        doc.text(line, margin, y)
        y += 5
      })
      y += 2
    }

    if (question.statementSource) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Fonte: ' + question.statementSource, margin, y)
      doc.setTextColor(0, 0, 0)
      y += 5
    }

    if (question.command) {
      checkPage(8)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      const commandLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      commandLines.forEach((line: string) => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 5
      })
      y += 3
    }

    const answer = answers.find(a => a.questionId === question.id)

    if (question.type === 'multiple-choice') {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      y += 3

      const letters = ['A', 'B', 'C', 'D', 'E']
      question.alternatives.forEach((alt, altIdx) => {
        checkPage(12)

        const isSelected = answer?.selectedAlternative === alt.id

        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.3)
        doc.rect(margin + 2, y - 3, 4, 4)

        if (isSelected) {
          doc.setFillColor(59, 130, 246)
          doc.rect(margin + 2, y - 3, 4, 4, 'F')
        }

        if (isSelected) {
          doc.setFont('helvetica', 'bold')
        } else {
          doc.setFont('helvetica', 'normal')
        }

        const altText = letters[altIdx] + ') ' + alt.text
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 10)
        altLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) checkPage(5)
          doc.text(line, margin + 8, y)
          y += 5
        })
        y += 2
      })
    } else if (question.type === 'discursive') {
      checkPage(20)

      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text('Sua resposta:', margin, y)
      doc.setTextColor(0, 0, 0)
      y += 6

      if (answer?.discursiveText) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const answerLines = wrapText(doc, answer.discursiveText, pageWidth - 2 * margin - 4)
        answerLines.forEach((line: string) => {
          checkPage(8)
          doc.text(line, margin + 2, y)
          y += 5
        })
      } else {
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text('(Não respondida)', margin + 2, y)
        doc.setTextColor(0, 0, 0)
        y += 5
      }
    }

    y += 8
  })

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'Página ' + i + ' de ' + totalPages + ' - Respostas de ' + userName,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}
