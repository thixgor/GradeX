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
  Settings2,
  List,
  BookOpen,
  Navigation,
  ArrowUp,
  ArrowDown,
  Mail,
  MailCheck,
  KeyRound,
  Code2,
  Layers,
  Sparkles,
  Copy,
  Check,
  Wand2,
} from 'lucide-react'
import {
  buildSummaryPrompt,
  parseSummaryMarkdown,
  SUMMARY_MARKDOWN_EXAMPLE,
  type ParsedSummaryEntry,
} from '@/lib/pdf-summary-import'
import { upload } from '@vercel/blob/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AppShell } from '@/components/app-shell'
import { PricingEventSelector } from '@/components/pricing-events/PricingEventSelector'
import {
  TimedAccessVersionsEditor,
  type TimedAccessVersionForm,
} from '@/components/materiais/timed-access-versions-editor'
import {
  DEFAULT_PUBLIC_METRIC_SETTINGS,
  type PublicMetricSettings,
} from '@/lib/display-settings'

type ModalMode = 'create' | 'edit'
type ActiveSection = 'materials' | 'folders' | 'packages' | 'tracker'

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
  excludeFromCommission?: boolean
  downloadCount: number
  viewCount: number
  isHidden: boolean
  isFeatured: boolean
  order: number
  createdByName: string
  createdAt: string
  // PDF interno
  _hasPdf?: boolean
  _pageCount?: number
  pdfViewerEnabled?: boolean
  pdfDownloadEnabled?: boolean
  pdfViewerConfig?: PdfViewerConfig
  _pdfFile?: {
    originalFilename: string
    sizeBytes: number
    uploadedByName: string
    uploadedAt: string
  }
  // HTML interno
  _hasHtml?: boolean
  htmlViewerEnabled?: boolean
  _htmlFile?: {
    originalFilename: string
    sizeBytes: number
    uploadedByName: string
    uploadedAt: string
  }
  // Materiais complementares
  complementaryMaterialIds?: string[]
  complementaryItems?: ComplementaryItemForm[]
}

type ComplementaryContentKind = 'link' | 'html' | 'pdf' | 'video_embed'

type ComplementaryItemForm = {
  id: string
  kind: 'material' | 'custom'
  materialId?: string
  template?: string
  contentKind?: ComplementaryContentKind
  title?: string
  description?: string
  coverImage?: string
  buttonLabel?: string
  buttonUrl?: string
  viewerEnabled?: boolean
  _hasPdf?: boolean
  _hasHtml?: boolean
  _pdfFile?: { originalFilename: string; sizeBytes: number; uploadedByName: string; uploadedAt: string }
  _htmlFile?: { originalFilename: string; sizeBytes: number; uploadedByName: string; uploadedAt: string }
}

const COMPLEMENTARY_TEMPLATES: { value: string; label: string; cta: string }[] = [
  { value: 'experiencia', label: 'Experiência', cta: 'Acessar' },
  { value: 'pdf', label: 'PDF', cta: 'Abrir' },
  { value: 'aula', label: 'Aula', cta: 'Assistir' },
  { value: 'podcast', label: 'Podcast', cta: 'Ouvir agora' },
  { value: 'ebook', label: 'Ebook', cta: 'Ler agora' },
]

const COMPLEMENTARY_CONTENT_KINDS: { value: ComplementaryContentKind; label: string }[] = [
  { value: 'link', label: 'Link' },
  { value: 'html', label: 'HTML (upload)' },
  { value: 'pdf', label: 'PDF (upload)' },
  { value: 'video_embed', label: 'Aula (vídeo embed)' },
]

function newComplementaryId(): string {
  try { return `ci-${crypto.randomUUID().slice(0, 8)}` } catch { return `ci-${Math.random().toString(36).slice(2, 10)}` }
}

interface PdfSummaryEntry {
  id: string
  title: string
  page: number
  level?: number
}

interface PdfNavEntry {
  id: string
  label: string
  page: number
}

interface PdfPreviewRange {
  start: number
  end: number
}

interface PdfPreviewConfig {
  enabled: boolean
  ranges: PdfPreviewRange[]
}

interface PdfViewerConfig {
  coverPage?: number
  summary?: PdfSummaryEntry[]
  navigation?: PdfNavEntry[]
  preview?: PdfPreviewConfig
}

const EMPTY_PDF_VIEWER_CONFIG: PdfViewerConfig = {
  coverPage: undefined,
  summary: [],
  navigation: [],
  preview: { enabled: false, ranges: [] },
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
  excludeFromCommission?: boolean
  downloadCount: number
  viewCount: number
  isHidden: boolean
  isFeatured: boolean
  order: number
  createdByName: string
  createdAt: string
}

interface MaterialTraceResult {
  parsed: {
    uidSuffix: string
    mailFingerprint: string
    orderId: string
    licensedName: string
    materialIds: string[]
  }
  users: Array<{
    id: string
    name: string
    email: string
    emailFingerprint: string
    role: string
    accountType: string
    secondaryRole: string
    cpf: string
    dateOfBirth: string | null
    isAfyaMedicineStudent: boolean
    afyaUnit: string
    createdAt: string | null
    lastLoginAt: string | null
  }>
  materials: Array<{ id: string; title: string; type: string; pricing: string; price: number; hasPdf: boolean }>
  purchases: Array<{
    id: string
    userId: string
    userName: string
    userEmail: string
    itemType: string
    itemId: string
    itemTitle: string
    price: number
    status: string
    purchasedAt: string | null
    provider: string
    providerOrderId: string
    providerPaymentId: string
  }>
  paymentOrders: Array<{
    id: string
    payerName: string
    payerEmail: string
    type: string
    refId: string
    amount: number
    status: string
    paymentMethod: string
    providerOrderId: string
    providerPaymentId: string
    createdAt: string | null
    paidAt: string | null
  }>
  payments: Array<{
    id: string
    orderId: string
    amount: number
    status: string
    paymentMethod: string
    installments: number | null
    createdAt: string | null
    paidAt: string | null
    providerPaymentId: string
  }>
  downloads: Array<{
    id: string
    userName: string
    userEmail: string
    userId: string
    materialId: string
    materialTitle: string
    orderId: string
    downloadedAt: string | null
    ip: string
  }>
}

const typeOptions = [
  { value: 'pdf', label: 'PDF', icon: <FileText className="h-4 w-4" /> },
  { value: 'html', label: 'HTML (experiência)', icon: <Code2 className="h-4 w-4" /> },
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
  { id: 'plus', label: 'Plus+', color: '#f59e0b', emoji: '👑' },
  { id: 'monitor', label: 'Monitor', color: '#10b981', emoji: '🎓' },
] as const

const formatTraceDate = (value?: string | null, withTime = true) => {
  if (!value) return 'Nao informado'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nao informado'
  return date.toLocaleString('pt-BR', withTime
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { dateStyle: 'short' })
}

const formatTraceMoney = (value?: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))

const traceText = (value?: string | null) => value || 'Nao informado'

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
  const [traceQuery, setTraceQuery] = useState('')
  const [traceLoading, setTraceLoading] = useState(false)
  const [traceError, setTraceError] = useState('')
  const [traceResult, setTraceResult] = useState<MaterialTraceResult | null>(null)
  const [metricSettings, setMetricSettings] = useState<PublicMetricSettings>(DEFAULT_PUBLIC_METRIC_SETTINGS)
  const [metricSettingsLoading, setMetricSettingsLoading] = useState(true)
  const [metricSettingsSaving, setMetricSettingsSaving] = useState(false)
  const [metricSettingsMessage, setMetricSettingsMessage] = useState('')

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
  const [accessGuests, setAccessGuests] = useState<any[]>([])
  const [accessLoading, setAccessLoading] = useState(false)
  const [grantEmail, setGrantEmail] = useState('')
  const [grantLoading, setGrantLoading] = useState(false)
  const [grantError, setGrantError] = useState('')
  // `id` é o purchaseId (com conta) ou o serialKeyId (compra sem login);
  // `mode` distingue qual botão da linha está em envio.
  const [sendingPdfEmail, setSendingPdfEmail] = useState<{ id: string; mode: string } | null>(null)
  const [pdfEmailSentId, setPdfEmailSentId] = useState<string | null>(null)
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
  const [pdfPageCount, setPdfPageCount] = useState(0)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0)
  const [pdfUploadError, setPdfUploadError] = useState('')
  const [pdfRemoving, setPdfRemoving] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // ─── Estado do upload de HTML ────────────────────────────────────────
  type HtmlInfo = { originalFilename: string; sizeBytes: number; uploadedByName: string; uploadedAt: string }
  const [htmlInfo, setHtmlInfo] = useState<HtmlInfo | null>(null)
  const [htmlUploading, setHtmlUploading] = useState(false)
  const [htmlUploadProgress, setHtmlUploadProgress] = useState(0)
  const [htmlUploadError, setHtmlUploadError] = useState('')
  const [htmlRemoving, setHtmlRemoving] = useState(false)
  const htmlInputRef = useRef<HTMLInputElement>(null)

  // ─── Estado do upload de arquivos por item complementar (keyed por itemId) ──
  const [complementaryUploading, setComplementaryUploading] = useState<Record<string, boolean>>({})
  const [complementaryUploadProgress, setComplementaryUploadProgress] = useState<Record<string, number>>({})
  const [complementaryUploadError, setComplementaryUploadError] = useState<Record<string, string>>({})
  const complementaryInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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

  const fetchMetricSettings = useCallback(async () => {
    setMetricSettingsLoading(true)
    try {
      const res = await fetch('/api/display-settings', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.settings) {
        setMetricSettings(data.settings)
      }
    } catch {
      // Mantem o padrao seguro: metricas publicas ocultas.
    } finally {
      setMetricSettingsLoading(false)
    }
  }, [])

  const updateMetricSetting = async <S extends keyof PublicMetricSettings>(
    section: S,
    key: keyof PublicMetricSettings[S],
    checked: boolean
  ) => {
    const next = {
      ...metricSettings,
      [section]: {
        ...metricSettings[section],
        [key]: checked,
      },
    } as PublicMetricSettings

    setMetricSettings(next)
    setMetricSettingsSaving(true)
    setMetricSettingsMessage('')
    try {
      const res = await fetch('/api/display-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar configurações')
      if (data.settings) setMetricSettings(data.settings)
      setMetricSettingsMessage('Configuração salva.')
      setTimeout(() => setMetricSettingsMessage(''), 2200)
    } catch (err: any) {
      setMetricSettingsMessage(err?.message || 'Erro ao salvar configurações.')
      fetchMetricSettings()
    } finally {
      setMetricSettingsSaving(false)
    }
  }

  const runTraceSearch = useCallback(async () => {
    const q = traceQuery.trim()
    if (q.length < 3) {
      setTraceError('Cole o watermark completo ou informe UID, mail-*, pedido, email ou ID.')
      setTraceResult(null)
      return
    }

    setTraceLoading(true)
    setTraceError('')
    try {
      const res = await fetch(`/api/admin/materiais/trace?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setTraceError(data.error || 'Nao foi possivel rastrear esse identificador.')
        setTraceResult(null)
        return
      }
      setTraceResult(data)
    } catch {
      setTraceError('Erro de conexao ao rastrear o identificador.')
      setTraceResult(null)
    } finally {
      setTraceLoading(false)
    }
  }, [traceQuery])

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
      if (res.ok) {
        const data = await res.json()
        setAccessPurchases(data.purchases || [])
        setAccessGuests(data.guests || [])
      }
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
      if (listRes.ok) {
        const listData = await listRes.json()
        setAccessPurchases(listData.purchases || [])
        setAccessGuests(listData.guests || [])
      }
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

  // Envia o PDF (com marca d'água) por e-mail.
  //  - target 'purchase' + mode 'requested': "conforme solicitado" (padrão).
  //  - target 'purchase' + mode 'acquired':  "você adquiriu e já tem acesso".
  //  - target 'serial': compra sem login → PDF + serial key para o e-mail da
  //    compra (sempre com enquadramento de aquisição).
  const sendPdfByEmail = async (
    id: string,
    email: string,
    opts: { target?: 'purchase' | 'serial'; mode?: 'requested' | 'acquired' } = {}
  ) => {
    const target = opts.target || 'purchase'
    const mode = opts.mode || 'requested'
    const confirmMsg = target === 'serial'
      ? `Enviar o PDF (com marca d'água) + a Serial Key de ativação para ${email || 'este comprador'}?`
      : mode === 'acquired'
        ? `Enviar o PDF avisando que ${email || 'o usuário'} adquiriu o produto e já tem acesso?`
        : `Enviar o PDF (com marca d'água) para ${email || 'este usuário'}?`
    if (!confirm(confirmMsg)) return

    setSendingPdfEmail({ id, mode: target === 'serial' ? 'serial' : mode })
    try {
      const body = target === 'serial' ? { serialKeyId: id } : { purchaseId: id, mode }
      const res = await fetch('/api/admin/materiais/send-pdf-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      // A resposta pode não ser JSON quando a função quebra no nível da
      // plataforma (ex.: OOM/timeout retorna uma página de erro). Lemos como
      // texto primeiro e tentamos parsear, para nunca esconder a causa real.
      const raw = await res.text()
      let data: any = null
      try { data = raw ? JSON.parse(raw) : null } catch { /* resposta não-JSON */ }

      if (!res.ok) {
        const detail = data?.error || (raw ? raw.slice(0, 300) : '') || `HTTP ${res.status}`
        alert(`Erro ao enviar o PDF por e-mail (${res.status}): ${detail}`)
        return
      }
      if (Array.isArray(data?.skipped) && data.skipped.length > 0) {
        alert(`E-mail enviado, mas alguns arquivos foram ignorados:\n\n${data.skipped.join('\n')}`)
      }
      setPdfEmailSentId(id)
      setTimeout(() => setPdfEmailSentId(prev => (prev === id ? null : prev)), 2500)
    } catch (err: any) {
      alert(`Erro ao enviar o PDF por e-mail: ${err?.message || 'falha de rede'}`)
    } finally {
      setSendingPdfEmail(null)
    }
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
    pricingEventId: null as string | null,
    stripePriceId: '',
    excludeFromCommission: false,
    isHidden: false,
    isFeatured: false,
    pdfViewerEnabled: false,
    pdfDownloadEnabled: true,
    autoEmailPdfOnPurchase: false,
    pdfViewerConfig: EMPTY_PDF_VIEWER_CONFIG as PdfViewerConfig,
    htmlViewerEnabled: false,
    complementaryItems: [] as ComplementaryItemForm[],
    timedAccessVersions: [] as TimedAccessVersionForm[],
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
    autoEmailPdfOnPurchase: false,
    allowedGroups: [] as string[],
    pricing: 'free' as 'free' | 'paid',
    price: 0,
    originalPrice: 0,
    pricingEventId: null as string | null,
    stripePriceId: '',
    excludeFromCommission: false,
    timedAccessVersions: [] as TimedAccessVersionForm[],
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
  useEffect(() => { fetchMetricSettings() }, [fetchMetricSettings])

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
        pricingEventId: (material as any).pricingEventId || null,
        stripePriceId: material.stripePriceId || '',
        excludeFromCommission: material.excludeFromCommission === true,
        isHidden: material.isHidden,
        isFeatured: material.isFeatured,
        pdfViewerEnabled: material.pdfViewerEnabled === true,
        pdfDownloadEnabled: material.pdfDownloadEnabled !== false,
        autoEmailPdfOnPurchase: (material as any).autoEmailPdfOnPurchase === true,
        pdfViewerConfig: {
          coverPage: material.pdfViewerConfig?.coverPage,
          summary: material.pdfViewerConfig?.summary || [],
          navigation: material.pdfViewerConfig?.navigation || [],
          preview: {
            enabled: material.pdfViewerConfig?.preview?.enabled === true,
            ranges: material.pdfViewerConfig?.preview?.ranges || [],
          },
        },
        htmlViewerEnabled: material.htmlViewerEnabled === true,
        complementaryItems: (material.complementaryItems && material.complementaryItems.length > 0)
          ? material.complementaryItems.map((it) => ({ ...it, id: it.id || newComplementaryId() }))
          : (material.complementaryMaterialIds || []).map((mid) => ({ id: newComplementaryId(), kind: 'material' as const, materialId: mid })),
        timedAccessVersions: normalizeVersionsForForm((material as any).timedAccessVersions),
        order: material.order || 0,
      })
      setPdfInfo(material._pdfFile || null)
      setPdfPageCount(material._pageCount || 0)
      setHtmlInfo(material._htmlFile || null)
    } else {
      setMaterialForm({
        _id: '', title: '', description: '', coverImage: '', type: 'pdf',
        downloadUrl: '', previewUrl: '', folderId: '', moduloId: '', tags: '',
        allowedGroups: [], videoDurationH: 0, videoDurationM: 0, videoDurationS: 0,
        pricing: 'free', price: 0, pricingEventId: null, stripePriceId: '', excludeFromCommission: false, isHidden: false, isFeatured: false,
        pdfViewerEnabled: false, pdfDownloadEnabled: true, autoEmailPdfOnPurchase: false,
        pdfViewerConfig: { coverPage: undefined, summary: [], navigation: [], preview: { enabled: false, ranges: [] } },
        htmlViewerEnabled: false, complementaryItems: [], timedAccessVersions: [],
        order: 0,
      })
      setPdfInfo(null)
      setPdfPageCount(0)
      setHtmlInfo(null)
    }
    setHtmlUploadError('')
    setHtmlUploadProgress(0)
    setShowMaterialModal(true)
  }

  const saveMaterial = async () => {
    // Para tipo PDF/HTML: URL e arquivo são opcionais — o admin faz upload após criar.
    // Para outros tipos: URL é obrigatória.
    const needsUrl = materialForm.type !== 'pdf' && materialForm.type !== 'html' && !materialForm.downloadUrl.trim()
    if (!materialForm.title || needsUrl) {
      alert('Título e URL/código embed são obrigatórios')
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
        // Capa/sumário/navegação só fazem sentido para PDF interno com viewer
        pdfViewerConfig: materialForm.type === 'pdf' ? materialForm.pdfViewerConfig : undefined,
        complementaryItems: materialForm.complementaryItems,
        // Migra/limpa o campo legado ao salvar com a UI nova.
        complementaryMaterialIds: [],
      }
      const res = await fetch('/api/materiais', {
        method: modalMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { alert((await res.json()).error || 'Erro ao salvar'); return }

      // Ao criar um PDF/HTML, reabre o modal em modo edição para o admin fazer o upload
      if (modalMode === 'create' && (materialForm.type === 'pdf' || materialForm.type === 'html')) {
        const created = await res.json()
        fetchAll()
        setMaterialForm(p => ({ ...p, _id: String(created._id) }))
        setModalMode('edit')
        // Mantém o modal aberto para o upload imediato
        return
      }

      setShowMaterialModal(false)
      fetchAll()
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
      // Upload direto do browser para o Vercel Blob (sem passar pela função),
      // o que elimina o limite de 4.5 MB e suporta arquivos grandes sem perda
      // de qualidade. A função /api/materiais/upload só assina o token (POST).
      const pathname = `material-originals/${materialForm._id}/${Date.now()}-${crypto.randomUUID()}.pdf`
      const blob = await upload(pathname, file, {
        access: 'private',
        contentType: 'application/pdf',
        multipart: true,
        handleUploadUrl: '/api/materiais/upload',
        clientPayload: JSON.stringify({ materialId: materialForm._id }),
        onUploadProgress: (e) => setPdfUploadProgress(Math.round(e.percentage)),
      })

      // Confirma o upload: grava os metadados no Mongo (mesmo schema de antes).
      const confirmRes = await fetch('/api/materiais/upload', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: materialForm._id,
          blobUrl: blob.url,
          blobPathname: blob.pathname,
          originalFilename: file.name,
          sizeBytes: file.size,
        }),
      })
      if (!confirmRes.ok) {
        const d = await confirmRes.json().catch(() => ({}))
        throw new Error(d.error || 'Erro ao confirmar upload')
      }

      // Buscar info atualizada do PDF
      const res = await fetch(`/api/materiais/upload?materialId=${materialForm._id}`)
      const data = await res.json()
      if (data.hasPdf) {
        setPdfInfo(data.pdfFile)
        setPdfPageCount(Number(data.pageCount) || 0)
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

  // ─── HTML Upload ──────────────────────────────────────────────────────
  const handleHtmlFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação client-side (o servidor re-valida — não confiar só nessa)
    const isHtmlType = file.type === 'text/html' || /\.html?$/i.test(file.name)
    if (!isHtmlType) {
      setHtmlUploadError('Envie um arquivo .html (autocontido).')
      return
    }
    const maxMb = parseInt(process.env.NEXT_PUBLIC_MATERIAL_HTML_UPLOAD_MAX_MB || '25', 10) || 25
    if (file.size > maxMb * 1024 * 1024) {
      setHtmlUploadError(`Arquivo muito grande. Máximo: ${maxMb} MB.`)
      return
    }
    if (!materialForm._id) {
      setHtmlUploadError('Salve o material primeiro antes de fazer o upload do HTML.')
      return
    }

    setHtmlUploadError('')
    setHtmlUploading(true)
    setHtmlUploadProgress(0)

    try {
      const pathname = `material-html/${materialForm._id}/${Date.now()}-${crypto.randomUUID()}.html`
      const blob = await upload(pathname, file, {
        access: 'private',
        contentType: 'text/html',
        multipart: true,
        handleUploadUrl: '/api/materiais/html-upload',
        clientPayload: JSON.stringify({ materialId: materialForm._id }),
        onUploadProgress: (ev) => setHtmlUploadProgress(Math.round(ev.percentage)),
      })

      const confirmRes = await fetch('/api/materiais/html-upload', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: materialForm._id,
          blobUrl: blob.url,
          blobPathname: blob.pathname,
          originalFilename: file.name,
          sizeBytes: file.size,
        }),
      })
      if (!confirmRes.ok) {
        const d = await confirmRes.json().catch(() => ({}))
        throw new Error(d.error || 'Erro ao confirmar upload')
      }

      const res = await fetch(`/api/materiais/html-upload?materialId=${materialForm._id}`)
      const data = await res.json()
      if (data.hasHtml) {
        setHtmlInfo(data.htmlFile)
      }
      fetchAll()
    } catch (err: any) {
      setHtmlUploadError(err?.message || 'Erro ao fazer upload do HTML.')
    } finally {
      setHtmlUploading(false)
      setHtmlUploadProgress(0)
      if (htmlInputRef.current) htmlInputRef.current.value = ''
    }
  }

  const handleHtmlRemove = async () => {
    if (!materialForm._id || !confirm('Remover HTML deste material?')) return
    setHtmlRemoving(true)
    try {
      const res = await fetch(`/api/materiais/html-upload?materialId=${materialForm._id}`, { method: 'DELETE' })
      if (res.ok) {
        setHtmlInfo(null)
        setMaterialForm(p => ({ ...p, htmlViewerEnabled: false }))
        fetchAll()
      } else {
        const d = await res.json()
        setHtmlUploadError(d.error || 'Erro ao remover HTML.')
      }
    } catch {
      setHtmlUploadError('Erro ao remover HTML.')
    } finally {
      setHtmlRemoving(false)
    }
  }

  // ─── Itens complementares ("Você também leva …") ──────────────────────
  const addComplementaryItem = (kind: 'material' | 'custom') => {
    const item: ComplementaryItemForm = kind === 'material'
      ? { id: newComplementaryId(), kind: 'material', materialId: '', buttonLabel: '' }
      : { id: newComplementaryId(), kind: 'custom', template: 'experiencia', contentKind: 'link', title: '', description: '', coverImage: '', buttonLabel: '', buttonUrl: '', viewerEnabled: false }
    setMaterialForm(p => ({ ...p, complementaryItems: [...p.complementaryItems, item] }))
  }
  const updateComplementaryItem = (id: string, patch: Partial<ComplementaryItemForm>) => {
    setMaterialForm(p => ({ ...p, complementaryItems: p.complementaryItems.map(it => it.id === id ? { ...it, ...patch } : it) }))
  }
  const removeComplementaryItem = (id: string) => {
    setMaterialForm(p => ({ ...p, complementaryItems: p.complementaryItems.filter(it => it.id !== id) }))
  }
  const moveComplementaryItem = (id: string, dir: -1 | 1) => {
    setMaterialForm(p => {
      const arr = [...p.complementaryItems]
      const i = arr.findIndex(x => x.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= arr.length) return p
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...p, complementaryItems: arr }
    })
  }

  // Upload de PDF/HTML para um item complementar específico. Requer que o
  // material E o item já estejam salvos (mesma regra do upload principal).
  const handleComplementaryFileChange = async (itemId: string, fileKind: 'pdf' | 'html', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isValidType = fileKind === 'pdf'
      ? file.type === 'application/pdf'
      : (file.type === 'text/html' || /\.html?$/i.test(file.name))
    if (!isValidType) {
      setComplementaryUploadError(p => ({ ...p, [itemId]: fileKind === 'pdf' ? 'Envie um arquivo PDF.' : 'Envie um arquivo .html.' }))
      return
    }
    if (!materialForm._id) {
      setComplementaryUploadError(p => ({ ...p, [itemId]: 'Salve o material primeiro.' }))
      return
    }

    setComplementaryUploadError(p => ({ ...p, [itemId]: '' }))
    setComplementaryUploading(p => ({ ...p, [itemId]: true }))
    setComplementaryUploadProgress(p => ({ ...p, [itemId]: 0 }))

    try {
      const ext = fileKind === 'pdf' ? 'pdf' : 'html'
      const pathname = `material-complementary/${materialForm._id}/${itemId}/${Date.now()}-${crypto.randomUUID()}.${ext}`
      const blob = await upload(pathname, file, {
        access: 'private',
        contentType: fileKind === 'pdf' ? 'application/pdf' : 'text/html',
        multipart: true,
        handleUploadUrl: '/api/materiais/complementary-upload',
        clientPayload: JSON.stringify({ materialId: materialForm._id, itemId, fileKind }),
        onUploadProgress: (ev) => setComplementaryUploadProgress(p => ({ ...p, [itemId]: Math.round(ev.percentage) })),
      })

      const confirmRes = await fetch('/api/materiais/complementary-upload', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: materialForm._id,
          itemId,
          fileKind,
          blobUrl: blob.url,
          blobPathname: blob.pathname,
          originalFilename: file.name,
          sizeBytes: file.size,
        }),
      })
      if (!confirmRes.ok) {
        const d = await confirmRes.json().catch(() => ({}))
        throw new Error(d.error || 'Erro ao confirmar upload')
      }

      const fileMeta = {
        originalFilename: file.name,
        sizeBytes: file.size,
        uploadedByName: '',
        uploadedAt: new Date().toISOString(),
      }
      updateComplementaryItem(itemId, fileKind === 'pdf' ? { _hasPdf: true, _pdfFile: fileMeta } : { _hasHtml: true, _htmlFile: fileMeta })
      fetchAll()
    } catch (err: any) {
      setComplementaryUploadError(p => ({ ...p, [itemId]: err?.message || 'Erro ao fazer upload.' }))
    } finally {
      setComplementaryUploading(p => ({ ...p, [itemId]: false }))
      setComplementaryUploadProgress(p => ({ ...p, [itemId]: 0 }))
      const inputEl = complementaryInputRefs.current[itemId]
      if (inputEl) inputEl.value = ''
    }
  }

  const handleComplementaryFileRemove = async (itemId: string, fileKind: 'pdf' | 'html') => {
    if (!materialForm._id || !confirm('Remover este arquivo?')) return
    try {
      const res = await fetch(`/api/materiais/complementary-upload?materialId=${materialForm._id}&itemId=${itemId}&fileKind=${fileKind}`, { method: 'DELETE' })
      if (res.ok) {
        updateComplementaryItem(itemId, fileKind === 'pdf' ? { _hasPdf: false, _pdfFile: undefined, viewerEnabled: false } : { _hasHtml: false, _htmlFile: undefined, viewerEnabled: false })
        fetchAll()
      } else {
        const d = await res.json()
        setComplementaryUploadError(p => ({ ...p, [itemId]: d.error || 'Erro ao remover arquivo.' }))
      }
    } catch {
      setComplementaryUploadError(p => ({ ...p, [itemId]: 'Erro ao remover arquivo.' }))
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
        tags: (pkg.tags || []).join(', '),
        autoEmailPdfOnPurchase: (pkg as any).autoEmailPdfOnPurchase === true,
        allowedGroups: pkg.allowedGroups || [],
        pricing: pkg.pricing, price: pkg.price || 0, originalPrice: pkg.originalPrice || 0,
        pricingEventId: (pkg as any).pricingEventId || null,
        stripePriceId: pkg.stripePriceId || '',
        excludeFromCommission: (pkg as any).excludeFromCommission === true,
        timedAccessVersions: normalizeVersionsForForm((pkg as any).timedAccessVersions),
        isHidden: pkg.isHidden,
        isFeatured: pkg.isFeatured, order: pkg.order || 0,
      })
    } else {
      setPackageForm({
        _id: '', title: '', description: '', coverImage: '', materialIds: [],
        tags: '', autoEmailPdfOnPurchase: false, allowedGroups: [], pricing: 'free', price: 0, originalPrice: 0,
        pricingEventId: null,
        stripePriceId: '', excludeFromCommission: false, timedAccessVersions: [],
        isHidden: false, isFeatured: false, order: 0,
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

  const metricToggleItems = [
    {
      label: 'Likes dos flashcards',
      description: 'Botão de curtida e contagem pública nos decks.',
      icon: <CheckCircle2 className="h-4 w-4" />,
      checked: metricSettings.flashcards.showLikes,
      onChange: (checked: boolean) => updateMetricSetting('flashcards', 'showLikes', checked),
    },
    {
      label: 'Views dos flashcards',
      description: 'Contagem pública de visualizações dos decks.',
      icon: <Eye className="h-4 w-4" />,
      checked: metricSettings.flashcards.showViews,
      onChange: (checked: boolean) => updateMetricSetting('flashcards', 'showViews', checked),
    },
    {
      label: 'Downloads dos materiais',
      description: 'Contagem pública de downloads em materiais e pacotes.',
      icon: <Download className="h-4 w-4" />,
      checked: metricSettings.materials.showDownloads,
      onChange: (checked: boolean) => updateMetricSetting('materials', 'showDownloads', checked),
    },
    {
      label: 'Views dos materiais',
      description: 'Contagem pública de visualizações em materiais e pacotes.',
      icon: <Eye className="h-4 w-4" />,
      checked: metricSettings.materials.showViews,
      onChange: (checked: boolean) => updateMetricSetting('materials', 'showViews', checked),
    },
  ]

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

      <div className="rounded-xl border bg-background p-4 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Métricas públicas</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Controle global do que aparece para alunos em flashcards, materiais e pacotes.
              </p>
            </div>
          </div>
          <div className="min-h-5 text-xs text-muted-foreground sm:text-right">
            {metricSettingsLoading ? 'Carregando...' : metricSettingsSaving ? 'Salvando...' : metricSettingsMessage}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metricToggleItems.map(item => (
            <label
              key={item.label}
              className="flex items-start justify-between gap-3 rounded-xl border bg-muted/25 p-3 transition-colors hover:bg-muted/40"
            >
              <span className="flex min-w-0 items-start gap-2">
                <span className={`mt-0.5 ${item.checked ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{item.description}</span>
                </span>
              </span>
              <input
                type="checkbox"
                checked={item.checked}
                disabled={metricSettingsLoading || metricSettingsSaving}
                onChange={e => item.onChange(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Tabs + Search + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto max-w-full">
          {(['materials', 'folders', 'packages', 'tracker'] as const).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeSection === section
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {section === 'materials' ? 'Materiais' : section === 'folders' ? 'Pastas' : section === 'packages' ? 'Pacotes' : 'Rastreamento'}
            </button>
          ))}
        </div>

        {activeSection !== 'tracker' && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg" />
          </div>
        )}

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

      {/* ═══ Material ID Tracker ═══ */}
      {activeSection === 'tracker' && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-background p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Rastreamento de watermark</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    Cole o texto do rodape do PDF, UID, fingerprint mail-*, pedido, email, ID de usuario ou ID de material.
                  </p>
                </div>
              </div>
              {traceResult && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setTraceQuery(''); setTraceResult(null); setTraceError('') }}
                  className="gap-1.5"
                >
                  <X className="h-4 w-4" /> Limpar
                </Button>
              )}
            </div>

            <Textarea
              value={traceQuery}
              onChange={e => setTraceQuery(e.target.value)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runTraceSearch()
              }}
              rows={4}
              className="mt-4 font-mono text-xs"
              placeholder={'Licenciado para: Thiago Rodrigues | UID 8442e007 | mail-14xckd7 | Pedido: ADMIN | Download: 11/05/2026, 23:19'}
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                O mail-* nao e reversivel. O sistema tenta encontrar a conta recalculando o mesmo fingerprint para os emails atuais.
              </p>
              <Button onClick={runTraceSearch} disabled={traceLoading || traceQuery.trim().length < 3} className="gap-1.5 sm:w-auto">
                {traceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Rastrear
              </Button>
            </div>

            {traceError && (
              <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                {traceError}
              </div>
            )}
          </div>

          {traceResult && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Usuarios', value: traceResult.users.length, icon: <Users className="h-4 w-4" />, color: 'text-blue-500' },
                  { label: 'Compras', value: traceResult.purchases.length, icon: <BadgeCheck className="h-4 w-4" />, color: 'text-emerald-500' },
                  { label: 'Pagamentos', value: traceResult.paymentOrders.length + traceResult.payments.length, icon: <CreditCard className="h-4 w-4" />, color: 'text-orange-500' },
                  { label: 'Downloads', value: traceResult.downloads.length, icon: <Download className="h-4 w-4" />, color: 'text-violet-500' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border bg-background p-3">
                    <div className={`flex items-center gap-2 ${item.color}`}>
                      {item.icon}
                      <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-background p-4">
                <h4 className="font-semibold mb-3">Dados extraidos</h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Nome', traceResult.parsed.licensedName],
                    ['UID', traceResult.parsed.uidSuffix],
                    ['Email fingerprint', traceResult.parsed.mailFingerprint],
                    ['Pedido', traceResult.parsed.orderId],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-muted/40 px-3 py-2 min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium truncate">{traceText(value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-background p-4">
                  <h4 className="font-semibold mb-3">Conta</h4>
                  {traceResult.users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma conta encontrada com os identificadores informados.</p>
                  ) : (
                    <div className="space-y-3">
                      {traceResult.users.map(user => (
                        <div key={user.id} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{traceText(user.name)}</p>
                              <p className="text-sm text-muted-foreground truncate">{traceText(user.email)}</p>
                            </div>
                            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              {user.accountType}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                            <span><b>ID:</b> {user.id}</span>
                            <span><b>mail:</b> {user.emailFingerprint}</span>
                            <span><b>Nascimento:</b> {formatTraceDate(user.dateOfBirth, false)}</span>
                            <span><b>CPF:</b> {traceText(user.cpf)}</span>
                            <span><b>Role:</b> {[user.role, user.secondaryRole].filter(Boolean).join(' / ') || 'user'}</span>
                            <span><b>Unidade:</b> {user.isAfyaMedicineStudent ? traceText(user.afyaUnit) : 'Sem faculdade vinculada'}</span>
                            <span><b>Criada em:</b> {formatTraceDate(user.createdAt)}</span>
                            <span><b>Ultimo login:</b> {formatTraceDate(user.lastLoginAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border bg-background p-4">
                  <h4 className="font-semibold mb-3">Materiais associados</h4>
                  {traceResult.materials.length === 0 && traceResult.parsed.materialIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum material identificado diretamente no texto.</p>
                  ) : (
                    <div className="space-y-2">
                      {traceResult.materials.map(material => (
                        <div key={material.id} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{traceText(material.title)}</p>
                              <p className="text-xs text-muted-foreground truncate">{material.id}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{material.hasPdf ? 'PDF interno' : material.type}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{material.pricing === 'paid' ? formatTraceMoney(material.price) : 'Gratuito'}</p>
                        </div>
                      ))}
                      {traceResult.materials.length === 0 && traceResult.parsed.materialIds.map(id => (
                        <div key={id} className="rounded-lg border p-3 text-sm">{id}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-background p-4">
                <h4 className="font-semibold mb-3">Compras e acessos</h4>
                {traceResult.purchases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma compra/acesso encontrado para esse rastreio.</p>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {traceResult.purchases.map(purchase => (
                      <div key={purchase.id} className="rounded-lg border p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{traceText(purchase.itemTitle)}</p>
                            <p className="text-xs text-muted-foreground truncate">{traceText(purchase.userName)} · {traceText(purchase.userEmail)}</p>
                          </div>
                          <span className="rounded-md bg-muted px-2 py-1 text-xs">{traceText(purchase.status)}</span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                          <span><b>Comprou em:</b> {formatTraceDate(purchase.purchasedAt)}</span>
                          <span><b>Valor:</b> {formatTraceMoney(purchase.price)}</span>
                          <span><b>Tipo:</b> {traceText(purchase.itemType)}</span>
                          <span><b>Provider:</b> {traceText(purchase.provider)}</span>
                          <span className="truncate"><b>Pedido:</b> {traceText(purchase.providerOrderId)}</span>
                          <span className="truncate"><b>Pagamento:</b> {traceText(purchase.providerPaymentId)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-background p-4">
                  <h4 className="font-semibold mb-3">Pedidos de pagamento</h4>
                  {traceResult.paymentOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum pedido de pagamento encontrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {traceResult.paymentOrders.map(order => (
                        <div key={order.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{formatTraceMoney(order.amount)}</span>
                            <span className="rounded-md bg-muted px-2 py-1 text-xs">{traceText(order.status)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 truncate">{traceText(order.payerName)} · {traceText(order.payerEmail)}</p>
                          <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                            <span><b>Metodo:</b> {traceText(order.paymentMethod)}</span>
                            <span><b>Pago em:</b> {formatTraceDate(order.paidAt)}</span>
                            <span className="truncate"><b>ID:</b> {order.id}</span>
                            <span className="truncate"><b>Ref:</b> {traceText(order.refId)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {traceResult.payments.length > 0 && (
                    <div className="mt-4 border-t pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Transacoes</p>
                      <div className="space-y-2">
                        {traceResult.payments.map(payment => (
                          <div key={payment.id} className="rounded-lg bg-muted/40 p-3 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{formatTraceMoney(payment.amount)}</span>
                              <span>{traceText(payment.status)}</span>
                            </div>
                            <div className="mt-2 grid gap-1 sm:grid-cols-2">
                              <span><b>Metodo:</b> {traceText(payment.paymentMethod)}</span>
                              <span><b>Pago em:</b> {formatTraceDate(payment.paidAt)}</span>
                              <span className="truncate"><b>Pedido:</b> {traceText(payment.orderId)}</span>
                              <span className="truncate"><b>Provider:</b> {traceText(payment.providerPaymentId)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border bg-background p-4">
                  <h4 className="font-semibold mb-3">Downloads registrados</h4>
                  {traceResult.downloads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum download encontrado nos logs.</p>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                      {traceResult.downloads.map(log => (
                        <div key={log.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-medium truncate">{traceText(log.materialTitle)}</span>
                            <span className="text-xs text-muted-foreground">{formatTraceDate(log.downloadedAt)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{traceText(log.userName)} · {traceText(log.userEmail)}</p>
                          <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                            <span className="truncate"><b>Material:</b> {traceText(log.materialId)}</span>
                            <span className="truncate"><b>Pedido:</b> {traceText(log.orderId)}</span>
                            <span className="truncate"><b>Usuario:</b> {traceText(log.userId)}</span>
                            <span><b>IP:</b> {traceText(log.ip)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

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
                    {material._hasPdf && (
                      <>
                        <span className={`flex items-center gap-0.5 font-medium ${material.pdfViewerEnabled ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                          {material.pdfViewerEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          Viewer {material.pdfViewerEnabled ? 'ativo' : 'bloqueado'}
                        </span>
                        <span className={`flex items-center gap-0.5 font-medium ${material.pdfDownloadEnabled !== false ? 'text-amber-500' : 'text-muted-foreground'}`}>
                          <Download className="h-3 w-3" />
                          Download {material.pdfDownloadEnabled !== false ? 'permitido' : 'bloqueado'}
                        </span>
                      </>
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

                    <div className={`rounded-lg border p-3 space-y-3 ${pdfInfo ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-muted'}`}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4 w-4 ${pdfInfo ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">Seguranca do PDF</span>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-2 text-[11px]">
                        <span className={`rounded-lg px-2 py-1 border ${pdfInfo ? 'text-emerald-600 border-emerald-500/25 bg-emerald-500/10' : 'text-muted-foreground border-border bg-muted/30'}`}>
                          PDF {pdfInfo ? 'vinculado' : 'nao vinculado'}
                        </span>
                        <span className={`rounded-lg px-2 py-1 border ${materialForm.pdfDownloadEnabled && pdfInfo ? 'text-amber-600 border-amber-500/25 bg-amber-500/10' : 'text-muted-foreground border-border bg-muted/30'}`}>
                          Download {materialForm.pdfDownloadEnabled && pdfInfo ? 'permitido' : 'bloqueado'}
                        </span>
                        <span className={`rounded-lg px-2 py-1 border ${materialForm.pdfViewerEnabled && pdfInfo ? 'text-emerald-600 border-emerald-500/25 bg-emerald-500/10' : 'text-muted-foreground border-border bg-muted/30'}`}>
                          Viewer {materialForm.pdfViewerEnabled && pdfInfo ? 'permitido' : 'bloqueado'}
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <label className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${pdfInfo ? 'cursor-pointer hover:bg-muted/40' : 'opacity-50 cursor-not-allowed'}`}>
                          <input
                            type="checkbox"
                            disabled={!pdfInfo}
                            checked={pdfInfo ? materialForm.pdfViewerEnabled : false}
                            onChange={e => setMaterialForm(p => ({ ...p, pdfViewerEnabled: e.target.checked }))}
                            className="rounded"
                          />
                          Habilitar PDF Viewer
                        </label>
                        <label className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${pdfInfo ? 'cursor-pointer hover:bg-muted/40' : 'opacity-50 cursor-not-allowed'}`}>
                          <input
                            type="checkbox"
                            disabled={!pdfInfo}
                            checked={pdfInfo ? materialForm.pdfDownloadEnabled : false}
                            onChange={e => setMaterialForm(p => ({ ...p, pdfDownloadEnabled: e.target.checked }))}
                            className="rounded"
                          />
                          Permitir download
                        </label>
                      </div>
                      {!pdfInfo && (
                        <p className="text-[11px] text-muted-foreground">
                          Envie um PDF interno para liberar as configuracoes de viewer e download protegido.
                        </p>
                      )}

                      {/* Envio automático do PDF por e-mail na compra.
                          Só faz sentido com PDF interno + download ativado. */}
                      <label className={`flex items-start gap-2 rounded-lg border p-2 text-sm ${pdfInfo && materialForm.pdfDownloadEnabled ? 'cursor-pointer hover:bg-muted/40' : 'opacity-50 cursor-not-allowed'}`}>
                        <input
                          type="checkbox"
                          disabled={!pdfInfo || !materialForm.pdfDownloadEnabled}
                          checked={pdfInfo && materialForm.pdfDownloadEnabled ? materialForm.autoEmailPdfOnPurchase : false}
                          onChange={e => setMaterialForm(p => ({ ...p, autoEmailPdfOnPurchase: e.target.checked }))}
                          className="rounded mt-0.5"
                        />
                        <span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <MailCheck className="h-3.5 w-3.5 text-emerald-500" />
                            Enviar o PDF por e-mail automaticamente na compra
                          </span>
                          <span className="block text-[11px] text-muted-foreground mt-0.5">
                            O comprador recebe o PDF (com marca d&apos;água) no e-mail da compra. Em compras sem login, a serial key é enviada junto e sua ativação fica restrita ao e-mail usado na compra.
                          </span>
                        </span>
                      </label>
                    </div>

                    {/* Capa, Sumário e Navegação (somente com PDF + viewer ativo) */}
                    {pdfInfo && materialForm.pdfViewerEnabled && (
                      <PdfViewerStructureEditor
                        config={materialForm.pdfViewerConfig}
                        pageCount={pdfPageCount}
                        materialTitle={materialForm.title}
                        onChange={(next) => setMaterialForm(p => ({ ...p, pdfViewerConfig: next }))}
                      />
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

                {/* ── Upload de HTML Interno (apenas type=html) ── */}
                {materialForm.type === 'html' && (
                  <div className="rounded-xl border-2 border-dashed border-muted p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">HTML da Experiência (com marca d&apos;água)</span>
                    </div>

                    {/* Info do HTML atual */}
                    {htmlInfo ? (
                      <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">{htmlInfo.originalFilename}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {(htmlInfo.sizeBytes / 1024 / 1024).toFixed(2)} MB · Enviado por {htmlInfo.uploadedByName} · {new Date(htmlInfo.uploadedAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleHtmlRemove}
                          disabled={htmlRemoving}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 shrink-0"
                          title="Remover HTML"
                        >
                          {htmlRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhum HTML enviado ainda.</p>
                    )}

                    <div className={`rounded-lg border p-3 space-y-3 ${htmlInfo ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-muted'}`}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-4 w-4 ${htmlInfo ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">Segurança do leitor HTML</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
                        <span className={`rounded-lg px-2 py-1 border ${htmlInfo ? 'text-emerald-600 border-emerald-500/25 bg-emerald-500/10' : 'text-muted-foreground border-border bg-muted/30'}`}>
                          HTML {htmlInfo ? 'vinculado' : 'não vinculado'}
                        </span>
                        <span className={`rounded-lg px-2 py-1 border ${materialForm.htmlViewerEnabled && htmlInfo ? 'text-emerald-600 border-emerald-500/25 bg-emerald-500/10' : 'text-muted-foreground border-border bg-muted/30'}`}>
                          Leitor {materialForm.htmlViewerEnabled && htmlInfo ? 'permitido' : 'bloqueado'}
                        </span>
                      </div>
                      <label className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${htmlInfo ? 'cursor-pointer hover:bg-muted/40' : 'opacity-50 cursor-not-allowed'}`}>
                        <input
                          type="checkbox"
                          disabled={!htmlInfo}
                          checked={htmlInfo ? materialForm.htmlViewerEnabled : false}
                          onChange={e => setMaterialForm(p => ({ ...p, htmlViewerEnabled: e.target.checked }))}
                          className="rounded"
                        />
                        Habilitar leitor HTML (somente leitura, com marca d&apos;água)
                      </label>
                      {!htmlInfo && (
                        <p className="text-[11px] text-muted-foreground">
                          Envie um arquivo .html autocontido (CSS/JS inline) para liberar o leitor protegido.
                        </p>
                      )}
                    </div>

                    {/* Upload */}
                    {!materialForm._id || modalMode === 'create' ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Salve o material primeiro para habilitar o upload de HTML.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <input
                          ref={htmlInputRef}
                          type="file"
                          accept=".html,text/html"
                          onChange={handleHtmlFileChange}
                          disabled={htmlUploading}
                          className="hidden"
                          id="html-upload-input"
                        />
                        <label
                          htmlFor="html-upload-input"
                          className={`flex items-center gap-2 justify-center w-full rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors
                            ${htmlUploading
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'hover:bg-muted/50 hover:border-emerald-400 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                            }`}
                        >
                          {htmlUploading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Enviando... {htmlUploadProgress}%</>
                          ) : (
                            <><Upload className="h-4 w-4" /> {htmlInfo ? 'Substituir HTML' : 'Selecionar HTML'}</>
                          )}
                        </label>

                        {htmlUploading && (
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${htmlUploadProgress}%` }}
                            />
                          </div>
                        )}

                        {htmlUploadError && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {htmlUploadError}
                          </p>
                        )}

                        <p className="text-[11px] text-muted-foreground">
                          Máx. {process.env.NEXT_PUBLIC_MATERIAL_HTML_UPLOAD_MAX_MB || '25'} MB · Arquivo .html autocontido · Upload direto ao storage
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

                {/* Você também leva… (itens complementares) */}
                <div className="rounded-xl border p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Você também leva… ({materialForm.complementaryItems.length})
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Anexe itens complementares. Referencie um material existente ou crie um item avulso
                    (Experiência, PDF, Aula, Podcast, Ebook) com descrição e botão — sem precisar criar um material.
                  </p>

                  {/* Lista de itens */}
                  <div className="space-y-3">
                    {materialForm.complementaryItems.map((item, idx) => (
                      <div key={item.id} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {item.kind === 'material' ? 'Material existente' : 'Item avulso'} #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => moveComplementaryItem(item.id, -1)} disabled={idx === 0}
                              className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Subir">
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => moveComplementaryItem(item.id, 1)} disabled={idx === materialForm.complementaryItems.length - 1}
                              className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Descer">
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => removeComplementaryItem(item.id)}
                              className="p-1 rounded text-red-500 hover:bg-red-500/10" title="Remover">
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {item.kind === 'material' ? (
                          <>
                            <select
                              value={item.materialId || ''}
                              onChange={e => updateComplementaryItem(item.id, { materialId: e.target.value })}
                              className="w-full rounded-lg border bg-background px-3 py-2 text-sm h-10"
                            >
                              <option value="">Selecione o material…</option>
                              {materials.filter(m => m._id !== materialForm._id).map(m => (
                                <option key={m._id} value={m._id}>{m.title}</option>
                              ))}
                            </select>
                            <Input
                              value={item.buttonLabel || ''}
                              onChange={e => updateComplementaryItem(item.id, { buttonLabel: e.target.value })}
                              placeholder="Texto do botão (padrão: Acessar)"
                            />
                          </>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={item.template || 'experiencia'}
                                onChange={e => updateComplementaryItem(item.id, { template: e.target.value })}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm h-10"
                              >
                                {COMPLEMENTARY_TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                              <Input
                                value={item.buttonLabel || ''}
                                onChange={e => updateComplementaryItem(item.id, { buttonLabel: e.target.value })}
                                placeholder={`Botão (padrão: ${COMPLEMENTARY_TEMPLATES.find(t => t.value === (item.template || 'experiencia'))?.cta})`}
                              />
                            </div>
                            <Input
                              value={item.title || ''}
                              onChange={e => updateComplementaryItem(item.id, { title: e.target.value })}
                              placeholder="Título *"
                            />
                            <textarea
                              value={item.description || ''}
                              onChange={e => updateComplementaryItem(item.id, { description: e.target.value })}
                              placeholder="Descrição do item complementar"
                              className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[56px] resize-y"
                            />
                            <Input
                              value={item.coverImage || ''}
                              onChange={e => updateComplementaryItem(item.id, { coverImage: e.target.value })}
                              placeholder="URL da capa (opcional)"
                            />

                            {/* Tipo de conteúdo do CTA: Link / HTML / PDF / Aula */}
                            <div className="rounded-lg border bg-background/50 p-2.5 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Conteúdo do botão
                                </span>
                                <select
                                  value={item.contentKind || 'link'}
                                  onChange={e => updateComplementaryItem(item.id, { contentKind: e.target.value as ComplementaryContentKind })}
                                  className="ml-auto rounded-lg border bg-background px-2 py-1 text-xs h-8"
                                >
                                  {COMPLEMENTARY_CONTENT_KINDS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                              </div>

                              {item.contentKind === 'video_embed' ? (
                                <Textarea
                                  value={item.buttonUrl || ''}
                                  onChange={e => updateComplementaryItem(item.id, { buttonUrl: e.target.value })}
                                  placeholder="Cole o código embed completo (Wistia, YouTube, Vimeo, etc.) ou a URL do embed"
                                  rows={3}
                                />
                              ) : item.contentKind === 'html' || item.contentKind === 'pdf' ? (
                                <ComplementaryFileUpload
                                  item={item}
                                  fileKind={item.contentKind}
                                  materialSaved={!!materialForm._id}
                                  uploading={!!complementaryUploading[item.id]}
                                  progress={complementaryUploadProgress[item.id] || 0}
                                  error={complementaryUploadError[item.id] || ''}
                                  onFileChange={(e) => handleComplementaryFileChange(item.id, item.contentKind as 'pdf' | 'html', e)}
                                  onRemove={() => handleComplementaryFileRemove(item.id, item.contentKind as 'pdf' | 'html')}
                                  onToggleViewer={(checked) => updateComplementaryItem(item.id, { viewerEnabled: checked })}
                                  inputRef={(el) => { complementaryInputRefs.current[item.id] = el }}
                                />
                              ) : (
                                <Input
                                  value={item.buttonUrl || ''}
                                  onChange={e => updateComplementaryItem(item.id, { buttonUrl: e.target.value })}
                                  placeholder="Link do botão (https:// ou /caminho)"
                                />
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Botões de adicionar */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => addComplementaryItem('material')}
                      className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      <Plus className="h-3.5 w-3.5" /> Material existente
                    </button>
                    <button
                      type="button"
                      onClick={() => addComplementaryItem('custom')}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Plus className="h-3.5 w-3.5" /> Item avulso
                    </button>
                  </div>
                </div>

                <PricingSelector
                  pricing={materialForm.pricing}
                  price={materialForm.price}
                  stripePriceId={materialForm.stripePriceId}
                  onPricingChange={pricing => setMaterialForm(p => ({ ...p, pricing, price: pricing === 'free' ? 0 : p.price }))}
                  onPriceChange={price => setMaterialForm(p => ({ ...p, price }))}
                  onStripeIdChange={stripePriceId => setMaterialForm(p => ({ ...p, stripePriceId }))}
                />

                {materialForm.pricing === 'paid' && (
                  <PricingEventSelector
                    value={materialForm.pricingEventId}
                    onChange={(id) => setMaterialForm(p => ({ ...p, pricingEventId: id }))}
                  />
                )}

                {materialForm.pricing === 'paid' && (
                  <TimedAccessVersionsEditor
                    versions={materialForm.timedAccessVersions}
                    onChange={(timedAccessVersions) => setMaterialForm(p => ({ ...p, timedAccessVersions }))}
                    fullPrice={materialForm.price}
                    itemLabel="material"
                    hasPdf={materialForm.type === 'pdf'}
                  />
                )}

                {materialForm.pricing === 'paid' && (
                  <label className="flex items-start gap-2 rounded-lg border p-2 text-sm cursor-pointer hover:bg-muted/40">
                    <input
                      type="checkbox"
                      checked={materialForm.excludeFromCommission}
                      onChange={e => setMaterialForm(p => ({ ...p, excludeFromCommission: e.target.checked }))}
                      className="rounded mt-0.5"
                    />
                    <span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                        Sem comissão do sócio
                      </span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        Quando marcado, a venda deste material não entra no split de pagamento — o sócio não recebe o percentual sobre ele. Add-ons físicos comprados junto seguem comissionados normalmente.
                      </span>
                    </span>
                  </label>
                )}

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

                {packageForm.pricing === 'paid' && (
                  <PricingEventSelector
                    value={packageForm.pricingEventId}
                    onChange={(id) => setPackageForm(p => ({ ...p, pricingEventId: id }))}
                  />
                )}

                {packageForm.pricing === 'paid' && (
                  <TimedAccessVersionsEditor
                    versions={packageForm.timedAccessVersions}
                    onChange={(timedAccessVersions) => setPackageForm(p => ({ ...p, timedAccessVersions }))}
                    fullPrice={packageForm.price}
                    itemLabel="pacote"
                  />
                )}

                {packageForm.pricing === 'paid' && (
                  <label className="flex items-start gap-2 rounded-lg border p-2 text-sm cursor-pointer hover:bg-muted/40">
                    <input
                      type="checkbox"
                      checked={packageForm.excludeFromCommission}
                      onChange={e => setPackageForm(p => ({ ...p, excludeFromCommission: e.target.checked }))}
                      className="rounded mt-0.5"
                    />
                    <span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                        Sem comissão do sócio
                      </span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        Quando marcado, a venda deste pacote não entra no split de pagamento — o sócio não recebe o percentual sobre ele. Add-ons físicos comprados junto seguem comissionados normalmente.
                      </span>
                    </span>
                  </label>
                )}

                <label className={`flex items-start gap-2 rounded-lg border p-2 text-sm ${packageForm.materialIds.length > 0 ? 'cursor-pointer hover:bg-muted/40' : 'opacity-50 cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    disabled={packageForm.materialIds.length === 0}
                    checked={packageForm.materialIds.length > 0 ? packageForm.autoEmailPdfOnPurchase : false}
                    onChange={e => setPackageForm(p => ({ ...p, autoEmailPdfOnPurchase: e.target.checked }))}
                    className="rounded mt-0.5"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <MailCheck className="h-3.5 w-3.5 text-emerald-500" />
                      Enviar os PDFs por e-mail automaticamente na compra
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">
                      O comprador recebe o PDF (com marca d&apos;água) de todos os materiais do pacote que tenham PDF interno com download ativado. Em compras sem login, a serial key é enviada junto e sua ativação fica restrita ao e-mail usado na compra.
                    </span>
                  </span>
                </label>

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
                        ? { plus: { label: 'Plus+', color: '#f59e0b', icon: <Crown className="h-3 w-3" /> },
                            // Legado — contas ainda não migradas.
                            premium: { label: 'Plus+', color: '#f59e0b', icon: <Crown className="h-3 w-3" /> },
                            essential: { label: 'Plus+', color: '#f59e0b', icon: <Crown className="h-3 w-3" /> },
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-blue-500 hover:text-blue-600 flex-shrink-0"
                              onClick={() => sendPdfByEmail(p._id, p.userEmail, { mode: 'requested' })}
                              disabled={sendingPdfEmail?.id === p._id}
                              title="Enviar PDF com marca d'água por e-mail (conforme solicitado)"
                            >
                              {sendingPdfEmail?.id === p._id && sendingPdfEmail?.mode === 'requested'
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : pdfEmailSentId === p._id
                                  ? <CheckCheck className="h-3.5 w-3.5 text-green-500" />
                                  : <Mail className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-emerald-500 hover:text-emerald-600 flex-shrink-0"
                              onClick={() => sendPdfByEmail(p._id, p.userEmail, { mode: 'acquired' })}
                              disabled={sendingPdfEmail?.id === p._id}
                              title="Enviar PDF avisando que adquiriu o produto e já tem acesso"
                            >
                              {sendingPdfEmail?.id === p._id && sendingPdfEmail?.mode === 'acquired'
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : pdfEmailSentId === p._id
                                  ? <CheckCheck className="h-3.5 w-3.5 text-green-500" />
                                  : <MailCheck className="h-3.5 w-3.5" />}
                            </Button>
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

              {/* Compras sem login (serial keys ainda não ativadas) */}
              {accessGuests.length > 0 && (
                <div className="mt-5 border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                    {accessGuests.length} compra{accessGuests.length !== 1 ? 's' : ''} sem login (aguardando ativação)
                  </p>
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {accessGuests.map(g => (
                      <div key={g._id} className="flex items-center gap-3 p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-600">
                          {(g.buyerName || g.buyerEmail || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{g.buyerName || '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">{g.buyerEmail}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <KeyRound className="h-3 w-3 text-amber-500" /> {g.amount > 0 ? `R$ ${Number(g.amount).toFixed(2)}` : 'Serial'}
                          </span>
                          {g.purchasedAt && (
                            <span className="text-[10px] text-muted-foreground hidden sm:block">
                              {new Date(g.purchasedAt).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-emerald-500 hover:text-emerald-600 flex-shrink-0"
                            onClick={() => sendPdfByEmail(g._id, g.buyerEmail, { target: 'serial' })}
                            disabled={sendingPdfEmail?.id === g._id}
                            title="Enviar PDF + Serial Key para o e-mail da compra"
                          >
                            {sendingPdfEmail?.id === g._id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : pdfEmailSentId === g._id
                                ? <CheckCheck className="h-3.5 w-3.5 text-green-500" />
                                : <MailCheck className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

// Upload de PDF/HTML para um item complementar avulso — mesma UX do upload
// principal (arquivo, progresso, remover, habilitar leitor), porém escopado
// a um único item dentro do repeater de complementares.
function ComplementaryFileUpload({
  item,
  fileKind,
  materialSaved,
  uploading,
  progress,
  error,
  onFileChange,
  onRemove,
  onToggleViewer,
  inputRef,
}: {
  item: ComplementaryItemForm
  fileKind: 'pdf' | 'html'
  materialSaved: boolean
  uploading: boolean
  progress: number
  error: string
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
  onToggleViewer: (checked: boolean) => void
  inputRef: (el: HTMLInputElement | null) => void
}) {
  const fileInfo = fileKind === 'pdf' ? item._pdfFile : item._htmlFile
  const hasFile = fileKind === 'pdf' ? item._hasPdf : item._hasHtml
  const inputId = `complementary-upload-${item.id}`
  const accent = fileKind === 'pdf' ? 'blue' : 'emerald'

  if (!materialSaved) {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Salve o material primeiro para habilitar o upload.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {hasFile && fileInfo ? (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-2.5 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-green-700 dark:text-green-400 truncate">{fileInfo.originalFilename}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {(fileInfo.sizeBytes / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button onClick={onRemove} className="text-red-500 hover:text-red-700 shrink-0" title="Remover arquivo">
            <Trash className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Nenhum arquivo enviado ainda.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={fileKind === 'pdf' ? 'application/pdf' : '.html,text/html'}
        onChange={onFileChange}
        disabled={uploading}
        className="hidden"
        id={inputId}
      />
      <label
        htmlFor={inputId}
        className={`flex items-center gap-2 justify-center w-full rounded-lg border px-3 py-1.5 text-xs cursor-pointer transition-colors
          ${uploading
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : accent === 'blue'
              ? 'hover:bg-muted/50 hover:border-blue-400 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700'
              : 'hover:bg-muted/50 hover:border-emerald-400 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
          }`}
      >
        {uploading ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando... {progress}%</>
        ) : (
          <><Upload className="h-3.5 w-3.5" /> {hasFile ? `Substituir ${fileKind.toUpperCase()}` : `Selecionar ${fileKind.toUpperCase()}`}</>
        )}
      </label>

      {uploading && (
        <div className="w-full bg-muted rounded-full h-1">
          <div className={`h-1 rounded-full transition-all ${accent === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <p className="text-[11px] text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      <label className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${hasFile ? 'cursor-pointer hover:bg-muted/40' : 'opacity-50 cursor-not-allowed'}`}>
        <input
          type="checkbox"
          disabled={!hasFile}
          checked={hasFile ? item.viewerEnabled === true : false}
          onChange={e => onToggleViewer(e.target.checked)}
          className="rounded"
        />
        Habilitar leitor protegido (com marca d&apos;água)
      </label>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      {children}
    </div>
  )
}

// ─── Importação do sumário do PDF via markdown gerado por IA ─────────────────
// Fluxo: copiar o prompt → mandar o PDF + prompt para a IA → colar o markdown
// de volta aqui → conferir a prévia → substituir/adicionar ao sumário.
function SummaryMarkdownImport({
  pageCount,
  materialTitle,
  hasExistingEntries,
  onImport,
  onClose,
}: {
  pageCount: number
  materialTitle?: string
  hasExistingEntries: boolean
  onImport: (entries: ParsedSummaryEntry[], mode: 'replace' | 'append') => void
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  const prompt = useMemo(
    () => buildSummaryPrompt({ pageCount, materialTitle }),
    [pageCount, materialTitle]
  )
  const parsed = useMemo(() => parseSummaryMarkdown(text, pageCount), [text, pageCount])

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sem permissão de clipboard: o prompt fica visível para cópia manual.
      setShowPrompt(true)
    }
  }

  const runImport = (mode: 'replace' | 'append') => {
    if (parsed.entries.length === 0) return
    onImport(parsed.entries, mode)
    setText('')
    onClose()
  }

  return (
    <div className="space-y-3 rounded-lg border border-violet-500/30 bg-violet-500/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 text-xs text-violet-800 dark:text-violet-200">
          <Wand2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="leading-snug">
            Copie o prompt, envie junto com o PDF para a IA e cole aqui o markdown que ela devolver.
            O sumário inteiro entra de uma vez, sem cadastrar entrada por entrada.
          </span>
        </div>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0" title="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Passo 1 — prompt */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-muted-foreground">
            1. Prompt para a IA {pageCount > 0 ? `(já inclui as ${pageCount} páginas deste PDF)` : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => setShowPrompt(s => !s)} className="h-7 text-xs">
              {showPrompt ? 'Ocultar' : 'Ver'}
            </Button>
            <Button type="button" size="sm" onClick={copyPrompt} className="h-7 gap-1 text-xs">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado!' : 'Copiar prompt'}
            </Button>
          </div>
        </div>
        {showPrompt && (
          <Textarea
            readOnly
            value={prompt}
            onFocus={e => e.currentTarget.select()}
            className="h-40 font-mono text-[11px] leading-relaxed"
          />
        )}
      </div>

      {/* Passo 2 — colar a resposta */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground">2. Cole a resposta da IA</span>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={SUMMARY_MARKDOWN_EXAMPLE}
          className="h-32 font-mono text-[11px] leading-relaxed"
        />
        <p className="text-[11px] text-muted-foreground">
          Formato: <code>#</code>/<code>##</code>/<code>###</code> para o nível e <code>:: página</code> no fim.
          Também aceita listas com <code>-</code>, numeração <code>1.2</code>, tabelas markdown e pontilhados
          (<code>Introdução ...... 3</code>).
        </p>
      </div>

      {/* Passo 3 — prévia + importar */}
      {text.trim() && (
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground">
            3. Prévia — {parsed.entries.length} {parsed.entries.length === 1 ? 'entrada lida' : 'entradas lidas'}
          </span>

          {parsed.entries.length > 0 && (
            <div className="max-h-44 overflow-y-auto rounded-md border border-input bg-background p-2 space-y-0.5">
              {parsed.entries.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-[11px]">
                  <span
                    className="flex-1 truncate"
                    style={{ paddingLeft: `${(entry.level ?? 0) * 12}px` }}
                    title={entry.title}
                  >
                    <span className="text-muted-foreground mr-1">H{(entry.level ?? 0) + 1}</span>
                    {entry.title}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">p. {entry.page}</span>
                </div>
              ))}
            </div>
          )}

          {parsed.warnings.map((warning, index) => (
            <p key={index} className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" /> {warning}
            </p>
          ))}

          {parsed.issues.length > 0 && (
            <details className="text-[11px] text-red-500">
              <summary className="cursor-pointer">
                {parsed.issues.length} {parsed.issues.length === 1 ? 'linha ignorada' : 'linhas ignoradas'}
              </summary>
              <ul className="mt-1 space-y-0.5 pl-4 list-disc">
                {parsed.issues.slice(0, 20).map((issue, index) => (
                  <li key={index}>
                    Linha {issue.line}: {issue.reason} — <span className="font-mono">{issue.text.slice(0, 80)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              onClick={() => runImport('replace')}
              disabled={parsed.entries.length === 0}
              className="h-8 gap-1 text-xs"
            >
              <Check className="h-3.5 w-3.5" />
              {hasExistingEntries ? 'Substituir sumário' : 'Importar sumário'}
            </Button>
            {hasExistingEntries && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => runImport('append')}
                disabled={parsed.entries.length === 0}
                className="h-8 gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar ao final
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => setText('')} className="h-8 text-xs">
              Limpar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Editor de Capa, Sumário e Navegação do PDF Viewer ───────────────────────
function PdfViewerStructureEditor({
  config,
  pageCount,
  materialTitle,
  onChange,
}: {
  config: PdfViewerConfig
  pageCount: number
  materialTitle?: string
  onChange: (next: PdfViewerConfig) => void
}) {
  const [importOpen, setImportOpen] = useState(false)
  const summary = config.summary || []
  const navigation = config.navigation || []
  const preview = config.preview || { enabled: false, ranges: [] }
  const previewRanges = preview.ranges || []
  const maxPage = pageCount > 0 ? pageCount : 99999
  const pageHint = pageCount > 0 ? `1–${pageCount}` : 'nº da página'
  const genId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const clampPage = (value: number) => Math.min(maxPage, Math.max(1, Math.floor(value) || 1))

  // Prévia (X–Y): páginas liberadas para quem ainda NÃO comprou.
  const setPreview = (patch: Partial<PdfPreviewConfig>) =>
    onChange({ ...config, preview: { enabled: preview.enabled, ranges: previewRanges, ...patch } })
  const addPreviewRange = () =>
    setPreview({
      enabled: true,
      ranges: [...previewRanges, { start: 1, end: Math.min(maxPage, 1) }],
    })
  const updatePreviewRange = (index: number, patch: Partial<PdfPreviewRange>) =>
    setPreview({
      ranges: previewRanges.map((r, i) => {
        if (i !== index) return r
        const next = { ...r, ...patch }
        // Mantém start <= end para nunca gerar intervalo invertido.
        if (patch.start !== undefined && next.end < next.start) next.end = next.start
        if (patch.end !== undefined && next.end < next.start) next.start = next.end
        return next
      }),
    })
  const removePreviewRange = (index: number) => {
    const ranges = previewRanges.filter((_, i) => i !== index)
    setPreview({ ranges, enabled: ranges.length > 0 ? preview.enabled : false })
  }
  const previewPageTotal = previewRanges.reduce((sum, r) => sum + Math.max(0, clampPage(r.end) - clampPage(r.start) + 1), 0)

  const setCover = (value: string) => {
    const n = parseInt(value, 10)
    onChange({ ...config, coverPage: Number.isFinite(n) && n >= 1 ? clampPage(n) : undefined })
  }

  // Sumário
  const addSummary = () =>
    onChange({ ...config, summary: [...summary, { id: genId('toc'), title: '', page: 1, level: 0 }] })
  // Insere o subtópico logo após o último descendente da entrada `parentId`,
  // em vez de jogar a nova linha para o fim da lista.
  const addSubtopic = (parentId: string) => {
    const parentIndex = summary.findIndex(s => s.id === parentId)
    if (parentIndex === -1) return
    const parentLevel = summary[parentIndex].level ?? 0
    let insertAt = parentIndex + 1
    while (insertAt < summary.length && (summary[insertAt].level ?? 0) > parentLevel) {
      insertAt++
    }
    const next = [...summary]
    next.splice(insertAt, 0, {
      id: genId('toc'),
      title: '',
      page: summary[parentIndex].page,
      level: Math.min(2, parentLevel + 1),
    })
    onChange({ ...config, summary: next })
  }
  const updateSummary = (id: string, patch: Partial<PdfSummaryEntry>) =>
    onChange({ ...config, summary: summary.map(s => s.id === id ? { ...s, ...patch } : s) })
  const removeSummary = (id: string) =>
    onChange({ ...config, summary: summary.filter(s => s.id !== id) })
  const moveSummary = (index: number, dir: -1 | 1) => {
    const next = [...summary]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange({ ...config, summary: next })
  }

  // Importação em lote: converte as entradas lidas do markdown em PdfSummaryEntry.
  const applyImportedSummary = (imported: ParsedSummaryEntry[], mode: 'replace' | 'append') => {
    const created = imported.map(entry => ({
      id: genId('toc'),
      title: entry.title,
      page: clampPage(entry.page),
      level: entry.level,
    }))
    onChange({ ...config, summary: mode === 'replace' ? created : [...summary, ...created] })
  }

  // Navegação
  const addNav = () =>
    onChange({ ...config, navigation: [...navigation, { id: genId('nav'), label: '', page: 1 }] })
  const updateNav = (id: string, patch: Partial<PdfNavEntry>) =>
    onChange({ ...config, navigation: navigation.map(n => n.id === id ? { ...n, ...patch } : n) })
  const removeNav = (id: string) =>
    onChange({ ...config, navigation: navigation.filter(n => n.id !== id) })

  return (
    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium">Estrutura do Viewer</span>
        <span className="text-[11px] text-muted-foreground">
          {pageCount > 0 ? `${pageCount} páginas` : 'páginas detectadas ao abrir o viewer'}
        </span>
      </div>

      {/* Prévia (páginas liberadas para quem não comprou) */}
      <div className="space-y-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <Eye className="h-3.5 w-3.5" /> Prévia antes de comprar
          </div>
          <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={preview.enabled}
              onChange={(e) =>
                setPreview({
                  enabled: e.target.checked,
                  ranges: e.target.checked && previewRanges.length === 0
                    ? [{ start: 1, end: Math.min(maxPage, 1) }]
                    : previewRanges,
                })
              }
              className="h-4 w-4 rounded border-input accent-amber-500"
            />
            {preview.enabled ? 'Ativa' : 'Desativada'}
          </label>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-snug text-amber-800 dark:text-amber-200">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Quem <strong>ainda não comprou</strong> poderá abrir o viewer e ver <strong>apenas</strong> as
            páginas dos intervalos abaixo. Todas as demais ficam <strong>bloqueadas no servidor</strong> — não há
            como burlar e ver o resto do PDF. Deixe desativada para bloquear o material por completo.
          </span>
        </div>

        {preview.enabled && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Intervalos de páginas liberados
                {previewPageTotal > 0 ? ` · ${previewPageTotal} pág. na prévia` : ''}
              </span>
              <Button type="button" size="sm" variant="outline" onClick={addPreviewRange} className="h-7 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Intervalo
              </Button>
            </div>
            {previewRanges.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Nenhum intervalo. Adicione ao menos um (ex.: 1–5) para liberar a prévia.
              </p>
            ) : (
              <div className="space-y-1.5">
                {previewRanges.map((range, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground w-14 shrink-0">Páginas</span>
                    <Input
                      type="number"
                      min={1}
                      max={pageCount > 0 ? pageCount : undefined}
                      value={range.start}
                      onChange={(e) => updatePreviewRange(index, { start: clampPage(parseInt(e.target.value, 10)) })}
                      className="h-9 w-20"
                      title="Página inicial"
                      placeholder="X"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="number"
                      min={1}
                      max={pageCount > 0 ? pageCount : undefined}
                      value={range.end}
                      onChange={(e) => updatePreviewRange(index, { end: clampPage(parseInt(e.target.value, 10)) })}
                      className="h-9 w-20"
                      title="Página final"
                      placeholder="Y"
                    />
                    <span className="text-[11px] text-muted-foreground flex-1 truncate">
                      ({pageHint})
                    </span>
                    <button type="button" onClick={() => removePreviewRange(index)}
                      className="text-red-500 hover:text-red-700 shrink-0" title="Remover intervalo">
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Capa */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" /> Capa
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={pageCount > 0 ? pageCount : undefined}
            value={config.coverPage ?? ''}
            onChange={e => setCover(e.target.value)}
            placeholder={`Página da capa (${pageHint})`}
            className="h-9 w-44"
          />
          {config.coverPage && (
            <button
              type="button"
              onClick={() => onChange({ ...config, coverPage: undefined })}
              className="text-xs text-muted-foreground hover:text-red-500"
            >
              Limpar
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          O viewer abre nesta página e a destaca nas miniaturas. Deixe vazio para abrir na página 1.
        </p>
      </div>

      {/* Sumário */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <List className="h-3.5 w-3.5" /> Sumário interativo
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setImportOpen(o => !o)}
              className="h-7 gap-1 text-xs border-violet-500/40 text-violet-600 hover:text-violet-700 dark:text-violet-300"
            >
              <Sparkles className="h-3.5 w-3.5" /> Importar com IA
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={addSummary} className="h-7 gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Entrada
            </Button>
          </div>
        </div>

        {importOpen && (
          <SummaryMarkdownImport
            pageCount={pageCount}
            materialTitle={materialTitle}
            hasExistingEntries={summary.length > 0}
            onImport={applyImportedSummary}
            onClose={() => setImportOpen(false)}
          />
        )}

        {summary.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Nenhuma entrada. Adicione títulos para criar o sumário clicável.</p>
        ) : (
          <div className="space-y-1.5">
            {summary.map((entry, index) => (
              <div key={entry.id} className="flex items-center gap-1.5">
                <div className="flex flex-col">
                  <button type="button" onClick={() => moveSummary(index, -1)} disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30" title="Mover para cima">
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => moveSummary(index, 1)} disabled={index === summary.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30" title="Mover para baixo">
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
                <select
                  value={entry.level ?? 0}
                  onChange={e => updateSummary(entry.id, { level: parseInt(e.target.value, 10) })}
                  className="h-9 rounded-md border border-input bg-background px-1 text-xs"
                  title="Nível de indentação"
                >
                  <option value={0}>H1</option>
                  <option value={1}>H2</option>
                  <option value={2}>H3</option>
                </select>
                <Input
                  value={entry.title}
                  onChange={e => updateSummary(entry.id, { title: e.target.value })}
                  placeholder="Título (ex.: Capítulo 1 — Introdução)"
                  className="h-9 flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  max={pageCount > 0 ? pageCount : undefined}
                  value={entry.page}
                  onChange={e => updateSummary(entry.id, { page: clampPage(parseInt(e.target.value, 10)) })}
                  className="h-9 w-20"
                  title="Página"
                />
                <button type="button" onClick={() => addSubtopic(entry.id)}
                  disabled={(entry.level ?? 0) >= 2}
                  className="text-emerald-600 hover:text-emerald-700 disabled:opacity-30 shrink-0"
                  title="Adicionar subtópico logo abaixo desta entrada">
                  <CornerDownRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => removeSummary(entry.id)}
                  className="text-red-500 hover:text-red-700 shrink-0" title="Remover">
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navegação rápida */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Navigation className="h-3.5 w-3.5" /> Páginas para navegação
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addNav} className="h-7 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Atalho
          </Button>
        </div>
        {navigation.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Atalhos rápidos (chips) exibidos no topo do viewer. Ex.: “Gabarito”, “Anexos”.</p>
        ) : (
          <div className="space-y-1.5">
            {navigation.map((entry) => (
              <div key={entry.id} className="flex items-center gap-1.5">
                <Input
                  value={entry.label}
                  onChange={e => updateNav(entry.id, { label: e.target.value })}
                  placeholder="Rótulo (ex.: Gabarito)"
                  className="h-9 flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  max={pageCount > 0 ? pageCount : undefined}
                  value={entry.page}
                  onChange={e => updateNav(entry.id, { page: clampPage(parseInt(e.target.value, 10)) })}
                  className="h-9 w-20"
                  title="Página"
                />
                <button type="button" onClick={() => removeNav(entry.id)}
                  className="text-red-500 hover:text-red-700 shrink-0" title="Remover">
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
/**
 * Traz as versões salvas para o formato do formulário, preenchendo defaults —
 * documentos antigos não têm o campo, e versões gravadas antes de um ajuste
 * podem não ter todos os campos.
 */
function normalizeVersionsForForm(raw: any): TimedAccessVersionForm[] {
  if (!Array.isArray(raw)) return []
  return raw.map((version: any, index: number) => ({
    id: String(version?.id || `tav-${index}-${Math.random().toString(36).slice(2, 8)}`),
    label: String(version?.label || ''),
    description: version?.description ? String(version.description) : '',
    price: Number(version?.price || 0),
    durationDays: Math.max(0, Math.floor(Number(version?.durationDays) || 0)),
    durationHours: Math.max(0, Math.floor(Number(version?.durationHours) || 0)),
    isActive: version?.isActive !== false,
    highlight: version?.highlight === true,
    order: Math.max(0, Math.floor(Number(version?.order) || index)),
  }))
}

export default function AdminMateriaisPage() {
  return (
    <AppShell headerTitle="Gerenciar Materiais" headerSubtitle="Marketplace de materiais de estudo">
      <AdminMateriaisContent />
    </AppShell>
  )
}
