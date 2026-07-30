'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Crown, Timer, Check, Sparkles, Clock, FileText, Package, BookOpen,
  Layers, Zap, ArrowRight, KeyRound,
} from 'lucide-react'
import { isPlusAccount } from '@/lib/account-tier'

/**
 * Detalhes vindos de /api/serial-keys/activate. Duas famílias de resposta:
 *  - Compra (serial key de produto): productType/productTitle/redirectTo…
 *  - Legado (key de admin: premium/trial/custom): keyType/accountType…
 */
export interface ActivationDetails {
  // Produto comprado (serial key de compra)
  productType?: string
  productTitle?: string
  productLabel?: string
  redirectTo?: string
  alreadyActivated?: boolean
  // Legado (plano)
  keyType?: 'plus' | 'trial' | 'custom' | 'premium'
  accountType?: string
  trialExpiresAt?: string | Date
  customDuration?: { days?: number; hours?: number; minutes?: number }
}

interface ActivationSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  details: ActivationDetails | null
}

interface Visual {
  Icon: typeof Crown
  title: string
  chipLabel: string
  chipValue: string
  accent: string
  accentSoft: string
  ctaLabel: string
  redirectTo?: string
}

const PRODUCT_META: Record<string, { label: string; Icon: typeof Crown }> = {
  material: { label: 'Material', Icon: FileText },
  flashcard: { label: 'Flashcards', Icon: Layers },
  package: { label: 'Pacote', Icon: Package },
  manual_clinico: { label: 'Manual Clínico', Icon: BookOpen },
  plus: { label: 'Plus+', Icon: Crown },
  // Legado — keys emitidas antes da consolidação.
  premium: { label: 'Plus+', Icon: Crown },
  essential: { label: 'Plus+', Icon: Zap },
}

function planDurationText(details: ActivationDetails): string {
  if (details.keyType === 'plus' || details.keyType === 'premium') return 'Vitalício'
  if (details.keyType === 'trial') return '7 dias'
  if (details.keyType === 'custom' && details.customDuration) {
    const d = details.customDuration
    const parts: string[] = []
    if (d.days) parts.push(`${d.days} ${d.days === 1 ? 'dia' : 'dias'}`)
    if (d.hours) parts.push(`${d.hours} ${d.hours === 1 ? 'hora' : 'horas'}`)
    if (d.minutes) parts.push(`${d.minutes} ${d.minutes === 1 ? 'minuto' : 'minutos'}`)
    return parts.join(', ') || 'Ativado'
  }
  return 'Ativado'
}

function resolveVisual(details: ActivationDetails): Visual {
  // Modo produto (compra) — tem productType.
  if (details.productType) {
    const meta = PRODUCT_META[details.productType] || { label: 'Produto', Icon: Sparkles }
    const isPlan = isPlusAccount(details.productType)
    const accent = isPlan ? '#fbbf24' : '#34d399'
    return {
      Icon: meta.Icon,
      title: details.alreadyActivated ? 'Produto já ativado' : 'Produto liberado!',
      chipLabel: isPlan ? 'Plano ativado' : 'Você desbloqueou',
      chipValue: details.productTitle || details.productLabel || meta.label,
      accent,
      accentSoft: isPlan ? 'rgba(251,191,36,0.14)' : 'rgba(52,211,153,0.14)',
      ctaLabel: 'Acessar agora',
      redirectTo: details.redirectTo,
    }
  }

  // Modo legado (plano por key de admin).
  if (details.keyType === 'plus' || details.keyType === 'premium') {
    return {
      Icon: Crown, title: 'Plus+ Ativado!', chipLabel: 'Plano ativado', chipValue: 'Plus+',
      accent: '#fbbf24', accentSoft: 'rgba(251,191,36,0.14)', ctaLabel: 'Começar a usar',
      redirectTo: '/dashboard',
    }
  }
  if (details.keyType === 'custom') {
    return {
      Icon: Sparkles, title: 'Plano Ativado!', chipLabel: 'Plano personalizado', chipValue: planDurationText(details),
      accent: '#c084fc', accentSoft: 'rgba(192,132,252,0.14)', ctaLabel: 'Começar a usar',
      redirectTo: '/dashboard',
    }
  }
  return {
    Icon: Timer, title: 'Trial Ativado!', chipLabel: 'Plano ativado', chipValue: `Trial · ${planDurationText(details)}`,
    accent: '#38bdf8', accentSoft: 'rgba(56,189,248,0.14)', ctaLabel: 'Começar a usar',
    redirectTo: '/dashboard',
  }
}

/** Partículas de confete geradas uma vez (determinístico dentro do render aberto). */
function useConfetti(accent: string) {
  return useMemo(() => {
    const colors = [accent, '#fbbf24', '#ffffff', '#34d399']
    return Array.from({ length: 26 }, (_, i) => ({
      id: i,
      x: (Math.random() * 2 - 1) * 160,
      rotate: Math.random() * 360,
      delay: Math.random() * 0.25,
      duration: 1.1 + Math.random() * 0.8,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 6,
      drift: (Math.random() * 2 - 1) * 40,
    }))
  }, [accent])
}

export function ActivationSuccessDialog({ open, onOpenChange, details }: ActivationSuccessDialogProps) {
  const router = useRouter()
  const visual = useMemo(() => (details ? resolveVisual(details) : null), [details])
  const confetti = useConfetti(visual?.accent || '#34d399')

  const handleCta = () => {
    onOpenChange(false)
    if (visual?.redirectTo) router.push(visual.redirectTo)
  }

  return (
    <AnimatePresence>
      {open && visual && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => onOpenChange(false)}
          />

          {/* Glow radial atrás do card */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute h-[520px] w-[520px] rounded-full blur-[120px]"
            style={{ background: visual.accent, opacity: 0.22 }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.1, 1], opacity: [0, 0.28, 0.2] }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border p-8 text-center"
            style={{
              background: 'linear-gradient(160deg, rgba(9,20,14,0.96) 0%, rgba(6,15,10,0.98) 100%)',
              borderColor: 'rgba(255,255,255,0.10)',
              boxShadow: `0 30px 90px -20px ${visual.accent}55, 0 0 0 1px rgba(255,255,255,0.04)`,
            }}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            {/* Confete */}
            <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center">
              {confetti.map((p) => (
                <motion.span
                  key={p.id}
                  className="absolute block rounded-[2px]"
                  style={{ width: p.size, height: p.size * 0.6, background: p.color }}
                  initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: p.x + p.drift,
                    y: [0, -60 - Math.random() * 40, 220],
                    rotate: p.rotate + 360,
                  }}
                  transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
                />
              ))}
            </div>

            {/* Medalhão 3D */}
            <div
              className="relative mx-auto mb-6 h-28 w-28"
              style={{ perspective: '700px' }}
            >
              {/* Anel cônico girando */}
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, ${visual.accent}, transparent 35%, ${visual.accent} 70%, transparent 100%)`,
                  filter: 'blur(2px)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
              />
              {/* Núcleo com o ícone */}
              <motion.div
                className="absolute inset-[6px] flex items-center justify-center rounded-full"
                style={{
                  background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), ${visual.accentSoft} 55%, rgba(4,12,8,0.9) 100%)`,
                  border: `1px solid ${visual.accent}66`,
                  transformStyle: 'preserve-3d',
                }}
                initial={{ rotateY: -180, scale: 0.2, opacity: 0 }}
                animate={{
                  rotateY: 0,
                  scale: 1,
                  opacity: 1,
                  y: [0, -6, 0],
                }}
                transition={{
                  rotateY: { type: 'spring', stiffness: 120, damping: 12, delay: 0.1 },
                  scale: { type: 'spring', stiffness: 200, damping: 14, delay: 0.1 },
                  opacity: { duration: 0.3, delay: 0.1 },
                  y: { duration: 3, ease: 'easeInOut', repeat: Infinity, delay: 0.8 },
                }}
              >
                <visual.Icon className="h-12 w-12" style={{ color: visual.accent }} strokeWidth={1.75} />
              </motion.div>
              {/* Selo de check */}
              <motion.div
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2"
                style={{ background: visual.accent, borderColor: 'rgba(4,12,8,0.95)' }}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.6 }}
              >
                <Check className="h-5 w-5 text-[#04120a]" strokeWidth={3} />
              </motion.div>
            </div>

            {/* Título */}
            <motion.h2
              className="flex items-center justify-center gap-2 text-2xl font-black text-white"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Sparkles className="h-5 w-5" style={{ color: visual.accent }} />
              {visual.title}
            </motion.h2>
            <motion.p
              className="mt-2 text-sm text-white/55"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              {details?.alreadyActivated
                ? 'Este item já estava liberado na sua conta.'
                : 'Tudo certo! Seu acesso foi liberado com sucesso.'}
            </motion.p>

            {/* Chip do produto/plano */}
            <motion.div
              className="mx-auto mt-6 rounded-2xl border px-5 py-4"
              style={{ borderColor: `${visual.accent}33`, background: visual.accentSoft }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 220, damping: 18 }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                {visual.chipLabel}
              </p>
              <p className="mt-1 text-lg font-extrabold text-white" style={{ lineHeight: 1.25 }}>
                {visual.chipValue}
              </p>
            </motion.div>

            {/* CTA */}
            <motion.button
              onClick={handleCta}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[15px] font-extrabold text-[#04120a] transition-transform active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${visual.accent}, ${visual.accent}cc)`,
                boxShadow: `0 12px 30px -8px ${visual.accent}aa`,
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              whileHover={{ scale: 1.02 }}
            >
              {visual.ctaLabel}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </motion.button>

            <motion.button
              onClick={() => onOpenChange(false)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 text-xs font-semibold text-white/45 transition-colors hover:text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Fechar
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
