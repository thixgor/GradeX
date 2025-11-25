'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2 } from 'lucide-react'
import { Question } from '@/lib/types'

interface AIQuestionGeneratorProps {
  onQuestionGenerated: (question: Question) => void
  numberOfAlternatives: number
  useTRI: boolean
}

export function AIQuestionGenerator({
  onQuestionGenerated,
  numberOfAlternatives,
  useTRI,
}: AIQuestionGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'discursive'>('multiple-choice')
  const [style, setStyle] = useState<'contextualizada' | 'rapida'>('contextualizada')
  const [subject, setSubject] = useState('')
  const [difficulty, setDifficulty] = useState(0.5) // 50% padrão
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!subject.trim()) {
      setError('Por favor, especifique o tema/assunto da questão')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: questionType,
          style,
          subject: subject.trim(),
          difficulty,
          numberOfAlternatives: questionType === 'multiple-choice' ? numberOfAlternatives : undefined,
          useTRI: questionType === 'multiple-choice' ? useTRI : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar questão')
      }

      onQuestionGenerated(data.question)
      setSubject('') // Limpar campo após sucesso
      setError('')
    } catch (error: any) {
      console.error('Erro ao gerar questão:', error)
      setError(error.message || 'Erro ao gerar questão. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  const difficultyLabel =
    difficulty < 0.3 ? 'Fácil' :
    difficulty < 0.6 ? 'Médio' :
    difficulty < 0.8 ? 'Difícil' : 'Muito Difícil'

  return (
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
              onClick={() => setStyle('contextualizada')}
              disabled={generating}
              className="w-full text-sm"
            >
              📚 Contextualizada
            </Button>
            <Button
              type="button"
              variant={style === 'rapida' ? 'default' : 'outline'}
              onClick={() => setStyle('rapida')}
              disabled={generating}
              className="w-full text-sm"
            >
              ⚡ Rápida
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {style === 'contextualizada'
              ? 'Enunciado amplo, contextualizado e com "historinha"'
              : 'Enunciado direto e objetivo, sem rodeios'}
          </p>
        </div>

        {/* Tema/Assunto */}
        <div className="space-y-2">
          <Label htmlFor="subject">Tema/Assunto da Questão *</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Fotossíntese, Segunda Guerra Mundial, Leis de Newton..."
            disabled={generating}
          />
          <p className="text-xs text-muted-foreground">
            Seja específico sobre o tema que deseja abordar
          </p>
        </div>

        {/* Dificuldade */}
        <div className="space-y-2">
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
          disabled={generating || !subject.trim()}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando questão...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Questão com IA
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Powered by Gemini 2.0 Flash ✨
        </p>
      </CardContent>
    </Card>
  )
}
