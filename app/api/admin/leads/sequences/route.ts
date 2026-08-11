import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { SEQUENCES_COLLECTION } from '@/lib/comms/sequences'
import { ensureDefaultJourney } from '@/lib/comms/default-journey'
import type { Sequence } from '@/lib/comms/sequences'

export const dynamic = 'force-dynamic'

/**
 * Sequências (jornadas de nurturing) disponíveis para vincular a uma campanha
 * de captura de leads.
 *
 * Vivia em /api/admin/social-media/sequences; migrou para cá junto com a
 * remoção daquele módulo, já que quem usa a listagem é o editor de campanhas
 * de lead. A jornada padrão é criada na primeira consulta (idempotente), o que
 * antes dependia de um botão "seed" no painel removido.
 */
export async function GET() {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        await ensureDefaultJourney()

        const db = await getDb()
        const sequences = await db
            .collection<Sequence>(SEQUENCES_COLLECTION)
            .find()
            .sort({ createdAt: -1 })
            .toArray()

        return NextResponse.json({
            sequences: sequences.map(s => ({ ...s, _id: s._id?.toString() })),
        })
    } catch (error) {
        console.error('Sequences list error:', error)
        return NextResponse.json({ error: 'Erro ao listar sequências' }, { status: 500 })
    }
}
