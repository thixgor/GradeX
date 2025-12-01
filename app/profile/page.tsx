'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { ArrowLeft, CheckCircle, Clock, FileText, Download, Printer, ClipboardList, Trophy, BookOpen, Crown, Timer, Sparkles, Phone, Mail, XCircle, Ticket, AlertTriangle } from 'lucide-react'
import { generateGabaritoPDF, downloadPDF, generateExamPDF, generateStudentAnswersPDF } from '@/lib/pdf-generator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccountType } from '@/lib/types'
import { ActivationSuccessDialog } from '@/components/activation-success-dialog'

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
  examEndTime?: Date
  answers?: any[]
  exam?: any
}

// Função auxiliar para calcular duração
function calculateDuration(startTime: Date, endTime: Date): string {
  const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMins / 60)
  const minutes = diffMins % 60

  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }
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
      // Verificar expiração de plano primeiro
      await fetch('/api/user/check-plan-expiration')

      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserName(data.user?.name || 'Usuario')
        setUserRole(data.user?.role || 'user')
        setAccountType(data.user?.accountType || 'gratuito')
        if (data.user?.trialExpiresAt) {
          setTrialExpiresAt(new Date(data.user.trialExpiresAt))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    }
  }

  async function loadStatistics() {
    try {
      const res = await fetch('/api/user/statistics')
      if (res.ok) {
        const data = await res.json()
        setQuestionsAnswered(data.questionsAnswered || 0)
        setExamsCompleted(data.examsCompleted || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  async function handleActivateKey() {
    if (!serialKey.trim()) {
      setToastMessage('Digite uma serial key válida')
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

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao ativar serial key')
      }

      // Armazenar detalhes da ativação para o popup
      setActivationDetails(data)
      setActivateDialogOpen(false)
      setSerialKey('')
      setActivationSuccessOpen(true)

      // Recarregar dados do usuário
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
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cancelar assinatura')
      }

      setToastMessage(data.message)
      setToastOpen(true)
      setCancelDialogOpen(false)

      // Recarregar dados do usuário
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

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}min`
    } else if (hours > 0) {
      return `${hours}h ${minutes}min`
    } else {
      return `${minutes}min`
    }
  }

  function getAccountTypeBadge() {
    if (userRole === 'admin') {
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <Crown className="h-4 w-4 mr-1.5" />
          Admin
        </div>
      )
    }

    switch (accountType) {
      case 'premium':
        return (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <Crown className="h-4 w-4 mr-1.5" />
            Premium
          </div>
        )
      case 'trial':
        return (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <Timer className="h-4 w-4 mr-1.5" />
            Trial - {getTrialTimeRemaining()}
          </div>
        )
      default:
        return (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-500 text-white">
            Gratuito
          </div>
        )
    }
  }

  async function handleDownloadReport(submission: UserSubmission) {
    try {
      router.push(`/exam/${submission.examId}/user/${submission.userId}`)
    } catch (error) {
      console.error('Erro ao abrir relatorio:', error)
    }
  }

  async function handleDownloadAnswerSheet(examId: string) {
    try {
      // Buscar detalhes da prova
      const res = await fetch(`/api/exams/${examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')

      const data = await res.json()
      const exam = data.exam

      // Gerar PDF do gabarito
      const blob = generateGabaritoPDF(exam)
      downloadPDF(blob, `Gabarito-${exam.title}.pdf`)
    } catch (error: any) {
      console.error('Erro ao baixar gabarito:', error)
      setToastMessage('Erro ao gerar gabarito: ' + error.message)
      setToastOpen(true)
    }
  }

  async function handleDownloadExamPDF(examId: string, userId: string) {
    try {
      const res = await fetch(`/api/exams/${examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')

      const data = await res.json()
      const exam = data.exam

      const blob = generateExamPDF(exam, userId)
      downloadPDF(blob, `Prova-${exam.title}.pdf`)
    } catch (error: any) {
      console.error('Erro ao baixar prova:', error)
      setToastMessage('Erro ao gerar PDF da prova: ' + error.message)
      setToastOpen(true)
    }
  }

  async function handleDownloadAnswersPDF(submission: UserSubmission) {
    try {
      const res = await fetch(`/api/exams/${submission.examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')

      const examData = await res.json()
      const exam = examData.exam

      const submissionRes = await fetch(`/api/submissions/${submission._id}`)
      if (!submissionRes.ok) throw new Error('Erro ao buscar submissão')

      const submissionData = await submissionRes.json()
      const answers = submissionData.submission?.answers || []

      const blob = generateStudentAnswersPDF(exam, answers, submission.userName || userName)
      downloadPDF(blob, `Minhas-Respostas-${exam.title}.pdf`)
    } catch (error: any) {
      console.error('Erro ao baixar respostas:', error)
      setToastMessage('Erro ao gerar PDF de respostas: ' + error.message)
      setToastOpen(true)
    }
  }

  function isExamFinished(submission: UserSubmission): boolean {
    // Se não tem endTime, NÃO libera (por segurança)
    if (!submission.examEndTime) {
      console.log('⚠️ Prova sem examEndTime:', submission.examTitle)
      return false
    }

    const now = new Date()
    const endTime = new Date(submission.examEndTime)
    const finished = now > endTime

    // Debug para entender o que está acontecendo
    console.log('🔍 Verificando prova:', {
      title: submission.examTitle,
      now: now.toISOString(),
      endTime: endTime.toISOString(),
      finished
    })

    return finished
  }

  function getStatusBadge(submission: UserSubmission) {
    if (!submission.hasDiscursiveQuestions) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Corrigida
        </span>
      )
    }

    if (submission.correctionStatus === 'corrected') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Corrigida
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        Aguardando Correcao
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Verificador de Banimento */}
      <BanChecker />

      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Meu Perfil</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{userName}</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics Section */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Estatísticas do Perfil
              </span>
              {getAccountTypeBadge()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="p-3 bg-blue-500 rounded-full">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Questões Respondidas</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{questionsAnswered}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="p-3 bg-green-500 rounded-full">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Provas Realizadas</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{examsCompleted}</p>
                </div>
              </div>
            </div>

            {/* Upgrade/Activate Buttons */}
            <div className="flex flex-wrap gap-3">
              {userRole !== 'admin' && accountType === 'gratuito' && (
                <Button
                  onClick={() => setUpgradeDialogOpen(true)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Faça Upgrade Agora
                </Button>
              )}
              {userRole !== 'admin' && (
                <Button
                  onClick={() => setActivateDialogOpen(true)}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Ativar Premium
                </Button>
              )}
              {userRole !== 'admin' && (accountType === 'premium' || accountType === 'trial') && (
                <Button
                  onClick={() => setCancelDialogOpen(true)}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Assinatura
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Voce ainda nao fez nenhuma prova
              </p>
              <Button onClick={() => router.push('/')}>
                Ver Provas Disponiveis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Minhas Provas</h2>
                <p className="text-sm text-muted-foreground">
                  {submissions.length} {submissions.length === 1 ? 'prova realizada' : 'provas realizadas'}
                </p>
              </div>
            </div>

            {submissions.map((submission) => (
              <Card key={submission._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{submission.examTitle}</CardTitle>
                      <CardDescription>
                        <div>
                          Realizada em {new Date(submission.submittedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {submission.startedAt && (
                          <div className="flex items-center gap-1 text-xs mt-1">
                            <Clock className="h-3 w-3" />
                            Tempo de prova: {calculateDuration(submission.startedAt, submission.submittedAt)}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    {getStatusBadge(submission)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Pontuacao */}
                    {submission.correctionStatus === 'corrected' || !submission.hasDiscursiveQuestions ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                        {submission.triScore !== undefined && submission.triScore !== null && (
                          <div>
                            <p className="text-sm text-muted-foreground">Nota TRI</p>
                            <p className="text-2xl font-bold">{submission.triScore.toFixed(0)}</p>
                          </div>
                        )}
                        {submission.score !== undefined && submission.score !== null && (
                          <div>
                            <p className="text-sm text-muted-foreground">Pontuacao</p>
                            <p className="text-2xl font-bold">{submission.score.toFixed(1)}</p>
                          </div>
                        )}
                        {submission.discursiveScore !== undefined && submission.discursiveScore !== null && (
                          <div>
                            <p className="text-sm text-muted-foreground">Nota Discursiva</p>
                            <p className="text-2xl font-bold">{submission.discursiveScore.toFixed(1)}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <Clock className="h-4 w-4 inline mr-2" />
                          Sua prova esta aguardando correcao das questoes discursivas.
                        </p>
                      </div>
                    )}

                    {/* Correcoes discursivas */}
                    {submission.corrections && submission.corrections.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Correcoes das Questoes Discursivas:</h4>
                        {submission.corrections.map((correction, idx) => (
                          <div key={idx} className="p-3 bg-muted rounded-lg space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Questao {idx + 1}</p>
                              <p className="text-sm font-bold">
                                {correction.score !== null && correction.score !== undefined
                                  ? correction.score.toFixed(1)
                                  : '0.0'} / {correction.maxScore} pontos
                              </p>
                            </div>
                            {correction.feedback && (
                              <p className="text-sm text-muted-foreground">{correction.feedback}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Metodo: {correction.method === 'ai' ? 'IA (Gemini 2.0)' : 'Manual'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Acoes */}
                    <div className="space-y-3">
                      {/* Botões sempre disponíveis */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadExamPDF(submission.examId, submission.userId)}
                          className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Baixar PDF da Prova
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadAnswersPDF(submission)}
                          className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                        >
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Minhas Respostas (PDF)
                        </Button>
                      </div>

                      {/* Botões liberados após término da prova */}
                      {isExamFinished(submission) ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleDownloadReport(submission)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Relatorio Completo
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadAnswerSheet(submission.examId)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Gabarito
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                          <p className="text-sm text-orange-800 dark:text-orange-200">
                            <Clock className="h-4 w-4 inline mr-2" />
                            Prova ainda em andamento. O gabarito e o relatorio completo serao liberados apos o termino.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type="success"
      />

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl">Faça Upgrade para Premium</DialogTitle>
            <DialogDescription className="text-center text-base">
              Entre em contato conosco para fazer upgrade da sua conta e ter acesso a recursos premium ilimitados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Telefone/WhatsApp</p>
                <p className="text-lg font-semibold text-blue-600">(21) 99777-0936</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <Mail className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">E-mail</p>
                <p className="text-lg font-semibold text-green-600">throdrigf@gmail.com</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => {
                const encodedMessage = encodeURIComponent(`Olá, eu sou ${userName} e quero fazer o upgrade do meu plano no DomineAqui!`)
                window.open(`https://wa.me/5521997770936?text=${encodedMessage}`, '_blank')
              }}
              className="bg-green-600 hover:bg-green-700 text-white w-full"
            >
              <Phone className="h-4 w-4 mr-2" />
              Enviar Mensagem WhatsApp
            </Button>
            <Button onClick={() => setUpgradeDialogOpen(false)} variant="outline" className="w-full">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Serial Key Dialog */}
      <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl">Ativar Premium com Serial Key</DialogTitle>
            <DialogDescription className="text-center text-base">
              Insira sua serial key para ativar o acesso premium
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Serial Key</label>
              <input
                type="text"
                placeholder="Cole sua serial key aqui"
                value={serialKey}
                onChange={(e) => setSerialKey(e.target.value)}
                disabled={activating}
                className="w-full px-3 py-2 border border-muted rounded-md bg-background text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={handleActivateKey}
              disabled={activating || !serialKey.trim()}
              className="w-full"
            >
              {activating ? 'Ativando...' : 'Ativar'}
            </Button>
            <Button onClick={() => setActivateDialogOpen(false)} variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activation Success Dialog */}
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
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl">Cancelar Assinatura?</DialogTitle>
            <DialogDescription className="text-center text-base">
              Tem certeza que deseja cancelar sua assinatura {accountType === 'premium' ? 'Premium' : 'Trial'}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Atenção:</strong> Ao cancelar, você perderá acesso imediato a todos os recursos premium e sua conta será alterada para o plano Gratuito.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fale comigo antes de cancelar</p>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">(21) 99777-0936</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Posso te ajudar a resolver qualquer problema!
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Ou abra um ticket para que possamos conversar sobre como melhorar sua experiência.
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false)
                router.push('/tickets')
              }}
              className="w-full sm:w-auto"
            >
              <Ticket className="h-4 w-4 mr-2" />
              Abrir Ticket
            </Button>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Manter Assinatura
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="w-full sm:w-auto"
            >
              {cancelling ? 'Cancelando...' : 'Sim, Cancelar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
