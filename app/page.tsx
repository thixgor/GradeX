'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationsBell } from '@/components/notifications-bell'
import { Exam } from '@/lib/types'
import { formatDate, isBetweenDates } from '@/lib/utils'
import { Clock, Calendar, FileText, LogOut, Settings, Plus } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    checkAuth()
  }, [])

  // Atualiza o status dos exames a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
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
      loadExams()
    } catch (error) {
      router.push('/auth/login')
    }
  }

  async function loadExams() {
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      setExams(data.exams || [])
    } catch (error) {
      console.error('Erro ao carregar provas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
  }

  function getExamStatus(exam: Exam) {
    const now = new Date()
    const startTime = new Date(exam.startTime)
    const endTime = new Date(exam.endTime)

    // 1. Verifica se a prova já terminou
    if (now > endTime) {
      return { text: 'Finalizada', color: 'text-red-600', canTake: false }
    }

    // 2. Se tem sistema de portões
    if (exam.gatesOpen && exam.gatesClose) {
      const gatesOpen = new Date(exam.gatesOpen)
      const gatesClose = new Date(exam.gatesClose)

      // Portões ainda não abriram
      if (now < gatesOpen) {
        return { text: 'Portões ainda não abriram', color: 'text-gray-500', canTake: false }
      }

      // Portões já fecharam
      if (now > gatesClose) {
        return { text: 'Portões fechados', color: 'text-gray-500', canTake: false }
      }

      // Portões estão abertos - verifica se prova começou
      if (now >= startTime && now <= endTime) {
        // Prova em andamento
        return { text: 'Disponível - Em andamento', color: 'text-green-600', canTake: true }
      } else if (now < startTime) {
        // Prova ainda não começou - SALA DE ESPERA
        return { text: 'Portões abertos - Aguardando início', color: 'text-blue-600', canTake: true }
      }
    }

    // 3. Sem portões - verifica apenas horário de início/término
    if (now < startTime) {
      return { text: 'Aguardando início', color: 'text-yellow-600', canTake: false }
    }

    if (now >= startTime && now <= endTime) {
      return { text: 'Disponível', color: 'text-green-600', canTake: true }
    }

    return { text: 'Indisponível', color: 'text-gray-500', canTake: false }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              GradeX
            </h1>
            {user && (
              <span className="text-sm text-muted-foreground hidden md:block">
                Olá, {user.name}!
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {user?.role === 'admin' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/exams/create')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Prova
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/admin/exams')}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </>
            )}
            {user && <NotificationsBell />}
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Provas Disponíveis</h2>
          <p className="text-muted-foreground">
            {exams.length === 0
              ? 'Nenhuma prova disponível no momento'
              : 'Selecione uma prova para realizar'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const status = getExamStatus(exam)

            return (
              <Card
                key={exam._id?.toString()}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => {
                  if (status.canTake) {
                    router.push(`/exam/${exam._id}`)
                  } else if (new Date() > new Date(exam.endTime)) {
                    router.push(`/exam/${exam._id}/results`)
                  }
                }}
              >
                {exam.coverImage && (
                  <div className="h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={exam.coverImage}
                      alt={exam.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-2">{exam.title}</CardTitle>
                    <span className={`text-xs font-semibold ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  {exam.description && (
                    <CardDescription className="line-clamp-2">
                      {exam.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{exam.numberOfQuestions} questões</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {exam.scoringMethod === 'tri' ? 'TRI - 1000 pts' : `${exam.totalPoints} pontos`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <div className="flex-1">
                        <div>Início: {formatDate(exam.startTime)}</div>
                        <div>Fim: {formatDate(exam.endTime)}</div>
                      </div>
                    </div>

                    {exam.gatesOpen && (
                      <div className="text-xs pt-2 border-t">
                        Portões: {formatDate(exam.gatesOpen)} - {formatDate(exam.gatesClose!)}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    {status.canTake ? (
                      <Button className="w-full" variant="default">
                        {status.text.includes('Aguardando início') ? 'Entrar na Sala' : 'Realizar Prova'}
                      </Button>
                    ) : new Date() > new Date(exam.endTime) ? (
                      <Button className="w-full" variant="outline">
                        Ver Resultados
                      </Button>
                    ) : (
                      <Button className="w-full" variant="secondary" disabled>
                        {status.text}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
