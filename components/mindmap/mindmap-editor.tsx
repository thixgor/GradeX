'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, Trash2, Undo2, Redo2, ZoomIn, ZoomOut, Save, Download,
  Play, Settings2, X, Palette, Crosshair, LayoutGrid, ChevronLeft, ChevronRight, Check,
  Loader2, ShieldCheck, Lock, Globe, EyeOff, Link2, GitBranch,
  Pencil, Copy, ClipboardPaste, CornerDownRight, Shapes, Smile, Spline,
  Minus, Wand2, Sparkles, Highlighter, UserPlus, Users, Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MindMapNode, MindMapVisibility, MindMapStyle, MindMapEdgeStyle, MindMapCollaborator } from '@/lib/types'
import { getTheme, resolveStyle, idealTextColor, MINDMAP_THEMES } from '@/lib/mindmap-themes'

export interface EditorMap {
  _id: string
  slug?: string
  title: string
  description?: string
  tags?: string[]
  nodes: MindMapNode[]
  style?: MindMapStyle
  visibility: MindMapVisibility
  hasPassword?: boolean
  isPublished?: boolean
  likeCount?: number
  viewCount?: number
  ownerName?: string
  updatedAt?: string
  collaborators?: MindMapCollaborator[]
}

interface EditorAccess {
  canEdit: boolean
  canDelete: boolean
  isOwner: boolean
  isAdmin: boolean
  isCollaborator?: boolean
}

const EMOJIS = ['💡', '⭐', '✅', '❗', '📌', '🔥', '🎯', '📚', '🧠', '❤️', '⚠️', '🚀', '💰', '📈', '🔑', '❓', '✏️', '📝', '⏰', '🏆']

const SHAPES: { v: MindMapNode['shape']; label: string }[] = [
  { v: 'rounded', label: 'Arredondado' },
  { v: 'pill', label: 'Pílula' },
  { v: 'rect', label: 'Retângulo' },
  { v: 'ellipse', label: 'Elipse' },
]

const uid = () => Math.random().toString(36).slice(2, 9)
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

// Largura estimada de um nó (para o auto-layout) — o render real é auto.
function estimateWidth(text: string) {
  return clamp(60 + (text?.length || 0) * 8, 90, 260)
}

/** Caminho SVG de uma conexão, conforme o estilo escolhido. */
function edgePath(fx: number, fy: number, tx: number, ty: number, style: MindMapEdgeStyle): string {
  const midX = (fx + tx) / 2
  if (style === 'straight') return `M ${fx} ${fy} L ${tx} ${ty}`
  if (style === 'stepped') return `M ${fx} ${fy} L ${midX} ${fy} L ${midX} ${ty} L ${tx} ${ty}`
  return `M ${fx} ${fy} C ${midX} ${fy}, ${midX} ${ty}, ${tx} ${ty}`
}

/** Profundidade (distância até a raiz) de cada nó. */
function computeDepthMap(nodes: MindMapNode[]): Map<string, number> {
  const map = new Map(nodes.map(n => [n.id, n]))
  const d = new Map<string, number>()
  const calc = (id: string): number => {
    if (d.has(id)) return d.get(id)!
    const n = map.get(id)
    if (!n || n.parentId === null || !map.has(n.parentId)) { d.set(id, 0); return 0 }
    const v = calc(n.parentId) + 1
    d.set(id, v); return v
  }
  nodes.forEach(n => calc(n.id))
  return d
}

/** Conjunto de nós escondidos por colapso de ancestrais. */
function computeHidden(nodes: MindMapNode[]): Set<string> {
  const hidden = new Set<string>()
  for (const n of nodes) {
    if (n.collapsed) {
      const stack = nodes.filter(c => c.parentId === n.id)
      while (stack.length) {
        const c = stack.pop()!
        hidden.add(c.id)
        stack.push(...nodes.filter(x => x.parentId === c.id))
      }
    }
  }
  return hidden
}

/** Layout em árvore horizontal (tidy tree). Reposiciona todos os nós. */
function autoLayout(nodes: MindMapNode[]): MindMapNode[] {
  const byParent = new Map<string | null, MindMapNode[]>()
  for (const n of nodes) {
    const key = n.parentId
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(n)
  }
  const positions = new Map<string, { x: number; y: number }>()
  const X_GAP = 220
  const Y_GAP = 70
  let cursorY = 0

  function place(node: MindMapNode, depth: number): number {
    const children = byParent.get(node.id) || []
    if (children.length === 0) {
      const y = cursorY
      cursorY += Y_GAP
      positions.set(node.id, { x: depth * X_GAP, y })
      return y
    }
    const childYs = children.map(c => place(c, depth + 1))
    const y = (childYs[0] + childYs[childYs.length - 1]) / 2
    positions.set(node.id, { x: depth * X_GAP, y })
    return y
  }

  const roots = byParent.get(null) || []
  for (const root of roots) {
    place(root, 0)
    cursorY += Y_GAP // separa árvores distintas
  }

  return nodes.map(n => {
    const p = positions.get(n.id)
    return p ? { ...n, x: p.x, y: p.y } : n
  })
}

export function MindMapEditor({
  initialMap,
  access,
  onBack,
}: {
  initialMap: EditorMap
  access: EditorAccess
  onBack?: () => void
}) {
  const canEdit = access.canEdit
  const [nodes, setNodes] = useState<MindMapNode[]>(initialMap.nodes.length ? initialMap.nodes : [{ id: 'root', parentId: null, text: initialMap.title, x: 0, y: 0 }])
  const [selectedId, setSelectedId] = useState<string | null>(nodes[0]?.id || null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  // Estilo/aparência do mapa.
  const [style, setStyle] = useState<MindMapStyle>(() => resolveStyle(initialMap.style))
  const theme = getTheme(style.theme)

  // Histórico (undo/redo)
  const [history, setHistory] = useState<MindMapNode[][]>([])
  const [future, setFuture] = useState<MindMapNode[][]>([])

  // Transform do canvas
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const [scale, setScale] = useState(1)

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [dirty, setDirty] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showStyle, setShowStyle] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [presentStep, setPresentStep] = useState(0)
  const [editingTitle, setEditingTitle] = useState(false)

  // Caneta laser estilo GoodNotes: só desenha enquanto segura; o rastro some.
  const [laserOn, setLaserOn] = useState(false)
  const [laserPoints, setLaserPoints] = useState<{ id: number; x: number; y: number }[]>([])
  const [laserHead, setLaserHead] = useState<{ x: number; y: number } | null>(null)
  const laserSeq = useRef(0)
  const laserDown = useRef(false)

  // Tempo real / colaboração.
  const [collaborators, setCollaborators] = useState<MindMapCollaborator[]>(initialMap.collaborators || [])
  const [liveMsg, setLiveMsg] = useState('')
  const serverUpdatedAt = useRef<number>(initialMap.updatedAt ? new Date(initialMap.updatedAt).getTime() : 0)
  const [meta, setMeta] = useState({
    title: initialMap.title,
    description: initialMap.description || '',
    tags: (initialMap.tags || []).join(', '),
    visibility: initialMap.visibility as MindMapVisibility,
    password: '',
    hasPassword: !!initialMap.hasPassword,
  })

  // Menu de contexto (botão direito / toque longo).
  const [menu, setMenu] = useState<{ x: number; y: number; nodeId: string | null; worldX: number; worldY: number } | null>(null)
  const [menuSection, setMenuSection] = useState<null | 'color' | 'shape' | 'icon'>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const dragNode = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)
  const pinchStart = useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(null)
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clipboard = useRef<MindMapNode[] | null>(null)
  const [hasClipboard, setHasClipboard] = useState(false)
  const titleBeforeEdit = useRef('')
  const nodesRef = useRef(nodes)
  nodesRef.current = nodes
  const styleRef = useRef(style)
  styleRef.current = style
  const editingIdRef = useRef(editingId)
  editingIdRef.current = editingId
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty
  const presentingRef = useRef(presenting)
  presentingRef.current = presenting

  // ---- mutações com histórico ----
  const commit = useCallback((updater: (prev: MindMapNode[]) => MindMapNode[]) => {
    if (!canEdit) return
    setNodes(prev => {
      setHistory(h => [...h.slice(-49), prev])
      setFuture([])
      setDirty(true)
      return updater(prev)
    })
  }, [canEdit])

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setFuture(f => [nodesRef.current, ...f].slice(0, 50))
      setNodes(prev)
      setDirty(true)
      return h.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f
      const next = f[0]
      setHistory(h => [...h, nodesRef.current].slice(-50))
      setNodes(next)
      setDirty(true)
      return f.slice(1)
    })
  }, [])

  // ---- operações de nó ----
  const addChild = useCallback((parentId: string) => {
    const parent = nodesRef.current.find(n => n.id === parentId)
    if (!parent) return
    const siblings = nodesRef.current.filter(n => n.parentId === parentId)
    const id = uid()
    const newNode: MindMapNode = {
      id,
      parentId,
      text: 'Novo nó',
      x: parent.x + 200,
      y: parent.y + siblings.length * 70,
      color: parent.color,
    }
    commit(prev => [...prev, newNode])
    setSelectedId(id)
    setTimeout(() => beginEdit(id), 0)
  }, [commit])

  const addSibling = useCallback((nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId)
    if (!node) return
    if (node.parentId === null) { addChild(nodeId); return }
    const id = uid()
    const newNode: MindMapNode = {
      id,
      parentId: node.parentId,
      text: 'Novo nó',
      x: node.x,
      y: node.y + 70,
      color: node.color,
    }
    commit(prev => [...prev, newNode])
    setSelectedId(id)
    setTimeout(() => beginEdit(id), 0)
  }, [commit, addChild])

  const addRootAt = useCallback((x: number, y: number) => {
    const id = uid()
    commit(prev => [...prev, { id, parentId: null, text: 'Novo nó', x: Math.round(x), y: Math.round(y) }])
    setSelectedId(id)
    setTimeout(() => beginEdit(id), 0)
  }, [commit])

  const deleteNode = useCallback((nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId)
    if (!node) return
    // não deixa apagar a única raiz
    const rootCount = nodesRef.current.filter(n => n.parentId === null).length
    if (node.parentId === null && rootCount <= 1) return
    // remove o nó e toda a subárvore
    const toRemove = new Set<string>([nodeId])
    let changed = true
    while (changed) {
      changed = false
      for (const n of nodesRef.current) {
        if (n.parentId && toRemove.has(n.parentId) && !toRemove.has(n.id)) {
          toRemove.add(n.id); changed = true
        }
      }
    }
    commit(prev => prev.filter(n => !toRemove.has(n.id)))
    setSelectedId(null)
  }, [commit])

  const updateNode = useCallback((nodeId: string, patch: Partial<MindMapNode>) => {
    commit(prev => prev.map(n => (n.id === nodeId ? { ...n, ...patch } : n)))
  }, [commit])

  // ---- copiar / colar / duplicar ----
  const collectSubtree = useCallback((nodeId: string): MindMapNode[] => {
    const all = nodesRef.current
    const ids = new Set<string>([nodeId])
    let changed = true
    while (changed) {
      changed = false
      for (const n of all) {
        if (n.parentId && ids.has(n.parentId) && !ids.has(n.id)) { ids.add(n.id); changed = true }
      }
    }
    return all.filter(n => ids.has(n.id)).map(n => ({ ...n }))
  }, [])

  const copyNode = useCallback((nodeId: string) => {
    clipboard.current = collectSubtree(nodeId)
    setHasClipboard(true)
  }, [collectSubtree])

  const pasteSubtree = useCallback((opts: { parentId?: string | null; x?: number; y?: number; clip?: MindMapNode[] }) => {
    const clip = opts.clip || clipboard.current
    if (!clip || clip.length === 0) return
    // raiz da subárvore copiada (parentId aponta para fora do clipe)
    const clipIds = new Set(clip.map(n => n.id))
    const rootOld = clip.find(n => !n.parentId || !clipIds.has(n.parentId)) || clip[0]
    const idMap = new Map<string, string>()
    clip.forEach(n => idMap.set(n.id, uid()))
    let baseX = opts.x
    let baseY = opts.y
    if (baseX == null || baseY == null) {
      if (opts.parentId) {
        const p = nodesRef.current.find(n => n.id === opts.parentId)
        baseX = (p?.x ?? 0) + 220
        baseY = p?.y ?? 0
      } else {
        baseX = rootOld.x + 40
        baseY = rootOld.y + 40
      }
    }
    const dx = baseX - rootOld.x
    const dy = baseY - rootOld.y
    const newNodes = clip.map(n => ({
      ...n,
      id: idMap.get(n.id)!,
      parentId: n.id === rootOld.id ? (opts.parentId ?? null) : (idMap.get(n.parentId!) ?? null),
      x: Math.round(n.x + dx),
      y: Math.round(n.y + dy),
    }))
    commit(prev => [...prev, ...newNodes])
    setSelectedId(idMap.get(rootOld.id)!)
  }, [commit])

  const duplicateNode = useCallback((nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId)
    if (!node) return
    const clip = collectSubtree(nodeId)
    pasteSubtree({ clip, parentId: node.parentId, x: node.x + 40, y: node.y + 40 })
  }, [collectSubtree, pasteSubtree])

  // ---- caneta laser ----
  const addLaserPoint = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const id = ++laserSeq.current
    const x = clientX - rect.left
    const y = clientY - rect.top
    setLaserHead({ x, y })
    setLaserPoints(p => [...p.slice(-60), { id, x, y }])
    // Cada ponto do rastro some após ~550ms (efeito cometa).
    setTimeout(() => setLaserPoints(p => p.filter(pt => pt.id !== id)), 550)
  }, [])

  const laserStart = useCallback((clientX: number, clientY: number) => {
    laserDown.current = true
    setLaserPoints([])
    addLaserPoint(clientX, clientY)
  }, [addLaserPoint])

  const laserEnd = useCallback(() => {
    laserDown.current = false
    setLaserHead(null)
  }, [])

  const beginEdit = useCallback((nodeId: string) => {
    if (!canEdit) return
    const node = nodesRef.current.find(n => n.id === nodeId)
    if (!node) return
    setEditingId(nodeId)
    setEditingText(node.text)
  }, [canEdit])

  const commitEdit = useCallback(() => {
    if (editingId) {
      const text = editingText.trim() || 'Sem título'
      updateNode(editingId, { text })
    }
    setEditingId(null)
  }, [editingId, editingText, updateNode])

  const doAutoLayout = useCallback(() => {
    commit(prev => autoLayout(prev))
    setTimeout(fitToScreen, 30)
  }, [commit])

  // ---- estilo ----
  const updateStyle = useCallback((patch: Partial<MindMapStyle>) => {
    if (!canEdit) return
    setStyle(s => ({ ...s, ...patch }))
    setDirty(true)
  }, [canEdit])

  const clearNodeColors = useCallback(() => {
    commit(prev => prev.map(n => ({ ...n, color: undefined, textColor: undefined, borderColor: undefined })))
  }, [commit])

  // ---- colaboradores ----
  const addCollaborator = useCallback(async (email: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/mindmaps/${initialMap._id}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) return data.error || 'Erro ao adicionar'
      setCollaborators(data.collaborators || [])
      return null
    } catch {
      return 'Erro de rede ao adicionar'
    }
  }, [initialMap._id])

  const removeCollaborator = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/mindmaps/${initialMap._id}/collaborators?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) setCollaborators(data.collaborators || [])
    } catch { /* ignora */ }
  }, [initialMap._id])

  // ---- viewport ----
  const fitToNodes = useCallback((subset?: MindMapNode[]) => {
    const el = containerRef.current
    const list = (subset && subset.length ? subset : nodesRef.current)
    if (!el || list.length === 0) return
    const rect = el.getBoundingClientRect()
    const xs = list.map(n => n.x)
    const ys = list.map(n => n.y)
    const minX = Math.min(...xs) - 140, maxX = Math.max(...xs) + 140
    const minY = Math.min(...ys) - 80, maxY = Math.max(...ys) + 80
    const w = maxX - minX, h = maxY - minY
    const s = clamp(Math.min(rect.width / w, rect.height / h), 0.2, 1.6)
    setScale(s)
    setTx(rect.width / 2 - ((minX + maxX) / 2) * s)
    setTy(rect.height / 2 - ((minY + maxY) / 2) * s)
  }, [])

  const fitToScreen = useCallback(() => { fitToNodes() }, [fitToNodes])

  // ---- apresentação progressiva ----
  const startPresent = useCallback(() => {
    setPresenting(true)
    setPresentStep(0)
    setSelectedId(null)
    setTimeout(() => fitToNodes(nodesRef.current.filter(n => n.parentId === null)), 30)
  }, [fitToNodes])

  const presentGo = useCallback((dir: 1 | -1) => {
    const dmap = computeDepthMap(nodesRef.current)
    const hidden = computeHidden(nodesRef.current)
    const maxD = Math.max(0, ...Array.from(dmap.values()))
    setPresentStep(prev => {
      const next = clamp(prev + dir, 0, maxD)
      if (next !== prev) {
        const visible = nodesRef.current.filter(n => (dmap.get(n.id) ?? 0) <= next && !hidden.has(n.id))
        setTimeout(() => fitToNodes(visible), 20)
      }
      return next
    })
  }, [fitToNodes])

  useEffect(() => {
    // centraliza ao montar
    const t = setTimeout(fitToScreen, 50)
    return () => clearTimeout(t)
  }, [fitToScreen])

  const zoomBy = useCallback((factor: number, cx?: number, cy?: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = cx ?? rect.width / 2
    const py = cy ?? rect.height / 2
    setScale(prevS => {
      const ns = clamp(prevS * factor, 0.2, 3)
      setTx(prevTx => px - ((px - prevTx) / prevS) * ns)
      setTy(prevTy => py - ((py - prevTy) / prevS) * ns)
      return ns
    })
  }, [])

  // ---- menu de contexto ----
  const openMenu = useCallback((clientX: number, clientY: number, nodeId: string | null) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    setMenu({
      x: clamp(x, 4, rect.width - 216),
      y: clamp(y, 4, rect.height - 60),
      nodeId,
      worldX: (x - tx) / scale,
      worldY: (y - ty) / scale,
    })
    setMenuSection(null)
  }, [tx, ty, scale])

  const closeMenu = useCallback(() => { setMenu(null); setMenuSection(null) }, [])

  // ---- pointer / pan / drag / pinch ----
  const onPointerDownBg = (e: React.PointerEvent) => {
    if (e.button === 2) return // botão direito → menu de contexto
    if (menu) closeMenu()
    if (editingId) commitEdit()
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      pinchStart.current = { dist, scale, cx: (pts[0].x + pts[1].x) / 2, cy: (pts[0].y + pts[1].y) / 2 }
      panStart.current = null
      return
    }
    panStart.current = { x: e.clientX, y: e.clientY, tx, ty }
    setSelectedId(null)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const clearLongPress = () => {
    if (longPress.current) { clearTimeout(longPress.current); longPress.current = null }
  }

  const onPointerDownNode = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation()
    if (menu) closeMenu()
    if (e.button === 2) { setSelectedId(nodeId); return }
    if (editingId && editingId !== nodeId) commitEdit()
    setSelectedId(nodeId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const node = nodesRef.current.find(n => n.id === nodeId)
    if (!node || !canEdit) return
    dragNode.current = { id: nodeId, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y, moved: false }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    // toque longo → menu de contexto (touch)
    if (e.pointerType === 'touch') {
      const cx = e.clientX, cy = e.clientY
      clearLongPress()
      longPress.current = setTimeout(() => { openMenu(cx, cy, nodeId); dragNode.current = null }, 500)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }
    // pinch
    if (pinchStart.current && pointers.current.size >= 2) {
      const pts = [...pointers.current.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const factor = dist / pinchStart.current.dist
      const rect = containerRef.current!.getBoundingClientRect()
      const ns = clamp(pinchStart.current.scale * factor, 0.2, 3)
      const cx = pinchStart.current.cx - rect.left
      const cy = pinchStart.current.cy - rect.top
      setScale(prevS => {
        setTx(prevTx => cx - ((cx - prevTx) / prevS) * ns)
        setTy(prevTy => cy - ((cy - prevTy) / prevS) * ns)
        return ns
      })
      return
    }
    // drag node
    if (dragNode.current) {
      const d = dragNode.current
      const dx = (e.clientX - d.startX) / scale
      const dy = (e.clientY - d.startY) / scale
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) { d.moved = true; clearLongPress() }
      setNodes(prev => prev.map(n => (n.id === d.id ? { ...n, x: Math.round(d.origX + dx), y: Math.round(d.origY + dy) } : n)))
      return
    }
    // pan
    if (panStart.current) {
      setTx(panStart.current.tx + (e.clientX - panStart.current.x))
      setTy(panStart.current.ty + (e.clientY - panStart.current.y))
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    clearLongPress()
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
    if (dragNode.current) {
      if (dragNode.current.moved) setDirty(true)
      dragNode.current = null
    }
    // Apresentação: toque/clique curto no fundo avança um passo.
    if (presenting && !laserOn && panStart.current) {
      const dist = Math.hypot(e.clientX - panStart.current.x, e.clientY - panStart.current.y)
      if (dist < 8) presentGo(1)
    }
    panStart.current = null
  }

  const onWheel = (e: React.WheelEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    zoomBy(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - rect.left, e.clientY - rect.top)
  }

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (presenting) {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); presentGo(1); return }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); presentGo(-1); return }
        if (e.key === 'Escape') { e.preventDefault(); setPresenting(false); return }
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); return }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return }
      if (!canEdit || !selectedId) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { e.preventDefault(); copyNode(selectedId); return }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') { e.preventDefault(); pasteSubtree({ parentId: selectedId }); return }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateNode(selectedId); return }
      if (e.key === 'Tab') { e.preventDefault(); addChild(selectedId) }
      else if (e.key === 'Enter') { e.preventDefault(); addSibling(selectedId) }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteNode(selectedId) }
      else if (e.key === 'F2') { e.preventDefault(); beginEdit(selectedId) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, selectedId, addChild, addSibling, deleteNode, beginEdit, undo, redo, copyNode, pasteSubtree, duplicateNode, presenting, presentGo])

  // ---- salvar ----
  const save = useCallback(async () => {
    if (!canEdit) return
    setSaveState('saving')
    try {
      const res = await fetch(`/api/mindmaps/${initialMap._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: nodesRef.current, style: styleRef.current }),
      })
      if (!res.ok) throw new Error('save failed')
      const data = await res.json().catch(() => null)
      if (data?.map?.updatedAt) serverUpdatedAt.current = new Date(data.map.updatedAt).getTime()
      setSaveState('saved')
      setDirty(false)
      setTimeout(() => setSaveState('idle'), 1500)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 2500)
    }
  }, [canEdit, initialMap._id])

  // autosave (debounce 1.8s)
  useEffect(() => {
    if (!canEdit || !dirty) return
    const t = setTimeout(() => { save() }, 1800)
    return () => clearTimeout(t)
  }, [nodes, style, dirty, canEdit, save])

  // ---- tempo real (leve) ----
  // Só ativa quando há colaboração de fato: para o dono de um mapa solo não
  // há ninguém pra sincronizar, então nem faz requisições (economia no Vercel).
  const liveEnabled = !access.isOwner || collaborators.length > 0
  useEffect(() => {
    if (!liveEnabled) return
    let cancelled = false

    // Busca o mapa completo só quando o timestamp mudou de verdade.
    const applyRemote = async () => {
      try {
        const res = await fetch(`/api/mindmaps/${initialMap._id}?poll=1`, { cache: 'no-store' })
        if (!res.ok || cancelled) return
        const data = await res.json()
        const ts = data?.map?.updatedAt ? new Date(data.map.updatedAt).getTime() : 0
        serverUpdatedAt.current = Math.max(serverUpdatedAt.current, ts)
        const remoteNodes = data?.map?.nodes
        // Nunca aplica conteúdo vazio (evita "piscar"/zoom estranho).
        if (!Array.isArray(remoteNodes) || remoteNodes.length === 0) return
        if (dirtyRef.current || editingIdRef.current || dragNode.current || presentingRef.current) return

        let changed = false
        if (JSON.stringify(remoteNodes) !== JSON.stringify(nodesRef.current)) {
          setNodes(remoteNodes); changed = true
        }
        if (data.map.style && JSON.stringify(data.map.style) !== JSON.stringify(styleRef.current)) {
          setStyle(resolveStyle(data.map.style)); changed = true
        }
        if (Array.isArray(data.map.collaborators)) setCollaborators(data.map.collaborators)
        if (changed) {
          setLiveMsg('Atualizado por um colaborador')
          setTimeout(() => setLiveMsg(''), 2200)
        }
      } catch { /* silencioso */ }
    }

    // Checagem barata (só updatedAt). Pausa com aba oculta ou edição em curso.
    const check = async () => {
      if (document.hidden) return
      if (dirtyRef.current || editingIdRef.current || dragNode.current || presentingRef.current) return
      try {
        const res = await fetch(`/api/mindmaps/${initialMap._id}/version`, { cache: 'no-store' })
        if (!res.ok || cancelled) return
        const data = await res.json()
        const ts = data?.updatedAt ? new Date(data.updatedAt).getTime() : 0
        if (ts > serverUpdatedAt.current) await applyRemote()
      } catch { /* silencioso */ }
    }

    const interval = setInterval(check, 3000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [initialMap._id, liveEnabled])

  // ---- salvar título inline ----
  const saveTitle = useCallback(async () => {
    setEditingTitle(false)
    const t = meta.title.trim()
    if (!t) { setMeta(m => ({ ...m, title: titleBeforeEdit.current })); return }
    if (t === titleBeforeEdit.current) return
    setMeta(m => ({ ...m, title: t }))
    try {
      const res = await fetch(`/api/mindmaps/${initialMap._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t }),
      })
      const data = await res.json().catch(() => null)
      if (data?.map?.updatedAt) serverUpdatedAt.current = new Date(data.map.updatedAt).getTime()
    } catch { /* silencioso — autosave de conteúdo cobre o resto */ }
  }, [meta.title, initialMap._id])

  // ---- salvar metadados ----
  const [savingMeta, setSavingMeta] = useState(false)
  const [metaError, setMetaError] = useState('')
  const saveMeta = useCallback(async () => {
    setSavingMeta(true); setMetaError('')
    try {
      const payload: any = {
        title: meta.title,
        description: meta.description,
        tags: meta.tags.split(',').map(t => t.trim()).filter(Boolean),
        visibility: meta.visibility,
      }
      if (meta.visibility === 'password' && meta.password) payload.password = meta.password
      if (meta.visibility === 'password' && !meta.password && meta.hasPassword) payload.keepPassword = true
      const res = await fetch(`/api/mindmaps/${initialMap._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      if (data?.map?.updatedAt) serverUpdatedAt.current = new Date(data.map.updatedAt).getTime()
      setMeta(m => ({ ...m, password: '', hasPassword: data.map?.hasPassword ?? m.hasPassword }))
      setShowSettings(false)
    } catch (err: any) {
      setMetaError(err.message || 'Erro ao salvar')
    } finally {
      setSavingMeta(false)
    }
  }, [meta, initialMap._id])

  // ---- exportar ----
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ title: meta.title, nodes, style }, null, 2)], { type: 'application/json' })
    triggerDownload(blob, `${initialMap.slug || 'mapa'}.json`)
  }
  const exportSVG = () => {
    const svg = buildSVG(nodes, meta.title, theme, style)
    triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), `${initialMap.slug || 'mapa'}.svg`)
  }
  const exportPNG = async () => {
    // iOS Safari não expõe img.width/height de SVGs e falha com blob: URLs.
    // Calculamos as dimensões nós mesmos, usamos data URL e desenhamos com
    // tamanho explícito — funciona tanto no desktop quanto no iPhone.
    const { width, height } = svgSize(nodes)
    const svg = buildSVG(nodes, meta.title, theme, style)
    const factor = clamp(Math.floor(3200 / Math.max(width, height)) || 1, 1, 3)
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    const img = new window.Image()
    img.decoding = 'sync'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(width * factor))
      canvas.height = Math.max(1, Math.round(height * factor))
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = theme.canvasBg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const name = `${initialMap.slug || 'mapa'}.png`
      if (canvas.toBlob) {
        canvas.toBlob(b => { if (b) triggerDownload(b, name); else triggerDownloadUrl(canvas.toDataURL('image/png'), name) }, 'image/png')
      } else {
        triggerDownloadUrl(canvas.toDataURL('image/png'), name)
      }
    }
    img.onerror = () => { exportSVG() } // fallback: ao menos baixa o SVG
    img.src = dataUrl
  }

  // ---- edges ----
  const edges = useMemo(() => {
    const map = new Map(nodes.map(n => [n.id, n]))
    const hidden = new Set<string>()
    // nós escondidos por colapso
    for (const n of nodes) {
      if (n.collapsed) {
        const stack = nodes.filter(c => c.parentId === n.id)
        while (stack.length) {
          const c = stack.pop()!
          hidden.add(c.id)
          stack.push(...nodes.filter(x => x.parentId === c.id))
        }
      }
    }
    const list: { from: MindMapNode; to: MindMapNode }[] = []
    for (const n of nodes) {
      if (n.parentId && map.has(n.parentId) && !hidden.has(n.id) && !hidden.has(n.parentId)) {
        list.push({ from: map.get(n.parentId)!, to: n })
      }
    }
    return { list, hidden }
  }, [nodes])

  // Profundidade de cada nó (para a apresentação progressiva).
  const depth = useMemo(() => computeDepthMap(nodes), [nodes])
  const maxDepth = useMemo(() => Math.max(0, ...Array.from(depth.values())), [depth])

  // Na apresentação, revela só até o passo atual.
  const revealed = useMemo(() => {
    if (!presenting) return null
    const set = new Set<string>()
    nodes.forEach(n => { if ((depth.get(n.id) ?? 0) <= presentStep) set.add(n.id) })
    return set
  }, [presenting, presentStep, nodes, depth])

  const visibleNodes = nodes.filter(n => !edges.hidden.has(n.id) && (!revealed || revealed.has(n.id)))
  const selectedNode = nodes.find(n => n.id === selectedId) || null
  const menuNode = menu?.nodeId ? nodes.find(n => n.id === menu.nodeId) || null : null
  const menuChildCount = menuNode ? nodes.filter(n => n.parentId === menuNode.id).length : 0

  return (
    <div
      className={cn('relative flex h-[100dvh] w-full flex-col overflow-hidden text-white', presenting && 'fixed inset-0 z-[100]')}
      style={{ background: theme.canvasBg }}
    >
      {/* Top bar */}
      {!presenting && (
        <div className="z-20 flex items-center gap-2 border-b border-[#2D5A46]/60 bg-[#10261D]/90 px-3 py-2 backdrop-blur">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-9 px-2 text-[#C7D5CE] hover:bg-[#204233] hover:text-white">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 shrink-0 text-[#2ECC71]" />
              {editingTitle && canEdit ? (
                <input
                  autoFocus
                  value={meta.title}
                  onChange={(e) => setMeta(m => ({ ...m, title: e.target.value }))}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); saveTitle() }
                    if (e.key === 'Escape') { setMeta(m => ({ ...m, title: titleBeforeEdit.current })); setEditingTitle(false) }
                  }}
                  maxLength={120}
                  className="min-w-0 flex-1 rounded-md border border-[#2ECC71] bg-[#0B1F17] px-2 py-0.5 text-sm font-semibold text-white outline-none"
                />
              ) : (
                <button
                  onClick={() => { if (canEdit) { titleBeforeEdit.current = meta.title; setEditingTitle(true) } }}
                  className={cn('group inline-flex min-w-0 items-center gap-1 truncate text-sm font-semibold', canEdit && 'rounded-md px-1 hover:bg-[#204233]')}
                  title={canEdit ? 'Clique para renomear' : undefined}
                >
                  <span className="truncate">{meta.title}</span>
                  {canEdit && <Pencil className="hidden h-3 w-3 shrink-0 text-[#C7D5CE] group-hover:inline" />}
                </button>
              )}
              <VisibilityBadge visibility={meta.visibility} />
              {access.isAdmin && !access.isOwner && (
                <span className="hidden items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 sm:inline-flex">
                  <ShieldCheck className="h-3 w-3" /> ADMIN
                </span>
              )}
              {access.isCollaborator && !access.isOwner && !access.isAdmin && (
                <span className="hidden items-center gap-1 rounded-full bg-[#2ECC71]/15 px-2 py-0.5 text-[10px] font-bold text-[#2ECC71] sm:inline-flex">
                  <Users className="h-3 w-3" /> COLABORADOR
                </span>
              )}
              {(access.isOwner || access.isAdmin) && collaborators.length > 0 && (
                <span className="hidden items-center gap-1 rounded-full bg-[#163126] px-2 py-0.5 text-[10px] font-semibold text-[#C7D5CE] sm:inline-flex" title="Colaboradores">
                  <Users className="h-3 w-3" /> {collaborators.length}
                </span>
              )}
            </div>
            {!canEdit && <p className="text-[11px] text-[#C7D5CE]">Somente leitura</p>}
          </div>

          {canEdit && (
            <div className="hidden items-center gap-1 md:flex">
              <ToolBtn onClick={() => selectedId && addChild(selectedId)} disabled={!selectedId} title="Adicionar filho (Tab)"><Plus className="h-4 w-4" /></ToolBtn>
              <ToolBtn onClick={() => selectedId && deleteNode(selectedId)} disabled={!selectedId} title="Excluir (Del)"><Trash2 className="h-4 w-4" /></ToolBtn>
              <span className="mx-1 h-5 w-px bg-[#2D5A46]" />
              <ToolBtn onClick={undo} disabled={history.length === 0} title="Desfazer (Ctrl+Z)"><Undo2 className="h-4 w-4" /></ToolBtn>
              <ToolBtn onClick={redo} disabled={future.length === 0} title="Refazer (Ctrl+Y)"><Redo2 className="h-4 w-4" /></ToolBtn>
              <ToolBtn onClick={doAutoLayout} title="Auto-organizar"><LayoutGrid className="h-4 w-4" /></ToolBtn>
              <ToolBtn onClick={() => setShowStyle(true)} title="Estilo do mapa"><Palette className="h-4 w-4" /></ToolBtn>
              <span className="mx-1 h-5 w-px bg-[#2D5A46]" />
            </div>
          )}

          <div className="flex items-center gap-1">
            <ToolBtn onClick={() => zoomBy(0.89)} title="Diminuir zoom"><ZoomOut className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={fitToScreen} title="Centralizar"><Crosshair className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => zoomBy(1.12)} title="Aumentar zoom"><ZoomIn className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => setLaserOn(v => !v)} title="Caneta laser" className={laserOn ? 'bg-red-500/20 text-red-400' : ''}><Highlighter className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={startPresent} title="Apresentar"><Play className="h-4 w-4" /></ToolBtn>
            <ExportMenu onJSON={exportJSON} onSVG={exportSVG} onPNG={exportPNG} />
            {canEdit && <ToolBtn onClick={() => setShowStyle(true)} title="Estilo do mapa" className="md:hidden"><Palette className="h-4 w-4" /></ToolBtn>}
            {canEdit && <ToolBtn onClick={() => setShowSettings(true)} title="Configurações"><Settings2 className="h-4 w-4" /></ToolBtn>}
            {canEdit && (
              <Button size="sm" onClick={save} className="ml-1 h-9 gap-1.5 bg-[#2ECC71] text-[#0B1F17] hover:bg-[#27AE60]">
                {saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : saveState === 'saved' ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">{saveState === 'saving' ? 'Salvando' : saveState === 'saved' ? 'Salvo' : 'Salvar'}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {presenting && (
        <>
          <button onClick={() => setPresenting(false)} className="absolute right-4 top-4 z-[85] flex h-10 w-10 items-center justify-center rounded-full bg-[#163126] text-white shadow-lg hover:bg-[#204233]" title="Sair (Esc)">
            <X className="h-5 w-5" />
          </button>
          <button onClick={() => setLaserOn(v => !v)} className={cn('absolute right-16 top-4 z-[85] flex h-10 w-10 items-center justify-center rounded-full shadow-lg', laserOn ? 'bg-red-500 text-white' : 'bg-[#163126] text-white hover:bg-[#204233]')} title="Caneta laser">
            <Highlighter className="h-5 w-5" />
          </button>
          <div className="absolute bottom-5 left-1/2 z-[85] flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#2D5A46]/70 bg-[#10261D]/95 px-2 py-1.5 shadow-2xl backdrop-blur">
            <button onClick={() => presentGo(-1)} disabled={presentStep === 0} className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-[#204233] disabled:opacity-30" title="Anterior (←)">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[64px] text-center text-xs font-semibold text-[#C7D5CE]">{presentStep + 1} / {maxDepth + 1}</span>
            <button onClick={() => presentGo(1)} disabled={presentStep >= maxDepth} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2ECC71] text-[#0B1F17] hover:bg-[#27AE60] disabled:opacity-30" title="Próximo (→ / toque)">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 touch-none overflow-hidden"
        style={{ cursor: panStart.current ? 'grabbing' : 'grab', background: theme.canvasBg, backgroundImage: `radial-gradient(circle, ${theme.dot} 1px, transparent 1px)`, backgroundSize: `${24 * scale}px ${24 * scale}px`, backgroundPosition: `${tx}px ${ty}px` }}
        onPointerDown={onPointerDownBg}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onContextMenu={(e) => { if (!canEdit) return; e.preventDefault(); openMenu(e.clientX, e.clientY, null) }}
      >
        {/* edges */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ overflow: 'visible' }}>
          <g transform={`translate(${tx},${ty}) scale(${scale})`}>
            {edges.list.filter(({ from, to }) => !revealed || (revealed.has(from.id) && revealed.has(to.id))).map(({ from, to }) => (
              <path
                key={`${from.id}-${to.id}`}
                d={edgePath(from.x, from.y, to.x, to.y, style.edgeStyle)}
                fill="none"
                stroke={to.color || theme.edge}
                strokeWidth={2}
                strokeOpacity={0.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        </svg>

        {/* nodes */}
        <div className="absolute left-0 top-0" style={{ transform: `translate(${tx}px,${ty}px) scale(${scale})`, transformOrigin: '0 0' }}>
          {visibleNodes.map(node => {
            const isRoot = node.parentId === null
            const childCount = nodes.filter(n => n.parentId === node.id).length
            const selected = node.id === selectedId
            const shape = node.shape || style.nodeShape
            const bg = node.color || (isRoot ? theme.rootBg : theme.nodeBg)
            const fg = node.textColor || (node.color ? idealTextColor(node.color) : (isRoot ? theme.rootText : theme.nodeText))
            const border = node.borderColor || (node.color ? 'rgba(255,255,255,0.25)' : theme.nodeBorder)
            return (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
                style={{ left: node.x, top: node.y }}
              >
                <div
                  onPointerDown={(e) => onPointerDownNode(e, node.id)}
                  onDoubleClick={() => beginEdit(node.id)}
                  onContextMenu={(e) => { if (!canEdit) return; e.preventDefault(); e.stopPropagation(); setSelectedId(node.id); openMenu(e.clientX, e.clientY, node.id) }}
                  className={cn(
                    'group relative flex max-w-[260px] items-center gap-1.5 px-3 py-2 text-sm font-medium shadow-lg transition-shadow',
                    shape === 'pill' ? 'rounded-full' : shape === 'rect' ? 'rounded-md' : shape === 'ellipse' ? 'rounded-[50%] px-5' : 'rounded-xl',
                    isRoot ? 'font-bold' : '',
                    canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                  )}
                  style={{
                    background: bg,
                    color: fg,
                    border: `1.5px solid ${border}`,
                    ...(selected ? { boxShadow: `0 0 0 2px ${theme.accent}, 0 0 0 4px ${theme.canvasBg}` } : {}),
                  }}
                >
                  {node.icon && <span className="text-base leading-none">{node.icon}</span>}
                  {editingId === node.id ? (
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit() }
                        if (e.key === 'Escape') { setEditingId(null) }
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      rows={1}
                      className="w-32 resize-none bg-transparent text-current outline-none placeholder:text-current/50"
                      style={{ minWidth: 80 }}
                    />
                  ) : (
                    <span className="whitespace-pre-wrap break-words leading-snug">{node.text || 'Sem título'}</span>
                  )}

                  {/* botão colapsar */}
                  {childCount > 0 && (
                    <button
                      onPointerDown={(e) => { e.stopPropagation(); updateNode(node.id, { collapsed: !node.collapsed }) }}
                      className="absolute -right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-bold"
                      style={{ background: theme.canvasBg, borderColor: theme.nodeBorder, color: theme.accent }}
                      title={node.collapsed ? 'Expandir' : 'Recolher'}
                    >
                      {node.collapsed ? childCount : '–'}
                    </button>
                  )}

                  {/* quick add (hover) */}
                  {canEdit && !editingId && (
                    <button
                      onPointerDown={(e) => { e.stopPropagation(); addChild(node.id) }}
                      className="absolute -bottom-2.5 left-1/2 hidden h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full shadow group-hover:flex"
                      style={{ background: theme.accent, color: theme.rootText }}
                      title="Adicionar filho"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Inspector flutuante do nó selecionado */}
        {canEdit && selectedNode && !presenting && (
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-[#2D5A46]/70 bg-[#10261D]/95 px-2.5 py-2 shadow-2xl backdrop-blur">
            <Palette className="ml-0.5 mr-0.5 h-4 w-4 text-[#C7D5CE]" />
            {theme.palette.map(c => (
              <button
                key={c}
                onClick={() => updateNode(selectedNode.id, { color: c })}
                className={cn('h-6 w-6 rounded-full border-2 transition-transform hover:scale-110', selectedNode.color === c ? 'border-white' : 'border-transparent')}
                style={{ background: c }}
                title={c}
              />
            ))}
            <button
              onClick={() => updateNode(selectedNode.id, { color: undefined })}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-transparent bg-[#163126] text-[10px] text-[#C7D5CE] hover:scale-110"
              title="Cor padrão"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Menu de contexto */}
        {menu && canEdit && (
          <>
            <div className="fixed inset-0 z-[88]" onPointerDown={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu() }} />
            <div
              className="absolute z-[90] w-52 overflow-hidden rounded-xl border border-[#2D5A46] bg-[#10261D] py-1 text-sm text-[#E6EFEA] shadow-2xl"
              style={{ left: menu.x, top: menu.y }}
              onPointerDown={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              {menu.nodeId && menuNode ? (
                <>
                  <MenuItem icon={<Pencil className="h-4 w-4" />} label="Editar texto" onClick={() => { beginEdit(menu.nodeId!); closeMenu() }} />
                  <MenuItem icon={<Plus className="h-4 w-4" />} label="Adicionar filho" hint="Tab" onClick={() => { addChild(menu.nodeId!); closeMenu() }} />
                  <MenuItem icon={<CornerDownRight className="h-4 w-4" />} label="Adicionar irmão" hint="Enter" onClick={() => { addSibling(menu.nodeId!); closeMenu() }} />
                  <MenuItem icon={<Copy className="h-4 w-4" />} label="Duplicar" hint="Ctrl+D" onClick={() => { duplicateNode(menu.nodeId!); closeMenu() }} />
                  {menuChildCount > 0 && (
                    <MenuItem
                      icon={<LayoutGrid className="h-4 w-4" />}
                      label={menuNode.collapsed ? 'Expandir' : 'Recolher'}
                      onClick={() => { updateNode(menu.nodeId!, { collapsed: !menuNode.collapsed }); closeMenu() }}
                    />
                  )}
                  <MenuDivider />
                  <MenuItem icon={<Palette className="h-4 w-4" />} label="Cor do nó" expand={menuSection === 'color'} onClick={() => setMenuSection(s => s === 'color' ? null : 'color')} />
                  {menuSection === 'color' && (
                    <div className="flex flex-wrap gap-1.5 px-3 py-2">
                      {theme.palette.map(c => (
                        <button key={c} onClick={() => { updateNode(menu.nodeId!, { color: c }); closeMenu() }} className="h-6 w-6 rounded-full border border-white/20 hover:scale-110" style={{ background: c }} />
                      ))}
                      <button onClick={() => { updateNode(menu.nodeId!, { color: undefined, textColor: undefined }); closeMenu() }} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#163126] text-[#C7D5CE]" title="Padrão"><X className="h-3 w-3" /></button>
                    </div>
                  )}
                  <MenuItem icon={<Shapes className="h-4 w-4" />} label="Forma" expand={menuSection === 'shape'} onClick={() => setMenuSection(s => s === 'shape' ? null : 'shape')} />
                  {menuSection === 'shape' && (
                    <div className="grid grid-cols-2 gap-1 px-3 py-2">
                      {SHAPES.map(s => (
                        <button key={s.v} onClick={() => { updateNode(menu.nodeId!, { shape: s.v }); closeMenu() }} className={cn('rounded-lg border px-2 py-1.5 text-xs', (menuNode.shape || style.nodeShape) === s.v ? 'border-[#2ECC71] bg-[#2ECC71]/10' : 'border-[#2D5A46] hover:bg-[#163126]')}>{s.label}</button>
                      ))}
                    </div>
                  )}
                  <MenuItem icon={<Smile className="h-4 w-4" />} label="Ícone" expand={menuSection === 'icon'} onClick={() => setMenuSection(s => s === 'icon' ? null : 'icon')} />
                  {menuSection === 'icon' && (
                    <div className="grid grid-cols-7 gap-1 px-3 py-2">
                      {EMOJIS.map(em => (
                        <button key={em} onClick={() => { updateNode(menu.nodeId!, { icon: menuNode.icon === em ? undefined : em }); closeMenu() }} className={cn('flex h-7 w-7 items-center justify-center rounded-md text-base hover:bg-[#204233]', menuNode.icon === em && 'bg-[#2ECC71]/20')}>{em}</button>
                      ))}
                      <button onClick={() => { updateNode(menu.nodeId!, { icon: undefined }); closeMenu() }} className="col-span-7 mt-1 rounded-md border border-[#2D5A46] py-1 text-xs text-[#C7D5CE] hover:bg-[#163126]">Remover ícone</button>
                    </div>
                  )}
                  <MenuDivider />
                  <MenuItem icon={<Copy className="h-4 w-4" />} label="Copiar" hint="Ctrl+C" onClick={() => { copyNode(menu.nodeId!); closeMenu() }} />
                  {hasClipboard && <MenuItem icon={<ClipboardPaste className="h-4 w-4" />} label="Colar como filho" hint="Ctrl+V" onClick={() => { pasteSubtree({ parentId: menu.nodeId }); closeMenu() }} />}
                  <MenuDivider />
                  <MenuItem icon={<Trash2 className="h-4 w-4" />} label="Excluir" hint="Del" danger onClick={() => { deleteNode(menu.nodeId!); closeMenu() }} />
                </>
              ) : (
                <>
                  <MenuItem icon={<Plus className="h-4 w-4" />} label="Adicionar nó aqui" onClick={() => { addRootAt(menu.worldX, menu.worldY); closeMenu() }} />
                  {hasClipboard && <MenuItem icon={<ClipboardPaste className="h-4 w-4" />} label="Colar aqui" onClick={() => { pasteSubtree({ x: menu.worldX, y: menu.worldY }); closeMenu() }} />}
                  <MenuDivider />
                  <MenuItem icon={<LayoutGrid className="h-4 w-4" />} label="Auto-organizar" onClick={() => { doAutoLayout(); closeMenu() }} />
                  <MenuItem icon={<Crosshair className="h-4 w-4" />} label="Centralizar" onClick={() => { fitToScreen(); closeMenu() }} />
                  <MenuItem icon={<Palette className="h-4 w-4" />} label="Estilo do mapa" onClick={() => { setShowStyle(true); closeMenu() }} />
                </>
              )}
            </div>
          </>
        )}

        {/* Camada de captura da caneta laser — só desenha enquanto segura */}
        {laserOn && (
          <div
            className="absolute inset-0 z-[70]"
            style={{ cursor: 'crosshair', touchAction: 'none' }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); laserStart(e.clientX, e.clientY) }}
            onPointerMove={(e) => { if (laserDown.current) addLaserPoint(e.clientX, e.clientY) }}
            onPointerUp={laserEnd}
            onPointerCancel={laserEnd}
            onPointerLeave={() => { if (laserDown.current) laserEnd() }}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}

        {/* Rastro da caneta laser (efeito GoodNotes: rastro neon que some) */}
        {laserOn && (laserPoints.length > 0 || laserHead) && (
          <svg className="pointer-events-none absolute inset-0 z-[76] h-full w-full">
            <defs>
              <filter id="laserGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            {laserPoints.length > 1 && (
              <>
                <path
                  d={`M ${laserPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  fill="none" stroke="#ff3b30" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round"
                  opacity={0.5} filter="url(#laserGlow)"
                />
                <path
                  d={`M ${laserPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  fill="none" stroke="#ff6b60" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
                  opacity={0.9}
                />
              </>
            )}
            {laserHead && (
              <>
                <circle cx={laserHead.x} cy={laserHead.y} r={10} fill="#ff3b30" opacity={0.6} filter="url(#laserGlow)" />
                <circle cx={laserHead.x} cy={laserHead.y} r={5} fill="#fff" />
                <circle cx={laserHead.x} cy={laserHead.y} r={5} fill="none" stroke="#ff3b30" strokeWidth={2} />
              </>
            )}
          </svg>
        )}

        {/* Indicador de tempo real */}
        {liveMsg && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[80] -translate-x-1/2 rounded-full bg-[#2ECC71] px-3 py-1 text-[11px] font-semibold text-[#0B1F17] shadow-lg">
            {liveMsg}
          </div>
        )}

        {/* Hint mobile */}
        {canEdit && !presenting && (
          <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg bg-[#10261D]/80 px-2.5 py-1 text-[10px] text-[#C7D5CE] md:hidden">
            Toque 2x p/ editar · segure p/ menu · pinça p/ zoom
          </div>
        )}
      </div>

      {/* Settings drawer */}
      {showSettings && canEdit && (
        <SettingsDrawer
          meta={meta}
          setMeta={setMeta}
          onClose={() => setShowSettings(false)}
          onSave={saveMeta}
          saving={savingMeta}
          error={metaError}
          slug={initialMap.slug}
          isAdmin={access.isAdmin}
          canManageCollaborators={access.isOwner || access.isAdmin}
          collaborators={collaborators}
          onAddCollaborator={addCollaborator}
          onRemoveCollaborator={removeCollaborator}
        />
      )}

      {/* Style drawer */}
      {showStyle && canEdit && (
        <StyleDrawer
          style={style}
          onChange={updateStyle}
          onClearColors={clearNodeColors}
          onClose={() => setShowStyle(false)}
        />
      )}

    </div>
  )
}

function MenuItem({ icon, label, hint, onClick, danger, expand }: { icon: React.ReactNode; label: string; hint?: string; onClick: () => void; danger?: boolean; expand?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-[#204233]', danger ? 'text-red-300 hover:bg-red-500/15' : '')}
    >
      <span className={cn('shrink-0', danger ? 'text-red-300' : 'text-[#9DB5AB]')}>{icon}</span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[10px] text-[#6F857B]">{hint}</span>}
      {expand !== undefined && <span className="text-[10px] text-[#6F857B]">{expand ? '▾' : '▸'}</span>}
    </button>
  )
}

function MenuDivider() {
  return <div className="my-1 h-px bg-[#2D5A46]/60" />
}

function ToolBtn({ children, onClick, disabled, title, className }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; title: string; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-[#C7D5CE] transition-colors hover:bg-[#204233] hover:text-white disabled:cursor-not-allowed disabled:opacity-30', className)}
    >
      {children}
    </button>
  )
}

function VisibilityBadge({ visibility }: { visibility: MindMapVisibility }) {
  const map = {
    private: { icon: <EyeOff className="h-3 w-3" />, label: 'Privado', cls: 'bg-[#163126] text-[#C7D5CE]' },
    public: { icon: <Globe className="h-3 w-3" />, label: 'Público', cls: 'bg-[#2ECC71]/15 text-[#2ECC71]' },
    unlisted: { icon: <Link2 className="h-3 w-3" />, label: 'Não listado', cls: 'bg-blue-500/15 text-blue-300' },
    password: { icon: <Lock className="h-3 w-3" />, label: 'Com senha', cls: 'bg-amber-500/15 text-amber-300' },
  }[visibility]
  return (
    <span className={cn('hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-flex', map.cls)}>
      {map.icon} {map.label}
    </span>
  )
}

function ExportMenu({ onJSON, onSVG, onPNG }: { onJSON: () => void; onSVG: () => void; onPNG: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <ToolBtn onClick={() => setOpen(o => !o)} title="Exportar"><Download className="h-4 w-4" /></ToolBtn>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-40 overflow-hidden rounded-xl border border-[#2D5A46] bg-[#10261D] py-1 shadow-2xl">
            {[['PNG', onPNG], ['SVG', onSVG], ['JSON', onJSON]].map(([label, fn]) => (
              <button key={label as string} onClick={() => { (fn as () => void)(); setOpen(false) }} className="block w-full px-3 py-2 text-left text-sm text-[#C7D5CE] hover:bg-[#204233] hover:text-white">
                Exportar {label as string}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function StyleDrawer({ style, onChange, onClearColors, onClose }: {
  style: MindMapStyle
  onChange: (patch: Partial<MindMapStyle>) => void
  onClearColors: () => void
  onClose: () => void
}) {
  const edgeOpts: { v: MindMapEdgeStyle; label: string; icon: React.ReactNode }[] = [
    { v: 'curved', label: 'Curva', icon: <Spline className="h-4 w-4" /> },
    { v: 'straight', label: 'Reta', icon: <Minus className="h-4 w-4" /> },
    { v: 'stepped', label: 'Degrau', icon: <CornerDownRight className="h-4 w-4" /> },
  ]
  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-black/50" onClick={onClose}>
      <div className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#10261D] text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#2D5A46]/60 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Wand2 className="h-5 w-5 text-[#2ECC71]" /> Estilo do mapa</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#C7D5CE] hover:bg-[#204233]"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-6 px-5 py-5">
          <Field label="Tema">
            <div className="grid grid-cols-2 gap-2.5">
              {Object.values(MINDMAP_THEMES).map(t => (
                <button
                  key={t.key}
                  onClick={() => onChange({ theme: t.key })}
                  className={cn('flex items-center gap-2 rounded-xl border p-2.5 text-left transition-colors', style.theme === t.key ? 'border-[#2ECC71] ring-1 ring-[#2ECC71]' : 'border-[#2D5A46] hover:bg-[#163126]')}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border" style={{ background: t.canvasBg, borderColor: t.nodeBorder }}>
                    <span className="h-3.5 w-3.5 rounded-full" style={{ background: t.rootBg }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{t.name}</span>
                    <span className="mt-1 flex gap-1">
                      {t.palette.slice(0, 4).map(c => <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />)}
                    </span>
                  </span>
                  {style.theme === t.key && <Check className="ml-auto h-4 w-4 shrink-0 text-[#2ECC71]" />}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Estilo das conexões">
            <div className="grid grid-cols-3 gap-2">
              {edgeOpts.map(o => (
                <button
                  key={o.v}
                  onClick={() => onChange({ edgeStyle: o.v })}
                  className={cn('flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-colors', style.edgeStyle === o.v ? 'border-[#2ECC71] bg-[#2ECC71]/10' : 'border-[#2D5A46] hover:bg-[#163126]')}
                >
                  <span className="text-[#2ECC71]">{o.icon}</span>
                  <span className="text-xs font-medium">{o.label}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Forma padrão dos nós">
            <div className="grid grid-cols-2 gap-2">
              {SHAPES.map(s => (
                <button
                  key={s.v}
                  onClick={() => onChange({ nodeShape: s.v })}
                  className={cn('rounded-xl border px-3 py-2.5 text-sm transition-colors', style.nodeShape === s.v ? 'border-[#2ECC71] bg-[#2ECC71]/10' : 'border-[#2D5A46] hover:bg-[#163126]')}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="rounded-xl border border-[#2D5A46]/70 bg-[#0B1F17]/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-[#2ECC71]" /> Cores personalizadas</p>
            <p className="mt-1 text-xs text-[#C7D5CE]">Remova as cores aplicadas manualmente para que todos os nós voltem a seguir o tema.</p>
            <button onClick={onClearColors} className="mt-3 w-full rounded-lg border border-[#2D5A46] py-2 text-sm font-medium text-[#C7D5CE] hover:bg-[#163126]">
              Limpar cores dos nós
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsDrawer({ meta, setMeta, onClose, onSave, saving, error, slug, isAdmin, canManageCollaborators, collaborators, onAddCollaborator, onRemoveCollaborator }: any) {
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/mapa-mental/${slug || ''}` : ''
  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-black/50" onClick={onClose}>
      <div className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#10261D] text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#2D5A46]/60 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Settings2 className="h-5 w-5 text-[#2ECC71]" /> Configurações</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#C7D5CE] hover:bg-[#204233]"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-5 px-5 py-5">
          <Field label="Título">
            <input value={meta.title} onChange={(e) => setMeta((m: any) => ({ ...m, title: e.target.value }))} className="inp" maxLength={120} />
          </Field>
          <Field label="Descrição">
            <textarea value={meta.description} onChange={(e) => setMeta((m: any) => ({ ...m, description: e.target.value }))} rows={3} className="inp resize-none" maxLength={600} />
          </Field>
          <Field label="Tags (separadas por vírgula)">
            <input value={meta.tags} onChange={(e) => setMeta((m: any) => ({ ...m, tags: e.target.value }))} className="inp" placeholder="ex: medicina, fisiologia" />
          </Field>

          <Field label="Visibilidade">
            <div className="grid gap-2">
              {[
                { v: 'private', icon: <EyeOff className="h-4 w-4" />, label: 'Privado', desc: 'Só você vê' },
                { v: 'public', icon: <Globe className="h-4 w-4" />, label: 'Público', desc: 'Aparece na comunidade' },
                { v: 'unlisted', icon: <Link2 className="h-4 w-4" />, label: 'Não listado', desc: 'Acesso só por link' },
                { v: 'password', icon: <Lock className="h-4 w-4" />, label: 'Com senha', desc: 'Exige senha para abrir' },
              ].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setMeta((m: any) => ({ ...m, visibility: opt.v }))}
                  className={cn('flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                    meta.visibility === opt.v ? 'border-[#2ECC71] bg-[#2ECC71]/10' : 'border-[#2D5A46] hover:bg-[#163126]')}
                >
                  <span className={cn('text-[#2ECC71]')}>{opt.icon}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{opt.label}</span>
                    <span className="block text-xs text-[#C7D5CE]">{opt.desc}</span>
                  </span>
                  {meta.visibility === opt.v && <Check className="h-4 w-4 text-[#2ECC71]" />}
                </button>
              ))}
            </div>
          </Field>

          {meta.visibility === 'password' && (
            <Field label={meta.hasPassword ? 'Nova senha (deixe em branco para manter)' : 'Senha de acesso'}>
              <input type="text" value={meta.password} onChange={(e) => setMeta((m: any) => ({ ...m, password: e.target.value }))} className="inp" placeholder="mín. 3 caracteres" />
            </Field>
          )}

          {(meta.visibility === 'public' || meta.visibility === 'unlisted' || meta.visibility === 'password') && slug && (
            <Field label="Link de compartilhamento">
              <div className="flex gap-2">
                <input readOnly value={shareUrl} className="inp flex-1 text-xs" />
                <button onClick={() => { navigator.clipboard?.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="rounded-lg bg-[#2ECC71] px-3 text-sm font-semibold text-[#0B1F17]">
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </Field>
          )}

          {canManageCollaborators && (
            <CollaboratorsSection
              collaborators={collaborators || []}
              onAdd={onAddCollaborator}
              onRemove={onRemoveCollaborator}
            />
          )}

          {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}
        </div>
        <div className="border-t border-[#2D5A46]/60 px-5 py-4">
          <Button onClick={onSave} disabled={saving} className="w-full gap-2 bg-[#2ECC71] text-[#0B1F17] hover:bg-[#27AE60]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Salvar configurações
          </Button>
        </div>
      </div>
      <style jsx>{`
        :global(.inp) {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid #2D5A46;
          background: #0B1F17;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          color: #fff;
          outline: none;
        }
        :global(.inp:focus) { border-color: #2ECC71; }
      `}</style>
    </div>
  )
}

function CollaboratorsSection({ collaborators, onAdd, onRemove }: {
  collaborators: MindMapCollaborator[]
  onAdd: (email: string) => Promise<string | null>
  onRemove: (userId: string) => void
}) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const submit = async () => {
    const e = email.trim()
    if (!e) return
    setBusy(true); setErr(''); setOk('')
    const error = await onAdd(e)
    setBusy(false)
    if (error) { setErr(error) } else { setEmail(''); setOk('Colaborador adicionado!'); setTimeout(() => setOk(''), 2000) }
  }

  return (
    <div className="rounded-xl border border-[#2D5A46]/70 bg-[#0B1F17]/60 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-[#2ECC71]" /> Colaboradores</p>
      <p className="mt-1 text-xs text-[#C7D5CE]">Convide pessoas pelo e-mail para editarem este mapa em tempo real. Elas precisam ter conta na plataforma.</p>
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F857B]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
            placeholder="email@exemplo.com"
            className="w-full rounded-lg border border-[#2D5A46] bg-[#0B1F17] py-2 pl-8 pr-2 text-sm text-white outline-none focus:border-[#2ECC71]"
          />
        </div>
        <button onClick={submit} disabled={busy || !email.trim()} className="flex items-center gap-1.5 rounded-lg bg-[#2ECC71] px-3 text-sm font-semibold text-[#0B1F17] disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Convidar
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
      {ok && <p className="mt-2 text-xs text-[#2ECC71]">{ok}</p>}

      {collaborators.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {collaborators.map(c => (
            <li key={c.userId} className="flex items-center gap-2 rounded-lg bg-[#10261D] px-3 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2ECC71]/15 text-xs font-bold text-[#2ECC71]">
                {(c.name || c.email || '?').slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                {c.name && <span className="block truncate text-sm font-medium text-white">{c.name}</span>}
                <span className="block truncate text-xs text-[#C7D5CE]">{c.email}</span>
              </span>
              <button onClick={() => onRemove(c.userId)} className="rounded-md p-1.5 text-[#6F857B] hover:bg-red-500/10 hover:text-red-400" title="Remover">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#C7D5CE]">{label}</span>
      {children}
    </label>
  )
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  triggerDownloadUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function triggerDownloadUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.rel = 'noopener'
  a.target = '_blank' // iOS: abre a imagem caso o download direto não seja permitido
  document.body.appendChild(a); a.click(); a.remove()
}

/** Dimensões do SVG exportado (mesma margem usada em buildSVG). */
function svgSize(nodes: MindMapNode[]): { width: number; height: number } {
  if (nodes.length === 0) return { width: 100, height: 100 }
  const pad = 80
  const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y)
  return {
    width: (Math.max(...xs) + pad) - (Math.min(...xs) - pad),
    height: (Math.max(...ys) + pad) - (Math.min(...ys) - pad),
  }
}

function escapeXml(s: string) {
  return (s || '').replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!))
}

function buildSVG(nodes: MindMapNode[], title: string, theme: ReturnType<typeof getTheme>, style: MindMapStyle): string {
  if (nodes.length === 0) return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>'
  const pad = 80
  const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y)
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad
  const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad
  const w = maxX - minX, h = maxY - minY
  const map = new Map(nodes.map(n => [n.id, n]))
  const edges = nodes.filter(n => n.parentId && map.has(n.parentId)).map(n => {
    const p = map.get(n.parentId!)!
    return `<path d="${edgePath(p.x, p.y, n.x, n.y, style.edgeStyle)}" fill="none" stroke="${n.color || theme.edge}" stroke-width="2" stroke-opacity="0.75" stroke-linecap="round" stroke-linejoin="round"/>`
  }).join('')
  const rects = nodes.map(n => {
    const isRoot = n.parentId === null
    const shape = n.shape || style.nodeShape
    const tw = estimateWidth(n.text)
    const fill = n.color || (isRoot ? theme.rootBg : theme.nodeBg)
    const tc = n.textColor || (n.color ? idealTextColor(n.color) : (isRoot ? theme.rootText : theme.nodeText))
    const border = n.borderColor || theme.nodeBorder
    const rx = shape === 'pill' ? 18 : shape === 'rect' ? 4 : shape === 'ellipse' ? tw / 2 : 12
    return `<g transform="translate(${n.x - tw / 2}, ${n.y - 18})">
      <rect width="${tw}" height="36" rx="${rx}" fill="${fill}" stroke="${border}"/>
      <text x="${tw / 2}" y="23" font-family="system-ui, sans-serif" font-size="14" font-weight="${isRoot ? 700 : 500}" fill="${tc}" text-anchor="middle">${escapeXml((n.icon ? n.icon + ' ' : '') + n.text.slice(0, 28))}</text>
    </g>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${minX} ${minY} ${w} ${h}">
    <rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="${theme.canvasBg}"/>
    ${edges}${rects}
    <text x="${minX + 16}" y="${maxY - 16}" font-family="system-ui" font-size="13" fill="${theme.nodeText}" opacity="0.6">${escapeXml(title)} · domineaqui.com.br</text>
  </svg>`
}
