'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  Save,
  Eye,
  Globe,
  Lock,
  Link as LinkIcon,
  Upload,
  Tag,
  Crown,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Settings,
  MessageSquare,
  Download,
  Shuffle,
  Image as ImageIcon,
  Copy,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToastAlert } from '@/components/ui/toast-alert'
import { FlashcardImageInput } from '@/components/flashcards/flashcard-image-input'
import { FlashcardBulkImages, type BulkImageItem } from '@/components/flashcards/flashcard-bulk-images'
import { PricingEventSelector } from '@/components/pricing-events/PricingEventSelector'
import { cn } from '@/lib/utils'
import { buildImportCards, type ImageMode, type ImportFormat } from '@/lib/flashcard-import'
import type { FlashcardManualCard, FlashcardManualDeck } from '@/lib/types'

const VALID_GROUPS = ['gratuito', 'trial', 'essential', 'premium', 'monitor'] as const

interface CardDraft {
  clientId: string
  _id?: string
  kind: 'standard' | 'hidden_word'
  front: { text: string; image?: string }
  back: { text: string; image?: string }
  hiddenWord?: { phrase: string; word: string; hint?: string }
  comment?: string
  expanded?: boolean
}

function createCardClientId() {
  return `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export default function EditDeckPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [deck, setDeck] = useState<(FlashcardManualDeck & { _id: string }) | null>(null)
  const [cards, setCards] = useState<CardDraft[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingMeta, setSavingMeta] = useState(false)
  const [savingCardIdx, setSavingCardIdx] = useState<number | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [deckRes, meRes] = await Promise.all([
        fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}`, { cache: 'no-store' }),
        fetch('/api/auth/me'),
      ])
      const deckJson = await deckRes.json()
      if (!deckRes.ok) throw new Error(deckJson?.error || 'Erro ao carregar deck')
      setDeck(deckJson.deck)
      setEmailVerified(!!deckJson.viewer?.emailVerified)
      const me = await meRes.json()
      setIsAdmin(me.user?.role === 'admin')
      setCards((deckJson.cards || []).map((c: FlashcardManualCard) => ({
        clientId: createCardClientId(),
        _id: String((c as any)._id),
        kind: c.kind,
        front: { text: c.front?.text || '', image: c.front?.image },
        back: { text: c.back?.text || '', image: c.back?.image },
        hiddenWord: c.hiddenWord,
        comment: c.comment,
        expanded: false,
      })))
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro ao carregar', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function saveMeta(updates: Partial<FlashcardManualDeck>) {
    if (!deck) return
    setSavingMeta(true)
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar')
      setDeck(json.deck)
      setToast({ open: true, message: 'Salvo!', type: 'success' })
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro', type: 'error' })
    } finally {
      setSavingMeta(false)
    }
  }

  function addCard(kind: 'standard' | 'hidden_word' = 'standard') {
    setCards(prev => [...prev, {
      clientId: createCardClientId(),
      kind,
      front: { text: '' },
      back: { text: '' },
      hiddenWord: kind === 'hidden_word' ? { phrase: '', word: '' } : undefined,
      expanded: true,
    }])
  }

  function updateCard(idx: number, patch: Partial<CardDraft>) {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c))
  }

  async function persistCard(idx: number) {
    if (!deck) return
    const card = cards[idx]
    if (!card) return
    setSavingCardIdx(idx)
    try {
      const isUpdate = !!card._id
      const url = isUpdate
        ? `/api/flashcards/manual/${encodeURIComponent(slug)}/cards/${card._id}`
        : `/api/flashcards/manual/${encodeURIComponent(slug)}/cards`
      const res = await fetch(url, {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: card.kind,
          front: card.front,
          back: card.back,
          hiddenWord: card.kind === 'hidden_word' ? card.hiddenWord : null,
          comment: card.comment || '',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar cartão')
      const saved = json.card
      const nextCards = cards.map((c, i) => i === idx ? { ...c, _id: saved._id, expanded: false } : c)
      setCards(nextCards)
      if (!isUpdate) persistCardOrder(nextCards, { silent: true })
      setToast({ open: true, message: 'Cartão salvo', type: 'success' })
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro', type: 'error' })
    } finally {
      setSavingCardIdx(null)
    }
  }

  async function deleteCard(idx: number) {
    const card = cards[idx]
    if (!card) return
    if (!confirm('Apagar este cartão?')) return
    if (card._id) {
      try {
        await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/cards/${card._id}`, { method: 'DELETE' })
      } catch {}
    }
    setCards(prev => prev.filter((_, i) => i !== idx))
  }

  async function persistCardOrder(nextCards: CardDraft[], options: { silent?: boolean } = {}) {
    const orderedIds = nextCards.map(card => card._id).filter(Boolean) as string[]
    if (!deck || orderedIds.length < 2) return
    setSavingOrder(true)
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/cards/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Erro ao salvar ordem')
      if (!options.silent) setToast({ open: true, message: 'Ordem salva', type: 'success' })
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro ao salvar ordem', type: 'error' })
    } finally {
      setSavingOrder(false)
    }
  }

  function reorderCards(from: number, to: number) {
    if (to < 0 || to >= cards.length || from === to) return
    const nextCards = [...cards]
    const [moved] = nextCards.splice(from, 1)
    nextCards.splice(to, 0, moved)
    setCards(nextCards)
    persistCardOrder(nextCards, { silent: true })
  }

  function shuffleCards() {
    if (cards.length < 2) return
    const nextCards = [...cards]
    for (let i = nextCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[nextCards[i], nextCards[j]] = [nextCards[j], nextCards[i]]
    }
    setCards(nextCards)
    persistCardOrder(nextCards)
  }

  if (loading) {
    return <AppShell><div className="flex items-center justify-center min-h-[60vh] text-slate-500">Carregando...</div></AppShell>
  }

  if (!deck) {
    return <AppShell><div className="text-center py-20 text-slate-500">Deck não encontrado</div></AppShell>
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => router.push(`/flashcards/d/${slug}`)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar ao deck
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" /> Importar</Button>
            <Link href={`/flashcards/d/${slug}`}><Button variant="outline"><Eye className="h-4 w-4" /> Visualizar</Button></Link>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Editar deck</h1>

        <DeckMetaForm
          deck={deck}
          isAdmin={isAdmin}
          emailVerified={emailVerified}
          saving={savingMeta}
          onSave={saveMeta}
        />

        <div className="mt-8">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Cartões ({cards.length})</h2>
              {savingOrder && <p className="mt-0.5 text-xs text-slate-500">Salvando ordem...</p>}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {cards.length > 1 && (
                <Button onClick={shuffleCards} size="sm" variant="outline" disabled={savingOrder}>
                  {savingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />} Embaralhar
                </Button>
              )}
              <Button onClick={() => addCard('standard')} size="sm"><Plus className="h-4 w-4" /> Cartão</Button>
              <Button onClick={() => addCard('hidden_word')} size="sm" variant="outline"><Plus className="h-4 w-4" /> Palavra oculta</Button>
            </div>
          </div>

          <div className="space-y-3">
            {cards.map((card, i) => (
              <CardEditor
                key={card._id || card.clientId}
                idx={i}
                card={card}
                saving={savingCardIdx === i}
                canMoveUp={i > 0}
                canMoveDown={i < cards.length - 1}
                onChange={(patch) => updateCard(i, patch)}
                onSave={() => persistCard(i)}
                onDelete={() => deleteCard(i)}
                onToggle={() => updateCard(i, { expanded: !card.expanded })}
                onMoveUp={() => reorderCards(i, i - 1)}
                onMoveDown={() => reorderCards(i, i + 1)}
              />
            ))}
          </div>

          {cards.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/15 p-10 text-center">
              <Plus className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p className="text-slate-500">Nenhum cartão ainda.</p>
              <p className="text-xs text-slate-400 mt-1">Clique em "Cartão" para criar manualmente ou em "Palavra oculta" para usar o modo de adivinhação.</p>
            </div>
          )}
        </div>
      </div>

      {importOpen && (
        <ImportDialog slug={slug} onClose={() => setImportOpen(false)} onImported={(n) => {
          setToast({ open: true, message: `${n} cartões importados`, type: 'success' })
          load()
        }} />
      )}

      <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={(open) => setToast(t => ({ ...t, open }))} />
    </AppShell>
  )
}

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

function DeckMetaForm({
  deck, isAdmin, emailVerified, saving, onSave,
}: {
  deck: any
  isAdmin: boolean
  emailVerified: boolean
  saving: boolean
  onSave: (updates: any) => void
}) {
  const [title, setTitle] = useState(deck.title)
  const [description, setDescription] = useState(deck.description || '')
  const [coverImage, setCoverImage] = useState(deck.coverImage || '')
  const [tagsText, setTagsText] = useState((deck.tags || []).join(', '))
  const [visibility, setVisibility] = useState(deck.visibility)
  const [pricing, setPricing] = useState(deck.pricing)
  const [price, setPrice] = useState(String(deck.price ?? 0))
  const [pricingEventId, setPricingEventId] = useState<string | null>(deck.pricingEventId || null)
  const [allowedGroups, setAllowedGroups] = useState<string[]>(deck.allowedGroups || [])
  const [materialsFolderId, setMaterialsFolderId] = useState(deck.materialsFolderId || '')
  const [pdfDownloadEnabled, setPdfDownloadEnabled] = useState(deck.pdfDownloadEnabled === true)
  const [materiaisFolders, setMateriaisFolders] = useState<{ _id: string; name: string; parentFolderId?: string | null }[]>([])
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/materiais/folders?all=true').then(r => r.json()).then(j => {
      setMateriaisFolders(j.folders || [])
    }).catch(() => {})
  }, [isAdmin])

  const materiaisPaths = useMemo(() => buildMateriaisPaths(materiaisFolders), [materiaisFolders])

  function submit() {
    onSave({
      title,
      description,
      coverImage: coverImage || undefined,
      tags: tagsText.split(',').map((s: string) => s.trim()).filter(Boolean),
      visibility,
      ...(isAdmin ? {
        pricing,
        price: pricing === 'paid' ? Number(price) || 0 : 0,
        pricingEventId: pricing === 'paid' ? pricingEventId : null,
        allowedGroups,
        materialsFolderId: materialsFolderId || null,
        pdfDownloadEnabled,
      } : {}),
    })
  }

  function toggleGroup(g: string) {
    setAllowedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 md:p-6 space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <Label>Título</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} className="mt-1" />
          <Label className="mt-4 block">Descrição</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={600} className="mt-1" />
          <Label className="mt-4 block">Tags (separadas por vírgula)</Label>
          <Input value={tagsText} onChange={e => setTagsText(e.target.value)} placeholder="ex: cardiologia, ECG, urgência" className="mt-1" />
        </div>
        <div>
          <Label>Capa</Label>
          <Input
            value={coverImage}
            onChange={e => setCoverImage(e.target.value)}
            placeholder="URL da imagem de capa"
            className="mt-1"
          />
          <p className="mt-1 text-[11px] text-slate-400">Recomendado: 1280 × 720 px · proporção 16:9</p>
          <Label className="mt-4 block">Visibilidade</Label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {[
              { v: 'private', icon: <Lock className="h-4 w-4" />, label: 'Privado' },
              { v: 'unlisted', icon: <LinkIcon className="h-4 w-4" />, label: 'Não-listado' },
              { v: 'public', icon: <Globe className="h-4 w-4" />, label: 'Público' },
            ].map(opt => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setVisibility(opt.v)}
                className={cn(
                  'rounded-2xl px-3 py-2.5 text-xs font-medium border transition flex flex-col items-center gap-1',
                  visibility === opt.v
                    ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-violet-400'
                )}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          {(visibility !== 'private' && !emailVerified && !isAdmin) && (
            <p className="mt-2 flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5" /> Verifique seu e-mail para tornar este deck visível.
            </p>
          )}
        </div>
      </div>

      {isAdmin && (
        <div>
          <button type="button" onClick={() => setAdvancedOpen(o => !o)} className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
            <Settings className="h-3.5 w-3.5" /> Configurações de admin {advancedOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {advancedOpen && (
            <div className="mt-3 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-4 space-y-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider">
                <Crown className="h-3.5 w-3.5" /> Modo administrador
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Pricing</Label>
                  <select className="mt-1 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={pricing} onChange={e => setPricing(e.target.value as any)}>
                    <option value="free">Gratuito</option>
                    <option value="paid">Pago</option>
                  </select>
                </div>
                {pricing === 'paid' && (
                  <div>
                    <Label>Preço (R$)</Label>
                    <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="mt-1" />
                  </div>
                )}
              </div>
              {pricing === 'paid' && (
                <div>
                  <PricingEventSelector
                    value={pricingEventId}
                    onChange={setPricingEventId}
                    label="Lote dinâmico por evento"
                    hint='Aplica desconto progressivo conforme a data se aproxima. Regra "Maior dos dois" — vence o melhor entre lote e cupom.'
                  />
                </div>
              )}
              <div>
                <Label>Restringir a grupos (opcional)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {VALID_GROUPS.map(g => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGroup(g)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium border transition',
                        allowedGroups.includes(g)
                          ? 'bg-violet-500 text-white border-violet-500'
                          : 'border-slate-200 dark:border-white/10 text-slate-500'
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">Vazio = todos os usuários (sujeito a pricing).</p>
              </div>
              <div>
                <Label>Pasta em /materiais</Label>
                <select
                  className="mt-1 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={materialsFolderId}
                  onChange={e => setMaterialsFolderId(e.target.value)}
                >
                  <option value="">Raiz (sem pasta)</option>
                  {materiaisPaths.map(f => (
                    <option key={f._id} value={f._id}>{f.path}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-900">
                <input
                  type="checkbox"
                  checked={pdfDownloadEnabled}
                  onChange={e => setPdfDownloadEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100">
                    <Download className="h-4 w-4" /> Liberar PDF
                  </span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    Permite que usuários com acesso baixem o deck em PDF com marca d'água individual.
                  </span>
                </span>
              </label>
              {pricing === 'paid' && (
                <p className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-3 text-xs text-violet-700 dark:text-violet-300">
                  Ao salvar, o deck será automaticamente publicado em <strong>/materiais</strong> como produto. Após a compra, o usuário cai direto neste deck.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar deck
        </Button>
      </div>
    </div>
  )
}

function CardEditor({
  idx, card, saving, canMoveUp, canMoveDown, onChange, onSave, onDelete, onToggle, onMoveUp, onMoveDown,
}: {
  idx: number
  card: CardDraft
  saving: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onChange: (patch: Partial<CardDraft>) => void
  onSave: () => void
  onDelete: () => void
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const isHidden = card.kind === 'hidden_word'
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 p-3 md:p-4">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">{idx + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-medium">
                {isHidden ? (card.hiddenWord?.phrase || 'Palavra oculta, preencher') : (card.front.text || 'Cartão sem título')}
              </p>
              {isHidden && <span className="hidden shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 sm:inline">Palavra oculta</span>}
            </div>
            <p className="truncate text-xs text-slate-500">
              {isHidden ? `Palavra: ${card.hiddenWord?.word || '(definir)'}` : (card.back.text || '(sem resposta)')}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onMoveUp} disabled={!canMoveUp} title="Mover para cima">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onMoveDown} disabled={!canMoveDown} title="Mover para baixo">
            <ArrowDown className="h-4 w-4" />
          </Button>
          <button type="button" onClick={onToggle} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200" title={card.expanded ? 'Recolher' : 'Expandir'}>
            {card.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {card.expanded && (
        <div className="border-t border-slate-100 dark:border-white/10 p-4 md:p-5 space-y-4">
          {!isHidden ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Frente</Label>
                <Textarea value={card.front.text} onChange={e => onChange({ front: { ...card.front, text: e.target.value } })} rows={4} className="mt-1" placeholder="Pergunta, conceito, definição..." />
                <FlashcardImageInput
                  className="mt-2"
                  value={card.front.image}
                  onChange={(url) => onChange({ front: { ...card.front, image: url } })}
                />
              </div>
              <div>
                <Label>Verso</Label>
                <Textarea value={card.back.text} onChange={e => onChange({ back: { ...card.back, text: e.target.value } })} rows={4} className="mt-1" placeholder="Resposta, explicação..." />
                <FlashcardImageInput
                  className="mt-2"
                  value={card.back.image}
                  onChange={(url) => onChange({ back: { ...card.back, image: url } })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Frase com a palavra oculta</Label>
                <Textarea
                  value={card.hiddenWord?.phrase || ''}
                  onChange={e => onChange({ hiddenWord: { ...(card.hiddenWord || { word: '' }), phrase: e.target.value } })}
                  rows={3}
                  className="mt-1"
                  placeholder="Ex: A artéria coronária esquerda se origina do seio aórtico **esquerdo**."
                />
                <p className="mt-1 text-xs text-slate-500">A palavra que você definir abaixo será automaticamente escondida na frase.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Palavra a descobrir</Label>
                  <Input
                    value={card.hiddenWord?.word || ''}
                    onChange={e => onChange({ hiddenWord: { ...(card.hiddenWord || { phrase: '' }), word: e.target.value } })}
                    placeholder="Ex: esquerdo"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Dica (opcional)</Label>
                  <Input
                    value={card.hiddenWord?.hint || ''}
                    onChange={e => onChange({ hiddenWord: { ...(card.hiddenWord || { phrase: '', word: '' }), hint: e.target.value } })}
                    placeholder="Pista para liberar quando o estudante travar"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Imagem da frente (opcional)</Label>
                  <FlashcardImageInput
                    className="mt-1.5"
                    label="Adicionar imagem à frente"
                    value={card.front.image}
                    onChange={(url) => onChange({ front: { ...card.front, image: url } })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Imagem do verso (opcional)</Label>
                  <FlashcardImageInput
                    className="mt-1.5"
                    label="Adicionar imagem ao verso"
                    value={card.back.image}
                    onChange={(url) => onChange({ back: { ...card.back, image: url } })}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Resposta comentada</Label>
            <Textarea
              value={card.comment || ''}
              onChange={e => onChange({ comment: e.target.value })}
              rows={3}
              className="mt-1"
              placeholder="Explicação detalhada que aparece no verso quando o usuário clica em 'Resposta comentada'."
              maxLength={2500}
            />
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onDelete} className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10">
              <Trash2 className="h-4 w-4" /> Apagar
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar cartão
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Diálogo de importação.
 *
 * A parte de texto sempre funcionou: o LLM devolve o Markdown de frente/verso
 * e ele é colado aqui. O que faltava era a imagem — cada uma precisava ser
 * hospedada fora e ter a URL colada cartão por cartão. Agora as imagens sobem
 * em lote e são distribuídas pela ordem (imagem 1 na frente do cartão 1,
 * imagem 2 no verso do cartão 1, e assim por diante), com um preview mostrando
 * onde cada uma caiu antes de gravar qualquer coisa.
 */
function ImportDialog({ slug, onClose, onImported }: { slug: string; onClose: () => void; onImported: (count: number) => void }) {
  const [format, setFormat] = useState<ImportFormat>('markdown')
  const [payload, setPayload] = useState('')
  const [images, setImages] = useState<BulkImageItem[]>([])
  const [imageMode, setImageMode] = useState<ImageMode>('alternate')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promptCopied, setPromptCopied] = useState(false)

  const sampleJson = `[
  {"front": {"text": "Pergunta?"}, "back": {"text": "Resposta"}, "comment": "Explicação extra"},
  {"kind": "hidden_word", "hiddenWord": {"phrase": "A capital do Brasil é **Brasília**.", "word": "Brasília", "hint": "Cidade planejada"}}
]`

  const sampleCsv = `front,back,comment
Pergunta 1,Resposta 1,Comentário opcional
Pergunta 2,Resposta 2,`

  const sampleMarkdown = `## Frente
O que é fotossíntese?

## Verso
Processo pelo qual plantas convertem luz solar em glicose usando CO₂ e água.

## Comentário
Ocorre nos cloroplastos, especificamente nos tilacóides.

---

## Frente
Qual estrutura está indicada?

## Verso
Núcleo da célula

---

## Frente
Defina mitose.
{{img5}}

## Verso
Divisão celular que origina duas células-filhas geneticamente idênticas.`

  const uploadedUrls = useMemo(
    () => images.filter(i => i.status === 'done' && i.url).map(i => i.url as string),
    [images],
  )
  const uploading = images.some(i => i.status === 'uploading')

  // Mesma função que a rota usa no servidor: o que aparece no preview é
  // exatamente o que vai ser gravado.
  const preview = useMemo(() => {
    try {
      return {
        result: buildImportCards({ format, payload, images: uploadedUrls, imageMode }),
        parseError: null as string | null,
      }
    } catch (err: any) {
      return { result: null, parseError: err?.message || 'Não consegui ler esse conteúdo' }
    }
  }, [format, payload, uploadedUrls, imageMode])

  const cards = preview.result?.cards || []

  // A miniatura de cada imagem mostra para onde ela vai. `uploadedUrls` pula
  // as que ainda estão subindo, então o índice do preview precisa ser
  // recalculado sobre a lista completa.
  const describeSlot = useCallback((index: number) => {
    const item = images[index]
    if (!item || item.status !== 'done') return undefined
    const uploadedIndex = images.slice(0, index).filter(i => i.status === 'done' && i.url).length
    const target = preview.result?.assignments[uploadedIndex]
    if (!target) return 'sem cartão'
    return `Cartão ${target.cardIndex + 1} · ${target.side === 'front' ? 'frente' : 'verso'}`
  }, [images, preview])

  // O usuário já gera o Markdown num LLM; este é o texto que faz o LLM
  // devolver exatamente o formato que a tela entende, marcadores inclusive.
  const aiPrompt = `Transforme o conteúdo abaixo (ou as imagens que eu enviar) em flashcards no formato de importação do Domine Aqui.

Regras do formato:
- Cada cartão usa "## Frente", "## Verso" e, opcionalmente, "## Comentário".
- Separe um cartão do outro com uma linha contendo apenas ---
- Não escreva mais nada fora desses blocos: nada de introdução, numeração ou conclusão.
- Se eu mandar imagens, elas entram na ordem: imagem 1 na frente do cartão 1, imagem 2 no verso do cartão 1, imagem 3 na frente do cartão 2, e assim por diante. Nesse caso deixe o texto do lado correspondente vazio (só o cabeçalho) ou escreva um enunciado curto.
- Se alguma imagem precisar ir para um lugar fora dessa ordem, escreva {{img5}} (o número é a posição da imagem na lista que eu enviei) dentro da Frente ou do Verso daquele cartão.

Exemplo:

## Frente
O que é fotossíntese?

## Verso
Processo pelo qual plantas convertem luz solar em glicose usando CO₂ e água.

## Comentário
Ocorre nos cloroplastos.

---

## Frente
Qual estrutura está indicada?

## Verso
Núcleo da célula

Conteúdo:
`

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(aiPrompt)
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2000)
    } catch {
      setError('Não consegui copiar. Selecione o texto do exemplo manualmente.')
    }
  }

  async function submit() {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, payload, images: uploadedUrls, imageMode }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Falha ao importar')
      onImported(json.imported || 0)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Erro ao importar')
    } finally { setBusy(false) }
  }

  const sample = format === 'json' ? sampleJson : format === 'csv' ? sampleCsv : sampleMarkdown
  const canSubmit = !busy && !uploading && cards.length > 0

  const formatTabs: Array<{ id: ImportFormat; label: string }> = [
    { id: 'markdown', label: 'Markdown (recomendado)' },
    { id: 'images', label: 'Só imagens' },
    { id: 'json', label: 'JSON' },
    { id: 'csv', label: 'CSV' },
  ]

  const modeTabs: Array<{ id: ImageMode; label: string; hint: string }> = [
    { id: 'alternate', label: 'Frente e verso alternados', hint: '1 → frente do cartão 1, 2 → verso do cartão 1, 3 → frente do cartão 2...' },
    { id: 'front', label: 'Uma por frente', hint: 'Cada imagem vai para a frente de um cartão, na ordem.' },
    { id: 'back', label: 'Uma por verso', hint: 'Cada imagem vai para o verso de um cartão, na ordem.' },
    { id: 'none', label: 'Só pelos marcadores', hint: 'Nada é distribuído automaticamente: valem apenas os {{img1}} escritos no texto.' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl border border-slate-200 dark:border-white/10 p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Importar cartões</h3>
            <p className="text-sm text-slate-500">
              Cole o texto, mande as imagens na ordem e confira o preview antes de gravar.
            </p>
          </div>
          <button
            type="button"
            onClick={copyPrompt}
            className="shrink-0 inline-flex items-center gap-1 rounded-full border border-violet-300 dark:border-violet-400/40 px-2.5 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-200 hover:bg-violet-500/10 transition"
            title="Copia um prompt pronto para o ChatGPT/Claude devolver o Markdown já neste formato"
          >
            <Copy className="h-3 w-3" /> {promptCopied ? 'Copiado!' : 'Prompt para IA'}
          </button>
        </div>

        <div className="flex gap-2 mb-3 flex-wrap">
          {formatTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFormat(tab.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border',
                format === tab.id
                  ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200'
                  : 'border-slate-200 dark:border-white/10 text-slate-500',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {format !== 'images' && (
          <Textarea
            rows={10}
            value={payload}
            onChange={e => setPayload(e.target.value)}
            placeholder={sample}
            className="font-mono text-xs"
          />
        )}

        <div className={cn('rounded-2xl border border-slate-200 dark:border-white/10 p-3', format === 'images' ? 'mt-0' : 'mt-4')}>
          <div className="flex items-center gap-1.5 mb-2">
            <ImageIcon className="h-4 w-4 text-violet-500" />
            <Label className="text-sm">Imagens dos cartões</Label>
          </div>

          <FlashcardBulkImages
            items={images}
            onChange={setImages}
            describeSlot={describeSlot}
            disabled={busy}
            toolbar={
              <div className="mt-3">
                <Label className="text-xs text-slate-500">Como distribuir</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {modeTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setImageMode(tab.id)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-medium border',
                        imageMode === tab.id
                          ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200'
                          : 'border-slate-200 dark:border-white/10 text-slate-500',
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {modeTabs.find(t => t.id === imageMode)?.hint}
                </p>
              </div>
            }
          />
        </div>

        {(payload.trim() || uploadedUrls.length > 0) && (
          <div className="mt-4 rounded-2xl border border-slate-200 dark:border-white/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Preview</Label>
              <span className="text-xs text-slate-500">
                {cards.length} {cards.length === 1 ? 'cartão' : 'cartões'}
                {(preview.result?.leftoverImages || 0) > 0 && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    · {preview.result?.leftoverImages} imagem(ns) sem cartão
                  </span>
                )}
              </span>
            </div>

            {preview.parseError && <p className="text-xs text-rose-500">{preview.parseError}</p>}

            {!preview.parseError && cards.length === 0 && (
              <p className="text-xs text-slate-500">Nada para importar ainda.</p>
            )}

            <ul className="space-y-1.5 max-h-56 overflow-auto">
              {cards.slice(0, 40).map((card, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/5 px-2 py-1.5 text-xs"
                >
                  <span className="shrink-0 rounded-md bg-violet-500/10 px-1.5 py-0.5 font-bold text-violet-700 dark:text-violet-200">
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-slate-600 dark:text-slate-300">
                    {card.front.text.trim() || (card.front.image ? '(só imagem)' : '(frente vazia)')}
                    <span className="mx-1 text-slate-400">→</span>
                    {card.back.text.trim() || (card.back.image ? '(só imagem)' : '(verso vazio)')}
                  </span>
                  <span className="shrink-0 flex gap-1">
                    {card.front.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={card.front.image} alt="" className="h-7 w-7 rounded object-cover" />
                    )}
                    {card.back.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={card.back.image} alt="" className="h-7 w-7 rounded object-cover ring-1 ring-violet-300" />
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {cards.length > 40 && (
              <p className="mt-1.5 text-[11px] text-slate-500">... e mais {cards.length - 40} cartões.</p>
            )}
          </div>
        )}

        {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}

        <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 text-xs text-slate-500 space-y-1">
          {format === 'markdown' && (
            <>
              <p><strong>Formato Markdown:</strong> ideal para importar a partir de LLMs (ChatGPT, Claude, etc.).</p>
              <p>Cada cartão usa <code>## Frente</code>, <code>## Verso</code> e opcionalmente <code>## Comentário</code>. Separe os cartões com <code>---</code>.</p>
            </>
          )}
          {format === 'images' && (
            <p><strong>Só imagens:</strong> os cartões saem direto das imagens enviadas, sem texto nenhum. No modo alternado, cada par vira um cartão (frente e verso).</p>
          )}
          {format === 'json' && (
            <p><strong>Formato JSON:</strong> array de objetos com <code>front.text</code>, <code>back.text</code>, <code>comment</code>, <code>kind</code> ('standard' ou 'hidden_word'), <code>hiddenWord</code>.</p>
          )}
          {format === 'csv' && (
            <p><strong>Formato CSV:</strong> cabeçalhos: <code>front, back, comment, hiddenWord, hint</code> (ou <code>frente, verso, comentario, palavra_oculta, dica</code>).</p>
          )}
          {format !== 'images' && (
            <p>
              <strong>Fixar uma imagem específica:</strong> escreva <code>{'{{img3}}'}</code> (ou <code>![](img3)</code>) dentro da frente ou do verso para usar a
              3ª imagem enviada ali. As que não forem citadas continuam entrando pela ordem.
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Enviando imagens...' : `Importar${cards.length ? ` ${cards.length}` : ''}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
