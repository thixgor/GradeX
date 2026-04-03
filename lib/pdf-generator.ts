import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Exam, Question, UserAnswer, QuestionAnnotation, Form, FormBlock } from './types'

// Cores da paleta DomineAqui
const VERDE_ESCURO = [26, 71, 42] as const
const VERDE_MEDIO = [70, 129, 82] as const
const LARANJA = [226, 164, 62] as const
const LARANJA_CLARO = [245, 216, 154] as const
const CINZA_TEXTO = [51, 51, 51] as const
const CINZA_CLARO = [245, 245, 245] as const

// URL da logo oficial do DomineAqui
const LOGO_URL = 'https://i.imgur.com/1QmchqF.png'

// Custom text wrapping function - melhorada para preservar quebras de linha
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return []

  // Replace \nl with actual newlines first
  const cleaned = text.replace(/\\nl/g, '\n')

  // Preservar quebras de linha existentes
  const paragraphs = cleaned.split(/\n/)
  const allLines: string[] = []

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      allLines.push('') // Manter linhas em branco
      continue
    }

    // Para cada parágrafo, quebrar em palavras
    const words = paragraph.split(' ')
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine ? currentLine + ' ' + word : word
      const testWidth = doc.getTextWidth(testLine)

      if (testWidth > maxWidth && currentLine) {
        allLines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      allLines.push(currentLine)
    }
  }

  return allLines
}

// Função para calcular dimensões proporcionais de imagem
function calculateProportionalDimensions(
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // Para imagens de questões, usar um tamanho padrão moderado
  const standardWidth = Math.min(80, maxWidth)
  const standardHeight = Math.min(50, maxHeight)

  return { width: standardWidth, height: standardHeight }
}

// Adiciona header padrão DomineAqui
function addDomineAquiHeader(doc: jsPDF, pageWidth: number, margin: number, subtitle?: string) {
  // Barra superior verde escuro
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Detalhe laranja no canto
  doc.setFillColor(...LARANJA)
  doc.rect(pageWidth - 60, 0, 60, 28, 'F')

  // Logo/Título
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('DomineAqui', margin, 14)

  // Subtítulo
  if (subtitle) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, margin, 22)
  }

  // Link da plataforma
  doc.setFontSize(8)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('www.domineaqui.com.br', pageWidth - margin - 35, 16)

  return 38
}

// Adiciona footer padrão DomineAqui
function addDomineAquiFooter(doc: jsPDF, pageNum: number, totalPages: number, pageWidth: number, pageHeight: number, margin: number, extraText?: string) {
  const footerY = pageHeight - 12

  // Barra de footer
  doc.setFillColor(...CINZA_CLARO)
  doc.rect(0, footerY - 5, pageWidth, 17, 'F')

  // Linha decorativa verde e laranja
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(1)
  doc.line(0, footerY - 5, pageWidth * 0.7, footerY - 5)
  doc.setDrawColor(...LARANJA)
  doc.line(pageWidth * 0.7, footerY - 5, pageWidth, footerY - 5)

  // Texto do footer
  doc.setFontSize(8)
  doc.setTextColor(70, 70, 70)
  doc.setFont('helvetica', 'bold')
  doc.text('DomineAqui', margin, footerY + 2)
  doc.setFont('helvetica', 'normal')
  doc.text(' - www.domineaqui.com.br', margin + 18, footerY + 2)

  // Página
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin - 20, footerY + 2)

  // Data e slogan
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  const centerText = extraText || `Gerado em ${dataGeracao} | Seja o Foco. Seja a Referência.`
  doc.text(centerText, pageWidth / 2, footerY + 2, { align: 'center' })
}

export function generateGabaritoPDF(exam: Exam): Blob {
  const doc = new jsPDF()

  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  // Função auxiliar para adicionar nova página se necessário
  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Gabarito Oficial')
      return true
    }
    return false
  }

  // === CABEÇALHO ===
  y = addDomineAquiHeader(doc, pageWidth, margin, 'Gabarito Oficial')

  // === INFORMAÇÕES DA PROVA ===
  // Box com título da prova
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setFillColor(...CINZA_CLARO)
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
    doc.setTextColor(100, 100, 100)
    const descLines = wrapText(doc, exam.description, pageWidth - 2 * margin)
    doc.text(descLines, pageWidth / 2, y, { align: 'center' })
    y += descLines.length * 5 + 8
  }

  // Informações em duas colunas
  const colWidth = (pageWidth - 2 * margin - 10) / 2

  // Coluna 1 - Total de questões
  doc.setFillColor(...LARANJA_CLARO)
  doc.roundedRect(margin, y, colWidth, 25, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFont('helvetica', 'normal')
  doc.text('TOTAL DE QUESTÕES', margin + 5, y + 8)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(exam.numberOfQuestions.toString(), margin + 5, y + 19)

  // Coluna 2 - Pontuação
  doc.setFillColor(...LARANJA_CLARO)
  doc.roundedRect(margin + colWidth + 10, y, colWidth, 25, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFont('helvetica', 'normal')
  doc.text('PONTUAÇÃO', margin + colWidth + 15, y + 8)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(
    exam.scoringMethod === 'tri' ? '1000 pontos (TRI)' : `${exam.totalPoints} pontos`,
    margin + colWidth + 15,
    y + 19
  )

  y += 35

  // === RESPOSTAS ===
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('GABARITO', pageWidth / 2, y + 7, { align: 'center' })

  y += 18

  // Grid de respostas (5 colunas)
  const columns = 5
  const columnWidth = (pageWidth - 2 * margin) / columns
  let currentCol = 0
  let currentRow = 0
  const rowHeight = 12
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
    } else {
      doc.setFillColor(...LARANJA_CLARO)
    }
    doc.rect(x, cellY - 7, columnWidth - 2, rowHeight, 'F')

    // Número da questão
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${question.number}.`, x + cellPadding, cellY)

    // Resposta
    doc.setTextColor(...VERDE_ESCURO)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(answerLetter, x + cellPadding + 12, cellY)

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
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Informações de pontuação
  doc.setFillColor(...CINZA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 45, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')

  if (exam.scoringMethod === 'tri') {
    doc.text('SISTEMA DE PONTUAÇÃO: TRI (Teoria de Resposta ao Item)', margin + 5, y + 10)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    doc.text('A pontuação será calculada considerando:', margin + 5, y + 20)
    doc.text('• Dificuldade de cada questão (parâmetro b)', margin + 10, y + 27)
    doc.text('• Discriminação da questão (parâmetro a)', margin + 10, y + 33)
    doc.text('• Probabilidade de acerto ao acaso (parâmetro c)', margin + 10, y + 39)
  } else {
    doc.text(`SISTEMA DE PONTUAÇÃO: Normal`, margin + 5, y + 10)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    const pointsPerQuestion = (exam.totalPoints || 100) / exam.numberOfQuestions
    doc.text(`Pontuação máxima: ${exam.totalPoints} pontos`, margin + 5, y + 20)
    doc.text(`Cada questão vale: ${pointsPerQuestion.toFixed(2)} pontos`, margin + 5, y + 27)
    doc.text(`Total de questões: ${exam.numberOfQuestions}`, margin + 5, y + 34)
  }

  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin)
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
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Prova')
      return true
    }
    return false
  }

  // === CABEÇALHO ===
  y = addDomineAquiHeader(doc, pageWidth, margin, 'Prova')

  // === TÍTULO DA PROVA ===
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(exam.title, pageWidth / 2, y + 10, { align: 'center' })

  if (exam.description) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(exam.description, pageWidth / 2, y + 18, { align: 'center' })
  }

  y += 35

  // === INFORMAÇÕES DA PROVA ===
  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, y, { align: 'right' })
  y += 5
  doc.text(`Duração: ${exam.duration} minutos | Questões: ${exam.numberOfQuestions}`, pageWidth - margin, y, { align: 'right' })
  y += 10

  // === IDENTIFICAÇÃO DO CANDIDATO ===
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('IDENTIFICAÇÃO DO CANDIDATO', margin + 5, y + 5.5)
  y += 15

  doc.setTextColor(...CINZA_TEXTO)
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
  y += 12

  // === INSTRUÇÕES ===
  doc.setFillColor(...LARANJA)
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('INSTRUÇÕES', margin + 5, y + 5.5)
  y += 12

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...CINZA_TEXTO)
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

  y += 8

  // === QUESTÕES ===
  exam.questions.forEach((question, idx) => {
    checkPage(50)

    // Header da questão
    doc.setFillColor(...VERDE_MEDIO)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`Questão ${idx + 1}`, margin + 5, y + 7)
    y += 15

    // Enunciado
    if (question.statement) {
      checkPage(15)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 3
    }

    // Fonte do enunciado
    if (question.statementSource) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`Fonte: ${question.statementSource}`, margin, y)
      y += 6
    }

    // URL da imagem
    if (question.imageUrl) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setTextColor(...VERDE_MEDIO)
      doc.text(`Imagem: ${question.imageUrl}`, margin, y)
      y += 6
    }

    // Comando
    if (question.command) {
      checkPage(12)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      const commandLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      commandLines.forEach((line: string) => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 4
    }

    if (question.type === 'multiple-choice') {
      // Alternativas com checkboxes
      y += 3

      question.alternatives.forEach((alt) => {
        checkPage(12)

        // Reset font for each alternative to prevent color/size leaks
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...CINZA_TEXTO)

        // Checkbox estilizado
        doc.setDrawColor(...VERDE_MEDIO)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1)

        // Alternativa - use alt.letter from data instead of hardcoded array
        const altText = `${alt.letter}) ${alt.text}`
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 12)
        altLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) {
            checkPage(6)
            // Re-set after potential page break
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(...CINZA_TEXTO)
          }
          doc.text(line, margin + 10, y)
          y += 6
        })
        y += 3
      })
    } else if (question.type === 'discursive') {
      // Espaço para resposta discursiva
      checkPage(60)

      doc.setFontSize(9)
      doc.setTextColor(...LARANJA)
      doc.setFont('helvetica', 'bold')
      doc.text(`Espaço para resposta (máximo ${question.maxScore} pontos):`, margin, y)
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

    y += 10
  })

  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, `${exam.title}`)
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
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Relatório de Respostas')
      return true
    }
    return false
  }

  // === CABEÇALHO ===
  y = addDomineAquiHeader(doc, pageWidth, margin, 'Relatório de Respostas')

  // === TÍTULO DA PROVA ===
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(exam.title, pageWidth / 2, y + 12, { align: 'center' })

  y += 25

  // === INFORMAÇÕES DO ALUNO ===
  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Aluno: ' + userName, margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text('Data: ' + new Date().toLocaleDateString('pt-BR'), margin, y)
  y += 10

  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // === QUESTÕES ===
  exam.questions.forEach((question, idx) => {
    checkPage(40)

    // Header da questão
    doc.setFillColor(...VERDE_MEDIO)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Questão ' + (idx + 1), margin + 5, y + 5.5)
    y += 12

    if (question.statement) {
      checkPage(15)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 3
    }

    if (question.statementSource) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Fonte: ' + question.statementSource, margin, y)
      y += 6
    }

    if (question.command) {
      checkPage(12)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      const commandLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      commandLines.forEach((line: string) => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 4
    }

    const answer = answers.find(a => a.questionId === question.id)

    if (question.type === 'multiple-choice') {
      y += 3

      question.alternatives.forEach((alt) => {
        checkPage(12)

        const isSelected = answer?.selectedAlternative === alt.id

        // Checkbox
        doc.setDrawColor(...VERDE_MEDIO)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1)

        if (isSelected) {
          doc.setFillColor(...VERDE_MEDIO)
          doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1, 'F')
        }

        // Reset font/color explicitly per alternative
        if (isSelected) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...VERDE_ESCURO)
        } else {
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...CINZA_TEXTO)
        }
        doc.setFontSize(10)

        const altText = alt.letter + ') ' + alt.text
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 12)
        altLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) {
            checkPage(6)
            // Re-set after potential page break
            doc.setFontSize(10)
            if (isSelected) {
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(...VERDE_ESCURO)
            } else {
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(...CINZA_TEXTO)
            }
          }
          doc.text(line, margin + 10, y)
          y += 6
        })
        y += 3
      })
    } else if (question.type === 'discursive') {
      checkPage(20)

      doc.setFontSize(9)
      doc.setTextColor(...LARANJA)
      doc.setFont('helvetica', 'bold')
      doc.text('Sua resposta:', margin, y)
      y += 6

      if (answer?.discursiveText) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        const answerLines = wrapText(doc, answer.discursiveText, pageWidth - 2 * margin - 4)
        answerLines.forEach((line: string) => {
          checkPage(8)
          doc.text(line, margin + 2, y)
          y += 6
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

  // === RODAPÉ ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, `Respostas de ${userName}`)
  }

  return doc.output('blob')
}

/**
 * Gera PDF com as anotações feitas pelo aluno durante a prova
 */
export function generateAnnotationsPDF(
  examTitle: string,
  annotations: QuestionAnnotation[]
): Blob {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  // Função auxiliar para adicionar nova página se necessário
  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Anotações da Prova')
      return true
    }
    return false
  }

  // === CABEÇALHO ===
  y = addDomineAquiHeader(doc, pageWidth, margin, 'Anotações da Prova')

  // === TÍTULO DA PROVA ===
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setFillColor(...CINZA_CLARO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(examTitle, pageWidth / 2, y + 13, { align: 'center' })

  y += 30

  // Se não há anotações
  if (annotations.length === 0) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text('Nenhuma anotação foi feita durante esta prova.', pageWidth / 2, y, {
      align: 'center',
    })
  } else {
    // === ANOTAÇÕES ===
    // Ordenar por número da questão
    const sortedAnnotations = [...annotations].sort(
      (a, b) => a.questionNumber - b.questionNumber
    )

    for (const annotation of sortedAnnotations) {
      // Verificar se há espaço para o título da questão
      checkPage(30)

      // Título da questão
      doc.setFillColor(...VERDE_MEDIO)
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`Questão ${annotation.questionNumber}`, margin + 5, y + 8)

      y += 20

      // Verificar se há canvas data URL
      if (annotation.canvasDataUrl) {
        // Calcular dimensões para a imagem
        const maxImageWidth = pageWidth - 2 * margin
        const maxImageHeight = 150 // Altura máxima para cada anotação

        // Adicionar a imagem do canvas
        try {
          // Criar nova página se necessário para a imagem
          checkPage(maxImageHeight + 10)

          doc.addImage(
            annotation.canvasDataUrl,
            'PNG',
            margin,
            y,
            maxImageWidth,
            maxImageHeight
          )

          y += maxImageHeight + 15
        } catch (error) {
          // Se houver erro ao adicionar a imagem, mostrar mensagem
          doc.setFontSize(10)
          doc.setTextColor(200, 0, 0)
          doc.text('Erro ao carregar anotação', margin, y)
          y += 15
        }
      } else {
        // Se não houver canvas data URL, mostrar apenas os textos
        if (annotation.texts && annotation.texts.length > 0) {
          doc.setFontSize(10)
          doc.setTextColor(...CINZA_TEXTO)
          doc.text('Anotações de texto:', margin, y)
          y += 8

          for (const text of annotation.texts) {
            checkPage(10)
            const lines = wrapText(doc, text.text, pageWidth - 2 * margin - 10)
            for (const line of lines) {
              checkPage(6)
              doc.text(`• ${line}`, margin + 5, y)
              y += 6
            }
          }
          y += 10
        } else {
          // Sem anotações
          doc.setFontSize(10)
          doc.setTextColor(150, 150, 150)
          doc.text('(Sem anotações para esta questão)', margin, y)
          y += 15
        }
      }

      // Linha separadora entre questões
      checkPage(5)
      doc.setDrawColor(...LARANJA)
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageWidth - margin, y)
      y += 10
    }
  }

  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, `Anotações - ${examTitle}`)
  }

  return doc.output('blob')
}

/**
 * Gera PDF com o resumo dos dados de uma pesquisa submetida
 */
export async function generateFormResponsePDF(
  form: Form,
  answers: Record<string, string | string[]>
): Promise<Blob> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Resumo da Pesquisa')
      return true
    }
    return false
  }

  // Header
  y = addDomineAquiHeader(doc, pageWidth, margin, 'Resumo da Pesquisa')

  // Form Title
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(form.title, pageWidth / 2, y + 13, { align: 'center' })

  y += 30

  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(10)
  const dateStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const timeStr = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  doc.text(`Submetido em: ${dateStr} às ${timeStr} (Horário de Brasília)`, margin, y)
  y += 15

  // Questions and Answers
  form.blocks.forEach((block: FormBlock) => {
    if (block.type === 'question') {
      checkPage(30)

      // Question Title Wrapper
      doc.setFillColor(...VERDE_MEDIO)
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('PERGUNTA', margin + 5, y + 7)
      y += 15

      // Question Content
      doc.setTextColor(...VERDE_ESCURO)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      const titleText = block.title || 'Sem título'
      const titleLines = wrapText(doc, titleText, pageWidth - 2 * margin)
      titleLines.forEach(line => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 2

      // Answer Text
      doc.setTextColor(...CINZA_TEXTO)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      const answer = answers[block.id]
      let answerText = ''

      if (Array.isArray(answer)) {
        answerText = answer.join(', ')
      } else if (answer) {
        answerText = answer
      } else {
        answerText = '(Sem resposta)'
      }

      const answerLines = wrapText(doc, String(answerText), pageWidth - 2 * margin)
      answerLines.forEach(line => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })

      y += 10
    }
  })

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, form.title)
  }

  return doc.output('blob')
}
