import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  generateMultipleChoiceQuestion,
  generateDiscursiveQuestion,
  QuestionGenerationParams,
} from '@/lib/question-generator'

// POST - Gerar questão com IA
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    // Apenas admin pode gerar questões
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { type, style, subject, difficulty, numberOfAlternatives, useTRI } = body

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

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tema/assunto é obrigatório' },
        { status: 400 }
      )
    }

    if (typeof difficulty !== 'number' || difficulty < 0 || difficulty > 1) {
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
  } catch (error: any) {
    console.error('Error generating question:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar questão com IA' },
      { status: 500 }
    )
  }
}
