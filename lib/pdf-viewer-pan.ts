/**
 * Panorâmica lateral da página ampliada no leitor de PDF.
 *
 * Só a CONTA — nada de DOM, nada de React. O leitor
 * (`components/materiais/secure-pdf-viewer.tsx`) lê a linha da página (o
 * contêiner que rola de lado) e pergunta aqui.
 *
 * Com zoom, cada página passa da largura da tela e a sua linha rola de lado.
 * Três coisas davam errado:
 *
 *  1. O "aumentar" crescia a página a partir da borda ESQUERDA: a coluna de
 *     texto que estava no meio da tela ia parar fora dela, e o leitor tinha
 *     que procurar de novo o que estava lendo.
 *  2. Cada página tinha a própria rolagem lateral. Quem lia a coluna da
 *     direita de uma página ampliada descia para a próxima e caía na borda
 *     esquerda — um caderno em que cada folha está num lugar diferente.
 *  3. (Este era layout, não conta, e está no leitor) a linha centralizava a
 *     página com `justify-content: center`, e numa caixa que rola isso deixa a
 *     borda esquerda inalcançável: rolagem toda para a esquerda e o começo das
 *     linhas continuava cortado.
 *
 * A regra que fecha 1 e 2: o que se guarda é QUE PONTO da página está no meio
 * da tela, em fração da largura da página. O zoom e a página seguinte reabrem
 * naquele mesmo ponto — a página cresce a partir do que está sendo lido.
 */

export interface PanMetrics {
  /** Quanto a linha já rolou de lado. */
  scrollLeft: number
  /** Largura visível da linha. */
  clientWidth: number
  /** Largura total do conteúdo da linha (página + respiros). */
  scrollWidth: number
}

/** Ponto do meio quando nada foi arrastado ainda: o centro da página. */
export const DEFAULT_PAN_RATIO = 0.5

/** Quanto o mouse anda antes de o clique virar arrasto (px). */
export const PAN_DRAG_THRESHOLD = 4

/**
 * Que fração da largura da página está no meio da tela — ou `null` quando a
 * linha não rola (a página cabe inteira, e não há panorâmica para lembrar).
 */
export function readPanRatio({ scrollLeft, clientWidth, scrollWidth }: PanMetrics): number | null {
  if (!(clientWidth > 0) || !(scrollWidth > 0) || !Number.isFinite(scrollLeft)) return null
  if (scrollWidth - clientWidth <= 1) return null
  const ratio = (scrollLeft + clientWidth / 2) / scrollWidth
  return Math.min(1, Math.max(0, ratio))
}

/**
 * O `scrollLeft` que põe a fração `ratio` da página no meio da tela, preso ao
 * que a linha de fato rola. Página que cabe inteira: 0.
 */
export function panScrollFor(ratio: number, { clientWidth, scrollWidth }: Omit<PanMetrics, 'scrollLeft'>): number {
  const room = scrollWidth - clientWidth
  if (!(room > 1) || !Number.isFinite(ratio)) return 0
  const target = ratio * scrollWidth - clientWidth / 2
  return Math.round(Math.min(room, Math.max(0, target)))
}

/**
 * Dois dedos movem a página quando o DEDO desenha.
 *
 * Com o dedo liberado para escrever, a página não rola com toque nenhum (o
 * dedo é do traço). Como no GoodNotes, dois dedos juntos são o "mover": o
 * primeiro dedo já começou um traço quando o segundo encosta, e esse traço de
 * um instante é descartado. Só vale se os dois encostarem quase juntos — um
 * segundo dedo que chega no meio de uma escrita longa é a mão apoiada, e o
 * traço em curso não pode sumir por causa dela.
 */
export const TWO_FINGER_PAN_WINDOW_MS = 300

export interface PanPoint {
  x: number
  y: number
}

/** O ponto médio dos dedos — é ele que a página acompanha. */
export function touchMidpoint(points: Iterable<PanPoint>): PanPoint | null {
  let x = 0
  let y = 0
  let count = 0
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue
    x += point.x
    y += point.y
    count += 1
  }
  return count > 0 ? { x: x / count, y: y / count } : null
}
