'use client'

import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import {
  Check,
  FolderOpen,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Share2,
  CheckCheck,
  WifiOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToastAlert } from '@/components/ui/toast-alert'
import { AppShell } from '@/components/app-shell'
import { Breadcrumbs, PageHeader, type Crumb } from '@/components/page-scaffold'
import { PackageUpsellModal } from '@/components/materiais/package-upsell-modal'
import {
  DownloadStepId,
  INITIAL_DOWNLOAD_STATE,
  PdfDownloadProgress,
  PdfDownloadState,
} from '@/components/materiais/pdf-download-progress'
import { PdfDownloadTermsModal } from '@/components/materiais/pdf-download-terms-modal'
import { ContinueReading } from '@/components/materiais/continue-reading'
import { FolderCard } from '@/components/materiais/folder-card'
import { MaterialCard } from '@/components/materiais/material-card'
import { PackageCard } from '@/components/materiais/package-card'
import { PreviewModal } from '@/components/materiais/preview-modal'
import {
  MATERIAIS_PANEL_ID,
  MateriaisToolbar,
  type MateriaisTab,
  type PriceFilter,
  type SortKey,
} from '@/components/materiais/materiais-toolbar'
import {
  EmptyCallout,
  MaterialGridSkeleton,
  effectivePriceWithEvent,
  useCopyLink,
  type Folder,
  type Material,
  type MaterialPackage,
} from '@/components/materiais/shared'
import {
  downloadPdfResponse,
  shouldUseNativePdfDownload,
  triggerNativePdfDownload,
} from '@/lib/material-download-client'
import {
  DEFAULT_PUBLIC_METRIC_SETTINGS,
  type PublicMetricSettings,
} from '@/lib/display-settings'
import { useMaterialCart } from '@/context/MaterialCartContext'
import { Product3DCard, type Product3DCardData } from '@/components/shop/product-3d-card'

type PhysicalProductCard = Product3DCardData

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

/** Quantos cards a grade revela por vez. Ver `revealMore`. */
const PAGE_SIZE = 24

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

// ─── Debounce hook ─────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

/** Ordenação local — o catálogo inteiro já vem carregado, não custa rede. */
function sortItems<T extends { createdAt: string; downloadCount: number; price: number; pricing: string; isFeatured?: boolean; _pricingEventState?: any }>(
  items: T[],
  sort: SortKey
): T[] {
  if (sort === 'relevance') return items
  const copy = [...items]
  switch (sort) {
    case 'recent':
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case 'downloads':
      return copy.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
    case 'price-asc':
      return copy.sort((a, b) => {
        const pa = a.pricing === 'free' ? 0 : effectivePriceWithEvent(a.price, a._pricingEventState)
        const pb = b.pricing === 'free' ? 0 : effectivePriceWithEvent(b.price, b._pricingEventState)
        return pa - pb
      })
    default:
      return copy
  }
}

function MateriaisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [materials, setMaterials] = useState<Material[]>([])
  const [allFolders, setAllFolders] = useState<Folder[]>([])   // lista plana completa (resolve o caminho)
  const [folders, setFolders] = useState<Folder[]>([])          // filhas da pasta atual
  const [packages, setPackages] = useState<MaterialPackage[]>([])
  const [purchasedIds, setPurchasedIds] = useState<string[]>([])
  const [purchasedPackageIds, setPurchasedPackageIds] = useState<string[]>([])
  const [userGroups, setUserGroups] = useState<string[]>([])   // cargos do usuário atual
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [metricSettings, setMetricSettings] = useState<PublicMetricSettings>(DEFAULT_PUBLIC_METRIC_SETTINGS)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [browseError, setBrowseError] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const [activeFilter, setActiveFilter] = useState<PriceFilter>('all')
  const [sort, setSort] = useState<SortKey>('relevance')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<Folder[]>([])
  const [activeTab, setActiveTab] = useState<MateriaisTab>('materials')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    open: false, message: '', type: 'success',
  })
  const [ownedCount, setOwnedCount] = useState(0)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [highlightedMaterialId, setHighlightedMaterialId] = useState<string | null>(null)
  const [highlightedPackageId, setHighlightedPackageId] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<{ type: 'material'; data: Material } | { type: 'package'; data: MaterialPackage } | null>(null)
  const [upsellState, setUpsellState] = useState<{ pkg: MaterialPackage; material: Material } | null>(null)
  const [pdfDownloading, setPdfDownloading] = useState<string | null>(null) // materialId sendo baixado
  const [pdfDownloadMaterial, setPdfDownloadMaterial] = useState<Material | null>(null)
  const [downloadTermsMaterial, setDownloadTermsMaterial] = useState<Material | null>(null)
  const [downloadState, setDownloadState] = useState<PdfDownloadState>(INITIAL_DOWNLOAD_STATE)
  const [isRoutePending, startRouteTransition] = useTransition()
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const highlightRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const requestSeqRef = useRef(0)
  const browseCacheRef = useRef<Map<string, BrowseSnapshot>>(new Map())
  const inflightBrowseRef = useRef<Map<string, Promise<BrowseSnapshot>>>(new Map())
  const allFoldersCacheRef = useRef<Folder[] | null>(null)
  const packagesCacheRef = useRef<Pick<BrowseSnapshot, 'packages' | 'purchasedPackageIds' | 'userGroups'> | null>(null)
  const { copiedId, copy } = useCopyLink()
  const { addItem } = useMaterialCart()

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ open: true, message, type })
  }, [])

  // Produtos físicos (loja) — carregados sob demanda quando a aba abre.
  const [physicalProducts, setPhysicalProducts] = useState<PhysicalProductCard[]>([])
  const [physicalLoaded, setPhysicalLoaded] = useState(false)

  useEffect(() => {
    if (activeTab !== 'loja' || physicalLoaded) return
    fetch('/api/loja/produtos')
      .then((r) => r.json())
      .then((d) => setPhysicalProducts(Array.isArray(d.products) ? d.products : []))
      .catch(() => {})
      .finally(() => setPhysicalLoaded(true))
  }, [activeTab, physicalLoaded])

  useEffect(() => () => { stepTimersRef.current.forEach(clearTimeout) }, [])

  // Acesso por cargo: true se o usuário pertence a algum cargo permitido (ou não há restrição)
  const hasGroupAccess = useCallback((item: { allowedGroups?: string[]; _hasGroupAccess?: boolean }): boolean => {
    if (typeof item._hasGroupAccess === 'boolean') return item._hasGroupAccess
    if (!item.allowedGroups || item.allowedGroups.length === 0) return true
    return userGroups.some(g => item.allowedGroups!.includes(g))
  }, [userGroups])

  // ─── Caminho de ancestrais da pasta ──────────────────────
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

  useEffect(() => {
    let cancelled = false
    fetch('/api/display-settings', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (!cancelled && json?.settings) setMetricSettings(json.settings)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // ─── Busca de dados ──────────────────────────────────────
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
        setBrowseError(false)
        setLoading(false)
        setRefreshing(false)
      }
      return
    }

    if (!options?.prefetchOnly) {
      // `browseCacheRef` guarda o que já está na tela: sem nada renderizado
      // mostramos o esqueleto; com conteúdo visível é só um refresh suave.
      const hasVisibleData = browseCacheRef.current.size > 0
      setLoading(!hasVisibleData)
      setRefreshing(hasVisibleData)
      setBrowseError(false)
    }

    const requestId = options?.prefetchOnly ? requestSeqRef.current : ++requestSeqRef.current

    try {
      let snapshotPromise = !options?.force ? inflightBrowseRef.current.get(key) : undefined

      if (!snapshotPromise) {
        snapshotPromise = (async () => {
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
            // A consulta de materiais é a única obrigatória: se ela falhar, a
            // página precisa mostrar erro em vez de fingir catálogo vazio.
            fetch(`/api/materiais?${params}`, { cache: 'no-store' }).then(res => {
              if (!res.ok) throw new Error(`materiais: ${res.status}`)
              return res.json()
            }),
            fetch(`/api/materiais/folders${childFolderQuery}`, { cache: 'no-store' }).then(res => res.ok ? res.json() : { folders: [] }),
            allFoldersPromise,
            packagesPromise,
          ])

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

          return {
            materials: materialsData.materials || [],
            folders: foldersData.folders || [],
            allFolders: nextAllFolders,
            packages: nextPackages,
            purchasedIds: materialsData.purchasedIds || [],
            purchasedPackageIds: packagesData.purchasedPackageIds || [],
            userGroups: nextUserGroups,
            isAuthenticated: !!(materialsData.isAuthenticated || packagesData.isAuthenticated),
          }
        })()

        inflightBrowseRef.current.set(key, snapshotPromise)
        snapshotPromise.finally(() => {
          if (inflightBrowseRef.current.get(key) === snapshotPromise) {
            inflightBrowseRef.current.delete(key)
          }
        }).catch(() => {})
      }

      const snapshot = await snapshotPromise

      if (requestId !== requestSeqRef.current && !options?.prefetchOnly) return

      browseCacheRef.current.set(key, snapshot)

      if (!options?.prefetchOnly) {
        applySnapshot(snapshot, folderId)
      }
    } catch (err) {
      console.error('Erro ao carregar materiais:', err)
      // Sem isso o usuário caía no estado "Nenhum material encontrado" e a
      // página mentia sobre o catálogo estar vazio.
      if (!options?.prefetchOnly && requestId === requestSeqRef.current) {
        setBrowseError(true)
      }
    } finally {
      if (!options?.prefetchOnly && requestId === requestSeqRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [applySnapshot])

  // ─── Init a partir da URL ────────────────────────────────
  useEffect(() => {
    const folderParam = searchParams.get('folder')
    const materialParam = searchParams.get('material')
    const packageParam = searchParams.get('package')
    const tabParam = searchParams.get('tab')

    if (tabParam === 'packages') setActiveTab('packages')
    if (tabParam === 'mine') setActiveTab('mine')
    if (tabParam === 'loja') setActiveTab('loja')
    if (folderParam) setCurrentFolderId(folderParam)
    // Links antigos de compartilhamento vão para a página individual
    if (materialParam) { router.replace(`/materiais/${materialParam}`); return }
    if (packageParam) { router.replace(`/pacotes/${packageParam}`); return }

    if (searchParams.get('purchase') === 'success') {
      notify('Compra realizada com sucesso! O material já está disponível para download.')
    }

    // Sinaliza que os parâmetros da URL já foram aplicados — pode buscar dados
    setReady(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const syncFromHistory = () => {
      const params = new URLSearchParams(window.location.search)
      const folderId = params.get('folder')
      const tabParam = params.get('tab')
      const nextTab: MateriaisTab = tabParam === 'packages' || tabParam === 'mine' || tabParam === 'loja' ? tabParam : 'materials'
      const nextFolderId = nextTab === 'materials' ? folderId : null
      const cached = browseCacheRef.current.get(getBrowseKey(nextFolderId, debouncedSearch, activeFilter))

      startRouteTransition(() => {
        setActiveTab(nextTab)
        setCurrentFolderId(nextFolderId)
        if (cached) {
          applySnapshot(cached, nextFolderId)
          return
        }

        const flat = allFoldersCacheRef.current || allFolders
        if (!nextFolderId) {
          setFolderPath([])
          if (flat.length > 0) setFolders(getFolderChildren(flat, null))
          return
        }

        if (flat.length > 0) {
          setFolderPath(buildPath(nextFolderId, flat))
          setFolders(getFolderChildren(flat, nextFolderId))
        }
      })
    }

    window.addEventListener('popstate', syncFromHistory)
    return () => window.removeEventListener('popstate', syncFromHistory)
  }, [activeFilter, allFolders, applySnapshot, buildPath, debouncedSearch])

  useEffect(() => {
    if (!ready) return
    fetchData(currentFolderId, debouncedSearch, activeFilter)
  }, [ready, fetchData, currentFolderId, debouncedSearch, activeFilter])

  // Qualquer mudança de contexto reinicia a revelação incremental.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeTab, currentFolderId, debouncedSearch, activeFilter, sort])

  // Rola até o item destacado
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

  const updateBrowserUrl = useCallback((folderId: string | null, tab: MateriaisTab = activeTab) => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams()
    if (tab === 'packages') params.set('tab', 'packages')
    if (tab === 'mine') params.set('tab', 'mine')
    if (tab === 'loja') params.set('tab', 'loja')
    if (tab === 'materials' && folderId) params.set('folder', folderId)

    const nextUrl = params.toString() ? `/materiais?${params}` : '/materiais'
    window.history.pushState(null, '', nextUrl)
  }, [activeTab])

  // ─── Navegação (sincroniza a URL) ────────────────────────
  const navigateToFolder = useCallback((folder: Folder) => {
    const cached = browseCacheRef.current.get(getBrowseKey(folder._id, debouncedSearch, activeFilter))

    startRouteTransition(() => {
      setCurrentFolderId(folder._id)
      if (cached) {
        applySnapshot(cached, folder._id)
      } else {
        const flat = allFoldersCacheRef.current || allFolders
        if (flat.length > 0) {
          setFolderPath(buildPath(folder._id, flat))
          setFolders(getFolderChildren(flat, folder._id))
        } else {
          setFolderPath(prev => [...prev, folder])
        }
      }
    })
    updateBrowserUrl(folder._id, 'materials')
  }, [activeFilter, allFolders, applySnapshot, buildPath, debouncedSearch, updateBrowserUrl])

  const navigateToPathIndex = useCallback((index: number) => {
    const flat = allFoldersCacheRef.current || allFolders
    const targetFolderId = index < 0 ? null : folderPath.slice(0, index + 1).at(-1)?._id || null
    const cached = browseCacheRef.current.get(getBrowseKey(targetFolderId, debouncedSearch, activeFilter))

    startRouteTransition(() => {
      if (cached) {
        setCurrentFolderId(targetFolderId)
        applySnapshot(cached, targetFolderId)
        return
      }

      if (index < 0) {
        setCurrentFolderId(null)
        setFolderPath([])
        if (flat.length > 0) setFolders(getFolderChildren(flat, null))
      } else {
        const newPath = folderPath.slice(0, index + 1)
        const target = newPath[newPath.length - 1]
        setCurrentFolderId(target._id)
        setFolderPath(newPath)
        if (flat.length > 0) setFolders(getFolderChildren(flat, target._id))
      }
    })
    updateBrowserUrl(targetFolderId, 'materials')
  }, [activeFilter, allFolders, applySnapshot, debouncedSearch, folderPath, updateBrowserUrl])

  const prefetchFolder = useCallback((folderId: string) => {
    fetchData(folderId, debouncedSearch, activeFilter, { prefetchOnly: true }).catch(() => {})
  }, [activeFilter, debouncedSearch, fetchData])

  const handleTabChange = useCallback((tab: MateriaisTab) => {
    setActiveTab(tab)
    updateBrowserUrl(tab === 'materials' ? currentFolderId : null, tab)
  }, [currentFolderId, updateBrowserUrl])

  // ─── Copiar link ─────────────────────────────────────────
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const copyFolderLink = useCallback((folder: Folder) =>
    copy(folder._id, `${origin}/materiais?folder=${folder._id}`), [copy, origin])
  const copyMaterialLink = useCallback((material: Material) =>
    copy(material._id, `${origin}/materiais/${material._id}`), [copy, origin])
  const copyPackageLink = useCallback((pkg: MaterialPackage) =>
    copy(pkg._id, `${origin}/pacotes/${pkg._id}`), [copy, origin])

  // Prefere a flag `_isPurchased` vinda do servidor (definitiva); só cai no
  // `purchasedIds.includes()` legado se o servidor não anexou a flag.
  const isPurchased = useCallback((id: string, type: 'material' | 'package') => {
    if (type === 'material') {
      const m = materials.find(x => x._id === id)
      if (m && typeof m._isPurchased === 'boolean') return m._isPurchased
      return purchasedIds.includes(id)
    }
    const p = packages.find(x => x._id === id)
    if (p && typeof p._isPurchased === 'boolean') return p._isPurchased
    return purchasedPackageIds.includes(id)
  }, [materials, packages, purchasedIds, purchasedPackageIds])

  // ─── Aquisição / Download ────────────────────────────────
  const handleAcquire = useCallback(async (itemType: 'material' | 'package', itemId: string, mode: 'cart' | 'buy' = 'cart') => {
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
    if (!item) return
    const effectivePackagePrice = itemType === 'package'
      ? Number((item as MaterialPackage)?._pricing?.effectivePrice ?? item.price ?? 0)
      : Number(item.price ?? 0)
    if (item.pricing === 'free' || effectivePackagePrice <= 0) {
      if (!isAuthenticated) {
        const checkoutPath = `/materiais/checkout?type=${itemType}&id=${itemId}`
        router.push(`/auth/login?redirect=${encodeURIComponent(checkoutPath)}`)
        return
      }
      setCheckoutLoading(itemId)
      try {
        const res = await fetch('/api/materiais/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemType, itemId, paymentMethodId: 'free' }),
        })
        const data = await res.json()
        if (data.free) {
          notify('Material adquirido com sucesso! Faça o download agora.')
          fetchData(currentFolderId, debouncedSearch, activeFilter, { force: true })
        } else {
          notify(data.error || 'Erro ao processar a aquisição.', 'error')
        }
      } catch {
        notify('Erro ao processar aquisição. Verifique sua conexão.', 'error')
      } finally {
        setCheckoutLoading(null)
      }
      return
    }

    if (mode === 'buy') {
      const checkoutPath = `/materiais/checkout?type=${itemType}&id=${itemId}`
      if (!isAuthenticated) {
        // Compra sem login via Serial Key (nome/e-mail/telefone no checkout).
        const pt = itemType === 'package' ? 'package' : (item as Material).type === 'flashcard_deck' ? 'flashcard' : 'material'
        router.push(`/comprar?productType=${pt}&productId=${itemId}&itemType=${itemType}`)
        return
      }
      router.push(checkoutPath)
      return
    }

    const addResult = addItem({
      itemType,
      itemId,
      title: item.title,
      pricing: item.pricing,
      price: effectivePackagePrice,
      coverImage: (item as any).coverImage,
      materialType: itemType === 'material' ? (item as Material).type : undefined,
      materialCount: itemType === 'package' ? (item as MaterialPackage).materialIds?.length || 0 : undefined,
      effectivePrice: effectivePackagePrice,
      originalPrice: itemType === 'package'
        ? Number((item as MaterialPackage).price || effectivePackagePrice)
        : Number((item as Material).price || effectivePackagePrice),
      discountApplied: itemType === 'package'
        ? Number((item as MaterialPackage)._pricing?.discountApplied || 0)
        : 0,
    })
    notify(
      addResult === 'added' ? 'Item adicionado ao carrinho.' : 'Esse item já está no carrinho.',
      addResult === 'added' ? 'success' : 'info'
    )
  }, [activeFilter, addItem, currentFolderId, debouncedSearch, fetchData, isAuthenticated, materials, notify, packages, router])

  /**
   * Resgate sem custo pela assinatura Plus+.
   *
   * Diferente de comprar: não passa pelo carrinho nem pelo checkout — grava a
   * aquisição direto e recarrega a lista para o item aparecer como adquirido.
   * O servidor é quem valida a assinatura e a cota do Plus+ Guard.
   */
  const handleClaimWithPlus = useCallback(async (itemType: 'material' | 'package', itemId: string) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent('/materiais')}`)
      return
    }
    setCheckoutLoading(itemId)
    try {
      const res = await fetch('/api/materiais/resgatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, itemId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        notify(data.error || 'Não foi possível resgatar este item.', 'error')
        return
      }
      notify(
        data.alreadyOwned ? 'Você já tem este item na sua conta.' : data.message || 'Resgatado!',
        'success',
      )
      await fetchData(currentFolderId, debouncedSearch, activeFilter, { force: true })
    } catch {
      notify('Não foi possível resgatar este item. Tente novamente.', 'error')
    } finally {
      setCheckoutLoading(null)
    }
  }, [activeFilter, currentFolderId, debouncedSearch, fetchData, isAuthenticated, notify, router])

  const handleMaterialAcquire = useCallback((material: Material, mode: 'cart' | 'buy' = 'cart') => {
    // Upsell roda só em buy-now: add-to-cart é fluxo leve de browse, modal
    // cheio quebra o ritmo. No carrinho mostramos sugestões discretas.
    const pkg = packages.find(p =>
      p.materialIds?.includes(material._id) &&
      !isPurchased(p._id, 'package') &&
      !p._pricing?.ownedMaterialIds?.length &&
      !p.materialIds?.some(id => purchasedIds.includes(id))
    )
    if (mode === 'buy' && pkg) {
      setUpsellState({ pkg, material })
    } else {
      handleAcquire('material', material._id, mode)
    }
  }, [handleAcquire, isPurchased, packages, purchasedIds])

  const startPdfDownload = useCallback(async (materialOverride?: Material) => {
    const material = materialOverride || pdfDownloadMaterial
    if (!material) return

    stepTimersRef.current.forEach(clearTimeout)
    stepTimersRef.current = []
    setPdfDownloadMaterial(material)
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

  const handleOpenPdfViewer = useCallback((material: Material) => {
    router.push(`/materiais/${material._id}/viewer`)
  }, [router])

  const handleDownload = useCallback(async (material: Material) => {
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
        router.push(material.pdfViewerEnabled
          ? `/materiais/${material._id}/viewer`
          : `/materiais/${material._id}`)
        return
      }
      setPdfDownloadMaterial(material)
      setDownloadTermsMaterial(material)
      return
    }

    if (material.downloadUrl) {
      window.open(material.downloadUrl, '_blank')
    }
  }, [router])

  const handleAcceptDownloadTerms = useCallback(() => {
    const material = downloadTermsMaterial
    setDownloadTermsMaterial(null)
    if (material) startPdfDownload(material)
  }, [downloadTermsMaterial, startPdfDownload])

  // ─── Fatias derivadas ────────────────────────────────────
  const featuredMaterials = useMemo(() => materials.filter(m => m.isFeatured), [materials])
  const visibleMaterials = useMemo(
    () => sortItems(materials.filter(m => !m.isFeatured || currentFolderId), sort),
    [currentFolderId, materials, sort]
  )
  const myMaterials = useMemo(
    () => sortItems(materials.filter(m => m._hasAccess), sort),
    [materials, sort]
  )
  // O chip de preço agora aparece na aba Pacotes, então precisa realmente
  // filtrar — a query do servidor só aplica `pricing` a materiais.
  const filteredPackages = useMemo(() => {
    const byPrice = activeFilter === 'all'
      ? packages
      : packages.filter(p => {
          const price = Number(p._pricing?.effectivePrice ?? p.price ?? 0)
          const isFree = p.pricing === 'free' || price <= 0
          return activeFilter === 'free' ? isFree : !isFree
        })
    return sortItems(byPrice, sort)
  }, [activeFilter, packages, sort])
  const featuredPackages = useMemo(() => filteredPackages.filter(p => p.isFeatured), [filteredPackages])
  const regularPackages = useMemo(() => filteredPackages.filter(p => !p.isFeatured), [filteredPackages])
  const storeProducts = useMemo(
    () => physicalProducts.filter(p => (p.linkMode || 'standalone') !== 'addon'),
    [physicalProducts]
  )

  // Contagem estável de "Meus materiais": só é recalculada na raiz sem
  // busca/filtro, senão o número mudava a cada pasta visitada.
  useEffect(() => {
    if (!currentFolderId && !debouncedSearch && activeFilter === 'all') {
      setOwnedCount(materials.filter(m => m._hasAccess).length)
    }
  }, [activeFilter, currentFolderId, debouncedSearch, materials])

  const currentFolder = currentFolderId
    ? (allFolders.find(folder => folder._id === currentFolderId) || folderPath[folderPath.length - 1] || null)
    : null
  const isSoftLoading = refreshing || isRoutePending
  const hasQuery = !!debouncedSearch.trim() || activeFilter !== 'all'

  const clearFilters = useCallback(() => {
    setSearch('')
    setActiveFilter('all')
  }, [])

  // Lista realmente renderizada na aba atual (revelação incremental). A Loja
  // carrega tudo de uma vez — são poucos produtos físicos.
  const activeList = activeTab === 'materials'
    ? visibleMaterials
    : activeTab === 'mine'
      ? myMaterials
      : activeTab === 'packages'
        ? regularPackages
        : storeProducts
  const canRevealMore = activeTab !== 'loja' && activeList.length > visibleCount

  // Revela o próximo lote quando a sentinela entra na viewport. O payload de
  // rede não muda — o que cai é o custo de render e o número de nós do DOM.
  useEffect(() => {
    if (!canRevealMore) return
    const node = sentinelRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        setVisibleCount(c => c + PAGE_SIZE)
      }
    }, { rootMargin: '600px 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [canRevealMore, activeTab])

  const breadcrumbItems: Crumb[] = useMemo(() => {
    if (activeTab !== 'materials' || folderPath.length === 0) return []
    return [
      { label: 'Materiais', href: '/materiais', onClick: () => navigateToPathIndex(-1) },
      ...folderPath.map((f, i) => ({
        label: `${f.icon ? `${f.icon} ` : ''}${f.name}`,
        href: `/materiais?folder=${f._id}`,
        onClick: () => navigateToPathIndex(i),
      })),
    ]
  }, [activeTab, folderPath, navigateToPathIndex])

  // A capa candidata a LCP é a do primeiro bloco que renderiza: os destaques
  // quando existem, senão a grade. Priorizar as duas seções gastaria banda com
  // imagens que nem estão acima da dobra.
  const priorityScope: 'featured' | 'grid' = featuredMaterials.length > 0 && !currentFolderId && activeTab === 'materials'
    ? 'featured'
    : 'grid'

  const renderMaterial = useCallback((material: Material, idx: number, variant: 'grid' | 'featured' = 'grid') => (
    <div key={material._id} ref={highlightedMaterialId === material._id ? highlightRef : null}>
      <MaterialCard
        material={material}
        variant={variant}
        priority={idx < 2 && priorityScope === (variant === 'featured' ? 'featured' : 'grid')}
        isPurchased={isPurchased(material._id, 'material')}
        groupAccess={hasGroupAccess(material)}
        isHighlighted={highlightedMaterialId === material._id}
        copiedId={copiedId}
        onAddToCart={() => handleMaterialAcquire(material, 'cart')}
        onBuyNow={() => handleMaterialAcquire(material, 'buy')}
        onClaimWithPlus={() => handleClaimWithPlus('material', material._id)}
        onDownload={() => handleDownload(material)}
        onViewPdf={() => handleOpenPdfViewer(material)}
        onCopyLink={() => copyMaterialLink(material)}
        onPreview={() => setPreviewItem({ type: 'material', data: material })}
        loading={checkoutLoading === material._id || pdfDownloading === material._id}
        metricSettings={metricSettings.materials}
      />
    </div>
  ), [checkoutLoading, copiedId, copyMaterialLink, handleDownload, handleMaterialAcquire, handleOpenPdfViewer, hasGroupAccess, highlightedMaterialId, isPurchased, metricSettings.materials, pdfDownloading, priorityScope])

  const renderPackage = useCallback((pkg: MaterialPackage, idx: number) => (
    <div key={pkg._id} ref={highlightedPackageId === pkg._id ? highlightRef : null}>
      <PackageCard
        pkg={pkg}
        priority={idx < 2}
        isPurchased={isPurchased(pkg._id, 'package')}
        groupAccess={hasGroupAccess(pkg)}
        isHighlighted={highlightedPackageId === pkg._id}
        copiedId={copiedId}
        onAddToCart={() => handleAcquire('package', pkg._id, 'cart')}
        onBuyNow={() => handleAcquire('package', pkg._id, 'buy')}
        onClaimWithPlus={() => handleClaimWithPlus('package', pkg._id)}
        onCopyLink={() => copyPackageLink(pkg)}
        onPreview={() => setPreviewItem({ type: 'package', data: pkg })}
        loading={checkoutLoading === pkg._id}
      />
    </div>
  ), [checkoutLoading, copiedId, copyPackageLink, handleAcquire, hasGroupAccess, highlightedPackageId, isPurchased])

  const browseErrorState = (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center sm:p-12">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-destructive/25 bg-destructive/10 text-destructive">
        <WifiOff className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-base font-semibold tracking-[-0.01em] text-foreground">Não foi possível carregar os materiais</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
        Verifique sua conexão e tente novamente. Seus materiais adquiridos continuam disponíveis.
      </p>
      <Button
        onClick={() => fetchData(currentFolderId, debouncedSearch, activeFilter, { force: true })}
        variant="outline"
        className="mt-4"
      >
        <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
      </Button>
    </div>
  )

  const noResultsCta = (
    <Button onClick={clearFilters} variant="outline" size="sm">Limpar busca e filtros</Button>
  )

  return (
    <div className="surface-page pb-20">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <PageHeader
          eyebrow="Marketplace"
          title="Materiais"
          description="Resumos, apostilas, pacotes e produtos impressos organizados por disciplina."
        />

        {/* Retomada de leitura — some sozinha quando não há leitura no leitor. */}
        <ContinueReading className="mb-5" />

        <MateriaisToolbar
          search={search}
          onSearchChange={setSearch}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          priceFilter={activeFilter}
          onPriceFilterChange={setActiveFilter}
          sort={sort}
          onSortChange={setSort}
          counts={{
            // `visibleMaterials` só esconde os destaques na raiz — somar as
            // duas listas contaria o mesmo material duas vezes dentro de pasta.
            materials: materials.length,
            packages: filteredPackages.length,
            loja: storeProducts.length,
            mine: ownedCount,
          }}
        />

        {/* Contexto da consulta. `aria-live` para o leitor de tela confirmar que
            a busca rodou — antes só existia o chip "Atualizando". */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
          {activeTab === 'materials' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
              {currentFolder ? currentFolder.name : 'Biblioteca principal'}
            </span>
          )}
          {!loading && !browseError && hasQuery && activeTab !== 'loja' && (
            <span className="font-medium text-foreground">
              {activeList.length} {activeList.length === 1 ? 'resultado' : 'resultados'}
              {debouncedSearch.trim() ? ` para "${debouncedSearch.trim()}"` : ''}
            </span>
          )}
          {isSoftLoading && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-medium text-primary">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              Atualizando
            </span>
          )}
        </div>

        <div id={MATERIAIS_PANEL_ID} role="tabpanel" aria-labelledby={`materiais-tab-${activeTab}`}>
        {/* ─── Aba Materiais ─── */}
        {activeTab === 'materials' && (
          <>
            {breadcrumbItems.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Breadcrumbs items={breadcrumbItems} className="mb-0" />
                {currentFolder && (
                  <button
                    type="button"
                    onClick={() => copyFolderLink(currentFolder)}
                    title="Copiar link desta pasta"
                    aria-label="Copiar link desta pasta"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {copiedId === currentFolder._id
                      ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                      : <Share2 className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            )}

            {folders.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <FolderOpen className="h-4 w-4" /> Pastas
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {folders.map(folder => (
                    <FolderCard
                      key={folder._id}
                      folder={folder}
                      copiedId={copiedId}
                      onNavigate={() => navigateToFolder(folder)}
                      onPrefetch={() => prefetchFolder(folder._id)}
                      onCopyLink={() => copyFolderLink(folder)}
                    />
                  ))}
                </div>
              </section>
            )}

            {!loading && !browseError && featuredMaterials.length > 0 && !currentFolderId && (
              <section className="mb-8" style={{ contentVisibility: 'auto', containIntrinsicSize: '600px' }}>
                <h2 className="mb-3 font-heading text-lg font-bold tracking-[-0.02em]">Destaques</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {featuredMaterials.map((material, idx) => renderMaterial(material, idx, 'featured'))}
                </div>
              </section>
            )}

            {loading ? (
              <MaterialGridSkeleton count={8} />
            ) : browseError ? (
              browseErrorState
            ) : visibleMaterials.length === 0 && folders.length === 0 && featuredMaterials.length === 0 ? (
              hasQuery ? (
                <EmptyCallout
                  icon={<Search className="h-6 w-6" />}
                  title="Nenhum material com esses critérios"
                  hint={debouncedSearch.trim()
                    ? `Não encontramos nada para "${debouncedSearch.trim()}"${currentFolder ? ` em ${currentFolder.name}` : ''}. Tente outros termos ou limpe os filtros.`
                    : 'Nenhum material corresponde ao filtro de preço aplicado nesta pasta.'}
                  cta={
                    <>
                      {noResultsCta}
                      {currentFolder && (
                        <Button onClick={() => navigateToPathIndex(-1)} variant="outline" size="sm">
                          Buscar na biblioteca inteira
                        </Button>
                      )}
                    </>
                  }
                />
              ) : (
                <EmptyCallout
                  icon={<Package className="h-6 w-6" />}
                  title="Nenhum material por aqui ainda"
                  hint={currentFolder
                    ? 'Esta pasta ainda está vazia. Volte para a biblioteca principal para ver o que já está disponível.'
                    : 'Novos materiais em breve!'}
                  cta={currentFolder ? (
                    <Button onClick={() => navigateToPathIndex(-1)} variant="outline" size="sm">
                      Voltar à biblioteca
                    </Button>
                  ) : undefined}
                />
              )
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleMaterials.slice(0, visibleCount).map((material, idx) => renderMaterial(material, idx))}
                </div>
                {canRevealMore && (
                  <div ref={sentinelRef} className="mt-6 flex justify-center">
                    <Button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} variant="outline">
                      Carregar mais ({visibleMaterials.length - visibleCount} restantes)
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ─── Aba Pacotes ─── */}
        {activeTab === 'packages' && (
          <>
            {loading ? (
              <MaterialGridSkeleton count={4} columns="packages" />
            ) : browseError ? (
              browseErrorState
            ) : filteredPackages.length === 0 ? (
              <EmptyCallout
                icon={<Package className="h-6 w-6" />}
                title={hasQuery ? 'Nenhum pacote com esses critérios' : 'Nenhum pacote disponível'}
                hint={hasQuery
                  ? 'Ajuste o filtro de preço ou limpe a busca para ver todos os pacotes.'
                  : 'Novos pacotes em breve!'}
                cta={hasQuery ? noResultsCta : undefined}
              />
            ) : (
              <>
                {featuredPackages.length > 0 && (
                  <section className="mb-8">
                    <h2 className="mb-3 font-heading text-lg font-bold tracking-[-0.02em]">Pacotes em destaque</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {featuredPackages.map((pkg, idx) => renderPackage(pkg, idx))}
                    </div>
                  </section>
                )}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {regularPackages.slice(0, visibleCount).map((pkg, idx) => renderPackage(pkg, idx))}
                </div>
                {canRevealMore && (
                  <div ref={sentinelRef} className="mt-6 flex justify-center">
                    <Button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} variant="outline">
                      Carregar mais ({regularPackages.length - visibleCount} restantes)
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ─── Aba Meus Materiais ─── */}
        {activeTab === 'mine' && (
          <>
            {loading ? (
              <MaterialGridSkeleton count={6} />
            ) : browseError ? (
              browseErrorState
            ) : myMaterials.length === 0 ? (
              <EmptyCallout
                icon={<Check className="h-6 w-6" />}
                title={hasQuery ? 'Nada aqui com esses critérios' : 'Nenhum material ainda'}
                hint={hasQuery
                  ? 'Nenhum dos seus materiais corresponde à busca ou ao filtro atual.'
                  : 'Você ainda não adquiriu nenhum material.'}
                cta={hasQuery ? noResultsCta : (
                  <Button onClick={() => handleTabChange('materials')} variant="outline" size="sm">
                    Ver todos os materiais
                  </Button>
                )}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {myMaterials.slice(0, visibleCount).map((material, idx) => renderMaterial(material, idx))}
                </div>
                {canRevealMore && (
                  <div ref={sentinelRef} className="mt-6 flex justify-center">
                    <Button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} variant="outline">
                      Carregar mais ({myMaterials.length - visibleCount} restantes)
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ─── Aba Loja (produtos físicos) ─── */}
        {activeTab === 'loja' && (
          <>
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h2 className="font-heading text-sm font-bold tracking-[-0.01em]">Materiais impressos &amp; produtos físicos</h2>
                <p className="text-xs text-muted-foreground">
                  Receba em casa ou retire na Afya Unigranrio Barra. Entregue por DomineAqui LTDA.
                </p>
              </div>
            </div>
            {!physicalLoaded ? (
              <MaterialGridSkeleton count={4} />
            ) : storeProducts.length === 0 ? (
              <EmptyCallout
                icon={<ShoppingBag className="h-6 w-6" />}
                title="Nenhum produto na loja ainda"
                hint="Em breve novos materiais impressos por aqui."
                cta={
                  <Button onClick={() => handleTabChange('materials')} variant="outline" size="sm">
                    Ver materiais digitais
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {storeProducts.map((p) => (
                  <Product3DCard key={p._id} product={p} href={`/loja/${p._id}`} />
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* ─── Modal de upsell de pacote ─── */}
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
              handleAcquire('package', upsellState.pkg._id, 'buy')
            }}
            onBuyIndividual={() => {
              setUpsellState(null)
              handleAcquire('material', upsellState.material._id, 'buy')
            }}
            onClose={() => setUpsellState(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Detalhe de conteúdo bloqueado ─── */}
      <AnimatePresence>
        {previewItem && (
          <PreviewModal
            item={previewItem}
            onClose={() => setPreviewItem(null)}
            onAddToCart={previewItem.type === 'material'
              ? () => { setPreviewItem(null); handleAcquire('material', previewItem.data._id, 'cart') }
              : () => { setPreviewItem(null); handleAcquire('package', previewItem.data._id, 'cart') }
            }
            onBuyNow={previewItem.type === 'material'
              ? () => { setPreviewItem(null); handleAcquire('material', previewItem.data._id, 'buy') }
              : () => { setPreviewItem(null); handleAcquire('package', previewItem.data._id, 'buy') }
            }
            checkoutLoading={checkoutLoading}
          />
        )}
      </AnimatePresence>

      <PdfDownloadTermsModal
        open={!!downloadTermsMaterial}
        materialTitle={downloadTermsMaterial?.title ?? ''}
        loading={pdfDownloading === downloadTermsMaterial?._id}
        onClose={() => setDownloadTermsMaterial(null)}
        onAccept={handleAcceptDownloadTerms}
      />

      <PdfDownloadProgress
        materialTitle={pdfDownloadMaterial?.title ?? ''}
        state={downloadState}
        onRetry={() => startPdfDownload()}
        onClose={() => setDownloadState(INITIAL_DOWNLOAD_STATE)}
      />

      <ToastAlert
        open={toast.open}
        onOpenChange={(open) => setToast(t => ({ ...t, open }))}
        message={toast.message}
        type={toast.type}
      />
    </div>
  )
}

// ─── Export da página com o AppShell ─────────────────────────
export default function MateriaisPage() {
  return (
    <AppShell allowGuest headerTitle="Materiais" headerSubtitle="Pastas, pacotes e loja">
      <MateriaisContent />
    </AppShell>
  )
}
