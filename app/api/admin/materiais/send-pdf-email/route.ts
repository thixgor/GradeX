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
import { fetchMaterialPdfBytes } from '@/lib/material-pdf-viewer'
import { applyWatermark } from '@/lib/pdf-watermark'
import { sendMaterialPdfDeliveryEmail, sendMaterialAcquiredEmail } from '@/lib/mail'
import { getActivationUrl } from '@/lib/serial-keys'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Teto do PDF de origem, alinhado ao limite de upload de materiais (100MB).
// Serve como salvaguarda: o pdf-lib carrega e duplica o arquivo ao aplicar a
// marca d'água, então arquivos acima disso tendem a estourar a memória da
// função. Ajustável via env.
const MAX_ORIGINAL_MB = Number(process.env.PDF_EMAIL_MAX_ORIGINAL_MB) || 100
const MAX_ORIGINAL_BYTES = MAX_ORIGINAL_MB * 1024 * 1024

function safeFilename(title: string): string {
  return (title || 'material')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 80) + '.pdf'
}

type PdfItem = { title: string; filename: string; buffer: Buffer }

/** Identidade aplicada na marca d'água de cada PDF. */
interface WatermarkIdentity {
  userName: string
  userEmail: string
  userId: string
  orderId: string
}

/**
 * Resolve os materiais (com PDF) associados a um item comprado — material
 * único ou pacote (vários materiais).
 */
async function resolveMaterialsWithPdf(
  db: Db,
  itemType: string,
  itemId: string
): Promise<any[]> {
  let materials: any[] = []
  if (itemType === 'material' || itemType === 'flashcard') {
    const material = await db.collection('materials').findOne(
      { _id: new ObjectId(itemId) },
      { projection: { title: 1, pdfFile: 1 } }
    )
    if (material) materials = [material]
  } else if (itemType === 'package') {
    const pkg = await db.collection('material_packages').findOne(
      { _id: new ObjectId(itemId) },
      { projection: { materialIds: 1 } }
    )
    const materialIds: string[] = Array.isArray(pkg?.materialIds) ? pkg!.materialIds : []
    if (materialIds.length > 0) {
      const objectIds = materialIds.filter(isValidObjectId).map((id) => new ObjectId(id))
      materials = objectIds.length
        ? await db.collection('materials')
            .find({ _id: { $in: objectIds } }, { projection: { title: 1, pdfFile: 1 } })
            .toArray()
        : []
    }
  }
  return materials.filter((m) => m.pdfFile?.blobUrl)
}

/**
 * Baixa e aplica marca d'água em cada PDF, em série (mantém o pico de memória
 * baixo). Retorna os anexos prontos e o que foi pulado (tamanho/falha).
 */
async function prepareWatermarkedItems(
  materials: any[],
  identity: WatermarkIdentity
): Promise<{ items: PdfItem[]; sentMaterialIds: string[]; skipped: { title: string; reason: string }[] }> {
  const now = new Date()
  const items: PdfItem[] = []
  const sentMaterialIds: string[] = []
  const skipped: { title: string; reason: string }[] = []

  for (const material of materials) {
    const title = material.title || 'Material'
    try {
      const original = await fetchMaterialPdfBytes(material.pdfFile.blobUrl)
      const originalBytes = original.byteLength
      if (originalBytes > MAX_ORIGINAL_BYTES) {
        const sizeMb = (originalBytes / 1024 / 1024).toFixed(1)
        console.warn(
          `[admin-send-pdf-email] PDF "${title}" (${material._id}) tem ${sizeMb}MB, acima do limite de ${MAX_ORIGINAL_MB}MB — pulado.`
        )
        skipped.push({ title, reason: `${sizeMb}MB (máx. ${MAX_ORIGINAL_MB}MB)` })
        continue
      }
      const watermarked = await applyWatermark(original, {
        userName: identity.userName,
        userEmail: identity.userEmail,
        userId: identity.userId,
        orderId: identity.orderId,
        downloadedAt: now,
      })
      items.push({
        title,
        filename: safeFilename(material.title),
        buffer: Buffer.from(watermarked),
      })
      sentMaterialIds.push(String(material._id))
    } catch (err) {
      console.error(
        `[admin-send-pdf-email] Falha ao preparar PDF do material ${material._id}:`,
        err
      )
      skipped.push({ title, reason: 'falha ao processar' })
    }
  }

  return { items, sentMaterialIds, skipped }
}

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
