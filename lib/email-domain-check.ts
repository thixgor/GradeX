import { promises as dns } from 'node:dns'

/**
 * O domínio do e-mail digitado consegue RECEBER e-mail?
 *
 * Complementa `lib/email-check.ts`: lá conferimos o que dá para conferir sem
 * sair do navegador (formato, erro de digitação parecido com um provedor
 * conhecido); aqui perguntamos ao DNS se aquele domínio existe e anuncia
 * servidor de correio. É o que pega o domínio inventado que não se parece com
 * nada — `@meuemial.xyz` — e que na compra sem login termina em reembolso.
 */

export type EmailDomainStatus =
  /** Tem MX (ou ao menos endereço, o fallback implícito do RFC 5321). */
  | 'ok'
  /** O DNS respondeu, e a resposta é "esse domínio não recebe e-mail". */
  | 'undeliverable'
  /** Não deu para saber: timeout, SERVFAIL, rede. Nunca penaliza ninguém. */
  | 'unknown'

/** Consulta de DNS é lenta o bastante para valer cache, e estável o bastante. */
const TTL_MS = 6 * 60 * 60 * 1000
const MAX_ENTRIES = 500
const TIMEOUT_MS = 2_500

const cache = new Map<string, { status: EmailDomainStatus; at: number }>()

function readCache(domain: string): EmailDomainStatus | null {
  const hit = cache.get(domain)
  if (!hit) return null
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(domain)
    return null
  }
  return hit.status
}

function writeCache(domain: string, status: EmailDomainStatus) {
  // `unknown` é um não-resultado: guardá-lo faria uma falha passageira de rede
  // valer por horas para todo mundo que digitasse aquele domínio.
  if (status === 'unknown') return
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(domain, { status, at: Date.now() })
}

/** Erros que significam "o DNS respondeu, e a resposta é não". */
const NEGATIVE_DNS_CODES = new Set(['ENOTFOUND', 'ENODATA', 'NXDOMAIN'])

function isNegative(err: unknown): boolean {
  return NEGATIVE_DNS_CODES.has(String((err as any)?.code || ''))
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('dns_timeout')), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Nunca lança e nunca demora mais que `TIMEOUT_MS`. Na dúvida devolve
 * `unknown`: recusar uma compra real por causa de um SERVFAIL passageiro é pior
 * do que deixar passar um endereço suspeito, que ainda vai ser conferido pela
 * pessoa na tela de confirmação.
 */
export async function checkEmailDomain(domain: unknown): Promise<EmailDomainStatus> {
  const normalized = String(domain || '').trim().toLowerCase()
  if (!normalized || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized)) return 'unknown'

  const cached = readCache(normalized)
  if (cached) return cached

  let status: EmailDomainStatus = 'unknown'
  try {
    const mx = await withTimeout(dns.resolveMx(normalized), TIMEOUT_MS)
    status = mx.some(record => record.exchange) ? 'ok' : 'undeliverable'
  } catch (err) {
    if (!isNegative(err)) {
      writeCache(normalized, 'unknown')
      return 'unknown'
    }
    // Sem MX ainda pode receber: o RFC 5321 manda cair no endereço do próprio
    // domínio. Domínio pequeno com um servidor só costuma ser exatamente isso.
    try {
      const addresses = await withTimeout(dns.resolve4(normalized), TIMEOUT_MS)
      status = addresses.length > 0 ? 'ok' : 'undeliverable'
    } catch (fallbackErr) {
      status = isNegative(fallbackErr) ? 'undeliverable' : 'unknown'
    }
  }

  writeCache(normalized, status)
  return status
}
