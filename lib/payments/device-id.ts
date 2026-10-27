/**
 * Device ID do antifraude do Mercado Pago, no navegador.
 *
 * O `security.js` do MP gera `window.MP_DEVICE_SESSION_ID`, que vai no header
 * `X-meli-session-id` do pagamento. Sem ele o antifraude não reconhece o
 * aparelho e recusa bem mais cartão bom como `cc_rejected_high_risk`. O script
 * é assíncrono: quem preenche o cartão rápido (autopreenchimento) chegava a
 * pagar antes de ele terminar, e a tentativa ia sem device ID.
 */

const SCRIPT_URL = 'https://www.mercadopago.com/v2/security.js'

declare global {
  interface Window {
    /** Device ID do antifraude, gerado pelo script de segurança do Mercado Pago. */
    MP_DEVICE_SESSION_ID?: string
  }
}

/** Device ID, se o script de segurança já tiver gerado. */
export function lerDeviceId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const id = window.MP_DEVICE_SESSION_ID
  return typeof id === 'string' && id.trim() ? id.trim() : undefined
}

/** Injeta o script de segurança uma vez por página. Nunca lança. */
export function carregarScriptAntifraude(): void {
  if (typeof window === 'undefined' || lerDeviceId()) return
  try {
    if (document.querySelector('script[data-mp-security]')) return
    const s = document.createElement('script')
    s.src = SCRIPT_URL
    s.async = true
    s.setAttribute('view', 'checkout')
    s.setAttribute('data-mp-security', '1')
    document.head.appendChild(s)
  } catch {
    /* sem o script, o pagamento segue sem device ID */
  }
}

/**
 * Device ID, esperando até `limiteMs` o script terminar. Bloqueado por
 * extensão ou rede ruim, desiste no prazo e o pagamento segue sem ele.
 */
export async function esperarDeviceId(limiteMs = 2500): Promise<string | undefined> {
  const pronto = lerDeviceId()
  if (pronto || typeof window === 'undefined') return pronto
  carregarScriptAntifraude()
  const fim = Date.now() + limiteMs
  while (Date.now() < fim) {
    await new Promise(r => setTimeout(r, 100))
    const id = lerDeviceId()
    if (id) return id
  }
  return undefined
}
