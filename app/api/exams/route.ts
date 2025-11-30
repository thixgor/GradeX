import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

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

    // Administradores veem:
    // - Todas as provas públicas (isPersonalExam = false ou undefined)
    // - Suas próprias provas pessoais (isPersonalExam = true E createdBy = userId)
    // Usuários comuns veem:
    // - Provas não ocultas públicas (isPersonalExam = false ou undefined)
    // - Suas próprias provas pessoais (isPersonalExam = true E createdBy = userId)
    query = {
      $or: [
        { 
          isHidden: false, 
          $or: [
            { isPersonalExam: false }, 
            { isPersonalExam: { $exists: false } }
          ] 
        },
        { 
          isPersonalExam: true, 
          createdBy: session.userId 
        },
      ],
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

// Função para obter data atual em horário de Brasília
function getBrasiliaDate(): Date {
  const now = new Date()
  // Brasília é UTC-3
  const brasiliaTime = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  return brasiliaTime
}

// Função para verificar se passou meia-noite em Brasília
function needsDailyReset(lastReset: Date | null): boolean {
  if (!lastReset) return true

  const now = getBrasiliaDate()
  const last = new Date(lastReset.getTime() - 3 * 60 * 60 * 1000)

  // Comparar apenas a data (ano, mês, dia)
  return (
    now.getUTCFullYear() !== last.getUTCFullYear() ||
    now.getUTCMonth() !== last.getUTCMonth() ||
    now.getUTCDate() !== last.getUTCDate()
  )
}

// Função auxiliar para resetar limites diários se necessário
async function resetDailyLimitsIfNeeded(db: any, userId: string, accountType: string) {
  const usersCollection = db.collection('users')
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
  if (!user) return null

  const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset) : null
  const needsReset = needsDailyReset(lastReset)

  if (needsReset) {
    const now = new Date()
    
    // Determinar limite baseado no tipo de conta
    const limits: Record<string, number> = {
      gratuito: 3,
      trial: 5,
      premium: 10,
    }
    const examsPerDay = limits[accountType] || 3

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: examsPerDay,
          dailyAiQuestionsUsed: 0,
          lastDailyReset: now,
        },
      }
    )

    return {
      ...user,
      dailyPersonalExamsCreated: 0,
      dailyPersonalExamsRemaining: examsPerDay,
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
      feedbackMode = 'end',
    } = body

    // Validação: campos obrigatórios
    if (!title || !numberOfAlternatives || !scoringMethod) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Para provas não-pessoais, numberOfQuestions é obrigatório
    if (!isPersonalExam && !numberOfQuestions) {
      return NextResponse.json(
        { error: 'Número de questões é obrigatório para provas públicas' },
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
      // Obter tipo de conta primeiro
      const tempUser = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
      if (!tempUser) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }
      
      const accountType = tempUser.accountType || 'gratuito'
      
      // Resetar limites se necessário
      const user = await resetDailyLimitsIfNeeded(db, session.userId, accountType)
      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }
      const dailyExamsUsed = user.dailyPersonalExamsCreated || 0
      const dailyAiQuestionsUsed = user.dailyAiQuestionsUsed || 0

      // Calcular limites baseado no tipo de conta
      const dailyExamsLimits: Record<string, number> = {
        gratuito: 3,
        trial: 5,
        premium: 10,
      }
      const aiQuestionsLimits: Record<string, number> = {
        gratuito: 5,
        trial: 10,
        premium: 20,
      }
      const dailyExamsLimit = dailyExamsLimits[accountType] || 3
      const aiQuestionsPerExamLimit = aiQuestionsLimits[accountType] || 5

      // Se admin setou um valor de "restantes", usar esse para calcular se pode criar
      let examsRemaining = dailyExamsLimit - dailyExamsUsed
      if (user.dailyPersonalExamsRemaining !== undefined) {
        examsRemaining = user.dailyPersonalExamsRemaining
      }

      // Validar limite diário de provas pessoais
      if (examsRemaining <= 0) {
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
      const updateData: any = {
        $inc: {
          dailyPersonalExamsCreated: 1,
          dailyAiQuestionsUsed: aiQuestionsCount,
        },
      }
      
      // Se admin setou um valor de "restantes", decrementar esse valor também
      if (user.dailyPersonalExamsRemaining !== undefined) {
        updateData.$inc.dailyPersonalExamsRemaining = -1
      }

      await usersCollection.updateOne(
        { _id: new ObjectId(session.userId) },
        updateData
      )
    }

    // Apenas admin pode criar provas públicas (não pessoais)
    if (!isPersonalExam && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar provas públicas' },
        { status: 403 }
      )
    }

    // Para provas práticas, usar datas que permitem acesso imediato
    const now = new Date()
    const defaultFutureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 ano no futuro

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
      startTime: startTime ? new Date(startTime) : (isPracticeExam ? now : new Date()),
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
      feedbackMode: feedbackMode as 'end' | 'immediate',
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
