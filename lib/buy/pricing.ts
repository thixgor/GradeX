/**
 * Como o preço de um plano é APRESENTADO em /buy.
 *
 * O motivo deste arquivo existir: "R$ 327,00" e "R$ 54,50 por mês" são o mesmo
 * dinheiro, e a segunda leitura assusta muito menos que a primeira. A página
 * antiga liderava com o total do período (o número grande) e escondia o
 * equivalente mensal numa linha cinza de 12px — exatamente ao contrário do que
 * a decisão de compra pede. Aqui o total nunca some (senão a página mente),
 * mas quem lidera é a menor unidade honesta: mês, e depois dia.
 *
 * Tudo é derivado do que o admin já cadastrou em `PlanConfig` (`preco`,
 * `precoOriginal`, `durationMonths`). Nada aqui inventa número.
 */

/** Dias por mês no calendário gregoriano (365,2425 / 12). */
const DIAS_POR_MES = 30.436875

/** Só faz sentido dizer "por dia" quando o período é longo o bastante. */
const MESES_MINIMOS_PARA_DIARIA = 3

export type UnidadeDeChamada = 'mes' | 'dia' | 'unico'

export interface EntradaDePreco {
  /** Preço cobrado pelo período inteiro. */
  preco: number
  /** Preço "de", quando existe. Ignorado se não for maior que `preco`. */
  precoOriginal?: number | null
  /** Duração em meses. 0/undefined = vitalício (pagamento único). */
  durationMonths?: number | null
}

export interface PrecoApresentado {
  /** Meses de duração já normalizados (0 = vitalício). */
  meses: number
  vitalicio: boolean
  /** Total cobrado no período. */
  total: number
  /** Equivalente mensal, ou null quando não se aplica (vitalício). */
  mensal: number | null
  /** Equivalente diário, ou null quando o período é curto demais para valer. */
  diario: number | null
  /** Preço "de" válido (só quando maior que o total). */
  ancora: number | null
  /** Quanto o preço "de" deixa de ser cobrado. */
  economia: number | null
  /** Desconto em pontos percentuais inteiros. */
  descontoPercentual: number | null
  /** O número que lidera a apresentação. */
  chamada: { valor: number; unidade: UnidadeDeChamada }
}

const formatadorBRL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** "3128.99" → "3.128,99". Sem o "R$" — quem chama decide onde põe o símbolo. */
export function formatarBRL(valor: number): string {
  if (!Number.isFinite(valor)) return '0,00'
  return formatadorBRL.format(arredondarCentavos(valor))
}

/** Arredonda para centavo, evitando o lixo de ponto flutuante (54.499999...). */
function arredondarCentavos(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

export function normalizarMeses(durationMonths?: number | null): number {
  const meses = Number(durationMonths)
  if (!Number.isFinite(meses) || meses <= 0) return 0
  return Math.floor(meses)
}

/**
 * Traduz um plano do catálogo no conjunto de números que a página mostra.
 *
 * A regra de qual número lidera:
 *   - vitalício          → o próprio total, rotulado como pagamento único;
 *   - mensal (1 mês)     → o total, que já É o mensal;
 *   - qualquer outro     → total ÷ meses.
 *
 * O equivalente mensal é arredondado para centavo, então `mensal × meses` pode
 * não bater no centavo com `total` (R$ 397 ÷ 12 = R$ 33,08; × 12 = R$ 396,96).
 * Por isso a UI é obrigada a exibir `total` junto — ver `linhaDeApoio`.
 */
export function apresentarPreco(entrada: EntradaDePreco): PrecoApresentado {
  const total = Math.max(0, Number(entrada.preco) || 0)
  const meses = normalizarMeses(entrada.durationMonths)
  const vitalicio = meses === 0

  const bruto = Number(entrada.precoOriginal)
  const ancora = Number.isFinite(bruto) && bruto > total ? arredondarCentavos(bruto) : null
  const economia = ancora !== null ? arredondarCentavos(ancora - total) : null
  const descontoPercentual =
    ancora !== null && ancora > 0 ? Math.round(100 - (total / ancora) * 100) : null

  const mensal = vitalicio ? null : arredondarCentavos(total / meses)
  const diario =
    !vitalicio && meses >= MESES_MINIMOS_PARA_DIARIA
      ? arredondarCentavos(total / (meses * DIAS_POR_MES))
      : null

  const chamada: PrecoApresentado['chamada'] = vitalicio
    ? { valor: total, unidade: 'unico' }
    : { valor: mensal as number, unidade: 'mes' }

  return {
    meses,
    vitalicio,
    total: arredondarCentavos(total),
    mensal,
    diario,
    ancora,
    economia,
    descontoPercentual,
    chamada,
  }
}

/**
 * A frase que fica embaixo do número grande. É ela que impede o enquadramento
 * mensal de virar promessa falsa: quem lê "R$ 54,50 por mês" precisa ver, na
 * linha seguinte, que a cobrança é de R$ 327,00 de uma vez a cada 6 meses.
 */
export function linhaDeApoio(preco: PrecoApresentado): string {
  if (preco.vitalicio) return `R$ ${formatarBRL(preco.total)} uma vez. Sem renovação.`
  if (preco.meses === 1) return `R$ ${formatarBRL(preco.total)} cobrados por mês.`
  return `R$ ${formatarBRL(preco.total)} cobrados de uma vez, a cada ${rotuloDeCiclo(preco.meses)}.`
}

/** "12" → "12 meses"; "6" → "6 meses"; "1" → "mês". Usado dentro de frases. */
export function rotuloDeCiclo(meses: number): string {
  if (meses <= 0) return 'sempre'
  if (meses === 1) return 'mês'
  if (meses === 12) return '12 meses'
  return `${meses} meses`
}

/**
 * Rótulo curto do período, para chips e cabeçalhos. Usa o texto que o admin
 * escreveu (`periodo`) quando ele existe — só cai no derivado se estiver vazio.
 */
export function rotuloDePeriodo(periodo: string | undefined, meses: number): string {
  const escrito = (periodo || '').trim()
  if (escrito) return escrito
  if (meses === 0) return 'Vitalício'
  if (meses === 1) return 'Mensal'
  if (meses === 3) return 'Trimestral'
  if (meses === 6) return 'Semestral'
  if (meses === 12) return 'Anual'
  return `${meses} meses`
}

/**
 * Normaliza um benefício para comparar planos entre si: sem acento, sem
 * pontuação, sem caixa. "Todas as Provas da Faculdade + Download em PDF" e
 * "todas as provas da faculdade + download em pdf" viram a mesma linha na
 * tabela comparativa — que é o esperado, já que o admin digita à mão.
 */
export function chaveDeBeneficio(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
