import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  generateMultipleChoiceQuestion,
  generateDiscursiveQuestion,
  QuestionGenerationParams,
} from '@/lib/question-generator'

// POST - Gerar questão(ões) com IA
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    // Apenas admin pode gerar questões
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const {
      type,
      style,
      subject,
      difficulty,
      numberOfAlternatives,
      useTRI,
      // Novos parâmetros para geração múltipla
      quantity,
      subjects,
      randomDifficulty,
    } = body

    // Validações
    if (!type || !['multiple-choice', 'discursive'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de questão inválido' },
        { status: 400 }
      )
    }

    if (!style || !['contextualizada', 'rapida'].includes(style)) {
      return NextResponse.json(
        { error: 'Estilo de questão inválido' },
        { status: 400 }
      )
    }

    // Modo múltiplo ou único?
    const isMultipleMode = quantity && quantity > 1 && subjects && Array.isArray(subjects)

    if (isMultipleMode) {
      // Validações para modo múltiplo
      if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        return NextResponse.json(
          { error: 'Lista de temas é obrigatória para geração múltipla' },
          { status: 400 }
        )
      }

      if (quantity < 1 || quantity > 50) {
        return NextResponse.json(
          { error: 'Quantidade deve estar entre 1 e 50' },
          { status: 400 }
        )
      }

      // Gerar múltiplas questões
      const questions = []

      for (let i = 0; i < quantity; i++) {
        // Distribuir temas homogeneamente
        const subjectIndex = i % subjects.length
        const currentSubject = subjects[subjectIndex]

        // Dificuldade aleatória ou fixa
        const currentDifficulty = randomDifficulty
          ? Math.random() // 0 a 1
          : (difficulty || 0.5)

        const params: QuestionGenerationParams = {
          type,
          style,
          subject: currentSubject.trim(),
          difficulty: currentDifficulty,
          numberOfAlternatives: numberOfAlternatives || 5,
          useTRI: useTRI || false,
        }

        // Gerar questão
        let question
        if (type === 'multiple-choice') {
          question = await generateMultipleChoiceQuestion(params)
        } else {
          question = await generateDiscursiveQuestion(params)
        }

        questions.push(question)
      }

      return NextResponse.json({
        success: true,
        questions,
      })
    } else {
      // Modo único (original)
      if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
        return NextResponse.json(
          { error: 'Tema/assunto é obrigatório' },
          { status: 400 }
        )
      }

      if (difficulty === undefined || typeof difficulty !== 'number' || difficulty < 0 || difficulty > 1) {
        return NextResponse.json(
          { error: 'Dificuldade deve estar entre 0 e 1' },
          { status: 400 }
        )
      }

      const params: QuestionGenerationParams = {
        type,
        style,
        subject: subject.trim(),
        difficulty,
        numberOfAlternatives: numberOfAlternatives || 5,
        useTRI: useTRI || false,
      }

      // Gerar questão conforme o tipo
      let question
      if (type === 'multiple-choice') {
        question = await generateMultipleChoiceQuestion(params)
      } else {
        question = await generateDiscursiveQuestion(params)
      }

      return NextResponse.json({
        success: true,
        question,
      })
    }
  } catch (error: any) {
    console.error('Error generating question:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar questão(ões) com IA' },
      { status: 500 }
    )
  }
}
