'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { BanChecker } from '@/components/ban-checker'
import {
  FileText,
  Key,
  Users,
  BarChart3,
  Settings,
  ArrowLeft,
  Shield,
  Calendar,
  BookOpen
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
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
      description: 'Gerar e gerenciar chaves de ativação para planos Trial, Premium e Personalizados.',
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
      title: 'Estatísticas',
      description: 'Análises e relatórios detalhados sobre provas, desempenho e uso da plataforma.',
      icon: BarChart3,
      href: '/admin/stats',
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <BanChecker />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Painel Administrativo
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Bem-vindo, {user.name}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
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
      </main>
    </div>
  )
}
