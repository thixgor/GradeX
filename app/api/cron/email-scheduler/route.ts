import { NextRequest, NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { runDueSchedules } from '@/lib/comms/email-scheduler'
import { drainQueueNow } from '@/lib/comms/process'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// Orçamento de envio dentro de um tick. O que não couber fica na fila e sai no
// tick seguinte — por isso vale a pena chamar este endpoint de minuto em minuto.
const DRAIN_BUDGET_MS = 40_000

/**
 * Motor dos e-mails automáticos. Um tick faz duas coisas:
 *
 *  1. Roda os agendamentos vencidos (`email_schedules`): resolve os
 *     destinatários AGORA e enfileira uma campanha.
 *  2. Drena a fila de e-mail — tanto o que os agendamentos acabaram de criar
 *     quanto o que sobrou de envios manuais grandes feitos pelo painel.
 *
 * Por que um cron externo (cron-job.org) e não o Vercel Cron: o plano Hobby
 * limita o cron a 1 execução por dia, o que não serve para agendamento com
 * hora marcada. Configure o cron-job.org para bater neste endpoint a cada
 * minuto (ou a cada 5 min) — ver docs/EMAIL_AGENDAMENTO_CRONJOB.md.
 *
 * Autenticação: `CRON_SECRET` via header `Authorization: Bearer …`,
 * `x-cron-secret`, ou query `?secret=` / `?token=` (o cron-job.org só permite
 * headers no plano pago, então a query também é aceita).
 *
 * Idempotente: agendamentos são reservados atomicamente (o `nextRunAt` já é
 * empurrado no claim) e cada mensagem da fila tem chave de idempotência, então
 * ticks sobrepostos não duplicam envio.
 */
async function handle(request: NextRequest) {
    if (!isCronAuthorized(request)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const startedAt = Date.now()
    const schedules = await runDueSchedules()
    const delivery = await drainQueueNow(['email'], { timeBudgetMs: DRAIN_BUDGET_MS })

    const email = delivery.find(r => r.channel === 'email')

    return NextResponse.json({
        ok: true,
        at: new Date().toISOString(),
        tookMs: Date.now() - startedAt,
        schedulesRun: schedules.length,
        schedules,
        delivery: {
            sent: email?.sent ?? 0,
            failed: email?.failed ?? 0,
            dead: email?.dead ?? 0,
            throttled: email?.throttled ?? 0,
        },
    })
}

export async function GET(request: NextRequest) {
    return handle(request)
}

export async function POST(request: NextRequest) {
    return handle(request)
}
