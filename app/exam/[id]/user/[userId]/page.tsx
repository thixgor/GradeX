'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { Barcode } from '@/components/barcode'
import { Exam, ExamSubmission, Question } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileDown,
  History,
  Lock,
  MinusCircle,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react'
import { aplicarOrdemDaSubmissao } from '@/lib/provas/embaralhar'
import { resolverDownloadsDaProva } from '@/lib/provas/downloads-da-prova'
import { resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'
import { cn } from '@/lib/utils'

/**
 * O relatório de uma prova entregue.
 *
 * ## O que a tela antiga fazia de errado
 *
 * 1. **Numerava pela ordem do banco.** Numa prova embaralhada, a "questão 7" do
 *    relatório não era a questão 7 que o aluno respondeu. Agora a ordem vem da
 *    submissão (`questionOrder`) — a prova é remontada exatamente como ela
 *    apareceu para aquela pessoa.
 * 2. **Vazava a resposta comentada das discursivas.** O gabarito das objetivas
 *    esperava o término (`isExamFinished`), mas o `question.explanation` das
 *    discursivas era renderizado sem nenhuma condição — com a prova em
 *    andamento.
 * 3. **Baixava PDF sem checar nada.** O botão de relatório não passava por
 *    plano nem por tempo, ao contrário de todos os outros da plataforma.
 * 4. **Um `console.log` de depuração** rodava a cada carregamento, imprimindo
 *    título e horários da prova no console de quem abrisse a tela.
 *
 * ## A leitura
 *
 * Um relatório é lido em duas velocidades. Primeiro a pessoa quer o veredito —
 * quanto tirou, quanto acertou, o que ficou pendente; isso está no alto, em
 * números grandes. Depois ela quer UMA questão específica, quase sempre uma que
 * errou; por isso a lista abre fechada, com filtro por acerto/erro/branco, e
 * cada questão expande no lugar. A versão antiga despejava as questões inteiras
 * numa coluna só, e achar a errada exigia rolar a prova toda de novo.
 */

// Render text with \n line breaks and **bold** / *italic* inline markdown
function renderRichText(text: string | undefined | null): React.ReactNode {
  if (!text) return null
  const processed = text.replace(/\\nl/g, '\n').replace(/\\n/g, '\n')
  const parts = processed.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

type Situacao = 'certa' | 'errada' | 'branco' | 'aberta'
type Filtro = 'todas' | 'certa' | 'errada' | 'branco'

const CORES: Record<Situacao, { chip: string; borda: string; fundo: string; rotulo: string }> = {
  certa: {
    chip: 'bg-emerald-500 text-white',
    borda: 'border-emerald-500/30',
    fundo: 'bg-emerald-50/40 dark:bg-emerald-950/15',
    rotulo: 'Acertou',
  },
  errada: {
    chip: 'bg-rose-500 text-white',
    borda: 'border-rose-500/30',
    fundo: 'bg-rose-50/40 dark:bg-rose-950/15',
    rotulo: 'Errou',
  },
  branco: {
    chip: 'bg-slate-400 text-white',
    borda: 'border-border',
    fundo: 'bg-muted/30',
    rotulo: 'Em branco',
  },
  aberta: {
    chip: 'bg-violet-500 text-white',
    borda: 'border-violet-500/30',
    fundo: 'bg-violet-50/40 dark:bg-violet-950/15',
    rotulo: 'Discursiva',
  },
}

export default function UserSubmissionPage({ params }: { params: { id: string; userId: string } }) {
  const { id, userId } = params
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [submission, setSubmission] = useState<ExamSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [conta, setConta] = useState<{ accountType?: string; role?: string; id?: string }>({})
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [aberta, setAberta] = useState<string | null>(null)
  const [gerandoPdf, setGerandoPdf] = useState<string | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'info' | 'success'>('error')

  const avisar = useCallback((mensagem: string, tipo: 'error' | 'info' | 'success' = 'error') => {
    setToastMessage(mensagem)
    setToastType(tipo)
    setToastOpen(true)
  }, [])

  useEffect(() => {
    async function carregar() {
      try {
        // `ordem=original` para o relatório receber a prova como está no banco:
        // a ordem que interessa aqui é a da submissão, aplicada logo abaixo, e
        // não a que o servidor sortearia para quem está lendo a tela.
        const [resExam, resSub, resMe] = await Promise.all([
          fetch(`/api/exams/${id}?ordem=original`),
          fetch(`/api/exams/${id}/submissions/${userId}`),
          fetch('/api/auth/me'),
        ])

        const dadosExam = await resExam.json()
        if (!resExam.ok) throw new Error(dadosExam.error)
        setExam(dadosExam.exam)

        const dadosSub = await resSub.json()
        if (!resSub.ok) throw new Error(dadosSub.error)
        setSubmission(dadosSub.submission)

        if (resMe.ok) {
          const dadosMe = await resMe.json()
          setConta({
            accountType: dadosMe.user?.accountType,
            role: dadosMe.user?.role,
            id: dadosMe.user?._id || dadosMe.user?.id,
          })
        }
      } catch (error: any) {
        avisar(error.message || 'Não foi possível carregar o relatório.')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id, userId, avisar])

  const janela = useMemo(() => (exam ? resolverJanelaDaProva(exam) : null), [exam])
  const gabaritoLiberado = !!janela && (janela.encerrada || janela.fase === 'livre')

  const downloads = useMemo(
    () =>
      resolverDownloadsDaProva(exam, {
        accountType: conta.accountType,
        isAdmin: conta.role === 'admin',
        jaEnviou: true,
      }),
    [exam, conta],
  )

  /** A prova na ordem em que ESTE aluno a viu. */
  const questoes: Question[] = useMemo(
    () => (exam ? aplicarOrdemDaSubmissao(exam.questions || [], submission?.questionOrder) : []),
    [exam, submission],
  )

  const analise = useMemo(() => {
    if (!submission) return []
    return questoes.map((questao) => {
      const resposta = submission.answers?.find((a) => a.questionId === questao.id)

      if (questao.type !== 'multiple-choice') {
        return { questao, resposta, situacao: 'aberta' as Situacao, marcada: null, correta: null }
      }

      const marcada = questao.alternatives?.find((a) => a.id === resposta?.selectedAlternative) || null
      const correta = questao.alternatives?.find((a) => a.isCorrect) || null
      const situacao: Situacao = !marcada ? 'branco' : marcada.id === correta?.id ? 'certa' : 'errada'
      return { questao, resposta, situacao, marcada, correta }
    })
  }, [questoes, submission])

  const resumo = useMemo(() => {
    const objetivas = analise.filter((a) => a.questao.type === 'multiple-choice')
    const certas = objetivas.filter((a) => a.situacao === 'certa').length
    const erradas = objetivas.filter((a) => a.situacao === 'errada').length
    const brancos = objetivas.filter((a) => a.situacao === 'branco').length
    const discursivas = analise.filter((a) => a.questao.type !== 'multiple-choice').length
    return {
      objetivas: objetivas.length,
      certas,
      erradas,
      brancos,
      discursivas,
      // O aproveitamento é sobre as objetivas: misturar discursiva pendente na
      // conta daria um número que muda sozinho quando a correção sai.
      aproveitamento: objetivas.length > 0 ? (certas / objetivas.length) * 100 : null,
    }
  }, [analise])

  const visiveis = useMemo(
    () => (filtro === 'todas' ? analise : analise.filter((a) => a.situacao === filtro)),
    [analise, filtro],
  )

  async function baixar(tipo: 'relatorio' | 'gabarito') {
    if (!exam || !submission) return
    const veredito = tipo === 'relatorio' ? downloads.relatorio : downloads.gabarito
    if (!veredito.permitido) {
      avisar(veredito.motivo || 'Download não disponível.', 'info')
      return
    }
    try {
      setGerandoPdf(tipo)
      const gerador = await import('@/lib/user-report-generator')
      const dados = {
        // O PDF recebe a prova já na ordem do aluno: se ele reclamar da
        // "questão 12", a folha impressa precisa concordar com a tela.
        exam: { ...exam, questions: questoes },
        examId: id,
        userName: submission.userName,
        signature: submission.signature || '',
        answers: submission.answers || [],
      }
      if (tipo === 'relatorio') await gerador.downloadUserReportPDF(dados)
      else await gerador.generateUserReportWithGabaritoPDF(dados)
    } catch (error: any) {
      avisar('Erro ao gerar PDF: ' + error.message)
    } finally {
      setGerandoPdf(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Carregando relatório…
        </div>
      </div>
    )
  }

  if (!exam || !submission) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold">Relatório indisponível</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {toastMessage || 'Não encontramos esta entrega. Ela pode ter sido removida ou pertencer a outra conta.'}
        </p>
        <Button variant="outline" onClick={() => router.push('/provas')} className="rounded-xl">
          Voltar para as provas
        </Button>
      </div>
    )
  }

  const notaMaxima = exam.scoringMethod === 'tri' ? 1000 : exam.totalPoints || 100
  const nota = exam.scoringMethod === 'tri' ? submission.triScore : submission.score
  const notaEmPercentual =
    typeof nota === 'number' && notaMaxima > 0 ? Math.max(0, Math.min(100, (nota / notaMaxima) * 100)) : null
  const corDaNota =
    notaEmPercentual === null ? '#94a3b8' : notaEmPercentual >= 70 ? '#10b981' : notaEmPercentual >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight sm:text-lg">Relatório da prova</h1>
              <p className="truncate text-xs text-muted-foreground">{exam.title}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
        {/* ── Veredito ─────────────────────────────────────────────── */}
        <section
          className="exam-resultado-entra relative overflow-hidden rounded-3xl border border-border/60 bg-background/70 p-6 shadow-lg backdrop-blur-md sm:p-8"
          style={{ '--exam-ordem': 0 } as React.CSSProperties}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#468152] via-emerald-400 to-[#E2A43E]" />

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div
              className="exam-anel-de-nota flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full"
              style={{ '--exam-nota': notaEmPercentual ?? 0, '--exam-anel-cor': corDaNota } as React.CSSProperties}
              role="img"
              aria-label={`Nota: ${nota ?? 'aguardando correção'}`}
            >
              <div className="flex h-[7.25rem] w-[7.25rem] flex-col items-center justify-center rounded-full bg-background">
                {typeof nota === 'number' ? (
                  <>
                    <span className="exam-numero-sobe text-3xl font-black leading-none tabular-nums">
                      {nota.toFixed(exam.scoringMethod === 'tri' ? 0 : 1)}
                    </span>
                    <span className="mt-1 text-[11px] text-muted-foreground">de {notaMaxima}</span>
                  </>
                ) : (
                  <span className="px-3 text-center text-xs font-medium leading-tight text-muted-foreground">
                    Aguardando correção
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
              <div>
                <p className="flex items-center justify-center gap-2 text-lg font-bold sm:justify-start">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {submission.userName}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Entregue em {formatDate(submission.submittedAt)}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                {resumo.objetivas > 0 && (
                  <>
                    <Selo cor="emerald" icone={CheckCircle2} valor={resumo.certas} rotulo="acertos" />
                    <Selo cor="rose" icone={XCircle} valor={resumo.erradas} rotulo="erros" />
                    {resumo.brancos > 0 && (
                      <Selo cor="slate" icone={MinusCircle} valor={resumo.brancos} rotulo="em branco" />
                    )}
                  </>
                )}
                {resumo.discursivas > 0 && (
                  <Selo cor="violet" icone={Sparkles} valor={resumo.discursivas} rotulo="discursivas" />
                )}
                {(submission.resumesUsed || 0) > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <History className="h-3.5 w-3.5" />
                    Prova retomada após queda
                  </span>
                )}
              </div>

              {resumo.aproveitamento !== null && (
                <div className="space-y-1">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="exam-retomada-barra h-full rounded-full transition-all"
                      style={{ width: `${resumo.aproveitamento}%`, background: corDaNota }}
                    />
                  </div>
                  <p className="text-xs font-medium tabular-nums text-muted-foreground">
                    {resumo.aproveitamento.toFixed(1)}% de aproveitamento nas objetivas
                  </p>
                </div>
              )}
            </div>
          </div>

          {!gabaritoLiberado && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5">
              <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                Suas respostas já estão aqui, mas o <strong>gabarito só aparece quando a prova terminar</strong>
                {janela?.terminaEm
                  ? ` (${new Date(janela.terminaEm).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })})`
                  : ''}
                . Enquanto a turma responde, a resposta certa não circula.
              </p>
            </div>
          )}
        </section>

        {/* ── Downloads ────────────────────────────────────────────── */}
        <section
          className="exam-resultado-entra rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur-md"
          style={{ '--exam-ordem': 1 } as React.CSSProperties}
        >
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Documentos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#468152] to-[#3a6d44] font-semibold text-white hover:from-[#3a6d44] hover:to-[#2f5a38] disabled:bg-none"
              disabled={!!gerandoPdf}
              onClick={() => baixar('relatorio')}
            >
              {gerandoPdf === 'relatorio' ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="mr-2 h-5 w-5" />
              )}
              Minha prova respondida
            </Button>

            <Button
              variant="outline"
              className="h-12 w-full rounded-xl font-semibold"
              disabled={!!gerandoPdf || downloads.gabarito.esperandoOFim}
              title={downloads.gabarito.motivo || undefined}
              onClick={() => baixar('gabarito')}
            >
              {gerandoPdf === 'gabarito' ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : downloads.gabarito.esperandoOFim ? (
                <Lock className="mr-2 h-4 w-4" />
              ) : (
                <FileDown className="mr-2 h-5 w-5" />
              )}
              {downloads.gabarito.esperandoOFim ? 'Gabarito após o término' : 'Com respostas comentadas'}
            </Button>
          </div>
          {!downloads.relatorio.permitido && !downloads.relatorio.esperandoOFim && (
            <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">{downloads.relatorio.motivo}</p>
          )}
        </section>

        {/* ── Questão a questão ────────────────────────────────────── */}
        <section
          className="exam-resultado-entra space-y-3"
          style={{ '--exam-ordem': 2 } as React.CSSProperties}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Questão a questão</h2>
            {/*
              O filtro é a razão desta lista existir. Quem abre um relatório
              quase sempre quer as que errou — antes era preciso rolar a prova
              inteira de novo para encontrá-las.
            */}
            <div className="flex flex-wrap gap-1.5">
              {([
                ['todas', `Todas (${analise.length})`],
                ['errada', `Erros (${resumo.erradas})`],
                ['certa', `Acertos (${resumo.certas})`],
                ['branco', `Em branco (${resumo.brancos})`],
              ] as [Filtro, string][]).map(([chave, rotulo]) => (
                <button
                  key={chave}
                  onClick={() => setFiltro(chave)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    filtro === chave
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70',
                  )}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </div>

          {visiveis.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Nenhuma questão nesta situação.
            </p>
          )}

          {visiveis.map(({ questao, resposta, situacao, marcada, correta }) => {
            const expandida = aberta === questao.id
            const cor = CORES[situacao]
            const correcao = submission.corrections?.find((c) => c.questionId === questao.id)

            return (
              <article
                key={questao.id}
                className={cn('overflow-hidden rounded-2xl border transition-colors', cor.borda, cor.fundo)}
              >
                <button
                  onClick={() => setAberta(expandida ? null : questao.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                  aria-expanded={expandida}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                      cor.chip,
                    )}
                  >
                    {questao.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {renderRichText((questao.statement || '').slice(0, 110))}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {gabaritoLiberado || situacao === 'aberta' || situacao === 'branco'
                        ? cor.rotulo
                        : 'Respondida'}
                      {situacao !== 'aberta' && marcada ? ` · você marcou ${marcada.letter}` : ''}
                    </span>
                  </span>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200',
                      expandida && 'rotate-90',
                    )}
                  />
                </button>

                {expandida && (
                  <div className="space-y-4 border-t border-border/40 px-4 pb-5 pt-4">
                    <div>
                      <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Enunciado
                      </h3>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {renderRichText(questao.statement)}
                      </p>
                      {questao.command && (
                        <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed">
                          {renderRichText(questao.command)}
                        </p>
                      )}
                    </div>

                    {questao.type === 'multiple-choice' ? (
                      <div className="space-y-2">
                        {questao.alternatives?.map((alternativa) => {
                          const foiMarcada = alternativa.id === marcada?.id
                          const eACerta = gabaritoLiberado && alternativa.id === correta?.id
                          return (
                            <div
                              key={alternativa.id}
                              className={cn(
                                'flex items-start gap-2.5 rounded-xl border p-3 text-sm',
                                eACerta
                                  ? 'border-emerald-500/40 bg-emerald-500/10'
                                  : foiMarcada
                                    ? 'border-rose-500/40 bg-rose-500/10'
                                    : 'border-border/50 bg-background/50',
                              )}
                            >
                              <span className="font-bold">{alternativa.letter})</span>
                              <span className="min-w-0 flex-1">{renderRichText(alternativa.text)}</span>
                              {eACerta && (
                                <span className="flex-shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                  Gabarito
                                </span>
                              )}
                              {foiMarcada && !eACerta && (
                                <span className="flex-shrink-0 text-xs font-semibold text-muted-foreground">
                                  Sua marcação
                                </span>
                              )}
                            </div>
                          )
                        })}
                        {!marcada && (
                          <p className="text-xs italic text-muted-foreground">Você não respondeu esta questão.</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Sua resposta
                        </h3>
                        <div className="whitespace-pre-wrap rounded-xl bg-background/60 p-3 text-sm leading-relaxed">
                          {resposta?.discursiveText || resposta?.essayText || (
                            <span className="italic text-muted-foreground">Não respondida</span>
                          )}
                        </div>
                        {resposta?.discursiveSelfScore !== undefined && (
                          <p className="mt-2 text-xs font-medium text-muted-foreground">
                            Autoavaliação: {resposta.discursiveSelfScore}%
                          </p>
                        )}
                      </div>
                    )}

                    {correcao && (
                      <div className="space-y-2 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-violet-800 dark:text-violet-200">Correção</h3>
                          <span className="text-lg font-black tabular-nums text-violet-700 dark:text-violet-300">
                            {correcao.score}/{correcao.maxScore}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-violet-900 dark:text-violet-100">
                          {correcao.feedback}
                        </p>
                        {correcao.keyPointsFound && correcao.keyPointsFound.length > 0 && (
                          <ul className="space-y-1 pt-1">
                            {correcao.keyPointsFound.map((kpId) => {
                              const ponto = questao.keyPoints?.find((kp) => kp.id === kpId)
                              return ponto ? (
                                <li key={kpId} className="flex items-start gap-2 text-xs">
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                                  <span>{ponto.description}</span>
                                </li>
                              ) : null
                            })}
                          </ul>
                        )}
                      </div>
                    )}

                    {/*
                      A resposta comentada espera o término — inclusive nas
                      discursivas, onde ela era renderizada sem condição
                      nenhuma e vazava o gabarito com a prova em andamento.
                    */}
                    {gabaritoLiberado && (questao as any).commentedFeedback?.explanations && (
                      <div className="space-y-2 rounded-xl border border-blue-500/25 bg-blue-500/10 p-4">
                        <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                          Análise das alternativas
                        </h3>
                        {Object.entries((questao as any).commentedFeedback.explanations).map(([letra, texto]) => {
                          const eACerta = letra === (questao as any).commentedFeedback?.correctAlternative
                          return (
                            <div
                              key={letra}
                              className={cn(
                                'rounded-lg border-l-4 p-2.5',
                                eACerta
                                  ? 'border-l-emerald-500 bg-emerald-500/10'
                                  : 'border-l-rose-400 bg-rose-500/5',
                              )}
                            >
                              <p
                                className={cn(
                                  'text-xs font-bold',
                                  eACerta ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300',
                                )}
                              >
                                {letra}) {eACerta ? 'Correta' : 'Incorreta'}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{texto as string}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {gabaritoLiberado && questao.explanation && (
                      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
                        <h3 className="mb-1.5 text-sm font-bold text-amber-800 dark:text-amber-200">
                          Resposta comentada
                        </h3>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                          {renderRichText(questao.explanation)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </section>

        {/* ── Comprovante ──────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border/60 bg-background/60 p-5 text-center backdrop-blur-md">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Comprovante de entrega
          </h2>
          <Barcode
            value={`${id}-${submission.userName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15)}`}
            height={52}
            fontSize={12}
          />
          {submission.signature && (
            <div className="mt-4 flex flex-col items-center gap-1.5">
              <img
                src={submission.signature}
                alt="Assinatura do candidato"
                className="h-20 rounded-lg border border-border bg-white p-1.5"
              />
              <p className="text-[11px] text-muted-foreground">Assinatura registrada no início da prova</p>
            </div>
          )}
          {submission.startedAt && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Início em {formatDate(submission.startedAt)}
            </p>
          )}
        </section>
      </main>

      <ToastAlert open={toastOpen} onOpenChange={setToastOpen} message={toastMessage} type={toastType} />
    </div>
  )
}

function Selo({
  cor,
  icone: Icone,
  valor,
  rotulo,
}: {
  cor: 'emerald' | 'rose' | 'slate' | 'violet'
  icone: typeof CheckCircle2
  valor: number
  rotulo: string
}) {
  const classes = {
    emerald: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    rose: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400',
    slate: 'border-border bg-muted text-muted-foreground',
    violet: 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-400',
  }[cor]

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium', classes)}>
      <Icone className="h-3.5 w-3.5" />
      <strong className="tabular-nums">{valor}</strong> {rotulo}
    </span>
  )
}
