import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { getTierLimits } from '@/lib/tier-limits'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Obter limites de tier do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const isAdmin = session.role === 'admin'
    const accountType = user.accountType || 'gratuito'
    const limits = getTierLimits(accountType, isAdmin)

    // Verificar se precisa fazer reset diário
    const now = new Date()
    const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset) : null
    const needsReset = !lastReset || (now.getTime() - lastReset.getTime()) > 24 * 60 * 60 * 1000

    if (needsReset && !isAdmin) {
      // Resetar contadores
      await usersCollection.updateOne(
        { _id: new ObjectId(session.userId) },
        {
          $set: {
            dailyPersonalExamsCreated: 0,
            dailyPersonalExamsRemaining: undefined, // Limpar para recalcular
            dailyAiQuestionsUsed: 0,
            lastDailyReset: now,
          },
        }
      )

      return NextResponse.json({
        limits,
        examsRemaining: limits.examsPerDay,
        questionsRemaining: limits.questionsPerExam,
        accountType,
        isAdmin,
      })
    }

    const examsCreatedToday = user.dailyPersonalExamsCreated || 0
    const questionsUsedToday = user.dailyAiQuestionsUsed || 0
    
    // Se admin setou um valor de "restantes", usar esse valor
    // Caso contrário, calcular baseado em "criadas"
    const examsRemaining = user.dailyPersonalExamsRemaining !== undefined
      ? user.dailyPersonalExamsRemaining
      : Math.max(0, limits.examsPerDay - examsCreatedToday)

    return NextResponse.json({
      limits,
      examsRemaining,
      questionsRemaining: limits.questionsPerExam,
      examsCreatedToday,
      questionsUsedToday,
      accountType,
      isAdmin,
    })
  } catch (error: any) {
    console.error('Erro ao obter limites de tier:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
