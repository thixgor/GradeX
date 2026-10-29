import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { verifyRecaptcha } from '@/lib/recaptcha'
import { deliverTransactionalEmails, sendNewTicketAdminEmail, sendTicketVisitanteRecebidoEmail } from '@/lib/mail'
import type { Notification, Ticket } from '@/lib/types'
import { mensagemDoSistema, novaMensagem, protocoloDoTicket, rotuloDaCategoria } from '@/lib/tickets'
import {
  PREFIXO_VISITANTE,
  VISITANTE_CORPO_MAX_BYTES,
  validarChamadoDeVisitante,
} from '@/lib/tickets-visitante-regras'
import {
  chaveDoTicketDeVisitante,
  consumirDesafio,
  emitirDesafio,
  garantirIndicesDoVisitante,
  hashDe,
  ipDaRequisicao,
  lerDesafio,
  lerJsonLimitado,
  linkDoTicketDeVisitante,
  origemConfere,
} from '@/lib/tickets-visitante'

export const dynamic = 'force-dynamic'

/**
 * Chamado de suporte aberto SEM conta — a superfície mais exposta do suporte.
 *
 * As camadas, na ordem em que rodam (da mais barata para a mais cara, para o
 * lixo morrer antes de custar banco ou e-mail):
 *
 *  1. origem: só o próprio site faz POST aqui;
 *  2. corpo com teto de 16 KB, lido em streaming — nada gigante vira objeto;
 *  3. honeypot: campo invisível que só robô preenche → finge sucesso;
 *  4. validação do conteúdo (tamanhos, e-mail, links, repetição, invisíveis);
 *  5. limite por IP (3/hora, 8/dia);
 *  6. desafio assinado, com idade mínima de 3 s e USO ÚNICO no banco;
 *  7. reCAPTCHA v3, quando o projeto tem as chaves;
 *  8. limite por e-mail (3/dia) e teto global (40/hora para o site todo);
 *  9. no máximo 3 chamados abertos por e-mail, e nada de duplicata em 24 h.
 *
 * O e-mail de confirmação não repete nada do que foi digitado (ver
 * `sendTicketVisitanteRecebidoEmail`), e o aviso à equipe tem teto próprio —
 * uma rajada que escape de tudo acima enche a fila, não a caixa de entrada.
 */

const NAO_ARMAZENAR = { 'Cache-Control': 'no-store' }

function negar(status: number, erro: string, extra: Record<string, string> = {}) {
  return NextResponse.json({ error: erro }, { status, headers: { ...NAO_ARMAZENAR, ...extra } })
}

function esperar(resetAt?: Date): Record<string, string> {
  if (!resetAt) return {}
  return { 'Retry-After': String(Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))) }
}

/** GET — entrega um desafio novo ao formulário. */
export async function GET(request: NextRequest) {
  try {
    const ipHash = hashDe('ip', ipDaRequisicao(request))
    const limite = await checkRateLimit(ipHash, 'suporte_visitante_desafio', 30, 600_000)
    if (!limite.success) return negar(429, 'Muitas tentativas. Aguarde alguns minutos.', esperar(limite.resetAt))
    return NextResponse.json({ desafio: emitirDesafio() }, { headers: NAO_ARMAZENAR })
  } catch (error) {
    console.error('[suporte-visitante] falha ao emitir desafio:', error)
    return negar(503, 'O suporte está indisponível agora. Tente de novo em instantes.')
  }
}

/** POST — abre o chamado. */
export async function POST(request: NextRequest) {
  try {
    if (!origemConfere(request)) return negar(403, 'Requisição recusada.')

    const lido = await lerJsonLimitado(request, VISITANTE_CORPO_MAX_BYTES)
    if (!lido.ok) return negar(lido.status, lido.erro)
    const corpo = lido.corpo

    // Honeypot: o campo `site` fica fora da tela e do leitor de tela. Gente não
    // preenche; robô preenche tudo. Responder "sucesso" não ensina o robô a
    // mudar de tática — e nada é gravado nem enviado.
    if (typeof corpo.site === 'string' && corpo.site.trim() !== '') {
      return NextResponse.json(
        { ok: true, protocolo: new ObjectId().toString().slice(-8).toUpperCase() },
        { headers: NAO_ARMAZENAR },
      )
    }

    const validado = validarChamadoDeVisitante(corpo)
    if (!validado.ok) {
      return NextResponse.json({ error: validado.erro, campo: validado.campo }, { status: 400, headers: NAO_ARMAZENAR })
    }
    const chamado = validado.chamado

    const ipHash = hashDe('ip', ipDaRequisicao(request))
    const porHora = await checkRateLimit(ipHash, 'suporte_visitante_ip_h', 3, 3_600_000)
    if (!porHora.success) {
      return negar(429, 'Você abriu chamados demais em pouco tempo. Aguarde um pouco.', esperar(porHora.resetAt))
    }
    const porDia = await checkRateLimit(ipHash, 'suporte_visitante_ip_d', 8, 86_400_000)
    if (!porDia.success) {
      return negar(429, 'Limite de chamados de hoje atingido nesta conexão. Tente amanhã.', esperar(porDia.resetAt))
    }

    const desafio = lerDesafio(corpo.desafio)
    if (!desafio.ok) {
      // "cedo" e "vencido" são de gente (enviou rápido demais ou deixou a aba
      // aberta por horas): a tela pede outro desafio e tenta de novo sozinha.
      const status = desafio.motivo === 'cedo' || desafio.motivo === 'vencido' ? 409 : 403
      return NextResponse.json(
        { error: 'Confirme o envio de novo.', renovarDesafio: true },
        { status, headers: NAO_ARMAZENAR },
      )
    }

    if (process.env.RECAPTCHA_SECRET_KEY) {
      const captcha = await verifyRecaptcha(String(corpo.recaptchaToken || ''), 'MEDIUM_RISK', 'suporte_visitante')
      if (!captcha.success) return negar(403, 'Não conseguimos confirmar que você não é um robô. Recarregue e tente de novo.')
    }

    const emailHash = hashDe('email', chamado.email)
    const porEmail = await checkRateLimit(emailHash, 'suporte_visitante_email', 3, 86_400_000)
    if (!porEmail.success) {
      return negar(429, 'Este e-mail já abriu chamados demais hoje. Responda pelos que estão abertos.', esperar(porEmail.resetAt))
    }
    const global = await checkRateLimit('todos', 'suporte_visitante_global', 40, 3_600_000)
    if (!global.success) {
      return negar(503, 'Estamos recebendo muitos chamados agora. Tente de novo em alguns minutos.', esperar(global.resetAt))
    }

    const db = await getDb()
    void garantirIndicesDoVisitante(db)

    // Só agora o desafio é gasto: um erro de digitação acima não queima o
    // desafio de quem vai corrigir e reenviar.
    if (!(await consumirDesafio(db, desafio.nonce, desafio.emitidoEm))) {
      return NextResponse.json({ error: 'Confirme o envio de novo.', renovarDesafio: true }, { status: 409, headers: NAO_ARMAZENAR })
    }

    const tickets = db.collection<Ticket>('tickets')
    const desde = new Date(Date.now() - 86_400_000)
    const [abertos, duplicado, conta] = await Promise.all([
      tickets.countDocuments({ origem: 'visitante', visitanteEmailHash: emailHash, status: { $in: ['open', 'assigned'] } }),
      tickets.findOne(
        { origem: 'visitante', visitanteEmailHash: emailHash, title: chamado.titulo, createdAt: { $gte: desde } },
        { projection: { _id: 1 } },
      ),
      db.collection('users').findOne({ email: chamado.email }, { projection: { _id: 1 } }),
    ])
    if (duplicado) {
      return negar(409, 'Já recebemos este chamado. A resposta chega no seu e-mail — confira também o spam.')
    }
    if (abertos >= 3) {
      return negar(409, 'Já existem chamados em aberto para este e-mail. Continue por eles — o link está no e-mail de confirmação.')
    }

    const agora = new Date()
    const _id = new ObjectId()
    const ticketId = _id.toString()
    const protocolo = protocoloDoTicket(ticketId)

    const ticket: Ticket & { _id: ObjectId } = {
      _id,
      userId: `${PREFIXO_VISITANTE}${emailHash}`,
      userName: chamado.nome,
      userEmail: chamado.email,
      title: chamado.titulo,
      category: chamado.categoria,
      priority: chamado.categoria === 'financeiro' ? 'high' : 'normal',
      status: 'open',
      origem: 'visitante',
      contexto: chamado.contexto,
      visitanteEmailHash: emailHash,
      visitanteIpHash: ipHash,
      visitanteTemConta: !!conta,
      messages: [
        novaMensagem({
          senderId: `${PREFIXO_VISITANTE}${emailHash}`,
          senderName: chamado.nome,
          senderRole: 'user',
          text: chamado.mensagem,
          sentAt: agora,
        }),
        mensagemDoSistema(
          // Sem o e-mail no texto: quem tiver o link não descobre o endereço.
          `Chamado registrado com o protocolo #${protocolo}. A equipe responde por aqui, e cada resposta também chega no e-mail que você informou.`,
        ),
      ],
      createdAt: agora,
      updatedAt: agora,
    }
    await tickets.insertOne(ticket as Ticket)

    const admins = await db
      .collection('users')
      .find({ role: 'admin' }, { projection: { email: 1 } })
      .limit(20)
      .toArray()

    if (admins.length > 0) {
      await db
        .collection<Notification>('notifications')
        .insertMany(
          admins.map((admin) => ({
            userId: String(admin._id),
            type: 'ticket_created' as const,
            message: `Visitante ${chamado.nome} abriu o chamado #${protocolo}: "${chamado.titulo}"`,
            ticketId,
            ticketTitle: chamado.titulo,
            read: false,
            createdAt: agora,
          })),
        )
        .catch((err) => console.error('[suporte-visitante] falha nas notificações:', err))
    }

    // A equipe recebe e-mail até um teto por hora: passou disso, o chamado
    // está na fila e no sino, e a caixa de entrada não vira alvo.
    const emailDaEquipe = await checkRateLimit('equipe', 'suporte_visitante_email_equipe', 20, 3_600_000)

    await deliverTransactionalEmails([
      sendTicketVisitanteRecebidoEmail({
        email: chamado.email,
        protocolo,
        link: linkDoTicketDeVisitante(ticketId),
      }).catch((err) => console.error('[suporte-visitante] falha na confirmação:', err)),
      emailDaEquipe.success
        ? sendNewTicketAdminEmail({
            destinatarios: admins.map((a) => String(a.email || '')).filter(Boolean),
            protocolo,
            ticketId,
            titulo: chamado.titulo,
            categoria: rotuloDaCategoria(chamado.categoria),
            usuarioNome: chamado.nome,
            usuarioEmail: chamado.email,
            mensagem: chamado.mensagem,
            visitante: true,
            contexto: chamado.contexto,
          }).catch((err) => console.error('[suporte-visitante] falha no aviso à equipe:', err))
        : Promise.resolve(),
    ])

    return NextResponse.json(
      { ok: true, ticketId, protocolo, chave: chaveDoTicketDeVisitante(ticketId) },
      { headers: NAO_ARMAZENAR },
    )
  } catch (error) {
    console.error('[suporte-visitante] falha ao abrir chamado:', error)
    return negar(500, 'Não foi possível abrir o chamado agora. Tente de novo em instantes.')
  }
}
