import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Notification, Ticket, TicketStatus } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { deliverTransactionalEmails, sendNewTicketAdminEmail } from '@/lib/mail'
import {
  TICKET_ABERTOS_POR_USUARIO,
  ehCategoriaValida,
  mensagemDoSistema,
  novaMensagem,
  protocoloDoTicket,
  rotuloDaCategoria,
  validarAberturaDeTicket,
} from '@/lib/tickets'

export const dynamic = 'force-dynamic'

const STATUS_VALIDOS: TicketStatus[] = ['open', 'assigned', 'resolved', 'closed']
const LIMITE_PADRAO = 60
const LIMITE_MAXIMO = 200

/**
 * Listagem de tickets — **sem o histórico de mensagens**.
 *
 * A versão anterior devolvia todos os tickets com todas as mensagens de cada
 * um, e as duas telas ficavam repetindo essa consulta em polling. Para o admin
 * isso significava baixar o suporte inteiro a cada minuto só para desenhar três
 * colunas de cartões. Agora o pipeline resolve no banco o que a lista precisa —
 * última mensagem, total e quantas ainda não foram lidas por quem consultou — e
 * o histórico completo só sai em `GET /api/tickets/[id]`, quando alguém de fato
 * abre a conversa.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const ehAdmin = session.role === 'admin'
    const { searchParams } = new URL(request.url)

    const statusFiltro = searchParams.get('status')
    const busca = (searchParams.get('q') || '').trim().slice(0, 80)
    const limite = Math.min(
      LIMITE_MAXIMO,
      Math.max(1, Number(searchParams.get('limit')) || LIMITE_PADRAO),
    )

    const filtro: Record<string, unknown> = ehAdmin ? {} : { userId: session.userId }

    if (statusFiltro && statusFiltro !== 'all') {
      const status = statusFiltro.split(',').filter((s): s is TicketStatus =>
        STATUS_VALIDOS.includes(s as TicketStatus),
      )
      if (status.length > 0) filtro.status = { $in: status }
    }

    // Busca livre só faz sentido para quem vê a fila inteira. `escapeRegex`
    // evita que um "(" digitado na caixa derrube a consulta.
    if (ehAdmin && busca) {
      const regex = new RegExp(busca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filtro.$or = [{ title: regex }, { userName: regex }, { userEmail: regex }]
    }

    const db = await getDb()
    const ticketsCollection = db.collection<Ticket>('tickets')

    const naoLida = { $eq: [{ $ifNull: ['$$m.readAt', null] }, null] }
    const doOutroLado = ehAdmin
      ? { $ne: ['$$m.senderRole', 'admin'] }
      : { $eq: ['$$m.senderRole', 'admin'] }
    const naoEhSistema = {
      $and: [{ $ne: ['$$m.senderId', 'system'] }, { $ne: ['$$m.senderRole', 'system'] }],
    }

    // Ticket vivo antes de ticket encerrado: sem isto, um suporte com histórico
    // grande gastaria o limite da consulta com conversas já fechadas e deixaria
    // gente esperando fora da fila.
    const estaVivo = {
      $cond: [{ $in: ['$status', ['open', 'assigned']] }, 1, 0],
    }

    // Peso da prioridade: para o admin, um "urgente" de ontem precisa aparecer
    // acima de um "baixa" que acabou de receber um "obrigado".
    const pesoDaPrioridade = {
      $switch: {
        branches: [
          { case: { $eq: ['$priority', 'urgent'] }, then: 3 },
          { case: { $eq: ['$priority', 'high'] }, then: 2 },
          { case: { $eq: ['$priority', 'low'] }, then: 0 },
        ],
        default: 1,
      },
    }

    const tickets = await ticketsCollection
      .aggregate([
        { $match: filtro },
        {
          $addFields: {
            // `$arrayElemAt` em vez de `$last`: o operador de array `$last`
            // só existe do MongoDB 5.0 em diante, e não há motivo para exigir
            // isso de quem roda um cluster mais antigo.
            lastMessage: { $arrayElemAt: [{ $ifNull: ['$messages', []] }, -1] },
            messageCount: { $size: { $ifNull: ['$messages', []] } },
            unreadCount: {
              $size: {
                $filter: {
                  input: { $ifNull: ['$messages', []] },
                  as: 'm',
                  cond: { $and: [naoLida, doOutroLado, naoEhSistema] },
                },
              },
            },
            ...(ehAdmin ? { vivo: estaVivo, peso: pesoDaPrioridade } : {}),
          },
        },
        { $sort: ehAdmin ? { vivo: -1, peso: -1, updatedAt: -1 } : { updatedAt: -1 } },
        { $limit: limite },
        {
          $project: {
            messages: 0,
            vivo: 0,
            peso: 0,
            'lastMessage.readAt': 0,
            'lastMessage.id': 0,
          },
        },
      ])
      .toArray()

    // Contadores por situação: com a lista limitada, contar no cliente daria
    // número errado justo quando a fila cresce.
    const agrupado = await ticketsCollection
      .aggregate([
        { $match: ehAdmin ? {} : { userId: session.userId } },
        { $group: { _id: '$status', total: { $sum: 1 } } },
      ])
      .toArray()

    const counts = agrupado.reduce<Record<string, number>>((acc, item) => {
      acc[String(item._id)] = item.total
      return acc
    }, {})

    return NextResponse.json({
      tickets,
      counts,
      currentUserId: session.userId,
      isAdmin: ehAdmin,
    })
  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json({ error: 'Erro ao buscar tickets' }, { status: 500 })
  }
}

// POST - Abrir ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const validado = validarAberturaDeTicket(body)
    if (!validado.ok) {
      return NextResponse.json({ error: validado.erro }, { status: 400 })
    }

    const { title, message } = validado
    const category = ehCategoriaValida(body?.category) ? body.category : 'outro'

    // Abrir ticket dispara e-mail para a equipe: sem limite, um script transforma
    // a caixa de entrada do suporte em fila de spam.
    const limite = await checkRateLimit(session.userId, 'ticket_create', 5, 3_600_000)
    if (!limite.success) {
      return NextResponse.json(
        { error: 'Você abriu muitos tickets seguidos. Aguarde um pouco antes de abrir outro.' },
        { status: 429 },
      )
    }

    const db = await getDb()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const ticketsCollection = db.collection<Ticket>('tickets')

    // Vinte tickets abertos sobre o mesmo assunto não aceleram a resposta —
    // só afundam a fila de quem ainda não foi atendido.
    const emAberto = await ticketsCollection.countDocuments({
      userId: session.userId,
      status: { $in: ['open', 'assigned'] },
    })
    if (emAberto >= TICKET_ABERTOS_POR_USUARIO) {
      return NextResponse.json(
        {
          error:
            'Você já tem tickets em andamento. Continue por eles ou aguarde o encerramento antes de abrir outro.',
        },
        { status: 409 },
      )
    }

    const agora = new Date()
    // O _id sai daqui, e não do insert, para que o protocolo já exista na hora
    // de escrever a mensagem de boas-vindas — antes ela era gravada com um
    // placeholder e corrigida num segundo update.
    const ticketObjectId = new ObjectId()
    const ticketId = ticketObjectId.toString()
    const protocolo = protocoloDoTicket(ticketId)

    const newTicket: Ticket & { _id: ObjectId } = {
      _id: ticketObjectId,
      userId: session.userId,
      userName: user.name,
      userEmail: user.email,
      title,
      category,
      priority: 'normal',
      status: 'open',
      messages: [
        novaMensagem({
          senderId: session.userId,
          senderName: user.name,
          senderRole: session.role === 'admin' ? 'admin' : 'user',
          text: message,
          sentAt: agora,
        }),
        mensagemDoSistema(
          `Ticket registrado com o protocolo #${protocolo}. Um administrador responde por aqui — e você também recebe um aviso por e-mail em ${user.email}.`,
        ),
      ],
      createdAt: agora,
      updatedAt: agora,
    }

    await ticketsCollection.insertOne(newTicket as Ticket)

    const admins = await usersCollection
      .find({ role: 'admin' }, { projection: { email: 1, name: 1 } })
      .limit(20)
      .toArray()

    if (admins.length > 0) {
      const notificationsCollection = db.collection<Notification>('notifications')
      await notificationsCollection.insertMany(
        admins.map((admin) => ({
          userId: admin._id!.toString(),
          type: 'ticket_created' as const,
          message: `${user.name} abriu o ticket #${protocolo}: "${title}"`,
          ticketId,
          ticketTitle: title,
          read: false,
          createdAt: agora,
        })),
      )
    }

    await deliverTransactionalEmails([
      sendNewTicketAdminEmail({
        destinatarios: admins.map((a) => String(a.email || '')).filter(Boolean),
        protocolo,
        ticketId,
        titulo: title,
        categoria: rotuloDaCategoria(category),
        usuarioNome: user.name,
        usuarioEmail: user.email,
        mensagem: message,
      }).catch((err) => console.error('[tickets] falha no aviso de novo ticket:', err)),
    ])

    return NextResponse.json({ success: true, ticketId, protocolo })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json({ error: 'Erro ao criar ticket' }, { status: 500 })
  }
}
