// ────────────────────────────────────────────────────────────────────────────
// Jornada padrão do lead (Parte 5) — sequência multicanal com timing
// psicologicamente eficaz, aplicando os princípios de persuasão.
//
// Cada passo usa tokens {{...}} resolvidos por lib/comms/persuasion.ts.
// Ajuste os textos/tempos pelo painel; este é o ponto de partida.
// ────────────────────────────────────────────────────────────────────────────

import { getDb } from '@/lib/mongodb'
import { SEQUENCES_COLLECTION } from './sequences'
import type { Sequence, SequenceStep } from './sequences'

export const DEFAULT_JOURNEY_KEY = 'lead-journey-default'

const MIN = 1
const HOUR = 60
const DAY = 24 * 60

export const DEFAULT_JOURNEY_STEPS: SequenceStep[] = [
    {
        label: 'T+1h — Reciprocidade (checagem WhatsApp)',
        delayMinutes: 1 * HOUR,
        channels: ['whatsapp'],
        templateKey: 'seq-checkin',
        body:
            'Oi, {{firstName}}! 👋 Conseguiu abrir o material *{{campaignName}}*? ' +
            'Se tiver qualquer dúvida, é só me responder por aqui.',
    },
    {
        label: 'T+1d — Autoridade + prova social',
        delayMinutes: 1 * DAY,
        channels: ['email'],
        templateKey: 'seq-authority',
        subject: '{{firstName}}, como {{totalStudents}} estudantes estudam {{persuasiveTag}}',
        body:
            '<div class="hero-block"><h1>Você não está sozinho(a) nessa, {{firstName}}</h1>' +
            '<p>Mais de {{totalStudents}} estudantes já usam o DomineAqui para {{persuasiveTag}}.</p></div>' +
            '<div class="text-block"><p>Nosso conteúdo é {{authority}} — feito para quem leva a aprovação a sério.</p></div>',
    },
    {
        label: 'T+2d — Compromisso (micro-conversão: aula grátis)',
        delayMinutes: 2 * DAY,
        channels: ['email'],
        templateKey: 'seq-commitment',
        subject: '{{firstName}}, separei uma aula gratuita pra você',
        body:
            '<div class="text-block"><p>Oi, {{firstName}}! Depois do material, o próximo passo natural é uma ' +
            '<strong>aula gratuita</strong> que preparamos sobre {{persuasiveTag}}.</p></div>',
    },
    {
        label: 'T+3d — Prova social (depoimento) via WhatsApp',
        delayMinutes: 3 * DAY,
        channels: ['whatsapp'],
        templateKey: 'seq-testimonial',
        body:
            '{{firstName}}, olha o que um estudante nos disse: "consegui organizar meus estudos e ' +
            'melhorei muito em {{persuasiveTag}}". Quer ver como? 👇',
    },
    {
        label: 'T+5d — Oferta com escassez legítima',
        delayMinutes: 5 * DAY,
        channels: ['email'],
        templateKey: 'seq-offer',
        subject: '{{firstName}}, condição especial pra você continuar',
        body:
            '<div class="highlight-box"><p><strong>Condição especial</strong> para quem baixou {{campaignName}}.</p></div>' +
            '<div class="text-block"><p>Continue de onde parou e destrave tudo sobre {{persuasiveTag}}.</p></div>',
    },
    {
        label: 'T+7d — Urgência + fechamento (e-mail + WhatsApp)',
        delayMinutes: 7 * DAY,
        channels: ['email', 'whatsapp'],
        templateKey: 'seq-closing',
        subject: '{{firstName}}, últimas horas da condição especial',
        body:
            'Últimas horas, {{firstName}}! A condição especial sobre {{persuasiveTag}} está encerrando. ' +
            'Não deixa passar. 🚀',
    },
]

/** Cria (ou atualiza os metadados, preservando edições dos passos) a jornada padrão. */
export async function ensureDefaultJourney(): Promise<Sequence> {
    const db = await getDb()
    const col = db.collection<Sequence>(SEQUENCES_COLLECTION)
    const now = new Date()

    const existing = await col.findOne({ key: DEFAULT_JOURNEY_KEY })
    if (existing) return existing

    const seq: Sequence = {
        key: DEFAULT_JOURNEY_KEY,
        name: 'Jornada do Lead (padrão)',
        description:
            'Sequência multicanal de nurturing: reciprocidade → autoridade/prova social → ' +
            'compromisso → prova social → oferta → urgência. Timing psicologicamente eficaz.',
        steps: DEFAULT_JOURNEY_STEPS,
        isActive: true,
        createdAt: now,
        updatedAt: now,
    }
    const res = await col.insertOne(seq)
    return { ...seq, _id: res.insertedId }
}
