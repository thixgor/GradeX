'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Clock,
  ListChecks,
  Zap,
  MessageSquare,
  CheckCircle2,
  Crown,
  Info
} from 'lucide-react'
import { PageLoading } from '@/components/page-loading'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  accountType?: 'gratuito' | 'trial' | 'premium'
}

interface AccountLimits {
  dailyExams: number
  aiQuestionsPerExam: number
}

export default function CreatePersonalExamPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [numberOfAlternatives, setNumberOfAlternatives] = useState(5)
  const [scoringMethod, setScoringMethod] = useState<'normal' | 'tri'>('normal')
  const [totalPoints, setTotalPoints] = useState(100)
  const [navigationMode, setNavigationMode] = useState<'paginated' | 'scroll'>('paginated')
  const [timePerQuestion, setTimePerQuestion] = useState(0)
  const [feedbackMode, setFeedbackMode] = useState<'immediate' | 'end'>('end')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      setUser(data.user)

      const settingsRes = await fetch('/api/admin/settings')
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        if (settings.personalExamsEnabled === false) {
          router.push('/')
          return
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const getAccountLimits = (): AccountLimits => {
    const accountType = user?.accountType || 'gratuito'
    const limits = {
      gratuito: { dailyExams: 5, aiQuestionsPerExam: 5 },
      trial: { dailyExams: 10, aiQuestionsPerExam: 10 },
      premium: { dailyExams: 25, aiQuestionsPerExam: 20 },
    }
    return limits[accountType]
  }

  const getAccountTypeLabel = () => {
    const accountType = user?.accountType || 'gratuito'
    const labels = {
      gratuito: { label: 'Gratuito', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
      trial: { label: 'Trial', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50' },
      premium: { label: 'Premium', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50' },
    }
    return labels[accountType]
  }

  const handleCreateExam = async () => {
    if (!title.trim()) {
      alert('Digite um título para a prova')
      return
    }

    if (numberOfAlternatives < 2 || numberOfAlternatives > 5) {
      alert('Quantidade de alternativas deve estar entre 2 e 5')
      return
    }

    if (feedbackMode === 'immediate' && navigationMode !== 'paginated') {
      alert('Feedback imediato só funciona em modo de navegação paginada')
      return
    }

    setCreating(true)
    try {
      const examData = {
        title,
        numberOfAlternatives,
        scoringMethod,
        totalPoints: scoringMethod === 'tri' ? 1000 : totalPoints,
        navigationMode,
        duration: timePerQuestion ? 60 * timePerQuestion : undefined,
        isPracticeExam: true,
        isPersonalExam: true,
        feedbackMode,
      }

      sessionStorage.setItem('pendingExamData', JSON.stringify(examData))

      const tempId = 'temp-' + Date.now()
      router.push(`/exams/personal/${tempId}/generate-questions`)
    } catch (error) {
      console.error('Erro ao preparar prova:', error)
      alert('Erro ao preparar prova')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <PageLoading variant="fullscreen" />
  }

  const limits = getAccountLimits()
  const accountType = getAccountTypeLabel()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${accountType.color}`}>
              {user?.accountType === 'premium' && <Crown className="h-4 w-4" />}
              {accountType.label}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white mb-4 shadow-lg shadow-purple-500/30">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Criar Prova Pessoal</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Configure sua prova personalizada com questões geradas por IA
          </p>
        </div>

        {/* Account Limits Info */}
        <Card className="mb-8 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950/30 dark:to-transparent">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <ListChecks className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    {user?.accountType === 'gratuito' ? 'Limite Total' : 'Provas por dia'}
                  </p>
                  <p className="font-semibold">{limits.dailyExams}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Questões IA por prova</p>
                  <p className="font-semibold">até {limits.aiQuestionsPerExam}</p>
                </div>
              </div>
              {user?.accountType !== 'premium' && (
                <>
                  <div className="h-8 w-px bg-border hidden sm:block" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/buy')}
                    className="gap-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                  >
                    <Crown className="h-4 w-4" />
                    Fazer Upgrade
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Basic Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Título da Prova <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Ex: Simulado de Fisiologia Cardíaca"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={creating}
                    className="h-11"
                  />
                </div>

                {/* Alternatives */}
                <div className="space-y-2">
                  <Label htmlFor="alternatives" className="text-sm font-medium">
                    Alternativas por Questão
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNumberOfAlternatives(num)}
                        disabled={creating}
                        className={`h-11 rounded-lg border-2 font-semibold transition-all ${numberOfAlternatives === num
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted hover:border-primary/50 bg-background'
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scoring Method */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Método de Pontuação</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScoringMethod('normal')}
                      disabled={creating}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${scoringMethod === 'normal'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                        }`}
                    >
                      <p className="font-semibold text-sm">Normal</p>
                      <p className="text-xs text-muted-foreground">Pontuação simples</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScoringMethod('tri')}
                      disabled={creating}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${scoringMethod === 'tri'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                        }`}
                    >
                      <p className="font-semibold text-sm">TRI</p>
                      <p className="text-xs text-muted-foreground">1000 pontos</p>
                    </button>
                  </div>
                </div>

                {/* Total Points (only for normal) */}
                {scoringMethod === 'normal' && (
                  <div className="space-y-2">
                    <Label htmlFor="points" className="text-sm font-medium">
                      Pontuação Total
                    </Label>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      value={totalPoints}
                      onChange={(e) => setTotalPoints(parseInt(e.target.value) || 100)}
                      disabled={creating}
                      className="h-11"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Advanced Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  Configurações Avançadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Navigation Mode */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Modo de Navegação</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNavigationMode('paginated')}
                      disabled={creating || feedbackMode === 'immediate'}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${navigationMode === 'paginated'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                        }`}
                    >
                      <p className="font-semibold text-sm">Paginada</p>
                      <p className="text-xs text-muted-foreground">Uma por vez</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNavigationMode('scroll')}
                      disabled={creating || feedbackMode === 'immediate'}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${navigationMode === 'scroll'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                        } ${feedbackMode === 'immediate' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <p className="font-semibold text-sm">Scroll</p>
                      <p className="text-xs text-muted-foreground">Todas visíveis</p>
                    </button>
                  </div>
                </div>

                {/* Time per Question */}
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-sm font-medium flex items-center gap-2">
                    Tempo por Questão (minutos)
                    <span className="text-xs text-muted-foreground font-normal">(0 = sem limite)</span>
                  </Label>
                  <Input
                    id="time"
                    type="number"
                    min="0"
                    max="60"
                    placeholder="0"
                    value={timePerQuestion || ''}
                    onChange={(e) => setTimePerQuestion(parseInt(e.target.value) || 0)}
                    disabled={creating}
                    className="h-11"
                  />
                </div>

                {/* Feedback Mode */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Modo de Feedback
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackMode('end')}
                      disabled={creating}
                      className={`p-3 rounded-lg border-2 text-left transition-all flex items-start gap-3 ${feedbackMode === 'end'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                        }`}
                    >
                      <CheckCircle2 className={`h-5 w-5 mt-0.5 ${feedbackMode === 'end' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-semibold text-sm">Ao Finalizar</p>
                        <p className="text-xs text-muted-foreground">Respostas reveladas após terminar a prova</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackMode('immediate')
                        setNavigationMode('paginated')
                      }}
                      disabled={creating}
                      className={`p-3 rounded-lg border-2 text-left transition-all flex items-start gap-3 ${feedbackMode === 'immediate'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                        }`}
                    >
                      <Zap className={`h-5 w-5 mt-0.5 ${feedbackMode === 'immediate' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-semibold text-sm">Feedback Imediato</p>
                        <p className="text-xs text-muted-foreground">Saber resposta após cada questão (requer paginada)</p>
                      </div>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Dica</p>
                    <p className="text-blue-600/80 dark:text-blue-400/80">
                      Na próxima etapa, você poderá definir o tema e gerar questões com nossa IA avançada.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={creating}
            className="sm:flex-1 h-12"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateExam}
            disabled={creating || !title.trim()}
            className="sm:flex-1 h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Preparando...
              </>
            ) : (
              <>
                Próximo: Gerar Questões
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
