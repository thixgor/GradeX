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
 * ── Quantos pontos vale a pena guardar ──────────────────────────────────────
 *
 * Passo mínimo entre dois pontos capturados, em pixels de TELA.
 *
 * A unidade é o ponto inteiro deste bloco. Os traços são guardados em fração da
 * página (0..1) para valerem em qualquer zoom, e a peneira de pontos vivia
 * nessa mesma unidade — um passo fixo de 0,0014 da largura. Só que "0,0014 da
 * página" não quer dizer nada para a mão: num celular com a página em 380 px
 * são 0,5 px, e com a mesma página ampliada em 3× são 4 px. Ou seja: a peneira
 * ficava mais grossa exatamente quando a pessoa amplia para escrever miúdo.
 *
 * O efeito era visível e é a razão desta mudança: ampliado, escrevendo devagar,
 * a tinta só andava de 4 em 4 pixels. O traço saía em degraus e a ponta parecia
 * "presa", como se a caneta patinasse antes de sair.
 *
 * Em pixels de tela a peneira passa a querer dizer sempre a mesma coisa: pontos
 * que a tela não consegue separar não entram. Meio pixel é esse limite. Nada
 * disso enche o traço de pontos: quando a mão anda, cada amostra da caneta já
 * vem a vários pixels da anterior e nenhuma é descartada — a peneira só existe
 * para o tremor de quem está quase parado.
 */
export const INK_MIN_STEP_PX = 0.5
/**
 * Pincel e marca-texto são traços GROSSOS (dezenas de pixels): detalhe abaixo
 * de um pixel desaparece embaixo da própria tinta. Um passo maior guarda menos
 * pontos sem que nada mude na tela.
 */
export const MARKER_MIN_STEP_PX = 1.1

/**
 * O ponto novo andou o bastante para virar amostra?
 *
 * A distância é medida em PIXELS, e não na fração da página, porque os dois
 * eixos têm escalas diferentes: uma A4 é bem mais alta que larga, então o mesmo
 * "0,001" vale 40% mais na vertical. Medindo em pixels a peneira é um círculo,
 * e não uma elipse — traço na horizontal e traço na vertical guardam o mesmo
 * tanto de detalhe.
 */
export function inkPointMoved(
  from: InkPoint,
  to: InkPoint,
  width: number,
  height: number,
  minPx: number
) {
  const dx = (to.x - from.x) * width
  const dy = (to.y - from.y) * height
  return Math.hypot(dx, dy) >= minPx
}

/**
 * Os pontos que vão para o banco — e a regra que faz o PINGO do "i" existir.
 *
 * Um toque rápido de caneta produz UM ponto (ou dois, quando a mão treme meio
 * pixel): a caneta desce e sobe antes de o navegador ter o que reportar de
 * movimento. A versão anterior exigia três pontos para salvar e jogava fora
 * todo o resto — o pingo aparecia embaixo da ponta enquanto a caneta estava
 * encostada e sumia ao levantar. Escrever "i", "j", dois-pontos ou um ponto
 * final virava uma perseguição: só saía quando o toque escorregava o bastante
 * para virar um risquinho.
 *
 * Um ponto vira um traço de dois pontos IGUAIS, e não um caso especial: quem
 * desenha (o SVG salvo), quem apaga (a borracha) e quem mede (os limites da
 * anotação) continuam recebendo a mesma lista de sempre. Um trecho de
 * comprimento zero com ponta redonda é exatamente o círculo que a ponta da
 * caneta desenharia — ou seja, o pingo sai do tamanho certo de graça.
 *
 * Devolve `null` quando não há nada para salvar.
 */
export function normalizeInkStroke(points: InkPoint[]): InkPoint[] | null {
  if (points.length === 0) return null
  if (points.length === 1) return [points[0], points[0]]
  return points
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
