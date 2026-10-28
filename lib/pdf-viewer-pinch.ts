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
 *  2. **Nada de React durante o gesto.** Os dedos escrevem uma variável CSS
 *     que multiplica o tamanho das páginas (o bitmap já desenhado estica, como
 *     no GoodNotes), e a rolagem é corrigida no mesmo quadro; o zoom de
 *     verdade — que re-rasteriza nítido — entra UMA vez, quando o último dedo
 *     sai. É também o que mantém o orçamento de memória dos canvases intacto:
 *     re-rasterizar no meio do gesto já derrubou a aba.
 *
 * ## Por que variável CSS e não `transform: scale()`
 *
 * A versão com `transform` era exata no Chromium e piscava branco no iPad: o
 * WebKit re-rasteriza uma camada com escala a cada quadro e, ao promover e
 * desfazer a camada da coluna, o canvas da página aparecia por instantes sem o
 * desenho. Com a variável é layout comum — o mesmo caminho do botão de zoom —
 * e nenhuma camada nasce, morre ou muda de escala.
 *
 * ## O modelo
 *
 * O gesto guarda QUE ponto da página está entre os dedos (a página e a fração
 * dela, `fractionInRect`). A cada quadro a página muda de tamanho e a rolagem
 * anda o que for preciso (`anchorDrift`) para aquela fração voltar a ficar
 * entre os dedos — que podem ter se movido: é assim que a pinça também arrasta.
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

/** Duração da volta do elástico quando os dedos soltam além do limite. */
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
