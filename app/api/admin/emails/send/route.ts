import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { User } from '@/lib/types'
import { dispatchBulk } from '@/lib/comms/dispatch'
import { drainQueueNow } from '@/lib/comms/process'
import { statsByStatus } from '@/lib/comms/outbox'
import type { OutboxTarget } from '@/lib/comms/types'

export const dynamic = 'force-dynamic'

interface EmailPayload {
    recipients: {
        userIds?: string[]
        additionalEmails?: string[]
        selectAll?: boolean
    }
    subject: string
    content: string
    previewText?: string
}

interface Recipient {
    email: string
    name: string
}

/**
 * Disparo de campanha por e-mail.
 *
 * Antes, esta rota enviava até 50 e-mails simultâneos por lote via
 * `Promise.all` dentro do request — o que estourava o limite do SMTP e gerava
 * os erros de "auth limit" (~67 falhas). Agora ela ENFILEIRA na outbox
 * (lib/comms) e já drena a fila antes de responder (com rate-limit,
 * retry/backoff e log por destinatário) — sem depender de cron: este projeto
 * não usa Vercel Cron para a fila. Lotes grandes que não couberem no
 * orçamento de tempo continuam "pending" e são pegos pelo botão "Processar
 * fila agora" (`/admin/social-media`) ou por um ticker externo opcional.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body: EmailPayload = await request.json()
        const { recipients, subject, content, previewText } = body

        if (!subject || !content) {
            return NextResponse.json(
                { error: 'Assunto e conteúdo são obrigatórios' },
                { status: 400 }
            )
        }

        const db = await getDb()
        const usersCollection = db.collection<User>('users')

        let recipientList: Recipient[] = []

        if (recipients.selectAll) {
            const allUsers = await usersCollection.find({}).project({ email: 1, name: 1 }).toArray()
            recipientList = allUsers.map(u => ({ email: u.email, name: u.name || '' }))
        } else if (recipients.userIds && recipients.userIds.length > 0) {
            const { ObjectId } = await import('mongodb')
            const selectedUsers = await usersCollection
                .find({ _id: { $in: recipients.userIds.map(id => new ObjectId(id)) } })
                .project({ email: 1, name: 1 })
                .toArray()
            recipientList = selectedUsers.map(u => ({ email: u.email, name: u.name || '' }))
        }

        // Adicionar e-mails extras (sem nome cadastrado)
        if (recipients.additionalEmails && recipients.additionalEmails.length > 0) {
            const validExtras = recipients.additionalEmails
                .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                .map(email => ({ email, name: '' }))
            recipientList = [...recipientList, ...validExtras]
        }

        // Remover duplicatas por e-mail
        const seen = new Set<string>()
        recipientList = recipientList.filter(r => {
            if (seen.has(r.email)) return false
            seen.add(r.email)
            return true
        })

        if (recipientList.length === 0) {
            return NextResponse.json(
                { error: 'Nenhum destinatário válido encontrado' },
                { status: 400 }
            )
        }

        // Enfileira na outbox. O template completo é renderizado pelo adapter no
        // momento do envio (guardamos só content/subject/previewText por destinatário).
        const targets: OutboxTarget[] = recipientList.map(r => ({ email: r.email, name: r.name }))
        const campaignId = `broadcast:${Date.now()}`

        const queued = await dispatchBulk(
            'email',
            targets,
            'campaign-broadcast',
            { subject, content, previewText },
            { campaignId },
        )

        // Envia AGORA — não espera cron/ticker. O que não couber no orçamento de
        // tempo continua "pending" (botão "Processar fila agora" cobre o resto).
        //
        // O orçamento fica BEM abaixo do maxDuration (60s) da função: assim o
        // drain nunca segura a resposta até o gateway estourar e devolver um 504
        // com corpo em texto ("An error occurred…") — que o front quebrava ao
        // fazer res.json(). Se o drain falhar por qualquer motivo, ainda
        // respondemos com sucesso do enfileiramento (a fila é drenada depois).
        //
        // IMPORTANTE: o drain esvazia a fila do CANAL inteiro (inclusive e-mails
        // de outras campanhas que estavam pendentes), então o total retornado por
        // ele NÃO corresponde a esta campanha — usá-lo direto gerava mensagens
        // absurdas como "Enviado: 9 de 1". Por isso, para o relatório, contamos o
        // status apenas DESTA campanha (statsByStatus por campaignId).
        try {
            await drainQueueNow(['email'], { timeBudgetMs: 15_000 })
        } catch (drainError) {
            console.error('Drain email queue error (mensagens seguem na fila):', drainError)
        }

        const stats = await statsByStatus({ channel: 'email', campaignId })
        const sentNow = stats.sent || 0
        const failedNow = stats.dead || 0
        // Tudo que ainda não saiu desta campanha (aguardando fila/retry).
        const stillPending = Math.max(queued - sentNow - failedNow, 0)

        const parts: string[] = []
        if (sentNow > 0) parts.push(`${sentNow} enviado${sentNow > 1 ? 's' : ''}`)
        if (stillPending > 0) parts.push(`${stillPending} na fila`)
        if (failedNow > 0) parts.push(`${failedNow} com falha`)
        const message =
            stillPending > 0
                ? `${parts.join(', ')} de ${queued} — o restante sai em instantes.`
                : failedNow > 0
                    ? `${parts.join(', ')} de ${queued}.`
                    : `Enviado: ${sentNow} de ${queued}.`

        return NextResponse.json({
            success: true,
            message,
            stats: {
                total: recipientList.length,
                sent: sentNow,
                failed: failedNow,
                pending: stillPending,
                queued,
            },
            campaignId,
        })
    } catch (error) {
        console.error('Send email error:', error)
        return NextResponse.json(
            { error: 'Erro ao enviar e-mails' },
            { status: 500 }
        )
    }
}
