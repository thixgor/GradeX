import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import {
  MANUAL_CLINICO_PRODUCT_ID,
  MANUAL_CLINICO_PURCHASES_COLLECTION,
} from '@/lib/manual-clinico-product'
import { sendManualClinicoExpirationReminderEmail } from '@/lib/mail'
import type { ManualClinicoPurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron diário: notifica usuários cujo Manual Clínico expira hoje
 * (ou já expirou nas últimas 24h e ainda não foi avisado).
 *
 * Vercel cron: configure em vercel.json para chamar este endpoint 1x/dia.
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
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const minus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Compras temporárias completed que expiram nas próximas 24h ou já expiraram
  // nas últimas 24h, sem reminder enviado, e usuário não recusou renovação.
  const candidates = await db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).find({
    productId: MANUAL_CLINICO_PRODUCT_ID,
    status: 'completed',
    accessType: 'temporary',
    renewalDeclined: { $ne: true },
    expiresAt: { $gte: minus24h, $lte: in24h },
    $or: [
      { renewalReminderSentAt: { $exists: false } },
      { renewalReminderSentAt: null },
    ],
  } as any).toArray()

  let sent = 0
  for (const purchase of candidates) {
    if (!purchase.userEmail || !purchase.expiresAt) continue
    const expires = new Date(purchase.expiresAt)
    const daysRemaining = Math.ceil((expires.getTime() - now.getTime()) / 86_400_000)
    try {
      await sendManualClinicoExpirationReminderEmail({
        email: purchase.userEmail,
        name: purchase.userName || '',
        planLabel: purchase.planLabel || 'Manual Clínico',
        expiresAt: expires,
        paymentMethod: purchase.paymentMethod,
        daysRemaining,
      })
      await db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).updateOne(
        { _id: purchase._id as any },
        { $set: { renewalReminderSentAt: now } }
      )
      sent++
    } catch (err) {
      console.error('[cron manual-clinico] falha email:', err)
    }
  }

  return NextResponse.json({ ok: true, processed: candidates.length, sent })
}
