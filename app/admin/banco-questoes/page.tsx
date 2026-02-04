'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'
import { BanChecker } from '@/components/ban-checker'
import {
  Database,
  FileText,
  FolderTree,
  Upload,
  ArrowLeft,
  Shield,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Loader2,
  ArrowRightLeft,
  AlertCircle
} from 'lucide-react'
import { BancoEstatisticasAdmin } from '@/lib/types/banco-questoes'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

export default function AdminBancoQuestoes() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [estatisticas, setEstatisticas] = useState<BancoEstatisticasAdmin | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadEstatisticas()
    }
  }, [user])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()

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

  async function loadEstatisticas() {
    try {
      const res = await fetch('/api/admin/banco/estatisticas')
      if (res.ok) {
        const data = await res.json()
        setEstatisticas(data.estatisticas)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  if (loading) {
    return <LogoLoading message="Carregando..." size="lg" fullscreen />
  }

  if (!user) {
    return null
  }

  const adminSections = [
    {
      title: 'Gerenciar Hierarquia',
      description: 'Criar e editar períodos, módulos, tópicos e subtópicos.',
      icon: FolderTree,
      href: '/admin/banco-questoes/hierarquia',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Gerenciar Questões',
      description: 'Criar, editar e excluir questões do banco.',
      icon: FileText,
      href: '/admin/banco-questoes/questoes',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Importar Questões',
      description: 'Importar questões em massa via arquivo TXT.',
      icon: Upload,
      href: '/admin/banco-questoes/importar',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Extrair Questões',
      description: 'Mover questões de um tópico para outro via TXT.',
      icon: ArrowRightLeft,
      href: '/admin/banco-questoes/extrair',
      color: 'from-orange-500 to-amber-500'
    },
    {
      title: 'Relatar Erros',
      description: 'Gerenciar relatos de problemas enviados pelos usuários.',
      icon: AlertCircle,
      href: '/admin/banco-questoes/relatos',
      color: 'from-red-500 to-rose-500',
      badge: estatisticas?.relatosPendentes
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
                onClick={() => router.push('/admin')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Database className="h-6 w-6 text-primary" />
                  Banco de Questões
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Gerenciamento do banco de questões
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Cards de estatísticas */}
        {estatisticas && (
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Questões</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.totalQuestoes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {estatisticas.questoesPorTipo.objetiva} objetivas, {estatisticas.questoesPorTipo.discursiva} discursivas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Resoluções Hoje</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.resolucoesHoje}</div>
                <p className="text-xs text-muted-foreground">
                  {estatisticas.totalResolucoes.toLocaleString()} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.mediaAcertos}%</div>
                <p className="text-xs text-muted-foreground">
                  nas questões objetivas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Períodos</CardTitle>
                <FolderTree className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.questoesPorPeriodo.length}</div>
                <p className="text-xs text-muted-foreground">
                  com questões cadastradas
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seções de administração */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Gerenciamento</h2>
          <p className="text-muted-foreground">
            Selecione uma seção para gerenciar
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
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
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${section.color}`}>
                        <section.icon className="h-5 w-5 text-white" />
                      </div>
                      {section.title}
                      {(section as any).badge ? (
                        <span className="ml-auto inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-red-600 text-white text-xs font-bold shadow-sm animate-pulse">
                          {(section as any).badge}
                        </span>
                      ) : null}
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

        {/* Questões por período */}
        {estatisticas && estatisticas.questoesPorPeriodo.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold mb-4">Questões por Período</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {estatisticas.questoesPorPeriodo.map((periodo) => (
                <Card key={periodo.periodoId}>
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="font-medium">{periodo.periodoNome}</span>
                    <span className="text-muted-foreground">{periodo.total} questões</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Questões por dificuldade */}
        {estatisticas && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Questões por Dificuldade</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <span className="text-green-600 font-medium">Fácil</span>
                  <span className="text-muted-foreground">{estatisticas.questoesPorDificuldade.facil}</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <span className="text-yellow-600 font-medium">Médio</span>
                  <span className="text-muted-foreground">{estatisticas.questoesPorDificuldade.medio}</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <span className="text-red-600 font-medium">Difícil</span>
                  <span className="text-muted-foreground">{estatisticas.questoesPorDificuldade.dificil}</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <span className="text-muted-foreground font-medium">Sem classificação</span>
                  <span className="text-muted-foreground">{estatisticas.questoesPorDificuldade.semClassificacao}</span>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
