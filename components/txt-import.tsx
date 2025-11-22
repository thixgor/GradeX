'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Download, Upload } from 'lucide-react'
import { parseTxtFile, generateTxtTemplate } from '@/lib/txt-import-parser'
import { Question } from '@/lib/types'

interface TxtImportProps {
  numberOfQuestions: number
  numberOfAlternatives: number
  onImport: (questions: Question[]) => void
}

export function TxtImport({
  numberOfQuestions,
  numberOfAlternatives,
  onImport
}: TxtImportProps) {
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleDownloadTemplate() {
    const template = generateTxtTemplate(numberOfQuestions, numberOfAlternatives)
    const blob = new Blob([template], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-questoes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)

    try {
      const content = await file.text()
      const questions = parseTxtFile(content, numberOfAlternatives)

      if (questions.length === 0) {
        throw new Error('Nenhuma questão encontrada no arquivo')
      }

      if (questions.length !== numberOfQuestions) {
        const confirm = window.confirm(
          `O arquivo contém ${questions.length} questões, mas você configurou ${numberOfQuestions}. Deseja continuar?`
        )
        if (!confirm) {
          setImporting(false)
          return
        }
      }

      onImport(questions)
      alert(`${questions.length} questões importadas com sucesso!`)
    } catch (error: any) {
      alert('Erro ao importar arquivo: ' + error.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
      <div className="flex items-center space-x-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Importar Questões via Arquivo .TXT</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Importe múltiplas questões de uma vez usando um arquivo de texto formatado.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar Template
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileImport}
          className="hidden"
          id="txt-import"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          <Upload className="h-4 w-4 mr-2" />
          {importing ? 'Importando...' : 'Importar Arquivo'}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-background rounded">
        <p className="font-medium">📝 Como usar:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Baixe o template clicando em "Baixar Template"</li>
          <li>Preencha as questões seguindo o formato fornecido</li>
          <li>Salve o arquivo como .TXT</li>
          <li>Clique em "Importar Arquivo" e selecione seu arquivo</li>
        </ol>
      </div>
    </div>
  )
}
