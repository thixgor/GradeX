'use client'

/**
 * Histórico de provas realizadas, com nota, correções discursivas e os PDFs.
 * Cada linha abre no lugar — a lista continua legível mesmo com dezenas de provas.
 *
 * ## O portão que faltava aqui
 *
 * Esta lista oferece três downloads — a prova em branco, as respostas do aluno
 * e o gabarito — e os gerava **sem consultar portão nenhum**. Enquanto
 * `/provas` e a tela da prova checavam o cargo antes de montar qualquer PDF,
 * uma conta gratuita baixava os três por aqui, tanto em `/profile` quanto no
 * diálogo de `/provas`. A porta da frente estava trancada e a dos fundos, não.
 *
 * Agora os três passam por `resolverDownloadsDaProva`, o mesmo veredito do
 * resto da plataforma, e consomem a cota do plano como qualquer outro download
 * de prova.
 *
 * ## O que este portão é, e o que ele não é
 *
 * A regra de **tempo** (gabarito só depois do término) é de verdade: o servidor
 * não entrega `isCorrect` antes da hora (ver `lib/provas/sanitizar-prova.ts`),
 * então um PDF gerado cedo sairia sem resposta nenhuma marcada.
 *
 * A regra de **cargo** é de produto, não de segurança — o PDF é montado no
 * navegador a partir de dados que a pessoa já pode ler legitimamente para fazer
 * a prova. O que ela garante é que o aplicativo não *entrega* o arquivo por um
 * botão a quem não assinou, e que o consumo de quem assinou seja contado.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ClipboardList, Download, FileText, Lock, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QUEST_LABEL, ROTA_ASSINATURA } from '@/lib/account-tier'
import { consumirCotaDoPlano } from '@/lib/plan-consume-client'
import { provaDaSubmissao, resolverDownloadsDaProva } from '@/lib/provas/downloads-da-prova'
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
  isPersonalExam?: boolean
  /** Exceção de download que o admin abriu nesta prova, quando houver. */
  freeDownloads?: { prova?: boolean; relatorio?: boolean; gabarito?: boolean } | null
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
  accountType,
  isAdmin,
  onError,
}: {
  submissions: UserSubmission[]
  loading: boolean
  userName: string
  /** Cargo de quem está olhando — decide se os PDFs saem. */
  accountType?: string | null
  isAdmin?: boolean
  onError: (message: string) => void
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [gerando, setGerando] = useState<string | null>(null)

  /**
   * Pergunta a cota do plano antes de montar o arquivo.
   *
   * O cargo diz se a pessoa TEM o recurso; a cota diz quantos ela ainda pode
   * gastar na janela. Sem esta chamada, esta lista era também o caminho para
   * furar o teto de quem assina um plano com limite diário.
   */
  async function cotaLiberada(recurso: string): Promise<boolean> {
    const cota = await consumirCotaDoPlano('provasPdf', recurso)
    if (!cota.permitido) {
      onError(cota.mensagem || 'Limite de downloads do seu plano atingido.')
      return false
    }
    return true
  }

  async function handleDownloadAnswerSheet(examId: string) {
    if (!(await cotaLiberada(`${examId}:gabarito`))) return
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
    if (!(await cotaLiberada(`${examId}:prova`))) return
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
    if (!(await cotaLiberada(`${submission.examId}:respostas`))) return
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
        // O mesmo veredito que /provas e a tela da prova usam. Ver o cabeçalho
        // deste arquivo para a diferença entre a regra de tempo e a de cargo.
        const downloads = resolverDownloadsDaProva(provaDaSubmissao(submission), {
          accountType,
          isAdmin,
          jaEnviou: true,
        })
        // A recusa por cargo é a única que se resolve assinando — a de tempo
        // some sozinha quando a prova encerra, e oferecer plano nela seria
        // vender o que a pessoa já tem.
        const bloqueadoPeloPlano =
          !downloads.prova.permitido && !downloads.prova.esperandoOFim

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
                  {/* O relatório é uma TELA, não um arquivo: ver as próprias
                      respostas nunca dependeu de assinatura. */}
                  {finished && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => router.push(`/exam/${submission.examId}/user/${submission.userId}`)}
                    >
                      <FileText className="mr-1.5 h-3 w-3" />
                      Relatório
                    </Button>
                  )}

                  {downloads.prova.permitido && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={gerando === `${submission._id}:prova`}
                      onClick={async () => {
                        setGerando(`${submission._id}:prova`)
                        try {
                          await handleDownloadExamPDF(submission.examId, submission.userId)
                        } finally {
                          setGerando(null)
                        }
                      }}
                    >
                      <Printer className="mr-1.5 h-3 w-3" />
                      Prova PDF
                    </Button>
                  )}

                  {downloads.relatorio.permitido && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={gerando === `${submission._id}:respostas`}
                      onClick={async () => {
                        setGerando(`${submission._id}:respostas`)
                        try {
                          await handleDownloadAnswersPDF(submission)
                        } finally {
                          setGerando(null)
                        }
                      }}
                    >
                      <ClipboardList className="mr-1.5 h-3 w-3" />
                      Respostas PDF
                    </Button>
                  )}

                  {downloads.gabarito.permitido && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={gerando === `${submission._id}:gabarito`}
                      onClick={async () => {
                        setGerando(`${submission._id}:gabarito`)
                        try {
                          await handleDownloadAnswerSheet(submission.examId)
                        } finally {
                          setGerando(null)
                        }
                      }}
                    >
                      <Download className="mr-1.5 h-3 w-3" />
                      Gabarito
                    </Button>
                  )}
                </div>

                {/* Duas esperas diferentes, duas frases diferentes. A de tempo
                    passa sozinha; a de plano precisa de uma decisão. */}
                {!finished && (
                  <p className="text-[11px] text-orange-600 dark:text-orange-400">
                    Prova em andamento. Gabarito e relatório liberados após o término.
                  </p>
                )}

                {bloqueadoPeloPlano && (
                  <button
                    onClick={() => router.push(ROTA_ASSINATURA)}
                    className="flex w-full items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-left transition-colors hover:bg-amber-500/15"
                  >
                    <Lock className="mt-0.5 h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px] leading-snug text-amber-800 dark:text-amber-200">
                      Baixar prova, respostas e gabarito em PDF é um recurso do{' '}
                      <strong>{QUEST_LABEL}</strong>. <span className="underline">Ver planos</span>
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
