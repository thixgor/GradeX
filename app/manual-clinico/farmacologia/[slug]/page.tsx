'use client'

import { useState, useEffect, useCallback, useMemo, useRef, type PointerEvent as RPointerEvent } from 'react'
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import {
  ArrowLeft,
  Layers,
  Activity,
  Zap,
  FlaskConical,
  Beaker,
  Droplets,
  AlertTriangle,
  ShieldAlert,
  Ban,
  Calculator,
  GitBranch,
  ClipboardList,
  BookMarked,
  ChevronDown,
  ChevronUp,
  Pill,
  Lock,
  Crown,
  ArrowRight,
  Info,
  CircleDot,
  X,
  Tags,
  Shuffle,
  MousePointerClick,
} from 'lucide-react'
import { RichTextRenderer } from '@/components/manual-clinico/rich-text-renderer'
import {
  type Medicamento,
  type Contraindicacao,
  type DoseCalculo,
  EFEITOS_EXPLICACAO,
} from '@/lib/types/farmacologia'

interface ManualProduct {
  label: string
  benefitText: string
  shortDescription: string
  ctaText: string
  isActive: boolean
  currentPrice: number
  price: number
  hasActivePromotion: boolean
}

interface MedicamentoResponse extends Partial<Medicamento> {
  preview?: string
  isPremiumLocked?: boolean
  accessStatus?: string
  product?: ManualProduct
  access?: { hasFullAccess: boolean; reason: string }
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

/* ═══════════ COLLAPSIBLE SECTION ═══════════ */
function Section({ id, title, icon: Icon, children, defaultOpen = true, variant = 'default' }: {
  id?: string
  title: string
  icon: any
  children: React.ReactNode
  defaultOpen?: boolean
  variant?: 'default' | 'warning' | 'danger'
}) {
  const [open, setOpen] = useState(defaultOpen)
  const accent = variant === 'danger' ? 'text-red-500' : variant === 'warning' ? 'text-amber-500' : 'text-primary'
  const bg = variant === 'danger' ? 'bg-red-500/10' : variant === 'warning' ? 'bg-amber-500/10' : 'bg-primary/10'
  const border = variant === 'danger' ? 'border-red-500/20' : variant === 'warning' ? 'border-amber-500/20' : 'border-border/60'

  return (
    <div id={id} className={`scroll-mt-20 rounded-2xl border ${border} bg-card/50 backdrop-blur-sm transition-all`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-5 hover:bg-accent/30 transition-colors text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 p-2.5 rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${accent}`} />
          </div>
          <h2 className="font-bold text-[17px] text-foreground">{title}</h2>
        </div>
        <div className={`shrink-0 p-1.5 rounded-full ${open ? 'bg-primary/10' : 'bg-accent/50'}`}>
          {open ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="border-t border-border/40 pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

/* ═══════════ FLUXOGRAMA ═══════════ */
function FluxogramaRenderer({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  return (
    <div className="flex flex-col items-center gap-0 py-2">
      {lines.map((line, i) => {
        const isArrow = /^[→↓⬇|▼►➜➔⇒]+$/.test(line) || line === '|' || line === 'v' || line === 'V'
        if (isArrow) {
          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <div className="w-0.5 h-5 bg-primary/30 rounded-full" />
              <ChevronDown className="h-4 w-4 text-primary/50 -mt-1" />
            </div>
          )
        }
        const isConditional = /^(Se |If |Sim:|Não:|Sim →|Não →)/i.test(line)
        const isFirst = i === 0
        const isLast = i === lines.length - 1
        const prevIsArrow = i > 0 && (/^[→↓⬇|▼►➜➔⇒]+$/.test(lines[i - 1]) || lines[i - 1] === '|' || lines[i - 1] === 'v')
        return (
          <div key={i} className="w-full max-w-md">
            {i > 0 && !prevIsArrow && (
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-border/50 rounded-full" />
                <ChevronDown className="h-3 w-3 text-border -mt-0.5" />
              </div>
            )}
            <div className={`relative border rounded-xl p-3.5 text-center mx-auto ${
              isConditional ? 'border-amber-500/30 bg-amber-950/20' :
              isFirst ? 'border-primary/40 bg-primary/10' :
              isLast ? 'border-emerald-500/40 bg-emerald-950/20' :
              'border-border/60 bg-card/60'
            }`}>
              {isFirst && <CircleDot className="h-3.5 w-3.5 text-primary mx-auto mb-1" />}
              <RichTextRenderer text={line} className={`text-sm font-medium ${
                isConditional ? 'text-amber-200' : isFirst ? 'text-primary' : isLast ? 'text-emerald-400' : 'text-foreground/90'
              }`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════ DOSE CALCULATOR ═══════════ */
function normalize(s: string) {
  return s.normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').toLowerCase().trim()
}

function DoseCalculator({ dose, contraindicacoes }: { dose: DoseCalculo; contraindicacoes: Contraindicacao[] }) {
  const [sexo, setSexo] = useState<'M' | 'F'>('M')
  const [idade, setIdade] = useState('')
  const [peso, setPeso] = useState('')
  const [marcados, setMarcados] = useState<Record<number, boolean>>({})

  const checks = dose.checks || []
  const idadeNum = Number(idade)
  const pesoNum = Number(peso)
  const podeCalcular = (dose.mg_por_kg != null && pesoNum > 0) || dose.dose_fixa != null

  const resultado = useMemo(() => {
    if (!podeCalcular) return null
    let d = dose.mg_por_kg != null ? dose.mg_por_kg * pesoNum : (dose.dose_fixa ?? 0)
    const fator = sexo === 'M' ? (dose.fator_masculino ?? 1) : (dose.fator_feminino ?? 1)
    d *= fator
    if (idadeNum >= 65 && dose.ajuste_idoso_pct != null) {
      d *= (1 + dose.ajuste_idoso_pct / 100)
    }
    if (dose.dose_max != null) d = Math.min(d, dose.dose_max)
    if (dose.dose_min != null) d = Math.max(d, dose.dose_min)
    return Math.round(d * 100) / 100
  }, [dose, sexo, idadeNum, pesoNum, podeCalcular])

  // Contraindicações disparadas pelos checks marcados
  const contraindicacoesAtivas = useMemo(() => {
    const out: { label: string; motivo: string }[] = []
    checks.forEach((c, idx) => {
      if (marcados[idx] && c.contraindica) {
        let motivo = c.motivo || ''
        if (!motivo) {
          const match = contraindicacoes.find(ci =>
            normalize(ci.condicao).includes(normalize(c.label)) ||
            normalize(c.label).includes(normalize(ci.condicao))
          )
          motivo = match?.motivo || ''
        }
        out.push({ label: c.label, motivo })
      }
    })
    return out
  }, [checks, marcados, contraindicacoes])

  const temContraindicacao = contraindicacoesAtivas.length > 0

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Sexo</label>
          <div className="mt-1 flex rounded-lg border border-border/60 overflow-hidden">
            <button
              onClick={() => setSexo('M')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${sexo === 'M' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent/40'}`}
            >Masc.</button>
            <button
              onClick={() => setSexo('F')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${sexo === 'F' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent/40'}`}
            >Fem.</button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Idade (anos)</label>
          <input
            type="number" min="0" inputMode="numeric"
            value={idade}
            onChange={e => setIdade(e.target.value)}
            className="mt-1 w-full h-[38px] rounded-lg border border-border/60 bg-card px-3 text-sm"
            placeholder="Ex: 45"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Peso (kg)</label>
          <input
            type="number" min="0" inputMode="decimal"
            value={peso}
            onChange={e => setPeso(e.target.value)}
            className="mt-1 w-full h-[38px] rounded-lg border border-border/60 bg-card px-3 text-sm"
            placeholder="Ex: 70"
          />
        </div>
      </div>

      {/* Condições (checks) */}
      {checks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Marque as condições da pessoa:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {checks.map((c, idx) => (
              <label
                key={idx}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                  marcados[idx]
                    ? c.contraindica ? 'border-red-500/40 bg-red-500/10' : 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-border/60 bg-card hover:bg-accent/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!marcados[idx]}
                  onChange={e => setMarcados(m => ({ ...m, [idx]: e.target.checked }))}
                />
                <span>{c.label}</span>
                {c.contraindica && <Ban className="h-3.5 w-3.5 text-red-400 ml-auto shrink-0" />}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Aviso de contraindicação */}
      {temContraindicacao && (
        <div className="rounded-xl border-2 border-red-500/40 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            <p className="font-black text-red-300">Medicamento CONTRAINDICADO para esta pessoa</p>
          </div>
          <ul className="space-y-1.5 text-sm text-red-200/90">
            {contraindicacoesAtivas.map((c, i) => (
              <li key={i} className="flex gap-2">
                <Ban className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                <span><strong>{c.label}</strong>{c.motivo ? ` — ${c.motivo}` : ''}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-red-300/70">A dose abaixo é apenas de referência farmacológica e NÃO deve ser usada nesta pessoa.</p>
        </div>
      )}

      {/* Resultado */}
      {podeCalcular ? (
        <div className={`rounded-xl border p-4 ${temContraindicacao ? 'border-red-500/30 bg-red-500/[0.04] opacity-90' : 'border-emerald-500/30 bg-emerald-500/[0.06]'}`}>
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Dose estimada (referência)</p>
          <p className="text-2xl font-black text-foreground">
            {resultado} {dose.unidade}
            {dose.frequencia && <span className="text-base font-bold text-muted-foreground"> · {dose.frequencia}</span>}
            {dose.via && <span className="text-base font-bold text-muted-foreground"> · {dose.via}</span>}
          </p>
          {dose.mg_por_kg != null && (
            <p className="text-xs text-muted-foreground mt-1">
              Base: {dose.mg_por_kg} {dose.unidade}/kg{pesoNum > 0 ? ` × ${pesoNum} kg` : ''}
              {idadeNum >= 65 && dose.ajuste_idoso_pct != null ? ` · ajuste idoso ${dose.ajuste_idoso_pct}%` : ''}
            </p>
          )}
          {dose.dose_max != null && (
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Teto: {dose.dose_max} {dose.unidade}</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          {dose.mg_por_kg != null ? 'Informe o peso para calcular a dose.' : 'Preencha os campos para estimar a dose.'}
        </div>
      )}

      {dose.observacao_calculo && (
        <p className="text-xs text-muted-foreground italic flex gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {dose.observacao_calculo}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground/60 border-t border-border/40 pt-2">
        Ferramenta educacional. A prescrição final é responsabilidade do profissional e deve considerar o quadro clínico completo.
      </p>
    </div>
  )
}

/* ═══════════ PLUS+ CARD ═══════════ */
function PremiumCard({ data, onCheckout }: { data: MedicamentoResponse; onCheckout: () => void }) {
  const product = data.product
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-400/10 via-card/70 to-emerald-400/10 p-5 sm:p-7 backdrop-blur-xl">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-2xl bg-amber-300/15 p-3 text-amber-300">
          <Lock className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-500">Conteúdo Plus+</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Desbloqueie a Farmacologia do Manual Clínico</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {product?.shortDescription || 'Mecanismo de ação, metabolismo, excreção, efeitos, contraindicações, posologia e calculadora de dose.'}
          </p>
        </div>
      </div>
      {data.preview && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-background/45 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Prévia</p>
          <RichTextRenderer text={data.preview} className="text-sm leading-relaxed text-foreground/80" />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold">{product?.benefitText || 'Acesso completo à farmacologia aprofundada'}</p>
          {product?.isActive && (
            <p className="mt-1 text-sm">
              {product.hasActivePromotion && <span className="mr-2 line-through text-muted-foreground">{formatBRL(product.price)}</span>}
              <span className="font-black text-primary">{product.currentPrice <= 0 ? 'Grátis' : formatBRL(product.currentPrice)}</span>
            </p>
          )}
        </div>
        <button
          onClick={onCheckout}
          disabled={!product?.isActive}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          <Crown className="h-4 w-4" />
          {product?.ctaText || 'Desbloquear Manual Clínico Completo'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   SECTION NAV (floating glassmorphism TOC)
   ═══════════════════════════════════════════ */
interface SectionEntry {
  id: string
  label: string
  icon: any
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
          className="liquid-glass-bubble"
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
          <div className="liquid-glass-surface" />
          <div className="liquid-glass-refraction-top" />
          <div className="liquid-glass-refraction-bottom" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Largura da pastilha de navegação, em px. Ver o mesmo comentário em
 * app/manual-clinico/[slug]/page.tsx: o botão é arrastável e nasce colado na
 * direita, então a posição inicial e o limite do arrasto dependem dela.
 */
const LARGURA_NAV_FLUTUANTE = 108

function SectionNav({ sections }: { sections: SectionEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024
  )
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isTouching, setIsTouching] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Draggable position ──────────────────────────────────────────
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024
    const rightOffset = isDesktop ? 210 : LARGURA_NAV_FLUTUANTE + 12
    setPos({ x: window.innerWidth - rightOffset, y: isDesktop ? 120 : 72 })
    const onResize = () => {
      setPos(prev => {
        if (!prev) return { x: window.innerWidth - 210, y: 120 }
        return {
          x: Math.min(prev.x, window.innerWidth - LARGURA_NAV_FLUTUANTE - 8),
          y: Math.max(12, Math.min(prev.y, window.innerHeight - 44)),
        }
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── First-visit coach mark for the nav button ──────────────────
  // Mesma chave da página de patologia (`mc-nav-hint-seen`): é o MESMO botão,
  // no mesmo canto, com a mesma função. Quem já entendeu na patologia não
  // precisa levar o aviso de novo na farmacologia.
  const dismissHint = useCallback(() => {
    setShowHint(false)
    try { localStorage.setItem('mc-nav-hint-seen', '1') } catch {}
  }, [])

  useEffect(() => {
    if (sections.length === 0 || typeof window === 'undefined') return
    try {
      if (localStorage.getItem('mc-nav-hint-seen') === '1') return
    } catch {}
    const t = setTimeout(() => setShowHint(true), 1100)
    const auto = setTimeout(() => setShowHint(false), 13000)
    return () => { clearTimeout(t); clearTimeout(auto) }
  }, [sections.length])

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
      if (window.innerWidth >= 1024) return
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
      x: Math.max(12, Math.min(window.innerWidth - LARGURA_NAV_FLUTUANTE - 8, dragRef.current.origX + dx)),
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
      if (window.innerWidth < 1024) setExpanded(false)
    }
  }, [])

  if (sections.length === 0 || !pos) return null

  const opensLeft = pos.x > window.innerWidth / 2

  return (
    <div
      ref={containerRef}
      className="fixed z-50"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* ── FAB (draggable floating button) ──
          Ver o comentário gêmeo em app/manual-clinico/[slug]/page.tsx: o vidro
          translúcido a 70% de opacidade não se lia como botão, e nada na tela
          dizia que ele navega entre as seções. Pastilha opaca, com borda,
          sombra e a palavra escrita. */}
      <button
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        title="Ir para uma seção deste medicamento"
        style={{ width: LARGURA_NAV_FLUTUANTE }}
        className={`relative h-12 rounded-2xl border flex items-center justify-center gap-2 shadow-lg transition-all duration-300 touch-none select-none ${
          expanded
            ? 'opacity-0 pointer-events-none scale-75'
            : showHint
              ? 'border-primary/50 bg-primary/15 shadow-primary/25 active:scale-95'
              : 'border-border bg-card/95 backdrop-blur-md hover:bg-card active:scale-95'
        }`}
        aria-label="Abrir navegação de seções"
      >
        {showHint && !expanded && (
          <>
            <span className="absolute inset-0 rounded-2xl ring-2 ring-primary/50 animate-ping" />
            <span className="absolute inset-0 rounded-2xl ring-2 ring-primary/50" />
          </>
        )}
        <span className="relative z-10 flex flex-col items-center gap-[3px]">
          <span className={`block w-4 h-[2.5px] rounded-full ${showHint ? 'bg-primary' : 'bg-foreground/70'}`} />
          <span className={`block w-3 h-[2.5px] rounded-full ${showHint ? 'bg-primary/70' : 'bg-foreground/50'}`} />
          <span className={`block w-4 h-[2.5px] rounded-full ${showHint ? 'bg-primary' : 'bg-foreground/70'}`} />
        </span>
        <span className={`relative z-10 text-[12.5px] font-bold leading-none ${showHint ? 'text-primary' : 'text-foreground'}`}>
          Seções
        </span>
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
                    Use este botão para pular entre as seções do medicamento.
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
              <div className="liquid-glass-surface !rounded-2xl" />
              <div className="liquid-glass-refraction-top !left-[8%] !right-[8%]" style={{ borderRadius: '16px' }} />
              <div className="liquid-glass-refraction-bottom !left-[12%] !right-[12%]" style={{ borderRadius: '16px' }} />

              <div className="relative z-10 flex items-center justify-between px-3 pt-2.5 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Seções</span>
                <button
                  onClick={() => { setExpanded(false); setHoveredIndex(null) }}
                  className="p-1 rounded-lg hover:bg-white/[0.1] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

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
                      className={`relative z-10 w-full flex items-center gap-2.5 rounded-xl py-2 px-3 transition-colors duration-150 text-left ${
                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? 'text-primary' : ''}`} />
                      <span className="text-[12px] font-medium whitespace-nowrap">{section.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════ PAGE ═══════════ */
export default function FarmacoDetailPage() {
  return (
    <AppShell allowGuest showHeader={false}>
      <FarmacoDetailContent />
    </AppShell>
  )
}

function FarmacoDetailContent() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [data, setData] = useState<MedicamentoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/farmacologia/${slug}`)
      if (res.status === 404) { setNotFound(true); return }
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Erro ao buscar fármaco:', error)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchData() }, [fetchData])

  function goToCheckout() {
    router.push('/manual-clinico/checkout')
  }

  // ── Build sections list for floating nav (before early returns) ──
  const navSections = useMemo<SectionEntry[]>(() => {
    if (!data || data.isPremiumLocked) return []
    const s: SectionEntry[] = []
    if (data.classificacao) s.push({ id: 'sec-classificacao', label: 'Classificação', icon: Layers })
    if (data.principais_funcoes) s.push({ id: 'sec-funcoes', label: 'Principais Funções', icon: Activity })
    if (data.mecanismo_acao_compacto) s.push({ id: 'sec-mec-compacto', label: 'Mecanismo (Compacto)', icon: Zap })
    if (data.mecanismo_acao_detalhado) s.push({ id: 'sec-mec-detalhado', label: 'Mecanismo (Detalhado)', icon: FlaskConical })
    if (data.metabolismo) s.push({ id: 'sec-metabolismo', label: 'Metabolismo', icon: Beaker })
    if (data.excrecao) s.push({ id: 'sec-excrecao', label: 'Excreção', icon: Droplets })
    if ((data.efeitos_colaterais && data.efeitos_colaterais.length > 0) || (data.efeitos_adversos && data.efeitos_adversos.length > 0)) {
      s.push({ id: 'sec-efeitos', label: 'Efeitos', icon: AlertTriangle })
    }
    if (data.contraindicacoes && data.contraindicacoes.length > 0) s.push({ id: 'sec-contraindicacoes', label: 'Contraindicações', icon: Ban })
    if (data.interacoes_medicamentosas) s.push({ id: 'sec-interacoes', label: 'Interações', icon: Shuffle })
    if (data.posologia) s.push({ id: 'sec-posologia', label: 'Posologia', icon: ClipboardList })
    if (data.calculo_dose && data.calculo_dose.enabled) s.push({ id: 'sec-calculadora', label: 'Calculadora de Dose', icon: Calculator })
    if (data.fluxograma_uso) s.push({ id: 'sec-fluxograma', label: 'Fluxograma', icon: GitBranch })
    if (data.observacoes_clinicas) s.push({ id: 'sec-observacoes', label: 'Observações', icon: ShieldAlert })
    if (data.referencias) s.push({ id: 'sec-referencias', label: 'Referências', icon: BookMarked })
    return s
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <h1 className="text-xl font-bold mb-2">Fármaco não encontrado</h1>
        <button onClick={() => router.push('/manual-clinico/farmacologia')} className="text-primary underline">
          Voltar à Farmacologia
        </button>
      </div>
    )
  }

  const locked = data.isPremiumLocked
  const ci = data.contraindicacoes || []
  const dose = data.calculo_dose

  return (
    <div className="min-h-screen bg-background">
      {/* Floating glassmorphism section nav */}
      {!locked && <SectionNav sections={navSections} />}

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <button
          onClick={() => router.push('/manual-clinico/farmacologia')}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Farmacologia
        </button>

        {/* HERO */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {data.classe_principal && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {data.classe_principal}
              </span>
            )}
            {data.subclasse && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/[0.05] text-muted-foreground border border-white/[0.1]">
                {data.subclasse}
              </span>
            )}
            {data.tipo_farmaco && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {data.tipo_farmaco}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading">{data.nome}</h1>
          {data.sinonimos && data.sinonimos.length > 0 && (
            <p className="text-muted-foreground mt-1.5">{data.sinonimos.join(' · ')}</p>
          )}
        </div>

        {locked ? (
          <PremiumCard data={data} onCheckout={goToCheckout} />
        ) : (
          <div className="space-y-3">
            {/* Seção inicial independente: Nomes comerciais (não entra no navegador) */}
            {data.nomes_comerciais && (
              <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tags className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-black uppercase tracking-wide text-primary">Nomes comerciais</h2>
                </div>
                <RichTextRenderer text={data.nomes_comerciais} className="text-sm leading-relaxed text-foreground/85" />
              </div>
            )}

            {data.classificacao && (
              <Section id="sec-classificacao" title="Classificação" icon={Layers}>
                <RichTextRenderer text={data.classificacao} className="text-sm leading-relaxed text-foreground/85" />
              </Section>
            )}

            {data.principais_funcoes && (
              <Section id="sec-funcoes" title="Principais Funções" icon={Activity}>
                <RichTextRenderer text={data.principais_funcoes} className="text-sm leading-relaxed text-foreground/85" />
              </Section>
            )}

            {data.mecanismo_acao_compacto && (
              <Section id="sec-mec-compacto" title="Mecanismo de Ação — Compacto" icon={Zap}>
                <div className="rounded-lg bg-primary/[0.05] border border-primary/10 p-3">
                  <RichTextRenderer text={data.mecanismo_acao_compacto} className="text-sm leading-relaxed text-foreground/90" />
                </div>
              </Section>
            )}

            {data.mecanismo_acao_detalhado && (
              <Section id="sec-mec-detalhado" title="Mecanismo de Ação — Detalhado" icon={FlaskConical} defaultOpen={false}>
                <RichTextRenderer text={data.mecanismo_acao_detalhado} className="text-sm leading-relaxed text-foreground/85" />
              </Section>
            )}

            {data.metabolismo && (
              <Section id="sec-metabolismo" title="Metabolismo" icon={Beaker}>
                <RichTextRenderer text={data.metabolismo} className="text-sm leading-relaxed text-foreground/85" />
              </Section>
            )}

            {data.excrecao && (
              <Section id="sec-excrecao" title="Excreção" icon={Droplets}>
                <RichTextRenderer text={data.excrecao} className="text-sm leading-relaxed text-foreground/85" />
              </Section>
            )}

            {/* Efeitos: explicação hardcoded + colaterais + adversos */}
            {((data.efeitos_colaterais && data.efeitos_colaterais.length > 0) ||
              (data.efeitos_adversos && data.efeitos_adversos.length > 0)) && (
              <Section id="sec-efeitos" title="Efeitos Colaterais × Efeitos Adversos" icon={AlertTriangle} variant="warning">
                {/* Explicação fixa */}
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-amber-400 mb-1.5">Efeito Colateral</p>
                    <p className="text-[13px] leading-relaxed text-foreground/80">{EFEITOS_EXPLICACAO.colaterais}</p>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-red-400 mb-1.5">Efeito Adverso</p>
                    <p className="text-[13px] leading-relaxed text-foreground/80">{EFEITOS_EXPLICACAO.adversos}</p>
                  </div>
                </div>

                {data.efeitos_colaterais && data.efeitos_colaterais.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 mb-2">Efeitos Colaterais</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.efeitos_colaterais.map((e, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                {data.efeitos_adversos && data.efeitos_adversos.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-red-400 mb-2">Efeitos Adversos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.efeitos_adversos.map((e, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 font-medium">{e}</span>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {ci.length > 0 && (
              <Section id="sec-contraindicacoes" title="Contraindicações" icon={Ban} variant="danger">
                <div className="space-y-2.5">
                  {ci.map((c, i) => (
                    <div key={i} className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Ban className="h-4 w-4 text-red-400 shrink-0" />
                        <p className="font-bold text-red-300">{c.condicao}</p>
                      </div>
                      {c.motivo && <p className="text-[13px] text-foreground/75 pl-6">{c.motivo}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {data.interacoes_medicamentosas && (
              <Section id="sec-interacoes" title="Interações Medicamentosas" icon={Shuffle} variant="warning">
                <RichTextRenderer text={data.interacoes_medicamentosas} className="text-sm leading-relaxed text-foreground/85" />
              </Section>
            )}

            {data.posologia && (
              <Section id="sec-posologia" title="Posologia" icon={ClipboardList}>
                <RichTextRenderer text={data.posologia} className="text-sm leading-relaxed text-foreground/85" />
              </Section>
            )}

            {dose && dose.enabled && (
              <Section id="sec-calculadora" title="Calculadora de Dose" icon={Calculator}>
                <DoseCalculator dose={dose} contraindicacoes={ci} />
              </Section>
            )}

            {data.fluxograma_uso && (
              <Section id="sec-fluxograma" title="Fluxograma de Uso Medicamentoso" icon={GitBranch}>
                <FluxogramaRenderer text={data.fluxograma_uso} />
              </Section>
            )}

            {data.observacoes_clinicas && (
              <Section id="sec-observacoes" title="Observações Clínicas" icon={ShieldAlert} variant="warning">
                <RichTextRenderer text={data.observacoes_clinicas} className="text-sm leading-relaxed text-foreground/85" />
              </Section>
            )}

            {data.referencias && (
              <Section id="sec-referencias" title="Referências Bibliográficas" icon={BookMarked} defaultOpen={false}>
                <RichTextRenderer text={data.referencias} className="text-sm leading-relaxed text-muted-foreground" />
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
