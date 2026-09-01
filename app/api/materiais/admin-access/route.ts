import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'
import {
  normalizeDownloadOverride,
  PDF_DOWNLOAD_OVERRIDE_FIELD,
  readDownloadOverride,
  resolvePdfDownloadPermission,
} from '@/lib/material-download-permission'
import { resolveMaterialsWithPdf } from '@/lib/material-pdf-email'

export const dynamic = 'force-dynamic'

// GET - Listar todos os acessos de um material/pacote (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const itemType = searchParams.get('itemType') // 'material' | 'package'

    if (!itemId || !itemType) {
      return NextResponse.json({ error: 'itemId e itemType são obrigatórios' }, { status: 400 })
    }

    const purchases = await db
      .collection('material_purchases')
      .find({ itemId, itemType, status: 'completed' })
      .sort({ purchasedAt: -1 })
      .toArray()

    // Enriquecer com dados atuais do usuário (accountType)
    const userIds = [...new Set(purchases.map((p: any) => p.userId))]
    const users = userIds.length
      ? await db.collection('users').find(
          { _id: { $in: userIds.map(id => { try { return new ObjectId(id) } catch { return null } }).filter(Boolean) as ObjectId[] } },
          { projection: { name: 1, email: 1, accountType: 1, secondaryRole: 1 } }
        ).toArray()
      : []

    const usersMap: Record<string, any> = {}
    users.forEach((u: any) => { usersMap[u._id.toString()] = u })

    // Materiais com PDF por trás do item (um material avulso, ou todos os do
    // pacote). Alimentam tanto a leitura de "quem pode baixar" quanto o botão
    // de baixar o PDF já com a marca d'água do usuário.
    const materialsWithPdf = await resolveMaterialsWithPdf(db, itemType, itemId)
    // O padrão do item: um pacote está liberado quando qualquer material dele
    // está — é assim que o download se comporta, material a material.
    const itemDownloadEnabled = materialsWithPdf.some(
      (m: any) => m.pdfDownloadEnabled !== false
    )

    const enriched = purchases.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      userAccountType: usersMap[p.userId]?.accountType || null,
      userSecondaryRole: usersMap[p.userId]?.secondaryRole || null,
      // Liberação individual de download: true (liberado), false (bloqueado)
      // ou null (segue o material). Ver lib/material-download-permission.ts.
      pdfDownloadAllowed: readDownloadOverride(p),
      // O resultado que essa pessoa vê hoje, já cruzado com o padrão do item.
      pdfDownloadEffective: resolvePdfDownloadPermission(
        { pdfDownloadEnabled: itemDownloadEnabled },
        p
      ).allowed,
    }))

    // Compras feitas SEM login: serial keys de compra ainda NÃO ativadas para
    // este item. Ao ativar, viram material_purchases (aparecem na lista acima),
    // então aqui listamos apenas as pendentes. O admin pode reenviar o PDF +
    // serial key para o e-mail usado na compra.
    const guestKeys = await db
      .collection('serial_keys')
      .find({
        origin: 'purchase',
        status: 'unactivated',
        'grant.itemId': itemId,
      })
      .sort({ generatedAt: -1 })
      .project({ key: 0, activationToken: 0 })
      .toArray()

    const guests = guestKeys.map((k: any) => ({
      _id: k._id.toString(),
      buyerName: k.buyerName || '',
      buyerEmail: k.buyerEmail || '',
      buyerPhone: k.buyerPhone || '',
      amount: k.amount ?? k.price ?? 0,
      productTitle: k.productTitle || k.grant?.itemTitle || '',
      purchasedAt: k.generatedAt || k.createdAt || null,
    }))

    return NextResponse.json({
      purchases: enriched,
      guests,
      // Contexto do item para o painel: se o download está ligado por padrão e
      // quais PDFs existem (o admin escolhe qual baixar em nome do usuário).
      item: {
        itemId,
        itemType,
        pdfDownloadEnabled: itemDownloadEnabled,
        materials: materialsWithPdf.map((m: any) => ({
          id: String(m._id),
          title: m.title || 'Material',
          pdfDownloadEnabled: m.pdfDownloadEnabled !== false,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching admin access:', error)
    return NextResponse.json({ error: 'Erro ao buscar acessos' }, { status: 500 })
  }
}

// POST - Conceder acesso manual a um usuário (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const { itemId, itemType, userEmail } = await request.json()

    if (!itemId || !itemType || !userEmail) {
      return NextResponse.json({ error: 'itemId, itemType e userEmail são obrigatórios' }, { status: 400 })
    }

    // Buscar usuário pelo email
    const user = await db.collection('users').findOne(
      { email: userEmail.toLowerCase().trim() },
      { projection: { _id: 1, name: 1, email: 1 } }
    )

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado com este e-mail' }, { status: 404 })
    }

    const userId = user._id.toString()

    // Verificar se já tem acesso
    const existing = await db.collection('material_purchases').findOne({
      userId,
      itemType,
      itemId,
      status: 'completed',
    })

    if (existing) {
      return NextResponse.json({ error: 'Usuário já possui acesso a este item' }, { status: 400 })
    }

    // Buscar item para título
    const collection = itemType === 'package' ? 'material_packages' : 'materials'
    const item = await db.collection(collection).findOne(
      { _id: new ObjectId(itemId) },
      { projection: { title: 1 } }
    )

    await db.collection('material_purchases').insertOne({
      userId,
      userName: user.name,
      userEmail: user.email,
      itemType,
      itemId,
      itemTitle: item?.title || '',
      price: 0,
      grantedByAdmin: session.userId,
      grantedByAdminName: session.name,
      source: 'manual',
      status: 'completed',
      purchasedAt: new Date(),
    })

    return NextResponse.json({ success: true, userName: user.name, userEmail: user.email })
  } catch (error) {
    console.error('Error granting access:', error)
    return NextResponse.json({ error: 'Erro ao conceder acesso' }, { status: 500 })
  }
}

/**
 * PATCH - Liberar (ou bloquear) o download do PDF para UMA pessoa.
 *
 * É a alternativa sustentável ao envio do PDF por e-mail: em vez de um anexo
 * pesado que esbarra no limite da caixa de quem recebe, o material fica com o
 * download desligado por padrão e o admin libera nominalmente quem precisa —
 * o arquivo continua saindo pela rota normal, com a marca d'água da pessoa.
 *
 * Body: { purchaseId: string, pdfDownloadAllowed: true | false | null }
 *   true  → libera para essa pessoa mesmo com o material bloqueado
 *   false → bloqueia só para ela, mesmo com o material liberado
 *   null  → volta a seguir o padrão do material
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const purchaseId = typeof body?.purchaseId === 'string' ? body.purchaseId : ''
    if (!purchaseId || !isValidObjectId(purchaseId)) {
      return NextResponse.json({ error: 'purchaseId inválido' }, { status: 400 })
    }

    const allowed = normalizeDownloadOverride(body?.pdfDownloadAllowed)

    const db = await getDb()
    const purchase = await db.collection('material_purchases').findOne({
      _id: new ObjectId(purchaseId),
    })
    if (!purchase) {
      return NextResponse.json({ error: 'Acesso não encontrado' }, { status: 404 })
    }

    const now = new Date()
    await db.collection('material_purchases').updateOne(
      { _id: new ObjectId(purchaseId) },
      allowed === null
        ? { $unset: { [PDF_DOWNLOAD_OVERRIDE_FIELD]: '' } }
        : {
            $set: {
              [PDF_DOWNLOAD_OVERRIDE_FIELD]: allowed,
              pdfDownloadAllowedAt: now,
              pdfDownloadAllowedBy: session.userId,
              pdfDownloadAllowedByName: session.name,
            },
          }
    )

    // Quem liberou o download de um material pago para uma pessoa específica
    // precisa aparecer na auditoria: é a mesma decisão que antes virava um
    // e-mail com o PDF anexado.
    db.collection('audit_logs').insertOne({
      action: 'material_pdf_download_permission',
      allowed,
      adminId: session.userId,
      adminName: session.name,
      purchaseId,
      userId: purchase.userId || null,
      userEmail: purchase.userEmail || null,
      itemType: purchase.itemType,
      itemId: purchase.itemId,
      changedAt: now,
    }).catch((e) => console.error('[admin-access] Falha ao gravar auditoria:', e))

    return NextResponse.json({ success: true, pdfDownloadAllowed: allowed })
  } catch (error) {
    console.error('Error updating download permission:', error)
    return NextResponse.json({ error: 'Erro ao atualizar a permissão de download' }, { status: 500 })
  }
}

// DELETE - Revogar acesso (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const purchaseId = searchParams.get('purchaseId')

    if (!purchaseId) {
      return NextResponse.json({ error: 'purchaseId obrigatório' }, { status: 400 })
    }

    await db.collection('material_purchases').deleteOne({ _id: new ObjectId(purchaseId) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking access:', error)
    return NextResponse.json({ error: 'Erro ao revogar acesso' }, { status: 500 })
  }
}
