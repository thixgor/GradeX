import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
    deleteSchedule,
    getSchedule,
    updateSchedule,
} from '@/lib/comms/email-schedules'
import { runSchedule } from '@/lib/comms/email-scheduler'
import { drainQueueNow } from '@/lib/comms/process'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/** Editar (ex.: ativar/pausar) um agendamento. */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body = await request.json()
        const schedule = await updateSchedule(params.id, body)
        if (!schedule) {
            return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
        }

        if (schedule.isActive && !schedule.nextRunAt) {
            return NextResponse.json(
                { error: 'Não há próxima execução para este agendamento (a data já passou).' },
                { status: 400 },
            )
        }

        return NextResponse.json({ schedule: { ...schedule, _id: schedule._id?.toString() } })
    } catch (error) {
        console.error('Update schedule error:', error)
        return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 })
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const removed = await deleteSchedule(params.id)
        if (!removed) {
            return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
        }
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete schedule error:', error)
        return NextResponse.json({ error: 'Erro ao excluir agendamento' }, { status: 500 })
    }
}

/**
 * "Executar agora": dispara o agendamento fora de hora, sem mexer no
 * calendário dele. Serve para testar o conteúdo antes de deixar rodando.
 */
export async function POST(
    _request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const schedule = await getSchedule(params.id)
        if (!schedule) {
            return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
        }

        const result = await runSchedule(schedule)
        if (result.status === 'error') {
            return NextResponse.json({ error: result.error || 'Falha ao executar' }, { status: 500 })
        }
        if (result.status === 'empty') {
            return NextResponse.json(
                { error: 'Nenhum destinatário válido para este agendamento agora.' },
                { status: 400 },
            )
        }

        await drainQueueNow(['email'], { timeBudgetMs: 30_000 })

        return NextResponse.json({
            success: true,
            campaignId: result.campaignId,
            recipients: result.recipients,
        })
    } catch (error) {
        console.error('Run schedule error:', error)
        return NextResponse.json({ error: 'Erro ao executar agendamento' }, { status: 500 })
    }
}
