import type { Db, ObjectId } from 'mongodb'
import { ObjectId as ObjectIdCtor } from 'mongodb'
import type { Ticket, TicketMessage } from '@/lib/types'
import { sendTicketReplyEmail } from '@/lib/mail'
import {
  TICKET_INTERVALO_EMAIL_MS,
  TICKET_STATUS_LABEL,
  ehMensagemDoSistema,
  protocoloDoTicket,
  respostasPendentes,
  rotuloDaCategoria,
} from '@/lib/tickets'

/**
 * Entrega das respostas do suporte por e-mail — o lado servidor da coisa.
 *
 * Mora aqui, e não dentro da rota, porque roda de dois lugares:
 *
 *  1. na hora em que o admin responde (`PATCH /api/tickets/[id]`), quando a
 *     trava de rajada deixa passar;
 *  2. na varredura agendada, que recolhe o que a trava segurou.
 *
 * O par (1)+(2) é o que fecha a garantia: **toda** resposta do atendente chega
 * à caixa de entrada exatamente uma vez, agrupada. Sem a varredura, a mensagem
 * segurada ficaria só no chat — e se fosse a última do atendimento, ninguém
 * nunca seria avisado dela.
 */

/** E-mail atual do dono do ticket (o gravado na abertura pode ter mudado). */
export async function emailDoDono(
  db: Db,
  ticket: Ticket,
): Promise<{ email: string; name: string }> {
  try {
    const dono = await db
      .collection('users')
      .findOne({ _id: new ObjectIdCtor(ticket.userId) }, { projection: { email: 1, name: 1 } })
    if (dono?.email) return { email: String(dono.email), name: String(dono.name || ticket.userName) }
  } catch {
    // Id fora do formato de ObjectId em base antiga: cai no que o ticket guarda.
  }
  return { email: ticket.userEmail, name: ticket.userName }
}

/**
 * Última fala de verdade de um dos lados — o aviso automático não conta, senão
 * o e-mail citaria "Sistema" como se fosse o atendente.
 */
export function ultimaMensagemDe(
  ticket: Pick<Ticket, 'messages'>,
  papel: 'admin' | 'user',
): TicketMessage | undefined {
  for (let i = ticket.messages.length - 1; i >= 0; i--) {
    const msg = ticket.messages[i]
    if (ehMensagemDoSistema(msg)) continue
    if (papel === 'admin' ? msg.senderRole === 'admin' : msg.senderRole !== 'admin') return msg
  }
  return undefined
}

/**
 * Monta e envia o aviso com as respostas informadas, e só então marca o ticket
 * como avisado. A ordem importa: gravar `lastEmailAt` antes do envio faria uma
 * falha de SMTP virar mensagem perdida — o ticket ficaria "já avisado" sem que
 * nada tivesse saído.
 */
export async function enviarAvisoDeRespostas(
  db: Db,
  ticket: Ticket,
  opcoes: {
    respostas: { texto: string; data?: Date | string }[]
    adminNome: string
    status?: Ticket['status']
    agora?: Date
  },
): Promise<boolean> {
  const respostas = opcoes.respostas.filter((r) => r && r.texto)
  if (respostas.length === 0) return false

  const agora = opcoes.agora || new Date()
  const id = String(ticket._id)
  const protocolo = protocoloDoTicket(id)

  try {
    const dono = await emailDoDono(db, ticket)
    const pergunta = ultimaMensagemDe(ticket, 'user')

    await sendTicketReplyEmail({
      email: dono.email,
      name: dono.name,
      ticketId: id,
      protocolo,
      titulo: ticket.title,
      status: TICKET_STATUS_LABEL[opcoes.status || ticket.status],
      categoria: rotuloDaCategoria(ticket.category),
      criadoEm: ticket.createdAt,
      adminNome: opcoes.adminNome,
      respostas,
      perguntaDoUsuario: pergunta?.text,
      perguntaEm: pergunta?.sentAt,
    })
  } catch (err) {
    console.error(`[tickets] falha no e-mail de resposta do ticket ${protocolo}:`, err)
    return false
  }

  await db
    .collection<Ticket>('tickets')
    .updateOne(
      { _id: ticket._id as ObjectId },
      { $set: { lastEmailAt: agora }, $unset: { pendingEmailSince: '' } },
    )

  return true
}

/**
 * Varredura das respostas que a trava de rajada segurou.
 *
 * Pega os tickets marcados com `pendingEmailSince` já esfriado e manda, num
 * e-mail só, tudo que o atendente escreveu desde o último aviso. Roda de
 * minuto em minuto pela rota de cron — é barata porque o índice em
 * `pendingEmailSince` faz a consulta não encontrar nada na imensa maioria das
 * vezes.
 */
export async function varrerRespostasPendentes(
  db: Db,
  opcoes: { agora?: Date; maximo?: number } = {},
): Promise<{ verificados: number; enviados: number }> {
  const agora = opcoes.agora || new Date()
  const esfriouEm = new Date(agora.getTime() - TICKET_INTERVALO_EMAIL_MS)

  const pendentes = await db
    .collection<Ticket>('tickets')
    .find({ pendingEmailSince: { $lte: esfriouEm } })
    .limit(opcoes.maximo || 50)
    .toArray()

  let enviados = 0

  for (const ticket of pendentes) {
    const respostas = respostasPendentes(ticket.messages || [], ticket.lastEmailAt)

    if (respostas.length === 0) {
      // Nada a dizer (o aviso já saiu por outro caminho, como o e-mail de
      // "resolvido"): limpa a marca para não revisitar o ticket para sempre.
      await db
        .collection<Ticket>('tickets')
        .updateOne({ _id: ticket._id as ObjectId }, { $unset: { pendingEmailSince: '' } })
      continue
    }

    const ultimoAdmin = ultimaMensagemDe(ticket, 'admin')
    const ok = await enviarAvisoDeRespostas(db, ticket, {
      respostas,
      adminNome: ultimoAdmin?.senderName || ticket.assignedToName || 'Suporte DomineAqui',
      agora,
    })
    if (ok) enviados++
  }

  if (pendentes.length > 0) {
    console.log(
      `[tickets] varredura de respostas pendentes: ${pendentes.length} verificado(s), ${enviados} e-mail(s) enviado(s)`,
    )
  }

  return { verificados: pendentes.length, enviados }
}
