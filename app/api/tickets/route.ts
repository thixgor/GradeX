import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Ticket, Notification } from '@/lib/types'
import { ObjectId } from 'mongodb'

// GET - Listar tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const ticketsCollection = db.collection<Ticket>('tickets')

    let query = {}

    // Usuários comuns veem apenas seus tickets
    // Admins veem todos
    if (session.role !== 'admin') {
      query = { userId: session.userId }
    }

    const tickets = await ticketsCollection
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json({
      tickets,
      currentUserId: session.userId // Retornar userId da sessão
    })
  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tickets' },
      { status: 500 }
    )
  }
}

// POST - Criar ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Título e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar informações do usuário
    const db = await getDb()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const ticketsCollection = db.collection<Ticket>('tickets')

    const newTicket: Ticket = {
      userId: session.userId,
      userName: user.name,
      userEmail: user.email,
      title,
      status: 'open',
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: session.userId,
          senderName: user.name,
          senderRole: session.role,
          text: message,
          sentAt: new Date()
        },
        {
          id: `msg_${Date.now()}_system`,
          senderId: 'system',
          senderName: 'Sistema',
          senderRole: 'user',
          text: `Você criou um ticket com o título "${title}" e ele será atendido em breve por um administrador. Aguarde um momento.`,
          sentAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await ticketsCollection.insertOne(newTicket)

    // Criar notificação para todos os admins
    const admins = await usersCollection.find({ role: 'admin' }).toArray()
    const notificationsCollection = db.collection<Notification>('notifications')

    const adminNotifications = admins.map((admin) => ({
      userId: admin._id!.toString(),
      type: 'ticket_created' as const,
      message: `${user.name} criou um novo ticket: "${title}"`,
      ticketId: result.insertedId.toString(),
      ticketTitle: title,
      read: false,
      createdAt: new Date()
    }))

    if (adminNotifications.length > 0) {
      await notificationsCollection.insertMany(adminNotifications)
    }

    return NextResponse.json({
      success: true,
      ticketId: result.insertedId.toString()
    })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar ticket' },
      { status: 500 }
    )
  }
}
