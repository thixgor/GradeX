import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Notification, Ticket, TicketMessage } from '@/lib/types'
import { ObjectId } from 'mongodb'
import type { Db } from 'mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { deliverTransactionalEmails, sendTicketStatusEmail } from '@/lib/mail'
import {
  emailDoDono,
  enviarAvisoDeRespostas,
  ultimaMensagemDe,
} from '@/lib/tickets-avisos'
import {
  TICKET_MENSAGEM_MAX,
  contarNaoLidas,
  devoAvisarPorEmail,
  ehPrioridadeValida,
  mensagemDoSistema,
  normalizarTexto,
  novaMensagem,
  protocoloDoTicket,
  respostasPendentes,
  rotuloDaCategoria,
} from '@/lib/tickets'

export const dynamic = 'force-dynamic'

/** Só o dono do ticket e os administradores enxergam a conversa. */
function podeVer(ticket: Ticket, session: { userId: string; role?: string }) {
  return session.role === 'admin' || ticket.userId === session.userId
}

function idValido(id: string) {
  return ObjectId.isValid(id)
}

/**
 * Respostas que acompanham o e-mail de mudança de situação.
 *
 * Prioriza o que a trava de rajada ainda não entregou — assim um atendimento
 * que terminou em três mensagens seguidas e um "resolvido" não deixa nenhuma
 * delas fora da caixa de entrada. Sem nada pendente, mostra a última resposta
 * só como contexto.
 */
function contextoDeRespostas(ticket: Ticket): { texto: string; data?: Date | string }[] {
  const pendentes = respostasPendentes(ticket.messages, ticket.lastEmailAt)
  if (pendentes.length > 0) return pendentes

  const ultima = ultimaMensagemDe(ticket, 'admin')
  return ultima ? [{ texto: ultima.text, data: ultima.sentAt }] : []
}

async function notificar(db: Db, notificacao: Omit<Notification, '_id'>) {
  try {
    await db.collection<Notification>('notifications').insertOne(notificacao as Notification)
  } catch (err) {
    console.error('[tickets] falha ao gravar notificação:', err)
  }
}

// GET - Conversa completa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (!idValido(id)) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    const db = await getDb()
    const ticketsCollection = db.collection<Ticket>('tickets')
    const ticket = await ticketsCollection.findOne({ _id: new ObjectId(id) })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }
    if (!podeVer(ticket, session)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const ehAdmin = session.role === 'admin'

    // Marca presença de quem está lendo. É isso que faz o e-mail de resposta
    // não ser disparado para quem está com o chat aberto na frente — e a
    // condição de "está velho" mantém no máximo uma escrita por minuto, mesmo
    // com a tela em polling.
    const agora = new Date()
    const campoPresenca = ehAdmin ? 'adminLastSeenAt' : 'userLastSeenAt'
    const visto = ticket[campoPresenca]
    if (!visto || agora.getTime() - new Date(visto).getTime() > 60_000) {
      await ticketsCollection.updateOne(
        { _id: ticket._id as ObjectId },
        { $set: { [campoPresenca]: agora } },
      )
    }

    return NextResponse.json({
      ticket,
      protocolo: protocoloDoTicket(id),
      unreadCount: contarNaoLidas(ticket.messages, ehAdmin ? 'admin' : 'user'),
      currentUserId: session.userId,
      isAdmin: ehAdmin,
    })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json({ error: 'Erro ao buscar ticket' }, { status: 500 })
  }
}

/**
 * PATCH - todas as ações sobre um ticket.
 *
 * O que mudou em relação à versão antiga, e por quê:
 *
 * - **Nada mais reescreve o array de mensagens inteiro.** O "marcar como lida"
 *   lia as mensagens, alterava em memória e gravava o array de volta; qualquer
 *   mensagem enviada entre a leitura e a gravação era apagada — a conversa
 *   perdia falas sem ninguém entender por quê. Agora é `arrayFilters`, que
 *   altera só os elementos certos dentro do banco.
 * - **Responder é a ação principal, então ela puxa o resto:** o admin que
 *   responde um ticket na fila assume o ticket no mesmo movimento, e o usuário
 *   que responde um ticket "resolvido" o reabre em vez de ficar sem caixa de
 *   texto (antes, quem discordava do "resolvido" não tinha o que fazer).
 * - **Todo desfecho avisa o outro lado** — notificação no sino e, quando faz
 *   sentido, e-mail com a resposta inteira.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (!idValido(id)) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const { action } = body as { action?: string }

    const db = await getDb()
    const ticketsCollection = db.collection<Ticket>('tickets')
    const _id = new ObjectId(id)
    const ticket = await ticketsCollection.findOne({ _id })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }
    if (!podeVer(ticket, session)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const ehAdmin = session.role === 'admin'
    const ehDono = ticket.userId === session.userId
    const protocolo = protocoloDoTicket(id)
    const agora = new Date()

    const user = await db
      .collection('users')
      .findOne({ _id: new ObjectId(session.userId) }, { projection: { name: 1, email: 1 } })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    const nome = String(user.name || 'Usuário')

    switch (action) {
      // ── Assumir o atendimento ──────────────────────────────────────────
      case 'assign': {
        if (!ehAdmin) {
          return NextResponse.json({ error: 'Apenas admins podem pegar tickets' }, { status: 403 })
        }
        if (ticket.assignedTo && ticket.assignedTo !== session.userId && !body.force) {
          return NextResponse.json(
            {
              error: `Este ticket já está com ${ticket.assignedToName || 'outro administrador'}.`,
              assignedToName: ticket.assignedToName,
            },
            { status: 409 },
          )
        }

        await ticketsCollection.updateOne(
          { _id },
          {
            $set: {
              assignedTo: session.userId,
              assignedToName: nome,
              status: 'assigned',
              updatedAt: agora,
            },
            $push: {
              messages: mensagemDoSistema(
                `${nome} assumiu o atendimento deste ticket e responde a partir de agora.`,
              ),
            },
          },
        )

        return NextResponse.json({ success: true, message: 'Ticket atribuído com sucesso' })
      }

      // ── Responder ──────────────────────────────────────────────────────
      case 'send_message': {
        const texto = normalizarTexto(body.message, TICKET_MENSAGEM_MAX)
        if (!texto) {
          return NextResponse.json({ error: 'Escreva a mensagem antes de enviar.' }, { status: 400 })
        }
        if (ticket.status === 'closed') {
          return NextResponse.json(
            { error: 'Este ticket está fechado. Abra um novo ticket para continuar.' },
            { status: 409 },
          )
        }

        const limite = await checkRateLimit(session.userId, 'ticket_message', 40, 600_000)
        if (!limite.success) {
          return NextResponse.json(
            { error: 'Muitas mensagens seguidas. Aguarde um instante.' },
            { status: 429 },
          )
        }

        const mensagem = novaMensagem({
          senderId: session.userId,
          senderName: nome,
          senderRole: ehAdmin ? 'admin' : 'user',
          text: texto,
          sentAt: agora,
        })

        const mudancas: Record<string, unknown> = { updatedAt: agora }
        const avisos: TicketMessage[] = []
        const limpar: Record<string, ''> = {}

        if (ehAdmin) {
          // Responder é assumir: exigir o clique em "pegar ticket" antes só
          // servia para deixar tickets respondidos sem dono na coluna errada.
          if (!ticket.assignedTo || ticket.status === 'open') {
            mudancas.assignedTo = session.userId
            mudancas.assignedToName = nome
          }
          if (ticket.status !== 'assigned') {
            mudancas.status = 'assigned'
            limpar.resolvedAt = ''
          }
          if (!ticket.firstResponseAt) mudancas.firstResponseAt = agora
          mudancas.adminLastSeenAt = agora
        } else {
          mudancas.userLastSeenAt = agora
          // Discordar do "resolvido" precisa ser possível sem abrir outro
          // ticket: a resposta do dono devolve o atendimento para a fila.
          if (ticket.status === 'resolved') {
            mudancas.status = ticket.assignedTo ? 'assigned' : 'open'
            mudancas.reopenedAt = agora
            limpar.resolvedAt = ''
            avisos.push(
              mensagemDoSistema(`${nome} respondeu e o ticket voltou para atendimento.`),
            )
          }
        }

        await ticketsCollection.updateOne(
          { _id },
          {
            $push: { messages: { $each: [mensagem, ...avisos] } },
            $set: mudancas,
            ...(Object.keys(limpar).length > 0 ? { $unset: limpar } : {}),
          },
        )

        // ── Avisar o outro lado ──
        if (ehAdmin) {
          await notificar(db, {
            userId: ticket.userId,
            type: 'ticket_reply',
            message: `${nome} respondeu o seu ticket "${ticket.title}"`,
            ticketId: id,
            ticketTitle: ticket.title,
            read: false,
            createdAt: agora,
          })

          if (!devoAvisarPorEmail(ticket, { agora })) {
            // Segurou por causa da rajada: marca a dívida em vez de descartar a
            // mensagem. Ou o próximo envio a leva junto, ou a varredura
            // (/api/cron/ticket-replies) entrega quando esfriar — nunca em
            // silêncio, e o log diz o que aconteceu.
            await ticketsCollection.updateOne(
              { _id },
              { $set: { pendingEmailSince: ticket.pendingEmailSince || agora } },
            )
            console.log(
              `[tickets] resposta do ticket ${protocolo} entra no próximo e-mail — o anterior saiu há menos de 5 min`,
            )
          } else {
            // Vai tudo que o atendente escreveu desde o último aviso, não só
            // esta mensagem: é o que transforma a trava em agrupamento.
            const respostas = [
              ...respostasPendentes(ticket.messages, ticket.lastEmailAt),
              { texto, data: agora },
            ]

            await deliverTransactionalEmails([
              enviarAvisoDeRespostas(db, ticket, {
                respostas,
                adminNome: nome,
                status: (mudancas.status as Ticket['status']) || ticket.status,
                agora,
              }),
            ])
          }
        } else {
          // O admin que atende é quem precisa saber; sem dono, a fila inteira.
          const destinatarios = ticket.assignedTo
            ? [ticket.assignedTo]
            : (
                await db
                  .collection('users')
                  .find({ role: 'admin' }, { projection: { _id: 1 } })
                  .limit(20)
                  .toArray()
              ).map((a) => a._id.toString())

          for (const adminId of destinatarios) {
            await notificar(db, {
              userId: adminId,
              type: 'ticket_user_reply',
              message: `${nome} respondeu o ticket #${protocolo}: "${ticket.title}"`,
              ticketId: id,
              ticketTitle: ticket.title,
              read: false,
              createdAt: agora,
            })
          }
        }

        return NextResponse.json({ success: true, message: 'Mensagem enviada' })
      }

      // ── Marcar como lida ───────────────────────────────────────────────
      case 'mark_read': {
        const ids: string[] = Array.isArray(body.messageIds)
          ? body.messageIds.filter((m: unknown) => typeof m === 'string').slice(0, 300)
          : []

        const condicao: Record<string, unknown> = {
          'm.readAt': { $exists: false },
          'm.senderId': { $ne: session.userId },
        }
        // Quem lê não marca o próprio lado: o admin confirma a leitura do que
        // o usuário escreveu, e vice-versa.
        if (ehAdmin) {
          condicao['m.senderRole'] = { $ne: 'admin' }
          condicao['m.senderId'] = { $nin: [session.userId, 'system'] }
        } else {
          condicao['m.senderRole'] = 'admin'
        }
        if (ids.length > 0) condicao['m.id'] = { $in: ids }

        // `updatedAt` NÃO é tocado de propósito: abrir uma conversa antiga não
        // pode reordená-la para o topo da fila como se tivesse tido atividade.
        await ticketsCollection.updateOne(
          { _id },
          {
            $set: {
              'messages.$[m].readAt': agora,
              [ehAdmin ? 'adminLastSeenAt' : 'userLastSeenAt']: agora,
            },
          },
          { arrayFilters: [condicao] },
        )

        return NextResponse.json({ success: true })
      }

      // ── Resolver ───────────────────────────────────────────────────────
      case 'resolve': {
        if (!ehAdmin) {
          return NextResponse.json(
            { error: 'Apenas admins podem resolver tickets' },
            { status: 403 },
          )
        }
        if (ticket.status === 'resolved') {
          return NextResponse.json({ success: true, message: 'Ticket já estava resolvido' })
        }

        await ticketsCollection.updateOne(
          { _id },
          {
            $set: {
              status: 'resolved',
              resolvedAt: agora,
              updatedAt: agora,
              lastEmailAt: agora,
              ...(ticket.assignedTo ? {} : { assignedTo: session.userId, assignedToName: nome }),
            },
            // O e-mail abaixo leva o que estava pendente; a dívida está paga.
            $unset: { pendingEmailSince: '' },
            $push: {
              messages: mensagemDoSistema(
                `${nome} marcou este ticket como resolvido. Se ainda ficou alguma dúvida, é só responder aqui que ele volta para atendimento.`,
              ),
            },
          },
        )

        await notificar(db, {
          userId: ticket.userId,
          type: 'ticket_resolved',
          message: `Seu ticket "${ticket.title}" foi marcado como resolvido`,
          ticketId: id,
          ticketTitle: ticket.title,
          read: false,
          createdAt: agora,
        })

        const dono = await emailDoDono(db, ticket)
        await deliverTransactionalEmails([
          sendTicketStatusEmail({
            email: dono.email,
            name: dono.name,
            ticketId: id,
            protocolo,
            titulo: ticket.title,
            categoria: rotuloDaCategoria(ticket.category),
            criadoEm: ticket.createdAt,
            evento: 'resolved',
            adminNome: nome,
            ultimasRespostas: contextoDeRespostas(ticket),
          }).catch((err) => console.error('[tickets] falha no e-mail de resolução:', err)),
        ])

        return NextResponse.json({ success: true, message: 'Ticket resolvido' })
      }

      // ── Fechar ─────────────────────────────────────────────────────────
      case 'close': {
        if (ticket.status === 'closed') {
          return NextResponse.json({ success: true, message: 'Ticket já estava fechado' })
        }

        const fechadoPor = ehAdmin && !ehDono ? 'admin' : 'user'

        await ticketsCollection.updateOne(
          { _id },
          {
            $set: {
              status: 'closed',
              closedAt: agora,
              closedBy: fechadoPor,
              updatedAt: agora,
            },
            $push: {
              messages: mensagemDoSistema(
                fechadoPor === 'admin'
                  ? `${nome} encerrou este ticket.`
                  : `${nome} encerrou este ticket. Obrigado pelo contato!`,
              ),
            },
          },
        )

        // Quem fecha já sabe que fechou — só o outro lado precisa ser avisado.
        if (fechadoPor === 'admin') {
          await notificar(db, {
            userId: ticket.userId,
            type: 'ticket_closed',
            message: `Seu ticket "${ticket.title}" foi encerrado pelo suporte`,
            ticketId: id,
            ticketTitle: ticket.title,
            read: false,
            createdAt: agora,
          })

          const dono = await emailDoDono(db, ticket)
          await deliverTransactionalEmails([
            sendTicketStatusEmail({
              email: dono.email,
              name: dono.name,
              ticketId: id,
              protocolo,
              titulo: ticket.title,
              categoria: rotuloDaCategoria(ticket.category),
              criadoEm: ticket.createdAt,
              evento: 'closed',
              adminNome: nome,
              ultimasRespostas: contextoDeRespostas(ticket),
            }).catch((err) => console.error('[tickets] falha no e-mail de encerramento:', err)),
          ])
          await ticketsCollection.updateOne(
            { _id },
            { $set: { lastEmailAt: agora }, $unset: { pendingEmailSince: '' } },
          )
        }

        return NextResponse.json({ success: true, message: 'Ticket fechado' })
      }

      // ── Reabrir ────────────────────────────────────────────────────────
      case 'reopen': {
        // O dono também pode reabrir o próprio ticket: antes, um ticket
        // encerrado por engano obrigava a pessoa a abrir outro e recontar tudo.
        if (!ehAdmin && !ehDono) {
          return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }
        if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
          return NextResponse.json({ success: true, message: 'Ticket já está em atendimento' })
        }

        const novoResponsavel = ehAdmin
          ? { assignedTo: session.userId, assignedToName: nome }
          : {}

        await ticketsCollection.updateOne(
          { _id },
          {
            $set: {
              status: ehAdmin || ticket.assignedTo ? 'assigned' : 'open',
              reopenedAt: agora,
              updatedAt: agora,
              ...novoResponsavel,
            },
            $unset: { resolvedAt: '', closedAt: '', closedBy: '' },
            $push: {
              messages: mensagemDoSistema(
                ehAdmin
                  ? `${nome} reabriu este ticket.`
                  : `${nome} reabriu este ticket e aguarda atendimento.`,
              ),
            },
          },
        )

        if (ehAdmin) {
          await notificar(db, {
            userId: ticket.userId,
            type: 'ticket_reopened',
            message: `Seu ticket "${ticket.title}" foi reaberto por ${nome}`,
            ticketId: id,
            ticketTitle: ticket.title,
            read: false,
            createdAt: agora,
          })

          const dono = await emailDoDono(db, ticket)
          await deliverTransactionalEmails([
            sendTicketStatusEmail({
              email: dono.email,
              name: dono.name,
              ticketId: id,
              protocolo,
              titulo: ticket.title,
              categoria: rotuloDaCategoria(ticket.category),
              criadoEm: ticket.createdAt,
              evento: 'reopened',
              adminNome: nome,
            }).catch((err) => console.error('[tickets] falha no e-mail de reabertura:', err)),
          ])
          await ticketsCollection.updateOne(
            { _id },
            { $set: { lastEmailAt: agora }, $unset: { pendingEmailSince: '' } },
          )
        } else {
          const destinatarios = ticket.assignedTo
            ? [ticket.assignedTo]
            : (
                await db
                  .collection('users')
                  .find({ role: 'admin' }, { projection: { _id: 1 } })
                  .limit(20)
                  .toArray()
              ).map((a) => a._id.toString())

          for (const adminId of destinatarios) {
            await notificar(db, {
              userId: adminId,
              type: 'ticket_user_reply',
              message: `${nome} reabriu o ticket #${protocolo}: "${ticket.title}"`,
              ticketId: id,
              ticketTitle: ticket.title,
              read: false,
              createdAt: agora,
            })
          }
        }

        return NextResponse.json({ success: true, message: 'Ticket reaberto' })
      }

      // ── Prioridade (triagem interna) ───────────────────────────────────
      case 'set_priority': {
        if (!ehAdmin) {
          return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }
        if (!ehPrioridadeValida(body.priority)) {
          return NextResponse.json({ error: 'Prioridade inválida' }, { status: 400 })
        }

        // Prioridade é triagem, não atividade: mexer nela não pode empurrar o
        // ticket para o topo da lista por `updatedAt`.
        await ticketsCollection.updateOne({ _id }, { $set: { priority: body.priority } })

        return NextResponse.json({ success: true, message: 'Prioridade atualizada' })
      }

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Update ticket error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar ticket' }, { status: 500 })
  }
}
