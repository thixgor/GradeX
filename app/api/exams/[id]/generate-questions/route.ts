import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import {
  generateMultipleChoiceQuestion,
  generateMixedTypeQuestion,
  generateCommentedFeedback,
  shuffleAlternatives,
  QuestionGenerationParams,
  setAIKeySection,
} from '@/lib/question-generator'

export const dynamic = 'force-dynamic'

// POST - Gerar questões por IA
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const {
      themes,
      difficulty,
      numberOfQuestions,
      numberOfAlternatives,
      style,
      mixedStyles,
      alternativeType,
      mixedAlternativeTypes,
      alternativeTypeDistribution,
      randomDifficulty,
      questionContext,
      context,
    } = await request.json()

    if (!themes || !Array.isArray(themes) || themes.length === 0) {
      return NextResponse.json({ error: 'Temas são obrigatórios' }, { status: 400 })
    }

    // Para IDs temporários, não validar no banco de dados
    const isTemporaryId = params.id.startsWith('temp-')

    if (!isTemporaryId) {
      const db = await getDb()
      const examsCollection = db.collection('exams')

      // Buscar prova
      const exam = await examsCollection.findOne({
        _id: new ObjectId(params.id),
        createdBy: session.userId,
        isPersonalExam: true,
      })

      if (!exam) {
        return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
      }
    }

    // Definir a seção de IA para Provas Pessoais
    setAIKeySection('personalExams')

    // Gerar questões com IA
    // Gerar questões com IA em lotes pequenos para evitar rate limits
    const BATCH_SIZE = 3
    const MAX_RETRIES = 3
    const RETRY_DELAY_MS = 1000

    const questions: any[] = []

    // Função auxiliar para esperar
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Função para gerar uma única questão com retry
    const generateQuestionWithRetry = async (index: number): Promise<any | null> => {
      let attempts = 0

      while (attempts < MAX_RETRIES) {
        try {
          // Distribuir temas homogeneamente
          const themeIndex = index % themes.length
          const currentTheme = themes[themeIndex]

          // Dificuldade aleatória ou fixa
          const currentDifficulty = randomDifficulty ? Math.random() : difficulty

          // Estilo misto ou fixo
          const currentStyle = mixedStyles ? (index % 2 === 0 ? 'contextualizada' : 'rapida') : style

          const params: QuestionGenerationParams = {
            type: 'multiple-choice',
            style: currentStyle,
            subject: currentTheme,
            difficulty: currentDifficulty,
            numberOfAlternatives,
            useTRI: false,
            context: context || 'Prova Pessoal',
            alternativeType: alternativeType,
          }

          // Gerar questão com tipo apropriado
          let question = alternativeType === 'mixed'
            ? await generateMixedTypeQuestion(params)
            : await generateMultipleChoiceQuestion(params)

          // 1. Embaralhar alternativas ANTES de gerar feedback comentado
          question = shuffleAlternatives(question)

          // 2. Gerar feedback comentado para provas pessoais (após shuffle)
          try {
            const commentedFeedback = await generateCommentedFeedback(question, context || 'Prova Pessoal')
            question.commentedFeedback = commentedFeedback
          } catch (feedbackError) {
            console.error(`Erro ao gerar feedback comentado para questão ${index + 1}:`, feedbackError)
            // Continuar sem feedback comentado se houver erro
          }

          return question
        } catch (error: any) {
          attempts++
          console.error(`Erro ao gerar questão ${index + 1} (Tentativa ${attempts}/${MAX_RETRIES}):`, error.message)

          if (attempts < MAX_RETRIES) {
            // Backoff exponencial simples
            await delay(RETRY_DELAY_MS * attempts)
          }
        }
      }

      return null
    }

    // Processar em lotes
    for (let i = 0; i < numberOfQuestions; i += BATCH_SIZE) {
      const batchPromises = []

      // Criar promessas para o lote atual
      for (let j = 0; j < BATCH_SIZE && (i + j) < numberOfQuestions; j++) {
        batchPromises.push(generateQuestionWithRetry(i + j))
      }

      // Aguardar o lote atual terminar
      const batchResults = await Promise.all(batchPromises)

      // Adicionar resultados válidos
      const validResults = batchResults.filter((q): q is any => q !== null)
      questions.push(...validResults)

      // Pequena pausa entre lotes se ainda houver mais por vir
      if (i + BATCH_SIZE < numberOfQuestions) {
        await delay(500)
      }
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível gerar nenhuma questão. Tente novamente.' },
        { status: 500 }
      )
    }

    // Corrigir numeração das questões (começar em 1, não 0)
    questions.forEach((q, index) => {
      q.number = index + 1
    })

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Erro ao gerar questões:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

