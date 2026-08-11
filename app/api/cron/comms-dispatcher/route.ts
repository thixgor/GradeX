import { NextRequest, NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { processAllChannels } from '@/lib/comms/process'
import { advanceSequences } from '@/lib/comms/sequences'
import { ensureDefaultJourney } from '@/lib/comms/default-journey'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Dispatcher da fila de comunicação multicanal (todos os canais).
 *
 * NÃO é registrado no Vercel Cron: o plano Hobby do projeto já usa o teto de
 * cron jobs com as outras rotinas. Ele é acionado por:
 *  1. O cron externo (cron-job.org). Para e-mail, prefira
 *     `/api/cron/email-scheduler`, que além de drenar a fila também roda os
 *     agendamentos — ver docs/EMAIL_AGENDAMENTO_CRONJOB.md. Este endpoint aqui
 *     é o que cobre os DEMAIS canais (WhatsApp).
 *  2. As próprias rotas de envio, que drenam a fila que acabaram de criar antes
 *     de responder (ver lib/comms/process.ts) — é o que faz o envio parecer
 *     instantâneo.
 *  3. Um ticker externo opcional (scripts/comms-ticker.js).
 *
 * A cada execução:
 *  1. Garante que a jornada padrão do lead exista (idempotente).
 *  2. Avança jornadas/sequências (matrícula devida → enfileira o próximo passo).
 *  3. Para cada canal registrado, reserva atomicamente um lote de mensagens
 *     pendentes/reagendadas (claim com lease evita processamento duplo),
 *     respeita o rate-limit e envia via adapter.
 *
 * É seguro rodar concorrentemente e é idempotente por mensagem.
 *
 * Autenticação: ver lib/cron-auth (Bearer CRON_SECRET, x-cron-secret ou
 * ?secret= / ?token= na URL).
 */
async function handle(request: NextRequest) {
    if (!isCronAuthorized(request)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    await ensureDefaultJourney()
    const sequences = await advanceSequences()
    const results = await processAllChannels()

    return NextResponse.json({ ok: true, at: new Date().toISOString(), sequences, results })
}

export async function GET(request: NextRequest) {
    return handle(request)
}

export async function POST(request: NextRequest) {
    return handle(request)
}
