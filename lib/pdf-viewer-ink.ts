/**
 * O traço da caneta do leitor de PDF.
 *
 * Só o CAMINHO — nada de DOM, nada de React, nada de canvas. Quem desenha é
 * `components/materiais/secure-pdf-viewer.tsx`; o que mora aqui é a regra que
 * transforma uma lista de pontos numa curva, e a conta que dá a espessura.
 *
 * A razão de existir deste arquivo é uma promessa que precisa ser verdadeira:
 * **o traço desenhado em pedaços tem que sair idêntico ao traço desenhado de
 * uma vez.** É isso que permite o rascunho crescer só na ponta a cada evento
 * do ponteiro (em vez de ser redesenhado inteiro a cada quadro, cujo custo
 * cresce com o tamanho do traço até engasgar). Se a emenda escorregasse um
 * pixel que fosse, apareceria uma costura no meio da escrita — e ninguém
 * escreve confiando num traço que muda de forma depois de pronto.
 */

export interface InkPoint {
  x: number
  y: number
}

/**
 * O mínimo de um contexto de canvas para desenhar um traço. Existe para os
 * testes poderem gravar o caminho sem navegador — e é exatamente o que o
 * `CanvasRenderingContext2D` já oferece.
 */
export interface InkPathSink {
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void
}

/**
 * Desenha o traço a partir do ponto `from`.
 *
 * A curva é a clássica "quadráticas ancoradas nos pontos médios": cada ponto
 * capturado vira o CONTROLE de uma curva que vai do meio do segmento anterior
 * ao meio do próximo. É o que tira os cantos de um traço feito de amostras
 * discretas sem precisar de suavização cara.
 *
 * Por isso a emenda funciona: a âncora de um trecho não depende de nada que
 * veio antes dele além do ponto imediatamente anterior. Continuar do meio de
 * `points[from - 1]..points[from]` reproduz exatamente o mesmo desenho.
 *
 * `tail` decide o que fazer com o pedaço que ainda não virou curva — o trecho
 * entre o penúltimo ponto e o mais novo:
 *
 * - `true` (traço pronto): fecha com uma reta até o último ponto. É o desenho
 *   completo, usado quando o traço já não vai crescer mais.
 * - `false` (traço em andamento): para na última curva COMPLETA. A tinta fica
 *   um ponto atrás da ponta da caneta — menos de um pixel, escondido embaixo
 *   da própria ponta —, e em troca cada pedaço do traço é pintado uma vez só,
 *   no lugar definitivo. Pintar a cauda provisória parecia inofensivo (a
 *   próxima passada a cobriria), mas em curva fechada ela ESCAPA da curva
 *   final: sobra tinta que o traço salvo não tem, e que sumia ao levantar a
 *   caneta. Medido num rabisco de teste: ~7% de tinta a mais.
 */
export function traceStroke(
  sink: InkPathSink,
  points: InkPoint[],
  width: number,
  height: number,
  from = 1,
  options: { tail?: boolean } = {}
) {
  const tail = options.tail !== false
  if (points.length === 0) return 0
  if (points.length === 1) {
    sink.moveTo(points[0].x * width, points[0].y * height)
    return 1
  }

  const start = Math.min(Math.max(1, from), points.length - 1)
  if (start === 1) {
    sink.moveTo(points[0].x * width, points[0].y * height)
  } else {
    const previous = points[start - 1]
    const current = points[start]
    sink.moveTo(((previous.x + current.x) / 2) * width, ((previous.y + current.y) / 2) * height)
  }

  for (let index = start; index < points.length - 1; index++) {
    const current = points[index]
    const next = points[index + 1]
    sink.quadraticCurveTo(
      current.x * width,
      current.y * height,
      ((current.x + next.x) / 2) * width,
      ((current.y + next.y) / 2) * height
    )
  }

  if (tail) sink.lineTo(points[points.length - 1].x * width, points[points.length - 1].y * height)
  return Math.max(1, points.length - 1)
}

/**
 * Espessura do traço em pixels de tela.
 *
 * A raiz do produto das duas dimensões, e não a largura, porque é ela que o
 * traço JÁ SALVO usa: o SVG desenha num `viewBox` 100×100 esticado sem manter
 * proporção, e num caso desses o SVG escala a espessura pela média geométrica
 * dos eixos. Enquanto o rascunho usava só a largura, o traço engordava ~19%
 * numa folha A4 no instante em que a caneta era levantada. Agora as duas contas
 * são a mesma, e levantar a caneta não muda nada na tela.
 */
export function inkPixelWidth(ratio: number, width: number, height: number) {
  return Math.max(1, ratio * Math.sqrt(Math.max(1, width) * Math.max(1, height)))
}
