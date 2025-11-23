import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Ticket } from '@/lib/types'
import { ObjectId } from 'mongodb'

// GET - Buscar ticket específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const ticketsCollection = db.collection<Ticket>('tickets')

    const ticket = await ticketsCollection.findOne({ _id: new ObjectId(id) })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    // Verifica permissão: usuário só vê seu próprio ticket, admin vê todos
    if (session.role !== 'admin' && ticket.userId !== session.userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ticket' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar ticket (pegar, enviar mensagem, resolver, fechar, marcar como lida)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, message, messageIds } = body

    const db = await getDb()
    const ticketsCollection = db.collection<Ticket>('tickets')
    const usersCollection = db.collection('users')

    const ticket = await ticketsCollection.findOne({ _id: new ObjectId(id) })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    // Verifica permissão
    if (session.role !== 'admin' && ticket.userId !== session.userId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    let updateData: any = { updatedAt: new Date() }

    switch (action) {
      case 'assign':
        // Admin pega o ticket
        if (session.role !== 'admin') {
          return NextResponse.json({ error: 'Apenas admins podem pegar tickets' }, { status: 403 })
        }
        updateData.assignedTo = session.userId
        updateData.assignedToName = user.name
        updateData.status = 'assigned'
        break

      case 'send_message':
        // Enviar mensagem
        if (!message) {
          return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
        }
        const newMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          senderId: session.userId,
          senderName: user.name,
          senderRole: session.role,
          text: message,
          sentAt: new Date()
        }
        updateData.$push = { messages: newMessage }
        break

      case 'mark_read':
        // Marcar mensagens como lidas
        if (!messageIds || !Array.isArray(messageIds)) {
          return NextResponse.json({ error: 'IDs de mensagens são obrigatórios' }, { status: 400 })
        }
        // Atualizar readAt de mensagens específicas
        const updatedMessages = ticket.messages.map(msg => {
          if (messageIds.includes(msg.id) && msg.senderId !== session.userId && !msg.readAt) {
            return { ...msg, readAt: new Date() }
          }
          return msg
        })
        updateData.messages = updatedMessages
        break

      case 'resolve':
        // Resolver ticket (apenas admin)
        if (session.role !== 'admin') {
          return NextResponse.json({ error: 'Apenas admins podem resolver tickets' }, { status: 403 })
        }
        updateData.status = 'resolved'
        updateData.resolvedAt = new Date()
        break

      case 'close':
        // Fechar ticket (usuário ou admin)
        updateData.status = 'closed'
        updateData.closedAt = new Date()
        break

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    await ticketsCollection.updateOne(
      { _id: new ObjectId(id) },
      updateData.$push ? updateData : { $set: updateData }
    )

    return NextResponse.json({
      success: true,
      message: 'Ticket atualizado com sucesso'
    })
  } catch (error) {
    console.error('Update ticket error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar ticket' },
      { status: 500 }
    )
  }
}
