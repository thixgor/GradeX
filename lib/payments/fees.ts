/**
 * Taxas operacionais do Mercado Pago e repasse ao comprador.
 *
 * PROBLEMA QUE ISTO RESOLVE
 * -------------------------
 * O checkout cobrava exatamente o preço de tabela e deixava a taxa do Mercado
 * Pago sair do nosso bolso. No Pix (0,99%) e no boleto (R$ 3,49) isso é uma
 * mordida pequena; no cartão PARCELADO é o que mais dói: o custo do
 * parcelamento é do VENDEDOR e cresce com o número de parcelas — em 12x chega
 * a 3,03% + 14,80% = 17,83% do valor da venda. O <select> de parcelas apenas
 * dividia `amount / n`, ou seja, vendíamos "12x sem juros" sem nunca ter
 * previsto o custo de financiar esse parcelamento.
 *
 * Aqui a taxa é calculada por método/parcela e SOMADA ao valor cobrado, com o
 * "gross-up" correto: como o Mercado Pago cobra um percentual sobre o valor da
 * transação, somar a taxa direto ao preço deixaria um resíduo (a taxa também
 * incide sobre a taxa). A fórmula que faz o líquido bater com o preço de
 * tabela é `total = (base + fixo) / (1 - percentual)`.
 *
 * De onde vêm os números
 * ----------------------
 * Tabela pública do Mercado Pago para venda online (Checkout Transparente /
 * Checkout Pro) com liberação em 30 dias — o prazo padrão de quem vende por
 * link/checkout. As taxas do Mercado Pago mudam por conta, por prazo de
 * liberação e por negociação comercial: NÃO trate os defaults abaixo como
 * verdade eterna. Confira o simulador dentro da sua conta (Seu negócio →
 * Custos) e, se divergir, sobrescreva com as variáveis de ambiente abaixo —
 * nada aqui precisa de deploy de código para ser ajustado.
 *
 * Configuração (todas opcionais):
 *   PAYMENT_FEE_ENABLED=false          desliga o repasse por completo
 *   PAYMENT_FEE_PASS_PIX=false         não repassa a taxa do Pix
 *   PAYMENT_FEE_PASS_BOLETO=false      não repassa a tarifa do boleto
 *   PAYMENT_FEE_PASS_DEBIT=false       não repassa a taxa do débito
 *   PAYMENT_FEE_PASS_CREDIT=false      não repassa a taxa do crédito à vista
 *   PAYMENT_FEE_PASS_INSTALLMENTS=false  cartão parcelado sem juros para o comprador
 *                                        (o custo do parcelamento volta a ser nosso)
 *   PAYMENT_FEE_MAX_INSTALLMENTS=12    limite de parcelas oferecidas
 *   PAYMENT_FEE_TABLE={"creditPercent":3.03,...}   JSON parcial que sobrescreve a tabela
 *
 * Este arquivo é PURO (sem I/O) de propósito: o mesmo cálculo roda no servidor,
 * que é quem manda no valor cobrado, e no navegador, que só precisa mostrar a
 * mesma conta antes de o comprador confirmar.
 */

export type FeeMethodKind = 'pix' | 'boleto' | 'debit_card' | 'credit_card' | 'unknown'

export interface OperationalFeeTable {
  /** Percentual sobre o valor da transação no Pix. */
  pixPercent: number
  /** Percentual sobre o valor da transação no boleto (hoje o custo é só a tarifa fixa). */
  boletoPercent: number
  /** Tarifa fixa por boleto pago, em reais. */
  boletoFixed: number
  /** Percentual do cartão de débito. */
  debitPercent: number
  /** Percentual do cartão de crédito à vista (1x). */
  creditPercent: number
  /**
   * Custo ADICIONAL de parcelamento, por número de parcelas, somado ao
   * `creditPercent`. O índice é o número de parcelas (1 = à vista, sem custo
   * extra). Valores em pontos percentuais do valor da venda.
   */
  installmentPercent: Record<number, number>
}

/**
 * Tabela padrão — Mercado Pago, venda online, liberação em 30 dias.
 *
 * Âncoras conferidas na comunicação pública do Mercado Pago: crédito à vista
 * 3,03% e 12x com custo adicional de 14,80% (3,03% + 14,80% = 17,83%). Os
 * degraus intermediários seguem a progressão da tabela de "parcelamento
 * vendedor". Ajuste por `PAYMENT_FEE_TABLE` se a sua conta tiver outra.
 */
export const MERCADO_PAGO_FEE_TABLE: OperationalFeeTable = {
  pixPercent: 0.99,
  boletoPercent: 0,
  boletoFixed: 3.49,
  debitPercent: 1.99,
  creditPercent: 3.03,
  installmentPercent: {
    1: 0,
    2: 2.66,
    3: 3.89,
    4: 5.11,
    5: 6.31,
    6: 7.5,
    7: 8.68,
    8: 9.84,
    9: 10.99,
    10: 12.12,
    11: 13.25,
    12: 14.8,
  },
}

export interface FeePolicy {
  /** Chave-geral: `false` faz todo o cálculo devolver taxa zero. */
  enabled: boolean
  /** Repasse por método. `false` = a taxa daquele método continua saindo do nosso bolso. */
  pass: {
    pix: boolean
    boleto: boolean
    debit: boolean
    credit: boolean
    /** Juros do cartão parcelado (2x+). Independente de `credit`. */
    installments: boolean
  }
  maxInstallments: number
  table: OperationalFeeTable
}

export const DEFAULT_FEE_POLICY: FeePolicy = {
  enabled: true,
  pass: { pix: true, boleto: true, debit: true, credit: true, installments: true },
  maxInstallments: 12,
  table: MERCADO_PAGO_FEE_TABLE,
}

/** Ids de cartão de DÉBITO do Mercado Pago — taxa diferente da do crédito. */
const DEBIT_METHOD_IDS = new Set(['debit_card', 'debvisa', 'debmaster', 'debelo', 'maestro', 'debcabal'])

const BOLETO_METHOD_IDS = new Set(['boleto', 'bolbradesco', 'bolbcp', 'pec'])

/**
 * Traduz o `payment_method_id` que o checkout envia para a família de taxa.
 * O front manda o id do provedor (`bolbradesco`, `visa`, `debvisa`...), então
 * comparar direto com `credit_card` nunca casaria.
 */
export function resolveFeeMethod(
  paymentMethodId: string | undefined,
  opts: { hasCardToken?: boolean } = {}
): FeeMethodKind {
  const id = (paymentMethodId || '').trim().toLowerCase()
  if (id === 'pix') return 'pix'
  if (BOLETO_METHOD_IDS.has(id)) return 'boleto'
  if (DEBIT_METHOD_IDS.has(id)) return 'debit_card'
  if (id === 'credit_card' || opts.hasCardToken) return 'credit_card'
  // Bandeiras (visa, master, amex, elo, hipercard...) chegam sem token só na
  // detecção de bandeira; tratamos como crédito, que é a taxa maior — errar
  // para cima aqui é preferível a vender no prejuízo.
  if (id) return 'credit_card'
  return 'unknown'
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function envFlag(name: string, fallback: boolean): boolean {
  const raw = readEnv(name)
  if (raw == null || raw === '') return fallback
  if (/^(1|true|yes|on)$/i.test(raw)) return true
  if (/^(0|false|no|off)$/i.test(raw)) return false
  return fallback
}

/** Mescla um override parcial (JSON de env ou admin) sobre a tabela padrão. */
export function mergeFeeTable(
  base: OperationalFeeTable,
  override: Partial<OperationalFeeTable> | null | undefined
): OperationalFeeTable {
  if (!override) return base
  return {
    pixPercent: toNumber(override.pixPercent, base.pixPercent),
    boletoPercent: toNumber(override.boletoPercent, base.boletoPercent),
    boletoFixed: toNumber(override.boletoFixed, base.boletoFixed),
    debitPercent: toNumber(override.debitPercent, base.debitPercent),
    creditPercent: toNumber(override.creditPercent, base.creditPercent),
    installmentPercent: {
      ...base.installmentPercent,
      ...Object.fromEntries(
        Object.entries(override.installmentPercent || {})
          .map(([k, v]) => [Number(k), toNumber(v, base.installmentPercent[Number(k)] ?? 0)])
          .filter(([k]) => Number.isInteger(k) && (k as number) >= 1)
      ),
    },
  }
}

/**
 * Leitura de env tolerante ao navegador. Este módulo é importado pelo checkout
 * client-side (que só usa o cálculo puro), e lá `process` pode simplesmente não
 * existir — sem esta guarda, um acesso a `process.env` derrubaria o bundle.
 */
function readEnv(name: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined
  return process.env[name]
}

let cachedPolicy: FeePolicy | null = null

/**
 * Política efetiva a partir do ambiente. Só faz sentido no servidor — no
 * navegador use a política que vem de `/api/payments/fees`.
 */
export function getFeePolicy(): FeePolicy {
  if (cachedPolicy) return cachedPolicy

  let tableOverride: Partial<OperationalFeeTable> | null = null
  const raw = readEnv('PAYMENT_FEE_TABLE')
  if (raw) {
    try {
      tableOverride = JSON.parse(raw)
    } catch {
      // Uma tabela malformada não pode derrubar o checkout: seguimos com a
      // padrão e gritamos no log para o problema não passar despercebido.
      console.error('[payments/fees] PAYMENT_FEE_TABLE não é um JSON válido — usando a tabela padrão.')
    }
  }

  const maxInstallments = Math.max(
    1,
    Math.min(12, Math.trunc(toNumber(readEnv('PAYMENT_FEE_MAX_INSTALLMENTS'), 12)) || 12)
  )

  cachedPolicy = {
    enabled: envFlag('PAYMENT_FEE_ENABLED', true),
    pass: {
      pix: envFlag('PAYMENT_FEE_PASS_PIX', true),
      boleto: envFlag('PAYMENT_FEE_PASS_BOLETO', true),
      debit: envFlag('PAYMENT_FEE_PASS_DEBIT', true),
      credit: envFlag('PAYMENT_FEE_PASS_CREDIT', true),
      installments: envFlag('PAYMENT_FEE_PASS_INSTALLMENTS', true),
    },
    maxInstallments,
    table: mergeFeeTable(MERCADO_PAGO_FEE_TABLE, tableOverride),
  }
  return cachedPolicy
}

/** Reseta o cache da política — usado em testes. */
export function _resetFeePolicyCache() {
  cachedPolicy = null
}

/** Percentual efetivo cobrado pelo Mercado Pago para o método/parcelas. */
export function feePercentFor(
  method: FeeMethodKind,
  installments: number,
  policy: FeePolicy = DEFAULT_FEE_POLICY
): number {
  if (!policy.enabled) return 0
  const { table, pass } = policy

  if (method === 'pix') return pass.pix ? table.pixPercent : 0
  if (method === 'boleto') return pass.boleto ? table.boletoPercent : 0
  if (method === 'debit_card') return pass.debit ? table.debitPercent : 0
  if (method === 'credit_card') {
    const base = pass.credit ? table.creditPercent : 0
    const n = normalizeInstallments(installments, policy)
    const extra = n > 1 && pass.installments ? table.installmentPercent[n] ?? 0 : 0
    return base + extra
  }
  return 0
}

/** Tarifa fixa (hoje só o boleto tem). */
export function fixedFeeFor(method: FeeMethodKind, policy: FeePolicy = DEFAULT_FEE_POLICY): number {
  if (!policy.enabled) return 0
  if (method === 'boleto' && policy.pass.boleto) return policy.table.boletoFixed
  return 0
}

function normalizeInstallments(installments: number | undefined, policy: FeePolicy): number {
  const n = Math.trunc(Number(installments) || 1)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, policy.maxInstallments)
}

/** Arredonda para cima no centavo — nunca cobrar menos do que a taxa custa. */
function ceilCents(value: number): number {
  return Math.ceil(Math.round(value * 10000) / 100) / 100
}

function floorCents(value: number): number {
  return Math.floor(Math.round(value * 10000) / 100) / 100
}

export interface CheckoutCharge {
  /** Preço de tabela do produto, antes da taxa. */
  baseAmount: number
  /** Acréscimo repassado ao comprador. */
  feeAmount: number
  /** O que será efetivamente cobrado (base + taxa). */
  totalAmount: number
  /** Percentual do acréscimo em relação à base — para exibir na tela. */
  feePercentOfBase: number
  method: FeeMethodKind
  installments: number
  /** Valor de cada parcela (total / parcelas). */
  installmentAmount: number
  /** Rótulo curto: "Taxa operacional" ou "Juros de parcelamento (6x)". */
  label: string
  /** Frase pronta explicando de onde vem o acréscimo. */
  description: string
}

export interface ComputeChargeInput {
  baseAmount: number
  paymentMethodId?: string
  installments?: number
  hasCardToken?: boolean
  policy?: FeePolicy
}

/**
 * Valor a cobrar do comprador para que o líquido, depois da taxa do Mercado
 * Pago, seja o preço de tabela.
 *
 * `total = (base + fixo) / (1 - percentual/100)` — o divisor é o que impede o
 * resíduo de "taxa sobre a taxa" que sobra quando se soma o percentual direto
 * ao preço.
 */
export function computeCheckoutCharge(input: ComputeChargeInput): CheckoutCharge {
  const policy = input.policy || DEFAULT_FEE_POLICY
  const method = resolveFeeMethod(input.paymentMethodId, { hasCardToken: input.hasCardToken })
  const installments = method === 'credit_card' ? normalizeInstallments(input.installments, policy) : 1

  const base = Math.max(0, Math.round(Number(input.baseAmount) * 100) / 100)
  const percent = feePercentFor(method, installments, policy)
  const fixed = fixedFeeFor(method, policy)

  const empty: CheckoutCharge = {
    baseAmount: base,
    feeAmount: 0,
    totalAmount: base,
    feePercentOfBase: 0,
    method,
    installments,
    installmentAmount: floorCents(base / installments),
    label: '',
    description: '',
  }

  // Base zerada (item liberado por cupom/PROUNI) não gera cobrança nenhuma —
  // não faz sentido criar uma taxa a partir do nada.
  if (base <= 0) return empty
  // Um percentual >= 100 quebraria o gross-up (divisão por zero ou negativo).
  // Melhor absorver a taxa do que cobrar um valor absurdo do comprador.
  if (!Number.isFinite(percent) || percent < 0 || percent >= 100) return empty
  if (percent === 0 && fixed === 0) return empty

  const total = ceilCents((base + fixed) / (1 - percent / 100))
  const feeAmount = Math.round((total - base) * 100) / 100
  if (feeAmount <= 0) return empty

  return {
    baseAmount: base,
    feeAmount,
    totalAmount: total,
    feePercentOfBase: Math.round((feeAmount / base) * 10000) / 100,
    method,
    installments,
    installmentAmount: floorCents(total / installments),
    label: chargeLabel(method, installments),
    description: chargeDescription(method, installments, percent, fixed),
  }
}

export function chargeLabel(method: FeeMethodKind, installments: number): string {
  if (method === 'credit_card' && installments > 1) return `Juros de parcelamento (${installments}x)`
  return 'Taxa operacional'
}

function methodName(method: FeeMethodKind): string {
  if (method === 'pix') return 'Pix'
  if (method === 'boleto') return 'boleto'
  if (method === 'debit_card') return 'cartão de débito'
  if (method === 'credit_card') return 'cartão de crédito'
  return 'pagamento'
}

export function chargeDescription(
  method: FeeMethodKind,
  installments: number,
  percent: number,
  fixed: number
): string {
  const partes: string[] = []
  if (percent > 0) partes.push(`${formatPercent(percent)} do valor`)
  if (fixed > 0) partes.push(`tarifa fixa de ${formatBrl(fixed)}`)
  const custo = partes.join(' + ')

  if (method === 'credit_card' && installments > 1) {
    return `Parcelar em ${installments}x custa ${custo} ao vendedor no Mercado Pago. Esse juro está somado ao total.`
  }
  return `O Mercado Pago cobra ${custo} para receber por ${methodName(method)}. Essa taxa está somada ao total.`
}

export function formatBrl(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

export function formatPercent(value: number): string {
  const n = Math.round(Number(value || 0) * 100) / 100
  return `${n.toFixed(2).replace('.', ',')}%`
}

/**
 * Metadados da taxa para gravar na order — deixa a conciliação com o extrato
 * do Mercado Pago possível meses depois, sem ter que reconstituir a tabela
 * vigente na época da venda.
 */
export function chargeMetadata(charge: CheckoutCharge): Record<string, number | string> {
  if (charge.feeAmount <= 0) return {}
  return {
    baseAmount: charge.baseAmount,
    feeAmount: charge.feeAmount,
    feePercentOfBase: charge.feePercentOfBase,
    feeMethod: charge.method,
    feeInstallments: charge.installments,
    feeLabel: charge.label,
  }
}
