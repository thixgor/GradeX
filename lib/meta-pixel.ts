// Meta (Facebook) Pixel — helpers de rastreamento de conversão.
//
// O Pixel só é ativado quando NEXT_PUBLIC_META_PIXEL_ID está definido. Sem o
// ID, todas as funções viram no-op — nada quebra em dev, preview ou enquanto
// o anúncio ainda não foi conectado. O ID do Pixel é público por natureza
// (aparece no HTML), então usa NEXT_PUBLIC_. O token da Conversions API, se
// um dia for adicionado, é secreto e NUNCA deve usar o prefixo NEXT_PUBLIC_.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''

type FbqParams = Record<string, unknown>

/**
 * Dispara um evento padrão do Pixel com segurança. Se o Pixel não carregou
 * (ID ausente, bloqueador de anúncio, ou chamado no servidor), simplesmente
 * não faz nada — nunca lança erro.
 *
 * `eventID` permite deduplicação futura com a Conversions API (server-side):
 * o mesmo evento enviado pelo navegador e pelo servidor com o mesmo eventID
 * é contado uma vez só pelo Meta.
 */
export function trackMeta(event: string, params?: FbqParams, eventID?: string): void {
  if (typeof window === 'undefined') return
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
  if (typeof fbq !== 'function') return
  if (eventID) fbq('track', event, params || {}, { eventID })
  else fbq('track', event, params || {})
}
