import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Notification } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Buscar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const notificationsCollection = db.collection<Notification>('notifications')

    const notifications = await notificationsCollection
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    )
  }
}

// PUT - Marcar notificação como lida
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { notificationId } = await request.json()

    const db = await getDb()
    const notificationsCollection = db.collection<Notification>('notifications')

    await notificationsCollection.updateOne(
      { _id: notificationId, userId: session.userId },
      { $set: { read: true } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar notificação' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar TODAS as notificações do usuário
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const notificationsCollection = db.collection<Notification>('notifications')

    const result = await notificationsCollection.deleteMany({
      userId: session.userId
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('Delete all notifications error:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar notificações' },
      { status: 500 }
    )
  }
}
