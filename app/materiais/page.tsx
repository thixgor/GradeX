'use client'

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import {
  Check,
  Compass,
  FolderOpen,
  Library,
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
  scopeOfTab,
  type MateriaisScope,
  type MateriaisTab,
  type OwnedTypeFilter,
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
import { SectionSkeleton } from '@/components/section-skeleton'
import { useMaterialCart } from '@/context/MaterialCartContext'
import { Product3DCard, type Product3DCardData } from '@/components/shop/product-3d-card'

type PhysicalProductCard = Product3DCardData

/**
 * Resposta do catálogo para uma consulta (busca + filtro de preço).
 *
 * **Sem recorte de pasta de propósito.** `/api/materiais` sem `folderId`
 * devolve o acervo inteiro — que é exatamente o que a raiz de /materiais já
 * pedia. Guardando esse retorno uma vez, entrar numa pasta deixa de ser uma ida
 * ao servidor e vira um filtro em memória: era daí que vinha o "cliquei na
 * pasta e não aconteceu nada por um tempo".
 */
interface BrowseSnapshot {
  /** Acervo completo da consulta, sem filtro de pasta. */
  catalog: Material[]
  allFolders: Folder[]
  packages: MaterialPackage[]
  purchasedIds: string[]
  purchasedPackageIds: string[]
  userGroups: string[]
  isAuthenticated: boolean
}

/** Quantos cards a grade revela por vez. Ver `revealMore`. */
const PAGE_SIZE = 24

/**
 * Onde o aluno estava da última vez (só o nível 1, não a seção exata).
 *
 * Quem já comprou volta muito mais para reler o que tem do que para garimpar
 * catálogo — devolver a pessoa para "Meus materiais" evita o clique perdido
 * toda visita. Guardamos apenas o escopo: reabrir direto na "Loja" porque
 * alguém espiou os impressos uma vez seria previsível demais.
 */
const SCOPE_STORAGE_KEY = 'materiais:scope'

function readStoredScope(): MateriaisScope | null {
  try {
    const value = window.localStorage.getItem(SCOPE_STORAGE_KEY)
    return value === 'mine' || value === 'browse' ? value : null
  } catch {
    return null
  }
}

/** Formato do material para o filtro de "Meus materiais". */
function ownedTypeOf(material: Material): OwnedTypeFilter | null {
  if (material.type === 'flashcard_deck') return 'flashcard'
  if (material.type === 'video' || material.type === 'video_embed') return 'video'
  if (material.type === 'pdf' || material._hasPdf) return 'pdf'
  return null
}

/**
 * Chave do cache de rede. Só busca e preço entram: a pasta é um recorte local
 * do mesmo acervo, então incluí-la aqui só multiplicaria requisições idênticas.
 */
function getBrowseKey(search: string, filter: string) {
  return [search.trim().toLowerCase(), filter].join('::')
}

/**
 * Estado do histórico a repassar num `replaceState` feito DURANTE a montagem.
 *
 * O App Router só troca `history.pushState`/`replaceState` pelas versões dele
 * num `useEffect` do `<AppRouter>`, e efeito de filho roda antes de efeito de
 * pai: um `replaceState` no efeito de montagem desta página chama a função
 * nativa, que substitui o estado inteiro da entrada. Passando `null` ali, o
 * `__NA` e a árvore que o Next guarda naquela entrada iam junto — e a partir
 * daí o Voltar do navegador caía no `window.location.reload()` do próprio Next,
 * recarregando a página no meio da navegação.
 *
 * Depois da montagem isto não é necessário (nem desejável): a versão do Next já
 * está instalada, copia os campos internos sozinha e ainda atualiza a URL
 * canônica do router — por isso as chamadas de navegação seguem passando `null`.
 */
function mountTimeHistoryState() {
  const state = typeof window !== 'undefined' ? window.history.state : null
  return state && typeof state === 'object' ? state : null
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

  // Acervo inteiro da consulta atual. `materials`, `folders` e `folderPath`
  // são derivados dele + da pasta aberta — nunca estados próprios. Era a cópia
  // manual desses três que ficava exibindo o conteúdo da pasta anterior até a
  // resposta do servidor chegar.
  const [catalog, setCatalog] = useState<Material[]>([])
  const [allFolders, setAllFolders] = useState<Folder[]>([])   // lista plana completa (resolve o caminho)
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
  const [ownedType, setOwnedType] = useState<OwnedTypeFilter>('all')
  const [sort, setSort] = useState<SortKey>('relevance')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
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
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const highlightRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const panelTopRef = useRef<HTMLDivElement | null>(null)
  const requestSeqRef = useRef(0)
  // Voltar de "Meus materiais" para "Explorar" tem que devolver a pessoa à
  // seção e à pasta onde ela estava — não jogá-la na raiz do catálogo.
  const lastBrowseTabRef = useRef<MateriaisTab>('materials')
  const lastFolderIdRef = useRef<string | null>(null)
  const browseCacheRef = useRef<Map<string, BrowseSnapshot>>(new Map())
  const inflightBrowseRef = useRef<Map<string, Promise<BrowseSnapshot>>>(new Map())
  const appliedKeyRef = useRef<string | null>(null)
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

  const applySnapshot = useCallback((snapshot: BrowseSnapshot) => {
    setCatalog(snapshot.catalog)
    setAllFolders(snapshot.allFolders)
    setPackages(snapshot.packages)
    setPurchasedIds(snapshot.purchasedIds)
    setPurchasedPackageIds(snapshot.purchasedPackageIds)
    setUserGroups(snapshot.userGroups)
    setIsAuthenticated(snapshot.isAuthenticated)
  }, [])

  /**
   * Leva a grade de volta ao topo ao trocar de pasta/seção.
   *
   * Sem isto, quem clicava numa pasta lá embaixo continuava com a mesma rolagem
   * e via um pedaço do meio da nova lista — parecia que o clique não pegou.
   */
  const scrollToPanelTop = useCallback(() => {
    if (typeof window === 'undefined') return
    const node = panelTopRef.current
    if (!node) return
    const top = node.getBoundingClientRect().top + window.scrollY - 12
    if (window.scrollY <= top) return
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' })
  }, [])

  // ─── Recortes derivados da pasta aberta ──────────────────
  // Um único acervo em memória; a pasta é só a lente. Como são `useMemo` e não
  // estados, é impossível a grade ficar exibindo a pasta anterior.
  const folderPath = useMemo(
    () => (currentFolderId ? buildPath(currentFolderId, allFolders) : []),
    [allFolders, buildPath, currentFolderId]
  )
  const folders = useMemo(
    () => getFolderChildren(allFolders, currentFolderId),
    [allFolders, currentFolderId]
  )
  const materials = useMemo(
    () => (currentFolderId ? catalog.filter(m => m.folderId === currentFolderId) : catalog),
    [catalog, currentFolderId]
  )

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
    srch: string,
    filter: string,
    options?: { force?: boolean }
  ) => {
    const key = getBrowseKey(srch, filter)
    const cached = browseCacheRef.current.get(key)

    if (cached && !options?.force) {
      applySnapshot(cached)
      appliedKeyRef.current = key
      setBrowseError(false)
      setLoading(false)
      setRefreshing(false)
      return
    }

    // Com algo já aplicado na tela é só um refresh suave (chip "Atualizando");
    // sem nada aplicado, o esqueleto é a resposta honesta.
    const hasVisibleData = appliedKeyRef.current !== null
    setLoading(!hasVisibleData)
    setRefreshing(hasVisibleData)
    setBrowseError(false)

    const requestId = ++requestSeqRef.current

    try {
      let snapshotPromise = !options?.force ? inflightBrowseRef.current.get(key) : undefined

      if (!snapshotPromise) {
        snapshotPromise = (async () => {
          const params = new URLSearchParams()
          if (srch) params.set('search', srch)
          if (filter !== 'all') params.set('pricing', filter)

          const allFoldersPromise = allFoldersCacheRef.current && !options?.force
            ? Promise.resolve({ folders: allFoldersCacheRef.current })
            : fetch('/api/materiais/folders?all=true', { cache: 'no-store' }).then(res => res.ok ? res.json() : { folders: [] })
          const packagesPromise = packagesCacheRef.current && !options?.force
            ? Promise.resolve(packagesCacheRef.current)
            : fetch('/api/materiais/packages', { cache: 'no-store' }).then(res => res.ok ? res.json() : { packages: [], purchasedPackageIds: [], userGroups: [] })

          const [materialsData, allFoldersData, packagesData] = await Promise.all([
            // A consulta de materiais é a única obrigatória: se ela falhar, a
            // página precisa mostrar erro em vez de fingir catálogo vazio.
            fetch(`/api/materiais${params.toString() ? `?${params}` : ''}`, { cache: 'no-store' }).then(res => {
              if (!res.ok) throw new Error(`materiais: ${res.status}`)
              return res.json()
            }),
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
            catalog: materialsData.materials || [],
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

      if (requestId !== requestSeqRef.current) return

      browseCacheRef.current.set(key, snapshot)
      applySnapshot(snapshot)
      appliedKeyRef.current = key
    } catch (err) {
      console.error('Erro ao carregar materiais:', err)
      // Sem isso o usuário caía no estado "Nenhum material encontrado" e a
      // página mentia sobre o catálogo estar vazio.
      if (requestId === requestSeqRef.current) {
        setBrowseError(true)
      }
    } finally {
      if (requestId === requestSeqRef.current) {
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

    const initialTab: MateriaisTab =
      tabParam === 'packages' || tabParam === 'mine' || tabParam === 'loja' ? tabParam : 'materials'

    if (initialTab !== 'mine') lastBrowseTabRef.current = initialTab
    if (folderParam) {
      lastFolderIdRef.current = folderParam
      // Pasta só faz sentido dentro de "Materiais": as outras seções ignoram o
      // recorte de pasta (era por isso que "Meus materiais" aberto de dentro de
      // uma pasta mostrava só um pedaço da biblioteca do aluno).
      if (initialTab === 'materials') setCurrentFolderId(folderParam)
    }

    // Sem nada na URL, devolve o aluno para o nível onde ele estava.
    if (!tabParam && !folderParam && readStoredScope() === 'mine') {
      setActiveTab('mine')
      // `replaceState` (e não push) para o botão Voltar continuar saindo de
      // /materiais em vez de alternar entre as abas.
      window.history.replaceState(mountTimeHistoryState(), '', '/materiais?tab=mine')
    } else if (initialTab !== 'materials') {
      setActiveTab(initialTab)
    }
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

  // Voltar/Avançar do navegador. Como pasta e aba são só recortes do mesmo
  // acervo já carregado, restaurar o estado é síncrono — nada de refetch.
  useEffect(() => {
    const syncFromHistory = () => {
      const params = new URLSearchParams(window.location.search)
      const folderId = params.get('folder')
      const tabParam = params.get('tab')
      const nextTab: MateriaisTab = tabParam === 'packages' || tabParam === 'mine' || tabParam === 'loja' ? tabParam : 'materials'
      const nextFolderId = nextTab === 'materials' ? folderId : null
      if (nextTab !== 'mine') lastBrowseTabRef.current = nextTab
      setActiveTab(nextTab)
      setCurrentFolderId(nextFolderId)
    }

    window.addEventListener('popstate', syncFromHistory)
    return () => window.removeEventListener('popstate', syncFromHistory)
  }, [])

  useEffect(() => {
    if (!ready) return
    fetchData(debouncedSearch, activeFilter)
  }, [ready, fetchData, debouncedSearch, activeFilter])

  // Link para uma pasta que não existe mais (ou que foi ocultada): em vez de
  // deixar o aluno numa tela vazia sem migalhas nem saída, devolve para a
  // biblioteca principal e limpa a URL — sem gastar uma entrada no histórico.
  useEffect(() => {
    if (!currentFolderId || loading || allFolders.length === 0) return
    if (allFolders.some(folder => folder._id === currentFolderId)) return
    setCurrentFolderId(null)
    lastFolderIdRef.current = null
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/materiais')
    }
  }, [allFolders, currentFolderId, loading])

  // Qualquer mudança de contexto reinicia a revelação incremental.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeTab, currentFolderId, debouncedSearch, activeFilter, ownedType, sort])

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
    // `null` é o uso previsto pelo App Router: a versão dele copia os campos
    // internos da entrada atual e sincroniza a URL canônica do router. Ver
    // `mountTimeHistoryState` para o caso (único) em que isso não vale.
    window.history.pushState(null, '', nextUrl)
  }, [activeTab])

  // ─── Navegação (sincroniza a URL) ────────────────────────
  //
  // Trocar de pasta é uma atualização de estado e nada mais: o acervo já está
  // em memória e `materials`/`folders`/`folderPath` derivam dele. Sem rede, sem
  // `startTransition` — a tela muda no mesmo frame do clique.
  const navigateToFolder = useCallback((folder: Folder) => {
    setCurrentFolderId(folder._id)
    updateBrowserUrl(folder._id, 'materials')
    scrollToPanelTop()
  }, [scrollToPanelTop, updateBrowserUrl])

  const navigateToPathIndex = useCallback((index: number) => {
    const targetFolderId = index < 0 ? null : folderPath[index]?._id || null
    setCurrentFolderId(targetFolderId)
    updateBrowserUrl(targetFolderId, 'materials')
    scrollToPanelTop()
  }, [folderPath, scrollToPanelTop, updateBrowserUrl])

  // Enquanto o aluno navega o catálogo, guardamos a pasta para devolvê-la
  // quando ele voltar de "Meus materiais" / "Pacotes" / "Loja".
  useEffect(() => {
    if (activeTab === 'materials') lastFolderIdRef.current = currentFolderId
  }, [activeTab, currentFolderId])

  useEffect(() => {
    try { window.localStorage.setItem(SCOPE_STORAGE_KEY, scopeOfTab(activeTab)) } catch {}
  }, [activeTab])

  const handleTabChange = useCallback((tab: MateriaisTab) => {
    if (tab !== 'mine') lastBrowseTabRef.current = tab
    // Fora de "Materiais" a consulta precisa ser da biblioteca inteira: manter
    // a pasta ativa fazia "Meus materiais" listar só os adquiridos daquela
    // pasta — a queixa de "sumiram meus materiais" vinha daqui.
    const nextFolderId = tab === 'materials' ? lastFolderIdRef.current : null
    setActiveTab(tab)
    setCurrentFolderId(nextFolderId)
    updateBrowserUrl(nextFolderId, tab)
    scrollToPanelTop()
  }, [scrollToPanelTop, updateBrowserUrl])

  const handleScopeChange = useCallback((scope: MateriaisScope) => {
    handleTabChange(scope === 'mine' ? 'mine' : lastBrowseTabRef.current)
  }, [handleTabChange])

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
          fetchData(debouncedSearch, activeFilter, { force: true })
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
  }, [activeFilter, addItem, debouncedSearch, fetchData, isAuthenticated, materials, notify, packages, router])

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
      await fetchData(debouncedSearch, activeFilter, { force: true })
    } catch {
      notify('Não foi possível resgatar este item. Tente novamente.', 'error')
    } finally {
      setCheckoutLoading(null)
    }
  }, [activeFilter, debouncedSearch, fetchData, isAuthenticated, notify, router])

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
  const ownedMaterials = useMemo(() => materials.filter(m => m._hasAccess), [materials])
  const myMaterials = useMemo(
    () => sortItems(
      ownedType === 'all' ? ownedMaterials : ownedMaterials.filter(m => ownedTypeOf(m) === ownedType),
      sort
    ),
    [ownedMaterials, ownedType, sort]
  )
  const ownedTypeCounts = useMemo(() => {
    const counts: Partial<Record<OwnedTypeFilter, number>> = { all: ownedMaterials.length }
    for (const material of ownedMaterials) {
      const kind = ownedTypeOf(material)
      if (kind) counts[kind] = (counts[kind] || 0) + 1
    }
    return counts
  }, [ownedMaterials])
  // Pacotes adquiridos aparecem junto da biblioteca: o aluno lembra que comprou
  // "o pacote de SOI III", não os doze materiais soltos que vieram nele.
  const ownedPackages = useMemo(
    () => packages.filter(p => p._isPurchased ?? purchasedPackageIds.includes(p._id)),
    [packages, purchasedPackageIds]
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

  // Contagem estável de "Meus materiais": lida do acervo inteiro (que não tem
  // recorte de pasta) e só quando não há busca/filtro estreitando a consulta.
  useEffect(() => {
    if (!debouncedSearch && activeFilter === 'all') {
      setOwnedCount(catalog.filter(m => m._hasAccess).length)
    }
  }, [activeFilter, catalog, debouncedSearch])

  const currentFolder = currentFolderId
    ? (allFolders.find(folder => folder._id === currentFolderId) || folderPath[folderPath.length - 1] || null)
    : null
  const isSoftLoading = refreshing
  const hasQuery = !!debouncedSearch.trim()
    || activeFilter !== 'all'
    || (activeTab === 'mine' && ownedType !== 'all')

  const clearFilters = useCallback(() => {
    setSearch('')
    setActiveFilter('all')
    setOwnedType('all')
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
        onClick={() => fetchData(debouncedSearch, activeFilter, { force: true })}
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
          onScopeChange={handleScopeChange}
          priceFilter={activeFilter}
          onPriceFilterChange={setActiveFilter}
          ownedType={ownedType}
          onOwnedTypeChange={setOwnedType}
          ownedTypeCounts={ownedTypeCounts}
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
          {activeTab === 'mine' && !loading && !browseError && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
              <Library className="h-3.5 w-3.5 text-primary" />
              Tudo que você já tem — {ownedMaterials.length} {ownedMaterials.length === 1 ? 'material' : 'materiais'}
              {ownedPackages.length > 0 && ` · ${ownedPackages.length} ${ownedPackages.length === 1 ? 'pacote' : 'pacotes'}`}
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

        <div ref={panelTopRef} id={MATERIAIS_PANEL_ID} role="tabpanel" aria-labelledby={`materiais-tab-${activeTab}`}>
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
            ) : !isAuthenticated ? (
              <EmptyCallout
                icon={<Library className="h-6 w-6" />}
                title="Entre para ver seus materiais"
                hint="Seus materiais adquiridos ficam salvos na sua conta — faça login para acessá-los de qualquer aparelho."
                cta={
                  <>
                    <Button onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent('/materiais?tab=mine')}`)} size="sm">
                      Entrar na minha conta
                    </Button>
                    <Button onClick={() => handleScopeChange('browse')} variant="outline" size="sm">
                      Explorar catálogo
                    </Button>
                  </>
                }
              />
            ) : myMaterials.length === 0 && ownedPackages.length === 0 ? (
              <EmptyCallout
                icon={<Check className="h-6 w-6" />}
                title={hasQuery ? 'Nada aqui com esses critérios' : 'Sua biblioteca está vazia'}
                hint={hasQuery
                  ? 'Nenhum dos seus materiais corresponde à busca ou ao filtro atual.'
                  : 'Assim que você adquirir um material, ele aparece aqui — pronto para ler ou baixar quando quiser.'}
                cta={hasQuery ? noResultsCta : (
                  <Button onClick={() => handleScopeChange('browse')} size="sm">
                    <Compass className="mr-2 h-4 w-4" /> Ver o que posso adquirir
                  </Button>
                )}
              />
            ) : (
              <>
                {/* Pacotes primeiro: são a compra que o aluno lembra ter feito. */}
                {ownedPackages.length > 0 && ownedType === 'all' && (
                  <section className="mb-8">
                    <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold tracking-[-0.02em]">
                      <Package className="h-4 w-4 text-primary" /> Seus pacotes
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {ownedPackages.map((pkg, idx) => renderPackage(pkg, idx))}
                    </div>
                  </section>
                )}

                {myMaterials.length > 0 ? (
                  <section>
                    {ownedPackages.length > 0 && ownedType === 'all' && (
                      <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold tracking-[-0.02em]">
                        <Library className="h-4 w-4 text-primary" /> Seus materiais
                      </h2>
                    )}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                      {myMaterials.slice(0, visibleCount).map((material, idx) => renderMaterial(material, idx))}
                    </div>
                  </section>
                ) : (
                  <EmptyCallout
                    icon={<Search className="h-6 w-6" />}
                    title="Nenhum material com esse recorte"
                    hint="Você tem pacotes adquiridos, mas nenhum material solto corresponde à busca ou ao formato selecionado."
                    cta={noResultsCta}
                  />
                )}

                {canRevealMore && (
                  <div ref={sentinelRef} className="mt-6 flex justify-center">
                    <Button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} variant="outline">
                      Carregar mais ({myMaterials.length - visibleCount} restantes)
                    </Button>
                  </div>
                )}

                {/* Saída para o catálogo no fim da lista: quem chegou até aqui
                    já viu tudo que tem e é onde a próxima compra faz sentido. */}
                {!canRevealMore && (
                  <div className="mt-8 flex flex-col items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-heading text-sm font-bold tracking-[-0.01em]">Procurando outro material?</h3>
                      <p className="text-xs text-muted-foreground">
                        Veja o que ainda dá para adquirir — materiais avulsos, pacotes com desconto e impressos.
                      </p>
                    </div>
                    <Button onClick={() => handleScopeChange('browse')} size="sm" className="shrink-0">
                      <Compass className="mr-2 h-4 w-4" /> Explorar catálogo
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
      {/* `MateriaisContent` chama `useSearchParams()`. Sem esta fronteira o
          Next desiste de renderizar a rota no servidor e joga a página inteira
          para o cliente — o casco chegava vazio e a primeira pintura só vinha
          depois do JS. Com o Suspense, o esqueleto é servido de imediato. */}
      <Suspense fallback={<SectionSkeleton variant="catalog" />}>
        <MateriaisContent />
      </Suspense>
    </AppShell>
  )
}
