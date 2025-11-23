'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Exam } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Edit, Trash2, Eye, EyeOff, Plus, Play, StopCircle, RotateCcw, FileCheck, FileDown } from 'lucide-react'

export default function AdminExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      setExams(data.exams || [])
    } catch (error) {
      console.error('Erro ao carregar provas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(examId: string) {
    if (!confirm('Tem certeza que deseja deletar esta prova?')) return

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao deletar')

      alert('Prova deletada com sucesso!')
      loadExams()
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function toggleVisibility(exam: Exam) {
    try {
      const res = await fetch(`/api/exams/${exam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !exam.isHidden }),
      })

      if (!res.ok) throw new Error('Erro ao atualizar')

      loadExams()
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function forceStart(examId: string) {
    if (!confirm('Tem certeza que deseja forçar o início da prova AGORA?')) return

    try {
      const res = await fetch(`/api/exams/${examId}/force-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      })

      if (!res.ok) throw new Error('Erro ao forçar início')

      const data = await res.json()
      alert(data.message)
      loadExams()
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function forceEnd(examId: string) {
    if (!confirm('Tem certeza que deseja forçar o TÉRMINO da prova AGORA?')) return

    try {
      const res = await fetch(`/api/exams/${examId}/force-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      })

      if (!res.ok) throw new Error('Erro ao forçar término')

      const data = await res.json()
      alert(data.message)
      loadExams()
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function resetSubmissions(examId: string) {
    if (!confirm('⚠️ ATENÇÃO! Isso irá DELETAR PERMANENTEMENTE todas as submissões desta prova.\n\nTodos os usuários poderão refazer a prova. Esta ação NÃO pode ser desfeita!\n\nDeseja continuar?')) return

    try {
      const res = await fetch(`/api/exams/${examId}/reset-submissions`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao zerar resultados')

      const data = await res.json()
      alert(data.message)
      loadExams()
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function downloadExamPDF(exam: Exam) {
    try {
      const res = await fetch(`/api/exams/${exam._id}/generate-pdf`)

      if (!res.ok) throw new Error('Erro ao gerar PDF')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exam.name}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Gerenciar Provas</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => router.push('/admin/exams/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Prova
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : exams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não criou nenhuma prova
              </p>
              <Button onClick={() => router.push('/admin/exams/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Prova
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <Card key={exam._id?.toString()}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CardTitle>{exam.title}</CardTitle>
                        {exam.isHidden && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            Oculto
                          </span>
                        )}
                      </div>
                      {exam.description && (
                        <CardDescription>{exam.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Questões:</span>{' '}
                        {exam.numberOfQuestions}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Pontuação:</span>{' '}
                        {exam.scoringMethod === 'tri' ? 'TRI (1000 pts)' : `${exam.totalPoints} pts`}
                      </p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Início:</span>{' '}
                        {formatDate(exam.startTime)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Término:</span>{' '}
                        {formatDate(exam.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/exams/${exam._id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVisibility(exam)}
                    >
                      {exam.isHidden ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Tornar Visível
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Ocultar
                        </>
                      )}
                    </Button>

                    {new Date() < new Date(exam.startTime) && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => forceStart(exam._id!.toString())}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Forçar Início
                      </Button>
                    )}

                    {new Date() < new Date(exam.endTime) && new Date() >= new Date(exam.startTime) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => forceEnd(exam._id!.toString())}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Forçar Término
                      </Button>
                    )}

                    {new Date() >= new Date(exam.startTime) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetSubmissions(exam._id!.toString())}
                        className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Zerar Resultados
                      </Button>
                    )}

                    {exam.questions.some(q => q.type === 'discursive') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/exams/${exam._id}/corrections`)}
                        className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                      >
                        <FileCheck className="h-4 w-4 mr-2" />
                        Corrigir Discursivas
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadExamPDF(exam)}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Gerar PDF da Prova
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(exam._id!.toString())}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>

                    {new Date() > new Date(exam.endTime) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/exam/${exam._id}/results`)}
                      >
                        Ver Resultados
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
