'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  FolderPlus,
  Package,
  FileText,
  Star,
  StarOff,
  Search,
  X,
  Save,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FolderClosed,
  Link2,
  Image as ImageIcon,
  Video,
  File,
  Download,
  Gift,
  DollarSign,
  GripVertical,
  CornerDownRight,
  Loader2,
  Share2,
  CheckCheck,
  Play,
  ShieldCheck,
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Zap,
  Clock,
  CreditCard,
  BadgeCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  Trash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AppShell } from '@/components/app-shell'
import { upload } from '@vercel/blob/client'

type ModalMode = 'create' | 'edit'
type ActiveSection = 'materials' | 'folders' | 'packages'

interface Material {
  _id: string
  title: string
  description: string
  coverImage: string
  type: string
  downloadUrl: string
  previewUrl: string
  folderId: string | null
  moduloId: string
  tags: string[]
  allowedGroups: string[]
  videoDuration?: number
  pricing: 'free' | 'paid'
  price: number
  stripePriceId: string
  downloadCount: number
  viewCount: number
  isHidden: boolean
  isFeatured: boolean
  order: number
  createdByName: string
  createdAt: string
  // PDF interno
  _hasPdf?: boolean
  _pdfFile?: {
    originalFilename: string
    sizeBytes: number
    uploadedByName: string
    uploadedAt: string
  }
}

interface Folder {
  _id: string
  name: string
  description: string
  coverImage: string
  color: string
  icon: string
  parentFolderId: string | null
  moduloId: string
  order: number
  isHidden: boolean
  createdByName: string
  createdAt: string
}

interface MaterialPackage {
  _id: string
  title: string
  description: string
  coverImage: string
  materialIds: string[]
  materials: any[]
  tags: string[]
  allowedGroups: string[]
  pricing: 'free' | 'paid'
  price: number
  originalPrice: number
  stripePriceId: string
  downloadCount: number
  viewCount: number
  isHidden: boolean
  isFeatured: boolean
  order: number
  createdByName: string
  createdAt: string
}

const typeOptions = [
  { value: 'pdf', label: 'PDF', icon: <FileText className="h-4 w-4" /> },
  { value: 'video', label: 'Vídeo (download)', icon: <Video className="h-4 w-4" /> },
  { value: 'video_embed', label: 'Vídeo Embed', icon: <Play className="h-4 w-4" /> },
  { value: 'link', label: 'Link', icon: <Link2 className="h-4 w-4" /> },
  { value: 'image', label: 'Imagem', icon: <ImageIcon className="h-4 w-4" /> },
  { value: 'document', label: 'Documento', icon: <File className="h-4 w-4" /> },
  { value: 'other', label: 'Outro', icon: <File className="h-4 w-4" /> },
]

const ACCESS_GROUPS = [
  { id: 'gratuito', label: 'Gratuito', color: '#6b7280', emoji: '🆓' },
  { id: 'trial', label: 'Trial', color: '#3b82f6', emoji: '⏱️' },
  { id: 'essential', label: 'Essential', color: '#8b5cf6', emoji: '⭐' },
  { id: 'premium', label: 'Premium', color: '#f59e0b', emoji: '👑' },
  { id: 'monitor', label: 'Monitor', color: '#10b981', emoji: '🎓' },
] as const

// ─── Tree Node Type ─────────────────────────────────────────
interface FolderTreeNode extends Folder {
  children: FolderTreeNode[]
  depth: number
}

function buildTree(folders: Folder[]): FolderTreeNode[] {
  const map = new Map<string, FolderTreeNode>()
  const roots: FolderTreeNode[] = []

  // Create nodes
  for (const f of folders) {
    map.set(f._id, { ...f, children: [], depth: 0 })
  }

  // Build tree
  for (const node of map.values()) {
    if (node.parentFolderId && map.has(node.parentFolderId)) {
      const parent = map.get(node.parentFolderId)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children by order
  const sortChildren = (nodes: FolderTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order)
    nodes.forEach(n => sortChildren(n.children))
  }
  sortChildren(roots)

  return roots
}

function flattenTree(nodes: FolderTreeNode[]): FolderTreeNode[] {
  const result: FolderTreeNode[] = []
  const walk = (list: FolderTreeNode[]) => {
    for (const n of list) {
      result.push(n)
      walk(n.children)
    }
  }
  walk(nodes)
  return result
}

// ═══════════════════════════════════════════════════════════════
// Admin Content
// ═══════════════════════════════════════════════════════════════
function AdminMateriaisContent() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('materials')
  const [materials, setMaterials] = useState<Material[]>([])
  const [allFolders, setAllFolders] = useState<Folder[]>([])
  const [packages, setPackages] = useState<MaterialPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal states
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [saving, setSaving] = useState(false)

  // Folder tree state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null)
  const [reorderSaving, setReorderSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Access management
  const [accessModal, setAccessModal] = useState<{ itemId: string; itemType: 'material' | 'package'; title: string } | null>(null)
  const [accessPurchases, setAccessPurchases] = useState<any[]>([])
  const [accessLoading, setAccessLoading] = useState(false)
  const [grantEmail, setGrantEmail] = useState('')
  const [grantLoading, setGrantLoading] = useState(false)
  const [grantError, setGrantError] = useState('')
  // User picker
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<{ id: string; name: string; email: string; accountType: string }[]>([])
  const [userSearchLoading, setUserSearchLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; accountType: string } | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const userSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Estado do upload de PDF ─────────────────────────────────────────
  type PdfInfo = { originalFilename: string; sizeBytes: number; uploadedByName: string; uploadedAt: string }
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0)
  const [pdfUploadError, setPdfUploadError] = useState('')
  const [pdfRemoving, setPdfRemoving] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const copyLink = (type: 'folder' | 'material' | 'package', id: string) => {
    const base = window.location.origin
    let url = `${base}/materiais`
    if (type === 'folder') url += `?folder=${id}`
    else if (type === 'material') url += `?material=${id}`
    else url += `?tab=packages&package=${id}`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // User search with debounce
  const handleUserSearch = (q: string) => {
    setUserSearch(q)
    setSelectedUser(null)
    setGrantError('')
    if (userSearchRef.current) clearTimeout(userSearchRef.current)
    if (q.trim().length < 2) { setUserResults([]); setShowDropdown(false); return }
    setUserSearchLoading(true)
    userSearchRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setUserResults(data.users || [])
          setShowDropdown(true)
        }
      } finally { setUserSearchLoading(false) }
    }, 300)
  }

  const selectUser = (u: { id: string; name: string; email: string; accountType: string }) => {
    setSelectedUser(u)
    setUserSearch(u.name ? `${u.name} — ${u.email}` : u.email)
    setShowDropdown(false)
    setGrantError('')
  }

  // Access management functions
  const openAccessModal = async (itemId: string, itemType: 'material' | 'package', title: string) => {
    setAccessModal({ itemId, itemType, title })
    setGrantEmail('')
    setGrantError('')
    setUserSearch('')
    setUserResults([])
    setSelectedUser(null)
    setShowDropdown(false)
    setAccessLoading(true)
    try {
      const res = await fetch(`/api/materiais/admin-access?itemId=${itemId}&itemType=${itemType}`)
      if (res.ok) setAccessPurchases((await res.json()).purchases || [])
    } finally {
      setAccessLoading(false)
    }
  }

  const grantAccess = async () => {
    if (!accessModal) return
    // Resolve email: selected user takes priority, then raw email input, then typed search string
    const email = selectedUser?.email || grantEmail.trim() || userSearch.trim()
    if (!email) return
    setGrantLoading(true)
    setGrantError('')
    try {
      const res = await fetch('/api/materiais/admin-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: accessModal.itemId, itemType: accessModal.itemType, userEmail: email }),
      })
      const data = await res.json()
      if (!res.ok) { setGrantError(data.error || 'Erro ao conceder acesso'); return }
      // Reset picker
      setGrantEmail('')
      setUserSearch('')
      setSelectedUser(null)
      setUserResults([])
      // Refresh list
      const listRes = await fetch(`/api/materiais/admin-access?itemId=${accessModal.itemId}&itemType=${accessModal.itemType}`)
      if (listRes.ok) setAccessPurchases((await listRes.json()).purchases || [])
    } catch { setGrantError('Erro ao conceder acesso') }
    finally { setGrantLoading(false) }
  }

  const revokeAccess = async (purchaseId: string) => {
    if (!confirm('Revogar acesso deste usuário?')) return
    try {
      await fetch(`/api/materiais/admin-access?purchaseId=${purchaseId}`, { method: 'DELETE' })
      setAccessPurchases(prev => prev.filter(p => p._id !== purchaseId))
    } catch { alert('Erro ao revogar acesso') }
  }

  // Form states
  const [materialForm, setMaterialForm] = useState({
    _id: '',
    title: '',
    description: '',
    coverImage: '',
    type: 'pdf',
    downloadUrl: '',
    previewUrl: '',
    folderId: '',
    moduloId: '',
    tags: '',
    allowedGroups: [] as string[],
    videoDurationH: 0,
    videoDurationM: 0,
    videoDurationS: 0,
    pricing: 'free' as 'free' | 'paid',
    price: 0,
    stripePriceId: '',
    isHidden: false,
    isFeatured: false,
    order: 0,
  })

  const [folderForm, setFolderForm] = useState({
    _id: '',
    name: '',
    description: '',
    coverImage: '',
    color: '#468152',
    icon: '📁',
    parentFolderId: '',
    moduloId: '',
    order: 0,
    isHidden: false,
  })

  const [packageForm, setPackageForm] = useState({
    _id: '',
    title: '',
    description: '',
    coverImage: '',
    materialIds: [] as string[],
    tags: '',
    allowedGroups: [] as string[],
    pricing: 'free' as 'free' | 'paid',
    price: 0,
    originalPrice: 0,
    stripePriceId: '',
    isHidden: false,
    isFeatured: false,
    order: 0,
  })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [matRes, foldRes, pkgRes] = await Promise.all([
        fetch('/api/materiais'),
        fetch('/api/materiais/folders?all=true'),
        fetch('/api/materiais/packages'),
      ])
      if (matRes.ok) setMaterials((await matRes.json()).materials || [])
      if (foldRes.ok) setAllFolders((await foldRes.json()).folders || [])
      if (pkgRes.ok) setPackages((await pkgRes.json()).packages || [])
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ─── Tree data ─────────────────────────────────────────────
  const folderTree = useMemo(() => buildTree(allFolders), [allFolders])
  const flatFolders = useMemo(() => flattenTree(folderTree), [folderTree])

  const toggleExpand = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const expandAll = () => setExpandedFolders(new Set(allFolders.map(f => f._id)))
  const collapseAll = () => setExpandedFolders(new Set())

  // Count materials in folder
  const materialsInFolder = useCallback((folderId: string): number => {
    return materials.filter(m => m.folderId === folderId).length
  }, [materials])

  // ─── Drag and Drop for Folders ────────────────────────────
  const isDescendant = useCallback((parentId: string, childId: string): boolean => {
    const check = (folders: FolderTreeNode[]): boolean => {
      for (const f of folders) {
        if (f._id === parentId) {
          const searchChild = (nodes: FolderTreeNode[]): boolean => {
            for (const n of nodes) {
              if (n._id === childId) return true
              if (searchChild(n.children)) return true
            }
            return false
          }
          return searchChild(f.children)
        }
        if (check(f.children)) return true
      }
      return false
    }
    return check(folderTree)
  }, [folderTree])

  const handleDragStart = (e: React.DragEvent, folderId: string) => {
    setDraggingFolderId(folderId)
    e.dataTransfer.setData('text/plain', folderId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggingFolderId === targetId) return
    if (draggingFolderId && isDescendant(draggingFolderId, targetId)) return
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolderId(targetId)
  }

  const handleDragLeave = () => {
    setDragOverFolderId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetParentId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolderId(null)
    setDraggingFolderId(null)

    const draggedId = e.dataTransfer.getData('text/plain')
    if (!draggedId || draggedId === targetParentId) return
    if (targetParentId && isDescendant(draggedId, targetParentId)) return

    // Move folder: update parentFolderId
    setReorderSaving(true)
    try {
      const siblings = allFolders.filter(f =>
        (f.parentFolderId || null) === targetParentId && f._id !== draggedId
      )
      const updates = [
        { _id: draggedId, order: siblings.length, parentFolderId: targetParentId },
      ]

      await fetch('/api/materiais/folders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      // Expand target so user sees the result
      if (targetParentId) {
        setExpandedFolders(prev => new Set([...prev, targetParentId]))
      }

      fetchAll()
    } catch {
      alert('Erro ao mover pasta')
    } finally {
      setReorderSaving(false)
    }
  }

  const handleDropOnRoot = (e: React.DragEvent) => {
    handleDrop(e, null)
  }

  const moveFolderUp = async (folder: Folder) => {
    const siblings = allFolders
      .filter(f => (f.parentFolderId || null) === (folder.parentFolderId || null))
      .sort((a, b) => a.order - b.order)
    const idx = siblings.findIndex(s => s._id === folder._id)
    if (idx <= 0) return

    const updates = siblings.map((s, i) => ({
      _id: s._id,
      order: i === idx ? idx - 1 : i === idx - 1 ? idx : i,
      parentFolderId: s.parentFolderId || null,
    }))

    setReorderSaving(true)
    try {
      await fetch('/api/materiais/folders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      fetchAll()
    } finally {
      setReorderSaving(false)
    }
  }

  const moveFolderDown = async (folder: Folder) => {
    const siblings = allFolders
      .filter(f => (f.parentFolderId || null) === (folder.parentFolderId || null))
      .sort((a, b) => a.order - b.order)
    const idx = siblings.findIndex(s => s._id === folder._id)
    if (idx >= siblings.length - 1) return

    const updates = siblings.map((s, i) => ({
      _id: s._id,
      order: i === idx ? idx + 1 : i === idx + 1 ? idx : i,
      parentFolderId: s.parentFolderId || null,
    }))

    setReorderSaving(true)
    try {
      await fetch('/api/materiais/folders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      fetchAll()
    } finally {
      setReorderSaving(false)
    }
  }

  // ─── Material CRUD ────────────────────────────────────────
  const openMaterialModal = (mode: ModalMode, material?: Material) => {
    setModalMode(mode)
    setPdfUploadError('')
    setPdfUploadProgress(0)
    if (mode === 'edit' && material) {
      setMaterialForm({
        _id: material._id,
        title: material.title,
        description: material.description || '',
        coverImage: material.coverImage || '',
        type: material.type,
        downloadUrl: material.downloadUrl,
        previewUrl: material.previewUrl || '',
        folderId: material.folderId || '',
        moduloId: material.moduloId || '',
        tags: (material.tags || []).join(', '),
        allowedGroups: material.allowedGroups || [],
        videoDurationH: material.videoDuration ? Math.floor(material.videoDuration / 3600) : 0,
        videoDurationM: material.videoDuration ? Math.floor((material.videoDuration % 3600) / 60) : 0,
        videoDurationS: material.videoDuration ? material.videoDuration % 60 : 0,
        pricing: material.pricing,
        price: material.price || 0,
        stripePriceId: material.stripePriceId || '',
        isHidden: material.isHidden,
        isFeatured: material.isFeatured,
        order: material.order || 0,
      })
      setPdfInfo(material._pdfFile || null)
    } else {
      setMaterialForm({
        _id: '', title: '', description: '', coverImage: '', type: 'pdf',
        downloadUrl: '', previewUrl: '', folderId: '', moduloId: '', tags: '',
        allowedGroups: [], videoDurationH: 0, videoDurationM: 0, videoDurationS: 0,
        pricing: 'free', price: 0, stripePriceId: '', isHidden: false, isFeatured: false, order: 0,
      })
      setPdfInfo(null)
    }
    setShowMaterialModal(true)
  }

  const saveMaterial = async () => {
    const needsUrl = materialForm.type !== 'pdf' || (!pdfInfo && !materialForm.downloadUrl.trim())
    if (!materialForm.title || needsUrl) {
      const msg = materialForm.type === 'pdf'
        ? 'Título obrigatório. Para PDF: forneça URL externa ou faça upload de um PDF.'
        : 'Título e URL/código embed são obrigatórios'
      alert(msg)
      return
    }
    setSaving(true)
    try {
      const isVideo = materialForm.type === 'video' || materialForm.type === 'video_embed'
      const totalSeconds = isVideo
        ? (materialForm.videoDurationH * 3600 + materialForm.videoDurationM * 60 + materialForm.videoDurationS)
        : 0
      const body = {
        ...materialForm,
        tags: materialForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        folderId: materialForm.folderId || null,
        allowedGroups: materialForm.allowedGroups,
        videoDuration: totalSeconds || undefined,
      }
      const res = await fetch('/api/materiais', {
        method: modalMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { setShowMaterialModal(false); fetchAll() }
      else alert((await res.json()).error || 'Erro ao salvar')
    } catch { alert('Erro ao salvar material') }
    finally { setSaving(false) }
  }

  // ─── PDF Upload ───────────────────────────────────────────────────────
  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validações client-side (o servidor re-valida — não confiar só nessas)
    if (file.type !== 'application/pdf') {
      setPdfUploadError('Apenas arquivos PDF são permitidos.')
      return
    }
    const maxMb = parseInt(process.env.NEXT_PUBLIC_MATERIAL_UPLOAD_MAX_MB || '100', 10) || 100
    if (file.size > maxMb * 1024 * 1024) {
      setPdfUploadError(`Arquivo muito grande. Máximo: ${maxMb} MB.`)
      return
    }
    if (!materialForm._id) {
      setPdfUploadError('Salve o material primeiro antes de fazer o upload do PDF.')
      return
    }

    setPdfUploadError('')
    setPdfUploading(true)
    setPdfUploadProgress(0)

    try {
      await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/materiais/upload',
        clientPayload: JSON.stringify({
          materialId: materialForm._id,
          adminName: 'Admin',
          fileSize: file.size,
        }),
        onUploadProgress: ({ percentage }) => {
          setPdfUploadProgress(Math.round(percentage))
        },
      })

      // Buscar info atualizada do PDF
      const res = await fetch(`/api/materiais/upload?materialId=${materialForm._id}`)
      const data = await res.json()
      if (data.hasPdf) {
        setPdfInfo(data.pdfFile)
      }
      fetchAll()
    } catch (err: any) {
      setPdfUploadError(err?.message || 'Erro ao fazer upload do PDF.')
    } finally {
      setPdfUploading(false)
      setPdfUploadProgress(0)
      if (pdfInputRef.current) pdfInputRef.current.value = ''
    }
  }

  const handlePdfRemove = async () => {
    if (!materialForm._id || !confirm('Remover PDF deste material?')) return
    setPdfRemoving(true)
    try {
      const res = await fetch(`/api/materiais/upload?materialId=${materialForm._id}`, { method: 'DELETE' })
      if (res.ok) {
        setPdfInfo(null)
        fetchAll()
      } else {
        const d = await res.json()
        setPdfUploadError(d.error || 'Erro ao remover PDF.')
      }
    } catch {
      setPdfUploadError('Erro ao remover PDF.')
    } finally {
      setPdfRemoving(false)
    }
  }

  const deleteMaterial = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este material?')) return
    try { await fetch(`/api/materiais?id=${id}`, { method: 'DELETE' }); fetchAll() }
    catch { alert('Erro ao excluir') }
  }

  const toggleMaterialProp = async (material: Material, prop: 'isHidden' | 'isFeatured') => {
    try {
      await fetch('/api/materiais', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: material._id, [prop]: !material[prop] }),
      })
      fetchAll()
    } catch { alert('Erro ao atualizar') }
  }

  // ─── Folder CRUD ──────────────────────────────────────────
  const openFolderModal = (mode: ModalMode, folder?: Folder, parentId?: string) => {
    setModalMode(mode)
    if (mode === 'edit' && folder) {
      setFolderForm({
        _id: folder._id, name: folder.name, description: folder.description || '',
        coverImage: folder.coverImage || '', color: folder.color || '#468152',
        icon: folder.icon || '📁', parentFolderId: folder.parentFolderId || '',
        moduloId: folder.moduloId || '', order: folder.order || 0, isHidden: folder.isHidden,
      })
    } else {
      setFolderForm({
        _id: '', name: '', description: '', coverImage: '', color: '#468152',
        icon: '📁', parentFolderId: parentId || '', moduloId: '', order: 0, isHidden: false,
      })
    }
    setShowFolderModal(true)
  }

  const saveFolder = async () => {
    if (!folderForm.name) { alert('Nome da pasta é obrigatório'); return }
    setSaving(true)
    try {
      const body = { ...folderForm, parentFolderId: folderForm.parentFolderId || null }
      const res = await fetch('/api/materiais/folders', {
        method: modalMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { setShowFolderModal(false); fetchAll() }
      else alert((await res.json()).error || 'Erro ao salvar')
    } catch { alert('Erro ao salvar pasta') }
    finally { setSaving(false) }
  }

  const deleteFolder = async (id: string) => {
    if (!confirm('Tem certeza? Os materiais e subpastas serão movidos para a raiz.')) return
    try { await fetch(`/api/materiais/folders?id=${id}`, { method: 'DELETE' }); fetchAll() }
    catch { alert('Erro ao excluir') }
  }

  // ─── Package CRUD ─────────────────────────────────────────
  const openPackageModal = (mode: ModalMode, pkg?: MaterialPackage) => {
    setModalMode(mode)
    if (mode === 'edit' && pkg) {
      setPackageForm({
        _id: pkg._id, title: pkg.title, description: pkg.description || '',
        coverImage: pkg.coverImage || '', materialIds: pkg.materialIds || [],
        tags: (pkg.tags || []).join(', '), allowedGroups: pkg.allowedGroups || [],
        pricing: pkg.pricing, price: pkg.price || 0, originalPrice: pkg.originalPrice || 0,
        stripePriceId: pkg.stripePriceId || '', isHidden: pkg.isHidden,
        isFeatured: pkg.isFeatured, order: pkg.order || 0,
      })
    } else {
      setPackageForm({
        _id: '', title: '', description: '', coverImage: '', materialIds: [],
        tags: '', allowedGroups: [], pricing: 'free', price: 0, originalPrice: 0,
        stripePriceId: '', isHidden: false, isFeatured: false, order: 0,
      })
    }
    setShowPackageModal(true)
  }

  const savePackage = async () => {
    if (!packageForm.title) { alert('Título do pacote é obrigatório'); return }
    setSaving(true)
    try {
      const body = {
        ...packageForm,
        tags: packageForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      const res = await fetch('/api/materiais/packages', {
        method: modalMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { setShowPackageModal(false); fetchAll() }
      else alert((await res.json()).error || 'Erro ao salvar')
    } catch { alert('Erro ao salvar pacote') }
    finally { setSaving(false) }
  }

  const deletePackage = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pacote?')) return
    try { await fetch(`/api/materiais/packages?id=${id}`, { method: 'DELETE' }); fetchAll() }
    catch { alert('Erro ao excluir') }
  }

  const toggleMaterialInPackage = (materialId: string) => {
    setPackageForm(prev => ({
      ...prev,
      materialIds: prev.materialIds.includes(materialId)
        ? prev.materialIds.filter(id => id !== materialId)
        : [...prev.materialIds, materialId],
    }))
  }

  // ─── Filtered data ────────────────────────────────────────
  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredPackages = packages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    totalMaterials: materials.length,
    totalFolders: allFolders.length,
    totalPackages: packages.length,
    totalDownloads: materials.reduce((acc, m) => acc + (m.downloadCount || 0), 0),
    freeMaterials: materials.filter(m => m.pricing === 'free').length,
    paidMaterials: materials.filter(m => m.pricing === 'paid').length,
  }

  // ─── Render Tree Node ─────────────────────────────────────
  const renderFolderNode = (node: FolderTreeNode) => {
    const isExpanded = expandedFolders.has(node._id)
    const hasChildren = node.children.length > 0
    const matCount = materialsInFolder(node._id)
    const isDragOver = dragOverFolderId === node._id
    const isDragging = draggingFolderId === node._id

    return (
      <div key={node._id} className={isDragging ? 'opacity-40' : ''}>
        <div
          draggable
          onDragStart={e => handleDragStart(e, node._id)}
          onDragOver={e => handleDragOver(e, node._id)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, node._id)}
          onDragEnd={() => { setDraggingFolderId(null); setDragOverFolderId(null) }}
          className={`group flex items-center gap-2 py-2 px-2 rounded-xl transition-all cursor-grab active:cursor-grabbing ${
            isDragOver
              ? 'bg-primary/15 border-2 border-dashed border-primary/50 scale-[1.02]'
              : 'hover:bg-muted/60 border-2 border-transparent'
          } ${node.isHidden ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${node.depth * 24 + 8}px` }}
        >
          {/* Grip handle */}
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0 cursor-grab" />

          {/* Expand toggle */}
          <button
            onClick={() => toggleExpand(node._id)}
            className="h-5 w-5 flex items-center justify-center flex-shrink-0 rounded hover:bg-muted transition-colors"
          >
            {hasChildren ? (
              isExpanded
                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <span className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Folder icon */}
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
            style={{ backgroundColor: `${node.color || '#468152'}20` }}
          >
            {node.icon || (isExpanded ? '📂' : '📁')}
          </div>

          {/* Name */}
          <span className="font-medium text-sm truncate flex-1">{node.name}</span>

          {/* Badges */}
          {matCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
              {matCount}
            </span>
          )}
          {hasChildren && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
              {node.children.length} sub
            </span>
          )}
          {node.isHidden && <EyeOff className="h-3 w-3 text-muted-foreground flex-shrink-0" />}

          {/* Actions */}
          <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => openFolderModal('create', undefined, node._id)}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
              title="Criar subpasta"
            >
              <FolderPlus className="h-3.5 w-3.5 text-primary" />
            </button>
            <button
              onClick={() => moveFolderUp(node)}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground text-xs font-bold"
              title="Mover para cima"
            >
              ▲
            </button>
            <button
              onClick={() => moveFolderDown(node)}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground text-xs font-bold"
              title="Mover para baixo"
            >
              ▼
            </button>
            <button
              onClick={() => openFolderModal('edit', node)}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); copyLink('folder', node._id) }}
              className={`h-6 w-6 flex items-center justify-center rounded transition-colors ${copiedId === node._id ? 'text-green-500' : 'text-muted-foreground hover:bg-muted'}`}
              title={copiedId === node._id ? 'Link copiado!' : 'Copiar link'}
            >
              {copiedId === node._id ? <CheckCheck className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => deleteFolder(node._id)}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-destructive"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {node.children.map(child => renderFolderNode(child))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Materiais', value: stats.totalMaterials, icon: <FileText className="h-4 w-4" />, color: 'text-blue-500' },
          { label: 'Pastas', value: stats.totalFolders, icon: <FolderOpen className="h-4 w-4" />, color: 'text-amber-500' },
          { label: 'Pacotes', value: stats.totalPackages, icon: <Package className="h-4 w-4" />, color: 'text-violet-500' },
          { label: 'Downloads', value: stats.totalDownloads, icon: <Download className="h-4 w-4" />, color: 'text-green-500' },
          { label: 'Gratuitos', value: stats.freeMaterials, icon: <Gift className="h-4 w-4" />, color: 'text-emerald-500' },
          { label: 'Pagos', value: stats.paidMaterials, icon: <DollarSign className="h-4 w-4" />, color: 'text-orange-500' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-3">
            <div className={`flex items-center gap-1.5 mb-1 ${stat.color}`}>
              {stat.icon}
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Search + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
          {(['materials', 'folders', 'packages'] as const).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSection === section
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {section === 'materials' ? 'Materiais' : section === 'folders' ? 'Pastas' : 'Pacotes'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg" />
        </div>

        <div className="ml-auto flex gap-2">
          {activeSection === 'materials' && (
            <Button onClick={() => openMaterialModal('create')} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Material
            </Button>
          )}
          {activeSection === 'folders' && (
            <>
              <Button variant="outline" size="sm" onClick={expandAll} className="gap-1">Expandir</Button>
              <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1">Recolher</Button>
              <Button onClick={() => openFolderModal('create')} size="sm" className="gap-1.5">
                <FolderPlus className="h-4 w-4" /> Nova Pasta
              </Button>
            </>
          )}
          {activeSection === 'packages' && (
            <Button onClick={() => openPackageModal('create')} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Pacote
            </Button>
          )}
        </div>
      </div>

      {/* ═══ Materials List ═══ */}
      {activeSection === 'materials' && (
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum material encontrado</p>
            </div>
          ) : (
            filteredMaterials.map((material) => (
              <div
                key={material._id}
                className={`group flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-muted/50 ${material.isHidden ? 'opacity-60' : ''}`}
              >
                <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {material.coverImage ? (
                    <img src={material.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      {typeOptions.find(t => t.value === material.type)?.icon || <File className="h-5 w-5" />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">{material.title}</h4>
                    {material.isFeatured && <Star className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 fill-amber-500" />}
                    {material.isHidden && <EyeOff className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    <span className="uppercase font-medium">{material.type === 'video_embed' ? '▶ Embed' : material.type}</span>
                    <span>{material.pricing === 'free' ? 'Grátis' : `R$ ${material.price?.toFixed(2)}`}</span>
                    <span className="flex items-center gap-0.5"><Download className="h-3 w-3" /> {material.downloadCount}</span>
                    {material._hasPdf && (
                      <span className="flex items-center gap-0.5 text-blue-500 font-medium">
                        <Upload className="h-3 w-3" /> PDF
                      </span>
                    )}
                    {material.folderId && (
                      <span className="flex items-center gap-0.5">
                        <FolderOpen className="h-3 w-3" />
                        {allFolders.find(f => f._id === material.folderId)?.name || 'Pasta'}
                      </span>
                    )}
                    {material.allowedGroups?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-violet-500" />
                        {material.allowedGroups.map(g => (
                          <span key={g} className="px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                            style={{ background: ACCESS_GROUPS.find(ag => ag.id === g)?.color + '20', color: ACCESS_GROUPS.find(ag => ag.id === g)?.color }}>
                            {ACCESS_GROUPS.find(ag => ag.id === g)?.label || g}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleMaterialProp(material, 'isFeatured')} title={material.isFeatured ? 'Remover destaque' : 'Destacar'}>
                    {material.isFeatured ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <StarOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleMaterialProp(material, 'isHidden')} title={material.isHidden ? 'Mostrar' : 'Ocultar'}>
                    {material.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-violet-500 hover:text-violet-600" onClick={() => openAccessModal(material._id, 'material', material.title)} title="Gerenciar acessos">
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className={`h-8 w-8 ${copiedId === material._id ? 'text-green-500' : ''}`}
                    onClick={() => copyLink('material', material._id)}
                    title={copiedId === material._id ? 'Link copiado!' : 'Copiar link'}
                  >
                    {copiedId === material._id ? <CheckCheck className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openMaterialModal('edit', material)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMaterial(material._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ Folders Tree ═══ */}
      {activeSection === 'folders' && (
        <div
          className="rounded-xl border bg-background p-3 min-h-[300px]"
          onDragOver={e => { e.preventDefault(); setDragOverFolderId('__root__') }}
          onDragLeave={() => setDragOverFolderId(null)}
          onDrop={handleDropOnRoot}
        >
          {reorderSaving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 px-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
            </div>
          )}

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted animate-pulse mb-2" />
            ))
          ) : allFolders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="mb-2">Nenhuma pasta criada</p>
              <Button size="sm" onClick={() => openFolderModal('create')} className="gap-1.5">
                <FolderPlus className="h-4 w-4" /> Criar primeira pasta
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-2 px-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <GripVertical className="h-3 w-3" />
                  Arraste pastas para reorganizar ou mover para dentro de outra pasta
                </p>
              </div>

              {/* Root drop zone indicator */}
              <div className={`rounded-lg mb-1 transition-all ${
                dragOverFolderId === '__root__' ? 'bg-primary/10 border-2 border-dashed border-primary/40 p-2' : 'p-0'
              }`}>
                {dragOverFolderId === '__root__' && (
                  <p className="text-xs text-primary text-center font-medium">Soltar aqui para mover para a raiz</p>
                )}
              </div>

              <div className="space-y-0.5">
                {folderTree.map(node => renderFolderNode(node))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ Packages List ═══ */}
      {activeSection === 'packages' && (
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum pacote criado</p>
            </div>
          ) : (
            filteredPackages.map((pkg) => (
              <div
                key={pkg._id}
                className={`group flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-muted/50 ${pkg.isHidden ? 'opacity-60' : ''}`}
              >
                <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-violet-500/10 text-violet-500 flex-shrink-0">
                  <Package className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">{pkg.title}</h4>
                    {pkg.isFeatured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    <span>{pkg.materialIds?.length || 0} materiais</span>
                    <span>{pkg.pricing === 'free' ? 'Grátis' : `R$ ${pkg.price?.toFixed(2)}`}</span>
                    <span className="flex items-center gap-0.5"><Download className="h-3 w-3" /> {pkg.downloadCount}</span>
                    {pkg.allowedGroups?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-violet-500" />
                        {pkg.allowedGroups.map(g => (
                          <span key={g} className="px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                            style={{ background: ACCESS_GROUPS.find(ag => ag.id === g)?.color + '20', color: ACCESS_GROUPS.find(ag => ag.id === g)?.color }}>
                            {ACCESS_GROUPS.find(ag => ag.id === g)?.label || g}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-violet-500 hover:text-violet-600" onClick={() => openAccessModal(pkg._id, 'package', pkg.title)} title="Gerenciar acessos">
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className={`h-8 w-8 ${copiedId === pkg._id ? 'text-green-500' : ''}`}
                    onClick={() => copyLink('package', pkg._id)}
                    title={copiedId === pkg._id ? 'Link copiado!' : 'Copiar link'}
                  >
                    {copiedId === pkg._id ? <CheckCheck className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPackageModal('edit', pkg)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deletePackage(pkg._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══════════════ Material Modal ═══════════════ */}
      <AnimatePresence>
        {showMaterialModal && (
          <ModalBackdrop onClose={() => setShowMaterialModal(false)}>
            <ModalCard title={modalMode === 'create' ? 'Novo Material' : 'Editar Material'} onClose={() => setShowMaterialModal(false)}>
              <div className="space-y-4">
                <Field label="Título *">
                  <Input value={materialForm.title} onChange={e => setMaterialForm(p => ({ ...p, title: e.target.value }))} placeholder="Nome do material" />
                </Field>

                <Field label="Descrição">
                  <textarea value={materialForm.description} onChange={e => setMaterialForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição do material" className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px] resize-y" />
                </Field>

                <Field label="URL da Capa">
                  <Input value={materialForm.coverImage} onChange={e => setMaterialForm(p => ({ ...p, coverImage: e.target.value }))} placeholder="https://..." />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tipo">
                    <select value={materialForm.type} onChange={e => setMaterialForm(p => ({ ...p, type: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm h-10">
                      {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Pasta">
                    <select value={materialForm.folderId} onChange={e => setMaterialForm(p => ({ ...p, folderId: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm h-10">
                      <option value="">Nenhuma (raiz)</option>
                      {flatFolders.map(f => (
                        <option key={f._id} value={f._id}>{'─'.repeat(f.depth)} {f.icon} {f.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label={materialForm.type === 'video_embed' ? 'Código Embed ou URL do Vídeo *' : materialForm.type === 'pdf' ? 'URL Externa de Download (opcional se PDF interno)' : 'URL de Download *'}>
                  {materialForm.type === 'video_embed' ? (
                    <>
                      <Textarea
                        value={materialForm.downloadUrl}
                        onChange={e => setMaterialForm(p => ({ ...p, downloadUrl: e.target.value }))}
                        placeholder="Cole o código embed completo do vídeo (Wistia, YouTube, Vimeo, etc.) ou uma URL de embed"
                        rows={5}
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Aceita o código embed completo (HTML) ou a URL direta do embed. Igual ao campo de aulas.
                      </p>
                    </>
                  ) : (
                    <Input value={materialForm.downloadUrl} onChange={e => setMaterialForm(p => ({ ...p, downloadUrl: e.target.value }))}
                      placeholder={materialForm.type === 'pdf' ? 'https://drive.google.com/... (opcional se usar upload abaixo)' : 'https://...'} />
                  )}
                  {materialForm.type === 'pdf' && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Se enviar um PDF interno (abaixo), o upload tem prioridade sobre esta URL. Mantenha para compatibilidade com materiais antigos.
                    </p>
                  )}
                </Field>

                {/* ── Upload de PDF Interno (apenas type=pdf) ── */}
                {materialForm.type === 'pdf' && (
                  <div className="rounded-xl border-2 border-dashed border-muted p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">PDF Interno (com marca d'água)</span>
                    </div>

                    {/* Info do PDF atual */}
                    {pdfInfo ? (
                      <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">{pdfInfo.originalFilename}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {(pdfInfo.sizeBytes / 1024 / 1024).toFixed(2)} MB · Enviado por {pdfInfo.uploadedByName} · {new Date(pdfInfo.uploadedAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handlePdfRemove}
                          disabled={pdfRemoving}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 shrink-0"
                          title="Remover PDF"
                        >
                          {pdfRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhum PDF enviado ainda.</p>
                    )}

                    {/* Upload */}
                    {!materialForm._id || modalMode === 'create' ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Salve o material primeiro para habilitar o upload de PDF.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <input
                          ref={pdfInputRef}
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfFileChange}
                          disabled={pdfUploading}
                          className="hidden"
                          id="pdf-upload-input"
                        />
                        <label
                          htmlFor="pdf-upload-input"
                          className={`flex items-center gap-2 justify-center w-full rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors
                            ${pdfUploading
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'hover:bg-muted/50 hover:border-blue-400 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                            }`}
                        >
                          {pdfUploading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Enviando... {pdfUploadProgress}%</>
                          ) : (
                            <><Upload className="h-4 w-4" /> {pdfInfo ? 'Substituir PDF' : 'Selecionar PDF'}</>
                          )}
                        </label>

                        {/* Barra de progresso */}
                        {pdfUploading && (
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${pdfUploadProgress}%` }}
                            />
                          </div>
                        )}

                        {pdfUploadError && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {pdfUploadError}
                          </p>
                        )}

                        <p className="text-[11px] text-muted-foreground">
                          Máx. {process.env.NEXT_PUBLIC_MATERIAL_UPLOAD_MAX_MB || '100'} MB · Apenas PDF · Upload direto ao storage (sem limite de serverless)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {materialForm.type !== 'video_embed' && (
                  <Field label="URL de Preview (opcional)">
                    <Input value={materialForm.previewUrl} onChange={e => setMaterialForm(p => ({ ...p, previewUrl: e.target.value }))} placeholder="https://..." />
                  </Field>
                )}

                {(materialForm.type === 'video' || materialForm.type === 'video_embed') && (
                  <Field label="Duração do Vídeo">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <Input type="number" min={0} max={23} value={materialForm.videoDurationH}
                          onChange={e => setMaterialForm(p => ({ ...p, videoDurationH: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-16 h-9 text-center" />
                        <span className="text-[10px] text-muted-foreground">horas</span>
                      </div>
                      <span className="text-lg font-bold text-muted-foreground mb-4">:</span>
                      <div className="flex flex-col items-center gap-1">
                        <Input type="number" min={0} max={59} value={materialForm.videoDurationM}
                          onChange={e => setMaterialForm(p => ({ ...p, videoDurationM: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) }))}
                          className="w-16 h-9 text-center" />
                        <span className="text-[10px] text-muted-foreground">minutos</span>
                      </div>
                      <span className="text-lg font-bold text-muted-foreground mb-4">:</span>
                      <div className="flex flex-col items-center gap-1">
                        <Input type="number" min={0} max={59} value={materialForm.videoDurationS}
                          onChange={e => setMaterialForm(p => ({ ...p, videoDurationS: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) }))}
                          className="w-16 h-9 text-center" />
                        <span className="text-[10px] text-muted-foreground">segundos</span>
                      </div>
                      {(materialForm.videoDurationH > 0 || materialForm.videoDurationM > 0 || materialForm.videoDurationS > 0) && (
                        <span className="text-xs text-muted-foreground ml-2 self-start mt-2.5">
                          = {[
                            materialForm.videoDurationH > 0 && `${materialForm.videoDurationH}h`,
                            materialForm.videoDurationM > 0 && `${materialForm.videoDurationM}min`,
                            materialForm.videoDurationS > 0 && `${materialForm.videoDurationS}s`,
                          ].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                  </Field>
                )}

                <Field label="Tags (separadas por vírgula)">
                  <Input value={materialForm.tags} onChange={e => setMaterialForm(p => ({ ...p, tags: e.target.value }))} placeholder="anatomia, fisiologia, resumo" />
                </Field>

                <Field label="Módulo (opcional)">
                  <Input value={materialForm.moduloId} onChange={e => setMaterialForm(p => ({ ...p, moduloId: e.target.value }))} placeholder="ID do módulo" />
                </Field>

                {/* Access Groups */}
                <div className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-violet-500" />
                    <span className="text-sm font-medium">Restrição de Acesso por Grupo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Deixe todos desmarcados para acesso livre a todos os usuários.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {ACCESS_GROUPS.map(group => {
                      const checked = materialForm.allowedGroups.includes(group.id)
                      return (
                        <label key={group.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${checked ? 'border-current bg-opacity-10' : 'border-muted hover:border-muted-foreground/30'}`}
                          style={checked ? { color: group.color, background: group.color + '15', borderColor: group.color + '50' } : {}}>
                          <input type="checkbox" checked={checked}
                            onChange={e => setMaterialForm(p => ({
                              ...p,
                              allowedGroups: e.target.checked
                                ? [...p.allowedGroups, group.id]
                                : p.allowedGroups.filter(g => g !== group.id)
                            }))}
                            className="rounded" style={checked ? { accentColor: group.color } : {}} />
                          <span className="text-sm">{group.emoji} {group.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  {materialForm.allowedGroups.length > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1">
                      <ShieldCheck className="h-3 w-3" />
                      Apenas {materialForm.allowedGroups.map(g => ACCESS_GROUPS.find(ag => ag.id === g)?.label).join(', ')} poderão acessar
                    </p>
                  )}
                </div>

                <PricingSelector
                  pricing={materialForm.pricing}
                  price={materialForm.price}
                  stripePriceId={materialForm.stripePriceId}
                  onPricingChange={pricing => setMaterialForm(p => ({ ...p, pricing, price: pricing === 'free' ? 0 : p.price }))}
                  onPriceChange={price => setMaterialForm(p => ({ ...p, price }))}
                  onStripeIdChange={stripePriceId => setMaterialForm(p => ({ ...p, stripePriceId }))}
                />

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={materialForm.isFeatured} onChange={e => setMaterialForm(p => ({ ...p, isFeatured: e.target.checked }))} className="rounded" /><span className="text-sm">Destaque</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={materialForm.isHidden} onChange={e => setMaterialForm(p => ({ ...p, isHidden: e.target.checked }))} className="rounded" /><span className="text-sm">Oculto</span></label>
                  <div className="flex items-center gap-2"><label className="text-sm">Ordem:</label><Input type="number" value={materialForm.order} onChange={e => setMaterialForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="w-16 h-8" /></div>
                </div>
              </div>

              <ModalActions onCancel={() => setShowMaterialModal(false)} onSave={saveMaterial} saving={saving} mode={modalMode} />
            </ModalCard>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      {/* ═══════════════ Folder Modal ═══════════════ */}
      <AnimatePresence>
        {showFolderModal && (
          <ModalBackdrop onClose={() => setShowFolderModal(false)}>
            <ModalCard title={modalMode === 'create' ? (folderForm.parentFolderId ? 'Nova Subpasta' : 'Nova Pasta') : 'Editar Pasta'} onClose={() => setShowFolderModal(false)}>
              <div className="space-y-4">
                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <Field label="Ícone">
                    <Input value={folderForm.icon} onChange={e => setFolderForm(p => ({ ...p, icon: e.target.value }))} className="w-16 text-center text-lg" />
                  </Field>
                  <Field label="Nome *">
                    <Input value={folderForm.name} onChange={e => setFolderForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome da pasta" />
                  </Field>
                </div>

                <Field label="Descrição">
                  <textarea value={folderForm.description} onChange={e => setFolderForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição da pasta" className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[60px] resize-y" />
                </Field>

                <Field label="URL da Capa">
                  <Input value={folderForm.coverImage} onChange={e => setFolderForm(p => ({ ...p, coverImage: e.target.value }))} placeholder="https://..." />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cor">
                    <div className="flex items-center gap-2">
                      <input type="color" value={folderForm.color} onChange={e => setFolderForm(p => ({ ...p, color: e.target.value }))} className="h-10 w-10 rounded-lg cursor-pointer border-0" />
                      <Input value={folderForm.color} onChange={e => setFolderForm(p => ({ ...p, color: e.target.value }))} className="flex-1" />
                    </div>
                  </Field>
                  <Field label="Pasta Pai">
                    <select value={folderForm.parentFolderId} onChange={e => setFolderForm(p => ({ ...p, parentFolderId: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm h-10">
                      <option value="">Nenhuma (raiz)</option>
                      {flatFolders.filter(f => f._id !== folderForm._id).map(f => (
                        <option key={f._id} value={f._id}>{'─'.repeat(f.depth)} {f.icon} {f.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Módulo (opcional)">
                  <Input value={folderForm.moduloId} onChange={e => setFolderForm(p => ({ ...p, moduloId: e.target.value }))} placeholder="ID do módulo" />
                </Field>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={folderForm.isHidden} onChange={e => setFolderForm(p => ({ ...p, isHidden: e.target.checked }))} className="rounded" /><span className="text-sm">Oculta</span></label>
                  <div className="flex items-center gap-2"><label className="text-sm">Ordem:</label><Input type="number" value={folderForm.order} onChange={e => setFolderForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="w-16 h-8" /></div>
                </div>
              </div>

              <ModalActions onCancel={() => setShowFolderModal(false)} onSave={saveFolder} saving={saving} mode={modalMode} />
            </ModalCard>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      {/* ═══════════════ Package Modal ═══════════════ */}
      <AnimatePresence>
        {showPackageModal && (
          <ModalBackdrop onClose={() => setShowPackageModal(false)}>
            <ModalCard title={modalMode === 'create' ? 'Novo Pacote' : 'Editar Pacote'} onClose={() => setShowPackageModal(false)}>
              <div className="space-y-4">
                <Field label="Título *">
                  <Input value={packageForm.title} onChange={e => setPackageForm(p => ({ ...p, title: e.target.value }))} placeholder="Nome do pacote" />
                </Field>

                <Field label="Descrição">
                  <textarea value={packageForm.description} onChange={e => setPackageForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição do pacote" className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px] resize-y" />
                </Field>

                <Field label="URL da Capa">
                  <Input value={packageForm.coverImage} onChange={e => setPackageForm(p => ({ ...p, coverImage: e.target.value }))} placeholder="https://..." />
                </Field>

                <Field label="Tags (separadas por vírgula)">
                  <Input value={packageForm.tags} onChange={e => setPackageForm(p => ({ ...p, tags: e.target.value }))} placeholder="anatomia, kit completo" />
                </Field>

                <Field label={`Materiais no Pacote (${packageForm.materialIds.length} selecionados)`}>
                  <div className="max-h-48 overflow-y-auto rounded-xl border p-2 space-y-1">
                    {materials.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum material disponível</p>
                    ) : (
                      materials.map(m => (
                        <label key={m._id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${packageForm.materialIds.includes(m._id) ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}>
                          <input type="checkbox" checked={packageForm.materialIds.includes(m._id)} onChange={() => toggleMaterialInPackage(m._id)} className="rounded" />
                          <span className="text-sm truncate">{m.title}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{m.pricing === 'free' ? 'Grátis' : `R$ ${m.price?.toFixed(2)}`}</span>
                        </label>
                      ))
                    )}
                  </div>
                </Field>

                {/* Access Groups */}
                <div className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-violet-500" />
                    <span className="text-sm font-medium">Restrição de Acesso por Grupo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Deixe todos desmarcados para acesso livre a todos os usuários.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {ACCESS_GROUPS.map(group => {
                      const checked = packageForm.allowedGroups.includes(group.id)
                      return (
                        <label key={group.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${checked ? 'border-current bg-opacity-10' : 'border-muted hover:border-muted-foreground/30'}`}
                          style={checked ? { color: group.color, background: group.color + '15', borderColor: group.color + '50' } : {}}>
                          <input type="checkbox" checked={checked}
                            onChange={e => setPackageForm(p => ({
                              ...p,
                              allowedGroups: e.target.checked
                                ? [...p.allowedGroups, group.id]
                                : p.allowedGroups.filter(g => g !== group.id)
                            }))}
                            className="rounded" style={checked ? { accentColor: group.color } : {}} />
                          <span className="text-sm">{group.emoji} {group.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  {packageForm.allowedGroups.length > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1">
                      <ShieldCheck className="h-3 w-3" />
                      Apenas {packageForm.allowedGroups.map(g => ACCESS_GROUPS.find(ag => ag.id === g)?.label).join(', ')} poderão acessar
                    </p>
                  )}
                </div>

                <PricingSelector
                  pricing={packageForm.pricing}
                  price={packageForm.price}
                  stripePriceId={packageForm.stripePriceId}
                  onPricingChange={pricing => setPackageForm(p => ({ ...p, pricing, price: pricing === 'free' ? 0 : p.price }))}
                  onPriceChange={price => setPackageForm(p => ({ ...p, price }))}
                  onStripeIdChange={stripePriceId => setPackageForm(p => ({ ...p, stripePriceId }))}
                  showOriginalPrice
                  originalPrice={packageForm.originalPrice}
                  onOriginalPriceChange={originalPrice => setPackageForm(p => ({ ...p, originalPrice }))}
                />

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={packageForm.isFeatured} onChange={e => setPackageForm(p => ({ ...p, isFeatured: e.target.checked }))} className="rounded" /><span className="text-sm">Destaque</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={packageForm.isHidden} onChange={e => setPackageForm(p => ({ ...p, isHidden: e.target.checked }))} className="rounded" /><span className="text-sm">Oculto</span></label>
                  <div className="flex items-center gap-2"><label className="text-sm">Ordem:</label><Input type="number" value={packageForm.order} onChange={e => setPackageForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="w-16 h-8" /></div>
                </div>
              </div>

              <ModalActions onCancel={() => setShowPackageModal(false)} onSave={savePackage} saving={saving} mode={modalMode} />
            </ModalCard>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      {/* ═══════════════ Access Modal ═══════════════ */}
      <AnimatePresence>
        {accessModal && (
          <ModalBackdrop onClose={() => setAccessModal(null)}>
            <ModalCard title={`Acessos — ${accessModal.title}`} onClose={() => setAccessModal(null)}>
              {/* Grant access — searchable user picker */}
              <div className="rounded-xl border p-3 space-y-2.5 mb-4">
                <p className="text-sm font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-green-500" /> Conceder Acesso Manual
                </p>

                {/* Search input */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Buscar por nome ou e-mail..."
                      value={userSearch}
                      onChange={e => handleUserSearch(e.target.value)}
                      onFocus={() => userResults.length > 0 && setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      onKeyDown={e => { if (e.key === 'Enter') { setShowDropdown(false); grantAccess() } }}
                      className="pl-8 pr-8 h-9 text-sm"
                    />
                    {userSearchLoading && (
                      <Loader2 className="absolute right-2.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                    {selectedUser && !userSearchLoading && (
                      <button
                        className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                        onClick={() => { setSelectedUser(null); setUserSearch(''); setUserResults([]) }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  {showDropdown && userResults.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border bg-popover shadow-xl overflow-hidden">
                      <div className="max-h-52 overflow-y-auto">
                        {userResults.map(u => {
                          const planColors: Record<string, string> = { premium: '#f59e0b', essential: '#8b5cf6', trial: '#3b82f6', gratuito: '#6b7280' }
                          const planColor = planColors[u.accountType] || '#6b7280'
                          return (
                            <button
                              key={u.id}
                              onMouseDown={() => selectUser(u)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                            >
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                                {(u.name || u.email)[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{u.name || '—'}</p>
                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                              </div>
                              {u.accountType && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                                  style={{ color: planColor, background: planColor + '20' }}>
                                  {u.accountType.charAt(0).toUpperCase() + u.accountType.slice(1)}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {showDropdown && userResults.length === 0 && !userSearchLoading && userSearch.length >= 2 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border bg-popover shadow-xl px-3 py-4 text-center">
                      <p className="text-xs text-muted-foreground">Nenhum usuário encontrado</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Você pode inserir o e-mail diretamente abaixo</p>
                    </div>
                  )}
                </div>

                {/* Selected user chip */}
                {selectedUser && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center text-[10px] font-bold text-green-600">
                      {selectedUser.name[0]?.toUpperCase() || selectedUser.email[0]?.toUpperCase()}
                    </div>
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 truncate flex-1">
                      {selectedUser.name} <span className="font-normal opacity-70">· {selectedUser.email}</span>
                    </p>
                    <CheckCheck className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  </div>
                )}

                {/* Fallback: raw e-mail input (shown when no user selected from list) */}
                {!selectedUser && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-muted-foreground">ou insira o e-mail diretamente</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                {!selectedUser && (
                  <Input
                    placeholder="email@exemplo.com"
                    value={grantEmail}
                    onChange={e => { setGrantEmail(e.target.value); setGrantError('') }}
                    onKeyDown={e => e.key === 'Enter' && grantAccess()}
                    className="h-9 text-sm"
                  />
                )}

                <Button
                  size="sm"
                  onClick={grantAccess}
                  disabled={grantLoading || (!selectedUser && !grantEmail.trim() && !userSearch.trim())}
                  className="w-full h-9 gap-1.5"
                >
                  {grantLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  Conceder Acesso
                </Button>

                {grantError && <p className="text-xs text-destructive flex items-center gap-1"><X className="h-3 w-3" />{grantError}</p>}
              </div>

              {/* Users list */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {accessLoading ? 'Carregando...' : `${accessPurchases.length} usuário${accessPurchases.length !== 1 ? 's' : ''} com acesso`}
                </p>

                {accessLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                  ))
                ) : accessPurchases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhum usuário com acesso ainda</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                    {accessPurchases.map(p => {
                      const sourceIcon = p.source === 'manual'
                        ? <BadgeCheck className="h-3.5 w-3.5 text-violet-500" />
                        : p.price === 0
                          ? <Gift className="h-3.5 w-3.5 text-green-500" />
                          : <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                      const sourceLabel = p.source === 'manual' ? 'Manual' : p.price === 0 ? 'Grátis' : `R$ ${p.price?.toFixed(2)}`
                      const planBadge = p.userAccountType
                        ? { premium: { label: 'Premium', color: '#f59e0b', icon: <Crown className="h-3 w-3" /> },
                            essential: { label: 'Essential', color: '#8b5cf6', icon: <Zap className="h-3 w-3" /> },
                            trial: { label: 'Trial', color: '#3b82f6', icon: <Clock className="h-3 w-3" /> },
                            gratuito: { label: 'Gratuito', color: '#6b7280', icon: <Gift className="h-3 w-3" /> },
                          }[p.userAccountType as string]
                        : null

                      return (
                        <div key={p._id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/40 transition-colors">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                            {(p.userName || p.userEmail || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.userName || '—'}</p>
                            <p className="text-xs text-muted-foreground truncate">{p.userEmail}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {planBadge && (
                              <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                style={{ color: planBadge.color, background: planBadge.color + '18' }}>
                                {planBadge.icon} {planBadge.label}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              {sourceIcon} {sourceLabel}
                            </span>
                            <span className="text-[10px] text-muted-foreground hidden sm:block">
                              {new Date(p.purchasedAt).toLocaleDateString('pt-BR')}
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0" onClick={() => revokeAccess(p._id)} title="Revogar acesso">
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setAccessModal(null)}>Fechar</Button>
              </div>
            </ModalCard>
          </ModalBackdrop>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Shared UI Components ───────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function PricingSelector({
  pricing, price, stripePriceId,
  onPricingChange, onPriceChange, onStripeIdChange,
  showOriginalPrice, originalPrice, onOriginalPriceChange,
}: {
  pricing: 'free' | 'paid'
  price: number
  stripePriceId: string
  onPricingChange: (p: 'free' | 'paid') => void
  onPriceChange: (p: number) => void
  onStripeIdChange: (s: string) => void
  showOriginalPrice?: boolean
  originalPrice?: number
  onOriginalPriceChange?: (p: number) => void
}) {
  return (
    <div className="p-4 rounded-xl bg-muted/50 space-y-3">
      <label className="text-sm font-medium block">Preço</label>
      <div className="flex gap-2">
        <button onClick={() => onPricingChange('free')} className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all border ${pricing === 'free' ? 'border-green-500 bg-green-500/10 text-green-600' : 'border-transparent bg-background hover:bg-muted'}`}>
          <Gift className="h-4 w-4 mx-auto mb-1" /> Gratuito
        </button>
        <button onClick={() => onPricingChange('paid')} className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all border ${pricing === 'paid' ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-transparent bg-background hover:bg-muted'}`}>
          <DollarSign className="h-4 w-4 mx-auto mb-1" /> Pago
        </button>
      </div>

      {pricing === 'paid' && (
        <div className={`grid ${showOriginalPrice ? 'grid-cols-3' : 'grid-cols-2'} gap-3 mt-3`}>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Preço (R$)</label>
            <Input type="number" step="0.01" min="0" value={price} onChange={e => onPriceChange(parseFloat(e.target.value) || 0)} />
          </div>
          {showOriginalPrice && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Preço Original</label>
              <Input type="number" step="0.01" min="0" value={originalPrice || 0} onChange={e => onOriginalPriceChange?.(parseFloat(e.target.value) || 0)} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {children}
    </motion.div>
  )
}

function ModalCard({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      onClick={e => e.stopPropagation()}
      className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-heading font-bold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        {children}
      </div>
    </motion.div>
  )
}

function ModalActions({ onCancel, onSave, saving, mode }: { onCancel: () => void; onSave: () => void; saving: boolean; mode: ModalMode }) {
  return (
    <div className="flex gap-2 mt-6 pt-4 border-t">
      <Button variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
      <Button onClick={onSave} disabled={saving} className="flex-1 gap-1.5">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {mode === 'create' ? 'Criar' : 'Salvar'}
      </Button>
    </div>
  )
}

// ─── Page Export ─────────────────────────────────────────────
export default function AdminMateriaisPage() {
  return (
    <AppShell headerTitle="Gerenciar Materiais" headerSubtitle="Marketplace de materiais de estudo">
      <AdminMateriaisContent />
    </AppShell>
  )
}
