import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { drainQueueNow } from '@/lib/comms/process'
import {
    createAndEnqueueCampaign,
    getCampaignProgress,
    resolveRecipients,
} from '@/lib/comms/email-campaigns'
import type { RecipientSpec } from '@/lib/comms/email-campaigns'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

interface EmailPayload {
    recipients: RecipientSpec
    subject: string
    content: string
    previewText?: string
    /** Nome da campanha no histórico (default: o assunto). */
    name?: string
}

// Quanto tempo gastamos tentando enviar dentro da própria requisição. O resto
// da fila fica pendente e sai no próximo tick do cron. Folga sob o maxDuration
// de 60s para sobrar tempo de montar a resposta — é justamente o que faltava
// antes, quando o handler enviava tudo em linha e o gateway devolvia 504 com
// corpo em HTML (que o front não conseguia ler como JSON).
const DRAIN_BUDGET_MS = 35_000

/**
 * Disparo de campanha por e-mail.
 *
 * Fluxo: resolve os destinatários → grava a campanha → enfileira uma mensagem
 * por pessoa na outbox → drena o que couber no orçamento de tempo → responde
 * com o estado REAL por destinatário.
 *
 * A resposta sempre traz `campaignId` e a lista de quem entrou na campanha, de
 * modo que a UI possa continuar acompanhando (polling em
 * `/api/admin/emails/campaigns/[campaignId]`) mesmo quando a fila não esvazia
 * dentro da requisição. Nada é perdido: o que fica pendente tem retry, backoff
 * e registro de erro por destinatário.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body: EmailPayload = await request.json()
        const { recipients, subject, content, previewText } = body

        if (!subject?.trim() || !content?.trim()) {
            return NextResponse.json(
                { error: 'Assunto e conteúdo são obrigatórios' },
                { status: 400 },
            )
        }

        const recipientList = await resolveRecipients(recipients || {})
        if (recipientList.length === 0) {
            return NextResponse.json(
                { error: 'Nenhum destinatário válido encontrado' },
                { status: 400 },
            )
        }

        const { campaignId } = await createAndEnqueueCampaign({
            recipients: recipientList,
            content: { subject, content, previewText },
            name: body.name,
            source: 'manual',
            createdBy: session.userId,
        })

        // Envia o que der dentro do orçamento; o restante fica na fila.
        await drainQueueNow(['email'], { timeBudgetMs: DRAIN_BUDGET_MS })

        const progress = await getCampaignProgress(campaignId)
        const stats = progress?.stats ?? {
            total: recipientList.length,
            sent: 0,
            pending: recipientList.length,
            failed: 0,
            dead: 0,
            skipped: 0,
        }

        const errors = (progress?.recipients ?? [])
            .filter(r => r.status === 'dead' || (r.status === 'failed' && r.error))
            .slice(0, 20)
            .map(r => `${r.email}: ${r.error || 'falha desconhecida'}`)

        return NextResponse.json({
            success: true,
            campaignId,
            message: buildMessage(stats),
            stats,
            done: progress?.done ?? false,
            recipients: progress?.recipients ?? recipientList.map(r => ({
                email: r.email,
                name: r.name,
                status: 'pending' as const,
                attempts: 0,
            })),
            errors,
        })
    } catch (error) {
        console.error('Send email error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro ao enviar e-mails' },
            { status: 500 },
        )
    }
}

function buildMessage(stats: {
    total: number
    sent: number
    pending: number
    dead: number
    skipped: number
}): string {
    const parts: string[] = []
    parts.push(`${stats.sent} de ${stats.total} enviado${stats.sent === 1 ? '' : 's'}`)
    if (stats.pending > 0) parts.push(`${stats.pending} na fila (continua em segundo plano)`)
    if (stats.dead > 0) parts.push(`${stats.dead} com falha definitiva`)
    if (stats.skipped > 0) parts.push(`${stats.skipped} ignorado(s)`)
    return parts.join(' · ')
}
