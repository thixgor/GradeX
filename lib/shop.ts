/**
 * Helpers da loja física (produtos físicos / pedidos).
 * Cálculo de frete por região/UF, prazo estimado, número de pedido e rótulos
 * de status. Sem dependências de rede — apenas lógica pura + acesso a settings.
 */

import type {
  DeliveryMethod,
  PhysicalProduct,
  PhysicalProductVersion,
  ShopOrderStatus,
  ShopSettings,
} from './types'

/** Preço cheio (avulso) de um produto físico, considerando a versão escolhida. */
export function physicalFullPrice(p: Pick<PhysicalProduct, 'price'>, version?: PhysicalProductVersion | null): number {
  return typeof version?.price === 'number' ? version.price : p.price
}

/**
 * Preço de add-on (aplicado quando comprado JUNTO ao material/pacote vinculado):
 * versão.addonSurcharge → produto.addonSurcharge → preço cheio (fallback).
 */
export function physicalAddonPrice(
  p: Pick<PhysicalProduct, 'price' | 'addonSurcharge'>,
  version?: PhysicalProductVersion | null
): number {
  if (typeof version?.addonSurcharge === 'number') return version.addonSurcharge
  if (typeof p.addonSurcharge === 'number') return p.addonSurcharge
  return physicalFullPrice(p, version)
}

/** Mapa UF → macro-região (para frete por região quando não há valor por UF). */
export const UF_TO_REGION: Record<string, 'N' | 'NE' | 'CO' | 'SE' | 'S'> = {
  AC: 'N', AP: 'N', AM: 'N', PA: 'N', RO: 'N', RR: 'N', TO: 'N',
  AL: 'NE', BA: 'NE', CE: 'NE', MA: 'NE', PB: 'NE', PE: 'NE', PI: 'NE', RN: 'NE', SE: 'NE',
  DF: 'CO', GO: 'CO', MT: 'CO', MS: 'CO',
  ES: 'SE', MG: 'SE', RJ: 'SE', SP: 'SE',
  PR: 'S', RS: 'S', SC: 'S',
}

export const UFS: string[] = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export const REGION_LABELS: Record<string, string> = {
  N: 'Norte', NE: 'Nordeste', CO: 'Centro-Oeste', SE: 'Sudeste', S: 'Sul',
  default: 'Padrão (todas as regiões)',
}

/**
 * Resolve o frete de um método de entrega para uma UF, seguindo a precedência:
 * UF exata → macro-região → 'default' → 0.
 */
export function resolveFreight(method: DeliveryMethod, uf?: string | null): number {
  const table = method.freightByRegion || {}
  const normUf = (uf || '').toUpperCase().trim()
  if (normUf && typeof table[normUf] === 'number') return Math.max(0, table[normUf])
  const region = normUf ? UF_TO_REGION[normUf] : undefined
  if (region && typeof table[region] === 'number') return Math.max(0, table[region])
  if (typeof table.default === 'number') return Math.max(0, table.default)
  return 0
}

/**
 * Frete final considerando regras de frete grátis:
 *  - método marcado como `freeShipping` → 0;
 *  - `freeShippingThreshold` das settings atingido pelo subtotal físico → 0;
 *  - senão, `resolveFreight(method, uf)`.
 */
export function computeFreight(opts: {
  method?: DeliveryMethod | null
  uf?: string | null
  physicalSubtotal: number
  settings?: Pick<ShopSettings, 'freeShippingThreshold'> | null
}): number {
  const { method, uf, physicalSubtotal, settings } = opts
  if (!method) return 0
  if (method.freeShipping) return 0
  const threshold = settings?.freeShippingThreshold
  if (typeof threshold === 'number' && threshold > 0 && physicalSubtotal >= threshold) return 0
  return resolveFreight(method, uf)
}

/**
 * Calcula a data estimada de entrega: hoje + (maior prazo de produção entre os
 * itens sob encomenda) + prazo do método de entrega (dias máx). Para retirada,
 * considera apenas o prazo de produção.
 */
export function estimateDeliveryDate(opts: {
  method?: DeliveryMethod | null
  maxProductionDays?: number
  deliveryType: 'pickup' | 'shipping'
  from?: Date
}): Date {
  const base = opts.from ? new Date(opts.from) : new Date()
  const production = Math.max(0, opts.maxProductionDays || 0)
  const shipping = opts.deliveryType === 'shipping' && opts.method ? opts.method.estimatedDaysMax : 0
  const totalDays = production + shipping
  const target = new Date(base)
  target.setDate(target.getDate() + totalDays)
  return target
}

/** Gera um número de pedido curto e legível, ex.: "A1B2C3". */
export function generateOrderNumber(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

/** Rótulo em pt-BR de um status de pedido físico. */
export const SHOP_STATUS_LABELS: Record<ShopOrderStatus, string> = {
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pagamento confirmado',
  in_production: 'Em produção',
  ready: 'Pronto',
  shipped: 'Enviado',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

/**
 * Etapas da timeline mostradas ao usuário (na ordem). Para retirada, 'shipped'
 * e 'out_for_delivery' são substituídos por 'ready'.
 */
export function timelineSteps(deliveryType: 'pickup' | 'shipping'): ShopOrderStatus[] {
  if (deliveryType === 'pickup') {
    return ['paid', 'in_production', 'ready', 'delivered']
  }
  return ['paid', 'in_production', 'shipped', 'out_for_delivery', 'delivered']
}

/** Índice do status atual na timeline (para preencher a barra de progresso). */
export function statusStepIndex(status: ShopOrderStatus, deliveryType: 'pickup' | 'shipping'): number {
  const steps = timelineSteps(deliveryType)
  const idx = steps.indexOf(status)
  if (idx >= 0) return idx
  // awaiting_payment fica antes do início; cancelado/reembolsado tratados à parte
  if (status === 'awaiting_payment') return -1
  return steps.length - 1
}

/** Settings padrão criados na primeira leitura (inclui o ponto Afya Unigranrio Barra). */
export function defaultShopSettings(): Omit<ShopSettings, '_id'> {
  return {
    settingsId: 'shop',
    deliveryMethods: [],
    pickupPoints: [
      {
        id: 'afya-unigranrio-barra',
        name: 'Afya Unigranrio Barra',
        address: 'Afya Unigranrio — Campus Barra, Rio de Janeiro/RJ',
        enabled: true,
      },
    ],
    sellerFooter: 'Entregue por DomineAqui LTDA — Rio de Janeiro',
    updatedAt: new Date(),
  }
}
