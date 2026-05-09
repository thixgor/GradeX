'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Edit3,
  Trash2,
  Plus,
  Loader2,
  Check,
  X,
  GripVertical,
  BookOpen,
  Layers,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { ToastAlert } from '@/components/ui/toast-alert'
import { cn } from '@/lib/utils'

interface FolderNode {
  _id: string
  name: string
  color?: string
  parentFolderId?: string | null
  order: number
  children: FolderNode[]
  deckCount?: number
}

interface DeckRow {
  _id: string
  title: string
  folderId?: string | null
  slug: string
}

export default function AdminFoldersPastaPage() {
  const [folders, setFolders] = useState<FolderNode[]>([])
  const [decks, setDecks] = useState<DeckRow[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' }>({ open: false, message: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [fRes, dRes] = await Promise.all([
        fetch('/api/flashcards/manual/folders?scope=admin'),
        fetch('/api/flashcards/manual?scope=all-admin'),
      ])
      const [fJson, dJson] = await Promise.all([fRes.json(), dRes.json()])
      const flat: any[] = fJson.folders || []
      const allDecks: DeckRow[] = (dJson.decks || []).filter((d: any) => d.ownerType === 'admin')
      setDecks(allDecks)

      // Contar decks por pasta
      const deckCountMap = new Map<string, number>()
      for (const d of allDecks) {
        if (d.folderId) {
          deckCountMap.set(d.folderId, (deckCountMap.get(d.folderId) || 0) + 1)
        }
      }

      // Construir árvore
      const tree = buildTree(flat, deckCountMap)
      setFolders(tree)
    } catch {
      setToast({ open: true, message: 'Erro ao carregar pastas', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function createFolder(name: string, color: string, parentFolderId: string | null) {
    const res = await fetch('/api/flashcards/manual/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color, parentFolderId, ownerType: 'admin' }),
    })
    const json = await res.json()
    if (!res.ok) { setToast({ open: true, message: json.error || 'Erro ao criar pasta', type: 'error' }); return }
    setToast({ open: true, message: 'Pasta criada', type: 'success' })
    load()
  }

  async function renameFolder(id: string, name: string, color: string) {
    const res = await fetch(`/api/flashcards/manual/folders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    if (!res.ok) { setToast({ open: true, message: 'Erro ao renomear pasta', type: 'error' }); return }
    load()
  }

  async function deleteFolder(id: string) {
    if (!confirm('Apagar esta pasta e todas as subpastas? Os decks dentro serão movidos para a raiz.')) return
    const res = await fetch(`/api/flashcards/manual/folders/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { setToast({ open: true, message: json.error || 'Erro ao apagar', type: 'error' }); return }
    setToast({ open: true, message: `Pasta apagada (${json.deletedCount} pasta${json.deletedCount > 1 ? 's' : ''} removida${json.deletedCount > 1 ? 's' : ''})`, type: 'success' })
    load()
  }

  async function moveFolder(id: string, parentFolderId: string | null) {
    await fetch(`/api/flashcards/manual/folders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentFolderId }),
    })
    load()
  }

  async function assignDeck(deckId: string, folderId: string | null) {
    await fetch(`/api/flashcards/manual/${deckId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    })
    load()
  }

  const flatFolders = flattenTree(folders)

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <Link href="/admin/flashcards/manual" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-white mb-1">
              <ArrowLeft className="h-3 w-3" /> Flashcards manuais
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Pastas oficiais</h1>
            <p className="mt-1 text-sm text-slate-500">Organize os decks oficiais em hierarquias. Exemplo: 1º Período → SOI I → Sistema Cardiovascular</p>
          </div>
          <CreateFolderInline parentId={null} parentName={null} onCreate={createFolder} />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
        ) : (
          <div className="grid lg:grid-cols-[1fr,400px] gap-6">
            {/* Árvore de pastas */}
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Layers className="h-3.5 w-3.5" /> Estrutura de pastas
              </div>
              {folders.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">
                  Nenhuma pasta criada. Crie a primeira usando o botão acima.
                </div>
              ) : (
                <div className="p-3">
                  {folders.map(f => (
                    <FolderTreeRow
                      key={f._id}
                      node={f}
                      depth={0}
                      allFolders={flatFolders}
                      onCreate={createFolder}
                      onRename={renameFolder}
                      onDelete={deleteFolder}
                      onMove={moveFolder}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Decks sem pasta / atribuição */}
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <BookOpen className="h-3.5 w-3.5" /> Decks oficiais — atribuir pasta
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[70vh] overflow-y-auto">
                {decks.length === 0 ? (
                  <p className="p-6 text-sm text-slate-400 text-center">Nenhum deck oficial.</p>
                ) : decks.map(d => (
                  <div key={d._id} className="flex items-center gap-3 px-4 py-3">
                    <BookOpen className="h-4 w-4 text-violet-400 shrink-0" />
                    <span className="flex-1 text-sm truncate" title={d.title}>{d.title}</span>
                    <select
                      value={d.folderId || ''}
                      onChange={e => assignDeck(d._id, e.target.value || null)}
                      className="text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5 max-w-[160px] truncate"
                    >
                      <option value="">— sem pasta —</option>
                      {flatFolders.map(f => (
                        <option key={f._id} value={f._id}>{f.pathLabel}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={open => setToast(t => ({ ...t, open }))} />
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tree row
// ─────────────────────────────────────────────────────────────────────────────

function FolderTreeRow({ node, depth, allFolders, onCreate, onRename, onDelete, onMove }: {
  node: FolderNode
  depth: number
  allFolders: FlatFolder[]
  onCreate: (name: string, color: string, parentId: string | null) => void
  onRename: (id: string, name: string, color: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, parentId: string | null) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(node.name)
  const [editColor, setEditColor] = useState(node.color || '#8b5cf6')
  const [addingChild, setAddingChild] = useState(false)
  const hasChildren = node.children.length > 0
  const indent = depth * 20

  function saveEdit() {
    if (editName.trim()) onRename(node._id, editName.trim(), editColor)
    setEditing(false)
  }

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-2xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-white/5 transition"
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className={cn('shrink-0 h-5 w-5 rounded-lg flex items-center justify-center text-slate-400 transition', hasChildren ? 'hover:bg-slate-200 dark:hover:bg-white/10' : 'opacity-0 pointer-events-none')}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {/* Folder icon */}
        {expanded && hasChildren
          ? <FolderOpen className="h-4 w-4 shrink-0" style={{ color: node.color || '#8b5cf6' }} />
          : <Folder className="h-4 w-4 shrink-0" style={{ color: node.color || '#8b5cf6' }} />
        }

        {/* Name / edit */}
        {editing ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
              autoFocus
              className="flex-1 min-w-0 rounded-xl border border-violet-400 bg-white dark:bg-slate-800 px-2 py-0.5 text-sm outline-none"
            />
            <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="h-6 w-6 rounded cursor-pointer border-0" />
            <button onClick={saveEdit} className="rounded-lg p-0.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={() => setEditing(false)} className="rounded-lg p-0.5 hover:bg-slate-100 dark:hover:bg-white/10 transition"><X className="h-3.5 w-3.5 text-slate-400" /></button>
          </div>
        ) : (
          <span className="flex-1 text-sm font-medium text-slate-800 dark:text-white truncate">{node.name}</span>
        )}

        {/* Deck count badge */}
        {(node.deckCount || 0) > 0 && (
          <span className="shrink-0 text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-300 rounded-full px-2 py-0.5">
            {node.deckCount}
          </span>
        )}

        {/* Actions (appear on hover) */}
        {!editing && (
          <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => setAddingChild(v => !v)}
              title="Adicionar subpasta"
              className="rounded-lg p-1.5 hover:bg-violet-500/10 text-violet-500 transition"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setEditing(true); setEditName(node.name); setEditColor(node.color || '#8b5cf6') }}
              title="Renomear"
              className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 transition"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-500" />
            </button>
            {/* Mover para */}
            <select
              value={node.parentFolderId || ''}
              onChange={e => onMove(node._id, e.target.value || null)}
              title="Mover para..."
              className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-[11px] px-1.5 py-1 max-w-[100px]"
            >
              <option value="">↖ raiz</option>
              {allFolders.filter(f => f._id !== node._id).map(f => (
                <option key={f._id} value={f._id}>{f.pathLabel}</option>
              ))}
            </select>
            <button
              onClick={() => onDelete(node._id)}
              title="Apagar pasta"
              className="rounded-lg p-1.5 hover:bg-rose-500/10 text-rose-500 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Inline add child */}
      {addingChild && (
        <div style={{ paddingLeft: `${indent + 28}px` }} className="pr-3 pb-2">
          <CreateFolderInline
            parentId={node._id}
            parentName={node.name}
            onCreate={(name, color, parentId) => { onCreate(name, color, parentId); setAddingChild(false) }}
            onCancel={() => setAddingChild(false)}
            autoFocus
          />
        </div>
      )}

      {/* Children */}
      {expanded && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <FolderTreeRow
              key={child._id}
              node={child}
              depth={depth + 1}
              allFolders={allFolders}
              onCreate={onCreate}
              onRename={onRename}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Create folder inline form
// ─────────────────────────────────────────────────────────────────────────────

function CreateFolderInline({ parentId, parentName, onCreate, onCancel, autoFocus }: {
  parentId: string | null
  parentName: string | null
  onCreate: (name: string, color: string, parentId: string | null) => void
  onCancel?: () => void
  autoFocus?: boolean
}) {
  const [open, setOpen] = useState(!!autoFocus)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#8b5cf6')
  const palette = ['#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#6366f1']

  function submit() {
    if (!name.trim()) return
    onCreate(name.trim(), color, parentId)
    setName('')
    setColor('#8b5cf6')
    setOpen(false)
    onCancel?.()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-violet-400/50 bg-violet-500/5 px-4 py-2 text-sm font-medium text-violet-600 dark:text-violet-300 hover:bg-violet-500/10 transition"
      >
        <FolderPlus className="h-4 w-4" />
        {parentName ? `Subpasta em "${parentName}"` : 'Nova pasta raiz'}
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-violet-400/40 bg-violet-500/5 p-3 space-y-2.5">
      <p className="text-xs font-semibold text-violet-600 dark:text-violet-300">
        {parentName ? `Nova subpasta em "${parentName}"` : 'Nova pasta raiz'}
      </p>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setOpen(false); onCancel?.() } }}
        placeholder="Nome da pasta..."
        autoFocus={!!autoFocus}
        className="w-full rounded-xl border border-white/40 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-violet-400 transition"
      />
      <div className="flex items-center gap-1.5 flex-wrap">
        {palette.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className={cn('h-6 w-6 rounded-lg transition border-2', color === c ? 'border-white scale-110 shadow' : 'border-transparent hover:scale-105')}
          />
        ))}
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-6 w-6 rounded-lg cursor-pointer border-0" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!name.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 transition hover:shadow-md"
        >
          <Check className="h-3.5 w-3.5" /> Criar
        </button>
        <button
          onClick={() => { setOpen(false); onCancel?.() }}
          className="rounded-xl px-3 py-1.5 text-xs text-slate-500 hover:bg-white/60 dark:hover:bg-white/10 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

interface FlatFolder {
  _id: string
  pathLabel: string
}

function buildTree(flat: any[], deckCountMap: Map<string, number>): FolderNode[] {
  const map = new Map<string, FolderNode>()
  for (const f of flat) {
    map.set(f._id, { ...f, children: [], deckCount: deckCountMap.get(f._id) || 0 })
  }
  const roots: FolderNode[] = []
  for (const f of map.values()) {
    if (f.parentFolderId && map.has(f.parentFolderId)) {
      map.get(f.parentFolderId)!.children.push(f)
    } else {
      roots.push(f)
    }
  }
  const sort = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    nodes.forEach(n => sort(n.children))
  }
  sort(roots)
  return roots
}

function flattenTree(nodes: FolderNode[], prefix = ''): FlatFolder[] {
  const result: FlatFolder[] = []
  for (const n of nodes) {
    const label = prefix ? `${prefix} › ${n.name}` : n.name
    result.push({ _id: n._id, pathLabel: label })
    result.push(...flattenTree(n.children, label))
  }
  return result
}
