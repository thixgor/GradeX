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

    let query: any = {}

    // Administradores veem todas as provas (incluindo ocultas e pessoais de todos)
    // Usuários comuns veem:
    // - Provas não ocultas públicas (isPersonalExam = false ou undefined)
    // - Suas próprias provas pessoais
    if (session.role !== 'admin') {
      query = {
        $or: [
          { isHidden: false, $or: [{ isPersonalExam: false }, { isPersonalExam: { $exists: false } }] },
          { isPersonalExam: true, createdBy: session.userId },
        ],
      }
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

// Função auxiliar para resetar limites diários se necessário
async function resetDailyLimitsIfNeeded(db: any, userId: string) {
  const usersCollection = db.collection('users')
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
  if (!user) return null

  const now = new Date()
  const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset) : null

  const needsReset =
    !lastReset ||
    now.getTime() - lastReset.getTime() > 24 * 60 * 60 * 1000 ||
    now.getDate() !== lastReset.getDate()

  if (needsReset) {
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          dailyPersonalExamsCreated: 0,
          dailyAiQuestionsUsed: 0,
          lastDailyReset: now,
        },
      }
    )

    return {
      ...user,
      dailyPersonalExamsCreated: 0,
      dailyAiQuestionsUsed: 0,
      lastDailyReset: now,
    }
  }

  return user
}

// POST - Criar prova
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
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
      // Novos campos
      isPersonalExam = false,
      groupId,
      aiQuestionsCount = 0,
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
    const usersCollection = db.collection('users')

    // Se for prova pessoal e não for admin, validar limites
    if (isPersonalExam && session.role !== 'admin') {
      // Resetar limites se necessário
      const user = await resetDailyLimitsIfNeeded(db, session.userId)
      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      const accountType = user.accountType || 'gratuito'
      const dailyExamsUsed = user.dailyPersonalExamsCreated || 0
      const dailyAiQuestionsUsed = user.dailyAiQuestionsUsed || 0

      // Calcular limites baseado no tipo de conta
      const dailyExamsLimit = accountType === 'premium' || accountType === 'trial' ? 10 : 5
      const aiQuestionsPerExamLimit = accountType === 'premium' || accountType === 'trial' ? 20 : 5

      // Validar limite diário de provas pessoais
      if (dailyExamsUsed >= dailyExamsLimit) {
        return NextResponse.json(
          {
            error: `Limite diário de provas pessoais atingido (${dailyExamsLimit}/dia para contas ${accountType})`,
          },
          { status: 403 }
        )
      }

      // Validar limite de questões IA por prova
      if (aiQuestionsCount > aiQuestionsPerExamLimit) {
        return NextResponse.json(
          {
            error: `Limite de questões geradas por IA atingido (máximo ${aiQuestionsPerExamLimit} por prova para contas ${accountType})`,
          },
          { status: 403 }
        )
      }

      // Incrementar contadores
      await usersCollection.updateOne(
        { _id: new ObjectId(session.userId) },
        {
          $inc: {
            dailyPersonalExamsCreated: 1,
            dailyAiQuestionsUsed: aiQuestionsCount,
          },
        }
      )
    }

    // Apenas admin pode criar provas públicas (não pessoais)
    if (!isPersonalExam && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar provas públicas' },
        { status: 403 }
      )
    }

    // Para provas práticas sem datas, usar uma data muito distante no futuro
    const defaultFutureDate = new Date('2099-12-31T23:59:59')

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
      startTime: startTime ? new Date(startTime) : (isPracticeExam ? defaultFutureDate : new Date()),
      endTime: endTime ? new Date(endTime) : (isPracticeExam ? defaultFutureDate : new Date()),
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
      // Novos campos
      groupId: groupId || null,
      isPersonalExam,
      aiQuestionsCount: aiQuestionsCount || 0,
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
