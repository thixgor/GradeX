// ────────────────────────────────────────────────────────────────────────────
// Autenticação das rotas de cron.
//
// Extraído de app/api/cron/fulfillment-sweeper para ser reaproveitado por todas
// as rotinas agendadas. É deliberadamente tolerante a COMO o segredo chega,
// porque serviços externos (cron-job.org, UptimeRobot, curl no crontab do
// servidor) configuram isso de formas diferentes: alguns só deixam definir
// headers, outros só a URL.
//
// Formas aceitas (qualquer uma basta):
//   Authorization: Bearer <CRON_SECRET>
//   x-cron-secret: <CRON_SECRET>
//   ?secret=<CRON_SECRET>
//   ?token=<CRON_SECRET>
//   header x-vercel-cron (só a Vercel consegue enviá-lo)
// ────────────────────────────────────────────────────────────────────────────

import type { NextRequest } from 'next/server'

/** Comparação de tempo constante (evita vazar o segredo por timing). */
function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    let diff = 0
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return diff === 0
}

/** true quando a requisição está autorizada a rodar uma rotina de cron. */
export function isCronAuthorized(request: NextRequest): boolean {
    if (request.headers.get('x-vercel-cron')) return true

    const secret = (process.env.CRON_SECRET || '').trim()
    if (!secret) return false

    const url = new URL(request.url)
    const candidates = [
        (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''),
        request.headers.get('x-cron-secret') || '',
        url.searchParams.get('secret') || '',
        url.searchParams.get('token') || '',
    ].map(s => s.trim())

    return candidates.some(c => c.length > 0 && safeEqual(c, secret))
}
