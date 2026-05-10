'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { cn } from '@/lib/utils'
import type { FlashcardManualDeck, FlashcardManualFolder } from '@/lib/types'

type DeckWithId = FlashcardManualDeck & {
  _id: string
  _isPurchased?: boolean
  _hasAccess?: boolean
  _hasGroupAccess?: boolean
}
type FolderWithId = FlashcardManualFolder & { _id: string }
type Filter = 'all' | 'mine' | 'community' | 'store' | 'shared'

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
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const [foldersOpen, setFoldersOpen] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })
  const [isAdmin, setIsAdmin] = useState(false)
  const [communitySort, setCommunitySort] = useState<'trending' | 'new' | 'featured'>('trending')
  const [adminFolders, setAdminFolders] = useState<FolderWithId[]>([])
  const [storeFolder, setStoreFolder] = useState<string | null>(null)

  const loadMine = useCallback(async () => {
    try {
      const folderId = activeFolder === 'all' ? '' : activeFolder === 'root' ? 'null' : activeFolder
      const url = new URL('/api/flashcards/manual', window.location.origin)
      if (folderId) url.searchParams.set('folderId', folderId)
      if (search) url.searchParams.set('q', search)
      const res = await fetch(url.toString())
      const json = await res.json()
      setMine(json.decks || [])
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro ao carregar decks', type: 'error' })
    }
  }, [activeFolder, search])

  const loadFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/flashcards/manual/folders')
      const json = await res.json()
      setFolders(json.folders || [])
    } catch {}
  }, [])

  const loadCommunity = useCallback(async () => {
    try {
      const url = new URL('/api/flashcards/manual/community', window.location.origin)
      if (search) url.searchParams.set('q', search)
      url.searchParams.set('sort', communitySort)
      const res = await fetch(url.toString())
      const json = await res.json()
      setCommunity(json.decks || [])
    } catch {}
  }, [search, communitySort])

  const loadStore = useCallback(async () => {
    try {
      const [storeRes, foldersRes] = await Promise.all([
        fetch('/api/flashcards/manual/store'),
        fetch('/api/flashcards/manual/folders?scope=admin'),
      ])
      const [storeJson, foldersJson] = await Promise.all([storeRes.json(), foldersRes.json()])
      setStore(storeJson.decks || [])
      setAdminFolders(foldersJson.folders || [])
    } catch {}
  }, [])

  const loadShared = useCallback(async () => {
    try {
      const res = await fetch('/api/flashcards/manual/shares?direction=incoming')
      const json = await res.json()
      setShared(json.shares || [])
    } catch {}
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch('/api/auth/me').then(r => r.json())
        setIsAdmin(me.user?.role === 'admin')
      } catch {}
    })()
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadMine(), loadFolders(), loadCommunity(), loadStore(), loadShared()]).finally(() => setLoading(false))
  }, [loadMine, loadFolders, loadCommunity, loadStore, loadShared])

  async function deleteDeck(id: string) {
    if (!confirm('Apagar este deck e todos os cartões?')) return
    try {
      const res = await fetch(`/api/flashcards/manual/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao apagar')
      setMine(m => m.filter(d => d._id !== id))
      setToast({ open: true, message: 'Deck apagado', type: 'success' })
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro', type: 'error' })
    }
  }

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

  // Árvore de pastas admin
  const adminFolderTree = useMemo(() => buildFolderTree(adminFolders), [adminFolders])

  const counts = {
    all: mine.length + community.length + store.length + shared.length,
    mine: mine.length,
    community: community.length,
    store: store.length,
    shared: shared.length,
  }

  const showSection = (key: Filter) => filter === 'all' || filter === key

  return (
    <AppShell>
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[560px] w-[560px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-300 shadow-sm">
              <Sparkles className="h-3 w-3" /> Flashcards manuais · novo
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-violet-700 to-fuchsia-600 dark:from-white dark:via-violet-200 dark:to-fuchsia-300 bg-clip-text text-transparent">
              Flashcards
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">
              Crie decks do seu jeito, estude com a comunidade e acelere com os{' '}
              <strong className="text-amber-600 dark:text-amber-300">decks oficiais</strong> dos especialistas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/flashcards/ia">
              <button className="inline-flex items-center gap-2 rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-white hover:bg-white/90 dark:hover:bg-white/10 transition shadow-sm">
                <Wand2 className="h-4 w-4 text-violet-500" /> Flashcards de IA
              </button>
            </Link>
            <button
              onClick={() => setCreateOpen(true)}
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-fuchsia-500/30 hover:scale-[1.02] transition"
            >
              <Plus className="h-4 w-4" /> Novo deck
              <ArrowRight className="h-4 w-4 -ml-1 opacity-0 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
          </div>
        </header>

        {/* Loja oficial — Hero (oculto se filter=='store' para não duplicar) */}
        {filter !== 'store' && featuredStore.length > 0 && (
          <StoreHero
            decks={featuredStore}
            totalStore={store.length}
            onSeeAll={() => setFilter('store')}
          />
        )}

        {/* Toolbar */}
        <Toolbar
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          counts={counts}
          foldersOpen={foldersOpen}
          setFoldersOpen={setFoldersOpen}
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

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-12">
            {showSection('mine') && (
              <Section
                title="Meus decks"
                subtitle={mine.length === 0 ? 'Você ainda não criou nenhum deck.' : `${mine.length} ${mine.length === 1 ? 'deck' : 'decks'}`}
                icon={<Inbox className="h-5 w-5" />}
                accent="from-violet-500 to-fuchsia-500"
                action={mine.length > 6 && filter === 'all' ? <SectionLink onClick={() => setFilter('mine')}>Ver todos</SectionLink> : undefined}
              >
                {mine.length === 0 ? (
                  <EmptyCallout
                    title="Comece criando seu primeiro deck"
                    hint="Você pode escrever cartões do zero, importar JSON/CSV ou colocar imagens nas duas faces."
                    cta={
                      <button
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-fuchsia-500/30 transition"
                      >
                        <Plus className="h-4 w-4" /> Criar deck
                      </button>
                    }
                  />
                ) : (
                  <DeckGrid decks={filter === 'mine' ? mine : mine.slice(0, 6)} owned onDelete={deleteDeck} />
                )}
              </Section>
            )}

            {filter === 'store' && (
              <div className={cn(adminFolderTree.length > 0 && 'grid lg:grid-cols-[240px,1fr] gap-6 items-start')}>
                {/* Sidebar de pastas */}
                {adminFolderTree.length > 0 && (
                  <StoreFolderNav
                    tree={adminFolderTree}
                    selected={storeFolder}
                    store={store}
                    onSelect={setStoreFolder}
                  />
                )}

                {/* Grid de decks */}
                <Section
                  title={storeFolder ? (adminFolders.find(f => f._id === storeFolder)?.name ?? 'Loja oficial') : 'Loja oficial · todos os decks'}
                  subtitle={`${filteredStore.length} ${filteredStore.length === 1 ? 'deck' : 'decks'}${storeFolder ? ' nesta pasta' : ' curados pela equipe'}`}
                  icon={<Crown className="h-5 w-5" />}
                  accent="from-amber-500 to-orange-500"
                  action={storeFolder ? (
                    <button onClick={() => setStoreFolder(null)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-white transition">
                      <X className="h-3.5 w-3.5" /> Ver todos
                    </button>
                  ) : undefined}
                >
                  {filteredStore.length === 0 ? (
                    <EmptyCallout title="Nenhum deck nesta pasta" hint="O administrador ainda não adicionou decks aqui." />
                  ) : (
                    <DeckGrid decks={filteredStore} showStoreState />
                  )}
                </Section>
              </div>
            )}

            {showSection('community') && (
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
                          'rounded-full px-3 py-1 text-[11px] font-semibold border backdrop-blur-md transition',
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
                action={community.length > 6 && filter === 'all' ? <SectionLink onClick={() => setFilter('community')}>Ver todos</SectionLink> : undefined}
              >
                {community.length === 0 ? (
                  <EmptyCallout title="A comunidade está silenciosa" hint="Seja o primeiro a publicar um deck público." />
                ) : (
                  <DeckGrid decks={filter === 'community' ? community : community.slice(0, 6)} />
                )}
              </Section>
            )}

            {showSection('shared') && (
              <Section
                title="Compartilhados com você"
                subtitle={shared.length === 0 ? 'Quando alguém te enviar um deck, ele aparece aqui.' : `${shared.length} ${shared.length === 1 ? 'compartilhamento' : 'compartilhamentos'}`}
                icon={<Users className="h-5 w-5" />}
                accent="from-sky-500 to-cyan-500"
              >
                <SharedList shares={shared} onUpdate={() => loadShared()} />
              </Section>
            )}
          </div>
        )}
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

function StoreFolderNav({ tree, selected, store, onSelect }: {
  tree: FolderTreeNode[]
  selected: string | null
  store: DeckWithId[]
  onSelect: (id: string | null) => void
}) {
  return (
    <aside className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl shadow-sm sticky top-4 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/40 dark:border-white/10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Navegar por pasta</p>
      </div>
      <div className="p-2 space-y-0.5">
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
            store={store}
            onSelect={onSelect}
            depth={0}
          />
        ))}
      </div>
    </aside>
  )
}

function FolderNavNode({ node, selected, store, onSelect, depth }: {
  node: FolderTreeNode
  selected: string | null
  store: DeckWithId[]
  onSelect: (id: string | null) => void
  depth: number
}) {
  const [expanded, setExpanded] = useState(true)
  const count = store.filter(d => d.folderId === node._id).length
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
            <FolderNavNode key={child._id} node={child} selected={selected} store={store} onSelect={onSelect} depth={depth + 1} />
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
    <div className="flex items-center min-w-0 overflow-hidden" style={{ paddingLeft: `${depth * 14}px` }}>
      {hasChildren && (
        <button onClick={onToggle} className="shrink-0 h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition">
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      )}
      {!hasChildren && <span className="shrink-0 w-5" />}
      <button
        onClick={onClick}
        className={cn(
          'flex-1 min-w-0 flex items-center justify-between gap-2 rounded-2xl px-2.5 py-2 text-sm text-left transition overflow-hidden',
          active
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-200 font-semibold'
            : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10'
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {color
            ? <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            : <Folder className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          }
          <span className="truncate">{label}</span>
        </span>
        {count > 0 && (
          <span className={cn('text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0', active ? 'bg-amber-500/20 text-amber-700 dark:text-amber-200' : 'bg-slate-100 dark:bg-white/10 text-slate-500')}>
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

function StoreHero({ decks, totalStore, onSeeAll }: { decks: DeckWithId[]; totalStore: number; onSeeAll: () => void }) {
  const [hero, ...rest] = decks
  if (!hero) return null
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/40 dark:border-white/10 bg-gradient-to-br from-amber-50/70 via-white/50 to-fuchsia-50/70 dark:from-amber-950/20 dark:via-slate-900/40 dark:to-fuchsia-950/20 backdrop-blur-2xl shadow-xl">
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-amber-400/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-rose-400/15 blur-3xl" />
      </div>

      <div className="relative grid lg:grid-cols-[1.15fr,1fr] gap-5 p-5 lg:p-7">
        {/* Featured deck */}
        <Link href={`/flashcards/d/${hero.slug}`} className="group relative block overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-slate-900 shadow-2xl">
          <div className="relative aspect-[16/10]">
            {hero.coverImage ? (
              <Image src={hero.coverImage} alt="" fill className="object-cover group-hover:scale-105 transition duration-700" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-amber-950 shadow-lg">
              <Crown className="h-3 w-3" /> Loja oficial
            </div>
            {hero.isFeatured && (
              <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/30 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white">
                <Star className="h-3 w-3 fill-current text-amber-300" /> Destaque
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-7">
              <div className="flex items-center gap-3 mb-2 text-[11px] font-medium text-white/75">
                <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> {hero.cardCount} cartões</span>
                {hero.likeCount && hero.likeCount > 0 ? (
                  <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {hero.likeCount}</span>
                ) : null}
                {hero.viewCount ? (
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md px-3 py-1.5 text-sm font-semibold text-white group-hover:bg-white/25 transition">
                  Estudar agora <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Sidebar */}
        <div className="flex flex-col gap-3.5">
          <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/75 dark:bg-white/5 backdrop-blur-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Loja oficial · {totalStore} {totalStore === 1 ? 'deck' : 'decks'}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Decks dos especialistas</h3>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Material curado pela equipe DomineAqui. Comprou uma vez, estuda para sempre.
            </p>
            <button
              onClick={onSeeAll}
              className="mt-4 group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 hover:shadow-rose-500/40 hover:scale-[1.02] transition"
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
      className="group relative overflow-hidden rounded-2xl border border-white/40 dark:border-white/10 bg-white/75 dark:bg-white/5 backdrop-blur-xl shadow hover:shadow-xl hover:scale-[1.02] hover:border-amber-300/50 transition"
    >
      <div className="relative aspect-[16/10]">
        {deck.coverImage ? (
          <Image src={deck.coverImage} alt="" fill className="object-cover group-hover:scale-110 transition duration-500" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500" />
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

function Toolbar({ search, setSearch, filter, setFilter, counts, foldersOpen, setFoldersOpen }: {
  search: string
  setSearch: (s: string) => void
  filter: Filter
  setFilter: (f: Filter) => void
  counts: { all: number; mine: number; community: number; store: number; shared: number }
  foldersOpen: boolean
  setFoldersOpen: (cb: (v: boolean) => boolean) => void
}) {
  return (
    <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-3 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar decks por título, descrição, tags..."
            className="w-full rounded-2xl bg-white/80 dark:bg-white/5 border border-white/40 dark:border-white/10 pl-11 pr-4 py-2.5 text-sm placeholder:text-slate-400 outline-none focus:border-violet-400 focus:bg-white dark:focus:bg-white/10 transition"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mb-0.5">
          <ChipFilter active={filter === 'all'} onClick={() => setFilter('all')} count={counts.all} icon={<Layers className="h-3.5 w-3.5" />}>Tudo</ChipFilter>
          <ChipFilter active={filter === 'mine'} onClick={() => setFilter('mine')} count={counts.mine} icon={<Inbox className="h-3.5 w-3.5" />}>Meus</ChipFilter>
          <ChipFilter active={filter === 'store'} onClick={() => setFilter('store')} count={counts.store} icon={<Crown className="h-3.5 w-3.5" />} accent="amber">Loja</ChipFilter>
          <ChipFilter active={filter === 'community'} onClick={() => setFilter('community')} count={counts.community} icon={<Globe className="h-3.5 w-3.5" />}>Comunidade</ChipFilter>
          <ChipFilter active={filter === 'shared'} onClick={() => setFilter('shared')} count={counts.shared} icon={<Users className="h-3.5 w-3.5" />}>Recebidos</ChipFilter>
          {(filter === 'mine' || filter === 'all') && (
            <button
              onClick={() => setFoldersOpen((v: boolean) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold transition border whitespace-nowrap',
                foldersOpen
                  ? 'bg-violet-500/15 border-violet-400/40 text-violet-700 dark:text-violet-200 shadow-sm'
                  : 'bg-white/70 dark:bg-white/5 border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10'
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
  active: boolean; onClick: () => void; count: number; icon: React.ReactNode; accent?: 'violet' | 'amber'; children: React.ReactNode
}) {
  const activeClasses = accent === 'amber'
    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/30'
    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-transparent shadow-lg shadow-violet-500/30'
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold transition border whitespace-nowrap',
        active
          ? activeClasses
          : 'bg-white/70 dark:bg-white/5 border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10'
      )}
    >
      {icon} {children}
      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500')}>{count}</span>
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
    <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2">Pastas</span>
        <FolderPill active={activeFolder === 'all'} onClick={() => setActiveFolder('all')} icon={<Inbox className="h-3.5 w-3.5" />}>Todos · {mineCount}</FolderPill>
        <FolderPill active={activeFolder === 'root'} onClick={() => setActiveFolder('root')} icon={<Folder className="h-3.5 w-3.5" />}>Sem pasta</FolderPill>
        {folders.map(f => (
          <FolderPill key={f._id} active={activeFolder === f._id} onClick={() => setActiveFolder(f._id)} icon={<Folder className="h-3.5 w-3.5" style={{ color: f.color || undefined }} />}>{f.name}</FolderPill>
        ))}
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-violet-400/50 bg-violet-500/5 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-300 hover:bg-violet-500/10 transition"
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
        'inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-medium transition border',
        active
          ? 'bg-violet-500/15 border-violet-400/40 text-violet-700 dark:text-violet-200 shadow-sm'
          : 'bg-white/70 dark:bg-white/5 border-white/30 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10'
      )}
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
    <section>
      <header className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br', accent)}>{icon}</div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
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
      className="inline-flex items-center gap-1 rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-300 hover:bg-violet-500/10 hover:border-violet-400/50 transition"
    >
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </button>
  )
}

function EmptyCallout({ title, hint, cta }: { title: string; hint: string; cta?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md p-10 text-center">
      <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
        <Sparkles className="h-6 w-6 text-violet-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{hint}</p>
      {cta && <div className="mt-4 flex justify-center">{cta}</div>}
    </div>
  )
}

function DeckGrid({ decks, owned = false, onDelete, showStoreState = false }: {
  decks: DeckWithId[]; owned?: boolean; onDelete?: (id: string) => void; showStoreState?: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map(d => <DeckCard key={d._id} deck={d} owned={owned} onDelete={onDelete} showStoreState={showStoreState} />)}
    </div>
  )
}

function DeckCard({ deck, owned, onDelete, showStoreState }: {
  deck: DeckWithId; owned?: boolean; onDelete?: (id: string) => void; showStoreState?: boolean
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl shadow-sm hover:shadow-2xl hover:shadow-violet-500/10 hover:scale-[1.01] hover:border-violet-400/50 transition duration-300">
      <Link href={`/flashcards/d/${deck.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden">
          {deck.coverImage ? (
            <Image src={deck.coverImage} alt="" fill className="object-cover group-hover:scale-110 transition duration-700" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {deck.ownerType === 'admin' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 backdrop-blur-md text-amber-950 text-[10px] font-bold px-2 py-0.5 shadow"><Crown className="h-3 w-3" /> Oficial</span>
            )}
            {deck.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/30 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold px-2 py-0.5 shadow"><Star className="h-3 w-3 fill-current" /> Destaque</span>
            )}
          </div>
          <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end">
            {deck.pricing === 'paid' && (
              showStoreState && deck._isPurchased ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/95 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 shadow"><Check className="h-3 w-3" /> Adquirido</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/95 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 shadow"><Lock className="h-3 w-3" /> R$ {deck.price?.toFixed(2)}</span>
              )
            )}
            {deck.pricing !== 'paid' && deck.visibility === 'public' && !owned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/85 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5"><Globe className="h-3 w-3" /> Público</span>
            )}
          </div>
          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[11px] text-white font-semibold bg-black/40 backdrop-blur-md rounded-full px-2 py-0.5">
            <Sparkles className="h-3 w-3" /> {deck.cardCount}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-slate-800 dark:text-white line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition">{deck.title}</h3>
          {deck.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{deck.description}</p>}
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {deck.likeCount || 0}</span>
            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {deck.viewCount || 0}</span>
            <span className="ml-auto text-slate-400 truncate max-w-[60%]">por {deck.ownerName}</span>
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
}

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
        <li key={s._id} className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <strong className="text-slate-800 dark:text-white">{s.fromUserName}</strong>
              <span className="text-slate-500"> compartilhou </span>
              <strong className="text-slate-800 dark:text-white">{s.deck?.title || 'um deck'}</strong>
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
                  className="inline-flex items-center gap-1 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:shadow-lg transition"
                >
                  Aceitar
                </button>
                <button
                  onClick={() => respond(s._id, 'dismissed')}
                  className="inline-flex items-center gap-1 rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition"
                >
                  Dispensar
                </button>
              </>
            )}
            {s.deck?.slug && (
              <Link href={`/flashcards/d/${s.deck.slug}`}>
                <button className="inline-flex items-center gap-1 rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-white hover:bg-white/90 dark:hover:bg-white/10 transition">
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
        <div className="relative overflow-hidden rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl shadow-2xl">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
          </div>

          {/* Header */}
          <div className="relative px-7 pt-6 pb-5 border-b border-white/40 dark:border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/10 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                  <Sparkles className="h-3 w-3" /> Novo deck
                </div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white leading-tight">Vamos criar seu deck</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Defina o básico — você poderá editar tudo e adicionar cartões depois.</p>
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
                  placeholder="Título do deck — ex: Anatomia Cardiovascular"
                  className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md px-4 py-3 text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-violet-400 focus:bg-white dark:focus:bg-white/10 transition"
                />
                <div className="mt-1 text-[10px] text-slate-400 text-right">{title.length}/120</div>
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                maxLength={400}
                placeholder="Descrição (opcional) — sobre o que é este deck"
                className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-violet-400 focus:bg-white dark:focus:bg-white/10 transition resize-none"
              />
              <div>
                <input
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  placeholder="URL da capa (opcional)"
                  className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-violet-400 focus:bg-white dark:focus:bg-white/10 transition"
                />
                <p className="mt-1 text-[10px] text-slate-400">Recomendado: 1280 × 720 px · proporção 16:9</p>
              </div>
            </div>

            {/* Pasta do usuário */}
            {folders.length > 0 && (
              <div className="space-y-2">
                <FieldLabel icon={<Folder className="h-3.5 w-3.5" />}>Organização — pasta</FieldLabel>
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
                  <div className="space-y-4 rounded-2xl border border-amber-300/40 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 backdrop-blur-md p-4">
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
                              className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md pl-12 pr-4 py-3 text-base font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400 transition"
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
                        className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-400 transition"
                      >
                        <option value="">— Raiz (sem pasta) —</option>
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
              <div className="rounded-2xl border border-rose-300/50 bg-rose-50/70 dark:bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}
          </div>

          <div className="relative px-7 py-4 border-t border-white/40 dark:border-white/10 flex items-center justify-between gap-3 bg-white/40 dark:bg-white/5 backdrop-blur-md">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Você poderá adicionar cartões em seguida.</p>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 transition"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={busy || !title.trim()}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-fuchsia-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition"
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
  const color = accent === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-violet-600 dark:text-violet-400'
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
        'inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-medium transition border',
        active
          ? 'bg-violet-500/15 border-violet-400/40 text-violet-700 dark:text-violet-200 shadow-sm'
          : 'bg-white/70 dark:bg-white/5 border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10'
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
    violet: 'border-violet-400/60 bg-violet-500/10 text-violet-700 dark:text-violet-200',
    amber: 'border-amber-400/60 bg-amber-500/10 text-amber-700 dark:text-amber-200',
    emerald: 'border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
    rose: 'border-rose-400/60 bg-rose-500/10 text-rose-700 dark:text-rose-200',
  } as const
  const iconBg = {
    violet: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
    amber: 'bg-gradient-to-br from-amber-500 to-orange-500',
    emerald: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    rose: 'bg-gradient-to-br from-rose-500 to-pink-500',
  } as const
  const checkBg = {
    violet: 'bg-violet-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
  } as const
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border-2 p-4 text-left transition backdrop-blur-md',
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
        <div className="relative overflow-hidden rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl shadow-2xl">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
          </div>
          <div className="relative px-6 pt-6 pb-3 border-b border-white/40 dark:border-white/10 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nova pasta</h2>
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
                className="mt-1 w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-violet-400 transition"
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
                      'h-9 w-9 rounded-2xl shadow transition border-2 relative',
                      color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                    )}
                    aria-label={`Cor ${c}`}
                  >
                    {color === c && <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" strokeWidth={3} />}
                  </button>
                ))}
                <label className="h-9 w-9 rounded-2xl border-2 border-dashed border-white/40 dark:border-white/15 cursor-pointer flex items-center justify-center hover:border-violet-400 transition">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="opacity-0 w-0 h-0" aria-label="Cor personalizada" />
                  <span className="text-[10px] font-bold text-slate-500">+</span>
                </label>
              </div>
            </div>
            {error && <div className="rounded-2xl border border-rose-300/50 bg-rose-50/70 dark:bg-rose-500/10 px-4 py-2 text-xs text-rose-600 dark:text-rose-300">{error}</div>}
          </div>
          <div className="relative px-6 py-4 border-t border-white/40 dark:border-white/10 flex justify-end gap-2 bg-white/40 dark:bg-white/5">
            <button onClick={() => onOpenChange(false)} className="rounded-2xl px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 transition">Cancelar</button>
            <button
              onClick={submit}
              disabled={busy || !name.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-fuchsia-500/30 disabled:opacity-50 transition"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />} Criar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
