'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Upload } from 'lucide-react'
import { Question, Alternative, KeyPoint } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

interface TxtImportUnifiedProps {
  onImport: (questions: Question[]) => void
  defaultAlternatives?: number
  defaultEssayStyle?: 'enem' | 'uerj'
  defaultEssayCorrectionMethod?: 'ai' | 'manual'
  defaultEssayAiRigor?: number
}

export function TxtImportUnified({
  onImport,
  defaultAlternatives = 5,
  defaultEssayStyle = 'enem',
  defaultEssayCorrectionMethod = 'ai',
  defaultEssayAiRigor = 0.45
}: TxtImportUnifiedProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  function extractField(line: string, field: string): string {
    const regex = new RegExp(`${field}:"([^"]*)"`, 'i')
    const match = line.match(regex)
    return match ? match[1].trim() : ''
  }

  function parseText() {
    try {
      setError('')

      if (!text.trim()) {
        setError('Cole o texto das questões')
        return
      }

      const lines = text.split('\n')
      const questions: Question[] = []
      const letters = ['A', 'B', 'C', 'D', 'E']

      let currentQuestionLines: string[] = []
      let questionNumber = 0

      // Processar linha por linha, agrupando por questão
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Detectar início de nova questão
        if (line.match(/^--Q\d+-MULTIPLA-ESCOLHA$/i) ||
            line.match(/^--Q\d+-DISCURSIVA$/i) ||
            line.match(/^--REDAÇÃO$/i)) {

          // Processar questão anterior se existir
          if (currentQuestionLines.length > 0) {
            const question = parseQuestion(currentQuestionLines, questionNumber, letters)
            if (question) questions.push(question)
          }

          // Iniciar nova questão
          questionNumber++
          currentQuestionLines = [line]
        } else if (line) {
          currentQuestionLines.push(line)
        }
      }

      // Processar última questão
      if (currentQuestionLines.length > 0) {
        const question = parseQuestion(currentQuestionLines, questionNumber, letters)
        if (question) questions.push(question)
      }

      if (questions.length === 0) {
        setError('Nenhuma questão válida encontrada. Verifique o formato.')
        return
      }

      // Renumerar questões
      questions.forEach((q, idx) => {
        q.number = idx + 1
      })

      onImport(questions)
      setText('')
      setError('')
    } catch (error: any) {
      setError(`Erro ao processar: ${error.message}`)
    }
  }

  function parseQuestion(lines: string[], questionNumber: number, letters: string[]): Question | null {
    const fullText = lines.join('\n')
    const header = lines[0]

    // Extrair campos comuns
    const statement = extractField(fullText, 'ENUNCIADO')
    const statementSource = extractField(fullText, 'FONTE-ENUNCIADO')
    const imageUrl = extractField(fullText, 'URL-IMAGEM-QUESTAO') || extractField(fullText, 'URL-IMAGEM-REDAÇÃO')
    const command = extractField(fullText, 'COMANDO-QUESTÃO') || extractField(fullText, 'COMANDO-REDAÇÃO')

    // Múltipla escolha
    if (header.match(/MULTIPLA-ESCOLHA/i)) {
      const alternatives: Alternative[] = []

      for (let i = 0; i < defaultAlternatives; i++) {
        const letter = letters[i]
        const altText = extractField(fullText, `ALT-${letter}`)
        if (altText) {
          alternatives.push({
            id: uuidv4(),
            letter,
            text: altText,
            isCorrect: false,
          })
        }
      }

      const correctLetter = extractField(fullText, 'ALT-CORRETA')
      const correctAlt = alternatives.find(a => a.letter === correctLetter.toUpperCase())
      if (correctAlt) {
        correctAlt.isCorrect = true
      }

      const question: Question = {
        id: uuidv4(),
        number: questionNumber,
        type: 'multiple-choice',
        statement,
        statementSource,
        imageUrl,
        command,
        alternatives,
      }

      // TRI parameters (opcional)
      const triDiscrimination = extractField(fullText, 'DISCRIMINACAO-QUESTAO-PARAMETROA-TRI')
      const triDifficulty = extractField(fullText, 'DIFICULDADE-QUESTAO-PARAMETROB-TRI')
      const triGuessing = extractField(fullText, 'ACERTOAOACASO-QUESTAO-PARAMETROC-TRI')

      if (triDiscrimination) question.triDiscrimination = parseFloat(triDiscrimination)
      if (triDifficulty) question.triDifficulty = parseFloat(triDifficulty)
      if (triGuessing) question.triGuessing = parseFloat(triGuessing)

      return question
    }

    // Discursiva
    else if (header.match(/DISCURSIVA/i)) {
      const keyPointsText = extractField(fullText, 'PONTOS-CHAVE-E-SEUS-PESOS')
      const keyPoints: KeyPoint[] = []

      if (keyPointsText) {
        const points = keyPointsText.split(';').map(p => p.trim()).filter(p => p)
        for (const point of points) {
          const parts = point.split('_')
          if (parts.length >= 2) {
            const description = parts[0].trim()
            const weight = parseFloat(parts[1].trim())
            if (description && !isNaN(weight)) {
              keyPoints.push({
                id: uuidv4(),
                description,
                weight,
              })
            }
          }
        }
      }

      return {
        id: uuidv4(),
        number: questionNumber,
        type: 'discursive',
        statement,
        statementSource,
        imageUrl,
        command,
        alternatives: [],
        keyPoints,
        maxScore: 10,
      }
    }

    // Redação
    else if (header.match(/REDAÇÃO/i)) {
      const theme = extractField(fullText, 'TEMA-REDAÇÃO')
      const supportTextsRaw = extractField(fullText, 'TEXTOS DE APOIO')

      const supportTexts = supportTextsRaw
        ? supportTextsRaw.split('---').map(t => t.trim()).filter(t => t.length > 0)
        : []

      const maxScore = defaultEssayStyle === 'enem' ? 1000 : 20

      return {
        id: uuidv4(),
        number: questionNumber,
        type: 'essay',
        statement,
        statementSource,
        imageUrl,
        command,
        alternatives: [],
        essayStyle: defaultEssayStyle,
        essayTheme: theme,
        essaySupportTexts: supportTexts,
        essayCorrectionMethod: defaultEssayCorrectionMethod,
        essayAiRigor: defaultEssayAiRigor,
        maxScore,
      }
    }

    return null
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setText(text)
    } catch (error: any) {
      setError(`Erro ao ler arquivo: ${error.message}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Importar Questões de Arquivo .txt
        </CardTitle>
        <CardDescription>
          Importe questões múltipla escolha, discursivas e redações de um arquivo .txt ou cole o texto diretamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Fazer upload de arquivo .txt</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Escolher Arquivo
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou cole o texto</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paste-text">Cole o texto das questões</Label>
          <Textarea
            id="paste-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`--Q1-MULTIPLA-ESCOLHA
ENUNCIADO:"Qual é a capital do Brasil?"
FONTE-ENUNCIADO:""
URL-IMAGEM-QUESTAO:""
COMANDO-QUESTÃO:"Assinale a alternativa correta"
ALT-A:"São Paulo"
ALT-B:"Rio de Janeiro"
ALT-C:"Brasília"
ALT-D:"Salvador"
ALT-E:"Belo Horizonte"
ALT-CORRETA:"C"
DISCRIMINACAO-QUESTAO-PARAMETROA-TRI:"1.2"
DIFICULDADE-QUESTAO-PARAMETROB-TRI:"0.5"
ACERTOAOACASO-QUESTAO-PARAMETROC-TRI:"0.2"

--Q2-DISCURSIVA
ENUNCIADO:"Explique o processo de fotossíntese"
FONTE-ENUNCIADO:""
URL-IMAGEM-QUESTAO:""
COMANDO-QUESTÃO:"Descreva detalhadamente"
PONTOS-CHAVE-E-SEUS-PESOS:"Mencionar clorofila_0.3 ; Explicar luz solar_0.4 ; Citar CO2 e água_0.3"

--REDAÇÃO
ENUNCIADO:"Contexto sobre saúde mental no Brasil"
FONTE-ENUNCIADO:""
URL-IMAGEM-REDAÇÃO:""
COMANDO-REDAÇÃO:"A partir da leitura dos textos motivadores, redija um texto dissertativo-argumentativo"
TEMA-REDAÇÃO:"Os desafios para a valorização da saúde mental no Brasil"
TEXTOS DE APOIO:"Texto 1: Dados estatísticos... --- Texto 2: Artigo científico... --- Texto 3: Citação de especialista..."`}
            rows={15}
            className="font-mono text-xs"
          />
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="bg-muted p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Formatos aceitos:</strong><br />
            • <code>--Q1-MULTIPLA-ESCOLHA</code> - Questão de múltipla escolha<br />
            • <code>--Q2-DISCURSIVA</code> - Questão discursiva<br />
            • <code>--REDAÇÃO</code> - Redação ENEM/UERJ<br />
            <br />
            Você pode misturar diferentes tipos no mesmo arquivo!
          </p>
        </div>

        <Button onClick={parseText} className="w-full" size="lg">
          <FileText className="h-4 w-4 mr-2" />
          Importar Questões
        </Button>
      </CardContent>
    </Card>
  )
}
