'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2, Settings } from 'lucide-react'
import { Question, CustomContext, AlternativeType } from '@/lib/types'
import { CustomContextsManager } from './custom-contexts-manager'

interface AIQuestionGeneratorProps {
  onQuestionGenerated: (question: Question) => void
  onMultipleQuestionsGenerated?: (questions: Question[]) => void
  numberOfAlternatives: number
  useTRI: boolean
}

export function AIQuestionGenerator({
  onQuestionGenerated,
  onMultipleQuestionsGenerated,
  numberOfAlternatives,
  useTRI,
}: AIQuestionGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'discursive'>('multiple-choice')
  const [style, setStyle] = useState<'contextualizada' | 'rapida'>('contextualizada')
  const [subject, setSubject] = useState('')
  const [difficulty, setDifficulty] = useState(0.5) // 50% padrão
  const [error, setError] = useState('')

  // Novos estados para geração múltipla
  const [quantity, setQuantity] = useState(1)
  const [multipleSubjects, setMultipleSubjects] = useState('')
  const [randomDifficulty, setRandomDifficulty] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)

  // Novos estados para tipos de alternativas e questões mistas
  const [alternativeType, setAlternativeType] = useState<AlternativeType>('standard')
  const [mixedStyles, setMixedStyles] = useState(false) // Misturar contextualizadas e rápidas

  // Contexto da questão
  const [questionContext, setQuestionContext] = useState<'enem' | 'uerj' | 'outros'>('enem')
  const [customContext, setCustomContext] = useState('')
  const [savedContexts, setSavedContexts] = useState<CustomContext[]>([])
  const [selectedSavedContext, setSelectedSavedContext] = useState<string>('')
  const [showContextManager, setShowContextManager] = useState(false)

  // Carregar contextos salvos
  useEffect(() => {
    fetchSavedContexts()
  }, [])

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

  async function handleGenerate() {
    const isMultipleMode = quantity > 1 || multipleSubjects.trim().length > 0

    // Validações
    if (isMultipleMode) {
      if (!multipleSubjects.trim()) {
        setError('Por favor, especifique os temas separados por ponto-e-vírgula (;)')
        return
      }
      if (quantity < 1 || quantity > 50) {
        setError('A quantidade deve estar entre 1 e 50 questões')
        return
      }
    } else {
      if (!subject.trim()) {
        setError('Por favor, especifique o tema/assunto da questão')
        return
      }
    }

    // Validar contexto customizado
    if (questionContext === 'outros' && !selectedSavedContext && !customContext.trim()) {
      setError('Por favor, selecione ou especifique o contexto personalizado da questão')
      return
    }

    setGenerating(true)
    setError('')
    setCurrentProgress(0)

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

      if (isMultipleMode) {
        // Modo múltiplo - gerar uma por vez para mostrar progresso
        const subjects = multipleSubjects.split(';').map(s => s.trim()).filter(s => s.length > 0)
        const generatedQuestions = []

        for (let i = 0; i < quantity; i++) {
          setCurrentProgress(i + 1)

          // Distribuir temas homogeneamente
          const subjectIndex = i % subjects.length
          const currentSubject = subjects[subjectIndex]

          // Dificuldade aleatória ou fixa
          const currentDifficulty = randomDifficulty ? Math.random() : difficulty

          // Estilo misto ou fixo
          const currentStyle = mixedStyles ? (i % 2 === 0 ? 'contextualizada' : 'rapida') : style

          const response = await fetch('/api/questions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: questionType,
              style: currentStyle,
              subject: currentSubject,
              difficulty: currentDifficulty,
              context,
              numberOfAlternatives: questionType === 'multiple-choice' ? numberOfAlternatives : undefined,
              useTRI: questionType === 'multiple-choice' ? useTRI : undefined,
              alternativeType: questionType === 'multiple-choice' ? alternativeType : undefined,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || `Erro ao gerar questão ${i + 1}`)
          }

          generatedQuestions.push(data.question)
        }

        // Retornar todas as questões geradas
        if (onMultipleQuestionsGenerated) {
          onMultipleQuestionsGenerated(generatedQuestions)
        }
        setMultipleSubjects('')
      } else {
        // Modo único
        const response = await fetch('/api/questions/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: questionType,
            style,
            subject: subject.trim(),
            difficulty,
            context,
            numberOfAlternatives: questionType === 'multiple-choice' ? numberOfAlternatives : undefined,
            useTRI: questionType === 'multiple-choice' ? useTRI : undefined,
            alternativeType: questionType === 'multiple-choice' ? alternativeType : undefined,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao gerar questão')
        }

        onQuestionGenerated(data.question)
        setSubject('')
      }

      setError('')
    } catch (error: any) {
      console.error('Erro ao gerar questão:', error)
      setError(error.message || 'Erro ao gerar questão(ões). Tente novamente.')
    } finally {
      setGenerating(false)
      setCurrentProgress(0)
    }
  }

  const difficultyLabel =
    difficulty < 0.3 ? 'Fácil' :
    difficulty < 0.6 ? 'Médio' :
    difficulty < 0.8 ? 'Difícil' : 'Muito Difícil'

  return (
    <>
    <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <CardTitle>Gerador de Questões por IA</CardTitle>
        </div>
        <CardDescription>
          Use inteligência artificial para gerar questões objetivas ou discursivas automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de Questão */}
        <div className="space-y-2">
          <Label>Tipo de Questão</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={questionType === 'multiple-choice' ? 'default' : 'outline'}
              onClick={() => setQuestionType('multiple-choice')}
              disabled={generating}
              className="w-full"
            >
              📝 Múltipla Escolha
            </Button>
            <Button
              type="button"
              variant={questionType === 'discursive' ? 'default' : 'outline'}
              onClick={() => setQuestionType('discursive')}
              disabled={generating}
              className="w-full"
            >
              ✏️ Discursiva
            </Button>
          </div>
        </div>

        {/* Estilo */}
        <div className="space-y-2">
          <Label>Estilo da Questão</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={style === 'contextualizada' ? 'default' : 'outline'}
              onClick={() => {
                setStyle('contextualizada')
                setMixedStyles(false)
              }}
              disabled={generating || mixedStyles}
              className="w-full text-sm"
            >
              📚 Contextualizada
            </Button>
            <Button
              type="button"
              variant={style === 'rapida' ? 'default' : 'outline'}
              onClick={() => {
                setStyle('rapida')
                setMixedStyles(false)
              }}
              disabled={generating || mixedStyles}
              className="w-full text-sm"
            >
              ⚡ Rápida
            </Button>
          </div>

          {/* Modo Misto - aparece apenas para geração múltipla */}
          {(quantity > 1 || multipleSubjects.trim().length > 0) && (
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="mixedStyles"
                checked={mixedStyles}
                onChange={(e) => setMixedStyles(e.target.checked)}
                disabled={generating}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="mixedStyles" className="cursor-pointer text-sm">
                🎭 Misturar estilos (alternando entre contextualizada e rápida)
              </Label>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {mixedStyles
              ? '🎭 Questões alternadas: contextualizadas e rápidas'
              : style === 'contextualizada'
              ? '📚 Enunciado amplo, contextualizado e com "historinha"'
              : '⚡ Enunciado direto e objetivo, sem rodeios'}
          </p>
        </div>

        {/* Tipo de Alternativa - apenas para múltipla escolha */}
        {questionType === 'multiple-choice' && (
          <div className="space-y-3 border-t pt-4">
            <Label>Tipo de Alternativa</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={alternativeType === 'standard' ? 'default' : 'outline'}
                onClick={() => setAlternativeType('standard')}
                disabled={generating}
                className="w-full text-sm"
              >
                📝 Padrão (A, B, C...)
              </Button>
              <Button
                type="button"
                variant={alternativeType === 'true-false' ? 'default' : 'outline'}
                onClick={() => setAlternativeType('true-false')}
                disabled={generating}
                className="w-full text-sm"
              >
                ✓✗ Verdadeiro/Falso
              </Button>
              <Button
                type="button"
                variant={alternativeType === 'comparison' ? 'default' : 'outline'}
                onClick={() => setAlternativeType('comparison')}
                disabled={generating}
                className="w-full text-sm"
              >
                ⚖️ Comparação
              </Button>
              <Button
                type="button"
                variant={alternativeType === 'assertion-reason' ? 'default' : 'outline'}
                onClick={() => setAlternativeType('assertion-reason')}
                disabled={generating}
                className="w-full text-sm"
              >
                🔗 Asserção/Razão
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {alternativeType === 'standard' && '📝 Alternativas personalizadas com textos livres'}
              {alternativeType === 'true-false' && '✓✗ Apenas 2 opções: Verdadeiro ou Falso'}
              {alternativeType === 'comparison' && '⚖️ Compare duas afirmações (4 alternativas fixas)'}
              {alternativeType === 'assertion-reason' && '🔗 Relação entre asserção e razão (5 alternativas fixas)'}
            </p>
          </div>
        )}

        {/* Contexto da Questão */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>Contexto da Questão</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowContextManager(true)}
              disabled={generating}
              className="h-7 text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Gerenciar
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={questionContext === 'enem' ? 'default' : 'outline'}
              onClick={() => {
                setQuestionContext('enem')
                setSelectedSavedContext('')
                setCustomContext('')
              }}
              disabled={generating}
              className="w-full text-xs"
            >
              🎓 ENEM
            </Button>
            <Button
              type="button"
              variant={questionContext === 'uerj' ? 'default' : 'outline'}
              onClick={() => {
                setQuestionContext('uerj')
                setSelectedSavedContext('')
                setCustomContext('')
              }}
              disabled={generating}
              className="w-full text-xs"
            >
              🏛️ UERJ
            </Button>
            <Button
              type="button"
              variant={questionContext === 'outros' ? 'default' : 'outline'}
              onClick={() => setQuestionContext('outros')}
              disabled={generating}
              className="w-full text-xs"
            >
              ✨ Outros
            </Button>
          </div>
          {questionContext === 'outros' && (
            <div className="space-y-3">
              {/* Contextos Salvos */}
              {savedContexts.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="savedContext">Contextos Salvos</Label>
                  <select
                    id="savedContext"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedSavedContext}
                    onChange={(e) => {
                      setSelectedSavedContext(e.target.value)
                      if (e.target.value) {
                        setCustomContext('')
                      }
                    }}
                    disabled={generating}
                  >
                    <option value="">-- Selecione um contexto salvo --</option>
                    {savedContexts.map((ctx) => (
                      <option key={ctx.id} value={ctx.id}>
                        {ctx.name}
                      </option>
                    ))}
                  </select>
                  {selectedSavedContext && (
                    <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded text-xs">
                      {savedContexts.find(c => c.id === selectedSavedContext)?.description || 'Contexto selecionado'}
                    </div>
                  )}
                </div>
              )}

              {/* Campo Manual (se não tiver contexto salvo selecionado) */}
              {!selectedSavedContext && (
                <div className="space-y-2">
                  <Label htmlFor="customContext">
                    {savedContexts.length > 0 ? 'Ou digite um novo contexto' : 'Contexto Personalizado *'}
                  </Label>
                  <Input
                    id="customContext"
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    placeholder="Ex: Medicina (UNIFESP), Direito (USP), Concurso Público..."
                    disabled={generating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Especifique o contexto da questão (área, vestibular, concurso, etc)
                  </p>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {questionContext === 'enem'
              ? '📖 Questões no estilo ENEM - interdisciplinares e interpretativas'
              : questionContext === 'uerj'
                ? '📖 Questões no estilo UERJ - discursivas e analíticas'
                : '📖 Questões personalizadas para o contexto especificado'}
          </p>
        </div>

        {/* Tema/Assunto Único ou Múltiplo */}
        <div className="space-y-4 border rounded-lg p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">Modo de Geração</Label>
            <p className="text-xs text-muted-foreground">
              {quantity > 1 || multipleSubjects ? '📚 Múltiplas questões' : '📝 Questão única'}
            </p>
          </div>

          {/* Questão Única */}
          <div className="space-y-2">
            <Label htmlFor="subject">Tema Único (para 1 questão)</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value)
                if (e.target.value.trim()) {
                  setMultipleSubjects('')
                  setQuantity(1)
                }
              }}
              placeholder="Ex: Fotossíntese"
              disabled={generating || multipleSubjects.trim().length > 0}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Múltiplas Questões */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade de Questões</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  setQuantity(val)
                  if (val > 1 && !multipleSubjects.trim()) {
                    setSubject('')
                  }
                }}
                disabled={generating}
              />
              <p className="text-xs text-muted-foreground">
                Gere de 1 até 50 questões de uma vez
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="multipleSubjects">Temas Distribuídos (separados por ;) *</Label>
              <Textarea
                id="multipleSubjects"
                value={multipleSubjects}
                onChange={(e) => {
                  setMultipleSubjects(e.target.value)
                  if (e.target.value.trim()) {
                    setSubject('')
                    if (quantity === 1) setQuantity(5)
                  }
                }}
                placeholder="Ex: Fotossíntese; Segunda Guerra Mundial; Leis de Newton; Revolução Francesa; Células"
                disabled={generating || subject.trim().length > 0}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Os temas serão distribuídos homogeneamente entre as {quantity} questões
              </p>
              {multipleSubjects.trim() && (
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded text-xs">
                  📊 {multipleSubjects.split(';').filter(s => s.trim()).length} tema(s) detectado(s)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dificuldade */}
        <div className="space-y-2">
          {(quantity > 1 || multipleSubjects.trim().length > 0) ? (
            // Modo múltiplas questões - opção de dificuldade aleatória
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="randomDifficulty"
                  checked={randomDifficulty}
                  onChange={(e) => setRandomDifficulty(e.target.checked)}
                  disabled={generating}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="randomDifficulty" className="cursor-pointer">
                  🎲 Dificuldade Aleatória
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {randomDifficulty
                  ? 'Cada questão terá uma dificuldade aleatória entre 0% e 100%'
                  : 'Todas as questões terão a mesma dificuldade definida abaixo'}
              </p>
              {!randomDifficulty && (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Dificuldade: {(difficulty * 100).toFixed(0)}%</Label>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {difficultyLabel}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                    disabled={generating}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0% - Muito Fácil</span>
                    <span>50% - Médio</span>
                    <span>100% - Muito Difícil</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Modo questão única - dificuldade fixa
            <>
              <div className="flex items-center justify-between">
                <Label>Dificuldade: {(difficulty * 100).toFixed(0)}%</Label>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {difficultyLabel}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={difficulty}
                onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                disabled={generating}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0% - Muito Fácil</span>
                <span>50% - Médio</span>
                <span>100% - Muito Difícil</span>
              </div>
            </>
          )}
        </div>

        {/* Informações Adicionais */}
        {questionType === 'multiple-choice' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Configurações aplicadas:</strong>
              <br />• {numberOfAlternatives} alternativas ({['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, numberOfAlternatives).join(', ')})
              {useTRI && <><br />• Parâmetros TRI serão gerados automaticamente</>}
            </p>
          </div>
        )}

        {questionType === 'discursive' && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-900 dark:text-purple-100">
              <strong>Pontos-chave gerados automaticamente:</strong>
              <br />• A IA definirá 3-5 pontos-chave
              <br />• Pesos serão atribuídos proporcionalmente
              <br />• Pontuação máxima: 5-15 pontos (conforme dificuldade)
            </p>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
          </div>
        )}

        {/* Botão Gerar */}
        <Button
          onClick={handleGenerate}
          disabled={generating || (!subject.trim() && !multipleSubjects.trim())}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {quantity > 1 || multipleSubjects.trim()
                ? currentProgress > 0
                  ? `Gerando ${currentProgress} de ${quantity} questões...`
                  : `Gerando ${quantity} questões...`
                : 'Gerando questão...'}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {quantity > 1 || multipleSubjects.trim()
                ? `Gerar ${quantity} Questões com IA`
                : 'Gerar Questão com IA'}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Powered by Gemini 2.0 Flash ✨
        </p>
      </CardContent>
    </Card>

    <CustomContextsManager
      isOpen={showContextManager}
      onClose={() => setShowContextManager(false)}
      onContextsUpdated={() => {
        fetchSavedContexts()
      }}
    />
  </>
  )
}
