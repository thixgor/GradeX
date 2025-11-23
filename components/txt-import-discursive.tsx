'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Question, KeyPoint } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'
import { FileText, Upload } from 'lucide-react'

interface TxtImportDiscursiveProps {
  numberOfQuestions: number
  onImport: (questions: Question[]) => void
}

export function TxtImportDiscursive({ numberOfQuestions, onImport }: TxtImportDiscursiveProps) {
  const [txtContent, setTxtContent] = useState('')
  const [showImport, setShowImport] = useState(false)

  function parseDiscursiveTxt(content: string): Question[] {
    const questions: Question[] = []
    const questionBlocks = content.split(/--Q\d+-DISCURSIVA/i).filter(block => block.trim())

    for (let i = 0; i < questionBlocks.length && i < numberOfQuestions; i++) {
      const block = questionBlocks[i]

      // Extrair campos usando regex
      const enunciadoMatch = block.match(/ENUNCIADO:"([^"]*)"/i)
      const fonteEnunciadoMatch = block.match(/FONTE-ENUNCIADO:"([^"]*)"/i)
      const imagemMatch = block.match(/URL-IMAGEM-QUESTAO:"([^"]*)"/i)
      const comandoMatch = block.match(/COMANDO-QUESTÃO:"([^"]*)"/i)
      const pontosChaveMatch = block.match(/PONTOS-CHAVE-E-SEUS-PESOS:"([^"]*)"/i)

      const enunciado = enunciadoMatch ? enunciadoMatch[1] : ''
      const fonteEnunciado = fonteEnunciadoMatch ? fonteEnunciadoMatch[1] : ''
      const imagemUrl = imagemMatch ? imagemMatch[1] : ''
      const comando = comandoMatch ? comandoMatch[1] : ''
      const pontosChaveStr = pontosChaveMatch ? pontosChaveMatch[1] : ''

      // Parsear pontos-chave
      const keyPoints: KeyPoint[] = []
      if (pontosChaveStr) {
        const pontos = pontosChaveStr.split(';').map(p => p.trim()).filter(p => p)

        for (const ponto of pontos) {
          const parts = ponto.split('_')
          if (parts.length === 2) {
            const description = parts[0].trim()
            const weight = parseFloat(parts[1].trim())

            if (description && !isNaN(weight)) {
              keyPoints.push({
                id: uuidv4(),
                description,
                weight
              })
            }
          }
        }
      }

      questions.push({
        id: uuidv4(),
        number: i + 1,
        type: 'discursive',
        statement: enunciado,
        statementSource: fonteEnunciado || undefined,
        imageUrl: imagemUrl || undefined,
        imageSource: '',
        command: comando,
        alternatives: [],
        keyPoints,
        maxScore: 10, // Pontuação padrão
      })
    }

    return questions
  }

  function handleImport() {
    try {
      const parsed = parseDiscursiveTxt(txtContent)

      if (parsed.length === 0) {
        alert('Nenhuma questão foi encontrada no formato correto.')
        return
      }

      if (parsed.length !== numberOfQuestions) {
        if (!confirm(`Foram encontradas ${parsed.length} questões, mas você definiu ${numberOfQuestions}. Deseja continuar?`)) {
          return
        }
      }

      onImport(parsed)
      setShowImport(false)
      setTxtContent('')
    } catch (error) {
      console.error('Erro ao importar:', error)
      alert('Erro ao processar o arquivo TXT. Verifique o formato.')
    }
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowImport(!showImport)}
        className="w-full"
      >
        <FileText className="h-4 w-4 mr-2" />
        {showImport ? 'Fechar' : 'Importar Questões Discursivas de TXT'}
      </Button>

      {showImport && (
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="bg-purple-50 dark:bg-purple-950">
            <CardTitle className="text-base">Importar Questões Discursivas</CardTitle>
            <CardDescription>
              Cole o conteúdo do arquivo TXT seguindo o formato abaixo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto">
              <div className="space-y-1">
                <div>--Q1-DISCURSIVA</div>
                <div>ENUNCIADO:"Explique o conceito de fotossíntese"</div>
                <div>FONTE-ENUNCIADO:"Biologia 2024"</div>
                <div>URL-IMAGEM-QUESTAO:"https://exemplo.com/imagem.jpg"</div>
                <div>COMANDO-QUESTÃO:"Desenvolva sua resposta em até 15 linhas"</div>
                <div>PONTOS-CHAVE-E-SEUS-PESOS:"Mencionar clorofila_0.25 ; Explicar processo de conversão_0.40 ; Citar produtos finais_0.35"</div>
                <div className="mt-3">--Q2-DISCURSIVA</div>
                <div>ENUNCIADO:"Descreva a Revolução Industrial"</div>
                <div>FONTE-ENUNCIADO:""</div>
                <div>URL-IMAGEM-QUESTAO:""</div>
                <div>COMANDO-QUESTÃO:"Disserte sobre o tema"</div>
                <div>PONTOS-CHAVE-E-SEUS-PESOS:"Período histórico_0.20 ; Inovações tecnológicas_0.50 ; Impactos sociais_0.30"</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cole o Conteúdo TXT:</Label>
              <Textarea
                value={txtContent}
                onChange={(e) => setTxtContent(e.target.value)}
                placeholder="Cole aqui o conteúdo do arquivo TXT..."
                rows={12}
                className="font-mono text-xs"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-blue-900 dark:text-blue-100">📝 Formato dos Pontos-Chave:</p>
              <p className="text-blue-800 dark:text-blue-200">
                <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">
                  PONTOS-CHAVE-E-SEUS-PESOS:"Ponto1_0.25 ; Ponto2_0.40 ; Ponto3_0.35"
                </code>
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                - Use <strong>_</strong> (underline) para separar descrição do peso
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                - Use <strong>;</strong> (ponto e vírgula) para separar pontos diferentes
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                - Pesos devem ser decimais e somar 1.0 (100%)
              </p>
            </div>

            <Button onClick={handleImport} className="w-full" disabled={!txtContent.trim()}>
              <Upload className="h-4 w-4 mr-2" />
              Importar {numberOfQuestions} Questão(ões) Discursiva(s)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
