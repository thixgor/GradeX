import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import type { Notification, Ticket, TicketMessage } from '@/lib/types'
import {
  TICKET_STATUS_LABEL,
  contarNaoLidas,
  ehMensagemDoSistema,
  mensagemDoSistema,
  novaMensagem,
  protocoloDoTicket,
  rotuloDaCategoria,
} from '@/lib/tickets'
import {
  VISITANTE_MENSAGENS_POR_TICKET,
  ehIdDeTicket,
  ehTicketDeVisitante,
  validarRespostaDeVisitante,
} from '@/lib/tickets-visitante-regras'
import { chaveConfere, hashDe, ipDaRequisicao, lerJsonLimitado, origemConfere } from '@/lib/tickets-visitante'

export const dynamic = 'force-dynamic'

/**
 * A conversa de um chamado de visitante, pela chave do link.
 *
 * A chave viaja no cabeçalho `x-chave` (não em cookie, não na URL da API):
 * fora de cookie não há CSRF, e fora da URL ela não cai em log de acesso.
 * Chave errada e ticket inexistente respondem igual (404), para o endereço
 * não servir de oráculo de quais ids existem.
 *
 * O que volta é uma vista enxuta: sem e-mail, sem hashes, sem ids internos de
 * quem atende.
 */

const NAO_ARMAZENAR = { 'Cache-Control': 'no-store' }
const NAO_ENCONTRADO = () =>
  NextResponse.json({ error: 'Chamado não encontrado. Confira o link do e-mail.' }, { status: 404, headers: NAO_ARMAZENAR })

async function abrir(request: NextRequest, id: string, limitePorMinuto: number, rotulo: string) {
  if (!ehIdDeTicket(id)) return { erro: NAO_ENCONTRADO() }

  const ipHash = hashDe('ip', ipDaRequisicao(request))
  const limite = await checkRateLimit(ipHash, rotulo, limitePorMinuto, 60_000)
  if (!limite.success) {
    return {
      erro: NextResponse.json({ error: 'Muitas requisições. Aguarde um instante.' }, { status: 429, headers: NAO_ARMAZENAR }),
    }
  }

  if (!chaveConfere(id, request.headers.get('x-chave'))) return { erro: NAO_ENCONTRADO() }

  const db = await getDb()
  const ticket = await db.collection<Ticket>('tickets').findOne({ _id: new ObjectId(id) })
  if (!ticket || !ehTicketDeVisitante(ticket)) return { erro: NAO_ENCONTRADO() }
  return { db, ticket }
}

function vista(ticket: Ticket) {
  const id = String(ticket._id)
  return {
    id,
    protocolo: protocoloDoTicket(id),
    titulo: ticket.title,
    categoria: rotuloDaCategoria(ticket.category),
    status: ticket.status,
    statusRotulo: TICKET_STATUS_LABEL[ticket.status],
    nome: ticket.userName,
    criadoEm: ticket.createdAt,
    atualizadoEm: ticket.updatedAt,
    naoLidas: contarNaoLidas(ticket.messages || [], 'user'),
    mensagens: (ticket.messages || []).map((m: TicketMessage) => ({
      id: m.id,
      autor: ehMensagemDoSistema(m) ? 'sistema' : m.senderRole === 'admin' ? 'suporte' : 'voce',
      nome: m.senderRole === 'admin' ? m.senderName : undefined,
      texto: m.text,
      enviadaEm: m.sentAt,
      lidaEm: m.readAt,
    })),
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const r = await abrir(request, id, 30, 'suporte_visitante_ler')
    if ('erro' in r) return r.erro
    return NextResponse.json({ chamado: vista(r.ticket) }, { headers: NAO_ARMAZENAR })
  } catch (error) {
    console.error('[suporte-visitante] falha ao ler chamado:', error)
    return NextResponse.json({ error: 'Não foi possível abrir o chamado agora.' }, { status: 500, headers: NAO_ARMAZENAR })
  }
}

/** PATCH — `responder`, `lido` ou `encerrar`. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!origemConfere(request)) {
      return NextResponse.json({ error: 'Requisição recusada.' }, { status: 403, headers: NAO_ARMAZENAR })
    }
    const { id } = await params
    const lido = await lerJsonLimitado(request, 12 * 1024)
    if (!lido.ok) return NextResponse.json({ error: lido.erro }, { status: lido.status, headers: NAO_ARMAZENAR })

    const r = await abrir(request, id, 12, 'suporte_visitante_agir')
    if ('erro' in r) return r.erro
    const { db, ticket } = r
    const tickets = db.collection<Ticket>('tickets')
    const _id = ticket._id as ObjectId
    const agora = new Date()
    const acao = lido.corpo.acao

    if (acao === 'lido') {
      const ids = (ticket.messages || [])
        .filter((m) => m.senderRole === 'admin' && !m.readAt)
        .map((m) => m.id)
      if (ids.length > 0) {
        await tickets.updateOne(
          { _id },
          { $set: { 'messages.$[m].readAt': agora, userLastSeenAt: agora } },
          { arrayFilters: [{ 'm.id': { $in: ids } }] },
        )
      }
      return NextResponse.json({ ok: true }, { headers: NAO_ARMAZENAR })
    }

    if (acao === 'encerrar') {
      if (ticket.status !== 'closed') {
        await tickets.updateOne(
          { _id },
          {
            $set: { status: 'closed', closedAt: agora, closedBy: 'user', updatedAt: agora },
            $push: { messages: mensagemDoSistema(`${ticket.userName} encerrou o chamado.`) },
          },
        )
      }
      const atualizado = await tickets.findOne({ _id })
      return NextResponse.json({ chamado: vista(atualizado || ticket) }, { headers: NAO_ARMAZENAR })
    }

    if (acao !== 'responder') {
      return NextResponse.json({ error: 'Ação inválida.' }, { status: 400, headers: NAO_ARMAZENAR })
    }

    if (ticket.status === 'closed') {
      return NextResponse.json(
        { error: 'Este chamado foi encerrado. Abra um novo pela Central de Ajuda.' },
        { status: 409, headers: NAO_ARMAZENAR },
      )
    }
    const doVisitante = (ticket.messages || []).filter((m) => !ehMensagemDoSistema(m) && m.senderRole !== 'admin').length
    if (doVisitante >= VISITANTE_MENSAGENS_POR_TICKET) {
      return NextResponse.json(
        { error: 'Esta conversa ficou longa demais. Abra um novo chamado para continuar.' },
        { status: 409, headers: NAO_ARMAZENAR },
      )
    }

    const resposta = validarRespostaDeVisitante(lido.corpo.texto)
    if (!resposta.ok) return NextResponse.json({ error: resposta.erro }, { status: 400, headers: NAO_ARMAZENAR })

    // Por chamado, além do limite por IP da função `abrir`: 8 falas a cada
    // 10 minutos é conversa rápida; mais que isso é alguém colando texto.
    const porChamado = await checkRateLimit(id, 'suporte_visitante_resposta', 8, 600_000)
    if (!porChamado.success) {
      return NextResponse.json({ error: 'Muitas mensagens seguidas. Aguarde um instante.' }, { status: 429, headers: NAO_ARMAZENAR })
    }

    const mensagem = novaMensagem({
      senderId: ticket.userId,
      senderName: ticket.userName,
      senderRole: 'user',
      text: resposta.texto,
      sentAt: agora,
    })
    const avisos: TicketMessage[] = []
    const mudancas: Record<string, unknown> = { updatedAt: agora, userLastSeenAt: agora }
    if (ticket.status === 'resolved') {
      mudancas.status = ticket.assignedTo ? 'assigned' : 'open'
      mudancas.reopenedAt = agora
      avisos.push(mensagemDoSistema(`${ticket.userName} respondeu e o chamado voltou para atendimento.`))
    }

    await tickets.updateOne(
      { _id },
      {
        $push: { messages: { $each: [mensagem, ...avisos] } },
        $set: mudancas,
        ...(ticket.status === 'resolved' ? { $unset: { resolvedAt: '' } } : {}),
      },
    )

    // Quem atende precisa saber; sem dono, a fila (até 20 admins).
    const destinos = ticket.assignedTo
      ? [ticket.assignedTo]
      : (await db.collection('users').find({ role: 'admin' }, { projection: { _id: 1 } }).limit(20).toArray()).map((a) =>
          String(a._id),
        )
    if (destinos.length > 0) {
      await db
        .collection<Notification>('notifications')
        .insertMany(
          destinos.map((userId) => ({
            userId,
            type: 'ticket_reply' as const,
            message: `${ticket.userName} (visitante) respondeu o chamado "${ticket.title}"`,
            ticketId: id,
            ticketTitle: ticket.title,
            read: false,
            createdAt: agora,
          })),
        )
        .catch((err) => console.error('[suporte-visitante] falha na notificação de resposta:', err))
    }

    const atualizado = await tickets.findOne({ _id })
    return NextResponse.json({ chamado: vista(atualizado || ticket) }, { headers: NAO_ARMAZENAR })
  } catch (error) {
    console.error('[suporte-visitante] falha na ação do chamado:', error)
    return NextResponse.json({ error: 'Não foi possível concluir agora.' }, { status: 500, headers: NAO_ARMAZENAR })
  }
}
