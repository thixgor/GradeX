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
  Trash2,
  Edit3,
  ShoppingCart,
  Wand2,
  Inbox,
  Loader2,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { cn } from '@/lib/utils'
import type { FlashcardManualDeck, FlashcardManualFolder } from '@/lib/types'

type DeckWithId = FlashcardManualDeck & { _id: string; _isPurchased?: boolean; _hasAccess?: boolean; _hasGroupAccess?: boolean }
type FolderWithId = FlashcardManualFolder & { _id: string }

type Tab = 'mine' | 'community' | 'store' | 'shared'

export default function FlashcardsHubPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('mine')
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
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })
  const [isAdmin, setIsAdmin] = useState(false)
  const [communitySort, setCommunitySort] = useState<'trending' | 'new' | 'featured'>('trending')

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
      const res = await fetch('/api/flashcards/manual/store')
      const json = await res.json()
      setStore(json.decks || [])
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
    Promise.all([
      loadMine(),
      loadFolders(),
      loadCommunity(),
      loadStore(),
      loadShared(),
    ]).finally(() => setLoading(false))
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

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Flashcards</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Crie, estude e compartilhe decks. Comunidade pública, loja oficial e suas pastas.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/flashcards/ia">
              <Button variant="outline" className="gap-1"><Wand2 className="h-4 w-4" /> Flashcards de IA</Button>
            </Link>
            <Button onClick={() => setCreateOpen(true)} className="gap-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
              <Plus className="h-4 w-4" /> Novo deck
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-2 mb-5 inline-flex flex-wrap gap-1">
          <TabButton active={tab === 'mine'} onClick={() => setTab('mine')} icon={<Inbox className="h-4 w-4" />} label="Meus decks" />
          <TabButton active={tab === 'community'} onClick={() => setTab('community')} icon={<Globe className="h-4 w-4" />} label="Comunidade" />
          <TabButton active={tab === 'store'} onClick={() => setTab('store')} icon={<ShoppingBag className="h-4 w-4" />} label="Loja oficial" />
          <TabButton active={tab === 'shared'} onClick={() => setTab('shared')} icon={<Users className="h-4 w-4" />} label="Compartilhados" />
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título, descrição, tags..."
              className="pl-9"
            />
          </div>
          {tab === 'community' && (
            <div className="flex gap-2">
              {(['trending', 'new', 'featured'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setCommunitySort(opt)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium border transition',
                    communitySort === opt ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 dark:border-white/10 text-slate-500'
                  )}
                >
                  {opt === 'trending' ? 'Em alta' : opt === 'new' ? 'Novos' : 'Destaques'}
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === 'mine' && (
          <div className="grid lg:grid-cols-[240px,1fr] gap-5">
            <aside className="space-y-2">
              <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pastas</span>
                  <button onClick={() => setFolderOpen(true)} className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-white/5"><FolderPlus className="h-4 w-4" /></button>
                </div>
                <ul className="mt-1 space-y-0.5">
                  <FolderItem
                    label="Todos"
                    count={mine.length}
                    active={activeFolder === 'all'}
                    onClick={() => setActiveFolder('all')}
                    icon={<Inbox className="h-4 w-4" />}
                  />
                  <FolderItem
                    label="Sem pasta"
                    active={activeFolder === 'root'}
                    onClick={() => setActiveFolder('root')}
                    icon={<Folder className="h-4 w-4" />}
                  />
                  {folders.map(f => (
                    <FolderItem
                      key={f._id}
                      label={f.name}
                      active={activeFolder === f._id}
                      onClick={() => setActiveFolder(f._id)}
                      icon={<Folder className="h-4 w-4" style={{ color: f.color || undefined }} />}
                    />
                  ))}
                </ul>
              </div>
            </aside>

            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
              ) : mine.length === 0 ? (
                <EmptyState
                  title="Você ainda não tem decks"
                  hint="Crie um deck do zero ou importe cartões."
                  action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Criar deck</Button>}
                />
              ) : (
                <DeckGrid decks={mine} owned onDelete={deleteDeck} />
              )}
            </div>
          </div>
        )}

        {tab === 'community' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : community.length === 0 ? (
              <EmptyState title="A comunidade está silenciosa" hint="Seja o primeiro a publicar um deck público." />
            ) : (
              <DeckGrid decks={community} />
            )}
          </div>
        )}

        {tab === 'store' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : store.length === 0 ? (
              <EmptyState title="Nenhum deck oficial disponível" hint="A equipe ainda não publicou decks." />
            ) : (
              <DeckGrid decks={store} showStoreState />
            )}
          </div>
        )}

        {tab === 'shared' && (
          <SharedTab shares={shared} onUpdate={() => loadShared()} />
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

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition',
        active
          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
      )}
    >
      {icon} {label}
    </button>
  )
}

function FolderItem({ label, count, active, onClick, icon }: { label: string; count?: number; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center justify-between gap-2 rounded-xl px-2 py-2 text-sm transition',
          active ? 'bg-violet-500/10 text-violet-700 dark:text-violet-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
        )}
      >
        <span className="inline-flex items-center gap-2 min-w-0 truncate">{icon} <span className="truncate">{label}</span></span>
        {typeof count === 'number' && <span className="text-xs text-slate-400">{count}</span>}
      </button>
    </li>
  )
}

function DeckGrid({ decks, owned = false, onDelete, showStoreState = false }: { decks: DeckWithId[]; owned?: boolean; onDelete?: (id: string) => void; showStoreState?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map(d => <DeckCard key={d._id} deck={d} owned={owned} onDelete={onDelete} showStoreState={showStoreState} />)}
    </div>
  )
}

function DeckCard({ deck, owned, onDelete, showStoreState }: { deck: DeckWithId; owned?: boolean; onDelete?: (id: string) => void; showStoreState?: boolean }) {
  return (
    <div className="group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-violet-400 dark:hover:border-violet-400/60 transition">
      <Link href={`/flashcards/d/${deck.slug}`} className="block">
        <div className="relative aspect-[16/9] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500">
          {deck.coverImage && <Image src={deck.coverImage} alt="" fill className="object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {deck.ownerType === 'admin' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5"><Crown className="h-3 w-3" /> Oficial</span>}
            {deck.pricing === 'paid' && (
              showStoreState && deck._isPurchased ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5">Adquirido</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/90 text-white text-[10px] font-bold px-2 py-0.5"><Lock className="h-3 w-3" /> R$ {deck.price?.toFixed(2)}</span>
              )
            )}
            {deck.visibility === 'public' && !owned && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/80 text-white text-[10px] font-medium px-2 py-0.5"><Globe className="h-3 w-3" /> Público</span>}
          </div>
          <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[11px] text-white/85 bg-black/30 rounded-full px-2 py-0.5"><Sparkles className="h-3 w-3" /> {deck.cardCount}</div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-slate-800 dark:text-white line-clamp-2">{deck.title}</h3>
          {deck.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{deck.description}</p>}
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {deck.likeCount || 0}</span>
            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {deck.viewCount || 0}</span>
            <span className="ml-auto text-slate-400 truncate max-w-[60%]">por {deck.ownerName}</span>
          </div>
        </div>
      </Link>
      {owned && (
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-white via-white/95 dark:from-slate-900 dark:via-slate-900/95 to-transparent">
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

function EmptyState({ title, hint, action }: { title: string; hint: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/15 p-12 text-center">
      <Sparkles className="h-10 w-10 mx-auto text-slate-400 mb-3" />
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

function SharedTab({ shares, onUpdate }: { shares: any[]; onUpdate: () => void }) {
  async function respond(id: string, status: 'accepted' | 'dismissed') {
    await fetch(`/api/flashcards/manual/shares/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdate()
  }
  if (!shares.length) return <EmptyState title="Nenhum deck compartilhado com você" hint="Quando alguém compartilhar um deck, ele aparece aqui." />
  return (
    <ul className="space-y-3">
      {shares.map(s => (
        <li key={s._id} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <strong>{s.fromUserName}</strong> compartilhou <strong>{s.deck?.title || 'um deck'}</strong> com você.
            </p>
            {s.message && <p className="mt-1 text-xs text-slate-500 italic">"{s.message}"</p>}
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">Status: {s.status}</p>
          </div>
          <div className="flex items-center gap-2">
            {s.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => respond(s._id, 'accepted')}>Aceitar</Button>
                <Button size="sm" variant="ghost" onClick={() => respond(s._id, 'dismissed')}>Dispensar</Button>
              </>
            )}
            {s.deck?.slug && (
              <Link href={`/flashcards/d/${s.deck.slug}`}>
                <Button size="sm" variant="outline">Abrir <ChevronRight className="h-3.5 w-3.5" /></Button>
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
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
  const [folderId, setFolderId] = useState<string>('')
  const [asAdmin, setAsAdmin] = useState(false)
  const [pricing, setPricing] = useState<'free' | 'paid'>('free')
  const [price, setPrice] = useState('0')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          folderId: folderId || null,
          asAdmin: isAdmin && asAdmin,
          pricing: isAdmin && asAdmin ? pricing : 'free',
          price: pricing === 'paid' ? Number(price) || 0 : 0,
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo deck</DialogTitle>
          <DialogDescription>Defina o básico — você poderá adicionar cartões e ajustar privacidade depois.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} className="mt-1" autoFocus />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={400} className="mt-1" />
          </div>
          <div>
            <Label>Pasta (opcional)</Label>
            <select value={folderId} onChange={e => setFolderId(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
              <option value="">Sem pasta</option>
              {folders.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </div>
          {isAdmin && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-3 space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <input type="checkbox" checked={asAdmin} onChange={e => setAsAdmin(e.target.checked)} /> Criar como deck oficial (admin)
              </label>
              {asAdmin && (
                <>
                  <select value={pricing} onChange={e => setPricing(e.target.value as any)} className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm">
                    <option value="free">Gratuito</option>
                    <option value="paid">Pago (vinculado a /materiais)</option>
                  </select>
                  {pricing === 'paid' && (
                    <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Preço (R$)" />
                  )}
                </>
              )}
            </div>
          )}
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar e editar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateFolderDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#8b5cf6')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova pasta</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nome da pasta" value={name} onChange={e => setName(e.target.value)} maxLength={50} autoFocus />
          <div>
            <Label className="text-xs">Cor</Label>
            <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-20" />
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />} Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
