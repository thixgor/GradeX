'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { FileUpload } from '@/components/file-upload'
import { Question, Alternative, ScoringMethod, Exam } from '@/lib/types'
import { generateRandomTRIParameters } from '@/lib/tri-calculator'
import { ArrowLeft, Shuffle, Save } from 'lucide-react'

export default function EditExamPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    loadExam()
  }, [id])

  async function loadExam() {
    try {
      const res = await fetch(`/api/exams/${id}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      const exam: Exam = data.exam

      // Formata datas para datetime-local
      const formatDateTime = (date: Date | string) => {
        const d = new Date(date)
        return d.toISOString().slice(0, 16)
      }

      setExamData({
        title: exam.title,
        description: exam.description || '',
        coverImage: exam.coverImage || '',
        numberOfQuestions: exam.numberOfQuestions,
        numberOfAlternatives: exam.numberOfAlternatives,
        themePhrase: exam.themePhrase || '',
        scoringMethod: exam.scoringMethod,
        totalPoints: exam.totalPoints || 100,
        pdfUrl: exam.pdfUrl || '',
        gatesOpen: exam.gatesOpen ? formatDateTime(exam.gatesOpen) : '',
        gatesClose: exam.gatesClose ? formatDateTime(exam.gatesClose) : '',
        startTime: formatDateTime(exam.startTime),
        endTime: formatDateTime(exam.endTime),
        isHidden: exam.isHidden,
      })

      setQuestions(exam.questions)
    } catch (error: any) {
      alert(error.message)
      router.push('/admin/exams')
    } finally {
      setLoading(false)
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

  async function handleSubmit() {
    setSaving(true)

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
      }

      const payload = {
        ...examData,
        questions,
      }

      const res = await fetch(`/api/exams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar prova')
      }

      alert('Prova atualizada com sucesso!')
      router.push('/admin/exams')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando prova...</div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/exams')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Editar Prova</h1>
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
                Edite os dados básicos da prova
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
                <Label htmlFor="themePhrase">Frase-Tema (opcional)</Label>
                <Input
                  id="themePhrase"
                  value={examData.themePhrase}
                  onChange={(e) => setExamData({ ...examData, themePhrase: e.target.value })}
                  placeholder="Frase para transcrição pelo aluno..."
                />
              </div>

              <div className="space-y-2">
                <Label>Método de Pontuação (não editável)</Label>
                <Input
                  value={examData.scoringMethod === 'tri' ? 'TRI - 1000 pontos' : `Normal - ${examData.totalPoints} pontos`}
                  disabled
                />
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

              <Button onClick={() => setCurrentStep(2)} className="w-full" size="lg">
                Próximo: Editar Questões
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
                </div>

                {examData.scoringMethod === 'tri' && (
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
                      </div>

                      <div className="space-y-2">
                        <Label>Acerto ao Acaso (c)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={currentQuestion.triGuessing || 0.2}
                          disabled
                        />
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
                  <Button onClick={handleSubmit} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
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
