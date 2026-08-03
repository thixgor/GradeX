'use client'

/**
 * Histórico de provas realizadas, com nota, correções discursivas e os PDFs.
 * Cada linha abre no lugar — a lista continua legível mesmo com dezenas de provas.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ClipboardList, Download, FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface UserSubmission {
  _id: string
  examId: string
  examName: string
  examTitle: string
  userId: string
  userName: string
  startedAt?: Date
  submittedAt: Date
  score?: number
  triScore?: number
  discursiveScore?: number
  correctionStatus?: 'pending' | 'corrected'
  corrections?: Array<{
    questionId: string
    score: number
    maxScore: number
    feedback: string
    method: string
  }>
  hasDiscursiveQuestions: boolean
  isPracticeExam?: boolean
  examEndTime?: Date
  answers?: any[]
  exam?: any
}

function calculateDuration(startTime: Date, endTime: Date): string {
  const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMins / 60)
  const minutes = diffMins % 60
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

function isExamFinished(submission: UserSubmission): boolean {
  if (submission.isPracticeExam) return true
  if (!submission.examEndTime) return false
  return new Date() > new Date(submission.examEndTime)
}

export function SubmissionsList({
  submissions,
  loading,
  userName,
  onError,
}: {
  submissions: UserSubmission[]
  loading: boolean
  userName: string
  onError: (message: string) => void
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)

  async function handleDownloadAnswerSheet(examId: string) {
    try {
      const res = await fetch(`/api/exams/${examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const data = await res.json()
      const { generateGabaritoPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generateGabaritoPDF(data.exam)
      downloadPDF(blob, `Gabarito-${data.exam.title}.pdf`, {
        type: 'gabarito_pdf',
        resourceId: examId,
        resourceTitle: data.exam.title,
      })
    } catch (error: any) {
      onError('Erro ao gerar gabarito: ' + error.message)
    }
  }

  async function handleDownloadExamPDF(examId: string, userId: string) {
    try {
      const res = await fetch(`/api/exams/${examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const data = await res.json()
      const { generateExamPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generateExamPDF(data.exam, userId)
      downloadPDF(blob, `Prova-${data.exam.title}.pdf`, {
        type: 'exam_pdf',
        resourceId: examId,
        resourceTitle: data.exam.title,
      })
    } catch (error: any) {
      onError('Erro ao gerar PDF da prova: ' + error.message)
    }
  }

  async function handleDownloadAnswersPDF(submission: UserSubmission) {
    try {
      const res = await fetch(`/api/exams/${submission.examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const examData = await res.json()
      const submissionRes = await fetch(`/api/submissions/${submission._id}`)
      if (!submissionRes.ok) throw new Error('Erro ao buscar submissao')
      const submissionData = await submissionRes.json()
      const answers = submissionData.submission?.answers || []
      const { generateStudentAnswersPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generateStudentAnswersPDF(examData.exam, answers, submission.userName || userName)
      downloadPDF(blob, `Minhas-Respostas-${examData.exam.title}.pdf`, {
        type: 'student_answers_pdf',
        resourceId: submission.examId,
        resourceTitle: examData.exam.title,
      })
    } catch (error: any) {
      onError('Erro ao gerar PDF de respostas: ' + error.message)
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card py-12 text-center shadow-sm">
        <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="mb-4 text-sm text-muted-foreground">Nenhuma prova realizada ainda</p>
        <Button size="sm" variant="outline" onClick={() => router.push('/')}>
          Ver provas disponíveis
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {submissions.map((submission) => {
        const isExpanded = expanded === submission._id
        const isCorrected =
          submission.correctionStatus === 'corrected' ||
          !submission.hasDiscursiveQuestions ||
          !!submission.isPracticeExam
        const finished = isExamFinished(submission)

        return (
          <div key={submission._id} className="overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-200">
            <button
              onClick={() => setExpanded(isExpanded ? null : submission._id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
            >
              <div className={cn('h-2 w-2 shrink-0 rounded-full', isCorrected ? 'bg-green-500' : 'bg-yellow-500')} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{submission.examTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(submission.submittedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {submission.startedAt && ` · ${calculateDuration(submission.startedAt, submission.submittedAt)}`}
                </p>
              </div>
              {isCorrected && submission.triScore != null && (
                <span className="shrink-0 text-sm font-bold tabular-nums">{submission.triScore.toFixed(0)}</span>
              )}
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isExpanded && 'rotate-180')}
              />
            </button>

            {isExpanded && (
              <div className="animate-fade-in space-y-3 border-t border-border/50 px-4 pb-4 pt-1">
                {isCorrected ? (
                  <div className="flex flex-wrap gap-4">
                    {submission.triScore != null && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nota TRI</p>
                        <p className="text-xl font-bold">{submission.triScore.toFixed(0)}</p>
                      </div>
                    )}
                    {submission.score != null && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pontuação</p>
                        <p className="text-xl font-bold">{submission.score.toFixed(1)}</p>
                      </div>
                    )}
                    {submission.discursiveScore != null && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Discursiva</p>
                        <p className="text-xl font-bold">{submission.discursiveScore.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300">
                    Aguardando correção das questões discursivas.
                  </p>
                )}

                {submission.corrections && submission.corrections.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">Correções discursivas</p>
                    {submission.corrections.map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs"
                      >
                        <span>Questão {idx + 1}</span>
                        <span className="font-bold">
                          {(c.score ?? 0).toFixed(1)} / {c.maxScore}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleDownloadExamPDF(submission.examId, submission.userId)}
                  >
                    <Printer className="mr-1.5 h-3 w-3" />
                    Prova PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleDownloadAnswersPDF(submission)}
                  >
                    <ClipboardList className="mr-1.5 h-3 w-3" />
                    Respostas PDF
                  </Button>
                  {finished && (
                    <>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => router.push(`/exam/${submission.examId}/user/${submission.userId}`)}
                      >
                        <FileText className="mr-1.5 h-3 w-3" />
                        Relatório
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleDownloadAnswerSheet(submission.examId)}
                      >
                        <Download className="mr-1.5 h-3 w-3" />
                        Gabarito
                      </Button>
                    </>
                  )}
                </div>
                {!finished && (
                  <p className="text-[11px] text-orange-600 dark:text-orange-400">
                    Prova em andamento. Gabarito e relatório liberados após o término.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
