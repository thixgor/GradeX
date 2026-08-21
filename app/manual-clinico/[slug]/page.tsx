'use client'

import { useState, useEffect, useCallback, useMemo, useRef, Suspense, type PointerEvent as RPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Dna,
  Stethoscope,
  Pill,
  GitBranch,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Activity,
  Layers,
  ClipboardList,
  CircleDot,
  Zap,
  Heart,
  Syringe,
  BookMarked,
  ShieldAlert,
  FlaskConical,
  X,
  EyeOff,
  Maximize2,
  Image as ImageIcon,
  Film,
  Volume2,
  Play,
  GalleryHorizontalEnd,
  Share2,
  Check,
  Link2,
  Lock,
  Crown,
  ArrowRight,
  MousePointerClick,
} from 'lucide-react'
import { type Patologia, type AreaSaude } from '@/lib/types/manual-clinico'
import { FocusSessionButton } from '@/components/focus-session-button'
import { useTrackView } from '@/hooks/use-track-view'
import { RichTextRenderer, extractYouTubeId, tokenizeLine, AudioEmbed } from '@/components/manual-clinico/rich-text-renderer'
import { HighlightableRichText } from '@/components/manual-clinico/highlightable-rich-text'
import { ShareQRButton } from '@/components/manual-clinico/share-qr-button'
import {
  type SlugHighlights,
  type ManualHighlight,
  loadHighlights,
  saveHighlights,
} from '@/lib/manual-clinico-highlights'

interface ManualProduct {
  label: string
  benefitText: string
  shortDescription: string
  ctaText: string
  coverImageUrl?: string
  isActive: boolean
  price: number
  currentPrice: number
  promotionalPrice: number | null
  hasActivePromotion: boolean
  freeAccessMode?: 'quantity' | 'list'
  freeQuantity?: number
}

interface ManualPatologiaResponse extends Patologia {
  preview?: string
  isFree?: boolean
  isFreeClaimed?: boolean
  canClaimFree?: boolean
  isPremiumLocked?: boolean
  accessStatus?: 'free' | 'free_claimed' | 'free_claimed_now' | 'free_available' | 'login_required' | 'premium_unlocked' | 'locked'
  product?: ManualProduct
  access?: {
    hasFullAccess: boolean
    reason: string
    freeQuota?: {
      mode: 'quantity' | 'list'
      limit: number
      used: number
      remaining: number
      isAuthenticated: boolean
    }
  }
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

const AREA_BADGE: Record<AreaSaude, string> = {
  'Medicina': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  'Psicologia': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  'Odontologia': 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  'Biomedicina': 'bg-orange-500/20 text-orange-300 border-orange-400/30',
}

/* ═══════════════════════════════════════════
   COLLAPSIBLE SECTION
   ═══════════════════════════════════════════ */
function Section({ title, icon: Icon, children, defaultOpen = true, variant = 'default', sectionId }: {
  title: string
  icon: any
  children: React.ReactNode
  defaultOpen?: boolean
  variant?: 'default' | 'warning'
  sectionId?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  const borderColor = variant === 'warning' ? 'border-amber-500/20' : 'border-border/60'
  const hoverBorder = variant === 'warning' ? 'hover:border-amber-500/30' : 'hover:border-border'

  return (
    <div id={sectionId} className={`rounded-2xl border ${borderColor} bg-card/50 backdrop-blur-sm transition-all duration-200 ${hoverBorder} scroll-mt-6`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-5 hover:bg-accent/30 transition-colors text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 p-2.5 rounded-xl ${variant === 'warning' ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
            <Icon className={`h-5 w-5 ${variant === 'warning' ? 'text-amber-500' : 'text-primary'}`} />
          </div>
          <h2 className="font-bold text-[17px] text-foreground truncate">{title}</h2>
        </div>
        <div className={`shrink-0 p-1.5 rounded-full transition-colors ${open ? 'bg-primary/10' : 'bg-accent/50'}`}>
          {open
            ? <ChevronUp className="h-4 w-4 text-primary" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="border-t border-border/40 pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

function PremiumPreviewCard({ patologia, onCheckout }: { patologia: ManualPatologiaResponse; onCheckout: () => void }) {
  const product = patologia.product
  const freeQuota = patologia.access?.freeQuota
  const needsLoginForFreeChoice = patologia.accessStatus === 'login_required' && !!freeQuota?.limit
  const hasExhaustedFreeChoices = patologia.accessStatus === 'locked' && freeQuota?.mode === 'quantity' && freeQuota.limit > 0

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-400/10 via-card/70 to-emerald-400/10 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(52,211,153,0.16),transparent_30%)]" />
      <div className="relative">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-2xl bg-amber-300/15 p-3 text-amber-300">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-500">Conteúdo Plus+</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Desbloqueie o Manual Clínico Completo</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {needsLoginForFreeChoice
                ? `Entre para escolher esta patologia como uma das suas ${freeQuota?.limit} visualizações gratuitas.`
                : hasExhaustedFreeChoices
                  ? `Voce ja usou suas ${freeQuota?.limit} visualizações gratuitas. O Plus+ libera o acervo completo.`
                  : product?.shortDescription || 'Acesso completo a 220+ patologias aprofundadas com diagnóstico, tratamento, diferenciais, farmacologia e fluxogramas.'}
            </p>
          </div>
        </div>

        {patologia.preview ? (
          <div className="mb-5 rounded-2xl border border-white/10 bg-background/45 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Preview</p>
            <RichTextRenderer text={patologia.preview} className="text-sm leading-relaxed text-foreground/80" />
            <div className="mt-4 h-16 rounded-xl bg-gradient-to-b from-transparent to-background/80 blur-[0.2px]" />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">{product?.benefitText || 'Acesso completo a patologias aprofundadas'}</p>
            {product?.isActive && (
              <p className="mt-1 text-sm text-muted-foreground">
                {needsLoginForFreeChoice ? (
                  <span className="font-black text-primary">Escolha gratuita disponível após login</span>
                ) : (
                  <>
                    {product.hasActivePromotion && <span className="mr-2 line-through">{formatBRL(product.price)}</span>}
                    <span className="font-black text-primary">{product.currentPrice <= 0 ? 'Grátis' : formatBRL(product.currentPrice)}</span>
                  </>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCheckout}
            disabled={!product?.isActive}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Crown className="h-4 w-4" />
            {needsLoginForFreeChoice
              ? 'Entrar e abrir grátis'
              : product?.isActive ? (product.ctaText || 'Desbloquear Manual Clínico Completo') : 'Produto indisponível'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   FLUXOGRAMA RENDERER
   ═══════════════════════════════════════════ */
function FluxogramaRenderer({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  return (
    <div className="flex flex-col items-center gap-0 py-2">
      {lines.map((line, i) => {
        const isArrow = /^[→↓⬇|▼►➜➔⇒]+$/.test(line) || line === '|' || line === 'v' || line === 'V'
        const isConditional = /^(Se |If |Sim:|Não:|Sim →|Não →|Yes:|No:)/i.test(line)
        const isSplit = line.includes(' → ') && isConditional

        if (isArrow) {
          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <div className="w-0.5 h-5 bg-primary/30 rounded-full" />
              <ChevronDown className="h-4 w-4 text-primary/50 -mt-1" />
            </div>
          )
        }

        const prevIsArrow = i > 0 && (/^[→↓⬇|▼►➜➔⇒]+$/.test(lines[i - 1]) || lines[i - 1] === '|' || lines[i - 1] === 'v' || lines[i - 1] === 'V')

        if (isSplit) {
          const parts = line.split(' → ').map(s => s.trim())
          return (
            <div key={i} className="w-full max-w-md">
              {!prevIsArrow && <FlowConnector />}
              <div className="relative border-2 border-amber-500/30 bg-amber-950/30 rounded-xl p-3.5 text-center mx-auto">
                <Zap className="h-3.5 w-3.5 text-amber-400 mx-auto mb-1.5" />
                <RichTextRenderer text={parts[0]} className="text-sm font-semibold text-amber-200" />
              </div>
              {parts.length > 1 && (
                <>
                  <FlowConnector />
                  <div className="border border-border/60 bg-card/80 rounded-xl p-3 text-center mx-auto max-w-sm">
                    <RichTextRenderer text={parts.slice(1).join(' → ')} className="text-sm text-foreground/80" />
                  </div>
                </>
              )}
            </div>
          )
        }

        if (isConditional) {
          return (
            <div key={i} className="w-full max-w-md">
              {!prevIsArrow && <FlowConnector />}
              <div className="relative border-2 border-amber-500/30 bg-amber-950/30 rounded-xl p-3.5 text-center mx-auto">
                <RichTextRenderer text={line} className="text-sm font-semibold text-amber-200" />
              </div>
            </div>
          )
        }

        const isFirst = i === 0
        const isLast = i === lines.length - 1

        return (
          <div key={i} className="w-full max-w-md">
            {i > 0 && !prevIsArrow && <FlowConnector />}
            <div className={`relative border rounded-xl p-3.5 text-center mx-auto transition-colors ${
              isFirst
                ? 'border-primary/40 bg-primary/10'
                : isLast
                ? 'border-emerald-500/40 bg-emerald-950/20'
                : 'border-border/60 bg-card/60 hover:bg-card/80'
            }`}>
              {isFirst && <CircleDot className="h-3.5 w-3.5 text-primary mx-auto mb-1" />}
              <RichTextRenderer text={line} className={`text-sm font-medium ${
                isFirst ? 'text-primary' :
                isLast ? 'text-emerald-400' :
                'text-foreground/90'
              }`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FlowConnector() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-0.5 h-4 bg-border/50 rounded-full" />
      <ChevronDown className="h-3 w-3 text-border -mt-0.5" />
    </div>
  )
}

/* ═══════════════════════════════════════════
   FARMACO CARD
   ═══════════════════════════════════════════ */
function FarmacoCard({ farmaco }: { farmaco: any }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-5 hover:bg-card/80 transition-colors">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10 shrink-0">
          <Syringe className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-base text-foreground"><RichTextRenderer text={farmaco.medicamento} className="inline" /></h4>
          {farmaco.classe && (
            <RichTextRenderer text={farmaco.classe} className="text-sm text-muted-foreground mt-0.5" />
          )}
        </div>
      </div>

      <div className="space-y-3">
        {farmaco.mecanismo_acao && (
          <div className="rounded-lg bg-primary/[0.05] border border-primary/10 p-3">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-primary mb-1.5">Mecanismo de Ação</p>
            <RichTextRenderer text={farmaco.mecanismo_acao} className="text-[13px] leading-relaxed text-foreground/85" />
          </div>
        )}
        {farmaco.dose_usual && (
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-primary shrink-0">Dose:</span>
            <RichTextRenderer text={farmaco.dose_usual} className="text-[13px] text-foreground/85 inline" />
          </div>
        )}
        {farmaco.efeitos_colaterais?.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 mb-2">Efeitos Colaterais</p>
            <div className="flex flex-wrap gap-1.5">
              {farmaco.efeitos_colaterais.map((e: string, i: number) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">{e}</span>
              ))}
            </div>
          </div>
        )}
        {farmaco.contraindicacoes?.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-red-400 mb-2">Contraindicações</p>
            <div className="flex flex-wrap gap-1.5">
              {farmaco.contraindicacoes.map((c: string, i: number) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 font-medium">{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   IMAGE LIGHTBOX
   ═══════════════════════════════════════════ */
function ImageLightbox({
  src, alt, caption, onClose,
}: {
  src: string
  alt: string
  caption?: string
  onClose: () => void
}) {
  const [showCaption, setShowCaption] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Fechar"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Image container */}
      <div
        className="relative z-10 max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
          draggable={false}
        />

        {/* Caption toggle + content */}
        {caption && (
          <div className="mt-3 w-full max-w-3xl">
            <button
              onClick={() => setShowCaption(!showCaption)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium transition-colors mx-auto"
            >
              <FileText className="h-3.5 w-3.5" />
              {showCaption ? 'Ocultar legenda' : 'Ver legenda'}
              {showCaption
                ? <ChevronUp className="h-3.5 w-3.5" />
                : <ChevronDown className="h-3.5 w-3.5" />
              }
            </button>
            {showCaption && (
              <div className="mt-2 px-5 py-4 rounded-xl bg-white/10 backdrop-blur-md text-white/90 text-sm leading-relaxed max-h-[40vh] overflow-y-auto">
                <RichTextRenderer text={caption} className="text-white/90 [&_strong]:text-white [&_em]:text-white/80 [&_a]:text-primary" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

/* ═══════════════════════════════════════════
   SECTION NAV (floating glassmorphism TOC)
   ═══════════════════════════════════════════ */
interface SectionEntry {
  id: string
  label: string
  icon: any
  sub?: boolean
}

/** Liquid-glass bubble that follows the hovered / active item */
function NavGlassBubble({
  navRef,
  hoveredIndex,
  visible,
}: {
  navRef: React.RefObject<HTMLElement | null>
  hoveredIndex: number | null
  visible: boolean
}) {
  const springY = { stiffness: 500, damping: 38, mass: 0.6 }
  const springH = { stiffness: 400, damping: 32, mass: 0.4 }
  const squeeze = useSpring(useMotionValue(1), { stiffness: 600, damping: 28 })
  const bubbleY = useSpring(useMotionValue(0), springY)
  const bubbleH = useSpring(useMotionValue(36), springH)

  useEffect(() => {
    if (hoveredIndex === null || !navRef.current) return
    const items = navRef.current.querySelectorAll<HTMLElement>('[data-nav-item]')
    const item = items[hoveredIndex]
    if (!item) return
    const navRect = navRef.current.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    bubbleY.set(itemRect.top - navRect.top + navRef.current.scrollTop)
    bubbleH.set(itemRect.height)
    squeeze.set(0.97)
    const t = setTimeout(() => squeeze.set(1), 60)
    return () => clearTimeout(t)
  }, [hoveredIndex, navRef, bubbleY, bubbleH, squeeze])

  return (
    <AnimatePresence>
      {visible && hoveredIndex !== null && (
        <motion.div
          className="rounded-lg border border-border bg-card shadow-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            top: 0,
            left: 4,
            right: 4,
            y: bubbleY,
            height: bubbleH,
            scaleX: squeeze,
            borderRadius: 14,
            zIndex: 0,
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        >
          
          
          
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ═══════════════════════════════════════════
   MEDIA ITEM TYPES & EXTRACTION
   ═══════════════════════════════════════════ */
type MediaType = 'video' | 'audio' | 'image' | 'figure'

interface MediaItem {
  type: MediaType
  url: string
  caption: string
  section: string // human-readable section name
  ytId?: string | null
}

const EMBED_REGEX_G = /^!(video|audio|image)\[([^\]]*)\]\(([^)]+)\)\s*$/gm

/** Scan all text fields + imagens_mecanismo to extract every media item */
function extractMedia(p: Patologia): MediaItem[] {
  const items: MediaItem[] = []

  // Scan text fields for embeds
  const fields: { key: string; label: string }[] = [
    { key: 'classificacao', label: 'Classificação' },
    { key: 'fisiopatologia', label: 'Fisiopatologia' },
    { key: 'diagnostico_semiologico', label: 'Diagnóstico Semiológico' },
    { key: 'diagnosticos_diferenciais', label: 'Diagnósticos Diferenciais' },
    { key: 'gravidade', label: 'Gravidade' },
    { key: 'tratamento', label: 'Tratamento' },
    { key: 'observacoes_clinicas', label: 'Observações Clínicas' },
    { key: 'referencias', label: 'Referências' },
  ]

  for (const { key, label } of fields) {
    const text = (p as any)[key] as string | undefined
    if (!text) continue
    const regex = new RegExp(EMBED_REGEX_G.source, 'gm')
    let m
    while ((m = regex.exec(text)) !== null) {
      const type = m[1] as 'video' | 'audio' | 'image'
      items.push({
        type,
        url: m[3],
        caption: m[2] || '',
        section: label,
        ytId: (type === 'video' || type === 'audio') ? extractYouTubeId(m[3]) : null,
      })
    }
  }

  // Figures from imagens_mecanismo
  if (p.imagens_mecanismo && p.imagens_mecanismo.length > 0) {
    p.imagens_mecanismo.forEach((img, i) => {
      items.push({
        type: 'figure',
        url: img,
        caption: p.legenda_imagens?.[i] || `Figura ${i + 1}`,
        section: 'Fisiopatologia',
      })
    })
  }

  return items
}

/* ═══════════════════════════════════════════
   MEDIA GALLERY MODAL
   ═══════════════════════════════════════════ */
const MEDIA_TABS: { type: MediaType | 'all'; label: string; icon: any }[] = [
  { type: 'all', label: 'Tudo', icon: GalleryHorizontalEnd },
  { type: 'video', label: 'Vídeos', icon: Film },
  { type: 'audio', label: 'Áudios', icon: Volume2 },
  { type: 'image', label: 'Imagens', icon: ImageIcon },
  { type: 'figure', label: 'Figuras', icon: Maximize2 },
]

function MediaGalleryModal({
  media,
  onClose,
  highlightUrl,
  slug,
}: {
  media: MediaItem[]
  onClose: () => void
  highlightUrl?: string | null
  slug: string
}) {
  const [activeTab, setActiveTab] = useState<MediaType | 'all'>('all')
  const [lightbox, setLightbox] = useState<MediaItem | null>(null)
  const [highlightedUrl, setHighlightedUrl] = useState<string | null>(highlightUrl || null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // Auto-switch to the correct tab and scroll to highlighted item
  useEffect(() => {
    if (highlightUrl) {
      const item = media.find(m => m.url === highlightUrl)
      if (item) {
        setActiveTab(item.type)
      }
    }
  }, [highlightUrl, media])

  // Scroll to highlighted item after render
  useEffect(() => {
    if (highlightedUrl && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
      // Remove highlight after 3 seconds
      const timer = setTimeout(() => setHighlightedUrl(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightedUrl, activeTab])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightbox) setLightbox(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, lightbox])

  const filtered = activeTab === 'all' ? media : media.filter(m => m.type === activeTab)

  // Count per type for badge
  const counts: Record<string, number> = { all: media.length }
  for (const m of media) counts[m.type] = (counts[m.type] || 0) + 1

  // Available tabs (only show tabs that have items)
  const availableTabs = MEDIA_TABS.filter(t => (counts[t.type] || 0) > 0)

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full sm:max-w-2xl lg:max-w-3xl max-h-[92vh] sm:max-h-[85vh] flex flex-col
          rounded-t-3xl sm:rounded-2xl overflow-hidden"
      >
        {/* Glass background */}
        
        
        

        {/* ── Header ── */}
        <div className="relative z-10 flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
          {/* Drag indicator (mobile) */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-foreground/15 sm:hidden" />

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <GalleryHorizontalEnd className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Galeria de Mídia</h2>
              <p className="text-[11px] text-muted-foreground/60">{media.length} item{media.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/[0.08] active:scale-90 transition-all text-muted-foreground hover:text-foreground touch-manipulation"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Filter tabs ── */}
        <div className="relative z-10 px-4 sm:px-6 pb-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {availableTabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.type
              const count = counts[tab.type] || 0
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 touch-manipulation
                    ${isActive
                      ? 'bg-primary/90 text-primary-foreground shadow-[0_2px_12px_hsl(var(--primary)/0.3)]'
                      : 'bg-white/[0.05] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground'
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-bold
                    ${isActive ? 'bg-white/20 text-primary-foreground' : 'bg-white/[0.06] text-muted-foreground/60'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 pb-6 overscroll-contain">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-2xl bg-white/[0.04]">
                <GalleryHorizontalEnd className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground/50">Nenhuma mídia encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((item, i) => {
                const isHighlighted = highlightedUrl === item.url
                const isCopied = copiedUrl === item.url
                return (
                  <div
                    key={`${item.type}-${i}`}
                    ref={isHighlighted ? highlightRef : undefined}
                    className={`relative group/share ${isHighlighted ? 'rounded-xl ring-2 ring-emerald-400 ring-offset-2 ring-offset-transparent animate-pulse' : ''}`}
                  >
                    <MediaCard
                      item={item}
                      onExpand={() => {
                        if (item.type === 'image' || item.type === 'figure') setLightbox(item)
                      }}
                    />
                    {/* Share media button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const shareUrl = `${window.location.origin}/manual-clinico/${slug}?galeria=1&media=${encodeURIComponent(item.url)}`
                        navigator.clipboard.writeText(shareUrl)
                        setCopiedUrl(item.url)
                        setTimeout(() => setCopiedUrl(null), 2000)
                      }}
                      className={`absolute top-3 right-3 z-20 p-1.5 rounded-lg backdrop-blur-md transition-all duration-200 touch-manipulation
                        ${isCopied
                          ? 'bg-emerald-500/90 text-white scale-100 opacity-100'
                          : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white opacity-0 group-hover/share:opacity-100 focus:opacity-100'
                        }`}
                      title="Copiar link de compartilhamento"
                    >
                      {isCopied
                        ? <Check className="h-3.5 w-3.5" />
                        : <Link2 className="h-3.5 w-3.5" />
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Image/Figure Lightbox inside gallery */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors touch-manipulation"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative z-10 max-w-[92vw] max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <img
                src={lightbox.url}
                alt={lightbox.caption}
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                draggable={false}
              />
              {lightbox.caption && (
                <div className="mt-3 px-5 py-3 rounded-xl bg-white/10 backdrop-blur-md text-white/90 text-sm leading-relaxed max-w-3xl text-center">
                  {lightbox.caption}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  )
}

/* ── Inline caption with bold/italic support ── */
function InlineCaption({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null
  const tokens = tokenizeLine(text)
  return (
    <span className={className}>
      {tokens.map((t, i) => {
        switch (t.type) {
          case 'bold':
            return <strong key={i} className="font-bold">{t.content}</strong>
          case 'italic':
            return <em key={i} className="italic">{t.content}</em>
          case 'link':
            return <a key={i} href={t.href} target="_blank" rel="noopener noreferrer" className="underline text-primary">{t.content}</a>
          default:
            return <span key={i}>{t.content}</span>
        }
      })}
    </span>
  )
}

/* ── Individual media card ── */
function MediaCard({ item, onExpand }: { item: MediaItem; onExpand: () => void }) {
  const typeConfig = {
    video: { icon: Film, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Vídeo' },
    audio: { icon: Volume2, color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Áudio' },
    image: { icon: ImageIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Imagem' },
    figure: { icon: Maximize2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Figura' },
  }
  const config = typeConfig[item.type]
  const Icon = config.icon

  if (item.type === 'video') {
    const ytId = item.ytId || extractYouTubeId(item.url)
    return (
      <div className="relative rounded-xl overflow-hidden rounded-lg border border-border bg-card shadow-sm group">
        
        <div className="relative z-10 p-1.5">
          {ytId ? (
            <div className="relative rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg"
                src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                title={item.caption || 'Vídeo'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video flex items-center justify-center rounded-lg bg-red-500/5">
              <span className="text-xs text-red-400">URL inválida</span>
            </div>
          )}
          <div className="px-2.5 py-2 flex items-center gap-2">
            <div className={`shrink-0 p-1 rounded-md ${config.bg}`}>
              <Icon className={`h-3 w-3 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground break-words">
                <InlineCaption text={item.caption || 'Vídeo'} />
              </p>
              <p className="text-[10px] text-muted-foreground/50">{item.section}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (item.type === 'audio') {
    return (
      <AudioEmbed embed={{ type: 'audio', url: item.url, caption: item.caption || 'Áudio' }} />
    )
  }

  // image or figure — clickable with thumbnail
  return (
    <div
      className="relative rounded-xl overflow-hidden rounded-lg border border-border bg-card shadow-sm cursor-pointer group"
      onClick={onExpand}
    >
      
      <div className="relative z-10 p-1.5">
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={item.url}
            alt={item.caption || 'Imagem'}
            className="w-full h-auto max-h-48 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-white/20 backdrop-blur-sm">
              <Maximize2 className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        <div className="px-2.5 py-2 flex items-center gap-2">
          <div className={`shrink-0 p-1 rounded-md ${config.bg}`}>
            <Icon className={`h-3 w-3 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground break-words">
              <InlineCaption text={item.caption || config.label} />
            </p>
            <p className="text-[10px] text-muted-foreground/50">{item.section}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   FLOATING FOCUS SESSION (glassmorphism + iridescent)
   ═══════════════════════════════════════════ */
function FloatingFocusSession() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return createPortal(
    <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[55]">
      <div className="relative rounded-lg border border-border bg-card shadow-sm overflow-visible rounded-full">
        {/* Glass surface + iridescent wave */}
        
        
        
        {/* The actual button — sits above glass layers */}
        <div className="relative z-10">
          <FocusSessionButton />
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ═══════════════════════════════════════════
   FLOATING DISEASE NAME BAR
   ═══════════════════════════════════════════ */
function FloatingDiseaseName({ nome, heroRef, slug }: { nome: string; heroRef: React.RefObject<HTMLDivElement | null>; slug: string }) {
  const [visible, setVisible] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [floatingShareCopied, setFloatingShareCopied] = useState(false)

  /* ── Drag state ── */
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const springX = useSpring(dragX, { stiffness: 300, damping: 30 })
  const springY = useSpring(dragY, { stiffness: 300, damping: 30 })
  const isDragging = useRef(false)
  const dragStartPos = useRef({ x: 0, y: 0, mx: 0, my: 0 })
  const wasDragged = useRef(false)
  const barRef = useRef<HTMLDivElement>(null)

  // Show bar when user scrolls past the hero header
  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      setVisible(rect.bottom < 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [heroRef])

  /* ── Pointer-based drag handlers ── */
  const onPointerDown = useCallback((e: RPointerEvent<HTMLDivElement>) => {
    // Only main button / single touch
    if (e.button !== 0) return
    isDragging.current = true
    wasDragged.current = false
    dragStartPos.current = { x: dragX.get(), y: dragY.get(), mx: e.clientX, my: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    e.preventDefault()
  }, [dragX, dragY])

  const onPointerMove = useCallback((e: RPointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStartPos.current.mx
    const dy = e.clientY - dragStartPos.current.my
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged.current = true

    let newX = dragStartPos.current.x + dx
    let newY = dragStartPos.current.y + dy

    // Constrain within viewport
    if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect()
      const bw = rect.width
      const bh = rect.height
      // Bar is initially centered at top: calculate base position
      const baseX = (window.innerWidth - bw) / 2
      const baseY = 12 // top-3 = 12px
      const minX = -baseX
      const maxX = window.innerWidth - baseX - bw
      const minY = -baseY
      const maxY = window.innerHeight - baseY - bh - 8
      newX = Math.max(minX, Math.min(maxX, newX))
      newY = Math.max(minY, Math.min(maxY, newY))
    }

    dragX.set(newX)
    dragY.set(newY)
  }, [dragX, dragY])

  const onPointerUp = useCallback((e: RPointerEvent<HTMLDivElement>) => {
    isDragging.current = false
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    // Only open modal on tap, not drag
    if (!wasDragged.current) {
      setModalOpen(true)
    }
  }, [])

  if (!visible || hidden) return null

  return createPortal(
    <>
      {/* ── Floating draggable bar ── */}
      <motion.div
        ref={barRef}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ x: springX, y: springY }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] sm:max-w-md select-none touch-none group"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="relative px-4 py-2.5 rounded-2xl rounded-lg border border-border bg-card shadow-sm overflow-visible cursor-grab active:cursor-grabbing">
          {/* Glass surface + iridescent border wave */}
          
          
          

          {/* Content */}
          <div className="relative z-10 flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary shadow-md shadow-primary/40 animate-pulse" />
            <span className="text-[13px] sm:text-sm font-semibold text-foreground truncate drop-shadow-sm">
              {nome}
            </span>
            <ChevronDown className="shrink-0 h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
          </div>
        </div>
      </motion.div>

      {/* ── Modal overlay ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] flex items-start justify-center pt-16 px-4"
            onClick={() => setModalOpen(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

            {/* Modal card */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm rounded-2xl overflow-visible rounded-lg border border-border bg-card shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              
              
              

              <div className="relative z-10 p-6">
                {/* Close button */}
                <button
                  onClick={() => setModalOpen(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-xl hover:bg-white/[0.12] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Decorative pulse dot */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-md shadow-primary/50 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                    Patologia
                  </span>
                </div>

                {/* Disease name */}
                <h3 className="text-lg font-bold text-foreground leading-snug pr-6">
                  {nome}
                </h3>

                {/* Divider */}
                <div className="mt-4 mb-4 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

                {/* Share button + QR */}
                <div className="flex items-stretch gap-2 mb-2">
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/manual-clinico/${slug}`
                      navigator.clipboard.writeText(url)
                      setFloatingShareCopied(true)
                      setTimeout(() => setFloatingShareCopied(false), 2000)
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                      floatingShareCopied
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/[0.08] bg-white/[0.04] hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-primary'
                    }`}
                  >
                    {floatingShareCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Link copiado!
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        Compartilhar patologia
                      </>
                    )}
                  </button>
                  <ShareQRButton
                    variant="full"
                    url={typeof window !== 'undefined' ? `${window.location.origin}/manual-clinico/${slug}` : `/manual-clinico/${slug}`}
                    title={nome}
                  />
                </div>

                {/* Hide button */}
                <button
                  onClick={() => {
                    setHidden(true)
                    setModalOpen(false)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  <EyeOff className="h-4 w-4" />
                  Ocultar barra flutuante
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  )
}

/* ═══════════════════════════════════════════
   SECTION NAV (floating glassmorphism TOC)
   ═══════════════════════════════════════════ */
function SectionNav({ sections, media = [], slug }: { sections: SectionEntry[]; media?: MediaItem[]; slug: string }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024
  )
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isTouching, setIsTouching] = useState(false)
  const [showMediaGallery, setShowMediaGallery] = useState(false)
  const [mediaHighlightUrl, setMediaHighlightUrl] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const searchParams = useSearchParams()
  const navRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Draggable position ──────────────────────────────────────────
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)

  // Set initial position on mount (top-right corner)
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024
    // On desktop, offset enough for the expanded panel (~200px); on mobile just the FAB
    const rightOffset = isDesktop ? 210 : 60
    setPos({ x: window.innerWidth - rightOffset, y: isDesktop ? 120 : 72 })
    const onResize = () => {
      setPos(prev => {
        if (!prev) return { x: window.innerWidth - 210, y: 120 }
        return {
          x: Math.min(prev.x, window.innerWidth - 44),
          y: Math.max(12, Math.min(prev.y, window.innerHeight - 44)),
        }
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Auto-open gallery from URL params (QR code deep link) ──────
  useEffect(() => {
    const galeriaParam = searchParams.get('galeria')
    const mediaParam = searchParams.get('media')
    if (galeriaParam === '1' && media.length > 0) {
      setShowMediaGallery(true)
      if (mediaParam) {
        setMediaHighlightUrl(decodeURIComponent(mediaParam))
      }
    }
  }, [searchParams, media])

  // ── First-visit coach mark for the nav button ──────────────────
  const dismissHint = useCallback(() => {
    setShowHint(false)
    try { localStorage.setItem('mc-nav-hint-seen', '1') } catch {}
  }, [])

  // Show the hint shortly after entering (only until the user has seen it)
  useEffect(() => {
    if (sections.length === 0 || typeof window === 'undefined') return
    try {
      if (localStorage.getItem('mc-nav-hint-seen') === '1') return
    } catch {}
    const t = setTimeout(() => setShowHint(true), 1100)
    // Auto-dismiss if ignored for a while so it never gets in the way
    const auto = setTimeout(() => setShowHint(false), 13000)
    return () => { clearTimeout(t); clearTimeout(auto) }
  }, [sections.length])

  // Opening the nav means the user got the message — retire the hint for good
  useEffect(() => {
    if (expanded) dismissHint()
  }, [expanded, dismissHint])

  // ── Intersection Observer ───────────────────────────────────────
  useEffect(() => {
    const ids = sections.map(s => s.id)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  // ── Close when clicking outside (mobile only) ───────────────────
  useEffect(() => {
    if (!expanded) return
    const onClick = (e: MouseEvent) => {
      if (window.innerWidth >= 1024) return // desktop stays open
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false)
        setHoveredIndex(null)
      }
    }
    document.addEventListener('pointerdown', onClick)
    return () => document.removeEventListener('pointerdown', onClick)
  }, [expanded])

  // ── Drag handlers (pointer events, works for mouse + touch) ─────
  const onDragStart = useCallback((e: RPointerEvent<HTMLButtonElement>) => {
    if (!pos) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y, moved: false }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos])

  const onDragMove = useCallback((e: RPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true
    if (!dragRef.current.moved) return
    setPos({
      x: Math.max(12, Math.min(window.innerWidth - 44, dragRef.current.origX + dx)),
      y: Math.max(12, Math.min(window.innerHeight - 44, dragRef.current.origY + dy)),
    })
  }, [])

  const onDragEnd = useCallback(() => {
    const wasDrag = dragRef.current?.moved
    dragRef.current = null
    if (!wasDrag) setExpanded(prev => !prev)
  }, [])

  // ── Touch nav: drag finger across items to select ───────────────
  const findItemIndexAtY = useCallback((clientY: number) => {
    if (!navRef.current) return null
    const items = navRef.current.querySelectorAll<HTMLElement>('[data-nav-item]')
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) return i
    }
    return null
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    setIsTouching(true)
    const idx = findItemIndexAtY(e.touches[0].clientY)
    if (idx !== null) setHoveredIndex(idx)
  }, [findItemIndexAtY])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const idx = findItemIndexAtY(e.touches[0].clientY)
    if (idx !== null) setHoveredIndex(idx)
  }, [findItemIndexAtY])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (hoveredIndex !== null && navRef.current) {
      const items = navRef.current.querySelectorAll<HTMLElement>('[data-nav-item]')
      const item = items[hoveredIndex]
      if (item) item.click()
    }
    setIsTouching(false)
    setHoveredIndex(null)
  }, [hoveredIndex])

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // On mobile, collapse after navigation; on desktop, stay expanded
      if (window.innerWidth < 1024) setExpanded(false)
    }
  }, [])

  if (sections.length === 0 || !pos) return null

  // Determine which side the panel opens to (left vs right of screen center)
  const opensLeft = pos.x > window.innerWidth / 2

  return (
    <div
      ref={containerRef}
      className="fixed z-50"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* ── FAB (draggable floating button) ── */}
      <button
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 touch-none select-none ${
          expanded
            ? 'opacity-0 pointer-events-none scale-75'
            : showHint
              ? 'opacity-100 bg-primary/10 border border-primary/40 shadow-lg shadow-primary/20 active:scale-95'
              : 'opacity-70 hover:opacity-100 active:scale-95'
        }`}
        aria-label="Navegação de seções"
      >
        {/* Attention ring while the coach mark is active */}
        {showHint && !expanded && (
          <>
            <span className="absolute inset-0 rounded-2xl ring-2 ring-primary/50 animate-ping" />
            <span className="absolute inset-0 rounded-2xl ring-2 ring-primary/50" />
          </>
        )}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <span className={`block w-4 sm:w-5 h-[2.5px] rounded-full ${showHint ? 'bg-primary' : 'bg-foreground/60'}`} />
          <span className={`block w-3 sm:w-3.5 h-[2.5px] rounded-full ${showHint ? 'bg-primary/70' : 'bg-foreground/40'}`} />
          <span className={`block w-4 sm:w-5 h-[2.5px] rounded-full ${showHint ? 'bg-primary' : 'bg-foreground/60'}`} />
        </div>
        {/* Active section dot indicator */}
        {activeId && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/50 border border-background" />
        )}
      </button>

      {/* ── First-visit coach mark ── */}
      <AnimatePresence>
        {showHint && !expanded && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full mt-3 z-20 w-max max-w-[250px]"
            style={{ [opensLeft ? 'right' : 'left']: 0 }}
          >
            {/* Arrow pointing up at the button */}
            <div
              className={`absolute -top-1.5 h-3 w-3 rotate-45 rounded-[3px] bg-primary ${opensLeft ? 'right-4' : 'left-4'}`}
            />
            <div className="relative rounded-2xl bg-primary px-3.5 py-3 text-primary-foreground shadow-xl shadow-primary/30">
              <button
                onClick={dismissHint}
                className="absolute top-2 right-2 rounded-lg p-1 text-primary-foreground/70 transition-colors hover:bg-white/15 hover:text-primary-foreground"
                aria-label="Fechar aviso"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-start gap-2.5 pr-4">
                <div className="mt-0.5 shrink-0 rounded-lg bg-white/15 p-1.5">
                  <MousePointerClick className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold leading-snug">Navegue por aqui 👆</p>
                  <p className="mt-1 text-[11.5px] leading-snug text-primary-foreground/85">
                    Use este botão para pular entre as seções da patologia e abrir a galeria de mídia.
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex justify-end">
                <button
                  onClick={() => { setExpanded(true) }}
                  className="rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold transition-colors hover:bg-white/25"
                >
                  Mostrar seções
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Expanded panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0"
            style={{ [opensLeft ? 'right' : 'left']: 0 }}
          >
            <div className="relative min-w-[180px]">
              {/* Glass background */}
              
              
              

              {/* Header with drag handle + close */}
              <div className="relative z-10 flex items-center justify-between px-3 pt-2.5 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Seções</span>
                <button
                  onClick={() => { setExpanded(false); setHoveredIndex(null) }}
                  className="p-1 rounded-lg hover:bg-white/[0.1] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Nav items */}
              <nav
                ref={navRef}
                className="relative z-10 px-1.5 pb-2.5 select-none max-h-[60vh] overflow-y-auto"
                style={{ touchAction: 'none' }}
                onMouseEnter={() => setHoveredIndex(sections.findIndex(s => s.id === activeId))}
                onMouseLeave={() => { if (!isTouching) setHoveredIndex(null) }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <NavGlassBubble
                  navRef={navRef}
                  hoveredIndex={hoveredIndex}
                  visible={hoveredIndex !== null}
                />

                {sections.map((section, i) => {
                  const Icon = section.icon
                  const isActive = activeId === section.id
                  return (
                    <button
                      key={section.id}
                      data-nav-item
                      onClick={() => scrollTo(section.id)}
                      onMouseEnter={() => setHoveredIndex(i)}
                      className={`relative z-10 w-full flex items-center gap-2.5 rounded-xl py-2 transition-colors duration-150 text-left ${
                        section.sub ? 'px-3 pl-7' : 'px-3'
                      } ${
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className={`${section.sub ? 'h-3 w-3' : 'h-3.5 w-3.5'} shrink-0 transition-colors ${
                        isActive ? 'text-primary' : ''
                      }`} />
                      <span className={`${section.sub ? 'text-[11px]' : 'text-[12px]'} font-medium whitespace-nowrap`}>
                        {section.label}
                      </span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </nav>

              {/* Media gallery button */}
              {media.length > 0 && (
                <div className="relative z-10 px-2.5 pb-2.5">
                  <div className="h-px bg-foreground/[0.06] mx-1 mb-2" />
                  <button
                    onClick={() => { setShowMediaGallery(true); if (window.innerWidth < 1024) setExpanded(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left
                      bg-primary/[0.06] hover:bg-primary/[0.12] active:scale-[0.97]
                      text-primary transition-all duration-200 touch-manipulation"
                  >
                    <GalleryHorizontalEnd className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[12px] font-semibold whitespace-nowrap">Galeria de Mídia</span>
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10">
                      {media.length}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Gallery Modal */}
      <AnimatePresence>
        {showMediaGallery && media.length > 0 && (
          <MediaGalleryModal
            media={media}
            onClose={() => { setShowMediaGallery(false); setMediaHighlightUrl(null) }}
            highlightUrl={mediaHighlightUrl}
            slug={slug}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════
   PAGE WRAPPER
   ═══════════════════════════════════════════ */
export default function PatologiaPage() {
  return (
    <AppShell allowGuest showHeader={false}>
      <PatologiaContent />
    </AppShell>
  )
}

/* ═══════════════════════════════════════════
   MAIN CONTENT
   ═══════════════════════════════════════════ */
function PatologiaContent() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [patologia, setPatologia] = useState<ManualPatologiaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [farmaTab, setFarmaTab] = useState<'primeira' | 'segunda' | 'terceira'>('primeira')
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; caption?: string } | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [pdfProgress, setPdfProgress] = useState<{ label: string; pct: number } | null>(null)
  const [sinonimosExpanded, setSinonimosExpanded] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  // ── Highlights ────────────────────────────────────────────────────
  const [highlights, setHighlights] = useState<SlugHighlights>({})
  const [hasHL, setHasHL] = useState(false)

  // Load highlights when slug is known
  useEffect(() => {
    if (!slug) return
    const loaded = loadHighlights(slug)
    setHighlights(loaded)
    setHasHL(Object.values(loaded).some(arr => arr.length > 0))
  }, [slug])

  const updateField = useCallback((field: string, arr: ManualHighlight[]) => {
    setHighlights(prev => {
      const next = { ...prev, [field]: arr }
      if (slug) saveHighlights(slug, next)
      setHasHL(Object.values(next).some(a => a.length > 0))
      return next
    })
  }, [slug])

  function clearPageHighlights() {
    setHighlights({})
    if (slug) saveHighlights(slug, {})
    setHasHL(false)
  }

  useEffect(() => {
    // Pre-warm PDF fonts + logo in background while content loads
    import('@/lib/patologia-pdf-generator').then(m => m.prewarmManualClinicoPDFAssets()).catch(() => {})

    async function load() {
      try {
        const res = await fetch(`/api/manual-clinico/${slug}`)
        if (!res.ok) { router.push('/manual-clinico'); return }
        const data = await res.json()
        setPatologia(data)
        document.title = `${data.nome} — Manual Clínico | DomineAqui`
      } catch {
        router.push('/manual-clinico')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug, router])

  // Registra a abertura da patologia para o painel de estatísticas.
  useTrackView(
    patologia
      ? {
          kind: 'manual_patologia_open',
          resourceId: slug,
          resourceTitle: patologia.nome,
          meta: { sistema: patologia.sistema || '' },
        }
      : null,
    !!patologia
  )

  // ── Build sections list for floating nav (must be before early returns) ──
  const farma = patologia?.farmacologia
  const navSections = useMemo<SectionEntry[]>(() => {
    if (!patologia) return []
    const s: SectionEntry[] = []
    if (patologia.classificacao) s.push({ id: 'sec-classificacao', label: 'Classificação', icon: Layers })
    if (patologia.fisiopatologia) {
      s.push({ id: 'sec-fisiopatologia', label: 'Fisiopatologia', icon: Dna })
      if (patologia.imagens_mecanismo && patologia.imagens_mecanismo.length > 0) {
        s.push({ id: 'sec-figuras', label: 'Figuras', icon: ImageIcon, sub: true })
      }
    }
    if (patologia.diagnostico_semiologico) s.push({ id: 'sec-diagnostico', label: 'Diagnóstico', icon: Stethoscope })
    if (patologia.diagnosticos_diferenciais) s.push({ id: 'sec-diferenciais', label: 'Diferenciais', icon: ClipboardList })
    if (patologia.gravidade) s.push({ id: 'sec-gravidade', label: 'Gravidade', icon: ShieldAlert })
    if (patologia.tratamento) s.push({ id: 'sec-tratamento', label: 'Tratamento', icon: Heart })
    if (farma && (farma.primeira_linha?.length > 0 || farma.segunda_linha?.length > 0)) {
      s.push({ id: 'sec-farmacologia', label: 'Farmacologia', icon: FlaskConical })
    }
    if (patologia.fluxograma_tratamento) s.push({ id: 'sec-fluxograma', label: 'Fluxograma', icon: GitBranch })
    if (patologia.observacoes_clinicas) s.push({ id: 'sec-observacoes', label: 'Observações', icon: AlertTriangle })
    if (patologia.referencias) s.push({ id: 'sec-referencias', label: 'Referências', icon: BookMarked })
    return s
  }, [patologia, farma])

  // ── Extract all media items for gallery ─────────────────────────
  const mediaItems = useMemo<MediaItem[]>(() => {
    if (!patologia) return []
    return extractMedia(patologia)
  }, [patologia])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    )
  }

  if (!patologia) return null

  const farmaTabData = farmaTab === 'primeira' ? farma?.primeira_linha
    : farmaTab === 'segunda' ? farma?.segunda_linha
    : farma?.terceira_linha

  // ── Highlightable content block (always active, like Provas) ──────
  function HL({ field, children }: { field: string; children: string }) {
    return (
      <HighlightableRichText
        text={children}
        highlights={highlights[field] || []}
        onHighlightsChange={(arr) => updateField(field, arr)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Floating section nav */}
      <Suspense><SectionNav sections={navSections} media={mediaItems} slug={slug} /></Suspense>

      {/* Floating focus session (glassmorphism + iridescent wave) */}
      <FloatingFocusSession />

      {/* Floating disease name bar */}
      <FloatingDiseaseName nome={patologia.nome} heroRef={heroRef} slug={slug} />

      {/* ══════════════════════════════════════
           HERO HEADER
         ══════════════════════════════════════ */}
      <div ref={heroRef} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-background to-background" />
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-primary/[0.04] rounded-full blur-[100px]" />

        <div className="relative container mx-auto px-4 sm:px-6 pt-5 pb-8 max-w-4xl">
          {/* Nav row */}
          <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/manual-clinico')}
              className="rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Manual Clínico
            </Button>

            <div className="flex items-center gap-2">
              {/* Clear this page's highlights */}
              {hasHL && (
                <button
                  onClick={clearPageHighlights}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-white/[0.1] text-muted-foreground hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/[0.05] transition-all duration-200"
                  title="Limpar marcações desta página"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Limpar marcações</span>
                </button>
              )}

              {/* Share pathology link + QR */}
              <div className="inline-flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `${window.location.origin}/manual-clinico/${patologia.slug}`
                    navigator.clipboard.writeText(url)
                    setShareCopied(true)
                    setTimeout(() => setShareCopied(false), 2000)
                  }}
                  className="rounded-xl"
                >
                  {shareCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-emerald-500" />
                      <span className="text-emerald-500">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </>
                  )}
                </Button>
                <ShareQRButton
                  url={typeof window !== 'undefined' ? `${window.location.origin}/manual-clinico/${patologia.slug}` : `/manual-clinico/${patologia.slug}`}
                  title={patologia.nome}
                />
              </div>

              {/* PDF download */}
              {!patologia.isPremiumLocked && (
                <Button
                  size="sm"
                  disabled={!!pdfProgress}
                  onClick={async () => {
                    try {
                      setPdfProgress({ label: 'Iniciando...', pct: 0 })
                      const { generatePatologiaPDF } = await import('@/lib/patologia-pdf-generator')
                      const blob = await generatePatologiaPDF(patologia, (label, pct) => {
                        setPdfProgress({ label, pct })
                      })
                      setPdfProgress({ label: 'Aplicando marca d agua...', pct: 98 })
                      const watermarkedRes = await fetch(`/api/manual-clinico/pdf-watermark?mode=single&slug=${encodeURIComponent(patologia.slug)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/pdf' },
                        body: blob,
                      })
                      if (watermarkedRes.status === 401) {
                        router.push(`/auth/login?redirect=${encodeURIComponent(`/manual-clinico/${patologia.slug}`)}`)
                        return
                      }
                      const finalBlob = watermarkedRes.ok ? await watermarkedRes.blob() : blob
                      const url = URL.createObjectURL(finalBlob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${patologia.slug || 'patologia'}.pdf`
                      a.click()
                      URL.revokeObjectURL(url)
                      fetch('/api/track/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'patologia_pdf', resourceId: patologia.slug, resourceTitle: patologia.nome }) }).catch(() => {})
                    } finally {
                      setPdfProgress(null)
                    }
                  }}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  {pdfProgress ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-pulse" />
                      {pdfProgress.pct}%
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Disease name */}
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-foreground leading-tight tracking-tight">
            {patologia.nome}
          </h1>

          {patologia.sinonimos.length > 0 && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => setSinonimosExpanded(v => !v)}
                aria-expanded={sinonimosExpanded}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Sinônimos ({patologia.sinonimos.length})</span>
                {sinonimosExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              <AnimatePresence initial={false}>
                {sinonimosExpanded && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden text-muted-foreground text-[15px]"
                  >
                    <span className="block pt-1.5">{patologia.sinonimos.join(' · ')}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-5">
            {patologia.cid10 && (
              <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono bg-foreground/10 border border-foreground/20 text-foreground">
                CID-10: {patologia.cid10}
              </span>
            )}
            {patologia.areas.map(area => (
              <span key={area} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border ${AREA_BADGE[area]}`}>
                {area}
              </span>
            ))}
          </div>

          {patologia.sistema && (
            <div className="mt-3">
              <span className="text-sm text-muted-foreground">{patologia.sistema}</span>
            </div>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ══════════════════════════════════════
           SECTIONS
         ══════════════════════════════════════ */}
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
        {patologia.isPremiumLocked && (
          <PremiumPreviewCard
            patologia={patologia}
            // Quem não tem sessão é redirecionado pelo middleware para /comprar
            // (venda sem conta por Serial Key), então o destino aqui é sempre o
            // checkout do Manual.
            onCheckout={() => router.push('/manual-clinico/checkout')}
          />
        )}

        <div className="flex flex-col gap-3">

          {patologia.classificacao && (
            <Section title="Classificação" icon={Layers} sectionId="sec-classificacao">
              <HL field="classificacao">{patologia.classificacao}</HL>
            </Section>
          )}

          {patologia.fisiopatologia && (
            <Section title="Fisiopatologia" icon={Dna} sectionId="sec-fisiopatologia">
              <HL field="fisiopatologia">{patologia.fisiopatologia}</HL>
              {patologia.imagens_mecanismo && patologia.imagens_mecanismo.length > 0 && (
                <div id="sec-figuras" className="mt-6 scroll-mt-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ImageIcon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-[15px] text-foreground">Figuras</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {patologia.imagens_mecanismo.map((img, i) => (
                      <div
                        key={i}
                        className="rounded-xl overflow-hidden border border-border/60 bg-card/50 cursor-pointer group transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                        onClick={() => setLightbox({
                          src: img,
                          alt: patologia.legenda_imagens?.[i] || `Mecanismo ${i + 1}`,
                          caption: patologia.legenda_imagens?.[i],
                        })}
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={img}
                            alt={patologia.legenda_imagens?.[i] || `Mecanismo ${i + 1}`}
                            className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2.5 rounded-full bg-white/20 backdrop-blur-sm">
                              <Maximize2 className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>
                        {patologia.legenda_imagens?.[i] && (
                          <div className="p-3 border-t border-border/40">
                            <RichTextRenderer
                              text={patologia.legenda_imagens[i]}
                              className="text-xs text-muted-foreground"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {patologia.diagnostico_semiologico && (
            <Section title="Diagnóstico Semiológico" icon={Stethoscope} sectionId="sec-diagnostico">
              <HL field="diagnostico_semiologico">{patologia.diagnostico_semiologico}</HL>
            </Section>
          )}

          {patologia.diagnosticos_diferenciais && (
            <Section title="Diagnósticos Diferenciais" icon={ClipboardList} sectionId="sec-diferenciais">
              <HL field="diagnosticos_diferenciais">{patologia.diagnosticos_diferenciais}</HL>
            </Section>
          )}

          {patologia.gravidade && (
            <Section title="Gravidade e Classificação" icon={ShieldAlert} sectionId="sec-gravidade">
              <HL field="gravidade">{patologia.gravidade}</HL>
            </Section>
          )}

          {patologia.tratamento && (
            <Section title="Tratamento" icon={Heart} sectionId="sec-tratamento">
              <HL field="tratamento">{patologia.tratamento}</HL>
            </Section>
          )}

          {/* ══════ FARMACOLOGIA ══════ */}
          {farma && (farma.primeira_linha?.length > 0 || farma.segunda_linha?.length > 0) && (
            <Section title="Farmacologia" icon={FlaskConical} sectionId="sec-farmacologia">
              <div className="flex gap-1 p-1 mb-5 rounded-xl bg-muted/50 border border-border/40">
                {farma.primeira_linha?.length > 0 && (
                  <button
                    onClick={() => setFarmaTab('primeira')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                      farmaTab === 'primeira'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    1ª Linha
                  </button>
                )}
                {farma.segunda_linha?.length > 0 && (
                  <button
                    onClick={() => setFarmaTab('segunda')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                      farmaTab === 'segunda'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    2ª Linha
                  </button>
                )}
                {farma.terceira_linha && farma.terceira_linha.length > 0 && (
                  <button
                    onClick={() => setFarmaTab('terceira')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                      farmaTab === 'terceira'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    3ª Linha
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {farmaTabData?.map((farmaco, i) => (
                  <FarmacoCard key={i} farmaco={farmaco} />
                ))}
                {(!farmaTabData || farmaTabData.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum fármaco cadastrado para esta linha.</p>
                )}
              </div>
            </Section>
          )}

          {/* ══════ FLUXOGRAMA ══════ */}
          {patologia.fluxograma_tratamento && (
            <Section title="Fluxograma de Tratamento" icon={GitBranch} sectionId="sec-fluxograma">
              <div className="rounded-xl bg-muted/30 border border-border/40 p-5 sm:p-8">
                <FluxogramaRenderer text={patologia.fluxograma_tratamento} />
              </div>
            </Section>
          )}

          {/* ══════ OBSERVAÇÕES ══════ */}
          {patologia.observacoes_clinicas && (
            <Section title="Observações Clínicas" icon={AlertTriangle} variant="warning" sectionId="sec-observacoes">
              <div className="relative rounded-xl bg-amber-500/[0.06] border border-amber-500/20 p-5 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Atenção</span>
                  </div>
                  <HL field="observacoes_clinicas">{patologia.observacoes_clinicas}</HL>
                </div>
              </div>
            </Section>
          )}

          {/* ══════ REFERÊNCIAS ══════ */}
          {patologia.referencias && (
            <Section title="Referências" icon={BookMarked} defaultOpen={false} sectionId="sec-referencias">
              <HL field="referencias">{patologia.referencias}</HL>
            </Section>
          )}
        </div>

        <div className="h-12" />
      </div>

      {/* Image lightbox */}
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* PDF progress toast */}
      {pdfProgress && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-1.5 bg-card/95 border border-border/60 backdrop-blur-md shadow-2xl rounded-2xl px-5 py-3.5 min-w-[260px] max-w-[340px] w-full">
          <div className="flex items-center gap-2.5">
            <Activity className="h-4 w-4 text-primary animate-pulse shrink-0" />
            <span className="text-sm font-medium text-foreground truncate flex-1">{pdfProgress.label}</span>
            <span className="text-xs font-bold text-primary tabular-nums">{pdfProgress.pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-accent/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${pdfProgress.pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
