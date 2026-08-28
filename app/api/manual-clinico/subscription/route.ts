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
 * decline_renewal: o usuário avisa que NÃO quer renovar. Marca a compra com
 * renewalDeclined=true e MANTÉM o acesso até `expiresAt` — recusar a próxima
 * cobrança não é o mesmo que abrir mão do período que já foi pago.
 *
 * Antes daqui a ação gravava `status: 'revoked'` na hora: um clique em "Não
 * quero mais, obrigado" apagava dias de acesso comprado, e o aviso só aparecia
 * no segundo clique do botão ("Confirmar e remover acesso"), nunca antes. É a
 * mesma política que a assinatura Plus+ já aplica no cancelamento — cancelar
 * encerra a cobrança futura, não o que a pessoa pagou.
 *
 * undo_decline: caso o usuário se arrependa antes do acesso expirar.
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
    // Só desliga a renovação. O acesso segue valendo até `expiresAt` e o fluxo
    // normal de expiração cuida do resto — nada é revogado aqui.
    await db.collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION).updateOne(
      { _id: purchase._id as any },
      { $set: { renewalDeclined: true } }
    )
    return NextResponse.json({
      success: true,
      declined: true,
      revoked: false,
      accessUntil: purchase.expiresAt || null,
    })
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
