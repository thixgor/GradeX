'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { Barcode } from '@/components/barcode'
import { ExamBrandFooter, ExamBrandHeader } from '@/components/exam/exam-brand-header'
import { Exam, ExamSubmission, TRIResult } from '@/lib/types'
import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  ClipboardList,
  Download,
  EyeOff,
  FileCheck2,
  FileText,
  ListChecks,
  Lock,
  Medal,
  Search,
  Trophy,
  Users,
} from 'lucide-react'
import { resolverDownloadsDaProva } from '@/lib/provas/downloads-da-prova'
import { FAIXAS_DE_NOTA, type EstatisticasDaTurma } from '@/lib/provas/classificacao'
import { cn } from '@/lib/utils'

/**
 * Os resultados de uma prova, depois que ela termina.
 *
 * ## O beco
 *
 * A tela da prova mandava o ALUNO para cá assim que a prova encerrava. A rota
 * de dados por trás era exclusiva de admin: ele chegava, recebia "Apenas
 * administradores podem ver os resultados" num `alert()` do navegador e era
 * jogado para a página inicial. A área de resultados, para quem fez a prova,
 * era um beco com um alerta no fim.
 *
 * Agora quem participou vê o resultado da prova que fez (a API libera depois do
 * término — ver `app/api/exams/[id]/results/route.ts`), e a tela é montada em
 * torno da pergunta que essa pessoa realmente tem: **onde eu fiquei?**
 *
 * ## As decisões de leitura
 *
 * - **A sua linha vem primeiro**, destacada, antes da lista. O ranking era
 *   ordenado por nome, então encontrar-se nele numa turma de 80 exigia rolar
 *   procurando o próprio nome.
 * - **A distribuição antes da lista.** Saber que a média foi 62 e que você
 *   tirou 71 diz mais, e mais rápido, do que oitenta linhas de nome e nota.
 * - **Ordenação por nota, com busca.** A lista alfabética servia à chamada, não
 *   ao resultado.
 *
 * ## A marca, e os quatro documentos
 *
 * A tela não tinha logo, nome nem endereço da plataforma — e ela é a mais
 * compartilhada da prova (é dela que sai o print para o grupo da turma). Passa
 * a ter cabeçalho e rodapé de marca, como a tela de entrada e a sala de espera.
 *
 * E os downloads: havia UM botão, "Gabarito oficial". As liberações por prova
 * são três (`freeDownloads`: prova, relatório, gabarito) e produzem quatro
 * arquivos diferentes — o admin liberava a resposta comentada e ela não
 * aparecia em lugar nenhum, porque o botão dela não existia. Agora a seção
 * lista os quatro, cada um com o motivo da recusa quando é o caso, em vez de
 * simplesmente não existir.
 */

interface NormalResult {
  userId: string
  userName: string
  score: number
}

type Linha = { userId: string; userName: string; nota: number }

type Arquivo = 'prova' | 'gabarito' | 'comentado' | 'meu' | 'folha' | 'folhaComparada'

export default function ExamResultsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [scoringMethod, setScoringMethod] = useState<'tri' | 'normal'>('normal')
  const [mostrarClassificacao, setMostrarClassificacao] = useState(true)
  const [estatisticas, setEstatisticas] = useState<EstatisticasDaTurma | null>(null)
  const [minhaNota, setMinhaNota] = useState<number | null>(null)
  const [minhaColocacao, setMinhaColocacao] = useState<{ posicao: number; percentil: number } | null>(null)
  const [notaMaximaServidor, setNotaMaximaServidor] = useState<number | null>(null)
  const [minhaEntrega, setMinhaEntrega] = useState<ExamSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [conta, setConta] = useState<{ id?: string; role?: string; accountType?: string }>({})
  const [busca, setBusca] = useState('')
  const [gerando, setGerando] = useState<Arquivo | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const avisar = useCallback((mensagem: string) => {
    setToastMessage(mensagem)
    setToastOpen(true)
  }, [])

  useEffect(() => {
    async function carregar() {
      try {
        const [resExam, resMe] = await Promise.all([
          fetch(`/api/exams/${id}?ordem=original`),
          fetch('/api/auth/me'),
        ])

        const dadosExam = await resExam.json()
        if (!resExam.ok) throw new Error(dadosExam.error)
        setExam(dadosExam.exam)

        let meuId: string | undefined
        if (resMe.ok) {
          const dadosMe = await resMe.json()
          meuId = dadosMe.user?._id || dadosMe.user?.id
          setConta({
            id: meuId,
            role: dadosMe.user?.role,
            accountType: dadosMe.user?.accountType,
          })
        }

        const resResultados = await fetch(`/api/exams/${id}/results`)
        const dados = await resResultados.json()
        if (!resResultados.ok) {
          // Uma recusa aqui não é um erro fatal: é uma prova que ainda não
          // terminou, ou alguém que não participou dela. A tela conta isso em
          // vez de despejar a pessoa na home.
          setErro(dados.error || 'Resultados indisponíveis.')
          return
        }

        setScoringMethod(dados.scoringMethod)
        setMostrarClassificacao(dados.mostrarClassificacao !== false)
        setEstatisticas(dados.estatisticas ?? null)
        setMinhaNota(typeof dados.minhaNota === 'number' ? dados.minhaNota : null)
        setMinhaColocacao(dados.minhaPosicao ?? null)
        setNotaMaximaServidor(typeof dados.notaMaxima === 'number' ? dados.notaMaxima : null)
        setLinhas(
          (dados.results || []).map((r: TRIResult | NormalResult) => ({
            userId: r.userId,
            userName: r.userName,
            nota: dados.scoringMethod === 'tri' ? (r as TRIResult).triScore : (r as NormalResult).score,
          })),
        )

        /*
         * A própria entrega, para o PDF "minhas respostas corrigidas".
         *
         * Falha em silêncio de propósito: quem é admin e não fez a prova não
         * tem entrega nenhuma, e isso não é um erro — apenas um botão a menos.
         */
        if (meuId) {
          const resEntrega = await fetch(`/api/exams/${id}/submissions/${meuId}`)
          if (resEntrega.ok) {
            const dadosEntrega = await resEntrega.json()
            setMinhaEntrega(dadosEntrega.submission || null)
          }
        }
      } catch (error: any) {
        setErro(error.message || 'Não foi possível carregar os resultados.')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id])

  const notaMaxima = notaMaximaServidor ?? (scoringMethod === 'tri' ? 1000 : exam?.totalPoints || 100)

  const downloads = useMemo(
    () =>
      resolverDownloadsDaProva(exam, {
        accountType: conta.accountType,
        isAdmin: conta.role === 'admin',
        jaEnviou: !!minhaEntrega,
      }),
    [exam, conta, minhaEntrega],
  )

  const ordenadas = useMemo(() => [...linhas].sort((a, b) => b.nota - a.nota), [linhas])

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return ordenadas
    return ordenadas.filter((l) => l.userName.toLowerCase().includes(termo))
  }, [ordenadas, busca])

  /** Em qual faixa da distribuição a minha nota caiu — para pintar a barra. */
  const minhaFaixa = useMemo(() => {
    if (minhaNota === null || notaMaxima <= 0) return -1
    const pct = (minhaNota / notaMaxima) * 100
    return FAIXAS_DE_NOTA.findIndex((f) => pct >= f.min && pct < f.max)
  }, [minhaNota, notaMaxima])

  /**
   * Um download, com o veredito e o gerador que ele usa.
   *
   * Os quatro passam por aqui para que a recusa seja sempre contada da mesma
   * forma: um botão que some não explica nada, e um que abre um PDF proibido
   * explica menos ainda.
   */
  async function baixar(arquivo: Arquivo) {
    if (!exam || gerando) return

    /*
     * A folha de respostas segue a ENTREGA (é só o que a pessoa marcou); a
     * folha comparada mostra o gabarito ao lado, então segue a regra do
     * gabarito — depois do término, e sem exceção.
     */
    const veredito =
      arquivo === 'prova'
        ? downloads.prova
        : arquivo === 'meu'
          ? downloads.relatorio
          : arquivo === 'folha'
            ? downloads.compacto
            : downloads.gabarito

    if (!veredito.permitido) {
      avisar(veredito.motivo || 'Download não disponível.')
      return
    }
    if ((arquivo === 'meu' || arquivo === 'folha' || arquivo === 'folhaComparada') && !minhaEntrega) {
      avisar('Não encontramos a sua entrega desta prova.')
      return
    }

    const nomeBase = exam.title.replace(/\s+/g, '-')

    try {
      setGerando(arquivo)

      if (arquivo === 'meu') {
        const gerador = await import('@/lib/user-report-generator')
        await gerador.generateUserReportWithGabaritoPDF({
          exam,
          examId: id,
          userName: minhaEntrega!.userName,
          signature: minhaEntrega!.signature || '',
          answers: minhaEntrega!.answers || [],
          submittedAt: minhaEntrega!.submittedAt,
          score: typeof minhaEntrega!.score === 'number' ? minhaEntrega!.score : null,
        })
        return
      }

      const {
        generateExamPDF,
        generateGabaritoPDF,
        generateExamWithAnswersPDF,
        generateCompactAnswersPDF,
        downloadPDF,
      } = await import('@/lib/pdf-generator')

      const receita = {
        prova: {
          blob: () => generateExamPDF(exam, conta.id),
          nome: `prova-${nomeBase}.pdf`,
          tipo: 'exam_pdf' as const,
        },
        gabarito: {
          blob: () => generateGabaritoPDF(exam),
          nome: `gabarito-${nomeBase}.pdf`,
          tipo: 'gabarito_pdf' as const,
        },
        comentado: {
          blob: () => generateExamWithAnswersPDF(exam),
          nome: `gabarito-comentado-${nomeBase}.pdf`,
          tipo: 'exam_answers_pdf' as const,
        },
        folha: {
          blob: () =>
            generateCompactAnswersPDF(exam, minhaEntrega!.answers || [], minhaEntrega!.userName),
          nome: `folha-de-respostas-${nomeBase}.pdf`,
          tipo: 'exam_answers_pdf' as const,
        },
        folhaComparada: {
          blob: () =>
            generateCompactAnswersPDF(exam, minhaEntrega!.answers || [], minhaEntrega!.userName, {
              comparar: true,
            }),
          nome: `folha-de-respostas-comparada-${nomeBase}.pdf`,
          tipo: 'exam_answers_pdf' as const,
        },
      }[arquivo]

      const blob = await receita.blob()
      downloadPDF(blob, receita.nome, {
        type: receita.tipo,
        resourceId: exam._id?.toString() || id,
        resourceTitle: exam.title,
      })
    } catch (error: any) {
      avisar('Erro ao gerar o PDF: ' + error.message)
    } finally {
      setGerando(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Carregando resultados…
        </div>
      </div>
    )
  }

  if (erro || !exam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-bold">Resultados indisponíveis</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {erro || 'Não encontramos esta prova.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/provas')} className="rounded-xl">
            Ver minhas provas
          </Button>
          {conta.id && (
            <Button onClick={() => router.push(`/exam/${id}/user/${conta.id}`)} className="rounded-xl">
              Meu resumo
            </Button>
          )}
        </div>
        <ExamBrandFooter className="mt-4" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/provas')} aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {/* A marca no lugar do "Resultados" genérico; o título da prova
                vira a segunda linha, que é a informação que muda de página
                para página. */}
            <ExamBrandHeader durante className="min-w-0" />
          </div>
          <ThemeToggle />
        </div>
        <div className="container mx-auto border-t border-border/40 px-4 py-2">
          <p className="truncate text-xs text-muted-foreground">
            Resultados · <span className="font-medium text-foreground">{exam.title}</span>
          </p>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
        {/* ── Onde eu fiquei ───────────────────────────────────────── */}
        {minhaNota !== null && (
          <section
            className="exam-resultado-entra exam-aurora relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-[linear-gradient(120deg,rgba(70,129,82,0.16),transparent_45%,rgba(226,164,62,0.16))] p-6 shadow-lg"
            style={{ '--exam-ordem': 0 } as React.CSSProperties}
          >
            <div className="flex flex-wrap items-center gap-5">
              {minhaColocacao ? (
                <div className="exam-selo-estoura flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                  <span className="text-2xl font-black leading-none tabular-nums">
                    {minhaColocacao.posicao}º
                  </span>
                  <span className="text-[10px] font-medium opacity-90">lugar</span>
                </div>
              ) : (
                /* Sem classificação não há colocação para mostrar — o anel de
                   nota ocupa o lugar dela e responde a mesma pergunta sem
                   comparar a pessoa com ninguém. */
                <div
                  className="exam-anel-de-nota flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full"
                  style={
                    {
                      '--exam-nota': notaMaxima > 0 ? (minhaNota / notaMaxima) * 100 : 0,
                      '--exam-anel-cor': '#468152',
                    } as React.CSSProperties
                  }
                >
                  <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-background text-sm font-black tabular-nums">
                    {notaMaxima > 0 ? Math.round((minhaNota / notaMaxima) * 100) : 0}%
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Seu resultado
                </p>
                <p className="exam-numero-sobe mt-0.5 text-3xl font-black tabular-nums">
                  {minhaNota}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/ {notaMaxima}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {minhaColocacao && estatisticas && estatisticas.participantes > 1
                    ? `Você ficou à frente de ${minhaColocacao.percentil}% da turma.`
                    : estatisticas && estatisticas.participantes > 1
                      ? `A média da turma foi ${estatisticas.media.toFixed(1)}.`
                      : 'Você é a única entrega registrada até agora.'}
                </p>
              </div>
              <Button
                onClick={() => router.push(`/exam/${id}/user/${conta.id}`)}
                className="exam-botao-chama relative overflow-hidden rounded-xl bg-gradient-to-r from-[#468152] to-[#3a6d44] font-semibold text-white hover:from-[#3a6d44] hover:to-[#2f5a38]"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Quero ver meu resumo
              </Button>
            </div>
          </section>
        )}

        {/* ── A turma ──────────────────────────────────────────────── */}
        {estatisticas && (
          <section
            className="exam-resultado-entra rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur-md sm:p-6"
            style={{ '--exam-ordem': 1 } as React.CSSProperties}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Como foi a turma
            </h2>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Numero icone={Users} rotulo="Participantes" valor={String(estatisticas.participantes)} ordem={0} />
              <Numero rotulo="Média" valor={estatisticas.media.toFixed(1)} ordem={1} />
              <Numero icone={Trophy} rotulo="Maior nota" valor={String(estatisticas.maior)} destaque ordem={2} />
              <Numero rotulo="Menor nota" valor={String(estatisticas.menor)} ordem={3} />
            </div>

            {/*
              A distribuição em barras. Uma média sozinha esconde a forma da
              turma: 62 pode ser "todo mundo perto de 62" ou "metade em 30 e
              metade em 90", e essas duas provas pedem conversas diferentes.
            */}
            <div className="space-y-2">
              {estatisticas.distribuicao.map((faixa, i) => {
                const proporcao = (faixa.quantidade / Math.max(1, estatisticas.participantes)) * 100
                const ehMinhaFaixa = i === minhaFaixa
                return (
                  <div key={faixa.rotulo} className="flex items-center gap-3">
                    <span className="w-16 flex-shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                      {faixa.rotulo}
                    </span>
                    <div className="h-6 flex-1 overflow-hidden rounded-lg bg-muted">
                      <div
                        className={cn(
                          'exam-retomada-barra h-full rounded-lg transition-all',
                          ehMinhaFaixa ? 'bg-emerald-500' : 'bg-slate-400/60 dark:bg-slate-500/60',
                        )}
                        style={{
                          width: `${Math.max(proporcao, faixa.quantidade > 0 ? 4 : 0)}%`,
                          animationDelay: `${0.2 + i * 0.07}s`,
                        }}
                      />
                    </div>
                    <span className="w-8 flex-shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {faixa.quantidade}
                    </span>
                  </div>
                )
              })}
              {minhaFaixa >= 0 && (
                <p className="pt-1 text-[11px] text-muted-foreground">
                  <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500 align-middle" />
                  A faixa em verde é a sua.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── Classificação ────────────────────────────────────────── */}
        <section
          className="exam-resultado-entra rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur-md sm:p-6"
          style={{ '--exam-ordem': 2 } as React.CSSProperties}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Medal className="h-4 w-4 text-muted-foreground" />
              {scoringMethod === 'tri' ? 'Classificação (TRI)' : 'Classificação'}
            </h2>
            {mostrarClassificacao && ordenadas.length > 6 && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar nome"
                  className="h-9 w-44 rounded-xl border border-border bg-background pl-8 pr-3 text-sm outline-none transition-colors focus:border-emerald-500/60"
                />
              </div>
            )}
          </div>

          {!mostrarClassificacao ? (
            /*
              A classificação desligada pelo admin. A tela diz o que aconteceu
              em vez de simplesmente não desenhar a seção: uma turma que viu a
              lista na prova passada e não vê nesta merece saber que foi uma
              decisão, não um defeito.
            */
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <EyeOff className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold">A classificação desta prova não é pública</p>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                O professor optou por não divulgar a lista de notas. Sua nota e o desempenho geral da
                turma continuam acima.
              </p>
            </div>
          ) : ordenadas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma entrega registrada nesta prova.
            </p>
          ) : filtradas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum nome encontrado.</p>
          ) : (
            <ol className="space-y-1.5">
              {filtradas.map((linha, i) => {
                const posicao = ordenadas.filter((l) => l.nota > linha.nota).length + 1
                const souEu = linha.userId === conta.id
                const podeAbrir = conta.role === 'admin' || souEu
                const proporcao = notaMaxima > 0 ? (linha.nota / notaMaxima) * 100 : 0

                return (
                  <li
                    key={linha.userId}
                    className={cn(
                      'exam-resultado-entra relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 transition-colors',
                      souEu ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border/50 hover:bg-muted/40',
                    )}
                    // A cascata para de contar depois da décima linha: numa
                    // turma de 80, atrasar a última em 7 segundos é fazer a
                    // pessoa esperar a lista aparecer.
                    style={{ '--exam-ordem': Math.min(i, 10) + 2 } as React.CSSProperties}
                  >
                    {/* A barra de fundo dá a nota sem exigir a leitura do número. */}
                    <span
                      className={cn(
                        'absolute inset-y-0 left-0 -z-10',
                        souEu ? 'bg-emerald-500/10' : 'bg-muted/50',
                      )}
                      style={{ width: `${proporcao}%` }}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        'w-7 flex-shrink-0 text-center text-sm font-bold tabular-nums',
                        posicao === 1 ? 'text-amber-500' : 'text-muted-foreground',
                      )}
                    >
                      {posicao}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {linha.userName}
                      {souEu && (
                        <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          você
                        </span>
                      )}
                    </span>
                    <span className="flex-shrink-0 text-sm font-bold tabular-nums">
                      {linha.nota}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">/{notaMaxima}</span>
                    </span>
                    {podeAbrir && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 flex-shrink-0 rounded-lg text-xs"
                        onClick={() => router.push(`/exam/${id}/user/${linha.userId}`)}
                      >
                        Resumo
                      </Button>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        {/* ── Documentos ───────────────────────────────────────────── */}
        <section
          className="exam-resultado-entra rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur-md"
          style={{ '--exam-ordem': 3 } as React.CSSProperties}
        >
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
            <Download className="h-4 w-4 text-muted-foreground" />
            Documentos da prova
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Os PDFs que esta prova produz. O que estiver indisponível diz o porquê.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <CartaoDeDownload
              icone={FileText}
              titulo="Prova em branco"
              descricao="Enunciados e alternativas, sem gabarito. Para imprimir e refazer no papel."
              veredito={downloads.prova}
              gerando={gerando === 'prova'}
              ocupado={!!gerando}
              onBaixar={() => baixar('prova')}
            />
            <CartaoDeDownload
              icone={ListChecks}
              titulo="Gabarito oficial"
              descricao="A folha de respostas certas, questão a questão."
              veredito={downloads.gabarito}
              gerando={gerando === 'gabarito'}
              ocupado={!!gerando}
              onBaixar={() => baixar('gabarito')}
            />
            <CartaoDeDownload
              icone={BookOpenCheck}
              titulo="Gabarito comentado"
              descricao="Cada questão com a alternativa correta e a explicação dela."
              veredito={downloads.gabarito}
              gerando={gerando === 'comentado'}
              ocupado={!!gerando}
              onBaixar={() => baixar('comentado')}
            />
            <CartaoDeDownload
              icone={FileCheck2}
              titulo="Minhas respostas corrigidas"
              descricao="A sua prova com o que você marcou, o que era certo e a sua nota."
              veredito={
                minhaEntrega
                  ? downloads.relatorio
                  : { permitido: false, motivo: 'Você não tem uma entrega registrada nesta prova.', esperandoOFim: false }
              }
              gerando={gerando === 'meu'}
              ocupado={!!gerando}
              onBaixar={() => baixar('meu')}
            />
            {/*
              As duas folhas de respostas.

              A simples é uma página com as letras que você marcou — o que se
              confere com os colegas na saída. Ela não tem enunciado nem
              gabarito, e por isso sai assim que você entrega, sem esperar a
              turma terminar. A comparada põe o gabarito ao lado, então segue a
              regra do gabarito.
            */}
            <CartaoDeDownload
              icone={ClipboardList}
              titulo="Folha de respostas"
              descricao="Uma página com as letras que você marcou, questão a questão. Sem enunciado e sem gabarito."
              veredito={
                minhaEntrega
                  ? downloads.compacto
                  : { permitido: false, motivo: 'Você não tem uma entrega registrada nesta prova.', esperandoOFim: false }
              }
              gerando={gerando === 'folha'}
              ocupado={!!gerando}
              onBaixar={() => baixar('folha')}
            />
            <CartaoDeDownload
              icone={ClipboardCheck}
              titulo="Folha de respostas comparada"
              descricao="As suas letras ao lado do gabarito, com o acerto marcado e a contagem."
              veredito={
                minhaEntrega
                  ? downloads.gabarito
                  : { permitido: false, motivo: 'Você não tem uma entrega registrada nesta prova.', esperandoOFim: false }
              }
              gerando={gerando === 'folhaComparada'}
              ocupado={!!gerando}
              onBaixar={() => baixar('folhaComparada')}
            />
          </div>

          {exam.pdfUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(exam.pdfUrl, '_blank')}
              className="mt-3 w-full rounded-xl sm:w-auto"
            >
              <FileText className="mr-2 h-4 w-4" />
              PDF original enviado pelo professor
            </Button>
          )}
        </section>

        <section className="rounded-2xl border border-border/60 bg-background/60 p-5 text-center backdrop-blur-md">
          <Barcode value={id} height={48} fontSize={12} />
          <p className="mt-2 text-[11px] text-muted-foreground">Código da prova: {id}</p>
        </section>

        <ExamBrandFooter />
      </main>

      <ToastAlert open={toastOpen} onOpenChange={setToastOpen} message={toastMessage} type="info" />
    </div>
  )
}

function Numero({
  icone: Icone,
  rotulo,
  valor,
  destaque,
  ordem = 0,
}: {
  icone?: typeof Users
  rotulo: string
  valor: string
  destaque?: boolean
  ordem?: number
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 text-center',
        destaque ? 'border-amber-500/30 bg-amber-500/10' : 'border-border/50 bg-muted/30',
      )}
    >
      <p className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icone && <Icone className="h-3 w-3" />}
        {rotulo}
      </p>
      <p
        className="exam-numero-sobe mt-1 text-2xl font-black tabular-nums"
        style={{ animationDelay: `${0.35 + ordem * 0.08}s` }}
      >
        {valor}
      </p>
    </div>
  )
}

/**
 * Um documento e o motivo de ele não estar disponível.
 *
 * O botão indisponível continua na tela, desligado e com a explicação embaixo.
 * Sumir seria mais limpo e pior: o aluno que ouviu do professor "liberei o
 * gabarito comentado" precisa ver o arquivo existir para entender que o que
 * falta é o plano dele, não o arquivo.
 */
function CartaoDeDownload({
  icone: Icone,
  titulo,
  descricao,
  veredito,
  gerando,
  ocupado,
  onBaixar,
}: {
  icone: typeof FileText
  titulo: string
  descricao: string
  veredito: { permitido: boolean; motivo: string | null; esperandoOFim: boolean }
  gerando: boolean
  ocupado: boolean
  onBaixar: () => void
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border p-4 transition-colors',
        veredito.permitido ? 'border-border/60 bg-muted/20 hover:border-emerald-500/40' : 'border-border/40 bg-muted/10',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
            veredito.permitido
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Icone className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{titulo}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{descricao}</p>
        </div>
      </div>

      <Button
        onClick={onBaixar}
        disabled={ocupado || !veredito.permitido}
        variant={veredito.permitido ? 'default' : 'outline'}
        size="sm"
        className="mt-3 w-full rounded-lg"
        title={veredito.motivo || undefined}
      >
        {gerando ? (
          <>
            <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Gerando…
          </>
        ) : (
          <>
            <Download className="mr-2 h-3.5 w-3.5" />
            {veredito.permitido ? 'Baixar PDF' : 'Indisponível'}
          </>
        )}
      </Button>

      {!veredito.permitido && veredito.motivo && (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{veredito.motivo}</p>
      )}
    </div>
  )
}
