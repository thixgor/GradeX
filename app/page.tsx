'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationsBell } from '@/components/notifications-bell'
import { BanChecker } from '@/components/ban-checker'
import { SupportChat } from '@/components/support-chat'
import { Logo } from '@/components/logo'
import { ExamContextMenu } from '@/components/exam-context-menu'
import { ExamGroup } from '@/components/exam-group'
import { MobileMenu } from '@/components/mobile-menu'
import { Exam } from '@/lib/types'
import { formatDate, isBetweenDates } from '@/lib/utils'
import { Clock, Calendar, FileText, LogOut, Settings, Plus, User as UserIcon, Users, MessageSquare, Key, MessageCircle, BookMarked, Brain, ShoppingCart } from 'lucide-react'
import LandingPage from '@/components/landing-page'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

interface Group {
  _id: string
  name: string
  description?: string
  color?: string
  icon?: string
  type: 'personal' | 'general'
  createdBy: string
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(false)
  const [landingPageEnabled, setLandingPageEnabled] = useState(true)
  const [personalExamsEnabled, setPersonalExamsEnabled] = useState(true)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ examId: string; examTitle: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [examsRemaining, setExamsRemaining] = useState<number | null>(null)
  const [examsLimit, setExamsLimit] = useState<number | null>(null)
  const [tierLimitExceeded, setTierLimitExceeded] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  // Recarregar limites de tier a cada 30 segundos (em vez de 5s)
  useEffect(() => {
    const interval = setInterval(() => {
      loadTierLimits()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Recarregar limites quando a página ganha foco
  useEffect(() => {
    const handleFocus = () => {
      loadTierLimits()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        // Verificar se landing page está habilitada
        await checkLandingPageSettings()
        return
      }
      const data = await res.json()
      setUser(data.user)
      // Carregar configurações também para usuários autenticados
      await loadSettings()
      await loadTierLimits()
      loadExamsAndGroups()
    } catch (error) {
      await checkLandingPageSettings()
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setPersonalExamsEnabled(data.personalExamsEnabled !== false)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  async function loadTierLimits() {
    try {
      const res = await fetch('/api/user/tier-limits')
      if (res.ok) {
        const data = await res.json()
        setExamsRemaining(data.examsRemaining)
        setExamsLimit(data.limits.examsPerDay)
        // Admin nunca tem limite excedido
        setTierLimitExceeded(data.isAdmin ? false : data.examsRemaining <= 0)
      }
    } catch (error) {
      console.error('Erro ao carregar limites de tier:', error)
    }
  }

  async function checkLandingPageSettings() {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setLandingPageEnabled(data.landingPageEnabled !== false)
        setPersonalExamsEnabled(data.personalExamsEnabled !== false)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setShowLanding(true)
      setLoading(false)
    }
  }

  async function loadExamsAndGroups() {
    try {
      const [examsRes, groupsRes] = await Promise.all([
        fetch('/api/exams'),
        fetch('/api/groups'),
      ])
      
      const examsData = await examsRes.json()
      const groupsData = await groupsRes.json()
      
      setExams(examsData.exams || [])
      setGroups(groupsData.groups || [])
    } catch (error) {
      console.error('Erro ao carregar provas e grupos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleMoveExamToGroup(examId: string, groupId: string | null) {
    try {
      const res = await fetch(`/api/exams/${examId}/move-group`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      })

      if (res.ok) {
        // Atualizar o estado local
        setExams(exams.map(e => 
          e._id?.toString() === examId 
            ? { ...e, groupId: groupId || undefined }
            : e
        ))
      } else {
        const error = await res.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao mover prova:', error)
      alert('Erro ao mover prova')
    }
  }

  function handleExamContextMenu(exam: Exam, e: React.MouseEvent) {
    e.preventDefault()
    setSelectedExam(exam)
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  async function handleCreateGroup(name: string, type: 'personal' | 'general') {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          description: '',
          color: '#3B82F6',
          icon: '📁',
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Adicionar o novo grupo ao estado
        setGroups([...groups, data.group])
        return // Sucesso silencioso
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error)
      throw new Error(error.message || 'Erro ao criar grupo')
    }
  }

  async function handleDeleteGroup(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        // Remover grupo do estado
        setGroups(groups.filter(g => g._id !== groupId))
        // Mover provas do grupo para a página principal (remover groupId)
        setExams(exams.map(e => 
          e.groupId === groupId 
            ? { ...e, groupId: undefined }
            : e
        ))
        return // Sucesso silencioso
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error: any) {
      console.error('Erro ao deletar grupo:', error)
      throw new Error(error.message || 'Erro ao deletar grupo')
    }
  }

  async function handleDeleteExam(examId: string) {
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        // Remover prova do estado
        setExams(exams.filter(e => e._id?.toString() !== examId))
        setDeleteConfirmation(null)
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao deletar prova')
      }
    } catch (error: any) {
      console.error('Erro ao deletar prova:', error)
      alert('Erro ao deletar prova: ' + error.message)
    } finally {
      setIsDeleting(false)
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

  if (showLanding && landingPageEnabled) {
    return <LandingPage />
  }

  if (showLanding && !landingPageEnabled) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Verificador de Banimento */}
      {user && <BanChecker />}

      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b w-full">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3 min-h-[56px] sm:min-h-[64px]">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
              <Logo variant="full" size="md" />
              {user && (
                <>
                  <Button
                    onClick={() => router.push('/buy')}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg hidden sm:flex"
                    size="sm"
                  >
                    ⭐ Upgrade
                  </Button>
                  <span className="text-xs sm:text-sm text-muted-foreground hidden lg:block">
                    Olá, {user.name}!
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2 justify-end flex-shrink-0">
              {user?.role === 'admin' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/admin')}
                    className="hidden sm:flex"
                  >
                    <Settings className="h-4 w-4 sm:mr-2" />
                    <span className="hidden md:inline">Admin</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/admin')}
                    title="Painel Admin"
                    className="sm:hidden h-8 w-8"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/admin/exams/create')}
                    className="hidden md:flex"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Prova
                  </Button>
                </>
              )}
              {user && personalExamsEnabled && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (tierLimitExceeded) {
                        alert(`You've reached your creation limit.
Upgrade to Premium for 10 exams per day with up to 20 questions per exam.

Contact: (21) 99777-0936`)
                      } else {
                        router.push('/exams/create-personal')
                      }
                    }}
                    disabled={tierLimitExceeded}
                    className="hidden md:flex"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Prova Pessoal
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/flashcards')}
                    title="Flashcards"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/cronogramas')}
                    title="Cronogramas"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <BookMarked className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/profile')}
                    title="Meu Perfil"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/forum')}
                    title="Fóruns"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <NotificationsBell />
                  <MobileMenu
                    onCreatePersonalExam={() => {
                      if (tierLimitExceeded) {
                        alert(`You've reached your creation limit.
Upgrade to Premium for 10 exams per day with up to 20 questions per exam.

Contact: (21) 99777-0936`)
                      } else {
                        router.push('/exams/create-personal')
                      }
                    }}
                    onCreateExam={() => router.push('/admin/exams/create')}
                    isAdmin={user?.role === 'admin'}
                    tierLimitExceeded={tierLimitExceeded}
                    personalExamsEnabled={personalExamsEnabled}
                  />
                </>
              )}
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contador de Provas Pessoais Restantes */}
      {user && personalExamsEnabled && examsRemaining !== null && examsLimit !== null && (
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-2 sm:px-4 py-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Provas Pessoais Restantes: <span className="font-semibold text-foreground">{examsRemaining} / {examsLimit}</span>
            </p>
          </div>
        </div>
      )}

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

        <div className="space-y-6">
          {/* Provas sem grupo (página principal) */}
          {exams.filter(e => !e.groupId).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Provas Principais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.filter(e => !e.groupId).map((exam) => {
                  const status = getExamStatus(exam)

                  return (
                    <Card
                      key={exam._id?.toString()}
                      className={`hover:shadow-lg transition-shadow cursor-pointer group border-l-4 ${
                        exam.isPersonalExam
                          ? 'border-l-purple-500 dark:border-l-purple-400'
                          : 'border-l-blue-500 dark:border-l-blue-400'
                      }`}
                      onContextMenu={(e) => handleExamContextMenu(exam, e)}
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="line-clamp-2">{exam.title}</CardTitle>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                          exam.isPersonalExam
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {exam.isPersonalExam ? 'Pessoal' : 'Geral'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${status.color} whitespace-nowrap`}>
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

                  <div className="mt-4 space-y-2">
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
                    
                    {/* Botão Delete para provas pessoais (apenas para o criador) */}
                    {exam.isPersonalExam && exam.createdBy === user?.id && (
                      <Button
                        className="w-full"
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirmation({
                            examId: exam._id?.toString() || '',
                            examTitle: exam.title
                          })
                        }}
                      >
                        Deletar Prova
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
              </div>
            </div>
          )}

          {/* Grupos de Provas */}
          {groups.map((group) => {
            const groupExams = exams.filter(e => e.groupId === group._id)

            return (
              <ExamGroup
                key={group._id}
                group={group}
                exams={groupExams}
                currentUserId={user?.id || ''}
                userRole={user?.role || 'user'}
                onExamClick={(exam) => {
                  const status = getExamStatus(exam)
                  if (status.canTake) {
                    router.push(`/exam/${exam._id}`)
                  } else if (new Date() > new Date(exam.endTime)) {
                    router.push(`/exam/${exam._id}/results`)
                  }
                }}
                onExamContextMenu={handleExamContextMenu}
                onDeleteGroup={handleDeleteGroup}
              />
            )
          })}
        </div>
      </main>

      {/* Context Menu */}
      {selectedExam && (
        <ExamContextMenu
          examId={selectedExam._id?.toString() || ''}
          examGroupId={selectedExam.groupId || null}
          isPersonalExam={selectedExam.isPersonalExam || false}
          createdBy={selectedExam.createdBy}
          currentUserId={user?.id || ''}
          userRole={user?.role || 'user'}
          groups={groups}
          onMoveToGroup={(groupId) => handleMoveExamToGroup(selectedExam._id?.toString() || '', groupId)}
          onCreateGroup={handleCreateGroup}
          position={contextMenu}
          onClose={() => {
            setContextMenu(null)
            setSelectedExam(null)
          }}
        />
      )}

      {/* Modal de Confirmação de Deleção */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                Deletar Prova
              </CardTitle>
              <CardDescription>
                Tem certeza que deseja deletar esta prova?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="font-semibold text-sm">{deleteConfirmation.examTitle}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta ação é irreversível. Todas as submissões relacionadas também serão deletadas.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmation(null)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteExam(deleteConfirmation.examId)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deletando...' : 'Deletar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat de Suporte */}
      {user && <SupportChat />}

      {/* Botão Flutuante de Shop (Mobile) */}
      {user && (
        <button
          onClick={() => router.push('/buy')}
          className="fixed bottom-6 right-6 md:hidden z-40 w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95"
          title="Ir para compras"
        >
          <ShoppingCart className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
