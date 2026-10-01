import { NextRequest, NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { runDueSchedules } from '@/lib/comms/email-scheduler'
import { drainQueueNow } from '@/lib/comms/process'
import { hasEligibleMessages } from '@/lib/comms/outbox'

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
 * 5 minutos — ver docs/EMAIL_AGENDAMENTO_CRONJOB.md. De minuto em minuto são
 * 1.440 invocações por dia para, quase sempre, não achar nada; a cada 5 são
 * 288, e um agendamento sai no máximo 5 minutos depois da hora marcada.
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
    // Quase todo tick é vazio: nada vencido, nada na fila. As duas perguntas
    // saem juntas, e o drain só roda se houver o que drenar — o tick vazio
    // custa uma espera ao banco em vez de duas em fila.
    const [schedules, hasQueued] = await Promise.all([
        runDueSchedules(),
        hasEligibleMessages('email'),
    ])
    const delivery = schedules.length > 0 || hasQueued
        ? await drainQueueNow(['email'], { timeBudgetMs: DRAIN_BUDGET_MS })
        : []

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
