/**
 * Regras do gesto de virar página do leitor de PDF.
 *
 * Isto aqui é só a MATEMÁTICA do gesto — nada de DOM, nada de React. O leitor
 * (`components/materiais/secure-pdf-viewer.tsx`) mede a tela e chama estas
 * funções; assim a parte que decide "isto foi uma virada de página?" pode ser
 * testada sozinha, sem simular toques num navegador.
 *
 * A regra de ouro, copiada da experiência de quem já lê em tablet (GoodNotes e
 * companhia): o dedo vira a página nos dois eixos, mas SÓ quando não há mais
 * nada para rolar naquela direção. É isso que impede os dois defeitos opostos —
 * virar a página no meio de uma rolagem, ou perder a rolagem por causa do gesto
 * de virar.
 *
 * Vale para a rolagem VERTICAL do leitor. Na rolagem horizontal quem vira a
 * página é o próprio navegador (scroll-snap nativo, ver `ScrollAxis` no leitor):
 * ali não há gesto sintético nenhum a decidir.
 */

// Curso mínimo de um arrasto deliberado.
export const SWIPE_MIN_DISTANCE = 52
// Gesto rápido ("flick") não precisa de curso longo: quem joga o dedo de leve
// espera virar. Sem isso o leitor tem que arrastar deliberadamente toda vez.
export const SWIPE_FLICK_DISTANCE = 22
export const SWIPE_FLICK_DURATION = 340
// Velocidade (px/ms) no fim do gesto que já conta como virada, mesmo sem curso
// longo e mesmo num gesto que começou devagar. É o caso do dedo que ajeita a
// posição e só então joga a página para o lado: medir a MÉDIA do gesto inteiro
// dizia "lento" e engolia a virada — foi a queixa mais comum em tablet.
export const SWIPE_FLICK_VELOCITY = 0.5
// Acima disto o dedo estava passeando, não virando página.
export const SWIPE_MAX_DURATION = 900
// O eixo precisa ser dominante — senão qualquer diagonal vira página. 1,25 e
// não 1,5: numa tela grande o arco natural do polegar é bem mais diagonal do
// que num celular, e o gesto certo estava sendo recusado por causa disso.
export const SWIPE_AXIS_RATIO = 1.25
// A partir daqui o gesto tem eixo definido e o acompanhamento visual começa.
export const SWIPE_AXIS_LOCK = 10
// Deslocamento máximo do arrasto que acompanha o dedo. É só feedback: a página
// anda um pouco, com resistência crescente, e volta ao lugar.
export const SWIPE_FOLLOW_MAX = 64
// Folga para considerar que a rolagem chegou ao fim (arredondamento de layout).
export const SCROLL_EDGE_TOLERANCE = 2
// Sobra de rolagem irrelevante (a barra inferior, uma margem, um arredondamento)
// conta como conteúdo inteiro na tela: exigir que o leitor "role" esses poucos
// pixels antes de poder virar faria o gesto parecer quebrado.
export const SCROLL_IGNORE_RANGE = 48
// No eixo vertical a sobra costuma ser bem maior que uma margem: o cabeçalho, a
// barra de baixo e o respiro em volta da página somam uma faixa que a página
// inteira na tela ainda deixa rolando. Medida em pixels fixos, essa sobra fazia
// o gesto de virar para cima "não funcionar" — o dedo rolava aqueles poucos
// pixels e o gesto era descartado, e só o SEGUNDO gesto virava a página. Uma
// fração da tela resolve em qualquer aparelho: um terço da altura visível ainda
// é pouco para ser leitura, e muito para ser sobra de moldura.
export const SCROLL_IGNORE_VIEWPORT_RATIO = 0.34

export type SwipeAxis = 'x' | 'y'

export interface SwipeStart {
  x: number
  y: number
  t: number
  /** Direções liberadas, decididas no INÍCIO do gesto: depois que o dedo já
   *  está andando, a rolagem nativa mudaria as respostas no meio do caminho. */
  allowNext: Record<SwipeAxis, boolean>
  allowPrev: Record<SwipeAxis, boolean>
  axis: SwipeAxis | null
  /** Gesto descartado (rolagem/panorâmica nativa venceu): não vira página. */
  dropped: boolean
}

export interface ScrollMetrics {
  scrollStart: number
  viewport: number
  content: number
  /**
   * Quanta rolagem ainda conta como "não há o que rolar". Sem valor, vale o
   * mínimo fixo; no eixo vertical o leitor passa uma fração da tela (ver
   * SCROLL_IGNORE_VIEWPORT_RATIO).
   */
  ignoreRange?: number
}

/**
 * Borracha: o deslocamento acompanha o dedo praticamente 1:1 nos primeiros
 * milímetros — é isso que faz o gesto parecer "colado" no dedo — e vai
 * travando até o teto, para o gesto ter fim visível sem um limite duro que
 * simplesmente "bate" e para.
 */
export function rubberBand(delta: number) {
  const sign = delta < 0 ? -1 : 1
  const abs = Math.abs(delta)
  return sign * SWIPE_FOLLOW_MAX * (1 - Math.exp(-abs / SWIPE_FOLLOW_MAX))
}

/**
 * Um contêiner de rolagem está encostado no começo/fim? Serve para os dois
 * eixos: na vertical decide se o dedo vira página ou rola a leitura; na
 * horizontal, se arrasta a página ampliada ou vira.
 */
export function readScrollEdges({ scrollStart, viewport, content, ignoreRange }: ScrollMetrics) {
  const range = content - viewport
  if (range <= Math.max(SCROLL_IGNORE_RANGE, ignoreRange ?? 0)) return { atStart: true, atEnd: true }
  return {
    atStart: scrollStart <= SCROLL_EDGE_TOLERANCE,
    atEnd: scrollStart >= range - SCROLL_EDGE_TOLERANCE,
  }
}

/**
 * Qual eixo o gesto assumiu, se já assumiu algum. Antes do travamento o dedo
 * ainda pode estar só ajeitando a posição.
 */
export function lockSwipeAxis(dx: number, dy: number): SwipeAxis | null {
  if (Math.abs(dx) < SWIPE_AXIS_LOCK && Math.abs(dy) < SWIPE_AXIS_LOCK) return null
  return Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
}

/**
 * A direção liberada para o deslocamento atual naquele eixo — negativo é
 * "próxima página" (dedo para a esquerda ou para cima).
 */
export function isSwipeAllowed(start: SwipeStart, axis: SwipeAxis, delta: number) {
  return delta < 0 ? start.allowNext[axis] : start.allowPrev[axis]
}

/**
 * O gesto virou página? Decidido só na soltura: distância, tempo, dominância do
 * eixo e — de novo — a permissão daquela direção, registrada no início.
 * Devolve 1 (próxima), -1 (anterior) ou null (não foi virada).
 *
 * `velocity` (px/ms, com sinal, medida nos últimos milissegundos do gesto) é
 * opcional: quando vem, um lance rápido vira página mesmo com curso curto.
 */
export function resolveSwipe(
  start: SwipeStart | null,
  end: { x: number; y: number; t: number; cancelled?: boolean; velocity?: number }
): 1 | -1 | null {
  if (!start || start.dropped || !start.axis || end.cancelled) return null

  const elapsed = end.t - start.t
  if (elapsed > SWIPE_MAX_DURATION) return null

  const dx = end.x - start.x
  const dy = end.y - start.y
  const delta = start.axis === 'x' ? dx : dy
  const other = start.axis === 'x' ? dy : dx
  const travelled = Math.abs(delta)
  // Curso longo, gesto curto e rápido, ou lance final veloz — os três jeitos de
  // "passar a página". O lance final só conta se estiver indo para o MESMO lado
  // do gesto: senão o dedo que volta atrás no fim viraria a página do lado
  // errado.
  const flicked = end.velocity != null
    && Math.abs(end.velocity) >= SWIPE_FLICK_VELOCITY
    && Math.sign(end.velocity) === Math.sign(delta)
    && travelled > SWIPE_FLICK_DISTANCE
  const longEnough = travelled > SWIPE_MIN_DISTANCE
    || (travelled > SWIPE_FLICK_DISTANCE && elapsed < SWIPE_FLICK_DURATION)
    || flicked
  if (!longEnough || travelled < Math.abs(other) * SWIPE_AXIS_RATIO) return null

  const direction: 1 | -1 = delta < 0 ? 1 : -1
  if (!isSwipeAllowed(start, start.axis, delta)) return null
  return direction
}
