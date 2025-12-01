'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  PenTool,
  ArrowRight,
  Instagram,
  Brain,
  Calendar,
  Lightbulb
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)
  const [videoEmbedUrl, setVideoEmbedUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ')
  const [videoEnabled, setVideoEnabled] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowFeatures(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setVideoEmbedUrl(data.videoEmbedUrl)
        setVideoEnabled(data.videoEnabled !== false)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const scrollToFeatures = () => {
    const element = document.getElementById('features')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  const openInstagram = () => {
    window.open('https://instagram.com/domineaqui.br', '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#468152]/10">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/70 dark:bg-background/50 backdrop-blur-xl shadow-lg border-b border-[#468152]/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo variant="full" size="md" />
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-[#468152]/20 to-[#E2A43E]/20 border border-[#468152]/30 text-[#468152] dark:text-[#E2A43E]">
              Acesso Antecipado
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button 
              onClick={() => router.push('/auth/login')}
              variant="outline"
              size="sm"
              className="border-[#468152]/30 hover:bg-[#468152]/10"
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-20 px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#468152]/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#E2A43E]/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="font-heading text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#468152] via-primary to-[#E2A43E] bg-clip-text text-transparent animate-slide-up">
              Seja o Foco.
            </h1>
            <h1 className="font-heading text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#E2A43E] via-primary to-[#468152] bg-clip-text text-transparent animate-slide-up delay-100">
              Seja a Referência.
            </h1>
          </div>

          {/* Instagram CTA */}
          <div className="bg-gradient-to-br from-[#468152]/15 via-[#E2A43E]/10 to-transparent border border-[#468152]/25 rounded-3xl p-6 md:p-8 backdrop-blur-xl animate-slide-up delay-200 shadow-xl shadow-[#468152]/10">
            <p className="text-lg md:text-xl text-foreground mb-4">
              Siga nosso Instagram, faça um post e você pode receber um <span className="font-bold bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">presente exclusivo</span>
            </p>
            <button
              onClick={openInstagram}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E1306C] to-[#FD1D1D] hover:from-[#E1306C]/90 hover:to-[#FD1D1D]/90 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-lg"
            >
              <Instagram className="w-5 h-5" />
              @domineaqui.br
            </button>
          </div>

          {/* CTA Button */}
          <div className="pt-4 animate-slide-up delay-300">
            <button
              onClick={scrollToFeatures}
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-lg"
            >
              <span>Quero Saber Mais Sobre a Plataforma</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Scroll indicator */}
          <div className="pt-8 animate-bounce-custom">
            <ChevronDown className="w-8 h-8 mx-auto text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-transparent via-[#468152]/3 to-[#E2A43E]/3">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">
            Tudo que você precisa para dominar
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Feature 1 - Flashcards */}
            <div className={`group bg-gradient-to-br from-[#468152]/20 via-[#468152]/10 to-transparent border border-[#468152]/30 rounded-3xl p-8 hover:border-[#468152]/60 transition-all duration-300 hover:shadow-2xl hover:shadow-[#468152]/20 hover:scale-105 backdrop-blur-xl ${
              showFeatures ? 'animate-slide-up' : 'opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-[#468152] to-[#468152]/70 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-[#468152]/30">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-3">Flashcards Inteligentes</h3>
              <p className="text-muted-foreground mb-4">
                Sistema de repetição espaçada com IA que aprende seu ritmo. Domine qualquer conteúdo com a metodologia mais eficaz de memorização.
              </p>
              <div className="text-sm text-[#468152] font-semibold">✨ Metodologia comprovada</div>
            </div>

            {/* Feature 2 - Cronogramas */}
            <div className={`group bg-gradient-to-br from-[#E2A43E]/20 via-[#E2A43E]/10 to-transparent border border-[#E2A43E]/30 rounded-3xl p-8 hover:border-[#E2A43E]/60 transition-all duration-300 hover:shadow-2xl hover:shadow-[#E2A43E]/20 hover:scale-105 backdrop-blur-xl ${
              showFeatures ? 'animate-slide-up delay-100' : 'opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-[#E2A43E] to-[#E2A43E]/70 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-[#E2A43E]/30">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-3">Cronogramas Personalizados</h3>
              <p className="text-muted-foreground mb-4">
                Planeje seus estudos de forma inteligente. Nosso algoritmo cria cronogramas adaptados ao seu ritmo e objetivos.
              </p>
              <div className="text-sm text-[#E2A43E] font-semibold">⚡ Otimizado para resultados</div>
            </div>

            {/* Feature 3 - Reforços */}
            <div className={`group bg-gradient-to-br from-[#468152]/20 via-[#468152]/10 to-transparent border border-[#468152]/30 rounded-3xl p-8 hover:border-[#468152]/60 transition-all duration-300 hover:shadow-2xl hover:shadow-[#468152]/20 hover:scale-105 backdrop-blur-xl ${
              showFeatures ? 'animate-slide-up delay-200' : 'opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-[#468152] to-[#468152]/70 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-[#468152]/30">
                <Lightbulb className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-3">Reforços de Conteúdo</h3>
              <p className="text-muted-foreground mb-4">
                Resumos estratégicos e conteúdos curados. Reforços para consolidar aprendizado e dominar tópicos complexos.
              </p>
              <div className="text-sm text-[#468152] font-semibold">🎯 Conteúdo estratégico</div>
            </div>

            {/* Feature 4 - Provas com IA */}
            <div className={`group bg-gradient-to-br from-[#E2A43E]/20 via-[#E2A43E]/10 to-transparent border border-[#E2A43E]/30 rounded-3xl p-8 hover:border-[#E2A43E]/60 transition-all duration-300 hover:shadow-2xl hover:shadow-[#E2A43E]/20 hover:scale-105 backdrop-blur-xl ${
              showFeatures ? 'animate-slide-up delay-300' : 'opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-[#E2A43E] to-[#E2A43E]/70 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-[#E2A43E]/30">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-3">Provas com IA</h3>
              <p className="text-muted-foreground">
                Incrivelmente diversificadas, de acordo com o que você quer. Contextos personalizáveis para cada necessidade.
              </p>
            </div>

            {/* Feature 5 - Questionários */}
            <div className={`group bg-gradient-to-br from-[#468152]/20 via-[#468152]/10 to-transparent border border-[#468152]/30 rounded-3xl p-8 hover:border-[#468152]/60 transition-all duration-300 hover:shadow-2xl hover:shadow-[#468152]/20 hover:scale-105 backdrop-blur-xl ${
              showFeatures ? 'animate-slide-up delay-400' : 'opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-[#468152] to-[#468152]/70 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-[#468152]/30">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-3">Questionários Avançados</h3>
              <p className="text-muted-foreground">
                Questionários discursivos, TRI e Geração de PDFs. Tudo integrado para sua melhor experiência.
              </p>
            </div>

            {/* Feature 6 - Comunidade */}
            <div className={`group bg-gradient-to-br from-[#E2A43E]/20 via-[#E2A43E]/10 to-transparent border border-[#E2A43E]/30 rounded-3xl p-8 hover:border-[#E2A43E]/60 transition-all duration-300 hover:shadow-2xl hover:shadow-[#E2A43E]/20 hover:scale-105 backdrop-blur-xl ${
              showFeatures ? 'animate-slide-up delay-500' : 'opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-[#E2A43E] to-[#E2A43E]/70 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-[#E2A43E]/30">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-3">Comunidade Engajada</h3>
              <p className="text-muted-foreground">
                Fóruns de discussão e uma verdadeira comunidade de foco brutal. Aprenda junto com outros.
              </p>
            </div>
          </div>

          {/* Video Demo Section */}
          {videoEnabled && (
            <div className={`bg-gradient-to-br from-[#468152]/20 via-[#E2A43E]/10 to-transparent border border-[#468152]/30 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl shadow-[#468152]/10 ${
              showFeatures ? 'animate-slide-up delay-400' : 'opacity-0'
            }`}>
              <h3 className="font-heading text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">Veja a Plataforma em Ação</h3>
              <div className="aspect-video bg-gradient-to-br from-black/40 to-black/60 rounded-2xl overflow-hidden flex items-center justify-center border border-[#468152]/20 backdrop-blur-sm">
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
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#468152]/3 via-transparent to-[#E2A43E]/3">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">
            Muito em Breve 🚀
          </h2>
          
          <div className="flex justify-center">
            {/* Aulas ao Vivo */}
            <div className="group w-full max-w-md bg-gradient-to-br from-[#468152]/25 via-[#468152]/12 to-transparent border border-[#468152]/35 rounded-3xl p-8 hover:border-[#468152]/70 transition-all duration-300 hover:shadow-2xl hover:shadow-[#468152]/25 hover:scale-105 backdrop-blur-xl text-center">
              <div className="bg-gradient-to-br from-[#468152] to-[#468152]/70 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#468152]/40 mx-auto">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading text-3xl font-bold mb-4">Aulas ao Vivo</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Interaja em tempo real com instrutores especializados. Aprenda de forma dinâmica e tire suas dúvidas ao vivo.
              </p>
              <div className="text-sm text-[#468152] font-semibold">🎓 Aprendizado em tempo real</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-[#468152]/2 to-[#E2A43E]/2">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="font-heading text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">Pronto para começar?</h2>
          <p className="text-xl text-muted-foreground">
            Siga nosso Instagram, faça um post e você pode receber um presente exclusivo. Ou acesse agora se já tem acesso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={openInstagram}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E1306C] to-[#FD1D1D] hover:from-[#E1306C]/90 hover:to-[#FD1D1D]/90 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-lg"
            >
              <Instagram className="w-5 h-5" />
              Seguir @domineaqui.br
            </button>
            <Button 
              onClick={() => router.push('/auth/login')}
              size="lg"
              variant="outline"
              className="border-[#468152]/30 hover:bg-[#468152]/10"
            >
              Já tenho acesso
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4 bg-gradient-to-b from-transparent to-[#468152]/5">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>© 2025 DomineAqui. Todos os direitos reservados.</p>
          <p className="mt-2 text-sm">Seja o Foco. Seja a Referência.</p>
        </div>
      </footer>
    </div>
  )
}
