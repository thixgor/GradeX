'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Pencil,
  Eraser,
  Highlighter,
  Type,
  MousePointer2,
  Trash2,
  X,
  RotateCw,
} from 'lucide-react'
import {
  DrawingTool,
  EraserType,
  SelectionMode,
  Point,
  DrawingStroke,
  TextAnnotation,
  QuestionAnnotation,
} from '@/lib/types'

interface QuestionNotesCanvasProps {
  questionId: string
  questionNumber: number
  initialAnnotation?: QuestionAnnotation
  onSave: (annotation: QuestionAnnotation) => void
  onClose: () => void
}

export function QuestionNotesCanvas({
  questionId,
  questionNumber,
  initialAnnotation,
  onSave,
  onClose,
}: QuestionNotesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastMousePosRef = useRef<Point | null>(null)

  // Tool states
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen')
  const [penColor, setPenColor] = useState('#000000')
  const [penThickness, setPenThickness] = useState(2)
  const [highlighterColor, setHighlighterColor] = useState('#ffff00')
  const [highlighterSize, setHighlighterSize] = useState(20)
  const [eraserSize, setEraserSize] = useState(20)
  const [eraserType, setEraserType] = useState<EraserType>('standard')

  // Annotation data
  const [strokes, setStrokes] = useState<DrawingStroke[]>(initialAnnotation?.strokes || [])
  const [texts, setTexts] = useState<TextAnnotation[]>(initialAnnotation?.texts || [])
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])

  // Straight line state
  const [isHoldingForStraight, setIsHoldingForStraight] = useState(false)
  const [straightLineAngle, setStraightLineAngle] = useState(0)
  const [straightLineMode, setStraightLineMode] = useState(false)

  // Text tool states
  const [isAddingText, setIsAddingText] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<Point | null>(null)
  const [textColor, setTextColor] = useState('#000000')
  const [textSize, setTextSize] = useState(16)

  // Selection tool states
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('rectangle')
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([])
  const [selectedTextIds, setSelectedTextIds] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 })
  const [selectionPath, setSelectionPath] = useState<Point[]>([])
  const [isSelecting, setIsSelecting] = useState(false)

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Set canvas size
    canvas.width = 800
    canvas.height = 600

    setCtx(context)
    redrawCanvas(context)
  }, [])

  // Redraw canvas whenever annotations change
  useEffect(() => {
    if (ctx) {
      redrawCanvas(ctx)
    }
  }, [strokes, texts, ctx, selectedStrokeIds, selectedTextIds, selectionPath, currentStroke])

  function redrawCanvas(context: CanvasRenderingContext2D) {
    const canvas = canvasRef.current
    if (!canvas) return

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Draw white background
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Draw all strokes
    strokes.forEach((stroke) => {
      const isSelected = selectedStrokeIds.includes(stroke.id)
      drawStroke(context, stroke, isSelected)
    })

    // Draw all texts
    texts.forEach((text) => {
      const isSelected = selectedTextIds.includes(text.id)
      drawText(context, text, isSelected)
    })

    // Draw current stroke being drawn
    if (currentStroke.length > 0 && (currentTool === 'pen' || currentTool === 'highlighter')) {
      if (straightLineMode && currentStroke.length >= 2) {
        // Draw straight line
        const start = currentStroke[0]
        const end = currentStroke[currentStroke.length - 1]
        const tempStroke: DrawingStroke = {
          id: 'temp',
          tool: currentTool,
          points: [start, end],
          color: currentTool === 'pen' ? penColor : highlighterColor,
          thickness: currentTool === 'pen' ? penThickness : highlighterSize,
          opacity: currentTool === 'highlighter' ? 0.3 : 1,
        }
        drawStroke(context, tempStroke)

        // Draw rotation handles
        drawRotationHandles(context, start, end)
      } else {
        const tempStroke: DrawingStroke = {
          id: 'temp',
          tool: currentTool,
          points: currentStroke,
          color: currentTool === 'pen' ? penColor : highlighterColor,
          thickness: currentTool === 'pen' ? penThickness : highlighterSize,
          opacity: currentTool === 'highlighter' ? 0.3 : 1,
        }
        drawStroke(context, tempStroke)
      }
    }

    // Draw selection path
    if (isSelecting && selectionPath.length > 0) {
      context.save()
      context.strokeStyle = 'rgba(59, 130, 246, 0.8)'
      context.lineWidth = 2
      context.setLineDash([5, 5])

      if (selectionMode === 'rectangle' && selectionPath.length >= 2) {
        // Draw rectangle
        const start = selectionPath[0]
        const end = selectionPath[selectionPath.length - 1]
        const width = end.x - start.x
        const height = end.y - start.y
        context.strokeRect(start.x, start.y, width, height)
      } else if (selectionMode === 'lasso' && selectionPath.length > 1) {
        // Draw lasso path
        context.beginPath()
        context.moveTo(selectionPath[0].x, selectionPath[0].y)
        for (let i = 1; i < selectionPath.length; i++) {
          context.lineTo(selectionPath[i].x, selectionPath[i].y)
        }
        context.stroke()
      }

      context.restore()
    }
  }

  function drawRotationHandles(context: CanvasRenderingContext2D, start: Point, end: Point) {
    context.save()
    context.fillStyle = 'rgba(59, 130, 246, 0.5)' // Blue
    context.strokeStyle = 'rgb(59, 130, 246)'
    context.lineWidth = 2

    // Draw handle at start
    context.beginPath()
    context.arc(start.x, start.y, 8, 0, 2 * Math.PI)
    context.fill()
    context.stroke()

    // Draw handle at end
    context.beginPath()
    context.arc(end.x, end.y, 8, 0, 2 * Math.PI)
    context.fill()
    context.stroke()

    context.restore()
  }

  function drawStroke(context: CanvasRenderingContext2D, stroke: DrawingStroke, isSelected = false) {
    if (stroke.points.length < 2) return

    context.save()

    if (isSelected) {
      // Draw selection outline
      context.strokeStyle = 'rgba(59, 130, 246, 0.5)'
      context.lineWidth = stroke.thickness + 6
      context.lineCap = 'round'
      context.lineJoin = 'round'

      context.beginPath()
      context.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        context.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      context.stroke()
    }

    context.strokeStyle = stroke.color
    context.lineWidth = stroke.thickness
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.globalAlpha = stroke.opacity || 1

    context.beginPath()
    context.moveTo(stroke.points[0].x, stroke.points[0].y)

    for (let i = 1; i < stroke.points.length; i++) {
      context.lineTo(stroke.points[i].x, stroke.points[i].y)
    }

    context.stroke()
    context.restore()
  }

  function drawText(context: CanvasRenderingContext2D, text: TextAnnotation, isSelected = false) {
    context.save()

    if (isSelected) {
      // Draw selection box
      const metrics = context.measureText(text.text)
      const textHeight = text.fontSize
      context.strokeStyle = 'rgba(59, 130, 246, 0.8)'
      context.lineWidth = 2
      context.strokeRect(
        text.position.x - 4,
        text.position.y - textHeight - 4,
        metrics.width + 8,
        textHeight + 8
      )
    }

    context.fillStyle = text.color
    context.font = `${text.fontSize}px Arial`
    context.fillText(text.text, text.position.x, text.position.y)
    context.restore()
  }

  function getCanvasPoint(e: React.MouseEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const point = getCanvasPoint(e)

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      setIsDrawing(true)
      setCurrentStroke([point])
      setStraightLineMode(false)
      lastMousePosRef.current = point

      // Start hold timer for straight line
      holdTimerRef.current = setTimeout(() => {
        setIsHoldingForStraight(true)
        setStraightLineMode(true)
      }, 2000)
    } else if (currentTool === 'eraser') {
      setIsDrawing(true)
      eraseAt(point)
    } else if (currentTool === 'text') {
      setTextPosition(point)
      setIsAddingText(true)
    } else if (currentTool === 'select') {
      // Check if clicking on selected element to drag
      if (selectedStrokeIds.length > 0 || selectedTextIds.length > 0) {
        const clickedStroke = findStrokeAtPoint(point)
        const clickedText = findTextAtPoint(point)

        if (
          (clickedStroke && selectedStrokeIds.includes(clickedStroke.id)) ||
          (clickedText && selectedTextIds.includes(clickedText.id))
        ) {
          // Start dragging
          setIsDragging(true)
          setDragStart(point)
          return
        }
      }

      // Start new selection
      setIsSelecting(true)
      setSelectionPath([point])
      setSelectedStrokeIds([])
      setSelectedTextIds([])
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const point = getCanvasPoint(e)

    if (!isDrawing && !isDragging && !isSelecting) return

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      if (!straightLineMode) {
        // Check if mouse has moved significantly
        if (lastMousePosRef.current) {
          const distance = Math.sqrt(
            Math.pow(point.x - lastMousePosRef.current.x, 2) +
            Math.pow(point.y - lastMousePosRef.current.y, 2)
          )

          // If mouse moved, reset the hold timer
          if (distance > 3) {
            if (holdTimerRef.current) {
              clearTimeout(holdTimerRef.current)
              setIsHoldingForStraight(false)
            }
            holdTimerRef.current = setTimeout(() => {
              setIsHoldingForStraight(true)
              setStraightLineMode(true)
            }, 2000)
          }
        }
        lastMousePosRef.current = point
      }

      setCurrentStroke((prev) => [...prev, point])
      if (ctx) {
        redrawCanvas(ctx)
      }
    } else if (currentTool === 'eraser') {
      eraseAt(point)
    } else if (currentTool === 'select' && isDragging && dragStart) {
      const dx = point.x - dragStart.x
      const dy = point.y - dragStart.y

      // Move selected strokes
      if (selectedStrokeIds.length > 0) {
        setStrokes((prev) =>
          prev.map((stroke) => {
            if (selectedStrokeIds.includes(stroke.id)) {
              return {
                ...stroke,
                points: stroke.points.map((p) => ({
                  x: p.x + dx,
                  y: p.y + dy,
                })),
              }
            }
            return stroke
          })
        )
      }

      // Move selected texts
      if (selectedTextIds.length > 0) {
        setTexts((prev) =>
          prev.map((text) => {
            if (selectedTextIds.includes(text.id)) {
              return {
                ...text,
                position: {
                  x: text.position.x + dx,
                  y: text.position.y + dy,
                },
              }
            }
            return text
          })
        )
      }

      setDragStart(point)
    } else if (currentTool === 'select' && isSelecting) {
      // Add points to selection path
      if (selectionMode === 'rectangle') {
        // For rectangle, just update the end point
        setSelectionPath([selectionPath[0], point])
      } else {
        // For lasso, add all points
        setSelectionPath((prev) => [...prev, point])
      }

      if (ctx) {
        redrawCanvas(ctx)
      }
    }
  }

  function handleMouseUp() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }

    // Handle selection end
    if (isSelecting && selectionPath.length > 0) {
      const selectedStrokes: string[] = []
      const selectedTexts: string[] = []

      if (selectionMode === 'rectangle' && selectionPath.length >= 2) {
        // Rectangle selection
        const start = selectionPath[0]
        const end = selectionPath[selectionPath.length - 1]
        const minX = Math.min(start.x, end.x)
        const maxX = Math.max(start.x, end.x)
        const minY = Math.min(start.y, end.y)
        const maxY = Math.max(start.y, end.y)

        // Check strokes
        strokes.forEach((stroke) => {
          const isInside = stroke.points.some(
            (p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY
          )
          if (isInside) selectedStrokes.push(stroke.id)
        })

        // Check texts
        texts.forEach((text) => {
          if (
            text.position.x >= minX &&
            text.position.x <= maxX &&
            text.position.y >= minY &&
            text.position.y <= maxY
          ) {
            selectedTexts.push(text.id)
          }
        })
      } else if (selectionMode === 'lasso' && selectionPath.length > 2) {
        // Lasso selection using point-in-polygon algorithm
        strokes.forEach((stroke) => {
          const isInside = stroke.points.some((p) => isPointInPolygon(p, selectionPath))
          if (isInside) selectedStrokes.push(stroke.id)
        })

        texts.forEach((text) => {
          if (isPointInPolygon(text.position, selectionPath)) {
            selectedTexts.push(text.id)
          }
        })
      }

      setSelectedStrokeIds(selectedStrokes)
      setSelectedTextIds(selectedTexts)
      setIsSelecting(false)
      setSelectionPath([])

      if (ctx) {
        redrawCanvas(ctx)
      }

      return
    }

    if (!isDrawing) {
      setIsDragging(false)
      return
    }

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      if (currentStroke.length > 1) {
        let finalPoints = currentStroke

        // If in straight line mode, use only start and end points
        if (straightLineMode) {
          finalPoints = [currentStroke[0], currentStroke[currentStroke.length - 1]]
        }

        const newStroke: DrawingStroke = {
          id: `stroke-${Date.now()}-${Math.random()}`,
          tool: currentTool,
          points: finalPoints,
          color: currentTool === 'pen' ? penColor : highlighterColor,
          thickness: currentTool === 'pen' ? penThickness : highlighterSize,
          opacity: currentTool === 'highlighter' ? 0.3 : 1,
        }
        setStrokes((prev) => [...prev, newStroke])
      }
      setCurrentStroke([])
      setStraightLineMode(false)
      setIsHoldingForStraight(false)
    }

    setIsDrawing(false)
    setIsDragging(false)
    lastMousePosRef.current = null
  }

  function findStrokeAtPoint(point: Point): DrawingStroke | null {
    // Check in reverse order (top to bottom)
    for (let i = strokes.length - 1; i >= 0; i--) {
      const stroke = strokes[i]
      for (const p of stroke.points) {
        const distance = Math.sqrt(
          Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)
        )
        if (distance < stroke.thickness / 2 + 5) {
          return stroke
        }
      }
    }
    return null
  }

  function findTextAtPoint(point: Point): TextAnnotation | null {
    if (!ctx) return null

    for (let i = texts.length - 1; i >= 0; i--) {
      const text = texts[i]
      ctx.font = `${text.fontSize}px Arial`
      const metrics = ctx.measureText(text.text)

      if (
        point.x >= text.position.x &&
        point.x <= text.position.x + metrics.width &&
        point.y >= text.position.y - text.fontSize &&
        point.y <= text.position.y
      ) {
        return text
      }
    }
    return null
  }

  function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    // Ray casting algorithm
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x
      const yi = polygon[i].y
      const xj = polygon[j].x
      const yj = polygon[j].y

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

      if (intersect) inside = !inside
    }
    return inside
  }

  function eraseAt(point: Point) {
    if (eraserType === 'standard') {
      // Borracha padrão: apaga pontos individualmente
      setStrokes((prev) => {
        const newStrokes: DrawingStroke[] = []

        for (const stroke of prev) {
          const remainingPoints: Point[] = []
          const segments: Point[][] = []
          let currentSegment: Point[] = []

          for (const p of stroke.points) {
            const distance = Math.sqrt(
              Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)
            )

            if (distance >= eraserSize / 2) {
              // Ponto fora do raio da borracha - manter
              currentSegment.push(p)
            } else {
              // Ponto dentro do raio - apagar
              if (currentSegment.length > 0) {
                segments.push(currentSegment)
                currentSegment = []
              }
            }
          }

          // Adicionar último segmento se existir
          if (currentSegment.length > 0) {
            segments.push(currentSegment)
          }

          // Criar novos strokes para cada segmento
          for (const segment of segments) {
            if (segment.length >= 2) {
              newStrokes.push({
                ...stroke,
                id: `stroke-${Date.now()}-${Math.random()}`,
                points: segment,
              })
            }
          }
        }

        return newStrokes
      })
    } else {
      // Borracha traço: apaga o traço inteiro se qualquer ponto for tocado
      setStrokes((prev) =>
        prev.filter((stroke) => {
          return !stroke.points.some((p) => {
            const distance = Math.sqrt(
              Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)
            )
            return distance < eraserSize / 2
          })
        })
      )
    }

    if (ctx) {
      redrawCanvas(ctx)
    }
  }

  function handleAddText() {
    if (!textInput.trim() || !textPosition) return

    const newText: TextAnnotation = {
      id: `text-${Date.now()}-${Math.random()}`,
      text: textInput,
      position: textPosition,
      fontSize: textSize,
      color: textColor,
    }

    setTexts((prev) => [...prev, newText])
    setTextInput('')
    setTextPosition(null)
    setIsAddingText(false)

    if (ctx) {
      redrawCanvas(ctx)
    }
  }

  function handleClearAll() {
    if (confirm('Tem certeza que deseja limpar todas as anotações desta questão?')) {
      setStrokes([])
      setTexts([])
      setSelectedStrokeIds([])
      setSelectedTextIds([])
      if (ctx) {
        redrawCanvas(ctx)
      }
    }
  }

  function handleSave() {
    const annotation: QuestionAnnotation = {
      questionId,
      questionNumber,
      strokes,
      texts,
      canvasDataUrl: canvasRef.current?.toDataURL(),
    }
    onSave(annotation)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Anotações - Questão {questionNumber}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="w-64 border-r p-4 overflow-y-auto space-y-4">
            {/* Tool Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Ferramentas</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={currentTool === 'pen' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('pen')}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Caneta
                </Button>
                <Button
                  variant={currentTool === 'eraser' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('eraser')}
                  className="flex items-center gap-2"
                >
                  <Eraser className="h-4 w-4" />
                  Borracha
                </Button>
                <Button
                  variant={currentTool === 'highlighter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('highlighter')}
                  className="flex items-center gap-2"
                >
                  <Highlighter className="h-4 w-4" />
                  Marca-texto
                </Button>
                <Button
                  variant={currentTool === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('text')}
                  className="flex items-center gap-2"
                >
                  <Type className="h-4 w-4" />
                  Texto
                </Button>
                <Button
                  variant={currentTool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentTool('select')}
                  className="flex items-center gap-2"
                >
                  <MousePointer2 className="h-4 w-4" />
                  Seleção
                </Button>
              </div>
            </div>

            {/* Pen Settings */}
            {currentTool === 'pen' && (
              <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Label className="text-xs font-semibold">Configurações da Caneta</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Cor</Label>
                    <Input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="h-8 w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Grossura: {penThickness}px</Label>
                    <Input
                      type="range"
                      min="1"
                      max="20"
                      value={penThickness}
                      onChange={(e) => setPenThickness(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                  💡 Dica: Desenhe uma linha e segure por 2s para criar uma linha reta!
                </div>
              </div>
            )}

            {/* Eraser Settings */}
            {currentTool === 'eraser' && (
              <div className="space-y-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <Label className="text-xs font-semibold">Configurações da Borracha</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Tamanho: {eraserSize}px</Label>
                    <Input
                      type="range"
                      min="5"
                      max="50"
                      value={eraserSize}
                      onChange={(e) => setEraserSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo de Borracha</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Button
                        variant={eraserType === 'standard' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEraserType('standard')}
                      >
                        Padrão
                      </Button>
                      <Button
                        variant={eraserType === 'line' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEraserType('line')}
                      >
                        Traço
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {eraserType === 'standard'
                        ? '🔹 Padrão: Apaga pedacinhos conforme você passa'
                        : '🔸 Traço: Apaga o traço inteiro ao tocar'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Highlighter Settings */}
            {currentTool === 'highlighter' && (
              <div className="space-y-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <Label className="text-xs font-semibold">Configurações do Marca-texto</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Cor</Label>
                    <Input
                      type="color"
                      value={highlighterColor}
                      onChange={(e) => setHighlighterColor(e.target.value)}
                      className="h-8 w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tamanho: {highlighterSize}px</Label>
                    <Input
                      type="range"
                      min="10"
                      max="50"
                      value={highlighterSize}
                      onChange={(e) => setHighlighterSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Text Settings */}
            {currentTool === 'text' && (
              <div className="space-y-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <Label className="text-xs font-semibold">Configurações de Texto</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Cor</Label>
                    <Input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-8 w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tamanho: {textSize}px</Label>
                    <Input
                      type="range"
                      min="12"
                      max="48"
                      value={textSize}
                      onChange={(e) => setTextSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique no canvas para adicionar texto
                  </p>
                </div>
              </div>
            )}

            {/* Select Settings */}
            {currentTool === 'select' && (
              <div className="space-y-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <Label className="text-xs font-semibold">Ferramenta de Seleção</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Modo de Seleção</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Button
                        variant={selectionMode === 'rectangle' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectionMode('rectangle')}
                      >
                        Retângulo
                      </Button>
                      <Button
                        variant={selectionMode === 'lasso' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectionMode('lasso')}
                      >
                        Livre
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectionMode === 'rectangle'
                        ? '🔲 Retângulo: Desenhe um retângulo tracejado'
                        : '✏️ Livre: Desenhe um traçado livre'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedStrokeIds.length > 0 || selectedTextIds.length > 0
                      ? `✓ ${selectedStrokeIds.length + selectedTextIds.length} elemento(s) selecionado(s) - arraste para mover`
                      : 'Desenhe para selecionar elementos'}
                  </p>
                  {(selectedStrokeIds.length > 0 || selectedTextIds.length > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStrokeIds([])
                        setSelectedTextIds([])
                      }}
                      className="w-full"
                    >
                      Limpar Seleção
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                className="w-full flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Tudo
              </Button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-4 overflow-auto bg-gray-100 dark:bg-gray-950">
            <div className="flex items-center justify-center min-h-full">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="border-2 border-gray-300 dark:border-gray-700 rounded-lg shadow-lg bg-white cursor-crosshair"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 dark:bg-gray-800">
          <p className="text-sm text-muted-foreground">
            {strokes.length} traço(s) • {texts.length} texto(s)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Anotações
            </Button>
          </div>
        </div>
      </div>

      {/* Text Input Modal */}
      {isAddingText && textPosition && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="font-semibold mb-4">Adicionar Texto</h3>
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Digite o texto..."
              className="mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddText()
                if (e.key === 'Escape') {
                  setIsAddingText(false)
                  setTextInput('')
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingText(false)
                  setTextInput('')
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddText}>Adicionar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
