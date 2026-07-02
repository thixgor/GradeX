import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { computeStreak } from '@/lib/streak'
import { sendSpacedReviewEmail } from '@/lib/mail'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DAY = 24 * 60 * 60 * 1000
// Janela de inatividade para reengajar: parou entre 3 e 14 dias. Antes de 3 dias
// é cedo; depois de 14 a conta esfriou e o e-mail vira spam.
const MIN_DIAS_PARADO = 3
const MAX_DIAS_PARADO = 14
const REENVIO_MIN_DIAS = 7
const MAX_POR_EXECUCAO = 200

/**
 * Cron diário de revisão espaçada: reengaja quem estudava e parou há alguns
 * dias, usando o streak (aversão à perda) e a questão do dia como isca.
 * Auth: header `x-cron-token` deve bater com process.env.CRON_TOKEN (se setado).
 */
export async function GET(request: NextRequest) {
  const token = process.env.CRON_TOKEN
  if (token) {
    const header = request.headers.get('x-cron-token') || ''
    if (header !== token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const now = new Date()
  const janelaInicio = new Date(now.getTime() - (MAX_DIAS_PARADO + 1) * DAY)
  const janelaFim = new Date(now.getTime() - MIN_DIAS_PARADO * DAY)

  // Última atividade por usuário (banco de questões + provas).
  const lastByUser = new Map<string, Date>()

  const bancoAgg = await db
    .collection('banco_resolucoes')
    .aggregate([{ $group: { _id: '$userId', last: { $max: '$createdAt' } } }])
    .toArray()
  for (const row of bancoAgg as any[]) {
    if (!row.last) continue
    const key = String(row._id)
    const d = new Date(row.last)
    const prev = lastByUser.get(key)
    if (!prev || d > prev) lastByUser.set(key, d)
  }

  const provasAgg = await db
    .collection('submissions')
    .aggregate([{ $group: { _id: '$userId', last: { $max: '$submittedAt' } } }])
    .toArray()
  for (const row of provasAgg as any[]) {
    if (!row.last) continue
    const key = String(row._id)
    const d = new Date(row.last)
    const prev = lastByUser.get(key)
    if (!prev || d > prev) lastByUser.set(key, d)
  }

  // Candidatos: última atividade dentro da janela de inatividade.
  const candidatos: Array<{ userId: string; last: Date }> = []
  for (const [userId, last] of lastByUser) {
    if (last >= janelaInicio && last <= janelaFim) candidatos.push({ userId, last })
  }

  let enviados = 0
  let pulados = 0

  for (const cand of candidatos.slice(0, MAX_POR_EXECUCAO)) {
    let userDoc: User | null = null
    try {
      userDoc = await db.collection<User>('users').findOne({ _id: new ObjectId(cand.userId) })
    } catch {
      userDoc = null
    }
    if (!userDoc || !userDoc.email) {
      pulados++
      continue
    }

    // Respeita quem não confirmou o e-mail (evita bounce).
    if (userDoc.emailVerified === false) {
      pulados++
      continue
    }

    // Não reenviar dentro da janela mínima.
    const lastEmail = (userDoc as any).lastSpacedReviewEmailAt
    if (lastEmail && now.getTime() - new Date(lastEmail).getTime() < REENVIO_MIN_DIAS * DAY) {
      pulados++
      continue
    }

    // Streak real do usuário para o gatilho de aversão à perda.
    const activityDates: Date[] = []
    try {
      const res = await db
        .collection('banco_resolucoes')
        .find({ userId: new ObjectId(cand.userId) }, { projection: { createdAt: 1 } })
        .toArray()
      for (const r of res as any[]) if (r.createdAt) activityDates.push(new Date(r.createdAt))
    } catch {
      // coleção pode não existir
    }
    const subs = await db
      .collection('submissions')
      .find({ userId: cand.userId }, { projection: { submittedAt: 1 } })
      .toArray()
    for (const s of subs as any[]) if (s.submittedAt) activityDates.push(new Date(s.submittedAt))

    const streak = computeStreak(activityDates, now)
    const diasParado = Math.floor((now.getTime() - cand.last.getTime()) / DAY)

    try {
      await sendSpacedReviewEmail({
        email: userDoc.email,
        name: userDoc.name || '',
        streakDays: streak.current,
        diasParado,
      })
      await db
        .collection('users')
        .updateOne({ _id: userDoc._id as any }, { $set: { lastSpacedReviewEmailAt: now } })
      enviados++
    } catch (error) {
      console.error('[revisao-espacada] falha ao enviar para', userDoc.email, error)
      pulados++
    }
  }

  return NextResponse.json({ candidatos: candidatos.length, enviados, pulados })
}
