/**
 * Regras da borracha do leitor de PDF.
 *
 * Isto aqui é só a GEOMETRIA — nada de DOM, nada de React. O leitor
 * (`components/materiais/secure-pdf-viewer.tsx`) mede a página e chama estas
 * funções a cada quadro do dedo/caneta; assim a parte que decide "a borracha
 * encostou nisto?" pode ser testada sozinha.
 *
 * Duas decisões explicam quase tudo o que está aqui:
 *
 * 1. Contas em PIXELS, não em coordenadas normalizadas. As anotações são
 *    guardadas em fração da página (0..1) para funcionar em qualquer zoom e em
 *    qualquer tela, mas x e y têm escalas diferentes (uma A4 é bem mais alta
 *    que larga). Um raio "0,02" seria uma elipse na tela — a borracha pegaria
 *    mais na vertical que na horizontal. Convertendo para pixels da página
 *    renderizada, o círculo é círculo.
 *
 * 2. A borracha é um RASTRO, não um clique. Cada movimento do ponteiro entrega
 *    uma lista de centros, e um traço é apagado se qualquer um deles encostar
 *    nele. É isso que faz a borracha "passando" funcionar mesmo quando o dedo
 *    anda rápido e o navegador entrega poucos eventos.
 */

export type EraserMode = 'object' | 'partial' | 'highlight'
export type EraserSize = 'fine' | 'medium' | 'wide'

export interface EraserPoint {
  x: number
  y: number
}

export interface PageGeometry {
  /** Largura da página renderizada, em pixels de tela. */
  width: number
  /** Altura da página renderizada, em pixels de tela. */
  height: number
}

/** Raio da borracha em pixels da página. Ver ERASER_SIZE_OPTIONS na UI. */
export const ERASER_RADIUS: Record<EraserSize, number> = {
  fine: 7,
  medium: 16,
  wide: 34,
}

/**
 * Alvos pontuais (nota, marcador) não têm área guardada: eles são um ícone
 * ancorado num ponto. Este é o raio mínimo que a borracha considera para eles,
 * para não exigir mira de cirurgião em cima de um post-it.
 */
export const MARKER_HIT_RADIUS = 22

/** Espessura mínima considerada de um traço, quando a anotação não a informa. */
const DEFAULT_STROKE_RATIO = 0.004

/**
 * A borracha "parcial" só faz sentido em traço livre e em grifo — as duas
 * coisas que são uma linha desenhada à mão. Uma reta, um tracejado ou um
 * círculo são FORMAS: cortar um pedaço deixaria um caco sem sentido, então
 * nesses casos a borracha apaga a forma inteira, como a de objeto.
 */
const SPLITTABLE_DRAWING_MODES = new Set(['free', 'marker'])

export interface ErasableAnnotation {
  type: string
  position: {
    x?: number
    y?: number
    width?: number
    height?: number
    points?: EraserPoint[]
  }
  data?: {
    strokeWidthRatio?: number
    drawingMode?: string
  }
}

function toPx(point: EraserPoint, geometry: PageGeometry) {
  return { x: point.x * geometry.width, y: point.y * geometry.height }
}

/** Distância de um ponto ao segmento AB. Tudo em pixels. */
export function pointSegmentDistance(
  point: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y)
  // Projeção do ponto na reta, presa ao trecho que existe de fato.
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared))
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy))
}

/** Meia espessura do traço, em pixels: a borracha encosta na TINTA, não na linha teórica. */
export function strokeTolerance(annotation: ErasableAnnotation, geometry: PageGeometry) {
  const ratio = annotation.data?.strokeWidthRatio ?? DEFAULT_STROKE_RATIO
  return Math.max(1.5, (ratio * geometry.width) / 2)
}

function circleHitsPolyline(
  points: EraserPoint[],
  center: EraserPoint,
  radius: number,
  geometry: PageGeometry
) {
  const target = toPx(center, geometry)
  if (points.length === 1) {
    const only = toPx(points[0], geometry)
    return Math.hypot(target.x - only.x, target.y - only.y) <= radius
  }
  for (let index = 1; index < points.length; index++) {
    const a = toPx(points[index - 1], geometry)
    const b = toPx(points[index], geometry)
    if (pointSegmentDistance(target, a, b) <= radius) return true
  }
  return false
}

/**
 * Círculo × retângulo. Exportado porque é também o teste BARATO que vem antes
 * do caro: a caixa que envolve o traço descarta, num punhado de contas, quase
 * todas as anotações da página a cada movimento da borracha — sem isso seria
 * percorrer ponto a ponto de todos os traços a cada quadro.
 */
export function rectHit(
  rect: { x: number; y: number; width: number; height: number },
  center: EraserPoint,
  radius: number,
  geometry: PageGeometry
) {
  const target = toPx(center, geometry)
  const left = rect.x * geometry.width
  const top = rect.y * geometry.height
  const right = left + rect.width * geometry.width
  const bottom = top + rect.height * geometry.height
  // Ponto do retângulo mais próximo do centro da borracha.
  const nearestX = Math.max(left, Math.min(target.x, right))
  const nearestY = Math.max(top, Math.min(target.y, bottom))
  return Math.hypot(target.x - nearestX, target.y - nearestY) <= radius
}

/**
 * A borracha (um círculo de `radius` px centrado em `center`) encosta nesta
 * anotação? Vale para traço, grifo, retângulo e ícone ancorado num ponto.
 */
export function annotationHit(
  annotation: ErasableAnnotation,
  center: EraserPoint,
  radius: number,
  geometry: PageGeometry
) {
  if (!(geometry.width > 0) || !(geometry.height > 0)) return false
  const position = annotation.position || {}
  const points = position.points

  if (points && points.length > 0) {
    return circleHitsPolyline(points, center, radius + strokeTolerance(annotation, geometry), geometry)
  }

  if (annotation.type === 'note' || annotation.type === 'bookmark') {
    const anchor = toPx({ x: position.x ?? 0, y: position.y ?? 0 }, geometry)
    const target = toPx(center, geometry)
    return Math.hypot(target.x - anchor.x, target.y - anchor.y) <= radius + MARKER_HIT_RADIUS
  }

  if (
    typeof position.x === 'number'
    && typeof position.y === 'number'
    && typeof position.width === 'number'
    && typeof position.height === 'number'
  ) {
    return rectHit(
      { x: position.x, y: position.y, width: position.width, height: position.height },
      center,
      radius,
      geometry
    )
  }

  return false
}

/** Esta anotação pode ser cortada ao meio, ou a borracha parcial apaga tudo? */
export function isSplittable(annotation: ErasableAnnotation) {
  const points = annotation.position?.points
  if (!points || points.length < 2) return false
  if (annotation.type === 'highlight') return true
  if (annotation.type !== 'drawing') return false
  return SPLITTABLE_DRAWING_MODES.has(annotation.data?.drawingMode || 'free')
}

/**
 * Um traço desenhado rápido chega com poucos pontos e saltos longos entre
 * eles: sem isto, a borracha passaria "por dentro" do salto sem apagar nada.
 * Aqui os saltos ganham pontos intermediários — só onde precisam, para o traço
 * salvo não engordar à toa.
 */
export function densify(points: EraserPoint[], maxStepPx: number, geometry: PageGeometry) {
  if (points.length < 2 || !(maxStepPx > 0)) return points
  const dense: EraserPoint[] = [points[0]]
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1]
    const current = points[index]
    const a = toPx(previous, geometry)
    const b = toPx(current, geometry)
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / maxStepPx)
    for (let step = 1; step < steps; step++) {
      const ratio = step / steps
      dense.push({
        x: previous.x + (current.x - previous.x) * ratio,
        y: previous.y + (current.y - previous.y) * ratio,
      })
    }
    dense.push(current)
  }
  return dense
}

function isErased(
  point: EraserPoint,
  centers: EraserPoint[],
  radius: number,
  geometry: PageGeometry
) {
  const target = toPx(point, geometry)
  for (const center of centers) {
    const origin = toPx(center, geometry)
    if (Math.hypot(target.x - origin.x, target.y - origin.y) <= radius) return true
  }
  return false
}

/** Comprimento do traço em pixels — para descartar cacos invisíveis. */
function lengthPx(points: EraserPoint[], geometry: PageGeometry) {
  let total = 0
  for (let index = 1; index < points.length; index++) {
    const a = toPx(points[index - 1], geometry)
    const b = toPx(points[index], geometry)
    total += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return total
}

/**
 * O que SOBRA de um traço depois de a borracha passar. Devolve zero, um ou
 * vários pedaços — passar a borracha no meio de um traço em U devolve dois.
 *
 * `centers` é o rastro inteiro da borracha naquele gesto, em coordenadas
 * normalizadas, e `radius` está em pixels da página.
 */
export function splitStroke(
  points: EraserPoint[],
  centers: EraserPoint[],
  radius: number,
  geometry: PageGeometry,
  tolerance = 0
): EraserPoint[][] {
  if (points.length === 0) return []
  if (centers.length === 0) return [points]
  const reach = radius + tolerance
  const dense = densify(points, Math.max(2, reach / 2), geometry)

  const segments: EraserPoint[][] = []
  let current: EraserPoint[] = []
  for (const point of dense) {
    if (isErased(point, centers, reach, geometry)) {
      if (current.length > 1) segments.push(current)
      current = []
      continue
    }
    current.push(point)
  }
  if (current.length > 1) segments.push(current)

  // Um caco de 2 px não é traço nenhum: só sujeira que voltaria a aparecer
  // salva no banco e atrapalhando a próxima passada da borracha.
  return segments.filter((segment) => lengthPx(segment, geometry) >= Math.max(3, reach / 3))
}

/**
 * Enxuga o traço antes de salvar: o adensamento feito para a borracha acertar
 * o alvo não precisa ir para o banco. Mantém sempre o primeiro e o último
 * ponto — é o que garante que o pedaço termine exatamente onde terminava.
 */
export function compactStroke(points: EraserPoint[], minStepPx: number, geometry: PageGeometry) {
  if (points.length < 3) return points
  const compact: EraserPoint[] = [points[0]]
  let last = toPx(points[0], geometry)
  for (let index = 1; index < points.length - 1; index++) {
    const current = toPx(points[index], geometry)
    if (Math.hypot(current.x - last.x, current.y - last.y) < minStepPx) continue
    compact.push(points[index])
    last = current
  }
  compact.push(points[points.length - 1])
  return compact
}
