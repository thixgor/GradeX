import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { mesmoDiaEmBrasilia } from '@/lib/fuso-brasilia'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isPlusAccount } from '@/lib/account-tier'

export const dynamic = 'force-dynamic'

// Função para resetar limites diários se necessário
async function resetDailyLimitsIfNeeded(userId: string) {
  const client = await clientPromise
  const db = client.db('DomineAqui')
  const usersCollection = db.collection('users')

  const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
  if (!user) return null

  const now = new Date()
  const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset) : null

  /*
   * "Outro dia" é outro dia em BRASÍLIA.
   *
   * Era `now.getDate() !== lastReset.getDate()`, e `getDate()` usa o fuso de
   * quem executa — o servidor, que roda em UTC. O dia virava às 00h UTC, ou
   * seja, às 21h de Brasília: das 21h à meia-noite o aluno ganhava uma cota
   * nova de um dia que, para ele, ainda era o mesmo. E quem usasse a cota
   * às 20h59 a via zerar um minuto depois.
   *
   * `getDate()` sozinho também tratava 10 de maio e 10 de junho como o mesmo
   * dia; a comparação por "AAAA-MM-DD" não tem esse buraco.
   */
  const needsReset = !lastReset || !mesmoDiaEmBrasilia(now, lastReset)

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

// Função para calcular limites baseado no tipo de conta
function calculateLimits(accountType: string | undefined, role: string) {
  // Admin tem limites infinitos
  if (role === 'admin') {
    return {
      dailyExamsLimit: Infinity,
      aiQuestionsPerExamLimit: Infinity,
    }
  }

  // Plus+ libera a plataforma inteira — sem teto de provas nem de questões.
  if (isPlusAccount(accountType)) {
    return {
      dailyExamsLimit: Infinity,
      aiQuestionsPerExamLimit: Infinity,
    }
  }

  if (accountType === 'trial') {
    return {
      dailyExamsLimit: 10,
      aiQuestionsPerExamLimit: 20,
    }
  }

  // Gratuito (ou sem accountType definido)
  return {
    dailyExamsLimit: 5,
    aiQuestionsPerExamLimit: 5,
  }
}

// GET - Obter limites restantes do usuário
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Resetar limites se necessário
    const user = await resetDailyLimitsIfNeeded(session.userId)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const limits = calculateLimits(user.accountType, user.role || 'user')

    const dailyExamsUsed = user.dailyPersonalExamsCreated || 0
    const dailyAiQuestionsUsed = user.dailyAiQuestionsUsed || 0

    const response = {
      accountType: user.accountType || 'gratuito',
      role: user.role || 'user',
      limits: {
        dailyExams: limits.dailyExamsLimit,
        aiQuestionsPerExam: limits.aiQuestionsPerExamLimit,
      },
      used: {
        dailyExams: dailyExamsUsed,
        dailyAiQuestions: dailyAiQuestionsUsed,
      },
      remaining: {
        dailyExams:
          limits.dailyExamsLimit === Infinity
            ? Infinity
            : Math.max(0, limits.dailyExamsLimit - dailyExamsUsed),
        dailyAiQuestions:
          limits.aiQuestionsPerExamLimit === Infinity
            ? Infinity
            : Math.max(0, limits.aiQuestionsPerExamLimit * limits.dailyExamsLimit - dailyAiQuestionsUsed),
      },
      lastReset: user.lastDailyReset,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Erro ao buscar limites:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
