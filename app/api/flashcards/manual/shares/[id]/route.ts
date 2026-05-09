import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS, isValidObjectId } from '@/lib/flashcard-manual'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const db = await getDb()
    const shares = db.collection(FLASHCARD_MANUAL_COLLECTIONS.shares)
    const share = await shares.findOne({ _id: new ObjectId(params.id) })
    if (!share) return NextResponse.json({ error: 'Compartilhamento não encontrado' }, { status: 404 })

    if (share.toUserId !== session.userId && share.fromUserId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    if (!['accepted', 'dismissed'].includes(body.status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    await shares.updateOne(
      { _id: share._id },
      { $set: { status: body.status, respondedAt: new Date() } }
    )
    return NextResponse.json({ success: true, status: body.status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar compartilhamento' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const db = await getDb()
    const shares = db.collection(FLASHCARD_MANUAL_COLLECTIONS.shares)
    const share = await shares.findOne({ _id: new ObjectId(params.id) })
    if (!share) return NextResponse.json({ error: 'Compartilhamento não encontrado' }, { status: 404 })

    if (share.fromUserId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    await shares.deleteOne({ _id: share._id })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao remover compartilhamento' }, { status: 500 })
  }
}
