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
  Lightbulb,
  Database,
  CheckCircle2,
  Video,
  HelpCircle,
  ChevronUp
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)
  const [videoEmbedUrl, setVideoEmbedUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ')
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: "Como funciona esse Banco de Questões?",
      answer: "O nosso banco é focado 100% nas questões que realmente caem nas provas da Matriz AFYA. A gente organizou tudo de um jeito inteligente pra você filtrar, montar lista personalizada, baixar PDF e mandar ver nos treinos. Toda semana entra coisa nova.\n\nMas ó: a Matriz AFYA é relativamente nova, então o volume ainda não é infinito. A gente tá catalogando umas 600–800 questões reais dela. E o melhor: já estamos criando questões autorais idênticas no estilo, na pegada e na dificuldade da Matriz, seguindo a mesma bibliografia. Quando você ver, vai pirar de tão parecida e útil."
    },
    {
      question: "As aulas são aquelas de encher linguiça ou realmente aprofundam?",
      answer: "Aqui não tem enrolação de 20 minutos só raspando a superfície. As aulas são pesadas, bem aprofundadas, do jeito que precisa pra residência. Slides didáticos + material complementar pra você treinar na hora (questões, resumos, fluxogramas, o que for preciso).\n\nO lance é: ou aprofunda de verdade ou não adianta. A gente entrega o pacote completo pra você sair da aula sabendo muito e conseguindo resolver qualquer pegadinha."
    },
    {
      question: "E as aulas de HAM? Como que são?",
      answer: "As aulas de HAM são montadas pra te colocar dentro da prova mesmo. A gente usa o formato de estações OSCE (aquele exame prático estruturado que muitas residências cobram) + dinâmica em POV (ponto de vista em primeira pessoa).\n\nVocê literalmente se sente na estação, lidando com o paciente, tomando decisão na hora, sentindo a pressão. Atualmente, tem estudo mostrando que vídeo em primeira pessoa antes de simulação melhora performance prática e habilidades não-técnicas (tipo comunicação, calma sob pressão). A gente trouxe essa ciência pra dentro da sua tela. É o mais próximo que você chega de treinar HAM sem estar na prova de verdade. Vai te salvar na hora H."
    },
    {
      question: "E os Flashcards? Como que eles funcionam pra fixar o conhecimento?",
      answer: "Os flashcards aqui são nível elite. Cada um é criado com base na Taxonomia de Bloom – aquela pirâmide que vai do básico (lembrar, entender) até o top (analisar, avaliar, criar) e com a dificuldade que você quer em %. Então, não é só memorização burra: a gente mira em objetivos que te fazem pensar de verdade.\n\nDepois de cada card, rola uma revisão pós-card imediata: outro flashcard criado a partir de suas dificuldades pra você fixar imensamente o conteúdo.\n\nE o cronograma? Tudo atrelado à Matriz AFYA, com aprofundamento máximo. Pra SOI (Sistemas Orgânicos e Integrados) vai de SOI I a SOI V, cobrindo desde os fundamentos até casos avançados. Pra HAM (Habilidades e Atitudes Médicas), de HAM I a HAM V, com foco em estações práticas, OSCE e POV pra te preparar pro caos real. A plataforma sincroniza tudo: flashcards estão atrelados ao cronograma das ementas, revisões espaçadas pra fixar no longo prazo, e integração com o banco de questões. É estudo inteligente, não só repetição."
    },
    {
      question: "Como rola a assinatura? Tem promoção, desconto, essas coisas?",
      answer: "Sim, a gente solta descontos e promoções de tempos em tempos pra você entrar com o pé direito e aproveitar todos os recursos novos que vão saindo. Fica de olho no site, no email e nas redes que a gente avisa quando rolar cupom maroto ou condição especial. Quanto mais cedo você entrar, mais tempo você tem pra dominar tudo."
    },
    {
      question: "Como são os cronogramas? Dá pra personalizar tudo?",
      answer: "Os cronogramas são o coração da plataforma – todos 100% atrelados à Matriz AFYA, pra você não perder tempo com coisa aleatória. São extremamente personalizados: você ajusta por hora do dia da semana (tipo, quantas horas você tem pra estudar por dia da semana), dificuldade por conteúdo (começa fácil e vai pro hard mode), e cobre todos os módulos, submódulos, tópicos e subtópicos da ementa dos cursos SOI e HAM.\n\nPra SOI: de I a V, mergulhando em semiologia integrada, diagnósticos, tratamentos – tudo aprofundado com aulas, flashcards e questões ligadas.\n\nPra HAM: I a V, com ênfase em habilidades práticas, estações clínicas, comunicação e decisões éticas.\n\nA gente usa IA pra adaptar ao seu ritmo: se você tá voando em um tópico, avança; se empaca, reforça com mais prática. É como um coach pessoal que sabe exatamente o que a Matriz AFYA cobra. Bora planejar sua vitória diária."
    },
    {
      question: "O que são as provas gerais que a equipe solta?",
      answer: "As provas gerais são aquelas que a nossa equipe monta e libera pra galera toda – tipo um simulado coletivo pra todo mundo se testar no mesmo nível. Elas são baseadas na Matriz AFYA, com questões reais e autorais idênticas, cobrindo módulos de SOI e HAM. Tem até ranking!\n\nRola periodicamente, tipo semanal ou mensal, pra você medir seu progresso contra o padrão das avaliações. Depois, análise completa: acertos, erros, tempo gasto, e dicas da equipe pra melhorar. É motivação em grupo – vê como você tá no ranking e ajusta o jogo."
    },
    {
      question: "E as provas individuais? Como rola com IA personalizada?",
      answer: "As provas individuais são o auge da customização: você monta do zero com a IA, num contexto completamente personalizado. Escolhe módulos (SOI I-V, HAM I-V), submódulos, tópicos específicos, dificuldade, número de questões, tempo limite – tudo atrelado à Matriz AFYA.\n\nA IA gera questões novas, idênticas as da Matriz AFYA, adaptadas ao seu histórico: se você erra muito em um subtópico, foca ali. Depois da prova, relatório insano: análise por Bloom (onde você tá fraco em aplicação vs. análise), sugestões de revisão, e integração com flashcards e cronograma. É treino sob medida, pra você simular as avaliações no seu ritmo e estilo."
    },
    {
      question: "A plataforma vai ficar parada no tempo ou vai rolar atualização constante?",
      answer: "Relaxa, a gente tá só começando. Já tem pelo menos 20 atualizações mapeadas pro roadmap: melhorias na usabilidade, novas funções insanas pro estudo, mais questões, ferramentas de revisão inteligente, talvez até gamificação pra não deixar o ânimo cair.\n\nA ideia é evoluir junto com você. Sempre que sair algo novo que ajude de verdade, entra na plataforma. Pode confiar."
    },
    {
      question: "Posso sugerir questões, aulas ou melhorias? Tem como falar com vocês?",
      answer: "Claro que pode! A gente ama um feedback, sugestão de tema, dúvida pesada, crítica construtiva… tudo ajuda a ficar mais sensacional. Manda bala pro email: contato@domineaqui.com.br\n\nBora construir isso juntos."
    },
    {
      question: "Tem grupo, comunidade ou suporte pra tirar dúvida na hora?",
      answer: "O suporte é direto por email (contato@domineaqui.com.br) e a gente responde rápido."
    }
  ]

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
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        setIsLoggedIn(true)
      }
    } catch (error) {
      // Usuário não logado
    }
  }

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
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(70, 129, 82, 0.6), 0 0 40px rgba(226, 164, 62, 0.3);
            opacity: 1;
          }
          50% { 
            box-shadow: 0 0 40px rgba(70, 129, 82, 0.9), 0 0 60px rgba(226, 164, 62, 0.5);
            opacity: 0.8;
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes logo-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(2deg);
          }
          50% {
            transform: translateY(-5px) rotate(0deg);
          }
          75% {
            transform: translateY(-15px) rotate(-2deg);
          }
        }
        @keyframes logo-glow {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(70, 129, 82, 0.5)) drop-shadow(0 0 40px rgba(226, 164, 62, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 40px rgba(70, 129, 82, 0.8)) drop-shadow(0 0 60px rgba(226, 164, 62, 0.5));
          }
        }
        @keyframes logo-scale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes logo-rotate-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .logo-container {
          animation: logo-float 6s ease-in-out infinite, logo-glow 3s ease-in-out infinite;
        }
        .logo-image {
          animation: logo-scale 4s ease-in-out infinite;
        }
        .logo-ring {
          animation: logo-rotate-slow 20s linear infinite;
        }
        .logo-ring-reverse {
          animation: logo-rotate-slow 25s linear infinite reverse;
        }
      `}</style>
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
              onClick={() => router.push(isLoggedIn ? '/dashboard' : '/auth/login')}
              className="bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white font-bold shadow-lg animate-pulse-glow border-0"
              size="sm"
            >
              {isLoggedIn ? '🏠 Ir para Dashboard' : '✨ Entrar Agora'}
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
          {/* Logo Animation */}
          <div className="animate-slide-up relative">
            <div className="logo-container relative inline-flex items-center justify-center">
              <div className="logo-ring-reverse absolute w-72 h-72 md:w-96 md:h-96 rounded-full border-2 border-dashed border-[#468152]/30"></div>
              <div className="logo-ring absolute w-80 h-80 md:w-[420px] md:h-[420px] rounded-full border-2 border-dotted border-[#E2A43E]/20"></div>
              <div className="logo-image relative z-10 bg-gradient-to-br from-[#468152]/10 via-transparent to-[#E2A43E]/10 rounded-full p-8 md:p-12 backdrop-blur-xl border border-[#468152]/20">
                <img
                  src="/logo.png"
                  alt="DomineAqui Logo"
                  className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="font-heading text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#468152] via-primary to-[#E2A43E] bg-clip-text text-transparent animate-slide-up">
              Seja o Foco.
            </h1>
            <h1 className="font-heading text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#E2A43E] via-primary to-[#468152] bg-clip-text text-transparent animate-slide-up delay-100">
              Seja a Referência.
            </h1>
          </div>

          {/* AFYA Focus Badge */}
          <div className="animate-slide-up delay-150">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#468152]/20 to-[#E2A43E]/20 border border-[#468152]/40 rounded-full px-6 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🩺</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Foco em Medicina AFYA</p>
                  <p className="text-xs text-muted-foreground">SOI e HAM • 1° ao 5° Período</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main CTA Buttons - COMEÇAR GRÁTIS + JÁ SOU DAQUI */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-200">
            <button
              onClick={() => router.push('/auth/register')}
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-lg shadow-lg shadow-[#468152]/30"
            >
              <span>✨ Começar Gratuitamente</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#E2A43E] to-[#468152] hover:from-[#E2A43E]/90 hover:to-[#468152]/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-lg shadow-lg shadow-[#E2A43E]/30"
            >
              <span>🎯 Já Sou Daqui!</span>
            </button>
          </div>

          {/* Instagram CTA */}
          <div className="bg-gradient-to-br from-[#468152]/15 via-[#E2A43E]/10 to-transparent border border-[#468152]/25 rounded-3xl p-6 md:p-8 backdrop-blur-xl animate-slide-up delay-300 shadow-xl shadow-[#468152]/10">
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

          {/* Banco de Questões Highlight */}
          <div className={`mt-16 bg-gradient-to-br from-[#468152]/25 via-[#E2A43E]/15 to-[#468152]/10 border-2 border-[#468152]/40 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl shadow-[#468152]/15 ${
            showFeatures ? 'animate-slide-up delay-600' : 'opacity-0'
          }`}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-[#468152] to-[#E2A43E] w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl shadow-[#468152]/40">
                  <Database className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                  <h3 className="font-heading text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">
                    Banco de Questões
                  </h3>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-[#E2A43E] to-[#468152] text-white uppercase tracking-wide">
                    Premium
                  </span>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  Mais de <span className="font-bold text-foreground">1.000+ questões</span> organizadas por período, módulo e tópico. Questões objetivas e discursivas para você dominar qualquer assunto.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#468152]" />
                    <span>Objetivas e Discursivas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#468152]" />
                    <span>Filtros avançados</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#468152]" />
                    <span>Listas personalizadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#468152]" />
                    <span>Acompanhe seu progresso</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section - Após Banco de Questões */}
          <div className={`mt-16 text-center py-12 bg-gradient-to-r from-[#468152]/10 via-[#E2A43E]/10 to-[#468152]/10 rounded-3xl backdrop-blur-xl border border-[#468152]/20 ${
            showFeatures ? 'animate-slide-up delay-700' : 'opacity-0'
          }`}>
            <h3 className="font-heading text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">
              Pronto para começar sua jornada?
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Junte-se a milhares de estudantes que já estão dominando seus estudos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/auth/register')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <span>✨ Começar Gratuitamente</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="inline-flex items-center gap-2 border-2 border-[#468152]/50 hover:bg-[#468152]/10 text-[#468152] font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <span>🎯 Já Sou Daqui!</span>
              </button>
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

          {/* CTA Section - Após Vídeo Demo */}
          {videoEnabled && (
            <div className={`mt-16 text-center py-12 bg-gradient-to-r from-[#E2A43E]/10 via-[#468152]/10 to-[#E2A43E]/10 rounded-3xl backdrop-blur-xl border border-[#E2A43E]/20 ${
              showFeatures ? 'animate-slide-up delay-500' : 'opacity-0'
            }`}>
              <h3 className="font-heading text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-[#E2A43E] to-[#468152] bg-clip-text text-transparent">
                Gostou do que viu?
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Crie sua conta gratuita e comece a estudar agora mesmo
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/auth/register')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E2A43E] to-[#468152] hover:from-[#E2A43E]/90 hover:to-[#468152]/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <span>✨ Começar Gratuitamente</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="inline-flex items-center gap-2 border-2 border-[#E2A43E]/50 hover:bg-[#E2A43E]/10 text-[#E2A43E] font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <span>🎯 Já Sou Daqui!</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Aulas ao Vivo Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#468152]/3 via-transparent to-[#E2A43E]/3">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center">
            {/* Aulas ao Vivo */}
            <div className="group w-full max-w-2xl bg-gradient-to-br from-[#468152]/25 via-[#468152]/12 to-transparent border-2 border-[#468152]/50 rounded-3xl p-8 md:p-12 hover:border-[#468152]/70 transition-all duration-300 hover:shadow-2xl hover:shadow-[#468152]/25 backdrop-blur-xl text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-[#468152] to-[#E2A43E] w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-[#468152]/40">
                  <Video className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <h3 className="font-heading text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">Aulas ao Vivo</h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white uppercase tracking-wide animate-pulse">
                  Disponível
                </span>
              </div>
              <p className="text-muted-foreground mb-6 text-lg">
                Interaja em tempo real com instrutores especializados. Aprenda de forma dinâmica e tire suas dúvidas ao vivo com professores experientes.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#468152]" />
                  <span>Aulas semanais</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#468152]" />
                  <span>Tira-dúvidas ao vivo</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#468152]" />
                  <span>Gravações disponíveis</span>
                </div>
              </div>
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
            Siga nosso Instagram, faça um post e você pode receber um presente exclusivo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={openInstagram}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E1306C] to-[#FD1D1D] hover:from-[#E1306C]/90 hover:to-[#FD1D1D]/90 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-lg"
            >
              <Instagram className="w-5 h-5" />
              Seguir @domineaqui.br
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/auth/register')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <span>✨ Começar Gratuitamente</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="inline-flex items-center gap-2 border-2 border-[#468152]/50 hover:bg-[#468152]/10 text-[#468152] font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <span>🎯 Já Sou Daqui!</span>
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-[#468152]/2 to-[#E2A43E]/2">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas sobre a plataforma
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-[#468152]/50 shadow-sm hover:shadow-md"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 pr-4">
                    <HelpCircle className="h-5 w-5 text-[#468152] flex-shrink-0" />
                    <span className="font-semibold text-lg">{faq.question}</span>
                  </div>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-[#468152] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 pt-0 border-t border-border/50">
                    <p className="text-muted-foreground leading-relaxed pl-8">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
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
