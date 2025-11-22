'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Barcode } from '@/components/barcode'
import { Exam, ExamSubmission } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, User, CheckCircle, XCircle, Download } from 'lucide-react'
import { downloadUserReportPDF } from '@/lib/user-report-generator'

export default function UserSubmissionPage({ params }: { params: { examId: string; userId: string } }) {
  const { examId, userId } = params
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [submission, setSubmission] = useState<ExamSubmission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [examId, userId])

  async function loadData() {
    try {
      // Carrega a prova
      const examRes = await fetch(`/api/exams/${examId}`)
      const examData = await examRes.json()
      if (!examRes.ok) throw new Error(examData.error)
      setExam(examData.exam)

      // Carrega a submissão do usuário
      const subRes = await fetch(`/api/exams/${examId}/submissions/${userId}`)
      const subData = await subRes.json()
      if (!subRes.ok) throw new Error(subData.error)
      setSubmission(subData.submission)
    } catch (error: any) {
      alert(error.message)
      router.push(`/exam/${examId}/results`)
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

  // Calcular estatísticas
  const totalQuestions = exam.questions.length
  const answeredQuestions = submission.answers.filter(a => a.selectedAlternative).length
  const correctAnswers = submission.answers.filter(a => {
    const question = exam.questions.find(q => q.id === a.questionId)
    if (!question) return false
    const correctAlt = question.alternatives.find(alt => alt.isCorrect)
    return correctAlt && a.selectedAlternative === correctAlt.id
  }).length

  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/exam/${examId}/results`)}>
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
                  value={`${examId}-${submission.userName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`}
                  height={60}
                  fontSize={14}
                />
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Pontuação</p>
                  <p className="text-2xl font-bold text-primary">
                    {exam.scoringMethod === 'tri'
                      ? submission.triScore || 'Calculando...'
                      : submission.score?.toFixed(2) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {exam.scoringMethod === 'tri' ? '/ 1000' : `/ ${exam.totalPoints}`}
                  </p>
                </div>

                <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Acertos</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {correctAnswers}
                  </p>
                  <p className="text-xs text-muted-foreground">de {totalQuestions}</p>
                </div>

                <div className="bg-red-100 dark:bg-red-900 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Erros</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {totalQuestions - correctAnswers}
                  </p>
                  <p className="text-xs text-muted-foreground">de {totalQuestions}</p>
                </div>

                <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Aproveitamento</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {accuracy.toFixed(1)}%
                  </p>
                </div>
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
                    examId,
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
                Gabarito completo com respostas do usuário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {exam.questions.map((question) => {
                  const userAnswer = submission.answers.find(a => a.questionId === question.id)
                  const selectedAlt = question.alternatives.find(alt => alt.id === userAnswer?.selectedAlternative)
                  const correctAlt = question.alternatives.find(alt => alt.isCorrect)
                  const isCorrect = selectedAlt?.id === correctAlt?.id

                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold">Questão {question.number}</h3>
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
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{question.statement}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted p-3 rounded">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Resposta do Usuário:</p>
                          <p className={`text-sm font-semibold ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {selectedAlt ? `${selectedAlt.letter}) ${selectedAlt.text}` : 'Não respondida'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Gabarito:</p>
                          <p className="text-sm font-semibold text-primary">
                            {correctAlt ? `${correctAlt.letter}) ${correctAlt.text}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
