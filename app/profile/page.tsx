'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { ArrowLeft, CheckCircle, Clock, FileText, Download, Printer, ClipboardList } from 'lucide-react'
import { generateGabaritoPDF, downloadPDF, generateExamPDF, generateStudentAnswersPDF } from '@/lib/pdf-generator'

interface UserSubmission {
  _id: string
  examId: string
  examName: string
  examTitle: string
  userId: string
  userName: string
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

export default function ProfilePage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<UserSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    loadSubmissions()
    loadUserName()
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

  async function loadUserName() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserName(data.user?.name || 'Usuario')
      }
    } catch (error) {
      console.error('Erro ao carregar nome:', error)
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Meu Perfil</h1>
              <p className="text-sm text-muted-foreground">{userName}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
                        Realizada em {new Date(submission.submittedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
        type="error"
      />
    </div>
  )
}
