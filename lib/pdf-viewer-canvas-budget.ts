/**
 * Orçamento de canvas do leitor de PDF.
 *
 * Só a CONTA — nada de DOM, nada de React. O leitor
 * (`components/materiais/secure-pdf-viewer.tsx`) junta os números do aparelho
 * (densidade de tela, quantas páginas estão montadas) e pergunta aqui em que
 * escala pode desenhar.
 *
 * Este arquivo existe porque a mesma falha voltou três vezes: a aba do Safari
 * no iOS descartando os canvas — tela branca, faixa preta, recarregar — sempre
 * que a soma dos canvas montados passava do que o aparelho aguenta. As três
 * vezes tiveram gatilhos diferentes (pinçar, despinçar, rolar com a leitura
 * ampliada) e a mesma causa: o teto era POR PÁGINA, e o leitor mantém várias
 * páginas montadas ao mesmo tempo.
 *
 * A invariante que interessa, e que os testes protegem:
 *
 *   soma dos canvas das páginas vivas <= orçamento, SEMPRE —
 *   qualquer zoom, qualquer densidade de pinça, qualquer aparelho.
 *
 * O que muda com o zoom é como o orçamento é repartido: ampliado, o leitor
 * mantém menos páginas montadas, então cada uma fica com uma fatia maior.
 */

export interface CanvasBudgetInput {
  /** Largura da página em pontos do PDF (escala 1). */
  baseWidth: number
  /** Altura da página em pontos do PDF (escala 1). */
  baseHeight: number
  /** Escala de exibição pedida pelo layout. */
  scale: number
  /** Pixels de canvas por pixel de CSS (já limitado pelo leitor). */
  dpr: number
  /** Multiplicador extra da pinça do navegador. */
  density?: number
  /** Quantas páginas o leitor mantém montadas ao mesmo tempo. */
  livePages: number
  /** Orçamento TOTAL, em megapixels, somando todas as páginas vivas. */
  totalMpx: number
}

/**
 * A escala em que a página pode ser rasterizada sem estourar a parte dela no
 * orçamento. Devolve a escala pedida quando ela já cabe — que é o caso da
 * leitura sem ampliação, onde nada disto deve interferir.
 */
export function fitToCanvasBudget({
  baseWidth,
  baseHeight,
  scale,
  dpr,
  density = 1,
  livePages,
  totalMpx,
}: CanvasBudgetInput) {
  let effective = scale * dpr * Math.max(1, density)
  const area = Math.max(1, baseWidth) * Math.max(1, baseHeight)
  const perPageBudget = (totalMpx / Math.max(1, livePages)) * 1_000_000
  const wanted = area * effective * effective
  if (wanted > perPageBudget) effective *= Math.sqrt(perPageBudget / wanted)
  return effective
}

/** Megapixels que um canvas ocupa numa dada escala efetiva. */
export function canvasMegapixels(baseWidth: number, baseHeight: number, effectiveScale: number) {
  return (Math.max(1, baseWidth) * Math.max(1, baseHeight) * effectiveScale * effectiveScale) / 1_000_000
}
