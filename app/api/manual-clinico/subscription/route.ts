import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getLatestManualClinicoPurchase,
  MANUAL_CLINICO_PURCHASES_COLLECTION,
} from '@/lib/manual-clinico-product'
import type { ManualClinicoPurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PatchSchema = z.object({
  action: z.enum(['decline_renewal', 'undo_decline']),
})

/**
 * PATCH /api/manual-clinico/subscription
 *
 * decline_renewal: usuário (pix) opta por NÃO renovar. Marca a compra atual
 * com renewalDeclined=true e revoga imediatamente o acesso (status='revoked').
 *
 * undo_decline: caso o usuário se arrependa antes do acesso ser revogado.
 */
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Body invalido' }, { status: 400 }) }
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })

  const db = await getDb()
  const purchase = await getLatestManualClinicoPurchase(db, session)
  if (!purchase || !purchase._id) {
    return NextResponse.json({ error: 'Nenhuma assinatura encontrada.' }, { status: 404 })
  }

  if (parsed.data.action === 'decline_renewal') {
    // Para pix: marca como recusado + remove acesso imediatamente.
    // (O acesso pago temporário continua até expiresAt em outros casos, mas
    //  o usuário pediu pra "remover acesso" ao recusar a renovação.)
    await db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).updateOne(
      { _id: purchase._id as any },
      {
        $set: {
          renewalDeclined: true,
          status: 'revoked',
          revokedAt: new Date(),
          revokedByName: 'Usuário (recusou renovação)',
        },
      }
    )
    return NextResponse.json({ success: true, declined: true, revoked: true })
  }

  if (parsed.data.action === 'undo_decline') {
    await db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).updateOne(
      { _id: purchase._id as any },
      { $set: { renewalDeclined: false } }
    )
    return NextResponse.json({ success: true, declined: false })
  }

  return NextResponse.json({ error: 'Acao invalida' }, { status: 400 })
}
