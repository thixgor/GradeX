import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'

// GET - Listar provas
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')

    let query = {}

    // Administradores veem todas as provas (incluindo ocultas que criaram)
    // Usuários comuns veem apenas provas não ocultas
    if (session.role !== 'admin') {
      query = { isHidden: false }
    }

    const exams = await examsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ exams })
  } catch (error) {
    console.error('Get exams error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar provas' },
      { status: 500 }
    )
  }
}

// POST - Criar prova
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      coverImage,
      numberOfQuestions,
      numberOfAlternatives,
      themePhrase,
      scoringMethod,
      totalPoints,
      questions,
      pdfUrl,
      gatesOpen,
      gatesClose,
      startTime,
      endTime,
      isHidden = false,
      discursiveCorrectionMethod,
      aiRigor,
      navigationMode = 'paginated',
      duration,
      // Campos de proctoring
      proctoringEnabled,
      proctoringCamera,
      proctoringAudio,
      proctoringScreen,
      proctoringScreenMode,
      // Configurações adicionais
      isPracticeExam = false,
      allowCustomName = false,
      requireSignature = false,
      shuffleQuestions = false,
    } = body

    // Validação: Se não for prova prática, exigir startTime e endTime
    if (!title || !numberOfQuestions || !numberOfAlternatives || !scoringMethod) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    if (!isPracticeExam && (!startTime || !endTime)) {
      return NextResponse.json(
        { error: 'Datas de início e fim são obrigatórias para provas não-práticas' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')

    const newExam: Exam = {
      title,
      description,
      coverImage,
      numberOfQuestions,
      numberOfAlternatives,
      themePhrase,
      scoringMethod,
      totalPoints,
      questions: questions || [],
      pdfUrl,
      gatesOpen: gatesOpen ? new Date(gatesOpen) : undefined,
      gatesClose: gatesClose ? new Date(gatesClose) : undefined,
      startTime: startTime ? new Date(startTime) : new Date(), // Default para data atual se não fornecido
      endTime: endTime ? new Date(endTime) : new Date(), // Default para data atual se não fornecido
      createdBy: session.userId,
      isHidden,
      discursiveCorrectionMethod,
      aiRigor,
      navigationMode,
      duration,
      // Configurações de proctoring
      proctoring: proctoringEnabled ? {
        enabled: proctoringEnabled,
        camera: proctoringCamera || false,
        audio: proctoringAudio || false,
        screen: proctoringScreen || false,
        screenMode: proctoringScreenMode || 'window',
      } : undefined,
      // Configurações adicionais
      isPracticeExam,
      allowCustomName,
      requireSignature,
      shuffleQuestions,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await examsCollection.insertOne(newExam)

    return NextResponse.json({
      success: true,
      examId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error('Create exam error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar prova' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar TODAS as provas (uso administrativo)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      )
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')
    const submissionsCollection = db.collection('submissions')

    // Deletar todas as submissões
    await submissionsCollection.deleteMany({})

    // Deletar todas as provas
    const result = await examsCollection.deleteMany({})

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} prova(s) deletada(s) com sucesso`,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('Delete all exams error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar provas' },
      { status: 500 }
    )
  }
}
