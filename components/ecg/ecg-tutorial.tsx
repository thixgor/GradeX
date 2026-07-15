'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import {
  X, ChevronLeft, ChevronRight, Rocket, HeartPulse, ListFilter, Grid3x3, Monitor,
  Rows3, LineChart, Activity, Ruler, Heart, Star, GraduationCap,
} from 'lucide-react'

const TOUR_SEEN_KEY = 'ecg:tour-seen'

/** Controla a exibição do tutorial guiado do simulador (abre sozinho na 1ª visita). */
export function useEcgTour() {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_SEEN_KEY)) setOpen(true)
    } catch { /* ignore */ }
    setReady(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    try { localStorage.setItem(TOUR_SEEN_KEY, '1') } catch { /* ignore */ }
  }, [])

  return { open, setOpen, close, ready }
}

type VisualKind = 'welcome' | 'bank' | 'modes' | 'speed' | 'heart' | 'notes' | 'quiz'

interface Step {
  visual: VisualKind
  accent: string
  icon: any
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    visual: 'welcome', accent: 'text-primary', icon: HeartPulse,
    title: 'Bem-vindo ao Simulador de ECG',
    description: 'Um laboratório completo: 12 derivações em tempo real, banco com mais de 90 traçados comentados e exercícios estilo prova. Um tour rápido — 30 segundos — pra você não perder nada.',
  },
  {
    visual: 'bank', accent: 'text-amber-400', icon: ListFilter,
    title: 'Toque em "Banco de ECG" pra navegar',
    description: 'No celular e no tablet, esse botão abre um painel com busca, categorias e favoritos — mais de 90 traçados prontos pra estudar. No computador ele já fica sempre visível do lado esquerdo.',
  },
  {
    visual: 'modes', accent: 'text-sky-400', icon: Grid3x3,
    title: '5 formas de ver o mesmo traçado',
    description: '12 derivações completas, modo Monitor (estilo UTI), 3 derivações, uma derivação Individual ampliada ou Ritmo longo em DII. Troque com um toque na barra de ferramentas.',
  },
  {
    visual: 'speed', accent: 'text-cyan-400', icon: Ruler,
    title: 'Papel milimetrado de verdade',
    description: 'Ajuste velocidade (25/50/100 mm/s) e ganho (5/10/20 mm/mV) como num ECG real, dê zoom e use a Régua/paquímetro pra medir intervalos com precisão.',
  },
  {
    visual: 'heart', accent: 'text-red-400', icon: Heart,
    title: 'Veja o coração por dentro',
    description: '"Anatomia" mostra a propagação elétrica em um coração 3D, destacando a parede afetada e a artéria culpada. "Comparar" sobrepõe o traçado atual ao ECG normal.',
  },
  {
    visual: 'notes', accent: 'text-amber-300', icon: Star,
    title: 'Monte seu material de revisão',
    description: 'Favorite os traçados mais importantes e escreva anotações pessoais — mnemônicos, pegadinhas de prova. Tudo salvo automaticamente neste dispositivo.',
  },
  {
    visual: 'quiz', accent: 'text-violet-400', icon: GraduationCap,
    title: 'Teste o que você aprendeu',
    description: 'Na aba "Exercícios", resolva casos estilo prova/residência com feedback imediato e explicação de cada padrão. Bora simular?',
  },
]

export function EcgTutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)

  useEffect(() => setMounted(true), [])
  useEffect(() => { if (open) setStep(0) }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const go = useCallback((delta: number) => {
    setDir(delta)
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)))
  }, [])

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -60) {
      if (!isLast) go(1); else onClose()
    } else if (info.offset.x > 60) {
      go(-1)
    }
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.12] bg-neutral-950/90 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-sky-500/10" />

            <button
              onClick={onClose}
              aria-label="Fechar tutorial"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.06] text-white/70 transition hover:bg-white/[0.12] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative p-6">
              {/* progresso */}
              <div className="mb-4 flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-white/[0.1]'}`} />
                ))}
              </div>

              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.div
                  key={step}
                  custom={dir}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragEnd={handleDragEnd}
                  variants={{
                    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <StepVisual kind={current.visual} />
                  <div className="mt-4 flex items-center gap-2">
                    <current.icon className={`h-4 w-4 ${current.accent}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                      Passo {step + 1} de {STEPS.length}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-lg font-black tracking-tight text-white">{current.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{current.description}</p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex items-center justify-between gap-2">
                <button onClick={onClose} className="text-xs font-semibold text-white/50 transition hover:text-white/80">
                  Pular tutorial
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => go(-1)}
                    disabled={step === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.06] text-white transition hover:bg-white/[0.12] disabled:pointer-events-none disabled:opacity-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {!isLast ? (
                    <button
                      onClick={() => go(1)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
                    >
                      Próximo <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
                    >
                      Entendi, vamos simular! <Rocket className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function StepVisual({ kind }: { kind: VisualKind }) {
  return (
    <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      {kind === 'welcome' && <WelcomeVisual />}
      {kind === 'bank' && <BankVisual />}
      {kind === 'modes' && <ModesVisual />}
      {kind === 'speed' && <SpeedVisual />}
      {kind === 'heart' && <HeartVisual />}
      {kind === 'notes' && <NotesVisual />}
      {kind === 'quiz' && <QuizVisual />}
    </div>
  )
}

function WelcomeVisual() {
  return (
    <div className="relative flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute h-12 w-12 rounded-full border border-primary/40"
          animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 rounded-2xl bg-primary/15 p-4 text-primary"
      >
        <HeartPulse className="h-8 w-8" />
      </motion.div>
    </div>
  )
}

function BankVisual() {
  return (
    <div className="flex w-full flex-col items-center gap-2 px-6">
      <motion.div
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary"
        animate={{ scale: [1, 0.9, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ListFilter className="h-3.5 w-3.5" /> Banco de ECG
        <span className="rounded-full bg-primary/20 px-1.5 text-[9px]">90+</span>
      </motion.div>
      <div className="w-full space-y-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-full rounded-full bg-white/[0.1]"
            style={{ originX: 0 }}
            animate={{ scaleX: [0, 1], opacity: [0, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.4 + i * 0.15, ease: 'easeOut' }}
          />
        ))}
      </div>
    </div>
  )
}

function ModesVisual() {
  const icons = [Grid3x3, Monitor, Rows3, LineChart, Activity]
  const [active, setActive] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % icons.length), 700)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="flex items-center gap-2">
      {icons.map((Icon, i) => (
        <motion.div
          key={i}
          animate={{ scale: active === i ? 1.15 : 1, opacity: active === i ? 1 : 0.4 }}
          className={`rounded-xl p-2.5 ${active === i ? 'bg-sky-500/15 text-sky-400' : 'bg-white/[0.04] text-muted-foreground'}`}
        >
          <Icon className="h-4 w-4" />
        </motion.div>
      ))}
    </div>
  )
}

function SpeedVisual() {
  const speeds = [25, 50, 100]
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % speeds.length), 900)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 32" className="h-10 w-32 text-cyan-400">
        <motion.path
          d="M0 16 L20 16 L26 4 L32 28 L38 16 L60 16 L66 4 L72 28 L78 16 L120 16"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4 - i * 0.3, repeat: Infinity, ease: 'linear' }}
        />
      </svg>
      <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-cyan-400">{speeds[i]} mm/s</span>
    </div>
  )
}

function HeartVisual() {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute h-16 w-16 rounded-full border-2 border-dashed border-red-400/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="rounded-2xl bg-red-500/15 p-4 text-red-400"
      >
        <Heart className="h-8 w-8" />
      </motion.div>
      <motion.span
        className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-400"
        animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
    </div>
  )
}

function NotesVisual() {
  const lines = [56, 40, 48]
  return (
    <div className="flex items-center gap-4">
      <motion.div
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="rounded-xl bg-amber-400/15 p-3 text-amber-300"
      >
        <Star className="h-6 w-6 fill-current" />
      </motion.div>
      <div className="flex flex-col gap-1.5">
        {lines.map((w, i) => (
          <motion.span
            key={i}
            className="h-1.5 rounded-full bg-violet-400/40"
            style={{ width: w, originX: 0 }}
            animate={{ scaleX: [0, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
          />
        ))}
      </div>
    </div>
  )
}

function QuizVisual() {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={{ rotate: [0, 8, -8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="rounded-2xl bg-violet-500/15 p-4 text-violet-400"
      >
        <GraduationCap className="h-8 w-8" />
      </motion.div>
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          className="h-full rounded-full bg-violet-400"
          animate={{ width: ['0%', '100%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}
