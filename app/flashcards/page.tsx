'use client'

import { avisarXp } from '@/lib/xp/cliente'
import { useCallback, useEffect, useMemo, memo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Search,
  Folder,
  FolderPlus,
  Globe,
  Users,
  Sparkles,
  Crown,
  Lock,
  Heart,
  Eye,
  ChevronRight,
  ChevronDown,
  CalendarClock,
  Trash2,
  Edit3,
  ShoppingCart,
  Wand2,
  Inbox,
  Loader2,
  BookMarked,
  X,
  Check,
  Flame,
  RotateCcw,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { FundoIos } from '@/components/materiais/fundo-ios'
import { AnelProgresso } from '@/components/flashcards/pecas-ios'
import {
  EVENTO_RITMO,
  METAS_DIARIAS,
  lerMetaDiaria,
  lerSequencia,
  registrarDiaDeEstudo,
  salvarMetaDiaria,
} from '@/lib/flashcard-ritmo'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToastAlert } from '@/components/ui/toast-alert'
import { cn } from '@/lib/utils'
import { useBootstrap } from '@/hooks/use-bootstrap'
import {
  DEFAULT_PUBLIC_METRIC_SETTINGS,
  type PublicMetricSettings,
} from '@/lib/display-settings'
import type { FlashcardManualDeck, FlashcardManualFolder } from '@/lib/types'

/** Preço em português: vírgula decimal, como em qualquer etiqueta brasileira. */
function formatPrice(value?: number) {
  return `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`
}

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
type FlashcardMetricSettings = PublicMetricSettings['flashcards']

// A área tem três destinos, e só três: o que é seu, o que a equipe vende e o
// que a comunidade publica. Tudo o mais (criados / adquiridos / recebidos,
// pastas, coleções) é filtro dentro de um destino — nunca um destino a mais.
type Section = 'library' | 'store' | 'community'
// Recortes de "Biblioteca". Só aparecem quando existe mais de um tipo de
// material para separar; com apenas decks próprios, a régua some.
type LibraryTab = 'all' | 'mine' | 'purchased' | 'shared'

const LIBRARY_TABS: LibraryTab[] = ['all', 'mine', 'purchased', 'shared']

const SECTION_SUBTITLE: Record<Section, string> = {
  library: 'Seus decks e os que você adquiriu',
  store: 'Decks oficiais da equipe',
  community: 'Decks públicos de outros estudantes',
}

/**
 * URLs antigas (`?section=mine`, `?tab=adquiridos`, `#comunidade`) continuam
 * válidas: cada valor cai no destino novo e, quando fizer sentido, já abre o
 * recorte correspondente da biblioteca.
 */
function parseUrlState(url: URL): { section: Section; libraryTab: LibraryTab } {
  const hashValue = url.hash.replace(/^#/, '')
  const raw = (url.searchParams.get('section') || url.searchParams.get('view') || hashValue || '').toLowerCase()
  const rawTab = (url.searchParams.get('tab') || '').toLowerCase()

  const toSection: Record<string, { section: Section; libraryTab?: LibraryTab }> = {
    library: { section: 'library' },
    biblioteca: { section: 'library' },
    all: { section: 'library', libraryTab: 'all' },
    tudo: { section: 'library', libraryTab: 'all' },
    todos: { section: 'library', libraryTab: 'all' },
    mine: { section: 'library', libraryTab: 'mine' },
    meus: { section: 'library', libraryTab: 'mine' },
    minhas: { section: 'library', libraryTab: 'mine' },
    purchased: { section: 'library', libraryTab: 'purchased' },
    adquiridos: { section: 'library', libraryTab: 'purchased' },
    comprados: { section: 'library', libraryTab: 'purchased' },
    oficiais: { section: 'library', libraryTab: 'purchased' },
    'meus-oficiais': { section: 'library', libraryTab: 'purchased' },
    shared: { section: 'library', libraryTab: 'shared' },
    recebidos: { section: 'library', libraryTab: 'shared' },
    compartilhados: { section: 'library', libraryTab: 'shared' },
    store: { section: 'store' },
    loja: { section: 'store' },
    oficial: { section: 'store' },
    community: { section: 'community' },
    comunidade: { section: 'community' },
  }

  // `?tab=` era um apelido de seção nas URLs antigas e virou o recorte da
  // biblioteca. Se o valor não for um recorte conhecido, ele volta a ser lido
  // como seção — links salvos continuam abrindo no lugar certo.
  const resolved = toSection[raw] ?? (raw ? undefined : toSection[rawTab])
  const section = resolved?.section ?? 'library'
  const tabFromUrl = LIBRARY_TABS.includes(rawTab as LibraryTab) ? (rawTab as LibraryTab) : undefined
  return { section, libraryTab: tabFromUrl ?? resolved?.libraryTab ?? 'all' }
}

export default function FlashcardsHubPage() {
  const router = useRouter()
  const [section, setSection] = useState<Section>('library')
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('all')
  const [mine, setMine] = useState<DeckWithId[]>([])
  const [community, setCommunity] = useState<DeckWithId[]>([])
  const [store, setStore] = useState<DeckWithId[]>([])
  const [shared, setShared] = useState<any[]>([])
  const [folders, setFolders] = useState<FolderWithId[]>([])
  const [activeFolder, setActiveFolder] = useState<string | 'all' | 'root'>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  // Loading granular por bloco — cada grade mostra seu próprio molde assim que
  // a página monta, em vez de travar tudo atrás da requisição mais lenta.
  const [loadingMine, setLoadingMine] = useState(true)
  const [loadingCommunity, setLoadingCommunity] = useState(true)
  const [loadingStore, setLoadingStore] = useState(true)
  const [loadingShared, setLoadingShared] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })
  const [isAdmin, setIsAdmin] = useState(false)
  const [communitySort, setCommunitySort] = useState<'trending' | 'new' | 'featured'>('trending')
  const [adminFolders, setAdminFolders] = useState<FolderWithId[]>([])
  const [storeFolder, setStoreFolder] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [metricSettings, setMetricSettings] = useState<PublicMetricSettings>(DEFAULT_PUBLIC_METRIC_SETTINGS)
  // Cards vencidos por deck. É o que transforma a repetição espaçada de
  // recurso escondido dentro do deck em chamado visível na porta de entrada.
  const [dueByDeck, setDueByDeck] = useState<Record<string, number>>({})
  // Caderno de erros por deck (última nota "Difícil") e o que já foi revisado
  // hoje — vêm da mesma agregação dos vencidos.
  const [errorsByDeck, setErrorsByDeck] = useState<Record<string, number>>({})
  const [reviewedToday, setReviewedToday] = useState<number | null>(null)
  const initialLoadDoneRef = useRef(false)
  const topRef = useRef<HTMLDivElement>(null)
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
    const next = parseUrlState(url)
    setSection(next.section)
    setLibraryTab(next.libraryTab)
    setStoreFolder(next.section === 'store' ? url.searchParams.get('folder') : null)
  }, [])

  const updateUrl = useCallback((nextSection: Section, nextTab: LibraryTab, nextStoreFolder?: string | null) => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (nextSection === 'library') url.searchParams.delete('section')
    else url.searchParams.set('section', nextSection)

    if (nextSection === 'library' && nextTab !== 'all') url.searchParams.set('tab', nextTab)
    else url.searchParams.delete('tab')

    url.searchParams.delete('view')
    if (nextSection === 'store' && nextStoreFolder) url.searchParams.set('folder', nextStoreFolder)
    else url.searchParams.delete('folder')
    url.hash = ''

    window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  // Ao trocar de destino, devolve a barra de comando ao campo de visão: sem
  // isso quem estava no meio de uma grade longa mudava de seção e continuava
  // parado no meio da página, sem perceber o que mudou.
  const scrollToTop = useCallback(() => {
    if (typeof window === 'undefined') return
    const el = topRef.current
    if (!el) return
    const headerOffset = (window.innerWidth >= 640 ? 64 : 56) + 8
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset
    if (window.scrollY > top + 8) window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
  }, [])

  const selectSection = useCallback((next: Section) => {
    // Loja e comunidade são públicas; a biblioteca é que exige conta.
    if (isGuest && next === 'library') {
      router.push(`/auth/login?redirect=${encodeURIComponent('/flashcards')}`)
      return
    }
    setSection(next)
    if (next !== 'store') setStoreFolder(null)
    updateUrl(next, libraryTab, next === 'store' ? storeFolder : null)
    scrollToTop()
  }, [isGuest, libraryTab, router, scrollToTop, storeFolder, updateUrl])

  const selectLibraryTab = useCallback((next: LibraryTab) => {
    setLibraryTab(next)
    updateUrl('library', next, null)
  }, [updateUrl])

  const selectStoreFolder = useCallback((folderId: string | null) => {
    setStoreFolder(folderId)
    setSection('store')
    updateUrl('store', libraryTab, folderId)
  }, [libraryTab, updateUrl])

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

  const loadDue = useCallback(async () => {
    try {
      const res = await fetch('/api/flashcards/manual/due', { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      setDueByDeck(json.decks || {})
      setErrorsByDeck(json.errors || {})
      setReviewedToday(typeof json.reviewedToday === 'number' ? json.reviewedToday : 0)
      // Estudou hoje em outro aparelho: o dia conta para a sequência daqui.
      if (json.reviewedToday > 0) registrarDiaDeEstudo()
    } catch {}
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
      // Visitante começa na loja, mas continua podendo abrir a comunidade —
      // inclusive por link direto (`?section=comunidade`). Só a biblioteca,
      // que é pessoal, o manda de volta para a loja.
      const urlSection = typeof window === 'undefined'
        ? 'library'
        : parseUrlState(new URL(window.location.href)).section
      if (urlSection === 'library') {
        setSection('store')
        setLibraryTab('all')
        updateUrl('store', 'all', null)
      }
    }
    setAuthChecked(true)
  }, [bootstrapError, bootstrapIsAdmin, bootstrapLoading, bootstrapUser, updateUrl])

  useEffect(() => {
    syncStateFromUrl()
    window.addEventListener('popstate', syncStateFromUrl)
    return () => window.removeEventListener('popstate', syncStateFromUrl)
  }, [syncStateFromUrl])

  useEffect(() => {
    if (!authChecked) return

    let cancelled = false
    if (isGuest) {
      // Visitante vê loja e comunidade — não deixa os moldes da biblioteca
      // girando à espera de requisições que nunca vão acontecer.
      setLoadingMine(false)
      setLoadingShared(false)
    }
    const loaders = isGuest
      ? [loadStore(), loadCommunity()]
      : [loadMine(), loadFolders(), loadCommunity(), loadStore(), loadShared(), loadDue()]

    Promise.all(loaders).finally(() => {
      if (cancelled) return
      initialLoadDoneRef.current = true
    })

    return () => {
      cancelled = true
    }
  // Hidratação inicial apenas. Os efeitos abaixo atualizam blocos isolados sem apagar a página.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, isGuest])

  useEffect(() => {
    if (!authChecked || isGuest || !initialLoadDoneRef.current) return
    setLoadingMine(true)
    loadMine()
  }, [activeFolder, authChecked, debouncedSearch, isGuest, loadMine])

  useEffect(() => {
    if (!authChecked || !initialLoadDoneRef.current) return
    setLoadingCommunity(true)
    loadCommunity()
  }, [authChecked, communitySort, debouncedSearch, loadCommunity])

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

  // ── Dados derivados ────────────────────────────────────────────────────────

  const query = debouncedSearch.trim().toLowerCase()
  const matchesQuery = useCallback((deck: DeckWithId) => {
    if (!query) return true
    return `${deck.title || ''} ${deck.description || ''}`.toLowerCase().includes(query)
  }, [query])

  const purchasedAll = useMemo(
    () => store.filter(d => d.ownerType === 'admin' && d._hasAccess),
    [store],
  )
  const purchasedDecks = useMemo(() => purchasedAll.filter(matchesQuery), [purchasedAll, matchesQuery])

  const mineIds = useMemo(() => new Set(mine.map(d => d._id)), [mine])

  // "Todos" da biblioteca: criados + adquiridos numa grade só. O usuário pensa
  // "meus flashcards", não "decks que eu criei versus decks que eu comprei".
  const libraryAll = useMemo(() => {
    const seen = new Set<string>()
    const out: DeckWithId[] = []
    for (const deck of [...mine, ...purchasedDecks]) {
      if (seen.has(deck._id)) continue
      seen.add(deck._id)
      out.push(deck)
    }
    return out
  }, [mine, purchasedDecks])

  const pendingShares = useMemo(() => shared.filter(s => s.status === 'pending').length, [shared])

  const storeDecks = useMemo(
    () => store.filter(d => (!storeFolder || d.folderId === storeFolder)).filter(matchesQuery),
    [store, storeFolder, matchesQuery],
  )

  const storeCollections = useMemo(() => flattenFolders(adminFolders), [adminFolders])
  const storeFolderName = storeFolder
    ? adminFolders.find(f => f._id === storeFolder)?.name ?? 'Coleção'
    : null

  const activeFolderName = activeFolder === 'all'
    ? null
    : activeFolder === 'root'
      ? 'Sem pasta'
      : folders.find(f => f._id === activeFolder)?.name ?? 'Pasta'

  // A régua de recortes só existe quando há mais de um tipo de material. Quem
  // só tem decks próprios não precisa escolher entre "todos" e "meus".
  // Conta o acervo inteiro, não o resultado da busca: uma busca sem resultados
  // não pode fazer sumir a régua e prender o usuário num recorte vazio.
  const showLibraryTabs = purchasedAll.length > 0 || shared.length > 0 || libraryTab !== 'all'
  const libraryLoading = loadingMine || (libraryTab !== 'mine' && loadingStore)

  const libraryDecks = libraryTab === 'mine'
    ? mine
    : libraryTab === 'purchased'
      ? purchasedDecks
      : libraryAll

  const sectionItems = useMemo(() => ([
    { value: 'library' as const, label: 'Biblioteca', icon: <BookMarked className="h-3.5 w-3.5" />, dot: pendingShares > 0 },
    { value: 'store' as const, label: 'Loja', icon: <Crown className="h-3.5 w-3.5" /> },
    { value: 'community' as const, label: 'Comunidade', icon: <Globe className="h-3.5 w-3.5" /> },
  ]), [pendingShares])

  return (
    <AppShell allowGuest vidro headerTitle="Flashcards" headerSubtitle={SECTION_SUBTITLE[section]}>
      <FundoIos>
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6">
          {/* Título grande do topo: diz em qual dos três destinos a pessoa
              está, como cada aba de um app do iPhone. */}
          <header className="mb-5 sm:mb-6">
            <h1 className="ios-titulo-grande">
              {section === 'library' ? 'Flashcards' : section === 'store' ? 'Loja de decks' : 'Comunidade'}
            </h1>
            <p className="ios-rotulo-2 mt-1.5 max-w-2xl text-[15px] leading-relaxed sm:text-[17px]">
              {section === 'library'
                ? 'Revise no dia certo, refaça o que errou e veja a memória crescer.'
                : section === 'store'
                  ? 'Decks oficiais da equipe, prontos para estudar com repetição espaçada.'
                  : 'Decks públicos de outros estudantes.'}
            </p>
          </header>

          {/* Âncora fora do elemento grudado: medir a barra depois de fixa
              devolveria sempre a posição travada, nunca a original. */}
          <div ref={topRef} aria-hidden className="h-0" />

          <CommandBar
            sectionItems={sectionItems}
            section={section}
            onSectionChange={selectSection}
            search={search}
            setSearch={setSearch}
            isGuest={isGuest}
            onCreateDeck={() => setCreateOpen(true)}
            onCreateFolder={() => setFolderOpen(true)}
          />

          {/* Sem faixa de "entre para..." aqui: o AppShell já avisa o visitante
              e oferece o login. Repetir o mesmo recado dois blocos acima do
              conteúdo é justamente o excesso que esta tela deixou para trás. */}

          <div className="mt-5 sm:mt-6">
            {/* ── Biblioteca ─────────────────────────────────────────────── */}
            {section === 'library' && !isGuest && (
              <div key="library" className="fc-enter">
                <PainelHoje
                  decks={libraryAll}
                  dueByDeck={dueByDeck}
                  errorsByDeck={errorsByDeck}
                  reviewedToday={reviewedToday}
                  onExplore={() => selectSection('store')}
                />
                {showLibraryTabs && (
                  <FilterRail>
                    <FilterPill active={libraryTab === 'all'} onClick={() => selectLibraryTab('all')}>
                      Todos
                    </FilterPill>
                    <FilterPill active={libraryTab === 'mine'} onClick={() => selectLibraryTab('mine')}>
                      Criados por mim
                    </FilterPill>
                    {(purchasedAll.length > 0 || libraryTab === 'purchased') && (
                      <FilterPill active={libraryTab === 'purchased'} onClick={() => selectLibraryTab('purchased')}>
                        Adquiridos
                      </FilterPill>
                    )}
                    {(shared.length > 0 || libraryTab === 'shared') && (
                      <FilterPill active={libraryTab === 'shared'} onClick={() => selectLibraryTab('shared')} badge={pendingShares || undefined}>
                        Recebidos
                      </FilterPill>
                    )}
                  </FilterRail>
                )}

                {libraryTab === 'shared' ? (
                  <>
                    <SectionHead
                      title="Compartilhados com você"
                      meta={loadingShared ? 'Carregando…' : `${shared.length} ${shared.length === 1 ? 'envio' : 'envios'}`}
                    />
                    {loadingShared
                      ? <DeckGridSkeleton count={2} />
                      : <SharedList shares={shared} onUpdate={loadShared} />}
                  </>
                ) : (
                  <>
                    <SectionHead
                      title={libraryTab === 'purchased' ? 'Adquiridos' : libraryTab === 'mine' ? 'Criados por mim' : 'Minha biblioteca'}
                      meta={
                        libraryLoading
                          ? 'Carregando…'
                          : [
                              `${libraryDecks.length} ${libraryDecks.length === 1 ? 'deck' : 'decks'}`,
                              activeFolderName,
                              query ? `busca: “${debouncedSearch.trim()}”` : null,
                            ].filter(Boolean).join(' · ')
                      }
                      // O seletor de pastas fica encostado no título que ele
                      // modifica, em vez de flutuar sozinho numa faixa própria.
                      action={
                        (libraryTab === 'all' || libraryTab === 'mine') && (folders.length > 0 || libraryAll.length > 0) ? (
                          <FolderPicker
                            label={activeFolderName ?? 'Todas as pastas'}
                            compactLabel={!activeFolderName}
                            active={activeFolder !== 'all'}
                            options={[
                              { id: 'all', label: 'Todas as pastas', depth: 0 },
                              { id: 'root', label: 'Sem pasta', depth: 0 },
                              ...folders.map(f => ({ id: f._id, label: f.name, depth: 0, color: f.color || undefined })),
                            ]}
                            value={activeFolder}
                            onSelect={(id) => setActiveFolder((id as any) || 'all')}
                            onCreate={() => setFolderOpen(true)}
                            createLabel="Nova pasta"
                          />
                        ) : undefined
                      }
                    />
                    {libraryLoading ? (
                      <DeckGridSkeleton />
                    ) : libraryDecks.length === 0 ? (
                      query ? (
                        <EmptyState
                          title="Nada encontrado"
                          hint="Tente outro termo ou limpe a busca."
                          action={<GhostButton onClick={() => setSearch('')}>Limpar busca</GhostButton>}
                        />
                      ) : libraryTab === 'purchased' ? (
                        <EmptyState
                          title="Nenhum deck adquirido"
                          hint="Os decks que você comprar ou liberar na loja aparecem aqui."
                          action={<PrimaryButton onClick={() => selectSection('store')}><Crown className="h-4 w-4" /> Ver a loja</PrimaryButton>}
                        />
                      ) : (
                        <EmptyState
                          title="Sua biblioteca está vazia"
                          hint="Crie um deck do zero, gere com IA ou comece por um deck oficial."
                          action={
                            <>
                              <PrimaryButton onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Criar deck</PrimaryButton>
                              <GhostButton onClick={() => selectSection('store')}>Ver a loja</GhostButton>
                            </>
                          }
                        />
                      )
                    ) : (
                      <DeckGrid
                        decks={libraryDecks}
                        variant="library"
                        editableIds={mineIds}
                        onDelete={deleteDeck}
                        metricSettings={metricSettings.flashcards}
                        dueByDeck={dueByDeck}
                        errorsByDeck={errorsByDeck}
                      />
                    )}

                    {/* Descoberta discreta: uma fileira rolável da loja no pé da
                        biblioteca, no lugar do antigo painel de vitrine que
                        empurrava o conteúdo do usuário para baixo da dobra. */}
                    {libraryTab !== 'purchased' && !query && !loadingStore && store.length > 0 && (
                      <StoreStrip
                        decks={store}
                        onSeeAll={() => selectSection('store')}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Loja ───────────────────────────────────────────────────── */}
            {section === 'store' && (
              <div key="store" className="fc-enter">
                <SectionHead
                  title={storeFolderName ?? 'Loja oficial'}
                  meta={
                    loadingStore
                      ? 'Carregando…'
                      : `${storeDecks.length} ${storeDecks.length === 1 ? 'deck' : 'decks'}${storeFolder ? ' nesta coleção' : ' curados pela equipe'}`
                  }
                  action={
                    storeCollections.length > 0 ? (
                      <FolderPicker
                        label={storeFolderName ?? 'Todas as coleções'}
                        compactLabel={!storeFolder}
                        active={!!storeFolder}
                        options={[
                          { id: 'all', label: 'Todas as coleções', depth: 0 },
                          ...storeCollections,
                        ]}
                        value={storeFolder ?? 'all'}
                        onSelect={(id) => selectStoreFolder(id === 'all' ? null : id)}
                      />
                    ) : undefined
                  }
                />
                {loadingStore ? (
                  <DeckGridSkeleton count={6} />
                ) : storeDecks.length === 0 ? (
                  <EmptyState
                    title={query ? 'Nada encontrado' : 'Nenhum deck por aqui'}
                    hint={query ? 'Tente outro termo ou limpe a busca.' : 'Esta coleção ainda não tem decks publicados.'}
                    action={
                      query
                        ? <GhostButton onClick={() => setSearch('')}>Limpar busca</GhostButton>
                        : storeFolder
                          ? <GhostButton onClick={() => selectStoreFolder(null)}>Ver todas as coleções</GhostButton>
                          : undefined
                    }
                  />
                ) : (
                  <DeckGrid decks={storeDecks} variant="store" metricSettings={metricSettings.flashcards} />
                )}
              </div>
            )}

            {/* ── Comunidade ─────────────────────────────────────────────── */}
            {section === 'community' && (
              <div key="community" className="fc-enter">
                <FilterRail>
                  <FilterPill active={communitySort === 'trending'} onClick={() => setCommunitySort('trending')}>Em alta</FilterPill>
                  <FilterPill active={communitySort === 'new'} onClick={() => setCommunitySort('new')}>Novos</FilterPill>
                  <FilterPill active={communitySort === 'featured'} onClick={() => setCommunitySort('featured')}>Destaques</FilterPill>
                </FilterRail>

                <SectionHead
                  title="Comunidade"
                  meta={loadingCommunity ? 'Carregando…' : `${community.length} ${community.length === 1 ? 'deck público' : 'decks públicos'}`}
                />
                {loadingCommunity ? (
                  <DeckGridSkeleton count={6} />
                ) : community.length === 0 ? (
                  <EmptyState
                    title={query ? 'Nada encontrado' : 'Ainda não há decks públicos'}
                    hint={query ? 'Tente outro termo ou limpe a busca.' : 'Publique um deck seu e ele aparece aqui para todo mundo.'}
                    action={
                      query
                        ? <GhostButton onClick={() => setSearch('')}>Limpar busca</GhostButton>
                        : isGuest
                          ? <PrimaryButton onClick={() => selectSection('library')}>Entrar para criar um deck</PrimaryButton>
                          : <PrimaryButton onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Criar deck</PrimaryButton>
                    }
                  />
                ) : (
                  <DeckGrid decks={community} variant="community" metricSettings={metricSettings.flashcards} />
                )}
              </div>
            )}
          </div>
        </div>
      </FundoIos>

      {createOpen && (
        <CreateDeckDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          isAdmin={isAdmin}
          emailVerified={!!bootstrapUser?.emailVerified}
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
// Barra de comando — onde estou, o que procuro, o que crio
// ──────────────────────────────────────────────────────────────────────────────

function CommandBar({
  sectionItems, section, onSectionChange, search, setSearch, isGuest, onCreateDeck, onCreateFolder,
}: {
  sectionItems: { value: Section; label: string; icon: React.ReactNode; dot?: boolean }[]
  section: Section
  onSectionChange: (s: Section) => void
  search: string
  setSearch: (s: string) => void
  isGuest: boolean
  onCreateDeck: () => void
  onCreateFolder: () => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)

  const searchField = (
    <div className="relative min-w-0 flex-1">
      <Search className="ios-rotulo-2 pointer-events-none absolute left-3 top-1/2 h-[17px] w-[17px] -translate-y-1/2" />
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        enterKeyHint="search"
        placeholder="Buscar decks"
        aria-label="Buscar decks"
        // 16px reais no celular: abaixo disso o iOS dá zoom sozinho ao focar.
        className={cn('ios-busca', search ? 'pr-10' : 'pr-3')}
      />
      {search && (
        <button
          type="button"
          onClick={() => setSearch('')}
          aria-label="Limpar busca"
          className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full"
        >
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--ios-rotulo-3)] text-[var(--ios-chao)]">
            <X className="h-3 w-3" strokeWidth={3} />
          </span>
        </button>
      )}
    </div>
  )

  return (
    <div className="ios-vidro sticky top-[3.75rem] z-30 rounded-[22px] p-2 sm:top-[4.5rem] sm:p-2.5">
      {/* Celular: uma linha só. A busca ocupa o lugar da navegação quando
          aberta — uma segunda faixa permanente comeria tela demais. */}
      <div className="flex items-center gap-1.5 lg:hidden">
        {searchOpen ? (
          <>
            {searchField}
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchOpen(false) }}
              className="ios-tinta h-10 shrink-0 px-2 text-[16px] font-medium"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            {!isGuest && (
              <Segmented items={sectionItems} value={section} onChange={onSectionChange} className="min-w-0 flex-1" />
            )}
            {isGuest && (
              <p className="flex min-w-0 flex-1 items-center gap-1.5 px-2 text-[15px] font-semibold">
                <Crown className="ios-ambar h-4 w-4 shrink-0" /> Loja oficial
              </p>
            )}
            <IconButton label="Buscar decks" active={!!search} onClick={() => setSearchOpen(true)}>
              <Search className="h-[17px] w-[17px]" />
            </IconButton>
            {!isGuest && <CreateMenu onCreateDeck={onCreateDeck} onCreateFolder={onCreateFolder} />}
          </>
        )}
      </div>

      {/* Desktop: navegação, busca e ações lado a lado, sem estados escondidos. */}
      <div className="hidden items-center gap-3 lg:flex">
        {!isGuest && (
          <Segmented items={sectionItems} value={section} onChange={onSectionChange} className="w-[330px] shrink-0 xl:w-[390px]" />
        )}
        {isGuest && (
          <p className="inline-flex shrink-0 items-center gap-2 px-2 text-[15px] font-semibold">
            <Crown className="ios-ambar h-4 w-4" /> Loja oficial
          </p>
        )}
        {searchField}
        {!isGuest && (
          <div className="flex shrink-0 items-center gap-2">
            {/* Entre lg e xl o menu lateral come 288 px: o botão fica só no ícone. */}
            <Link href="/flashcards/ia" className="ios-botao-suave !h-10 !px-3 !text-[15px] xl:!px-4" aria-label="Gerar com IA">
              <Wand2 className="h-4 w-4" /> <span className="hidden xl:inline">Gerar com IA</span>
            </Link>
            <button type="button" onClick={onCreateDeck} className="ios-botao !h-10 !px-4 !text-[15px]">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Criar deck
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateMenu({ onCreateDeck, onCreateFolder }: { onCreateDeck: () => void; onCreateFolder: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Criar" className="ios-botao !h-10 w-10 shrink-0 !p-0">
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
        <DropdownMenuItem onSelect={() => onCreateDeck()} className="gap-2 py-2.5">
          <Plus className="h-4 w-4 text-primary" /> Deck em branco
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2 py-2.5">
          <Link href="/flashcards/ia">
            <Wand2 className="h-4 w-4 text-primary" /> Gerar com IA
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onCreateFolder()} className="gap-2 py-2.5">
          <FolderPlus className="h-4 w-4 text-muted-foreground" /> Nova pasta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Controles
// ──────────────────────────────────────────────────────────────────────────────

/**
 * O controle segmentado do sistema (`.ios-segmentado`): larguras iguais, então
 * a posição do polegar é aritmética (índice × 100%) — nada é medido no layout,
 * e ele desliza da posição atual para a nova em vez de piscar no destino.
 */
function Segmented<T extends string>({ items, value, onChange, className }: {
  items: { value: T; label: string; icon?: React.ReactNode; dot?: boolean }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  const index = Math.max(0, items.findIndex(i => i.value === value))
  return (
    <div
      role="tablist"
      className={cn('ios-segmentado', className)}
      style={{ ['--segmentos' as string]: items.length, ['--indice' as string]: index }}
    >
      {items.map(item => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className="ios-segmento !px-1.5 !text-[13.5px] sm:!text-[14px]"
            style={{ touchAction: 'manipulation' }}
          >
            <span className={cn('hidden shrink-0 sm:inline-flex', active && 'ios-tinta')}>{item.icon}</span>
            <span className="truncate">{item.label}</span>
            {item.dot && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e5484d]" />}
          </button>
        )
      })}
    </div>
  )
}

function IconButton({ children, label, onClick, active }: {
  children: React.ReactNode; label: string; onClick: () => void; active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn('ios-icone-botao relative h-10 w-10', active && 'bg-[var(--ios-tinta-suave)]')}
    >
      {children}
      {active && <span aria-hidden className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--ios-tinta)] ring-2 ring-[var(--ios-chao)]" />}
    </button>
  )
}

/** Uma única faixa de filtros por seção — nunca duas empilhadas. */
function FilterRail({ children }: { children?: React.ReactNode }) {
  return (
    <div className="scrollbar-hide fade-scroll-x -my-1 mb-4 flex gap-1.5 overflow-x-auto overscroll-x-contain py-1 pr-4 lg:pr-0">
      {children}
    </div>
  )
}

function FilterPill({ active, onClick, badge, children }: {
  active: boolean; onClick: () => void; badge?: number; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="ios-pilula"
      style={{ touchAction: 'manipulation' }}
    >
      {children}
      {badge ? (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e5484d] px-1 text-[11px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

interface FolderOption {
  id: string
  label: string
  depth: number
  color?: string
}

function flattenFolders(flat: FolderWithId[]): FolderOption[] {
  const byParent = new Map<string, FolderWithId[]>()
  const ids = new Set(flat.map(f => f._id))
  for (const folder of flat) {
    const parent = folder.parentFolderId && ids.has(folder.parentFolderId) ? folder.parentFolderId : '__root__'
    const list = byParent.get(parent) || []
    list.push(folder)
    byParent.set(parent, list)
  }
  const out: FolderOption[] = []
  const walk = (parent: string, depth: number) => {
    const children = byParent.get(parent) || []
    for (const child of children) {
      out.push({ id: child._id, label: child.name, depth, color: child.color || undefined })
      walk(child._id, depth + 1)
    }
  }
  walk('__root__', 0)
  return out
}

/**
 * Pastas e coleções viram um único ponto de entrada em vez de uma árvore fixa
 * ocupando 270px ao lado da grade (e uma sanfona inteira no celular).
 */
function FolderPicker({ label, options, value, onSelect, onCreate, createLabel, active, compactLabel }: {
  label: string
  options: FolderOption[]
  value: string
  onSelect: (id: string) => void
  onCreate?: () => void
  createLabel?: string
  active?: boolean
  /** Sem filtro aplicado, o rótulo ("Todas as pastas") não informa nada que a
   *  grade ao lado já não diga — no celular ele sai e sobra espaço. */
  compactLabel?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-pressed={active}
          className="ios-pilula !h-9 max-w-[190px] !px-3 !text-[13px] sm:max-w-[260px]"
          style={{ touchAction: 'manipulation' }}
        >
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className={cn('truncate', compactLabel && 'hidden sm:inline')}>{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[60vh] w-64 overflow-y-auto overscroll-contain rounded-2xl">
        {options.map(option => (
          <DropdownMenuItem
            key={option.id}
            onSelect={() => onSelect(option.id)}
            className="gap-2 py-2"
            style={{ paddingLeft: `${8 + option.depth * 14}px` }}
          >
            {option.color
              ? <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
              : <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            <span className="truncate">{option.label}</span>
            {value === option.id && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
        {onCreate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onCreate()} className="gap-2 py-2 text-primary">
              <FolderPlus className="h-3.5 w-3.5" /> {createLabel || 'Nova pasta'}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Blocos de conteúdo
// ──────────────────────────────────────────────────────────────────────────────

function SectionHead({ title, meta, action }: { title: string; meta?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
      <div className="min-w-0">
        <h2 className="ios-titulo-secao">{title}</h2>
        {meta && <p className="ios-rotulo-2 mt-0.5 truncate text-[13px]">{meta}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="ios-botao" style={{ touchAction: 'manipulation' }}>
      {children}
    </button>
  )
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="ios-botao-cinza" style={{ touchAction: 'manipulation' }}>
      {children}
    </button>
  )
}

function EmptyState({ title, hint, action }: { title: string; hint: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center sm:py-20">
      <div className="ios-tinta mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ios-tinta-suave)]">
        <Sparkles className="h-7 w-7" />
      </div>
      <h3 className="text-[20px] font-bold tracking-[-0.02em]">{title}</h3>
      <p className="ios-rotulo-2 mt-1.5 text-[15px] leading-relaxed">{hint}</p>
      {action && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  )
}

function DeckGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ios-cartao rounded-[24px] p-2">
          <div className="ios-esqueleto aspect-[4/3] rounded-[18px] sm:aspect-[16/10]" />
          <div className="space-y-2 px-1.5 pb-1.5 pt-3">
            <div className="ios-esqueleto h-4 w-4/5 rounded-full" />
            <div className="ios-esqueleto h-3 w-3/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

const DeckGrid = memo(function DeckGrid({ decks, variant, editableIds, onDelete, metricSettings, dueByDeck, errorsByDeck }: {
  decks: DeckWithId[]
  variant: 'library' | 'store' | 'community'
  editableIds?: Set<string>
  onDelete?: (id: string) => void
  metricSettings: FlashcardMetricSettings
  dueByDeck?: Record<string, number>
  errorsByDeck?: Record<string, number>
}) {
  // Duas colunas já no celular: com uma só, cada deck ocupava a tela inteira e
  // folhear a biblioteca virava rolagem infinita.
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {decks.map(deck => (
        <DeckCard
          key={deck._id}
          deck={deck}
          variant={variant}
          editable={!!editableIds?.has(deck._id)}
          onDelete={onDelete}
          metricSettings={metricSettings}
          due={dueByDeck?.[deck._id] || 0}
          errors={errorsByDeck?.[deck._id] || 0}
        />
      ))}
    </div>
  )
})

const DeckCard = memo(function DeckCard({ deck, variant, editable, onDelete, metricSettings, due = 0, errors = 0 }: {
  deck: DeckWithId
  variant: 'library' | 'store' | 'community'
  editable?: boolean
  onDelete?: (id: string) => void
  metricSettings: FlashcardMetricSettings
  /** Cards vencidos na repetição espaçada. 0 esconde o selo. */
  due?: number
  /** Cards no caderno de erros (última nota "Difícil"). 0 esconde o selo. */
  errors?: number
}) {
  const owned = !!(deck._isPurchased || deck._hasAccess)

  // Um selo por capa, e só quando ele muda a decisão de quem está escolhendo.
  const badge = variant === 'store'
    ? owned
      ? { claro: false, icon: <Check className="h-3 w-3" strokeWidth={3} />, label: 'Adquirido' }
      : deck.pricing === 'paid'
        ? { claro: false, icon: <Lock className="h-3 w-3" />, label: formatPrice(deck.price) }
        : { claro: false, icon: null, label: 'Grátis' }
    : deck.ownerType === 'admin'
      ? { claro: true, icon: <Crown className="h-3 w-3" />, label: 'Oficial' }
      : null

  const showMetrics = variant === 'community' && (metricSettings.showLikes || metricSettings.showViews)

  return (
    <article className="deck-card-rise group relative h-full">
      <Link
        href={`/flashcards/d/${deck.slug}`}
        className="ios-cartao ios-toque flex h-full flex-col rounded-[24px] p-2"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="ios-capa relative aspect-[4/3] rounded-[18px] sm:aspect-[16/10]">
          {deck.coverImage ? (
            <Image
              src={deck.coverImage}
              alt=""
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="ios-capa-vazia flex h-full w-full items-center justify-center">
              <span className="ios-tinta flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/70 shadow-sm dark:bg-white/10">
                <BookMarked className="h-6 w-6" />
              </span>
            </div>
          )}
          {badge && (
            <span className={cn('ios-selo absolute left-2 top-2 z-[3]', badge.claro && 'ios-selo-claro')}>
              {badge.icon} {badge.label}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-1.5 pb-1 pt-2.5 sm:px-2">
          <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug tracking-[-0.015em] transition-colors group-hover:text-[var(--ios-tinta-texto)] sm:text-[15px]">
            {deck.title}
          </h3>
          <p className="ios-rotulo-2 mt-1 truncate text-[12px] sm:text-[13px]">
            {deck.cardCount ?? 0} {deck.cardCount === 1 ? 'cartão' : 'cartões'}
            {deck.ownerName ? ` · ${deck.ownerName}` : ''}
          </p>
          {/* O deck avisa o que tem para fazer hoje sem precisar ser aberto. */}
          {(due > 0 || errors > 0) && (
            <div className="mt-auto flex flex-wrap gap-1 pt-2">
              {due > 0 && (
                <span className="ios-tinta inline-flex items-center gap-1 rounded-full bg-[var(--ios-tinta-suave)] px-2 py-0.5 text-[11.5px] font-semibold">
                  <CalendarClock className="h-3 w-3" /> {due} hoje
                </span>
              )}
              {errors > 0 && (
                <span className="ios-erro ios-erro-suave inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold">
                  <RotateCcw className="h-3 w-3" /> {errors} {errors === 1 ? 'erro' : 'erros'}
                </span>
              )}
            </div>
          )}
          {showMetrics && (
            <p className="ios-rotulo-2 mt-1 flex items-center gap-3 text-[12px]">
              {metricSettings.showLikes && (
                <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {deck.likeCount || 0}</span>
              )}
              {metricSettings.showViews && (
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {deck.viewCount || 0}</span>
              )}
            </p>
          )}
        </div>
      </Link>

      {editable && (
        // No toque as ações ficam visíveis (não existe hover para revelá-las);
        // com ponteiro, aparecem sob o cursor e a capa fica limpa.
        <div className="fc-owner-actions absolute right-3.5 top-3.5 z-[4] flex items-center gap-1">
          <Link
            href={`/flashcards/d/${deck.slug}/editar`}
            aria-label={`Editar ${deck.title}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#101814] shadow-sm backdrop-blur-md transition active:scale-90 dark:bg-black/55 dark:text-white"
            style={{ touchAction: 'manipulation' }}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Link>
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(deck._id) }}
              aria-label={`Apagar ${deck.title}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#d93d42] shadow-sm backdrop-blur-md transition active:scale-90 dark:bg-black/55 dark:text-[#ff8589]"
              style={{ touchAction: 'manipulation' }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </article>
  )
})

/**
 * O painel "Hoje" da biblioteca — a porta de entrada do hábito.
 *
 * Três perguntas, nesta ordem, cada uma com o próprio botão:
 *  1. quanto já fiz hoje (anel da meta diária + sequência de dias);
 *  2. o que venceu e precisa de revisão agora;
 *  3. o que eu errei e ainda não refiz (caderno de erros).
 * Quando não há nada vencido nem errado, o painel comemora em vez de sumir —
 * é a recompensa de quem está em dia.
 */
function PainelHoje({ decks, dueByDeck, errorsByDeck, reviewedToday, onExplore }: {
  decks: DeckWithId[]
  dueByDeck: Record<string, number>
  errorsByDeck: Record<string, number>
  reviewedToday: number | null
  onExplore: () => void
}) {
  const [meta, setMeta] = useState(20)
  const [sequencia, setSequencia] = useState({ dias: 0, estudouHoje: false })

  useEffect(() => {
    const ler = () => {
      setMeta(lerMetaDiaria())
      setSequencia(lerSequencia())
    }
    ler()
    window.addEventListener(EVENTO_RITMO, ler)
    window.addEventListener('focus', ler)
    return () => {
      window.removeEventListener(EVENTO_RITMO, ler)
      window.removeEventListener('focus', ler)
    }
  }, [])

  const byId = useMemo(() => new Map(decks.map(deck => [deck._id, deck])), [decks])
  const pending = useMemo(
    () => Object.entries(dueByDeck)
      .map(([id, due]) => ({ deck: byId.get(id), due }))
      .filter((item): item is { deck: DeckWithId; due: number } => !!item.deck && item.due > 0)
      .sort((a, b) => b.due - a.due),
    [byId, dueByDeck],
  )
  const wrong = useMemo(
    () => Object.entries(errorsByDeck)
      .map(([id, errors]) => ({ deck: byId.get(id), errors }))
      .filter((item): item is { deck: DeckWithId; errors: number } => !!item.deck && item.errors > 0)
      .sort((a, b) => b.errors - a.errors),
    [byId, errorsByDeck],
  )

  // Sem dados ainda (primeira resposta não chegou) ou sem nada na biblioteca:
  // nada a mostrar — o painel não pode nascer como um esqueleto vazio.
  if (reviewedToday === null || decks.length === 0) return null

  const totalDue = pending.reduce((sum, item) => sum + item.due, 0)
  const totalErrors = wrong.reduce((sum, item) => sum + item.errors, 0)
  const feitos = reviewedToday
  const metaBatida = feitos >= meta
  const emDia = totalDue === 0 && totalErrors === 0

  return (
    <section aria-label="Seu dia nos flashcards" className="ios-lista mb-8">
      {/* ── Meta e sequência ── */}
      <div className="flex items-center gap-4 border-b border-[var(--ios-separador)] p-4">
        <AnelProgresso
          valor={feitos}
          total={meta}
          tamanho={68}
          rotulo={`${feitos} de ${meta} cards revisados hoje`}
        >
          <span className="text-[19px] font-bold leading-none tabular-nums">{Math.min(feitos, 999)}</span>
          <span className="ios-rotulo-3 mt-0.5 text-[10px] font-semibold tabular-nums">/{meta}</span>
        </AnelProgresso>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-bold tracking-[-0.02em]">
            {metaBatida ? 'Meta do dia batida!' : feitos > 0 ? `Faltam ${meta - feitos} para a meta` : 'Bora começar o dia?'}
          </p>
          <p className="ios-rotulo-2 mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px]">
            <span className="inline-flex items-center gap-1 font-semibold text-[var(--ios-rotulo)]">
              <Flame className="ios-chama h-4 w-4" data-acesa={sequencia.estudouHoje ? 'true' : 'false'} />
              {sequencia.dias} {sequencia.dias === 1 ? 'dia' : 'dias'} seguidos
            </span>
            {!sequencia.estudouHoje && sequencia.dias > 0 && <span>· revise 1 card para manter</span>}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ios-pilula !h-8 shrink-0 !px-3 !text-[12px]" aria-label="Mudar a meta diária">
              Meta {meta} <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl">
            {METAS_DIARIAS.map(valor => (
              <DropdownMenuItem key={valor} onSelect={() => salvarMetaDiaria(valor)} className="gap-2 py-2">
                {valor} cards por dia
                {valor === meta && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {emDia ? (
        <div className="ios-linha !gap-3 !py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ios-tinta)] text-white">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">Tudo em dia</span>
            <span className="ios-rotulo-2 block text-[13px]">Nenhuma revisão vencida e nenhum erro esperando.</span>
          </span>
          {!metaBatida && (
            <button type="button" onClick={onExplore} className="ios-botao-suave ios-botao-p shrink-0">
              Estudar algo novo
            </button>
          )}
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <FilaDoDia
              icone={<CalendarClock className="h-[18px] w-[18px]" />}
              tom="tinta"
              titulo={`${totalDue} ${totalDue === 1 ? 'card para revisar' : 'cards para revisar'}`}
              subtitulo={pending.length === 1 ? 'A repetição espaçada marcou para hoje.' : `Em ${pending.length} decks, marcados para hoje.`}
              acao={{ rotulo: 'Revisar', href: `/flashcards/d/${pending[0].deck.slug}` }}
              itens={pending.map(({ deck, due }) => ({ deck, valor: due, href: `/flashcards/d/${deck.slug}` }))}
            />
          )}
          {wrong.length > 0 && (
            <FilaDoDia
              icone={<RotateCcw className="h-[18px] w-[18px]" />}
              tom="erro"
              titulo={`Caderno de erros · ${totalErrors} ${totalErrors === 1 ? 'card' : 'cards'}`}
              subtitulo="O que você travou ou errou. Acertou, sai do caderno."
              acao={{ rotulo: 'Refazer', href: `/flashcards/d/${wrong[0].deck.slug}?erros=1` }}
              itens={wrong.map(({ deck, errors }) => ({ deck, valor: errors, href: `/flashcards/d/${deck.slug}?erros=1` }))}
            />
          )}
        </>
      )}
    </section>
  )
}

/** Uma linha do painel "Hoje": o que é, o botão, e os decks em fileira. */
function FilaDoDia({ icone, tom, titulo, subtitulo, acao, itens }: {
  icone: React.ReactNode
  tom: 'tinta' | 'erro'
  titulo: string
  subtitulo: string
  acao: { rotulo: string; href: string }
  itens: { deck: DeckWithId; valor: number; href: string }[]
}) {
  return (
    <div className="ios-linha !flex-col !items-stretch !gap-2.5 !py-3.5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white',
            tom === 'erro' ? 'bg-[#e5484d]' : 'bg-[var(--ios-tinta)]',
          )}
        >
          {icone}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold tracking-[-0.01em]">{titulo}</span>
          <span className="ios-rotulo-2 block truncate text-[13px]">{subtitulo}</span>
        </span>
        <Link href={acao.href} className={cn(tom === 'erro' ? 'ios-botao-erro' : 'ios-botao', '!h-9 shrink-0 !px-4 !text-[15px]')}>
          {acao.rotulo}
        </Link>
      </div>
      {itens.length > 1 && (
        <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-0.5 pl-[64px]">
          {itens.slice(0, 12).map(({ deck, valor, href }) => (
            <Link
              key={deck._id}
              href={href}
              className="ios-pilula !h-8 shrink-0 !gap-2 !px-3 !text-[13px]"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="max-w-[11rem] truncate">{deck.title}</span>
              <span className={cn('text-[12px] font-bold tabular-nums', tom === 'erro' ? 'ios-erro' : 'ios-tinta')}>{valor}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/** Fileira rolável da loja no pé da biblioteca — descoberta sem vitrine. */
function StoreStrip({ decks, onSeeAll }: { decks: DeckWithId[]; onSeeAll: () => void }) {
  return (
    <section className="mt-12">
      <SectionHead
        title="Da loja oficial"
        meta={`${decks.length} ${decks.length === 1 ? 'deck curado' : 'decks curados'} pela equipe`}
        action={
          <button onClick={onSeeAll} className="ios-tinta inline-flex h-9 items-center gap-0.5 text-[15px] font-semibold" style={{ touchAction: 'manipulation' }}>
            Ver tudo <ChevronRight className="h-4 w-4" />
          </button>
        }
      />
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-px-4 sm:mx-0 sm:px-0">
        {decks.slice(0, 10).map(deck => (
          <Link
            key={deck._id}
            href={`/flashcards/d/${deck.slug}`}
            className="ios-cartao ios-toque group w-[160px] shrink-0 snap-start rounded-[22px] p-1.5 sm:w-[200px]"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="ios-capa relative aspect-[16/10] rounded-[16px]">
              {deck.coverImage ? (
                <Image src={deck.coverImage} alt="" fill className="object-cover" sizes="200px" />
              ) : (
                <div className="ios-capa-vazia flex h-full w-full items-center justify-center">
                  <Crown className="ios-ambar h-6 w-6" />
                </div>
              )}
            </div>
            <div className="px-1.5 pb-1 pt-2">
              <p className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-[-0.01em]">
                {deck.title}
              </p>
              <p className="mt-1 text-[12px] font-semibold">
                {deck._isPurchased || deck._hasAccess
                  ? <span className="ios-tinta">Adquirido</span>
                  : deck.pricing === 'paid'
                    ? <span className="tabular-nums">{formatPrice(deck.price)}</span>
                    : <span className="ios-tinta">Grátis</span>}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function SharedList({ shares, onUpdate }: { shares: any[]; onUpdate: () => void }) {
  async function respond(id: string, status: 'accepted' | 'dismissed') {
    await fetch(`/api/flashcards/manual/shares/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdate()
  }
  if (!shares.length) {
    return <EmptyState title="Nada recebido ainda" hint="Quando alguém compartilhar um deck com você, ele aparece aqui." />
  }
  return (
    <ul className="ios-lista">
      {shares.map(s => (
        <li key={s._id}>
          <div className="ios-linha !flex-col !items-stretch !gap-3 !py-3.5 md:flex-row md:!items-center md:!gap-4">
            <div className="min-w-0 flex-1">
              <p className="ios-rotulo-2 text-[15px] leading-snug">
                <strong className="font-semibold text-[var(--ios-rotulo)]">{s.fromUserName}</strong> compartilhou{' '}
                {/* O próprio título abre o deck: dá para espiar antes de aceitar
                    sem precisar de um terceiro botão na linha. */}
                {s.deck?.slug ? (
                  <Link href={`/flashcards/d/${s.deck.slug}`} className="ios-tinta font-semibold">
                    {s.deck?.title || 'um deck'}
                  </Link>
                ) : (
                  <strong className="font-semibold text-[var(--ios-rotulo)]">{s.deck?.title || 'um deck'}</strong>
                )}
              </p>
              {s.message && <p className="ios-rotulo-2 mt-1 truncate text-[13px] italic">“{s.message}”</p>}
            </div>
            <div className="flex items-center gap-2 md:shrink-0">
              {s.status === 'pending' && (
                <>
                  <button onClick={() => respond(s._id, 'accepted')} className="ios-botao ios-botao-p flex-1 md:flex-none" style={{ touchAction: 'manipulation' }}>
                    Aceitar
                  </button>
                  <button onClick={() => respond(s._id, 'dismissed')} className="ios-botao-cinza ios-botao-p flex-1 md:flex-none" style={{ touchAction: 'manipulation' }}>
                    Dispensar
                  </button>
                </>
              )}
              {s.status !== 'pending' && s.deck?.slug && (
                <Link href={`/flashcards/d/${s.deck.slug}`} className="ios-botao-suave ios-botao-p flex-1 md:flex-none">
                  Abrir <ChevronRight className="-mr-1 h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Criar deck
// ──────────────────────────────────────────────────────────────────────────────

const ADMIN_GROUPS = [
  { id: 'gratuito', label: 'Gratuito' },
  { id: 'trial', label: 'Trial' },
  { id: 'essential', label: 'Plus+' },
  { id: 'premium', label: 'Plus+' },
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

function CreateDeckDialog({ open, onOpenChange, isAdmin, emailVerified, folders, onCreated }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  isAdmin: boolean
  emailVerified: boolean
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
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setTitle(''); setDescription(''); setCoverImage(''); setFolderId(''); setAsAdmin(false)
      setVisibility('private'); setPricing('free'); setPrice('')
      setAllowedGroups([]); setMaterialsFolderId(''); setError(null); setShowAdvanced(false)
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
    if (!title.trim()) { setError('Dê um título ao deck'); return }
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
          visibility,
          allowedGroups: isAdmin && asAdmin ? allowedGroups : undefined,
          materialsFolderId: isAdmin && asAdmin ? materialsFolderId || null : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao criar')
      if (!(isAdmin && asAdmin)) avisarXp('baralho')
      onCreated(json.deck.slug)
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg mx-0 sm:mx-4 !bg-transparent !border-0 !shadow-none !rounded-none !p-0">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 pb-4 pt-5 sm:px-6">
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-foreground sm:text-xl">Novo deck</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Só o essencial agora — os cartões vêm no próximo passo.</p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Fechar"
              className="-mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition active:scale-95 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:max-h-[65vh] sm:px-6">
            <div className="space-y-2.5">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={120}
                autoFocus
                placeholder="Título do deck"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-semibold text-foreground outline-none transition placeholder:font-normal placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                maxLength={400}
                placeholder="Descrição (opcional)"
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15 sm:text-sm"
              />
            </div>

            {folders.length > 0 && (
              <div className="space-y-2">
                <FieldLabel>Pasta</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  <ChoicePill active={folderId === ''} onClick={() => setFolderId('')} icon={<Inbox className="h-3.5 w-3.5" />}>Sem pasta</ChoicePill>
                  {folders.map(f => (
                    <ChoicePill key={f._id} active={folderId === f._id} onClick={() => setFolderId(f._id)} icon={<Folder className="h-3.5 w-3.5" style={{ color: f.color || undefined }} />}>{f.name}</ChoicePill>
                  ))}
                </div>
              </div>
            )}

            {/* O caminho comum aparece primeiro; capa e ajustes de publicação
                ficam um nível abaixo, para quem realmente precisa deles. */}
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              aria-expanded={showAdvanced}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
              Capa e publicação
            </button>

            {showAdvanced && (
              <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-3.5">
                <div>
                  <FieldLabel>Capa</FieldLabel>
                  <input
                    value={coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                    inputMode="url"
                    placeholder="URL da imagem"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 sm:text-sm"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Recomendado: 1280 × 720 px</p>
                </div>

                <div className="space-y-2">
                  <FieldLabel>Visibilidade</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    <ChoicePill active={visibility === 'private'} onClick={() => setVisibility('private')} icon={<Lock className="h-3.5 w-3.5" />}>Privado</ChoicePill>
                    <ChoicePill active={visibility === 'unlisted'} onClick={() => setVisibility('unlisted')} icon={<Eye className="h-3.5 w-3.5" />}>Não-listado</ChoicePill>
                    <ChoicePill active={visibility === 'public'} onClick={() => setVisibility('public')} icon={<Globe className="h-3.5 w-3.5" />}>Público</ChoicePill>
                  </div>
                  {visibility === 'public' && (
                    <p className="text-[11px] text-muted-foreground">Aparece na Comunidade assim que o deck é criado.</p>
                  )}
                  {visibility !== 'private' && !emailVerified && !isAdmin && (
                    <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      Verifique seu e-mail para publicar o deck.
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <>
                    <div className="space-y-2">
                      <FieldLabel>Tipo</FieldLabel>
                      <div className="flex flex-wrap gap-1.5">
                        <ChoicePill active={!asAdmin} onClick={() => setAsAdmin(false)} icon={<Inbox className="h-3.5 w-3.5" />}>Pessoal</ChoicePill>
                        <ChoicePill active={asAdmin} onClick={() => setAsAdmin(true)} icon={<Crown className="h-3.5 w-3.5" />}>Oficial</ChoicePill>
                      </div>
                    </div>

                    {asAdmin && (
                      <div className="space-y-4 rounded-xl border border-accent/30 bg-accent/[0.07] p-3.5">
                        <div className="space-y-2">
                          <FieldLabel accent>Monetização</FieldLabel>
                          <div className="flex flex-wrap gap-1.5">
                            <ChoicePill active={pricing === 'free'} onClick={() => setPricing('free')} icon={<Globe className="h-3.5 w-3.5" />}>Gratuito</ChoicePill>
                            <ChoicePill active={pricing === 'paid'} onClick={() => setPricing('paid')} icon={<ShoppingCart className="h-3.5 w-3.5" />}>Pago</ChoicePill>
                          </div>
                          {pricing === 'paid' && (
                            <div className="relative mt-2">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">R$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="0,00"
                                className="w-full rounded-xl border border-border bg-background py-2.5 pl-11 pr-4 text-base font-bold text-foreground outline-none transition focus:border-accent"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <FieldLabel accent>Grupos com acesso</FieldLabel>
                          <p className="text-[11px] text-muted-foreground">Vazio = acesso aberto.</p>
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

                        <div className="space-y-2">
                          <FieldLabel accent>Pasta em /materiais</FieldLabel>
                          <select
                            value={materialsFolderId}
                            onChange={e => setMaterialsFolderId(e.target.value)}
                            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none transition focus:border-accent sm:h-10 sm:text-sm"
                          >
                            <option value="">Raiz (sem pasta)</option>
                            {materiaisPaths.map(f => (
                              <option key={f._id} value={f._id}>{f.path}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-4 py-3 sm:px-6">
            <button
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl px-4 text-sm font-medium text-muted-foreground transition active:scale-[0.98] hover:bg-muted hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={busy || !title.trim()}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition active:scale-[0.98] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              style={{ touchAction: 'manipulation' }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar e editar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FieldLabel({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider',
      accent ? 'text-accent-foreground/70' : 'text-muted-foreground',
    )}>
      {children}
    </span>
  )
}

function ChoicePill({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition active:scale-[0.97]',
        active
          ? 'border-primary/40 bg-primary/10 font-semibold text-primary'
          : 'border-border bg-background text-muted-foreground hover:text-foreground',
      )}
      style={{ touchAction: 'manipulation' }}
    >
      {icon} {children}
    </button>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Criar pasta
// ──────────────────────────────────────────────────────────────────────────────

function CreateFolderDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#468152')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const palette = ['#468152', '#E2A43E', '#CE5929', '#0F8B5F', '#0ea5e9', '#6366f1', '#d946ef', '#f43f5e']

  async function submit() {
    if (!name.trim()) { setError('Dê um nome à pasta'); return }
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
      <DialogContent className="max-w-md mx-0 sm:mx-4 !bg-transparent !border-0 !shadow-none !rounded-none !p-0">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-start justify-between border-b border-border px-4 pb-4 pt-5 sm:px-6">
            <div>
              <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-foreground">Nova pasta</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Para agrupar seus decks.</p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Fechar"
              className="-mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition active:scale-95 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 p-4 sm:p-6">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Patologia"
              maxLength={50}
              autoFocus
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15 sm:text-sm"
            />
            <div>
              <FieldLabel>Cor</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {palette.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c, touchAction: 'manipulation' }}
                    className={cn(
                      'relative h-9 w-9 rounded-xl transition',
                      color === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : 'hover:scale-105',
                    )}
                    aria-label={`Cor ${c}`}
                  >
                    {color === c && <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" strokeWidth={3} />}
                  </button>
                ))}
                <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border transition hover:border-primary/50">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-0 w-0 opacity-0" aria-label="Cor personalizada" />
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </label>
              </div>
            </div>
            {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</div>}
          </div>
          <div className="flex justify-end gap-2 border-t border-border bg-muted/30 px-4 py-3 sm:px-6">
            <button
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl px-4 text-sm font-medium text-muted-foreground transition active:scale-[0.98] hover:bg-muted hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={busy || !name.trim()}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition active:scale-[0.98] hover:bg-primary/90 disabled:opacity-50 sm:flex-none"
              style={{ touchAction: 'manipulation' }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />} Criar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
