import type { Material, PaymentOrder } from '../types'

export type ItemDoPedido = { title: string; kind: string; amount: number; quantity: number; free?: boolean }
export type PedidoFisico = {
  total?: number
  freight?: number
  items?: Array<{ title?: string; versionName?: string; quantity?: number; unitPrice?: number }>
}

/**
 * O que foi comprado em cada pedido, item a item. É o que deixa claro no
 * painel quando a compra foi um carrinho, um item com impresso junto, ou um
 * produto só — antes a linha mostrava só um título.
 */
export function itensDoPedido(
  order: PaymentOrder,
  product: { title: string; type: string },
  materialsById: Map<string, Pick<Material, 'type'>>,
  pedidosFisicos: Map<string, PedidoFisico>
): ItemDoPedido[] {
  const tipoDoItem = (raw: any) => {
    if (raw?.itemType === 'package') return 'Pacote'
    const material = raw?.itemId ? materialsById.get(String(raw.itemId)) : undefined
    const flashcard = raw?.materialType === 'flashcard_deck' || !!raw?.linkedDeckSlug || (material?.type as string | undefined) === 'flashcard_deck'
    return flashcard ? 'Flashcard' : 'Material'
  }

  const idDoFisico = order.metadata?.shopOrderId || (order.type === 'physical' ? order.refId : undefined)
  const fisico = idDoFisico ? pedidosFisicos.get(String(idDoFisico)) : undefined
  const impressos: ItemDoPedido[] = (fisico?.items || []).map((it) => {
    const quantidade = Number(it.quantity || 1)
    return {
      title: it.versionName ? `${it.title || 'Impresso'} — ${it.versionName}` : String(it.title || 'Impresso'),
      kind: 'Impresso',
      amount: Number(it.unitPrice || 0) * quantidade,
      quantity: quantidade,
    }
  })
  if (Number(fisico?.freight || 0) > 0) {
    impressos.push({ title: 'Frete dos impressos', kind: 'Frete', amount: Number(fisico?.freight || 0), quantity: 1 })
  }

  const digitais: ItemDoPedido[] = []
  if (order.type === 'material' && order.metadata?.itemType === 'cart') {
    for (const raw of Array.isArray(order.metadata?.cartItems) ? order.metadata.cartItems : []) {
      digitais.push({ title: String(raw?.itemTitle || 'Item'), kind: tipoDoItem(raw), amount: Number(raw?.price || 0), quantity: 1 })
    }
    for (const raw of Array.isArray(order.metadata?.freeItems) ? order.metadata.freeItems : []) {
      digitais.push({ title: String(raw?.itemTitle || 'Item'), kind: tipoDoItem(raw), amount: 0, quantity: 1, free: true })
    }
  } else if (order.type !== 'physical') {
    // Com impresso junto, o pedido cobra os dois: o digital é o preço da
    // compra (sem a taxa do cartão) menos o total do pedido físico.
    const base = Number(order.baseAmount ?? order.amount ?? 0)
    const valor = fisico ? Math.max(0, base - Number(fisico.total || 0)) : Number(order.amount || 0)
    digitais.push({ title: product.title, kind: product.type, amount: Math.round(valor * 100) / 100, quantity: 1 })
  }
  return [...digitais, ...impressos]
}
