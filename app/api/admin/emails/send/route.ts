import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { User } from '@/lib/types'
import { dispatchBulk } from '@/lib/comms/dispatch'
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
 * os erros de "auth limit" (~67 falhas). Agora ela apenas ENFILEIRA na outbox
 * (lib/comms); o cron `comms-dispatcher` envia de forma assíncrona, com
 * rate-limit, retry/backoff e log por destinatário. A resposta é imediata.
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

        return NextResponse.json({
            success: true,
            message: `${queued} e-mail(s) enfileirado(s). O envio ocorre em segundo plano.`,
            stats: {
                total: recipientList.length,
                sent: 0,
                failed: 0,
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
