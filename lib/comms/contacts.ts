// ────────────────────────────────────────────────────────────────────────────
// Camada de contatos + consentimento (LGPD).
//
// Fonte única de contato (e-mail/telefone) e de consentimento por canal,
// desacoplada de `users` e `leads`. Toda mensagem enfileirada carrega um
// snapshot do consentimento no momento do envio (prova de base legal).
//
// Coleção: `comms_contacts`.
// ────────────────────────────────────────────────────────────────────────────

import { getDb } from '@/lib/mongodb'
import type { Collection } from 'mongodb'
import type { CommChannel, ConsentSnapshot } from './types'

export const CONTACTS_COLLECTION = 'comms_contacts'

export type ConsentStatus = 'granted' | 'revoked'

export interface ChannelConsent {
    status: ConsentStatus
    at: Date
    source?: string
    ip?: string
}

export interface CommContact {
    _id?: string | import('mongodb').ObjectId
    userId?: string
    leadUuid?: string
    email?: string
    phoneE164?: string
    name?: string
    consent: Partial<Record<CommChannel, ChannelConsent>>
    tags?: string[]
    createdAt: Date
    updatedAt: Date
}

let indexesEnsured = false

async function collection(): Promise<Collection<CommContact>> {
    const db = await getDb()
    const col = db.collection<CommContact>(CONTACTS_COLLECTION)
    if (!indexesEnsured) {
        await col.createIndex({ email: 1 }, { sparse: true })
        await col.createIndex({ phoneE164: 1 }, { sparse: true })
        await col.createIndex({ leadUuid: 1 }, { sparse: true })
        await col.createIndex({ userId: 1 }, { sparse: true })
        indexesEnsured = true
    }
    return col
}

export interface UpsertContactInput {
    userId?: string
    leadUuid?: string
    email?: string
    phoneE164?: string
    name?: string
    /** Consentimentos concedidos agora (canal → true). */
    grant?: Partial<Record<CommChannel, boolean>>
    source?: string
    ip?: string
    tags?: string[]
}

/**
 * Cria/atualiza um contato e registra consentimentos. Deduplica por e-mail ou
 * telefone (o que existir). Retorna o contato resultante.
 */
export async function upsertContact(input: UpsertContactInput): Promise<CommContact> {
    const col = await collection()
    const now = new Date()

    const or: Record<string, unknown>[] = []
    if (input.email) or.push({ email: input.email.toLowerCase() })
    if (input.phoneE164) or.push({ phoneE164: input.phoneE164 })
    if (input.leadUuid) or.push({ leadUuid: input.leadUuid })
    if (input.userId) or.push({ userId: input.userId })

    const existing = or.length ? await col.findOne({ $or: or }) : null

    const consent: CommContact['consent'] = { ...(existing?.consent || {}) }
    for (const [channel, granted] of Object.entries(input.grant || {})) {
        consent[channel as CommChannel] = {
            status: granted ? 'granted' : 'revoked',
            at: now,
            source: input.source,
            ip: input.ip,
        }
    }

    const set: Partial<CommContact> = {
        consent,
        updatedAt: now,
    }
    if (input.email) set.email = input.email.toLowerCase()
    if (input.phoneE164) set.phoneE164 = input.phoneE164
    if (input.name) set.name = input.name
    if (input.userId) set.userId = input.userId
    if (input.leadUuid) set.leadUuid = input.leadUuid

    if (existing) {
        const tags = Array.from(new Set([...(existing.tags || []), ...(input.tags || [])]))
        await col.updateOne(
            { _id: existing._id },
            { $set: { ...set, tags } },
        )
        return { ...existing, ...set, tags }
    }

    const doc: CommContact = {
        ...set,
        consent,
        tags: input.tags || [],
        createdAt: now,
        updatedAt: now,
    } as CommContact
    const res = await col.insertOne(doc)
    return { ...doc, _id: res.insertedId }
}

/** Revoga o consentimento de um canal (opt-out / descadastro). */
export async function revokeConsent(
    match: { email?: string; phoneE164?: string; leadUuid?: string },
    channel: CommChannel,
    source = 'unsubscribe',
): Promise<void> {
    const col = await collection()
    const or: Record<string, unknown>[] = []
    if (match.email) or.push({ email: match.email.toLowerCase() })
    if (match.phoneE164) or.push({ phoneE164: match.phoneE164 })
    if (match.leadUuid) or.push({ leadUuid: match.leadUuid })
    if (!or.length) return
    await col.updateOne(
        { $or: or },
        {
            $set: {
                [`consent.${channel}`]: { status: 'revoked', at: new Date(), source },
                updatedAt: new Date(),
            },
        },
    )
}

/**
 * Verifica se há consentimento válido para um canal e devolve um snapshot para
 * anexar à mensagem. Se o contato não existir, assume-se o consentimento
 * fornecido no ato (ex.: opt-in explícito no formulário) via `assumeGranted`.
 */
export async function resolveConsent(
    match: { email?: string; phoneE164?: string; leadUuid?: string; userId?: string },
    channel: CommChannel,
    assumeGranted = false,
): Promise<{ allowed: boolean; snapshot?: ConsentSnapshot }> {
    const col = await collection()
    const or: Record<string, unknown>[] = []
    if (match.email) or.push({ email: match.email.toLowerCase() })
    if (match.phoneE164) or.push({ phoneE164: match.phoneE164 })
    if (match.leadUuid) or.push({ leadUuid: match.leadUuid })
    if (match.userId) or.push({ userId: match.userId })

    const contact = or.length ? await col.findOne({ $or: or }) : null
    const c = contact?.consent?.[channel]

    if (c) {
        return {
            allowed: c.status === 'granted',
            snapshot: { granted: c.status === 'granted', source: c.source, at: c.at, ip: c.ip },
        }
    }
    return {
        allowed: assumeGranted,
        snapshot: assumeGranted ? { granted: true, source: 'implicit' } : undefined,
    }
}
