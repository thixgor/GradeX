'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Crown,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Edit3,
  Trash2,
  Sparkles,
  Search,
  CheckCircle2,
  Star,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToastAlert } from '@/components/ui/toast-alert'
import { cn } from '@/lib/utils'
import type { FlashcardManualDeck } from '@/lib/types'

type DeckRow = FlashcardManualDeck & { _id: string }

export default function AdminFlashcardsManualPage() {
  const [decks, setDecks] = useState<DeckRow[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'admin' | 'paid' | 'public'>('all')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ open: false, message: '' })

  async function load() {
    setLoading(true)
    try {
      const url = new URL('/api/flashcards/manual', window.location.origin)
      url.searchParams.set('scope', 'all-admin')
      if (search) url.searchParams.set('q', search)
      const res = await fetch(url.toString())
      const json = await res.json()
      setDecks(json.decks || [])
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro', type: 'error' })
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search])

  const filtered = useMemo(() => {
    return decks.filter(d => {
      if (filter === 'admin') return d.ownerType === 'admin'
      if (filter === 'paid') return d.pricing === 'paid'
      if (filter === 'public') return d.visibility === 'public'
      return true
    })
  }, [decks, filter])

  async function toggleHidden(deck: DeckRow) {
    await fetch(`/api/flashcards/manual/${deck._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHidden: !deck.isHidden }),
    })
    load()
  }
  async function toggleFeatured(deck: DeckRow) {
    await fetch(`/api/flashcards/manual/${deck._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFeatured: !deck.isFeatured }),
    })
    load()
  }
  async function deleteDeck(deck: DeckRow) {
    if (!confirm(`Apagar "${deck.title}" e todos os cartões?`)) return
    await fetch(`/api/flashcards/manual/${deck._id}`, { method: 'DELETE' })
    load()
  }

  const counts = useMemo(() => ({
    total: decks.length,
    admin: decks.filter(d => d.ownerType === 'admin').length,
    paid: decks.filter(d => d.pricing === 'paid').length,
    public: decks.filter(d => d.visibility === 'public').length,
  }), [decks])

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-white mb-1"><ArrowLeft className="h-3 w-3" /> Admin</Link>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Flashcards manuais</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gestão de decks oficiais, comerciais e da comunidade. Decks pagos ficam vinculados a /materiais.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/flashcards"><Button variant="outline">Ir para /flashcards</Button></Link>
            <Link href="/flashcards?create=1"><Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"><Plus className="h-4 w-4" /> Novo deck oficial</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Stat label="Total" value={counts.total} icon={<Sparkles className="h-4 w-4" />} active={filter === 'all'} onClick={() => setFilter('all')} />
          <Stat label="Oficiais" value={counts.admin} icon={<Crown className="h-4 w-4" />} active={filter === 'admin'} onClick={() => setFilter('admin')} />
          <Stat label="Pagos" value={counts.paid} icon={<Lock className="h-4 w-4" />} active={filter === 'paid'} onClick={() => setFilter('paid')} />
          <Stat label="Públicos" value={counts.public} icon={<Globe className="h-4 w-4" />} active={filter === 'public'} onClick={() => setFilter('public')} />
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/15 p-12 text-center text-slate-500">
            Nenhum deck encontrado.
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Deck</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Owner</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Visibilidade</th>
                  <th className="text-left px-4 py-3">Pricing</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Cards</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d._id} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/flashcards/d/${d.slug}`} className="font-medium hover:text-violet-600 truncate max-w-[40ch] inline-block">{d.title}</Link>
                        {d.ownerType === 'admin' && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                        {d.isFeatured && <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />}
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-[60ch]">/{d.slug}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs">{d.ownerName}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <VisibilityChip visibility={d.visibility} hidden={d.isHidden} />
                    </td>
                    <td className="px-4 py-3">
                      {d.pricing === 'paid' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] px-2 py-0.5 font-medium">
                          <Lock className="h-3 w-3" /> R$ {(d.price || 0).toFixed(2)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] px-2 py-0.5 font-medium">Grátis</span>
                      )}
                      {d.linkedMaterialId && <span className="ml-1 text-[10px] text-violet-500">→ /materiais</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">{d.cardCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => toggleFeatured(d)} title="Destacar" className={cn('rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-white/5', d.isFeatured && 'text-amber-500')}>
                          <Star className={cn('h-3.5 w-3.5', d.isFeatured && 'fill-current')} />
                        </button>
                        <button onClick={() => toggleHidden(d)} title={d.isHidden ? 'Mostrar' : 'Esconder'} className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-white/5">
                          {d.isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <Link href={`/flashcards/d/${d.slug}/editar`} className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-white/5">
                          <Edit3 className="h-3.5 w-3.5" />
                        </Link>
                        <button onClick={() => deleteDeck(d)} className="rounded-full p-1.5 hover:bg-rose-500/10 text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={(open) => setToast(t => ({ ...t, open }))} />
    </AppShell>
  )
}

function Stat({ label, value, icon, active, onClick }: { label: string; value: number; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-3xl border p-4 text-left transition',
        active
          ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200'
          : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-violet-400'
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{icon} {label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </button>
  )
}

function VisibilityChip({ visibility, hidden }: { visibility: string; hidden: boolean }) {
  if (hidden) return <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300 text-[11px] px-2 py-0.5"><EyeOff className="h-3 w-3" /> Escondido</span>
  if (visibility === 'public') return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] px-2 py-0.5"><Globe className="h-3 w-3" /> Público</span>
  if (visibility === 'unlisted') return <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[11px] px-2 py-0.5">Não-listado</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-500 dark:bg-white/5 text-[11px] px-2 py-0.5"><Lock className="h-3 w-3" /> Privado</span>
}
