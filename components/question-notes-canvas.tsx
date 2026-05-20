'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Pencil,
  Eraser,
  Highlighter,
  Type,
  MousePointer2,
  Trash2,
  X,
  Undo2,
  Redo2,
  Square,
  Circle,
  Minus,
  ArrowUpRight,
  Grid3x3,
  AlignJustify,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Download,
  Maximize2,
  Minimize2,
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

interface QuestionNotesCanvasProps {
  questionId: string
  questionNumber: number
  initialAnnotation?: QuestionAnnotation
  onSave: (annotation: QuestionAnnotation) => void
  onClose: () => void
}

type ExtendedTool = DrawingTool | 'line' | 'rectangle' | 'ellipse' | 'arrow'
type BackgroundMode = 'blank' | 'grid' | 'ruled'

const PEN_PRESETS = ['#000000', '#1e293b', '#dc2626', '#ea580c', '#0891b2', '#2563eb', '#7c3aed', '#16a34a']
const HIGHLIGHTER_PRESETS = ['#fde047', '#fbbf24', '#fb923c', '#f87171', '#a3e635', '#86efac', '#7dd3fc', '#c4b5fd']
const TEXT_PRESETS = ['#0f172a', '#1f2937', '#dc2626', '#2563eb', '#16a34a', '#7c3aed']

const SHAPE_TOOLS: Array<{ id: ExtendedTool; icon: typeof Square; label: string; hint: string }> = [
  { id: 'line', icon: Minus, label: 'Linha', hint: 'L' },
  { id: 'rectangle', icon: Square, label: 'Retângulo', hint: 'R' },
  { id: 'ellipse', icon: Circle, label: 'Elipse', hint: 'O' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Seta', hint: 'A' },
]

const TOOL_HOTKEY: Record<string, ExtendedTool> = {
  p: 'pen',
  h: 'highlighter',
  e: 'eraser',
  t: 'text',
  s: 'select',
  l: 'line',
  r: 'rectangle',
  o: 'ellipse',
  a: 'arrow',
}

export function QuestionNotesCanvas({
  questionId,
  questionNumber,
  initialAnnotation,
  onSave,
  onClose,
}: QuestionNotesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const dprRef = useRef<number>(1)
  const cssSizeRef = useRef<{ w: number; h: number }>({ w: 800, h: 600 })

  const [isDrawing, setIsDrawing] = useState(false)
  const lastPointerPosRef = useRef<Point | null>(null)

  const [currentTool, setCurrentTool] = useState<ExtendedTool>('pen')
  const [penColor, setPenColor] = useState('#0f172a')
  const [penThickness, setPenThickness] = useState(2.5)
  const [highlighterColor, setHighlighterColor] = useState('#fde047')
  const [highlighterSize, setHighlighterSize] = useState(20)
  const [eraserSize, setEraserSize] = useState(22)
  const [eraserType, setEraserType] = useState<EraserType>('standard')
  const [textColor, setTextColor] = useState('#0f172a')
  const [textSize, setTextSize] = useState(18)
  const [shapeFilled, setShapeFilled] = useState(false)
  const [shapeThickness, setShapeThickness] = useState(2.5)
  const [shapeColor, setShapeColor] = useState('#0f172a')

  const [strokes, setStrokes] = useState<DrawingStroke[]>(initialAnnotation?.strokes || [])
  const [texts, setTexts] = useState<TextAnnotation[]>(initialAnnotation?.texts || [])
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  const [shapeStart, setShapeStart] = useState<Point | null>(null)
  const [shapeEnd, setShapeEnd] = useState<Point | null>(null)

  // Undo / redo
  type HistorySnapshot = { strokes: DrawingStroke[]; texts: TextAnnotation[] }
  const historyRef = useRef<HistorySnapshot[]>([{ strokes: initialAnnotation?.strokes || [], texts: initialAnnotation?.texts || [] }])
  const historyIndexRef = useRef<number>(0)
  const [, forceHistoryRefresh] = useState(0)

  // Text input
  const [isAddingText, setIsAddingText] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<Point | null>(null)

  // Selection
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('rectangle')
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([])
  const [selectedTextIds, setSelectedTextIds] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [selectionPath, setSelectionPath] = useState<Point[]>([])
  const [isSelecting, setIsSelecting] = useState(false)

  // UI
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [background, setBackground] = useState<BackgroundMode>('blank')
  const [savedTick, setSavedTick] = useState(false)

  // ───── History helpers ────────────────────────────
  const pushHistory = useCallback((nextStrokes: DrawingStroke[], nextTexts: TextAnnotation[]) => {
    const stack = historyRef.current.slice(0, historyIndexRef.current + 1)
    stack.push({ strokes: nextStrokes, texts: nextTexts })
    // Cap stack to keep memory in check
    while (stack.length > 80) stack.shift()
    historyRef.current = stack
    historyIndexRef.current = stack.length - 1
    forceHistoryRefresh(v => v + 1)
  }, [])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const snap = historyRef.current[historyIndexRef.current]
    setStrokes(snap.strokes)
    setTexts(snap.texts)
    setSelectedStrokeIds([])
    setSelectedTextIds([])
    forceHistoryRefresh(v => v + 1)
  }, [])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    const snap = historyRef.current[historyIndexRef.current]
    setStrokes(snap.strokes)
    setTexts(snap.texts)
    setSelectedStrokeIds([])
    setSelectedTextIds([])
    forceHistoryRefresh(v => v + 1)
  }, [])

  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1

  // ───── Canvas sizing (HiDPI) ──────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const isMobile = window.innerWidth < 640
    // Reserve padding for scroll comfort
    const cssW = Math.max(320, Math.floor(rect.width - (isMobile ? 16 : 32)))
    const cssH = Math.max(360, Math.floor(rect.height - (isMobile ? 16 : 32)))

    cssSizeRef.current = { w: cssW, h: cssH }
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    dprRef.current = dpr

    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
    canvas.width = Math.floor(cssW * dpr)
    canvas.height = Math.floor(cssH * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctxRef.current = ctx
  }, [])

  useEffect(() => {
    resizeCanvas()
    const onResize = () => {
      resizeCanvas()
      redraw()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeCanvas, fullscreen, sidebarOpen])

  // ───── Drawing primitives ─────────────────────────
  function drawBackground(ctx: CanvasRenderingContext2D) {
    const { w, h } = cssSizeRef.current
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)

    if (background === 'grid') {
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)'
      ctx.lineWidth = 1
      const step = 24
      ctx.beginPath()
      for (let x = step; x < w; x += step) {
        ctx.moveTo(x + 0.5, 0)
        ctx.lineTo(x + 0.5, h)
      }
      for (let y = step; y < h; y += step) {
        ctx.moveTo(0, y + 0.5)
        ctx.lineTo(w, y + 0.5)
      }
      ctx.stroke()
    } else if (background === 'ruled') {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.18)'
      ctx.lineWidth = 1
      const step = 28
      ctx.beginPath()
      for (let y = step; y < h; y += step) {
        ctx.moveTo(0, y + 0.5)
        ctx.lineTo(w, y + 0.5)
      }
      ctx.stroke()
      // Margin line
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)'
      ctx.beginPath()
      ctx.moveTo(56.5, 0)
      ctx.lineTo(56.5, h)
      ctx.stroke()
    }
    ctx.restore()
  }

  function drawShape(ctx: CanvasRenderingContext2D, stroke: DrawingStroke, isSelected = false) {
    if (stroke.points.length < 2) return
    const start = stroke.points[0]
    const end = stroke.points[stroke.points.length - 1]

    ctx.save()
    ctx.globalAlpha = stroke.opacity ?? 1

    if (isSelected) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)'
      ctx.lineWidth = stroke.thickness + 6
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      switch (stroke.shape) {
        case 'rectangle':
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
          break
        case 'ellipse': {
          const cx = (start.x + end.x) / 2
          const cy = (start.y + end.y) / 2
          const rx = Math.abs(end.x - start.x) / 2
          const ry = Math.abs(end.y - start.y) / 2
          ctx.beginPath()
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
          ctx.stroke()
          break
        }
        default:
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          ctx.stroke()
      }
    }

    ctx.strokeStyle = stroke.color
    ctx.fillStyle = stroke.color
    ctx.lineWidth = stroke.thickness
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    switch (stroke.shape) {
      case 'rectangle':
        if (stroke.filled) ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y)
        else ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
        break
      case 'ellipse': {
        const cx = (start.x + end.x) / 2
        const cy = (start.y + end.y) / 2
        const rx = Math.abs(end.x - start.x) / 2
        const ry = Math.abs(end.y - start.y) / 2
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        if (stroke.filled) ctx.fill()
        else ctx.stroke()
        break
      }
      case 'arrow': {
        const headLen = Math.max(10, stroke.thickness * 4)
        const angle = Math.atan2(end.y - start.y, end.x - start.x)
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6))
        ctx.closePath()
        ctx.fill()
        break
      }
      case 'line':
      default:
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
    }
    ctx.restore()
  }

  function drawFreehand(ctx: CanvasRenderingContext2D, stroke: DrawingStroke, isSelected = false) {
    if (stroke.points.length < 2) {
      // single tap dot
      if (stroke.points.length === 1) {
        const p = stroke.points[0]
        ctx.save()
        ctx.globalAlpha = stroke.opacity ?? 1
        ctx.fillStyle = stroke.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, stroke.thickness / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      return
    }
    ctx.save()
    ctx.globalAlpha = stroke.opacity ?? 1
    if (isSelected) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)'
      ctx.lineWidth = stroke.thickness + 6
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      ctx.stroke()
    }
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.thickness
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    ctx.stroke()
    ctx.restore()
  }

  function drawText(ctx: CanvasRenderingContext2D, text: TextAnnotation, isSelected = false) {
    ctx.save()
    ctx.font = `${text.fontSize}px Inter, system-ui, sans-serif`
    if (isSelected) {
      const metrics = ctx.measureText(text.text)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.strokeRect(text.position.x - 4, text.position.y - text.fontSize - 4, metrics.width + 8, text.fontSize + 8)
      ctx.setLineDash([])
    }
    ctx.fillStyle = text.color
    ctx.fillText(text.text, text.position.x, text.position.y)
    ctx.restore()
  }

  function redraw() {
    const ctx = ctxRef.current
    if (!ctx) return
    const { w, h } = cssSizeRef.current
    ctx.clearRect(0, 0, w, h)
    drawBackground(ctx)

    strokes.forEach(s => {
      const isSel = selectedStrokeIds.includes(s.id)
      if (s.shape) drawShape(ctx, s, isSel)
      else drawFreehand(ctx, s, isSel)
    })

    texts.forEach(t => drawText(ctx, t, selectedTextIds.includes(t.id)))

    // In-progress freehand
    if (currentStroke.length > 0 && (currentTool === 'pen' || currentTool === 'highlighter')) {
      const tempStroke: DrawingStroke = {
        id: 'temp',
        tool: currentTool,
        points: currentStroke,
        color: currentTool === 'pen' ? penColor : highlighterColor,
        thickness: currentTool === 'pen' ? penThickness : highlighterSize,
        opacity: currentTool === 'highlighter' ? 0.32 : 1,
      }
      drawFreehand(ctx, tempStroke)
    }

    // In-progress shape preview
    if (shapeStart && shapeEnd && isShapeTool(currentTool)) {
      const tempShape: DrawingStroke = {
        id: 'temp-shape',
        tool: 'pen',
        shape: currentTool as StrokeShape,
        filled: shapeFilled,
        points: [shapeStart, shapeEnd],
        color: shapeColor,
        thickness: shapeThickness,
      }
      drawShape(ctx, tempShape)
    }

    // Selection rubber-band
    if (isSelecting && selectionPath.length > 0) {
      ctx.save()
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)'
      ctx.fillStyle = 'rgba(59, 130, 246, 0.08)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])

      if (selectionMode === 'rectangle' && selectionPath.length >= 2) {
        const a = selectionPath[0]
        const b = selectionPath[selectionPath.length - 1]
        ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y)
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
      } else if (selectionMode === 'lasso' && selectionPath.length > 1) {
        ctx.beginPath()
        ctx.moveTo(selectionPath[0].x, selectionPath[0].y)
        for (let i = 1; i < selectionPath.length; i++) ctx.lineTo(selectionPath[i].x, selectionPath[i].y)
        ctx.fill()
        ctx.stroke()
      }
      ctx.restore()
    }

    // Eraser cursor preview
    if (currentTool === 'eraser' && lastPointerPosRef.current) {
      const p = lastPointerPosRef.current
      ctx.save()
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(p.x, p.y, eraserSize / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }
  }

  // Re-draw on any state change that affects rendering
  useEffect(() => {
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, texts, selectedStrokeIds, selectedTextIds, currentStroke, shapeStart, shapeEnd, background, isSelecting, selectionPath, currentTool, eraserSize])

  function isShapeTool(t: ExtendedTool): boolean {
    return t === 'line' || t === 'rectangle' || t === 'ellipse' || t === 'arrow'
  }

  // ───── Pointer events ─────────────────────────────
  function getPoint(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0]
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if ('touches' in e) e.preventDefault()
    const point = getPoint(e)
    lastPointerPosRef.current = point

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      setIsDrawing(true)
      setCurrentStroke([point])
      return
    }

    if (isShapeTool(currentTool)) {
      setIsDrawing(true)
      setShapeStart(point)
      setShapeEnd(point)
      return
    }

    if (currentTool === 'eraser') {
      setIsDrawing(true)
      eraseAt(point)
      return
    }

    if (currentTool === 'text') {
      setTextPosition(point)
      setIsAddingText(true)
      return
    }

    if (currentTool === 'select') {
      // Drag selection?
      if (selectedStrokeIds.length > 0 || selectedTextIds.length > 0) {
        const s = findStrokeAtPoint(point)
        const t = findTextAtPoint(point)
        if ((s && selectedStrokeIds.includes(s.id)) || (t && selectedTextIds.includes(t.id))) {
          setIsDragging(true)
          setDragStart(point)
          return
        }
      }
      setIsSelecting(true)
      setSelectionPath([point])
      setSelectedStrokeIds([])
      setSelectedTextIds([])
    }
  }

  function handlePointerMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if ('touches' in e) e.preventDefault()
    const point = getPoint(e)
    lastPointerPosRef.current = point

    if (!isDrawing && !isDragging && !isSelecting) {
      if (currentTool === 'eraser') redraw()
      return
    }

    if (isDrawing && (currentTool === 'pen' || currentTool === 'highlighter')) {
      setCurrentStroke(prev => [...prev, point])
      return
    }

    if (isDrawing && isShapeTool(currentTool) && shapeStart) {
      // Shift: square / circle / 45° line
      let resolved = point
      if ('shiftKey' in e && (e as any).shiftKey) {
        const dx = point.x - shapeStart.x
        const dy = point.y - shapeStart.y
        if (currentTool === 'rectangle' || currentTool === 'ellipse') {
          const size = Math.max(Math.abs(dx), Math.abs(dy))
          resolved = { x: shapeStart.x + Math.sign(dx || 1) * size, y: shapeStart.y + Math.sign(dy || 1) * size }
        } else if (currentTool === 'line' || currentTool === 'arrow') {
          const ang = Math.atan2(dy, dx)
          const snapAng = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4)
          const len = Math.hypot(dx, dy)
          resolved = { x: shapeStart.x + Math.cos(snapAng) * len, y: shapeStart.y + Math.sin(snapAng) * len }
        }
      }
      setShapeEnd(resolved)
      return
    }

    if (isDrawing && currentTool === 'eraser') {
      eraseAt(point)
      return
    }

    if (isDragging && dragStart) {
      const dx = point.x - dragStart.x
      const dy = point.y - dragStart.y
      setStrokes(prev => prev.map(s => selectedStrokeIds.includes(s.id) ? { ...s, points: s.points.map(p => ({ x: p.x + dx, y: p.y + dy })) } : s))
      setTexts(prev => prev.map(t => selectedTextIds.includes(t.id) ? { ...t, position: { x: t.position.x + dx, y: t.position.y + dy } } : t))
      setDragStart(point)
      return
    }

    if (isSelecting) {
      if (selectionMode === 'rectangle') setSelectionPath([selectionPath[0], point])
      else setSelectionPath(prev => [...prev, point])
    }
  }

  function handlePointerUp() {
    if (isSelecting) {
      finalizeSelection()
      setIsSelecting(false)
      setSelectionPath([])
      return
    }

    if (isDragging) {
      setIsDragging(false)
      setDragStart(null)
      pushHistory(strokes, texts)
      return
    }

    if (!isDrawing) return

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      if (currentStroke.length > 0) {
        const newStroke: DrawingStroke = {
          id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          tool: currentTool,
          points: currentStroke,
          color: currentTool === 'pen' ? penColor : highlighterColor,
          thickness: currentTool === 'pen' ? penThickness : highlighterSize,
          opacity: currentTool === 'highlighter' ? 0.32 : 1,
        }
        const next = [...strokes, newStroke]
        setStrokes(next)
        pushHistory(next, texts)
      }
      setCurrentStroke([])
    } else if (isShapeTool(currentTool) && shapeStart && shapeEnd) {
      const dist = Math.hypot(shapeEnd.x - shapeStart.x, shapeEnd.y - shapeStart.y)
      if (dist > 3) {
        const newStroke: DrawingStroke = {
          id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          tool: 'pen',
          shape: currentTool as StrokeShape,
          filled: shapeFilled && (currentTool === 'rectangle' || currentTool === 'ellipse'),
          points: [shapeStart, shapeEnd],
          color: shapeColor,
          thickness: shapeThickness,
        }
        const next = [...strokes, newStroke]
        setStrokes(next)
        pushHistory(next, texts)
      }
      setShapeStart(null)
      setShapeEnd(null)
    } else if (currentTool === 'eraser') {
      pushHistory(strokes, texts)
    }

    setIsDrawing(false)
  }

  function finalizeSelection() {
    const path = selectionPath
    if (!path.length) return
    const selS: string[] = []
    const selT: string[] = []

    if (selectionMode === 'rectangle' && path.length >= 2) {
      const a = path[0]
      const b = path[path.length - 1]
      const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x)
      const minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y)
      strokes.forEach(s => {
        if (s.points.some(p => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY)) selS.push(s.id)
      })
      texts.forEach(t => {
        if (t.position.x >= minX && t.position.x <= maxX && t.position.y >= minY && t.position.y <= maxY) selT.push(t.id)
      })
    } else if (selectionMode === 'lasso' && path.length > 2) {
      strokes.forEach(s => {
        if (s.points.some(p => isPointInPolygon(p, path))) selS.push(s.id)
      })
      texts.forEach(t => { if (isPointInPolygon(t.position, path)) selT.push(t.id) })
    }
    setSelectedStrokeIds(selS)
    setSelectedTextIds(selT)
  }

  function findStrokeAtPoint(point: Point): DrawingStroke | null {
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i]
      for (const p of s.points) {
        if (Math.hypot(p.x - point.x, p.y - point.y) < s.thickness / 2 + 5) return s
      }
    }
    return null
  }

  function findTextAtPoint(point: Point): TextAnnotation | null {
    const ctx = ctxRef.current
    if (!ctx) return null
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i]
      ctx.font = `${t.fontSize}px Inter, system-ui, sans-serif`
      const m = ctx.measureText(t.text)
      if (point.x >= t.position.x && point.x <= t.position.x + m.width && point.y >= t.position.y - t.fontSize && point.y <= t.position.y) return t
    }
    return null
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
    if (eraserType === 'standard') {
      setStrokes(prev => {
        const next: DrawingStroke[] = []
        for (const stroke of prev) {
          // Shapes: remove whole shape if the point is near the stroke
          if (stroke.shape) {
            const hits = stroke.points.some(p => Math.hypot(p.x - point.x, p.y - point.y) < eraserSize / 2 + stroke.thickness)
            if (!hits) next.push(stroke)
            continue
          }
          const segments: Point[][] = []
          let cur: Point[] = []
          for (const p of stroke.points) {
            if (Math.hypot(p.x - point.x, p.y - point.y) >= eraserSize / 2) cur.push(p)
            else if (cur.length) { segments.push(cur); cur = [] }
          }
          if (cur.length) segments.push(cur)
          for (const seg of segments) {
            if (seg.length >= 2) next.push({ ...stroke, id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, points: seg })
          }
        }
        return next
      })
    } else {
      setStrokes(prev => prev.filter(s => !s.points.some(p => Math.hypot(p.x - point.x, p.y - point.y) < eraserSize / 2)))
    }
  }

  // ───── Selection actions ──────────────────────────
  function deleteSelection() {
    if (!selectedStrokeIds.length && !selectedTextIds.length) return
    const nextS = strokes.filter(s => !selectedStrokeIds.includes(s.id))
    const nextT = texts.filter(t => !selectedTextIds.includes(t.id))
    setStrokes(nextS)
    setTexts(nextT)
    setSelectedStrokeIds([])
    setSelectedTextIds([])
    pushHistory(nextS, nextT)
  }

  function duplicateSelection() {
    if (!selectedStrokeIds.length && !selectedTextIds.length) return
    const newS: DrawingStroke[] = selectedStrokeIds
      .map(id => strokes.find(s => s.id === id))
      .filter((s): s is DrawingStroke => Boolean(s))
      .map(s => ({ ...s, id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, points: s.points.map(p => ({ x: p.x + 14, y: p.y + 14 })) }))
    const newT: TextAnnotation[] = selectedTextIds
      .map(id => texts.find(t => t.id === id))
      .filter((t): t is TextAnnotation => Boolean(t))
      .map(t => ({ ...t, id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, position: { x: t.position.x + 14, y: t.position.y + 14 } }))
    const nextS = [...strokes, ...newS]
    const nextT = [...texts, ...newT]
    setStrokes(nextS)
    setTexts(nextT)
    setSelectedStrokeIds(newS.map(s => s.id))
    setSelectedTextIds(newT.map(t => t.id))
    pushHistory(nextS, nextT)
  }

  // ───── Text adding ────────────────────────────────
  function commitText() {
    if (!textInput.trim() || !textPosition) {
      setIsAddingText(false)
      setTextInput('')
      setTextPosition(null)
      return
    }
    const newText: TextAnnotation = {
      id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: textInput,
      position: textPosition,
      fontSize: textSize,
      color: textColor,
    }
    const next = [...texts, newText]
    setTexts(next)
    pushHistory(strokes, next)
    setTextInput('')
    setIsAddingText(false)
    setTextPosition(null)
  }

  // ───── Clear & Save ───────────────────────────────
  function handleClearAll() {
    if (!strokes.length && !texts.length) return
    if (!confirm('Limpar todas as anotações desta questão?')) return
    setStrokes([])
    setTexts([])
    setSelectedStrokeIds([])
    setSelectedTextIds([])
    pushHistory([], [])
  }

  function snapshotDataURL(): string | undefined {
    // Render a clean export-friendly snapshot at 2x resolution
    const exportCanvas = document.createElement('canvas')
    const { w, h } = cssSizeRef.current
    const scale = 2
    exportCanvas.width = w * scale
    exportCanvas.height = h * scale
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return canvasRef.current?.toDataURL()
    ctx.scale(scale, scale)
    // background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    strokes.forEach(s => {
      if (s.shape) drawShape(ctx, s)
      else drawFreehand(ctx, s)
    })
    texts.forEach(t => drawText(ctx, t))
    return exportCanvas.toDataURL('image/png')
  }

  function handleSave() {
    const annotation: QuestionAnnotation = {
      questionId,
      questionNumber,
      strokes,
      texts,
      canvasDataUrl: snapshotDataURL(),
    }
    onSave(annotation)
    setSavedTick(true)
    setTimeout(() => onClose(), 220)
  }

  // ───── Keyboard shortcuts ─────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Skip when typing in text input modal
      if (isAddingText) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return

      const k = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && k === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && k === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (k === 'escape') {
        setSelectedStrokeIds([])
        setSelectedTextIds([])
        setIsSelecting(false)
        setSelectionPath([])
        return
      }
      if ((k === 'delete' || k === 'backspace') && (selectedStrokeIds.length || selectedTextIds.length)) {
        e.preventDefault()
        deleteSelection()
        return
      }
      if ((e.ctrlKey || e.metaKey) && k === 'd' && (selectedStrokeIds.length || selectedTextIds.length)) {
        e.preventDefault()
        duplicateSelection()
        return
      }
      if (!e.ctrlKey && !e.metaKey && TOOL_HOTKEY[k]) {
        e.preventDefault()
        setCurrentTool(TOOL_HOTKEY[k])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, selectedStrokeIds, selectedTextIds, strokes, texts, isAddingText])

  // ───── UI ─────────────────────────────────────────
  const selectionCount = selectedStrokeIds.length + selectedTextIds.length

  const containerSize = fullscreen
    ? 'inset-0 rounded-none'
    : 'inset-4 sm:inset-6 lg:inset-10 rounded-2xl'

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className={cn(
        'absolute bg-background shadow-2xl flex flex-col overflow-hidden border border-border/60',
        containerSize,
      )}>
        {/* ─── Header ─── */}
        <header className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 border-b border-border/60 bg-gradient-to-r from-background via-muted/30 to-background">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title={sidebarOpen ? 'Ocultar painel' : 'Mostrar painel'}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {questionNumber}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold leading-tight truncate">Anotações</h2>
              <p className="text-[11px] text-muted-foreground leading-tight">Questão {questionNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Undo / Redo */}
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Desfazer (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Refazer (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </button>

            {/* Background */}
            <div className="hidden sm:flex items-center ml-2 rounded-lg bg-muted/50 border border-border/60 overflow-hidden">
              {[
                { id: 'blank', icon: null, label: 'Branco' },
                { id: 'grid', icon: Grid3x3, label: 'Quadriculado' },
                { id: 'ruled', icon: AlignJustify, label: 'Pautado' },
              ].map(opt => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    onClick={() => setBackground(opt.id as BackgroundMode)}
                    title={opt.label}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors',
                      background === opt.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    {Icon ? <Icon className="h-3 w-3" /> : <span className="block w-3 h-3 rounded-sm border border-current" />}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setFullscreen(v => !v)}
              className="hidden sm:flex p-1.5 rounded-lg hover:bg-muted transition-colors"
              title={fullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Fechar (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ─── Workspace ─── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {sidebarOpen && (
            <aside className="w-[260px] sm:w-[280px] flex-shrink-0 border-r border-border/60 overflow-y-auto bg-muted/20">
              <div className="p-3 sm:p-4 space-y-4">
                {/* Tools */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Ferramentas</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: 'pen' as const, icon: Pencil, label: 'Caneta', hint: 'P' },
                      { id: 'highlighter' as const, icon: Highlighter, label: 'Marca-texto', hint: 'H' },
                      { id: 'eraser' as const, icon: Eraser, label: 'Borracha', hint: 'E' },
                      { id: 'text' as const, icon: Type, label: 'Texto', hint: 'T' },
                      { id: 'select' as const, icon: MousePointer2, label: 'Selecionar', hint: 'S' },
                    ].map(t => {
                      const Icon = t.icon
                      const active = currentTool === t.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => setCurrentTool(t.id)}
                          title={`${t.label} (${t.hint})`}
                          className={cn(
                            'aspect-square rounded-xl flex items-center justify-center transition-all duration-150 border',
                            active
                              ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30 scale-[1.03]'
                              : 'bg-background border-border/60 hover:border-primary/40 hover:bg-muted'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      )
                    })}
                  </div>
                </section>

                {/* Shapes */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Formas</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SHAPE_TOOLS.map(s => {
                      const Icon = s.icon
                      const active = currentTool === s.id
                      return (
                        <button
                          key={s.id}
                          onClick={() => setCurrentTool(s.id)}
                          title={`${s.label} (${s.hint}) — Shift para travar proporção`}
                          className={cn(
                            'aspect-square rounded-xl flex items-center justify-center transition-all duration-150 border',
                            active
                              ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30 scale-[1.03]'
                              : 'bg-background border-border/60 hover:border-primary/40 hover:bg-muted'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      )
                    })}
                  </div>
                </section>

                {/* Tool-specific settings */}
                {currentTool === 'pen' && (
                  <ToolPanel title="Caneta" tint="bg-sky-500/8 border-sky-500/20">
                    <ColorRow value={penColor} onChange={setPenColor} presets={PEN_PRESETS} />
                    <Slider label="Espessura" value={penThickness} onChange={setPenThickness} min={1} max={20} step={0.5} suffix="px" />
                    <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                      Dica: para uma linha reta, segure <kbd className="px-1 rounded bg-muted text-foreground">Shift</kbd> ao usar a forma <span className="font-medium">Linha</span>.
                    </p>
                  </ToolPanel>
                )}

                {currentTool === 'highlighter' && (
                  <ToolPanel title="Marca-texto" tint="bg-amber-500/8 border-amber-500/20">
                    <ColorRow value={highlighterColor} onChange={setHighlighterColor} presets={HIGHLIGHTER_PRESETS} />
                    <Slider label="Espessura" value={highlighterSize} onChange={setHighlighterSize} min={8} max={60} step={1} suffix="px" />
                  </ToolPanel>
                )}

                {currentTool === 'eraser' && (
                  <ToolPanel title="Borracha" tint="bg-rose-500/8 border-rose-500/20">
                    <Slider label="Tamanho" value={eraserSize} onChange={setEraserSize} min={6} max={60} step={1} suffix="px" />
                    <div className="grid grid-cols-2 gap-1.5">
                      <SegmentBtn active={eraserType === 'standard'} onClick={() => setEraserType('standard')}>Padrão</SegmentBtn>
                      <SegmentBtn active={eraserType === 'line'} onClick={() => setEraserType('line')}>Traço inteiro</SegmentBtn>
                    </div>
                    <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                      {eraserType === 'standard' ? 'Apaga só onde a borracha passa.' : 'Apaga o traço inteiro ao tocar.'}
                    </p>
                  </ToolPanel>
                )}

                {currentTool === 'text' && (
                  <ToolPanel title="Texto" tint="bg-emerald-500/8 border-emerald-500/20">
                    <ColorRow value={textColor} onChange={setTextColor} presets={TEXT_PRESETS} />
                    <Slider label="Tamanho" value={textSize} onChange={setTextSize} min={10} max={56} step={1} suffix="px" />
                    <p className="text-[10px] text-muted-foreground/80">Clique no canvas para inserir texto.</p>
                  </ToolPanel>
                )}

                {currentTool === 'select' && (
                  <ToolPanel title="Seleção" tint="bg-violet-500/8 border-violet-500/20">
                    <div className="grid grid-cols-2 gap-1.5">
                      <SegmentBtn active={selectionMode === 'rectangle'} onClick={() => setSelectionMode('rectangle')}>Retângulo</SegmentBtn>
                      <SegmentBtn active={selectionMode === 'lasso'} onClick={() => setSelectionMode('lasso')}>Livre</SegmentBtn>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {selectionCount > 0 ? (
                        <span className="font-medium text-foreground">{selectionCount} elemento{selectionCount > 1 ? 's' : ''} selecionado{selectionCount > 1 ? 's' : ''}</span>
                      ) : 'Arraste para selecionar.'}
                    </div>
                    {selectionCount > 0 && (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs rounded-lg" onClick={duplicateSelection}>Duplicar</Button>
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs rounded-lg" onClick={deleteSelection}>Excluir</Button>
                      </div>
                    )}
                  </ToolPanel>
                )}

                {isShapeTool(currentTool) && (
                  <ToolPanel title="Forma" tint="bg-indigo-500/8 border-indigo-500/20">
                    <ColorRow value={shapeColor} onChange={setShapeColor} presets={PEN_PRESETS} />
                    <Slider label="Espessura" value={shapeThickness} onChange={setShapeThickness} min={1} max={16} step={0.5} suffix="px" />
                    {(currentTool === 'rectangle' || currentTool === 'ellipse') && (
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={shapeFilled} onChange={e => setShapeFilled(e.target.checked)} className="rounded" />
                        <span>Preencher</span>
                      </label>
                    )}
                    <p className="text-[10px] text-muted-foreground/80">Segure <kbd className="px-1 rounded bg-muted text-foreground">Shift</kbd> para travar proporção/ângulo.</p>
                  </ToolPanel>
                )}

                {/* Shortcuts hint */}
                <section className="rounded-xl border border-border/60 bg-muted/40 p-2.5 space-y-1 text-[10px] text-muted-foreground">
                  <p className="font-semibold uppercase tracking-wider text-[9px] text-muted-foreground/80">Atalhos</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <span><kbd className="px-1 rounded bg-background text-foreground">P</kbd> Caneta</span>
                    <span><kbd className="px-1 rounded bg-background text-foreground">H</kbd> Marca</span>
                    <span><kbd className="px-1 rounded bg-background text-foreground">E</kbd> Borracha</span>
                    <span><kbd className="px-1 rounded bg-background text-foreground">T</kbd> Texto</span>
                    <span><kbd className="px-1 rounded bg-background text-foreground">S</kbd> Selecionar</span>
                    <span><kbd className="px-1 rounded bg-background text-foreground">L</kbd>/<kbd className="px-1 rounded bg-background text-foreground">R</kbd>/<kbd className="px-1 rounded bg-background text-foreground">O</kbd>/<kbd className="px-1 rounded bg-background text-foreground">A</kbd></span>
                    <span><kbd className="px-1 rounded bg-background text-foreground">Ctrl+Z</kbd></span>
                    <span><kbd className="px-1 rounded bg-background text-foreground">Ctrl+Shift+Z</kbd></span>
                  </div>
                </section>

                {/* Clear */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={!strokes.length && !texts.length}
                  className="w-full rounded-xl text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Limpar tudo
                </Button>
              </div>
            </aside>
          )}

          {/* Canvas */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.05),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(16,185,129,0.04),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.07),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(16,185,129,0.05),transparent_40%)] flex items-center justify-center p-2 sm:p-4"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              onTouchCancel={handlePointerUp}
              style={{
                touchAction: 'none',
                cursor:
                  currentTool === 'text' ? 'text'
                  : currentTool === 'eraser' ? 'none'
                  : currentTool === 'select' ? 'crosshair'
                  : 'crosshair',
              }}
              className="bg-white rounded-xl shadow-xl ring-1 ring-black/5 select-none"
            />
          </div>
        </div>

        {/* ─── Footer ─── */}
        <footer className="flex items-center justify-between gap-3 px-3 sm:px-5 py-2.5 border-t border-border/60 bg-gradient-to-r from-background via-muted/30 to-background">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="tabular-nums">{strokes.length} traço{strokes.length === 1 ? '' : 's'}</span>
            <span className="text-border">·</span>
            <span className="tabular-nums">{texts.length} texto{texts.length === 1 ? '' : 's'}</span>
            {selectionCount > 0 && (
              <>
                <span className="text-border">·</span>
                <span className="text-primary font-medium">{selectionCount} selecionado{selectionCount > 1 ? 's' : ''}</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={onClose}>Cancelar</Button>
            <Button
              size="sm"
              onClick={handleSave}
              className={cn(
                'rounded-xl font-semibold transition-all',
                savedTick
                  ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-md shadow-violet-500/30'
              )}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {savedTick ? 'Salvo!' : 'Salvar anotações'}
            </Button>
          </div>
        </footer>
      </div>

      {/* ─── Text input popover ─── */}
      {isAddingText && textPosition && (
        <div className="fixed inset-0 z-[210] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border/60 rounded-2xl p-5 shadow-2xl max-w-md w-full">
            <h3 className="font-semibold text-sm mb-3">Adicionar texto</h3>
            <input
              autoFocus
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Digite o texto…"
              onKeyDown={e => {
                if (e.key === 'Enter') commitText()
                if (e.key === 'Escape') {
                  setIsAddingText(false); setTextInput(''); setTextPosition(null)
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1">
                <Slider label="Tamanho" value={textSize} onChange={setTextSize} min={10} max={56} step={1} suffix="px" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-3">
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => { setIsAddingText(false); setTextInput(''); setTextPosition(null) }}>Cancelar</Button>
              <Button size="sm" className="rounded-lg" onClick={commitText} disabled={!textInput.trim()}>Adicionar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── helpers ────────────────────────────────────── */
function ToolPanel({ title, tint, children }: { title: string; tint: string; children: React.ReactNode }) {
  return (
    <section className={cn('rounded-xl border p-3 space-y-2.5', tint)}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">{title}</p>
      {children}
    </section>
  )
}

function ColorRow({ value, onChange, presets }: { value: string; onChange: (v: string) => void; presets: string[] }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-7 w-7 rounded-lg border border-border/60 cursor-pointer" />
        <span className="text-[10px] text-muted-foreground tabular-nums">{value.toUpperCase()}</span>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {presets.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            title={c}
            className={cn(
              'aspect-square rounded-md border transition-all',
              value.toLowerCase() === c.toLowerCase() ? 'border-foreground/80 scale-110 ring-2 ring-primary/30' : 'border-border/40 hover:scale-105'
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  )
}

function Slider({ label, value, onChange, min, max, step, suffix }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-foreground/80">{label}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  )
}

function SegmentBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-8 text-[11px] rounded-lg font-medium transition-all border',
        active ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background border-border/60 hover:bg-muted'
      )}
    >
      {children}
    </button>
  )
}
