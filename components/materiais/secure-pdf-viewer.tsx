'use client'

import type * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bold,
  Bookmark,
  Brush,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Eraser,
  HelpCircle,
  Highlighter,
  Italic,
  List,
  Maximize2,
  MessageSquare,
  Minus,
  MousePointer2,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Plus,
  SearchX,
  ShieldCheck,
  StickyNote,
  Trash2,
  Type,
  Underline,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type ViewerMode = 'single' | 'width' | 'continuous'
type AnnotationType = 'highlight' | 'note' | 'bookmark' | 'text' | 'drawing'
type AnnotationTool = 'cursor' | AnnotationType | 'eraser'
type DrawingMode = 'free' | 'marker' | 'line' | 'dash' | 'circle'
type TextAlign = 'left' | 'center' | 'right'

interface SummaryEntry {
  id: string
  title: string
  page: number
  level?: number
}

interface NavEntry {
  id: string
  label: string
  page: number
}

interface ViewerAccess {
  material: {
    id: string
    title: string
    pageCount: number
    viewerEnabled: boolean
    downloadEnabled: boolean
  }
  audit: {
    openedAt: string
  }
  viewer: {
    defaultMode: ViewerMode
    minZoom: number
    maxZoom: number
    coverPage?: number
    summary?: SummaryEntry[]
    navigation?: NavEntry[]
  }
}

interface PdfAnnotation {
  _id: string
  id: string
  userId: string
  materialId: string
  pageNumber: number
  type: AnnotationType
  position: {
    x?: number
    y?: number
    width?: number
    height?: number
    points?: PdfPoint[]
  }
  content: string
  color: string
  data?: AnnotationData
  createdAt: string
  updatedAt: string
}

interface AnnotationData {
  drawingMode?: DrawingMode
  strokeWidthRatio?: number
  opacity?: number
  fontFamily?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: TextAlign
  noteColor?: string
}

interface PageSize {
  width: number
  height: number
}

interface PdfPoint {
  x: number
  y: number
}

interface DrawingStyle {
  mode: DrawingMode
  color: string
  width: number
  opacity: number
  holdToShape: boolean
}

interface TextStyle {
  fontFamily: string
  fontSize: number
  color: string
  bold: boolean
  italic: boolean
  underline: boolean
  align: TextAlign
}

interface EditorState {
  kind: 'text' | 'note'
  point: PdfPoint
  content: string
  annotation?: PdfAnnotation
  textStyle: TextStyle
  noteColor: string
}

interface DrawingDraft {
  points: PdfPoint[]
  mode: DrawingMode
  color: string
  strokeWidthRatio: number
  opacity: number
  start: PdfPoint
  current: PdfPoint
  autoShape: boolean
}

interface HighlightDraft {
  start: PdfPoint
  current: PdfPoint
  points: PdfPoint[]
  strokeWidthRatio: number
  color: string
}

const PAGE_BYTES_CACHE_TTL_MS = 10 * 60 * 1000
const PAGE_BYTES_CACHE_MAX_ENTRIES = 36
const COLOR_SWATCHES = ['#22c55e', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#111827']
const HIGHLIGHT_SWATCHES = ['#facc15', '#fb923c', '#86efac', '#93c5fd', '#f9a8d4']
const NOTE_SWATCHES = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fecdd3', '#ddd6fe']
const FONT_OPTIONS = ['Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New']
const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M9 18 17.5 9.5a3 3 0 0 1 4.24 4.24L14.5 21H8l-3-3 4-4Z' fill='%23fff' stroke='%23111827' stroke-width='2' stroke-linejoin='round'/%3E%3Cpath d='M13 14 17 18' stroke='%23111827' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") 7 21, cell`
const pageBytesCache = new Map<string, { bytes: Uint8Array; pageCount?: number; expiresAt: number }>()
const pageBytesInflight = new Map<string, Promise<{ bytes: Uint8Array; pageCount?: number }>>()

let pdfWorkerConfigured = false

async function getPdfJs() {
  const pdfjsLib = await import('pdfjs-dist')
  if (!pdfWorkerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    pdfWorkerConfigured = true
  }
  return pdfjsLib
}

// Cada página é um PDF marcado individualmente no servidor (operação pesada
// de CPU/memória). Ao abrir o documento, uma requisição por página visível era
// disparada ao mesmo tempo, sem limite de concorrência, sem timeout e sem
// retry. A rajada sobrecarregava o endpoint de marca d'água e algumas
// requisições travavam ou falhavam, deixando a página presa no spinner até um
// F5 reativá-la. As constantes/fila abaixo resolvem isso na origem.
const PAGE_FETCH_MAX_CONCURRENCY = 3
const PAGE_FETCH_TIMEOUT_MS = 25000
const PAGE_FETCH_MAX_ATTEMPTS = 4

let pageFetchActive = 0
const pageFetchQueue: Array<() => void> = []

function acquirePageFetchSlot(): Promise<() => void> {
  return new Promise((resolve) => {
    const grant = () => {
      pageFetchActive += 1
      let released = false
      resolve(() => {
        if (released) return
        released = true
        pageFetchActive -= 1
        const next = pageFetchQueue.shift()
        if (next) next()
      })
    }
    if (pageFetchActive < PAGE_FETCH_MAX_CONCURRENCY) grant()
    else pageFetchQueue.push(grant)
  })
}

const pageFetchSleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchPdfPageBytesOnce(materialId: string, pageNumber: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PAGE_FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(
      `/api/materiais/${materialId}/pdf-viewer/page?page=${pageNumber}`,
      { cache: 'no-store', signal: controller.signal }
    )
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      const err = new Error(data.error || 'Falha ao carregar pagina') as Error & { status?: number }
      err.status = response.status
      throw err
    }

    const pageCountHeader = Number(response.headers.get('X-DomineAqui-Page-Count') || 0)
    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      pageCount: Number.isFinite(pageCountHeader) && pageCountHeader > 0 ? pageCountHeader : undefined,
    }
  } finally {
    clearTimeout(timer)
  }
}

async function fetchPdfPageBytes(materialId: string, pageNumber: number) {
  const key = `${materialId}:${pageNumber}`
  const now = Date.now()
  const cached = pageBytesCache.get(key)
  if (cached && cached.expiresAt > now) {
    return { bytes: cached.bytes, pageCount: cached.pageCount }
  }
  if (cached) pageBytesCache.delete(key)

  const pending = pageBytesInflight.get(key)
  if (pending) return pending

  const request = (async () => {
    const release = await acquirePageFetchSlot()
    try {
      let lastError: unknown
      for (let attempt = 1; attempt <= PAGE_FETCH_MAX_ATTEMPTS; attempt += 1) {
        try {
          const result = await fetchPdfPageBytesOnce(materialId, pageNumber)

          while (pageBytesCache.size >= PAGE_BYTES_CACHE_MAX_ENTRIES) {
            const oldestKey = pageBytesCache.keys().next().value
            if (!oldestKey) break
            pageBytesCache.delete(oldestKey)
          }
          pageBytesCache.set(key, {
            ...result,
            expiresAt: Date.now() + PAGE_BYTES_CACHE_TTL_MS,
          })
          return result
        } catch (err) {
          lastError = err
          // Só re-tenta falhas transitórias (rede/abort, 5xx, 408, 429);
          // erros de cliente reais (ex.: 403) falham rápido.
          const status = (err as { status?: number })?.status
          const retriable =
            status === undefined || status >= 500 || status === 408 || status === 429
          if (!retriable || attempt >= PAGE_FETCH_MAX_ATTEMPTS) break
          await pageFetchSleep(Math.min(8000, 500 * 2 ** (attempt - 1)))
        }
      }
      throw lastError
    } finally {
      release()
    }
  })()

  pageBytesInflight.set(key, request)
  try {
    return await request
  } finally {
    pageBytesInflight.delete(key)
  }
}

function clampZoom(value: number, min = 0.55, max = 2.6) {
  return Math.min(max, Math.max(min, Number(value.toFixed(2))))
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function buildPageArray(total: number, current: number, mode: ViewerMode) {
  if (mode === 'single') return [current]
  return Array.from({ length: total }, (_, index) => index + 1)
}

function createEmptyAnnotation(input: Partial<PdfAnnotation>, materialId: string): PdfAnnotation {
  const now = new Date().toISOString()
  const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return {
    _id: id,
    id,
    userId: 'local',
    materialId,
    pageNumber: input.pageNumber || 1,
    type: input.type || 'note',
    position: input.position || {},
    content: input.content || '',
    color: input.color || '#22c55e',
    data: input.data || {},
    createdAt: now,
    updatedAt: now,
  }
}

function extractObjectId(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') {
    if (value.startsWith('temp-') || value === 'draft') return ''
    const exact = value.match(/^[a-f\d]{24}$/i)
    if (exact) return exact[0]
    const embedded = value.match(/[a-f\d]{24}/i)
    return embedded?.[0] || ''
  }
  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    return (
      extractObjectId(objectValue.$oid) ||
      extractObjectId(objectValue.oid) ||
      extractObjectId(objectValue.id) ||
      extractObjectId(objectValue._id) ||
      extractObjectId(String(value))
    )
  }
  return extractObjectId(String(value))
}

function getPersistedAnnotationId(annotation: PdfAnnotation) {
  return extractObjectId(annotation.id) || extractObjectId(annotation._id)
}

function normalizeRect(start: PdfPoint, current: PdfPoint, minWidth = 0.012, minHeight = 0.008) {
  const x = Math.min(start.x, current.x)
  const y = Math.min(start.y, current.y)
  const width = Math.abs(start.x - current.x)
  const height = Math.abs(start.y - current.y)
  return {
    x: clamp01(width < minWidth ? start.x - minWidth / 2 : x),
    y: clamp01(height < minHeight ? start.y - minHeight / 2 : y),
    width: Math.min(width < minWidth ? minWidth : width, 1 - x),
    height: Math.min(height < minHeight ? minHeight : height, 1 - y),
  }
}

function distance(a: PdfPoint, b: PdfPoint) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function getPathLength(points: PdfPoint[]) {
  let total = 0
  for (let index = 1; index < points.length; index++) {
    total += distance(points[index - 1], points[index])
  }
  return total
}

function getLineDeviation(points: PdfPoint[]) {
  if (points.length < 3) return 0
  const start = points[0]
  const end = points[points.length - 1]
  const base = distance(start, end)
  if (base < 0.001) return Number.POSITIVE_INFINITY

  let maxDeviation = 0
  for (const point of points) {
    const deviation = Math.abs(
      (end.y - start.y) * point.x -
      (end.x - start.x) * point.y +
      end.x * start.y -
      end.y * start.x
    ) / base
    maxDeviation = Math.max(maxDeviation, deviation)
  }
  return maxDeviation
}

function shouldConvertToLine(points: PdfPoint[]) {
  if (points.length < 2 || points.length > 14) return false
  const start = points[0]
  const end = points[points.length - 1]
  const straightDistance = distance(start, end)
  const pathLength = getPathLength(points)
  const bounds = getPointBounds(points)
  const maxDimension = Math.max(bounds.width, bounds.height)
  if (straightDistance < 0.045 || pathLength <= 0) return false

  const efficiency = straightDistance / pathLength
  const deviation = getLineDeviation(points)
  return efficiency > 0.965 && deviation < Math.max(0.006, maxDimension * 0.035)
}

function getPointBounds(points: PdfPoint[]) {
  if (!points.length) return { x: 0, y: 0, width: 0.08, height: 0.05 }
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return {
    x: minX,
    y: minY,
    width: Math.max(0.01, maxX - minX),
    height: Math.max(0.01, maxY - minY),
  }
}

function getAnnotationBounds(annotation: PdfAnnotation) {
  if (annotation.position.points?.length) return getPointBounds(annotation.position.points)
  return {
    x: annotation.position.x || 0,
    y: annotation.position.y || 0,
    width: annotation.position.width || 0.08,
    height: annotation.position.height || 0.05,
  }
}

function pointsToSvgPath(points: PdfPoint[]) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x * 100} ${points[0].y * 100}`
  const segments = [`M ${points[0].x * 100} ${points[0].y * 100}`]
  for (let index = 1; index < points.length - 1; index++) {
    const current = points[index]
    const next = points[index + 1]
    const midX = ((current.x + next.x) / 2) * 100
    const midY = ((current.y + next.y) / 2) * 100
    segments.push(`Q ${current.x * 100} ${current.y * 100} ${midX} ${midY}`)
  }
  const last = points[points.length - 1]
  segments.push(`L ${last.x * 100} ${last.y * 100}`)
  return segments.join(' ')
}

function pointsToCanvasPath(context: CanvasRenderingContext2D, points: PdfPoint[], width: number, height: number) {
  if (!points.length) return
  context.beginPath()
  context.moveTo(points[0].x * width, points[0].y * height)
  if (points.length === 1) {
    context.lineTo(points[0].x * width + 0.1, points[0].y * height + 0.1)
    return
  }

  for (let index = 1; index < points.length - 1; index++) {
    const current = points[index]
    const next = points[index + 1]
    context.quadraticCurveTo(
      current.x * width,
      current.y * height,
      ((current.x + next.x) / 2) * width,
      ((current.y + next.y) / 2) * height
    )
  }
  const last = points[points.length - 1]
  context.lineTo(last.x * width, last.y * height)
}

function shouldConvertToCircle(points: PdfPoint[]) {
  if (points.length < 10 || points.length > 80) return false
  const first = points[0]
  const last = points[points.length - 1]
  const bounds = getPointBounds(points)
  const maxDimension = Math.max(bounds.width, bounds.height)
  const minDimension = Math.min(bounds.width, bounds.height)
  const pathLength = getPathLength(points)
  if (maxDimension < 0.045 || minDimension < 0.035 || pathLength <= 0) return false

  const closeEnough = distance(first, last) < maxDimension * 0.16
  const roundEnough = bounds.width / bounds.height > 0.58 && bounds.width / bounds.height < 1.72
  const enoughPerimeter = pathLength > maxDimension * 2.45
  const notTooMessy = pathLength < maxDimension * 5.6
  return closeEnough && roundEnough && enoughPerimeter && notTooMessy
}

function resolveDrawingMode(draft: DrawingDraft, durationMs: number) {
  if (!draft.autoShape || draft.mode !== 'free' || durationMs < 620) return draft.mode
  if (shouldConvertToCircle(draft.points)) return 'circle'
  if (shouldConvertToLine(draft.points)) return 'line'
  return 'free'
}

function annotationLabel(type: AnnotationType) {
  const labels: Record<AnnotationType, string> = {
    highlight: 'Marca texto',
    note: 'Nota',
    bookmark: 'Marcador',
    text: 'Texto',
    drawing: 'Desenho',
  }
  return labels[type]
}

function useResizeWidth(ref: React.RefObject<HTMLElement>, deps: React.DependencyList) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const updateWidth = () => setWidth(element.clientWidth)
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, deps)
  return width
}

export function SecurePdfViewer({ materialId }: { materialId: string }) {
  const router = useRouter()
  const viewerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const zoomTouchedRef = useRef(false)
  const [access, setAccess] = useState<ViewerAccess | null>(null)
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [zoom, setZoom] = useState(1)
  const [mode, setMode] = useState<ViewerMode>('single')
  const [tool, setTool] = useState<AnnotationTool>('cursor')
  const [pageSize, setPageSize] = useState<PageSize | null>(null)
  const [showThumbs, setShowThumbs] = useState(true)
  const [sidePanelTab, setSidePanelTab] = useState<'pages' | 'summary'>('pages')
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [showGuide, setShowGuide] = useState(true)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [notice, setNotice] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [highlightColor, setHighlightColor] = useState('#facc15')
  const [highlightWidth, setHighlightWidth] = useState(20)
  const [noteColor, setNoteColor] = useState('#fde68a')
  const [drawingStyle, setDrawingStyle] = useState<DrawingStyle>({
    mode: 'free',
    color: '#22c55e',
    width: 4,
    opacity: 0.9,
    holdToShape: true,
  })
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#111827',
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
  })

  const minZoom = access?.viewer.minZoom ?? 0.55
  const maxZoom = access?.viewer.maxZoom ?? 2.6
  const pageCount = access?.material.pageCount ?? 0
  const summary = useMemo(() => access?.viewer.summary ?? [], [access])
  const navigation = useMemo(() => access?.viewer.navigation ?? [], [access])
  const coverPage = access?.viewer.coverPage
  const hasSummary = summary.length > 0
  const pages = useMemo(() => buildPageArray(pageCount, currentPage, mode), [pageCount, currentPage, mode])
  const contentWidth = useResizeWidth(contentRef, [loading, showAnnotations, showThumbs])
  const annotationsByPage = useMemo(() => {
    const grouped = new Map<number, PdfAnnotation[]>()
    for (const annotation of annotations) {
      const pageAnnotations = grouped.get(annotation.pageNumber) || []
      pageAnnotations.push(annotation)
      grouped.set(annotation.pageNumber, pageAnnotations)
    }
    return grouped
  }, [annotations])

  const handlePageFocused = useCallback((page: number) => {
    if (mode === 'single') return
    setCurrentPage((current) => current === page ? current : page)
  }, [mode])

  const updateKnownPageCount = useCallback((totalPages?: number) => {
    if (!totalPages || totalPages < 1) return
    setAccess((current) => {
      if (!current || totalPages <= current.material.pageCount) return current
      return {
        ...current,
        material: {
          ...current.material,
          pageCount: totalPages,
        },
      }
    })
  }, [])

  const loadAnnotations = useCallback(async () => {
    const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations`, { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      setAnnotations(json.annotations || [])
    }
  }, [materialId])

  useEffect(() => {
    let mounted = true
    async function loadAccess() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/access`, { cache: 'no-store' })
        if (res.status === 401) {
          router.push('/auth/login')
          return
        }
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(json.error || 'Nao foi possivel abrir o visualizador.')
          return
        }
        if (!mounted) return
        setAccess(json)
        // Abre na capa designada pelo admin (se houver), senão na página 1.
        const startPage = Number(json.viewer?.coverPage) > 0 ? Number(json.viewer.coverPage) : 1
        setCurrentPage(startPage)
        setPageInput(String(startPage))
        setMode(json.viewer?.defaultMode || 'single')
        loadAnnotations().catch(() => {})
      } catch {
        if (mounted) setError('PDF nao pode ser carregado agora. Tente novamente.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadAccess()
    return () => { mounted = false }
  }, [loadAnnotations, materialId, router])

  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    if (!pageSize || !contentWidth || zoomTouchedRef.current) return
    const availableWidth = Math.max(280, contentWidth - 24)
    const fittedZoom = clampZoom(availableWidth / pageSize.width, minZoom, maxZoom)
    if (fittedZoom < 0.98) setZoom(fittedZoom)
  }, [contentWidth, maxZoom, minZoom, pageSize])

  useEffect(() => {
    if (!access || currentPage >= pageCount) return
    const timer = window.setTimeout(() => {
      fetchPdfPageBytes(materialId, currentPage + 1)
        .then((result) => updateKnownPageCount(result.pageCount))
        .catch(() => {})
    }, 500)
    return () => window.clearTimeout(timer)
  }, [access, currentPage, materialId, pageCount, updateKnownPageCount])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    const block = (event: Event) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-pdf-editor="true"]')) return
      event.preventDefault()
    }
    const blockKeys = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const target = event.target as HTMLElement | null
      const isEditing = target?.closest('[data-pdf-editor="true"]')
      if (isEditing) return
      if ((event.ctrlKey || event.metaKey) && ['c', 'p', 's', 'u', 'a'].includes(key)) {
        event.preventDefault()
      }
    }
    const handleBeforePrint = () => setIsPrinting(true)
    const handleAfterPrint = () => setIsPrinting(false)
    const printQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('print')
      : null
    const handlePrintChange = (event: MediaQueryListEvent) => setIsPrinting(event.matches)
    document.addEventListener('contextmenu', block)
    document.addEventListener('copy', block)
    document.addEventListener('cut', block)
    document.addEventListener('keydown', blockKeys)
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    if (printQuery?.addEventListener) {
      printQuery.addEventListener('change', handlePrintChange)
    } else if (printQuery?.addListener) {
      printQuery.addListener(handlePrintChange)
    }
    return () => {
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('copy', block)
      document.removeEventListener('cut', block)
      document.removeEventListener('keydown', blockKeys)
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
      if (printQuery?.removeEventListener) {
        printQuery.removeEventListener('change', handlePrintChange)
      } else if (printQuery?.removeListener) {
        printQuery.removeListener(handlePrintChange)
      }
    }
  }, [])

  const goToPage = useCallback((page: number) => {
    const next = Math.min(Math.max(page, 1), pageCount || 1)
    setCurrentPage((current) => (current === next ? current : next))
    if (mode !== 'single') {
      requestAnimationFrame(() => {
        document.getElementById(`pdf-page-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } else {
      // Em modo página única, sobe suavemente para o topo da nova página.
      requestAnimationFrame(() => {
        const top = contentRef.current?.getBoundingClientRect().top ?? 0
        if (top < 0) window.scrollTo({ top: window.scrollY + top - 12, behavior: 'smooth' })
      })
    }
  }, [mode, pageCount])

  const submitPageInput = () => {
    const next = Number.parseInt(pageInput, 10)
    if (Number.isFinite(next)) goToPage(next)
  }

  // Navegação por teclado: setas, PageUp/Down, Home/End. Ignora quando o foco
  // está em um campo de edição (anotações, input de página, etc).
  useEffect(() => {
    if (!access) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (
        target.closest('[data-pdf-editor="true"]') ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      )) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault(); goToPage(currentPage + 1); break
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault(); goToPage(currentPage - 1); break
        case 'Home':
          event.preventDefault(); goToPage(1); break
        case 'End':
          event.preventDefault(); goToPage(pageCount); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [access, currentPage, pageCount, goToPage])

  // Atalho unificado para abrir o painel lateral (miniaturas ou sumário):
  // em telas grandes garante a coluna visível; em telas menores abre o drawer.
  const openSidePanel = useCallback((tab: 'pages' | 'summary') => {
    setSidePanelTab(tab)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobilePanelOpen(true)
    } else {
      setShowThumbs(true)
    }
  }, [])

  const navigateTo = useCallback((page: number) => {
    goToPage(page)
    setMobilePanelOpen(false)
  }, [goToPage])

  const fitToWidth = useCallback(() => {
    const element = contentRef.current || viewerRef.current
    if (!element || !pageSize) return
    zoomTouchedRef.current = true
    const availableWidth = element.clientWidth - 24
    setZoom(clampZoom(availableWidth / pageSize.width, minZoom, maxZoom))
    setMode('width')
  }, [maxZoom, minZoom, pageSize])

  const fitToPage = useCallback(() => {
    const element = contentRef.current || viewerRef.current
    if (!element || !pageSize) return
    zoomTouchedRef.current = true
    const availableWidth = element.clientWidth - 24
    const availableHeight = window.innerHeight - 148
    setZoom(clampZoom(Math.min(availableWidth / pageSize.width, availableHeight / pageSize.height), minZoom, maxZoom))
    setMode('single')
  }, [maxZoom, minZoom, pageSize])

  const toggleFullScreen = async () => {
    const element = viewerRef.current
    if (!element) return
    if (!document.fullscreenElement) {
      await element.requestFullscreen().catch(() => {})
    } else {
      await document.exitFullscreen().catch(() => {})
    }
  }

  const createAnnotation = useCallback(async (annotation: Partial<PdfAnnotation>) => {
    const local = createEmptyAnnotation(annotation, materialId)
    setAnnotations((prev) => [...prev, local])

    try {
      const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotation),
      })
      if (!res.ok) throw new Error('create failed')
      const json = await res.json()
      setAnnotations((prev) => prev.map((item) => item.id === local.id ? json.annotation : item))
    } catch {
      setAnnotations((prev) => prev.filter((item) => item.id !== local.id))
      setNotice('Nao foi possivel salvar esta anotacao.')
    }
  }, [materialId])

  const updateAnnotation = useCallback(async (annotation: PdfAnnotation, patch: Partial<PdfAnnotation>) => {
    const previous = annotation
    const optimistic = { ...annotation, ...patch, data: { ...(annotation.data || {}), ...(patch.data || {}) } }
    setAnnotations((prev) => prev.map((item) => item.id === annotation.id ? optimistic : item))
    const annotationId = getPersistedAnnotationId(annotation)
    if (!annotationId) return

    try {
      const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...optimistic, id: annotationId }),
      })
      if (!res.ok) throw new Error('update failed')
      const json = await res.json()
      setAnnotations((prev) => prev.map((item) => item.id === annotation.id ? json.annotation : item))
    } catch {
      setAnnotations((prev) => prev.map((item) => item.id === annotation.id ? previous : item))
      setNotice('Nao foi possivel atualizar a anotacao.')
    }
  }, [materialId])

  const deleteAnnotation = useCallback(async (annotation: PdfAnnotation) => {
    setAnnotations((prev) => prev.filter((item) => item.id !== annotation.id))
    const annotationId = getPersistedAnnotationId(annotation)
    if (!annotationId) return

    try {
      const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations?id=${encodeURIComponent(annotationId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: annotationId, _id: annotationId }),
      })
      if (!res.ok) throw new Error('delete failed')
    } catch {
      setAnnotations((prev) => [...prev, annotation].sort((a, b) => a.pageNumber - b.pageNumber))
      setNotice('Nao foi possivel apagar a anotacao.')
    }
  }, [materialId])

  const deleteAllAnnotations = useCallback(async () => {
    if (!annotations.length) return
    const previous = annotations
    setAnnotations([])
    setShowDeleteAllConfirm(false)
    try {
      const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations?all=true`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('delete all failed')
    } catch {
      setAnnotations(previous)
      setNotice('Nao foi possivel apagar as anotacoes.')
    }
  }, [annotations, materialId])

  if (loading) {
    return <ViewerShell><ViewerLoading /></ViewerShell>
  }

  if (error || !access) {
    return (
      <ViewerShell>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-white/15 bg-white/10 p-6 text-center text-white shadow-2xl backdrop-blur-xl">
            <SearchX className="h-10 w-10 mx-auto mb-3 text-amber-200" />
            <h1 className="font-heading text-xl font-bold mb-2">PDF indisponivel</h1>
            <p className="text-sm text-white/70 mb-5">{error || 'Nao foi possivel carregar este material.'}</p>
            <Button onClick={() => router.push(`/materiais/${materialId}`)} className="rounded-xl bg-emerald-500 hover:bg-emerald-600">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao material
            </Button>
          </div>
        </div>
      </ViewerShell>
    )
  }

  return (
    <ViewerShell>
      <style jsx global>{`
        @keyframes pdfPageFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pdf-page-fade {
          animation: pdfPageFade 0.22s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .pdf-page-fade { animation: none; }
        }
        @media print {
          html, body {
            background: #000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          body::after {
            content: "Impressao nao autorizada - Material protegido por DomineAqui";
            visibility: visible !important;
            position: fixed;
            inset: 0;
            background: #000;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: sans-serif;
            font-size: 18px;
            text-align: center;
            padding: 24px;
            z-index: 2147483647;
          }
        }
      `}</style>
      {isPrinting ? (
        <div
          aria-hidden
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black text-center text-white"
          style={{ fontFamily: 'sans-serif' }}
        >
          <div className="px-6">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
            <p className="text-lg font-semibold">Impressao nao autorizada</p>
            <p className="mt-1 text-sm text-white/70">Este material e protegido. Tentativas de impressao ou captura sao registradas.</p>
          </div>
        </div>
      ) : null}
      <div
        ref={viewerRef}
        className="min-h-screen text-white select-none"
        style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'pan-x pan-y pinch-zoom' }}
      >
        <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/82 shadow-xl shadow-black/25 backdrop-blur-2xl">
          <div className="px-2 py-2 sm:px-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => router.push(`/materiais/${materialId}`)}
                className="h-10 w-10 shrink-0 rounded-xl text-white hover:bg-white/10 hover:text-white"
                title="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="min-w-36 flex-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300 shrink-0" />
                  <h1 className="truncate text-sm font-semibold sm:text-base">{access.material.title}</h1>
                </div>
                <p className="hidden text-[11px] text-emerald-100/60 sm:block">DomineAqui PDF Viewer protegido</p>
              </div>

              <ToolbarButton onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} title="Pagina anterior">
                <ChevronLeft className="h-4 w-4" />
              </ToolbarButton>
              <div className="flex h-10 shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-2">
                <input
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ''))}
                  onKeyDown={(event) => event.key === 'Enter' && submitPageInput()}
                  onBlur={submitPageInput}
                  className="w-10 bg-transparent text-center text-sm text-white outline-none"
                  inputMode="numeric"
                />
                <span className="text-xs text-white/55">/ {pageCount}</span>
              </div>
              <ToolbarButton onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pageCount} title="Proxima pagina">
                <ChevronRight className="h-4 w-4" />
              </ToolbarButton>

              <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/10 p-1 md:flex">
                <ToolbarButton compact onClick={() => { zoomTouchedRef.current = true; setZoom((z) => clampZoom(z - 0.12, minZoom, maxZoom)) }} title="Diminuir zoom">
                  <Minus className="h-4 w-4" />
                </ToolbarButton>
                <span className="min-w-12 text-center text-xs text-white/75">{Math.round(zoom * 100)}%</span>
                <ToolbarButton compact onClick={() => { zoomTouchedRef.current = true; setZoom((z) => clampZoom(z + 0.12, minZoom, maxZoom)) }} title="Aumentar zoom">
                  <Plus className="h-4 w-4" />
                </ToolbarButton>
              </div>

              <div className="hidden items-center gap-1 lg:flex">
                <ToolbarTextButton active={mode === 'single'} onClick={() => setMode('single')}>Pagina</ToolbarTextButton>
                <ToolbarTextButton active={mode === 'width'} onClick={fitToWidth}>Largura</ToolbarTextButton>
                <ToolbarTextButton active={mode === 'continuous'} onClick={() => setMode('continuous')}>Continuo</ToolbarTextButton>
              </div>

              <ToolbarButton onClick={toggleFullScreen} title="Tela cheia">
                <Maximize2 className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <ToolButton active={tool === 'cursor'} onClick={() => setTool('cursor')} title="Navegar">
                <MousePointer2 className="h-4 w-4" />
              </ToolButton>
              <ToolButton active={tool === 'highlight'} onClick={() => setTool('highlight')} title="Marca texto">
                <Highlighter className="h-4 w-4" />
              </ToolButton>
              <ToolButton active={tool === 'note'} onClick={() => setTool('note')} title="Nota">
                <MessageSquare className="h-4 w-4" />
              </ToolButton>
              <ToolButton active={tool === 'drawing'} onClick={() => setTool('drawing')} title="Caneta">
                <PenLine className="h-4 w-4" />
              </ToolButton>
              <ToolButton active={tool === 'text'} onClick={() => setTool('text')} title="Texto">
                <Type className="h-4 w-4" />
              </ToolButton>
              <ToolButton active={tool === 'bookmark'} onClick={() => setTool('bookmark')} title="Marcador">
                <Bookmark className="h-4 w-4" />
              </ToolButton>
              <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Apagar item">
                <Eraser className="h-4 w-4" />
              </ToolButton>

              <div className="mx-1 h-6 w-px shrink-0 bg-white/10" />
              <div className="flex items-center gap-1 md:hidden">
                <ToolButton active={false} onClick={() => { zoomTouchedRef.current = true; setZoom((z) => clampZoom(z - 0.12, minZoom, maxZoom)) }} title="Diminuir zoom">
                  <Minus className="h-4 w-4" />
                </ToolButton>
                <ToolButton active={false} onClick={() => { zoomTouchedRef.current = true; setZoom((z) => clampZoom(z + 0.12, minZoom, maxZoom)) }} title="Aumentar zoom">
                  <Plus className="h-4 w-4" />
                </ToolButton>
              </div>

              <div className="mx-1 h-6 w-px shrink-0 bg-white/10" />
              {hasSummary && (
                <ToolButton
                  active={mobilePanelOpen ? sidePanelTab === 'summary' : showThumbs && sidePanelTab === 'summary'}
                  onClick={() => openSidePanel('summary')}
                  title="Sumario"
                >
                  <List className="h-4 w-4" />
                </ToolButton>
              )}
              <ToolButton
                active={showThumbs || mobilePanelOpen}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setSidePanelTab('pages')
                    setMobilePanelOpen((value) => !value)
                  } else if (showThumbs && sidePanelTab === 'summary') {
                    // Painel já aberto noutra aba: troca para miniaturas em vez de fechar.
                    setSidePanelTab('pages')
                  } else {
                    setSidePanelTab('pages')
                    setShowThumbs((value) => !value)
                  }
                }}
                title="Miniaturas"
              >
                {showThumbs ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </ToolButton>
              <ToolButton active={showAnnotations} onClick={() => setShowAnnotations((value) => !value)} title="Painel de anotacoes">
                <StickyNote className="h-4 w-4" />
              </ToolButton>
              <ToolButton active={showGuide} onClick={() => setShowGuide((value) => !value)} title="Guia das ferramentas">
                <HelpCircle className="h-4 w-4" />
              </ToolButton>
              <Button onClick={fitToPage} className="h-10 shrink-0 rounded-xl border border-white/10 bg-white/10 px-3 text-xs text-white hover:bg-white/15">
                Ajustar
              </Button>
            </div>

            <ToolOptionsBar
              tool={tool}
              drawingStyle={drawingStyle}
              onDrawingStyleChange={setDrawingStyle}
              highlightColor={highlightColor}
              onHighlightColorChange={setHighlightColor}
              highlightWidth={highlightWidth}
              onHighlightWidthChange={setHighlightWidth}
              noteColor={noteColor}
              onNoteColorChange={setNoteColor}
              textStyle={textStyle}
              onTextStyleChange={setTextStyle}
            />

            {(navigation.length > 0 || coverPage) && (
              <div className="mt-1 flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {coverPage ? (
                  <button
                    type="button"
                    onClick={() => navigateTo(coverPage)}
                    className={`flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors ${
                      currentPage === coverPage
                        ? 'border-emerald-300/60 bg-emerald-400/25 text-white'
                        : 'border-white/10 bg-white/10 text-white/75 hover:bg-white/15'
                    }`}
                    title={`Capa (pag. ${coverPage})`}
                  >
                    <Bookmark className="h-3.5 w-3.5" /> Capa
                  </button>
                ) : null}
                {navigation.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => navigateTo(entry.page)}
                    className={`flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors ${
                      currentPage === entry.page
                        ? 'border-emerald-300/60 bg-emerald-400/25 text-white'
                        : 'border-white/10 bg-white/10 text-white/75 hover:bg-white/15'
                    }`}
                    title={`${entry.label} — pag. ${entry.page}`}
                  >
                    {entry.label}
                    <span className="text-white/45">{entry.page}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {notice && (
          <div className="fixed left-1/2 top-28 z-50 -translate-x-1/2 rounded-xl border border-amber-200/40 bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 shadow-xl">
            {notice}
          </div>
        )}

        <main className="grid grid-cols-1 gap-0 lg:grid-cols-[11.5rem_minmax(0,1fr)_22rem]">
          {showThumbs && (
            <aside className="hidden border-r border-white/10 bg-black/15 p-3 backdrop-blur-xl lg:sticky lg:top-[132px] lg:col-start-1 lg:block lg:h-[calc(100vh-132px)] lg:overflow-hidden">
              <SidePanel
                tab={sidePanelTab}
                onTabChange={setSidePanelTab}
                hasSummary={hasSummary}
                summary={summary}
                materialId={materialId}
                pageCount={pageCount}
                currentPage={currentPage}
                coverPage={coverPage}
                onGoTo={navigateTo}
              />
            </aside>
          )}

          <section
            ref={contentRef}
            className={`min-w-0 overflow-hidden px-2 py-4 sm:px-4 sm:py-7 ${
              showThumbs ? 'lg:col-start-2' : 'lg:col-start-1'
            } ${
              showAnnotations
                ? showThumbs ? '' : 'lg:col-span-2'
                : showThumbs ? 'lg:col-span-2' : 'lg:col-span-3'
            }`}
          >
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5">
              {pages.map((page) => (
                <PdfCanvasPage
                  key={`${page}-${mode}`}
                  materialId={materialId}
                  pageNumber={page}
                  active={page === currentPage}
                  zoom={zoom}
                  annotations={annotationsByPage.get(page) || []}
                  tool={tool}
                  drawingStyle={drawingStyle}
                  highlightColor={highlightColor}
                  highlightWidth={highlightWidth}
                  noteColor={noteColor}
                  textStyle={textStyle}
                  onPageFocus={handlePageFocused}
                  onPageSize={setPageSize}
                  fallbackSize={pageSize}
                  onPageCount={updateKnownPageCount}
                  onCreateAnnotation={createAnnotation}
                  onUpdateAnnotation={updateAnnotation}
                  onDeleteAnnotation={deleteAnnotation}
                />
              ))}
            </div>
          </section>

          {showAnnotations && (
            <AnnotationsPanel
              annotations={annotations}
              currentPage={currentPage}
              showGuide={showGuide}
              onGoTo={goToPage}
              onDelete={deleteAnnotation}
              onDeleteAll={() => setShowDeleteAllConfirm(true)}
            />
          )}
        </main>

        {/* Drawer lateral (miniaturas/sumário) para celulares e tablets */}
        {mobilePanelOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobilePanelOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col border-r border-white/10 bg-zinc-950/95 p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Navegação</span>
                <button
                  type="button"
                  onClick={() => setMobilePanelOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
                  title="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <SidePanel
                  tab={sidePanelTab}
                  onTabChange={setSidePanelTab}
                  hasSummary={hasSummary}
                  summary={summary}
                  materialId={materialId}
                  pageCount={pageCount}
                  currentPage={currentPage}
                  coverPage={coverPage}
                  onGoTo={navigateTo}
                />
              </div>
            </div>
          </div>
        )}

        {showDeleteAllConfirm && (
          <ConfirmDialog
            title="Apagar todas as anotacoes?"
            body="Isso remove grifos, notas, textos, desenhos e marcadores deste material."
            confirmLabel="Apagar tudo"
            onCancel={() => setShowDeleteAllConfirm(false)}
            onConfirm={deleteAllAnnotations}
          />
        )}
      </div>
    </ViewerShell>
  )
}

// ─── Painel lateral: miniaturas reais + sumário interativo ───────────────────
function SidePanel({
  tab,
  onTabChange,
  hasSummary,
  summary,
  materialId,
  pageCount,
  currentPage,
  coverPage,
  onGoTo,
}: {
  tab: 'pages' | 'summary'
  onTabChange: (tab: 'pages' | 'summary') => void
  hasSummary: boolean
  summary: SummaryEntry[]
  materialId: string
  pageCount: number
  currentPage: number
  coverPage?: number
  onGoTo: (page: number) => void
}) {
  const activeTab = !hasSummary ? 'pages' : tab

  return (
    <div className="flex h-full min-h-0 flex-col">
      {hasSummary && (
        <div className="mb-3 grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => onTabChange('pages')}
            className={`h-8 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'pages' ? 'bg-emerald-400/25 text-white' : 'text-white/65 hover:bg-white/10'
            }`}
          >
            Páginas
          </button>
          <button
            type="button"
            onClick={() => onTabChange('summary')}
            className={`h-8 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'summary' ? 'bg-emerald-400/25 text-white' : 'text-white/65 hover:bg-white/10'
            }`}
          >
            Sumário
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        {activeTab === 'summary' && hasSummary ? (
          <SummaryList summary={summary} currentPage={currentPage} onGoTo={onGoTo} />
        ) : (
          <div className="space-y-2">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <PdfThumbnail
                key={page}
                materialId={materialId}
                pageNumber={page}
                active={page === currentPage}
                isCover={page === coverPage}
                onClick={() => onGoTo(page)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryList({
  summary,
  currentPage,
  onGoTo,
}: {
  summary: SummaryEntry[]
  currentPage: number
  onGoTo: (page: number) => void
}) {
  // Entrada "ativa": a de maior página que ainda é <= página atual.
  let activeId = ''
  let bestPage = -1
  for (const entry of summary) {
    if (entry.page <= currentPage && entry.page > bestPage) {
      bestPage = entry.page
      activeId = entry.id
    }
  }

  return (
    <div className="space-y-1">
      {summary.map((entry) => {
        const level = Math.min(2, Math.max(0, entry.level || 0))
        const isActive = entry.id === activeId
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onGoTo(entry.page)}
            style={{ paddingLeft: `${0.5 + level * 0.85}rem` }}
            className={`flex w-full items-center gap-2 rounded-lg border py-2 pr-2 text-left transition-colors ${
              isActive
                ? 'border-emerald-300/50 bg-emerald-400/15 text-white'
                : 'border-transparent text-white/72 hover:border-white/10 hover:bg-white/5'
            }`}
          >
            <span className={`flex-1 truncate ${level === 0 ? 'text-[13px] font-semibold' : level === 1 ? 'text-xs' : 'text-[11px] text-white/60'}`}>
              {entry.title}
            </span>
            <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/65">
              {entry.page}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// Miniatura real: renderiza a página (lazy, via IntersectionObserver) no menor
// tamanho possível reaproveitando o cache de bytes do viewer principal.
function PdfThumbnail({
  materialId,
  pageNumber,
  active,
  isCover,
  onClick,
}: {
  materialId: string
  pageNumber: number
  active: boolean
  isCover?: boolean
  onClick: () => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderedRef = useRef(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    if (active) buttonRef.current?.scrollIntoView({ block: 'nearest' })
  }, [active])

  useEffect(() => {
    const element = buttonRef.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true)
          observer.disconnect()
        }
      },
      { rootMargin: '400px 0px' }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!shouldRender || renderedRef.current) return
    let cancelled = false
    let doc: any
    let renderTask: any

    async function renderThumb() {
      setStatus('loading')
      try {
        const { bytes } = await fetchPdfPageBytes(materialId, pageNumber)
        if (cancelled) return
        const pdfjs = await getPdfJs()
        doc = await pdfjs.getDocument({ data: bytes.slice() }).promise
        const page = await doc.getPage(1)
        const base = page.getViewport({ scale: 1 })
        const targetWidth = 150
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const scale = (targetWidth / base.width) * dpr
        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d', { alpha: false })
        if (!canvas || !context || cancelled) return
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = '100%'
        canvas.style.height = 'auto'
        renderTask = page.render({ canvasContext: context, viewport })
        await renderTask.promise
        if (!cancelled) {
          renderedRef.current = true
          setStatus('ready')
        }
      } catch (err: any) {
        if (!cancelled && err?.name !== 'RenderingCancelledException') setStatus('error')
      } finally {
        try { await doc?.destroy?.() } catch {}
      }
    }

    renderThumb()
    return () => {
      cancelled = true
      renderTask?.cancel?.()
      doc?.destroy?.()
    }
  }, [shouldRender, materialId, pageNumber])

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`w-full rounded-xl border p-1.5 text-left transition-colors ${
        active
          ? 'border-emerald-300/60 bg-emerald-400/20 text-white'
          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
      }`}
    >
      <div className="relative mb-1 aspect-[3/4] overflow-hidden rounded-lg bg-white/90 shadow-inner">
        <canvas ref={canvasRef} className={`h-full w-full object-contain ${status === 'ready' ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
        {status !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {status === 'error' ? (
              <span className="text-[10px] font-medium text-rose-500">erro</span>
            ) : (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-700/20 border-t-emerald-700" />
            )}
          </div>
        )}
        {isCover && (
          <span className="absolute left-1 top-1 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
            Capa
          </span>
        )}
      </div>
      <span className="text-[11px] font-medium">Pag. {pageNumber}</span>
    </button>
  )
}

function ViewerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(135deg,#061411_0%,#13251f_44%,#09090b_100%)]" />
      <div className="relative">{children}</div>
    </div>
  )
}

function ViewerLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-400/15">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-200/30 border-t-emerald-200" />
        </div>
        <div className="h-4 w-40 mx-auto rounded bg-white/20 animate-pulse" />
        <div className="mt-3 h-3 w-56 mx-auto rounded bg-white/10 animate-pulse" />
      </div>
    </div>
  )
}

function PdfCanvasPage({
  materialId,
  pageNumber,
  active,
  zoom,
  annotations,
  tool,
  drawingStyle,
  highlightColor,
  highlightWidth,
  noteColor,
  textStyle,
  onPageFocus,
  onPageSize,
  fallbackSize,
  onPageCount,
  onCreateAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: {
  materialId: string
  pageNumber: number
  active: boolean
  zoom: number
  annotations: PdfAnnotation[]
  tool: AnnotationTool
  drawingStyle: DrawingStyle
  highlightColor: string
  highlightWidth: number
  noteColor: string
  textStyle: TextStyle
  onPageFocus: (page: number) => void
  onPageSize: (size: PageSize) => void
  fallbackSize: PageSize | null
  onPageCount: (totalPages?: number) => void
  onCreateAnnotation: (annotation: Partial<PdfAnnotation>) => void
  onUpdateAnnotation: (annotation: PdfAnnotation, patch: Partial<PdfAnnotation>) => void
  onDeleteAnnotation: (annotation: PdfAnnotation) => void
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const draftCanvasRef = useRef<HTMLCanvasElement>(null)
  const interactionRef = useRef<{
    kind: 'drawing'
    startedAt: number
    draft: DrawingDraft
    pointerId: number
  } | {
    kind: 'highlight'
    draft: HighlightDraft
    pointerId: number
  } | null>(null)
  const rafRef = useRef<number | null>(null)
  const ignoreNextClickRef = useRef(false)
  const [visible, setVisible] = useState(active)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pageBytes, setPageBytes] = useState<Uint8Array | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [renderSize, setRenderSize] = useState<PageSize | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const requestedRef = useRef(false)
  const autoRetryRef = useRef(0)

  useEffect(() => {
    requestedRef.current = false
    autoRetryRef.current = 0
    setPageBytes(null)
    setError('')
    setRenderSize(null)
    setSelectedId(null)
    setEditor(null)
  }, [materialId, pageNumber])

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { rootMargin: '220px 0px' }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [pageNumber])

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onPageFocus(pageNumber)
      },
      { rootMargin: '-18% 0px -68% 0px', threshold: 0 }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [onPageFocus, pageNumber])

  useEffect(() => {
    if ((!visible && !active) || requestedRef.current || pageBytes) return
    let cancelled = false

    async function loadPageBytes() {
      requestedRef.current = true
      setLoading(true)
      setError('')
      try {
        const result = await fetchPdfPageBytes(materialId, pageNumber)
        if (!cancelled) {
          onPageCount(result.pageCount)
          setPageBytes(result.bytes)
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Pagina indisponivel')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPageBytes()
    return () => { cancelled = true }
  }, [active, loadAttempt, materialId, onPageCount, pageBytes, pageNumber, visible])

  useEffect(() => {
    const bytes = pageBytes
    if (!bytes) return
    let cancelled = false
    let renderTask: any
    let doc: any

    async function renderPage() {
      setLoading(true)
      setError('')
      try {
        const pdfjs = await getPdfJs()
        doc = await pdfjs.getDocument({ data: bytes!.slice() }).promise
        const page = await doc.getPage(1)
        const baseViewport = page.getViewport({ scale: 1 })
        onPageSize({ width: baseViewport.width, height: baseViewport.height })

        const isMobile = window.innerWidth < 768
        const maxDpr = active ? (isMobile ? 3 : 3.5) : (isMobile ? 2 : 2.5)
        const minDpr = active ? (isMobile ? 2 : 2.5) : (isMobile ? 1.5 : 2)
        const deviceDpr = window.devicePixelRatio || 1
        const dpr = Math.min(Math.max(deviceDpr, minDpr), maxDpr)
        const viewport = page.getViewport({ scale: zoom * dpr })
        const displayViewport = page.getViewport({ scale: zoom })
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d', { alpha: false })
        if (!canvas || !context || cancelled) return

        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = '100%'
        canvas.style.height = 'auto'
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'
        setRenderSize({ width: displayViewport.width, height: displayViewport.height })

        renderTask = page.render({ canvasContext: context, viewport })
        await renderTask.promise
      } catch (err: any) {
        if (!cancelled && err?.name !== 'RenderingCancelledException') {
          setError(err?.message || 'Pagina indisponivel')
        }
      } finally {
        try {
          await doc?.destroy?.()
        } catch {}
        if (!cancelled) setLoading(false)
      }
    }

    renderPage()
    return () => {
      cancelled = true
      renderTask?.cancel?.()
      doc?.destroy?.()
    }
  }, [active, onPageSize, pageBytes, zoom])

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    setEditor((current) => current?.kind === 'text'
      ? { ...current, textStyle: { ...textStyle } }
      : current
    )
  }, [textStyle])

  useEffect(() => {
    setEditor((current) => current?.kind === 'note' && !current.annotation
      ? { ...current, noteColor }
      : current
    )
  }, [noteColor])

  const retryLoad = () => {
    requestedRef.current = false
    setPageBytes(null)
    setRenderSize(null)
    setError('')
    setLoadAttempt((attempt) => attempt + 1)
  }

  // Auto-recuperação: se uma página falhar mesmo após os retries da requisição,
  // ela tenta sozinha mais 2 vezes antes de exibir o botão manual — assim o
  // usuário nunca precisa dar F5 para a página aparecer.
  useEffect(() => {
    if (!error || autoRetryRef.current >= 2) return
    const delay = 1000 * (autoRetryRef.current + 1)
    const timer = window.setTimeout(() => {
      autoRetryRef.current += 1
      requestedRef.current = false
      setPageBytes(null)
      setRenderSize(null)
      setError('')
      setLoadAttempt((attempt) => attempt + 1)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [error])

  useEffect(() => {
    if (pageBytes) autoRetryRef.current = 0
  }, [pageBytes])

  const pageFrameSize = renderSize ?? (fallbackSize
    ? { width: fallbackSize.width * zoom, height: fallbackSize.height * zoom }
    : { width: 595 * zoom, height: 842 * zoom })

  const getPosition = useCallback((clientX: number, clientY: number) => {
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
    }
  }, [])

  const prepareDraftCanvas = useCallback(() => {
    const canvas = draftCanvasRef.current
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!canvas || !rect) return null
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.floor(rect.width * dpr))
    const height = Math.max(1, Math.floor(rect.height * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    const context = canvas.getContext('2d')
    if (!context) return null
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, rect.width, rect.height)
    return { context, width: rect.width, height: rect.height }
  }, [])

  const clearDraftCanvas = useCallback(() => {
    const canvas = draftCanvasRef.current
    const rect = overlayRef.current?.getBoundingClientRect()
    const context = canvas?.getContext('2d')
    if (!canvas || !rect || !context) return
    context.clearRect(0, 0, rect.width, rect.height)
  }, [])

  const renderDraftOnCanvas = useCallback((interaction = interactionRef.current) => {
    if (!interaction) return
    const prepared = prepareDraftCanvas()
    if (!prepared) return
    const { context, width, height } = prepared

    if (interaction.kind === 'highlight') {
      const points = interaction.draft.points
      context.save()
      context.globalAlpha = 0.34
      context.globalCompositeOperation = 'multiply'
      context.strokeStyle = interaction.draft.color
      context.lineWidth = Math.max(4, width * interaction.draft.strokeWidthRatio)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      pointsToCanvasPath(context, points, width, height)
      context.stroke()
      context.restore()
      return
    }

    const draft = interaction.draft
    const mode = draft.mode
    context.save()
    context.globalAlpha = mode === 'marker' ? Math.min(draft.opacity, 0.52) : draft.opacity
    context.strokeStyle = draft.color
    context.lineWidth = Math.max(1, width * draft.strokeWidthRatio)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    if (mode === 'dash') context.setLineDash([8, 8])

    if (mode === 'circle') {
      const rect = normalizeRect(draft.start, draft.current, 0.025, 0.025)
      context.beginPath()
      context.ellipse(
        (rect.x + rect.width / 2) * width,
        (rect.y + rect.height / 2) * height,
        (rect.width / 2) * width,
        (rect.height / 2) * height,
        0,
        0,
        Math.PI * 2
      )
      context.stroke()
    } else if (mode === 'line' || mode === 'dash') {
      context.beginPath()
      context.moveTo(draft.start.x * width, draft.start.y * height)
      context.lineTo(draft.current.x * width, draft.current.y * height)
      context.stroke()
    } else {
      pointsToCanvasPath(context, draft.points, width, height)
      context.stroke()
    }
    context.restore()
  }, [prepareDraftCanvas])

  const scheduleDraftUpdate = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = window.requestAnimationFrame(() => {
      renderDraftOnCanvas()
      rafRef.current = null
    })
  }, [renderDraftOnCanvas])

  const addDrawingPoint = useCallback((point: PdfPoint) => {
    const interaction = interactionRef.current
    if (!interaction || interaction.kind !== 'drawing') return
    const points = interaction.draft.points
    const last = points[points.length - 1]
    const minStep = interaction.draft.mode === 'marker' ? 0.0024 : 0.0014
    if (last && distance(last, point) < minStep) return
    points.push(point)
    interaction.draft.current = point
  }, [])

  const finishDrawing = useCallback(() => {
    const interaction = interactionRef.current
    if (!interaction || interaction.kind !== 'drawing') return
    const draft = interaction.draft
    const durationMs = performance.now() - interaction.startedAt
    const resolvedMode = resolveDrawingMode(draft, durationMs)

    interactionRef.current = null
    clearDraftCanvas()

    const points = draft.points
    if (resolvedMode === 'circle') {
      const rect = draft.mode === 'circle'
        ? normalizeRect(draft.start, draft.current, 0.025, 0.025)
        : getPointBounds(points)
      if (rect.width < 0.015 || rect.height < 0.015) return
      onCreateAnnotation({
        pageNumber,
        type: 'drawing',
        content: 'Circulo',
        color: draft.color,
        position: rect,
        data: { drawingMode: 'circle', strokeWidthRatio: draft.strokeWidthRatio, opacity: draft.opacity },
      })
      return
    }

    if (resolvedMode === 'line' || resolvedMode === 'dash') {
      if (distance(draft.start, draft.current) < 0.01) return
      onCreateAnnotation({
        pageNumber,
        type: 'drawing',
        content: resolvedMode === 'dash' ? 'Linha tracejada' : 'Linha',
        color: draft.color,
        position: { points: [draft.start, draft.current] },
        data: { drawingMode: resolvedMode, strokeWidthRatio: draft.strokeWidthRatio, opacity: draft.opacity },
      })
      return
    }

    if (points.length < 3) return
    onCreateAnnotation({
      pageNumber,
      type: 'drawing',
      content: draft.mode === 'marker' ? 'Pincel' : 'Caneta',
      color: draft.color,
      position: { points },
      data: { drawingMode: draft.mode, strokeWidthRatio: draft.strokeWidthRatio, opacity: draft.opacity },
    })
  }, [clearDraftCanvas, onCreateAnnotation, pageNumber])

  const finishHighlight = useCallback(() => {
    const interaction = interactionRef.current
    if (!interaction || interaction.kind !== 'highlight') return
    interactionRef.current = null
    clearDraftCanvas()
    const points = interaction.draft.points
    const moved = distance(interaction.draft.start, interaction.draft.current)
    const position = points.length < 2 || moved < 0.01
      ? normalizeRect(interaction.draft.start, {
          x: Math.min(1, interaction.draft.start.x + 0.22),
          y: interaction.draft.start.y,
        }, 0.18, 0.028)
      : { points }
    onCreateAnnotation({
      pageNumber,
      type: 'highlight',
      content: 'Marca texto',
      color: interaction.draft.color,
      position,
      data: { opacity: 0.34, strokeWidthRatio: interaction.draft.strokeWidthRatio },
    })
  }, [clearDraftCanvas, onCreateAnnotation, pageNumber])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!renderSize || editor) return
    if (event.button !== 0 && event.pointerType !== 'touch' && event.pointerType !== 'pen') return

    if (tool === 'drawing') {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      const point = getPosition(event.clientX, event.clientY)
      const rect = overlayRef.current?.getBoundingClientRect()
      const widthRatio = drawingStyle.width / Math.max(rect?.width || 1, 1)
      clearDraftCanvas()
      interactionRef.current = {
        kind: 'drawing',
        startedAt: performance.now(),
        pointerId: event.pointerId,
        draft: {
          points: [point],
          mode: drawingStyle.mode,
          color: drawingStyle.color,
          strokeWidthRatio: widthRatio,
          opacity: drawingStyle.opacity,
          start: point,
          current: point,
          autoShape: drawingStyle.holdToShape,
        },
      }
      renderDraftOnCanvas(interactionRef.current)
      setSelectedId(null)
      return
    }

    if (tool === 'highlight') {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      const point = getPosition(event.clientX, event.clientY)
      const rect = overlayRef.current?.getBoundingClientRect()
      clearDraftCanvas()
      interactionRef.current = {
        kind: 'highlight',
        pointerId: event.pointerId,
        draft: {
          start: point,
          current: point,
          points: [point],
          strokeWidthRatio: highlightWidth / Math.max(rect?.width || 1, 1),
          color: highlightColor,
        },
      }
      renderDraftOnCanvas(interactionRef.current)
      setSelectedId(null)
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current
    if (!interaction) return
    event.preventDefault()

    if (interaction.kind === 'drawing') {
      const native = event.nativeEvent as PointerEvent & { getCoalescedEvents?: () => PointerEvent[] }
      const events = native.getCoalescedEvents?.() || [native]
      for (const pointerEvent of events) {
        addDrawingPoint(getPosition(pointerEvent.clientX, pointerEvent.clientY))
      }
      scheduleDraftUpdate()
      return
    }

    const point = getPosition(event.clientX, event.clientY)
    interaction.draft.current = point
    const points = interaction.draft.points
    const last = points[points.length - 1]
    if (!last || distance(last, point) >= 0.0015) points.push(point)
    scheduleDraftUpdate()
  }

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current
    if (!interaction) return
    event.preventDefault()
    ignoreNextClickRef.current = true
    window.setTimeout(() => { ignoreNextClickRef.current = false }, 0)
    try {
      event.currentTarget.releasePointerCapture(interaction.pointerId)
    } catch {}
    if (interaction.kind === 'drawing') finishDrawing()
    if (interaction.kind === 'highlight') finishHighlight()
  }

  const openTextEditor = (point: PdfPoint, annotation?: PdfAnnotation) => {
    setSelectedId(annotation?.id || null)
    setEditor({
      kind: 'text',
      point,
      annotation,
      content: annotation?.content || '',
      textStyle: {
        fontFamily: annotation?.data?.fontFamily || textStyle.fontFamily,
        fontSize: annotation?.data?.fontSize || textStyle.fontSize,
        color: annotation?.color || textStyle.color,
        bold: annotation?.data?.bold ?? textStyle.bold,
        italic: annotation?.data?.italic ?? textStyle.italic,
        underline: annotation?.data?.underline ?? textStyle.underline,
        align: annotation?.data?.align || textStyle.align,
      },
      noteColor,
    })
  }

  const openNoteEditor = (point: PdfPoint, annotation?: PdfAnnotation) => {
    setSelectedId(annotation?.id || null)
    setEditor({
      kind: 'note',
      point,
      annotation,
      content: annotation?.content || '',
      textStyle,
      noteColor: annotation?.color || annotation?.data?.noteColor || noteColor,
    })
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (ignoreNextClickRef.current || editor) {
      ignoreNextClickRef.current = false
      return
    }
    if (tool === 'cursor' || tool === 'drawing' || tool === 'highlight' || tool === 'eraser') {
      setSelectedId(null)
      return
    }

    const point = getPosition(event.clientX, event.clientY)
    if (tool === 'note') {
      openNoteEditor(point)
      return
    }
    if (tool === 'text') {
      openTextEditor(point)
      return
    }
    if (tool === 'bookmark') {
      onCreateAnnotation({
        pageNumber,
        type: 'bookmark',
        content: 'Marcador',
        color: '#10b981',
        position: { x: point.x, y: point.y, width: 0.05, height: 0.08 },
      })
    }
  }

  const saveEditor = (next: EditorState) => {
    const content = next.content.trim()
    if (!content) {
      setEditor(null)
      return
    }

    if (next.kind === 'note') {
      const patch = {
        pageNumber,
        type: 'note' as AnnotationType,
        content,
        color: next.noteColor,
        position: next.annotation?.position || { x: next.point.x, y: next.point.y, width: 0.11, height: 0.08 },
        data: { noteColor: next.noteColor },
      }
      if (next.annotation) onUpdateAnnotation(next.annotation, patch)
      else onCreateAnnotation(patch)
      setEditor(null)
      return
    }

    const lineCount = Math.max(1, content.split('\n').length)
    const textWidth = Math.min(0.52, Math.max(0.2, Math.min(36, content.length) * 0.009 + 0.1))
    const textHeight = Math.min(0.24, Math.max(0.045, lineCount * (next.textStyle.fontSize / 740) + 0.025))
    const patch = {
      pageNumber,
      type: 'text' as AnnotationType,
      content,
      color: next.textStyle.color,
      position: next.annotation?.position || { x: next.point.x, y: next.point.y, width: textWidth, height: textHeight },
      data: {
        fontFamily: next.textStyle.fontFamily,
        fontSize: next.textStyle.fontSize,
        bold: next.textStyle.bold,
        italic: next.textStyle.italic,
        underline: next.textStyle.underline,
        align: next.textStyle.align,
      },
    }
    if (next.annotation) onUpdateAnnotation(next.annotation, patch)
    else onCreateAnnotation(patch)
    setEditor(null)
  }

  const selectedAnnotation = selectedId ? annotations.find((annotation) => annotation.id === selectedId) || null : null
  const annotationPointerEvents = tool === 'drawing' || tool === 'highlight' ? 'none' : 'auto'

  return (
    <div id={`pdf-page-${pageNumber}`} ref={wrapperRef} className="pdf-page-fade flex w-full scroll-mt-36 justify-center px-0 sm:px-2">
      <div
        className="relative max-w-full overflow-hidden rounded-xl border border-white/15 bg-white/10 p-2 shadow-2xl shadow-black/35 backdrop-blur-sm"
        style={{ width: Math.ceil(pageFrameSize.width + 16) }}
      >
        <div className="absolute left-3 top-3 z-10 rounded-lg border border-zinc-200/30 bg-zinc-950/65 px-2 py-1 text-[11px] font-semibold text-zinc-50 backdrop-blur-md">
          Pag. {pageNumber}
        </div>
        <canvas
          ref={canvasRef}
          className="block h-auto w-full rounded-lg bg-white"
          style={{ aspectRatio: `${Math.max(1, pageFrameSize.width)} / ${Math.max(1, pageFrameSize.height)}` }}
        />
        {((!renderSize && (visible || active)) || loading) && (
          <div className="absolute inset-2 rounded-lg bg-white/90 flex items-center justify-center">
            <div className="h-7 w-7 rounded-full border-2 border-emerald-700/20 border-t-emerald-700 animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-2 z-20 rounded-lg bg-rose-950/85 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white">
            <span>{error}</span>
            <Button onClick={retryLoad} className="h-8 rounded-xl bg-white/15 px-3 text-xs text-white hover:bg-white/25">
              Tentar novamente
            </Button>
          </div>
        )}
        {!error && renderSize && (
          <div
            ref={overlayRef}
            className="absolute inset-2 rounded-lg"
            onClick={handleOverlayClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            style={{
              cursor: tool === 'cursor' ? 'default' : tool === 'eraser' ? ERASER_CURSOR : tool === 'drawing' ? 'crosshair' : 'copy',
              touchAction: tool === 'drawing' || tool === 'highlight' ? 'none' : 'manipulation',
            }}
          >
            <canvas ref={draftCanvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />
            <AnnotationOverlay
              annotations={annotations}
              selectedAnnotation={selectedAnnotation}
              tool={tool}
              pointerEvents={annotationPointerEvents}
              onSelect={(annotation) => setSelectedId(annotation.id)}
              onEdit={(annotation) => {
                const bounds = getAnnotationBounds(annotation)
                if (annotation.type === 'text') openTextEditor({ x: bounds.x, y: bounds.y }, annotation)
                if (annotation.type === 'note') openNoteEditor({ x: bounds.x, y: bounds.y }, annotation)
              }}
              onDelete={onDeleteAnnotation}
            />
            {editor && (
              <InlineAnnotationEditor
                editor={editor}
                onChange={setEditor}
                onCancel={() => setEditor(null)}
                onSave={saveEditor}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AnnotationOverlay({
  annotations,
  selectedAnnotation,
  tool,
  pointerEvents,
  onSelect,
  onEdit,
  onDelete,
}: {
  annotations: PdfAnnotation[]
  selectedAnnotation: PdfAnnotation | null
  tool: AnnotationTool
  pointerEvents: 'none' | 'auto'
  onSelect: (annotation: PdfAnnotation) => void
  onEdit: (annotation: PdfAnnotation) => void
  onDelete: (annotation: PdfAnnotation) => void
}) {
  return (
    <>
      {annotations.map((annotation) => (
        <AnnotationItem
          key={annotation.id}
          annotation={annotation}
          selected={selectedAnnotation?.id === annotation.id}
          tool={tool}
          pointerEvents={pointerEvents}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {selectedAnnotation && (
        <AnnotationActionBar
          annotation={selectedAnnotation}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  )
}

function AnnotationItem({
  annotation,
  selected,
  tool,
  pointerEvents,
  onSelect,
  onEdit,
  onDelete,
}: {
  annotation: PdfAnnotation
  selected: boolean
  tool: AnnotationTool
  pointerEvents: 'none' | 'auto'
  onSelect: (annotation: PdfAnnotation) => void
  onEdit: (annotation: PdfAnnotation) => void
  onDelete: (annotation: PdfAnnotation) => void
}) {
  const position = annotation.position || {}
  const bounds = getAnnotationBounds(annotation)
  const sharedHandlers = {
    onPointerDown: (event: React.PointerEvent) => event.stopPropagation(),
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation()
      if (tool === 'eraser') {
        onDelete(annotation)
        return
      }
      if ((annotation.type === 'text' || annotation.type === 'note') && event.detail >= 2) {
        onEdit(annotation)
        return
      }
      onSelect(annotation)
    },
  }

  if (annotation.type === 'drawing') {
    return (
      <>
        <DrawingLayer annotation={annotation} />
        <button
          type="button"
          aria-label="Selecionar desenho"
          className={`absolute rounded-md ${selected ? 'border border-emerald-400/80 ring-2 ring-emerald-300/50' : ''}`}
          style={{
            pointerEvents,
            left: `${bounds.x * 100}%`,
            top: `${bounds.y * 100}%`,
            width: `${Math.max(bounds.width, 0.045) * 100}%`,
            height: `${Math.max(bounds.height, 0.045) * 100}%`,
            background: 'transparent',
          }}
          {...sharedHandlers}
        />
      </>
    )
  }

  if (annotation.type === 'highlight') {
    if (position.points?.length) {
      return (
        <>
          <HighlightLayer annotation={annotation} />
          <button
            type="button"
            title="Marca texto"
            className={`absolute rounded-md ${selected ? 'border border-emerald-400/80 ring-2 ring-emerald-300/50' : ''}`}
            style={{
              pointerEvents,
              left: `${bounds.x * 100}%`,
              top: `${bounds.y * 100}%`,
              width: `${Math.max(bounds.width, 0.08) * 100}%`,
              height: `${Math.max(bounds.height, 0.035) * 100}%`,
              background: 'transparent',
            }}
            {...sharedHandlers}
          />
        </>
      )
    }

    return (
      <button
        type="button"
        title="Marca texto"
        className={`absolute rounded-md border transition-colors ${
          selected ? 'border-emerald-400/90 ring-2 ring-emerald-300/50' : 'border-yellow-500/20'
        }`}
        style={{
          pointerEvents,
          left: `${(position.x || 0) * 100}%`,
          top: `${(position.y || 0) * 100}%`,
          width: `${(position.width || 0.08) * 100}%`,
          height: `${(position.height || 0.035) * 100}%`,
          backgroundColor: annotation.color || '#facc15',
          opacity: annotation.data?.opacity || 0.34,
          mixBlendMode: 'multiply',
        }}
        {...sharedHandlers}
      />
    )
  }

  if (annotation.type === 'note') {
    return (
      <button
        type="button"
        className={`absolute flex min-h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-xl border px-2 py-1 text-left text-[11px] font-semibold text-zinc-900 shadow-lg transition-transform ${
          selected ? 'scale-105 border-emerald-500 ring-2 ring-emerald-300/60' : 'border-amber-500/40'
        }`}
        style={{
          pointerEvents,
          left: `${(position.x || 0) * 100}%`,
          top: `${(position.y || 0) * 100}%`,
          backgroundColor: annotation.color || annotation.data?.noteColor || '#fde68a',
          maxWidth: '13rem',
        }}
        title={annotation.content}
        {...sharedHandlers}
      >
        <MessageSquare className="h-4 w-4 shrink-0" />
        <span className="hidden max-w-[9rem] truncate sm:inline">{annotation.content || 'Nota'}</span>
      </button>
    )
  }

  if (annotation.type === 'bookmark') {
    return (
      <button
        type="button"
        className={`absolute -translate-x-1/2 -translate-y-1/2 text-emerald-600 drop-shadow ${
          selected ? 'rounded-lg ring-2 ring-emerald-300/80' : ''
        }`}
        style={{
          pointerEvents,
          left: `${(position.x || 0) * 100}%`,
          top: `${(position.y || 0) * 100}%`,
        }}
        title="Marcador"
        {...sharedHandlers}
      >
        <Bookmark className="h-8 w-8 fill-emerald-400" />
      </button>
    )
  }

  const style = annotation.data || {}
  return (
    <button
      type="button"
      className={`absolute rounded-md border bg-white/75 px-2 py-1 text-left shadow-sm backdrop-blur-[1px] ${
        selected ? 'border-emerald-500 ring-2 ring-emerald-300/60' : 'border-zinc-900/15'
      }`}
      style={{
        pointerEvents,
        left: `${bounds.x * 100}%`,
        top: `${bounds.y * 100}%`,
        width: `${bounds.width * 100}%`,
        minHeight: `${bounds.height * 100}%`,
        color: annotation.color || '#111827',
        fontFamily: style.fontFamily || 'Inter',
        fontSize: `${style.fontSize || 16}px`,
        fontWeight: style.bold ? 800 : 500,
        fontStyle: style.italic ? 'italic' : 'normal',
        textDecoration: style.underline ? 'underline' : 'none',
        textAlign: style.align || 'left',
        lineHeight: 1.22,
        whiteSpace: 'pre-wrap',
      }}
      title="Duplo toque para editar"
      {...sharedHandlers}
    >
      {annotation.content}
    </button>
  )
}

function HighlightLayer({ annotation }: { annotation: PdfAnnotation }) {
  const points = annotation.position.points || []
  if (points.length < 2) return null
  const strokeWidth = `${((annotation.data?.strokeWidthRatio || 0.018) * 100).toFixed(3)}`
  return (
    <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d={pointsToSvgPath(points)}
        fill="none"
        stroke={annotation.color || '#facc15'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={annotation.data?.opacity || 0.34}
        style={{ mixBlendMode: 'multiply' }}
      />
    </svg>
  )
}

function DrawingLayer({ annotation, isDraft }: { annotation: PdfAnnotation; isDraft?: boolean }) {
  const points = annotation.position.points || []
  const mode = annotation.data?.drawingMode || 'free'
  const strokeWidth = `${((annotation.data?.strokeWidthRatio || 0.0048) * 100).toFixed(3)}`
  const opacity = annotation.data?.opacity ?? (mode === 'marker' ? 0.45 : 0.88)
  const dashArray = mode === 'dash' ? '3 3' : undefined
  const common = {
    fill: 'none',
    stroke: annotation.color || '#22c55e',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    opacity: isDraft ? Math.min(1, opacity + 0.08) : opacity,
  }

  if (mode === 'circle') {
    const bounds = getAnnotationBounds(annotation)
    return (
      <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <ellipse
          cx={(bounds.x + bounds.width / 2) * 100}
          cy={(bounds.y + bounds.height / 2) * 100}
          rx={(bounds.width / 2) * 100}
          ry={(bounds.height / 2) * 100}
          {...common}
        />
      </svg>
    )
  }

  if (points.length < 2) return null
  return (
    <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d={pointsToSvgPath(points)} strokeDasharray={dashArray} {...common} />
    </svg>
  )
}

function AnnotationActionBar({
  annotation,
  onEdit,
  onDelete,
}: {
  annotation: PdfAnnotation
  onEdit: (annotation: PdfAnnotation) => void
  onDelete: (annotation: PdfAnnotation) => void
}) {
  const bounds = getAnnotationBounds(annotation)
  const left = Math.min(0.86, Math.max(0.04, bounds.x + bounds.width))
  const top = Math.max(0.02, bounds.y - 0.055)
  const canEdit = annotation.type === 'text' || annotation.type === 'note'

  return (
    <div
      className="absolute z-30 flex items-center gap-1 rounded-xl border border-zinc-900/15 bg-zinc-950/88 p-1 text-white shadow-xl backdrop-blur-md"
      style={{ left: `${left * 100}%`, top: `${top * 100}%`, transform: 'translateX(-100%)' }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {canEdit && (
        <button
          type="button"
          className="h-8 rounded-lg px-2 text-xs font-semibold hover:bg-white/10"
          onClick={() => onEdit(annotation)}
        >
          Editar
        </button>
      )}
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-200 hover:bg-rose-500/20 hover:text-rose-100"
        onClick={() => onDelete(annotation)}
        title="Apagar anotacao"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function InlineAnnotationEditor({
  editor,
  onChange,
  onCancel,
  onSave,
}: {
  editor: EditorState
  onChange: (editor: EditorState) => void
  onCancel: () => void
  onSave: (editor: EditorState) => void
}) {
  const isRightSide = editor.point.x > 0.62
  const isLowerSide = editor.point.y > 0.68
  const isText = editor.kind === 'text'

  return (
    <div
      data-pdf-editor="true"
      className={`absolute z-40 text-zinc-950 shadow-xl ${
        isText
          ? 'w-[min(18rem,calc(100%-1rem))] rounded-md border border-emerald-500/70 bg-white/60 p-1 backdrop-blur-[1px]'
          : 'w-[min(17rem,calc(100%-1rem))] rounded-xl border border-amber-500/35 p-2'
      }`}
      style={{
        left: `${editor.point.x * 100}%`,
        top: `${editor.point.y * 100}%`,
        transform: `${isRightSide ? 'translateX(-100%)' : 'translateX(0)'} ${isLowerSide ? 'translateY(-100%)' : 'translateY(0)'}`,
        backgroundColor: isText ? 'rgba(255,255,255,0.62)' : editor.noteColor,
      }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {!isText && (
        <div className="mb-2 flex items-center gap-1.5">
          {NOTE_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...editor, noteColor: color })}
              className={`h-7 w-7 rounded-lg border ${editor.noteColor === color ? 'border-zinc-950 ring-2 ring-zinc-300' : 'border-zinc-200'}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}

      <div className="absolute -right-1 -top-9 flex items-center gap-1 rounded-lg border border-zinc-900/10 bg-zinc-950/90 p-1 text-white shadow-lg">
        <button type="button" onClick={() => onSave(editor)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-emerald-500/25" title="Salvar">
          <Check className="h-4 w-4" />
        </button>
        <button type="button" onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10" title="Fechar sem salvar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <textarea
        autoFocus
        value={editor.content}
        onChange={(event) => onChange({ ...editor, content: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel()
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') onSave(editor)
        }}
        placeholder={isText ? 'Digite aqui...' : 'Escreva sua nota...'}
        className={`w-full resize-none border-0 bg-transparent p-1 outline-none ${
          isText ? 'min-h-14' : 'min-h-24 rounded-lg bg-white/30'
        }`}
        style={isText ? {
          color: editor.textStyle.color,
          fontFamily: editor.textStyle.fontFamily,
          fontSize: editor.textStyle.fontSize,
          fontWeight: editor.textStyle.bold ? 800 : 500,
          fontStyle: editor.textStyle.italic ? 'italic' : 'normal',
          textDecoration: editor.textStyle.underline ? 'underline' : 'none',
          textAlign: editor.textStyle.align,
        } : {
          color: '#1f2937',
          fontSize: 14,
          lineHeight: 1.35,
        }}
      />
    </div>
  )
}

function ToolOptionsBar({
  tool,
  drawingStyle,
  onDrawingStyleChange,
  highlightColor,
  onHighlightColorChange,
  highlightWidth,
  onHighlightWidthChange,
  noteColor,
  onNoteColorChange,
  textStyle,
  onTextStyleChange,
}: {
  tool: AnnotationTool
  drawingStyle: DrawingStyle
  onDrawingStyleChange: (style: DrawingStyle) => void
  highlightColor: string
  onHighlightColorChange: (color: string) => void
  highlightWidth: number
  onHighlightWidthChange: (width: number) => void
  noteColor: string
  onNoteColorChange: (color: string) => void
  textStyle: TextStyle
  onTextStyleChange: (style: TextStyle) => void
}) {
  if (!['drawing', 'highlight', 'text', 'note'].includes(tool)) return null

  return (
    <div className="mt-1 flex items-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-white/10 px-2 py-2">
      {tool === 'drawing' && (
        <>
          <div className="flex shrink-0 items-center gap-1">
            <MiniModeButton active={drawingStyle.mode === 'free'} onClick={() => onDrawingStyleChange({ ...drawingStyle, mode: 'free' })} title="Caneta livre">
              <PenLine className="h-4 w-4" />
            </MiniModeButton>
            <MiniModeButton active={drawingStyle.mode === 'marker'} onClick={() => onDrawingStyleChange({ ...drawingStyle, mode: 'marker', opacity: 0.45 })} title="Pincel marcador">
              <Brush className="h-4 w-4" />
            </MiniModeButton>
            <MiniModeButton active={drawingStyle.mode === 'line'} onClick={() => onDrawingStyleChange({ ...drawingStyle, mode: 'line' })} title="Linha reta">
              <Minus className="h-4 w-4" />
            </MiniModeButton>
            <MiniModeButton active={drawingStyle.mode === 'dash'} onClick={() => onDrawingStyleChange({ ...drawingStyle, mode: 'dash' })} title="Linha tracejada">
              <span className="h-px w-5 border-t-2 border-dashed border-current" />
            </MiniModeButton>
            <MiniModeButton active={drawingStyle.mode === 'circle'} onClick={() => onDrawingStyleChange({ ...drawingStyle, mode: 'circle' })} title="Circulo">
              <Circle className="h-4 w-4" />
            </MiniModeButton>
          </div>
          <ColorSwatches colors={COLOR_SWATCHES} value={drawingStyle.color} onChange={(color) => onDrawingStyleChange({ ...drawingStyle, color })} />
          <LabeledRange label="Grossura" min={1} max={18} value={drawingStyle.width} onChange={(value) => onDrawingStyleChange({ ...drawingStyle, width: value })} />
          <LabeledRange label="Opacidade" min={25} max={100} value={Math.round(drawingStyle.opacity * 100)} onChange={(value) => onDrawingStyleChange({ ...drawingStyle, opacity: value / 100 })} />
          <label className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-white/75">
            <input
              type="checkbox"
              checked={drawingStyle.holdToShape}
              onChange={(event) => onDrawingStyleChange({ ...drawingStyle, holdToShape: event.target.checked })}
              className="accent-emerald-400"
            />
            Segurar ajusta forma
          </label>
        </>
      )}

      {tool === 'highlight' && (
        <>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white/75"><Highlighter className="h-4 w-4" /> Marca texto</span>
          <ColorSwatches colors={HIGHLIGHT_SWATCHES} value={highlightColor} onChange={onHighlightColorChange} />
          <LabeledRange label="Espessura" min={8} max={48} value={highlightWidth} onChange={onHighlightWidthChange} />
        </>
      )}

      {tool === 'note' && (
        <>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white/75"><MessageSquare className="h-4 w-4" /> Nota</span>
          <ColorSwatches colors={NOTE_SWATCHES} value={noteColor} onChange={onNoteColorChange} />
        </>
      )}

      {tool === 'text' && (
        <>
          <select
            value={textStyle.fontFamily}
            onChange={(event) => onTextStyleChange({ ...textStyle, fontFamily: event.target.value })}
            className="h-8 shrink-0 rounded-lg border border-white/10 bg-zinc-900 px-2 text-xs text-white outline-none"
          >
            {FONT_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}
          </select>
          <LabeledRange label="Tamanho" min={10} max={34} value={textStyle.fontSize} onChange={(value) => onTextStyleChange({ ...textStyle, fontSize: value })} />
          <ColorSwatches colors={COLOR_SWATCHES} value={textStyle.color} onChange={(color) => onTextStyleChange({ ...textStyle, color })} />
          <MiniModeButton active={textStyle.bold} onClick={() => onTextStyleChange({ ...textStyle, bold: !textStyle.bold })} title="Negrito">
            <Bold className="h-4 w-4" />
          </MiniModeButton>
          <MiniModeButton active={textStyle.italic} onClick={() => onTextStyleChange({ ...textStyle, italic: !textStyle.italic })} title="Italico">
            <Italic className="h-4 w-4" />
          </MiniModeButton>
          <MiniModeButton active={textStyle.underline} onClick={() => onTextStyleChange({ ...textStyle, underline: !textStyle.underline })} title="Sublinhado">
            <Underline className="h-4 w-4" />
          </MiniModeButton>
        </>
      )}
    </div>
  )
}

function ColorSwatches({ colors, value, onChange }: { colors: string[]; value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Palette className="h-4 w-4 text-white/55" />
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`h-7 w-7 rounded-lg border ${value === color ? 'border-white ring-2 ring-white/40' : 'border-white/20'}`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 w-8 rounded-lg border border-white/20 bg-transparent p-0.5"
        title="Cor personalizada"
      />
    </div>
  )
}

function LabeledRange({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (value: number) => void }) {
  return (
    <label className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-white/75">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-24 accent-emerald-400"
      />
      <span className="min-w-6 text-right text-white/85">{value}</span>
    </label>
  )
}

function MiniModeButton({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-white transition-colors ${
        active ? 'border-emerald-300/60 bg-emerald-400/25' : 'border-white/10 bg-white/10 hover:bg-white/15'
      }`}
    >
      {children}
    </button>
  )
}

function AnnotationsPanel({
  annotations,
  currentPage,
  showGuide,
  onGoTo,
  onDelete,
  onDeleteAll,
}: {
  annotations: PdfAnnotation[]
  currentPage: number
  showGuide: boolean
  onGoTo: (page: number) => void
  onDelete: (annotation: PdfAnnotation) => void
  onDeleteAll: () => void
}) {
  return (
    <aside className="overflow-y-auto border-t border-white/10 bg-black/20 p-3 backdrop-blur-xl lg:sticky lg:top-[132px] lg:col-start-3 lg:h-[calc(100vh-132px)] lg:border-l lg:border-t-0">
      {showGuide && <ToolGuide />}

      <div className="mb-3 mt-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">Anotacoes</h2>
          <p className="text-[11px] text-white/55">{annotations.length} privadas neste material</p>
        </div>
        <Button onClick={onDeleteAll} disabled={!annotations.length} size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-white/70 hover:bg-white/10 hover:text-white" title="Deletar todas">
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {annotations.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            Use uma ferramenta e toque no PDF para criar sua primeira anotacao.
          </div>
        ) : (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={`rounded-xl border p-3 transition-colors ${
                annotation.pageNumber === currentPage
                  ? 'border-emerald-300/50 bg-emerald-400/15'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <button onClick={() => onGoTo(annotation.pageNumber)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-100">Pagina {annotation.pageNumber}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/65">{annotationLabel(annotation.type)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-white/75">{annotation.content || 'Sem texto'}</p>
              </button>
              <div className="mt-2 flex justify-end">
                <Button onClick={() => onDelete(annotation)} variant="ghost" className="h-8 rounded-lg px-2 text-xs text-rose-200 hover:bg-rose-500/20 hover:text-rose-100">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Apagar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}

function ToolGuide() {
  const guideItems = [
    { icon: <MousePointer2 className="h-4 w-4" />, title: 'Navegar', text: 'Move pelo PDF, seleciona anotacoes e abre editar com duplo toque em textos e notas.' },
    { icon: <Highlighter className="h-4 w-4" />, title: 'Marca texto', text: 'Arraste para grifar uma area. Um toque cria um grifo rapido na linha.' },
    { icon: <PenLine className="h-4 w-4" />, title: 'Caneta', text: 'Desenhe com mouse, dedo ou Apple Pencil. Escolha cor, grossura, pincel, linha, tracejado ou circulo.' },
    { icon: <Type className="h-4 w-4" />, title: 'Texto', text: 'Toque no PDF e escreva direto na pagina com fonte, tamanho, cor, negrito, italico e sublinhado.' },
    { icon: <MessageSquare className="h-4 w-4" />, title: 'Nota', text: 'Cria um post-it visual com cores. Toque duas vezes na nota para editar.' },
    { icon: <Eraser className="h-4 w-4" />, title: 'Apagar', text: 'Ative e toque em qualquer anotacao para remover individualmente, ou use o botao do painel.' },
  ]

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-emerald-200" />
        <h2 className="text-sm font-semibold text-white">Guia rapido</h2>
      </div>
      <div className="space-y-2">
        {guideItems.map((item) => (
          <div key={item.title} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2 rounded-lg bg-black/10 p-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-emerald-100">
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{item.title}</p>
              <p className="text-[11px] leading-snug text-white/60">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  body: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-white/15 bg-zinc-950 p-4 text-white shadow-2xl">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-200">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">{title}</h2>
            <p className="mt-1 text-sm text-white/62">{body}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-9 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/80 hover:bg-white/10">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700">
            <Trash2 className="h-3.5 w-3.5" /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  title,
  compact,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title: string
  compact?: boolean
}) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${compact ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl'} shrink-0 border border-white/10 bg-white/10 text-white hover:bg-white/15 hover:text-white disabled:opacity-40`}
    >
      {children}
    </Button>
  )
}

function ToolButton({ children, active, onClick, title }: { children: React.ReactNode; active: boolean; onClick: () => void; title: string }) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      title={title}
      className={`h-10 w-10 shrink-0 rounded-xl border text-white hover:text-white ${
        active ? 'border-emerald-300/50 bg-emerald-400/25' : 'border-white/10 bg-white/10 hover:bg-white/15'
      }`}
    >
      {children}
    </Button>
  )
}

function ToolbarTextButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 rounded-xl border px-3 text-xs font-semibold transition-colors ${
        active ? 'border-emerald-300/50 bg-emerald-400/25 text-white' : 'border-white/10 bg-white/10 text-white/70 hover:bg-white/15'
      }`}
    >
      {children}
    </button>
  )
}
