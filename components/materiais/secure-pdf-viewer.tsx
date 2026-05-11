'use client'

import type * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  FileText,
  Highlighter,
  Maximize2,
  MessageSquare,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Plus,
  SearchX,
  ShieldCheck,
  StickyNote,
  Trash2,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type ViewerMode = 'single' | 'width' | 'continuous'
type AnnotationTool = 'cursor' | 'highlight' | 'note' | 'bookmark' | 'text' | 'drawing'

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
  }
}

interface PdfAnnotation {
  _id: string
  id: string
  userId: string
  materialId: string
  pageNumber: number
  type: AnnotationTool
  position: { x?: number; y?: number; width?: number; height?: number; points?: { x: number; y: number }[] }
  content: string
  color: string
  data?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface PageSize {
  width: number
  height: number
}

let pdfWorkerConfigured = false

async function getPdfJs() {
  const pdfjsLib = await import('pdfjs-dist')
  if (!pdfWorkerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
    pdfWorkerConfigured = true
  }
  return pdfjsLib
}

function clampZoom(value: number, min = 0.55, max = 2.6) {
  return Math.min(max, Math.max(min, Number(value.toFixed(2))))
}

function buildPageArray(total: number, current: number, mode: ViewerMode) {
  if (mode === 'single') {
    return [current]
  }
  return Array.from({ length: total }, (_, index) => index + 1)
}

export function SecurePdfViewer({ materialId }: { materialId: string }) {
  const router = useRouter()
  const viewerRef = useRef<HTMLDivElement>(null)
  const [access, setAccess] = useState<ViewerAccess | null>(null)
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [zoom, setZoom] = useState(1)
  const [mode, setMode] = useState<ViewerMode>('continuous')
  const [tool, setTool] = useState<AnnotationTool>('cursor')
  const [pageSize, setPageSize] = useState<PageSize | null>(null)
  const [showThumbs, setShowThumbs] = useState(true)
  const [showAnnotations, setShowAnnotations] = useState(true)

  const minZoom = access?.viewer.minZoom ?? 0.55
  const maxZoom = access?.viewer.maxZoom ?? 2.6
  const pageCount = access?.material.pageCount ?? 0
  const pages = useMemo(() => buildPageArray(pageCount, currentPage, mode), [pageCount, currentPage, mode])

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
        setMode(json.viewer?.defaultMode || 'continuous')
        await loadAnnotations()
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
    const block = (event: Event) => event.preventDefault()
    const blockKeys = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && ['c', 'p', 's', 'u', 'a'].includes(key)) {
        event.preventDefault()
      }
    }
    document.addEventListener('contextmenu', block)
    document.addEventListener('copy', block)
    document.addEventListener('cut', block)
    document.addEventListener('keydown', blockKeys)
    return () => {
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('copy', block)
      document.removeEventListener('cut', block)
      document.removeEventListener('keydown', blockKeys)
    }
  }, [])

  const goToPage = useCallback((page: number) => {
    const next = Math.min(Math.max(page, 1), pageCount || 1)
    setCurrentPage(next)
    if (mode !== 'single') {
      requestAnimationFrame(() => {
        document.getElementById(`pdf-page-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [mode, pageCount])

  const submitPageInput = () => {
    const next = Number.parseInt(pageInput, 10)
    if (Number.isFinite(next)) goToPage(next)
  }

  const fitToWidth = useCallback(() => {
    if (!viewerRef.current || !pageSize) return
    const availableWidth = viewerRef.current.clientWidth - 36
    setZoom(clampZoom(availableWidth / pageSize.width, minZoom, maxZoom))
    setMode('width')
  }, [maxZoom, minZoom, pageSize])

  const fitToPage = useCallback(() => {
    if (!viewerRef.current || !pageSize) return
    const availableWidth = viewerRef.current.clientWidth - 42
    const availableHeight = window.innerHeight - 132
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
    const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annotation),
    })
    if (!res.ok) return
    const json = await res.json()
    setAnnotations((prev) => [...prev, json.annotation])
  }, [materialId])

  const updateAnnotation = useCallback(async (annotation: PdfAnnotation, patch: Partial<PdfAnnotation>) => {
    const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...annotation, ...patch, id: annotation.id }),
    })
    if (!res.ok) return
    const json = await res.json()
    setAnnotations((prev) => prev.map((item) => item.id === annotation.id ? json.annotation : item))
  }, [materialId])

  const deleteAnnotation = useCallback(async (annotation: PdfAnnotation) => {
    if (!confirm('Deletar esta anotacao?')) return
    const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations?id=${annotation.id}`, {
      method: 'DELETE',
    })
    if (res.ok) setAnnotations((prev) => prev.filter((item) => item.id !== annotation.id))
  }, [materialId])

  const deleteAllAnnotations = useCallback(async () => {
    if (!annotations.length || !confirm('Deletar todas as suas anotacoes deste material?')) return
    const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations?all=true`, {
      method: 'DELETE',
    })
    if (res.ok) setAnnotations([])
  }, [annotations.length, materialId])

  if (loading) {
    return <ViewerShell><ViewerLoading /></ViewerShell>
  }

  if (error || !access) {
    return (
      <ViewerShell>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 text-center text-white shadow-2xl">
            <SearchX className="h-10 w-10 mx-auto mb-3 text-amber-200" />
            <h1 className="font-heading text-xl font-bold mb-2">PDF indisponivel</h1>
            <p className="text-sm text-white/70 mb-5">{error || 'Nao foi possivel carregar este material.'}</p>
            <Button onClick={() => router.push(`/materiais/${materialId}`)} className="rounded-2xl bg-emerald-500 hover:bg-emerald-600">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao material
            </Button>
          </div>
        </div>
      </ViewerShell>
    )
  }

  return (
    <ViewerShell>
      <div
        ref={viewerRef}
        className="min-h-screen text-white select-none"
        style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'pan-x pan-y pinch-zoom' }}
      >
        <header className="sticky top-0 z-40 border-b border-white/10 bg-emerald-950/70 backdrop-blur-2xl shadow-2xl shadow-emerald-950/40">
          <div className="px-3 sm:px-4 py-2.5 flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => router.push(`/materiais/${materialId}`)}
              className="h-10 w-10 rounded-2xl text-white hover:bg-white/10 hover:text-white"
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300 shrink-0" />
                <h1 className="truncate text-sm sm:text-base font-semibold">{access.material.title}</h1>
              </div>
              <p className="hidden sm:block text-[11px] text-emerald-100/60">DomineAqui PDF Viewer protegido</p>
            </div>

            <ToolbarButton onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} title="Pagina anterior">
              <ChevronLeft className="h-4 w-4" />
            </ToolbarButton>
            <div className="hidden xs:flex items-center gap-1 rounded-2xl border border-white/10 bg-white/10 px-2 h-10">
              <input
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ''))}
                onKeyDown={(event) => event.key === 'Enter' && submitPageInput()}
                onBlur={submitPageInput}
                className="w-10 bg-transparent text-center text-sm outline-none text-white"
                inputMode="numeric"
              />
              <span className="text-xs text-white/55">/ {pageCount}</span>
            </div>
            <ToolbarButton onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pageCount} title="Proxima pagina">
              <ChevronRight className="h-4 w-4" />
            </ToolbarButton>

            <div className="hidden md:flex items-center gap-1 rounded-2xl border border-white/10 bg-white/10 p-1">
              <ToolbarButton compact onClick={() => setZoom((z) => clampZoom(z - 0.12, minZoom, maxZoom))} title="Diminuir zoom">
                <Minus className="h-4 w-4" />
              </ToolbarButton>
              <span className="min-w-12 text-center text-xs text-white/75">{Math.round(zoom * 100)}%</span>
              <ToolbarButton compact onClick={() => setZoom((z) => clampZoom(z + 0.12, minZoom, maxZoom))} title="Aumentar zoom">
                <Plus className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              <ToolbarTextButton active={mode === 'single'} onClick={() => setMode('single')}>Pagina</ToolbarTextButton>
              <ToolbarTextButton active={mode === 'width'} onClick={fitToWidth}>Largura</ToolbarTextButton>
              <ToolbarTextButton active={mode === 'continuous'} onClick={() => setMode('continuous')}>Continuo</ToolbarTextButton>
            </div>

            <ToolbarButton onClick={toggleFullScreen} title="Tela cheia">
              <Maximize2 className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <div className="px-3 sm:px-4 pb-2 flex items-center gap-1 overflow-x-auto">
            <ToolButton active={tool === 'cursor'} onClick={() => setTool('cursor')} title="Navegar">
              <FileText className="h-4 w-4" />
            </ToolButton>
            <ToolButton active={tool === 'highlight'} onClick={() => setTool('highlight')} title="Grifo">
              <Highlighter className="h-4 w-4" />
            </ToolButton>
            <ToolButton active={tool === 'note'} onClick={() => setTool('note')} title="Nota">
              <MessageSquare className="h-4 w-4" />
            </ToolButton>
            <ToolButton active={tool === 'drawing'} onClick={() => setTool('drawing')} title="Desenho livre">
              <PenLine className="h-4 w-4" />
            </ToolButton>
            <ToolButton active={tool === 'bookmark'} onClick={() => setTool('bookmark')} title="Marcador">
              <Bookmark className="h-4 w-4" />
            </ToolButton>
            <ToolButton active={tool === 'text'} onClick={() => setTool('text')} title="Texto curto">
              <Type className="h-4 w-4" />
            </ToolButton>
            <div className="h-6 w-px bg-white/10 mx-1" />
            <ToolButton active={showThumbs} onClick={() => setShowThumbs((value) => !value)} title="Miniaturas">
              {showThumbs ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </ToolButton>
            <ToolButton active={showAnnotations} onClick={() => setShowAnnotations((value) => !value)} title="Anotacoes">
              <StickyNote className="h-4 w-4" />
            </ToolButton>
            <Button onClick={fitToPage} className="h-9 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs">
              Ajustar
            </Button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-0">
          {showThumbs && (
            <aside className="hidden lg:block sticky top-[92px] h-[calc(100vh-92px)] w-28 overflow-y-auto border-r border-white/10 bg-black/15 backdrop-blur-xl p-3">
              <div className="space-y-2">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-full rounded-xl border p-2 text-left transition-all ${
                      page === currentPage
                        ? 'border-emerald-300/60 bg-emerald-400/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-white/80 to-emerald-50/80 mb-1 shadow-inner" />
                    <span className="text-[11px] font-medium">Pag. {page}</span>
                  </button>
                ))}
              </div>
            </aside>
          )}

          <section className="min-w-0 px-2 sm:px-4 py-5 sm:py-7">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-5">
              {pages.map((page) => (
                <PdfCanvasPage
                  key={`${page}-${mode}`}
                  materialId={materialId}
                  pageNumber={page}
                  active={mode === 'single' || Math.abs(page - currentPage) <= 2}
                  zoom={zoom}
                  annotations={annotations.filter((annotation) => annotation.pageNumber === page)}
                  tool={tool}
                  onVisible={() => mode !== 'single' && setCurrentPage(page)}
                  onPageSize={setPageSize}
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
              onGoTo={goToPage}
              onDelete={deleteAnnotation}
              onDeleteAll={deleteAllAnnotations}
            />
          )}
        </main>
      </div>
    </ViewerShell>
  )
}

function ViewerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#031b16]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.28),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(214,176,82,0.18),transparent_30%),linear-gradient(135deg,#021410_0%,#073526_48%,#041b17_100%)]" />
      <div className="relative">{children}</div>
    </div>
  )
}

function ViewerLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 shadow-2xl">
        <div className="mx-auto mb-4 h-12 w-12 rounded-2xl border border-emerald-300/30 bg-emerald-400/15 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-200/30 border-t-emerald-200 animate-spin" />
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
  onVisible,
  onPageSize,
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
  onVisible: () => void
  onPageSize: (size: PageSize) => void
  onCreateAnnotation: (annotation: Partial<PdfAnnotation>) => void
  onUpdateAnnotation: (annotation: PdfAnnotation, patch: Partial<PdfAnnotation>) => void
  onDeleteAnnotation: (annotation: PdfAnnotation) => void
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(active)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [renderSize, setRenderSize] = useState<PageSize | null>(null)
  const drawingRef = useRef<{ pageNumber: number; points: { x: number; y: number }[] } | null>(null)
  const [draftPoints, setDraftPoints] = useState<{ x: number; y: number }[]>([])

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          onVisible()
        }
      },
      { rootMargin: '700px 0px' }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [onVisible])

  useEffect(() => {
    if (!visible && !active) return
    let cancelled = false
    let renderTask: any

    async function renderPage() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(
          `/api/materiais/${materialId}/pdf-viewer/page?page=${pageNumber}`,
          { cache: 'no-store' }
        )
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Falha ao carregar pagina')
        }
        const data = await response.arrayBuffer()
        const pdfjs = await getPdfJs()
        const doc = await pdfjs.getDocument({ data }).promise
        const page = await doc.getPage(1)
        const baseViewport = page.getViewport({ scale: 1 })
        onPageSize({ width: baseViewport.width, height: baseViewport.height })

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const viewport = page.getViewport({ scale: zoom * dpr })
        const displayViewport = page.getViewport({ scale: zoom })
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d', { alpha: false })
        if (!canvas || !context || cancelled) return

        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = `${displayViewport.width}px`
        canvas.style.height = `${displayViewport.height}px`
        setRenderSize({ width: displayViewport.width, height: displayViewport.height })

        renderTask = page.render({ canvasContext: context, viewport })
        await renderTask.promise
        await doc.destroy()
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Pagina indisponivel')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    renderPage()
    return () => {
      cancelled = true
      renderTask?.cancel?.()
    }
  }, [active, materialId, onPageSize, pageNumber, visible, zoom])

  const getPosition = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    }
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'cursor' || tool === 'drawing') return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))

    if (tool === 'note') {
      const content = prompt('Digite sua nota:')
      if (!content) return
      onCreateAnnotation({ pageNumber, type: 'note', content, color: '#f8c152', position: { x, y, width: 0.08, height: 0.08 } })
    }
    if (tool === 'highlight') {
      onCreateAnnotation({ pageNumber, type: 'highlight', content: 'Grifo', color: '#facc15', position: { x: Math.max(0, x - 0.16), y: Math.max(0, y - 0.015), width: 0.32, height: 0.035 } })
    }
    if (tool === 'bookmark') {
      onCreateAnnotation({ pageNumber, type: 'bookmark', content: 'Marcador', color: '#10b981', position: { x, y, width: 0.05, height: 0.08 } })
    }
    if (tool === 'text') {
      const content = prompt('Texto curto:')
      if (!content) return
      onCreateAnnotation({ pageNumber, type: 'text', content, color: '#10b981', position: { x, y, width: 0.2, height: 0.05 } })
    }
  }

  const startDrawing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (tool !== 'drawing') return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = getPosition(event)
    drawingRef.current = { pageNumber, points: [point] }
    setDraftPoints([point])
  }

  const moveDrawing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (tool !== 'drawing' || !drawingRef.current) return
    const point = getPosition(event)
    drawingRef.current.points.push(point)
    setDraftPoints([...drawingRef.current.points])
  }

  const finishDrawing = () => {
    if (tool !== 'drawing' || !drawingRef.current) return
    const points = drawingRef.current.points
    drawingRef.current = null
    setDraftPoints([])
    if (points.length < 3) return
    onCreateAnnotation({
      pageNumber,
      type: 'drawing',
      content: 'Desenho livre',
      color: '#22c55e',
      position: { points },
    })
  }

  return (
    <div id={`pdf-page-${pageNumber}`} ref={wrapperRef} className="w-full scroll-mt-32 flex justify-center">
      <div
        className="relative rounded-2xl border border-white/15 bg-white/8 p-2 shadow-2xl shadow-black/35 backdrop-blur-sm"
        style={{ maxWidth: '100%', overflow: 'hidden' }}
      >
        <div className="absolute left-3 top-3 z-10 rounded-full border border-emerald-200/20 bg-emerald-950/65 px-2 py-1 text-[11px] font-semibold text-emerald-50 backdrop-blur-md">
          Pag. {pageNumber}
        </div>
        <canvas ref={canvasRef} className="block rounded-xl bg-white" />
        {(!renderSize || loading) && (
          <div className="absolute inset-2 rounded-xl bg-white/90 flex items-center justify-center">
            <div className="h-7 w-7 rounded-full border-2 border-emerald-700/20 border-t-emerald-700 animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-2 rounded-xl bg-rose-950/85 flex items-center justify-center p-6 text-center text-sm text-white">
            {error}
          </div>
        )}
        {renderSize && (
          <div
            className="absolute inset-2 rounded-xl"
            onClick={handleOverlayClick}
            onPointerDown={startDrawing}
            onPointerMove={moveDrawing}
            onPointerUp={finishDrawing}
            onPointerCancel={finishDrawing}
            style={{ cursor: tool === 'cursor' ? 'default' : tool === 'drawing' ? 'crosshair' : 'copy' }}
          >
            <AnnotationOverlay
              annotations={annotations}
              draftPoints={draftPoints}
              onUpdate={onUpdateAnnotation}
              onDelete={onDeleteAnnotation}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function AnnotationOverlay({
  annotations,
  draftPoints,
  onUpdate,
  onDelete,
}: {
  annotations: PdfAnnotation[]
  draftPoints: { x: number; y: number }[]
  onUpdate: (annotation: PdfAnnotation, patch: Partial<PdfAnnotation>) => void
  onDelete: (annotation: PdfAnnotation) => void
}) {
  return (
    <>
      {annotations.map((annotation) => {
        const position = annotation.position || {}
        const style = {
          left: `${(position.x || 0) * 100}%`,
          top: `${(position.y || 0) * 100}%`,
          width: `${(position.width || 0.08) * 100}%`,
          height: `${(position.height || 0.05) * 100}%`,
        }

        if (annotation.type === 'drawing') {
          const points = position.points || []
          const line = points.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')
          return (
            <svg key={annotation.id} className="absolute inset-0 h-full w-full overflow-visible pointer-events-none">
              <polyline points={line} fill="none" stroke={annotation.color || '#22c55e'} strokeWidth="0.45%" strokeLinecap="round" strokeLinejoin="round" opacity="0.82" />
            </svg>
          )
        }

        if (annotation.type === 'highlight') {
          return (
            <button
              key={annotation.id}
              title="Duplo clique para remover"
              onDoubleClick={(event) => { event.stopPropagation(); onDelete(annotation) }}
              className="absolute rounded-md border border-yellow-400/40 bg-yellow-300/35 mix-blend-multiply"
              style={style}
            />
          )
        }

        if (annotation.type === 'note') {
          return (
            <button
              key={annotation.id}
              onDoubleClick={(event) => {
                event.stopPropagation()
                const content = prompt('Editar nota:', annotation.content)
                if (content !== null) onUpdate(annotation, { content })
              }}
              className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-300/70 bg-amber-300/90 text-amber-950 shadow-lg"
              style={{ left: style.left, top: style.top }}
              title={annotation.content}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )
        }

        if (annotation.type === 'bookmark') {
          return (
            <button
              key={annotation.id}
              onDoubleClick={(event) => { event.stopPropagation(); onDelete(annotation) }}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-emerald-600 drop-shadow"
              style={{ left: style.left, top: style.top }}
              title="Marcador"
            >
              <Bookmark className="h-8 w-8 fill-emerald-400" />
            </button>
          )
        }

        return (
          <button
            key={annotation.id}
            onDoubleClick={(event) => {
              event.stopPropagation()
              const content = prompt('Editar texto:', annotation.content)
              if (content !== null) onUpdate(annotation, { content })
            }}
            className="absolute rounded-lg border border-emerald-400/50 bg-emerald-50/85 px-2 py-1 text-left text-xs font-semibold text-emerald-950 shadow"
            style={style}
            title="Duplo clique para editar"
          >
            {annotation.content}
          </button>
        )
      })}
      {draftPoints.length > 1 && (
        <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none">
          <polyline
            points={draftPoints.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')}
            fill="none"
            stroke="#22c55e"
            strokeWidth="0.45%"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.82"
          />
        </svg>
      )}
    </>
  )
}

function AnnotationsPanel({
  annotations,
  currentPage,
  onGoTo,
  onDelete,
  onDeleteAll,
}: {
  annotations: PdfAnnotation[]
  currentPage: number
  onGoTo: (page: number) => void
  onDelete: (annotation: PdfAnnotation) => void
  onDeleteAll: () => void
}) {
  return (
    <aside className="lg:sticky lg:top-[92px] lg:h-[calc(100vh-92px)] lg:w-80 overflow-y-auto border-t lg:border-l lg:border-t-0 border-white/10 bg-black/20 backdrop-blur-xl p-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Anotacoes</h2>
          <p className="text-[11px] text-white/55">{annotations.length} privadas neste material</p>
        </div>
        <Button onClick={onDeleteAll} disabled={!annotations.length} size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" title="Deletar todas">
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {annotations.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            Use as ferramentas de grifo, nota, desenho, marcador ou texto para criar anotacoes.
          </div>
        ) : (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={`rounded-2xl border p-3 transition-colors ${
                annotation.pageNumber === currentPage
                  ? 'border-emerald-300/50 bg-emerald-400/15'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <button onClick={() => onGoTo(annotation.pageNumber)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-100">Pagina {annotation.pageNumber}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/65">{annotation.type}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-white/75">{annotation.content || 'Sem texto'}</p>
              </button>
              <div className="mt-2 flex justify-end">
                <Button onClick={() => onDelete(annotation)} variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-rose-200 hover:text-rose-100 hover:bg-rose-500/20">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
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
      className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} rounded-2xl border border-white/10 bg-white/8 text-white hover:bg-white/15 hover:text-white disabled:opacity-40`}
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
      className={`h-9 w-9 shrink-0 rounded-xl border text-white hover:text-white ${
        active ? 'border-emerald-300/50 bg-emerald-400/25' : 'border-white/10 bg-white/8 hover:bg-white/15'
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
        active ? 'border-emerald-300/50 bg-emerald-400/25 text-white' : 'border-white/10 bg-white/8 text-white/70 hover:bg-white/15'
      }`}
    >
      {children}
    </button>
  )
}
