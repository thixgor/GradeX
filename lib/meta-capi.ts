// Meta Conversions API (CAPI) — envio de eventos de conversão pelo servidor.
//
// Por que existe, além do Pixel do navegador:
//   • Pix e boleto confirmam DEPOIS que o usuário já saiu da página — só o
//     servidor (via webhook do Mercado Pago) sabe da aprovação. O Pixel no
//     navegador nunca veria essas vendas.
//   • iOS 14.5+, bloqueadores e o navegador interno do Instagram derrubam
//     parte dos eventos do navegador. O envio server-side recupera esses.
//
// Deduplicação: o mesmo Purchase é enviado pelo navegador (Pixel) e pelo
// servidor (CAPI) com o MESMO `eventId` (o id do pedido). O Meta conta uma vez.
//
// Vercel Free: isto é um único fetch curto, chamado de dentro de um handler
// que já existe (o webhook / efeito de pagamento). Sem job always-on, sem
// dependência externa, com timeout para nunca segurar a função. Desligado por
// completo enquanto as variáveis de ambiente não estiverem definidas.

import { createHash } from 'crypto'

const GRAPH_VERSION = 'v19.0'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
const ACCESS_TOKEN = process.env.META_CONVERSIONS_API_TOKEN || ''
// Opcional: código de teste do Events Manager para validar em "Test Events".
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || ''

export function isMetaCapiConfigured(): boolean {
  return Boolean(PIXEL_ID && ACCESS_TOKEN)
}

// Meta exige dados de identificação com hash SHA-256 (e-mail/telefone/id).
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function hashEmail(email?: string | null): string | undefined {
  if (!email) return undefined
  const normalized = email.trim().toLowerCase()
  if (!normalized) return undefined
  return sha256(normalized)
}

function hashExternalId(id?: string | null): string | undefined {
  if (!id) return undefined
  const normalized = String(id).trim()
  if (!normalized) return undefined
  return sha256(normalized)
}

export interface MetaCapiEventInput {
  eventName: 'Purchase' | 'CompleteRegistration' | 'InitiateCheckout' | 'Lead' | 'ViewContent'
  /** Mesmo id usado no Pixel do navegador para deduplicar (ex.: id do pedido). */
  eventId: string
  value?: number
  currency?: string
  email?: string | null
  userId?: string | null
  contentName?: string
  eventSourceUrl?: string
  clientIp?: string
  clientUserAgent?: string
  /** Cookies do Pixel, quando disponíveis, melhoram a taxa de correspondência. */
  fbp?: string
  fbc?: string
}

/**
 * Envia um evento para a Conversions API. Nunca lança: qualquer falha é
 * registrada e engolida para não afetar o fluxo de pagamento. Retorna `true`
 * se o Meta aceitou o evento.
 */
export async function sendMetaCapiEvent(input: MetaCapiEventInput): Promise<boolean> {
  if (!isMetaCapiConfigured()) return false

  const userData: Record<string, unknown> = {}
  const em = hashEmail(input.email)
  if (em) userData.em = [em]
  const externalId = hashExternalId(input.userId)
  if (externalId) userData.external_id = [externalId]
  if (input.clientIp) userData.client_ip_address = input.clientIp
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent
  if (input.fbp) userData.fbp = input.fbp
  if (input.fbc) userData.fbc = input.fbc

  const customData: Record<string, unknown> = {}
  if (typeof input.value === 'number') customData.value = input.value
  if (input.currency || typeof input.value === 'number') customData.currency = input.currency || 'BRL'
  if (input.contentName) {
    customData.content_name = input.contentName
    customData.content_type = 'product'
  }

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: userData,
        custom_data: customData,
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    )
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[meta-capi] evento rejeitado', res.status, detail.slice(0, 300))
      return false
    }
    return true
  } catch (error) {
    console.error('[meta-capi] falha ao enviar evento:', (error as Error)?.message || error)
    return false
  } finally {
    clearTimeout(timeout)
  }
}
