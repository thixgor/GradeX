'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { AppShell } from '@/components/app-shell'
import { PlanLimitsCard } from '@/components/plan-limits-card'
import { CheckCircle, Clock, FileText, Download, Printer, ClipboardList, Trophy, BookOpen, Crown, Timer, Sparkles, Phone, Mail, XCircle, Ticket, AlertTriangle, ChevronDown, ChevronUp, Target, BarChart3, GraduationCap } from 'lucide-react'
import { FocusSessionsProfile } from '@/components/focus-sessions-profile'
import { generateGabaritoPDF, downloadPDF, generateExamPDF, generateStudentAnswersPDF } from '@/lib/pdf-generator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccountType } from '@/lib/types'
import { ActivationSuccessDialog } from '@/components/activation-success-dialog'
import { cn } from '@/lib/utils'

interface UserSubmission {
  _id: string
  examId: string
  examName: string
  examTitle: string
  userId: string
  userName: string
  startedAt?: Date
  submittedAt: Date
  score?: number
  triScore?: number
  discursiveScore?: number
  correctionStatus?: 'pending' | 'corrected'
  corrections?: Array<{
    questionId: string
    score: number
    maxScore: number
    feedback: string
    method: string
  }>
  hasDiscursiveQuestions: boolean
  isPracticeExam?: boolean
  examEndTime?: Date
  answers?: any[]
  exam?: any
}

function calculateDuration(startTime: Date, endTime: Date): string {
  const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMins / 60)
  const minutes = diffMins % 60
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

export default function ProfilePage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<UserSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const [accountType, setAccountType] = useState<AccountType>('gratuito')
  const [trialExpiresAt, setTrialExpiresAt] = useState<Date | null>(null)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [examsCompleted, setExamsCompleted] = useState(0)
  const [questionsAnsweredExams, setQuestionsAnsweredExams] = useState(0)
  const [questionsAnsweredBank, setQuestionsAnsweredBank] = useState(0)
  const [questionsCorrectBank, setQuestionsCorrectBank] = useState(0)
  const [questionsWrongBank, setQuestionsWrongBank] = useState(0)
  const [bankAccuracyRate, setBankAccuracyRate] = useState(0)
  const [userTotals, setUserTotals] = useState({
    totalCronogramasCreated: 0,
    totalFlashcardsCreated: 0,
    totalPersonalExamsCreated: 0,
  })
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [activateDialogOpen, setActivateDialogOpen] = useState(false)
  const [serialKey, setSerialKey] = useState('')
  const [activating, setActivating] = useState(false)
  const [activationSuccessOpen, setActivationSuccessOpen] = useState(false)
  const [activationDetails, setActivationDetails] = useState<any>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null)

  useEffect(() => {
    loadSubmissions()
    loadUserData()
    loadStatistics()
  }, [])

  async function loadSubmissions() {
    try {
      const res = await fetch('/api/user/submissions')
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Erro ao carregar submissoes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserData() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserName(data.user?.name || 'Usuario')
        setUserRole(data.user?.role || 'user')
        setAccountType(data.user?.accountType || 'gratuito')
        if (data.user?.trialExpiresAt) {
          setTrialExpiresAt(new Date(data.user.trialExpiresAt))
        }
        setUserTotals({
          totalCronogramasCreated: data.user?.totalCronogramasCreated || 0,
          totalFlashcardsCreated: data.user?.totalFlashcardsCreated || 0,
          totalPersonalExamsCreated: data.user?.totalPersonalExamsCreated || 0,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuario:', error)
    }
  }

  async function loadStatistics() {
    try {
      const res = await fetch('/api/user/statistics')
      if (res.ok) {
        const data = await res.json()
        setQuestionsAnswered(data.questionsAnswered || 0)
        setExamsCompleted(data.examsCompleted || 0)
        setQuestionsAnsweredExams(data.questionsAnsweredExams || 0)
        setQuestionsAnsweredBank(data.questionsAnsweredBank || 0)
        setQuestionsCorrectBank(data.questionsCorrectBank || 0)
        setQuestionsWrongBank(data.questionsWrongBank || 0)
        setBankAccuracyRate(data.bankAccuracyRate || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error)
    }
  }

  async function handleActivateKey() {
    if (!serialKey.trim()) {
      setToastMessage('Digite uma serial key valida')
      setToastOpen(true)
      return
    }
    setActivating(true)
    try {
      const res = await fetch('/api/serial-keys/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: serialKey.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao ativar serial key')
      setActivationDetails(data)
      setActivateDialogOpen(false)
      setSerialKey('')
      setActivationSuccessOpen(true)
      loadUserData()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastOpen(true)
    } finally {
      setActivating(false)
    }
  }

  async function handleCancelSubscription() {
    setCancelling(true)
    try {
      const res = await fetch('/api/stripe/cancel-subscription', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao cancelar assinatura')
      setToastMessage(data.message)
      setToastOpen(true)
      setCancelDialogOpen(false)
      loadUserData()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastOpen(true)
    } finally {
      setCancelling(false)
    }
  }

  function getTrialTimeRemaining(): string {
    if (!trialExpiresAt) return ''
    const now = new Date()
    const expiration = new Date(trialExpiresAt)
    const diffMs = expiration.getTime() - now.getTime()
    if (diffMs <= 0) return 'Expirado'
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (days > 0) return `${days}d ${hours}h ${minutes}min`
    if (hours > 0) return `${hours}h ${minutes}min`
    return `${minutes}min`
  }

  function getAccountBadge() {
    if (userRole === 'admin') {
      return { label: 'Admin', colors: 'from-purple-600 to-pink-600', icon: <Crown className="h-3.5 w-3.5" /> }
    }
    switch (accountType) {
      case 'premium':
        return { label: 'Premium', colors: 'from-yellow-500 to-orange-500', icon: <Crown className="h-3.5 w-3.5" /> }
      case 'trial':
        return { label: `Trial - ${getTrialTimeRemaining()}`, colors: 'from-blue-500 to-cyan-500', icon: <Timer className="h-3.5 w-3.5" /> }
      default:
        return { label: 'Gratuito', colors: 'from-gray-400 to-gray-500', icon: null }
    }
  }

  async function handleDownloadReport(submission: UserSubmission) {
    router.push(`/exam/${submission.examId}/user/${submission.userId}`)
  }

  async function handleDownloadAnswerSheet(examId: string) {
    try {
      const res = await fetch(`/api/exams/${examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const data = await res.json()
      const blob = generateGabaritoPDF(data.exam)
      downloadPDF(blob, `Gabarito-${data.exam.title}.pdf`)
    } catch (error: any) {
      setToastMessage('Erro ao gerar gabarito: ' + error.message)
      setToastOpen(true)
    }
  }

  async function handleDownloadExamPDF(examId: string, userId: string) {
    try {
      const res = await fetch(`/api/exams/${examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const data = await res.json()
      const blob = generateExamPDF(data.exam, userId)
      downloadPDF(blob, `Prova-${data.exam.title}.pdf`)
    } catch (error: any) {
      setToastMessage('Erro ao gerar PDF da prova: ' + error.message)
      setToastOpen(true)
    }
  }

  async function handleDownloadAnswersPDF(submission: UserSubmission) {
    try {
      const res = await fetch(`/api/exams/${submission.examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const examData = await res.json()
      const submissionRes = await fetch(`/api/submissions/${submission._id}`)
      if (!submissionRes.ok) throw new Error('Erro ao buscar submissao')
      const submissionData = await submissionRes.json()
      const answers = submissionData.submission?.answers || []
      const blob = generateStudentAnswersPDF(examData.exam, answers, submission.userName || userName)
      downloadPDF(blob, `Minhas-Respostas-${examData.exam.title}.pdf`)
    } catch (error: any) {
      setToastMessage('Erro ao gerar PDF de respostas: ' + error.message)
      setToastOpen(true)
    }
  }

  function isExamFinished(submission: UserSubmission): boolean {
    if (submission.isPracticeExam) return true
    if (!submission.examEndTime) return false
    return new Date() > new Date(submission.examEndTime)
  }

  const badge = getAccountBadge()

  return (
    <AppShell headerTitle="Meu Perfil" headerSubtitle={userName}>
      <BanChecker />
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* ====== SECTION 1: Profile Header ====== */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#468152] to-[#E2A43E] flex items-center justify-center shadow-lg shrink-0">
              <span className="text-2xl font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight">{userName}</h1>
              <div className={cn('mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r shadow-sm', badge.colors)}
              >
                {badge.icon}
                {badge.label}
              </div>
            </div>
            {/* Quick Actions */}
            <div className="flex gap-2 shrink-0">
              {userRole !== 'admin' && accountType === 'gratuito' && (
                <Button size="sm" onClick={() => setUpgradeDialogOpen(true)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-xs h-8 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Upgrade
                </Button>
              )}
              {userRole !== 'admin' && (
                <Button size="sm" variant="outline" onClick={() => setActivateDialogOpen(true)}
                  className="text-xs h-8 gap-1.5">
                  <Crown className="h-3.5 w-3.5" />
                  Ativar Key
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* ====== SECTION 2: Statistics Overview ====== */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Estatisticas</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">Questoes</span>
              </div>
              <p className="text-2xl font-bold">{questionsAnswered}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">Provas</span>
              </div>
              <p className="text-2xl font-bold">{examsCompleted}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">Banco</span>
              </div>
              <p className="text-2xl font-bold">{questionsAnsweredBank}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                  bankAccuracyRate >= 70 ? 'from-green-500 to-emerald-600'
                    : bankAccuracyRate >= 50 ? 'from-yellow-500 to-orange-600'
                    : 'from-red-500 to-rose-600'
                )}>
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">Acerto</span>
              </div>
              <p className="text-2xl font-bold">{bankAccuracyRate}%</p>
            </div>
          </div>
        </section>

        {/* ====== SECTION 3: Performance Detail (if has bank data) ====== */}
        {questionsAnsweredBank > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Desempenho no Banco</h2>
            <div className="p-5 rounded-xl bg-muted/30 border border-border/50">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{questionsCorrectBank}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Acertos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{questionsWrongBank}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Erros</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{bankAccuracyRate}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Aproveitamento</p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-700 rounded-full"
                  style={{ width: `${bankAccuracyRate}%` }}
                />
              </div>
            </div>
          </section>
        )}

        {/* ====== SECTION 4: Plan Limits ====== */}
        {!loading && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Limites do Plano</h2>
            <PlanLimitsCard
              accountType={accountType}
              isAdmin={userRole === 'admin'}
              cronogramasCreated={userTotals.totalCronogramasCreated}
              flashcardsCreated={userTotals.totalFlashcardsCreated}
              personalExamsCreated={userTotals.totalPersonalExamsCreated}
              showUpgradeButton
            />
          </section>
        )}

        {/* ====== SECTION 5: Focus Sessions ====== */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Sessoes de Foco</h2>
          <FocusSessionsProfile />
        </section>

        {/* ====== SECTION 6: Submissions ====== */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Minhas Provas</h2>
            {submissions.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {submissions.length} {submissions.length === 1 ? 'prova' : 'provas'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Carregando...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-muted/30 border border-border/50">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Nenhuma prova realizada</p>
              <Button size="sm" variant="outline" onClick={() => router.push('/')}>
                Ver Provas Disponiveis
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((submission) => {
                const isExpanded = expandedSubmission === submission._id
                const isCorrected = submission.correctionStatus === 'corrected' || !submission.hasDiscursiveQuestions
                const finished = isExamFinished(submission)

                return (
                  <div key={submission._id} className="rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-200">
                    {/* Summary row */}
                    <button
                      onClick={() => setExpandedSubmission(isExpanded ? null : submission._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      {/* Status dot */}
                      <div className={cn('w-2 h-2 rounded-full shrink-0',
                        isCorrected ? 'bg-green-500' : 'bg-yellow-500'
                      )} />
                      {/* Title + date */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{submission.examTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(submission.submittedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                          {submission.startedAt && ` · ${calculateDuration(submission.startedAt, submission.submittedAt)}`}
                        </p>
                      </div>
                      {/* Score preview */}
                      {isCorrected && submission.triScore != null && (
                        <span className="text-sm font-bold tabular-nums shrink-0">{submission.triScore.toFixed(0)}</span>
                      )}
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', isExpanded && 'rotate-180')} />
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-3 animate-fade-in">
                        {/* Scores */}
                        {isCorrected ? (
                          <div className="flex gap-4 flex-wrap">
                            {submission.triScore != null && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nota TRI</p>
                                <p className="text-xl font-bold">{submission.triScore.toFixed(0)}</p>
                              </div>
                            )}
                            {submission.score != null && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pontuacao</p>
                                <p className="text-xl font-bold">{submission.score.toFixed(1)}</p>
                              </div>
                            )}
                            {submission.discursiveScore != null && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Discursiva</p>
                                <p className="text-xl font-bold">{submission.discursiveScore.toFixed(1)}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/50 px-3 py-2 rounded-lg">
                            Aguardando correcao das questoes discursivas.
                          </p>
                        )}

                        {/* Discursive corrections */}
                        {submission.corrections && submission.corrections.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground">Correcoes Discursivas</p>
                            {submission.corrections.map((c, idx) => (
                              <div key={idx} className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg text-xs">
                                <span>Questao {idx + 1}</span>
                                <span className="font-bold">
                                  {(c.score ?? 0).toFixed(1)} / {c.maxScore}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button variant="outline" size="sm" className="text-xs h-7"
                            onClick={() => handleDownloadExamPDF(submission.examId, submission.userId)}>
                            <Printer className="h-3 w-3 mr-1.5" />Prova PDF
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs h-7"
                            onClick={() => handleDownloadAnswersPDF(submission)}>
                            <ClipboardList className="h-3 w-3 mr-1.5" />Respostas PDF
                          </Button>
                          {finished && (
                            <>
                              <Button size="sm" className="text-xs h-7"
                                onClick={() => handleDownloadReport(submission)}>
                                <FileText className="h-3 w-3 mr-1.5" />Relatorio
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs h-7"
                                onClick={() => handleDownloadAnswerSheet(submission.examId)}>
                                <Download className="h-3 w-3 mr-1.5" />Gabarito
                              </Button>
                            </>
                          )}
                        </div>
                        {!finished && (
                          <p className="text-[11px] text-orange-600 dark:text-orange-400">
                            Prova em andamento. Gabarito e relatorio liberados apos o termino.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ====== SECTION 7: Account Actions ====== */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Conta</h2>
          <div className="flex flex-wrap gap-2">
            {userRole !== 'admin' && (accountType === 'premium' || accountType === 'trial') && (
              <Button variant="outline" size="sm" className="text-xs h-8 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => setCancelDialogOpen(true)}>
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Cancelar Assinatura
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-xs h-8"
              onClick={() => router.push('/banco-questoes')}>
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Banco de Questoes
            </Button>
          </div>
        </section>

        {/* ====== DIALOGS ====== */}
        <ToastAlert open={toastOpen} onOpenChange={setToastOpen} message={toastMessage} type="success" />

        {/* Upgrade Dialog */}
        <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-3">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-center text-xl">Upgrade para Premium</DialogTitle>
              <DialogDescription className="text-center text-sm">
                Entre em contato para ter acesso a recursos premium ilimitados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="text-sm font-semibold">(21) 99777-0936</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Mail className="h-4 w-4 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="text-sm font-semibold">throdrigf@gmail.com</p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button
                onClick={() => {
                  const msg = encodeURIComponent(`Ola, eu sou ${userName} e quero fazer o upgrade do meu plano no DomineAqui!`)
                  window.open(`https://wa.me/5521997770936?text=${msg}`, '_blank')
                }}
                className="bg-green-600 hover:bg-green-700 text-white w-full"
              >
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={() => setUpgradeDialogOpen(false)} variant="outline" className="w-full">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activate Serial Key Dialog */}
        <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mb-3">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-center text-xl">Ativar Premium</DialogTitle>
              <DialogDescription className="text-center text-sm">
                Insira sua serial key para ativar o acesso premium
              </DialogDescription>
            </DialogHeader>
            <div className="py-3">
              <label className="text-xs font-medium text-muted-foreground">Serial Key</label>
              <input
                type="text"
                placeholder="Cole sua serial key aqui"
                value={serialKey}
                onChange={(e) => setSerialKey(e.target.value)}
                disabled={activating}
                className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button onClick={handleActivateKey} disabled={activating || !serialKey.trim()} className="w-full">
                {activating ? 'Ativando...' : 'Ativar'}
              </Button>
              <Button onClick={() => setActivateDialogOpen(false)} variant="outline" className="w-full">Cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activation Success */}
        {activationDetails && (
          <ActivationSuccessDialog
            open={activationSuccessOpen}
            onOpenChange={setActivationSuccessOpen}
            keyType={activationDetails.keyType}
            trialExpiresAt={activationDetails.trialExpiresAt}
            customDuration={activationDetails.customDuration}
          />
        )}

        {/* Cancel Subscription Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center mb-3">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-center text-xl">Cancelar Assinatura?</DialogTitle>
              <DialogDescription className="text-center text-sm">
                Tem certeza que deseja cancelar sua assinatura {accountType === 'premium' ? 'Premium' : 'Trial'}?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 px-3 py-2 rounded-lg">
                Ao cancelar, voce perdera acesso imediato a todos os recursos premium.
              </p>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Fale comigo antes</p>
                  <p className="text-sm font-semibold">(21) 99777-0936</p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button variant="outline" onClick={() => { setCancelDialogOpen(false); router.push('/tickets') }} className="w-full">
                <Ticket className="h-4 w-4 mr-2" />Abrir Ticket
              </Button>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="w-full">Manter Assinatura</Button>
              <Button variant="destructive" onClick={handleCancelSubscription} disabled={cancelling} className="w-full">
                {cancelling ? 'Cancelando...' : 'Sim, Cancelar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
