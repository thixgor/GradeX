import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import type { EmailRecipients } from '@/lib/email-marketing'

export const dynamic = 'force-dynamic'

interface ScheduledEmailUpdate {
    subject?: string
    content?: string
    previewText?: string
    recipients?: EmailRecipients
    recipientCount?: number
    scheduledAt?: string
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

// PUT - Editar um e-mail agendado (conteúdo, destinatários, horário)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        if (!ObjectId.isValid(params.id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const db = await getDb()
        const collection = db.collection('scheduledEmails')
        const existing = await collection.findOne({ _id: new ObjectId(params.id) })

        if (!existing) {
            return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
        }
        if (existing.status !== 'scheduled') {
            return NextResponse.json(
                { error: 'Apenas e-mails ainda agendados podem ser editados' },
                { status: 409 }
            )
        }

        const body: ScheduledEmailUpdate = await request.json()
        const set: Record<string, unknown> = {
            updatedAt: new Date(),
            updatedBy: session.userId,
        }

        if (body.subject !== undefined) {
            if (!body.subject) {
                return NextResponse.json({ error: 'Assunto é obrigatório' }, { status: 400 })
            }
            set.subject = body.subject
        }
        if (body.content !== undefined) {
            if (!body.content) {
                return NextResponse.json({ error: 'Conteúdo é obrigatório' }, { status: 400 })
            }
            set.content = body.content
        }
        if (body.previewText !== undefined) set.previewText = body.previewText

        if (body.scheduledAt !== undefined) {
            const scheduledAt = new Date(body.scheduledAt)
            if (isNaN(scheduledAt.getTime())) {
                return NextResponse.json({ error: 'Data de agendamento inválida' }, { status: 400 })
            }
            if (scheduledAt.getTime() < Date.now() - 60_000) {
                return NextResponse.json(
                    { error: 'A data de agendamento deve ser no futuro' },
                    { status: 400 }
                )
            }
            set.scheduledAt = scheduledAt
        }

        if (body.recipients !== undefined) {
            const recipients = sanitizeRecipients(body.recipients)
            if (!hasRecipients(recipients)) {
                return NextResponse.json(
                    { error: 'Selecione pelo menos um destinatário' },
                    { status: 400 }
                )
            }
            set.recipients = recipients
        }
        if (body.recipientCount !== undefined) set.recipientCount = body.recipientCount

        if (body.blocks !== undefined) set.blocks = Array.isArray(body.blocks) ? body.blocks : []
        if (body.attachmentType !== undefined) set.attachmentType = body.attachmentType
        if (body.selectedMaterialId !== undefined) set.selectedMaterialId = body.selectedMaterialId
        if (body.selectedFlashcardId !== undefined) set.selectedFlashcardId = body.selectedFlashcardId
        if (body.customLinkUrl !== undefined) set.customLinkUrl = body.customLinkUrl
        if (body.customLinkTitle !== undefined) set.customLinkTitle = body.customLinkTitle
        if (body.customLinkDescription !== undefined) set.customLinkDescription = body.customLinkDescription
        if (body.attachmentCtaText !== undefined) set.attachmentCtaText = body.attachmentCtaText
        if (body.selectedTemplateId !== undefined) set.selectedTemplateId = body.selectedTemplateId

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(params.id), status: 'scheduled' },
            { $set: set },
            { returnDocument: 'after' }
        )
        const doc = result?.value || result
        if (!doc) {
            return NextResponse.json(
                { error: 'Não foi possível atualizar (talvez já tenha sido enviado)' },
                { status: 409 }
            )
        }

        return NextResponse.json({
            scheduled: { ...doc, _id: doc._id.toString() },
        })
    } catch (error) {
        console.error('Update scheduled email error:', error)
        return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 })
    }
}

// DELETE - Desagendar / cancelar um e-mail agendado
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        if (!ObjectId.isValid(params.id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const db = await getDb()
        const collection = db.collection('scheduledEmails')
        const existing = await collection.findOne({ _id: new ObjectId(params.id) })

        if (!existing) {
            return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
        }

        // Itens já enviados/falhos viram histórico: removê-los apaga o registro.
        // Itens ainda agendados são removidos (desagendados).
        if (existing.status === 'processing') {
            return NextResponse.json(
                { error: 'Este e-mail já está sendo enviado e não pode ser cancelado' },
                { status: 409 }
            )
        }

        await collection.deleteOne({ _id: new ObjectId(params.id) })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete scheduled email error:', error)
        return NextResponse.json({ error: 'Erro ao cancelar agendamento' }, { status: 500 })
    }
}
