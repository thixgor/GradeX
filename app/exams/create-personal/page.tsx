'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  accountType?: 'gratuito' | 'trial' | 'premium'
}

export default function CreatePersonalExamPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [personalExamsEnabled, setPersonalExamsEnabled] = useState(true)

  // Form state
  const [title, setTitle] = useState('')
  const [numberOfAlternatives, setNumberOfAlternatives] = useState(4)
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
      
      // Verificar se provas pessoais estão habilitadas
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

  const getAccountLimits = () => {
    const accountType = user?.accountType || 'gratuito'
    const limits = {
      gratuito: { dailyExams: 3, aiQuestionsPerExam: 5 },
      trial: { dailyExams: 8, aiQuestionsPerExam: 10 },
      premium: { dailyExams: 10, aiQuestionsPerExam: 20 },
    }
    return limits[accountType]
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

    // Feedback imediato só funciona em modo paginado
    if (feedbackMode === 'immediate' && navigationMode !== 'paginated') {
      alert('Feedback imediato só funciona em modo de navegação paginada')
      return
    }

    setCreating(true)
    try {
      // Armazenar dados da prova no sessionStorage para usar depois
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
      
      // Gerar um ID temporário para a página de geração
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const limits = getAccountLimits()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Criar Prova Pessoal</CardTitle>
              <CardDescription>
                Crie uma prova personalizada com questões geradas por IA
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Informações da Conta */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Tipo de Conta:</strong> {user?.accountType || 'Gratuito'}
                </p>
                <p className="text-sm">
                  <strong>Limite Diário:</strong> {limits.dailyExams} provas/dia
                </p>
                <p className="text-sm">
                  <strong>Questões IA por Prova:</strong> até {limits.aiQuestionsPerExam}
                </p>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título da Prova *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Simulado de Matemática"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={creating}
                />
              </div>

              {/* Alternativas por Questão */}
              <div className="space-y-2">
                <Label htmlFor="alternatives">Alternativas por Questão *</Label>
                <select
                  id="alternatives"
                  value={numberOfAlternatives}
                  onChange={(e) => setNumberOfAlternatives(parseInt(e.target.value))}
                  disabled={creating}
                  className="w-full px-3 py-2 border border-muted rounded-md bg-background text-sm"
                >
                  <option value="2">2 alternativas</option>
                  <option value="3">3 alternativas</option>
                  <option value="4">4 alternativas</option>
                  <option value="5">5 alternativas</option>
                </select>
              </div>

              {/* Método de Pontuação */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scoring">Método de Pontuação *</Label>
                  <select
                    id="scoring"
                    value={scoringMethod}
                    onChange={(e) => setScoringMethod(e.target.value as 'normal' | 'tri')}
                    disabled={creating}
                    className="w-full px-3 py-2 border border-muted rounded-md bg-background text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="tri">TRI (1000 pontos)</option>
                  </select>
                </div>

                {scoringMethod === 'normal' && (
                  <div className="space-y-2">
                    <Label htmlFor="points">Pontuação Total *</Label>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      value={totalPoints}
                      onChange={(e) => setTotalPoints(parseInt(e.target.value) || 100)}
                      disabled={creating}
                    />
                  </div>
                )}
              </div>

              {/* Modo de Navegação */}
              <div className="space-y-2">
                <Label htmlFor="navigation">Modo de Navegação *</Label>
                <select
                  id="navigation"
                  value={navigationMode}
                  onChange={(e) => setNavigationMode(e.target.value as 'paginated' | 'scroll')}
                  disabled={creating || feedbackMode === 'immediate'}
                  className="w-full px-3 py-2 border border-muted rounded-md bg-background text-sm"
                >
                  <option value="paginated">Paginada (uma questão por página)</option>
                  <option value="scroll" disabled={feedbackMode === 'immediate'}>Scroll (todas as questões visíveis)</option>
                </select>
                {feedbackMode === 'immediate' && (
                  <p className="text-xs text-muted-foreground">
                    Feedback imediato requer modo de navegação paginado
                  </p>
                )}
              </div>

              {/* Tempo por Questão */}
              <div className="space-y-2">
                <Label htmlFor="time">Tempo Máximo por Questão (minutos)</Label>
                <Input
                  id="time"
                  type="number"
                  min="0"
                  placeholder="0 = sem limite"
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(parseInt(e.target.value) || 0)}
                  disabled={creating}
                />
              </div>

              {/* Modo de Feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback">Modo de Feedback *</Label>
                <select
                  id="feedback"
                  value={feedbackMode}
                  onChange={(e) => {
                    const newFeedbackMode = e.target.value as 'immediate' | 'end'
                    setFeedbackMode(newFeedbackMode)
                    // Se selecionar feedback imediato, forçar modo paginado
                    if (newFeedbackMode === 'immediate') {
                      setNavigationMode('paginated')
                    }
                  }}
                  disabled={creating}
                  className="w-full px-3 py-2 border border-muted rounded-md bg-background text-sm"
                >
                  <option value="end">Respostas ao finalizar</option>
                  <option value="immediate">Feedback imediato (após cada questão)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Feedback imediato requer modo de navegação paginado
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={creating}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateExam}
                  disabled={creating || !title.trim()}
                  className="flex-1"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Próximo: Gerar Questões'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
