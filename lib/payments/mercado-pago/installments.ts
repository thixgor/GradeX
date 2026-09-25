import { parsePayerCosts, type ProviderPayerCost } from '../fees'
import { getEffectiveMpAuth } from './marketplace-store'

/**
 * Parcelamento que o Mercado Pago oferece para um cartão, consultado no
 * servidor com a mesma conta que vai processar o pagamento.
 *
 * O checkout faz a mesma consulta no navegador (`getInstallments` do
 * mercadopago.js) para MOSTRAR as parcelas; o servidor refaz porque é ele quem
 * decide o `transaction_amount` e não pode confiar no que a tela disse sobre
 * quem paga os juros.
 *
 * Devolve `null` quando a consulta falha (rede, timeout, resposta estranha) —
 * quem chama decide o fallback. Nunca lança.
 */
export async function fetchMercadoPagoPayerCosts(input: {
  amount: number
  paymentMethodId: string
  issuerId?: string | null
}): Promise<ProviderPayerCost[] | null> {
  try {
    const auth = await getEffectiveMpAuth()
    if (!auth.accessToken) return null

    const params = new URLSearchParams({
      amount: input.amount.toFixed(2),
      payment_method_id: input.paymentMethodId,
      payment_type_id: 'credit_card',
    })
    if (input.issuerId) params.set('issuer.id', String(input.issuerId))

    const res = await fetch(`https://api.mercadopago.com/v1/payment_methods/installments?${params}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.warn('[mp/installments] consulta recusada:', res.status, await res.text().catch(() => ''))
      return null
    }
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    // Mais de uma linha só acontece sem `issuer.id`; nesse caso preferimos a do
    // emissor informado e, na falta dele, a primeira da bandeira pedida.
    const linha =
      data.find((d: any) => input.issuerId && String(d?.issuer?.id) === String(input.issuerId)) ||
      data.find((d: any) => d?.payment_method_id === input.paymentMethodId) ||
      data[0]
    const custos = parsePayerCosts(linha?.payer_costs)
    return custos.length ? custos : null
  } catch (err) {
    console.warn('[mp/installments] falha ao consultar parcelamento:', err)
    return null
  }
}
