// ────────────────────────────────────────────────────────────────────────────
// Agendamento de campanhas de e-mail.
//
// Um "agendamento" guarda o conteúdo do e-mail + a especificação de quem
// recebe + quando repetir. A cada execução, os destinatários são resolvidos de
// novo no servidor — então um agendamento semanal filtrado por "trial" alcança
// também quem virou trial depois de o agendamento ter sido criado.
//
// Quem dispara: a rota /api/cron/email-scheduler, chamada de fora (cron-job.org).
// O plano Hobby da Vercel só permite cron 1x/dia, o que não serve para
// agendamentos com hora marcada — por isso o gatilho é externo.
//
// Fusos: o admin pensa em horário de Brasília, mas o servidor roda em UTC.
// Guardamos a hora "de parede" + o fuso, e convertemos para UTC na hora de
// calcular a próxima execução. Assim o horário não escorrega no horário de
// verão nem se a Vercel mudar de região.
// ────────────────────────────────────────────────────────────────────────────

import { ObjectId } from 'mongodb'
import type { Collection } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import type { RecipientSpec } from './email-campaigns'

export const SCHEDULES_COLLECTION = 'email_schedules'

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

export type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly'

export interface EmailSchedule {
    _id?: ObjectId
    name: string

    // Conteúdo da campanha
    subject: string
    previewText: string
    /** HTML dos blocos já renderizado (o layout base é aplicado no envio). */
    content: string
    /** Blocos do editor, para poder reabrir o agendamento e editar. */
    blocks?: unknown[]

    recipients: RecipientSpec

    // Recorrência
    frequency: ScheduleFrequency
    /** Hora de parede no fuso `timezone`, formato "HH:mm". */
    time: string
    timezone: string
    /** frequency='weekly': dias da semana (0=domingo … 6=sábado). */
    weekdays?: number[]
    /** frequency='monthly': dia do mês (1-31, ajustado para meses curtos). */
    dayOfMonth?: number
    /** frequency='once': data local "AAAA-MM-DD" no fuso `timezone`. */
    date?: string

    isActive: boolean
    nextRunAt: Date | null

    // Rastreio da última execução
    lastRunAt?: Date
    lastCampaignId?: string
    lastStatus?: 'ok' | 'error' | 'empty'
    lastError?: string
    lastRecipientCount?: number
    runCount: number

    createdAt: Date
    updatedAt: Date
    createdBy?: string
}

let indexesEnsured = false

async function collection(): Promise<Collection<EmailSchedule>> {
    const db = await getDb()
    const col = db.collection<EmailSchedule>(SCHEDULES_COLLECTION)
    if (!indexesEnsured) {
        // Índice do scheduler: buscar os agendamentos vencidos.
        await col.createIndex({ isActive: 1, nextRunAt: 1 })
        indexesEnsured = true
    }
    return col
}

// ── Fuso horário ────────────────────────────────────────────────────────────

/**
 * Deslocamento (ms) do fuso em relação ao UTC no instante `date`.
 * Usa o próprio Intl para não depender de tabela de horário de verão.
 */
function tzOffsetMs(date: Date, timeZone: string): number {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
    const parts = dtf.formatToParts(date)
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value || '0')
    // `hour` pode vir como 24 em algumas engines para meia-noite.
    const hour = get('hour') % 24
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'))
    return asUtc - date.getTime()
}

/**
 * Converte uma data/hora "de parede" num fuso para o instante UTC correspondente.
 * Duas passadas resolvem a borda do horário de verão (o deslocamento depende do
 * próprio instante que estamos calculando).
 */
export function zonedTimeToUtc(
    year: number,
    month: number, // 1-12
    day: number,
    hour: number,
    minute: number,
    timeZone: string,
): Date {
    const naive = Date.UTC(year, month - 1, day, hour, minute, 0)
    let result = new Date(naive - tzOffsetMs(new Date(naive), timeZone))
    result = new Date(naive - tzOffsetMs(result, timeZone))
    return result
}

/** Partes da data/hora de parede de um instante, no fuso pedido. */
function zonedParts(date: Date, timeZone: string) {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'short',
    })
    const parts = dtf.formatToParts(date)
    const get = (type: string) => parts.find(p => p.type === type)?.value || ''
    const weekdayMap: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    }
    return {
        year: Number(get('year')),
        month: Number(get('month')),
        day: Number(get('day')),
        hour: Number(get('hour')) % 24,
        minute: Number(get('minute')),
        weekday: weekdayMap[get('weekday')] ?? 0,
    }
}

// ── Cálculo da próxima execução ─────────────────────────────────────────────

function parseTime(time: string): { hour: number; minute: number } {
    const match = /^(\d{1,2}):(\d{2})$/.exec((time || '').trim())
    if (!match) return { hour: 9, minute: 0 }
    return {
        hour: Math.min(23, Math.max(0, Number(match[1]))),
        minute: Math.min(59, Math.max(0, Number(match[2]))),
    }
}

/**
 * Próxima execução (em UTC) estritamente depois de `from`, ou null quando o
 * agendamento não tem mais execuções (caso do 'once' já vencido).
 */
export function computeNextRun(
    schedule: Pick<
        EmailSchedule,
        'frequency' | 'time' | 'timezone' | 'weekdays' | 'dayOfMonth' | 'date'
    >,
    from: Date = new Date(),
): Date | null {
    const tz = schedule.timezone || DEFAULT_TIMEZONE
    const { hour, minute } = parseTime(schedule.time)

    if (schedule.frequency === 'once') {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((schedule.date || '').trim())
        if (!match) return null
        const at = zonedTimeToUtc(
            Number(match[1]), Number(match[2]), Number(match[3]), hour, minute, tz,
        )
        return at.getTime() > from.getTime() ? at : null
    }

    const now = zonedParts(from, tz)

    if (schedule.frequency === 'daily') {
        for (let offset = 0; offset <= 1; offset++) {
            const candidate = addLocalDays(now, offset, hour, minute, tz)
            if (candidate.getTime() > from.getTime()) return candidate
        }
        return null
    }

    if (schedule.frequency === 'weekly') {
        const days = (schedule.weekdays && schedule.weekdays.length > 0)
            ? schedule.weekdays
            : [now.weekday]
        // Procura nos próximos 14 dias — cobre qualquer combinação de dias.
        for (let offset = 0; offset <= 14; offset++) {
            const weekday = (now.weekday + offset) % 7
            if (!days.includes(weekday)) continue
            const candidate = addLocalDays(now, offset, hour, minute, tz)
            if (candidate.getTime() > from.getTime()) return candidate
        }
        return null
    }

    // monthly: mesmo dia todo mês; meses curtos caem no último dia disponível.
    const targetDay = Math.min(31, Math.max(1, schedule.dayOfMonth || 1))
    for (let offset = 0; offset <= 12; offset++) {
        const monthIndex = now.month - 1 + offset
        const year = now.year + Math.floor(monthIndex / 12)
        const month = (monthIndex % 12) + 1
        const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
        const day = Math.min(targetDay, lastDay)
        const candidate = zonedTimeToUtc(year, month, day, hour, minute, tz)
        if (candidate.getTime() > from.getTime()) return candidate
    }
    return null
}

function addLocalDays(
    base: { year: number; month: number; day: number },
    days: number,
    hour: number,
    minute: number,
    timeZone: string,
): Date {
    // Aritmética de calendário em UTC só para achar ano/mês/dia; a conversão
    // final para instante é sempre pelo fuso.
    const shifted = new Date(Date.UTC(base.year, base.month - 1, base.day + days))
    return zonedTimeToUtc(
        shifted.getUTCFullYear(),
        shifted.getUTCMonth() + 1,
        shifted.getUTCDate(),
        hour,
        minute,
        timeZone,
    )
}

// ── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Valida o payload vindo do painel. Retorna a mensagem de erro em português,
 * ou null quando está tudo certo.
 */
export function validateScheduleInput(body: {
    subject?: string
    content?: string
    frequency?: string
    time?: string
    date?: string
    weekdays?: number[]
    recipients?: RecipientSpec
}): string | null {
    const frequencies: string[] = ['once', 'daily', 'weekly', 'monthly']

    if (!body.subject?.trim()) return 'Informe o assunto do e-mail'
    if (!body.content?.trim()) return 'O conteúdo do e-mail está vazio'
    if (!body.frequency || !frequencies.includes(body.frequency)) return 'Frequência inválida'
    if (body.time && !/^\d{1,2}:\d{2}$/.test(body.time)) return 'Horário inválido (use HH:mm)'
    if (body.frequency === 'once' && !/^\d{4}-\d{2}-\d{2}$/.test(body.date || '')) {
        return 'Informe a data do envio único'
    }
    if (body.frequency === 'weekly' && (!body.weekdays || body.weekdays.length === 0)) {
        return 'Escolha pelo menos um dia da semana'
    }

    const spec = body.recipients
    const hasRecipients =
        !!spec &&
        (spec.selectAll === true ||
            (spec.userIds?.length || 0) > 0 ||
            (spec.additionalEmails?.length || 0) > 0 ||
            !!spec.filter)
    if (!hasRecipients) return 'Selecione pelo menos um destinatário'

    return null
}

export type ScheduleInput = Omit<
    EmailSchedule,
    '_id' | 'nextRunAt' | 'runCount' | 'createdAt' | 'updatedAt' | 'lastRunAt'
    | 'lastCampaignId' | 'lastStatus' | 'lastError' | 'lastRecipientCount'
>

export async function listSchedules(): Promise<EmailSchedule[]> {
    const col = await collection()
    return col.find({}).sort({ nextRunAt: 1, createdAt: -1 }).limit(200).toArray()
}

export async function getSchedule(id: string): Promise<EmailSchedule | null> {
    if (!ObjectId.isValid(id)) return null
    const col = await collection()
    return col.findOne({ _id: new ObjectId(id) })
}

export async function createSchedule(input: ScheduleInput): Promise<EmailSchedule> {
    const col = await collection()
    const now = new Date()
    const doc: EmailSchedule = {
        ...input,
        timezone: input.timezone || DEFAULT_TIMEZONE,
        nextRunAt: input.isActive ? computeNextRun(input, now) : null,
        runCount: 0,
        createdAt: now,
        updatedAt: now,
    }
    const result = await col.insertOne(doc)
    return { ...doc, _id: result.insertedId }
}

export async function updateSchedule(
    id: string,
    input: Partial<ScheduleInput>,
): Promise<EmailSchedule | null> {
    const existing = await getSchedule(id)
    if (!existing) return null

    const merged = { ...existing, ...input }
    const col = await collection()
    const now = new Date()
    const nextRunAt = merged.isActive ? computeNextRun(merged, now) : null

    await col.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...input, nextRunAt, updatedAt: now } },
    )
    return { ...merged, nextRunAt, updatedAt: now }
}

export async function deleteSchedule(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false
    const col = await collection()
    const result = await col.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
}

/**
 * Reserva atomicamente os agendamentos vencidos.
 *
 * O `findOneAndUpdate` já empurra `nextRunAt` para a próxima ocorrência, então
 * dois ticks sobrepostos do cron-job.org não disparam a mesma campanha duas
 * vezes — e a idempotência por campanha na outbox é a segunda rede de proteção.
 */
export async function claimDueSchedules(now: Date = new Date()): Promise<EmailSchedule[]> {
    const col = await collection()
    const claimed: EmailSchedule[] = []

    // Limite defensivo: um tick não deve tentar rodar dezenas de campanhas.
    for (let i = 0; i < 10; i++) {
        const candidate = await col.findOne(
            { isActive: true, nextRunAt: { $ne: null, $lte: now } },
            { sort: { nextRunAt: 1 } },
        )
        if (!candidate) break

        const following = computeNextRun(candidate, now)
        const result = await col.updateOne(
            // O filtro por `nextRunAt` faz o claim: quem atualizar primeiro leva.
            { _id: candidate._id, nextRunAt: candidate.nextRunAt },
            {
                $set: {
                    nextRunAt: following,
                    // 'once' se encerra sozinho ao rodar (não há próxima ocorrência).
                    isActive: following !== null,
                    updatedAt: now,
                },
            },
        )
        if (result.modifiedCount === 1) claimed.push(candidate)
    }

    return claimed
}

/** Registra o resultado da execução de um agendamento. */
export async function recordScheduleRun(
    id: ObjectId | undefined,
    result: {
        status: 'ok' | 'error' | 'empty'
        campaignId?: string
        error?: string
        recipientCount?: number
    },
): Promise<void> {
    if (!id) return
    const col = await collection()
    await col.updateOne(
        { _id: id },
        {
            $set: {
                lastRunAt: new Date(),
                lastStatus: result.status,
                lastCampaignId: result.campaignId,
                lastError: result.error,
                lastRecipientCount: result.recipientCount,
                updatedAt: new Date(),
            },
            $inc: { runCount: 1 },
        },
    )
}
