import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// POST - Reordenar pastas e/ou mover para dentro de outra pasta
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const { updates } = await request.json()

    // updates: Array<{ _id: string, order: number, parentFolderId: string | null }>
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    }

    const bulkOps = updates.map((u: any) => ({
      updateOne: {
        filter: { _id: new ObjectId(u._id) },
        update: {
          $set: {
            order: u.order,
            parentFolderId: u.parentFolderId || null,
            updatedAt: new Date(),
          },
        },
      },
    }))

    if (bulkOps.length > 0) {
      await db.collection('material_folders').bulkWrite(bulkOps)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering folders:', error)
    return NextResponse.json({ error: 'Erro ao reordenar' }, { status: 500 })
  }
}
