/**
 * Regras puras do benefício PROUNI/FIES — tipos, limites e aritmética.
 *
 * Separado de `lib/prouni-fies.ts` por uma razão prática: aquele módulo fala
 * com o Mongo, e importá-lo de um componente arrastaria o driver do banco para
 * dentro do pacote do navegador. O checkout precisa da MESMA conta que o
 * servidor usa para cobrar — mostrar um total e cobrar outro é o pior defeito
 * possível numa tela de pagamento —, então a conta mora aqui, sem dependência
 * nenhuma, e os dois lados a importam.
 *
 * O cliente usar esta matemática não a torna confiável: o preço cobrado é
 * sempre o que o servidor recalcula. Aqui ela só serve para a tela dizer a
 * verdade antes do clique.
 */

export type ProuniItemType = 'material' | 'package' | 'manual_clinico' | 'plus'
export type ProuniDiscountType = 'percentage' | 'fixed'
export type ProuniProgram = 'prouni' | 'fies'
export type ProuniRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
/** Ciclo de uso da concessão aprovada. Espelha o de resgate de cupom. */
export type ProuniGrantUsage = 'available' | 'reserved' | 'used' | 'revoked'

export const PROUNI_PROGRAMS: ProuniProgram[] = ['prouni', 'fies']

export const PROUNI_PROGRAM_LABELS: Record<ProuniProgram, string> = {
  prouni: 'ProUni',
  fies: 'FIES',
}

/**
 * Versão do texto aceito pelo solicitante. Muda quando o texto muda — é o que
 * permite provar, depois, QUAL declaração aquela pessoa assinou.
 */
export const PROUNI_TERMS_VERSION = '2026-08-22'

/* =================== LIMITES (anti-flood / anti-abuso) =================== */

/** Anexos por solicitação. Três cobre "termo + contrato + documento". */
export const PROUNI_MAX_ATTACHMENTS = 3
/** Teto por arquivo. Comprovante é papel escaneado, não acervo. */
export const PROUNI_MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
/** Teto somado — impede 3 arquivos no limite virarem 24 MB por solicitação. */
export const PROUNI_MAX_TOTAL_BYTES = 16 * 1024 * 1024
/** Tipos aceitos. Sem SVG, sem HTML, sem zip: só papel digitalizado. */
export const PROUNI_ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const
/** Solicitações abertas (pendentes) que uma conta pode manter de uma vez. */
export const PROUNI_MAX_PENDING_PER_USER = 3
/** Solicitações criadas por conta em 24h, somando aprovadas e recusadas. */
export const PROUNI_MAX_REQUESTS_PER_DAY = 5
/** Espera obrigatória para tentar de novo o MESMO item após uma recusa. */
export const PROUNI_REJECTED_COOLDOWN_HOURS = 24

export class ProuniError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ProuniError'
    this.status = status
  }
}

/* =================== HELPERS DE VALOR =================== */

export function roundMoney(value: number) {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100)
}

function formatMoney(value: number) {
  return `R$ ${roundMoney(value).toFixed(2).replace('.', ',')}`
}

export function getProuniDiscountLabel(input: { discountType: ProuniDiscountType; discountValue: number }) {
  if (input.discountType === 'percentage') return `${Number(input.discountValue || 0)}% OFF`
  return `${formatMoney(input.discountValue)} OFF`
}

/**
 * Desconto em reais sobre uma base. Nunca passa da base — um benefício de
 * R$ 50 num item de R$ 30 desconta R$ 30, e o pedido não fica negativo.
 */
export function computeProuniDiscount(
  discountType: ProuniDiscountType,
  discountValue: number,
  baseAmount: number
) {
  const base = roundMoney(baseAmount)
  const value = Math.max(0, Number(discountValue || 0))
  if (base <= 0 || value <= 0) return 0
  if (discountType === 'percentage') {
    return roundMoney(Math.min(base, base * (Math.min(100, value) / 100)))
  }
  return roundMoney(Math.min(base, value))
}

export type ProuniAppliedSource = 'none' | 'tier' | 'coupon' | 'prouni' | 'prouni_tier'

/**
 * Decide qual desconto vale nesta compra.
 *
 * Existe para que a decisão seja UMA só, escrita num lugar só: os quatro
 * checkouts (material avulso, carrinho, Manual Clínico e plano) chamam esta
 * função e não repetem a regra. Sem isso, "o PROUNI empilha com lote?" teria
 * quatro respostas possíveis, e a divergência só apareceria na fatura de
 * alguém.
 */
export function combineDiscountsWithProuni(input: {
  basePrice: number
  tierDiscountAmount?: number
  couponDiscountAmount?: number
  prouni?: { discountType: ProuniDiscountType; discountValue: number; stackWithTier: boolean } | null
}): {
  finalPrice: number
  appliedSource: ProuniAppliedSource
  appliedDiscountAmount: number
  tierDiscountApplied: number
  couponDiscountApplied: number
  prouniDiscountApplied: number
} {
  const base = roundMoney(input.basePrice)
  const tier = Math.max(0, roundMoney(input.tierDiscountAmount || 0))
  const coupon = Math.max(0, roundMoney(input.couponDiscountAmount || 0))

  const semNada = {
    finalPrice: base,
    appliedSource: 'none' as ProuniAppliedSource,
    appliedDiscountAmount: 0,
    tierDiscountApplied: 0,
    couponDiscountApplied: 0,
    prouniDiscountApplied: 0,
  }
  if (base <= 0) return semNada

  const prouniAmount = input.prouni
    ? computeProuniDiscount(input.prouni.discountType, input.prouni.discountValue, base)
    : 0

  // Empilhado: o lote desconta primeiro, o PROUNI incide sobre o que sobrou.
  // O cupom fica de fora — ver o bloco "Sobrepor lotes" no topo.
  if (input.prouni?.stackWithTier && tier > 0 && prouniAmount > 0) {
    const afterTier = roundMoney(Math.max(0, base - tier))
    const prouniOnTop = computeProuniDiscount(
      input.prouni.discountType,
      input.prouni.discountValue,
      afterTier
    )
    return {
      finalPrice: roundMoney(Math.max(0, afterTier - prouniOnTop)),
      appliedSource: 'prouni_tier',
      appliedDiscountAmount: roundMoney(tier + prouniOnTop),
      tierDiscountApplied: tier,
      couponDiscountApplied: 0,
      prouniDiscountApplied: prouniOnTop,
    }
  }

  const maior = Math.max(tier, coupon, prouniAmount)
  if (maior <= 0) return semNada

  // Empate favorece o PROUNI: o benefício é o mais restrito dos três (só quem
  // provou a condição o tem), então é o que deve aparecer na fatura.
  if (prouniAmount >= maior) {
    return {
      finalPrice: roundMoney(Math.max(0, base - prouniAmount)),
      appliedSource: 'prouni',
      appliedDiscountAmount: prouniAmount,
      tierDiscountApplied: 0,
      couponDiscountApplied: 0,
      prouniDiscountApplied: prouniAmount,
    }
  }
  if (coupon > tier) {
    return {
      finalPrice: roundMoney(Math.max(0, base - coupon)),
      appliedSource: 'coupon',
      appliedDiscountAmount: coupon,
      tierDiscountApplied: 0,
      couponDiscountApplied: coupon,
      prouniDiscountApplied: 0,
    }
  }
  return {
    finalPrice: roundMoney(Math.max(0, base - tier)),
    appliedSource: 'tier',
    appliedDiscountAmount: tier,
    tierDiscountApplied: tier,
    couponDiscountApplied: 0,
    prouniDiscountApplied: 0,
  }
}

