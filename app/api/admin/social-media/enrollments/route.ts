import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
    listEnrollments,
    stopEnrollment,
    stopAllEnrollments,
    stopEnrollmentsForTarget,
} from '@/lib/comms/sequences'
import type { EnrollmentStatus } from '@/lib/comms/sequences'

export const dynamic = 'force-dynamic'

/** Lista matrículas de jornadas. GET ?sequenceKey=...&status=active&limit=100 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }
        const { searchParams } = new URL(request.url)
        const sequenceKey = searchParams.get('sequenceKey') || undefined
        const status = (searchParams.get('status') as EnrollmentStatus | null) || undefined
        const limit = Number(searchParams.get('limit')) || 100

        const enrollments = await listEnrollments({ sequenceKey, status, limit })
        return NextResponse.json({ enrollments })
    } catch (error) {
        console.error('Enrollments list error:', error)
        return NextResponse.json({ error: 'Erro ao listar matrículas' }, { status: 500 })
    }
}

interface CancelBody {
    action: 'cancel' | 'cancel-all' | 'cancel-for-target'
    enrollmentId?: string
    sequenceKey?: string
    email?: string
    phoneE164?: string
    leadUuid?: string
}

/** Cancela matrículas ativas de uma jornada. */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }
        const body: CancelBody = await request.json()

        if (body.action === 'cancel' && body.enrollmentId) {
            const result = await stopEnrollment(body.enrollmentId)
            return NextResponse.json(result)
        }
        if (body.action === 'cancel-all' && body.sequenceKey) {
            const result = await stopAllEnrollments(body.sequenceKey)
            return NextResponse.json(result)
        }
        if (body.action === 'cancel-for-target' && (body.email || body.phoneE164 || body.leadUuid)) {
            const result = await stopEnrollmentsForTarget({
                email: body.email,
                phoneE164: body.phoneE164,
                leadUuid: body.leadUuid,
            })
            return NextResponse.json(result)
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    } catch (error) {
        console.error('Enrollments cancel error:', error)
        return NextResponse.json({ error: 'Erro ao cancelar matrícula' }, { status: 500 })
    }
}
