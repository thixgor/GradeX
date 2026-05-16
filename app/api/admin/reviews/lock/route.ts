import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { getTargetCollectionName, isValidTargetType } from '@/lib/reviews'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }
    const { targetType, targetId, locked } = body as {
      targetType?: unknown
      targetId?: unknown
      locked?: unknown
    }
    if (!isValidTargetType(targetType)) {
      return NextResponse.json({ error: 'targetType inválido' }, { status: 400 })
    }
    if (typeof targetId !== 'string' || !isValidObjectId(targetId)) {
      return NextResponse.json({ error: 'targetId inválido' }, { status: 400 })
    }

    const db = await getDb()
    const collName = getTargetCollectionName(targetType)
    const result = await db.collection(collName).updateOne(
      { _id: new ObjectId(targetId) },
      { $set: { reviewsLocked: !!locked, updatedAt: new Date() } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true, locked: !!locked })
  } catch (error) {
    console.error('POST /api/admin/reviews/lock error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar trava' }, { status: 500 })
  }
}
