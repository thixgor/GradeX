'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Users, FileText, CheckCircle, TrendingUp, Award, Clock, BarChart3, Eye } from 'lucide-react'

interface Stats {
  totalExams: number
  totalUsers: number
  totalSubmissions: number
  averageScore: number
  examsThisMonth: number
  usersThisMonth: number
  submissionsThisMonth: number
  popularExams: {
    _id: string
    title: string
    submissionCount: number
    averageScore: number
  }[]
  topUsers: {
    _id: string
    name: string
    submissionCount: number
    averageScore: number
  }[]
  recentActivity: {
    date: string
    examsCreated: number
    usersRegistered: number
    submissionsCompleted: number
  }[]
  accountTypeDistribution: {
    gratuito: number
    trial: number
    premium: number
  }
  examTypeDistribution: {
    normal: number
    tri: number
    discursive: number
  }
}

export default function AdminStatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) {
        throw new Error('Erro ao carregar estatísticas')
      }
      const data = await res.json()
      setStats(data.stats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-lg">Carregando estatísticas...</div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
            <CardDescription>{error || 'Erro ao carregar estatísticas'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/admin')}>Voltar ao Admin</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin')}
                className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                  Estatísticas e Relatórios
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Análises detalhadas da plataforma
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 max-w-7xl">
        {/* Cards de Resumo */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total de Provas</CardTitle>
                <FileText className="h-5 w-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalExams}</div>
              <p className="text-xs mt-1 opacity-90">
                +{stats.examsThisMonth} este mês
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-5 w-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs mt-1 opacity-90">
                +{stats.usersThisMonth} este mês
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total de Submissões</CardTitle>
                <CheckCircle className="h-5 w-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSubmissions}</div>
              <p className="text-xs mt-1 opacity-90">
                +{stats.submissionsThisMonth} este mês
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
                <TrendingUp className="h-5 w-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.averageScore.toFixed(1)}
              </div>
              <p className="text-xs mt-1 opacity-90">Pontos (todas as provas)</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6 sm:mb-8">
          {/* Provas Mais Populares */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle>Provas Mais Populares</CardTitle>
              </div>
              <CardDescription>Provas com mais submissões</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.popularExams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma prova com submissões</p>
                ) : (
                  stats.popularExams.map((exam, index) => (
                    <div key={exam._id} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{exam.title}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {exam.submissionCount} submissões
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Média: {exam.averageScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usuários Mais Ativos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Usuários Mais Ativos</CardTitle>
              </div>
              <CardDescription>Usuários com mais provas realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário com submissões</p>
                ) : (
                  stats.topUsers.map((user, index) => (
                    <div key={user._id} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {user.submissionCount} provas
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Média: {user.averageScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribuições */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6 sm:mb-8">
          {/* Distribuição de Tipos de Conta */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Tipos de Conta</CardTitle>
              <CardDescription>Usuários por tipo de assinatura</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Gratuito</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.accountTypeDistribution.gratuito} usuários
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (stats.accountTypeDistribution.gratuito / stats.totalUsers) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Trial</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.accountTypeDistribution.trial} usuários
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (stats.accountTypeDistribution.trial / stats.totalUsers) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Premium</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.accountTypeDistribution.premium} usuários
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (stats.accountTypeDistribution.premium / stats.totalUsers) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribuição de Tipos de Prova */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Métodos de Avaliação</CardTitle>
              <CardDescription>Provas por método de pontuação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Normal</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.examTypeDistribution.normal} provas
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (stats.examTypeDistribution.normal / stats.totalExams) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">TRI</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.examTypeDistribution.tri} provas
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (stats.examTypeDistribution.tri / stats.totalExams) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Discursiva</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.examTypeDistribution.discursive} provas
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (stats.examTypeDistribution.discursive / stats.totalExams) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Atividade Recente (Últimos 7 Dias)</CardTitle>
            </div>
            <CardDescription>Resumo diário de atividades na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Data</th>
                      <th className="text-center py-2 font-medium">Provas Criadas</th>
                      <th className="text-center py-2 font-medium">Usuários Cadastrados</th>
                      <th className="text-center py-2 font-medium">Submissões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActivity.map((activity, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-3">{activity.date}</td>
                        <td className="text-center">{activity.examsCreated}</td>
                        <td className="text-center">{activity.usersRegistered}</td>
                        <td className="text-center">{activity.submissionsCompleted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
