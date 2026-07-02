/**
 * Envio manual de PDF (com marca d'água do usuário) para o e-mail do
 * comprador, disparado por um administrador.
 *
 * Contorna casos em que o usuário só tem acesso ao visualizador protegido
 * (download desabilitado) e não consegue baixar o arquivo — evitando pedidos
 * de reembolso. O PDF chega anexado, com a mesma marca d'água aplicada nos
 * downloads normais, então o rastreio forense continua funcionando.
 *
 * POST /api/admin/materiais/send-pdf-email
 *   Body: { purchaseId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { fetchMaterialPdfBytes } from '@/lib/material-pdf-viewer'
import { applyWatermark } from '@/lib/pdf-watermark'
import { sendMaterialPdfDeliveryEmail } from '@/lib/mail'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

function safeFilename(title: string): string {
  return (title || 'material')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 80) + '.pdf'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const purchaseId = body?.purchaseId
    if (!purchaseId || typeof purchaseId !== 'string' || !isValidObjectId(purchaseId)) {
      return NextResponse.json({ error: 'purchaseId inválido' }, { status: 400 })
    }

    const db = await getDb()
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

    // Resolver material(is) com PDF associado(s) à compra.
    let materials: any[] = []
    if (purchase.itemType === 'material') {
      const material = await db.collection('materials').findOne(
        { _id: new ObjectId(purchase.itemId) },
        { projection: { title: 1, pdfFile: 1 } }
      )
      if (material) materials = [material]
    } else if (purchase.itemType === 'package') {
      const pkg = await db.collection('material_packages').findOne(
        { _id: new ObjectId(purchase.itemId) },
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
    } else {
      return NextResponse.json({ error: `Tipo de item não suportado: ${purchase.itemType}` }, { status: 422 })
    }

    const materialsWithPdf = materials.filter((m) => m.pdfFile?.blobUrl)
    if (materialsWithPdf.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum PDF disponível para envio neste item.' },
        { status: 422 }
      )
    }

    const orderId = purchase.providerPaymentId || purchase.providerOrderId || String(purchase._id)
    const now = new Date()

    // Teto do PDF de origem. É o principal guarda-chuva contra o 500 por OOM:
    // o pdf-lib carrega o arquivo inteiro e o duplica ao aplicar a marca
    // d'água, podendo usar 10–20x o tamanho do arquivo em memória. Um PDF
    // grande demais derruba a função (crash duro = página 500 do Next, que
    // nenhum try/catch consegue interceptar). Também respeita o limite de
    // anexo do SMTP. Ajustável via env.
    const MAX_ORIGINAL_MB = Number(process.env.PDF_EMAIL_MAX_ORIGINAL_MB) || 15
    const MAX_ORIGINAL_BYTES = MAX_ORIGINAL_MB * 1024 * 1024

    // Processa um PDF de cada vez (em série). Isso mantém o pico de memória
    // baixo — processar vários grandes ao mesmo tempo multiplicaria o uso.
    // Com o tempo de execução ampliado, a série cobre bem o caso comum.
    const items: { title: string; filename: string; buffer: Buffer }[] = []
    const sentMaterialIds: string[] = []
    const skipped: { title: string; reason: string }[] = []
    for (const material of materialsWithPdf) {
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
          userName,
          userEmail,
          userId: userId || String(purchase._id),
          orderId,
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

    if (items.length === 0) {
      // Se tudo foi pulado por tamanho, deixa isso explícito para o admin.
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
    const MAX_TOTAL_BYTES = 18 * 1024 * 1024 // margem de segurança abaixo dos limites usuais de SMTP (~20-25MB)
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        {
          error: `O(s) arquivo(s) somam ${(totalBytes / 1024 / 1024).toFixed(1)}MB, acima do limite para envio por e-mail (18MB). Reduza o tamanho do PDF ou envie por outro meio.`,
        },
        { status: 413 }
      )
    }

    try {
      await sendMaterialPdfDeliveryEmail({ email: userEmail, name: userName, items })
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
      sentAt: now,
    }).catch((e) => console.error('[admin-send-pdf-email] Falha ao gravar auditoria:', e))

    return NextResponse.json({
      success: true,
      sentTo: userEmail,
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
