'use client'

import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Download,
  Eye,
  ShoppingCart,
  Package,
  FolderOpen,
  ArrowLeft,
  Star,
  FileText,
  Video,
  Link2,
  Image as ImageIcon,
  File,
  Sparkles,
  Check,
  ChevronRight,
  Lock,
  Gift,
  X,
  Play,
  ShieldAlert,
  Crown,
  Zap,
  GraduationCap,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppShell } from '@/components/app-shell'
import { Share2, CheckCheck } from 'lucide-react'
import { PackageUpsellModal } from '@/components/materiais/package-upsell-modal'
import {
  DownloadStepId,
  INITIAL_DOWNLOAD_STATE,
  PdfDownloadProgress,
  PdfDownloadState,
} from '@/components/materiais/pdf-download-progress'
import {
  downloadPdfResponse,
  shouldUseNativePdfDownload,
  triggerNativePdfDownload,
} from '@/lib/material-download-client'

interface Material {
  _id: string
  title: string
  description: string
  coverImage: string
  type: string
  downloadUrl: string
  folderId: string | null
  moduloId: string
  tags: string[]
  allowedGroups: string[]
  videoDuration?: number
  pricing: 'free' | 'paid'
  price: number
  downloadCount: number
  viewCount: number
  isHidden: boolean
  isFeatured: boolean
  order: number
  createdAt: string
  // Server-computed access flags (definitive — bypass client-side string matching)
  _isPurchased?: boolean
  _hasGroupAccess?: boolean
  _hasAccess?: boolean
  _cardCount?: number
  // PDF interno
  _hasPdf?: boolean
  pdfViewerEnabled?: boolean
  pdfDownloadEnabled?: boolean
}

// Groups that can have restricted access to materials
const GROUP_META: Record<string, { label: string; color: string; icon: React.ReactNode; upgradeMsg: string }> = {
  gratuito: { label: 'Gratuito', color: '#6b7280', icon: <Gift className="h-3.5 w-3.5" />, upgradeMsg: 'Disponível na conta Gratuita' },
  trial:    { label: 'Trial',    color: '#3b82f6', icon: <Clock className="h-3.5 w-3.5" />, upgradeMsg: 'Disponível no período Trial' },
  essential:{ label: 'Essential',color: '#8b5cf6', icon: <Zap className="h-3.5 w-3.5" />,  upgradeMsg: 'Disponível no plano Essential' },
  premium:  { label: 'Premium',  color: '#f59e0b', icon: <Crown className="h-3.5 w-3.5" />, upgradeMsg: 'Disponível no plano Premium' },
  monitor:  { label: 'Monitor',  color: '#10b981', icon: <GraduationCap className="h-3.5 w-3.5" />, upgradeMsg: 'Disponível para Monitores' },
}

interface Folder {
  _id: string
  name: string
  description: string
  coverImage: string
  color: string
  icon: string
  parentFolderId: string | null
  order: number
}

interface MaterialPackage {
  _id: string
  title: string
  description: string
  coverImage: string
  materialIds: string[]
  materials: { _id: string; title: string; coverImage: string; type: string }[]
  tags: string[]
  allowedGroups: string[]
  pricing: 'free' | 'paid'
  price: number
  originalPrice: number
  downloadCount: number
  viewCount: number
  isFeatured: boolean
  createdAt: string
  _isPurchased?: boolean
  _hasGroupAccess?: boolean
  _hasAccess?: boolean
  _pricing?: {
    originalPackagePrice: number
    effectivePrice: number
    discountApplied: number
    ownedValue: number
    totalPaidIndividualValue: number
    ownedMaterialIds: string[]
  }
}

interface BrowseSnapshot {
  materials: Material[]
  folders: Folder[]
  allFolders: Folder[]
  packages: MaterialPackage[]
  purchasedIds: string[]
  purchasedPackageIds: string[]
  userGroups: string[]
  isAuthenticated: boolean
}

const ROOT_FOLDER_KEY = 'root'

function getBrowseKey(folderId: string | null, search: string, filter: string) {
  return [
    folderId || ROOT_FOLDER_KEY,
    search.trim().toLowerCase(),
    filter,
  ].join('::')
}

function getFolderChildren(flat: Folder[], parentFolderId: string | null) {
  return flat
    .filter(folder => {
      if (parentFolderId) return folder.parentFolderId === parentFolderId
      return !folder.parentFolderId
    })
    .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name, 'pt-BR'))
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m > 0 ? `${m}min` : ''}`.trim()
  if (m > 0) return `${m}min${s > 0 ? ` ${s}s` : ''}`
  return `${s}s`
}

function formatBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  video_embed: <Play className="h-5 w-5" />,
  link: <Link2 className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  document: <File className="h-5 w-5" />,
  other: <File className="h-5 w-5" />,
  flashcard_deck: <Sparkles className="h-5 w-5" />,
}

const typeLabels: Record<string, string> = {
  pdf: 'PDF',
  video: 'Vídeo',
  video_embed: 'Vídeo',
  link: 'Link',
  image: 'Imagem',
  document: 'Documento',
  other: 'Outro',
  flashcard_deck: 'Flashcard',
}

// ─── Debounce hook ─────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// ─── Copy-link hook ────────────────────────────────────────
function useCopyLink() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copy = useCallback((id: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }, [])

  return { copiedId, copy }
}

function MateriaisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [materials, setMaterials] = useState<Material[]>([])
  const [allFolders, setAllFolders] = useState<Folder[]>([])   // full flat list for path resolution
  const [folders, setFolders] = useState<Folder[]>([])          // children of current folder
  const [packages, setPackages] = useState<MaterialPackage[]>([])
  const [purchasedIds, setPurchasedIds] = useState<string[]>([])
  const [purchasedPackageIds, setPurchasedPackageIds] = useState<string[]>([])
  const [userGroups, setUserGroups] = useState<string[]>([])   // groups the current user belongs to
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'paid'>('all')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<Folder[]>([])
  const [activeTab, setActiveTab] = useState<'materials' | 'packages' | 'mine'>('materials')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [highlightedMaterialId, setHighlightedMaterialId] = useState<string | null>(null)
  const [highlightedPackageId, setHighlightedPackageId] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<{ type: 'material'; data: Material } | { type: 'package'; data: MaterialPackage } | null>(null)
  const [upsellState, setUpsellState] = useState<{ pkg: MaterialPackage; material: Material } | null>(null)
  const [pdfDownloading, setPdfDownloading] = useState<string | null>(null) // materialId sendo baixado
  const [pdfDownloadError, setPdfDownloadError] = useState<string | null>(null)
  const [pdfDownloadMaterial, setPdfDownloadMaterial] = useState<Material | null>(null)
  const [downloadState, setDownloadState] = useState<PdfDownloadState>(INITIAL_DOWNLOAD_STATE)
  const [isRoutePending, startRouteTransition] = useTransition()
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const highlightRef = useRef<HTMLDivElement | null>(null)
  const requestSeqRef = useRef(0)
  const browseCacheRef = useRef<Map<string, BrowseSnapshot>>(new Map())
  const allFoldersCacheRef = useRef<Folder[] | null>(null)
  const packagesCacheRef = useRef<Pick<BrowseSnapshot, 'packages' | 'purchasedPackageIds' | 'userGroups'> | null>(null)
  const { copiedId, copy } = useCopyLink()

  useEffect(() => () => { stepTimersRef.current.forEach(clearTimeout) }, [])

  // Access check: true if user belongs to any of the item's allowed groups (or no restriction set)
  const hasGroupAccess = useCallback((item: { allowedGroups?: string[]; _hasGroupAccess?: boolean }): boolean => {
    if (typeof item._hasGroupAccess === 'boolean') return item._hasGroupAccess
    if (!item.allowedGroups || item.allowedGroups.length === 0) return true
    return userGroups.some(g => item.allowedGroups!.includes(g))
  }, [userGroups])

  // ─── Build folder ancestry path ─────────────────────────
  const buildPath = useCallback((folderId: string, flat: Folder[]): Folder[] => {
    const path: Folder[] = []
    let current = flat.find(f => f._id === folderId)
    while (current) {
      path.unshift(current)
      const parentId = current.parentFolderId
      current = parentId ? flat.find(f => f._id === parentId) : undefined
    }
    return path
  }, [])

  const applySnapshot = useCallback((snapshot: BrowseSnapshot, folderId: string | null) => {
    setMaterials(snapshot.materials)
    setFolders(snapshot.folders)
    setAllFolders(snapshot.allFolders)
    setPackages(snapshot.packages)
    setPurchasedIds(snapshot.purchasedIds)
    setPurchasedPackageIds(snapshot.purchasedPackageIds)
    setUserGroups(snapshot.userGroups)
    setIsAuthenticated(snapshot.isAuthenticated)
    setFolderPath(folderId ? buildPath(folderId, snapshot.allFolders) : [])
  }, [buildPath])

  // ─── Fetch all data ──────────────────────────────────────
  const fetchData = useCallback(async (
    folderId: string | null,
    srch: string,
    filter: string,
    options?: { force?: boolean; prefetchOnly?: boolean }
  ) => {
    const key = getBrowseKey(folderId, srch, filter)
    const cached = browseCacheRef.current.get(key)

    if (cached && !options?.force) {
      if (!options?.prefetchOnly) {
        applySnapshot(cached, folderId)
        setLoading(false)
        setRefreshing(false)
      }
      return
    }

    if (!options?.prefetchOnly) {
      const hasVisibleData = materials.length > 0 || folders.length > 0
      setLoading(!hasVisibleData)
      setRefreshing(hasVisibleData)
    }

    const requestId = options?.prefetchOnly ? requestSeqRef.current : ++requestSeqRef.current

    try {
      const params = new URLSearchParams()
      if (folderId) params.set('folderId', folderId)
      if (srch) params.set('search', srch)
      if (filter !== 'all') params.set('pricing', filter)

      const childFolderQuery = folderId ? `?parentFolderId=${folderId}` : ''
      const allFoldersPromise = allFoldersCacheRef.current && !options?.force
        ? Promise.resolve({ folders: allFoldersCacheRef.current })
        : fetch('/api/materiais/folders?all=true', { cache: 'no-store' }).then(res => res.ok ? res.json() : { folders: [] })
      const packagesPromise = packagesCacheRef.current && !options?.force
        ? Promise.resolve(packagesCacheRef.current)
        : fetch('/api/materiais/packages', { cache: 'no-store' }).then(res => res.ok ? res.json() : { packages: [], purchasedPackageIds: [], userGroups: [] })

      const [materialsData, foldersData, allFoldersData, packagesData] = await Promise.all([
        fetch(`/api/materiais?${params}`, { cache: 'no-store' }).then(res => res.ok ? res.json() : { materials: [], purchasedIds: [], userGroups: [] }),
        fetch(`/api/materiais/folders${childFolderQuery}`, { cache: 'no-store' }).then(res => res.ok ? res.json() : { folders: [] }),
        allFoldersPromise,
        packagesPromise,
      ])

      if (requestId !== requestSeqRef.current && !options?.prefetchOnly) return

      const nextAllFolders: Folder[] = allFoldersData.folders || []
      const nextPackages: MaterialPackage[] = packagesData.packages || []
      const nextUserGroups = materialsData.userGroups?.length
        ? materialsData.userGroups
        : (packagesData.userGroups || [])

      allFoldersCacheRef.current = nextAllFolders
      packagesCacheRef.current = {
        packages: nextPackages,
        purchasedPackageIds: packagesData.purchasedPackageIds || [],
        userGroups: packagesData.userGroups || [],
      }

      const snapshot: BrowseSnapshot = {
        materials: materialsData.materials || [],
        folders: foldersData.folders || [],
        allFolders: nextAllFolders,
        packages: nextPackages,
        purchasedIds: materialsData.purchasedIds || [],
        purchasedPackageIds: packagesData.purchasedPackageIds || [],
        userGroups: nextUserGroups,
        isAuthenticated: !!(materialsData.isAuthenticated || packagesData.isAuthenticated),
      }

      browseCacheRef.current.set(key, snapshot)

      if (!options?.prefetchOnly) {
        applySnapshot(snapshot, folderId)
      }
    } catch (err) {
      console.error('Erro ao carregar materiais:', err)
    } finally {
      if (!options?.prefetchOnly && requestId === requestSeqRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [applySnapshot, folders.length, materials.length])

  // ─── Init from URL params ────────────────────────────────
  useEffect(() => {
    const folderParam = searchParams.get('folder')
    const materialParam = searchParams.get('material')
    const packageParam = searchParams.get('package')
    const tabParam = searchParams.get('tab')

    if (tabParam === 'packages') setActiveTab('packages')
    if (tabParam === 'mine') setActiveTab('mine')
    if (folderParam) setCurrentFolderId(folderParam)
    // Redirect old ?material= share links to the individual page
    if (materialParam) { router.replace(`/materiais/${materialParam}`); return }
    // Redirect old ?package= share links to the new individual package page
    if (packageParam) { router.replace(`/pacotes/${packageParam}`); return }

    if (searchParams.get('purchase') === 'success') {
      setSuccessMessage('Compra realizada com sucesso! O material já está disponível para download.')
      setTimeout(() => setSuccessMessage(''), 5000)
    }

    // Signal that URL params have been applied — data fetch can now run
    setReady(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready) return
    fetchData(currentFolderId, debouncedSearch, activeFilter)
  }, [ready, fetchData, currentFolderId, debouncedSearch, activeFilter])

  // Scroll to highlighted item
  useEffect(() => {
    if ((highlightedMaterialId || highlightedPackageId) && !loading && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const t = setTimeout(() => {
        setHighlightedMaterialId(null)
        setHighlightedPackageId(null)
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [highlightedMaterialId, highlightedPackageId, loading])

  // ─── Navigation (syncs URL) ──────────────────────────────
  const navigateToFolder = useCallback((folder: Folder) => {
    startRouteTransition(() => {
      setCurrentFolderId(folder._id)
      const flat = allFoldersCacheRef.current || allFolders
      if (flat.length > 0) {
        setFolderPath(buildPath(folder._id, flat))
        setFolders(getFolderChildren(flat, folder._id))
      } else {
        setFolderPath(prev => [...prev, folder])
      }
    })
    router.push(`/materiais?folder=${folder._id}`, { scroll: false })
  }, [allFolders, buildPath, router])

  const navigateToPathIndex = useCallback((index: number) => {
    startRouteTransition(() => {
      const flat = allFoldersCacheRef.current || allFolders
      if (index < 0) {
        setCurrentFolderId(null)
        setFolderPath([])
        if (flat.length > 0) setFolders(getFolderChildren(flat, null))
        router.push('/materiais', { scroll: false })
      } else {
        const newPath = folderPath.slice(0, index + 1)
        const target = newPath[newPath.length - 1]
        setCurrentFolderId(target._id)
        setFolderPath(newPath)
        if (flat.length > 0) setFolders(getFolderChildren(flat, target._id))
        router.push(`/materiais?folder=${target._id}`, { scroll: false })
      }
    })
  }, [allFolders, folderPath, router])

  const prefetchFolder = useCallback((folderId: string) => {
    fetchData(folderId, debouncedSearch, activeFilter, { prefetchOnly: true }).catch(() => {})
  }, [activeFilter, debouncedSearch, fetchData])

  // ─── Copy-link helpers ───────────────────────────────────
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const copyFolderLink = (folder: Folder) =>
    copy(folder._id, `${origin}/materiais?folder=${folder._id}`)
  const copyMaterialLink = (material: Material) =>
    copy(material._id, `${origin}/materiais/${material._id}`)
  const copyPackageLink = (pkg: MaterialPackage) =>
    copy(pkg._id, `${origin}/pacotes/${pkg._id}`)

  // ─── Acquire / Download ──────────────────────────────────
  const handleAcquire = async (itemType: 'material' | 'package', itemId: string) => {
    // Verifica se é grátis (pricing free) — endpoint sem cardToken libera direto
    const item =
      itemType === 'package'
        ? packages.find(p => p._id === itemId)
        : materials.find(m => m._id === itemId)
    if (item) {
      fetch('/api/analytics/checkout-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'buy_click',
          productId: itemId,
          productTitle: item.title,
          productType: itemType === 'package' ? 'package' : (item as Material).type === 'flashcard_deck' ? 'flashcard' : 'material',
          amount: Number(item.price || 0),
          source: itemType === 'package' ? 'Pacote' : 'Compra direta',
          metadata: { itemType, pricing: item.pricing },
        }),
        keepalive: true,
      }).catch(() => {})
    }
    if (!isAuthenticated) {
      const checkoutPath = `/materiais/checkout?type=${itemType}&id=${itemId}`
      router.push(`/auth/login?redirect=${encodeURIComponent(checkoutPath)}`)
      return
    }
    if (!item) return
    const effectivePackagePrice = itemType === 'package'
      ? Number((item as MaterialPackage)?._pricing?.effectivePrice ?? item.price ?? 0)
      : Number(item.price ?? 0)
    if (item.pricing === 'free' || effectivePackagePrice <= 0) {
      setCheckoutLoading(itemId)
      try {
        const res = await fetch('/api/materiais/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemType, itemId, paymentMethodId: 'free' }),
        })
        const data = await res.json()
        if (data.free) {
          setSuccessMessage('Material adquirido com sucesso! Faça o download agora.')
          fetchData(currentFolderId, debouncedSearch, activeFilter, { force: true })
          setTimeout(() => setSuccessMessage(''), 4000)
        } else {
          alert(data.error || 'Erro ao processar')
        }
      } catch {
        alert('Erro ao processar aquisição')
      } finally {
        setCheckoutLoading(null)
      }
      return
    }
    // Item pago: vai para o checkout MP
    router.push(`/materiais/checkout?type=${itemType}&id=${itemId}`)
  }

  const handleMaterialAcquire = (material: Material) => {
    // Upsell is only fair before the user owns any item from the package.
    const pkg = packages.find(p =>
      p.materialIds?.includes(material._id) &&
      !isPurchased(p._id, 'package') &&
      !p._pricing?.ownedMaterialIds?.length &&
      !p.materialIds?.some(id => purchasedIds.includes(id))
    )
    if (pkg) {
      setUpsellState({ pkg, material })
    } else {
      handleAcquire('material', material._id)
    }
  }

  const startPdfDownload = useCallback(async (materialOverride?: Material) => {
    const material = materialOverride || pdfDownloadMaterial
    if (!material) return

    stepTimersRef.current.forEach(clearTimeout)
    stepTimersRef.current = []
    setPdfDownloadMaterial(material)
    setPdfDownloadError(null)
    setPdfDownloading(material._id)
    setDownloadState({ step: 'auth', status: 'running' })

    const t1 = setTimeout(() => {
      setDownloadState(s => s.status === 'running' ? { ...s, step: 'fetch' } : s)
    }, 400)
    const t2 = setTimeout(() => {
      setDownloadState(s => s.status === 'running' ? { ...s, step: 'watermark' } : s)
    }, 1800)
    stepTimersRef.current = [t1, t2]

    try {
      if (shouldUseNativePdfDownload()) {
        stepTimersRef.current.forEach(clearTimeout)
        setDownloadState({ step: 'ready', status: 'running' })
        triggerNativePdfDownload(material._id)
        const tSuccess = setTimeout(() => {
          setDownloadState({ step: 'ready', status: 'success' })
        }, 1200)
        const tClose = setTimeout(() => setDownloadState(INITIAL_DOWNLOAD_STATE), 5200)
        stepTimersRef.current = [tSuccess, tClose]
        return
      }

      const res = await fetch('/api/materiais/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId: material._id }),
      })

      stepTimersRef.current.forEach(clearTimeout)
      stepTimersRef.current = []

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setDownloadState({
          step: 'auth',
          status: 'error',
          error: data.error || 'Erro ao gerar PDF. Tente novamente.',
          errorStep: 'auth',
        })
        return
      }

      setDownloadState({ step: 'ready', status: 'running' })

      await downloadPdfResponse(res, `${material.title}.pdf`)

      setDownloadState({ step: 'ready', status: 'success' })
      const tClose = setTimeout(() => setDownloadState(INITIAL_DOWNLOAD_STATE), 2800)
      stepTimersRef.current = [tClose]
    } catch {
      stepTimersRef.current.forEach(clearTimeout)
      stepTimersRef.current = []
      setDownloadState(s => ({
        ...s,
        status: 'error',
        error: 'Erro de conexão. Verifique sua internet e tente novamente.',
        errorStep: s.step as DownloadStepId,
      }))
    } finally {
      setPdfDownloading(null)
    }
  }, [pdfDownloadMaterial])

  const handleDownload = async (material: Material) => {
    if (material.type === 'video_embed') {
      router.push(`/materiais/${material._id}`)
      return
    }
    if (material.type === 'flashcard_deck' && material.downloadUrl) {
      router.push(material.downloadUrl)
      return
    }

    if (material._hasPdf) {
      if (material.pdfDownloadEnabled === false) {
        if (material.pdfViewerEnabled) {
          router.push(`/materiais/${material._id}/viewer`)
        } else {
          router.push(`/materiais/${material._id}`)
        }
        return
      }
      startPdfDownload(material)
      return
    }

    if (material.downloadUrl) {
      window.open(material.downloadUrl, '_blank')
    }
  }

  // Prefer the server-attached _isPurchased flag (definitive), fall back to legacy
  // purchasedIds.includes() only if the server hasn't attached the flag.
  const isPurchased = (id: string, type: 'material' | 'package') => {
    if (type === 'material') {
      const m = materials.find(x => x._id === id)
      if (m && typeof m._isPurchased === 'boolean') return m._isPurchased
      return purchasedIds.includes(id)
    }
    const p = packages.find(x => x._id === id)
    if (p && typeof p._isPurchased === 'boolean') return p._isPurchased
    return purchasedPackageIds.includes(id)
  }

  const featuredMaterials = useMemo(() => materials.filter(m => m.isFeatured), [materials])
  const featuredPackages = useMemo(() => packages.filter(p => p.isFeatured), [packages])
  const visibleMaterials = useMemo(
    () => materials.filter(m => !m.isFeatured || currentFolderId),
    [currentFolderId, materials]
  )
  const myMaterials = useMemo(() => materials.filter(m => m._hasAccess), [materials])
  const currentFolder = currentFolderId
    ? (allFolders.find(folder => folder._id === currentFolderId) || folderPath[folderPath.length - 1] || null)
    : null
  const isSoftLoading = refreshing || isRoutePending

  return (
    <div className="min-h-screen pb-20">
      {/* ─── Hero / Header ─── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-heading font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Materiais
                </h1>
                <p className="text-sm text-muted-foreground">Marketplace de materiais de estudo</p>
              </div>
            </div>
          </motion.div>

          {/* Success Banner */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mt-4 p-4 rounded-2xl glass-card border-green-500/30 bg-green-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-green-700 dark:text-green-300 font-medium text-sm">{successMessage}</p>
                  <button onClick={() => setSuccessMessage('')} className="ml-auto"><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PDF Download Error Banner */}
          <AnimatePresence>
            {pdfDownloadError && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mt-4 p-4 rounded-2xl glass-card border-red-500/30 bg-red-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-red-700 dark:text-red-300 font-medium text-sm">{pdfDownloadError}</p>
                  <button onClick={() => setPdfDownloadError(null)} className="ml-auto"><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search & Filters */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar materiais..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 glass-input rounded-xl h-11 border-white/20" />
            </div>
            <div className="flex gap-2">
              {(['all', 'free', 'paid'] as const).map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeFilter === f ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'glass-button text-muted-foreground hover:text-foreground'}`}>
                  {f === 'all' ? 'Todos' : f === 'free' ? 'Gratuitos' : 'Pagos'}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 flex gap-1 p-1 rounded-xl glass-sm w-fit">
            {([
              { id: 'materials', label: 'Materiais', icon: <FileText className="h-4 w-4" /> },
              { id: 'packages', label: 'Pacotes', icon: <Package className="h-4 w-4" /> },
              { id: 'mine', label: 'Meus Materiais', icon: <Check className="h-4 w-4" /> },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  const url = tab.id === 'packages' ? '/materiais?tab=packages' : tab.id === 'mine' ? '/materiais?tab=mine' : '/materiais'
                  router.push(url, { scroll: false })
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <span className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                  {tab.id === 'packages' && packages.length > 0 && (
                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{packages.length}</span>
                  )}
                  {tab.id === 'mine' && materials.filter(m => m._hasAccess).length > 0 && (
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                      {materials.filter(m => m._hasAccess).length}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </motion.div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/50 px-3 py-1.5 backdrop-blur">
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
              {currentFolder ? currentFolder.name : 'Biblioteca principal'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/50 px-3 py-1.5 backdrop-blur">
              <FileText className="h-3.5 w-3.5 text-primary" />
              {visibleMaterials.length} {visibleMaterials.length === 1 ? 'material' : 'materiais'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/50 px-3 py-1.5 backdrop-blur">
              <Package className="h-3.5 w-3.5 text-primary" />
              {packages.length} {packages.length === 1 ? 'pacote' : 'pacotes'}
            </span>
            {isSoftLoading && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-medium text-primary">
                <span className="h-3 w-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                Atualizando
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        {/* ─── Featured Materials ─── */}
        {activeTab === 'materials' && featuredMaterials.length > 0 && !currentFolderId && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-heading font-bold">Destaques</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredMaterials.map((material, idx) => (
                <div key={material._id} ref={highlightedMaterialId === material._id ? highlightRef : null}>
                  <FeaturedCard
                    material={material}
                    index={idx}
                    isPurchased={isPurchased(material._id, 'material')}
                    groupAccess={hasGroupAccess(material)}
                    isHighlighted={highlightedMaterialId === material._id}
                    copiedId={copiedId}
                    onAcquire={() => handleMaterialAcquire(material)}
                    onDownload={() => handleDownload(material)}
                    onCopyLink={() => copyMaterialLink(material)}
                    onPreview={() => setPreviewItem({ type: 'material', data: material })}
                    loading={checkoutLoading === material._id || pdfDownloading === material._id}
                  />
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ─── Featured Packages ─── */}
        {activeTab === 'packages' && featuredPackages.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-heading font-bold">Pacotes em Destaque</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredPackages.map((pkg, idx) => (
                <div key={pkg._id} ref={highlightedPackageId === pkg._id ? highlightRef : null}>
                  <PackageCard
                    pkg={pkg}
                    index={idx}
                    isPurchased={isPurchased(pkg._id, 'package')}
                    groupAccess={hasGroupAccess(pkg)}
                    isHighlighted={highlightedPackageId === pkg._id}
                    copiedId={copiedId}
                    onAcquire={() => handleAcquire('package', pkg._id)}
                    onCopyLink={() => copyPackageLink(pkg)}
                    onPreview={() => setPreviewItem({ type: 'package', data: pkg })}
                    loading={checkoutLoading === pkg._id}
                  />
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ─── Materials Tab ─── */}
        {activeTab === 'materials' && (
          <>
            {/* Breadcrumb */}
            {folderPath.length > 0 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1 mb-4 flex-wrap">
                <button onClick={() => navigateToPathIndex(-1)} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Início
                </button>
                {folderPath.map((f, i) => (
                  <span key={f._id} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <button
                      onClick={() => navigateToPathIndex(i)}
                      className={`text-sm transition-colors ${i === folderPath.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-primary'}`}
                    >
                      {f.icon} {f.name}
                    </button>
                    {/* Copy link for current folder in breadcrumb */}
                    {i === folderPath.length - 1 && (
                      <button onClick={() => copyFolderLink(f)} className="ml-0.5 text-muted-foreground hover:text-primary transition-colors" title="Copiar link desta pasta">
                        {copiedId === f._id ? <CheckCheck className="h-3 w-3 text-green-500" /> : <Share2 className="h-3 w-3" />}
                      </button>
                    )}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Folders */}
            {folders.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" /> Pastas
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {folders.map((folder, idx) => (
                    <FolderCard
                      key={folder._id}
                      folder={folder}
                      index={idx}
                      copiedId={copiedId}
                      onClick={() => navigateToFolder(folder)}
                      onPrefetch={() => prefetchFolder(folder._id)}
                      onCopyLink={() => copyFolderLink(folder)}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Materials Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl glass-card p-4 animate-pulse">
                    <div className="h-40 rounded-xl bg-muted mb-3" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : visibleMaterials.length === 0 && folders.length === 0 && featuredMaterials.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <div className="h-20 w-20 rounded-full glass-card mx-auto flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-heading font-bold mb-2">Nenhum material encontrado</h3>
                <p className="text-muted-foreground text-sm">{search ? 'Tente buscar com outros termos' : 'Novos materiais em breve!'}</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleMaterials.map((material, idx) => (
                  <div key={material._id} ref={highlightedMaterialId === material._id ? highlightRef : null}>
                    <MaterialCard
                      material={material}
                      index={idx}
                      isPurchased={isPurchased(material._id, 'material')}
                      groupAccess={hasGroupAccess(material)}
                      isHighlighted={highlightedMaterialId === material._id}
                      copiedId={copiedId}
                      onAcquire={() => handleMaterialAcquire(material)}
                      onDownload={() => handleDownload(material)}
                      onCopyLink={() => copyMaterialLink(material)}
                      onPreview={() => setPreviewItem({ type: 'material', data: material })}
                      loading={checkoutLoading === material._id || pdfDownloading === material._id}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Packages Tab ─── */}
        {activeTab === 'packages' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl glass-card p-6 animate-pulse">
                    <div className="aspect-[16/10] rounded-xl bg-muted mb-4" />
                    <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : packages.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <div className="h-20 w-20 rounded-full glass-card mx-auto flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-heading font-bold mb-2">Nenhum pacote disponível</h3>
                <p className="text-muted-foreground text-sm">Novos pacotes em breve!</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.filter(p => !p.isFeatured).map((pkg, idx) => (
                  <div key={pkg._id} ref={highlightedPackageId === pkg._id ? highlightRef : null}>
                    <PackageCard
                      pkg={pkg}
                      index={idx}
                      isPurchased={isPurchased(pkg._id, 'package')}
                      groupAccess={hasGroupAccess(pkg)}
                      isHighlighted={highlightedPackageId === pkg._id}
                      copiedId={copiedId}
                      onAcquire={() => handleAcquire('package', pkg._id)}
                      onCopyLink={() => copyPackageLink(pkg)}
                      onPreview={() => setPreviewItem({ type: 'package', data: pkg })}
                      loading={checkoutLoading === pkg._id}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Meus Materiais Tab ─── */}
        {activeTab === 'mine' && (
            <>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl glass-card animate-pulse">
                      <div className="aspect-[16/10] rounded-t-2xl bg-muted" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : myMaterials.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                  <div className="h-20 w-20 rounded-full glass-card mx-auto flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-heading font-bold mb-2">Nenhum material ainda</h3>
                  <p className="text-muted-foreground text-sm mb-4">Você ainda não adquiriu nenhum material.</p>
                  <button onClick={() => { setActiveTab('materials'); router.push('/materiais', { scroll: false }) }}
                    className="text-sm text-primary font-medium hover:underline">
                    Ver todos os materiais
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {myMaterials.map((material, idx) => (
                    <MaterialCard
                      key={material._id}
                      material={material}
                      index={idx}
                      isPurchased={isPurchased(material._id, 'material')}
                      groupAccess={hasGroupAccess(material)}
                      isHighlighted={false}
                      copiedId={copiedId}
                      onAcquire={() => handleMaterialAcquire(material)}
                      onDownload={() => handleDownload(material)}
                      onCopyLink={() => copyMaterialLink(material)}
                      onPreview={() => setPreviewItem({ type: 'material', data: material })}
                      loading={checkoutLoading === material._id || pdfDownloading === material._id}
                    />
                  ))}
                </div>
              )}
            </>
        )}
      </div>

      {/* ─── Package Upsell Modal ─── */}
      <AnimatePresence>
        {upsellState && (
          <PackageUpsellModal
            pkg={upsellState.pkg}
            item={{
              id: upsellState.material._id,
              title: upsellState.material.title,
              price: upsellState.material.price,
              type: upsellState.material.type,
            }}
            loadingPackage={checkoutLoading === upsellState.pkg._id}
            loadingIndividual={checkoutLoading === upsellState.material._id}
            onBuyPackage={() => {
              setUpsellState(null)
              handleAcquire('package', upsellState.pkg._id)
            }}
            onBuyIndividual={() => {
              setUpsellState(null)
              handleAcquire('material', upsellState.material._id)
            }}
            onClose={() => setUpsellState(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Preview Modal (locked content) ─── */}
      <AnimatePresence>
        {previewItem && (
          <PreviewModal
            item={previewItem}
            onClose={() => setPreviewItem(null)}
            onAcquire={previewItem.type === 'material'
              ? () => { setPreviewItem(null); handleAcquire('material', previewItem.data._id) }
              : () => { setPreviewItem(null); handleAcquire('package', previewItem.data._id) }
            }
            checkoutLoading={checkoutLoading}
          />
        )}
      </AnimatePresence>

      <PdfDownloadProgress
        materialTitle={pdfDownloadMaterial?.title ?? ''}
        state={downloadState}
        onRetry={() => startPdfDownload()}
        onClose={() => setDownloadState(INITIAL_DOWNLOAD_STATE)}
      />

    </div>
  )
}

// ─── Shared CopyLink Button ─────────────────────────────────
function CopyLinkBtn({ id, copiedId, onClick }: { id: string; copiedId: string | null; onClick: (e: React.MouseEvent) => void }) {
  const copied = copiedId === id
  return (
    <button
      onClick={onClick}
      title={copied ? 'Link copiado!' : 'Copiar link'}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 backdrop-blur-xl border ${
        copied
          ? 'bg-green-500/30 text-green-100 border-green-400/30'
          : 'bg-white/15 text-white/80 border-white/20 hover:bg-white/25'
      }`}
    >
      {copied ? <CheckCheck className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
      {copied ? 'Copiado!' : 'Compartilhar'}
    </button>
  )
}

// ─── Locked Group Overlay ────────────────────────────────────
function LockedGroupOverlay({ allowedGroups, onPreview }: { allowedGroups: string[]; onPreview?: () => void }) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-background/60 backdrop-blur-md p-4 text-center cursor-pointer group/locked"
      onClick={onPreview}
    >
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center mb-3 transition-transform group-hover/locked:scale-110">
        <Lock className="h-6 w-6 text-violet-500" />
      </div>
      <p className="font-heading font-bold text-sm mb-1">Acesso Restrito</p>
      <p className="text-xs text-muted-foreground mb-3">Este conteúdo é exclusivo para:</p>
      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
        {allowedGroups.map(g => {
          const meta = GROUP_META[g]
          if (!meta) return null
          return (
            <span key={g} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={{ color: meta.color, background: meta.color + '18', borderColor: meta.color + '40' }}>
              {meta.icon} {meta.label}
            </span>
          )
        })}
      </div>
      {onPreview && (
        <span className="mt-1 flex items-center gap-1 text-[11px] text-primary font-medium underline-offset-2 hover:underline">
          <Info className="h-3 w-3" /> Ver detalhes
        </span>
      )}
    </div>
  )
}

// ─── Folder Card Component ───────────────────────────────────
function FolderCard({
  folder, index, copiedId, onClick, onPrefetch, onCopyLink,
}: {
  folder: Folder; index: number; copiedId: string | null
  onClick: () => void; onPrefetch: () => void; onCopyLink: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.03, 0.15), duration: 0.2 }}
      className="group relative rounded-2xl glass-card hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={onClick}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      tabIndex={0}
      role="button"
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${folder.color || '#468152'}15, transparent 70%)` }}
      />
      <div className="relative p-4">
        {folder.coverImage ? (
          <div className="relative h-16 w-full rounded-xl mb-3 overflow-hidden">
            <Image src={folder.coverImage} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw" />
          </div>
        ) : (
          <div className="h-16 w-full rounded-xl mb-3 flex items-center justify-center text-3xl" style={{ backgroundColor: `${folder.color || '#468152'}15` }}>
            {folder.icon || '📁'}
          </div>
        )}
        <h4 className="font-medium text-sm truncate">{folder.name}</h4>
        {folder.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{folder.description}</p>}

        {/* Share button */}
        <button
          onClick={e => { e.stopPropagation(); onCopyLink() }}
          title={copiedId === folder._id ? 'Link copiado!' : 'Copiar link desta pasta'}
          className={`mt-2 flex items-center gap-1 text-[10px] font-medium transition-all ${copiedId === folder._id ? 'text-green-500' : 'text-muted-foreground hover:text-primary'}`}
        >
          {copiedId === folder._id ? <CheckCheck className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
          {copiedId === folder._id ? 'Copiado!' : 'Compartilhar'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Material Card Component ────────────────────────────────
function MaterialCard({
  material, index, isPurchased, groupAccess, isHighlighted, copiedId,
  onAcquire, onDownload, onCopyLink, onPreview, loading,
}: {
  material: Material; index: number; isPurchased: boolean; groupAccess: boolean
  isHighlighted: boolean; copiedId: string | null
  onAcquire: () => void; onDownload: () => void; onCopyLink: () => void; onPreview: () => void; loading: boolean
}) {
  const isFree = material.pricing === 'free'
  // isPurchased includes manual admin grants → always grants full access
  const canAccess = typeof material._hasAccess === 'boolean'
    ? material._hasAccess
    : isPurchased || (groupAccess && isFree)
  const isEmbed = material.type === 'video_embed'
  const pdfDownloadBlocked = !!material._hasPdf && material.pdfDownloadEnabled === false
  const [descExpanded, setDescExpanded] = useState(false)
  const descLong = material.description && material.description.length > 80
  const showLocked = !groupAccess && !isPurchased && (material.allowedGroups?.length ?? 0) > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.15), duration: 0.25 }}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]' : ''}`}
    >
      {/* Group-access locked overlay — hidden when user has a purchase/grant */}
      {showLocked && (
        <LockedGroupOverlay allowedGroups={material.allowedGroups} onPreview={onPreview} />
      )}

      <div className={`glass-card h-full flex flex-col transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/10 ${showLocked ? 'pointer-events-none select-none' : ''}`}>
        <Link href={`/materiais/${material._id}`} className="block relative aspect-[16/10] overflow-hidden cursor-pointer">
          {material.coverImage ? (
            <Image src={material.coverImage} alt={material.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 flex items-center justify-center">
              <div className="h-16 w-16 rounded-2xl glass flex items-center justify-center">
                {typeIcons[material.type] || <File className="h-8 w-8" />}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-white/0 hover:bg-white/8 transition-colors duration-200" />

          {/* Play button overlay for video_embed */}
          {isEmbed && canAccess && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onDownload() }} className="absolute inset-0 flex items-center justify-center group/play">
              <div className="h-14 w-14 rounded-full bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center transition-all group-hover/play:scale-110 group-hover/play:bg-white/35">
                <Play className="h-6 w-6 text-white fill-white ml-0.5" />
              </div>
            </button>
          )}

          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-xl bg-white/20 text-white border border-white/20 flex items-center gap-1">
              {isEmbed && <Play className="h-3 w-3 fill-white" />}
              {typeLabels[material.type] || 'Arquivo'}
            </span>
          </div>

          <div className="absolute top-3 right-3">
            {material.allowedGroups?.length > 0 ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-xl bg-violet-500/30 text-violet-100 border border-violet-400/30 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {material.allowedGroups.map(g => GROUP_META[g]?.label).filter(Boolean).join(' / ')}
              </span>
            ) : isFree ? (
              <span className="px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-xl bg-green-500/30 text-green-100 border border-green-400/30 flex items-center gap-1">
                <Gift className="h-3 w-3" /> Grátis
              </span>
            ) : (
              <span className="px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-xl bg-accent/30 text-amber-100 border border-amber-400/30">
                R$ {material.price?.toFixed(2)}
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-white/80"><Download className="h-3 w-3" /> {material.downloadCount}</span>
              <span className="flex items-center gap-1 text-xs text-white/80"><Eye className="h-3 w-3" /> {material.viewCount}</span>
              {(material.type === 'video' || material.type === 'video_embed') && material.videoDuration ? (
                <span className="flex items-center gap-1 text-xs text-white/80 font-medium">
                  <Play className="h-3 w-3 fill-white/60" /> {formatDuration(material.videoDuration)}
                </span>
              ) : null}
              {material.type === 'flashcard_deck' && material._cardCount != null ? (
                <span className="flex items-center gap-1 text-xs text-white/80 font-medium">
                  <Sparkles className="h-3 w-3" /> {material._cardCount} cards
                </span>
              ) : null}
            </div>
            <CopyLinkBtn id={material._id} copiedId={copiedId} onClick={e => { e.stopPropagation(); onCopyLink() }} />
          </div>
        </Link>

        <div className="p-4 flex-1 flex flex-col">
          <Link href={`/materiais/${material._id}`} className="font-heading font-bold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors hover:underline cursor-pointer">{material.title}</Link>
          {material.description && (
            <div className="mb-3">
              <p className={`text-xs text-muted-foreground ${descExpanded ? '' : 'line-clamp-2'}`}>{material.description}</p>
              {descLong && (
                <button onClick={() => setDescExpanded(e => !e)} className="mt-0.5 flex items-center gap-0.5 text-[10px] text-primary font-medium hover:underline">
                  {descExpanded ? <><ChevronUp className="h-3 w-3" /> Ver menos</> : <><ChevronDown className="h-3 w-3" /> Ver mais</>}
                </button>
              )}
            </div>
          )}

          {material.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {material.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
              ))}
            </div>
          )}

          <div className="mt-auto">
            {showLocked ? (
              <div className="text-center py-2">
                <button onClick={onPreview} className="text-xs text-primary font-medium flex items-center gap-1 mx-auto hover:underline">
                  <Info className="h-3 w-3" /> Ver detalhes e fazer upgrade
                </button>
              </div>
            ) : canAccess ? (
              <Button onClick={onDownload} size="sm" className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl h-9 text-xs font-semibold shadow-lg shadow-primary/20">
                {isEmbed
                  ? <><Play className="h-3.5 w-3.5 mr-1.5 fill-white" /> Assistir</>
                  : material.type === 'flashcard_deck'
                    ? <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Acessar deck</>
                    : pdfDownloadBlocked && material.pdfViewerEnabled
                      ? <><Eye className="h-3.5 w-3.5 mr-1.5" /> Visualizar PDF</>
                      : pdfDownloadBlocked
                        ? <><Info className="h-3.5 w-3.5 mr-1.5" /> Ver detalhes</>
                      : <><Download className="h-3.5 w-3.5 mr-1.5" /> Download</>}
              </Button>
            ) : (
              <Button onClick={onAcquire} disabled={loading} size="sm" className="w-full bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 text-white rounded-xl h-9 text-xs font-semibold shadow-lg shadow-accent/20">
                {loading ? <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" /> : <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />}
                Comprar - R$ {material.price?.toFixed(2)}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Featured Card Component ────────────────────────────────
function FeaturedCard({
  material, index, isPurchased, groupAccess, isHighlighted, copiedId,
  onAcquire, onDownload, onCopyLink, onPreview, loading,
}: {
  material: Material; index: number; isPurchased: boolean; groupAccess: boolean
  isHighlighted: boolean; copiedId: string | null
  onAcquire: () => void; onDownload: () => void; onCopyLink: () => void; onPreview: () => void; loading: boolean
}) {
  const isFree = material.pricing === 'free'
  const canAccess = typeof material._hasAccess === 'boolean'
    ? material._hasAccess
    : isPurchased || (groupAccess && isFree)
  const isEmbed = material.type === 'video_embed'
  const pdfDownloadBlocked = !!material._hasPdf && material.pdfDownloadEnabled === false
  const [descExpanded, setDescExpanded] = useState(false)
  const descLong = material.description && material.description.length > 100
  const showLocked = !groupAccess && !isPurchased && (material.allowedGroups?.length ?? 0) > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.15), duration: 0.25 }}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]' : ''}`}
    >
      {showLocked && (
        <LockedGroupOverlay allowedGroups={material.allowedGroups} onPreview={onPreview} />
      )}

      <div className={`relative glass-card border-primary/20 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:border-primary/40 ${showLocked ? 'pointer-events-none select-none' : ''}`}>
        <div className="absolute -top-1 -right-1 z-10">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-lg">
            <Star className="h-3 w-3 inline mr-0.5 -mt-0.5" /> DESTAQUE
          </div>
        </div>

        <Link href={`/materiais/${material._id}`} className="block relative aspect-[16/10] overflow-hidden cursor-pointer">
          {material.coverImage ? (
            <Image src={material.coverImage} alt={material.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" priority={index === 0} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 flex items-center justify-center">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="h-20 w-20 rounded-3xl glass-lg flex items-center justify-center">
                {typeIcons[material.type] || <File className="h-10 w-10 text-primary" />}
              </motion.div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-white/0 hover:bg-white/8 transition-colors duration-200" />

          {isEmbed && canAccess && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onDownload() }} className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center transition-all hover:scale-110 hover:bg-white/35">
                <Play className="h-7 w-7 text-white fill-white ml-1" />
              </div>
            </button>
          )}

          <div className="absolute bottom-3 left-4 right-4">
            <Link href={`/materiais/${material._id}`} className="font-heading font-bold text-white text-lg leading-tight hover:underline cursor-pointer" onClick={e => e.stopPropagation()}>{material.title}</Link>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-white/70"><Download className="h-3 w-3" /> {material.downloadCount}</span>
              {(material.type === 'video' || material.type === 'video_embed') && material.videoDuration ? (
                <span className="flex items-center gap-1 text-xs text-white/80 font-medium">
                  <Play className="h-3 w-3 fill-white/60" /> {formatDuration(material.videoDuration)}
                </span>
              ) : null}
              {material.type === 'flashcard_deck' && material._cardCount != null ? (
                <span className="flex items-center gap-1 text-xs text-white/80 font-medium">
                  <Sparkles className="h-3 w-3" /> {material._cardCount} cards
                </span>
              ) : null}
              {material.allowedGroups?.length > 0
                ? <span className="text-xs font-bold text-violet-300 flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Restrito</span>
                : isFree
                  ? <span className="text-xs font-bold text-green-300 flex items-center gap-1"><Gift className="h-3 w-3" /> Grátis</span>
                  : <span className="text-xs font-bold text-amber-300">R$ {material.price?.toFixed(2)}</span>}
              <CopyLinkBtn id={material._id} copiedId={copiedId} onClick={e => { e.stopPropagation(); onCopyLink() }} />
            </div>
          </div>
        </Link>

        <div className="p-4">
          {material.description && (
            <div className="mb-3">
              <p className={`text-xs text-muted-foreground ${descExpanded ? '' : 'line-clamp-2'}`}>{material.description}</p>
              {descLong && (
                <button onClick={() => setDescExpanded(e => !e)} className="mt-0.5 flex items-center gap-0.5 text-[10px] text-primary font-medium hover:underline">
                  {descExpanded ? <><ChevronUp className="h-3 w-3" /> Ver menos</> : <><ChevronDown className="h-3 w-3" /> Ver mais</>}
                </button>
              )}
            </div>
          )}
          {showLocked ? (
            <div className="text-center py-2">
              <button onClick={onPreview} className="text-xs text-primary font-medium flex items-center gap-1 mx-auto hover:underline">
                <Info className="h-3 w-3" /> Ver detalhes e fazer upgrade
              </button>
            </div>
          ) : canAccess ? (
            <Button onClick={onDownload} size="sm" className="w-full bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl h-10 font-semibold shadow-lg shadow-primary/25">
              {isEmbed
                ? <><Play className="h-4 w-4 mr-2 fill-white" /> Assistir Vídeo</>
                : pdfDownloadBlocked && material.pdfViewerEnabled
                  ? <><Eye className="h-4 w-4 mr-2" /> Visualizar PDF</>
                  : pdfDownloadBlocked
                    ? <><Info className="h-4 w-4 mr-2" /> Ver detalhes</>
                  : <><Download className="h-4 w-4 mr-2" /> Baixar Material</>}
            </Button>
          ) : (
            <Button onClick={onAcquire} disabled={loading} size="sm" className="w-full bg-gradient-to-r from-accent to-secondary text-white rounded-xl h-10 font-semibold shadow-lg shadow-accent/25">
              {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
              {isFree ? 'Adquirir Grátis' : `Comprar - R$ ${material.price?.toFixed(2)}`}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Package Card Component ─────────────────────────────────
function PackageCard({
  pkg, index, isPurchased, groupAccess, isHighlighted, copiedId,
  onAcquire, onCopyLink, onPreview, loading,
}: {
  pkg: MaterialPackage; index: number; isPurchased: boolean; groupAccess: boolean
  isHighlighted: boolean; copiedId: string | null
  onAcquire: () => void; onCopyLink: () => void; onPreview: () => void; loading: boolean
}) {
  const isFree = pkg.pricing === 'free'
  const effectivePrice = Number(pkg._pricing?.effectivePrice ?? pkg.price ?? 0)
  const packagePrice = Number(pkg.price || 0)
  const staticOriginalPrice = Number(pkg.originalPrice || 0)
  const userDiscountApplied = Number(pkg._pricing?.discountApplied || 0) > 0
  const crossedPrice = userDiscountApplied
    ? packagePrice
    : staticOriginalPrice > packagePrice
      ? staticOriginalPrice
      : null
  const canAccess = typeof pkg._hasAccess === 'boolean'
    ? pkg._hasAccess
    : isPurchased || (groupAccess && isFree)
  const hasDiscount = !!crossedPrice && crossedPrice > effectivePrice
  const showFreeAcquire = isFree || effectivePrice <= 0
  const [descExpanded, setDescExpanded] = useState(false)
  const descLong = pkg.description && pkg.description.length > 120
  const showLocked = !groupAccess && !isPurchased && (pkg.allowedGroups?.length ?? 0) > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.15), duration: 0.25 }}
      className={`group relative transition-all duration-300 ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.01] rounded-2xl' : ''}`}
    >
      {showLocked && (
        <LockedGroupOverlay allowedGroups={pkg.allowedGroups} onPreview={onPreview} />
      )}
      <div className={`glass-card rounded-2xl overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/15 h-full flex flex-col ${showLocked ? 'pointer-events-none select-none' : ''}`}>
        <Link href={`/pacotes/${pkg._id}`} className="block relative aspect-[16/10] overflow-hidden cursor-pointer">
          {pkg.coverImage ? (
            <Image src={pkg.coverImage} alt={pkg.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-500/20 via-primary/20 to-accent/20 flex items-center justify-center relative">
              <div className="relative">
                {[...Array(Math.min(3, pkg.materials?.length || 1))].map((_, i) => (
                  <motion.div key={i} className="absolute glass rounded-xl"
                    style={{ width: 60, height: 80, top: -40 + i * 8, left: -30 + i * 12, rotate: -10 + i * 10, zIndex: i }}
                    animate={{ y: [0, -4, 0] }} transition={{ duration: 3, delay: i * 0.3, repeat: Infinity }}
                  />
                ))}
                <Package className="h-12 w-12 text-primary relative z-10" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-xl bg-violet-500/30 text-violet-100 border border-violet-400/30 flex items-center gap-1">
              <Package className="h-3 w-3" /> {pkg.materialIds?.length || 0} materiais
            </span>
          </div>

          <div className="absolute top-3 right-3 text-right">
            {pkg.allowedGroups?.length > 0 ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-xl bg-violet-500/30 text-violet-100 border border-violet-400/30 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {pkg.allowedGroups.map(g => GROUP_META[g]?.label).filter(Boolean).join(' / ')}
              </span>
            ) : isFree ? (
              <span className="px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-xl bg-green-500/30 text-green-100 border border-green-400/30 flex items-center gap-1">
                <Gift className="h-3 w-3" /> Grátis
              </span>
            ) : (
              <div className="flex flex-col items-end gap-0.5">
                {hasDiscount && <span className="text-[10px] text-white/60 line-through">{formatBRL(crossedPrice || 0)}</span>}
                <span className="px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-xl bg-accent/30 text-amber-100 border border-amber-400/30">
                  {formatBRL(effectivePrice)}
                </span>
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <h3 className="font-heading font-bold text-white text-xl leading-tight group-hover:underline">{pkg.title}</h3>
            <CopyLinkBtn id={pkg._id} copiedId={copiedId} onClick={e => { e.preventDefault(); e.stopPropagation(); onCopyLink() }} />
          </div>
        </Link>

        <div className="p-5 flex-1 flex flex-col">
          {pkg.description && (
            <div className="mb-4">
              <p className={`text-sm text-muted-foreground ${descExpanded ? '' : 'line-clamp-2'}`}>{pkg.description}</p>
              {descLong && (
                <button onClick={() => setDescExpanded(e => !e)} className="mt-0.5 flex items-center gap-0.5 text-[11px] text-primary font-medium hover:underline">
                  {descExpanded ? <><ChevronUp className="h-3 w-3" /> Ver menos</> : <><ChevronDown className="h-3 w-3" /> Ver mais</>}
                </button>
              )}
            </div>
          )}

          {pkg.materials && pkg.materials.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Inclui:</p>
              <div className="space-y-1.5">
                {pkg.materials.slice(0, 4).map((m: any) => (
                  <div key={m._id} className="flex items-center gap-2 text-xs p-1.5 rounded-lg bg-muted/50">
                    <div className="h-5 w-5 rounded flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
                      {typeIcons[m.type] || <File className="h-3 w-3" />}
                    </div>
                    <span className="truncate flex-1">{m.title}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {typeLabels[m.type] || 'Arquivo'}
                    </span>
                  </div>
                ))}
                {pkg.materials.length > 4 && <p className="text-xs text-muted-foreground pl-1">+{pkg.materials.length - 4} mais</p>}
              </div>
            </div>
          )}

          {pkg.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {pkg.tags.slice(0, 4).map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
              ))}
            </div>
          )}

          <div className="mt-auto">
            {showLocked ? (
              <div className="text-center py-2">
                <button onClick={onPreview} className="text-sm text-primary font-medium flex items-center gap-1 mx-auto hover:underline">
                  <Info className="h-3.5 w-3.5" /> Ver detalhes e fazer upgrade
                </button>
              </div>
            ) : canAccess ? (
              <Button size="sm" className="w-full bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl h-10 font-semibold">
                <Check className="h-4 w-4 mr-2" /> Adquirido
              </Button>
            ) : (
              <Button
                onClick={onAcquire}
                disabled={loading}
                size="sm"
                className={`w-full rounded-xl min-h-11 py-2 font-semibold shadow-lg text-white ${showFreeAcquire ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/20' : 'bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 shadow-accent/20'}`}
              >
                {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  : showFreeAcquire ? <Gift className="h-4 w-4 mr-2 shrink-0" /> : <ShoppingCart className="h-4 w-4 mr-2 shrink-0" />}
                {showFreeAcquire ? 'Adquirir Grátis' : (
                  <span className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 leading-tight">
                    <span>Comprar Pacote</span>
                    {hasDiscount && (
                      <span className="text-[11px] font-semibold text-white/70 line-through">
                        {formatBRL(crossedPrice || 0)}
                      </span>
                    )}
                    <span className="font-black">{formatBRL(effectivePrice)}</span>
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Preview Modal (locked content detail view) ──────────────
function PreviewModal({
  item, onClose, onAcquire, checkoutLoading,
}: {
  item: { type: 'material'; data: Material } | { type: 'package'; data: MaterialPackage }
  onClose: () => void
  onAcquire: () => void
  checkoutLoading: string | null
}) {
  const isMaterial = item.type === 'material'
  const data = item.data as any
  const isFree = data.pricing === 'free'
  const isEmbed = isMaterial && data.type === 'video_embed'
  const isVideo = isMaterial && (data.type === 'video' || data.type === 'video_embed')
  const loading = checkoutLoading === data._id

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-background border border-border rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
          <X className="h-4 w-4" />
        </button>

        {/* Cover / Fake Embed */}
        <div className="relative flex-shrink-0">
          {isEmbed ? (
            /* Fake embed placeholder — never shows real URL */
            <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                {data.coverImage && (
                  <img src={data.coverImage} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
                )}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                    <Lock className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-semibold bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                    Vídeo bloqueado · Faça upgrade para assistir
                  </span>
                </div>
              </div>
            </div>
          ) : data.coverImage ? (
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image src={data.coverImage} alt={data.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 512px" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          ) : (
            <div className="h-32 bg-gradient-to-br from-violet-500/20 via-primary/20 to-accent/20 flex items-center justify-center">
              <Lock className="h-12 w-12 text-violet-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Type & Duration badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {isMaterial && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground flex items-center gap-1">
                {typeIcons[data.type] || <File className="h-3 w-3" />}
                {typeLabels[data.type] || 'Arquivo'}
              </span>
            )}
            {!isMaterial && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-600 border border-violet-500/20 flex items-center gap-1">
                <Package className="h-3 w-3" /> Pacote · {(data as MaterialPackage).materialIds?.length || 0} materiais
              </span>
            )}
            {isVideo && data.videoDuration ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDuration(data.videoDuration)}
              </span>
            ) : null}
            {isFree ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-600 border border-green-500/20 flex items-center gap-1">
                <Gift className="h-3 w-3" /> Gratuito
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-accent/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                R$ {data.price?.toFixed(2)}
              </span>
            )}
          </div>

          <h2 className="font-heading font-bold text-xl mb-3">{data.title}</h2>

          {data.description && (
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{data.description}</p>
          )}

          {/* Package materials list */}
          {!isMaterial && (data as MaterialPackage).materials?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">O que está incluído</p>
              <div className="space-y-1.5">
                {(data as MaterialPackage).materials.map((m: any) => (
                  <div key={m._id} className="flex items-center gap-2.5 text-sm p-2 rounded-xl bg-muted/40">
                    <div className="h-6 w-6 rounded-lg flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
                      {typeIcons[m.type] || <File className="h-3.5 w-3.5" />}
                    </div>
                    <span className="font-medium truncate">{m.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Access restriction */}
          {data.allowedGroups?.length > 0 && (
            <div className="mb-5 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20">
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" /> Disponível nos planos:
              </p>
              <div className="flex flex-wrap gap-2">
                {data.allowedGroups.map((g: string) => {
                  const meta = GROUP_META[g]
                  if (!meta) return null
                  return (
                    <span key={g} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                      style={{ color: meta.color, background: meta.color + '15', borderColor: meta.color + '40' }}>
                      {meta.icon} {meta.label}
                    </span>
                  )
                })}
              </div>
              <p className="mt-2.5 text-xs text-muted-foreground">
                Faça upgrade do seu plano para desbloquear este conteúdo e ter acesso a todos os materiais exclusivos.
              </p>
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={onAcquire}
            disabled={loading}
            className={`w-full h-11 rounded-2xl font-semibold text-white shadow-lg ${
              isFree
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/25'
                : 'bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 shadow-accent/25'
            }`}
          >
            {loading
              ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              : isFree ? <Gift className="h-4 w-4 mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
            {isFree ? 'Adquirir Gratuitamente' : `Comprar por R$ ${data.price?.toFixed(2)}`}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Page Export with AppShell ───────────────────────────────
export default function MateriaisPage() {
  return (
    <AppShell allowGuest headerTitle="Materiais" headerSubtitle="Marketplace de materiais de estudo">
      <MateriaisContent />
    </AppShell>
  )
}
