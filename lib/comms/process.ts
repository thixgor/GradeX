// ────────────────────────────────────────────────────────────────────────────
// Núcleo do processamento da fila — extraído do cron para ser reaproveitado
// tanto pelos workers agendados (app/api/cron/comms-dispatcher e
// app/api/cron/email-scheduler) quanto pelo disparo imediato sob demanda (o
// próprio endpoint de envio processa uma leva na hora após enfileirar).
//
// Por que isso importa: no plano Hobby da Vercel o Cron só roda 1x/dia, então
// depender só dele deixa toda mensagem "pending" por até 24h. Processar aqui,
// de forma síncrona logo após enfileirar, é o que faz o envio parecer
// instantâneo mesmo sem o ticker externo (scripts/comms-ticker.js) rodando.
// ────────────────────────────────────────────────────────────────────────────

import { claimBatch, markSent, markFailed, releaseClaim } from './outbox'
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

// Quanto adiar uma mensagem devolvida à fila por falta de token de rate-limit.
// Curto o bastante para o envio seguir fluido, longo o bastante para o worker
// não ficar girando em falso enquanto o bucket reabastece.
const THROTTLE_RETRY_MS = 1_000

/** Processa (envia de fato) até `limit` mensagens pendentes de UM canal. */
export async function processChannel(
    channel: CommChannel,
    limit = BATCH_PER_CHANNEL,
    // Instante (Date.now()) a partir do qual paramos de enviar mesmo com itens
    // no lote. Garante que UM lote longo (envios sequenciais sob rate-limit, ou
    // um SMTP lento) não estoure o maxDuration da função serverless — o que faz
    // o gateway responder 504/texto em vez do JSON esperado.
    deadline?: number,
): Promise<ChannelProcessResult> {
    const adapter = getAdapter(channel)
    const result: ChannelProcessResult = { channel, sent: 0, failed: 0, dead: 0, throttled: 0 }
    if (!adapter) return result

    const batch = await claimBatch(channel, limit)

    // Uma vez que o bucket esvazia, o resto do lote é devolvido direto: não vale
    // consultar o token para cada um sabendo que não há.
    let outOfTokens = false

    for (const msg of batch) {
        // Estourou o orçamento de tempo: devolve o restante do lote para a fila
        // sem contar como tentativa/falha (não foi erro de envio, só não deu
        // tempo). Volta a ser elegível já no próximo tick/drain.
        if (deadline && Date.now() >= deadline) {
            await releaseClaim(msg._id)
            continue
        }

        // Respeita o ritmo do provedor. Sem token, a mensagem volta para a fila
        // SEM contar tentativa: ficar sem token não é falha de envio. (Antes isso
        // chamava `markFailed`, então uma campanha grande gastava as 5 tentativas
        // só esperando o bucket encher e ia parar em dead-letter sem nunca ter
        // sido tentada de verdade.) O atraso curto evita o worker girar em falso
        // enquanto o bucket reabastece.
        if (!outOfTokens && !(await takeToken(channel))) outOfTokens = true
        if (outOfTokens) {
            await releaseClaim(msg._id, THROTTLE_RETRY_MS)
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
    const deadline = startedAt + timeBudgetMs
    const totals = new Map<CommChannel, ChannelProcessResult>()

    for (const channel of channels) {
        totals.set(channel, { channel, sent: 0, failed: 0, dead: 0, throttled: 0 })
    }

    // Repete em rodadas curtas até não sobrar nada elegível ou o tempo acabar.
    let wasThrottled = false
    while (Date.now() < deadline) {
        let progressed = false
        let throttledNow = false
        for (const channel of channels) {
            // Passa o deadline: o envio para no meio do lote se o tempo acabar,
            // em vez de só verificar entre rodadas (um lote de 40 envios a 3/seg
            // já leva ~13s e poderia furar o orçamento sozinho).
            const round = await processChannel(channel, limitPerChannel, deadline)
            const acc = totals.get(channel)!
            acc.sent += round.sent
            acc.failed += round.failed
            acc.dead += round.dead
            acc.throttled += round.throttled
            if (round.sent + round.failed + round.dead > 0) progressed = true
            if (round.throttled > 0) throttledNow = true
        }

        if (progressed) {
            wasThrottled = throttledNow
            continue
        }

        // Nada saiu nesta rodada. Se foi por rate-limit (agora ou na rodada
        // anterior), as mensagens devolvidas voltam a ficar elegíveis em ~1s:
        // vale esperar em vez de encerrar o drain com a fila cheia.
        if (throttledNow || wasThrottled) {
            wasThrottled = false
            if (Date.now() + THROTTLE_RETRY_MS >= deadline) break
            await sleep(THROTTLE_RETRY_MS)
            continue
        }

        break // fila esvaziada
    }

    return Array.from(totals.values())
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
