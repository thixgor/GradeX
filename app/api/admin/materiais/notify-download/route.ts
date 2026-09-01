/**
 * Avisa o usuário de que o material está DISPONÍVEL PARA DOWNLOAD na
 * plataforma — a alternativa ao envio do PDF por e-mail.
 *
 * O e-mail com o PDF anexado continua existindo, mas morre no limite da caixa
 * de quem recebe assim que o arquivo cresce. Aqui o caminho é outro: o admin
 * libera o download para aquela pessoa (a liberação individual gravada no
 * registro de acesso) e dispara um aviso curto com o link direto. O arquivo
 * sai depois pela rota normal de download, com a mesma marca d'água.
 *
 * Por isso a liberação vem junto: um aviso apontando para um botão bloqueado
 * seria pior que não avisar. Passe `grant: false` para só avisar (útil quando
 * o material já está liberado para todos).
 *
 * POST /api/admin/materiais/notify-download
 *   Body: { purchaseId: string, note?: string, grant?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { sendMaterialDownloadAvailableEmail } from '@/lib/mail'
import { resolveMaterialsWithPdf } from '@/lib/material-pdf-email'
import { materialItemUrl, resolvePurchaseTarget } from '@/lib/admin-material-delivery'
import {
  PDF_DOWNLOAD_OVERRIDE_FIELD,
  resolvePdfDownloadPermission,
} from '@/lib/material-download-permission'
import { summarizeTimedAccess } from '@/lib/material-timed-access'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const purchaseId = typeof body?.purchaseId === 'string' ? body.purchaseId : ''
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : ''
    const grant = body?.grant !== false

    const db = await getDb()
    const resolved = await resolvePurchaseTarget(db, purchaseId)
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status })
    }
    const target = resolved.target

    if (!target.userEmail) {
      return NextResponse.json({ error: 'Usuário sem e-mail cadastrado' }, { status: 422 })
    }

    // Acesso por tempo limitado é vendido como leitura na plataforma e o
    // servidor recusa o download dele. Avisar que "está liberado" seria uma
    // promessa que a própria rota de download quebra em seguida.
    if (summarizeTimedAccess(target.purchase)) {
      return NextResponse.json(
        {
          error:
            'Este acesso é a versão por tempo limitado, que não inclui download. Envie o PDF por e-mail ou converta o acesso antes de avisar.',
        },
        { status: 422 }
      )
    }

    const materials = await resolveMaterialsWithPdf(db, target.itemType, target.itemId)
    if (materials.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum PDF disponível neste item para liberar o download.' },
        { status: 422 }
      )
    }

    // O item está liberado por padrão quando qualquer material dele está.
    const itemDownloadEnabled = materials.some((m: any) => m.pdfDownloadEnabled !== false)
    const before = resolvePdfDownloadPermission(
      { pdfDownloadEnabled: itemDownloadEnabled },
      target.purchase
    )

    let granted = false
    if (!before.allowed) {
      if (!grant) {
        return NextResponse.json(
          {
            error:
              'O download não está liberado para este usuário. Libere o download dele (ou marque a liberação junto com o aviso) antes de avisar.',
          },
          { status: 409 }
        )
      }
      await db.collection('material_purchases').updateOne(
        { _id: new ObjectId(purchaseId) },
        {
          $set: {
            [PDF_DOWNLOAD_OVERRIDE_FIELD]: true,
            pdfDownloadAllowedAt: new Date(),
            pdfDownloadAllowedBy: session.userId,
            pdfDownloadAllowedByName: session.name,
          },
        }
      )
      granted = true
    }

    const itemTitle =
      target.itemTitle || (target.itemType === 'material' ? materials[0]?.title : '') || 'seu material'
    const itemUrl = materialItemUrl(target.itemType, target.itemId)

    try {
      await sendMaterialDownloadAvailableEmail({
        email: target.userEmail,
        name: target.userName,
        itemTitle,
        itemUrl,
        materials: materials.map((m: any) => ({ title: m.title || 'Material' })),
        note,
      })
    } catch (err: any) {
      console.error('[admin-notify-download] Falha ao enviar o aviso (SMTP):', err)
      const detail = err?.responseCode || err?.code || err?.message
      return NextResponse.json(
        {
          error: `Download liberado, mas o aviso não saiu${detail ? ` (${detail})` : ''}. Verifique a configuração de SMTP.`,
          granted,
        },
        { status: 502 }
      )
    }

    db.collection('audit_logs').insertOne({
      action: 'material_download_available_notice',
      adminId: session.userId,
      adminName: session.name,
      purchaseId,
      userId: target.userId,
      userName: target.userName,
      userEmail: target.userEmail,
      itemType: target.itemType,
      itemId: target.itemId,
      materialIds: materials.map((m: any) => String(m._id)),
      granted,
      note: note || undefined,
      sentAt: new Date(),
    }).catch((e) => console.error('[admin-notify-download] Falha ao gravar auditoria:', e))

    return NextResponse.json({
      success: true,
      sentTo: target.userEmail,
      granted,
      itemUrl,
      materialsCount: materials.length,
    })
  } catch (error: any) {
    console.error('[admin-notify-download] Erro ao avisar sobre o download:', error)
    return NextResponse.json(
      { error: `Erro ao enviar o aviso: ${error?.message || String(error)}` },
      { status: 500 }
    )
  }
}
