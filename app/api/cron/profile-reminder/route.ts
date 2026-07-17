import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { sendProfileReminderEmail } from '@/lib/mail'
import { getMissingProfileFields } from '@/lib/profile-completeness'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DAY = 24 * 60 * 60 * 1000
// Não muito frequente (pedido explícito): no máximo 1 lembrete a cada 30 dias
// por usuário, mesmo que o cron externo rode com mais frequência.
const REENVIO_MIN_DIAS = 30
// Dá um tempo pro usuário recém-cadastrado — ele acabou de preencher tudo
// no cadastro, não faz sentido cobrar de novo nos primeiros dias.
const CONTA_MIN_DIAS = 5
const MAX_POR_EXECUCAO = 300

/**
 * Cron externo (rodar via cron-job.org — NÃO está no vercel.json porque o
 * plano Hobby da Vercel só permite crons diários e o projeto já usa todos).
 * Sugestão de frequência: semanal. O envio por usuário é limitado por
 * REENVIO_MIN_DIAS de qualquer forma, então rodar mais vezes não spamma
 * ninguém — só reduz a latência até o próximo usuário elegível ser pego.
 *
 * Lembra usuários com dados de perfil incompletos (telefone, estado e os
 * campos específicos da profissão atual — especialidade pro médico,
 * área/hospital/ano pro residente, instituição pro acadêmico) de
 * completá-los em /profile.
 *
 * Auth: header `x-cron-token` deve bater com process.env.CRON_TOKEN (se
 * setado). Configure esse header na chamada HTTP do cron-job.org.
 */
export async function GET(request: NextRequest) {
  const token = process.env.CRON_TOKEN
  if (token) {
    const header = request.headers.get('x-cron-token') || ''
    if (header !== token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const usersCollection = db.collection<User>('users')
  const now = new Date()
  const cooldownCutoff = new Date(now.getTime() - REENVIO_MIN_DIAS * DAY)
  const minAccountAge = new Date(now.getTime() - CONTA_MIN_DIAS * DAY)

  const candidatos = await usersCollection
    .find(
      {
        banned: { $ne: true },
        emailVerified: true,
        createdAt: { $lte: minAccountAge },
        $or: [
          { profileReminderLastSentAt: { $exists: false } },
          { profileReminderLastSentAt: { $lte: cooldownCutoff } },
        ],
      },
      {
        projection: {
          email: 1,
          name: 1,
          phone: 1,
          state: 1,
          profession: 1,
          specialty: 1,
          residencySpecialty: 1,
          residencyHospital: 1,
          residencyYear: 1,
          afyaUnit: 1,
        },
      }
    )
    .limit(MAX_POR_EXECUCAO)
    .toArray()

  let enviados = 0
  let pulados = 0

  for (const user of candidatos) {
    if (!user.email) {
      pulados++
      continue
    }

    const missing = getMissingProfileFields(user)
    if (missing.length === 0) {
      pulados++
      continue
    }

    try {
      await sendProfileReminderEmail({
        email: user.email,
        name: user.name || '',
        missing: missing.map((m) => m.label),
      })
      await usersCollection.updateOne(
        { _id: user._id as any },
        { $set: { profileReminderLastSentAt: now } }
      )
      enviados++
    } catch (error) {
      console.error('[profile-reminder] falha ao enviar para', user.email, error)
      pulados++
    }
  }

  return NextResponse.json({ ok: true, candidatos: candidatos.length, enviados, pulados })
}
