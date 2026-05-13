'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
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
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToastAlert } from '@/components/ui/toast-alert'
import { FlashcardImageInput } from '@/components/flashcards/flashcard-image-input'
import { cn } from '@/lib/utils'
import type { FlashcardManualCard, FlashcardManualDeck } from '@/lib/types'

const VALID_GROUPS = ['gratuito', 'trial', 'essential', 'premium', 'monitor'] as const

interface CardDraft {
  _id?: string
  kind: 'standard' | 'hidden_word'
  front: { text: string; image?: string }
  back: { text: string; image?: string }
  hiddenWord?: { phrase: string; word: string; hint?: string }
  comment?: string
  expanded?: boolean
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
      setCards(prev => prev.map((c, i) => i === idx ? { ...c, _id: saved._id, expanded: false } : c))
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Cartões ({cards.length})</h2>
            <div className="flex gap-2">
              <Button onClick={() => addCard('standard')} size="sm"><Plus className="h-4 w-4" /> Cartão</Button>
              <Button onClick={() => addCard('hidden_word')} size="sm" variant="outline"><Plus className="h-4 w-4" /> Palavra oculta</Button>
            </div>
          </div>

          <div className="space-y-3">
            {cards.map((card, i) => (
              <CardEditor
                key={card._id || `new-${i}`}
                idx={i}
                card={card}
                saving={savingCardIdx === i}
                onChange={(patch) => updateCard(i, patch)}
                onSave={() => persistCard(i)}
                onDelete={() => deleteCard(i)}
                onToggle={() => updateCard(i, { expanded: !card.expanded })}
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
  idx, card, saving, onChange, onSave, onDelete, onToggle,
}: {
  idx: number
  card: CardDraft
  saving: boolean
  onChange: (patch: Partial<CardDraft>) => void
  onSave: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  const isHidden = card.kind === 'hidden_word'
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-3 p-4 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <span className="rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-mono w-7 h-7 flex items-center justify-center">{idx + 1}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {isHidden ? (card.hiddenWord?.phrase || 'Palavra oculta, preencher') : (card.front.text || 'Cartão sem título')}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {isHidden ? `Palavra: ${card.hiddenWord?.word || '(definir)'}` : (card.back.text || '(sem resposta)')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isHidden && <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 font-semibold">Palavra oculta</span>}
          {card.expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

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

function ImportDialog({ slug, onClose, onImported }: { slug: string; onClose: () => void; onImported: (count: number) => void }) {
  const [format, setFormat] = useState<'json' | 'csv' | 'markdown'>('markdown')
  const [payload, setPayload] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
Qual é a capital do Brasil?

## Verso
Brasília

---

## Frente
Defina mitose.

## Verso
Divisão celular que origina duas células-filhas geneticamente idênticas à célula-mãe.`

  async function submit() {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, payload }),
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl border border-slate-200 dark:border-white/10 p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">Importar cartões</h3>
        <p className="text-sm text-slate-500 mb-4">Cole o conteúdo no formato escolhido, vários cartões de uma vez.</p>

        <div className="flex gap-2 mb-3 flex-wrap">
          <button onClick={() => setFormat('markdown')} className={cn('rounded-full px-3 py-1 text-xs font-medium border', format === 'markdown' ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200' : 'border-slate-200 dark:border-white/10 text-slate-500')}>Markdown (recomendado)</button>
          <button onClick={() => setFormat('json')} className={cn('rounded-full px-3 py-1 text-xs font-medium border', format === 'json' ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200' : 'border-slate-200 dark:border-white/10 text-slate-500')}>JSON</button>
          <button onClick={() => setFormat('csv')} className={cn('rounded-full px-3 py-1 text-xs font-medium border', format === 'csv' ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200' : 'border-slate-200 dark:border-white/10 text-slate-500')}>CSV</button>
        </div>

        <Textarea
          rows={12}
          value={payload}
          onChange={e => setPayload(e.target.value)}
          placeholder={sample}
          className="font-mono text-xs"
        />

        {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}

        <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 text-xs text-slate-500 space-y-1">
          {format === 'markdown' && (
            <>
              <p><strong>Formato Markdown:</strong> ideal para importar a partir de LLMs (ChatGPT, Claude, etc.).</p>
              <p>Cada cartão usa <code>## Frente</code>, <code>## Verso</code> e opcionalmente <code>## Comentário</code>. Separe os cartões com <code>---</code>.</p>
            </>
          )}
          {format === 'json' && (
            <p><strong>Formato JSON:</strong> array de objetos com <code>front.text</code>, <code>back.text</code>, <code>comment</code>, <code>kind</code> ('standard' ou 'hidden_word'), <code>hiddenWord</code>.</p>
          )}
          {format === 'csv' && (
            <p><strong>Formato CSV:</strong> cabeçalhos: <code>front, back, comment, hiddenWord, hint</code> (ou <code>frente, verso, comentario, palavra_oculta, dica</code>).</p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={busy || !payload.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Importar
          </Button>
        </div>
      </div>
    </div>
  )
}
