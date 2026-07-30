import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'
import { jsPDF } from 'jspdf'

export const dynamic = 'force-dynamic'

// Cores da paleta
const VERDE_ESCURO = '#1a472a'
const VERDE_MEDIO = '#468152'
const LARANJA = '#E2A43E'
const LARANJA_CLARO = '#F5D89A'
const CINZA_TEXTO = '#333333'
const CINZA_CLARO = '#f5f5f5'

// Função para baixar imagem e converter para base64
async function fetchImageAsBase64(url: string): Promise<{ data: string, format: string } | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } })
    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Detectar formato da imagem
    const contentType = response.headers.get('content-type') || ''
    let format = 'PNG'
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      format = 'JPEG'
    } else if (contentType.includes('gif')) {
      format = 'GIF'
    }

    return { data: `data:${contentType};base64,${base64}`, format }
  } catch (error) {
    console.error('Erro ao baixar imagem:', error)
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const incluirRespostas = searchParams.get('respostas') === 'true'

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()

    // Verificar se usuário é premium ou admin
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (user.role !== 'admin' && user.accountType !== 'premium') {
      return NextResponse.json({
        error: 'Acesso restrito a assinantes Plus+',
        requiresPlus: true
      }, { status: 403 })
    }

    // Buscar a lista
    const lista = await db.collection('banco_listas_usuario').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.userId)
    })

    if (!lista) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
    }

    // Converter questaoIds para ObjectId
    const questaoObjectIds = lista.questaoIds.map((qid: any) =>
      typeof qid === 'string' ? new ObjectId(qid) : qid
    )

    // Buscar as questões da lista com hierarquia
    const questoes = await db.collection('banco_questoes')
      .aggregate([
        { $match: { _id: { $in: questaoObjectIds } } },
        {
          $lookup: {
            from: 'banco_periodos',
            localField: 'periodoId',
            foreignField: '_id',
            as: 'periodo'
          }
        },
        {
          $lookup: {
            from: 'banco_modulos',
            localField: 'moduloId',
            foreignField: '_id',
            as: 'modulo'
          }
        },
        {
          $addFields: {
            periodoNome: { $arrayElemAt: ['$periodo.nome', 0] },
            moduloNome: { $arrayElemAt: ['$modulo.nome', 0] }
          }
        },
        {
          $project: {
            periodo: 0,
            modulo: 0
          }
        }
      ])
      .toArray()

    // Criar PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    let yPosition = margin

    // Tentar baixar a logo da plataforma (logo correta do DomineAqui)
    let logoData: { data: string, format: string } | null = null
    try {
      logoData = await fetchImageAsBase64('https://i.imgur.com/1QmchqF.png')
    } catch (e) {
      console.log('Logo não disponível')
    }

    // Função para calcular dimensões proporcionais da imagem
    function calculateImageDimensions(
      maxWidth: number,
      maxHeight: number,
      preferredWidth: number = maxWidth,
      preferredHeight: number = maxHeight
    ): { width: number; height: number } {
      // Usa tamanhos padrão que cabem bem no PDF
      const width = Math.min(preferredWidth, maxWidth)
      const height = Math.min(preferredHeight, maxHeight)

      // Mantém proporção aproximada para imagens de questões
      // A maioria das imagens de questões são mais largas que altas
      const aspectRatio = 1.5 // largura / altura típica

      if (width / height > aspectRatio) {
        // Imagem muito larga, ajustar pela altura
        return { width: height * aspectRatio, height }
      } else {
        // Imagem muito alta, ajustar pela largura
        return { width, height: width / aspectRatio }
      }
    }

    // Função para adicionar header em cada página
    function addHeader() {
      // Barra superior verde escuro
      doc.setFillColor(26, 71, 42) // VERDE_ESCURO
      doc.rect(0, 0, pageWidth, 28, 'F')

      // Detalhe laranja no canto
      doc.setFillColor(226, 164, 62) // LARANJA
      doc.rect(pageWidth - 60, 0, 60, 28, 'F')

      // Adicionar logo se disponível
      if (logoData) {
        try {
          doc.addImage(logoData.data, logoData.format, margin, 4, 20, 20)
        } catch (e) {
          // Se falhar, não adiciona a imagem
        }
      }

      // Título DomineAqui
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(255, 255, 255)
      const logoOffset = logoData ? 25 : 0
      doc.text('DomineAqui', margin + logoOffset, 14)

      // Subtítulo
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Banco de Questões', margin + logoOffset, 21)

      // Link da plataforma no canto direito
      doc.setFontSize(8)
      doc.setTextColor(26, 71, 42)
      doc.text('www.domineaqui.com.br', pageWidth - margin - 35, 16)

      return 38
    }

    // Função para adicionar footer em cada página
    function addFooter(pageNum: number) {
      const footerY = pageHeight - 12

      // Barra de footer
      doc.setFillColor(245, 245, 245)
      doc.rect(0, footerY - 5, pageWidth, 17, 'F')

      // Linha decorativa verde e laranja
      doc.setDrawColor(70, 129, 82) // VERDE_MEDIO
      doc.setLineWidth(1)
      doc.line(0, footerY - 5, pageWidth * 0.7, footerY - 5)
      doc.setDrawColor(226, 164, 62) // LARANJA
      doc.line(pageWidth * 0.7, footerY - 5, pageWidth, footerY - 5)

      // Texto do footer
      doc.setFontSize(8)
      doc.setTextColor(70, 70, 70)
      doc.setFont('helvetica', 'bold')
      doc.text('DomineAqui', margin, footerY + 2)
      doc.setFont('helvetica', 'normal')
      doc.text(' - www.domineaqui.com.br', margin + 18, footerY + 2)

      // Página
      doc.text(`Página ${pageNum}`, pageWidth - margin - 15, footerY + 2)

      // Data e slogan
      const dataGeracao = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      doc.setFontSize(7)
      doc.setTextColor(100, 100, 100)
      doc.text(`Gerado em ${dataGeracao} | Seja o Foco. Seja a Referência.`, pageWidth / 2, footerY + 2, { align: 'center' })
    }

    // Função para verificar se precisa de nova página
    function checkNewPage(requiredSpace: number) {
      if (yPosition + requiredSpace > pageHeight - 25) {
        addFooter(doc.internal.pages.length - 1)
        doc.addPage()
        yPosition = addHeader()
        return true
      }
      return false
    }

    // Função para quebrar texto em linhas - melhorada para textos longos
    function splitTextToLines(text: string, maxWidth: number, fontSize: number): string[] {
      if (!text) return []

      doc.setFontSize(fontSize)

      // Primeiro, preservar quebras de linha existentes
      const paragraphs = text.split(/\n/)
      const allLines: string[] = []

      for (const paragraph of paragraphs) {
        if (paragraph.trim() === '') {
          allLines.push('') // Manter linhas em branco
          continue
        }

        // Quebrar cada parágrafo em linhas que cabem na largura
        const lines = doc.splitTextToSize(paragraph.trim(), maxWidth)
        allLines.push(...lines)
      }

      return allLines
    }

    // Função para renderizar texto com suporte a múltiplas linhas e espaçamento
    function renderMultilineText(
      text: string,
      x: number,
      startY: number,
      maxWidth: number,
      fontSize: number,
      lineHeight: number = 5
    ): number {
      const lines = splitTextToLines(text, maxWidth, fontSize)
      let currentY = startY

      for (const line of lines) {
        // Verificar se precisa de nova página
        if (currentY > pageHeight - 30) {
          addFooter(doc.internal.pages.length - 1)
          doc.addPage()
          currentY = addHeader()
        }

        doc.text(line, x, currentY)
        currentY += lineHeight
      }

      return currentY
    }

    // Header da primeira página
    yPosition = addHeader()

    // Título da lista
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(26, 71, 42) // VERDE_ESCURO
    doc.text(lista.nome, margin, yPosition)
    yPosition += 8

    // Info da lista
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`${questoes.length} questões`, margin, yPosition)
    yPosition += 15

    // Linha decorativa
    doc.setDrawColor(226, 164, 62) // LARANJA
    doc.setLineWidth(1)
    doc.line(margin, yPosition - 5, margin + 40, yPosition - 5)

    // Questões
    for (let i = 0; i < questoes.length; i++) {
      const questao = questoes[i]
      const numeroQuestao = i + 1

      // Calcular espaço mínimo para o header da questão
      checkNewPage(40)

      // Header da questão com barra colorida
      doc.setFillColor(26, 71, 42) // VERDE_ESCURO
      doc.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, 'F')

      // Número da questão
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      doc.text(`Questão ${numeroQuestao}`, margin + 5, yPosition + 7)

      // Tipo
      const tipoLabel = questao.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'
      doc.setFontSize(9)
      doc.text(`| ${tipoLabel}`, margin + 35, yPosition + 7)

      // Dificuldade se existir
      if (questao.dificuldade) {
        const dificuldadeLabel = questao.dificuldade === 'facil' ? 'Fácil' :
          questao.dificuldade === 'medio' ? 'Médio' : 'Difícil'
        doc.text(`| ${dificuldadeLabel}`, margin + 60, yPosition + 7)
      }

      // Ano
      if (questao.ano) {
        doc.text(`| ${questao.ano}`, margin + 85, yPosition + 7)
      }

      yPosition += 15

      // Período/Módulo
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      const hierarquia = [questao.periodoNome, questao.moduloNome].filter(Boolean).join(' > ')
      if (hierarquia) {
        doc.text(hierarquia, margin + 2, yPosition)
        yPosition += 6
      }

      // Enunciado com verificação de página
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(51, 51, 51) // CINZA_TEXTO
      const enunciadoLines = splitTextToLines(questao.enunciado, contentWidth - 10, 11)
      for (const line of enunciadoLines) {
        checkNewPage(8)
        doc.text(line, margin + 2, yPosition)
        yPosition += 5
      }
      yPosition += 5

      // Imagem da questão (se existir)
      if (questao.imagemUrl) {
        try {
          const imageData = await fetchImageAsBase64(questao.imagemUrl)
          if (imageData) {
            // Calcular dimensões proporcionais
            const maxImgWidth = contentWidth - 40 // Margem interna
            const maxImgHeight = 60 // Altura máxima padrão

            // Usar dimensões fixas e proporcionais
            const imgDimensions = calculateImageDimensions(maxImgWidth, maxImgHeight, 80, 50)

            checkNewPage(imgDimensions.height + 15)

            // Centralizar imagem
            const imgX = margin + (contentWidth - imgDimensions.width) / 2

            // Borda decorativa ao redor da imagem
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.roundedRect(imgX - 2, yPosition - 2, imgDimensions.width + 4, imgDimensions.height + 4, 2, 2, 'D')

            doc.addImage(imageData.data, imageData.format, imgX, yPosition, imgDimensions.width, imgDimensions.height)
            yPosition += imgDimensions.height + 10
          }
        } catch (error) {
          console.error('Erro ao adicionar imagem ao PDF:', error)
          // Mostrar placeholder se a imagem falhar
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text('[Imagem não disponível]', margin + 5, yPosition)
          yPosition += 8
        }
      }

      // Alternativas (para objetiva)
      if (questao.tipo === 'objetiva' && questao.alternativas) {
        for (const alt of questao.alternativas) {
          const altText = `${alt.letra}) ${alt.texto}`
          const altLines = splitTextToLines(altText, contentWidth - 15, 10)

          // Calcular altura necessária para esta alternativa
          const altHeight = altLines.length * 5 + 4

          // Verificar se precisa de nova página
          checkNewPage(altHeight + 5)

          // Se incluir respostas, destacar a correta
          if (incluirRespostas && alt.correta) {
            doc.setFillColor(220, 252, 231) // Verde claro
            doc.roundedRect(margin + 2, yPosition - 3, contentWidth - 6, altHeight, 2, 2, 'F')
            doc.setTextColor(22, 163, 74) // Verde
            doc.setFont('helvetica', 'bold')
          } else {
            doc.setTextColor(51, 51, 51)
            doc.setFont('helvetica', 'normal')
          }

          doc.setFontSize(10)
          for (const line of altLines) {
            doc.text(line, margin + 5, yPosition)
            yPosition += 5
          }
          yPosition += 3
        }
      }

      // Espaço para resposta discursiva
      if (questao.tipo === 'discursiva' && !incluirRespostas) {
        checkNewPage(45)
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.2)
        for (let j = 0; j < 5; j++) {
          doc.line(margin + 2, yPosition + (j * 8), margin + contentWidth - 4, yPosition + (j * 8))
        }
        yPosition += 42
      }

      // Separador entre questões
      yPosition += 5
      doc.setDrawColor(226, 164, 62) // LARANJA
      doc.setLineWidth(0.5)
      doc.line(margin + 20, yPosition, pageWidth - margin - 20, yPosition)
      yPosition += 10
    }

    // Se incluir respostas, adicionar gabarito completo no final
    if (incluirRespostas) {
      // Nova página para gabarito
      addFooter(doc.internal.pages.length - 1)
      doc.addPage()
      yPosition = addHeader()

      // Título do gabarito
      doc.setFillColor(26, 71, 42) // VERDE_ESCURO
      doc.roundedRect(margin, yPosition, contentWidth, 12, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(255, 255, 255)
      doc.text('GABARITO COMPLETO', pageWidth / 2, yPosition + 8, { align: 'center' })
      yPosition += 20

      // Grid resumido do gabarito para questões objetivas
      const questoesObjetivas = questoes.filter(q => q.tipo === 'objetiva')
      if (questoesObjetivas.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(26, 71, 42)
        doc.text('Respostas Rápidas (Objetivas):', margin, yPosition)
        yPosition += 8

        const colunas = 5
        const larguraColuna = contentWidth / colunas
        let col = 0

        for (let i = 0; i < questoesObjetivas.length; i++) {
          const questao = questoesObjetivas[i]
          const correta = questao.alternativas?.find((a: any) => a.correta)?.letra || '-'
          const x = margin + (col * larguraColuna)

          doc.setFillColor(245, 216, 154) // LARANJA_CLARO
          doc.roundedRect(x, yPosition, larguraColuna - 5, 10, 2, 2, 'F')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(26, 71, 42)
          doc.text(`Q${i + 1}: ${correta}`, x + 5, yPosition + 7)

          col++
          if (col >= colunas) {
            col = 0
            yPosition += 14
            checkNewPage(20)
          }
        }
        yPosition += col > 0 ? 20 : 10
      }

      // Gabarito detalhado com explicações
      doc.setFillColor(70, 129, 82) // VERDE_MEDIO
      doc.roundedRect(margin, yPosition, contentWidth, 10, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      doc.text('Respostas Comentadas', pageWidth / 2, yPosition + 7, { align: 'center' })
      yPosition += 18

      for (let i = 0; i < questoes.length; i++) {
        const questao = questoes[i]

        // Calcular espaço necessário
        let espacoNecessario = 40

        // Verificar espaço para resposta/explicação
        const respostaTexto = questao.tipo === 'objetiva'
          ? `Alternativa correta: ${questao.alternativas?.find((a: any) => a.correta)?.letra || '-'}`
          : questao.respostaModelo || 'Sem resposta modelo'

        const respostaLines = splitTextToLines(respostaTexto, contentWidth - 15, 10)
        espacoNecessario += respostaLines.length * 5

        if (questao.explicacao) {
          const explicacaoLines = splitTextToLines(questao.explicacao, contentWidth - 15, 9)
          espacoNecessario += explicacaoLines.length * 4 + 10
        }

        checkNewPage(espacoNecessario)

        // Header da questão
        doc.setFillColor(245, 245, 245)
        doc.setDrawColor(70, 129, 82)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin, yPosition, contentWidth, 8, 2, 2, 'FD')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(26, 71, 42)
        doc.text(`Questão ${i + 1}`, margin + 5, yPosition + 5.5)

        // Tipo e hierarquia
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        const tipoLabel = questao.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'
        const hierarquia = [questao.periodoNome, questao.moduloNome, questao.topicoNome].filter(Boolean).join(' > ')
        doc.text(`${tipoLabel} | ${hierarquia}`, margin + 30, yPosition + 5.5)

        // Ano e fonte se disponíveis
        if (questao.ano || questao.fonte) {
          const metaInfo = [questao.ano ? `Ano: ${questao.ano}` : '', questao.fonte ? `Fonte: ${questao.fonte}` : ''].filter(Boolean).join(' | ')
          doc.text(metaInfo, pageWidth - margin - 5, yPosition + 5.5, { align: 'right' })
        }

        yPosition += 12

        // Resposta
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(22, 163, 74) // Verde
        doc.text('Resposta:', margin + 2, yPosition)
        yPosition += 5

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(51, 51, 51)
        for (const line of respostaLines) {
          doc.text(line, margin + 5, yPosition)
          yPosition += 4.5
        }
        yPosition += 3

        // Explicação se disponível
        if (questao.explicacao) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.setTextColor(226, 164, 62) // LARANJA
          doc.text('Explicação:', margin + 2, yPosition)
          yPosition += 4

          doc.setFont('helvetica', 'italic')
          doc.setFontSize(9)
          doc.setTextColor(80, 80, 80)
          const explicacaoLines = splitTextToLines(questao.explicacao, contentWidth - 15, 9)
          for (const line of explicacaoLines) {
            doc.text(line, margin + 5, yPosition)
            yPosition += 4
          }
        }

        yPosition += 8

        // Linha divisória
        if (i < questoes.length - 1) {
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.line(margin + 10, yPosition - 3, pageWidth - margin - 10, yPosition - 3)
        }
      }
    }

    // Footer da última página
    addFooter(doc.internal.pages.length - 1)

    // Gerar PDF como buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Retornar o PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${lista.nome.replace(/[^a-zA-Z0-9]/g, '_')}_DomineAqui.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
