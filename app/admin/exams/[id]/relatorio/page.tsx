'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileDown,
  History,
  RefreshCw,
  Target,
  TrendingDown,
  Users,
} from 'lucide-react'
import { ModalDeAnalise } from '@/components/admin/provas/modal-de-analise'
import type { OpcoesDaAnalise } from '@/lib/pdf/analise-da-prova'
import { ToastAlert } from '@/components/ui/toast-alert'
import { ExamGateStatus } from '@/components/exam/exam-gate-status'
import { ATTEMPT_STATUS_LABELS } from '@/lib/tracking/exam-attempts'
import { cn } from '@/lib/utils'

/**
 * O relatório da prova para quem a aplicou.
 *
 * O admin tinha "Ver Resultados" — e só depois do término, e só um ranking de
 * nomes e notas. Durante a prova, a pergunta que ele realmente tem ("a turma
 * está conseguindo entrar?", "quantos já entregaram?", "alguém caiu?") não
 * tinha tela; depois dela, a pergunta ("qual questão derrubou todo mundo?")
 * exigia abrir o relatório de um aluno por vez.
 *
 * Esta tela responde as duas, e responde durante a prova. A ordem das seções é
 * a ordem em que as perguntas aparecem: primeiro presença (a prova está
 * acontecendo?), depois notas (como foi?), depois questões (o que deu errado?),
 * e por último a lista nominal — que é para onde se vai quando já se sabe o que
 * procurar.
 */

interface Relatorio {
  prova: any
  janela: any
  presenca: {
    convocados: number | null
    presentes: number
    entregaram: number
    rascunhosAbertos: number
    porStatus: Record<string, number>
    retomaram: number
  }
  notas: {
    total: number
    media: number | null
    mediana: number | null
    maior: number | null
    menor: number | null
    distribuicao: { rotulo: string; quantidade: number }[]
    aguardandoCorrecao: number
  }
  questoes: any[]
  participantes: any[]
}

type Aba = 'presenca' | 'questoes' | 'alunos'

export default function AdminExamReportPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [dados, setDados] = useState<Relatorio | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<Aba>('presenca')
  const [modalDeAnalise, setModalDeAnalise] = useState(false)
  const [gerandoAnalise, setGerandoAnalise] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const carregar = useCallback(
    async (silencioso = false) => {
      if (silencioso) setAtualizando(true)
      try {
        const res = await fetch(`/api/admin/exams/${id}/relatorio`)
        const corpo = await res.json()
        if (!res.ok) throw new Error(corpo.error)
        setDados(corpo)
        setErro(null)
      } catch (error: any) {
        setErro(error.message || 'Erro ao carregar o relatório.')
      } finally {
        setCarregando(false)
        setAtualizando(false)
      }
    },
    [id],
  )

  useEffect(() => {
    carregar()
  }, [carregar])

  /*
   * Enquanto a prova acontece, o relatório se atualiza sozinho a cada 30s.
   * Depois que ela encerra, os números param de mudar — e um polling eterno só
   * gastaria requisição de uma aba esquecida aberta.
   */
  useEffect(() => {
    if (!dados || dados.janela?.encerrada || dados.janela?.fase === 'livre') return
    const relogio = setInterval(() => carregar(true), 30_000)
    return () => clearInterval(relogio)
  }, [dados, carregar])

  /**
   * O PDF de análise.
   *
   * O gerador entra por `import()` dinâmico: ele carrega o jsPDF e as fontes
   * Roboto, e essa é a metade do peso desta rota para quem só veio olhar a
   * presença da turma.
   */
  async function gerarAnalise(opcoes: OpcoesDaAnalise) {
    if (!dados) return
    setGerandoAnalise(true)
    try {
      const { baixarAnaliseDaProvaPDF } = await import('@/lib/pdf/analise-da-prova')
      await baixarAnaliseDaProvaPDF(dados as any, opcoes)
      setModalDeAnalise(false)
    } catch (error: any) {
      setAviso('Não foi possível montar o PDF: ' + (error?.message || 'erro desconhecido'))
    } finally {
      setGerandoAnalise(false)
    }
  }

  const questoesOrdenadas = useMemo(() => {
    if (!dados) return []
    // Da mais difícil para a mais fácil: a lista existe para achar a questão
    // problemática, e ela nunca é a primeira da prova por acaso.
    return [...dados.questoes]
      .filter((q) => q.percentualDeAcerto !== null)
      .sort((a, b) => a.percentualDeAcerto - b.percentualDeAcerto)
  }, [dados])

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Carregando relatório…
        </div>
      </div>
    )
  }

  if (erro || !dados) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-bold">Relatório indisponível</p>
        <p className="max-w-sm text-sm text-muted-foreground">{erro}</p>
        <Button variant="outline" onClick={() => router.push('/admin/exams')} className="rounded-xl">
          Voltar para as provas
        </Button>
      </div>
    )
  }

  const { prova, janela, presenca, notas } = dados
  const emAndamento = !janela?.encerrada && janela?.fase !== 'livre'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/exams')} aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight sm:text-lg">Relatório da prova</h1>
              <p className="truncate text-xs text-muted-foreground">{prova.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/*
              O documento que fecha a prova com a turma. Fica no cabeçalho e não
              no fim da página porque é o que o admin vem buscar quando a prova
              já acabou — e a página, aí, é longa.
            */}
            <Button
              onClick={() => setModalDeAnalise(true)}
              size="sm"
              className="bg-gradient-to-r from-[#468152] to-[#3a6d44] font-semibold text-white hover:from-[#3a6d44] hover:to-[#2f5a38]"
            >
              <FileDown className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">PDF de análise</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => carregar(true)}
              aria-label="Atualizar"
              title="Atualizar agora"
            >
              <RefreshCw className={cn('h-4 w-4', atualizando && 'animate-spin')} />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* ── Cabeçalho da prova ───────────────────────────────────── */}
        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3 rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                  emAndamento
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <DoorOpen className="h-3.5 w-3.5" />
                {emAndamento ? 'Acontecendo agora' : 'Encerrada'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                <Users className="h-3.5 w-3.5" />
                {prova.publico.rotulo}
              </span>
              {prova.shuffleQuestions && (
                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-400">
                  Questões embaralhadas
                </span>
              )}
              {prova.shuffleAlternatives && (
                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-400">
                  Alternativas embaralhadas
                </span>
              )}
              {prova.isHidden && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Oculta
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Cartao
                rotulo="Presentes"
                valor={String(presenca.presentes)}
                nota={
                  presenca.convocados !== null
                    ? `de ${presenca.convocados} convocados`
                    : 'abriram a prova'
                }
                icone={Users}
              />
              <Cartao
                rotulo="Entregaram"
                valor={String(presenca.entregaram)}
                nota={
                  presenca.presentes > 0
                    ? `${Math.round((presenca.entregaram / presenca.presentes) * 100)}% dos presentes`
                    : '—'
                }
                icone={CheckCircle2}
                cor="emerald"
              />
              <Cartao
                rotulo="Média"
                valor={notas.media !== null ? notas.media.toFixed(1) : '—'}
                nota={`de ${prova.notaMaxima}`}
                icone={Target}
              />
              <Cartao
                rotulo="Fazendo agora"
                valor={String(presenca.porStatus.in_progress || 0)}
                nota={`${presenca.rascunhosAbertos} rascunho(s) salvo(s)`}
                icone={Clock}
                cor={emAndamento ? 'blue' : undefined}
              />
            </div>

            {(notas.aguardandoCorrecao > 0 || presenca.retomaram > 0) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {notas.aguardandoCorrecao > 0 && (
                  <button
                    onClick={() => router.push(`/admin/exams/${id}/corrections`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-500/20 dark:text-purple-300"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {notas.aguardandoCorrecao} aguardando correção
                  </button>
                )}
                {presenca.retomaram > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <History className="h-3.5 w-3.5" />
                    {presenca.retomaram} {presenca.retomaram === 1 ? 'aluno retomou' : 'alunos retomaram'} após queda
                  </span>
                )}
              </div>
            )}
          </div>

          {janela && janela.fase !== 'livre' && <ExamGateStatus janela={janela} />}
        </section>

        {/* ── Abas ─────────────────────────────────────────────────── */}
        <div className="flex gap-1.5 border-b border-border/60">
          {([
            ['presenca', 'Presença e notas'],
            ['questoes', `Questões (${questoesOrdenadas.length})`],
            ['alunos', `Alunos (${dados.participantes.length})`],
          ] as [Aba, string][]).map(([chave, rotulo]) => (
            <button
              key={chave}
              onClick={() => setAba(chave)}
              className={cn(
                '-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
                aba === chave
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {aba === 'presenca' && (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur-md">
              <h2 className="mb-4 text-sm font-bold">Onde cada pessoa parou</h2>
              {/*
                Os estados vêm de `exam_attempts`, que acompanha a tentativa
                desde a abertura da tela — e não da coleção de entregas, que só
                enxerga quem terminou. É a diferença entre "12 entregaram" e "12
                entregaram, 5 estão respondendo e 3 sumiram no meio".
              */}
              <ul className="space-y-2">
                {(['submitted', 'in_progress', 'idle', 'abandoned', 'opened'] as const).map((estado) => {
                  const quantidade = presenca.porStatus[estado] || 0
                  const proporcao = presenca.presentes > 0 ? (quantidade / presenca.presentes) * 100 : 0
                  return (
                    <li key={estado} className="flex items-center gap-3">
                      <span className="w-28 flex-shrink-0 text-xs text-muted-foreground">
                        {ATTEMPT_STATUS_LABELS[estado]}
                      </span>
                      <div className="h-5 flex-1 overflow-hidden rounded-md bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-md',
                            estado === 'submitted'
                              ? 'bg-emerald-500'
                              : estado === 'in_progress'
                                ? 'bg-blue-500'
                                : estado === 'abandoned'
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400',
                          )}
                          style={{ width: `${Math.max(proporcao, quantidade > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      <span className="w-8 flex-shrink-0 text-xs font-bold tabular-nums">{quantidade}</span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur-md">
              <h2 className="mb-4 text-sm font-bold">Distribuição das notas</h2>
              {notas.total === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma nota ainda.</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {notas.distribuicao.map((faixa) => {
                      const proporcao = (faixa.quantidade / notas.total) * 100
                      return (
                        <li key={faixa.rotulo} className="flex items-center gap-3">
                          <span className="w-16 flex-shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                            {faixa.rotulo}
                          </span>
                          <div className="h-5 flex-1 overflow-hidden rounded-md bg-muted">
                            <div
                              className="h-full rounded-md bg-gradient-to-r from-[#468152] to-emerald-400"
                              style={{ width: `${Math.max(proporcao, faixa.quantidade > 0 ? 4 : 0)}%` }}
                            />
                          </div>
                          <span className="w-8 flex-shrink-0 text-xs font-bold tabular-nums">
                            {faixa.quantidade}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-center">
                    <MiniNumero rotulo="Mediana" valor={notas.mediana?.toFixed(1) ?? '—'} />
                    <MiniNumero rotulo="Maior" valor={notas.maior?.toFixed(1) ?? '—'} />
                    <MiniNumero rotulo="Menor" valor={notas.menor?.toFixed(1) ?? '—'} />
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {aba === 'questoes' && (
          <section className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Da mais difícil para a mais fácil. Uma questão com acerto muito baixo e uma alternativa
              concentrando as marcações costuma ser um problema de enunciado, não de estudo.
            </p>
            {questoesOrdenadas.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                Nenhuma questão objetiva respondida ainda.
              </p>
            )}
            {questoesOrdenadas.map((questao) => {
              const dificil = questao.percentualDeAcerto < 40
              return (
                <article
                  key={questao.questionId}
                  className={cn(
                    'rounded-2xl border p-4',
                    dificil ? 'border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/15' : 'border-border/60 bg-background/60',
                  )}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span
                      className={cn(
                        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white',
                        dificil ? 'bg-rose-500' : 'bg-emerald-500',
                      )}
                    >
                      {questao.number}
                    </span>
                    <p className="min-w-0 flex-1 text-sm leading-snug text-muted-foreground line-clamp-2">
                      {questao.enunciado}
                    </p>
                    <div className="flex-shrink-0 text-right">
                      <p
                        className={cn(
                          'text-xl font-black tabular-nums leading-none',
                          dificil ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {questao.percentualDeAcerto.toFixed(0)}%
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {questao.acertos}/{questao.respondidas} acertos
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {questao.porAlternativa.map((alternativa: any) => {
                      const proporcao =
                        questao.respondidas > 0 ? (alternativa.escolhas / questao.respondidas) * 100 : 0
                      return (
                        <span
                          key={alternativa.id}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs tabular-nums',
                            alternativa.isCorrect
                              ? 'border-emerald-500/40 bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-400'
                              : 'border-border bg-muted/50 text-muted-foreground',
                          )}
                        >
                          <strong>{alternativa.letter}</strong>
                          {alternativa.escolhas} ({proporcao.toFixed(0)}%)
                        </span>
                      )
                    })}
                    {questao.emBranco > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground">
                        <TrendingDown className="h-3 w-3" />
                        {questao.emBranco} em branco
                      </span>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {aba === 'alunos' && (
          <section className="overflow-hidden rounded-2xl border border-border/60 bg-background/60 backdrop-blur-md">
            {dados.participantes.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma entrega ainda.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Aluno</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Nota</th>
                    <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">Duração</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {dados.participantes.map((p, i) => (
                    <tr key={p.userId} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <span className="mr-2 text-xs text-muted-foreground tabular-nums">{i + 1}.</span>
                        <span className="font-medium">{p.userName}</span>
                        {p.resumesUsed > 0 && (
                          <span
                            className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                            title="Este aluno caiu no meio da prova e retomou"
                          >
                            <History className="h-2.5 w-2.5" />
                            retomou
                          </span>
                        )}
                        {p.correctionStatus === 'pending' && (
                          <span className="ml-2 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300">
                            correção pendente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                        {p.score !== null ? p.score.toFixed(1) : '—'}
                      </td>
                      <td className="hidden px-4 py-2.5 text-right tabular-nums text-muted-foreground sm:table-cell">
                        {p.duracaoMin !== null ? `${p.duracaoMin} min` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-lg text-xs"
                          onClick={() => router.push(`/exam/${id}/user/${p.userId}`)}
                        >
                          Relatório
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </main>

      <ModalDeAnalise
        aberto={modalDeAnalise}
        onOpenChange={setModalDeAnalise}
        dados={dados as any}
        onGerar={gerarAnalise}
        gerando={gerandoAnalise}
      />

      <ToastAlert
        open={!!aviso}
        onOpenChange={(aberto) => !aberto && setAviso(null)}
        message={aviso || ''}
        type="error"
      />
    </div>
  )
}

function Cartao({
  rotulo,
  valor,
  nota,
  icone: Icone,
  cor,
}: {
  rotulo: string
  valor: string
  nota: string
  icone: typeof Users
  cor?: 'emerald' | 'blue'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        cor === 'emerald'
          ? 'border-emerald-500/25 bg-emerald-500/5'
          : cor === 'blue'
            ? 'border-blue-500/25 bg-blue-500/5'
            : 'border-border/50 bg-muted/30',
      )}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icone className="h-3 w-3" />
        {rotulo}
      </p>
      <p className="mt-1 text-2xl font-black leading-none tabular-nums">{valor}</p>
      <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{nota}</p>
    </div>
  )
}

function MiniNumero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{rotulo}</p>
      <p className="text-sm font-bold tabular-nums">{valor}</p>
    </div>
  )
}
