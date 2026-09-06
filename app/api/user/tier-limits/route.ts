import { NextRequest, NextResponse } from 'next/server'
import { mesmoDiaEmBrasilia } from '@/lib/fuso-brasilia'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { getTierLimits, getCronogramasLimit, getFlashcardsLimit, getPersonalExamsLifetimeLimit } from '@/lib/tier-limits'
import { ObjectId } from 'mongodb'
import { sendOneTimePaymentEndedEmail } from '@/lib/mail'
import { contaEhPaga } from '@/lib/cargos-server'

export const dynamic = 'force-dynamic'

/**
 * O dia virou para esta pessoa?
 *
 * Isto era `getBrasiliaDate()` + `needsDailyReset()` copiados em três rotas,
 * cada cópia subtraindo três horas na mão e comparando em UTC. Funcionava, mas
 * havia uma QUARTA regra em `app/api/user/limits/route.ts` que comparava
 * `getDate()` cru — ou seja, no fuso do servidor, que é UTC. Duas definições
 * de "novo dia" no mesmo sistema, e a cota do aluno virava às 21h por uma
 * delas.
 *
 * Agora as quatro chamam `mesmoDiaEmBrasilia`, que pergunta o dia ao `Intl` em
 * vez de subtrair um número fixo — e continua certo se o horário de verão
 * voltar.
 */
function needsDailyReset(lastReset: Date | null): boolean {
  return !lastReset || !mesmoDiaEmBrasilia(new Date(), lastReset)
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

    // --- CHECK EXPIRATION ---
    const now = new Date()
    let accountType = user.accountType || 'gratuito'

    // Verificar expiração do cargo pago (qualquer um do registro) ou do Trial
    const isPaid = await contaEhPaga(accountType, db)
    const expiresAt = isPaid ? user.premiumExpiresAt : (accountType === 'trial' ? user.trialExpiresAt : null)

    if (expiresAt && new Date(expiresAt) <= now && session.role !== 'admin') {
      console.log(`Plano ${accountType} expirou para o usuário ${user._id}. Revertendo para gratuito.`)
      accountType = 'gratuito'
      const updateData: any = {
        accountType: 'gratuito',
        dailyPersonalExamsCreated: 0,
        lastDailyReset: now
      }
      if (isPaid) {
        updateData.premiumExpiresAt = null
      } else {
        updateData.trialExpiresAt = null
      }

      await usersCollection.updateOne(
        { _id: new ObjectId(session.userId) },
        { $set: updateData }
      )

      // Enviar e-mail avisando que acabou
      sendOneTimePaymentEndedEmail(user.email, user.name).catch(err => {
        console.error('Erro ao enviar email de fim de plano:', err)
      })
    }
    // -----------------------

    const isAdmin = session.role === 'admin'
    const limits = getTierLimits(accountType, isAdmin)

    // Obter limites vitais
    const cronogramasLimit = getCronogramasLimit(accountType)
    const flashcardsLimit = getFlashcardsLimit(accountType)
    const personalExamsLifetimeLimit = getPersonalExamsLifetimeLimit(accountType)

    // Verificar se precisa fazer reset diário (baseado em horário de Brasília)
    const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset) : null
    const needsReset = needsDailyReset(lastReset)

    if (needsReset && !isAdmin) {
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
        cronogramasLimit,
        flashcardsLimit,
        personalExamsLifetimeLimit,
      })
    }

    const examsCreatedToday = user.dailyPersonalExamsCreated || 0
    const questionsUsedToday = user.dailyAiQuestionsUsed || 0

    // Se admin setou um valor de "restantes", usar esse valor
    // Caso contrário, calcular baseado em "criadas"
    const examsRemaining = user.dailyPersonalExamsRemaining !== undefined
      ? user.dailyPersonalExamsRemaining
      : Math.max(0, limits.examsPerDay - examsCreatedToday)

    // Obter contadores vitais
    const cronogramasUsed = await db.collection('cronogramas').countDocuments({ usuarioId: session.userId })
    const flashcardsUsed = await db.collection('flashcardCards').countDocuments({ userId: session.userId })
    const personalExamsUsed = await db.collection('exams').countDocuments({
      isPersonalExam: true,
      createdBy: session.userId
    })

    return NextResponse.json({
      limits,
      examsRemaining,
      questionsRemaining: limits.questionsPerExam,
      examsCreatedToday,
      questionsUsedToday,
      accountType,
      isAdmin,
      cronogramasLimit,
      flashcardsLimit,
      personalExamsLifetimeLimit,
      cronogramasUsed,
      flashcardsUsed,
      personalExamsUsed,
    })
  } catch (error: any) {
    console.error('Erro ao obter limites de tier:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
