import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/payments/audit'
import { SERIAL_KEYS_COLLECTION } from '@/lib/serial-keys'
import { sendSerialKeyEmail } from '@/lib/serial-key-fulfillment'
import type { SerialKey } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Ações administrativas sobre uma Serial Key de compra:
 *  - action: 'resend' → reenvia o e-mail de ativação com QR + comprovante PDF.
 *  - action: 'cancel' → cancela/desativa a serial key.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const id = params.id
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const action = String((body as any)?.action || '')

  const db = await getDb()
  const col = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)
  const serial = await col.findOne({ _id: new ObjectId(id) as any })
  if (!serial || serial.origin !== 'purchase') {
    return NextResponse.json({ error: 'Serial key não encontrada' }, { status: 404 })
  }

  if (action === 'resend') {
    if (!serial.buyerEmail) {
      return NextResponse.json({ error: 'Compra sem e-mail para reenvio.' }, { status: 400 })
    }
    const sent = await sendSerialKeyEmail(db, serial, { kind: 'resend', sentBy: session.userId })
    await audit({
      action: 'order_created',
      actorUserId: session.userId,
      resourceType: 'serial_key',
      resourceId: id,
      metadata: { action: 'resend_email', to: serial.buyerEmail, sent },
    })
    return NextResponse.json({ ok: sent, message: sent ? 'E-mail reenviado.' : 'Falha ao reenviar e-mail.' })
  }

  if (action === 'cancel') {
    await col.updateOne(
      { _id: new ObjectId(id) as any },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: session.userId,
          cancelReason: String((body as any)?.reason || 'Cancelada pelo administrador'),
        },
      }
    )
    await audit({
      action: 'role_revoked',
      actorUserId: session.userId,
      resourceType: 'serial_key',
      resourceId: id,
      metadata: { action: 'cancel', productType: serial.productType },
    })
    return NextResponse.json({ ok: true, message: 'Serial key cancelada.' })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
