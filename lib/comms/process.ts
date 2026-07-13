// ────────────────────────────────────────────────────────────────────────────
// Núcleo do processamento da fila — extraído do cron para ser reaproveitado
// tanto pelo worker agendado (app/api/cron/comms-dispatcher) quanto por
// disparo imediato sob demanda (app/api/admin/social-media/dispatch-now, e o
// próprio endpoint de envio, que processa uma leva na hora após enfileirar).
//
// Por que isso importa: no plano Hobby da Vercel o Cron só roda 1x/dia, então
// depender só dele deixa toda mensagem "pending" por até 24h. Processar aqui,
// de forma síncrona logo após enfileirar, é o que faz o envio parecer
// instantâneo mesmo sem o ticker externo (scripts/comms-ticker.js) rodando.
// ────────────────────────────────────────────────────────────────────────────

import { claimBatch, markSent, markFailed } from './outbox'
import { takeToken } from './rate-limit'
import { getAdapter, registeredChannels } from './registry'
import { recordHistory } from './history'
import { PermanentSendError } from './types'
import type { CommChannel } from './types'

export interface ChannelProcessResult {
    channel: CommChannel
    sent: number
    failed: number
    dead: number
    throttled: number
}

// Quantas mensagens no máximo processar por canal por chamada. Mantido baixo
// para caber no maxDuration da função serverless (Hobby: até 60s).
const BATCH_PER_CHANNEL = Number(process.env.COMMS_BATCH_PER_CHANNEL) || 40

/** Processa (envia de fato) até `limit` mensagens pendentes de UM canal. */
export async function processChannel(
    channel: CommChannel,
    limit = BATCH_PER_CHANNEL,
): Promise<ChannelProcessResult> {
    const adapter = getAdapter(channel)
    const result: ChannelProcessResult = { channel, sent: 0, failed: 0, dead: 0, throttled: 0 }
    if (!adapter) return result

    const batch = await claimBatch(channel, limit)

    for (const msg of batch) {
        // Respeita o ritmo do provedor. Sem token: devolve à fila (status volta a
        // ser elegível assim que o lease expirar).
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

/** Processa todos os canais registrados uma vez. */
export async function processAllChannels(limitPerChannel = BATCH_PER_CHANNEL): Promise<ChannelProcessResult[]> {
    const results: ChannelProcessResult[] = []
    for (const channel of registeredChannels()) {
        results.push(await processChannel(channel, limitPerChannel))
    }
    return results
}

/**
 * Drena a fila repetidamente até esvaziar (para o lote atual) ou até estourar
 * o orçamento de tempo — usado para "enviar agora" sem esperar o próximo tick
 * do cron/ticker. Sempre respeita o rate-limit (não acelera além do token
 * bucket configurado); só evita a espera de até 24h do cron do plano Hobby.
 */
export async function drainQueueNow(
    channels: CommChannel[],
    opts: { timeBudgetMs?: number; limitPerChannel?: number } = {},
): Promise<ChannelProcessResult[]> {
    const timeBudgetMs = opts.timeBudgetMs ?? 45_000 // margem sob os 60s do plano Hobby
    const limitPerChannel = opts.limitPerChannel ?? BATCH_PER_CHANNEL
    const startedAt = Date.now()
    const totals = new Map<CommChannel, ChannelProcessResult>()

    for (const channel of channels) {
        totals.set(channel, { channel, sent: 0, failed: 0, dead: 0, throttled: 0 })
    }

    // Repete em rodadas curtas até não sobrar nada elegível ou o tempo acabar.
    while (Date.now() - startedAt < timeBudgetMs) {
        let anyProcessed = false
        for (const channel of channels) {
            const round = await processChannel(channel, limitPerChannel)
            const acc = totals.get(channel)!
            acc.sent += round.sent
            acc.failed += round.failed
            acc.dead += round.dead
            acc.throttled += round.throttled
            if (round.sent + round.failed + round.dead + round.throttled > 0) anyProcessed = true
        }
        if (!anyProcessed) break // fila (deste lote) esvaziada
    }

    return Array.from(totals.values())
}
