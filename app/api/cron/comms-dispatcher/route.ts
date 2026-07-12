import { NextRequest, NextResponse } from 'next/server'
import { claimBatch, markSent, markFailed } from '@/lib/comms/outbox'
import { takeToken } from '@/lib/comms/rate-limit'
import { getAdapter, registeredChannels } from '@/lib/comms/registry'
import { recordHistory } from '@/lib/comms/history'
import { advanceSequences } from '@/lib/comms/sequences'
import { PermanentSendError } from '@/lib/comms/types'
import type { CommChannel } from '@/lib/comms/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Dispatcher da fila de comunicação multicanal.
 *
 * Acionado pelo Vercel Cron (ver vercel.json). A cada execução:
 *  1. Para cada canal registrado, reserva atomicamente um lote de mensagens
 *     pendentes/reagendadas (claim com lease evita processamento duplo).
 *  2. Respeita o rate-limit de saída (token bucket) por canal.
 *  3. Chama o adapter do canal; em sucesso marca `sent`, em falha reagenda com
 *     backoff exponencial (ou dead-letter ao esgotar as tentativas).
 *
 * É seguro rodar concorrentemente e é idempotente por mensagem.
 *
 * Autenticação: header `x-vercel-cron` (Vercel) ou `Bearer ${CRON_SECRET}`.
 * Também aceita POST manual (mesmo auth) para "drenar" a fila sob demanda.
 */

// Quantas mensagens no máximo processar por canal por invocação. Mantido baixo
// para caber no maxDuration da função; o cron roda com frequência.
const BATCH_PER_CHANNEL = Number(process.env.COMMS_BATCH_PER_CHANNEL) || 40

async function processChannel(channel: CommChannel) {
    const adapter = getAdapter(channel)
    const result = { channel, sent: 0, failed: 0, dead: 0, throttled: 0 }
    if (!adapter) return result

    const batch = await claimBatch(channel, BATCH_PER_CHANNEL)

    for (const msg of batch) {
        // Respeita o ritmo do provedor. Sem token: devolve à fila (status volta a
        // ser elegível no próximo tick, pois o lease expira).
        const allowed = await takeToken(channel)
        if (!allowed) {
            await markFailed(msg, 'rate-limited (aguardando token)', false)
            result.throttled++
            continue
        }

        try {
            const { providerMessageId } = await adapter.send(msg)
            await markSent(msg._id, providerMessageId)
            await recordHistory(msg, 'sent', { providerMessageId })
            result.sent++
        } catch (err) {
            const permanent = err instanceof PermanentSendError
            const message = err instanceof Error ? err.message : String(err)
            await markFailed(msg, message, permanent)
            const dead = permanent || msg.attempts + 1 >= msg.maxAttempts
            if (dead) {
                await recordHistory(msg, 'dead', { error: message })
                result.dead++
            } else {
                result.failed++
            }
        }
    }
    return result
}

async function handle(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // 1) Avança as jornadas/sequências: matrícula devida → enfileira o próximo passo.
    const sequences = await advanceSequences()

    // 2) Drena a fila de cada canal.
    const results = []
    for (const channel of registeredChannels()) {
        results.push(await processChannel(channel))
    }

    return NextResponse.json({ ok: true, at: new Date().toISOString(), sequences, results })
}

export async function GET(request: NextRequest) {
    return handle(request)
}

export async function POST(request: NextRequest) {
    return handle(request)
}

function isAuthorized(request: NextRequest): boolean {
    if (request.headers.get('x-vercel-cron')) return true
    const auth = request.headers.get('authorization') || ''
    const expected = `Bearer ${process.env.CRON_SECRET || ''}`
    return !!process.env.CRON_SECRET && auth === expected
}
