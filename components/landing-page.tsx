'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Logo } from '@/components/logo'
import {
  ChevronDown,
  ArrowRight,
  Instagram,
  Brain,
  Calendar,
  Zap,
  Database,
  Video,
  MessageSquare,
  GraduationCap,
  Stethoscope,
  FlaskConical,
  BarChart3,
  Target,
  Heart,
  BookMarked,
  Scale,
  Menu,
  X,
} from 'lucide-react'
import { DoacaoContent } from '@/components/doacoes/doacao-content'
import { DoacaoRanking } from '@/components/doacoes/doacao-ranking'
import { DoacaoForm } from '@/components/doacoes/doacao-form'
import { DoacaoEcgAnimation } from '@/components/doacoes/doacao-ecg-animation'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
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

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, isVisible } = useInView()
  useEffect(() => {
    if (!isVisible) return
    let start = 0
    const duration = 1800
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isVisible, target])
  return (
    <span ref={ref}>
      {count.toLocaleString('pt-BR')}
      {suffix}
    </span>
  )
}

// ─── Framer Motion variants ────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface LandingPageProps {
  initialIsLoggedIn?: boolean
  initialVideoEmbedUrl?: string
  initialVideoEnabled?: boolean
}

// ─── Shared style constants ────────────────────────────────────────────────────

const GLASS_CARD =
  'bg-white/[0.055] border border-white/[0.10] backdrop-blur-xl rounded-3xl shadow-[0_0_60px_rgba(45,212,191,0.08)]'

const GLASS_CARD_SM =
  'bg-white/[0.05] border border-white/[0.09] backdrop-blur-xl rounded-2xl'

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage({
  initialIsLoggedIn,
  initialVideoEmbedUrl,
  initialVideoEnabled,
}: LandingPageProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [videoEmbedUrl, setVideoEmbedUrl] = useState(
    initialVideoEmbedUrl ?? 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  )
  const [videoEnabled, setVideoEnabled] = useState(initialVideoEnabled ?? true)
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn ?? false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [doacaoFormOpen, setDoacaoFormOpen] = useState(false)

  // ── Data ──────────────────────────────────────────────────────────────────

  const faqs = [
    {
      question: 'Como funciona o Banco de Questões?',
      answer:
        'Nosso banco é focado 100% nas questões que realmente caem nas provas do seu curso. Tudo organizado para você filtrar, montar listas personalizadas, baixar PDF e treinar. Toda semana entra conteúdo novo.\n\nEstamos catalogando centenas de questões de estilo institucional, além de questões autorais idênticas no estilo, pegada e dificuldade, seguindo a mesma bibliografia.',
    },
    {
      question: 'As aulas realmente aprofundam o conteúdo?',
      answer:
        'Sem enrolação. As aulas são densas e aprofundadas, do jeito que precisa para residência. Slides didáticos + material complementar para treinar na hora — questões, resumos, fluxogramas.\n\nAs aulas de HAM usam formato OSCE com dinâmica em POV (primeira pessoa), baseado em estudos que mostram melhora na performance prática e habilidades não-técnicas.',
    },
    {
      question: 'Como funcionam os Flashcards?',
      answer:
        'Cada flashcard é criado com base na Taxonomia de Bloom — do básico (lembrar, entender) até o avançado (analisar, avaliar, criar), com dificuldade ajustável. Após cada card, rola revisão pós-card imediata para fixação.\n\nTudo atrelado às ementas de 4 cursos, com revisões espaçadas e integração com o banco de questões.',
    },
    {
      question: 'Os cronogramas são personalizáveis?',
      answer:
        '100% personalizados e atrelados às ementas do seu curso. Ajuste por hora do dia, dificuldade por conteúdo, cobrindo todos os módulos, submódulos, tópicos e subtópicos.\n\nCursos: Ciências Médicas (SOI/HAM I-V), Ciências Psicossociais (1°-10°), Ciências Biomédicas (1°-7°), Ciências Odontológicas (1°-10°), além de ENEM e UERJ. A IA adapta ao seu ritmo automaticamente.',
    },
    {
      question: 'Como funcionam as provas com IA?',
      answer:
        'Provas individuais totalmente customizáveis: escolha o curso, período, módulos, tópicos, dificuldade, número de questões e tempo limite. A IA gera questões adaptadas ao seu histórico.\n\nTambém temos provas gerais — simulados coletivos com ranking, análise completa de acertos, erros e tempo gasto.',
    },
    {
      question: 'A plataforma recebe atualizações?',
      answer:
        'Constantemente. Já temos mais de 20 atualizações mapeadas no roadmap: melhorias de usabilidade, novas funcionalidades, mais questões e ferramentas de revisão inteligente. A plataforma evolui junto com você.',
    },
    {
      question: 'Posso sugerir melhorias?',
      answer:
        'Claro! Feedback, sugestões de tema, dúvidas — tudo é bem-vindo. Entre em contato pelo email contato@domineaqui.com.br.',
    },
  ]

  const features = [
    {
      icon: Database,
      title: 'Banco de Questões',
      description:
        '1.000+ questões organizadas por período, módulo e tópico. Objetivas, discursivas e TRI.',
    },
    {
      icon: Brain,
      title: 'Flashcards Inteligentes',
      description:
        'Repetição espaçada com IA que aprende seu ritmo. Compráveis estilo Anki, atrelados às ementas de todos os cursos.',
    },
    {
      icon: BookMarked,
      title: 'Resumos Grátis e Pagos',
      description:
        'Resumos completos de todas as disciplinas. Versões gratuitas e premium disponíveis para download.',
    },
    {
      icon: Calendar,
      title: 'Cronogramas Personalizados',
      description:
        'Ementas completas de Ciências Médicas, Psicossociais, Biomédicas e Odontológicas. Adaptados ao seu ritmo.',
    },
    {
      icon: Zap,
      title: 'Provas Reais + IA',
      description:
        'Provas antigas da faculdade, provas personalizadas com IA e simulados coletivos com ranking.',
    },
    {
      icon: Video,
      title: 'Aulas ao Vivo e Gravadas',
      description:
        'Aulas densas focadas em residência. HAM em formato OSCE com dinâmica POV em primeira pessoa.',
    },
    {
      icon: Target,
      title: 'Manual Clínico +200 Patologias',
      description:
        'Classificação, Fisiopatologia, Diagnóstico, Diferenciais, Tratamento e Farmacologia detalhada em cada patologia.',
    },
  ]

  const stats = [
    { value: 1000, suffix: '+', label: 'Questões no Banco' },
    { value: 4, suffix: '', label: 'Cursos Disponíveis' },
    { value: 10, suffix: '+', label: 'Ferramentas de Estudo' },
    { value: 20, suffix: '+', label: 'Áreas da Saúde' },
  ]

  const courses = [
    { icon: Stethoscope, name: 'Ciências Médicas', detail: 'SOI e HAM — 1° ao 5° Período' },
    { icon: Brain, name: 'Ciências Psicossociais', detail: '1° ao 10° Período' },
    { icon: FlaskConical, name: 'Ciências Biomédicas', detail: '1° ao 7° Período' },
    { icon: GraduationCap, name: 'Ciências Odontológicas', detail: '1° ao 10° Período' },
  ]

  const navLinks = [
    { label: 'Início', href: '#hero' },
    { label: 'Recursos', href: '#recursos' },
    { label: 'Materiais', href: '#materiais' },
    { label: 'Questões', href: '#questoes' },
    { label: 'Sobre', href: '#apoie' },
  ]

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (initialIsLoggedIn === undefined) {
      fetch('/api/auth/me')
        .then((r) => {
          if (r.ok) setIsLoggedIn(true)
        })
        .catch(() => {})
    }
    if (initialVideoEmbedUrl === undefined) {
      fetch('/api/admin/settings')
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

  // ── Section observers ─────────────────────────────────────────────────────

  const statsSection = useInView()
  const featuresSection = useInView(0.08)
  const coursesSection = useInView()
  const videoSection = useInView()
  const ctaSection = useInView()
  const faqSection = useInView(0.08)
  const doacaoSection = useInView(0.1)
  const afyaSection = useInView(0.1)

  // ── Animation helpers ─────────────────────────────────────────────────────

  const motionProps = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: 'hidden' as const,
          whileInView: 'show' as const,
          viewport: { once: true, amount: 0.15 },
          variants: {
            hidden: { opacity: 0, y: 24 },
            show: { opacity: 1, y: 0, transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] } },
          },
        }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen text-slate-50 overflow-x-hidden"
      style={{ backgroundColor: '#040816' }}
    >
      {/* Global radial glows */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden sm:block" aria-hidden>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(ellipse, #2DD4BF22 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/3 right-0 w-[600px] h-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(ellipse, #4ADE8018 0%, transparent 70%)' }}
        />
      </div>

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'backdrop-blur-2xl shadow-lg shadow-black/30 border-b border-white/[0.06]'
            : 'bg-transparent'
        }`}
        style={isScrolled ? { backgroundColor: 'rgba(4,8,22,0.85)' } : undefined}
      >
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Logo variant="full" size="md" />
          </div>

          {/* Nav links — desktop */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(isLoggedIn ? '/dashboard' : '/auth/login')}
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] hover:text-slate-100 transition-all"
            >
              {isLoggedIn ? 'Dashboard' : 'Entrar'}
            </button>
            <button
              onClick={() => router.push(isLoggedIn ? '/dashboard' : '/auth/register')}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold text-[#040816] transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #4ADE80 0%, #2DD4BF 100%)' }}
            >
              {isLoggedIn ? 'Ir para Dashboard' : 'Criar conta gratuita'}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden ml-1 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-all"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-white/[0.06] backdrop-blur-2xl px-5 py-4 space-y-1"
              style={{ backgroundColor: 'rgba(4,8,22,0.95)' }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/[0.06] hover:text-slate-100 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-white/[0.06]">
                <button
                  onClick={() => router.push(isLoggedIn ? '/dashboard' : '/auth/login')}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/[0.06] hover:text-slate-100 transition-colors"
                >
                  {isLoggedIn ? 'Dashboard' : 'Entrar'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section id="hero" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background hero image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://i.imgur.com/5BA1wF8.png"
            alt="Fundo médico futurista DomineAqui"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Dark overlay gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(4,8,22,0.80) 0%, rgba(4,8,22,0.70) 50%, rgba(4,8,22,0.98) 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, rgba(4,8,22,0.60) 0%, transparent 40%, transparent 60%, rgba(4,8,22,0.60) 100%)',
            }}
          />
        </div>

        {/* Teal glow behind card */}
        <div
          className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[480px] h-[380px] rounded-full blur-[80px] opacity-25 pointer-events-none hidden lg:block z-[1]"
          style={{ background: 'radial-gradient(ellipse, #2DD4BF 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-[1280px] mx-auto px-5 lg:px-8 w-full py-16 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center min-h-[calc(100vh-64px)]">
            {/* ── Left: text ── */}
            <motion.div
              {...(shouldReduceMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 32 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                  })}
              className="flex flex-col justify-center py-20 lg:py-0"
            >
              {/* 3D Logo — mobile only */}
              <div className="flex justify-center lg:hidden mb-8">
                <motion.div
                  animate={shouldReduceMotion ? {} : {
                    y: [0, -14, 0],
                    rotateY: [0, 15, 0, -15, 0],
                    rotateX: [0, -6, 0, 6, 0],
                    scale: [1, 1.04, 1],
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ perspective: 900, transformStyle: 'preserve-3d' }}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Glow pulse */}
                    <motion.div
                      animate={shouldReduceMotion ? {} : { opacity: [0.4, 0.85, 0.4], scale: [1, 1.25, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute rounded-full blur-3xl"
                      style={{
                        width: '180px', height: '180px',
                        background: 'radial-gradient(ellipse, rgba(74,222,128,0.55) 0%, rgba(45,212,191,0.28) 55%, transparent 75%)',
                      }}
                    />
                    <Image
                      src="/logo3d.png"
                      alt="DomineAqui Logo 3D"
                      width={220}
                      height={220}
                      priority
                      className="relative object-contain"
                      style={{
                        width: '180px',
                        height: '180px',
                        filter: 'drop-shadow(0 0 22px rgba(74,222,128,0.85)) drop-shadow(0 0 55px rgba(45,212,191,0.45))',
                      }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-sm font-semibold text-emerald-400">Acesso Amplo &amp; Gratuito</span>
              </div>

              {/* Headline */}
              <h1 className="font-bold tracking-tight leading-[1.08] mb-6 text-4xl sm:text-5xl xl:text-6xl">
                <span className="text-slate-50">Seja o Foco.</span>
                <br />
                <span
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #4ADE80 0%, #D4A574 55%, #fb923c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Seja a Referência.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 max-w-lg mb-5 leading-relaxed">
                Plataforma completa de estudo para alunos de saúde — tudo integrado para você dominar.
              </p>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-2 mb-10">
                {[
                  'Banco de Questões',
                  'Resumos Grátis e Pagos',
                  'Provas Antigas',
                  'Flashcards Anki',
                  'Aulas ao Vivo e Gravadas',
                  'Manual Clínico +200 Patologias',
                ].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium text-teal-300 border border-teal-400/20 bg-teal-400/[0.07]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <button
                  onClick={() => router.push('/auth/register')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-base font-bold text-[#040816] transition-all hover:opacity-90 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(74,222,128,0.35)] shadow-[0_0_20px_rgba(74,222,128,0.20)]"
                  style={{ background: 'linear-gradient(135deg, #4ADE80 0%, #2DD4BF 100%)' }}
                >
                  Começar Gratuitamente
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-2xl text-base font-semibold text-slate-200 border border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.09] hover:border-white/[0.18] transition-all"
                >
                  Já tenho conta
                </button>
              </div>

              {/* Course badges */}
              <div className="flex flex-wrap gap-2">
                {courses.map((course) => (
                  <div
                    key={course.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 border border-white/[0.09] bg-white/[0.04]"
                  >
                    <course.icon className="w-3 h-3 text-teal-400" />
                    {course.name}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Right: holographic panel card ── */}
            <motion.div
              {...(shouldReduceMotion
                ? {}
                : {
                    initial: { opacity: 0, x: 32 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] },
                  })}
              className="hidden lg:flex items-center justify-center"
            >
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                {/* Glow ring — reduzido */}
                <div
                  className="absolute -inset-4 rounded-[2.5rem] blur-3xl opacity-15"
                  style={{ background: 'radial-gradient(ellipse, #2DD4BF 0%, transparent 70%)' }}
                />
                {/* Card */}
                <div
                  className="relative rounded-3xl overflow-hidden border border-white/[0.08]"
                  style={{
                    background: 'rgba(7,18,36,0.55)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 0 30px rgba(45,212,191,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
                    width: 'clamp(340px, 42vw, 580px)',
                  }}
                >
                  <Image
                    src="https://i.imgur.com/shnMPTl.jpeg"
                    alt="Dashboard médico holográfico"
                    width={1536}
                    height={1024}
                    priority
                    className="w-full h-auto rounded-3xl object-cover opacity-60"
                    sizes="(max-width: 1280px) 42vw, 580px"
                  />
                  {/* Overlay escuro sobre imagem */}
                  <div
                    className="absolute inset-0 rounded-3xl"
                    style={{ background: 'rgba(4,8,22,0.45)' }}
                  />

                  {/* 3D Logo overlay — desktop, centralizado */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={shouldReduceMotion ? {} : {
                        y: [0, -16, 0],
                        rotateY: [0, 16, 0, -16, 0],
                        rotateX: [0, -7, 0, 7, 0],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ perspective: 1000, transformStyle: 'preserve-3d', position: 'relative' }}
                    >
                      {/* Glow pulse */}
                      <motion.div
                        animate={shouldReduceMotion ? {} : { opacity: [0.4, 0.9, 0.4], scale: [1, 1.3, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute rounded-full blur-3xl"
                        style={{
                          width: '280px', height: '280px',
                          top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'radial-gradient(ellipse, rgba(74,222,128,0.55) 0%, rgba(45,212,191,0.25) 55%, transparent 75%)',
                        }}
                      />
                      <Image
                        src="/logo3d.png"
                        alt="DomineAqui Logo 3D"
                        width={300}
                        height={300}
                        priority
                        className="relative object-contain"
                        style={{
                          width: '260px',
                          height: '260px',
                          filter: 'drop-shadow(0 0 28px rgba(74,222,128,0.9)) drop-shadow(0 0 70px rgba(45,212,191,0.5))',
                        }}
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <ChevronDown className="w-5 h-5 text-slate-500" />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS
      ══════════════════════════════════════════ */}
      <section className="py-16 px-5 relative z-10">
        <div
          ref={statsSection.ref}
          className={`max-w-[1280px] mx-auto transition-all duration-700 ${
            statsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className={`${GLASS_CARD} p-6 sm:p-8`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="text-3xl md:text-4xl font-bold mb-1 tabular-nums"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #4ADE80 0%, #2DD4BF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FERRAMENTAS / FEATURES
      ══════════════════════════════════════════ */}
      <section id="recursos" className="py-24 px-5 relative overflow-hidden">
        {/* Decorative medical image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="https://i.imgur.com/y8KB9OS.jpeg"
            alt=""
            fill
            className="object-cover object-center"
            style={{ opacity: 0.04 }}
            sizes="100vw"
          />
          <div className="absolute inset-0" style={{ background: 'rgba(4,8,22,0.92)' }} />
        </div>

        <div ref={featuresSection.ref} className="relative z-10 max-w-[1280px] mx-auto">
          <motion.div {...motionProps()} className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-3">
              Ferramentas
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
              Tudo que você precisa para dominar
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Ferramentas integradas e inteligentes, desenhadas para o seu curso
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...(shouldReduceMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 24 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, amount: 0.2 },
                      transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
                    })}
                whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -2 }}
                className={`${GLASS_CARD_SM} p-6 cursor-default group transition-all duration-300 hover:border-teal-400/20 hover:shadow-[0_0_40px_rgba(45,212,191,0.10)]`}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 border border-white/[0.08]"
                  style={{ background: 'rgba(45,212,191,0.10)' }}
                >
                  <feature.icon className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COBERTURA DAS CIÊNCIAS DA SAÚDE
      ══════════════════════════════════════════ */}
      <section id="materiais" className="py-24 px-5 relative">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(74,222,128,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(45,212,191,0.04) 0%, transparent 60%)',
          }}
        />

        <div ref={coursesSection.ref} className="relative z-10 max-w-[1280px] mx-auto">
          <motion.div {...motionProps()} className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
              Cobertura
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
              Ciências da Saúde completas
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Cronogramas, questões e flashcards organizados por curso, período, módulo e tópico
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {courses.map((course, i) => (
              <motion.div
                key={course.name}
                {...(shouldReduceMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 20 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true },
                      transition: { duration: 0.5, delay: i * 0.09 },
                    })}
                whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                className={`${GLASS_CARD_SM} flex items-center gap-4 p-5 transition-all duration-300 hover:border-emerald-400/20`}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/[0.08]"
                  style={{ background: 'rgba(74,222,128,0.09)' }}
                >
                  <course.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">{course.name}</h3>
                  <p className="text-sm text-slate-400">{course.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            {...motionProps(0.3)}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              { icon: Target, label: 'ENEM' },
              { icon: Target, label: 'UERJ' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.09] bg-white/[0.04] text-sm text-slate-400"
              >
                <Icon className="w-3.5 h-3.5 text-teal-400" />
                {label}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          VIDEO DEMO
      ══════════════════════════════════════════ */}
      {videoEnabled && (
        <section className="py-24 px-5 relative">
          <div
            ref={videoSection.ref}
            className={`max-w-4xl mx-auto transition-all duration-700 ${
              videoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
                Veja a plataforma em ação
              </h2>
              <p className="text-slate-400">
                Conheça as ferramentas que vão transformar seu estudo
              </p>
            </div>
            <div
              className={`${GLASS_CARD} overflow-hidden aspect-video`}
              style={{ padding: 0 }}
            >
              <iframe
                width="100%"
                height="100%"
                src={videoEmbedUrl}
                title="Demonstração da Plataforma"
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

      {/* ══════════════════════════════════════════
          TREINE COM PROVAS REAIS
      ══════════════════════════════════════════ */}
      <section id="questoes" className="py-24 px-5 relative overflow-hidden">
        {/* Abstract gradient background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="https://i.imgur.com/ILxwYcT.png"
            alt=""
            fill
            className="object-cover object-center"
            style={{ opacity: 0.22 }}
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(4,8,22,0.82)' }}
          />
        </div>

        <div
          ref={afyaSection.ref}
          className={`relative z-10 max-w-[1280px] mx-auto transition-all duration-700 ${
            afyaSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5 border border-red-500/20 bg-red-500/[0.08] text-red-400">
              <GraduationCap className="w-3.5 h-3.5" />
              Provas por Curso
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
              Treine com provas reais da sua faculdade
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Acesse e treine com simulados baseados nas provas do seu curso — organizados por
              curso, período e disciplina.
            </p>
          </div>

          {/* Course cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              {
                icon: '🩺',
                label: 'Ciências Médicas',
                sub: 'SOI / HAM · 1°–5° Período',
                color: '#DC2626',
                bg: 'rgba(220,38,38,0.08)',
                border: 'rgba(220,38,38,0.20)',
              },
              {
                icon: '🧠',
                label: 'Ciências Psicossociais',
                sub: '1°–10° Período',
                color: '#7C3AED',
                bg: 'rgba(124,58,237,0.08)',
                border: 'rgba(124,58,237,0.20)',
              },
              {
                icon: '🔬',
                label: 'Ciências Biomédicas',
                sub: '1°–7° Período',
                color: '#059669',
                bg: 'rgba(5,150,105,0.08)',
                border: 'rgba(5,150,105,0.20)',
              },
              {
                icon: '🦷',
                label: 'Ciências Odontológicas',
                sub: '1°–10° Período',
                color: '#2563EB',
                bg: 'rgba(37,99,235,0.08)',
                border: 'rgba(37,99,235,0.20)',
              },
            ].map((c, i) => (
              <motion.div
                key={c.label}
                {...(shouldReduceMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 16 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true },
                      transition: { duration: 0.45, delay: i * 0.07 },
                    })}
                whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.02 }}
                className="relative rounded-2xl p-4 text-center transition-all duration-300 cursor-default backdrop-blur-sm"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div className="text-3xl mb-2">{c.icon}</div>
                <p className="font-bold text-sm text-slate-100">{c.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{c.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Feature highlights */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: BookMarked,
                title: 'Provas organizadas',
                desc: 'Por disciplina, período e semestre — fácil de achar o que você precisa.',
              },
              {
                icon: BarChart3,
                title: 'Gabarito comentado',
                desc: 'Baixe PDF com gabarito e respostas comentadas para revisão.',
              },
              {
                icon: Zap,
                title: 'Modo treino',
                desc: 'Receba feedback imediato questão a questão enquanto pratica.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className={`${GLASS_CARD_SM} flex items-start gap-3 p-5`}
              >
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]"
                  style={{ background: 'rgba(96,165,250,0.10)' }}
                >
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-100">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Legal disclaimer */}
          <div
            className="flex items-start gap-3 p-5 rounded-2xl border border-amber-500/20"
            style={{ background: 'rgba(120,53,15,0.15)' }}
          >
            <Scale className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-300 mb-1">Aviso Legal</p>
              <p className="text-xs text-amber-400/80 leading-relaxed">
                Este conteúdo é disponibilizado exclusivamente para fins educacionais e de
                preparação acadêmica. As questões de banca presentes na plataforma foram adaptadas
                a partir de enunciados de domínio público ou compartilhados pelos próprios
                estudantes, e não reproduzem integralmente obras protegidas. As questões geradas
                por inteligência artificial são de autoria exclusiva da plataforma: nos termos da
                Lei nº 9.610/1998 (art. 11), autor é a pessoa física criadora da obra — sistemas
                de IA não são titulares de direitos autorais, e o conteúdo por eles gerado não
                goza de proteção autoral independente. A DomineAqui não possui vínculo, parceria
                ou endosso com nenhuma instituição de ensino.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DOAÇÃO
      ══════════════════════════════════════════ */}
      <section id="apoie" className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, rgba(70,129,82,0.6) 0%, transparent 70%)' }}
          />
        </div>

        <div
          ref={doacaoSection.ref}
          className={`relative z-10 max-w-[1280px] mx-auto transition-all duration-700 ${
            doacaoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5 border border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-400">
              <Heart className="w-3.5 h-3.5" />
              Apoie a plataforma
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
              Apoie quem salva vidas com conhecimento
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Banco de questões, provas e simulados são gratuitos e mantidos pela comunidade.
              Ferramentas com IA e aulas são pagas — mas cada doação ajuda a manter o núcleo da
              plataforma livre e acessível para todos.
            </p>
          </div>

          {/* Donation panel */}
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background:
                'linear-gradient(145deg, rgba(12,22,14,0.96) 0%, rgba(8,18,10,0.98) 100%)',
              border: '1px solid rgba(70,129,82,0.22)',
              boxShadow:
                '0 24px 80px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* ECG top */}
            <div className="absolute top-0 left-0 right-0 h-12 opacity-15 pointer-events-none overflow-hidden">
              <DoacaoEcgAnimation color="#4ade80" opacity={1} />
            </div>
            {/* Top shine */}
            <div className="absolute top-0 left-16 right-16 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />
            {/* Subtle grid */}
            <div
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            <div className="relative z-10 p-6 sm:p-8">
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <DoacaoContent onDonateClick={() => setDoacaoFormOpen(true)} />
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="h-px flex-1"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(70,129,82,0.4))',
                      }}
                    />
                    <span className="text-xs font-semibold text-emerald-400/60">
                      Quem já apoiou
                    </span>
                    <div
                      className="h-px flex-1"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(70,129,82,0.4), transparent)',
                      }}
                    />
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

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section className="py-24 px-5 relative">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.05) 0%, transparent 60%)',
          }}
        />
        <div ref={faqSection.ref} className="relative z-10 max-w-3xl mx-auto">
          <motion.div {...motionProps()} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-400">Tire suas dúvidas sobre a plataforma</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                {...(shouldReduceMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 16 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true },
                      transition: { duration: 0.4, delay: index * 0.04 },
                    })}
                className={`${GLASS_CARD_SM} overflow-hidden transition-all duration-300 ${
                  openFaq === index
                    ? 'border-teal-400/20 shadow-[0_0_30px_rgba(45,212,191,0.08)]'
                    : 'hover:border-white/[0.14]'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="font-medium text-slate-100 pr-4 text-sm sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-teal-400 flex-shrink-0 transition-transform duration-300 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === index && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-0">
                        <div className="h-px bg-white/[0.07] mb-4" />
                        <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="py-24 px-5 relative overflow-hidden">
        {/* Abstract gradient */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="https://i.imgur.com/ILxwYcT.png"
            alt=""
            fill
            className="object-cover object-center"
            style={{ opacity: 0.18 }}
            sizes="100vw"
          />
          <div className="absolute inset-0" style={{ background: 'rgba(4,8,22,0.80)' }} />
        </div>

        <div
          ref={ctaSection.ref}
          className={`relative z-10 max-w-3xl mx-auto text-center transition-all duration-700 ${
            ctaSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div
            className={`${GLASS_CARD} p-10 sm:p-14`}
            style={{
              boxShadow:
                '0 0 80px rgba(45,212,191,0.12), 0 0 40px rgba(74,222,128,0.06), inset 0 1px 0 rgba(255,255,255,0.07)',
            }}
          >
            {/* Glow dot */}
            <div className="flex justify-center mb-6">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ background: 'linear-gradient(135deg, #4ADE80, #2DD4BF)' }}
              />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
              Pronto para dominar seus estudos?
            </h2>
            <p className="text-slate-400 mb-10 max-w-lg mx-auto">
              Crie sua conta gratuita e acesse todas as ferramentas da plataforma agora mesmo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
              <button
                onClick={() => router.push('/auth/register')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold text-[#040816] transition-all hover:opacity-90 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(74,222,128,0.35)] shadow-[0_0_20px_rgba(74,222,128,0.20)]"
                style={{ background: 'linear-gradient(135deg, #4ADE80 0%, #2DD4BF 100%)' }}
              >
                Começar Gratuitamente
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-2xl text-base font-semibold text-slate-200 border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/[0.18] transition-all"
              >
                Já tenho conta
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <span>Siga no Instagram</span>
              <a
                href="https://instagram.com/domineaqui.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                <Instagram className="w-4 h-4" />
                @domineaqui.br
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer
        className="border-t border-white/[0.07] py-8 px-5"
        style={{ backgroundColor: 'rgba(4,8,22,0.98)' }}
      >
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo variant="icon" size="sm" />
            <span className="text-sm text-slate-500">
              © {new Date().getFullYear()} DomineAqui
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/domineaqui.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-200 transition-colors"
              title="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://discord.gg/vdfHcvDdMw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-200 transition-colors"
              title="Discord"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.29a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.29a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.874.89.076.076 0 0 0-.041.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
