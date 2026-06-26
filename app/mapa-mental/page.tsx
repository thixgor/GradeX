'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Globe, EyeOff, Link2, Lock, Heart, Eye, Trash2, Loader2,
  GitBranch, ShieldCheck, Users, Sparkles, ArrowRight, X, Network,
  LayoutTemplate, ChevronRight,
} from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { ToastAlert } from '@/components/ui/toast-alert'
import { cn } from '@/lib/utils'
import type { MindMapVisibility } from '@/lib/types'
import { MINDMAP_TEMPLATES, buildNodes, type MindMapTemplate } from '@/lib/mindmap-templates'

type Tab = 'mine' | 'community' | 'all-admin'

interface MapItem {
  _id: string
  slug: string
  title: string
  description?: string
  tags?: string[]
  visibility: MindMapVisibility
  hasPassword?: boolean
  isPublished?: boolean
  isHidden?: boolean
  likeCount: number
  viewCount: number
  nodeCount: number
  ownerName: string
  updatedAt: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}

function MindMapHome() {
  const router = useRouter()
  const { isAdmin } = useAppShell()
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const scope = new URLSearchParams(window.location.search).get('scope')
      if (scope === 'all-admin' || scope === 'community' || scope === 'mine') return scope as Tab
    }
    return 'mine'
  })
  const [maps, setMaps] = useState<MapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 350)
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' | 'info' } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<MapItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = `/api/mindmaps?scope=${tab}${debounced ? `&q=${encodeURIComponent(debounced)}` : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setMaps(data.maps || [])
      else setMaps([])
    } catch {
      setMaps([])
    } finally {
      setLoading(false)
    }
  }, [tab, debounced])

  useEffect(() => { load() }, [load])

  // Guarda: não-admin não pode ficar na aba de administração.
  useEffect(() => { if (tab === 'all-admin' && !isAdmin) setTab('mine') }, [tab, isAdmin])

  const createFromTemplate = useCallback(async (template?: MindMapTemplate) => {
    setCreating(true)
    setShowTemplates(false)
    try {
      const body: any = template && template.id !== 'blank'
        ? { title: template.name, nodes: buildNodes(template.spec), style: template.style }
        : { title: 'Novo mapa mental', style: template?.style }
      const res = await fetch('/api/mindmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ msg: data.error || 'Erro ao criar', type: 'error' }); return }
      router.push(`/mapa-mental/${data.map.slug || data.map._id}`)
    } catch {
      setToast({ msg: 'Erro ao criar mapa', type: 'error' })
    } finally {
      setCreating(false)
    }
  }, [router])

  const openTemplates = useCallback(() => setShowTemplates(true), [])

  const doDelete = useCallback(async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/mindmaps/${confirmDelete._id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setToast({ msg: d.error || 'Erro ao excluir', type: 'error' }); return }
      setMaps(prev => prev.filter(m => m._id !== confirmDelete._id))
      setToast({ msg: 'Mapa excluído', type: 'success' })
      setConfirmDelete(null)
    } catch {
      setToast({ msg: 'Erro ao excluir', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }, [confirmDelete])

  const tabs: { key: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { key: 'mine', label: 'Meus mapas', icon: <GitBranch className="h-4 w-4" /> },
    { key: 'community', label: 'Comunidade', icon: <Users className="h-4 w-4" /> },
    { key: 'all-admin', label: 'Todos (Admin)', icon: <ShieldCheck className="h-4 w-4" />, adminOnly: true },
  ]
  const visibleTabs = tabs.filter(t => !t.adminOnly || isAdmin)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-emerald-900/40 to-emerald-950 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Editor premium
            </div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl">
              <Network className="h-7 w-7 text-emerald-400" /> Mapas Mentais
            </h1>
            <p className="mt-1 max-w-xl text-sm text-emerald-100/80">
              Organize ideias com um editor visual rápido. Crie, conecte e compartilhe seus mapas — públicos, com link ou protegidos por senha.
            </p>
          </div>
          <Button onClick={openTemplates} disabled={creating} className="h-11 shrink-0 gap-2 bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
            Novo mapa
          </Button>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {visibleTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn('inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
                tab === t.key ? 'bg-emerald-500 text-emerald-950' : 'bg-muted text-muted-foreground hover:bg-muted/70')}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'all-admin' ? 'Buscar por título ou autor...' : 'Buscar mapas...'}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {tab === 'all-admin' && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Modo administrador: você vê e gerencia <strong>todos</strong> os mapas, inclusive privados e protegidos por senha. Ao abrir um mapa com senha, o acesso é liberado automaticamente.</span>
        </div>
      )}

      {/* Modelos prontos */}
      {tab === 'mine' && (
        <TemplatesStrip onPick={createFromTemplate} onSeeAll={openTemplates} disabled={creating} />
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
      ) : maps.length === 0 ? (
        <EmptyState tab={tab} onCreate={openTemplates} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {maps.map(m => (
            <MapCard
              key={m._id}
              map={m}
              showOwner={tab !== 'mine'}
              isAdmin={isAdmin}
              tab={tab}
              onOpen={() => router.push(`/mapa-mental/${m.slug || m._id}`)}
              onDelete={() => setConfirmDelete(m)}
            />
          ))}
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-500">
              <Trash2 className="h-6 w-6" />
            </div>
            <h2 className="text-center text-lg font-bold">Excluir mapa?</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {isAdmin && confirmDelete.ownerName ? <>“{confirmDelete.title}” de <strong>{confirmDelete.ownerName}</strong> será removido permanentemente.</> : <>“{confirmDelete.title}” será removido permanentemente.</>}
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleting} className="flex-1">Cancelar</Button>
              <Button onClick={doDelete} disabled={deleting} className="flex-1 gap-2 bg-red-500 text-white hover:bg-red-600">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Galeria de templates */}
      {showTemplates && (
        <TemplatesModal onClose={() => setShowTemplates(false)} onPick={createFromTemplate} creating={creating} />
      )}

      <ToastAlert open={!!toast} onOpenChange={(o) => !o && setToast(null)} message={toast?.msg || ''} type={toast?.type || 'info'} />
    </div>
  )
}

function VisibilityChip({ visibility }: { visibility: MindMapVisibility }) {
  const cfg = {
    private: { icon: <EyeOff className="h-3 w-3" />, label: 'Privado', cls: 'bg-muted text-muted-foreground' },
    public: { icon: <Globe className="h-3 w-3" />, label: 'Público', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    unlisted: { icon: <Link2 className="h-3 w-3" />, label: 'Não listado', cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
    password: { icon: <Lock className="h-3 w-3" />, label: 'Com senha', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  }[visibility]
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.cls)}>{cfg.icon} {cfg.label}</span>
}

function MapCard({ map, showOwner, isAdmin, tab, onOpen, onDelete }: {
  map: MapItem; showOwner: boolean; isAdmin: boolean; tab: Tab; onOpen: () => void; onDelete: () => void
}) {
  const canDelete = tab === 'mine' || (tab === 'all-admin' && isAdmin)
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-emerald-500/40 hover:shadow-lg">
      <button onClick={onOpen} className="flex flex-1 flex-col p-4 text-left">
        <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-950 to-emerald-900/50">
          <GitBranch className="h-8 w-8 text-emerald-400/70" />
        </div>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <VisibilityChip visibility={map.visibility} />
          {map.isHidden && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-500">Oculto</span>}
        </div>
        <h3 className="line-clamp-1 font-semibold">{map.title}</h3>
        {map.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{map.description}</p>}
        {showOwner && <p className="mt-2 text-xs text-muted-foreground">por <span className="font-medium text-foreground">{map.ownerName}</span></p>}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Network className="h-3.5 w-3.5" /> {map.nodeCount}</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {map.viewCount}</span>
          <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {map.likeCount}</span>
        </div>
      </button>
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <button onClick={onOpen} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          Abrir <ArrowRight className="h-3.5 w-3.5" />
        </button>
        {canDelete && (
          <button onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500" title="Excluir">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function TemplatesStrip({ onPick, onSeeAll, disabled }: { onPick: (t: MindMapTemplate) => void; onSeeAll: () => void; disabled?: boolean }) {
  const featured = MINDMAP_TEMPLATES.slice(0, 6)
  return (
    <div className="mb-6">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <LayoutTemplate className="h-4 w-4 text-emerald-500" /> Modelos prontos
        </h2>
        <button onClick={onSeeAll} className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          Ver todos <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {featured.map(t => (
          <button
            key={t.id}
            onClick={() => onPick(t)}
            disabled={disabled}
            className="group flex w-40 shrink-0 flex-col rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-emerald-500/40 hover:shadow-md disabled:opacity-50"
          >
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">{t.emoji}</span>
            <span className="line-clamp-1 text-sm font-semibold">{t.name}</span>
            <span className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function TemplatesModal({ onClose, onPick, creating }: { onClose: () => void; onPick: (t: MindMapTemplate) => void; creating: boolean }) {
  const categories = Array.from(new Set(MINDMAP_TEMPLATES.map(t => t.category)))
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={() => !creating && onClose()}>
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold"><LayoutTemplate className="h-5 w-5 text-emerald-500" /> Escolha um modelo</h2>
            <p className="text-xs text-muted-foreground">Comece com uma estrutura pronta ou do zero. Você pode personalizar tudo depois.</p>
          </div>
          <button onClick={onClose} disabled={creating} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50"><X className="h-5 w-5" /></button>
        </div>
        <div className="relative flex-1 overflow-y-auto px-5 py-5">
          {creating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/70 backdrop-blur-sm">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
            </div>
          )}
          {categories.map(cat => (
            <div key={cat} className="mb-6 last:mb-0">
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{cat}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {MINDMAP_TEMPLATES.filter(t => t.category === cat).map(t => (
                  <button
                    key={t.id}
                    onClick={() => onPick(t)}
                    disabled={creating}
                    className="group flex flex-col rounded-2xl border border-border bg-background p-4 text-left transition-all hover:border-emerald-500/50 hover:shadow-md disabled:opacity-50"
                  >
                    <span className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">{t.emoji}</span>
                    <span className="font-semibold">{t.name}</span>
                    <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ tab, onCreate }: { tab: Tab; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
        <Network className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold">
        {tab === 'mine' ? 'Você ainda não criou mapas' : tab === 'community' ? 'Nenhum mapa público ainda' : 'Nenhum mapa encontrado'}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {tab === 'mine' ? 'Comece criando seu primeiro mapa mental e dê vida às suas ideias.' : tab === 'community' ? 'Quando usuários publicarem mapas, eles aparecerão aqui.' : 'Ajuste a busca para encontrar mapas.'}
      </p>
      {tab === 'mine' && (
        <Button onClick={onCreate} className="mt-5 gap-2 bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
          <Plus className="h-4 w-4" /> Criar meu primeiro mapa
        </Button>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <AppShell headerTitle="Mapas Mentais" headerSubtitle="Editor visual e comunidade">
      <MindMapHome />
    </AppShell>
  )
}
