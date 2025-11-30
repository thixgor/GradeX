import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { getTierLimits } from '@/lib/tier-limits'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

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

    // Verificar se precisa fazer reset diário (baseado em horário de Brasília)
    const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset) : null
    const needsReset = needsDailyReset(lastReset)

    if (needsReset && !isAdmin) {
      const now = new Date()
      
      // Resetar contadores
      await usersCollection.updateOne(
        { _id: new ObjectId(session.userId) },
        {
          $set: {
            dailyPersonalExamsCreated: 0,
            dailyPersonalExamsRemaining: limits.examsPerDay, // Setar com o limite correto
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
