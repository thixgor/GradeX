/**
 * Pinça de dois dedos no leitor de PDF — só a CONTA.
 *
 * O leitor (`components/materiais/secure-pdf-viewer.tsx`) ouve os dedos e o
 * trackpad; aqui mora a geometria, sem DOM e sem React, para poder ser testada
 * sozinha. Mesmo arranjo de `pdf-viewer-zoom.ts` e `pdf-viewer-swipe.ts`.
 *
 * ## Por que esta pinça é diferente da que foi revertida
 *
 * A primeira pinça própria escrevia no zoom do React a cada quadro e só virava
 * `touchAction: 'none'` depois do re-render que dizia "estou pinçando". Nos
 * primeiros quadros o navegador já tinha começado a rolar, cancelava os
 * ponteiros, o gesto reiniciava com os dedos já afastados e o zoom saltava.
 *
 * Esta faz o contrário nos dois pontos:
 *
 *  1. **Nada muda de `touch-action` no meio do gesto.** A área das páginas é
 *     `pan-x pan-y` o tempo todo (o navegador rola, mas nunca dá zoom ali), e
 *     quem segura a rolagem durante a pinça é o `preventDefault` do próprio
 *     `touchmove` — que vale no mesmo evento, sem esperar render nenhum.
 *  2. **Nada de zoom do React durante o gesto.** Os dedos movem um `transform`
 *     na coluna das páginas (o bitmap já desenhado estica, como no GoodNotes);
 *     o zoom de verdade — que re-rasteriza nítido — entra UMA vez, quando o
 *     último dedo sai. É também o que mantém o orçamento de memória dos
 *     canvases intacto: re-rasterizar no meio do gesto já derrubou a aba.
 *
 * ## O modelo
 *
 * O `transform` tem origem no canto de cima à esquerda da coluna (`R`), e o
 * ponto `p` da coluna (em coordenadas da tela, sem transform) aparece em
 *
 *     tela = R + t + s · (p − R)
 *
 * Toda a pinça é escolher `s` (escala) e `t` (deslocamento) de modo que o ponto
 * do material que estava sob os dedos continue sob os dedos.
 */

export interface PinchPoint {
  x: number
  y: number
}

export interface PinchRect {
  left: number
  top: number
  width: number
  height: number
}

/** Escala e deslocamento do `transform`, com origem em `R` (ver o topo). */
export interface PinchTransform {
  scale: number
  tx: number
  ty: number
}

export const IDENTITY_PINCH: PinchTransform = { scale: 1, tx: 0, ty: 0 }

/**
 * Distância mínima entre os dedos para a razão valer. Abaixo disso um tremor de
 * meio milímetro vira uma escala enorme (é a divisão por quase zero que fazia o
 * zoom saltar na pinça antiga).
 */
export const PINCH_MIN_FINGER_DISTANCE = 24

/**
 * Quanto a pinça pode passar do limite antes de travar, em fração do limite —
 * o "elástico" do iOS. Passar um pouco e voltar é o que diz "chegou no máximo"
 * sem uma mensagem; travar seco parece defeito.
 */
export const PINCH_RUBBER_BAND = 0.18

/** Duração da acomodação depois que os dedos saem. */
export const PINCH_SETTLE_ANIMATION_MS = 260

/**
 * Por quanto tempo depois do zoom a página sob os dedos é segurada no lugar.
 * O mesmo motivo de `ZOOM_ANCHOR_HOLD_MS`: os espaçadores da virtualização só
 * acompanham o zoom 150 ms depois, e a altura deles empurra a leitura.
 */
export const PINCH_ANCHOR_HOLD_MS = 560

/** Trackpad em silêncio por este tempo = a pinça acabou. */
export const WHEEL_PINCH_IDLE_MS = 170

export function fingerDistance(a: PinchPoint, b: PinchPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * A escala que aparece na tela para a escala que os dedos pediram. Dentro dos
 * limites, a mesma; fora, cresce cada vez menos até parar em
 * `limite × (1 ± PINCH_RUBBER_BAND)`.
 */
export function rubberBandScale(raw: number, min: number, max: number, band = PINCH_RUBBER_BAND) {
  if (!Number.isFinite(raw) || raw <= 0) return Math.max(min, Math.min(max, 1))
  if (!(min > 0) || !(max >= min)) return raw
  if (raw > max) {
    const over = raw / max - 1
    return max * (1 + band * (1 - 1 / (over / band + 1)))
  }
  if (raw < min) {
    const under = min / raw - 1
    return min / (1 + band * (1 - 1 / (under / band + 1)))
  }
  return raw
}

export function clampScale(scale: number, min: number, max: number) {
  if (!Number.isFinite(scale)) return 1
  return Math.min(max, Math.max(min, scale))
}

/** Onde o ponto `p` (sem transform) aparece na tela. */
export function mapPoint(transform: PinchTransform, origin: PinchPoint, p: PinchPoint): PinchPoint {
  return {
    x: origin.x + transform.tx + transform.scale * (p.x - origin.x),
    y: origin.y + transform.ty + transform.scale * (p.y - origin.y),
  }
}

/** O inverso: que ponto da coluna (sem transform) está em `q` na tela. */
export function unmapPoint(transform: PinchTransform, origin: PinchPoint, q: PinchPoint): PinchPoint {
  const scale = transform.scale > 0 ? transform.scale : 1
  return {
    x: origin.x + (q.x - origin.x - transform.tx) / scale,
    y: origin.y + (q.y - origin.y - transform.ty) / scale,
  }
}

export function mapRect(transform: PinchTransform, origin: PinchPoint, rect: PinchRect): PinchRect {
  const corner = mapPoint(transform, origin, { x: rect.left, y: rect.top })
  return {
    left: corner.x,
    top: corner.y,
    width: rect.width * transform.scale,
    height: rect.height * transform.scale,
  }
}

/**
 * O `transform` em que o ponto do material que estava em `from` (com
 * `transform` aplicado) passa a ficar em `to`, já na escala `scale`.
 *
 * É a regra da pinça inteira: com dois dedos, `from` é o meio deles no começo
 * do trecho e `to` é o meio agora; com um dedo só (o outro saiu), a escala não
 * muda e a mesma conta vira um arrasto.
 */
export function followFocal({
  transform,
  origin,
  from,
  to,
  scale,
}: {
  transform: PinchTransform
  origin: PinchPoint
  from: PinchPoint
  to: PinchPoint
  scale: number
}): PinchTransform {
  const content = unmapPoint(transform, origin, from)
  return {
    scale,
    tx: to.x - origin.x - scale * (content.x - origin.x),
    ty: to.y - origin.y - scale * (content.y - origin.y),
  }
}

/**
 * O `transform` que faz um retângulo que está em `layout` (sem transform)
 * aparecer em `visual`. A escala vem da largura: o `transform` é uniforme.
 */
export function transformBetween(layout: PinchRect, visual: PinchRect, origin: PinchPoint): PinchTransform {
  if (!(layout.width > 0)) return IDENTITY_PINCH
  const scale = visual.width / layout.width
  if (!Number.isFinite(scale) || scale <= 0) return IDENTITY_PINCH
  return {
    scale,
    tx: visual.left - origin.x - scale * (layout.left - origin.x),
    ty: visual.top - origin.y - scale * (layout.top - origin.y),
  }
}

/**
 * Em que fração da página está o ponto. Pode passar um pouco de 0..1 (o meio
 * dos dedos no respiro entre duas páginas); preso a uma margem curta, porque
 * extrapolar longe multiplicaria pelo zoom uma distância que não escala (o
 * espaço entre as páginas é fixo).
 */
export function fractionInRect(rect: PinchRect, point: PinchPoint): PinchPoint {
  const fx = rect.width > 0 ? (point.x - rect.left) / rect.width : 0.5
  const fy = rect.height > 0 ? (point.y - rect.top) / rect.height : 0.5
  const clamp = (value: number) => (Number.isFinite(value) ? Math.min(1.25, Math.max(-0.25, value)) : 0.5)
  return { x: clamp(fx), y: clamp(fy) }
}

/**
 * Quanto rolar para a fração `fraction` da página voltar a ficar em `point`.
 * Positivo: o ponto está à direita/abaixo de onde deveria, então a rolagem
 * anda no mesmo sentido.
 */
export function anchorDrift(rect: PinchRect, fraction: PinchPoint, point: PinchPoint): PinchPoint {
  return {
    x: rect.left + fraction.x * rect.width - point.x,
    y: rect.top + fraction.y * rect.height - point.y,
  }
}

/** Distância de um ponto a um retângulo (0 dentro dele). */
export function distanceToRect(rect: PinchRect, point: PinchPoint) {
  const dx = Math.max(rect.left - point.x, 0, point.x - (rect.left + rect.width))
  const dy = Math.max(rect.top - point.y, 0, point.y - (rect.top + rect.height))
  return Math.hypot(dx, dy)
}

export function lerpRect(a: PinchRect, b: PinchRect, t: number): PinchRect {
  const k = Math.min(1, Math.max(0, t))
  return {
    left: a.left + (b.left - a.left) * k,
    top: a.top + (b.top - a.top) * k,
    width: a.width + (b.width - a.width) * k,
    height: a.height + (b.height - a.height) * k,
  }
}

/** A curva da acomodação: sai rápido e assenta devagar, como o iOS. */
export function settleEase(t: number) {
  const k = Math.min(1, Math.max(0, t))
  return 1 - Math.pow(1 - k, 3)
}

/**
 * Quanto um evento de roda com Ctrl (é assim que o trackpad entrega a pinça no
 * Chrome, no Edge e no Firefox) multiplica a escala.
 *
 * O trackpad manda deltas pequenos e muitos; a roda de um mouse com Ctrl manda
 * 100 px de uma vez. A exponencial deixa os dois proporcionais, e o teto por
 * evento faz um "clique" de roda andar um degrau confortável, não triplicar.
 */
export function wheelScaleFactor(deltaY: number, deltaMode = 0) {
  if (!Number.isFinite(deltaY) || deltaY === 0) return 1
  const pixels = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY
  const factor = Math.exp(-pixels * 0.01)
  return Math.min(1.25, Math.max(0.8, factor))
}

/** O texto do mostrador de zoom durante o gesto (100% = como a página abre). */
export function pinchPercentLabel(zoom: number, resting: number | null | undefined) {
  if (!(zoom > 0)) return '100%'
  const ratio = resting && resting > 0 ? zoom / resting : zoom
  return `${Math.round(ratio * 100)}%`
}
