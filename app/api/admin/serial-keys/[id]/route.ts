import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/payments/audit'
import { SERIAL_KEYS_COLLECTION, isValidEmail, sanitizeName, firstNameOf } from '@/lib/serial-keys'
import { sendSerialKeyEmail } from '@/lib/serial-key-fulfillment'
import { estadoDaKey, serializarKeyParaAdmin } from '@/lib/serial-key-emissao'
import type { SerialKey } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

async function exigirAdmin() {
  const session = await getSession()
  return session && session.role === 'admin' ? session : null
}

/**
 * Ações administrativas sobre uma Serial Key (de compra ou emitida pelo admin):
 *  - action: 'resend' → (re)envia o e-mail de ativação com QR + comprovante PDF.
 *    Numa key emitida ainda não ativada, `email`/`nome` definem (ou trocam) o
 *    destinatário antes do envio; `restringirAoEmail` amarra a ativação a ele.
 *  - action: 'cancel' → cancela/desativa a serial key.
 */
export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await exigirAdmin()
  if (!session) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const id = params.id
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as any
  const action = String(body?.action || '')

  const db = await getDb()
  const col = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)
  const _id = new ObjectId(id) as any
  let serial = await col.findOne({ _id })
  if (!serial) {
    return NextResponse.json({ error: 'Serial key não encontrada' }, { status: 404 })
  }
  const compra = serial.origin === 'purchase'

  if (action === 'resend') {
    if (!serial.grant || !serial.activationToken) {
      return NextResponse.json({ error: 'Key antiga, sem e-mail de ativação. Copie o link e envie você mesmo.' }, { status: 400 })
    }

    const novoEmail = String(body?.email || '').trim().toLowerCase()
    if (novoEmail && !compra) {
      if (!isValidEmail(novoEmail)) return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
      if (estadoDaKey(serial) !== 'unactivated') {
        return NextResponse.json({ error: 'Esta key já foi ativada ou cancelada.' }, { status: 409 })
      }
      const nome = sanitizeName(body?.nome || '') || (novoEmail === serial.buyerEmail ? serial.buyerName || '' : '')
      await col.updateOne({ _id }, {
        $set: {
          buyerEmail: novoEmail,
          buyerName: nome,
          buyerFirstName: firstNameOf(nome),
          restrictActivationToBuyerEmail: body?.restringirAoEmail === true,
        },
      })
      serial = (await col.findOne({ _id }))!
    }

    if (!serial.buyerEmail) {
      return NextResponse.json({ error: 'Informe o e-mail do destinatário.' }, { status: 400 })
    }
    const sent = await sendSerialKeyEmail(db, serial, { kind: compra ? 'resend' : 'purchase', sentBy: session.userId })
    await audit({
      action: 'order_created',
      actorUserId: session.userId,
      resourceType: 'serial_key',
      resourceId: id,
      metadata: { action: 'resend_email', to: serial.buyerEmail, sent },
    })
    const atual = await col.findOne({ _id })
    return NextResponse.json({
      ok: sent,
      message: sent ? `E-mail enviado para ${serial.buyerEmail}.` : 'Falha ao enviar o e-mail.',
      key: atual ? serializarKeyParaAdmin(atual) : null,
    }, { status: sent ? 200 : 502 })
  }

  if (action === 'cancel') {
    // Uma key emitida e já ativada já entregou o produto: cancelar aqui não
    // tiraria nada de ninguém. O acesso se revoga onde ele mora.
    if (!compra && estadoDaKey(serial) === 'activated') {
      return NextResponse.json({
        error: 'Esta key já foi ativada. Para tirar o acesso, revogue-o em "Gerenciar acessos" do item.',
      }, { status: 409 })
    }
    await col.updateOne(
      { _id },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: session.userId,
          cancelReason: String(body?.reason || 'Cancelada pelo administrador'),
        },
      }
    )
    await audit({
      action: 'role_revoked',
      actorUserId: session.userId,
      resourceType: 'serial_key',
      resourceId: id,
      metadata: { action: 'cancel', productType: serial.productType, origin: serial.origin || 'admin' },
    })
    const atual = await col.findOne({ _id })
    return NextResponse.json({ ok: true, message: 'Serial key cancelada.', key: atual ? serializarKeyParaAdmin(atual) : null })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}

/**
 * Exclui uma key emitida pelo admin que ninguém ativou. Keys de compra nunca
 * saem daqui (são o registro do pagamento): para elas existe o cancelamento.
 */
export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await exigirAdmin()
  if (!session) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  if (!params.id || !ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }
  const db = await getDb()
  const col = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)
  const _id = new ObjectId(params.id) as any
  const serial = await col.findOne({ _id })
  if (!serial) return NextResponse.json({ error: 'Serial key não encontrada' }, { status: 404 })
  if (serial.origin === 'purchase') {
    return NextResponse.json({ error: 'Keys de compra não são excluídas — cancele-a.' }, { status: 400 })
  }
  if (estadoDaKey(serial) === 'activated') {
    return NextResponse.json({ error: 'Não é possível excluir uma key já ativada.' }, { status: 400 })
  }

  await col.deleteOne({ _id })
  await audit({
    action: 'role_revoked',
    actorUserId: session.userId,
    resourceType: 'serial_key',
    resourceId: params.id,
    metadata: { action: 'delete', productType: serial.productType, key: serial.key.slice(0, 5) },
  })
  return NextResponse.json({ ok: true, message: 'Serial key excluída.' })
}
