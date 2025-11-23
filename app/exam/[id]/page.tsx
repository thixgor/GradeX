'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Countdown } from '@/components/countdown'
import { Toast } from '@/components/toast'
import { SignaturePad } from '@/components/signature-pad'
import { ExamTimer } from '@/components/exam-timer'
import { Barcode } from '@/components/barcode'
import { Exam, UserAnswer } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { downloadUserReportPDF } from '@/lib/user-report-generator'
import { ArrowLeft, Check, X, Send, FileDown, Clock, User, CheckCircle2 } from 'lucide-react'

export default function ExamPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)
  const [inWaitingRoom, setInWaitingRoom] = useState(false)
  const [canStart, setCanStart] = useState(false)

  const [userName, setUserName] = useState('')
  const [loggedUserName, setLoggedUserName] = useState('')
  const [themeTranscription, setThemeTranscription] = useState('')
  const [signature, setSignature] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submissionScore, setSubmissionScore] = useState<string>('')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [existingSubmissionId, setExistingSubmissionId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    checkExistingSubmission()
    loadExam()
    loadUserInfo()
  }, [id])

  useEffect(() => {
    if (!exam) return

    const checkExamStatus = () => {
      const now = new Date()
      const startTime = new Date(exam.startTime)
      const endTime = new Date(exam.endTime)

      // Verifica se a prova já terminou
      if (now > endTime) {
        router.push(`/exam/${id}/results`)
        return
      }

      // Verifica se a prova já começou
      if (now >= startTime) {
        setCanStart(true)
      } else {
        setCanStart(false)
      }
    }

    checkExamStatus()
    const interval = setInterval(checkExamStatus, 1000)

    return () => clearInterval(interval)
  }, [exam, id, router])

  async function checkExistingSubmission() {
    try {
      const resAuth = await fetch('/api/auth/me')
      if (!resAuth.ok) return

      const authData = await resAuth.json()
      const currentUserId = authData.user.id
      setUserId(currentUserId)

      const res = await fetch(`/api/exams/${id}/check-submission`)
      if (res.ok) {
        const data = await res.json()
        if (data.hasSubmitted) {
          setAlreadySubmitted(true)
          setExistingSubmissionId(data.submissionId)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar submissao:', error)
    }
  }

  async function loadExam() {
    try {
      const res = await fetch(`/api/exams/${id}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setExam(data.exam)

      // Inicializa respostas
      const initialAnswers: UserAnswer[] = data.exam.questions.map((q: any) => ({
        questionId: q.id,
        selectedAlternative: q.type === 'multiple-choice' ? '' : undefined,
        crossedAlternatives: q.type === 'multiple-choice' ? [] : undefined,
        discursiveText: q.type === 'discursive' ? '' : undefined,
      }))
      setAnswers(initialAnswers)
    } catch (error: any) {
      alert(error.message)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  async function loadUserInfo() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setLoggedUserName(data.user.name)
      }
    } catch (error) {
      // Silently fail - user can still enter name manually
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
          const crossed = a.crossedAlternatives?.includes(alternativeId) || false
          return {
            ...a,
            crossedAlternatives: crossed
              ? a.crossedAlternatives?.filter(id => id !== alternativeId)
              : [...(a.crossedAlternatives || []), alternativeId]
          }
        }
        return a
      })
    )
  }

  function handleDiscursiveText(questionId: string, text: string) {
    setAnswers(prev =>
      prev.map(a =>
        a.questionId === questionId
          ? { ...a, discursiveText: text }
          : a
      )
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

    // Verificar questões não respondidas (tanto múltipla escolha quanto discursivas)
    const unanswered = answers.filter((a, index) => {
      const question = exam?.questions[index]
      if (question?.type === 'multiple-choice') {
        return !a.selectedAlternative
      } else {
        return !a.discursiveText || a.discursiveText.trim() === ''
      }
    })

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
          signature,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      // Salvar score para mostrar depois
      if (exam?.scoringMethod === 'normal') {
        setSubmissionScore(`${data.score} pontos`)
      } else {
        setSubmissionScore(data.message || 'Prova submetida com sucesso!')
      }

      // Marcar como submetido ao invés de redirecionar
      setSubmitted(true)
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

  // Tela de conclusão após submissão
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-3xl text-green-600 dark:text-green-400">
              Prova Concluída!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {submissionScore}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Parabéns, {userName}!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sua prova foi submetida com sucesso. Você pode baixar um relatório com suas respostas para conferir quando o gabarito for divulgado.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  downloadUserReportPDF({
                    exam,
                    examId: id,
                    userName,
                    signature,
                    answers,
                  })
                }}
              >
                <FileDown className="h-5 w-5 mr-2" />
                Baixar Relatório da Minha Prova
              </Button>

              {exam.pdfUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(exam.pdfUrl, '_blank')}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Baixar PDF Original da Prova
                </Button>
              )}

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push('/')}
              >
                Voltar para Página Inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!started && !inWaitingRoom) {
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

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="userName">Nome Completo *</Label>
                  {loggedUserName && !userName && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUserName(loggedUserName)}
                      className="h-auto py-1"
                    >
                      <User className="h-3 w-3 mr-1" />
                      Usar meu nome
                    </Button>
                  )}
                </div>
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
              onClick={() => {
                if (canStart) {
                  setStarted(true)
                } else {
                  setInWaitingRoom(true)
                }
              }}
              disabled={!userName.trim() || (exam.themePhrase && !themeTranscription.trim())}
            >
              {canStart ? 'Iniciar Prova' : 'Entrar na Sala'}
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

  // Sala de espera
  if (!started && inWaitingRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">{exam.title}</CardTitle>
            <CardDescription className="text-lg">
              Sala de Espera
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center py-4">
              <Clock className="h-16 w-16 text-primary animate-pulse" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Bem-vindo(a), {userName}!</h3>
              <p className="text-muted-foreground">
                Você está na sala de espera. A prova iniciará em:
              </p>
            </div>

            <div className="py-6">
              <Countdown
                targetDate={new Date(exam.startTime)}
                onComplete={() => {
                  setCanStart(true)
                  setTimeout(() => {
                    setShowToast(true)
                  }, 100)
                }}
              />
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Horário de início:</span>
                <span className="font-semibold">{formatDate(exam.startTime)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Horário de término:</span>
                <span className="font-semibold">{formatDate(exam.endTime)}</span>
              </div>
            </div>

            {/* Campo de Assinatura */}
            <SignaturePad
              onSignatureChange={setSignature}
              label="Assinatura Digital *"
            />

            {/* PDF só aparece quando a prova começar */}
            {exam.pdfUrl && canStart && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(exam.pdfUrl, '_blank')}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Baixar PDF da Prova
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="lg"
                onClick={() => setStarted(true)}
                disabled={!canStart || !signature}
              >
                {!signature ? 'Assine antes de iniciar' : canStart ? 'Iniciar Prova Agora' : 'Aguardando Início...'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setInWaitingRoom(false)
                  router.push('/')
                }}
              >
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Toast de notificação quando a prova começar */}
        {showToast && (
          <Toast
            message="Você já pode iniciar a prova clicando no botão abaixo."
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    )
  }

  const currentQuestion = exam.questions[currentQuestionIndex]
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Modal - Prova já realizada */}
      {alreadySubmitted && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <CardTitle className="text-2xl">Prova Já Realizada!</CardTitle>
                <CardDescription className="mt-2">
                  Você já realizou esta prova. Não é possível refazê-la.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-center text-muted-foreground">
                  Você pode visualizar seu relatório ou baixar o gabarito da prova
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push(`/exam/${id}/user/${userId}`)}
                  className="w-full"
                  size="lg"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Ver Meu Relatório
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/exams/${id}`)
                      if (!res.ok) throw new Error('Erro ao buscar prova')
                      const data = await res.json()
                      const { generateGabaritoPDF, downloadPDF } = await import('@/lib/pdf-generator')
                      const blob = generateGabaritoPDF(data.exam)
                      downloadPDF(blob, `Gabarito-${data.exam.title}.pdf`)
                    } catch (error: any) {
                      alert('Erro ao gerar gabarito: ' + error.message)
                    }
                  }}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Baixar Gabarito (PDF)
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="ghost"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">
              Questão {currentQuestionIndex + 1} de {exam.questions.length}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExamTimer
              endTime={exam.endTime}
              onTimeUp={() => {
                alert('O tempo da prova acabou!')
                router.push('/')
              }}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Questão {currentQuestion.number}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Barcode do Usuário */}
            <div className="border-b pb-4">
              <Barcode
                value={`${id}-${userName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`}
                height={50}
                fontSize={12}
              />
              <p className="text-xs text-center text-muted-foreground mt-2">
                Código Individual: Prova {id.substring(0, 8)} - {userName}
              </p>
            </div>

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

            {/* Alternativas (Múltipla Escolha) */}
            {currentQuestion.type === 'multiple-choice' && (
              <div className="space-y-3">
                {currentQuestion.alternatives.map((alt) => {
                  const isSelected = currentAnswer?.selectedAlternative === alt.id
                  const isCrossed = currentAnswer?.crossedAlternatives?.includes(alt.id) || false

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
            )}

            {/* Resposta Discursiva */}
            {currentQuestion.type === 'discursive' && (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Questão Discursiva:</strong> Escreva sua resposta completa no campo abaixo.
                    {currentQuestion.maxScore && (
                      <span className="ml-2">Pontuação máxima: {currentQuestion.maxScore} pontos</span>
                    )}
                  </p>
                </div>
                <Textarea
                  value={currentAnswer?.discursiveText || ''}
                  onChange={(e) => handleDiscursiveText(currentQuestion.id, e.target.value)}
                  placeholder="Digite sua resposta aqui..."
                  rows={12}
                  className="font-serif text-base"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Caracteres: {(currentAnswer?.discursiveText || '').length}</span>
                  <span>Palavras: {(currentAnswer?.discursiveText || '').split(/\s+/).filter(w => w.length > 0).length}</span>
                </div>
              </div>
            )}

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
                  {answers.filter((a, index) => {
                    const question = exam.questions[index]
                    if (question.type === 'multiple-choice') {
                      return !!a.selectedAlternative
                    } else {
                      return !!a.discursiveText && a.discursiveText.trim().length > 0
                    }
                  }).length}/{exam.questions.length}{' '}
                  respondidas
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${(answers.filter((a, index) => {
                      const question = exam.questions[index]
                      if (question.type === 'multiple-choice') {
                        return !!a.selectedAlternative
                      } else {
                        return !!a.discursiveText && a.discursiveText.trim().length > 0
                      }
                    }).length / exam.questions.length) * 100}%`
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
