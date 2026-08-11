// ────────────────────────────────────────────────────────────────────────────
// Fila persistente (transactional outbox) sobre MongoDB.
//
// Escolha de design: Vercel é serverless (sem processo persistente), então em
// vez de Redis/BullMQ usamos uma coleção MongoDB como fila E log de auditoria.
// O worker (cron) reserva mensagens com `findOneAndUpdate` atômico + lease, o
// que garante que dois ticks de cron sobrepostos não processem a mesma mensagem.
// ────────────────────────────────────────────────────────────────────────────

import { getDb } from '@/lib/mongodb'
import type { Collection } from 'mongodb'
import type {
    OutboxMessage,
    OutboxTarget,
    CommChannel,
    ConsentSnapshot,
} from './types'

export const OUTBOX_COLLECTION = 'outbox_messages'

// Parâmetros de retry/backoff.
export const DEFAULT_MAX_ATTEMPTS = 5
const BACKOFF_BASE_MS = 30_000        // 30s
const BACKOFF_CAP_MS = 6 * 60 * 60_000 // 6h
const LEASE_MS = 2 * 60_000           // uma mensagem reservada expira em 2min

let indexesEnsured = false

async function collection(): Promise<Collection<OutboxMessage>> {
    const db = await getDb()
    const col = db.collection<OutboxMessage>(OUTBOX_COLLECTION)
    if (!indexesEnsured) {
        // Índice do dispatcher: buscar pendentes elegíveis por data.
        await col.createIndex({ status: 1, nextAttemptAt: 1 })
        await col.createIndex({ 'to.userId': 1 })
        await col.createIndex({ 'to.leadUuid': 1 })
        await col.createIndex({ providerMessageId: 1 })
        await col.createIndex({ campaignId: 1 })
        // Idempotência: impede enfileirar duas vezes o mesmo conteúdo p/ o mesmo alvo.
        await col.createIndex(
            { idempotencyKey: 1 },
            { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
        )
        indexesEnsured = true
    }
    return col
}

/** Calcula o próximo horário de tentativa com backoff exponencial + jitter. */
export function computeNextAttempt(attempts: number, now = Date.now()): Date {
    const exp = Math.min(BACKOFF_BASE_MS * 2 ** attempts, BACKOFF_CAP_MS)
    const jitter = Math.floor(Math.random() * (exp * 0.2)) // até +20%
    return new Date(now + exp + jitter)
}

export interface EnqueueInput {
    channel: CommChannel
    to: OutboxTarget
    templateKey: string
    payload?: Record<string, unknown>
    campaignId?: string
    sequenceId?: string
    consentSnapshot?: ConsentSnapshot
    maxAttempts?: number
    /** Enviar imediatamente (default) ou agendar para o futuro. */
    scheduledAt?: Date
    /** Chave de idempotência opcional (envios duplicados são ignorados). */
    idempotencyKey?: string
}

/**
 * Enfileira UMA mensagem. Retorna o id ou null quando ignorada por idempotência.
 */
export async function enqueue(input: EnqueueInput): Promise<string | null> {
    const col = await collection()
    const now = new Date()
    const doc: OutboxMessage = {
        channel: input.channel,
        status: 'pending',
        to: input.to,
        templateKey: input.templateKey,
        payload: input.payload || {},
        attempts: 0,
        maxAttempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
        nextAttemptAt: input.scheduledAt || now,
        campaignId: input.campaignId,
        sequenceId: input.sequenceId,
        consentSnapshot: input.consentSnapshot,
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
    }
    try {
        const res = await col.insertOne(doc)
        return res.insertedId.toString()
    } catch (err) {
        // 11000 = duplicate key (idempotencyKey já enfileirado): ignorar silenciosamente.
        if ((err as { code?: number }).code === 11000) return null
        throw err
    }
}

/** Enfileira várias mensagens de uma vez (ordered:false p/ tolerar duplicatas). */
export async function enqueueMany(inputs: EnqueueInput[]): Promise<number> {
    if (inputs.length === 0) return 0
    const col = await collection()
    const now = new Date()
    const docs: OutboxMessage[] = inputs.map((input) => ({
        channel: input.channel,
        status: 'pending',
        to: input.to,
        templateKey: input.templateKey,
        payload: input.payload || {},
        attempts: 0,
        maxAttempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
        nextAttemptAt: input.scheduledAt || now,
        campaignId: input.campaignId,
        sequenceId: input.sequenceId,
        consentSnapshot: input.consentSnapshot,
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
    }))
    try {
        const res = await col.insertMany(docs, { ordered: false })
        return res.insertedCount
    } catch (err) {
        // Com ordered:false, duplicatas de idempotência não impedem os demais inserts.
        const e = err as { code?: number; result?: { insertedCount?: number } }
        if (e.code === 11000) return e.result?.insertedCount ?? 0
        throw err
    }
}

/**
 * Reserva atomicamente até `limit` mensagens elegíveis de um canal.
 * O `findOneAndUpdate` garante que só um worker pega cada mensagem.
 */
export async function claimBatch(
    channel: CommChannel,
    limit: number,
): Promise<OutboxMessage[]> {
    const col = await collection()
    const now = new Date()
    const claimed: OutboxMessage[] = []

    for (let i = 0; i < limit; i++) {
        const res = await col.findOneAndUpdate(
            {
                channel,
                nextAttemptAt: { $lte: now },
                $or: [
                    { status: 'pending' },
                    { status: 'failed' },
                    // Reivindica de volta mensagens cujo lease expirou (worker morreu).
                    { status: 'processing', leaseUntil: { $lte: now } },
                ],
            },
            {
                $set: {
                    status: 'processing',
                    leaseUntil: new Date(now.getTime() + LEASE_MS),
                    updatedAt: now,
                },
            },
            { sort: { nextAttemptAt: 1 }, returnDocument: 'after' },
        )
        // Compat: driver v6 retorna o doc direto; versões antigas embrulham em { value }.
        const message = ((res as { value?: OutboxMessage } | null)?.value ||
            res) as OutboxMessage | null
        if (!message) break
        claimed.push(message)
    }
    return claimed
}

/** Marca uma mensagem como enviada com sucesso. */
export async function markSent(
    id: OutboxMessage['_id'],
    providerMessageId?: string,
): Promise<void> {
    const col = await collection()
    const now = new Date()
    await col.updateOne(
        { _id: id },
        {
            $set: {
                status: 'sent',
                providerMessageId,
                sentAt: now,
                updatedAt: now,
                lastError: undefined,
            },
            $unset: { leaseUntil: '' },
        },
    )
}

/**
 * Registra uma falha. Se ainda houver tentativas, reagenda com backoff;
 * caso contrário (ou se `permanent`), move para dead-letter.
 */
export async function markFailed(
    msg: OutboxMessage,
    error: string,
    permanent = false,
): Promise<void> {
    const col = await collection()
    const now = new Date()
    const attempts = msg.attempts + 1
    const exhausted = permanent || attempts >= msg.maxAttempts

    await col.updateOne(
        { _id: msg._id },
        {
            $set: {
                status: exhausted ? 'dead' : 'failed',
                attempts,
                lastError: error.slice(0, 1000),
                nextAttemptAt: exhausted ? now : computeNextAttempt(attempts, now.getTime()),
                updatedAt: now,
            },
            $unset: { leaseUntil: '' },
        },
    )
}

/**
 * Devolve uma mensagem reservada para a fila SEM contar como tentativa/falha.
 * Usado quando o worker para por orçamento de tempo ou por rate-limit (não por
 * erro de envio): a mensagem volta a ser elegível sem backoff nem consumir uma
 * das `maxAttempts` — senão lotes grandes esvaziariam as tentativas só por
 * timeout/throttle e cairiam em dead-letter sem nunca terem sido enviados.
 *
 * `delayMs` adia a reelegibilidade. É o que evita o worker ficar em loop
 * apertado reivindicando e devolvendo a mesma mensagem enquanto o token bucket
 * está vazio.
 */
export async function releaseClaim(
    id: OutboxMessage['_id'],
    delayMs = 0,
): Promise<void> {
    const col = await collection()
    const now = new Date()
    await col.updateOne(
        { _id: id },
        {
            $set: {
                status: 'pending',
                nextAttemptAt: new Date(now.getTime() + delayMs),
                updatedAt: now,
            },
            $unset: { leaseUntil: '' },
        },
    )
}

/** Marca como ignorada (ex.: sem consentimento no canal). */
export async function markSkipped(
    id: OutboxMessage['_id'],
    reason: string,
): Promise<void> {
    const col = await collection()
    const now = new Date()
    await col.updateOne(
        { _id: id },
        { $set: { status: 'skipped', lastError: reason, updatedAt: now }, $unset: { leaseUntil: '' } },
    )
}

/** Estatísticas agregadas por status (para painel de auditoria). */
export async function statsByStatus(
    filter: Partial<Pick<OutboxMessage, 'channel' | 'campaignId'>> = {},
): Promise<Record<string, number>> {
    const col = await collection()
    const rows = await col
        .aggregate<{ _id: string; count: number }>([
            { $match: filter },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .toArray()
    return Object.fromEntries(rows.map((r) => [r._id, r.count]))
}
