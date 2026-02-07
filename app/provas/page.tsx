'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { PageLoading } from '@/components/page-loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExamContextMenu } from '@/components/exam-context-menu'
import { ExamGroup } from '@/components/exam-group'
import { Exam } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import {
  Clock,
  Calendar,
  FileText,
  Info,
  Sparkles,
  Users,
  Plus,
  Trophy,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  Play,
  Eye,
} from 'lucide-react'

interface Group {
  _id: string
  name: string
  description?: string
  color?: string
  icon?: string
  type: 'personal' | 'general'
  createdBy: string
}

// ─── Skeleton Loader ──────────────────────────────────────────
function ExamSkeleton() {
  return (
    <div className="glass-page-card rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-5 w-16 rounded-full skeleton-pulse" />
        <div className="h-4 w-20 rounded-full skeleton-pulse" />
      </div>
      <div className="h-5 w-3/4 rounded skeleton-pulse" />
      <div className="h-4 w-1/2 rounded skeleton-pulse" />
      <div className="flex gap-4">
        <div className="h-4 w-24 rounded skeleton-pulse" />
        <div className="h-4 w-20 rounded skeleton-pulse" />
      </div>
      <div className="h-10 w-full rounded-xl skeleton-pulse" />
    </div>
  )
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
      return { text: 'Finalizada', color: 'text-red-500', bgColor: 'bg-red-500/10', dotColor: 'bg-red-500', canTake: false }
    }

    if (exam.gatesOpen && exam.gatesClose) {
      const gatesOpen = new Date(exam.gatesOpen)
      const gatesClose = new Date(exam.gatesClose)

      if (now < gatesOpen) {
        return { text: 'Portoes fechados', color: 'text-muted-foreground', bgColor: 'bg-muted', dotColor: 'bg-gray-400', canTake: false }
      }

      if (now > gatesClose) {
        return { text: 'Portoes fechados', color: 'text-muted-foreground', bgColor: 'bg-muted', dotColor: 'bg-gray-400', canTake: false }
      }

      if (now >= startTime && now <= endTime) {
        return { text: 'Disponivel', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-500', canTake: true }
      } else if (now < startTime) {
        return { text: 'Aguardando', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10', dotColor: 'bg-blue-500', canTake: true }
      }
    }

    if (now < startTime) {
      return { text: 'Aguardando', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10', dotColor: 'bg-amber-500', canTake: false }
    }

    if (now >= startTime && now <= endTime) {
      return { text: 'Disponivel', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-500', canTake: true }
    }

    return { text: 'Indisponivel', color: 'text-muted-foreground', bgColor: 'bg-muted', dotColor: 'bg-gray-400', canTake: false }
  }

  // ─── Computed Stats ──────────────────────────────────────────
  const completedExams = exams.filter(e => new Date() > new Date(e.endTime)).length
  const availableExams = exams.filter(e => {
    const s = getExamStatus(e)
    return s.canTake
  }).length
  const personalExams = exams.filter(e => e.isPersonalExam).length
  const generalExams = exams.filter(e => !e.isPersonalExam).length

  const ungroupedExams = exams.filter(e => !e.groupId)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Skeleton header */}
          <div className="h-20 rounded-2xl skeleton-pulse" />
          {/* Skeleton stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 rounded-2xl skeleton-pulse" />
            ))}
          </div>
          {/* Skeleton cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i => <ExamSkeleton key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ═══════════════════════════════════════════════════
            HEADER
           ═══════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Provas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {exams.length === 0
                ? 'Nenhuma prova disponivel no momento'
                : `${exams.length} ${exams.length === 1 ? 'prova disponivel' : 'provas disponiveis'}`}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExamsInfo(true)}
              className="hover-glow-green rounded-xl text-xs"
            >
              <Info className="h-3.5 w-3.5 mr-1.5" />
              Sobre as Provas
            </Button>
            <Button
              onClick={handleCreateExam}
              disabled={tierLimitExceeded}
              size="sm"
              className="btn-brand-glow text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nova Prova
            </Button>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            DASHBOARD STATS
           ═══════════════════════════════════════════════════ */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Disponiveis', value: availableExams, icon: Play, color: '#468152', iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
            { label: 'Finalizadas', value: completedExams, icon: CheckCircle2, color: '#E2A43E', iconBg: 'bg-amber-500/10 dark:bg-amber-500/20' },
            { label: 'Pessoais', value: personalExams, icon: Sparkles, color: '#8b5cf6', iconBg: 'bg-violet-500/10 dark:bg-violet-500/20' },
            { label: 'Gerais', value: generalExams, icon: Users, color: '#3b82f6', iconBg: 'bg-blue-500/10 dark:bg-blue-500/20' },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 + index * 0.06 }}
                className="glass-stat rounded-2xl p-4 hover-glow-brand hover-lift transition-all duration-300 group cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-4 w-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold tracking-tight">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </section>

        {/* ═══════════════════════════════════════════════════
            UNGROUPED EXAMS (Main exams)
           ═══════════════════════════════════════════════════ */}
        {ungroupedExams.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">Suas Provas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ungroupedExams.map((exam, index) => {
                const status = getExamStatus(exam)

                return (
                  <motion.div
                    key={exam._id?.toString()}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.35 + index * 0.05 }}
                    className={`
                      glass-page-card rounded-2xl overflow-hidden group cursor-pointer
                      hover-glow-green hover-lift transition-all duration-300
                      border-l-[3px] ${exam.isPersonalExam
                        ? 'border-l-violet-500'
                        : 'border-l-[#468152]'
                      }
                    `}
                    onContextMenu={(e) => handleExamContextMenu(exam, e)}
                    onClick={() => {
                      if (status.canTake) {
                        router.push(`/exam/${exam._id}`)
                      } else if (new Date() > new Date(exam.endTime)) {
                        router.push(`/exam/${exam._id}/results`)
                      }
                    }}
                  >
                    {/* Cover Image */}
                    {exam.coverImage && (
                      <div className="h-36 overflow-hidden">
                        <img
                          src={exam.coverImage}
                          alt={exam.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          exam.isPersonalExam
                            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                            : 'bg-[#468152]/10 text-[#468152]'
                        }`}>
                          {exam.isPersonalExam ? (
                            <><Sparkles className="h-2.5 w-2.5" /> Pessoal</>
                          ) : (
                            <><Users className="h-2.5 w-2.5" /> Geral</>
                          )}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bgColor}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
                          <span className={status.color}>{status.text}</span>
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors">
                        {exam.title}
                      </h3>

                      {exam.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {exam.description}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{exam.numberOfQuestions} questoes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          <span>
                            {exam.scoringMethod === 'tri' ? 'TRI' : `${exam.totalPoints} pts`}
                          </span>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="text-[11px] text-muted-foreground/70 space-y-0.5 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>Inicio: {formatDate(exam.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>Fim: {formatDate(exam.endTime)}</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex gap-2 pt-1">
                        {status.canTake ? (
                          <Button
                            className="flex-1 btn-brand-glow text-white rounded-xl text-xs font-semibold h-9"
                            size="sm"
                          >
                            <Play className="h-3.5 w-3.5 mr-1.5" />
                            {status.text.includes('Aguardando') ? 'Entrar na Sala' : 'Realizar Prova'}
                          </Button>
                        ) : new Date() > new Date(exam.endTime) ? (
                          <Button
                            className="flex-1 rounded-xl text-xs h-9"
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Ver Resultados
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 rounded-xl text-xs h-9"
                            variant="secondary"
                            size="sm"
                            disabled
                          >
                            {status.text}
                          </Button>
                        )}

                        {exam.isPersonalExam && exam.createdBy === user?.id && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-xl text-xs h-9"
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
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* ═══════════════════════════════════════════════════
            GROUPED EXAMS
           ═══════════════════════════════════════════════════ */}
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

        {/* ═══════════════════════════════════════════════════
            EMPTY STATE
           ═══════════════════════════════════════════════════ */}
        {exams.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#468152]/10 mb-4">
              <FileText className="h-8 w-8 text-[#468152]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma prova disponivel</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
              Crie sua primeira prova pessoal com questoes geradas por IA ou aguarde provas gerais.
            </p>
            <Button
              onClick={handleCreateExam}
              disabled={tierLimitExceeded}
              className="btn-brand-glow text-white rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Prova
            </Button>
          </motion.div>
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
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#468152]/10">
                <Info className="h-5 w-5 text-[#468152]" />
              </div>
              O que sao essas Provas?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Na DomineAqui, voce treina do jeito certo — como se estivesse no dia da prova.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#468152]/5 border border-[#468152]/15 hover-glow-green transition-all">
                <Users className="h-5 w-5 text-[#468152] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#468152]">Provas Gerais</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Elaboradas pela equipe DomineAqui, seguindo o padrao das provas reais. Gabarito liberado apos o termino.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/5 border border-violet-500/15 hover-glow-brand transition-all">
                <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-violet-700 dark:text-violet-300">Provas Pessoais</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Crie suas proprias provas com IA, focando nos conteudos que voce precisa dominar.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground text-xs">
              Treine com foco, estrategia e controle de tempo. Simule, analise e evolua de forma inteligente.
            </p>

            <p className="font-semibold text-primary text-xs">
              DomineAqui — Seja o Foco, Seja a Referencia
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowExamsInfo(false)} className="rounded-xl">Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full glass-page-card rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-600 dark:text-red-400">Deletar Prova</h3>
                  <p className="text-xs text-muted-foreground">Esta acao e irreversivel</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4">
                <p className="font-semibold text-sm">{deleteConfirmation.examTitle}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todas as submissoes relacionadas tambem serao deletadas.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setDeleteConfirmation(null)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => handleDeleteExam(deleteConfirmation.examId)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deletando...' : 'Deletar'}
                </Button>
              </div>
            </div>
          </motion.div>
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
