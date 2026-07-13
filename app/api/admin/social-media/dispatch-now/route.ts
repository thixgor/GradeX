import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { drainQueueNow } from '@/lib/comms/process'
import { advanceSequences } from '@/lib/comms/sequences'
import { registeredChannels } from '@/lib/comms/registry'

export const dynamic = 'force-dynamic'

/**
 * "Processar fila agora" — versão admin-autenticada do dispatcher, para o
 * botão manual no painel. Existe porque no plano Hobby da Vercel o Cron só
 * roda 1x/dia; isso dá ao admin um jeito de destravar a fila na hora sem
 * depender do ticker externo (scripts/comms-ticker.js) estar rodando.
 */
export async function POST() {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const sequences = await advanceSequences()
        const results = await drainQueueNow(registeredChannels(), { timeBudgetMs: 45_000 })

        return NextResponse.json({ ok: true, at: new Date().toISOString(), sequences, results })
    } catch (error) {
        console.error('Dispatch-now error:', error)
        return NextResponse.json({ error: 'Erro ao processar a fila' }, { status: 500 })
    }
}
