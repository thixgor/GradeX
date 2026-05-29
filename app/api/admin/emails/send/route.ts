import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sendMarketingEmail, type EmailRecipients } from '@/lib/email-marketing'

export const dynamic = 'force-dynamic'

interface EmailPayload {
    recipients: EmailRecipients
    subject: string
    content: string
    previewText?: string
}

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

        const stats = await sendMarketingEmail({ recipients, subject, content, previewText })

        if (stats.total === 0) {
            return NextResponse.json(
                { error: 'Nenhum destinatário válido encontrado' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `E-mails enviados: ${stats.sent} de ${stats.total}`,
            stats: {
                total: stats.total,
                sent: stats.sent,
                failed: stats.failed,
            },
            errors: stats.errors ? stats.errors.slice(0, 10) : undefined,
        })
    } catch (error) {
        console.error('Send email error:', error)
        return NextResponse.json(
            { error: 'Erro ao enviar e-mails' },
            { status: 500 }
        )
    }
}
