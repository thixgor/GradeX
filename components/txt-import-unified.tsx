'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, FileText, ListPlus, Upload } from 'lucide-react'
import { Question, Alternative, KeyPoint } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Importar não é uma operação só: "tenho 40 questões e quero mais 10" e "quero
 * jogar fora o que está aí" são intenções opostas. Enquanto existia um botão
 * único que substituía tudo, a segunda acontecia por engano — e levava junto
 * uma prova inteira já digitada.
 */
export type ModoDeImportacao = 'adicionar' | 'substituir'

interface TxtImportUnifiedProps {
  onImport: (questions: Question[], modo: ModoDeImportacao) => void
  /** Quantas questões a prova já tem. Zero dispensa a escolha: não há o que substituir. */
  questoesExistentes?: number
  defaultAlternatives?: number
  defaultEssayStyle?: 'enem' | 'uerj'
  defaultEssayCorrectionMethod?: 'ai' | 'manual'
  defaultEssayAiRigor?: number
}

export function TxtImportUnified({
  onImport,
  questoesExistentes = 0,
  defaultAlternatives = 5,
  defaultEssayStyle = 'enem',
  defaultEssayCorrectionMethod = 'ai',
  defaultEssayAiRigor = 0.45
}: TxtImportUnifiedProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  // Questões já lidas do texto, esperando a confirmação da substituição.
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState<Question[] | null>(null)

  function extractField(fullText: string, field: string): string {
    const lines = fullText.split('\n')
    const prefixColon = `${field}:"`
    const prefixDot = `${field}."`
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineLower = line.toLowerCase()
      const matchedPrefix = lineLower.startsWith(prefixColon.toLowerCase())
        ? prefixColon
        : lineLower.startsWith(prefixDot.toLowerCase())
        ? prefixDot
        : null
      if (matchedPrefix) {
        const rest = line.slice(matchedPrefix.length)
        const restTrimmed = rest.trimEnd()
        if (restTrimmed.endsWith('"')) {
          // Valor completo na mesma linha
          return restTrimmed.slice(0, -1).trim()
        }
        // Valor continua nas próximas linhas — coleta até encontrar linha que termine com "
        const parts = [rest]
        for (let j = i + 1; j < lines.length; j++) {
          const next = lines[j]
          const nextTrimmed = next.trimEnd()
          if (nextTrimmed.endsWith('"')) {
            parts.push(nextTrimmed.slice(0, -1))
            break
          }
          parts.push(next)
        }
        return parts.join('\n').trim()
      }
    }
    return ''
  }

  /**
   * Lê o texto colado e devolve as questões. Devolve `null` (com o erro na
   * tela) quando não dá para ler — o texto é conferido ANTES de abrir a
   * confirmação, para ninguém encarar o aviso vermelho de substituir tudo e
   * descobrir depois que o formato estava errado.
   */
  function parseText(): Question[] | null {
    try {
      setError('')

      if (!text.trim()) {
        setError('Cole o texto das questões')
        return null
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
        return null
      }

      // Renumerar questões. Quem recebe renumera de novo ao juntar com as que
      // já existiam; aqui é só para o texto colado ficar coerente sozinho.
      questions.forEach((q, idx) => {
        q.number = idx + 1
      })

      return questions
    } catch (error: any) {
      setError(`Erro ao processar: ${error.message}`)
      return null
    }
  }

  function importar(modo: ModoDeImportacao) {
    const questions = parseText()
    if (!questions) return

    // Substituir só assusta quando há trabalho a perder.
    if (modo === 'substituir' && questoesExistentes > 0) {
      setAguardandoConfirmacao(questions)
      return
    }

    concluir(questions, modo)
  }

  function concluir(questions: Question[], modo: ModoDeImportacao) {
    setAguardandoConfirmacao(null)
    onImport(questions, modo)
    setText('')
    setError('')
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

      const respostaComentada = extractField(fullText, 'RESPOSTA-COMENTADA')

      const question: Question = {
        id: uuidv4(),
        number: questionNumber,
        type: 'multiple-choice',
        statement,
        statementSource,
        imageUrl,
        command,
        alternatives,
        explanation: respostaComentada || undefined,
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

      const respostaComentada = extractField(fullText, 'RESPOSTA-COMENTADA')

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
        explanation: respostaComentada || undefined,
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

      const respostaComentada = extractField(fullText, 'RESPOSTA-COMENTADA')

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
        explanation: respostaComentada || undefined,
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
RESPOSTA-COMENTADA:"Brasília é a capital do Brasil desde 1960"
DISCRIMINACAO-QUESTAO-PARAMETROA-TRI:"1.2"
DIFICULDADE-QUESTAO-PARAMETROB-TRI:"0.5"
ACERTOAOACASO-QUESTAO-PARAMETROC-TRI:"0.2"

--Q2-DISCURSIVA
ENUNCIADO:"Explique o processo de fotossíntese"
FONTE-ENUNCIADO:""
URL-IMAGEM-QUESTAO:""
COMANDO-QUESTÃO:"Descreva detalhadamente"
PONTOS-CHAVE-E-SEUS-PESOS:"Mencionar clorofila_0.3 ; Explicar luz solar_0.4 ; Citar CO2 e água_0.3"
RESPOSTA-COMENTADA:"A fotossíntese é o processo pelo qual..."

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
            <strong>Campo opcional para todos os tipos:</strong><br />
            • <code>RESPOSTA-COMENTADA:"texto"</code> - Explicação/gabarito comentado<br />
            <br />
            Você pode misturar diferentes tipos no mesmo arquivo!
          </p>
        </div>

        {questoesExistentes > 0 ? (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={() => importar('adicionar')} className="w-full" size="lg">
                <ListPlus className="h-4 w-4 mr-2" />
                Adicionar ao final
              </Button>
              <Button
                onClick={() => importar('substituir')}
                variant="outline"
                size="lg"
                className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Substituir todas
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              A prova tem {questoesExistentes} {questoesExistentes === 1 ? 'questão' : 'questões'}.{' '}
              <strong>Adicionar</strong> mantém tudo e coloca as novas no final;{' '}
              <strong>substituir</strong> apaga as atuais.
            </p>
          </div>
        ) : (
          <Button onClick={() => importar('substituir')} className="w-full" size="lg">
            <FileText className="h-4 w-4 mr-2" />
            Importar Questões
          </Button>
        )}
      </CardContent>

      {/* ── Confirmação da substituição ──────────────────────────────────
          Apagar a prova inteira não pode depender de um clique só: o texto
          já foi lido aqui, então este diálogo diz exatamente o que sai e o
          que entra antes de qualquer coisa ser descartada. */}
      <Dialog
        open={aguardandoConfirmacao !== null}
        onOpenChange={(aberto) => !aberto && setAguardandoConfirmacao(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Substituir todas as questões?
            </DialogTitle>
            <DialogDescription>
              Isto descarta o que já está montado na prova e não pode ser desfeito.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-6">
            <ul className="space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <li>
                • saem as <strong>{questoesExistentes}</strong>{' '}
                {questoesExistentes === 1 ? 'questão atual' : 'questões atuais'}, com todas as edições feitas nelas
              </li>
              <li>
                • entram as <strong>{aguardandoConfirmacao?.length ?? 0}</strong>{' '}
                {(aguardandoConfirmacao?.length ?? 0) === 1 ? 'questão lida' : 'questões lidas'} do texto colado
              </li>
            </ul>

            <p className="text-xs text-muted-foreground">
              Se a ideia era só acrescentar, cancele e use <strong>Adicionar ao final</strong>.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAguardandoConfirmacao(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => {
                if (aguardandoConfirmacao) concluir(aguardandoConfirmacao, 'substituir')
              }}
            >
              <AlertTriangle className="h-4 w-4" />
              Substituir todas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
