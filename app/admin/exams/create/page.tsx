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
import { TxtImport } from '@/components/txt-import'
import { TxtImportDiscursive } from '@/components/txt-import-discursive'
import { Question, Alternative, ScoringMethod, QuestionType, KeyPoint } from '@/lib/types'
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
    numberOfQuestions: 10,
    numberOfAlternatives: 5,
    themePhrase: '',
    scoringMethod: 'normal' as ScoringMethod,
    totalPoints: 100,
    pdfUrl: '',
    gatesOpen: '',
    gatesClose: '',
    startTime: '',
    endTime: '',
    isHidden: false,
    questionType: 'multiple-choice' as QuestionType,
    discursiveCorrectionMethod: 'ai' as 'manual' | 'ai',
    aiRigor: 0.45,
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  function initializeQuestions() {
    const newQuestions: Question[] = []
    const letters = ['A', 'B', 'C', 'D', 'E']

    for (let i = 0; i < examData.numberOfQuestions; i++) {
      const baseQuestion = {
        id: uuidv4(),
        number: i + 1,
        type: examData.questionType,
        statement: '',
        statementSource: '',
        imageUrl: '',
        imageSource: '',
        command: '',
        alternatives: [],
      }

      if (examData.questionType === 'multiple-choice') {
        // Questões de múltipla escolha
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

        newQuestions.push({
          ...baseQuestion,
          alternatives,
          ...(examData.scoringMethod === 'tri' && {
            triDiscrimination: triParams.a,
            triDifficulty: triParams.b,
            triGuessing: triParams.c,
          }),
        })
      } else {
        // Questões discursivas
        newQuestions.push({
          ...baseQuestion,
          keyPoints: [],
          maxScore: 10, // Pontuação padrão
        })
      }
    }

    setQuestions(newQuestions)
    setCurrentStep(2)
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

  async function handleSubmit() {
    setLoading(true)

    try {
      // Validação básica
      if (!examData.title || !examData.startTime || !examData.endTime) {
        alert('Preencha todos os campos obrigatórios')
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
        }
      }

      const payload = {
        ...examData,
        questions,
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfQuestions">Número de Questões *</Label>
                  <Input
                    id="numberOfQuestions"
                    type="number"
                    min="1"
                    max="200"
                    value={examData.numberOfQuestions}
                    onChange={(e) => setExamData({ ...examData, numberOfQuestions: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfAlternatives">Alternativas por Questão *</Label>
                  <select
                    id="numberOfAlternatives"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={examData.numberOfAlternatives}
                    onChange={(e) => setExamData({ ...examData, numberOfAlternatives: parseInt(e.target.value) })}
                  >
                    <option value="2">2 (A, B)</option>
                    <option value="3">3 (A, B, C)</option>
                    <option value="4">4 (A, B, C, D)</option>
                    <option value="5">5 (A, B, C, D, E)</option>
                  </select>
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="questionType">Tipo de Questões *</Label>
                <select
                  id="questionType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={examData.questionType}
                  onChange={(e) => setExamData({
                    ...examData,
                    questionType: e.target.value as QuestionType,
                    // Se mudar para discursiva, desabilitar TRI
                    ...(e.target.value === 'discursive' && examData.scoringMethod === 'tri' && { scoringMethod: 'normal' })
                  })}
                >
                  <option value="multiple-choice">Múltipla Escolha</option>
                  <option value="discursive">Discursivas (Redação/Dissertação)</option>
                </select>
              </div>

              {examData.questionType === 'discursive' && (
                <div className="border-t pt-4 space-y-4 bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                    Configurações de Correção Discursiva
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="discursiveCorrectionMethod">Método de Correção *</Label>
                    <select
                      id="discursiveCorrectionMethod"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={examData.discursiveCorrectionMethod}
                      onChange={(e) => setExamData({
                        ...examData,
                        discursiveCorrectionMethod: e.target.value as 'manual' | 'ai'
                      })}
                    >
                      <option value="ai">🤖 Correção Automática por IA (Gemini 2.0)</option>
                      <option value="manual">👤 Correção Manual pelo Professor</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      {examData.discursiveCorrectionMethod === 'ai'
                        ? 'As questões serão corrigidas automaticamente pela IA assim que o aluno submeter a prova.'
                        : 'Você precisará corrigir manualmente cada questão discursiva na área de correções.'}
                    </p>
                  </div>

                  {examData.discursiveCorrectionMethod === 'ai' && (
                    <div className="space-y-2">
                      <Label htmlFor="aiRigor">
                        Rigor da IA: {(examData.aiRigor * 100).toFixed(0)}%
                      </Label>
                      <input
                        id="aiRigor"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={examData.aiRigor}
                        onChange={(e) => setExamData({
                          ...examData,
                          aiRigor: parseFloat(e.target.value)
                        })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Leniente (aceita menções parciais)</span>
                        <span>Moderado (exige clareza)</span>
                        <span>Rigoroso (exige precisão)</span>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        Recomendado: 45% (moderado) - A IA analisa se o aluno mencionou os pontos-chave esperados
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="scoringMethod">Método de Pontuação *</Label>
                <select
                  id="scoringMethod"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={examData.scoringMethod}
                  onChange={(e) => setExamData({
                    ...examData,
                    scoringMethod: e.target.value as ScoringMethod,
                    ...(e.target.value === 'tri' && { totalPoints: 1000 })
                  })}
                  disabled={examData.questionType === 'discursive'}
                >
                  <option value="normal">Normal (Pontuação Personalizada)</option>
                  <option value="tri" disabled={examData.questionType === 'discursive'}>
                    TRI - Teoria de Resposta ao Item (1000 pontos)
                  </option>
                </select>
                {examData.questionType === 'discursive' && (
                  <p className="text-xs text-muted-foreground">
                    TRI não está disponível para questões discursivas
                  </p>
                )}
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
                  <Label htmlFor="startTime">Início da Prova *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={examData.startTime}
                    onChange={(e) => setExamData({ ...examData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Término da Prova *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={examData.endTime}
                    onChange={(e) => setExamData({ ...examData, endTime: e.target.value })}
                    required
                  />
                </div>
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

              {examData.questionType === 'multiple-choice' ? (
                <TxtImport
                  numberOfQuestions={examData.numberOfQuestions}
                  numberOfAlternatives={examData.numberOfAlternatives}
                  onImport={(importedQuestions) => {
                    setQuestions(importedQuestions)
                    setCurrentStep(2)
                    setCurrentQuestionIndex(0)
                  }}
                />
              ) : (
                <TxtImportDiscursive
                  numberOfQuestions={examData.numberOfQuestions}
                  onImport={(importedQuestions) => {
                    setQuestions(importedQuestions)
                    setCurrentStep(2)
                    setCurrentQuestionIndex(0)
                  }}
                />
              )}

              <Button onClick={initializeQuestions} className="w-full" size="lg">
                Próximo: Adicionar Questões Manualmente
                <Plus className="ml-2 h-5 w-5" />
              </Button>
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
                    <Label>Alternativas *</Label>
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

            <div className="flex justify-between">
              <div className="flex space-x-2">
                {currentQuestionIndex === 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar às Configurações
                  </Button>
                )}
                {currentQuestionIndex > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  >
                    Questão Anterior
                  </Button>
                )}
              </div>

              <div className="flex space-x-2">
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button onClick={handleSubmit} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Prova'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  >
                    Próxima Questão
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
