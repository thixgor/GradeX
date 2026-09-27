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
//   header x-vercel-cron — SÓ quando CRON_SECRET não está definida
//
// Por que o x-vercel-cron deixou de bastar sozinho: é um cabeçalho comum, que
// qualquer um pode mandar num curl. Valer sempre deixava qualquer pessoa
// disparar as rotinas (a de assinaturas rebaixa contas e faz centenas de
// chamadas ao Mercado Pago). Com CRON_SECRET definida, a própria Vercel manda
// `Authorization: Bearer <CRON_SECRET>` nas chamadas de cron — o segredo passa
// a ser obrigatório sem quebrar nada. Sem segredo configurado, o cabeçalho
// continua aceito para não parar as rotinas de um ambiente sem essa variável.
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
    const secret = (process.env.CRON_SECRET || '').trim()
    if (!secret) return !!request.headers.get('x-vercel-cron')

    const url = new URL(request.url)
    const candidates = [
        (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''),
        request.headers.get('x-cron-secret') || '',
        url.searchParams.get('secret') || '',
        url.searchParams.get('token') || '',
    ].map(s => s.trim())

    return candidates.some(c => c.length > 0 && safeEqual(c, secret))
}
