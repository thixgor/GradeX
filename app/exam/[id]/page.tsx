'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Exam, UserAnswer } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Check, X, Send, FileDown } from 'lucide-react'

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)

  const [userName, setUserName] = useState('')
  const [themeTranscription, setThemeTranscription] = useState('')
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    loadExam()
  }, [id])

  async function loadExam() {
    try {
      const res = await fetch(`/api/exams/${id}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setExam(data.exam)

      // Inicializa respostas
      const initialAnswers: UserAnswer[] = data.exam.questions.map((q: any) => ({
        questionId: q.id,
        selectedAlternative: '',
        crossedAlternatives: [],
      }))
      setAnswers(initialAnswers)
    } catch (error: any) {
      alert(error.message)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectAlternative(questionId: string, alternativeId: string) {
    setAnswers(prev =>
      prev.map(a =>
        a.questionId === questionId
          ? { ...a, selectedAlternative: alternativeId }
          : a
      )
    )
  }

  function handleToggleCross(questionId: string, alternativeId: string) {
    setAnswers(prev =>
      prev.map(a => {
        if (a.questionId === questionId) {
          const crossed = a.crossedAlternatives.includes(alternativeId)
          return {
            ...a,
            crossedAlternatives: crossed
              ? a.crossedAlternatives.filter(id => id !== alternativeId)
              : [...a.crossedAlternatives, alternativeId]
          }
        }
        return a
      })
    )
  }

  async function handleSubmit() {
    // Validações
    if (!userName.trim()) {
      alert('Por favor, preencha seu nome completo')
      return
    }

    if (exam?.themePhrase && !themeTranscription.trim()) {
      alert('Por favor, transcreva a frase-tema')
      return
    }

    const unanswered = answers.filter(a => !a.selectedAlternative)
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `Você deixou ${unanswered.length} questão(ões) sem resposta. Deseja continuar?`
      )
      if (!confirm) return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          themeTranscription,
          answers,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      if (exam?.scoringMethod === 'normal') {
        alert(`Prova submetida com sucesso!\n\nSua nota: ${data.score}`)
      } else {
        alert(data.message)
      }

      router.push('/')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Prova não encontrada</div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-3xl">{exam.title}</CardTitle>
            {exam.description && (
              <CardDescription className="text-base">{exam.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {exam.coverImage && (
              <img
                src={exam.coverImage}
                alt={exam.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            <div className="space-y-2 text-sm">
              <p>
                <strong>Número de questões:</strong> {exam.numberOfQuestions}
              </p>
              <p>
                <strong>Pontuação:</strong>{' '}
                {exam.scoringMethod === 'tri' ? 'TRI (1000 pontos)' : `${exam.totalPoints} pontos`}
              </p>
              <p>
                <strong>Início:</strong> {formatDate(exam.startTime)}
              </p>
              <p>
                <strong>Término:</strong> {formatDate(exam.endTime)}
              </p>
            </div>

            {exam.pdfUrl && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(exam.pdfUrl, '_blank')}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Baixar PDF da Prova
              </Button>
            )}

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="userName">Nome Completo *</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Digite seu nome completo"
                />
              </div>

              {exam.themePhrase && (
                <div className="space-y-2">
                  <Label htmlFor="theme">Transcreva a frase-tema abaixo *</Label>
                  <div className="p-4 bg-muted rounded-lg mb-2">
                    <p className="text-sm font-medium italic">"{exam.themePhrase}"</p>
                  </div>
                  <Textarea
                    id="theme"
                    value={themeTranscription}
                    onChange={(e) => setThemeTranscription(e.target.value)}
                    placeholder="Transcreva a frase-tema aqui..."
                    rows={3}
                    className="font-serif text-base"
                  />
                </div>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setStarted(true)}
              disabled={!userName.trim() || (exam.themePhrase && !themeTranscription.trim())}
            >
              Iniciar Prova
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = exam.questions[currentQuestionIndex]
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">
              Questão {currentQuestionIndex + 1} de {exam.questions.length}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Questão {currentQuestion.number}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enunciado */}
            <div className="space-y-2">
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{currentQuestion.statement}</p>
              </div>
              {currentQuestion.statementSource && (
                <p className="text-xs text-muted-foreground italic">
                  Fonte: {currentQuestion.statementSource}
                </p>
              )}
            </div>

            {/* Imagem */}
            {currentQuestion.imageUrl && (
              <div className="space-y-2">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Imagem da questão"
                  className="max-w-full h-auto rounded-lg border"
                />
                {currentQuestion.imageSource && (
                  <p className="text-xs text-muted-foreground italic">
                    Fonte da imagem: {currentQuestion.imageSource}
                  </p>
                )}
              </div>
            )}

            {/* Comando */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">{currentQuestion.command}</p>
            </div>

            {/* Alternativas */}
            <div className="space-y-3">
              {currentQuestion.alternatives.map((alt) => {
                const isSelected = currentAnswer?.selectedAlternative === alt.id
                const isCrossed = currentAnswer?.crossedAlternatives.includes(alt.id) || false

                return (
                  <div
                    key={alt.id}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : isCrossed
                        ? 'border-destructive bg-destructive/5 opacity-50'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        checked={isSelected}
                        onChange={() => handleSelectAlternative(currentQuestion.id, alt.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${isCrossed ? 'line-through' : ''}`}>
                            {alt.letter})
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleCross(currentQuestion.id, alt.id)}
                          >
                            {isCrossed ? (
                              <Check className="h-4 w-4 text-destructive" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className={`mt-1 ${isCrossed ? 'line-through' : ''}`}>
                          {alt.text}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Navegação */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Anterior
              </Button>

              {currentQuestionIndex === exam.questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={submitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? 'Enviando...' : 'Finalizar Prova'}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                >
                  Próxima
                </Button>
              )}
            </div>

            {/* Indicador de progresso */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Progresso</span>
                <span>
                  {answers.filter(a => a.selectedAlternative).length}/{exam.questions.length}{' '}
                  respondidas
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${(answers.filter(a => a.selectedAlternative).length / exam.questions.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
