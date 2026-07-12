// ────────────────────────────────────────────────────────────────────────────
// Motor de sequências / jornada do lead (Parte 5).
//
// Uma "sequência" é uma série de passos (e-mail e/ou WhatsApp) disparados em
// intervalos relativos ao momento da matrícula, com timing psicologicamente
// eficaz. Um lead é "matriculado" (enrollment) ao ser capturado; o cron
// `comms-dispatcher` chama `advanceSequences()` a cada minuto para enfileirar o
// próximo passo quando chega a hora.
//
// Coleções: `sequences` (definições) e `sequence_enrollments` (lead × passo).
// ────────────────────────────────────────────────────────────────────────────

import { getDb } from '@/lib/mongodb'
import type { Collection } from 'mongodb'
import { dispatch } from './dispatch'
import { buildPersuasionVars, renderPersuasion } from './persuasion'
import type { CommChannel, OutboxTarget } from './types'

export const SEQUENCES_COLLECTION = 'sequences'
export const ENROLLMENTS_COLLECTION = 'sequence_enrollments'

export interface SequenceStep {
    /** Atraso desde a MATRÍCULA (não desde o passo anterior), em minutos. */
    delayMinutes: number
    channels: CommChannel[]
    templateKey: string
    /** Assunto (e-mail). Aceita tokens {{...}} de persuasão. */
    subject?: string
    /** Corpo do e-mail (HTML dos blocos) OU texto do WhatsApp. Aceita {{...}}. */
    body: string
    /** Rótulo para o admin (ex.: "Prova social + autoridade"). */
    label?: string
}

export interface Sequence {
    _id?: string | import('mongodb').ObjectId
    key: string // identificador estável (ex.: 'lead-journey-default')
    name: string
    description?: string
    steps: SequenceStep[]
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export type EnrollmentStatus = 'active' | 'completed' | 'stopped'

export interface SequenceEnrollment {
    _id?: string | import('mongodb').ObjectId
    sequenceId: string
    sequenceKey: string
    to: OutboxTarget
    campaignId?: string
    persuasiveTag?: string
    campaignName?: string
    currentStep: number
    nextRunAt: Date
    status: EnrollmentStatus
    enrolledAt: Date
    updatedAt: Date
}

let indexesEnsured = false
async function enrollments(): Promise<Collection<SequenceEnrollment>> {
    const db = await getDb()
    const col = db.collection<SequenceEnrollment>(ENROLLMENTS_COLLECTION)
    if (!indexesEnsured) {
        await col.createIndex({ status: 1, nextRunAt: 1 })
        await col.createIndex({ 'to.leadUuid': 1 })
        // Impede matricular o mesmo lead duas vezes na mesma sequência.
        await col.createIndex(
            { sequenceKey: 1, 'to.leadUuid': 1 },
            { unique: true, partialFilterExpression: { 'to.leadUuid': { $type: 'string' } } },
        )
        indexesEnsured = true
    }
    return col
}

export async function getSequenceByKey(key: string): Promise<Sequence | null> {
    const db = await getDb()
    return db.collection<Sequence>(SEQUENCES_COLLECTION).findOne({ key, isActive: true })
}

/**
 * Matricula um alvo numa sequência. Idempotente por (sequência, leadUuid).
 * Agenda o primeiro passo conforme seu `delayMinutes`.
 */
export async function enroll(input: {
    sequenceKey: string
    to: OutboxTarget
    campaignId?: string
    campaignName?: string
    persuasiveTag?: string
}): Promise<{ enrolled: boolean; reason?: string }> {
    const seq = await getSequenceByKey(input.sequenceKey)
    if (!seq || seq.steps.length === 0) return { enrolled: false, reason: 'sequência inexistente/vazia' }

    const col = await enrollments()
    const now = new Date()
    const firstDelay = seq.steps[0].delayMinutes || 0
    const doc: SequenceEnrollment = {
        sequenceId: seq._id!.toString(),
        sequenceKey: seq.key,
        to: input.to,
        campaignId: input.campaignId,
        campaignName: input.campaignName,
        persuasiveTag: input.persuasiveTag,
        currentStep: 0,
        nextRunAt: new Date(now.getTime() + firstDelay * 60_000),
        status: 'active',
        enrolledAt: now,
        updatedAt: now,
    }
    try {
        await col.insertOne(doc)
        return { enrolled: true }
    } catch (err) {
        if ((err as { code?: number }).code === 11000) return { enrolled: false, reason: 'já matriculado' }
        throw err
    }
}

/**
 * Processa as matrículas cujo próximo passo venceu: enfileira o passo (com
 * variáveis de persuasão resolvidas) e agenda o próximo — ou conclui.
 * Chamado pelo cron a cada minuto.
 */
export async function advanceSequences(limit = 100): Promise<{ advanced: number; completed: number }> {
    const col = await enrollments()
    const now = new Date()
    const stats = { advanced: 0, completed: 0 }

    const due = await col
        .find({ status: 'active', nextRunAt: { $lte: now } })
        .sort({ nextRunAt: 1 })
        .limit(limit)
        .toArray()

    for (const en of due) {
        const seq = await getSequenceByKey(en.sequenceKey)
        if (!seq) {
            await col.updateOne({ _id: en._id }, { $set: { status: 'stopped', updatedAt: new Date() } })
            continue
        }
        const step = seq.steps[en.currentStep]
        if (!step) {
            await col.updateOne({ _id: en._id }, { $set: { status: 'completed', updatedAt: new Date() } })
            stats.completed++
            continue
        }

        // Resolve variáveis de persuasão e renderiza o passo.
        const vars = await buildPersuasionVars({
            name: en.to.name,
            persuasiveTag: en.persuasiveTag,
            campaignId: en.campaignId,
            campaignName: en.campaignName,
        })
        const subject = step.subject ? renderPersuasion(step.subject, vars) : undefined
        const body = renderPersuasion(step.body, vars)

        await dispatch({
            channels: step.channels,
            to: en.to,
            templateKey: step.templateKey,
            payload: { subject, content: body, text: body, previewText: subject },
            sequenceId: en.sequenceId,
            campaignId: en.campaignId,
            checkConsent: true,
            assumeGranted: true, // opt-in ocorreu na captura do lead
            idempotencyKey: `seq:${en.sequenceKey}:${en.to.leadUuid || en.to.email}:${en.currentStep}`,
        })

        // Agenda o próximo passo (delay é relativo à matrícula) ou conclui.
        const nextIndex = en.currentStep + 1
        const nextStep = seq.steps[nextIndex]
        if (nextStep) {
            const nextRunAt = new Date(en.enrolledAt.getTime() + nextStep.delayMinutes * 60_000)
            await col.updateOne(
                { _id: en._id },
                { $set: { currentStep: nextIndex, nextRunAt, updatedAt: new Date() } },
            )
            stats.advanced++
        } else {
            await col.updateOne(
                { _id: en._id },
                { $set: { currentStep: nextIndex, status: 'completed', updatedAt: new Date() } },
            )
            stats.completed++
        }
    }

    return stats
}
