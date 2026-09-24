/**
 * Tamanho "de repouso" da página no leitor de PDF — a conta de quanto zoom
 * uma página recebe ao abrir, ao girar a tela e ao trocar de aparelho.
 *
 * Só a CONTA — nada de DOM, nada de React. O leitor
 * (`components/materiais/secure-pdf-viewer.tsx`) mede a área disponível e
 * pergunta aqui.
 *
 * Este arquivo existe porque o leitor nasceu pensando em A4 em pé, e a regra
 * antiga ("ajusta à largura, nunca passa de 100%") só funciona para ela.
 * Com material em PAISAGEM (slides, tabelas, fluxogramas) a mesma regra dá
 * três defeitos:
 *
 *  1. Celular deitado, notebook de 768px de altura, iPad deitado: a página cabe
 *     na LARGURA mas não na ALTURA. O slide fica cortado embaixo e o leitor
 *     precisa rolar para ver cada um até o fim. Em paisagem a página tem que
 *     caber inteira — largura E altura.
 *  2. Monitor grande: o teto de 100% deixava um slide de 842pt ocupando metade
 *     da tela, com duas faixas vazias dos lados. Em paisagem o teto é outro.
 *  3. O zoom salvo era ABSOLUTO. Quem lia um A4 no celular (zoom ~0,6) e abria
 *     um material em paisagem herdava 0,6 — e a página, 40% mais larga, saía
 *     da tela. Agora o que se guarda é o zoom RELATIVO ao tamanho de repouso
 *     ("1,3x o normal"), que vale para qualquer formato de página.
 *
 * Material em pé continua exatamente como era: largura ajustada, teto de 100%.
 */

export interface FitPageSize {
  width: number
  height: number
}

/**
 * A partir de que proporção a página conta como paisagem. Uma folha
 * quadrada (ou quase) não é paisagem: 5% de folga evita que arredondamento de
 * MediaBox troque a regra de uma página para a outra.
 */
const LANDSCAPE_RATIO = 1.05

/**
 * Teto do repouso em paisagem. O limite de 100% do A4 em pé não serve aqui
 * (ver defeito 2), mas crescer sem teto num monitor ultralargo daria letra de
 * cartaz. 1,6x cobre um 1080p com folga e para aí.
 */
export const LANDSCAPE_MAX_RESTING_ZOOM = 1.6

/**
 * Até quanto a página pode encolher (em relação ao ajustado à largura) para
 * caber inteira na altura. Passou disso, a tela é baixa demais para mostrar a
 * página inteira num tamanho legível, e ela fica na largura — rolando.
 *
 * O caso que decide o número é o CELULAR DEITADO: cabeçalho e barra de baixo
 * levam ~40% dos 340px de altura, e caber na altura reduziria o slide a menos
 * da metade da largura da tela — letra de 5px. Quem gira o celular está
 * pedindo a página MAIOR; ali ela fica na largura. Já no notebook, no iPad e no
 * monitor a página em paisagem passa da altura por pouco, e caber inteira
 * custa só um pouco de largura.
 */
export const LANDSCAPE_MIN_HEIGHT_SHARE = 0.7

/**
 * Espaço que a moldura da página ocupa além da própria página: padding `p-2`
 * dos dois lados (16) + borda de 1px dos dois lados (2).
 */
export const PAGE_FRAME_EXTRA = 18

/** Limites do zoom relativo guardado nas preferências. */
const MIN_ZOOM_RATIO = 0.25
const MAX_ZOOM_RATIO = 8

export function isLandscapePage(size: FitPageSize | null | undefined): boolean {
  if (!size || !(size.width > 0) || !(size.height > 0)) return false
  return size.width > size.height * LANDSCAPE_RATIO
}

export interface RestingZoomInput {
  page: FitPageSize
  /** Largura útil para a página (já descontados os respiros da área). */
  availableWidth: number
  /** Altura útil para a página (já descontados cabeçalho e barras). */
  availableHeight: number
  /** "Largura da tela": a escolha explícita de ajustar à largura. */
  fitWidth?: boolean
}

/**
 * Zoom em que a página fica "no tamanho normal" para esta tela.
 *
 * - Em pé: ajustada à largura, nunca acima de 100% (a regra de sempre).
 * - Paisagem: inteira na tela (largura E altura), até LANDSCAPE_MAX_RESTING_ZOOM
 *   — a menos que a tela seja baixa demais (ver LANDSCAPE_MIN_HEIGHT_SHARE):
 *   aí, na largura.
 * - "Largura da tela": ajustada à largura, e ponto.
 *
 * Devolve `null` quando a medida ainda não serve (layout sem largura).
 */
export function restingZoomFor({ page, availableWidth, availableHeight, fitWidth }: RestingZoomInput): number | null {
  if (!(page.width > 0) || !(page.height > 0) || !(availableWidth > 0)) return null
  const byWidth = availableWidth / page.width
  if (fitWidth) return byWidth
  if (!isLandscapePage(page)) return Math.min(1, byWidth)

  const widthFit = Math.min(byWidth, LANDSCAPE_MAX_RESTING_ZOOM)
  if (!(availableHeight > 0)) return widthFit
  const byHeight = availableHeight / page.height
  if (byHeight >= widthFit) return widthFit
  return byHeight >= widthFit * LANDSCAPE_MIN_HEIGHT_SHARE ? byHeight : widthFit
}

/** O zoom relativo ("1,3x o normal") que corresponde a um zoom absoluto. */
export function zoomRatioFor(zoom: number, resting: number): number | null {
  if (!(zoom > 0) || !(resting > 0)) return null
  const ratio = clampZoomRatio(zoom / resting)
  // O zoom anda em duas casas decimais; "ajustar" arredondado para baixo dá
  // 0,993 do repouso, não 1. Gravado assim, a próxima abertura nasceria 1%
  // menor por nada.
  return Math.abs(ratio - 1) < 0.015 ? 1 : ratio
}

/**
 * Converte o zoom ABSOLUTO das preferências antigas em relativo.
 *
 * Quase todo zoom salvo é o ajuste automático da época, feito com a conta
 * antiga da largura (um pouco mais generosa que a de agora). Convertido ao pé
 * da letra ele viraria "4% acima do normal" e a página passaria da tela do
 * celular por alguns pixels. Até 8% de diferença é tratado como o que era:
 * "ajustado" — relativo 1. Um zoom escolhido à mão, mais longe que isso, é
 * preservado.
 */
export function legacyZoomRatio(legacyZoom: number, resting: number): number | null {
  const ratio = zoomRatioFor(legacyZoom, resting)
  if (ratio == null) return null
  return Math.abs(ratio - 1) <= 0.08 ? 1 : ratio
}

export function clampZoomRatio(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return 1
  return Math.min(MAX_ZOOM_RATIO, Math.max(MIN_ZOOM_RATIO, ratio))
}

/**
 * Tamanho de REFERÊNCIA do documento: o formato que a maioria das páginas já
 * vistas tem.
 *
 * Antes valia o tamanho da última página desenhada. Num material que mistura
 * páginas em pé e deitadas, isso trocava a referência a cada página que
 * entrava na tela — e com ela o zoom de repouso, a altura dos espaçadores e o
 * teto de zoom. O leitor ficava pulando de tamanho durante a rolagem. A
 * maioria só muda quando o material de fato é de outro formato.
 *
 * `counts` guarda quantas páginas de cada formato já apareceram, com a chave
 * de `pageSizeKey`. Empate fica com quem chegou primeiro (a ordem de inserção
 * do Map), para a referência não oscilar entre dois formatos empatados.
 */
export function pageSizeKey(size: FitPageSize): string {
  return `${Math.round(size.width)}x${Math.round(size.height)}`
}

export function majorityPageSize(
  counts: Map<string, { size: FitPageSize; pages: Set<number> }>
): FitPageSize | null {
  let best: { size: FitPageSize; pages: Set<number> } | null = null
  for (const entry of counts.values()) {
    if (!best || entry.pages.size > best.pages.size) best = entry
  }
  return best?.size ?? null
}

/**
 * Quanto uma página MAIS LARGA que a referência encolhe para não sair da
 * largura das outras. É o caso da tabela deitada no meio de uma apostila em
 * pé: com o zoom do documento ela ficaria 40% mais larga que a tela do
 * celular. Nunca aumenta página nenhuma — página mais estreita fica como está.
 */
export function pageWidthFit(own: FitPageSize | null | undefined, reference: FitPageSize | null | undefined): number {
  if (!own || !reference || !(own.width > 0) || !(reference.width > 0)) return 1
  const factor = reference.width / own.width
  // Folga só para arredondamento de MediaBox. Uma Carta (612pt) numa apostila
  // A4 (595pt) também encolhe: são 3%, mas no celular isso já é a borda da
  // página passando da tela.
  return factor < 0.995 ? factor : 1
}
