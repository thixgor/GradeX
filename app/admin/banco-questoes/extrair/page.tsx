'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ThemeToggle } from '@/components/theme-toggle'
import { BanChecker } from '@/components/ban-checker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Info,
  Copy,
  FileText
} from 'lucide-react'

interface ExtractionResult {
  moduloNome: string
  topicoOrigem: string
  topicoDestino: string
  sucesso: boolean
  questoesMovidas: number
  erro?: string
}

interface ExtractionResponse {
  sucesso: boolean
  totalMovidas?: number
  totalEntradas?: number
  resultados?: ExtractionResult[]
  errosParsing?: string[]
  error?: string
}

const EXAMPLE_TXT = `[SOI III]
Fisiopatologia Cardiovascular >> Sistema Cardiovascular

[HAM I]
Exame Físico Respiratório >> Semiologia Respiratória
Ausculta Cardíaca >> Semiologia Cardiovascular`

export default function AdminExtrairQuestoes() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [txt, setTxt] = useState('')
  const [response, setResponse] = useState<ExtractionResponse | null>(null)
  const [copied, setCopied] = useState(false)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!txt.trim()) {
      return
    }

    setSubmitting(true)
    setResponse(null)

    try {
      const res = await fetch('/api/admin/banco/questoes/extrair-topicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txt })
      })

      const data = await res.json()
      setResponse(data)

      if (data.sucesso && data.totalMovidas > 0) {
        setTxt('')
      }
    } catch (error) {
      setResponse({ sucesso: false, error: 'Erro de conexão com o servidor' })
    } finally {
      setSubmitting(false)
    }
  }

  function handleCopyExample() {
    navigator.clipboard.writeText(EXAMPLE_TXT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleLoadExample() {
    setTxt(EXAMPLE_TXT)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
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
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <ArrowRightLeft className="h-6 w-6 text-primary" />
                  Extrair Questões
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Mover questões de um tópico para outro via TXT
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Como usar
            </CardTitle>
            <CardDescription>
              Use o formato abaixo para mover questões de um tópico para outro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                <code className="bg-muted px-1 rounded">[NOME DO MÓDULO]</code> - Define o módulo onde estão os tópicos
              </li>
              <li>
                <code className="bg-muted px-1 rounded">Tópico Origem {'>'}{'>'}  Tópico Destino</code> - Move todas as questões
              </li>
              <li>Você pode adicionar múltiplas extrações separadas por linhas em branco</li>
              <li>Os nomes de módulos e tópicos não diferenciam maiúsculas/minúsculas</li>
              <li>Subtópicos serão removidos das questões movidas (pois pertencem ao tópico antigo)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Example Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exemplo de formato
            </CardTitle>
            <CardDescription>
              Clique para copiar ou carregar o exemplo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap font-mono">
              {EXAMPLE_TXT}
            </pre>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleCopyExample}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copiado!' : 'Copiar exemplo'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLoadExample}>
                Carregar exemplo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Texto para extração</CardTitle>
            <CardDescription>
              Cole o texto com as instruções de extração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={txt}
                onChange={(e) => setTxt(e.target.value)}
                placeholder={`[NOME DO MÓDULO]\nTópico Origem >> Tópico Destino`}
                className="min-h-[200px] font-mono text-sm"
                disabled={submitting}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || !txt.trim()}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Extrair Questões
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTxt('')
                    setResponse(null)
                  }}
                  disabled={submitting}
                >
                  Limpar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {response && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {response.sucesso ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Resultado da Extração
              </CardTitle>
              {response.sucesso && (
                <CardDescription>
                  {response.totalMovidas} questões movidas em {response.totalEntradas} operações
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Success Message */}
              {response.sucesso && response.totalMovidas !== undefined && response.totalMovidas > 0 && (
                <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Sucesso!</AlertTitle>
                  <AlertDescription>
                    {response.totalMovidas} questão(ões) movida(s) com sucesso.
                  </AlertDescription>
                </Alert>
              )}

              {/* Parsing Errors */}
              {response.errosParsing && response.errosParsing.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erros de formato</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2 text-sm">
                      {response.errosParsing.map((erro, idx) => (
                        <li key={idx}>{erro}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* General Error */}
              {response.error && !response.resultados && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{response.error}</AlertDescription>
                </Alert>
              )}

              {/* Individual Results */}
              {response.resultados && response.resultados.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Detalhes por operação:</h4>
                  <div className="divide-y rounded-lg border">
                    {response.resultados.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-3 flex items-start gap-3 ${
                          result.sucesso ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
                        }`}
                      >
                        {result.sucesso ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            [{result.moduloNome}]
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.topicoOrigem} → {result.topicoDestino}
                          </p>
                          {result.sucesso ? (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {result.questoesMovidas} questões movidas
                            </p>
                          ) : (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {result.erro}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
