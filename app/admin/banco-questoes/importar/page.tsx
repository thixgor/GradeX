'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'
import { BanChecker } from '@/components/ban-checker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Upload,
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { BancoImportacaoResult } from '@/lib/types/banco-questoes'

const EXEMPLO_TXT = `[OBJETIVA]
MÓDULO: Introdução à Medicina
TÓPICO: Anatomia Básica
ENUNCIADO: Qual estrutura anatômica é responsável pela condução do impulso nervoso do coração?\\nEsta é uma pergunta importante sobre fisiologia cardíaca.\\nPense bem antes de responder!
IMAGEM: https://i.imgur.com/exemplo.png
A) Nó sinoatrial
B) Nó atrioventricular
C) Feixe de His
D) Fibras de Purkinje
E) Todas as anteriores
CORRETA: E
EXPLICAÇÃO: O sistema de condução cardíaco inclui todas essas estruturas.\\nElas trabalham em conjunto para coordenar a contração cardíaca.
DIFICULDADE: medio
FONTE: Prova Institucional 2023

[DISCURSIVA]
MÓDULO: Clínica Médica
TÓPICO: Semiologia
ENUNCIADO: Descreva os principais achados semiológicos na ausculta de um paciente com estenose mitral.\\nConsidere todos os focos auscultatórios.
RESPOSTA: Na estenose mitral, encontramos:\\n1) Ruflar diastólico em foco mitral, melhor audível em decúbito lateral esquerdo\\n2) Estalido de abertura da valva mitral\\n3) Primeira bulha hiperfonética\\n4) Sopro pré-sistólico quando em ritmo sinusal
EXPLICAÇÃO: A estenose mitral causa turbulência do fluxo sanguíneo durante a diástole ventricular, produzindo o característico ruflar diastólico.
DIFICULDADE: dificil`

export default function AdminImportarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conteudo, setConteudo] = useState('')
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<BancoImportacaoResult | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      if (data.user.role !== 'admin') {
        router.push('/')
        return
      }
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleImportar() {
    if (!conteudo.trim()) return

    setImportando(true)
    setResultado(null)

    try {
      const res = await fetch('/api/admin/banco/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo })
      })

      const data = await res.json()
      setResultado(data)

      if (data.sucesso && data.totalImportadas > 0) {
        // Limpar o conteúdo após importação bem-sucedida
        setConteudo('')
      }
    } catch (error) {
      console.error('Erro ao importar:', error)
      setResultado({
        sucesso: false,
        totalImportadas: 0,
        erros: [{ linha: 0, mensagem: 'Erro ao processar a importação' }],
        questoesImportadas: []
      })
    } finally {
      setImportando(false)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setConteudo(text)
    }
    reader.readAsText(file)
  }

  function carregarExemplo() {
    setConteudo(EXEMPLO_TXT)
  }

  if (loading) {
    return <LogoLoading message="Carregando..." size="lg" fullscreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <BanChecker />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin/banco-questoes')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Importar Questões
                </h1>
                <p className="text-sm text-muted-foreground">
                  Importação em massa via arquivo TXT
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Formato do Arquivo
              </CardTitle>
              <CardDescription>
                O arquivo TXT deve seguir o formato abaixo. Cada questão é separada por uma linha em branco.
                Use \n no texto para criar quebras de linha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Campos obrigatórios:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><code>[OBJETIVA]</code> ou <code>[DISCURSIVA]</code> - Tipo da questão</li>
                    <li><code>MÓDULO:</code> - Nome do módulo</li>
                    <li><code>TÓPICO:</code> - Nome do tópico</li>
                    <li><code>ENUNCIADO:</code> - Texto da questão</li>
                    <li>Para objetivas: alternativas no formato <code>A) Texto</code> e <code>CORRETA: A</code></li>
                    <li>Para discursivas: <code>RESPOSTA:</code> com a resposta modelo</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Campos opcionais:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><code>PERÍODO:</code> - ignorado. O nível saiu da organização; a linha continua sendo aceita para não quebrar arquivo antigo</li>
                    <li><code>SUBTÓPICO:</code> - Nome do subtópico</li>
                    <li><code>IMAGEM:</code> ou <code>IMG:</code> - URL da imagem (Imgur ou qualquer URL de imagem)</li>
                    <li><code>EXPLICAÇÃO:</code> - Explicação da resposta</li>
                    <li><code>DIFICULDADE:</code> - facil, medio ou dificil</li>
                    <li><code>TAGS:</code> - Tags separadas por vírgula</li>
                    <li><code>FONTE:</code> - Fonte da questão</li>
                    <li><code>ANO:</code> - Ano da questão</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Dicas importantes:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Separe cada questão com <strong>uma linha em branco</strong></li>
                    <li>Para quebrar linhas no texto, use <code>\n</code> (ex: "Linha 1\nLinha 2")</li>
                    <li>Não use <code>---</code> como separador, apenas linha em branco</li>
                  </ul>
                </div>

                <Button variant="outline" size="sm" onClick={carregarExemplo}>
                  <FileText className="h-4 w-4 mr-2" />
                  Carregar Exemplo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Área de importação */}
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo para Importar</CardTitle>
              <CardDescription>
                Cole o conteúdo do arquivo TXT ou faça upload de um arquivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Upload de arquivo</Label>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="mt-1 block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90
                    cursor-pointer"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    ou cole o conteúdo
                  </span>
                </div>
              </div>

              <Textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={15}
                placeholder="Cole o conteúdo do arquivo TXT aqui..."
                className="font-mono text-sm"
              />

              <Button
                onClick={handleImportar}
                disabled={importando || !conteudo.trim()}
                className="w-full"
              >
                {importando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Questões
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultado */}
          {resultado && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {resultado.sucesso ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Resultado da Importação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {resultado.totalImportadas > 0 && (
                  <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Sucesso!</AlertTitle>
                    <AlertDescription>
                      {resultado.totalImportadas} questão(ões) importada(s) com sucesso.
                    </AlertDescription>
                  </Alert>
                )}

                {resultado.erros.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Erros encontrados ({resultado.erros.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {resultado.erros.map((erro, index) => (
                        <Alert key={index} variant="destructive" className="py-2">
                          <AlertDescription className="text-sm">
                            {erro.linha > 0 && <strong>Linha {erro.linha}: </strong>}
                            {erro.mensagem}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {resultado.questoesImportadas.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Questões importadas:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {resultado.questoesImportadas.map((q, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <Badge variant={q.tipo === 'objetiva' ? 'default' : 'secondary'}>
                            {q.tipo}
                          </Badge>
                          <span className="text-sm truncate flex-1">
                            {q.enunciado.substring(0, 100)}...
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
