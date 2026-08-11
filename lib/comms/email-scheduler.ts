// ────────────────────────────────────────────────────────────────────────────
// Execução dos agendamentos de e-mail.
//
// Separado de `email-schedules.ts` (que só cuida do armazenamento e do cálculo
// de horários) para que tanto o cron externo quanto o botão "Executar agora"
// do painel passem exatamente pelo mesmo caminho.
// ────────────────────────────────────────────────────────────────────────────

import {
    claimDueSchedules,
    recordScheduleRun,
} from './email-schedules'
import type { EmailSchedule } from './email-schedules'
import { createAndEnqueueCampaign, resolveRecipients } from './email-campaigns'

export interface ScheduleRunResult {
    scheduleId: string
    name: string
    status: 'ok' | 'empty' | 'error'
    recipients: number
    campaignId?: string
    error?: string
}

/**
 * Roda UM agendamento: resolve destinatários agora (a base pode ter mudado
 * desde que o agendamento foi criado), cria a campanha e enfileira.
 *
 * Não envia aqui — quem envia é o drain da fila, chamado logo depois pelo
 * scheduler. Assim um agendamento com muitos destinatários não corre o risco
 * de estourar o tempo da função no meio do enfileiramento.
 */
export async function runSchedule(schedule: EmailSchedule): Promise<ScheduleRunResult> {
    const scheduleId = schedule._id?.toString() || ''
    const base: ScheduleRunResult = {
        scheduleId,
        name: schedule.name,
        status: 'ok',
        recipients: 0,
    }

    try {
        const recipients = await resolveRecipients(schedule.recipients || {})
        if (recipients.length === 0) {
            await recordScheduleRun(schedule._id, { status: 'empty', recipientCount: 0 })
            return { ...base, status: 'empty' }
        }

        const { campaignId } = await createAndEnqueueCampaign({
            recipients,
            content: {
                subject: schedule.subject,
                content: schedule.content,
                previewText: schedule.previewText,
            },
            name: schedule.name,
            source: 'schedule',
            scheduleId,
            createdBy: schedule.createdBy,
        })

        await recordScheduleRun(schedule._id, {
            status: 'ok',
            campaignId,
            recipientCount: recipients.length,
        })
        return { ...base, status: 'ok', recipients: recipients.length, campaignId }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await recordScheduleRun(schedule._id, { status: 'error', error: message })
        return { ...base, status: 'error', error: message }
    }
}

/**
 * Roda todos os agendamentos vencidos. O claim é atômico, então é seguro
 * chamar de vários lugares (cron externo + painel) ao mesmo tempo.
 */
export async function runDueSchedules(now: Date = new Date()): Promise<ScheduleRunResult[]> {
    const due = await claimDueSchedules(now)
    const results: ScheduleRunResult[] = []
    for (const schedule of due) {
        results.push(await runSchedule(schedule))
    }
    return results
}
