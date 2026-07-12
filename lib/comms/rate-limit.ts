// ────────────────────────────────────────────────────────────────────────────
// Rate limiting de saída (token bucket) por canal, persistido no MongoDB.
//
// Objetivo: NÓS controlarmos o ritmo de envio para respeitar o limite do
// provedor (SMTP Hostinger, WhatsApp) em vez de descobrir o limite apanhando
// com erros de "auth limit". Como há vários workers/ticks possíveis, o estado
// do bucket fica no Mongo e é atualizado atomicamente.
// ────────────────────────────────────────────────────────────────────────────

import { getDb } from '@/lib/mongodb'
import type { CommChannel } from './types'

const COLLECTION = 'comms_rate_buckets'

export interface ChannelRate {
    /** Capacidade máxima do bucket (rajada permitida). */
    capacity: number
    /** Tokens repostos por segundo (vazão sustentada). */
    refillPerSec: number
}

// Padrões conservadores. SMTP compartilhado da Hostinger é sensível a rajada,
// então mantemos a vazão baixa por padrão (ajustável por env).
export const CHANNEL_RATES: Record<CommChannel, ChannelRate> = {
    email: {
        capacity: Number(process.env.COMMS_EMAIL_BURST) || 10,
        refillPerSec: Number(process.env.COMMS_EMAIL_PER_SEC) || 2,
    },
    whatsapp: {
        capacity: Number(process.env.COMMS_WA_BURST) || 5,
        refillPerSec: Number(process.env.COMMS_WA_PER_SEC) || 1,
    },
    sms: { capacity: 5, refillPerSec: 1 },
    push: { capacity: 50, refillPerSec: 20 },
}

interface BucketDoc {
    _id: string // = channel
    tokens: number
    updatedAt: Date
}

/**
 * Tenta consumir 1 token do bucket do canal. Retorna true se pôde enviar.
 * Implementa token bucket com reposição baseada no tempo decorrido.
 */
export async function takeToken(channel: CommChannel): Promise<boolean> {
    const rate = CHANNEL_RATES[channel]
    const db = await getDb()
    const col = db.collection<BucketDoc>(COLLECTION)
    const now = new Date()

    const doc = await col.findOne({ _id: channel })

    if (!doc) {
        // Primeiro uso: cria bucket cheio e consome 1.
        await col.updateOne(
            { _id: channel },
            { $setOnInsert: { tokens: rate.capacity - 1, updatedAt: now } },
            { upsert: true },
        )
        return true
    }

    const elapsedSec = Math.max(0, (now.getTime() - doc.updatedAt.getTime()) / 1000)
    const refilled = Math.min(rate.capacity, doc.tokens + elapsedSec * rate.refillPerSec)

    if (refilled < 1) {
        // Sem tokens: registra a reposição parcial mas não deixa enviar.
        await col.updateOne({ _id: channel }, { $set: { tokens: refilled, updatedAt: now } })
        return false
    }

    await col.updateOne(
        { _id: channel },
        { $set: { tokens: refilled - 1, updatedAt: now } },
    )
    return true
}
