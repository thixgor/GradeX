'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { Barcode } from '@/components/barcode'
import { Exam, ExamSubmission } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, User, CheckCircle, XCircle, Download, Clock } from 'lucide-react'
import { downloadUserReportPDF } from '@/lib/user-report-generator'

export default function UserSubmissionPage({ params }: { params: { id: string; userId: string } }) {
  const { id, userId } = params
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [submission, setSubmission] = useState<ExamSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExamFinished, setIsExamFinished] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [id, userId])

  async function loadData() {
    try {
      // Carrega a prova
      const examRes = await fetch(`/api/exams/${id}`)
      const examData = await examRes.json()
      if (!examRes.ok) throw new Error(examData.error)
      setExam(examData.exam)

      // Verifica se a prova terminou
      const now = new Date()
      const endTime = new Date(examData.exam.endTime)
      const finished = now > endTime
      setIsExamFinished(finished)

      console.log('🔍 Verificando prova na página de relatório:', {
        title: examData.exam.title,
        now: now.toISOString(),
        endTime: endTime.toISOString(),
        finished
      })

      // Carrega a submissão do usuário
      const subRes = await fetch(`/api/exams/${id}/submissions/${userId}`)
      const subData = await subRes.json()
      if (!subRes.ok) throw new Error(subData.error)
      setSubmission(subData.submission)
    } catch (error: any) {
      setToastMessage(error.message)
      setToastOpen(true)
      setTimeout(() => router.push(`/exam/${id}/results`), 2000)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando relatório...</div>
      </div>
    )
  }

  if (!exam || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Dados não encontrados</div>
      </div>
    )
  }

  // Calcular estatísticas (apenas para questões de múltipla escolha)
  const multipleChoiceQuestions = exam.questions.filter(q => q.type === 'multiple-choice')
  const discursiveQuestions = exam.questions.filter(q => q.type === 'discursive')
  const totalQuestions = exam.questions.length

  const correctAnswers = submission.answers.filter(a => {
    const question = exam.questions.find(q => q.id === a.questionId)
    if (!question || question.type !== 'multiple-choice') return false
    const correctAlt = question.alternatives.find(alt => alt.isCorrect)
    return correctAlt && a.selectedAlternative === correctAlt.id
  }).length

  const accuracy = multipleChoiceQuestions.length > 0
    ? (correctAnswers / multipleChoiceQuestions.length) * 100
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/exam/${id}/results`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Relatório do Usuário</h1>
              <p className="text-sm text-muted-foreground">{exam.title}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Informações do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {submission.userName}
              </CardTitle>
              <CardDescription>
                Submetido em: {formatDate(submission.submittedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barcode Individual */}
              <div className="border-b pb-4">
                <Barcode
                  value={`${id}-${submission.userName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`}
                  height={60}
                  fontSize={14}
                />
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {multipleChoiceQuestions.length > 0 ? 'Múltipla Escolha' : 'Pontuação'}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {exam.scoringMethod === 'tri'
                      ? submission.triScore || 'Calculando...'
                      : submission.score?.toFixed(2) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {exam.scoringMethod === 'tri' ? '/ 1000' : `/ ${exam.totalPoints}`}
                  </p>
                </div>

                {discursiveQuestions.length > 0 && (
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Discursivas</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {submission.correctionStatus === 'corrected'
                        ? submission.discursiveScore?.toFixed(2) || 0
                        : 'Pendente'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {submission.correctionStatus === 'corrected'
                        ? `/ ${discursiveQuestions.reduce((sum, q) => sum + (q.maxScore || 10), 0)}`
                        : 'Aguardando correção'}
                    </p>
                  </div>
                )}

                {multipleChoiceQuestions.length > 0 && (
                  <>
                    <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Acertos</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {correctAnswers}
                      </p>
                      <p className="text-xs text-muted-foreground">de {multipleChoiceQuestions.length}</p>
                    </div>

                    <div className="bg-red-100 dark:bg-red-900 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Erros</p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {multipleChoiceQuestions.length - correctAnswers}
                      </p>
                      <p className="text-xs text-muted-foreground">de {multipleChoiceQuestions.length}</p>
                    </div>

                    <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Aproveitamento</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {accuracy.toFixed(1)}%
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Assinatura */}
              {submission.signature && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Assinatura Digital:</p>
                  <img src={submission.signature} alt="Assinatura" className="border rounded-lg p-2 bg-white dark:bg-gray-900 max-w-xs" />
                </div>
              )}

              {/* Botão Download PDF */}
              <Button
                className="w-full"
                onClick={() => {
                  downloadUserReportPDF({
                    exam,
                    examId: id,
                    userName: submission.userName,
                    signature: submission.signature || '',
                    answers: submission.answers,
                  })
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Relatório em PDF
              </Button>
            </CardContent>
          </Card>

          {/* Respostas Detalhadas */}
          <Card>
            <CardHeader>
              <CardTitle>Respostas Detalhadas</CardTitle>
              <CardDescription>
                {isExamFinished
                  ? 'Gabarito completo com respostas do usuário'
                  : 'Suas respostas (gabarito liberado após término da prova)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isExamFinished && (
                <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-800 dark:text-orange-200 text-center">
                    <Clock className="h-4 w-4 inline mr-2" />
                    A prova ainda está em andamento. O gabarito será liberado após o término.
                  </p>
                </div>
              )}
              <div className="space-y-6">
                {exam.questions.map((question) => {
                  const userAnswer = submission.answers.find(a => a.questionId === question.id)

                  if (question.type === 'multiple-choice') {
                    const selectedAlt = question.alternatives.find(alt => alt.id === userAnswer?.selectedAlternative)
                    const correctAlt = question.alternatives.find(alt => alt.isCorrect)
                    const isCorrect = selectedAlt?.id === correctAlt?.id

                    return (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold">Questão {question.number} (Múltipla Escolha)</h3>
                          {isExamFinished && (
                            <>
                              {isCorrect ? (
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <CheckCircle className="h-5 w-5" />
                                  <span className="text-sm font-medium">Correta</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                  <XCircle className="h-5 w-5" />
                                  <span className="text-sm font-medium">Incorreta</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{question.statement}</p>

                        <div className={`grid grid-cols-1 ${isExamFinished ? 'md:grid-cols-2' : ''} gap-3 bg-muted p-3 rounded`}>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Resposta do Usuário:</p>
                            <p className={`text-sm font-semibold ${isExamFinished ? (isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : ''}`}>
                              {selectedAlt ? `${selectedAlt.letter}) ${selectedAlt.text}` : 'Não respondida'}
                            </p>
                          </div>
                          {isExamFinished && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Gabarito:</p>
                              <p className="text-sm font-semibold text-primary">
                                {correctAlt ? `${correctAlt.letter}) ${correctAlt.text}` : 'N/A'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  } else {
                    // Questão discursiva
                    const correction = submission.corrections?.find(c => c.questionId === question.id)

                    return (
                      <div key={question.id} className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold">Questão {question.number} (Discursiva)</h3>
                          {correction ? (
                            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                              <CheckCircle className="h-5 w-5" />
                              <span className="text-sm font-medium">Corrigida</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                              <Clock className="h-5 w-5" />
                              <span className="text-sm font-medium">Aguardando Correção</span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{question.statement}</p>
                        <p className="text-sm font-medium mb-3">{question.command}</p>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Sua Resposta:</p>
                            <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                              {userAnswer?.discursiveText || 'Não respondida'}
                            </div>
                          </div>

                          {correction && (
                            <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 p-4 rounded space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                                  Correção
                                </h4>
                                <span className="text-sm text-purple-700 dark:text-purple-300">
                                  {correction.method === 'ai' ? '🤖 Correção Automática' : '👤 Correção Manual'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <strong className="text-purple-900 dark:text-purple-100">Nota:</strong>
                                  <span className="ml-2 text-2xl font-bold text-purple-700 dark:text-purple-300">
                                    {correction.score}/{correction.maxScore}
                                  </span>
                                </div>
                                <div>
                                  <strong className="text-purple-900 dark:text-purple-100">Data:</strong>
                                  <span className="ml-2">
                                    {new Date(correction.correctedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <strong className="text-sm text-purple-900 dark:text-purple-100">Feedback:</strong>
                                <p className="text-sm mt-1 text-purple-800 dark:text-purple-200">
                                  {correction.feedback}
                                </p>
                              </div>

                              {correction.keyPointsFound && correction.keyPointsFound.length > 0 && (
                                <div>
                                  <strong className="text-sm text-purple-900 dark:text-purple-100">
                                    Pontos-Chave Identificados:
                                  </strong>
                                  <ul className="mt-1 space-y-1">
                                    {correction.keyPointsFound.map((kpId) => {
                                      const keyPoint = question.keyPoints?.find(kp => kp.id === kpId)
                                      return keyPoint ? (
                                        <li key={kpId} className="text-sm flex items-start gap-2">
                                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                          <span>{keyPoint.description}</span>
                                        </li>
                                      ) : null
                                    })}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            </CardContent>
          </Card>
        </div>
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
