import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { SEQUENCES_COLLECTION } from '@/lib/comms/sequences'
import { ensureDefaultJourney } from '@/lib/comms/default-journey'
import type { Sequence } from '@/lib/comms/sequences'

export const dynamic = 'force-dynamic'

/** Lista as sequências/jornadas cadastradas. */
export async function GET() {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }
        const db = await getDb()
        const sequences = await db
            .collection<Sequence>(SEQUENCES_COLLECTION)
            .find()
            .sort({ createdAt: -1 })
            .toArray()
        return NextResponse.json({ sequences })
    } catch (error) {
        console.error('Sequences list error:', error)
        return NextResponse.json({ error: 'Erro ao listar sequências' }, { status: 500 })
    }
}

/**
 * POST { action: 'seed-default' } → cria a jornada padrão se não existir.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }
        const { action } = await request.json().catch(() => ({ action: 'seed-default' }))
        if (action === 'seed-default') {
            const seq = await ensureDefaultJourney()
            return NextResponse.json({ success: true, sequence: seq })
        }
        return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
    } catch (error) {
        console.error('Sequences seed error:', error)
        return NextResponse.json({ error: 'Erro ao criar sequência' }, { status: 500 })
    }
}
