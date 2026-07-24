'use client'

import { useCallback, useEffect, useMemo, memo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Search,
  Folder,
  FolderPlus,
  Globe,
  ShoppingBag,
  Users,
  Sparkles,
  Crown,
  Lock,
  Heart,
  Eye,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit3,
  ShoppingCart,
  Wand2,
  Inbox,
  Loader2,
  Layers,
  Star,
  ArrowRight,
  X,
  Check,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { TiltCard } from '@/components/tilt-card'
import { GlassHeroSurface } from '@/components/glass-hero-surface'
import { cn } from '@/lib/utils'
import { useBootstrap } from '@/hooks/use-bootstrap'
import {
  DEFAULT_PUBLIC_METRIC_SETTINGS,
  type PublicMetricSettings,
} from '@/lib/display-settings'
import type { FlashcardManualDeck, FlashcardManualFolder } from '@/lib/types'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

type DeckWithId = FlashcardManualDeck & {
  _id: string
  _isPurchased?: boolean
  _hasAccess?: boolean
  _hasGroupAccess?: boolean
}
type FolderWithId = FlashcardManualFolder & { _id: string }
type Filter = 'all' | 'mine' | 'purchased' | 'community' | 'store' | 'shared'
type FlashcardMetricSettings = PublicMetricSettings['flashcards']

const FILTERS: Filter[] = ['all', 'mine', 'purchased', 'community', 'store', 'shared']

// Na visão "Tudo" cada seção mostra apenas uma fileira de decks. O objetivo é
// dar um panorama navegável — quem quiser mais clica em "Ver todos" e entra na
// seção cheia, em vez de encarar quatro grades empilhadas de uma vez.
const OVERVIEW_LIMIT = 3

function parseSectionFromUrl(url: URL): Filter {
  const hashValue = url.hash.replace(/^#/, '')
  const value = (url.searchParams.get('section') || url.searchParams.get('tab') || url.searchParams.get('view') || hashValue || '').toLowerCase()
  const aliases: Record<string, Filter> = {
    tudo: 'all',
    todos: 'all',
    minhas: 'mine',
    meus: 'mine',
    adquiridos: 'purchased',
    comprados: 'purchased',
    oficiais: 'purchased',
    'meus-oficiais': 'purchased',
    loja: 'store',
    oficial: 'store',
    comunidade: 'community',
    recebidos: 'shared',
    compartilhados: 'shared',
  }
  const normalized = aliases[value] || value
  return FILTERS.includes(normalized as Filter) ? normalized as Filter : 'all'
}

export default function FlashcardsHubPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [mine, setMine] = useState<DeckWithId[]>([])
  const [community, setCommunity] = useState<DeckWithId[]>([])
  const [store, setStore] = useState<DeckWithId[]>([])
  const [shared, setShared] = useState<any[]>([])
  const [folders, setFolders] = useState<FolderWithId[]>([])
  const [activeFolder, setActiveFolder] = useState<string | 'all' | 'root'>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  // Loading granular por seção — cada bloco (meus decks, comunidade, loja,
  // recebidos) renderiza seu próprio skeleton assim que os dados chegam, em
  // vez de travar a página inteira atrás de um spinner até a requisição mais
  // lenta terminar.
  const [loadingMine, setLoadingMine] = useState(true)
  const [loadingCommunity, setLoadingCommunity] = useState(true)
  const [loadingStore, setLoadingStore] = useState(true)
  const [loadingShared, setLoadingShared] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const [foldersOpen, setFoldersOpen] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })
  const [isAdmin, setIsAdmin] = useState(false)
  const [communitySort, setCommunitySort] = useState<'trending' | 'new' | 'featured'>('trending')
  const [adminFolders, setAdminFolders] = useState<FolderWithId[]>([])
  const [storeFolder, setStoreFolder] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [metricSettings, setMetricSettings] = useState<PublicMetricSettings>(DEFAULT_PUBLIC_METRIC_SETTINGS)
  const [isFolderPending, startFolderTransition] = useTransition()
  const initialLoadDoneRef = useRef(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const mineCacheRef = useRef<Map<string, DeckWithId[]>>(new Map())
  const communityCacheRef = useRef<Map<string, DeckWithId[]>>(new Map())
  const {
    user: bootstrapUser,
    loading: bootstrapLoading,
    error: bootstrapError,
    isAdmin: bootstrapIsAdmin,
  } = useBootstrap()

  const syncStateFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const nextFilter = parseSectionFromUrl(url)
    setFilter(nextFilter)
    setStoreFolder(nextFilter === 'store' ? url.searchParams.get('folder') : null)
  }, [])

  const updateFlashcardsUrl = useCallback((nextFilter: Filter, nextStoreFolder?: string | null) => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (nextFilter === 'all') url.searchParams.delete('section')
    else url.searchParams.set('section', nextFilter)
    url.searchParams.delete('tab')
    url.searchParams.delete('view')

    if (nextFilter === 'store' && nextStoreFolder) url.searchParams.set('folder', nextStoreFolder)
    else url.searchParams.delete('folder')
    url.hash = ''

    window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  // Ao trocar de seção, traz a barra de filtros de volta ao campo de visão.
  // Sem isso, quem estava no meio de uma grade longa mudava de aba e continuava
  // parado no meio da página, sem entender o que mudou.
  const scrollToSections = useCallback(() => {
    if (typeof window === 'undefined') return
    const el = toolbarRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 72
    if (window.scrollY > top + 8) window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
  }, [])

  const selectSection = useCallback((nextFilter: Filter) => {
    if (isGuest && nextFilter !== 'store') {
      router.push(`/auth/login?redirect=${encodeURIComponent('/flashcards')}`)
      return
    }
    setFilter(nextFilter)
    if (nextFilter !== 'store') setStoreFolder(null)
    updateFlashcardsUrl(nextFilter, nextFilter === 'store' ? storeFolder : null)
    scrollToSections()
  }, [isGuest, router, scrollToSections, storeFolder, updateFlashcardsUrl])

  const selectStoreFolder = useCallback((folderId: string | null) => {
    startFolderTransition(() => {
      setStoreFolder(folderId)
      setFilter('store')
    })
    updateFlashcardsUrl('store', folderId)
  }, [updateFlashcardsUrl])

  const loadMine = useCallback(async () => {
    try {
      const folderId = activeFolder === 'all' ? '' : activeFolder === 'root' ? 'null' : activeFolder
      const cacheKey = `${folderId || 'all'}::${debouncedSearch.trim().toLowerCase()}`
      const cached = mineCacheRef.current.get(cacheKey)
      if (cached) {
        setMine(cached)
        return
      }

      const url = new URL('/api/flashcards/manual', window.location.origin)
      if (folderId) url.searchParams.set('folderId', folderId)
      if (debouncedSearch) url.searchParams.set('q', debouncedSearch)
      const res = await fetch(url.toString())
      const json = await res.json()
      const decks = json.decks || []
      mineCacheRef.current.set(cacheKey, decks)
      setMine(decks)
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro ao carregar decks', type: 'error' })
    } finally {
      setLoadingMine(false)
    }
  }, [activeFolder, debouncedSearch])

  const loadFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/flashcards/manual/folders')
      const json = await res.json()
      setFolders(json.folders || [])
    } catch {}
  }, [])

  const loadCommunity = useCallback(async () => {
    try {
      const cacheKey = `${communitySort}::${debouncedSearch.trim().toLowerCase()}`
      const cached = communityCacheRef.current.get(cacheKey)
      if (cached) {
        setCommunity(cached)
        return
      }

      const url = new URL('/api/flashcards/manual/community', window.location.origin)
      if (debouncedSearch) url.searchParams.set('q', debouncedSearch)
      url.searchParams.set('sort', communitySort)
      const res = await fetch(url.toString())
      const json = await res.json()
      const decks = json.decks || []
      communityCacheRef.current.set(cacheKey, decks)
      setCommunity(decks)
    } catch {
    } finally {
      setLoadingCommunity(false)
    }
  }, [debouncedSearch, communitySort])

  const loadStore = useCallback(async () => {
    try {
      const [storeRes, foldersRes] = await Promise.all([
        fetch('/api/flashcards/manual/store'),
        fetch('/api/flashcards/manual/folders?scope=admin'),
      ])
      const [storeJson, foldersJson] = await Promise.all([storeRes.json(), foldersRes.json()])
      setStore(storeJson.decks || [])
      setAdminFolders(foldersJson.folders || [])
    } catch {
    } finally {
      setLoadingStore(false)
    }
  }, [])

  const loadShared = useCallback(async () => {
    try {
      const res = await fetch('/api/flashcards/manual/shares?direction=incoming')
      const json = await res.json()
      setShared(json.shares || [])
    } catch {
    } finally {
      setLoadingShared(false)
    }
  }, [])

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

  useEffect(() => {
    if (bootstrapLoading) return

    const status = (bootstrapError as any)?.status
    const isAuthError = status === 401 || status === 403 ||
      bootstrapError?.message.includes('401') ||
      bootstrapError?.message.includes('403')
    const nextIsGuest = !bootstrapUser || !!isAuthError

    setIsAdmin(!!bootstrapUser && bootstrapIsAdmin)
    setIsGuest(nextIsGuest)
    if (nextIsGuest) {
      setFilter('store')
      updateFlashcardsUrl('store', null)
    }
    setAuthChecked(true)
  }, [bootstrapError, bootstrapIsAdmin, bootstrapLoading, bootstrapUser, updateFlashcardsUrl])

  useEffect(() => {
    syncStateFromUrl()
    window.addEventListener('popstate', syncStateFromUrl)
    return () => window.removeEventListener('popstate', syncStateFromUrl)
  }, [syncStateFromUrl])

  useEffect(() => {
    if (!authChecked) return

    let cancelled = false
    if (isGuest) {
      // Guests never see "meus decks"/comunidade/recebidos — não trava esses
      // skeletons para sempre esperando um fetch que nunca vai acontecer.
      setLoadingMine(false)
      setLoadingCommunity(false)
      setLoadingShared(false)
    }
    const loaders = isGuest
      ? [loadStore()]
      : [loadMine(), loadFolders(), loadCommunity(), loadStore(), loadShared()]

    Promise.all(loaders).finally(() => {
      if (cancelled) return
      initialLoadDoneRef.current = true
    })

    return () => {
      cancelled = true
    }
  // Initial hydration only. Follow-up effects below update individual sections without blanking the page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, isGuest])

  useEffect(() => {
    if (!authChecked || isGuest || !initialLoadDoneRef.current) return
    setLoadingMine(true)
    loadMine()
  }, [activeFolder, authChecked, debouncedSearch, isGuest, loadMine])

  useEffect(() => {
    if (!authChecked || isGuest || !initialLoadDoneRef.current) return
    setLoadingCommunity(true)
    loadCommunity()
  }, [authChecked, communitySort, debouncedSearch, isGuest, loadCommunity])

  const deleteDeck = useCallback(async (id: string) => {
    if (!confirm('Apagar este deck e todos os cartões?')) return
    try {
      const res = await fetch(`/api/flashcards/manual/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao apagar')
      mineCacheRef.current.clear()
      setMine(m => m.filter(d => d._id !== id))
      setToast({ open: true, message: 'Deck apagado', type: 'success' })
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro', type: 'error' })
    }
  }, [])

  // Hero featured: prioriza pago+destaque > pago > destaque > primeiros
  const featuredStore = useMemo(() => {
    const a = store.filter(d => d.isFeatured && d.pricing === 'paid')
    const b = store.filter(d => d.pricing === 'paid' && !d.isFeatured)
    const c = store.filter(d => d.isFeatured && d.pricing !== 'paid')
    const d = store.filter(d => !d.isFeatured && d.pricing !== 'paid')
    const dedup: DeckWithId[] = []
    const seen = new Set<string>()
    ;[...a, ...b, ...c, ...d].forEach(deck => {
      if (!seen.has(deck._id)) { seen.add(deck._id); dedup.push(deck) }
    })
    return dedup.slice(0, 3)
  }, [store])

  // Decks da loja filtrados pela pasta selecionada na sidebar
  const filteredStore = useMemo(() => {
    if (!storeFolder) return store
    return store.filter(d => d.folderId === storeFolder)
  }, [store, storeFolder])

  const purchasedStore = useMemo(() => {
    return store.filter(d => d.ownerType === 'admin' && d._hasAccess)
  }, [store])

  // Árvore de pastas admin
  const adminFolderTree = useMemo(() => buildFolderTree(adminFolders), [adminFolders])
  const storeFolderCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const deck of store) {
      if (!deck.folderId) continue
      counts.set(deck.folderId, (counts.get(deck.folderId) || 0) + 1)
    }
    return counts
  }, [store])

  const counts = useMemo(() => ({
    all: mine.length + community.length + store.length + shared.length,
    mine: mine.length,
    purchased: purchasedStore.length,
    community: community.length,
    store: store.length,
    shared: shared.length,
  }), [community.length, mine.length, purchasedStore.length, shared.length, store.length])

  // Numa seção específica mostra sempre. No panorama ("Tudo"), só entra quem
  // tem conteúdo — seções vazias viravam blocos de texto sem utilidade.
  const showSection = (key: Filter, hasContent = true) =>
    filter === key || (filter === 'all' && hasContent)

  return (
    <AppShell allowGuest headerTitle="Flashcards" headerSubtitle="Decks, loja e comunidade">
      <div className="surface-page">
      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6 space-y-5">
        {/* Cabeçalho enxuto — a navegação real acontece na barra de seções logo
            abaixo, então aqui fica só a identidade da área e as duas ações. */}
        <header className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div
            className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-30"
            style={{
              background:
                'radial-gradient(ellipse at 0% 0%, rgba(70,129,82,0.16), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(226,164,62,0.12), transparent 50%)',
            }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5">
            <div className="min-w-0 max-w-2xl">
              <p className="editorial-mark mb-1.5">Estudo ativo · repetição espaçada</p>
              <h1 className="font-heading text-xl sm:text-2xl font-semibold tracking-tight text-foreground leading-tight">
                Flashcards com método
              </h1>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Escolha uma seção e comece a estudar.
              </p>
            </div>
            {!isGuest && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link href="/flashcards/ia">
                  <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition">
                    <Wand2 className="h-4 w-4 text-primary" /> Flashcards de IA
                  </button>
                </Link>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground shadow-md shadow-secondary/20 hover:bg-secondary/90 transition"
                >
                  <Plus className="h-4 w-4" /> Novo deck
                </button>
              </div>
            )}
          </div>
        </header>

        {isGuest && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            Você está na loja oficial de flashcards. Meus decks, comunidade, recebidos, criação e estudo exigem login.
          </div>
        )}

        {/* Vitrine da loja — só no panorama e sem busca ativa. Em qualquer
            seção específica (ou durante uma busca) ela seria só ruído entre o
            usuário e o que ele foi procurar. */}
        {filter === 'all' && !debouncedSearch && featuredStore.length > 0 && (
          <StoreHero
            decks={featuredStore}
            totalStore={store.length}
            onSeeAll={() => selectSection('store')}
            metricSettings={metricSettings.flashcards}
          />
        )}

        {/* Âncora fora do elemento sticky: medir a barra depois de grudada
            devolveria sempre a posição travada, nunca a original. */}
        <div ref={toolbarRef} aria-hidden className="h-0" style={{ marginTop: 0 }} />

        {/* Toolbar */}
        <Toolbar
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={selectSection}
          counts={counts}
          foldersOpen={foldersOpen}
          setFoldersOpen={setFoldersOpen}
          guestMode={isGuest}
        />

        {(filter === 'mine' || filter === 'all') && foldersOpen && (
          <FoldersPanel
            folders={folders}
            mineCount={mine.length}
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            onAdd={() => setFolderOpen(true)}
          />
        )}

        {/* Content — cada seção renderiza seu próprio skeleton assim que a
            página monta; não há mais um spinner de página inteira travando
            tudo atrás da requisição mais lenta. */}
        <div className="space-y-6">
            {!isGuest && showSection('mine') && (
              <Section
                title="Meus decks"
                subtitle={loadingMine ? 'Carregando...' : mine.length === 0 ? 'Você ainda não criou nenhum deck.' : `${mine.length} ${mine.length === 1 ? 'deck' : 'decks'}`}
                icon={<Inbox className="h-5 w-5" />}
                accent="from-primary to-primary/80"
                action={mine.length > OVERVIEW_LIMIT && filter === 'all' ? <SectionLink onClick={() => selectSection('mine')}>Ver todos</SectionLink> : undefined}
              >
                {loadingMine ? (
                  <DeckGridSkeleton />
                ) : mine.length === 0 ? (
                  <EmptyCallout
                    title="Comece criando seu primeiro deck"
                    hint="Você pode escrever cartões do zero, importar JSON/CSV ou colocar imagens nas duas faces."
                    cta={
                      <button
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
                      >
                        <Plus className="h-4 w-4" /> Criar deck
                      </button>
                    }
                  />
                ) : (
                  <DeckGrid decks={filter === 'mine' ? mine : mine.slice(0, OVERVIEW_LIMIT)} owned onDelete={deleteDeck} metricSettings={metricSettings.flashcards} />
                )}
              </Section>
            )}

            {!isGuest && (filter === 'purchased' || (filter === 'all' && (loadingStore || purchasedStore.length > 0))) && (
              <Section
                title="Decks adquiridos"
                subtitle={loadingStore ? 'Carregando...' : purchasedStore.length === 0 ? 'Seus decks oficiais comprados ou liberados aparecem aqui.' : `${purchasedStore.length} ${purchasedStore.length === 1 ? 'deck oficial disponível' : 'decks oficiais disponíveis'}`}
                icon={<ShoppingBag className="h-5 w-5" />}
                accent="from-emerald-500 to-teal-500"
                action={purchasedStore.length > OVERVIEW_LIMIT && filter === 'all' ? <SectionLink onClick={() => selectSection('purchased')}>Ver todos</SectionLink> : undefined}
              >
                {loadingStore ? (
                  <DeckGridSkeleton />
                ) : purchasedStore.length === 0 ? (
                  <EmptyCallout
                    title="Nenhum deck oficial adquirido"
                    hint="Quando você comprar ou liberar um deck da Loja oficial, ele aparece nesta aba."
                    cta={
                      <button
                        onClick={() => selectSection('store')}
                        className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:shadow-orange-500/30 transition"
                      >
                        <Crown className="h-4 w-4" /> Ir para a loja
                      </button>
                    }
                  />
                ) : (
                  <DeckGrid decks={filter === 'purchased' ? purchasedStore : purchasedStore.slice(0, OVERVIEW_LIMIT)} showStoreState metricSettings={metricSettings.flashcards} />
                )}
              </Section>
            )}

            {filter === 'store' && (
              <div className={cn(adminFolderTree.length > 0 && 'grid lg:grid-cols-[270px,1fr] gap-5 lg:gap-6 items-start')}>
                {/* Sidebar de pastas */}
                {adminFolderTree.length > 0 && (
                  <StoreFolderNav
                    tree={adminFolderTree}
                    selected={storeFolder}
                    store={store}
                    folderCounts={storeFolderCounts}
                    pending={isFolderPending}
                    onSelect={selectStoreFolder}
                  />
                )}

                {/* Grid de decks */}
                <Section
                  title={storeFolder ? (adminFolders.find(f => f._id === storeFolder)?.name ?? 'Loja oficial') : 'Loja oficial · todos os decks'}
                  subtitle={loadingStore ? 'Carregando...' : `${filteredStore.length} ${filteredStore.length === 1 ? 'deck' : 'decks'}${storeFolder ? ' nesta pasta' : ' curados pela equipe'}`}
                  icon={<Crown className="h-5 w-5" />}
                  accent="from-amber-500 to-orange-500"
                  action={storeFolder ? (
                    <button onClick={() => selectStoreFolder(null)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-white transition">
                      <X className="h-3.5 w-3.5" /> Ver todos
                    </button>
                  ) : undefined}
                >
                  {loadingStore ? (
                    <DeckGridSkeleton />
                  ) : filteredStore.length === 0 ? (
                    <EmptyCallout title="Nenhum deck nesta pasta" hint="O administrador ainda não adicionou decks aqui." />
                  ) : (
                    <DeckGrid decks={filteredStore} showStoreState metricSettings={metricSettings.flashcards} />
                  )}
                </Section>
              </div>
            )}

            {!isGuest && showSection('community', loadingCommunity || community.length > 0) && (
              <Section
                title="Em alta na comunidade"
                subtitle="Decks públicos compartilhados por outros usuários"
                icon={<Globe className="h-5 w-5" />}
                accent="from-emerald-500 to-teal-500"
                toolbar={
                  <div className="flex gap-1.5">
                    {(['trending', 'new', 'featured'] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setCommunitySort(opt)}
                        className={cn(
                          'rounded-full px-3 py-1 text-[11px] font-semibold border transition',
                          communitySort === opt
                            ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-700 dark:text-emerald-200'
                            : 'border-white/30 dark:border-white/10 bg-white/40 dark:bg-white/5 text-slate-500 hover:text-slate-700 dark:hover:text-white'
                        )}
                      >
                        {opt === 'trending' ? 'Em alta' : opt === 'new' ? 'Novos' : 'Destaques'}
                      </button>
                    ))}
                  </div>
                }
                action={community.length > OVERVIEW_LIMIT && filter === 'all' ? <SectionLink onClick={() => selectSection('community')}>Ver todos</SectionLink> : undefined}
              >
                {loadingCommunity ? (
                  <DeckGridSkeleton />
                ) : community.length === 0 ? (
                  <EmptyCallout title="A comunidade está silenciosa" hint="Seja o primeiro a publicar um deck público." />
                ) : (
                  <DeckGrid decks={filter === 'community' ? community : community.slice(0, OVERVIEW_LIMIT)} metricSettings={metricSettings.flashcards} />
                )}
              </Section>
            )}

            {!isGuest && showSection('shared', loadingShared || shared.length > 0) && (
              <Section
                title="Compartilhados com você"
                subtitle={loadingShared ? 'Carregando...' : shared.length === 0 ? 'Quando alguém te enviar um deck, ele aparece aqui.' : `${shared.length} ${shared.length === 1 ? 'compartilhamento' : 'compartilhamentos'}`}
                icon={<Users className="h-5 w-5" />}
                accent="from-sky-500 to-cyan-500"
              >
                {loadingShared ? <DeckGridSkeleton count={2} /> : <SharedList shares={shared} onUpdate={() => loadShared()} />}
              </Section>
            )}
        </div>
      </div>
      </div>

      {createOpen && (
        <CreateDeckDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          isAdmin={isAdmin}
          folders={folders}
          onCreated={(slug) => {
            setCreateOpen(false)
            router.push(`/flashcards/d/${slug}/editar`)
          }}
        />
      )}

      {folderOpen && (
        <CreateFolderDialog open={folderOpen} onOpenChange={setFolderOpen} onCreated={() => loadFolders()} />
      )}

      <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={(open) => setToast(t => ({ ...t, open }))} />
    </AppShell>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Store folder nav (sidebar de pastas hierárquicas)
// ──────────────────────────────────────────────────────────────────────────────

interface FolderTreeNode {
  _id: string
  name: string
  color?: string
  parentFolderId?: string | null
  children: FolderTreeNode[]
}

function buildFolderTree(flat: FolderWithId[]): FolderTreeNode[] {
  const map = new Map<string, FolderTreeNode>()
  for (const f of flat) map.set(f._id, { ...f, children: [] })
  const roots: FolderTreeNode[] = []
  for (const f of map.values()) {
    if (f.parentFolderId && map.has(f.parentFolderId)) {
      map.get(f.parentFolderId)!.children.push(f)
    } else {
      roots.push(f)
    }
  }
  return roots
}

function StoreFolderNav({ tree, selected, store, folderCounts, pending, onSelect }: {
  tree: FolderTreeNode[]
  selected: string | null
  store: DeckWithId[]
  folderCounts: Map<string, number>
  pending: boolean
  onSelect: (id: string | null) => void
}) {
  return (
    <aside className="relative overflow-hidden rounded-lg border border-emerald-200/60 dark:border-emerald-400/15 bg-white/75 dark:bg-emerald-950/20 shadow-xl shadow-emerald-900/5 lg:sticky lg:top-20">
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(255,255,255,0.22)_42%,rgba(245,158,11,0.12))] dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(15,23,42,0.30)_46%,rgba(245,158,11,0.10))]" />
      <div className="relative px-4 py-3 border-b border-emerald-200/50 dark:border-emerald-400/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Coleções oficiais</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{store.length} {store.length === 1 ? 'deck' : 'decks'} na loja</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 ring-1 ring-emerald-400/20">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
          </div>
        </div>
      </div>
      <div className="relative max-h-[46dvh] space-y-1 overflow-y-auto overscroll-contain p-2 sm:max-h-[340px] lg:max-h-[calc(100dvh-180px)]">
        <FolderNavItem
          label="Todos os decks"
          count={store.length}
          active={selected === null}
          onClick={() => onSelect(null)}
          depth={0}
          color={undefined}
        />
        {tree.map(node => (
          <FolderNavNode
            key={node._id}
            node={node}
            selected={selected}
            folderCounts={folderCounts}
            onSelect={onSelect}
            depth={0}
          />
        ))}
      </div>
    </aside>
  )
}

function FolderNavNode({ node, selected, folderCounts, onSelect, depth }: {
  node: FolderTreeNode
  selected: string | null
  folderCounts: Map<string, number>
  onSelect: (id: string | null) => void
  depth: number
}) {
  const [expanded, setExpanded] = useState(true)
  const count = folderCounts.get(node._id) || 0
  const hasChildren = node.children.length > 0
  return (
    <div>
      <FolderNavItem
        label={node.name}
        count={count}
        active={selected === node._id}
        onClick={() => onSelect(node._id)}
        depth={depth}
        color={node.color}
        hasChildren={hasChildren}
        expanded={expanded}
        onToggle={() => setExpanded(v => !v)}
      />
      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <FolderNavNode key={child._id} node={child} selected={selected} folderCounts={folderCounts} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function FolderNavItem({ label, count, active, onClick, depth, color, hasChildren, expanded, onToggle }: {
  label: string; count: number; active: boolean; onClick: () => void; depth: number
  color?: string; hasChildren?: boolean; expanded?: boolean; onToggle?: () => void
}) {
  return (
    <div className="flex items-center min-w-0 overflow-hidden" style={{ paddingLeft: `${depth * 12}px` }}>
      {hasChildren && (
        <button onClick={onToggle} className="shrink-0 h-7 w-6 flex items-center justify-center text-emerald-600/60 hover:text-emerald-700 dark:text-emerald-300/60 dark:hover:text-emerald-100 transition">
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      )}
      {!hasChildren && <span className="shrink-0 w-6" />}
      <button
        onClick={onClick}
        className={cn(
          'flex-1 min-w-0 flex items-center justify-between gap-2 rounded-md px-2.5 py-2.5 text-sm text-left transition overflow-hidden ring-1',
          active
            ? 'bg-emerald-500/[0.18] text-emerald-800 dark:text-emerald-100 font-semibold ring-emerald-400/35 shadow-sm'
            : 'bg-white/40 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 ring-white/45 dark:ring-white/10 hover:bg-white/75 dark:hover:bg-white/10 hover:text-emerald-800 dark:hover:text-white'
        )}
        style={{ touchAction: 'manipulation' }}
      >
        <span className="flex items-center gap-2 min-w-0">
          {color
            ? <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            : <Folder className="h-3.5 w-3.5 shrink-0 text-emerald-600/70 dark:text-emerald-300/70" />
          }
          <span className="truncate">{label}</span>
        </span>
        {count > 0 && (
          <span className={cn('text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0', active ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-100' : 'bg-emerald-50 dark:bg-white/10 text-emerald-700 dark:text-emerald-200')}>
            {count}
          </span>
        )}
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Hero — Loja Oficial
// ──────────────────────────────────────────────────────────────────────────────

function StoreHero({ decks, totalStore, onSeeAll, metricSettings }: {
  decks: DeckWithId[]
  totalStore: number
  onSeeAll: () => void
  metricSettings: FlashcardMetricSettings
}) {
  const [hero, ...rest] = decks
  if (!hero) return null
  return (
    <section className="relative isolate overflow-hidden rounded-lg border border-border bg-gradient-to-br from-amber-50/80 via-card to-primary/5 dark:from-amber-950/20 dark:via-card dark:to-primary/10 shadow-xl">
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-400/20 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-accent/10 blur-2xl" />
      </div>
      <GlassHeroSurface className="opacity-60" />

      <div className="relative grid lg:grid-cols-[1.15fr,1fr] gap-5 p-5 lg:p-7">
        {/* Featured deck */}
        <TiltCard maxTilt={4} scale={1.012} className="rounded-lg">
        <Link href={`/flashcards/d/${hero.slug}`} className="group relative block overflow-hidden rounded-lg border border-border bg-slate-900 shadow-2xl">
          <div className="relative aspect-[16/10]">
            {hero.coverImage ? (
              <Image src={hero.coverImage} alt="" fill priority className="object-cover group-hover:scale-105 transition duration-700" sizes="(max-width: 1024px) 100vw, 60vw" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br bg-secondary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 px-3 py-1 text-[11px] font-bold text-amber-950 shadow-lg">
              <Crown className="h-3 w-3" /> Loja oficial
            </div>
            {hero.isFeatured && (
              <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/30 px-3 py-1 text-[11px] font-bold text-white">
                <Star className="h-3 w-3 fill-current text-amber-300" /> Destaque
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-7">
              <div className="flex items-center gap-3 mb-2 text-[11px] font-medium text-white/75">
                <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> {hero.cardCount} cartões</span>
                {metricSettings.showLikes && hero.likeCount && hero.likeCount > 0 ? (
                  <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {hero.likeCount}</span>
                ) : null}
                {metricSettings.showViews && hero.viewCount ? (
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {hero.viewCount}</span>
                ) : null}
              </div>
              <h2 className="text-2xl lg:text-4xl font-bold text-white drop-shadow-md leading-tight line-clamp-2">{hero.title}</h2>
              {hero.description && <p className="mt-2 text-sm text-white/80 line-clamp-2 max-w-xl">{hero.description}</p>}
              <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                {hero._isPurchased ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/95 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                    <Check className="h-3.5 w-3.5" /> Adquirido
                  </span>
                ) : hero.pricing === 'paid' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/95 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                    <Lock className="h-3.5 w-3.5" /> R$ {hero.price?.toFixed(2)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/95 px-3 py-1.5 text-sm font-bold text-white shadow-lg">Grátis</span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-3 py-1.5 text-sm font-semibold text-white group-hover:bg-white/25 transition">
                  Estudar agora <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>
        </TiltCard>

        {/* Sidebar */}
        <div className="flex flex-col gap-3.5">
          <div className="rounded-lg border border-border bg-card p-5 shadow-lg">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Loja oficial · {totalStore} {totalStore === 1 ? 'deck' : 'decks'}</span>
            </div>
            <h3 className="text-xl font-bold text-foreground leading-tight">Decks dos especialistas</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Material curado pela equipe DomineAqui. Comprou uma vez, estuda para sempre.
            </p>
            <button
              onClick={onSeeAll}
              className="mt-4 group inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 hover:shadow-rose-500/40 hover:scale-[1.02] transition"
            >
              <Crown className="h-4 w-4" /> Explorar loja completa
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {rest.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {rest.map(d => <CompactStoreCard key={d._id} deck={d} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function CompactStoreCard({ deck }: { deck: DeckWithId }) {
  const priceLabel = deck._isPurchased ? '✓ Adquirido' : deck.pricing === 'paid' ? `R$ ${deck.price?.toFixed(2)}` : 'Grátis'
  return (
    <Link
      href={`/flashcards/d/${deck.slug}`}
      className="group relative block overflow-hidden rounded-md border border-border bg-card shadow transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/50 hover:shadow-xl"
    >
      <div className="relative aspect-[16/10]">
        {deck.coverImage ? (
          <Image src={deck.coverImage} alt="" fill className="object-cover group-hover:scale-110 transition duration-500" sizes="(max-width: 1024px) 50vw, 20vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2 py-0.5 text-[9px] font-bold text-amber-950 shadow">
          <Crown className="h-2.5 w-2.5" /> Oficial
        </div>
        <div className="absolute bottom-1.5 left-1.5 right-1.5">
          <p className="text-xs font-bold text-white drop-shadow-md line-clamp-2 leading-tight">{deck.title}</p>
          <p className="text-[10px] text-white/85 mt-0.5 font-semibold">{priceLabel}</p>
        </div>
      </div>
    </Link>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Toolbar + Filtros
// ──────────────────────────────────────────────────────────────────────────────

function Toolbar({ search, setSearch, filter, setFilter, counts, foldersOpen, setFoldersOpen, guestMode = false }: {
  search: string
  setSearch: (s: string) => void
  filter: Filter
  setFilter: (f: Filter) => void
  counts: { all: number; mine: number; purchased: number; community: number; store: number; shared: number }
  foldersOpen: boolean
  setFoldersOpen: (cb: (v: boolean) => boolean) => void
  guestMode?: boolean
}) {
  return (
    <div className={cn(
      'sticky top-16 z-20 rounded-lg border p-3 shadow-lg transition-[background-color,border-color,box-shadow] duration-300 ease-out',
      filter === 'store'
        ? 'border-emerald-200/60 dark:border-emerald-400/15 bg-white/[0.78] dark:bg-emerald-950/25 shadow-emerald-900/5'
        : filter === 'purchased'
        ? 'border-emerald-200/60 dark:border-emerald-400/15 bg-white/[0.78] dark:bg-emerald-950/25 shadow-emerald-900/5'
        : 'border-white/40 dark:border-white/10 bg-card shadow-slate-900/5'
    )}>
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar decks por título, descrição, tags..."
            className="w-full rounded-md bg-card border border-border pl-11 pr-4 py-2.5 text-sm placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:bg-background transition"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mb-0.5 overscroll-x-contain">
          {!guestMode && (
            <>
              <ChipFilter active={filter === 'all'} onClick={() => setFilter('all')} count={counts.all} icon={<Layers className="h-3.5 w-3.5" />}>Tudo</ChipFilter>
              <ChipFilter active={filter === 'mine'} onClick={() => setFilter('mine')} count={counts.mine} icon={<Inbox className="h-3.5 w-3.5" />}>Meus</ChipFilter>
              <ChipFilter active={filter === 'purchased'} onClick={() => setFilter('purchased')} count={counts.purchased} icon={<ShoppingBag className="h-3.5 w-3.5" />} accent="emerald">Adquiridos</ChipFilter>
            </>
          )}
          <ChipFilter active={filter === 'store'} onClick={() => setFilter('store')} count={counts.store} icon={<Crown className="h-3.5 w-3.5" />} accent="amber">Loja</ChipFilter>
          {!guestMode && (
            <>
              <ChipFilter active={filter === 'community'} onClick={() => setFilter('community')} count={counts.community} icon={<Globe className="h-3.5 w-3.5" />}>Comunidade</ChipFilter>
              <ChipFilter active={filter === 'shared'} onClick={() => setFilter('shared')} count={counts.shared} icon={<Users className="h-3.5 w-3.5" />}>Recebidos</ChipFilter>
            </>
          )}
          {!guestMode && (
            <button
              onClick={() => setFoldersOpen((v: boolean) => !v)}
              aria-hidden={!(filter === 'mine' || filter === 'all')}
              tabIndex={filter === 'mine' || filter === 'all' ? 0 : -1}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold border whitespace-nowrap transition-[background-color,border-color,color,opacity] duration-200 ease-out',
                filter === 'mine' || filter === 'all' ? 'opacity-100' : 'pointer-events-none opacity-0',
                foldersOpen
                  ? 'bg-primary/10 border-primary/35 text-primary shadow-sm'
                  : 'bg-card border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10'
              )}
            >
              <Folder className="h-3.5 w-3.5" /> Pastas
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ChipFilter({ active, onClick, count, icon, accent = 'violet', children }: {
  active: boolean; onClick: () => void; count: number; icon: React.ReactNode; accent?: 'violet' | 'amber' | 'emerald'; children: React.ReactNode
}) {
  const gradientClasses = {
    amber: 'from-amber-500 to-orange-500',
    emerald: 'from-emerald-500 to-teal-500',
    violet: 'bg-primary',
  }[accent]
  const shadowClasses = {
    amber: 'shadow-amber-500/30',
    emerald: 'shadow-emerald-500/30',
    violet: 'shadow-primary/15',
  }[accent]
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-md border px-3 text-xs font-semibold whitespace-nowrap transition-[border-color,color,box-shadow] duration-200 ease-out',
        active
          ? cn('border-transparent text-white shadow-lg', shadowClasses)
          : 'bg-card border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10'
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 bg-gradient-to-r transition-opacity duration-200 ease-out',
          gradientClasses,
          active ? 'opacity-100' : 'opacity-0'
        )}
      />
      <span className="relative inline-flex items-center gap-1.5">
        {icon} {children}
      </span>
      <span className={cn('relative min-w-[1.5rem] text-center text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors duration-200 ease-out', active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500')}>{count}</span>
    </button>
  )
}

function FoldersPanel({ folders, mineCount, activeFolder, setActiveFolder, onAdd }: {
  folders: FolderWithId[]
  mineCount: number
  activeFolder: string | 'all' | 'root'
  setActiveFolder: (id: string | 'all' | 'root') => void
  onAdd: () => void
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2">Pastas</span>
        <FolderPill active={activeFolder === 'all'} onClick={() => setActiveFolder('all')} icon={<Inbox className="h-3.5 w-3.5" />}>Todos · {mineCount}</FolderPill>
        <FolderPill active={activeFolder === 'root'} onClick={() => setActiveFolder('root')} icon={<Folder className="h-3.5 w-3.5" />}>Sem pasta</FolderPill>
        {folders.map(f => (
          <FolderPill key={f._id} active={activeFolder === f._id} onClick={() => setActiveFolder(f._id)} icon={<Folder className="h-3.5 w-3.5" style={{ color: f.color || undefined }} />}>{f.name}</FolderPill>
        ))}
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition"
        >
          <FolderPlus className="h-3.5 w-3.5" /> Nova pasta
        </button>
      </div>
    </div>
  )
}

function FolderPill({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition border',
        active
          ? 'bg-primary/10 border-primary/35 text-primary shadow-sm'
          : 'bg-card border-white/30 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10'
      )}
      style={{ touchAction: 'manipulation' }}
    >
      {icon} {children}
    </button>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Sections, grids, cards
// ──────────────────────────────────────────────────────────────────────────────

function Section({ title, subtitle, icon, accent, action, toolbar, children }: {
  title: string
  subtitle?: string
  icon: React.ReactNode
  accent: string
  action?: React.ReactNode
  toolbar?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card/40 p-4 sm:p-5 shadow-sm">
      <header className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-sm">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-lg md:text-xl font-semibold text-foreground leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {toolbar}
          {action}
        </div>
      </header>
      {children}
    </section>
  )
}

function SectionLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 hover:border-primary/40 transition"
    >
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </button>
  )
}

function DeckGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border bg-white/60 dark:bg-slate-900/40 shadow-sm animate-pulse">
          <div className="aspect-[16/10] skeleton-pulse" />
          <div className="p-4 space-y-2.5">
            <div className="h-4 w-4/5 rounded skeleton-pulse" />
            <div className="h-3 w-3/5 rounded skeleton-pulse" />
            <div className="h-3 w-2/5 rounded skeleton-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyCallout({ title, hint, cta }: { title: string; hint: string; cta?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 p-10 text-center">
      <div className="mx-auto mb-3 h-12 w-12 rounded-md bg-gradient-to-br from-primary/15 to-primary/10 flex items-center justify-center">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{hint}</p>
      {cta && <div className="mt-4 flex justify-center">{cta}</div>}
    </div>
  )
}

// Entrada em CSS puro: antes cada card era um `motion.div` com spring próprio,
// o que colocava dezenas de animações JS na thread principal a cada troca de
// seção. A mesma leitura visual sai de graça com uma keyframe do compositor.
const DeckGrid = memo(function DeckGrid({ decks, owned = false, onDelete, showStoreState = false, metricSettings }: {
  decks: DeckWithId[]
  owned?: boolean
  onDelete?: (id: string) => void
  showStoreState?: boolean
  metricSettings: FlashcardMetricSettings
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((d, i) => (
        <div
          key={d._id}
          className="deck-card-rise"
          style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
        >
          <DeckCard deck={d} owned={owned} onDelete={onDelete} showStoreState={showStoreState} metricSettings={metricSettings} />
        </div>
      ))}
    </div>
  )
})

const DeckCard = memo(function DeckCard({ deck, owned, onDelete, showStoreState, metricSettings }: {
  deck: DeckWithId
  owned?: boolean
  onDelete?: (id: string) => void
  showStoreState?: boolean
  metricSettings: FlashcardMetricSettings
}) {
  const hasPublicMetrics = metricSettings.showLikes || metricSettings.showViews

  // Sem TiltCard aqui: cada card do grid registrava mousemove + dois springs do
  // framer-motion. Numa grade de 20 decks isso é jank puro no scroll. O hover
  // agora é uma elevação em CSS, que o compositor resolve sozinho.
  return (
    <div className="group relative isolate h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
      <Link href={`/flashcards/d/${deck.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          {deck.coverImage ? (
            <Image src={deck.coverImage} alt="" fill className="object-cover group-hover:scale-110 transition duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {deck.ownerType === 'admin' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 text-amber-950 text-[10px] font-bold px-2 py-0.5 shadow"><Crown className="h-3 w-3" /> Oficial</span>
            )}
            {deck.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/30 border border-white/30 text-white text-[10px] font-bold px-2 py-0.5 shadow"><Star className="h-3 w-3 fill-current" /> Destaque</span>
            )}
          </div>
          <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end">
            {deck.pricing === 'paid' && (
              showStoreState && deck._isPurchased ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/95 text-white text-[10px] font-bold px-2 py-0.5 shadow"><Check className="h-3 w-3" /> Adquirido</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/95 text-white text-[10px] font-bold px-2 py-0.5 shadow"><Lock className="h-3 w-3" /> R$ {deck.price?.toFixed(2)}</span>
              )
            )}
            {deck.pricing !== 'paid' && deck.visibility === 'public' && !owned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/85 text-white text-[10px] font-medium px-2 py-0.5"><Globe className="h-3 w-3" /> Público</span>
            )}
          </div>
          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[11px] text-white font-semibold bg-black/40 rounded-full px-2 py-0.5">
            <Sparkles className="h-3 w-3" /> {deck.cardCount}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition">{deck.title}</h3>
          {deck.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{deck.description}</p>}
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
            {metricSettings.showLikes && (
              <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {deck.likeCount || 0}</span>
            )}
            {metricSettings.showViews && (
              <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {deck.viewCount || 0}</span>
            )}
            <span className={cn('text-slate-400 truncate', hasPublicMetrics ? 'ml-auto max-w-[60%]' : 'max-w-full')}>por {deck.ownerName}</span>
          </div>
        </div>
      </Link>
      {owned && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-white via-white/95 dark:from-slate-900 dark:via-slate-900/95 to-transparent px-4 pb-3 pt-6 opacity-0 group-hover:opacity-100 transition">
          <Link href={`/flashcards/d/${deck.slug}/editar`}>
            <Button size="sm" variant="ghost"><Edit3 className="h-3.5 w-3.5" /> Editar</Button>
          </Link>
          {onDelete && (
            <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); onDelete(deck._id) }} className="text-rose-600 hover:text-rose-700">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
})

// ──────────────────────────────────────────────────────────────────────────────
// Shared list
// ──────────────────────────────────────────────────────────────────────────────

function SharedList({ shares, onUpdate }: { shares: any[]; onUpdate: () => void }) {
  async function respond(id: string, status: 'accepted' | 'dismissed') {
    await fetch(`/api/flashcards/manual/shares/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdate()
  }
  if (!shares.length) return <EmptyCallout title="Nenhum deck compartilhado com você" hint="Quando alguém compartilhar um deck, ele aparece aqui." />
  return (
    <ul className="space-y-3">
      {shares.map(s => (
        <li key={s._id} className="rounded-lg border border-border bg-card p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <strong className="text-foreground">{s.fromUserName}</strong>
              <span className="text-slate-500"> compartilhou </span>
              <strong className="text-foreground">{s.deck?.title || 'um deck'}</strong>
              <span className="text-slate-500"> com você.</span>
            </p>
            {s.message && <p className="mt-1 text-xs text-slate-500 italic">"{s.message}"</p>}
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">Status: {s.status}</p>
          </div>
          <div className="flex items-center gap-2">
            {s.status === 'pending' && (
              <>
                <button
                  onClick={() => respond(s._id, 'accepted')}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow hover:shadow-lg transition"
                >
                  Aceitar
                </button>
                <button
                  onClick={() => respond(s._id, 'dismissed')}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition"
                >
                  Dispensar
                </button>
              </>
            )}
            {s.deck?.slug && (
              <Link href={`/flashcards/d/${s.deck.slug}`}>
                <button className="inline-flex items-center gap-1 rounded-md border border-border bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-white hover:bg-white/90 dark:hover:bg-white/10 transition">
                  Abrir <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Create deck dialog
// ──────────────────────────────────────────────────────────────────────────────

const ADMIN_GROUPS = [
  { id: 'gratuito', label: 'Gratuito' },
  { id: 'trial', label: 'Trial' },
  { id: 'essential', label: 'Essential' },
  { id: 'premium', label: 'Premium' },
  { id: 'monitor', label: 'Monitor' },
]

function buildMateriaisPaths(folders: { _id: string; name: string; parentFolderId?: string | null }[]) {
  const map = new Map(folders.map(f => [f._id, f]))
  function getPath(id: string): string {
    const f = map.get(id)
    if (!f) return ''
    if (!f.parentFolderId) return f.name
    const parent = getPath(f.parentFolderId)
    return parent ? `${parent} › ${f.name}` : f.name
  }
  return folders.map(f => ({ _id: f._id, path: getPath(f._id) })).sort((a, b) => a.path.localeCompare(b.path))
}

function CreateDeckDialog({ open, onOpenChange, isAdmin, folders, onCreated }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  isAdmin: boolean
  folders: FolderWithId[]
  onCreated: (slug: string) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [folderId, setFolderId] = useState<string>('')
  const [asAdmin, setAsAdmin] = useState(false)
  const [visibility, setVisibility] = useState<'private' | 'public' | 'unlisted'>('private')
  const [pricing, setPricing] = useState<'free' | 'paid'>('free')
  const [price, setPrice] = useState('')
  const [allowedGroups, setAllowedGroups] = useState<string[]>([])
  const [materialsFolderId, setMaterialsFolderId] = useState('')
  const [materiaisFolders, setMateriaisFolders] = useState<{ _id: string; name: string; parentFolderId?: string | null }[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setTitle(''); setDescription(''); setCoverImage(''); setFolderId(''); setAsAdmin(false)
      setVisibility('private'); setPricing('free'); setPrice('')
      setAllowedGroups([]); setMaterialsFolderId(''); setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || !isAdmin) return
    fetch('/api/materiais/folders?all=true').then(r => r.json()).then(j => {
      setMateriaisFolders(j.folders || [])
    }).catch(() => {})
  }, [open, isAdmin])

  const materiaisPaths = useMemo(() => buildMateriaisPaths(materiaisFolders), [materiaisFolders])

  function toggleGroup(g: string) {
    setAllowedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  async function submit() {
    if (!title.trim()) { setError('Título é obrigatório'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/flashcards/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          coverImage: coverImage || undefined,
          folderId: folderId || null,
          asAdmin: isAdmin && asAdmin,
          pricing: isAdmin && asAdmin ? pricing : 'free',
          price: pricing === 'paid' ? Number(price) || 0 : 0,
          visibility: isAdmin ? visibility : undefined,
          allowedGroups: isAdmin && asAdmin ? allowedGroups : undefined,
          materialsFolderId: isAdmin && asAdmin ? materialsFolderId || null : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao criar')
      onCreated(json.deck.slug)
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl !bg-transparent !border-0 !shadow-none !rounded-none !p-0">
        <div className="relative overflow-hidden rounded-lg border border-border bg-white/85 dark:bg-slate-900/85 shadow-2xl">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          </div>

          {/* Header */}
          <div className="relative px-7 pt-6 pb-5 border-b border-white/40 dark:border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" /> Novo deck
                </div>
                <h2 className="mt-2 text-2xl font-bold text-foreground leading-tight">Vamos criar seu deck</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Defina o básico. Você poderá editar tudo e adicionar cartões depois.</p>
              </div>
              <button onClick={() => onOpenChange(false)} className="rounded-full p-2 hover:bg-white/60 dark:hover:bg-white/10 transition">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="relative px-7 py-6 space-y-6 max-h-[65vh] overflow-y-auto">
            {/* Identidade */}
            <div className="space-y-3">
              <FieldLabel icon={<Sparkles className="h-3.5 w-3.5" />}>Identidade</FieldLabel>
              <div>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={120}
                  autoFocus
                  placeholder="Título do deck, ex: Anatomia Cardiovascular"
                  className="w-full rounded-md border border-border bg-card px-4 py-3 text-base font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-normal outline-none focus:border-primary/50 focus:bg-background transition"
                />
                <div className="mt-1 text-[10px] text-slate-400 text-right">{title.length}/120</div>
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                maxLength={400}
                placeholder="Descrição (opcional): sobre o que é este deck"
                className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:bg-background transition resize-none"
              />
              <div>
                <input
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  placeholder="URL da capa (opcional)"
                  className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:bg-background transition"
                />
                <p className="mt-1 text-[10px] text-slate-400">Recomendado: 1280 × 720 px · proporção 16:9</p>
              </div>
            </div>

            {/* Pasta do usuário */}
            {folders.length > 0 && (
              <div className="space-y-2">
                <FieldLabel icon={<Folder className="h-3.5 w-3.5" />}>Organização: pasta</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  <ChoicePill active={folderId === ''} onClick={() => setFolderId('')} icon={<Inbox className="h-3.5 w-3.5" />}>Sem pasta</ChoicePill>
                  {folders.map(f => (
                    <ChoicePill key={f._id} active={folderId === f._id} onClick={() => setFolderId(f._id)} icon={<Folder className="h-3.5 w-3.5" style={{ color: f.color || undefined }} />}>{f.name}</ChoicePill>
                  ))}
                </div>
              </div>
            )}

            {/* Admin block */}
            {isAdmin && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <FieldLabel icon={<Crown className="h-3.5 w-3.5" />} accent="amber">Tipo do deck</FieldLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <RadioCard
                      active={!asAdmin}
                      onClick={() => setAsAdmin(false)}
                      title="Pessoal"
                      description="Privado por padrão. Você decide se publica."
                      icon={<Inbox className="h-5 w-5" />}
                    />
                    <RadioCard
                      active={asAdmin}
                      onClick={() => setAsAdmin(true)}
                      title="Oficial DomineAqui"
                      description="Aparece na loja. Pode ser pago via /materiais."
                      icon={<Crown className="h-5 w-5" />}
                      accent="amber"
                    />
                  </div>
                </div>

                {/* Visibilidade — para qualquer deck admin */}
                <div className="space-y-2">
                  <FieldLabel icon={<Eye className="h-3.5 w-3.5" />}>Visibilidade</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    <ChoicePill active={visibility === 'private'} onClick={() => setVisibility('private')} icon={<Lock className="h-3.5 w-3.5" />}>Privado</ChoicePill>
                    <ChoicePill active={visibility === 'unlisted'} onClick={() => setVisibility('unlisted')} icon={<Eye className="h-3.5 w-3.5" />}>Não-listado</ChoicePill>
                    <ChoicePill active={visibility === 'public'} onClick={() => setVisibility('public')} icon={<Globe className="h-3.5 w-3.5" />}>Público</ChoicePill>
                  </div>
                </div>

                {/* Configurações de deck oficial */}
                {asAdmin && (
                  <div className="space-y-4 rounded-md border border-amber-300/40 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-4">
                    {/* Monetização */}
                    <div className="space-y-3">
                      <FieldLabel icon={<ShoppingCart className="h-3.5 w-3.5" />} accent="amber">Monetização</FieldLabel>
                      <div className="grid grid-cols-2 gap-3">
                        <RadioCard
                          active={pricing === 'free'}
                          onClick={() => setPricing('free')}
                          title="Gratuito"
                          description="Acesso aberto a todos."
                          icon={<Globe className="h-5 w-5" />}
                          accent="emerald"
                        />
                        <RadioCard
                          active={pricing === 'paid'}
                          onClick={() => setPricing('paid')}
                          title="Pago"
                          description="Vendido na loja /materiais."
                          icon={<Lock className="h-5 w-5" />}
                          accent="rose"
                        />
                      </div>
                      {pricing === 'paid' && (
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Preço (R$)</label>
                          <div className="mt-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={price}
                              onChange={e => setPrice(e.target.value)}
                              placeholder="0,00"
                              className="w-full rounded-md border border-border bg-card pl-12 pr-4 py-3 text-base font-bold text-foreground outline-none focus:border-amber-400 transition"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Grupos de acesso */}
                    <div className="space-y-2">
                      <FieldLabel icon={<Users className="h-3.5 w-3.5" />} accent="amber">Grupos com acesso</FieldLabel>
                      <p className="text-[10px] text-amber-700/70 dark:text-amber-300/60">Deixe vazio para acesso aberto. Selecione para restringir a grupos específicos.</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ADMIN_GROUPS.map(g => (
                          <ChoicePill
                            key={g.id}
                            active={allowedGroups.includes(g.id)}
                            onClick={() => toggleGroup(g.id)}
                            icon={allowedGroups.includes(g.id) ? <Check className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                          >
                            {g.label}
                          </ChoicePill>
                        ))}
                      </div>
                    </div>

                    {/* Pasta em /materiais */}
                    <div className="space-y-2">
                      <FieldLabel icon={<Folder className="h-3.5 w-3.5" />} accent="amber">Pasta em /materiais</FieldLabel>
                      <select
                        value={materialsFolderId}
                        onChange={e => setMaterialsFolderId(e.target.value)}
                        className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-amber-400 transition"
                      >
                        <option value="">Raiz (sem pasta)</option>
                        {materiaisPaths.map(f => (
                          <option key={f._id} value={f._id}>{f.path}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-rose-300/50 bg-rose-50/70 dark:bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}
          </div>

          <div className="relative px-7 py-4 border-t border-white/40 dark:border-white/10 flex items-center justify-between gap-3 bg-white/40 dark:bg-white/5 backdrop-blur-md">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Você poderá adicionar cartões em seguida.</p>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-md px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 transition"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={busy || !title.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-secondary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/15 hover:shadow-primary/10 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar e editar
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FieldLabel({ children, icon, accent = 'violet' }: { children: React.ReactNode; icon?: React.ReactNode; accent?: 'violet' | 'amber' }) {
  const color = accent === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
  return (
    <div className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider', color)}>
      {icon} {children}
    </div>
  )
}

function ChoicePill({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition border',
        active
          ? 'bg-primary/10 border-primary/35 text-primary shadow-sm'
          : 'bg-card border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10'
      )}
    >
      {icon} {children}
    </button>
  )
}

function RadioCard({ active, onClick, title, description, icon, accent = 'violet' }: {
  active: boolean
  onClick: () => void
  title: string
  description: string
  icon: React.ReactNode
  accent?: 'violet' | 'amber' | 'emerald' | 'rose'
}) {
  const activeBorder = {
    violet: 'border-primary/45 bg-primary/10 text-primary',
    amber: 'border-amber-400/60 bg-amber-500/10 text-amber-700 dark:text-amber-200',
    emerald: 'border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
    rose: 'border-rose-400/60 bg-rose-500/10 text-rose-700 dark:text-rose-200',
  } as const
  const iconBg = {
    violet: 'bg-gradient-to-br from-primary to-primary/80',
    amber: 'bg-gradient-to-br from-amber-500 to-orange-500',
    emerald: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    rose: 'bg-gradient-to-br from-rose-500 to-pink-500',
  } as const
  const checkBg = {
    violet: 'bg-primary',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
  } as const
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded-md border-2 p-4 text-left transition backdrop-blur-md',
        active
          ? cn('shadow-md', activeBorder[accent])
          : 'border-white/30 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
      )}
    >
      <div className={cn('mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow', iconBg[accent])}>
        {icon}
      </div>
      <div className="text-sm font-bold">{title}</div>
      <div className={cn('text-[11px] mt-0.5 leading-tight', active ? 'opacity-90' : 'text-slate-500 dark:text-slate-400')}>{description}</div>
      {active && (
        <div className={cn('absolute top-2.5 right-2.5 h-5 w-5 rounded-full flex items-center justify-center text-white shadow', checkBg[accent])}>
          <Check className="h-3 w-3" strokeWidth={3} />
        </div>
      )}
    </button>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Create folder dialog
// ──────────────────────────────────────────────────────────────────────────────

function CreateFolderDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#8b5cf6')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const palette = ['#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#6366f1', '#ec4899']
  async function submit() {
    if (!name.trim()) { setError('Nome obrigatório'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/flashcards/manual/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro')
      onCreated()
      onOpenChange(false)
      setName('')
    } catch (err: any) { setError(err?.message || 'Erro') }
    finally { setBusy(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md !bg-transparent !border-0 !shadow-none !rounded-none !p-0">
        <div className="relative overflow-hidden rounded-lg border border-border bg-white/85 dark:bg-slate-900/85 shadow-2xl">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
          </div>
          <div className="relative px-6 pt-6 pb-3 border-b border-white/40 dark:border-white/10 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Nova pasta</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Organize seus decks em pastas coloridas.</p>
            </div>
            <button onClick={() => onOpenChange(false)} className="rounded-full p-1.5 hover:bg-white/60 dark:hover:bg-white/10 transition">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
          <div className="relative p-6 space-y-4">
            <div>
              <FieldLabel>Nome</FieldLabel>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Patologia, Provas..."
                maxLength={50}
                autoFocus
                className="mt-1 w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition"
              />
            </div>
            <div>
              <FieldLabel>Cor</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {palette.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={cn(
                      'h-9 w-9 rounded-md shadow transition border-2 relative',
                      color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                    )}
                    aria-label={`Cor ${c}`}
                  >
                    {color === c && <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" strokeWidth={3} />}
                  </button>
                ))}
                <label className="h-9 w-9 rounded-md border-2 border-dashed border-white/40 dark:border-white/15 cursor-pointer flex items-center justify-center hover:border-primary/40 transition">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="opacity-0 w-0 h-0" aria-label="Cor personalizada" />
                  <span className="text-[10px] font-bold text-slate-500">+</span>
                </label>
              </div>
            </div>
            {error && <div className="rounded-md border border-rose-300/50 bg-rose-50/70 dark:bg-rose-500/10 px-4 py-2 text-xs text-rose-600 dark:text-rose-300">{error}</div>}
          </div>
          <div className="relative px-6 py-4 border-t border-white/40 dark:border-white/10 flex justify-end gap-2 bg-white/40 dark:bg-white/5">
            <button onClick={() => onOpenChange(false)} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-white/60 dark:hover:bg-white/10 transition">Cancelar</button>
            <button
              onClick={submit}
              disabled={busy || !name.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/15 hover:shadow-primary/10 disabled:opacity-50 transition"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />} Criar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
