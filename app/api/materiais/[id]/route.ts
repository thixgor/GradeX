import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = params
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const isAdmin = session.role === 'admin'

    // Fetch user + material + folder in parallel
    const [userDoc, material] = await Promise.all([
      db.collection('users').findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { accountType: 1, secondaryRole: 1, name: 1, cpf: 1 } }
      ),
      db.collection('materials').findOne({
        _id: new ObjectId(id),
        ...(isAdmin ? {} : { isHidden: false }),
      }),
    ])

    if (!material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    const userGroups: string[] = []
    if (!isAdmin && userDoc) {
      if (userDoc.accountType) userGroups.push(userDoc.accountType)
      if (userDoc.secondaryRole === 'monitor') userGroups.push('monitor')
    }

    // Folder name (if any)
    let folderName: string | null = null
    if (material.folderId) {
      const folder = await db.collection('material_folders').findOne(
        { _id: new ObjectId(String(material.folderId)) },
        { projection: { name: 1 } }
      ).catch(() => null)
      folderName = folder?.name ?? null
    }

    // Check group access
    const hasGroupAccess =
      isAdmin ||
      !material.allowedGroups?.length ||
      userGroups.some((g: string) => material.allowedGroups.includes(g))

    // Check purchase (two queries to avoid $or index quirks)
    let isPurchased = false
    if (!isAdmin) {
      const baseFilter = { itemId: id, itemType: 'material', status: 'completed' }
      const byUserId = await db.collection('material_purchases').findOne({
        ...baseFilter,
        userId: session.userId,
      })
      if (byUserId) {
        isPurchased = true
      } else if (session.email) {
        const emailRegex = new RegExp(
          `^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        )
        const byEmail = await db.collection('material_purchases').findOne({
          ...baseFilter,
          userEmail: { $regex: emailRegex },
        })
        isPurchased = !!byEmail
      }
    }

    const canAccess = isAdmin || isPurchased || (hasGroupAccess && material.pricing === 'free')

    // Strip video embed URL if no access
    const safeMaterial =
      !canAccess && material.type === 'video_embed'
        ? { ...material, downloadUrl: '' }
        : material

    // Computed flags (never expose pdfFile.blobUrl to client)
    const _hasPdf = !!(material.pdfFile?.blobUrl)
    const { pdfFile: _stripped, ...materialWithoutPdf } = safeMaterial

    // Increment view count (fire and forget)
    db.collection('materials')
      .updateOne({ _id: new ObjectId(id) }, { $inc: { viewCount: 1 } })
      .catch(() => {})

    const res = NextResponse.json({
      material: {
        ...materialWithoutPdf,
        _id: String(safeMaterial._id),
        _hasPdf,
        pdfViewerEnabled: material.pdfViewerEnabled === true,
        pdfDownloadEnabled: material.pdfDownloadEnabled !== false,
      },
      folderName,
      hasAccess: canAccess,
      isPurchased,
      hasGroupAccess,
      userGroups,
      watermark: {
        name: userDoc?.name || session.name || 'Usuário',
        cpf: userDoc?.cpf || '',
      },
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Error fetching material:', error)
    return NextResponse.json({ error: 'Erro ao buscar material' }, { status: 500 })
  }
}
