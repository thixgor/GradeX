import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Notification } from '@/lib/types'
import { ObjectId } from 'mongodb'

// PATCH - Marcar uma notificacao especifica como lida
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const notificationsCollection = db.collection<Notification>('notifications')

    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(id), userId: session.userId },
      { $set: { read: true } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Notificacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar notificacao como lida' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar uma notificacao especifica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const notificationsCollection = db.collection<Notification>('notifications')

    const result = await notificationsCollection.deleteOne({
      _id: new ObjectId(id),
      userId: session.userId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Notificacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar notificacao' },
      { status: 500 }
    )
  }
}
