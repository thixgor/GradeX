'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogoLoading } from '@/components/logo-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Network, Plus, Users } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  secondaryRole?: string
}

export default function GerenciarAulasPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

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
      setUser(data.user)

      // Verificar se é admin ou monitor
      const isAdmin = data.user.role === 'admin'
      const isMonitor = data.user.secondaryRole === 'monitor'

      if (!isAdmin && !isMonitor) {
        router.push('/aulas')
        return
      }

      setIsAuthorized(true)
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LogoLoading message="Carregando..." size="lg" fullscreen />
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg mb-4">Acesso negado</p>
            <Button onClick={() => router.push('/aulas')}>
              Voltar para Aulas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-40 backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/aulas')}
                className="shrink-0 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Gerenciar Aulas</h1>
                <p className="text-sm text-white/60">
                  {user?.role === 'admin' ? 'Administrador' : 'Monitor'}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-30 container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Estrutura */}
          <Card className="backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            onClick={() => router.push('/aulas/gerenciar/estrutura')}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Network className="h-5 w-5" />
                Estrutura
              </CardTitle>
              <CardDescription className="text-white/60">
                O curso inteiro numa árvore só
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/50">
                Arraste para reorganizar, publique em massa, duplique módulos e veja
                cada aula pelos olhos do aluno
              </p>
            </CardContent>
          </Card>

          {/* Turmas */}
          <Card className="backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            onClick={() => router.push('/aulas/gerenciar/turmas')}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Turmas
              </CardTitle>
              <CardDescription className="text-white/60">
                Grupos de alunos que destravam aulas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/50">
                Cole uma lista de e-mails e use a turma para liberar — ou restringir — aulas
                específicas
              </p>
            </CardContent>
          </Card>

          {/* Aulas */}
          <Card className="backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            onClick={() => router.push('/aulas/gerenciar/aulas')}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Aulas
              </CardTitle>
              <CardDescription className="text-white/60">
                Criar e gerenciar aulas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/50">
                Aulas ao-vivo, gravadas e materiais
              </p>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            onClick={() => router.push('/aulas/gerenciar/estatisticas')}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                📊
                Estatísticas
              </CardTitle>
              <CardDescription className="text-white/60">
                Ver dados das aulas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/50">
                Visualizações, conclusões e comentários
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
