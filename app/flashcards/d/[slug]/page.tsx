'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  Heart,
  Share2,
  Lock,
  ShoppingCart,
  CheckCircle2,
  EyeOff,
  Globe,
  Link as LinkIcon,
  Trophy,
  Sparkles,
  Users,
  Crown,
  RotateCcw,
  Play,
  ChevronLeft,
  ChevronRight,
  Folder,
  ChevronDown,
  ChevronUp,
  Trash2,
  Square,
  CheckSquare,
  Loader2,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { ToastAlert } from '@/components/ui/toast-alert'
import { FlashcardCardView } from '@/components/flashcards/flashcard-card'
import { cn } from '@/lib/utils'
import type { FlashcardManualCard, FlashcardManualDeck } from '@/lib/types'

interface AccessFlags {
  hasAccess: boolean
  isOwner: boolean
  isPurchased: boolean
  hasGroupAccess: boolean
  hasShareAccess: boolean
  reasons: string[]
}

interface DeckResponse {
  deck: FlashcardManualDeck & { _id: string }
  cards: (FlashcardManualCard & { _id: string })[]
  access: AccessFlags & { canManage: boolean }
  viewer: { userId: string; emailVerified: boolean }
}

const RATINGS = [
  { value: 'facil' as const, label: 'Suave', color: 'from-emerald-500 to-emerald-600', shortcut: '1' },
  { value: 'equilibrado' as const, label: 'No ponto', color: 'from-amber-500 to-amber-600', shortcut: '2' },
  { value: 'porrada' as const, label: 'Porrete', color: 'from-rose-500 to-orange-600', shortcut: '3' },
]

export default function DeckPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const search = useSearchParams()
  const slug = params.slug

  const [data, setData] = useState<DeckResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [studying, setStudying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [ratings, setRatings] = useState<Record<string, 'facil' | 'equilibrado' | 'porrada'>>({})
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })
  const [shareOpen, setShareOpen] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [showCards, setShowCards] = useState(false)

  const purchaseSuccess = search?.get('purchase') === 'success'

  useEffect(() => {
    if (purchaseSuccess) {
      setToast({ open: true, message: 'Compra confirmada! O deck está liberado.', type: 'success' })
    }
  }, [purchaseSuccess])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar deck')
      setData(json)
      setLikeCount(json.deck?.likeCount || 0)
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Erro ao carregar', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  // Load folder path for deck breadcrumb
  useEffect(() => {
    const folderId = data?.deck?.folderId
    if (!folderId) { setFolderPath(null); return }
    fetch('/api/flashcards/manual/folders?scope=admin')
      .then(r => r.json())
      .then(j => {
        const folders: { _id: string; name: string; parentFolderId?: string | null }[] = j.folders || []
        const map = new Map(folders.map(f => [f._id, f]))
        function getPath(id: string): string {
          const f = map.get(id)
          if (!f) return ''
          if (!f.parentFolderId) return f.name
          const parent = getPath(f.parentFolderId)
          return parent ? `${parent} › ${f.name}` : f.name
        }
        const path = getPath(folderId as string)
        setFolderPath(path || null)
      })
      .catch(() => {})
  }, [data?.deck?.folderId])

  // Atalhos de teclado durante estudo
  useEffect(() => {
    if (!studying) return
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f) }
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (flipped) {
        if (e.key === '1') rate('facil')
        else if (e.key === '2') rate('equilibrado')
        else if (e.key === '3') rate('porrada')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studying, currentIndex, flipped, data])

  function goNext() {
    if (!data) return
    if (currentIndex < data.cards.length - 1) {
      setCurrentIndex(i => i + 1)
      setFlipped(false); setShowComment(false); setShowHint(false)
    }
  }
  function goPrev() {
    if (!data) return
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setFlipped(false); setShowComment(false); setShowHint(false)
    }
  }
  function rate(value: 'facil' | 'equilibrado' | 'porrada') {
    if (!data) return
    const card = data.cards[currentIndex]
    if (!card) return
    setRatings(prev => ({ ...prev, [card._id]: value }))
    if (currentIndex < data.cards.length - 1) {
      setTimeout(() => goNext(), 250)
    }
  }

  async function finishSession() {
    if (!data) return
    try {
      const entries = Object.entries(ratings).map(([cardId, rating]) => ({ cardId, rating, completedAt: new Date() }))
      await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, startedAt: new Date() }),
      })
    } catch {}
    setStudying(false)
    setToast({ open: true, message: 'Sessão concluída!', type: 'success' })
  }

  async function toggleLike() {
    try {
      const method = liked ? 'DELETE' : 'POST'
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/like`, { method })
      const json = await res.json()
      if (res.ok) {
        setLiked(!liked)
        setLikeCount(json.likeCount ?? likeCount + (liked ? -1 : 1))
      }
    } catch {}
  }

  function buy() {
    if (!data?.deck.linkedMaterialId) {
      setToast({ open: true, message: 'Este deck ainda não tem produto vinculado. Contate o administrador.', type: 'error' })
      return
    }
    router.push(`/materiais/checkout?type=material&id=${data.deck.linkedMaterialId}`)
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh] text-slate-500">Carregando deck...</div>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
          <Lock className="h-10 w-10 text-slate-400" />
          <h1 className="text-xl font-semibold">Deck não encontrado ou indisponível</h1>
          <Button onClick={() => router.push('/flashcards')}>Voltar para Flashcards</Button>
        </div>
      </AppShell>
    )
  }

  const { deck, cards, access } = data
  const isLocked = !access.hasAccess
  const isPaid = deck.pricing === 'paid'

  if (studying) {
    const card = cards[currentIndex]
    const total = cards.length
    const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => setStudying(false)} className="gap-1"><ArrowLeft className="h-4 w-4" />Sair</Button>
            <span className="text-sm text-slate-500 dark:text-slate-400">{currentIndex + 1} / {total}</span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-6">
            <motion.div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" animate={{ width: `${progress}%` }} />
          </div>

          {card && (
            <FlashcardCardView
              key={card._id}
              card={card}
              flipped={flipped}
              onFlip={() => setFlipped(f => !f)}
              showComment={showComment}
              onToggleComment={() => setShowComment(s => !s)}
              showHint={showHint}
              onToggleHint={() => setShowHint(s => !s)}
            />
          )}

          <div className="mt-6 space-y-3">
            {/* Rating buttons — always full width row */}
            <div className="flex gap-2 justify-center flex-wrap">
              {RATINGS.map(r => (
                <button
                  key={r.value}
                  onClick={() => rate(r.value)}
                  disabled={!flipped}
                  className={cn(
                    'rounded-full px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r transition flex-1 min-w-[90px] max-w-[140px]',
                    r.color,
                    !flipped && 'opacity-40 cursor-not-allowed',
                    ratings[card?._id] === r.value && 'ring-2 ring-offset-2 ring-white dark:ring-offset-slate-900'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Nav buttons */}
            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0}>
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              {currentIndex < total - 1 ? (
                <Button onClick={goNext}>Próximo <ChevronRight className="h-4 w-4" /></Button>
              ) : (
                <Button onClick={finishSession} className="bg-gradient-to-r from-violet-600 to-fuchsia-600">
                  <Trophy className="h-4 w-4" /> Concluir
                </Button>
              )}
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-slate-400">
            Espaço: virar &nbsp;·&nbsp; ← →: navegar &nbsp;·&nbsp; 1/2/3: avaliar
          </p>
        </div>
        <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={(open) => setToast(t => ({ ...t, open }))} />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" onClick={() => router.push('/flashcards')} className="gap-1"><ArrowLeft className="h-4 w-4" />Flashcards</Button>
        </div>

        {/* Hero */}
        <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 mb-6">
          <div className="relative aspect-[4/1] min-h-[140px] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500">
            {deck.coverImage && (
              <Image src={deck.coverImage} alt="" fill className="object-cover opacity-90" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-white">
              <div className="flex items-center gap-2 mb-2 text-xs font-medium">
                <VisibilityBadge visibility={deck.visibility} />
                {deck.ownerType === 'admin' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5"><Crown className="h-3 w-3" /> Oficial</span>
                )}
                {isPaid && !access.isPurchased && !access.isOwner && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/90 px-2.5 py-0.5"><Lock className="h-3 w-3" /> R$ {deck.price?.toFixed(2)}</span>
                )}
                {access.isPurchased && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5"><CheckCircle2 className="h-3 w-3" /> Adquirido</span>
                )}
              </div>
              {folderPath && (
                <div className="mb-2 flex items-center gap-1.5 text-xs text-white/65">
                  <Folder className="h-3 w-3 shrink-0" />
                  <span>{folderPath}</span>
                </div>
              )}
              <h1 className="text-2xl md:text-4xl font-bold leading-tight drop-shadow">{deck.title}</h1>
              {deck.description && <p className="mt-2 text-sm md:text-base text-white/85 line-clamp-2 max-w-3xl">{deck.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/80">
                <span>por <strong className="font-semibold">{deck.ownerName}</strong></span>
                <span>·</span>
                <span>{deck.cardCount} cartões</span>
                <span>·</span>
                <span>{deck.viewCount} visualizações</span>
                {(deck.tags || []).slice(0, 4).map(t => (
                  <span key={t} className="rounded-full bg-white/15 px-2 py-0.5 ring-1 ring-white/20">#{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLike}
                className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1',
                  liked
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/30'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-white/10 hover:bg-slate-200/70')}
              >
                <Heart className={cn('h-4 w-4', liked && 'fill-current')} /> {likeCount}
              </button>
              {access.isOwner && (
                <Button variant="outline" onClick={() => setShareOpen(true)}><Share2 className="h-4 w-4" /> Compartilhar</Button>
              )}
              {access.isOwner && (
                <Link href={`/flashcards/d/${deck.slug}/editar`}>
                  <Button variant="outline"><Edit3 className="h-4 w-4" /> Editar</Button>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isLocked && isPaid ? (
                <button
                  onClick={buy}
                  disabled={purchasing}
                  className="relative overflow-hidden inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-bold tracking-wide text-white transition-all duration-200 active:scale-[0.97] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, rgba(109,40,217,0.95) 0%, rgba(147,51,234,0.90) 50%, rgba(192,38,211,0.85) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(216,180,254,0.40)',
                    boxShadow: '0 0 28px rgba(139,92,246,0.50), 0 8px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.20)',
                  }}
                >
                  <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
                  <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                  {`Comprar – R$ ${deck.price?.toFixed(2).replace('.', ',')}`}
                </button>
              ) : isLocked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/5 px-3 py-2 text-xs text-slate-500"><Lock className="h-3.5 w-3.5" /> Sem acesso</span>
              ) : (
                <button
                  onClick={() => { setStudying(true); setCurrentIndex(0); setFlipped(false) }}
                  className="relative overflow-hidden inline-flex items-center gap-2.5 rounded-2xl px-8 py-3.5 text-base font-bold tracking-wide text-white transition-all duration-200 active:scale-[0.97] hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, rgba(4,120,87,1) 0%, rgba(5,150,105,0.95) 50%, rgba(16,185,129,0.90) 100%)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(52,211,153,0.55)',
                    boxShadow: '0 0 30px rgba(16,185,129,0.50), 0 8px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.25)',
                  }}
                >
                  <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent pointer-events-none" />
                  <Play className="h-4.5 w-4.5 fill-current flex-shrink-0" />
                  Estudar agora
                </button>
              )}
            </div>
          </div>
        </div>

        {isLocked ? (
          <LockedPreview deck={deck} access={access} />
        ) : (
          <div>
            <button
              onClick={() => setShowCards(s => !s)}
              className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors mb-3"
            >
              <span className="flex items-center gap-2">
                {showCards ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                {showCards ? 'Ocultar lista de cartões' : `Ver lista de cartões (${cards.length})`}
              </span>
              {!showCards && <span className="text-xs text-slate-400">Evite spoiler — expanda quando quiser revisar</span>}
            </button>
            <AnimatePresence>
              {showCards && (
                <motion.div
                  key="cards-list"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <CardsList
                    cards={cards}
                    canManage={access.canManage ?? access.isOwner}
                    slug={deck.slug}
                    onCardsDeleted={load}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {access.isOwner && shareOpen && (
          <ShareDialog deckSlug={deck.slug} onClose={() => setShareOpen(false)} onSuccess={() => setToast({ open: true, message: 'Compartilhado com sucesso', type: 'success' })} />
        )}
      </div>
      <ToastAlert open={toast.open} message={toast.message} type={toast.type} onOpenChange={(open) => setToast(t => ({ ...t, open }))} />
    </AppShell>
  )
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  if (visibility === 'public') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-white"><Globe className="h-3 w-3" /> Público</span>
  }
  if (visibility === 'unlisted') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/90 px-2.5 py-0.5 text-white"><LinkIcon className="h-3 w-3" /> Não-listado</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/80 px-2.5 py-0.5 text-white"><EyeOff className="h-3 w-3" /> Privado</span>
}

function LockedPreview({ deck, access }: { deck: any; access: AccessFlags }) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-8 text-center">
      <Lock className="h-10 w-10 mx-auto text-slate-400 mb-3" />
      <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Conteúdo restrito</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        {deck.pricing === 'paid'
          ? 'Adquira este deck para acessar todos os cartões.'
          : (deck.allowedGroups?.length ? 'Este deck é restrito a grupos específicos.' : 'Você ainda não tem acesso a este deck.')}
      </p>
    </div>
  )
}

function CardsList({
  cards, canManage, slug, onCardsDeleted,
}: { cards: any[]; canManage: boolean; slug: string; onCardsDeleted: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const allSelected = cards.length > 0 && selected.size === cards.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(cards.map(c => c._id)))
    }
  }

  function toggleCard(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function deleteSelected() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(slug)}/cards`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: Array.from(selected) }),
      })
      if (res.ok) {
        setSelected(new Set())
        setConfirmDelete(false)
        onCardsDeleted()
      }
    } finally {
      setDeleting(false)
    }
  }

  if (!cards.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/15 p-10 text-center">
        <Sparkles className="h-8 w-8 mx-auto text-slate-400 mb-3" />
        <p className="text-slate-500 dark:text-slate-400">Esse deck ainda não tem cartões.</p>
        {canManage && (
          <Link href={`/flashcards/d/${slug}/editar`} className="inline-block mt-4">
            <Button>Adicionar cartões</Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/10">
          {canManage && (
            <button
              type="button"
              onClick={toggleAll}
              className="shrink-0 text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors"
              aria-label={allSelected ? 'Desselecionar todos' : 'Selecionar todos'}
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-violet-600 dark:text-violet-300" />
              ) : someSelected ? (
                <Square className="h-4 w-4 opacity-50" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          )}
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white flex-1">{cards.length} cartões</h2>
          {canManage && (
            <Link href={`/flashcards/d/${slug}/editar`}>
              <Button variant="outline" size="sm"><Edit3 className="h-3.5 w-3.5 mr-1" />Editar deck</Button>
            </Link>
          )}
        </div>

        {/* Bulk action bar */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-3 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20">
                <span className="text-sm font-medium text-rose-700 dark:text-rose-300 flex-1">
                  {selected.size} {selected.size === 1 ? 'cartão selecionado' : 'cartões selecionados'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Limpar
                </button>
                <Button
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir selecionados
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards list */}
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {cards.map((c, i) => (
            <li
              key={c._id}
              className={cn(
                'flex items-start gap-3 px-5 py-3 transition-colors',
                selected.has(c._id)
                  ? 'bg-violet-50 dark:bg-violet-500/10'
                  : 'hover:bg-slate-50/60 dark:hover:bg-white/5',
                canManage && 'cursor-pointer'
              )}
              onClick={() => canManage && toggleCard(c._id)}
            >
              {canManage && (
                <div className="shrink-0 mt-0.5 text-slate-300 dark:text-slate-600">
                  {selected.has(c._id) ? (
                    <CheckSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </div>
              )}
              <span className="text-xs font-mono text-slate-400 mt-1 w-6 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                  {c.kind === 'hidden_word' && c.hiddenWord ? c.hiddenWord.phrase : (c.front?.text || '(sem texto)')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {c.kind === 'hidden_word' ? `Palavra: ${c.hiddenWord?.word}` : (c.back?.text || '')}
                </p>
              </div>
              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {c.kind === 'hidden_word' && (
                  <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 font-medium">Palavra oculta</span>
                )}
                {c.comment && (
                  <span className="rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[10px] px-2 py-0.5 font-medium">Comentado</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Confirm delete dialog */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Excluir cartões?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selected.size} {selected.size === 1 ? 'cartão será excluído' : 'cartões serão excluídos'} permanentemente.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ShareDialog({ deckSlug, onClose, onSuccess }: { deckSlug: string; onClose: () => void; onSuccess: () => void }) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<{ _id: string; name: string; emailMasked: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [shared, setShared] = useState<string[]>([])
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  useEffect(() => {
    if (query.length < 3) { setUsers([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flashcards/manual/users/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setUsers(json.users || [])
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function shareWith(userId: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/flashcards/manual/${encodeURIComponent(deckSlug)}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        setShared(s => [...s, userId])
        onSuccess()
      }
    } finally { setBusy(false) }
  }

  function copyLink() {
    const url = `${window.location.origin}/flashcards/d/${deckSlug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1500)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full md:max-w-lg md:rounded-3xl rounded-t-3xl border border-slate-200 dark:border-white/10 p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">Compartilhar deck</h3>
        <p className="text-sm text-slate-500 mb-4">Convide outros usuários ou compartilhe o link.</p>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-3 flex items-center gap-2 mb-4 bg-slate-50 dark:bg-white/5">
          <LinkIcon className="h-4 w-4 text-slate-500" />
          <span className="flex-1 text-xs text-slate-600 dark:text-slate-300 truncate">{`${typeof window !== 'undefined' ? window.location.origin : ''}/flashcards/d/${deckSlug}`}</span>
          <button onClick={copyLink} className="text-xs font-semibold text-violet-600 hover:text-violet-700">
            {copyState === 'copied' ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm"
        />

        <ul className="mt-3 space-y-2 max-h-64 overflow-auto">
          {users.map(u => (
            <li key={u._id} className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-white/10 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-slate-500">{u.emailMasked}</p>
              </div>
              <Button size="sm" onClick={() => shareWith(u._id)} disabled={busy || shared.includes(u._id)}>
                {shared.includes(u._id) ? 'Enviado' : 'Compartilhar'}
              </Button>
            </li>
          ))}
          {query.length >= 3 && users.length === 0 && <li className="text-sm text-slate-500 text-center py-4">Nenhum usuário encontrado</li>}
        </ul>

        <div className="mt-5 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  )
}
