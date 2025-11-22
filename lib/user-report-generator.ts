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

// Função para gerar barcode como base64
function generateBarcodeImage(value: string): string {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, value, {
    format: 'CODE128',
    width: 2,
    height: 50,
    displayValue: true,
    fontSize: 12,
    margin: 10,
  })
  return canvas.toDataURL('image/png')
}

export function generateUserReportPDF(data: UserReportData): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const primaryColor: [number, number, number] = [147, 51, 234] // Purple
  const grayColor: [number, number, number] = [100, 100, 100]
  const lightGray: [number, number, number] = [230, 230, 230]

  // Helper para adicionar nova página
  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage()
      y = margin
      return true
    }
    return false
  }

  // ===== CABEÇALHO =====
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 50, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('GradeX', pageWidth / 2, 25, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('RELATÓRIO DE PROVA', pageWidth / 2, 38, { align: 'center' })

  y = 60

  // ===== TÍTULO DA PROVA =====
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')

  // Título com fundo cinza
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 15, 2, 2, 'F')
  doc.text(data.exam.title, pageWidth / 2, y + 10, { align: 'center', maxWidth: pageWidth - 2 * margin - 10 })

  y += 25

  // ===== INFORMAÇÕES DO CANDIDATO =====
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  // Nome do candidato
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, 'F')
  doc.setTextColor(...grayColor)
  doc.text('Candidato:', margin + 5, y + 8)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(data.userName, margin + 35, y + 8)

  y += 20

  // ===== ASSINATURA =====
  if (data.signature) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...grayColor)
    doc.text('Assinatura Digital:', margin, y)
    y += 5

    try {
      // Adicionar imagem da assinatura
      doc.addImage(data.signature, 'PNG', margin, y, 80, 25)
      y += 30
    } catch (error) {
      console.error('Erro ao adicionar assinatura:', error)
      y += 5
    }
  }

  y += 5

  // ===== BARCODE INDIVIDUAL =====
  try {
    const barcodeValue = `${data.examId}-${data.userName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`
    const barcodeImage = generateBarcodeImage(barcodeValue)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...grayColor)
    doc.text('Código Individual:', margin, y)
    y += 5

    doc.addImage(barcodeImage, 'PNG', margin, y, 100, 30)
    y += 35
  } catch (error) {
    console.error('Erro ao adicionar barcode:', error)
    y += 5
  }

  y += 5

  // ===== SEÇÃO DE QUESTÕES =====
  doc.setFillColor(...primaryColor)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RESPOSTAS', pageWidth / 2, y + 7, { align: 'center' })

  y += 18
  doc.setTextColor(0, 0, 0)

  // Percorrer cada questão
  data.exam.questions.forEach((question, index) => {
    const userAnswer = data.answers.find(a => a.questionId === question.id)
    const selectedAlt = question.alternatives.find(alt => alt.id === userAnswer?.selectedAlternative)

    // Verificar se precisa de nova página
    checkPageBreak(60)

    // Número da questão
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 8, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Questão ${question.number}`, margin + 5, y + 6)

    y += 12

    // Enunciado da questão
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const statementLines = doc.splitTextToSize(question.statement, pageWidth - 2 * margin - 10)
    const statementHeight = statementLines.length * 5

    checkPageBreak(statementHeight + 10)
    doc.text(statementLines, margin + 5, y)
    y += statementHeight + 5

    // Comando
    if (question.command) {
      const commandLines = doc.splitTextToSize(question.command, pageWidth - 2 * margin - 10)
      const commandHeight = commandLines.length * 5

      checkPageBreak(commandHeight + 10)
      doc.setFont('helvetica', 'bold')
      doc.text(commandLines, margin + 5, y)
      y += commandHeight + 5
      doc.setFont('helvetica', 'normal')
    }

    // Alternativas
    question.alternatives.forEach((alt) => {
      const isSelected = alt.id === userAnswer?.selectedAlternative

      checkPageBreak(10)

      // Destacar alternativa selecionada
      if (isSelected) {
        doc.setFillColor(147, 197, 253) // Azul claro
        doc.roundedRect(margin + 5, y - 4, pageWidth - 2 * margin - 10, 7, 1, 1, 'F')
      }

      doc.setFont('helvetica', isSelected ? 'bold' : 'normal')
      doc.setFontSize(9)

      const altText = `${alt.letter}) ${alt.text}`
      const altLines = doc.splitTextToSize(altText, pageWidth - 2 * margin - 15)
      doc.text(altLines, margin + 8, y)

      y += altLines.length * 5 + 2
    })

    // Mostrar resposta marcada
    checkPageBreak(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...primaryColor)
    doc.text(
      selectedAlt ? `✓ Resposta marcada: ${selectedAlt.letter}` : '✗ Não respondida',
      margin + 5,
      y
    )
    doc.setTextColor(0, 0, 0)

    y += 15
  })

  // ===== TABELA RESUMO =====
  checkPageBreak(80)

  doc.addPage()
  y = margin

  doc.setFillColor(...primaryColor)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMO DAS RESPOSTAS', pageWidth / 2, y + 7, { align: 'center' })

  y += 15
  doc.setTextColor(0, 0, 0)

  // Cabeçalho da tabela
  doc.setFillColor(...lightGray)
  doc.rect(margin, y, 40, 10, 'F')
  doc.rect(margin + 40, y, pageWidth - 2 * margin - 40, 10, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Questão', margin + 15, y + 7, { align: 'center' })
  doc.text('Resposta Marcada', margin + 50, y + 7)

  y += 10

  // Linhas da tabela
  doc.setFont('helvetica', 'normal')
  data.exam.questions.forEach((question, index) => {
    const userAnswer = data.answers.find(a => a.questionId === question.id)
    const selectedAlt = question.alternatives.find(alt => alt.id === userAnswer?.selectedAlternative)

    checkPageBreak(8)

    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
    }

    doc.setFontSize(9)
    doc.text(`${question.number}`, margin + 20, y + 6, { align: 'center' })
    doc.text(selectedAlt ? `${selectedAlt.letter}` : 'Não respondida', margin + 50, y + 6)

    // Bordas
    doc.setDrawColor(200, 200, 200)
    doc.rect(margin, y, 40, 8)
    doc.rect(margin + 40, y, pageWidth - 2 * margin - 40, 8)

    y += 8
  })

  // ===== RODAPÉ =====
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...grayColor)
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
    doc.text(
      new Date().toLocaleString('pt-BR'),
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}

export function downloadUserReportPDF(data: UserReportData) {
  const blob = generateUserReportPDF(data)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio-${data.exam.title.replace(/\s+/g, '-').toLowerCase()}-${data.userName.replace(/\s+/g, '-').toLowerCase()}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
