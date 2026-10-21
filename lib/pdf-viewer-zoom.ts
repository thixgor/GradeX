/**
 * Âncora de leitura do zoom no leitor de PDF.
 *
 * Só a CONTA — nada de DOM, nada de React. O leitor
 * (`components/materiais/secure-pdf-viewer.tsx`) mede a página na tela e
 * pergunta aqui duas coisas: "que pedaço da página está na linha de leitura?"
 * e, depois que o zoom mudou tudo de tamanho, "quanto a leitura escorregou?".
 *
 * Este arquivo existe por causa de um defeito específico: **apertar o botão de
 * zoom trocava de página.**
 *
 * A causa é a mesma da rotação de tela (ver `pdf-viewer-relayout.ts`), só que
 * disparada por um toque em vez de um giro. Na pilha vertical, a altura de
 * cada página é `altura da página × zoom`: um degrau de zoom engorda TODAS as
 * páginas de uma vez, inclusive as centenas que ficam acima da que está sendo
 * lida. O navegador, porém, preserva o deslocamento da rolagem em PIXELS. Com
 * o conteúdo acima mais alto e o deslocamento igual, a faixa central da tela
 * cai numa página anterior — o observador de foco reporta essa página, o
 * número lá embaixo muda e o leitor perde o lugar onde estava.
 *
 * A regra que fecha essa porta: o zoom não pode mexer no PONTO DE LEITURA.
 * Antes de mudar a escala, anotamos qual fração da página atual está na linha
 * de leitura; depois que o layout se refaz, a rolagem é corrigida para pôr
 * exatamente aquela fração de volta na mesma linha. A página cresce a partir
 * do que está sendo lido, que é o que qualquer leitor espera de um botão de
 * "aumentar".
 */

/**
 * Onde fica a "linha de leitura" na tela, em fração da altura visível.
 *
 * 0,28 não é gosto: é o meio da faixa em que o observador de foco decide qual
 * é a página atual (`-18% 0px -68% 0px`, ou seja, de 18% a 32% da tela). Ancorar
 * a leitura fora dessa faixa manteria o CONTEÚDO no lugar e ainda assim deixaria
 * o número da página mudar — que é justamente a queixa.
 */
export const READING_ANCHOR_RATIO = 0.28

/**
 * Os degraus dos botões de zoom, em RELATIVO ao tamanho normal da página
 * nesta tela (1 = como ela abre; ver `restingZoomFor` em `pdf-viewer-fit.ts`).
 *
 * O passo já foi um acréscimo fixo de 0,12 no zoom ABSOLUTO, e o número na
 * tela era o zoom absoluto também. Num iPhone, onde uma A4 cabe a ~60%, isso
 * dava um leitor que abria em "60%", subia para 72, 84, 96 — e a pastilha de
 * "toque para ajustar", que contava em relação à largura da tela, dizia 119,
 * 139, 159 para o MESMO tamanho. Dois números diferentes para uma página só, e
 * nenhum deles redondo.
 *
 * Agora 100% é sempre o tamanho em que a página abre, em qualquer aparelho, e
 * cada toque anda um degrau desta escada. Os números são os de qualquer leitor
 * de PDF; perto do normal o passo é curto (ajuste fino da letra), longe dele,
 * largo (ninguém quer seis toques para dobrar).
 */
export const ZOOM_LEVELS = [0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3] as const

/**
 * Folga para decidir que o zoom "já está" num degrau. O zoom anda em três
 * casas decimais e é arredondado para baixo para não passar da largura: 110%
 * de um repouso de 0,603 vira 1,0995. Sem folga, o toque seguinte em "+"
 * levaria a 110% de novo, e pareceria que o botão não respondeu.
 */
const ZOOM_LEVEL_TOLERANCE = 0.015

/**
 * O degrau seguinte ao zoom relativo atual, na direção pedida — ou `null`
 * quando a escada acabou. Um zoom fora da escada (o "ajustar a página
 * inteira", por exemplo, dá 87%) sobe ou desce para o degrau mais próximo
 * naquela direção.
 */
export function nextZoomLevel(ratio: number, direction: 1 | -1): number | null {
  if (!Number.isFinite(ratio) || ratio <= 0) return 1
  if (direction > 0) {
    return ZOOM_LEVELS.find((level) => level > ratio + ZOOM_LEVEL_TOLERANCE) ?? null
  }
  for (let index = ZOOM_LEVELS.length - 1; index >= 0; index -= 1) {
    if (ZOOM_LEVELS[index] < ratio - ZOOM_LEVEL_TOLERANCE) return ZOOM_LEVELS[index]
  }
  return null
}

/**
 * O número que o leitor mostra: quanto a página está do tamanho normal, em %
 * inteiro. É o MESMO número na barra do computador, na folha do celular e na
 * pastilha de "toque para ajustar". Antes de o tamanho normal ser conhecido
 * (a primeira página ainda não chegou), cai no zoom absoluto.
 */
export function zoomPercent(zoom: number, resting: number | null | undefined): number {
  if (!(zoom > 0)) return 100
  const ratio = resting && resting > 0 ? zoom / resting : zoom
  return Math.round(ratio * 100)
}

/**
 * Por quanto tempo a leitura é segurada no lugar depois de um passo de zoom.
 *
 * Um quadro não basta: a página real muda de tamanho na hora, mas os
 * espaçadores da virtualização só acompanham quando o zoom "assenta" (150 ms
 * depois, ver `settledZoom` no leitor) — e é justamente a altura deles, somada
 * ao longo de centenas de páginas, que empurra a leitura. Meio segundo cobre
 * os dois momentos com folga e ainda assim solta o controle antes de o leitor
 * ter tempo de encostar na tela.
 */
export const ZOOM_ANCHOR_HOLD_MS = 520

export interface PageAnchorMetrics {
  /** Borda de cima da página atual, em relação ao topo da tela. */
  top: number
  /** Altura da página na tela, agora. */
  height: number
  /** Altura visível da tela. */
  viewport: number
}

/**
 * Que fração da página está na linha de leitura — ou `null` quando a medida
 * não serve (página ainda sem altura, tela sem altura).
 *
 * Pode passar de 0..1: a linha de leitura cai às vezes no respiro entre duas
 * páginas. O valor é preso a uma margem curta em volta da página porque
 * extrapolar muito longe multiplicaria, no zoom novo, uma distância que na
 * verdade é fixa (o espaço entre as páginas não escala junto).
 */
export function readReadingAnchor({ top, height, viewport }: PageAnchorMetrics): number | null {
  if (!Number.isFinite(top) || !(height > 0) || !(viewport > 0)) return null
  const anchorY = viewport * READING_ANCHOR_RATIO
  const ratio = (anchorY - top) / height
  if (!Number.isFinite(ratio)) return null
  return Math.min(1.25, Math.max(-0.25, ratio))
}

/**
 * Quanto a leitura escorregou, em pixels, depois que a página mudou de
 * tamanho. Positivo: o ponto ancorado desceu, então a rolagem tem que descer
 * o mesmo tanto para trazê-lo de volta à linha de leitura.
 */
export function readingAnchorDrift({ top, height, viewport }: PageAnchorMetrics, ratio: number): number {
  if (!Number.isFinite(top) || !(height > 0) || !(viewport > 0) || !Number.isFinite(ratio)) return 0
  const anchorY = viewport * READING_ANCHOR_RATIO
  return top + ratio * height - anchorY
}
