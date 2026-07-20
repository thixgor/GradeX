import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { User } from '@/lib/types'
import { transporter } from '@/lib/mail'
import { getMarketingEmailTemplate, personalize } from '@/lib/comms/email-render'

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

const FROM = process.env.SMTP_FROM || '"DomineAqui" <no-reply@domineaqui.com.br>'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Disparo de campanha por e-mail — envio DIRETO, sem fila.
 *
 * O transporter (lib/mail) é pooled e com rate-limit (poucas conexões,
 * ~3 msg/seg), então mandar direto daqui NÃO estoura o "auth limit" da
 * Hostinger — o próprio pool serializa e segura o ritmo. Sem outbox, sem
 * cron, sem "na fila": clicou, mandou, e a resposta já traz o resultado real
 * (quantos foram e quantos falharam). Ideal para os envios do dia a dia
 * (dezenas de destinatários), que cabem folgado no tempo da função.
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
                .filter(email => EMAIL_RE.test(email))
                .map(email => ({ email, name: '' }))
            recipientList = [...recipientList, ...validExtras]
        }

        // Remover duplicatas e endereços inválidos
        const seen = new Set<string>()
        recipientList = recipientList.filter(r => {
            if (!r.email || !EMAIL_RE.test(r.email)) return false
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

        // Envia DIRETO pelo transporter pooled. O pool respeita o rate-limit e o
        // número de conexões configurados em lib/mail, então disparar tudo de uma
        // vez aqui não gera rajada — as mensagens saem no ritmo seguro do SMTP.
        const results = await Promise.allSettled(
            recipientList.map(async (r) => {
                const html = personalize(
                    getMarketingEmailTemplate(content, previewText),
                    r.name,
                )
                await transporter.sendMail({
                    from: FROM,
                    to: r.email,
                    subject: personalize(subject, r.name),
                    html,
                })
            })
        )

        const failures: { email: string; error: string }[] = []
        results.forEach((res, i) => {
            if (res.status === 'rejected') {
                const reason = res.reason
                failures.push({
                    email: recipientList[i].email,
                    error: reason instanceof Error ? reason.message : String(reason),
                })
            }
        })

        const total = recipientList.length
        const failed = failures.length
        const sent = total - failed

        return NextResponse.json({
            success: true,
            message:
                failed > 0
                    ? `Enviado para ${sent} de ${total}. ${failed} falhou${failed > 1 ? 'ram' : ''}.`
                    : `Enviado para ${sent} ${sent > 1 ? 'pessoas' : 'pessoa'}. ✅`,
            stats: { total, sent, failed },
            errors: failures.slice(0, 20).map(f => `${f.email}: ${f.error}`),
        })
    } catch (error) {
        console.error('Send email error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro ao enviar e-mails' },
            { status: 500 }
        )
    }
}
