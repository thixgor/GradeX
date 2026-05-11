'use client'

import { motion } from 'framer-motion'
import {
  X, Sparkles, Package, ShoppingCart, Star, Zap,
  FileText, Video, Play, Link2, Image as ImageIcon, File, CheckCircle2,
  Tag, TrendingDown,
} from 'lucide-react'

// ─── Minimal types ───────────────────────────────────────────
export interface UpsellPackage {
  _id: string
  title: string
  description?: string
  coverImage?: string
  price?: number
  originalPrice?: number
  pricing: 'free' | 'paid'
  materials: Array<{ _id: string; title: string; type: string; coverImage?: string; price?: number }>
}

export interface UpsellItem {
  id: string
  title: string
  price?: number
  type?: string
}

export interface PackageUpsellModalProps {
  pkg: UpsellPackage
  item: UpsellItem
  onBuyPackage: () => void
  onBuyIndividual: () => void
  onClose: () => void
  loadingPackage?: boolean
  loadingIndividual?: boolean
}

// ─── Type metadata ───────────────────────────────────────────
const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf:           <FileText  className="h-3.5 w-3.5" />,
  video:         <Video     className="h-3.5 w-3.5" />,
  video_embed:   <Play      className="h-3.5 w-3.5" />,
  link:          <Link2     className="h-3.5 w-3.5" />,
  image:         <ImageIcon className="h-3.5 w-3.5" />,
  document:      <File      className="h-3.5 w-3.5" />,
  flashcard_deck:<Sparkles  className="h-3.5 w-3.5" />,
  other:         <File      className="h-3.5 w-3.5" />,
}

const TYPE_LABELS: Record<string, string> = {
  pdf:           'PDF',
  video:         'Vídeo',
  video_embed:   'Vídeo',
  link:          'Link',
  image:         'Imagem',
  document:      'Documento',
  flashcard_deck:'Flashcard',
  other:         'Arquivo',
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pdf:           { bg:'rgba(239,68,68,0.18)',   text:'#fca5a5', border:'rgba(239,68,68,0.35)'   },
  video:         { bg:'rgba(59,130,246,0.18)',  text:'#93c5fd', border:'rgba(59,130,246,0.35)'  },
  video_embed:   { bg:'rgba(59,130,246,0.18)',  text:'#93c5fd', border:'rgba(59,130,246,0.35)'  },
  link:          { bg:'rgba(16,185,129,0.18)',  text:'#6ee7b7', border:'rgba(16,185,129,0.35)'  },
  image:         { bg:'rgba(245,158,11,0.18)',  text:'#fcd34d', border:'rgba(245,158,11,0.35)'  },
  document:      { bg:'rgba(139,92,246,0.18)',  text:'#c4b5fd', border:'rgba(139,92,246,0.35)'  },
  flashcard_deck:{ bg:'rgba(52,211,153,0.18)',  text:'#6ee7b7', border:'rgba(52,211,153,0.35)'  },
  other:         { bg:'rgba(100,116,139,0.18)', text:'#94a3b8', border:'rgba(100,116,139,0.35)' },
}

function typeColor(type: string) {
  return TYPE_COLORS[type] ?? TYPE_COLORS.other
}

function fmtPrice(val?: number) {
  if (val == null) return '—'
  return `R$ ${val.toFixed(2).replace('.', ',')}`
}

// ─── Component ───────────────────────────────────────────────
export function PackageUpsellModal({
  pkg, item, onBuyPackage, onBuyIndividual, onClose,
  loadingPackage, loadingIndividual,
}: PackageUpsellModalProps) {
  const pkgFree    = pkg.pricing === 'free'
  const savings    = (!pkgFree && item.price && pkg.price != null)
    ? Math.max(0, item.price - pkg.price)
    : null
  const moreToPay  = (!pkgFree && item.price && pkg.price != null && pkg.price > item.price)
    ? pkg.price - item.price
    : null

  // Count unique types in the package
  const typeCounts = pkg.materials.reduce<Record<string, number>>((acc, m) => {
    const lbl = TYPE_LABELS[m.type] ?? 'Arquivo'
    acc[lbl] = (acc[lbl] ?? 0) + 1
    return acc
  }, {})

  const loading = !!(loadingPackage || loadingIndividual)

  return (
    <motion.div
      key="upsell-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
      />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          background: 'linear-gradient(165deg, rgba(10,14,22,0.98) 0%, rgba(6,12,18,1) 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Ambient glows ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.30) 0%, transparent 70%)' }} />
        </div>

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <div
          className="relative flex-shrink-0 px-5 pt-5 pb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(217,119,6,0.22) 0%, rgba(180,83,9,0.16) 35%, rgba(5,150,105,0.14) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <X className="h-4 w-4 text-white/60" />
          </button>

          {/* Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black tracking-[0.12em] uppercase"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.25) 0%, rgba(245,158,11,0.20) 100%)',
                border: '1px solid rgba(251,191,36,0.40)',
                color: '#fbbf24',
                boxShadow: '0 0 16px rgba(251,191,36,0.20)',
              }}
            >
              <Star className="h-3 w-3 fill-current" />
              Oferta Especial
            </span>
          </div>

          <h2 className="text-xl font-black text-white leading-tight tracking-tight">
            Espere! Você pode levar muito mais.
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>{item.title}</span> faz parte de um
            pacote com {pkg.materials.length} {pkg.materials.length === 1 ? 'item' : 'itens'}.
          </p>
        </div>

        {/* ══ SCROLLABLE BODY ═════════════════════════════════ */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Package info */}
          <div
            className="flex items-start gap-3 rounded-2xl p-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {pkg.coverImage ? (
              <img
                src={pkg.coverImage}
                alt={pkg.title}
                className="h-14 w-20 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="h-14 w-20 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(16,185,129,0.20))' }}
              >
                <Package className="h-6 w-6 text-violet-400" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.8)' }}>
                Pacote
              </span>
              <h3 className="font-bold text-white text-base leading-snug mt-0.5">{pkg.title}</h3>
              {pkg.description && (
                <p className="text-xs line-clamp-2 mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {pkg.description}
                </p>
              )}
              {/* Type summary pills */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.entries(typeCounts).map(([label, count]) => (
                  <span key={label}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}
                  >
                    {count}× {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Items list */}
          {pkg.materials.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                O que está incluído
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {pkg.materials.map(m => {
                  const tc = typeColor(m.type)
                  const isThisItem = m._id === item.id
                  return (
                    <div
                      key={m._id}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors"
                      style={{
                        background: isThisItem ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
                        border: isThisItem ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {/* Type icon */}
                      <span
                        className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-lg"
                        style={{ background: tc.bg, border: `1px solid ${tc.border}`, color: tc.text }}
                      >
                        {TYPE_ICONS[m.type] ?? <File className="h-3.5 w-3.5" />}
                      </span>
                      <span className="flex-1 truncate text-xs font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>
                        {m.title}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isThisItem && (
                          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(251,191,36,0.18)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.30)' }}>
                            Este item
                          </span>
                        )}
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
                        >
                          {TYPE_LABELS[m.type] ?? 'Arquivo'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Price comparison */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="px-4 py-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Compare os valores
              </p>
            </div>
            <div className="px-4 py-3 space-y-2.5" style={{ background: 'rgba(0,0,0,0.20)' }}>
              {/* Individual price */}
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Apenas este item
                </span>
                <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.60)', textDecoration: savings && savings > 0 ? 'line-through' : undefined }}>
                  {item.price ? fmtPrice(item.price) : '—'}
                </span>
              </div>
              {/* Package price */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'rgba(52,211,153,0.90)' }}>
                  <Package className="h-3.5 w-3.5" />
                  Pacote completo ({pkg.materials.length} itens)
                </span>
                <span className="text-lg font-black" style={{ color: pkgFree ? '#34d399' : '#34d399' }}>
                  {pkgFree ? 'Grátis' : fmtPrice(pkg.price)}
                </span>
              </div>
              {/* Savings row */}
              {savings !== null && savings > 0 && (
                <div
                  className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 mt-1"
                  style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}
                >
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">
                    Economize {fmtPrice(savings)} comprando o pacote!
                  </span>
                </div>
              )}
              {/* More to pay row (package costs more but includes more content) */}
              {moreToPay !== null && moreToPay > 0 && (
                <div
                  className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 mt-1"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}
                >
                  <Zap className="h-3.5 w-3.5" style={{ color: '#c4b5fd' }} />
                  <span className="text-xs font-semibold" style={{ color: '#c4b5fd' }}>
                    Por apenas {fmtPrice(moreToPay)} a mais, leve {pkg.materials.length} itens!
                  </span>
                </div>
              )}
              {pkgFree && (
                <div
                  className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 mt-1"
                  style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">
                    O pacote é gratuito — leve tudo sem custo!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ CTA FOOTER ═════════════════════════════════════ */}
        <div
          className="flex-shrink-0 px-5 pb-5 pt-4 space-y-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.25)' }}
        >
          {/* Primary: buy package */}
          <button
            onClick={onBuyPackage}
            disabled={loading}
            className="relative w-full overflow-hidden rounded-2xl py-3.5 flex items-center justify-center gap-2.5 font-bold text-sm text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, rgba(5,150,105,1) 0%, rgba(16,185,129,0.95) 45%, rgba(52,211,153,0.90) 100%)',
              border: '1px solid rgba(52,211,153,0.50)',
              boxShadow: '0 0 32px rgba(16,185,129,0.45), 0 8px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent pointer-events-none" />
            {loadingPackage
              ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <Package className="h-4 w-4 flex-shrink-0" />
            }
            <span>
              Quero o pacote completo
              {!pkgFree && pkg.price != null && (
                <span className="ml-1 opacity-85 font-black">— {fmtPrice(pkg.price)}</span>
              )}
              {pkgFree && <span className="ml-1 opacity-85">— Grátis</span>}
            </span>
          </button>

          {/* Secondary: buy individual */}
          <button
            onClick={onBuyIndividual}
            disabled={loading}
            className="w-full rounded-2xl py-2.5 flex items-center justify-center gap-2 text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            {loadingIndividual
              ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              : <ShoppingCart className="h-3.5 w-3.5" />
            }
            Comprar apenas este item
            {item.price != null && (
              <span className="font-semibold ml-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                — {fmtPrice(item.price)}
              </span>
            )}
          </button>

          <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.20)' }}>
            🔒 Pagamento 100% seguro · Mercado Pago
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
