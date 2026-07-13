import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { getMarketingEmailTemplate, personalize } from '@/lib/comms/email-render'
import { buildPersuasionVars, renderPersuasion } from '@/lib/comms/persuasion'

export const dynamic = 'force-dynamic'

interface PreviewBody {
    subject?: string
    content?: string
    previewText?: string
    whatsappText?: string
    sampleName?: string
    sampleCity?: string
    persuasiveTag?: string
    campaignId?: string
}

/**
 * Renderiza uma prévia fiel do que será enviado — mesmas variáveis de
 * persuasão ({{firstName}}, {{persuasiveTag}}, {{totalStudents}}, ...) e
 * personalização (%nome%) usadas no envio real, aplicadas a um destinatário
 * de exemplo (não dispara nada).
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body: PreviewBody = await request.json()
        const sampleName = body.sampleName?.trim() || 'Maria Estudante'
        const sampleCity = body.sampleCity?.trim() || 'São Paulo'

        let campaignName: string | undefined
        if (body.campaignId && ObjectId.isValid(body.campaignId)) {
            const db = await getDb()
            const campaign = await db.collection('lead_campaigns').findOne({ _id: new ObjectId(body.campaignId) })
            campaignName = campaign?.name
        }

        const vars = await buildPersuasionVars({
            name: sampleName,
            city: sampleCity,
            persuasiveTag: body.persuasiveTag?.trim() || 'aprovação em Clínica Médica',
            campaignId: body.campaignId,
            campaignName,
            authority: 'validado por professores e monitores da área',
        })

        let emailSubject: string | undefined
        let emailHtml: string | undefined
        if (body.content !== undefined) {
            const subject = renderPersuasion(body.subject || '', vars)
            const content = renderPersuasion(body.content || '', vars)
            const previewText = body.previewText ? renderPersuasion(body.previewText, vars) : undefined
            emailSubject = personalize(subject, sampleName, sampleCity)
            emailHtml = personalize(getMarketingEmailTemplate(content, previewText), sampleName, sampleCity)
        }

        let whatsappText: string | undefined
        if (body.whatsappText !== undefined) {
            const firstName = sampleName.split(/\s+/)[0]
            whatsappText = personalize(renderPersuasion(body.whatsappText || '', vars), sampleName, sampleCity)
                .replace(/\{\{\s*nome\s*\}\}/gi, firstName)
                .replace(/\{nome\}/gi, firstName)
        }

        return NextResponse.json({ emailSubject, emailHtml, whatsappText, sampleVars: vars })
    } catch (error) {
        console.error('Social-media preview error:', error)
        return NextResponse.json({ error: 'Erro ao gerar prévia' }, { status: 500 })
    }
}
