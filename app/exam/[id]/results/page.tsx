'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Exam, TRIResult } from '@/lib/types'
import { generateGabaritoPDF, downloadPDF } from '@/lib/pdf-generator'
import { ArrowLeft, Download, FileText } from 'lucide-react'

interface NormalResult {
  userId: string
  userName: string
  score: number
}

export default function ExamResultsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [results, setResults] = useState<TRIResult[] | NormalResult[]>([])
  const [scoringMethod, setScoringMethod] = useState<'tri' | 'normal'>('normal')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [id])

  async function loadResults() {
    try {
      // Carrega a prova
      const examRes = await fetch(`/api/exams/${id}`)
      const examData = await examRes.json()
      if (!examRes.ok) throw new Error(examData.error)
      setExam(examData.exam)

      // Carrega os resultados
      const resultsRes = await fetch(`/api/exams/${id}/results`)
      const resultsData = await resultsRes.json()

      if (!resultsRes.ok) throw new Error(resultsData.error)

      setScoringMethod(resultsData.scoringMethod)
      setResults(resultsData.results)
    } catch (error: any) {
      alert(error.message)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  function handleDownloadGabarito() {
    if (!exam) return

    const blob = generateGabaritoPDF(exam)
    downloadPDF(blob, `gabarito-${exam.title.replace(/\s/g, '-')}.pdf`)
  }

  function handleDownloadPDF() {
    if (exam?.pdfUrl) {
      window.open(exam.pdfUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando resultados...</div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Prova não encontrada</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Resultados</h1>
              <p className="text-sm text-muted-foreground">{exam.title}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Downloads */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>
                Baixe o gabarito oficial e o PDF da prova (se disponível)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={handleDownloadGabarito}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Gabarito (PDF)
              </Button>

              {exam.pdfUrl && (
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Baixar Prova (PDF)
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Ranking */}
          <Card>
            <CardHeader>
              <CardTitle>
                {scoringMethod === 'tri' ? 'Ranking TRI' : 'Ranking de Pontuações'}
              </CardTitle>
              <CardDescription>
                {scoringMethod === 'tri'
                  ? 'Notas calculadas usando a Teoria de Resposta ao Item (TRI) - ordenadas alfabeticamente'
                  : 'Pontuações dos participantes - ordenadas alfabeticamente'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum participante finalizou esta prova ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted rounded-lg font-semibold text-sm">
                    <div className="col-span-8">Nome</div>
                    <div className="col-span-4 text-right">
                      {scoringMethod === 'tri' ? 'Nota TRI' : 'Pontuação'}
                    </div>
                  </div>

                  {/* Results */}
                  {results.map((result, index) => (
                    <div
                      key={result.userId}
                      className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="col-span-8 flex items-center space-x-3">
                        <span className="text-muted-foreground text-sm">
                          {index + 1}.
                        </span>
                        <span className="font-medium">{result.userName}</span>
                      </div>
                      <div className="col-span-4 text-right">
                        <span className="text-lg font-bold text-primary">
                          {scoringMethod === 'tri'
                            ? (result as TRIResult).triScore
                            : (result as NormalResult).score}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">
                          {scoringMethod === 'tri' ? '/ 1000' : `/ ${exam.totalPoints}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Participantes</p>
                    <p className="text-3xl font-bold">{results.length}</p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Média</p>
                    <p className="text-3xl font-bold">
                      {scoringMethod === 'tri'
                        ? Math.round(
                            (results as TRIResult[]).reduce((sum, r) => sum + r.triScore, 0) /
                              results.length
                          )
                        : Math.round(
                            ((results as NormalResult[]).reduce((sum, r) => sum + r.score, 0) /
                              results.length) *
                              100
                          ) / 100}
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Maior Nota</p>
                    <p className="text-3xl font-bold">
                      {scoringMethod === 'tri'
                        ? Math.max(...(results as TRIResult[]).map(r => r.triScore))
                        : Math.max(...(results as NormalResult[]).map(r => r.score))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
