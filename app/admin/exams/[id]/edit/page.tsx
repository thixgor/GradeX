'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'
import { FileUpload } from '@/components/file-upload'
import { Question, Alternative, ScoringMethod, Exam, QuestionType, KeyPoint, EssayStyle, CorrectionMethod, AlternativeType } from '@/lib/types'
import { generateRandomTRIParameters } from '@/lib/tri-calculator'
import { ArrowLeft, Shuffle, Save, ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

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
    durationMinutes: 120,
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
    // Configurações adicionais
    isPracticeExam: false,
    allowCustomName: false,
    requireSignature: false,
    shuffleQuestions: false,
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
        // Verificar se é a data futura padrão (provas práticas)
        const year = d.getFullYear()
        if (year === 2099) return '' // Não mostrar data para provas práticas
        return d.toISOString().slice(0, 16)
      }

      // Calcular duration em minutos
      const duration = exam.duration || 120

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
        durationMinutes: duration,
        isHidden: exam.isHidden,
        discursiveCorrectionMethod: exam.discursiveCorrectionMethod || 'ai',
        discursiveAiRigor: exam.aiRigor || 0.45,
        essayStyle: 'enem' as EssayStyle,
        essayCorrectionMethod: 'ai' as CorrectionMethod,
        essayAiRigor: 0.45,
        navigationMode: exam.navigationMode || 'paginated',
        // Sistema de monitoramento
        proctoringEnabled: exam.proctoring?.enabled || false,
        proctoringCamera: exam.proctoring?.camera || false,
        proctoringAudio: exam.proctoring?.audio || false,
        proctoringScreen: exam.proctoring?.screen || false,
        proctoringScreenMode: exam.proctoring?.screenMode || 'window',
        // Configurações adicionais
        isPracticeExam: exam.isPracticeExam || false,
        allowCustomName: exam.allowCustomName || false,
        requireSignature: exam.requireSignature !== false, // Default true para compatibilidade
        shuffleQuestions: exam.shuffleQuestions || false,
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

  function swapQuestions(index1: number, index2: number) {
    if (index1 < 0 || index1 >= questions.length || index2 < 0 || index2 >= questions.length) return

    const newQuestions = [...questions]
    // Trocar as questões
    ;[newQuestions[index1], newQuestions[index2]] = [newQuestions[index2], newQuestions[index1]]

    // Renumerar todas as questões
    newQuestions.forEach((q, i) => {
      q.number = i + 1
    })

    setQuestions(newQuestions)

    // Atualizar o índice atual para seguir a questão
    setCurrentQuestionIndex(index2)
  }

  async function handleSubmit() {
    setSaving(true)

    try {
      // Validação básica
      if (!examData.title) {
        alert('Preencha o título da prova')
        return
      }

      // Se não for prova prática, exigir data de início
      if (!examData.isPracticeExam && !examData.startTime) {
        alert('Preencha a data/hora de início da prova (ou marque como prova prática)')
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
        } else if (question.type === 'essay') {
          if (!question.essayTheme || !question.essayTheme.trim()) {
            alert(`Questão ${question.number}: Preencha o tema da redação`)
            return
          }
        }
      }

      // Calcular endTime baseado em startTime + durationMinutes (se não for prova prática)
      let endTimeISO = null
      if (!examData.isPracticeExam && examData.startTime) {
        const startDate = new Date(examData.startTime)
        const endDate = new Date(startDate.getTime() + examData.durationMinutes * 60000)
        endTimeISO = endDate.toISOString()
      }

      const payload = {
        ...examData,
        endTime: endTimeISO,
        duration: examData.durationMinutes,
        numberOfQuestions: questions.length,
        questions,
        // Garantir que os campos de proctoring sejam enviados
        proctoringEnabled: examData.proctoringEnabled,
        proctoringCamera: examData.proctoringCamera,
        proctoringAudio: examData.proctoringAudio,
        proctoringScreen: examData.proctoringScreen,
        proctoringScreenMode: examData.proctoringScreenMode,
        // Novos campos
        isPracticeExam: examData.isPracticeExam,
        allowCustomName: examData.allowCustomName,
        requireSignature: examData.requireSignature,
        shuffleQuestions: examData.shuffleQuestions,
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
    return <LogoLoading message="Carregando..." size="lg" fullscreen />
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

              {examData.isPracticeExam && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    ℹ️ <strong>Modo Prova Prática ativado:</strong> As datas de início/fim e portões são opcionais. A prova ficará disponível permanentemente e os alunos poderão fazer múltiplas tentativas.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gatesOpen">
                    Abertura dos Portões {!examData.isPracticeExam && '(opcional)'}
                  </Label>
                  <Input
                    id="gatesOpen"
                    type="datetime-local"
                    value={examData.gatesOpen}
                    onChange={(e) => setExamData({ ...examData, gatesOpen: e.target.value })}
                    disabled={examData.isPracticeExam}
                  />
                  {examData.isPracticeExam && (
                    <p className="text-xs text-muted-foreground">
                      Desabilitado em provas práticas
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gatesClose">
                    Fechamento dos Portões {!examData.isPracticeExam && '(opcional)'}
                  </Label>
                  <Input
                    id="gatesClose"
                    type="datetime-local"
                    value={examData.gatesClose}
                    onChange={(e) => setExamData({ ...examData, gatesClose: e.target.value })}
                    disabled={examData.isPracticeExam}
                  />
                  {examData.isPracticeExam && (
                    <p className="text-xs text-muted-foreground">
                      Desabilitado em provas práticas
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">
                    Data/Hora de Início {examData.isPracticeExam ? '(opcional)' : '*'}
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={examData.startTime}
                    onChange={(e) => setExamData({ ...examData, startTime: e.target.value })}
                    required={!examData.isPracticeExam}
                    disabled={examData.isPracticeExam}
                  />
                  <p className="text-xs text-muted-foreground">
                    {examData.isPracticeExam
                      ? 'Desabilitado em provas práticas - disponível permanentemente'
                      : 'Quando a prova estará disponível para os alunos'}
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
                    {examData.startTime && examData.durationMinutes && !examData.isPracticeExam ? (
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
                  value={examData.navigationMode}
                  onChange={(e) => setExamData({ ...examData, navigationMode: e.target.value as 'paginated' | 'scroll' })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="paginated">Paginado (uma questão por vez)</option>
                  <option value="scroll">Scroll (todas as questões visíveis)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {examData.navigationMode === 'paginated'
                    ? 'O aluno verá uma questão por vez e navegará com botões'
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

              {/* Configurações Adicionais */}
              <div className="border-t pt-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    ⚙️ Configurações Adicionais
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Personalize o comportamento e requisitos da prova
                  </p>

                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    {/* Prova Prática/Treino */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="isPracticeExam"
                        checked={examData.isPracticeExam}
                        onChange={(e) => setExamData({
                          ...examData,
                          isPracticeExam: e.target.checked,
                          ...(e.target.checked && {
                            startTime: '',
                            gatesOpen: '',
                            gatesClose: '',
                          })
                        })}
                        className="mt-1 h-4 w-4 rounded border-input"
                      />
                      <div className="flex-1">
                        <Label htmlFor="isPracticeExam" className="cursor-pointer font-semibold">
                          🎯 Prova Prática/Treino
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Permite múltiplas tentativas e não exige datas de início/fim. Ideal para simulados e treinos.
                        </p>
                      </div>
                    </div>

                    {/* Nome Customizado */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="allowCustomName"
                        checked={examData.allowCustomName}
                        onChange={(e) => setExamData({ ...examData, allowCustomName: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-input"
                      />
                      <div className="flex-1">
                        <Label htmlFor="allowCustomName" className="cursor-pointer font-semibold">
                          ✏️ Permitir Nome Customizado
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          O aluno poderá digitar um nome diferente do cadastrado no início da prova
                        </p>
                      </div>
                    </div>

                    {/* Assinatura Obrigatória */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="requireSignature"
                        checked={examData.requireSignature}
                        onChange={(e) => setExamData({ ...examData, requireSignature: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-input"
                      />
                      <div className="flex-1">
                        <Label htmlFor="requireSignature" className="cursor-pointer font-semibold">
                          ✍️ Exigir Assinatura Digital
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          O aluno deverá assinar (desenhar) antes de iniciar. A assinatura aparecerá no PDF e relatórios.
                        </p>
                      </div>
                    </div>

                    {/* Embaralhar Questões */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="shuffleQuestions"
                        checked={examData.shuffleQuestions}
                        onChange={(e) => setExamData({ ...examData, shuffleQuestions: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-input"
                      />
                      <div className="flex-1">
                        <Label htmlFor="shuffleQuestions" className="cursor-pointer font-semibold">
                          🔀 Embaralhar Ordem das Questões
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          A ordem das questões será randomizada para cada aluno (gabarito e alternativas não mudam)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="proctoringEnabled"
                        checked={examData.proctoringEnabled}
                        onChange={(e) => setExamData({ ...examData, proctoringEnabled: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-input"
                      />
                      <div className="flex-1">
                        <Label htmlFor="proctoringEnabled" className="cursor-pointer font-semibold">
                          Ativar Monitoramento
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Habilita o sistema de proctoring para esta prova
                        </p>
                      </div>
                    </div>

                    {examData.proctoringEnabled && (
                      <div className="ml-7 space-y-3 p-4 bg-muted rounded-lg border">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="proctoringCamera"
                            checked={examData.proctoringCamera}
                            onChange={(e) => setExamData({ ...examData, proctoringCamera: e.target.checked })}
                            className="mt-1 h-4 w-4 rounded border-input"
                          />
                          <div className="flex-1">
                            <Label htmlFor="proctoringCamera" className="cursor-pointer font-semibold">
                              📹 Câmera
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Transmite vídeo da câmera do aluno em tempo real
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="proctoringAudio"
                            checked={examData.proctoringAudio}
                            onChange={(e) => setExamData({ ...examData, proctoringAudio: e.target.checked })}
                            className="mt-1 h-4 w-4 rounded border-input"
                          />
                          <div className="flex-1">
                            <Label htmlFor="proctoringAudio" className="cursor-pointer font-semibold">
                              🎤 Áudio
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Transmite áudio do microfone do aluno
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="proctoringScreen"
                            checked={examData.proctoringScreen}
                            onChange={(e) => setExamData({ ...examData, proctoringScreen: e.target.checked })}
                            className="mt-1 h-4 w-4 rounded border-input"
                          />
                          <div className="flex-1">
                            <Label htmlFor="proctoringScreen" className="cursor-pointer font-semibold">
                              🖥️ Compartilhamento de Tela
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Transmite a tela do aluno
                            </p>
                          </div>
                        </div>

                        {examData.proctoringScreen && (
                          <div className="ml-7 space-y-2">
                            <Label>Modo de Compartilhamento</Label>
                            <select
                              value={examData.proctoringScreenMode}
                              onChange={(e) => setExamData({ ...examData, proctoringScreenMode: e.target.value as 'window' | 'screen' })}
                              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                            >
                              <option value="window">Janela da Prova</option>
                              <option value="screen">Tela Inteira</option>
                            </select>
                            <p className="text-xs text-muted-foreground">
                              {examData.proctoringScreenMode === 'window'
                                ? 'Compartilha apenas a janela do navegador com a prova'
                                : 'Compartilha toda a tela do computador do aluno'}
                            </p>
                          </div>
                        )}

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
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => swapQuestions(currentQuestionIndex, currentQuestionIndex - 1)}
                        disabled={currentQuestionIndex === 0}
                        title="Mover questão para cima"
                        className="h-8 w-8 p-0"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => swapQuestions(currentQuestionIndex, currentQuestionIndex + 1)}
                        disabled={currentQuestionIndex === questions.length - 1}
                        title="Mover questão para baixo"
                        className="h-8 w-8 p-0"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentQuestionIndex + 1}/{questions.length}
                    </div>
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
