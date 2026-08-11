import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
    DEFAULT_TIMEZONE,
    createSchedule,
    listSchedules,
    validateScheduleInput,
} from '@/lib/comms/email-schedules'
import type { ScheduleFrequency } from '@/lib/comms/email-schedules'
import type { RecipientSpec } from '@/lib/comms/email-campaigns'

export const dynamic = 'force-dynamic'

interface SchedulePayload {
    name?: string
    subject?: string
    previewText?: string
    content?: string
    blocks?: unknown[]
    recipients?: RecipientSpec
    frequency?: ScheduleFrequency
    time?: string
    timezone?: string
    weekdays?: number[]
    dayOfMonth?: number
    date?: string
    isActive?: boolean
}

export async function GET() {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const schedules = await listSchedules()
        return NextResponse.json({
            schedules: schedules.map(s => ({ ...s, _id: s._id?.toString() })),
        })
    } catch (error) {
        console.error('List schedules error:', error)
        return NextResponse.json({ error: 'Erro ao listar agendamentos' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body: SchedulePayload = await request.json()
        const validation = validateScheduleInput(body)
        if (validation) {
            return NextResponse.json({ error: validation }, { status: 400 })
        }

        const schedule = await createSchedule({
            name: (body.name || body.subject || 'Agendamento').slice(0, 160),
            subject: body.subject!,
            previewText: body.previewText || '',
            content: body.content!,
            blocks: Array.isArray(body.blocks) ? body.blocks : [],
            recipients: body.recipients || {},
            frequency: body.frequency!,
            time: body.time || '09:00',
            timezone: body.timezone || DEFAULT_TIMEZONE,
            weekdays: body.weekdays,
            dayOfMonth: body.dayOfMonth,
            date: body.date,
            isActive: body.isActive !== false,
            createdBy: session.userId,
        })

        if (schedule.isActive && !schedule.nextRunAt) {
            return NextResponse.json(
                { error: 'A data/hora escolhida já passou. Escolha um horário futuro.' },
                { status: 400 },
            )
        }

        return NextResponse.json({ schedule: { ...schedule, _id: schedule._id?.toString() } })
    } catch (error) {
        console.error('Create schedule error:', error)
        return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 })
    }
}
