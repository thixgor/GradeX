'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExamContextMenu } from '@/components/exam-context-menu'
import { ExamGroup } from '@/components/exam-group'
import { Exam } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, Calendar, FileText, Info, Sparkles, Users, Plus } from 'lucide-react'

interface Group {
  _id: string
  name: string
  description?: string
  color?: string
  icon?: string
  type: 'personal' | 'general'
  createdBy: string
}

function ProvasContent() {
  const router = useRouter()
  const { user, handleCreateExam, tierLimitExceeded } = useAppShell()

  const [exams, setExams] = useState<Exam[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ examId: string; examTitle: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showExamsInfo, setShowExamsInfo] = useState(false)

  useEffect(() => {
    loadExamsAndGroups()
  }, [])

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
          icon: '',
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setGroups([...groups, data.group])
        return
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
        setGroups(groups.filter(g => g._id !== groupId))
        setExams(exams.map(e =>
          e.groupId === groupId
            ? { ...e, groupId: undefined }
            : e
        ))
        return
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

  function getExamStatus(exam: Exam) {
    const now = new Date()
    const startTime = new Date(exam.startTime)
    const endTime = new Date(exam.endTime)

    if (now > endTime) {
      return { text: 'Finalizada', color: 'text-red-600', canTake: false }
    }

    if (exam.gatesOpen && exam.gatesClose) {
      const gatesOpen = new Date(exam.gatesOpen)
      const gatesClose = new Date(exam.gatesClose)

      if (now < gatesOpen) {
        return { text: 'Portões ainda não abriram', color: 'text-gray-500', canTake: false }
      }

      if (now > gatesClose) {
        return { text: 'Portões fechados', color: 'text-gray-500', canTake: false }
      }

      if (now >= startTime && now <= endTime) {
        return { text: 'Disponível', color: 'text-green-600', canTake: true }
      } else if (now < startTime) {
        return { text: 'Aguardando início', color: 'text-blue-600', canTake: true }
      }
    }

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
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const ungroupedExams = exams.filter(e => !e.groupId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Provas</h1>
            <p className="text-muted-foreground mt-1">
              {exams.length === 0
                ? 'Nenhuma prova disponível no momento'
                : `${exams.length} ${exams.length === 1 ? 'prova disponível' : 'provas disponíveis'}`}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExamsInfo(true)}
            >
              <Info className="h-4 w-4 mr-2" />
              Sobre as Provas
            </Button>
            <Button
              onClick={handleCreateExam}
              disabled={tierLimitExceeded}
              size="sm"
              className="bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Prova
            </Button>
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="space-y-8">
        {/* Ungrouped Exams */}
        {ungroupedExams.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Provas Principais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ungroupedExams.map((exam) => {
                const status = getExamStatus(exam)

                return (
                  <Card
                    key={exam._id?.toString()}
                    className={`group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border-l-4 ${
                      exam.isPersonalExam
                        ? 'border-l-purple-500 dark:border-l-purple-400'
                        : 'border-l-[#468152] dark:border-l-[#468152]'
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
                      <div className="h-40 overflow-hidden">
                        <img
                          src={exam.coverImage}
                          alt={exam.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                              exam.isPersonalExam
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                : 'bg-[#468152]/10 text-[#468152] dark:bg-[#468152]/20'
                            }`}>
                              {exam.isPersonalExam ? (
                                <><Sparkles className="h-3 w-3" /> Pessoal</>
                              ) : (
                                <><Users className="h-3 w-3" /> Geral</>
                              )}
                            </span>
                            <span className={`text-xs font-medium ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                          <CardTitle className="text-base line-clamp-2">{exam.title}</CardTitle>
                        </div>
                      </div>
                      {exam.description && (
                        <CardDescription className="line-clamp-2 text-sm">
                          {exam.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{exam.numberOfQuestions} questões</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {exam.scoringMethod === 'tri' ? 'TRI' : `${exam.totalPoints} pts`}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Início: {formatDate(exam.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Fim: {formatDate(exam.endTime)}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        {status.canTake ? (
                          <Button className="flex-1" size="sm">
                            {status.text.includes('Aguardando') ? 'Entrar na Sala' : 'Realizar Prova'}
                          </Button>
                        ) : new Date() > new Date(exam.endTime) ? (
                          <Button className="flex-1" variant="outline" size="sm">
                            Ver Resultados
                          </Button>
                        ) : (
                          <Button className="flex-1" variant="secondary" size="sm" disabled>
                            {status.text}
                          </Button>
                        )}

                        {exam.isPersonalExam && exam.createdBy === user?.id && (
                          <Button
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
                            Deletar
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

        {/* Grouped Exams */}
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

        {/* Empty State */}
        {exams.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma prova disponível</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Crie sua primeira prova pessoal com questões geradas por IA ou aguarde provas gerais.
            </p>
            <Button onClick={handleCreateExam} disabled={tierLimitExceeded}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Prova
            </Button>
          </div>
        )}
      </div>

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

      {/* Exams Info Dialog */}
      <Dialog open={showExamsInfo} onOpenChange={setShowExamsInfo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>O que são essas Provas?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p>
              Na DomineAqui, você treina do jeito certo — como se estivesse no dia da prova.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#468152]/10 border border-[#468152]/20">
                <Users className="h-5 w-5 text-[#468152] mt-0.5" />
                <div>
                  <p className="font-semibold text-[#468152]">Provas Gerais</p>
                  <p className="text-muted-foreground">
                    Elaboradas pela equipe DomineAqui, seguindo o padrão das provas reais. Gabarito liberado após o término.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-purple-700 dark:text-purple-300">Provas Pessoais</p>
                  <p className="text-muted-foreground">
                    Crie suas próprias provas com IA, focando nos conteúdos que você precisa dominar.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground">
              Treine com foco, estratégia e controle de tempo. Simule, analise e evolua de forma inteligente.
            </p>

            <p className="font-semibold text-primary">
              DomineAqui — Seja o Foco, Seja a Referência
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowExamsInfo(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
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
    </div>
  )
}

export default function ProvasPage() {
  return (
    <AppShell headerTitle="Provas" headerSubtitle="Simulados e provas pessoais">
      <ProvasContent />
    </AppShell>
  )
}
