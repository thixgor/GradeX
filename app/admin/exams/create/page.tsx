'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { FileUpload } from '@/components/file-upload'
import { TxtImportUnified } from '@/components/txt-import-unified'
import { AIQuestionGenerator } from '@/components/ai-question-generator'
import { Question, Alternative, ScoringMethod, QuestionType, KeyPoint, EssayStyle, CorrectionMethod } from '@/lib/types'
import { generateRandomTRIParameters } from '@/lib/tri-calculator'
import { v4 as uuidv4 } from 'uuid'
import { ArrowLeft, Plus, Trash2, Shuffle, Save } from 'lucide-react'

export default function CreateExamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const [examData, setExamData] = useState({
    title: '',
    description: '',
    coverImage: '',
    numberOfAlternatives: 5,
    themePhrase: '',
    scoringMethod: 'normal' as ScoringMethod,
    totalPoints: 100,
    pdfUrl: '',
    gatesOpen: '',
    gatesClose: '',
    startTime: '',
    durationMinutes: 120, // Duração em minutos
    isHidden: false,
    // Configurações padrão para cada tipo de questão
    discursiveCorrectionMethod: 'ai' as 'manual' | 'ai',
    discursiveAiRigor: 0.45,
    essayStyle: 'enem' as EssayStyle,
    essayCorrectionMethod: 'ai' as CorrectionMethod,
    essayAiRigor: 0.45,
    navigationMode: 'paginated' as 'paginated' | 'scroll',
    // Sistema de monitoramento (proctoring)
    proctoringEnabled: false,
    proctoringCamera: false,
    proctoringAudio: false,
    proctoringScreen: false,
    proctoringScreenMode: 'window' as 'window' | 'screen',
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  function addMultipleChoiceQuestion() {
    const letters = ['A', 'B', 'C', 'D', 'E']
    const alternatives: Alternative[] = []

    for (let j = 0; j < examData.numberOfAlternatives; j++) {
      alternatives.push({
        id: uuidv4(),
        letter: letters[j],
        text: '',
        isCorrect: j === 0,
      })
    }

    const triParams = examData.scoringMethod === 'tri'
      ? generateRandomTRIParameters(examData.numberOfAlternatives)
      : {}

    const newQuestion: Question = {
      id: uuidv4(),
      number: questions.length + 1,
      type: 'multiple-choice',
      statement: '',
      statementSource: '',
      imageUrl: '',
      imageSource: '',
      command: '',
      alternatives,
      ...(examData.scoringMethod === 'tri' && {
        triDiscrimination: triParams.a,
        triDifficulty: triParams.b,
        triGuessing: triParams.c,
      }),
    }

    setQuestions([...questions, newQuestion])
    setCurrentQuestionIndex(questions.length)
    if (currentStep === 1) setCurrentStep(2)
  }

  function addDiscursiveQuestion() {
    const newQuestion: Question = {
      id: uuidv4(),
      number: questions.length + 1,
      type: 'discursive',
      statement: '',
      statementSource: '',
      imageUrl: '',
      imageSource: '',
      command: '',
      alternatives: [],
      keyPoints: [],
      maxScore: 10,
    }

    setQuestions([...questions, newQuestion])
    setCurrentQuestionIndex(questions.length)
    if (currentStep === 1) setCurrentStep(2)
  }

  function addEssayQuestion() {
    const maxScore = examData.essayStyle === 'enem' ? 1000 : 20

    const newQuestion: Question = {
      id: uuidv4(),
      number: questions.length + 1,
      type: 'essay',
      statement: '',
      statementSource: '',
      imageUrl: '',
      imageSource: '',
      command: '',
      alternatives: [],
      essayStyle: examData.essayStyle,
      essayTheme: '',
      essaySupportTexts: [],
      essayCorrectionMethod: examData.essayCorrectionMethod,
      essayAiRigor: examData.essayAiRigor,
      maxScore,
    }

    setQuestions([...questions, newQuestion])
    setCurrentQuestionIndex(questions.length)
    if (currentStep === 1) setCurrentStep(2)
  }

  function deleteQuestion(index: number) {
    const newQuestions = questions.filter((_, i) => i !== index)
    // Renumerar questões
    newQuestions.forEach((q, i) => {
      q.number = i + 1
    })
    setQuestions(newQuestions)
    if (newQuestions.length === 0) {
      setCurrentStep(1)
    } else if (currentQuestionIndex >= newQuestions.length) {
      setCurrentQuestionIndex(newQuestions.length - 1)
    }
  }

  function updateQuestion(index: number, updates: Partial<Question>) {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], ...updates }
    setQuestions(newQuestions)
  }

  function updateAlternative(questionIndex: number, altIndex: number, text: string) {
    const newQuestions = [...questions]
    newQuestions[questionIndex].alternatives[altIndex].text = text
    setQuestions(newQuestions)
  }

  function setCorrectAlternative(questionIndex: number, altIndex: number) {
    const newQuestions = [...questions]
    newQuestions[questionIndex].alternatives.forEach((alt, idx) => {
      alt.isCorrect = idx === altIndex
    })
    setQuestions(newQuestions)
  }

  function randomizeTRIParameters(questionIndex: number) {
    const params = generateRandomTRIParameters(examData.numberOfAlternatives)
    updateQuestion(questionIndex, {
      triDiscrimination: params.a,
      triDifficulty: params.b,
      triGuessing: params.c,
    })
  }

  function shuffleAlternatives(questionIndex: number) {
    const question = questions[questionIndex]
    if (question.type !== 'multiple-choice') return

    // Encontrar qual alternativa é a correta
    const correctIndex = question.alternatives.findIndex(alt => alt.isCorrect)
    if (correctIndex === -1) return

    // Criar cópia das alternativas
    const shuffled = [...question.alternatives]

    // Algoritmo Fisher-Yates para embaralhar
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // Reatribuir as letras mantendo isCorrect
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const newAlternatives = shuffled.map((alt, idx) => ({
      ...alt,
      letter: letters[idx],
    }))

    updateQuestion(questionIndex, { alternatives: newAlternatives })
  }

  function shuffleAllAlternatives() {
    if (!confirm('Embaralhar as alternativas de TODAS as questões de múltipla escolha?')) return

    const newQuestions = questions.map((question, idx) => {
      if (question.type !== 'multiple-choice') return question

      // Encontrar qual alternativa é a correta
      const correctIndex = question.alternatives.findIndex(alt => alt.isCorrect)
      if (correctIndex === -1) return question

      // Criar cópia das alternativas
      const shuffled = [...question.alternatives]

      // Algoritmo Fisher-Yates para embaralhar
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      // Reatribuir as letras mantendo isCorrect
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
      const newAlternatives = shuffled.map((alt, idx) => ({
        ...alt,
        letter: letters[idx],
      }))

      return { ...question, alternatives: newAlternatives }
    })

    setQuestions(newQuestions)
  }

  async function handleSubmit() {
    setLoading(true)

    try {
      // Validação básica
      if (!examData.title || !examData.startTime) {
        alert('Preencha todos os campos obrigatórios (título e data/hora de início)')
        return
      }

      if (questions.length === 0) {
        alert('Adicione pelo menos uma questão à prova')
        return
      }

      // Validar questões
      for (const question of questions) {
        if (!question.statement || !question.command) {
          alert(`Questão ${question.number}: Preencha o enunciado e o comando`)
          return
        }

        if (question.type === 'multiple-choice') {
          const hasCorrect = question.alternatives.some(alt => alt.isCorrect)
          if (!hasCorrect) {
            alert(`Questão ${question.number}: Marque uma alternativa como correta`)
            return
          }

          for (const alt of question.alternatives) {
            if (!alt.text.trim()) {
              alert(`Questão ${question.number}: Preencha todas as alternativas`)
              return
            }
          }
        } else if (question.type === 'discursive') {
          if (!question.keyPoints || question.keyPoints.length === 0) {
            alert(`Questão ${question.number}: Adicione pelo menos um ponto-chave`)
            return
          }

          for (const kp of question.keyPoints) {
            if (!kp.description.trim()) {
              alert(`Questão ${question.number}: Preencha todos os pontos-chave`)
              return
            }
          }

          // Validar que a soma dos pesos não excede 1
          const totalWeight = question.keyPoints.reduce((sum, kp) => sum + kp.weight, 0)
          if (Math.abs(totalWeight - 1) > 0.01) {
            alert(`Questão ${question.number}: A soma dos pesos dos pontos-chave deve ser 100% (atualmente ${(totalWeight * 100).toFixed(0)}%)`)
            return
          }
        } else if (question.type === 'essay') {
          if (!question.essayTheme || !question.essayTheme.trim()) {
            alert(`Questão ${question.number}: Preencha o tema da redação`)
            return
          }

          if (!question.essayStyle) {
            alert(`Questão ${question.number}: Escolha o estilo da redação (ENEM ou UERJ)`)
            return
          }
        }
      }

      // Calcular endTime baseado em startTime + durationMinutes
      const startDate = new Date(examData.startTime)
      const endDate = new Date(startDate.getTime() + examData.durationMinutes * 60000)

      const payload = {
        ...examData,
        endTime: endDate.toISOString(),
        duration: examData.durationMinutes,
        numberOfQuestions: questions.length,
        questions,
        // Garantir que os campos de proctoring sejam enviados
        proctoringEnabled: examData.proctoringEnabled,
        proctoringCamera: examData.proctoringCamera,
        proctoringAudio: examData.proctoringAudio,
        proctoringScreen: examData.proctoringScreen,
        proctoringScreenMode: examData.proctoringScreenMode,
      }

      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar prova')
      }

      alert('Prova criada com sucesso!')
      router.push('/admin/exams')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Criar Nova Prova</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações da Prova</CardTitle>
              <CardDescription>
                Preencha os dados básicos da prova
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Prova *</Label>
                <Input
                  id="title"
                  value={examData.title}
                  onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                  placeholder="Ex: ENEM 2024 - Simulado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={examData.description}
                  onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                  placeholder="Descrição da prova..."
                  rows={3}
                />
              </div>

              <FileUpload
                label="Imagem de Capa (opcional)"
                accept="image/*"
                value={examData.coverImage}
                onChange={(url) => setExamData({ ...examData, coverImage: url })}
                supportPaste={true}
                placeholder="Cole uma URL ou faça upload da capa"
              />

              <div className="space-y-2">
                <Label htmlFor="numberOfAlternatives">Alternativas por Questão (Múltipla Escolha)</Label>
                <select
                  id="numberOfAlternatives"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={examData.numberOfAlternatives}
                  onChange={(e) => setExamData({ ...examData, numberOfAlternatives: parseInt(e.target.value) })}
                >
                  <option value="2">2 alternativas (A, B)</option>
                  <option value="3">3 alternativas (A, B, C)</option>
                  <option value="4">4 alternativas (A, B, C, D)</option>
                  <option value="5">5 alternativas (A, B, C, D, E)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Esta configuração será aplicada às questões de múltipla escolha que você adicionar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="themePhrase">Frase-Tema (opcional)</Label>
                <Input
                  id="themePhrase"
                  value={examData.themePhrase}
                  onChange={(e) => setExamData({ ...examData, themePhrase: e.target.value })}
                  placeholder="Frase para transcrição pelo aluno..."
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Configurações Padrão</h3>
                <p className="text-sm text-muted-foreground">
                  Estas configurações serão aplicadas como padrão para novas questões. Você poderá ajustá-las individualmente para cada questão.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Configurações de Questões Discursivas */}
                  <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      Questões Discursivas (padrão)
                    </Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={examData.discursiveCorrectionMethod}
                      onChange={(e) => setExamData({
                        ...examData,
                        discursiveCorrectionMethod: e.target.value as 'manual' | 'ai'
                      })}
                    >
                      <option value="ai">🤖 Correção por IA</option>
                      <option value="manual">👤 Correção Manual</option>
                    </select>

                    {examData.discursiveCorrectionMethod === 'ai' && (
                      <div className="space-y-2">
                        <Label className="text-xs text-purple-900 dark:text-purple-100">
                          Rigorosidade da IA: {(examData.discursiveAiRigor * 100).toFixed(0)}%
                        </Label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={examData.discursiveAiRigor}
                          onChange={(e) => setExamData({
                            ...examData,
                            discursiveAiRigor: parseFloat(e.target.value)
                          })}
                          className="w-full"
                        />
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          {examData.discursiveAiRigor < 0.3 ? '🟢 Leniente' :
                           examData.discursiveAiRigor < 0.6 ? '🟡 Moderado' :
                           '🔴 Rigoroso'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Configurações de Redação */}
                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Redação (padrão)
                    </Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={examData.essayStyle}
                      onChange={(e) => setExamData({
                        ...examData,
                        essayStyle: e.target.value as EssayStyle
                      })}
                    >
                      <option value="enem">ENEM (1000pts)</option>
                      <option value="uerj">UERJ (20pts)</option>
                    </select>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={examData.essayCorrectionMethod}
                      onChange={(e) => setExamData({
                        ...examData,
                        essayCorrectionMethod: e.target.value as CorrectionMethod
                      })}
                    >
                      <option value="ai">🤖 Correção por IA</option>
                      <option value="manual">👤 Correção Manual</option>
                    </select>

                    {examData.essayCorrectionMethod === 'ai' && (
                      <div className="space-y-2">
                        <Label className="text-xs text-blue-900 dark:text-blue-100">
                          Rigorosidade da IA: {(examData.essayAiRigor * 100).toFixed(0)}%
                        </Label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={examData.essayAiRigor}
                          onChange={(e) => setExamData({
                            ...examData,
                            essayAiRigor: parseFloat(e.target.value)
                          })}
                          className="w-full"
                        />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {examData.essayAiRigor < 0.3 ? '🟢 Leniente' :
                           examData.essayAiRigor < 0.6 ? '🟡 Moderado' :
                           '🔴 Rigoroso'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scoringMethod">Método de Pontuação (Múltipla Escolha) *</Label>
                <select
                  id="scoringMethod"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={examData.scoringMethod}
                  onChange={(e) => setExamData({
                    ...examData,
                    scoringMethod: e.target.value as ScoringMethod,
                    ...(e.target.value === 'tri' && { totalPoints: 1000 })
                  })}
                >
                  <option value="normal">Normal (Pontuação Personalizada)</option>
                  <option value="tri">TRI - Teoria de Resposta ao Item (1000 pontos)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Este método será aplicado às questões de múltipla escolha. TRI calcula pontuação baseado na dificuldade das questões.
                </p>
              </div>

              {examData.scoringMethod === 'normal' && (
                <div className="space-y-2">
                  <Label htmlFor="totalPoints">Pontuação Total *</Label>
                  <Input
                    id="totalPoints"
                    type="number"
                    min="1"
                    value={examData.totalPoints}
                    onChange={(e) => setExamData({ ...examData, totalPoints: parseInt(e.target.value) })}
                  />
                </div>
              )}

              <FileUpload
                label="PDF da Prova (opcional)"
                accept=".pdf,application/pdf"
                value={examData.pdfUrl}
                onChange={(url) => setExamData({ ...examData, pdfUrl: url })}
                placeholder="Cole uma URL ou faça upload do PDF"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gatesOpen">Abertura dos Portões (opcional)</Label>
                  <Input
                    id="gatesOpen"
                    type="datetime-local"
                    value={examData.gatesOpen}
                    onChange={(e) => setExamData({ ...examData, gatesOpen: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gatesClose">Fechamento dos Portões (opcional)</Label>
                  <Input
                    id="gatesClose"
                    type="datetime-local"
                    value={examData.gatesClose}
                    onChange={(e) => setExamData({ ...examData, gatesClose: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Data/Hora de Início *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={examData.startTime}
                    onChange={(e) => setExamData({ ...examData, startTime: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Quando a prova estará disponível para os alunos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duração da Prova (minutos) *</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="1"
                    value={examData.durationMinutes}
                    onChange={(e) => setExamData({ ...examData, durationMinutes: parseInt(e.target.value) || 120 })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {examData.startTime && examData.durationMinutes ? (
                      <>Término: {new Date(new Date(examData.startTime).getTime() + examData.durationMinutes * 60000).toLocaleString('pt-BR')}</>
                    ) : (
                      'Tempo que os alunos terão para completar a prova'
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="navigationMode">Modo de Navegação</Label>
                <select
                  id="navigationMode"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={examData.navigationMode}
                  onChange={(e) => setExamData({ ...examData, navigationMode: e.target.value as 'paginated' | 'scroll' })}
                >
                  <option value="paginated">📄 Paginada (uma questão por vez com botões)</option>
                  <option value="scroll">📜 Scroll (todas as questões visíveis com rolagem)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {examData.navigationMode === 'paginated'
                    ? 'O aluno navegará entre as questões usando botões Anterior/Próximo'
                    : 'Todas as questões ficarão visíveis numa única página. O aluno pode rolar e pular questões livremente'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isHidden"
                  checked={examData.isHidden}
                  onChange={(e) => setExamData({ ...examData, isHidden: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isHidden" className="cursor-pointer">
                  Manter prova oculta (apenas visível para você)
                </Label>
              </div>

              {/* Sistema de Monitoramento (Proctoring) */}
              <div className="border-t pt-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    🎥 Sistema de Monitoramento (Proctoring)
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure o monitoramento em tempo real durante a prova para prevenir fraudes
                  </p>

                  <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    {/* Habilitar Monitoramento */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="proctoringEnabled"
                        checked={examData.proctoringEnabled}
                        onChange={(e) => setExamData({
                          ...examData,
                          proctoringEnabled: e.target.checked,
                          ...(!e.target.checked && {
                            proctoringCamera: false,
                            proctoringAudio: false,
                            proctoringScreen: false,
                          })
                        })}
                        className="mt-1 h-4 w-4 rounded border-input"
                      />
                      <div className="flex-1">
                        <Label htmlFor="proctoringEnabled" className="cursor-pointer font-semibold">
                          Ativar Monitoramento de Prova
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Os alunos precisarão aceitar o termo de consentimento e fornecer as permissões necessárias
                        </p>
                      </div>
                    </div>

                    {examData.proctoringEnabled && (
                      <div className="space-y-3 pl-7">
                        {/* Câmera */}
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="proctoringCamera"
                            checked={examData.proctoringCamera}
                            onChange={(e) => setExamData({ ...examData, proctoringCamera: e.target.checked })}
                            className="mt-1 h-4 w-4 rounded border-input"
                          />
                          <div className="flex-1">
                            <Label htmlFor="proctoringCamera" className="cursor-pointer">
                              📹 Monitoramento por Câmera
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Vídeo do aluno em tempo real. Sistema detecta automaticamente câmera preta/bloqueada.
                            </p>
                          </div>
                        </div>

                        {/* Áudio */}
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="proctoringAudio"
                            checked={examData.proctoringAudio}
                            onChange={(e) => setExamData({ ...examData, proctoringAudio: e.target.checked })}
                            className="mt-1 h-4 w-4 rounded border-input"
                          />
                          <div className="flex-1">
                            <Label htmlFor="proctoringAudio" className="cursor-pointer">
                              🎤 Monitoramento por Áudio
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Transmissão de áudio do ambiente do aluno
                            </p>
                          </div>
                        </div>

                        {/* Transmissão de Tela */}
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="proctoringScreen"
                            checked={examData.proctoringScreen}
                            onChange={(e) => setExamData({ ...examData, proctoringScreen: e.target.checked })}
                            className="mt-1 h-4 w-4 rounded border-input"
                          />
                          <div className="flex-1">
                            <Label htmlFor="proctoringScreen" className="cursor-pointer">
                              🖥️ Transmissão de Tela
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Compartilhamento da tela do aluno
                            </p>
                          </div>
                        </div>

                        {/* Modo de Captura de Tela */}
                        {examData.proctoringScreen && (
                          <div className="space-y-2 pl-6 pt-2">
                            <Label className="text-xs font-semibold">Modo de Captura:</Label>
                            <div className="flex gap-3">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="proctoringScreenMode"
                                  value="window"
                                  checked={examData.proctoringScreenMode === 'window'}
                                  onChange={(e) => setExamData({ ...examData, proctoringScreenMode: 'window' })}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">🪟 Apenas Janela da Prova</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="proctoringScreenMode"
                                  value="screen"
                                  checked={examData.proctoringScreenMode === 'screen'}
                                  onChange={(e) => setExamData({ ...examData, proctoringScreenMode: 'screen' })}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">🖥️ Tela Inteira</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Aviso de Segurança */}
                        {examData.proctoringCamera && (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                            <p className="font-semibold text-yellow-900 dark:text-yellow-100">⚠️ Segurança Automática:</p>
                            <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                              Se a câmera ficar preta/bloqueada por 150 segundos (2min30s), a prova será automaticamente submetida com as respostas atuais.
                            </p>
                          </div>
                        )}

                        {/* Resumo */}
                        {(examData.proctoringCamera || examData.proctoringAudio || examData.proctoringScreen) && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                            <p className="font-semibold text-blue-900 dark:text-blue-100">ℹ️ Resumo:</p>
                            <ul className="text-blue-800 dark:text-blue-200 mt-1 ml-4 list-disc space-y-1">
                              {examData.proctoringCamera && <li>Câmera será exibida no canto superior esquerdo</li>}
                              {examData.proctoringAudio && <li>Áudio será transmitido em tempo real</li>}
                              {examData.proctoringScreen && (
                                <li>
                                  Transmissão de {examData.proctoringScreenMode === 'window' ? 'janela da prova' : 'tela inteira'}
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Adicionar Questões Manualmente</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clique nos botões abaixo para adicionar questões uma por vez:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button onClick={addMultipleChoiceQuestion} variant="outline" className="h-auto py-4 flex-col">
                      <div className="text-2xl mb-2">📝</div>
                      <div className="font-semibold">Múltipla Escolha</div>
                      <div className="text-xs text-muted-foreground mt-1">Questão com alternativas</div>
                    </Button>
                    <Button onClick={addDiscursiveQuestion} variant="outline" className="h-auto py-4 flex-col">
                      <div className="text-2xl mb-2">✏️</div>
                      <div className="font-semibold">Discursiva</div>
                      <div className="text-xs text-muted-foreground mt-1">Resposta aberta</div>
                    </Button>
                    <Button onClick={addEssayQuestion} variant="outline" className="h-auto py-4 flex-col">
                      <div className="text-2xl mb-2">✍️</div>
                      <div className="font-semibold">Redação</div>
                      <div className="text-xs text-muted-foreground mt-1">ENEM ou UERJ</div>
                    </Button>
                  </div>
                </div>

                {questions.length > 0 && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">📋 Questões adicionadas: {questions.length}</p>
                    <div className="flex flex-wrap gap-2">
                      {questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-background rounded text-xs hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors group relative"
                        >
                          <button
                            onClick={() => {
                              setCurrentQuestionIndex(idx)
                              setCurrentStep(2)
                            }}
                            className="inline-flex items-center gap-1 cursor-pointer"
                            title={`Ir para questão ${q.number}`}
                          >
                            <span className="font-semibold">{q.number}.</span>
                            <span>{q.type === 'multiple-choice' ? '📝' : q.type === 'discursive' ? '✏️' : '✍️'}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Deseja realmente excluir a questão ${q.number}?`)) {
                                deleteQuestion(idx)
                              }
                            }}
                            className="ml-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Excluir questão"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <TxtImportUnified
                  onImport={(importedQuestions) => {
                    setQuestions(importedQuestions)
                    setCurrentStep(2)
                    setCurrentQuestionIndex(0)
                  }}
                  defaultAlternatives={examData.numberOfAlternatives}
                  defaultEssayStyle={examData.essayStyle}
                  defaultEssayCorrectionMethod={examData.essayCorrectionMethod}
                  defaultEssayAiRigor={examData.essayAiRigor}
                />
              </div>

              <div className="border-t pt-4">
                <AIQuestionGenerator
                  onQuestionGenerated={(generatedQuestion) => {
                    // Atualizar número da questão
                    const newQuestion = {
                      ...generatedQuestion,
                      number: questions.length + 1,
                    }
                    setQuestions([...questions, newQuestion])
                    setCurrentQuestionIndex(questions.length)
                    if (currentStep === 1) setCurrentStep(2)
                  }}
                  onMultipleQuestionsGenerated={(generatedQuestions) => {
                    // Adicionar múltiplas questões
                    const newQuestions = generatedQuestions.map((q, idx) => ({
                      ...q,
                      number: questions.length + idx + 1,
                    }))
                    setQuestions([...questions, ...newQuestions])
                    setCurrentQuestionIndex(questions.length)
                    if (currentStep === 1) setCurrentStep(2)
                  }}
                  numberOfAlternatives={examData.numberOfAlternatives}
                  useTRI={examData.scoringMethod === 'tri'}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && currentQuestion && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Questão {currentQuestion.number} de {questions.length}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {currentQuestionIndex + 1}/{questions.length}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Enunciado *</Label>
                  <Textarea
                    value={currentQuestion.statement}
                    onChange={(e) => updateQuestion(currentQuestionIndex, { statement: e.target.value })}
                    placeholder="Digite o enunciado da questão..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fonte do Enunciado (opcional)</Label>
                  <Input
                    value={currentQuestion.statementSource || ''}
                    onChange={(e) => updateQuestion(currentQuestionIndex, { statementSource: e.target.value })}
                    placeholder="Ex: ENEM 2023"
                  />
                </div>

                <FileUpload
                  label="Imagem da Questão (opcional)"
                  accept="image/*"
                  value={currentQuestion.imageUrl || ''}
                  onChange={(url) => updateQuestion(currentQuestionIndex, { imageUrl: url })}
                  supportPaste={true}
                  placeholder="Cole uma URL ou faça upload da imagem"
                />

                <div className="space-y-2">
                  <Label>Fonte da Imagem (opcional)</Label>
                  <Input
                    value={currentQuestion.imageSource || ''}
                    onChange={(e) => updateQuestion(currentQuestionIndex, { imageSource: e.target.value })}
                    placeholder="Ex: Wikipedia"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Comando da Questão *</Label>
                  <Input
                    value={currentQuestion.command}
                    onChange={(e) => updateQuestion(currentQuestionIndex, { command: e.target.value })}
                    placeholder="Ex: Assinale a alternativa correta"
                  />
                </div>

                {currentQuestion.type === 'multiple-choice' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Alternativas *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => shuffleAlternatives(currentQuestionIndex)}
                        className="h-7"
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Embaralhar
                      </Button>
                    </div>
                    {currentQuestion.alternatives.map((alt, altIndex) => (
                      <div key={alt.id} className="flex items-start space-x-2">
                        <input
                          type="radio"
                          name={`correct-${currentQuestionIndex}`}
                          checked={alt.isCorrect}
                          onChange={() => setCorrectAlternative(currentQuestionIndex, altIndex)}
                          className="mt-3 h-4 w-4"
                          title="Marcar como correta"
                        />
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">
                            Alternativa {alt.letter}
                          </Label>
                          <Textarea
                            value={alt.text}
                            onChange={(e) => updateAlternative(currentQuestionIndex, altIndex, e.target.value)}
                            placeholder={`Digite a alternativa ${alt.letter}...`}
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Selecione o botão de rádio para marcar a alternativa correta
                    </p>
                  </div>
                )}

                {currentQuestion.type === 'discursive' && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxScore">Pontuação Máxima *</Label>
                      <Input
                        id="maxScore"
                        type="number"
                        min="1"
                        step="0.5"
                        value={currentQuestion.maxScore || 10}
                        onChange={(e) => updateQuestion(currentQuestionIndex, { maxScore: parseFloat(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Nota máxima que o aluno pode receber nesta questão
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label>Pontos-Chave para Correção *</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Digite um ponto-chave por linha no formato: <strong>Descrição - Peso</strong>
                        <br />
                        Exemplo: <code className="text-xs bg-muted px-1 py-0.5 rounded">Mencionar a Lei de Newton - 0.3</code>
                      </p>
                      <Textarea
                        value={currentQuestion.keyPoints?.map(kp => `${kp.description} - ${kp.weight}`).join('\n') || ''}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').filter(line => line.trim())
                          const keyPoints: KeyPoint[] = []

                          for (const line of lines) {
                            const parts = line.split('-').map(p => p.trim())
                            if (parts.length >= 2) {
                              const description = parts.slice(0, -1).join('-').trim()
                              const weight = parseFloat(parts[parts.length - 1])

                              if (description && !isNaN(weight)) {
                                keyPoints.push({
                                  id: uuidv4(),
                                  description,
                                  weight
                                })
                              }
                            }
                          }

                          updateQuestion(currentQuestionIndex, { keyPoints })
                        }}
                        placeholder="Mencionar a Lei de Newton - 0.3&#10;Explicar força resultante - 0.4&#10;Dar exemplo prático - 0.3"
                        rows={8}
                        className="font-mono text-sm"
                      />

                      {currentQuestion.keyPoints && currentQuestion.keyPoints.length > 0 && (
                        <div className="space-y-2 p-3 bg-muted rounded-lg">
                          <p className="text-xs font-semibold">Preview dos Pontos-Chave:</p>
                          {currentQuestion.keyPoints.map((kp, idx) => (
                            <div key={kp.id} className="text-xs flex items-start gap-2">
                              <span className="font-semibold">{idx + 1}.</span>
                              <span className="flex-1">{kp.description}</span>
                              <span className="text-muted-foreground">
                                {(kp.weight * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                          <p className="text-xs font-semibold pt-2 border-t">
                            Total: {((currentQuestion.keyPoints.reduce((sum, kp) => sum + kp.weight, 0)) * 100).toFixed(0)}%
                            {Math.abs(currentQuestion.keyPoints.reduce((sum, kp) => sum + kp.weight, 0) - 1) > 0.01 && (
                              <span className="text-destructive ml-2">⚠️ Deve somar 100%</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'essay' && (
                  <div className="space-y-4 border-t pt-4 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      ✍️ Configuração da Redação
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="essayTheme">Tema da Redação *</Label>
                      <Textarea
                        id="essayTheme"
                        value={currentQuestion.essayTheme || ''}
                        onChange={(e) => updateQuestion(currentQuestionIndex, { essayTheme: e.target.value })}
                        placeholder="Ex: Os desafios para a valorização da saúde mental no Brasil"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Este é o tema que será apresentado ao aluno para desenvolvimento da redação
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="essaySupportTexts">Textos de Apoio (Textos Motivadores)</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Digite um texto de apoio por linha. Estes textos ajudam o aluno a contextualizar o tema.
                      </p>
                      <Textarea
                        id="essaySupportTexts"
                        value={currentQuestion.essaySupportTexts?.join('\n\n---\n\n') || ''}
                        onChange={(e) => {
                          const texts = e.target.value
                            .split('---')
                            .map(t => t.trim())
                            .filter(t => t.length > 0)
                          updateQuestion(currentQuestionIndex, { essaySupportTexts: texts })
                        }}
                        placeholder="Texto 1: Dados estatísticos sobre saúde mental no Brasil...&#10;&#10;---&#10;&#10;Texto 2: Trecho de artigo científico sobre o tema...&#10;&#10;---&#10;&#10;Texto 3: Citação de especialista..."
                        rows={12}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use <code className="bg-muted px-1 rounded">---</code> para separar diferentes textos de apoio
                      </p>
                      {currentQuestion.essaySupportTexts && currentQuestion.essaySupportTexts.length > 0 && (
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                            📝 {currentQuestion.essaySupportTexts.length} texto(s) de apoio configurado(s)
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                        ℹ️ Informações da Correção:
                      </p>
                      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
                        <li><strong>Estilo:</strong> {currentQuestion.essayStyle === 'enem' ? 'ENEM (1000 pontos)' : 'UERJ (20 pontos)'}</li>
                        <li><strong>Método:</strong> {currentQuestion.essayCorrectionMethod === 'ai' ? 'IA (Gemini 2.0)' : 'Manual'}</li>
                        {currentQuestion.essayCorrectionMethod === 'ai' && (
                          <li><strong>Rigor da IA:</strong> {((currentQuestion.essayAiRigor || 0.45) * 100).toFixed(0)}%</li>
                        )}
                      </ul>
                      <p className="text-xs text-blue-700 dark:text-blue-300 pt-2">
                        💡 Para alterar o estilo ou método de correção, volte às configurações gerais da prova
                      </p>
                    </div>
                  </div>
                )}

                {examData.scoringMethod === 'tri' && currentQuestion.type === 'multiple-choice' && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Parâmetros TRI</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => randomizeTRIParameters(currentQuestionIndex)}
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Aleatorizar
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Discriminação (a)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentQuestion.triDiscrimination || 1}
                          onChange={(e) => updateQuestion(currentQuestionIndex, {
                            triDiscrimination: parseFloat(e.target.value)
                          })}
                        />
                        <p className="text-xs text-muted-foreground">
                          0.5 - 2.5 (maior = mais discriminativa)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Dificuldade (b)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentQuestion.triDifficulty || 0}
                          onChange={(e) => updateQuestion(currentQuestionIndex, {
                            triDifficulty: parseFloat(e.target.value)
                          })}
                        />
                        <p className="text-xs text-muted-foreground">
                          -3 a +3 (maior = mais difícil)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Acerto ao Acaso (c)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentQuestion.triGuessing || 0.2}
                          onChange={(e) => updateQuestion(currentQuestionIndex, {
                            triGuessing: parseFloat(e.target.value)
                          })}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">
                          Calculado automaticamente
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              {/* Navegação entre questões */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar às Configurações
                  </Button>
                  {currentQuestionIndex > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                    >
                      ← Anterior
                    </Button>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir a questão ${currentQuestion.number}?`)) {
                        deleteQuestion(currentQuestionIndex)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                  {currentQuestionIndex < questions.length - 1 && (
                    <Button
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    >
                      Próxima →
                    </Button>
                  )}
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-between gap-3 pt-2 border-t">
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={addMultipleChoiceQuestion} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Múltipla Escolha
                  </Button>
                  <Button onClick={addDiscursiveQuestion} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Discursiva
                  </Button>
                  <Button onClick={addEssayQuestion} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Redação
                  </Button>
                  {questions.some(q => q.type === 'multiple-choice') && (
                    <Button
                      onClick={shuffleAllAlternatives}
                      variant="outline"
                      size="sm"
                      className="border-purple-500 text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950"
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      Embaralhar Todas Alternativas
                    </Button>
                  )}
                </div>
                <Button onClick={handleSubmit} disabled={loading} size="lg">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Prova'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
