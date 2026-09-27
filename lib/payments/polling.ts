/**
 * Ritmo do acompanhamento de status na tela de pagamento (Pix, boleto, cartão
 * em análise) e a retomada de um pagamento pendente depois que o navegador
 * recarrega a aba.
 *
 * Arquivo puro — roda no navegador e nos testes.
 *
 * POR QUE: quem paga Pix pelo celular sai da página para o app do banco. O
 * polling antigo (4 s fixos, para sempre) gastava chamadas com a aba escondida
 * e, na volta, a pessoa esperava o próximo tique. Pior: o Android descarta
 * abas em segundo plano; ao voltar, a página recarregava sem o QR e sem
 * acompanhar nada — a aprovação só aparecia por e-mail, minutos depois.
 */

/** Intervalo até a próxima consulta, pelo tempo desde o início da espera. */
export function pollingDelayMs(elapsedMs: number): number {
  if (elapsedMs < 2 * 60_000) return 3_000 // janela em que quase todo Pix é pago
  if (elapsedMs < 10 * 60_000) return 6_000
  return 15_000
}

/** Por quanto tempo um pagamento pendente é retomado ao recarregar a aba. */
export const PENDING_RESUME_TTL_MS = 2 * 60 * 60_000

export interface PendingCheckoutSnapshot<TOrder = unknown, TMethod = string> {
  order: TOrder
  method: TMethod
  savedAt: number
}

export function pendingStorageKey(endpoint: string, description: string): string {
  return `checkout-pendente:${endpoint}:${description}`
}

/** Lê o pendente salvo, se ainda valer. Nunca lança (storage bloqueado, JSON ruim). */
export function readPendingCheckout<TOrder, TMethod>(
  storage: Pick<Storage, 'getItem' | 'removeItem'> | null | undefined,
  key: string,
  now: number = Date.now()
): PendingCheckoutSnapshot<TOrder, TMethod> | null {
  try {
    const raw = storage?.getItem(key)
    if (!raw) return null
    const snap = JSON.parse(raw) as PendingCheckoutSnapshot<TOrder, TMethod>
    const orderId = (snap?.order as any)?.orderId
    if (!orderId || typeof snap.savedAt !== 'number' || now - snap.savedAt > PENDING_RESUME_TTL_MS) {
      storage?.removeItem(key)
      return null
    }
    return snap
  } catch {
    return null
  }
}

export function writePendingCheckout(
  storage: Pick<Storage, 'setItem'> | null | undefined,
  key: string,
  snap: PendingCheckoutSnapshot
): void {
  try {
    storage?.setItem(key, JSON.stringify(snap))
  } catch {
    // Modo privado / cota cheia: a retomada é conveniência, não requisito.
  }
}

export function clearPendingCheckout(storage: Pick<Storage, 'removeItem'> | null | undefined, key: string): void {
  try {
    storage?.removeItem(key)
  } catch {}
}
