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
    const questions = []

    for (let i = 0; i < numberOfQuestions; i++) {
      // Distribuir temas homogeneamente
      const themeIndex = i % themes.length
      const currentTheme = themes[themeIndex]

      // Dificuldade aleatória ou fixa
      const currentDifficulty = randomDifficulty ? Math.random() : difficulty

      // Estilo misto ou fixo
      const currentStyle = mixedStyles ? (i % 2 === 0 ? 'contextualizada' : 'rapida') : style

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

      try {
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
          console.error(`Erro ao gerar feedback comentado para questão ${i + 1}:`, feedbackError)
          // Continuar sem feedback comentado se houver erro
        }
        
        questions.push(question)
      } catch (error) {
        console.error(`Erro ao gerar questão ${i + 1}:`, error)
        // Continuar com próxima questão em caso de erro
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

