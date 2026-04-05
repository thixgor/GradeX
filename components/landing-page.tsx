'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import {
  ChevronDown,
  BookOpen,
  Users,
  Zap,
  FileText,
  MessageSquare,
  ArrowRight,
  Instagram,
  Brain,
  Calendar,
  Lightbulb,
  Database,
  CheckCircle2,
  Video,
  HelpCircle,
  ChevronUp,
  GraduationCap,
  Stethoscope,
  FlaskConical,
  Sparkles,
  BarChart3,
  Shield,
  Clock,
  Target,
  Play,
  Heart,
  AlertCircle,
  BookMarked,
  Scale
} from 'lucide-react'
import { DoacaoContent } from '@/components/doacoes/doacao-content'
import { DoacaoRanking } from '@/components/doacoes/doacao-ranking'
import { DoacaoForm } from '@/components/doacoes/doacao-form'
import { DoacaoEcgAnimation } from '@/components/doacoes/doacao-ecg-animation'

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect() } },
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
  return <span ref={ref}>{count.toLocaleString('pt-BR')}{suffix}</span>
}

export default function LandingPage() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [videoEmbedUrl, setVideoEmbedUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ')
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: "Como funciona o Banco de Questões?",
      answer: "Nosso banco é focado 100% nas questões que realmente caem nas provas da Matriz AFYA. Tudo organizado para você filtrar, montar listas personalizadas, baixar PDF e treinar. Toda semana entra conteúdo novo.\n\nEstamos catalogando 600–800 questões reais da Matriz AFYA, além de questões autorais idênticas no estilo, pegada e dificuldade, seguindo a mesma bibliografia."
    },
    {
      question: "As aulas realmente aprofundam o conteúdo?",
      answer: "Sem enrolação. As aulas são densas e aprofundadas, do jeito que precisa para residência. Slides didáticos + material complementar para treinar na hora — questões, resumos, fluxogramas.\n\nAs aulas de HAM usam formato OSCE com dinâmica em POV (primeira pessoa), baseado em estudos que mostram melhora na performance prática e habilidades não-técnicas."
    },
    {
      question: "Como funcionam os Flashcards?",
      answer: "Cada flashcard é criado com base na Taxonomia de Bloom — do básico (lembrar, entender) até o avançado (analisar, avaliar, criar), com dificuldade ajustável. Após cada card, rola revisão pós-card imediata para fixação.\n\nTudo atrelado às ementas AFYA de 4 cursos, com revisões espaçadas e integração com o banco de questões."
    },
    {
      question: "Os cronogramas são personalizáveis?",
      answer: "100% personalizados e atrelados às ementas AFYA. Ajuste por hora do dia, dificuldade por conteúdo, cobrindo todos os módulos, submódulos, tópicos e subtópicos.\n\nCursos: Medicina (SOI/HAM I-V), Psicologia (1°-10°), Biomedicina (1°-7°), Odontologia (1°-10°), além de ENEM e UERJ. A IA adapta ao seu ritmo automaticamente."
    },
    {
      question: "Como funcionam as provas com IA?",
      answer: "Provas individuais totalmente customizáveis: escolha o curso, período, módulos, tópicos, dificuldade, número de questões e tempo limite. A IA gera questões adaptadas ao seu histórico.\n\nTambém temos provas gerais — simulados coletivos com ranking, análise completa de acertos, erros e tempo gasto."
    },
    {
      question: "A plataforma recebe atualizações?",
      answer: "Constantemente. Já temos mais de 20 atualizações mapeadas no roadmap: melhorias de usabilidade, novas funcionalidades, mais questões e ferramentas de revisão inteligente. A plataforma evolui junto com você."
    },
    {
      question: "Posso sugerir melhorias?",
      answer: "Claro! Feedback, sugestões de tema, dúvidas — tudo é bem-vindo. Entre em contato pelo email contato@domineaqui.com.br."
    }
  ]

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    loadSettings()
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) setIsLoggedIn(true)
    } catch {}
  }

  async function loadSettings() {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setVideoEmbedUrl(data.videoEmbedUrl)
        setVideoEnabled(data.videoEnabled !== false)
      }
    } catch {}
  }

  const features = [
    {
      icon: Brain,
      title: 'Flashcards Inteligentes',
      description: 'Repetição espaçada com IA que aprende seu ritmo. Atrelados às ementas de todos os cursos AFYA.',
      accent: 'primary' as const,
    },
    {
      icon: Calendar,
      title: 'Cronogramas Personalizados',
      description: 'Ementas completas de Medicina, Psicologia, Biomedicina e Odontologia. Adaptados ao seu ritmo.',
      accent: 'secondary' as const,
    },
    {
      icon: Zap,
      title: 'Provas com IA',
      description: 'Provas personalizadas com contextos adaptados a cada curso. Simulados coletivos com ranking.',
      accent: 'primary' as const,
    },
    {
      icon: Database,
      title: 'Banco de Questões',
      description: '1.000+ questões organizadas por período, módulo e tópico. Objetivas, discursivas e TRI.',
      accent: 'secondary' as const,
    },
    {
      icon: Video,
      title: 'Aulas Aprofundadas',
      description: 'Aulas densas focadas em residência. HAM em formato OSCE com dinâmica POV em primeira pessoa.',
      accent: 'primary' as const,
    },
    {
      icon: MessageSquare,
      title: 'Comunidade & Fórum',
      description: 'Fóruns de discussão e comunidade focada. Aprenda e evolua junto com outros estudantes.',
      accent: 'secondary' as const,
    },
  ]

  const stats = [
    { value: 1000, suffix: '+', label: 'Questões no banco' },
    { value: 4, suffix: '', label: 'Cursos AFYA' },
    { value: 10, suffix: '+', label: 'Ferramentas de estudo' },
    { value: 20, suffix: '+', label: 'Atualizações planejadas' },
  ]

  const courses = [
    { icon: Stethoscope, name: 'Medicina AFYA', detail: 'SOI e HAM — 1° ao 5° Período' },
    { icon: Brain, name: 'Psicologia AFYA', detail: '1° ao 10° Período' },
    { icon: FlaskConical, name: 'Biomedicina AFYA', detail: '1° ao 7° Período' },
    { icon: GraduationCap, name: 'Odontologia AFYA', detail: '1° ao 10° Período' },
  ]

  const heroSection = useInView(0.1)
  const statsSection = useInView()
  const featuresSection = useInView(0.08)
  const coursesSection = useInView()
  const videoSection = useInView()
  const ctaSection = useInView()
  const faqSection = useInView(0.08)
  const doacaoSection = useInView(0.1)
  const afyaSection = useInView(0.1)
  const [doacaoFormOpen, setDoacaoFormOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar — floating, glass, matching inner pages */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-2xl shadow-lg shadow-black/[0.04] dark:shadow-black/[0.2] border-b border-border/50'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="full" size="md" />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              onClick={() => router.push(isLoggedIn ? '/dashboard' : '/auth/login')}
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-colors"
            >
              {isLoggedIn ? 'Dashboard' : 'Entrar'}
            </Button>
            <Button
              onClick={() => router.push(isLoggedIn ? '/dashboard' : '/auth/register')}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-colors"
            >
              {isLoggedIn ? 'Ir para Dashboard' : 'Começar Grátis'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-16 overflow-hidden">
        {/* Subtle ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/[0.07] rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/[0.05] rounded-full blur-[120px]" />
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <div ref={heroSection.ref} className={`relative z-10 max-w-5xl mx-auto px-6 text-center transition-all duration-1000 ${heroSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/[0.06] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-sm font-medium text-primary">Acesso Antecipado</span>
          </div>

          {/* Logo */}
          <div className="mb-10">
            <div className="inline-flex items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/10">
              <Image
                src="/logo.png"
                alt="DomineAqui Logo"
                width={160}
                height={160}
                className="w-28 h-28 md:w-40 md:h-40 object-contain"
                priority
              />
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Seja o Foco.</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Seja a Referência.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Plataforma completa de estudo para alunos AFYA. Questões, flashcards, cronogramas, provas com IA e aulas — tudo integrado para você dominar.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
            <Button
              onClick={() => router.push('/auth/register')}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 cursor-pointer"
            >
              Começar Gratuitamente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => router.push('/auth/login')}
              variant="outline"
              size="lg"
              className="border-border hover:bg-muted/50 font-semibold px-8 h-12 text-base transition-colors cursor-pointer"
            >
              Já tenho conta
            </Button>
          </div>

          {/* Course badges */}
          <div className="flex flex-wrap justify-center gap-2">
            {courses.map((course) => (
              <div
                key={course.name}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/80 border border-border/60 text-sm"
              >
                <course.icon className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-foreground">{course.name}</span>
              </div>
            ))}
          </div>

          {/* Scroll hint */}
          <div className="mt-16 animate-bounce">
            <ChevronDown className="w-5 h-5 mx-auto text-muted-foreground/50" />
          </div>
        </div>
      </section>

      {/* Social Proof — Stats */}
      <section className="py-20 px-6 border-t border-border/30">
        <div ref={statsSection.ref} className={`max-w-5xl mx-auto transition-all duration-700 ${statsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div ref={featuresSection.ref} className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${featuresSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para dominar
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Ferramentas integradas e inteligentes, desenhadas para a Matriz AFYA
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`group relative p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[0.06] transition-all duration-300 cursor-default ${
                  featuresSection.isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: featuresSection.isVisible ? `${i * 80}ms` : '0ms' }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  feature.accent === 'primary'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary/10 text-secondary'
                }`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Detail */}
      <section className="py-24 px-6 border-t border-border/30">
        <div ref={coursesSection.ref} className="max-w-5xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${coursesSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Cobertura completa das ementas
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Cronogramas, questões e flashcards organizados por curso, período, módulo e tópico
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {courses.map((course, i) => (
              <div
                key={course.name}
                className={`flex items-center gap-4 p-5 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/20 transition-all duration-300 ${
                  coursesSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: coursesSection.isVisible ? `${i * 100}ms` : '0ms' }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <course.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{course.name}</h3>
                  <p className="text-sm text-muted-foreground">{course.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Additional offerings */}
          <div className={`mt-6 flex flex-wrap justify-center gap-3 transition-all duration-700 delay-500 ${coursesSection.isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-sm text-muted-foreground">
              <Target className="w-3.5 h-3.5" /> ENEM
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-sm text-muted-foreground">
              <Target className="w-3.5 h-3.5" /> UERJ
            </span>
          </div>
        </div>
      </section>

      {/* Video Demo */}
      {videoEnabled && (
        <section className="py-24 px-6 border-t border-border/30">
          <div ref={videoSection.ref} className={`max-w-4xl mx-auto transition-all duration-700 ${videoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                Veja a plataforma em ação
              </h2>
              <p className="text-lg text-muted-foreground">
                Conheça as ferramentas que vão transformar seu estudo
              </p>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden border border-border/60 bg-card shadow-xl shadow-black/[0.06] dark:shadow-black/[0.2]">
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
          SEÇÃO AFYA MATRIZ
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6 border-t border-border/30 relative overflow-hidden">
        {/* Background subtle */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div
          ref={afyaSection.ref}
          className={`max-w-5xl mx-auto transition-all duration-700 ${afyaSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <GraduationCap className="w-3.5 h-3.5" />
              Provas da Matriz AFYA
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Treine com provas reais da sua faculdade
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Acesse e treine com simulados baseados nas provas aplicadas na Matriz AFYA — organizados por curso, período e disciplina.
            </p>
          </div>

          {/* Cards de cursos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { icon: '🩺', label: 'Medicina', sub: 'SOI / HAM · 1°–5° Período', color: '#DC2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.20)' },
              { icon: '🧠', label: 'Psicologia', sub: '1°–10° Período', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.20)' },
              { icon: '🔬', label: 'Biomedicina', sub: '1°–7° Período', color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.20)' },
              { icon: '🦷', label: 'Odontologia', sub: '1°–10° Período', color: '#2563EB', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.20)' },
            ].map((c, i) => (
              <div
                key={c.label}
                className={`relative rounded-2xl p-4 text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-lg`}
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  transitionDelay: afyaSection.isVisible ? `${i * 80}ms` : '0ms',
                }}
              >
                <div className="text-3xl mb-2">{c.icon}</div>
                <p className="font-bold text-sm text-foreground">{c.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Destaques */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: BookMarked, title: 'Provas organizadas', desc: 'Por disciplina, período e semestre — fácil de achar o que você precisa.' },
              { icon: BarChart3, title: 'Gabarito comentado', desc: 'Baixe PDF com gabarito e respostas comentadas para revisão.' },
              { icon: Zap, title: 'Modo treino', desc: 'Receba feedback imediato questão a questão enquanto pratica.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-2xl bg-muted/40 border border-border/40">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer jurídico */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
            <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Aviso Legal</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Este conteúdo é disponibilizado exclusivamente para fins educacionais e de preparação acadêmica dos próprios alunos. As provas e questões presentes na plataforma são de domínio dos respectivos estudantes que as compartilharam para uso coletivo. A DomineAqui não possui vínculo, parceria ou endosso com a Afya Educacional ou qualquer instituição da Matriz AFYA. Todos os direitos dos materiais originais pertencem às respectivas instituições.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SEÇÃO DOAÇÃO
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6 border-t border-border/30 relative overflow-hidden">
        {/* Fundo glassmorphism escuro */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, rgba(70,129,82,0.5) 0%, transparent 70%)' }} />
        </div>

        <div
          ref={doacaoSection.ref}
          className={`max-w-5xl mx-auto transition-all duration-700 ${doacaoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Heart className="w-3.5 h-3.5" />
              Apoie a plataforma
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Gratuito porque você acreditou
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A DomineAqui é 100% gratuita e mantida pela comunidade. Cada doação garante que o conteúdo continue livre e acessível para todos os estudantes.
            </p>
          </div>

          {/* Glass panel — mesmo estilo dos modais */}
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(12,22,14,0.96) 0%, rgba(8,18,10,0.98) 100%)',
              border: '1px solid rgba(70,129,82,0.22)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* ECG topo */}
            <div className="absolute top-0 left-0 right-0 h-12 opacity-15 pointer-events-none overflow-hidden">
              <DoacaoEcgAnimation color="#4ade80" opacity={1} />
            </div>
            {/* Reflexo topo */}
            <div className="absolute top-0 left-16 right-16 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />
            {/* Grid sutil */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }} />

            <div className="relative z-10 p-6 sm:p-8">
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* Conteúdo de doação */}
                <DoacaoContent
                  onDonateClick={() => setDoacaoFormOpen(true)}
                />

                {/* Ranking */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(70,129,82,0.4))' }} />
                    <span className="text-xs font-semibold text-emerald-400/60">Quem já apoiou</span>
                    <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(70,129,82,0.4), transparent)' }} />
                  </div>
                  <DoacaoRanking glass />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DoacaoForm open={doacaoFormOpen} onClose={() => setDoacaoFormOpen(false)} />

      {/* FAQ */}
      <section className="py-24 px-6 border-t border-border/30">
        <div ref={faqSection.ref} className="max-w-3xl mx-auto">
          <div className={`text-center mb-14 transition-all duration-700 ${faqSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas sobre a plataforma
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-xl border border-border/60 bg-card/50 overflow-hidden transition-all duration-300 hover:border-primary/20 ${
                  openFaq === index ? 'border-primary/30 bg-card shadow-sm' : ''
                } ${faqSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: faqSection.isVisible ? `${index * 50}ms` : '0ms' }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <span className="font-medium text-foreground pr-4">{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    openFaq === index ? 'rotate-180' : ''
                  }`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${
                  openFaq === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-5 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-border/30">
        <div ref={ctaSection.ref} className={`max-w-3xl mx-auto text-center transition-all duration-700 ${ctaSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pronto para dominar seus estudos?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Crie sua conta gratuita e acesse todas as ferramentas da plataforma agora mesmo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
            <Button
              onClick={() => router.push('/auth/register')}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 cursor-pointer"
            >
              Começar Gratuitamente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => router.push('/auth/login')}
              variant="outline"
              size="lg"
              className="border-border hover:bg-muted/50 font-semibold px-8 h-12 text-base transition-colors cursor-pointer"
            >
              Já tenho conta
            </Button>
          </div>

          {/* Instagram subtle */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Siga no Instagram</span>
            <a
              href="https://instagram.com/domineaqui.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Instagram className="w-4 h-4" />
              @domineaqui.br
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo variant="icon" size="sm" />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DomineAqui
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/domineaqui.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://discord.gg/vdfHcvDdMw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
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
