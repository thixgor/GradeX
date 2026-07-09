'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  ChevronDown,
  ArrowRight,
  Instagram,
  Mail,
  Brain,
  Calendar,
  Database,
  Video,
  BookMarked,
  Scale,
  Menu,
  X,
  Heart,
  Stethoscope,
  FlaskConical,
  GraduationCap,
  Check,
  Play,
  Sparkles,
} from 'lucide-react'
import { DoacaoContent } from '@/components/doacoes/doacao-content'
import { DoacaoRanking } from '@/components/doacoes/doacao-ranking'
import { DoacaoForm } from '@/components/doacoes/doacao-form'
import { DoacaoEcgAnimation } from '@/components/doacoes/doacao-ecg-animation'

// ─── Brand palettes ───────────────────────────────────────────────────────────

type Palette = {
  cream: string
  paper: string
  ink: string
  muted: string
  line: string
  green: string
  greenDeep: string
  greenForest: string
  gold: string
  orange: string
  soft: string
  isDark: boolean
}

const LIGHT: Palette = {
  cream: '#F6F1E8',
  paper: '#FFFCF7',
  ink: '#1A2419',
  muted: '#5C6B5A',
  line: '#D9D0C1',
  green: '#468152',
  greenDeep: '#153D1F',
  greenForest: '#0F2418',
  gold: '#E2A43E',
  orange: '#CE5929',
  soft: '#E8F0E9',
  isDark: false,
}

const DARK: Palette = {
  cream: '#0C1410',
  paper: '#131C16',
  ink: '#F0EBE0',
  muted: '#9AAB97',
  line: '#2A3A2E',
  green: '#6BA876',
  greenDeep: '#1A3D24',
  greenForest: '#08140C',
  gold: '#E8B84A',
  orange: '#E06A3A',
  soft: '#1A2A1E',
  isDark: true,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, isVisible }
}

function useTilt3D(strength = 14) {
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springCfg = { stiffness: 220, damping: 22, mass: 0.45 }
  const sX = useSpring(rotateX, springCfg)
  const sY = useSpring(rotateY, springCfg)

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * strength)
    rotateX.set(py * -strength)
  }
  const onMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }
  return { rotateX: sX, rotateY: sY, onMouseMove, onMouseLeave }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  // Always start at final value so SSR + first client paint match (no hydration flash to 0).
  const [count, setCount] = useState(target)
  const { ref, isVisible } = useInView()
  const prefersReduced = usePrefersReducedMotion()
  const animated = useRef(false)
  useEffect(() => {
    if (!isVisible || animated.current || prefersReduced) return
    animated.current = true
    let start = 0
    let raf = 0
    let cancelled = false
    const duration = 1400
    setCount(0)
    const step = (ts: number) => {
      if (cancelled) return
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [isVisible, target, prefersReduced])
  return (
    <span ref={ref}>
      {count.toLocaleString('pt-BR')}
      {suffix}
    </span>
  )
}

const easeOutExpo = [0.22, 1, 0.36, 1] as const

interface LandingPageProps {
  initialIsLoggedIn?: boolean
  initialVideoEmbedUrl?: string
  initialVideoEnabled?: boolean
}

// ─── 3D medical ornaments ─────────────────────────────────────────────────────

/** DNA double helix — CSS spin only (constant speed) */
function DnaHelix3D({ color, accent }: { color: string; accent: string }) {
  const pairs = 8
  return (
    <div className="relative w-16 h-40" style={{ perspective: 600 }}>
      <div className="relative w-full h-full da-spin-y" style={{ transformStyle: 'preserve-3d' }}>
        {Array.from({ length: pairs }).map((_, i) => {
          const t = i / (pairs - 1)
          const angle = t * Math.PI * 2.4
          const y = i * 18
          const r = 18
          const x1 = Math.cos(angle) * r
          const x2 = Math.cos(angle + Math.PI) * r
          const z1 = Math.sin(angle) * r
          const z2 = Math.sin(angle + Math.PI) * r
          return (
            <div key={i} className="absolute left-1/2 top-0" style={{ transform: `translateY(${y}px)` }}>
              <div
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{
                  background: color,
                  transform: `translate3d(${x1}px, 0, ${z1}px)`,
                  boxShadow: `0 0 8px ${color}66`,
                }}
              />
              <div
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{
                  background: accent,
                  transform: `translate3d(${x2}px, 0, ${z2}px)`,
                  boxShadow: `0 0 8px ${accent}55`,
                }}
              />
              <div
                className="absolute h-px origin-left"
                style={{
                  width: Math.hypot(x2 - x1, z2 - z1),
                  background: `linear-gradient(90deg, ${color}, ${accent})`,
                  opacity: 0.55,
                  transform: `translate3d(${x1}px, 5px, ${z1}px) rotateY(${(angle * 180) / Math.PI}deg)`,
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Anatomical heart — CSS beat + soft tilt */
function Heart3D({ color }: { color: string }) {
  return (
    <div className="relative da-spin-y-soft" style={{ perspective: 500 }}>
      <div className="da-heart-beat">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" aria-hidden>
          <defs>
            <linearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.65" />
            </linearGradient>
          </defs>
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            fill="url(#heartGrad)"
          />
        </svg>
      </div>
    </div>
  )
}

/** Orbiting molecule — CSS only */
function Molecule3D({ color, accent }: { color: string; accent: string }) {
  const atoms = [
    { x: 0, y: 0, s: 14, c: color },
    { x: 28, y: -16, s: 10, c: accent },
    { x: -26, y: -14, s: 10, c: accent },
    { x: 18, y: 24, s: 9, c: color },
    { x: -22, y: 20, s: 9, c: color },
  ]
  return (
    <div className="relative w-24 h-24" style={{ perspective: 500 }}>
      <div className="relative w-full h-full da-orbit" style={{ transformStyle: 'preserve-3d' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="-40 -40 80 80" aria-hidden>
          <line x1="0" y1="0" x2="28" y2="-16" stroke={color} strokeWidth="1.5" opacity="0.45" />
          <line x1="0" y1="0" x2="-26" y2="-14" stroke={color} strokeWidth="1.5" opacity="0.45" />
          <line x1="0" y1="0" x2="18" y2="24" stroke={color} strokeWidth="1.5" opacity="0.45" />
          <line x1="0" y1="0" x2="-22" y2="20" stroke={color} strokeWidth="1.5" opacity="0.45" />
        </svg>
        {atoms.map((a, i) => (
          <div
            key={i}
            className="absolute rounded-full left-1/2 top-1/2"
            style={{
              width: a.s,
              height: a.s,
              marginLeft: -a.s / 2,
              marginTop: -a.s / 2,
              background: a.c,
              transform: `translate3d(${a.x}px, ${a.y}px, ${i * 4}px)`,
              boxShadow: `0 0 12px ${a.c}55`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** ECG strip in perspective plane — CSS draw */
function EcgPlane3D({ color }: { color: string }) {
  return (
    <div
      className="w-40 h-16 rounded-md border overflow-hidden"
      style={{
        borderColor: `${color}44`,
        background: `${color}10`,
        transform: 'rotateX(52deg) rotateZ(-8deg)',
        boxShadow: `0 18px 30px -16px ${color}55`,
      }}
    >
      <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none" aria-hidden>
        <path
          className="da-ecg-path"
          d="M0 20 H30 L38 20 L44 6 L52 34 L60 12 L66 20 H100 L108 20 L114 4 L122 36 L130 14 L136 20 H200"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/** Flipping clinical flashcard — single interval, no stack */
function Flashcard3D({ C, enableFlip }: { C: Palette; enableFlip: boolean }) {
  const [flipped, setFlipped] = useState(false)
  useEffect(() => {
    if (!enableFlip) return
    const id = window.setInterval(() => setFlipped((f) => !f), 3600)
    return () => window.clearInterval(id)
  }, [enableFlip])

  return (
    <div className="w-[148px] h-[96px]" style={{ perspective: 900 }}>
      <div
        className="relative w-full h-full transition-transform duration-700 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className="absolute inset-0 rounded-md border p-3 flex flex-col justify-between"
          style={{
            background: C.paper,
            borderColor: C.line,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            boxShadow: '0 12px 28px -14px rgba(0,0,0,0.35)',
          }}
        >
          <span className="font-clinical text-[9px] uppercase tracking-wider" style={{ color: C.orange }}>
            Flashcard
          </span>
          <p className="text-[11px] font-semibold leading-snug" style={{ color: C.ink }}>
            Derivações no IAM inferior?
          </p>
        </div>
        <div
          className="absolute inset-0 rounded-md border p-3 flex flex-col justify-between"
          style={{
            background: C.soft,
            borderColor: C.green,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: '0 12px 28px -14px rgba(0,0,0,0.35)',
          }}
        >
          <span className="font-clinical text-[9px] uppercase tracking-wider" style={{ color: C.green }}>
            Resposta
          </span>
          <p className="text-[12px] font-bold font-clinical" style={{ color: C.ink }}>
            DII · DIII · aVF
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Exam mockup with mouse tilt (no RAF float — CSS only) ────────────────────

function ExamMockup({ C, enableMotion }: { C: Palette; enableMotion: boolean }) {
  const tilt = useTilt3D(12)

  return (
    <div className="relative w-full max-w-md mx-auto" style={{ perspective: 1400 }}>
      {/* Ornaments — only mount after client ready to avoid hydration / stack bugs */}
      {enableMotion && (
        <>
          <div className="absolute -left-4 sm:-left-10 top-2 z-20 scale-75 sm:scale-100 pointer-events-none">
            <DnaHelix3D color={C.green} accent={C.gold} />
          </div>
          <div className="absolute -right-2 sm:-right-8 top-0 z-20 scale-90 pointer-events-none">
            <Heart3D color={C.orange} />
          </div>
          <div className="absolute right-0 sm:-right-6 bottom-24 z-20 scale-90 pointer-events-none hidden sm:block">
            <Molecule3D color={C.green} accent={C.gold} />
          </div>
          <div className="absolute left-4 -bottom-2 z-20 hidden sm:block pointer-events-none">
            <EcgPlane3D color={C.green} />
          </div>
          <div className="absolute -left-2 sm:-left-8 bottom-28 z-30">
            <Flashcard3D C={C} enableFlip />
          </div>
        </>
      )}

      {/* Outer: CSS float only. Inner: mouse tilt. Never mix both on same transform. */}
      <div className={enableMotion ? 'da-float' : undefined}>
      <motion.div
        className="relative"
        style={{
          rotateX: enableMotion ? tilt.rotateX : 0,
          rotateY: enableMotion ? tilt.rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={enableMotion ? tilt.onMouseMove : undefined}
        onMouseLeave={enableMotion ? tilt.onMouseLeave : undefined}
      >
        {/* Desk shadow */}
        <div
          className="absolute -bottom-5 left-8 right-8 h-10 rounded-[100%] blur-xl opacity-40"
          style={{ background: C.isDark ? '#000' : C.greenDeep }}
        />

        {/* Notebook stack — layered depth */}
        <div
          className="absolute -right-2 top-8 w-full h-[92%] rounded-r-md"
          style={{
            background: C.isDark ? '#1E2C22' : C.line,
            transform: 'translateZ(-24px) rotateY(-4deg) rotate(2deg)',
          }}
        />
        <div
          className="absolute -right-1 top-4 w-full h-[95%] rounded-r-md"
          style={{
            background: C.isDark ? '#243528' : '#EDE6D9',
            transform: 'translateZ(-12px) rotateY(-2deg) rotate(1deg)',
          }}
        />

        {/* Main card */}
        <div
          className="relative rounded-md overflow-hidden border"
          style={{
            background: C.paper,
            borderColor: C.line,
            boxShadow: C.isDark
              ? '0 28px 56px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)'
              : '0 24px 48px -20px rgba(21,61,31,0.35)',
            transform: 'translateZ(0)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: C.line, background: C.soft }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white font-clinical"
                style={{ background: C.green }}
              >
                Q
              </span>
              <div>
                <p className="text-[11px] font-bold leading-none" style={{ color: C.ink }}>
                  Banco de Questões
                </p>
                <p className="text-[10px] mt-0.5 font-clinical" style={{ color: C.muted }}>
                  Medicina · SOI II · Cardio
                </p>
              </div>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded font-clinical"
              style={{ background: `${C.gold}33`, color: C.orange }}
            >
              N2
            </span>
          </div>

          <div className="px-4 pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold font-clinical" style={{ color: C.muted }}>
                Q 7 / 20
              </span>
              <span className="text-[10px] font-semibold tabular-nums font-clinical" style={{ color: C.green }}>
                12:48
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.line }}>
              <div className="h-full rounded-full w-[35%]" style={{ background: C.green }} />
            </div>
          </div>

          <div className="px-4 py-4">
            <p className="text-[13px] leading-relaxed font-medium mb-4" style={{ color: C.ink }}>
              Paciente de 58 anos chega à emergência com dor torácica em aperto, irradiando para
              mandíbula. ECG mostra supradesnivelamento de ST em DII, DIII e aVF. Conduta inicial?
            </p>
            <div className="space-y-2">
              {[
                { letter: 'A', text: 'Trombólise imediata sem confirmação' },
                { letter: 'B', text: 'AAS + anticoagulação + reperfusão urgente', active: true },
                { letter: 'C', text: 'Observação e troponina seriada apenas' },
                { letter: 'D', text: 'Cateterismo eletivo em 72h' },
              ].map((opt) => (
                <div
                  key={opt.letter}
                  className="flex items-start gap-2.5 rounded-md px-3 py-2.5 border text-[12px] leading-snug"
                  style={
                    opt.active
                      ? { borderColor: C.green, background: `${C.green}18`, color: C.ink }
                      : { borderColor: C.line, background: C.paper, color: C.muted }
                  }
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold font-clinical"
                    style={
                      opt.active
                        ? { background: C.green, color: '#fff' }
                        : { background: C.cream, color: C.muted }
                    }
                  >
                    {opt.active ? <Check className="w-3 h-3" /> : opt.letter}
                  </span>
                  <span className={opt.active ? 'font-semibold' : ''}>{opt.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mx-4 mb-4 rounded-md px-3 py-2.5 border"
            style={{ borderColor: `${C.green}50`, background: `${C.green}12` }}
          >
            <p className="text-[11px] font-bold mb-0.5" style={{ color: C.green }}>
              Correto · STEMI de parede inferior
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>
              Tempo é músculo: reperfusão o mais cedo possível + dupla antiagregação.
            </p>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionMark({
  children,
  light = false,
  C,
}: {
  children: ReactNode
  light?: boolean
  C: Palette
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="block h-px w-8"
        style={{ background: light ? 'rgba(240,235,224,0.35)' : C.orange }}
      />
      <span
        className="text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase font-clinical"
        style={{ color: light ? 'rgba(240,235,224,0.7)' : C.orange }}
      >
        {children}
      </span>
    </div>
  )
}

// ─── 3D step card ─────────────────────────────────────────────────────────────

function StepCard3D({
  step,
  i,
  C,
  reduced,
}: {
  step: { n: string; title: string; text: string }
  i: number
  C: Palette
  reduced: boolean
}) {
  const tilt = useTilt3D(10)
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 24, rotateX: -18 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.55, delay: i * 0.08, ease: easeOutExpo }}
      onMouseMove={reduced ? undefined : tilt.onMouseMove}
      onMouseLeave={reduced ? undefined : tilt.onMouseLeave}
      style={{
        rotateX: reduced ? 0 : tilt.rotateX,
        rotateY: reduced ? 0 : tilt.rotateY,
        transformPerspective: 800,
        background: i % 2 === 0 ? C.paper : C.cream,
        borderColor: C.line,
        borderRight: i < 3 ? `1px solid ${C.line}` : undefined,
      }}
      className="relative p-5 sm:p-6 border-b sm:border-b-0 last:border-b-0"
    >
      <span
        className="font-heading text-4xl italic leading-none block mb-4 opacity-30"
        style={{ color: C.green }}
      >
        {step.n}
      </span>
      <h3 className="relative text-[15px] font-bold mb-1.5" style={{ color: C.ink }}>
        {step.title}
      </h3>
      <p className="relative text-[13px] leading-relaxed" style={{ color: C.muted }}>
        {step.text}
      </p>
    </motion.div>
  )
}

// ─── Theme toggle (landing-styled) ────────────────────────────────────────────

function LandingThemeToggle({ C }: { C: Palette }) {
  // Use global 3D switch; C kept for API compatibility with call sites
  void C
  return <ThemeToggle />
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LandingPage({
  initialIsLoggedIn,
  initialVideoEmbedUrl,
  initialVideoEnabled,
}: LandingPageProps) {
  const router = useRouter()
  const prefersReduced = usePrefersReducedMotion()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Theme only after mount → first paint matches SSR (avoids hydration mismatch).
  const C = mounted && resolvedTheme === 'dark' ? DARK : LIGHT
  // Motion decorations only after mount + when user allows motion.
  const enableMotion = mounted && !prefersReduced
  const reduced = !enableMotion

  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [videoEmbedUrl, setVideoEmbedUrl] = useState(
    initialVideoEmbedUrl ?? 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  )
  const [videoEnabled, setVideoEnabled] = useState(initialVideoEnabled ?? true)
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn ?? false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [doacaoFormOpen, setDoacaoFormOpen] = useState(false)
  const [activeTool, setActiveTool] = useState(0)

  const faqs = [
    {
      question: 'Como funciona o Banco de Questões?',
      answer:
        'Nosso banco é focado 100% nas questões que realmente caem nas provas do seu curso. Tudo organizado para você filtrar, montar listas personalizadas, baixar PDF e treinar. Toda semana entra conteúdo novo.\n\nEstamos catalogando centenas de questões de estilo institucional, além de questões autorais idênticas no estilo, pegada e dificuldade, seguindo a mesma bibliografia.',
    },
    {
      question: 'As aulas realmente aprofundam o conteúdo?',
      answer:
        'Sem enrolação. As aulas são densas e aprofundadas, do jeito que precisa para residência. Slides didáticos + material complementar para treinar na hora: questões, resumos, fluxogramas.\n\nAs aulas de HAM usam formato OSCE com dinâmica em POV (primeira pessoa), baseado em estudos que mostram melhora na performance prática e habilidades não-técnicas.',
    },
    {
      question: 'Como funcionam os Flashcards?',
      answer:
        'Cada flashcard é criado com base na Taxonomia de Bloom, do básico (lembrar, entender) até o avançado (analisar, avaliar, criar), com dificuldade ajustável. Após cada card, rola revisão pós-card imediata para fixação.\n\nTudo atrelado às ementas de 4 cursos, com revisões espaçadas e integração com o banco de questões.',
    },
    {
      question: 'Os cronogramas são personalizáveis?',
      answer:
        '100% personalizados e atrelados às ementas do seu curso. Ajuste por hora do dia, dificuldade por conteúdo, cobrindo todos os módulos, submódulos, tópicos e subtópicos.\n\nCursos: Ciências Médicas (SOI/HAM I-V), Ciências Psicossociais (1°-10°), Ciências Biomédicas (1°-7°), Ciências Odontológicas (1°-10°), além de ENEM e UERJ. A IA adapta ao seu ritmo automaticamente.',
    },
    {
      question: 'Como funcionam as provas com IA?',
      answer:
        'Provas individuais totalmente customizáveis: escolha o curso, período, módulos, tópicos, dificuldade, número de questões e tempo limite. A IA gera questões adaptadas ao seu histórico.\n\nTambém temos provas gerais: simulados coletivos com ranking, análise completa de acertos, erros e tempo gasto.',
    },
    {
      question: 'A plataforma recebe atualizações?',
      answer:
        'Constantemente. Já temos mais de 20 atualizações mapeadas no roadmap: melhorias de usabilidade, novas funcionalidades, mais questões e ferramentas de revisão inteligente. A plataforma evolui junto com você.',
    },
    {
      question: 'Posso sugerir melhorias?',
      answer:
        'Claro! Feedback, sugestões de tema, dúvidas, tudo é bem-vindo. Entre em contato pelo email contato@domineaqui.com.br.',
    },
  ]

  const tools = [
    {
      id: 'questoes',
      icon: Database,
      title: 'Banco de Questões',
      blurb: '1.000+ questões por período, módulo e tópico — objetivas, discursivas e TRI.',
      detail:
        'Monte listas, treine no modo prova, baixe PDF com gabarito e revise só o que errou. Conteúdo novo toda semana, no estilo da sua banca.',
    },
    {
      id: 'flashcards',
      icon: Brain,
      title: 'Flashcards com repetição',
      blurb: 'Taxonomia de Bloom + espaçamento inteligente. Estilo Anki, atrelado às ementas.',
      detail:
        'Do lembrar ao criar: cards progressivos com revisão pós-card. Integra com o banco de questões e com o seu cronograma.',
    },
    {
      id: 'cronograma',
      icon: Calendar,
      title: 'Cronogramas por ementa',
      blurb: 'SOI/HAM, Psicossociais, Biomédicas, Odontológicas, ENEM e UERJ.',
      detail:
        'Ajuste por hora do dia e dificuldade. A plataforma reorganiza o que estudar quando a rotina muda — sem planilha manual.',
    },
    {
      id: 'provas',
      icon: Sparkles,
      title: 'Provas reais + IA',
      blurb: 'Simulados da faculdade, provas personalizadas e ranking coletivo.',
      detail:
        'Escolha curso, período, tópicos e tempo. Receba feedback questão a questão e veja onde a agulha se mexe.',
    },
    {
      id: 'manual',
      icon: Stethoscope,
      title: 'Manual Clínico',
      blurb: '220+ patologias: CID, fisiopatologia, diferenciais, conduta e farmaco.',
      detail:
        'Pesquise em segundos o que costuma exigir 5 abas abertas. Feito para plantão, OSCE e revisão rápida pré-prova.',
    },
    {
      id: 'aulas',
      icon: Video,
      title: 'Aulas densas',
      blurb: 'Ao vivo e gravadas. HAM em formato OSCE com dinâmica POV.',
      detail:
        'Sem enrolação: slides + material complementar (questões, resumos, fluxogramas) para treinar na hora.',
    },
    {
      id: 'resumos',
      icon: BookMarked,
      title: 'Resumos grátis e premium',
      blurb: 'Materiais por disciplina — versões livres e aprofundadas para download.',
      detail:
        'Inclui parcerias como os resumos da Giulia Modesto (OSCE, N1, Multiestação · SOI/HAM).',
    },
  ]

  const stats = [
    { value: 1000, suffix: '+', label: 'questões catalogadas' },
    { value: 220, suffix: '+', label: 'patologias no Manual' },
    { value: 4, suffix: '', label: 'cursos da saúde' },
    { value: 10, suffix: '+', label: 'ferramentas de estudo' },
  ]

  const courses = [
    { icon: Stethoscope, name: 'Ciências Médicas', detail: 'SOI e HAM · 1° ao 5°' },
    { icon: Brain, name: 'Ciências Psicossociais', detail: '1° ao 10° período' },
    { icon: FlaskConical, name: 'Ciências Biomédicas', detail: '1° ao 7° período' },
    { icon: GraduationCap, name: 'Ciências Odontológicas', detail: '1° ao 10° período' },
  ]

  const navLinks = [
    { label: 'Ferramentas', href: '#ferramentas' },
    { label: 'Manual Clínico', href: '/manual-clinico' },
    { label: 'Materiais', href: '/materiais' },
    { label: 'Amostra', href: '/amostra' },
    { label: 'Apoie', href: '#apoie' },
  ]

  const steps = [
    { n: '01', title: 'Crie a conta', text: 'Sem cartão. Acesso imediato ao essencial gratuito.' },
    { n: '02', title: 'Curso e período', text: 'A plataforma monta o contexto da sua ementa.' },
    {
      n: '03',
      title: 'Treine no estilo da prova',
      text: 'Questões, flashcards e simulados com feedback na hora.',
    },
    {
      n: '04',
      title: 'Revise o que importa',
      text: 'Estatísticas e ranking mostram o que ainda dói.',
    },
  ]

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (initialIsLoggedIn === undefined) {
      fetch('/api/auth/me')
        .then((r) => {
          if (r.ok) setIsLoggedIn(true)
        })
        .catch(() => {})
    }
    if (initialVideoEmbedUrl === undefined) {
      fetch('/api/admin/settings', { cache: 'no-store' })
        .then(async (r) => {
          if (r.ok) {
            const data = await r.json()
            if (data.videoEmbedUrl) setVideoEmbedUrl(data.videoEmbedUrl)
            setVideoEnabled(data.videoEnabled !== false)
          }
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!enableMotion) return
    const id = window.setInterval(() => setActiveTool((i) => (i + 1) % tools.length), 4500)
    return () => window.clearInterval(id)
  }, [enableMotion, tools.length])

  const doacaoSection = useInView(0.1)
  const videoSection = useInView()
  const ctaSection = useInView()

  const fadeUp = (delay = 0): Record<string, unknown> =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.5, delay, ease: easeOutExpo },
        }

  const goRegister = () => router.push(isLoggedIn ? '/dashboard' : '/auth/login?mode=register')
  const goLogin = () => router.push(isLoggedIn ? '/dashboard' : '/auth/login')
  const ActiveIcon = tools[activeTool].icon

  const navBg = isScrolled
    ? C.isDark
      ? 'rgba(12,20,16,0.92)'
      : 'rgba(246,241,232,0.92)'
    : 'transparent'

  return (
    <div
      className="min-h-screen overflow-x-hidden transition-colors duration-300 font-body"
      style={{ background: C.cream, color: C.ink }}
      suppressHydrationWarning
    >
      {/* Grain */}
      <div
        className="pointer-events-none fixed inset-0 z-0 mix-blend-multiply dark:mix-blend-soft-light"
        aria-hidden
        style={{
          opacity: C.isDark ? 0.2 : 0.35,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ══ NAV ═══════════════════════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: navBg,
          borderBottom: isScrolled ? `1px solid ${C.line}` : '1px solid transparent',
          backdropFilter: isScrolled ? 'blur(10px)' : undefined,
        }}
      >
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
          <a href="#topo" className="flex items-center gap-2 shrink-0" aria-label="DomineAqui">
            <Logo variant={C.isDark ? 'dark' : 'full'} size="md" />
          </a>

          <nav className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-[13px] font-semibold rounded-md transition-opacity hover:opacity-80"
                style={{ color: C.muted }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LandingThemeToggle C={C} />
            <button
              onClick={goLogin}
              className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-md text-[13px] font-semibold transition-opacity hover:opacity-80"
              style={{ color: C.ink }}
            >
              {isLoggedIn ? 'Dashboard' : 'Entrar'}
            </button>
            <button
              onClick={goRegister}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: C.orange }}
            >
              {isLoggedIn ? 'Abrir painel' : 'Criar conta'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-md"
              style={{ color: C.ink }}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t overflow-hidden"
              style={{ background: C.paper, borderColor: C.line }}
            >
              <div className="px-4 py-3 space-y-0.5">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-3 rounded-md text-sm font-semibold"
                    style={{ color: C.ink }}
                  >
                    {link.label}
                  </a>
                ))}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    goLogin()
                  }}
                  className="w-full text-left px-3 py-3 rounded-md text-sm font-semibold sm:hidden"
                  style={{ color: C.muted }}
                >
                  {isLoggedIn ? 'Dashboard' : 'Entrar'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section id="topo" className="relative pt-[60px]">
        <div
          className="absolute inset-x-0 top-0 h-[72%] sm:h-[68%] pointer-events-none"
          style={{
            background: C.isDark
              ? `linear-gradient(165deg, ${C.soft} 0%, ${C.cream} 50%, transparent 75%)`
              : `linear-gradient(165deg, ${C.soft} 0%, ${C.cream} 45%, transparent 70%)`,
          }}
        />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-16 sm:pb-20">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center">
            <motion.div
              {...(reduced
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.6, ease: easeOutExpo },
                  })}
            >
              <div
                className="inline-flex items-center gap-2 mb-5 text-[12px] font-semibold font-clinical tracking-wide"
                style={{ color: C.green }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.green }} />
                Educação em saúde — método, não improviso
              </div>

              <h1
                className="font-heading text-[2.4rem] sm:text-5xl xl:text-[3.45rem] leading-[1.08] tracking-tight mb-5"
                style={{ color: C.ink }}
              >
                Estudo de verdade
                <br />
                para quem vai{' '}
                <em className="not-italic relative inline-block" style={{ color: C.green }}>
                  atender
                  <svg
                    className="absolute -bottom-1 left-0 w-full h-2"
                    viewBox="0 0 120 8"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path
                      d="M0 6 Q30 0 60 5 T120 4"
                      fill="none"
                      stroke={C.gold}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </em>
                .
              </h1>

              <p className="text-base sm:text-lg leading-relaxed max-w-xl mb-6" style={{ color: C.muted }}>
                Questões no estilo da sua prova, flashcards com repetição, cronograma pela ementa e o
                raciocínio clínico de 220+ patologias — numa plataforma só. Da primeira prova à
                residência.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <button
                  onClick={goRegister}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md text-[15px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(206,89,41,0.55)] transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: C.orange }}
                >
                  Criar conta grátis
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push('/amostra')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md text-[15px] font-bold border transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ borderColor: C.line, color: C.ink, background: C.paper }}
                >
                  <Play className="w-4 h-4" style={{ color: C.green }} />
                  Ver 10 questões sem cadastro
                </button>
              </div>
              <p className="text-xs mb-8 font-clinical" style={{ color: C.muted }}>
                Essencial gratuito · sem cartão · acesso na hora
              </p>

              <div className="flex flex-wrap gap-2">
                {courses.map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[11px] font-semibold"
                    style={{ borderColor: C.line, background: C.paper, color: C.muted }}
                  >
                    <c.icon className="w-3 h-3" style={{ color: C.green }} />
                    {c.name.replace('Ciências ', '')}
                  </span>
                ))}
                <span
                  className="inline-flex items-center px-2.5 py-1.5 rounded border text-[11px] font-semibold font-clinical"
                  style={{ borderColor: C.line, background: C.paper, color: C.muted }}
                >
                  ENEM · UERJ
                </span>
              </div>
            </motion.div>

            <motion.div
              {...(reduced
                ? {}
                : {
                    initial: { opacity: 0, y: 28, rotateX: 12 },
                    animate: { opacity: 1, y: 0, rotateX: 0 },
                    transition: { duration: 0.75, delay: 0.1, ease: easeOutExpo },
                  })}
              className="relative lg:pl-4"
              style={{ perspective: 1400 }}
            >
              <ExamMockup C={C} enableMotion={enableMotion} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════════════════ */}
      <section className="relative border-y" style={{ borderColor: C.line, background: C.paper }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`text-center md:text-left ${i > 0 ? 'md:border-l md:pl-6' : ''}`}
                style={{ borderColor: C.line }}
              >
                <div
                  className="font-heading text-3xl sm:text-4xl tabular-nums leading-none mb-1.5 italic"
                  style={{ color: C.isDark ? C.gold : C.greenDeep }}
                >
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-[12px] sm:text-sm font-medium" style={{ color: C.muted }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMO FUNCIONA ═════════════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div {...fadeUp()} className="max-w-xl mb-10 sm:mb-12">
            <SectionMark C={C}>Do zero ao domínio</SectionMark>
            <h2 className="font-heading text-3xl sm:text-4xl leading-tight mb-3" style={{ color: C.ink }}>
              Quatro passos. Zero firula.
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: C.muted }}>
              Você fala o curso. A plataforma organiza o resto — questões, revisão e ritmo.
            </p>
          </motion.div>

          <div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border rounded-lg overflow-hidden"
            style={{ borderColor: C.line, perspective: 1000 }}
          >
            {steps.map((step, i) => (
              <StepCard3D key={step.n} step={step} i={i} C={C} reduced={reduced} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ FERRAMENTAS ═══════════════════════════════════════════════════════ */}
      <section
        id="ferramentas"
        className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden"
        style={{ background: C.greenForest }}
      >
        {/* Subtle 3D DNA in background */}
        <div className="absolute right-8 top-16 opacity-30 pointer-events-none hidden lg:block">
          {enableMotion && <DnaHelix3D color={C.gold} accent={C.green} />}
        </div>

        <div className="max-w-[1200px] mx-auto relative">
          <motion.div {...fadeUp()} className="mb-10 sm:mb-12 max-w-xl">
            <SectionMark C={C} light>
              Ferramentas
            </SectionMark>
            <h2 className="font-heading text-3xl sm:text-4xl leading-tight text-[#F0EBE0] mb-3">
              O kit completo de quem leva a prova a sério
            </h2>
            <p className="text-[15px] leading-relaxed text-[#F0EBE0]/70">
              Explore cada ferramenta. Detalhe clínico, não card genérico.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6 lg:gap-10 items-start">
            <div className="space-y-1">
              {tools.map((tool, i) => {
                const Icon = tool.icon
                const active = activeTool === i
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(i)}
                    onMouseEnter={() => setActiveTool(i)}
                    className="w-full text-left flex items-start gap-3 px-3.5 py-3 rounded-md transition-all"
                    style={{
                      background: active ? 'rgba(240,235,224,0.08)' : 'transparent',
                      borderLeft: active ? `3px solid ${C.gold}` : '3px solid transparent',
                    }}
                  >
                    <Icon
                      className="mt-0.5 shrink-0"
                      style={{
                        color: active ? C.gold : 'rgba(240,235,224,0.45)',
                        width: 18,
                        height: 18,
                      }}
                    />
                    <div>
                      <p
                        className="text-[14px] font-bold"
                        style={{ color: active ? '#F0EBE0' : 'rgba(240,235,224,0.75)' }}
                      >
                        {tool.title}
                      </p>
                      <p
                        className="text-[12px] leading-relaxed mt-0.5"
                        style={{ color: active ? 'rgba(240,235,224,0.65)' : 'rgba(240,235,224,0.4)' }}
                      >
                        {tool.blurb}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            <motion.div
              key={activeTool}
              initial={reduced ? false : { opacity: 0, rotateY: -12, x: 12 }}
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              transition={{ duration: 0.4, ease: easeOutExpo }}
              className="rounded-lg p-6 sm:p-8 border sticky top-24"
              style={{
                background: 'rgba(240,235,224,0.04)',
                borderColor: 'rgba(240,235,224,0.12)',
                transformStyle: 'preserve-3d',
                perspective: 800,
              }}
            >
              <div
                className="inline-flex h-11 w-11 items-center justify-center rounded-md mb-5"
                style={{ background: `${C.gold}22`, color: C.gold }}
              >
                <ActiveIcon className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-2xl text-[#F0EBE0] mb-3">{tools[activeTool].title}</h3>
              <p className="text-[15px] leading-relaxed text-[#F0EBE0]/75 mb-6">
                {tools[activeTool].detail}
              </p>
              <button
                onClick={goRegister}
                className="inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-80"
                style={{ color: C.gold }}
              >
                Experimentar grátis
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ MANUAL CLÍNICO ════════════════════════════════════════════════════ */}
      <section id="manual-clinico" className="relative py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            {...fadeUp()}
            className="rounded-lg overflow-hidden border grid lg:grid-cols-[1.25fr_0.85fr]"
            style={{ borderColor: C.line, background: C.paper }}
          >
            <div className="p-6 sm:p-10 flex flex-col justify-center">
              <SectionMark C={C}>Produto carro-chefe</SectionMark>
              <h2
                className="font-heading text-3xl sm:text-[2.4rem] leading-[1.12] mb-3"
                style={{ color: C.ink }}
              >
                Manual Clínico —{' '}
                <span style={{ color: C.green }}>220+ patologias</span> na palma da mão
              </h2>
              <p className="text-[15px] leading-relaxed mb-5 max-w-lg" style={{ color: C.muted }}>
                CIDs, fisiopatologia, diagnósticos diferenciais, farmacologia e fluxogramas. Pare de
                abrir 5 abas pra resolver 1 patologia.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 mb-7">
                {['Semestral · Anual · Vitalício', 'Pix, cartão ou boleto', 'Acesso imediato', 'Busca em segundos'].map(
                  (t) => (
                    <li
                      key={t}
                      className="flex items-center gap-2 text-[13px] font-medium"
                      style={{ color: C.ink }}
                    >
                      <Check className="w-4 h-4 shrink-0" style={{ color: C.green }} />
                      {t}
                    </li>
                  )
                )}
              </ul>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/manual-clinico"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-md text-sm font-bold text-white transition-all hover:brightness-110"
                  style={{ background: C.green }}
                >
                  Abrir o Manual Clínico
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/ldpg-mnclinico"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-md text-sm font-bold border transition-opacity hover:opacity-80"
                  style={{ borderColor: C.line, color: C.ink }}
                >
                  Ver os planos
                </a>
              </div>
            </div>

            <div
              className="p-6 sm:p-8 border-t lg:border-t-0 lg:border-l flex flex-col justify-center relative overflow-hidden"
              style={{ borderColor: C.line, background: C.soft }}
            >
              <div className="absolute right-4 top-4 opacity-40 pointer-events-none">
                {enableMotion && <Heart3D color={C.orange} />}
              </div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wider mb-4 font-clinical"
                style={{ color: C.muted }}
              >
                Índice rápido
              </p>
              <ol className="space-y-0">
                {[
                  { n: '01', t: 'Cardiologia & emergência' },
                  { n: '02', t: 'Neurologia clínica' },
                  { n: '03', t: 'Farmacologia aplicada' },
                  { n: '04', t: 'Condutas e fluxogramas' },
                  { n: '05', t: 'Diagnósticos diferenciais' },
                ].map((row) => (
                  <li
                    key={row.n}
                    className="flex items-center gap-3 py-3 border-b last:border-b-0"
                    style={{ borderColor: `${C.line}99` }}
                  >
                    <span className="font-heading text-lg italic tabular-nums" style={{ color: C.green }}>
                      {row.n}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: C.ink }}>
                      {row.t}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ PARCERIA GIULIA ═══════════════════════════════════════════════════ */}
      <section className="relative pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.a
            href="https://domineaqui.com.br/materiais?folder=6a00eb6af5b0dd58adb5fcab"
            target="_blank"
            rel="noopener noreferrer"
            {...fadeUp()}
            className="group block rounded-lg overflow-hidden border transition-shadow hover:shadow-[0_20px_40px_-24px_rgba(21,61,31,0.45)]"
            style={{ borderColor: C.line, background: C.paper }}
          >
            <div className="lg:hidden">
              <Image
                src="https://i.imgur.com/9h3bMzL.png"
                alt="Resumos da Giulia Modesto"
                width={2073}
                height={758}
                className="w-full h-auto block"
                sizes="100vw"
              />
              <div className="p-5">
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider mb-2 font-clinical"
                  style={{ color: C.orange }}
                >
                  Parceria exclusiva
                </p>
                <h3 className="font-heading text-xl mb-1.5" style={{ color: C.ink }}>
                  Resumos da Giulia Modesto
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.muted }}>
                  OSCE, N1 e Multiestação. SOI e HAM · Medicina · 1° e 2° períodos.
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: C.green }}>
                  Ver resumos <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            <div className="hidden lg:block relative" style={{ aspectRatio: '2073/758' }}>
              <Image
                src="https://i.imgur.com/9h3bMzL.png"
                alt="Resumos da Giulia Modesto"
                fill
                className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.015]"
                sizes="1200px"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, transparent 30%, rgba(15,36,24,0.88) 78%, rgba(15,36,24,0.95) 100%)',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-end p-10">
                <div className="w-[40%]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-3 text-[#E2A43E] font-clinical">
                    Parceria exclusiva
                  </p>
                  <h3 className="font-heading text-[1.7rem] text-[#F0EBE0] mb-2 leading-tight">
                    Resumos da Giulia Modesto
                  </h3>
                  <p className="text-sm text-[#F0EBE0]/75 mb-5 leading-relaxed">
                    Resumos aprofundados no formato da prova: OSCE, N1 e Multiestação. SOI e HAM · 1°
                    e 2° períodos.
                  </p>
                  <span
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold text-white"
                    style={{ background: C.orange }}
                  >
                    Ver resumos <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </motion.a>
        </div>
      </section>

      {/* ══ CURSOS ════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 border-t" style={{ borderColor: C.line }}>
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            {...fadeUp()}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
          >
            <div>
              <SectionMark C={C}>Cobertura</SectionMark>
              <h2 className="font-heading text-3xl sm:text-4xl leading-tight" style={{ color: C.ink }}>
                Ciências da Saúde, de ponta a ponta
              </h2>
            </div>
            <p className="text-sm max-w-xs sm:text-right" style={{ color: C.muted }}>
              Cronogramas, questões e flashcards por curso, período, módulo e tópico.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-3">
            {courses.map((course, i) => (
              <motion.div
                key={course.name}
                {...fadeUp(i * 0.05)}
                whileHover={reduced ? undefined : { y: -4, rotateX: 4, scale: 1.01 }}
                style={{ transformPerspective: 700, borderColor: C.line, background: C.paper }}
                className="flex items-center gap-4 p-4 sm:p-5 rounded-md border transition-colors"
              >
                <div
                  className="h-12 w-12 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: C.soft, color: C.green }}
                >
                  <course.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[15px]" style={{ color: C.ink }}>
                    {course.name}
                  </h3>
                  <p className="text-[13px] font-clinical" style={{ color: C.muted }}>
                    {course.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {['ENEM', 'UERJ'].map((label) => (
              <span
                key={label}
                className="px-3 py-1.5 rounded-md border text-xs font-bold font-clinical"
                style={{ borderColor: C.line, color: C.muted, background: C.cream }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ VIDEO ═════════════════════════════════════════════════════════════ */}
      {videoEnabled && (
        <section className="relative py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.soft }}>
          <div
            ref={videoSection.ref}
            className={`max-w-3xl mx-auto transition-all duration-700 ${
              videoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="text-center mb-8">
              <SectionMark C={C}>Demonstração</SectionMark>
              <h2 className="font-heading text-3xl sm:text-4xl mb-2" style={{ color: C.ink }}>
                Veja a plataforma em ação
              </h2>
              <p className="text-sm" style={{ color: C.muted }}>
                Um tour rápido pelas ferramentas do dia a dia.
              </p>
            </div>
            <div
              className="aspect-video rounded-lg overflow-hidden border"
              style={{
                borderColor: C.line,
                background: C.greenDeep,
                boxShadow: C.isDark
                  ? '0 20px 50px -24px rgba(0,0,0,0.7)'
                  : '0 16px 40px -20px rgba(21,61,31,0.3)',
              }}
            >
              <iframe
                width="100%"
                height="100%"
                src={videoEmbedUrl}
                title="Demonstração da Plataforma DomineAqui"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </section>
      )}

      {/* ══ PROVAS ════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div {...fadeUp()} className="max-w-2xl mb-10">
            <SectionMark C={C}>Provas por curso</SectionMark>
            <h2 className="font-heading text-3xl sm:text-4xl leading-tight mb-3" style={{ color: C.ink }}>
              Treine com a pegada da sua faculdade
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: C.muted }}>
              Simulados por curso, período e disciplina — gabarito comentado e modo treino.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { icon: '🩺', label: 'Médicas', sub: 'SOI / HAM · 1°–5°' },
              { icon: '🧠', label: 'Psicossociais', sub: '1°–10° período' },
              { icon: '🔬', label: 'Biomédicas', sub: '1°–7° período' },
              { icon: '🦷', label: 'Odontológicas', sub: '1°–10° período' },
            ].map((c, i) => (
              <motion.div
                key={c.label}
                {...fadeUp(i * 0.05)}
                whileHover={reduced ? undefined : { y: -6, rotateX: 8, scale: 1.02 }}
                className="rounded-md border p-4 text-center"
                style={{
                  borderColor: C.line,
                  background: C.paper,
                  transformPerspective: 600,
                }}
              >
                <div className="text-2xl mb-2">{c.icon}</div>
                <p className="font-bold text-sm" style={{ color: C.ink }}>
                  {c.label}
                </p>
                <p className="text-[11px] mt-0.5 font-clinical" style={{ color: C.muted }}>
                  {c.sub}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            {[
              {
                title: 'Organizadas de verdade',
                desc: 'Por disciplina, período e semestre — acha o que precisa em segundos.',
              },
              {
                title: 'Gabarito comentado',
                desc: 'Baixe PDF com respostas comentadas para revisar offline.',
              },
              {
                title: 'Modo treino',
                desc: 'Feedback imediato questão a questão enquanto pratica.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-md border p-4"
                style={{ borderColor: C.line, background: C.cream }}
              >
                <p className="font-bold text-sm mb-1" style={{ color: C.ink }}>
                  {item.title}
                </p>
                <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div
            className="flex items-start gap-3 p-4 sm:p-5 rounded-md border"
            style={{ borderColor: `${C.gold}55`, background: `${C.gold}14` }}
          >
            <Scale className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.orange }} />
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: C.orange }}>
                Aviso legal
              </p>
              <p className="text-[11px] sm:text-xs leading-relaxed" style={{ color: C.muted }}>
                Conteúdo exclusivamente educacional. Questões de banca adaptadas de enunciados de
                domínio público ou compartilhados por estudantes. Conteúdo gerado por IA é de autoria
                da plataforma (Lei nº 9.610/1998, art. 11). A DomineAqui não possui vínculo ou endosso
                com nenhuma instituição de ensino.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ DOAÇÃO ════════════════════════════════════════════════════════════ */}
      <section
        id="apoie"
        className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden"
        style={{ background: C.greenForest }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <DoacaoEcgAnimation color="#E2A43E" opacity={1} />
        </div>

        <div
          ref={doacaoSection.ref}
          className={`relative z-10 max-w-[1200px] mx-auto transition-all duration-700 ${
            doacaoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="mb-10 max-w-2xl">
            <SectionMark C={C} light>
              Comunidade
            </SectionMark>
            <h2 className="font-heading text-3xl sm:text-4xl text-[#F0EBE0] mb-3 leading-tight">
              Apoie quem mantém o essencial gratuito
            </h2>
            <p className="text-[15px] leading-relaxed text-[#F0EBE0]/70">
              Banco de questões, provas e simulados são mantidos pela comunidade. IA e aulas são
              pagas — cada doação ajuda a manter o núcleo livre e acessível.
            </p>
          </div>

          <div
            className="relative rounded-lg overflow-hidden border"
            style={{
              background: 'rgba(240,235,224,0.04)',
              borderColor: 'rgba(240,235,224,0.12)',
            }}
          >
            <div className="relative z-10 p-5 sm:p-8">
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <DoacaoContent onDonateClick={() => setDoacaoFormOpen(true)} />
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E2A43E]/40" />
                    <span className="text-xs font-semibold text-[#E2A43E]/80 font-clinical">
                      Quem já apoiou
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E2A43E]/40" />
                  </div>
                  {doacaoSection.isVisible && <DoacaoRanking glass />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {doacaoFormOpen && (
        <DoacaoForm open={doacaoFormOpen} onClose={() => setDoacaoFormOpen(false)} />
      )}

      {/* ══ FAQ ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div {...fadeUp()} className="mb-10">
            <SectionMark C={C}>Dúvidas</SectionMark>
            <h2 className="font-heading text-3xl sm:text-4xl mb-2" style={{ color: C.ink }}>
              Perguntas frequentes
            </h2>
            <p className="text-sm" style={{ color: C.muted }}>
              Direto ao ponto — se faltar algo, manda e-mail.
            </p>
          </motion.div>

          <div className="border rounded-lg overflow-hidden" style={{ borderColor: C.line }}>
            {faqs.map((faq, index) => {
              const open = openFaq === index
              return (
                <div
                  key={index}
                  className="border-b last:border-b-0"
                  style={{ borderColor: C.line, background: open ? C.paper : C.cream }}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left gap-3"
                  >
                    <span className="font-semibold text-[14px] sm:text-[15px]" style={{ color: C.ink }}>
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                      style={{ color: C.orange }}
                    />
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden min-h-0">
                      <div className="px-5 pb-4">
                        <p
                          className="text-sm leading-relaxed whitespace-pre-line"
                          style={{ color: C.muted }}
                        >
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden" style={{ background: C.greenDeep }}>
        <div className="absolute left-10 bottom-8 opacity-25 pointer-events-none hidden md:block">
          {enableMotion && <Molecule3D color={C.gold} accent={C.green} />}
        </div>
        <div
          ref={ctaSection.ref}
          className={`max-w-3xl mx-auto text-center transition-all duration-700 ${
            ctaSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h2 className="font-heading text-3xl sm:text-4xl text-[#F0EBE0] mb-3 leading-tight">
            Chega de estudar no improviso
          </h2>
          <p className="text-[15px] text-[#F0EBE0]/70 mb-8 max-w-md mx-auto">
            Crie a conta, escolha o curso e comece com o essencial grátis — agora.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <button
              onClick={goRegister}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-md text-[15px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: C.orange }}
            >
              Começar grátis
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={goLogin}
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-md text-[15px] font-bold border transition-colors hover:bg-white/[0.06]"
              style={{ borderColor: 'rgba(240,235,224,0.2)', color: '#F0EBE0' }}
            >
              Já tenho conta
            </button>
          </div>

          <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-[#F0EBE0]/40 font-clinical">
            Canais
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <a
              href="https://chat.whatsapp.com/GPAbMSy9dBk3O8ZesnkRfR"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm font-semibold text-[#F0EBE0]/90 transition-colors hover:bg-white/[0.06]"
              style={{ borderColor: 'rgba(240,235,224,0.12)' }}
            >
              <Heart className="w-4 h-4 text-[#25D366]" />
              Grupo no WhatsApp
            </a>
            <a
              href="https://instagram.com/domineaqui.br"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm font-semibold text-[#F0EBE0]/90 transition-colors hover:bg-white/[0.06]"
              style={{ borderColor: 'rgba(240,235,224,0.12)' }}
            >
              <Instagram className="w-4 h-4" style={{ color: C.gold }} />
              @domineaqui.br
            </a>
            <a
              href="mailto:contato@domineaqui.com.br"
              className="flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm font-semibold text-[#F0EBE0]/90 transition-colors hover:bg-white/[0.06] truncate"
              style={{ borderColor: 'rgba(240,235,224,0.12)' }}
            >
              <Mail className="w-4 h-4" style={{ color: C.gold }} />
              <span className="truncate">contato@domineaqui.com.br</span>
            </a>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      <footer className="border-t py-8 px-4 sm:px-6" style={{ borderColor: C.line, background: C.cream }}>
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo variant={C.isDark ? 'dark' : 'icon'} size="sm" />
            <span className="text-sm" style={{ color: C.muted }}>
              © {new Date().getFullYear()} DomineAqui
            </span>
          </div>
          <div className="flex items-center gap-5">
            <LandingThemeToggle C={C} />
            <a
              href="/politica-de-privacidade"
              className="text-xs font-medium hover:underline"
              style={{ color: C.muted }}
            >
              Privacidade
            </a>
            <a
              href="/termos-de-servico"
              className="text-xs font-medium hover:underline"
              style={{ color: C.muted }}
            >
              Termos
            </a>
            <a
              href="https://instagram.com/domineaqui.br"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-70"
              style={{ color: C.muted }}
              title="Instagram"
            >
              <Instagram size={17} />
            </a>
            <a
              href="https://discord.gg/vdfHcvDdMw"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-70"
              style={{ color: C.muted }}
              title="Discord"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.29a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.29a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.874.89.076.076 0 0 0-.041.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 p-3 sm:hidden border-t"
        style={{
          background: C.isDark ? 'rgba(12,20,16,0.94)' : 'rgba(246,241,232,0.94)',
          borderColor: C.line,
          backdropFilter: 'blur(8px)',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        }}
      >
        <button
          onClick={goRegister}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-md text-sm font-bold text-white"
          style={{ background: C.orange }}
        >
          {isLoggedIn ? 'Ir para o Dashboard' : 'Criar conta grátis'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="h-16 sm:hidden" aria-hidden />
    </div>
  )
}
