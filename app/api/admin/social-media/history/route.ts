import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { statsByStatus, OUTBOX_COLLECTION } from '@/lib/comms/outbox'
import type { CommChannel } from '@/lib/comms/types'

export const dynamic = 'force-dynamic'

/**
 * Histórico unificado (e-mail + WhatsApp) a partir da outbox.
 * GET ?channel=email|whatsapp&status=...&limit=50
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const channel = searchParams.get('channel') as CommChannel | null
        const status = searchParams.get('status')
        const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)

        const db = await getDb()

        const filter: Record<string, unknown> = {}
        if (channel) filter.channel = channel
        if (status) filter.status = status

        const messages = await db
            .collection(OUTBOX_COLLECTION)
            .find(filter)
            .project({
                channel: 1,
                status: 1,
                'to.email': 1,
                'to.phoneE164': 1,
                'to.name': 1,
                templateKey: 1,
                campaignId: 1,
                attempts: 1,
                lastError: 1,
                createdAt: 1,
                sentAt: 1,
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray()

        const stats = await statsByStatus(channel ? { channel } : {})

        return NextResponse.json({ messages, stats })
    } catch (error) {
        console.error('Social-media history error:', error)
        return NextResponse.json({ error: 'Erro ao carregar histórico' }, { status: 500 })
    }
}
