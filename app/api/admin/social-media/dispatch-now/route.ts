import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { drainQueueNow } from '@/lib/comms/process'
import { advanceSequences } from '@/lib/comms/sequences'
import { registeredChannels } from '@/lib/comms/registry'

export const dynamic = 'force-dynamic'

/**
 * "Processar fila agora" — versão admin-autenticada do dispatcher, para o
 * botão manual no painel. Este projeto não usa Vercel Cron para a fila de
 * comunicação (removido de vercel.json); a maior parte do envio já sai na
 * hora pelo próprio endpoint de envio, e este botão cobre o restante (lotes
 * grandes) sem precisar do CRON_SECRET nem de um ticker externo rodando.
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
