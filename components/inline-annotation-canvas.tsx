'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pencil,
  Eraser,
  Highlighter,
  Type,
  MousePointer2,
  Trash2,
  Undo2,
  Redo2,
  Square,
  Circle,
  Minus,
  ArrowUpRight,
  Check,
  Palette,
  Shapes,
  Flashlight,
} from 'lucide-react'
import {
  DrawingTool,
  EraserType,
  SelectionMode,
  Point,
  DrawingStroke,
  TextAnnotation,
  QuestionAnnotation,
  StrokeShape,
} from '@/lib/types'
import { cn } from '@/lib/utils'

type ExtendedTool = DrawingTool | 'line' | 'rectangle' | 'ellipse' | 'arrow' | 'laser'

const DEFAULT_DARK_INK = '#f8fafc'
const DEFAULT_LIGHT_INK = '#0f172a'
const LASER_COLOR = '#ff3b30'
const LASER_FADE_MS = 1000

// Vertical bleed past the wrapped content's own box, so a stroke isn't cut
// off right at the top/bottom edge (kept modest so stacked questions in
// scroll mode don't visually overlap). Horizontal bleed spans the full
// viewport instead — see resizeCanvas.
const CANVAS_BLEED_Y = 20

const PEN_PRESETS = ['#0f172a', '#ffffff', '#dc2626', '#2563eb', '#16a34a', '#7c3aed', '#ea580c']
const HIGHLIGHTER_PRESETS = ['#fde047', '#fbbf24', '#86efac', '#7dd3fc', '#fca5a5', '#c4b5fd']

/**
 * ═══ O marca-texto ═══
 *
 * O que ele era: o mesmo código da caneta, com `globalAlpha` menor e ponta
 * redonda. Três defeitos vinham daí, e os três apareciam justamente no gesto
 * para o qual a ferramenta existe — arrastar por cima de uma linha de texto.
 *
 *  1. **Manchas.** Cada movimento do ponteiro desenhava UM segmento por cima do
 *     que já estava na tela, com alpha. Traço translúcido sobre traço
 *     translúcido soma: onde a mão ia devagar (mais segmentos no mesmo lugar),
 *     no vai-e-vem e em cada curva, a tinta escurecia até virar borrão. O grifo
 *     saía manchado, e não era impressão — era o alpha somando dezenas de
 *     vezes. Agora o traço em andamento é redesenhado INTEIRO a cada quadro,
 *     numa passada só: a opacidade é a mesma do começo ao fim, doa onde a mão
 *     parar.
 *  2. **Ponta redonda.** Marca-texto de verdade tem ponta chanfrada; a redonda
 *     deixava as extremidades com cara de bolinha e a linha com cara de caneta
 *     gorda. `lineCap: 'butt'` corta reto.
 *  3. **Tinta por cima da tinta.** Grifo desenhado depois de uma anotação a
 *     caneta cobria a caneta. Agora o marca-texto vai por baixo de tudo (é
 *     desenhado primeiro) e compõe com `multiply`, que é o que o papel faz:
 *     escurece o que está embaixo em vez de apagar.
 *
 * E o que ele ganhou: `endireitarGrifo`. Ninguém consegue arrastar o dedo (ou o
 * mouse) em linha reta sobre uma frase — o traço sai ondulado e cobre metade da
 * linha de cima. Quando o gesto é claramente horizontal, ele é achatado na
 * altura média. É o que faz o grifo parecer feito com régua.
 */
const HIGHLIGHTER_OPACITY = 0.38
/** Largura padrão: cobre uma linha de texto de corpo sem invadir a de cima. */
const HIGHLIGHTER_DEFAULT_SIZE = 22

/**
 * Achata um traço de marca-texto quase-horizontal numa faixa reta.
 *
 * O critério é a proporção: só endireita quando a variação vertical do gesto é
 * pequena perto da distância percorrida na horizontal — ou seja, quando a
 * pessoa claramente quis marcar UMA linha. Um grifo diagonal, um círculo ou
 * uma marcação vertical na margem passam intactos.
 */
export function endireitarGrifo(pontos: Point[], espessura: number): Point[] {
  if (pontos.length < 2) return pontos

  let minX = pontos[0].x, maxX = pontos[0].x
  let minY = pontos[0].y, maxY = pontos[0].y
  for (const p of pontos) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }

  const larguraDoGesto = maxX - minX
  const alturaDoGesto = maxY - minY

  // Curto demais para saber o que era: um toque, um ponto. Fica como está.
  if (larguraDoGesto < espessura * 1.5) return pontos
  // Tolerância proporcional à espessura: com um marcador grosso a mão treme
  // mais e ainda assim a intenção é a mesma linha.
  if (alturaDoGesto > espessura * 0.85) return pontos
  if (alturaDoGesto > larguraDoGesto * 0.3) return pontos

  const y = pontos.reduce((soma, p) => soma + p.y, 0) / pontos.length
  return [{ x: minX, y }, { x: maxX, y }]
}

function isShapeTool(t: ExtendedTool): t is 'line' | 'rectangle' | 'ellipse' | 'arrow' {
  return t === 'line' || t === 'rectangle' || t === 'ellipse' || t === 'arrow'
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ───────────────────────────────────────────────────────────
// Single-active-annotator store — only one question's canvas
// captures the pointer / shows a toolbar at a time, even when
// several questions are stacked on the same page (scroll mode).
// ───────────────────────────────────────────────────────────
let activeQuestionId: string | null = null
const activeListeners = new Set<() => void>()

function setActiveQuestion(id: string | null) {
  activeQuestionId = id
  activeListeners.forEach(fn => fn())
}

function useIsActiveAnnotator(questionId: string) {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const listener = () => forceUpdate(v => v + 1)
    activeListeners.add(listener)
    return () => { activeListeners.delete(listener) }
  }, [])
  // Sair do modo anotação quando a questão sai da tela (troca de questão no
  // modo paginado ou desmontagem), senão o estado global fica preso numa
  // questão que ninguém mais está vendo.
  useEffect(() => {
    return () => { if (activeQuestionId === questionId) setActiveQuestion(null) }
  }, [questionId])
  const isActive = activeQuestionId === questionId
  const activate = useCallback(() => setActiveQuestion(questionId), [questionId])
  const deactivate = useCallback(() => { if (activeQuestionId === questionId) setActiveQuestion(null) }, [questionId])
  return { isActive, activate, deactivate }
}

/**
 * `true` enquanto QUALQUER questão estiver em modo anotação.
 *
 * Serve para o resto da tela sair da frente (ex.: o botão flutuante do mapa
 * de questões) enquanto a pessoa está desenhando.
 */
export function useAnnotationModeActive(): boolean {
  const [active, setActive] = useState(false)
  useEffect(() => {
    const listener = () => setActive(activeQuestionId !== null)
    activeListeners.add(listener)
    listener()
    return () => { activeListeners.delete(listener) }
  }, [])
  return active
}

interface InlineAnnotationCanvasProps {
  questionId: string
  questionNumber?: number
  annotation?: QuestionAnnotation
  onChange: (annotation: QuestionAnnotation) => void
  children: React.ReactNode
  className?: string
  /**
   * De que lado o botão flutuante de anotar mora. Padrão: direita.
   *
   * Ele é `sticky`, então enquanto a questão rola ele atravessa toda a altura
   * dela naquela faixa. No computador a faixa é RESERVADA (o conteúdo recua
   * 3,5rem daquele lado e o botão ocupa o recuo), então ele não cobre nada —
   * ver o comentário no `className` do wrapper. No celular não há recuo: a tela
   * é estreita demais para gastar 56px de enunciado, e o botão volta a
   * sobrepor. Por isso o lado ainda importa: à direita ele passaria sobre o "X"
   * de riscar de cada alternativa (um alvo de 36px); à esquerda, sobre a letra
   * da alternativa (A/B/C/D), que não é botão nenhum.
   */
  alinhamentoDoBotao?: 'direita' | 'esquerda'
}

/**
 * Draws directly on top of whatever is passed as `children` — no fullscreen
 * modal. A floating pill toggles "draw mode": off, the canvas is
 * pointer-events:none so the question behaves normally (tap alternatives,
 * scroll); on, it captures the pointer and a GoodNotes-style toolbar
 * appears. Ink itself is always visible, on or off.
 */
export function InlineAnnotationCanvas({
  questionId,
  questionNumber = 0,
  annotation,
  onChange,
  children,
  className,
  alinhamentoDoBotao = 'direita',
}: InlineAnnotationCanvasProps) {
  const { isActive, activate, deactivate } = useIsActiveAnnotator(questionId)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const dprRef = useRef(1)
  const sizeRef = useRef({ w: 0, h: 0 })
  const leftOffsetRef = useRef(0)

  const [strokes, setStrokes] = useState<DrawingStroke[]>(annotation?.strokes || [])
  const [texts, setTexts] = useState<TextAnnotation[]>(annotation?.texts || [])
  const strokesRef = useRef(strokes)
  const textsRef = useRef(texts)
  strokesRef.current = strokes
  textsRef.current = texts

  const [tool, setTool] = useState<ExtendedTool>('pen')
  const [penColor, setPenColor] = useState(DEFAULT_LIGHT_INK)
  const [penThickness, setPenThickness] = useState(2.5)
  const [highlighterColor, setHighlighterColor] = useState('#fde047')
  const [highlighterSize, setHighlighterSize] = useState(HIGHLIGHTER_DEFAULT_SIZE)
  const [eraserSize, setEraserSize] = useState(22)
  const [eraserType, setEraserType] = useState<EraserType>('standard')
  const [textColor, setTextColor] = useState(DEFAULT_LIGHT_INK)
  const [textSize, setTextSize] = useState(18)
  const [shapeColor, setShapeColor] = useState(DEFAULT_LIGHT_INK)
  const [shapeThickness, setShapeThickness] = useState(2.5)
  const [shapeFilled, setShapeFilled] = useState(false)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('rectangle')

  /*
   * ═══ A tinta padrão segue o tema ═══
   *
   * Regra: no escuro a caneta nasce BRANCA, no claro nasce PRETA. Parece óbvio,
   * e era exatamente o que não acontecia — por dois motivos, os dois nesta
   * função.
   *
   *  1. Ela lia `documentElement.classList.contains('dark')` UMA vez, no mount.
   *     O tema é aplicado pelo `next-themes`, e num carregamento em que a
   *     classe ainda não estava no `<html>` quando este componente montou, a
   *     leitura dava "claro" — no escuro, com tinta quase preta sobre fundo
   *     quase preto: a pessoa desenhava e não via nada. `resolvedTheme` não
   *     tem esse problema: ele chega (e muda) por estado do React.
   *  2. `if (defaultInk === DEFAULT_LIGHT_INK) return` fazia o caminho claro
   *     não fazer nada. Quem começava no escuro (caneta branca) e trocava para
   *     o claro continuava com a caneta branca sobre papel branco — o mesmo
   *     desaparecimento, na direção contrária.
   *
   * A troca de tema atualiza a tinta nos dois sentidos, e para de fazê-lo no
   * instante em que a pessoa escolhe uma cor: uma escolha explícita não é uma
   * preferência de tema, e sobrescrevê-la seria pior do que o defeito original.
   */
  const { resolvedTheme } = useTheme()
  const temaEscuro = resolvedTheme === 'dark'
  const corEscolhidaNaMao = useRef(false)

  useEffect(() => {
    if (corEscolhidaNaMao.current) return
    const tinta = temaEscuro ? DEFAULT_DARK_INK : DEFAULT_LIGHT_INK
    const outra = temaEscuro ? DEFAULT_LIGHT_INK : DEFAULT_DARK_INK
    const trocar = (anterior: string) => (anterior === outra ? tinta : anterior)
    setPenColor(trocar)
    setShapeColor(trocar)
    setTextColor(trocar)
  }, [temaEscuro])

  /**
   * Marca a cor como escolhida à mão e aplica.
   *
   * A partir daqui a troca de tema não mexe mais na tinta desta questão.
   */
  const escolherCor = useCallback((aplicar: (cor: string) => void) => (cor: string) => {
    corEscolhidaNaMao.current = true
    aplicar(cor)
  }, [])

  const [showShapePicker, setShowShapePicker] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([])
  const [selectedTextIds, setSelectedTextIds] = useState<string[]>([])
  const [isAddingText, setIsAddingText] = useState(false)
  const [textDraft, setTextDraft] = useState('')
  const [textPosition, setTextPosition] = useState<Point | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearingAnim, setIsClearingAnim] = useState(false)

  // In-progress interaction refs (kept out of React state for perf)
  const isPointerDownRef = useRef(false)
  const freehandPointsRef = useRef<Point[]>([]) // pixel-space, current stroke
  /**
   * Qual ferramenta está desenhando agora — `null` quando nada está.
   *
   * É o que permite ao `fullRedraw` incluir o traço em andamento na mesma
   * passada do resto, em vez de ele ser pintado por fora (que é o que fazia o
   * marca-texto manchar).
   */
  const tracoEmAndamentoRef = useRef<'pen' | 'highlighter' | null>(null)
  const quadroDoTracoRef = useRef<number | null>(null)
  const lastDrawnPointRef = useRef<Point | null>(null)
  const shapeStartRef = useRef<Point | null>(null)
  const [shapePreviewEnd, setShapePreviewEnd] = useState<Point | null>(null)
  const [shapePreviewStart, setShapePreviewStart] = useState<Point | null>(null)
  const dragStartRef = useRef<Point | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionPath, setSelectionPath] = useState<Point[]>([])

  // Laser pointer — pure visual trail, never enters strokes/history/onChange.
  const laserPointsRef = useRef<Point[]>([])
  const laserFadeStartRef = useRef<number | null>(null)
  const laserRafRef = useRef<number | null>(null)
  const laserLoopRunningRef = useRef(false)

  type HistorySnapshot = { strokes: DrawingStroke[]; texts: TextAnnotation[] }
  const historyRef = useRef<HistorySnapshot[]>([{ strokes: annotation?.strokes || [], texts: annotation?.texts || [] }])
  const historyIndexRef = useRef(0)
  const [, bumpHistory] = useState(0)

  // ───────────────────────────────────────────────────────────
  // Ressincronizar ao TROCAR DE QUESTÃO.
  //
  // No modo paginado (prova em /exam/<id> e resolução de listas do Banco de
  // Questões) só existe UMA instância deste componente: ao avançar para a
  // próxima questão, o React reaproveita a mesma instância e apenas troca as
  // props. Como `strokes`/`texts` só eram inicializados no mount, o desenho
  // da questão anterior continuava na tela — e o próximo `onChange` gravava
  // esses traços antigos no id da questão nova.
  //
  // Aqui, sempre que o `questionId` muda, carregamos a anotação salva da nova
  // questão (ou nada) e zeramos histórico, seleção e qualquer interação em
  // andamento.
  // ───────────────────────────────────────────────────────────
  const syncedQuestionIdRef = useRef(questionId)
  useEffect(() => {
    if (syncedQuestionIdRef.current === questionId) return
    syncedQuestionIdRef.current = questionId

    const nextStrokes = annotation?.strokes || []
    const nextTexts = annotation?.texts || []
    setStrokes(nextStrokes)
    setTexts(nextTexts)
    strokesRef.current = nextStrokes
    textsRef.current = nextTexts

    historyRef.current = [{ strokes: nextStrokes, texts: nextTexts }]
    historyIndexRef.current = 0
    bumpHistory(v => v + 1)

    setSelectedStrokeIds([])
    setSelectedTextIds([])
    setIsAddingText(false)
    setTextDraft('')
    setTextPosition(null)
    setShowClearConfirm(false)
    setIsClearingAnim(false)
    setShowShapePicker(false)
    setShowCustomize(false)
    setIsSelecting(false)
    setSelectionPath([])
    setShapePreviewStart(null)
    setShapePreviewEnd(null)

    isPointerDownRef.current = false
    freehandPointsRef.current = []
    lastDrawnPointRef.current = null
    tracoEmAndamentoRef.current = null
    if (quadroDoTracoRef.current !== null) {
      cancelAnimationFrame(quadroDoTracoRef.current)
      quadroDoTracoRef.current = null
    }
    shapeStartRef.current = null
    dragStartRef.current = null

    // O laser é puro overlay animado: se o loop estava rodando com o ponteiro
    // ainda pressionado, ele nunca receberia o "solta" da questão anterior e
    // ficaria redesenhando para sempre.
    if (laserRafRef.current) cancelAnimationFrame(laserRafRef.current)
    laserRafRef.current = null
    laserLoopRunningRef.current = false
    laserPointsRef.current = []
    laserFadeStartRef.current = null
    // Lemos `annotation` aqui de propósito sem declará-la como dependência: a
    // guarda acima já limita o efeito à troca de questão, e nesse render a
    // prop já é a anotação da questão nova.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId])

  // ───── Normalization helpers (fraction of current width) ─────
  const toFrac = useCallback((p: Point): Point => {
    const w = sizeRef.current.w || 1
    return { x: p.x / w, y: p.y / w }
  }, [])
  const toPx = useCallback((p: Point): Point => {
    const w = sizeRef.current.w || 1
    return { x: p.x * w, y: p.y * w }
  }, [])

  const emitChange = useCallback((nextStrokes: DrawingStroke[], nextTexts: TextAnnotation[]) => {
    const canvas = canvasRef.current
    onChange({
      questionId,
      questionNumber,
      strokes: nextStrokes,
      texts: nextTexts,
      canvasDataUrl: canvas ? snapshot(nextStrokes, nextTexts) : undefined,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, questionNumber, onChange])

  const pushHistory = useCallback((nextStrokes: DrawingStroke[], nextTexts: TextAnnotation[]) => {
    const stack = historyRef.current.slice(0, historyIndexRef.current + 1)
    stack.push({ strokes: nextStrokes, texts: nextTexts })
    while (stack.length > 60) stack.shift()
    historyRef.current = stack
    historyIndexRef.current = stack.length - 1
    bumpHistory(v => v + 1)
    emitChange(nextStrokes, nextTexts)
  }, [emitChange])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const snap = historyRef.current[historyIndexRef.current]
    setStrokes(snap.strokes)
    setTexts(snap.texts)
    setSelectedStrokeIds([])
    setSelectedTextIds([])
    bumpHistory(v => v + 1)
    emitChange(snap.strokes, snap.texts)
  }, [emitChange])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    const snap = historyRef.current[historyIndexRef.current]
    setStrokes(snap.strokes)
    setTexts(snap.texts)
    setSelectedStrokeIds([])
    setSelectedTextIds([])
    bumpHistory(v => v + 1)
    emitChange(snap.strokes, snap.texts)
  }, [emitChange])

  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1

  // ───── Canvas sizing ─────
  // Horizontally the canvas spans the FULL viewport width, not just the
  // question card's own box — on a wide desktop/tablet screen the card sits
  // in a centered max-width column with a lot of empty page margin on each
  // side, and that margin is exactly where "draw outside the question" is
  // supposed to work. A small fixed bleed (the previous approach) barely
  // reached past the card's own border, which is why it looked like nothing
  // changed on anything wider than a phone. Vertically we keep a modest
  // bleed only, so stacked questions (scroll mode) don't overlap.
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return
    const wrapperRect = wrapper.getBoundingClientRect()
    const leftOffset = Math.round(wrapperRect.left)
    // documentElement.clientWidth excludes the vertical scrollbar; window.innerWidth
    // does not. getBoundingClientRect() is measured against the scrollbar-excluded
    // area, so using innerWidth here made the canvas a few px too wide — just
    // enough to push the page into horizontal scroll.
    const w = Math.max(1, Math.floor(document.documentElement.clientWidth))
    const h = Math.max(1, Math.round(wrapper.offsetHeight)) + CANVAS_BLEED_Y * 2
    if (sizeRef.current.w === w && sizeRef.current.h === h && leftOffsetRef.current === leftOffset) return
    sizeRef.current = { w, h }
    leftOffsetRef.current = leftOffset
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
    dprRef.current = dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    canvas.style.left = `${-leftOffset}px`
    canvas.style.top = `${-CANVAS_BLEED_Y}px`
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctxRef.current = ctx
    fullRedraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    resizeCanvas()
    const wrapper = wrapperRef.current
    window.addEventListener('resize', resizeCanvas)
    if (!wrapper || typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', resizeCanvas)
    }
    const ro = new ResizeObserver(() => resizeCanvas())
    ro.observe(wrapper)
    return () => { ro.disconnect(); window.removeEventListener('resize', resizeCanvas) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeCanvas])

  // The wrapper's horizontal offset from the viewport can shift without the
  // wrapper's own box size changing (e.g. a sidebar collapsing elsewhere) —
  // re-measure right as the user enters draw mode, when it matters most.
  useEffect(() => { if (isActive) resizeCanvas() }, [isActive, resizeCanvas])

  // ───── Drawing primitives (all operate in pixel space) ─────
  /**
   * Um traço à mão livre, numa passada só.
   *
   * `marcaTexto` muda três coisas de uma vez, e é por isso que é um parâmetro e
   * não três: ponta chanfrada (`butt`), composição `multiply` — a tinta escurece
   * o que está embaixo em vez de cobrir — e nenhuma bolinha nas pontas quando o
   * traço é um toque só. Ver o bloco `═══ O marca-texto ═══` no topo.
   */
  const drawFreehandPx = useCallback((
    ctx: CanvasRenderingContext2D,
    pts: Point[],
    color: string,
    thicknessPx: number,
    opacity = 1,
    marcaTexto = false,
  ) => {
    if (pts.length === 0) return
    ctx.save()
    ctx.globalAlpha = opacity
    if (marcaTexto) ctx.globalCompositeOperation = 'multiply'
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = thicknessPx
    ctx.lineCap = marcaTexto ? 'butt' : 'round'
    ctx.lineJoin = 'round'
    if (pts.length === 1) {
      if (marcaTexto) {
        // Um toque com o marcador é um quadradinho de tinta, não um círculo:
        // a ponta é chanfrada, e a bolinha entregava a mentira.
        const meio = thicknessPx / 2
        ctx.fillRect(pts[0].x - meio, pts[0].y - meio, thicknessPx, thicknessPx)
      } else {
        ctx.beginPath()
        ctx.arc(pts[0].x, pts[0].y, thicknessPx / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.stroke()
    }
    ctx.restore()
  }, [])

  /** O traço é marca-texto? (traço antigo pode não ter `tool` gravado.) */
  const eGrifo = useCallback((s: DrawingStroke) => s.tool === 'highlighter' && !s.shape, [])

  const strokeToPx = useCallback((s: DrawingStroke) => ({
    points: s.points.map(toPx),
    thickness: s.thickness * sizeRef.current.w,
  }), [toPx])

  const drawShapePx = useCallback((ctx: CanvasRenderingContext2D, start: Point, end: Point, shape: StrokeShape, color: string, thicknessPx: number, filled: boolean, selected = false) => {
    ctx.save()
    if (selected) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)'
      ctx.lineWidth = thicknessPx + 6
      ctx.lineCap = 'round'
      switch (shape) {
        case 'rectangle': ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y); break
        case 'ellipse': {
          const cx = (start.x + end.x) / 2, cy = (start.y + end.y) / 2
          const rx = Math.abs(end.x - start.x) / 2, ry = Math.abs(end.y - start.y) / 2
          ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke()
          break
        }
        default: ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke()
      }
    }
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = thicknessPx
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    switch (shape) {
      case 'rectangle':
        if (filled) ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y)
        else ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
        break
      case 'ellipse': {
        const cx = (start.x + end.x) / 2, cy = (start.y + end.y) / 2
        const rx = Math.abs(end.x - start.x) / 2, ry = Math.abs(end.y - start.y) / 2
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        if (filled) ctx.fill(); else ctx.stroke()
        break
      }
      case 'arrow': {
        const headLen = Math.max(10, thicknessPx * 4)
        const angle = Math.atan2(end.y - start.y, end.x - start.x)
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6))
        ctx.closePath(); ctx.fill()
        break
      }
      default:
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke()
    }
    ctx.restore()
  }, [])

  const drawTextPx = useCallback((ctx: CanvasRenderingContext2D, t: TextAnnotation, selected = false) => {
    const w = sizeRef.current.w
    const pos = toPx(t.position)
    const fontPx = t.fontSize * w
    ctx.save()
    ctx.font = `${fontPx}px Inter, system-ui, sans-serif`
    if (selected) {
      const m = ctx.measureText(t.text)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.strokeRect(pos.x - 4, pos.y - fontPx - 4, m.width + 8, fontPx + 8)
      ctx.setLineDash([])
    }
    ctx.fillStyle = t.color
    ctx.fillText(t.text, pos.x, pos.y)
    ctx.restore()
  }, [toPx])

  const fullRedraw = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { w, h } = sizeRef.current
    ctx.clearRect(0, 0, w, h)

    /*
     * O marca-texto vai por BAIXO — ele é papel, não tinta.
     *
     * Desenhar na ordem de criação fazia um grifo passado depois cobrir a
     * anotação a caneta que estava embaixo dele. Grifando por cima da própria
     * letra, o resultado era apagar a nota que se queria destacar. Separando
     * as duas passadas, o grifo se comporta como no papel: seja qual for a
     * ordem em que a pessoa fez, a caneta fica legível por cima.
     */
    const emOrdemDeCamada = [
      ...strokesRef.current.filter(eGrifo),
      ...strokesRef.current.filter(s => !eGrifo(s)),
    ]

    emOrdemDeCamada.forEach(s => {
      const isSel = selectedStrokeIds.includes(s.id)
      const { points, thickness } = strokeToPx(s)
      if (s.shape && points.length >= 2) {
        drawShapePx(ctx, points[0], points[points.length - 1], s.shape, s.color, thickness, !!s.filled, isSel)
      } else {
        if (isSel) drawFreehandPx(ctx, points, 'rgba(59, 130, 246, 0.45)', thickness + 6)
        drawFreehandPx(ctx, points, s.color, thickness, s.opacity ?? 1, eGrifo(s))
      }
    })
    textsRef.current.forEach(t => drawTextPx(ctx, t, selectedTextIds.includes(t.id)))

    /*
     * O traço EM ANDAMENTO, redesenhado inteiro a cada quadro.
     *
     * Era desenhado segmento a segmento direto na tela, e cada segmento somava
     * seu alpha ao anterior: o grifo ficava manchado onde a mão desacelerava ou
     * voltava. Aqui ele entra numa passada só, com a opacidade final, junto do
     * resto — nada soma com nada.
     */
    if (tracoEmAndamentoRef.current && freehandPointsRef.current.length > 0) {
      const emGrifo = tracoEmAndamentoRef.current === 'highlighter'
      drawFreehandPx(
        ctx,
        freehandPointsRef.current,
        emGrifo ? highlighterColor : penColor,
        emGrifo ? highlighterSize : penThickness,
        emGrifo ? HIGHLIGHTER_OPACITY : 1,
        emGrifo,
      )
    }

    if (shapePreviewStart && shapePreviewEnd && isShapeTool(tool)) {
      // shapeThickness is already a raw CSS-pixel value (same convention as
      // penThickness/highlighterSize) — it must NOT be multiplied by the
      // canvas width here. Doing so previously turned a thickness of ~2.5
      // into a line width of thousands of pixels (canvas is now viewport-wide),
      // which blew out into a solid-color blob covering the whole screen.
      drawShapePx(ctx, shapePreviewStart, shapePreviewEnd, tool as StrokeShape, shapeColor, shapeThickness, shapeFilled)
    }

    if (isSelecting && selectionPath.length > 0) {
      ctx.save()
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)'
      ctx.fillStyle = 'rgba(59, 130, 246, 0.08)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      if (selectionMode === 'rectangle' && selectionPath.length >= 2) {
        const a = selectionPath[0], b = selectionPath[selectionPath.length - 1]
        ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y)
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
      } else if (selectionMode === 'lasso' && selectionPath.length > 1) {
        ctx.beginPath()
        ctx.moveTo(selectionPath[0].x, selectionPath[0].y)
        for (let i = 1; i < selectionPath.length; i++) ctx.lineTo(selectionPath[i].x, selectionPath[i].y)
        ctx.fill(); ctx.stroke()
      }
      ctx.restore()
    }
  }, [selectedStrokeIds, selectedTextIds, strokeToPx, drawShapePx, drawFreehandPx, drawTextPx, eGrifo, shapePreviewStart, shapePreviewEnd, tool, shapeColor, shapeThickness, shapeFilled, isSelecting, selectionPath, selectionMode, highlighterColor, highlighterSize, penColor, penThickness])

  useEffect(() => { fullRedraw() }, [fullRedraw, strokes, texts])

  // ───── Laser pointer — draws while held, fades out over ~1s once released ─────
  const drawLaserOverlay = useCallback((opacity: number) => {
    const ctx = ctxRef.current
    const pts = laserPointsRef.current
    if (!ctx || pts.length === 0 || opacity <= 0) return
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.strokeStyle = LASER_COLOR
    ctx.shadowColor = LASER_COLOR
    ctx.shadowBlur = 14
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (pts.length === 1) {
      ctx.fillStyle = LASER_COLOR
      ctx.beginPath()
      ctx.arc(pts[0].x, pts[0].y, 3, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.stroke()
    }
    ctx.restore()
  }, [])

  const runLaserLoop = useCallback(() => {
    const step = () => {
      const fadeStart = laserFadeStartRef.current
      let opacity = 1
      if (fadeStart !== null) {
        opacity = Math.max(0, 1 - (performance.now() - fadeStart) / LASER_FADE_MS)
      }
      fullRedraw()
      drawLaserOverlay(opacity)
      if (opacity <= 0 && fadeStart !== null) {
        laserPointsRef.current = []
        laserFadeStartRef.current = null
        laserLoopRunningRef.current = false
        fullRedraw()
        return
      }
      laserRafRef.current = requestAnimationFrame(step)
    }
    if (!laserLoopRunningRef.current) {
      laserLoopRunningRef.current = true
      laserRafRef.current = requestAnimationFrame(step)
    }
  }, [fullRedraw, drawLaserOverlay])

  useEffect(() => () => {
    if (laserRafRef.current) cancelAnimationFrame(laserRafRef.current)
    if (quadroDoTracoRef.current !== null) cancelAnimationFrame(quadroDoTracoRef.current)
  }, [])

  function snapshot(withStrokes: DrawingStroke[], withTexts: TextAnnotation[]): string | undefined {
    const { w, h } = sizeRef.current
    if (!w || !h) return undefined
    const exportCanvas = document.createElement('canvas')
    // The live canvas can now be viewport-wide (full-width drawing area);
    // cap the export so a wide desktop screen doesn't produce a multi-MB PNG.
    const scale = Math.min(2, 1600 / w)
    exportCanvas.width = w * scale
    exportCanvas.height = h * scale
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return undefined
    ctx.scale(scale, scale)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    // A mesma ordem de camada da tela: grifo por baixo, caneta por cima.
    const emOrdemDeCamada = [
      ...withStrokes.filter(eGrifo),
      ...withStrokes.filter(s => !eGrifo(s)),
    ]
    emOrdemDeCamada.forEach(s => {
      const points = s.points.map(toPx)
      const thickness = s.thickness * w
      if (s.shape && points.length >= 2) drawShapePx(ctx, points[0], points[points.length - 1], s.shape, s.color, thickness, !!s.filled)
      else drawFreehandPx(ctx, points, s.color, thickness, s.opacity ?? 1, eGrifo(s))
    })
    withTexts.forEach(t => drawTextPx(ctx, t))
    return exportCanvas.toDataURL('image/png')
  }

  // ───── Pointer handling ─────
  function getPoint(e: React.PointerEvent): Point {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isActive) return
    e.preventDefault()
    canvasRef.current?.setPointerCapture(e.pointerId)
    const point = getPoint(e)

    if (tool === 'pen' || tool === 'highlighter') {
      isPointerDownRef.current = true
      freehandPointsRef.current = [point]
      lastDrawnPointRef.current = point
      tracoEmAndamentoRef.current = tool
      fullRedraw()
      return
    }
    if (tool === 'laser') {
      isPointerDownRef.current = true
      laserFadeStartRef.current = null
      laserPointsRef.current = [point]
      runLaserLoop()
      return
    }
    if (isShapeTool(tool)) {
      isPointerDownRef.current = true
      shapeStartRef.current = point
      setShapePreviewStart(point)
      setShapePreviewEnd(point)
      return
    }
    if (tool === 'eraser') {
      isPointerDownRef.current = true
      eraseAt(point)
      return
    }
    if (tool === 'text') {
      setTextPosition(toFrac(point))
      setIsAddingText(true)
      return
    }
    if (tool === 'select') {
      setIsSelecting(true)
      setSelectionPath([point])
      setSelectedStrokeIds([])
      setSelectedTextIds([])
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isActive) return
    if (!isPointerDownRef.current && !isSelecting) return
    e.preventDefault()
    const point = getPoint(e)

    if ((tool === 'pen' || tool === 'highlighter') && isPointerDownRef.current) {
      const last = lastDrawnPointRef.current
      freehandPointsRef.current.push(point)
      lastDrawnPointRef.current = point

      /*
       * ═══ Duas ferramentas, dois jeitos de desenhar ═══
       *
       * A CANETA continua incremental: um segmento por movimento, direto na
       * tela. Ela é opaca, então segmento sobre segmento não soma nada — e é a
       * ferramenta mais usada, num traço que pode ficar longo. Refazer a tela
       * inteira a cada quadro só para ela seria pagar caro por nada.
       *
       * O MARCA-TEXTO não pode: com alpha, cada segmento pintado por cima do
       * anterior escurece o encontro, e o grifo sai manchado onde a mão vai
       * devagar ou volta. Ele redesenha a tela inteira — o traço em andamento
       * junto —, no máximo uma vez por quadro (o navegador dispara vários
       * `pointermove` entre dois frames, e sem esta guarda o redesenho
       * aconteceria três ou quatro vezes por quadro à toa).
       *
       * Nos dois casos `tracoEmAndamentoRef` está preenchido, então um
       * `fullRedraw` disparado por outra coisa no meio do traço não apaga o que
       * está sendo desenhado.
       */
      if (tool === 'pen') {
        const ctx = ctxRef.current
        if (ctx && last) drawFreehandPx(ctx, [last, point], penColor, penThickness)
        return
      }

      if (quadroDoTracoRef.current === null) {
        quadroDoTracoRef.current = requestAnimationFrame(() => {
          quadroDoTracoRef.current = null
          fullRedraw()
        })
      }
      return
    }

    if (tool === 'laser' && isPointerDownRef.current) {
      laserPointsRef.current.push(point)
      return
    }

    if (isShapeTool(tool) && isPointerDownRef.current && shapeStartRef.current) {
      setShapePreviewEnd(point)
      return
    }

    if (tool === 'eraser' && isPointerDownRef.current) {
      eraseAt(point)
      return
    }

    if (isSelecting) {
      if (selectionMode === 'rectangle') setSelectionPath([selectionPath[0], point])
      else setSelectionPath(prev => [...prev, point])
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isActive) return
    canvasRef.current?.releasePointerCapture?.(e.pointerId)

    if (isSelecting) {
      finalizeSelection()
      setIsSelecting(false)
      setSelectionPath([])
      return
    }

    if (!isPointerDownRef.current) return
    isPointerDownRef.current = false

    if (tool === 'laser') {
      laserFadeStartRef.current = performance.now()
      return
    }

    if (tool === 'pen' || tool === 'highlighter') {
      const grifo = tool === 'highlighter'
      // O grifo quase-horizontal vira uma faixa reta: ninguém arrasta o dedo em
      // linha reta sobre uma frase. Ver `endireitarGrifo`.
      const pts = grifo
        ? endireitarGrifo(freehandPointsRef.current, highlighterSize)
        : freehandPointsRef.current
      freehandPointsRef.current = []
      lastDrawnPointRef.current = null
      tracoEmAndamentoRef.current = null
      if (quadroDoTracoRef.current !== null) {
        cancelAnimationFrame(quadroDoTracoRef.current)
        quadroDoTracoRef.current = null
      }
      if (pts.length > 0) {
        const newStroke: DrawingStroke = {
          id: makeId('stroke'),
          tool,
          points: pts.map(toFrac),
          color: grifo ? highlighterColor : penColor,
          thickness: (grifo ? highlighterSize : penThickness) / sizeRef.current.w,
          opacity: grifo ? HIGHLIGHTER_OPACITY : 1,
        }
        const next = [...strokesRef.current, newStroke]
        setStrokes(next)
        pushHistory(next, textsRef.current)
      } else {
        fullRedraw()
      }
      return
    }

    if (isShapeTool(tool) && shapeStartRef.current && shapePreviewEnd) {
      const dist = Math.hypot(shapePreviewEnd.x - shapeStartRef.current.x, shapePreviewEnd.y - shapeStartRef.current.y)
      if (dist > 3) {
        const newStroke: DrawingStroke = {
          id: makeId('stroke'),
          tool: 'pen',
          shape: tool as StrokeShape,
          filled: shapeFilled && (tool === 'rectangle' || tool === 'ellipse'),
          points: [toFrac(shapeStartRef.current), toFrac(shapePreviewEnd)],
          color: shapeColor,
          thickness: shapeThickness / sizeRef.current.w,
        }
        const next = [...strokesRef.current, newStroke]
        setStrokes(next)
        pushHistory(next, textsRef.current)
      }
      shapeStartRef.current = null
      setShapePreviewStart(null)
      setShapePreviewEnd(null)
      return
    }

    if (tool === 'eraser') {
      pushHistory(strokesRef.current, textsRef.current)
    }
  }

  function finalizeSelection() {
    const path = selectionPath
    if (!path.length) return
    const selS: string[] = []
    const selT: string[] = []
    if (selectionMode === 'rectangle' && path.length >= 2) {
      const a = path[0], b = path[path.length - 1]
      const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x)
      const minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y)
      strokesRef.current.forEach(s => {
        const pts = s.points.map(toPx)
        if (pts.some(p => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY)) selS.push(s.id)
      })
      textsRef.current.forEach(t => {
        const p = toPx(t.position)
        if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) selT.push(t.id)
      })
    } else if (selectionMode === 'lasso' && path.length > 2) {
      strokesRef.current.forEach(s => {
        const pts = s.points.map(toPx)
        if (pts.some(p => isPointInPolygon(p, path))) selS.push(s.id)
      })
      textsRef.current.forEach(t => { if (isPointInPolygon(toPx(t.position), path)) selT.push(t.id) })
    }
    setSelectedStrokeIds(selS)
    setSelectedTextIds(selT)
  }

  function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y
      const xj = polygon[j].x, yj = polygon[j].y
      const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
      if (intersect) inside = !inside
    }
    return inside
  }

  function eraseAt(point: Point) {
    const eraserSizeFrac = eraserSize / sizeRef.current.w
    if (eraserType === 'standard') {
      const next: DrawingStroke[] = []
      const pFrac = toFrac(point)
      for (const stroke of strokesRef.current) {
        if (stroke.shape) {
          const hits = stroke.points.some(p => Math.hypot(p.x - pFrac.x, p.y - pFrac.y) < eraserSizeFrac / 2 + stroke.thickness)
          if (!hits) next.push(stroke)
          continue
        }
        const segments: Point[][] = []
        let cur: Point[] = []
        for (const p of stroke.points) {
          if (Math.hypot(p.x - pFrac.x, p.y - pFrac.y) >= eraserSizeFrac / 2) cur.push(p)
          else if (cur.length) { segments.push(cur); cur = [] }
        }
        if (cur.length) segments.push(cur)
        for (const seg of segments) {
          if (seg.length >= 2) next.push({ ...stroke, id: makeId('stroke'), points: seg })
        }
      }
      setStrokes(next)
    } else {
      const pFrac = toFrac(point)
      setStrokes(prev => prev.filter(s => !s.points.some(p => Math.hypot(p.x - pFrac.x, p.y - pFrac.y) < eraserSizeFrac / 2)))
    }
  }

  function deleteSelection() {
    if (!selectedStrokeIds.length && !selectedTextIds.length) return
    const nextS = strokesRef.current.filter(s => !selectedStrokeIds.includes(s.id))
    const nextT = textsRef.current.filter(t => !selectedTextIds.includes(t.id))
    setStrokes(nextS); setTexts(nextT)
    setSelectedStrokeIds([]); setSelectedTextIds([])
    pushHistory(nextS, nextT)
  }

  function commitText() {
    if (!textDraft.trim() || !textPosition) {
      setIsAddingText(false); setTextDraft(''); setTextPosition(null)
      return
    }
    const newText: TextAnnotation = {
      id: makeId('text'),
      text: textDraft,
      position: textPosition,
      fontSize: textSize / sizeRef.current.w,
      color: textColor,
    }
    const next = [...textsRef.current, newText]
    setTexts(next)
    pushHistory(strokesRef.current, next)
    setTextDraft(''); setIsAddingText(false); setTextPosition(null)
  }

  function requestClearAll() {
    if (!strokesRef.current.length && !textsRef.current.length) return
    setShowClearConfirm(true)
  }

  function confirmClearAll() {
    setShowClearConfirm(false)
    setIsClearingAnim(true)
    setTimeout(() => {
      setStrokes([]); setTexts([])
      setSelectedStrokeIds([]); setSelectedTextIds([])
      pushHistory([], [])
      setIsClearingAnim(false)
    }, 260)
  }

  // ───── Keyboard shortcuts (desktop/tablet w/ keyboard, only while active) ─────
  useEffect(() => {
    if (!isActive) return
    function onKey(e: KeyboardEvent) {
      if (isAddingText) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      const k = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return }
      if (k === 'escape') { deactivate(); return }
      if ((k === 'delete' || k === 'backspace') && (selectedStrokeIds.length || selectedTextIds.length)) { e.preventDefault(); deleteSelection(); return }
      const map: Record<string, ExtendedTool> = { p: 'pen', h: 'highlighter', e: 'eraser', t: 'text', s: 'select', l: 'line', r: 'rectangle', o: 'ellipse', a: 'arrow' }
      if (!e.ctrlKey && !e.metaKey && map[k]) { e.preventDefault(); setTool(map[k]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, undo, redo, selectedStrokeIds, selectedTextIds, isAddingText])

  const hasInk = strokes.length > 0 || texts.length > 0
  const selectionCount = selectedStrokeIds.length + selectedTextIds.length

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'relative transition-shadow duration-200',
        /*
         * ═══ A faixa do botão de anotar ═══
         *
         * O FAB é `sticky bottom`: ele flutua no rodapé da janela enquanto a
         * questão rola, encostado na borda direita DESTE bloco. E a borda
         * direita deste bloco é, no computador, exatamente onde ficam os botões
         * de riscar alternativa — um alvo de 36px que o botão cobria por
         * inteiro. Quem quisesse riscar a alternativa que estivesse na altura
         * do rodapé não conseguia: o botão de anotar estava na frente.
         *
         * A correção não é mover o botão para longe (ele precisa estar à mão),
         * é dar a ele uma FAIXA PRÓPRIA. Do `md` para cima o conteúdo recua
         * 3,5rem do lado em que o botão mora, e o botão ocupa esse recuo — nada
         * do conteúdo passa por baixo dele, em nenhuma altura de rolagem.
         *
         * No celular a faixa não existe: a tela é estreita, tirar 56px de
         * largura de enunciado custaria mais do que o encosto resolve, e lá o
         * dedo alcança o botão de riscar antes de o polegar chegar no FAB.
         */
        alinhamentoDoBotao === 'esquerda' ? 'md:pl-14' : 'md:pr-14',
        // Moldura discreta enquanto o modo anotação está ligado: deixa claro
        // que a questão está "em modo desenho" e não simplesmente travada.
        isActive && 'rounded-2xl ring-2 ring-primary/30 ring-offset-4 ring-offset-background',
        className
      )}
    >
      {children}

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute z-20"
        style={{
          touchAction: isActive ? 'none' : 'auto',
          pointerEvents: isActive ? 'auto' : 'none',
          cursor: !isActive ? 'default' : tool === 'text' ? 'text' : tool === 'select' ? 'crosshair' : tool === 'eraser' ? 'cell' : 'crosshair',
          opacity: isClearingAnim ? 0 : 1,
          transition: 'opacity 280ms ease',
        }}
      />

      {/* Collapsed toggle — sticky within this question's own content, so it
          stays reachable while scrolling through a long question and scrolls
          away naturally once you move past it. No portal: each question owns one. */}
      {!isActive && (
        // `--anotacao-espaco-inferior` deixa a página empurrar o FAB para cima
        // quando existe uma barra fixa no rodapé (ex.: navegação da prova).
        <div
          className={cn(
            'sticky bottom-[calc(0.75rem+var(--anotacao-espaco-inferior,0px))] z-30 flex pointer-events-none',
            // O negativo devolve o botão à faixa que o `md:p*-14` acima
            // reservou: ele fica FORA do conteúdo, não por cima dele.
            alinhamentoDoBotao === 'esquerda'
              ? 'justify-start pl-0.5 md:-ml-14 md:pl-0'
              : 'justify-end pr-0.5 md:-mr-14 md:pr-0',
          )}
        >
          <AnnotateFab hasInk={hasInk} onClick={activate} />
        </div>
      )}

      {/* Expanded toolbar */}
      {typeof document !== 'undefined' && isActive && createPortal(
        <Toolbar
          tool={tool} setTool={setTool}
          penColor={penColor} setPenColor={escolherCor(setPenColor)}
          penThickness={penThickness} setPenThickness={setPenThickness}
          highlighterColor={highlighterColor} setHighlighterColor={setHighlighterColor}
          highlighterSize={highlighterSize} setHighlighterSize={setHighlighterSize}
          eraserSize={eraserSize} setEraserSize={setEraserSize}
          eraserType={eraserType} setEraserType={setEraserType}
          textColor={textColor} setTextColor={escolherCor(setTextColor)}
          textSize={textSize} setTextSize={setTextSize}
          shapeColor={shapeColor} setShapeColor={escolherCor(setShapeColor)}
          shapeThickness={shapeThickness} setShapeThickness={setShapeThickness}
          shapeFilled={shapeFilled} setShapeFilled={setShapeFilled}
          selectionMode={selectionMode} setSelectionMode={setSelectionMode}
          showShapePicker={showShapePicker} setShowShapePicker={setShowShapePicker}
          showCustomize={showCustomize} setShowCustomize={setShowCustomize}
          canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo}
          onClear={requestClearAll} hasInk={hasInk}
          selectionCount={selectionCount} onDeleteSelection={deleteSelection}
          onDone={deactivate}
        />,
        document.body
      )}

      {/* Clear-all confirmation — replaces the native confirm() popup */}
      {typeof document !== 'undefined' && createPortal(
        <ClearConfirmModal
          open={showClearConfirm}
          strokeCount={strokes.length}
          textCount={texts.length}
          onCancel={() => setShowClearConfirm(false)}
          onConfirm={confirmClearAll}
        />,
        document.body
      )}

      {/* Text input popover */}
      {isAddingText && textPosition && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setIsAddingText(false); setTextDraft(''); setTextPosition(null) }}>
          <div className="bg-background border border-border/60 rounded-2xl p-5 shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-sm mb-3">Adicionar texto</h3>
            <input
              autoFocus
              value={textDraft}
              onChange={e => setTextDraft(e.target.value)}
              placeholder="Digite o texto…"
              onKeyDown={e => {
                if (e.key === 'Enter') commitText()
                if (e.key === 'Escape') { setIsAddingText(false); setTextDraft(''); setTextPosition(null) }
              }}
              className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2 justify-end mt-3">
              <button className="px-3 py-1.5 text-xs rounded-lg hover:bg-muted" onClick={() => { setIsAddingText(false); setTextDraft(''); setTextPosition(null) }}>Cancelar</button>
              <button className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground disabled:opacity-40" disabled={!textDraft.trim()} onClick={commitText}>Adicionar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Collapsed FAB
// ───────────────────────────────────────────────────────────
function AnnotateFab({ hasInk, onClick }: { hasInk: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      title="Anotar questão"
      aria-label="Anotar questão"
      initial={{ scale: 0, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className={cn(
        'pointer-events-auto relative flex items-center gap-2 h-11 pl-3.5 pr-4 rounded-full',
        // Na faixa reservada do computador (3,5rem) o botão é redondo e só o
        // lápis: o rótulo não caberia sem voltar a invadir o conteúdo, e ali
        // ele já está isolado o bastante para se explicar sozinho — o `title`
        // e o `aria-label` continuam dizendo o que ele faz.
        'md:h-11 md:w-11 md:justify-center md:gap-0 md:px-0',
        'glass-page-card glass-rim shadow-lg backdrop-blur-md font-semibold text-xs',
        hasInk ? 'text-violet-600 dark:text-violet-300' : 'text-primary'
      )}
    >
      {!hasInk && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{ boxShadow: ['0 0 0 0 rgba(70,129,82,0.38)', '0 0 0 9px rgba(70,129,82,0)'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <motion.span
        animate={hasInk ? {} : { rotate: [0, -10, 10, -6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
        className="flex-shrink-0"
      >
        <Pencil className="h-4 w-4" />
      </motion.span>
      <span className="whitespace-nowrap md:hidden">{hasInk ? 'Suas notas' : 'Anotar'}</span>
      {hasInk && (
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse flex-shrink-0 md:absolute md:right-1 md:top-1" />
      )}
    </motion.button>
  )
}

// ───────────────────────────────────────────────────────────
// Clear-all confirmation modal — replaces the native confirm() popup
// ───────────────────────────────────────────────────────────
function ClearConfirmModal({
  open,
  strokeCount,
  textCount,
  onCancel,
  onConfirm,
}: {
  open: boolean
  strokeCount: number
  textCount: number
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[320] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-full max-w-xs rounded-2xl glass-page-card glass-rim shadow-2xl p-5 text-center space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, -22, 20, -14, 8, 0], x: [0, -3, 3, -2, 1, 0] }}
                transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 0.4, ease: 'easeInOut' }}
              >
                <Eraser className="h-7 w-7 text-rose-600 dark:text-rose-400" />
              </motion.div>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Limpar todas as anotações?</h3>
              <p className="text-xs text-muted-foreground">
                {strokeCount + textCount} {strokeCount + textCount === 1 ? 'item' : 'itens'} desta questão {strokeCount + textCount === 1 ? 'será apagado' : 'serão apagados'}. Não dá pra desfazer.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 h-9 rounded-xl text-xs font-medium border border-border/60 hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 h-9 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Limpar tudo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ───────────────────────────────────────────────────────────
// Expanded toolbar
// ───────────────────────────────────────────────────────────
interface ToolbarProps {
  tool: ExtendedTool; setTool: (t: ExtendedTool) => void
  penColor: string; setPenColor: (c: string) => void
  penThickness: number; setPenThickness: (n: number) => void
  highlighterColor: string; setHighlighterColor: (c: string) => void
  highlighterSize: number; setHighlighterSize: (n: number) => void
  eraserSize: number; setEraserSize: (n: number) => void
  eraserType: EraserType; setEraserType: (t: EraserType) => void
  textColor: string; setTextColor: (c: string) => void
  textSize: number; setTextSize: (n: number) => void
  shapeColor: string; setShapeColor: (c: string) => void
  shapeThickness: number; setShapeThickness: (n: number) => void
  shapeFilled: boolean; setShapeFilled: (b: boolean) => void
  selectionMode: SelectionMode; setSelectionMode: (m: SelectionMode) => void
  showShapePicker: boolean; setShowShapePicker: (b: boolean) => void
  showCustomize: boolean; setShowCustomize: (b: boolean) => void
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void
  onClear: () => void; hasInk: boolean
  selectionCount: number; onDeleteSelection: () => void
  onDone: () => void
}

function Toolbar(props: ToolbarProps) {
  const { tool, setTool, showShapePicker, setShowShapePicker, showCustomize, setShowCustomize } = props
  const shapeIcons: Record<string, typeof Square> = { line: Minus, rectangle: Square, ellipse: Circle, arrow: ArrowUpRight }
  const ShapeIcon = isShapeTool(tool) ? shapeIcons[tool] : Shapes

  // Dica de saída: some sozinha depois de alguns segundos (ou assim que a
  // pessoa abre um popover da barra), para não ficar poluindo a tela.
  const [showHint, setShowHint] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-x-0 bottom-0 z-[250] flex flex-col items-center px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pointer-events-none">
      {/* Dica de saída — aparece ao entrar no modo anotação e some sozinha */}
      <AnimatePresence>
        {showHint && !showCustomize && !showShapePicker && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-2 max-w-full rounded-full glass-page-card glass-rim shadow-lg px-3.5 py-1.5 text-[11px] text-muted-foreground text-center"
          >
            Modo anotação ativo — toque em{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Concluir</span>
            <span className="hidden sm:inline"> (ou aperte Esc)</span> para voltar à prova
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pointer-events-auto flex items-end gap-2 max-w-full">
        {showCustomize && (
          <CustomizePopover {...props} onClose={() => setShowCustomize(false)} />
        )}
        {showShapePicker && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex gap-1 p-1.5 rounded-2xl glass-page-card glass-rim shadow-xl">
            {(['line', 'rectangle', 'ellipse', 'arrow'] as const).map(s => {
              const Icon = shapeIcons[s]
              return (
                <button
                  key={s}
                  onClick={() => { setTool(s); setShowShapePicker(false) }}
                  className={cn('h-9 w-9 rounded-xl flex items-center justify-center transition-colors', tool === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>
        )}

        {/* Só as ferramentas rolam na horizontal — o botão de sair fica fora
            desse trilho, então nunca some da tela num celular. */}
        <div className="min-w-0 flex items-center gap-0.5 p-1.5 rounded-2xl glass-page-card glass-rim shadow-2xl overflow-x-auto scrollbar-hide">
          <ToolBtn active={tool === 'pen'} onClick={() => setTool('pen')} icon={Pencil} label="Caneta" />
          <ToolBtn active={tool === 'highlighter'} onClick={() => setTool('highlighter')} icon={Highlighter} label="Marca-texto" />
          <ToolBtn active={tool === 'laser'} onClick={() => { setTool('laser'); setShowCustomize(false) }} icon={Flashlight} label="Caneta laser" />
          <ToolBtn active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={Eraser} label="Borracha" />
          <ToolBtn active={isShapeTool(tool)} onClick={() => setShowShapePicker(!showShapePicker)} icon={ShapeIcon} label="Formas" />
          <ToolBtn active={tool === 'text'} onClick={() => setTool('text')} icon={Type} label="Texto" />
          <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} icon={MousePointer2} label="Selecionar" />

          <div className="w-px h-6 bg-border/60 mx-0.5 flex-shrink-0" />

          {tool !== 'laser' && (
            <ToolBtn active={showCustomize} onClick={() => setShowCustomize(!showCustomize)} icon={Palette} label="Cor e espessura" />
          )}
          <ToolBtn active={false} disabled={!props.canUndo} onClick={props.onUndo} icon={Undo2} label="Desfazer" />
          <ToolBtn active={false} disabled={!props.canRedo} onClick={props.onRedo} icon={Redo2} label="Refazer" />

          {props.selectionCount > 0 && (
            <ToolBtn active={false} onClick={props.onDeleteSelection} icon={Trash2} label={`Excluir (${props.selectionCount})`} tone="danger" />
          )}

          <ToolBtn active={false} disabled={!props.hasInk} onClick={props.onClear} icon={Trash2} label="Limpar tudo" tone="danger" />
        </div>

        {/* Saída sempre visível, rotulada e destacada */}
        <motion.button
          onClick={props.onDone}
          title="Concluir anotação (Esc)"
          aria-label="Concluir anotação e voltar à prova"
          initial={{ opacity: 0, scale: 0.9, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="flex-shrink-0 flex items-center gap-1.5 h-12 pl-3 pr-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xl shadow-emerald-900/25 transition-colors"
        >
          <Check className="h-4 w-4" />
          Concluir
        </motion.button>
      </div>
    </div>
  )
}

function ToolBtn({ active, onClick, icon: Icon, label, disabled, tone }: { active: boolean; onClick: () => void; icon: typeof Pencil; label: string; disabled?: boolean; tone?: 'danger' | 'success' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-150',
        disabled && 'opacity-30',
        !disabled && active && 'bg-primary text-primary-foreground shadow-sm scale-[1.03]',
        !disabled && !active && tone === 'danger' && 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10',
        !disabled && !active && tone === 'success' && 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10',
        !disabled && !active && !tone && 'text-foreground/70 hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

function CustomizePopover(props: ToolbarProps & { onClose: () => void }) {
  const { tool } = props
  const presets = tool === 'highlighter' ? HIGHLIGHTER_PRESETS : PEN_PRESETS
  const color = tool === 'pen' ? props.penColor : tool === 'highlighter' ? props.highlighterColor : tool === 'text' ? props.textColor : props.shapeColor
  const setColor = tool === 'pen' ? props.setPenColor : tool === 'highlighter' ? props.setHighlighterColor : tool === 'text' ? props.setTextColor : props.setShapeColor
  const size = tool === 'pen' ? props.penThickness : tool === 'highlighter' ? props.highlighterSize : tool === 'text' ? props.textSize : tool === 'eraser' ? props.eraserSize : props.shapeThickness
  const setSize = tool === 'pen' ? props.setPenThickness : tool === 'highlighter' ? props.setHighlighterSize : tool === 'text' ? props.setTextSize : tool === 'eraser' ? props.setEraserSize : props.setShapeThickness
  const showColor = tool !== 'eraser' && tool !== 'select'

  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 rounded-2xl glass-page-card glass-rim shadow-xl space-y-3">
      {showColor && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-7 w-7 rounded-lg border border-border/60 cursor-pointer" />
            <span className="text-[10px] text-muted-foreground tabular-nums uppercase">{color}</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {presets.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={c}
                className={cn('aspect-square rounded-md border transition-all', color.toLowerCase() === c.toLowerCase() ? 'border-foreground/80 scale-110 ring-2 ring-primary/30' : 'border-border/40 hover:scale-105')}
                /*
                  A amostra do marca-texto é pintada com a MESMA opacidade com
                  que ele desenha. Em cheio, o amarelo do quadradinho não tinha
                  nada a ver com o amarelo pálido que saía na questão — a pessoa
                  escolhia uma cor e recebia outra.
                */
                style={{ backgroundColor: c, opacity: tool === 'highlighter' ? HIGHLIGHTER_OPACITY + 0.25 : 1 }}
              />
            ))}
          </div>

          {/*
            A prévia: a espessura e a cor escolhidas, sobre uma linha de texto
            de verdade. É o único jeito de responder "esse marcador cobre a
            linha ou passa por cima da de cima?" sem sair da tela e testar.
          */}
          {(tool === 'pen' || tool === 'highlighter') && (
            <div className="relative mt-1 flex h-10 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-background/70 px-2">
              <span className="text-[11px] font-medium text-foreground/80">Texto de exemplo</span>
              <span
                aria-hidden
                className="pointer-events-none absolute left-2 right-2 top-1/2 -translate-y-1/2"
                style={{
                  height: Math.max(2, Math.min(28, size)),
                  backgroundColor: color,
                  opacity: tool === 'highlighter' ? HIGHLIGHTER_OPACITY : 1,
                  mixBlendMode: tool === 'highlighter' ? 'multiply' : undefined,
                  borderRadius: tool === 'highlighter' ? 0 : 999,
                }}
              />
            </div>
          )}
        </div>
      )}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-medium text-foreground/80">Espessura</span>
          <span className="text-muted-foreground tabular-nums">{size}px</span>
        </div>
        <input type="range" min={tool === 'highlighter' || tool === 'eraser' ? 6 : 1} max={tool === 'highlighter' || tool === 'eraser' ? 60 : 20} step={0.5} value={size} onChange={e => setSize(Number(e.target.value))} className="w-full accent-primary" />
      </div>
      {tool === 'eraser' && (
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => props.setEraserType('standard')} className={cn('h-8 text-[11px] rounded-lg font-medium border', props.eraserType === 'standard' ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 hover:bg-muted')}>Padrão</button>
          <button onClick={() => props.setEraserType('line')} className={cn('h-8 text-[11px] rounded-lg font-medium border', props.eraserType === 'line' ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 hover:bg-muted')}>Traço inteiro</button>
        </div>
      )}
      {tool === 'select' && (
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => props.setSelectionMode('rectangle')} className={cn('h-8 text-[11px] rounded-lg font-medium border', props.selectionMode === 'rectangle' ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 hover:bg-muted')}>Retângulo</button>
          <button onClick={() => props.setSelectionMode('lasso')} className={cn('h-8 text-[11px] rounded-lg font-medium border', props.selectionMode === 'lasso' ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 hover:bg-muted')}>Livre</button>
        </div>
      )}
      {(tool === 'rectangle' || tool === 'ellipse') && (
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={props.shapeFilled} onChange={e => props.setShapeFilled(e.target.checked)} className="rounded" />
          <span>Preencher forma</span>
        </label>
      )}
    </div>
  )
}
