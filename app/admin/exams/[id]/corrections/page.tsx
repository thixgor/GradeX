'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Bot, CheckCircle, Clock, Send, Sparkles } from 'lucide-react'

interface ExamData {
  _id: string
  title: string
  questions: any[]
}

interface Submission {
  _id: string
  userId: string
  userName: string
  answers: any[]
  corrections?: any[]
  correctionStatus?: string
  submittedAt: Date
}

export default function AdminCorrectionsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [exam, setExam] = useState<ExamData | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null)
  const [correcting, setCorrecting] = useState(false)
  const [bulkCorrecting, setBulkCorrecting] = useState(false)

  // Estados para correção manual
  const [manualScore, setManualScore] = useState('')
  const [manualFeedback, setManualFeedback] = useState('')

  // Estado para rigor da IA
  const [aiRigor, setAiRigor] = useState(0.45)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      // Carregar prova
      const examRes = await fetch(`/api/exams/${id}`)
      const examData = await examRes.json()
      if (!examRes.ok) throw new Error(examData.error)

      // Verificar se tem questões discursivas
      const hasDiscursive = examData.exam.questions.some((q: any) => q.type === 'discursive')
      if (!hasDiscursive) {
        alert('Esta prova não possui questões discursivas')
        router.push('/admin/exams')
        return
      }

      setExam(examData.exam)

      // Carregar submissões
      const subsRes = await fetch(`/api/exams/${id}/submissions`)
      const subsData = await subsRes.json()
      if (!subsRes.ok) throw new Error(subsData.error)

      setSubmissions(subsData.submissions || [])
    } catch (error: any) {
      alert(error.message)
      router.push('/admin/exams')
    } finally {
      setLoading(false)
    }
  }

  async function handleManualCorrection() {
    if (!selectedSubmission || !selectedQuestion) return

    const score = parseFloat(manualScore)
    if (isNaN(score) || score < 0 || score > selectedQuestion.maxScore) {
      alert(`Nota deve ser entre 0 e ${selectedQuestion.maxScore}`)
      return
    }

    if (!manualFeedback.trim()) {
      alert('Forneça um feedback para o aluno')
      return
    }

    setCorrecting(true)

    try {
      const res = await fetch(
        `/api/exams/${id}/submissions/${selectedSubmission.userId}/correct`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'manual',
            questionId: selectedQuestion.id,
            score,
            feedback: manualFeedback,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      alert('Correção salva com sucesso!')
      setManualScore('')
      setManualFeedback('')
      await loadData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setCorrecting(false)
    }
  }

  async function handleAICorrection(questionId: string) {
    if (!selectedSubmission) return

    setCorrecting(true)

    try {
      const res = await fetch(
        `/api/exams/${id}/submissions/${selectedSubmission.userId}/correct`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'ai',
            questionId,
            rigor: aiRigor,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      alert('Correção automática concluída!')
      await loadData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setCorrecting(false)
    }
  }

  async function handleBulkAICorrection(userId: string) {
    if (!confirm('Deseja corrigir TODAS as questões discursivas desta submissão usando IA?')) {
      return
    }

    setBulkCorrecting(true)

    try {
      const res = await fetch(`/api/exams/${id}/submissions/${userId}/correct`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rigor: aiRigor,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      alert(
        `Correção automática concluída!\nQuestões corrigidas: ${data.corrected}/${data.total}${
          data.errors ? `\n\nErros:\n${data.errors.join('\n')}` : ''
        }`
      )
      await loadData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setBulkCorrecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!exam) return null

  const discursiveQuestions = exam.questions.filter((q: any) => q.type === 'discursive')
  const pendingSubmissions = submissions.filter(
    (s) => s.correctionStatus === 'pending' || !s.correctionStatus
  )
  const correctedSubmissions = submissions.filter((s) => s.correctionStatus === 'corrected')

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/exams')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Correção de Questões Discursivas</h1>
              <p className="text-sm text-muted-foreground">{exam.title}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Submissões */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submissões Pendentes ({pendingSubmissions.length})</CardTitle>
                <CardDescription>Clique para corrigir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma submissão pendente
                  </p>
                ) : (
                  pendingSubmissions.map((sub) => (
                    <Button
                      key={sub._id}
                      variant={selectedSubmission?._id === sub._id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedSubmission(sub)
                        setSelectedQuestion(null)
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {sub.userName}
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Corrigidas ({correctedSubmissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {correctedSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma submissão corrigida
                  </p>
                ) : (
                  correctedSubmissions.map((sub) => (
                    <Button
                      key={sub._id}
                      variant={selectedSubmission?._id === sub._id ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedSubmission(sub)
                        setSelectedQuestion(null)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {sub.userName}
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Configuração de Rigor da IA */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Bot className="h-4 w-4 mr-2" />
                  Rigor da IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Nível: {(aiRigor * 100).toFixed(0)}%</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={aiRigor}
                    onChange={(e) => setAiRigor(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Leniente</span>
                    <span>Moderado</span>
                    <span>Rigoroso</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área de Correção */}
          <div className="lg:col-span-2">
            {!selectedSubmission ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Selecione uma submissão para começar a correção
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Correção: {selectedSubmission.userName}</CardTitle>
                        <CardDescription>
                          Status: {selectedSubmission.correctionStatus === 'corrected' ? 'Corrigida' : 'Pendente'}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => handleBulkAICorrection(selectedSubmission.userId)}
                        disabled={bulkCorrecting || selectedSubmission.correctionStatus === 'corrected'}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {bulkCorrecting ? 'Corrigindo...' : 'Corrigir Tudo com IA'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {discursiveQuestions.map((question: any) => {
                      const answer = selectedSubmission.answers.find(
                        (a: any) => a.questionId === question.id
                      )
                      const correction = selectedSubmission.corrections?.find(
                        (c: any) => c.questionId === question.id
                      )

                      return (
                        <Card key={question.id} className="border-2">
                          <CardHeader>
                            <CardTitle className="text-base">Questão {question.number}</CardTitle>
                            <p className="text-sm">{question.statement}</p>
                            <p className="text-sm font-semibold">{question.command}</p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label className="text-sm font-semibold">Resposta do Aluno:</Label>
                              <div className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                                {answer?.discursiveText || '(Sem resposta)'}
                              </div>
                            </div>

                            {correction ? (
                              <div className="border-t pt-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-semibold text-green-600">
                                    ✓ Corrigida
                                  </Label>
                                  <span className="text-sm">
                                    {correction.method === 'ai' ? '🤖 IA' : '👤 Manual'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <strong>Nota:</strong> {correction.score}/{correction.maxScore}
                                  </div>
                                  <div>
                                    <strong>Data:</strong>{' '}
                                    {new Date(correction.correctedAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <strong className="text-sm">Feedback:</strong>
                                  <p className="text-sm mt-1">{correction.feedback}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="border-t pt-4 space-y-3">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedQuestion(question)
                                      setManualScore('')
                                      setManualFeedback('')
                                    }}
                                  >
                                    Corrigir Manualmente
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAICorrection(question.id)}
                                    disabled={correcting}
                                  >
                                    <Bot className="h-4 w-4 mr-1" />
                                    {correcting ? 'Corrigindo...' : 'Corrigir com IA'}
                                  </Button>
                                </div>

                                {selectedQuestion?.id === question.id && (
                                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                    <h4 className="font-semibold text-sm">Correção Manual</h4>
                                    <div className="space-y-2">
                                      <Label htmlFor={`score-${question.id}`}>
                                        Nota (0 a {question.maxScore})
                                      </Label>
                                      <Input
                                        id={`score-${question.id}`}
                                        type="number"
                                        min="0"
                                        max={question.maxScore}
                                        step="0.5"
                                        value={manualScore}
                                        onChange={(e) => setManualScore(e.target.value)}
                                        placeholder="Ex: 7.5"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`feedback-${question.id}`}>
                                        Feedback para o Aluno
                                      </Label>
                                      <Textarea
                                        id={`feedback-${question.id}`}
                                        value={manualFeedback}
                                        onChange={(e) => setManualFeedback(e.target.value)}
                                        placeholder="Forneça um feedback construtivo..."
                                        rows={4}
                                      />
                                    </div>
                                    <Button
                                      onClick={handleManualCorrection}
                                      disabled={correcting}
                                      className="w-full"
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      {correcting ? 'Salvando...' : 'Salvar Correção'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
