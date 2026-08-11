// ────────────────────────────────────────────────────────────────────────────
// Campanhas de e-mail (envio em massa a partir de /admin/emails).
//
// Por que este módulo existe
// --------------------------
// O envio antigo mandava tudo DIRETO de dentro da rota HTTP, com
// `Promise.allSettled` em cima do transporter pooled. Como o pool serializa em
// ~2-3 msg/s, qualquer lista com algumas dezenas de pessoas estourava o
// maxDuration da função: o gateway respondia 504 em texto puro, o front não
// conseguia ler o JSON e mostrava "erro" mesmo depois de parte dos e-mails ter
// saído — e nunca dava para saber PARA QUEM foi.
//
// Agora a rota só faz duas coisas rápidas: (1) resolve a lista de
// destinatários e grava a campanha, (2) enfileira uma mensagem por pessoa na
// outbox (`lib/comms/outbox`), que já tem retry, backoff, lease e auditoria.
// O envio de fato é drenado com orçamento de tempo — o que não couber fica
// pendente e sai no próximo tick do cron. Nada se perde e o estado por
// destinatário fica registrado, então a UI consegue dizer exatamente quem
// recebeu, quem está na fila e quem falhou (e por quê).
// ────────────────────────────────────────────────────────────────────────────

import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { computeCurrentPeriodo } from '@/lib/user-periodo'
import { enqueueMany } from './outbox'
import { OUTBOX_COLLECTION } from './outbox'
import type { OutboxMessage, OutboxStatus } from './types'

export const CAMPAIGNS_COLLECTION = 'email_campaigns'

/** Template key usado por toda campanha disparada pelo painel. */
export const CAMPAIGN_TEMPLATE_KEY = 'campaign-broadcast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Como escolher os destinatários. Os campos de `filter` são resolvidos no
 * SERVIDOR a cada disparo — é o que permite um agendamento recorrente pegar
 * quem entrou na base depois de ele ter sido criado.
 */
export interface RecipientSpec {
    /** IDs de usuários escolhidos manualmente na UI. */
    userIds?: string[]
    /** Endereços avulsos digitados na UI (fora da base de usuários). */
    additionalEmails?: string[]
    /** Todos os usuários da base. */
    selectAll?: boolean
    /** Filtros dinâmicos (aplicados sobre a base inteira). */
    filter?: {
        /** 'all' | 'admin' | 'premium' | 'trial' | 'gratuito' */
        accountType?: string
        /** 'all' | 'none' | '1'..'12' (período atual calculado) */
        periodo?: string
        /** Só quem já confirmou o e-mail. */
        verifiedOnly?: boolean
    }
}

export interface CampaignRecipient {
    email: string
    name: string
    userId?: string
}

export interface CampaignContent {
    subject: string
    /** HTML dos blocos (sem o layout base — ele é aplicado no envio). */
    content: string
    previewText?: string
}

export interface EmailCampaignDoc {
    _id?: ObjectId
    campaignId: string
    name: string
    subject: string
    previewText: string
    content: string
    source: 'manual' | 'schedule'
    scheduleId?: string
    total: number
    /** Snapshot de para quem a campanha foi criada (a fila é a fonte de verdade do status). */
    recipients: CampaignRecipient[]
    createdAt: Date
    createdBy?: string
}

interface UserRow {
    _id: ObjectId
    email?: string
    name?: string
    role?: string
    accountType?: string
    emailVerified?: boolean
    periodoBase?: number
    periodoBaseRef?: string
}

const USER_PROJECTION = {
    email: 1,
    name: 1,
    role: 1,
    accountType: 1,
    emailVerified: 1,
    periodoBase: 1,
    periodoBaseRef: 1,
} as const

function matchesFilter(user: UserRow, filter: RecipientSpec['filter']): boolean {
    if (!filter) return true

    const accountType = filter.accountType
    if (accountType && accountType !== 'all') {
        const isAdmin = user.role === 'admin'
        const matches = accountType === 'admin' ? isAdmin : user.accountType === accountType
        if (!matches) return false
    }

    const periodo = filter.periodo
    if (periodo && periodo !== 'all') {
        const atual = computeCurrentPeriodo(user.periodoBase, user.periodoBaseRef)
        if (periodo === 'none') {
            if (atual !== null) return false
        } else if (String(atual) !== periodo) {
            return false
        }
    }

    if (filter.verifiedOnly && !user.emailVerified) return false

    return true
}

/**
 * Resolve a especificação em uma lista concreta de destinatários, já sem
 * duplicatas e sem endereços inválidos (a mesma pessoa pode ter sido
 * selecionada na lista E digitada como e-mail extra).
 */
export async function resolveRecipients(spec: RecipientSpec): Promise<CampaignRecipient[]> {
    const db = await getDb()
    const users = db.collection<UserRow>('users')
    const collected: CampaignRecipient[] = []

    const hasFilter = !!spec.filter && Object.values(spec.filter).some(
        v => v !== undefined && v !== 'all' && v !== false,
    )

    if (spec.selectAll || hasFilter) {
        // `selectAll` + filtro = todos que passam no filtro. Filtro sozinho também
        // varre a base inteira: é assim que agendamentos recorrentes alcançam
        // quem se cadastrou depois.
        const rows = await users.find({}).project<UserRow>(USER_PROJECTION).toArray()
        for (const row of rows) {
            if (!matchesFilter(row, spec.filter)) continue
            collected.push({
                email: row.email || '',
                name: row.name || '',
                userId: row._id.toString(),
            })
        }
    } else if (spec.userIds && spec.userIds.length > 0) {
        const ids = spec.userIds
            .filter(id => ObjectId.isValid(id))
            .map(id => new ObjectId(id))
        if (ids.length > 0) {
            const rows = await users
                .find({ _id: { $in: ids } })
                .project<UserRow>(USER_PROJECTION)
                .toArray()
            for (const row of rows) {
                collected.push({
                    email: row.email || '',
                    name: row.name || '',
                    userId: row._id.toString(),
                })
            }
        }
    }

    for (const raw of spec.additionalEmails || []) {
        const email = String(raw || '').trim().toLowerCase()
        if (EMAIL_RE.test(email)) collected.push({ email, name: '' })
    }

    const seen = new Set<string>()
    const unique: CampaignRecipient[] = []
    for (const recipient of collected) {
        const email = recipient.email.trim().toLowerCase()
        if (!EMAIL_RE.test(email)) continue
        if (seen.has(email)) continue
        seen.add(email)
        unique.push({ ...recipient, email })
    }
    return unique
}

/** Gera um identificador de campanha legível e único o bastante para a fila. */
export function newCampaignId(): string {
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
    const rand = Math.random().toString(36).slice(2, 8)
    return `camp_${stamp}_${rand}`
}

/**
 * Grava a campanha e enfileira uma mensagem por destinatário.
 *
 * A `idempotencyKey` (campanha + e-mail) é o que impede envio duplicado se a
 * rota for chamada duas vezes — clique duplo no botão, retry do navegador ou
 * um agendamento que rodou em dois ticks sobrepostos.
 */
export async function createAndEnqueueCampaign(params: {
    recipients: CampaignRecipient[]
    content: CampaignContent
    name?: string
    source: 'manual' | 'schedule'
    scheduleId?: string
    createdBy?: string
    /** Enviar no futuro em vez de agora. */
    scheduledAt?: Date
}): Promise<{ campaignId: string; queued: number }> {
    const campaignId = newCampaignId()
    const db = await getDb()
    const now = new Date()

    const doc: EmailCampaignDoc = {
        campaignId,
        name: params.name || params.content.subject || 'Campanha sem título',
        subject: params.content.subject,
        previewText: params.content.previewText || '',
        content: params.content.content,
        source: params.source,
        scheduleId: params.scheduleId,
        total: params.recipients.length,
        recipients: params.recipients,
        createdAt: now,
        createdBy: params.createdBy,
    }
    await db.collection<EmailCampaignDoc>(CAMPAIGNS_COLLECTION).insertOne(doc)

    const queued = await enqueueMany(
        params.recipients.map(recipient => ({
            channel: 'email' as const,
            to: {
                email: recipient.email,
                name: recipient.name,
                userId: recipient.userId,
            },
            templateKey: CAMPAIGN_TEMPLATE_KEY,
            payload: {
                subject: params.content.subject,
                content: params.content.content,
                previewText: params.content.previewText || '',
            },
            campaignId,
            scheduledAt: params.scheduledAt,
            idempotencyKey: `${campaignId}:${recipient.email}`,
        })),
    )

    return { campaignId, queued }
}

export interface RecipientStatus {
    email: string
    name: string
    status: OutboxStatus
    attempts: number
    error?: string
    sentAt?: Date
}

export interface CampaignProgress {
    campaignId: string
    name: string
    subject: string
    source: 'manual' | 'schedule'
    createdAt: Date
    stats: {
        total: number
        sent: number
        pending: number
        failed: number
        dead: number
        skipped: number
    }
    /** true quando não há mais nada para processar (nada pendente na fila). */
    done: boolean
    recipients: RecipientStatus[]
}

/**
 * Estado atual de uma campanha, lido da outbox (fonte de verdade). É o que a
 * UI consulta em polling para mostrar, pessoa a pessoa, quem já recebeu.
 */
export async function getCampaignProgress(
    campaignId: string,
    opts: { recipientLimit?: number } = {},
): Promise<CampaignProgress | null> {
    const db = await getDb()
    const campaign = await db
        .collection<EmailCampaignDoc>(CAMPAIGNS_COLLECTION)
        .findOne({ campaignId })
    if (!campaign) return null

    const messages = await db
        .collection<OutboxMessage>(OUTBOX_COLLECTION)
        .find({ campaignId })
        .project<Pick<OutboxMessage, 'to' | 'status' | 'attempts' | 'lastError' | 'sentAt'>>({
            to: 1,
            status: 1,
            attempts: 1,
            lastError: 1,
            sentAt: 1,
        })
        .limit(opts.recipientLimit ?? 5000)
        .toArray()

    const stats = { total: messages.length, sent: 0, pending: 0, failed: 0, dead: 0, skipped: 0 }
    const recipients: RecipientStatus[] = []

    for (const msg of messages) {
        switch (msg.status) {
            case 'sent':
            case 'delivered':
                stats.sent++
                break
            case 'dead':
                stats.dead++
                break
            case 'skipped':
                stats.skipped++
                break
            case 'failed':
                // 'failed' = vai ser retentado; ainda conta como em andamento.
                stats.failed++
                stats.pending++
                break
            default:
                stats.pending++
        }
        recipients.push({
            email: msg.to?.email || '',
            name: msg.to?.name || '',
            status: msg.status,
            attempts: msg.attempts ?? 0,
            error: msg.lastError,
            sentAt: msg.sentAt,
        })
    }

    // Ordem útil para inspeção: problemas primeiro, enviados por último.
    const rank: Record<string, number> = { dead: 0, failed: 1, pending: 2, processing: 2, skipped: 3, sent: 4, delivered: 4 }
    recipients.sort((a, b) => (rank[a.status] ?? 5) - (rank[b.status] ?? 5))

    return {
        campaignId,
        name: campaign.name,
        subject: campaign.subject,
        source: campaign.source,
        createdAt: campaign.createdAt,
        stats: { ...stats, total: campaign.total || messages.length },
        done: stats.pending === 0,
        recipients,
    }
}

/** Últimas campanhas, para o histórico do painel. */
export async function listCampaigns(limit = 25): Promise<
    Array<Pick<EmailCampaignDoc, 'campaignId' | 'name' | 'subject' | 'source' | 'total' | 'createdAt'>>
> {
    const db = await getDb()
    const rows = await db
        .collection<EmailCampaignDoc>(CAMPAIGNS_COLLECTION)
        .find({})
        .project<Pick<EmailCampaignDoc, 'campaignId' | 'name' | 'subject' | 'source' | 'total' | 'createdAt'>>({
            campaignId: 1,
            name: 1,
            subject: 1,
            source: 1,
            total: 1,
            createdAt: 1,
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()
    return rows
}
