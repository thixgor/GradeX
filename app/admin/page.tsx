'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BanChecker } from '@/components/ban-checker'
import { AppShell } from '@/components/app-shell'
import { LogoLoading } from '@/components/logo-loading'
import {
  FileText,
  Key,
  Users,
  BarChart3,
  Settings,
  ArrowLeft,
  Shield,
  ShieldCheck,
  Calendar,
  BookOpen,
  Sliders,
  Database,
  Megaphone,
  Gamepad2 as GamepadIcon,
  Mail,
  ClipboardList,
  Target,
  Music,
  HeartPulse,
  ShoppingCart,
  Package,
  BadgeDollarSign,
  BadgePercent,
  Star,
  Network,
  Ticket,
  MessageSquareQuote,
  GraduationCap,
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()

      // Verificar se é admin
      if (data.user.role !== 'admin') {
        router.push('/')
        return
      }

      setUser(data.user)
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LogoLoading message="Carregando painel admin..." size="lg" fullscreen />
  }

  if (!user) {
    return null
  }

  const adminSections = [
    {
      title: 'Gerenciar Provas',
      description: 'Criar, editar e visualizar provas. Acompanhar submissões e corrigir questões discursivas.',
      icon: FileText,
      href: '/admin/exams',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Serial Keys',
      description: 'Gerar e gerenciar chaves de ativação para planos Trial, Plus+ e Personalizados.',
      icon: Key,
      href: '/admin/keys',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Gerenciar Usuários',
      description: 'Visualizar, editar e gerenciar contas de usuários. Controlar permissões e status.',
      icon: Users,
      href: '/admin/users',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Cargos',
      description: 'Criar e administrar os cargos da plataforma: o que cada um abre, se é pago e como aparece.',
      icon: ShieldCheck,
      href: '/admin/cargos',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Estatísticas',
      description: 'Análises e relatórios detalhados sobre provas, desempenho e uso da plataforma.',
      icon: BarChart3,
      href: '/admin/stats',
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'DomineAqui Analytics',
      description: 'Dashboard financeiro de vendas, assinaturas, conversão, abandonos, pedidos e cancelamentos.',
      icon: BadgeDollarSign,
      href: '/admin/analytics',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Cupons',
      description: 'Criar e gerenciar cupons para checkouts de materiais, flashcards e pacotes.',
      icon: BadgePercent,
      href: '/admin/coupons',
      color: 'from-lime-500 to-emerald-500'
    },
    {
      title: 'PROUNI / FIES',
      description: 'Configurar desconto por produto para bolsistas e analisar as solicitações com os comprovantes enviados.',
      icon: GraduationCap,
      href: '/admin/prouni',
      color: 'from-sky-500 to-cyan-500'
    },
    {
      title: 'Cronogramas & Avaliações',
      description: 'Marcar provas e trabalhos por seção e período, e configurar quando cada avaliação lembra os alunos.',
      icon: Calendar,
      href: '/admin/cronogramas',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Lotes por Evento',
      description: 'Configurar descontos progressivos vinculados a uma prova ou evento. Quanto antes comprar, maior o desconto.',
      icon: Calendar,
      href: '/admin/pricing-events',
      color: 'from-emerald-500 to-cyan-500'
    },
    {
      title: 'Configurações',
      description: 'Gerenciar configurações da landing page, vídeos e outras preferências.',
      icon: Sliders,
      href: '/admin/settings',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      title: 'Banco de Questões',
      description: 'Gerenciar questões, hierarquia e importar questões em massa.',
      icon: Database,
      href: '/admin/banco-questoes',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      title: 'Anúncios',
      description: 'Gerenciar banners e anúncios rotativos da plataforma.',
      icon: Megaphone,
      href: '/admin/anuncios',
      color: 'from-amber-500 to-orange-500'
    },
    {
      title: 'Games Educativos',
      description: 'Gerenciar conteúdo dos jogos: Palavras Cruzadas, Forca e Caça aos Erros.',
      icon: GamepadIcon,
      href: '/admin/games',
      color: 'from-rose-500 to-pink-500'
    },
    {
      title: 'Enviar E-mails',
      description: 'Enviar e-mails em massa para usuários. Templates prontos e editor visual.',
      icon: Mail,
      href: '/admin/emails',
      color: 'from-sky-500 to-blue-500'
    },
    {
      title: 'Pesquisas e Formulários',
      description: 'Criar e gerenciar pesquisas, formulários de inscrição e feedbacks dos usuários.',
      icon: ClipboardList,
      href: '/admin/forms',
      color: 'from-fuchsia-500 to-purple-600'
    },
    {
      title: 'Captura de Leads',
      description: 'Criar páginas de captura de leads com materiais gratuitos. Coletar e-mails e nomes.',
      icon: Target,
      href: '/admin/leads',
      color: 'from-lime-500 to-green-500'
    },
    {
      title: 'Playlists de Estudo',
      description: 'Gerenciar playlists do YouTube para o player de música ambiente. Foco e concentração.',
      icon: Music,
      href: '/admin/study-playlists',
      color: 'from-violet-500 to-purple-500'
    },
    {
      title: 'Manual Clínico',
      description: 'Gerenciar patologias do manual clínico. Importar, cadastrar e editar fichas de estudo.',
      icon: HeartPulse,
      href: '/admin/manual-clinico',
      color: 'from-red-500 to-rose-500'
    },
    {
      title: 'Doações Pix',
      description: 'Gerenciar doações, aprovar pendentes, editar ranking e configurar exibição nos interstitials.',
      icon: HeartPulse,
      href: '/admin/doacoes',
      color: 'from-rose-500 to-pink-500'
    },
    {
      title: 'Rifas & Sorteios',
      description: 'Criar rifas, vender números via Mercado Pago, gerenciar participantes e realizar sorteios ao vivo.',
      icon: Ticket,
      href: '/admin/rifas',
      color: 'from-amber-500 to-yellow-500'
    },
    {
      title: 'Materiais',
      description: 'Marketplace de materiais. Criar materiais, pastas, pacotes. Definir preços ou gratuidade.',
      icon: ShoppingCart,
      href: '/admin/materiais',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Loja Física',
      description: 'Produtos físicos/impressos, galeria de imagens, métodos de entrega, frete por região e pedidos.',
      icon: Package,
      href: '/admin/loja',
      color: 'from-orange-500 to-amber-500'
    },
    {
      title: 'Flashcards Manuais',
      description: 'Gestão de decks oficiais, comerciais e da comunidade. Decks pagos vinculam-se a /materiais automaticamente.',
      icon: BookOpen,
      href: '/admin/flashcards/manual',
      color: 'from-violet-500 to-fuchsia-500'
    },
    {
      title: 'Avaliações',
      description: 'Moderar avaliações de materiais e decks. Criar avaliações manuais com nome, foto e data. Travar avaliações por item.',
      icon: Star,
      href: '/admin/avaliacoes',
      color: 'from-yellow-500 to-amber-600'
    },
    {
      title: 'Mapas Mentais',
      description: 'Gerenciar todos os mapas mentais da plataforma. Ver e abrir mapas privados e protegidos por senha, e excluir qualquer mapa.',
      icon: Network,
      href: '/mapa-mental?scope=all-admin',
      color: 'from-emerald-500 to-green-600'
    },
    {
      title: 'Depoimentos',
      description: 'Cadastrar vídeos de depoimentos de alunos (YouTube não listado) que aparecem na landing page. Nome e descrição opcionais, com ordenação.',
      icon: MessageSquareQuote,
      href: '/admin/depoimentos',
      color: 'from-amber-500 to-orange-600'
    }
  ]

  return (
    <AppShell headerTitle="Painel Administrativo" headerSubtitle={`Bem-vindo, ${user.name}`}>
      <BanChecker />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Ferramentas de Administração</h2>
          <p className="text-muted-foreground">
            Selecione uma seção para gerenciar
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {adminSections.map((section) => (
            <Card
              key={section.href}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => router.push(section.href)}
            >
              <div className={`h-2 bg-gradient-to-r ${section.color}`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${section.color} bg-opacity-10`}>
                        <section.icon className="h-6 w-6 text-white" />
                      </div>
                      {section.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full group-hover:bg-primary/10 transition-colors"
                >
                  Acessar
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Ações Rápidas
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => router.push('/admin/exams/create')}
            >
              <FileText className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Nova Prova</div>
                <div className="text-xs text-muted-foreground">Criar prova do zero</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => router.push('/admin/keys')}
            >
              <Key className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Gerar Serial Key</div>
                <div className="text-xs text-muted-foreground">Criar nova chave</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => router.push('/admin/exams')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Ver Provas Ativas</div>
                <div className="text-xs text-muted-foreground">Provas em andamento</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
