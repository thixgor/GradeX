'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomContext } from '@/lib/types'

interface Question {
  id: string
  number: number
  statement: string
  command: string
  alternatives: Array<{
    id: string
    letter: string
    text: string
    isCorrect: boolean
  }>
  explanation: string
}

interface Exam {
  _id: string
  title: string
  numberOfQuestions: number
  numberOfAlternatives: number
  questions: Question[]
}

export default function GenerateQuestionsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [exam, setExam] = useState<Exam | null>(null)
  const [examData, setExamData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [themes, setThemes] = useState('')
  const [difficulty, setDifficulty] = useState(0.5)
  const [currentStep, setCurrentStep] = useState<'config' | 'generating' | 'review'>('config')
  const [numberOfQuestions, setNumberOfQuestions] = useState(5)
  const [questionsLimit, setQuestionsLimit] = useState(5)
  const [userAccountType, setUserAccountType] = useState<'gratuito' | 'trial' | 'premium' | 'admin'>('gratuito')

  // Estilos e tipos
  const [style, setStyle] = useState<'contextualizada' | 'rapida'>('contextualizada')
  const [mixedStyles, setMixedStyles] = useState(false)
  const [alternativeType, setAlternativeType] = useState<'standard' | 'multiple-affirmative' | 'comparison' | 'assertion-reason'>('standard')
  const [mixedAlternativeTypes, setMixedAlternativeTypes] = useState(false)
  const [alternativeTypeDistribution, setAlternativeTypeDistribution] = useState({
    'standard': 50,
    'multiple-affirmative': 25,
    'comparison': 15,
    'assertion-reason': 10,
  })
  const [randomDifficulty, setRandomDifficulty] = useState(false)
  const [questionContext, setQuestionContext] = useState<'enem' | 'uerj' | 'outros'>('enem')
  
  // Contextos personalizados
  const [savedContexts, setSavedContexts] = useState<CustomContext[]>([])
  const [selectedSavedContext, setSelectedSavedContext] = useState<string>('')
  const [customContext, setCustomContext] = useState('')

  useEffect(() => {
    checkPersonalExamsEnabled()
    loadExamData()
    fetchSavedContexts()
    loadUserLimits()
  }, [examId])

  async function loadUserLimits() {
    try {
      const res = await fetch('/api/user/tier-limits')
      if (res.ok) {
        const data = await res.json()
        setQuestionsLimit(data.limits.questionsPerExam)
        setUserAccountType(data.accountType)
        setNumberOfQuestions(Math.min(5, data.limits.questionsPerExam))
      }
    } catch (error) {
      console.error('Erro ao carregar limites:', error)
    }
  }

  async function checkPersonalExamsEnabled() {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const settings = await res.json()
        if (settings.personalExamsEnabled === false) {
          router.push('/')
          return
        }
      }
    } catch (error) {
      console.error('Erro ao verificar configurações:', error)
    }
  }

  async function loadExamData() {
    try {
      // Se for um ID temporário, carregar do sessionStorage
      if (examId.startsWith('temp-')) {
        const data = sessionStorage.getItem('pendingExamData')
        if (data) {
          setExamData(JSON.parse(data))
          // Criar um objeto exam temporário para exibição
          const tempExam: Exam = {
            _id: examId,
            title: JSON.parse(data).title,
            numberOfQuestions: 5, // Será definido depois
            numberOfAlternatives: JSON.parse(data).numberOfAlternatives,
            questions: [],
          }
          setExam(tempExam)
        } else {
          alert('Dados da prova não encontrados')
          router.back()
        }
      } else {
        // Se for um ID real, carregar da API
        const res = await fetch(`/api/exams/${examId}`)
        if (res.ok) {
          const data = await res.json()
          setExam(data.exam)
          setExamData(data.exam)
        } else {
          alert('Prova não encontrada')
          router.back()
        }
      }
    } catch (error) {
      console.error('Erro ao carregar prova:', error)
      alert('Erro ao carregar prova')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  async function fetchSavedContexts() {
    try {
      const res = await fetch('/api/contexts')
      const data = await res.json()
      if (data.success) {
        setSavedContexts(data.contexts)
      }
    } catch (error) {
      console.error('Erro ao carregar contextos salvos:', error)
    }
  }

  async function handleGenerateQuestions() {
    if (!themes.trim()) {
      alert('Digite os temas para as questões (separados por ;)')
      return
    }

    // Validar contexto customizado
    if (questionContext === 'outros' && !selectedSavedContext && !customContext.trim()) {
      alert('Por favor, selecione ou especifique o contexto personalizado da questão')
      return
    }

    setGenerating(true)
    setCurrentStep('generating')

    try {
      // Determinar contexto
      let context = ''
      if (questionContext === 'enem') {
        context = 'ENEM - Exame Nacional do Ensino Médio'
      } else if (questionContext === 'uerj') {
        context = 'UERJ - Universidade do Estado do Rio de Janeiro'
      } else {
        // Contexto personalizado
        if (selectedSavedContext) {
          // Usar contexto salvo
          const savedContext = savedContexts.find(c => c.id === selectedSavedContext)
          context = savedContext ? savedContext.name : customContext.trim()
        } else {
          // Usar contexto digitado
          context = customContext.trim()
        }
      }

      const res = await fetch(`/api/exams/${examId}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themes: themes.split(';').map(t => t.trim()).filter(t => t),
          difficulty,
          numberOfQuestions: numberOfQuestions,
          numberOfAlternatives: exam?.numberOfAlternatives || 4,
          style,
          mixedStyles,
          alternativeType,
          mixedAlternativeTypes,
          alternativeTypeDistribution,
          randomDifficulty,
          questionContext,
          context,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedQuestions(data.questions)
        // Salvar diretamente sem passar pela revisão
        await saveExamWithQuestions(data.questions)
      } else {
        const error = await res.json()
        alert(`Erro: ${error.error}`)
        setCurrentStep('config')
      }
    } catch (error) {
      console.error('Erro ao gerar questões:', error)
      alert('Erro ao gerar questões')
      setCurrentStep('config')
    } finally {
      setGenerating(false)
    }
  }

  async function saveExamWithQuestions(questions: Question[]) {
    setSaving(true)
    try {
      // Se for um ID temporário, criar a prova agora
      if (examId.startsWith('temp-')) {
        const res = await fetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...examData,
            numberOfQuestions: questions.length,
            questions: questions,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          // Limpar sessionStorage
          sessionStorage.removeItem('pendingExamData')
          // Ir direto para a prova
          router.push(`/exam/${data.examId}`)
        } else {
          const error = await res.json()
          alert(`Erro: ${error.error}`)
          setCurrentStep('config')
        }
      } else {
        // Se for um ID real, apenas atualizar as questões
        const res = await fetch(`/api/exams/${examId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: questions,
          }),
        })

        if (res.ok) {
          // Ir direto para a prova
          router.push(`/exam/${examId}`)
        } else {
          const error = await res.json()
          alert(`Erro: ${error.error}`)
          setCurrentStep('config')
        }
      }
    } catch (error) {
      console.error('Erro ao salvar prova:', error)
      alert('Erro ao salvar prova')
      setCurrentStep('config')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveExam() {
    setSaving(true)
    try {
      // Se for um ID temporário, criar a prova agora
      if (examId.startsWith('temp-')) {
        const res = await fetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...examData,
            numberOfQuestions: generatedQuestions.length,
            questions: generatedQuestions,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          // Limpar sessionStorage
          sessionStorage.removeItem('pendingExamData')
          alert('Prova criada com sucesso!')
          router.push(`/`)
        } else {
          const error = await res.json()
          alert(`Erro: ${error.error}`)
        }
      } else {
        // Se for um ID real, apenas atualizar as questões
        const res = await fetch(`/api/exams/${examId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: generatedQuestions,
          }),
        })

        if (res.ok) {
          alert('Prova atualizada com sucesso!')
          router.push(`/`)
        } else {
          const error = await res.json()
          alert(`Erro: ${error.error}`)
        }
      }
    } catch (error) {
      console.error('Erro ao salvar prova:', error)
      alert('Erro ao salvar prova')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

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

        <div className="max-w-3xl mx-auto">
          {currentStep === 'config' && (
            <Card>
              <CardHeader>
                <CardTitle>Gerar Questões por IA</CardTitle>
                <CardDescription>
                  {exam?.title} - {exam?.numberOfQuestions} questões
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Temas */}
                <div className="space-y-2">
                  <Label htmlFor="themes">Temas das Questões *</Label>
                  <Textarea
                    id="themes"
                    placeholder="Ex: Revolução Francesa; Equações de segundo grau; Fotossíntese (separados por ;)"
                    value={themes}
                    onChange={(e) => setThemes(e.target.value)}
                    disabled={generating}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Separe os temas com ponto-e-vírgula (;)</p>
                </div>

                {/* Dificuldade */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="difficulty">Nível de Dificuldade</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="random-difficulty"
                        checked={randomDifficulty}
                        onChange={(e) => setRandomDifficulty(e.target.checked)}
                        disabled={generating}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="random-difficulty" className="font-normal cursor-pointer">
                        Aleatória
                      </Label>
                    </div>
                  </div>
                  <input
                    id="difficulty"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                    disabled={generating || randomDifficulty}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Fácil</span>
                    <span>{randomDifficulty ? 'Aleatória' : Math.round(difficulty * 100) + '%'}</span>
                    <span>Difícil</span>
                  </div>
                </div>

                {/* Número de Questões */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="num-questions">Número de Questões</Label>
                    <span className="text-xs text-muted-foreground">
                      Máximo: {questionsLimit}
                    </span>
                  </div>
                  <input
                    id="num-questions"
                    type="range"
                    min="1"
                    max={questionsLimit}
                    value={numberOfQuestions}
                    onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                    disabled={generating}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span className="font-semibold text-foreground">{numberOfQuestions}</span>
                    <span>{questionsLimit}</span>
                  </div>
                </div>

                {/* Estilo da Questão */}
                <div className="space-y-2">
                  <Label>Estilo da Questão</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="style-contextualizada"
                        name="style"
                        value="contextualizada"
                        checked={style === 'contextualizada' && !mixedStyles}
                        onChange={(e) => {
                          setStyle('contextualizada')
                          setMixedStyles(false)
                        }}
                        disabled={generating}
                      />
                      <Label htmlFor="style-contextualizada" className="font-normal cursor-pointer">
                        Contextualizada
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="style-rapida"
                        name="style"
                        value="rapida"
                        checked={style === 'rapida' && !mixedStyles}
                        onChange={(e) => {
                          setStyle('rapida')
                          setMixedStyles(false)
                        }}
                        disabled={generating}
                      />
                      <Label htmlFor="style-rapida" className="font-normal cursor-pointer">
                        Rápida
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="style-mista"
                        name="style"
                        value="mista"
                        checked={mixedStyles}
                        onChange={(e) => setMixedStyles(true)}
                        disabled={generating}
                      />
                      <Label htmlFor="style-mista" className="font-normal cursor-pointer">
                        Mista (alternando entre contextualizada e rápida)
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Tipo de Alternativa */}
                <div className="space-y-2">
                  <Label>Tipo de Alternativa</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="alt-type-standard"
                        name="alt-type"
                        value="standard"
                        checked={alternativeType === 'standard' && !mixedAlternativeTypes}
                        onChange={(e) => {
                          setAlternativeType('standard')
                          setMixedAlternativeTypes(false)
                        }}
                        disabled={generating}
                      />
                      <Label htmlFor="alt-type-standard" className="font-normal cursor-pointer">
                        Padrão (A, B, C...)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="alt-type-affirmative"
                        name="alt-type"
                        value="multiple-affirmative"
                        checked={alternativeType === 'multiple-affirmative' && !mixedAlternativeTypes}
                        onChange={(e) => {
                          setAlternativeType('multiple-affirmative')
                          setMixedAlternativeTypes(false)
                        }}
                        disabled={generating}
                      />
                      <Label htmlFor="alt-type-affirmative" className="font-normal cursor-pointer">
                        Afirmativas I-IV
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="alt-type-comparison"
                        name="alt-type"
                        value="comparison"
                        checked={alternativeType === 'comparison' && !mixedAlternativeTypes}
                        onChange={(e) => {
                          setAlternativeType('comparison')
                          setMixedAlternativeTypes(false)
                        }}
                        disabled={generating}
                      />
                      <Label htmlFor="alt-type-comparison" className="font-normal cursor-pointer">
                        Comparação
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="alt-type-assertion"
                        name="alt-type"
                        value="assertion-reason"
                        checked={alternativeType === 'assertion-reason' && !mixedAlternativeTypes}
                        onChange={(e) => {
                          setAlternativeType('assertion-reason')
                          setMixedAlternativeTypes(false)
                        }}
                        disabled={generating}
                      />
                      <Label htmlFor="alt-type-assertion" className="font-normal cursor-pointer">
                        Asserção/Razão
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="alt-type-mixed"
                        name="alt-type"
                        value="mixed"
                        checked={mixedAlternativeTypes}
                        onChange={(e) => setMixedAlternativeTypes(true)}
                        disabled={generating}
                      />
                      <Label htmlFor="alt-type-mixed" className="font-normal cursor-pointer">
                        Mista (distribuição de tipos)
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Distribuição de Tipos de Alternativas */}
                {mixedAlternativeTypes && (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-semibold">Distribuição de Tipos (%)</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-normal">Padrão (A, B, C...)</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={alternativeTypeDistribution['standard']}
                            onChange={(e) => setAlternativeTypeDistribution({
                              ...alternativeTypeDistribution,
                              'standard': parseInt(e.target.value) || 0
                            })}
                            disabled={generating}
                            className="w-16 px-2 py-1 border border-muted rounded text-sm"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="font-normal">Afirmativas I-IV</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={alternativeTypeDistribution['multiple-affirmative']}
                            onChange={(e) => setAlternativeTypeDistribution({
                              ...alternativeTypeDistribution,
                              'multiple-affirmative': parseInt(e.target.value) || 0
                            })}
                            disabled={generating}
                            className="w-16 px-2 py-1 border border-muted rounded text-sm"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="font-normal">Comparação</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={alternativeTypeDistribution['comparison']}
                            onChange={(e) => setAlternativeTypeDistribution({
                              ...alternativeTypeDistribution,
                              'comparison': parseInt(e.target.value) || 0
                            })}
                            disabled={generating}
                            className="w-16 px-2 py-1 border border-muted rounded text-sm"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="font-normal">Asserção/Razão</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={alternativeTypeDistribution['assertion-reason']}
                            onChange={(e) => setAlternativeTypeDistribution({
                              ...alternativeTypeDistribution,
                              'assertion-reason': parseInt(e.target.value) || 0
                            })}
                            disabled={generating}
                            className="w-16 px-2 py-1 border border-muted rounded text-sm"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total: {Object.values(alternativeTypeDistribution).reduce((a, b) => a + b, 0)}%
                    </p>
                  </div>
                )}

                {/* Contexto da Questão */}
                <div className="space-y-2">
                  <Label htmlFor="context">Contexto da Questão</Label>
                  <select
                    id="context"
                    value={questionContext}
                    onChange={(e) => setQuestionContext(e.target.value as any)}
                    disabled={generating}
                    className="w-full px-3 py-2 border border-muted rounded-md bg-background text-sm"
                  >
                    <option value="enem">ENEM</option>
                    <option value="uerj">UERJ</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                {/* Contextos Personalizados */}
                {questionContext === 'outros' && (
                  <>
                    {savedContexts.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="saved-context">Contextos Salvos</Label>
                        <select
                          id="saved-context"
                          value={selectedSavedContext}
                          onChange={(e) => setSelectedSavedContext(e.target.value)}
                          disabled={generating}
                          className="w-full px-3 py-2 border border-muted rounded-md bg-background text-sm"
                        >
                          <option value="">Selecione um contexto salvo...</option>
                          {savedContexts.map((context) => (
                            <option key={context.id} value={context.id}>
                              {context.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="custom-context">
                        {savedContexts.length > 0 ? 'Ou descreva um contexto personalizado' : 'Descreva o contexto personalizado'}
                      </Label>
                      <Textarea
                        id="custom-context"
                        placeholder="Ex: Prova de Medicina, Concurso Público, etc."
                        value={customContext}
                        onChange={(e) => setCustomContext(e.target.value)}
                        disabled={generating}
                        rows={2}
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={generating}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={generating || !themes.trim()}
                    className="flex-1"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      'Gerar Questões'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'generating' && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p className="text-lg font-semibold">Gerando questões...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Isso pode levar alguns minutos
                </p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
