import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { sendMarketingEmail, type EmailRecipients } from '@/lib/email-marketing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Processa os e-mails agendados cujo horário já chegou.
 *
 * Deve ser chamado periodicamente. No plano Vercel Hobby o Vercel Cron roda
 * apenas 1x/dia, então a precisão de minutos vem de um disparador externo
 * gratuito (ex.: GitHub Actions em .github/workflows/scheduled-emails.yml)
 * batendo neste endpoint a cada poucos minutos.
 *
 * Autenticação: header `x-vercel-cron` (Vercel Cron) OU
 * `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const collection = db.collection('scheduledEmails')
    const now = new Date()

    // Limita quantos agendamentos processamos por execução para respeitar o
    // tempo máximo da função. Os demais serão pegos na próxima execução.
    const MAX_PER_RUN = 5
    const stats = { processed: 0, sent: 0, failed: 0, jobs: [] as any[] }

    for (let i = 0; i < MAX_PER_RUN; i++) {
        // Reivindica atomicamente o próximo agendado vencido (evita envio duplo
        // caso duas execuções de cron se sobreponham).
        const claim = await collection.findOneAndUpdate(
            { status: 'scheduled', scheduledAt: { $lte: now } },
            { $set: { status: 'processing', processingStartedAt: new Date() } },
            { sort: { scheduledAt: 1 }, returnDocument: 'after' }
        )
        const job = (claim?.value || claim) as any
        if (!job) break

        stats.processed++

        try {
            const result = await sendMarketingEmail({
                recipients: (job.recipients || {}) as EmailRecipients,
                subject: job.subject,
                content: job.content,
                previewText: job.previewText,
            })

            stats.sent += result.sent
            stats.failed += result.failed

            await collection.updateOne(
                { _id: job._id },
                {
                    $set: {
                        status: result.total === 0 ? 'failed' : 'sent',
                        sentAt: new Date(),
                        stats: { total: result.total, sent: result.sent, failed: result.failed },
                        errors: result.errors ? result.errors.slice(0, 20) : undefined,
                        updatedAt: new Date(),
                    },
                }
            )
            stats.jobs.push({ id: String(job._id), status: result.total === 0 ? 'failed' : 'sent', sent: result.sent, failed: result.failed })
        } catch (err) {
            const error = err as Error
            await collection.updateOne(
                { _id: job._id },
                {
                    $set: {
                        status: 'failed',
                        errors: [error.message],
                        updatedAt: new Date(),
                    },
                }
            )
            stats.jobs.push({ id: String(job._id), status: 'failed', error: error.message })
        }
    }

    return NextResponse.json({ ok: true, ...stats })
}

function isAuthorized(request: NextRequest): boolean {
    if (request.headers.get('x-vercel-cron')) return true
    const auth = request.headers.get('authorization') || ''
    const expected = `Bearer ${process.env.CRON_SECRET || ''}`
    return !!process.env.CRON_SECRET && auth === expected
}
