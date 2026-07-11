/**
 * Envio manual de PDF (com marca d'água do comprador) para o e-mail do
 * comprador, disparado por um administrador.
 *
 * Dois enquadramentos, escolhidos por `mode`:
 *   - 'requested' (padrão): "conforme solicitado" — contorna casos em que o
 *     usuário só tem acesso ao visualizador protegido (download desabilitado)
 *     e não consegue baixar o arquivo, evitando pedidos de reembolso.
 *   - 'acquired': confirma que o comprador adquiriu o produto e já tem acesso.
 *
 * Dois destinos possíveis:
 *   - `purchaseId`: uma compra em `material_purchases` (comprador com conta).
 *   - `serialKeyId`: uma serial key ainda NÃO ativada em `serial_keys`
 *     (compra feita SEM login). Nesse caso o e-mail sempre usa o enquadramento
 *     de aquisição e inclui a serial key + link de ativação, deixando claro que
 *     o acesso fica vinculado exclusivamente ao e-mail usado na compra.
 *
 * O PDF chega anexado com a mesma marca d'água aplicada nos downloads normais,
 * então o rastreio forense continua funcionando.
 *
 * POST /api/admin/materiais/send-pdf-email
 *   Body: { purchaseId?: string, serialKeyId?: string, mode?: 'requested' | 'acquired' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { Db, ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { sendMaterialPdfDeliveryEmail, sendMaterialAcquiredEmail } from '@/lib/mail'
import { getActivationUrl } from '@/lib/serial-keys'
import {
  type PdfEmailItem as PdfItem,
  resolveMaterialsWithPdf,
  prepareWatermarkedItems,
} from '@/lib/material-pdf-email'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Valida os limites de tamanho após preparar os anexos. Retorna uma resposta
 * de erro pronta se algo estourar, ou null se estiver tudo certo.
 */
function checkSizeLimits(items: PdfItem[], skipped: { title: string; reason: string }[]): NextResponse | null {
  if (items.length === 0) {
    const tooBig = skipped.filter((s) => s.reason.includes('máx.'))
    if (tooBig.length > 0) {
      return NextResponse.json(
        {
          error:
            `O PDF é grande demais para envio por e-mail: ${tooBig.map((s) => `${s.title} — ${s.reason}`).join('; ')}. ` +
            `Reduza/comprima o arquivo ou disponibilize o download pelo painel.`,
        },
        { status: 413 }
      )
    }
    return NextResponse.json(
      { error: 'Falha ao preparar o(s) PDF(s) para envio. Tente novamente.' },
      { status: 502 }
    )
  }

  const totalBytes = items.reduce((sum, item) => sum + item.buffer.byteLength, 0)
  const MAX_TOTAL_MB = Number(process.env.PDF_EMAIL_MAX_TOTAL_MB) || 100
  const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      {
        error: `O(s) arquivo(s) somam ${(totalBytes / 1024 / 1024).toFixed(1)}MB, acima do limite para envio por e-mail (${MAX_TOTAL_MB}MB). Reduza o tamanho do PDF ou envie por outro meio.`,
      },
      { status: 413 }
    )
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const purchaseId = typeof body?.purchaseId === 'string' ? body.purchaseId : ''
    const serialKeyId = typeof body?.serialKeyId === 'string' ? body.serialKeyId : ''
    const mode: 'requested' | 'acquired' = body?.mode === 'acquired' ? 'acquired' : 'requested'

    const db = await getDb()

    // ── Fluxo convidado: compra sem login (serial key não ativada) ───────────
    if (serialKeyId) {
      return await handleGuestSerialKey(db, session, serialKeyId)
    }

    // ── Fluxo padrão: comprador com conta (material_purchases) ───────────────
    if (!purchaseId || !isValidObjectId(purchaseId)) {
      return NextResponse.json({ error: 'purchaseId inválido' }, { status: 400 })
    }

    const purchase = await db.collection('material_purchases').findOne({ _id: new ObjectId(purchaseId) })
    if (!purchase || purchase.status !== 'completed') {
      return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
    }

    // Dados do usuário: prioriza o cadastro atual (nome/email podem ter mudado).
    let userId = purchase.userId ? String(purchase.userId) : ''
    let userName = purchase.userName || ''
    let userEmail = purchase.userEmail || ''
    if (userId && isValidObjectId(userId)) {
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { name: 1, email: 1 } }
      )
      if (user) {
        userName = user.name || userName
        userEmail = user.email || userEmail
      }
    }
    if (!userEmail) {
      return NextResponse.json({ error: 'Usuário sem e-mail cadastrado' }, { status: 422 })
    }

    if (!purchase.itemId || !isValidObjectId(String(purchase.itemId))) {
      return NextResponse.json({ error: 'Compra sem item associado válido.' }, { status: 422 })
    }
    if (purchase.itemType !== 'material' && purchase.itemType !== 'package') {
      return NextResponse.json({ error: `Tipo de item não suportado: ${purchase.itemType}` }, { status: 422 })
    }

    const materialsWithPdf = await resolveMaterialsWithPdf(db, purchase.itemType, String(purchase.itemId))
    if (materialsWithPdf.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum PDF disponível para envio neste item.' },
        { status: 422 }
      )
    }

    const orderId = purchase.providerPaymentId || purchase.providerOrderId || String(purchase._id)
    const { items, sentMaterialIds, skipped } = await prepareWatermarkedItems(materialsWithPdf, {
      userName,
      userEmail,
      userId: userId || String(purchase._id),
      orderId,
    })

    const sizeError = checkSizeLimits(items, skipped)
    if (sizeError) return sizeError

    try {
      if (mode === 'acquired') {
        await sendMaterialAcquiredEmail({ email: userEmail, name: userName, items })
      } else {
        await sendMaterialPdfDeliveryEmail({ email: userEmail, name: userName, items })
      }
    } catch (err: any) {
      console.error('[admin-send-pdf-email] Falha ao enviar e-mail (SMTP):', err)
      const detail = err?.responseCode || err?.code || err?.message
      return NextResponse.json(
        { error: `Falha ao enviar o e-mail${detail ? ` (${detail})` : ''}. Verifique a configuração de SMTP.` },
        { status: 502 }
      )
    }

    // Auditoria não deve bloquear a resposta: o e-mail já foi enviado com
    // sucesso neste ponto. Se o log falhar, apenas registramos no console.
    db.collection('audit_logs').insertOne({
      action: 'material_pdf_email_delivery',
      mode,
      adminId: session.userId,
      adminName: session.name,
      userId,
      userName,
      userEmail,
      purchaseId,
      itemType: purchase.itemType,
      itemId: purchase.itemId,
      materialIds: sentMaterialIds,
      orderId,
      sentAt: new Date(),
    }).catch((e) => console.error('[admin-send-pdf-email] Falha ao gravar auditoria:', e))

    return NextResponse.json({
      success: true,
      sentTo: userEmail,
      mode,
      materialsCount: items.length,
      skipped: skipped.map((s) => `${s.title} (${s.reason})`),
    })
  } catch (error: any) {
    console.error('[admin-send-pdf-email] Erro ao enviar PDF por e-mail:', error)
    const detail = error?.message || String(error)
    return NextResponse.json(
      { error: `Erro ao enviar o PDF por e-mail: ${detail}` },
      { status: 500 }
    )
  }
}

/**
 * Compra feita SEM login: a serial key ainda não foi ativada. Envia o PDF com
 * marca d'água ao e-mail da compra, com a serial key + link de ativação,
 * privativos ao e-mail do comprador.
 */
async function handleGuestSerialKey(db: Db, session: any, serialKeyId: string): Promise<NextResponse> {
  if (!isValidObjectId(serialKeyId)) {
    return NextResponse.json({ error: 'serialKeyId inválido' }, { status: 400 })
  }

  const serial = await db.collection('serial_keys').findOne({ _id: new ObjectId(serialKeyId) })
  if (!serial || serial.origin !== 'purchase') {
    return NextResponse.json({ error: 'Serial key de compra não encontrada' }, { status: 404 })
  }
  if (serial.status === 'cancelled') {
    return NextResponse.json({ error: 'Esta serial key foi cancelada.' }, { status: 422 })
  }

  const grant = serial.grant || {}
  const itemType: string = grant.itemType || (grant.productType === 'package' ? 'package' : 'material')
  const itemId: string = grant.itemId ? String(grant.itemId) : ''
  if (!itemId || !isValidObjectId(itemId) || (itemType !== 'material' && itemType !== 'package')) {
    return NextResponse.json({ error: 'Serial key sem material/pacote associado válido.' }, { status: 422 })
  }

  const buyerEmail = String(serial.buyerEmail || '').trim()
  if (!buyerEmail) {
    return NextResponse.json({ error: 'Serial key sem e-mail de compra.' }, { status: 422 })
  }
  if (!serial.activationToken) {
    return NextResponse.json({ error: 'Serial key sem token de ativação.' }, { status: 422 })
  }

  const materialsWithPdf = await resolveMaterialsWithPdf(db, itemType, itemId)
  if (materialsWithPdf.length === 0) {
    return NextResponse.json({ error: 'Nenhum PDF disponível para envio neste item.' }, { status: 422 })
  }

  const buyerName = serial.buyerName || ''
  const orderId = serial.providerPaymentId || serial.orderId || String(serial._id)
  const { items, sentMaterialIds, skipped } = await prepareWatermarkedItems(materialsWithPdf, {
    userName: buyerName,
    userEmail: buyerEmail,
    userId: String(serial._id),
    orderId,
  })

  const sizeError = checkSizeLimits(items, skipped)
  if (sizeError) return sizeError

  const activationUrl = getActivationUrl(serial.activationToken)
  try {
    await sendMaterialAcquiredEmail({
      email: buyerEmail,
      name: buyerName,
      items,
      serialKey: serial.key,
      activationUrl,
    })
  } catch (err: any) {
    console.error('[admin-send-pdf-email] Falha ao enviar e-mail convidado (SMTP):', err)
    const detail = err?.responseCode || err?.code || err?.message
    return NextResponse.json(
      { error: `Falha ao enviar o e-mail${detail ? ` (${detail})` : ''}. Verifique a configuração de SMTP.` },
      { status: 502 }
    )
  }

  const now = new Date()
  // Registra no histórico de e-mails da serial key (não bloqueia a resposta).
  db.collection('serial_keys').updateOne(
    { _id: new ObjectId(serialKeyId) },
    { $push: { emailHistory: { to: buyerEmail, status: 'sent', kind: 'resend', sentAt: now, sentBy: session.userId } } as any }
  ).catch((e) => console.error('[admin-send-pdf-email] Falha ao registrar histórico da serial key:', e))

  db.collection('audit_logs').insertOne({
    action: 'material_pdf_email_delivery',
    mode: 'acquired',
    guest: true,
    adminId: session.userId,
    adminName: session.name,
    userEmail: buyerEmail,
    userName: buyerName,
    serialKeyId,
    itemType,
    itemId,
    materialIds: sentMaterialIds,
    orderId,
    sentAt: now,
  }).catch((e) => console.error('[admin-send-pdf-email] Falha ao gravar auditoria:', e))

  return NextResponse.json({
    success: true,
    sentTo: buyerEmail,
    mode: 'acquired',
    guest: true,
    materialsCount: items.length,
    skipped: skipped.map((s) => `${s.title} (${s.reason})`),
  })
}
