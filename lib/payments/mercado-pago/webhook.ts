import crypto from 'crypto'
import { getPaymentConfig } from '../config'

/**
 * Validação do webhook do Mercado Pago.
 * Doc: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#editor_5
 *
 * Header `x-signature` tem formato: `ts=<timestamp>,v1=<hmacHex>`
 * O manifest é: `id:<dataId>;request-id:<xRequestId>;ts:<timestamp>;`
 * onde dataId vem de query.data.id ou query['data.id'].
 *
 * O hmacHex é calculado com HMAC-SHA256 usando o secret da aplicação MP.
 */
export interface WebhookValidationResult {
  valid: boolean
  reason?: string
  resourceId?: string
  topic?: string
  /** id usado para idempotência (x-request-id) */
  eventId?: string
}

export function validateMpWebhook(input: {
  rawBody: string
  headers: Record<string, string | string[] | undefined>
  queryParams: Record<string, string>
}): WebhookValidationResult {
  const cfg = getPaymentConfig()
  const secret = cfg.mp.webhookSecret

  const sigHeader = headerValue(input.headers, 'x-signature')
  const requestId = headerValue(input.headers, 'x-request-id') || ''

  // Topic + dataId — o MP às vezes envia via query, às vezes via body
  let topic = input.queryParams['type'] || input.queryParams['topic'] || ''
  let dataId =
    input.queryParams['data.id'] ||
    input.queryParams['id'] ||
    ''

  // Fallback ao body
  try {
    if (!topic || !dataId) {
      const parsed = JSON.parse(input.rawBody || '{}')
      if (!topic) topic = parsed.type || parsed.topic || ''
      if (!dataId) dataId = parsed.data?.id || parsed.id || ''
    }
  } catch {
    // body não-JSON; ignora
  }

  // Em ambientes sem secret configurado (ex.: dev local), aceitamos sem
  // validar a assinatura — mas registramos o aviso.
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { valid: false, reason: 'webhook secret não configurado' }
    }
    return {
      valid: true,
      resourceId: String(dataId || ''),
      topic: String(topic || ''),
      eventId: requestId || `${topic}:${dataId}`,
    }
  }

  if (!sigHeader) return { valid: false, reason: 'x-signature ausente' }

  // Parse "ts=...,v1=..."
  const parts = String(sigHeader)
    .split(',')
    .map(p => p.trim())
    .reduce<Record<string, string>>((acc, p) => {
      const [k, v] = p.split('=')
      if (k && v) acc[k] = v
      return acc
    }, {})

  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return { valid: false, reason: 'x-signature mal formatado' }

  // Replay protection: rejeita timestamps com mais de 5 minutos.
  const now = Date.now()
  const tsMs = Number(ts) * 1000
  if (!Number.isFinite(tsMs) || Math.abs(now - tsMs) > 5 * 60 * 1000) {
    return { valid: false, reason: 'timestamp fora da janela aceita' }
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const expected = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex')

  const ok =
    v1.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))

  if (!ok) return { valid: false, reason: 'assinatura inválida' }

  return {
    valid: true,
    resourceId: String(dataId || ''),
    topic: String(topic || ''),
    eventId: requestId || `${topic}:${dataId}:${ts}`,
  }
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string {
  const v = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(v)) return v[0] || ''
  return v || ''
}
