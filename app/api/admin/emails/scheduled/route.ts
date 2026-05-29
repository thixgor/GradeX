import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import type { EmailRecipients } from '@/lib/email-marketing'

export const dynamic = 'force-dynamic'

interface ScheduledEmailPayload {
    subject?: string
    content?: string
    previewText?: string
    recipients?: EmailRecipients
    recipientCount?: number
    scheduledAt?: string
    // Estado do construtor para permitir edição posterior
    blocks?: unknown
    attachmentType?: string
    selectedMaterialId?: string
    selectedFlashcardId?: string
    customLinkUrl?: string
    customLinkTitle?: string
    customLinkDescription?: string
    attachmentCtaText?: string
    selectedTemplateId?: string
}

function sanitizeRecipients(recipients?: EmailRecipients): EmailRecipients {
    return {
        selectAll: !!recipients?.selectAll,
        userIds: Array.isArray(recipients?.userIds) ? recipients!.userIds!.map(String) : [],
        additionalEmails: Array.isArray(recipients?.additionalEmails)
            ? recipients!.additionalEmails!.map(String)
            : [],
    }
}

function hasRecipients(recipients: EmailRecipients): boolean {
    return (
        !!recipients.selectAll ||
        (recipients.userIds?.length || 0) > 0 ||
        (recipients.additionalEmails?.length || 0) > 0
    )
}

export async function GET() {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const db = await getDb()
        const items = await db
            .collection('scheduledEmails')
            .find({})
            .sort({ scheduledAt: -1 })
            .limit(200)
            .toArray()

        return NextResponse.json({
            scheduled: items.map(item => ({
                ...item,
                _id: item._id.toString(),
                createdBy: item.createdBy ? String(item.createdBy) : undefined,
            })),
        })
    } catch (error) {
        console.error('List scheduled emails error:', error)
        return NextResponse.json({ error: 'Erro ao listar e-mails agendados' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body: ScheduledEmailPayload = await request.json()

        if (!body.subject || !body.content) {
            return NextResponse.json(
                { error: 'Assunto e conteúdo são obrigatórios' },
                { status: 400 }
            )
        }

        const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
        if (!scheduledAt || isNaN(scheduledAt.getTime())) {
            return NextResponse.json({ error: 'Data de agendamento inválida' }, { status: 400 })
        }
        if (scheduledAt.getTime() < Date.now() - 60_000) {
            return NextResponse.json(
                { error: 'A data de agendamento deve ser no futuro' },
                { status: 400 }
            )
        }

        const recipients = sanitizeRecipients(body.recipients)
        if (!hasRecipients(recipients)) {
            return NextResponse.json(
                { error: 'Selecione pelo menos um destinatário' },
                { status: 400 }
            )
        }

        const now = new Date()
        const doc = {
            subject: body.subject,
            content: body.content,
            previewText: body.previewText || '',
            recipients,
            recipientCount: typeof body.recipientCount === 'number' ? body.recipientCount : undefined,
            scheduledAt,
            status: 'scheduled' as const,
            // Estado do construtor (para edição posterior)
            blocks: Array.isArray(body.blocks) ? body.blocks : [],
            attachmentType: body.attachmentType || 'none',
            selectedMaterialId: body.selectedMaterialId || '',
            selectedFlashcardId: body.selectedFlashcardId || '',
            customLinkUrl: body.customLinkUrl || '',
            customLinkTitle: body.customLinkTitle || '',
            customLinkDescription: body.customLinkDescription || '',
            attachmentCtaText: body.attachmentCtaText || '',
            selectedTemplateId: body.selectedTemplateId || '',
            createdAt: now,
            createdBy: session.userId,
            createdByName: session.name || '',
            updatedAt: now,
            updatedBy: session.userId,
        }

        const db = await getDb()
        const inserted = await db.collection('scheduledEmails').insertOne(doc)

        return NextResponse.json({
            scheduled: { ...doc, _id: inserted.insertedId.toString() },
        })
    } catch (error) {
        console.error('Create scheduled email error:', error)
        return NextResponse.json({ error: 'Erro ao agendar e-mail' }, { status: 500 })
    }
}
