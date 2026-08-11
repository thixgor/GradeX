import { describe, expect, it } from 'vitest'
import {
    computeNextRun,
    validateScheduleInput,
    zonedTimeToUtc,
} from '@/lib/comms/email-schedules'

const TZ = 'America/Sao_Paulo'

/** Hora "de parede" de um instante, no fuso de Brasília. */
function wallClock(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date)
}

describe('zonedTimeToUtc', () => {
    it('converte horário de Brasília (UTC-3) para UTC', () => {
        // 09:00 em São Paulo = 12:00 UTC (sem horário de verão desde 2019).
        const at = zonedTimeToUtc(2026, 3, 10, 9, 0, TZ)
        expect(at.toISOString()).toBe('2026-03-10T12:00:00.000Z')
    })

    it('preserva a hora de parede ao voltar para o fuso', () => {
        const at = zonedTimeToUtc(2026, 12, 25, 18, 30, TZ)
        expect(wallClock(at)).toContain('18:30')
    })
})

describe('computeNextRun', () => {
    const base = { time: '09:00', timezone: TZ }

    it('diário: pega hoje se ainda não passou', () => {
        // 08:00 de Brasília = 11:00 UTC.
        const from = new Date('2026-08-11T11:00:00.000Z')
        const next = computeNextRun({ ...base, frequency: 'daily' }, from)
        expect(next?.toISOString()).toBe('2026-08-11T12:00:00.000Z')
    })

    it('diário: pula para amanhã se o horário já passou', () => {
        // 10:00 de Brasília = 13:00 UTC.
        const from = new Date('2026-08-11T13:00:00.000Z')
        const next = computeNextRun({ ...base, frequency: 'daily' }, from)
        expect(next?.toISOString()).toBe('2026-08-12T12:00:00.000Z')
    })

    it('semanal: acha o próximo dia da semana escolhido', () => {
        // 2026-08-11 é uma terça-feira (weekday 2). Pedindo sexta (5).
        const from = new Date('2026-08-11T13:00:00.000Z')
        const next = computeNextRun(
            { ...base, frequency: 'weekly', weekdays: [5] },
            from,
        )
        expect(next?.toISOString()).toBe('2026-08-14T12:00:00.000Z')
    })

    it('semanal: com vários dias, escolhe o mais próximo', () => {
        const from = new Date('2026-08-11T13:00:00.000Z') // terça, após as 9h
        const next = computeNextRun(
            { ...base, frequency: 'weekly', weekdays: [1, 3, 5] },
            from,
        )
        // Próximo é quarta (2026-08-12).
        expect(next?.toISOString()).toBe('2026-08-12T12:00:00.000Z')
    })

    it('mensal: ajusta para o último dia em meses curtos', () => {
        const from = new Date('2026-02-01T12:00:00.000Z')
        const next = computeNextRun(
            { ...base, frequency: 'monthly', dayOfMonth: 31 },
            from,
        )
        // Fevereiro de 2026 tem 28 dias.
        expect(wallClock(next!)).toContain('28/02/2026')
    })

    it('uma vez: retorna a data marcada', () => {
        const from = new Date('2026-08-11T13:00:00.000Z')
        const next = computeNextRun(
            { ...base, frequency: 'once', date: '2026-09-01' },
            from,
        )
        expect(next?.toISOString()).toBe('2026-09-01T12:00:00.000Z')
    })

    it('uma vez: retorna null quando a data já passou', () => {
        const from = new Date('2026-08-11T13:00:00.000Z')
        const next = computeNextRun(
            { ...base, frequency: 'once', date: '2026-08-01' },
            from,
        )
        expect(next).toBeNull()
    })

    it('nunca devolve um horário no passado', () => {
        const from = new Date('2026-08-11T12:00:00.000Z') // exatamente 09:00 BRT
        for (const frequency of ['daily', 'weekly', 'monthly'] as const) {
            const next = computeNextRun(
                { ...base, frequency, weekdays: [0, 1, 2, 3, 4, 5, 6], dayOfMonth: 11 },
                from,
            )
            expect(next!.getTime()).toBeGreaterThan(from.getTime())
        }
    })
})

describe('validateScheduleInput', () => {
    const valid = {
        subject: 'Assunto',
        content: '<p>oi</p>',
        frequency: 'daily',
        time: '09:00',
        recipients: { selectAll: true },
    }

    it('aceita um payload completo', () => {
        expect(validateScheduleInput(valid)).toBeNull()
    })

    it('exige assunto e conteúdo', () => {
        expect(validateScheduleInput({ ...valid, subject: '' })).toMatch(/assunto/i)
        expect(validateScheduleInput({ ...valid, content: '  ' })).toMatch(/conteúdo/i)
    })

    it('exige data no envio único', () => {
        expect(validateScheduleInput({ ...valid, frequency: 'once' })).toMatch(/data/i)
    })

    it('exige ao menos um dia no semanal', () => {
        expect(validateScheduleInput({ ...valid, frequency: 'weekly', weekdays: [] }))
            .toMatch(/dia da semana/i)
    })

    it('exige destinatários', () => {
        expect(validateScheduleInput({ ...valid, recipients: {} })).toMatch(/destinatário/i)
        expect(validateScheduleInput({ ...valid, recipients: { selectAll: false } }))
            .toMatch(/destinatário/i)
    })

    it('aceita filtros dinâmicos como destinatário', () => {
        expect(validateScheduleInput({
            ...valid,
            recipients: { filter: { accountType: 'trial' } },
        })).toBeNull()
    })
})
