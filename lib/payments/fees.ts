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
 *   PAYMENT_FEE_MAX_INSTALLMENTS=18    limite de parcelas oferecidas (máx. 18, o do Mercado Pago)
 *   PAYMENT_FEE_TABLE={"creditPercent":4.98,...}   JSON parcial que sobrescreve a tabela
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
 * Tabela padrão — a da NOSSA conta do Mercado Pago, aba Checkout, com
 * recebimento NA HORA (conferida no app em "Taxas e parcelas"):
 *   Pix 0,99% · crédito à vista 4,98% · parcelado cliente: vendedor paga
 *   4,98% e o comprador paga os juros do parcelamento.
 *
 * A tabela usava 3,03%, que é a taxa de liberação em 30 dias. Com recebimento
 * na hora o Mercado Pago cobra 4,98%, e a diferença (~1,95% de toda venda no
 * cartão) saía do nosso bolso.
 *
 * `installmentPercent` só vale se a conta mudar para "parcelamento sem juros
 * para o comprador" (custo do parcelamento pago pelo vendedor). Os degraus
 * vêm da tabela pública de liberação em 30 dias — confira no simulador da
 * conta antes de mudar essa configuração. Ajuste tudo por `PAYMENT_FEE_TABLE`.
 */
export const MERCADO_PAGO_FEE_TABLE: OperationalFeeTable = {
  pixPercent: 0.99,
  boletoPercent: 0,
  boletoFixed: 3.49,
  debitPercent: 1.99,
  creditPercent: 4.98,
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
  maxInstallments: 18,
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
    Math.min(18, Math.trunc(toNumber(readEnv('PAYMENT_FEE_MAX_INSTALLMENTS'), 18)) || 18)
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
  /**
   * O que o comprador paga no total — é o número da fatura do cartão. Inclui
   * os juros que o próprio Mercado Pago soma quando o parcelamento é "com
   * juros para o comprador" (ver `providerInterestAmount`).
   */
  totalAmount: number
  /**
   * O que vai ao Mercado Pago como `transaction_amount`. É igual a
   * `totalAmount`, exceto quando o Mercado Pago cobra juros do comprador no
   * parcelamento: aí ele recebe o valor à vista e soma os juros por conta
   * própria — mandar o total já com juros faria o juro incidir duas vezes.
   */
  transactionAmount: number
  /** Juros que o Mercado Pago soma por cima do `transactionAmount` (0 quando não há). */
  providerInterestAmount: number
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
    transactionAmount: base,
    providerInterestAmount: 0,
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
    transactionAmount: total,
    providerInterestAmount: 0,
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
    ...(charge.providerInterestAmount > 0
      ? {
          transactionAmount: charge.transactionAmount,
          providerInterestAmount: charge.providerInterestAmount,
          payerTotalAmount: charge.totalAmount,
        }
      : {}),
  }
}

/**
 * Uma linha do parcelamento que o PRÓPRIO Mercado Pago oferece para o cartão
 * (`payer_costs` de `/v1/payment_methods/installments`, ou `getInstallments`
 * no mercadopago.js).
 */
export interface ProviderPayerCost {
  installments: number
  /** Juros totais do parcelamento, em % do valor enviado. 0 = sem juros para o comprador. */
  installmentRate: number
  installmentAmount: number
  totalAmount: number
}

/** Converte a resposta crua do Mercado Pago, descartando linhas malformadas. */
export function parsePayerCosts(raw: unknown): ProviderPayerCost[] {
  if (!Array.isArray(raw)) return []
  const out: ProviderPayerCost[] = []
  for (const pc of raw as any[]) {
    const installments = Math.trunc(Number(pc?.installments))
    const installmentRate = Number(pc?.installment_rate ?? pc?.installmentRate ?? 0)
    const installmentAmount = Number(pc?.installment_amount ?? pc?.installmentAmount)
    const totalAmount = Number(pc?.total_amount ?? pc?.totalAmount)
    if (!Number.isInteger(installments) || installments < 1) continue
    if (![installmentRate, installmentAmount, totalAmount].every(Number.isFinite)) continue
    out.push({ installments, installmentRate, installmentAmount, totalAmount })
  }
  return out.sort((a, b) => a.installments - b.installments)
}

/**
 * O parcelamento em `n`x pode ser oferecido sem prejuízo para nós?
 *
 *  - com juros para o comprador (`installmentRate > 0`): sim, até o limite da
 *    política — o custo do parcelamento é do comprador e o nosso é só a taxa do
 *    crédito, que já está no valor à vista;
 *  - sem juros para o comprador: só se a tabela tiver o custo daquela parcela
 *    (`installmentPercent[n]`). Sem ele o gross-up somaria zero e o custo do
 *    parcelamento sairia do nosso bolso — a tabela vai até 12x.
 */
export function isInstallmentAvailable(
  n: number,
  payerCost: ProviderPayerCost | null | undefined,
  policy: FeePolicy = DEFAULT_FEE_POLICY
): boolean {
  if (!Number.isInteger(n) || n < 1 || n > policy.maxInstallments) return false
  if (n === 1) return true
  if (!payerCost) return false
  if (payerCost.installmentRate > 0) return true
  return policy.table.installmentPercent[n] != null
}

/**
 * Cobrança do cartão PARCELADO conciliada com o que o Mercado Pago de fato
 * cobra do comprador.
 *
 * POR QUE ISTO EXISTE: a conta de `computeCheckoutCharge` supõe parcelamento
 * "sem juros para o comprador" (o vendedor paga o custo e nós o repassamos no
 * preço). Só que a conta do Mercado Pago pode estar configurada — e estava —
 * para cobrar os juros do COMPRADOR. Nesse caso o MP recebe o
 * `transaction_amount` e soma os juros dele por cima. Resultado: a tela
 * mostrava 6x de R$ 49,16 (total R$ 294,96, já com o nosso "juro") e a fatura
 * vinha 6x de R$ 56,20 (R$ 337,20) — juro sobre juro, e um valor na fatura que
 * não aparecia em lugar nenhum do checkout.
 *
 * A regra agora segue a linha de `payer_costs` que o MP devolve para o cartão:
 *  - `installmentRate > 0`: quem cobra os juros é o MP. Mandamos o valor À
 *    VISTA (base + taxa do crédito 1x) e o total exibido é o `total_amount`
 *    dele — o mesmo número que vai para a fatura.
 *  - `installmentRate === 0`: o parcelamento é "sem juros" para o comprador e
 *    o custo é do vendedor — vale o gross-up da tabela, como antes.
 *  - sem a linha (consulta ao MP falhou): mandamos o valor à vista. Se o MP
 *    somar juros, é o juro dele, uma vez só; nunca juro em dobro. O checkout
 *    não chega aqui — ele só oferece parcelas que o MP confirmou.
 *
 * `payerCost` precisa ter sido consultado com `amount` = valor à vista
 * (`computeCheckoutCharge` em 1x), que é o que vai como `transaction_amount`.
 */
export function computeCardInstallmentCharge(input: {
  baseAmount: number
  paymentMethodId?: string
  installments: number
  payerCost: ProviderPayerCost | null | undefined
  policy?: FeePolicy
}): CheckoutCharge {
  const policy = input.policy || DEFAULT_FEE_POLICY
  const parcelado = computeCheckoutCharge({
    baseAmount: input.baseAmount,
    paymentMethodId: input.paymentMethodId,
    installments: input.installments,
    hasCardToken: true,
    policy,
  })
  if (parcelado.method !== 'credit_card' || parcelado.installments <= 1 || parcelado.baseAmount <= 0) {
    return parcelado
  }

  const n = parcelado.installments
  const pc = input.payerCost

  // Sem juros para o comprador: o custo é nosso e o gross-up já cobre (só é
  // oferecido quando a tabela tem o custo da parcela — `isInstallmentAvailable`).
  if (pc && !(pc.installmentRate > 0)) return parcelado

  const aVista = computeCheckoutCharge({
    baseAmount: input.baseAmount,
    paymentMethodId: input.paymentMethodId,
    installments: 1,
    hasCardToken: true,
    policy,
  })
  const transaction = aVista.totalAmount
  const base = aVista.baseAmount

  const total = pc ? Math.max(transaction, Math.round(pc.totalAmount * 100) / 100) : transaction
  const juros = Math.round((total - transaction) * 100) / 100
  const feeAmount = Math.round((total - base) * 100) / 100
  const installmentAmount =
    pc && pc.installmentAmount > 0 ? Math.round(pc.installmentAmount * 100) / 100 : floorCents(total / n)

  const partes: string[] = []
  if (juros > 0) {
    partes.push(
      `Em ${n}x o Mercado Pago cobra juros de ${formatPercent(pc!.installmentRate)} sobre o valor à vista (${formatBrl(transaction)}).`
    )
  }
  if (aVista.feeAmount > 0) {
    partes.push(`O valor à vista já inclui a taxa operacional do cartão (${formatBrl(aVista.feeAmount)}).`)
  }
  if (juros > 0) partes.push('O total é exatamente o que aparece na fatura.')

  return {
    baseAmount: base,
    feeAmount: Math.max(0, feeAmount),
    totalAmount: total,
    transactionAmount: transaction,
    providerInterestAmount: Math.max(0, juros),
    feePercentOfBase: base > 0 ? Math.round((Math.max(0, feeAmount) / base) * 10000) / 100 : 0,
    method: 'credit_card',
    installments: n,
    installmentAmount,
    label: juros > 0 ? chargeLabel('credit_card', n) : aVista.label,
    description: partes.join(' ') || aVista.description,
  }
}

/**
 * Total de UMA cobrança da assinatura recorrente.
 *
 * O preapproval do Mercado Pago é sempre cartão de crédito e sempre à vista —
 * cada ciclo é uma cobrança de 1x, nunca um parcelamento —, então a taxa é a
 * de crédito à vista, sem o custo adicional de parcelas. O gross-up é o mesmo
 * do pagamento único: `total = base / (1 - percentual)`.
 *
 * POR QUE ISTO PRECISA EXISTIR: o repasse já valia para o pagamento avulso, e
 * a assinatura cobrava `plano.preco` limpo. A taxa da recorrência saía do
 * nosso bolso em TODA renovação — o custo que mais dói, porque se repete —, e
 * as duas opções do mesmo checkout tinham política de preço diferente sem que
 * nada na tela dissesse isso.
 *
 * Respeita `PAYMENT_FEE_PASS_CREDIT=false` como qualquer outro método: quem
 * desligar o repasse do crédito desliga o da assinatura junto, que é o
 * comportamento coerente — é a mesma taxa, do mesmo meio.
 */
export function computeSubscriptionCharge(baseAmount: number, policy?: FeePolicy): CheckoutCharge {
  return computeCheckoutCharge({
    baseAmount,
    paymentMethodId: 'credit_card',
    installments: 1,
    hasCardToken: true,
    policy,
  })
}
